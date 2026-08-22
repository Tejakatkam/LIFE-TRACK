const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const { generateWeeklyReport } = require("../controllers/reportController");

router.post("/weekly", verifyToken, generateWeeklyReport);

module.exports = router;
