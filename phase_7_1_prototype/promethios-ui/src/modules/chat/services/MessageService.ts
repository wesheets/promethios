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
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { 
  ChatMessage, 
  MessageAttachment, 
  MessageMetadata, 
  GovernanceMetrics,
  MessageType,
  MessageSender 
} from '../types';

export class MessageService {
  private static readonly COLLECTION_NAME = 'chat-messages';

  /**
   * Send a message in a chat session
   */
  static async sendMessage(
    sessionId: string,
    userId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    attachments?: MessageAttachment[],
    metadata?: MessageMetadata,
    agentId?: string,
    systemId?: string
  ): Promise<string> {
    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        sessionId,
        userId,
        agentId,
        systemId,
        content,
        type,
        sender: MessageSender.USER,
        timestamp: new Date(),
        attachments,
        metadata
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...messageData,
        timestamp: Timestamp.fromDate(messageData.timestamp)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Add agent response to a chat session
   */
  static async addAgentResponse(
    sessionId: string,
    userId: string,
    content: string,
    agentId?: string,
    systemId?: string,
    metadata?: MessageMetadata,
    governanceMetrics?: GovernanceMetrics,
    type: MessageType = MessageType.TEXT
  ): Promise<string> {
    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        sessionId,
        userId,
        agentId,
        systemId,
        content,
        type,
        sender: systemId ? MessageSender.MULTI_AGENT : MessageSender.AGENT,
        timestamp: new Date(),
        metadata,
        governanceMetrics
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...messageData,
        timestamp: Timestamp.fromDate(messageData.timestamp)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding agent response:', error);
      throw error;
    }
  }

  /**
   * Add system message (errors, notifications, etc.)
   */
  static async addSystemMessage(
    sessionId: string,
    userId: string,
    content: string,
    type: MessageType = MessageType.SYSTEM
  ): Promise<string> {
    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        sessionId,
        userId,
        content,
        type,
        sender: MessageSender.SYSTEM,
        timestamp: new Date()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...messageData,
        timestamp: Timestamp.fromDate(messageData.timestamp)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding system message:', error);
      throw error;
    }
  }

  /**
   * Get all messages for a chat session
   */
  static async getSessionMessages(sessionId: string, limitCount?: number): Promise<ChatMessage[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as ChatMessage);
      });

      return messages;
    } catch (error) {
      console.error('Error fetching session messages:', error);
      throw error;
    }
  }

  /**
   * Get recent messages for a session (for quick chat widget)
   */
  static async getRecentMessages(sessionId: string, count: number = 10): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'desc'),
        limit(count)
      );

      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as ChatMessage);
      });

      // Reverse to get chronological order
      return messages.reverse();
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      throw error;
    }
  }

  /**
   * Update message with governance metrics
   */
  static async updateMessageGovernance(
    messageId: string,
    governanceMetrics: GovernanceMetrics
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, messageId);
      await updateDoc(docRef, {
        governanceMetrics
      });
    } catch (error) {
      console.error('Error updating message governance:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, messageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to session messages with real-time updates
   */
  static subscribeToSessionMessages(
    sessionId: string,
    callback: (messages: ChatMessage[]) => void,
    limitCount?: number
  ): () => void {
    let q = query(
      collection(db, this.COLLECTION_NAME),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    return onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as ChatMessage);
      });
      callback(messages);
    });
  }

  /**
   * Get message statistics for a session
   */
  static async getSessionMessageStats(sessionId: string): Promise<{
    totalMessages: number;
    userMessages: number;
    agentMessages: number;
    systemMessages: number;
    averageResponseTime: number;
    totalTokens: number;
    totalCost: number;
  }> {
    try {
      const messages = await this.getSessionMessages(sessionId);
      
      const stats = {
        totalMessages: messages.length,
        userMessages: 0,
        agentMessages: 0,
        systemMessages: 0,
        averageResponseTime: 0,
        totalTokens: 0,
        totalCost: 0
      };

      let totalResponseTime = 0;
      let responseCount = 0;

      messages.forEach((message) => {
        switch (message.sender) {
          case MessageSender.USER:
            stats.userMessages++;
            break;
          case MessageSender.AGENT:
          case MessageSender.MULTI_AGENT:
            stats.agentMessages++;
            if (message.metadata?.responseTime) {
              totalResponseTime += message.metadata.responseTime;
              responseCount++;
            }
            break;
          case MessageSender.SYSTEM:
            stats.systemMessages++;
            break;
        }

        if (message.metadata?.tokenCount) {
          stats.totalTokens += message.metadata.tokenCount;
        }

        if (message.metadata?.cost) {
          stats.totalCost += message.metadata.cost;
        }
      });

      if (responseCount > 0) {
        stats.averageResponseTime = totalResponseTime / responseCount;
      }

      return stats;
    } catch (error) {
      console.error('Error calculating session message stats:', error);
      throw error;
    }
  }

  /**
   * Search messages in a session
   */
  static async searchSessionMessages(
    sessionId: string,
    searchTerm: string
  ): Promise<ChatMessage[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that fetches all messages and filters client-side
      // For production, consider using Algolia or similar service for better search
      const messages = await this.getSessionMessages(sessionId);
      
      const searchTermLower = searchTerm.toLowerCase();
      return messages.filter(message => 
        message.content.toLowerCase().includes(searchTermLower)
      );
    } catch (error) {
      console.error('Error searching session messages:', error);
      throw error;
    }
  }

  /**
   * Export session messages to JSON
   */
  static async exportSessionMessages(sessionId: string): Promise<string> {
    try {
      const messages = await this.getSessionMessages(sessionId);
      return JSON.stringify(messages, null, 2);
    } catch (error) {
      console.error('Error exporting session messages:', error);
      throw error;
    }
  }

  /**
   * Get messages with governance violations
   */
  static async getMessagesWithViolations(sessionId: string): Promise<ChatMessage[]> {
    try {
      const messages = await this.getSessionMessages(sessionId);
      return messages.filter(message => 
        message.governanceMetrics?.violations && 
        message.governanceMetrics.violations.length > 0
      );
    } catch (error) {
      console.error('Error fetching messages with violations:', error);
      throw error;
    }
  }
}

