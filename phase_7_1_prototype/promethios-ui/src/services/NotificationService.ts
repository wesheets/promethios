import { AppNotification, NotificationProvider, NotificationFilter } from '../types/notification';

/**
 * Notification Service
 * Central service for managing notifications across the application
 */
export class NotificationService {
  private providers = new Map<string, NotificationProvider>();
  private notifications: AppNotification[] = [];
  private listeners = new Set<(notifications: AppNotification[]) => void>();
  private unsubscribeFunctions = new Map<string, () => void>();

  constructor() {
    this.loadNotifications();
  }

  /**
   * Register a notification provider
   */
  registerProvider(provider: NotificationProvider): void {
    this.providers.set(provider.name, provider);
    
    // Subscribe to provider notifications
    const unsubscribe = provider.subscribe((notification) => {
      this.addNotification(notification);
    });
    
    this.unsubscribeFunctions.set(provider.name, unsubscribe);
  }

  /**
   * Unregister a notification provider
   */
  unregisterProvider(providerName: string): void {
    const unsubscribe = this.unsubscribeFunctions.get(providerName);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeFunctions.delete(providerName);
    }
    this.providers.delete(providerName);
  }

  /**
   * Add a notification
   */
  addNotification(notification: Notification): void {
    // Check if notification already exists
    const existingIndex = this.notifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex >= 0) {
      // Update existing notification
      this.notifications[existingIndex] = notification;
    } else {
      // Add new notification
      this.notifications.unshift(notification);
    }

    // Clean up expired notifications
    this.cleanupExpiredNotifications();
    
    // Persist notifications
    this.saveNotifications();
    
    // Notify listeners
    this.notifyListeners();

    // Show desktop notification if enabled
    this.showDesktopNotification(notification);
  }

  /**
   * Get all notifications with optional filtering
   */
  getNotifications(filter?: NotificationFilter): Notification[] {
    let filtered = [...this.notifications];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(n => filter.type!.includes(n.type));
      }
      
      if (filter.priority) {
        filtered = filtered.filter(n => filter.priority!.includes(n.priority));
      }
      
      if (filter.category) {
        filtered = filtered.filter(n => n.category && filter.category!.includes(n.category));
      }
      
      if (filter.unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }
      
      if (filter.since) {
        filtered = filtered.filter(n => n.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();

      // Notify providers
      for (const provider of this.providers.values()) {
        try {
          await provider.markAsRead(notificationId);
        } catch (error) {
          console.error(`Provider ${provider.name} failed to mark notification as read:`, error);
        }
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();

    // Notify providers
    for (const provider of this.providers.values()) {
      try {
        await provider.markAllAsRead();
      } catch (error) {
        console.error(`Provider ${provider.name} failed to mark all notifications as read:`, error);
      }
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index >= 0) {
      this.notifications.splice(index, 1);
      this.saveNotifications();
      this.notifyListeners();

      // Notify providers
      for (const provider of this.providers.values()) {
        try {
          await provider.deleteNotification(notificationId);
        } catch (error) {
          console.error(`Provider ${provider.name} failed to delete notification:`, error);
        }
      }
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current notifications
    callback([...this.notifications]);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Create a test notification
   */
  createTestNotification(type: Notification['type'] = 'info'): void {
    const testNotification: Notification = {
      id: `test-${Date.now()}`,
      type,
      title: `Test ${type} notification`,
      message: `This is a test ${type} notification created at ${new Date().toLocaleTimeString()}`,
      timestamp: Date.now(),
      read: false,
      priority: type === 'error' ? 'high' : 'medium',
      category: 'test'
    };

    this.addNotification(testNotification);
  }

  private cleanupExpiredNotifications(): void {
    const now = Date.now();
    this.notifications = this.notifications.filter(n => 
      !n.expiresAt || n.expiresAt > now
    );
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('promethios_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('promethios_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
        this.cleanupExpiredNotifications();
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications = [];
    }
  }

  private notifyListeners(): void {
    const notificationsCopy = [...this.notifications];
    this.listeners.forEach(callback => {
      try {
        callback(notificationsCopy);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  private showDesktopNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      } catch (error) {
        console.error('Failed to show desktop notification:', error);
      }
    }
  }

  /**
   * Request desktop notification permission
   */
  async requestDesktopPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

