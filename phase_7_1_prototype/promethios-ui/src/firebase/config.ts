// Firebase configuration for Promethios
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOsIGVKIzNwuv0_JvyNL15gLdBZgp",
  authDomain: "promethios-26586.firebaseapp.com",
  projectId: "promethios-26586",
  storageBucket: "promethios-26586.firebaseapp.com",
  messagingSenderId: "840238245787",
  appId: "1:840238245787:web:3e8b8d27a8a77e541e6748",
  measurementId: "G-KF8G86LTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, db, googleProvider };
export default app;
