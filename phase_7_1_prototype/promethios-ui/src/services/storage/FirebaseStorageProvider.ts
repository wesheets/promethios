import { StorageProvider, StoragePolicy } from './types';

/**
 * Firebase Storage Provider
 * Cloud storage with automatic localStorage fallback
 */
export class FirebaseStorageProvider implements StorageProvider {
  name = 'firebase';
  private isInitialized = false;
  private initializationPromise: Promise<boolean> | null = null;
  private firestore: any = null;

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      return this.isInitialized;
    } catch {
      return false;
    }
  }

  private async initialize(): Promise<boolean> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<boolean> {
    try {
      // Check if Firebase environment variables are available
      const requiredEnvVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID'
      ];

      const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
      if (missingVars.length > 0) {
        console.warn('Firebase storage: Missing environment variables:', missingVars);
        return false;
      }

      // Dynamic import to avoid build issues when Firebase is not configured
      const { initializeApp } = await import('firebase/app');
      const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');

      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };

      const app = initializeApp(firebaseConfig);
      this.firestore = getFirestore(app);

      // Connect to emulator in development
      if (import.meta.env.DEV && !this.firestore._delegate._databaseId.projectId.includes('demo-')) {
        try {
          connectFirestoreEmulator(this.firestore, 'localhost', 8080);
        } catch (error) {
          // Emulator connection failed, continue with production
          console.warn('Firebase emulator connection failed, using production:', error);
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('Firebase not available');
      }

      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(this.firestore, 'storage', key);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Check TTL
      if (data.expiry && Date.now() > data.expiry) {
        await this.delete(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Firebase get error:', error);
      throw error;
    }
  }

  async set<T>(key: string, value: T, policy?: StoragePolicy): Promise<void> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('Firebase not available');
      }

      const { doc, setDoc } = await import('firebase/firestore');
      const docRef = doc(this.firestore, 'storage', key);
      
      const data: any = {
        value,
        timestamp: Date.now()
      };

      // Set TTL if specified
      if (policy?.ttl) {
        data.expiry = Date.now() + policy.ttl;
      }

      await setDoc(docRef, data);
    } catch (error) {
      console.error('Firebase set error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('Firebase not available');
      }

      const { doc, deleteDoc } = await import('firebase/firestore');
      const docRef = doc(this.firestore, 'storage', key);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Firebase delete error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('Firebase not available');
      }

      const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
      const storageCollection = collection(this.firestore, 'storage');
      const snapshot = await getDocs(storageCollection);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Firebase clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('Firebase not available');
      }

      const { collection, getDocs } = await import('firebase/firestore');
      const storageCollection = collection(this.firestore, 'storage');
      const snapshot = await getDocs(storageCollection);
      
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Firebase keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('Firebase not available');
      }

      const { collection, getDocs } = await import('firebase/firestore');
      const storageCollection = collection(this.firestore, 'storage');
      const snapshot = await getDocs(storageCollection);
      
      let totalSize = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalSize += JSON.stringify(data).length;
      });
      
      return totalSize;
    } catch (error) {
      console.error('Firebase size error:', error);
      return 0;
    }
  }

  // Cleanup expired documents
  async cleanup(): Promise<void> {
    try {
      if (!await this.isAvailable()) {
        return;
      }

      const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
      const storageCollection = collection(this.firestore, 'storage');
      const expiredQuery = query(
        storageCollection,
        where('expiry', '<=', Date.now())
      );
      
      const snapshot = await getDocs(expiredQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Firebase cleanup error:', error);
    }
  }
}

