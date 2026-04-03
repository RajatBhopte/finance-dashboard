const rateLimit = require("express-rate-limit");

const standardRateLimitConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  },
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  ...standardRateLimitConfig,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  ...standardRateLimitConfig,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again after 15 minutes.",
    });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
