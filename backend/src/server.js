const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const Logger = require("./utils/logger");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler.middleware");
const { apiLimiter } = require("./middleware/rateLimit.middleware");

// Import routes
const healthRoutes = require("./routes/health.routes");
const generateRoutes = require("./routes/generate.routes");
const adminRoutes = require("./routes/admin.routes");

// Initialize Firebase Admin (IMPORTANT - do this early)
require("./config/firebase");

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.cors.origin, // From .env
      "http://localhost:5173", // Local development
      "http://localhost:4173", // Local preview
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Apply rate limiting to all routes
app.use(apiLimiter);

// Routes
app.use("/health", healthRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/admin", adminRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to WordSnap AI API! ⚡",
    version: "1.0.0",
    docs: "/health",
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  Logger.info("WordSnap AI Backend started", {
    port: PORT,
    environment: config.nodeEnv,
    gcp: {
      project: config.gcp.projectId,
      region: config.gcp.region,
    },
  });

  console.log(`
╔═══════════════════════════════════════╗
║   WordSnap AI Backend Server         ║
║   Status: Running ⚡                  ║
║   Port: ${PORT}                        ║
║   Environment: ${config.nodeEnv}       ║
║   GCP Project: ${config.gcp.projectId} ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  Logger.info("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  Logger.info("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

module.exports = app;
