const prisma = require("../config/db");

const TRANSACTION_TYPES = ["INCOME", "EXPENSE"];

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed.toFixed(2);
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

function buildTransactionSelect() {
  return {
    id: true,
    amount: true,
    type: true,
    category: true,
    date: true,
    notes: true,
    isDeleted: true,
    createdBy: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };
}

async function findActiveTransaction(id) {
  return prisma.transaction.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: buildTransactionSelect(),
  });
}


// reads amount, type, category, date, notes from req.body
// validates them
// uses req.user.id from your auth middleware as createdBy
// creates the row with prisma.transaction.create()
// returns 201

const createTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body || {};

    const parsedAmount = parseAmount(amount);
    const normalizedType = normalizeText(type).toUpperCase();
    const normalizedCategory = normalizeText(category);
    const parsedDate = parseTransactionDate(date);
    const normalizedNotes = normalizeText(notes);

    if (!parsedAmount || !normalizedType || !normalizedCategory || !parsedDate) {
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

    const transaction = await prisma.transaction.create({
      data: {
        amount: parsedAmount,
        type: normalizedType,
        category: normalizedCategory,
        date: parsedDate,
        notes: normalizedNotes || null,
        createdBy: req.user.id,
      },
      select: buildTransactionSelect(),
    });

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    return next(error);
  }
};


const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate } = req.query;

    const where = {
      isDeleted: false,
    };

    const normalizedType = normalizeText(type).toUpperCase();
    const normalizedCategory = normalizeText(category);
    const parsedStartDate = startDate ? parseFilterDate(startDate) : null;
    const parsedEndDate = endDate ? parseFilterDate(endDate, true) : null;

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

    if (normalizedType) {
      where.type = normalizedType;
    }

    if (normalizedCategory) {
      where.category = {
        equals: normalizedCategory,
        mode: "insensitive",
      };
    }

    if (parsedStartDate || parsedEndDate) {
      where.date = {};

      if (parsedStartDate) {
        where.date.gte = parsedStartDate;
      }

      if (parsedEndDate) {
        where.date.lte = parsedEndDate;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      select: buildTransactionSelect(),
    });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
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
      data: transaction,
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

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: req.params.id,
      },
      data,
      select: buildTransactionSelect(),
    });

    return res.status(200).json({
      success: true,
      data: updatedTransaction,
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

    await prisma.transaction.update({
      where: {
        id: req.params.id,
      },
      data: {
        isDeleted: true,
      },
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
