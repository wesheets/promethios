/**
 * FirebaseChatPersistence - Optimized Firebase persistence for chat system
 * 
 * Handles data persistence for both regular and shared conversations
 * with optimized schema and indexes for 1-10 participants.
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  limitToLast,
  getDocs,
  onSnapshot, 
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase/config';
import { ChatSession } from './UnifiedChatManager';
import { Participant } from './ParticipantManager';
import { Message } from './MessageRouter';
import { Thread, ThreadMessage, ThreadActivity, ThreadSearchCriteria } from '../types/threading';

export interface FirebaseSchema {
  // Collections
  sessions: 'chat_sessions';
  messages: 'chat_messages';
  participants: 'chat_participants';
  typing: 'chat_typing';
  presence: 'chat_presence';
  userSessions: 'user_chat_sessions';
}

export interface SessionDocument {
  id: string;
  name: string;
  mode: 'regular' | 'shared';
  hostUserId: string;
  agentId?: string;
  participantIds: string[];
  participantCount: number;
  createdAt: Timestamp;
  lastActivity: Timestamp;
  metadata: {
    isPrivate: boolean;
    allowInvites: boolean;
    linkedSessionId?: string;
  };
  // Optimized fields for queries
  activeParticipants: string[]; // Online participants only
  lastMessageId?: string;
  lastMessageTimestamp?: Timestamp;
  unreadCounts: { [userId: string]: number };
}

export interface MessageDocument {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Timestamp;
  target?: {
    type: 'all' | 'user' | 'agent' | 'role';
    id?: string;
    name?: string;
  };
  attachments: string[];
  delivered: boolean;
  read: boolean;
  readBy: string[]; // Array of userIds who read the message
  metadata?: any;
}

export interface ParticipantDocument {
  sessionId: string;
  userId: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: 'host' | 'participant' | 'agent' | 'observer';
  joinedAt: Timestamp;
  lastSeen: Timestamp;
  isOnline: boolean;
  permissions: string[];
  metadata?: any;
}

export interface TypingDocument {
  sessionId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Timestamp;
  // Auto-delete after 5 seconds using Firestore TTL
  expiresAt: Timestamp;
}

export interface PresenceDocument {
  userId: string;
  isOnline: boolean;
  lastSeen: Timestamp;
  activeSessions: string[];
  // Auto-delete after 1 minute using Firestore TTL
  expiresAt: Timestamp;
}

export class FirebaseChatPersistence {
  private user: User | null = null;
  private activeListeners: Map<string, () => void> = new Map();
  private batchOperations: Map<string, any[]> = new Map();

  // Collection references
  private readonly COLLECTIONS: FirebaseSchema = {
    sessions: 'chat_sessions',
    messages: 'chat_messages',
    participants: 'chat_participants',
    typing: 'chat_typing',
    presence: 'chat_presence',
    userSessions: 'user_chat_sessions'
  };

  constructor() {
    console.log('🔥 [FirebaseChatPersistence] Initialized with optimized schema');
  }

  /**
   * Initialize with user context
   */
  public async initialize(user: User): Promise<void> {
    this.user = user;
    
    // Initialize user presence
    await this.updateUserPresence(user.uid, true);
    
    console.log('🔥 [FirebaseChatPersistence] Initialized for user:', user.uid);
  }

  /**
   * Save chat session to Firebase
   */
  public async saveSession(session: ChatSession): Promise<void> {
    try {
      const sessionDoc: any = {
        id: session.id,
        name: session.name,
        mode: session.mode,
        hostUserId: session.hostUserId,
        agentId: session.agentId,
        participantIds: session.participants.map(p => p.userId),
        participantCount: session.participants.length,
        createdAt: Timestamp.fromDate(session.createdAt),
        lastActivity: Timestamp.fromDate(session.lastActivity),
        metadata: session.metadata,
        activeParticipants: session.participants.filter(p => p.isOnline).map(p => p.userId),
        unreadCounts: {}
      };

      // Remove undefined fields to prevent Firebase errors
      const cleanSessionDoc = this.removeUndefinedFields(sessionDoc);

      await setDoc(doc(db, this.COLLECTIONS.sessions, session.id), cleanSessionDoc);
      
      // Add to user's session list
      await this.addUserSession(session.hostUserId, session.id);
      
      console.log('✅ [FirebaseChatPersistence] Saved session:', session.id);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to save session:', error);
      throw error;
    }
  }

  /**
   * Update existing session in Firebase
   */
  public async updateSession(session: ChatSession): Promise<void> {
    try {
      console.log('💾 [FirebaseChatPersistence] Updating session:', {
        sessionId: session.id,
        metadata: session.metadata,
        hasUndefinedInMetadata: session.metadata ? Object.entries(session.metadata).some(([k, v]) => v === undefined) : false
      });

      const updates: Partial<SessionDocument> = {
        name: session.name,
        mode: session.mode,
        participantIds: session.participants.map(p => p.userId),
        participantCount: session.participants.length,
        lastActivity: Timestamp.fromDate(session.lastActivity),
        metadata: session.metadata,
        activeParticipants: session.participants.filter(p => p.isOnline).map(p => p.userId)
      };

      console.log('💾 [FirebaseChatPersistence] Updates before cleaning:', {
        metadata: updates.metadata,
        hasUndefinedInUpdates: updates.metadata ? Object.entries(updates.metadata).some(([k, v]) => v === undefined) : false
      });

      // Remove undefined fields to prevent Firebase errors
      const cleanUpdates = this.removeUndefinedFields(updates);

      console.log('💾 [FirebaseChatPersistence] Updates after cleaning:', {
        metadata: cleanUpdates.metadata,
        hasUndefinedInCleanUpdates: cleanUpdates.metadata ? Object.entries(cleanUpdates.metadata).some(([k, v]) => v === undefined) : false
      });

      await updateDoc(doc(db, this.COLLECTIONS.sessions, session.id), cleanUpdates);
      
      console.log('✅ [FirebaseChatPersistence] Updated session:', session.id);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to update session:', {
        sessionId: session.id,
        error: error instanceof Error ? error.message : error,
        metadata: session.metadata
      });
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const sessionDoc = await getDoc(doc(db, this.COLLECTIONS.sessions, sessionId));
      
      if (!sessionDoc.exists()) {
        return null;
      }

      const data = sessionDoc.data() as SessionDocument;
      
      // Convert to ChatSession format
      const session: ChatSession = {
        id: data.id,
        name: data.name,
        mode: data.mode,
        participants: [], // Will be loaded separately
        hostUserId: data.hostUserId,
        agentId: data.agentId,
        createdAt: data.createdAt.toDate(),
        lastActivity: data.lastActivity.toDate(),
        metadata: data.metadata
      };

      // Load participants
      session.participants = await this.getSessionParticipants(sessionId);
      
      return session;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get session:', error);
      return null;
    }
  }

  /**
   * Get user's sessions
   */
  public async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      // Query sessions where user is a participant
      const q = query(
        collection(db, this.COLLECTIONS.sessions),
        where('participantIds', 'array-contains', userId),
        orderBy('lastActivity', 'desc'),
        limit(50) // Reasonable limit for UI
      );

      const snapshot = await new Promise<any>((resolve, reject) => {
        const unsubscribe = onSnapshot(q, resolve, reject);
        // Store unsubscribe function for cleanup
        this.activeListeners.set(`userSessions_${userId}`, unsubscribe);
      });

      const sessions: ChatSession[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as SessionDocument;
        
        const session: ChatSession = {
          id: data.id,
          name: data.name,
          mode: data.mode,
          participants: await this.getSessionParticipants(data.id),
          hostUserId: data.hostUserId,
          agentId: data.agentId,
          createdAt: data.createdAt.toDate(),
          lastActivity: data.lastActivity.toDate(),
          metadata: data.metadata
        };
        
        sessions.push(session);
      }

      console.log(`📋 [FirebaseChatPersistence] Loaded ${sessions.length} sessions for user:`, userId);
      return sessions;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Save message to Firebase
   */
  public async saveMessage(message: Message): Promise<void> {
    try {
      const messageDoc: MessageDocument = {
        id: message.id,
        sessionId: message.sessionId,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        timestamp: Timestamp.fromDate(message.timestamp),
        target: message.target,
        attachments: message.attachments,
        delivered: message.delivered,
        read: message.read,
        readBy: [],
        metadata: message.metadata
      };

      // Use batch operation for message + session update
      const batch = writeBatch(db);
      
      // Add message
      batch.set(doc(db, this.COLLECTIONS.messages, message.id), messageDoc);
      
      // Update session last activity and message info
      batch.update(doc(db, this.COLLECTIONS.sessions, message.sessionId), {
        lastActivity: messageDoc.timestamp,
        lastMessageId: message.id,
        lastMessageTimestamp: messageDoc.timestamp
      });

      await batch.commit();
      
      console.log('✅ [FirebaseChatPersistence] Saved message:', message.id);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to save message:', error);
      throw error;
    }
  }

  /**
   * Get messages for session
   */
  public async getSessionMessages(sessionId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.messages),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await new Promise<any>((resolve, reject) => {
        const unsubscribe = onSnapshot(q, resolve, reject);
        this.activeListeners.set(`messages_${sessionId}`, unsubscribe);
      });

      const messages: Message[] = [];
      
      snapshot.docs.reverse().forEach((doc: any) => {
        const data = doc.data() as MessageDocument;
        
        const message: Message = {
          id: data.id,
          sessionId: data.sessionId,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          timestamp: data.timestamp.toDate(),
          target: data.target,
          attachments: data.attachments,
          delivered: data.delivered,
          read: data.read,
          metadata: data.metadata
        };
        
        messages.push(message);
      });

      console.log(`💬 [FirebaseChatPersistence] Loaded ${messages.length} messages for session:`, sessionId);
      return messages;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get session messages:', error);
      return [];
    }
  }

  /**
   * Save participant to Firebase
   */
  public async saveParticipant(sessionId: string, participant: Participant): Promise<void> {
    try {
      const participantDoc: ParticipantDocument = {
        sessionId,
        userId: participant.userId,
        name: participant.name,
        displayName: participant.displayName,
        avatar: participant.avatar,
        role: participant.role,
        joinedAt: Timestamp.fromDate(participant.joinedAt),
        lastSeen: Timestamp.fromDate(participant.lastSeen),
        isOnline: participant.isOnline,
        permissions: participant.permissions,
        metadata: participant.metadata
      };

      const docId = `${sessionId}_${participant.userId}`;
      await setDoc(doc(db, this.COLLECTIONS.participants, docId), participantDoc);
      
      // Update session participant list
      await updateDoc(doc(db, this.COLLECTIONS.sessions, sessionId), {
        participantIds: arrayUnion(participant.userId),
        participantCount: (await this.getSessionParticipants(sessionId)).length + 1
      });
      
      console.log('✅ [FirebaseChatPersistence] Saved participant:', participant.userId, 'to session:', sessionId);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to save participant:', error);
      throw error;
    }
  }

  /**
   * Remove participant from Firebase
   */
  public async removeParticipant(sessionId: string, userId: string): Promise<void> {
    try {
      const docId = `${sessionId}_${userId}`;
      await deleteDoc(doc(db, this.COLLECTIONS.participants, docId));
      
      // Update session participant list
      await updateDoc(doc(db, this.COLLECTIONS.sessions, sessionId), {
        participantIds: arrayRemove(userId),
        participantCount: Math.max(0, (await this.getSessionParticipants(sessionId)).length - 1)
      });
      
      console.log('✅ [FirebaseChatPersistence] Removed participant:', userId, 'from session:', sessionId);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to remove participant:', error);
      throw error;
    }
  }

  /**
   * Get session participants
   */
  public async getSessionParticipants(sessionId: string): Promise<Participant[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.participants),
        where('sessionId', '==', sessionId),
        orderBy('joinedAt', 'asc')
      );

      const snapshot = await new Promise<any>((resolve, reject) => {
        const unsubscribe = onSnapshot(q, resolve, reject);
        this.activeListeners.set(`participants_${sessionId}`, unsubscribe);
      });

      const participants: Participant[] = [];
      
      snapshot.docs.forEach((doc: any) => {
        const data = doc.data() as ParticipantDocument;
        
        const participant: Participant = {
          userId: data.userId,
          name: data.name,
          displayName: data.displayName,
          avatar: data.avatar,
          role: data.role,
          joinedAt: data.joinedAt.toDate(),
          lastSeen: data.lastSeen.toDate(),
          isOnline: data.isOnline,
          isTyping: false, // Will be updated by typing status
          permissions: data.permissions,
          metadata: data.metadata
        };
        
        participants.push(participant);
      });

      return participants;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get session participants:', error);
      return [];
    }
  }

  /**
   * Update typing status
   */
  public async updateTypingStatus(sessionId: string, userId: string, userName: string, isTyping: boolean): Promise<void> {
    try {
      const docId = `${sessionId}_${userId}`;
      const now = new Date();
      
      if (isTyping) {
        const typingDoc: TypingDocument = {
          sessionId,
          userId,
          userName,
          isTyping: true,
          timestamp: Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(new Date(now.getTime() + 5000)) // 5 seconds TTL
        };
        
        await setDoc(doc(db, this.COLLECTIONS.typing, docId), typingDoc);
      } else {
        await deleteDoc(doc(db, this.COLLECTIONS.typing, docId));
      }
      
      console.log(`⌨️ [FirebaseChatPersistence] Updated typing status:`, userId, isTyping);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to update typing status:', error);
    }
  }

  /**
   * Get typing participants for session
   */
  public async getTypingParticipants(sessionId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.typing),
        where('sessionId', '==', sessionId),
        where('isTyping', '==', true)
      );

      const snapshot = await new Promise<any>((resolve, reject) => {
        const unsubscribe = onSnapshot(q, resolve, reject);
        this.activeListeners.set(`typing_${sessionId}`, unsubscribe);
      });

      const typingUsers: any[] = [];
      
      snapshot.docs.forEach((doc: any) => {
        const data = doc.data() as TypingDocument;
        typingUsers.push({
          userId: data.userId,
          userName: data.userName,
          timestamp: data.timestamp.toDate()
        });
      });

      return typingUsers;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get typing participants:', error);
      return [];
    }
  }

  /**
   * Update user presence
   */
  public async updateUserPresence(userId: string, isOnline: boolean, activeSessions: string[] = []): Promise<void> {
    try {
      const now = new Date();
      const presenceDoc: PresenceDocument = {
        userId,
        isOnline,
        lastSeen: Timestamp.fromDate(now),
        activeSessions,
        expiresAt: Timestamp.fromDate(new Date(now.getTime() + 60000)) // 1 minute TTL
      };

      await setDoc(doc(db, this.COLLECTIONS.presence, userId), presenceDoc);
      
      console.log('📡 [FirebaseChatPersistence] Updated presence for user:', userId, isOnline);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to update user presence:', error);
    }
  }

  /**
   * Add session to user's session list
   */
  private async addUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      await setDoc(doc(db, this.COLLECTIONS.userSessions, `${userId}_${sessionId}`), {
        userId,
        sessionId,
        addedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to add user session:', error);
    }
  }

  /**
   * Set up real-time listener for session
   */
  public setupSessionListener(sessionId: string, callback: (session: ChatSession | null) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(db, this.COLLECTIONS.sessions, sessionId),
      async (doc) => {
        if (doc.exists()) {
          const data = doc.data() as SessionDocument;
          const session: ChatSession = {
            id: data.id,
            name: data.name,
            mode: data.mode,
            participants: await this.getSessionParticipants(data.id),
            hostUserId: data.hostUserId,
            agentId: data.agentId,
            createdAt: data.createdAt.toDate(),
            lastActivity: data.lastActivity.toDate(),
            metadata: data.metadata
          };
          callback(session);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('❌ [FirebaseChatPersistence] Session listener error:', error);
        callback(null);
      }
    );

    this.activeListeners.set(`session_${sessionId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Remove undefined fields from object recursively to prevent Firebase errors
   */
  private removeUndefinedFields(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item));
    }

    const cleaned: any = {};
    let removedFields: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = this.removeUndefinedFields(value);
      } else {
        removedFields.push(key);
      }
    }
    
    if (removedFields.length > 0) {
      console.log('🧹 [FirebaseChatPersistence] Removed undefined fields:', removedFields);
    }
    
    return cleaned;
  }

  // ==================== THREADING METHODS ====================

  /**
   * Save a thread to Firebase
   */
  public async saveThread(thread: Thread): Promise<void> {
    try {
      const threadsRef = collection(this.db, 'threads');
      const cleanThread = this.removeUndefinedFields(thread);
      
      await setDoc(doc(threadsRef, thread.id), cleanThread);
      
      console.log('💾 [FirebaseChatPersistence] Thread saved:', thread.id);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to save thread:', error);
      throw error;
    }
  }

  /**
   * Update a thread in Firebase
   */
  public async updateThread(thread: Thread): Promise<void> {
    try {
      const threadRef = doc(this.db, 'threads', thread.id);
      const cleanThread = this.removeUndefinedFields(thread);
      
      await updateDoc(threadRef, cleanThread);
      
      console.log('💾 [FirebaseChatPersistence] Thread updated:', thread.id);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to update thread:', error);
      throw error;
    }
  }

  /**
   * Get a thread from Firebase
   */
  public async getThread(threadId: string): Promise<Thread | null> {
    try {
      const threadRef = doc(this.db, 'threads', threadId);
      const threadSnap = await getDoc(threadRef);
      
      if (threadSnap.exists()) {
        return threadSnap.data() as Thread;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get thread:', error);
      return null;
    }
  }

  /**
   * Get all threads for a session
   */
  public async getSessionThreads(sessionId: string): Promise<Thread[]> {
    try {
      const threadsRef = collection(this.db, 'threads');
      const q = query(
        threadsRef,
        where('sessionId', '==', sessionId),
        orderBy('lastActivityAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const threads: Thread[] = [];
      
      querySnapshot.forEach((doc) => {
        threads.push(doc.data() as Thread);
      });
      
      return threads;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get session threads:', error);
      return [];
    }
  }

  /**
   * Save a thread message to Firebase
   */
  public async saveThreadMessage(message: ThreadMessage): Promise<void> {
    try {
      // Save to regular messages collection with thread metadata
      await this.saveMessage(message);
      
      // Also save to thread-specific messages subcollection for efficient querying
      const threadMessagesRef = collection(this.db, 'threads', message.threadId, 'messages');
      const cleanMessage = this.removeUndefinedFields(message);
      
      await setDoc(doc(threadMessagesRef, message.id), cleanMessage);
      
      console.log('💾 [FirebaseChatPersistence] Thread message saved:', {
        messageId: message.id,
        threadId: message.threadId
      });
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to save thread message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a thread
   */
  public async getThreadMessages(threadId: string, limit?: number, offset?: number): Promise<ThreadMessage[]> {
    try {
      const threadMessagesRef = collection(this.db, 'threads', threadId, 'messages');
      let q = query(threadMessagesRef, orderBy('timestamp', 'asc'));
      
      if (limit) {
        q = query(q, limitToLast(limit));
      }
      
      const querySnapshot = await getDocs(q);
      const messages: ThreadMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        messages.push(doc.data() as ThreadMessage);
      });
      
      return messages;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get thread messages:', error);
      return [];
    }
  }

  /**
   * Search threads
   */
  public async searchThreads(sessionId: string, criteria: ThreadSearchCriteria): Promise<Thread[]> {
    try {
      const threadsRef = collection(this.db, 'threads');
      let q = query(threadsRef, where('sessionId', '==', sessionId));
      
      // Apply status filter
      if (criteria.status && criteria.status.length > 0) {
        q = query(q, where('status', 'in', criteria.status));
      }
      
      // Apply participant filter
      if (criteria.participants && criteria.participants.length > 0) {
        q = query(q, where('participants', 'array-contains-any', criteria.participants));
      }
      
      // Apply date range filter
      if (criteria.dateRange) {
        q = query(q, 
          where('createdAt', '>=', criteria.dateRange.start),
          where('createdAt', '<=', criteria.dateRange.end)
        );
      }
      
      // Apply sorting
      const sortBy = criteria.sortBy || 'lastActivityAt';
      const sortDirection = criteria.sortDirection || 'desc';
      q = query(q, orderBy(sortBy, sortDirection));
      
      // Apply limit
      if (criteria.limit) {
        q = query(q, limit(criteria.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const threads: Thread[] = [];
      
      querySnapshot.forEach((doc) => {
        const thread = doc.data() as Thread;
        
        // Apply text search filter (client-side for now)
        if (criteria.query) {
          const query = criteria.query.toLowerCase();
          const matchesTitle = thread.title.toLowerCase().includes(query);
          const matchesDescription = thread.description?.toLowerCase().includes(query);
          const matchesTags = thread.metadata.tags?.some(tag => 
            tag.toLowerCase().includes(query)
          );
          
          if (matchesTitle || matchesDescription || matchesTags) {
            threads.push(thread);
          }
        } else {
          threads.push(thread);
        }
      });
      
      return threads;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to search threads:', error);
      return [];
    }
  }

  /**
   * Save thread activity
   */
  public async saveThreadActivity(activity: ThreadActivity): Promise<void> {
    try {
      const activitiesRef = collection(this.db, 'thread_activities');
      const cleanActivity = this.removeUndefinedFields(activity);
      
      await setDoc(doc(activitiesRef, activity.id), cleanActivity);
      
      console.log('💾 [FirebaseChatPersistence] Thread activity saved:', activity.id);
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to save thread activity:', error);
      throw error;
    }
  }

  /**
   * Get thread activities
   */
  public async getThreadActivities(sessionId: string, limit: number = 50): Promise<ThreadActivity[]> {
    try {
      // Get all threads for the session first
      const threads = await this.getSessionThreads(sessionId);
      const threadIds = threads.map(t => t.id);
      
      if (threadIds.length === 0) return [];
      
      const activitiesRef = collection(this.db, 'thread_activities');
      const q = query(
        activitiesRef,
        where('threadId', 'in', threadIds),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const activities: ThreadActivity[] = [];
      
      querySnapshot.forEach((doc) => {
        activities.push(doc.data() as ThreadActivity);
      });
      
      return activities;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to get thread activities:', error);
      return [];
    }
  }

  /**
   * Listen to thread changes
   */
  public listenToThreads(sessionId: string, callback: (threads: Thread[]) => void): () => void {
    try {
      const threadsRef = collection(this.db, 'threads');
      const q = query(
        threadsRef,
        where('sessionId', '==', sessionId),
        orderBy('lastActivityAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const threads: Thread[] = [];
        querySnapshot.forEach((doc) => {
          threads.push(doc.data() as Thread);
        });
        callback(threads);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to listen to threads:', error);
      return () => {};
    }
  }

  /**
   * Listen to thread messages
   */
  public listenToThreadMessages(threadId: string, callback: (messages: ThreadMessage[]) => void): () => void {
    try {
      const threadMessagesRef = collection(this.db, 'threads', threadId, 'messages');
      const q = query(threadMessagesRef, orderBy('timestamp', 'asc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: ThreadMessage[] = [];
        querySnapshot.forEach((doc) => {
          messages.push(doc.data() as ThreadMessage);
        });
        callback(messages);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ [FirebaseChatPersistence] Failed to listen to thread messages:', error);
      return () => {};
    }
  }

  // ==================== END THREADING METHODS ====================

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 [FirebaseChatPersistence] Cleaning up');
    
    // Update user presence to offline
    if (this.user) {
      await this.updateUserPresence(this.user.uid, false);
    }
    
    // Unsubscribe from all listeners
    for (const unsubscribe of this.activeListeners.values()) {
      unsubscribe();
    }
    
    this.activeListeners.clear();
    this.batchOperations.clear();
    this.user = null;
  }
}

export default FirebaseChatPersistence;

