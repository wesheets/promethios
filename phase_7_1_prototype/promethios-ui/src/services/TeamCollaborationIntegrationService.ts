/**
 * TeamCollaborationIntegrationService - Central orchestrator for team collaboration
 * 
 * Provides unified integration layer that coordinates all team collaboration services:
 * - Organization management and team member coordination
 * - Human-to-human chat and messaging
 * - Guest agent sessions and supervised AI access
 * - Repository collaboration and version control
 * - Receipt sharing and audit trails
 * - Real-time synchronization across all collaboration features
 * 
 * This service acts as the central nervous system for the entire team collaboration
 * platform, ensuring seamless integration between all components.
 */

import { UnifiedStorageService } from './UnifiedStorageService';
import { OrganizationManagementService, Organization, TeamMember } from './OrganizationManagementService';
import HumanChatService, { HumanMessage, TeamConversation as HumanChat } from './HumanChatService';
import { GuestAgentService, GuestSession, ApprovalRequest } from './GuestAgentService';
import { WorkflowRepositoryManager, WorkflowRepository } from './WorkflowRepositoryManager';
import { AdvancedCollaborationService } from './AdvancedCollaborationService';
import { RepositoryVersionControl } from './RepositoryVersionControl';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface TeamCollaborationState {
  userId: string;
  userName: string;
  activeOrgId: string | null;
  organizations: Organization[];
  teamMembers: TeamMember[];
  humanChats: HumanChat[];
  guestSessions: GuestSession[];
  sharedRepositories: WorkflowRepository[];
  pendingApprovals: ApprovalRequest[];
  unreadMessages: number;
  activeCollaborations: number;
  lastSyncTime: Date;
}

export interface CollaborationNotification {
  id: string;
  type: 'message' | 'guest_request' | 'approval_request' | 'repository_update' | 'team_update';
  title: string;
  message: string;
  fromUserId: string;
  fromUserName: string;
  targetId: string; // chat id, session id, repository id, etc.
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  metadata: any;
}

export interface TeamActivity {
  id: string;
  type: 'chat_message' | 'guest_session' | 'repository_update' | 'approval' | 'team_change';
  userId: string;
  userName: string;
  orgId: string;
  description: string;
  timestamp: Date;
  metadata: any;
}

export interface CollaborationAnalytics {
  orgId: string;
  period: 'day' | 'week' | 'month';
  totalMessages: number;
  activeUsers: number;
  guestSessions: number;
  repositoryUpdates: number;
  approvalRequests: number;
  collaborationEfficiency: number;
  userEngagement: UserEngagement[];
  topCollaborations: TopCollaboration[];
  trendData: TrendData[];
}

export interface UserEngagement {
  userId: string;
  userName: string;
  messagesCount: number;
  repositoryContributions: number;
  guestSessionsHosted: number;
  guestSessionsJoined: number;
  approvalsGiven: number;
  lastActivity: Date;
  engagementScore: number;
}

export interface TopCollaboration {
  type: 'repository' | 'chat' | 'guest_session';
  id: string;
  name: string;
  participants: string[];
  activityCount: number;
  lastActivity: Date;
}

export interface TrendData {
  date: Date;
  messages: number;
  collaborations: number;
  approvals: number;
  newMembers: number;
}

export interface TeamCollaborationConfig {
  enableRealTimeSync: boolean;
  notificationSettings: NotificationSettings;
  defaultPermissions: DefaultPermissions;
  collaborationLimits: CollaborationLimits;
  securitySettings: SecuritySettings;
}

export interface NotificationSettings {
  enableInAppNotifications: boolean;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  notifyOnMessages: boolean;
  notifyOnGuestRequests: boolean;
  notifyOnApprovals: boolean;
  notifyOnRepositoryUpdates: boolean;
  quietHours: { start: string; end: string };
}

export interface DefaultPermissions {
  allowGuestRequests: boolean;
  requireApprovalForGuestSessions: boolean;
  allowRepositorySharing: boolean;
  allowReceiptSharing: boolean;
  defaultGuestPermissions: string[];
  defaultRepositoryPermissions: string[];
}

export interface CollaborationLimits {
  maxConcurrentGuestSessions: number;
  maxRepositoriesPerUser: number;
  maxTeamMembersPerOrg: number;
  maxMessagesPerDay: number;
  sessionTimeoutMinutes: number;
}

export interface SecuritySettings {
  requireTwoFactorAuth: boolean;
  enableAuditLogging: boolean;
  enableEncryption: boolean;
  dataRetentionDays: number;
  allowExternalSharing: boolean;
  ipWhitelist: string[];
}

export class TeamCollaborationIntegrationService {
  private static instance: TeamCollaborationIntegrationService;
  
  // Core services
  private storageService: UnifiedStorageService;
  private orgService: OrganizationManagementService;
  private chatService: HumanChatService;
  private guestService: GuestAgentService;
  private repoManager: WorkflowRepositoryManager;
  private collaborationService: AdvancedCollaborationService;
  private versionControl: RepositoryVersionControl;
  private governanceAdapter: UniversalGovernanceAdapter;

  // State management
  private collaborationStates: Map<string, TeamCollaborationState> = new Map();
  private notifications: Map<string, CollaborationNotification[]> = new Map();
  private activities: Map<string, TeamActivity[]> = new Map();
  private realTimeListeners: Map<string, () => void> = new Map();

  // Configuration
  private config: TeamCollaborationConfig;

  private constructor() {
    this.storageService = UnifiedStorageService.getInstance();
    this.orgService = OrganizationManagementService.getInstance();
    this.chatService = HumanChatService.getInstance();
    this.guestService = GuestAgentService.getInstance();
    this.repoManager = WorkflowRepositoryManager.getInstance();
    this.collaborationService = AdvancedCollaborationService.getInstance();
    this.versionControl = RepositoryVersionControl.getInstance();
    this.governanceAdapter = UniversalGovernanceAdapter.getInstance();

    this.config = this.getDefaultConfig();
    this.initializeRealTimeSync();
  }

  public static getInstance(): TeamCollaborationIntegrationService {
    if (!TeamCollaborationIntegrationService.instance) {
      TeamCollaborationIntegrationService.instance = new TeamCollaborationIntegrationService();
    }
    return TeamCollaborationIntegrationService.instance;
  }

  // =====================================
  // INITIALIZATION & CONFIGURATION
  // =====================================

  /**
   * Initialize team collaboration for a user
   */
  public async initializeUserCollaboration(userId: string, userName: string): Promise<TeamCollaborationState> {
    try {
      // Load user's collaboration state
      const state = await this.loadCollaborationState(userId, userName);
      
      // Cache state
      this.collaborationStates.set(userId, state);
      
      // Initialize real-time listeners
      this.setupRealTimeListeners(userId);
      
      // Load notifications
      await this.loadUserNotifications(userId);
      
      // Load activity history
      await this.loadUserActivities(userId);

      return state;

    } catch (error) {
      console.error('Error initializing user collaboration:', error);
      throw new Error(`Failed to initialize collaboration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load collaboration state for user
   */
  private async loadCollaborationState(userId: string, userName: string): Promise<TeamCollaborationState> {
    try {
      // Load organizations
      const organizations = await this.orgService.getUserOrganizations(userId);
      const activeOrgId = organizations.length > 0 ? organizations[0].orgId : null;

      // Load team members
      const teamMembers = activeOrgId 
        ? await this.orgService.getOrganizationMembers(activeOrgId)
        : [];

      // Load human chats
      const humanChats = await this.chatService.getUserConversations();

      // Load guest sessions
      const guestSessions = await this.guestService.getActiveSessions(userId);

      // Load shared repositories
      const sharedRepositories = await this.repoManager.listRepositories(userId);

      // Load pending approvals
      const pendingApprovals = await this.guestService.getPendingApprovals(userId);

      // Calculate metrics
      const unreadMessages = this.calculateUnreadMessages(humanChats);
      const activeCollaborations = this.calculateActiveCollaborations(guestSessions, sharedRepositories);

      return {
        userId,
        userName,
        activeOrgId,
        organizations,
        teamMembers: teamMembers.filter(m => m.userId !== userId),
        humanChats,
        guestSessions,
        sharedRepositories,
        pendingApprovals,
        unreadMessages,
        activeCollaborations,
        lastSyncTime: new Date()
      };

    } catch (error) {
      console.error('Error loading collaboration state:', error);
      throw error;
    }
  }

  /**
   * Update collaboration configuration
   */
  public async updateCollaborationConfig(userId: string, config: Partial<TeamCollaborationConfig>): Promise<void> {
    try {
      const currentConfig = await this.storageService.retrieve(`collaboration_config/${userId}`) || this.config;
      const updatedConfig = { ...currentConfig, ...config };
      
      await this.storageService.store(`collaboration_config/${userId}`, updatedConfig);
      
      // Update real-time sync if needed
      if (config.enableRealTimeSync !== undefined) {
        if (config.enableRealTimeSync) {
          this.setupRealTimeListeners(userId);
        } else {
          this.removeRealTimeListeners(userId);
        }
      }

    } catch (error) {
      console.error('Error updating collaboration config:', error);
      throw new Error(`Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================
  // UNIFIED COLLABORATION OPERATIONS
  // =====================================

  /**
   * Create a new team collaboration (chat, repository, or guest session)
   */
  public async createCollaboration(
    userId: string,
    type: 'chat' | 'repository' | 'guest_request',
    params: any
  ): Promise<any> {
    try {
      let result: any;

      switch (type) {
        case 'chat':
          result = await this.chatService.createChat(
            params.chatType,
            params.name,
            params.participants,
            params.orgId,
            userId,
            params.settings
          );
          break;

        case 'repository':
          result = await this.repoManager.createRepository(
            params.name,
            params.description,
            params.template,
            userId,
            params.isPrivate
          );
          break;

        case 'guest_request':
          result = await this.guestService.requestGuestAccess(
            userId,
            params.hostUserId,
            params.agentId,
            params.purpose,
            params.requestMessage,
            params.permissions,
            params.settings
          );
          break;

        default:
          throw new Error(`Unknown collaboration type: ${type}`);
      }

      // Log activity
      await this.logActivity(userId, `${type}_created`, `Created ${type}: ${params.name || params.purpose}`, {
        type,
        targetId: result.id,
        params
      });

      // Send notifications
      await this.sendCollaborationNotifications(userId, type, 'created', result, params);

      // Refresh user state
      await this.refreshUserState(userId);

      return result;

    } catch (error) {
      console.error('Error creating collaboration:', error);
      throw new Error(`Failed to create ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Join an existing collaboration
   */
  public async joinCollaboration(
    userId: string,
    type: 'chat' | 'repository' | 'guest_session',
    targetId: string,
    params: any = {}
  ): Promise<void> {
    try {
      switch (type) {
        case 'chat':
          await this.chatService.addParticipant(targetId, userId, params.addedBy);
          break;

        case 'repository':
          await this.collaborationService.addCollaborator(
            targetId,
            userId,
            params.role || 'viewer',
            params.addedBy
          );
          break;

        case 'guest_session':
          await this.guestService.respondToGuestRequest(
            targetId,
            userId,
            'accept',
            params.modifiedPermissions,
            params.modifiedSettings,
            params.responseMessage
          );
          break;

        default:
          throw new Error(`Unknown collaboration type: ${type}`);
      }

      // Log activity
      await this.logActivity(userId, `${type}_joined`, `Joined ${type}: ${targetId}`, {
        type,
        targetId,
        params
      });

      // Refresh user state
      await this.refreshUserState(userId);

    } catch (error) {
      console.error('Error joining collaboration:', error);
      throw new Error(`Failed to join ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Leave a collaboration
   */
  public async leaveCollaboration(
    userId: string,
    type: 'chat' | 'repository' | 'guest_session',
    targetId: string,
    reason?: string
  ): Promise<void> {
    try {
      switch (type) {
        case 'chat':
          await this.chatService.removeParticipant(targetId, userId, userId);
          break;

        case 'repository':
          await this.collaborationService.removeCollaborator(targetId, userId, userId);
          break;

        case 'guest_session':
          await this.guestService.endGuestSession(targetId, userId, reason);
          break;

        default:
          throw new Error(`Unknown collaboration type: ${type}`);
      }

      // Log activity
      await this.logActivity(userId, `${type}_left`, `Left ${type}: ${targetId}`, {
        type,
        targetId,
        reason
      });

      // Refresh user state
      await this.refreshUserState(userId);

    } catch (error) {
      console.error('Error leaving collaboration:', error);
      throw new Error(`Failed to leave ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================
  // NOTIFICATION MANAGEMENT
  // =====================================

  /**
   * Get user notifications
   */
  public async getUserNotifications(userId: string): Promise<CollaborationNotification[]> {
    try {
      const notifications = this.notifications.get(userId) || [];
      return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  public async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notifications = this.notifications.get(userId) || [];
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        await this.storageService.store(`user_notifications/${userId}`, notifications);
      }

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Send collaboration notifications
   */
  private async sendCollaborationNotifications(
    fromUserId: string,
    type: string,
    action: string,
    target: any,
    params: any
  ): Promise<void> {
    try {
      const fromUser = await this.getUserInfo(fromUserId);
      if (!fromUser) return;

      let recipients: string[] = [];
      let notificationTitle = '';
      let notificationMessage = '';

      // Determine recipients and message based on type and action
      switch (type) {
        case 'chat':
          recipients = target.participants
            .filter((p: any) => p.userId !== fromUserId)
            .map((p: any) => p.userId);
          notificationTitle = 'New Chat Created';
          notificationMessage = `${fromUser.userName} created a new chat: ${target.name}`;
          break;

        case 'repository':
          // Repository notifications handled by AdvancedCollaborationService
          return;

        case 'guest_request':
          recipients = [target.toUserId];
          notificationTitle = 'Guest Agent Request';
          notificationMessage = `${fromUser.userName} wants to collaborate with your agent`;
          break;
      }

      // Send notifications to recipients
      for (const recipientId of recipients) {
        await this.addNotification(recipientId, {
          type: type as any,
          title: notificationTitle,
          message: notificationMessage,
          fromUserId,
          fromUserName: fromUser.userName,
          targetId: target.id,
          priority: 'medium',
          actionRequired: type === 'guest_request'
        });
      }

    } catch (error) {
      console.error('Error sending collaboration notifications:', error);
    }
  }

  /**
   * Add notification for user
   */
  private async addNotification(userId: string, notification: Partial<CollaborationNotification>): Promise<void> {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullNotification: CollaborationNotification = {
        id: notificationId,
        type: notification.type || 'message',
        title: notification.title || '',
        message: notification.message || '',
        fromUserId: notification.fromUserId || 'system',
        fromUserName: notification.fromUserName || 'System',
        targetId: notification.targetId || '',
        priority: notification.priority || 'medium',
        timestamp: new Date(),
        read: false,
        actionRequired: notification.actionRequired || false,
        metadata: notification.metadata || {}
      };

      const userNotifications = this.notifications.get(userId) || [];
      userNotifications.unshift(fullNotification);

      // Keep only last 100 notifications
      if (userNotifications.length > 100) {
        userNotifications.splice(100);
      }

      this.notifications.set(userId, userNotifications);
      await this.storageService.store(`user_notifications/${userId}`, userNotifications);

    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }

  // =====================================
  // ACTIVITY TRACKING
  // =====================================

  /**
   * Log team activity
   */
  private async logActivity(
    userId: string,
    type: string,
    description: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      const user = await this.getUserInfo(userId);
      if (!user) return;

      const state = this.collaborationStates.get(userId);
      if (!state || !state.activeOrgId) return;

      const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const activity: TeamActivity = {
        id: activityId,
        type: type as any,
        userId,
        userName: user.userName,
        orgId: state.activeOrgId,
        description,
        timestamp: new Date(),
        metadata
      };

      // Add to organization activities
      const orgActivities = this.activities.get(state.activeOrgId) || [];
      orgActivities.unshift(activity);

      // Keep only last 1000 activities
      if (orgActivities.length > 1000) {
        orgActivities.splice(1000);
      }

      this.activities.set(state.activeOrgId, orgActivities);
      await this.storageService.store(`org_activities/${state.activeOrgId}`, orgActivities);

    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get organization activities
   */
  public async getOrganizationActivities(orgId: string, limit: number = 50): Promise<TeamActivity[]> {
    try {
      const activities = this.activities.get(orgId) || [];
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error getting organization activities:', error);
      return [];
    }
  }

  // =====================================
  // ANALYTICS & REPORTING
  // =====================================

  /**
   * Get collaboration analytics for organization
   */
  public async getCollaborationAnalytics(
    orgId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<CollaborationAnalytics> {
    try {
      const activities = await this.getOrganizationActivities(orgId, 10000);
      const members = await this.orgService.getOrganizationMembers(orgId);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Filter activities by period
      const periodActivities = activities.filter(a => a.timestamp >= startDate);

      // Calculate metrics
      const totalMessages = periodActivities.filter(a => a.type === 'chat_message').length;
      const activeUsers = new Set(periodActivities.map(a => a.userId)).size;
      const guestSessions = periodActivities.filter(a => a.type === 'guest_session').length;
      const repositoryUpdates = periodActivities.filter(a => a.type === 'repository_update').length;
      const approvalRequests = periodActivities.filter(a => a.type === 'approval').length;

      // Calculate user engagement
      const userEngagement: UserEngagement[] = members.map(member => {
        const userActivities = periodActivities.filter(a => a.userId === member.userId);
        const messagesCount = userActivities.filter(a => a.type === 'chat_message').length;
        const repositoryContributions = userActivities.filter(a => a.type === 'repository_update').length;
        const guestSessionsHosted = userActivities.filter(a => 
          a.type === 'guest_session' && a.metadata?.role === 'host'
        ).length;
        const guestSessionsJoined = userActivities.filter(a => 
          a.type === 'guest_session' && a.metadata?.role === 'guest'
        ).length;
        const approvalsGiven = userActivities.filter(a => a.type === 'approval').length;

        const engagementScore = this.calculateEngagementScore(
          messagesCount,
          repositoryContributions,
          guestSessionsHosted + guestSessionsJoined,
          approvalsGiven
        );

        return {
          userId: member.userId,
          userName: member.userName,
          messagesCount,
          repositoryContributions,
          guestSessionsHosted,
          guestSessionsJoined,
          approvalsGiven,
          lastActivity: userActivities.length > 0 ? userActivities[0].timestamp : member.joinedAt,
          engagementScore
        };
      });

      // Calculate collaboration efficiency (placeholder)
      const collaborationEfficiency = Math.min(100, Math.round(
        (totalMessages + repositoryUpdates + guestSessions) / Math.max(1, members.length) * 10
      ));

      // Generate trend data
      const trendData: TrendData[] = this.generateTrendData(periodActivities, period);

      return {
        orgId,
        period,
        totalMessages,
        activeUsers,
        guestSessions,
        repositoryUpdates,
        approvalRequests,
        collaborationEfficiency,
        userEngagement: userEngagement.sort((a, b) => b.engagementScore - a.engagementScore),
        topCollaborations: [], // TODO: Implement top collaborations
        trendData
      };

    } catch (error) {
      console.error('Error getting collaboration analytics:', error);
      throw new Error(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================
  // REAL-TIME SYNCHRONIZATION
  // =====================================

  /**
   * Initialize real-time sync
   */
  private initializeRealTimeSync(): void {
    // Set up periodic sync for all active users
    setInterval(() => {
      this.syncAllActiveUsers();
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Setup real-time listeners for user
   */
  private setupRealTimeListeners(userId: string): void {
    // Remove existing listeners
    this.removeRealTimeListeners(userId);

    // Set up new listeners
    const syncInterval = setInterval(() => {
      this.syncUserState(userId);
    }, 10000); // Sync every 10 seconds

    this.realTimeListeners.set(userId, () => {
      clearInterval(syncInterval);
    });
  }

  /**
   * Remove real-time listeners for user
   */
  private removeRealTimeListeners(userId: string): void {
    const cleanup = this.realTimeListeners.get(userId);
    if (cleanup) {
      cleanup();
      this.realTimeListeners.delete(userId);
    }
  }

  /**
   * Sync user state
   */
  private async syncUserState(userId: string): Promise<void> {
    try {
      const state = this.collaborationStates.get(userId);
      if (!state) return;

      // Refresh state from storage
      const updatedState = await this.loadCollaborationState(userId, state.userName);
      this.collaborationStates.set(userId, updatedState);

      // Check for new notifications
      await this.loadUserNotifications(userId);

    } catch (error) {
      console.error('Error syncing user state:', error);
    }
  }

  /**
   * Sync all active users
   */
  private async syncAllActiveUsers(): Promise<void> {
    const activeUsers = Array.from(this.collaborationStates.keys());
    
    for (const userId of activeUsers) {
      try {
        await this.syncUserState(userId);
      } catch (error) {
        console.error(`Error syncing user ${userId}:`, error);
      }
    }
  }

  /**
   * Refresh user state
   */
  public async refreshUserState(userId: string): Promise<TeamCollaborationState | null> {
    try {
      const state = this.collaborationStates.get(userId);
      if (!state) return null;

      const updatedState = await this.loadCollaborationState(userId, state.userName);
      this.collaborationStates.set(userId, updatedState);

      return updatedState;

    } catch (error) {
      console.error('Error refreshing user state:', error);
      return null;
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  /**
   * Get user collaboration state
   */
  public getUserCollaborationState(userId: string): TeamCollaborationState | null {
    return this.collaborationStates.get(userId) || null;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): TeamCollaborationConfig {
    return {
      enableRealTimeSync: true,
      notificationSettings: {
        enableInAppNotifications: true,
        enableEmailNotifications: false,
        enablePushNotifications: false,
        notifyOnMessages: true,
        notifyOnGuestRequests: true,
        notifyOnApprovals: true,
        notifyOnRepositoryUpdates: true,
        quietHours: { start: '22:00', end: '08:00' }
      },
      defaultPermissions: {
        allowGuestRequests: true,
        requireApprovalForGuestSessions: true,
        allowRepositorySharing: true,
        allowReceiptSharing: true,
        defaultGuestPermissions: ['chat_with_agent'],
        defaultRepositoryPermissions: ['view_repository']
      },
      collaborationLimits: {
        maxConcurrentGuestSessions: 5,
        maxRepositoriesPerUser: 50,
        maxTeamMembersPerOrg: 100,
        maxMessagesPerDay: 1000,
        sessionTimeoutMinutes: 120
      },
      securitySettings: {
        requireTwoFactorAuth: false,
        enableAuditLogging: true,
        enableEncryption: true,
        dataRetentionDays: 365,
        allowExternalSharing: false,
        ipWhitelist: []
      }
    };
  }

  /**
   * Get user info
   */
  private async getUserInfo(userId: string): Promise<{ userName: string } | null> {
    try {
      const state = this.collaborationStates.get(userId);
      if (state) {
        return { userName: state.userName };
      }

      // Try to get from organization members
      const orgs = await this.orgService.getUserOrganizations(userId);
      for (const org of orgs) {
        const members = await this.orgService.getOrganizationMembers(org.orgId);
        const member = members.find(m => m.userId === userId);
        if (member) {
          return { userName: member.userName };
        }
      }

      return null;

    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  /**
   * Calculate unread messages
   */
  private calculateUnreadMessages(chats: HumanChat[]): number {
    // Placeholder - in real implementation, track read status
    return chats.reduce((total, chat) => total + (chat.lastMessage ? 1 : 0), 0);
  }

  /**
   * Calculate active collaborations
   */
  private calculateActiveCollaborations(sessions: GuestSession[], repositories: WorkflowRepository[]): number {
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const activeRepos = repositories.filter(r => r.status === 'active').length;
    return activeSessions + activeRepos;
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(
    messages: number,
    repoContributions: number,
    guestSessions: number,
    approvals: number
  ): number {
    return Math.min(100, Math.round(
      (messages * 1) + 
      (repoContributions * 3) + 
      (guestSessions * 2) + 
      (approvals * 1.5)
    ));
  }

  /**
   * Generate trend data
   */
  private generateTrendData(activities: TeamActivity[], period: 'day' | 'week' | 'month'): TrendData[] {
    const trendData: TrendData[] = [];
    const now = new Date();
    
    // Generate data points based on period
    const points = period === 'day' ? 24 : period === 'week' ? 7 : 30;
    
    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'day') {
        date.setHours(date.getHours() - i);
      } else if (period === 'week') {
        date.setDate(date.getDate() - i);
      } else {
        date.setDate(date.getDate() - i);
      }

      const dayActivities = activities.filter(a => {
        const activityDate = new Date(a.timestamp);
        if (period === 'day') {
          return activityDate.getHours() === date.getHours() &&
                 activityDate.getDate() === date.getDate();
        } else {
          return activityDate.getDate() === date.getDate() &&
                 activityDate.getMonth() === date.getMonth();
        }
      });

      trendData.push({
        date,
        messages: dayActivities.filter(a => a.type === 'chat_message').length,
        collaborations: dayActivities.filter(a => 
          a.type === 'guest_session' || a.type === 'repository_update'
        ).length,
        approvals: dayActivities.filter(a => a.type === 'approval').length,
        newMembers: dayActivities.filter(a => a.type === 'team_change').length
      });
    }

    return trendData;
  }

  /**
   * Load user notifications
   */
  private async loadUserNotifications(userId: string): Promise<void> {
    try {
      const notifications = await this.storageService.retrieve(`user_notifications/${userId}`) || [];
      this.notifications.set(userId, notifications);
    } catch (error) {
      console.error('Error loading user notifications:', error);
    }
  }

  /**
   * Load user activities
   */
  private async loadUserActivities(userId: string): Promise<void> {
    try {
      const state = this.collaborationStates.get(userId);
      if (!state || !state.activeOrgId) return;

      const activities = await this.storageService.retrieve(`org_activities/${state.activeOrgId}`) || [];
      this.activities.set(state.activeOrgId, activities);
    } catch (error) {
      console.error('Error loading user activities:', error);
    }
  }

  /**
   * Cleanup user session
   */
  public async cleanupUserSession(userId: string): Promise<void> {
    try {
      // Remove real-time listeners
      this.removeRealTimeListeners(userId);
      
      // Clear cached state
      this.collaborationStates.delete(userId);
      this.notifications.delete(userId);

    } catch (error) {
      console.error('Error cleaning up user session:', error);
    }
  }
}

export default TeamCollaborationIntegrationService;

