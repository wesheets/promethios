/**
 * MultiAgentRoutingService - Handles selective routing of messages to specific AI agents
 * Part of the revolutionary multi-agent collaboration system
 */

import { MessageParser, ParsedMessage } from '../utils/MessageParser';
import { ChatbotStorageService } from './ChatbotStorageService';
import { ChatbotProfile } from '../types/ChatbotProfile';
import { TokenEconomicsService } from './TokenEconomicsService';
import { temporaryRoleService } from './TemporaryRoleService';

export interface AgentResponse {
  agentId: string;
  agentName: string;
  response: string;
  timestamp: Date;
  processingTime: number;
  error?: string;
}

export interface MultiAgentConversation {
  id: string;
  hostAgentId: string;
  guestAgentIds: string[];
  messages: MultiAgentMessage[];
  createdAt: Date;
  lastActivity: Date;
}

export interface MultiAgentMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  agentId?: string; // For agent messages
  timestamp: Date;
  mentions?: string[]; // Agent IDs that were mentioned
  responses?: AgentResponse[]; // Responses from mentioned agents
  isMultiAgent: boolean;
}

export interface RoutingContext {
  hostAgentId: string;
  guestAgents: Array<{
    agentId: string;
    name: string;
    avatar?: string;
    addedAt: Date;
  }>;
  userId: string;
  conversationId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    agentId?: string;
    agentName?: string;
    timestamp?: Date;
  }>;
  selectedAgents?: string[]; // Explicitly selected agents via avatar selector
}

export class MultiAgentRoutingService {
  private static instance: MultiAgentRoutingService;
  private chatbotService: ChatbotStorageService;
  private messageParser: MessageParser;
  private tokenService: TokenEconomicsService;
  private busyAgents = new Set<string>();
  private responseQueue = new Map<string, Promise<AgentResponse>>();

  private constructor() {
    this.chatbotService = ChatbotStorageService.getInstance();
    this.messageParser = new MessageParser();
    this.tokenService = TokenEconomicsService.getInstance();
  }

  public static getInstance(): MultiAgentRoutingService {
    if (!MultiAgentRoutingService.instance) {
      MultiAgentRoutingService.instance = new MultiAgentRoutingService();
    }
    return MultiAgentRoutingService.instance;
  }

  /**
   * Process a user message and route it to appropriate agents
   */
  public async processUserMessage(
    message: string,
    context: RoutingContext
  ): Promise<{
    parsedMessage: ParsedMessage;
    targetAgents: string[];
    shouldWaitForUserPrompt: boolean;
    responses?: AgentResponse[];
  }> {
    console.log('🎯 [MultiAgentRouting] Processing user message:', message);
    console.log('🎯 [MultiAgentRouting] Context:', context);

    // Get all available agents (host + guests)
    const availableAgents = await this.getAvailableAgents(context);
    console.log('🎯 [MultiAgentRouting] Available agents:', availableAgents.map(a => a.name));

    // Parse the message for @mentions
    const parsedMessage = this.messageParser.parseMessage(message, availableAgents);
    console.log('🎯 [MultiAgentRouting] Parsed message:', parsedMessage);

    // Determine target agents - prioritize explicit selection over @mentions
    let targetAgents: string[] = [];
    
    if (parsedMessage.hasAgentMentions) {
      // Use @mention parsing if explicit mentions are found
      targetAgents = this.messageParser.getTargetAgentIds(parsedMessage, availableAgents);
      console.log('🎯 [MultiAgentRouting] Using @mention targets:', targetAgents);
    } else if (context.selectedAgents && context.selectedAgents.length > 0) {
      // Use explicitly selected agents from avatar selector
      targetAgents = context.selectedAgents;
      console.log('🎯 [MultiAgentRouting] Using avatar-selected targets:', targetAgents);
    } else {
      // Default to host agent only
      targetAgents = [context.hostAgentId];
      console.log('🎯 [MultiAgentRouting] Defaulting to host agent:', targetAgents);
    }

    console.log('🎯 [MultiAgentRouting] Final target agents:', targetAgents);

    // Check if we should wait for user prompt or respond immediately
    const shouldWaitForUserPrompt = !parsedMessage.hasAgentMentions && (!context.selectedAgents || context.selectedAgents.length === 0);

    let responses: AgentResponse[] | undefined;

    if (targetAgents.length > 0) {
      if (parsedMessage.hasAgentMentions) {
        console.log('🎯 [MultiAgentRouting] Routing to @mentioned agents:', targetAgents);
      } else {
        console.log('🎯 [MultiAgentRouting] Routing to avatar-selected agents:', targetAgents);
      }
      
      // Route to target agents immediately
      responses = await this.routeToAgents(
        parsedMessage.cleanMessage || parsedMessage.originalMessage,
        targetAgents,
        context
      );
    } else {
      console.log('🎯 [MultiAgentRouting] No target agents - waiting for user prompt');
    }

    return {
      parsedMessage,
      targetAgents,
      shouldWaitForUserPrompt,
      responses
    };
  }

  /**
   * Route message to specific agents and get their responses
   */
  public async routeToAgents(
    message: string,
    agentIds: string[],
    context: RoutingContext
  ): Promise<AgentResponse[]> {
    console.log('🚀 [MultiAgentRouting] Routing message to agents:', agentIds);

    // Create session budget if needed
    let sessionBudget = this.tokenService.getSessionBudget(context.conversationId);
    if (!sessionBudget) {
      await this.tokenService.createSessionBudget(context.conversationId, context.userId);
    }

    // Prevent simultaneous responses by queuing
    const responses: AgentResponse[] = [];
    
    for (const agentId of agentIds) {
      try {
        // Check if agent should engage based on token economics
        const engagementDecision = await this.tokenService.shouldAgentEngage(
          context.conversationId,
          agentId,
          message,
          'user_mention' // engagement reason
        );

        if (!engagementDecision.shouldEngage) {
          console.log('💰 [MultiAgentRouting] Agent engagement blocked:', agentId, engagementDecision.reasoning);
          
          // Create a response explaining why the agent didn't engage
          responses.push({
            agentId,
            agentName: agentId,
            response: `I'm being economically responsible and not engaging because: ${engagementDecision.tokenJustification}`,
            timestamp: new Date(),
            processingTime: 0,
            error: `Budget constraint: ${engagementDecision.reasoning}`
          });
          continue;
        }

        console.log('💰 [MultiAgentRouting] Agent approved for engagement:', agentId, `$${engagementDecision.estimatedCost.toFixed(4)}`);

        // Check if agent is already processing a message
        const existingPromise = this.responseQueue.get(agentId);
        if (existingPromise) {
          console.log('⏳ [MultiAgentRouting] Agent is busy, waiting for completion:', agentId);
          await existingPromise;
        }

        // Create new response promise
        const responsePromise = this.getAgentResponse(agentId, message, context);
        this.responseQueue.set(agentId, responsePromise);

        const response = await responsePromise;
        responses.push(response);

        // Record the actual cost (this would be updated with real token usage)
        if (!response.error) {
          await this.tokenService.recordAgentCost(
            context.conversationId,
            agentId,
            response.agentName,
            'gpt-3.5-turbo', // This should be determined from the agent profile
            {
              input: Math.ceil(message.length / 4), // Rough estimation
              output: Math.ceil(response.response.length / 4),
              total: Math.ceil((message.length + response.response.length) / 4)
            }
          );
        }

        // Clear from queue
        this.responseQueue.delete(agentId);

        console.log('✅ [MultiAgentRouting] Got response from agent:', agentId);
      } catch (error) {
        console.error('❌ [MultiAgentRouting] Error getting response from agent:', agentId, error);
        
        responses.push({
          agentId,
          agentName: agentId,
          response: 'Sorry, I encountered an error processing your message.',
          timestamp: new Date(),
          processingTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Clear from queue on error
        this.responseQueue.delete(agentId);
      }
    }

    return responses;
  }

  /**
   * Get response from a specific agent
   */
  private async getAgentResponse(
    agentId: string,
    message: string,
    context: RoutingContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    console.log('🤖 [MultiAgentRouting] Getting response from agent:', agentId);

    try {
      console.log('🔍 [MultiAgentRouting] Step 1: Looking up agent profile for:', agentId);
      
      // Get agent profile
      const agent = await this.chatbotService.getChatbotById(agentId);
      console.log('🔍 [MultiAgentRouting] Step 2: Agent lookup result:', agent ? 'FOUND' : 'NOT FOUND');
      
      if (!agent) {
        console.error('❌ [MultiAgentRouting] Agent not found:', agentId);
        throw new Error(`Agent not found: ${agentId}`);
      }

      console.log('🔍 [MultiAgentRouting] Step 3: Agent details:', {
        id: agent.identity?.id || agent.key || agent.id,
        name: agent.identity?.name || agent.name,
        type: agent.type,
        provider: agent.provider
      });

      // 🔧 CRITICAL FIX: Build complete conversation history for multi-agent context
      console.log('🔍 [MultiAgentRouting] Step 4: Building complete conversation history...');
      
      let enhancedMessage = message;
      
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        console.log('📚 [MultiAgentRouting] Found conversation history with', context.conversationHistory.length, 'messages');
        
        // Build conversation context that includes all previous messages from all agents
        const conversationContext = context.conversationHistory
          .map(msg => {
            if (msg.role === 'user') {
              return `User: ${msg.content}`;
            } else {
              const agentName = msg.agentName || `Agent ${msg.agentId}`;
              return `${agentName}: ${msg.content}`;
            }
          })
          .join('\n\n');
        
        // Enhance the message with full conversation context
        enhancedMessage = `Previous conversation:\n${conversationContext}\n\nCurrent message:\nUser: ${message}`;
        
        console.log('✅ [MultiAgentRouting] Enhanced message with conversation context. Total length:', enhancedMessage.length);
        console.log('📝 [MultiAgentRouting] Conversation context preview:', conversationContext.substring(0, 200) + '...');
      } else {
        console.log('📝 [MultiAgentRouting] No conversation history available, using message as-is');
      }

      // 🎭 ROLE ENHANCEMENT: Add temporary role context if assigned
      console.log('🔍 [MultiAgentRouting] Step 4.5: Checking for temporary role assignments...');
      
      try {
        const sessionId = context.conversationId; // Use conversation ID as session ID
        const enhancedPrompt = await temporaryRoleService.getEnhancedSystemPrompt(agentId, sessionId);
        
        if (enhancedPrompt) {
          console.log('🎭 [MultiAgentRouting] Found temporary role assignment for agent:', agentId);
          console.log('📝 [MultiAgentRouting] Role context preview:', enhancedPrompt.substring(0, 200) + '...');
          
          // Prepend role context to the enhanced message
          enhancedMessage = `${enhancedPrompt}\n\n${enhancedMessage}`;
          
          console.log('✅ [MultiAgentRouting] Enhanced message with role context. Total length:', enhancedMessage.length);
        } else {
          console.log('📝 [MultiAgentRouting] No temporary role assignment found for agent:', agentId);
        }
      } catch (error) {
        console.warn('⚠️ [MultiAgentRouting] Failed to get role enhancement:', error);
        // Continue without role enhancement
      }

      console.log('🔍 [MultiAgentRouting] Step 5: About to call agent API with enhanced context...');
      
      // Call the actual agent API with enhanced conversation context
      const response = await this.callAgentAPI(agent, enhancedMessage, context);

      console.log('🔍 [MultiAgentRouting] Step 6: Got response from callAgentAPI, length:', response.length);

      const processingTime = Date.now() - startTime;

      return {
        agentId,
        agentName: agent.identity?.name || agent.name || 'AI Agent',
        response,
        timestamp: new Date(),
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ [MultiAgentRouting] Error in getAgentResponse:', {
        agentId,
        step: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        chatbotServiceExists: !!this.chatbotService,
        chatbotServiceType: typeof this.chatbotService,
        getChatbotByIdExists: this.chatbotService && typeof this.chatbotService.getChatbotById === 'function'
      });
      
      // Try to get more details about the chatbot service
      if (this.chatbotService) {
        console.error('🔍 [MultiAgentRouting] ChatbotService debug:', {
          hasGetChatbotById: typeof this.chatbotService.getChatbotById,
          hasGetChatbot: typeof this.chatbotService.getChatbot,
          serviceConstructor: this.chatbotService.constructor.name
        });
      }
      
      return {
        agentId,
        agentName: agentId,
        response: 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Call the actual agent API
   */
  private async callAgentAPI(
    agent: ChatbotProfile,
    message: string,
    context: RoutingContext
  ): Promise<string> {
    const agentName = agent.identity?.name || agent.name || 'AI Agent';
    const agentId = agent.identity?.id || agent.key || agent.id;
    
    console.log('📡 [MultiAgentRouting] Calling real agent API:', agentName, 'ID:', agentId);

    try {
      // Import the ChatPanelGovernanceService dynamically to avoid circular dependencies
      const { ChatPanelGovernanceService } = await import('./ChatPanelGovernanceService');
      const chatService = ChatPanelGovernanceService.getInstance();

      // Add multi-agent context to the message
      const multiAgentContext = this.buildMultiAgentContext(context);
      const enhancedMessage = `${multiAgentContext}\n\nUser message: ${message}`;

      console.log('🔧 [MultiAgentRouting] Enhanced message for agent:', enhancedMessage.substring(0, 200) + '...');

      // CRITICAL FIX: Ensure guest agents maintain their governance wrapper
      // Instead of looking only in current chat service, check for ANY existing governed session
      console.log('🔧 [MultiAgentRouting] Looking for existing governed session for agent:', agentId);
      
      // Try to get existing session first from current chat service
      let session = null;
      const activeSessions = (chatService as any).activeSessions;
      
      if (activeSessions) {
        // Find existing session for this agent
        for (const [sessionId, sessionData] of activeSessions.entries()) {
          if (sessionData.agentId === agentId) {
            session = sessionData;
            console.log('✅ [MultiAgentRouting] Found existing session in current service:', sessionId);
            break;
          }
        }
      }
      
      // CRITICAL: If no session found in current service, check for global governed sessions
      if (!session) {
        console.log('🔍 [MultiAgentRouting] No session in current service, checking for global governed sessions...');
        
        // Try to find if this agent has an existing governed session anywhere
        // This ensures guest agents don't lose their governance wrapper
        try {
          // Check if agent has existing governance context
          const { UniversalGovernanceAdapter } = await import('./UniversalGovernanceAdapter');
          const universalGovernance = UniversalGovernanceAdapter.getInstance();
          
          // Load the agent's existing governance configuration
          const existingConfig = await universalGovernance.loadCompleteAgentConfiguration(agentId, 'multi-agent-routing');
          
          if (existingConfig) {
            console.log('✅ [MultiAgentRouting] Found existing governance config for agent:', agentId);
            console.log('🛡️ [MultiAgentRouting] Agent has governance wrapper - preserving it');
            
            // Create a new session that inherits the existing governance context
            session = await chatService.startChatSession(agent);
            
            if (session) {
              // Mark this session as inheriting governance from existing wrapper
              session.inheritedGovernance = true;
              session.originalGovernanceConfig = existingConfig;
              console.log('✅ [MultiAgentRouting] Created new session with inherited governance:', session.sessionId);
            }
          }
        } catch (error) {
          console.warn('⚠️ [MultiAgentRouting] Failed to check for existing governance:', error);
        }
      }
      
      // Only create completely new session if no existing governance found
      if (!session) {
        console.log('🔧 [MultiAgentRouting] No existing governance found, creating new session for agent:', agentId);
        session = await chatService.startChatSession(agent);
        
        if (!session) {
          console.error('❌ [MultiAgentRouting] Failed to start session for agent:', agentId);
          throw new Error(`Failed to start chat session for agent: ${agentId}`);
        }
        console.log('✅ [MultiAgentRouting] New session created:', session.sessionId);
      } else {
        console.log('✅ [MultiAgentRouting] Using existing governed session:', session.sessionId);
      }

      // Send message to the real agent
      console.log('📡 [MultiAgentRouting] Sending message to agent:', agentId, 'session:', session.sessionId);
      const response = await chatService.sendMessage(session.sessionId, enhancedMessage);
      
      console.log('📡 [MultiAgentRouting] Raw response from agent:', agentId, response);
      
      if (!response) {
        console.error('❌ [MultiAgentRouting] No response object from agent:', agentId);
        throw new Error(`No response received from agent: ${agentId}`);
      }
      
      if (!response.content) {
        console.error('❌ [MultiAgentRouting] No content in response from agent:', agentId, 'Response:', response);
        throw new Error(`Empty response content from agent: ${agentId}`);
      }

      console.log('✅ [MultiAgentRouting] Got real response from agent:', agentId, 'Content length:', response.content.length);
      return response.content;

    } catch (error) {
      console.error('❌ [MultiAgentRouting] Error calling agent API:', agentName, error);
      console.error('❌ [MultiAgentRouting] Error details:', {
        agentId,
        agentName,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback to a contextual error message
      throw new Error(`${agentName} is currently unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build context information for multi-agent conversations
   */
  private buildMultiAgentContext(context: RoutingContext): string {
    const guestNames = context.guestAgents.map(g => g.name).join(', ');
    
    return `Multi-agent conversation context:
- Host Agent: ${context.hostAgentId}
- Guest Agents: ${guestNames}
- Conversation ID: ${context.conversationId}
- You are participating in a collaborative discussion with other AI agents.
- Provide your unique perspective and expertise.
- Be concise but insightful.`;
  }

  /**
   * Get all available agents in the conversation
   */
  private async getAvailableAgents(context: RoutingContext): Promise<Array<{id: string, name: string}>> {
    const agents: Array<{id: string, name: string}> = [];

    try {
      console.log('🔍 [MultiAgentRouting] Getting available agents for context:', context);
      
      // Add host agent
      const hostAgent = await this.chatbotService.getChatbot(context.hostAgentId);
      console.log('🔍 [MultiAgentRouting] Host agent:', hostAgent);
      
      if (hostAgent) {
        const hostAgentData = {
          id: hostAgent.identity?.id || hostAgent.key || hostAgent.id,
          name: hostAgent.identity?.name || hostAgent.name || 'Host Agent'
        };
        console.log('🔍 [MultiAgentRouting] Adding host agent:', hostAgentData);
        agents.push(hostAgentData);
      }

      // Add guest agents
      console.log('🔍 [MultiAgentRouting] Guest agents in context:', context.guestAgents);
      for (const guest of context.guestAgents) {
        const guestAgentData = {
          id: guest.agentId,
          name: guest.name
        };
        console.log('🔍 [MultiAgentRouting] Adding guest agent:', guestAgentData);
        agents.push(guestAgentData);
      }
      
      console.log('🔍 [MultiAgentRouting] Final available agents:', agents);
    } catch (error) {
      console.error('❌ [MultiAgentRouting] Error getting available agents:', error);
    }

    return agents;
  }

  /**
   * Check if an agent is currently processing a message
   */
  public isAgentBusy(agentId: string): boolean {
    return this.responseQueue.has(agentId);
  }

  /**
   * Get all busy agents
   */
  public getBusyAgents(): string[] {
    return Array.from(this.responseQueue.keys());
  }

  /**
   * Clear all pending responses (emergency stop)
   */
  public clearAllResponses(): void {
    console.log('🛑 [MultiAgentRouting] Clearing all pending responses');
    this.responseQueue.clear();
  }

  /**
   * Generate mention suggestions for autocomplete
   */
  public async generateMentionSuggestions(
    partialMention: string,
    context: RoutingContext
  ): Promise<Array<{id: string, name: string, suggestion: string}>> {
    const availableAgents = await this.getAvailableAgents(context);
    return this.messageParser.generateMentionSuggestions(partialMention, availableAgents);
  }
}

export default MultiAgentRoutingService;

