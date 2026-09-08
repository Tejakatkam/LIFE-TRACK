const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const { 
  updateProfile, 
  getCalorieRecommendation, 
  getHabitDescription,
  estimateFoodCalories,
  estimateWorkoutCalories
} = require("../controllers/userController");

router.put("/profile", verifyToken, updateProfile);
router.get("/calorie-recommendation", verifyToken, getCalorieRecommendation);
router.post("/habit-description", verifyToken, getHabitDescription);
router.post("/estimate-food-calories", verifyToken, estimateFoodCalories);
router.post("/estimate-workout-calories", verifyToken, estimateWorkoutCalories);

module.exports = router;
