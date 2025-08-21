/**
 * Firestore Retry Utility
 * 
 * Provides retry logic with exponential backoff for Firestore operations
 * to improve connection stability and handle transient failures.
 */

import { firestoreUtils } from '../firebase/config';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Retry a Firestore operation with exponential backoff
 */
export async function retryFirestoreOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      console.log(`🔄 [Firestore Retry] Attempting ${operationName} (attempt ${attempt}/${opts.maxAttempts})`);
      
      // Check if we're online before attempting
      if (!firestoreUtils.isOnline() && attempt === 1) {
        console.log(`📴 [Firestore Retry] Offline mode detected for ${operationName}, using cache`);
      }
      
      const result = await operation();
      
      // Reset retry count on success
      firestoreUtils.resetRetryCount();
      console.log(`✅ [Firestore Retry] ${operationName} succeeded on attempt ${attempt}`);
      
      return result;
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ [Firestore Retry] ${operationName} failed on attempt ${attempt}:`, error.code || error.message);
      
      // Don't retry on certain error types
      if (isNonRetryableError(error)) {
        console.log(`🚫 [Firestore Retry] Non-retryable error for ${operationName}, not retrying`);
        throw error;
      }
      
      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts) {
        console.error(`🚨 [Firestore Retry] ${operationName} failed after ${opts.maxAttempts} attempts`);
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );
      
      console.log(`⏳ [Firestore Retry] Waiting ${delay}ms before retry ${attempt + 1} for ${operationName}`);
      await sleep(delay);
      
      firestoreUtils.incrementRetryCount();
    }
  }
  
  throw lastError;
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  const nonRetryableCodes = [
    'permission-denied',
    'invalid-argument',
    'not-found',
    'already-exists',
    'failed-precondition',
    'out-of-range',
    'unauthenticated'
  ];
  
  return nonRetryableCodes.includes(error.code);
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrapper for common Firestore operations with retry logic
 */
export const firestoreRetry = {
  /**
   * Retry a document read operation
   */
  async getDoc<T>(operation: () => Promise<T>, docPath: string): Promise<T> {
    return retryFirestoreOperation(operation, `getDoc(${docPath})`);
  },
  
  /**
   * Retry a document write operation
   */
  async setDoc<T>(operation: () => Promise<T>, docPath: string): Promise<T> {
    return retryFirestoreOperation(operation, `setDoc(${docPath})`);
  },
  
  /**
   * Retry a document update operation
   */
  async updateDoc<T>(operation: () => Promise<T>, docPath: string): Promise<T> {
    return retryFirestoreOperation(operation, `updateDoc(${docPath})`);
  },
  
  /**
   * Retry a collection query operation
   */
  async getDocs<T>(operation: () => Promise<T>, collectionPath: string): Promise<T> {
    return retryFirestoreOperation(operation, `getDocs(${collectionPath})`);
  },
  
  /**
   * Retry adding a document to a collection
   */
  async addDoc<T>(operation: () => Promise<T>, collectionPath: string): Promise<T> {
    return retryFirestoreOperation(operation, `addDoc(${collectionPath})`);
  }
};

