/**
 * Ad-hoc Multi-Agent Service for coordinating multiple agents
 */

import { Agent, AdHocMultiAgentConfig } from '../types';

export interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  confidence?: number;
}

export interface MultiAgentConversation {
  id: string;
  userMessage: string;
  responses: AgentResponse[];
  coordinationPattern: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Date;
}

export class AdHocMultiAgentService {
  private conversations: MultiAgentConversation[] = [];
  private activeAgents: Agent[] = [];

  setActiveAgents(agents: Agent[]): void {
    this.activeAgents = agents.filter(agent => agent.status === 'online');
  }

  getActiveAgents(): Agent[] {
    return [...this.activeAgents];
  }

  async startMultiAgentConversation(
    userMessage: string,
    config: AdHocMultiAgentConfig
  ): Promise<MultiAgentConversation> {
    const conversation: MultiAgentConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userMessage,
      responses: [],
      coordinationPattern: config.coordinationPattern,
      status: 'processing',
      createdAt: new Date()
    };

    this.conversations.push(conversation);

    try {
      // Process based on coordination pattern
      switch (config.coordinationPattern) {
        case 'sequential':
          await this.processSequential(conversation, config.agents);
          break;
        case 'parallel':
          await this.processParallel(conversation, config.agents);
          break;
        case 'hierarchical':
          await this.processHierarchical(conversation, config.agents);
          break;
        default:
          throw new Error(`Unknown coordination pattern: ${config.coordinationPattern}`);
      }

      conversation.status = 'completed';
    } catch (error) {
      conversation.status = 'error';
      console.error('Multi-agent conversation error:', error);
    }

    return conversation;
  }

  private async processSequential(
    conversation: MultiAgentConversation,
    agents: Agent[]
  ): Promise<void> {
    let context = conversation.userMessage;

    for (const agent of agents) {
      const response = await this.getAgentResponse(agent, context);
      conversation.responses.push(response);
      
      // Add previous response to context for next agent
      context += `\n\n${agent.name} responded: ${response.content}`;
    }
  }

  private async processParallel(
    conversation: MultiAgentConversation,
    agents: Agent[]
  ): Promise<void> {
    const responsePromises = agents.map(agent => 
      this.getAgentResponse(agent, conversation.userMessage)
    );

    const responses = await Promise.all(responsePromises);
    conversation.responses.push(...responses);
  }

  private async processHierarchical(
    conversation: MultiAgentConversation,
    agents: Agent[]
  ): Promise<void> {
    // Sort agents by governance score (higher score = higher priority)
    const sortedAgents = [...agents].sort((a, b) => 
      (b.governanceScore || 0) - (a.governanceScore || 0)
    );

    // Primary agent responds first
    if (sortedAgents.length > 0) {
      const primaryResponse = await this.getAgentResponse(
        sortedAgents[0], 
        conversation.userMessage
      );
      conversation.responses.push(primaryResponse);

      // Secondary agents can review and add to the primary response
      const secondaryAgents = sortedAgents.slice(1);
      if (secondaryAgents.length > 0) {
        const reviewContext = `${conversation.userMessage}\n\nPrimary response from ${sortedAgents[0].name}: ${primaryResponse.content}\n\nPlease review and add your perspective:`;
        
        const reviewPromises = secondaryAgents.map(agent =>
          this.getAgentResponse(agent, reviewContext)
        );

        const reviewResponses = await Promise.all(reviewPromises);
        conversation.responses.push(...reviewResponses);
      }
    }
  }

  private async getAgentResponse(agent: Agent, message: string): Promise<AgentResponse> {
    // Simulate agent processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simulate different agent personalities and responses
    const responses = this.generateAgentResponse(agent, message);

    return {
      agentId: agent.id,
      agentName: agent.name,
      content: responses,
      timestamp: new Date(),
      confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
    };
  }

  private generateAgentResponse(agent: Agent, message: string): string {
    // Simple response generation based on agent characteristics
    const baseResponses = [
      `Based on my analysis of "${message.substring(0, 50)}...", I believe`,
      `From my perspective as ${agent.name}, I would suggest`,
      `Considering the context of your message, my recommendation is`,
      `After processing your request, I think`,
      `My assessment of this situation indicates`
    ];

    const endings = [
      'this approach would be most effective.',
      'we should consider multiple factors here.',
      'there are several viable solutions to explore.',
      'this requires careful consideration of the implications.',
      'the best path forward involves collaborative effort.'
    ];

    const baseResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];
    const ending = endings[Math.floor(Math.random() * endings.length)];

    return `${baseResponse} ${ending}`;
  }

  getConversation(id: string): MultiAgentConversation | undefined {
    return this.conversations.find(conv => conv.id === id);
  }

  getAllConversations(): MultiAgentConversation[] {
    return [...this.conversations];
  }

  clearConversations(): void {
    this.conversations = [];
  }
}

export const adHocMultiAgentService = new AdHocMultiAgentService();

