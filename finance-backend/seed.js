require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");
const Transaction = require("./src/models/Transaction");

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function upsertUser(name, email, password, role) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.role = role;
    existingUser.isActive = true;
    existingUser.updatedBy = existingUser._id;
    await existingUser.save();
    return existingUser;
  }

  return User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role,
    isActive: true,
  });
}

async function main() {
  await connectDB();

  const admin = await upsertUser(
    "Admin User",
    "admin@finance.com",
    "admin123",
    "ADMIN",
  );
  const analyst = await upsertUser(
    "Analyst User",
    "analyst@finance.com",
    "analyst123",
    "ANALYST",
  );
  const viewer = await upsertUser(
    "Viewer User",
    "viewer@finance.com",
    "viewer123",
    "VIEWER",
  );

  await Transaction.deleteMany({
    createdBy: {
      $in: [admin._id, analyst._id, viewer._id],
    },
  });

  const now = new Date();
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const twoMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 2, 15);

  await Transaction.insertMany([
    {
      amount: 50000,
      type: "INCOME",
      category: "Salary",
      date: prevMonthDate,
      notes: "Monthly salary",
      createdBy: admin._id,
      updatedBy: admin._id,
    },
    {
      amount: 12000,
      type: "EXPENSE",
      category: "Rent",
      date: prevMonthDate,
      notes: "Apartment rent",
      createdBy: admin._id,
      updatedBy: admin._id,
    },
    {
      amount: 9000,
      type: "INCOME",
      category: "Freelance",
      date: currentMonthDate,
      notes: "Consulting work",
      createdBy: analyst._id,
      updatedBy: analyst._id,
    },
    {
      amount: 3000,
      type: "EXPENSE",
      category: "Groceries",
      date: currentMonthDate,
      notes: "Household groceries",
      createdBy: viewer._id,
      updatedBy: viewer._id,
    },
    {
      amount: 4500,
      type: "EXPENSE",
      category: "Transport",
      date: twoMonthsAgoDate,
      notes: "Fuel and travel",
      createdBy: analyst._id,
      updatedBy: analyst._id,
    },
  ]);

  console.log("Seed data created successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
