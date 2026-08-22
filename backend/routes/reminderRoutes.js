const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  getReminders,
  addReminder,
  deleteReminder,
  syncReminders,
} = require("../controllers/reminderController");

router.get("/", verifyToken, getReminders);
router.post("/", verifyToken, addReminder);
router.post("/sync", verifyToken, syncReminders);
router.delete("/:id", verifyToken, deleteReminder);

module.exports = router;
