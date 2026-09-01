const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const { generateWeeklyReport, sendWeeklyReportEmail } = require("../controllers/reportController");

router.post("/weekly", verifyToken, generateWeeklyReport);
router.post("/email-weekly", verifyToken, sendWeeklyReportEmail);

module.exports = router;
