const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

console.log("PostgreSQL database pool created");

pool.query(`
  CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    habit_id VARCHAR(100),
    habit_name VARCHAR(255),
    icon VARCHAR(50),
    time VARCHAR(20) NOT NULL,
    label VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE reminders ADD COLUMN IF NOT EXISTS habit_id VARCHAR(100);
  ALTER TABLE reminders ADD COLUMN IF NOT EXISTS habit_name VARCHAR(255);
  ALTER TABLE reminders ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
  ALTER TABLE reminders ADD COLUMN IF NOT EXISTS time VARCHAR(20);
  ALTER TABLE reminders ADD COLUMN IF NOT EXISTS label VARCHAR(255);

  ALTER TABLE reminders ALTER COLUMN habit_id TYPE VARCHAR(100) USING habit_id::VARCHAR;
  ALTER TABLE reminders ALTER COLUMN habit_name TYPE VARCHAR(255) USING habit_name::VARCHAR;
  ALTER TABLE reminders ALTER COLUMN time TYPE VARCHAR(20) USING time::VARCHAR;
  ALTER TABLE reminders ALTER COLUMN icon TYPE VARCHAR(50) USING icon::VARCHAR;
  ALTER TABLE reminders ALTER COLUMN label TYPE VARCHAR(255) USING label::VARCHAR;

  CREATE TABLE IF NOT EXISTS weekly_tasks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    day VARCHAR(50) NOT NULL,
    reminder_time VARCHAR(20),
    done_this_week BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS name VARCHAR(255);
  ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS day VARCHAR(50);
  ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS reminder_time VARCHAR(20);
  ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS done_this_week BOOLEAN DEFAULT FALSE;

  CREATE TABLE IF NOT EXISTS weight_records (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    frequency VARCHAR(10) NOT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error("Error creating database tables:", err));

module.exports = {
  // Compatibility wrapper to make `await db.query` return [rows] like mysql2/promise
  query: async (sql, params = []) => {
    let i = 1;
    // Replace ? with $1, $2, etc.
    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
    // pg throws if parameters are undefined, so map them to null
    const safeParams = params.map(p => p === undefined ? null : p);
    const result = await pool.query(pgSql, safeParams);
    return [result.rows, result.fields];
  },
  execute: async (sql, params = []) => {
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
    const safeParams = params.map(p => p === undefined ? null : p);
    const result = await pool.query(pgSql, safeParams);
    return [result.rows, result.fields];
  }
};
