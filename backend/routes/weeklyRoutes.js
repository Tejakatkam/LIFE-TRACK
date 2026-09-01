const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  getWeeklyTasks,
  addWeeklyTask,
  toggleWeeklyTask,
  deleteWeeklyTask,
  syncWeeklyTasks,
} = require("../controllers/weeklyController");

router.get("/", verifyToken, getWeeklyTasks);
router.post("/", verifyToken, addWeeklyTask);
router.post("/sync", verifyToken, syncWeeklyTasks);
router.put("/:id", verifyToken, toggleWeeklyTask);
router.delete("/:id", verifyToken, deleteWeeklyTask);

module.exports = router;
