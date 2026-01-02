const Logger = require("../utils/logger");

/**
 * Authentication middleware (placeholder for Phase 4)
 * For now, this just extracts userId from header or assigns 'anonymous'
 */
const authenticate = async (req, res, next) => {
  try {
    // For Phase 2-3, we'll use a simple userId from header
    // In Phase 4, we'll implement Firebase Auth token verification

    const userId = req.headers["x-user-id"] || "anonymous";

    req.user = {
      uid: userId,
      tier: "free", // Will be determined by Stripe subscription in Phase 5
    };

    Logger.debug("User authenticated", { userId });
    next();
  } catch (error) {
    Logger.error("Authentication failed", error);

    res.status(401).json({
      success: false,
      error: {
        message: "Authentication required",
      },
    });
  }
};

/**
 * Check if user has permission for certain features
 * (Placeholder for tier-based access control)
 */
const checkTier = (requiredTier) => {
  return (req, res, next) => {
    const userTier = req.user?.tier || "free";

    const tiers = ["free", "starter", "growth", "agency"];
    const userTierLevel = tiers.indexOf(userTier);
    const requiredTierLevel = tiers.indexOf(requiredTier);

    if (userTierLevel >= requiredTierLevel) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: {
          message: `This feature requires ${requiredTier} tier or higher`,
          upgradeUrl: "/pricing",
        },
      });
    }
  };
};

module.exports = {
  authenticate,
  checkTier,
};
