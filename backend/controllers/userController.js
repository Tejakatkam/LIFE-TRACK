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

    const prompt = `You are a fitness AI. Based on this user profile: Weight: ${user.weight || 70}kg, Height: ${user.height || 170}cm, Age: ${user.age || 25}, Gender: ${user.gender || 'other'}, Goal: ${user.goal || 'maintain'}. Calculate the recommended daily calorie intake. Return ONLY a valid JSON object matching exactly this structure: {"dailyCalories": 2000, "goal": "${user.goal || 'maintain'}", "explanation": "Short 1 sentence explanation."}`;

    const text = await callGemini(apiKey, prompt, true);

    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (e) {
      // If AI returned text with markdown code fences
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
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


