/**
 * Unified Chat Threading Manager
 * 
 * Integrates the threading system with the unified chat manager.
 * Handles thread-aware message routing, thread state management,
 * and coordination between threading and chat systems.
 */

import { ThreadingService } from './ThreadingService';
import { UnifiedChatManager } from './UnifiedChatManager';
import { FirebaseChatPersistence } from './FirebaseChatPersistence';
import { 
  Thread, 
  ThreadMessage, 
  ThreadActivity, 
  ThreadSearchCriteria,
  ThreadNavigationContext,
  ThreadStatus
} from '../types/threading';
import { Message } from '../types/chat';

export interface ThreadingManagerConfig {
  /** Enable automatic thread creation for long conversations */
  autoThreading?: boolean;
  
  /** Maximum messages before suggesting thread creation */
  autoThreadThreshold?: number;
  
  /** Enable thread notifications */
  threadNotifications?: boolean;
  
  /** Default thread settings */
  defaultThreadSettings?: {
    status: ThreadStatus;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    autoClose: boolean;
    autoCloseAfterDays?: number;
  };
}

/**
 * Unified Chat Threading Manager
 * 
 * Coordinates threading functionality with the unified chat system.
 */
export class UnifiedChatThreadingManager {
  private threadingService: ThreadingService;
  private chatManager: UnifiedChatManager;
  private persistence: FirebaseChatPersistence;
  private config: ThreadingManagerConfig;
  
  // Event listeners
  private threadListeners: Map<string, () => void> = new Map();
  private messageListeners: Map<string, () => void> = new Map();
  
  // State
  private currentSessionId: string | null = null;
  private activeThreads: Map<string, Thread> = new Map();
  private threadMessages: Map<string, ThreadMessage[]> = new Map();
  private navigationContext: ThreadNavigationContext | null = null;

  constructor(
    chatManager: UnifiedChatManager,
    persistence: FirebaseChatPersistence,
    config: ThreadingManagerConfig = {}
  ) {
    this.chatManager = chatManager;
    this.persistence = persistence;
    this.threadingService = ThreadingService.getInstance();
    this.config = {
      autoThreading: false,
      autoThreadThreshold: 20,
      threadNotifications: true,
      defaultThreadSettings: {
        status: 'active',
        priority: 'normal',
        autoClose: false,
        autoCloseAfterDays: 30
      },
      ...config
    };

    this.setupEventListeners();
  }

  /**
   * Initialize threading for a session
   */
  public async initializeForSession(sessionId: string): Promise<void> {
    try {
      console.log('🧵 [UnifiedChatThreadingManager] Initializing for session:', sessionId);
      
      this.currentSessionId = sessionId;
      
      // Load existing threads for the session
      await this.loadSessionThreads(sessionId);
      
      // Setup real-time listeners
      this.setupSessionListeners(sessionId);
      
      // Build navigation context
      await this.buildNavigationContext();
      
      console.log('✅ [UnifiedChatThreadingManager] Initialized for session:', sessionId);
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to initialize for session:', error);
      throw error;
    }
  }

  /**
   * Create a new thread from a message
   */
  public async createThreadFromMessage(
    originMessage: Message,
    title?: string,
    description?: string,
    additionalParticipants: string[] = []
  ): Promise<Thread> {
    try {
      if (!this.currentSessionId) {
        throw new Error('No active session');
      }

      console.log('🧵 [UnifiedChatThreadingManager] Creating thread from message:', originMessage.id);

      // Get session participants
      const session = await this.chatManager.getSession(this.currentSessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const participants = [
        ...session.participants.map(p => p.userId),
        ...additionalParticipants
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

      // Create thread using threading service
      const thread = await this.threadingService.createThread({
        sessionId: this.currentSessionId,
        originMessageId: originMessage.id,
        title: title || this.generateThreadTitle(originMessage),
        description,
        participants,
        createdBy: originMessage.senderId,
        metadata: {
          priority: this.config.defaultThreadSettings?.priority || 'normal',
          tags: [],
          category: 'general',
          ...this.config.defaultThreadSettings
        }
      });

      // Save to Firebase
      await this.persistence.saveThread(thread);

      // Update local state
      this.activeThreads.set(thread.id, thread);
      
      // Rebuild navigation context
      await this.buildNavigationContext();

      // Create thread activity
      await this.createThreadActivity(thread.id, 'created', originMessage.senderId, {
        originMessageId: originMessage.id
      });

      console.log('✅ [UnifiedChatThreadingManager] Thread created:', thread.id);
      return thread;
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to create thread:', error);
      throw error;
    }
  }

  /**
   * Send a message to a thread
   */
  public async sendThreadMessage(
    threadId: string,
    content: string,
    senderId: string,
    senderName: string,
    parentMessageId?: string
  ): Promise<ThreadMessage> {
    try {
      console.log('🧵 [UnifiedChatThreadingManager] Sending message to thread:', threadId);

      const thread = this.activeThreads.get(threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      // Create thread message
      const threadMessage = await this.threadingService.addMessageToThread(
        threadId,
        content,
        senderId,
        senderName,
        parentMessageId
      );

      // Save to Firebase
      await this.persistence.saveThreadMessage(threadMessage);

      // Update thread last activity
      const updatedThread = {
        ...thread,
        lastActivityAt: Date.now(),
        messageCount: thread.messageCount + 1
      };
      
      await this.persistence.updateThread(updatedThread);
      this.activeThreads.set(threadId, updatedThread);

      // Update local message cache
      const messages = this.threadMessages.get(threadId) || [];
      messages.push(threadMessage);
      this.threadMessages.set(threadId, messages);

      // Create thread activity
      await this.createThreadActivity(threadId, 'message_added', senderId, {
        messageId: threadMessage.id
      });

      console.log('✅ [UnifiedChatThreadingManager] Message sent to thread:', threadMessage.id);
      return threadMessage;
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to send thread message:', error);
      throw error;
    }
  }

  /**
   * Get thread messages
   */
  public async getThreadMessages(threadId: string, limit?: number): Promise<ThreadMessage[]> {
    try {
      // Check cache first
      if (this.threadMessages.has(threadId)) {
        const cached = this.threadMessages.get(threadId)!;
        if (!limit || cached.length <= limit) {
          return cached;
        }
      }

      // Load from Firebase
      const messages = await this.persistence.getThreadMessages(threadId, limit);
      this.threadMessages.set(threadId, messages);
      
      return messages;
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to get thread messages:', error);
      return [];
    }
  }

  /**
   * Search threads
   */
  public async searchThreads(criteria: ThreadSearchCriteria): Promise<Thread[]> {
    try {
      if (!this.currentSessionId) {
        return [];
      }

      return await this.persistence.searchThreads(this.currentSessionId, criteria);
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to search threads:', error);
      return [];
    }
  }

  /**
   * Get navigation context
   */
  public getNavigationContext(): ThreadNavigationContext | null {
    return this.navigationContext;
  }

  /**
   * Get active threads
   */
  public getActiveThreads(): Thread[] {
    return Array.from(this.activeThreads.values());
  }

  /**
   * Update thread status
   */
  public async updateThreadStatus(threadId: string, status: ThreadStatus, userId: string): Promise<void> {
    try {
      const thread = this.activeThreads.get(threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const updatedThread = await this.threadingService.updateThreadStatus(threadId, status);
      await this.persistence.updateThread(updatedThread);
      this.activeThreads.set(threadId, updatedThread);

      // Create thread activity
      await this.createThreadActivity(threadId, 'status_changed', userId, {
        oldStatus: thread.status,
        newStatus: status
      });

      console.log('✅ [UnifiedChatThreadingManager] Thread status updated:', threadId, status);
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to update thread status:', error);
      throw error;
    }
  }

  /**
   * Archive thread
   */
  public async archiveThread(threadId: string, userId: string): Promise<void> {
    try {
      const updatedThread = await this.threadingService.archiveThread(threadId);
      await this.persistence.updateThread(updatedThread);
      this.activeThreads.set(threadId, updatedThread);

      // Create thread activity
      await this.createThreadActivity(threadId, 'archived', userId);

      console.log('✅ [UnifiedChatThreadingManager] Thread archived:', threadId);
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to archive thread:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to chat manager events
    this.chatManager.on('messageReceived', this.handleMessageReceived.bind(this));
    this.chatManager.on('sessionChanged', this.handleSessionChanged.bind(this));
  }

  /**
   * Setup session-specific listeners
   */
  private setupSessionListeners(sessionId: string): void {
    // Clean up existing listeners
    this.cleanupListeners();

    // Listen to thread changes
    const threadUnsubscribe = this.persistence.listenToThreads(sessionId, (threads) => {
      this.handleThreadsUpdated(threads);
    });
    this.threadListeners.set(sessionId, threadUnsubscribe);
  }

  /**
   * Load session threads
   */
  private async loadSessionThreads(sessionId: string): Promise<void> {
    try {
      const threads = await this.persistence.getSessionThreads(sessionId);
      
      this.activeThreads.clear();
      for (const thread of threads) {
        this.activeThreads.set(thread.id, thread);
      }

      console.log('📚 [UnifiedChatThreadingManager] Loaded threads:', threads.length);
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to load session threads:', error);
    }
  }

  /**
   * Build navigation context
   */
  private async buildNavigationContext(): Promise<void> {
    try {
      const threads = Array.from(this.activeThreads.values());
      
      this.navigationContext = this.threadingService.buildNavigationContext(threads);
      
      console.log('🧭 [UnifiedChatThreadingManager] Navigation context built');
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to build navigation context:', error);
    }
  }

  /**
   * Generate thread title from message
   */
  private generateThreadTitle(message: Message): string {
    const content = message.content.trim();
    
    // Extract first sentence or first 50 characters
    const firstSentence = content.split(/[.!?]/)[0];
    if (firstSentence.length > 0 && firstSentence.length <= 50) {
      return firstSentence.trim();
    }
    
    // Fallback to first 50 characters
    return content.length > 50 ? content.substring(0, 47) + '...' : content;
  }

  /**
   * Create thread activity
   */
  private async createThreadActivity(
    threadId: string,
    type: ThreadActivity['type'],
    userId: string,
    metadata?: any
  ): Promise<void> {
    try {
      const activity: ThreadActivity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId,
        type,
        userId,
        timestamp: Date.now(),
        metadata
      };

      await this.persistence.saveThreadActivity(activity);
    } catch (error) {
      console.error('❌ [UnifiedChatThreadingManager] Failed to create thread activity:', error);
    }
  }

  /**
   * Handle message received
   */
  private async handleMessageReceived(message: Message): Promise<void> {
    // Check if auto-threading is enabled and threshold is reached
    if (this.config.autoThreading && this.currentSessionId) {
      const session = await this.chatManager.getSession(this.currentSessionId);
      if (session && session.messages.length >= (this.config.autoThreadThreshold || 20)) {
        // Suggest thread creation (this would trigger a UI notification)
        console.log('💡 [UnifiedChatThreadingManager] Suggesting thread creation for long conversation');
      }
    }
  }

  /**
   * Handle session changed
   */
  private async handleSessionChanged(sessionId: string): Promise<void> {
    if (sessionId !== this.currentSessionId) {
      await this.initializeForSession(sessionId);
    }
  }

  /**
   * Handle threads updated
   */
  private handleThreadsUpdated(threads: Thread[]): void {
    // Update local cache
    this.activeThreads.clear();
    for (const thread of threads) {
      this.activeThreads.set(thread.id, thread);
    }

    // Rebuild navigation context
    this.buildNavigationContext();

    console.log('🔄 [UnifiedChatThreadingManager] Threads updated:', threads.length);
  }

  /**
   * Cleanup listeners
   */
  private cleanupListeners(): void {
    for (const unsubscribe of this.threadListeners.values()) {
      unsubscribe();
    }
    this.threadListeners.clear();

    for (const unsubscribe of this.messageListeners.values()) {
      unsubscribe();
    }
    this.messageListeners.clear();
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 [UnifiedChatThreadingManager] Cleaning up');
    
    this.cleanupListeners();
    this.activeThreads.clear();
    this.threadMessages.clear();
    this.navigationContext = null;
    this.currentSessionId = null;
  }
}

export default UnifiedChatThreadingManager;

