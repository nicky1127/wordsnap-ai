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
 * Generate product description from multiple images
 * POST /api/generate
 */
router.post(
  "/",
  authenticate,
  generationLimiter,
  upload.array("images", 5),
  async (req, res, next) => {
    try {
      // Validate request
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: "No image files provided" },
        });
      }
      const { productName, category, specs, tone, condition, quantity } =
        req.body;

      if (!productName) {
        return res.status(400).json({
          success: false,
          error: { message: "Product name is required" },
        });
      }

      Logger.info("Generation request received", {
        userId: req.user.uid,
        productName,
        category,
        tone,
        imageCount: req.files.length,
        totalSize: req.files.reduce((sum, f) => sum + f.size, 0),
      });

      // Upload all images to Cloud Storage
      const uploadPromises = req.files.map((file) =>
        storageService.uploadImage(
          file.buffer,
          file.originalname,
          file.mimetype
        )
      );
      const uploadResults = await Promise.all(uploadPromises);

      // Convert all images to base64 for Vertex AI
      const imageBase64Array = req.files.map((file) =>
        storageService.bufferToBase64(file.buffer)
      );

      // Generate descriptions using Vertex AI (with all images)
      const aiResult = await vertexAIService.generateProductDescription(
        imageBase64Array,
        {
          productName,
          category: category || "General",
          specs: specs || "",
          tone: tone || "professional",
          condition: condition || "new", // NEW
          quantity: quantity || "multiple", // NEW
        }
      );

      // Save generation to Firestore
      const savedGeneration = await firestoreService.saveGeneration({
        userId: req.user.uid,
        productName,
        productInfo: {
          category,
          specs,
        },
        imageUrls: uploadResults.map((r) => r.url),
        imageUrl: uploadResults[0].url,
        descriptions: aiResult.data,
        tone: tone || "professional",
        condition: condition || "new", // NEW
        quantity: quantity || "multiple", // NEW
      });
      // Track usage
      await firestoreService.trackUsage(req.user.uid);

      // Increment user's total generation count
      await firestoreService.incrementUserGenerations(req.user.uid);

      // Return response
      res.json({
        success: true,
        message: `Boom. Analyzed ${req.files.length} image${
          req.files.length > 1 ? "s" : ""
        }. Fresh copy ready! 💰`,
        data: {
          generationId: savedGeneration.id,
          imageUrls: uploadResults.map((r) => r.url),
          imageUrl: uploadResults[0].url,
          descriptions: aiResult.data,
          metadata: {
            ...aiResult.metadata,
            imageCount: req.files.length,
          },
        },
      });
    } catch (error) {
      Logger.error("Generation failed", error, {
        userId: req.user?.uid,
        productName: req.body?.productName,
      });

      next(error);
    }
  }
);

/**
 * Analyze product image (extract features)
 * POST /api/generate/analyze
 */
router.post(
  "/analyze",
  authenticate,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: "No image file provided" },
        });
      }

      Logger.info("Image analysis request received", {
        userId: req.user.uid,
        fileSize: req.file.size,
      });

      // Convert image to base64
      const imageBase64 = storageService.bufferToBase64(req.file.buffer);

      // Analyze image
      const analysis = await vertexAIService.analyzeProductImage(imageBase64);

      res.json({
        success: true,
        message: "Image analyzed successfully",
        data: analysis,
      });
    } catch (error) {
      Logger.error("Image analysis failed", error, {
        userId: req.user?.uid,
      });

      next(error);
    }
  }
);

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
