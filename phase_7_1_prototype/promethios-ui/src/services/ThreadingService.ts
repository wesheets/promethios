/**
 * Threading Service
 * 
 * Core service for managing conversation threads in the unified chat system.
 * Handles thread creation, management, navigation, and persistence.
 */

import { 
  Thread, 
  ThreadMessage, 
  CreateThreadRequest, 
  UpdateThreadRequest,
  ThreadNavigationContext,
  ThreadTreeNode,
  ThreadStats,
  ThreadActivity,
  ThreadSearchCriteria,
  ThreadSearchResults,
  ThreadStatus,
  ThreadActivityType
} from '../types/threading';
import { Message, ChatSession } from '../types/chat';
import { FirebaseChatPersistence } from './FirebaseChatPersistence';
import { unifiedChatLogger } from '../config/unifiedChatConfig';

/**
 * Threading Service Implementation
 */
export class ThreadingService {
  private static instance: ThreadingService;
  private persistence: FirebaseChatPersistence;
  private threadCache: Map<string, Thread> = new Map();
  private threadListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.persistence = FirebaseChatPersistence.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ThreadingService {
    if (!ThreadingService.instance) {
      ThreadingService.instance = new ThreadingService();
    }
    return ThreadingService.instance;
  }

  /**
   * Create a new thread
   */
  public async createThread(request: CreateThreadRequest): Promise<Thread> {
    try {
      unifiedChatLogger.info('🧵 [ThreadingService] Creating new thread:', {
        sessionId: request.sessionId,
        title: request.title,
        originMessageId: request.originMessageId
      });

      // Generate thread ID
      const threadId = this.generateThreadId(request.sessionId);

      // Create thread object
      const thread: Thread = {
        id: threadId,
        sessionId: request.sessionId,
        parentThreadId: request.parentThreadId,
        title: request.title,
        description: request.description,
        originMessageId: request.originMessageId,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        createdBy: '', // Will be set by caller
        participants: request.participants || [],
        status: 'active',
        metadata: {
          priority: 'normal',
          ...request.metadata
        },
        messageCount: 0,
        unreadCounts: {}
      };

      // Save thread to persistence
      await this.persistence.saveThread(thread);

      // Cache thread
      this.threadCache.set(threadId, thread);

      // Log activity
      await this.logThreadActivity(threadId, 'thread_created', '', {
        title: thread.title,
        originMessageId: thread.originMessageId
      });

      // Notify listeners
      this.notifyThreadListeners(request.sessionId, 'thread_created', thread);

      unifiedChatLogger.info('✅ [ThreadingService] Thread created successfully:', threadId);
      return thread;

    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to create thread:', error);
      throw new Error(`Failed to create thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing thread
   */
  public async updateThread(request: UpdateThreadRequest): Promise<Thread> {
    try {
      unifiedChatLogger.info('🔄 [ThreadingService] Updating thread:', request.threadId);

      // Get existing thread
      const existingThread = await this.getThread(request.threadId);
      if (!existingThread) {
        throw new Error(`Thread not found: ${request.threadId}`);
      }

      // Create updated thread
      const updatedThread: Thread = {
        ...existingThread,
        ...(request.title && { title: request.title }),
        ...(request.description && { description: request.description }),
        ...(request.status && { status: request.status }),
        lastActivityAt: Date.now(),
        metadata: {
          ...existingThread.metadata,
          ...request.metadata
        }
      };

      // Handle participant changes
      if (request.addParticipants) {
        updatedThread.participants = [
          ...new Set([...updatedThread.participants, ...request.addParticipants])
        ];
      }

      if (request.removeParticipants) {
        updatedThread.participants = updatedThread.participants.filter(
          p => !request.removeParticipants!.includes(p)
        );
      }

      // Save updated thread
      await this.persistence.updateThread(updatedThread);

      // Update cache
      this.threadCache.set(request.threadId, updatedThread);

      // Log activity
      await this.logThreadActivity(request.threadId, 'thread_updated', '', {
        changes: request
      });

      // Notify listeners
      this.notifyThreadListeners(existingThread.sessionId, 'thread_updated', updatedThread);

      unifiedChatLogger.info('✅ [ThreadingService] Thread updated successfully:', request.threadId);
      return updatedThread;

    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to update thread:', error);
      throw new Error(`Failed to update thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a thread by ID
   */
  public async getThread(threadId: string): Promise<Thread | null> {
    try {
      // Check cache first
      if (this.threadCache.has(threadId)) {
        return this.threadCache.get(threadId)!;
      }

      // Load from persistence
      const thread = await this.persistence.getThread(threadId);
      if (thread) {
        this.threadCache.set(threadId, thread);
      }

      return thread;
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to get thread:', error);
      return null;
    }
  }

  /**
   * Get all threads for a session
   */
  public async getSessionThreads(sessionId: string): Promise<Thread[]> {
    try {
      unifiedChatLogger.info('📋 [ThreadingService] Getting threads for session:', sessionId);

      const threads = await this.persistence.getSessionThreads(sessionId);
      
      // Update cache
      threads.forEach(thread => {
        this.threadCache.set(thread.id, thread);
      });

      return threads;
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to get session threads:', error);
      return [];
    }
  }

  /**
   * Add a message to a thread
   */
  public async addMessageToThread(threadId: string, message: ThreadMessage): Promise<void> {
    try {
      unifiedChatLogger.info('💬 [ThreadingService] Adding message to thread:', {
        threadId,
        messageId: message.id
      });

      // Get thread
      const thread = await this.getThread(threadId);
      if (!thread) {
        throw new Error(`Thread not found: ${threadId}`);
      }

      // Save message with thread context
      await this.persistence.saveThreadMessage(message);

      // Update thread stats
      const updatedThread: Thread = {
        ...thread,
        messageCount: thread.messageCount + 1,
        lastActivityAt: Date.now()
      };

      // Update unread counts for other participants
      const messageAuthor = message.senderId;
      thread.participants.forEach(participantId => {
        if (participantId !== messageAuthor) {
          updatedThread.unreadCounts[participantId] = 
            (updatedThread.unreadCounts[participantId] || 0) + 1;
        }
      });

      // Save updated thread
      await this.persistence.updateThread(updatedThread);
      this.threadCache.set(threadId, updatedThread);

      // Log activity
      await this.logThreadActivity(threadId, 'message_added', messageAuthor, {
        messageId: message.id,
        messageType: message.type
      });

      // Notify listeners
      this.notifyThreadListeners(thread.sessionId, 'message_added', updatedThread, message);

      unifiedChatLogger.info('✅ [ThreadingService] Message added to thread successfully');

    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to add message to thread:', error);
      throw new Error(`Failed to add message to thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get thread messages
   */
  public async getThreadMessages(threadId: string, limit?: number, offset?: number): Promise<ThreadMessage[]> {
    try {
      return await this.persistence.getThreadMessages(threadId, limit, offset);
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to get thread messages:', error);
      return [];
    }
  }

  /**
   * Build thread navigation context
   */
  public async buildNavigationContext(sessionId: string, currentThreadId?: string): Promise<ThreadNavigationContext> {
    try {
      const threads = await this.getSessionThreads(sessionId);
      const threadTree = this.buildThreadTree(threads);
      const threadPath = currentThreadId ? this.buildThreadPath(threads, currentThreadId) : [];

      return {
        currentThreadId,
        threadPath,
        availableThreads: threads,
        threadTree
      };
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to build navigation context:', error);
      return {
        threadPath: [],
        availableThreads: [],
        threadTree: []
      };
    }
  }

  /**
   * Get thread statistics
   */
  public async getThreadStats(sessionId: string): Promise<ThreadStats> {
    try {
      const threads = await this.getSessionThreads(sessionId);
      const activities = await this.getRecentThreadActivities(sessionId, 10);

      const activeThreads = threads.filter(t => t.status === 'active').length;
      const archivedThreads = threads.filter(t => t.status === 'archived').length;
      const totalMessages = threads.reduce((sum, t) => sum + t.messageCount, 0);
      const unreadMessages = threads.reduce((sum, t) => 
        sum + Object.values(t.unreadCounts).reduce((a, b) => a + b, 0), 0
      );

      const mostActiveThread = threads.reduce((max, thread) => 
        thread.messageCount > (max?.messageCount || 0) ? thread : max, 
        threads[0] || null
      );

      return {
        totalThreads: threads.length,
        activeThreads,
        archivedThreads,
        totalMessages,
        unreadMessages,
        mostActiveThread,
        recentActivity: activities
      };
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to get thread stats:', error);
      return {
        totalThreads: 0,
        activeThreads: 0,
        archivedThreads: 0,
        totalMessages: 0,
        unreadMessages: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Search threads
   */
  public async searchThreads(sessionId: string, criteria: ThreadSearchCriteria): Promise<ThreadSearchResults> {
    try {
      const startTime = Date.now();
      const threads = await this.persistence.searchThreads(sessionId, criteria);
      const executionTime = Date.now() - startTime;

      return {
        threads,
        totalCount: threads.length,
        searchMetadata: {
          query: criteria.query || '',
          executionTime,
          filters: criteria
        }
      };
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to search threads:', error);
      return {
        threads: [],
        totalCount: 0,
        searchMetadata: {
          query: criteria.query || '',
          executionTime: 0,
          filters: criteria
        }
      };
    }
  }

  /**
   * Archive a thread
   */
  public async archiveThread(threadId: string, userId: string): Promise<void> {
    await this.updateThread({
      threadId,
      status: 'archived'
    });

    await this.logThreadActivity(threadId, 'thread_archived', userId, {});
  }

  /**
   * Close a thread
   */
  public async closeThread(threadId: string, userId: string): Promise<void> {
    await this.updateThread({
      threadId,
      status: 'closed'
    });

    await this.logThreadActivity(threadId, 'thread_closed', userId, {});
  }

  /**
   * Mark thread as read for a user
   */
  public async markThreadAsRead(threadId: string, userId: string): Promise<void> {
    try {
      const thread = await this.getThread(threadId);
      if (!thread) return;

      const updatedThread: Thread = {
        ...thread,
        unreadCounts: {
          ...thread.unreadCounts,
          [userId]: 0
        }
      };

      await this.persistence.updateThread(updatedThread);
      this.threadCache.set(threadId, updatedThread);

      this.notifyThreadListeners(thread.sessionId, 'thread_read', updatedThread);
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to mark thread as read:', error);
    }
  }

  /**
   * Add thread event listener
   */
  public addThreadListener(sessionId: string, listener: Function): void {
    if (!this.threadListeners.has(sessionId)) {
      this.threadListeners.set(sessionId, []);
    }
    this.threadListeners.get(sessionId)!.push(listener);
  }

  /**
   * Remove thread event listener
   */
  public removeThreadListener(sessionId: string, listener: Function): void {
    const listeners = this.threadListeners.get(sessionId);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private helper methods

  private generateThreadId(sessionId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `thread_${sessionId}_${timestamp}_${random}`;
  }

  private buildThreadTree(threads: Thread[]): ThreadTreeNode[] {
    const threadMap = new Map<string, Thread>();
    const rootThreads: Thread[] = [];

    // Build thread map and identify root threads
    threads.forEach(thread => {
      threadMap.set(thread.id, thread);
      if (!thread.parentThreadId) {
        rootThreads.push(thread);
      }
    });

    // Build tree recursively
    const buildNode = (thread: Thread, depth: number = 0): ThreadTreeNode => {
      const children = threads
        .filter(t => t.parentThreadId === thread.id)
        .map(child => buildNode(child, depth + 1));

      return {
        thread,
        children,
        depth,
        expanded: depth < 2 // Auto-expand first 2 levels
      };
    };

    return rootThreads.map(thread => buildNode(thread));
  }

  private buildThreadPath(threads: Thread[], threadId: string): string[] {
    const path: string[] = [];
    let currentThread = threads.find(t => t.id === threadId);

    while (currentThread) {
      path.unshift(currentThread.id);
      currentThread = currentThread.parentThreadId 
        ? threads.find(t => t.id === currentThread!.parentThreadId)
        : undefined;
    }

    return path;
  }

  private async logThreadActivity(
    threadId: string, 
    type: ThreadActivityType, 
    userId: string, 
    details: Record<string, any>
  ): Promise<void> {
    try {
      const activity: ThreadActivity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId,
        type,
        userId,
        timestamp: Date.now(),
        details
      };

      await this.persistence.saveThreadActivity(activity);
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to log thread activity:', error);
    }
  }

  private async getRecentThreadActivities(sessionId: string, limit: number): Promise<ThreadActivity[]> {
    try {
      return await this.persistence.getThreadActivities(sessionId, limit);
    } catch (error) {
      unifiedChatLogger.error('❌ [ThreadingService] Failed to get recent activities:', error);
      return [];
    }
  }

  private notifyThreadListeners(sessionId: string, event: string, thread: Thread, data?: any): void {
    const listeners = this.threadListeners.get(sessionId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, thread, data);
        } catch (error) {
          unifiedChatLogger.error('❌ [ThreadingService] Thread listener error:', error);
        }
      });
    }
  }
}

