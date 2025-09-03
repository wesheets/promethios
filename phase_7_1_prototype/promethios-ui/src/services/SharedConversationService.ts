/**
 * SharedConversationService - Manages shared human-AI conversations
 * Handles creation, participant management, and cross-platform synchronization
 */

import { HumanParticipantService, HumanParticipant } from './HumanParticipantService';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SharedConversationParticipant {
  id: string;
  name: string;
  type: 'human' | 'ai_agent';
  avatar?: string;
  isOnline?: boolean;
  status: 'active' | 'pending' | 'declined'; // Track invitation status
  role: 'creator' | 'participant';
  addedBy?: string; // ID of human who added this participant
  joinedAt: Date;
  invitedAt?: Date; // When invitation was sent
  invitationId?: string; // Reference to invitation
  permissions: string[];
}

export interface SharedConversation {
  id: string;
  name: string;
  createdBy: string; // User ID of creator
  createdAt: Date;
  lastActivity: Date;
  participants: SharedConversationParticipant[];
  isPrivateMode: boolean; // AI observation toggled off
  hasHistory: boolean; // Whether new participants can see history
  historyVisibleFrom?: Date; // How far back history is visible
  unreadCounts: { [userId: string]: number };
  settings: {
    allowParticipantInvites: boolean;
    allowAIAgents: boolean;
    allowReceiptSharing: boolean;
    maxParticipants: number;
  };
}

export interface ConversationInvitation {
  id: string;
  conversationId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toEmail: string;
  message?: string;
  includeHistory: boolean;
  historyFrom?: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface SharedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'human' | 'ai_agent';
  content: string;
  timestamp: Date;
  attachments?: any[];
  receipts?: string[]; // Receipt IDs shared in this message
  metadata?: {
    isPrivate?: boolean; // Message sent during private mode
    visibleTo?: string[]; // Specific participants who can see this
  };
}

class SharedConversationService {
  private static instance: SharedConversationService;
  private humanParticipantService: HumanParticipantService;
  private conversations: Map<string, SharedConversation> = new Map();
  private userConversations: Map<string, string[]> = new Map(); // userId -> conversationIds
  private invitations: Map<string, ConversationInvitation[]> = new Map(); // userId -> invitations
  
  // Firebase collections
  private readonly CONVERSATIONS_COLLECTION = 'shared_conversations';
  private readonly USER_CONVERSATIONS_COLLECTION = 'user_shared_conversations';
  private readonly INVITATIONS_COLLECTION = 'conversation_invitations';

  private constructor() {
    this.humanParticipantService = HumanParticipantService.getInstance();
    console.log('🤝 [SharedConversation] Service initialized with Firebase persistence');
  }

  public static getInstance(): SharedConversationService {
    if (!SharedConversationService.instance) {
      SharedConversationService.instance = new SharedConversationService();
    }
    return SharedConversationService.instance;
  }

  /**
   * Create a new shared conversation (with Firebase persistence)
   */
  async createSharedConversation(
    name: string,
    creatorId: string,
    initialParticipants: string[] = []
  ): Promise<SharedConversation> {
    const conversationId = `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: SharedConversation = {
      id: conversationId,
      name,
      createdBy: creatorId,
      createdAt: new Date(),
      lastActivity: new Date(),
      participants: [],
      isPrivateMode: false,
      hasHistory: true,
      unreadCounts: {},
      settings: {
        allowParticipantInvites: true,
        allowAIAgents: true,
        allowReceiptSharing: true,
        maxParticipants: 10
      }
    };

    // Add creator as first participant
    await this.addParticipant(conversationId, creatorId, creatorId);
    
    // Add initial participants
    for (const participantId of initialParticipants) {
      await this.addParticipant(conversationId, participantId, creatorId);
    }

    // Store in memory cache
    this.conversations.set(conversationId, conversation);
    this.addConversationToUser(creatorId, conversationId);

    try {
      // Persist to Firebase
      const participantIds = conversation.participants.map(p => p.id);
      const firestoreData = {
        ...conversation,
        participantIds, // Flat array for querying
        createdAt: Timestamp.fromDate(conversation.createdAt),
        lastActivity: Timestamp.fromDate(conversation.lastActivity)
      };
      
      await setDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), firestoreData);
      console.log('✅ [SharedConversation] Persisted to Firebase:', conversationId);
    } catch (error) {
      console.error('❌ [SharedConversation] Failed to persist to Firebase:', error);
      // Continue with in-memory version
    }

    console.log('✅ Created shared conversation:', conversationId);
    return conversation;
  }

  /**
   * Get shared conversations for a user (with Firebase persistence)
   */
  async getUserSharedConversations(userId: string): Promise<SharedConversation[]> {
    try {
      console.log('🔍 [SharedConversation] Loading conversations for user:', userId);
      
      // Query conversations where user is a participant
      const conversationsQuery = query(
        collection(db, this.CONVERSATIONS_COLLECTION),
        where('participantIds', 'array-contains', userId),
        orderBy('lastActivity', 'desc')
      );
      
      const querySnapshot = await getDocs(conversationsQuery);
      const conversations: SharedConversation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const conversation: SharedConversation = {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
          participants: data.participants || []
        } as SharedConversation;
        conversations.push(conversation);
        
        // Cache in memory for quick access
        this.conversations.set(doc.id, conversation);
      });
      
      console.log('🔍 [SharedConversation] Loaded', conversations.length, 'conversations from Firebase');
      return conversations;
    } catch (error) {
      console.error('❌ [SharedConversation] Error loading conversations:', error);
      
      // Fallback to in-memory cache
      const conversationIds = this.userConversations.get(userId) || [];
      return conversationIds
        .map(id => this.conversations.get(id))
        .filter(conv => conv !== undefined) as SharedConversation[];
    }
  }

  /**
   * Add participant to shared conversation
   */
  async addParticipant(
    conversationId: string,
    participantId: string,
    addedBy: string,
    participantName?: string
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user is already a participant
    const existingParticipant = conversation.participants.find(p => p.id === participantId);
    if (existingParticipant) {
      console.log('User already in conversation:', participantId);
      return;
    }

    // Add participant
    const participant: SharedConversationParticipant = {
      id: participantId,
      name: participantName || `User ${participantId}`,
      type: 'human',
      status: 'active', // Default to active when directly added
      role: 'participant',
      addedBy,
      joinedAt: new Date(),
      permissions: ['read', 'write'],
      isOnline: false
    };

    conversation.participants.push(participant);
    conversation.lastActivity = new Date();
    
    this.addConversationToUser(participantId, conversationId);
    
    console.log('✅ Added participant to conversation:', participantId, conversationId);
  }

  /**
   * Add pending participant (invitation sent but not accepted)
   */
  async addPendingParticipant(
    conversationId: string,
    participantId: string,
    participantName: string,
    addedBy: string,
    invitationId: string
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user is already a participant
    const existingParticipant = conversation.participants.find(p => p.id === participantId);
    if (existingParticipant) {
      console.log('User already in conversation:', participantId);
      return;
    }

    // Add pending participant
    const participant: SharedConversationParticipant = {
      id: participantId,
      name: participantName,
      type: 'human',
      status: 'pending',
      role: 'participant',
      addedBy,
      joinedAt: new Date(), // Will be updated when they actually join
      invitedAt: new Date(),
      invitationId,
      permissions: ['read', 'write'],
      isOnline: false
    };

    conversation.participants.push(participant);
    conversation.lastActivity = new Date();
    
    console.log('✅ Added pending participant to conversation:', participantId, conversationId);
  }

  /**
   * Accept invitation and activate pending participant
   */
  async activatePendingParticipant(
    conversationId: string,
    participantId: string
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const participant = conversation.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    if (participant.status !== 'pending') {
      console.log('Participant is not pending:', participantId);
      return;
    }

    // Activate the participant
    participant.status = 'active';
    participant.joinedAt = new Date();
    conversation.lastActivity = new Date();
    
    this.addConversationToUser(participantId, conversationId);
    
    console.log('✅ Activated pending participant:', participantId, conversationId);
  }

  /**
   * Remove participant and their AI agents
   */
  async removeParticipantWithAgents(
    conversationId: string,
    participantId: string,
    removedBy: string
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check permissions
    const remover = conversation.participants.find(p => p.id === removedBy);
    if (!remover || (remover.role !== 'creator' && removedBy !== participantId)) {
      throw new Error('Insufficient permissions to remove participant');
    }

    // Remove human participant and all their AI agents
    conversation.participants = conversation.participants.filter(p => 
      p.id !== participantId && p.addedBy !== participantId
    );
    
    conversation.lastActivity = new Date();
    
    // Remove conversation from user's list
    this.removeConversationFromUser(participantId, conversationId);
    
    console.log('✅ Removed participant and their agents:', participantId, conversationId);
  }

  /**
   * Add AI agent to conversation
   */
  async addAIAgent(
    conversationId: string,
    agentId: string,
    agentName: string,
    addedBy: string
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const aiAgent: SharedConversationParticipant = {
      id: agentId,
      name: agentName,
      type: 'ai_agent',
      role: 'participant',
      addedBy,
      joinedAt: new Date(),
      permissions: ['read', 'write'],
      isOnline: true
    };

    conversation.participants.push(aiAgent);
    conversation.lastActivity = new Date();
    
    console.log('✅ Added AI agent to conversation:', agentId, conversationId);
  }

  /**
   * Toggle privacy mode (AI observation)
   */
  async togglePrivacyMode(conversationId: string, isPrivate: boolean): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.isPrivateMode = isPrivate;
    conversation.lastActivity = new Date();
    
    console.log(`✅ Privacy mode ${isPrivate ? 'enabled' : 'disabled'}:`, conversationId);
  }

  /**
   * Send invitation to join conversation
   */
  async sendInvitation(
    conversationId: string,
    fromUserId: string,
    toEmail: string,
    message?: string,
    includeHistory: boolean = true,
    historyFrom?: Date
  ): Promise<ConversationInvitation> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const fromUser = conversation.participants.find(p => p.id === fromUserId);
    if (!fromUser) {
      throw new Error('User not in conversation');
    }

    const invitation: ConversationInvitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      fromUserId,
      fromUserName: fromUser.name,
      toUserId: '', // Will be set when user accepts
      toEmail,
      message,
      includeHistory,
      historyFrom,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    // Store invitation (in real app, this would be in database)
    const userInvitations = this.invitations.get(toEmail) || [];
    userInvitations.push(invitation);
    this.invitations.set(toEmail, userInvitations);

    // Send email notification (mock)
    await this.sendEmailNotification(invitation);
    
    console.log('✅ Sent conversation invitation:', invitation.id);
    return invitation;
  }

  /**
   * Get pending invitations for user
   */
  getPendingInvitations(userEmail: string): ConversationInvitation[] {
    const invitations = this.invitations.get(userEmail) || [];
    return invitations.filter(inv => 
      inv.status === 'pending' && inv.expiresAt > new Date()
    );
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    invitationId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    // Find invitation across all users
    let invitation: ConversationInvitation | undefined;
    for (const [email, invitations] of this.invitations.entries()) {
      invitation = invitations.find(inv => inv.id === invitationId);
      if (invitation) break;
    }

    if (!invitation || invitation.status !== 'pending') {
      throw new Error('Invalid or expired invitation');
    }

    // Add user to conversation
    await this.addParticipant(
      invitation.conversationId,
      userId,
      invitation.fromUserId,
      userName
    );

    // Update invitation status
    invitation.status = 'accepted';
    invitation.toUserId = userId;
    
    console.log('✅ Accepted invitation:', invitationId);
  }

  /**
   * Update participant online status
   */
  async updateParticipantStatus(
    conversationId: string,
    participantId: string,
    isOnline: boolean
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    const participant = conversation.participants.find(p => p.id === participantId);
    if (participant) {
      participant.isOnline = isOnline;
    }
  }

  /**
   * Create shared conversation from collaboration invitation
   * Integrates with the notification system for seamless collaboration
   */
  async createSharedConversationFromInvitation(params: {
    invitationId: string;
    conversationName: string;
    agentName: string;
    fromUserId: string;
    fromUserName: string;
    fromUserPhoto?: string;
    toUserId: string;
    includeHistory: boolean;
  }): Promise<SharedConversation> {
    const {
      invitationId,
      conversationName,
      agentName,
      fromUserId,
      fromUserName,
      fromUserPhoto,
      toUserId,
      includeHistory
    } = params;

    console.log('🤝 [SharedConversation] Creating conversation from collaboration invitation:', invitationId);

    // Create the shared conversation with correct parameters
    const conversation = await this.createSharedConversation(
      fromUserId,
      fromUserName,
      conversationName,
      [] // initialParticipants - we'll add them separately
    );

    const conversationId = conversation.id;
    console.log('✅ [SharedConversation] Created conversation:', conversationId);

    // Update conversation settings for collaboration
    if (this.conversations.has(conversationId)) {
      const conv = this.conversations.get(conversationId)!;
      conv.allowParticipantInvites = true;
      conv.allowAIAgents = true;
      conv.allowReceiptSharing = true;
      conv.maxParticipants = 10;
    }

    // Get the created conversation to verify it exists
    const createdConversation = this.conversations.get(conversationId);
    if (!createdConversation) {
      throw new Error('Failed to create shared conversation');
    }

    // Add the AI agent as a participant
    await this.addParticipant(conversationId, `ai-${agentName.toLowerCase().replace(/\s+/g, '-')}`, fromUserId, agentName, 'ai_agent');

    // Add the invited user as a participant
    await this.addParticipant(conversationId, toUserId, fromUserId, 'Invited User', 'human');

    // Set history visibility if requested
    if (includeHistory) {
      createdConversation.hasHistory = true;
      createdConversation.historyVisibleFrom = new Date();
    }

    // Store reference to the original invitation
    const invitedParticipant = createdConversation.participants.find(p => p.id === toUserId);
    if (invitedParticipant) {
      invitedParticipant.invitationId = invitationId;
      invitedParticipant.status = 'active'; // They accepted the invitation
    }

    console.log('✅ [SharedConversation] Created conversation from invitation:', {
      conversationId,
      participants: createdConversation.participants.length,
      name: conversationName
    });

    return createdConversation;
  }

  /**
   * Private helper methods
   */
  private addConversationToUser(userId: string, conversationId: string): void {
    const userConversations = this.userConversations.get(userId) || [];
    if (!userConversations.includes(conversationId)) {
      userConversations.push(conversationId);
      this.userConversations.set(userId, userConversations);
    }
  }

  private removeConversationFromUser(userId: string, conversationId: string): void {
    const userConversations = this.userConversations.get(userId) || [];
    const filtered = userConversations.filter(id => id !== conversationId);
    this.userConversations.set(userId, filtered);
  }

  private async sendEmailNotification(invitation: ConversationInvitation): Promise<void> {
    // Mock email notification
    console.log('📧 Sending email invitation to:', invitation.toEmail);
    console.log('📧 From:', invitation.fromUserName);
    console.log('📧 Message:', invitation.message || 'Join our AI conversation!');
    
    // In real implementation, this would use an email service
    // like SendGrid, AWS SES, or similar
  }
}

export default SharedConversationService;

