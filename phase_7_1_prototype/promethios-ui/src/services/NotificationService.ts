import { 
  Notification, 
  NotificationFilter, 
  NotificationConfig, 
  NotificationCallback,
  NotificationPriority 
} from '../types/notification';
import { LocalStorageNotificationStorage } from './storage/LocalStorageNotificationStorage';

/**
 * Core notification service for managing notifications across the application
 * Provides centralized notification creation, management, and real-time updates
 */
export class NotificationService {
  private static instance: NotificationService | null = null;
  private storage: LocalStorageNotificationStorage;
  private subscribers: Map<string, NotificationCallback> = new Map();
  private config: NotificationConfig;
  private isInitialized = false;

  constructor() {
    this.storage = new LocalStorageNotificationStorage();
    this.config = {
      maxNotifications: 1000,
      defaultExpiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      defaultPriority: 'medium',
      autoMarkAsRead: false,
      storage: {
        type: 'localStorage'
      }
    };
  }

  /**
   * Get singleton instance of NotificationService
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service with configuration
   */
  async initialize(config?: Partial<NotificationConfig>): Promise<boolean> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Initialize storage with max notifications limit
      this.storage = new LocalStorageNotificationStorage(this.config.maxNotifications);
      
      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
      return false;
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized. Call initialize() first.');
    }

    const notification: Notification = {
      id: this.generateId(),
      createdAt: Date.now(),
      read: false,
      priority: this.config.defaultPriority || 'medium',
      expiresAt: notificationData.expiresAt || (Date.now() + (this.config.defaultExpiryTime || 7 * 24 * 60 * 60 * 1000)),
      ...notificationData
    };

    try {
      await this.storage.save(notification);
      
      // Notify all subscribers
      this.notifySubscribers();
      
      console.log('Notification created:', notification.id);
      return notification.id;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Update an existing notification
   */
  async updateNotification(notificationId: string, updates: Partial<Notification>): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized. Call initialize() first.');
    }

    try {
      const notifications = await this.storage.load();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return false;
      }

      const updatedNotification = { ...notification, ...updates };
      await this.storage.save(updatedNotification);
      
      // Notify all subscribers
      this.notifySubscribers();
      
      return true;
    } catch (error) {
      console.error('Failed to update notification:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized. Call initialize() first.');
    }

    try {
      await this.storage.delete(notificationId);
      
      // Notify all subscribers
      this.notifySubscribers();
      
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized. Call initialize() first.');
    }

    try {
      await this.storage.markAsRead(notificationId);
      
      // Notify all subscribers
      this.notifySubscribers();
      
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(filter?: NotificationFilter): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized. Call initialize() first.');
    }

    try {
      await this.storage.markAllAsRead(filter);
      
      // Notify all subscribers
      this.notifySubscribers();
      
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get notifications with optional filtering
   */
  async getNotifications(filter?: NotificationFilter): Promise<Notification[]> {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized. Call initialize() first.');
    }

    try {
      return await this.storage.load(filter);
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Get notification count with optional filtering
   */
  async getNotificationCount(filter?: NotificationFilter): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized. Call initialize() first.');
    }

    try {
      return await this.storage.getCount(filter);
    } catch (error) {
      console.error('Failed to get notification count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to notification updates
   */
  subscribeToNotifications(callback: NotificationCallback): string {
    const subscriptionId = this.generateId();
    this.subscribers.set(subscriptionId, callback);
    
    // Immediately call callback with current notifications
    this.getNotifications().then(notifications => {
      callback(notifications);
    });
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from notification updates
   */
  unsubscribeFromNotifications(subscriptionId: string): boolean {
    return this.subscribers.delete(subscriptionId);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized. Call initialize() first.');
    }

    try {
      await this.storage.clear();
      
      // Notify all subscribers
      this.notifySubscribers();
      
      return true;
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      return false;
    }
  }

  /**
   * Create a test notification (for development/testing)
   */
  async createTestNotification(type: 'governance' | 'observer' | 'system' = 'system'): Promise<string> {
    const testNotifications = {
      governance: {
        title: 'Governance Violation Detected',
        message: 'A potential bias violation was detected in agent response. Review required.',
        type: 'governance_violation' as const,
        priority: 'high' as NotificationPriority,
        source: 'governance' as const,
        dismissible: true,
        actions: [
          {
            id: 'view-details',
            label: 'View Details',
            type: 'link' as const,
            url: '/governance/violations'
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss' as const
          }
        ]
      },
      observer: {
        title: 'Observer Suggestion',
        message: 'Consider adding a trust boundary check for this interaction.',
        type: 'observer_suggestion' as const,
        priority: 'medium' as NotificationPriority,
        source: 'observer' as const,
        dismissible: true,
        actions: [
          {
            id: 'apply-suggestion',
            label: 'Apply Suggestion',
            type: 'button' as const,
            handler: () => console.log('Applying observer suggestion...')
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss' as const
          }
        ]
      },
      system: {
        title: 'System Update',
        message: 'Promethios has been updated to version 2.1.0 with improved governance detection.',
        type: 'system_event' as const,
        priority: 'low' as NotificationPriority,
        source: 'system' as const,
        dismissible: true,
        actions: [
          {
            id: 'view-changelog',
            label: 'View Changelog',
            type: 'link' as const,
            url: '/changelog'
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss' as const
          }
        ]
      }
    };

    return this.createNotification(testNotifications[type]);
  }

  /**
   * Generate a unique ID for notifications and subscriptions
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify all subscribers of notification updates
   */
  private async notifySubscribers(): Promise<void> {
    try {
      const notifications = await this.storage.load();
      
      for (const callback of this.subscribers.values()) {
        try {
          callback(notifications);
        } catch (error) {
          console.error('Error in notification subscriber callback:', error);
        }
      }
    } catch (error) {
      console.error('Failed to notify subscribers:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

