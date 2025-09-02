/**
 * Firebase Notification Provider
 * 
 * Connects the NotificationService to Firebase Firestore for persistent notification storage.
 * Loads notifications from the 'interactionNotifications' collection created by UserInteractionRegistry.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { NotificationProvider, AppNotification, NotificationFilter } from '../../types/notification';

interface FirebaseNotification {
  id?: string;
  userId: string;
  interactionId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Timestamp;
}

export class FirebaseNotificationProvider implements NotificationProvider {
  name = 'firebase';
  private readonly COLLECTION_NAME = 'interactionNotifications';
  private currentUserId: string | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private listeners = new Set<(notification: AppNotification) => void>();

  constructor(userId?: string) {
    if (userId) {
      this.setUserId(userId);
    }
  }

  /**
   * Set the user ID and start listening for notifications
   */
  setUserId(userId: string): void {
    console.log('🔔 [FirebaseNotificationProvider] Setting user ID:', userId);
    
    if (this.currentUserId === userId) {
      console.log('🔔 [FirebaseNotificationProvider] User ID unchanged, skipping setup');
      return;
    }

    // Clean up existing listener
    if (this.unsubscribe) {
      console.log('🔔 [FirebaseNotificationProvider] Cleaning up existing listener');
      this.unsubscribe();
    }

    this.currentUserId = userId;
    
    // Set up real-time listener for new notifications
    this.setupRealtimeListener();
  }

  /**
   * Set up real-time listener for notifications
   */
  private setupRealtimeListener(): void {
    if (!this.currentUserId) return;

    console.log('🔔 [FirebaseNotificationProvider] Starting real-time listener for user:', this.currentUserId);

    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', this.currentUserId),
      orderBy('createdAt', 'desc'),
      limit(100) // Limit to recent notifications
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔔 [FirebaseNotificationProvider] Received notification updates:', snapshot.size);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const firebaseNotification = { id: change.doc.id, ...change.doc.data() } as FirebaseNotification;
          const appNotification = this.convertToAppNotification(firebaseNotification);
          
          // Notify all listeners about the new notification
          this.listeners.forEach(callback => {
            try {
              callback(appNotification);
            } catch (error) {
              console.error('Error in notification listener:', error);
            }
          });
        }
      });
    }, (error) => {
      console.error('🔔 [FirebaseNotificationProvider] Error in real-time listener:', error);
    });
  }

  /**
   * Convert Firebase notification to AppNotification format
   */
  private convertToAppNotification(firebaseNotification: FirebaseNotification): AppNotification {
    return {
      id: firebaseNotification.id || '',
      type: this.mapNotificationType(firebaseNotification.type),
      title: firebaseNotification.title,
      message: firebaseNotification.message,
      timestamp: firebaseNotification.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      read: firebaseNotification.read,
      priority: this.mapNotificationPriority(firebaseNotification.type),
      category: 'social',
      actions: firebaseNotification.actionUrl ? [{
        label: 'View',
        url: firebaseNotification.actionUrl,
        style: 'primary' as const
      }] : undefined,
      metadata: {
        interactionId: firebaseNotification.interactionId,
        source: 'firebase'
      },
      userId: firebaseNotification.userId
    };
  }

  /**
   * Map interaction types to notification types
   */
  private mapNotificationType(interactionType: string): AppNotification['type'] {
    switch (interactionType) {
      case 'connection_request':
      case 'chat_invitation':
      case 'collaboration_request':
        return 'info';
      case 'connection_accepted':
      case 'collaboration_accepted':
        return 'success';
      default:
        return 'info';
    }
  }

  /**
   * Map interaction types to notification priority
   */
  private mapNotificationPriority(interactionType: string): AppNotification['priority'] {
    switch (interactionType) {
      case 'connection_request':
      case 'chat_invitation':
        return 'medium';
      case 'collaboration_request':
        return 'high';
      default:
        return 'low';
    }
  }

  /**
   * Subscribe to new notifications
   */
  subscribe(callback: (notification: AppNotification) => void): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      console.log('🔔 [FirebaseNotificationProvider] Marking as read:', notificationId);
      
      await updateDoc(doc(db, this.COLLECTION_NAME, notificationId), {
        read: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('🔔 [FirebaseNotificationProvider] Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      console.log('🔔 [FirebaseNotificationProvider] Marking all as read for user:', this.currentUserId);
      
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', this.currentUserId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = db.batch ? db.batch() : null;

      if (batch) {
        snapshot.docs.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, {
            read: true,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      } else {
        // Fallback if batch is not available
        const promises = snapshot.docs.map(docSnapshot =>
          updateDoc(docSnapshot.ref, {
            read: true,
            updatedAt: serverTimestamp()
          })
        );
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('🔔 [FirebaseNotificationProvider] Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      console.log('🔔 [FirebaseNotificationProvider] Deleting notification:', notificationId);
      
      await deleteDoc(doc(db, this.COLLECTION_NAME, notificationId));
    } catch (error) {
      console.error('🔔 [FirebaseNotificationProvider] Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications with optional filtering
   */
  async getNotifications(filter?: NotificationFilter): Promise<AppNotification[]> {
    if (!this.currentUserId) return [];

    try {
      console.log('🔔 [FirebaseNotificationProvider] Loading notifications for user:', this.currentUserId);
      
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', this.currentUserId),
        orderBy('createdAt', 'desc')
      );

      if (filter?.limit) {
        q = query(q, limit(filter.limit));
      }

      const snapshot = await getDocs(q);
      const notifications: AppNotification[] = [];

      snapshot.forEach((doc) => {
        const firebaseNotification = { id: doc.id, ...doc.data() } as FirebaseNotification;
        const appNotification = this.convertToAppNotification(firebaseNotification);
        
        // Apply filters
        if (filter?.unreadOnly && appNotification.read) return;
        if (filter?.type && !filter.type.includes(appNotification.type)) return;
        if (filter?.priority && !filter.priority.includes(appNotification.priority)) return;
        
        notifications.push(appNotification);
      });

      console.log('🔔 [FirebaseNotificationProvider] Loaded', notifications.length, 'notifications');
      return notifications;
    } catch (error) {
      console.error('🔔 [FirebaseNotificationProvider] Error loading notifications:', error);
      return [];
    }
  }

  /**
   * Create a new notification (for compatibility)
   */
  async createNotification(notification: Omit<AppNotification, 'id' | 'timestamp'>): Promise<string> {
    if (!this.currentUserId) throw new Error('User ID not set');

    try {
      const notificationId = `${this.currentUserId}_${Date.now()}`;
      
      await setDoc(doc(db, this.COLLECTION_NAME, notificationId), {
        userId: this.currentUserId,
        interactionId: notification.metadata?.interactionId || notificationId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actions?.[0]?.url,
        read: false,
        createdAt: serverTimestamp()
      });

      return notificationId;
    } catch (error) {
      console.error('🔔 [FirebaseNotificationProvider] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Cleanup when provider is destroyed
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
    this.currentUserId = null;
  }
}

// Export singleton instance
export const firebaseNotificationProvider = new FirebaseNotificationProvider();

