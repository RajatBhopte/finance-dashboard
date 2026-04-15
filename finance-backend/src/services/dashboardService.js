const Transaction = require("../models/Transaction");

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
}

function buildBaseWhere() {
  return {
    isDeleted: false,
  };
}

async function sumAmount(where) {
  const rows = await Transaction.aggregate([
    {
      $match: where,
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return toNumber(rows[0]?.total);
}

async function buildSummary() {
  const now = new Date();
  const startOfCurrentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const startOfPreviousMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const endOfPreviousMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999),
  );

  const [totalIncome, totalExpense, curInc, curExp, prevInc, prevExp] =
    await Promise.all([
      sumAmount({ ...buildBaseWhere(), type: "INCOME" }),
      sumAmount({ ...buildBaseWhere(), type: "EXPENSE" }),
      sumAmount({
        ...buildBaseWhere(),
        type: "INCOME",
        date: { $gte: startOfCurrentMonth },
      }),
      sumAmount({
        ...buildBaseWhere(),
        type: "EXPENSE",
        date: { $gte: startOfCurrentMonth },
      }),
      sumAmount({
        ...buildBaseWhere(),
        type: "INCOME",
        date: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
      }),
      sumAmount({
        ...buildBaseWhere(),
        type: "EXPENSE",
        date: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
      }),
    ]);

  const netBalance = Number((totalIncome - totalExpense).toFixed(2));

  const curNet = curInc - curExp;
  const prevNet = prevInc - prevExp;

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(
      (((current - previous) / Math.abs(previous)) * 100).toFixed(1),
    );
  };

  return {
    totalIncome,
    totalExpense,
    netBalance,
    trends: {
      income: calculateTrend(curInc, prevInc),
      expense: calculateTrend(curExp, prevExp),
      netBalance: calculateTrend(curNet, prevNet),
    },
  };
}

async function buildCategoryTotals() {
  const grouped = await Transaction.aggregate([
    {
      $match: buildBaseWhere(),
    },
    {
      $group: {
        _id: {
          category: "$category",
          type: "$type",
        },
        amount: {
          $sum: "$amount",
        },
      },
    },
    {
      $sort: {
        "_id.category": 1,
      },
    },
  ]);

  const categoryMap = new Map();

  for (const row of grouped) {
    if (!categoryMap.has(row._id.category)) {
      categoryMap.set(row._id.category, {
        category: row._id.category,
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    const current = categoryMap.get(row._id.category);
    const amount = toNumber(row.amount);

    if (row._id.type === "INCOME") {
      current.income = amount;
    } else {
      current.expense = amount;
    }

    current.net = Number((current.income - current.expense).toFixed(2));
  }

  return Array.from(categoryMap.values()).sort((a, b) => b.net - a.net);
}

async function buildMonthlyTrends() {
  const rows = await Transaction.aggregate([
    {
      $match: buildBaseWhere(),
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  return rows.map((row) => ({
    month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
    income: toNumber(row.income),
    expense: toNumber(row.expense),
    net: Number((toNumber(row.income) - toNumber(row.expense)).toFixed(2)),
  }));
}

async function buildRecentActivity(limit = 10) {
  const take = Number.isInteger(limit) && limit > 0 ? limit : 10;

  const transactions = await Transaction.find(buildBaseWhere())
    .sort({ date: -1, createdAt: -1 })
    .limit(take)
    .populate("createdBy", "name email")
    .lean();

  return transactions.map((item) => ({
    id: item._id.toString(),
    amount: toNumber(item.amount),
    type: item.type,
    category: item.category,
    date: item.date,
    notes: item.notes,
    createdAt: item.createdAt,
    createdBy: item.createdBy?._id?.toString() || null,
    user: item.createdBy
      ? {
          id: item.createdBy._id.toString(),
          name: item.createdBy.name,
          email: item.createdBy.email,
        }
      : null,
  }));
}

module.exports = {
  buildSummary,
  buildCategoryTotals,
  buildMonthlyTrends,
  buildRecentActivity,
};
