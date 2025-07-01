/**
 * Dual-Wrapping System Types
 * 
 * This module defines the core types and interfaces for the dual-wrapping system
 * that creates both testing and deployment versions of wrapped agents.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { AgentWrapperConfig } from './index';

/**
 * Governance policy definition for agent behavior control
 */
export interface PolicyDefinition {
  id: string;
  name: string;
  description: string;
  type: 'content_filter' | 'behavior_constraint' | 'output_validation' | 'interaction_limit' | 'custom';
  rules: PolicyRule[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  metadata?: Record<string, any>;
}

/**
 * Individual policy rule within a policy definition
 */
export interface PolicyRule {
  id: string;
  condition: string; // JSON logic or expression
  action: 'allow' | 'block' | 'modify' | 'warn' | 'log';
  parameters?: Record<string, any>;
  message?: string;
}

/**
 * Trust management configuration
 */
export interface TrustConfiguration {
  initialScore: number; // 0-100
  minimumThreshold: number; // Minimum score to operate
  decayRate: number; // How quickly trust decays over time
  recoveryRate: number; // How quickly trust can be recovered
  factors: TrustFactor[];
  evaluationInterval: number; // Minutes between evaluations
}

/**
 * Factors that influence trust score calculation
 */
export interface TrustFactor {
  name: string;
  weight: number; // 0-1, how much this factor influences overall score
  type: 'policy_compliance' | 'response_quality' | 'user_feedback' | 'error_rate' | 'custom';
  parameters?: Record<string, any>;
}

/**
 * Audit logging configuration
 */
export interface AuditConfiguration {
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  retention: {
    days: number;
    maxEntries?: number;
  };
  destinations: AuditDestination[];
  includeContent: boolean; // Whether to log actual conversation content
  includeMetadata: boolean; // Whether to log request/response metadata
}

/**
 * Audit log destination configuration
 */
export interface AuditDestination {
  type: 'firebase' | 'file' | 'webhook' | 'external_service';
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * Complete governance configuration for an agent
 */
export interface GovernanceConfiguration {
  policies: PolicyDefinition[];
  trustConfig: TrustConfiguration;
  auditConfig: AuditConfiguration;
  complianceLevel: 'basic' | 'standard' | 'strict' | 'enterprise';
  emergencyControls: EmergencyControlConfig;
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

/**
 * Emergency control configuration for immediate intervention
 */
export interface EmergencyControlConfig {
  enabled: boolean;
  triggers: EmergencyTrigger[];
  actions: EmergencyAction[];
  notificationChannels: string[]; // User IDs or channels to notify
}

/**
 * Conditions that trigger emergency controls
 */
export interface EmergencyTrigger {
  type: 'trust_threshold' | 'policy_violation_rate' | 'error_rate' | 'manual' | 'external_signal';
  threshold?: number;
  timeWindow?: number; // Minutes
  enabled: boolean;
}

/**
 * Actions taken when emergency controls are triggered
 */
export interface EmergencyAction {
  type: 'suspend_agent' | 'restrict_capabilities' | 'require_approval' | 'notify_admin' | 'log_incident';
  parameters?: Record<string, any>;
  enabled: boolean;
}

/**
 * Testing wrapper configuration (current behavior)
 */
export interface TestingWrapper {
  id: string;
  type: 'configuration';
  config: AgentWrapperConfig;
  storageKey: string;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
  };
}

/**
 * Deployment wrapper with embedded governance
 */
export interface DeploymentWrapper {
  id: string;
  type: 'governed';
  governanceConfig: GovernanceConfiguration;
  packageInfo: {
    path: string;
    format: 'docker' | 'npm' | 'api_service' | 'standalone';
    version: string;
    size: number; // bytes
    checksum: string;
  };
  deploymentMetadata: {
    supportedEnvironments: string[];
    requirements: Record<string, any>;
    documentation: string;
    examples: string[];
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    buildId: string;
  };
}

/**
 * Complete dual wrapper containing both testing and deployment versions
 */
export interface DualAgentWrapper {
  id: string;
  baseAgent: {
    name: string;
    description: string;
    provider: string; // 'openai', 'anthropic', etc.
    model: string;
    capabilities: string[];
    configuration: Record<string, any>;
  };
  testingWrapper: TestingWrapper;
  deploymentWrapper: DeploymentWrapper;
  status: {
    testingStatus: 'active' | 'inactive' | 'error';
    deploymentStatus: 'building' | 'ready' | 'deployed' | 'error';
    lastTested: Date | null;
    lastDeployed: Date | null;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    userId: string;
    tags: string[];
    description?: string;
  };
}

/**
 * Governance engine runtime state
 */
export interface GovernanceEngineState {
  agentId: string;
  currentTrustScore: number;
  policyViolations: PolicyViolation[];
  recentInteractions: number;
  lastEvaluation: Date;
  status: 'active' | 'suspended' | 'restricted' | 'error';
  emergencyStatus: 'normal' | 'warning' | 'critical' | 'suspended';
}

/**
 * Policy violation record
 */
export interface PolicyViolation {
  id: string;
  policyId: string;
  ruleId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: Record<string, any>;
  action: string; // Action taken in response
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Agent interaction context for governance evaluation
 */
export interface AgentInteraction {
  id: string;
  agentId: string;
  userId: string;
  timestamp: Date;
  type: 'chat' | 'api_call' | 'function_execution' | 'system_operation';
  input: {
    content: string;
    metadata: Record<string, any>;
  };
  context: {
    sessionId: string;
    conversationHistory?: any[];
    userContext?: Record<string, any>;
    systemContext?: Record<string, any>;
  };
  execute: () => Promise<any>; // Function to execute the interaction
}

/**
 * Result of a governed interaction
 */
export interface GovernedInteractionResult {
  success: boolean;
  result?: any;
  governanceApplied: boolean;
  policyChecks: PolicyCheckResult[];
  trustScoreImpact: number;
  auditLogId?: string;
  warnings?: string[];
  errors?: string[];
  metadata: Record<string, any>;
}

/**
 * Result of a policy compliance check
 */
export interface PolicyCheckResult {
  policyId: string;
  ruleId?: string;
  compliant: boolean;
  violation?: string;
  action: 'allow' | 'block' | 'modify' | 'warn' | 'log';
  confidence: number; // 0-1
  metadata?: Record<string, any>;
}

/**
 * Governance check result for pre/post interaction validation
 */
export interface GovernanceCheckResult {
  allowed: boolean;
  reason?: string;
  modifications?: Record<string, any>;
  warnings?: string[];
  metadata?: Record<string, any>;
}

/**
 * Export configuration for deployment packages
 */
export interface ExportConfiguration {
  format: 'docker' | 'npm' | 'api_service' | 'standalone';
  target: {
    environment: string; // 'production', 'staging', 'development'
    platform: string; // 'aws', 'gcp', 'azure', 'on-premise'
    runtime: string; // 'node', 'python', 'docker', 'serverless'
  };
  options: {
    includeDocumentation: boolean;
    includeExamples: boolean;
    optimizeForSize: boolean;
    enableDebugMode: boolean;
    customizations?: Record<string, any>;
  };
  validation: {
    runTests: boolean;
    validateGovernance: boolean;
    performanceCheck: boolean;
    securityScan: boolean;
  };
}

/**
 * Deployment package information
 */
export interface DeploymentPackage {
  id: string;
  wrapperId: string;
  format: string;
  version: string;
  size: number;
  checksum: string;
  path: string;
  metadata: {
    createdAt: Date;
    expiresAt?: Date;
    downloadCount: number;
    lastDownloaded?: Date;
  };
  validation: {
    tested: boolean;
    governanceValidated: boolean;
    performanceValidated: boolean;
    securityValidated: boolean;
    validationResults?: Record<string, any>;
  };
}

/**
 * Dual wrapper creation request
 */
export interface CreateDualWrapperRequest {
  baseAgent: {
    name: string;
    description: string;
    provider: string;
    model: string;
    configuration: Record<string, any>;
  };
  governanceConfig: GovernanceConfiguration;
  exportConfig?: ExportConfiguration;
  metadata?: {
    tags?: string[];
    description?: string;
  };
}

/**
 * Dual wrapper update request
 */
export interface UpdateDualWrapperRequest {
  wrapperId: string;
  updates: {
    baseAgent?: Partial<DualAgentWrapper['baseAgent']>;
    governanceConfig?: Partial<GovernanceConfiguration>;
    metadata?: Partial<DualAgentWrapper['metadata']>;
  };
  regenerateDeployment?: boolean;
}

/**
 * Wrapper query filters
 */
export interface WrapperQueryFilters {
  userId?: string;
  status?: DualAgentWrapper['status']['testingStatus'] | DualAgentWrapper['status']['deploymentStatus'];
  provider?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  hasDeployment?: boolean;
  complianceLevel?: GovernanceConfiguration['complianceLevel'];
}

/**
 * Wrapper query result
 */
export interface WrapperQueryResult {
  wrappers: DualAgentWrapper[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export default {
  // Export all types for easy importing
  PolicyDefinition,
  PolicyRule,
  TrustConfiguration,
  TrustFactor,
  AuditConfiguration,
  AuditDestination,
  GovernanceConfiguration,
  EmergencyControlConfig,
  EmergencyTrigger,
  EmergencyAction,
  TestingWrapper,
  DeploymentWrapper,
  DualAgentWrapper,
  GovernanceEngineState,
  PolicyViolation,
  AgentInteraction,
  GovernedInteractionResult,
  PolicyCheckResult,
  GovernanceCheckResult,
  ExportConfiguration,
  DeploymentPackage,
  CreateDualWrapperRequest,
  UpdateDualWrapperRequest,
  WrapperQueryFilters,
  WrapperQueryResult
};

