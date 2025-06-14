import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { ChatSession, ChatConfiguration, SessionMetadata, ChatMode } from '../types';

export class ChatSessionRegistry {
  private static readonly COLLECTION_NAME = 'chat-sessions';

  /**
   * Create a new chat session
   */
  static async createSession(
    userId: string,
    title: string,
    mode: ChatMode,
    configuration: ChatConfiguration,
    agentId?: string,
    systemId?: string,
    agentIds?: string[]
  ): Promise<string> {
    try {
      const sessionData: Omit<ChatSession, 'id'> = {
        userId,
        title,
        mode,
        agentId,
        systemId,
        agentIds,
        configuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        isActive: true,
        metadata: {
          totalCost: 0,
          totalTokens: 0,
          averageResponseTime: 0,
          governanceSummary: {
            averageComplianceScore: 0,
            averageTrustScore: 0,
            totalViolations: 0,
            riskDistribution: {
              low: 0,
              medium: 0,
              high: 0,
              critical: 0
            }
          }
        }
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...sessionData,
        createdAt: Timestamp.fromDate(sessionData.createdAt),
        updatedAt: Timestamp.fromDate(sessionData.updatedAt),
        lastActivity: Timestamp.fromDate(sessionData.lastActivity)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  /**
   * Get all chat sessions for a user
   */
  static async getUserSessions(userId: string, activeOnly: boolean = false): Promise<ChatSession[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('lastActivity', 'desc')
      );

      if (activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastActivity: data.lastActivity.toDate()
        } as ChatSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  /**
   * Get a specific chat session
   */
  static async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastActivity: data.lastActivity.toDate()
        } as ChatSession;
      }

      return null;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  /**
   * Update session activity and metadata
   */
  static async updateSessionActivity(
    sessionId: string,
    messageCount?: number,
    metadata?: Partial<SessionMetadata>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const updateData: any = {
        lastActivity: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (messageCount !== undefined) {
        updateData.messageCount = messageCount;
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating session activity:', error);
      throw error;
    }
  }

  /**
   * Update session configuration
   */
  static async updateSessionConfiguration(
    sessionId: string,
    configuration: Partial<ChatConfiguration>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      await updateDoc(docRef, {
        configuration,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating session configuration:', error);
      throw error;
    }
  }

  /**
   * Archive a chat session (set inactive)
   */
  static async archiveSession(sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error archiving session:', error);
      throw error;
    }
  }

  /**
   * Delete a chat session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Get recent sessions for a user
   */
  static async getRecentSessions(userId: string, limitCount: number = 10): Promise<ChatSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('lastActivity', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastActivity: data.lastActivity.toDate()
        } as ChatSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user sessions with real-time updates
   */
  static subscribeToUserSessions(
    userId: string,
    callback: (sessions: ChatSession[]) => void,
    activeOnly: boolean = false
  ): () => void {
    let q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('lastActivity', 'desc')
    );

    if (activeOnly) {
      q = query(q, where('isActive', '==', true));
    }

    return onSnapshot(q, (querySnapshot) => {
      const sessions: ChatSession[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastActivity: data.lastActivity.toDate()
        } as ChatSession);
      });
      callback(sessions);
    });
  }

  /**
   * Subscribe to a specific session with real-time updates
   */
  static subscribeToSession(
    sessionId: string,
    callback: (session: ChatSession | null) => void
  ): () => void {
    const docRef = doc(db, this.COLLECTION_NAME, sessionId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const session: ChatSession = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastActivity: data.lastActivity.toDate()
        } as ChatSession;
        callback(session);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get sessions by agent ID
   */
  static async getSessionsByAgent(userId: string, agentId: string): Promise<ChatSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('agentId', '==', agentId),
        orderBy('lastActivity', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastActivity: data.lastActivity.toDate()
        } as ChatSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching sessions by agent:', error);
      throw error;
    }
  }

  /**
   * Get sessions by multi-agent system ID
   */
  static async getSessionsBySystem(userId: string, systemId: string): Promise<ChatSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('systemId', '==', systemId),
        orderBy('lastActivity', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastActivity: data.lastActivity.toDate()
        } as ChatSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching sessions by system:', error);
      throw error;
    }
  }
}

