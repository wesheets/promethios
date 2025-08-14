/**
 * Chat Panel Governance Service
 * 
 * Provides governance functionality for the chat panel using the Universal Governance Adapter.
 * This service acts as a bridge between the chat interface and the universal governance system,
 * ensuring consistent governance behavior across all chat implementations.
 */

import { ChatbotProfile } from '../types/ChatbotTypes';
import { AgentConfigurationService } from './AgentConfigurationService';
import { RuntimeConfiguration, AgentConfiguration } from '../types/AgentConfigurationTypes';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';

// Chat Panel Response Types
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  trustScore?: number;
  governanceStatus?: string;
}

interface ChatSession {
  sessionId: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  trustScore: number;
  governanceMetrics: {
    violations: number;
    warnings: number;
    complianceScore: number;
  };
}

interface GovernanceMetrics {
  trustScore: number;
  messageCount: number;
  violations: number;
  autonomyLevel: string;
}

export class ChatPanelGovernanceService {
  private universalGovernance: UniversalGovernanceAdapter;
  private agentConfigService: AgentConfigurationService;
  private activeSessions: Map<string, ChatSession> = new Map();
  private sessionMetrics: Map<string, GovernanceMetrics> = new Map();

  constructor() {
    console.log('🎯 [ChatPanel] Initializing with Universal Governance Adapter');
    this.universalGovernance = new UniversalGovernanceAdapter();
    this.agentConfigService = new AgentConfigurationService();
  }

  // ============================================================================
  // UNIVERSAL GOVERNANCE INTEGRATION
  // ============================================================================

  private async getTrustScore(agentId: string): Promise<{ currentScore: number; lastUpdated: string; factors: any[] }> {
    try {
      const trustScore = await this.universalGovernance.getTrustScore(agentId);
      
      if (trustScore) {
        return {
          currentScore: trustScore.currentScore,
          lastUpdated: trustScore.lastUpdated?.toISOString() || new Date().toISOString(),
          factors: trustScore.history || []
        };
      }
      
      return {
        currentScore: 0.75,
        lastUpdated: new Date().toISOString(),
        factors: []
      };
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
      // Note: UniversalGovernanceAdapter doesn't have updateTrustScore method
      // Trust scores are updated automatically by the backend API
      console.log(`🤝 [ChatPanel] Trust score update event logged for agent ${agentId}`);
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to update trust score:`, error);
    }
  }

  private async enforcePolicy(agentId: string, content: string, context: any): Promise<{ allowed: boolean; violations: string[]; warnings: string[]; complianceScore: number }> {
    try {
      const policyResult = await this.universalGovernance.enforcePolicy(agentId, content, {
        contextId: 'chat_panel',
        environment: 'chat_panel',
        features: ['policy_enforcement'],
        policies: [],
        trustThresholds: { minimum: 0.3, warning: 0.5, optimal: 0.8 }
      });
      
      return {
        allowed: policyResult.allowed,
        violations: policyResult.violations?.map(v => v.message || v) || [],
        warnings: policyResult.warnings || [],
        complianceScore: policyResult.complianceScore || 1.0
      };
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

  private async createAuditEntry(entry: any): Promise<{ id: string; timestamp: string; status: string }> {
    try {
      const auditEntry = await this.universalGovernance.createAuditEntry({
        id: entry.interaction_id || `chat_${Date.now()}`,
        agentId: entry.agent_id,
        action: entry.interaction_type || 'chat_interaction',
        details: {
          user_id: entry.user_id || 'unknown',
          session_id: entry.session_id,
          message_content: entry.user_message,
          response_content: entry.agent_response,
          trust_score: entry.trust_score,
          governance_status: entry.governance_status
        },
        outcome: entry.governance_status === 'blocked' ? 'blocked' : 'success',
        timestamp: new Date()
      });
      
      return {
        id: auditEntry?.id || `audit_${Date.now()}`,
        timestamp: auditEntry?.timestamp?.toISOString() || new Date().toISOString(),
        status: 'success'
      };
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to create audit entry:`, error);
      return {
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'error'
      };
    }
  }

  private async generateChatResponse(sessionId: string, message: string, agentId: string, context: any): Promise<{ response: string; trustScore: number; governanceStatus: string; metadata: any }> {
    try {
      // Use the Universal Governance Adapter's enhanced response generation
      const enhancedResponse = await this.universalGovernance.enhanceResponseWithGovernance(
        agentId, // Agent ID first
        message, // User message second
        {
          sessionId,
          environment: 'chat_panel',
          governance_enabled: true,
          conversationHistory: context?.conversationHistory || [],
          ...context
        }
      );
      
      return {
        response: enhancedResponse.enhancedMessage || this.generateFallbackResponse(message),
        trustScore: enhancedResponse.governanceMetrics?.trustScore || 0.75,
        governanceStatus: enhancedResponse.governanceMetrics?.blocked ? 'blocked' : 'approved',
        metadata: enhancedResponse.metadata || { source: 'universal_governance' }
      };
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
    
    if (lowerMessage.includes('governance') || lowerMessage.includes('trust') || lowerMessage.includes('policy')) {
      return "I'm here to help with governance-related questions! Our AI governance system ensures secure, compliant, and trustworthy interactions through advanced trust scoring, policy enforcement, and comprehensive audit trails.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
      return "I'd be happy to assist you! I'm powered by an advanced governance framework that monitors trust levels, enforces policies, and maintains detailed audit logs to ensure safe and reliable AI interactions.";
    }
    
    return "Thank you for your message! I'm here to provide helpful, governance-compliant responses. Our system continuously monitors trust levels and policy compliance to ensure the highest standards of AI safety and reliability.";
  }

  // ============================================================================
  // CHAT SESSION MANAGEMENT
  // ============================================================================

  async startChatSession(chatbot: ChatbotProfile): Promise<ChatSession> {
    try {
      console.log(`🚀 [ChatPanel] Starting chat session for agent ${chatbot.id}`);
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get initial trust score
      const trustData = await this.getTrustScore(chatbot.id);
      
      const session: ChatSession = {
        sessionId,
        agentId: chatbot.id,
        startTime: new Date(),
        messageCount: 0,
        trustScore: trustData.currentScore,
        governanceMetrics: {
          violations: 0,
          warnings: 0,
          complianceScore: 1.0
        }
      };

      this.activeSessions.set(sessionId, session);
      
      // Initialize session metrics
      this.sessionMetrics.set(sessionId, {
        trustScore: trustData.currentScore,
        messageCount: 0,
        violations: 0,
        autonomyLevel: 'standard'
      });

      // Create audit entry for session start
      await this.createAuditEntry({
        interaction_id: `session_start_${sessionId}`,
        agent_id: chatbot.id,
        session_id: sessionId,
        interaction_type: 'session_start',
        user_message: '',
        agent_response: '',
        trust_score: trustData.currentScore,
        governance_status: 'approved',
        timestamp: new Date().toISOString()
      });

      console.log(`✅ [ChatPanel] Chat session started successfully: ${sessionId}`);
      return session;
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to start chat session:`, error);
      throw error;
    }
  }

  async endChatSession(sessionId: string): Promise<void> {
    try {
      console.log(`🏁 [ChatPanel] Ending chat session: ${sessionId}`);
      
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        console.warn(`⚠️ [ChatPanel] Session not found: ${sessionId}`);
        return;
      }

      session.endTime = new Date();
      
      // Create audit entry for session end
      await this.createAuditEntry({
        interaction_id: `session_end_${sessionId}`,
        agent_id: session.agentId,
        session_id: sessionId,
        interaction_type: 'session_end',
        user_message: '',
        agent_response: '',
        trust_score: session.trustScore,
        governance_status: 'completed',
        timestamp: new Date().toISOString()
      });

      this.activeSessions.delete(sessionId);
      this.sessionMetrics.delete(sessionId);
      
      console.log(`✅ [ChatPanel] Chat session ended successfully: ${sessionId}`);
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to end chat session:`, error);
      throw error;
    }
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    try {
      console.log(`💬 [ChatPanel] Processing message in session: ${sessionId}`);
      
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const metrics = this.sessionMetrics.get(sessionId);
      if (!metrics) {
        throw new Error(`Session metrics not found: ${sessionId}`);
      }

      // 1. Policy Enforcement
      const policyResult = await this.enforcePolicy(session.agentId, message, { sessionId });
      
      if (!policyResult.allowed) {
        console.warn(`🚫 [ChatPanel] Message blocked by policy:`, policyResult.violations);
        
        // Update metrics
        metrics.violations += policyResult.violations.length;
        session.governanceMetrics.violations += policyResult.violations.length;
        
        // Create audit entry for blocked message
        await this.createAuditEntry({
          interaction_id: `blocked_${Date.now()}`,
          agent_id: session.agentId,
          session_id: sessionId,
          interaction_type: 'message_blocked',
          user_message: message,
          agent_response: '',
          trust_score: session.trustScore,
          governance_status: 'blocked',
          timestamp: new Date().toISOString()
        });

        return {
          id: `msg_${Date.now()}`,
          content: `I cannot process that message due to policy violations: ${policyResult.violations.join(', ')}. Please rephrase your request.`,
          sender: 'agent',
          timestamp: new Date(),
          trustScore: session.trustScore,
          governanceStatus: 'blocked'
        };
      }

      // 2. Generate Response
      const chatResponse = await this.generateChatResponse(sessionId, message, session.agentId, { sessionId });
      
      // 3. Update Trust Score
      await this.updateTrustScore(session.agentId, {
        type: 'message_interaction',
        quality: 'good',
        compliance: policyResult.complianceScore,
        sessionId
      });

      // 4. Update Session Metrics
      session.messageCount++;
      session.trustScore = chatResponse.trustScore;
      session.governanceMetrics.complianceScore = policyResult.complianceScore;
      
      metrics.messageCount++;
      metrics.trustScore = chatResponse.trustScore;

      // 5. Create Audit Entry
      await this.createAuditEntry({
        interaction_id: `msg_${Date.now()}`,
        agent_id: session.agentId,
        session_id: sessionId,
        interaction_type: 'chat_interaction',
        user_message: message,
        agent_response: chatResponse.response,
        trust_score: chatResponse.trustScore,
        governance_status: chatResponse.governanceStatus,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ [ChatPanel] Message processed successfully`);
      
      return {
        id: `msg_${Date.now()}`,
        content: chatResponse.response,
        sender: 'agent',
        timestamp: new Date(),
        trustScore: chatResponse.trustScore,
        governanceStatus: chatResponse.governanceStatus
      };
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to process message:`, error);
      throw error;
    }
  }

  // ============================================================================
  // GOVERNANCE METRICS & MONITORING
  // ============================================================================

  getSessionMetrics(sessionId: string): GovernanceMetrics | null {
    return this.sessionMetrics.get(sessionId) || null;
  }

  getAllActiveSessions(): ChatSession[] {
    return Array.from(this.activeSessions.values());
  }

  async getAgentTrustLevel(agentId: string): Promise<string> {
    try {
      const trustScore = await this.universalGovernance.getTrustScore(agentId);
      if (trustScore) {
        if (trustScore.currentScore >= 0.8) return 'enhanced';
        if (trustScore.currentScore >= 0.5) return 'standard';
        return 'restricted';
      }
      return 'standard';
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to get trust level:`, error);
      return 'standard';
    }
  }

  async getComplianceMetrics(agentId: string): Promise<any> {
    try {
      const trustScore = await this.universalGovernance.getTrustScore(agentId);
      return { 
        complianceScore: trustScore?.currentScore || 1.0, 
        violations: 0, 
        warnings: 0 
      };
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to get compliance metrics:`, error);
      return { complianceScore: 1.0, violations: 0, warnings: 0 };
    }
  }
}



// Export types for external use
export type { ChatMessage, ChatSession, GovernanceMetrics };

// Export a singleton instance for easy use
export const chatPanelGovernanceService = new ChatPanelGovernanceService();

// Legacy export for compatibility
export interface ChatResponse {
  response: string;
  trustScore: number;
  governanceStatus: string;
  metadata: any;
}

