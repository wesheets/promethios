import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification, NotificationFilter } from '../../types/notification';
import { notificationService } from '../../services/NotificationService';
import NotificationItem from './NotificationItem';

interface NotificationCenterProps {
  // Maximum number of notifications to display
  maxNotifications?: number;
  
  // Whether to show notification count badge
  showBadge?: boolean;
  
  // Whether to auto-dismiss notifications after viewing
  autoDismiss?: boolean;
  
  // Custom notification filter
  filter?: NotificationFilter;
  
  // Custom className for styling
  className?: string;
}

interface NotificationCenterState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  subscriptionId: string | null;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxNotifications = 5,
  showBadge = true,
  autoDismiss = false,
  filter,
  className = ''
}) => {
  const [state, setState] = useState<NotificationCenterState>({
    notifications: [],
    unreadCount: 0,
    isOpen: false,
    loading: true,
    error: null,
    subscriptionId: null
  });

  useEffect(() => {
    initializeNotificationService();
    
    return () => {
      // Cleanup subscription on unmount
      if (state.subscriptionId) {
        notificationService.unsubscribeFromNotifications(state.subscriptionId);
      }
    };
  }, []);

  const initializeNotificationService = async () => {
    try {
      // Initialize notification service if not already initialized
      await notificationService.initialize({
        maxNotifications: 100,
        defaultExpiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        defaultPriority: 'medium',
        autoMarkAsRead: autoDismiss,
        storage: {
          type: 'localStorage'
        }
      });

      // Subscribe to notification updates
      const subscriptionId = notificationService.subscribeToNotifications(handleNotificationsUpdate);

      // Get initial notifications and unread count
      const notifications = await notificationService.getNotifications(filter);
      const unreadCount = await notificationService.getNotificationCount({
        ...filter,
        read: false
      });

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        subscriptionId,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize notifications',
        loading: false
      }));
    }
  };

  const handleNotificationsUpdate = (notifications: Notification[]) => {
    const filteredNotifications = filter 
      ? notifications.filter(n => matchesFilter(n, filter))
      : notifications;
    
    const unreadCount = filteredNotifications.filter(n => !n.read).length;
    
    setState(prev => ({
      ...prev,
      notifications: filteredNotifications,
      unreadCount
    }));
  };

  const matchesFilter = (notification: Notification, filter: NotificationFilter): boolean => {
    // Simple filter matching - could be moved to a utility function
    if (filter.type && !Array.isArray(filter.type) && notification.type !== filter.type) {
      return false;
    }
    if (filter.type && Array.isArray(filter.type) && !filter.type.includes(notification.type)) {
      return false;
    }
    if (filter.read !== undefined && notification.read !== filter.read) {
      return false;
    }
    return true;
  };

  const handleToggleCenter = async () => {
    const newIsOpen = !state.isOpen;
    
    setState(prev => ({
      ...prev,
      isOpen: newIsOpen
    }));

    // Mark notifications as read when opening (if autoDismiss is enabled)
    if (newIsOpen && autoDismiss && state.unreadCount > 0) {
      await notificationService.markAllAsRead(filter);
    }
  };

  const handleClearAll = async () => {
    try {
      const notifications = await notificationService.getNotifications(filter);
      
      // Delete all filtered notifications
      for (const notification of notifications) {
        await notificationService.deleteNotification(notification.id);
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const handleNotificationAction = async (notification: Notification, actionId: string) => {
    const action = notification.actions?.find(a => a.id === actionId);
    
    if (!action) {
      return;
    }

    if (action.type === 'dismiss') {
      await notificationService.deleteNotification(notification.id);
    } else if (action.type === 'button' && action.handler) {
      action.handler(notification);
    }
    // Link actions are handled by the NotificationItem component
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  };

  if (state.loading) {
    return (
      <div className={`notification-center-loading ${className}`}>
        <div className="animate-pulse">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`notification-center-error ${className}`}>
        <div className="text-red-500 text-sm">{state.error}</div>
      </div>
    );
  }

  return (
    <div className={`notification-center relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={handleToggleCenter}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
        aria-label="View notifications"
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification Badge */}
        {showBadge && state.unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
          >
            {state.unreadCount > 99 ? '99+' : state.unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                {state.notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {state.notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {state.notifications
                    .slice(0, maxNotifications)
                    .map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onAction={(actionId) => handleNotificationAction(notification, actionId)}
                        onMarkAsRead={() => handleMarkAsRead(notification.id)}
                      />
                    ))}
                </div>
              )}

              {/* View All Link */}
              {state.notifications.length > maxNotifications && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <a
                    href="/notifications"
                    className="block text-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    View all {state.notifications.length} notifications
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close dropdown when clicking outside */}
      {state.isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setState(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default NotificationCenter;

