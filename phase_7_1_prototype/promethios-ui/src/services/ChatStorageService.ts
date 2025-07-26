import { UserAgentStorageService, AgentProfile } from './UserAgentStorageService';
import { governanceService, GovernanceMetrics, GovernanceSession } from './GovernanceService';
import { UnifiedStorageService } from './UnifiedStorageService';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system' | 'error';
  timestamp: Date;
  agentName?: string;
  agentId?: string;
  attachments?: FileAttachment[];
  governanceData?: {
    trustScore?: number;
    violations?: any[];
    approved?: boolean;
  };
  shadowGovernanceData?: {
    trustScore?: number;
    violations?: any[];
    approved?: boolean;
    shadowMode?: boolean;
    shadowMessage?: string;
    behaviorTags?: string[];
    transparencyMessage?: string;
    governanceDisabled?: boolean;
    fallbackMode?: boolean;
    error?: string;
  };
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  data?: string;
}

export interface AgentChatHistory {
  agentId: string;
  agentName: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastUpdated: Date;
  messageCount: number;
  governanceMetrics: {
    overallTrustScore: number;
    totalViolations: number;
    complianceRate: number;
    sessionCount: number;
    lastSessionDate: Date;
  };
}

export interface ChatSession {
  sessionId: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  governanceSession?: GovernanceSession;
}

export class ChatStorageService {
  private userAgentService: UserAgentStorageService;
  private unifiedStorage: UnifiedStorageService;
  private currentUserId: string | null = null;
  private currentSession: ChatSession | null = null;

  constructor() {
    this.userAgentService = new UserAgentStorageService();
    this.unifiedStorage = UnifiedStorageService.getInstance();
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
    this.userAgentService.setCurrentUser(userId);
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // Initialize chat session with an agent
  async initializeChatSession(agent: AgentProfile, governanceEnabled: boolean = false): Promise<ChatSession> {
    if (!this.currentUserId) {
      throw new Error('User not set');
    }

    const sessionId = `chat_${agent.identity.id}_${Date.now()}`;
    
    this.currentSession = {
      sessionId,
      agentId: agent.identity.id,
      startTime: new Date(),
      messageCount: 0
    };

    // Initialize governance session if enabled
    if (governanceEnabled) {
      try {
        const governanceSession = await governanceService.initializeSession(agent);
        this.currentSession.governanceSession = governanceSession;
      } catch (error) {
        console.error('Failed to initialize governance session:', error);
      }
    }

    return this.currentSession;
  }

  // Load chat history for a specific agent
  async loadAgentChatHistory(agentId: string): Promise<AgentChatHistory | null> {
    if (!this.currentUserId) {
      throw new Error('User not set');
    }

    try {
      const chatHistoryKey = `chat_history_${agentId}`;
      const history = await this.unifiedStorage.get('singleAgentChats', chatHistoryKey);
      
      if (!history) {
        return null;
      }

      console.log(`✅ Chat history loaded from Firebase for agent: ${agentId}`);
      
      // Convert date strings back to Date objects
      return {
        ...history,
        createdAt: new Date(history.createdAt),
        lastUpdated: new Date(history.lastUpdated),
        governanceMetrics: {
          ...history.governanceMetrics,
          lastSessionDate: new Date(history.governanceMetrics.lastSessionDate)
        },
        messages: history.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error) {
      console.error('Error loading chat history:', error);
      return null;
    }
  }

  // Save message to agent's chat history
  async saveMessage(message: ChatMessage, agentId: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not set');
    }

    try {
      let chatHistory = await this.loadAgentChatHistory(agentId);
      
      if (!chatHistory) {
        // Create new chat history for this agent
        const agent = await this.userAgentService.getAgent(agentId);
        if (!agent) {
          throw new Error('Agent not found');
        }

        chatHistory = {
          agentId,
          agentName: agent.identity.name,
          messages: [],
          createdAt: new Date(),
          lastUpdated: new Date(),
          messageCount: 0,
          governanceMetrics: {
            overallTrustScore: 85,
            totalViolations: 0,
            complianceRate: 100,
            sessionCount: 0,
            lastSessionDate: new Date()
          }
        };
      }

      // Add message to history
      chatHistory.messages.push(message);
      chatHistory.messageCount = chatHistory.messages.length;
      chatHistory.lastUpdated = new Date();

      // Update session count
      if (this.currentSession) {
        this.currentSession.messageCount++;
      }

      // Save to Firebase via UnifiedStorageService (persistent for testing)
      const chatHistoryKey = `chat_history_${agentId}`;
      
      try {
        await this.unifiedStorage.set('singleAgentChats', chatHistoryKey, chatHistory);
        console.log(`✅ Chat history saved to Firebase for agent: ${agentId}`);
      } catch (storageError: any) {
        console.error('Failed to save chat history to Firebase:', storageError);
        // Don't throw error - continue with backend sync as fallback
      }

      // Also save to backend if available (additional backup)
      await this.syncToBackend(chatHistory);

    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Update governance metrics for an agent
  async updateGovernanceMetrics(agentId: string, metrics: Partial<GovernanceMetrics>): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not set');
    }

    try {
      const chatHistory = await this.loadAgentChatHistory(agentId);
      if (!chatHistory) return;

      // Update governance metrics
      if (metrics.trustScore !== undefined) {
        chatHistory.governanceMetrics.overallTrustScore = metrics.trustScore;
      }
      
      if (metrics.policyViolations !== undefined) {
        chatHistory.governanceMetrics.totalViolations += metrics.policyViolations;
      }

      // Recalculate compliance rate
      const totalMessages = chatHistory.messageCount;
      const violationRate = chatHistory.governanceMetrics.totalViolations / Math.max(totalMessages, 1);
      chatHistory.governanceMetrics.complianceRate = Math.max(0, (1 - violationRate) * 100);

      chatHistory.governanceMetrics.lastSessionDate = new Date();
      chatHistory.lastUpdated = new Date();

      // Save updated history
      const chatHistoryKey = `chat_history_${agentId}`;
      await this.unifiedStorage.set('singleAgentChats', chatHistoryKey, chatHistory);
      console.log(`✅ Governance metrics updated and saved to Firebase for agent: ${agentId}`);

      await this.syncToBackend(chatHistory);

    } catch (error) {
      console.error('Error updating governance metrics:', error);
    }
  }

  // Get all agent chat histories for current user
  async getAllAgentChatHistories(): Promise<AgentChatHistory[]> {
    if (!this.currentUserId) {
      throw new Error('User not set');
    }

    try {
      const agents = await this.userAgentService.loadUserAgents();
      if (!agents) return [];

      const histories: AgentChatHistory[] = [];
      
      for (const agent of agents) {
        const history = await this.loadAgentChatHistory(agent.identity.id);
        if (history) {
          histories.push(history);
        }
      }

      return histories;
    } catch (error) {
      console.error('Error loading all chat histories:', error);
      return [];
    }
  }

  // Clear chat history for an agent
  async clearAgentChatHistory(agentId: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not set');
    }

    try {
      const chatHistoryKey = `chat_history_${agentId}`;
      await this.unifiedStorage.delete('singleAgentChats', chatHistoryKey);
      console.log(`✅ Chat history cleared from Firebase for agent: ${agentId}`);
      
      // Also clear from backend
      await this.clearFromBackend(agentId);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }

  // End current chat session
  async endChatSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.currentSession.endTime = new Date();

      // End governance session if active
      if (this.currentSession.governanceSession) {
        await governanceService.endSession();
      }

      // Update session count in chat history
      const chatHistory = await this.loadAgentChatHistory(this.currentSession.agentId);
      if (chatHistory) {
        chatHistory.governanceMetrics.sessionCount++;
        chatHistory.governanceMetrics.lastSessionDate = new Date();
        
        const chatHistoryKey = `chat_history_${this.currentSession.agentId}`;
        await this.unifiedStorage.set('singleAgentChats', chatHistoryKey, chatHistory);
        console.log(`✅ Session ended and saved to Firebase for agent: ${this.currentSession.agentId}`);

        await this.syncToBackend(chatHistory);
      }

    } catch (error) {
      console.error('Error ending chat session:', error);
    } finally {
      this.currentSession = null;
    }
  }

  // Get current session
  getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  // Sync chat history to backend (placeholder for backend integration)
  private async syncToBackend(chatHistory: AgentChatHistory): Promise<void> {
    try {
      // In production, this would sync to your backend API
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.currentUserId,
          chatHistory
        })
      });

      if (!response.ok) {
        console.warn('Failed to sync chat history to backend');
      }
    } catch (error) {
      // Fail silently - localStorage is the primary storage for now
      console.warn('Backend sync failed, using local storage only');
    }
  }

  // Clear chat history from backend
  private async clearFromBackend(agentId: string): Promise<void> {
    try {
      await fetch(`/api/chat/history/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.currentUserId
        })
      });
    } catch (error) {
      console.warn('Failed to clear chat history from backend');
    }
  }

  // Get chat statistics for dashboard
  async getChatStatistics(): Promise<{
    totalAgentsWithHistory: number;
    totalMessages: number;
    averageTrustScore: number;
    totalViolations: number;
    mostActiveAgent: string | null;
  }> {
    try {
      const histories = await this.getAllAgentChatHistories();
      
      if (histories.length === 0) {
        return {
          totalAgentsWithHistory: 0,
          totalMessages: 0,
          averageTrustScore: 0,
          totalViolations: 0,
          mostActiveAgent: null
        };
      }

      const totalMessages = histories.reduce((sum, h) => sum + h.messageCount, 0);
      const totalViolations = histories.reduce((sum, h) => sum + h.governanceMetrics.totalViolations, 0);
      const averageTrustScore = histories.reduce((sum, h) => sum + h.governanceMetrics.overallTrustScore, 0) / histories.length;
      
      const mostActiveAgent = histories.reduce((prev, current) => 
        prev.messageCount > current.messageCount ? prev : current
      ).agentName;

      return {
        totalAgentsWithHistory: histories.length,
        totalMessages,
        averageTrustScore: Math.round(averageTrustScore),
        totalViolations,
        mostActiveAgent
      };
    } catch (error) {
      console.error('Error getting chat statistics:', error);
      return {
        totalAgentsWithHistory: 0,
        totalMessages: 0,
        averageTrustScore: 0,
        totalViolations: 0,
        mostActiveAgent: null
      };
    }
  }
}

export const chatStorageService = new ChatStorageService();

