const express = require("express");
const router = express.Router();
const { addWeight, getWeightHistory } = require("../controllers/weightController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken, addWeight);
router.get("/", verifyToken, getWeightHistory);

module.exports = router;

