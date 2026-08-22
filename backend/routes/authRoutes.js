const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile } = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", verifyToken, getMe);
router.put("/profile", verifyToken, updateProfile);

router.get("/clear-db-temp", async (req, res) => {
  const db = require("../config/db");
  try {
    await db.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
    res.send("DB CLEARED");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
