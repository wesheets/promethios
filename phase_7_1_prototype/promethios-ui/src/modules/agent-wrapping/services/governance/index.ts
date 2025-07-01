/**
 * Governance Services Index
 * 
 * Exports all governance engine components and utilities
 * for the dual-wrapping system.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

// Core governance engine
export { BasicGovernanceEngine, GovernanceEngineFactory } from './BasicGovernanceEngine';

// Component implementations
export { BasicPolicyEnforcer } from './BasicPolicyEnforcer';
export { BasicTrustManager } from './BasicTrustManager';
export { BasicAuditLogger } from './BasicAuditLogger';
export { BasicComplianceMonitor } from './BasicComplianceMonitor';

// Re-export types for convenience
export type {
  GovernanceEngine,
  GovernanceEngineConfig,
  GovernanceEngineState,
  GovernanceEngineMetrics,
  PolicyEnforcer,
  TrustManager,
  AuditLogger,
  ComplianceMonitor,
  EmergencyControlState,
  GovernedInteractionResult,
  ConfigValidationResult,
  PolicyCheckResult,
  PolicyValidationResult,
  PolicyEnforcementResult,
  PolicyStatus,
  PolicyIssue,
  TrustEvaluation,
  TrustFactorEvaluation,
  TrustHistoryEntry,
  TrustScoreChange,
  AuditLogEntry,
  GovernanceEvent,
  AuditConfiguration,
  AuditDestination,
  AuditQuery,
  AuditQueryResult,
  ComplianceSession,
  ComplianceMetrics,
  ComplianceAlert,
  ComplianceReport
} from '../../types/governance';

/**
 * Governance engine factory with default configurations
 */
export class GovernanceFactory {
  /**
   * Create a basic governance engine with default settings
   */
  static async createBasicEngine(
    agentId: string,
    userId: string,
    options: {
      policies?: any[];
      trustThreshold?: number;
      auditLevel?: 'minimal' | 'standard' | 'verbose';
      debugMode?: boolean;
    } = {}
  ) {
    const config = {
      agentId,
      userId,
      policies: options.policies || [],
      trustConfig: {
        initialScore: 75,
        minimumThreshold: options.trustThreshold || 50,
        decayRate: 0.1,
        recoveryRate: 0.05,
        factors: [
          {
            name: 'policy_compliance',
            type: 'policy_compliance' as const,
            weight: 0.4,
            enabled: true,
          },
          {
            name: 'response_quality',
            type: 'response_quality' as const,
            weight: 0.3,
            enabled: true,
          },
          {
            name: 'error_rate',
            type: 'error_rate' as const,
            weight: 0.3,
            enabled: true,
          },
        ],
        evaluationInterval: 60,
      },
      auditConfig: {
        enabled: true,
        logLevel: options.auditLevel || 'standard',
        retention: { days: 90 },
        destinations: [
          {
            type: 'console' as const,
            enabled: true,
            config: {},
          },
        ],
        includeContent: options.auditLevel === 'verbose',
        includeMetadata: true,
      },
      performanceConfig: {
        maxProcessingTime: 5000,
        enableCaching: true,
        cacheSize: 100,
        batchSize: 10,
        parallelProcessing: false,
        timeoutHandling: 'fail' as const,
      },
      emergencyControls: {
        enabled: true,
        triggers: [
          {
            type: 'policy_violation_rate',
            threshold: 0.5,
            enabled: true,
          },
          {
            type: 'trust_threshold',
            threshold: options.trustThreshold || 50,
            enabled: true,
          },
        ],
        actions: [
          {
            type: 'suspend_agent',
            enabled: true,
          },
          {
            type: 'notify_admin',
            enabled: true,
          },
        ],
      },
      debugMode: options.debugMode || false,
    };

    return GovernanceEngineFactory.createEngine(config);
  }

  /**
   * Create a strict governance engine with enhanced security
   */
  static async createStrictEngine(
    agentId: string,
    userId: string,
    policies: any[],
    options: {
      trustThreshold?: number;
      auditLevel?: 'minimal' | 'standard' | 'verbose';
    } = {}
  ) {
    return this.createBasicEngine(agentId, userId, {
      policies,
      trustThreshold: options.trustThreshold || 70,
      auditLevel: options.auditLevel || 'verbose',
      debugMode: false,
    });
  }

  /**
   * Create a development governance engine with relaxed settings
   */
  static async createDevelopmentEngine(
    agentId: string,
    userId: string,
    options: {
      policies?: any[];
      debugMode?: boolean;
    } = {}
  ) {
    return this.createBasicEngine(agentId, userId, {
      policies: options.policies || [],
      trustThreshold: 30,
      auditLevel: 'verbose',
      debugMode: options.debugMode !== false,
    });
  }
}

/**
 * Utility functions for governance
 */
export class GovernanceUtils {
  /**
   * Create a basic content filter policy
   */
  static createContentFilterPolicy(
    id: string,
    name: string,
    keywords: string[],
    action: 'block' | 'modify' = 'block'
  ) {
    return {
      id,
      name,
      type: 'content_filter',
      enabled: true,
      severity: 'medium' as const,
      description: `Content filter for keywords: ${keywords.join(', ')}`,
      rules: [
        {
          id: `${id}_rule_1`,
          condition: {
            type: 'contains_keywords',
            value: keywords,
          },
          action: {
            type: action,
          },
        },
      ],
      metadata: {
        createdAt: new Date(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Create a behavior constraint policy
   */
  static createBehaviorConstraintPolicy(
    id: string,
    name: string,
    allowedTypes: string[],
    restrictedTools: string[] = []
  ) {
    return {
      id,
      name,
      type: 'behavior_constraint',
      enabled: true,
      severity: 'high' as const,
      description: `Behavior constraints: allowed types [${allowedTypes.join(', ')}], restricted tools [${restrictedTools.join(', ')}]`,
      rules: [
        {
          id: `${id}_rule_1`,
          condition: {
            type: 'allowed_types',
            value: allowedTypes,
          },
          action: {
            type: 'block',
          },
        },
        ...(restrictedTools.length > 0 ? [{
          id: `${id}_rule_2`,
          condition: {
            type: 'restricted_tools',
            value: restrictedTools,
          },
          action: {
            type: 'block',
          },
        }] : []),
      ],
      metadata: {
        createdAt: new Date(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Create a rate limiting policy
   */
  static createRateLimitPolicy(
    id: string,
    name: string,
    requests: number,
    windowMinutes: number
  ) {
    return {
      id,
      name,
      type: 'interaction_limit',
      enabled: true,
      severity: 'medium' as const,
      description: `Rate limit: ${requests} requests per ${windowMinutes} minutes`,
      rules: [
        {
          id: `${id}_rule_1`,
          condition: {
            type: 'rate_limit',
            value: {
              requests,
              window: windowMinutes * 60, // Convert to seconds
            },
          },
          action: {
            type: 'block',
          },
        },
      ],
      metadata: {
        createdAt: new Date(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Validate a policy definition
   */
  static validatePolicy(policy: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!policy.id) errors.push('Policy ID is required');
    if (!policy.name) errors.push('Policy name is required');
    if (!policy.type) errors.push('Policy type is required');
    if (!policy.rules || !Array.isArray(policy.rules)) errors.push('Policy rules array is required');
    if (!policy.severity) errors.push('Policy severity is required');

    // Validate rules
    if (policy.rules) {
      for (let i = 0; i < policy.rules.length; i++) {
        const rule = policy.rules[i];
        if (!rule.id) errors.push(`Rule ${i + 1}: ID is required`);
        if (!rule.condition) errors.push(`Rule ${i + 1}: Condition is required`);
        if (!rule.action) errors.push(`Rule ${i + 1}: Action is required`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Default configurations
 */
export const DEFAULT_GOVERNANCE_CONFIG = {
  TRUST_INITIAL_SCORE: 75,
  TRUST_MINIMUM_THRESHOLD: 50,
  TRUST_DECAY_RATE: 0.1,
  TRUST_RECOVERY_RATE: 0.05,
  AUDIT_RETENTION_DAYS: 90,
  MAX_PROCESSING_TIME: 5000,
  EMERGENCY_VIOLATION_RATE_THRESHOLD: 0.5,
};

/**
 * Supported policy types
 */
export const POLICY_TYPES = {
  CONTENT_FILTER: 'content_filter',
  BEHAVIOR_CONSTRAINT: 'behavior_constraint',
  OUTPUT_VALIDATION: 'output_validation',
  INTERACTION_LIMIT: 'interaction_limit',
  CUSTOM: 'custom',
} as const;

/**
 * Supported trust factor types
 */
export const TRUST_FACTOR_TYPES = {
  POLICY_COMPLIANCE: 'policy_compliance',
  RESPONSE_QUALITY: 'response_quality',
  USER_FEEDBACK: 'user_feedback',
  ERROR_RATE: 'error_rate',
  RESPONSE_TIME: 'response_time',
  CUSTOM: 'custom',
} as const;

