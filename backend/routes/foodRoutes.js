const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  getFoodByDate,
  addFood,
  deleteFood,
  updateFood,
} = require("../controllers/foodController");

router.get("/", verifyToken, getFoodByDate);
router.post("/", verifyToken, addFood);
router.delete("/:id", verifyToken, deleteFood);
router.put("/:id", verifyToken, updateFood); // ← ERROR probably here

module.exports = router;
