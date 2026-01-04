const express = require("express");
const router = express.Router();
const multer = require("multer");
const vertexAIService = require("../services/vertexAI.service");
const storageService = require("../services/storage.service");
const firestoreService = require("../services/firestore.service");
const { authenticate } = require("../middleware/auth.middleware");
const { generationLimiter } = require("../middleware/rateLimit.middleware");
const Logger = require("../utils/logger");

// Configure multer for multiple file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

/**
 * Generate product descriptions
 * POST /api/generate
 */
router.post(
  "/",
  authenticate,
  generationLimiter,
  upload.array("images", 5),
  async (req, res, next) => {
    try {
      const { productName, category, specs, tone, condition, quantity } =
        req.body;

      // Validation
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: "At least one product image is required" },
        });
      }

      if (!productName) {
        return res.status(400).json({
          success: false,
          error: { message: "Product name is required" },
        });
      }

      Logger.info("Generation request received", {
        userId: req.user.uid,
        productName,
        imageCount: req.files.length,
      });

      // Upload images to Cloud Storage
      const imageBase64Array = [];
      const publicUrls = [];

      for (const file of req.files) {
        const base64 = storageService.bufferToBase64(file.buffer);
        imageBase64Array.push(base64);

        const uploadResult = await storageService.uploadImage(
          file.buffer,
          req.user.uid,
          file.originalname
        );

        // Extract just the URL string (FIX: was pushing whole object before)
        publicUrls.push(uploadResult.url);
      }

      Logger.debug("Images uploaded", {
        count: publicUrls.length,
        urls: publicUrls,
      });

      // Generate descriptions using Vertex AI
      const result = await vertexAIService.generateProductDescription(
        imageBase64Array,
        {
          productName,
          category,
          specs,
          tone: tone || "professional",
          condition: condition || "new",
          quantity: quantity || "multiple",
        }
      );

      if (!result.success) {
        throw new Error("Failed to generate descriptions");
      }

      const descriptions = result.data;

      // Save to Firestore
      const generationDoc = await firestoreService.saveGeneration({
        userId: req.user.uid,
        productName,
        category,
        specs,
        tone: tone || "professional",
        condition: condition || "new",
        quantity: quantity || "multiple",
        descriptions,
        imageUrls: publicUrls, // Now this is an array of strings, not objects!
      });

      // CRITICAL: Increment user's generation counters
      try {
        await firestoreService.incrementUserGenerations(req.user.uid);
        Logger.info("User generation count incremented", {
          userId: req.user.uid,
        });
      } catch (incrementError) {
        // Log error but don't fail the request
        Logger.error("Failed to increment user generations", incrementError, {
          userId: req.user.uid,
          generationId: generationDoc.id,
        });
      }

      Logger.info("Description generated successfully", {
        userId: req.user.uid,
        generationId: generationDoc.id,
        productName,
      });

      res.json({
        success: true,
        data: {
          id: generationDoc.id,
          descriptions,
          imageUrls: publicUrls,
          metadata: result.metadata,
        },
        message: "Product descriptions generated successfully",
      });
    } catch (error) {
      Logger.error("Generation failed", error, {
        userId: req.user?.uid,
      });
      next(error);
    }
  }
);
/**
 * Analyze product image (extract features) - PUBLIC DEMO
 * POST /api/generate/analyze
 */
router.post("/analyze", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: "No image file provided" },
      });
    }

    Logger.info("Image analysis request received (public demo)", {
      fileSize: req.file.size,
      fileName: req.file.originalname,
    });

    // Convert image to base64
    const imageBase64 = storageService.bufferToBase64(req.file.buffer);

    // Analyze image
    const analysis = await vertexAIService.analyzeProductImage(imageBase64);

    Logger.info("Image analysis complete (public demo)", {
      hasCategory: !!analysis.category,
      hasColors: !!analysis.colors,
      hasFeatures: !!analysis.features,
    });

    res.json({
      success: true,
      message: "Image analyzed successfully",
      data: analysis,
    });
  } catch (error) {
    Logger.error("Image analysis failed", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to analyze image. Please try again.",
      },
    });
  }
});

/**
 * Get user's generation history
 * GET /api/generate/history
 */
router.get("/history", authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const generations = await firestoreService.getUserGenerations(
      req.user.uid,
      limit
    );

    res.json({
      success: true,
      data: generations,
      count: generations.length,
    });
  } catch (error) {
    Logger.error("Failed to get generation history", error, {
      userId: req.user?.uid,
    });

    next(error);
  }
});

/**
 * Get current user's usage stats
 * GET /api/generate/usage/stats
 */
router.get("/usage/stats", authenticate, async (req, res, next) => {
  try {
    const stats = await firestoreService.getUserUsageStats(req.user.uid);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    Logger.error("Failed to get usage stats", error);
    next(error);
  }
});

/**
 * Get specific generation by ID
 * GET /api/generate/:id
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const generation = await firestoreService.getGeneration(req.params.id);

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: { message: "Generation not found" },
      });
    }

    // Check if user owns this generation
    if (generation.userId !== req.user.uid && req.user.uid !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: "Access denied" },
      });
    }

    res.json({
      success: true,
      data: generation,
    });
  } catch (error) {
    Logger.error("Failed to get generation", error, {
      generationId: req.params.id,
    });

    next(error);
  }
});

/**
 * Get user's current usage stats
 * GET /api/generate/usage/stats
 */
router.get("/usage/stats", authenticate, async (req, res, next) => {
  try {
    const monthlyUsage = await firestoreService.getUserMonthlyUsage(
      req.user.uid
    );

    // Define tier limits
    const tierLimits = {
      free: 10,
      starter: 200,
      growth: 1000,
      agency: -1, // unlimited
    };

    const userTier = req.user.tier || "free";
    const limit = tierLimits[userTier];

    res.json({
      success: true,
      data: {
        currentUsage: monthlyUsage,
        limit: limit === -1 ? "unlimited" : limit,
        remaining:
          limit === -1 ? "unlimited" : Math.max(0, limit - monthlyUsage),
        tier: userTier,
        resetDate: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          1
        ),
      },
    });
  } catch (error) {
    Logger.error("Failed to get usage stats", error, {
      userId: req.user?.uid,
    });

    next(error);
  }
});

module.exports = router;
