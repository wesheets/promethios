/**
 * Storage Extension Tests
 * 
 * Simplified tests for the storage extension without complex extension framework
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageExtension, storageExtension } from '../extensions/StorageExtension';

// Mock the unified storage service
vi.mock('../services/UnifiedStorageService', () => ({
  unifiedStorage: {
    initialize: vi.fn().mockResolvedValue(true),
    set: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue('test-value'),
    delete: vi.fn().mockResolvedValue(true)
  }
}));

describe('StorageExtension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StorageExtension.getInstance();
      const instance2 = StorageExtension.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported singleton', () => {
      const instance = StorageExtension.getInstance();
      expect(instance).toBe(storageExtension);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await storageExtension.initialize();
      expect(result).toBe(true);
      expect(storageExtension.isInitialized()).toBe(true);
    });

    it('should return true if already initialized', async () => {
      await storageExtension.initialize();
      const result = await storageExtension.initialize();
      expect(result).toBe(true);
    });
  });

  describe('Extension Points', () => {
    beforeEach(async () => {
      await storageExtension.initialize();
    });

    it('should execute beforeSet extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await storageExtension.beforeSet('test-namespace', 'test-key', 'test-value');
      
      expect(consoleSpy).toHaveBeenCalledWith('Before set: test-namespace:test-key');
      consoleSpy.mockRestore();
    });

    it('should execute afterSet extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await storageExtension.afterSet('test-namespace', 'test-key', 'test-value');
      
      expect(consoleSpy).toHaveBeenCalledWith('After set: test-namespace:test-key');
      consoleSpy.mockRestore();
    });

    it('should execute beforeGet extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await storageExtension.beforeGet('test-namespace', 'test-key');
      
      expect(consoleSpy).toHaveBeenCalledWith('Before get: test-namespace:test-key');
      consoleSpy.mockRestore();
    });

    it('should execute afterGet extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await storageExtension.afterGet('test-namespace', 'test-key', 'test-value');
      
      expect(consoleSpy).toHaveBeenCalledWith('After get: test-namespace:test-key');
      consoleSpy.mockRestore();
    });

    it('should execute beforeDelete extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await storageExtension.beforeDelete('test-namespace', 'test-key');
      
      expect(consoleSpy).toHaveBeenCalledWith('Before delete: test-namespace:test-key');
      consoleSpy.mockRestore();
    });

    it('should execute afterDelete extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await storageExtension.afterDelete('test-namespace', 'test-key');
      
      expect(consoleSpy).toHaveBeenCalledWith('After delete: test-namespace:test-key');
      consoleSpy.mockRestore();
    });

    it('should handle errors in onError extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error');
      
      await storageExtension.onError(testError, 'test-operation', 'test-namespace', 'test-key');
      
      expect(consoleSpy).toHaveBeenCalledWith('Storage error in test-operation for test-namespace:test-key:', testError);
      consoleSpy.mockRestore();
    });

    it('should handle metrics in onMetrics extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const testMetrics = { operations: 10, errors: 0, performance: { avgResponseTime: 100 } };
      
      await storageExtension.onMetrics(testMetrics);
      
      expect(consoleSpy).toHaveBeenCalledWith('Storage metrics:', testMetrics);
      consoleSpy.mockRestore();
    });
  });

  describe('Utility Methods', () => {
    it('should return the storage service', () => {
      const service = storageExtension.getStorageService();
      expect(service).toBeDefined();
    });

    it('should return initialization status', async () => {
      expect(storageExtension.isInitialized()).toBe(false);
      await storageExtension.initialize();
      expect(storageExtension.isInitialized()).toBe(true);
    });
  });
});

