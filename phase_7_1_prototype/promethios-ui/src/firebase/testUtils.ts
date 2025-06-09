// Standalone Firebase Test Utility
// This file creates a completely separate Firebase instance for testing purposes
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Create a unique app name to avoid conflicts with the main app
const TEST_APP_NAME = 'firebase-test-app-' + Date.now();

// Hardcoded configuration for testing
// This should match the Firebase project settings exactly
const testConfig = {
  apiKey: "AIzaSyAIht4KXfXZScqDNUaYXRX4MVyg6zbYbk",
  authDomain: "promethios.firebaseapp.com",
  projectId: "promethios",
  storageBucket: "promethios.firebaseapp.com",
  messagingSenderId: "1332266049",
  appId: "1:1332266049:web:6c8d1a9e1a0",
  measurementId: "G-W21XVEL0"
};

// Initialize test Firebase app with a unique name
let testApp;
let testAuth;
let testFirestore;
let isInitialized = false;

// Initialize the test Firebase instance
const initializeTestFirebase = async () => {
  if (isInitialized) {
    console.log('Test Firebase already initialized');
    return { testApp, testAuth, testFirestore };
  }
  
  try {
    console.log('Initializing test Firebase with config:', {
      authDomain: testConfig.authDomain,
      projectId: testConfig.projectId,
      appName: TEST_APP_NAME
    });
    
    // Initialize with a unique name to avoid conflicts
    testApp = initializeApp(testConfig, TEST_APP_NAME);
    testAuth = getAuth(testApp);
    testFirestore = getFirestore(testApp);
    isInitialized = true;
    
    console.log('Test Firebase initialized successfully');
    return { testApp, testAuth, testFirestore };
  } catch (error) {
    console.error('Error initializing test Firebase:', error);
    return { testApp: null, testAuth: null, testFirestore: null };
  }
};

// Test email/password authentication
export const testEmailAuth = async (email, password) => {
  try {
    const { testAuth } = await initializeTestFirebase();
    if (!testAuth) {
      return { success: false, error: 'Test auth not initialized' };
    }
    
    const result = await signInWithEmailAndPassword(testAuth, email, password);
    return { 
      success: true, 
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      }
    };
  } catch (error) {
    console.error('Email auth test failed:', error);
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Test Google authentication
export const testGoogleAuth = async () => {
  try {
    const { testAuth } = await initializeTestFirebase();
    if (!testAuth) {
      return { success: false, error: 'Test auth not initialized' };
    }
    
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(testAuth, provider);
    return { 
      success: true, 
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      }
    };
  } catch (error) {
    console.error('Google auth test failed:', error);
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Test anonymous authentication
export const testAnonymousAuth = async () => {
  try {
    const { testAuth } = await initializeTestFirebase();
    if (!testAuth) {
      return { success: false, error: 'Test auth not initialized' };
    }
    
    const result = await signInAnonymously(testAuth);
    return { 
      success: true, 
      user: {
        uid: result.user.uid
      }
    };
  } catch (error) {
    console.error('Anonymous auth test failed:', error);
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Test Firestore connection
export const testFirestoreConnection = async () => {
  try {
    const { testFirestore } = await initializeTestFirebase();
    if (!testFirestore) {
      return { success: false, error: 'Test Firestore not initialized' };
    }
    
    // Try to read a test document
    const testDoc = await getDoc(doc(testFirestore, 'test', 'test-doc'));
    return { 
      success: true, 
      exists: testDoc.exists(),
      data: testDoc.exists() ? testDoc.data() : null
    };
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Get environment variables for debugging
export const getFirebaseEnvVars = () => {
  const vars = {};
  Object.keys(import.meta.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      const value = import.meta.env[key];
      // Mask sensitive values
      if (key.includes('KEY') || key.includes('SECRET') || key.includes('ID')) {
        vars[key] = value ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}` : '(empty)';
      } else {
        vars[key] = value || '(empty)';
      }
    }
  });
  
  return {
    envVars: vars,
    domain: window.location.hostname,
    origin: window.location.origin,
    mode: import.meta.env.MODE
  };
};

export default {
  testEmailAuth,
  testGoogleAuth,
  testAnonymousAuth,
  testFirestoreConnection,
  getFirebaseEnvVars
};
