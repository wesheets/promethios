import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManifestService } from '../services/StorageManifestService';
import { StoragePolicy } from '../services/storage/types';

// Mock the storage manifest
vi.mock('../config/storage_manifest.json', () => ({
  default: {
    user: {
      provider: 'firebase',
      fallback: 'localStorage',
      ttl: 31536000000,
      encrypt: true,
      sync: 'immediate',
      conflictResolution: 'server-wins',
      retention: '1y',
      compliance: ['GDPR'],
      description: 'User profile data, preferences, and settings'
    },
    observer: {
      provider: 'firebase',
      fallback: 'localStorage',
      ttl: 86400000,
      encrypt: false,
      sync: 'immediate',
      conflictResolution: 'server-wins',
      retention: '30d',
      compliance: [],
      description: 'Observer agent conversations and insights'
    },
    governance: {
      provider: 'firebase',
      fallback: 'localStorage',
      ttl: 220752000000,
      encrypt: true,
      sync: 'immediate',
      conflictResolution: 'server-wins',
      retention: '7y',
      compliance: ['GDPR', 'HIPAA', 'SOX'],
      description: 'Governance policies, violations, and compliance data'
    },
    notifications: {
      provider: 'localStorage',
      fallback: 'memory',
      ttl: 2592000000,
      encrypt: false,
      sync: 'batched',
      conflictResolution: 'client-wins',
      retention: '30d',
      compliance: [],
      description: 'User notifications and alerts'
    }
  }
}));

describe('StorageManifestService', () => {
  let manifestService: StorageManifestService;

  beforeEach(() => {
    manifestService = new StorageManifestService();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StorageManifestService.getInstance();
      const instance2 = StorageManifestService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Namespace Management', () => {
    it('should load all namespaces from manifest', () => {
      const namespaces = manifestService.getAllNamespaces();
      expect(namespaces).toHaveLength(4);
      
      const namespaceNames = manifestService.getNamespaceNames();
      expect(namespaceNames).toContain('user');
      expect(namespaceNames).toContain('observer');
      expect(namespaceNames).toContain('governance');
      expect(namespaceNames).toContain('notifications');
    });

    it('should retrieve specific namespace configuration', () => {
      const userNamespace = manifestService.getNamespace('user');
      expect(userNamespace).toBeDefined();
      expect(userNamespace?.name).toBe('user');
      expect(userNamespace?.policy.provider).toBe('firebase');
      expect(userNamespace?.policy.encrypt).toBe(true);
    });

    it('should return undefined for non-existent namespace', () => {
      const nonExistent = manifestService.getNamespace('non-existent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should validate valid namespace configuration', () => {
      const validPolicy: StoragePolicy = {
        provider: 'localStorage',
        fallback: 'memory',
        ttl: 3600000,
        encrypt: false,
        sync: 'immediate',
        conflictResolution: 'client-wins',
        retention: '1h',
        compliance: []
      };

      const result = manifestService.validateNamespace('test', validPolicy);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidPolicy = {} as StoragePolicy;
      
      const result = manifestService.validateNamespace('test', invalidPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider is required');
    });

    it('should detect invalid provider', () => {
      const invalidPolicy: StoragePolicy = {
        provider: 'invalid' as any,
        fallback: 'localStorage',
        ttl: 3600000,
        encrypt: false,
        sync: 'immediate',
        conflictResolution: 'client-wins',
        retention: '1h',
        compliance: []
      };

      const result = manifestService.validateNamespace('test', invalidPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider must be one of: localStorage, memory, firebase');
    });

    it('should enforce encryption for governance namespace', () => {
      const governancePolicy: StoragePolicy = {
        provider: 'firebase',
        fallback: 'localStorage',
        ttl: 220752000000,
        encrypt: false, // This should trigger an error
        sync: 'immediate',
        conflictResolution: 'server-wins',
        retention: '7y',
        compliance: ['GDPR', 'HIPAA', 'SOX']
      };

      const result = manifestService.validateNamespace('governance', governancePolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Governance namespace must have encryption enabled');
    });

    it('should warn about GDPR compliance without TTL', () => {
      const gdprPolicy: StoragePolicy = {
        provider: 'firebase',
        fallback: 'localStorage',
        encrypt: true,
        sync: 'immediate',
        conflictResolution: 'server-wins',
        retention: '1y',
        compliance: ['GDPR']
        // Missing TTL
      };

      const result = manifestService.validateNamespace('user', gdprPolicy);
      expect(result.warnings).toContain('GDPR compliance typically requires TTL for data retention');
    });

    it('should warn about Firebase without fallback', () => {
      const firebasePolicy: StoragePolicy = {
        provider: 'firebase',
        // Missing fallback
        ttl: 3600000,
        encrypt: false,
        sync: 'immediate',
        conflictResolution: 'server-wins',
        retention: '1h',
        compliance: []
      };

      const result = manifestService.validateNamespace('test', firebasePolicy);
      expect(result.warnings).toContain('Firebase provider should have a fallback for reliability');
    });

    it('should detect negative TTL values', () => {
      const negativePolicy: StoragePolicy = {
        provider: 'localStorage',
        fallback: 'memory',
        ttl: -1000, // Negative TTL
        encrypt: false,
        sync: 'immediate',
        conflictResolution: 'client-wins',
        retention: '1h',
        compliance: []
      };

      const result = manifestService.validateNamespace('test', negativePolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TTL must be a positive number');
    });
  });

  describe('Recommendations', () => {
    it('should generate security recommendations', () => {
      const recommendations = manifestService.getRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
      
      // Should have recommendations for observer namespace (not encrypted)
      const observerRecs = recommendations.filter(rec => rec.namespace === 'observer');
      expect(observerRecs.length).toBeGreaterThan(0);
    });

    it('should filter recommendations by priority', () => {
      const criticalRecs = manifestService.getRecommendationsByPriority('critical');
      const highRecs = manifestService.getRecommendationsByPriority('high');
      const mediumRecs = manifestService.getRecommendationsByPriority('medium');
      const lowRecs = manifestService.getRecommendationsByPriority('low');

      expect(Array.isArray(criticalRecs)).toBe(true);
      expect(Array.isArray(highRecs)).toBe(true);
      expect(Array.isArray(mediumRecs)).toBe(true);
      expect(Array.isArray(lowRecs)).toBe(true);

      // All recommendations should have the correct priority
      criticalRecs.forEach(rec => expect(rec.priority).toBe('critical'));
      highRecs.forEach(rec => expect(rec.priority).toBe('high'));
      mediumRecs.forEach(rec => expect(rec.priority).toBe('medium'));
      lowRecs.forEach(rec => expect(rec.priority).toBe('low'));
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', () => {
      const report = manifestService.getComplianceReport();
      
      expect(report).toHaveProperty('compliant');
      expect(report).toHaveProperty('nonCompliant');
      expect(report).toHaveProperty('warnings');
      
      expect(Array.isArray(report.compliant)).toBe(true);
      expect(Array.isArray(report.nonCompliant)).toBe(true);
      expect(Array.isArray(report.warnings)).toBe(true);
    });

    it('should identify compliant and non-compliant namespaces', () => {
      const report = manifestService.getComplianceReport();
      
      // User and governance should be compliant (have encryption where required)
      expect(report.compliant).toContain('user');
      expect(report.compliant).toContain('governance');
      
      // Total should equal all namespaces
      const total = report.compliant.length + report.nonCompliant.length;
      expect(total).toBe(4); // user, observer, governance, notifications
    });
  });

  describe('Analytics', () => {
    it('should generate storage analytics', () => {
      const analytics = manifestService.getStorageAnalytics();
      
      expect(analytics).toHaveProperty('totalNamespaces');
      expect(analytics).toHaveProperty('providerDistribution');
      expect(analytics).toHaveProperty('encryptionStatus');
      expect(analytics).toHaveProperty('complianceStatus');
      expect(analytics).toHaveProperty('syncStrategies');
      
      expect(analytics.totalNamespaces).toBe(4);
      expect(analytics.providerDistribution.firebase).toBeGreaterThan(0);
      expect(analytics.providerDistribution.localStorage).toBeGreaterThan(0);
      expect(analytics.encryptionStatus.encrypted).toBeGreaterThan(0);
      expect(analytics.encryptionStatus.unencrypted).toBeGreaterThan(0);
    });

    it('should count provider distribution correctly', () => {
      const analytics = manifestService.getStorageAnalytics();
      
      // From mock data: user, observer, governance use firebase; notifications uses localStorage
      expect(analytics.providerDistribution.firebase).toBe(3);
      expect(analytics.providerDistribution.localStorage).toBe(1);
    });

    it('should count encryption status correctly', () => {
      const analytics = manifestService.getStorageAnalytics();
      
      // From mock data: user and governance are encrypted; observer and notifications are not
      expect(analytics.encryptionStatus.encrypted).toBe(2);
      expect(analytics.encryptionStatus.unencrypted).toBe(2);
    });

    it('should count compliance requirements correctly', () => {
      const analytics = manifestService.getStorageAnalytics();
      
      // From mock data: user has GDPR; governance has GDPR, HIPAA, SOX
      expect(analytics.complianceStatus.GDPR).toBe(2);
      expect(analytics.complianceStatus.HIPAA).toBe(1);
      expect(analytics.complianceStatus.SOX).toBe(1);
    });
  });

  describe('Component Integration Tracking', () => {
    it('should provide component integration status', () => {
      const integration = manifestService.getComponentIntegration();
      
      expect(Array.isArray(integration)).toBe(true);
      expect(integration.length).toBeGreaterThan(0);
      
      integration.forEach(item => {
        expect(item).toHaveProperty('component');
        expect(item).toHaveProperty('namespaces');
        expect(item).toHaveProperty('status');
        expect(Array.isArray(item.namespaces)).toBe(true);
        expect(['integrated', 'pending', 'not-applicable']).toContain(item.status);
      });
    });

    it('should include expected components', () => {
      const integration = manifestService.getComponentIntegration();
      const componentNames = integration.map(item => item.component);
      
      expect(componentNames).toContain('ObserverAgent');
      expect(componentNames).toContain('GovernanceDashboard');
      expect(componentNames).toContain('NotificationCenter');
      expect(componentNames).toContain('AgentManager');
      expect(componentNames).toContain('UserProfile');
    });
  });
});

