function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err && err.code === "P2002") {
    return res.status(400).json({
      success: false,
      message: "A unique field already exists.",
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
}

module.exports = errorHandler;
