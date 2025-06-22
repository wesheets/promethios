/**
 * Basic message service for chat functionality
 */

import { Message } from '../types';

export class MessageService {
  private messages: Message[] = [];
  private apiBaseUrl = process.env.REACT_APP_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

  addMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    this.messages.push(newMessage);
    return newMessage;
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
  }

  removeMessage(messageId: string): void {
    this.messages = this.messages.filter(msg => msg.id !== messageId);
  }

  async sendMessageToAgent(
    agentId: string, 
    message: string, 
    governanceEnabled: boolean = false
  ): Promise<{
    success: boolean;
    response?: string;
    governance_data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/benchmark/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          message: message,
          governance_enabled: governanceEnabled
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          response: data.response,
          governance_data: data.governance_data
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('Error sending message to agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async sendMessageToMultiAgent(
    message: string,
    agentIds: string[],
    coordinationPattern: string = 'sequential',
    governanceEnabled: boolean = false
  ): Promise<{
    success: boolean;
    responses?: Array<{
      agent_id: string;
      response: string;
    }>;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/benchmark/multi-agent-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_ids: agentIds,
          message: message,
          coordination_pattern: coordinationPattern,
          governance_enabled: governanceEnabled
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          responses: data.responses
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('Error sending message to multi-agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }
}

export const messageService = new MessageService();

