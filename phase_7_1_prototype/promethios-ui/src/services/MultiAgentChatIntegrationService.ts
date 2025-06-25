/**
 * Multi-Agent Chat Integration Service
 * 
 * Links stored multi-agent systems to the modern chat interface
 * based on user sessions and system availability.
 */

import { UnifiedStorageService } from './UnifiedStorageService';

export interface MultiAgentChatSession {
  id: string;
  systemId: string;
  systemName: string;
  userId: string;
  createdAt: string;
  lastActivity: string;
  status: 'active' | 'paused' | 'ended';
  messageCount: number;
  governanceEnabled: boolean;
  collaborationModel: string;
}

export interface ChatSystemInfo {
  id: string;
  name: string;
  description: string;
  type: 'single-agent' | 'multi-agent-system';
  status: 'active' | 'inactive';
  agentCount?: number;
  collaborationModel?: string;
  governanceConfiguration?: any;
  lastUsed?: string;
}

export class MultiAgentChatIntegrationService {
  private storageService: UnifiedStorageService;
  private activeSessions = new Map<string, MultiAgentChatSession>();

  constructor() {
    this.storageService = new UnifiedStorageService();
  }

  /**
   * Get all available chat systems for the current user
   */
  async getAvailableChatSystems(userId: string): Promise<ChatSystemInfo[]> {
    try {
      // Get user's multi-agent systems
      const userSystems = await this.storageService.get('user', 'multi-agent-systems') || [];
      const chatSystems: ChatSystemInfo[] = [];

      // Process multi-agent systems
      for (const systemRef of userSystems) {
        try {
          const systemData = await this.storageService.get('agents', `multi-agent-system-${systemRef.id}`);
          if (systemData && systemData.chatEnabled) {
            chatSystems.push({
              id: systemData.id,
              name: systemData.name,
              description: systemData.description,
              type: 'multi-agent-system',
              status: systemData.status || 'active',
              agentCount: systemData.agentIds?.length || 0,
              collaborationModel: systemData.collaborationModel,
              governanceConfiguration: systemData.governanceConfiguration,
              lastUsed: systemData.lastUsed
            });
          }
        } catch (error) {
          console.warn(`Failed to load system ${systemRef.id}:`, error);
        }
      }

      // Sort by last used (most recent first)
      chatSystems.sort((a, b) => {
        const aTime = new Date(a.lastUsed || a.createdAt || 0).getTime();
        const bTime = new Date(b.lastUsed || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      return chatSystems;
    } catch (error) {
      console.error('Failed to get available chat systems:', error);
      return [];
    }
  }

  /**
   * Start a chat session with a multi-agent system
   */
  async startChatSession(systemId: string, userId: string): Promise<MultiAgentChatSession> {
    try {
      // Load the multi-agent system data
      const systemData = await this.storageService.get('agents', `multi-agent-system-${systemId}`);
      if (!systemData) {
        throw new Error(`Multi-agent system ${systemId} not found`);
      }

      if (!systemData.chatEnabled) {
        throw new Error(`Chat is not enabled for system ${systemId}`);
      }

      // Create new chat session
      const sessionId = `chat-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const session: MultiAgentChatSession = {
        id: sessionId,
        systemId,
        systemName: systemData.name,
        userId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'active',
        messageCount: 0,
        governanceEnabled: systemData.governanceConfiguration ? true : false,
        collaborationModel: systemData.collaborationModel || 'sequential'
      };

      // Store session
      this.activeSessions.set(sessionId, session);
      await this.storageService.set('ui', `chat-session-${sessionId}`, session);

      // Update system's last used timestamp
      systemData.lastUsed = new Date().toISOString();
      await this.storageService.set('agents', `multi-agent-system-${systemId}`, systemData);

      return session;
    } catch (error) {
      console.error('Failed to start chat session:', error);
      throw error;
    }
  }

  /**
   * Get active chat session for a system
   */
  async getChatSession(sessionId: string): Promise<MultiAgentChatSession | null> {
    try {
      // Check memory first
      if (this.activeSessions.has(sessionId)) {
        return this.activeSessions.get(sessionId)!;
      }

      // Load from storage
      const session = await this.storageService.get('ui', `chat-session-${sessionId}`);
      if (session) {
        this.activeSessions.set(sessionId, session);
        return session;
      }

      return null;
    } catch (error) {
      console.error('Failed to get chat session:', error);
      return null;
    }
  }

  /**
   * Update chat session activity
   */
  async updateSessionActivity(sessionId: string, messageCount?: number): Promise<void> {
    try {
      const session = await this.getChatSession(sessionId);
      if (session) {
        session.lastActivity = new Date().toISOString();
        if (messageCount !== undefined) {
          session.messageCount = messageCount;
        }

        this.activeSessions.set(sessionId, session);
        await this.storageService.set('ui', `chat-session-${sessionId}`, session);
      }
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * End a chat session
   */
  async endChatSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getChatSession(sessionId);
      if (session) {
        session.status = 'ended';
        session.lastActivity = new Date().toISOString();

        await this.storageService.set('ui', `chat-session-${sessionId}`, session);
        this.activeSessions.delete(sessionId);
      }
    } catch (error) {
      console.error('Failed to end chat session:', error);
    }
  }

  /**
   * Get chat configuration for a multi-agent system
   */
  async getChatConfiguration(systemId: string): Promise<any> {
    try {
      const systemData = await this.storageService.get('agents', `multi-agent-system-${systemId}`);
      if (!systemData) {
        throw new Error(`System ${systemId} not found`);
      }

      return {
        systemId,
        systemName: systemData.name,
        agentIds: systemData.agentIds || [],
        collaborationModel: systemData.collaborationModel || 'sequential',
        governanceConfiguration: systemData.governanceConfiguration || {},
        chatEnabled: systemData.chatEnabled || false,
        dashboardEnabled: systemData.dashboardEnabled || false,
        agentRoles: systemData.agentRoles || [],
        systemType: systemData.systemType || 'sequential'
      };
    } catch (error) {
      console.error('Failed to get chat configuration:', error);
      throw error;
    }
  }

  /**
   * Get user's active chat sessions
   */
  async getUserActiveSessions(userId: string): Promise<MultiAgentChatSession[]> {
    try {
      const sessions: MultiAgentChatSession[] = [];
      
      // Get all UI storage keys for chat sessions
      // Note: This is a simplified implementation - in production you'd want
      // to maintain an index of user sessions
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === userId && session.status === 'active') {
          sessions.push(session);
        }
      }

      return sessions.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    } catch (error) {
      console.error('Failed to get user active sessions:', error);
      return [];
    }
  }

  /**
   * Check if a system is available for chat
   */
  async isSystemAvailableForChat(systemId: string): Promise<boolean> {
    try {
      const systemData = await this.storageService.get('agents', `multi-agent-system-${systemId}`);
      return systemData && systemData.chatEnabled && systemData.status === 'active';
    } catch (error) {
      console.error('Failed to check system availability:', error);
      return false;
    }
  }

  /**
   * Get system governance status for chat interface
   */
  async getSystemGovernanceStatus(systemId: string): Promise<any> {
    try {
      const systemData = await this.storageService.get('agents', `multi-agent-system-${systemId}`);
      if (!systemData) {
        return null;
      }

      const governance = systemData.governanceConfiguration || {};
      return {
        enabled: Object.keys(governance).length > 0,
        rateLimiting: governance.rateLimiting || false,
        crossAgentValidation: governance.crossAgentValidation || false,
        errorHandlingStrategy: governance.errorHandlingStrategy || 'tolerant',
        complianceStandards: governance.complianceStandards || [],
        trustThreshold: governance.trustThreshold || 80,
        realTimeMonitoring: true // Always enabled for multi-agent systems
      };
    } catch (error) {
      console.error('Failed to get governance status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const multiAgentChatIntegration = new MultiAgentChatIntegrationService();

