const Logger = require("../utils/logger");

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  Logger.error("Unhandled error", err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  // Default error
  let statusCode = 500;
  let message = "Internal server error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Unauthorized";
  } else if (err.message.includes("not found")) {
    statusCode = 404;
    message = err.message;
  } else if (err.message.includes("rate limit")) {
    statusCode = 429;
    message = "Too many requests. Please try again later.";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
        details: err,
      }),
    },
  });
};

/**
 * 404 handler for unknown routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
