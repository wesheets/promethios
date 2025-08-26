/**
 * Advanced Collaboration Service
 * 
 * Handles multi-user collaboration on workflow repositories,
 * providing the foundation for future human-AI team collaboration.
 * 
 * Features:
 * - Multi-user repository access and permissions
 * - Real-time synchronization and updates
 * - Activity feeds and change tracking
 * - Comment systems and discussions
 * - Version control and branching
 * - Conflict resolution and merging
 */

import { WorkflowRepository, WorkflowArtifact } from './WorkflowRepositoryManager';
import { RepositoryExtension } from './RepositoryExtensionService';

export interface CollaborativeRepository extends WorkflowRepository {
  // Collaboration metadata
  collaborationEnabled: boolean;
  collaborators: RepositoryCollaborator[];
  permissions: RepositoryPermissions;
  
  // Activity tracking
  activityFeed: RepositoryActivity[];
  lastActivity: Date;
  
  // Version control
  branches: RepositoryBranch[];
  currentBranch: string;
  mergeRequests: MergeRequest[];
  
  // Communication
  comments: RepositoryComment[];
  discussions: Discussion[];
  
  // Real-time sync
  syncStatus: SyncStatus;
  conflictResolution: ConflictResolution[];
}

export interface RepositoryCollaborator {
  id: string;
  userId: string;
  userType: 'human' | 'ai_agent' | 'ai_assistant';
  displayName: string;
  email?: string;
  avatar?: string;
  
  // Permissions
  role: 'owner' | 'admin' | 'contributor' | 'viewer';
  permissions: CollaboratorPermissions;
  
  // Status
  status: 'active' | 'inactive' | 'invited' | 'suspended';
  lastSeen: Date;
  currentActivity?: string;
  
  // Metadata
  joinedAt: Date;
  invitedBy?: string;
  contributionStats: ContributionStats;
}

export interface RepositoryPermissions {
  // Repository-level permissions
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageCollaborators: boolean;
  canManageSettings: boolean;
  
  // Branch permissions
  canCreateBranches: boolean;
  canMergeBranches: boolean;
  canDeleteBranches: boolean;
  
  // Advanced permissions
  canManageWebhooks: boolean;
  canManageIntegrations: boolean;
  canViewAnalytics: boolean;
}

export interface CollaboratorPermissions extends RepositoryPermissions {
  // Specific overrides for this collaborator
  restrictedPaths?: string[];
  allowedOperations?: string[];
  timeRestrictions?: TimeRestriction[];
}

export interface TimeRestriction {
  type: 'hours' | 'days' | 'date_range';
  value: string; // e.g., "9-17" for hours, "mon-fri" for days, "2024-01-01,2024-12-31" for date range
  timezone: string;
}

export interface RepositoryActivity {
  id: string;
  type: 'commit' | 'branch_create' | 'branch_delete' | 'merge' | 'comment' | 'discussion' | 
        'collaborator_add' | 'collaborator_remove' | 'permission_change' | 'file_upload' | 
        'file_delete' | 'workflow_run' | 'ai_interaction';
  
  // Actor information
  actorId: string;
  actorName: string;
  actorType: 'human' | 'ai_agent' | 'system';
  
  // Activity details
  timestamp: Date;
  description: string;
  details: ActivityDetails;
  
  // Context
  branchName?: string;
  filePath?: string;
  commitHash?: string;
  
  // Metadata
  metadata: Record<string, any>;
  visibility: 'public' | 'collaborators' | 'private';
}

export interface ActivityDetails {
  // File changes
  filesChanged?: string[];
  linesAdded?: number;
  linesRemoved?: number;
  
  // Collaboration
  collaboratorsAffected?: string[];
  permissionsChanged?: string[];
  
  // AI interactions
  aiModel?: string;
  aiPrompt?: string;
  aiResponse?: string;
  
  // Workflow
  workflowStatus?: string;
  workflowResults?: any;
}

export interface RepositoryBranch {
  name: string;
  commitHash: string;
  createdBy: string;
  createdAt: Date;
  lastCommit: Date;
  
  // Branch metadata
  description?: string;
  protected: boolean;
  defaultBranch: boolean;
  
  // Collaboration
  activeCollaborators: string[];
  mergeRequests: string[];
  
  // Status
  status: 'active' | 'merged' | 'abandoned' | 'protected';
  ahead: number; // commits ahead of default branch
  behind: number; // commits behind default branch
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  
  // Branch information
  sourceBranch: string;
  targetBranch: string;
  
  // Author and reviewers
  authorId: string;
  authorName: string;
  reviewers: MergeRequestReviewer[];
  
  // Status
  status: 'open' | 'merged' | 'closed' | 'draft';
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  mergedBy?: string;
  
  // Changes
  filesChanged: string[];
  commits: string[];
  conflictFiles: string[];
  
  // Reviews and approvals
  approvals: number;
  requiredApprovals: number;
  reviews: MergeRequestReview[];
  
  // Metadata
  labels: string[];
  milestone?: string;
  assignees: string[];
}

export interface MergeRequestReviewer {
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'dismissed';
  reviewedAt?: Date;
}

export interface MergeRequestReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  status: 'approved' | 'changes_requested' | 'comment';
  comment?: string;
  timestamp: Date;
  
  // Line-specific comments
  lineComments: LineComment[];
}

export interface LineComment {
  id: string;
  filePath: string;
  lineNumber: number;
  comment: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface RepositoryComment {
  id: string;
  type: 'general' | 'file' | 'line' | 'commit';
  
  // Content
  content: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  
  // Context
  filePath?: string;
  lineNumber?: number;
  commitHash?: string;
  
  // Threading
  parentCommentId?: string;
  replies: RepositoryComment[];
  
  // Status
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Reactions
  reactions: CommentReaction[];
}

export interface CommentReaction {
  type: 'like' | 'dislike' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes';
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface Discussion {
  id: string;
  title: string;
  category: 'general' | 'ideas' | 'q_and_a' | 'show_and_tell' | 'announcements';
  
  // Content
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Status
  status: 'open' | 'closed' | 'locked';
  pinned: boolean;
  
  // Engagement
  comments: DiscussionComment[];
  participants: string[];
  views: number;
  
  // Labels and metadata
  labels: string[];
  metadata: Record<string, any>;
}

export interface DiscussionComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  
  // Threading
  parentCommentId?: string;
  replies: DiscussionComment[];
  
  // Status
  edited: boolean;
  editedAt?: Date;
  
  // Reactions
  reactions: CommentReaction[];
}

export interface SyncStatus {
  lastSync: Date;
  syncInProgress: boolean;
  pendingChanges: number;
  conflicts: number;
  
  // Sync details
  syncedCollaborators: string[];
  failedSyncs: SyncFailure[];
  
  // Real-time status
  connectedUsers: ConnectedUser[];
  activeOperations: ActiveOperation[];
}

export interface SyncFailure {
  timestamp: Date;
  collaboratorId: string;
  error: string;
  retryCount: number;
  resolved: boolean;
}

export interface ConnectedUser {
  userId: string;
  userName: string;
  connectionId: string;
  connectedAt: Date;
  lastActivity: Date;
  currentFile?: string;
  currentOperation?: string;
}

export interface ActiveOperation {
  id: string;
  type: 'edit' | 'commit' | 'merge' | 'branch' | 'upload';
  userId: string;
  userName: string;
  startedAt: Date;
  filePath?: string;
  description: string;
  progress?: number;
}

export interface ConflictResolution {
  id: string;
  type: 'file_conflict' | 'branch_conflict' | 'permission_conflict' | 'merge_conflict';
  
  // Conflict details
  filePath?: string;
  conflictingUsers: string[];
  description: string;
  
  // Resolution
  status: 'pending' | 'resolved' | 'escalated';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  
  // Metadata
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
}

export interface ContributionStats {
  totalCommits: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  totalFilesChanged: number;
  
  // Time-based stats
  commitsThisWeek: number;
  commitsThisMonth: number;
  
  // Collaboration stats
  mergeRequestsCreated: number;
  mergeRequestsReviewed: number;
  commentsPosted: number;
  discussionsStarted: number;
  
  // Quality metrics
  averageReviewTime: number; // in hours
  codeReviewScore: number; // 0-100
  collaborationScore: number; // 0-100
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'file_changed' | 'comment_added' | 'merge_request_created' | 
        'branch_created' | 'conflict_detected' | 'sync_completed' | 'permission_changed';
  repositoryId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

export class AdvancedCollaborationService {
  private static instance: AdvancedCollaborationService;
  private repositories: Map<string, CollaborativeRepository> = new Map();
  private eventListeners: Map<string, ((event: CollaborationEvent) => void)[]> = new Map();
  
  // Real-time connections
  private connections: Map<string, WebSocket> = new Map();
  private userSessions: Map<string, ConnectedUser[]> = new Map();

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): AdvancedCollaborationService {
    if (!AdvancedCollaborationService.instance) {
      AdvancedCollaborationService.instance = new AdvancedCollaborationService();
    }
    return AdvancedCollaborationService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      // Load existing repositories
      await this.loadRepositories();
      
      // Set up periodic sync
      setInterval(() => this.performPeriodicSync(), 30000); // Every 30 seconds
      
      // Set up cleanup
      setInterval(() => this.cleanupInactiveSessions(), 300000); // Every 5 minutes
      
      console.log('AdvancedCollaborationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdvancedCollaborationService:', error);
    }
  }

  // =====================================
  // REPOSITORY COLLABORATION
  // =====================================

  public async enableCollaboration(repositoryId: string, ownerId: string): Promise<void> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      // Enable collaboration
      repository.collaborationEnabled = true;
      repository.lastActivity = new Date();
      
      // Add owner as first collaborator
      const ownerCollaborator: RepositoryCollaborator = {
        id: `collab_${Date.now()}`,
        userId: ownerId,
        userType: 'human',
        displayName: await this.getUserDisplayName(ownerId),
        role: 'owner',
        permissions: this.createOwnerPermissions(),
        status: 'active',
        lastSeen: new Date(),
        joinedAt: new Date(),
        contributionStats: this.createEmptyContributionStats()
      };
      
      repository.collaborators = [ownerCollaborator];
      repository.permissions = this.createDefaultPermissions();
      
      // Initialize collaboration structures
      repository.activityFeed = [];
      repository.branches = [{
        name: 'main',
        commitHash: 'initial',
        createdBy: ownerId,
        createdAt: new Date(),
        lastCommit: new Date(),
        protected: true,
        defaultBranch: true,
        activeCollaborators: [ownerId],
        mergeRequests: [],
        status: 'active',
        ahead: 0,
        behind: 0
      }];
      repository.currentBranch = 'main';
      repository.mergeRequests = [];
      repository.comments = [];
      repository.discussions = [];
      repository.syncStatus = this.createInitialSyncStatus();
      repository.conflictResolution = [];

      // Save repository
      await this.saveRepository(repository);
      
      // Log activity
      await this.logActivity(repositoryId, {
        type: 'collaboration_enabled',
        actorId: ownerId,
        actorName: ownerCollaborator.displayName,
        actorType: 'human',
        timestamp: new Date(),
        description: 'Enabled collaboration for repository',
        details: {},
        metadata: {},
        visibility: 'collaborators'
      });

      console.log(`Collaboration enabled for repository ${repositoryId}`);
    } catch (error) {
      console.error('Failed to enable collaboration:', error);
      throw error;
    }
  }

  public async addCollaborator(repositoryId: string, inviterId: string, collaboratorData: Partial<RepositoryCollaborator>): Promise<string> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository || !repository.collaborationEnabled) {
        throw new Error('Repository not found or collaboration not enabled');
      }

      // Check permissions
      if (!await this.canManageCollaborators(repositoryId, inviterId)) {
        throw new Error('Insufficient permissions to add collaborators');
      }

      // Create collaborator
      const collaborator: RepositoryCollaborator = {
        id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: collaboratorData.userId!,
        userType: collaboratorData.userType || 'human',
        displayName: collaboratorData.displayName || await this.getUserDisplayName(collaboratorData.userId!),
        email: collaboratorData.email,
        avatar: collaboratorData.avatar,
        role: collaboratorData.role || 'contributor',
        permissions: this.createRolePermissions(collaboratorData.role || 'contributor'),
        status: 'invited',
        lastSeen: new Date(),
        joinedAt: new Date(),
        invitedBy: inviterId,
        contributionStats: this.createEmptyContributionStats()
      };

      // Add to repository
      repository.collaborators.push(collaborator);
      repository.lastActivity = new Date();

      // Save repository
      await this.saveRepository(repository);

      // Send invitation
      await this.sendCollaborationInvitation(repository, collaborator, inviterId);

      // Log activity
      await this.logActivity(repositoryId, {
        type: 'collaborator_add',
        actorId: inviterId,
        actorName: await this.getUserDisplayName(inviterId),
        actorType: 'human',
        timestamp: new Date(),
        description: `Invited ${collaborator.displayName} as ${collaborator.role}`,
        details: {
          collaboratorsAffected: [collaborator.userId]
        },
        metadata: { role: collaborator.role },
        visibility: 'collaborators'
      });

      // Emit event
      this.emitEvent(repositoryId, {
        type: 'user_joined',
        repositoryId,
        userId: collaborator.userId,
        timestamp: new Date(),
        data: collaborator
      });

      return collaborator.id;
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      throw error;
    }
  }

  public async removeCollaborator(repositoryId: string, removerId: string, collaboratorId: string): Promise<void> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      // Check permissions
      if (!await this.canManageCollaborators(repositoryId, removerId)) {
        throw new Error('Insufficient permissions to remove collaborators');
      }

      // Find collaborator
      const collaboratorIndex = repository.collaborators.findIndex(c => c.id === collaboratorId);
      if (collaboratorIndex === -1) {
        throw new Error('Collaborator not found');
      }

      const collaborator = repository.collaborators[collaboratorIndex];
      
      // Cannot remove owner
      if (collaborator.role === 'owner') {
        throw new Error('Cannot remove repository owner');
      }

      // Remove collaborator
      repository.collaborators.splice(collaboratorIndex, 1);
      repository.lastActivity = new Date();

      // Clean up user's active sessions
      await this.cleanupUserSessions(repositoryId, collaborator.userId);

      // Save repository
      await this.saveRepository(repository);

      // Log activity
      await this.logActivity(repositoryId, {
        type: 'collaborator_remove',
        actorId: removerId,
        actorName: await this.getUserDisplayName(removerId),
        actorType: 'human',
        timestamp: new Date(),
        description: `Removed ${collaborator.displayName} from repository`,
        details: {
          collaboratorsAffected: [collaborator.userId]
        },
        metadata: { previousRole: collaborator.role },
        visibility: 'collaborators'
      });

      // Emit event
      this.emitEvent(repositoryId, {
        type: 'user_left',
        repositoryId,
        userId: collaborator.userId,
        timestamp: new Date(),
        data: { reason: 'removed', removedBy: removerId }
      });

    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      throw error;
    }
  }

  // =====================================
  // REAL-TIME COLLABORATION
  // =====================================

  public async connectUser(repositoryId: string, userId: string): Promise<string> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository || !repository.collaborationEnabled) {
        throw new Error('Repository not found or collaboration not enabled');
      }

      // Check if user is a collaborator
      const collaborator = repository.collaborators.find(c => c.userId === userId);
      if (!collaborator) {
        throw new Error('User is not a collaborator');
      }

      // Create connection
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const connectedUser: ConnectedUser = {
        userId,
        userName: collaborator.displayName,
        connectionId,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      // Add to repository sync status
      repository.syncStatus.connectedUsers.push(connectedUser);

      // Add to user sessions
      if (!this.userSessions.has(repositoryId)) {
        this.userSessions.set(repositoryId, []);
      }
      this.userSessions.get(repositoryId)!.push(connectedUser);

      // Update collaborator status
      collaborator.status = 'active';
      collaborator.lastSeen = new Date();

      // Save repository
      await this.saveRepository(repository);

      // Emit event
      this.emitEvent(repositoryId, {
        type: 'user_joined',
        repositoryId,
        userId,
        timestamp: new Date(),
        data: { connectionId }
      });

      return connectionId;
    } catch (error) {
      console.error('Failed to connect user:', error);
      throw error;
    }
  }

  public async disconnectUser(repositoryId: string, connectionId: string): Promise<void> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        return; // Repository might have been deleted
      }

      // Remove from sync status
      const connectedUserIndex = repository.syncStatus.connectedUsers.findIndex(u => u.connectionId === connectionId);
      if (connectedUserIndex >= 0) {
        const connectedUser = repository.syncStatus.connectedUsers[connectedUserIndex];
        repository.syncStatus.connectedUsers.splice(connectedUserIndex, 1);

        // Remove from user sessions
        const sessions = this.userSessions.get(repositoryId) || [];
        const sessionIndex = sessions.findIndex(s => s.connectionId === connectionId);
        if (sessionIndex >= 0) {
          sessions.splice(sessionIndex, 1);
        }

        // Update collaborator status if no more connections
        const hasOtherConnections = repository.syncStatus.connectedUsers.some(u => u.userId === connectedUser.userId);
        if (!hasOtherConnections) {
          const collaborator = repository.collaborators.find(c => c.userId === connectedUser.userId);
          if (collaborator) {
            collaborator.status = 'inactive';
            collaborator.lastSeen = new Date();
          }
        }

        // Save repository
        await this.saveRepository(repository);

        // Emit event
        this.emitEvent(repositoryId, {
          type: 'user_left',
          repositoryId,
          userId: connectedUser.userId,
          timestamp: new Date(),
          data: { connectionId, reason: 'disconnected' }
        });
      }
    } catch (error) {
      console.error('Failed to disconnect user:', error);
    }
  }

  public async updateUserActivity(repositoryId: string, connectionId: string, activity: Partial<ConnectedUser>): Promise<void> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        return;
      }

      // Update connected user
      const connectedUser = repository.syncStatus.connectedUsers.find(u => u.connectionId === connectionId);
      if (connectedUser) {
        Object.assign(connectedUser, activity);
        connectedUser.lastActivity = new Date();

        // Update collaborator
        const collaborator = repository.collaborators.find(c => c.userId === connectedUser.userId);
        if (collaborator) {
          collaborator.lastSeen = new Date();
          if (activity.currentOperation) {
            collaborator.currentActivity = activity.currentOperation;
          }
        }

        // Save repository
        await this.saveRepository(repository);
      }
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  }

  // =====================================
  // COMMENTS AND DISCUSSIONS
  // =====================================

  public async addComment(repositoryId: string, userId: string, comment: Omit<RepositoryComment, 'id' | 'authorId' | 'authorName' | 'timestamp' | 'replies' | 'reactions' | 'resolved'>): Promise<string> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      // Check permissions
      if (!await this.canRead(repositoryId, userId)) {
        throw new Error('Insufficient permissions to add comments');
      }

      const newComment: RepositoryComment = {
        ...comment,
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId: userId,
        authorName: await this.getUserDisplayName(userId),
        timestamp: new Date(),
        replies: [],
        reactions: [],
        resolved: false
      };

      // Add to repository
      repository.comments.push(newComment);
      repository.lastActivity = new Date();

      // Save repository
      await this.saveRepository(repository);

      // Log activity
      await this.logActivity(repositoryId, {
        type: 'comment',
        actorId: userId,
        actorName: newComment.authorName,
        actorType: 'human',
        timestamp: new Date(),
        description: `Added comment: ${comment.content.substring(0, 50)}...`,
        details: {},
        filePath: comment.filePath,
        metadata: { commentType: comment.type },
        visibility: 'collaborators'
      });

      // Emit event
      this.emitEvent(repositoryId, {
        type: 'comment_added',
        repositoryId,
        userId,
        timestamp: new Date(),
        data: newComment
      });

      return newComment.id;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  public async createDiscussion(repositoryId: string, userId: string, discussion: Omit<Discussion, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt' | 'comments' | 'participants' | 'views'>): Promise<string> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      // Check permissions
      if (!await this.canRead(repositoryId, userId)) {
        throw new Error('Insufficient permissions to create discussions');
      }

      const newDiscussion: Discussion = {
        ...discussion,
        id: `discussion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId: userId,
        authorName: await this.getUserDisplayName(userId),
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [],
        participants: [userId],
        views: 0
      };

      // Add to repository
      repository.discussions.push(newDiscussion);
      repository.lastActivity = new Date();

      // Save repository
      await this.saveRepository(repository);

      // Log activity
      await this.logActivity(repositoryId, {
        type: 'discussion',
        actorId: userId,
        actorName: newDiscussion.authorName,
        actorType: 'human',
        timestamp: new Date(),
        description: `Started discussion: ${discussion.title}`,
        details: {},
        metadata: { category: discussion.category },
        visibility: 'collaborators'
      });

      return newDiscussion.id;
    } catch (error) {
      console.error('Failed to create discussion:', error);
      throw error;
    }
  }

  // =====================================
  // MERGE REQUESTS
  // =====================================

  public async createMergeRequest(repositoryId: string, userId: string, mergeRequest: Omit<MergeRequest, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt' | 'reviewers' | 'reviews' | 'approvals'>): Promise<string> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      // Check permissions
      if (!await this.canWrite(repositoryId, userId)) {
        throw new Error('Insufficient permissions to create merge requests');
      }

      const newMergeRequest: MergeRequest = {
        ...mergeRequest,
        id: `mr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId: userId,
        authorName: await this.getUserDisplayName(userId),
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewers: [],
        reviews: [],
        approvals: 0
      };

      // Add to repository
      repository.mergeRequests.push(newMergeRequest);
      repository.lastActivity = new Date();

      // Save repository
      await this.saveRepository(repository);

      // Log activity
      await this.logActivity(repositoryId, {
        type: 'merge',
        actorId: userId,
        actorName: newMergeRequest.authorName,
        actorType: 'human',
        timestamp: new Date(),
        description: `Created merge request: ${mergeRequest.title}`,
        details: {
          filesChanged: mergeRequest.filesChanged
        },
        branchName: mergeRequest.sourceBranch,
        metadata: { targetBranch: mergeRequest.targetBranch },
        visibility: 'collaborators'
      });

      // Emit event
      this.emitEvent(repositoryId, {
        type: 'merge_request_created',
        repositoryId,
        userId,
        timestamp: new Date(),
        data: newMergeRequest
      });

      return newMergeRequest.id;
    } catch (error) {
      console.error('Failed to create merge request:', error);
      throw error;
    }
  }

  // =====================================
  // CONFLICT RESOLUTION
  // =====================================

  public async detectConflicts(repositoryId: string): Promise<ConflictResolution[]> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      const conflicts: ConflictResolution[] = [];

      // Check for file conflicts (multiple users editing same file)
      const activeOperations = repository.syncStatus.activeOperations;
      const fileOperations = activeOperations.filter(op => op.type === 'edit' && op.filePath);
      
      const fileGroups = new Map<string, ActiveOperation[]>();
      fileOperations.forEach(op => {
        if (!fileGroups.has(op.filePath!)) {
          fileGroups.set(op.filePath!, []);
        }
        fileGroups.get(op.filePath!)!.push(op);
      });

      for (const [filePath, operations] of fileGroups) {
        if (operations.length > 1) {
          const conflict: ConflictResolution = {
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_conflict',
            filePath,
            conflictingUsers: operations.map(op => op.userId),
            description: `Multiple users editing ${filePath}`,
            status: 'pending',
            createdAt: new Date(),
            priority: 'medium',
            autoResolvable: false
          };
          conflicts.push(conflict);
        }
      }

      // Add conflicts to repository
      repository.conflictResolution.push(...conflicts);
      repository.syncStatus.conflicts = repository.conflictResolution.filter(c => c.status === 'pending').length;

      // Save repository
      await this.saveRepository(repository);

      // Emit events for new conflicts
      conflicts.forEach(conflict => {
        this.emitEvent(repositoryId, {
          type: 'conflict_detected',
          repositoryId,
          userId: 'system',
          timestamp: new Date(),
          data: conflict
        });
      });

      return conflicts;
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      throw error;
    }
  }

  public async resolveConflict(repositoryId: string, conflictId: string, userId: string, resolution: string): Promise<void> {
    try {
      const repository = this.repositories.get(repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      const conflict = repository.conflictResolution.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      // Update conflict
      conflict.status = 'resolved';
      conflict.resolvedBy = userId;
      conflict.resolvedAt = new Date();
      conflict.resolution = resolution;

      // Update sync status
      repository.syncStatus.conflicts = repository.conflictResolution.filter(c => c.status === 'pending').length;

      // Save repository
      await this.saveRepository(repository);

      // Log activity
      await this.logActivity(repositoryId, {
        type: 'conflict_resolved',
        actorId: userId,
        actorName: await this.getUserDisplayName(userId),
        actorType: 'human',
        timestamp: new Date(),
        description: `Resolved conflict: ${conflict.description}`,
        details: {},
        filePath: conflict.filePath,
        metadata: { conflictType: conflict.type, resolution },
        visibility: 'collaborators'
      });
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  private async loadRepositories(): Promise<void> {
    // Implementation would load repositories from storage
    // For now, this is a placeholder
  }

  private async saveRepository(repository: CollaborativeRepository): Promise<void> {
    // Implementation would save repository to storage
    // For now, just update in-memory map
    this.repositories.set(repository.id, repository);
  }

  private async getUserDisplayName(userId: string): Promise<string> {
    // Implementation would get user display name from user service
    return `User ${userId}`;
  }

  private createOwnerPermissions(): CollaboratorPermissions {
    return {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canManageCollaborators: true,
      canManageSettings: true,
      canCreateBranches: true,
      canMergeBranches: true,
      canDeleteBranches: true,
      canManageWebhooks: true,
      canManageIntegrations: true,
      canViewAnalytics: true
    };
  }

  private createRolePermissions(role: RepositoryCollaborator['role']): CollaboratorPermissions {
    const basePermissions = {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canManageCollaborators: false,
      canManageSettings: false,
      canCreateBranches: false,
      canMergeBranches: false,
      canDeleteBranches: false,
      canManageWebhooks: false,
      canManageIntegrations: false,
      canViewAnalytics: false
    };

    switch (role) {
      case 'owner':
        return this.createOwnerPermissions();
      case 'admin':
        return {
          ...basePermissions,
          canWrite: true,
          canDelete: true,
          canManageCollaborators: true,
          canManageSettings: true,
          canCreateBranches: true,
          canMergeBranches: true,
          canDeleteBranches: true,
          canViewAnalytics: true
        };
      case 'contributor':
        return {
          ...basePermissions,
          canWrite: true,
          canCreateBranches: true
        };
      case 'viewer':
      default:
        return basePermissions;
    }
  }

  private createDefaultPermissions(): RepositoryPermissions {
    return {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canManageCollaborators: false,
      canManageSettings: false,
      canCreateBranches: false,
      canMergeBranches: false,
      canDeleteBranches: false,
      canManageWebhooks: false,
      canManageIntegrations: false,
      canViewAnalytics: false
    };
  }

  private createEmptyContributionStats(): ContributionStats {
    return {
      totalCommits: 0,
      totalLinesAdded: 0,
      totalLinesRemoved: 0,
      totalFilesChanged: 0,
      commitsThisWeek: 0,
      commitsThisMonth: 0,
      mergeRequestsCreated: 0,
      mergeRequestsReviewed: 0,
      commentsPosted: 0,
      discussionsStarted: 0,
      averageReviewTime: 0,
      codeReviewScore: 0,
      collaborationScore: 0
    };
  }

  private createInitialSyncStatus(): SyncStatus {
    return {
      lastSync: new Date(),
      syncInProgress: false,
      pendingChanges: 0,
      conflicts: 0,
      syncedCollaborators: [],
      failedSyncs: [],
      connectedUsers: [],
      activeOperations: []
    };
  }

  private async canRead(repositoryId: string, userId: string): Promise<boolean> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return false;

    const collaborator = repository.collaborators.find(c => c.userId === userId);
    return collaborator ? collaborator.permissions.canRead : false;
  }

  private async canWrite(repositoryId: string, userId: string): Promise<boolean> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return false;

    const collaborator = repository.collaborators.find(c => c.userId === userId);
    return collaborator ? collaborator.permissions.canWrite : false;
  }

  private async canManageCollaborators(repositoryId: string, userId: string): Promise<boolean> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return false;

    const collaborator = repository.collaborators.find(c => c.userId === userId);
    return collaborator ? collaborator.permissions.canManageCollaborators : false;
  }

  private async sendCollaborationInvitation(repository: CollaborativeRepository, collaborator: RepositoryCollaborator, inviterId: string): Promise<void> {
    // Implementation would send invitation email/notification
    console.log(`Sending collaboration invitation to ${collaborator.displayName} for repository ${repository.name}`);
  }

  private async cleanupUserSessions(repositoryId: string, userId: string): Promise<void> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return;

    // Remove from connected users
    repository.syncStatus.connectedUsers = repository.syncStatus.connectedUsers.filter(u => u.userId !== userId);

    // Remove from user sessions
    const sessions = this.userSessions.get(repositoryId) || [];
    this.userSessions.set(repositoryId, sessions.filter(s => s.userId !== userId));

    // Cancel active operations
    repository.syncStatus.activeOperations = repository.syncStatus.activeOperations.filter(op => op.userId !== userId);
  }

  private async logActivity(repositoryId: string, activity: Omit<RepositoryActivity, 'id'>): Promise<void> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return;

    const activityRecord: RepositoryActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    repository.activityFeed.unshift(activityRecord);

    // Keep only last 1000 activities
    if (repository.activityFeed.length > 1000) {
      repository.activityFeed = repository.activityFeed.slice(0, 1000);
    }
  }

  private async performPeriodicSync(): Promise<void> {
    for (const [repositoryId, repository] of this.repositories) {
      if (!repository.collaborationEnabled) continue;

      try {
        // Update sync status
        repository.syncStatus.lastSync = new Date();
        repository.syncStatus.syncInProgress = true;

        // Detect conflicts
        await this.detectConflicts(repositoryId);

        // Clean up inactive connections
        const now = Date.now();
        repository.syncStatus.connectedUsers = repository.syncStatus.connectedUsers.filter(user => {
          const inactive = now - user.lastActivity.getTime() > 300000; // 5 minutes
          return !inactive;
        });

        // Update sync status
        repository.syncStatus.syncInProgress = false;

        // Emit sync completed event
        this.emitEvent(repositoryId, {
          type: 'sync_completed',
          repositoryId,
          userId: 'system',
          timestamp: new Date(),
          data: { syncStatus: repository.syncStatus }
        });

      } catch (error) {
        console.error(`Failed to sync repository ${repositoryId}:`, error);
        repository.syncStatus.syncInProgress = false;
      }
    }
  }

  private async cleanupInactiveSessions(): Promise<void> {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [repositoryId, sessions] of this.userSessions) {
      const activeSessions = sessions.filter(session => {
        const inactive = now - session.lastActivity.getTime() > inactiveThreshold;
        if (inactive) {
          this.disconnectUser(repositoryId, session.connectionId);
        }
        return !inactive;
      });

      this.userSessions.set(repositoryId, activeSessions);
    }
  }

  // =====================================
  // EVENT SYSTEM
  // =====================================

  public addEventListener(repositoryId: string, callback: (event: CollaborationEvent) => void): void {
    if (!this.eventListeners.has(repositoryId)) {
      this.eventListeners.set(repositoryId, []);
    }
    this.eventListeners.get(repositoryId)!.push(callback);
  }

  public removeEventListener(repositoryId: string, callback: (event: CollaborationEvent) => void): void {
    const listeners = this.eventListeners.get(repositoryId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(repositoryId: string, event: CollaborationEvent): void {
    const listeners = this.eventListeners.get(repositoryId) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in collaboration event listener:', error);
      }
    });
  }

  // =====================================
  // PUBLIC API
  // =====================================

  public async getRepository(repositoryId: string): Promise<CollaborativeRepository | null> {
    return this.repositories.get(repositoryId) || null;
  }

  public async getCollaborators(repositoryId: string): Promise<RepositoryCollaborator[]> {
    const repository = this.repositories.get(repositoryId);
    return repository ? repository.collaborators : [];
  }

  public async getActivityFeed(repositoryId: string, limit: number = 50): Promise<RepositoryActivity[]> {
    const repository = this.repositories.get(repositoryId);
    return repository ? repository.activityFeed.slice(0, limit) : [];
  }

  public async getConnectedUsers(repositoryId: string): Promise<ConnectedUser[]> {
    const repository = this.repositories.get(repositoryId);
    return repository ? repository.syncStatus.connectedUsers : [];
  }

  public async getMergeRequests(repositoryId: string): Promise<MergeRequest[]> {
    const repository = this.repositories.get(repositoryId);
    return repository ? repository.mergeRequests : [];
  }

  public async getComments(repositoryId: string, filePath?: string): Promise<RepositoryComment[]> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return [];

    let comments = repository.comments;
    if (filePath) {
      comments = comments.filter(c => c.filePath === filePath);
    }

    return comments;
  }

  public async getDiscussions(repositoryId: string): Promise<Discussion[]> {
    const repository = this.repositories.get(repositoryId);
    return repository ? repository.discussions : [];
  }

  public async getConflicts(repositoryId: string): Promise<ConflictResolution[]> {
    const repository = this.repositories.get(repositoryId);
    return repository ? repository.conflictResolution.filter(c => c.status === 'pending') : [];
  }
}

export default AdvancedCollaborationService;

