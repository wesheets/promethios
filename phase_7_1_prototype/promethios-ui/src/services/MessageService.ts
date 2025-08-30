import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Timestamp | Date;
  isRead: boolean;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantNames: { [userId: string]: string };
  participantAvatars: { [userId: string]: string };
  lastMessage?: ChatMessage;
  lastMessageTime?: Timestamp | Date;
  unreadCounts: { [userId: string]: number };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export class MessageService {
  private static instance: MessageService;

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(
    currentUserId: string, 
    otherUserId: string,
    currentUserName: string,
    otherUserName: string,
    currentUserAvatar?: string,
    otherUserAvatar?: string
  ): Promise<string> {
    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', currentUserId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Look for existing conversation with both users
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as ChatConversation;
        if (data.participants.includes(otherUserId)) {
          return docSnap.id;
        }
      }
      
      // Create new conversation if none exists
      const newConversation: Omit<ChatConversation, 'id'> = {
        participants: [currentUserId, otherUserId],
        participantNames: {
          [currentUserId]: currentUserName,
          [otherUserId]: otherUserName
        },
        participantAvatars: {
          [currentUserId]: currentUserAvatar || '',
          [otherUserId]: otherUserAvatar || ''
        },
        unreadCounts: {
          [currentUserId]: 0,
          [otherUserId]: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(conversationsRef, newConversation);
      return docRef.id;
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    content: string,
    senderAvatar?: string,
    type: 'text' | 'file' | 'image' = 'text',
    fileUrl?: string,
    fileName?: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'messages');
      
      const newMessage: Omit<ChatMessage, 'id'> = {
        conversationId,
        senderId,
        senderName,
        senderAvatar,
        content,
        timestamp: serverTimestamp(),
        isRead: false,
        type,
        fileUrl,
        fileName
      };
      
      // Add the message
      await addDoc(messagesRef, newMessage);
      
      // Update conversation with last message and increment unread count
      const conversationRef = doc(db, 'conversations', conversationId);
      
      // Get current conversation to update unread counts
      const conversationDoc = await getDocs(
        query(collection(db, 'conversations'), where('__name__', '==', conversationId))
      );
      
      if (!conversationDoc.empty) {
        const conversationData = conversationDoc.docs[0].data() as ChatConversation;
        const updatedUnreadCounts = { ...conversationData.unreadCounts };
        
        // Increment unread count for all participants except sender
        conversationData.participants.forEach(participantId => {
          if (participantId !== senderId) {
            updatedUnreadCounts[participantId] = (updatedUnreadCounts[participantId] || 0) + 1;
          }
        });
        
        await updateDoc(conversationRef, {
          lastMessage: newMessage,
          lastMessageTime: serverTimestamp(),
          unreadCounts: updatedUnreadCounts,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as ChatMessage);
      });
      callback(messages);
    });
  }

  /**
   * Get conversations for a user
   */
  subscribeToConversations(
    userId: string,
    callback: (conversations: ChatConversation[]) => void
  ): () => void {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const conversations: ChatConversation[] = [];
      querySnapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        } as ChatConversation);
      });
      callback(conversations);
    });
  }

  /**
   * Mark messages as read in a conversation
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Update conversation unread count
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDocs(
        query(collection(db, 'conversations'), where('__name__', '==', conversationId))
      );
      
      if (!conversationDoc.empty) {
        const conversationData = conversationDoc.docs[0].data() as ChatConversation;
        const updatedUnreadCounts = { ...conversationData.unreadCounts };
        updatedUnreadCounts[userId] = 0;
        
        await updateDoc(conversationRef, {
          unreadCounts: updatedUnreadCounts
        });
      }
      
      // Mark individual messages as read
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(docSnap => 
        updateDoc(doc(db, 'messages', docSnap.id), { isRead: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get current user ID from auth
   */
  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  /**
   * Get current user display name from auth
   */
  getCurrentUserName(): string {
    return auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown User';
  }

  /**
   * Get current user avatar from auth
   */
  getCurrentUserAvatar(): string | undefined {
    return auth.currentUser?.photoURL || undefined;
  }
}

export default MessageService;

