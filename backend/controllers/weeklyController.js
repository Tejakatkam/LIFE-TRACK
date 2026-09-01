const ensureWeeklyTasksTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS weekly_tasks (
        id SERIAL PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        day VARCHAR(50) NOT NULL,
        reminder_time VARCHAR(20),
        done_this_week BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS user_id INT`);
    await db.query(`ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS name VARCHAR(255)`);
    await db.query(`ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS day VARCHAR(50)`);
    await db.query(`ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS reminder_time VARCHAR(20)`);
    await db.query(`ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS done_this_week BOOLEAN DEFAULT FALSE`);
  } catch (e) {
    console.error("ensureWeeklyTasksTable error:", e);
  }
};

// GET all weekly tasks
exports.getWeeklyTasks = async (req, res) => {
  try {
    await ensureWeeklyTasksTable();
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT * FROM weekly_tasks WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );

    res.json(rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD task
exports.addWeeklyTask = async (req, res) => {
  try {
    await ensureWeeklyTasksTable();
    const userId = req.user.id;
    const { name, day, reminder_time } = req.body;

    const [rows] = await db.query(
      "INSERT INTO weekly_tasks (user_id, name, day, reminder_time) VALUES (?, ?, ?, ?) RETURNING id",
      [userId, name, day, reminder_time],
    );

    res.json({
      id: rows[0]?.id,
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
    await ensureWeeklyTasksTable();
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
    await ensureWeeklyTasksTable();
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

// BATCH SYNC WEEKLY TASKS
exports.syncWeeklyTasks = async (req, res) => {
  try {
    await ensureWeeklyTasksTable();
    const userId = req.user.id;
    const { tasks = [] } = req.body || {};

    const taskList = Array.isArray(tasks) ? tasks : [];

    await db.query("DELETE FROM weekly_tasks WHERE user_id = ?", [userId]);

    for (let t of taskList) {
      if (!t.name || !t.day) continue;
      await db.query(
        "INSERT INTO weekly_tasks (user_id, name, day, reminder_time, done_this_week) VALUES (?, ?, ?, ?, ?)",
        [userId, t.name, t.day, t.reminderTime || t.reminder_time || "09:00", !!t.doneThisWeek]
      );
    }

    res.json({ message: "Weekly tasks synced successfully" });
  } catch (err) {
    console.error("syncWeeklyTasks error:", err);
    res.status(500).json({ message: `Failed to sync weekly tasks: ${err.message}` });
  }
};
