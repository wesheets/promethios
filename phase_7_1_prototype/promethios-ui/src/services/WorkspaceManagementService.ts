/**
 * Workspace Management Service
 * 
 * Provides multi-workspace support for organizations, allowing teams to organize
 * their AI agents, repositories, and collaboration into separate workspaces.
 * 
 * Features:
 * - Multi-workspace organization
 * - Workspace-specific permissions and settings
 * - Cross-workspace collaboration
 * - Workspace templates and presets
 * - Resource isolation and management
 * - Workspace analytics and monitoring
 */

import { OrganizationManagementService, Organization, TeamMember } from './OrganizationManagementService';
import { WorkflowRepository } from './WorkflowRepositoryManager';
import { CollaborativeRepository } from './AdvancedCollaborationService';
import { GuestSession } from './GuestAgentService';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  
  // Ownership and permissions
  ownerId: string;
  ownerName: string;
  members: WorkspaceMember[];
  permissions: WorkspacePermissions;
  
  // Configuration
  settings: WorkspaceSettings;
  template?: WorkspaceTemplate;
  
  // Resources
  agents: WorkspaceAgent[];
  repositories: string[]; // Repository IDs
  guestSessions: string[]; // Guest session IDs
  
  // Status and metadata
  status: 'active' | 'archived' | 'suspended';
  visibility: 'private' | 'internal' | 'public';
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  
  // Analytics
  usage: WorkspaceUsage;
  metrics: WorkspaceMetrics;
  
  // Customization
  theme: WorkspaceTheme;
  branding: WorkspaceBranding;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  userName: string;
  email?: string;
  avatar?: string;
  
  // Role and permissions
  role: 'owner' | 'admin' | 'member' | 'guest';
  permissions: WorkspaceMemberPermissions;
  
  // Status
  status: 'active' | 'inactive' | 'invited' | 'suspended';
  joinedAt: Date;
  lastSeen: Date;
  invitedBy?: string;
  
  // Preferences
  preferences: MemberPreferences;
  
  // Activity
  activitySummary: MemberActivitySummary;
}

export interface WorkspacePermissions {
  // General permissions
  canViewWorkspace: boolean;
  canEditWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  
  // Resource permissions
  canCreateAgents: boolean;
  canManageAgents: boolean;
  canCreateRepositories: boolean;
  canManageRepositories: boolean;
  canInviteGuests: boolean;
  canManageGuestSessions: boolean;
  
  // Advanced permissions
  canViewAnalytics: boolean;
  canManageIntegrations: boolean;
  canManageBilling: boolean;
  canExportData: boolean;
}

export interface WorkspaceMemberPermissions extends WorkspacePermissions {
  // Member-specific overrides
  restrictedAgents?: string[];
  restrictedRepositories?: string[];
  allowedOperations?: string[];
  timeRestrictions?: TimeRestriction[];
}

export interface TimeRestriction {
  type: 'hours' | 'days' | 'date_range';
  value: string;
  timezone: string;
  description: string;
}

export interface WorkspaceSettings {
  // General settings
  defaultAgentModel: string;
  defaultRepositoryTemplate: string;
  autoArchiveInactiveDays: number;
  
  // Security settings
  requireTwoFactor: boolean;
  allowGuestAccess: boolean;
  guestSessionTimeout: number; // minutes
  ipWhitelist?: string[];
  
  // Collaboration settings
  enableRealTimeCollaboration: boolean;
  maxConcurrentSessions: number;
  autoSaveInterval: number; // seconds
  
  // Notification settings
  emailNotifications: boolean;
  slackIntegration?: SlackIntegration;
  webhookUrls: string[];
  
  // Resource limits
  maxAgents: number;
  maxRepositories: number;
  maxStorageGB: number;
  maxMembersPerWorkspace: number;
  
  // AI settings
  aiModelPreferences: AIModelPreferences;
  governanceSettings: GovernanceSettings;
}

export interface SlackIntegration {
  enabled: boolean;
  webhookUrl: string;
  channelId: string;
  notificationTypes: string[];
}

export interface AIModelPreferences {
  preferredModels: string[];
  fallbackModels: string[];
  customEndpoints?: CustomEndpoint[];
  rateLimits: ModelRateLimits;
}

export interface CustomEndpoint {
  name: string;
  url: string;
  apiKey: string;
  modelType: string;
}

export interface ModelRateLimits {
  requestsPerMinute: number;
  tokensPerDay: number;
  costLimitPerMonth: number; // USD
}

export interface GovernanceSettings {
  enableCompliance: boolean;
  auditLevel: 'basic' | 'detailed' | 'comprehensive';
  retentionPeriodDays: number;
  requireApprovalForHighRisk: boolean;
  allowedTools: string[];
  restrictedTopics: string[];
}

export interface WorkspaceAgent {
  id: string;
  name: string;
  description: string;
  type: 'assistant' | 'specialist' | 'autonomous';
  
  // Configuration
  model: string;
  systemPrompt: string;
  tools: string[];
  
  // Permissions
  permissions: AgentPermissions;
  restrictions: AgentRestrictions;
  
  // Status
  status: 'active' | 'inactive' | 'training' | 'error';
  createdBy: string;
  createdAt: Date;
  lastUsed: Date;
  
  // Usage
  usage: AgentUsage;
  performance: AgentPerformance;
}

export interface AgentPermissions {
  canAccessRepositories: boolean;
  canModifyFiles: boolean;
  canExecuteCode: boolean;
  canAccessInternet: boolean;
  canSendEmails: boolean;
  canManageUsers: boolean;
  allowedRepositories?: string[];
  allowedTools?: string[];
}

export interface AgentRestrictions {
  maxTokensPerRequest: number;
  maxRequestsPerHour: number;
  maxCostPerDay: number; // USD
  restrictedDomains?: string[];
  restrictedFileTypes?: string[];
  requireApprovalFor?: string[];
}

export interface AgentUsage {
  totalRequests: number;
  totalTokens: number;
  totalCost: number; // USD
  averageResponseTime: number; // ms
  lastUsed: Date;
  
  // Time-based usage
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  
  // Cost tracking
  costToday: number;
  costThisWeek: number;
  costThisMonth: number;
}

export interface AgentPerformance {
  successRate: number; // 0-100
  averageRating: number; // 0-5
  totalRatings: number;
  errorRate: number; // 0-100
  
  // Response quality
  helpfulnessScore: number; // 0-100
  accuracyScore: number; // 0-100
  creativityScore: number; // 0-100
  
  // Efficiency metrics
  taskCompletionRate: number; // 0-100
  averageTaskTime: number; // minutes
  resourceUtilization: number; // 0-100
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'research' | 'marketing' | 'support' | 'general';
  
  // Template configuration
  defaultSettings: Partial<WorkspaceSettings>;
  defaultAgents: Partial<WorkspaceAgent>[];
  defaultRepositories: WorkspaceRepositoryTemplate[];
  
  // Metadata
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  tags: string[];
}

export interface WorkspaceRepositoryTemplate {
  name: string;
  description: string;
  type: string;
  template: string;
  initialFiles: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'text' | 'binary';
}

export interface WorkspaceUsage {
  // Resource usage
  agentsUsed: number;
  repositoriesUsed: number;
  storageUsedGB: number;
  membersCount: number;
  
  // Activity metrics
  totalSessions: number;
  totalMessages: number;
  totalCommits: number;
  totalCollaborations: number;
  
  // Time-based usage
  activeHoursToday: number;
  activeHoursThisWeek: number;
  activeHoursThisMonth: number;
  
  // Cost tracking
  totalCost: number; // USD
  costThisMonth: number;
  projectedMonthlyCost: number;
}

export interface WorkspaceMetrics {
  // Performance metrics
  averageResponseTime: number; // ms
  successRate: number; // 0-100
  userSatisfaction: number; // 0-5
  
  // Collaboration metrics
  collaborationScore: number; // 0-100
  averageSessionDuration: number; // minutes
  crossTeamInteractions: number;
  
  // Productivity metrics
  tasksCompleted: number;
  projectsDelivered: number;
  codeQualityScore: number; // 0-100
  
  // Growth metrics
  memberGrowthRate: number; // percentage
  usageGrowthRate: number; // percentage
  retentionRate: number; // percentage
}

export interface WorkspaceTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  
  // Layout preferences
  sidebarPosition: 'left' | 'right';
  compactMode: boolean;
  darkMode: boolean;
  
  // Custom CSS
  customCSS?: string;
}

export interface WorkspaceBranding {
  logo?: string;
  favicon?: string;
  companyName?: string;
  customDomain?: string;
  
  // Footer customization
  footerText?: string;
  footerLinks?: BrandingLink[];
  
  // Email branding
  emailLogo?: string;
  emailSignature?: string;
}

export interface BrandingLink {
  text: string;
  url: string;
  openInNewTab: boolean;
}

export interface MemberPreferences {
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  
  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: string[];
  
  // Workspace preferences
  defaultView: 'dashboard' | 'agents' | 'repositories' | 'chat';
  autoSave: boolean;
  showTips: boolean;
}

export interface MemberActivitySummary {
  // Recent activity
  lastLogin: Date;
  sessionsThisWeek: number;
  messagesThisWeek: number;
  
  // Contributions
  repositoriesContributed: number;
  commitsThisMonth: number;
  collaborationsThisMonth: number;
  
  // Engagement
  averageSessionDuration: number; // minutes
  favoriteAgents: string[];
  mostUsedFeatures: string[];
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: WorkspaceMember['role'];
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
  
  // Message
  personalMessage?: string;
  
  // Permissions preview
  permissionsPreview: WorkspaceMemberPermissions;
}

export interface WorkspaceActivity {
  id: string;
  workspaceId: string;
  type: 'member_joined' | 'member_left' | 'agent_created' | 'repository_created' | 
        'collaboration_started' | 'settings_changed' | 'integration_added';
  
  // Actor
  actorId: string;
  actorName: string;
  actorType: 'member' | 'system' | 'integration';
  
  // Details
  timestamp: Date;
  description: string;
  details: Record<string, any>;
  
  // Context
  resourceId?: string;
  resourceType?: string;
  
  // Visibility
  visibility: 'public' | 'members' | 'admins';
}

export class WorkspaceManagementService {
  private static instance: WorkspaceManagementService;
  private orgService: OrganizationManagementService;
  
  private workspaces: Map<string, Workspace> = new Map();
  private templates: Map<string, WorkspaceTemplate> = new Map();
  private invitations: Map<string, WorkspaceInvitation> = new Map();
  private activities: Map<string, WorkspaceActivity[]> = new Map();
  
  // Event listeners
  private eventListeners: Map<string, ((event: WorkspaceEvent) => void)[]> = new Map();

  private constructor() {
    this.orgService = OrganizationManagementService.getInstance();
    this.initializeService();
  }

  public static getInstance(): WorkspaceManagementService {
    if (!WorkspaceManagementService.instance) {
      WorkspaceManagementService.instance = new WorkspaceManagementService();
    }
    return WorkspaceManagementService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      // Load existing workspaces
      await this.loadWorkspaces();
      
      // Load templates
      await this.loadTemplates();
      
      // Set up periodic cleanup
      setInterval(() => this.performMaintenance(), 60 * 60 * 1000); // Every hour
      
      console.log('WorkspaceManagementService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WorkspaceManagementService:', error);
    }
  }

  // =====================================
  // WORKSPACE MANAGEMENT
  // =====================================

  public async createWorkspace(organizationId: string, ownerId: string, workspaceData: Partial<Workspace>): Promise<string> {
    try {
      // Validate organization
      const organization = await this.orgService.getOrganization(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Check permissions
      const canCreate = await this.orgService.checkUserPermission(ownerId, 'create_workspace');
      if (!canCreate) {
        throw new Error('Insufficient permissions to create workspace');
      }

      // Create workspace
      const workspace: Workspace = {
        id: this.generateWorkspaceId(),
        name: workspaceData.name || 'New Workspace',
        description: workspaceData.description || '',
        organizationId,
        ownerId,
        ownerName: await this.getUserName(ownerId),
        members: [],
        permissions: this.createDefaultPermissions(),
        settings: this.createDefaultSettings(),
        template: workspaceData.template,
        agents: [],
        repositories: [],
        guestSessions: [],
        status: 'active',
        visibility: workspaceData.visibility || 'private',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        usage: this.createEmptyUsage(),
        metrics: this.createEmptyMetrics(),
        theme: this.createDefaultTheme(),
        branding: this.createDefaultBranding()
      };

      // Add owner as first member
      const ownerMember: WorkspaceMember = {
        id: this.generateMemberId(),
        userId: ownerId,
        userName: workspace.ownerName,
        role: 'owner',
        permissions: this.createOwnerPermissions(),
        status: 'active',
        joinedAt: new Date(),
        lastSeen: new Date(),
        preferences: this.createDefaultPreferences(),
        activitySummary: this.createEmptyActivitySummary()
      };

      workspace.members.push(ownerMember);

      // Apply template if specified
      if (workspace.template) {
        await this.applyTemplate(workspace, workspace.template);
      }

      // Store workspace
      this.workspaces.set(workspace.id, workspace);
      await this.saveWorkspace(workspace);

      // Log activity
      await this.logActivity(workspace.id, {
        type: 'workspace_created',
        actorId: ownerId,
        actorName: workspace.ownerName,
        actorType: 'member',
        timestamp: new Date(),
        description: `Created workspace "${workspace.name}"`,
        details: { template: workspace.template?.name },
        visibility: 'members'
      });

      // Emit event
      this.emitEvent(workspace.id, {
        type: 'workspace_created',
        workspaceId: workspace.id,
        userId: ownerId,
        timestamp: new Date(),
        data: workspace
      });

      return workspace.id;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  }

  public async updateWorkspace(workspaceId: string, userId: string, updates: Partial<Workspace>): Promise<void> {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Check permissions
      if (!await this.canEditWorkspace(workspaceId, userId)) {
        throw new Error('Insufficient permissions to update workspace');
      }

      // Apply updates
      Object.assign(workspace, updates);
      workspace.updatedAt = new Date();
      workspace.lastActivity = new Date();

      // Save workspace
      await this.saveWorkspace(workspace);

      // Log activity
      await this.logActivity(workspaceId, {
        type: 'settings_changed',
        actorId: userId,
        actorName: await this.getUserName(userId),
        actorType: 'member',
        timestamp: new Date(),
        description: 'Updated workspace settings',
        details: updates,
        visibility: 'members'
      });

      // Emit event
      this.emitEvent(workspaceId, {
        type: 'workspace_updated',
        workspaceId,
        userId,
        timestamp: new Date(),
        data: updates
      });

    } catch (error) {
      console.error('Failed to update workspace:', error);
      throw error;
    }
  }

  public async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Check permissions (only owner can delete)
      if (workspace.ownerId !== userId) {
        throw new Error('Only workspace owner can delete workspace');
      }

      // Archive instead of delete for safety
      workspace.status = 'archived';
      workspace.updatedAt = new Date();

      // Clean up resources
      await this.cleanupWorkspaceResources(workspace);

      // Save workspace
      await this.saveWorkspace(workspace);

      // Log activity
      await this.logActivity(workspaceId, {
        type: 'workspace_deleted',
        actorId: userId,
        actorName: await this.getUserName(userId),
        actorType: 'member',
        timestamp: new Date(),
        description: 'Archived workspace',
        details: {},
        visibility: 'members'
      });

      // Emit event
      this.emitEvent(workspaceId, {
        type: 'workspace_deleted',
        workspaceId,
        userId,
        timestamp: new Date(),
        data: {}
      });

    } catch (error) {
      console.error('Failed to delete workspace:', error);
      throw error;
    }
  }

  // =====================================
  // MEMBER MANAGEMENT
  // =====================================

  public async inviteMember(workspaceId: string, inviterId: string, inviteeEmail: string, role: WorkspaceMember['role'], personalMessage?: string): Promise<string> {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Check permissions
      if (!await this.canManageMembers(workspaceId, inviterId)) {
        throw new Error('Insufficient permissions to invite members');
      }

      // Check if already a member
      const existingMember = workspace.members.find(m => m.email === inviteeEmail);
      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }

      // Create invitation
      const invitation: WorkspaceInvitation = {
        id: this.generateInvitationId(),
        workspaceId,
        workspaceName: workspace.name,
        inviterId,
        inviterName: await this.getUserName(inviterId),
        inviteeEmail,
        role,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        personalMessage,
        permissionsPreview: this.createRolePermissions(role)
      };

      // Store invitation
      this.invitations.set(invitation.id, invitation);
      await this.saveInvitation(invitation);

      // Send invitation email
      await this.sendInvitationEmail(invitation);

      // Log activity
      await this.logActivity(workspaceId, {
        type: 'member_invited',
        actorId: inviterId,
        actorName: invitation.inviterName,
        actorType: 'member',
        timestamp: new Date(),
        description: `Invited ${inviteeEmail} as ${role}`,
        details: { email: inviteeEmail, role },
        visibility: 'admins'
      });

      return invitation.id;
    } catch (error) {
      console.error('Failed to invite member:', error);
      throw error;
    }
  }

  public async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const invitation = this.invitations.get(invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Invitation is no longer valid');
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      const workspace = this.workspaces.get(invitation.workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Create member
      const member: WorkspaceMember = {
        id: this.generateMemberId(),
        userId,
        userName: await this.getUserName(userId),
        email: invitation.inviteeEmail,
        role: invitation.role,
        permissions: invitation.permissionsPreview,
        status: 'active',
        joinedAt: new Date(),
        lastSeen: new Date(),
        invitedBy: invitation.inviterId,
        preferences: this.createDefaultPreferences(),
        activitySummary: this.createEmptyActivitySummary()
      };

      // Add to workspace
      workspace.members.push(member);
      workspace.updatedAt = new Date();
      workspace.lastActivity = new Date();

      // Update invitation
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();

      // Save changes
      await this.saveWorkspace(workspace);
      await this.saveInvitation(invitation);

      // Log activity
      await this.logActivity(workspace.id, {
        type: 'member_joined',
        actorId: userId,
        actorName: member.userName,
        actorType: 'member',
        timestamp: new Date(),
        description: `${member.userName} joined the workspace`,
        details: { role: member.role },
        visibility: 'members'
      });

      // Emit event
      this.emitEvent(workspace.id, {
        type: 'member_joined',
        workspaceId: workspace.id,
        userId,
        timestamp: new Date(),
        data: member
      });

    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  public async removeMember(workspaceId: string, removerId: string, memberId: string): Promise<void> {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Check permissions
      if (!await this.canManageMembers(workspaceId, removerId)) {
        throw new Error('Insufficient permissions to remove members');
      }

      // Find member
      const memberIndex = workspace.members.findIndex(m => m.id === memberId);
      if (memberIndex === -1) {
        throw new Error('Member not found');
      }

      const member = workspace.members[memberIndex];

      // Cannot remove owner
      if (member.role === 'owner') {
        throw new Error('Cannot remove workspace owner');
      }

      // Remove member
      workspace.members.splice(memberIndex, 1);
      workspace.updatedAt = new Date();
      workspace.lastActivity = new Date();

      // Save workspace
      await this.saveWorkspace(workspace);

      // Log activity
      await this.logActivity(workspaceId, {
        type: 'member_left',
        actorId: removerId,
        actorName: await this.getUserName(removerId),
        actorType: 'member',
        timestamp: new Date(),
        description: `Removed ${member.userName} from workspace`,
        details: { removedMember: member.userName, previousRole: member.role },
        visibility: 'admins'
      });

      // Emit event
      this.emitEvent(workspaceId, {
        type: 'member_removed',
        workspaceId,
        userId: removerId,
        timestamp: new Date(),
        data: { removedMember: member }
      });

    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }

  // =====================================
  // AGENT MANAGEMENT
  // =====================================

  public async createAgent(workspaceId: string, userId: string, agentData: Partial<WorkspaceAgent>): Promise<string> {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Check permissions
      if (!await this.canCreateAgents(workspaceId, userId)) {
        throw new Error('Insufficient permissions to create agents');
      }

      // Check limits
      if (workspace.agents.length >= workspace.settings.maxAgents) {
        throw new Error('Maximum number of agents reached');
      }

      // Create agent
      const agent: WorkspaceAgent = {
        id: this.generateAgentId(),
        name: agentData.name || 'New Agent',
        description: agentData.description || '',
        type: agentData.type || 'assistant',
        model: agentData.model || workspace.settings.defaultAgentModel,
        systemPrompt: agentData.systemPrompt || '',
        tools: agentData.tools || [],
        permissions: agentData.permissions || this.createDefaultAgentPermissions(),
        restrictions: agentData.restrictions || this.createDefaultAgentRestrictions(),
        status: 'active',
        createdBy: userId,
        createdAt: new Date(),
        lastUsed: new Date(),
        usage: this.createEmptyAgentUsage(),
        performance: this.createEmptyAgentPerformance()
      };

      // Add to workspace
      workspace.agents.push(agent);
      workspace.updatedAt = new Date();
      workspace.lastActivity = new Date();

      // Save workspace
      await this.saveWorkspace(workspace);

      // Log activity
      await this.logActivity(workspaceId, {
        type: 'agent_created',
        actorId: userId,
        actorName: await this.getUserName(userId),
        actorType: 'member',
        timestamp: new Date(),
        description: `Created agent "${agent.name}"`,
        details: { agentType: agent.type, model: agent.model },
        resourceId: agent.id,
        resourceType: 'agent',
        visibility: 'members'
      });

      // Emit event
      this.emitEvent(workspaceId, {
        type: 'agent_created',
        workspaceId,
        userId,
        timestamp: new Date(),
        data: agent
      });

      return agent.id;
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  private generateWorkspaceId(): string {
    return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMemberId(): string {
    return `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInvitationId(): string {
    return `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAgentId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getUserName(userId: string): Promise<string> {
    // Implementation would get user name from user service
    return `User ${userId}`;
  }

  private createDefaultPermissions(): WorkspacePermissions {
    return {
      canViewWorkspace: true,
      canEditWorkspace: false,
      canDeleteWorkspace: false,
      canManageMembers: false,
      canManageSettings: false,
      canCreateAgents: false,
      canManageAgents: false,
      canCreateRepositories: false,
      canManageRepositories: false,
      canInviteGuests: false,
      canManageGuestSessions: false,
      canViewAnalytics: false,
      canManageIntegrations: false,
      canManageBilling: false,
      canExportData: false
    };
  }

  private createOwnerPermissions(): WorkspaceMemberPermissions {
    return {
      canViewWorkspace: true,
      canEditWorkspace: true,
      canDeleteWorkspace: true,
      canManageMembers: true,
      canManageSettings: true,
      canCreateAgents: true,
      canManageAgents: true,
      canCreateRepositories: true,
      canManageRepositories: true,
      canInviteGuests: true,
      canManageGuestSessions: true,
      canViewAnalytics: true,
      canManageIntegrations: true,
      canManageBilling: true,
      canExportData: true
    };
  }

  private createRolePermissions(role: WorkspaceMember['role']): WorkspaceMemberPermissions {
    const base = this.createDefaultPermissions();
    
    switch (role) {
      case 'owner':
        return this.createOwnerPermissions();
      case 'admin':
        return {
          ...base,
          canEditWorkspace: true,
          canManageMembers: true,
          canManageSettings: true,
          canCreateAgents: true,
          canManageAgents: true,
          canCreateRepositories: true,
          canManageRepositories: true,
          canInviteGuests: true,
          canViewAnalytics: true
        };
      case 'member':
        return {
          ...base,
          canCreateAgents: true,
          canCreateRepositories: true,
          canInviteGuests: true
        };
      case 'guest':
      default:
        return base;
    }
  }

  private createDefaultSettings(): WorkspaceSettings {
    return {
      defaultAgentModel: 'gpt-4',
      defaultRepositoryTemplate: 'basic',
      autoArchiveInactiveDays: 90,
      requireTwoFactor: false,
      allowGuestAccess: true,
      guestSessionTimeout: 60,
      enableRealTimeCollaboration: true,
      maxConcurrentSessions: 10,
      autoSaveInterval: 30,
      emailNotifications: true,
      webhookUrls: [],
      maxAgents: 10,
      maxRepositories: 50,
      maxStorageGB: 10,
      maxMembersPerWorkspace: 25,
      aiModelPreferences: {
        preferredModels: ['gpt-4', 'gpt-3.5-turbo'],
        fallbackModels: ['gpt-3.5-turbo'],
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerDay: 100000,
          costLimitPerMonth: 100
        }
      },
      governanceSettings: {
        enableCompliance: true,
        auditLevel: 'basic',
        retentionPeriodDays: 365,
        requireApprovalForHighRisk: true,
        allowedTools: [],
        restrictedTopics: []
      }
    };
  }

  private createEmptyUsage(): WorkspaceUsage {
    return {
      agentsUsed: 0,
      repositoriesUsed: 0,
      storageUsedGB: 0,
      membersCount: 1,
      totalSessions: 0,
      totalMessages: 0,
      totalCommits: 0,
      totalCollaborations: 0,
      activeHoursToday: 0,
      activeHoursThisWeek: 0,
      activeHoursThisMonth: 0,
      totalCost: 0,
      costThisMonth: 0,
      projectedMonthlyCost: 0
    };
  }

  private createEmptyMetrics(): WorkspaceMetrics {
    return {
      averageResponseTime: 0,
      successRate: 100,
      userSatisfaction: 0,
      collaborationScore: 0,
      averageSessionDuration: 0,
      crossTeamInteractions: 0,
      tasksCompleted: 0,
      projectsDelivered: 0,
      codeQualityScore: 0,
      memberGrowthRate: 0,
      usageGrowthRate: 0,
      retentionRate: 100
    };
  }

  private createDefaultTheme(): WorkspaceTheme {
    return {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      sidebarPosition: 'left',
      compactMode: false,
      darkMode: false
    };
  }

  private createDefaultBranding(): WorkspaceBranding {
    return {};
  }

  private createDefaultPreferences(): MemberPreferences {
    return {
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      notificationTypes: ['mentions', 'assignments', 'updates'],
      defaultView: 'dashboard',
      autoSave: true,
      showTips: true
    };
  }

  private createEmptyActivitySummary(): MemberActivitySummary {
    return {
      lastLogin: new Date(),
      sessionsThisWeek: 0,
      messagesThisWeek: 0,
      repositoriesContributed: 0,
      commitsThisMonth: 0,
      collaborationsThisMonth: 0,
      averageSessionDuration: 0,
      favoriteAgents: [],
      mostUsedFeatures: []
    };
  }

  private createDefaultAgentPermissions(): AgentPermissions {
    return {
      canAccessRepositories: true,
      canModifyFiles: false,
      canExecuteCode: false,
      canAccessInternet: true,
      canSendEmails: false,
      canManageUsers: false
    };
  }

  private createDefaultAgentRestrictions(): AgentRestrictions {
    return {
      maxTokensPerRequest: 4000,
      maxRequestsPerHour: 100,
      maxCostPerDay: 10
    };
  }

  private createEmptyAgentUsage(): AgentUsage {
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      lastUsed: new Date(),
      requestsToday: 0,
      requestsThisWeek: 0,
      requestsThisMonth: 0,
      costToday: 0,
      costThisWeek: 0,
      costThisMonth: 0
    };
  }

  private createEmptyAgentPerformance(): AgentPerformance {
    return {
      successRate: 100,
      averageRating: 0,
      totalRatings: 0,
      errorRate: 0,
      helpfulnessScore: 0,
      accuracyScore: 0,
      creativityScore: 0,
      taskCompletionRate: 0,
      averageTaskTime: 0,
      resourceUtilization: 0
    };
  }

  private async applyTemplate(workspace: Workspace, template: WorkspaceTemplate): Promise<void> {
    // Apply template settings
    if (template.defaultSettings) {
      Object.assign(workspace.settings, template.defaultSettings);
    }

    // Create default agents from template
    for (const agentTemplate of template.defaultAgents) {
      const agent: WorkspaceAgent = {
        id: this.generateAgentId(),
        name: agentTemplate.name || 'Template Agent',
        description: agentTemplate.description || '',
        type: agentTemplate.type || 'assistant',
        model: agentTemplate.model || workspace.settings.defaultAgentModel,
        systemPrompt: agentTemplate.systemPrompt || '',
        tools: agentTemplate.tools || [],
        permissions: agentTemplate.permissions || this.createDefaultAgentPermissions(),
        restrictions: agentTemplate.restrictions || this.createDefaultAgentRestrictions(),
        status: 'active',
        createdBy: workspace.ownerId,
        createdAt: new Date(),
        lastUsed: new Date(),
        usage: this.createEmptyAgentUsage(),
        performance: this.createEmptyAgentPerformance()
      };
      workspace.agents.push(agent);
    }
  }

  private async cleanupWorkspaceResources(workspace: Workspace): Promise<void> {
    // Clean up agents
    workspace.agents = [];
    
    // Clean up repositories (would integrate with repository service)
    workspace.repositories = [];
    
    // Clean up guest sessions (would integrate with guest service)
    workspace.guestSessions = [];
  }

  private async loadWorkspaces(): Promise<void> {
    // Implementation would load workspaces from storage
  }

  private async loadTemplates(): Promise<void> {
    // Implementation would load templates from storage
  }

  private async saveWorkspace(workspace: Workspace): Promise<void> {
    // Implementation would save workspace to storage
  }

  private async saveInvitation(invitation: WorkspaceInvitation): Promise<void> {
    // Implementation would save invitation to storage
  }

  private async sendInvitationEmail(invitation: WorkspaceInvitation): Promise<void> {
    // Implementation would send invitation email
    console.log(`Sending invitation email to ${invitation.inviteeEmail}`);
  }

  private async performMaintenance(): Promise<void> {
    // Clean up expired invitations
    for (const [id, invitation] of this.invitations) {
      if (invitation.expiresAt < new Date() && invitation.status === 'pending') {
        invitation.status = 'expired';
        await this.saveInvitation(invitation);
      }
    }

    // Update workspace metrics
    for (const workspace of this.workspaces.values()) {
      await this.updateWorkspaceMetrics(workspace);
    }
  }

  private async updateWorkspaceMetrics(workspace: Workspace): Promise<void> {
    // Update usage and metrics
    workspace.usage.membersCount = workspace.members.filter(m => m.status === 'active').length;
    workspace.usage.agentsUsed = workspace.agents.filter(a => a.status === 'active').length;
    workspace.usage.repositoriesUsed = workspace.repositories.length;
    
    // Save updated workspace
    await this.saveWorkspace(workspace);
  }

  private async logActivity(workspaceId: string, activity: Omit<WorkspaceActivity, 'id' | 'workspaceId'>): Promise<void> {
    const activityRecord: WorkspaceActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId
    };

    if (!this.activities.has(workspaceId)) {
      this.activities.set(workspaceId, []);
    }

    const activities = this.activities.get(workspaceId)!;
    activities.unshift(activityRecord);

    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(1000);
    }
  }

  // =====================================
  // PERMISSION CHECKS
  // =====================================

  private async canEditWorkspace(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const member = workspace.members.find(m => m.userId === userId);
    return member ? member.permissions.canEditWorkspace : false;
  }

  private async canManageMembers(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const member = workspace.members.find(m => m.userId === userId);
    return member ? member.permissions.canManageMembers : false;
  }

  private async canCreateAgents(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const member = workspace.members.find(m => m.userId === userId);
    return member ? member.permissions.canCreateAgents : false;
  }

  // =====================================
  // EVENT SYSTEM
  // =====================================

  public addEventListener(workspaceId: string, callback: (event: WorkspaceEvent) => void): void {
    if (!this.eventListeners.has(workspaceId)) {
      this.eventListeners.set(workspaceId, []);
    }
    this.eventListeners.get(workspaceId)!.push(callback);
  }

  public removeEventListener(workspaceId: string, callback: (event: WorkspaceEvent) => void): void {
    const listeners = this.eventListeners.get(workspaceId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(workspaceId: string, event: WorkspaceEvent): void {
    const listeners = this.eventListeners.get(workspaceId) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in workspace event listener:', error);
      }
    });
  }

  // =====================================
  // PUBLIC API
  // =====================================

  public async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    return this.workspaces.get(workspaceId) || null;
  }

  public async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values())
      .filter(workspace => workspace.members.some(m => m.userId === userId && m.status === 'active'));
  }

  public async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const workspace = this.workspaces.get(workspaceId);
    return workspace ? workspace.members : [];
  }

  public async getWorkspaceAgents(workspaceId: string): Promise<WorkspaceAgent[]> {
    const workspace = this.workspaces.get(workspaceId);
    return workspace ? workspace.agents : [];
  }

  public async getWorkspaceActivities(workspaceId: string, limit: number = 50): Promise<WorkspaceActivity[]> {
    const activities = this.activities.get(workspaceId) || [];
    return activities.slice(0, limit);
  }

  public async getWorkspaceTemplates(): Promise<WorkspaceTemplate[]> {
    return Array.from(this.templates.values());
  }

  public async getUserInvitations(userId: string): Promise<WorkspaceInvitation[]> {
    // Implementation would get user's email and find invitations
    return Array.from(this.invitations.values())
      .filter(inv => inv.status === 'pending' && inv.expiresAt > new Date());
  }
}

export interface WorkspaceEvent {
  type: 'workspace_created' | 'workspace_updated' | 'workspace_deleted' | 
        'member_joined' | 'member_removed' | 'member_invited' |
        'agent_created' | 'agent_updated' | 'agent_deleted' |
        'repository_created' | 'repository_updated' | 'repository_deleted';
  workspaceId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

export default WorkspaceManagementService;

