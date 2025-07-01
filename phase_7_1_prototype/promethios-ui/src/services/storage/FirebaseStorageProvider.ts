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

  constructor(fallbackProvider?: StorageProvider) {
    this.fallbackProvider = fallbackProvider;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Test Firebase connection with a simple read
      await this.isAvailable();
      this.isInitialized = true;
      console.log('🔥 FirebaseStorageProvider initialized successfully');
    } catch (error) {
      console.warn('⚠️ FirebaseStorageProvider initialization failed, will use fallback:', error);
      this.isInitialized = false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test Firebase connection by trying to read from a test document
      const testDoc = doc(db, 'system', 'health_check');
      await getDoc(testDoc);
      return true;
    } catch (error) {
      console.warn('Firebase not available:', error);
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const available = await this.isAvailable();
      if (!available && this.fallbackProvider) {
        console.log(`📱 Firebase unavailable, using fallback for key: ${key}`);
        return this.fallbackProvider.get<T>(key);
      }

      if (!available) {
        return null;
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

      console.log(`🔥 Retrieved from Firebase: ${key}`);
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

  async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      const available = await this.isAvailable();
      if (!available && this.fallbackProvider) {
        console.log(`📱 Firebase unavailable, using fallback for key: ${key}`);
        return this.fallbackProvider.set(key, value, options);
      }

      if (!available) {
        throw new Error('Firebase not available and no fallback provider');
      }

      // Parse the key to get collection and document
      const { collection: collectionName, document: documentId } = this.parseKey(key);
      
      const item: FirebaseItem<T> = {
        value,
        timestamp: Date.now(),
        metadata: options?.metadata
      };

      // Set expiration if TTL is provided
      if (options?.ttl) {
        item.expiresAt = Date.now() + options.ttl;
      }

      const docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, item);

      console.log(`🔥 Stored to Firebase: ${key}`);

      // Also store in fallback for redundancy if available
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
      const available = await this.isAvailable();
      if (!available && this.fallbackProvider) {
        console.log(`📱 Firebase unavailable, using fallback for key: ${key}`);
        return this.fallbackProvider.delete(key);
      }

      if (!available) {
        throw new Error('Firebase not available and no fallback provider');
      }

      // Parse the key to get collection and document
      const { collection: collectionName, document: documentId } = this.parseKey(key);
      
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);

      console.log(`🔥 Deleted from Firebase: ${key}`);

      // Also delete from fallback if available
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
    console.warn('FirebaseStorageProvider.clear() not implemented - would require admin permissions');
    
    // Fallback to clear local storage
    if (this.fallbackProvider) {
      await this.fallbackProvider.clear();
    }
  }

  async keys(): Promise<string[]> {
    try {
      const available = await this.isAvailable();
      if (!available && this.fallbackProvider) {
        return this.fallbackProvider.keys();
      }

      if (!available) {
        return [];
      }

      // This would require querying all collections, which is complex in Firestore
      // For now, return empty array and rely on fallback
      console.warn('FirebaseStorageProvider.keys() not fully implemented');
      
      if (this.fallbackProvider) {
        return this.fallbackProvider.keys();
      }
      
      return [];

    } catch (error) {
      console.error('FirebaseStorageProvider.keys error:', error);
      
      if (this.fallbackProvider) {
        return this.fallbackProvider.keys();
      }
      
      return [];
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

    // For user-scoped keys like "user.123.wrapper.456"
    if (parts[0] === 'user' && parts.length >= 4) {
      const userId = parts[1];
      const namespace = parts[2];
      const documentId = parts.slice(3).join('_');
      return {
        collection: `user_${userId}_${namespace}`,
        document: documentId
      };
    }

    // For simple namespace.key format
    const namespace = parts[0];
    const documentId = parts.slice(1).join('_');
    
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
}

      // Firebase implementation would go here
      // For now, fallback to localStorage if available
      if (this.fallbackProvider) {
        return this.fallbackProvider.delete(key);
      }

      throw new Error('Firebase not available');
    } catch (error) {
      console.error(`FirebaseStorageProvider.delete error for key ${key}:`, error);
      
      // Fallback on error
      if (this.fallbackProvider) {
        return this.fallbackProvider.delete(key);
      }
      
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const available = await this.isAvailable();
      if (!available && this.fallbackProvider) {
        return this.fallbackProvider.clear();
      }

      if (!available) {
        throw new Error('Firebase not available and no fallback provider');
      }

      // Firebase implementation would go here
      // For now, fallback to localStorage if available
      if (this.fallbackProvider) {
        return this.fallbackProvider.clear();
      }

      throw new Error('Firebase not available');
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
      const available = await this.isAvailable();
      if (!available && this.fallbackProvider) {
        return this.fallbackProvider.keys();
      }

      if (!available) {
        return [];
      }

      // Firebase implementation would go here
      // For now, fallback to localStorage if available
      if (this.fallbackProvider) {
        return this.fallbackProvider.keys();
      }

      return [];
    } catch (error) {
      console.error('FirebaseStorageProvider.keys error:', error);
      
      // Fallback on error
      if (this.fallbackProvider) {
        return this.fallbackProvider.keys();
      }
      
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      const available = await this.isAvailable();
      if (!available && this.fallbackProvider) {
        return this.fallbackProvider.size();
      }

      if (!available) {
        return 0;
      }

      // Firebase implementation would go here
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
}

