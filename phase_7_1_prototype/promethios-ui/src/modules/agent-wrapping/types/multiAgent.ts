/**
 * Types for Multi-Agent System functionality
 */

import { AgentWrapper, WrapperMetrics } from './index';

/**
 * Collaboration models for multi-agent systems
 */
export type CollaborationModel = 
  | 'shared_context'
  | 'sequential_handoffs' 
  | 'parallel_processing'
  | 'hierarchical_coordination'
  | 'consensus_decision'
  | 'custom';

/**
 * Enhanced execution flow types
 */
export type FlowType = 
  | 'sequential' 
  | 'parallel' 
  | 'conditional' 
  | 'hybrid'
  | 'event_driven'
  | 'custom';

/**
 * Collaboration model configuration
 */
export interface CollaborationConfig {
  // Type of collaboration model
  model: CollaborationModel;
  
  // Model-specific settings
  settings: {
    // Shared Context settings
    sharedContext?: {
      contextScope: 'full' | 'filtered' | 'summary';
      contextRetention: number; // messages to retain
      realTimeUpdates: boolean;
    };
    
    // Sequential Handoffs settings
    sequentialHandoffs?: {
      handoffValidation: boolean;
      qualityGates: string[];
      timeoutHandling: 'skip' | 'retry' | 'escalate';
    };
    
    // Parallel Processing settings
    parallelProcessing?: {
      resultAggregation: 'merge' | 'vote' | 'weighted' | 'custom';
      synchronizationPoints: string[];
      loadBalancing: boolean;
    };
    
    // Hierarchical Coordination settings
    hierarchicalCoordination?: {
      leaderAgentId: string;
      delegationRules: string[];
      escalationProcedures: string[];
    };
    
    // Consensus Decision settings
    consensusDecision?: {
      votingMechanism: 'majority' | 'unanimous' | 'weighted' | 'custom';
      conflictResolution: 'escalate' | 'retry' | 'default';
      quorumRequirement: number;
    };
  };
}

/**
 * Enhanced governance configuration
 */
export interface GovernanceConfig {
  // Trust management
  trustManagement: {
    minimumTrustThreshold: number;
    trustVerificationProtocols: string[];
    trustRecoveryMechanisms: string[];
  };
  
  // Policy compliance
  policyCompliance: {
    requiredPolicies: string[];
    complianceValidation: 'strict' | 'moderate' | 'lenient';
    violationHandling: 'block' | 'warn' | 'log';
  };
  
  // Quality assurance
  qualityAssurance: {
    qualityGates: string[];
    validationCriteria: string[];
    reworkProtocols: string[];
  };
  
  // Conflict resolution
  conflictResolution: {
    disagreementProtocols: string[];
    escalationProcedures: string[];
    finalAuthority: 'system' | 'human' | 'vote';
  };
  
  // Audit and compliance
  auditCompliance: {
    loggingRequirements: string[];
    auditTrailStandards: 'minimal' | 'standard' | 'comprehensive';
    complianceReporting: string[];
  };
}

/**
 * System testing configuration
 */
export interface TestingConfig {
  // Test scenarios
  testScenarios: {
    id: string;
    name: string;
    description: string;
    inputData: any;
    expectedOutcome: any;
    validationCriteria: string[];
  }[];
  
  // Performance benchmarks
  performanceBenchmarks: {
    maxResponseTime: number;
    minTrustScore: number;
    maxErrorRate: number;
    minUptime: number;
  };
  
  // Integration tests
  integrationTests: {
    apiEndpoints: string[];
    databaseConnections: string[];
    externalServices: string[];
  };
}

/**
 * Deployment readiness checklist
 */
export interface DeploymentReadiness {
  agentConfiguration: {
    rolesDefinedAndValidated: boolean;
    capabilitiesConfigured: boolean;
    apiEndpointsValidated: boolean;
    authenticationSetup: boolean;
  };
  
  collaborationModel: {
    patternSelectedAndConfigured: boolean;
    communicationProtocolsEstablished: boolean;
    handoffProceduresDefined: boolean;
    coordinationMechanismsTested: boolean;
  };
  
  governanceFramework: {
    trustThresholdsConfigured: boolean;
    policyComplianceRulesEstablished: boolean;
    qualityGatesDefined: boolean;
    conflictResolutionProtocolsInPlace: boolean;
    auditRequirementsConfigured: boolean;
  };
  
  systemIntegration: {
    externalApiIntegrationsTested: boolean;
    databaseConnectionsValidated: boolean;
    securityConfigurationsVerified: boolean;
    performanceBenchmarksEstablished: boolean;
  };
  
  monitoringAndMaintenance: {
    healthCheckEndpointsConfigured: boolean;
    errorHandlingAndRecoveryProcedures: boolean;
    performanceMonitoringSetup: boolean;
    updateAndMaintenanceProceduresDefined: boolean;
  };
}

/**
 * Role definition for an agent in a multi-agent system
 */
export interface AgentRole {
  // Unique identifier for the role
  id: string;
  
  // Name of the role
  name: string;
  
  // Description of the role
  description: string;
  
  // Responsibilities of this role
  responsibilities: string[];
  
  // Input types this role can handle
  inputTypes: string[];
  
  // Output types this role produces
  outputTypes: string[];
}

/**
 * Flow connection between agents
 */
export interface AgentConnection {
  // Source agent ID
  sourceAgentId: string;
  
  // Target agent ID
  targetAgentId: string;
  
  // Source output field
  sourceField: string;
  
  // Target input field
  targetField: string;
  
  // Optional transformation function
  transform?: string;
  
  // Condition for this connection (optional)
  condition?: string;
}

/**
 * Enhanced multi-agent system configuration
 */
export interface MultiAgentSystem {
  // Unique identifier for the system
  id: string;
  
  // Name of the system
  name: string;
  
  // Description of the system
  description: string;
  
  // Version of the system
  version: string;
  
  // Collaboration model configuration
  collaborationConfig: CollaborationConfig;
  
  // Type of execution flow
  flowType: FlowType;
  
  // Agents in this system
  agents: {
    // Agent wrapper ID
    agentId: string;
    
    // Role assigned to this agent
    role: AgentRole;
    
    // Position in the flow (for UI display)
    position: {
      x: number;
      y: number;
    };
  }[];
  
  // Connections between agents
  connections: AgentConnection[];
  
  // Enhanced governance configuration
  governanceConfig: GovernanceConfig;
  
  // Testing configuration
  testingConfig: TestingConfig;
  
  // Deployment readiness status
  deploymentReadiness: DeploymentReadiness;
  
  // System-level metrics
  metrics: WrapperMetrics & {
    // Average system response time
    averageSystemResponseTime: number;
    
    // Agent failure rates
    agentFailureRates: {
      [agentId: string]: number;
    };
    
    // System uptime percentage
    systemUptime: number;
    
    // Collaboration effectiveness metrics
    collaborationMetrics: {
      handoffSuccessRate: number;
      conflictResolutionTime: number;
      consensusAchievementRate: number;
      trustScoreEvolution: number[];
    };
  };
  
  // System status
  enabled: boolean;
  
  // Environment (draft, testing, production)
  environment: 'draft' | 'testing' | 'production';
  
  // User ID (for data isolation)
  userId: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Multi-agent system execution context
 */
export interface MultiAgentExecutionContext {
  // System ID
  systemId: string;
  
  // Execution ID
  executionId: string;
  
  // User ID
  userId: string;
  
  // Session ID
  sessionId: string;
  
  // Input data
  inputData: any;
  
  // Execution start time
  startTime: number;
  
  // Current step in execution
  currentStep: number;
  
  // Agent execution states
  agentStates: {
    [agentId: string]: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      startTime?: number;
      endTime?: number;
      input?: any;
      output?: any;
      error?: string;
      trustScore?: number;
      governanceChecks?: string[];
    };
  };
  
  // System-level data flow
  dataFlow: {
    [connectionId: string]: {
      data: any;
      timestamp: number;
    };
  };
  
  // Collaboration context
  collaborationContext: {
    sharedMemory?: any;
    conversationHistory?: any[];
    consensusState?: any;
    conflictLog?: any[];
  };
}

// Note: Scorecard and Governance Identity modules will be built separately
// and are not included in this core Multi-Agent System implementation

