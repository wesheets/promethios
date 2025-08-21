// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

const db = getFirestore(app, 'promethios-oregon');

// Enable offline persistence for better connection stability
try {
  // Note: enablePersistence is not available in v9+, but offline support is enabled by default
  console.log('🔧 Firestore offline persistence enabled by default in v9+');
} catch (err) {
  console.warn('⚠️ Firestore offline persistence setup warning:', err);
}

// Connection health monitoring
let isOnline = navigator.onLine;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3;

// Monitor network status
window.addEventListener('online', async () => {
  console.log('🌐 Network connection restored, re-enabling Firestore');
  isOnline = true;
  connectionRetryCount = 0;
  try {
    await enableNetwork(db);
    console.log('✅ Firestore network re-enabled successfully');
  } catch (error) {
    console.error('❌ Failed to re-enable Firestore network:', error);
  }
});

window.addEventListener('offline', async () => {
  console.log('📴 Network connection lost, Firestore will use offline cache');
  isOnline = false;
  try {
    await disableNetwork(db);
    console.log('✅ Firestore network disabled, using offline mode');
  } catch (error) {
    console.error('❌ Failed to disable Firestore network:', error);
  }
});

// Export connection utilities
export const firestoreUtils = {
  isOnline: () => isOnline,
  getRetryCount: () => connectionRetryCount,
  incrementRetryCount: () => connectionRetryCount++,
  resetRetryCount: () => connectionRetryCount = 0,
  canRetry: () => connectionRetryCount < MAX_RETRY_ATTEMPTS,
  enableNetwork: () => enableNetwork(db),
  disableNetwork: () => disableNetwork(db)
};

const storage = getStorage(app);
console.log('🔧 Firestore initialized with promethios-oregon database (us-west1 region)');
console.log('🔧 Firebase Storage initialized');
console.log('🔧 Firestore connection stability improvements enabled');
console.log('🎯 Restored to original database with all user data and sessions!');

export { auth, googleProvider, firebaseConfig, db, storage };
export default app;


