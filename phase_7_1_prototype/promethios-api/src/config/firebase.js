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
    // Debug environment variables
    console.log('🔍 Checking Firebase environment variables...');
    console.log('🔍 FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('🔍 GOOGLE_APPLICATION_CREDENTIALS exists:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS);
    
    // Check if we have service account credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('🔑 Using service account credentials from environment');
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('🔑 Service account parsed successfully, project_id:', serviceAccount.project_id);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || 'promethios'
        });
        console.log('🔥 Firebase Admin SDK initialized with service account');
      } catch (parseError) {
        console.error('❌ Failed to parse service account key:', parseError.message);
        throw parseError;
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔑 Using application default credentials');
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'promethios'
      });
    } else {
      console.log('🔑 No credentials found, using project ID only (limited functionality)');
      // For development/testing - limited functionality
      admin.initializeApp({
        projectId: 'promethios'
      });
    }
    
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

// Get Firestore instance - explicitly use promethios-oregon database to match frontend
// This ensures backend and frontend use the same database
let db;

try {
  // Try to get the specific database instance
  db = admin.firestore('promethios-oregon');
  console.log('🔧 Firestore Admin configured to use promethios-oregon database');
  console.log('🎯 Backend now uses same database as frontend');
} catch (error) {
  console.warn('⚠️ Could not connect to promethios-oregon database, using default:', error.message);
  // Fallback to default database
  db = admin.firestore();
  console.log('🔧 Firestore Admin initialized with default database');
}

module.exports = {
  admin,
  db
};

