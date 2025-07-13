/**
 * Extended Agent Wrapper types with introspection capabilities
 * These extend the base types to include auto-discovered agent information
 */

import { AgentWrapper, Schema, ValidationResult, ValidationError, WrapperContext, WrapperMetrics } from './index';

/**
 * Auto-discovered agent capabilities
 */
export interface AgentCapabilities {
  // Core capabilities
  canChat: boolean;
  canGenerateCode: boolean;
  canAnalyzeData: boolean;
  canGenerateImages: boolean;
  canProcessFiles: boolean;
  canAccessInternet: boolean;
  canExecuteCode: boolean;
  canManageMemory: boolean;
  
  // Advanced capabilities
  supportsStreaming: boolean;
  supportsMultimodal: boolean;
  supportsFunctionCalling: boolean;
  supportsSystemPrompts: boolean;
  supportsTemperatureControl: boolean;
  supportsTokenLimits: boolean;
  
  // Custom capabilities (discovered from API)
  customCapabilities: string[];
}

/**
 * Agent tool/function definition
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  category: 'built-in' | 'plugin' | 'custom';
  isEnabled: boolean;
  lastUsed?: Date;
  usageCount?: number;
}

/**
 * Agent model specifications
 */
export interface AgentModelSpecs {
  // Basic specs
  modelName: string;
  modelVersion?: string;
  provider: string;
  
  // Context and limits
  maxContextLength: number;
  maxOutputTokens: number;
  inputTokenCost?: number;
  outputTokenCost?: number;
  
  // Capabilities
  trainingDataCutoff?: string;
  supportedLanguages: string[];
  knowledgeDomains: string[];
  
  // Performance characteristics
  averageResponseTime?: number;
  reliabilityScore?: number;
  safetyRating?: string;
}

/**
 * API endpoint information
 */
export interface ApiEndpointInfo {
  baseUrl: string;
  version: string;
  authMethod: 'api-key' | 'oauth' | 'bearer' | 'custom';
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay?: number;
    tokensPerMinute?: number;
  };
  availableEndpoints: {
    path: string;
    method: string;
    description: string;
    parameters: Record<string, any>;
  }[];
  healthCheckEndpoint?: string;
  documentationUrl?: string;
}

/**
 * Governance compatibility information
 */
export interface GovernanceCompatibility {
  supportsAuditLogging: boolean;
  supportsContentFiltering: boolean;
  supportsPolicyEnforcement: boolean;
  supportsUsageTracking: boolean;
  supportsComplianceReporting: boolean;
  
  // Specific governance features
  canExplainReasoning: boolean;
  providesConfidenceScores: boolean;
  supportsHumanInTheLoop: boolean;
  allowsCustomPolicies: boolean;
  
  // Compliance standards
  supportedStandards: string[]; // e.g., ['GDPR', 'HIPAA', 'SOX']
  certifications: string[];
}

/**
 * Agent introspection data - auto-discovered information
 */
export interface AgentIntrospectionData {
  // Discovery metadata
  discoveredAt: Date;
  discoveryMethod: 'api-introspection' | 'manual' | 'documentation-parsing';
  lastUpdated: Date;
  discoveryVersion: string;
  
  // Core agent information
  capabilities: AgentCapabilities;
  availableTools: AgentTool[];
  modelSpecs: AgentModelSpecs;
  apiInfo: ApiEndpointInfo;
  governanceCompatibility: GovernanceCompatibility;
  
  // Additional metadata
  tags: string[];
  categories: string[];
  useCases: string[];
  limitations: string[];
  
  // Validation status
  isValidated: boolean;
  validationErrors: string[];
  lastValidation?: Date;
}

/**
 * Extended Agent Wrapper with introspection data
 */
export interface ExtendedAgentWrapper extends AgentWrapper {
  // Auto-discovered data
  introspectionData?: AgentIntrospectionData;
  
  // Manual overrides
  manualOverrides?: Partial<AgentIntrospectionData>;
  
  // Discovery settings
  autoDiscoveryEnabled: boolean;
  discoverySchedule?: 'never' | 'daily' | 'weekly' | 'monthly';
  lastDiscoveryAttempt?: Date;
  
  // Enhanced metadata
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Performance tracking
  performanceMetrics?: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    lastUsed?: Date;
    totalUsage: number;
  };
}

/**
 * Scorecard data structure with introspection fields
 */
export interface ExtendedScorecardData {
  // Basic scorecard info
  agentId: string;
  agentName: string;
  generatedAt: Date;
  version: string;
  
  // Governance identity integration
  governanceIdentityId?: string; // Links to governance identity system
  governanceDisplayNumber?: string; // Human-readable governance ID for display (e.g., "GID-123456-ABCD")
  
  // Core scores
  overallScore: number;
  trustScore: number;
  performanceScore: number;
  governanceScore: number;
  capabilityScore: number;
  
  // Detailed metrics from introspection
  capabilityMetrics: {
    discoveredCapabilities: number;
    verifiedCapabilities: number;
    capabilityAccuracy: number;
    toolsAvailable: number;
    toolsVerified: number;
  };
  
  // API health metrics
  apiMetrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    rateLimitCompliance: number;
  };
  
  // Governance metrics
  governanceMetrics: {
    policyCompliance: number;
    auditTrailCompleteness: number;
    transparencyScore: number;
    safetyRating: number;
  };
  
  // Model performance
  modelMetrics: {
    accuracyScore: number;
    consistencyScore: number;
    biasScore: number;
    hallucinationRate: number;
  };
  
  // Recommendations
  recommendations: {
    type: 'improvement' | 'warning' | 'optimization';
    category: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    actionRequired: boolean;
  }[];
  
  // Introspection status
  introspectionStatus: {
    lastDiscovery: Date;
    discoverySuccess: boolean;
    dataCompleteness: number;
    validationStatus: 'passed' | 'failed' | 'partial';
  };
}

/**
 * Multi-agent system with introspection
 */
export interface ExtendedMultiAgentSystem {
  id: string;
  name: string;
  description: string;
  
  // Agent composition
  agents: {
    agentId: string;
    role: 'primary' | 'secondary' | 'specialist' | 'coordinator';
    weight: number;
    introspectionData?: AgentIntrospectionData;
  }[];
  
  // System-level capabilities (derived from agents)
  systemCapabilities: AgentCapabilities;
  combinedTools: AgentTool[];
  
  // Coordination patterns
  coordinationPattern: 'sequential' | 'parallel' | 'hierarchical' | 'consensus';
  communicationProtocol: string;
  
  // System metrics
  systemMetrics: {
    coherenceScore: number;
    efficiencyScore: number;
    redundancyScore: number;
    complementarityScore: number;
  };
  
  // Governance for the system
  systemGovernance: {
    consensusRequired: boolean;
    majorityThreshold?: number;
    escalationRules: string[];
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  lastUsed?: Date;
}

/**
 * Agent discovery service interface
 */
export interface AgentDiscoveryService {
  // Discover agent capabilities from API
  discoverAgent(apiEndpoint: string, apiKey: string, provider: string): Promise<AgentIntrospectionData>;
  
  // Validate discovered data
  validateDiscoveredData(data: AgentIntrospectionData): Promise<ValidationResult>;
  
  // Update existing agent with new discovery data
  updateAgentIntrospection(agentId: string, data: AgentIntrospectionData): Promise<boolean>;
  
  // Schedule periodic discovery
  scheduleDiscovery(agentId: string, schedule: string): Promise<boolean>;
  
  // Get discovery history
  getDiscoveryHistory(agentId: string): Promise<AgentIntrospectionData[]>;
}

/**
 * Wizard form data with introspection fields
 */
export interface ExtendedWizardFormData {
  // Basic agent info
  agentName: string;
  description: string;
  provider: string;
  apiEndpoint: string;
  authMethod: string;
  apiKey: string;
  model: string;
  
  // Auto-discovery settings
  enableAutoDiscovery: boolean;
  discoverySchedule: 'never' | 'daily' | 'weekly' | 'monthly';
  
  // Discovered data (populated automatically)
  discoveredCapabilities?: AgentCapabilities;
  discoveredTools?: AgentTool[];
  discoveredSpecs?: AgentModelSpecs;
  discoveredApiInfo?: ApiEndpointInfo;
  discoveredGovernance?: GovernanceCompatibility;
  
  // Manual overrides
  manualCapabilityOverrides?: Partial<AgentCapabilities>;
  disabledTools?: string[];
  customTags?: string[];
  
  // Schema (can be auto-generated from discovery)
  inputSchema: any;
  outputSchema: any;
  autoGenerateSchema: boolean;
  
  // Governance
  trustThreshold: number;
  complianceLevel: string;
  enableLogging: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  
  // Advanced settings
  enableIntrospectionMonitoring: boolean;
  scorecardGenerationEnabled: boolean;
  performanceTrackingEnabled: boolean;
  
  // Review data
  estimatedCost: string;
  securityScore: number;
  capabilityScore?: number;
  governanceCompatibilityScore?: number;
}

