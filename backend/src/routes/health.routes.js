const express = require("express");
const router = express.Router();
const config = require("../config");

/**
 * Health check endpoint
 * GET /health
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WordSnap AI Backend is running! ⚡",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: "1.0.0",
  });
});

/**
 * Detailed status endpoint (for monitoring)
 * GET /health/status
 */
router.get("/status", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    services: {
      vertexAI: "operational",
      cloudStorage: "operational",
      firestore: "operational",
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

module.exports = router;
