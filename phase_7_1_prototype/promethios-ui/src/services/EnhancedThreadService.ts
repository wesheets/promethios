/**
 * EnhancedThreadService - Complete thread service with agent functionality
 * Extends ThreadService with full agent response system, drag & drop, and real-time sync
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  arrayUnion,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Thread,
  ThreadMessage,
  CreateThreadRequest,
  AddThreadReplyRequest,
  ThreadSubscription,
  ThreadInfo,
  ResolveThreadRequest,
  IntegrateThreadRequest,
  ThreadResolution,
  ThreadSummary,
  ThreadIntegrationMessage
} from '../types/Thread';

// Import agent-related services and types
import { MultiAgentRoutingService, AgentResponse } from './MultiAgentRoutingService';
import { MultiAgentAuditLogger } from './MultiAgentAuditLogger';
import { MessageParser, ParsedMessage } from '../utils/MessageParser';

export interface ThreadAgentRequest {
  threadId: string;
  message: string;
  targetAgentIds?: string[];
  senderId: string;
  senderName: string;
  behaviorType?: string;
  targetMessageId?: string;
}

export interface ThreadAgentResponse {
  messageId: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
}

export class EnhancedThreadService {
  private static instance: EnhancedThreadService;
  private multiAgentRouter: MultiAgentRoutingService;
  private auditLogger: MultiAgentAuditLogger;
  private messageParser: MessageParser;

  private constructor() {
    this.multiAgentRouter = MultiAgentRoutingService.getInstance();
    this.auditLogger = MultiAgentAuditLogger.getInstance();
    this.messageParser = new MessageParser();
  }

  public static getInstance(): EnhancedThreadService {
    if (!EnhancedThreadService.instance) {
      EnhancedThreadService.instance = new EnhancedThreadService();
    }
    return EnhancedThreadService.instance;
  }

  /**
   * Send a message in a thread with agent functionality
   * This is the main method that replicates handleSendMessage for threads
   */
  async sendThreadMessage(request: ThreadAgentRequest): Promise<ThreadAgentResponse[]> {
    console.log('🧵 [EnhancedThreadService] Sending thread message:', request);

    const responses: ThreadAgentResponse[] = [];

    try {
      // 1. Add the user message to the thread
      const userMessageId = await this.addUserMessage(request);
      
      // 2. Parse the message for mentions and agent triggers
      const parsedMessage = this.messageParser.parseMessage(request.message);
      
      // 3. Determine which agents to trigger
      const agentsToTrigger = this.determineAgentsToTrigger(
        parsedMessage,
        request.targetAgentIds,
        request.behaviorType
      );

      // 4. Trigger agent responses
      for (const agentId of agentsToTrigger) {
        try {
          const agentResponse = await this.triggerAgentResponse({
            threadId: request.threadId,
            agentId,
            userMessage: request.message,
            userMessageId,
            behaviorType: request.behaviorType,
            targetMessageId: request.targetMessageId,
            senderId: request.senderId,
            senderName: request.senderName
          });

          if (agentResponse) {
            responses.push(agentResponse);
          }
        } catch (error) {
          console.error(`❌ [EnhancedThreadService] Error triggering agent ${agentId}:`, error);
        }
      }

      // 5. Log the interaction
      await this.auditLogger.logThreadInteraction({
        threadId: request.threadId,
        userId: request.senderId,
        message: request.message,
        agentsTriggered: agentsToTrigger,
        responses: responses.length,
        timestamp: new Date()
      });

      return responses;

    } catch (error) {
      console.error('❌ [EnhancedThreadService] Error sending thread message:', error);
      throw error;
    }
  }

  /**
   * Add a user message to the thread
   */
  private async addUserMessage(request: ThreadAgentRequest): Promise<string> {
    const batch = writeBatch(db);

    try {
      // Add message to thread's messages subcollection
      const messageRef = doc(collection(db, 'threads', request.threadId, 'messages'));
      const messageData: Omit<ThreadMessage, 'id'> = {
        content: request.message,
        senderId: request.senderId,
        senderName: request.senderName,
        senderType: 'user',
        timestamp: new Date(),
        attachments: []
      };

      batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });

      // Update thread metadata
      const threadRef = doc(db, 'threads', request.threadId);
      batch.update(threadRef, {
        lastReplyAt: serverTimestamp(),
        replyCount: increment(1),
        participants: arrayUnion(request.senderId)
      });

      await batch.commit();
      return messageRef.id;

    } catch (error) {
      console.error('❌ [EnhancedThreadService] Error adding user message:', error);
      throw error;
    }
  }

  /**
   * Determine which agents should be triggered based on message content and context
   */
  private determineAgentsToTrigger(
    parsedMessage: ParsedMessage,
    targetAgentIds?: string[],
    behaviorType?: string
  ): string[] {
    const agentsToTrigger: string[] = [];

    // 1. If specific agents are targeted, use those
    if (targetAgentIds && targetAgentIds.length > 0) {
      agentsToTrigger.push(...targetAgentIds);
    }

    // 2. Check for @mentions in the message
    if (parsedMessage.mentions && parsedMessage.mentions.length > 0) {
      const mentionedAgents = parsedMessage.mentions
        .filter(mention => mention.type === 'agent')
        .map(mention => mention.id);
      agentsToTrigger.push(...mentionedAgents);
    }

    // 3. For behavioral prompts, trigger the specific agent
    if (behaviorType && targetAgentIds && targetAgentIds.length > 0) {
      // Already handled in step 1, but ensure it's included
      agentsToTrigger.push(...targetAgentIds);
    }

    // Remove duplicates
    return [...new Set(agentsToTrigger)];
  }

  /**
   * Trigger an agent response in the thread
   */
  private async triggerAgentResponse(params: {
    threadId: string;
    agentId: string;
    userMessage: string;
    userMessageId: string;
    behaviorType?: string;
    targetMessageId?: string;
    senderId: string;
    senderName: string;
  }): Promise<ThreadAgentResponse | null> {
    console.log('🤖 [EnhancedThreadService] Triggering agent response:', params);

    try {
      // 1. Get thread context for the agent
      const threadContext = await this.getThreadContext(params.threadId);

      // 2. Prepare the agent request
      const agentRequest = {
        message: params.userMessage,
        context: threadContext,
        behaviorType: params.behaviorType,
        targetMessageId: params.targetMessageId,
        threadId: params.threadId,
        userId: params.senderId,
        userName: params.senderName
      };

      // 3. Get agent response via MultiAgentRoutingService
      const agentResponse = await this.multiAgentRouter.routeToAgent(
        params.agentId,
        agentRequest
      );

      if (!agentResponse || !agentResponse.content) {
        console.warn('⚠️ [EnhancedThreadService] No response from agent:', params.agentId);
        return null;
      }

      // 4. Add agent response to thread
      const responseMessageId = await this.addAgentMessage({
        threadId: params.threadId,
        agentId: params.agentId,
        agentName: agentResponse.agentName || 'AI Agent',
        content: agentResponse.content,
        replyToMessageId: params.userMessageId
      });

      return {
        messageId: responseMessageId,
        agentId: params.agentId,
        agentName: agentResponse.agentName || 'AI Agent',
        content: agentResponse.content,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ [EnhancedThreadService] Error triggering agent response:', error);
      return null;
    }
  }

  /**
   * Add an agent message to the thread
   */
  private async addAgentMessage(params: {
    threadId: string;
    agentId: string;
    agentName: string;
    content: string;
    replyToMessageId?: string;
  }): Promise<string> {
    const batch = writeBatch(db);

    try {
      // Add agent message to thread's messages subcollection
      const messageRef = doc(collection(db, 'threads', params.threadId, 'messages'));
      const messageData: Omit<ThreadMessage, 'id'> = {
        content: params.content,
        senderId: params.agentId,
        senderName: params.agentName,
        senderType: 'ai_agent',
        timestamp: new Date(),
        attachments: [],
        replyToMessageId: params.replyToMessageId
      };

      batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });

      // Update thread metadata
      const threadRef = doc(db, 'threads', params.threadId);
      batch.update(threadRef, {
        lastReplyAt: serverTimestamp(),
        replyCount: increment(1),
        participants: arrayUnion(params.agentId)
      });

      await batch.commit();
      return messageRef.id;

    } catch (error) {
      console.error('❌ [EnhancedThreadService] Error adding agent message:', error);
      throw error;
    }
  }

  /**
   * Get thread context for agent responses
   */
  private async getThreadContext(threadId: string): Promise<any> {
    try {
      // Get thread info
      const threadDoc = await getDoc(doc(db, 'threads', threadId));
      if (!threadDoc.exists()) {
        throw new Error(`Thread ${threadId} not found`);
      }

      const threadData = threadDoc.data() as Thread;

      // Get recent messages from thread
      const messagesQuery = query(
        collection(db, 'threads', threadId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ThreadMessage[];

      // Reverse to get chronological order
      messages.reverse();

      return {
        threadId,
        parentMessageId: threadData.parentMessageId,
        conversationId: threadData.conversationId,
        recentMessages: messages,
        participants: threadData.participants,
        createdAt: threadData.createdAt,
        replyCount: threadData.replyCount
      };

    } catch (error) {
      console.error('❌ [EnhancedThreadService] Error getting thread context:', error);
      return {
        threadId,
        recentMessages: [],
        participants: [],
        replyCount: 0
      };
    }
  }

  /**
   * Handle behavioral prompts in threads (drag & drop functionality)
   */
  async handleBehavioralPrompt(params: {
    threadId: string;
    agentId: string;
    agentName: string;
    behaviorType: string;
    targetMessageId?: string;
    senderId: string;
    senderName: string;
  }): Promise<ThreadAgentResponse | null> {
    console.log('🎭 [EnhancedThreadService] Handling behavioral prompt:', params);

    try {
      // Get the target message content if specified
      let targetMessageContent = '';
      if (params.targetMessageId) {
        const messageDoc = await getDoc(
          doc(db, 'threads', params.threadId, 'messages', params.targetMessageId)
        );
        if (messageDoc.exists()) {
          targetMessageContent = messageDoc.data().content || '';
        }
      }

      // Create behavioral prompt message
      const behaviorPrompts = {
        'analyze': `Please analyze the following message: "${targetMessageContent}"`,
        'summarize': `Please provide a summary of: "${targetMessageContent}"`,
        'expand': `Please expand on this topic: "${targetMessageContent}"`,
        'critique': `Please provide constructive feedback on: "${targetMessageContent}"`,
        'question': `Please ask relevant questions about: "${targetMessageContent}"`,
        'alternative': `Please suggest alternatives to: "${targetMessageContent}"`
      };

      const promptMessage = behaviorPrompts[params.behaviorType as keyof typeof behaviorPrompts] 
        || `Please respond to: "${targetMessageContent}"`;

      // Trigger agent response with behavioral prompt
      return await this.triggerAgentResponse({
        threadId: params.threadId,
        agentId: params.agentId,
        userMessage: promptMessage,
        userMessageId: params.targetMessageId || '',
        behaviorType: params.behaviorType,
        targetMessageId: params.targetMessageId,
        senderId: params.senderId,
        senderName: params.senderName
      });

    } catch (error) {
      console.error('❌ [EnhancedThreadService] Error handling behavioral prompt:', error);
      return null;
    }
  }

  /**
   * Subscribe to thread messages with real-time updates
   */
  subscribeToThread(
    threadId: string,
    callback: (subscription: ThreadSubscription) => void
  ): () => void {
    console.log('👂 [EnhancedThreadService] Subscribing to thread:', threadId);

    // Subscribe to thread metadata
    const threadUnsubscribe = onSnapshot(
      doc(db, 'threads', threadId),
      (doc) => {
        if (!doc.exists()) {
          console.warn('⚠️ [EnhancedThreadService] Thread not found:', threadId);
          return;
        }

        const threadData = { id: doc.id, ...doc.data() } as Thread;

        // Subscribe to thread messages
        const messagesQuery = query(
          collection(db, 'threads', threadId, 'messages'),
          orderBy('timestamp', 'asc')
        );

        const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          })) as ThreadMessage[];

          const subscription: ThreadSubscription = {
            thread: threadData,
            messages,
            unsubscribe: () => {
              threadUnsubscribe();
              messagesUnsubscribe();
            }
          };

          callback(subscription);
        });
      },
      (error) => {
        console.error('❌ [EnhancedThreadService] Error subscribing to thread:', error);
      }
    );

    // Return unsubscribe function
    return threadUnsubscribe;
  }

  /**
   * Create a new thread with enhanced functionality
   */
  async createThread(request: CreateThreadRequest): Promise<string> {
    console.log('🧵 [EnhancedThreadService] Creating thread:', request);

    // Validate required parameters
    if (!request.parentMessageId) {
      throw new Error('parentMessageId is required for thread creation');
    }
    
    if (!request.conversationId) {
      throw new Error('conversationId is required for thread creation');
    }
    
    if (!request.initialReply?.senderId) {
      throw new Error('initialReply.senderId is required for thread creation');
    }

    const batch = writeBatch(db);
    const threadId = request.parentMessageId;

    try {
      // 1. Create the thread document
      const threadRef = doc(db, 'threads', threadId);
      const threadData: Omit<Thread, 'id'> = {
        parentMessageId: request.parentMessageId,
        conversationId: request.conversationId,
        lastReplyAt: new Date(),
        replyCount: 1,
        participants: [request.initialReply.senderId],
        createdAt: new Date(),
        createdBy: request.initialReply.senderId,
        isActive: true,
        status: 'active'
      };

      batch.set(threadRef, {
        ...threadData,
        lastReplyAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // 2. Add the initial reply to the thread's messages subcollection
      const messageRef = doc(collection(db, 'threads', threadId, 'messages'));
      const messageData: Omit<ThreadMessage, 'id'> = {
        content: request.initialReply.content,
        senderId: request.initialReply.senderId,
        senderName: request.initialReply.senderName,
        senderType: request.initialReply.senderType,
        timestamp: new Date(),
        attachments: request.initialReply.attachments || []
      };

      batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });

      // 3. Update the parent message in the main conversation to indicate it has a thread
      const parentMessageRef = doc(db, 'conversations', request.conversationId, 'messages', request.parentMessageId);
      
      // Check if the parent message exists before trying to update it
      const parentMessageDoc = await getDoc(parentMessageRef);
      if (parentMessageDoc.exists()) {
        batch.update(parentMessageRef, {
          thread: {
            replyCount: 1,
            lastReplyAt: serverTimestamp(),
            participants: [request.initialReply.senderId]
          }
        });
      } else {
        console.warn('⚠️ [EnhancedThreadService] Parent message not found, skipping thread update:', request.parentMessageId);
      }

      await batch.commit();
      console.log('✅ [EnhancedThreadService] Thread created successfully:', threadId);
      return threadId;

    } catch (error) {
      console.error('❌ [EnhancedThreadService] Error creating thread:', error);
      throw error;
    }
  }

  /**
   * Get thread by ID with full data
   */
  async getThread(threadId: string): Promise<ThreadSubscription | null> {
    try {
      const threadDoc = await getDoc(doc(db, 'threads', threadId));
      if (!threadDoc.exists()) {
        return null;
      }

      const threadData = { id: threadDoc.id, ...threadDoc.data() } as Thread;

      // Get all messages
      const messagesQuery = query(
        collection(db, 'threads', threadId, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ThreadMessage[];

      return {
        thread: threadData,
        messages,
        unsubscribe: () => {} // No-op for one-time fetch
      };

    } catch (error) {
      console.error('❌ [EnhancedThreadService] Error getting thread:', error);
      return null;
    }
  }
}

export default EnhancedThreadService.getInstance();

