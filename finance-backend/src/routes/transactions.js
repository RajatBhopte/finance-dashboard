const express = require("express");
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.post("/", authorize("ADMIN"), createTransaction);
router.put("/:id", authorize("ADMIN"), updateTransaction);
router.delete("/:id", authorize("ADMIN"), deleteTransaction);

module.exports = router;
