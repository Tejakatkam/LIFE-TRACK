const db = require("../config/db");

// GET all weekly tasks
exports.getWeeklyTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT * FROM weekly_tasks WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD task
exports.addWeeklyTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, day, reminder_time } = req.body;

    const [rows] = await db.query(
      "INSERT INTO weekly_tasks (user_id, name, day, reminder_time) VALUES (?, ?, ?, ?) RETURNING id",
      [userId, name, day, reminder_time],
    );

    res.json({
      id: rows[0].id,
      name,
      day,
      reminder_time,
      done_this_week: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// TOGGLE DONE
exports.toggleWeeklyTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await db.query(
      "UPDATE weekly_tasks SET done_this_week = NOT done_this_week WHERE id = ? AND user_id = ?",
      [id, userId],
    );

    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE
exports.deleteWeeklyTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await db.query("DELETE FROM weekly_tasks WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
