/**
 * Storage Extension for Promethios
 * 
 * Simplified version that provides storage functionality without complex extension framework
 */

import { UnifiedStorageService, unifiedStorage } from '../services/UnifiedStorageService';
import { StorageEvent, StorageMetrics } from '../services/storage/types';

/**
 * Storage Extension Class
 * Provides storage-related functionality as a simple service
 */
export class StorageExtension {
  private static instance: StorageExtension;
  private initialized = false;

  private constructor() {}

  static getInstance(): StorageExtension {
    if (!StorageExtension.instance) {
      StorageExtension.instance = new StorageExtension();
    }
    return StorageExtension.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // Initialize unified storage service
      await unifiedStorage.initialize();
      this.initialized = true;
      console.log('StorageExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize StorageExtension:', error);
      return false;
    }
  }

  // Storage operations
  async beforeSet(namespace: string, key: string, value: any): Promise<void> {
    // Extension point for before set operations
    console.log(`Before set: ${namespace}:${key}`);
  }

  async afterSet(namespace: string, key: string, value: any): Promise<void> {
    // Extension point for after set operations
    console.log(`After set: ${namespace}:${key}`);
  }

  async beforeGet(namespace: string, key: string): Promise<void> {
    // Extension point for before get operations
    console.log(`Before get: ${namespace}:${key}`);
  }

  async afterGet(namespace: string, key: string, value: any): Promise<void> {
    // Extension point for after get operations
    console.log(`After get: ${namespace}:${key}`);
  }

  async beforeDelete(namespace: string, key: string): Promise<void> {
    // Extension point for before delete operations
    console.log(`Before delete: ${namespace}:${key}`);
  }

  async afterDelete(namespace: string, key: string): Promise<void> {
    // Extension point for after delete operations
    console.log(`After delete: ${namespace}:${key}`);
  }

  async onError(error: Error, operation: string, namespace: string, key?: string): Promise<void> {
    // Extension point for error handling
    console.error(`Storage error in ${operation} for ${namespace}:${key}:`, error);
  }

  async onMetrics(metrics: StorageMetrics): Promise<void> {
    // Extension point for metrics collection
    console.log('Storage metrics:', metrics);
  }

  // Utility methods
  getStorageService(): UnifiedStorageService {
    return unifiedStorage;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const storageExtension = StorageExtension.getInstance();

