import storageManifest from '../config/storage_manifest.json';
import { StorageConfig, NamespaceConfig, StoragePolicy } from './storage/types';

/**
 * Storage Manifest Service
 * Provides centralized configuration and observability for storage namespaces
 * Based on ChatGPT's suggestion for a manifest registry system
 */

interface ManifestNamespace {
  provider: string;
  fallback?: string;
  retention: string;
  encrypted: boolean;
  syncStrategy: string;
  conflictResolution?: string;
  gdprCategory?: string;
  description: string;
  estimatedSize: string;
  criticalityLevel: string;
  components: string[];
  realtime?: boolean;
  ttl?: string;
  sessionOnly?: boolean;
  volatile?: boolean;
  complianceRequired?: boolean;
  auditLog?: boolean;
}

interface StorageManifest {
  version: string;
  lastUpdated: string;
  namespaces: Record<string, ManifestNamespace>;
  policies: {
    encryption: { required: string[]; optional: string[]; forbidden: string[] };
    sync: Record<string, string[]>;
    retention: Record<string, string[]>;
    compliance: Record<string, string[]>;
  };
  analytics: {
    growth: Record<string, string[]>;
    usage: Record<string, string[]>;
    performance: Record<string, string[]>;
  };
  migration: Record<string, string[]>;
  monitoring: {
    alerts: Record<string, string[]>;
    metrics: Record<string, string[]>;
  };
}

class StorageManifestService {
  private manifest: StorageManifest;

  constructor() {
    this.manifest = storageManifest as StorageManifest;
  }

  /**
   * Get the complete manifest
   */
  getManifest(): StorageManifest {
    return this.manifest;
  }

  /**
   * Get configuration for a specific namespace
   */
  getNamespaceConfig(namespace: string): ManifestNamespace | null {
    return this.manifest.namespaces[namespace] || null;
  }

  /**
   * Get all namespace names
   */
  getNamespaces(): string[] {
    return Object.keys(this.manifest.namespaces);
  }

  /**
   * Convert manifest to StorageConfig for UnifiedStorageService
   */
  toStorageConfig(): StorageConfig {
    const namespaces: Record<string, NamespaceConfig> = {};

    Object.entries(this.manifest.namespaces).forEach(([name, config]) => {
      namespaces[name] = {
        provider: config.provider,
        fallback: config.fallback,
        defaultPolicy: this.manifestToPolicy(config)
      };
    });

    return {
      defaultProvider: 'localStorage',
      providers: {
        localStorage: { enabled: true },
        memory: { enabled: true },
        firebase: { enabled: true }
      },
      namespaces
    };
  }

  /**
   * Convert manifest namespace to storage policy
   */
  private manifestToPolicy(config: ManifestNamespace): StoragePolicy {
    const policy: StoragePolicy = {};

    // Set encryption
    if (config.encrypted) {
      policy.encryption = 'at-rest';
    }

    // Set sync strategy
    switch (config.syncStrategy) {
      case 'immediate':
        policy.syncStrategy = 'immediate';
        break;
      case 'batched':
        policy.syncStrategy = 'batched';
        break;
      case 'never':
        policy.syncStrategy = 'never';
        break;
    }

    // Set conflict resolution
    if (config.conflictResolution) {
      policy.conflictResolution = config.conflictResolution as any;
    }

    // Set GDPR category
    if (config.gdprCategory) {
      policy.gdprCategory = config.gdprCategory as any;
    }

    // Set TTL based on retention
    if (config.ttl) {
      policy.ttl = this.parseTTL(config.ttl);
    } else if (config.retention !== 'forever') {
      policy.ttl = this.parseTTL(config.retention);
    }

    // Set provider constraints
    if (config.provider === 'firebase' && !config.fallback) {
      policy.allowedProviders = ['firebase'];
      policy.forbiddenProviders = ['localStorage', 'memory'];
    }

    return policy;
  }

  /**
   * Parse TTL string to milliseconds
   */
  private parseTTL(ttl: string): number {
    const units: Record<string, number> = {
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'y': 365 * 24 * 60 * 60 * 1000
    };

    const match = ttl.match(/^(\d+)([hdy])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      return value * units[unit];
    }

    return 24 * 60 * 60 * 1000; // Default to 24 hours
  }

  /**
   * Get namespaces by policy category
   */
  getNamespacesByPolicy(category: string, subcategory: string): string[] {
    const policies = this.manifest.policies as any;
    return policies[category]?.[subcategory] || [];
  }

  /**
   * Get analytics data for namespaces
   */
  getAnalytics(): {
    growth: Record<string, string[]>;
    usage: Record<string, string[]>;
    performance: Record<string, string[]>;
  } {
    return this.manifest.analytics;
  }

  /**
   * Get migration status
   */
  getMigrationStatus(): Record<string, string[]> {
    return this.manifest.migration;
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig(): {
    alerts: Record<string, string[]>;
    metrics: Record<string, string[]>;
  } {
    return this.manifest.monitoring;
  }

  /**
   * Get components using a specific namespace
   */
  getComponentsForNamespace(namespace: string): string[] {
    const config = this.getNamespaceConfig(namespace);
    return config?.components || [];
  }

  /**
   * Get namespace for a specific component
   */
  getNamespaceForComponent(component: string): string | null {
    for (const [namespace, config] of Object.entries(this.manifest.namespaces)) {
      if (config.components.includes(component)) {
        return namespace;
      }
    }
    return null;
  }

  /**
   * Validate namespace configuration
   */
  validateNamespace(namespace: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const config = this.getNamespaceConfig(namespace);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config) {
      errors.push(`Namespace '${namespace}' not found in manifest`);
      return { valid: false, errors, warnings };
    }

    // Check for required encryption
    const encryptionRequired = this.getNamespacesByPolicy('encryption', 'required');
    if (encryptionRequired.includes(namespace) && !config.encrypted) {
      errors.push(`Namespace '${namespace}' requires encryption but is not encrypted`);
    }

    // Check for forbidden providers
    const encryptionForbidden = this.getNamespacesByPolicy('encryption', 'forbidden');
    if (encryptionForbidden.includes(namespace) && config.encrypted) {
      warnings.push(`Namespace '${namespace}' has encryption but it's marked as forbidden`);
    }

    // Check retention vs compliance
    if (config.complianceRequired && config.retention === '24h') {
      warnings.push(`Namespace '${namespace}' requires compliance but has short retention`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get storage recommendations based on manifest
   */
  getRecommendations(): {
    namespace: string;
    type: 'optimization' | 'compliance' | 'performance' | 'security';
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[] {
    const recommendations = [];

    // Check for high-usage namespaces with poor performance
    const highUsage = this.getNamespacesByPolicy('analytics', 'usage')?.high || [];
    const normalPerformance = this.getNamespacesByPolicy('analytics', 'performance')?.normal || [];
    
    for (const namespace of highUsage) {
      if (normalPerformance.includes(namespace)) {
        recommendations.push({
          namespace,
          type: 'performance' as const,
          message: `High-usage namespace '${namespace}' has normal performance priority. Consider optimization.`,
          priority: 'medium' as const
        });
      }
    }

    // Check for unencrypted sensitive data
    const encryptionRequired = this.getNamespacesByPolicy('encryption', 'required');
    for (const namespace of encryptionRequired) {
      const config = this.getNamespaceConfig(namespace);
      if (config && !config.encrypted) {
        recommendations.push({
          namespace,
          type: 'security' as const,
          message: `Namespace '${namespace}' contains sensitive data but is not encrypted.`,
          priority: 'critical' as const
        });
      }
    }

    // Check for compliance issues
    const complianceNamespaces = Object.entries(this.manifest.namespaces)
      .filter(([_, config]) => config.complianceRequired)
      .map(([name]) => name);

    for (const namespace of complianceNamespaces) {
      const config = this.getNamespaceConfig(namespace);
      if (config && config.retention === '24h') {
        recommendations.push({
          namespace,
          type: 'compliance' as const,
          message: `Compliance namespace '${namespace}' has insufficient retention period.`,
          priority: 'high' as const
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate manifest summary for admin dashboard
   */
  getSummary(): {
    totalNamespaces: number;
    encryptedNamespaces: number;
    complianceNamespaces: number;
    migrationProgress: { completed: number; total: number; percentage: number };
    criticalityBreakdown: Record<string, number>;
    providerUsage: Record<string, number>;
  } {
    const namespaces = Object.values(this.manifest.namespaces);
    const totalNamespaces = namespaces.length;
    const encryptedNamespaces = namespaces.filter(ns => ns.encrypted).length;
    const complianceNamespaces = namespaces.filter(ns => ns.complianceRequired).length;

    const migration = this.getMigrationStatus();
    const completed = migration.completed?.length || 0;
    const migrationProgress = {
      completed,
      total: totalNamespaces,
      percentage: Math.round((completed / totalNamespaces) * 100)
    };

    const criticalityBreakdown = namespaces.reduce((acc, ns) => {
      acc[ns.criticalityLevel] = (acc[ns.criticalityLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const providerUsage = namespaces.reduce((acc, ns) => {
      acc[ns.provider] = (acc[ns.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNamespaces,
      encryptedNamespaces,
      complianceNamespaces,
      migrationProgress,
      criticalityBreakdown,
      providerUsage
    };
  }
}

// Create singleton instance
export const storageManifestService = new StorageManifestService();

// Export types
export type { ManifestNamespace, StorageManifest };

