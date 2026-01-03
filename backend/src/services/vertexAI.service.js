const { VertexAI } = require("@google-cloud/vertexai");
const config = require("../config");
const Logger = require("../utils/logger");

class VertexAIService {
  constructor() {
    this.vertexAI = new VertexAI({
      project: config.gcp.projectId,
      location: config.vertexAI.location,
    });

    this.model = config.vertexAI.model;
    Logger.info("VertexAI Service initialized", {
      model: this.model,
      location: config.vertexAI.location,
    });
  }

  /**
   * Generate product description from multiple images and product info
   * @param {string|array} imageBase64 - Base64 encoded image(s)
   * @param {object} productInfo - Product details
   * @returns {Promise<object>} Generated descriptions
   */
  async generateProductDescription(imageBase64, productInfo) {
    const MAX_RETRIES = 2;
    let attempt = 0;
    let lastError = null;

    while (attempt < MAX_RETRIES) {
      try {
        const {
          productName,
          category,
          specs,
          tone = "professional",
          condition = "new",
          quantity = "multiple",
        } = productInfo;

        const imageArray = Array.isArray(imageBase64)
          ? imageBase64
          : [imageBase64];

        const prompt = this._buildPrompt(
          productName,
          category,
          specs,
          tone,
          imageArray.length,
          condition,
          quantity
        );

        Logger.debug("Generating description", {
          productName,
          category,
          tone,
          condition,
          imageCount: imageArray.length,
          attempt: attempt + 1,
          promptLength: prompt.length,
        });

        // Configure model with INCREASED limits
        const generativeModel = this.vertexAI.preview.getGenerativeModel({
          model: this.model,
          generationConfig: {
            maxOutputTokens: 4096, // DOUBLED - allows full long descriptions
            temperature: attempt === 0 ? 0.7 : 0.8,
            topP: 0.9,
          },
        });

        // Create image parts
        const imageParts = imageArray.map((base64) => ({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64,
          },
        }));

        const textPart = {
          text: prompt,
        };

        const request = {
          contents: [{ role: "user", parts: [...imageParts, textPart] }],
        };

        Logger.info("Sending request to Vertex AI", {
          imageCount: imageArray.length,
          promptLength: prompt.length,
          maxTokens: 4096,
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Request timeout after 120 seconds")),
            120000
          );
        });

        const generationPromise = generativeModel.generateContent(request);

        // Race between generation and timeout
        const result = await Promise.race([generationPromise, timeoutPromise]);

        const response = result.response;

        if (!response || !response.candidates || !response.candidates[0]) {
          throw new Error("Invalid response from Vertex AI");
        }

        const generatedText = response.candidates[0].content.parts[0].text;

        Logger.info("Received response from Vertex AI", {
          responseLength: generatedText.length,
          attempt: attempt + 1,
        });

        // Parse the response
        const descriptions = this._parseResponse(generatedText);

        // Validate response
        const validation = this._validateResponse(descriptions);

        if (!validation.isValid) {
          Logger.warn("Incomplete AI response", {
            attempt: attempt + 1,
            missing: validation.missing,
            productName,
            responseLength: generatedText.length,
          });

          // Log the raw response for debugging
          Logger.debug("Raw AI response", {
            text: generatedText.substring(0, 500), // First 500 chars
          });

          if (attempt < MAX_RETRIES - 1) {
            attempt++;
            Logger.info("Retrying generation due to incomplete response", {
              attempt: attempt + 1,
              productName,
            });
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
            continue;
          } else {
            this._fillMissingParts(descriptions, productName, condition);
          }
        }

        Logger.info("Description generated successfully", {
          productName,
          tone,
          condition,
          imageCount: imageArray.length,
          attempt: attempt + 1,
          descriptionLengths: {
            short: descriptions.short?.length || 0,
            medium: descriptions.medium?.length || 0,
            long: descriptions.long?.length || 0,
            bullets: descriptions.bullets?.length || 0,
            keywords: descriptions.keywords?.length || 0,
          },
        });

        return {
          success: true,
          data: descriptions,
          metadata: {
            model: this.model,
            tone,
            condition,
            imageCount: imageArray.length,
            generatedAt: new Date().toISOString(),
            retries: attempt,
          },
        };
      } catch (error) {
        lastError = error;
        Logger.error("Failed to generate description", error, {
          productName: productInfo.productName,
          attempt: attempt + 1,
          errorMessage: error.message,
        });

        if (attempt < MAX_RETRIES - 1) {
          attempt++;
          Logger.info("Retrying after error", {
            attempt: attempt + 1,
            productName: productInfo.productName,
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        throw new Error(
          `Vertex AI generation failed after ${attempt + 1} attempts: ${
            error.message
          }`
        );
      }
    }

    throw lastError || new Error("Generation failed");
  }

  /**
   * Validate that AI response has all required parts
   * @private
   */
  _validateResponse(descriptions) {
    const missing = [];

    if (!descriptions.short || descriptions.short.length < 30) {
      missing.push("short description");
    }
    if (!descriptions.medium || descriptions.medium.length < 100) {
      missing.push("medium description");
    }
    if (!descriptions.long || descriptions.long.length < 200) {
      missing.push("long description");
    }
    if (!descriptions.bullets || descriptions.bullets.length < 3) {
      missing.push("feature bullets");
    }
    if (!descriptions.keywords || descriptions.keywords.length < 3) {
      missing.push("keywords");
    }

    return {
      isValid: missing.length === 0,
      missing,
    };
  }

  /**
   * Fill in missing parts with fallback content
   * @private
   */
  _fillMissingParts(descriptions, productName, condition) {
    const isUsed = condition !== "new";

    if (!descriptions.short || descriptions.short.length < 30) {
      descriptions.short =
        descriptions.medium?.substring(0, 150) ||
        descriptions.long?.substring(0, 150) ||
        `${isUsed ? "Pre-owned" : "Quality"} ${productName} ${
          isUsed ? "in good condition" : "available now"
        }. ${
          isUsed
            ? "Well-maintained and fully functional."
            : "Great features and reliable performance."
        }`;
    }

    if (!descriptions.medium || descriptions.medium.length < 100) {
      descriptions.medium =
        descriptions.long?.substring(0, 300) ||
        descriptions.short ||
        `This ${productName} ${
          isUsed
            ? "is a pre-owned item in good working condition"
            : "offers excellent quality and performance"
        }. ${
          isUsed
            ? "It has been well-maintained and shows normal signs of use."
            : "Perfect for those looking for reliable functionality."
        } ${
          isUsed
            ? "Sold as-is with honest description."
            : "Available for immediate purchase."
        }`;
    }

    if (!descriptions.long || descriptions.long.length < 200) {
      descriptions.long =
        (descriptions.medium || descriptions.short || "") +
        `\n\nThis ${productName} ${
          isUsed
            ? "is being sold by its original owner"
            : "is available for purchase"
        }. ${
          isUsed
            ? "The item has been carefully maintained and remains in functional condition. While it shows normal wear from use, it continues to perform as expected."
            : "It represents excellent value with its combination of features and quality construction."
        } ${
          isUsed
            ? "Please review the photos carefully for condition details. Sale includes the item as shown."
            : "Perfect for anyone seeking a reliable solution."
        } ${
          isUsed
            ? "This is a one-time sale - first come, first served."
            : "Purchase with confidence."
        }`;
    }

    if (!descriptions.bullets || descriptions.bullets.length < 3) {
      descriptions.bullets = [
        `${
          isUsed
            ? "Pre-owned item in good condition"
            : "Quality construction and materials"
        }`,
        `${isUsed ? "Fully functional and tested" : "Reliable performance"}`,
        `${
          isUsed
            ? "Well-maintained by original owner"
            : "Excellent value for money"
        }`,
        `${
          isUsed
            ? "Includes items as shown in photos"
            : "Ready for immediate use"
        }`,
        `${
          isUsed
            ? "Honest description with photo evidence"
            : "Perfect for everyday use"
        }`,
      ];
    }

    if (!descriptions.keywords || descriptions.keywords.length < 3) {
      const baseName = productName.toLowerCase();
      descriptions.keywords = [
        baseName,
        isUsed ? "used" : "new",
        isUsed ? "pre-owned" : "quality",
        isUsed ? "good condition" : "reliable",
        "affordable",
      ];
    }

    Logger.info("Filled missing parts with fallback content", {
      productName,
      condition,
    });
  }

  /**
   * Build the prompt for product description generation
   * @private
   */
  _buildPrompt(
    productName,
    category,
    specs,
    tone,
    imageCount,
    condition = "new",
    quantity = "multiple"
  ) {
    const toneInstructions = {
      professional: "Use professional, informative language.",
      casual: "Use friendly, conversational language.",
      luxury: "Use sophisticated, aspirational language.",
    };

    const imageContext =
      imageCount > 1
        ? `Analyze all ${imageCount} product images.`
        : `Analyze the product image.`;

    // Simplified condition instructions
    const isUsed = condition !== "new";
    const conditionNote = isUsed
      ? "This is a PRE-OWNED item. Be honest about condition. Focus on value and functionality."
      : "This is a NEW product. Focus on features and benefits.";

    const availabilityNote = isUsed
      ? "Single item for sale."
      : quantity === "single"
      ? "Single unit available."
      : "Multiple units available.";

    return `You are writing product descriptions for e-commerce.

${imageContext}

PRODUCT INFO:
- Name: ${productName}
- Category: ${category || "General"}
- Condition: ${conditionNote}
- Details: ${specs || "See images"}
- Availability: ${availabilityNote}
- Tone: ${toneInstructions[tone]}

TASK: Generate 3 product descriptions + bullets + keywords.

RULES:
1. SHORT = 50-80 words (punchy, for quick browse)
2. MEDIUM = 150-200 words (balanced, for listings)
3. LONG = 300-400 words (detailed, for conversions)
${
  isUsed
    ? "4. Be HONEST about condition - build trust\n5. Mention what's included"
    : "4. Highlight key features\n5. Emphasize benefits"
}

FORMAT (follow exactly):

SHORT:
[50-80 word description]

MEDIUM:
[150-200 word description]

LONG:
[300-400 word description]

BULLETS:
- [Feature/benefit 1]
- [Feature/benefit 2]
- [Feature/benefit 3]
- [Feature/benefit 4]
- [Feature/benefit 5]

KEYWORDS:
keyword1, keyword2, keyword3, keyword4, keyword5

Write compelling copy that converts. Start now:`;
  }

  /**
   * Parse the AI response into structured data
   * @private
   */
  _parseResponse(text) {
    const descriptions = {
      short: "",
      medium: "",
      long: "",
      bullets: [],
      keywords: [],
    };

    try {
      // Extract SHORT description
      const shortMatch = text.match(/SHORT:\s*([\s\S]*?)(?=MEDIUM:|$)/i);
      if (shortMatch) {
        descriptions.short = shortMatch[1].trim();
      }

      // Extract MEDIUM description
      const mediumMatch = text.match(/MEDIUM:\s*([\s\S]*?)(?=LONG:|$)/i);
      if (mediumMatch) {
        descriptions.medium = mediumMatch[1].trim();
      }

      // Extract LONG description
      const longMatch = text.match(/LONG:\s*([\s\S]*?)(?=BULLETS:|$)/i);
      if (longMatch) {
        descriptions.long = longMatch[1].trim();
      }

      // Extract BULLETS
      const bulletsMatch = text.match(/BULLETS:\s*([\s\S]*?)(?=KEYWORDS:|$)/i);
      if (bulletsMatch) {
        const bulletText = bulletsMatch[1].trim();
        descriptions.bullets = bulletText
          .split("\n")
          .map((b) => b.replace(/^[•\-\*]\s*/, "").trim())
          .filter((b) => b.length > 0);
      }

      // Extract KEYWORDS
      const keywordsMatch = text.match(/KEYWORDS:\s*([\s\S]*?)$/i);
      if (keywordsMatch) {
        descriptions.keywords = keywordsMatch[1]
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }
    } catch (error) {
      Logger.error("Failed to parse AI response", error);
      // Return raw text if parsing fails
      descriptions.long = text;
    }

    return descriptions;
  }

  /**
   * Analyze image to extract product features
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Promise<object>} Extracted features
   */
  async analyzeProductImage(imageBase64) {
    try {
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: this.model,
      });

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      };

      const textPart = {
        text: `Analyze this product image and extract:
1. Product type/category
2. Main colors
3. Visible features
4. Material (if identifiable)
5. Suggested use case

Respond in JSON format:
{
  "category": "...",
  "colors": ["...", "..."],
  "features": ["...", "..."],
  "material": "...",
  "useCase": "..."
}`,
      };

      const request = {
        contents: [{ role: "user", parts: [imagePart, textPart] }],
      };

      const result = await generativeModel.generateContent(request);
      const response = result.response;
      const analysisText = response.candidates[0].content.parts[0].text;

      // Try to parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { raw: analysisText };
    } catch (error) {
      Logger.error("Image analysis failed", error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new VertexAIService();
