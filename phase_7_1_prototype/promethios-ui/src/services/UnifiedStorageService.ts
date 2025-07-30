import { StorageProvider, StorageOptions, StorageEvent, StorageNamespace, StoragePolicy } from './storage/types';
import { LocalStorageProvider } from './storage/LocalStorageProvider';
import { MemoryStorageProvider } from './storage/MemoryStorageProvider';
import { FirebaseStorageProvider } from './storage/FirebaseStorageProvider';
import storageManifest from '../config/storage_manifest.json';

export class UnifiedStorageService {
  private static instance: UnifiedStorageService | null = null;
  private providers = new Map<string, StorageProvider>();
  private namespaces = new Map<string, StorageNamespace>();
  private eventListeners = new Set<(event: StorageEvent) => void>();
  private isInitialized = false;

  private constructor() {
    try {
      // Reduced logging - only log once per session
      if (!sessionStorage.getItem('unified_storage_initialized')) {
        console.log('🔧 Initializing UnifiedStorageService (singleton)');
        sessionStorage.setItem('unified_storage_initialized', 'true');
      }
      this.initializeProviders();
      this.loadNamespaces();
      // Only log success once per session
      if (!sessionStorage.getItem('unified_storage_success')) {
        console.log('✅ UnifiedStorageService initialized successfully');
        sessionStorage.setItem('unified_storage_success', 'true');
      }
    } catch (error) {
      console.error('❌ Error initializing UnifiedStorageService:', error);
      // Set minimal initialized state to prevent further errors
      this.isInitialized = true;
    }
  }

  public static getInstance(): UnifiedStorageService {
    if (!UnifiedStorageService.instance) {
      UnifiedStorageService.instance = new UnifiedStorageService();
    }
    return UnifiedStorageService.instance;
  }

  // For backward compatibility, allow direct instantiation but return singleton
  public static create(): UnifiedStorageService {
    return UnifiedStorageService.getInstance();
  }

  private initializeProviders(): void {
    // Initialize providers with fallback chain
    const localStorage = new LocalStorageProvider();
    const memory = new MemoryStorageProvider();
    const firebase = new FirebaseStorageProvider(localStorage);

    this.providers.set('localStorage', localStorage);
    this.providers.set('memory', memory);
    this.providers.set('firebase', firebase);
  }

  private loadNamespaces(): void {
    for (const [name, config] of Object.entries(storageManifest)) {
      const namespace: StorageNamespace = {
        name,
        policy: config as StoragePolicy,
        description: config.description
      };
      this.namespaces.set(name, namespace);
    }
    this.isInitialized = true;
  }

  private getProvider(namespace: string): StorageProvider {
    const namespaceConfig = this.namespaces.get(namespace);
    if (!namespaceConfig) {
      throw new Error(`Unknown namespace: ${namespace}`);
    }

    const primaryProvider = this.providers.get(namespaceConfig.policy.provider);
    if (!primaryProvider) {
      throw new Error(`Unknown provider: ${namespaceConfig.policy.provider}`);
    }

    return primaryProvider;
  }

  private getNamespacedKey(namespace: string, key: string): string {
    return `${namespace}.${key}`;
  }

  private emitEvent(event: StorageEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in storage event listener:', error);
      }
    });
  }

  // Public API
  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      const provider = this.getProvider(namespace);
      const namespacedKey = this.getNamespacedKey(namespace, key);
      const value = await provider.get<T>(namespacedKey);

      this.emitEvent({
        type: 'set',
        namespace,
        key,
        value,
        timestamp: Date.now(),
        provider: provider.name
      });

      return value;
    } catch (error) {
      this.emitEvent({
        type: 'error',
        namespace,
        key,
        timestamp: Date.now(),
        provider: 'unknown',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  async set<T>(namespace: string, key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      const provider = this.getProvider(namespace);
      const namespaceConfig = this.namespaces.get(namespace);
      const namespacedKey = this.getNamespacedKey(namespace, key);

      // Apply namespace policy defaults
      const mergedOptions: StorageOptions = {
        ttl: namespaceConfig?.policy.ttl,
        encrypt: namespaceConfig?.policy.encrypt,
        namespace,
        ...options
      };

      await provider.set(namespacedKey, value, mergedOptions);

      this.emitEvent({
        type: 'set',
        namespace,
        key,
        value,
        timestamp: Date.now(),
        provider: provider.name
      });
    } catch (error) {
      this.emitEvent({
        type: 'error',
        namespace,
        key,
        timestamp: Date.now(),
        provider: 'unknown',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  async delete(namespace: string, key: string): Promise<void> {
    try {
      const provider = this.getProvider(namespace);
      const namespacedKey = this.getNamespacedKey(namespace, key);
      
      await provider.delete(namespacedKey);

      this.emitEvent({
        type: 'delete',
        namespace,
        key,
        timestamp: Date.now(),
        provider: provider.name
      });
    } catch (error) {
      this.emitEvent({
        type: 'error',
        namespace,
        key,
        timestamp: Date.now(),
        provider: 'unknown',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  async clear(namespace: string): Promise<void> {
    try {
      const provider = this.getProvider(namespace);
      const keys = await this.keys(namespace);
      
      for (const key of keys) {
        await this.delete(namespace, key);
      }

      this.emitEvent({
        type: 'clear',
        namespace,
        timestamp: Date.now(),
        provider: provider.name
      });
    } catch (error) {
      this.emitEvent({
        type: 'error',
        namespace,
        timestamp: Date.now(),
        provider: 'unknown',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  async keys(namespace: string): Promise<string[]> {
    try {
      const provider = this.getProvider(namespace);
      console.log(`🔧 UnifiedStorage: Getting keys for namespace '${namespace}' using provider: ${provider.name || 'unknown'}`);
      
      const allKeys = await provider.keys();
      console.log(`🔧 UnifiedStorage: Provider returned ${allKeys.length} keys:`, allKeys);
      
      const namespacePrefix = `${namespace}.`;
      console.log(`🔧 UnifiedStorage: Filtering keys with prefix: '${namespacePrefix}'`);
      
      const filteredKeys = allKeys
        .filter(key => key.startsWith(namespacePrefix))
        .map(key => key.substring(namespacePrefix.length));
        
      console.log(`🔧 UnifiedStorage: Filtered to ${filteredKeys.length} keys:`, filteredKeys);
      return filteredKeys;
    } catch (error) {
      console.error(`Error getting keys for namespace ${namespace}:`, error);
      return [];
    }
  }

  async size(namespace: string): Promise<number> {
    try {
      const keys = await this.keys(namespace);
      return keys.length;
    } catch (error) {
      console.error(`Error getting size for namespace ${namespace}:`, error);
      return 0;
    }
  }

  // Event system
  addEventListener(listener: (event: StorageEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  // Utility methods
  getNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }

  getNamespaceConfig(namespace: string): StorageNamespace | undefined {
    return this.namespaces.get(namespace);
  }

  async getProviderHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        health[name] = await provider.isAvailable();
      } catch {
        health[name] = false;
      }
    }
    
    return health;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get multiple values by keys (for backward compatibility)
   */
  async getMany<T>(namespace: string, keys: string[]): Promise<T[]> {
    try {
      const results: T[] = [];
      for (const key of keys) {
        const value = await this.get<T>(namespace, key);
        if (value !== null) {
          results.push(value);
        }
      }
      return results;
    } catch (error) {
      console.error('Error in getMany:', error);
      return [];
    }
  }

  /**
   * Initialize method for backward compatibility
   */
  async initialize(): Promise<void> {
    // Already initialized in constructor, but provide method for compatibility
    if (!this.isInitialized) {
      this.loadNamespaces();
    }
  }

  /**
   * Store method (alias for set for backward compatibility)
   */
  async store<T>(namespace: string, key: string, value: T): Promise<void> {
    return this.set(namespace, key, value);
  }
}

// Singleton instance
export const unifiedStorage = UnifiedStorageService.getInstance();

