/**
 * Notification Extension for Promethios
 * 
 * Simplified version that provides notification functionality without complex extension framework
 */

import { notificationService } from '../services/notificationService';
import { NotificationProvider } from '../types/notification';

/**
 * Notification Extension Class
 * Provides notification-related functionality as a simple service
 */
export class NotificationExtension {
  private static instance: NotificationExtension;
  private initialized = false;
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = new NotificationService();
  }

  static getInstance(): NotificationExtension {
    if (!NotificationExtension.instance) {
      NotificationExtension.instance = new NotificationExtension();
    }
    return NotificationExtension.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // Initialize notification service
      await this.notificationService.initialize();
      this.initialized = true;
      console.log('NotificationExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize NotificationExtension:', error);
      return false;
    }
  }

  // Notification operations
  async beforeNotificationSend(notification: any): Promise<void> {
    // Extension point for before notification send
    console.log('Before notification send:', notification.id);
  }

  async afterNotificationSend(notification: any): Promise<void> {
    // Extension point for after notification send
    console.log('After notification send:', notification.id);
  }

  async beforeNotificationReceive(notification: any): Promise<void> {
    // Extension point for before notification receive
    console.log('Before notification receive:', notification.id);
  }

  async afterNotificationReceive(notification: any): Promise<void> {
    // Extension point for after notification receive
    console.log('After notification receive:', notification.id);
  }

  async onNotificationError(error: Error, operation: string, notificationId?: string): Promise<void> {
    // Extension point for notification error handling
    console.error(`Notification error in ${operation} for ${notificationId}:`, error);
  }

  // Utility methods
  getNotificationService(): NotificationService {
    return this.notificationService;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async registerProvider(provider: NotificationProvider): Promise<void> {
    await this.notificationService.registerProvider(provider);
  }

  async sendNotification(notification: any): Promise<void> {
    await this.beforeNotificationSend(notification);
    try {
      await this.notificationService.sendNotification(notification);
      await this.afterNotificationSend(notification);
    } catch (error) {
      await this.onNotificationError(error as Error, 'send', notification.id);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationExtension = NotificationExtension.getInstance();

