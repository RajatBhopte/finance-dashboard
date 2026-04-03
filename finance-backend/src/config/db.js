const { PrismaPg } = require("@prisma/adapter-pg");

const globalForPrisma = globalThis;

let prisma;
let initializationError;

try {
  const { PrismaClient } = require("@prisma/client");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter,
      log: ["warn", "error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
} catch (error) {
  initializationError = error;
  console.error("Prisma initialization failed:", error);
  prisma = new Proxy(
    {},
    {
      get() {
        throw initializationError;
      },
    }
  );
}

module.exports = prisma;
