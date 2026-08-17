const db = require("../config/db");

// GET food by date
exports.getFoodByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    const [rows] = await db.query(
      "SELECT * FROM food_logs WHERE user_id = ? AND log_date = ?",
      [userId, date],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD food
exports.addFood = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, grams, calories, log_date } = req.body;

    await db.query(
      "INSERT INTO food_logs (user_id, name, grams, calories, log_date) VALUES (?, ?, ?, ?, ?)",
      [userId, name, grams, calories, log_date],
    );

    res.json({ message: "Food added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE food
exports.deleteFood = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await db.query("DELETE FROM food_logs WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    res.json({ message: "Food deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, grams, calories } = req.body;

    await db.execute(
      "UPDATE food_logs SET name = ?, grams = ?, calories = ? WHERE id = ? AND user_id = ?",
      [name, grams, calories, id, userId],
    );

    res.json({ message: "Food updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
