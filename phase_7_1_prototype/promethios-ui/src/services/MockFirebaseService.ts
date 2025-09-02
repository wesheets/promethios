/**
 * Mock Firebase Service for Testing Notifications
 * 
 * This service simulates Firebase operations without requiring authentication
 * to test the notification system functionality.
 */

import { Timestamp } from 'firebase/firestore';

interface MockNotification {
  id: string;
  userId: string;
  interactionId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Timestamp;
}

interface MockInteraction {
  id: string;
  type: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserPhoto?: string | null;
  toUserName: string;
  toUserPhoto?: string | null;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
  metadata: any;
}

class MockFirebaseService {
  private static instance: MockFirebaseService;
  private notifications: Map<string, MockNotification> = new Map();
  private interactions: Map<string, MockInteraction> = new Map();
  private users: Map<string, any> = new Map();
  private listeners: Map<string, (data: any) => void> = new Map();

  static getInstance(): MockFirebaseService {
    if (!MockFirebaseService.instance) {
      MockFirebaseService.instance = new MockFirebaseService();
    }
    return MockFirebaseService.instance;
  }

  constructor() {
    // Initialize with some mock users
    this.users.set('mock_user_1', {
      uid: 'mock_user_1',
      email: 'alice.test@example.com',
      displayName: 'Alice Test User',
      photoURL: null
    });
    
    this.users.set('mock_user_2', {
      uid: 'mock_user_2',
      email: 'bob.test@example.com',
      displayName: 'Bob Test User',
      photoURL: null
    });

    console.log('🧪 [MockFirebase] Service initialized with mock users');
  }

  // Mock Firestore operations
  async setDoc(collection: string, docId: string, data: any): Promise<void> {
    console.log(`🧪 [MockFirebase] Writing to ${collection}/${docId}:`, data);
    
    if (collection === 'interactionNotifications') {
      const notification: MockNotification = {
        id: docId,
        ...data,
        createdAt: data.createdAt || Timestamp.now()
      };
      this.notifications.set(docId, notification);
      
      // Trigger listeners
      this.triggerListeners(`notifications_${data.userId}`, notification);
      
      console.log(`✅ [MockFirebase] Notification stored: ${docId}`);
    } else if (collection === 'userInteractions') {
      const interaction: MockInteraction = {
        id: docId,
        ...data,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now()
      };
      this.interactions.set(docId, interaction);
      console.log(`✅ [MockFirebase] Interaction stored: ${docId}`);
    } else if (collection === 'users') {
      this.users.set(docId, { uid: docId, ...data });
      console.log(`✅ [MockFirebase] User stored: ${docId}`);
    }
  }

  async getDoc(collection: string, docId: string): Promise<{ exists: () => boolean; data: () => any }> {
    console.log(`🧪 [MockFirebase] Reading from ${collection}/${docId}`);
    
    let data = null;
    if (collection === 'interactionNotifications') {
      data = this.notifications.get(docId);
    } else if (collection === 'userInteractions') {
      data = this.interactions.get(docId);
    } else if (collection === 'users') {
      data = this.users.get(docId);
    }

    return {
      exists: () => !!data,
      data: () => data
    };
  }

  async getDocs(collection: string, filters?: any): Promise<{ docs: any[] }> {
    console.log(`🧪 [MockFirebase] Querying ${collection} with filters:`, filters);
    
    let results: any[] = [];
    
    if (collection === 'interactionNotifications') {
      results = Array.from(this.notifications.values());
      if (filters?.userId) {
        results = results.filter(n => n.userId === filters.userId);
      }
    } else if (collection === 'userInteractions') {
      results = Array.from(this.interactions.values());
      if (filters?.fromUserId) {
        results = results.filter(i => i.fromUserId === filters.fromUserId);
      }
      if (filters?.toUserId) {
        results = results.filter(i => i.toUserId === filters.toUserId);
      }
      if (filters?.status) {
        results = results.filter(i => i.status === filters.status);
      }
    }

    return {
      docs: results.map(item => ({
        id: item.id,
        data: () => item,
        exists: () => true
      }))
    };
  }

  // Mock real-time listeners
  onSnapshot(collection: string, filters: any, callback: (snapshot: any) => void): () => void {
    const listenerId = `${collection}_${JSON.stringify(filters)}`;
    console.log(`🧪 [MockFirebase] Setting up listener: ${listenerId}`);
    
    this.listeners.set(listenerId, callback);
    
    // Immediately call with current data
    this.getDocs(collection, filters).then(result => {
      callback({
        docs: result.docs,
        docChanges: () => result.docs.map(doc => ({
          type: 'added',
          doc
        })),
        size: result.docs.length
      });
    });

    // Return unsubscribe function
    return () => {
      console.log(`🧪 [MockFirebase] Removing listener: ${listenerId}`);
      this.listeners.delete(listenerId);
    };
  }

  private triggerListeners(pattern: string, data: any): void {
    for (const [listenerId, callback] of this.listeners.entries()) {
      if (listenerId.includes(pattern)) {
        console.log(`🧪 [MockFirebase] Triggering listener: ${listenerId}`);
        callback({
          docs: [{ id: data.id, data: () => data, exists: () => true }],
          docChanges: () => [{
            type: 'added',
            doc: { id: data.id, data: () => data, exists: () => true }
          }],
          size: 1
        });
      }
    }
  }

  // Helper methods for testing
  getStoredNotifications(): MockNotification[] {
    return Array.from(this.notifications.values());
  }

  getStoredInteractions(): MockInteraction[] {
    return Array.from(this.interactions.values());
  }

  clearAll(): void {
    this.notifications.clear();
    this.interactions.clear();
    console.log('🧪 [MockFirebase] All data cleared');
  }

  // Mock user operations
  async createMockUser(userData: { displayName: string; email: string }): Promise<{ uid: string; displayName: string; email: string }> {
    const uid = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      uid,
      displayName: userData.displayName,
      email: userData.email,
      photoURL: null
    };
    
    await this.setDoc('users', uid, user);
    console.log('🧪 [MockFirebase] Created mock user:', user);
    
    return user;
  }

  async deleteMockUser(uid: string): Promise<void> {
    this.users.delete(uid);
    console.log('🧪 [MockFirebase] Deleted mock user:', uid);
  }
}

export const mockFirebaseService = MockFirebaseService.getInstance();
export default mockFirebaseService;

