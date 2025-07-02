// Notification System Types
// Core type definitions for the notification system

export interface NotificationAction {
  label: string;
  url?: string;
  handler?: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'governance' | 'trust_boundary' | 'observer' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  expiresAt?: string;
  source?: string;
}

export interface NotificationProvider {
  name: string;
  subscribe(callback: (notification: AppNotification) => void): () => void;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getNotifications(filter?: NotificationFilter): Promise<AppNotification[]>;
  createNotification(notification: Omit<AppNotification, 'id' | 'timestamp'>): Promise<string>;
}

export interface NotificationFilter {
  type?: AppNotification['type'][];
  priority?: AppNotification['priority'][];
  category?: string[];
  unreadOnly?: boolean;
  since?: string;
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
    start: string;
    end: string;
  };
}

export interface NotificationHandler {
  id: string;
  name: string;
  type: string;
  priority: number;
  handle(notification: AppNotification): Promise<void>;
}

export interface NotificationProcessor {
  id: string;
  name: string;
  process(notification: AppNotification): Promise<AppNotification>;
}

export interface NotificationConfig {
  providers: string[];
  handlers: string[];
  processors: string[];
  settings: NotificationSettings;
}

