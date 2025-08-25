import { StorageProvider, StorageOptions } from './types';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface FirebaseItem<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
  metadata?: Record<string, any>;
}

export class FirebaseStorageProvider implements StorageProvider {
  name = 'firebase';
  private isInitialized = false;
  private fallbackProvider?: StorageProvider;
  private static connectionStatus: boolean | null = null;
  private static lastConnectionTest: number = 0;
  private static readonly CONNECTION_CACHE_DURATION = 30000; // 30 seconds

  constructor(fallbackProvider?: StorageProvider) {
    this.fallbackProvider = fallbackProvider;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Test Firebase connection with a simple read
      const available = await this.isAvailable();
      if (available) {
        this.isInitialized = true;
        console.log('🔥 FirebaseStorageProvider initialized successfully');
      } else {
        this.isInitialized = false;
        console.warn('⚠️ FirebaseStorageProvider initialization failed - Firebase not available, will use fallback');
      }
    } catch (error) {
      console.warn('⚠️ FirebaseStorageProvider initialization failed, will use fallback:', error);
      this.isInitialized = false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Use cached connection status if recent
      const now = Date.now();
      if (FirebaseStorageProvider.connectionStatus !== null && 
          (now - FirebaseStorageProvider.lastConnectionTest) < FirebaseStorageProvider.CONNECTION_CACHE_DURATION) {
        return FirebaseStorageProvider.connectionStatus;
      }

      // Check if Firebase is properly configured
      if (!db) {
        console.error('🚨 Firebase database not initialized - check firebase/config.ts');
        FirebaseStorageProvider.connectionStatus = false;
        FirebaseStorageProvider.lastConnectionTest = now;
        return false;
      }

      console.log('🔥 Testing Firebase connection...');
      
      // Test Firebase connection by trying to read from a test document
      const testDoc = doc(db, 'system', 'health_check');
      const docSnap = await getDoc(testDoc);
      
      // If we can read (even if document doesn't exist), Firebase is available
      console.log('✅ Firebase connection test successful - Firebase is available');
      
      // Cache the successful connection
      FirebaseStorageProvider.connectionStatus = true;
      FirebaseStorageProvider.lastConnectionTest = now;
      
      return true;
    } catch (error) {
      console.error('❌ Firebase not available:', error);
      
      // Cache the failed connection
      FirebaseStorageProvider.connectionStatus = false;
      FirebaseStorageProvider.lastConnectionTest = now;
      
      // Check specific error types
      if (error instanceof Error) {
        if (error.message.includes('auth')) {
          console.error('🚨 Firebase authentication error - user may not be logged in');
        } else if (error.message.includes('permission')) {
          console.error('🚨 Firebase permission error - check Firestore rules');
        } else if (error.message.includes('network')) {
          console.error('🚨 Firebase network error - check internet connection');
        } else {
          console.error('🚨 Firebase unknown error:', error.message);
        }
      }
      
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Use cached connection status to avoid repeated tests
      if (FirebaseStorageProvider.connectionStatus === false) {
        if (this.fallbackProvider) {
          console.log(`📱 Firebase known unavailable, using fallback for key: ${key}`);
          return this.fallbackProvider.get<T>(key);
        }
        return null;
      }

      // Only test connection if we don't have cached status
      if (FirebaseStorageProvider.connectionStatus === null) {
        const available = await this.isAvailable();
        if (!available) {
          if (this.fallbackProvider) {
            console.log(`📱 Firebase unavailable, using fallback for key: ${key}`);
            return this.fallbackProvider.get<T>(key);
          }
          return null;
        }
      }

      // Parse the key to get collection and document
      const { collection: collectionName, document: documentId } = this.parseKey(key);
      
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as FirebaseItem<T>;
      
      // Check if item has expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        await this.delete(key);
        return null;
      }

      // Removed excessive Firebase retrieval logging to prevent console spam
      return data.value;

    } catch (error) {
      console.error(`FirebaseStorageProvider.get error for key ${key}:`, error);
      
      // Fallback on error
      if (this.fallbackProvider) {
        console.log(`📱 Firebase error, using fallback for key: ${key}`);
        return this.fallbackProvider.get<T>(key);
      }
      
      return null;
    }
  }

  // Utility function to recursively remove undefined values from objects
  private sanitizeData<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item)) as T;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized as T;
    }
    
    return data;
  }

  async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      // Always check availability for each operation
      const available = await this.isAvailable();
      if (!available) {
        if (this.fallbackProvider) {
          console.log(`📱 Firebase unavailable, using fallback for key: ${key}`);
          return this.fallbackProvider.set(key, value, options);
        }
        throw new Error('Firebase not available and no fallback provider');
      }

      // Parse the key to get collection and document
      const { collection: collectionName, document: documentId } = this.parseKey(key);
      
      // Sanitize the value to remove all undefined values
      const sanitizedValue = this.sanitizeData(value);
      
      const item: FirebaseItem<T> = {
        value: sanitizedValue,
        timestamp: Date.now(),
        ...(options?.metadata && { metadata: this.sanitizeData(options.metadata) })
      };

      // Set expiration if TTL is provided
      if (options?.ttl) {
        item.expiresAt = Date.now() + options.ttl;
      }

      // Final sanitization of the entire item
      const sanitizedItem = this.sanitizeData(item);

      const docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, sanitizedItem);

      // Stored to Firebase successfully
      return true;

      // Store in fallback for redundancy if available
      if (this.fallbackProvider && options?.redundantStorage !== false) {
        try {
          await this.fallbackProvider.set(key, value, options);
        } catch (fallbackError) {
          console.warn('Fallback storage failed:', fallbackError);
        }
      }

    } catch (error) {
      console.error(`FirebaseStorageProvider.set error for key ${key}:`, error);
      
      // Fallback on error
      if (this.fallbackProvider) {
        console.log(`📱 Firebase error, using fallback for key: ${key}`);
        return this.fallbackProvider.set(key, value, options);
      }
      
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // Always check availability for each operation
      const available = await this.isAvailable();
      if (!available) {
        if (this.fallbackProvider) {
          console.log(`📱 Firebase unavailable, using fallback for key: ${key}`);
          return this.fallbackProvider.delete(key);
        }
        throw new Error('Firebase not available and no fallback provider');
      }

      // Parse the key to get collection and document
      const { collection: collectionName, document: documentId } = this.parseKey(key);
      
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      // Deleted from Firebase successfully
      return true;

      // Delete from fallback if available
      if (this.fallbackProvider) {
        try {
          await this.fallbackProvider.delete(key);
        } catch (fallbackError) {
          console.warn('Fallback deletion failed:', fallbackError);
        }
      }

    } catch (error) {
      console.error(`FirebaseStorageProvider.delete error for key ${key}:`, error);
      
      // Fallback on error
      if (this.fallbackProvider) {
        console.log(`📱 Firebase error, using fallback for key: ${key}`);
        return this.fallbackProvider.delete(key);
      }
      
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // Always check availability for each operation
      const available = await this.isAvailable();
      if (!available) {
        if (this.fallbackProvider) {
          console.log(`📱 Firebase unavailable, using fallback for clear operation`);
          return this.fallbackProvider.clear();
        }
        throw new Error('Firebase not available and no fallback provider');
      }

      // Firebase clear implementation would go here
      // For now, fallback to localStorage if available
      console.warn('FirebaseStorageProvider.clear() not implemented - would require admin permissions');
      
      if (this.fallbackProvider) {
        return this.fallbackProvider.clear();
      }

    } catch (error) {
      console.error('FirebaseStorageProvider.clear error:', error);
      
      // Fallback on error
      if (this.fallbackProvider) {
        return this.fallbackProvider.clear();
      }
      
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      // Always check availability for each operation
      const available = await this.isAvailable();
      if (!available) {
        console.log(`📱 Firebase unavailable, using fallback for keys operation`);
        if (this.fallbackProvider) {
          const fallbackKeys = await this.fallbackProvider.keys();
          console.log(`📱 Fallback provider returned ${fallbackKeys.length} keys`);
          return fallbackKeys;
        }
        return [];
      }

      // For Firebase, we need to query collections to get document keys
      // This is more complex than localStorage but necessary for cross-device sync
      const keys: string[] = [];
      
      try {
        // Query common collections that might contain user data
        const collections = ['agents', 'multiAgentSystems', 'user', 'singleAgentChats', 'multiAgentChats', 'governance', 'preferences', 'notifications'];
        
        // Querying Firebase collections for keys...
        
        for (const collectionName of collections) {
          try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            snapshot.forEach((doc) => {
              // Convert Firestore document path back to storage key format
              const key = `${collectionName}.${doc.id}`;
              keys.push(key);
            });
            
            // Found documents in collection
          } catch (collectionError) {
            console.warn(`Failed to query collection ${collectionName}:`, collectionError);
          }
        }

        // Retrieved keys from Firebase collections
        
        // If we got keys from Firebase, return them
        if (keys.length > 0) {
          // Returning keys from Firebase
          return keys;
        }
        
        // If Firebase returned no keys, fall back to localStorage
        // Firebase returned 0 keys, falling back to localStorage...
        if (this.fallbackProvider) {
          const fallbackKeys = await this.fallbackProvider.keys();
          console.log(`📱 Fallback provider returned ${fallbackKeys.length} keys`);
          return fallbackKeys;
        }
        
        return [];

      } catch (queryError) {
        console.error('Firebase keys query error:', queryError);
        
        // Fall back to localStorage on any Firebase error
        // Firebase query failed, falling back to localStorage...
        if (this.fallbackProvider) {
          const fallbackKeys = await this.fallbackProvider.keys();
          console.log(`📱 Fallback provider returned ${fallbackKeys.length} keys after Firebase error`);
          return fallbackKeys;
        }
        
        return [];
      }

    } catch (error) {
      console.error('FirebaseStorageProvider.keys error:', error);
      
      // Fallback on any error
      if (this.fallbackProvider) {
        console.log(`📱 Using fallback provider due to Firebase keys error`);
        const fallbackKeys = await this.fallbackProvider.keys();
        console.log(`📱 Fallback provider returned ${fallbackKeys.length} keys after error`);
        return fallbackKeys;
      }
      
      return [];
    }
  }

  /**
   * Get user-specific collections (helper method for keys())
   */
  private async getUserCollections(): Promise<{ name: string }[]> {
    // In a real implementation, you'd use Firebase Admin SDK to list collections
    // For now, we'll return common user collection patterns
    // This is a limitation of the client SDK - it can't list collections
    
    // We can try to infer user collections based on auth context
    // But for now, return empty array and rely on direct collection queries
    return [];
  }

  async size(): Promise<number> {
    try {
      // Always check availability for each operation
      const available = await this.isAvailable();
      if (!available) {
        if (this.fallbackProvider) {
          console.log(`📱 Firebase unavailable, using fallback for size operation`);
          return this.fallbackProvider.size();
        }
        return 0;
      }

      // Firebase size implementation would go here
      // For now, fallback to localStorage if available
      if (this.fallbackProvider) {
        return this.fallbackProvider.size();
      }

      return 0;
    } catch (error) {
      console.error('FirebaseStorageProvider.size error:', error);
      
      // Fallback on error
      if (this.fallbackProvider) {
        return this.fallbackProvider.size();
      }
      
      return 0;
    }
  }

  /**
   * Parse storage key into Firestore collection and document
   * Format: namespace.key -> collection: namespace, document: key
   * For nested keys like user.123.wrapper.456 -> collection: user_123, document: wrapper_456
   */
  private parseKey(key: string): { collection: string; document: string } {
    const parts = key.split('.');
    
    if (parts.length < 2) {
      throw new Error(`Invalid key format: ${key}. Expected format: namespace.key`);
    }

    // Validate that no parts are undefined or empty
    const invalidParts = parts.filter(part => !part || part === 'undefined' || part === 'null');
    if (invalidParts.length > 0) {
      console.error(`🚨 Invalid key parts detected in: ${key}`, { parts, invalidParts });
      throw new Error(`Invalid key contains undefined/null values: ${key}`);
    }

    // For user-scoped keys like "user.123.wrapper.456"
    if (parts[0] === 'user' && parts.length >= 4) {
      const userId = parts[1];
      const namespace = parts[2];
      const documentId = parts.slice(3).join('_');
      
      // Additional validation for user-scoped keys
      if (!userId || userId === 'undefined' || !namespace || namespace === 'undefined') {
        console.error(`🚨 Invalid user-scoped key: ${key}`, { userId, namespace });
        throw new Error(`Invalid user-scoped key: ${key}`);
      }
      
      return {
        collection: `user_${userId}_${namespace}`,
        document: documentId
      };
    }

    // For simple namespace.key format
    const namespace = parts[0];
    const documentId = parts.slice(1).join('_');
    
    // Validate namespace and documentId
    if (!namespace || namespace === 'undefined' || !documentId || documentId === 'undefined') {
      console.error(`🚨 Invalid namespace/documentId: ${key}`, { namespace, documentId });
      throw new Error(`Invalid namespace or documentId in key: ${key}`);
    }
    
    return {
      collection: namespace,
      document: documentId
    };
  }

  /**
   * Query documents by pattern (useful for listing user data)
   */
  async queryByPattern(pattern: string): Promise<string[]> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return [];
      }

      // This would implement pattern-based querying
      // For now, return empty array
      console.warn('FirebaseStorageProvider.queryByPattern() not fully implemented');
      return [];

    } catch (error) {
      console.error('FirebaseStorageProvider.queryByPattern error:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    collections: string[];
  }> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return { totalDocuments: 0, totalSize: 0, collections: [] };
      }

      // This would implement storage statistics
      // For now, return empty stats
      console.warn('FirebaseStorageProvider.getStats() not fully implemented');
      return { totalDocuments: 0, totalSize: 0, collections: [] };

    } catch (error) {
      console.error('FirebaseStorageProvider.getStats error:', error);
      return { totalDocuments: 0, totalSize: 0, collections: [] };
    }
  }

  /**
   * Debug method to test Firebase connectivity and configuration
   */
  async debugFirebaseConnection(): Promise<{
    isConfigured: boolean;
    isConnected: boolean;
    canRead: boolean;
    canWrite: boolean;
    error?: string;
  }> {
    const result = {
      isConfigured: false,
      isConnected: false,
      canRead: false,
      canWrite: false,
      error: undefined as string | undefined
    };

    try {
      // Check if Firebase is configured
      if (!db) {
        result.error = 'Firebase database not initialized';
        return result;
      }
      result.isConfigured = true;

      // Test connection
      const testDoc = doc(db, 'debug', 'connection_test');
      
      // Test read
      try {
        await getDoc(testDoc);
        result.canRead = true;
        result.isConnected = true;
      } catch (readError) {
        result.error = `Read test failed: ${readError}`;
        return result;
      }

      // Test write
      try {
        await setDoc(testDoc, {
          timestamp: Date.now(),
          test: 'Firebase connection test'
        });
        result.canWrite = true;
      } catch (writeError) {
        result.error = `Write test failed: ${writeError}`;
        return result;
      }

      console.log('🔥 Firebase debug test completed successfully');
      return result;

    } catch (error) {
      result.error = `Debug test failed: ${error}`;
      return result;
    }
  }
}

