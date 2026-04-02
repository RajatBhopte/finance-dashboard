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

  await prisma.transaction.createMany({
    data: [
      {
        amount: 50000,
        type: TransactionType.INCOME,
        category: "Salary",
        date: new Date("2026-01-15"),
        notes: "Monthly salary",
        createdBy: admin.id,
      },
      {
        amount: 12000,
        type: TransactionType.EXPENSE,
        category: "Rent",
        date: new Date("2026-01-20"),
        notes: "Apartment rent",
        createdBy: admin.id,
      },
      {
        amount: 9000,
        type: TransactionType.INCOME,
        category: "Freelance",
        date: new Date("2026-02-02"),
        notes: "Consulting work",
        createdBy: analyst.id,
      },
      {
        amount: 3000,
        type: TransactionType.EXPENSE,
        category: "Groceries",
        date: new Date("2026-02-11"),
        notes: "Household groceries",
        createdBy: viewer.id,
      },
      {
        amount: 4500,
        type: TransactionType.EXPENSE,
        category: "Transport",
        date: new Date("2026-03-03"),
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
