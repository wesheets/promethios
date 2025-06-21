import { StorageProvider, StoragePolicy } from './types';

/**
 * Memory Storage Provider
 * Fast in-memory storage with TTL support
 */
export class MemoryStorageProvider implements StorageProvider {
  name = 'memory';
  private storage = new Map<string, any>();
  private ttls = new Map<string, number>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanup();
  }

  async isAvailable(): Promise<boolean> {
    return true; // Memory is always available
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check TTL
      const expiry = this.ttls.get(key);
      if (expiry && Date.now() > expiry) {
        await this.delete(key);
        return null;
      }

      return this.storage.get(key) || null;
    } catch (error) {
      console.error('Memory storage get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, policy?: StoragePolicy): Promise<void> {
    try {
      this.storage.set(key, value);
      
      // Set TTL if specified
      if (policy?.ttl) {
        const expiry = Date.now() + policy.ttl;
        this.ttls.set(key, expiry);
      }
    } catch (error) {
      console.error('Memory storage set error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.storage.delete(key);
      this.ttls.delete(key);
    } catch (error) {
      console.error('Memory storage delete error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clear();
      this.ttls.clear();
    } catch (error) {
      console.error('Memory storage clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Array.from(this.storage.keys());
    } catch (error) {
      console.error('Memory storage keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      // Estimate size based on JSON serialization
      let totalSize = 0;
      for (const [key, value] of this.storage.entries()) {
        totalSize += key.length + JSON.stringify(value).length;
      }
      return totalSize;
    } catch (error) {
      console.error('Memory storage size error:', error);
      return 0;
    }
  }

  private startCleanup(): void {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const keysToDelete = [];

      for (const [key, expiry] of this.ttls.entries()) {
        if (now > expiry) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        await this.delete(key);
      }
    } catch (error) {
      console.error('Memory storage cleanup error:', error);
    }
  }

  // Cleanup on destruction
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.storage.clear();
    this.ttls.clear();
  }
}

