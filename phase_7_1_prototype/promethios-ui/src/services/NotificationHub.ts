/**
 * Notification Hub
 * Orchestrates notification flow between providers and handlers
 */

import { Notification, NotificationProcessor } from '../types/notification';
import { NotificationService } from './NotificationService';
import { NotificationRegistry } from './NotificationRegistry';

export class NotificationHub {
  private notificationService: NotificationService | null = null;
  private notificationRegistry: NotificationRegistry | null = null;
  private processors = new Map<string, NotificationProcessor>();
  private isInitialized = false;
  private isRunning = false;

  /**
   * Initialize the notification hub
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      this.isInitialized = true;
      console.log('NotificationHub initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize NotificationHub:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Stop the notification hub
   */
  async stop(): Promise<boolean> {
    try {
      this.isRunning = false;
      this.processors.clear();
      this.notificationService = null;
      this.notificationRegistry = null;
      this.isInitialized = false;

      console.log('NotificationHub stopped successfully');
      return true;
    } catch (error) {
      console.error('Failed to stop NotificationHub:', error);
      return false;
    }
  }

  /**
   * Set the notification service
   */
  setNotificationService(notificationService: NotificationService): void {
    this.notificationService = notificationService;
  }

  /**
   * Set the notification registry
   */
  setNotificationRegistry(notificationRegistry: NotificationRegistry): void {
    this.notificationRegistry = notificationRegistry;
  }

  /**
   * Start the notification hub
   */
  async start(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationHub not initialized');
    }

    if (!this.notificationService) {
      throw new Error('NotificationService not set');
    }

    if (!this.notificationRegistry) {
      throw new Error('NotificationRegistry not set');
    }

    try {
      this.isRunning = true;
      console.log('NotificationHub started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start NotificationHub:', error);
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Process a notification through the hub
   */
  async processNotification(notification: Notification): Promise<boolean> {
    if (!this.isInitialized || !this.isRunning) {
      throw new Error('NotificationHub not initialized or not running');
    }

    if (!this.notificationService || !this.notificationRegistry) {
      throw new Error('NotificationService or NotificationRegistry not set');
    }

    try {
      // Process the notification through registered processors
      let processedNotification = { ...notification };

      for (const processor of this.processors.values()) {
        if (processor.shouldProcess(processedNotification)) {
          try {
            processedNotification = await processor.process(processedNotification);
          } catch (error) {
            console.error(`Processor ${processor.id} failed to process notification:`, error);
            // Continue with other processors
          }
        }
      }

      // Create the notification in the service
      const notificationId = await this.notificationService.createNotification(processedNotification);

      if (!notificationId) {
        console.error('Failed to create notification in service');
        return false;
      }

      // Get handlers that can handle this notification type
      const handlers = this.notificationRegistry.getHandlersForType(processedNotification.type);

      // Process the notification through each handler
      const handlerPromises = handlers.map(async (handler) => {
        try {
          if (handler.canHandle(processedNotification)) {
            await handler.handle(processedNotification);
            console.log(`Handler ${handler.name} processed notification ${notificationId}`);
          }
        } catch (error) {
          console.error(`Handler ${handler.name} failed to process notification:`, error);
        }
      });

      await Promise.all(handlerPromises);

      console.log(`Successfully processed notification ${notificationId} through ${handlers.length} handlers`);
      return true;

    } catch (error) {
      console.error('Failed to process notification:', error);
      return false;
    }
  }

  /**
   * Register a notification processor
   */
  registerProcessor(processor: NotificationProcessor): string {
    if (!this.isInitialized) {
      throw new Error('NotificationHub not initialized');
    }

    if (this.processors.has(processor.id)) {
      console.warn(`Processor with ID ${processor.id} already registered`);
      return processor.id;
    }

    this.processors.set(processor.id, processor);
    console.log(`Registered notification processor: ${processor.id}`);
    
    return processor.id;
  }

  /**
   * Deregister a notification processor
   */
  deregisterProcessor(processorId: string): boolean {
    if (!this.isInitialized) {
      throw new Error('NotificationHub not initialized');
    }

    const processor = this.processors.get(processorId);
    if (!processor) {
      console.warn(`Processor with ID ${processorId} not found`);
      return false;
    }

    this.processors.delete(processorId);
    console.log(`Deregistered notification processor: ${processorId}`);
    return true;
  }

  /**
   * Get all registered processors
   */
  getProcessors(): NotificationProcessor[] {
    if (!this.isInitialized) {
      throw new Error('NotificationHub not initialized');
    }

    return Array.from(this.processors.values());
  }

  /**
   * Get a specific processor by ID
   */
  getProcessor(processorId: string): NotificationProcessor | undefined {
    if (!this.isInitialized) {
      throw new Error('NotificationHub not initialized');
    }

    return this.processors.get(processorId);
  }

  /**
   * Process multiple notifications in batch
   */
  async processNotificationBatch(notifications: Notification[]): Promise<boolean[]> {
    if (!this.isInitialized || !this.isRunning) {
      throw new Error('NotificationHub not initialized or not running');
    }

    try {
      const results = await Promise.all(
        notifications.map(notification => this.processNotification(notification))
      );

      console.log(`Processed batch of ${notifications.length} notifications`);
      return results;

    } catch (error) {
      console.error('Failed to process notification batch:', error);
      return notifications.map(() => false);
    }
  }

  /**
   * Get hub statistics
   */
  getStats(): {
    processorsCount: number;
    isRunning: boolean;
    isInitialized: boolean;
    hasNotificationService: boolean;
    hasNotificationRegistry: boolean;
  } {
    return {
      processorsCount: this.processors.size,
      isRunning: this.isRunning,
      isInitialized: this.isInitialized,
      hasNotificationService: this.notificationService !== null,
      hasNotificationRegistry: this.notificationRegistry !== null
    };
  }

  /**
   * Create a test notification and process it
   */
  async createTestNotification(type: Notification['type'] = 'info'): Promise<boolean> {
    if (!this.isInitialized || !this.isRunning) {
      throw new Error('NotificationHub not initialized or not running');
    }

    const testNotification: Notification = {
      id: `test-${Date.now()}`,
      title: `Test ${type} notification`,
      message: `This is a test ${type} notification created at ${new Date().toLocaleTimeString()}`,
      type,
      priority: type === 'error' ? 'high' : 'medium',
      source: 'system',
      createdAt: Date.now(),
      read: false,
      dismissible: true,
      actions: [
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'dismiss'
        }
      ],
      data: {
        test: true,
        createdBy: 'NotificationHub'
      },
      context: {
        module: 'notification-hub',
        feature: 'test'
      }
    };

    return await this.processNotification(testNotification);
  }
}

