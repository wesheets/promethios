/**
 * Extended Multi-Agent System types with governance identity numbers
 * Adds governance identity integration to existing multi-agent system types
 */

import { 
  MultiAgentSystemIdentity,
  SystemScorecardResult,
  SystemAttestation,
  SystemWorkflow 
} from './multiAgent';
import { ExtendedScorecardData } from '../../agent-wrapping/types/introspection';

/**
 * Extended Multi-Agent System Identity with governance integration
 */
export interface ExtendedMultiAgentSystemIdentity extends MultiAgentSystemIdentity {
  // Governance identity integration
  systemGovernanceIdentityNumber?: string; // Human-readable governance ID (e.g., SGID-123456-A7B2)
  
  // Enhanced metadata
  enabled: boolean;
  lastUsed?: Date;
  totalExecutions?: number;
  
  // Component agent governance IDs (not just agent IDs)
  componentAgentGovernanceIds: string[]; // Links to individual agent governance identities
  
  // System-level governance data
  systemGovernanceProfile?: {
    complianceLevel: 'basic' | 'standard' | 'strict' | 'custom';
    auditLevel: 'minimal' | 'standard' | 'comprehensive';
    dataRetentionDays: number;
    requiresHumanApproval: boolean;
    allowedOperations: string[];
    restrictedOperations: string[];
  };
  
  // Performance tracking
  systemPerformanceMetrics?: {
    averageExecutionTime: number;
    successRate: number;
    errorRate: number;
    lastExecutionTime?: Date;
    totalExecutions: number;
  };
  
  // Auto-discovery settings for system capabilities
  autoDiscoveryEnabled: boolean;
  discoverySchedule?: 'never' | 'daily' | 'weekly' | 'monthly';
  lastDiscoveryAttempt?: Date;
}

/**
 * Extended System Scorecard with governance identity numbers
 */
export interface ExtendedSystemScorecardData extends SystemScorecardResult {
  // Governance identity integration
  systemGovernanceIdentityNumber?: string; // Display number for the system
  componentAgentGovernanceNumbers?: Record<string, string>; // agentId -> governance number
  
  // Enhanced system metrics
  systemLevelMetrics: {
    // Governance metrics
    systemGovernanceScore: number;
    componentGovernanceAlignment: number; // How well component agents align with system governance
    policyConsistency: number; // Consistency of policy enforcement across agents
    auditTrailCompleteness: number;
    
    // Performance metrics
    systemEfficiencyScore: number;
    resourceUtilization: number;
    scalabilityScore: number;
    
    // Coordination metrics
    agentSynchronization: number;
    communicationEfficiency: number;
    conflictResolution: number;
    
    // Trust and security
    systemTrustScore: number;
    securityPosture: number;
    dataIntegrityScore: number;
  };
  
  // Component agent analysis
  componentAgentAnalysis: {
    strongestAgent: {
      agentId: string;
      governanceId: string;
      score: number;
      strengths: string[];
    };
    weakestAgent: {
      agentId: string;
      governanceId: string;
      score: number;
      weaknesses: string[];
    };
    averageComponentScore: number;
    scoreVariance: number;
  };
  
  // System-level recommendations
  systemRecommendations: {
    type: 'optimization' | 'governance' | 'security' | 'performance' | 'coordination';
    category: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    affectedComponents: string[]; // Which agents this affects
    estimatedImpact: 'low' | 'medium' | 'high';
    actionRequired: boolean;
    estimatedEffort: 'low' | 'medium' | 'high';
  }[];
  
  // Compliance and attestation status
  complianceStatus: {
    overallCompliance: number;
    componentCompliance: Record<string, number>; // agentId -> compliance score
    failingPolicies: string[];
    attestationCoverage: number;
    lastAudit?: Date;
    nextAuditDue?: Date;
  };
  
  // System evolution tracking
  evolutionMetrics: {
    systemMaturity: number; // How mature/stable the system is
    adaptabilityScore: number; // How well it adapts to changes
    learningRate: number; // How quickly it improves
    stabilityScore: number; // How consistent performance is
  };
}

/**
 * Multi-Agent System Governance Profile
 */
export interface MultiAgentSystemGovernanceProfile {
  systemGovernanceId: string;
  profileName: string;
  description?: string;
  
  // System-level policies
  systemPolicies: {
    dataSharing: 'none' | 'limited' | 'full';
    crossAgentCommunication: 'restricted' | 'monitored' | 'open';
    decisionMaking: 'consensus' | 'majority' | 'hierarchical' | 'autonomous';
    errorHandling: 'fail-fast' | 'graceful-degradation' | 'retry-cascade';
    resourceSharing: 'isolated' | 'shared' | 'pooled';
  };
  
  // Compliance requirements
  complianceRequirements: {
    requiredStandards: string[]; // e.g., ['GDPR', 'HIPAA', 'SOX']
    auditFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    reportingLevel: 'basic' | 'detailed' | 'comprehensive';
    retentionPeriod: number; // days
  };
  
  // Security settings
  securitySettings: {
    encryptionRequired: boolean;
    accessControl: 'none' | 'basic' | 'rbac' | 'abac';
    networkIsolation: boolean;
    threatDetection: boolean;
    incidentResponse: boolean;
  };
  
  // Performance requirements
  performanceRequirements: {
    maxExecutionTime: number; // milliseconds
    maxMemoryUsage: number; // MB
    maxConcurrentOperations: number;
    availabilityTarget: number; // percentage
    throughputTarget: number; // operations per second
  };
}

/**
 * System Governance Event
 */
export interface SystemGovernanceEvent {
  id: string;
  systemGovernanceId: string;
  eventType: 'policy_violation' | 'performance_degradation' | 'security_incident' | 'compliance_failure' | 'coordination_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
  affectedComponents: string[]; // Which agents were affected
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * System Discovery Data - auto-discovered system capabilities
 */
export interface SystemDiscoveryData {
  discoveredAt: Date;
  discoveryMethod: 'system-introspection' | 'component-aggregation' | 'manual';
  lastUpdated: Date;
  discoveryVersion: string;
  
  // System-level capabilities (derived from components)
  systemCapabilities: {
    canProcessParallelWorkflows: boolean;
    canHandleConditionalLogic: boolean;
    canMaintainState: boolean;
    canRecoverFromFailures: boolean;
    canScaleDynamically: boolean;
    canLearnFromExperience: boolean;
    canOptimizePerformance: boolean;
    canSelfMonitor: boolean;
  };
  
  // Component agent summary
  componentSummary: {
    totalAgents: number;
    agentTypes: Record<string, number>; // type -> count
    totalCapabilities: number;
    sharedCapabilities: string[];
    uniqueCapabilities: Record<string, string[]>; // agentId -> unique capabilities
  };
  
  // System architecture insights
  architectureInsights: {
    communicationPatterns: string[];
    dataFlowComplexity: 'simple' | 'moderate' | 'complex';
    coordinationOverhead: 'low' | 'medium' | 'high';
    scalabilityBottlenecks: string[];
    performanceOptimizations: string[];
  };
  
  // Governance readiness
  governanceReadiness: {
    auditability: number; // 0-100
    transparency: number; // 0-100
    controllability: number; // 0-100
    accountability: number; // 0-100
    explainability: number; // 0-100
  };
  
  // Validation status
  isValidated: boolean;
  validationErrors: string[];
  lastValidation?: Date;
}

/**
 * Extended wizard form data for multi-agent systems
 */
export interface ExtendedMultiAgentWizardFormData {
  // Basic system info
  systemName: string;
  description: string;
  version: string;
  systemType: 'sequential' | 'parallel' | 'conditional' | 'custom';
  
  // Component agents
  selectedAgents: {
    agentId: string;
    governanceId: string;
    role: string;
    weight: number;
  }[];
  
  // Workflow configuration
  workflowDefinition: SystemWorkflow;
  
  // Auto-discovery settings
  enableAutoDiscovery: boolean;
  discoverySchedule: 'never' | 'daily' | 'weekly' | 'monthly';
  
  // Discovered data (populated automatically)
  discoveredSystemCapabilities?: SystemDiscoveryData['systemCapabilities'];
  discoveredArchitecture?: SystemDiscoveryData['architectureInsights'];
  discoveredGovernanceReadiness?: SystemDiscoveryData['governanceReadiness'];
  
  // Governance settings
  governanceProfile: MultiAgentSystemGovernanceProfile;
  complianceLevel: 'basic' | 'standard' | 'strict' | 'custom';
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
  
  // Performance settings
  performanceRequirements: {
    maxExecutionTime: number;
    maxMemoryUsage: number;
    availabilityTarget: number;
  };
  
  // Security settings
  securitySettings: {
    encryptionRequired: boolean;
    accessControl: 'none' | 'basic' | 'rbac' | 'abac';
    networkIsolation: boolean;
  };
  
  // Advanced settings
  enableSystemMonitoring: boolean;
  enablePerformanceOptimization: boolean;
  enableAutomaticScaling: boolean;
  
  // Review data
  estimatedSystemScore: number;
  governanceCompatibilityScore: number;
  systemComplexityScore: number;
  estimatedOperationalCost: string;
}

