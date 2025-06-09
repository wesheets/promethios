// Test utilities for Firebase authentication and Firestore
// This is a simplified version for testing purposes

/**
 * Test email authentication
 * @param email Email address
 * @param password Password
 * @returns Promise with test result
 */
export const testEmailAuth = async (email: string, password: string) => {
  try {
    console.log(`Testing email auth with: ${email}`);
    // Simulate successful authentication
    return {
      success: true,
      data: { user: { email, uid: 'test-uid-123' } }
    };
  } catch (error) {
    console.error('Error in test email auth:', error);
    return { success: false, error };
  }
};

/**
 * Test Google authentication
 * @returns Promise with test result
 */
export const testGoogleAuth = async () => {
  try {
    console.log('Testing Google auth');
    // Simulate successful authentication
    return {
      success: true,
      data: { user: { email: 'test@gmail.com', uid: 'google-uid-123' } }
    };
  } catch (error) {
    console.error('Error in test Google auth:', error);
    return { success: false, error };
  }
};

/**
 * Test anonymous authentication
 * @returns Promise with test result
 */
export const testAnonymousAuth = async () => {
  try {
    console.log('Testing anonymous auth');
    // Simulate successful authentication
    return {
      success: true,
      data: { user: { uid: 'anon-uid-123' } }
    };
  } catch (error) {
    console.error('Error in test anonymous auth:', error);
    return { success: false, error };
  }
};

/**
 * Test Firestore connection
 * @returns Promise with test result
 */
export const testFirestoreConnection = async () => {
  try {
    console.log('Testing Firestore connection');
    // Simulate successful connection
    return {
      success: true,
      data: { message: 'Firestore connection successful' }
    };
  } catch (error) {
    console.error('Error in test Firestore connection:', error);
    return { success: false, error };
  }
};

/**
 * Get Firebase environment variables
 * @returns Object with Firebase environment variables
 */
export const getFirebaseEnvVars = () => {
  const vars = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'not-set',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'not-set',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'not-set',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'not-set',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'not-set',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || 'not-set',
  };

  // Mask sensitive values for display
  const maskedVars = {
    apiKey: vars.apiKey ? `${vars.apiKey.substring(0, 5)}...${vars.apiKey.substring(vars.apiKey.length - 5)}` : 'not-set',
    authDomain: vars.authDomain,
    projectId: vars.projectId,
    storageBucket: vars.storageBucket,
    messagingSenderId: vars.messagingSenderId ? `${vars.messagingSenderId.substring(0, 3)}...` : 'not-set',
    appId: vars.appId ? `${vars.appId.substring(0, 3)}...` : 'not-set',
  };

  return maskedVars;
};
