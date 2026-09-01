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
        time VARCHAR(20),
        label VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS user_id INT`).catch(() => {});
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS habit_id VARCHAR(100)`).catch(() => {});
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS habit_name VARCHAR(255)`).catch(() => {});
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS icon VARCHAR(50)`).catch(() => {});
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS time VARCHAR(20)`).catch(() => {});
    await db.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS label VARCHAR(255)`).catch(() => {});
    
    // Convert habit_id and other columns from INT to VARCHAR if table had older integer types
    await db.query(`ALTER TABLE reminders ALTER COLUMN habit_id TYPE VARCHAR(100) USING habit_id::VARCHAR`).catch(() => {});
    await db.query(`ALTER TABLE reminders ALTER COLUMN habit_name TYPE VARCHAR(255) USING habit_name::VARCHAR`).catch(() => {});
    await db.query(`ALTER TABLE reminders ALTER COLUMN time TYPE VARCHAR(20) USING time::VARCHAR`).catch(() => {});
    await db.query(`ALTER TABLE reminders ALTER COLUMN icon TYPE VARCHAR(50) USING icon::VARCHAR`).catch(() => {});
    await db.query(`ALTER TABLE reminders ALTER COLUMN label TYPE VARCHAR(255) USING label::VARCHAR`).catch(() => {});

    // In case an older table had NOT NULL constraints on other columns
    await db.query(`ALTER TABLE reminders ALTER COLUMN habit_id DROP NOT NULL`).catch(() => {});
    await db.query(`ALTER TABLE reminders ALTER COLUMN habit_name DROP NOT NULL`).catch(() => {});
    await db.query(`ALTER TABLE reminders ALTER COLUMN time DROP NOT NULL`).catch(() => {});
    await db.query(`ALTER TABLE reminders ALTER COLUMN icon DROP NOT NULL`).catch(() => {});
    await db.query(`ALTER TABLE reminders ALTER COLUMN label DROP NOT NULL`).catch(() => {});
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
