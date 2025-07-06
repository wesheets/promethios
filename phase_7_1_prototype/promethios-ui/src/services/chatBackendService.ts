/**
 * Enhanced Chat Backend Service for Promethios Frontend
 * 
 * This service provides frontend integration with the revolutionary
 * AI Think Tank backend, enabling multi-system collaboration and
 * governed AI interactions.
 */

import { API_BASE_URL } from '../config/api';

export interface ChatSession {
  session_id: string;
  user_id: string;
  session_type: 'single_agent' | 'multi_agent';
  governance_config: GovernanceConfig;
  agent_config?: AgentConfig;
  multi_agent_config?: MultiAgentConfig;
  created_at: string;
  last_activity: string;
  message_count: number;
  trust_metrics: Record<string, number>;
  governance_summary: Record<string, any>;
}

export interface GovernanceConfig {
  enabled: boolean;
  policy_enforcement_level: 'strict' | 'moderate' | 'lenient';
  trust_threshold: number;
  observer_monitoring: boolean;
  audit_logging: boolean;
  real_time_validation: boolean;
}

export interface AgentConfig {
  agent_id: string;
  agent_type: string;
  model_provider?: string;
  model_name?: string;
  capabilities: string[];
  governance_policies: string[];
}

export interface MultiAgentConfig {
  coordination_pattern: 'sequential' | 'parallel' | 'hierarchical' | 'collaborative';
  agents: AgentConfig[];
  lead_agent_id?: string;
  consensus_threshold: number;
  max_rounds: number;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: string;
  agent_id?: string;
  governance_metadata?: Record<string, any>;
  trust_score?: number;
  policy_results?: Array<Record<string, any>>;
}

export interface MessageRequest {
  content: string;
  attachments?: Array<Record<string, any>>;
  governance_override?: Record<string, any>;
}

export interface MessageResponse {
  message_id: string;
  session_id: string;
  response_content: string;
  governance_status: string;
  trust_score: number;
  policy_compliance: boolean;
  observer_notes?: string;
  processing_time_ms: number;
  coordination_details?: {
    pattern?: string;
    participating_agents?: string[];
    consensus_score?: number;
    individual_responses?: Array<{
      agent_id: string;
      content: string;
      confidence: number;
      trust_score: number;
    }>;
  };
}

export interface GovernanceStatus {
  session_id: string;
  governance_enabled: boolean;
  compliance_rate: number;
  average_trust_score: number;
  total_messages: number;
  policy_violations: number;
  governance_config: GovernanceConfig;
  last_updated: string;
}

export interface ChatSystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    governance_system: string;
    agent_system: string;
    observer_system: string;
  };
  active_sessions: number;
  total_messages: number;
}

class ChatBackendService {
  private baseUrl: string;

  constructor() {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || API_BASE_URL;
    this.baseUrl = `${backendUrl}/api/chat`;
  }

  /**
   * Create a new chat session with governance configuration
   */
  async createSession(
    userId: string,
    sessionType: 'single_agent' | 'multi_agent' = 'single_agent',
    options: {
      governanceEnabled?: boolean;
      agentId?: string;
      coordinationPattern?: 'sequential' | 'parallel' | 'hierarchical' | 'collaborative';
      customAgents?: AgentConfig[];
      governanceConfig?: Partial<GovernanceConfig>;
    } = {}
  ): Promise<ChatSession> {
    const params = new URLSearchParams({
      user_id: userId,
      session_type: sessionType,
      governance_enabled: String(options.governanceEnabled ?? true),
    });

    if (options.agentId) {
      params.append('agent_id', options.agentId);
    }

    const response = await fetch(`${this.baseUrl}/sessions?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create an AI Think Tank session with multiple AI systems
   */
  async createThinkTankSession(
    userId: string,
    options: {
      coordinationPattern?: 'sequential' | 'parallel' | 'hierarchical' | 'collaborative';
      aiSystems?: string[];
      consensusThreshold?: number;
      maxRounds?: number;
      governanceLevel?: 'strict' | 'moderate' | 'lenient';
    } = {}
  ): Promise<ChatSession> {
    const {
      coordinationPattern = 'collaborative',
      aiSystems = ['factual-agent', 'creative-agent', 'governance-agent'],
      consensusThreshold = 0.8,
      maxRounds = 3,
      governanceLevel = 'moderate'
    } = options;

    // Create multi-agent session optimized for think tank discussions
    const session = await this.createSession(userId, 'multi_agent', {
      governanceEnabled: true,
      coordinationPattern,
      governanceConfig: {
        policy_enforcement_level: governanceLevel,
        trust_threshold: 0.7,
        observer_monitoring: true,
        audit_logging: true,
        real_time_validation: true
      }
    });

    return session;
  }

  /**
   * Get details of a specific chat session
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get chat session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a message in a chat session
   */
  async sendMessage(
    sessionId: string,
    messageRequest: MessageRequest
  ): Promise<MessageResponse> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to send message: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a message to AI Think Tank for multi-system analysis
   */
  async sendThinkTankMessage(
    sessionId: string,
    message: string,
    options: {
      priority?: 'low' | 'medium' | 'high';
      analysisType?: 'research' | 'policy' | 'strategic' | 'creative';
      governanceOverride?: Record<string, any>;
    } = {}
  ): Promise<MessageResponse> {
    const messageRequest: MessageRequest = {
      content: message,
      governance_override: {
        analysis_type: options.analysisType || 'research',
        priority: options.priority || 'medium',
        think_tank_mode: true,
        ...options.governanceOverride
      }
    };

    return this.sendMessage(sessionId, messageRequest);
  }

  /**
   * Get conversation history for a chat session
   */
  async getConversationHistory(
    sessionId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    session_id: string;
    messages: ChatMessage[];
    total_messages: number;
    offset: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));

    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/messages?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get conversation history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get governance status for a chat session
   */
  async getGovernanceStatus(sessionId: string): Promise<GovernanceStatus> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/governance`);
    
    if (!response.ok) {
      throw new Error(`Failed to get governance status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List chat sessions with optional filtering
   */
  async listSessions(
    options: {
      userId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    sessions: ChatSession[];
    total_sessions: number;
    offset: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (options.userId) params.append('user_id', options.userId);
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));

    const response = await fetch(`${this.baseUrl}/sessions?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to list sessions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get chat system health status
   */
  async getSystemHealth(): Promise<ChatSystemHealth> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Failed to get system health: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get available AI agents and their capabilities
   */
  async getAvailableAgents(): Promise<{
    agents: Array<{
      agent_id: string;
      name: string;
      description: string;
      capabilities: string[];
      provider: string;
      model: string;
      specialization: string;
    }>;
  }> {
    // For now, return predefined agents - in Phase 4 this will be dynamic
    return {
      agents: [
        {
          agent_id: 'baseline-agent',
          name: 'Baseline Assistant',
          description: 'General-purpose AI assistant for everyday conversations',
          capabilities: ['text-generation', 'conversation'],
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          specialization: 'General Purpose'
        },
        {
          agent_id: 'factual-agent',
          name: 'Factual Analyst',
          description: 'Specialized in factual analysis and accurate information',
          capabilities: ['factual-analysis', 'reasoning'],
          provider: 'anthropic',
          model: 'claude-3-sonnet',
          specialization: 'Factual Analysis'
        },
        {
          agent_id: 'creative-agent',
          name: 'Creative Specialist',
          description: 'Focused on creative thinking and innovative solutions',
          capabilities: ['creative-writing', 'text-generation'],
          provider: 'openai',
          model: 'gpt-4',
          specialization: 'Creative Thinking'
        },
        {
          agent_id: 'governance-agent',
          name: 'Governance Specialist',
          description: 'Ensures compliance with ethical guidelines and policies',
          capabilities: ['reasoning', 'conversation'],
          provider: 'anthropic',
          model: 'claude-3-sonnet',
          specialization: 'Governance & Ethics'
        },
        {
          agent_id: 'multi-tool-agent',
          name: 'Multi-Tool Specialist',
          description: 'Capable of using various tools and APIs',
          capabilities: ['tool-use', 'reasoning'],
          provider: 'cohere',
          model: 'command',
          specialization: 'Tool Integration'
        }
      ]
    };
  }

  /**
   * Get coordination patterns and their descriptions
   */
  getCoordinationPatterns(): Array<{
    pattern: string;
    name: string;
    description: string;
    use_cases: string[];
    ideal_for: string;
  }> {
    return [
      {
        pattern: 'sequential',
        name: 'Sequential Analysis',
        description: 'Agents respond in order, each building on previous responses',
        use_cases: ['Step-by-step analysis', 'Building complex arguments', 'Iterative refinement'],
        ideal_for: 'Complex problems requiring layered analysis'
      },
      {
        pattern: 'parallel',
        name: 'Parallel Perspectives',
        description: 'All agents respond simultaneously, then responses are synthesized',
        use_cases: ['Multiple viewpoints', 'Comprehensive analysis', 'Quick insights'],
        ideal_for: 'Getting diverse perspectives quickly'
      },
      {
        pattern: 'hierarchical',
        name: 'Hierarchical Coordination',
        description: 'Lead agent directs specialist agents for targeted analysis',
        use_cases: ['Expert consultation', 'Specialized analysis', 'Structured problem-solving'],
        ideal_for: 'Problems requiring specific expertise'
      },
      {
        pattern: 'collaborative',
        name: 'AI Think Tank',
        description: 'Multi-round consensus building across AI systems',
        use_cases: ['Research collaboration', 'Policy analysis', 'Strategic planning'],
        ideal_for: 'Complex decisions requiring consensus and validation'
      }
    ];
  }
}

// Export singleton instance
export const chatBackendService = new ChatBackendService();
export default chatBackendService;

