/**
 * MultiAgentAuditLogger - Enhanced audit logging for multi-agent collaboration
 * Part of the revolutionary multi-agent collaboration system
 */

import { UnifiedStorageService } from './UnifiedStorageService';
import { AgentResponse } from './MultiAgentRoutingService';
import { ParsedMessage } from '../utils/MessageParser';

export interface MultiAgentSession {
  sessionId: string;
  hostAgentId: string;
  hostAgentName: string;
  participantAgents: ParticipantAgent[];
  userId: string;
  conversationContext: 'multi-agent' | 'single-agent';
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  totalCost: number;
}

export interface ParticipantAgent {
  agentId: string;
  agentName: string;
  role: 'host' | 'guest';
  addedAt: Date;
  addedBy: string; // userId who added this agent
  responseCount: number;
  totalCost: number;
  lastActivity?: Date;
}

export interface MultiAgentInteraction {
  interactionId: string;
  sessionId: string;
  hostAgentId: string;
  participantAgents: ParticipantAgent[];
  userId: string;
  message: string;
  parsedMessage: ParsedMessage;
  taggedAgents: string[];
  responses: AgentResponseLog[];
  conversationContext: 'multi-agent';
  timestamp: Date;
  processingTime: number;
  totalCost: number;
  metadata?: {
    messageType?: 'user' | 'system';
    priority?: 'low' | 'normal' | 'high';
    tags?: string[];
  };
}

export interface AgentResponseLog {
  agentId: string;
  agentName: string;
  role: 'host' | 'guest';
  response: string;
  timestamp: Date;
  processingTime: number;
  cost: number;
  error?: string;
  metadata?: {
    model?: string;
    tokens?: {
      input: number;
      output: number;
    };
    confidence?: number;
  };
}

export interface ReceiptEntry {
  receiptId: string;
  sessionId: string;
  interactionId: string;
  agentId: string;
  agentName: string;
  role: 'host' | 'guest';
  userId: string;
  cost: number;
  billedTo: 'host' | 'guest'; // Host pays for all in multi-agent sessions
  timestamp: Date;
  description: string;
  metadata?: {
    model?: string;
    tokens?: {
      input: number;
      output: number;
    };
    processingTime?: number;
  };
}

export interface AuditSearchFilters {
  userId?: string;
  sessionId?: string;
  agentId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  conversationContext?: 'multi-agent' | 'single-agent';
  minCost?: number;
  maxCost?: number;
}

export class MultiAgentAuditLogger {
  private static instance: MultiAgentAuditLogger;
  private storageService: UnifiedStorageService;

  private constructor() {
    this.storageService = UnifiedStorageService.getInstance();
    // Ensure storage service is ready before use
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Wait for storage service to be ready
      let retries = 0;
      const maxRetries = 10;
      
      while (!this.storageService.isReady() && retries < maxRetries) {
        console.log(`🔄 [MultiAgentAudit] Waiting for storage service... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!this.storageService.isReady()) {
        console.error('❌ [MultiAgentAudit] Storage service failed to initialize after retries');
        return;
      }
      
      console.log('✅ [MultiAgentAudit] Storage service ready');
    } catch (error) {
      console.error('❌ [MultiAgentAudit] Error initializing storage:', error);
    }
  }

  public static getInstance(): MultiAgentAuditLogger {
    if (!MultiAgentAuditLogger.instance) {
      MultiAgentAuditLogger.instance = new MultiAgentAuditLogger();
    }
    return MultiAgentAuditLogger.instance;
  }

  /**
   * Ensure storage is ready before operations
   */
  private async ensureStorageReady(): Promise<void> {
    if (!this.storageService.isReady()) {
      console.log('⏳ [MultiAgentAudit] Storage not ready, waiting...');
      await this.initializeStorage();
    }
  }

  /**
   * Create a new multi-agent session
   */
  public async createMultiAgentSession(
    hostAgentId: string,
    hostAgentName: string,
    userId: string,
    guestAgents: Array<{agentId: string, name: string, addedBy: string}> = []
  ): Promise<MultiAgentSession> {
    await this.ensureStorageReady();
    
    const sessionId = `multi_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const participantAgents: ParticipantAgent[] = [
      {
        agentId: hostAgentId,
        agentName: hostAgentName,
        role: 'host',
        addedAt: new Date(),
        addedBy: userId,
        responseCount: 0,
        totalCost: 0
      },
      ...guestAgents.map(guest => ({
        agentId: guest.agentId,
        agentName: guest.name,
        role: 'guest' as const,
        addedAt: new Date(),
        addedBy: guest.addedBy,
        responseCount: 0,
        totalCost: 0
      }))
    ];

    const session: MultiAgentSession = {
      sessionId,
      hostAgentId,
      hostAgentName,
      participantAgents,
      userId,
      conversationContext: 'multi-agent',
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      totalCost: 0
    };

    try {
      await this.storageService.set('multi_agent_sessions', sessionId, session);
      console.log('📝 [MultiAgentAudit] Created session:', sessionId);
      return session;
    } catch (error) {
      console.error('❌ [MultiAgentAudit] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Log a multi-agent interaction
   */
  public async logMultiAgentInteraction(
    sessionId: string,
    userId: string,
    message: string,
    parsedMessage: ParsedMessage,
    responses: AgentResponse[],
    participantAgents: ParticipantAgent[]
  ): Promise<MultiAgentInteraction> {
    await this.ensureStorageReady();
    
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    
    // Calculate total processing time and cost
    const totalProcessingTime = responses.reduce((sum, r) => sum + r.processingTime, 0);
    const totalCost = this.calculateInteractionCost(responses);

    // Convert responses to log format
    const responseLog: AgentResponseLog[] = responses.map(response => {
      const agent = participantAgents.find(p => p.agentId === response.agentId);
      return {
        agentId: response.agentId,
        agentName: response.agentName,
        role: agent?.role || 'guest',
        response: response.response,
        timestamp: response.timestamp,
        processingTime: response.processingTime,
        cost: this.calculateResponseCost(response),
        error: response.error,
        metadata: {
          model: 'gpt-3.5-turbo', // Default model, should be dynamic
          tokens: {
            input: Math.floor(message.length / 4), // Rough estimate
            output: Math.floor(response.response.length / 4)
          }
        }
      };
    });

    const interaction: MultiAgentInteraction = {
      interactionId,
      sessionId,
      hostAgentId: participantAgents.find(p => p.role === 'host')?.agentId || '',
      participantAgents,
      userId,
      message,
      parsedMessage,
      taggedAgents: parsedMessage.mentions.map(m => m.agentId),
      responses: responseLog,
      conversationContext: 'multi-agent',
      timestamp,
      processingTime: totalProcessingTime,
      totalCost,
      metadata: {
        messageType: 'user',
        priority: 'normal',
        tags: ['multi-agent', 'collaboration']
      }
    };

    try {
      // Store the interaction
      await this.storageService.set('multi_agent_interactions', interactionId, interaction);

      // Update session statistics
      await this.updateSessionStatistics(sessionId, totalCost, responseLog.length);

      // Generate receipts for each agent response
      await this.generateReceipts(interaction);

      console.log('📝 [MultiAgentAudit] Logged interaction:', interactionId);
      return interaction;
    } catch (error) {
      console.error('❌ [MultiAgentAudit] Error logging interaction:', error);
      throw error;
    }
  }

  /**
   * Add a guest agent to an existing session
   */
  public async addGuestAgentToSession(
    sessionId: string,
    guestAgentId: string,
    guestAgentName: string,
    addedBy: string
  ): Promise<void> {
    const session = await this.storageService.get<MultiAgentSession>('multi_agent_sessions', sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Check if agent is already in session
    const existingAgent = session.participantAgents.find(p => p.agentId === guestAgentId);
    if (existingAgent) {
      console.log('⚠️ [MultiAgentAudit] Agent already in session:', guestAgentId);
      return;
    }

    // Add guest agent
    const guestAgent: ParticipantAgent = {
      agentId: guestAgentId,
      agentName: guestAgentName,
      role: 'guest',
      addedAt: new Date(),
      addedBy,
      responseCount: 0,
      totalCost: 0
    };

    session.participantAgents.push(guestAgent);
    session.lastActivity = new Date();

    await this.storageService.set('multi_agent_sessions', sessionId, session);
    
    console.log('📝 [MultiAgentAudit] Added guest agent to session:', guestAgentId, 'to', sessionId);
  }

  /**
   * Remove a guest agent from a session
   */
  public async removeGuestAgentFromSession(
    sessionId: string,
    guestAgentId: string
  ): Promise<void> {
    const session = await this.storageService.get<MultiAgentSession>('multi_agent_sessions', sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Cannot remove host agent
    const agent = session.participantAgents.find(p => p.agentId === guestAgentId);
    if (agent?.role === 'host') {
      throw new Error('Cannot remove host agent from session');
    }

    // Remove guest agent
    session.participantAgents = session.participantAgents.filter(p => p.agentId !== guestAgentId);
    session.lastActivity = new Date();

    await this.storageService.set('multi_agent_sessions', sessionId, session);
    
    console.log('📝 [MultiAgentAudit] Removed guest agent from session:', guestAgentId, 'from', sessionId);
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<MultiAgentSession | null> {
    return await this.storageService.get<MultiAgentSession>('multi_agent_sessions', sessionId);
  }

  /**
   * Get user's sessions
   */
  public async getUserSessions(userId: string): Promise<MultiAgentSession[]> {
    // This would need to be implemented with proper indexing in a real system
    // For now, return empty array as placeholder
    console.log('📝 [MultiAgentAudit] Getting sessions for user:', userId);
    return [];
  }

  /**
   * Get session interactions
   */
  public async getSessionInteractions(sessionId: string): Promise<MultiAgentInteraction[]> {
    // This would need to be implemented with proper indexing in a real system
    // For now, return empty array as placeholder
    console.log('📝 [MultiAgentAudit] Getting interactions for session:', sessionId);
    return [];
  }

  /**
   * Get receipts for a session (host agent command center)
   */
  public async getSessionReceipts(sessionId: string): Promise<ReceiptEntry[]> {
    const receipts = await this.storageService.get<ReceiptEntry[]>('session_receipts', sessionId);
    return receipts || [];
  }

  /**
   * Get receipts for an agent (guest agent command center)
   */
  public async getAgentReceipts(agentId: string, userId: string): Promise<ReceiptEntry[]> {
    // This would need to be implemented with proper indexing in a real system
    // For now, return empty array as placeholder
    console.log('📝 [MultiAgentAudit] Getting receipts for agent:', agentId);
    return [];
  }

  /**
   * Search audit logs
   */
  public async searchAuditLogs(filters: AuditSearchFilters): Promise<MultiAgentInteraction[]> {
    // This would need to be implemented with proper indexing and search in a real system
    // For now, return empty array as placeholder
    console.log('📝 [MultiAgentAudit] Searching audit logs with filters:', filters);
    return [];
  }

  /**
   * Calculate cost for an interaction
   */
  private calculateInteractionCost(responses: AgentResponse[]): number {
    return responses.reduce((total, response) => total + this.calculateResponseCost(response), 0);
  }

  /**
   * Calculate cost for a single response
   */
  private calculateResponseCost(response: AgentResponse): number {
    // Simple cost calculation based on processing time and response length
    // In a real system, this would be based on actual API costs
    const baseCost = 0.01; // Base cost per response
    const timeCost = (response.processingTime / 1000) * 0.001; // Cost per second
    const lengthCost = (response.response.length / 1000) * 0.005; // Cost per 1000 characters
    
    return baseCost + timeCost + lengthCost;
  }

  /**
   * Update session statistics
   */
  private async updateSessionStatistics(
    sessionId: string,
    additionalCost: number,
    responseCount: number
  ): Promise<void> {
    const session = await this.storageService.get<MultiAgentSession>('multi_agent_sessions', sessionId);
    if (!session) return;

    session.messageCount += 1;
    session.totalCost += additionalCost;
    session.lastActivity = new Date();

    // Update participant statistics
    session.participantAgents.forEach(agent => {
      agent.responseCount += responseCount;
      agent.totalCost += additionalCost / session.participantAgents.length; // Distribute cost
      agent.lastActivity = new Date();
    });

    await this.storageService.set('multi_agent_sessions', sessionId, session);
  }

  /**
   * Generate receipts for an interaction
   */
  private async generateReceipts(interaction: MultiAgentInteraction): Promise<void> {
    const receipts: ReceiptEntry[] = [];

    interaction.responses.forEach(response => {
      const receipt: ReceiptEntry = {
        receiptId: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: interaction.sessionId,
        interactionId: interaction.interactionId,
        agentId: response.agentId,
        agentName: response.agentName,
        role: response.role,
        userId: interaction.userId,
        cost: response.cost,
        billedTo: 'host', // Host pays for all in multi-agent sessions
        timestamp: response.timestamp,
        description: `Multi-agent response in session ${interaction.sessionId}`,
        metadata: response.metadata
      };

      receipts.push(receipt);
    });

    // Store receipts by session for easy retrieval
    const existingReceipts = await this.getSessionReceipts(interaction.sessionId);
    const allReceipts = [...existingReceipts, ...receipts];
    
    await this.storageService.set('session_receipts', interaction.sessionId, allReceipts);

    console.log('📝 [MultiAgentAudit] Generated receipts for interaction:', interaction.interactionId);
  }

  /**
   * Export audit data for compliance
   */
  public async exportAuditData(
    userId: string,
    filters?: AuditSearchFilters
  ): Promise<{
    sessions: MultiAgentSession[];
    interactions: MultiAgentInteraction[];
    receipts: ReceiptEntry[];
  }> {
    // This would be implemented with proper data export functionality
    console.log('📝 [MultiAgentAudit] Exporting audit data for user:', userId);
    
    return {
      sessions: [],
      interactions: [],
      receipts: []
    };
  }
}

export default MultiAgentAuditLogger;

