const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const {
    username,
    password,
    email,
    phone,
    age,
    weight,
    height,
    gender,
    goal,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
            INSERT INTO users (username, password, email, phone, age, weight, height, gender, goal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    await db.query(sql, [
      username,
      hashedPassword,
      email,
      phone,
      age,
      weight,
      height,
      gender,
      goal,
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error.code === '23505') { // Postgres unique_violation
       return res.status(400).json({ message: "User already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT * FROM users WHERE username = ?`;

  try {
    const [results] = await db.query(sql, [username]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || "SECRET_KEY", 
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        goal: user.goal,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `SELECT id, username, email, phone, age, weight, height, gender, goal FROM users WHERE id = ?`;
    const [results] = await db.query(sql, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: results[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser, getMe };
