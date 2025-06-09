// Firebase Configuration - Works with Render environment variables
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

// Debug logging for environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Firebase Environment Variables Check:');
  console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing');
  console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
  console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Missing');
  console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✓ Set' : '✗ Missing');
  console.log('VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing');
}

// Validate required configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error('Missing required Firebase configuration fields:', missingFields);
  console.error('Please ensure all VITE_FIREBASE_* environment variables are set');
  
  // In development, provide helpful guidance
  if (import.meta.env.DEV) {
    console.error('For local development, you can:');
    console.error('1. Add Firebase environment variables to your .env file');
    console.error('2. Use Firebase emulators (set VITE_USE_FIREBASE_EMULATOR=true)');
    console.error('3. Use a demo Firebase project for testing');
  }
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
  
  // Log project info (only in development)
  if (import.meta.env.DEV) {
    console.log('Firebase Project ID:', firebaseConfig.projectId);
    console.log('Firebase Auth Domain:', firebaseConfig.authDomain);
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
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
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
    console.warn('Make sure Firebase emulators are running: firebase emulators:start');
  }
}

export default app;

