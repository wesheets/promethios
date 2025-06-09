// Firebase Configuration with Enhanced Debugging
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Track initialization state to prevent multiple initializations
let _initialized = false;

// Enhanced debugging for environment variables
const debugEnvVars = () => {
  console.log('========== FIREBASE ENV VARS DEBUGGING ==========');
  console.log('Raw environment variables:');
  
  // List all environment variables with VITE_ prefix
  Object.keys(import.meta.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      const value = import.meta.env[key];
      const displayValue = typeof value === 'string' 
        ? (key.includes('KEY') || key.includes('SECRET') || key.includes('ID') 
            ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}` 
            : value)
        : typeof value;
      console.log(`${key}: ${displayValue}`);
    }
  });
  
  console.log('Current domain:', window.location.hostname);
  console.log('Current origin:', window.location.origin);
  console.log('Environment mode:', import.meta.env.MODE);
  console.log('=================================================');
};

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
  
  // Debug all environment variables
  debugEnvVars();
  
  const missingVars = requiredVars.filter(varName => {
    const value = import.meta.env[varName];
    const isMissing = !value || value.trim() === '';
    if (isMissing) {
      console.error(`Missing or empty environment variable: ${varName}`);
    }
    return isMissing;
  });
  
  if (missingVars.length > 0) {
    console.error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file and ensure all Firebase variables are set.');
    return false;
  }
  
  // Validate API key format (should start with AIza)
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey || !apiKey.startsWith('AIza')) {
    console.error('Invalid Firebase API key format. API keys should start with "AIza"');
    console.error(`Current API key: ${apiKey ? apiKey.substring(0, 4) + '...' : '(empty)'}`);
    return false;
  }
  
  return true;
};

// Firebase configuration object with trimmed values to remove any accidental whitespace
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim()
};

// Log configuration for debugging (without sensitive values)
console.log('Firebase Configuration Debug:');
console.log('VITE_FIREBASE_API_KEY:', firebaseConfig.apiKey ? `✓ Set (${firebaseConfig.apiKey.substring(0, 5)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 3)})` : '❌ MISSING');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', firebaseConfig.authDomain || '❌ MISSING');
console.log('VITE_FIREBASE_PROJECT_ID:', firebaseConfig.projectId || '❌ MISSING');
console.log('VITE_FIREBASE_STORAGE_BUCKET:', firebaseConfig.storageBucket || '❌ MISSING');
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', firebaseConfig.messagingSenderId || '❌ MISSING');
console.log('VITE_FIREBASE_APP_ID:', firebaseConfig.appId ? `✓ Set (${firebaseConfig.appId.substring(0, 5)}...${firebaseConfig.appId.substring(firebaseConfig.appId.length - 3)})` : '❌ MISSING');
console.log('VITE_FIREBASE_MEASUREMENT_ID:', firebaseConfig.measurementId || '❌ MISSING');

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
    console.error('Firebase initialization aborted due to missing or invalid environment variables');
    return { app, auth, firestore, functions, analytics };
  }

  try {
    console.log('Initializing Firebase with config:', {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      apiKeyPrefix: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + '...' : null
    });
    
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
    
    // Enable Firestore offline persistence
    try {
      await enableIndexedDbPersistence(firestore);
      console.log('Firestore offline persistence enabled');
    } catch (offlineError) {
      if (offlineError.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('Firestore offline persistence could not be enabled: Multiple tabs open');
      } else if (offlineError.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore offline persistence not supported in this browser');
      } else {
        console.error('Error enabling Firestore offline persistence:', offlineError);
      }
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
    
    // Enhanced error logging for API key issues
    if (error.code === 'auth/api-key-not-valid') {
      console.error('API Key Invalid Error Details:', {
        apiKeyLength: firebaseConfig.apiKey?.length || 0,
        apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 5) || 'N/A',
        apiKeySuffix: firebaseConfig.apiKey?.substring(firebaseConfig.apiKey.length - 3) || 'N/A',
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        currentDomain: window.location.hostname,
        currentOrigin: window.location.origin,
        mode: import.meta.env.MODE
      });
      
      // Try to fetch a test URL to check if network is working
      fetch('https://www.google.com/favicon.ico')
        .then(response => {
          console.log('Network connectivity test successful:', response.status);
        })
        .catch(networkError => {
          console.error('Network connectivity test failed:', networkError);
        });
    }
  }

  return { app, auth, firestore, functions, analytics };
};

// Initialize Firebase immediately
initializeFirebase();

// Export initialized Firebase services and initialization function
export { app, auth, firestore, functions, analytics, initializeFirebase };
