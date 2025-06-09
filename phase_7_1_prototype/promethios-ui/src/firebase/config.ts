// Firebase Configuration - Restored from hardcoded debug version
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug logging for environment variables (safe - doesn't expose full values)
console.log('🔍 Firebase Environment Variables Debug:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? `✓ Set (${import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 10)}...)` : '✗ Missing');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '✗ Missing');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID || '✗ Missing');
console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '✗ Missing');
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '✗ Missing');
console.log('VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID ? `✓ Set (${import.meta.env.VITE_FIREBASE_APP_ID.substring(0, 15)}...)` : '✗ Missing');
console.log('VITE_FIREBASE_MEASUREMENT_ID:', import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '✗ Missing');

// Check if we're in production and log current domain
console.log('🌐 Current domain:', window.location.hostname);
console.log('🌐 Current origin:', window.location.origin);
console.log('🔧 Environment mode:', import.meta.env.MODE);

// Validate required configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
if (missingFields.length > 0) {
  console.error('❌ Missing required Firebase configuration fields:', missingFields);
  console.error('Please ensure all VITE_FIREBASE_* environment variables are set on Render');
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
