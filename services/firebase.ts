// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// Helper to safely get environment variables with fallback
// This prevents "undefined is not an object" errors if import.meta.env is missing
const getEnv = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    const envValue = import.meta?.env?.[key];
    return envValue || fallback;
  } catch (e) {
    return fallback;
  }
};

// We use getEnv to try loading from .env first. 
// If that fails (which is causing your error), it falls back to the hardcoded strings.
export const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyB38spZ6096tlezSBhfd0jUUGTU7Q_nNmU"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "makki-complex-app.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "makki-complex-app"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "makki-complex-app.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "1027303377264"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:1027303377264:web:15f4278d146543f7f8e7b5"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-B3Z2L98FTR")
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
export const analytics = getAnalytics(app);

// Export Auth and Database services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;