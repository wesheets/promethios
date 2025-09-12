/**
 * UnifiedParticipantService - Manages unified participants (humans and AI agents) 
 * in collaborative chat sessions with real-time synchronization
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion, 
  arrayRemove,
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface UnifiedParticipant {
  id: string;
  name: string;
  avatar?: string;
  type: 'human' | 'ai_agent';
  status: 'active' | 'pending' | 'declined';
  addedAt: Date;
  addedBy: string; // User ID who added this participant
  invitationId?: string; // For human participants
  agentConfig?: {
    provider?: string;
    model?: string;
    systemPrompt?: string;
    color?: string;
    hotkey?: string;
  }; // For AI agent participants
  permissions: {
    canRemove: boolean; // Can this participant be removed by current user
    canAddAgents: boolean; // Can this participant add their own agents
    isHost: boolean; // Is this the host of the conversation
  };
}

export interface ConversationParticipants {
  conversationId: string;
  hostUserId: string;
  participants: UnifiedParticipant[];
  lastUpdated: Date;
  version: number; // For conflict resolution
}

class UnifiedParticipantService {
  private static instance: UnifiedParticipantService;
  private listeners: Map<string, () => void> = new Map();

  private constructor() {}

  public static getInstance(): UnifiedParticipantService {
    if (!UnifiedParticipantService.instance) {
      UnifiedParticipantService.instance = new UnifiedParticipantService();
    }
    return UnifiedParticipantService.instance;
  }

  /**
   * Initialize participants for a new conversation
   */
  async initializeConversationParticipants(
    conversationId: string,
    hostUserId: string,
    hostUserName: string,
    hostAgents: Array<{
      id: string;
      name: string;
      avatar?: string;
      color?: string;
      hotkey?: string;
      provider?: string;
      model?: string;
      systemPrompt?: string;
    }>
  ): Promise<void> {
    try {
      console.log('🚀 [UnifiedParticipant] Initializing conversation participants:', {
        conversationId,
        hostUserId,
        hostUserName,
        hostAgentsCount: hostAgents.length
      });

      // Create host participant
      const hostParticipant: UnifiedParticipant = {
        id: hostUserId,
        name: hostUserName,
        type: 'human',
        status: 'active',
        addedAt: new Date(),
        addedBy: hostUserId,
        permissions: {
          canRemove: false, // Host cannot remove themselves
          canAddAgents: true,
          isHost: true
        }
      };

      // Create host's AI agents
      const agentParticipants: UnifiedParticipant[] = hostAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        type: 'ai_agent',
        status: 'active',
        addedAt: new Date(),
        addedBy: hostUserId,
        agentConfig: {
          provider: agent.provider,
          model: agent.model,
          systemPrompt: agent.systemPrompt,
          color: agent.color,
          hotkey: agent.hotkey
        },
        permissions: {
          canRemove: true, // Host can remove their own agents
          canAddAgents: false, // Agents cannot add other agents
          isHost: false
        }
      }));

      const conversationParticipants: ConversationParticipants = {
        conversationId,
        hostUserId,
        participants: [hostParticipant, ...agentParticipants],
        lastUpdated: new Date(),
        version: 1
      };

      // Store in Firebase
      const participantsRef = doc(db, 'conversation_participants', conversationId);
      await setDoc(participantsRef, {
        ...conversationParticipants,
        lastUpdated: Timestamp.fromDate(conversationParticipants.lastUpdated),
        participants: conversationParticipants.participants.map(p => ({
          ...p,
          addedAt: Timestamp.fromDate(p.addedAt)
        }))
      });

      console.log('✅ [UnifiedParticipant] Conversation participants initialized');

    } catch (error) {
      console.error('❌ [UnifiedParticipant] Error initializing conversation participants:', error);
      throw error;
    }
  }

  /**
   * Add a human participant (guest) to the conversation
   */
  async addHumanParticipant(
    conversationId: string,
    participantId: string,
    participantName: string,
    addedBy: string,
    invitationId: string,
    status: 'pending' | 'active' = 'pending'
  ): Promise<void> {
    try {
      console.log('👤 [UnifiedParticipant] Adding human participant:', {
        conversationId,
        participantId,
        participantName,
        addedBy,
        status,
        invitationId
      });

      const newParticipant: UnifiedParticipant = {
        id: participantId,
        name: participantName,
        type: 'human',
        status,
        addedAt: new Date(),
        addedBy,
        invitationId,
        permissions: {
          canRemove: true, // Guests can remove themselves
          canAddAgents: true, // Guests can add their own agents
          isHost: false
        }
      };

      console.log(`🔍 [UnifiedParticipant] Storing participant in conversation: ${conversationId}`);
      await this.addParticipantToConversation(conversationId, newParticipant);

      console.log('✅ [UnifiedParticipant] Human participant added successfully');

    } catch (error) {
      console.error('❌ [UnifiedParticipant] Error adding human participant:', error);
      throw error;
    }
  }

  /**
   * Add an AI agent participant to the conversation
   */
  async addAIAgentParticipant(
    conversationId: string,
    agentId: string,
    agentName: string,
    addedBy: string,
    agentConfig: {
      provider?: string;
      model?: string;
      systemPrompt?: string;
      color?: string;
      hotkey?: string;
      avatar?: string;
    }
  ): Promise<void> {
    try {
      console.log('🤖 [UnifiedParticipant] Adding AI agent participant:', {
        conversationId,
        agentId,
        agentName,
        addedBy
      });

      // Check permissions before adding
      const permissionCheck = await this.canUserAddParticipants(
        conversationId,
        addedBy,
        'ai_agent'
      );

      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.reason || 'Insufficient permissions to add AI agents');
      }

      const newParticipant: UnifiedParticipant = {
        id: agentId,
        name: agentName,
        avatar: agentConfig.avatar,
        type: 'ai_agent',
        status: 'active', // AI agents are immediately active
        addedAt: new Date(),
        addedBy,
        agentConfig,
        permissions: {
          canRemove: true, // Can be removed by the user who added them or host
          canAddAgents: false, // Agents cannot add other agents
          isHost: false
        }
      };

      await this.addParticipantToConversation(conversationId, newParticipant);

      console.log('✅ [UnifiedParticipant] AI agent participant added');

    } catch (error) {
      console.error('❌ [UnifiedParticipant] Error adding AI agent participant:', error);
      throw error;
    }
  }

  /**
   * Remove a participant from the conversation
   */
  async removeParticipant(
    conversationId: string,
    participantId: string,
    removedBy: string
  ): Promise<void> {
    try {
      console.log('🗑️ [UnifiedParticipant] Removing participant:', {
        conversationId,
        participantId,
        removedBy
      });

      const participantsRef = doc(db, 'conversation_participants', conversationId);
      const participantsDoc = await getDoc(participantsRef);

      if (!participantsDoc.exists()) {
        throw new Error('Conversation participants not found');
      }

      const data = participantsDoc.data() as any;
      const participants = data.participants.map((p: any) => ({
        ...p,
        addedAt: p.addedAt.toDate()
      })) as UnifiedParticipant[];

      // Find the participant to remove
      const participantToRemove = participants.find(p => p.id === participantId);
      if (!participantToRemove) {
        throw new Error('Participant not found');
      }

      // Enhanced permission validation
      const permissionCheck = this.validateParticipantPermissions(
        removedBy,
        participantToRemove,
        data.hostUserId,
        'remove'
      );

      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.reason || 'Insufficient permissions to remove participant');
      }

      // Remove the participant
      const updatedParticipants = participants.filter(p => p.id !== participantId);

      await updateDoc(participantsRef, {
        participants: updatedParticipants.map(p => ({
          ...p,
          addedAt: Timestamp.fromDate(p.addedAt)
        })),
        lastUpdated: Timestamp.now(),
        version: data.version + 1
      });

      console.log('✅ [UnifiedParticipant] Participant removed');

    } catch (error) {
      console.error('❌ [UnifiedParticipant] Error removing participant:', error);
      throw error;
    }
  }

  /**
   * Activate a pending participant (when they accept invitation)
   */
  async activateParticipant(
    conversationId: string,
    participantId: string
  ): Promise<void> {
    try {
      console.log('✅ [UnifiedParticipant] Activating participant:', {
        conversationId,
        participantId
      });

      const participantsRef = doc(db, 'conversation_participants', conversationId);
      const participantsDoc = await getDoc(participantsRef);

      if (!participantsDoc.exists()) {
        throw new Error('Conversation participants not found');
      }

      const data = participantsDoc.data() as any;
      const participants = data.participants.map((p: any) => ({
        ...p,
        addedAt: p.addedAt.toDate()
      })) as UnifiedParticipant[];

      // Update participant status
      const updatedParticipants = participants.map(p => 
        p.id === participantId 
          ? { ...p, status: 'active' as const }
          : p
      );

      await updateDoc(participantsRef, {
        participants: updatedParticipants.map(p => ({
          ...p,
          addedAt: Timestamp.fromDate(p.addedAt)
        })),
        lastUpdated: Timestamp.now(),
        version: data.version + 1
      });

      console.log('✅ [UnifiedParticipant] Participant activated');

    } catch (error) {
      console.error('❌ [UnifiedParticipant] Error activating participant:', error);
      throw error;
    }
  }

  /**
   * Get all participants for a conversation
   */
  async getConversationParticipants(conversationId: string): Promise<UnifiedParticipant[]> {
    try {
      console.log(`🔍 [UnifiedParticipant] Getting participants for conversation: ${conversationId}`);
      
      const participantsRef = doc(db, 'conversation_participants', conversationId);
      const participantsDoc = await getDoc(participantsRef);

      if (!participantsDoc.exists()) {
        console.log(`⚠️ [UnifiedParticipant] No participants document found for conversation: ${conversationId}`);
        console.log(`🔍 [UnifiedParticipant] Checking if document exists with different ID format...`);
        
        // Try alternative conversation ID formats
        const alternativeIds = [
          `chat_${conversationId}`,
          conversationId.replace('chat_', ''),
          `session_${conversationId}`,
          conversationId.replace('session_', ''),
          // Handle cross-prefix scenarios
          conversationId.replace('chat_', 'session_'),
          conversationId.replace('session_', 'chat_')
        ];
        
        for (const altId of alternativeIds) {
          if (altId !== conversationId) {
            console.log(`🔍 [UnifiedParticipant] Trying alternative ID: ${altId}`);
            const altRef = doc(db, 'conversation_participants', altId);
            const altDoc = await getDoc(altRef);
            if (altDoc.exists()) {
              console.log(`✅ [UnifiedParticipant] Found participants with alternative ID: ${altId}`);
              const data = altDoc.data() as any;
              const participants = data.participants.map((p: any) => ({
                ...p,
                addedAt: p.addedAt.toDate()
              })) as UnifiedParticipant[];
              console.log(`📋 [UnifiedParticipant] Retrieved ${participants.length} participants with alt ID`);
              return participants;
            }
          }
        }
        
        return [];
      }

      const data = participantsDoc.data() as any;
      const participants = data.participants.map((p: any) => ({
        ...p,
        addedAt: p.addedAt.toDate()
      })) as UnifiedParticipant[];

      console.log(`📋 [UnifiedParticipant] Retrieved ${participants.length} participants for conversation: ${conversationId}`);
      console.log(`🔍 [UnifiedParticipant] Participants:`, participants.map(p => ({ id: p.id, name: p.name, type: p.type, status: p.status })));
      return participants;

    } catch (error) {
      console.error(`❌ [UnifiedParticipant] Error getting conversation participants for ${conversationId}:`, error);
      return [];
    }
  }

  /**
   * Subscribe to real-time participant updates
   */
  subscribeToParticipants(
    conversationId: string,
    callback: (participants: UnifiedParticipant[]) => void
  ): () => void {
    console.log('🔔 [UnifiedParticipant] Setting up participant subscription for:', conversationId);

    const participantsRef = doc(db, 'conversation_participants', conversationId);
    
    const unsubscribe = onSnapshot(participantsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as any;
        const participants = data.participants.map((p: any) => ({
          ...p,
          addedAt: p.addedAt.toDate()
        })) as UnifiedParticipant[];

        console.log('🔔 [UnifiedParticipant] Participants updated:', participants.length);
        callback(participants);
      } else {
        console.log('⚠️ [UnifiedParticipant] No participants document found');
        callback([]);
      }
    }, (error) => {
      console.error('❌ [UnifiedParticipant] Subscription error:', error);
      callback([]);
    });

    // Store the unsubscribe function
    this.listeners.set(conversationId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Unsubscribe from participant updates
   */
  unsubscribeFromParticipants(conversationId: string): void {
    const unsubscribe = this.listeners.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(conversationId);
      console.log('🔕 [UnifiedParticipant] Unsubscribed from participants for:', conversationId);
    }
  }

  /**
   * Helper method to add participant to conversation
   */
  private async addParticipantToConversation(
    conversationId: string,
    participant: UnifiedParticipant
  ): Promise<void> {
    console.log(`🔍 [UnifiedParticipant] addParticipantToConversation called with:`, {
      conversationId,
      participantId: participant.id,
      participantName: participant.name,
      participantType: participant.type
    });
    
    const participantsRef = doc(db, 'conversation_participants', conversationId);
    console.log(`🔍 [UnifiedParticipant] Firebase document path: conversation_participants/${conversationId}`);
    
    const participantsDoc = await getDoc(participantsRef);

    if (!participantsDoc.exists()) {
      console.log('⚠️ [UnifiedParticipant] Conversation participants document not found, creating it...');
      
      // Create the conversation participants document with the new participant
      const newDocData = {
        conversationId,
        hostUserId: participant.addedBy, // The person adding this participant becomes the host
        participants: [{
          ...participant,
          addedAt: Timestamp.fromDate(participant.addedAt)
        }],
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
        version: 1
      };
      
      console.log(`🔍 [UnifiedParticipant] Creating new document with data:`, newDocData);
      await setDoc(participantsRef, newDocData);
      
      console.log('✅ [UnifiedParticipant] Created conversation participants document with participant');
      return;
    }

    const data = participantsDoc.data() as any;
    const existingParticipants = data.participants.map((p: any) => ({
      ...p,
      addedAt: p.addedAt.toDate()
    })) as UnifiedParticipant[];

    console.log(`🔍 [UnifiedParticipant] Found existing document with ${existingParticipants.length} participants`);

    // Check if participant already exists
    if (existingParticipants.some(p => p.id === participant.id)) {
      console.log('⚠️ [UnifiedParticipant] Participant already exists in conversation:', participant.id);
      return; // Don't throw error, just skip adding
    }

    const updatedParticipants = [...existingParticipants, participant];
    console.log(`🔍 [UnifiedParticipant] Updating document with ${updatedParticipants.length} participants`);

    await updateDoc(participantsRef, {
      participants: updatedParticipants.map(p => ({
        ...p,
        addedAt: Timestamp.fromDate(p.addedAt)
      })),
      lastUpdated: Timestamp.now(),
      version: data.version + 1
    });
    
    console.log('✅ [UnifiedParticipant] Added participant to existing conversation');
  }

  /**
   * Check if a user can remove a specific participant
   */
  private canUserRemoveParticipant(
    userId: string,
    participant: UnifiedParticipant,
    hostUserId: string
  ): boolean {
    // Host can remove anyone except themselves
    if (userId === hostUserId && participant.id !== hostUserId) {
      return true;
    }

    // Users can remove themselves
    if (userId === participant.id) {
      return true;
    }

    // Users can remove agents they added
    if (participant.addedBy === userId && participant.type === 'ai_agent') {
      return true;
    }

    return false;
  }

  /**
   * Enhanced permission validation with detailed checks
   */
  validateParticipantPermissions(
    currentUserId: string,
    targetParticipant: UnifiedParticipant,
    hostUserId: string,
    action: 'remove' | 'modify' | 'view'
  ): {
    allowed: boolean;
    reason?: string;
  } {
    console.log('🔒 [UnifiedParticipant] Validating permissions:', {
      currentUserId,
      targetParticipant: targetParticipant.id,
      hostUserId,
      action
    });

    // Host permissions
    if (currentUserId === hostUserId) {
      if (action === 'remove' && targetParticipant.id === hostUserId) {
        return {
          allowed: false,
          reason: 'Host cannot remove themselves from the conversation'
        };
      }
      return { allowed: true }; // Host can do everything else
    }

    // Self-management permissions
    if (currentUserId === targetParticipant.id) {
      if (action === 'remove') {
        return { allowed: true }; // Users can remove themselves
      }
      if (action === 'modify') {
        return { allowed: true }; // Users can modify their own settings
      }
    }

    // Agent management permissions
    if (targetParticipant.type === 'ai_agent' && targetParticipant.addedBy === currentUserId) {
      return { allowed: true }; // Users can manage agents they added
    }

    // View permissions (everyone can view active participants)
    if (action === 'view' && targetParticipant.status === 'active') {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Insufficient permissions to ${action} this participant`
    };
  }

  /**
   * Check if user can add participants to conversation
   */
  async canUserAddParticipants(
    conversationId: string,
    userId: string,
    participantType: 'human' | 'ai_agent'
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    try {
      const participants = await this.getConversationParticipants(conversationId);
      const currentUser = participants.find(p => p.id === userId);
      
      if (!currentUser) {
        return {
          allowed: false,
          reason: 'User is not a participant in this conversation'
        };
      }

      if (currentUser.status !== 'active') {
        return {
          allowed: false,
          reason: 'User must be an active participant to add others'
        };
      }

      // Check if user has permission to add agents
      if (participantType === 'ai_agent' && !currentUser.permissions.canAddAgents) {
        return {
          allowed: false,
          reason: 'User does not have permission to add AI agents'
        };
      }

      // Host can add anyone
      if (currentUser.permissions.isHost) {
        return { allowed: true };
      }

      // Active participants can add AI agents (if they have permission)
      if (participantType === 'ai_agent') {
        return { allowed: true };
      }

      // For human participants, check if it's allowed (could be restricted in some cases)
      return { allowed: true };

    } catch (error) {
      console.error('❌ [UnifiedParticipant] Error checking add permissions:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions'
      };
    }
  }

  /**
   * Get participants with permissions calculated for a specific user
   */
  async getParticipantsWithPermissions(
    conversationId: string,
    currentUserId: string
  ): Promise<UnifiedParticipant[]> {
    const participants = await this.getConversationParticipants(conversationId);
    const hostUserId = participants.find(p => p.permissions.isHost)?.id;

    return participants.map(participant => ({
      ...participant,
      permissions: {
        ...participant.permissions,
        canRemove: this.canUserRemoveParticipant(currentUserId, participant, hostUserId || '')
      }
    }));
  }
}

// Export singleton instance
export const unifiedParticipantService = UnifiedParticipantService.getInstance();
export default unifiedParticipantService;

