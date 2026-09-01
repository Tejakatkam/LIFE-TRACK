const db = require("../config/db");

const ensureRemindersTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INT,
        habit_id VARCHAR(100),
        habit_name VARCHAR(255),
        icon VARCHAR(50),
        time VARCHAR(20) NOT NULL,
        label VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS user_id INT`);
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS habit_id VARCHAR(100)`);
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS habit_name VARCHAR(255)`);
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS icon VARCHAR(50)`);
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS time VARCHAR(20)`);
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS label VARCHAR(255)`);
  } catch (e) {
    console.error("ensureRemindersTable error:", e);
  }
};

// GET reminders for user
exports.getReminders = async (req, res) => {
  try {
    await ensureRemindersTable();
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );

    res.json(rows || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD reminder timer
exports.addReminder = async (req, res) => {
  try {
    await ensureRemindersTable();
    const userId = req.user.id;
    const { habit_id, habit_name, icon, time, label } = req.body;

    const [rows] = await db.query(
      "INSERT INTO reminders (user_id, habit_id, habit_name, icon, time, label) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
      [userId, habit_id, habit_name, icon, time, label],
    );

    res.json({
      id: rows[0]?.id,
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
    await ensureRemindersTable();
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

exports.syncReminders = async (req, res) => {
  try {
    await ensureRemindersTable();
    const userId = req.user.id;
    const { reminders = [] } = req.body || {};

    const reminderList = Array.isArray(reminders) ? reminders : [];

    // Delete existing reminders for user
    await db.query("DELETE FROM reminders WHERE user_id = ?", [userId]);

    // Insert new
    for (let r of reminderList) {
      if (!r.time) continue;
      await db.query(
        "INSERT INTO reminders (user_id, habit_id, habit_name, icon, time, label) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, r.habit_id || "", r.habit_name || "", r.icon || "◆", String(r.time), r.label || ""]
      );
    }

    res.json({ message: "Reminders synced successfully" });
  } catch (error) {
    console.error("syncReminders error:", error);
    res.status(500).json({ message: `Failed to sync reminders: ${error.message}` });
  }
};
