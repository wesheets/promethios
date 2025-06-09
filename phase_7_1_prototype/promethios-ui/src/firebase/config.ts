// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

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

// Initialize Firestore
const db = getFirestore(app);

// Configure Google Auth Provider with production-optimized settings
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Optimize for production environment
  access_type: 'offline',
  include_granted_scopes: 'true',
  // Add hd parameter for better domain handling
  hd: '*'
});

// Add essential scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.addScope('openid');

// Export Firebase services
export { auth, db, googleProvider, firebaseConfig };
export default app;
