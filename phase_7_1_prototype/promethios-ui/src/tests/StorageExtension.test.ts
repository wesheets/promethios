import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageExtension } from '../extensions/StorageExtension';
import { ExtensionRegistry } from '../core/governance/extension_point_framework';

// Mock the UnifiedStorageService
vi.mock('../services/UnifiedStorageService', () => ({
  unifiedStorage: {
    isReady: vi.fn(() => true),
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    keys: vi.fn(() => Promise.resolve([])),
    size: vi.fn(() => Promise.resolve(0)),
    addEventListener: vi.fn(() => () => {}),
    getNamespaces: vi.fn(() => ['user', 'observer', 'governance']),
    getNamespaceConfig: vi.fn(),
    getProviderHealth: vi.fn(() => Promise.resolve({
      localStorage: true,
      memory: true,
      firebase: false
    }))
  }
}));

// Mock the ExtensionRegistry
vi.mock('../core/governance/extension_point_framework', () => ({
  ExtensionRegistry: {
    getInstance: vi.fn(() => ({
      registerExtensionPoint: vi.fn(),
      registerExtension: vi.fn(),
      executeExtensionPoint: vi.fn()
    }))
  },
  ExtensionPoint: vi.fn()
}));

describe('StorageExtension', () => {
  let storageExtension: StorageExtension;
  let mockExtensionRegistry: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get mock registry
    mockExtensionRegistry = ExtensionRegistry.getInstance();
    
    // Create new instance
    storageExtension = new StorageExtension();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be a singleton', () => {
      const instance1 = StorageExtension.getInstance();
      const instance2 = StorageExtension.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should register extension points during construction', () => {
      expect(mockExtensionRegistry.registerExtensionPoint).toHaveBeenCalledTimes(8);
      
      // Check that all expected extension points are registered
      const expectedExtensionPoints = [
        'storage.beforeSet',
        'storage.afterSet',
        'storage.beforeGet',
        'storage.afterGet',
        'storage.beforeDelete',
        'storage.afterDelete',
        'storage.onError',
        'storage.onMetrics'
      ];

      expectedExtensionPoints.forEach(pointName => {
        expect(mockExtensionRegistry.registerExtensionPoint).toHaveBeenCalledWith(
          expect.objectContaining({
            name: pointName
          })
        );
      });
    });

    it('should initialize successfully', async () => {
      await expect(storageExtension.initialize()).resolves.not.toThrow();
      expect(mockExtensionRegistry.registerExtension).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'unified-storage',
          name: 'Unified Storage System',
          version: '1.0.0'
        })
      );
    });

    it('should not initialize twice', async () => {
      await storageExtension.initialize();
      await storageExtension.initialize();
      
      // Should only register extension once
      expect(mockExtensionRegistry.registerExtension).toHaveBeenCalledTimes(1);
    });
  });

  describe('Storage Operations with Extension Points', () => {
    beforeEach(async () => {
      await storageExtension.initialize();
    });

    it('should execute before and after extension points for get operations', async () => {
      const namespace = 'user';
      const key = 'profile';
      
      await storageExtension.get(namespace, key);

      expect(mockExtensionRegistry.executeExtensionPoint).toHaveBeenCalledWith(
        'storage.beforeGet',
        { namespace, key }
      );
      
      expect(mockExtensionRegistry.executeExtensionPoint).toHaveBeenCalledWith(
        'storage.afterGet',
        expect.objectContaining({ namespace, key })
      );
    });

    it('should execute before and after extension points for set operations', async () => {
      const namespace = 'user';
      const key = 'profile';
      const value = { name: 'Test User' };
      const options = { ttl: 3600000 };
      
      await storageExtension.set(namespace, key, value, options);

      expect(mockExtensionRegistry.executeExtensionPoint).toHaveBeenCalledWith(
        'storage.beforeSet',
        { namespace, key, value, options }
      );
      
      expect(mockExtensionRegistry.executeExtensionPoint).toHaveBeenCalledWith(
        'storage.afterSet',
        expect.objectContaining({ namespace, key, value, options, result: 'success' })
      );
    });

    it('should execute before and after extension points for delete operations', async () => {
      const namespace = 'user';
      const key = 'profile';
      
      await storageExtension.delete(namespace, key);

      expect(mockExtensionRegistry.executeExtensionPoint).toHaveBeenCalledWith(
        'storage.beforeDelete',
        { namespace, key }
      );
      
      expect(mockExtensionRegistry.executeExtensionPoint).toHaveBeenCalledWith(
        'storage.afterDelete',
        { namespace, key }
      );
    });

    it('should execute error extension point when operations fail', async () => {
      const namespace = 'user';
      const key = 'profile';
      const error = new Error('Storage operation failed');
      
      // Mock the storage service to throw an error
      const { unifiedStorage } = await import('../services/UnifiedStorageService');
      vi.mocked(unifiedStorage.get).mockRejectedValueOnce(error);
      
      await expect(storageExtension.get(namespace, key)).rejects.toThrow();

      expect(mockExtensionRegistry.executeExtensionPoint).toHaveBeenCalledWith(
        'storage.onError',
        expect.objectContaining({
          namespace,
          key,
          operation: 'get',
          error: error.message
        })
      );
    });
  });

  describe('Backward Compatibility', () => {
    beforeEach(async () => {
      await storageExtension.initialize();
    });

    it('should provide access to underlying storage service', () => {
      const service = storageExtension.getStorageService();
      expect(service).toBeDefined();
    });

    it('should provide namespace information', () => {
      const namespaces = storageExtension.getNamespaces();
      expect(Array.isArray(namespaces)).toBe(true);
      expect(namespaces).toContain('user');
      expect(namespaces).toContain('observer');
      expect(namespaces).toContain('governance');
    });

    it('should provide provider health information', async () => {
      const health = await storageExtension.getProviderHealth();
      expect(health).toEqual({
        localStorage: true,
        memory: true,
        firebase: false
      });
    });

    it('should support event listeners', () => {
      const listener = vi.fn();
      const removeListener = storageExtension.addEventListener(listener);
      
      expect(typeof removeListener).toBe('function');
      
      // Test removal
      removeListener();
      // Listener should be removed (tested indirectly through no calls)
    });
  });

  describe('Metrics and Monitoring', () => {
    beforeEach(async () => {
      await storageExtension.initialize();
    });

    it('should generate metrics for all namespaces', async () => {
      const metrics = await storageExtension.getMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      // Check metrics structure
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('provider');
        expect(metric).toHaveProperty('namespace');
        expect(metric).toHaveProperty('operations');
        expect(metric).toHaveProperty('performance');
        expect(metric).toHaveProperty('storage');
      });
    });

    it('should execute metrics extension point when generating metrics', async () => {
      await storageExtension.getMetrics();
      
      expect(mockExtensionRegistry.executeExtensionPoint).toHaveBeenCalledWith(
        'storage.onMetrics',
        expect.objectContaining({
          metrics: expect.any(Array)
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await storageExtension.initialize();
    });

    it('should handle extension point execution errors gracefully', async () => {
      // Mock extension point to throw error
      mockExtensionRegistry.executeExtensionPoint.mockRejectedValueOnce(
        new Error('Extension point failed')
      );
      
      // Operation should still complete despite extension point error
      await expect(storageExtension.get('user', 'profile')).resolves.not.toThrow();
    });

    it('should handle storage service errors and propagate them', async () => {
      const error = new Error('Storage service error');
      const { unifiedStorage } = await import('../services/UnifiedStorageService');
      vi.mocked(unifiedStorage.set).mockRejectedValueOnce(error);
      
      await expect(storageExtension.set('user', 'profile', {})).rejects.toThrow(error);
    });
  });

  describe('Extension System Integration', () => {
    it('should register with proper extension metadata', async () => {
      await storageExtension.initialize();
      
      expect(mockExtensionRegistry.registerExtension).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'unified-storage',
          name: 'Unified Storage System',
          version: '1.0.0',
          description: expect.stringContaining('unified storage'),
          extensionPoints: expect.arrayContaining([
            'storage.beforeSet',
            'storage.afterSet',
            'storage.beforeGet',
            'storage.afterGet',
            'storage.beforeDelete',
            'storage.afterDelete',
            'storage.onError',
            'storage.onMetrics'
          ]),
          dependencies: [],
          initialize: expect.any(Function),
          cleanup: expect.any(Function)
        })
      );
    });
  });
});

