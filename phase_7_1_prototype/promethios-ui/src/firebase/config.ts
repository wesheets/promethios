// Firebase Configuration with Direct API Key Validation
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence, signInAnonymously } from 'firebase/auth';
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

// Directly validate API key against Firebase project
const validateApiKey = async (apiKey, projectId) => {
  try {
    // Use a simple Firebase API endpoint to validate the key
    const url = `https://firebaseinstallations.googleapis.com/v1/projects/${projectId}/installations`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        fid: 'api-key-validation-test',
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        authVersion: 'FIS_v2',
        sdkVersion: 'w:0.0.0'
      })
    });
    
    if (response.ok) {
      console.log('API key validation successful');
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('API key validation failed:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
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

// Hardcoded fallback configuration for development and testing
// This should be removed in production
const fallbackConfig = {
  apiKey: "AIzaSyAIht4KXfXZScqDNUaYXRX4MVyg6zbYbk",
  authDomain: "promethios.firebaseapp.com",
  projectId: "promethios",
  storageBucket: "promethios.firebaseapp.com",
  messagingSenderId: "1332266049",
  appId: "1:1332266049:web:6c8d1a9e1a0",
  measurementId: "G-W21XVEL0"
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
  const envVarsValid = validateEnvVars();
  
  // Try to initialize with environment variables first
  let configToUse = firebaseConfig;
  let useEnvConfig = true;
  
  try {
    console.log('Initializing Firebase with config:', {
      authDomain: configToUse.authDomain,
      projectId: configToUse.projectId,
      storageBucket: configToUse.storageBucket,
      apiKeyPrefix: configToUse.apiKey ? configToUse.apiKey.substring(0, 5) + '...' : null
    });
    
    // Initialize Firebase app
    app = initializeApp(configToUse);
    _initialized = true;
    console.log('Firebase initialized successfully');
    
    // Get Firebase services
    auth = getAuth(app);
    firestore = getFirestore(app);
    functions = getFunctions(app);
    
    // Validate API key directly against the project
    if (envVarsValid) {
      const apiKeyValid = await validateApiKey(configToUse.apiKey, configToUse.projectId);
      if (!apiKeyValid) {
        console.warn('API key validation failed, will try fallback configuration');
        throw new Error('API key validation failed');
      }
    }
    
    // Set persistence to local
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase persistence set to local');
    } catch (persistenceError) {
      console.error('Error setting persistence:', persistenceError);
    }
    
    // Try anonymous sign-in as a test
    try {
      const anonResult = await signInAnonymously(auth);
      console.log('Anonymous authentication successful:', anonResult.user.uid);
    } catch (anonError) {
      console.error('Anonymous authentication failed:', anonError);
      
      // If anonymous auth fails with API key error, try fallback config
      if (anonError.code === 'auth/api-key-not-valid' && useEnvConfig) {
        console.warn('Trying fallback configuration due to API key error');
        throw anonError;
      }
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
    
    // If using environment config and it failed, try fallback config
    if (useEnvConfig) {
      console.warn('Environment config failed, trying fallback configuration');
      
      try {
        // Clean up any previous initialization
        app = null;
        auth = null;
        firestore = null;
        functions = null;
        analytics = null;
        _initialized = false;
        
        // Use fallback config
        configToUse = fallbackConfig;
        useEnvConfig = false;
        
        console.log('Initializing Firebase with fallback config:', {
          authDomain: configToUse.authDomain,
          projectId: configToUse.projectId,
          apiKeyPrefix: configToUse.apiKey ? configToUse.apiKey.substring(0, 5) + '...' : null
        });
        
        // Initialize with fallback config
        app = initializeApp(configToUse);
        _initialized = true;
        console.log('Firebase initialized successfully with fallback config');
        
        // Get Firebase services
        auth = getAuth(app);
        firestore = getFirestore(app);
        functions = getFunctions(app);
        
        // Set persistence to local
        await setPersistence(auth, browserLocalPersistence);
        console.log('Firebase persistence set to local');
        
        // Try anonymous sign-in as a test
        const anonResult = await signInAnonymously(auth);
        console.log('Anonymous authentication successful with fallback config:', anonResult.user.uid);
        
        // Enable Firestore offline persistence
        try {
          await enableIndexedDbPersistence(firestore);
          console.log('Firestore offline persistence enabled with fallback config');
        } catch (offlineError) {
          console.warn('Firestore offline persistence error with fallback config:', offlineError.code);
        }
      } catch (fallbackError) {
        console.error('Error initializing Firebase with fallback config:', fallbackError);
        
        // Enhanced error logging for API key issues
        if (fallbackError.code === 'auth/api-key-not-valid') {
          console.error('API Key Invalid Error Details (fallback config):', {
            apiKeyLength: configToUse.apiKey?.length || 0,
            apiKeyPrefix: configToUse.apiKey?.substring(0, 5) || 'N/A',
            apiKeySuffix: configToUse.apiKey?.substring(configToUse.apiKey.length - 3) || 'N/A',
            authDomain: configToUse.authDomain,
            projectId: configToUse.projectId,
            currentDomain: window.location.hostname,
            currentOrigin: window.location.origin,
            mode: import.meta.env.MODE
          });
        }
      }
    } else {
      // Enhanced error logging for API key issues
      if (error.code === 'auth/api-key-not-valid') {
        console.error('API Key Invalid Error Details:', {
          apiKeyLength: configToUse.apiKey?.length || 0,
          apiKeyPrefix: configToUse.apiKey?.substring(0, 5) || 'N/A',
          apiKeySuffix: configToUse.apiKey?.substring(configToUse.apiKey.length - 3) || 'N/A',
          authDomain: configToUse.authDomain,
          projectId: configToUse.projectId,
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
  }

  return { app, auth, firestore, functions, analytics };
};

// Initialize Firebase immediately
initializeFirebase();

// Export initialized Firebase services and initialization function
export { app, auth, firestore, functions, analytics, initializeFirebase };
