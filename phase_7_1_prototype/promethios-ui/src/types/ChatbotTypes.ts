/**
 * ChatbotTypes - Type definitions for chatbot-related interfaces
 */

// Re-export only ChatbotProfile to avoid circular imports
export type { ChatbotProfile } from '../services/ChatbotStorageService';

// Additional chatbot-specific types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  attachments?: File[];
  metadata?: any;
}

export interface ChatSession {
  sessionId: string;
  chatbotId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messages: ChatMessage[];
  status: 'active' | 'completed' | 'abandoned';
}

