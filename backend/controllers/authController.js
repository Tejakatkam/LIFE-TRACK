const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { sendEmail } = require("../services/emailService");

const sendVerification = async (req, res) => {
  const { username, email } = req.body;

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await sendEmail({
      to: email,
      subject: "LifeTrack - Your Verification Code",
      text: `Welcome to LifeTrack! Your verification code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #12100f; color: #f5f0e6; padding: 40px; text-align: center; border-radius: 8px;">
          <h1 style="color: #c19c72;">life · track</h1>
          <p>Welcome, ${username}!</p>
          <p>Your verification code is:</p>
          <h2 style="background-color: #2b2520; padding: 15px; border-radius: 4px; display: inline-block; letter-spacing: 4px;">${otp}</h2>
          <p>Enter this code to complete your registration.</p>
        </div>
      `
    });

    const otpToken = jwt.sign(
      { ...req.body, otp },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "15m" }
    );

    res.status(200).json({ message: "Verification code sent", otpToken });
  } catch (error) {
    console.error("sendVerification error:", error);
    res.status(500).json({ message: `Failed to send email: ${error.message}` });
  }
};

const verifyRegistration = async (req, res) => {
  const { otpToken, otp } = req.body;

  if (!otpToken || !otp) {
    return res.status(400).json({ message: "Missing token or OTP" });
  }

  try {
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET || "SECRET_KEY");

    if (String(decoded.otp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const { username, password, email, phone, age, weight, height, gender, goal } = decoded;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (username, password, email, phone, age, weight, height, gender, goal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
    `;
    
    const [insertResult] = await db.query(sql, [
      username, hashedPassword, email, phone, age, weight, height, gender, goal
    ]);

    const userId = insertResult[0].id;

    const token = jwt.sign(
      { id: userId, username },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: userId, username, email, phone, age, weight, height, gender, goal }
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Verification code expired." });
    }
    if (error.code === '23505') {
       return res.status(400).json({ message: "User already exists" });
    }
    console.error("verifyRegistration error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT * FROM users WHERE username = ? OR email = ?`;

  try {
    const [results] = await db.query(sql, [username, username]);

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

const getMe = (req, res) => {
  const sql = "SELECT id, username, email, phone, age, weight, height, gender, goal FROM users WHERE id = ?";

  db.query(sql, [req.user.id])
    .then(([results]) => {
      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: results[0] });
    })
    .catch((err) => {
      console.error("GetMe DB error:", err);
      res.status(500).json({ message: "Database error" });
    });
};

const updateProfile = async (req, res) => {
  const { age, weight, height, gender, goal, email, phone } = req.body;
  const userId = req.user.id;

  const sql = `
    UPDATE users SET age=?, weight=?, height=?, gender=?, goal=?, email=?, phone=?
    WHERE id=?
  `;

  try {
    await db.query(sql, [age, weight, height, gender, goal, email, phone, userId]);
    
    // Return the updated profile
    const sqlGet = "SELECT id, username, email, phone, age, weight, height, gender, goal FROM users WHERE id = ?";
    const [results] = await db.query(sqlGet, [userId]);
    
    if (!results.length) return res.status(500).json({ message: "Error fetching updated profile" });
    res.json(results[0]);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("deleteAccount error:", err);
    res.status(500).json({ message: "Failed to delete account" });
  }
};

module.exports = { 
  sendVerification, 
  verifyRegistration, 
  loginUser, 
  getMe, 
  updateProfile,
  deleteAccount
};
