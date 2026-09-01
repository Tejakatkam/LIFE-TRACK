const ensureWeightRecordsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS weight_records (
        id SERIAL PRIMARY KEY,
        user_id INT,
        weight DECIMAL(5,2) NOT NULL,
        frequency VARCHAR(20) DEFAULT 'daily',
        record_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS user_id INT`).catch(() => {});
    await db.query(`ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2)`).catch(() => {});
    await db.query(`ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS frequency VARCHAR(20)`).catch(() => {});
    await db.query(`ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS record_date DATE`).catch(() => {});
  } catch (e) {
    console.error("ensureWeightRecordsTable error:", e);
  }
};

exports.addWeight = async (req, res) => {
  try {
    await ensureWeightRecordsTable();
    const { weight, record_date } = req.body;
    const userId = req.user.id;
    const targetDate = record_date || new Date().toISOString().split("T")[0];

    const numWeight = parseFloat(weight);
    if (!numWeight || isNaN(numWeight)) {
      return res.status(400).json({ message: "Valid weight is required" });
    }

    // Automatically sync current profile weight
    await db.query("UPDATE users SET weight = ? WHERE id = ?", [numWeight, userId]).catch(() => {});

    // Check if user already logged weight today
    const [existing] = await db.query(
      "SELECT id FROM weight_records WHERE user_id = ? AND record_date = ?",
      [userId, targetDate]
    );

    if (existing && existing.length > 0) {
      await db.query(
        "UPDATE weight_records SET weight = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?",
        [numWeight, existing[0].id]
      );
      return res.json({ message: "Today's weight updated successfully", updated: true });
    } else {
      await db.query(
        "INSERT INTO weight_records (user_id, weight, frequency, record_date) VALUES (?, ?, 'daily', ?)",
        [userId, numWeight, targetDate]
      );
      return res.status(201).json({ message: "Weight recorded successfully", updated: false });
    }
  } catch (err) {
    console.error("Error adding weight:", err);
    res.status(500).json({ message: "Failed to record weight" });
  }
};

exports.getWeightHistory = async (req, res) => {
  try {
    await ensureWeightRecordsTable();
    const userId = req.user.id;
    const sql = `
      SELECT id, weight, frequency, record_date, created_at 
      FROM weight_records 
      WHERE user_id = ? 
      ORDER BY record_date ASC
    `;

    const [results] = await db.query(sql, [userId]);
    res.json(results || []);
  } catch (err) {
    console.error("Error fetching weight history:", err);
    res.status(500).json({ message: "Failed to fetch weight history" });
  }
};

