function notImplemented(message) {
  return (req, res) => {
    res.status(501).json({
      success: false,
      message,
    });
  };
}

module.exports = {
  getUsers: notImplemented("List users endpoint is not implemented yet."),
  updateUserRole: notImplemented("Update user role endpoint is not implemented yet."),
  updateUserStatus: notImplemented("Update user status endpoint is not implemented yet."),
};
