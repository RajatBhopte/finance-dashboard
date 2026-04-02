require("dotenv").config();

const express = require("express");
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const transactionRoutes = require("./src/routes/transactions");
const dashboardRoutes = require("./src/routes/dashboard");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Finance backend is running.",
  });
});
app.get("/" , (req, res) => {
  res.send("Welcome to the Finance Backend API!");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
