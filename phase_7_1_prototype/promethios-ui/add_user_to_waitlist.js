// Script to add user directly to waitlist as approved
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase config (using environment variables or direct config)
const firebaseConfig = {
  apiKey: "AIzaSyBEf7sFGKaXKhbGONWGGGGGGGGGGGGGGGG", // Replace with actual
  authDomain: "promethios-oregon.firebaseapp.com",
  projectId: "promethios-oregon",
  storageBucket: "promethios-oregon.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijk"
};

async function addUserToWaitlist() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const userData = {
      email: "chloeliuyy@gmail.com",
      role: "admin-added",
      whyAccess: "Manually approved by admin",
      status: "approved",
      timestamp: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      onboardingCall: false,
      organization: "Promethios Team",
      leadScore: 300,
      priority: "high"
    };
    
    const docRef = await addDoc(collection(db, 'waitlist'), userData);
    console.log('✅ User added successfully with ID:', docRef.id);
    console.log('📧 Email:', userData.email);
    console.log('🎯 Status:', userData.status);
    
  } catch (error) {
    console.error('❌ Error adding user:', error);
  }
}

addUserToWaitlist();
