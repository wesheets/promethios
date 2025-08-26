/**
 * ChatbotStorageService - Simple service for chatbot profile management
 * Temporary implementation to fix import errors
 */

export interface ChatbotProfile {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  lastActive: string;
  conversations: number;
  successRate: number;
}

class ChatbotStorageService {
  private static instance: ChatbotStorageService;
  private profiles: ChatbotProfile[] = [];

  private constructor() {
    // Initialize with mock data
    this.profiles = [
      {
        id: '1',
        name: 'Claude Assistant',
        description: 'AI Assistant for general tasks',
        status: 'active',
        lastActive: '2 minutes ago',
        conversations: 45,
        successRate: 94
      }
    ];
  }

  static getInstance(): ChatbotStorageService {
    if (!ChatbotStorageService.instance) {
      ChatbotStorageService.instance = new ChatbotStorageService();
    }
    return ChatbotStorageService.instance;
  }

  async getAllProfiles(): Promise<ChatbotProfile[]> {
    return this.profiles;
  }

  async getProfile(id: string): Promise<ChatbotProfile | null> {
    return this.profiles.find(p => p.id === id) || null;
  }

  async saveProfile(profile: ChatbotProfile): Promise<void> {
    const index = this.profiles.findIndex(p => p.id === profile.id);
    if (index >= 0) {
      this.profiles[index] = profile;
    } else {
      this.profiles.push(profile);
    }
  }

  async deleteProfile(id: string): Promise<void> {
    this.profiles = this.profiles.filter(p => p.id !== id);
  }
}

export default ChatbotStorageService;
export { ChatbotProfile, ChatbotStorageService };
