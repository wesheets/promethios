import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationFilter } from '../types/notification';
import { notificationService } from '../services/NotificationService';
import { notificationRegistry } from '../services/NotificationRegistry';
import { testNotificationProvider } from '../services/providers/TestNotificationProvider';

interface UseNotificationsOptions {
  // Filter for notifications
  filter?: NotificationFilter;
  
  // Whether to auto-initialize the service
  autoInitialize?: boolean;
  
  // Whether to start test provider (for development)
  enableTestProvider?: boolean;
  
  // Maximum number of notifications to keep in state
  maxNotifications?: number;
}

interface UseNotificationsReturn {
  // Current notifications
  notifications: Notification[];
  
  // Unread notification count
  unreadCount: number;
  
  // Loading state
  loading: boolean;
  
  // Error state
  error: string | null;
  
  // Create a new notification
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<string>;
  
  // Mark notification as read
  markAsRead: (notificationId: string) => Promise<boolean>;
  
  // Mark all notifications as read
  markAllAsRead: (filter?: NotificationFilter) => Promise<boolean>;
  
  // Delete a notification
  deleteNotification: (notificationId: string) => Promise<boolean>;
  
  // Clear all notifications
  clearAll: () => Promise<boolean>;
  
  // Trigger test notification (for development)
  triggerTestNotification: (type: 'governance' | 'trust' | 'observer' | 'system' | 'welcome') => Promise<void>;
  
  // Refresh notifications
  refresh: () => Promise<void>;
}

/**
 * React hook for integrating with the notification system
 * Provides easy access to notifications and notification actions
 */
export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const {
    filter,
    autoInitialize = true,
    enableTestProvider = process.env.NODE_ENV === 'development',
    maxNotifications = 100
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Initialize notification service
  useEffect(() => {
    if (autoInitialize) {
      initializeNotificationSystem();
    }

    return () => {
      // Cleanup subscription on unmount
      if (subscriptionId) {
        notificationService.unsubscribeFromNotifications(subscriptionId);
      }
    };
  }, [autoInitialize]);

  const initializeNotificationSystem = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize notification service
      const serviceInitialized = await notificationService.initialize({
        maxNotifications,
        defaultExpiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        defaultPriority: 'medium',
        autoMarkAsRead: false,
        storage: {
          type: 'localStorage'
        }
      });

      if (!serviceInitialized) {
        throw new Error('Failed to initialize notification service');
      }

      // Register and start test provider if enabled
      if (enableTestProvider) {
        notificationRegistry.registerProvider(testNotificationProvider);
        await testNotificationProvider.initialize();
        await testNotificationProvider.start();
      }

      // Subscribe to notification updates
      const subId = notificationService.subscribeToNotifications(handleNotificationsUpdate);
      setSubscriptionId(subId);

      // Load initial notifications
      await loadNotifications();

      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize notifications';
      setError(errorMessage);
      setLoading(false);
      console.error('Notification system initialization error:', err);
    }
  };

  const handleNotificationsUpdate = useCallback((updatedNotifications: Notification[]) => {
    const filteredNotifications = filter 
      ? updatedNotifications.filter(n => matchesFilter(n, filter))
      : updatedNotifications;
    
    const unread = filteredNotifications.filter(n => !n.read).length;
    
    setNotifications(filteredNotifications);
    setUnreadCount(unread);
  }, [filter]);

  const matchesFilter = (notification: Notification, filter: NotificationFilter): boolean => {
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      if (!types.includes(notification.type)) {
        return false;
      }
    }
    
    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      if (!priorities.includes(notification.priority)) {
        return false;
      }
    }
    
    if (filter.source) {
      const sources = Array.isArray(filter.source) ? filter.source : [filter.source];
      if (!sources.includes(notification.source)) {
        return false;
      }
    }
    
    if (filter.read !== undefined && notification.read !== filter.read) {
      return false;
    }
    
    if (filter.createdAt) {
      if (filter.createdAt.from && notification.createdAt < filter.createdAt.from) {
        return false;
      }
      if (filter.createdAt.to && notification.createdAt > filter.createdAt.to) {
        return false;
      }
    }
    
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
  };

  const loadNotifications = async () => {
    try {
      const allNotifications = await notificationService.getNotifications(filter);
      const unread = await notificationService.getNotificationCount({
        ...filter,
        read: false
      });
      
      setNotifications(allNotifications);
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> => {
    try {
      return await notificationService.createNotification(notification);
    } catch (err) {
      console.error('Failed to create notification:', err);
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      return await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (markFilter?: NotificationFilter): Promise<boolean> => {
    try {
      return await notificationService.markAllAsRead(markFilter || filter);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      return false;
    }
  }, [filter]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      return await notificationService.deleteNotification(notificationId);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      return false;
    }
  }, []);

  const clearAll = useCallback(async (): Promise<boolean> => {
    try {
      return await notificationService.clearAllNotifications();
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      return false;
    }
  }, []);

  const triggerTestNotification = useCallback(async (type: 'governance' | 'trust' | 'observer' | 'system' | 'welcome'): Promise<void> => {
    try {
      if (enableTestProvider) {
        await testNotificationProvider.triggerTestNotification(type);
      } else {
        console.warn('Test provider is not enabled');
      }
    } catch (err) {
      console.error('Failed to trigger test notification:', err);
      throw err;
    }
  }, [enableTestProvider]);

  const refresh = useCallback(async (): Promise<void> => {
    await loadNotifications();
  }, [filter]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    triggerTestNotification,
    refresh
  };
};

