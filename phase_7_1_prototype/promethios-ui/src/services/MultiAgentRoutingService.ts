/**
 * MultiAgentRoutingService - Handles selective routing of messages to specific AI agents
 * Part of the revolutionary multi-agent collaboration system
 */

import { MessageParser, ParsedMessage } from '../utils/MessageParser';
import { ChatbotStorageService } from './ChatbotStorageService';
import { ChatbotProfile } from '../types/ChatbotProfile';

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
}

export class MultiAgentRoutingService {
  private static instance: MultiAgentRoutingService;
  private messageParser: MessageParser;
  private chatbotService: ChatbotStorageService;
  private responseQueue: Map<string, Promise<AgentResponse>> = new Map();

  private constructor() {
    this.messageParser = MessageParser.getInstance();
    this.chatbotService = ChatbotStorageService.getInstance();
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

    // Determine target agents
    const targetAgents = this.messageParser.getTargetAgentIds(parsedMessage, availableAgents);
    console.log('🎯 [MultiAgentRouting] Target agents:', targetAgents);

    // Check if we should wait for user prompt or respond immediately
    const shouldWaitForUserPrompt = !parsedMessage.hasAgentMentions;

    let responses: AgentResponse[] | undefined;

    if (parsedMessage.hasAgentMentions && targetAgents.length > 0) {
      console.log('🎯 [MultiAgentRouting] Routing to mentioned agents:', targetAgents);
      
      // Route to mentioned agents immediately
      responses = await this.routeToAgents(
        parsedMessage.cleanMessage || parsedMessage.originalMessage,
        targetAgents,
        context
      );
    } else if (!parsedMessage.hasAgentMentions) {
      console.log('🎯 [MultiAgentRouting] No @mentions found - only host agent will respond');
      
      // Only route to host agent when no mentions
      responses = await this.routeToAgents(
        message,
        [context.hostAgentId],
        context
      );
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

    // Prevent simultaneous responses by queuing
    const responses: AgentResponse[] = [];
    
    for (const agentId of agentIds) {
      try {
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
      // Get agent profile
      const agent = await this.chatbotService.getChatbotById(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Simulate agent response (replace with actual agent API call)
      const response = await this.callAgentAPI(agent, message, context);

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
   * Call the actual agent API (placeholder for now)
   */
  private async callAgentAPI(
    agent: ChatbotProfile,
    message: string,
    context: RoutingContext
  ): Promise<string> {
    console.log('📡 [MultiAgentRouting] Calling agent API:', agent.identity?.name);

    // Add multi-agent context to the message
    const multiAgentContext = this.buildMultiAgentContext(context);
    const enhancedMessage = `${multiAgentContext}\n\nUser message: ${message}`;

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate contextual response based on agent type
    const agentName = agent.identity?.name || 'AI Agent';
    const responses = [
      `Hi! I'm ${agentName}. Based on your message, here's my perspective: ${message}`,
      `${agentName} here. I think we should consider: ${message}`,
      `From ${agentName}'s viewpoint: ${message} - let me analyze this further.`,
      `${agentName} responding: I have some thoughts on "${message}" that might be helpful.`,
      `This is ${agentName}. Regarding "${message}", I'd like to add my perspective.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
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
      // Add host agent
      const hostAgent = await this.chatbotService.getChatbotById(context.hostAgentId);
      if (hostAgent) {
        agents.push({
          id: hostAgent.identity?.id || hostAgent.key || hostAgent.id,
          name: hostAgent.identity?.name || hostAgent.name || 'Host Agent'
        });
      }

      // Add guest agents
      for (const guest of context.guestAgents) {
        agents.push({
          id: guest.agentId,
          name: guest.name
        });
      }
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

