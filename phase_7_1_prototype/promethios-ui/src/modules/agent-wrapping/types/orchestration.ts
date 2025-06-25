/**
 * Orchestration Extension for Multi-Agent Systems
 * 
 * Extends the existing multi-agent types with orchestration capabilities.
 * Maintains backward compatibility with existing CollaborationModel and FlowType.
 */

import { 
  CollaborationModel, 
  FlowType, 
  CollaborationConfig, 
  GovernanceConfig 
} from './multiAgent';
import { AgentWrapper } from '../services/AgentWrapperRegistry';

/**
 * Execution status for orchestrated flows
 */
export type ExecutionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Extended agent node for orchestration
 */
export interface OrchestrationNode {
  id: string;
  agentId: string;
  wrapper?: AgentWrapper;
  position: { x: number; y: number };
  status: ExecutionStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  input?: any;
  output?: any;
  retryCount: number;
  maxRetries: number;
}

/**
 * Flow connections between agents
 */
export interface FlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string; // Conditional execution
  weight?: number; // For weighted flows
  dataMapping?: Record<string, string>; // Input/output mapping
}

/**
 * Orchestration context for execution
 */
export interface OrchestrationContext {
  flowId: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  timeout: number; // milliseconds
  governanceConfig: GovernanceConfig;
  collaborationConfig: CollaborationConfig;
  metadata?: Record<string, any>;
}

/**
 * Extended flow definition with orchestration
 */
export interface OrchestrationFlow {
  id: string;
  name: string;
  description: string;
  type: FlowType;
  collaborationModel: CollaborationModel;
  nodes: OrchestrationNode[];
  connections: FlowConnection[];
  entryPointId: string;
  exitPointIds: string[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Backward compatibility
  agents?: string[]; // Legacy agent list
  governanceRules?: any; // Legacy governance rules
}

/**
 * Execution result with detailed metrics
 */
export interface OrchestrationResult {
  flowId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  nodeResults: Map<string, any>;
  finalOutput?: any;
  errors: Array<{
    nodeId: string;
    error: string;
    timestamp: Date;
    retryAttempt: number;
  }>;
  metrics: {
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    skippedNodes: number;
    averageNodeTime: number;
    totalRetries: number;
  };
  governanceReport?: {
    policyViolations: number;
    trustScoreChanges: Record<string, number>;
    complianceScore: number;
  };
}

/**
 * Orchestration events for monitoring
 */
export interface OrchestrationEvent {
  type: 'flow_started' | 'flow_paused' | 'flow_resumed' | 'flow_completed' | 'flow_failed' | 'flow_cancelled' |
        'node_started' | 'node_completed' | 'node_failed' | 'node_retrying' | 'node_skipped' |
        'governance_violation' | 'trust_threshold_breach';
  flowId: string;
  nodeId?: string;
  timestamp: Date;
  data?: any;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Flow validation interface
 */
export interface FlowValidator {
  validateFlow(flow: OrchestrationFlow): Promise<ValidationResult>;
  validateNode(node: OrchestrationNode): Promise<ValidationResult>;
  validateConnection(connection: FlowConnection, nodes: OrchestrationNode[]): Promise<ValidationResult>;
  validateGovernance(flow: OrchestrationFlow, context: OrchestrationContext): Promise<ValidationResult>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * Orchestration engine interface
 */
export interface OrchestrationEngine {
  // Flow execution
  executeFlow(flow: OrchestrationFlow, context: OrchestrationContext): Promise<OrchestrationResult>;
  pauseFlow(flowId: string): Promise<boolean>;
  resumeFlow(flowId: string): Promise<boolean>;
  cancelFlow(flowId: string): Promise<boolean>;
  
  // Flow monitoring
  getFlowStatus(flowId: string): Promise<ExecutionStatus>;
  getFlowResult(flowId: string): Promise<OrchestrationResult | null>;
  getActiveFlows(): Promise<string[]>;
  
  // Event handling
  addEventListener(callback: (event: OrchestrationEvent) => void): void;
  removeEventListener(callback: (event: OrchestrationEvent) => void): void;
  
  // Validation
  validateFlow(flow: OrchestrationFlow): Promise<ValidationResult>;
}

/**
 * Backward compatibility converter
 */
export interface LegacyConverter {
  convertLegacyMultiAgentSystem(legacy: any): OrchestrationFlow;
  convertToLegacyFormat(flow: OrchestrationFlow): any;
}

/**
 * Extension point for custom orchestration strategies
 */
export interface OrchestrationStrategy {
  name: string;
  description: string;
  supportedFlowTypes: FlowType[];
  supportedCollaborationModels: CollaborationModel[];
  
  execute(
    flow: OrchestrationFlow, 
    context: OrchestrationContext,
    engine: OrchestrationEngine
  ): Promise<OrchestrationResult>;
}

/**
 * Registry for orchestration strategies
 */
export interface OrchestrationStrategyRegistry {
  registerStrategy(strategy: OrchestrationStrategy): void;
  getStrategy(flowType: FlowType, collaborationModel: CollaborationModel): OrchestrationStrategy | null;
  listStrategies(): OrchestrationStrategy[];
}

