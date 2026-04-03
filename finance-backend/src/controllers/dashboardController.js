const dashboardService = require("../services/dashboardService");

function parsePositiveInteger(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.buildSummary();

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
};

const getCategoryTotals = async (req, res, next) => {
  try {
    const totals = await dashboardService.buildCategoryTotals();

    return res.status(200).json({
      success: true,
      count: totals.length,
      data: totals,
    });
  } catch (error) {
    return next(error);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const trends = await dashboardService.buildMonthlyTrends();

    return res.status(200).json({
      success: true,
      count: trends.length,
      data: trends,
    });
  } catch (error) {
    return next(error);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parsePositiveInteger(req.query.limit, 10);

    if (limit === null) {
      return res.status(400).json({
        success: false,
        message: "limit must be a positive integer.",
      });
    }

    const recentActivity = await dashboardService.buildRecentActivity(limit);

    return res.status(200).json({
      success: true,
      count: recentActivity.length,
      data: recentActivity,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
};
