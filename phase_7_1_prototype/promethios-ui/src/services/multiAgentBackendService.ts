/**
 * Multi-Agent Backend Service
 * 
 * Service that connects the frontend to the real multi-agent system backend APIs.
 * Handles context creation, messaging, and collaboration metrics.
 */

import { API_BASE_URL } from '../config/api';

// Backend API configuration - now uses environment variables
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || API_BASE_URL;

// Types for backend API requests/responses
export interface CreateContextRequest {
  name: string;
  agent_ids: string[];
  collaboration_model: string;
  policies?: Record<string, any>;
  governance_enabled?: boolean;
  metadata?: Record<string, any>;
}

export interface SendMessageRequest {
  context_id: string;
  from_agent_id: string;
  to_agent_ids: string[];
  message: Record<string, any>;
  require_response?: boolean;
  priority?: string;
}

export interface BackendMultiAgentContext {
  context_id: string;
  name: string;
  agent_ids: string[];
  collaboration_model: string;
  status: string;
  created_at: string;
  policies?: Record<string, any>;
  governance_enabled: boolean;
  metadata?: Record<string, any>;
}

export interface BackendAgentMessage {
  id: string;
  from_agent_id: string;
  to_agent_ids: string[];
  content: Record<string, any>;
  timestamp: string;
  type: string;
  governance_data?: Record<string, any>;
  context_id: string;
}

export interface BackendConversationHistory {
  context_id: string;
  messages: BackendAgentMessage[];
  total_messages: number;
  filtered_count: number;
  collaboration_model: string;
}

export interface BackendCollaborationMetrics {
  context_id: string;
  collaboration_model: string;
  total_messages: number;
  active_agents: number;
  average_participation: number;
  agent_metrics: Array<{
    agent_id: string;
    message_count: number;
    participation_rate: number;
    responsiveness: number;
    is_active: boolean;
  }>;
  governance_metrics: Record<string, any>;
}

/**
 * Multi-Agent Backend Service Class
 */
export class MultiAgentBackendService {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a new multi-agent context
   */
  async createContext(request: CreateContextRequest): Promise<BackendMultiAgentContext> {
    try {
      const response = await fetch(`${this.baseUrl}/api/multi_agent_system/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create context: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating multi-agent context:', error);
      throw error;
    }
  }

  /**
   * Send a message between agents
   */
  async sendMessage(request: SendMessageRequest): Promise<{ message_id: string; status: string; timestamp: string; governance_check: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/multi_agent_system/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to send message: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
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
  ): Promise<BackendConversationHistory> {
    try {
      const params = new URLSearchParams();
      
      if (options.fromAgentId) params.append('from_agent_id', options.fromAgentId);
      if (options.messageType) params.append('message_type', options.messageType);
      if (options.since) params.append('since', options.since);
      if (options.limit) params.append('limit', options.limit.toString());

      const url = `${this.baseUrl}/api/multi_agent_system/context/${contextId}/history${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get conversation history: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Get collaboration metrics for a context
   */
  async getCollaborationMetrics(contextId: string): Promise<BackendCollaborationMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/api/multi_agent_system/context/${contextId}/metrics`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get collaboration metrics: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting collaboration metrics:', error);
      throw error;
    }
  }

  /**
   * List all multi-agent contexts
   */
  async listContexts(
    options: {
      ownerId?: string;
      status?: string;
      limit?: number;
    } = {}
  ): Promise<BackendMultiAgentContext[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.ownerId) params.append('owner_id', options.ownerId);
      if (options.status) params.append('status', options.status);
      if (options.limit) params.append('limit', options.limit.toString());

      const url = `${this.baseUrl}/api/multi_agent_system/contexts${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to list contexts: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing contexts:', error);
      throw error;
    }
  }

  /**
   * Delete a multi-agent context
   */
  async deleteContext(contextId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/multi_agent_system/context/${contextId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete context: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting context:', error);
      throw error;
    }
  }

  /**
   * Transform backend context to frontend format
   */
  transformContext(backendContext: BackendMultiAgentContext): any {
    return {
      context_id: backendContext.context_id,
      name: backendContext.name,
      agent_ids: backendContext.agent_ids,
      collaboration_model: backendContext.collaboration_model,
      status: backendContext.status,
      created_at: backendContext.created_at,
      lastActivity: backendContext.created_at, // Use created_at as fallback
      policies: backendContext.policies || {},
      governance_enabled: backendContext.governance_enabled,
      metadata: backendContext.metadata || {},
      // Add computed fields for UI compatibility
      persistentData: {
        conversationHistory: [], // Will be loaded separately
        sharedContext: backendContext.metadata || {},
        collaborationRules: backendContext.policies || {}
      }
    };
  }

  /**
   * Transform backend message to frontend format
   */
  transformMessage(backendMessage: BackendAgentMessage): any {
    return {
      id: backendMessage.id,
      from_agent_id: backendMessage.from_agent_id,
      to_agent_ids: backendMessage.to_agent_ids,
      content: backendMessage.content,
      timestamp: backendMessage.timestamp,
      type: backendMessage.type,
      governance_data: backendMessage.governance_data || {},
      context_id: backendMessage.context_id
    };
  }

  /**
   * Transform backend metrics to frontend format
   */
  transformMetrics(backendMetrics: BackendCollaborationMetrics): any {
    return {
      context_id: backendMetrics.context_id,
      collaboration_model: backendMetrics.collaboration_model,
      totalMessages: backendMetrics.total_messages,
      activeAgents: backendMetrics.active_agents,
      averageParticipation: backendMetrics.average_participation,
      agentMetrics: backendMetrics.agent_metrics.map(metric => ({
        agent_id: metric.agent_id,
        messageCount: metric.message_count,
        participationRate: metric.participation_rate,
        responsiveness: metric.responsiveness,
        isActive: metric.is_active
      })),
      governanceMetrics: {
        complianceScore: backendMetrics.governance_metrics.compliance_score || 0,
        trustLevel: backendMetrics.governance_metrics.trust_level || 'unknown',
        violations: backendMetrics.governance_metrics.violations || 0
      }
    };
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking backend health:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const multiAgentBackendService = new MultiAgentBackendService();

