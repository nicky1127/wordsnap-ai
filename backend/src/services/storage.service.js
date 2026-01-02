const { Storage } = require("@google-cloud/storage");
const config = require("../config");
const Logger = require("../utils/logger");
const path = require("path");
const crypto = require("crypto");

class StorageService {
  constructor() {
    this.storage = new Storage({
      projectId: config.gcp.projectId,
    });

    this.bucket = this.storage.bucket(config.storage.bucketName);

    Logger.info("Cloud Storage Service initialized", {
      bucket: config.storage.bucketName,
    });
  }

  /**
   * Upload image to Cloud Storage
   * @param {Buffer} fileBuffer - Image file buffer
   * @param {string} originalName - Original filename
   * @param {string} mimeType - File MIME type
   * @returns {Promise<object>} Upload result with URL
   */
  async uploadImage(fileBuffer, originalName, mimeType) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString("hex");
      const extension = path.extname(originalName);
      const filename = `products/${timestamp}-${randomString}${extension}`;

      // Create file reference
      const file = this.bucket.file(filename);

      // Upload file (bucket is already public via IAM)
      await file.save(fileBuffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            originalName: originalName,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Get public URL (works because bucket has public read access)
      const publicUrl = `https://storage.googleapis.com/${config.storage.bucketName}/${filename}`;

      Logger.info("Image uploaded successfully", {
        filename,
        size: fileBuffer.length,
        mimeType,
      });

      return {
        success: true,
        filename,
        url: publicUrl,
        size: fileBuffer.length,
      };
    } catch (error) {
      Logger.error("Image upload failed", error, {
        originalName,
        mimeType,
      });

      throw new Error(`Storage upload failed: ${error.message}`);
    }
  }

  /**
   * Convert image buffer to base64
   * @param {Buffer} buffer - Image buffer
   * @returns {string} Base64 encoded string
   */
  bufferToBase64(buffer) {
    return buffer.toString("base64");
  }

  /**
   * Delete image from Cloud Storage
   * @param {string} filename - File to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteImage(filename) {
    try {
      await this.bucket.file(filename).delete();

      Logger.info("Image deleted successfully", { filename });
      return true;
    } catch (error) {
      Logger.error("Image deletion failed", error, { filename });
      throw new Error(`Storage deletion failed: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   * @param {string} filename - File to check
   * @returns {Promise<boolean>} Exists status
   */
  async fileExists(filename) {
    try {
      const [exists] = await this.bucket.file(filename).exists();
      return exists;
    } catch (error) {
      Logger.error("File existence check failed", error, { filename });
      return false;
    }
  }
}

// Export singleton instance
module.exports = new StorageService();
