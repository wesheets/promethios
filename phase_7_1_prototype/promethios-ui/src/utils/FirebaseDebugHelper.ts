import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export class FirebaseDebugHelper {
  /**
   * Test basic Firebase connectivity
   */
  static async testConnection(): Promise<{
    success: boolean;
    canRead: boolean;
    canWrite: boolean;
    error?: string;
  }> {
    const result = {
      success: false,
      canRead: false,
      canWrite: false,
      error: undefined as string | undefined
    };

    try {
      // Test read
      const testDoc = doc(db, 'debug', 'connection_test');
      await getDoc(testDoc);
      result.canRead = true;

      // Test write
      await setDoc(testDoc, {
        timestamp: Date.now(),
        test: 'Firebase connection test'
      });
      result.canWrite = true;
      result.success = true;

      smartLogger.smartLog('🔥 Firebase connection test successful');
      return result;

    } catch (error) {
      result.error = `Connection test failed: ${error}`;
      console.error('Firebase connection test failed:', error);
      return result;
    }
  }

  /**
   * List all collections and their document counts
   */
  static async listCollections(): Promise<{
    collections: { name: string; documentCount: number; sampleDocIds: string[] }[];
    totalDocuments: number;
    error?: string;
  }> {
    const result = {
      collections: [] as { name: string; documentCount: number; sampleDocIds: string[] }[],
      totalDocuments: 0,
      error: undefined as string | undefined
    };

    try {
      const collectionNames = [
        'agents', 'multiAgentSystems', 'user', 'singleAgentChats', 
        'multiAgentChats', 'governance', 'preferences', 'notifications',
        'debug', 'system'
      ];

      for (const collectionName of collectionNames) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          const sampleDocIds = snapshot.docs.slice(0, 5).map(doc => doc.id);
          
          result.collections.push({
            name: collectionName,
            documentCount: snapshot.size,
            sampleDocIds
          });
          
          result.totalDocuments += snapshot.size;
          
          smartLogger.smartLog(`🔥 Collection ${collectionName}: ${snapshot.size} documents`);
        } catch (collectionError) {
          console.warn(`Failed to query collection ${collectionName}:`, collectionError);
        }
      }

      return result;

    } catch (error) {
      result.error = `Failed to list collections: ${error}`;
      console.error('Failed to list collections:', error);
      return result;
    }
  }

  /**
   * Search for user-specific data
   */
  static async findUserData(userId: string): Promise<{
    userDocuments: { collection: string; docId: string; data: any }[];
    totalFound: number;
    error?: string;
  }> {
    const result = {
      userDocuments: [] as { collection: string; docId: string; data: any }[],
      totalFound: 0,
      error: undefined as string | undefined
    };

    try {
      const collectionNames = [
        'agents', 'multiAgentSystems', 'user', 'singleAgentChats', 
        'multiAgentChats', 'governance', 'preferences', 'notifications'
      ];

      for (const collectionName of collectionNames) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;
            
            // Check if this document belongs to the user
            if (docId.includes(userId) || 
                data.userId === userId || 
                data.uid === userId ||
                JSON.stringify(data).includes(userId)) {
              
              result.userDocuments.push({
                collection: collectionName,
                docId,
                data
              });
              result.totalFound++;
            }
          });
          
        } catch (collectionError) {
          console.warn(`Failed to search collection ${collectionName}:`, collectionError);
        }
      }

      smartLogger.smartLog(`🔥 Found ${result.totalFound} documents for user ${userId}`);
      return result;

    } catch (error) {
      result.error = `Failed to find user data: ${error}`;
      console.error('Failed to find user data:', error);
      return result;
    }
  }

  /**
   * Test storage operations
   */
  static async testStorageOperations(): Promise<{
    writeTest: boolean;
    readTest: boolean;
    deleteTest: boolean;
    error?: string;
  }> {
    const result = {
      writeTest: false,
      readTest: false,
      deleteTest: false,
      error: undefined as string | undefined
    };

    try {
      const testDocRef = doc(db, 'debug', 'storage_test');
      const testData = {
        timestamp: Date.now(),
        test: 'Storage operation test',
        randomValue: Math.random()
      };

      // Test write
      await setDoc(testDocRef, testData);
      result.writeTest = true;
      console.log('✅ Write test passed');

      // Test read
      const docSnap = await getDoc(testDocRef);
      if (docSnap.exists() && docSnap.data().test === testData.test) {
        result.readTest = true;
        console.log('✅ Read test passed');
      }

      // Test delete (optional - comment out if you want to keep test data)
      // await deleteDoc(testDocRef);
      // result.deleteTest = true;
      // console.log('✅ Delete test passed');

      return result;

    } catch (error) {
      result.error = `Storage operations test failed: ${error}`;
      console.error('Storage operations test failed:', error);
      return result;
    }
  }

  /**
   * Run all debug tests
   */
  static async runAllTests(userId?: string): Promise<{
    connection: any;
    collections: any;
    userData?: any;
    storageOps: any;
    summary: {
      firebaseWorking: boolean;
      hasUserData: boolean;
      totalDocuments: number;
    };
  }> {
    smartLogger.smartLog('🔥 Starting Firebase debug tests...');

    const connection = await this.testConnection();
    const collections = await this.listCollections();
    const userData = userId ? await this.findUserData(userId) : undefined;
    const storageOps = await this.testStorageOperations();

    const summary = {
      firebaseWorking: connection.success && storageOps.writeTest && storageOps.readTest,
      hasUserData: userData ? userData.totalFound > 0 : false,
      totalDocuments: collections.totalDocuments
    };

    smartLogger.smartLog('🔥 Firebase debug tests completed:', summary);

    return {
      connection,
      collections,
      userData,
      storageOps,
      summary
    };
  }
}

// Make it available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).FirebaseDebugHelper = FirebaseDebugHelper;
}

