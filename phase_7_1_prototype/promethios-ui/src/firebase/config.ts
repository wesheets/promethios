// Firebase configuration for Promethios
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
  apiKey: getEnvVar('FIREBASE_API_KEY', 'AIzaSyDOsIGVKIzNwuv0_JvyNL15gLdBZgp'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'promethios-26586.firebaseapp.com'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'promethios-26586'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'promethios-26586.firebaseapp.com'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '840238245787'),
  appId: getEnvVar('FIREBASE_APP_ID', '1:840238245787:web:3e8b8d27a8a77e541e6748'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', 'G-KF8G86LTB')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export Firebase services
export { auth, db, googleProvider };
export default app;
