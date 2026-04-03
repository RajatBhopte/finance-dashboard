require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient, Role, TransactionType } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function upsertUser(name, email, password, role) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role,
      isActive: true,
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    },
  });
}

async function main() {
  const admin = await upsertUser("Admin User", "admin@finance.com", "admin123", Role.ADMIN);
  const analyst = await upsertUser("Analyst User", "analyst@finance.com", "analyst123", Role.ANALYST);
  const viewer = await upsertUser("Viewer User", "viewer@finance.com", "viewer123", Role.VIEWER);

  await prisma.transaction.deleteMany({
    where: {
      createdBy: {
        in: [admin.id, analyst.id, viewer.id],
      },
    },
  });

  const now = new Date();
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const twoMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 2, 15);

  await prisma.transaction.createMany({
    data: [
      {
        amount: 50000,
        type: TransactionType.INCOME,
        category: "Salary",
        date: prevMonthDate,
        notes: "Monthly salary",
        createdBy: admin.id,
      },
      {
        amount: 12000,
        type: TransactionType.EXPENSE,
        category: "Rent",
        date: prevMonthDate,
        notes: "Apartment rent",
        createdBy: admin.id,
      },
      {
        amount: 9000,
        type: TransactionType.INCOME,
        category: "Freelance",
        date: currentMonthDate,
        notes: "Consulting work",
        createdBy: analyst.id,
      },
      {
        amount: 3000,
        type: TransactionType.EXPENSE,
        category: "Groceries",
        date: currentMonthDate,
        notes: "Household groceries",
        createdBy: viewer.id,
      },
      {
        amount: 4500,
        type: TransactionType.EXPENSE,
        category: "Transport",
        date: twoMonthsAgoDate,
        notes: "Fuel and travel",
        createdBy: analyst.id,
      },
    ],
  });

  console.log("Seed data created successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
