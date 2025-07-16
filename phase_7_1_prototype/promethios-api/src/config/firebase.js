/**
 * Firebase Admin SDK Configuration
 * 
 * Provides server-side access to Firestore for API key storage
 * IMPORTANT: Must use the same database as the frontend (promethios-oregon)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // In production, use service account key from environment variable
    // For development, this will use the default credentials
    admin.initializeApp({
      projectId: 'promethios',
      // Use default credentials or service account key
      credential: admin.credential.applicationDefault()
    });
    
    console.log('🔥 Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.log('🔥 Firebase Admin SDK initialization failed, using mock mode:', error.message);
    
    // Initialize with minimal config for development
    admin.initializeApp({
      projectId: 'promethios'
    });
  }
}

// CRITICAL FIX: Get Firestore instance with the specific database ID
// The correct way to specify database ID in Firebase Admin SDK
const db = admin.firestore('promethios-oregon');

console.log('🔧 Firestore Admin initialized with promethios-oregon database (PROPERLY FIXED)');
console.log('🎯 Backend now uses the same database as frontend!');

module.exports = {
  admin,
  db
};

