// Simplified Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Single source of truth for Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAIht4KXfXZScqDNUaYXRX4MVyg6zbYbk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "promethios.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "promethios",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "promethios.firebaseapp.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1332266049",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1332266049:web:6c8d1a9e1a0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-W21XVEL0"
};

// Log configuration for debugging (without sensitive values)
console.log('Firebase Configuration Debug:');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', firebaseConfig.authDomain);
console.log('VITE_FIREBASE_PROJECT_ID:', firebaseConfig.projectId);
console.log('Current domain:', window.location.hostname);
console.log('Environment mode:', import.meta.env.MODE);

// Initialize Firebase - simple, straightforward approach
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);
let analytics = null;

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase persistence set to local');
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Enable Firestore offline persistence
enableIndexedDbPersistence(firestore)
  .then(() => {
    console.log('Firestore offline persistence enabled');
  })
  .catch((error) => {
    if (error.code === 'failed-precondition') {
      console.warn('Firestore offline persistence could not be enabled: Multiple tabs open');
    } else if (error.code === 'unimplemented') {
      console.warn('Firestore offline persistence not supported in this browser');
    } else {
      console.error('Error enabling Firestore offline persistence:', error);
    }
  });

// Only initialize analytics in production
if (typeof window !== 'undefined' && import.meta.env.MODE === 'production') {
  try {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized');
  } catch (error) {
    console.warn('Failed to initialize analytics:', error);
  }
}

// Export initialized Firebase services
export { app, auth, firestore, functions, analytics };
