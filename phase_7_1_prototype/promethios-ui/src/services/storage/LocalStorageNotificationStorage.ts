import { Notification, NotificationFilter, NotificationStorage } from '../types/notification';

/**
 * LocalStorage-based notification storage implementation
 * Provides persistent storage for notifications using browser localStorage
 */
export class LocalStorageNotificationStorage implements NotificationStorage {
  private readonly storageKey = 'promethios_notifications';
  private readonly maxNotifications: number;

  constructor(maxNotifications: number = 1000) {
    this.maxNotifications = maxNotifications;
  }

  async save(notification: Notification): Promise<void> {
    try {
      const notifications = await this.loadAll();
      
      // Check if notification already exists
      const existingIndex = notifications.findIndex(n => n.id === notification.id);
      
      if (existingIndex >= 0) {
        // Update existing notification
        notifications[existingIndex] = notification;
      } else {
        // Add new notification
        notifications.unshift(notification);
        
        // Enforce max notifications limit
        if (notifications.length > this.maxNotifications) {
          notifications.splice(this.maxNotifications);
        }
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notification to localStorage:', error);
      throw error;
    }
  }

  async load(filter?: NotificationFilter): Promise<Notification[]> {
    try {
      const notifications = await this.loadAll();
      
      if (!filter) {
        return notifications;
      }
      
      return this.applyFilter(notifications, filter);
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const notifications = await this.loadAll();
      const filteredNotifications = notifications.filter(n => n.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Failed to delete notification from localStorage:', error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      const notifications = await this.loadAll();
      const notification = notifications.find(n => n.id === id);
      
      if (notification) {
        notification.read = true;
        localStorage.setItem(this.storageKey, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Failed to mark notification as read in localStorage:', error);
      throw error;
    }
  }

  async markAllAsRead(filter?: NotificationFilter): Promise<void> {
    try {
      const notifications = await this.loadAll();
      const notificationsToUpdate = filter 
        ? this.applyFilter(notifications, filter)
        : notifications;
      
      // Mark filtered notifications as read
      notificationsToUpdate.forEach(notification => {
        const originalNotification = notifications.find(n => n.id === notification.id);
        if (originalNotification) {
          originalNotification.read = true;
        }
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to mark all notifications as read in localStorage:', error);
      throw error;
    }
  }

  async getCount(filter?: NotificationFilter): Promise<number> {
    try {
      const notifications = await this.load(filter);
      return notifications.length;
    } catch (error) {
      console.error('Failed to get notification count from localStorage:', error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear notifications from localStorage:', error);
      throw error;
    }
  }

  private async loadAll(): Promise<Notification[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }
      
      const notifications: Notification[] = JSON.parse(stored);
      
      // Filter out expired notifications
      const now = Date.now();
      const validNotifications = notifications.filter(notification => {
        return !notification.expiresAt || notification.expiresAt > now;
      });
      
      // Save back if we filtered out expired notifications
      if (validNotifications.length !== notifications.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(validNotifications));
      }
      
      return validNotifications;
    } catch (error) {
      console.error('Failed to parse notifications from localStorage:', error);
      return [];
    }
  }

  private applyFilter(notifications: Notification[], filter: NotificationFilter): Notification[] {
    return notifications.filter(notification => {
      // Filter by type
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        if (!types.includes(notification.type)) {
          return false;
        }
      }
      
      // Filter by priority
      if (filter.priority) {
        const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
        if (!priorities.includes(notification.priority)) {
          return false;
        }
      }
      
      // Filter by source
      if (filter.source) {
        const sources = Array.isArray(filter.source) ? filter.source : [filter.source];
        if (!sources.includes(notification.source)) {
          return false;
        }
      }
      
      // Filter by read status
      if (filter.read !== undefined) {
        if (notification.read !== filter.read) {
          return false;
        }
      }
      
      // Filter by creation time range
      if (filter.createdAt) {
        if (filter.createdAt.from && notification.createdAt < filter.createdAt.from) {
          return false;
        }
        if (filter.createdAt.to && notification.createdAt > filter.createdAt.to) {
          return false;
        }
      }
      
      // Filter by context
      if (filter.context) {
        if (!notification.context) {
          return false;
        }
        
        for (const [key, value] of Object.entries(filter.context)) {
          if (notification.context[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
}

