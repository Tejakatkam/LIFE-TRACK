const db = require("../config/db");

exports.addWeight = async (req, res) => {
  const { weight, frequency, record_date } = req.body;
  const userId = req.user.id;

  if (!weight || !frequency || !record_date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO weight_records (user_id, weight, frequency, record_date)
    VALUES (?, ?, ?, ?)
  `;

  try {
    await db.query(sql, [userId, weight, frequency, record_date]);
    res.status(201).json({ message: "Weight record added successfully" });
  } catch (err) {
    console.error("Error adding weight:", err);
    res.status(500).json({ message: "Failed to add weight record" });
  }
};

exports.getWeightHistory = async (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT id, weight, frequency, record_date, created_at 
    FROM weight_records 
    WHERE user_id = ? 
    ORDER BY record_date ASC
  `;

  try {
    const [results] = await db.query(sql, [userId]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching weight history:", err);
    res.status(500).json({ message: "Failed to fetch weight history" });
  }
};

