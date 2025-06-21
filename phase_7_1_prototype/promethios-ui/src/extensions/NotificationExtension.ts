/**
 * Notification Extension for the Promethios Extension System
 * 
 * This module provides a notification extension that integrates with the
 * Promethios extension point framework to provide unified notifications
 * across all modules.
 */

import { ExtensionPointFramework } from '../../../phase_6_3_new/src/core/governance/extension_point_framework';
import { NotificationService } from '../services/NotificationService';
import { NotificationRegistry } from '../services/NotificationRegistry';
import { NotificationHub } from '../services/NotificationHub';

export class NotificationExtension {
  private extensionPointFramework: ExtensionPointFramework;
  private notificationService: NotificationService;
  private notificationRegistry: NotificationRegistry;
  private notificationHub: NotificationHub;
  private extensionPointId = 'promethios.notification.system';
  private implementationId = 'promethios.notification.system.default';

  constructor(extensionPointFramework: ExtensionPointFramework) {
    this.extensionPointFramework = extensionPointFramework;
    this.notificationService = new NotificationService();
    this.notificationRegistry = new NotificationRegistry();
    this.notificationHub = new NotificationHub();
  }

  /**
   * Register the notification extension with the Extension Point Framework
   */
  async register(): Promise<boolean> {
    try {
      // Create extension point data
      const extensionPointData = {
        extension_point_id: this.extensionPointId,
        name: 'Unified Notification System',
        description: 'Provides unified notifications across all Promethios modules',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'update', 'delete', 'markAsRead', 'getNotifications']
            },
            notification: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                message: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['info', 'success', 'warning', 'error', 'governance_violation', 'trust_boundary_breach', 'observer_suggestion', 'system_event']
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical']
                },
                source: {
                  type: 'string',
                  enum: ['system', 'governance', 'trust_metrics', 'observer', 'agent', 'user', 'extension']
                }
              },
              required: ['title', 'message', 'type', 'priority', 'source']
            },
            filter: {
              type: 'object',
              properties: {
                type: { type: 'array', items: { type: 'string' } },
                priority: { type: 'array', items: { type: 'string' } },
                source: { type: 'array', items: { type: 'string' } },
                read: { type: 'boolean' }
              }
            }
          },
          required: ['action']
        },
        output_schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'any' },
            error: { type: 'string' },
            notificationId: { type: 'string' },
            notifications: { type: 'array' },
            count: { type: 'number' }
          }
        },
        owner_module_id: 'promethios.notification',
        metadata: {
          category: 'notification',
          tags: ['notification', 'unified', 'system'],
          version: '1.0.0'
        }
      };

      // Register the extension point
      const extensionPointResult = this.extensionPointFramework.register_extension_point(extensionPointData);
      if (!extensionPointResult) {
        console.error('Failed to register notification extension point');
        return false;
      }

      // Create implementation data
      const implementationData = {
        implementation_id: this.implementationId,
        name: 'Default Notification Implementation',
        description: 'Default implementation for the unified notification system',
        provider_module_id: 'promethios.notification.default',
        priority: 10,
        configuration: {
          maxNotifications: 100,
          defaultExpiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
          defaultPriority: 'medium',
          autoMarkAsRead: true,
          storage: {
            type: 'localStorage'
          }
        }
      };

      // Register the implementation
      const implementationResult = this.extensionPointFramework.register_implementation(
        this.extensionPointId,
        implementationData
      );

      if (!implementationResult) {
        console.error('Failed to register notification implementation');
        return false;
      }

      // Initialize services
      await this.initializeServices();

      console.log('Successfully registered notification extension');
      return true;

    } catch (error) {
      console.error('Error registering notification extension:', error);
      return false;
    }
  }

  /**
   * Unregister the notification extension
   */
  async unregister(): Promise<boolean> {
    try {
      // Stop services
      await this.stopServices();

      // Unregister implementation
      const implementationResult = this.extensionPointFramework.unregister_implementation(
        this.extensionPointId,
        this.implementationId
      );

      if (!implementationResult) {
        console.error('Failed to unregister notification implementation');
        return false;
      }

      // Unregister extension point
      const extensionPointResult = this.extensionPointFramework.unregister_extension_point(this.extensionPointId);

      if (!extensionPointResult) {
        console.error('Failed to unregister notification extension point');
        return false;
      }

      console.log('Successfully unregistered notification extension');
      return true;

    } catch (error) {
      console.error('Error unregistering notification extension:', error);
      return false;
    }
  }

  /**
   * Initialize notification services
   */
  private async initializeServices(): Promise<void> {
    // Initialize notification service
    await this.notificationService.initialize({
      maxNotifications: 100,
      defaultExpiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      defaultPriority: 'medium',
      autoMarkAsRead: true,
      storage: {
        type: 'localStorage'
      }
    });

    // Initialize notification registry
    await this.notificationRegistry.initialize();

    // Initialize notification hub
    await this.notificationHub.initialize();

    // Connect services
    this.notificationHub.setNotificationService(this.notificationService);
    this.notificationHub.setNotificationRegistry(this.notificationRegistry);
  }

  /**
   * Stop notification services
   */
  private async stopServices(): Promise<void> {
    await this.notificationHub.stop();
    await this.notificationRegistry.stop();
    await this.notificationService.stop();
  }

  /**
   * Get the notification service instance
   */
  getNotificationService(): NotificationService {
    return this.notificationService;
  }

  /**
   * Get the notification registry instance
   */
  getNotificationRegistry(): NotificationRegistry {
    return this.notificationRegistry;
  }

  /**
   * Get the notification hub instance
   */
  getNotificationHub(): NotificationHub {
    return this.notificationHub;
  }

  /**
   * Execute notification operations (for extension point invocation)
   */
  async execute(input: any): Promise<any> {
    try {
      const { action, notification, filter, notificationId } = input;

      switch (action) {
        case 'create':
          if (!notification) {
            return { success: false, error: 'Notification data required for create action' };
          }
          const id = await this.notificationService.createNotification(notification);
          return { success: true, notificationId: id };

        case 'update':
          if (!notificationId || !notification) {
            return { success: false, error: 'Notification ID and data required for update action' };
          }
          const updateResult = await this.notificationService.updateNotification(notificationId, notification);
          return { success: updateResult };

        case 'delete':
          if (!notificationId) {
            return { success: false, error: 'Notification ID required for delete action' };
          }
          const deleteResult = await this.notificationService.deleteNotification(notificationId);
          return { success: deleteResult };

        case 'markAsRead':
          if (!notificationId) {
            return { success: false, error: 'Notification ID required for markAsRead action' };
          }
          const markResult = await this.notificationService.markAsRead(notificationId);
          return { success: markResult };

        case 'getNotifications':
          const notifications = await this.notificationService.getNotifications(filter);
          return { success: true, notifications };

        case 'getCount':
          const count = await this.notificationService.getNotificationCount(filter);
          return { success: true, count };

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

