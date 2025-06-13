/**
 * Types for Multi-Agent System functionality
 */

import { AgentWrapper, WrapperMetrics } from './index';

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
 * Execution flow types
 */
export type FlowType = 'sequential' | 'parallel' | 'conditional' | 'custom';

/**
 * Multi-agent system configuration
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
  
  // System-level governance rules
  governanceRules: {
    // Cross-agent validation enabled
    crossAgentValidation: boolean;
    
    // Error handling strategy
    errorHandling: 'fallback' | 'retry' | 'abort';
    
    // Logging level
    loggingLevel: 'minimal' | 'standard' | 'detailed';
    
    // Governance policy
    governancePolicy: 'minimal' | 'standard' | 'strict' | 'custom';
    
    // Maximum execution time (seconds)
    maxExecutionTime: number;
    
    // Rate limiting (requests per minute)
    rateLimiting: {
      requestsPerMinute: number;
      burstLimit: number;
    };
  };
  
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
    };
  };
  
  // System-level data flow
  dataFlow: {
    [connectionId: string]: {
      data: any;
      timestamp: number;
    };
  };
}

// Note: Scorecard and Governance Identity modules will be built separately
// and are not included in this core Multi-Agent System implementation

