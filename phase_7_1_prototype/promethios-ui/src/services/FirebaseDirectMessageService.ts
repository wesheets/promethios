import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  or,
  and
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';

export interface DirectMessage {
  id: string;
  participantIds: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage?: string;
  lastMessageBy?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
  isOnline?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserConnection {
  id: string;
  userId: string;
  connectedUserId: string;
  connectedUserName: string;
  connectedUserAvatar?: string;
  connectedUserTitle?: string;
  connectedUserCompany?: string;
  status: 'pending' | 'accepted' | 'blocked';
  isOnline?: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDirectMessageRequest {
  recipientId: string;
  initialMessage?: string;
}

/**
 * Firebase service for managing direct messages and user connections
 */
export class FirebaseDirectMessageService {
  private static instance: FirebaseDirectMessageService;
  private currentUserId: string | null = null;

  constructor() {
    this.initializeCurrentUser();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): FirebaseDirectMessageService {
    if (!FirebaseDirectMessageService.instance) {
      FirebaseDirectMessageService.instance = new FirebaseDirectMessageService();
    }
    return FirebaseDirectMessageService.instance;
  }

  /**
   * Initialize current user ID from Firebase Auth
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
      const auth = getAuth();
      
      if (auth.currentUser) {
        this.currentUserId = auth.currentUser.uid;
      }
      
      // Listen for auth state changes
      auth.onAuthStateChanged((user) => {
        this.currentUserId = user?.uid || null;
      });
    } catch (error) {
      console.error('Error initializing current user:', error);
    }
  }

  /**
   * Create or get existing conversation between two users
   */
  async createOrGetConversation(
    userId1: string, 
    userId2: string, 
    userInfo?: {
      userName?: string;
      userAvatar?: string;
      connectedUserName?: string;
      connectedUserAvatar?: string;
    }
  ): Promise<string> {
    try {
      console.log('🔍 [FirebaseDirectMessageService] Creating or getting conversation:', { userId1, userId2 });

      // Check if conversation already exists
      const existingConversation = await this.findExistingConversation(userId1, userId2);
      if (existingConversation) {
        console.log('✅ [FirebaseDirectMessageService] Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }

      // Create new conversation
      const conversationData = {
        participantIds: [userId1, userId2],
        participantNames: [
          userInfo?.userName || 'User',
          userInfo?.connectedUserName || 'User'
        ],
        participantAvatars: [
          userInfo?.userAvatar || '',
          userInfo?.connectedUserAvatar || ''
        ],
        lastMessage: '',
        lastMessageBy: '',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add conversation to Firestore
      const docRef = await addDoc(collection(db, 'directMessages'), conversationData);
      
      console.log('✅ [FirebaseDirectMessageService] Created new conversation:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error creating/getting conversation:', error);
      throw error;
    }
  }

  /**
   * Create or get existing direct message conversation
   */
  async createDirectMessage(request: CreateDirectMessageRequest): Promise<string> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to create a direct message');
      }

      // Check if conversation already exists
      const existingConversation = await this.findExistingConversation(currentUser.uid, request.recipientId);
      if (existingConversation) {
        return existingConversation.id;
      }

      // Get user profiles
      const currentUserProfile = await this.getUserProfile(currentUser.uid);
      const recipientProfile = await this.getUserProfile(request.recipientId);

      const currentUserName = currentUserProfile?.name || currentUser.displayName || 'Unknown User';
      const recipientName = recipientProfile?.name || recipientProfile?.displayName || 'Unknown User';

      // Create new conversation
      const conversationData = {
        participantIds: [currentUser.uid, request.recipientId],
        participantNames: [currentUserName, recipientName],
        participantAvatars: [
          currentUserProfile?.avatar || currentUser.photoURL || '',
          recipientProfile?.avatar || recipientProfile?.photoURL || ''
        ],
        lastMessage: request.initialMessage || '',
        lastMessageBy: currentUser.uid,
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add conversation to Firestore
      const docRef = await addDoc(collection(db, 'directMessages'), conversationData);
      
      // If there's an initial message, add it to the messages subcollection
      if (request.initialMessage) {
        await this.addMessageToConversation(docRef.id, {
          senderId: currentUser.uid,
          senderName: currentUserName,
          content: request.initialMessage,
          timestamp: new Date()
        });
      }

      console.log('✅ [FirebaseDirectMessageService] Direct message created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error creating direct message:', error);
      throw error;
    }
  }

  /**
   * Get user's direct message conversations
   */
  async getUserDirectMessages(): Promise<DirectMessage[]> {
    try {
      // Ensure we have the current user ID
      const auth = getAuth();
      if (auth.currentUser && !this.currentUserId) {
        this.currentUserId = auth.currentUser.uid;
        console.log('🔧 [FirebaseDirectMessageService] Updated currentUserId from auth:', this.currentUserId);
      }
      
      console.log('🔍 [FirebaseDirectMessageService] Getting user direct messages for:', this.currentUserId);
      
      if (!this.currentUserId) {
        console.log('⚠️ [FirebaseDirectMessageService] No current user ID available');
        return [];
      }

      const messagesRef = collection(db, 'directMessages');
      // Simplified query to avoid Firebase index requirement
      const q = query(
        messagesRef,
        where('participantIds', 'array-contains', this.currentUserId)
      );

      const snapshot = await getDocs(q);
      const messages: DirectMessage[] = [];
      
      console.log('🔍 [FirebaseDirectMessageService] Query returned', snapshot.size, 'documents');

      snapshot.forEach((doc) => {
        console.log('🔍 [FirebaseDirectMessageService] Processing document:', doc.id, doc.data());
        const data = doc.data();
        messages.push({
          id: doc.id,
          participantIds: data.participantIds || [],
          participantNames: data.participantNames || [],
          participantAvatars: data.participantAvatars || [],
          lastMessage: data.lastMessage,
          lastMessageBy: data.lastMessageBy,
          lastMessageAt: data.lastMessageAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      // Sort manually by lastMessageAt (descending) to replace orderBy
      messages.sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime; // Descending order (newest first)
      });

      console.log('✅ [FirebaseDirectMessageService] Returning', messages.length, 'direct messages:', messages);
      return messages;
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error fetching direct messages:', error);
      return [];
    }
  }

  /**
   * Get user's connections
   */
  async getUserConnections(): Promise<UserConnection[]> {
    try {
      if (!this.currentUserId) {
        return [];
      }

      const connectionsRef = collection(db, 'userConnections');
      // Simplified query to avoid Firebase index requirement
      const q = query(
        connectionsRef,
        where('userId', '==', this.currentUserId),
        where('status', '==', 'accepted')
      );

      const snapshot = await getDocs(q);
      const connections: UserConnection[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Get connected user's profile for latest info
        const connectedUserProfile = await this.getUserProfile(data.connectedUserId);
        
        connections.push({
          id: docSnap.id,
          userId: data.userId,
          connectedUserId: data.connectedUserId,
          connectedUserName: connectedUserProfile?.name || data.connectedUserName || 'Unknown User',
          connectedUserAvatar: connectedUserProfile?.avatar || data.connectedUserAvatar || '',
          connectedUserTitle: connectedUserProfile?.title || data.connectedUserTitle || '',
          connectedUserCompany: connectedUserProfile?.company || data.connectedUserCompany || '',
          status: data.status,
          isOnline: await this.getUserOnlineStatus(data.connectedUserId),
          lastSeen: data.lastSeen?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      }

      // Sort by updatedAt manually to replace orderBy
      connections.sort((a, b) => {
        const aTime = a.updatedAt?.getTime() || 0;
        const bTime = b.updatedAt?.getTime() || 0;
        return bTime - aTime; // Descending order
      });

      return connections;
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error fetching user connections:', error);
      return [];
    }
  }

  /**
   * Find existing conversation between two users
   */
  private async findExistingConversation(userId1: string, userId2: string): Promise<DirectMessage | null> {
    try {
      const messagesRef = collection(db, 'directMessages');
      const q = query(
        messagesRef,
        where('participantIds', 'array-contains', userId1)
      );

      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const participantIds = data.participantIds || [];
        
        if (participantIds.includes(userId2) && participantIds.length === 2) {
          return {
            id: doc.id,
            participantIds: data.participantIds || [],
            participantNames: data.participantNames || [],
            participantAvatars: data.participantAvatars || [],
            lastMessage: data.lastMessage,
            lastMessageBy: data.lastMessageBy,
            lastMessageAt: data.lastMessageAt?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error finding existing conversation:', error);
      return null;
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessageToConversation(conversationId: string, message: {
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    type?: string;
  }): Promise<void> {
    try {
      console.log('💬 [FirebaseDirectMessageService] Adding message to conversation:', conversationId);

      // Add message to messages subcollection
      const messagesRef = collection(db, 'directMessages', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        type: message.type || 'text',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Update conversation's last message info
      const conversationRef = doc(db, 'directMessages', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: message.content,
        lastMessageBy: message.senderId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ [FirebaseDirectMessageService] Message added and conversation updated');
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error adding message to conversation:', error);
      throw error;
    }
  }

  /**
   * Get user profile data
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const userProfilesRef = collection(db, 'userProfiles');
      const q = query(userProfilesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }

      // Fallback to users collection
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('uid', '==', userId));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        return userSnapshot.docs[0].data();
      }

      return null;
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get user's online status
   */
  private async getUserOnlineStatus(userId: string): Promise<boolean> {
    try {
      const presenceRef = doc(db, 'userPresence', userId);
      const presenceDoc = await getDoc(presenceRef);
      
      if (presenceDoc.exists()) {
        const data = presenceDoc.data();
        return data.status === 'online';
      }
      
      return false;
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error fetching user online status:', error);
      return false;
    }
  }

  /**
   * Get messages from a conversation
   */
  async getConversationMessages(conversationId: string): Promise<any[]> {
    try {
      const messagesRef = collection(db, 'directMessages', conversationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      
      const messages: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      return messages;
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error fetching conversation messages:', error);
      return [];
    }
  }

  /**
   * Update conversation's last message info
   */
  async updateConversationLastMessage(conversationId: string, message: string, senderId: string): Promise<void> {
    try {
      const conversationRef = doc(db, 'directMessages', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: message,
        lastMessageBy: senderId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ [FirebaseDirectMessageService] Error updating conversation last message:', error);
    }
  }
}

// Create singleton instance
export const firebaseDirectMessageService = new FirebaseDirectMessageService();

