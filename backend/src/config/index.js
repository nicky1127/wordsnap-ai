const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

const config = {
  // Server
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || "development",

  // GCP
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || "wordsnap-ai",
    region: process.env.GCP_REGION || "us-central1",
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },

  // Cloud Storage
  storage: {
    bucketName: process.env.GCS_BUCKET_NAME || "wordsnap-ai-products",
  },

  // Vertex AI
  vertexAI: {
    location: process.env.VERTEX_AI_LOCATION || "us-central1",
    model: process.env.VERTEX_AI_MODEL || "gemini-1.5-flash-002",
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },
};

// Validate required config
const requiredEnvVars = ["GCP_PROJECT_ID"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error("Please create a .env file based on .env.example");
  process.exit(1);
}

module.exports = config;
