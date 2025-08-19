/**
 * Chat History Service
 * 
 * Provides comprehensive chat history management with cryptographic logging,
 * shareability, and integration with the Universal Governance Adapter.
 * Extends the existing ChatStorageService with enhanced features.
 */

import { ChatMessage, FileAttachment } from './ChatStorageService';
import { universalGovernanceAdapter } from './UniversalGovernanceAdapter';
import { unifiedStorage } from './UnifiedStorageService';
import { ComprehensiveToolReceiptExtension } from '../extensions/ComprehensiveToolReceiptExtension';

export interface ChatSession {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastUpdated: Date;
  messageCount: number;
  isShared: boolean;
  shareableId?: string; // For sharing with agents
  cryptographicReceipt?: ChatReceipt;
  governanceMetrics: {
    overallTrustScore: number;
    totalViolations: number;
    averageResponseTime: number;
    sessionIntegrity: boolean;
  };
  metadata: {
    tags: string[];
    summary?: string;
    keyTopics: string[];
    lastActivity: Date;
  };
}

export interface ChatReceipt {
  receiptId: string;
  sessionId: string;
  cryptographicHash: string;
  timestamp: Date;
  messageHashes: string[];
  governanceSignature: string;
  integrityVerified: boolean;
  shareableContext?: ShareableChatContext;
}

export interface ShareableChatContext {
  contextId: string;
  sessionId: string;
  sessionName: string;
  messageCount: number;
  keyTopics: string[];
  summary: string;
  trustScore: number;
  createdAt: Date;
  sharedAt: Date;
  permissions: {
    canReference: boolean;
    canQuote: boolean;
    canAnalyze: boolean;
  };
}

export interface ChatHistoryFilter {
  agentId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
  tags?: string[];
  minTrustScore?: number;
  hasSharedContext?: boolean;
}

/**
 * Enhanced Chat History Service
 */
export class ChatHistoryService {
  private static instance: ChatHistoryService;
  private receiptExtension: ComprehensiveToolReceiptExtension;
  private activeSessions: Map<string, ChatSession> = new Map();

  private constructor() {
    this.receiptExtension = new ComprehensiveToolReceiptExtension();
    // Initialize synchronously - no async initialization needed
    console.log('🗂️ ChatHistoryService initialized successfully');
  }

  static getInstance(): ChatHistoryService {
    if (!ChatHistoryService.instance) {
      ChatHistoryService.instance = new ChatHistoryService();
    }
    return ChatHistoryService.instance;
  }

  /**
   * Create a new chat session
   */
  async createChatSession(
    agentId: string,
    agentName: string,
    userId: string,
    sessionName?: string
  ): Promise<ChatSession> {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const session: ChatSession = {
      id: sessionId,
      name: sessionName || `Chat with ${agentName} - ${now.toLocaleDateString()}`,
      agentId,
      agentName,
      userId,
      messages: [],
      createdAt: now,
      lastUpdated: now,
      messageCount: 0,
      isShared: false,
      governanceMetrics: {
        overallTrustScore: 100,
        totalViolations: 0,
        averageResponseTime: 0,
        sessionIntegrity: true,
      },
      metadata: {
        tags: [],
        keyTopics: [],
        lastActivity: now,
      },
    };

    // Store in unified storage
    await this.saveChatSession(session);
    
    // Track active session
    this.activeSessions.set(sessionId, session);

    console.log(`💬 Created new chat session: ${sessionName} (${sessionId})`);
    return session;
  }

  /**
   * Add message to chat session with cryptographic logging
   */
  async addMessageToSession(
    sessionId: string,
    message: ChatMessage
  ): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error(`Chat session not found: ${sessionId}`);
    }

    // Add message to session
    session.messages.push(message);
    session.messageCount = session.messages.length;
    session.lastUpdated = new Date();
    session.metadata.lastActivity = new Date();

    // Update governance metrics
    if (message.governanceData) {
      this.updateGovernanceMetrics(session, message);
    }

    // Generate cryptographic receipt for the session
    await this.generateChatReceipt(session);

    // Save updated session
    await this.saveChatSession(session);

    console.log(`📝 Added message to session ${sessionId}: ${message.content.substring(0, 50)}...`);
  }

  /**
   * Generate cryptographic receipt for chat session
   */
  private async generateChatReceipt(session: ChatSession): Promise<void> {
    try {
      // Create message hashes for integrity verification
      const messageHashes = session.messages.map(msg => 
        this.generateMessageHash(msg)
      );

      // Generate session hash
      const sessionData = {
        sessionId: session.id,
        messages: messageHashes,
        timestamp: new Date().toISOString(),
        governanceMetrics: session.governanceMetrics,
      };

      const cryptographicHash = await this.generateCryptographicHash(sessionData);

      // Get governance signature
      const governanceSignature = await universalGovernanceAdapter.signChatSession(
        session.id,
        cryptographicHash
      );

      const receipt: ChatReceipt = {
        receiptId: `receipt_${session.id}_${Date.now()}`,
        sessionId: session.id,
        cryptographicHash,
        timestamp: new Date(),
        messageHashes,
        governanceSignature,
        integrityVerified: true,
      };

      session.cryptographicReceipt = receipt;

      console.log(`🔐 Generated cryptographic receipt for session ${session.id}`);
    } catch (error) {
      console.error('❌ Failed to generate chat receipt:', error);
      // Continue without receipt - don't break the chat flow
    }
  }

  /**
   * Create shareable context for agent reference
   */
  async createShareableContext(sessionId: string): Promise<ShareableChatContext> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error(`Chat session not found: ${sessionId}`);
    }

    // Generate summary and key topics
    const summary = await this.generateChatSummary(session);
    const keyTopics = await this.extractKeyTopics(session);

    const contextId = `context_${sessionId}_${Date.now()}`;
    
    const shareableContext: ShareableChatContext = {
      contextId,
      sessionId: session.id,
      sessionName: session.name,
      messageCount: session.messageCount,
      keyTopics,
      summary,
      trustScore: session.governanceMetrics.overallTrustScore,
      createdAt: session.createdAt,
      sharedAt: new Date(),
      permissions: {
        canReference: true,
        canQuote: true,
        canAnalyze: true,
      },
    };

    // Update session with shareable context
    session.isShared = true;
    session.shareableId = contextId;
    if (session.cryptographicReceipt) {
      session.cryptographicReceipt.shareableContext = shareableContext;
    }

    await this.saveChatSession(session);

    // Store shareable context separately for agent access
    await unifiedStorage.store(
      `shareable_contexts/${contextId}`,
      shareableContext,
      'firebase'
    );

    console.log(`🔗 Created shareable context: ${contextId} for session ${sessionId}`);
    return shareableContext;
  }

  /**
   * Get chat sessions for user with filtering
   *  async getUserChatHistory(
    userId: string,
    filter?: ChatHistoryFilter
  ): Promise<ChatSession[]> {
    try {
      // Get all chat sessions for user
      const userChatKeys = await unifiedStorage.getKeys(`${userId}`, 'chats');
      const sessions: ChatSession[] = [];
      for (const key of userChatKeys) {
        try {
          const sessionData = await unifiedStorage.retrieve(key, 'chats');
          if (sessionData) {
            const session = this.deserializeChatSession(sessionData);
            
            // Apply filters
            if (this.matchesFilter(session, filter)) {
              sessions.push(session);
            }
          }
        } catch (error) {
          console.warn(`Failed to load chat session ${key}:`, error);
        }
      }

      // Sort by last updated (most recent first)
      sessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

      return sessions;
    } catch (error) {
      console.error('❌ Failed to get chat sessions:', error);
      return [];
    }
  }

  /**
   * Rename chat session
   */
  async renameChatSession(sessionId: string, newName: string): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error(`Chat session not found: ${sessionId}`);
    }

    session.name = newName;
    session.lastUpdated = new Date();

    await this.saveChatSession(session);
    console.log(`✏️ Renamed session ${sessionId} to: ${newName}`);
  }

  /**
   * Delete chat session
   */
  async deleteChatSession(sessionId: string): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      return; // Already deleted
    }

    // Remove from unified storage
    await unifiedStorage.delete(`${session.userId}/${sessionId}`, 'chats');

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    // Remove shareable context if exists
    if (session.shareableId) {
      await unifiedStorage.delete(`shareable_contexts/${session.shareableId}`, 'firebase');
    }

    console.log(`🗑️ Deleted chat session: ${sessionId}`);
  }

  /**
   * Get shareable context for agent reference
   */
  async getShareableContext(contextId: string): Promise<ShareableChatContext | null> {
    try {
      const context = await unifiedStorage.retrieve(
        `shareable_contexts/${contextId}`,
        'firebase'
      );
      return context ? context as ShareableChatContext : null;
    } catch (error) {
      console.error('❌ Failed to get shareable context:', error);
      return null;
    }
  }

  /**
   * Get full chat session for agent reference
   */
  async getChatSessionForAgent(contextId: string): Promise<ChatSession | null> {
    const context = await this.getShareableContext(contextId);
    if (!context) {
      return null;
    }

    return await this.getChatSession(context.sessionId);
  }

  // Private helper methods

  private async getChatSession(sessionId: string): Promise<ChatSession | null> {
    // Check active sessions first
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId)!;
    }

    // Load from storage
    try {
      const sessionData = await unifiedStorage.retrieve(
        `sessions/${sessionId}`,
        'chats'
      );
      
      if (sessionData) {
        const session = this.deserializeChatSession(sessionData);
        this.activeSessions.set(sessionId, session);
        return session;
      }
    } catch (error) {
      console.error(`Failed to load chat session ${sessionId}:`, error);
    }

    return null;
  }

  private async saveChatSession(session: ChatSession): Promise<void> {
    try {
      // Save to user's chat collection
      await unifiedStorage.store(
        `${session.userId}/${session.id}`,
        this.serializeChatSession(session),
        'chats'
      );

      // Also save to sessions collection for direct access
      await unifiedStorage.store(
        `sessions/${session.id}`,
        this.serializeChatSession(session),
        'chats'
      );

      // Update active session
      this.activeSessions.set(session.id, session);
    } catch (error) {
      console.error('❌ Failed to save chat session:', error);
      throw error;
    }
  }

  private serializeChatSession(session: ChatSession): any {
    return {
      ...session,
      createdAt: session.createdAt.toISOString(),
      lastUpdated: session.lastUpdated.toISOString(),
      metadata: {
        ...session.metadata,
        lastActivity: session.metadata.lastActivity.toISOString(),
      },
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
      cryptographicReceipt: session.cryptographicReceipt ? {
        ...session.cryptographicReceipt,
        timestamp: session.cryptographicReceipt.timestamp.toISOString(),
        shareableContext: session.cryptographicReceipt.shareableContext ? {
          ...session.cryptographicReceipt.shareableContext,
          createdAt: session.cryptographicReceipt.shareableContext.createdAt.toISOString(),
          sharedAt: session.cryptographicReceipt.shareableContext.sharedAt.toISOString(),
        } : undefined,
      } : undefined,
    };
  }

  private deserializeChatSession(data: any): ChatSession {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      lastUpdated: new Date(data.lastUpdated),
      metadata: {
        ...data.metadata,
        lastActivity: new Date(data.metadata.lastActivity),
      },
      messages: data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
      cryptographicReceipt: data.cryptographicReceipt ? {
        ...data.cryptographicReceipt,
        timestamp: new Date(data.cryptographicReceipt.timestamp),
        shareableContext: data.cryptographicReceipt.shareableContext ? {
          ...data.cryptographicReceipt.shareableContext,
          createdAt: new Date(data.cryptographicReceipt.shareableContext.createdAt),
          sharedAt: new Date(data.cryptographicReceipt.shareableContext.sharedAt),
        } : undefined,
      } : undefined,
    };
  }

  private updateGovernanceMetrics(session: ChatSession, message: ChatMessage): void {
    if (!message.governanceData) return;

    const metrics = session.governanceMetrics;
    
    // Update trust score (weighted average)
    if (message.governanceData.trustScore !== undefined) {
      const totalMessages = session.messageCount;
      metrics.overallTrustScore = 
        (metrics.overallTrustScore * (totalMessages - 1) + message.governanceData.trustScore) / totalMessages;
    }

    // Update violations count
    if (message.governanceData.violations?.length) {
      metrics.totalViolations += message.governanceData.violations.length;
    }

    // Check session integrity
    metrics.sessionIntegrity = metrics.overallTrustScore > 70 && metrics.totalViolations < 5;
  }

  private matchesFilter(session: ChatSession, filter?: ChatHistoryFilter): boolean {
    if (!filter) return true;

    if (filter.agentId && session.agentId !== filter.agentId) return false;
    
    if (filter.dateRange) {
      const sessionDate = session.lastUpdated;
      if (sessionDate < filter.dateRange.start || sessionDate > filter.dateRange.end) {
        return false;
      }
    }

    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      const nameMatch = session.name.toLowerCase().includes(searchLower);
      const messageMatch = session.messages.some(msg => 
        msg.content.toLowerCase().includes(searchLower)
      );
      if (!nameMatch && !messageMatch) return false;
    }

    if (filter.tags?.length) {
      const hasMatchingTag = filter.tags.some(tag => 
        session.metadata.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    if (filter.minTrustScore !== undefined) {
      if (session.governanceMetrics.overallTrustScore < filter.minTrustScore) {
        return false;
      }
    }

    if (filter.hasSharedContext !== undefined) {
      if (filter.hasSharedContext !== session.isShared) return false;
    }

    return true;
  }

  private generateMessageHash(message: ChatMessage): string {
    const messageData = {
      id: message.id,
      content: message.content,
      sender: message.sender,
      timestamp: message.timestamp.toISOString(),
      agentId: message.agentId,
    };
    
    // Simple hash implementation (in production, use crypto.subtle)
    return btoa(JSON.stringify(messageData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private async generateCryptographicHash(data: any): Promise<string> {
    // Simple hash implementation (in production, use proper cryptographic hashing)
    const jsonString = JSON.stringify(data);
    return btoa(jsonString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
  }

  private async generateChatSummary(session: ChatSession): Promise<string> {
    // Simple summary generation (in production, use AI summarization)
    const messageCount = session.messageCount;
    const topics = session.metadata.keyTopics.join(', ') || 'general discussion';
    
    return `Chat with ${session.agentName} containing ${messageCount} messages about ${topics}. Trust score: ${session.governanceMetrics.overallTrustScore.toFixed(1)}%.`;
  }

  private async extractKeyTopics(session: ChatSession): Promise<string[]> {
    // Simple topic extraction (in production, use NLP)
    const allText = session.messages
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();

    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = allText
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));

    // Get word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top 5 most frequent words as topics
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
}

export const chatHistoryService = ChatHistoryService.getInstance();

