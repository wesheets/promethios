import { NotificationProvider, NotificationHandler, NotificationProcessor } from '../types/notification';

/**
 * Registry for managing notification providers, handlers, and processors
 * Provides centralized registration and management of notification system components
 */
export class NotificationRegistry {
  private static instance: NotificationRegistry | null = null;
  private providers: Map<string, NotificationProvider> = new Map();
  private handlers: Map<string, NotificationHandler> = new Map();
  private processors: Map<string, NotificationProcessor> = new Map();

  /**
   * Get singleton instance of NotificationRegistry
   */
  static getInstance(): NotificationRegistry {
    if (!NotificationRegistry.instance) {
      NotificationRegistry.instance = new NotificationRegistry();
    }
    return NotificationRegistry.instance;
  }

  /**
   * Register a notification provider
   */
  registerProvider(provider: NotificationProvider): string {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider with ID '${provider.id}' is already registered. Overwriting.`);
    }
    
    this.providers.set(provider.id, provider);
    console.log(`Notification provider '${provider.name}' registered with ID: ${provider.id}`);
    
    return provider.id;
  }

  /**
   * Deregister a notification provider
   */
  deregisterProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      console.warn(`Provider with ID '${providerId}' not found.`);
      return false;
    }

    // Stop the provider if it's running
    provider.stop().catch(error => {
      console.error(`Error stopping provider '${provider.name}':`, error);
    });

    this.providers.delete(providerId);
    console.log(`Notification provider '${provider.name}' deregistered.`);
    
    return true;
  }

  /**
   * Get all registered providers
   */
  getProviders(): NotificationProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): NotificationProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Register a notification handler
   */
  registerHandler(handler: NotificationHandler): string {
    if (this.handlers.has(handler.id)) {
      console.warn(`Handler with ID '${handler.id}' is already registered. Overwriting.`);
    }
    
    this.handlers.set(handler.id, handler);
    console.log(`Notification handler '${handler.name}' registered with ID: ${handler.id}`);
    
    return handler.id;
  }

  /**
   * Deregister a notification handler
   */
  deregisterHandler(handlerId: string): boolean {
    const handler = this.handlers.get(handlerId);
    
    if (!handler) {
      console.warn(`Handler with ID '${handlerId}' not found.`);
      return false;
    }

    this.handlers.delete(handlerId);
    console.log(`Notification handler '${handler.name}' deregistered.`);
    
    return true;
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): NotificationHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Get a specific handler by ID
   */
  getHandler(handlerId: string): NotificationHandler | undefined {
    return this.handlers.get(handlerId);
  }

  /**
   * Get handlers that can handle a specific notification
   */
  getHandlersForNotification(notification: any): NotificationHandler[] {
    return Array.from(this.handlers.values()).filter(handler => 
      handler.canHandle(notification)
    );
  }

  /**
   * Register a notification processor
   */
  registerProcessor(processor: NotificationProcessor): string {
    if (this.processors.has(processor.id)) {
      console.warn(`Processor with ID '${processor.id}' is already registered. Overwriting.`);
    }
    
    this.processors.set(processor.id, processor);
    console.log(`Notification processor registered with ID: ${processor.id}`);
    
    return processor.id;
  }

  /**
   * Deregister a notification processor
   */
  deregisterProcessor(processorId: string): boolean {
    const processor = this.processors.get(processorId);
    
    if (!processor) {
      console.warn(`Processor with ID '${processorId}' not found.`);
      return false;
    }

    this.processors.delete(processorId);
    console.log(`Notification processor deregistered: ${processorId}`);
    
    return true;
  }

  /**
   * Get all registered processors
   */
  getProcessors(): NotificationProcessor[] {
    return Array.from(this.processors.values());
  }

  /**
   * Get a specific processor by ID
   */
  getProcessor(processorId: string): NotificationProcessor | undefined {
    return this.processors.get(processorId);
  }

  /**
   * Get processors that should process a specific notification
   */
  getProcessorsForNotification(notification: any): NotificationProcessor[] {
    return Array.from(this.processors.values()).filter(processor => 
      processor.shouldProcess(notification)
    );
  }

  /**
   * Initialize all registered providers
   */
  async initializeAllProviders(): Promise<boolean> {
    const providers = Array.from(this.providers.values());
    const results = await Promise.allSettled(
      providers.map(provider => provider.initialize())
    );

    let allSuccessful = true;
    results.forEach((result, index) => {
      const provider = providers[index];
      if (result.status === 'rejected') {
        console.error(`Failed to initialize provider '${provider.name}':`, result.reason);
        allSuccessful = false;
      } else if (!result.value) {
        console.error(`Provider '${provider.name}' initialization returned false`);
        allSuccessful = false;
      }
    });

    return allSuccessful;
  }

  /**
   * Start all registered providers
   */
  async startAllProviders(): Promise<boolean> {
    const providers = Array.from(this.providers.values());
    const results = await Promise.allSettled(
      providers.map(provider => provider.start())
    );

    let allSuccessful = true;
    results.forEach((result, index) => {
      const provider = providers[index];
      if (result.status === 'rejected') {
        console.error(`Failed to start provider '${provider.name}':`, result.reason);
        allSuccessful = false;
      } else if (!result.value) {
        console.error(`Provider '${provider.name}' start returned false`);
        allSuccessful = false;
      }
    });

    return allSuccessful;
  }

  /**
   * Stop all registered providers
   */
  async stopAllProviders(): Promise<boolean> {
    const providers = Array.from(this.providers.values());
    const results = await Promise.allSettled(
      providers.map(provider => provider.stop())
    );

    let allSuccessful = true;
    results.forEach((result, index) => {
      const provider = providers[index];
      if (result.status === 'rejected') {
        console.error(`Failed to stop provider '${provider.name}':`, result.reason);
        allSuccessful = false;
      } else if (!result.value) {
        console.error(`Provider '${provider.name}' stop returned false`);
        allSuccessful = false;
      }
    });

    return allSuccessful;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    providers: number;
    handlers: number;
    processors: number;
  } {
    return {
      providers: this.providers.size,
      handlers: this.handlers.size,
      processors: this.processors.size
    };
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.providers.clear();
    this.handlers.clear();
    this.processors.clear();
    console.log('NotificationRegistry cleared');
  }
}

// Export singleton instance
export const notificationRegistry = NotificationRegistry.getInstance();

