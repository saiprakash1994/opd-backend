const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Load environment variables BEFORE loading any config that reads them
dotenv.config();

const connectDB = require("./config/db");
const appConfig = require("./config/config");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const visitRoutes = require("./routes/visitRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
// Validate env and load config (throws if required vars missing)
// Note: connectDB likely uses MONGO_URI
connectDB();

const app = express();

// Security and performance middlewares
app.use(helmet());
app.use(compression());
app.use(
    cors({
        origin: (appConfig.corsOrigin || "*").split(","),
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Content-Length"],
    })
);

// Basic rate limiting to protect APIs
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
});
app.use(limiter);

// Logging in dev
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Healthcheck
app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => res.send("API is running..."));

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    const response = { error: message };
    if (process.env.NODE_ENV !== "production" && err.stack) {
        response.stack = err.stack;
    }
    res.status(status).json(response);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
