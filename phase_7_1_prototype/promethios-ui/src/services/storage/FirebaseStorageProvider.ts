import { StorageProvider, StoragePolicy } from './types';

/**
 * Firebase Firestore implementation of the StorageProvider interface
 * Provides cloud persistence with real-time synchronization
 * Includes automatic fallback to localStorage on connection issues
 */
export class FirebaseStorageProvider implements StorageProvider {
  private subscriptions = new Map<string, Set<(value: any) => void>>();
  private subscriptionCounter = 0;
  private isOnline = navigator.onLine;
  private fallbackProvider: StorageProvider | null = null;
  private firestore: any = null;
  private auth: any = null;
  private initialized = false;
  private initializationPromise: Promise<boolean> | null = null;

  constructor(fallbackProvider?: StorageProvider) {
    this.fallbackProvider = fallbackProvider || null;
    
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('FirebaseStorageProvider: Back online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('FirebaseStorageProvider: Gone offline, using fallback');
    });
  }

  private async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<boolean> {
    try {
      // Dynamic import to avoid loading Firebase if not needed
      const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
      const { getAuth } = await import('firebase/auth');
      const { getApps, initializeApp } = await import('firebase/app');

      // Check if Firebase app is already initialized
      const apps = getApps();
      let app;
      
      if (apps.length === 0) {
        // Initialize Firebase app if not already done
        const firebaseConfig = {
          // These would come from environment variables in production
          apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
          authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
          storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.REACT_APP_FIREBASE_APP_ID
        };

        if (!firebaseConfig.apiKey) {
          console.warn('FirebaseStorageProvider: Firebase config not found, using fallback');
          return false;
        }

        app = initializeApp(firebaseConfig);
      } else {
        app = apps[0];
      }

      this.firestore = getFirestore(app);
      this.auth = getAuth(app);

      // Connect to emulator in development
      if (process.env.NODE_ENV === 'development' && !this.firestore._delegate._databaseId.projectId.includes('demo-')) {
        try {
          connectFirestoreEmulator(this.firestore, 'localhost', 8080);
        } catch (error) {
          // Emulator connection might fail, that's okay
          console.log('FirebaseStorageProvider: Could not connect to emulator, using production');
        }
      }

      this.initialized = true;
      console.log('FirebaseStorageProvider: Initialized successfully');
      return true;
    } catch (error) {
      console.error('FirebaseStorageProvider: Initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isOnline || !(await this.initialize())) {
        return this.fallbackProvider?.get(key) || null;
      }

      const { doc, getDoc } = await import('firebase/firestore');
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        return this.fallbackProvider?.get(key) || null;
      }

      const docRef = doc(this.firestore, 'users', userId, 'storage', key);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if item has expired
        if (data.expiry && Date.now() > data.expiry) {
          await this.delete(key);
          return null;
        }
        
        return data.value;
      }

      return null;
    } catch (error) {
      console.error(`FirebaseStorageProvider: Error getting key ${key}:`, error);
      return this.fallbackProvider?.get(key) || null;
    }
  }

  async set<T>(key: string, value: T, policy?: StoragePolicy): Promise<boolean> {
    try {
      // Validate policy constraints
      if (policy?.forbiddenProviders?.includes('firebase')) {
        throw new Error(`Policy violation: ${key} cannot be stored in Firebase`);
      }

      if (!this.isOnline || !(await this.initialize())) {
        return this.fallbackProvider?.set(key, value, policy) || false;
      }

      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        return this.fallbackProvider?.set(key, value, policy) || false;
      }

      // Prepare document data
      const docData: any = {
        value,
        updatedAt: serverTimestamp(),
        policy: policy || {}
      };

      // Apply TTL if specified
      if (policy?.ttl) {
        docData.expiry = Date.now() + policy.ttl;
      }

      // Apply encryption if required
      if (policy?.encryption) {
        // TODO: Implement encryption for sensitive data
        console.warn(`FirebaseStorageProvider: Encryption requested for ${key} but not implemented`);
      }

      const docRef = doc(this.firestore, 'users', userId, 'storage', key);
      await setDoc(docRef, docData);
      
      // Notify subscribers
      this.notifySubscribers(key, value);
      
      return true;
    } catch (error) {
      console.error(`FirebaseStorageProvider: Error setting key ${key}:`, error);
      return this.fallbackProvider?.set(key, value, policy) || false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isOnline || !(await this.initialize())) {
        return this.fallbackProvider?.delete(key) || false;
      }

      const { doc, deleteDoc } = await import('firebase/firestore');
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        return this.fallbackProvider?.delete(key) || false;
      }

      const docRef = doc(this.firestore, 'users', userId, 'storage', key);
      await deleteDoc(docRef);
      
      this.notifySubscribers(key, null);
      return true;
    } catch (error) {
      console.error(`FirebaseStorageProvider: Error deleting key ${key}:`, error);
      return this.fallbackProvider?.delete(key) || false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      if (!this.isOnline || !(await this.initialize())) {
        return this.fallbackProvider?.clear() || false;
      }

      const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        return this.fallbackProvider?.clear() || false;
      }

      const storageRef = collection(this.firestore, 'users', userId, 'storage');
      const snapshot = await getDocs(storageRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Notify all subscribers
      this.subscriptions.forEach((callbacks, key) => {
        callbacks.forEach(callback => callback(null));
      });
      
      return true;
    } catch (error) {
      console.error('FirebaseStorageProvider: Error clearing storage:', error);
      return this.fallbackProvider?.clear() || false;
    }
  }

  subscribe(key: string, callback: (value: any) => void): string {
    const subscriptionId = `firebase_${this.subscriptionCounter++}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key)!.add(callback);
    
    // Store subscription ID for cleanup
    (callback as any).__subscriptionId = subscriptionId;
    
    // Set up real-time listener if Firebase is available
    this.setupRealtimeListener(key);
    
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.forEach((callbacks, key) => {
      callbacks.forEach(callback => {
        if ((callback as any).__subscriptionId === subscriptionId) {
          callbacks.delete(callback);
        }
      });
      
      // Clean up empty subscription sets
      if (callbacks.size === 0) {
        this.subscriptions.delete(key);
      }
    });
  }

  async getNamespace(namespace: string): Promise<Record<string, any>> {
    try {
      if (!this.isOnline || !(await this.initialize())) {
        return this.fallbackProvider?.getNamespace?.(namespace) || {};
      }

      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        return this.fallbackProvider?.getNamespace?.(namespace) || {};
      }

      const storageRef = collection(this.firestore, 'users', userId, 'storage');
      const q = query(storageRef, where('__name__', '>=', `${namespace}.`), where('__name__', '<', `${namespace}.\uf8ff`));
      
      const snapshot = await getDocs(q);
      const result: Record<string, any> = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Check if item has expired
        if (!data.expiry || Date.now() <= data.expiry) {
          // Remove namespace prefix from key
          const shortKey = doc.id.substring(namespace.length + 1);
          result[shortKey] = data.value;
        }
      });
      
      return result;
    } catch (error) {
      console.error(`FirebaseStorageProvider: Error getting namespace ${namespace}:`, error);
      return this.fallbackProvider?.getNamespace?.(namespace) || {};
    }
  }

  async clearNamespace(namespace: string): Promise<boolean> {
    try {
      if (!this.isOnline || !(await this.initialize())) {
        return this.fallbackProvider?.clearNamespace?.(namespace) || false;
      }

      const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        return this.fallbackProvider?.clearNamespace?.(namespace) || false;
      }

      const storageRef = collection(this.firestore, 'users', userId, 'storage');
      const q = query(storageRef, where('__name__', '>=', `${namespace}.`), where('__name__', '<', `${namespace}.\uf8ff`));
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => {
        this.notifySubscribers(doc.id, null);
        return deleteDoc(doc.ref);
      });
      
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error(`FirebaseStorageProvider: Error clearing namespace ${namespace}:`, error);
      return this.fallbackProvider?.clearNamespace?.(namespace) || false;
    }
  }

  async getStorageInfo(): Promise<{
    provider: string;
    available: boolean;
    usage?: number;
    quota?: number;
  }> {
    try {
      const isAvailable = this.isOnline && (await this.initialize());
      
      if (!isAvailable) {
        return {
          provider: 'firebase',
          available: false
        };
      }

      // Firebase doesn't provide easy access to storage usage
      // This would require additional implementation
      return {
        provider: 'firebase',
        available: true,
        usage: undefined, // Would need to calculate
        quota: undefined  // Firebase has generous limits
      };
    } catch (error) {
      return {
        provider: 'firebase',
        available: false
      };
    }
  }

  private getCurrentUserId(): string | null {
    try {
      return this.auth?.currentUser?.uid || null;
    } catch (error) {
      console.error('FirebaseStorageProvider: Error getting current user:', error);
      return null;
    }
  }

  private async setupRealtimeListener(key: string): Promise<void> {
    try {
      if (!this.isOnline || !(await this.initialize())) {
        return;
      }

      const { doc, onSnapshot } = await import('firebase/firestore');
      const userId = this.getCurrentUserId();
      
      if (!userId) return;

      const docRef = doc(this.firestore, 'users', userId, 'storage', key);
      
      onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          
          // Check if item has expired
          if (!data.expiry || Date.now() <= data.expiry) {
            this.notifySubscribers(key, data.value);
          } else {
            this.notifySubscribers(key, null);
          }
        } else {
          this.notifySubscribers(key, null);
        }
      }, (error) => {
        console.error(`FirebaseStorageProvider: Real-time listener error for ${key}:`, error);
      });
    } catch (error) {
      console.error(`FirebaseStorageProvider: Error setting up real-time listener for ${key}:`, error);
    }
  }

  private notifySubscribers(key: string, value: any): void {
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`FirebaseStorageProvider: Error in subscription callback for ${key}:`, error);
        }
      });
    }
  }

  // Cleanup method
  destroy(): void {
    this.subscriptions.clear();
    this.initialized = false;
    this.initializationPromise = null;
  }
}

