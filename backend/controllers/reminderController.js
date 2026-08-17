const db = require("../config/db");

// GET reminders for user
exports.getReminders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD reminder timer
exports.addReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { habit_id, habit_name, icon, time, label } = req.body;

    const [rows] = await db.query(
      "INSERT INTO reminders (user_id, habit_id, habit_name, icon, time, label) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
      [userId, habit_id, habit_name, icon, time, label],
    );

    res.json({
      id: rows[0].id,
      habit_id,
      habit_name,
      icon,
      time,
      label,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE reminder
exports.deleteReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await db.query("DELETE FROM reminders WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    res.json({ message: "Reminder deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
