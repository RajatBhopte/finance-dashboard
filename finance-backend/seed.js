require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");

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
    "admin@gamil.com",
    "admin123",
    "ADMIN",
  );
  const manager = await upsertUser(
    "Manager User",
    "manager@gamil.com",
    "manager123",
    "MANAGER",
  );
  const user = await upsertUser(
    "Regular User",
    "user@gamil.com",
    "user123",
    "USER",
  );

  console.log(
    `Seed users ready: ${admin.email} (ADMIN), ${manager.email} (MANAGER), ${user.email} (USER).`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
