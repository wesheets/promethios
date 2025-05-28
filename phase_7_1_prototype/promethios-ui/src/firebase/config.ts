// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const analytics = getAnalytics(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, db, googleProvider };
export default app;
