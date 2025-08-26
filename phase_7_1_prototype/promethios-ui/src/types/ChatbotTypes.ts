/**
 * ChatbotTypes - Type definitions for chatbot-related interfaces
 * Re-exports from ChatbotStorageService for backward compatibility
 */

export { 
  ChatbotProfile,
  DeploymentChannel,
  AutomationRule,
  ResponseTemplate 
} from '../services/ChatbotStorageService';

// Additional chatbot-specific types can be added here
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

