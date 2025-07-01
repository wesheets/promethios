/**
 * Agent Wrapping Types Index
 * 
 * This module exports all types and interfaces for the agent wrapping system,
 * including both the original wrapper types and the new dual-wrapping types.
 * 
 * @author Manus AI
 * @version 2.0.0
 */

// Original wrapper types (preserved for backward compatibility)
export interface AgentWrapperConfig {
  id: string;
  name: string;
  description: string;
  agentType: 'openai' | 'anthropic' | 'custom';
  configuration: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    [key: string]: any;
  };
  governanceLevel: 'none' | 'basic' | 'standard' | 'strict';
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    userId: string;
    tags?: string[];
  };
}

export interface AgentWrapper {
  id: string;
  config: AgentWrapperConfig;
  status: 'active' | 'inactive' | 'error';
  lastUsed?: Date;
  usageCount: number;
  errorCount: number;
}

export interface WrapperRegistry {
  wrappers: Map<string, AgentWrapper>;
  getUserWrappers(userId: string): AgentWrapper[];
  getWrapper(wrapperId: string): AgentWrapper | undefined;
  registerWrapper(config: AgentWrapperConfig): Promise<string>;
  updateWrapper(wrapperId: string, updates: Partial<AgentWrapperConfig>): Promise<void>;
  removeWrapper(wrapperId: string): Promise<void>;
  persistWrapper(wrapper: AgentWrapper): Promise<void>;
  loadWrappers(userId: string): Promise<void>;
}

// Re-export all dual-wrapping types
export * from './dualWrapper';
export * from './governance';
export * from './storage';

// Export default configurations and utilities
export const DEFAULT_GOVERNANCE_CONFIG = {
  policies: [],
  trustConfig: {
    initialScore: 75,
    minimumThreshold: 50,
    decayRate: 0.1,
    recoveryRate: 0.05,
    factors: [
      {
        name: 'policy_compliance',
        weight: 0.4,
        type: 'policy_compliance' as const,
      },
      {
        name: 'response_quality',
        weight: 0.3,
        type: 'response_quality' as const,
      },
      {
        name: 'user_feedback',
        weight: 0.2,
        type: 'user_feedback' as const,
      },
      {
        name: 'error_rate',
        weight: 0.1,
        type: 'error_rate' as const,
      }
    ],
    evaluationInterval: 60, // minutes
  },
  auditConfig: {
    enabled: true,
    logLevel: 'standard' as const,
    retention: {
      days: 90,
      maxEntries: 10000,
    },
    destinations: [
      {
        type: 'firebase' as const,
        config: {},
        enabled: true,
      }
    ],
    includeContent: false,
    includeMetadata: true,
  },
  complianceLevel: 'standard' as const,
  emergencyControls: {
    enabled: true,
    triggers: [
      {
        type: 'trust_threshold' as const,
        threshold: 30,
        timeWindow: 60,
        enabled: true,
      },
      {
        type: 'policy_violation_rate' as const,
        threshold: 0.1, // 10% violation rate
        timeWindow: 60,
        enabled: true,
      }
    ],
    actions: [
      {
        type: 'suspend_agent' as const,
        enabled: true,
      },
      {
        type: 'notify_admin' as const,
        enabled: true,
      }
    ],
    notificationChannels: [],
  },
  metadata: {
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '',
  },
};

export const DEFAULT_STORAGE_CONFIG = {
  provider: 'firebase' as const,
  firebase: {
    projectId: '',
    databaseURL: '',
    storageBucket: '',
    collections: {
      wrappers: 'dual_wrappers',
      packages: 'deployment_packages',
      governanceStates: 'governance_states',
      auditLogs: 'audit_logs',
      userMetadata: 'user_metadata',
    },
  },
  caching: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 100,
  },
  backup: {
    enabled: true,
    frequency: 'daily' as const,
    retention: 30, // days
    destination: 'firebase_storage',
  },
};

export const SUPPORTED_AGENT_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'cohere',
  'huggingface',
  'custom'
] as const;

export const SUPPORTED_POLICY_TYPES = [
  'content_filter',
  'behavior_constraint',
  'output_validation',
  'interaction_limit',
  'custom'
] as const;

export const SUPPORTED_TRUST_FACTORS = [
  'policy_compliance',
  'response_quality',
  'user_feedback',
  'error_rate',
  'response_time',
  'custom'
] as const;

export const SUPPORTED_EXPORT_FORMATS = [
  'docker',
  'npm',
  'api_service',
  'standalone'
] as const;

export const GOVERNANCE_COMPLIANCE_LEVELS = [
  'basic',
  'standard',
  'strict',
  'enterprise'
] as const;

// Type guards for runtime type checking
export function isDualAgentWrapper(obj: any): obj is import('./dualWrapper').DualAgentWrapper {
  return obj && 
    typeof obj.id === 'string' &&
    obj.baseAgent &&
    obj.testingWrapper &&
    obj.deploymentWrapper &&
    obj.status &&
    obj.metadata;
}

export function isGovernanceConfiguration(obj: any): obj is import('./dualWrapper').GovernanceConfiguration {
  return obj &&
    Array.isArray(obj.policies) &&
    obj.trustConfig &&
    obj.auditConfig &&
    typeof obj.complianceLevel === 'string' &&
    obj.emergencyControls &&
    obj.metadata;
}

export function isPolicyDefinition(obj: any): obj is import('./dualWrapper').PolicyDefinition {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    Array.isArray(obj.rules) &&
    typeof obj.severity === 'string' &&
    typeof obj.enabled === 'boolean';
}

// Utility functions for working with dual wrappers
export function createEmptyDualWrapper(userId: string): Partial<import('./dualWrapper').DualAgentWrapper> {
  const now = new Date();
  return {
    baseAgent: {
      name: '',
      description: '',
      provider: 'openai',
      model: 'gpt-4',
      capabilities: [],
      configuration: {},
    },
    status: {
      testingStatus: 'inactive',
      deploymentStatus: 'building',
      lastTested: null,
      lastDeployed: null,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      userId,
      tags: [],
    },
  };
}

export function createDefaultPolicyDefinition(): import('./dualWrapper').PolicyDefinition {
  return {
    id: '',
    name: '',
    description: '',
    type: 'content_filter',
    rules: [],
    severity: 'medium',
    enabled: true,
  };
}

export function createDefaultTrustConfiguration(): import('./dualWrapper').TrustConfiguration {
  return {
    initialScore: 75,
    minimumThreshold: 50,
    decayRate: 0.1,
    recoveryRate: 0.05,
    factors: [
      {
        name: 'policy_compliance',
        weight: 0.4,
        type: 'policy_compliance',
      }
    ],
    evaluationInterval: 60,
  };
}

// Version information
export const WRAPPER_SYSTEM_VERSION = '2.0.0';
export const DUAL_WRAPPER_API_VERSION = '1.0.0';
export const GOVERNANCE_ENGINE_VERSION = '1.0.0';

// Export legacy types for backward compatibility
export type LegacyAgentWrapper = AgentWrapper;
export type LegacyAgentWrapperConfig = AgentWrapperConfig;
export type LegacyWrapperRegistry = WrapperRegistry;

