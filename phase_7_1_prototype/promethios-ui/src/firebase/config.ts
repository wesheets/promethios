// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIht4KXfXZScxjDNUsYXRX4MVg6zbDYbk",
  authDomain: "promethios.firebaseapp.com",
  projectId: "promethios",
  storageBucket: "promethios.firebasestorage.app",
  messagingSenderId: "132426045839",
  appId: "1:132426045839:web:913688771a94698e4d53fa",
  measurementId: "G-WZ11Y40L70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with enhanced settings to completely eliminate WebSocket issues
const db = initializeFirestore(app, {
  // AGGRESSIVE WEBSOCKET DISABLING for nam5 multi-region database
  experimentalForceLongPolling: true, // Force HTTP long polling
  experimentalAutoDetectLongPolling: false, // Disable auto-detection
  
  // Additional settings to ensure HTTP-only connections
  ignoreUndefinedProperties: true,
  
  // Explicit host and connection settings
  host: 'firestore.googleapis.com',
  ssl: true,
  
  // Disable any WebSocket-related features
  cacheSizeBytes: 1048576, // 1MB cache to reduce network calls
  
  // Force specific transport settings
  merge: true
});

console.log('🔧 Firestore initialized with ENHANCED nam5 region workaround');
console.log('🔧 WebSocket COMPLETELY DISABLED - HTTP-only mode');
console.log('🔧 Database settings:', db._delegate._databaseId);
console.log('🔧 App settings:', app.options);

export { auth, googleProvider, firebaseConfig, db };
export default app;


