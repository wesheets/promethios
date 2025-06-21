import { StorageProvider } from '../types/storage';

/**
 * In-memory implementation of the StorageProvider interface.
 * Useful for testing, temporary data, and fallback scenarios.
 */
export class MemoryStorageProvider implements StorageProvider {
  private storage: Map<string, {
    data: any;
    timestamp: number;
    ttl?: number;
  }> = new Map();
  
  private prefix: string;
  
  constructor(prefix: string = 'memory_') {
    this.prefix = prefix;
  }
  
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
  
  private isExpired(item: { ttl?: number }): boolean {
    return item.ttl !== undefined && Date.now() > item.ttl;
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.storage.get(this.getKey(key));
      
      if (!item) {
        return null;
      }
      
      if (this.isExpired(item)) {
        await this.delete(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error(`MemoryStorageProvider.get error for key ${key}:`, error);
      return null;
    }
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const item = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : undefined
      };
      
      this.storage.set(this.getKey(key), item);
      return true;
    } catch (error) {
      console.error(`MemoryStorageProvider.set error for key ${key}:`, error);
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    try {
      return this.storage.delete(this.getKey(key));
    } catch (error) {
      console.error(`MemoryStorageProvider.delete error for key ${key}:`, error);
      return false;
    }
  }
  
  async clear(): Promise<boolean> {
    try {
      const keys = Array.from(this.storage.keys())
        .filter(key => key.startsWith(this.prefix));
      
      for (const key of keys) {
        this.storage.delete(key);
      }
      
      return true;
    } catch (error) {
      console.error('MemoryStorageProvider.clear error:', error);
      return false;
    }
  }
  
  async keys(): Promise<string[]> {
    try {
      return Array.from(this.storage.keys())
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('MemoryStorageProvider.keys error:', error);
      return [];
    }
  }
  
  async has(key: string): Promise<boolean> {
    try {
      const item = this.storage.get(this.getKey(key));
      return item !== undefined && !this.isExpired(item);
    } catch (error) {
      console.error(`MemoryStorageProvider.has error for key ${key}:`, error);
      return false;
    }
  }
  
  async size(): Promise<number> {
    try {
      const keys = await this.keys();
      return keys.length;
    } catch (error) {
      console.error('MemoryStorageProvider.size error:', error);
      return 0;
    }
  }
  
  // Cleanup expired items
  async cleanup(): Promise<number> {
    let cleaned = 0;
    
    try {
      for (const [key, item] of this.storage.entries()) {
        if (this.isExpired(item)) {
          this.storage.delete(key);
          cleaned++;
        }
      }
    } catch (error) {
      console.error('MemoryStorageProvider.cleanup error:', error);
    }
    
    return cleaned;
  }
  
  // Admin panel integration methods
  async getProviderStatus(): Promise<{
    name: string;
    available: boolean;
    healthy: boolean;
    lastError?: string;
    metrics: {
      totalKeys: number;
      storageUsed: number;
      storageAvailable: number;
    };
  }> {
    try {
      const keys = await this.keys();
      
      // Estimate memory usage
      let storageUsed = 0;
      for (const [key, item] of this.storage.entries()) {
        if (key.startsWith(this.prefix)) {
          storageUsed += JSON.stringify(item).length + key.length;
        }
      }
      
      // Memory storage is virtually unlimited but let's set a reasonable limit
      const storageLimit = 100 * 1024 * 1024; // 100MB
      
      return {
        name: 'memory',
        available: true,
        healthy: true,
        metrics: {
          totalKeys: keys.length,
          storageUsed,
          storageAvailable: storageLimit - storageUsed
        }
      };
    } catch (error) {
      return {
        name: 'memory',
        available: false,
        healthy: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          totalKeys: 0,
          storageUsed: 0,
          storageAvailable: 0
        }
      };
    }
  }
  
  async getNamespaceInfo(): Promise<Array<{
    namespace: string;
    keyCount: number;
    estimatedSize: number;
    lastAccessed?: number;
  }>> {
    try {
      const keys = await this.keys();
      const namespaces = new Map<string, {
        keyCount: number;
        estimatedSize: number;
        lastAccessed?: number;
      }>();
      
      for (const key of keys) {
        const namespace = key.split('.')[0];
        const item = this.storage.get(this.getKey(key));
        
        if (!item) continue;
        
        const size = JSON.stringify(item).length;
        
        if (!namespaces.has(namespace)) {
          namespaces.set(namespace, {
            keyCount: 0,
            estimatedSize: 0
          });
        }
        
        const nsInfo = namespaces.get(namespace)!;
        nsInfo.keyCount++;
        nsInfo.estimatedSize += size;
        nsInfo.lastAccessed = Math.max(nsInfo.lastAccessed || 0, item.timestamp);
      }
      
      return Array.from(namespaces.entries()).map(([namespace, info]) => ({
        namespace,
        ...info
      }));
    } catch (error) {
      console.error('MemoryStorageProvider.getNamespaceInfo error:', error);
      return [];
    }
  }
  
  // Development/testing utilities
  async dump(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const [key, item] of this.storage.entries()) {
      if (key.startsWith(this.prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        result[cleanKey] = {
          data: item.data,
          timestamp: item.timestamp,
          ttl: item.ttl,
          expired: this.isExpired(item)
        };
      }
    }
    
    return result;
  }
  
  async load(data: Record<string, any>): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && 'data' in value) {
          this.storage.set(this.getKey(key), {
            data: value.data,
            timestamp: value.timestamp || Date.now(),
            ttl: value.ttl
          });
        } else {
          await this.set(key, value);
        }
      }
      return true;
    } catch (error) {
      console.error('MemoryStorageProvider.load error:', error);
      return false;
    }
  }
}

