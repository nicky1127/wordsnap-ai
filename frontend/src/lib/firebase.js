import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBblrCt6-dACNOJsjJdt-rmouBmoujhTvk",
  authDomain: "wordsnap-ai.firebaseapp.com",
  projectId: "wordsnap-ai",
  storageBucket: "wordsnap-ai.firebasestorage.app",
  messagingSenderId: "763810149974",
  appId: "1:763810149974:web:ebc9f11c6cd5c409d26df7",
};
console.log("firebaseConfig", firebaseConfig);
// Validate config
if (!firebaseConfig.apiKey) {
  console.error("Firebase config missing! Check your .env file.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account", // Always show account selection
});

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    console.error("Google sign-in error:", error);

    let errorMessage = error.message;
    if (error.code === "auth/popup-closed-by-user") {
      errorMessage = "Sign-in cancelled";
    } else if (error.code === "auth/popup-blocked") {
      errorMessage = "Pop-up blocked. Please allow pop-ups and try again.";
    }

    return { user: null, error: errorMessage };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    console.error("Email sign-in error:", error);
    return { user: null, error: error.message };
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    console.error("Email sign-up error:", error);
    return { user: null, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    console.error("Sign-out error:", error);
    return { error: error.message };
  }
};

export { auth, onAuthStateChanged };
