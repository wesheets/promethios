/**
 * Client-Side Chat Service for Promethios
 * 
 * This service bypasses the backend and directly calls the Promethios API
 * using the generated API keys, similar to how deployed agents work.
 */

export interface ClientChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ClientChatSession {
  sessionId: string;
  agentId: string;
  agentName: string;
  apiKey: string;
  messages: ClientChatMessage[];
  createdAt: string;
}

class ClientChatService {
  private sessions: Map<string, ClientChatSession> = new Map();

  /**
   * Create a new chat session with an agent
   */
  createSession(agentId: string, agentName: string, apiKey: string): ClientChatSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ClientChatSession = {
      sessionId,
      agentId,
      agentName,
      apiKey,
      messages: [],
      createdAt: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);
    console.log('🎯 Created client-side chat session:', sessionId);
    
    return session;
  }

  /**
   * Get an existing chat session
   */
  getSession(sessionId: string): ClientChatSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Send a message to the agent using the Promethios API
   */
  async sendMessage(sessionId: string, userMessage: string): Promise<ClientChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    console.log('💬 Sending message to agent:', userMessage);

    // Add user message to session
    const userMsg: ClientChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    session.messages.push(userMsg);

    try {
      // Call the Promethios API directly
      const response = await fetch('https://api.promethios.ai/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.apiKey}`
        },
        body: JSON.stringify({
          prompt: userMessage,
          agent_id: session.agentId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Promethios API error:', response.status, errorText);
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Received response from Promethios API:', result);

      // Add assistant response to session
      const assistantMsg: ClientChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: result.response || result.content || 'No response received',
        timestamp: new Date().toISOString()
      };
      session.messages.push(assistantMsg);

      return assistantMsg;

    } catch (error) {
      console.error('❌ Error calling Promethios API:', error);
      
      // Add error message to session
      const errorMsg: ClientChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date().toISOString()
      };
      session.messages.push(errorMsg);

      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string): ClientChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }

  /**
   * Clear conversation history for a session
   */
  clearConversationHistory(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = [];
      console.log('🧹 Cleared conversation history for session:', sessionId);
    }
  }

  /**
   * Delete a chat session
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log('🗑️ Deleted chat session:', sessionId);
    }
    return deleted;
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): ClientChatSession[] {
    return Array.from(this.sessions.values());
  }
}

// Export singleton instance
export const clientChatService = new ClientChatService();
export default clientChatService;

