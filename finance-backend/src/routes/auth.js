const express = require("express");
const {
  login,
  register,
  refresh,
  logout,
} = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logout);
router.get("/logout", logout);

module.exports = router;
