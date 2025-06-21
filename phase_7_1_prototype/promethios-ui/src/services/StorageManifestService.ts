import { StorageNamespace, StoragePolicy } from './storage/types';
import storageManifest from '../config/storage_manifest.json';

/**
 * Storage Manifest Service
 * Manages storage namespace configurations and provides validation
 * Integrates with the Promethios governance system for compliance
 */
export class StorageManifestService {
  private static instance: StorageManifestService;
  private namespaces = new Map<string, StorageNamespace>();
  private recommendations: Array<{
    namespace: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    action?: string;
  }> = [];

  constructor() {
    this.loadManifest();
    this.generateRecommendations();
  }

  static getInstance(): StorageManifestService {
    if (!StorageManifestService.instance) {
      StorageManifestService.instance = new StorageManifestService();
    }
    return StorageManifestService.instance;
  }

  private loadManifest(): void {
    for (const [name, config] of Object.entries(storageManifest)) {
      const namespace: StorageNamespace = {
        name,
        policy: config as StoragePolicy,
        description: config.description
      };
      this.namespaces.set(name, namespace);
    }
  }

  private generateRecommendations(): void {
    this.recommendations = [];

    for (const [name, namespace] of this.namespaces.entries()) {
      const policy = namespace.policy;

      // Security recommendations
      if (name === 'governance' && !policy.encrypt) {
        this.recommendations.push({
          namespace: name,
          priority: 'critical',
          message: 'Governance data should be encrypted for compliance',
          action: 'Enable encryption in storage manifest'
        });
      }

      if (name === 'user' && !policy.encrypt) {
        this.recommendations.push({
          namespace: name,
          priority: 'high',
          message: 'User data should be encrypted for privacy protection',
          action: 'Enable encryption in storage manifest'
        });
      }

      // Performance recommendations
      if (policy.provider === 'firebase' && !policy.fallback) {
        this.recommendations.push({
          namespace: name,
          priority: 'medium',
          message: 'Firebase provider should have a fallback for reliability',
          action: 'Add localStorage fallback'
        });
      }

      // Compliance recommendations
      if (policy.compliance && policy.compliance.includes('GDPR') && !policy.ttl) {
        this.recommendations.push({
          namespace: name,
          priority: 'high',
          message: 'GDPR compliance requires data retention limits',
          action: 'Set appropriate TTL value'
        });
      }

      // Sync strategy recommendations
      if (policy.provider === 'firebase' && policy.sync === 'manual') {
        this.recommendations.push({
          namespace: name,
          priority: 'low',
          message: 'Consider automatic sync for cloud storage',
          action: 'Change sync strategy to immediate or batched'
        });
      }
    }
  }

  // Public API
  getNamespace(name: string): StorageNamespace | undefined {
    return this.namespaces.get(name);
  }

  getAllNamespaces(): StorageNamespace[] {
    return Array.from(this.namespaces.values());
  }

  getNamespaceNames(): string[] {
    return Array.from(this.namespaces.keys());
  }

  getRecommendations(): Array<{
    namespace: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    action?: string;
  }> {
    return this.recommendations;
  }

  getRecommendationsByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Array<{
    namespace: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    action?: string;
  }> {
    return this.recommendations.filter(rec => rec.priority === priority);
  }

  validateNamespace(name: string, policy: StoragePolicy): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!policy.provider) {
      errors.push('Provider is required');
    }

    if (!['localStorage', 'memory', 'firebase'].includes(policy.provider)) {
      errors.push('Provider must be one of: localStorage, memory, firebase');
    }

    // Security validation
    if (name === 'governance' && !policy.encrypt) {
      errors.push('Governance namespace must have encryption enabled');
    }

    if (policy.compliance && policy.compliance.includes('GDPR') && !policy.ttl) {
      warnings.push('GDPR compliance typically requires TTL for data retention');
    }

    // Performance validation
    if (policy.provider === 'firebase' && !policy.fallback) {
      warnings.push('Firebase provider should have a fallback for reliability');
    }

    if (policy.ttl && policy.ttl < 0) {
      errors.push('TTL must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  getComplianceReport(): {
    compliant: string[];
    nonCompliant: string[];
    warnings: string[];
  } {
    const compliant: string[] = [];
    const nonCompliant: string[] = [];
    const warnings: string[] = [];

    for (const [name, namespace] of this.namespaces.entries()) {
      const validation = this.validateNamespace(name, namespace.policy);
      
      if (validation.valid) {
        compliant.push(name);
      } else {
        nonCompliant.push(name);
      }

      if (validation.warnings.length > 0) {
        warnings.push(`${name}: ${validation.warnings.join(', ')}`);
      }
    }

    return { compliant, nonCompliant, warnings };
  }

  getStorageAnalytics(): {
    totalNamespaces: number;
    providerDistribution: Record<string, number>;
    encryptionStatus: { encrypted: number; unencrypted: number };
    complianceStatus: Record<string, number>;
    syncStrategies: Record<string, number>;
  } {
    const providerDistribution: Record<string, number> = {};
    const complianceStatus: Record<string, number> = {};
    const syncStrategies: Record<string, number> = {};
    let encrypted = 0;
    let unencrypted = 0;

    for (const namespace of this.namespaces.values()) {
      const policy = namespace.policy;

      // Provider distribution
      providerDistribution[policy.provider] = (providerDistribution[policy.provider] || 0) + 1;

      // Encryption status
      if (policy.encrypt) {
        encrypted++;
      } else {
        unencrypted++;
      }

      // Compliance status
      if (policy.compliance) {
        for (const compliance of policy.compliance) {
          complianceStatus[compliance] = (complianceStatus[compliance] || 0) + 1;
        }
      }

      // Sync strategies
      if (policy.sync) {
        syncStrategies[policy.sync] = (syncStrategies[policy.sync] || 0) + 1;
      }
    }

    return {
      totalNamespaces: this.namespaces.size,
      providerDistribution,
      encryptionStatus: { encrypted, unencrypted },
      complianceStatus,
      syncStrategies
    };
  }

  // Component integration tracking
  getComponentIntegration(): Array<{
    component: string;
    namespaces: string[];
    status: 'integrated' | 'pending' | 'not-applicable';
  }> {
    // This would be populated by actual component usage tracking
    // For now, return expected integrations based on namespace purposes
    return [
      {
        component: 'ObserverAgent',
        namespaces: ['observer', 'user', 'preferences'],
        status: 'pending'
      },
      {
        component: 'GovernanceDashboard',
        namespaces: ['governance', 'user'],
        status: 'pending'
      },
      {
        component: 'NotificationCenter',
        namespaces: ['notifications', 'user', 'preferences'],
        status: 'pending'
      },
      {
        component: 'AgentManager',
        namespaces: ['agents', 'user'],
        status: 'pending'
      },
      {
        component: 'UserProfile',
        namespaces: ['user', 'preferences'],
        status: 'pending'
      }
    ];
  }
}

// Export singleton instance
export const storageManifestService = StorageManifestService.getInstance();

