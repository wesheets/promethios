import { StorageProvider, StoragePolicy } from './types';

/**
 * LocalStorage implementation of the StorageProvider interface
 * Provides browser localStorage persistence with policy enforcement
 */
export class LocalStorageProvider implements StorageProvider {
  private subscriptions = new Map<string, Set<(value: any) => void>>();
  private subscriptionCounter = 0;

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      
      const parsed = JSON.parse(item);
      
      // Check if item has expired
      if (parsed.expiry && Date.now() > parsed.expiry) {
        await this.delete(key);
        return null;
      }
      
      return parsed.value;
    } catch (error) {
      console.error(`LocalStorageProvider: Error getting key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, policy?: StoragePolicy): Promise<boolean> {
    try {
      // Validate policy constraints
      if (policy?.forbiddenProviders?.includes('localStorage')) {
        throw new Error(`Policy violation: ${key} cannot be stored in localStorage`);
      }

      // Prepare storage object
      const storageObject: any = { value };
      
      // Apply TTL if specified
      if (policy?.ttl) {
        storageObject.expiry = Date.now() + policy.ttl;
      }

      // Apply encryption if required (basic implementation)
      if (policy?.encryption) {
        console.warn(`LocalStorageProvider: Encryption requested for ${key} but not implemented`);
        // TODO: Implement encryption for sensitive data
      }

      localStorage.setItem(key, JSON.stringify(storageObject));
      
      // Notify subscribers
      this.notifySubscribers(key, value);
      
      return true;
    } catch (error) {
      console.error(`LocalStorageProvider: Error setting key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(key);
      this.notifySubscribers(key, null);
      return true;
    } catch (error) {
      console.error(`LocalStorageProvider: Error deleting key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      localStorage.clear();
      // Notify all subscribers
      this.subscriptions.forEach((callbacks, key) => {
        callbacks.forEach(callback => callback(null));
      });
      return true;
    } catch (error) {
      console.error('LocalStorageProvider: Error clearing storage:', error);
      return false;
    }
  }

  subscribe(key: string, callback: (value: any) => void): string {
    const subscriptionId = `localStorage_${this.subscriptionCounter++}`;
    
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
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = await this.get(key);
          if (value !== null) {
            // Remove namespace prefix from key
            const shortKey = key.substring(prefix.length);
            result[shortKey] = value;
          }
        }
      }
    } catch (error) {
      console.error(`LocalStorageProvider: Error getting namespace ${namespace}:`, error);
    }
    
    return result;
  }

  async clearNamespace(namespace: string): Promise<boolean> {
    const prefix = `${namespace}.`;
    const keysToDelete: string[] = [];
    
    try {
      // Collect keys to delete
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      }
      
      // Delete collected keys
      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
        this.notifySubscribers(key, null);
      });
      
      return true;
    } catch (error) {
      console.error(`LocalStorageProvider: Error clearing namespace ${namespace}:`, error);
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
      // Calculate storage usage
      let usage = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            usage += key.length + value.length;
          }
        }
      }

      // Estimate quota (localStorage typically 5-10MB)
      const quota = 5 * 1024 * 1024; // 5MB estimate

      return {
        provider: 'localStorage',
        available: true,
        usage,
        quota
      };
    } catch (error) {
      return {
        provider: 'localStorage',
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
          console.error(`LocalStorageProvider: Error in subscription callback for ${key}:`, error);
        }
      });
    }
  }

  // Cleanup expired items
  async cleanup(): Promise<void> {
    const keysToDelete: string[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              if (parsed.expiry && Date.now() > parsed.expiry) {
                keysToDelete.push(key);
              }
            } catch {
              // Skip non-JSON items
            }
          }
        }
      }
      
      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
        this.notifySubscribers(key, null);
      });
      
      if (keysToDelete.length > 0) {
        console.log(`LocalStorageProvider: Cleaned up ${keysToDelete.length} expired items`);
      }
    } catch (error) {
      console.error('LocalStorageProvider: Error during cleanup:', error);
    }
  }
}

