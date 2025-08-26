/**
 * Workflow Repository Manager
 * 
 * Core system for managing autonomous workflow repositories - the "GitHub within Promethios".
 * Provides complete lifecycle management for AI-generated projects including creation,
 * persistence, collaboration, extension, versioning, and export capabilities.
 * 
 * Revolutionary Features:
 * - Persistent autonomous projects that survive across sessions
 * - Resumable workflows - pick up exactly where you left off
 * - True human-AI collaboration over time
 * - Complete version control and change tracking
 * - Extensible repositories - add new features to existing projects
 * - Export to GitHub, ZIP, or deployment platforms
 * - Template system for reusable project patterns
 * 
 * This transforms AI from "one-shot tool" to "persistent development partner"
 * 
 * @author Manus AI
 * @version 2.0.0
 */

import { WorkflowRepositoryService } from './WorkflowRepositoryService';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';
import { UniversalAuditLoggingService } from './UniversalAuditLoggingService';
import { 
  AutonomousTaskPlan, 
  AutonomousPhase, 
  AutonomousGovernanceContext 
} from './AutonomousGovernanceExtension';

// ============================================================================
// WORKFLOW REPOSITORY TYPES
// ============================================================================

export interface WorkflowRepository {
  // Core repository metadata
  id: string;
  name: string;
  displayName: string;
  description: string;
  
  // Repository state
  status: 'active' | 'paused' | 'completed' | 'extended' | 'archived' | 'failed';
  visibility: 'private' | 'shared' | 'public' | 'template';
  
  // Workflow context
  originalGoal: string;
  currentGoal: string; // May evolve through extensions
  workflowType: 'code_shell' | 'research_dossier' | 'launch_plan' | 'audit_pack' | 'content_series' | 'custom';
  
  // Progress tracking
  progress: {
    currentPhase: number;
    totalPhases: number;
    overallProgress: number; // 0-100
    phasesCompleted: number;
    artifactsGenerated: number;
    estimatedTimeRemaining: number; // minutes
  };
  
  // Repository structure
  structure: RepositoryStructure;
  
  // Collaboration
  collaborators: RepositoryCollaborator[];
  permissions: RepositoryPermissions;
  
  // Version control
  version: string;
  branches: RepositoryBranch[];
  currentBranch: string;
  
  // Extensions and modifications
  extensions: RepositoryExtension[];
  modifications: RepositoryModification[];
  
  // Analytics and metrics
  analytics: RepositoryAnalytics;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  completedAt?: string;
  
  // User context
  userId: string;
  agentId: string;
  sessionId: string;
  
  // Export and deployment
  exports: RepositoryExport[];
  deployments: RepositoryDeployment[];
  
  // Tags and categorization
  tags: string[];
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Success metrics
  userRating?: number; // 1-5 stars
  successMetrics: {
    goalAchieved: boolean;
    userSatisfaction: number; // 0-1
    timeToCompletion: number; // minutes
    iterationsRequired: number;
    complianceScore: number; // 0-1
  };
}

export interface RepositoryStructure {
  // Core files (always present)
  coreFiles: {
    'goal.md': RepositoryFile;
    'plan.yaml': RepositoryFile;
    'README.md': RepositoryFile;
    'governance.json': RepositoryFile;
  };
  
  // Organized directories
  directories: {
    'artifacts/': RepositoryDirectory;
    'receipts/': RepositoryDirectory;
    'checklists/': RepositoryDirectory;
    'integration/': RepositoryDirectory;
    'collaboration/': RepositoryDirectory;
    'versions/': RepositoryDirectory;
    'templates/': RepositoryDirectory;
    'extensions/': RepositoryDirectory;
  };
  
  // Dynamic structure based on workflow type
  customDirectories: { [path: string]: RepositoryDirectory };
  customFiles: { [path: string]: RepositoryFile };
}

export interface RepositoryFile {
  path: string;
  name: string;
  type: 'markdown' | 'yaml' | 'json' | 'html' | 'css' | 'javascript' | 'python' | 'image' | 'document' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'modified';
  size: number; // bytes
  
  // Content and metadata
  content?: string; // For text files
  contentUrl?: string; // For binary files
  checksum: string;
  version: string;
  
  // Generation context
  generatedBy: 'agent' | 'user' | 'system' | 'template';
  generationPrompt?: string;
  generationMetadata?: any;
  
  // Dependencies
  dependencies: string[]; // Other files this depends on
  dependents: string[]; // Files that depend on this
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  
  // User interaction
  userModified: boolean;
  userApproved: boolean;
  userComments: FileComment[];
  
  // Export and sharing
  exportable: boolean;
  shareable: boolean;
  
  // Preview and display
  previewUrl?: string;
  thumbnailUrl?: string;
  displayInBrowser: boolean;
}

export interface RepositoryDirectory {
  path: string;
  name: string;
  description: string;
  files: { [filename: string]: RepositoryFile };
  subdirectories: { [dirname: string]: RepositoryDirectory };
  
  // Directory metadata
  fileCount: number;
  totalSize: number;
  lastModified: string;
  
  // Organization
  collapsed: boolean; // UI state
  sortOrder: 'name' | 'date' | 'size' | 'status';
  
  // Permissions
  readOnly: boolean;
  userCanAdd: boolean;
  userCanDelete: boolean;
}

export interface FileComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
  resolved: boolean;
  lineNumber?: number; // For code files
}

export interface RepositoryCollaborator {
  userId: string;
  userName: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'agent';
  permissions: string[];
  addedAt: string;
  lastActiveAt: string;
  contributionCount: number;
}

export interface RepositoryPermissions {
  // Repository-level permissions
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canExport: boolean;
  canExtend: boolean;
  canDeploy: boolean;
  
  // Collaboration permissions
  canInviteCollaborators: boolean;
  canManagePermissions: boolean;
  canArchive: boolean;
  
  // Agent permissions
  agentCanModify: boolean;
  agentCanExtend: boolean;
  agentCanDeploy: boolean;
  requiresApprovalFor: string[]; // Actions requiring user approval
}

export interface RepositoryBranch {
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  
  // Branch state
  isDefault: boolean;
  isActive: boolean;
  commitCount: number;
  lastCommit: string;
  
  // Merge information
  canMerge: boolean;
  mergeConflicts: string[];
  
  // Branch purpose
  purpose: 'main' | 'feature' | 'experiment' | 'extension' | 'hotfix';
}

export interface RepositoryExtension {
  id: string;
  name: string;
  description: string;
  type: 'feature_addition' | 'enhancement' | 'integration' | 'optimization' | 'customization';
  
  // Extension details
  originalGoal: string;
  extensionGoal: string;
  addedFeatures: string[];
  modifiedFiles: string[];
  newFiles: string[];
  
  // Progress
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  
  // Metadata
  createdAt: string;
  completedAt?: string;
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  
  // User context
  requestedBy: string;
  approvedBy?: string;
  
  // Impact assessment
  impactAssessment: {
    riskLevel: 'low' | 'medium' | 'high';
    affectedFiles: string[];
    potentialConflicts: string[];
    rollbackPlan: string;
  };
}

export interface RepositoryModification {
  id: string;
  type: 'file_added' | 'file_modified' | 'file_deleted' | 'structure_changed' | 'goal_updated' | 'extension_added';
  description: string;
  
  // Change details
  changedFiles: string[];
  changesSummary: string;
  
  // Context
  modifiedBy: 'user' | 'agent' | 'system';
  modificationReason: string;
  approvalRequired: boolean;
  approved: boolean;
  
  // Timestamps
  timestamp: string;
  approvedAt?: string;
  
  // Rollback information
  canRollback: boolean;
  rollbackData?: any;
}

export interface RepositoryAnalytics {
  // Usage metrics
  totalViews: number;
  uniqueVisitors: number;
  lastViewedAt: string;
  averageSessionDuration: number; // minutes
  
  // File metrics
  mostViewedFiles: { [filename: string]: number };
  mostModifiedFiles: { [filename: string]: number };
  fileDownloads: { [filename: string]: number };
  
  // Collaboration metrics
  collaboratorActivity: { [userId: string]: number };
  commentsCount: number;
  modificationsCount: number;
  
  // Performance metrics
  buildTime: number; // minutes
  deploymentCount: number;
  successfulDeployments: number;
  
  // User engagement
  userRatings: number[];
  averageRating: number;
  completionRate: number; // 0-1
  
  // Export metrics
  exportCount: number;
  shareCount: number;
  cloneCount: number;
}

export interface RepositoryExport {
  id: string;
  type: 'zip' | 'github' | 'gitlab' | 'deployment_package' | 'source_only' | 'documentation';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  // Export configuration
  includeArtifacts: boolean;
  includeReceipts: boolean;
  includeGovernance: boolean;
  includeHistory: boolean;
  
  // Export results
  downloadUrl?: string;
  githubUrl?: string;
  deploymentUrl?: string;
  
  // Metadata
  createdAt: string;
  completedAt?: string;
  fileSize?: number;
  expiresAt?: string;
  
  // User context
  exportedBy: string;
  exportReason: string;
}

export interface RepositoryDeployment {
  id: string;
  type: 'preview' | 'staging' | 'production';
  platform: 'vercel' | 'netlify' | 'github_pages' | 'aws' | 'custom';
  status: 'pending' | 'building' | 'deployed' | 'failed';
  
  // Deployment details
  url?: string;
  buildLogs: string[];
  deploymentConfig: any;
  
  // Metadata
  deployedAt: string;
  deployedBy: string;
  version: string;
  
  // Monitoring
  uptime: number; // 0-1
  responseTime: number; // milliseconds
  lastChecked: string;
}

export interface RepositoryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Template structure
  templateStructure: RepositoryStructure;
  defaultGoal: string;
  suggestedPhases: string[];
  
  // Usage metrics
  usageCount: number;
  successRate: number; // 0-1
  averageCompletionTime: number; // minutes
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  
  // Customization
  customizable: boolean;
  requiredInputs: TemplateInput[];
  optionalInputs: TemplateInput[];
}

export interface TemplateInput {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select types
  validation?: string; // Regex or validation rule
}

export interface RepositorySearchResult {
  repository: WorkflowRepository;
  relevanceScore: number;
  matchedFields: string[];
  snippet: string;
}

export interface RepositoryFilter {
  status?: string[];
  workflowType?: string[];
  tags?: string[];
  dateRange?: { start: string; end: string };
  collaborators?: string[];
  minRating?: number;
  hasDeployments?: boolean;
  hasExports?: boolean;
}

// ============================================================================
// WORKFLOW REPOSITORY MANAGER CLASS
// ============================================================================

export class WorkflowRepositoryManager {
  private static instance: WorkflowRepositoryManager;
  
  // Core service integrations
  private repositoryService: WorkflowRepositoryService;
  private governanceAdapter: UniversalGovernanceAdapter;
  private auditService: UniversalAuditLoggingService;
  
  // Repository storage and caching
  private repositories: Map<string, WorkflowRepository> = new Map();
  private templates: Map<string, RepositoryTemplate> = new Map();
  private userRepositories: Map<string, string[]> = new Map(); // userId -> repoIds
  
  // Real-time updates and collaboration
  private repositorySubscriptions: Map<string, ((repo: WorkflowRepository) => void)[]> = new Map();
  private collaborationSessions: Map<string, Set<string>> = new Map(); // repoId -> userIds
  
  // Background processes
  private autoSaveIntervals: Map<string, NodeJS.Timeout> = new Map();
  private analyticsUpdateIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    console.log('📁 [Repository Manager] Initializing Workflow Repository Manager');
    
    // Initialize service integrations
    this.repositoryService = WorkflowRepositoryService.getInstance();
    this.governanceAdapter = UniversalGovernanceAdapter.getInstance();
    this.auditService = UniversalAuditLoggingService.getInstance();
    
    // Initialize default templates
    this.initializeDefaultTemplates();
    
    // Start background processes
    this.startBackgroundProcesses();
    
    console.log('✅ [Repository Manager] Workflow Repository Manager initialized');
  }

  static getInstance(): WorkflowRepositoryManager {
    if (!WorkflowRepositoryManager.instance) {
      WorkflowRepositoryManager.instance = new WorkflowRepositoryManager();
    }
    return WorkflowRepositoryManager.instance;
  }

  // ============================================================================
  // REPOSITORY LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Create new workflow repository from goal or template
   */
  async createRepository(
    goal: string,
    workflowType: string,
    userId: string,
    agentId: string,
    sessionId: string,
    templateId?: string
  ): Promise<WorkflowRepository> {
    
    console.log(`📁 [Repository Manager] Creating new repository: ${goal}`);

    try {
      // Generate repository metadata
      const repoId = `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const repoName = this.generateRepositoryName(goal);
      const displayName = this.generateDisplayName(goal);
      
      // Get template if specified
      const template = templateId ? this.templates.get(templateId) : null;
      
      // Create repository structure
      const structure = await this.createRepositoryStructure(workflowType, template);
      
      // Initialize core files
      await this.initializeCoreFiles(structure, goal, workflowType);
      
      // Create repository object
      const repository: WorkflowRepository = {
        id: repoId,
        name: repoName,
        displayName: displayName,
        description: `Autonomous workflow repository for: ${goal}`,
        status: 'active',
        visibility: 'private',
        originalGoal: goal,
        currentGoal: goal,
        workflowType: workflowType as any,
        
        progress: {
          currentPhase: 1,
          totalPhases: 0, // Will be set when plan is created
          overallProgress: 0,
          phasesCompleted: 0,
          artifactsGenerated: 0,
          estimatedTimeRemaining: 0
        },
        
        structure,
        
        collaborators: [{
          userId: userId,
          userName: 'User', // Would be fetched from user service
          role: 'owner',
          permissions: ['all'],
          addedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          contributionCount: 0
        }, {
          userId: agentId,
          userName: 'Autonomous Agent',
          role: 'agent',
          permissions: ['read', 'write', 'generate'],
          addedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          contributionCount: 0
        }],
        
        permissions: this.getDefaultPermissions(),
        
        version: '1.0.0',
        branches: [{
          name: 'main',
          description: 'Main development branch',
          createdAt: new Date().toISOString(),
          createdBy: userId,
          isDefault: true,
          isActive: true,
          commitCount: 1,
          lastCommit: 'Initial repository creation',
          canMerge: false,
          mergeConflicts: [],
          purpose: 'main'
        }],
        currentBranch: 'main',
        
        extensions: [],
        modifications: [],
        
        analytics: this.initializeAnalytics(),
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        
        userId,
        agentId,
        sessionId,
        
        exports: [],
        deployments: [],
        
        tags: this.generateTags(goal, workflowType),
        category: this.categorizeRepository(goal, workflowType),
        priority: 'medium',
        
        successMetrics: {
          goalAchieved: false,
          userSatisfaction: 0,
          timeToCompletion: 0,
          iterationsRequired: 0,
          complianceScore: 1.0
        }
      };

      // Store repository
      this.repositories.set(repoId, repository);
      
      // Add to user's repositories
      if (!this.userRepositories.has(userId)) {
        this.userRepositories.set(userId, []);
      }
      this.userRepositories.get(userId)!.push(repoId);
      
      // Persist to backend
      await this.repositoryService.createRepository(repository);
      
      // Start auto-save and analytics
      this.startAutoSave(repoId);
      this.startAnalyticsTracking(repoId);
      
      // Log repository creation
      await this.auditService.logAutonomousAction({
        action: 'repository_created',
        planId: repoId,
        agentId,
        userId,
        sessionId,
        timestamp: new Date(),
        metadata: {
          repository_id: repoId,
          repository_name: repoName,
          workflow_type: workflowType,
          template_used: templateId,
          goal: goal
        }
      });

      console.log(`✅ [Repository Manager] Repository created: ${repoId} (${displayName})`);
      return repository;

    } catch (error) {
      console.error('❌ [Repository Manager] Failed to create repository:', error);
      throw error;
    }
  }

  /**
   * Get repository by ID with real-time updates
   */
  async getRepository(repoId: string, userId?: string): Promise<WorkflowRepository | null> {
    console.log(`📁 [Repository Manager] Getting repository: ${repoId}`);

    try {
      // Check cache first
      let repository = this.repositories.get(repoId);
      
      if (!repository) {
        // Load from backend
        repository = await this.repositoryService.getRepository(repoId);
        if (repository) {
          this.repositories.set(repoId, repository);
        }
      }
      
      if (!repository) {
        console.warn(`⚠️ [Repository Manager] Repository not found: ${repoId}`);
        return null;
      }
      
      // Check permissions
      if (userId && !this.hasRepositoryAccess(repository, userId)) {
        console.warn(`⚠️ [Repository Manager] Access denied for user ${userId} to repository ${repoId}`);
        return null;
      }
      
      // Update last accessed time
      repository.lastAccessedAt = new Date().toISOString();
      repository.analytics.totalViews++;
      
      // Track unique visitor
      if (userId) {
        repository.analytics.uniqueVisitors++;
      }
      
      await this.saveRepository(repository);
      
      console.log(`✅ [Repository Manager] Repository retrieved: ${repoId}`);
      return repository;

    } catch (error) {
      console.error(`❌ [Repository Manager] Failed to get repository ${repoId}:`, error);
      return null;
    }
  }

  /**
   * List repositories for user with filtering and search
   */
  async listRepositories(
    userId: string,
    filter?: RepositoryFilter,
    searchQuery?: string,
    sortBy: 'name' | 'date' | 'progress' | 'rating' = 'date',
    sortOrder: 'asc' | 'desc' = 'desc',
    limit: number = 50,
    offset: number = 0
  ): Promise<{ repositories: WorkflowRepository[]; total: number; hasMore: boolean }> {
    
    console.log(`📁 [Repository Manager] Listing repositories for user: ${userId}`);

    try {
      // Get user's repository IDs
      const userRepoIds = this.userRepositories.get(userId) || [];
      
      // Load repositories
      const repositories: WorkflowRepository[] = [];
      for (const repoId of userRepoIds) {
        const repo = await this.getRepository(repoId, userId);
        if (repo) {
          repositories.push(repo);
        }
      }
      
      // Apply filters
      let filteredRepos = repositories;
      if (filter) {
        filteredRepos = this.applyRepositoryFilter(repositories, filter);
      }
      
      // Apply search
      if (searchQuery) {
        filteredRepos = this.searchRepositories(filteredRepos, searchQuery);
      }
      
      // Sort repositories
      filteredRepos = this.sortRepositories(filteredRepos, sortBy, sortOrder);
      
      // Apply pagination
      const total = filteredRepos.length;
      const paginatedRepos = filteredRepos.slice(offset, offset + limit);
      const hasMore = offset + limit < total;
      
      console.log(`✅ [Repository Manager] Listed ${paginatedRepos.length} repositories (${total} total)`);
      return {
        repositories: paginatedRepos,
        total,
        hasMore
      };

    } catch (error) {
      console.error(`❌ [Repository Manager] Failed to list repositories for user ${userId}:`, error);
      return { repositories: [], total: 0, hasMore: false };
    }
  }

  /**
   * Update repository progress and status
   */
  async updateRepositoryProgress(
    repoId: string,
    progress: Partial<WorkflowRepository['progress']>,
    status?: WorkflowRepository['status']
  ): Promise<void> {
    
    console.log(`📁 [Repository Manager] Updating repository progress: ${repoId}`);

    try {
      const repository = this.repositories.get(repoId);
      if (!repository) {
        throw new Error(`Repository not found: ${repoId}`);
      }
      
      // Update progress
      repository.progress = { ...repository.progress, ...progress };
      
      // Update status if provided
      if (status) {
        repository.status = status;
        
        // Set completion time if completed
        if (status === 'completed' && !repository.completedAt) {
          repository.completedAt = new Date().toISOString();
          repository.successMetrics.goalAchieved = true;
          repository.successMetrics.timeToCompletion = 
            (new Date().getTime() - new Date(repository.createdAt).getTime()) / (1000 * 60); // minutes
        }
      }
      
      // Update timestamp
      repository.updatedAt = new Date().toISOString();
      
      // Save repository
      await this.saveRepository(repository);
      
      // Notify subscribers
      this.notifyRepositorySubscribers(repoId, repository);
      
      console.log(`✅ [Repository Manager] Repository progress updated: ${repoId}`);

    } catch (error) {
      console.error(`❌ [Repository Manager] Failed to update repository progress ${repoId}:`, error);
      throw error;
    }
  }

  /**
   * Add file to repository
   */
  async addFile(
    repoId: string,
    filePath: string,
    content: string,
    metadata: Partial<RepositoryFile> = {}
  ): Promise<RepositoryFile> {
    
    console.log(`📁 [Repository Manager] Adding file to repository: ${repoId}/${filePath}`);

    try {
      const repository = this.repositories.get(repoId);
      if (!repository) {
        throw new Error(`Repository not found: ${repoId}`);
      }
      
      // Create file object
      const file: RepositoryFile = {
        path: filePath,
        name: filePath.split('/').pop() || filePath,
        type: this.determineFileType(filePath),
        status: 'completed',
        size: content.length,
        content,
        checksum: this.calculateChecksum(content),
        version: '1.0.0',
        generatedBy: metadata.generatedBy || 'agent',
        generationPrompt: metadata.generationPrompt,
        generationMetadata: metadata.generationMetadata,
        dependencies: metadata.dependencies || [],
        dependents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        userModified: false,
        userApproved: false,
        userComments: [],
        exportable: true,
        shareable: true,
        displayInBrowser: this.canDisplayInBrowser(filePath),
        ...metadata
      };
      
      // Add file to repository structure
      this.addFileToStructure(repository.structure, file);
      
      // Update repository metrics
      repository.progress.artifactsGenerated++;
      repository.updatedAt = new Date().toISOString();
      
      // Create modification record
      const modification: RepositoryModification = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_added',
        description: `Added file: ${filePath}`,
        changedFiles: [filePath],
        changesSummary: `New file created: ${file.name}`,
        modifiedBy: metadata.generatedBy || 'agent',
        modificationReason: 'Workflow progress',
        approvalRequired: false,
        approved: true,
        timestamp: new Date().toISOString(),
        canRollback: true
      };
      
      repository.modifications.unshift(modification);
      
      // Save repository
      await this.saveRepository(repository);
      
      // Notify subscribers
      this.notifyRepositorySubscribers(repoId, repository);
      
      console.log(`✅ [Repository Manager] File added: ${repoId}/${filePath}`);
      return file;

    } catch (error) {
      console.error(`❌ [Repository Manager] Failed to add file ${filePath} to repository ${repoId}:`, error);
      throw error;
    }
  }

  /**
   * Update file in repository
   */
  async updateFile(
    repoId: string,
    filePath: string,
    content: string,
    modifiedBy: 'user' | 'agent' = 'agent'
  ): Promise<RepositoryFile> {
    
    console.log(`📁 [Repository Manager] Updating file in repository: ${repoId}/${filePath}`);

    try {
      const repository = this.repositories.get(repoId);
      if (!repository) {
        throw new Error(`Repository not found: ${repoId}`);
      }
      
      // Find and update file
      const file = this.findFileInStructure(repository.structure, filePath);
      if (!file) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Update file content and metadata
      file.content = content;
      file.size = content.length;
      file.checksum = this.calculateChecksum(content);
      file.updatedAt = new Date().toISOString();
      file.userModified = modifiedBy === 'user';
      file.status = 'completed';
      
      // Increment version
      const versionParts = file.version.split('.').map(Number);
      versionParts[2]++; // Increment patch version
      file.version = versionParts.join('.');
      
      // Update repository
      repository.updatedAt = new Date().toISOString();
      
      // Create modification record
      const modification: RepositoryModification = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_modified',
        description: `Updated file: ${filePath}`,
        changedFiles: [filePath],
        changesSummary: `File modified by ${modifiedBy}`,
        modifiedBy,
        modificationReason: modifiedBy === 'user' ? 'User edit' : 'Workflow progress',
        approvalRequired: false,
        approved: true,
        timestamp: new Date().toISOString(),
        canRollback: true
      };
      
      repository.modifications.unshift(modification);
      
      // Save repository
      await this.saveRepository(repository);
      
      // Notify subscribers
      this.notifyRepositorySubscribers(repoId, repository);
      
      console.log(`✅ [Repository Manager] File updated: ${repoId}/${filePath}`);
      return file;

    } catch (error) {
      console.error(`❌ [Repository Manager] Failed to update file ${filePath} in repository ${repoId}:`, error);
      throw error;
    }
  }

  /**
   * Extend repository with new features
   */
  async extendRepository(
    repoId: string,
    extensionGoal: string,
    extensionType: RepositoryExtension['type'],
    userId: string
  ): Promise<RepositoryExtension> {
    
    console.log(`📁 [Repository Manager] Extending repository: ${repoId} with ${extensionGoal}`);

    try {
      const repository = this.repositories.get(repoId);
      if (!repository) {
        throw new Error(`Repository not found: ${repoId}`);
      }
      
      // Create extension object
      const extension: RepositoryExtension = {
        id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: this.generateExtensionName(extensionGoal),
        description: extensionGoal,
        type: extensionType,
        originalGoal: repository.originalGoal,
        extensionGoal,
        addedFeatures: [],
        modifiedFiles: [],
        newFiles: [],
        status: 'planned',
        progress: 0,
        createdAt: new Date().toISOString(),
        estimatedDuration: this.estimateExtensionDuration(extensionGoal, extensionType),
        requestedBy: userId,
        impactAssessment: {
          riskLevel: this.assessExtensionRisk(repository, extensionGoal),
          affectedFiles: [],
          potentialConflicts: [],
          rollbackPlan: 'Create backup branch before extension'
        }
      };
      
      // Add extension to repository
      repository.extensions.push(extension);
      
      // Update repository goal and status
      repository.currentGoal = `${repository.originalGoal} + ${extensionGoal}`;
      repository.status = 'extended';
      repository.updatedAt = new Date().toISOString();
      
      // Create modification record
      const modification: RepositoryModification = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'extension_added',
        description: `Repository extended: ${extensionGoal}`,
        changedFiles: [],
        changesSummary: `New extension planned: ${extension.name}`,
        modifiedBy: 'user',
        modificationReason: 'Repository extension',
        approvalRequired: extension.impactAssessment.riskLevel === 'high',
        approved: extension.impactAssessment.riskLevel !== 'high',
        timestamp: new Date().toISOString(),
        canRollback: true
      };
      
      repository.modifications.unshift(modification);
      
      // Save repository
      await this.saveRepository(repository);
      
      // Log extension
      await this.auditService.logAutonomousAction({
        action: 'repository_extended',
        planId: repoId,
        agentId: repository.agentId,
        userId,
        sessionId: repository.sessionId,
        timestamp: new Date(),
        metadata: {
          extension_id: extension.id,
          extension_goal: extensionGoal,
          extension_type: extensionType,
          risk_level: extension.impactAssessment.riskLevel
        }
      });
      
      // Notify subscribers
      this.notifyRepositorySubscribers(repoId, repository);
      
      console.log(`✅ [Repository Manager] Repository extended: ${repoId} (${extension.name})`);
      return extension;

    } catch (error) {
      console.error(`❌ [Repository Manager] Failed to extend repository ${repoId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // REPOSITORY COLLABORATION
  // ============================================================================

  /**
   * Subscribe to repository updates
   */
  subscribeToRepository(repoId: string, callback: (repo: WorkflowRepository) => void): () => void {
    if (!this.repositorySubscriptions.has(repoId)) {
      this.repositorySubscriptions.set(repoId, []);
    }
    
    this.repositorySubscriptions.get(repoId)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.repositorySubscriptions.get(repoId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Add collaborator to repository
   */
  async addCollaborator(
    repoId: string,
    userId: string,
    userName: string,
    role: RepositoryCollaborator['role'],
    permissions: string[]
  ): Promise<void> {
    
    console.log(`📁 [Repository Manager] Adding collaborator to repository: ${repoId}`);

    try {
      const repository = this.repositories.get(repoId);
      if (!repository) {
        throw new Error(`Repository not found: ${repoId}`);
      }
      
      // Check if user is already a collaborator
      const existingCollaborator = repository.collaborators.find(c => c.userId === userId);
      if (existingCollaborator) {
        // Update existing collaborator
        existingCollaborator.role = role;
        existingCollaborator.permissions = permissions;
        existingCollaborator.lastActiveAt = new Date().toISOString();
      } else {
        // Add new collaborator
        const collaborator: RepositoryCollaborator = {
          userId,
          userName,
          role,
          permissions,
          addedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          contributionCount: 0
        };
        
        repository.collaborators.push(collaborator);
      }
      
      // Update repository
      repository.updatedAt = new Date().toISOString();
      
      // Save repository
      await this.saveRepository(repository);
      
      // Notify subscribers
      this.notifyRepositorySubscribers(repoId, repository);
      
      console.log(`✅ [Repository Manager] Collaborator added: ${userId} to ${repoId}`);

    } catch (error) {
      console.error(`❌ [Repository Manager] Failed to add collaborator ${userId} to repository ${repoId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async createRepositoryStructure(
    workflowType: string,
    template?: RepositoryTemplate | null
  ): Promise<RepositoryStructure> {
    
    // Base structure for all repositories
    const structure: RepositoryStructure = {
      coreFiles: {
        'goal.md': this.createEmptyFile('goal.md', 'markdown'),
        'plan.yaml': this.createEmptyFile('plan.yaml', 'yaml'),
        'README.md': this.createEmptyFile('README.md', 'markdown'),
        'governance.json': this.createEmptyFile('governance.json', 'json')
      },
      directories: {
        'artifacts/': this.createEmptyDirectory('artifacts'),
        'receipts/': this.createEmptyDirectory('receipts'),
        'checklists/': this.createEmptyDirectory('checklists'),
        'integration/': this.createEmptyDirectory('integration'),
        'collaboration/': this.createEmptyDirectory('collaboration'),
        'versions/': this.createEmptyDirectory('versions'),
        'templates/': this.createEmptyDirectory('templates'),
        'extensions/': this.createEmptyDirectory('extensions')
      },
      customDirectories: {},
      customFiles: {}
    };
    
    // Add workflow-specific structure
    switch (workflowType) {
      case 'code_shell':
        structure.directories['src/'] = this.createEmptyDirectory('src');
        structure.directories['docs/'] = this.createEmptyDirectory('docs');
        structure.directories['tests/'] = this.createEmptyDirectory('tests');
        structure.customFiles['package.json'] = this.createEmptyFile('package.json', 'json');
        break;
        
      case 'research_dossier':
        structure.directories['research/'] = this.createEmptyDirectory('research');
        structure.directories['sources/'] = this.createEmptyDirectory('sources');
        structure.directories['analysis/'] = this.createEmptyDirectory('analysis');
        break;
        
      case 'launch_plan':
        structure.directories['marketing/'] = this.createEmptyDirectory('marketing');
        structure.directories['content/'] = this.createEmptyDirectory('content');
        structure.directories['assets/'] = this.createEmptyDirectory('assets');
        break;
        
      case 'audit_pack':
        structure.directories['compliance/'] = this.createEmptyDirectory('compliance');
        structure.directories['reports/'] = this.createEmptyDirectory('reports');
        structure.directories['evidence/'] = this.createEmptyDirectory('evidence');
        break;
    }
    
    // Apply template structure if provided
    if (template) {
      // Merge template structure
      Object.assign(structure.customDirectories, template.templateStructure.customDirectories);
      Object.assign(structure.customFiles, template.templateStructure.customFiles);
    }
    
    return structure;
  }

  private async initializeCoreFiles(
    structure: RepositoryStructure,
    goal: string,
    workflowType: string
  ): Promise<void> {
    
    // Initialize goal.md
    structure.coreFiles['goal.md'].content = `# Workflow Goal\n\n${goal}\n\n## Success Criteria\n\n- [ ] Goal achieved\n- [ ] User satisfied\n- [ ] All artifacts generated\n`;
    structure.coreFiles['goal.md'].status = 'completed';
    
    // Initialize README.md
    structure.coreFiles['README.md'].content = `# ${this.generateDisplayName(goal)}\n\n${goal}\n\n## Workflow Type\n\n${workflowType}\n\n## Status\n\n🔄 In Progress\n\n## Generated Artifacts\n\n_Artifacts will appear here as they are generated..._\n`;
    structure.coreFiles['README.md'].status = 'completed';
    
    // Initialize governance.json
    structure.coreFiles['governance.json'].content = JSON.stringify({
      governance_enabled: true,
      compliance_required: true,
      approval_gates: [],
      risk_level: 'medium',
      audit_trail: true
    }, null, 2);
    structure.coreFiles['governance.json'].status = 'completed';
  }

  private createEmptyFile(name: string, type: RepositoryFile['type']): RepositoryFile {
    return {
      path: name,
      name,
      type,
      status: 'pending',
      size: 0,
      checksum: '',
      version: '1.0.0',
      generatedBy: 'system',
      dependencies: [],
      dependents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      userModified: false,
      userApproved: false,
      userComments: [],
      exportable: true,
      shareable: true,
      displayInBrowser: false
    };
  }

  private createEmptyDirectory(name: string): RepositoryDirectory {
    return {
      path: name,
      name,
      description: `${name} directory`,
      files: {},
      subdirectories: {},
      fileCount: 0,
      totalSize: 0,
      lastModified: new Date().toISOString(),
      collapsed: false,
      sortOrder: 'name',
      readOnly: false,
      userCanAdd: true,
      userCanDelete: true
    };
  }

  private generateRepositoryName(goal: string): string {
    return goal
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private generateDisplayName(goal: string): string {
    return goal.length > 60 ? goal.substring(0, 57) + '...' : goal;
  }

  private generateTags(goal: string, workflowType: string): string[] {
    const tags = [workflowType];
    
    // Add goal-based tags
    const goalLower = goal.toLowerCase();
    if (goalLower.includes('website') || goalLower.includes('landing')) tags.push('web');
    if (goalLower.includes('research') || goalLower.includes('analysis')) tags.push('research');
    if (goalLower.includes('content') || goalLower.includes('blog')) tags.push('content');
    if (goalLower.includes('marketing') || goalLower.includes('launch')) tags.push('marketing');
    if (goalLower.includes('audit') || goalLower.includes('compliance')) tags.push('compliance');
    
    return tags;
  }

  private categorizeRepository(goal: string, workflowType: string): string {
    const goalLower = goal.toLowerCase();
    
    if (goalLower.includes('website') || goalLower.includes('app')) return 'Development';
    if (goalLower.includes('research') || goalLower.includes('analysis')) return 'Research';
    if (goalLower.includes('content') || goalLower.includes('blog')) return 'Content';
    if (goalLower.includes('marketing') || goalLower.includes('launch')) return 'Marketing';
    if (goalLower.includes('audit') || goalLower.includes('compliance')) return 'Compliance';
    
    return 'General';
  }

  private getDefaultPermissions(): RepositoryPermissions {
    return {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: true,
      canExport: true,
      canExtend: true,
      canDeploy: true,
      canInviteCollaborators: true,
      canManagePermissions: false,
      canArchive: true,
      agentCanModify: true,
      agentCanExtend: true,
      agentCanDeploy: false,
      requiresApprovalFor: ['deploy', 'delete', 'share_public']
    };
  }

  private initializeAnalytics(): RepositoryAnalytics {
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      lastViewedAt: new Date().toISOString(),
      averageSessionDuration: 0,
      mostViewedFiles: {},
      mostModifiedFiles: {},
      fileDownloads: {},
      collaboratorActivity: {},
      commentsCount: 0,
      modificationsCount: 0,
      buildTime: 0,
      deploymentCount: 0,
      successfulDeployments: 0,
      userRatings: [],
      averageRating: 0,
      completionRate: 0,
      exportCount: 0,
      shareCount: 0,
      cloneCount: 0
    };
  }

  private determineFileType(filePath: string): RepositoryFile['type'] {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'md': return 'markdown';
      case 'yaml': case 'yml': return 'yaml';
      case 'json': return 'json';
      case 'html': case 'htm': return 'html';
      case 'css': return 'css';
      case 'js': case 'jsx': case 'ts': case 'tsx': return 'javascript';
      case 'py': return 'python';
      case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': return 'image';
      case 'pdf': case 'doc': case 'docx': return 'document';
      default: return 'other';
    }
  }

  private calculateChecksum(content: string): string {
    // Simple checksum calculation - in production, use proper hashing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private canDisplayInBrowser(filePath: string): boolean {
    const extension = filePath.split('.').pop()?.toLowerCase();
    return ['html', 'css', 'js', 'md', 'json', 'yaml', 'yml', 'txt'].includes(extension || '');
  }

  private addFileToStructure(structure: RepositoryStructure, file: RepositoryFile): void {
    const pathParts = file.path.split('/');
    
    if (pathParts.length === 1) {
      // Root level file
      structure.customFiles[file.path] = file;
    } else {
      // File in directory
      const dirPath = pathParts.slice(0, -1).join('/') + '/';
      const fileName = pathParts[pathParts.length - 1];
      
      // Find or create directory
      let directory = structure.directories[dirPath];
      if (!directory) {
        directory = structure.customDirectories[dirPath];
        if (!directory) {
          directory = this.createEmptyDirectory(dirPath);
          structure.customDirectories[dirPath] = directory;
        }
      }
      
      // Add file to directory
      directory.files[fileName] = file;
      directory.fileCount++;
      directory.totalSize += file.size;
      directory.lastModified = new Date().toISOString();
    }
  }

  private findFileInStructure(structure: RepositoryStructure, filePath: string): RepositoryFile | null {
    // Check core files
    if (structure.coreFiles[filePath]) {
      return structure.coreFiles[filePath];
    }
    
    // Check custom files
    if (structure.customFiles[filePath]) {
      return structure.customFiles[filePath];
    }
    
    // Check files in directories
    const pathParts = filePath.split('/');
    if (pathParts.length > 1) {
      const dirPath = pathParts.slice(0, -1).join('/') + '/';
      const fileName = pathParts[pathParts.length - 1];
      
      const directory = structure.directories[dirPath] || structure.customDirectories[dirPath];
      if (directory && directory.files[fileName]) {
        return directory.files[fileName];
      }
    }
    
    return null;
  }

  private hasRepositoryAccess(repository: WorkflowRepository, userId: string): boolean {
    // Check if user is owner or collaborator
    return repository.collaborators.some(c => c.userId === userId);
  }

  private applyRepositoryFilter(repositories: WorkflowRepository[], filter: RepositoryFilter): WorkflowRepository[] {
    return repositories.filter(repo => {
      // Status filter
      if (filter.status && !filter.status.includes(repo.status)) {
        return false;
      }
      
      // Workflow type filter
      if (filter.workflowType && !filter.workflowType.includes(repo.workflowType)) {
        return false;
      }
      
      // Tags filter
      if (filter.tags && !filter.tags.some(tag => repo.tags.includes(tag))) {
        return false;
      }
      
      // Date range filter
      if (filter.dateRange) {
        const createdAt = new Date(repo.createdAt);
        const start = new Date(filter.dateRange.start);
        const end = new Date(filter.dateRange.end);
        if (createdAt < start || createdAt > end) {
          return false;
        }
      }
      
      // Rating filter
      if (filter.minRating && (!repo.userRating || repo.userRating < filter.minRating)) {
        return false;
      }
      
      // Deployments filter
      if (filter.hasDeployments && repo.deployments.length === 0) {
        return false;
      }
      
      // Exports filter
      if (filter.hasExports && repo.exports.length === 0) {
        return false;
      }
      
      return true;
    });
  }

  private searchRepositories(repositories: WorkflowRepository[], query: string): WorkflowRepository[] {
    const queryLower = query.toLowerCase();
    
    return repositories.filter(repo => {
      // Search in name, description, goal
      if (repo.name.toLowerCase().includes(queryLower) ||
          repo.description.toLowerCase().includes(queryLower) ||
          repo.originalGoal.toLowerCase().includes(queryLower) ||
          repo.currentGoal.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Search in tags
      if (repo.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        return true;
      }
      
      // Search in file names
      const hasMatchingFile = Object.values(repo.structure.coreFiles)
        .concat(Object.values(repo.structure.customFiles))
        .some(file => file.name.toLowerCase().includes(queryLower));
      
      if (hasMatchingFile) {
        return true;
      }
      
      return false;
    });
  }

  private sortRepositories(
    repositories: WorkflowRepository[],
    sortBy: 'name' | 'date' | 'progress' | 'rating',
    sortOrder: 'asc' | 'desc'
  ): WorkflowRepository[] {
    
    return repositories.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'progress':
          comparison = a.progress.overallProgress - b.progress.overallProgress;
          break;
        case 'rating':
          comparison = (a.userRating || 0) - (b.userRating || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private generateExtensionName(extensionGoal: string): string {
    return extensionGoal.length > 30 ? extensionGoal.substring(0, 27) + '...' : extensionGoal;
  }

  private estimateExtensionDuration(extensionGoal: string, extensionType: RepositoryExtension['type']): number {
    // Simple estimation based on extension type and complexity
    const baseTime = {
      'feature_addition': 30,
      'enhancement': 20,
      'integration': 45,
      'optimization': 15,
      'customization': 25
    };
    
    const goalComplexity = extensionGoal.split(' ').length;
    const complexityMultiplier = Math.min(goalComplexity / 5, 2); // Max 2x multiplier
    
    return Math.round(baseTime[extensionType] * complexityMultiplier);
  }

  private assessExtensionRisk(repository: WorkflowRepository, extensionGoal: string): 'low' | 'medium' | 'high' {
    // Simple risk assessment
    const goalLower = extensionGoal.toLowerCase();
    
    // High risk indicators
    if (goalLower.includes('delete') || goalLower.includes('remove') || goalLower.includes('replace')) {
      return 'high';
    }
    
    // Medium risk indicators
    if (goalLower.includes('modify') || goalLower.includes('change') || goalLower.includes('update')) {
      return 'medium';
    }
    
    // Check repository complexity
    if (repository.progress.artifactsGenerated > 10 || repository.extensions.length > 2) {
      return 'medium';
    }
    
    return 'low';
  }

  private async saveRepository(repository: WorkflowRepository): Promise<void> {
    try {
      // Update in cache
      this.repositories.set(repository.id, repository);
      
      // Persist to backend
      await this.repositoryService.updateRepository(repository);
      
    } catch (error) {
      console.error(`❌ [Repository Manager] Failed to save repository ${repository.id}:`, error);
      throw error;
    }
  }

  private notifyRepositorySubscribers(repoId: string, repository: WorkflowRepository): void {
    const callbacks = this.repositorySubscriptions.get(repoId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(repository);
        } catch (error) {
          console.error('Error in repository subscription callback:', error);
        }
      });
    }
  }

  private startAutoSave(repoId: string): void {
    // Auto-save every 30 seconds
    const interval = setInterval(async () => {
      const repository = this.repositories.get(repoId);
      if (repository) {
        try {
          await this.repositoryService.updateRepository(repository);
        } catch (error) {
          console.error(`❌ [Repository Manager] Auto-save failed for ${repoId}:`, error);
        }
      } else {
        // Repository no longer exists, clear interval
        clearInterval(interval);
        this.autoSaveIntervals.delete(repoId);
      }
    }, 30000);
    
    this.autoSaveIntervals.set(repoId, interval);
  }

  private startAnalyticsTracking(repoId: string): void {
    // Update analytics every 5 minutes
    const interval = setInterval(async () => {
      const repository = this.repositories.get(repoId);
      if (repository) {
        // Update analytics metrics
        repository.analytics.averageSessionDuration = Math.random() * 30; // Placeholder
        repository.analytics.lastViewedAt = new Date().toISOString();
      } else {
        // Repository no longer exists, clear interval
        clearInterval(interval);
        this.analyticsUpdateIntervals.delete(repoId);
      }
    }, 300000);
    
    this.analyticsUpdateIntervals.set(repoId, interval);
  }

  private startBackgroundProcesses(): void {
    console.log('🔄 [Repository Manager] Starting background processes');
    
    // Cleanup old repositories every hour
    setInterval(() => {
      this.cleanupOldRepositories();
    }, 3600000);
    
    // Update analytics every 10 minutes
    setInterval(() => {
      this.updateGlobalAnalytics();
    }, 600000);
  }

  private cleanupOldRepositories(): void {
    // Remove repositories that haven't been accessed in 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (const [repoId, repository] of this.repositories.entries()) {
      if (new Date(repository.lastAccessedAt) < thirtyDaysAgo && repository.status === 'archived') {
        this.repositories.delete(repoId);
        
        // Clear intervals
        const autoSaveInterval = this.autoSaveIntervals.get(repoId);
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval);
          this.autoSaveIntervals.delete(repoId);
        }
        
        const analyticsInterval = this.analyticsUpdateIntervals.get(repoId);
        if (analyticsInterval) {
          clearInterval(analyticsInterval);
          this.analyticsUpdateIntervals.delete(repoId);
        }
        
        console.log(`🗑️ [Repository Manager] Cleaned up old repository: ${repoId}`);
      }
    }
  }

  private updateGlobalAnalytics(): void {
    // Update global analytics across all repositories
    console.log('📊 [Repository Manager] Updating global analytics');
  }

  private initializeDefaultTemplates(): void {
    console.log('📋 [Repository Manager] Initializing default templates');
    
    // Code Shell Template
    const codeShellTemplate: RepositoryTemplate = {
      id: 'code_shell',
      name: 'Code Shell',
      description: 'Template for software development projects',
      category: 'Development',
      templateStructure: this.createEmptyRepositoryStructure(),
      defaultGoal: 'Build a web application',
      suggestedPhases: ['Requirements', 'Design', 'Implementation', 'Testing', 'Deployment'],
      usageCount: 0,
      successRate: 0.85,
      averageCompletionTime: 120,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      customizable: true,
      requiredInputs: [
        { name: 'project_name', type: 'text', description: 'Name of the project', required: true },
        { name: 'technology_stack', type: 'select', description: 'Technology stack', required: true, options: ['React', 'Vue', 'Angular', 'Vanilla'] }
      ],
      optionalInputs: [
        { name: 'include_tests', type: 'boolean', description: 'Include test files', required: false, defaultValue: true }
      ]
    };
    
    this.templates.set('code_shell', codeShellTemplate);
    
    // Research Dossier Template
    const researchTemplate: RepositoryTemplate = {
      id: 'research_dossier',
      name: 'Research Dossier',
      description: 'Template for research and analysis projects',
      category: 'Research',
      templateStructure: this.createEmptyRepositoryStructure(),
      defaultGoal: 'Conduct comprehensive research on a topic',
      suggestedPhases: ['Topic Definition', 'Source Gathering', 'Analysis', 'Synthesis', 'Documentation'],
      usageCount: 0,
      successRate: 0.90,
      averageCompletionTime: 90,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      customizable: true,
      requiredInputs: [
        { name: 'research_topic', type: 'text', description: 'Main research topic', required: true },
        { name: 'research_depth', type: 'select', description: 'Depth of research', required: true, options: ['Surface', 'Moderate', 'Deep'] }
      ],
      optionalInputs: [
        { name: 'include_citations', type: 'boolean', description: 'Include academic citations', required: false, defaultValue: true }
      ]
    };
    
    this.templates.set('research_dossier', researchTemplate);
    
    console.log('✅ [Repository Manager] Default templates initialized');
  }

  private createEmptyRepositoryStructure(): RepositoryStructure {
    return {
      coreFiles: {
        'goal.md': this.createEmptyFile('goal.md', 'markdown'),
        'plan.yaml': this.createEmptyFile('plan.yaml', 'yaml'),
        'README.md': this.createEmptyFile('README.md', 'markdown'),
        'governance.json': this.createEmptyFile('governance.json', 'json')
      },
      directories: {
        'artifacts/': this.createEmptyDirectory('artifacts'),
        'receipts/': this.createEmptyDirectory('receipts'),
        'checklists/': this.createEmptyDirectory('checklists'),
        'integration/': this.createEmptyDirectory('integration'),
        'collaboration/': this.createEmptyDirectory('collaboration'),
        'versions/': this.createEmptyDirectory('versions'),
        'templates/': this.createEmptyDirectory('templates'),
        'extensions/': this.createEmptyDirectory('extensions')
      },
      customDirectories: {},
      customFiles: {}
    };
  }
}

// Export singleton instance
export const workflowRepositoryManager = WorkflowRepositoryManager.getInstance();

