// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Track initialization state to prevent multiple initializations
let _initialized = false;

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
    return false;
  }
  return true;
};

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

const initializeFirebase = async () => {
  // Prevent multiple initializations
  if (_initialized) {
    console.warn('Firebase already initialized, skipping initialization');
    return { app, auth, firestore, functions, analytics };
  }

  // Validate environment variables
  if (!validateEnvVars()) {
    console.error('Firebase initialization aborted due to missing environment variables');
    return { app, auth, firestore, functions, analytics };
  }

  try {
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    _initialized = true;
    console.log('Firebase initialized successfully');
    
    // Get Firebase services
    auth = getAuth(app);
    firestore = getFirestore(app);
    functions = getFunctions(app);
    
    // Set persistence to local
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase persistence set to local');
    } catch (persistenceError) {
      console.error('Error setting persistence:', persistenceError);
    }
    
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
    // Log detailed API key information for debugging
    if (error.code === 'auth/api-key-not-valid') {
      console.error('API Key Invalid Error Details:', {
        apiKeyLength: firebaseConfig.apiKey?.length || 0,
        apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 8),
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        currentDomain: window.location.hostname
      });
    }
  }

  return { app, auth, firestore, functions, analytics };
};

// Initialize Firebase immediately
initializeFirebase();

// Export initialized Firebase services and initialization function
export { app, auth, firestore, functions, analytics, initializeFirebase };
