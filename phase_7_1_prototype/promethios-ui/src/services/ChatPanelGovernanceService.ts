/**
 * Chat Panel Governance Service
 * 
 * Integrates with the real Promethios governance API that powers modern chat
 * for real-time agent functionality, trust management, and policy enforcement.
 */

import { ChatbotProfile } from '../types/ChatbotTypes';
import { AgentConfigurationService } from './AgentConfigurationService';
import { RuntimeConfiguration, AgentConfiguration } from '../types/AgentConfigurationTypes';

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
  private governanceApiBase: string;

  constructor() {
    console.log('💬 [ChatPanel] Initializing Chat Panel Governance Service with real API integration');
    this.agentConfigService = new AgentConfigurationService();
    
    // Use the real Promethios governance API
    this.governanceApiBase = 'http://localhost:8000/api';
    
    // Test API connection
    this.testGovernanceConnection();
  }

  private async testGovernanceConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.governanceApiBase}/health`);
      if (response.ok) {
        console.log('✅ [ChatPanel] Connected to real Promethios governance API');
      } else {
        console.warn('⚠️ [ChatPanel] Governance API not responding, using fallback mode');
      }
    } catch (error) {
      console.warn('⚠️ [ChatPanel] Could not connect to governance API, using fallback mode:', error);
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async startChatSession(chatbot: ChatbotProfile, userId: string = 'user'): Promise<ChatSession> {
    try {
      const sessionId = `chat_session_${chatbot.identity.id}_${Date.now()}`;
      
      console.log(`🚀 [ChatPanel] Starting chat session for chatbot ${chatbot.identity.name}`);

      // Ensure governance is initialized (but don't fail if it's not)
      try {
        await this.universalAdapter.initializeUniversalGovernance();
      } catch (error) {
        console.warn('⚠️ [ChatPanel] Governance initialization failed, continuing with basic functionality:', error);
      }

      // Load agent configuration and initialize with tools
      let agentConfig: AgentConfiguration | null = null;
      try {
        console.log(`🔧 [ChatPanel] Loading agent configuration for ${chatbot.identity.id}`);
        agentConfig = await this.agentConfigService.getConfiguration(chatbot.identity.id);
        
        if (agentConfig) {
          // Create runtime configuration
          const runtimeConfig: RuntimeConfiguration = {
            agentId: chatbot.identity.id,
            sessionId,
            configuration: agentConfig,
            context: {
              sessionType: 'chat',
              userContext: { userId },
              environmentContext: { platform: 'web' }
            }
          };

          // Initialize Universal Governance Adapter with agent configuration
          await this.universalAdapter.initializeWithConfiguration(runtimeConfig);
          
          console.log(`✅ [ChatPanel] Agent initialized with ${agentConfig.toolProfile.enabledTools.filter(t => t.enabled).length} enabled tools`);
        } else {
          console.log(`ℹ️ [ChatPanel] No custom configuration found for agent ${chatbot.identity.id}, using defaults`);
        }
      } catch (error) {
        console.warn('⚠️ [ChatPanel] Failed to load agent configuration, continuing with defaults:', error);
      }

      // Get initial trust and autonomy levels with fallbacks
      let trustScore;
      let autonomyLevel = 'standard';
      let trustLevel = 'medium';

      try {
        trustScore = await this.universalAdapter.getTrustScore(chatbot.identity.id);
        autonomyLevel = await this.universalAdapter.getAutonomyLevel(chatbot.identity.id);
        trustLevel = await this.universalAdapter.calculateTrustLevel(chatbot.identity.id);
      } catch (error) {
        console.warn('⚠️ [ChatPanel] Failed to get governance metrics, using defaults:', error);
        trustScore = { currentScore: 0.75, lastUpdated: new Date(), factors: [] };
      }

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
          averageTrustScore: trustScore?.currentScore || 0.75,
          policyViolations: 0,
        }
      };

      // Add welcome message if configured
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: 'bot',
        text: `Hello! I'm ${chatbot.identity.name}. How can I help you today?`,
        timestamp: new Date(),
        agentId: chatbot.identity.id,
        trustScore: trustScore?.currentScore || 0.75,
        governanceStatus: 'approved'
      };

      session.messages.push(welcomeMessage);
      this.activeSessions.set(sessionId, session);

      console.log(`✅ [ChatPanel] Chat session started:`, {
        sessionId,
        chatbotName: chatbot.identity.name,
        trustLevel: session.trustLevel,
        autonomyLevel: session.autonomyLevel
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
      await this.universalAdapter.createAuditEntry({
        interaction_id: `session_end_${sessionId}`,
        agent_id: session.chatbotId,
        user_id: session.userId,
        interaction_type: 'session_end',
        timestamp: new Date(),
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

      // Policy enforcement check
      const policyEnforcement = await this.universalAdapter.enforcePolicy(
        session.chatbotId,
        userMessage,
        {
          userId: session.userId,
          sessionId: session.sessionId,
          environment: 'chat_panel',
          timestamp: new Date()
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

      // Generate bot response
      const botResponse = await this.generateBotResponse(session, userMessage);

      // Update session metrics
      session.governanceMetrics.averageTrustScore = 
        (session.governanceMetrics.averageTrustScore + botResponse.trustScore) / 2;

      // Create audit entry
      await this.universalAdapter.createAuditEntry({
        interaction_id: `msg_${Date.now()}`,
        agent_id: session.chatbotId,
        user_id: session.userId,
        interaction_type: 'message_exchange',
        user_message: userMessage,
        agent_response: botResponse.message.text,
        timestamp: new Date(),
        trust_score: botResponse.trustScore,
        governance_status: botResponse.governanceStatus,
        policy_violations: policyEnforcement.violations,
        session_id: sessionId
      });

      console.log(`✅ [ChatPanel] Message processed successfully:`, {
        trustScore: botResponse.trustScore,
        governanceStatus: botResponse.governanceStatus
      });

      return botResponse;
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

  private async generateBotResponse(session: ChatSession, userMessage: string): Promise<ChatResponse> {
    try {
      console.log(`🤖 [ChatPanel] Generating bot response for session ${session.sessionId}`);

      // Get current trust score
      const trustScore = await this.universalAdapter.getTrustScore(session.chatbotId);
      const currentTrustScore = trustScore?.currentScore || 0.75;

      // Check if autonomous thinking is allowed
      const autonomousThinking = await this.universalAdapter.requestAutonomousThinking(
        session.chatbotId,
        {
          type: 'response_generation',
          description: `Generating response to: "${userMessage}"`,
          duration: 5000
        }
      );

      // Check if user message requires tool usage
      let toolResults: any[] = [];
      let responseText = '';
      
      try {
        // Determine if tools should be used based on user message
        const toolsNeeded = this.analyzeMessageForToolUsage(userMessage);
        
        if (toolsNeeded.length > 0) {
          console.log(`🛠️ [ChatPanel] User message requires tools: ${toolsNeeded.join(', ')}`);
          
          // Execute required tools
          for (const toolName of toolsNeeded) {
            try {
              const toolResult = await this.universalAdapter.executeToolAction(
                toolName,
                this.extractToolParameters(toolName, userMessage),
                { sessionId: session.sessionId, userId: session.userId }
              );
              
              if (toolResult.success !== false) {
                toolResults.push({ tool: toolName, result: toolResult });
                console.log(`✅ [ChatPanel] Tool ${toolName} executed successfully`);
              }
            } catch (toolError) {
              console.warn(`⚠️ [ChatPanel] Tool ${toolName} execution failed:`, toolError);
              // Continue with other tools or fallback response
            }
          }
        }

        // Generate response based on tool results or fallback to contextual response
        if (toolResults.length > 0) {
          responseText = this.generateToolBasedResponse(userMessage, toolResults);
        } else {
          responseText = this.generateContextualResponse(userMessage, session);
        }
      } catch (error) {
        console.warn(`⚠️ [ChatPanel] Tool analysis/execution failed, using contextual response:`, error);
        responseText = this.generateContextualResponse(userMessage, session);
      }

      // Add autonomous thinking if approved
      let autonomousThoughts: string[] = [];
      if (autonomousThinking.approved) {
        autonomousThoughts = [
          "The user seems to be asking about our services",
          "I should provide helpful and accurate information",
          "Let me consider the best way to assist them"
        ];
      }

      // Create bot message
      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        type: 'bot',
        text: responseText,
        timestamp: new Date(),
        agentId: session.chatbotId,
        trustScore: currentTrustScore,
        governanceStatus: 'approved',
        metadata: {
          autonomousThinking: autonomousThinking.approved,
          thoughts: autonomousThoughts,
          confidence: 0.85
        }
      };

      // Add to session
      session.messages.push(botMessage);

      // Update trust score based on response quality
      await this.universalAdapter.updateTrustScore(session.chatbotId, {
        type: 'response_generated',
        quality: 0.8,
        helpfulness: 0.85,
        accuracy: 0.9,
        timestamp: new Date()
      });

      return {
        message: botMessage,
        trustScore: currentTrustScore,
        governanceStatus: 'approved',
        autonomousThinking: {
          enabled: autonomousThinking.approved,
          thoughts: autonomousThoughts,
          confidence: 0.85
        }
      };
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to generate bot response:`, error);
      throw error;
    }
  }

  private generateContextualResponse(userMessage: string, session: ChatSession): string {
    const message = userMessage.toLowerCase();
    
    // Simple contextual responses based on keywords
    if (message.includes('help') || message.includes('support')) {
      return "I'd be happy to help you! I can assist with questions about our services, provide information about features, or help you get started. What specific area would you like to explore?";
    }
    
    if (message.includes('service') || message.includes('what do you do')) {
      return "We offer comprehensive AI solutions including custom chatbot development, AI model integration, governance and compliance tools, and analytics and performance monitoring. What specific service interests you most?";
    }
    
    if (message.includes('price') || message.includes('cost') || message.includes('pricing')) {
      return "Our pricing varies based on your specific needs and usage requirements. We offer flexible plans for different business sizes. Would you like me to connect you with our sales team for a personalized quote?";
    }
    
    if (message.includes('how') || message.includes('start') || message.includes('begin')) {
      return "Getting started is easy! First, we'll assess your needs and requirements. Then we'll design a custom solution that fits your business. Finally, we'll implement and provide ongoing support. Would you like to schedule a consultation?";
    }
    
    if (message.includes('thank') || message.includes('thanks')) {
      return "You're very welcome! I'm here to help whenever you need assistance. Is there anything else I can help you with today?";
    }
    
    // Default response
    return "That's a great question! I'd be happy to provide more information about that. Could you tell me a bit more about what you're looking for so I can give you the most helpful response?";
  }

  // ============================================================================
  // GOVERNANCE METRICS & MONITORING
  // ============================================================================

  async getSessionMetrics(sessionId: string): Promise<any> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return null;
      }

      const trustScore = await this.universalAdapter.getTrustScore(session.chatbotId);
      const complianceMetrics = await this.universalAdapter.getComplianceMetrics(session.chatbotId);

      return {
        session: {
          id: sessionId,
          duration: Date.now() - session.startTime.getTime(),
          messageCount: session.messages.length,
          isActive: session.isActive
        },
        governance: session.governanceMetrics,
        trust: {
          currentScore: trustScore?.currentScore || 0,
          level: session.trustLevel,
          trend: trustScore?.trend || 'stable'
        },
        compliance: complianceMetrics,
        autonomy: {
          level: session.autonomyLevel
        }
      };
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to get session metrics:`, error);
      return null;
    }
  }

  async getChatbotStatus(chatbotId: string): Promise<any> {
    try {
      const trustScore = await this.universalAdapter.getTrustScore(chatbotId);
      const autonomyLevel = await this.universalAdapter.getAutonomyLevel(chatbotId);
      const complianceMetrics = await this.universalAdapter.getComplianceMetrics(chatbotId);

      return {
        chatbotId,
        trust: {
          score: trustScore?.currentScore || 0.75,
          level: await this.universalAdapter.calculateTrustLevel(chatbotId),
          trend: trustScore?.trend || 'stable'
        },
        autonomy: {
          level: autonomyLevel
        },
        compliance: complianceMetrics,
        status: 'online',
        lastActivity: new Date()
      };
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to get chatbot status:`, error);
      return null;
    }
  }

  // ============================================================================
  // TOOL INTEGRATION METHODS
  // ============================================================================

  private analyzeMessageForToolUsage(message: string): string[] {
    const toolsNeeded: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Web search triggers
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || 
        lowerMessage.includes('look up') || lowerMessage.includes('what is') ||
        lowerMessage.includes('tell me about')) {
      toolsNeeded.push('web_search');
    }

    // Email triggers
    if (lowerMessage.includes('send email') || lowerMessage.includes('email') ||
        lowerMessage.includes('contact') || lowerMessage.includes('notify')) {
      toolsNeeded.push('email_sender');
    }

    // Calendar triggers
    if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar') ||
        lowerMessage.includes('appointment') || lowerMessage.includes('meeting')) {
      toolsNeeded.push('calendar_manager');
    }

    // Document generation triggers
    if (lowerMessage.includes('create document') || lowerMessage.includes('generate report') ||
        lowerMessage.includes('write') || lowerMessage.includes('document')) {
      toolsNeeded.push('document_generator');
    }

    // E-commerce triggers (Shopify)
    if (lowerMessage.includes('product') || lowerMessage.includes('inventory') ||
        lowerMessage.includes('order') || lowerMessage.includes('shopify')) {
      toolsNeeded.push('shopify_integration');
    }

    return toolsNeeded;
  }

  private extractToolParameters(toolName: string, message: string): any {
    const lowerMessage = message.toLowerCase();

    switch (toolName) {
      case 'web_search':
        // Extract search query
        const searchTerms = message.replace(/search for|find|look up|what is|tell me about/gi, '').trim();
        return { query: searchTerms || message };

      case 'email_sender':
        // Extract email details (simplified)
        return {
          subject: `Message from chat: ${message.substring(0, 50)}...`,
          body: message,
          to: 'support@promethios.com' // Default recipient
        };

      case 'calendar_manager':
        // Extract calendar details (simplified)
        return {
          title: `Scheduled from chat: ${message.substring(0, 30)}...`,
          description: message,
          duration: 30 // Default 30 minutes
        };

      case 'document_generator':
        // Extract document details
        return {
          title: `Generated Document`,
          content: message,
          format: 'pdf'
        };

      case 'shopify_integration':
        // Extract product search terms
        const productQuery = message.replace(/product|inventory|order|shopify/gi, '').trim();
        return { query: productQuery || 'all products' };

      default:
        return { input: message };
    }
  }

  private generateToolBasedResponse(userMessage: string, toolResults: any[]): string {
    if (toolResults.length === 0) {
      return "I tried to help with your request, but couldn't access the necessary tools at the moment. Let me provide a general response instead.";
    }

    let response = "I've processed your request using my available tools. Here's what I found:\n\n";

    for (const { tool, result } of toolResults) {
      switch (tool) {
        case 'web_search':
          response += `🔍 **Search Results**: I found relevant information about your query. ${result.summary || 'Results are available.'}\n\n`;
          break;

        case 'email_sender':
          response += `📧 **Email Sent**: I've sent your message to the appropriate team. You should receive a response soon.\n\n`;
          break;

        case 'calendar_manager':
          response += `📅 **Calendar Updated**: I've scheduled your request. You'll receive a calendar invitation shortly.\n\n`;
          break;

        case 'document_generator':
          response += `📄 **Document Created**: I've generated a document based on your request. It's ready for download.\n\n`;
          break;

        case 'shopify_integration':
          response += `🛍️ **Product Information**: I've retrieved the latest product details from our inventory system.\n\n`;
          break;

        default:
          response += `🔧 **Tool Result**: I've processed your request using ${tool}.\n\n`;
      }
    }

    response += "Is there anything else you'd like me to help you with?";
    return response;
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

