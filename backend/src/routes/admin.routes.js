const express = require("express");
const router = express.Router();
const adminService = require("../services/admin.service");
const { authenticate } = require("../middleware/auth.middleware");
const Logger = require("../utils/logger");

/**
 * Middleware to check if user is admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    const { firestore } = require("../config/firebase");
    const userDoc = await firestore.collection("users").doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          message: "Admin access required",
          code: "FORBIDDEN",
        },
      });
    }

    next();
  } catch (error) {
    Logger.error("Admin check failed", error);
    res.status(500).json({
      success: false,
      error: { message: "Admin verification failed" },
    });
  }
};

/**
 * Get all users
 * GET /api/admin/users
 */
router.get("/users", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit, offset, sortBy, sortOrder } = req.query;

    const users = await adminService.getAllUsers({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
    });

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    Logger.error("Failed to get users", error);
    next(error);
  }
});

/**
 * Update user role
 * PATCH /api/admin/users/:userId/role
 */
router.patch(
  "/users/:userId/role",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          error: { message: "Role is required" },
        });
      }

      const result = await adminService.updateUserRole(userId, role);

      // Log admin action
      await adminService.logAdminAction(req.user.uid, "UPDATE_ROLE", userId, {
        newRole: role,
      });

      res.json({
        success: true,
        message: `User role updated to ${role}`,
        data: result,
      });
    } catch (error) {
      Logger.error("Failed to update user role", error);
      next(error);
    }
  }
);

/**
 * Update user tier
 * PATCH /api/admin/users/:userId/tier
 */
router.patch(
  "/users/:userId/tier",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { tier } = req.body;

      if (!tier) {
        return res.status(400).json({
          success: false,
          error: { message: "Tier is required" },
        });
      }

      const result = await adminService.updateUserTier(userId, tier);

      await adminService.logAdminAction(req.user.uid, "UPDATE_TIER", userId, {
        newTier: tier,
      });

      res.json({
        success: true,
        message: `User tier updated to ${tier}`,
        data: result,
      });
    } catch (error) {
      Logger.error("Failed to update user tier", error);
      next(error);
    }
  }
);

/**
 * Reset user monthly quota
 * POST /api/admin/users/:userId/reset-quota
 */
router.post(
  "/users/:userId/reset-quota",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      const result = await adminService.resetUserQuota(userId);

      await adminService.logAdminAction(req.user.uid, "RESET_QUOTA", userId, {
        deletedCount: result.deletedCount,
      });

      res.json({
        success: true,
        message: "User quota reset successfully",
        data: result,
      });
    } catch (error) {
      Logger.error("Failed to reset user quota", error);
      next(error);
    }
  }
);

/**
 * Update user status
 * PATCH /api/admin/users/:userId/status
 */
router.patch(
  "/users/:userId/status",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: { message: "Status is required" },
        });
      }

      const result = await adminService.updateUserStatus(userId, status);

      await adminService.logAdminAction(req.user.uid, "UPDATE_STATUS", userId, {
        newStatus: status,
      });

      res.json({
        success: true,
        message: `User status updated to ${status}`,
        data: result,
      });
    } catch (error) {
      Logger.error("Failed to update user status", error);
      next(error);
    }
  }
);

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    Logger.error("Failed to get dashboard stats", error);
    next(error);
  }
});

/**
 * Get analytics data
 * GET /api/admin/analytics
 */
router.get("/analytics", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { days } = req.query;
    const analytics = await adminService.getAnalytics(parseInt(days) || 30);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    Logger.error("Failed to get analytics", error);
    next(error);
  }
});

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
router.get(
  "/audit-logs",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { limit } = req.query;
      const logs = await adminService.getAuditLogs(parseInt(limit) || 100);

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      Logger.error("Failed to get audit logs", error);
      next(error);
    }
  }
);

module.exports = router;
