// Firebase configuration for Promethios landing page
const firebaseConfig = {
  apiKey: "AIzaSyAhsKXJXZzegPMuIvYKKAMVgdAb7Dk",
  authDomain: "promethios.firebaseapp.com",
  projectId: "promethios",
  storageBucket: "promethios.firebasestorage.app",
  messagingSenderId: "132426045829",
  appId: "1:132426045829:web:913688771a94698e4d53fa",
  measurementId: "G-WZ11Y40L70"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

