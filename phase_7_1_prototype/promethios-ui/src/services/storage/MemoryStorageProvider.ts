import { StorageProvider, StoragePolicy } from './types';

/**
 * In-memory implementation of the StorageProvider interface
 * Provides fast, temporary storage that doesn't persist across sessions
 * Ideal for development, testing, and temporary data
 */
export class MemoryStorageProvider implements StorageProvider {
  private storage = new Map<string, any>();
  private expirations = new Map<string, number>();
  private subscriptions = new Map<string, Set<(value: any) => void>>();
  private subscriptionCounter = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval for expired items
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check if item has expired
      const expiry = this.expirations.get(key);
      if (expiry && Date.now() > expiry) {
        await this.delete(key);
        return null;
      }
      
      const value = this.storage.get(key);
      return value !== undefined ? value : null;
    } catch (error) {
      console.error(`MemoryStorageProvider: Error getting key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, policy?: StoragePolicy): Promise<boolean> {
    try {
      // Validate policy constraints
      if (policy?.forbiddenProviders?.includes('memory')) {
        throw new Error(`Policy violation: ${key} cannot be stored in memory`);
      }

      this.storage.set(key, value);
      
      // Apply TTL if specified
      if (policy?.ttl) {
        this.expirations.set(key, Date.now() + policy.ttl);
      } else {
        this.expirations.delete(key);
      }

      // Note: Memory storage doesn't support encryption
      if (policy?.encryption) {
        console.warn(`MemoryStorageProvider: Encryption requested for ${key} but not supported in memory storage`);
      }
      
      // Notify subscribers
      this.notifySubscribers(key, value);
      
      return true;
    } catch (error) {
      console.error(`MemoryStorageProvider: Error setting key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const existed = this.storage.has(key);
      this.storage.delete(key);
      this.expirations.delete(key);
      
      if (existed) {
        this.notifySubscribers(key, null);
      }
      
      return true;
    } catch (error) {
      console.error(`MemoryStorageProvider: Error deleting key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      // Notify all subscribers before clearing
      this.storage.forEach((value, key) => {
        this.notifySubscribers(key, null);
      });
      
      this.storage.clear();
      this.expirations.clear();
      
      return true;
    } catch (error) {
      console.error('MemoryStorageProvider: Error clearing storage:', error);
      return false;
    }
  }

  subscribe(key: string, callback: (value: any) => void): string {
    const subscriptionId = `memory_${this.subscriptionCounter++}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key)!.add(callback);
    
    // Store subscription ID for cleanup
    (callback as any).__subscriptionId = subscriptionId;
    
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.forEach((callbacks, key) => {
      callbacks.forEach(callback => {
        if ((callback as any).__subscriptionId === subscriptionId) {
          callbacks.delete(callback);
        }
      });
      
      // Clean up empty subscription sets
      if (callbacks.size === 0) {
        this.subscriptions.delete(key);
      }
    });
  }

  async getNamespace(namespace: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const prefix = `${namespace}.`;
    
    try {
      this.storage.forEach((value, key) => {
        if (key.startsWith(prefix)) {
          // Check if item has expired
          const expiry = this.expirations.get(key);
          if (!expiry || Date.now() <= expiry) {
            // Remove namespace prefix from key
            const shortKey = key.substring(prefix.length);
            result[shortKey] = value;
          }
        }
      });
    } catch (error) {
      console.error(`MemoryStorageProvider: Error getting namespace ${namespace}:`, error);
    }
    
    return result;
  }

  async clearNamespace(namespace: string): Promise<boolean> {
    const prefix = `${namespace}.`;
    const keysToDelete: string[] = [];
    
    try {
      // Collect keys to delete
      this.storage.forEach((value, key) => {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      });
      
      // Delete collected keys
      keysToDelete.forEach(key => {
        this.storage.delete(key);
        this.expirations.delete(key);
        this.notifySubscribers(key, null);
      });
      
      return true;
    } catch (error) {
      console.error(`MemoryStorageProvider: Error clearing namespace ${namespace}:`, error);
      return false;
    }
  }

  async getStorageInfo(): Promise<{
    provider: string;
    available: boolean;
    usage?: number;
    quota?: number;
  }> {
    try {
      // Calculate approximate memory usage
      let usage = 0;
      this.storage.forEach((value, key) => {
        // Rough estimation of memory usage
        usage += key.length * 2; // UTF-16 characters
        usage += JSON.stringify(value).length * 2;
      });

      return {
        provider: 'memory',
        available: true,
        usage,
        quota: undefined // No hard quota for memory storage
      };
    } catch (error) {
      return {
        provider: 'memory',
        available: false
      };
    }
  }

  private notifySubscribers(key: string, value: any): void {
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`MemoryStorageProvider: Error in subscription callback for ${key}:`, error);
        }
      });
    }
  }

  // Cleanup expired items
  async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    try {
      this.expirations.forEach((expiry, key) => {
        if (now > expiry) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.storage.delete(key);
        this.expirations.delete(key);
        this.notifySubscribers(key, null);
      });
      
      if (keysToDelete.length > 0) {
        console.log(`MemoryStorageProvider: Cleaned up ${keysToDelete.length} expired items`);
      }
    } catch (error) {
      console.error('MemoryStorageProvider: Error during cleanup:', error);
    }
  }

  // Get all keys (useful for debugging)
  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  // Get storage size
  getSize(): number {
    return this.storage.size;
  }

  // Destroy the provider and clean up resources
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.storage.clear();
    this.expirations.clear();
    this.subscriptions.clear();
  }
}

