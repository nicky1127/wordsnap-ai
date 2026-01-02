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
    try {
      const {
        productName,
        category,
        specs,
        tone = "professional",
      } = productInfo;

      // Handle both single image (backward compatibility) and multiple images
      const imageArray = Array.isArray(imageBase64)
        ? imageBase64
        : [imageBase64];

      // Build the prompt
      const prompt = this._buildPrompt(
        productName,
        category,
        specs,
        tone,
        imageArray.length
      );

      Logger.debug("Generating description", {
        productName,
        category,
        tone,
        imageCount: imageArray.length,
        promptLength: prompt.length,
      });

      // Prepare the request
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.9,
        },
      });

      // Create content parts - multiple images + text
      const imageParts = imageArray.map((base64) => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      }));

      const textPart = {
        text: prompt,
      };

      // Generate content with all images
      const request = {
        contents: [{ role: "user", parts: [...imageParts, textPart] }],
      };

      const result = await generativeModel.generateContent(request);
      const response = result.response;
      const generatedText = response.candidates[0].content.parts[0].text;

      // Parse the response into structured format
      const descriptions = this._parseResponse(generatedText);

      Logger.info("Description generated successfully", {
        productName,
        tone,
        imageCount: imageArray.length,
        descriptionLengths: {
          short: descriptions.short?.length,
          medium: descriptions.medium?.length,
          long: descriptions.long?.length,
        },
      });

      return {
        success: true,
        data: descriptions,
        metadata: {
          model: this.model,
          tone,
          imageCount: imageArray.length,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error("Failed to generate description", error, {
        productName: productInfo.productName,
      });

      throw new Error(`Vertex AI generation failed: ${error.message}`);
    }
  }

  /**
   * Build the prompt for product description generation
   * @private
   */
  _buildPrompt(productName, category, specs, tone, imageCount) {
    const toneInstructions = {
      professional: "Use professional, informative language suitable for B2B.",
      casual:
        "Use friendly, conversational language that connects with everyday shoppers.",
      luxury:
        "Use sophisticated, aspirational language that emphasizes premium quality.",
    };

    const imageContext =
      imageCount > 1
        ? `You've been provided with ${imageCount} images showing this product from different angles. Analyze all images to understand the product's full design, features, and context.`
        : `You've been provided with 1 product image. Analyze it carefully to understand the product's design and features.`;

    return `You are an expert e-commerce copywriter. ${imageContext}

Product Name: ${productName}
Category: ${category}
Specifications: ${specs || "Not provided"}

Tone: ${toneInstructions[tone] || toneInstructions.professional}

${
  imageCount > 1 ? "Based on all the images provided, " : "Based on the image, "
}generate THREE versions of product descriptions:

1. SHORT (50-80 words): A punchy, attention-grabbing description perfect for product cards and quick browsing.

2. MEDIUM (150-200 words): A balanced description with key features and benefits for product listing pages.

3. LONG (300-400 words): A comprehensive description with detailed features, benefits, use cases, and SEO optimization.

Also provide:
- 5-7 feature bullet points highlighting key selling points ${
      imageCount > 1
        ? "(mention details visible across the different angles)"
        : ""
    }
- 3-5 SEO keywords for this product

Format your response EXACTLY like this:

SHORT:
[Your short description here]

MEDIUM:
[Your medium description here]

LONG:
[Your long description here]

BULLETS:
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]
- [Bullet point 4]
- [Bullet point 5]

KEYWORDS:
keyword1, keyword2, keyword3, keyword4, keyword5

Make the descriptions compelling, accurate to ${
      imageCount > 1 ? "all the images" : "the image"
    }, and optimized to convert browsers into buyers.`;
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
