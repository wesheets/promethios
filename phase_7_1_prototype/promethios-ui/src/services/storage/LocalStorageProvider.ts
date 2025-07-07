import { StorageProvider, StorageOptions } from './types';

export class LocalStorageProvider implements StorageProvider {
  name = 'localStorage';
  private prefix: string;

  constructor(prefix = 'promethios_') {
    this.prefix = prefix;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const testKey = `${this.prefix}test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = `${this.prefix}${key}`;
      const item = localStorage.getItem(fullKey);
      
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check TTL
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        await this.delete(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error(`LocalStorageProvider.get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      const fullKey = `${this.prefix}${key}`;
      const item = {
        value,
        timestamp: Date.now(),
        expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
        metadata: options?.metadata
      };

      localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (error) {
      console.error(`LocalStorageProvider.set error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = `${this.prefix}${key}`;
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`LocalStorageProvider.delete error for key ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys();
      for (const key of keys) {
        await this.delete(key);
      }
    } catch (error) {
      console.error('LocalStorageProvider.clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      console.log(`📱 LocalStorage: Checking ${localStorage.length} items with prefix: ${this.prefix}`);
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const cleanKey = key.substring(this.prefix.length);
          keys.push(cleanKey);
          console.log(`📱 LocalStorage: Found key: ${cleanKey}`);
        }
      }
      
      console.log(`📱 LocalStorage: Returning ${keys.length} keys`);
      return keys;
    } catch (error) {
      console.error('LocalStorageProvider.keys error:', error);
      return [];
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

  // Cleanup expired items
  async cleanup(): Promise<void> {
    try {
      const keys = await this.keys();
      for (const key of keys) {
        await this.get(key); // This will auto-delete expired items
      }
    } catch (error) {
      console.error('LocalStorageProvider.cleanup error:', error);
    }
  }
}

