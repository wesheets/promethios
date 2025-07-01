/**
 * Enhanced Multi-Agent Types for Dual-Wrapping
 * 
 * Extended types that support dual-wrapping patterns for multi-agent systems,
 * including collaborative governance, cross-agent validation, and system-level
 * compliance monitoring.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { MultiAgentSystem, AgentRole, AgentConnection, FlowType } from './multiAgent';
import { DualAgentWrapper, GovernanceConfiguration } from './dualWrapper';
import { MultiAgentGovernanceConfig } from '../services/governance/MultiAgentGovernanceEngine';

/**
 * Enhanced multi-agent system with dual-wrapping support
 */
export interface EnhancedMultiAgentSystem extends MultiAgentSystem {
  // Dual-wrapping configuration
  dualWrappingConfig: {
    enabled: boolean;
    testingSystemId?: string;
    deploymentSystemId?: string;
    governanceLevel: 'basic' | 'standard' | 'strict';
    deploymentTarget: 'internal' | 'external' | 'both';
  };
  
  // Enhanced governance rules
  enhancedGovernanceRules: MultiAgentGovernanceConfig;
  
  // System-level metadata
  systemMetadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    collaborationModel: string;
    systemType: FlowType;
    totalAgents: number;
    activeAgents: string[];
  };
  
  // Deployment configuration
  deploymentConfig?: {
    packageFormat: 'docker' | 'kubernetes' | 'serverless' | 'multi-agent-system';
    dependencies: string[];
    environmentVariables: Record<string, string>;
    scalingConfig: {
      minInstances: number;
      maxInstances: number;
      targetCPU: number;
      targetMemory?: number;
    };
    networkConfig?: {
      allowedPorts: number[];
      securityGroups: string[];
      loadBalancer?: boolean;
    };
  };
}

/**
 * Multi-agent dual wrapper that contains both testing and deployment systems
 */
export interface MultiAgentDualWrapper {
  id: string;
  baseSystem: EnhancedMultiAgentSystem;
  
  // Testing version for chat interface
  testingSystem?: {
    id: string;
    type: 'testing';
    system: EnhancedMultiAgentSystem;
    governanceConfig: GovernanceConfiguration;
    metadata: {
      name: string;
      description: string;
      version: string;
      createdAt: string;
      updatedAt: string;
      tags: string[];
    };
    status: {
      isActive: boolean;
      lastUsed: string;
      usageCount: number;
      errorCount: number;
      lastError: string | null;
    };
  };
  
  // Deployment version for external use
  deploymentSystem?: {
    id: string;
    type: 'deployment';
    system: EnhancedMultiAgentSystem;
    governanceConfig: GovernanceConfiguration;
    governanceEngine: any; // MultiAgentGovernanceEngine
    metadata: {
      name: string;
      description: string;
      version: string;
      createdAt: string;
      updatedAt: string;
      tags: string[];
    };
    status: {
      isActive: boolean;
      lastUsed: string;
      usageCount: number;
      errorCount: number;
      lastError: string | null;
    };
    deploymentConfig: {
      target: 'internal' | 'external' | 'both';
      packageFormat: string;
      dependencies: string[];
      environmentVariables: Record<string, string>;
      scalingConfig: {
        minInstances: number;
        maxInstances: number;
        targetCPU: number;
      };
    };
  };
  
  // Overall metadata
  metadata: {
    name: string;
    description: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    systemType: FlowType;
    collaborationModel: string;
    totalAgents: number;
  };
  
  // Status tracking
  status: {
    testingStatus: 'ready' | 'building' | 'error' | 'disabled';
    deploymentStatus: 'ready' | 'building' | 'deployed' | 'error' | 'disabled';
    lastSync: string;
    syncErrors: string[];
  };
}

/**
 * Enhanced agent role with governance capabilities
 */
export interface EnhancedAgentRole extends AgentRole {
  // Governance-specific role configuration
  governanceRole: {
    canValidateOthers: boolean;
    requiresValidation: boolean;
    trustLevel: 'low' | 'medium' | 'high';
    complianceLevel: 'basic' | 'standard' | 'strict';
    emergencyStopAuthority: boolean;
  };
  
  // Collaboration constraints
  collaborationConstraints: {
    allowedTargets: string[]; // Agent IDs this role can communicate with
    forbiddenTargets: string[]; // Agent IDs this role cannot communicate with
    maxConcurrentInteractions: number;
    requiresConsensus: boolean;
    consensusThreshold: number;
  };
  
  // Performance expectations
  performanceExpectations: {
    maxResponseTime: number; // milliseconds
    minTrustScore: number;
    maxErrorRate: number;
    requiredUptime: number; // percentage
  };
}

/**
 * Enhanced agent connection with governance validation
 */
export interface EnhancedAgentConnection extends AgentConnection {
  // Connection governance
  connectionGovernance: {
    requiresValidation: boolean;
    validationAgents: string[];
    trustThreshold: number;
    auditLevel: 'basic' | 'standard' | 'comprehensive';
  };
  
  // Data flow governance
  dataFlowGovernance: {
    allowedDataTypes: string[];
    forbiddenDataTypes: string[];
    encryptionRequired: boolean;
    auditDataFlow: boolean;
    dataRetentionPolicy: 'none' | 'session' | 'persistent';
  };
  
  // Performance monitoring
  performanceMonitoring: {
    trackLatency: boolean;
    trackThroughput: boolean;
    alertThresholds: {
      maxLatency: number;
      minThroughput: number;
      maxErrorRate: number;
    };
  };
}

/**
 * Multi-agent collaboration session
 */
export interface MultiAgentCollaborationSession {
  id: string;
  systemId: string;
  systemName: string;
  
  // Session metadata
  metadata: {
    startedAt: string;
    endedAt?: string;
    duration?: number;
    initiatedBy: string;
    sessionType: 'testing' | 'deployment' | 'validation';
  };
  
  // Participating agents
  participants: {
    agentId: string;
    role: EnhancedAgentRole;
    joinedAt: string;
    leftAt?: string;
    status: 'active' | 'inactive' | 'error' | 'suspended';
  }[];
  
  // Collaboration flow
  collaborationFlow: {
    currentStep: number;
    totalSteps: number;
    flowType: FlowType;
    stepHistory: {
      stepNumber: number;
      agentId: string;
      action: string;
      timestamp: string;
      result: 'success' | 'failure' | 'warning';
      data?: any;
    }[];
  };
  
  // Governance tracking
  governanceTracking: {
    policiesApplied: string[];
    violationsDetected: {
      policyId: string;
      agentId: string;
      timestamp: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      resolved: boolean;
    }[];
    trustScores: {
      [agentId: string]: {
        current: number;
        history: { timestamp: string; score: number }[];
      };
    };
    complianceRate: number;
    emergencyStopsTriggered: number;
  };
  
  // Performance metrics
  performanceMetrics: {
    totalInteractions: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    consensusAchievementRate: number;
    collaborationEfficiency: number;
  };
}

/**
 * Multi-agent system deployment package
 */
export interface MultiAgentDeploymentPackage {
  id: string;
  systemId: string;
  
  // Package metadata
  metadata: {
    name: string;
    version: string;
    description: string;
    createdAt: string;
    packageFormat: string;
    targetEnvironment: 'internal' | 'external' | 'both';
  };
  
  // System configuration
  systemConfig: EnhancedMultiAgentSystem;
  
  // Agent configurations
  agentConfigs: {
    [agentId: string]: {
      wrapper: DualAgentWrapper;
      role: EnhancedAgentRole;
      connections: EnhancedAgentConnection[];
      governanceConfig: GovernanceConfiguration;
    };
  };
  
  // Deployment artifacts
  deploymentArtifacts: {
    dockerImages?: string[];
    kubernetesManifests?: any[];
    serverlessConfigs?: any[];
    configFiles: {
      filename: string;
      content: string;
      type: 'json' | 'yaml' | 'env' | 'script';
    }[];
  };
  
  // Runtime configuration
  runtimeConfig: {
    environmentVariables: Record<string, string>;
    secrets: Record<string, string>;
    scalingConfig: {
      minInstances: number;
      maxInstances: number;
      targetCPU: number;
      targetMemory?: number;
    };
    networkConfig: {
      allowedPorts: number[];
      securityGroups: string[];
      loadBalancer?: boolean;
    };
    monitoringConfig: {
      metricsEnabled: boolean;
      loggingLevel: 'debug' | 'info' | 'warn' | 'error';
      alertingEnabled: boolean;
      healthCheckInterval: number;
    };
  };
  
  // Governance package
  governancePackage: {
    policies: any[];
    trustConfigurations: any[];
    complianceRules: any[];
    auditConfiguration: any;
    emergencyProcedures: any[];
  };
}

/**
 * Multi-agent system registry entry
 */
export interface MultiAgentSystemRegistryEntry {
  id: string;
  userId: string;
  
  // System information
  systemInfo: {
    name: string;
    description: string;
    version: string;
    systemType: FlowType;
    collaborationModel: string;
    status: 'draft' | 'testing' | 'deployed' | 'archived';
  };
  
  // Dual wrapper reference
  dualWrapper: MultiAgentDualWrapper;
  
  // Usage statistics
  usageStats: {
    totalSessions: number;
    totalInteractions: number;
    averageSessionDuration: number;
    lastUsed: string;
    deploymentCount: number;
  };
  
  // Governance summary
  governanceSummary: {
    overallComplianceRate: number;
    totalViolations: number;
    criticalViolations: number;
    averageTrustScore: number;
    emergencyStopsTriggered: number;
    lastGovernanceReview: string;
  };
  
  // Metadata
  metadata: {
    createdAt: string;
    updatedAt: string;
    tags: string[];
    owner: string;
    collaborators: string[];
    visibility: 'private' | 'team' | 'organization' | 'public';
  };
}

/**
 * Request types for multi-agent dual wrapper operations
 */
export interface CreateMultiAgentDualWrapperRequest {
  userId: string;
  systemConfig: {
    name: string;
    description: string;
    systemType: FlowType;
    collaborationModel: string;
    agents: string[];
    roles: { [agentId: string]: EnhancedAgentRole };
    connections: EnhancedAgentConnection[];
    governanceRules: MultiAgentGovernanceConfig;
  };
  governanceConfig: GovernanceConfiguration;
  options: {
    createTesting: boolean;
    createDeployment: boolean;
    governanceLevel: 'basic' | 'standard' | 'strict';
    deploymentTarget: 'internal' | 'external' | 'both';
  };
}

export interface UpdateMultiAgentDualWrapperRequest {
  wrapperId: string;
  updates: {
    systemConfig?: Partial<EnhancedMultiAgentSystem>;
    governanceConfig?: Partial<GovernanceConfiguration>;
    metadata?: Partial<MultiAgentDualWrapper['metadata']>;
  };
  regenerateDeployment?: boolean;
}

export interface MultiAgentQueryFilters {
  systemType?: FlowType;
  collaborationModel?: string;
  status?: string[];
  tags?: string[];
  governanceLevel?: string[];
  deploymentTarget?: string[];
  minAgents?: number;
  maxAgents?: number;
  createdAfter?: string;
  createdBefore?: string;
  lastUsedAfter?: string;
  limit?: number;
  offset?: number;
}

export interface MultiAgentQueryResult {
  systems: MultiAgentDualWrapper[];
  total: number;
  hasMore: boolean;
  filters: MultiAgentQueryFilters;
}

