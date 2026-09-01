require("dotenv").config();
require("./services/scheduler");
const express = require("express");
const cors = require("cors");

require("./config/db"); // MySQL connection

const authRoutes = require("./routes/authRoutes");
const foodRoutes = require("./routes/foodRoutes");
const verifyToken = require("./middleware/authMiddleware");
const reminderRoutes = require("./routes/reminderRoutes");
const weeklyRoutes = require("./routes/weeklyRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const weightRoutes = require("./routes/weightRoutes");

const app = express(); // ✅ Create app FIRST

// --------------------
// Middleware
// --------------------
app.use(
  cors({
    origin: "*", // later we restrict to frontend URL
  }),
);
app.use(express.json());

// --------------------
// Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/weekly", weeklyRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/weight", weightRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("LifeTrack Backend Running");
});

// Protected Test Route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
