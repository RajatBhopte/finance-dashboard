function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err && err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "A unique field already exists.",
    });
  }

  if (err && err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid identifier format.",
    });
  }

  if (err && err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
}

module.exports = errorHandler;
