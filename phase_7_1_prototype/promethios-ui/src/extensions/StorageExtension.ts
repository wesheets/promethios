import { ExtensionPoint, ExtensionRegistry } from '../core/governance/extension_point_framework';
import { UnifiedStorageService, unifiedStorage } from '../services/UnifiedStorageService';
import { StorageEvent, StorageMetrics } from '../services/storage/types';

/**
 * Storage Extension for Promethios Extension System
 * Provides unified storage capabilities across all system components
 * with proper governance, compliance, and monitoring integration
 */
export class StorageExtension {
  private static instance: StorageExtension;
  private extensionRegistry: ExtensionRegistry;
  private storageService: UnifiedStorageService;
  private isInitialized = false;
  private eventListeners = new Set<(event: StorageEvent) => void>();

  constructor() {
    this.extensionRegistry = ExtensionRegistry.getInstance();
    this.storageService = unifiedStorage;
    this.registerExtensionPoints();
  }

  static getInstance(): StorageExtension {
    if (!StorageExtension.instance) {
      StorageExtension.instance = new StorageExtension();
    }
    return StorageExtension.instance;
  }

  private registerExtensionPoints(): void {
    // Register storage extension points for other modules to hook into
    this.extensionRegistry.registerExtensionPoint(
      new ExtensionPoint(
        'storage.beforeSet',
        'Called before setting a value in storage',
        ['namespace', 'key', 'value', 'options']
      )
    );

    this.extensionRegistry.registerExtensionPoint(
      new ExtensionPoint(
        'storage.afterSet',
        'Called after setting a value in storage',
        ['namespace', 'key', 'value', 'options', 'result']
      )
    );

    this.extensionRegistry.registerExtensionPoint(
      new ExtensionPoint(
        'storage.beforeGet',
        'Called before getting a value from storage',
        ['namespace', 'key']
      )
    );

    this.extensionRegistry.registerExtensionPoint(
      new ExtensionPoint(
        'storage.afterGet',
        'Called after getting a value from storage',
        ['namespace', 'key', 'value']
      )
    );

    this.extensionRegistry.registerExtensionPoint(
      new ExtensionPoint(
        'storage.beforeDelete',
        'Called before deleting a value from storage',
        ['namespace', 'key']
      )
    );

    this.extensionRegistry.registerExtensionPoint(
      new ExtensionPoint(
        'storage.afterDelete',
        'Called after deleting a value from storage',
        ['namespace', 'key']
      )
    );

    this.extensionRegistry.registerExtensionPoint(
      new ExtensionPoint(
        'storage.onError',
        'Called when a storage operation encounters an error',
        ['namespace', 'key', 'operation', 'error']
      )
    );

    this.extensionRegistry.registerExtensionPoint(
      new ExtensionPoint(
        'storage.onMetrics',
        'Called when storage metrics are updated',
        ['metrics']
      )
    );
  }

  /**
   * Initialize the storage extension
   * This method ensures backward compatibility by not breaking existing functionality
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Wait for storage service to be ready
      while (!this.storageService.isReady()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Set up event listeners for extension point integration
      this.storageService.addEventListener((event: StorageEvent) => {
        this.handleStorageEvent(event);
      });

      // Register with the extension registry
      this.extensionRegistry.registerExtension({
        id: 'unified-storage',
        name: 'Unified Storage System',
        version: '1.0.0',
        description: 'Provides unified storage capabilities with governance and compliance',
        extensionPoints: [
          'storage.beforeSet',
          'storage.afterSet',
          'storage.beforeGet',
          'storage.afterGet',
          'storage.beforeDelete',
          'storage.afterDelete',
          'storage.onError',
          'storage.onMetrics'
        ],
        dependencies: [],
        initialize: () => this.initialize(),
        cleanup: () => this.cleanup()
      });

      this.isInitialized = true;
      console.log('StorageExtension initialized successfully');
    } catch (error) {
      console.error('Failed to initialize StorageExtension:', error);
      throw error;
    }
  }

  private handleStorageEvent(event: StorageEvent): void {
    try {
      // Emit extension point events based on storage events
      switch (event.type) {
        case 'set':
          this.extensionRegistry.executeExtensionPoint('storage.afterSet', {
            namespace: event.namespace,
            key: event.key,
            value: event.value,
            timestamp: event.timestamp,
            provider: event.provider
          });
          break;

        case 'delete':
          this.extensionRegistry.executeExtensionPoint('storage.afterDelete', {
            namespace: event.namespace,
            key: event.key,
            timestamp: event.timestamp,
            provider: event.provider
          });
          break;

        case 'error':
          this.extensionRegistry.executeExtensionPoint('storage.onError', {
            namespace: event.namespace,
            key: event.key,
            operation: 'unknown',
            error: event.metadata?.error,
            timestamp: event.timestamp,
            provider: event.provider
          });
          break;
      }

      // Forward events to registered listeners
      this.eventListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in storage event listener:', error);
        }
      });
    } catch (error) {
      console.error('Error handling storage event:', error);
    }
  }

  /**
   * Public API methods that integrate with extension points
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      // Execute before extension point
      await this.extensionRegistry.executeExtensionPoint('storage.beforeGet', {
        namespace,
        key
      });

      const value = await this.storageService.get<T>(namespace, key);

      // Execute after extension point
      await this.extensionRegistry.executeExtensionPoint('storage.afterGet', {
        namespace,
        key,
        value
      });

      return value;
    } catch (error) {
      await this.extensionRegistry.executeExtensionPoint('storage.onError', {
        namespace,
        key,
        operation: 'get',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async set<T>(namespace: string, key: string, value: T, options?: any): Promise<void> {
    try {
      // Execute before extension point
      await this.extensionRegistry.executeExtensionPoint('storage.beforeSet', {
        namespace,
        key,
        value,
        options
      });

      await this.storageService.set(namespace, key, value, options);

      // Execute after extension point
      await this.extensionRegistry.executeExtensionPoint('storage.afterSet', {
        namespace,
        key,
        value,
        options,
        result: 'success'
      });
    } catch (error) {
      await this.extensionRegistry.executeExtensionPoint('storage.onError', {
        namespace,
        key,
        operation: 'set',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async delete(namespace: string, key: string): Promise<void> {
    try {
      // Execute before extension point
      await this.extensionRegistry.executeExtensionPoint('storage.beforeDelete', {
        namespace,
        key
      });

      await this.storageService.delete(namespace, key);

      // Execute after extension point
      await this.extensionRegistry.executeExtensionPoint('storage.afterDelete', {
        namespace,
        key
      });
    } catch (error) {
      await this.extensionRegistry.executeExtensionPoint('storage.onError', {
        namespace,
        key,
        operation: 'delete',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Utility methods for backward compatibility
  getStorageService(): UnifiedStorageService {
    return this.storageService;
  }

  addEventListener(listener: (event: StorageEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  getNamespaces(): string[] {
    return this.storageService.getNamespaces();
  }

  async getProviderHealth(): Promise<Record<string, boolean>> {
    return this.storageService.getProviderHealth();
  }

  async getMetrics(): Promise<StorageMetrics[]> {
    // This would collect metrics from all namespaces
    const namespaces = this.getNamespaces();
    const metrics: StorageMetrics[] = [];

    for (const namespace of namespaces) {
      const size = await this.storageService.size(namespace);
      const config = this.storageService.getNamespaceConfig(namespace);
      
      if (config) {
        metrics.push({
          provider: config.policy.provider,
          namespace,
          operations: {
            reads: 0, // Would be tracked in real implementation
            writes: 0,
            deletes: 0,
            errors: 0
          },
          performance: {
            avgReadTime: 0,
            avgWriteTime: 0,
            avgDeleteTime: 0
          },
          storage: {
            totalKeys: size,
            totalSize: 0, // Would be calculated in real implementation
            lastSync: Date.now()
          }
        });
      }
    }

    // Emit metrics extension point
    await this.extensionRegistry.executeExtensionPoint('storage.onMetrics', {
      metrics
    });

    return metrics;
  }

  private async cleanup(): Promise<void> {
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance for backward compatibility
export const storageExtension = StorageExtension.getInstance();

