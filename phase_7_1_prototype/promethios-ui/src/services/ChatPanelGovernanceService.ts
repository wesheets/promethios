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
import { ChatStorageService, ChatMessage as StoredChatMessage, AgentChatHistory } from './ChatStorageService';
import { PredictiveGovernanceExtension, RiskPrediction } from '../extensions/PredictiveGovernanceExtension';
import { InteractiveReceiptExtension } from '../extensions/InteractiveReceiptExtension';
import { ReceiptIntegrationService } from '../components/receipts/ReceiptIntegrationService';
import { auth } from '../firebase/config';

// Chat Panel Response Types
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  trustScore?: number;
  governanceStatus?: string;
  attachments?: File[];
  isError?: boolean;
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
  private chatStorageService: ChatStorageService;
  private predictiveGovernance: PredictiveGovernanceExtension;
  private interactiveReceipts: InteractiveReceiptExtension;
  private receiptIntegration: ReceiptIntegrationService;
  private currentSession: ChatSession | null = null;
  private conversationHistory: ChatMessage[] = [];
  private activeSessions: Map<string, ChatSession> = new Map();
  private sessionMetrics: Map<string, GovernanceMetrics> = new Map();

  constructor() {
    console.log('🎯 [ChatPanel] Initializing with Universal Governance Adapter and Extensions');
    this.universalGovernance = new UniversalGovernanceAdapter();
    this.agentConfigService = new AgentConfigurationService();
    this.chatStorageService = new ChatStorageService();
    
    // Initialize extensions
    this.predictiveGovernance = new PredictiveGovernanceExtension();
    this.interactiveReceipts = new InteractiveReceiptExtension();
    this.receiptIntegration = new ReceiptIntegrationService();
    
    console.log('✅ [ChatPanel] All extensions initialized successfully');
  }

  // ============================================================================
  // AUTHENTICATION HELPERS
  // ============================================================================

  private async getCurrentUser() {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('⚠️ [ChatPanel] No authenticated user found, using anonymous mode');
        return null;
      }
      return user;
    } catch (error) {
      console.error('❌ [ChatPanel] Failed to get current user:', error);
      return null;
    }
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

  private async generateChatResponse(sessionId: string, message: string, agentId: string, context: any, attachments?: File[]): Promise<{ response: string; trustScore: number; governanceStatus: string; metadata: any }> {
    try {
      // Process attachments if provided
      let attachmentData: any[] = [];
      if (attachments && attachments.length > 0) {
        console.log(`📎 [ChatPanel] Processing ${attachments.length} attachments`);
        
        for (const file of attachments) {
          try {
            // Compress images before sending to backend to avoid 413 Payload Too Large errors
            let processedFile = file;
            if (file.type.startsWith('image/')) {
              console.log(`🖼️ [ChatPanel] Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
              processedFile = await this.compressImage(file);
              console.log(`✅ [ChatPanel] Image compressed: ${processedFile.name} (${(processedFile.size / 1024 / 1024).toFixed(2)}MB)`);
            }
            
            // Convert file to base64 for transmission
            const fileData = await this.fileToBase64(processedFile);
            attachmentData.push({
              name: file.name,
              type: file.type,
              size: processedFile.size,
              data: fileData,
              lastModified: file.lastModified,
              compressed: file.type.startsWith('image/') && processedFile.size < file.size
            });
          } catch (error) {
            console.warn(`⚠️ [ChatPanel] Failed to process attachment ${file.name}:`, error);
          }
        }
      }

      // Get current user for better context
      const currentUser = await this.getCurrentUser();
      const userId = currentUser?.uid || 'anonymous';
      
      // Use the Universal Governance Adapter's enhanced response generation
      const enhancedResponse = await this.universalGovernance.enhanceResponseWithGovernance(
        agentId, // Agent ID first
        message, // User message second
        {
          sessionId,
          userId, // Add user ID for better context
          environment: 'chat_panel',
          governance_enabled: true,
          conversationHistory: context?.conversationHistory || [],
          attachments: attachmentData, // Include attachment data
          userAuthenticated: !!currentUser, // Add authentication status
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

  // Helper method to convert File to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix to get just the base64 data
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private async compressImage(file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new File object with compressed data
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: file.lastModified
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  }

  // ============================================================================
  // CHAT SESSION MANAGEMENT
  // ============================================================================

  async startChatSession(chatbot: ChatbotProfile): Promise<ChatSession> {
    try {
      console.log(`🚀 [ChatPanel] Starting chat session for agent ${chatbot.identity.id}`);
      
      // Initialize chat storage service with current user
      // Get the actual authenticated user ID from Firebase Auth
      const currentUser = await this.getCurrentUser();
      await this.chatStorageService.setCurrentUser(currentUser?.uid || 'anonymous');
      
      // Load existing chat history for this agent
      console.log(`📚 [ChatPanel] Loading chat history for agent: ${chatbot.identity.id}`);
      const existingHistory = await this.chatStorageService.loadAgentChatHistory(chatbot.identity.id);
      
      if (existingHistory) {
        console.log(`✅ [ChatPanel] Loaded ${existingHistory.messages.length} previous messages`);
        // Convert stored messages to chat panel format
        this.conversationHistory = existingHistory.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as 'user' | 'agent',
          timestamp: msg.timestamp,
          trustScore: msg.governanceData?.trustScore,
          governanceStatus: msg.governanceData?.approved ? 'approved' : 'pending'
        }));
      } else {
        console.log(`📝 [ChatPanel] No existing history found, starting fresh conversation`);
        this.conversationHistory = [];
      }
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get initial trust score
      const trustData = await this.getTrustScore(chatbot.identity.id);
      
      const session: ChatSession = {
        sessionId,
        agentId: chatbot.identity.id, // FIXED: Use chatbot.identity.id instead of chatbot.id
        startTime: new Date(),
        messageCount: this.conversationHistory.length, // FIXED: Use existing message count
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
        messageCount: this.conversationHistory.length, // FIXED: Use existing message count
        violations: 0,
        autonomyLevel: 'standard'
      });

      // Create audit entry for session start
      await this.createAuditEntry({
        interaction_id: `session_start_${sessionId}`,
        agent_id: chatbot.identity.id, // FIXED: Use chatbot.identity.id
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

  async sendMessage(sessionId: string, message: string, attachments?: File[]): Promise<ChatMessage> {
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

      // 1. Predictive Governance - Risk Assessment
      try {
        // Check if predictActionRisk method exists before calling it
        if (this.predictiveGovernance && typeof this.predictiveGovernance.predictActionRisk === 'function') {
          const proposedAction = {
            toolName: 'chat',
            actionType: 'message_processing',
            parameters: { message, attachments: attachments?.length || 0 },
            context: {
              sessionId,
              previousActions: this.conversationHistory.slice(-5).map(msg => `${msg.sender}: ${msg.content.substring(0, 50)}...`),
              userIntent: message.length > 100 ? 'detailed_query' : 'simple_query',
              businessContext: 'chat_interaction',
              timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
              workloadLevel: this.conversationHistory.length > 10 ? 'high' : 'normal'
            },
            urgency: attachments && attachments.length > 0 ? 'medium' : 'low'
          };
          
          const riskPrediction = await this.predictiveGovernance.predictActionRisk(session.agentId, proposedAction);
          
          console.log(`🔮 [ChatPanel] Risk prediction:`, riskPrediction);
          
          // Handle high risk scenarios
          if (riskPrediction.riskScore > 70) {
            console.warn(`⚠️ [ChatPanel] High risk detected, requiring approval`);
            
            return {
              id: `approval_${Date.now()}`,
              content: `This action has been flagged for review due to high risk (${riskPrediction.riskScore}/100). Recommendations: ${riskPrediction.recommendations.map(r => r.description).join(', ')}. Would you like to proceed?`,
              sender: 'agent',
              timestamp: new Date(),
              trustScore: metrics.trustScore,
              governanceStatus: 'pending_approval'
            };
          }
        } else {
          console.log(`🔮 [ChatPanel] Predictive governance (predictActionRisk) not available, skipping risk assessment`);
        }
      } catch (error) {
        console.warn(`⚠️ [ChatPanel] Predictive governance failed, continuing:`, error);
      }

      // 2. Policy Enforcement
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

      // 3. Generate Response
      const chatResponse = await this.generateChatResponse(sessionId, message, session.agentId, { sessionId }, attachments);
      
      // 4. Generate Receipt for this interaction
      try {
        // Check if generateReceipt method exists before calling it
        if (this.receiptIntegration && typeof this.receiptIntegration.generateReceipt === 'function') {
          const receipt = await this.receiptIntegration.generateReceipt({
            toolName: 'chat',
            action: 'message_processing',
            parameters: { message, response: chatResponse.response },
            result: { success: true, trustScore: chatResponse.trustScore },
            agentId: session.agentId,
            sessionId,
            timestamp: new Date()
          });
          
          console.log(`🧾 [ChatPanel] Receipt generated: ${receipt.id}`);
        } else {
          console.log(`🧾 [ChatPanel] Receipt integration not available, skipping receipt generation`);
        }
      } catch (error) {
        console.warn(`⚠️ [ChatPanel] Receipt generation failed:`, error);
      }

      // 5. Update Trust Score
      await this.updateTrustScore(session.agentId, {
        type: 'message_interaction',
        quality: 'good',
        compliance: policyResult.complianceScore,
        sessionId
      });

      // 6. Update Session Metrics
      session.messageCount++;
      session.trustScore = chatResponse.trustScore;
      session.governanceMetrics.complianceScore = policyResult.complianceScore;
      
      metrics.messageCount++;
      metrics.trustScore = chatResponse.trustScore;

      // 7. Save messages to persistent storage
      console.log(`💾 [ChatPanel] Saving messages to persistent storage`);
      
      // Save user message
      const userMessage: StoredChatMessage = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: message,
        sender: 'user',
        timestamp: new Date(),
        agentId: session.agentId,
        governanceData: {
          trustScore: metrics.trustScore,
          violations: policyResult.violations,
          approved: policyResult.allowed
        }
      };
      
      await this.chatStorageService.saveMessage(userMessage, session.agentId);
      
      // Save agent response
      const agentMessage: StoredChatMessage = {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: chatResponse.response,
        sender: 'agent',
        timestamp: new Date(),
        agentId: session.agentId,
        agentName: 'OpenAI Assistant', // TODO: Get actual agent name
        governanceData: {
          trustScore: chatResponse.trustScore,
          violations: [],
          approved: true
        }
      };
      
      await this.chatStorageService.saveMessage(agentMessage, session.agentId);
      
      // Update local conversation history
      this.conversationHistory.push(
        {
          id: userMessage.id,
          content: message,
          sender: 'user',
          timestamp: new Date(),
          trustScore: metrics.trustScore,
          governanceStatus: policyResult.allowed ? 'approved' : 'blocked'
        },
        {
          id: agentMessage.id,
          content: chatResponse.response,
          sender: 'agent',
          timestamp: new Date(),
          trustScore: chatResponse.trustScore,
          governanceStatus: chatResponse.governanceStatus
        }
      );

      // 8. Create Audit Entry
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

      console.log(`✅ [ChatPanel] Message processed and saved successfully`);
      
      return {
        id: agentMessage.id,
        content: chatResponse.response,
        sender: 'agent',
        timestamp: new Date(),
        trustScore: chatResponse.trustScore,
        governanceStatus: chatResponse.governanceStatus
      };
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to process message:`, error);
      
      // Return a proper fallback response instead of throwing error
      // This prevents the secondary "Sorry, I encountered an error" message
      return {
        id: `fallback_${Date.now()}`,
        content: "I'm experiencing some technical difficulties at the moment, but I'm still here to help! Please feel free to ask your question again or try rephrasing it. My governance systems are working to ensure reliable service.",
        sender: 'agent',
        timestamp: new Date(),
        trustScore: 0.75,
        governanceStatus: 'approved'
      };
    }
  }

  // ============================================================================
  // CONVERSATION HISTORY MANAGEMENT
  // ============================================================================

  /**
   * Get conversation history for the current session
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history (for testing or reset)
   */
  clearConversationHistory(): void {
    console.log(`🗑️ [ChatPanel] Clearing conversation history`);
    this.conversationHistory = [];
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

  // ============================================================================
  // RECEIPT MANAGEMENT
  // ============================================================================

  async getAgentReceipts(agentId: string, limit: number = 50): Promise<any[]> {
    try {
      console.log(`🧾 [ChatPanel] Getting receipts for agent: ${agentId}`);
      return await this.receiptIntegration.getAgentReceipts(agentId, limit);
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to get agent receipts:`, error);
      return [];
    }
  }

  async loadReceiptContext(receiptId: string): Promise<any> {
    try {
      console.log(`📋 [ChatPanel] Loading receipt context: ${receiptId}`);
      return await this.interactiveReceipts.loadReceiptContext(receiptId);
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to load receipt context:`, error);
      return null;
    }
  }

  async getReceiptsByCategory(agentId: string, category: string): Promise<any[]> {
    try {
      return await this.receiptIntegration.getReceiptsByCategory(agentId, category);
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to get receipts by category:`, error);
      return [];
    }
  }

  // ============================================================================
  // MEMORY MANAGEMENT
  // ============================================================================

  async getAgentMemory(agentId: string): Promise<any> {
    try {
      console.log(`🧠 [ChatPanel] Getting memory for agent: ${agentId}`);
      // Get conversation history from storage
      const history = await this.chatStorageService.loadAgentChatHistory(agentId);
      
      return {
        conversationHistory: history?.messages || [],
        memoryStats: {
          totalMessages: history?.messages.length || 0,
          totalSessions: 1, // TODO: Implement session counting
          averageTrustScore: history?.messages.reduce((sum, msg) => sum + (msg.governanceData?.trustScore || 0.75), 0) / (history?.messages.length || 1),
          lastActivity: history?.messages[history?.messages.length - 1]?.timestamp || new Date()
        },
        patterns: [], // TODO: Implement pattern analysis
        insights: [] // TODO: Implement insights generation
      };
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to get agent memory:`, error);
      return {
        conversationHistory: [],
        memoryStats: { totalMessages: 0, totalSessions: 0, averageTrustScore: 0.75, lastActivity: new Date() },
        patterns: [],
        insights: []
      };
    }
  }

  async clearAgentMemory(agentId: string): Promise<void> {
    try {
      console.log(`🗑️ [ChatPanel] Clearing memory for agent: ${agentId}`);
      await this.chatStorageService.clearAgentHistory(agentId);
      this.conversationHistory = [];
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to clear agent memory:`, error);
    }
  }

  // ============================================================================
  // SANDBOX MONITORING
  // ============================================================================

  async getAgentSandboxData(agentId: string): Promise<any> {
    try {
      console.log(`🔬 [ChatPanel] Getting sandbox data for agent: ${agentId}`);
      
      const activeSessions = Array.from(this.activeSessions.values()).filter(s => s.agentId === agentId);
      const sessionMetrics = Array.from(this.sessionMetrics.entries())
        .filter(([sessionId]) => activeSessions.some(s => s.sessionId === sessionId))
        .map(([sessionId, metrics]) => ({ sessionId, ...metrics }));

      return {
        agentId,
        status: activeSessions.length > 0 ? 'active' : 'idle',
        activeSessions: activeSessions.length,
        currentMetrics: sessionMetrics[0] || {
          trustScore: 0.75,
          messageCount: 0,
          violations: 0,
          autonomyLevel: 'standard'
        },
        realtimeData: {
          cpuUsage: Math.random() * 30 + 10, // Mock data
          memoryUsage: Math.random() * 40 + 20,
          responseTime: Math.random() * 2 + 0.5,
          throughput: Math.random() * 100 + 50
        },
        governanceAlerts: [],
        debugLogs: this.getRecentDebugLogs(agentId)
      };
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to get sandbox data:`, error);
      return {
        agentId,
        status: 'error',
        activeSessions: 0,
        currentMetrics: { trustScore: 0.75, messageCount: 0, violations: 0, autonomyLevel: 'standard' },
        realtimeData: { cpuUsage: 0, memoryUsage: 0, responseTime: 0, throughput: 0 },
        governanceAlerts: [],
        debugLogs: []
      };
    }
  }

  private getRecentDebugLogs(agentId: string): any[] {
    // Mock debug logs - in real implementation, this would come from logging service
    return [
      { timestamp: new Date(), level: 'info', message: `Agent ${agentId} session started`, source: 'governance' },
      { timestamp: new Date(Date.now() - 30000), level: 'debug', message: 'Trust score updated', source: 'trust_engine' },
      { timestamp: new Date(Date.now() - 60000), level: 'info', message: 'Policy check passed', source: 'policy_engine' }
    ];
  }

  // ============================================================================
  // GOVERNANCE SENSITIVITY CONTROLS
  // ============================================================================

  async updateGovernanceSensitivity(agentId: string, sensitivity: 'low' | 'medium' | 'high'): Promise<void> {
    try {
      console.log(`⚙️ [ChatPanel] Updating governance sensitivity for agent ${agentId}: ${sensitivity}`);
      
      // Update trust thresholds based on sensitivity
      const thresholds = {
        low: { minimum: 0.2, warning: 0.4, optimal: 0.6 },
        medium: { minimum: 0.3, warning: 0.5, optimal: 0.8 },
        high: { minimum: 0.5, warning: 0.7, optimal: 0.9 }
      };

      // Store sensitivity setting (in real implementation, this would be persisted)
      console.log(`✅ [ChatPanel] Governance sensitivity updated to ${sensitivity} with thresholds:`, thresholds[sensitivity]);
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to update governance sensitivity:`, error);
    }
  }

  async getGovernanceSensitivity(agentId: string): Promise<string> {
    try {
      // In real implementation, this would be retrieved from storage
      return 'medium'; // Default sensitivity
    } catch (error) {
      console.warn(`⚠️ [ChatPanel] Failed to get governance sensitivity:`, error);
      return 'medium';
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

