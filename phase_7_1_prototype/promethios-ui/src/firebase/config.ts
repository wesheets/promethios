// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Load environment variables
// In development, these come from .env file
// In production, these should be set in your hosting environment (e.g., Render)
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // For Vite, environment variables are prefixed with VITE_
  const envVar = import.meta.env[`VITE_${key}`];
  return envVar || defaultValue;
};

// Your web app's Firebase configuration
// SECURITY NOTICE: These values should be stored in environment variables
// and not committed to version control
const firebaseConfig = {
fix/hero-image
  apiKey: getEnvVar('FIREBASE_API_KEY', 'AIzaSyDOsIGVKIzNwuv0_JvyNL15gLdBZgp'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'promethios-26586.firebaseapp.com'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'promethios-26586'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'promethios-26586.firebaseapp.com'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '840238245787'),
  appId: getEnvVar('FIREBASE_APP_ID', '1:840238245787:web:3e8b8d27a8a77e541e6748'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', 'G-KF8G86LTB')
  apiKey: "AIzaSyAIht4KXfXZScxjDNUsYXRX4MVg6zbDYbk",
  authDomain: "promethios.firebaseapp.com",
  projectId: "promethios",
  storageBucket: "promethios.firebasestorage.app",
  messagingSenderId: "132426045839",
  appId: "1:132426045839:web:913688771a94698e4d53fa",
  measurementId: "G-WZ11Y40L70" main
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export Firebase services
export { auth, db, googleProvider };
export default app;
