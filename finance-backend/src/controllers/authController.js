function notImplemented(message) {
  return (req, res) => {
    res.status(501).json({
      success: false,
      message,
    });
  };
}

module.exports = {
  register: notImplemented("Register endpoint is not implemented yet."),
  login: notImplemented("Login endpoint is not implemented yet."),
};
