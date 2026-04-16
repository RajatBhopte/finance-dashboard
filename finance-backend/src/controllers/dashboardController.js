const dashboardService = require("../services/dashboardService");

const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.buildSummary(req.user);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSummary,
};
