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

// Get Firestore instance with the specific database
const db = admin.firestore();

// CRITICAL FIX: Use the same database as the frontend (promethios-oregon)
// This was causing the 400 errors because backend was using (default) database
// while frontend was using promethios-oregon database
try {
  // Set the database ID to match the frontend configuration
  db.settings({
    databaseId: 'promethios-oregon'
  });
  
  console.log('🔧 Firestore Admin initialized with promethios-oregon database (FIXED)');
  console.log('🎯 This should fix the 400 database mismatch errors!');
} catch (error) {
  console.error('❌ Failed to set database ID:', error.message);
  console.log('🔧 Falling back to default database configuration');
}

module.exports = {
  admin,
  db
};

