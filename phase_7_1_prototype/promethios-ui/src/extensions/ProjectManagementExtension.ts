/**
 * Project Management Extension for Promethios
 * 
 * Follows the established extension pattern to provide comprehensive project management
 * capabilities for the autonomous MAS builder system. Integrates with the Project
 * Persistence Service to provide UI and management features for complex development projects.
 * 
 * This extension enables users to create, manage, collaborate on, and deploy projects
 * built by autonomous agents with full governance and audit support.
 */

import { Extension } from './Extension';
import { ExtensionRegistry } from '../core/governance/extension_point_framework';
import { SharedGovernedInsightsQAService } from '../shared/governance/core/SharedGovernedInsightsQAService';
import { ModernChatGovernedInsightsQAService } from '../services/ModernChatGovernedInsightsQAService';
import { enhancedAuditLoggingService } from '../services/EnhancedAuditLoggingService';
import { 
  InMemoryProjectPersistenceService, 
  ProjectPersistenceService,
  Project,
  ProjectSummary,
  ProjectFilters,
  Template,
  TemplateSummary,
  TemplateFilters,
  TemplateCustomization,
  ProjectAnalytics,
  ProjectAuditEntry,
  AuditFilters,
  ProjectCollaborator,
  CollaboratorRole,
  ProjectVersion,
  ProjectFile,
  BuildRecord,
  DeploymentRecord
} from '../services/persistence/ProjectPersistenceService';

export interface ProjectManagementConfig {
  enableGovernanceIntegration: boolean;
  enableQAInsights: boolean;
  enableRealTimeCollaboration: boolean;
  enableAdvancedAnalytics: boolean;
  enableTemplateSharing: boolean;
  enableAutomaticBackups: boolean;
  maxProjectsPerUser: number;
  maxCollaboratorsPerProject: number;
  defaultProjectVisibility: 'private' | 'team' | 'public';
  autoSaveInterval: number; // milliseconds
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  description: string;
  projects: ProjectSummary[];
  collaborators: WorkspaceCollaborator[];
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceCollaborator {
  userId: string;
  username: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface WorkspaceSettings {
  defaultProjectSettings: ProjectDefaults;
  collaborationSettings: CollaborationSettings;
  governanceSettings: GovernanceSettings;
  integrationSettings: IntegrationSettings;
}

export interface ProjectDefaults {
  visibility: 'private' | 'team' | 'public';
  enableVersioning: boolean;
  enableAutomaticTesting: boolean;
  enableContinuousDeployment: boolean;
  defaultAgents: string[];
  qualityGates: string[];
}

export interface CollaborationSettings {
  allowExternalCollaborators: boolean;
  requireApprovalForChanges: boolean;
  enableRealTimeEditing: boolean;
  enableComments: boolean;
  enableNotifications: boolean;
}

export interface GovernanceSettings {
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
  complianceFrameworks: string[];
  qualityStandards: string[];
  securityPolicies: string[];
  dataGovernancePolicies: string[];
}

export interface IntegrationSettings {
  enabledIntegrations: Integration[];
  webhookEndpoints: WebhookEndpoint[];
  apiKeys: ApiKeyConfig[];
}

export interface Integration {
  type: 'github' | 'gitlab' | 'bitbucket' | 'jira' | 'slack' | 'teams' | 'discord' | 'custom';
  name: string;
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface WebhookEndpoint {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
}

export interface ApiKeyConfig {
  name: string;
  service: string;
  keyId: string;
  permissions: string[];
  expiresAt?: Date;
}

export interface ProjectCreationWizard {
  steps: WizardStep[];
  currentStep: number;
  data: ProjectCreationData;
  validation: ValidationResult[];
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
  completed: boolean;
  validation: StepValidation;
}

export interface StepValidation {
  rules: ValidationRule[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'pattern' | 'length' | 'custom';
  value: any;
  message: string;
}

export interface ProjectCreationData {
  basicInfo: ProjectBasicInfo;
  projectType: ProjectTypeSelection;
  configuration: ProjectConfigurationData;
  agents: AgentSelection;
  collaboration: CollaborationSetup;
  governance: GovernanceSetup;
  deployment: DeploymentSetup;
}

export interface ProjectBasicInfo {
  name: string;
  description: string;
  category: string;
  tags: string[];
  visibility: 'private' | 'team' | 'public';
  workspace?: string;
}

export interface ProjectTypeSelection {
  type: 'web_application' | 'mobile_app' | 'api_service' | 'desktop_app' | 'library' | 'documentation' | 'custom';
  framework: string;
  language: string;
  platform: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  template?: string;
}

export interface ProjectConfigurationData {
  buildSystem: string;
  testingFramework: string[];
  qualityTools: string[];
  securityTools: string[];
  deploymentTargets: string[];
  environmentVariables: Record<string, string>;
}

export interface AgentSelection {
  enabledAgents: SelectedAgent[];
  orchestrationMode: 'centralized' | 'distributed' | 'hybrid';
  coordinationSettings: AgentCoordinationSettings;
}

export interface SelectedAgent {
  agentId: string;
  agentType: 'frontend' | 'backend' | 'testing' | 'design' | 'devops' | 'qa' | 'orchestrator';
  configuration: Record<string, any>;
  permissions: AgentPermissionSet;
}

export interface AgentPermissionSet {
  fileOperations: FilePermissions;
  networkAccess: NetworkPermissions;
  systemAccess: SystemPermissions;
  collaborationAccess: CollaborationPermissions;
}

export interface FilePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  restrictedPaths: string[];
  allowedExtensions: string[];
}

export interface NetworkPermissions {
  canAccessInternet: boolean;
  canMakeApiCalls: boolean;
  allowedDomains: string[];
  blockedDomains: string[];
  rateLimits: RateLimit[];
}

export interface RateLimit {
  type: 'requests_per_minute' | 'requests_per_hour' | 'data_per_minute';
  limit: number;
  scope: 'global' | 'per_domain' | 'per_endpoint';
}

export interface SystemPermissions {
  canExecuteCommands: boolean;
  canInstallPackages: boolean;
  canModifyConfiguration: boolean;
  allowedCommands: string[];
  blockedCommands: string[];
}

export interface CollaborationPermissions {
  canInviteCollaborators: boolean;
  canModifyPermissions: boolean;
  canAccessAuditLogs: boolean;
  canManageVersions: boolean;
}

export interface AgentCoordinationSettings {
  communicationProtocol: 'direct' | 'message_queue' | 'event_driven';
  conflictResolution: 'first_wins' | 'last_wins' | 'merge' | 'manual';
  workloadDistribution: 'round_robin' | 'capability_based' | 'load_balanced';
  synchronizationMode: 'real_time' | 'batch' | 'on_demand';
}

export interface CollaborationSetup {
  initialCollaborators: InitialCollaborator[];
  permissions: ProjectPermissionSettings;
  communicationSettings: CommunicationSettings;
}

export interface InitialCollaborator {
  email: string;
  role: 'admin' | 'developer' | 'tester' | 'viewer';
  permissions: CollaboratorPermissionSet;
  inviteMessage?: string;
}

export interface CollaboratorPermissionSet {
  projectAccess: ProjectAccessPermissions;
  agentAccess: AgentAccessPermissions;
  governanceAccess: GovernanceAccessPermissions;
}

export interface ProjectAccessPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canDeploy: boolean;
  canManageSettings: boolean;
  restrictedAreas: string[];
}

export interface AgentAccessPermissions {
  canViewAgents: boolean;
  canConfigureAgents: boolean;
  canStartStopAgents: boolean;
  canViewAgentLogs: boolean;
  canManageAgentPermissions: boolean;
}

export interface GovernanceAccessPermissions {
  canViewAuditLogs: boolean;
  canViewAnalytics: boolean;
  canManageCompliance: boolean;
  canManageQualityGates: boolean;
  canApproveChanges: boolean;
}

export interface ProjectPermissionSettings {
  defaultRole: string;
  requireApprovalForChanges: boolean;
  allowExternalCollaborators: boolean;
  enableGuestAccess: boolean;
  sessionTimeout: number; // minutes
}

export interface CommunicationSettings {
  enableComments: boolean;
  enableNotifications: boolean;
  enableRealTimeChat: boolean;
  notificationChannels: NotificationChannel[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'teams' | 'webhook';
  configuration: Record<string, any>;
  events: NotificationEvent[];
  enabled: boolean;
}

export interface NotificationEvent {
  event: string;
  description: string;
  enabled: boolean;
  recipients: string[];
}

export interface GovernanceSetup {
  complianceFrameworks: ComplianceFrameworkSelection[];
  qualityStandards: QualityStandardSelection[];
  securityPolicies: SecurityPolicySelection[];
  auditSettings: AuditSettings;
}

export interface ComplianceFrameworkSelection {
  framework: string;
  version: string;
  requirements: string[];
  enabled: boolean;
}

export interface QualityStandardSelection {
  standard: string;
  level: string;
  thresholds: QualityThreshold[];
  enabled: boolean;
}

export interface QualityThreshold {
  metric: string;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  severity: 'info' | 'warning' | 'error';
}

export interface SecurityPolicySelection {
  policy: string;
  rules: SecurityRuleSelection[];
  enforcement: 'advisory' | 'warning' | 'blocking';
  enabled: boolean;
}

export interface SecurityRuleSelection {
  rule: string;
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface AuditSettings {
  level: 'minimal' | 'standard' | 'comprehensive';
  retention: number; // days
  encryption: boolean;
  realTimeMonitoring: boolean;
  alertThresholds: AlertThreshold[];
}

export interface AlertThreshold {
  metric: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'notify' | 'block';
}

export interface DeploymentSetup {
  targets: DeploymentTargetSetup[];
  pipeline: PipelineSetup;
  monitoring: MonitoringSetup;
}

export interface DeploymentTargetSetup {
  name: string;
  type: 'static' | 'serverless' | 'container' | 'vm' | 'kubernetes';
  provider: 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'custom';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface PipelineSetup {
  stages: PipelineStageSetup[];
  triggers: PipelineTriggerSetup[];
  notifications: PipelineNotificationSetup[];
}

export interface PipelineStageSetup {
  name: string;
  type: 'build' | 'test' | 'security_scan' | 'deploy' | 'smoke_test' | 'custom';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface PipelineTriggerSetup {
  type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'webhook';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface PipelineNotificationSetup {
  type: 'email' | 'slack' | 'teams' | 'webhook';
  recipients: string[];
  events: string[];
  enabled: boolean;
}

export interface MonitoringSetup {
  metrics: MetricSetup[];
  alerts: AlertSetup[];
  dashboards: DashboardSetup[];
}

export interface MetricSetup {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface AlertSetup {
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  notifications: string[];
  enabled: boolean;
}

export interface DashboardSetup {
  name: string;
  widgets: DashboardWidgetSetup[];
  refreshInterval: number;
  enabled: boolean;
}

export interface DashboardWidgetSetup {
  type: 'metric' | 'chart' | 'table' | 'text';
  title: string;
  configuration: Record<string, any>;
  position: WidgetPosition;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValidationResult {
  step: string;
  field: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ProjectDashboard {
  projectId: string;
  overview: DashboardOverview;
  recentActivity: ActivityItem[];
  quickActions: QuickAction[];
  notifications: DashboardNotification[];
  widgets: DashboardWidget[];
}

export interface DashboardOverview {
  status: ProjectStatus;
  progress: ProgressMetrics;
  health: HealthMetrics;
  team: TeamMetrics;
}

export interface ProjectStatus {
  phase: string;
  lastUpdate: Date;
  nextMilestone: string;
  blockers: string[];
}

export interface ProgressMetrics {
  overall: number; // 0-100
  development: number;
  testing: number;
  deployment: number;
  documentation: number;
}

export interface HealthMetrics {
  buildStatus: 'success' | 'failed' | 'in_progress' | 'not_started';
  testCoverage: number;
  codeQuality: number;
  securityScore: number;
  performanceScore: number;
}

export interface TeamMetrics {
  activeCollaborators: number;
  totalContributions: number;
  averageResponseTime: number; // hours
  collaborationScore: number;
}

export interface ActivityItem {
  id: string;
  type: 'file_change' | 'deployment' | 'collaboration' | 'agent_action' | 'governance';
  actor: string;
  actorType: 'user' | 'agent' | 'system';
  description: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  enabled: boolean;
  permissions: string[];
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  style: 'primary' | 'secondary' | 'danger';
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'list' | 'table' | 'custom';
  title: string;
  data: any;
  configuration: Record<string, any>;
  position: WidgetPosition;
  refreshInterval?: number;
}

/**
 * Project Management Extension Class
 * 
 * Provides comprehensive project management capabilities for the autonomous MAS builder system.
 * Integrates with the Project Persistence Service to provide UI and management features
 * with full governance support.
 */
export class ProjectManagementExtension extends Extension {
  private config: ProjectManagementConfig;
  private persistenceService: ProjectPersistenceService;
  private workspaces: Map<string, ProjectWorkspace>;
  private activeProjects: Map<string, Project>;
  private projectDashboards: Map<string, ProjectDashboard>;
  
  // Governance integration
  private sharedQAService: SharedGovernedInsightsQAService;
  private modernChatQAService: ModernChatGovernedInsightsQAService;
  
  // Auto-save functionality
  private autoSaveIntervals: Map<string, NodeJS.Timeout>;
  
  constructor(config: Partial<ProjectManagementConfig> = {}) {
    super('ProjectManagementExtension', '1.0.0');
    
    this.config = {
      enableGovernanceIntegration: true,
      enableQAInsights: true,
      enableRealTimeCollaboration: true,
      enableAdvancedAnalytics: true,
      enableTemplateSharing: true,
      enableAutomaticBackups: true,
      maxProjectsPerUser: 100,
      maxCollaboratorsPerProject: 50,
      defaultProjectVisibility: 'private',
      autoSaveInterval: 30000, // 30 seconds
      ...config
    };
    
    this.persistenceService = new InMemoryProjectPersistenceService();
    this.workspaces = new Map();
    this.activeProjects = new Map();
    this.projectDashboards = new Map();
    this.autoSaveIntervals = new Map();
    
    // Initialize governance services
    this.sharedQAService = new SharedGovernedInsightsQAService();
    this.modernChatQAService = new ModernChatGovernedInsightsQAService();
  }

  /**
   * Initialize the Project Management Extension
   */
  async initialize(): Promise<boolean> {
    try {
      // Register with extension registry
      ExtensionRegistry.register(this);
      
      // Set up governance integration
      if (this.config.enableGovernanceIntegration) {
        await this.setupGovernanceIntegration();
      }
      
      // Initialize default workspace
      await this.createDefaultWorkspace();
      
      console.log('Project Management Extension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Project Management Extension:', error);
      return false;
    }
  }

  /**
   * Set up governance integration with Q&A insights
   */
  private async setupGovernanceIntegration(): Promise<void> {
    const projectManagementQuestions = [
      "How did you ensure proper project structure and organization for autonomous development?",
      "What governance measures were implemented for project collaboration and access control?",
      "How were quality standards and compliance requirements integrated into the project setup?",
      "What risk assessment and mitigation strategies were applied to the project configuration?",
      "How were agent permissions and coordination settings validated for security and efficiency?",
      "What audit and monitoring capabilities were established for project governance?",
      "How were deployment and infrastructure configurations validated for reliability?",
      "What data governance and privacy measures were implemented in the project setup?",
      "How were version control and change management processes configured for governance?",
      "What documentation and knowledge management practices were established for the project?"
    ];

    // Register governance questions with Q&A services
    await this.sharedQAService.registerDomainQuestions('project_management', projectManagementQuestions);
    await this.modernChatQAService.registerDomainQuestions('project_management', projectManagementQuestions);
  }

  /**
   * Create default workspace
   */
  private async createDefaultWorkspace(): Promise<void> {
    const defaultWorkspace: ProjectWorkspace = {
      id: 'default_workspace',
      name: 'Default Workspace',
      description: 'Default workspace for autonomous MAS projects',
      projects: [],
      collaborators: [],
      settings: {
        defaultProjectSettings: {
          visibility: this.config.defaultProjectVisibility,
          enableVersioning: true,
          enableAutomaticTesting: true,
          enableContinuousDeployment: false,
          defaultAgents: ['orchestrator', 'frontend', 'backend'],
          qualityGates: ['code_coverage', 'security_scan', 'performance_test']
        },
        collaborationSettings: {
          allowExternalCollaborators: false,
          requireApprovalForChanges: false,
          enableRealTimeEditing: true,
          enableComments: true,
          enableNotifications: true
        },
        governanceSettings: {
          auditLevel: 'standard',
          complianceFrameworks: [],
          qualityStandards: ['iso_25010'],
          securityPolicies: ['owasp_top_10'],
          dataGovernancePolicies: ['gdpr_basic']
        },
        integrationSettings: {
          enabledIntegrations: [],
          webhookEndpoints: [],
          apiKeys: []
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workspaces.set(defaultWorkspace.id, defaultWorkspace);
  }

  /**
   * Create a new project using the creation wizard
   */
  async createProjectWithWizard(wizardData: ProjectCreationData): Promise<Project> {
    // Validate wizard data
    const validationResults = await this.validateProjectCreationData(wizardData);
    const hasErrors = validationResults.some(result => !result.isValid);
    
    if (hasErrors) {
      throw new Error(`Project creation validation failed: ${validationResults.filter(r => !r.isValid).map(r => r.errors.join(', ')).join('; ')}`);
    }

    // Convert wizard data to project data
    const projectData = await this.convertWizardDataToProject(wizardData);
    
    // Create project using persistence service
    const project = await this.persistenceService.createProject(projectData);
    
    // Set up project dashboard
    await this.createProjectDashboard(project);
    
    // Set up auto-save if enabled
    if (this.config.enableAutomaticBackups) {
      this.setupAutoSave(project.id);
    }
    
    // Add to active projects
    this.activeProjects.set(project.id, project);
    
    // Generate governance Q&A
    if (this.config.enableQAInsights) {
      await this.generateProjectCreationQA(project, wizardData);
    }
    
    // Log project creation
    await enhancedAuditLoggingService.logInteraction({
      type: 'project_created_with_wizard',
      agentId: 'project_management_extension',
      userId: project.createdBy,
      content: `Created project with wizard: ${project.name}`,
      metadata: {
        projectId: project.id,
        wizardData: {
          projectType: wizardData.projectType.type,
          complexity: wizardData.projectType.complexity,
          agentsEnabled: wizardData.agents.enabledAgents.length,
          collaborators: wizardData.collaboration.initialCollaborators.length
        }
      },
      timestamp: new Date(),
      governanceContext: {
        policyCompliance: true,
        trustLevel: 0.9,
        qualityScore: 0.85
      }
    });
    
    return project;
  }

  /**
   * Validate project creation data
   */
  private async validateProjectCreationData(data: ProjectCreationData): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate basic info
    if (!data.basicInfo.name || data.basicInfo.name.trim().length === 0) {
      results.push({
        step: 'basic_info',
        field: 'name',
        isValid: false,
        errors: ['Project name is required'],
        warnings: [],
        suggestions: ['Choose a descriptive name for your project']
      });
    }

    if (!data.basicInfo.description || data.basicInfo.description.trim().length < 10) {
      results.push({
        step: 'basic_info',
        field: 'description',
        isValid: false,
        errors: ['Project description must be at least 10 characters'],
        warnings: [],
        suggestions: ['Provide a clear description of what your project does']
      });
    }

    // Validate project type
    if (!data.projectType.type) {
      results.push({
        step: 'project_type',
        field: 'type',
        isValid: false,
        errors: ['Project type is required'],
        warnings: [],
        suggestions: ['Select the type of application you want to build']
      });
    }

    if (!data.projectType.framework) {
      results.push({
        step: 'project_type',
        field: 'framework',
        isValid: false,
        errors: ['Framework selection is required'],
        warnings: [],
        suggestions: ['Choose a framework that matches your project requirements']
      });
    }

    // Validate agents
    if (data.agents.enabledAgents.length === 0) {
      results.push({
        step: 'agents',
        field: 'enabledAgents',
        isValid: false,
        errors: ['At least one agent must be enabled'],
        warnings: [],
        suggestions: ['Enable the Orchestrator agent at minimum for project coordination']
      });
    }

    // Check for orchestrator agent
    const hasOrchestrator = data.agents.enabledAgents.some(agent => agent.agentType === 'orchestrator');
    if (!hasOrchestrator) {
      results.push({
        step: 'agents',
        field: 'enabledAgents',
        isValid: false,
        errors: ['Orchestrator agent is required for project coordination'],
        warnings: [],
        suggestions: ['Enable the Orchestrator agent to coordinate other agents']
      });
    }

    // Validate collaboration setup
    if (data.collaboration.initialCollaborators.length > this.config.maxCollaboratorsPerProject) {
      results.push({
        step: 'collaboration',
        field: 'initialCollaborators',
        isValid: false,
        errors: [`Maximum ${this.config.maxCollaboratorsPerProject} collaborators allowed`],
        warnings: [],
        suggestions: ['Reduce the number of initial collaborators or upgrade your plan']
      });
    }

    // Validate email addresses
    for (const collaborator of data.collaboration.initialCollaborators) {
      if (!this.isValidEmail(collaborator.email)) {
        results.push({
          step: 'collaboration',
          field: 'initialCollaborators',
          isValid: false,
          errors: [`Invalid email address: ${collaborator.email}`],
          warnings: [],
          suggestions: ['Provide valid email addresses for all collaborators']
        });
      }
    }

    // Add valid results for successful validations
    if (results.filter(r => r.step === 'basic_info').every(r => r.isValid !== false)) {
      results.push({
        step: 'basic_info',
        field: 'all',
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });
    }

    return results;
  }

  /**
   * Convert wizard data to project data
   */
  private async convertWizardDataToProject(wizardData: ProjectCreationData): Promise<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>> {
    const now = new Date();
    
    return {
      name: wizardData.basicInfo.name,
      description: wizardData.basicInfo.description,
      type: {
        type: wizardData.projectType.type,
        framework: wizardData.projectType.framework,
        language: wizardData.projectType.language,
        platform: wizardData.projectType.platform,
        complexity: wizardData.projectType.complexity
      },
      status: {
        phase: 'planning',
        progress: 0,
        health: 'healthy',
        lastBuildStatus: 'not_started',
        lastTestStatus: 'not_run',
        deploymentStatus: 'not_deployed'
      },
      createdBy: 'current_user', // In real implementation, get from context
      fileStructure: {
        rootPath: `/projects/${wizardData.basicInfo.name.toLowerCase().replace(/\s+/g, '-')}`,
        files: [],
        directories: [],
        totalFiles: 0,
        totalSize: 0,
        lastScan: now
      },
      dependencies: [],
      configuration: this.createProjectConfiguration(wizardData),
      buildConfiguration: this.createBuildConfiguration(wizardData),
      deploymentHistory: [],
      collaborators: await this.createInitialCollaborators(wizardData.collaboration.initialCollaborators),
      permissions: this.createProjectPermissions(wizardData.collaboration.permissions),
      currentVersion: '1.0.0',
      versionHistory: [],
      governanceProfile: this.createGovernanceProfile(wizardData.governance),
      auditTrail: [],
      isTemplate: false,
      analytics: this.createInitialAnalytics(),
      tags: wizardData.basicInfo.tags,
      category: wizardData.basicInfo.category,
      visibility: wizardData.basicInfo.visibility
    };
  }

  /**
   * Create project configuration from wizard data
   */
  private createProjectConfiguration(wizardData: ProjectCreationData): any {
    return {
      buildSystem: {
        type: wizardData.configuration.buildSystem,
        configFile: this.getBuildConfigFile(wizardData.configuration.buildSystem),
        outputDirectory: 'dist',
        sourceDirectory: 'src',
        entryPoints: this.getDefaultEntryPoints(wizardData.projectType.type),
        optimization: {
          minification: true,
          treeshaking: true,
          codesplitting: true,
          bundleAnalysis: false,
          compressionLevel: 'basic'
        }
      },
      environment: {
        environments: [
          {
            name: 'development',
            type: 'development',
            apiEndpoints: {},
            features: []
          },
          {
            name: 'production',
            type: 'production',
            apiEndpoints: {},
            features: []
          }
        ],
        currentEnvironment: 'development',
        environmentVariables: wizardData.configuration.environmentVariables
      },
      testing: {
        frameworks: wizardData.configuration.testingFramework.map(framework => ({
          name: framework,
          version: 'latest',
          configFile: this.getTestConfigFile(framework),
          testPattern: '**/*.test.*',
          setupFiles: []
        })),
        coverageThreshold: 80,
        testDirectories: ['src/__tests__', 'tests'],
        excludePatterns: ['node_modules', 'dist'],
        parallelExecution: true,
        maxWorkers: 4,
        timeout: 30000,
        retryFailedTests: true,
        generateReports: true
      },
      deployment: this.createDeploymentConfig(wizardData.deployment),
      quality: this.createQualityConfig(wizardData.configuration.qualityTools),
      agents: this.createAgentConfig(wizardData.agents)
    };
  }

  /**
   * Create build configuration from wizard data
   */
  private createBuildConfiguration(wizardData: ProjectCreationData): any {
    return {
      buildSystem: wizardData.configuration.buildSystem,
      buildCommands: this.getDefaultBuildCommands(wizardData.projectType.type, wizardData.configuration.buildSystem),
      artifacts: this.getDefaultArtifacts(wizardData.projectType.type),
      optimization: {
        incrementalBuild: true,
        parallelCompilation: true,
        optimizationLevel: 'basic',
        targetPlatforms: wizardData.projectType.platform
      },
      caching: {
        enabled: true,
        type: 'local',
        configuration: {},
        invalidationRules: []
      },
      parallelization: {
        enabled: true,
        maxWorkers: 4,
        strategy: 'module_based',
        loadBalancing: true
      }
    };
  }

  /**
   * Create initial collaborators
   */
  private async createInitialCollaborators(initialCollaborators: InitialCollaborator[]): Promise<ProjectCollaborator[]> {
    return initialCollaborators.map(collaborator => ({
      userId: this.generateUserId(collaborator.email),
      username: collaborator.email.split('@')[0],
      email: collaborator.email,
      role: {
        name: collaborator.role,
        description: this.getRoleDescription(collaborator.role)
      },
      permissions: this.convertToCollaboratorPermissions(collaborator.permissions),
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      invitedBy: 'current_user',
      status: 'pending'
    }));
  }

  /**
   * Create project permissions
   */
  private createProjectPermissions(permissionSettings: ProjectPermissionSettings): any {
    return {
      defaultRole: permissionSettings.defaultRole,
      publicAccess: false,
      requireApproval: permissionSettings.requireApprovalForChanges,
      allowForks: false,
      allowTemplateCreation: true,
      customRoles: []
    };
  }

  /**
   * Create governance profile
   */
  private createGovernanceProfile(governanceSetup: GovernanceSetup): any {
    return {
      complianceFrameworks: governanceSetup.complianceFrameworks.map(framework => ({
        name: framework.framework,
        version: framework.version,
        requirements: framework.requirements.map(req => ({
          id: req,
          description: req,
          category: 'general',
          mandatory: true,
          validationCriteria: [],
          evidence: []
        })),
        validationMethods: ['automated_testing', 'manual_review'],
        auditFrequency: 'monthly'
      })),
      auditRequirements: [{
        type: 'code_changes',
        level: governanceSetup.auditSettings.level,
        retention: governanceSetup.auditSettings.retention,
        encryption: governanceSetup.auditSettings.encryption,
        accessControl: ['admin', 'auditor']
      }],
      qualityStandards: governanceSetup.qualityStandards.map(standard => ({
        name: standard.standard,
        category: 'code_quality',
        requirements: [],
        thresholds: standard.thresholds,
        validationMethods: ['automated_analysis']
      })),
      securityPolicies: governanceSetup.securityPolicies.map(policy => ({
        name: policy.policy,
        type: 'application_security',
        rules: policy.rules.map(rule => ({
          id: rule.rule,
          description: rule.rule,
          condition: 'always',
          action: 'log',
          severity: 'medium'
        })),
        enforcement: policy.enforcement,
        exceptions: []
      })),
      dataGovernance: {
        dataClassification: [],
        retentionPolicies: [],
        accessControls: [],
        privacyControls: []
      }
    };
  }

  /**
   * Create initial analytics
   */
  private createInitialAnalytics(): any {
    return {
      overview: {
        totalFiles: 0,
        totalLines: 0,
        totalCommits: 0,
        totalBuilds: 0,
        totalDeployments: 0,
        activeCollaborators: 0,
        lastActivity: new Date(),
        projectAge: 0
      },
      development: {
        codeVelocity: {
          linesPerDay: 0,
          filesPerDay: 0,
          commitsPerDay: 0,
          velocity7Day: 0,
          velocity30Day: 0,
          velocityTrend: 'stable'
        },
        fileActivity: [],
        languageDistribution: [],
        agentContributions: [],
        developmentTrends: []
      },
      quality: {
        overallQuality: 0,
        qualityTrends: [],
        codeSmells: {
          totalSmells: 0,
          smellsByType: {},
          smellsBySeverity: {},
          smellTrends: [],
          topFiles: []
        },
        testCoverage: {
          overallCoverage: 0,
          coverageByFile: [],
          coverageByType: [],
          coverageTrends: [],
          uncoveredAreas: []
        },
        securityMetrics: {
          securityScore: 0,
          vulnerabilities: {
            total: 0,
            bySeverity: {},
            byType: {},
            resolved: 0,
            pending: 0,
            falsePositives: 0
          },
          securityTrends: [],
          complianceStatus: []
        },
        technicalDebt: {
          totalDebt: 0,
          debtRatio: 0,
          debtByCategory: {},
          debtTrends: [],
          topDebtFiles: []
        }
      },
      performance: {
        buildPerformance: {
          averageBuildTime: 0,
          buildSuccessRate: 0,
          buildTrends: [],
          slowestStages: [],
          cacheHitRate: 0
        },
        deploymentPerformance: {
          responseTime: 0,
          throughput: 0,
          errorRate: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0
        },
        applicationPerformance: {
          responseTime: 0,
          throughput: 0,
          errorRate: 0,
          availability: 0,
          coreWebVitals: {
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0,
            firstContentfulPaint: 0,
            timeToInteractive: 0
          }
        },
        performanceTrends: []
      },
      collaboration: {
        activeCollaborators: 0,
        collaborationPatterns: [],
        communicationMetrics: {
          totalMessages: 0,
          averageResponseTime: 0,
          collaborationEvents: 0,
          meetingFrequency: 0,
          documentationUpdates: 0
        },
        workDistribution: [],
        teamEfficiency: {
          overallEfficiency: 0,
          velocityConsistency: 0,
          qualityConsistency: 0,
          collaborationEffectiveness: 0,
          knowledgeSharing: 0
        }
      },
      deployment: {
        deploymentFrequency: 0,
        deploymentSuccessRate: 0,
        meanTimeToDeployment: 0,
        meanTimeToRecovery: 0,
        changeFailureRate: 0,
        deploymentTrends: []
      }
    };
  }

  /**
   * Create project dashboard
   */
  private async createProjectDashboard(project: Project): Promise<void> {
    const dashboard: ProjectDashboard = {
      projectId: project.id,
      overview: {
        status: {
          phase: project.status.phase,
          lastUpdate: project.updatedAt,
          nextMilestone: 'Initial Setup Complete',
          blockers: []
        },
        progress: {
          overall: 5, // Just created
          development: 0,
          testing: 0,
          deployment: 0,
          documentation: 0
        },
        health: {
          buildStatus: project.status.lastBuildStatus,
          testCoverage: 0,
          codeQuality: 0,
          securityScore: 0,
          performanceScore: 0
        },
        team: {
          activeCollaborators: project.collaborators.length,
          totalContributions: 0,
          averageResponseTime: 0,
          collaborationScore: 0
        }
      },
      recentActivity: [{
        id: 'initial_creation',
        type: 'collaboration',
        actor: project.createdBy,
        actorType: 'user',
        description: `Created project: ${project.name}`,
        timestamp: project.createdAt,
        metadata: {}
      }],
      quickActions: this.getDefaultQuickActions(project),
      notifications: [],
      widgets: this.getDefaultDashboardWidgets(project)
    };

    this.projectDashboards.set(project.id, dashboard);
  }

  /**
   * Set up auto-save for a project
   */
  private setupAutoSave(projectId: string): void {
    if (this.autoSaveIntervals.has(projectId)) {
      clearInterval(this.autoSaveIntervals.get(projectId)!);
    }

    const interval = setInterval(async () => {
      try {
        await this.autoSaveProject(projectId);
      } catch (error) {
        console.error(`Auto-save failed for project ${projectId}:`, error);
      }
    }, this.config.autoSaveInterval);

    this.autoSaveIntervals.set(projectId, interval);
  }

  /**
   * Auto-save project data
   */
  private async autoSaveProject(projectId: string): Promise<void> {
    const project = this.activeProjects.get(projectId);
    if (!project) {
      return;
    }

    // Update project with latest data
    project.updatedAt = new Date();
    
    // Save to persistence service
    await this.persistenceService.updateProject(projectId, project);
    
    // Update active projects cache
    this.activeProjects.set(projectId, project);
  }

  /**
   * Generate governance Q&A for project creation
   */
  private async generateProjectCreationQA(project: Project, wizardData: ProjectCreationData): Promise<void> {
    const qaContext = {
      projectId: project.id,
      projectName: project.name,
      projectType: project.type.type,
      complexity: project.type.complexity,
      agentsEnabled: wizardData.agents.enabledAgents.length,
      collaborators: wizardData.collaboration.initialCollaborators.length,
      governanceLevel: wizardData.governance.auditSettings.level
    };

    const projectCreationQuestions = [
      "How did you ensure the project configuration aligns with governance requirements and best practices?",
      "What validation was performed on the agent selection and permission configuration?",
      "How were collaboration settings and access controls validated for security and compliance?",
      "What quality gates and governance measures were established for the project lifecycle?",
      "How were deployment and infrastructure configurations validated for reliability and security?",
      "What risk assessment was performed on the project setup and configuration?",
      "How were compliance frameworks and audit requirements integrated into the project?",
      "What monitoring and analytics capabilities were established for governance oversight?",
      "How were data governance and privacy requirements addressed in the project configuration?",
      "What documentation and knowledge management practices were established for the project?"
    ];

    // Generate Q&A for both governance systems
    await this.sharedQAService.generateQASession(qaContext, projectCreationQuestions);
    await this.modernChatQAService.generateQASession(qaContext, projectCreationQuestions);
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    // Check active projects cache first
    const cachedProject = this.activeProjects.get(projectId);
    if (cachedProject) {
      return cachedProject;
    }

    // Load from persistence service
    const project = await this.persistenceService.getProject(projectId);
    if (project) {
      this.activeProjects.set(projectId, project);
    }

    return project;
  }

  /**
   * List projects for a user
   */
  async listProjects(userId: string, filters?: ProjectFilters): Promise<ProjectSummary[]> {
    return await this.persistenceService.listProjects(userId, filters);
  }

  /**
   * Get project dashboard
   */
  getProjectDashboard(projectId: string): ProjectDashboard | null {
    return this.projectDashboards.get(projectId) || null;
  }

  /**
   * Update project dashboard
   */
  async updateProjectDashboard(projectId: string, updates: Partial<ProjectDashboard>): Promise<void> {
    const dashboard = this.projectDashboards.get(projectId);
    if (dashboard) {
      Object.assign(dashboard, updates);
      this.projectDashboards.set(projectId, dashboard);
    }
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics | null> {
    return await this.persistenceService.getProjectAnalytics(projectId);
  }

  /**
   * Get project audit trail
   */
  async getProjectAuditTrail(projectId: string, filters?: AuditFilters): Promise<ProjectAuditEntry[]> {
    return await this.persistenceService.getAuditTrail(projectId, filters);
  }

  /**
   * Add collaborator to project
   */
  async addCollaborator(projectId: string, collaboratorData: Omit<ProjectCollaborator, 'joinedAt' | 'lastActiveAt'>): Promise<ProjectCollaborator> {
    const collaborator = await this.persistenceService.addCollaborator(projectId, collaboratorData);
    
    // Update active project cache
    const project = this.activeProjects.get(projectId);
    if (project) {
      project.collaborators.push(collaborator);
      this.activeProjects.set(projectId, project);
    }

    return collaborator;
  }

  /**
   * Get project templates
   */
  async getTemplates(filters?: TemplateFilters): Promise<TemplateSummary[]> {
    return await this.persistenceService.listTemplates(filters);
  }

  /**
   * Create project from template
   */
  async createProjectFromTemplate(templateId: string, customization: TemplateCustomization): Promise<Project> {
    const project = await this.persistenceService.instantiateTemplate(templateId, customization);
    
    // Set up project dashboard
    await this.createProjectDashboard(project);
    
    // Set up auto-save if enabled
    if (this.config.enableAutomaticBackups) {
      this.setupAutoSave(project.id);
    }
    
    // Add to active projects
    this.activeProjects.set(project.id, project);
    
    return project;
  }

  // Helper methods

  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate user ID from email
   */
  private generateUserId(email: string): string {
    return `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  }

  /**
   * Get role description
   */
  private getRoleDescription(role: string): string {
    const descriptions = {
      'admin': 'Full administrative access to the project',
      'developer': 'Can read, write, and deploy code',
      'tester': 'Can run tests and view quality metrics',
      'viewer': 'Read-only access to project content'
    };
    return descriptions[role as keyof typeof descriptions] || 'Custom role';
  }

  /**
   * Convert to collaborator permissions
   */
  private convertToCollaboratorPermissions(permissions: CollaboratorPermissionSet): any {
    return {
      canRead: permissions.projectAccess.canRead,
      canWrite: permissions.projectAccess.canWrite,
      canDelete: permissions.projectAccess.canDelete,
      canDeploy: permissions.projectAccess.canDeploy,
      canManageCollaborators: false,
      canManageSettings: permissions.projectAccess.canManageSettings,
      canViewAnalytics: permissions.governanceAccess.canViewAnalytics,
      canManageAgents: permissions.agentAccess.canConfigureAgents,
      restrictedAreas: permissions.projectAccess.restrictedAreas
    };
  }

  /**
   * Get build config file name
   */
  private getBuildConfigFile(buildSystem: string): string {
    const configFiles = {
      'webpack': 'webpack.config.js',
      'vite': 'vite.config.js',
      'rollup': 'rollup.config.js',
      'parcel': 'package.json'
    };
    return configFiles[buildSystem as keyof typeof configFiles] || 'build.config.js';
  }

  /**
   * Get default entry points
   */
  private getDefaultEntryPoints(projectType: string): string[] {
    const entryPoints = {
      'web_application': ['src/index.js', 'src/main.js'],
      'mobile_app': ['src/App.js', 'src/index.js'],
      'api_service': ['src/server.js', 'src/app.js'],
      'library': ['src/index.js']
    };
    return entryPoints[projectType as keyof typeof entryPoints] || ['src/index.js'];
  }

  /**
   * Get test config file name
   */
  private getTestConfigFile(framework: string): string {
    const configFiles = {
      'jest': 'jest.config.js',
      'vitest': 'vitest.config.js',
      'mocha': 'mocha.opts',
      'cypress': 'cypress.config.js'
    };
    return configFiles[framework as keyof typeof configFiles] || 'test.config.js';
  }

  /**
   * Create deployment config
   */
  private createDeploymentConfig(deploymentSetup: DeploymentSetup): any {
    return {
      targets: deploymentSetup.targets.map(target => ({
        name: target.name,
        type: target.type,
        provider: target.provider,
        configuration: target.configuration,
        healthCheck: {
          enabled: true,
          endpoint: '/health',
          interval: 30,
          timeout: 10,
          retries: 3,
          expectedStatus: 200
        }
      })),
      pipeline: {
        stages: deploymentSetup.pipeline.stages.map(stage => ({
          name: stage.name,
          type: stage.type,
          dependsOn: [],
          parallelExecution: false,
          timeout: 600,
          retryPolicy: {
            maxRetries: 2,
            retryDelay: 5000,
            backoffMultiplier: 2,
            retryConditions: ['timeout', 'error']
          },
          conditions: []
        })),
        triggers: deploymentSetup.pipeline.triggers.map(trigger => ({
          type: trigger.type,
          configuration: trigger.configuration,
          enabled: trigger.enabled
        })),
        notifications: deploymentSetup.pipeline.notifications.map(notification => ({
          type: notification.type,
          recipients: notification.recipients,
          events: notification.events.map(event => ({
            event,
            enabled: true
          })),
          configuration: {}
        }))
      },
      rollback: {
        enabled: true,
        automaticRollback: false,
        rollbackTriggers: [],
        maxRollbackVersions: 5
      },
      monitoring: {
        enabled: true,
        metrics: deploymentSetup.monitoring.metrics.map(metric => ({
          name: metric.name,
          type: metric.type,
          description: metric.name,
          labels: [],
          enabled: metric.enabled
        })),
        alerts: deploymentSetup.monitoring.alerts.map(alert => ({
          name: alert.name,
          condition: alert.condition,
          severity: alert.severity,
          notifications: alert.notifications,
          enabled: alert.enabled
        })),
        dashboards: deploymentSetup.monitoring.dashboards.map(dashboard => ({
          name: dashboard.name,
          description: dashboard.name,
          widgets: dashboard.widgets.map(widget => ({
            type: widget.type,
            title: widget.title,
            configuration: widget.configuration,
            position: widget.position
          })),
          refreshInterval: dashboard.refreshInterval
        }))
      }
    };
  }

  /**
   * Create quality config
   */
  private createQualityConfig(qualityTools: string[]): any {
    return {
      codeQuality: {
        enabled: true,
        tools: qualityTools.map(tool => ({
          name: tool,
          version: 'latest',
          configFile: `${tool}.config.js`,
          enabled: true
        })),
        thresholds: [
          { metric: 'maintainability_index', operator: 'greater_than', value: 70, severity: 'warning' },
          { metric: 'cyclomatic_complexity', operator: 'less_than', value: 10, severity: 'error' }
        ],
        excludePatterns: ['node_modules', 'dist', '*.test.*'],
        failOnViolation: false
      },
      security: {
        enabled: true,
        scanners: [
          { name: 'eslint-security', type: 'sast', configFile: '.eslintrc.security.js', enabled: true }
        ],
        vulnerabilityThreshold: 'medium',
        excludePatterns: ['node_modules'],
        failOnVulnerability: true
      },
      performance: {
        enabled: true,
        budgets: [
          { metric: 'bundle_size', threshold: 1000000, unit: 'bytes', severity: 'warning' },
          { metric: 'load_time', threshold: 3000, unit: 'milliseconds', severity: 'error' }
        ],
        monitoring: {
          enabled: true,
          realUserMonitoring: false,
          syntheticMonitoring: true,
          coreWebVitals: true,
          customMetrics: []
        },
        optimization: {
          imageOptimization: true,
          codeMinification: true,
          gzipCompression: true,
          caching: {
            enabled: true,
            strategy: 'cache_first',
            maxAge: 3600,
            excludePatterns: []
          },
          cdn: {
            enabled: false,
            provider: '',
            configuration: {}
          }
        }
      },
      accessibility: {
        enabled: true,
        standards: [
          { name: 'WCAG_2_1', level: 'AA', enabled: true }
        ],
        testing: {
          automated: true,
          manual: false,
          userTesting: false,
          tools: [
            { name: 'axe-core', type: 'scanner', configFile: 'axe.config.js', enabled: true }
          ]
        },
        reporting: {
          generateReports: true,
          includeScreenshots: true,
          detailedAnalysis: true,
          complianceMatrix: true
        }
      }
    };
  }

  /**
   * Create agent config
   */
  private createAgentConfig(agentSelection: AgentSelection): any {
    return {
      enabledAgents: agentSelection.enabledAgents.map(agent => ({
        agentId: agent.agentId,
        agentType: agent.agentType,
        configuration: agent.configuration,
        permissions: {
          canCreateFiles: agent.permissions.fileOperations.canCreate,
          canModifyFiles: agent.permissions.fileOperations.canUpdate,
          canDeleteFiles: agent.permissions.fileOperations.canDelete,
          canExecuteCommands: agent.permissions.systemAccess.canExecuteCommands,
          canAccessNetwork: agent.permissions.networkAccess.canAccessInternet,
          canModifyConfiguration: agent.permissions.systemAccess.canModifyConfiguration,
          restrictedPaths: agent.permissions.fileOperations.restrictedPaths
        },
        enabled: true
      })),
      coordination: {
        orchestrationMode: agentSelection.orchestrationMode,
        communicationProtocol: agentSelection.coordinationSettings.communicationProtocol,
        conflictResolution: agentSelection.coordinationSettings.conflictResolution,
        workloadDistribution: agentSelection.coordinationSettings.workloadDistribution
      },
      governance: {
        auditLevel: 'standard',
        approvalRequired: false,
        reviewThreshold: 'medium',
        qualityGates: ['code_review', 'testing', 'security_scan']
      },
      monitoring: {
        performanceTracking: true,
        errorTracking: true,
        resourceUsage: true,
        activityLogging: true,
        realTimeAlerts: true
      }
    };
  }

  /**
   * Get default build commands
   */
  private getDefaultBuildCommands(projectType: string, buildSystem: string): any[] {
    return [
      {
        name: 'install',
        command: 'npm install',
        workingDirectory: '.',
        environment: {},
        timeout: 300,
        retryOnFailure: true,
        dependsOn: []
      },
      {
        name: 'build',
        command: buildSystem === 'webpack' ? 'npm run build' : `${buildSystem} build`,
        workingDirectory: '.',
        environment: { NODE_ENV: 'production' },
        timeout: 600,
        retryOnFailure: false,
        dependsOn: ['install']
      }
    ];
  }

  /**
   * Get default artifacts
   */
  private getDefaultArtifacts(projectType: string): any[] {
    return [
      {
        name: 'build_output',
        path: 'dist',
        type: projectType === 'library' ? 'library' : 'archive',
        retention: {
          policy: 'keep_by_count',
          value: 10,
          unit: 'versions'
        }
      }
    ];
  }

  /**
   * Get default quick actions
   */
  private getDefaultQuickActions(project: Project): QuickAction[] {
    return [
      {
        id: 'start_development',
        title: 'Start Development',
        description: 'Begin development with autonomous agents',
        icon: 'play',
        action: 'start_agents',
        enabled: true,
        permissions: ['developer', 'admin']
      },
      {
        id: 'run_tests',
        title: 'Run Tests',
        description: 'Execute automated test suite',
        icon: 'test-tube',
        action: 'run_tests',
        enabled: true,
        permissions: ['developer', 'tester', 'admin']
      },
      {
        id: 'deploy',
        title: 'Deploy',
        description: 'Deploy to staging or production',
        icon: 'rocket',
        action: 'deploy',
        enabled: project.status.lastBuildStatus === 'success',
        permissions: ['admin']
      },
      {
        id: 'view_analytics',
        title: 'View Analytics',
        description: 'Project performance and quality metrics',
        icon: 'chart',
        action: 'view_analytics',
        enabled: true,
        permissions: ['viewer', 'developer', 'admin']
      }
    ];
  }

  /**
   * Get default dashboard widgets
   */
  private getDefaultDashboardWidgets(project: Project): DashboardWidget[] {
    return [
      {
        id: 'project_health',
        type: 'metric',
        title: 'Project Health',
        data: {
          buildStatus: project.status.lastBuildStatus,
          testStatus: project.status.lastTestStatus,
          deploymentStatus: project.status.deploymentStatus
        },
        configuration: { showTrends: true },
        position: { x: 0, y: 0, width: 4, height: 2 }
      },
      {
        id: 'team_activity',
        type: 'chart',
        title: 'Team Activity',
        data: { collaborators: project.collaborators.length, activity: [] },
        configuration: { chartType: 'line', timeRange: '7d' },
        position: { x: 4, y: 0, width: 4, height: 2 }
      },
      {
        id: 'recent_changes',
        type: 'list',
        title: 'Recent Changes',
        data: { changes: [] },
        configuration: { maxItems: 5 },
        position: { x: 0, y: 2, width: 8, height: 3 }
      }
    ];
  }

  /**
   * Cleanup resources when extension is destroyed
   */
  destroy(): void {
    super.destroy();
    
    // Clear auto-save intervals
    for (const interval of this.autoSaveIntervals.values()) {
      clearInterval(interval);
    }
    this.autoSaveIntervals.clear();
    
    // Clear caches
    this.activeProjects.clear();
    this.projectDashboards.clear();
    this.workspaces.clear();
  }
}

