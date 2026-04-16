const mongoose = require("mongoose");

let isConnected = false;
let hasRunRoleCompatibilityMigration = false;

async function migrateLegacyRoles(connection) {
  if (hasRunRoleCompatibilityMigration) {
    return;
  }

  const normalizeResult = await connection.collection("users").updateMany(
    {},
    [
      {
        $set: {
          role: {
            $switch: {
              branches: [
                {
                  case: { $in: ["$role", ["ANALYST", "analyst"]] },
                  then: "MANAGER",
                },
                {
                  case: { $in: ["$role", ["VIEWER", "viewer"]] },
                  then: "USER",
                },
                {
                  case: { $in: ["$role", ["ADMIN", "admin"]] },
                  then: "ADMIN",
                },
                {
                  case: { $in: ["$role", ["MANAGER", "manager"]] },
                  then: "MANAGER",
                },
                {
                  case: { $in: ["$role", ["USER", "user"]] },
                  then: "USER",
                },
              ],
              default: "USER",
            },
          },
        },
      },
    ],
  );

  hasRunRoleCompatibilityMigration = true;

  const modifiedCount = normalizeResult.modifiedCount;

  if (modifiedCount > 0) {
    console.log(
      `Normalized ${modifiedCount} legacy/invalid role value(s) to ADMIN/MANAGER/USER.`,
    );
  }
}

async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set.");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  isConnected = connection.connection.readyState === 1;

  if (isConnected) {
    await migrateLegacyRoles(connection.connection);
  }

  return connection.connection;
}

module.exports = connectDB;
