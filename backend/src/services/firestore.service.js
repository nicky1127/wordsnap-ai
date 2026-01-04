const { Firestore } = require("@google-cloud/firestore");
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
        await userRef.set({
          email,
          displayName: displayName || "",
          role: "user",
          tier: "free",
          status: "active",
          authProvider,
          totalGenerations: 0,
          monthlyUsed: 0, // NEW - track monthly usage
          monthlyResetAt: Firestore.FieldValue.serverTimestamp(), // NEW - when was it last reset
          createdAt: Firestore.FieldValue.serverTimestamp(),
          lastLoginAt: Firestore.FieldValue.serverTimestamp(),
        });

        Logger.info("User initialized", { userId, email });
      } else {
        // Update last login
        await this.updateUserLogin(userId, authProvider);

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
        // No reset date, set it to now
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
   * Increment user's generation counters
   */
  async incrementUserGenerations(userId) {
    try {
      const userRef = this.db.collection("users").doc(userId);

      await userRef.update({
        totalGenerations: Firestore.FieldValue.increment(1),
        monthlyUsed: Firestore.FieldValue.increment(1), // NEW - increment monthly counter
      });

      Logger.debug("User generation count incremented", { userId });
    } catch (error) {
      Logger.error("Failed to increment generations", error);
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
        agency: -1, // unlimited
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
   * Save generated description to Firestore
   * @param {object} data - Generation data
   * @returns {Promise<object>} Saved document
   */
  async saveGeneration(data) {
    try {
      const {
        userId = "anonymous",
        productName,
        productInfo,
        imageUrl,
        imageUrls,
        descriptions,
        tone,
        condition = "new", // NEW
        quantity = "multiple", // NEW
      } = data;

      const generation = {
        userId,
        productName,
        productInfo,
        imageUrl,
        imageUrls,
        descriptions,
        tone,
        condition, // NEW
        quantity, // NEW
        createdAt: Firestore.Timestamp.now(),
        updatedAt: Firestore.Timestamp.now(),
      };

      // ... rest stays the same

      const docRef = await this.db.collection("generations").add(generation);

      Logger.info("Generation saved to Firestore", {
        docId: docRef.id,
        userId,
        productName,
      });

      return {
        id: docRef.id,
        ...generation,
      };
    } catch (error) {
      Logger.error("Failed to save generation", error);
      throw new Error(`Firestore save failed: ${error.message}`);
    }
  }

  /**
   * Get user's generation history
   * @param {string} userId - User ID
   * @param {number} limit - Number of results
   * @returns {Promise<array>} User generations
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
   * @param {string} generationId - Generation document ID
   * @returns {Promise<object>} Generation data
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
   * Track user usage for rate limiting
   * @param {string} userId - User ID
   * @returns {Promise<object>} Usage stats
   */
  async trackUsage(userId) {
    try {
      const userRef = this.db.collection("users").doc(userId);
      const doc = await userRef.get();

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!doc.exists) {
        // Create new user document
        const userData = {
          userId,
          usage: {
            [currentMonth]: 1,
          },
          totalGenerations: 1,
          createdAt: Firestore.Timestamp.now(),
          updatedAt: Firestore.Timestamp.now(),
        };

        await userRef.set(userData);
        return userData;
      }

      // Update existing user
      const userData = doc.data();
      const currentUsage = userData.usage?.[currentMonth] || 0;

      await userRef.update({
        [`usage.${currentMonth}`]: currentUsage + 1,
        totalGenerations: Firestore.FieldValue.increment(1),
        updatedAt: Firestore.Timestamp.now(),
      });

      return {
        userId,
        monthlyUsage: currentUsage + 1,
        totalGenerations: (userData.totalGenerations || 0) + 1,
      };
    } catch (error) {
      Logger.error("Failed to track usage", error, { userId });
      throw new Error(`Usage tracking failed: ${error.message}`);
    }
  }

  /**
   * Get user's current month usage
   * @param {string} userId - User ID
   * @returns {Promise<number>} Usage count
   */
  async getUserMonthlyUsage(userId) {
    try {
      const doc = await this.db.collection("users").doc(userId).get();

      if (!doc.exists) {
        return 0;
      }

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
      const userData = doc.data();

      return userData.usage?.[currentMonth] || 0;
    } catch (error) {
      Logger.error("Failed to get user usage", error, { userId });
      return 0;
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
   * Initialize user document on first login
   */
  async initializeUser(userId, email, displayName, authProvider) {
    try {
      const userRef = this.db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          email,
          displayName: displayName || "",
          role: "user",
          tier: "free",
          status: "active",
          authProvider,
          totalGenerations: 0,
          createdAt: Firestore.FieldValue.serverTimestamp(),
          lastLoginAt: Firestore.FieldValue.serverTimestamp(),
        });

        Logger.info("User initialized", { userId, email });
      } else {
        // Update last login
        await this.updateUserLogin(userId, authProvider);
      }
    } catch (error) {
      Logger.error("Failed to initialize user", error);
    }
  }

  /**
   * Increment total generations count
   */
  async incrementUserGenerations(userId) {
    try {
      const userRef = this.db.collection("users").doc(userId);

      await userRef.update({
        totalGenerations: Firestore.FieldValue.increment(1),
      });

      Logger.debug("User generation count incremented", { userId });
    } catch (error) {
      Logger.error("Failed to increment generations", error);
    }
  }
}

// Export singleton instance
module.exports = new FirestoreService();
