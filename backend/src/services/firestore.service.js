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
        descriptions,
        tone,
      } = data;

      const generation = {
        userId,
        productName,
        productInfo,
        imageUrl,
        descriptions,
        tone,
        createdAt: Firestore.Timestamp.now(),
        updatedAt: Firestore.Timestamp.now(),
      };

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
}

// Export singleton instance
module.exports = new FirestoreService();
