/**
 * Notification System Types
 * Core type definitions for the notification system
 */

export interface NotificationAction {
  label: string;
  url?: string;
  handler?: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'governance' | 'trust_boundary' | 'observer' | 'system';
  title: string;
  message: string;
  timestamp: string; // ISO string format
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  expiresAt?: string; // ISO string format
  source?: string; // Which provider/service generated this notification
}

export interface NotificationProvider {
  name: string;
  subscribe(callback: (notification: Notification) => void): () => void;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getNotifications(filter?: NotificationFilter): Promise<Notification[]>;
  createNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<string>;
}

export interface NotificationFilter {
  type?: Notification['type'][];
  priority?: Notification['priority'][];
  category?: string[];
  unreadOnly?: boolean;
  since?: string; // ISO string format
  limit?: number;
  offset?: number;
}

export interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  enableInApp: boolean;
  categories: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

// Event types for the notification system
export interface NotificationEvent {
  type: 'created' | 'updated' | 'deleted' | 'read' | 'unread';
  notification: Notification;
  timestamp: string;
}

// Configuration for notification providers
export interface NotificationProviderConfig {
  name: string;
  enabled: boolean;
  settings: Record<string, any>;
  priority: number; // Higher priority providers are checked first
}

export interface NotificationSystemConfig {
  providers: NotificationProviderConfig[];
  defaultSettings: NotificationSettings;
  retentionDays: number;
  maxNotifications: number;
  enableRealtime: boolean;
}

