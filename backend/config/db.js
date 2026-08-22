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
  CREATE TABLE IF NOT EXISTS weight_records (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    frequency VARCHAR(10) NOT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error("Error creating weight_records table:", err));

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
