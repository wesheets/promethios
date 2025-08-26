/**
 * ChatSharingService - Simple service for chat sharing management
 * Temporary implementation to fix import errors
 */

export interface SharedChat {
  id: string;
  chatId: string;
  shareUrl: string;
  isPublic: boolean;
  createdAt: string;
  expiresAt?: string;
}

class ChatSharingService {
  private static instance: ChatSharingService;
  private sharedChats: SharedChat[] = [];

  private constructor() {
    // Initialize with mock data
    this.sharedChats = [];
  }

  static getInstance(): ChatSharingService {
    if (!ChatSharingService.instance) {
      ChatSharingService.instance = new ChatSharingService();
    }
    return ChatSharingService.instance;
  }

  async shareChat(chatId: string, isPublic: boolean = false): Promise<SharedChat> {
    const sharedChat: SharedChat = {
      id: `share_${Date.now()}`,
      chatId,
      shareUrl: `https://example.com/shared/${chatId}`,
      isPublic,
      createdAt: new Date().toISOString()
    };
    
    this.sharedChats.push(sharedChat);
    return sharedChat;
  }

  async getSharedChat(id: string): Promise<SharedChat | null> {
    return this.sharedChats.find(s => s.id === id) || null;
  }

  async revokeShare(id: string): Promise<void> {
    this.sharedChats = this.sharedChats.filter(s => s.id !== id);
  }

  async getAllSharedChats(): Promise<SharedChat[]> {
    return this.sharedChats;
  }
}

export default ChatSharingService;
export { ChatSharingService };
