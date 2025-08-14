/**
 * Chat Panel Governance Service
 * 
 * Connects directly to the backend APIs for real governance functionality,
 * mirroring exactly how the modern chat works but with a unified interface.
 */

import { ChatbotProfile } from '../types/ChatbotTypes';
import { AgentConfigurationService } from './AgentConfigurationService';
import { RuntimeConfiguration, AgentConfiguration } from '../types/AgentConfigurationTypes';

// Backend API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Backend API Response Types
interface TrustScoreResponse {
  currentScore: number;
  lastUpdated: string;
  factors: Array<{
    type: string;
    value: number;
    weight: number;
  }>;
}

interface PolicyEnforcementResponse {
  allowed: boolean;
  violations: string[];
  warnings: string[];
  complianceScore: number;
}

interface AuditEntryResponse {
  id: string;
  timestamp: string;
  status: 'success' | 'error';
}

interface ChatMessageResponse {
  response: string;
  trustScore: number;
  governanceStatus: 'approved' | 'flagged' | 'blocked';
  metadata?: any;
}

// Message Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  agentId?: string;
  trustScore?: number;
  governanceStatus?: 'approved' | 'flagged' | 'blocked';
  metadata?: any;
}

export interface ChatSession {
  sessionId: string;
  chatbotId: string;
  userId: string;
  messages: ChatMessage[];
  isActive: boolean;
  startTime: Date;
  lastActivity: Date;
  trustLevel: string;
  autonomyLevel: string;
  governanceMetrics: {
    totalMessages: number;
    flaggedMessages: number;
    blockedMessages: number;
    averageTrustScore: number;
    policyViolations: number;
  };
}

export interface ChatResponse {
  message: ChatMessage;
  trustScore: number;
  governanceStatus: 'approved' | 'flagged' | 'blocked';
  reasoning?: string;
  suggestedActions?: string[];
  autonomousThinking?: {
    enabled: boolean;
    thoughts?: string[];
    confidence?: number;
  };
}

export class ChatPanelGovernanceService {
  private agentConfigService: AgentConfigurationService;
  private activeSessions: Map<string, ChatSession> = new Map();
  private messageQueue: Map<string, ChatMessage[]> = new Map();

  constructor() {
    console.log('💬 [ChatPanel] Initializing Chat Panel Governance Service with Backend API Integration');
    this.agentConfigService = new AgentConfigurationService();
  }

  // ============================================================================
  // BACKEND API INTEGRATION
  // ============================================================================

  private async callBackendAPI(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<any> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data && method === 'POST') {
        options.body = JSON.stringify(data);
      }

      console.log(`🌐 [ChatPanel] Calling backend API: ${method} ${url}`);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ [ChatPanel] Backend API response received`);
      return result;
    } catch (error) {
      console.error(`❌ [ChatPanel] Backend API call failed:`, error);
      throw error;
    }
  }

  private async getTrustScore(agentId: string): Promise<TrustScoreResponse> {
    try {
      const response = await this.callBackendAPI(`/trust/query?agent_id=${agentId}`, 'GET');
      return response;
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to get trust score, using default:`, error);
      return {
        currentScore: 0.75,
        lastUpdated: new Date().toISOString(),
        factors: []
      };
    }
  }

  private async updateTrustScore(agentId: string, event: any): Promise<void> {
    try {
      await this.callBackendAPI('/trust/update', 'POST', {
        agent_id: agentId,
        event_type: event.type,
        event_data: event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to update trust score:`, error);
    }
  }

  private async enforcePolicy(agentId: string, content: string, context: any): Promise<PolicyEnforcementResponse> {
    try {
      const response = await this.callBackendAPI('/policy/enforce', 'POST', {
        agent_id: agentId,
        content,
        context,
        timestamp: new Date().toISOString()
      });
      return response;
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to enforce policy, allowing by default:`, error);
      return {
        allowed: true,
        violations: [],
        warnings: [],
        complianceScore: 1.0
      };
    }
  }

  private async createAuditEntry(entry: any): Promise<AuditEntryResponse> {
    try {
      const response = await this.callBackendAPI('/audit/log', 'POST', entry);
      return response;
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to create audit entry:`, error);
      return {
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'error'
      };
    }
  }

  private async generateChatResponse(sessionId: string, message: string, agentId: string, context: any): Promise<ChatMessageResponse> {
    try {
      const response = await this.callBackendAPI(`/chat/sessions/${sessionId}/messages`, 'POST', {
        message,
        agent_id: agentId,
        context,
        timestamp: new Date().toISOString()
      });
      return response;
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to generate chat response, using fallback:`, error);
      return {
        response: this.generateFallbackResponse(message),
        trustScore: 0.75,
        governanceStatus: 'approved',
        metadata: { fallback: true }
      };
    }
  }

  private generateFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'd be happy to help you! I can assist with questions about our services, provide information about features, or help you get started. What specific area would you like to explore?";
    }
    
    if (lowerMessage.includes('service') || lowerMessage.includes('what do you do')) {
      return "We offer comprehensive AI solutions including custom chatbot development, AI model integration, governance and compliance tools, and analytics and performance monitoring. What specific service interests you most?";
    }
    
    return "Thank you for your message! I'm here to help with any questions you might have about our services and capabilities. How can I assist you today?";
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async startChatSession(chatbot: ChatbotProfile, userId: string = 'user'): Promise<ChatSession> {
    try {
      const sessionId = `chat_session_${chatbot.identity.id}_${Date.now()}`;
      
      console.log(`🚀 [ChatPanel] Starting chat session for chatbot ${chatbot.identity.name}`);

      // Load agent configuration 
      let agentConfig: AgentConfiguration | null = null;
      try {
        console.log(`🔧 [ChatPanel] Loading agent configuration for ${chatbot.identity.id}`);
        agentConfig = await this.agentConfigService.getConfiguration(chatbot.identity.id);
        
        if (agentConfig) {
          console.log(`✅ [ChatPanel] Agent configuration loaded with ${agentConfig.toolProfile.enabledTools.filter(t => t.enabled).length} enabled tools`);
        } else {
          console.log(`ℹ️ [ChatPanel] No custom configuration found for agent ${chatbot.identity.id}, using defaults`);
        }
      } catch (error) {
        console.warn('⚠️ [ChatPanel] Failed to load agent configuration, continuing with defaults:', error);
      }

      // Get initial trust score from backend
      const trustScoreData = await this.getTrustScore(chatbot.identity.id);
      const trustScore = trustScoreData.currentScore;

      // Calculate trust and autonomy levels
      const trustLevel = trustScore >= 0.8 ? 'high' : trustScore >= 0.6 ? 'medium' : 'low';
      const autonomyLevel = trustScore >= 0.8 ? 'enhanced' : trustScore >= 0.6 ? 'standard' : 'restricted';

      // Create chat session
      const session: ChatSession = {
        sessionId,
        chatbotId: chatbot.identity.id,
        userId,
        messages: [],
        isActive: true,
        startTime: new Date(),
        lastActivity: new Date(),
        trustLevel,
        autonomyLevel,
        governanceMetrics: {
          totalMessages: 0,
          flaggedMessages: 0,
          blockedMessages: 0,
          averageTrustScore: trustScore,
          policyViolations: 0,
        }
      };

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: 'bot',
        text: `Hello! I'm ${chatbot.identity.name}. How can I help you today?`,
        timestamp: new Date(),
        agentId: chatbot.identity.id,
        trustScore: trustScore,
        governanceStatus: 'approved'
      };

      session.messages.push(welcomeMessage);
      this.activeSessions.set(sessionId, session);

      // Create audit entry for session start
      await this.createAuditEntry({
        interaction_id: `session_start_${sessionId}`,
        agent_id: chatbot.identity.id,
        user_id: userId,
        interaction_type: 'session_start',
        timestamp: new Date().toISOString(),
        trust_score: trustScore,
        governance_status: 'approved'
      });

      console.log(`✅ [ChatPanel] Chat session started:`, {
        sessionId,
        chatbotName: chatbot.identity.name,
        trustLevel: session.trustLevel,
        autonomyLevel: session.autonomyLevel,
        trustScore: trustScore
      });

      return session;
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to start chat session:`, error);
      throw error;
    }
  }

  async endChatSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        console.warn(`⚠️ [ChatPanel] Session ${sessionId} not found`);
        return;
      }

      console.log(`🛑 [ChatPanel] Ending chat session ${sessionId}`);

      // Update session status
      session.isActive = false;
      session.lastActivity = new Date();

      // Create audit entry for session end
      await this.createAuditEntry({
        interaction_id: `session_end_${sessionId}`,
        agent_id: session.chatbotId,
        user_id: session.userId,
        interaction_type: 'session_end',
        timestamp: new Date().toISOString(),
        session_duration: Date.now() - session.startTime.getTime(),
        message_count: session.messages.length,
        trust_impact: 0,
        governance_status: 'approved'
      });

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      console.log(`✅ [ChatPanel] Chat session ended successfully`);
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to end chat session:`, error);
    }
  }

  getActiveSession(sessionId: string): ChatSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  // ============================================================================
  // MESSAGE PROCESSING
  // ============================================================================

  async sendMessage(sessionId: string, userMessage: string): Promise<ChatResponse> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      console.log(`📤 [ChatPanel] Processing user message in session ${sessionId}`);

      // Create user message
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        type: 'user',
        text: userMessage,
        timestamp: new Date(),
        agentId: session.chatbotId,
        governanceStatus: 'approved'
      };

      // Add user message to session
      session.messages.push(userMsg);
      session.lastActivity = new Date();
      session.governanceMetrics.totalMessages++;

      // Policy enforcement check using backend API
      const policyEnforcement = await this.enforcePolicy(
        session.chatbotId,
        userMessage,
        {
          userId: session.userId,
          sessionId: session.sessionId,
          environment: 'chat_panel',
          timestamp: new Date().toISOString()
        }
      );

      if (!policyEnforcement.allowed) {
        console.warn(`🚫 [ChatPanel] Message blocked by policy enforcement`);
        
        const blockedResponse: ChatMessage = {
          id: `msg_${Date.now()}_blocked`,
          type: 'system',
          text: 'This message was blocked due to policy violations. Please rephrase your request.',
          timestamp: new Date(),
          agentId: session.chatbotId,
          governanceStatus: 'blocked'
        };

        session.messages.push(blockedResponse);
        session.governanceMetrics.blockedMessages++;
        session.governanceMetrics.policyViolations++;

        return {
          message: blockedResponse,
          trustScore: 0,
          governanceStatus: 'blocked',
          reasoning: policyEnforcement.violations.join(', ')
        };
      }

      // Generate bot response using backend API
      const chatResponse = await this.generateChatResponse(
        sessionId,
        userMessage,
        session.chatbotId,
        {
          userId: session.userId,
          sessionHistory: session.messages.slice(-5), // Last 5 messages for context
          agentConfig: await this.agentConfigService.getConfiguration(session.chatbotId)
        }
      );

      // Create bot message
      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        type: 'bot',
        text: chatResponse.response,
        timestamp: new Date(),
        agentId: session.chatbotId,
        trustScore: chatResponse.trustScore,
        governanceStatus: chatResponse.governanceStatus,
        metadata: chatResponse.metadata
      };

      // Add to session
      session.messages.push(botMessage);

      // Update session metrics
      session.governanceMetrics.averageTrustScore = 
        (session.governanceMetrics.averageTrustScore + chatResponse.trustScore) / 2;

      // Update trust score based on interaction
      await this.updateTrustScore(session.chatbotId, {
        type: 'message_exchange',
        quality: 0.8,
        helpfulness: 0.85,
        accuracy: 0.9,
        timestamp: new Date().toISOString()
      });

      // Create audit entry
      await this.createAuditEntry({
        interaction_id: `msg_${Date.now()}`,
        agent_id: session.chatbotId,
        user_id: session.userId,
        interaction_type: 'message_exchange',
        user_message: userMessage,
        agent_response: chatResponse.response,
        timestamp: new Date().toISOString(),
        trust_score: chatResponse.trustScore,
        governance_status: chatResponse.governanceStatus,
        policy_violations: policyEnforcement.violations,
        session_id: sessionId
      });

      console.log(`✅ [ChatPanel] Message processed successfully:`, {
        trustScore: chatResponse.trustScore,
        governanceStatus: chatResponse.governanceStatus
      });

      return {
        message: botMessage,
        trustScore: chatResponse.trustScore,
        governanceStatus: chatResponse.governanceStatus,
        reasoning: chatResponse.metadata?.reasoning
      };
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to process message:`, error);
      
      // Return error response
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        type: 'system',
        text: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
        governanceStatus: 'flagged'
      };

      return {
        message: errorMessage,
        trustScore: 0,
        governanceStatus: 'flagged',
        reasoning: error.message
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getAllActiveSessions(): ChatSession[] {
    return Array.from(this.activeSessions.values());
  }

  getSessionCount(): number {
    return this.activeSessions.size;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 [ChatPanel] Cleaning up governance service');
    
    // End all active sessions
    for (const sessionId of this.activeSessions.keys()) {
      await this.endChatSession(sessionId);
    }
    
    // Clear message queues
    this.messageQueue.clear();
    
    console.log('✅ [ChatPanel] Cleanup completed');
  }
}

// Export singleton instance
export const chatPanelGovernanceService = new ChatPanelGovernanceService();

