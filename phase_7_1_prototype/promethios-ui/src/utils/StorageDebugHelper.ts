import { unifiedStorage } from '../services/UnifiedStorageService';

export class StorageDebugHelper {
  /**
   * Test which storage provider is actually being used for each namespace
   */
  static async testStorageProviders(): Promise<{
    namespaces: { 
      name: string; 
      provider: string; 
      isFirebaseAvailable: boolean;
      keyCount: number;
      sampleKeys: string[];
    }[];
    summary: {
      usingFirebase: number;
      usingLocalStorage: number;
      totalNamespaces: number;
    };
  }> {
    const result = {
      namespaces: [] as any[],
      summary: {
        usingFirebase: 0,
        usingLocalStorage: 0,
        totalNamespaces: 0
      }
    };

    try {
      // Test common namespaces
      const namespacesToTest = [
        'agents', 'multiAgentSystems', 'user', 'singleAgentChats', 
        'multiAgentChats', 'governance', 'preferences', 'notifications'
      ];

      for (const namespace of namespacesToTest) {
        try {
          console.log(`🔍 Testing namespace: ${namespace}`);
          
          // Get the provider for this namespace
          const provider = unifiedStorage.getProvider(namespace);
          const providerName = provider.name;
          
          // Test if Firebase is available for this provider
          let isFirebaseAvailable = false;
          if (provider.name === 'firebase') {
            isFirebaseAvailable = await provider.isAvailable();
          }
          
          // Get keys for this namespace
          const keys = await unifiedStorage.keys(namespace);
          const sampleKeys = keys.slice(0, 5);
          
          result.namespaces.push({
            name: namespace,
            provider: providerName,
            isFirebaseAvailable,
            keyCount: keys.length,
            sampleKeys
          });
          
          // Update summary
          if (providerName === 'firebase' && isFirebaseAvailable) {
            result.summary.usingFirebase++;
          } else {
            result.summary.usingLocalStorage++;
          }
          result.summary.totalNamespaces++;
          
          console.log(`📊 ${namespace}: ${providerName} (${keys.length} keys)`);
          
        } catch (namespaceError) {
          console.error(`Failed to test namespace ${namespace}:`, namespaceError);
        }
      }

      return result;

    } catch (error) {
      console.error('Storage provider test failed:', error);
      return result;
    }
  }

  /**
   * Test Firebase connectivity specifically
   */
  static async testFirebaseConnectivity(): Promise<{
    configured: boolean;
    authenticated: boolean;
    canRead: boolean;
    canWrite: boolean;
    error?: string;
  }> {
    const result = {
      configured: false,
      authenticated: false,
      canRead: false,
      canWrite: false,
      error: undefined as string | undefined
    };

    try {
      // Import Firebase modules
      const { db } = await import('../firebase/config');
      const { auth } = await import('../firebase/config');
      const { doc, getDoc, setDoc } = await import('firebase/firestore');

      // Check if Firebase is configured
      if (!db) {
        result.error = 'Firebase database not configured';
        return result;
      }
      result.configured = true;

      // Check if user is authenticated
      if (auth.currentUser) {
        result.authenticated = true;
        console.log(`👤 User authenticated: ${auth.currentUser.email}`);
      } else {
        console.warn('⚠️ User not authenticated');
      }

      // Test read
      const testDoc = doc(db, 'debug', 'connectivity_test');
      await getDoc(testDoc);
      result.canRead = true;
      console.log('✅ Firebase read test passed');

      // Test write
      await setDoc(testDoc, {
        timestamp: Date.now(),
        test: 'Storage debug test',
        userId: auth.currentUser?.uid || 'anonymous'
      });
      result.canWrite = true;
      console.log('✅ Firebase write test passed');

      return result;

    } catch (error) {
      result.error = `Firebase connectivity test failed: ${error}`;
      console.error('❌ Firebase connectivity test failed:', error);
      return result;
    }
  }

  /**
   * Check what's actually stored in localStorage vs Firebase
   */
  static async compareStorageContents(): Promise<{
    localStorage: { keys: string[]; count: number };
    firebase: { keys: string[]; count: number };
    comparison: {
      onlyInLocalStorage: string[];
      onlyInFirebase: string[];
      inBoth: string[];
    };
  }> {
    const result = {
      localStorage: { keys: [] as string[], count: 0 },
      firebase: { keys: [] as string[], count: 0 },
      comparison: {
        onlyInLocalStorage: [] as string[],
        onlyInFirebase: [] as string[],
        inBoth: [] as string[]
      }
    };

    try {
      // Get localStorage keys
      const localStorageProvider = unifiedStorage.providers.get('localStorage');
      if (localStorageProvider) {
        const localKeys = await localStorageProvider.keys();
        result.localStorage.keys = localKeys;
        result.localStorage.count = localKeys.length;
      }

      // Get Firebase keys
      const firebaseProvider = unifiedStorage.providers.get('firebase');
      if (firebaseProvider) {
        const firebaseKeys = await firebaseProvider.keys();
        result.firebase.keys = firebaseKeys;
        result.firebase.count = firebaseKeys.length;
      }

      // Compare
      const localSet = new Set(result.localStorage.keys);
      const firebaseSet = new Set(result.firebase.keys);

      result.comparison.onlyInLocalStorage = result.localStorage.keys.filter(key => !firebaseSet.has(key));
      result.comparison.onlyInFirebase = result.firebase.keys.filter(key => !localSet.has(key));
      result.comparison.inBoth = result.localStorage.keys.filter(key => firebaseSet.has(key));

      console.log(`📊 Storage comparison:
        - localStorage: ${result.localStorage.count} keys
        - Firebase: ${result.firebase.count} keys
        - Only in localStorage: ${result.comparison.onlyInLocalStorage.length}
        - Only in Firebase: ${result.comparison.onlyInFirebase.length}
        - In both: ${result.comparison.inBoth.length}`);

      return result;

    } catch (error) {
      console.error('Storage comparison failed:', error);
      return result;
    }
  }

  /**
   * Run comprehensive storage diagnostics
   */
  static async runDiagnostics(): Promise<{
    providers: any;
    firebase: any;
    comparison: any;
    recommendations: string[];
  }> {
    console.log('🔍 Running comprehensive storage diagnostics...');

    const providers = await this.testStorageProviders();
    const firebase = await this.testFirebaseConnectivity();
    const comparison = await this.compareStorageContents();

    const recommendations: string[] = [];

    // Generate recommendations
    if (!firebase.configured) {
      recommendations.push('❌ Firebase is not properly configured');
    }
    
    if (!firebase.authenticated) {
      recommendations.push('⚠️ User is not authenticated - Firebase may not work properly');
    }
    
    if (!firebase.canRead || !firebase.canWrite) {
      recommendations.push('❌ Firebase read/write tests failed - check permissions');
    }
    
    if (providers.summary.usingFirebase === 0) {
      recommendations.push('🚨 No namespaces are using Firebase - all falling back to localStorage');
    }
    
    if (comparison.firebase.count === 0 && comparison.localStorage.count > 0) {
      recommendations.push('📱 All data is in localStorage only - Firebase sync not working');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Storage system appears to be working correctly');
    }

    console.log('🔍 Storage diagnostics completed');
    console.log('📋 Recommendations:', recommendations);

    return {
      providers,
      firebase,
      comparison,
      recommendations
    };
  }
}

// Make it available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).StorageDebugHelper = StorageDebugHelper;
}

