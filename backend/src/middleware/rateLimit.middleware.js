const rateLimit = require("express-rate-limit");
const config = require("../config");
const Logger = require("../utils/logger");

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    Logger.warn("Rate limit exceeded", {
      ip: req.ip,
      url: req.url,
    });

    res.status(429).json({
      success: false,
      error: {
        message: "Too many requests. Please try again later.",
        retryAfter: req.rateLimit.resetTime,
      },
    });
  },
});

/**
 * Strict rate limiter for generation endpoints
 * (More restrictive for AI API calls)
 */
const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes (for free tier)
  message: {
    success: false,
    error: {
      message:
        "Generation limit reached. Please upgrade your plan or try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for premium users (we'll implement this in Phase 4)
    // For now, apply to everyone
    return false;
  },
  handler: (req, res) => {
    Logger.warn("Generation rate limit exceeded", {
      ip: req.ip,
      userId: req.user?.uid || "anonymous",
    });

    res.status(429).json({
      success: false,
      error: {
        message:
          "You've hit your generation limit. Upgrade for unlimited generations! ⚡",
        retryAfter: req.rateLimit.resetTime,
        upgradeUrl: "/pricing", // We'll create this in frontend
      },
    });
  },
});

module.exports = {
  apiLimiter,
  generationLimiter,
};
