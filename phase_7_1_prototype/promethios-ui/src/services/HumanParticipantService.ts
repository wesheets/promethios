/**
 * HumanParticipantService - Manages human participants in AI conversations
 * 
 * Provides functionality for:
 * - Adding humans to AI conversations
 * - Managing human presence and status
 * - Human-AI conversation coordination
 * - Human @mention system integration
 * - Real-time human participation tracking
 */

import { UserProfile, userProfileService } from './UserProfileService';
import { TeamCollaborationIntegrationService } from './TeamCollaborationIntegrationService';
import { UnifiedStorageService } from './UnifiedStorageService';

export interface HumanParticipant {
  userId: string;
  displayName: string;
  avatar: string;
  email: string;
  jobTitle?: string;
  organization?: string;
  department?: string;
  isOnline: boolean;
  lastSeen: Date;
  role?: string; // Career role like AI agents (CTO, Legal, etc.)
  permissions: HumanParticipantPermissions;
  joinedAt: Date;
}

export interface HumanParticipantPermissions {
  canInviteOthers: boolean;
  canAddAIAgents: boolean;
  canModifyConversation: boolean;
  canViewHistory: boolean;
  canExportData: boolean;
}

export interface ConversationInvitation {
  id: string;
  conversationId: string;
  conversationName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserEmail: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface HumanConversationContext {
  conversationId: string;
  name: string;
  description?: string;
  participants: HumanParticipant[];
  aiAgents: string[]; // AI agent IDs
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  settings: {
    allowInvitations: boolean;
    requireApproval: boolean;
    maxParticipants: number;
    allowAIInteractions: boolean;
  };
}

export class HumanParticipantService {
  private static instance: HumanParticipantService;
  private storageService: UnifiedStorageService;
  private teamCollabService: TeamCollaborationIntegrationService;
  private onlineUsers = new Map<string, Date>(); // userId -> lastSeen
  private presenceUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.storageService = UnifiedStorageService.getInstance();
    this.teamCollabService = TeamCollaborationIntegrationService.getInstance();
    this.initializePresenceTracking();
  }

  public static getInstance(): HumanParticipantService {
    if (!HumanParticipantService.instance) {
      HumanParticipantService.instance = new HumanParticipantService();
    }
    return HumanParticipantService.instance;
  }

  /**
   * Initialize real-time presence tracking
   */
  private initializePresenceTracking(): void {
    // Update presence every 30 seconds
    this.presenceUpdateInterval = setInterval(() => {
      this.updateUserPresence();
    }, 30000);

    // Update presence when user becomes active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateUserPresence();
      }
    });

    // Update presence on user interaction
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        this.updateUserPresence();
      }, { passive: true });
    });
  }

  /**
   * Update current user's presence
   */
  private async updateUserPresence(): Promise<void> {
    try {
      const currentUser = await userProfileService.getCurrentUserProfile();
      if (currentUser) {
        this.onlineUsers.set(currentUser.id, new Date());
        await this.storageService.set('user_presence', `presence_${currentUser.id}`, {
          userId: currentUser.id,
          lastSeen: new Date(),
          isOnline: true
        });
      }
    } catch (error) {
      console.warn('Failed to update user presence:', error);
    }
  }

  /**
   * Get human participants for a conversation
   */
  public async getConversationParticipants(conversationId: string): Promise<HumanParticipant[]> {
    try {
      const context = await this.getConversationContext(conversationId);
      return context?.participants || [];
    } catch (error) {
      console.error('Failed to get conversation participants:', error);
      return [];
    }
  }

  /**
   * Add human participant to conversation
   */
  public async addParticipantToConversation(
    conversationId: string, 
    userId: string,
    permissions?: Partial<HumanParticipantPermissions>
  ): Promise<HumanParticipant | null> {
    try {
      const userProfile = await userProfileService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const participant: HumanParticipant = {
        userId: userProfile.id,
        displayName: userProfile.displayName,
        avatar: userProfile.avatar,
        email: userProfile.email,
        jobTitle: userProfile.jobTitle,
        organization: userProfile.organization,
        department: userProfile.department,
        isOnline: this.isUserOnline(userId),
        lastSeen: new Date(),
        permissions: {
          canInviteOthers: true,
          canAddAIAgents: true,
          canModifyConversation: false,
          canViewHistory: true,
          canExportData: false,
          ...permissions
        },
        joinedAt: new Date()
      };

      // Update conversation context
      const context = await this.getConversationContext(conversationId);
      if (context) {
        context.participants.push(participant);
        context.lastActivity = new Date();
        await this.saveConversationContext(context);
      }

      return participant;
    } catch (error) {
      console.error('Failed to add participant to conversation:', error);
      return null;
    }
  }

  /**
   * Remove human participant from conversation
   */
  public async removeParticipantFromConversation(
    conversationId: string, 
    userId: string
  ): Promise<boolean> {
    try {
      const context = await this.getConversationContext(conversationId);
      if (context) {
        context.participants = context.participants.filter(p => p.userId !== userId);
        context.lastActivity = new Date();
        await this.saveConversationContext(context);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove participant from conversation:', error);
      return false;
    }
  }

  /**
   * Send invitation to join conversation
   */
  public async sendConversationInvitation(
    conversationId: string,
    toUserEmail: string,
    message?: string
  ): Promise<ConversationInvitation | null> {
    try {
      const currentUser = await userProfileService.getCurrentUserProfile();
      const context = await this.getConversationContext(conversationId);
      
      if (!currentUser || !context) {
        throw new Error('Invalid user or conversation');
      }

      const invitation: ConversationInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        conversationName: context.name,
        fromUserId: currentUser.id,
        fromUserName: currentUser.displayName,
        toUserId: '', // Will be filled when user accepts
        toUserEmail,
        message,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      await this.storageService.set('invitations', invitation.id, invitation);
      
      // TODO: Send email notification
      console.log('📧 Invitation sent:', invitation);
      
      return invitation;
    } catch (error) {
      console.error('Failed to send conversation invitation:', error);
      return null;
    }
  }

  /**
   * Accept conversation invitation
   */
  public async acceptInvitation(invitationId: string): Promise<boolean> {
    try {
      const invitation = await this.storageService.get<ConversationInvitation>('invitations', invitationId);
      if (!invitation || invitation.status !== 'pending') {
        return false;
      }

      const currentUser = await userProfileService.getCurrentUserProfile();
      if (!currentUser || currentUser.email !== invitation.toUserEmail) {
        return false;
      }

      // Add user to conversation
      const participant = await this.addParticipantToConversation(
        invitation.conversationId,
        currentUser.id
      );

      if (participant) {
        invitation.status = 'accepted';
        invitation.toUserId = currentUser.id;
        invitation.acceptedAt = new Date();
        await this.storageService.set('invitations', invitationId, invitation);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      return false;
    }
  }

  /**
   * Get conversation context
   */
  public async getConversationContext(conversationId: string): Promise<HumanConversationContext | null> {
    try {
      return await this.storageService.get<HumanConversationContext>('conversations', conversationId);
    } catch (error) {
      console.error('Failed to get conversation context:', error);
      return null;
    }
  }

  /**
   * Save conversation context
   */
  public async saveConversationContext(context: HumanConversationContext): Promise<void> {
    try {
      await this.storageService.set('conversations', context.conversationId, context);
    } catch (error) {
      console.error('Failed to save conversation context:', error);
    }
  }

  /**
   * Create new human-AI conversation
   */
  public async createHumanAIConversation(
    name: string,
    description?: string,
    aiAgents: string[] = []
  ): Promise<HumanConversationContext | null> {
    try {
      const currentUser = await userProfileService.getCurrentUserProfile();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const context: HumanConversationContext = {
        conversationId,
        name,
        description,
        participants: [{
          userId: currentUser.id,
          displayName: currentUser.displayName,
          avatar: currentUser.avatar,
          email: currentUser.email,
          jobTitle: currentUser.jobTitle,
          organization: currentUser.organization,
          department: currentUser.department,
          isOnline: true,
          lastSeen: new Date(),
          permissions: {
            canInviteOthers: true,
            canAddAIAgents: true,
            canModifyConversation: true,
            canViewHistory: true,
            canExportData: true
          },
          joinedAt: new Date()
        }],
        aiAgents,
        createdBy: currentUser.id,
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true,
        settings: {
          allowInvitations: true,
          requireApproval: false,
          maxParticipants: 50,
          allowAIInteractions: true
        }
      };

      await this.saveConversationContext(context);
      return context;
    } catch (error) {
      console.error('Failed to create human-AI conversation:', error);
      return null;
    }
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    const lastSeen = this.onlineUsers.get(userId);
    if (!lastSeen) return false;
    
    // Consider user online if seen within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen > fiveMinutesAgo;
  }

  /**
   * Get user's online status
   */
  public async getUserPresence(userId: string): Promise<{ isOnline: boolean; lastSeen: Date } | null> {
    try {
      const presence = await this.storageService.get<{ userId: string; lastSeen: Date; isOnline: boolean }>('user_presence', `presence_${userId}`);
      if (presence) {
        return {
          isOnline: this.isUserOnline(userId),
          lastSeen: new Date(presence.lastSeen)
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get user presence:', error);
      return null;
    }
  }

  /**
   * Search for users to invite
   */
  public async searchUsers(query: string, organizationId?: string): Promise<UserProfile[]> {
    try {
      // TODO: Implement user search with organization filtering
      // For now, return empty array
      console.log('🔍 Searching users:', query, organizationId);
      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
      this.presenceUpdateInterval = null;
    }
  }
}

export default HumanParticipantService;

