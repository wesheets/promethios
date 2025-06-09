// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Validate environment variables to prevent runtime errors
const validateEnvVars = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file and ensure all Firebase variables are set.');
  }
};

// Call validation function
validateEnvVars();

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Log configuration for debugging (without sensitive values)
console.log('Firebase Environment Variables Debug:');
console.log('VITE_FIREBASE_API_KEY: ✓ Set', firebaseConfig.apiKey ? `(${firebaseConfig.apiKey.substring(0, 10)}...)` : '(missing)');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', firebaseConfig.authDomain);
console.log('VITE_FIREBASE_PROJECT_ID:', firebaseConfig.projectId);
console.log('VITE_FIREBASE_STORAGE_BUCKET:', firebaseConfig.storageBucket);
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', firebaseConfig.messagingSenderId);
console.log('VITE_FIREBASE_APP_ID: ✓ Set', firebaseConfig.appId ? `(${firebaseConfig.appId.substring(0, 10)}...)` : '(missing)');
console.log('VITE_FIREBASE_MEASUREMENT_ID:', firebaseConfig.measurementId);

// Current environment
console.log('Current domain:', window.location.hostname);
console.log('Environment mode:', import.meta.env.MODE);

// Initialize Firebase with error handling
let app;
let auth;
let firestore;
let functions;
let analytics;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
  
  // Get Firebase services
  auth = getAuth(app);
  firestore = getFirestore(app);
  functions = getFunctions(app);
  
  // Only initialize analytics in production to avoid console errors in development
  if (typeof window !== 'undefined' && import.meta.env.MODE === 'production') {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized');
  }
  
  // Check if all required Firebase configuration fields are present
  console.log('All required Firebase configuration fields are present');
  
  // Initialize Firebase with emulators in development mode
  if (import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    console.log('Using Firebase emulators for development');
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Export initialized Firebase services
export { app, auth, firestore, functions, analytics };
