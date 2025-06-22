/**
 * Multi-Agent Service
 * 
 * Frontend service for managing multi-agent coordination, shared context,
 * and agent-to-agent communication with governance integration.
 */

import { API_BASE_URL } from '../config/api';

export interface MultiAgentContext {
  context_id: string;
  name: string;
  agent_ids: string[];
  collaboration_model: string;
  status: string;
  created_at: string;
}

export interface AgentMessage {
  id: string;
  from_agent_id: string;
  content: any;
  timestamp: string;
  type: string;
  governance_data?: any;
}

export interface ConversationHistory {
  context_id: string;
  messages: AgentMessage[];
  total_messages: number;
  filtered_count: number;
  collaboration_model: string;
}

export interface CollaborationMetrics {
  context_id: string;
  collaboration_model: string;
  total_messages: number;
  active_agents: number;
  average_participation: number;
  agent_metrics: AgentMetric[];
  governance_metrics: any;
}

export interface AgentMetric {
  agent_id: string;
  message_count: number;
  participation_rate: number;
  responsiveness: number;
  is_active: boolean;
}

export interface CreateContextRequest {
  name: string;
  agent_ids: string[];
  collaboration_model: string;
  policies?: any;
  governance_enabled?: boolean;
  metadata?: any;
}

export interface SendMessageRequest {
  context_id: string;
  from_agent_id: string;
  to_agent_ids: string[];
  message: any;
  require_response?: boolean;
  priority?: string;
}

/**
 * Multi-Agent Service class
 */
export class MultiAgentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/multi_agent_system`;
  }

  /**
   * Create a new multi-agent context
   */
  async createContext(request: CreateContextRequest): Promise<MultiAgentContext> {
    const response = await fetch(`${this.baseUrl}/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create context: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a message between agents
   */
  async sendMessage(request: SendMessageRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send message: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get conversation history for a context
   */
  async getConversationHistory(
    contextId: string,
    options: {
      fromAgentId?: string;
      messageType?: string;
      since?: string;
      limit?: number;
    } = {}
  ): Promise<ConversationHistory> {
    const params = new URLSearchParams();
    
    if (options.fromAgentId) params.append('from_agent_id', options.fromAgentId);
    if (options.messageType) params.append('message_type', options.messageType);
    if (options.since) params.append('since', options.since);
    if (options.limit) params.append('limit', options.limit.toString());

    const url = `${this.baseUrl}/context/${contextId}/history${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get conversation history: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get collaboration metrics for a context
   */
  async getCollaborationMetrics(contextId: string): Promise<CollaborationMetrics> {
    const response = await fetch(`${this.baseUrl}/context/${contextId}/metrics`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get collaboration metrics: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get agents in a context
   */
  async getContextAgents(contextId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/context/${contextId}/agents`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get context agents: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.agents || [];
  }

  /**
   * Terminate a multi-agent context
   */
  async terminateContext(contextId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/context/${contextId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to terminate context: ${error.detail || response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Multi-Agent Observer Service
 * 
 * Extends the observer pattern for multi-agent coordination monitoring
 */
export class MultiAgentObserverService {
  private multiAgentService: MultiAgentService;
  private observers: Map<string, Function[]>;
  private pollingIntervals: Map<string, NodeJS.Timeout>;

  constructor() {
    this.multiAgentService = new MultiAgentService();
    this.observers = new Map();
    this.pollingIntervals = new Map();
  }

  /**
   * Subscribe to multi-agent context updates
   */
  subscribe(contextId: string, callback: Function): () => void {
    if (!this.observers.has(contextId)) {
      this.observers.set(contextId, []);
      this.startPolling(contextId);
    }

    const callbacks = this.observers.get(contextId)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // Stop polling if no more observers
      if (callbacks.length === 0) {
        this.stopPolling(contextId);
        this.observers.delete(contextId);
      }
    };
  }

  /**
   * Start polling for updates
   */
  private startPolling(contextId: string): void {
    const interval = setInterval(async () => {
      try {
        // Get latest metrics and conversation history
        const [metrics, history] = await Promise.all([
          this.multiAgentService.getCollaborationMetrics(contextId),
          this.multiAgentService.getConversationHistory(contextId, { limit: 10 })
        ]);

        // Notify all observers
        const callbacks = this.observers.get(contextId) || [];
        callbacks.forEach(callback => {
          callback({
            type: 'update',
            contextId,
            metrics,
            history,
            timestamp: new Date().toISOString()
          });
        });

      } catch (error) {
        console.error(`Error polling context ${contextId}:`, error);
        
        // Notify observers of error
        const callbacks = this.observers.get(contextId) || [];
        callbacks.forEach(callback => {
          callback({
            type: 'error',
            contextId,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        });
      }
    }, 2000); // Poll every 2 seconds

    this.pollingIntervals.set(contextId, interval);
  }

  /**
   * Stop polling for updates
   */
  private stopPolling(contextId: string): void {
    const interval = this.pollingIntervals.get(contextId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(contextId);
    }
  }

  /**
   * Cleanup all polling
   */
  cleanup(): void {
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    this.observers.clear();
  }
}

/**
 * Real-time Multi-Agent Status Tracker
 * 
 * Tracks agent status and collaboration in real-time
 */
export class MultiAgentStatusTracker {
  private multiAgentService: MultiAgentService;
  private statusCallbacks: Map<string, Function[]>;
  private statusCache: Map<string, any>;

  constructor() {
    this.multiAgentService = new MultiAgentService();
    this.statusCallbacks = new Map();
    this.statusCache = new Map();
  }

  /**
   * Track agent status in a context
   */
  trackAgentStatus(contextId: string, callback: Function): () => void {
    if (!this.statusCallbacks.has(contextId)) {
      this.statusCallbacks.set(contextId, []);
      this.startStatusTracking(contextId);
    }

    const callbacks = this.statusCallbacks.get(contextId)!;
    callbacks.push(callback);

    // Send cached status if available
    const cachedStatus = this.statusCache.get(contextId);
    if (cachedStatus) {
      callback(cachedStatus);
    }

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        this.statusCallbacks.delete(contextId);
        this.statusCache.delete(contextId);
      }
    };
  }

  /**
   * Start tracking status for a context
   */
  private async startStatusTracking(contextId: string): Promise<void> {
    try {
      const agents = await this.multiAgentService.getContextAgents(contextId);
      const metrics = await this.multiAgentService.getCollaborationMetrics(contextId);

      const status = {
        contextId,
        agents: agents.map(agent => ({
          id: agent.id,
          name: agent.name || agent.id,
          status: this.getAgentDisplayStatus(agent),
          trustScore: agent.metrics?.governanceCompliance || 0,
          isActive: agent.metrics?.isActive || false,
          lastActivity: agent.lastActivity
        })),
        metrics: {
          totalMessages: metrics.total_messages,
          activeAgents: metrics.active_agents,
          averageParticipation: metrics.average_participation,
          governanceScore: this.calculateGovernanceScore(metrics.governance_metrics)
        },
        timestamp: new Date().toISOString()
      };

      this.statusCache.set(contextId, status);

      // Notify all callbacks
      const callbacks = this.statusCallbacks.get(contextId) || [];
      callbacks.forEach(callback => callback(status));

    } catch (error) {
      console.error(`Error tracking status for context ${contextId}:`, error);
    }
  }

  /**
   * Get display status for an agent
   */
  private getAgentDisplayStatus(agent: any): string {
    if (!agent.metrics) return 'idle';
    
    if (agent.metrics.isActive) {
      return agent.currentTask ? 'working' : 'thinking';
    }
    
    return 'idle';
  }

  /**
   * Calculate overall governance score
   */
  private calculateGovernanceScore(governanceMetrics: any): number {
    if (!governanceMetrics) return 0;
    
    const trustScore = governanceMetrics.average_trust_score || 0;
    const complianceRate = governanceMetrics.compliance_rate || 0;
    
    return (trustScore + complianceRate) / 2;
  }

  /**
   * Update agent status manually
   */
  updateAgentStatus(contextId: string, agentId: string, status: string): void {
    const cachedStatus = this.statusCache.get(contextId);
    if (cachedStatus) {
      const agent = cachedStatus.agents.find((a: any) => a.id === agentId);
      if (agent) {
        agent.status = status;
        agent.lastActivity = new Date().toISOString();
        
        // Notify callbacks
        const callbacks = this.statusCallbacks.get(contextId) || [];
        callbacks.forEach(callback => callback(cachedStatus));
      }
    }
  }
}

// Export singleton instances
export const multiAgentService = new MultiAgentService();
export const multiAgentObserver = new MultiAgentObserverService();
export const multiAgentStatusTracker = new MultiAgentStatusTracker();

