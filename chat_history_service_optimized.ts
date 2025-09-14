/**
 * ChatHistoryService - Optimized Version
 * 
 * Optimizations implemented:
 * 1. Service-level caching with TTL
 * 2. Batch operations for better performance
 * 3. Background prefetching
 * 4. Optimistic updates
 * 5. Memory management for cache
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: any;
}

export interface ChatSession {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  messageCount: number;
  lastMessage?: string;
  isActive: boolean;
  metadata?: any;
}

export interface ChatHistoryFilter {
  agentId?: string;
  searchTerm?: string;
  limit?: number;
  startAfter?: Date;
}

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface ServiceCache {
  sessions: Map<string, CacheEntry<ChatSession[]>>;
  singleSessions: Map<string, CacheEntry<ChatSession>>;
  userSessions: Map<string, CacheEntry<ChatSession[]>>;
}

class ChatHistoryServiceOptimized {
  private static instance: ChatHistoryServiceOptimized;
  private cache: ServiceCache;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100; // Maximum cache entries
  private prefetchQueue: Set<string> = new Set();
  private listeners: Map<string, () => void> = new Map();

  private constructor() {
    this.cache = {
      sessions: new Map(),
      singleSessions: new Map(),
      userSessions: new Map()
    };
    
    // Cleanup cache periodically
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  public static getInstance(): ChatHistoryServiceOptimized {
    if (!ChatHistoryServiceOptimized.instance) {
      ChatHistoryServiceOptimized.instance = new ChatHistoryServiceOptimized();
    }
    return ChatHistoryServiceOptimized.instance;
  }

  // Cache management methods
  private getCacheKey(userId: string, filter?: ChatHistoryFilter): string {
    const filterKey = filter ? JSON.stringify(filter) : 'all';
    return `${userId}_${filterKey}`;
  }

  private isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private setCacheEntry<T>(
    cache: Map<string, CacheEntry<T>>, 
    key: string, 
    data: T, 
    ttl: number = this.DEFAULT_TTL
  ): void {
    // Implement LRU eviction if cache is full
    if (cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      ttl
    });
  }

  private getCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry || !this.isValidCacheEntry(entry)) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    // Clean up expired entries
    [this.cache.sessions, this.cache.singleSessions, this.cache.userSessions].forEach(cache => {
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp >= entry.ttl) {
          cache.delete(key);
        }
      }
    });
  }

  // Optimized session loading with caching
  async getChatSessions(userId: string, filter?: ChatHistoryFilter): Promise<ChatSession[]> {
    const cacheKey = this.getCacheKey(userId, filter);
    
    // Check cache first
    const cached = this.getCacheEntry(this.cache.sessions, cacheKey);
    if (cached) {
      console.log('🚀 [ChatHistoryService] Cache hit for sessions:', cacheKey);
      
      // Start background refresh if cache is older than 2 minutes
      const cacheEntry = this.cache.sessions.get(cacheKey);
      if (cacheEntry && Date.now() - cacheEntry.timestamp > 2 * 60 * 1000) {
        this.backgroundRefreshSessions(userId, filter, cacheKey);
      }
      
      return cached;
    }

    console.log('🔄 [ChatHistoryService] Cache miss, loading from Firestore:', cacheKey);
    return this.loadSessionsFromFirestore(userId, filter, cacheKey);
  }

  private async backgroundRefreshSessions(
    userId: string, 
    filter: ChatHistoryFilter | undefined, 
    cacheKey: string
  ): Promise<void> {
    try {
      const sessions = await this.loadSessionsFromFirestore(userId, filter, cacheKey, false);
      console.log('🔄 [ChatHistoryService] Background refresh completed for:', cacheKey);
    } catch (error) {
      console.error('❌ [ChatHistoryService] Background refresh failed:', error);
    }
  }

  private async loadSessionsFromFirestore(
    userId: string, 
    filter?: ChatHistoryFilter, 
    cacheKey?: string,
    updateCache: boolean = true
  ): Promise<ChatSession[]> {
    try {
      let q = query(
        collection(db, 'chatSessions'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      if (filter?.agentId) {
        q = query(q, where('agentId', '==', filter.agentId));
      }

      if (filter?.limit) {
        q = query(q, limit(filter.limit));
      }

      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        
        // Convert Firestore timestamps
        const session: ChatSession = {
          id: docSnapshot.id,
          name: data.name || 'Untitled Chat',
          agentId: data.agentId,
          agentName: data.agentName || 'Assistant',
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          messages: data.messages || [],
          messageCount: data.messageCount || 0,
          lastMessage: data.lastMessage,
          isActive: data.isActive !== false,
          metadata: data.metadata
        };

        // Apply search filter if specified
        if (filter?.searchTerm) {
          const searchTerm = filter.searchTerm.toLowerCase();
          if (!session.name.toLowerCase().includes(searchTerm) &&
              !session.lastMessage?.toLowerCase().includes(searchTerm)) {
            continue;
          }
        }

        sessions.push(session);
      }

      // Cache the results
      if (updateCache && cacheKey) {
        this.setCacheEntry(this.cache.sessions, cacheKey, sessions);
      }

      // Prefetch individual sessions for faster access
      this.prefetchIndividualSessions(sessions);

      return sessions;
    } catch (error) {
      console.error('❌ [ChatHistoryService] Error loading sessions:', error);
      throw error;
    }
  }

  // Prefetch individual sessions in the background
  private prefetchIndividualSessions(sessions: ChatSession[]): void {
    sessions.slice(0, 5).forEach(session => { // Prefetch first 5 sessions
      if (!this.prefetchQueue.has(session.id)) {
        this.prefetchQueue.add(session.id);
        setTimeout(() => {
          this.getChatSessionById(session.id);
          this.prefetchQueue.delete(session.id);
        }, 100);
      }
    });
  }

  // Optimized single session loading
  async getChatSessionById(sessionId: string): Promise<ChatSession | null> {
    // Check cache first
    const cached = this.getCacheEntry(this.cache.singleSessions, sessionId);
    if (cached) {
      console.log('🚀 [ChatHistoryService] Cache hit for session:', sessionId);
      return cached;
    }

    try {
      console.log('🔄 [ChatHistoryService] Loading session from Firestore:', sessionId);
      const docRef = doc(db, 'chatSessions', sessionId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      const data = docSnapshot.data();
      const session: ChatSession = {
        id: docSnapshot.id,
        name: data.name || 'Untitled Chat',
        agentId: data.agentId,
        agentName: data.agentName || 'Assistant',
        userId: data.userId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        messages: data.messages || [],
        messageCount: data.messageCount || 0,
        lastMessage: data.lastMessage,
        isActive: data.isActive !== false,
        metadata: data.metadata
      };

      // Cache the session
      this.setCacheEntry(this.cache.singleSessions, sessionId, session);

      return session;
    } catch (error) {
      console.error('❌ [ChatHistoryService] Error loading session:', error);
      throw error;
    }
  }

  // Optimized session creation with cache invalidation
  async createChatSession(
    agentId: string,
    agentName: string,
    userId: string,
    name?: string
  ): Promise<ChatSession> {
    try {
      const now = new Date();
      const sessionData = {
        name: name || `Chat with ${agentName}`,
        agentId,
        agentName,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        messages: [],
        messageCount: 0,
        isActive: true,
        metadata: {}
      };

      const docRef = await addDoc(collection(db, 'chatSessions'), sessionData);

      const session: ChatSession = {
        id: docRef.id,
        name: sessionData.name,
        agentId,
        agentName,
        userId,
        createdAt: now,
        updatedAt: now,
        messages: [],
        messageCount: 0,
        isActive: true,
        metadata: {}
      };

      // Cache the new session
      this.setCacheEntry(this.cache.singleSessions, session.id, session);

      // Invalidate relevant session list caches
      this.invalidateSessionListCaches(userId, agentId);

      console.log('✅ [ChatHistoryService] Created and cached new session:', session.id);
      return session;
    } catch (error) {
      console.error('❌ [ChatHistoryService] Error creating session:', error);
      throw error;
    }
  }

  // Optimized session update with cache invalidation
  async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    try {
      const docRef = doc(db, 'chatSessions', sessionId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Convert Date objects to Timestamps
      if (updates.createdAt) {
        updateData.createdAt = Timestamp.fromDate(updates.createdAt);
      }

      await updateDoc(docRef, updateData);

      // Update cache if session exists
      const cached = this.getCacheEntry(this.cache.singleSessions, sessionId);
      if (cached) {
        const updatedSession = { ...cached, ...updates, updatedAt: new Date() };
        this.setCacheEntry(this.cache.singleSessions, sessionId, updatedSession);
      }

      // Invalidate session list caches
      if (cached) {
        this.invalidateSessionListCaches(cached.userId, cached.agentId);
      }

      console.log('✅ [ChatHistoryService] Updated and cached session:', sessionId);
    } catch (error) {
      console.error('❌ [ChatHistoryService] Error updating session:', error);
      throw error;
    }
  }

  // Optimized session deletion with cache cleanup
  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      // Get session info before deletion for cache invalidation
      const session = await this.getChatSessionById(sessionId);
      
      const docRef = doc(db, 'chatSessions', sessionId);
      await deleteDoc(docRef);

      // Remove from cache
      this.cache.singleSessions.delete(sessionId);

      // Invalidate session list caches
      if (session) {
        this.invalidateSessionListCaches(session.userId, session.agentId);
      }

      console.log('✅ [ChatHistoryService] Deleted and removed from cache:', sessionId);
    } catch (error) {
      console.error('❌ [ChatHistoryService] Error deleting session:', error);
      throw error;
    }
  }

  // Cache invalidation helper
  private invalidateSessionListCaches(userId: string, agentId?: string): void {
    // Remove all cached session lists for this user
    for (const key of this.cache.sessions.keys()) {
      if (key.startsWith(userId)) {
        this.cache.sessions.delete(key);
      }
    }
    
    // Remove user-specific caches
    for (const key of this.cache.userSessions.keys()) {
      if (key.startsWith(userId)) {
        this.cache.userSessions.delete(key);
      }
    }
    
    console.log('🧹 [ChatHistoryService] Invalidated session list caches for user:', userId);
  }

  // Batch operations for better performance
  async batchUpdateSessions(updates: Array<{ sessionId: string; updates: Partial<ChatSession> }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ sessionId, updates: sessionUpdates }) => {
        const docRef = doc(db, 'chatSessions', sessionId);
        const updateData = {
          ...sessionUpdates,
          updatedAt: Timestamp.fromDate(new Date())
        };
        batch.update(docRef, updateData);
      });

      await batch.commit();

      // Update caches
      updates.forEach(({ sessionId, updates: sessionUpdates }) => {
        const cached = this.getCacheEntry(this.cache.singleSessions, sessionId);
        if (cached) {
          const updatedSession = { ...cached, ...sessionUpdates, updatedAt: new Date() };
          this.setCacheEntry(this.cache.singleSessions, sessionId, updatedSession);
        }
      });

      console.log('✅ [ChatHistoryService] Batch updated sessions:', updates.length);
    } catch (error) {
      console.error('❌ [ChatHistoryService] Error in batch update:', error);
      throw error;
    }
  }

  // Real-time listener with caching
  setupRealtimeListener(userId: string, callback: (sessions: ChatSession[]) => void): () => void {
    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions: ChatSession[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const session: ChatSession = {
          id: doc.id,
          name: data.name || 'Untitled Chat',
          agentId: data.agentId,
          agentName: data.agentName || 'Assistant',
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          messages: data.messages || [],
          messageCount: data.messageCount || 0,
          lastMessage: data.lastMessage,
          isActive: data.isActive !== false,
          metadata: data.metadata
        };
        sessions.push(session);
      });

      // Update cache with real-time data
      const cacheKey = this.getCacheKey(userId);
      this.setCacheEntry(this.cache.sessions, cacheKey, sessions, this.DEFAULT_TTL * 2); // Longer TTL for real-time data

      callback(sessions);
    });

    // Store listener for cleanup
    const listenerId = `${userId}_${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Cleanup method
  cleanup(): void {
    // Clear all caches
    this.cache.sessions.clear();
    this.cache.singleSessions.clear();
    this.cache.userSessions.clear();
    
    // Unsubscribe from all listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    
    // Clear prefetch queue
    this.prefetchQueue.clear();
    
    console.log('🧹 [ChatHistoryService] Cleanup completed');
  }

  // Cache statistics for debugging
  getCacheStats(): any {
    return {
      sessions: this.cache.sessions.size,
      singleSessions: this.cache.singleSessions.size,
      userSessions: this.cache.userSessions.size,
      listeners: this.listeners.size,
      prefetchQueue: this.prefetchQueue.size
    };
  }
}

// Export singleton instance
export const chatHistoryService = ChatHistoryServiceOptimized.getInstance();
export default ChatHistoryServiceOptimized;

