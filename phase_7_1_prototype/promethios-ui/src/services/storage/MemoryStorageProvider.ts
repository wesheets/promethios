import { StorageProvider, StorageOptions } from './types';

interface MemoryItem<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
  metadata?: Record<string, any>;
}

export class MemoryStorageProvider implements StorageProvider {
  name = 'memory';
  private storage = new Map<string, MemoryItem<any>>();
  private cleanupInterval?: NodeJS.Timeout;
  private maxSize: number;

  constructor(maxSize = 1000, cleanupIntervalMs = 60000) {
    this.maxSize = maxSize;
    this.startCleanup(cleanupIntervalMs);
  }

  async isAvailable(): Promise<boolean> {
    return true; // Memory storage is always available
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.storage.get(key);
      
      if (!item) return null;

      // Check TTL
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.storage.delete(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error(`MemoryStorageProvider.get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      // Enforce max size by removing oldest items
      if (this.storage.size >= this.maxSize) {
        const oldestKey = this.storage.keys().next().value;
        if (oldestKey) {
          this.storage.delete(oldestKey);
        }
      }

      const item: MemoryItem<T> = {
        value,
        timestamp: Date.now(),
        expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
        metadata: options?.metadata
      };

      this.storage.set(key, item);
    } catch (error) {
      console.error(`MemoryStorageProvider.set error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.storage.delete(key);
    } catch (error) {
      console.error(`MemoryStorageProvider.delete error for key ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('MemoryStorageProvider.clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Array.from(this.storage.keys());
    } catch (error) {
      console.error('MemoryStorageProvider.keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      return this.storage.size;
    } catch (error) {
      console.error('MemoryStorageProvider.size error:', error);
      return 0;
    }
  }

  // Cleanup expired items
  private cleanup(): void {
    try {
      const now = Date.now();
      for (const [key, item] of this.storage.entries()) {
        if (item.expiresAt && now > item.expiresAt) {
          this.storage.delete(key);
        }
      }
    } catch (error) {
      console.error('MemoryStorageProvider.cleanup error:', error);
    }
  }

  private startCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  // Cleanup method for graceful shutdown
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
  }
}

