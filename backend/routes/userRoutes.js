const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const { updateProfile, getCalorieRecommendation } = require("../controllers/userController");

router.put("/profile", verifyToken, updateProfile);
router.get("/calorie-recommendation", verifyToken, getCalorieRecommendation);

module.exports = router;
