import { firestore } from './config';
import { collection, getDocs, query, limit } from 'firebase/firestore';

/**
 * Validates Firestore access by attempting to query a public collection
 * This helps identify security rule issues or connection problems early
 * 
 * @returns {Promise<boolean>} True if Firestore access is successful, false otherwise
 */
export const validateFirestoreAccess = async (): Promise<boolean> => {
  try {
    console.log('Validating Firestore access...');
    
    // Try to access a public collection to validate Firestore access
    // This assumes you have a 'public' collection that allows read access
    // Modify the collection name if needed based on your Firestore structure
    const testQuery = query(collection(firestore, 'public'), limit(1));
    await getDocs(testQuery);
    
    console.log('✅ Firestore access validated successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Firestore access validation failed:', error);
    
    // Log detailed error information for debugging
    if (error.code) {
      console.error('Firestore Error Code:', error.code);
    }
    
    if (error.message) {
      console.error('Firestore Error Message:', error.message);
    }
    
    // Check for specific error types
    if (error.message?.includes('DEADLINE_EXCEEDED')) {
      console.error('Firestore connection timed out. This may indicate network issues or restrictive security rules.');
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      console.error('Firestore security rules are preventing access. Please check your security rules configuration.');
    } else if (error.message?.includes('NOT_FOUND')) {
      console.error('The specified collection does not exist. Please check your Firestore structure.');
    }
    
    return false;
  }
};

/**
 * Validates a specific Firestore collection access
 * Useful for testing access to specific collections with their own security rules
 * 
 * @param {string} collectionName - The name of the collection to validate
 * @returns {Promise<boolean>} True if access is successful, false otherwise
 */
export const validateCollectionAccess = async (collectionName: string): Promise<boolean> => {
  try {
    console.log(`Validating access to collection: ${collectionName}...`);
    
    const testQuery = query(collection(firestore, collectionName), limit(1));
    await getDocs(testQuery);
    
    console.log(`✅ Access to collection '${collectionName}' validated successfully`);
    return true;
  } catch (error: any) {
    console.error(`❌ Access to collection '${collectionName}' failed:`, error);
    return false;
  }
};

/**
 * Run validation tests for Firestore access
 * This can be called during application initialization to verify connectivity
 */
export const runFirestoreValidation = async (): Promise<void> => {
  console.log('Running Firestore validation tests...');
  
  // Validate general Firestore access
  const generalAccess = await validateFirestoreAccess();
  
  // Validate specific collections if needed
  // Uncomment and modify these lines based on your Firestore structure
  // const teamsAccess = await validateCollectionAccess('teams');
  // const usersAccess = await validateCollectionAccess('users');
  
  console.log('Firestore validation complete:', generalAccess ? '✅ Success' : '❌ Failed');
};
