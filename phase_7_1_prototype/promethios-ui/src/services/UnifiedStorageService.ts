import { StorageProvider } from '../types/storage';
import { LocalStorageProvider } from './LocalStorageProvider';
import { MemoryStorageProvider } from './MemoryStorageProvider';
import { FirebaseStorageProvider } from './FirebaseStorageProvider';

export interface StoragePolicy {
  ttl?: number;
  allowedProviders?: string[];
  forbiddenProviders?: string[];
  encryption?: string;
  syncStrategy?: 'immediate' | 'batched' | 'never';
  conflictResolution?: 'client-wins' | 'server-wins' | 'merge';
  pii?: boolean;
  gdprCategory?: string;
  retentionPeriod?: number;
}

export interface StorageMetrics {
  totalKeys: number;
  storageUsed: number;
  storageAvailable: number;
  lastAccessed?: number;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  healthy: boolean;
  lastError?: string;
  metrics: StorageMetrics;
}

export interface NamespaceInfo {
  namespace: string;
  keyCount: number;
  estimatedSize: number;
  lastAccessed?: number;
}

/**
 * Unified Storage Service for React applications.
 * Provides a single interface for all storage needs with automatic provider selection,
 * fallback handling, and admin monitoring capabilities.
 */
export class UnifiedStorageService {
  private providers: Map<string, StorageProvider> = new Map();
  private policies: Map<string, StoragePolicy> = new Map();
  private subscribers: Map<string, Set<(value: any) => void>> = new Map();
  private isInitialized: boolean = false;
  
  constructor() {
    this.initializeDefaultPolicies();
  }
  
  private initializeDefaultPolicies(): void {
    // Observer Agent data - Critical for session persistence
    this.policies.set('observer.*', {
      allowedProviders: ['localStorage', 'firebase'],
      syncStrategy: 'immediate',
      conflictResolution: 'server-wins', // Server has latest AI state
      retentionPeriod: 90 * 24 * 60 * 60 * 1000 // 90 days
    });
    
    // User authentication data - Firebase only, encrypted
    this.policies.set('user.auth.*', {
      allowedProviders: ['firebase'],
      encryption: 'both',
      syncStrategy: 'immediate',
      gdprCategory: 'essential',
      retentionPeriod: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
    
    // User preferences - Immediate sync, client wins
    this.policies.set('user.preferences.*', {
      allowedProviders: ['localStorage', 'firebase'],
      syncStrategy: 'immediate',
      conflictResolution: 'client-wins',
      gdprCategory: 'functional'
    });
    
    // UI state - Local only, no sync needed
    this.policies.set('ui.*', {
      allowedProviders: ['localStorage', 'memory'],
      forbiddenProviders: ['firebase'],
      syncStrategy: 'never'
    });
    
    // Notifications - Batched sync, encrypted at rest
    this.policies.set('notifications.*', {
      allowedProviders: ['localStorage', 'firebase'],
      ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
      syncStrategy: 'batched',
      encryption: 'at-rest'
    });
    
    // Agent configurations - Immediate sync with merge
    this.policies.set('agents.*', {
      allowedProviders: ['localStorage', 'firebase'],
      syncStrategy: 'immediate',
      conflictResolution: 'merge',
      retentionPeriod: 180 * 24 * 60 * 60 * 1000 // 6 months
    });
    
    // Governance data - Firebase only, encrypted, long retention
    this.policies.set('governance.*', {
      allowedProviders: ['firebase'],
      forbiddenProviders: ['localStorage'],
      encryption: 'both',
      syncStrategy: 'immediate',
      retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years (compliance)
    });
    
    // Trust metrics - Firebase preferred, encrypted
    this.policies.set('trust.*', {
      allowedProviders: ['firebase', 'localStorage'],
      encryption: 'at-rest',
      syncStrategy: 'immediate',
      retentionPeriod: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
    
    // Cache data - Local only, short TTL
    this.policies.set('cache.*', {
      allowedProviders: ['memory', 'localStorage'],
      forbiddenProviders: ['firebase'],
      ttl: 60 * 60 * 1000, // 1 hour
      syncStrategy: 'never'
    });
  }
  
  async initialize(): Promise<boolean> {
    try {
      // Initialize default providers
      this.providers.set('localStorage', new LocalStorageProvider());
      this.providers.set('memory', new MemoryStorageProvider());
      this.providers.set('firebase', new FirebaseStorageProvider());
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('UnifiedStorageService initialization error:', error);
      return false;
    }
  }
  
  registerProvider(name: string, provider: StorageProvider): boolean {
    try {
      this.providers.set(name, provider);
      return true;
    } catch (error) {
      console.error(`Error registering provider ${name}:`, error);
      return false;
    }
  }
  
  private getPolicyForKey(key: string): StoragePolicy {
    // Check for exact match first
    if (this.policies.has(key)) {
      return this.policies.get(key)!;
    }
    
    // Check for wildcard matches
    for (const [pattern, policy] of this.policies.entries()) {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        if (key.startsWith(prefix)) {
          return policy;
        }
      }
    }
    
    // Return default policy
    return {
      allowedProviders: ['localStorage', 'memory'],
      syncStrategy: 'immediate',
      conflictResolution: 'client-wins'
    };
  }
  
  private selectProvider(policy: StoragePolicy): StorageProvider | null {
    const allowed = policy.allowedProviders || ['localStorage', 'memory'];
    const forbidden = policy.forbidden_providers || [];
    
    const candidates = allowed.filter(p => 
      !forbidden.includes(p) && this.providers.has(p)
    );
    
    if (candidates.length === 0) {
      console.warn('No available providers for policy:', policy);
      return null;
    }
    
    // Smart provider selection based on policy
    if (policy.encryption === 'at-rest' && candidates.includes('firebase')) {
      return this.providers.get('firebase')!;
    }
    
    if (policy.syncStrategy === 'never' && candidates.includes('localStorage')) {
      return this.providers.get('localStorage')!;
    }
    
    if (policy.syncStrategy === 'immediate' && candidates.includes('firebase')) {
      return this.providers.get('firebase')!;
    }
    
    // Default to first available
    return this.providers.get(candidates[0])!;
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const policy = this.getPolicyForKey(key);
    const provider = this.selectProvider(policy);
    
    if (!provider) {
      console.error(`No provider available for key: ${key}`);
      return null;
    }
    
    try {
      return await provider.get<T>(key);
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      
      // Try fallback providers
      const allowed = policy.allowedProviders || [];
      for (const providerName of allowed) {
        if (this.providers.has(providerName)) {
          const fallbackProvider = this.providers.get(providerName)!;
          if (fallbackProvider !== provider) {
            try {
              return await fallbackProvider.get<T>(key);
            } catch (fallbackError) {
              console.warn(`Fallback provider ${providerName} also failed:`, fallbackError);
            }
          }
        }
      }
      
      return null;
    }
  }
  
  async set<T>(key: string, value: T): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const policy = this.getPolicyForKey(key);
    const provider = this.selectProvider(policy);
    
    if (!provider) {
      console.error(`No provider available for key: ${key}`);
      return false;
    }
    
    try {
      const result = await provider.set(key, value, policy.ttl);
      
      // Notify subscribers
      this.notifySubscribers(key, value);
      
      return result;
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const policy = this.getPolicyForKey(key);
    const provider = this.selectProvider(policy);
    
    if (!provider) {
      console.error(`No provider available for key: ${key}`);
      return false;
    }
    
    try {
      const result = await provider.delete(key);
      
      // Notify subscribers
      this.notifySubscribers(key, null);
      
      return result;
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }
  
  async getNamespace(namespace: string): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const policy = this.getPolicyForKey(`${namespace}.*`);
    const provider = this.selectProvider(policy);
    
    if (!provider) {
      console.error(`No provider available for namespace: ${namespace}`);
      return {};
    }
    
    try {
      const keys = await provider.keys();
      const namespaceKeys = keys.filter(key => key.startsWith(`${namespace}.`));
      
      const result: Record<string, any> = {};
      for (const key of namespaceKeys) {
        const value = await provider.get(key);
        if (value !== null) {
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error getting namespace ${namespace}:`, error);
      return {};
    }
  }
  
  async clearNamespace(namespace: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const policy = this.getPolicyForKey(`${namespace}.*`);
    const provider = this.selectProvider(policy);
    
    if (!provider) {
      console.error(`No provider available for namespace: ${namespace}`);
      return false;
    }
    
    try {
      const keys = await provider.keys();
      const namespaceKeys = keys.filter(key => key.startsWith(`${namespace}.`));
      
      for (const key of namespaceKeys) {
        await provider.delete(key);
        this.notifySubscribers(key, null);
      }
      
      return true;
    } catch (error) {
      console.error(`Error clearing namespace ${namespace}:`, error);
      return false;
    }
  }
  
  // Subscription management
  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const keySubscribers = this.subscribers.get(key);
      if (keySubscribers) {
        keySubscribers.delete(callback);
        if (keySubscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }
  
  private notifySubscribers(key: string, value: any): void {
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in subscriber callback for key ${key}:`, error);
        }
      });
    }
  }
  
  // Admin panel integration methods
  async getProviderStatuses(): Promise<ProviderStatus[]> {
    const statuses: ProviderStatus[] = [];
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        if ('getProviderStatus' in provider && typeof provider.getProviderStatus === 'function') {
          const status = await (provider as any).getProviderStatus();
          statuses.push(status);
        } else {
          // Fallback status for providers without admin integration
          statuses.push({
            name,
            available: true,
            healthy: true,
            metrics: {
              totalKeys: 0,
              storageUsed: 0,
              storageAvailable: 0
            }
          });
        }
      } catch (error) {
        statuses.push({
          name,
          available: false,
          healthy: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          metrics: {
            totalKeys: 0,
            storageUsed: 0,
            storageAvailable: 0
          }
        });
      }
    }
    
    return statuses;
  }
  
  async getNamespaceInfos(): Promise<NamespaceInfo[]> {
    const allNamespaces = new Map<string, NamespaceInfo>();
    
    for (const [providerName, provider] of this.providers.entries()) {
      try {
        if ('getNamespaceInfo' in provider && typeof provider.getNamespaceInfo === 'function') {
          const namespaces = await (provider as any).getNamespaceInfo();
          
          for (const ns of namespaces) {
            const existing = allNamespaces.get(ns.namespace);
            if (existing) {
              // Merge namespace info from multiple providers
              existing.keyCount += ns.keyCount;
              existing.estimatedSize += ns.estimatedSize;
              existing.lastAccessed = Math.max(
                existing.lastAccessed || 0,
                ns.lastAccessed || 0
              );
            } else {
              allNamespaces.set(ns.namespace, { ...ns });
            }
          }
        }
      } catch (error) {
        console.error(`Error getting namespace info from ${providerName}:`, error);
      }
    }
    
    return Array.from(allNamespaces.values());
  }
  
  async getIntegratedComponents(): Promise<Array<{
    component: string;
    namespace: string;
    status: 'integrated' | 'legacy' | 'migrating';
    provider: string;
    lastAccessed?: number;
  }>> {
    // This would be populated as components are migrated
    // For now, return the components we know about
    const components = [
      {
        component: 'NotificationCenter',
        namespace: 'notifications',
        status: 'integrated' as const,
        provider: 'localStorage',
        lastAccessed: Date.now()
      },
      {
        component: 'ObserverAgent',
        namespace: 'observer',
        status: 'migrating' as const,
        provider: 'localStorage',
        lastAccessed: Date.now()
      },
      {
        component: 'AuthContext',
        namespace: 'user.auth',
        status: 'legacy' as const,
        provider: 'firebase',
        lastAccessed: Date.now()
      },
      {
        component: 'ThemeContext',
        namespace: 'ui.theme',
        status: 'legacy' as const,
        provider: 'localStorage'
      }
    ];
    
    return components;
  }
  
  // Development utilities
  async dumpAllData(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const [providerName, provider] of this.providers.entries()) {
      try {
        if ('dump' in provider && typeof provider.dump === 'function') {
          result[providerName] = await (provider as any).dump();
        } else {
          const keys = await provider.keys();
          const data: Record<string, any> = {};
          
          for (const key of keys) {
            data[key] = await provider.get(key);
          }
          
          result[providerName] = data;
        }
      } catch (error) {
        result[providerName] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    return result;
  }
}

// Singleton instance
export const unifiedStorage = new UnifiedStorageService();

