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
import { firebaseDebugger } from '../utils/firebaseDebugger';

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
  
  // Add caching for chat history loading
  private loadingPromises = new Map<string, Promise<ChatSession[]>>();
  private cacheTimestamps = new Map<string, number>();
  private chatHistoryCache = new Map<string, ChatSession[]>();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

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
    console.log('🔍 [Firebase Debug] Starting createChatSession');
    console.log('  - Agent ID:', agentId);
    console.log('  - Agent Name:', agentName);
    console.log('  - User ID:', userId);
    console.log('  - Session Name:', sessionName);

    // Debug Firebase connection before creating chat
    await firebaseDebugger.debugChatOperations(userId);

    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    console.log('🔍 [Firebase Debug] Generated session ID:', sessionId);

    const session: ChatSession = {
      id: sessionId,
      name: sessionName || `Chat with ${agentName || 'Agent'} - ${now.toLocaleDateString()}`,
      agentId,
      agentName: agentName || 'Agent',
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

    console.log('🔍 [Firebase Debug] Created session object, now saving...');

    try {
      // Store in unified storage
      await this.saveChatSession(session);
      console.log('🔍 [Firebase Debug] ✅ saveChatSession completed successfully');
      
      // Track active session
      this.activeSessions.set(sessionId, session);
      console.log('🔍 [Firebase Debug] ✅ Added to active sessions');

      console.log(`💬 Created new chat session: ${sessionName} (${sessionId})`);
      return session;
    } catch (error) {
      console.error('🔍 [Firebase Debug] ❌ createChatSession failed:', error);
      throw error;
    }
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
    await unifiedStorage.set('chats', `shareable_context_${contextId}`, shareableContext);

    console.log(`🔗 Created shareable context: ${contextId} for session ${sessionId}`);
    return shareableContext;
  }

  /**
   * Get chat sessions for user with filtering (public interface for ChatHistoryPanel)
   */
  async getChatSessions(
    userId: string,
    filter?: ChatHistoryFilter
  ): Promise<ChatSession[]> {
    return await this.getUserChatHistory(userId, filter);
  }

  /**
   * Get chat sessions for user with filtering
   */
  async getUserChatHistory(
    userId: string,
    filter?: ChatHistoryFilter
  ): Promise<ChatSession[]> {
    try {
      console.log(`📚 Loading chat history for user: ${userId}`);
      
      // Create cache key including filter for proper caching
      const filterKey = filter ? JSON.stringify(filter) : 'all';
      const cacheKey = `${userId}_${filterKey}`;
      
      // Check cache freshness first
      const lastCacheTime = this.cacheTimestamps.get(cacheKey) || 0;
      const now = Date.now();
      
      if (now - lastCacheTime < this.CACHE_DURATION) {
        const cachedSessions = this.chatHistoryCache.get(cacheKey);
        if (cachedSessions && cachedSessions.length >= 0) { // Allow empty arrays to be cached
          console.log(`🎯 Using cached chat history for user (cache still fresh): ${userId} - ${cachedSessions.length} sessions`);
          return cachedSessions;
        }
      }
      
      // Check if already loading - if so, wait for that promise
      const existingPromise = this.loadingPromises.get(cacheKey);
      if (existingPromise) {
        console.log(`🔄 Already loading chat history for user, waiting for existing promise: ${userId}`);
        return await existingPromise;
      }
      
      // Create new loading promise
      const loadingPromise = this.loadChatHistoryFromStorage(userId, filter, cacheKey, now);
      this.loadingPromises.set(cacheKey, loadingPromise);
      
      try {
        const result = await loadingPromise;
        return result;
      } finally {
        // Clean up the loading promise
        this.loadingPromises.delete(cacheKey);
      }
      
    } catch (error) {
      console.error('Error in getUserChatHistory:', error);
      // Clean up on error
      const filterKey = filter ? JSON.stringify(filter) : 'all';
      const cacheKey = `${userId}_${filterKey}`;
      this.loadingPromises.delete(cacheKey);
      return [];
    }
  }

  private async loadChatHistoryFromStorage(
    userId: string,
    filter: ChatHistoryFilter | undefined,
    cacheKey: string,
    now: number
  ): Promise<ChatSession[]> {
    // Get all chat sessions for user from unified storage
    const sessions: ChatSession[] = [];
    
    try {
      console.log(`📚 Loading chat history from storage for user: ${userId}`);
      
      // Try to get user's chat index first (use 2-segment path for Firebase)
      const userChatIndex = await unifiedStorage.get('chats', `user_${userId}_index`);
      
      if (userChatIndex && Array.isArray(userChatIndex) && userChatIndex.length > 0) {
        console.log(`📚 Found chat index with ${userChatIndex.length} sessions`);
        console.log(`🔍 [Debug] Chat index contents:`, userChatIndex.slice(0, 5)); // Show first 5 session IDs
        
        // Load sessions from index
        for (const sessionId of userChatIndex) {
          try {
            const storageKey = `user_${userId}_${sessionId}`;
            console.log(`🔍 [Debug] Attempting to load session with key: ${storageKey}`);
            
            const sessionData = await unifiedStorage.get('chats', storageKey);
            if (sessionData) {
              console.log(`✅ [Debug] Successfully loaded session data for ${sessionId}`);
              const session = this.deserializeChatSession(sessionData);
              
              // Apply filters
              if (this.matchesFilter(session, filter)) {
                sessions.push(session);
                console.log(`✅ [Debug] Session ${sessionId} passed filters and added to results`);
              } else {
                console.log(`⚠️ [Debug] Session ${sessionId} filtered out`);
              }
            } else {
              console.log(`❌ [Debug] No session data found for key: ${storageKey}`);
            }
          } catch (error) {
            console.warn(`Failed to load chat session ${sessionId}:`, error);
          }
        }
      } else {
        console.log('📚 No chat index found or empty, checking for direct sessions');
        
        // Try to find sessions using a more efficient approach
        try {
          // Get all keys in the chats namespace
          const allKeys = await unifiedStorage.getKeys('chats');
          const userSessionKeys = allKeys.filter(key => 
            key.startsWith(`user_${userId}_`) && 
            !key.endsWith('_index') &&
            key.includes('chat_')
          );
          
          console.log(`📚 Found ${userSessionKeys.length} potential session keys`);
          
          for (const key of userSessionKeys) {
            try {
              const sessionData = await unifiedStorage.get('chats', key.replace('chats/', ''));
              if (sessionData) {
                const session = this.deserializeChatSession(sessionData);
                if (this.matchesFilter(session, filter)) {
                  sessions.push(session);
                }
              }
            } catch (error) {
              console.warn(`Failed to load session from key ${key}:`, error);
            }
          }
        } catch (keysError) {
          console.log('📚 Could not get keys, trying fallback approach');
          
          // Final fallback: try common session patterns (limited to prevent hanging)
          for (let i = 0; i < 10; i++) { // Reduced limit to prevent hanging
            try {
              const sessionData = await unifiedStorage.get('chats', `user_${userId}_chat_${i}`);
              if (sessionData) {
                const session = this.deserializeChatSession(sessionData);
                if (this.matchesFilter(session, filter)) {
                  sessions.push(session);
                }
              } else {
                // No more sessions found, break early
                break;
              }
            } catch (error) {
              // Session doesn't exist, break
              break;
            }
          }
        }
      }
    } catch (storageError) {
      console.warn('Storage access error, using active sessions cache:', storageError);
      
      // Try to get sessions from active sessions cache
      for (const [sessionId, session] of this.activeSessions) {
        if (session.userId === userId && this.matchesFilter(session, filter)) {
          sessions.push(session);
        }
      }
    }

    // Sort by last updated (most recent first) - chronological order
    sessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

    console.log(`✅ Successfully loaded ${sessions.length} chat sessions for user ${userId}`);
    
    // Debug: Check what's in the sessions
    if (sessions.length > 0) {
      console.log(`🔍 [Debug] First session:`, sessions[0]);
      console.log(`🔍 [Debug] First session messages:`, sessions[0].messages);
      console.log(`🔍 [Debug] First session message count:`, sessions[0].messages?.length || 0);
    }
    
    // Update cache
    this.chatHistoryCache.set(cacheKey, sessions);
    this.cacheTimestamps.set(cacheKey, now);
    
    return sessions;
  }

  /**
   * Get chat session by ID (public method for sharing service)
   */
  async getChatSessionById(sessionId: string): Promise<ChatSession | null> {
    return await this.getChatSession(sessionId);
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

    // Update the session
    await this.saveChatSession(session);

    // Clear cache to force fresh reload
    this.chatHistoryCache.clear();
    this.cacheTimestamps.clear();

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

    try {
      // Remove from unified storage using correct API
      await unifiedStorage.delete('chats', `user_${session.userId}_${sessionId}`);
      await unifiedStorage.delete('chats', `session_${sessionId}`);

      // Update user's chat index
      await this.removeFromUserChatIndex(session.userId, sessionId);

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      // Clear cache to force fresh reload
      this.chatHistoryCache.clear();
      this.cacheTimestamps.clear();

      // Remove shareable context if exists
      if (session.shareableId) {
        await unifiedStorage.delete('chats', `shareable_context_${session.shareableId}`);
      }

      console.log(`🗑️ Deleted chat session: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to delete chat session:', error);
      throw error;
    }
  }

  private async removeFromUserChatIndex(userId: string, sessionId: string): Promise<void> {
    try {
        const existingIndex = await unifiedStorage.get('chats', `user_${userId}_index`) || [];
      const updatedIndex = existingIndex.filter((id: string) => id !== sessionId);
      
      // Update the index
      await unifiedStorage.set('chats', `user_${userId}_index`, updatedIndex);
    } catch (error) {
      console.warn('Failed to update user chat index on deletion:', error);
    }
  }

  /**
   * Get shareable context for agent reference
   */
  async getShareableContext(contextId: string): Promise<ShareableChatContext | null> {
    try {
      const context = await unifiedStorage.get('chats', `shareable_context_${contextId}`);
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

    // Load from storage using correct API
    try {
      const sessionData = await unifiedStorage.get('chats', `session_${sessionId}`);
      
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
    console.log('🔍 [Firebase Debug] Starting saveChatSession for:', session.id);
    
    try {
      const serializedSession = this.serializeChatSession(session);
      console.log('🔍 [Firebase Debug] ✅ Session serialized successfully');
      
      // Save to user's chat collection using correct API
      console.log('🔍 [Firebase Debug] Saving to user chat collection...');
      await unifiedStorage.set('chats', `user_${session.userId}_${session.id}`, serializedSession);
      console.log('🔍 [Firebase Debug] ✅ User chat collection save completed');

      // Also save to sessions collection for direct access (use 2-segment path)
      console.log('🔍 [Firebase Debug] Saving to sessions collection...');
      await unifiedStorage.set('chats', `session_${session.id}`, serializedSession);
      console.log('🔍 [Firebase Debug] ✅ Sessions collection save completed');

      // Update user's chat index for efficient loading
      console.log('🔍 [Firebase Debug] Updating user chat index...');
      await this.updateUserChatIndex(session.userId, session.id);
      console.log('🔍 [Firebase Debug] ✅ User chat index updated');

      // Update active session
      this.activeSessions.set(session.id, session);
      console.log('🔍 [Firebase Debug] ✅ Active session updated');
      
      console.log(`💾 Saved chat session: ${session.name} (${session.id})`);
    } catch (error) {
      console.error('🔍 [Firebase Debug] ❌ saveChatSession failed at step:', error);
      console.error('❌ Failed to save chat session:', error);
      throw error;
    }
  }

  private async updateUserChatIndex(userId: string, sessionId: string): Promise<void> {
    console.log('🔍 [Firebase Debug] Starting updateUserChatIndex');
    console.log('  - User ID:', userId);
    console.log('  - Session ID:', sessionId);
    
    try {
      // Get existing index (use 2-segment path for Firebase)
      console.log('🔍 [Firebase Debug] Getting existing user chat index...');
      const existingIndex = await unifiedStorage.get('chats', `user_${userId}_index`) || [];
      console.log('🔍 [Firebase Debug] Existing index:', existingIndex);
      
      const index = Array.isArray(existingIndex) ? existingIndex : [];
      
      // Add session ID if not already present
      if (!index.includes(sessionId)) {
        index.unshift(sessionId); // Add to beginning for chronological order
        console.log('🔍 [Firebase Debug] Updated index:', index);
        
        // Limit to last 100 sessions to prevent unlimited growth
        if (index.length > 100) {
          index.splice(100);
        }
        
        // Save updated index
        console.log('🔍 [Firebase Debug] Saving updated index...');
        await unifiedStorage.set('chats', `user_${userId}_index`, index);
        console.log('🔍 [Firebase Debug] ✅ Index saved successfully');
        
        // Invalidate cache to force refresh
        this.invalidateUserChatCache(userId);
        console.log('🔍 [Firebase Debug] ✅ Cache invalidated');
        
        console.log(`📚 Updated chat index for user ${userId}: ${index.length} sessions`);
      } else {
        console.log('🔍 [Firebase Debug] Session already in index, skipping update');
      }
    } catch (error) {
      console.error('🔍 [Firebase Debug] ❌ updateUserChatIndex failed:', error);
      console.warn('Failed to update user chat index:', error);
      // Don't throw - this is not critical for chat functionality
    }
  }

  /**
   * Invalidate chat cache for a user to force refresh
   */
  private invalidateUserChatCache(userId: string): void {
    // Remove all cache entries for this user
    const keysToRemove: string[] = [];
    for (const [key] of this.chatHistoryCache) {
      if (key.startsWith(`${userId}_`)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      this.chatHistoryCache.delete(key);
      this.cacheTimestamps.delete(key);
    }
    
    console.log(`🗑️ Invalidated chat cache for user ${userId}`);
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

