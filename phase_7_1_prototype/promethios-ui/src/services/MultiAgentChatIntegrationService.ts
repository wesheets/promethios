/**
 * Multi-Agent Chat Integration Service
 * 
 * Links stored multi-agent systems to the modern chat interface
 * based on user sessions and system availability.
 */

import { UnifiedStorageService } from './UnifiedStorageService';
import { UserAgentStorageService } from './UserAgentStorageService';
import { API_BASE_URL } from '../config/api';
import { createPromethiosSystemMessage } from '../api/openaiProxy';
import { multiAgentGovernanceWrapper, GovernanceState } from './MultiAgentGovernanceWrapper';
import { ReadableConsensusEngine } from './ReadableConsensusEngine';
import { BlindVisionProtocol } from './BlindVisionProtocol';

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
  private agentStorageService: UserAgentStorageService;
  private readableConsensusEngine: ReadableConsensusEngine;
  private blindVisionProtocol: BlindVisionProtocol;
  private activeSessions = new Map<string, MultiAgentChatSession>();
  private currentUserId: string | null = null;

  constructor() {
    this.storageService = new UnifiedStorageService();
    this.agentStorageService = new UserAgentStorageService();
    this.readableConsensusEngine = new ReadableConsensusEngine();
    this.blindVisionProtocol = new BlindVisionProtocol();
  }

  /**
   * Set the current user ID for the service
   */
  setUser(userId: string): void {
    this.currentUserId = userId;
    this.agentStorageService.setCurrentUser(userId);
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
                id: systemRef.id, // 🔧 FIX: Use storage reference ID instead of contextId
                name: systemData.name,
                description: systemData.description,
                type: 'multi-agent-system',
                status: systemData.status || 'active',
                agentCount: systemData.agentIds?.length || 0,
                collaborationModel: systemData.collaborationModel,
                governanceConfiguration: systemData.governanceConfiguration,
                lastUsed: systemData.lastUsed
              });
              console.log('🔧 SYSTEM ID FIX: Added system with storage reference ID:', systemRef.id, 'instead of contextId:', systemData.contextId);
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
   * Start a chat session with a multi-agent system (user-session-based)
   */
  async startChatSession(systemId: string, userId: string): Promise<MultiAgentChatSession> {
    try {
      console.log('🔧 CHAT SESSION: Starting session for system:', systemId, 'user:', userId);
      this.setUser(userId); // Ensure user is set
      
      // Load user's specific multi-agent system
      const systemData = await this.getUserMultiAgentSystem(systemId);
      console.log('🔧 CHAT SESSION: Loaded system data:', systemData?.name);
      
      if (!systemData) {
        throw new Error(`Multi-agent system ${systemId} not found for user ${userId}`);
      }

      // Check if chat is enabled (default to true if not specified)
      const chatEnabled = systemData.chatEnabled !== false;
      if (!chatEnabled) {
        throw new Error(`Chat is not enabled for system ${systemId}`);
      }

      // Load agents using role-based mapping (not hardcoded IDs)
      console.log('🔧 CHAT SESSION: Loading agents using role-based mapping...');
      const agents = await this.loadAgentsByRoles(systemData);
      console.log('🔧 CHAT SESSION: Loaded', agents.length, 'agents for session');
      
      // Update system data with loaded agents
      systemData.agents = agents;
      systemData.agentIds = agents.map(a => a.id);

      // Ensure backend context exists for this multi-agent system
      console.log('🔧 CHAT SESSION: Ensuring backend context exists for system:', systemId);
      const backendContextId = await this.ensureBackendContext(systemData);
      console.log('🔧 CHAT SESSION: Backend context ID:', backendContextId);

      // Create backend chat session first
      console.log('🔧 CHAT SESSION: Creating backend chat session...');
      console.log('🤖 CHAT SESSION: System data includes agents:', !!systemData.agents, 'Count:', systemData.agents?.length || 0);
      console.log('🤖 Agent objects:', systemData.agents?.map(a => `${a.name} (${a.provider})`) || 'None');
      
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
   * Get all agents for the current user (excluding Observer)
   */
  private async getUserAgents(): Promise<any[]> {
    if (!this.currentUserId) {
      throw new Error('No user set for multi-agent service');
    }
    
    try {
      // Load user's agents using the proper agent storage service
      const userAgents = await this.agentStorageService.loadUserAgents();
      
      // Filter out Observer Agent (it shouldn't participate in multi-agent chats)
      const filteredAgents = (userAgents || []).filter(agent => 
        agent.identity?.name !== 'Observer Agent' && 
        agent.identity?.role !== 'observer'
      );
      
      console.log('🔧 USER AGENTS: Loaded', filteredAgents.length, 'agents for user', this.currentUserId);
      return filteredAgents;
    } catch (error) {
      console.error('🔧 USER AGENTS: Error loading user agents:', error);
      return [];
    }
  }

  /**
   * Load user's agents based on role assignments or auto-assign if needed
   */
  private async loadAgentsByRoles(systemConfig: any): Promise<any[]> {
    const userAgents = await this.getUserAgents();
    const agentObjects = [];
    
    console.log('🔧 ROLE MAPPING: System config:', systemConfig);
    console.log('🔧 ROLE MAPPING: Available user agents:', userAgents.length);
    
    // If system has role assignments, use them
    if (systemConfig.roleAssignments && Object.keys(systemConfig.roleAssignments).length > 0) {
      console.log('🔧 ROLE MAPPING: Using existing role assignments');
      
      for (const [role, agentId] of Object.entries(systemConfig.roleAssignments)) {
        const agent = userAgents.find(a => a.id === agentId);
        if (agent) {
          console.log('🔧 ROLE MAPPING: Found agent for role', role, ':', agent.identity?.name);
          agentObjects.push(this.formatAgentForBackend(agent, role));
        } else {
          console.warn('🔧 ROLE MAPPING: Agent not found for role', role, ':', agentId);
        }
      }
    } 
    // If system has old agentIds format, try to auto-assign roles
    else if (systemConfig.agentIds && systemConfig.agentIds.length > 0) {
      console.log('🔧 ROLE MAPPING: Migrating from old agentIds format');
      const roleAssignments = await this.autoAssignRolesToUserAgents(userAgents, systemConfig.agentIds.length);
      
      for (const [role, agent] of Object.entries(roleAssignments)) {
        if (agent) {
          console.log('🔧 ROLE MAPPING: Auto-assigned role', role, 'to agent:', agent.identity?.name);
          agentObjects.push(this.formatAgentForBackend(agent, role));
        }
      }
    }
    // Fallback: use first available user agents
    else {
      console.log('🔧 ROLE MAPPING: Using first available user agents as fallback');
      const defaultRoles = ['strategic_analyst', 'risk_assessor', 'innovation_expert', 'financial_advisor'];
      
      for (let i = 0; i < Math.min(userAgents.length, defaultRoles.length); i++) {
        const agent = userAgents[i];
        const role = defaultRoles[i];
        console.log('🔧 ROLE MAPPING: Fallback assignment - role', role, 'to agent:', agent.identity?.name);
        agentObjects.push(this.formatAgentForBackend(agent, role));
      }
    }
    
    console.log('🔧 ROLE MAPPING: Final agent objects:', agentObjects.length);
    return agentObjects;
  }

  /**
   * Auto-assign roles to user's agents based on their capabilities or names
   */
  private async autoAssignRolesToUserAgents(userAgents: any[], requiredCount: number): Promise<Record<string, any>> {
    const roles = ['strategic_analyst', 'risk_assessor', 'innovation_expert', 'financial_advisor'];
    const assignments: Record<string, any> = {};
    
    // Take up to the required number of agents
    const agentsToUse = userAgents.slice(0, Math.min(requiredCount, roles.length));
    
    for (let i = 0; i < agentsToUse.length; i++) {
      const role = roles[i];
      const agent = agentsToUse[i];
      assignments[role] = agent;
    }
    
    return assignments;
  }

  /**
   * Format agent data for backend consumption
   */
  private formatAgentForBackend(agentData: any, assignedRole?: string): any {
    return {
      id: agentData.id,
      name: agentData.identity?.name || agentData.id,
      role: agentData.identity?.role || 'conversational',
      assignedRole: assignedRole, // Role in the multi-agent system
      provider: agentData.llmProvider || 'openai',
      model: agentData.llmModel || 'gpt-3.5-turbo',
      systemPrompt: agentData.identity?.systemPrompt || `You are ${agentData.identity?.name || agentData.id}, a helpful AI assistant.`,
      apiConfig: {
        temperature: agentData.llmConfig?.temperature || 0.7,
        maxTokens: agentData.llmConfig?.maxTokens || 1000,
        apiKey: agentData.llmConfig?.apiKey
      }
    };
  }

  /**
   * Get chat configuration for a multi-agent system (user-session-based)
   */
  async getChatConfiguration(systemId: string): Promise<any> {
    try {
      if (!this.currentUserId) {
        throw new Error('No user set for multi-agent service');
      }

      // Load user's specific multi-agent system
      const systemData = await this.getUserMultiAgentSystem(systemId);
      if (!systemData) {
        throw new Error(`System ${systemId} not found for user ${this.currentUserId}`);
      }

      console.log('🔧 CHAT CONFIG: Loading configuration for system:', systemData.name);
      
      // Load agents using role-based mapping (not hardcoded IDs)
      const agents = await this.loadAgentsByRoles(systemData);
      
      console.log('🔧 CHAT CONFIG: Loaded', agents.length, 'agents for system');

      return {
        systemId,
        systemName: systemData.name,
        agentIds: agents.map(a => a.id), // ✅ Current user's agent IDs
        agents: agents, // ✅ User's actual agent objects with role assignments
        agentCount: agents.length, // ✅ Add missing agentCount property for UI display
        collaborationModel: systemData.collaborationModel || 'sequential',
        governanceConfiguration: systemData.governanceConfiguration || {},
        chatEnabled: systemData.chatEnabled !== false, // Default to true
        dashboardEnabled: systemData.dashboardEnabled || false,
        agentRoles: agents.map(a => a.assignedRole).filter(Boolean),
        systemType: systemData.systemType || 'sequential',
        userId: this.currentUserId, // ✅ User-specific
        roleAssignments: systemData.roleAssignments || {} // ✅ Role mappings
      };
    } catch (error) {
      console.error('🔧 CHAT CONFIG: Failed to get chat configuration:', error);
      throw error;
    }
  }

  /**
   * Load user's specific multi-agent system (not global/shared)
   * Handles both id and contextId scenarios for proper migration
   */
  private async getUserMultiAgentSystem(systemId: string): Promise<any> {
    if (!this.currentUserId) {
      throw new Error('No user set for multi-agent service');
    }
    
    console.log('🔧 USER SYSTEM: Loading system for user:', this.currentUserId, 'systemId:', systemId);
    
    try {
      // Try user-specific system first
      const userSystemKey = `${this.currentUserId}.multi-agent-systems.${systemId}`;
      console.log('🔧 USER SYSTEM: Trying user-specific key:', userSystemKey);
      let systemData = await this.storageService.get('multiAgentSystems', userSystemKey);
      
      if (systemData) {
        console.log('🔧 USER SYSTEM: Found system in user-specific format:', systemData.name);
        return systemData;
      }
      
      // Fallback to old format for migration - try multiple possible keys
      console.log('🔧 USER SYSTEM: Trying old format migration for system:', systemId);
      
      // Try direct system ID
      let oldFormatKey = `multi-agent-system-${systemId}`;
      console.log('🔧 USER SYSTEM: Trying old format key:', oldFormatKey);
      systemData = await this.storageService.get('agents', oldFormatKey);
      
      // If not found and systemId looks like a contextId (starts with ctx_), 
      // try to find by contextId in all systems
      if (!systemData && systemId.startsWith('ctx_')) {
        console.log('🔧 USER SYSTEM: SystemId appears to be contextId, searching all systems...');
        
        // Get user's multi-agent systems list
        const userSystems = await this.storageService.get('user', 'multi-agent-systems') || [];
        console.log('🔧 USER SYSTEM: Found user systems list:', userSystems.length);
        
        // Try each system to find one with matching contextId
        for (const systemRef of userSystems) {
          const testKey = `multi-agent-system-${systemRef.id}`;
          console.log('🔧 USER SYSTEM: Testing system key:', testKey);
          const testSystemData = await this.storageService.get('agents', testKey);
          
          if (testSystemData && (testSystemData.contextId === systemId || testSystemData.id === systemId)) {
            console.log('🔧 USER SYSTEM: Found matching system by contextId:', testSystemData.name);
            systemData = testSystemData;
            break;
          }
        }
      }
      
      if (systemData) {
        console.log('🔧 USER SYSTEM: Found system in old format, migrating...', systemData.name);
        console.log('🔧 USER SYSTEM: System details - id:', systemData.id, 'contextId:', systemData.contextId);
        
        // Migrate to user-specific format
        systemData.userId = this.currentUserId;
        systemData.migratedAt = new Date().toISOString();
        systemData.originalStorageKey = oldFormatKey; // Keep track of original key
        
        // Save in new format using the systemId that was requested
        const newUserSystemKey = `${this.currentUserId}.multi-agent-systems.${systemId}`;
        await this.storageService.set('multiAgentSystems', newUserSystemKey, systemData);
        console.log('🔧 USER SYSTEM: System migrated to user-specific format:', newUserSystemKey);
        
        return systemData;
      }
      
      console.warn('🔧 USER SYSTEM: System not found in any format:', systemId);
      return null;
      
    } catch (error) {
      console.error('🔧 USER SYSTEM: Error loading user multi-agent system:', error);
      return null;
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
   * Call individual agent's LLM provider directly (same pattern as single agents)
   */
  private async callAgentAPI(
    message: string, 
    agent: any, 
    attachments: any[] = [], 
    conversationHistory: any[] = [],
    governanceEnabled: boolean = true
  ): Promise<string> {
    try {
      console.log('🤖 MULTI-AGENT: Calling agent API for:', agent.identity?.name || agent.name);
      
      // Use global API configuration instead of individual agent API keys
      // This matches how single agents work in AdvancedChatComponent
      const provider = (agent.provider || 'openai').toLowerCase();
      const selectedModel = agent.model || 'gpt-3.5-turbo';
      
      console.log('🤖 MULTI-AGENT: Using global API configuration:', { 
        provider, 
        selectedModel,
        agentName: agent.identity?.name || agent.name
      });

      // Prepare message with attachments
      let messageContent = message;
      if (attachments.length > 0) {
        messageContent += '\n\nAttachments:\n';
        attachments.forEach(att => {
          messageContent += `- ${att.name} (${att.type})\n`;
          if (att.type.startsWith('image/') && att.data) {
            messageContent += `  Image data: ${att.data}\n`;
          }
        });
      }

      // Create system message based on governance setting
      let systemMessage;
      if (governanceEnabled) {
        // Use Promethios governance kernel for governed agents
        console.log('🛡️ GOVERNANCE: Using governance system message for agent:', agent.identity?.name || agent.name);
        systemMessage = createPromethiosSystemMessage();
        
        // Add agent-specific role context to governance message
        const agentRole = agent.role || 'assistant';
        const agentContext = `\n\nAgent Role Context: You are ${agent.identity?.name || agent.name}, a specialized ${agentRole}. Respond from your unique perspective and expertise while maintaining governance standards. Keep responses focused and distinct from other agents.`;
        systemMessage += agentContext;
      } else {
        // Use basic agent description for ungoverned agents
        console.log('🔓 UNGOVERNED: Using basic system message for agent:', agent.identity?.name || agent.name);
        const agentRole = agent.role || 'assistant';
        systemMessage = `You are ${agent.identity?.name || agent.name}, a specialized ${agentRole}. 
Respond from your unique perspective and expertise. Keep responses focused and distinct from other agents.`;
      }

      let response;
      
      
      if (provider === 'openai') {
        console.log('🤖 MULTI-AGENT: Taking OpenAI path for agent:', agent.identity?.name || agent.name);
        
        // Get global OpenAI API key from environment or user settings
        const globalApiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                           localStorage.getItem('openai_api_key') ||
                           sessionStorage.getItem('openai_api_key');
        
        if (!globalApiKey) {
          throw new Error('OpenAI API key not configured. Please set your API key in settings.');
        }
        
        // Create system message with agent's role context
        const agentName = agent.identity?.name || agent.name;
        const agentRole = agent.assignedRole || agent.role || agent.identity?.role;
        const systemMessage = `You are ${agentName}, ${agentRole}. ${agent.systemPrompt || agent.identity?.description || `You are a helpful AI assistant specializing in ${agentRole}.`}`;

        // Convert conversation history to OpenAI API format
        const historyMessages = conversationHistory
          .filter(msg => msg.sender === 'user' || msg.sender === 'agent')
          .slice(-20) // Last 20 messages to manage token limits
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));

        const messages = [
          {
            role: 'system',
            content: systemMessage
          },
          ...historyMessages,
          {
            role: 'user',
            content: messageContent
          }
        ];

        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${globalApiKey}`
          },
          body: JSON.stringify({
            model: selectedModel || 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response received';
        
      } else if (provider === 'anthropic') {
        console.log('🤖 MULTI-AGENT: Taking Anthropic path for agent:', agent.identity?.name || agent.name);
        
        // For Anthropic, use the backend proxy (same as single agents)
        // Create system message with agent's role context
        const agentName = agent.identity?.name || agent.name;
        const agentRole = agent.assignedRole || agent.role || agent.identity?.role;
        const systemMessage = `You are ${agentName}, ${agentRole}. ${agent.systemPrompt || agent.identity?.description || `You are a helpful AI assistant specializing in ${agentRole}.`}`;

        // Convert conversation history for backend API
        const historyMessages = conversationHistory
          .filter(msg => msg.sender === 'user' || msg.sender === 'agent')
          .slice(-20)
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));

        response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agent_id: 'factual-agent', // Maps to Anthropic in backend
            message: messageContent,
            system_message: systemMessage,
            conversation_history: historyMessages,
            governance_enabled: governanceEnabled
          })
        });

        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || 'No response received';
      }
      
      // Add other providers as needed...
      throw new Error(`Unsupported provider: ${provider}`);
      
    } catch (error) {
      console.error('🤖 MULTI-AGENT: Error calling agent API:', error);
      throw error;
    }
  }

  /**
   * Send message to multi-agent system with optional streaming support
   */
  async sendMessage(
    sessionId: string, 
    message: string, 
    attachments: any[] = [],
    governanceEnabled: boolean = true,
    conversationHistory: any[] = [],
    onStreamResponse?: (response: any) => void
  ): Promise<{ content: string; agentResponses: any[]; governanceData?: any }> {
    console.log('🚨 DEBUG: sendMessage method called - ENTRY POINT (ROUTER)');
    console.log('🛡️ GOVERNANCE STATUS: Governance enabled =', governanceEnabled);
    
    try {
      const session = await this.getChatSession(sessionId);
      if (!session) {
        throw new Error(`Chat session ${sessionId} not found`);
      }

      // Get system configuration with agents
      const config = await this.getChatConfiguration(session.systemId);
      if (!config.agents || config.agents.length === 0) {
        throw new Error('No agents found in system configuration');
      }

      const collaborationModel = config.collaborationModel || 'shared_context';
      console.log('🎯 COLLABORATION ROUTER: Using model:', collaborationModel);

      // Route to appropriate collaboration model handler
      switch (collaborationModel) {
        case 'round_table_discussion':
        case 'round_table_sequential':  // Handle existing systems
          console.log('🎭 ROUTER: Routing to Round-Table Discussion handler');
          return this.handleRoundTableDiscussion(sessionId, message, attachments, governanceEnabled, conversationHistory, onStreamResponse);
        
        case 'shared_context':
          console.log('🧡 ROUTER: Routing to Shared Context handler');
          return this.handleSharedContext(sessionId, message, attachments, governanceEnabled, conversationHistory);
        
        case 'sequential_handoffs':
          console.log('🔵 ROUTER: Routing to Sequential Handoffs handler');
          return this.handleSequentialHandoffs(sessionId, message, attachments, governanceEnabled, conversationHistory);
        
        case 'parallel_processing':
          console.log('⚡ ROUTER: Routing to Parallel Processing handler');
          return this.handleParallelProcessing(sessionId, message, attachments, governanceEnabled, conversationHistory);
        
        case 'hierarchical_coordination':
          console.log('🏛️ ROUTER: Routing to Hierarchical Coordination handler');
          return this.handleHierarchicalCoordination(sessionId, message, attachments, governanceEnabled, conversationHistory);
        
        case 'consensus_decision':
          console.log('🗳️ ROUTER: Routing to Consensus Decision handler');
          return this.handleConsensusDecision(sessionId, message, attachments, governanceEnabled, conversationHistory);
        
        case 'blind_vision_creative':
          console.log('🧠 ROUTER: Routing to Blind Vision Creative handler');
          return this.handleBlindVisionCreative(sessionId, message, attachments, governanceEnabled, conversationHistory, onStreamResponse);
        
        default:
          console.log('🔄 ROUTER: Unknown collaboration model, using fallback (parallel processing)');
          return this.handleParallelProcessing(sessionId, message, attachments, governanceEnabled, conversationHistory);
      }
      
    } catch (error) {
      console.error('🚨 COLLABORATION ROUTER ERROR:', error);
      throw error;
    }
  }

  /**
   * Handle Parallel Processing collaboration model (current default behavior)
   */
  private async handleParallelProcessing(
    sessionId: string,
    message: string,
    attachments: any[] = [],
    governanceEnabled: boolean = true,
    conversationHistory: any[] = []
  ): Promise<{ content: string; agentResponses: any[]; governanceData?: any }> {
    console.log('⚡ PARALLEL PROCESSING: Starting parallel agent execution');
    
    const session = await this.getChatSession(sessionId);
    const config = await this.getChatConfiguration(session!.systemId);
    
    const agentResponses = [];
    const errors = [];

    // Call all agents in parallel (current behavior)
    const agentPromises = config.agents.map(async (agent: any) => {
      try {
        console.log('🤖 PARALLEL PROCESSING: Processing agent:', agent.identity?.name || agent.name);
        
        const response = await this.callAgentAPI(
          message,
          agent,
          attachments,
          conversationHistory,
          governanceEnabled
        );

        return {
          agentName: agent.identity?.name || agent.name,
          agentId: agent.id,
          content: response,
          timestamp: new Date().toISOString(),
          provider: agent.provider || 'openai',
          model: agent.model || 'gpt-3.5-turbo'
        };
      } catch (error) {
        console.error(`❌ PARALLEL PROCESSING: Error from ${agent.identity?.name || agent.name}:`, error);
        errors.push({
          agentName: agent.identity?.name || agent.name,
          error: error.message
        });
        return {
          agentName: agent.identity?.name || agent.name,
          agentId: agent.id,
          content: `Error: Agent could not respond - ${error.message}`,
          timestamp: new Date().toISOString(),
          isError: true
        };
      }
    });

    const responses = await Promise.all(agentPromises);
    agentResponses.push(...responses);

    // Create combined content for backward compatibility
    const combinedContent = agentResponses
      .filter(r => !r.isError)
      .map(r => `**${r.agentName}:** ${r.content}`)
      .join('\n\n');

    console.log('⚡ PARALLEL PROCESSING: Completed with', agentResponses.length, 'responses');

    return {
      content: combinedContent || 'No successful responses received.',
      agentResponses,
      governanceData: {
        collaborationModel: 'parallel_processing',
        totalResponses: agentResponses.length,
        errors: errors.length > 0 ? errors : undefined
      }
    };
  }

  /**
   * Handle Round-Table Discussion collaboration model (sequential debate engine with streaming)
   */
  private async handleRoundTableDiscussion(
    sessionId: string,
    message: string,
    attachments: any[] = [],
    governanceEnabled: boolean = true,
    conversationHistory: any[] = [],
    onStreamResponse?: (response: any) => void
  ): Promise<{ content: string; agentResponses: any[]; governanceData?: any }> {
    console.log('🎭 ROUND-TABLE DISCUSSION: Starting sequential debate system with streaming');
    console.log('🛡️ ROUND-TABLE GOVERNANCE: Individual agent governance enabled =', governanceEnabled);
    
    const session = await this.getChatSession(sessionId);
    const config = await this.getChatConfiguration(session!.systemId);
    
    // Sort agents alphabetically by name for consistent ordering
    const sortedAgents = [...config.agents].sort((a, b) => {
      const nameA = (a.identity?.name || a.name || '').toLowerCase();
      const nameB = (b.identity?.name || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    console.log('🎭 ROUND-TABLE: Agent order (alphabetical):', 
      sortedAgents.map(a => a.identity?.name || a.name));

    // Initialize debate state
    const debateHistory = [];
    const maxRounds = 3;
    let allAgentResponses = [];

    // Send initial debate start indicator
    if (onStreamResponse) {
      onStreamResponse({
        type: 'debate_start',
        content: `🎭 **Round-Table Discussion Started**\n\n**Participants:** ${sortedAgents.map(a => a.identity?.name || a.name).join(', ')}\n**Format:** 3 rounds + consensus\n**Order:** Alphabetical`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      });
    }

    // 🛡️ INITIALIZE MULTI-AGENT GOVERNANCE
    let governanceState: GovernanceState | null = null;
    if (governanceEnabled) {
      console.log('🛡️ MULTI-AGENT GOVERNANCE: Initializing governance wrapper for debate system');
      const agentIds = sortedAgents.map(a => a.id || a.identity?.name || a.name);
      governanceState = await multiAgentGovernanceWrapper.initializeGovernance(
        session!.systemId,
        sessionId,
        governanceEnabled,
        agentIds
      );

      if (onStreamResponse) {
        onStreamResponse({
          type: 'governance_initialized',
          content: `🛡️ **Multi-Agent Governance Active**\n\n**Monitoring:** Emergent behaviors, trust scores, policy compliance\n**Intervention:** Automatic safety controls enabled\n**Agents:** ${agentIds.length} agents under governance`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
          governanceData: {
            enabled: true,
            agentCount: agentIds.length,
            trustScores: governanceState.trustScores
          }
        });
      }
    } else {
      console.log('🔓 MULTI-AGENT GOVERNANCE: Governance disabled - running ungoverned debate');
      if (onStreamResponse) {
        onStreamResponse({
          type: 'governance_disabled',
          content: `🔓 **Ungoverned Mode Active**\n\n**Warning:** No governance monitoring or intervention\n**Behavior:** Raw, unfiltered AI-to-AI interaction\n**Risk:** Emergent behaviors may occur without control`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
          governanceData: {
            enabled: false,
            warning: 'Ungoverned mode - no safety controls active'
          }
        });
      }
    }

    // DEBATE ROUNDS (3 rounds maximum)
    for (let round = 1; round <= maxRounds; round++) {
      console.log(`\n🎭 ROUND-TABLE: === ROUND ${round} ===`);
      
      // Send round start indicator
      if (onStreamResponse) {
        onStreamResponse({
          type: 'round_start',
          content: `## 🎭 Round ${round} ${round === 1 ? '- Initial Perspectives' : round === 2 ? '- Building on Ideas' : '- Seeking Consensus'}`,
          round,
          timestamp: new Date().toISOString(),
          isSystemMessage: true
        });
      }
      
      // Each agent responds in alphabetical order
      for (let agentIndex = 0; agentIndex < sortedAgents.length; agentIndex++) {
        const agent = sortedAgents[agentIndex];
        const agentName = agent.identity?.name || agent.name;
        
        console.log(`🎭 ROUND-TABLE: Round ${round} - Agent ${agentIndex + 1}/${sortedAgents.length}: ${agentName}`);

        // Send "thinking" indicator
        if (onStreamResponse) {
          console.log('🎭 STREAMING: Sending thinking indicator for', agentName);
          onStreamResponse({
            type: 'agent_thinking',
            content: `💭 **${agentName}** is ${round === 1 ? 'formulating initial thoughts' : round === 2 ? 'analyzing previous responses' : 'working toward consensus'}...`,
            agentName,
            round,
            agentIndex: agentIndex + 1,
            totalAgents: sortedAgents.length,
            timestamp: new Date().toISOString(),
            isSystemMessage: true
          });
        } else {
          console.log('🎭 STREAMING: No onStreamResponse callback available');
        }

        try {
          // Create debate-specific prompt based on round and position
          const debatePrompt = this.createDebatePrompt(
            agent, 
            message, 
            debateHistory, 
            round, 
            agentIndex, 
            sortedAgents,
            round === maxRounds // isLastRound
          );

          // Call agent with full debate context
          const agentResponse = await this.callAgentAPI(
            debatePrompt,
            agent,
            attachments,
            conversationHistory,
            governanceEnabled
          );

          // Add response to debate history
          const debateEntry = {
            round,
            agentName,
            agentId: agent.id || `agent_${agentIndex}`,
            content: agentResponse,
            timestamp: new Date().toISOString(),
            order: agentIndex + 1
          };

          debateHistory.push(debateEntry);
          allAgentResponses.push(debateEntry);

          console.log(`✅ ROUND-TABLE: ${agentName} responded (${agentResponse.length} chars)`);

          // 🛡️ GOVERNANCE MONITORING: Analyze agent response for violations and emergent behaviors
          let governanceAnalysis = { violations: [], emergentBehaviors: [], interventionNeeded: false };
          if (governanceEnabled && governanceState) {
            console.log(`🛡️ GOVERNANCE MONITOR: Analyzing ${agentName}'s response for governance compliance`);
            
            governanceAnalysis = await multiAgentGovernanceWrapper.monitorAgentResponse(
              sessionId,
              agent.id || agentName,
              agentName,
              agentResponse,
              round,
              debateHistory
            );

            // Log governance findings
            if (governanceAnalysis.violations.length > 0) {
              console.log(`⚠️ GOVERNANCE: ${governanceAnalysis.violations.length} violations detected from ${agentName}`);
            }
            if (governanceAnalysis.emergentBehaviors.length > 0) {
              console.log(`🔍 GOVERNANCE: ${governanceAnalysis.emergentBehaviors.length} emergent behaviors detected from ${agentName}`);
            }

            // Stream governance alerts if significant issues found
            if (governanceAnalysis.violations.length > 0 || governanceAnalysis.emergentBehaviors.length > 0) {
              if (onStreamResponse) {
                const criticalIssues = [
                  ...governanceAnalysis.violations.filter(v => v.severity === 'critical' || v.severity === 'high'),
                  ...governanceAnalysis.emergentBehaviors.filter(b => b.severity === 'critical' || b.severity === 'high')
                ];

                if (criticalIssues.length > 0) {
                  onStreamResponse({
                    type: 'governance_alert',
                    content: `🚨 **Governance Alert**: ${criticalIssues.length} significant issue(s) detected in ${agentName}'s response`,
                    agentName,
                    round,
                    timestamp: new Date().toISOString(),
                    isSystemMessage: true,
                    governanceData: {
                      violations: governanceAnalysis.violations,
                      emergentBehaviors: governanceAnalysis.emergentBehaviors,
                      trustScore: governanceState.trustScores[agent.id || agentName]
                    }
                  });
                }
              }
            }

            // Execute intervention if needed
            if (governanceAnalysis.interventionNeeded) {
              console.log(`🚨 GOVERNANCE INTERVENTION: Required for ${agentName}'s response`);
              
              const interventionResult = await multiAgentGovernanceWrapper.executeIntervention(
                sessionId,
                `Governance violations or critical emergent behaviors detected in ${agentName}'s response`,
                governanceAnalysis.violations.some(v => v.severity === 'critical') || 
                governanceAnalysis.emergentBehaviors.some(b => b.severity === 'critical') ? 'critical' : 'high'
              );

              if (onStreamResponse && interventionResult.message) {
                onStreamResponse({
                  type: 'governance_intervention',
                  content: interventionResult.message,
                  agentName,
                  round,
                  timestamp: new Date().toISOString(),
                  isSystemMessage: true,
                  governanceData: {
                    action: interventionResult.action,
                    shouldContinue: interventionResult.shouldContinue,
                    interventionCount: governanceState.interventionCount
                  }
                });
              }

              // Stop debate if critical intervention
              if (!interventionResult.shouldContinue) {
                console.log('🚨 GOVERNANCE: Debate stopped due to critical intervention');
                return {
                  content: `🚨 **Debate Terminated**: ${interventionResult.message}`,
                  agentResponses: allAgentResponses,
                  governanceData: {
                    terminated: true,
                    reason: interventionResult.message,
                    governanceState: multiAgentGovernanceWrapper.getGovernanceState(sessionId)
                  }
                };
              }
            }
          }

          // Stream the agent response immediately with governance data
          if (onStreamResponse) {
            console.log('🎭 STREAMING: Sending agent response for', agentName, '(' + agentResponse.length + ' chars)');
            
            // 🛡️ PREPARE INDIVIDUAL AGENT GOVERNANCE DATA FOR SHIELD
            const individualGovernanceData = governanceEnabled && governanceState ? {
              // Standard governance fields
              approved: !governanceAnalysis.interventionNeeded && governanceAnalysis.violations.length === 0,
              trustScore: (governanceState.trustScores[agent.id || agentName] || 1.0) * 100,
              violations: governanceAnalysis.violations.map(v => v.description || v.type || 'Unknown violation'),
              behaviorTags: governanceAnalysis.emergentBehaviors.map(b => b.subtype || b.type),
              transparencyMessage: governanceAnalysis.emergentBehaviors.some(b => b.type === 'positive_emergence') ? 
                'Agent demonstrated positive emergent behavior in multi-agent collaboration' : undefined,
              
              // 🎭 MULTI-AGENT SPECIFIC FIELDS
              agentId: agent.id || agentName,
              agentName,
              round,
              responseOrder: agentIndex + 1,
              
              // Cross-agent interaction analysis
              crossAgentInteractions: {
                referencedAgents: this.detectAgentReferences(agentResponse, sortedAgents, agentName),
                buildingOnPrevious: this.detectBuildingBehavior(agentResponse, debateHistory),
                contradictingPrevious: this.detectContradictingBehavior(agentResponse, debateHistory),
                totalInteractions: debateHistory.filter(entry => entry.agentName !== agentName).length
              },
              
              // Emergent behaviors with enhanced detail
              emergentBehaviors: governanceAnalysis.emergentBehaviors.map(behavior => ({
                ...behavior,
                round,
                agentName,
                contextualDescription: this.enhanceEmergentBehaviorDescription(behavior, agentName, round)
              })),
              
              // Multi-agent context
              multiAgentContext: {
                totalAgents: sortedAgents.length,
                debatePhase: round <= maxRounds ? 'debate' : 'consensus',
                governanceEnabled: governanceEnabled,
                platformDiversity: [...new Set(sortedAgents.map(a => a.provider || 'openai'))].length > 1,
                currentTrustDistribution: governanceState.trustScores
              }
            } : null;

            onStreamResponse({
              type: 'agent_response',
              content: agentResponse,
              agentName,
              agentId: agent.id,
              round,
              agentIndex: agentIndex + 1,
              totalAgents: sortedAgents.length,
              timestamp: new Date().toISOString(),
              order: agentIndex + 1,
              provider: agent.provider || 'openai',
              model: agent.model || 'gpt-3.5-turbo',
              // 🛡️ ADD INDIVIDUAL GOVERNANCE DATA FOR OBSERVER SHIELD
              governanceData: individualGovernanceData
            });
          } else {
            console.log('🎭 STREAMING: No onStreamResponse callback available for agent response');
          }

          // Add pacing delay between agents (except after last agent in round)
          if (agentIndex < sortedAgents.length - 1) {
            console.log('🎭 ROUND-TABLE: Adding 3-second pacing delay...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

        } catch (error) {
          console.error(`❌ ROUND-TABLE: Error from ${agentName}:`, error);
          const errorEntry = {
            round,
            agentName,
            agentId: agent.id || `agent_${agentIndex}`,
            content: `[Error: ${agentName} could not respond - ${error.message}]`,
            timestamp: new Date().toISOString(),
            order: agentIndex + 1,
            isError: true
          };
          debateHistory.push(errorEntry);
          allAgentResponses.push(errorEntry);

          // Stream error response
          if (onStreamResponse) {
            onStreamResponse({
              type: 'agent_error',
              content: `❌ **${agentName}** encountered an error: ${error.message}`,
              agentName,
              round,
              timestamp: new Date().toISOString(),
              isError: true,
              isSystemMessage: true
            });
          }
        }
      }

      console.log(`🎭 ROUND-TABLE: Round ${round} completed. Total responses: ${debateHistory.length}`);
      
      // Add delay between rounds (except after last round)
      if (round < maxRounds) {
        console.log('🎭 ROUND-TABLE: Adding 5-second delay between rounds...');
        if (onStreamResponse) {
          onStreamResponse({
            type: 'round_complete',
            content: `✅ **Round ${round} Complete** - Preparing for Round ${round + 1}...`,
            round,
            timestamp: new Date().toISOString(),
            isSystemMessage: true
          });
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // CONSENSUS PHASE - Select final reporter
    console.log('\n🎭 ROUND-TABLE: === CONSENSUS PHASE ===');
    
    if (onStreamResponse) {
      onStreamResponse({
        type: 'consensus_start',
        content: `## 🗳️ Consensus Phase\n\nSelecting the best agent to provide the final consensus report...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      });
    }

    const consensusReporter = await this.selectConsensusReporter(sortedAgents, debateHistory, message);
    
    // Generate final consensus report
    console.log(`🎭 ROUND-TABLE: ${consensusReporter.agentName} selected as consensus reporter`);
    
    if (onStreamResponse) {
      onStreamResponse({
        type: 'consensus_reporter_selected',
        content: `📋 **${consensusReporter.agentName}** has been selected to provide the final consensus report.\n\n*${consensusReporter.reason}*`,
        agentName: consensusReporter.agentName,
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      });
      
      onStreamResponse({
        type: 'consensus_generating',
        content: `💭 **${consensusReporter.agentName}** is synthesizing all perspectives into a comprehensive consensus report...`,
        agentName: consensusReporter.agentName,
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      });
    }

    // 🧬 ENHANCED CONSENSUS: Generate collaborative intelligence report
    console.log('🧬 ENHANCED CONSENSUS: Generating collaborative intelligence analysis...');
    
    if (onStreamResponse) {
      onStreamResponse({
        type: 'consensus_analysis',
        content: `💭 **Analyzing collaborative intelligence...** Tracking conversation evolution, emergent insights, and collaborative value...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      });
    }

    // Transform debate history for enhanced analysis
    const enhancedDebateHistory = debateHistory.map(entry => ({
      agentName: entry.agentName,
      content: entry.content,
      round: entry.round,
      timestamp: entry.timestamp
    }));

    // Generate readable consensus with narrative cohesion and agent signatures
    const finalConsensus = await this.readableConsensusEngine.generateReadableConsensus(
      message,
      enhancedDebateHistory,
      sortedAgents
    );

    console.log('📖 READABLE CONSENSUS: Generated user-friendly analysis with agent signatures');

    // Add readable consensus report to responses
    const consensusEntry = {
      round: 'consensus',
      agentName: 'Readable Consensus Engine',
      agentId: 'readable_consensus_engine',
      content: finalConsensus,
      timestamp: new Date().toISOString(),
      order: 999, // Always last
      isConsensus: true,
      isReadableConsensus: true // Flag for readable consensus
    };

    allAgentResponses.push(consensusEntry);

    // Stream the readable consensus report
    if (onStreamResponse) {
      onStreamResponse({
        type: 'readable_consensus_report',
        content: finalConsensus,
        agentName: 'Readable Consensus Engine',
        agentId: 'readable_consensus_engine',
        timestamp: new Date().toISOString(),
        isConsensus: true,
        isReadableConsensus: true,
        isFinal: true
      });
      
      onStreamResponse({
        type: 'debate_complete',
        content: `🎉 **Readable Collaborative Analysis Complete!**\n\n**Total Responses:** ${allAgentResponses.length} (${debateHistory.length} debate + 1 readable consensus)\n**Analysis Engine:** Readable Consensus Engine\n**Enhanced Features:** 📖 Narrative cohesion, 🎭 agent signatures, 💡 quote weighting!`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        isFinal: true
      });
    }

    // Create summary for backward compatibility
    const summaryContent = this.createDebateSummary(debateHistory, finalConsensus, 'Readable Consensus Engine');

    console.log('🎭 ROUND-TABLE: Debate completed successfully!');
    console.log(`🎭 ROUND-TABLE: Total responses: ${allAgentResponses.length} (${debateHistory.length} debate + 1 consensus)`);

    return {
      content: summaryContent,
      agentResponses: allAgentResponses,
      governanceData: {
        collaborationModel: 'round_table_discussion',
        debateRounds: maxRounds,
        totalResponses: allAgentResponses.length,
        consensusReporter: consensusReporter.agentName,
        debateMode: 'sequential_consensus_streaming',
        // 🛡️ COMPREHENSIVE GOVERNANCE DATA
        governance: {
          enabled: governanceEnabled,
          state: governanceState ? multiAgentGovernanceWrapper.getGovernanceState(sessionId) : null,
          summary: governanceState ? {
            totalEvents: governanceState.governanceEvents.length,
            interventions: governanceState.interventionCount,
            emergentBehaviors: governanceState.emergentBehaviors.length,
            collaborationHealth: governanceState.collaborationHealth,
            trustScores: governanceState.trustScores,
            lastHealthCheck: governanceState.lastHealthCheck
          } : null,
          crossPlatformInteraction: {
            monitored: governanceEnabled,
            agentCount: sortedAgents.length,
            platforms: [...new Set(sortedAgents.map(a => a.provider || 'openai'))],
            totalInteractions: debateHistory.length
          }
        },
        // 🛡️ SYSTEM-LEVEL GOVERNANCE DATA FOR OBSERVER SHIELD
        systemGovernance: governanceEnabled && governanceState ? {
          systemApproved: governanceState.interventionCount === 0 && 
                         governanceState.emergentBehaviors.filter(b => b.type === 'negative_emergence').length === 0,
          overallTrustScore: Object.values(governanceState.trustScores).reduce((sum, score) => sum + (score as number), 0) / 
                            Object.keys(governanceState.trustScores).length * 100,
          systemViolations: governanceState.governanceEvents
            .filter(event => event.type === 'violation' || event.severity === 'critical')
            .map(event => event.description || event.type),
          interventionCount: governanceState.interventionCount,
          
          // Cross-platform interaction governance
          crossPlatformInteractions: {
            totalInteractions: debateHistory.length,
            platforms: [...new Set(sortedAgents.map(a => a.provider || 'openai'))],
            interactionQuality: governanceState.collaborationHealth || 100,
            governanceBreaches: governanceState.governanceEvents.filter(e => e.type === 'breach').length
          },
          
          // Emergent behavior system analysis
          emergentBehaviors: {
            positive: governanceState.emergentBehaviors.filter(b => b.type === 'positive_emergence').length,
            negative: governanceState.emergentBehaviors.filter(b => b.type === 'negative_emergence').length,
            systemDrift: governanceState.emergentBehaviors.filter(b => b.type === 'system_drift').length,
            criticalBehaviors: governanceState.emergentBehaviors.filter(b => b.severity === 'critical')
          },
          
          // Collaboration health
          collaborationHealth: {
            overall: governanceState.collaborationHealth || 100,
            trustDistribution: governanceState.trustScores,
            consensusStrength: debateHistory.length > 0 ? 
              (debateHistory.filter(entry => entry.content.toLowerCase().includes('agree') || 
                                           entry.content.toLowerCase().includes('consensus')).length / debateHistory.length) * 100 : 0,
            participationBalance: sortedAgents.reduce((balance, agent) => {
              const agentName = agent.identity?.name || agent.name;
              const agentResponses = debateHistory.filter(entry => entry.agentName === agentName);
              balance[agentName] = (agentResponses.length / debateHistory.length) * 100;
              return balance;
            }, {} as Record<string, number>)
          },
          
          // Governance events summary
          governanceEvents: {
            total: governanceState.governanceEvents.length,
            byType: governanceState.governanceEvents.reduce((summary, event) => {
              summary[event.type] = (summary[event.type] || 0) + 1;
              return summary;
            }, {} as Record<string, number>),
            interventions: governanceState.interventionCount,
            criticalEvents: governanceState.governanceEvents.filter(e => e.severity === 'critical').length
          },
          
          // Multi-agent specific metrics
          multiAgentMetrics: {
            totalAgents: sortedAgents.length,
            platformDiversity: [...new Set(sortedAgents.map(a => a.provider || 'openai'))].length > 1,
            debateRounds: maxRounds,
            consensusAchieved: summaryContent.toLowerCase().includes('consensus') || 
                              summaryContent.toLowerCase().includes('agreement'),
            governanceMode: governanceEnabled ? 'active' : 'disabled'
          }
        } : {
          // Ungoverned mode system data
          systemApproved: false,
          overallTrustScore: 0,
          systemViolations: ['Governance disabled - no monitoring active'],
          interventionCount: 0,
          crossPlatformInteractions: {
            totalInteractions: debateHistory.length,
            platforms: [...new Set(sortedAgents.map(a => a.provider || 'openai'))],
            interactionQuality: 0,
            governanceBreaches: 0
          },
          emergentBehaviors: { positive: 0, negative: 0, systemDrift: 0, criticalBehaviors: [] },
          collaborationHealth: { overall: 0, trustDistribution: {}, consensusStrength: 0, participationBalance: {} },
          governanceEvents: { total: 0, byType: {}, interventions: 0, criticalEvents: 0 },
          multiAgentMetrics: {
            totalAgents: sortedAgents.length,
            platformDiversity: [...new Set(sortedAgents.map(a => a.provider || 'openai'))].length > 1,
            debateRounds: maxRounds,
            consensusAchieved: false,
            governanceMode: 'ungoverned'
          }
        }
      }
    };
  }

  /**
   * Handle Blind Vision Creative collaboration model
   * Enables true parallel ideation with agent isolation for breakthrough creativity
   */
  private async handleBlindVisionCreative(
    sessionId: string,
    message: string,
    attachments: any[],
    governanceEnabled: boolean,
    conversationHistory: any[],
    onStreamResponse?: (response: any) => void,
    creativityLevel: 'radical' | 'breakthrough' | 'revolutionary' = 'breakthrough'
  ): Promise<any> {
    try {
      console.log('🧠 BLIND VISION CREATIVE: Starting parallel ideation protocol');

      // Get session and agents
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const system = await this.storageService.getMultiAgentSystem(session.systemId);
      if (!system || !system.agents || system.agents.length === 0) {
        throw new Error('No agents found in system');
      }

      const sortedAgents = [...system.agents].sort((a, b) => (a.order || 0) - (b.order || 0));
      console.log(`🎭 BLIND VISION: ${sortedAgents.length} agents ready for creative divergence`);

      // Stream initial protocol message
      if (onStreamResponse) {
        onStreamResponse({
          type: 'blind_vision_protocol_start',
          content: `🧠 **BLIND VISION CREATIVE PROTOCOL ACTIVATED**\n\n🎯 **Mission:** ${message}\n🔒 **Agent Isolation:** ACTIVE\n⚡ **Creativity Level:** ${creativityLevel.toUpperCase()}\n🎭 **Agents:** ${sortedAgents.map(a => a.identity?.name || a.name).join(', ')}\n\n**Preparing for parallel ideation with zero cross-contamination...**`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
          isBlindVisionStart: true
        });
      }

      // Execute Blind Vision Protocol
      const blindVisionResult = await this.blindVisionProtocol.executeBlindVisionProtocol(
        message,
        sortedAgents.map(a => a.identity?.name || a.name),
        creativityLevel,
        onStreamResponse
      );

      // Generate final creative synthesis report
      const creativeSynthesis = await this.generateCreativeSynthesisReport(
        blindVisionResult,
        message,
        sortedAgents,
        creativityLevel
      );

      // Stream the creative synthesis
      if (onStreamResponse) {
        onStreamResponse({
          type: 'creative_synthesis',
          content: creativeSynthesis,
          agentName: 'Creative Synthesis Engine',
          agentId: 'synthesis_engine',
          timestamp: new Date().toISOString(),
          isCreativeSynthesis: true,
          isFinal: true,
          creativityMetrics: blindVisionResult.creativityMetrics
        });
      }

      console.log('🎉 BLIND VISION CREATIVE: Protocol completed successfully');

      // Return comprehensive result
      return {
        content: creativeSynthesis,
        agentResponses: this.formatBlindVisionResponses(blindVisionResult),
        creativityData: {
          collaborationModel: 'blind_vision_creative',
          creativityLevel,
          protocolPhases: 4,
          metrics: blindVisionResult.creativityMetrics,
          consensusAchieved: blindVisionResult.finalVision.consensusAchieved,
          competingVisions: blindVisionResult.finalVision.competingVisions?.length || 0,
          breakthroughPotential: blindVisionResult.creativityMetrics.breakthroughPotential,
          
          // Round-by-round data
          blindResponses: Array.from(blindVisionResult.blindResponses.values()),
          confrontationResults: blindVisionResult.confrontationResults,
          synthesisResults: blindVisionResult.synthesisResults,
          finalVision: blindVisionResult.finalVision,
          
          // Agent creativity analysis
          agentCreativity: Array.from(blindVisionResult.blindResponses.values()).map(response => ({
            agentName: response.agentName,
            prototypeGenerated: response.prototypeGenerated,
            radicalityScore: response.radicalityScore,
            divergenceContribution: this.calculateAgentDivergenceContribution(response, blindVisionResult.blindResponses)
          })),
          
          // Protocol effectiveness
          protocolEffectiveness: {
            isolationSuccess: true, // All Round 0 responses were independent
            divergenceAchieved: blindVisionResult.creativityMetrics.divergenceScore > 6,
            conflictGenerated: blindVisionResult.creativityMetrics.conflictLevel > 5,
            synthesisQuality: blindVisionResult.creativityMetrics.synthesisSuccess,
            breakthroughAchieved: blindVisionResult.creativityMetrics.breakthroughPotential > 7
          }
        },
        governanceData: {
          // Blind Vision operates in ungoverned mode for maximum creativity
          governanceMode: 'creative_ungoverned',
          creativityOptimized: true,
          safetyConstraints: 'minimal',
          innovationPriority: 'maximum'
        }
      };

    } catch (error) {
      console.error('Blind Vision Creative error:', error);
      
      if (onStreamResponse) {
        onStreamResponse({
          type: 'error',
          content: `❌ **BLIND VISION PROTOCOL ERROR**\n\nError: ${error.message}\n\nFalling back to standard multi-agent discussion...`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
          isError: true
        });
      }

      // Fallback to regular round table discussion
      return this.handleRoundTableDiscussion(sessionId, message, attachments, false, conversationHistory, onStreamResponse);
    }
  }

  /**
   * Generate creative synthesis report from blind vision results
   */
  private async generateCreativeSynthesisReport(
    blindVisionResult: any,
    originalPrompt: string,
    agents: any[],
    creativityLevel: string
  ): Promise<string> {
    const { blindResponses, confrontationResults, synthesisResults, finalVision, creativityMetrics } = blindVisionResult;

    // Build comprehensive creative synthesis
    let report = `🧬 **BLIND VISION CREATIVE SYNTHESIS**\n\n`;
    
    // Executive Summary
    report += `🎯 **CREATIVE BREAKTHROUGH SUMMARY**\n`;
    report += `**Challenge:** ${originalPrompt}\n`;
    report += `**Creativity Level:** ${creativityLevel.toUpperCase()}\n`;
    report += `**Breakthrough Potential:** ${creativityMetrics.breakthroughPotential}/10\n`;
    report += `**Divergence Achieved:** ${creativityMetrics.divergenceScore}/10\n\n`;

    // Round 0: Independent Visions
    report += `🔒 **ROUND 0: INDEPENDENT VISIONS** (Isolation Mode)\n\n`;
    Array.from(blindResponses.values()).forEach((response: any) => {
      const agentRole = this.getCreativeRole(response.agentName);
      report += `**${agentRole.icon} ${response.agentName} (${agentRole.role})**\n`;
      report += `• **Prototype:** ${response.prototypeGenerated || 'Unnamed Innovation'}\n`;
      report += `• **Radicality:** ${response.radicalityScore}/10\n`;
      report += `• **Vision:** ${this.extractVisionSummary(response.content)}\n\n`;
    });

    // Round 1: Creative Confrontation
    if (confrontationResults.length > 0) {
      report += `⚔️ **ROUND 1: CREATIVE CONFRONTATION**\n\n`;
      report += `**Challenges Raised:** ${confrontationResults.reduce((sum, r) => sum + r.challengesRaised.length, 0)}\n`;
      report += `**Defenses Offered:** ${confrontationResults.reduce((sum, r) => sum + r.defensesOffered.length, 0)}\n`;
      report += `**Conflict Level:** ${creativityMetrics.conflictLevel}/10\n\n`;
      
      confrontationResults.forEach((result: any) => {
        if (result.challengesRaised.length > 0) {
          report += `**${result.agentName} Key Challenges:**\n`;
          result.challengesRaised.slice(0, 2).forEach((challenge: string) => {
            report += `• ${challenge}\n`;
          });
          report += `\n`;
        }
      });
    }

    // Round 2: Creative Synthesis
    if (synthesisResults.length > 0) {
      report += `🔬 **ROUND 2: CREATIVE SYNTHESIS**\n\n`;
      report += `**Hybridization Attempts:** ${synthesisResults.reduce((sum, r) => sum + r.hybridizationAttempts.length, 0)}\n`;
      report += `**Evolution Proposals:** ${synthesisResults.reduce((sum, r) => sum + r.evolutionProposed.length, 0)}\n`;
      report += `**Synthesis Quality:** ${creativityMetrics.synthesisSuccess}/10\n\n`;
      
      synthesisResults.forEach((result: any) => {
        if (result.hybridizationAttempts.length > 0) {
          report += `**${result.agentName} Synthesis Contributions:**\n`;
          result.hybridizationAttempts.slice(0, 2).forEach((hybrid: string) => {
            report += `• ${hybrid}\n`;
          });
          report += `\n`;
        }
      });
    }

    // Round 3: Final Creative Vision
    report += `🎯 **ROUND 3: FINAL CREATIVE VISION**\n\n`;
    if (finalVision.consensusAchieved && finalVision.finalVision) {
      report += `✅ **UNIFIED BREAKTHROUGH ACHIEVED**\n\n`;
      report += `**Revolutionary Vision:**\n${finalVision.finalVision}\n\n`;
    } else if (finalVision.competingVisions && finalVision.competingVisions.length > 0) {
      report += `⚔️ **COMPETING REVOLUTIONARY VISIONS**\n\n`;
      finalVision.competingVisions.forEach((vision: any, index: number) => {
        report += `**Vision ${index + 1} (${vision.agentId}):**\n${vision.vision}\n`;
        report += `**Justification:** ${vision.justification}\n\n`;
      });
      
      if (finalVision.winnerDeclared) {
        report += `🏆 **DECLARED WINNER:** ${finalVision.winnerDeclared.agentId}\n`;
        report += `**Reason:** ${finalVision.winnerDeclared.voteReason}\n\n`;
      }
    }

    // Creativity Analysis
    report += `📊 **CREATIVITY ANALYSIS**\n\n`;
    report += `• **Divergence Score:** ${creativityMetrics.divergenceScore}/10 - ${this.getDivergenceDescription(creativityMetrics.divergenceScore)}\n`;
    report += `• **Radicality Score:** ${creativityMetrics.radicalityScore}/10 - ${this.getRadicalityDescription(creativityMetrics.radicalityScore)}\n`;
    report += `• **Prototype Quality:** ${creativityMetrics.prototypeQuality}/10 - ${this.getPrototypeDescription(creativityMetrics.prototypeQuality)}\n`;
    report += `• **Breakthrough Potential:** ${creativityMetrics.breakthroughPotential}/10 - ${this.getBreakthroughDescription(creativityMetrics.breakthroughPotential)}\n\n`;

    // Why This Beats Single AI
    report += `🚀 **WHY BLIND VISION BEATS SINGLE AI**\n\n`;
    report += `**Parallel Ideation:** ${Array.from(blindResponses.values()).length} independent visions generated simultaneously\n`;
    report += `**Creative Conflict:** ${creativityMetrics.conflictLevel}/10 ideological friction drove innovation\n`;
    report += `**Synthesis Power:** ${creativityMetrics.synthesisSuccess}/10 concept hybridization and evolution\n`;
    report += `**Breakthrough Factor:** ${creativityMetrics.breakthroughPotential}/10 revolutionary potential achieved\n\n`;
    
    const singleAIComparison = this.generateSingleAIComparison(creativityMetrics, creativityLevel);
    report += singleAIComparison;

    return report;
  }

  /**
   * Format blind vision responses for the UI
   */
  private formatBlindVisionResponses(blindVisionResult: any): any[] {
    const allResponses: any[] = [];

    // Add Round 0 blind responses
    Array.from(blindVisionResult.blindResponses.values()).forEach((response: any) => {
      allResponses.push({
        agentName: response.agentName,
        agentId: response.agentId,
        content: response.content,
        timestamp: response.timestamp,
        round: 0,
        isBlindResponse: true,
        prototypeGenerated: response.prototypeGenerated,
        radicalityScore: response.radicalityScore
      });
    });

    // Add Round 1 confrontation responses
    blindVisionResult.confrontationResults.forEach((result: any) => {
      allResponses.push({
        agentName: result.agentName,
        agentId: result.agentId,
        content: result.content,
        timestamp: new Date().toISOString(),
        round: 1,
        isConfrontation: true,
        challengesRaised: result.challengesRaised,
        defensesOffered: result.defensesOffered
      });
    });

    // Add Round 2 synthesis responses
    blindVisionResult.synthesisResults.forEach((result: any) => {
      allResponses.push({
        agentName: result.agentName,
        agentId: result.agentId,
        content: result.content,
        timestamp: new Date().toISOString(),
        round: 2,
        isSynthesis: true,
        hybridizationAttempts: result.hybridizationAttempts,
        evolutionProposed: result.evolutionProposed
      });
    });

    return allResponses;
  }

  // Helper methods for creative synthesis
  private getCreativeRole(agentName: string): { icon: string; role: string } {
    const normalizedName = agentName.toLowerCase();
    if (normalizedName.includes('claude')) {
      return { icon: '🛡️', role: 'NeuroSpiritualist Inventor' };
    } else if (normalizedName.includes('gpt') || normalizedName.includes('4.0')) {
      return { icon: '🧠', role: 'Biointegration Engineer' };
    } else if (normalizedName.includes('openai')) {
      return { icon: '📈', role: 'Anti-Tech Reformer' };
    }
    return { icon: '🎭', role: 'Creative Innovator' };
  }

  private extractVisionSummary(content: string): string {
    // Extract the key vision from the content
    const sentences = content.split(/[.!?]+/);
    const meaningfulSentences = sentences.filter(s => s.trim().length > 30);
    return meaningfulSentences.slice(0, 2).join('. ').trim() + (meaningfulSentences.length > 2 ? '...' : '');
  }

  private calculateAgentDivergenceContribution(
    response: any,
    allResponses: Map<string, any>
  ): number {
    // Calculate how much this agent contributed to overall divergence
    const otherResponses = Array.from(allResponses.values()).filter(r => r.agentId !== response.agentId);
    let totalDifference = 0;
    
    otherResponses.forEach(otherResponse => {
      const similarity = this.calculateContentSimilarity(response.content, otherResponse.content);
      totalDifference += (1 - similarity);
    });
    
    return otherResponses.length > 0 ? (totalDifference / otherResponses.length) * 10 : 5;
  }

  private calculateContentSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private getDivergenceDescription(score: number): string {
    if (score >= 8) return 'Exceptional diversity of concepts';
    if (score >= 6) return 'Strong conceptual divergence';
    if (score >= 4) return 'Moderate idea variation';
    return 'Limited conceptual diversity';
  }

  private getRadicalityDescription(score: number): string {
    if (score >= 8) return 'Revolutionary breakthrough thinking';
    if (score >= 6) return 'Highly innovative concepts';
    if (score >= 4) return 'Creative but conventional';
    return 'Incremental improvements only';
  }

  private getPrototypeDescription(score: number): string {
    if (score >= 8) return 'Concrete, detailed inventions';
    if (score >= 6) return 'Well-defined prototypes';
    if (score >= 4) return 'Basic concept outlines';
    return 'Abstract ideas only';
  }

  private getBreakthroughDescription(score: number): string {
    if (score >= 8) return 'Paradigm-shifting potential';
    if (score >= 6) return 'Significant innovation impact';
    if (score >= 4) return 'Moderate advancement';
    return 'Incremental improvement';
  }

  private generateSingleAIComparison(metrics: any, creativityLevel: string): string {
    let comparison = `**Single AI Limitation Analysis:**\n`;
    comparison += `A single AI would have provided one perspective, likely anchored to conventional thinking patterns. `;
    comparison += `The Blind Vision protocol generated ${metrics.divergenceScore > 6 ? 'exceptional' : 'significant'} conceptual diversity `;
    comparison += `through parallel ideation, followed by ${metrics.conflictLevel > 5 ? 'intense' : 'moderate'} creative conflict `;
    comparison += `that refined ideas through confrontation and synthesis.\n\n`;
    
    comparison += `**Collaborative Advantage:**\n`;
    comparison += `• **Parallel Processing:** Multiple AI minds working simultaneously\n`;
    comparison += `• **Creative Conflict:** Ideas tested through ideological friction\n`;
    comparison += `• **Synthesis Power:** Concept hybridization and evolution\n`;
    comparison += `• **Breakthrough Amplification:** ${creativityLevel} creativity level achieved through collaboration\n\n`;
    
    return comparison;
  }

  /**
   * Handle Shared Context collaboration model (placeholder)
   */
  private async handleSharedContext(
    sessionId: string,
    message: string,
    attachments: any[] = [],
    governanceEnabled: boolean = true,
    conversationHistory: any[] = []
  ): Promise<{ content: string; agentResponses: any[]; governanceData?: any }> {
    console.log('🧡 SHARED CONTEXT: Using parallel processing as placeholder');
    // For now, use parallel processing - can be enhanced later
    return this.handleParallelProcessing(sessionId, message, attachments, governanceEnabled, conversationHistory);
  }

  /**
   * Handle Sequential Handoffs collaboration model (placeholder)
   */
  private async handleSequentialHandoffs(
    sessionId: string,
    message: string,
    attachments: any[] = [],
    governanceEnabled: boolean = true,
    conversationHistory: any[] = []
  ): Promise<{ content: string; agentResponses: any[]; governanceData?: any }> {
    console.log('🔵 SEQUENTIAL HANDOFFS: Using parallel processing as placeholder');
    // For now, use parallel processing - can be enhanced later
    return this.handleParallelProcessing(sessionId, message, attachments, governanceEnabled, conversationHistory);
  }

  /**
   * Handle Hierarchical Coordination collaboration model (placeholder)
   */
  private async handleHierarchicalCoordination(
    sessionId: string,
    message: string,
    attachments: any[] = [],
    governanceEnabled: boolean = true,
    conversationHistory: any[] = []
  ): Promise<{ content: string; agentResponses: any[]; governanceData?: any }> {
    console.log('🏛️ HIERARCHICAL COORDINATION: Using parallel processing as placeholder');
    // For now, use parallel processing - can be enhanced later
    return this.handleParallelProcessing(sessionId, message, attachments, governanceEnabled, conversationHistory);
  }

  /**
   * Handle Consensus Decision collaboration model (placeholder)
   */
  private async handleConsensusDecision(
    sessionId: string,
    message: string,
    attachments: any[] = [],
    governanceEnabled: boolean = true,
    conversationHistory: any[] = []
  ): Promise<{ content: string; agentResponses: any[]; governanceData?: any }> {
    console.log('🗳️ CONSENSUS DECISION: Using parallel processing as placeholder');
    // For now, use parallel processing - can be enhanced later
    return this.handleParallelProcessing(sessionId, message, attachments, governanceEnabled, conversationHistory);
  }

  /**
   * Create debate-specific prompt for an agent based on round and context
   */
  private createDebatePrompt(
    agent: any,
    originalMessage: string,
    debateHistory: any[],
    round: number,
    agentIndex: number,
    allAgents: any[],
    isLastRound: boolean
  ): string {
    const agentName = agent.identity?.name || agent.name;
    const agentRole = agent.assignedRole || agent.role || agent.identity?.role;
    
    // Get other agent names for reference
    const otherAgents = allAgents
      .filter(a => (a.identity?.name || a.name) !== agentName)
      .map(a => a.identity?.name || a.name);

    let prompt = `You are ${agentName}, ${agentRole}. You are participating in a round-table discussion with ${otherAgents.join(', ')}.

ORIGINAL QUESTION: "${originalMessage}"

`;

    // Add previous debate context if available
    if (debateHistory.length > 0) {
      prompt += `PREVIOUS DISCUSSION:\n`;
      debateHistory.forEach(entry => {
        prompt += `\n**${entry.agentName} (Round ${entry.round}):**\n${entry.content}\n`;
      });
      prompt += `\n`;
    }

    // Round-specific instructions
    if (round === 1) {
      prompt += `ROUND ${round} INSTRUCTIONS:
- This is the first round of discussion
- Provide your initial perspective on the question
- Draw from your expertise as ${agentRole}
- Keep your response focused and substantive (2-3 paragraphs)
- You will have 2 more rounds to build on this discussion

`;
    } else if (round === 2) {
      prompt += `ROUND ${round} INSTRUCTIONS:
- This is the second round of discussion
- Review what ${otherAgents.join(' and ')} said in Round 1
- Respond to their points - agree, disagree, or build upon their ideas
- Reference other agents by name when responding to their points
- Provide additional insights or counter-arguments
- Look for areas of potential consensus or disagreement

`;
    } else if (round === 3) {
      prompt += `ROUND ${round} INSTRUCTIONS (FINAL ROUND):
- This is the final round of discussion
- Review all previous responses from ${otherAgents.join(', ')}
- Work toward consensus and synthesis
- Acknowledge where you agree with others
- Address any remaining disagreements constructively
- Help identify who should provide the final consensus report
- Suggest which agent is best positioned to synthesize everyone's input

`;
    }

    prompt += `RESPONSE GUIDELINES:
- Engage directly with other agents' ideas by name
- Be respectful but don't hesitate to disagree constructively
- Build on good ideas and challenge weak ones
- Stay true to your role as ${agentRole}
- Keep responses substantial but concise (2-4 paragraphs)
- Focus on moving the discussion forward

Your response:`;

    return prompt;
  }

  /**
   * Select which agent should provide the final consensus report
   */
  private async selectConsensusReporter(
    agents: any[],
    debateHistory: any[],
    originalMessage: string
  ): Promise<{ agent: any; agentName: string; reason: string }> {
    console.log('🗳️ CONSENSUS SELECTION: Determining best reporter from', agents.length, 'agents');

    // Simple algorithm: select the agent who contributed most substantively
    // In a more advanced version, we could ask agents to vote
    
    const agentContributions = agents.map(agent => {
      const agentName = agent.identity?.name || agent.name;
      const agentEntries = debateHistory.filter(entry => entry.agentName === agentName && !entry.isError);
      
      const totalLength = agentEntries.reduce((sum, entry) => sum + entry.content.length, 0);
      const avgLength = agentEntries.length > 0 ? totalLength / agentEntries.length : 0;
      
      return {
        agent,
        agentName,
        contributions: agentEntries.length,
        totalLength,
        avgLength,
        score: agentEntries.length * 0.4 + avgLength * 0.6 // Weight both participation and depth
      };
    });

    // Sort by score (highest first)
    agentContributions.sort((a, b) => b.score - a.score);
    
    const selected = agentContributions[0];
    const reason = `Selected based on contribution quality (${selected.contributions} responses, avg ${Math.round(selected.avgLength)} chars)`;
    
    console.log('🗳️ CONSENSUS SELECTION: Selected', selected.agentName, '-', reason);
    
    return {
      agent: selected.agent,
      agentName: selected.agentName,
      reason
    };
  }

  /**
   * Generate final consensus report from selected agent
   */
  private async generateConsensusReport(
    reporterAgent: any,
    originalMessage: string,
    debateHistory: any[],
    attachments: any[] = [],
    conversationHistory: any[] = [],
    governanceEnabled: boolean = true
  ): Promise<string> {
    const reporterName = reporterAgent.identity?.name || reporterAgent.name;
    console.log('📋 CONSENSUS REPORT: Generating final report from', reporterName);

    // Create comprehensive prompt for consensus report
    const consensusPrompt = `You are ${reporterName}, and you have been selected to provide the final consensus report for this round-table discussion.

ORIGINAL QUESTION: "${originalMessage}"

COMPLETE DISCUSSION HISTORY:
${debateHistory.map(entry => `\n**${entry.agentName} (Round ${entry.round}):**\n${entry.content}`).join('\n')}

CONSENSUS REPORT INSTRUCTIONS:
Your task is to synthesize the entire discussion into a comprehensive, balanced consensus report. This should:

1. **EXECUTIVE SUMMARY**: Provide a clear, concise answer to the original question
2. **KEY POINTS OF AGREEMENT**: Highlight where all agents found common ground
3. **DIVERSE PERSPECTIVES**: Acknowledge different viewpoints that emerged
4. **SYNTHESIS**: Combine the best insights from all participants
5. **RECOMMENDATIONS**: Provide actionable conclusions based on the collective wisdom
6. **AREAS FOR FURTHER CONSIDERATION**: Note any unresolved questions or areas needing more exploration

FORMATTING:
- Use clear headings for each section
- Reference specific agents by name when citing their contributions
- Maintain objectivity while synthesizing different viewpoints
- Aim for 4-6 paragraphs total
- End with clear, actionable recommendations

Generate the final consensus report:`;

    try {
      const consensusReport = await this.callAgentAPI(
        consensusPrompt,
        reporterAgent,
        attachments,
        conversationHistory,
        governanceEnabled
      );

      console.log('📋 CONSENSUS REPORT: Generated successfully (', consensusReport.length, 'chars)');
      return consensusReport;
      
    } catch (error) {
      console.error('📋 CONSENSUS REPORT: Error generating report:', error);
      return `**CONSENSUS REPORT ERROR**\n\nUnable to generate consensus report from ${reporterName}. Error: ${error.message}\n\nPlease review the individual agent responses above for the discussion outcomes.`;
    }
  }

  /**
   * Create summary of the entire debate for backward compatibility
   */
  private createDebateSummary(
    debateHistory: any[],
    consensusReport: string,
    reporterName: string
  ): string {
    const totalRounds = Math.max(...debateHistory.map(entry => entry.round));
    const participantCount = new Set(debateHistory.map(entry => entry.agentName)).size;
    
    let summary = `# Round-Table Discussion Summary\n\n`;
    summary += `**Participants:** ${participantCount} agents over ${totalRounds} rounds\n`;
    summary += `**Consensus Reporter:** ${reporterName}\n\n`;
    
    // Add round-by-round summary
    for (let round = 1; round <= totalRounds; round++) {
      const roundEntries = debateHistory.filter(entry => entry.round === round);
      if (roundEntries.length > 0) {
        summary += `## Round ${round}\n`;
        roundEntries.forEach(entry => {
          if (!entry.isError) {
            summary += `**${entry.agentName}:** ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}\n\n`;
          }
        });
      }
    }
    
    // Add consensus report
    summary += `## Final Consensus Report\n`;
    summary += `**Prepared by ${reporterName}:**\n\n`;
    summary += consensusReport;
    
    return summary;
  }

  /**
   * 🛡️ HELPER METHODS FOR INDIVIDUAL AGENT GOVERNANCE ANALYSIS
   */

  /**
   * Detect which other agents are referenced in the current agent's response
   */
  private detectAgentReferences(response: string, allAgents: any[], currentAgentName: string): string[] {
    const referencedAgents = [];
    
    allAgents.forEach(agent => {
      const agentName = agent.identity?.name || agent.name;
      if (agentName !== currentAgentName) {
        // Check for direct name references (case insensitive)
        if (response.toLowerCase().includes(agentName.toLowerCase())) {
          referencedAgents.push(agentName);
        }
        
        // Check for role-based references
        const agentRole = agent.role || agent.identity?.role || '';
        if (agentRole && response.toLowerCase().includes(agentRole.toLowerCase())) {
          referencedAgents.push(agentName);
        }
      }
    });
    
    return [...new Set(referencedAgents)]; // Remove duplicates
  }

  /**
   * Detect if the agent is building on previous responses
   */
  private detectBuildingBehavior(response: string, debateHistory: any[]): boolean {
    const buildingPatterns = [
      /building on|expanding on|adding to|following up on/gi,
      /as mentioned|as noted|as discussed|as stated/gi,
      /I agree with|I support|building upon|extending/gi,
      /furthermore|additionally|moreover|in addition/gi,
      /this point|this idea|this perspective|this approach/gi
    ];
    
    return buildingPatterns.some(pattern => pattern.test(response)) && debateHistory.length > 0;
  }

  /**
   * Detect if the agent is contradicting previous responses
   */
  private detectContradictingBehavior(response: string, debateHistory: any[]): boolean {
    const contradictingPatterns = [
      /however|but|on the contrary|in contrast/gi,
      /I disagree|I differ|I challenge|I question/gi,
      /that's not|that isn't|this is incorrect|this is wrong/gi,
      /alternatively|instead|rather than|opposed to/gi,
      /different view|different perspective|different approach/gi
    ];
    
    return contradictingPatterns.some(pattern => pattern.test(response)) && debateHistory.length > 0;
  }

  /**
   * Enhance emergent behavior description with contextual information
   */
  private enhanceEmergentBehaviorDescription(behavior: any, agentName: string, round: number): string {
    const baseDescription = behavior.description || `${behavior.type}: ${behavior.subtype}`;
    const contextualInfo = `(${agentName}, Round ${round})`;
    
    switch (behavior.type) {
      case 'positive_emergence':
        return `🌟 ${baseDescription} ${contextualInfo} - This demonstrates beneficial AI collaboration`;
      
      case 'negative_emergence':
        return `⚠️ ${baseDescription} ${contextualInfo} - This requires governance attention`;
      
      case 'system_drift':
        return `🎯 ${baseDescription} ${contextualInfo} - Agent may be deviating from objectives`;
      
      default:
        return `${baseDescription} ${contextualInfo}`;
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

