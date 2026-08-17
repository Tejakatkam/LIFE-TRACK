const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  getWeeklyTasks,
  addWeeklyTask,
  toggleWeeklyTask,
  deleteWeeklyTask,
} = require("../controllers/weeklyController");

router.get("/", verifyToken, getWeeklyTasks);
router.post("/", verifyToken, addWeeklyTask);
router.put("/:id", verifyToken, toggleWeeklyTask);
router.delete("/:id", verifyToken, deleteWeeklyTask);

module.exports = router;
