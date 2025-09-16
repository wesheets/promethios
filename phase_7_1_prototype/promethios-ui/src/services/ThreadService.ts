/**
 * ThreadService - Firebase service for managing threaded conversations
 * Handles CRUD operations for threads and thread messages
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

export class ThreadService {
  private static instance: ThreadService;

  public static getInstance(): ThreadService {
    if (!ThreadService.instance) {
      ThreadService.instance = new ThreadService();
    }
    return ThreadService.instance;
  }

  /**
   * Create a new thread with an initial reply
   */
  async createThread(request: CreateThreadRequest): Promise<string> {
    console.log('🧵 [ThreadService] Creating thread:', request);

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
        isActive: true
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
      batch.update(parentMessageRef, {
        thread: {
          replyCount: 1,
          lastReplyAt: serverTimestamp(),
          participants: [request.initialReply.senderId]
        }
      });

      await batch.commit();
      console.log('✅ [ThreadService] Thread created successfully:', threadId);
      return threadId;

    } catch (error) {
      console.error('❌ [ThreadService] Error creating thread:', error);
      throw error;
    }
  }

  /**
   * Add a reply to an existing thread
   */
  async addReply(request: AddThreadReplyRequest): Promise<string> {
    console.log('💬 [ThreadService] Adding reply to thread:', request.threadId);

    const batch = writeBatch(db);

    try {
      // 1. Add the reply to the thread's messages subcollection
      const messageRef = doc(collection(db, 'threads', request.threadId, 'messages'));
      const messageData: Omit<ThreadMessage, 'id'> = {
        content: request.reply.content,
        senderId: request.reply.senderId,
        senderName: request.reply.senderName,
        senderType: request.reply.senderType,
        timestamp: new Date(),
        attachments: request.reply.attachments || [],
        metadata: request.reply.metadata
      };

      batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });

      // 2. Update the thread document
      const threadRef = doc(db, 'threads', request.threadId);
      batch.update(threadRef, {
        lastReplyAt: serverTimestamp(),
        replyCount: increment(1),
        participants: arrayUnion(request.reply.senderId)
      });

      // 3. Update the parent message's thread info
      const threadDoc = await getDoc(threadRef);
      if (threadDoc.exists()) {
        const threadData = threadDoc.data() as Thread;
        const parentMessageRef = doc(db, 'conversations', threadData.conversationId, 'messages', threadData.parentMessageId);
        
        batch.update(parentMessageRef, {
          'thread.replyCount': increment(1),
          'thread.lastReplyAt': serverTimestamp(),
          'thread.participants': arrayUnion(request.reply.senderId)
        });
      }

      await batch.commit();
      console.log('✅ [ThreadService] Reply added successfully:', messageRef.id);
      return messageRef.id;

    } catch (error) {
      console.error('❌ [ThreadService] Error adding reply:', error);
      throw error;
    }
  }

  /**
   * Get a thread with all its messages
   */
  async getThread(threadId: string): Promise<ThreadSubscription | null> {
    console.log('📖 [ThreadService] Getting thread:', threadId);

    try {
      // Get thread document
      const threadDoc = await getDoc(doc(db, 'threads', threadId));
      if (!threadDoc.exists()) {
        console.log('❌ [ThreadService] Thread not found:', threadId);
        return null;
      }

      const threadData = {
        id: threadDoc.id,
        ...threadDoc.data(),
        createdAt: threadDoc.data().createdAt?.toDate() || new Date(),
        lastReplyAt: threadDoc.data().lastReplyAt?.toDate() || new Date()
      } as Thread;

      // Get thread messages
      const messagesQuery = query(
        collection(db, 'threads', threadId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages: ThreadMessage[] = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ThreadMessage[];

      console.log('✅ [ThreadService] Thread retrieved:', { threadId, messageCount: messages.length });
      return { thread: threadData, messages };

    } catch (error) {
      console.error('❌ [ThreadService] Error getting thread:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time thread updates
   */
  subscribeToThread(threadId: string, callback: (data: ThreadSubscription | null) => void): () => void {
    console.log('🔔 [ThreadService] Subscribing to thread:', threadId);

    const threadRef = doc(db, 'threads', threadId);
    const messagesRef = collection(db, 'threads', threadId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    let threadData: Thread | null = null;
    let messages: ThreadMessage[] = [];

    // Subscribe to thread document
    const unsubscribeThread = onSnapshot(threadRef, (doc) => {
      if (doc.exists()) {
        threadData = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastReplyAt: doc.data().lastReplyAt?.toDate() || new Date()
        } as Thread;
      } else {
        threadData = null;
      }

      if (threadData) {
        callback({ thread: threadData, messages });
      } else {
        callback(null);
      }
    });

    // Subscribe to thread messages
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ThreadMessage[];

      if (threadData) {
        callback({ thread: threadData, messages });
      }
    });

    // Return cleanup function
    return () => {
      unsubscribeThread();
      unsubscribeMessages();
    };
  }

  /**
   * Get threads for a conversation
   */
  async getConversationThreads(conversationId: string): Promise<Thread[]> {
    console.log('📚 [ThreadService] Getting threads for conversation:', conversationId);

    try {
      const threadsQuery = query(
        collection(db, 'threads'),
        where('conversationId', '==', conversationId),
        where('isActive', '==', true),
        orderBy('lastReplyAt', 'desc')
      );

      const snapshot = await getDocs(threadsQuery);
      const threads: Thread[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastReplyAt: doc.data().lastReplyAt?.toDate() || new Date()
      })) as Thread[];

      console.log('✅ [ThreadService] Retrieved threads:', threads.length);
      return threads;

    } catch (error) {
      console.error('❌ [ThreadService] Error getting conversation threads:', error);
      throw error;
    }
  }

  /**
   * Delete a thread (mark as inactive)
   */
  async deleteThread(threadId: string): Promise<void> {
    console.log('🗑️ [ThreadService] Deleting thread:', threadId);

    try {
      const batch = writeBatch(db);

      // Mark thread as inactive
      const threadRef = doc(db, 'threads', threadId);
      batch.update(threadRef, { isActive: false });

      // Remove thread info from parent message
      const threadDoc = await getDoc(threadRef);
      if (threadDoc.exists()) {
        const threadData = threadDoc.data() as Thread;
        const parentMessageRef = doc(db, 'conversations', threadData.conversationId, 'messages', threadData.parentMessageId);
        
        batch.update(parentMessageRef, {
          thread: null
        });
      }

      await batch.commit();
      console.log('✅ [ThreadService] Thread deleted successfully');

    } catch (error) {
      console.error('❌ [ThreadService] Error deleting thread:', error);
      throw error;
    }
  }

  /**
   * Resolve a thread with summary and key outcomes
   */
  async resolveThread(request: ResolveThreadRequest): Promise<string> {
    console.log('🎯 [ThreadService] Resolving thread:', request);

    const batch = writeBatch(db);

    try {
      // 1. Update thread with resolution data
      const threadRef = doc(db, 'threads', request.threadId);
      const threadDoc = await getDoc(threadRef);
      
      if (!threadDoc.exists()) {
        throw new Error('Thread not found');
      }

      const threadData = threadDoc.data() as Thread;
      const resolution: ThreadResolution = {
        summary: request.resolution.summary,
        keyOutcomes: request.resolution.keyOutcomes,
        keyMessages: request.resolution.keyMessageIds,
        resolvedBy: request.resolvedBy,
        resolvedAt: new Date()
      };

      batch.update(threadRef, {
        status: 'resolved',
        resolution: {
          ...resolution,
          resolvedAt: serverTimestamp()
        }
      });

      // 2. Update parent message thread info
      const parentMessageRef = doc(db, 'conversations', threadData.conversationId, 'messages', threadData.parentMessageId);
      batch.update(parentMessageRef, {
        'thread.status': 'resolved'
      });

      // 3. If integration requested, create integration message
      let integrationMessageId: string | null = null;
      if (request.integrateToMainChat) {
        integrationMessageId = await this.integrateThreadToMainChat(
          request.threadId,
          threadData.conversationId,
          request.resolvedBy,
          {
            summary: request.resolution.summary,
            keyPoints: request.resolution.keyOutcomes,
            selectedMessageIds: request.resolution.keyMessageIds
          },
          batch
        );

        // Update thread status to integrated
        batch.update(threadRef, {
          status: 'integrated'
        });
      }

      await batch.commit();
      console.log('✅ [ThreadService] Thread resolved successfully:', request.threadId);
      return integrationMessageId || request.threadId;

    } catch (error) {
      console.error('❌ [ThreadService] Error resolving thread:', error);
      throw error;
    }
  }

  /**
   * Integrate thread summary and key messages into main chat
   */
  private async integrateThreadToMainChat(
    threadId: string,
    conversationId: string,
    integratedBy: string,
    integrationData: {
      summary: string;
      keyPoints: string[];
      selectedMessageIds: string[];
    },
    batch?: any
  ): Promise<string> {
    console.log('🔗 [ThreadService] Integrating thread to main chat:', threadId);

    const useBatch = batch || writeBatch(db);
    const shouldCommit = !batch;

    try {
      // Get thread data and selected messages
      const threadDoc = await getDoc(doc(db, 'threads', threadId));
      if (!threadDoc.exists()) {
        throw new Error('Thread not found');
      }

      const threadData = threadDoc.data() as Thread;
      
      // Get selected key messages
      const keyMessages: ThreadMessage[] = [];
      if (integrationData.selectedMessageIds.length > 0) {
        const messagesQuery = query(
          collection(db, 'threads', threadId, 'messages'),
          where('__name__', 'in', integrationData.selectedMessageIds)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        
        messagesSnapshot.docs.forEach(doc => {
          keyMessages.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          } as ThreadMessage);
        });
      }

      // Create integration message
      const integrationMessageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
      const integrationMessage: Omit<ThreadIntegrationMessage, 'id'> = {
        type: 'thread_integration',
        content: integrationData.summary,
        senderId: 'system',
        senderName: 'Thread Integration',
        timestamp: new Date(),
        threadReference: {
          threadId,
          parentMessageId: threadData.parentMessageId,
          originalMessageCount: threadData.replyCount,
          participants: threadData.participants,
          resolvedBy: integratedBy
        },
        integrationData: {
          summary: integrationData.summary,
          keyPoints: integrationData.keyPoints,
          keyMessages,
          promotedBy: integratedBy
        }
      };

      useBatch.set(integrationMessageRef, {
        ...integrationMessage,
        timestamp: serverTimestamp()
      });

      // Create thread summary document
      const summaryRef = doc(collection(db, 'threadSummaries'));
      const threadSummary: Omit<ThreadSummary, 'id'> = {
        threadId,
        conversationId,
        summaryContent: integrationData.summary,
        keyPoints: integrationData.keyPoints,
        keyMessages,
        generatedBy: integratedBy,
        createdAt: new Date(),
        integratedAt: new Date(),
        integrationMessageId: integrationMessageRef.id
      };

      useBatch.set(summaryRef, {
        ...threadSummary,
        createdAt: serverTimestamp(),
        integratedAt: serverTimestamp()
      });

      if (shouldCommit) {
        await useBatch.commit();
      }

      console.log('✅ [ThreadService] Thread integrated successfully:', integrationMessageRef.id);
      return integrationMessageRef.id;

    } catch (error) {
      console.error('❌ [ThreadService] Error integrating thread:', error);
      throw error;
    }
  }

  /**
   * Get thread summary by thread ID
   */
  async getThreadSummary(threadId: string): Promise<ThreadSummary | null> {
    console.log('📄 [ThreadService] Getting thread summary:', threadId);

    try {
      const summariesQuery = query(
        collection(db, 'threadSummaries'),
        where('threadId', '==', threadId),
        limit(1)
      );

      const snapshot = await getDocs(summariesQuery);
      if (snapshot.empty) {
        console.log('❌ [ThreadService] Thread summary not found:', threadId);
        return null;
      }

      const summaryDoc = snapshot.docs[0];
      const summary: ThreadSummary = {
        id: summaryDoc.id,
        ...summaryDoc.data(),
        createdAt: summaryDoc.data().createdAt?.toDate() || new Date(),
        integratedAt: summaryDoc.data().integratedAt?.toDate() || new Date()
      } as ThreadSummary;

      console.log('✅ [ThreadService] Thread summary retrieved:', summary.id);
      return summary;

    } catch (error) {
      console.error('❌ [ThreadService] Error getting thread summary:', error);
      throw error;
    }
  }

  /**
   * Generate AI summary for thread (placeholder - integrate with actual AI service)
   */
  async generateAISummary(threadId: string): Promise<{ summary: string; keyOutcomes: string[] }> {
    console.log('🤖 [ThreadService] Generating AI summary for thread:', threadId);

    try {
      // Get thread messages
      const messagesQuery = query(
        collection(db, 'threads', threadId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages: ThreadMessage[] = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ThreadMessage[];

      // TODO: Replace with actual AI service call
      // For now, generate a mock summary based on message content
      const participantCount = new Set(messages.map(m => m.senderId)).size;
      const messageCount = messages.length;
      const contentLength = messages.reduce((acc, m) => acc + m.content.length, 0);

      const summary = `This thread involved ${participantCount} participants discussing over ${messageCount} messages. The conversation covered various aspects of the topic with detailed analysis and collaborative problem-solving.`;
      
      const keyOutcomes = [
        'Collaborative discussion completed',
        'Multiple perspectives considered',
        'Consensus reached on key points'
      ];

      console.log('✅ [ThreadService] AI summary generated');
      return { summary, keyOutcomes };

    } catch (error) {
      console.error('❌ [ThreadService] Error generating AI summary:', error);
      throw error;
    }
  }
}

export default ThreadService.getInstance();

// Force deployment refresh
