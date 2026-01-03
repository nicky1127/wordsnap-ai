const { auth } = require("../config/firebase");
const Logger = require("../utils/logger");

/**
 * Verify Firebase Auth token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          message: "No authentication token provided",
          code: "NO_TOKEN",
        },
      });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify the token with Firebase
    const decodedToken = await auth.verifyIdToken(token);

    // Get user details
    const userRecord = await auth.getUser(decodedToken.uid);

    // Attach user to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: userRecord.displayName || decodedToken.email,
      photoURL: userRecord.photoURL,
      emailVerified: decodedToken.email_verified,
      tier: "free", // Default tier (will be updated from Firestore in Phase 5)
    };

    Logger.debug("User authenticated", {
      uid: req.user.uid,
      email: req.user.email,
    });

    next();
  } catch (error) {
    Logger.error("Authentication failed", error, {
      errorCode: error.code,
    });

    // Handle specific error types
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        error: {
          message: "Authentication token expired. Please sign in again.",
          code: "TOKEN_EXPIRED",
        },
      });
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid authentication token",
          code: "INVALID_TOKEN",
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        message: "Authentication failed",
        code: "AUTH_FAILED",
      },
    });
  }
};

/**
 * Optional authentication - sets user if token present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token, continue as anonymous
      req.user = null;
      return next();
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decodedToken.uid);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: userRecord.displayName || decodedToken.email,
      photoURL: userRecord.photoURL,
      emailVerified: decodedToken.email_verified,
      tier: "free",
    };

    next();
  } catch (error) {
    // If token is invalid, treat as anonymous
    req.user = null;
    next();
  }
};

/**
 * Check if user has permission for certain features
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
  optionalAuth,
  checkTier,
};
