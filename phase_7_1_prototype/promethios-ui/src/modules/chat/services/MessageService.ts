/**
 * Basic message service for chat functionality
 */

import { Message } from '../types';

export class MessageService {
  private messages: Message[] = [];

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
}

export const messageService = new MessageService();

