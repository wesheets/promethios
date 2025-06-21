import { StorageProvider, StoragePolicy, StorageConfig, NamespaceConfig } from './storage/types';
import { LocalStorageProvider } from './storage/LocalStorageProvider';
import { MemoryStorageProvider } from './storage/MemoryStorageProvider';
import { FirebaseStorageProvider } from './storage/FirebaseStorageProvider';

/**
 * Unified Storage Service
 * Central service that manages multiple storage providers and routes data
 * based on namespace configurations and policies
 */
export class UnifiedStorageService {
  private providers = new Map<string, StorageProvider>();
  private config: StorageConfig;
  private eventListeners = new Map<string, Set<Function>>();

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      defaultProvider: 'localStorage',
      providers: {
        localStorage: { enabled: true },
        memory: { enabled: true },
        firebase: { enabled: true }
      },
      namespaces: {
        user: { provider: 'firebase', fallback: 'localStorage' },
        observer: { provider: 'firebase', fallback: 'localStorage' },
        notifications: { provider: 'localStorage', fallback: 'memory' },
        preferences: { provider: 'localStorage', fallback: 'memory' },
        agents: { provider: 'firebase', fallback: 'localStorage' },
        governance: { provider: 'firebase' },
        ui: { provider: 'localStorage', fallback: 'memory' },
        cache: { provider: 'memory', fallback: 'localStorage' }
      },
      ...config
    };

    this.initializeProviders();
  }

  private async initializeProviders(): Promise<void> {
    // Initialize enabled providers
    if (this.config.providers.localStorage?.enabled) {
      this.providers.set('localStorage', new LocalStorageProvider());
    }
    
    if (this.config.providers.memory?.enabled) {
      this.providers.set('memory', new MemoryStorageProvider());
    }
    
    if (this.config.providers.firebase?.enabled) {
      this.providers.set('firebase', new FirebaseStorageProvider());
    }
  }

  /**
   * Get the appropriate provider for a namespace
   */
  private async getProviderForNamespace(namespace: string): Promise<StorageProvider | null> {
    const namespaceConfig = this.config.namespaces[namespace];
    if (!namespaceConfig) {
      // Use default provider for unknown namespaces
      return this.providers.get(this.config.defaultProvider) || null;
    }

    // Try primary provider
    const primaryProvider = this.providers.get(namespaceConfig.provider);
    if (primaryProvider && await primaryProvider.isAvailable()) {
      return primaryProvider;
    }

    // Try fallback provider
    if (namespaceConfig.fallback) {
      const fallbackProvider = this.providers.get(namespaceConfig.fallback);
      if (fallbackProvider && await fallbackProvider.isAvailable()) {
        console.warn(`Using fallback provider ${namespaceConfig.fallback} for namespace ${namespace}`);
        return fallbackProvider;
      }
    }

    // Last resort: use any available provider
    for (const provider of this.providers.values()) {
      if (await provider.isAvailable()) {
        console.warn(`Using emergency provider ${provider.name} for namespace ${namespace}`);
        return provider;
      }
    }

    return null;
  }

  /**
   * Get a value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const namespace = this.extractNamespace(key);
      const provider = await this.getProviderForNamespace(namespace);
      
      if (!provider) {
        throw new Error(`No available provider for namespace: ${namespace}`);
      }

      const result = await provider.get<T>(key);
      this.emit('get', { key, namespace, provider: provider.name, result });
      return result;
    } catch (error) {
      this.emit('error', { key, error });
      console.error('Storage get error:', error);
      return null;
    }
  }

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T, policy?: StoragePolicy): Promise<void> {
    try {
      const namespace = this.extractNamespace(key);
      const provider = await this.getProviderForNamespace(namespace);
      
      if (!provider) {
        throw new Error(`No available provider for namespace: ${namespace}`);
      }

      // Merge with namespace default policy
      const namespaceConfig = this.config.namespaces[namespace];
      const finalPolicy = { ...namespaceConfig?.defaultPolicy, ...policy };

      await provider.set(key, value, finalPolicy);
      this.emit('set', { key, namespace, provider: provider.name, value });
    } catch (error) {
      this.emit('error', { key, error });
      console.error('Storage set error:', error);
      throw error;
    }
  }

  /**
   * Delete a value from storage
   */
  async delete(key: string): Promise<void> {
    try {
      const namespace = this.extractNamespace(key);
      const provider = await this.getProviderForNamespace(namespace);
      
      if (!provider) {
        throw new Error(`No available provider for namespace: ${namespace}`);
      }

      await provider.delete(key);
      this.emit('delete', { key, namespace, provider: provider.name });
    } catch (error) {
      this.emit('error', { key, error });
      console.error('Storage delete error:', error);
      throw error;
    }
  }

  /**
   * Clear all data in a namespace
   */
  async clearNamespace(namespace: string): Promise<void> {
    try {
      const provider = await this.getProviderForNamespace(namespace);
      
      if (!provider) {
        throw new Error(`No available provider for namespace: ${namespace}`);
      }

      const keys = await provider.keys();
      const namespaceKeys = keys.filter(key => key.startsWith(`${namespace}.`));
      
      await Promise.all(namespaceKeys.map(key => provider.delete(key)));
      this.emit('clearNamespace', { namespace, provider: provider.name });
    } catch (error) {
      this.emit('error', { namespace, error });
      console.error('Storage clearNamespace error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to storage events
   */
  subscribe(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);
    
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Get storage metrics
   */
  async getMetrics(): Promise<{
    totalKeys: number;
    totalSize: number;
    providerHealth: Record<string, 'healthy' | 'degraded' | 'failed'>;
    namespaceUsage: Record<string, { keys: number; size: number }>;
  }> {
    const metrics = {
      totalKeys: 0,
      totalSize: 0,
      providerHealth: {} as Record<string, 'healthy' | 'degraded' | 'failed'>,
      namespaceUsage: {} as Record<string, { keys: number; size: number }>
    };

    // Check provider health
    for (const [name, provider] of this.providers.entries()) {
      try {
        const isAvailable = await provider.isAvailable();
        metrics.providerHealth[name] = isAvailable ? 'healthy' : 'failed';
        
        if (isAvailable) {
          const keys = await provider.keys();
          const size = await provider.size();
          metrics.totalKeys += keys.length;
          metrics.totalSize += size;

          // Calculate namespace usage
          for (const key of keys) {
            const namespace = this.extractNamespace(key);
            if (!metrics.namespaceUsage[namespace]) {
              metrics.namespaceUsage[namespace] = { keys: 0, size: 0 };
            }
            metrics.namespaceUsage[namespace].keys++;
          }
        }
      } catch (error) {
        metrics.providerHealth[name] = 'failed';
      }
    }

    return metrics;
  }

  /**
   * Extract namespace from key
   */
  private extractNamespace(key: string): string {
    const parts = key.split('.');
    return parts[0] || 'default';
  }

  /**
   * Emit storage events
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Storage event listener error:', error);
        }
      });
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }
}

