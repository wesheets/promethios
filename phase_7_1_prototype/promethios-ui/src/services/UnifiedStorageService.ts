import { StorageProvider, StoragePolicy, StorageConfig, NamespaceConfig } from './types';
import { LocalStorageProvider } from './LocalStorageProvider';
import { MemoryStorageProvider } from './MemoryStorageProvider';
import { FirebaseStorageProvider } from './FirebaseStorageProvider';

/**
 * Unified Storage Service
 * Central service that manages multiple storage providers and routes data
 * based on namespace configurations and policies
 */
export class UnifiedStorageService {
  private providers = new Map<string, StorageProvider>();
  private namespaceConfigs = new Map<string, NamespaceConfig>();
  private defaultProvider: string = 'localStorage';
  private hydrationState = new Map<string, 'pending' | 'complete' | 'error'>();
  private hydrationPromises = new Map<string, Promise<void>>();

  constructor(config: StorageConfig) {
    this.initializeProviders(config);
    this.setupNamespaceConfigs(config.namespaces || {});
    this.defaultProvider = config.defaultProvider || 'localStorage';
  }

  private initializeProviders(config: StorageConfig): void {
    // Always initialize localStorage and memory providers
    this.providers.set('localStorage', new LocalStorageProvider());
    this.providers.set('memory', new MemoryStorageProvider());

    // Initialize Firebase provider with localStorage fallback
    if (config.providers?.firebase?.enabled !== false) {
      const fallbackProvider = this.providers.get('localStorage');
      this.providers.set('firebase', new FirebaseStorageProvider(fallbackProvider));
    }

    console.log(`UnifiedStorageService: Initialized ${this.providers.size} storage providers`);
  }

  private setupNamespaceConfigs(namespaces: Record<string, NamespaceConfig>): void {
    Object.entries(namespaces).forEach(([namespace, config]) => {
      this.namespaceConfigs.set(namespace, config);
    });
  }

  /**
   * Get a value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    const provider = this.getProviderForKey(key);
    return provider.get<T>(key);
  }

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T, policy?: StoragePolicy): Promise<boolean> {
    const resolvedPolicy = this.resolvePolicyForKey(key, policy);
    const provider = this.selectProviderForPolicy(key, resolvedPolicy);
    return provider.set(key, value, resolvedPolicy);
  }

  /**
   * Delete a value from storage
   */
  async delete(key: string): Promise<boolean> {
    const provider = this.getProviderForKey(key);
    return provider.delete(key);
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<boolean> {
    const results = await Promise.all(
      Array.from(this.providers.values()).map(provider => provider.clear())
    );
    return results.every(result => result);
  }

  /**
   * Subscribe to changes for a key
   */
  subscribe(key: string, callback: (value: any) => void): string {
    const provider = this.getProviderForKey(key);
    return provider.subscribe(key, callback);
  }

  /**
   * Unsubscribe from changes
   */
  unsubscribe(subscriptionId: string): void {
    // Try to unsubscribe from all providers since we don't know which one owns the subscription
    this.providers.forEach(provider => {
      try {
        provider.unsubscribe(subscriptionId);
      } catch (error) {
        // Ignore errors - the subscription might not exist in this provider
      }
    });
  }

  /**
   * Get all data for a namespace
   */
  async getNamespace(namespace: string): Promise<Record<string, any>> {
    const provider = this.getProviderForNamespace(namespace);
    if (provider.getNamespace) {
      return provider.getNamespace(namespace);
    }
    
    // Fallback: manually collect keys with namespace prefix
    const result: Record<string, any> = {};
    // This would require iterating through all keys, which is provider-specific
    console.warn(`UnifiedStorageService: getNamespace not fully supported for provider`);
    return result;
  }

  /**
   * Clear all data for a namespace
   */
  async clearNamespace(namespace: string): Promise<boolean> {
    const provider = this.getProviderForNamespace(namespace);
    if (provider.clearNamespace) {
      return provider.clearNamespace(namespace);
    }
    
    console.warn(`UnifiedStorageService: clearNamespace not supported for provider`);
    return false;
  }

  /**
   * Hydrate storage (ensure data is loaded)
   */
  async hydrate(namespace?: string): Promise<void> {
    if (namespace) {
      return this.hydrateNamespace(namespace);
    }
    
    // Hydrate all critical namespaces
    const criticalNamespaces = ['user', 'notifications', 'preferences', 'observer'];
    await Promise.all(
      criticalNamespaces.map(ns => this.hydrateNamespace(ns))
    );
  }

  /**
   * Wait for a namespace to be hydrated
   */
  async waitForHydration(namespace: string): Promise<void> {
    const existing = this.hydrationPromises.get(namespace);
    if (existing) return existing;
    
    if (this.hydrationState.get(namespace) === 'complete') return;
    
    return this.hydrateNamespace(namespace);
  }

  /**
   * Get storage information for all providers
   */
  async getStorageInfo(): Promise<Record<string, any>> {
    const info: Record<string, any> = {};
    
    for (const [name, provider] of this.providers) {
      try {
        info[name] = await provider.getStorageInfo();
      } catch (error) {
        info[name] = {
          provider: name,
          available: false,
          error: error.message
        };
      }
    }
    
    return info;
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers) {
      try {
        const info = await provider.getStorageInfo();
        health[name] = info.available;
      } catch (error) {
        health[name] = false;
      }
    }
    
    return health;
  }

  /**
   * Migrate data between providers
   */
  async migrateData(fromProvider: string, toProvider: string, namespace?: string): Promise<boolean> {
    const from = this.providers.get(fromProvider);
    const to = this.providers.get(toProvider);
    
    if (!from || !to) {
      console.error(`UnifiedStorageService: Invalid providers for migration: ${fromProvider} -> ${toProvider}`);
      return false;
    }

    try {
      if (namespace && from.getNamespace && to.set) {
        // Migrate specific namespace
        const data = await from.getNamespace(namespace);
        const promises = Object.entries(data).map(([key, value]) => 
          to.set(`${namespace}.${key}`, value)
        );
        await Promise.all(promises);
        return true;
      } else {
        console.warn('UnifiedStorageService: Full migration not implemented yet');
        return false;
      }
    } catch (error) {
      console.error('UnifiedStorageService: Migration failed:', error);
      return false;
    }
  }

  private async hydrateNamespace(namespace: string): Promise<void> {
    if (this.hydrationState.get(namespace) === 'complete') {
      return;
    }

    if (this.hydrationState.get(namespace) === 'pending') {
      const existing = this.hydrationPromises.get(namespace);
      if (existing) return existing;
    }

    this.hydrationState.set(namespace, 'pending');
    
    const promise = this.doHydrateNamespace(namespace);
    this.hydrationPromises.set(namespace, promise);
    
    try {
      await promise;
      this.hydrationState.set(namespace, 'complete');
    } catch (error) {
      this.hydrationState.set(namespace, 'error');
      console.error(`UnifiedStorageService: Hydration failed for namespace ${namespace}:`, error);
    } finally {
      this.hydrationPromises.delete(namespace);
    }
  }

  private async doHydrateNamespace(namespace: string): Promise<void> {
    const provider = this.getProviderForNamespace(namespace);
    
    if (provider.getNamespace) {
      // Pre-load namespace data
      await provider.getNamespace(namespace);
    }
    
    console.log(`UnifiedStorageService: Hydrated namespace ${namespace}`);
  }

  private getProviderForKey(key: string): StorageProvider {
    const namespace = this.extractNamespace(key);
    return this.getProviderForNamespace(namespace);
  }

  private getProviderForNamespace(namespace: string): StorageProvider {
    const config = this.namespaceConfigs.get(namespace);
    const providerName = config?.provider || this.defaultProvider;
    
    const provider = this.providers.get(providerName);
    if (!provider) {
      console.warn(`UnifiedStorageService: Provider ${providerName} not found, using default`);
      return this.providers.get(this.defaultProvider)!;
    }
    
    return provider;
  }

  private selectProviderForPolicy(key: string, policy: StoragePolicy): StorageProvider {
    const namespace = this.extractNamespace(key);
    const config = this.namespaceConfigs.get(namespace);
    
    // Start with namespace provider preference
    let providerName = config?.provider || this.defaultProvider;
    
    // Apply policy constraints
    if (policy.forbiddenProviders?.includes(providerName)) {
      // Find alternative provider
      const allowedProviders = policy.allowedProviders || ['localStorage', 'memory', 'firebase'];
      const forbidden = policy.forbiddenProviders || [];
      const candidates = allowedProviders.filter(p => !forbidden.includes(p));
      
      if (candidates.length > 0) {
        providerName = candidates[0];
      } else {
        throw new Error(`No suitable storage provider found for key ${key}`);
      }
    }
    
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Storage provider ${providerName} not available`);
    }
    
    return provider;
  }

  private resolvePolicyForKey(key: string, policy?: StoragePolicy): StoragePolicy {
    const namespace = this.extractNamespace(key);
    const config = this.namespaceConfigs.get(namespace);
    
    // Merge namespace policy with provided policy
    return {
      ...config?.defaultPolicy,
      ...policy
    };
  }

  private extractNamespace(key: string): string {
    const parts = key.split('.');
    return parts.length > 1 ? parts[0] : 'default';
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.providers.forEach(provider => {
      if (provider.destroy) {
        provider.destroy();
      }
    });
    
    this.providers.clear();
    this.namespaceConfigs.clear();
    this.hydrationState.clear();
    this.hydrationPromises.clear();
  }
}

