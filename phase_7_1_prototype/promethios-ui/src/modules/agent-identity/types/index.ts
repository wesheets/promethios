/**
 * Core types and interfaces for Agent Identity and Governance modules
 */

// Agent Identity Types
export interface AgentIdentity {
  id: string; // Unique system-generated agent ID
  name: string; // Human-readable name
  version: string;
  description?: string;
  ownerId: string; // User or team responsible for the agent
  tags?: string[];
  creationDate: Date;
  lastModifiedDate: Date;
  status: 'active' | 'inactive' | 'deprecated' | 'experimental';
  // Link to the actual model or service endpoint
  modelLink?: AgentModelLink;
  // Governance-specific attributes
  governanceProfileId?: string; // Links to a set of applicable governance rules/policies
  attestations?: AgentAttestation[];
  assignedRoles?: string[]; // Roles within Promethios or specific use cases
}

export interface AgentModelLink {
  type: 'api_endpoint' | 'internal_model_id' | 'custom_wrapper_id';
  identifier: string; // URL, model ID, wrapper ID
  credentialsId?: string; // Reference to stored credentials if needed
}

export interface AgentFilter {
  ownerId?: string;
  status?: string;
  tagsInclude?: string[];
}

// Agent Attestation Types
export interface AgentAttestation {
  id: string;
  type: string; // e.g., "SecurityAuditPass", "BiasTestCertification", "GDPRCompliant"
  issuer: string; // Who issued the attestation
  issueDate: Date;
  expiryDate?: Date;
  evidenceLink?: string; // URL to supporting documents/reports
  status: 'active' | 'expired' | 'revoked';
  revocationReason?: string;
}

// Agent Role Types
export interface AgentRoleDefinition {
  id: string; // e.g., "customer-support-chatbot", "financial-advisor-bot"
  name: string;
  description: string;
  // Permissions or capabilities associated with this role within Promethios
  permissions?: string[];
}

// Scorecard Types
export interface ScorecardMetric {
  id: string; // Unique metric ID (e.g., "accuracy", "bias-fairness", "response-time")
  name: string; // Display name (e.g., "Accuracy Score", "Fairness Index")
  description: string;
  category: string; // (e.g., "Performance", "Fairness", "Robustness", "Compliance")
  valueType: 'percentage' | 'score' | 'boolean' | 'duration' | 'custom';
  // How to calculate the metric for a given agent and context
  calculate: (agentId: string, context: ScorecardContext) => Promise<number | boolean | string>;
  // How to interpret the value (e.g., higher is better, lower is better, target range)
  interpretationRule?: {
    direction: 'higher_is_better' | 'lower_is_better' | 'target_range';
    targetValue?: number;
    targetRange?: [number, number];
    thresholds?: {
      warning: number | [number, number];
      critical: number | [number, number];
    };
  };
  // How to visualize this metric (e.g., gauge, bar, trend)
  visualizationHint?: string;
  // Weight of this metric in an overall score (0-1)
  weight?: number;
}

export interface ScorecardContext {
  timePeriod?: { start: Date; end: Date };
  datasetId?: string; // For evaluations against specific datasets
  useCaseId?: string; // For context-specific evaluations
  customFilters?: Record<string, any>;
}

export interface ScorecardTemplate {
  id: string;
  name: string;
  description: string;
  metricIds: string[]; // List of ScorecardMetric IDs included in this template
  // Custom weights for metrics in this template, overriding default metric weights
  metricWeights?: Record<string, number>;
}

export interface AgentScorecardResult {
  agentId: string;
  templateId: string;
  evaluationTimestamp: Date;
  context: ScorecardContext;
  overallScore?: number; // Calculated based on weighted metrics
  metricValues: Record<string, { 
    value: number | boolean | string; 
    score?: number; 
    status?: 'critical' | 'warning' | 'normal' 
  }>;
  // Qualitative feedback or notes
  notes?: string;
}

export interface AgentComparisonResult extends AgentScorecardResult {
  rank?: number;
}

// Custom Attribute Types for Extensions
export interface CustomAttribute {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  required?: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}

export interface AttestationTypeDefinition {
  id: string;
  name: string;
  description: string;
  requiredFields?: string[];
  validityPeriod?: number; // Days
  autoRenewal?: boolean;
}

