/**
 * Organization Management Service
 * 
 * Comprehensive enterprise-grade organization and team management system.
 * Handles organization creation, team member management, role-based permissions,
 * and enterprise agent ownership for business teams.
 * 
 * Features:
 * - Organization creation and management
 * - Team member invitation and onboarding
 * - Role-based access control (RBAC)
 * - Enterprise agent ownership and assignment
 * - Billing and subscription management
 * - Compliance and governance settings
 * - Multi-tenant data isolation
 */

import { db } from '../firebase/config';
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
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  
  // Ownership and creation
  ownerId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Organization settings
  settings: OrganizationSettings;
  
  // Subscription and billing
  subscription: OrganizationSubscription;
  
  // Member statistics
  memberCount: number;
  maxMembers: number;
  
  // Agent management
  agentQuota: number;
  usedAgentSlots: number;
  
  // Status and metadata
  status: 'active' | 'suspended' | 'trial' | 'expired';
  metadata: {
    industry?: string;
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    region: string;
    timezone: string;
  };
}

export interface OrganizationSettings {
  // General settings
  allowMemberInvites: boolean;
  requireApprovalForNewMembers: boolean;
  allowGuestSessions: boolean;
  
  // Agent settings
  allowPersonalAgents: boolean; // Can members have personal agents
  requireOrganizationAgents: boolean; // Must use org-owned agents
  allowAgentSharing: boolean; // Can members share agents
  
  // Governance settings
  enforceGovernanceLevel: 'basic' | 'standard' | 'enterprise';
  requireComplianceApproval: boolean;
  auditRetentionDays: number;
  
  // Communication settings
  allowExternalSharing: boolean; // Share receipts outside org
  allowDirectMessages: boolean;
  allowTeamChannels: boolean;
  
  // Security settings
  requireTwoFactor: boolean;
  allowedDomains: string[]; // Email domains for auto-approval
  sessionTimeoutMinutes: number;
  
  // Integration settings
  allowedIntegrations: string[];
  customBranding?: {
    logoUrl?: string;
    primaryColor?: string;
    organizationName?: string;
  };
}

export interface OrganizationSubscription {
  plan: 'free' | 'team' | 'business' | 'enterprise';
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'expired';
  
  // Billing details
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  
  // Usage limits
  limits: {
    maxMembers: number;
    maxAgents: number;
    maxRepositories: number;
    maxStorageGB: number;
    maxMonthlyMessages: number;
  };
  
  // Current usage
  usage: {
    members: number;
    agents: number;
    repositories: number;
    storageGB: number;
    monthlyMessages: number;
  };
  
  // Features
  features: {
    advancedGovernance: boolean;
    customBranding: boolean;
    ssoIntegration: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
    advancedAnalytics: boolean;
  };
}

export interface TeamMember {
  id: string;
  userId: string;
  orgId: string;
  
  // Member information
  email: string;
  displayName: string;
  avatarUrl?: string;
  
  // Role and permissions
  role: OrganizationRole;
  permissions: Permission[];
  customPermissions?: Permission[];
  
  // Status and dates
  status: 'active' | 'invited' | 'suspended' | 'inactive';
  invitedBy: string;
  invitedAt: Date;
  joinedAt?: Date;
  lastActiveAt?: Date;
  
  // Agent access
  assignedAgents: string[]; // Agent IDs this member can use
  personalAgentId?: string; // Personal agent if allowed
  
  // Metadata
  department?: string;
  title?: string;
  timezone?: string;
  preferences: MemberPreferences;
}

export type OrganizationRole = 
  | 'owner'           // Full control, billing, delete org
  | 'admin'           // Manage members, agents, settings
  | 'manager'         // Manage team members and projects
  | 'member'          // Standard team member
  | 'guest'           // Limited access, temporary
  | 'viewer';         // Read-only access

export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[];
  scope?: 'organization' | 'team' | 'personal';
  conditions?: PermissionCondition[];
}

export type PermissionResource = 
  | 'organization'     // Organization settings and management
  | 'members'          // Team member management
  | 'agents'           // Agent management and assignment
  | 'repositories'     // Workflow repository access
  | 'chats'            // Chat and messaging
  | 'receipts'         // Receipt sharing and access
  | 'governance'       // Governance and compliance
  | 'billing'          // Subscription and billing
  | 'integrations'     // External integrations
  | 'analytics';       // Usage analytics and reports

export type PermissionAction = 
  | 'create' | 'read' | 'update' | 'delete' 
  | 'invite' | 'approve' | 'share' | 'export'
  | 'assign' | 'revoke' | 'configure' | 'monitor';

export interface PermissionCondition {
  type: 'time_based' | 'approval_required' | 'resource_limit' | 'custom';
  value: any;
  description: string;
}

export interface MemberPreferences {
  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: NotificationType[];
  
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  
  // Collaboration preferences
  allowDirectMessages: boolean;
  allowGuestSessions: boolean;
  autoShareReceipts: boolean;
  
  // Agent preferences
  preferredAgentType?: string;
  defaultGovernanceLevel: string;
}

export type NotificationType = 
  | 'member_joined' | 'member_left' | 'agent_shared' 
  | 'receipt_shared' | 'guest_session_request' 
  | 'repository_shared' | 'compliance_alert';

export interface OrganizationAgent {
  id: string;
  orgId: string;
  
  // Agent configuration
  name: string;
  displayName: string;
  description: string;
  agentType: 'coding' | 'design' | 'analysis' | 'project_manager' | 'general' | 'custom';
  
  // Capabilities and configuration
  capabilities: AgentCapability[];
  configuration: AgentConfiguration;
  
  // Assignment and access
  assignedMembers: string[]; // Member IDs who can use this agent
  createdBy: string;
  managedBy: string[]; // Members who can configure this agent
  
  // Usage and governance
  governanceLevel: 'basic' | 'standard' | 'enterprise';
  complianceSettings: AgentComplianceSettings;
  
  // Status and metadata
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  
  // Usage statistics
  usage: {
    totalSessions: number;
    totalMessages: number;
    averageSessionLength: number;
    lastMonthUsage: number;
  };
}

export interface AgentCapability {
  type: 'code_generation' | 'data_analysis' | 'content_creation' | 'image_generation' | 'web_search' | 'file_processing';
  enabled: boolean;
  configuration?: any;
  restrictions?: string[];
}

export interface AgentConfiguration {
  // Model settings
  model: string;
  temperature: number;
  maxTokens: number;
  
  // Behavior settings
  personality: string;
  instructions: string;
  responseStyle: 'concise' | 'detailed' | 'technical' | 'friendly';
  
  // Integration settings
  allowedTools: string[];
  allowedIntegrations: string[];
  
  // Governance settings
  requireApproval: boolean;
  autoApprovalThreshold: number;
  escalationRules: EscalationRule[];
}

export interface AgentComplianceSettings {
  // Data handling
  dataRetentionDays: number;
  allowDataExport: boolean;
  requireDataEncryption: boolean;
  
  // Audit requirements
  logAllInteractions: boolean;
  requireHumanReview: boolean;
  complianceFrameworks: string[]; // SOX, GDPR, HIPAA, etc.
  
  // Usage restrictions
  allowedHours?: { start: string; end: string; timezone: string; };
  allowedDays?: string[]; // Monday, Tuesday, etc.
  maxDailyUsage?: number; // Minutes
  
  // Content restrictions
  contentFilters: string[];
  prohibitedTopics: string[];
  requireContentApproval: boolean;
}

export interface EscalationRule {
  condition: string;
  action: 'notify' | 'require_approval' | 'block' | 'escalate';
  recipients: string[];
  timeoutMinutes?: number;
}

export interface OrganizationInvitation {
  id: string;
  orgId: string;
  
  // Invitation details
  email: string;
  role: OrganizationRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedAt?: Date;
  
  // Invitation message
  message?: string;
  customPermissions?: Permission[];
  
  // Agent assignments
  assignedAgents?: string[];
}

export class OrganizationManagementService {
  private static instance: OrganizationManagementService;
  
  private organizations: Map<string, Organization> = new Map();
  private members: Map<string, TeamMember[]> = new Map(); // orgId -> members
  private agents: Map<string, OrganizationAgent[]> = new Map(); // orgId -> agents
  private invitations: Map<string, OrganizationInvitation[]> = new Map(); // orgId -> invitations
  
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    console.log('🏢 [OrganizationManagement] Service initialized');
  }

  public static getInstance(): OrganizationManagementService {
    if (!OrganizationManagementService.instance) {
      OrganizationManagementService.instance = new OrganizationManagementService();
    }
    return OrganizationManagementService.instance;
  }

  /**
   * Create a new organization
   */
  public async createOrganization(
    organizationData: {
      name: string;
      displayName: string;
      description?: string;
      ownerId: string;
      settings?: Partial<OrganizationSettings>;
      metadata?: Partial<Organization['metadata']>;
    }
  ): Promise<Organization> {
    console.log(`🏢 [OrganizationManagement] Creating organization: ${organizationData.displayName}`);

    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Default settings
    const defaultSettings: OrganizationSettings = {
      allowMemberInvites: true,
      requireApprovalForNewMembers: false,
      allowGuestSessions: true,
      allowPersonalAgents: true,
      requireOrganizationAgents: false,
      allowAgentSharing: true,
      enforceGovernanceLevel: 'standard',
      requireComplianceApproval: false,
      auditRetentionDays: 90,
      allowExternalSharing: false,
      allowDirectMessages: true,
      allowTeamChannels: true,
      requireTwoFactor: false,
      allowedDomains: [],
      sessionTimeoutMinutes: 480, // 8 hours
      allowedIntegrations: []
    };

    // Default subscription (free tier)
    const defaultSubscription: OrganizationSubscription = {
      plan: 'free',
      status: 'active',
      billingCycle: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      limits: {
        maxMembers: 5,
        maxAgents: 2,
        maxRepositories: 10,
        maxStorageGB: 1,
        maxMonthlyMessages: 1000
      },
      usage: {
        members: 1, // Owner
        agents: 0,
        repositories: 0,
        storageGB: 0,
        monthlyMessages: 0
      },
      features: {
        advancedGovernance: false,
        customBranding: false,
        ssoIntegration: false,
        prioritySupport: false,
        customIntegrations: false,
        advancedAnalytics: false
      }
    };

    const organization: Organization = {
      id: orgId,
      name: organizationData.name,
      displayName: organizationData.displayName,
      description: organizationData.description,
      ownerId: organizationData.ownerId,
      createdBy: organizationData.ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: { ...defaultSettings, ...organizationData.settings },
      subscription: defaultSubscription,
      memberCount: 1,
      maxMembers: defaultSubscription.limits.maxMembers,
      agentQuota: defaultSubscription.limits.maxAgents,
      usedAgentSlots: 0,
      status: 'active',
      metadata: {
        size: 'startup',
        region: 'us-west',
        timezone: 'America/Los_Angeles',
        ...organizationData.metadata
      }
    };

    try {
      // Save to Firestore
      await setDoc(doc(db, 'organizations', orgId), {
        ...organization,
        createdAt: Timestamp.fromDate(organization.createdAt),
        updatedAt: Timestamp.fromDate(organization.updatedAt)
      });

      // Add owner as first member
      await this.addMemberToOrganization(orgId, {
        userId: organizationData.ownerId,
        email: '', // Will be filled from user profile
        displayName: '', // Will be filled from user profile
        role: 'owner',
        invitedBy: organizationData.ownerId
      });

      // Cache organization
      this.organizations.set(orgId, organization);

      console.log(`✅ [OrganizationManagement] Organization created: ${orgId}`);
      return organization;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error creating organization:`, error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  public async getOrganization(orgId: string): Promise<Organization | null> {
    // Check cache first
    if (this.organizations.has(orgId)) {
      return this.organizations.get(orgId)!;
    }

    try {
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      
      if (!orgDoc.exists()) {
        return null;
      }

      const data = orgDoc.data();
      const organization: Organization = {
        ...data,
        id: orgDoc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Organization;

      // Cache organization
      this.organizations.set(orgId, organization);

      return organization;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error getting organization:`, error);
      return null;
    }
  }

  /**
   * Get organizations for a user
   */
  public async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      // Get organizations where user is a member
      const membersQuery = query(
        collection(db, 'teamMembers'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );

      const memberDocs = await getDocs(membersQuery);
      const orgIds = memberDocs.docs.map(doc => doc.data().orgId);

      if (orgIds.length === 0) {
        return [];
      }

      // Get organization details
      const organizations: Organization[] = [];
      for (const orgId of orgIds) {
        const org = await this.getOrganization(orgId);
        if (org) {
          organizations.push(org);
        }
      }

      return organizations;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error getting user organizations:`, error);
      return [];
    }
  }

  /**
   * Update organization
   */
  public async updateOrganization(
    orgId: string,
    updates: Partial<Organization>
  ): Promise<void> {
    console.log(`🏢 [OrganizationManagement] Updating organization: ${orgId}`);

    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(doc(db, 'organizations', orgId), updateData);

      // Update cache
      const cachedOrg = this.organizations.get(orgId);
      if (cachedOrg) {
        this.organizations.set(orgId, { ...cachedOrg, ...updates, updatedAt: new Date() });
      }

      console.log(`✅ [OrganizationManagement] Organization updated: ${orgId}`);

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error updating organization:`, error);
      throw error;
    }
  }

  /**
   * Add member to organization
   */
  public async addMemberToOrganization(
    orgId: string,
    memberData: {
      userId: string;
      email: string;
      displayName: string;
      role: OrganizationRole;
      invitedBy: string;
      customPermissions?: Permission[];
      assignedAgents?: string[];
    }
  ): Promise<TeamMember> {
    console.log(`👥 [OrganizationManagement] Adding member to organization: ${orgId}`);

    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get default permissions for role
    const permissions = this.getDefaultPermissionsForRole(memberData.role);

    const member: TeamMember = {
      id: memberId,
      userId: memberData.userId,
      orgId: orgId,
      email: memberData.email,
      displayName: memberData.displayName,
      role: memberData.role,
      permissions: permissions,
      customPermissions: memberData.customPermissions,
      status: 'active',
      invitedBy: memberData.invitedBy,
      invitedAt: new Date(),
      joinedAt: new Date(),
      assignedAgents: memberData.assignedAgents || [],
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        notificationTypes: ['member_joined', 'receipt_shared'],
        theme: 'auto',
        language: 'en',
        timezone: 'America/Los_Angeles',
        allowDirectMessages: true,
        allowGuestSessions: true,
        autoShareReceipts: false,
        defaultGovernanceLevel: 'standard'
      }
    };

    try {
      // Save to Firestore
      await setDoc(doc(db, 'teamMembers', memberId), {
        ...member,
        invitedAt: Timestamp.fromDate(member.invitedAt),
        joinedAt: Timestamp.fromDate(member.joinedAt!)
      });

      // Update organization member count
      await this.updateOrganization(orgId, {
        memberCount: (await this.getOrganizationMembers(orgId)).length + 1
      });

      // Cache member
      const orgMembers = this.members.get(orgId) || [];
      orgMembers.push(member);
      this.members.set(orgId, orgMembers);

      console.log(`✅ [OrganizationManagement] Member added: ${memberId}`);
      return member;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error adding member:`, error);
      throw error;
    }
  }

  /**
   * Get organization members
   */
  public async getOrganizationMembers(orgId: string): Promise<TeamMember[]> {
    // Check cache first
    if (this.members.has(orgId)) {
      return this.members.get(orgId)!;
    }

    try {
      const membersQuery = query(
        collection(db, 'teamMembers'),
        where('orgId', '==', orgId),
        orderBy('joinedAt', 'desc')
      );

      const memberDocs = await getDocs(membersQuery);
      const members: TeamMember[] = memberDocs.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          invitedAt: data.invitedAt.toDate(),
          joinedAt: data.joinedAt?.toDate(),
          lastActiveAt: data.lastActiveAt?.toDate()
        } as TeamMember;
      });

      // Cache members
      this.members.set(orgId, members);

      return members;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error getting members:`, error);
      return [];
    }
  }

  /**
   * Create organization agent
   */
  public async createOrganizationAgent(
    orgId: string,
    agentData: {
      name: string;
      displayName: string;
      description: string;
      agentType: OrganizationAgent['agentType'];
      createdBy: string;
      configuration?: Partial<AgentConfiguration>;
      assignedMembers?: string[];
    }
  ): Promise<OrganizationAgent> {
    console.log(`🤖 [OrganizationManagement] Creating organization agent: ${agentData.displayName}`);

    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Default configuration
    const defaultConfiguration: AgentConfiguration = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      personality: 'professional',
      instructions: 'You are a helpful AI assistant for this organization.',
      responseStyle: 'detailed',
      allowedTools: ['web_search', 'code_generation', 'data_analysis'],
      allowedIntegrations: [],
      requireApproval: false,
      autoApprovalThreshold: 0.8,
      escalationRules: []
    };

    const agent: OrganizationAgent = {
      id: agentId,
      orgId: orgId,
      name: agentData.name,
      displayName: agentData.displayName,
      description: agentData.description,
      agentType: agentData.agentType,
      capabilities: this.getDefaultCapabilitiesForType(agentData.agentType),
      configuration: { ...defaultConfiguration, ...agentData.configuration },
      assignedMembers: agentData.assignedMembers || [],
      createdBy: agentData.createdBy,
      managedBy: [agentData.createdBy],
      governanceLevel: 'standard',
      complianceSettings: {
        dataRetentionDays: 90,
        allowDataExport: true,
        requireDataEncryption: false,
        logAllInteractions: true,
        requireHumanReview: false,
        complianceFrameworks: [],
        contentFilters: ['inappropriate', 'harmful'],
        prohibitedTopics: [],
        requireContentApproval: false
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        totalSessions: 0,
        totalMessages: 0,
        averageSessionLength: 0,
        lastMonthUsage: 0
      }
    };

    try {
      // Save to Firestore
      await setDoc(doc(db, 'organizationAgents', agentId), {
        ...agent,
        createdAt: Timestamp.fromDate(agent.createdAt),
        updatedAt: Timestamp.fromDate(agent.updatedAt)
      });

      // Update organization agent count
      const org = await this.getOrganization(orgId);
      if (org) {
        await this.updateOrganization(orgId, {
          usedAgentSlots: org.usedAgentSlots + 1
        });
      }

      // Cache agent
      const orgAgents = this.agents.get(orgId) || [];
      orgAgents.push(agent);
      this.agents.set(orgId, orgAgents);

      console.log(`✅ [OrganizationManagement] Organization agent created: ${agentId}`);
      return agent;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error creating agent:`, error);
      throw error;
    }
  }

  /**
   * Get organization agents
   */
  public async getOrganizationAgents(orgId: string): Promise<OrganizationAgent[]> {
    // Check cache first
    if (this.agents.has(orgId)) {
      return this.agents.get(orgId)!;
    }

    try {
      const agentsQuery = query(
        collection(db, 'organizationAgents'),
        where('orgId', '==', orgId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const agentDocs = await getDocs(agentsQuery);
      const agents: OrganizationAgent[] = agentDocs.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastUsedAt: data.lastUsedAt?.toDate()
        } as OrganizationAgent;
      });

      // Cache agents
      this.agents.set(orgId, agents);

      return agents;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error getting agents:`, error);
      return [];
    }
  }

  /**
   * Send organization invitation
   */
  public async sendInvitation(
    orgId: string,
    invitationData: {
      email: string;
      role: OrganizationRole;
      invitedBy: string;
      message?: string;
      customPermissions?: Permission[];
      assignedAgents?: string[];
    }
  ): Promise<OrganizationInvitation> {
    console.log(`📧 [OrganizationManagement] Sending invitation to: ${invitationData.email}`);

    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const invitation: OrganizationInvitation = {
      id: invitationId,
      orgId: orgId,
      email: invitationData.email,
      role: invitationData.role,
      invitedBy: invitationData.invitedBy,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      message: invitationData.message,
      customPermissions: invitationData.customPermissions,
      assignedAgents: invitationData.assignedAgents
    };

    try {
      // Save to Firestore
      await setDoc(doc(db, 'organizationInvitations', invitationId), {
        ...invitation,
        invitedAt: Timestamp.fromDate(invitation.invitedAt),
        expiresAt: Timestamp.fromDate(invitation.expiresAt)
      });

      // Cache invitation
      const orgInvitations = this.invitations.get(orgId) || [];
      orgInvitations.push(invitation);
      this.invitations.set(orgId, orgInvitations);

      // TODO: Send email invitation
      console.log(`📧 [OrganizationManagement] Email invitation would be sent to: ${invitationData.email}`);

      console.log(`✅ [OrganizationManagement] Invitation sent: ${invitationId}`);
      return invitation;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error sending invitation:`, error);
      throw error;
    }
  }

  /**
   * Accept organization invitation
   */
  public async acceptInvitation(
    invitationId: string,
    userId: string,
    userProfile: { email: string; displayName: string; }
  ): Promise<TeamMember> {
    console.log(`✅ [OrganizationManagement] Accepting invitation: ${invitationId}`);

    try {
      // Get invitation
      const invitationDoc = await getDoc(doc(db, 'organizationInvitations', invitationId));
      
      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationDoc.data() as OrganizationInvitation;
      
      if (invitation.status !== 'pending') {
        throw new Error('Invitation is no longer valid');
      }

      if (invitation.expiresAt.toDate() < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Add member to organization
      const member = await this.addMemberToOrganization(invitation.orgId, {
        userId: userId,
        email: userProfile.email,
        displayName: userProfile.displayName,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        customPermissions: invitation.customPermissions,
        assignedAgents: invitation.assignedAgents
      });

      // Update invitation status
      await updateDoc(doc(db, 'organizationInvitations', invitationId), {
        status: 'accepted',
        acceptedAt: Timestamp.fromDate(new Date())
      });

      console.log(`✅ [OrganizationManagement] Invitation accepted: ${invitationId}`);
      return member;

    } catch (error) {
      console.error(`❌ [OrganizationManagement] Error accepting invitation:`, error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  public hasPermission(
    member: TeamMember,
    resource: PermissionResource,
    action: PermissionAction
  ): boolean {
    // Check role-based permissions
    const rolePermissions = this.getDefaultPermissionsForRole(member.role);
    const hasRolePermission = rolePermissions.some(permission => 
      permission.resource === resource && permission.actions.includes(action)
    );

    // Check custom permissions
    const hasCustomPermission = member.customPermissions?.some(permission =>
      permission.resource === resource && permission.actions.includes(action)
    ) || false;

    return hasRolePermission || hasCustomPermission;
  }

  /**
   * Subscribe to organization changes
   */
  public subscribeToOrganization(
    orgId: string,
    callback: (organization: Organization) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      doc(db, 'organizations', orgId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const organization: Organization = {
            ...data,
            id: doc.id,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          } as Organization;

          // Update cache
          this.organizations.set(orgId, organization);
          
          callback(organization);
        }
      }
    );

    return unsubscribe;
  }

  // Private helper methods

  private getDefaultPermissionsForRole(role: OrganizationRole): Permission[] {
    const permissions: Record<OrganizationRole, Permission[]> = {
      owner: [
        { resource: 'organization', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'members', actions: ['create', 'read', 'update', 'delete', 'invite'] },
        { resource: 'agents', actions: ['create', 'read', 'update', 'delete', 'assign'] },
        { resource: 'repositories', actions: ['create', 'read', 'update', 'delete', 'share'] },
        { resource: 'chats', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'receipts', actions: ['create', 'read', 'share', 'export'] },
        { resource: 'governance', actions: ['read', 'update', 'configure'] },
        { resource: 'billing', actions: ['read', 'update'] },
        { resource: 'integrations', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'analytics', actions: ['read'] }
      ],
      admin: [
        { resource: 'organization', actions: ['read', 'update'] },
        { resource: 'members', actions: ['create', 'read', 'update', 'invite'] },
        { resource: 'agents', actions: ['create', 'read', 'update', 'assign'] },
        { resource: 'repositories', actions: ['create', 'read', 'update', 'share'] },
        { resource: 'chats', actions: ['create', 'read', 'update'] },
        { resource: 'receipts', actions: ['create', 'read', 'share'] },
        { resource: 'governance', actions: ['read', 'configure'] },
        { resource: 'integrations', actions: ['create', 'read', 'update'] },
        { resource: 'analytics', actions: ['read'] }
      ],
      manager: [
        { resource: 'members', actions: ['read', 'invite'] },
        { resource: 'agents', actions: ['read', 'assign'] },
        { resource: 'repositories', actions: ['create', 'read', 'update', 'share'] },
        { resource: 'chats', actions: ['create', 'read', 'update'] },
        { resource: 'receipts', actions: ['create', 'read', 'share'] },
        { resource: 'analytics', actions: ['read'] }
      ],
      member: [
        { resource: 'repositories', actions: ['create', 'read', 'update'] },
        { resource: 'chats', actions: ['create', 'read', 'update'] },
        { resource: 'receipts', actions: ['create', 'read', 'share'] },
        { resource: 'agents', actions: ['read'] }
      ],
      guest: [
        { resource: 'repositories', actions: ['read'] },
        { resource: 'chats', actions: ['read'] },
        { resource: 'receipts', actions: ['read'] }
      ],
      viewer: [
        { resource: 'repositories', actions: ['read'] },
        { resource: 'chats', actions: ['read'] },
        { resource: 'receipts', actions: ['read'] },
        { resource: 'analytics', actions: ['read'] }
      ]
    };

    return permissions[role] || [];
  }

  private getDefaultCapabilitiesForType(agentType: OrganizationAgent['agentType']): AgentCapability[] {
    const capabilities: Record<OrganizationAgent['agentType'], AgentCapability[]> = {
      coding: [
        { type: 'code_generation', enabled: true },
        { type: 'file_processing', enabled: true },
        { type: 'web_search', enabled: true }
      ],
      design: [
        { type: 'image_generation', enabled: true },
        { type: 'content_creation', enabled: true },
        { type: 'file_processing', enabled: true }
      ],
      analysis: [
        { type: 'data_analysis', enabled: true },
        { type: 'web_search', enabled: true },
        { type: 'file_processing', enabled: true }
      ],
      project_manager: [
        { type: 'content_creation', enabled: true },
        { type: 'data_analysis', enabled: true },
        { type: 'web_search', enabled: true }
      ],
      general: [
        { type: 'content_creation', enabled: true },
        { type: 'web_search', enabled: true },
        { type: 'file_processing', enabled: true }
      ],
      custom: []
    };

    return capabilities[agentType] || [];
  }
}

export const organizationManagementService = OrganizationManagementService.getInstance();
export default OrganizationManagementService;

