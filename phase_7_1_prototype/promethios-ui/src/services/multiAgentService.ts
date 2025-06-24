/**
 * Multi-Agent Service - Updated for New Backend Integration
 * 
 * Frontend service for managing multi-agent coordination, shared context,
 * and agent-to-agent communication with governance integration.
 * 
 * Updated to use the new multi-agent governance backend infrastructure.
 */

import { API_BASE_URL } from '../config/api';

// New backend URL for multi-agent governance
const GOVERNANCE_BACKEND_URL = 'https://5000-ivvwtnm57nafn2tky3qfe-df129213.manusvm.computer';

export interface MultiAgentContext {
  context_id: string;
  name: string;
  agent_ids: string[];
  collaboration_model: string;
  status: string;
  created_at: string;
  // New governance fields
  collective_trust_score?: number;
  governance_score?: number;
  session_id?: string;
}

export interface AgentMessage {
  id: string;
  from_agent_id: string;
  content: any;
  timestamp: string;
  type: string;
  governance_data?: any;
  // New governance fields
  governance_approved?: boolean;
  trust_impact?: number;
  violations?: any[];
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
  // New governance metrics
  system_trust_score?: number;
  collective_intelligence_score?: number;
  violation_rate?: number;
}

export interface AgentMetric {
  agent_id: string;
  message_count: number;
  participation_rate: number;
  responsiveness: number;
  is_active: boolean;
  // New governance fields
  trust_score?: number;
  compliance_rate?: number;
  violations_count?: number;
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

// New interfaces for governance integration
export interface TrustRelationship {
  agentAId: string;
  agentBId: string;
  trustScore: number;
  interactionCount: number;
  successfulCollaborations: number;
  failedCollaborations: number;
  lastInteraction: string;
  trustTrend: string;
}

export interface ComprehensiveTestResult {
  testId: string;
  timestamp: string;
  overallScore: number;
  totalViolations: number;
  categoryResults: Record<string, any>;
  systemRecommendations: string[];
  generalizabilityScore: number;
}

/**
 * Multi-Agent Service class - Enhanced with Governance
 */
export class MultiAgentService {
  private baseUrl: string;
  private governanceUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/multi_agent_system`;
    this.governanceUrl = `${GOVERNANCE_BACKEND_URL}/api/multi-agent`;
  }

  /**
   * Create a new multi-agent collaborative session (using new backend)
   */
  async createCollaborativeSession(request: {
    sessionName: string;
    participatingAgents: string[];
    sessionType: string;
  }): Promise<MultiAgentContext> {
    const response = await fetch(`${this.governanceUrl}/collaborative-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create collaborative session: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    
    // Convert to legacy format for compatibility
    return {
      context_id: result.sessionId,
      name: result.sessionName,
      agent_ids: result.participatingAgents,
      collaboration_model: result.sessionType,
      status: result.status,
      created_at: result.startTime,
      collective_trust_score: result.collectiveTrustScore,
      governance_score: result.governanceScore,
      session_id: result.sessionId
    };
  }

  /**
   * Create a new multi-agent context (legacy method for backward compatibility)
   */
  async createContext(request: CreateContextRequest): Promise<MultiAgentContext> {
    // Use new collaborative session endpoint
    return this.createCollaborativeSession({
      sessionName: request.name,
      participatingAgents: request.agent_ids,
      sessionType: request.collaboration_model
    });
  }

  /**
   * Send a message between agents (using new governance backend)
   */
  async sendMessage(request: SendMessageRequest): Promise<any> {
    // Convert to new backend format
    const communicationRequest = {
      senderAgentId: request.from_agent_id,
      receiverAgentId: request.to_agent_ids[0], // For now, handle single receiver
      messageType: 'collaboration',
      content: typeof request.message === 'string' ? request.message : JSON.stringify(request.message),
      metadata: {
        context_id: request.context_id,
        priority: request.priority || 'normal',
        require_response: request.require_response || false
      }
    };

    const response = await fetch(`${this.governanceUrl}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(communicationRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send message: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    
    // Convert to legacy format
    return {
      id: result.communicationId,
      from_agent_id: request.from_agent_id,
      content: request.message,
      timestamp: new Date().toISOString(),
      type: 'collaboration',
      governance_data: {
        approved: result.approved,
        trust_impact: result.trustImpact,
        violations: result.violations
      }
    };
  }

  /**
   * Get conversation history for a collaborative session
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
    try {
      // Try new backend first
      const response = await fetch(`${this.governanceUrl}/collaborative-sessions/${contextId}/communications`);
      
      if (response.ok) {
        const communications = await response.json();
        
        // Convert to legacy format
        const messages: AgentMessage[] = communications.map((comm: any) => ({
          id: comm.id,
          from_agent_id: comm.senderAgentId,
          content: comm.content,
          timestamp: comm.timestamp,
          type: comm.messageType,
          governance_data: {
            approved: comm.governanceApproved,
            trust_impact: comm.trustImpact,
            violations: comm.violations
          }
        }));

        return {
          context_id: contextId,
          messages: messages,
          total_messages: messages.length,
          filtered_count: messages.filter(m => m.governance_data?.approved).length,
          collaboration_model: 'governance_enabled'
        };
      }
    } catch (error) {
      console.warn('New backend unavailable, falling back to legacy:', error);
    }

    // Fallback to legacy backend
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
   * Get collaboration metrics (enhanced with governance data)
   */
  async getCollaborationMetrics(contextId: string): Promise<CollaborationMetrics> {
    try {
      // Try to get system-wide metrics from new backend
      const response = await fetch(`${this.governanceUrl}/system/metrics`);
      
      if (response.ok) {
        const systemMetrics = await response.json();
        
        // Get conversation history to calculate context-specific metrics
        const history = await this.getConversationHistory(contextId);
        
        return {
          context_id: contextId,
          collaboration_model: 'governance_enabled',
          total_messages: history.total_messages,
          active_agents: systemMetrics.totalActiveAgents,
          average_participation: 85.0, // Calculate from history
          agent_metrics: [], // Would need to be calculated from history
          governance_metrics: {
            system_trust_score: systemMetrics.systemTrustScore,
            collective_intelligence_score: systemMetrics.collectiveIntelligenceScore,
            violation_rate: systemMetrics.violationRate,
            governance_effectiveness: systemMetrics.governanceEffectiveness
          },
          system_trust_score: systemMetrics.systemTrustScore,
          collective_intelligence_score: systemMetrics.collectiveIntelligenceScore,
          violation_rate: systemMetrics.violationRate
        };
      }
    } catch (error) {
      console.warn('New backend metrics unavailable, falling back to legacy:', error);
    }

    // Fallback to legacy backend
    const response = await fetch(`${this.baseUrl}/context/${contextId}/metrics`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get collaboration metrics: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get trust relationships for an agent (new governance feature)
   */
  async getTrustRelationships(agentId: string): Promise<TrustRelationship[]> {
    const response = await fetch(`${this.governanceUrl}/trust-relationships/${agentId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get trust relationships: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Run comprehensive governance test (new feature)
   */
  async runComprehensiveGovernanceTest(testScenarios: any[] = []): Promise<ComprehensiveTestResult> {
    const response = await fetch(`${this.governanceUrl}/comprehensive-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testScenarios }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to run comprehensive test: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get agents in a context
   */
  async getContextAgents(contextId: string): Promise<any[]> {
    // Try to get from collaborative session first
    try {
      const history = await this.getConversationHistory(contextId);
      const agentIds = new Set<string>();
      
      history.messages.forEach(msg => {
        agentIds.add(msg.from_agent_id);
      });

      // Get trust relationships for each agent
      const agents = await Promise.all(
        Array.from(agentIds).map(async (agentId) => {
          try {
            const trustRelationships = await this.getTrustRelationships(agentId);
            const avgTrustScore = trustRelationships.length > 0 
              ? trustRelationships.reduce((sum, rel) => sum + rel.trustScore, 0) / trustRelationships.length
              : 85.0;

            return {
              id: agentId,
              name: agentId,
              metrics: {
                governanceCompliance: avgTrustScore,
                isActive: true,
                trustRelationships: trustRelationships.length
              },
              lastActivity: new Date().toISOString()
            };
          } catch (error) {
            return {
              id: agentId,
              name: agentId,
              metrics: {
                governanceCompliance: 85.0,
                isActive: true,
                trustRelationships: 0
              },
              lastActivity: new Date().toISOString()
            };
          }
        })
      );

      return agents;
    } catch (error) {
      console.warn('Could not get agents from new backend, falling back to legacy');
    }

    // Fallback to legacy backend
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
    // Try new backend first
    try {
      const response = await fetch(`${this.governanceUrl}/collaborative-sessions/${contextId}/end`, {
        method: 'POST',
      });

      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.warn('New backend unavailable for termination, using legacy');
    }

    // Fallback to legacy backend
    const response = await fetch(`${this.baseUrl}/context/${contextId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to terminate context: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get system-wide governance metrics (new feature)
   */
  async getSystemGovernanceMetrics(): Promise<any> {
    const response = await fetch(`${this.governanceUrl}/system/metrics`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get system metrics: ${error.error || response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Multi-Agent Observer Service - Enhanced with Governance
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
   * Subscribe to multi-agent context updates (enhanced with governance)
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
   * Start polling for updates (enhanced with governance metrics)
   */
  private startPolling(contextId: string): void {
    const interval = setInterval(async () => {
      try {
        // Get latest metrics, conversation history, and governance data
        const [metrics, history, systemMetrics] = await Promise.all([
          this.multiAgentService.getCollaborationMetrics(contextId),
          this.multiAgentService.getConversationHistory(contextId, { limit: 10 }),
          this.multiAgentService.getSystemGovernanceMetrics().catch(() => null)
        ]);

        // Notify all observers with enhanced data
        const callbacks = this.observers.get(contextId) || [];
        callbacks.forEach(callback => {
          callback({
            type: 'update',
            contextId,
            metrics,
            history,
            systemMetrics,
            governance: {
              systemTrustScore: systemMetrics?.systemTrustScore || 85.0,
              violationRate: systemMetrics?.violationRate || 0.0,
              emergentBehaviorDetected: systemMetrics?.emergentBehaviorDetected || false
            },
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
    }, 3000); // Poll every 3 seconds (slightly slower due to more data)

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
 * Real-time Multi-Agent Status Tracker - Enhanced with Governance
 * 
 * Tracks agent status and collaboration in real-time with governance metrics
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
   * Track agent status in a context (enhanced with governance)
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
   * Start tracking status for a context (enhanced with governance)
   */
  private async startStatusTracking(contextId: string): Promise<void> {
    try {
      const [agents, metrics, systemMetrics] = await Promise.all([
        this.multiAgentService.getContextAgents(contextId),
        this.multiAgentService.getCollaborationMetrics(contextId),
        this.multiAgentService.getSystemGovernanceMetrics().catch(() => null)
      ]);

      // Get trust relationships for each agent
      const enhancedAgents = await Promise.all(
        agents.map(async (agent) => {
          try {
            const trustRelationships = await this.multiAgentService.getTrustRelationships(agent.id);
            const avgTrustScore = trustRelationships.length > 0 
              ? trustRelationships.reduce((sum, rel) => sum + rel.trustScore, 0) / trustRelationships.length
              : agent.metrics?.governanceCompliance || 85.0;

            return {
              id: agent.id,
              name: agent.name || agent.id,
              status: this.getAgentDisplayStatus(agent),
              trustScore: avgTrustScore,
              isActive: agent.metrics?.isActive || false,
              lastActivity: agent.lastActivity,
              trustRelationships: trustRelationships.length,
              governanceCompliance: agent.metrics?.governanceCompliance || avgTrustScore
            };
          } catch (error) {
            return {
              id: agent.id,
              name: agent.name || agent.id,
              status: this.getAgentDisplayStatus(agent),
              trustScore: agent.metrics?.governanceCompliance || 85.0,
              isActive: agent.metrics?.isActive || false,
              lastActivity: agent.lastActivity,
              trustRelationships: 0,
              governanceCompliance: agent.metrics?.governanceCompliance || 85.0
            };
          }
        })
      );

      const status = {
        contextId,
        agents: enhancedAgents,
        metrics: {
          totalMessages: metrics.total_messages,
          activeAgents: metrics.active_agents,
          averageParticipation: metrics.average_participation,
          governanceScore: this.calculateGovernanceScore(metrics.governance_metrics),
          systemTrustScore: systemMetrics?.systemTrustScore || 85.0,
          violationRate: systemMetrics?.violationRate || 0.0,
          emergentBehaviorDetected: systemMetrics?.emergentBehaviorDetected || false
        },
        governance: {
          enabled: true,
          systemTrustScore: systemMetrics?.systemTrustScore || 85.0,
          collectiveIntelligenceScore: systemMetrics?.collectiveIntelligenceScore || 80.0,
          violationRate: systemMetrics?.violationRate || 0.0,
          governanceEffectiveness: systemMetrics?.governanceEffectiveness || 90.0
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
   * Calculate overall governance score (enhanced)
   */
  private calculateGovernanceScore(governanceMetrics: any): number {
    if (!governanceMetrics) return 85.0;
    
    const trustScore = governanceMetrics.system_trust_score || governanceMetrics.average_trust_score || 85.0;
    const complianceRate = governanceMetrics.compliance_rate || 90.0;
    const effectivenessScore = governanceMetrics.governance_effectiveness || 90.0;
    
    return (trustScore + complianceRate + effectivenessScore) / 3;
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

