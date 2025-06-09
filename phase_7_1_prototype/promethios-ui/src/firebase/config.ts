// Firebase Configuration - Debug version with hardcoded config for testing
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Hardcoded Firebase configuration for debugging
// IMPORTANT: This is temporary for debugging only and should be removed before production
const firebaseConfig = {
  apiKey: "AIzaSyMh4KOfXZScqDNUaYXRX4MVyg6zb7Ybk",
  authDomain: "promethios.firebaseapp.com",
  projectId: "promethios",
  storageBucket: "promethios.firebasestorage.app",
  messagingSenderId: "132426045839",
  appId: "1:132426045839:web:913688771a94698e4d53fa",
  measurementId: "G-WZ11Y40L78"
};

// For comparison, log the environment variables that would normally be used
console.log('🔍 Firebase Environment Variables Debug:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? `✓ Set (${import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 10)}...)` : '✗ Missing');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '✗ Missing');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID || '✗ Missing');
console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '✗ Missing');
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '✗ Missing');
console.log('VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID ? `✓ Set (${import.meta.env.VITE_FIREBASE_APP_ID.substring(0, 15)}...)` : '✗ Missing');
console.log('VITE_FIREBASE_MEASUREMENT_ID:', import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '✗ Missing');

// Log that we're using hardcoded config for debugging
console.log('⚠️ USING HARDCODED FIREBASE CONFIG FOR DEBUGGING');
console.log('🔐 Hardcoded API Key (first 10 chars):', firebaseConfig.apiKey.substring(0, 10) + '...');

// Check if we're in production and log current domain
console.log('🌐 Current domain:', window.location.hostname);
console.log('🌐 Current origin:', window.location.origin);
console.log('🔧 Environment mode:', import.meta.env.MODE);

// Validate required configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
if (missingFields.length > 0) {
  console.error('❌ Missing required Firebase configuration fields:', missingFields);
} else {
  console.log('✅ All required Firebase configuration fields are present');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
  console.log('📱 Firebase Project ID:', firebaseConfig.projectId);
  console.log('🔐 Firebase Auth Domain:', firebaseConfig.authDomain);
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Connect to emulators in development if enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.warn('⚠️ Failed to connect to Firebase emulators:', error);
  }
}

export default app;
