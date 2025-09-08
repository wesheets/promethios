/**
 * SharedConversationBridge - Integration layer between SharedConversationService and UnifiedChatManager
 * 
 * This service bridges the existing shared conversation invitation system with the new
 * unified chat system, ensuring seamless operation and backward compatibility.
 */

import { UnifiedChatManager } from './UnifiedChatManager';
import { SharedConversationService } from './SharedConversationService';
import { ChatStateManager, ChatMode } from './ChatStateManager';
import { ParticipantManager, Participant, ParticipantRole } from './ParticipantManager';

export interface SharedConversationBridgeConfig {
  enableAutoMigration: boolean;
  enableLegacySupport: boolean;
  syncInterval: number;
}

export class SharedConversationBridge {
  private static instance: SharedConversationBridge;
  
  private readonly config: SharedConversationBridgeConfig;
  private readonly unifiedChatManager: UnifiedChatManager;
  private readonly sharedConversationService: SharedConversationService;
  private readonly chatStateManager: ChatStateManager;
  private readonly participantManager: ParticipantManager;
  
  private syncTimer?: NodeJS.Timeout;
  private isInitialized = false;

  private constructor(
    config: SharedConversationBridgeConfig,
    unifiedChatManager: UnifiedChatManager,
    sharedConversationService: SharedConversationService
  ) {
    this.config = config;
    this.unifiedChatManager = unifiedChatManager;
    this.sharedConversationService = sharedConversationService;
    this.chatStateManager = ChatStateManager.getInstance();
    this.participantManager = ParticipantManager.getInstance();
  }

  public static getInstance(
    config?: SharedConversationBridgeConfig,
    unifiedChatManager?: UnifiedChatManager,
    sharedConversationService?: SharedConversationService
  ): SharedConversationBridge {
    if (!SharedConversationBridge.instance) {
      if (!config || !unifiedChatManager || !sharedConversationService) {
        throw new Error('SharedConversationBridge requires config and services for first initialization');
      }
      
      SharedConversationBridge.instance = new SharedConversationBridge(
        config,
        unifiedChatManager,
        sharedConversationService
      );
    }
    
    return SharedConversationBridge.instance;
  }

  /**
   * Initialize the bridge service
   */
  public async initialize(currentUser: any): Promise<void> {
    if (this.isInitialized) {
      console.log('🔗 [SharedConversationBridge] Already initialized');
      return;
    }

    console.log('🔗 [SharedConversationBridge] Initializing bridge service...');

    try {
      // Validate currentUser object
      if (!currentUser) {
        console.warn('⚠️ [SharedConversationBridge] No current user provided for initialization');
        throw new Error('Current user is required for bridge initialization');
      }

      if (!currentUser.uid) {
        console.warn('⚠️ [SharedConversationBridge] Current user missing uid property:', currentUser);
        throw new Error('Current user must have uid property');
      }

      console.log('🔍 [SharedConversationBridge] Initializing for user:', currentUser.uid);

      // Sync existing shared conversations with unified chat system
      if (this.config.enableAutoMigration) {
        await this.migrateExistingConversations(currentUser);
      }

      // Set up periodic sync if enabled
      if (this.config.syncInterval > 0) {
        this.startPeriodicSync(currentUser);
      }

      // Set up event listeners for real-time sync
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('✅ [SharedConversationBridge] Bridge service initialized successfully');
    } catch (error) {
      console.error('❌ [SharedConversationBridge] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Handle invitation acceptance and bridge to unified chat system
   */
  public async handleInvitationAcceptance(
    invitationId: string,
    conversationId: string,
    currentUser: any
  ): Promise<{ success: boolean; unifiedSessionId?: string; error?: string }> {
    console.log('🔗 [SharedConversationBridge] Handling invitation acceptance:', {
      invitationId,
      conversationId,
      userId: currentUser?.uid
    });

    try {
      // Validate inputs
      if (!invitationId || !conversationId || !currentUser?.uid) {
        const error = 'Missing required parameters for invitation acceptance';
        console.error('❌ [SharedConversationBridge]', error);
        return { success: false, error };
      }

      // First, try to get the shared conversation directly by ID
      console.log('🔍 [SharedConversationBridge] Looking for shared conversation with ID:', conversationId);
      let sharedConversation = await this.sharedConversationService.getSharedConversation(conversationId);
      
      if (!sharedConversation) {
        console.log('🔍 [SharedConversationBridge] Direct lookup failed, searching user conversations...');
        
        // If not found, search through user's shared conversations
        const userSharedConversations = await this.sharedConversationService.getUserSharedConversations(currentUser.uid);
        console.log('🔍 [SharedConversationBridge] User has', userSharedConversations.length, 'shared conversations');
        
        // Look for a conversation that matches the host conversation ID
        sharedConversation = userSharedConversations.find(conv => 
          conv.hostChatSessionId === conversationId || 
          conv.conversationId === conversationId ||
          conv.id === conversationId
        );
        
        if (sharedConversation) {
          console.log('🔍 [SharedConversationBridge] Found matching conversation:', sharedConversation.id);
        }
      }
      
      if (!sharedConversation) {
        console.error('❌ [SharedConversationBridge] Shared conversation not found:', conversationId);
        console.log('🔍 [SharedConversationBridge] Available conversations for user:', 
          (await this.sharedConversationService.getUserSharedConversations(currentUser.uid)).map(c => ({
            id: c.id,
            hostChatSessionId: c.hostChatSessionId,
            conversationId: c.conversationId
          }))
        );
        return { success: false, error: 'Shared conversation not found' };
      }

      // Convert shared conversation to unified chat session
      const unifiedSession = await this.convertToUnifiedSession(sharedConversation, currentUser);
      
      if (!unifiedSession) {
        console.error('❌ [SharedConversationBridge] Failed to convert to unified session');
        return { success: false, error: 'Failed to create unified session' };
      }

      // Register the session with unified chat manager
      await this.unifiedChatManager.createOrGetSession(
        unifiedSession.id,
        unifiedSession.name,
        unifiedSession.agentId
      );

      // Add all participants to the unified session using the correct session ID
      for (const participant of sharedConversation.participants) {
        if (participant.id !== currentUser?.uid) {
          console.log('🔗 [SharedConversationBridge] Adding participant to unified session:', {
            sessionId: unifiedSession.id,
            participantId: participant.id,
            participantName: participant.name
          });
          
          await this.unifiedChatManager.addParticipant(
            unifiedSession.id, // Use the unified session ID, not the participant ID
            participant.id,
            this.mapParticipantRole(participant.role || 'participant')
          );
        }
      }

      console.log('✅ [SharedConversationBridge] Successfully bridged invitation acceptance');
      return { success: true, unifiedSessionId: unifiedSession.id };

    } catch (error) {
      console.error('❌ [SharedConversationBridge] Error handling invitation acceptance:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Migrate existing shared conversations to unified chat system
   */
  private async migrateExistingConversations(currentUser: any): Promise<void> {
    console.log('🔄 [SharedConversationBridge] Migrating existing shared conversations...');

    try {
      // Validate currentUser object
      if (!currentUser) {
        console.warn('⚠️ [SharedConversationBridge] No current user provided, skipping migration');
        return;
      }

      if (!currentUser.uid) {
        console.warn('⚠️ [SharedConversationBridge] Current user missing uid property:', currentUser);
        return;
      }

      console.log('🔍 [SharedConversationBridge] Migrating for user:', currentUser.uid);
      const userSharedConversations = await this.sharedConversationService.getUserSharedConversations(currentUser.uid);
      
      console.log(`🔄 [SharedConversationBridge] Found ${userSharedConversations.length} shared conversations to migrate`);

      for (const sharedConv of userSharedConversations) {
        try {
          const unifiedSession = await this.convertToUnifiedSession(sharedConv, currentUser);
          
          if (unifiedSession) {
            // Check if session already exists in unified system
            const existingSession = this.chatStateManager.getCurrentSession();
            
            if (!existingSession || existingSession.id !== unifiedSession.id) {
              // Create the session in unified chat manager
              await this.unifiedChatManager.createOrGetSession(
                unifiedSession.id,
                unifiedSession.name,
                unifiedSession.agentId
              );

              console.log(`✅ [SharedConversationBridge] Migrated conversation: ${sharedConv.id}`);
            }
          }
        } catch (error) {
          console.error(`❌ [SharedConversationBridge] Failed to migrate conversation ${sharedConv.id}:`, error);
        }
      }

      console.log('✅ [SharedConversationBridge] Migration completed');
    } catch (error) {
      console.error('❌ [SharedConversationBridge] Migration failed:', error);
    }
  }

  /**
   * Convert shared conversation to unified chat session format
   */
  private async convertToUnifiedSession(sharedConversation: any, currentUser: any): Promise<any> {
    try {
      // Determine the mode based on participant count
      const participantCount = sharedConversation.participants?.length || 0;
      const mode: ChatMode = participantCount > 2 ? 'shared' : 'regular';

      // Find the agent participant
      const agentParticipant = sharedConversation.participants?.find((p: any) => 
        p.role === 'agent' || p.id?.startsWith('ai-')
      );

      // Convert participants to unified format
      const participants: Participant[] = sharedConversation.participants?.map((p: any) => ({
        userId: p.id,
        displayName: p.name || p.displayName || 'Unknown User',
        role: this.mapParticipantRole(p.role || 'participant'),
        isOnline: p.isOnline || false,
        isTyping: false,
        joinedAt: p.joinedAt || new Date(),
        avatar: p.avatar || null
      })) || [];

      const unifiedSession = {
        id: `unified_${sharedConversation.id}`,
        name: sharedConversation.name || sharedConversation.conversationName || 'Shared Chat',
        mode,
        participants,
        hostUserId: sharedConversation.hostUserId || currentUser.uid,
        agentId: agentParticipant?.agentId || agentParticipant?.id,
        createdAt: sharedConversation.createdAt || new Date(),
        lastActivity: sharedConversation.lastActivity || new Date(),
        metadata: {
          isPrivate: !sharedConversation.isPublic,
          allowInvites: true,
          linkedSessionId: sharedConversation.hostChatSessionId || sharedConversation.conversationId || null,
          originalSharedConversationId: sharedConversation.id
        }
      };

      console.log('🔄 [SharedConversationBridge] Converted shared conversation to unified session:', {
        originalId: sharedConversation.id,
        unifiedId: unifiedSession.id,
        mode: unifiedSession.mode,
        participantCount: participants.length
      });

      return unifiedSession;
    } catch (error) {
      console.error('❌ [SharedConversationBridge] Failed to convert shared conversation:', error);
      return null;
    }
  }

  /**
   * Map participant roles between systems
   */
  private mapParticipantRole(legacyRole: string): ParticipantRole {
    switch (legacyRole.toLowerCase()) {
      case 'host':
      case 'owner':
        return 'host';
      case 'agent':
      case 'ai':
        return 'agent';
      case 'guest':
        return 'guest';
      case 'participant':
      default:
        return 'participant';
    }
  }

  /**
   * Set up event listeners for real-time synchronization
   */
  private setupEventListeners(): void {
    // Listen for shared conversation updates
    window.addEventListener('sharedConversationUpdated', this.handleSharedConversationUpdate.bind(this));
    
    // Listen for unified chat updates
    window.addEventListener('unifiedChatUpdated', this.handleUnifiedChatUpdate.bind(this));
    
    console.log('🔗 [SharedConversationBridge] Event listeners set up');
  }

  /**
   * Handle shared conversation updates
   */
  private async handleSharedConversationUpdate(event: CustomEvent): Promise<void> {
    const { conversationId, updateType } = event.detail;
    
    console.log('🔄 [SharedConversationBridge] Handling shared conversation update:', {
      conversationId,
      updateType
    });

    // Sync the update to unified chat system if needed
    // Implementation depends on the specific update type
  }

  /**
   * Handle unified chat updates
   */
  private async handleUnifiedChatUpdate(event: CustomEvent): Promise<void> {
    const { sessionId, updateType } = event.detail;
    
    console.log('🔄 [SharedConversationBridge] Handling unified chat update:', {
      sessionId,
      updateType
    });

    // Sync the update to shared conversation system if needed
    // Implementation depends on the specific update type
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(currentUser: any): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      try {
        await this.syncConversations(currentUser);
      } catch (error) {
        console.error('❌ [SharedConversationBridge] Periodic sync failed:', error);
      }
    }, this.config.syncInterval);

    console.log(`🔄 [SharedConversationBridge] Periodic sync started (interval: ${this.config.syncInterval}ms)`);
  }

  /**
   * Synchronize conversations between systems
   */
  private async syncConversations(currentUser: any): Promise<void> {
    // Implementation for periodic synchronization
    // This would check for new shared conversations and sync them with unified chat
    console.log('🔄 [SharedConversationBridge] Running periodic sync...');
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }

    window.removeEventListener('sharedConversationUpdated', this.handleSharedConversationUpdate.bind(this));
    window.removeEventListener('unifiedChatUpdated', this.handleUnifiedChatUpdate.bind(this));

    this.isInitialized = false;
    console.log('🔗 [SharedConversationBridge] Bridge service destroyed');
  }
}

// Default configuration
export const defaultBridgeConfig: SharedConversationBridgeConfig = {
  enableAutoMigration: true,
  enableLegacySupport: true,
  syncInterval: 30000 // 30 seconds
};

