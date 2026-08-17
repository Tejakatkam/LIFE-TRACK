const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  getReminders,
  addReminder,
  deleteReminder,
} = require("../controllers/reminderController");

router.get("/", verifyToken, getReminders);
router.post("/", verifyToken, addReminder);
router.delete("/:id", verifyToken, deleteReminder);

module.exports = router;
