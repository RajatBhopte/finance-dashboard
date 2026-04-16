require("dotenv").config();

const express = require("express");
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const dashboardRoutes = require("./src/routes/dashboard");
const errorHandler = require("./src/middleware/errorHandler");
const { apiLimiter } = require("./src/middleware/rateLimiter");
const connectDB = require("./src/config/db");
const cors = require("cors");

const corsOptions = { origin: "*", optionsSuccessStatus: 200 };
const app = express();
app.use(cors(corsOptions));
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
// const resolveDns = util.promisify(dns.resolve);


const port = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === "1";
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}

if (isVercel) {
  app.set("trust proxy", 1);
  connectDB().catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "User management backend is running.",
  });
});
app.get("/", (req, res) => {
  res.send("Welcome to the User Management Backend API!");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

app.use(errorHandler);

if (!isVercel) {
  const startServer = async () => {
    try {
      await connectDB();
      console.log("MongoDB connected successfully.");
      app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error.message);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = app;
