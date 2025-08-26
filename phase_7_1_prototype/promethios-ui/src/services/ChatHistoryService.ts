/**
 * ChatHistoryService - Simple service for chat history management
 * Temporary implementation to fix import errors
 */

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'assistant';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

class ChatHistoryService {
  private static instance: ChatHistoryService;
  private sessions: ChatSession[] = [];

  private constructor() {
    // Initialize with mock data
    this.sessions = [];
  }

  static getInstance(): ChatHistoryService {
    if (!ChatHistoryService.instance) {
      ChatHistoryService.instance = new ChatHistoryService();
    }
    return ChatHistoryService.instance;
  }

  async getAllSessions(): Promise<ChatSession[]> {
    return this.sessions;
  }

  async getSession(id: string): Promise<ChatSession | null> {
    return this.sessions.find(s => s.id === id) || null;
  }

  async saveSession(session: ChatSession): Promise<void> {
    const index = this.sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      this.sessions[index] = session;
    } else {
      this.sessions.push(session);
    }
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== id);
  }

  // Add the missing method that the enhanced page expects
  async getUserChatHistory(userId: string): Promise<ChatSession[]> {
    // Return empty array for now - this would connect to real chat history in production
    return [];
  }
}

export default ChatHistoryService;
export { ChatHistoryService };
export const chatHistoryService = ChatHistoryService.getInstance();
