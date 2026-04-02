const express = require("express");
const {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/summary", getSummary);
router.get("/category", getCategoryTotals);
router.get("/trends", authorize("ANALYST", "ADMIN"), getMonthlyTrends);
router.get("/recent", authorize("ANALYST", "ADMIN"), getRecentActivity);

module.exports = router;
