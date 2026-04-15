const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const TRANSACTION_TYPES = ["INCOME", "EXPENSE"];

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseAmount(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function parseTransactionDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseFilterDate(value, endOfDay = false) {
  const parsed = parseTransactionDate(value);

  if (!parsed) {
    return null;
  }

  // Treat YYYY-MM-DD filters as whole-day boundaries.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (endOfDay) {
      parsed.setHours(23, 59, 59, 999);
    } else {
      parsed.setHours(0, 0, 0, 0);
    }
  }

  return parsed;
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function formatPopulatedUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    id: user._id?.toString?.() || user.id || null,
    name: user.name || null,
    email: user.email || null,
  };
}

function formatTransaction(transaction) {
  const source =
    typeof transaction.toJSON === "function"
      ? transaction.toJSON()
      : transaction;
  const populatedUser = formatPopulatedUser(source.createdBy);
  const createdBy = populatedUser
    ? populatedUser.id
    : source.createdBy?.toString?.() || source.createdBy;

  return {
    id: source.id || source._id?.toString?.(),
    amount: Number(Number(source.amount).toFixed(2)),
    type: source.type,
    category: source.category,
    date: source.date,
    notes: source.notes,
    isDeleted: Boolean(source.isDeleted),
    createdBy,
    createdAt: source.createdAt,
    user: populatedUser,
  };
}

async function findActiveTransaction(id) {
  if (!isValidObjectId(id)) {
    return null;
  }

  return Transaction.findOne({
    _id: id,
    isDeleted: false,
  }).populate("createdBy", "name email");
}

const createTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body || {};

    const parsedAmount = parseAmount(amount);
    const normalizedType = normalizeText(type).toUpperCase();
    const normalizedCategory = normalizeText(category);
    const parsedDate = parseTransactionDate(date);
    const normalizedNotes = normalizeText(notes);

    if (
      !parsedAmount ||
      !normalizedType ||
      !normalizedCategory ||
      !parsedDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide amount, type, category and a valid date.",
      });
    }

    if (!TRANSACTION_TYPES.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either INCOME or EXPENSE.",
      });
    }

    const createdTransaction = await Transaction.create({
      amount: parsedAmount,
      type: normalizedType,
      category: normalizedCategory,
      date: parsedDate,
      notes: normalizedNotes || null,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    const transaction = await Transaction.findById(
      createdTransaction._id,
    ).populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      data: formatTransaction(transaction),
    });
  } catch (error) {
    return next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, search, page, limit } =
      req.query;

    const where = {
      isDeleted: false,
    };

    const normalizedType = normalizeText(type).toUpperCase();
    const normalizedCategory = normalizeText(category);
    const normalizedSearch = normalizeText(search);
    const parsedStartDate = startDate ? parseFilterDate(startDate) : null;
    const parsedEndDate = endDate ? parseFilterDate(endDate, true) : null;
    const parsedPage = parsePositiveInteger(page, 1);
    const parsedLimit = parsePositiveInteger(limit, 10);

    if (type && !TRANSACTION_TYPES.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Type filter must be either INCOME or EXPENSE.",
      });
    }

    if (startDate && !parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "startDate must be a valid date.",
      });
    }

    if (endDate && !parsedEndDate) {
      return res.status(400).json({
        success: false,
        message: "endDate must be a valid date.",
      });
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be later than endDate.",
      });
    }

    if (parsedPage === null) {
      return res.status(400).json({
        success: false,
        message: "page must be a positive integer.",
      });
    }

    if (parsedLimit === null) {
      return res.status(400).json({
        success: false,
        message: "limit must be a positive integer.",
      });
    }

    if (normalizedType) {
      where.type = normalizedType;
    }

    if (normalizedCategory) {
      where.category = new RegExp(`^${escapeRegex(normalizedCategory)}$`, "i");
    }

    if (parsedStartDate || parsedEndDate) {
      where.date = {};

      if (parsedStartDate) {
        where.date.$gte = parsedStartDate;
      }

      if (parsedEndDate) {
        where.date.$lte = parsedEndDate;
      }
    }

    if (normalizedSearch) {
      const searchRegex = new RegExp(escapeRegex(normalizedSearch), "i");
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      })
        .select("_id")
        .lean();

      const matchingUserIds = matchingUsers.map((item) => item._id);

      where.$or = [{ category: searchRegex }, { notes: searchRegex }];

      if (matchingUserIds.length) {
        where.$or.push({ createdBy: { $in: matchingUserIds } });
      }
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [transactions, total] = await Promise.all([
      Transaction.find(where)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("createdBy", "name email"),
      Transaction.countDocuments(where),
    ]);

    const formattedTransactions = transactions.map(formatTransaction);

    return res.status(200).json({
      success: true,
      count: formattedTransactions.length,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit) || 1,
      },
      data: formattedTransactions,
    });
  } catch (error) {
    return next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await findActiveTransaction(req.params.id);

    if (!transaction) {
      throw createError(404, "Transaction not found.");
    }

    return res.status(200).json({
      success: true,
      data: formatTransaction(transaction),
    });
  } catch (error) {
    return next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const existingTransaction = await findActiveTransaction(req.params.id);

    if (!existingTransaction) {
      throw createError(404, "Transaction not found.");
    }

    const { amount, type, category, date, notes } = req.body || {};
    const data = {};

    if (amount !== undefined) {
      const parsedAmount = parseAmount(amount);

      if (!parsedAmount) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number.",
        });
      }

      data.amount = parsedAmount;
    }

    if (type !== undefined) {
      const normalizedType = normalizeText(type).toUpperCase();

      if (!TRANSACTION_TYPES.includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: "Type must be either INCOME or EXPENSE.",
        });
      }

      data.type = normalizedType;
    }

    if (category !== undefined) {
      const normalizedCategory = normalizeText(category);

      if (!normalizedCategory) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty.",
        });
      }

      data.category = normalizedCategory;
    }

    if (date !== undefined) {
      const parsedDate = parseTransactionDate(date);

      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          message: "Date must be valid.",
        });
      }

      data.date = parsedDate;
    }

    if (notes !== undefined) {
      const normalizedNotes = normalizeText(notes);
      data.notes = normalizedNotes || null;
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update.",
      });
    }

    data.updatedBy = req.user.id;

    await Transaction.findByIdAndUpdate(req.params.id, data);

    const updatedTransaction = await Transaction.findById(
      req.params.id,
    ).populate("createdBy", "name email");

    if (!updatedTransaction || updatedTransaction.isDeleted) {
      throw createError(404, "Transaction not found.");
    }

    return res.status(200).json({
      success: true,
      data: formatTransaction(updatedTransaction),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const existingTransaction = await findActiveTransaction(req.params.id);

    if (!existingTransaction) {
      throw createError(404, "Transaction not found.");
    }

    await Transaction.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      updatedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
