/**
 * Firebase Debugging Utility
 * Comprehensive debugging for Firebase operations to identify chat creation issues
 */

import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

interface FirebaseDebugInfo {
  auth: {
    isConnected: boolean;
    currentUser: any;
    error?: string;
  };
  firestore: {
    isConnected: boolean;
    settings: any;
    error?: string;
  };
  storage: {
    isConnected: boolean;
    error?: string;
  };
  network: {
    isOnline: boolean;
    connectionType?: string;
  };
}

class FirebaseDebugger {
  private debugEnabled = true;

  // Test Firebase connection comprehensively
  async testFirebaseConnection(): Promise<FirebaseDebugInfo> {
    const debugInfo: FirebaseDebugInfo = {
      auth: { isConnected: false, currentUser: null },
      firestore: { isConnected: false, settings: null },
      storage: { isConnected: false },
      network: { isOnline: navigator.onLine }
    };

    try {
      // Test Auth
      const auth = getAuth();
      debugInfo.auth.isConnected = !!auth;
      debugInfo.auth.currentUser = auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified
      } : null;
    } catch (error) {
      debugInfo.auth.error = error instanceof Error ? error.message : 'Unknown auth error';
    }

    try {
      // Test Firestore
      const db = getFirestore();
      debugInfo.firestore.isConnected = !!db;
      debugInfo.firestore.settings = {
        app: db.app.name,
        // Add more settings as needed
      };
    } catch (error) {
      debugInfo.firestore.error = error instanceof Error ? error.message : 'Unknown firestore error';
    }

    try {
      // Test Storage
      const storage = getStorage();
      debugInfo.storage.isConnected = !!storage;
    } catch (error) {
      debugInfo.storage.error = error instanceof Error ? error.message : 'Unknown storage error';
    }

    return debugInfo;
  }

  // Debug specific chat operations
  async debugChatOperations(userId: string) {
    console.log('🔍 [Firebase Debug] Starting chat operations debug for user:', userId);
    
    try {
      const debugInfo = await this.testFirebaseConnection();
      console.log('🔍 [Firebase Debug] Connection status:', debugInfo);

      // Test user-specific operations
      if (debugInfo.auth.currentUser) {
        await this.testUserChatAccess(userId);
      } else {
        console.warn('🔍 [Firebase Debug] No authenticated user - this may be the issue!');
      }

    } catch (error) {
      console.error('🔍 [Firebase Debug] Chat operations debug failed:', error);
    }
  }

  // Test user chat access patterns
  private async testUserChatAccess(userId: string) {
    try {
      const db = getFirestore();
      
      // Test the exact paths used by ChatHistoryService
      const userChatsPath = `users/${userId}/chats`;
      const userIndexPath = `users/${userId}/chatIndex`;
      
      console.log('🔍 [Firebase Debug] Testing chat paths:');
      console.log('  - User chats path:', userChatsPath);
      console.log('  - User index path:', userIndexPath);

      // Test permissions by attempting to read
      const { collection, getDocs, doc, getDoc } = await import('firebase/firestore');
      
      // Test chat collection access
      const chatsRef = collection(db, userChatsPath);
      console.log('🔍 [Firebase Debug] Created chats collection reference');
      
      // Test index document access
      const indexRef = doc(db, userIndexPath);
      console.log('🔍 [Firebase Debug] Created index document reference');

      // Attempt to read (this will show permission issues)
      try {
        const indexSnap = await getDoc(indexRef);
        console.log('🔍 [Firebase Debug] Index document exists:', indexSnap.exists());
        if (indexSnap.exists()) {
          console.log('🔍 [Firebase Debug] Index data:', indexSnap.data());
        }
      } catch (error) {
        console.error('🔍 [Firebase Debug] Failed to read index document:', error);
      }

      try {
        const chatsSnap = await getDocs(chatsRef);
        console.log('🔍 [Firebase Debug] Chat documents count:', chatsSnap.size);
        chatsSnap.forEach(doc => {
          console.log('🔍 [Firebase Debug] Found chat:', doc.id, doc.data());
        });
      } catch (error) {
        console.error('🔍 [Firebase Debug] Failed to read chat collection:', error);
      }

    } catch (error) {
      console.error('🔍 [Firebase Debug] User chat access test failed:', error);
    }
  }

  // Debug chat creation process step by step
  async debugChatCreation(userId: string, chatName: string) {
    console.log('🔍 [Firebase Debug] Starting chat creation debug');
    console.log('  - User ID:', userId);
    console.log('  - Chat Name:', chatName);

    try {
      const { collection, doc, setDoc, updateDoc, arrayUnion, serverTimestamp } = await import('firebase/firestore');
      const db = getFirestore();

      // Step 1: Create chat session
      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const chatRef = doc(db, `users/${userId}/chats`, sessionId);
      
      console.log('🔍 [Firebase Debug] Step 1: Creating chat document');
      console.log('  - Session ID:', sessionId);
      console.log('  - Document path:', chatRef.path);

      const chatData = {
        id: sessionId,
        name: chatName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [],
        metadata: {
          messageCount: 0,
          lastActivity: serverTimestamp()
        }
      };

      await setDoc(chatRef, chatData);
      console.log('🔍 [Firebase Debug] ✅ Chat document created successfully');

      // Step 2: Update user index
      const indexRef = doc(db, `users/${userId}/chatIndex`);
      console.log('🔍 [Firebase Debug] Step 2: Updating user chat index');

      try {
        await updateDoc(indexRef, {
          chatIds: arrayUnion(sessionId),
          lastUpdated: serverTimestamp()
        });
        console.log('🔍 [Firebase Debug] ✅ User index updated successfully');
      } catch (indexError) {
        console.log('🔍 [Firebase Debug] Index document may not exist, creating it...');
        await setDoc(indexRef, {
          chatIds: [sessionId],
          lastUpdated: serverTimestamp()
        });
        console.log('🔍 [Firebase Debug] ✅ User index created successfully');
      }

      console.log('🔍 [Firebase Debug] 🎉 Chat creation debug completed successfully!');
      return sessionId;

    } catch (error) {
      console.error('🔍 [Firebase Debug] ❌ Chat creation debug failed:', error);
      throw error;
    }
  }

  // Monitor Firebase performance
  startPerformanceMonitoring() {
    // Monitor network status
    window.addEventListener('online', () => {
      console.log('🔍 [Firebase Debug] Network: ONLINE');
    });

    window.addEventListener('offline', () => {
      console.log('🔍 [Firebase Debug] Network: OFFLINE');
    });

    // Monitor Firebase auth state changes
    const auth = getAuth();
    auth.onAuthStateChanged((user) => {
      console.log('🔍 [Firebase Debug] Auth state changed:', user ? `User: ${user.uid}` : 'No user');
    });
  }
}

// Global debugger instance
export const firebaseDebugger = new FirebaseDebugger();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  firebaseDebugger.startPerformanceMonitoring();
}

export default firebaseDebugger;

