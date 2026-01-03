const admin = require("firebase-admin");
const config = require("./index");
const Logger = require("../utils/logger");

let firebaseApp;

function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Initialize Firebase Admin with Application Default Credentials
    // This uses the same service account credentials we already have
    firebaseApp = admin.initializeApp({
      projectId: config.gcp.projectId,
    });

    Logger.info("Firebase Admin initialized successfully", {
      projectId: config.gcp.projectId,
    });

    return firebaseApp;
  } catch (error) {
    Logger.error("Failed to initialize Firebase Admin", error);
    throw error;
  }
}

// Initialize on module load
initializeFirebase();

// Export admin instance
module.exports = {
  admin,
  auth: admin.auth(),
  firestore: admin.firestore(),
};
