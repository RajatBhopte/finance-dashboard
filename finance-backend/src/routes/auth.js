const express = require("express");
const { login, register, logout } = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/logout", logout);

module.exports = router;
