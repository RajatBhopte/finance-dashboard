function notImplemented(message) {
  return (req, res) => {
    res.status(501).json({
      success: false,
      message,
    });
  };
}

module.exports = {
  createTransaction: notImplemented("Create transaction endpoint is not implemented yet."),
  getTransactions: notImplemented("List transactions endpoint is not implemented yet."),
  getTransactionById: notImplemented("Get transaction endpoint is not implemented yet."),
  updateTransaction: notImplemented("Update transaction endpoint is not implemented yet."),
  deleteTransaction: notImplemented("Delete transaction endpoint is not implemented yet."),
};
