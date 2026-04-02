function notImplemented(message) {
  return (req, res) => {
    res.status(501).json({
      success: false,
      message,
    });
  };
}

module.exports = {
  getSummary: notImplemented("Dashboard summary endpoint is not implemented yet."),
  getCategoryTotals: notImplemented("Dashboard category endpoint is not implemented yet."),
  getMonthlyTrends: notImplemented("Dashboard trends endpoint is not implemented yet."),
  getRecentActivity: notImplemented("Dashboard recent activity endpoint is not implemented yet."),
};
