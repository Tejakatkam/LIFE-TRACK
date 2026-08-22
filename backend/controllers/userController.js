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

exports.getCalorieRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query("SELECT age, weight, height, gender, goal FROM users WHERE id = ?", [userId]);
    
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    const user = rows[0];

    // Fallback deterministic calculation if Gemini fails or is missing
    let fallbackCalories = 2000;
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

    const prompt = `You are a fitness AI. Based on this user profile: Weight: ${user.weight}kg, Height: ${user.height}cm, Age: ${user.age}, Gender: ${user.gender}, Goal: ${user.goal}. Calculate the recommended daily calorie intake. Return ONLY a valid JSON object matching exactly this structure: {"dailyCalories": 2000, "goal": "${user.goal}", "explanation": "Short 1 sentence explanation."}`;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await aiRes.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (e) {
      throw new Error("Failed to parse Gemini response");
    }
  } catch (err) {
    console.error("Gemini AI error:", err.message);
    res.json({
      dailyCalories: fallbackCalories,
      goal: user?.goal || "maintain",
      explanation: "Generated using standard formula (AI service unavailable).",
      fallback: true
    });
  }
};


