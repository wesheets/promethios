/**
 * Firebase Admin SDK Configuration
 * 
 * Provides server-side access to Firestore for API key storage
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

// Get Firestore instance with the specific database
const db = admin.firestore();

// Use the same database as the frontend
db.settings({
  databaseId: 'promethios-oregon'
});

console.log('🔧 Firestore Admin initialized with promethios-oregon database');

module.exports = {
  admin,
  db
};

