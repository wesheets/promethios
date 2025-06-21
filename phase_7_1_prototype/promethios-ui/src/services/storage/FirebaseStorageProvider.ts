import { StorageProvider } from '../types/storage';

/**
 * Firebase Firestore implementation of the StorageProvider interface.
 * Provides cloud storage with real-time sync capabilities.
 */
export class FirebaseStorageProvider implements StorageProvider {
  private firestore: any; // Will be properly typed when Firebase is integrated
  private collection: string;
  private userId?: string;
  private isInitialized: boolean = false;
  private lastError?: string;
  
  constructor(collection: string = 'user_storage') {
    this.collection = collection;
  }
  
  async initialize(firestore: any, userId: string): Promise<boolean> {
    try {
      this.firestore = firestore;
      this.userId = userId;
      this.isInitialized = true;
      this.lastError = undefined;
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Initialization failed';
      console.error('FirebaseStorageProvider initialization error:', error);
      return false;
    }
  }
  
  private getDocumentPath(key: string): string {
    if (!this.userId) {
      throw new Error('Firebase storage provider not initialized with user ID');
    }
    return `${this.collection}/${this.userId}/data/${key.replace(/\./g, '_')}`;
  }
  
  private checkInitialized(): void {
    if (!this.isInitialized || !this.firestore || !this.userId) {
      throw new Error('Firebase storage provider not properly initialized');
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      this.checkInitialized();
      
      const docRef = this.firestore.doc(this.getDocumentPath(key));
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data();
      
      // Check for TTL expiration
      if (data.ttl && Date.now() > data.ttl) {
        await this.delete(key);
        return null;
      }
      
      return data.value;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Get operation failed';
      console.error(`FirebaseStorageProvider.get error for key ${key}:`, error);
      return null;
    }
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      this.checkInitialized();
      
      const docRef = this.firestore.doc(this.getDocumentPath(key));
      const data = {
        value,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : null,
        key: key // Store original key for querying
      };
      
      await docRef.set(data);
      this.lastError = undefined;
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Set operation failed';
      console.error(`FirebaseStorageProvider.set error for key ${key}:`, error);
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    try {
      this.checkInitialized();
      
      const docRef = this.firestore.doc(this.getDocumentPath(key));
      await docRef.delete();
      this.lastError = undefined;
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Delete operation failed';
      console.error(`FirebaseStorageProvider.delete error for key ${key}:`, error);
      return false;
    }
  }
  
  async clear(): Promise<boolean> {
    try {
      this.checkInitialized();
      
      const keys = await this.keys();
      const batch = this.firestore.batch();
      
      for (const key of keys) {
        const docRef = this.firestore.doc(this.getDocumentPath(key));
        batch.delete(docRef);
      }
      
      await batch.commit();
      this.lastError = undefined;
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Clear operation failed';
      console.error('FirebaseStorageProvider.clear error:', error);
      return false;
    }
  }
  
  async keys(): Promise<string[]> {
    try {
      this.checkInitialized();
      
      const collectionRef = this.firestore.collection(`${this.collection}/${this.userId}/data`);
      const snapshot = await collectionRef.get();
      
      return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return data.key || doc.id.replace(/_/g, '.');
      });
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Keys operation failed';
      console.error('FirebaseStorageProvider.keys error:', error);
      return [];
    }
  }
  
  async has(key: string): Promise<boolean> {
    try {
      this.checkInitialized();
      
      const docRef = this.firestore.doc(this.getDocumentPath(key));
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return false;
      }
      
      const data = doc.data();
      
      // Check for TTL expiration
      if (data.ttl && Date.now() > data.ttl) {
        await this.delete(key);
        return false;
      }
      
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Has operation failed';
      console.error(`FirebaseStorageProvider.has error for key ${key}:`, error);
      return false;
    }
  }
  
  async size(): Promise<number> {
    try {
      const keys = await this.keys();
      return keys.length;
    } catch (error) {
      console.error('FirebaseStorageProvider.size error:', error);
      return 0;
    }
  }
  
  // Real-time subscription support
  subscribe(key: string, callback: (value: any) => void): () => void {
    try {
      this.checkInitialized();
      
      const docRef = this.firestore.doc(this.getDocumentPath(key));
      
      const unsubscribe = docRef.onSnapshot((doc: any) => {
        if (doc.exists) {
          const data = doc.data();
          
          // Check for TTL expiration
          if (data.ttl && Date.now() > data.ttl) {
            this.delete(key);
            callback(null);
          } else {
            callback(data.value);
          }
        } else {
          callback(null);
        }
      }, (error: any) => {
        this.lastError = error.message;
        console.error(`Firebase subscription error for key ${key}:`, error);
        callback(null);
      });
      
      return unsubscribe;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Subscription failed';
      console.error(`FirebaseStorageProvider.subscribe error for key ${key}:`, error);
      return () => {}; // Return no-op unsubscribe function
    }
  }
  
  // Batch operations for efficiency
  async setBatch(items: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      this.checkInitialized();
      
      const batch = this.firestore.batch();
      
      for (const item of items) {
        const docRef = this.firestore.doc(this.getDocumentPath(item.key));
        const data = {
          value: item.value,
          timestamp: Date.now(),
          ttl: item.ttl ? Date.now() + item.ttl : null,
          key: item.key
        };
        batch.set(docRef, data);
      }
      
      await batch.commit();
      this.lastError = undefined;
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Batch set failed';
      console.error('FirebaseStorageProvider.setBatch error:', error);
      return false;
    }
  }
  
  // Admin panel integration methods
  async getProviderStatus(): Promise<{
    name: string;
    available: boolean;
    healthy: boolean;
    lastError?: string;
    metrics: {
      totalKeys: number;
      storageUsed: number;
      storageAvailable: number;
    };
  }> {
    try {
      const isAvailable = this.isInitialized && this.firestore && this.userId;
      let totalKeys = 0;
      
      if (isAvailable) {
        totalKeys = await this.size();
      }
      
      return {
        name: 'firebase',
        available: isAvailable,
        healthy: isAvailable && !this.lastError,
        lastError: this.lastError,
        metrics: {
          totalKeys,
          storageUsed: 0, // Firebase doesn't provide easy storage size calculation
          storageAvailable: Number.MAX_SAFE_INTEGER // Firebase has generous limits
        }
      };
    } catch (error) {
      return {
        name: 'firebase',
        available: false,
        healthy: false,
        lastError: error instanceof Error ? error.message : 'Status check failed',
        metrics: {
          totalKeys: 0,
          storageUsed: 0,
          storageAvailable: 0
        }
      };
    }
  }
  
  async getNamespaceInfo(): Promise<Array<{
    namespace: string;
    keyCount: number;
    estimatedSize: number;
    lastAccessed?: number;
  }>> {
    try {
      this.checkInitialized();
      
      const keys = await this.keys();
      const namespaces = new Map<string, {
        keyCount: number;
        estimatedSize: number;
        lastAccessed?: number;
      }>();
      
      // Get document data for each key to calculate sizes and timestamps
      for (const key of keys) {
        const namespace = key.split('.')[0];
        
        try {
          const docRef = this.firestore.doc(this.getDocumentPath(key));
          const doc = await docRef.get();
          
          if (doc.exists) {
            const data = doc.data();
            const size = JSON.stringify(data).length; // Rough estimate
            
            if (!namespaces.has(namespace)) {
              namespaces.set(namespace, {
                keyCount: 0,
                estimatedSize: 0
              });
            }
            
            const nsInfo = namespaces.get(namespace)!;
            nsInfo.keyCount++;
            nsInfo.estimatedSize += size;
            
            if (data.timestamp) {
              nsInfo.lastAccessed = Math.max(nsInfo.lastAccessed || 0, data.timestamp);
            }
          }
        } catch (error) {
          console.warn(`Error getting info for key ${key}:`, error);
        }
      }
      
      return Array.from(namespaces.entries()).map(([namespace, info]) => ({
        namespace,
        ...info
      }));
    } catch (error) {
      console.error('FirebaseStorageProvider.getNamespaceInfo error:', error);
      return [];
    }
  }
  
  // Sync status for admin monitoring
  async getSyncStatus(): Promise<{
    connected: boolean;
    lastSync?: number;
    pendingWrites: number;
  }> {
    try {
      this.checkInitialized();
      
      // This would need to be implemented based on Firebase's connection state
      // For now, return basic status
      return {
        connected: this.isInitialized && !this.lastError,
        lastSync: Date.now(),
        pendingWrites: 0
      };
    } catch (error) {
      return {
        connected: false,
        pendingWrites: 0
      };
    }
  }
}

