/**
 * Extended types for Multi-Agent System governance
 */

import { 
  AgentIdentity, 
  AgentAttestation, 
  ScorecardMetric, 
  ScorecardContext, 
  AgentScorecardResult 
} from './index';

// Multi-Agent System Identity Types
export interface MultiAgentSystemIdentity {
  id: string; // Unique system-generated multi-agent system ID
  name: string; // Human-readable name
  version: string;
  description?: string;
  ownerId: string; // User or team responsible for the system
  tags?: string[];
  creationDate: Date;
  lastModifiedDate: Date;
  status: 'active' | 'inactive' | 'deprecated' | 'experimental';
  
  // Multi-Agent System specific attributes
  systemType: 'sequential' | 'parallel' | 'conditional' | 'custom';
  agentIds: string[]; // References to individual agent identities
  agentRoles: Record<string, string>; // agentId -> role in this system
  workflowDefinition: SystemWorkflow;
  
  // Governance-specific attributes
  governanceProfileId?: string;
  systemAttestations?: SystemAttestation[];
  systemRoles?: string[];
}

export interface SystemWorkflow {
  type: 'sequential' | 'parallel' | 'conditional' | 'custom';
  steps: WorkflowStep[];
  dataFlow: DataFlowMapping[];
  errorHandling: ErrorHandlingStrategy;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  order: number;
  conditions?: WorkflowCondition[];
  timeout?: number; // milliseconds
}

export interface DataFlowMapping {
  fromAgentId: string;
  toAgentId: string;
  dataMapping: Record<string, string>; // output field -> input field
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  nextStepId?: string;
}

export interface ErrorHandlingStrategy {
  strategy: 'fallback' | 'retry' | 'abort';
  maxRetries?: number;
  fallbackAgentId?: string;
  timeoutMs?: number;
}

// Multi-Agent System Attestations
export interface SystemAttestation extends AgentAttestation {
  systemId: string;
  attestationType: 'workflow_compliance' | 'data_flow_validation' | 'cross_agent_security' | 'system_performance';
  affectedAgentIds?: string[]; // Which agents this attestation covers
}

// Multi-Agent System Scorecard Types
export interface SystemScorecardMetric extends ScorecardMetric {
  systemSpecific: true;
  aggregationType: 'average' | 'weighted_average' | 'min' | 'max' | 'custom';
  // For system-level metrics that depend on individual agent performance
  agentMetricDependencies?: string[]; // Individual agent metric IDs
}

export interface SystemScorecardResult extends AgentScorecardResult {
  systemId: string;
  agentResults: Record<string, AgentScorecardResult>; // agentId -> individual results
  systemMetrics: Record<string, {
    value: number | boolean | string;
    score?: number;
    status?: 'critical' | 'warning' | 'normal';
    contributingAgents?: string[]; // Which agents contributed to this metric
  }>;
  workflowEfficiency?: number; // 0-100 score for workflow performance
  crossAgentTrust?: number; // 0-100 score for inter-agent trust
  coordinationScore?: number; // 0-100 score for agent coordination
}

// Default System-Level Metrics
export const DEFAULT_SYSTEM_METRICS: SystemScorecardMetric[] = [
  {
    id: 'workflow_efficiency',
    name: 'Workflow Efficiency',
    description: 'How efficiently the multi-agent system completes workflows',
    category: 'Performance',
    valueType: 'percentage',
    systemSpecific: true,
    aggregationType: 'custom',
    calculate: async (systemId: string, context: ScorecardContext) => {
      // Implementation would calculate based on workflow completion times
      return 85; // Mock value
    },
    interpretationRule: {
      direction: 'higher_is_better',
      thresholds: {
        warning: 70,
        critical: 50
      }
    },
    visualizationHint: 'gauge',
    weight: 0.3
  },
  {
    id: 'cross_agent_trust',
    name: 'Cross-Agent Trust',
    description: 'Trust score between agents in the system',
    category: 'Trust',
    valueType: 'percentage',
    systemSpecific: true,
    aggregationType: 'weighted_average',
    agentMetricDependencies: ['trust_score'],
    calculate: async (systemId: string, context: ScorecardContext) => {
      // Implementation would aggregate individual agent trust scores
      return 88; // Mock value
    },
    interpretationRule: {
      direction: 'higher_is_better',
      thresholds: {
        warning: 75,
        critical: 60
      }
    },
    visualizationHint: 'gauge',
    weight: 0.25
  },
  {
    id: 'coordination_score',
    name: 'Agent Coordination',
    description: 'How well agents coordinate and communicate',
    category: 'Coordination',
    valueType: 'percentage',
    systemSpecific: true,
    aggregationType: 'custom',
    calculate: async (systemId: string, context: ScorecardContext) => {
      // Implementation would analyze agent communication patterns
      return 92; // Mock value
    },
    interpretationRule: {
      direction: 'higher_is_better',
      thresholds: {
        warning: 80,
        critical: 65
      }
    },
    visualizationHint: 'gauge',
    weight: 0.25
  },
  {
    id: 'system_compliance',
    name: 'System Compliance',
    description: 'Overall compliance of the multi-agent system',
    category: 'Compliance',
    valueType: 'percentage',
    systemSpecific: true,
    aggregationType: 'min', // System is only as compliant as least compliant agent
    agentMetricDependencies: ['compliance_score'],
    calculate: async (systemId: string, context: ScorecardContext) => {
      // Implementation would check all agents' compliance
      return 94; // Mock value
    },
    interpretationRule: {
      direction: 'higher_is_better',
      thresholds: {
        warning: 90,
        critical: 80
      }
    },
    visualizationHint: 'gauge',
    weight: 0.2
  }
];

// Agent Profile Types (for UI)
export interface AgentProfile {
  identity: AgentIdentity;
  latestScorecard?: AgentScorecardResult;
  attestationCount: number;
  lastActivity?: Date;
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'high' | 'medium' | 'low';
}

export interface SystemProfile {
  identity: MultiAgentSystemIdentity;
  latestScorecard?: SystemScorecardResult;
  attestationCount: number;
  lastActivity?: Date;
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'high' | 'medium' | 'low';
  agentProfiles: AgentProfile[]; // Individual agents in this system
}

export type ProfileType = 'agent' | 'system';

export interface CombinedProfile {
  type: ProfileType;
  agent?: AgentProfile;
  system?: SystemProfile;
}

