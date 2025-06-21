/**
 * Notification System Types
 * Core type definitions for the notification system
 */

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'governance' | 'agent';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: number;
}

export interface NotificationProvider {
  name: string;
  subscribe(callback: (notification: Notification) => void): () => void;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getNotifications(): Promise<Notification[]>;
}

export interface NotificationFilter {
  type?: Notification['type'][];
  priority?: Notification['priority'][];
  category?: string[];
  unreadOnly?: boolean;
  since?: number;
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

