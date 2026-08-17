const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const { updateProfile } = require("../controllers/userController");

router.put("/profile", verifyToken, updateProfile);

module.exports = router;
