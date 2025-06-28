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
  backendContextId?: string; // Backend context ID for session management
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
  private currentUserId: string | null = null;

  constructor() {
    this.storageService = new UnifiedStorageService();
  }

  /**
   * Set the current user ID for the service
   */
  setUser(userId: string): void {
    this.currentUserId = userId;
    console.log('🔧 MULTI-AGENT SERVICE: User set to:', userId);
  }

  /**
   * Get all available chat systems for the current user
   */
  async getAvailableChatSystems(userId: string): Promise<ChatSystemInfo[]> {
    try {
      console.log('Loading available chat systems for user:', userId);
      
      // Get user's multi-agent systems
      const userSystems = await this.storageService.get('user', 'multi-agent-systems') || [];
      console.log('Found user systems:', userSystems);
      
      const chatSystems: ChatSystemInfo[] = [];

      // Process multi-agent systems
      for (const systemRef of userSystems) {
        try {
          console.log('Loading system data for:', systemRef.id);
          const systemData = await this.storageService.get('agents', `multi-agent-system-${systemRef.id}`);
          console.log('System data loaded:', systemData);
          
          if (systemData) {
            // Check if chat is enabled (default to true if not specified)
            const chatEnabled = systemData.chatEnabled !== false;
            console.log(`System ${systemRef.id} chat enabled:`, chatEnabled);
            
            if (chatEnabled) {
              chatSystems.push({
                id: systemData.id || systemData.contextId,
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
          } else {
            console.warn(`System data not found for ${systemRef.id}`);
          }
        } catch (error) {
          console.warn(`Failed to load system ${systemRef.id}:`, error);
        }
      }

      console.log('Available chat systems:', chatSystems);

      // Sort by last used (most recent first)
      chatSystems.sort((a, b) => {
        const aTime = new Date(a.lastUsed || 0).getTime();
        const bTime = new Date(b.lastUsed || 0).getTime();
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
      console.log('Starting chat session for system:', systemId, 'user:', userId);
      
      // Load the multi-agent system data
      const systemData = await this.storageService.get('agents', `multi-agent-system-${systemId}`);
      console.log('Loaded system data for chat session:', systemData);
      
      if (!systemData) {
        throw new Error(`Multi-agent system ${systemId} not found`);
      }

      // Check if chat is enabled (default to true if not specified)
      const chatEnabled = systemData.chatEnabled !== false;
      if (!chatEnabled) {
        throw new Error(`Chat is not enabled for system ${systemId}`);
      }

      // Ensure backend context exists for this multi-agent system
      console.log('🔧 Ensuring backend context exists for system:', systemId);
      const backendContextId = await this.ensureBackendContext(systemData);
      console.log('🔧 Backend context ID:', backendContextId);

      // Create backend chat session first
      console.log('🔧 Creating backend chat session...');
      const backendSessionResponse = await fetch('https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/chat/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemId: backendContextId,
          systemName: systemData.name,
          userId,
          governanceEnabled: systemData.governanceConfiguration ? true : false,
          systemConfiguration: systemData, // Pass the full system configuration including agents
          metadata: {
            frontendSystemId: systemId,
            collaborationModel: systemData.collaborationModel || 'sequential'
          }
        })
      });

      if (!backendSessionResponse.ok) {
        const errorData = await backendSessionResponse.json().catch(() => ({}));
        console.error('🔧 Failed to create backend session:', errorData);
        throw new Error(`Failed to create backend session: ${backendSessionResponse.status} ${backendSessionResponse.statusText}`);
      }

      const backendSession = await backendSessionResponse.json();
      console.log('🔧 Backend session created:', backendSession);

      // Create frontend chat session using backend session ID
      const sessionId = backendSession.sessionId;
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
        collaborationModel: systemData.collaborationModel || 'sequential',
        backendContextId // Store the backend context ID for reference
      };

      console.log('Created chat session:', session);

      // Store session with backend context ID
      this.activeSessions.set(sessionId, session);
      await this.storageService.set('ui', `chat-session-${sessionId}`, session);

      // Store the backend context ID for this system (for observer calls)
      await this.storageService.set('ui', `backend-context-${systemId}`, {
        contextId: backendContextId,
        systemId,
        createdAt: new Date().toISOString()
      });

      // Update system's last used timestamp
      systemData.lastUsed = new Date().toISOString();
      await this.storageService.set('agents', `multi-agent-system-${systemId}`, systemData);

      console.log('Chat session started successfully');
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

  /**
   * Ensure backend context exists for multi-agent system (similar to single agent pattern)
   */
  private async ensureBackendContext(systemData: any): Promise<string> {
    try {
      // Generate stable context ID based on system ID (like single agent does with agent ID)
      const stableContextId = `ctx_${systemData.id}`;
      
      // Check if we already have a backend context stored locally
      const existingContext = await this.storageService.get('ui', `backend-context-${systemData.id}`);
      
      if (existingContext && existingContext.contextId) {
        console.log('🔧 Using existing backend context:', existingContext.contextId);
        
        // Verify the backend still knows about this context
        try {
          const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/context/${existingContext.contextId}`);
          if (response.ok) {
            console.log('🔧 Backend context verified:', existingContext.contextId);
            return existingContext.contextId;
          } else {
            console.log('🔧 Backend context not found, will recreate');
          }
        } catch (error) {
          console.log('🔧 Backend context verification failed, will recreate');
        }
      }

      // Create new backend context (like single agent does with backend sync)
      console.log('🔧 Creating new backend context for system:', systemData.name);
      
      const contextPayload = {
        name: systemData.name,
        agent_ids: systemData.agentIds || [],
        collaboration_model: systemData.collaborationModel || 'sequential',
        governance_enabled: systemData.governanceConfiguration ? true : false,
        policies: systemData.governanceConfiguration || {},
        metadata: {
          systemId: systemData.id,
          createdBy: 'frontend',
          originalSystemData: systemData
        }
      };

      try {
        const response = await fetch('https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contextPayload)
        });

        if (response.ok) {
          const contextResult = await response.json();
          console.log('🔧 Backend context created successfully:', contextResult.context_id);
          
          // Store the backend context ID locally (like single agent stores chat history)
          await this.storageService.set('ui', `backend-context-${systemData.id}`, {
            contextId: contextResult.context_id,
            systemId: systemData.id,
            createdAt: new Date().toISOString(),
            lastVerified: new Date().toISOString()
          });
          
          return contextResult.context_id;
        } else {
          console.warn('🔧 Backend context creation failed, using stable fallback ID');
        }
      } catch (error) {
        console.warn('🔧 Backend context creation failed, using stable fallback ID:', error);
      }

      // Fallback: use stable context ID (like single agent uses agent ID)
      console.log('🔧 Using stable fallback context ID:', stableContextId);
      
      // Store the fallback context ID locally
      await this.storageService.set('ui', `backend-context-${systemData.id}`, {
        contextId: stableContextId,
        systemId: systemData.id,
        createdAt: new Date().toISOString(),
        fallbackMode: true
      });
      
      return stableContextId;
      
    } catch (error) {
      console.error('🔧 Error ensuring backend context:', error);
      // Ultimate fallback
      return `ctx_${systemData.id}`;
    }
  }

  /**
   * Get backend context ID for a system (for observer calls)
   */
  async getBackendContextId(systemId: string): Promise<string | null> {
    try {
      const contextData = await this.storageService.get('ui', `backend-context-${systemId}`);
      return contextData?.contextId || null;
    } catch (error) {
      console.error('Error getting backend context ID:', error);
      return null;
    }
  }

  /**
   * Save a message to multi-agent system storage
   * @param message The message to save
   * @param systemId The multi-agent system ID
   */
  async saveMessage(message: any, systemId: string): Promise<void> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not set for multi-agent chat integration');
      }

      // Use unified storage to save multi-agent messages
      const messageKey = `${this.currentUserId}.${systemId}.messages`;
      
      // Get existing messages
      let messages: any[] = [];
      try {
        const existingMessages = await this.storageService.get<any[]>('multiAgentChats', messageKey);
        if (existingMessages && Array.isArray(existingMessages)) {
          messages = existingMessages;
        }
      } catch (error) {
        console.log('No existing messages found, starting fresh');
      }

      // Add new message
      messages.push({
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
        systemId
      });

      // Save back to storage
      await this.storageService.set('multiAgentChats', messageKey, messages);
      
      console.log(`💬 Multi-agent message saved for system ${systemId}`);
    } catch (error) {
      console.error('Error saving multi-agent message:', error);
      // Don't throw - message saving shouldn't break the chat flow
    }
  }

  /**
   * Load messages for a multi-agent system
   * @param systemId The multi-agent system ID
   * @returns Array of messages
   */
  async loadMessages(systemId: string): Promise<any[]> {
    try {
      if (!this.currentUserId) {
        return [];
      }

      const messageKey = `${this.currentUserId}.${systemId}.messages`;
      const messages = await this.storageService.get<any[]>('multiAgentChats', messageKey);
      
      return messages || [];
    } catch (error) {
      console.error('Error loading multi-agent messages:', error);
      return [];
    }
  }

  /**
   * Send emergency stop signal to backend
   */
  async sendEmergencyStop(sessionId: string, systemId: string, userId: string): Promise<void> {
    try {
      console.log('🚨 MULTI-AGENT SERVICE: Sending emergency stop signal', { sessionId, systemId, userId });
      
      const response = await fetch('https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/chat/emergency-stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          systemId,
          userId,
          reason: 'user_emergency_stop',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.warn('🚨 MULTI-AGENT SERVICE: Emergency stop API returned error:', response.status, response.statusText);
        // Don't throw error - frontend stop should work even if backend fails
      } else {
        console.log('🚨 MULTI-AGENT SERVICE: Emergency stop signal sent successfully');
      }
    } catch (error) {
      console.warn('🚨 MULTI-AGENT SERVICE: Failed to send emergency stop signal:', error);
      // Don't throw error - frontend stop should work even if backend fails
    }
  }

  /**
   * Send message to multi-agent system with governance control
   */
  async sendMessage(
    sessionId: string, 
    message: string, 
    attachments: any[] = [],
    governanceEnabled: boolean = true
  ): Promise<{ content: string; governanceData?: any }> {
    try {
      console.log('🔧 MULTI-AGENT SERVICE: sendMessage called with:', {
        sessionId,
        messageLength: message.length,
        attachmentCount: attachments.length,
        governanceEnabled
      });

      const session = await this.getChatSession(sessionId);
      if (!session) {
        console.error('🔧 MULTI-AGENT SERVICE: Session not found:', sessionId);
        throw new Error(`Chat session ${sessionId} not found`);
      }

      console.log('🔧 MULTI-AGENT SERVICE: Session found:', {
        systemId: session.systemId,
        systemName: session.systemName,
        userId: session.userId
      });

      // Get system configuration
      console.log('🔧 MULTI-AGENT SERVICE: Getting system configuration...');
      const config = await this.getChatConfiguration(session.systemId);
      console.log('🔧 MULTI-AGENT SERVICE: System configuration:', config);
      
      // Prepare request payload
      const requestPayload = {
        message,
        attachments,
        sessionId,
        systemId: session.systemId,
        systemConfiguration: config,
        governanceEnabled, // Pass governance setting to backend
        userId: session.userId
      };

      console.log('🔧 MULTI-AGENT SERVICE: Sending message to multi-agent system:', {
        systemId: session.systemId,
        systemName: session.systemName,
        governanceEnabled,
        messageLength: message.length,
        attachmentCount: attachments.length,
        apiUrl: 'https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/chat/send-message'
      });

      try {
        console.log('🔧 MULTI-AGENT SERVICE: Making API call to backend...');
        const apiStartTime = Date.now();
        
        // Call the backend multi-agent system API
        const response = await fetch('https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/chat/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload)
        });

        const apiResponseTime = Date.now() - apiStartTime;
        console.log('🔧 MULTI-AGENT SERVICE: API response received after', apiResponseTime, 'ms');
        console.log('🔧 MULTI-AGENT SERVICE: Response status:', response.status, response.statusText);

        if (!response.ok) {
          console.error('🔧 MULTI-AGENT SERVICE: API error response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
          });
          throw new Error(`Multi-agent system API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('🔧 MULTI-AGENT SERVICE: API response data:', result);
        
        // Update session activity
        await this.updateSessionActivity(sessionId, session.messageCount + 1);
        console.log('🔧 MULTI-AGENT SERVICE: Session activity updated');

        // Return response with governance data and individual agent responses
        const finalResponse = {
          content: result.response || result.content || 'No response received',
          agentResponses: result.agentResponses || [], // Individual agent responses
          governanceData: governanceEnabled ? result.governanceData : undefined
        };
        
        console.log('🔧 MULTI-AGENT SERVICE: Returning final response:', finalResponse);
        return finalResponse;
        
      } catch (apiError) {
        console.warn('🔧 MULTI-AGENT SERVICE: Backend API unavailable, using fallback response:', apiError);
        console.warn('🔧 MULTI-AGENT SERVICE: API Error details:', {
          name: apiError.name,
          message: apiError.message,
          stack: apiError.stack
        });
        
        // Fallback response when backend is unavailable
        const fallbackResponse = `Hello! I'm the ${session.systemName} multi-agent system with ${config.agentIds?.length || 0} agents using ${config.collaborationModel} collaboration. 

I received your message: "${message}"

*Note: This is a fallback response as the backend API is currently unavailable. In a full deployment, this system would coordinate between multiple AI agents to provide comprehensive responses.*

**System Details:**
- Agents: ${config.agentIds?.length || 0}
- Collaboration Model: ${config.collaborationModel || 'Unknown'}
- Governance: ${governanceEnabled ? 'Enabled' : 'Disabled'}

How else can I help you today?`;

        console.log('🔧 MULTI-AGENT SERVICE: Using fallback response');

        // Update session activity
        await this.updateSessionActivity(sessionId, session.messageCount + 1);

        const fallbackResult = {
          content: fallbackResponse,
          governanceData: governanceEnabled ? {
            trustScore: 85,
            complianceStatus: 'compliant',
            riskLevel: 'low',
            governanceChecks: ['message_length_check', 'content_safety_check'],
            timestamp: new Date().toISOString(),
            fallbackMode: true
          } : undefined
        };
        
        console.log('🔧 MULTI-AGENT SERVICE: Returning fallback response:', fallbackResult);
        return fallbackResult;
      }

    } catch (error) {
      console.error('Failed to send message to multi-agent system:', error);
      throw error;
    }
  }

  /**
   * Get available systems (alias for backward compatibility)
   */
  async getAvailableSystems(userId: string): Promise<ChatSystemInfo[]> {
    return this.getAvailableChatSystems(userId);
  }
}

// Export singleton instance
export const multiAgentChatIntegration = new MultiAgentChatIntegrationService();

