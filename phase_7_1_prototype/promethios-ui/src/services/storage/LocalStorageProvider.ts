import { StorageProvider, StoragePolicy } from './types';

/**
 * LocalStorage Provider
 * Implements storage using browser's localStorage with TTL support
 */
export class LocalStorageProvider implements StorageProvider {
  name = 'localStorage';
  private ttlPrefix = '__ttl__';

  async isAvailable(): Promise<boolean> {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check TTL first
      const ttlKey = `${this.ttlPrefix}${key}`;
      const ttlValue = localStorage.getItem(ttlKey);
      
      if (ttlValue) {
        const expiry = parseInt(ttlValue);
        if (Date.now() > expiry) {
          // Expired, clean up
          await this.delete(key);
          return null;
        }
      }

      const value = localStorage.getItem(key);
      if (value === null) return null;
      
      return JSON.parse(value);
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, policy?: StoragePolicy): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      
      // Set TTL if specified
      if (policy?.ttl) {
        const expiry = Date.now() + policy.ttl;
        localStorage.setItem(`${this.ttlPrefix}${key}`, expiry.toString());
      }
    } catch (error) {
      console.error('LocalStorage set error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${this.ttlPrefix}${key}`);
    } catch (error) {
      console.error('LocalStorage delete error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith(this.ttlPrefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('LocalStorage keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith(this.ttlPrefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      return totalSize;
    } catch (error) {
      console.error('LocalStorage size error:', error);
      return 0;
    }
  }

  // Clean up expired items
  async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const keysToDelete = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.ttlPrefix)) {
          const expiry = parseInt(localStorage.getItem(key) || '0');
          if (now > expiry) {
            const originalKey = key.substring(this.ttlPrefix.length);
            keysToDelete.push(originalKey);
          }
        }
      }

      for (const key of keysToDelete) {
        await this.delete(key);
      }
    } catch (error) {
      console.error('LocalStorage cleanup error:', error);
    }
  }
}

