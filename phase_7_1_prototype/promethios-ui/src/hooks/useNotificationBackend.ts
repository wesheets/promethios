/**
 * Notification Backend Hook
 * 
 * React hook for managing notification state with real backend integration.
 * Provides state management for notifications from observer, audit, and policy systems.
 */

import { useState, useEffect, useCallback } from 'react';
import notificationBackendService, {
  BackendNotification,
  NotificationMetrics,
  CreateNotificationRequest
} from '../services/notificationBackendService';

interface UseNotificationBackendState {
  // Notifications
  notifications: BackendNotification[];
  notificationsLoading: boolean;
  notificationsError: string | null;
  
  // Metrics
  metrics: NotificationMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Operations
  markingAsRead: boolean;
  deleting: boolean;
  creating: boolean;
  operationError: string | null;
}

interface UseNotificationBackendActions {
  // Notification Actions
  loadNotifications: () => Promise<void>;
  loadMetrics: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (request: CreateNotificationRequest) => Promise<BackendNotification>;
  
  // Utility Actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
  
  // Filter Actions
  getUnreadNotifications: () => BackendNotification[];
  getNotificationsByType: (type: string) => BackendNotification[];
  getNotificationsBySeverity: (severity: string) => BackendNotification[];
  getRecentNotifications: (hours?: number) => BackendNotification[];
  getActionRequiredNotifications: () => BackendNotification[];
}

export interface UseNotificationBackendReturn extends UseNotificationBackendState, UseNotificationBackendActions {}

export const useNotificationBackend = (): UseNotificationBackendReturn => {
  // State
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<NotificationMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Notification Actions
  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    
    try {
      const notificationsData = await notificationBackendService.getNotifications();
      setNotifications(notificationsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notifications';
      setNotificationsError(errorMessage);
      console.error('Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metricsData = await notificationBackendService.getNotificationMetrics();
      setMetrics(metricsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notification metrics';
      setMetricsError(errorMessage);
      console.error('Error loading notification metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    setMarkingAsRead(true);
    setOperationError(null);
    
    try {
      await notificationBackendService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.notification_id === notificationId ? { ...n, read: true } : n
      ));
      
      // Update metrics
      await loadMetrics();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      setOperationError(errorMessage);
      console.error('Error marking notification as read:', error);
      throw error;
    } finally {
      setMarkingAsRead(false);
    }
  }, [loadMetrics]);

  const markAllAsRead = useCallback(async () => {
    setMarkingAsRead(true);
    setOperationError(null);
    
    try {
      await notificationBackendService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Update metrics
      await loadMetrics();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      setOperationError(errorMessage);
      console.error('Error marking all notifications as read:', error);
      throw error;
    } finally {
      setMarkingAsRead(false);
    }
  }, [loadMetrics]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    setDeleting(true);
    setOperationError(null);
    
    try {
      await notificationBackendService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      
      // Update metrics
      await loadMetrics();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      setOperationError(errorMessage);
      console.error('Error deleting notification:', error);
      throw error;
    } finally {
      setDeleting(false);
    }
  }, [loadMetrics]);

  const createNotification = useCallback(async (request: CreateNotificationRequest) => {
    setCreating(true);
    setOperationError(null);
    
    try {
      const notification = await notificationBackendService.createNotification(request);
      
      // Update local state
      setNotifications(prev => [notification, ...prev]);
      
      // Update metrics
      await loadMetrics();
      
      return notification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create notification';
      setOperationError(errorMessage);
      console.error('Error creating notification:', error);
      throw error;
    } finally {
      setCreating(false);
    }
  }, [loadMetrics]);

  // Utility Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadMetrics()
    ]);
  }, [loadNotifications, loadMetrics]);

  const clearErrors = useCallback(() => {
    setNotificationsError(null);
    setMetricsError(null);
    setOperationError(null);
  }, []);

  // Filter Actions
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getNotificationsBySeverity = useCallback((severity: string) => {
    return notifications.filter(n => n.severity === severity);
  }, [notifications]);

  const getRecentNotifications = useCallback((hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return notifications.filter(n => new Date(n.created_at) > cutoff);
  }, [notifications]);

  const getActionRequiredNotifications = useCallback(() => {
    return notifications.filter(n => n.action_required);
  }, [notifications]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = notificationBackendService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return unsubscribe;
  }, []);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    // State
    notifications,
    notificationsLoading,
    notificationsError,
    metrics,
    metricsLoading,
    metricsError,
    markingAsRead,
    deleting,
    creating,
    operationError,
    
    // Actions
    loadNotifications,
    loadMetrics,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshAll,
    clearErrors,
    getUnreadNotifications,
    getNotificationsByType,
    getNotificationsBySeverity,
    getRecentNotifications,
    getActionRequiredNotifications
  };
};

export default useNotificationBackend;

