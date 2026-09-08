const db = require("../config/db");

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { age, weight, height, gender, goal, email, phone } = req.body;

    await db.query(
      `UPDATE users 
       SET age = ?, weight = ?, height = ?, gender = ?, goal = ?, email = ?, phone = ?
       WHERE id = ?`,
      [age, weight, height, gender, goal, email, phone, userId],
    );

    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

let cachedGroqModel = null;
let cachedGeminiModel = null;

const callGroq = async (apiKey, prompt, isJson = false) => {
  const cleanKey = String(apiKey || "").trim().replace(/^["']|["']$/g, "");
  if (!cleanKey) throw new Error("Empty Groq API Key");

  // Step 1: Discover available models if not already cached
  let modelsToTry = cachedGroqModel ? [cachedGroqModel] : [];

  if (modelsToTry.length === 0) {
    try {
      const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${cleanKey}` }
      });
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        if (Array.isArray(data?.data)) {
          const activeIds = data.data
            .map(m => m.id)
            .filter(id => !id.includes("whisper") && !id.includes("guard"));
          // Sort to prioritize highest-quality / fastest models
          activeIds.sort((a, b) => {
            const score = id => (id.includes("70b") ? 6 : id.includes("8b") ? 5 : id.includes("llama") ? 4 : id.includes("mixtral") ? 3 : 1);
            return score(b) - score(a);
          });
          modelsToTry.push(...activeIds);
        }
      }
    } catch (discoveryErr) {
      console.warn("[Groq Discovery Notice]", discoveryErr.message);
    }
  }

  const fallbackCandidates = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "llama-3.2-3b-preview",
    "llama-3.2-1b-preview",
    "deepseek-r1-distill-llama-70b"
  ];
  modelsToTry = [...new Set([...modelsToTry, ...fallbackCandidates])];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: isJson
                ? "You are a professional health and fitness AI assistant. Always respond in valid JSON format matching the requested schema."
                : "You are a helpful, concise health and fitness AI assistant."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: isJson ? { type: "json_object" } : undefined,
          temperature: 0.2,
          max_tokens: 1024
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          cachedGroqModel = model;
          return content.trim();
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[Groq AI ${model} Error]`, response.status, errJson?.error?.message || response.statusText);
        lastError = new Error(errJson?.error?.message || `Groq error ${response.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate content using Groq API");
};

const callGemini = async (apiKey, prompt, isJson = false) => {
  const cleanKey = String(apiKey || "").trim().replace(/^["']|["']$/g, "");
  if (!cleanKey) throw new Error("Empty Gemini API Key");

  let modelsToTry = cachedGeminiModel ? [cachedGeminiModel] : [];

  if (modelsToTry.length === 0) {
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData?.models)) {
          const activeNames = listData.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace(/^models\//, ""));
          activeNames.sort((a, b) => {
            const score = id => (id.includes("flash") ? 5 : id.includes("pro") ? 3 : 1);
            return score(b) - score(a);
          });
          modelsToTry.push(...activeNames);
        }
      }
    } catch (e) {
      console.warn("[Gemini Discovery Notice]", e.message);
    }
  }

  const fallbackGemini = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-pro"
  ];
  modelsToTry = [...new Set([...modelsToTry, ...fallbackGemini])];

  const genAI = new GoogleGenerativeAI(cleanKey);
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: isJson ? { responseMimeType: "application/json" } : undefined,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        cachedGeminiModel = modelName;
        return text.trim();
      }
    } catch (e) {
      lastError = e;
    }
  }

  // Direct REST fallback across v1beta & v1
  for (const apiVersion of ["v1beta", "v1"]) {
    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${cleanKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: isJson ? { responseMimeType: "application/json" } : undefined
          })
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            cachedGeminiModel = modelName;
            return candidateText.trim();
          }
        }
      } catch (restErr) {
        lastError = restErr;
      }
    }
  }

  throw lastError || new Error("Failed to generate content using Gemini API");
};

// Unified AI Caller: Prioritizes lightning-fast Groq with automatic Gemini fallback
const callAI = async (prompt, isJson = false) => {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (groqKey) {
    try {
      return await callGroq(groqKey, prompt, isJson);
    } catch (groqErr) {
      console.warn("[AI Notice] Groq call failed, falling back to Gemini:", groqErr.message);
    }
  }

  if (geminiKey) {
    return await callGemini(geminiKey, prompt, isJson);
  }

  throw new Error("No AI API keys configured (set GROQ_API_KEY or GEMINI_API_KEY)");
};

exports.getCalorieRecommendation = async (req, res) => {
  let fallbackCalories = 2000;
  let user = null;

  try {
    const userId = req.user.id;
    const [rows] = await db.query("SELECT age, weight, height, gender, goal FROM users WHERE id = ?", [userId]);
    
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    user = rows[0];

    // Fallback deterministic calculation if AI fails or is missing
    if (user.weight && user.height && user.age) {
      // Mifflin-St Jeor Equation
      let bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age;
      bmr += (user.gender === "male") ? 5 : -161;
      let tdee = bmr * 1.2; // Sedentary multiplier
      
      if (user.goal === "loss") fallbackCalories = Math.round(tdee - 500);
      else if (user.goal === "gain") fallbackCalories = Math.round(tdee + 500);
      else fallbackCalories = Math.round(tdee);
    }

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({
        dailyCalories: fallbackCalories,
        goal: user.goal || "maintain",
        explanation: "Generated using standard formula (no AI key found).",
        fallback: true
      });
    }

    const prompt = `You are a professional fitness and clinical nutrition AI.
User Profile:
- Weight: ${user.weight || 70} kg
- Height: ${user.height || 170} cm
- Age: ${user.age || 25} years
- Gender: ${user.gender || 'male'}
- Goal: ${user.goal || 'loss'}

Calculate the exact recommended daily caloric intake for this user.
Respond ONLY with a JSON object in this exact schema, with no preamble or commentary:
{
  "dailyCalories": 1950,
  "goal": "${user.goal || 'loss'}",
  "explanation": "Brief 1-2 sentence explanation tailored to their goal and metabolic rate."
}`;

    const text = await callAI(prompt, true);

    try {
      // 1. Try extracting the { ... } JSON block
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.dailyCalories) {
          return res.json({
            dailyCalories: Number(parsed.dailyCalories),
            goal: parsed.goal || user.goal || "maintain",
            explanation: parsed.explanation || "AI-generated personalized recommendation based on your metabolic metrics.",
            fallback: false
          });
        }
      }

      // 2. Direct clean parse
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json({
        dailyCalories: Number(parsed.dailyCalories || fallbackCalories),
        goal: parsed.goal || user.goal || "maintain",
        explanation: parsed.explanation || "AI-generated personalized recommendation.",
        fallback: false
      });
    } catch (parseErr) {
      console.error("Gemini response parse warning:", parseErr.message, "Raw response:", text);
      return res.json({
        dailyCalories: fallbackCalories,
        goal: user.goal || "maintain",
        explanation: text.length < 200 ? text : "AI-generated recommendation tailored to your metabolic rate.",
        fallback: false
      });
    }
  } catch (err) {
    console.error("Gemini AI error:", err.message);
    return res.json({
      dailyCalories: fallbackCalories,
      goal: user?.goal || "maintain",
      explanation: "Generated using standard formula (AI service unavailable).",
      fallback: true
    });
  }
};

exports.getHabitDescription = async (req, res) => {
  try {
    const { habitName } = req.body;
    if (!habitName) return res.status(400).json({ message: "Habit name is required" });

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({ description: "Build a consistent routine." });
    }

    const prompt = `Write a short, motivating description for a daily habit called "${habitName}". Max 10 words. No quotes. Just the description.`;
    const text = await callAI(prompt, false);

    return res.json({ description: text });
  } catch (err) {
    console.error("AI habit error:", err.message);
    return res.json({ description: "Build a consistent routine." });
  }
};

exports.estimateFoodCalories = async (req, res) => {
  try {
    const { query, grams, portion, amount, unit } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Food description is required" });
    }

    const foodName = query.trim();
    let portionContext = "standard serving";
    if (portion && String(portion).trim()) {
      portionContext = String(portion).trim();
    } else if (amount && unit) {
      portionContext = `${amount} ${unit}`;
    } else if (grams && String(grams).trim()) {
      portionContext = String(grams).trim();
    }

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({
        name: foodName,
        calories: 250,
        portion: portionContext,
        protein: 10,
        carbs: 30,
        fat: 8,
        fiber: 3,
        explanation: `Approximate estimate based on ${portionContext}.`,
        fallback: true
      });
    }

    const prompt = `You are an expert clinical dietitian and nutritional database AI.
User ate: "${foodName}"
Portion / Quantity specified: "${portionContext}"

Analyze the food item and exact portion size or quantity count (e.g. "2 pieces of dosa", "3 eggs", "150g rice", "1 bowl of dal"). Estimate the approximate total calories and macronutrient breakdown (protein, carbs, fats, and dietary fiber in grams).
Respond ONLY with a JSON object in this exact schema, without any conversational preamble or markdown:
{
  "name": "Concise food title e.g. Dosa",
  "portion": "${portionContext}",
  "calories": 240,
  "protein": 6,
  "carbs": 38,
  "fat": 7,
  "fiber": 2,
  "explanation": "Short 1-sentence nutritional breakdown referencing the exact quantity/portion."
}`;

    const text = await callAI(prompt, true);

    const parseNum = (val, def = 0) => {
      if (val === undefined || val === null) return def;
      const clean = String(val).replace(/[^0-9.]/g, "");
      const num = Number(clean);
      return isNaN(num) ? def : Math.round(num);
    };

    try {
      let parsed = null;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      if (parsed) {
        return res.json({
          name: parsed.name || foodName,
          portion: parsed.portion || portionContext,
          calories: parseNum(parsed.calories, 250),
          protein: parseNum(parsed.protein, 0),
          carbs: parseNum(parsed.carbs, 0),
          fat: parseNum(parsed.fat, 0),
          fiber: parseNum(parsed.fiber, 0),
          explanation: parsed.explanation || "AI-estimated nutritional values.",
          fallback: false
        });
      }
    } catch (parseErr) {
      console.error("estimateFoodCalories parse error:", parseErr.message, "Raw:", text);
      return res.json({
        name: foodName,
        calories: 250,
        portion: portionContext,
        protein: 10,
        carbs: 30,
        fat: 8,
        fiber: 3,
        explanation: "AI estimate based on portion specified.",
        fallback: true
      });
    }
  } catch (err) {
    console.error("estimateFoodCalories error:", err.message);
    return res.json({
      name: req.body?.query || "Food Item",
      calories: 250,
      portion: req.body?.grams || "1 serving",
      protein: 10,
      carbs: 30,
      fat: 8,
      fiber: 3,
      explanation: "Standard portion estimation.",
      fallback: true
    });
  }
};

exports.estimateWorkoutCalories = async (req, res) => {
  try {
    const { workout, duration = 30, type = "Self / Custom Routine" } = req.body;
    
    // If workout text is empty, fall back to the selected activity type
    const activityName = workout && workout.trim() ? workout.trim() : type;
    if (!activityName || activityName === "Self / Custom Routine") {
      if (!workout || !workout.trim()) {
        return res.status(400).json({ message: "Please select an activity type or describe your workout routine." });
      }
    }

    const userId = req.user.id;
    // Fetch all 4 physiological factors: weight, height, age, and gender
    const [rows] = await db.query("SELECT weight, height, age, gender FROM users WHERE id = ?", [userId]).catch(() => [[]]);
    const user = rows[0] || {};
    const weightKg = Number(user.weight) || 70;
    const heightCm = Number(user.height) || 170;
    const ageYrs = Number(user.age) || 25;
    const gender = user.gender || "male";
    const durMins = Math.max(1, Number(duration) || 30);

    // Physiological baseline BMR computation
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYrs + (gender === "female" ? -161 : 5);
    const bmrPerMin = Math.max(0.8, bmr / 1440);

    let met = 5.0;
    const lower = activityName.toLowerCase();
    if (lower.includes("run") || lower.includes("jog")) met = 8.5;
    else if (lower.includes("walk")) met = 3.8;
    else if (lower.includes("cycl") || lower.includes("bike")) met = 7.0;
    else if (lower.includes("swim")) met = 7.0;
    else if (lower.includes("hiit")) met = 8.0;
    else if (lower.includes("yoga")) met = 3.0;

    const fallbackBurn = Math.round(met * bmrPerMin * durMins * 1.05);

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({
        workoutName: activityName,
        duration: durMins,
        caloriesBurned: fallbackBurn,
        intensity: met >= 7 ? "High" : met >= 4.5 ? "Moderate" : "Light",
        explanation: `Estimated ~${fallbackBurn} kcal personalized for ${weightKg}kg, ${heightCm}cm, ${ageYrs}yo over ${durMins} mins.`,
        fallback: true
      });
    }

    const prompt = `You are an expert exercise physiologist AI.
User Physiological Profile:
- Weight: ${weightKg} kg
- Height: ${heightCm} cm
- Age: ${ageYrs} years old
- Biological Sex: ${gender}

Workout Details:
- Activity Type: ${type}
- Workout Description: "${activityName}"
- Duration: ${durMins} minutes

Using exercise physiology, accounting specifically for their body mass (${weightKg}kg), height (${heightCm}cm), age (${ageYrs} yrs), and biological sex (${gender}), calculate the estimated active calories burned during this session.
Respond ONLY with a JSON object in this exact schema, without any conversational preamble or markdown:
{
  "workoutName": "${activityName}",
  "duration": ${durMins},
  "caloriesBurned": 240,
  "intensity": "Moderate / High / Low",
  "explanation": "Short 1-sentence physiological explanation referencing MET and personalized metrics (weight, age, height)."
}`;

    const text = await callAI(prompt, true);

    try {
      let parsed = null;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      if (parsed && parsed.caloriesBurned) {
        return res.json({
          workoutName: parsed.workoutName || activityName,
          duration: Number(parsed.duration || durMins),
          caloriesBurned: Math.round(Number(parsed.caloriesBurned)),
          intensity: parsed.intensity || "Moderate",
          explanation: parsed.explanation || `Estimated burn personalized for ${weightKg}kg, ${heightCm}cm, ${ageYrs}yo over ${durMins} mins.`,
          fallback: false
        });
      }
    } catch (parseErr) {
      console.error("estimateWorkoutCalories parse error:", parseErr.message, "Raw:", text);
    }

    return res.json({
      workoutName: activityName,
      duration: durMins,
      caloriesBurned: fallbackBurn,
      intensity: met >= 7 ? "High" : met >= 4.5 ? "Moderate" : "Light",
      explanation: `Estimated ~${fallbackBurn} kcal based on MET formulas for ${weightKg}kg, ${heightCm}cm, ${ageYrs}yo.`,
      fallback: true
    });
  } catch (err) {
    console.error("estimateWorkoutCalories error:", err.message);
    return res.json({
      workoutName: req.body?.workout || req.body?.type || "Workout",
      duration: Number(req.body?.duration || 30),
      caloriesBurned: 180,
      intensity: "Moderate",
      explanation: "Standard activity burn estimate.",
      fallback: true
    });
  }
};


