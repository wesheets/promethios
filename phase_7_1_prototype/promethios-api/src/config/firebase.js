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
      console.log('🔑 Service account key length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length);
      
      try {
        // Ensure the service account key is properly formatted
        let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
        // Handle potential escaping issues
        if (typeof serviceAccountKey === 'string' && serviceAccountKey.startsWith('"') && serviceAccountKey.endsWith('"')) {
          serviceAccountKey = serviceAccountKey.slice(1, -1);
        }
        
        // Try to clean up common JSON formatting issues
        serviceAccountKey = serviceAccountKey.replace(/\n/g, '').replace(/\r/g, '').trim();
        
        // Parse the service account
        const serviceAccount = JSON.parse(serviceAccountKey);
        console.log('🔑 Service account parsed successfully, project_id:', serviceAccount.project_id);
        console.log('🔑 Service account type:', serviceAccount.type);
        console.log('🔑 Service account client_email:', serviceAccount.client_email);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || 'promethios',
          databaseURL: `https://${serviceAccount.project_id || 'promethios'}-default-rtdb.firebaseio.com/`
        });
        console.log('🔥 Firebase Admin SDK initialized with service account');
      } catch (parseError) {
        console.error('❌ Failed to parse service account key:', parseError.message);
        console.error('❌ Service account key preview:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0, 100) + '...');
        
        // Don't throw the error - fall through to fallback initialization
        console.log('🔄 Falling back to basic initialization without service account');
        admin.initializeApp({
          projectId: 'promethios'
        });
        console.log('🔥 Firebase Admin SDK initialized with basic configuration');
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
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Fallback initialization for development
    try {
      admin.initializeApp({
        projectId: 'promethios'
      });
      console.log('🔥 Firebase Admin SDK initialized with fallback configuration');
    } catch (fallbackError) {
      console.error('❌ Even fallback initialization failed:', fallbackError);
      throw fallbackError;
    }
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

