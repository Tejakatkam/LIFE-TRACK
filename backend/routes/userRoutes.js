const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const { updateProfile, getCalorieRecommendation, getHabitDescription } = require("../controllers/userController");

router.put("/profile", verifyToken, updateProfile);
router.get("/calorie-recommendation", verifyToken, getCalorieRecommendation);
router.post("/habit-description", verifyToken, getHabitDescription);

module.exports = router;
