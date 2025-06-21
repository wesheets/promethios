import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationFilter } from '../types/notification';
import { notificationService } from '../services/NotificationService';

/**
 * Hook for managing notifications
 */
export function useNotifications(filter?: NotificationFilter) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((allNotifications) => {
      const filtered = filter 
        ? notificationService.getNotifications(filter)
        : allNotifications;
      
      setNotifications(filtered);
      setUnreadCount(notificationService.getUnreadCount());
      setLoading(false);
    });

    return unsubscribe;
  }, [filter]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
  }, []);

  const createTestNotification = useCallback((type?: Notification['type']) => {
    notificationService.createTestNotification(type);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createTestNotification
  };
}

/**
 * Hook for notification settings
 */
export function useNotificationSettings() {
  const [settings, setSettings] = useState({
    enableSound: true,
    enableDesktop: false,
    enableInApp: true,
    categories: {
      governance: true,
      agent: true,
      system: true,
      security: true,
      compliance: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  useEffect(() => {
    // Load settings from localStorage
    try {
      const saved = localStorage.getItem('promethios_notification_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem('promethios_notification_settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }, [settings]);

  const requestDesktopPermission = useCallback(async () => {
    const granted = await notificationService.requestDesktopPermission();
    if (granted) {
      updateSettings({ enableDesktop: true });
    }
    return granted;
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    requestDesktopPermission
  };
}

