const express = require("express");
const {
  sendVerification,
  verifyRegistration,
  loginUser,
  getMe,
  updateProfile,
  deleteAccount
} = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/send-verification", sendVerification);
router.post("/verify-registration", verifyRegistration);
router.post("/login", loginUser);
router.get("/me", verifyToken, getMe);
router.put("/profile", verifyToken, updateProfile);
router.delete("/me", verifyToken, deleteAccount);

module.exports = router;
