import { StorageProvider } from '../types/storage';

/**
 * LocalStorage implementation of the StorageProvider interface.
 * Provides synchronous localStorage access with async interface compatibility.
 */
export class LocalStorageProvider implements StorageProvider {
  private prefix: string;
  
  constructor(prefix: string = 'promethios_') {
    this.prefix = prefix;
  }
  
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {
        return null;
      }
      
      const parsed = JSON.parse(item);
      
      // Check for TTL expiration
      if (parsed._ttl && Date.now() > parsed._ttl) {
        await this.delete(key);
        return null;
      }
      
      return parsed._data !== undefined ? parsed._data : parsed;
    } catch (error) {
      console.error(`LocalStorageProvider.get error for key ${key}:`, error);
      return null;
    }
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const data = {
        _data: value,
        _timestamp: Date.now(),
        _ttl: ttl ? Date.now() + ttl : undefined
      };
      
      localStorage.setItem(this.getKey(key), JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`LocalStorageProvider.set error for key ${key}:`, error);
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error(`LocalStorageProvider.delete error for key ${key}:`, error);
      return false;
    }
  }
  
  async clear(): Promise<boolean> {
    try {
      const keys = await this.keys();
      for (const key of keys) {
        await this.delete(key.replace(this.prefix, ''));
      }
      return true;
    } catch (error) {
      console.error('LocalStorageProvider.clear error:', error);
      return false;
    }
  }
  
  async keys(): Promise<string[]> {
    try {
      const allKeys = Object.keys(localStorage);
      return allKeys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('LocalStorageProvider.keys error:', error);
      return [];
    }
  }
  
  async has(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(this.getKey(key)) !== null;
    } catch (error) {
      console.error(`LocalStorageProvider.has error for key ${key}:`, error);
      return false;
    }
  }
  
  async size(): Promise<number> {
    try {
      const keys = await this.keys();
      return keys.length;
    } catch (error) {
      console.error('LocalStorageProvider.size error:', error);
      return 0;
    }
  }
  
  async getStorageInfo(): Promise<{
    used: number;
    available: number;
    total: number;
  }> {
    try {
      // Estimate localStorage usage
      let used = 0;
      for (let key in localStorage) {
        if (key.startsWith(this.prefix)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // localStorage typically has 5-10MB limit
      const total = 10 * 1024 * 1024; // 10MB estimate
      const available = total - used;
      
      return { used, available, total };
    } catch (error) {
      console.error('LocalStorageProvider.getStorageInfo error:', error);
      return { used: 0, available: 0, total: 0 };
    }
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
      const isAvailable = typeof Storage !== 'undefined' && localStorage;
      const keys = await this.keys();
      const storageInfo = await this.getStorageInfo();
      
      return {
        name: 'localStorage',
        available: isAvailable,
        healthy: isAvailable && storageInfo.available > 0,
        metrics: {
          totalKeys: keys.length,
          storageUsed: storageInfo.used,
          storageAvailable: storageInfo.available
        }
      };
    } catch (error) {
      return {
        name: 'localStorage',
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
        const item = localStorage.getItem(this.getKey(key));
        const size = item ? item.length : 0;
        
        if (!namespaces.has(namespace)) {
          namespaces.set(namespace, {
            keyCount: 0,
            estimatedSize: 0
          });
        }
        
        const nsInfo = namespaces.get(namespace)!;
        nsInfo.keyCount++;
        nsInfo.estimatedSize += size;
        
        // Try to get timestamp from stored data
        try {
          const parsed = JSON.parse(item || '{}');
          if (parsed._timestamp) {
            nsInfo.lastAccessed = Math.max(nsInfo.lastAccessed || 0, parsed._timestamp);
          }
        } catch {
          // Ignore parsing errors
        }
      }
      
      return Array.from(namespaces.entries()).map(([namespace, info]) => ({
        namespace,
        ...info
      }));
    } catch (error) {
      console.error('LocalStorageProvider.getNamespaceInfo error:', error);
      return [];
    }
  }
}

