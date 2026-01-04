const Firestore = require("@google-cloud/firestore");
const config = require("../config");
const Logger = require("../utils/logger");

class FirestoreService {
  constructor() {
    this.db = new Firestore({
      projectId: config.gcp.projectId,
    });

    Logger.info("Firestore Service initialized");
  }

  /**
   * Initialize user document on first login
   */
  async initializeUser(userId, email, displayName, authProvider) {
    try {
      const userRef = this.db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // New user - create full document
        await userRef.set({
          email,
          displayName: displayName || "",
          role: "user",
          tier: "free",
          status: "active",
          authProvider,
          totalGenerations: 0,
          monthlyUsed: 0,
          monthlyResetAt: Firestore.FieldValue.serverTimestamp(),
          createdAt: Firestore.FieldValue.serverTimestamp(),
          lastLoginAt: Firestore.FieldValue.serverTimestamp(),
        });

        Logger.info("User initialized", { userId, email });
      } else {
        // Existing user - update login and ensure fields exist
        const userData = userDoc.data();
        const updates = {
          lastLoginAt: Firestore.FieldValue.serverTimestamp(),
        };

        // Add missing fields if they don't exist
        if (userData.monthlyUsed === undefined) {
          updates.monthlyUsed = 0;
        }
        if (userData.monthlyResetAt === undefined) {
          updates.monthlyResetAt = Firestore.FieldValue.serverTimestamp();
        }
        if (userData.totalGenerations === undefined) {
          updates.totalGenerations = 0;
        }

        await userRef.update(updates);

        // Check if we need to reset monthly usage (new month)
        await this.checkAndResetMonthlyUsage(userId);
      }
    } catch (error) {
      Logger.error("Failed to initialize user", error);
    }
  }

  /**
   * Check if monthly usage should be reset (new month)
   */
  async checkAndResetMonthlyUsage(userId) {
    try {
      const userRef = this.db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) return;

      const userData = userDoc.data();
      const monthlyResetAt = userData.monthlyResetAt?.toDate();

      if (!monthlyResetAt) {
        await userRef.update({
          monthlyResetAt: Firestore.FieldValue.serverTimestamp(),
          monthlyUsed: 0,
        });
        return;
      }

      // Check if it's a new month
      const now = new Date();
      const resetDate = new Date(monthlyResetAt);

      if (
        now.getMonth() !== resetDate.getMonth() ||
        now.getFullYear() !== resetDate.getFullYear()
      ) {
        // New month! Reset usage
        await userRef.update({
          monthlyUsed: 0,
          monthlyResetAt: Firestore.FieldValue.serverTimestamp(),
        });

        Logger.info("Monthly usage auto-reset", { userId });
      }
    } catch (error) {
      Logger.error("Failed to check monthly reset", error);
    }
  }

  /**
   * Update user login data
   */
  async updateUserLogin(userId, authProvider = "unknown") {
    try {
      const userRef = this.db.collection("users").doc(userId);

      await userRef.set(
        {
          lastLoginAt: Firestore.FieldValue.serverTimestamp(),
          authProvider,
          updatedAt: Firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      Logger.debug("User login updated", { userId });
    } catch (error) {
      Logger.error("Failed to update user login", error);
    }
  }

  /**
   * Increment user's generation counters
   */
  async incrementUserGenerations(userId) {
    try {
      Logger.info("Attempting to increment user generations", { userId });

      const userRef = this.db.collection("users").doc(userId);

      // Check if user exists first
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        Logger.error("User document not found when incrementing", { userId });
        throw new Error("User document not found");
      }

      const before = userDoc.data();
      Logger.debug("User data before increment", {
        userId,
        monthlyUsed: before.monthlyUsed,
        totalGenerations: before.totalGenerations,
      });

      await userRef.update({
        totalGenerations: Firestore.FieldValue.increment(1),
        monthlyUsed: Firestore.FieldValue.increment(1),
      });

      // Verify the increment worked
      const afterDoc = await userRef.get();
      const after = afterDoc.data();
      Logger.info("User generation count incremented successfully", {
        userId,
        before: {
          monthlyUsed: before.monthlyUsed || 0,
          totalGenerations: before.totalGenerations || 0,
        },
        after: {
          monthlyUsed: after.monthlyUsed || 0,
          totalGenerations: after.totalGenerations || 0,
        },
      });
    } catch (error) {
      Logger.error("Failed to increment generations", error, { userId });
      throw error;
    }
  }

  /**
   * Get user's current usage stats
   */
  async getUserUsageStats(userId) {
    try {
      const userRef = this.db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return {
          monthlyUsed: 0,
          monthlyQuota: 10,
          totalGenerations: 0,
          tier: "free",
        };
      }

      const userData = userDoc.data();
      const tier = userData.tier || "free";

      const quotas = {
        free: 10,
        starter: 200,
        growth: 1000,
        agency: -1,
      };

      return {
        monthlyUsed: userData.monthlyUsed || 0,
        monthlyQuota: quotas[tier],
        totalGenerations: userData.totalGenerations || 0,
        tier,
      };
    } catch (error) {
      Logger.error("Failed to get user usage stats", error);
      throw error;
    }
  }

  /**
   * Save generation to Firestore
   */
  async saveGeneration(data) {
    try {
      const {
        userId,
        productName,
        category,
        specs,
        tone,
        condition,
        quantity,
        descriptions,
        imageUrls,
      } = data;

      // Validate required fields
      if (!userId) {
        throw new Error("userId is required");
      }
      if (!productName) {
        throw new Error("productName is required");
      }

      // Build clean document (no undefined values)
      const generationData = {
        userId,
        productName,
        category: category || "",
        specs: specs || "",
        tone: tone || "professional",
        condition: condition || "new",
        quantity: quantity || "multiple",
        descriptions: {
          short: descriptions?.short || "",
          medium: descriptions?.medium || "",
          long: descriptions?.long || "",
          bullets: Array.isArray(descriptions?.bullets)
            ? descriptions.bullets
            : [],
          keywords: Array.isArray(descriptions?.keywords)
            ? descriptions.keywords
            : [],
        },
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        createdAt: Firestore.FieldValue.serverTimestamp(),
      };

      Logger.debug("Saving generation to Firestore", {
        userId,
        productName,
      });

      const docRef = await this.db
        .collection("generations")
        .add(generationData);

      Logger.info("Generation saved to Firestore", {
        generationId: docRef.id,
        userId,
      });

      return {
        id: docRef.id,
        ...generationData,
      };
    } catch (error) {
      Logger.error("Failed to save generation", error);
      throw new Error(`Firestore save failed: ${error.message}`);
    }
  }

  /**
   * Get user's generation history
   */
  async getUserGenerations(userId, limit = 20) {
    try {
      const snapshot = await this.db
        .collection("generations")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const generations = [];
      snapshot.forEach((doc) => {
        generations.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      Logger.info("Retrieved user generations", {
        userId,
        count: generations.length,
      });

      return generations;
    } catch (error) {
      Logger.error("Failed to get user generations", error, { userId });
      throw new Error(`Firestore query failed: ${error.message}`);
    }
  }

  /**
   * Get generation by ID
   */
  async getGeneration(generationId) {
    try {
      const doc = await this.db
        .collection("generations")
        .doc(generationId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      Logger.error("Failed to get generation", error, { generationId });
      throw new Error(`Firestore get failed: ${error.message}`);
    }
  }

  /**
   * Get user's current month usage (LEGACY - kept for backwards compatibility)
   */
  async getUserMonthlyUsage(userId) {
    try {
      const userRef = this.db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return 0;
      }

      const userData = userDoc.data();
      return userData.monthlyUsed || 0;
    } catch (error) {
      Logger.error("Failed to get user monthly usage", error, { userId });
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new FirestoreService();
