const prisma = require("../config/db");

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

async function buildSummary() {
  const now = new Date();
  const startOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfPreviousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const endOfPreviousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

  const [
    income, 
    expense, 
    currentIncome, 
    currentExpense, 
    previousIncome, 
    previousExpense
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...buildBaseWhere(), type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...buildBaseWhere(), type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...buildBaseWhere(), type: "INCOME", date: { gte: startOfCurrentMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...buildBaseWhere(), type: "EXPENSE", date: { gte: startOfCurrentMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...buildBaseWhere(), type: "INCOME", date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...buildBaseWhere(), type: "EXPENSE", date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = toNumber(income._sum.amount);
  const totalExpense = toNumber(expense._sum.amount);
  const netBalance = Number((totalIncome - totalExpense).toFixed(2));

  const curInc = toNumber(currentIncome._sum.amount);
  const prevInc = toNumber(previousIncome._sum.amount);
  const curExp = toNumber(currentExpense._sum.amount);
  const prevExp = toNumber(previousExpense._sum.amount);
  
  const curNet = curInc - curExp;
  const prevNet = prevInc - prevExp;

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
  };

  return {
    totalIncome,
    totalExpense,
    netBalance,
    trends: {
      income: calculateTrend(curInc, prevInc),
      expense: calculateTrend(curExp, prevExp),
      netBalance: calculateTrend(curNet, prevNet)
    }
  };
}

async function buildCategoryTotals() {
  const grouped = await prisma.transaction.groupBy({
    by: ["category", "type"],
    where: buildBaseWhere(),
    _sum: {
      amount: true,
    },
    orderBy: {
      category: "asc",
    },
  });

  const categoryMap = new Map();

  for (const row of grouped) {
    if (!categoryMap.has(row.category)) {
      categoryMap.set(row.category, {
        category: row.category,
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    const current = categoryMap.get(row.category);
    const amount = toNumber(row._sum.amount);

    if (row.type === "INCOME") {
      current.income = amount;
    } else {
      current.expense = amount;
    }

    current.net = Number((current.income - current.expense).toFixed(2));
  }

  return Array.from(categoryMap.values()).sort((a, b) => b.net - a.net);
}

async function buildMonthlyTrends() {
  const rows = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "date"), 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount" ELSE 0 END), 0) AS expense
    FROM "Transaction"
    WHERE "isDeleted" = false
    GROUP BY DATE_TRUNC('month', "date")
    ORDER BY DATE_TRUNC('month', "date") ASC
  `;

  return rows.map((row) => ({
    month: row.month,
    income: toNumber(row.income),
    expense: toNumber(row.expense),
    net: Number((toNumber(row.income) - toNumber(row.expense)).toFixed(2)),
  }));
}

async function buildRecentActivity(limit = 10) {
  const take = Number.isInteger(limit) && limit > 0 ? limit : 10;

  const transactions = await prisma.transaction.findMany({
    where: buildBaseWhere(),
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" },
    ],
    take,
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      notes: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return transactions.map((item) => ({
    ...item,
    amount: toNumber(item.amount),
  }));
}

module.exports = {
  buildSummary,
  buildCategoryTotals,
  buildMonthlyTrends,
  buildRecentActivity,
};
