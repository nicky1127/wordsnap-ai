const { firestore } = require("../config/firebase");
const Logger = require("../utils/logger");
const Firestore = require("@google-cloud/firestore");

class AdminService {
  constructor() {
    this.db = firestore;
  }

  /**
   * Get all users with stats
   * @param {object} options - Pagination and filter options
   * @returns {Promise<array>} Users list
   */
  /**
   * Get all users with stats (optimized - read from user docs)
   */
  async getAllUsers(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      let query = this.db
        .collection("users")
        .orderBy(sortBy, sortOrder)
        .limit(limit);

      if (offset > 0) {
        const lastDoc = await this.db
          .collection("users")
          .orderBy(sortBy, sortOrder)
          .limit(offset)
          .get();

        if (!lastDoc.empty) {
          query = query.startAfter(lastDoc.docs[lastDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        return [];
      }

      // Build user objects directly from user documents
      const users = snapshot.docs.map((doc) => {
        const userData = doc.data();
        const uid = doc.id;

        return {
          uid,
          email: userData.email || "",
          displayName: userData.displayName || "",
          role: userData.role || "user",
          tier: userData.tier || "free",
          monthlyQuota: this.getTierQuota(userData.tier || "free"),
          monthlyUsed: userData.monthlyUsed || 0, // Read directly from user doc
          totalGenerations: userData.totalGenerations || 0, // Read directly from user doc
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate() || null,
          authProvider: userData.authProvider || "unknown",
          status: userData.status || "active",
          monthlyResetAt: userData.monthlyResetAt?.toDate() || null,
        };
      });

      Logger.info("Retrieved users list", { count: users.length });
      return users;
    } catch (error) {
      Logger.error("Failed to get users", error);
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }
  /**
   * Update user role
   */
  async updateUserRole(userId, role) {
    try {
      if (!["user", "admin"].includes(role)) {
        throw new Error('Invalid role. Must be "user" or "admin"');
      }

      await this.db.collection("users").doc(userId).set(
        {
          role,
          updatedAt: Firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      Logger.info("User role updated", { userId, role });
      return { success: true, userId, role };
    } catch (error) {
      Logger.error("Failed to update user role", error);
      throw new Error(`Failed to update role: ${error.message}`);
    }
  }

  /**
   * Update user tier
   */
  async updateUserTier(userId, tier) {
    try {
      const validTiers = ["free", "starter", "growth", "agency"];
      if (!validTiers.includes(tier)) {
        throw new Error("Invalid tier");
      }

      await this.db.collection("users").doc(userId).set(
        {
          tier,
          updatedAt: Firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      Logger.info("User tier updated", { userId, tier });
      return { success: true, userId, tier };
    } catch (error) {
      Logger.error("Failed to update user tier", error);
      throw new Error(`Failed to update tier: ${error.message}`);
    }
  }

  /**
   * Reset user monthly quota (without deleting generations)
   */
  async resetUserQuota(userId) {
    try {
      const userRef = this.db.collection("users").doc(userId);

      await userRef.update({
        monthlyUsed: 0,
        monthlyResetAt: Firestore.FieldValue.serverTimestamp(),
      });

      Logger.info("User quota reset", { userId });
      return { success: true, userId };
    } catch (error) {
      Logger.error("Failed to reset user quota", error);
      throw new Error(`Failed to reset quota: ${error.message}`);
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId, status) {
    try {
      if (!["active", "suspended"].includes(status)) {
        throw new Error('Invalid status. Must be "active" or "suspended"');
      }

      await this.db.collection("users").doc(userId).set(
        {
          status,
          updatedAt: Firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      Logger.info("User status updated", { userId, status });
      return { success: true, userId, status };
    } catch (error) {
      Logger.error("Failed to update user status", error);
      throw new Error(`Failed to update status: ${error.message}`);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Total users
      const usersSnapshot = await this.db.collection("users").count().get();
      const totalUsers = usersSnapshot.data().count;

      // Total generations (all time)
      const generationsSnapshot = await this.db
        .collection("generations")
        .count()
        .get();
      const totalGenerations = generationsSnapshot.data().count;

      // Today's generations
      const todayGenerations = await this.db
        .collection("generations")
        .where("createdAt", ">=", Firestore.Timestamp.fromDate(today))
        .count()
        .get();

      // This month's generations
      const monthGenerations = await this.db
        .collection("generations")
        .where("createdAt", ">=", Firestore.Timestamp.fromDate(thisMonth))
        .count()
        .get();

      // Active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const activeUsersSnapshot = await this.db
        .collection("users")
        .where("lastLoginAt", ">=", Firestore.Timestamp.fromDate(thirtyDaysAgo))
        .count()
        .get();

      // Calculate estimated costs
      const estimatedCost = this.calculateEstimatedCost(totalGenerations);

      return {
        totalUsers,
        totalGenerations,
        todayGenerations: todayGenerations.data().count,
        monthGenerations: monthGenerations.data().count,
        activeUsers: activeUsersSnapshot.data().count,
        estimatedCost,
        timestamp: new Date(),
      };
    } catch (error) {
      Logger.error("Failed to get dashboard stats", error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  /**
   * Get analytics data for charts
   */
  async getAnalytics(days = 30) {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const dailyStats = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

        const generationsSnapshot = await this.db
          .collection("generations")
          .where("createdAt", ">=", Firestore.Timestamp.fromDate(date))
          .where("createdAt", "<", Firestore.Timestamp.fromDate(nextDate))
          .count()
          .get();

        dailyStats.push({
          date: date.toISOString().split("T")[0],
          generations: generationsSnapshot.data().count,
          cost: this.calculateEstimatedCost(generationsSnapshot.data().count),
        });
      }

      return dailyStats;
    } catch (error) {
      Logger.error("Failed to get analytics", error);
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  /**
   * Log admin action
   */
  async logAdminAction(adminId, action, targetUserId, details = {}) {
    try {
      await this.db.collection("adminLogs").add({
        adminId,
        action,
        targetUserId,
        details,
        timestamp: Firestore.FieldValue.serverTimestamp(),
      });

      Logger.info("Admin action logged", { adminId, action, targetUserId });
    } catch (error) {
      Logger.error("Failed to log admin action", error);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit = 100) {
    try {
      const snapshot = await this.db
        .collection("adminLogs")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }));

      return logs;
    } catch (error) {
      Logger.error("Failed to get audit logs", error);
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }
  }

  /**
   * Get tier quota
   */
  getTierQuota(tier) {
    const quotas = {
      free: 10,
      starter: 200,
      growth: 1000,
      agency: -1, // unlimited
    };
    return quotas[tier] || 10;
  }

  /**
   * Calculate estimated API cost
   */
  calculateEstimatedCost(generationCount) {
    // Average cost per generation (Vertex AI + Storage + Firestore)
    const costPerGeneration = 0.002; // $0.002 per generation
    return generationCount * costPerGeneration;
  }
}

module.exports = new AdminService();
