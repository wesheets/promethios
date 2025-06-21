/**
 * Notification Registry
 * Manages notification providers and handlers according to the design specification
 */

import { NotificationProvider, NotificationHandler } from '../types/notification';

export class NotificationRegistry {
  private providers = new Map<string, NotificationProvider>();
  private handlers = new Map<string, NotificationHandler>();
  private isInitialized = false;

  /**
   * Initialize the notification registry
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      this.isInitialized = true;
      console.log('NotificationRegistry initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize NotificationRegistry:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Stop the notification registry
   */
  async stop(): Promise<boolean> {
    try {
      // Stop all providers
      for (const provider of this.providers.values()) {
        if (provider.stop) {
          await provider.stop();
        }
      }

      this.providers.clear();
      this.handlers.clear();
      this.isInitialized = false;

      console.log('NotificationRegistry stopped successfully');
      return true;
    } catch (error) {
      console.error('Failed to stop NotificationRegistry:', error);
      return false;
    }
  }

  /**
   * Register a notification provider
   */
  registerProvider(provider: NotificationProvider): string {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    if (this.providers.has(provider.id)) {
      console.warn(`Provider with ID ${provider.id} already registered`);
      return provider.id;
    }

    this.providers.set(provider.id, provider);
    console.log(`Registered notification provider: ${provider.name} (${provider.id})`);
    
    return provider.id;
  }

  /**
   * Deregister a notification provider
   */
  async deregisterProvider(providerId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      console.warn(`Provider with ID ${providerId} not found`);
      return false;
    }

    try {
      // Stop the provider if it has a stop method
      if (provider.stop) {
        await provider.stop();
      }

      this.providers.delete(providerId);
      console.log(`Deregistered notification provider: ${provider.name} (${providerId})`);
      return true;
    } catch (error) {
      console.error(`Failed to deregister provider ${providerId}:`, error);
      return false;
    }
  }

  /**
   * Get all registered providers
   */
  getProviders(): NotificationProvider[] {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): NotificationProvider | undefined {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    return this.providers.get(providerId);
  }

  /**
   * Register a notification handler
   */
  registerHandler(handler: NotificationHandler): string {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    if (this.handlers.has(handler.id)) {
      console.warn(`Handler with ID ${handler.id} already registered`);
      return handler.id;
    }

    this.handlers.set(handler.id, handler);
    console.log(`Registered notification handler: ${handler.name} (${handler.id})`);
    
    return handler.id;
  }

  /**
   * Deregister a notification handler
   */
  deregisterHandler(handlerId: string): boolean {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    const handler = this.handlers.get(handlerId);
    if (!handler) {
      console.warn(`Handler with ID ${handlerId} not found`);
      return false;
    }

    this.handlers.delete(handlerId);
    console.log(`Deregistered notification handler: ${handler.name} (${handlerId})`);
    return true;
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): NotificationHandler[] {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    return Array.from(this.handlers.values());
  }

  /**
   * Get a specific handler by ID
   */
  getHandler(handlerId: string): NotificationHandler | undefined {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    return this.handlers.get(handlerId);
  }

  /**
   * Get handlers that can handle a specific notification type
   */
  getHandlersForType(notificationType: string): NotificationHandler[] {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    return Array.from(this.handlers.values()).filter(handler =>
      handler.supportedTypes.includes(notificationType as any)
    );
  }

  /**
   * Get providers that can generate a specific notification type
   */
  getProvidersForType(notificationType: string): NotificationProvider[] {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    return Array.from(this.providers.values()).filter(provider =>
      provider.supportedTypes.includes(notificationType as any)
    );
  }

  /**
   * Start all registered providers
   */
  async startAllProviders(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    try {
      const startPromises = Array.from(this.providers.values()).map(async (provider) => {
        try {
          if (provider.start) {
            await provider.start();
            console.log(`Started provider: ${provider.name}`);
          }
        } catch (error) {
          console.error(`Failed to start provider ${provider.name}:`, error);
        }
      });

      await Promise.all(startPromises);
      return true;
    } catch (error) {
      console.error('Failed to start all providers:', error);
      return false;
    }
  }

  /**
   * Stop all registered providers
   */
  async stopAllProviders(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    try {
      const stopPromises = Array.from(this.providers.values()).map(async (provider) => {
        try {
          if (provider.stop) {
            await provider.stop();
            console.log(`Stopped provider: ${provider.name}`);
          }
        } catch (error) {
          console.error(`Failed to stop provider ${provider.name}:`, error);
        }
      });

      await Promise.all(stopPromises);
      return true;
    } catch (error) {
      console.error('Failed to stop all providers:', error);
      return false;
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    providersCount: number;
    handlersCount: number;
    providersByType: Record<string, number>;
    handlersByType: Record<string, number>;
  } {
    if (!this.isInitialized) {
      throw new Error('NotificationRegistry not initialized');
    }

    const providersByType: Record<string, number> = {};
    const handlersByType: Record<string, number> = {};

    // Count providers by type
    for (const provider of this.providers.values()) {
      for (const type of provider.supportedTypes) {
        providersByType[type] = (providersByType[type] || 0) + 1;
      }
    }

    // Count handlers by type
    for (const handler of this.handlers.values()) {
      for (const type of handler.supportedTypes) {
        handlersByType[type] = (handlersByType[type] || 0) + 1;
      }
    }

    return {
      providersCount: this.providers.size,
      handlersCount: this.handlers.size,
      providersByType,
      handlersByType
    };
  }
}

