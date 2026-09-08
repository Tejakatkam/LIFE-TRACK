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

const callGemini = async (apiKey, prompt, isJson = false) => {
  const cleanKey = String(apiKey || "").trim().replace(/^["']|["']$/g, "");
  if (!cleanKey) throw new Error("Empty Gemini API Key");

  // Step 1: Query Google to see exactly which models this API key has access to
  let availableModelNames = [];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      if (Array.isArray(listData?.models)) {
        availableModelNames = listData.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map(m => m.name.replace(/^models\//, ""));
      }
    } else {
      const errBody = await listRes.json().catch(() => ({}));
      console.log(`[Gemini AI Notice] Google Model List response: ${listRes.status} - ${errBody?.error?.message || "Check API Key permissions"}`);
    }
  } catch (e) {
    console.log("[Gemini AI Notice] Could not list models:", e.message);
  }

  // Combine discovered models with candidate defaults
  const modelsToTry = [
    ...availableModelNames,
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro"
  ];
  const uniqueModels = [...new Set(modelsToTry)];

  const genAI = new GoogleGenerativeAI(cleanKey);
  let lastError = null;

  // Step 2: Try via official SDK
  for (const modelName of uniqueModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: isJson ? { responseMimeType: "application/json" } : undefined,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) return text.trim();
    } catch (e) {
      lastError = e;
    }
  }

  // Step 3: Direct REST fallback across v1beta & v1
  for (const apiVersion of ["v1beta", "v1"]) {
    for (const modelName of uniqueModels) {
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
          if (candidateText) return candidateText.trim();
        }
      } catch (restErr) {
        lastError = restErr;
      }
    }
  }

  throw lastError || new Error("Failed to generate content using Gemini API");
};

exports.getCalorieRecommendation = async (req, res) => {
  let fallbackCalories = 2000;
  let user = null;

  try {
    const userId = req.user.id;
    const [rows] = await db.query("SELECT age, weight, height, gender, goal FROM users WHERE id = ?", [userId]);
    
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    user = rows[0];

    // Fallback deterministic calculation if Gemini fails or is missing
    if (user.weight && user.height && user.age) {
      // Mifflin-St Jeor Equation
      let bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age;
      bmr += (user.gender === "male") ? 5 : -161;
      let tdee = bmr * 1.2; // Sedentary multiplier
      
      if (user.goal === "loss") fallbackCalories = Math.round(tdee - 500);
      else if (user.goal === "gain") fallbackCalories = Math.round(tdee + 500);
      else fallbackCalories = Math.round(tdee);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
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

    const text = await callGemini(apiKey, prompt, true);

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ description: "Build a consistent routine." });
    }

    const prompt = `Write a short, motivating description for a daily habit called "${habitName}". Max 10 words. No quotes. Just the description.`;
    const text = await callGemini(apiKey, prompt, false);

    return res.json({ description: text });
  } catch (err) {
    console.error("Gemini AI habit error:", err.message);
    return res.json({ description: "Build a consistent routine." });
  }
};

exports.estimateFoodCalories = async (req, res) => {
  try {
    const { query, grams } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Food description is required" });
    }

    const foodName = query.trim();
    const portionContext = grams && String(grams).trim() ? String(grams).trim() : "standard serving";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        name: foodName,
        calories: 250,
        portion: portionContext,
        macros: "",
        explanation: "Approximate estimate based on standard portion.",
        fallback: true
      });
    }

    const prompt = `You are an expert clinical dietitian and nutritional database AI.
User ate: "${foodName}"
Portion / Grams specified: "${portionContext}"

Analyze the food item and exact weight/portion size. Estimate the approximate total calories and macronutrient profile.
Respond ONLY with a JSON object in this exact schema, without any conversational preamble or markdown:
{
  "name": "Concise food title e.g. Paneer Butter Masala",
  "portion": "${portionContext}",
  "calories": 320,
  "protein": "12g",
  "carbs": "14g",
  "fat": "22g",
  "explanation": "Short 1-sentence nutritional breakdown referencing the portion/grams."
}`;

    const text = await callGemini(apiKey, prompt, true);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.calories) {
          return res.json({
            name: parsed.name || foodName,
            portion: parsed.portion || portionContext,
            calories: Math.round(Number(parsed.calories)),
            protein: parsed.protein || "",
            carbs: parsed.carbs || "",
            fat: parsed.fat || "",
            explanation: parsed.explanation || "AI-estimated nutritional value.",
            fallback: false
          });
        }
      }

      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json({
        name: parsed.name || foodName,
        portion: parsed.portion || portionContext,
        calories: Math.round(Number(parsed.calories || 250)),
        protein: parsed.protein || "",
        carbs: parsed.carbs || "",
        fat: parsed.fat || "",
        explanation: parsed.explanation || "AI-estimated nutritional value.",
        fallback: false
      });
    } catch (parseErr) {
      console.error("estimateFoodCalories parse error:", parseErr.message, "Raw:", text);
      return res.json({
        name: foodName,
        calories: 250,
        portion: portionContext,
        macros: "",
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
      macros: "",
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
    const [rows] = await db.query("SELECT weight, gender FROM users WHERE id = ?", [userId]).catch(() => [[]]);
    const user = rows[0] || {};
    const weightKg = Number(user.weight) || 70;
    const gender = user.gender || "male";
    const durMins = Math.max(1, Number(duration) || 30);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Heuristic fallback MET calculation based on activity
      let met = 5.0;
      const lower = activityName.toLowerCase();
      if (lower.includes("run") || lower.includes("jog")) met = 8.5;
      else if (lower.includes("walk")) met = 3.8;
      else if (lower.includes("cycl") || lower.includes("bike")) met = 7.0;
      else if (lower.includes("swim")) met = 7.0;
      else if (lower.includes("hiit")) met = 8.0;
      else if (lower.includes("yoga")) met = 3.0;

      const approxBurn = Math.round((met * 3.5 * weightKg / 200) * durMins);
      return res.json({
        workoutName: activityName,
        duration: durMins,
        caloriesBurned: approxBurn,
        intensity: met >= 7 ? "High" : met >= 4.5 ? "Moderate" : "Light",
        explanation: `Estimated ~${approxBurn} kcal based on MET formulas for ${weightKg}kg over ${durMins} mins.`,
        fallback: true
      });
    }

    const prompt = `You are an expert exercise physiologist AI.
User Profile: Weight: ${weightKg} kg, Biological Sex: ${gender}.
Activity Type: ${type}
Workout Routine / Description: "${activityName}"
Duration: ${durMins} minutes.

Calculate the estimated active calories burned for this individual during this workout based on physiological MET principles.
Respond ONLY with a JSON object in this exact schema, without any conversational preamble or markdown:
{
  "workoutName": "${activityName}",
  "duration": ${durMins},
  "caloriesBurned": 240,
  "intensity": "Moderate / High / Low",
  "explanation": "Short 1-sentence physiological explanation referencing MET and caloric burn rate."
}`;

    const text = await callGemini(apiKey, prompt, true);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.caloriesBurned) {
          return res.json({
            workoutName: parsed.workoutName || activityName,
            duration: Number(parsed.duration || durMins),
            caloriesBurned: Math.round(Number(parsed.caloriesBurned)),
            intensity: parsed.intensity || "Moderate",
            explanation: parsed.explanation || `Estimated burn based on ${durMins} mins activity.`,
            fallback: false
          });
        }
      }

      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json({
        workoutName: parsed.workoutName || activityName,
        duration: Number(parsed.duration || durMins),
        caloriesBurned: Math.round(Number(parsed.caloriesBurned || 150)),
        intensity: parsed.intensity || "Moderate",
        explanation: parsed.explanation || "AI-estimated caloric expenditure.",
        fallback: false
      });
    } catch (parseErr) {
      console.error("estimateWorkoutCalories parse error:", parseErr.message, "Raw:", text);
      const approxBurn = Math.round((5.5 * 3.5 * weightKg / 200) * durMins);
      return res.json({
        workoutName: activityName,
        duration: durMins,
        caloriesBurned: approxBurn,
        intensity: "Moderate",
        explanation: `Estimated ~${approxBurn} kcal based on MET formulas.`,
        fallback: true
      });
    }
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


