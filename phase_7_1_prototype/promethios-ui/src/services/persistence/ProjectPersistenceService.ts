/**
 * Project Persistence Service for Autonomous MAS Builder System
 * 
 * Provides comprehensive project management capabilities including:
 * - Project creation, saving, loading, and versioning
 * - Collaboration features with real-time synchronization
 * - Template management and sharing
 * - Build artifact storage and deployment tracking
 * - Governance integration with audit trails
 * 
 * This service enables users to manage complex development projects
 * built by autonomous agents with full persistence and collaboration support.
 */

import { enhancedAuditLoggingService } from '../EnhancedAuditLoggingService';
import { SharedGovernedInsightsQAService } from '../../shared/governance/core/SharedGovernedInsightsQAService';
import { ModernChatGovernedInsightsQAService } from '../ModernChatGovernedInsightsQAService';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  
  // Project structure
  fileStructure: ProjectFileStructure;
  dependencies: ProjectDependency[];
  configuration: ProjectConfiguration;
  
  // Build and deployment
  buildConfiguration: BuildConfiguration;
  deploymentHistory: DeploymentRecord[];
  
  // Collaboration
  collaborators: ProjectCollaborator[];
  permissions: ProjectPermissions;
  
  // Versioning
  currentVersion: string;
  versionHistory: ProjectVersion[];
  
  // Governance
  governanceProfile: ProjectGovernanceProfile;
  auditTrail: ProjectAuditEntry[];
  
  // Templates and sharing
  isTemplate: boolean;
  templateMetadata?: TemplateMetadata;
  
  // Analytics
  analytics: ProjectAnalytics;
  
  // Tags and categorization
  tags: string[];
  category: string;
  visibility: 'private' | 'team' | 'public';
}

export interface ProjectType {
  type: 'web_application' | 'mobile_app' | 'api_service' | 'desktop_app' | 'library' | 'documentation' | 'custom';
  framework: string;
  language: string;
  platform: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
}

export interface ProjectStatus {
  phase: 'planning' | 'development' | 'testing' | 'deployment' | 'maintenance' | 'archived';
  progress: number; // 0-100
  health: 'healthy' | 'warning' | 'error' | 'unknown';
  lastBuildStatus: 'success' | 'failed' | 'in_progress' | 'not_started';
  lastTestStatus: 'passed' | 'failed' | 'in_progress' | 'not_run';
  deploymentStatus: 'deployed' | 'pending' | 'failed' | 'not_deployed';
}

export interface ProjectFileStructure {
  rootPath: string;
  files: ProjectFile[];
  directories: ProjectDirectory[];
  totalFiles: number;
  totalSize: number; // bytes
  lastScan: Date;
}

export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  type: 'source' | 'config' | 'asset' | 'documentation' | 'test' | 'build';
  language?: string;
  size: number;
  checksum: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  
  // Content analysis
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  exports: string[];
  
  // Version control
  version: string;
  changeHistory: FileChangeRecord[];
  
  // Agent assignment
  assignedAgent?: string;
  agentNotes?: string;
  
  // Quality metrics
  codeQuality?: CodeQualityMetrics;
  testCoverage?: number;
}

export interface ProjectDirectory {
  path: string;
  name: string;
  type: 'source' | 'assets' | 'tests' | 'docs' | 'config' | 'build' | 'node_modules';
  fileCount: number;
  totalSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileChangeRecord {
  id: string;
  timestamp: Date;
  author: string;
  type: 'created' | 'modified' | 'deleted' | 'moved' | 'renamed';
  description: string;
  diffSummary?: DiffSummary;
  agentGenerated: boolean;
}

export interface DiffSummary {
  linesAdded: number;
  linesRemoved: number;
  linesModified: number;
  functionsAdded: string[];
  functionsRemoved: string[];
  functionsModified: string[];
}

export interface CodeQualityMetrics {
  maintainabilityIndex: number;
  cyclomaticComplexity: number;
  linesOfCode: number;
  duplicatedLines: number;
  technicalDebt: number; // minutes
  codeSmells: CodeSmell[];
  securityHotspots: SecurityHotspot[];
}

export interface CodeSmell {
  type: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
  description: string;
  location: CodeLocation;
  suggestion: string;
}

export interface SecurityHotspot {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: CodeLocation;
  recommendation: string;
  cweId?: string;
}

export interface CodeLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface ProjectDependency {
  name: string;
  version: string;
  type: 'runtime' | 'development' | 'peer' | 'optional';
  source: 'npm' | 'pip' | 'maven' | 'nuget' | 'custom';
  license: string;
  vulnerabilities: DependencyVulnerability[];
  updateAvailable?: string;
  lastChecked: Date;
}

export interface DependencyVulnerability {
  id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  patchedVersions: string[];
  recommendation: string;
}

export interface ProjectConfiguration {
  buildSystem: BuildSystemConfig;
  environment: EnvironmentConfig;
  testing: TestingConfig;
  deployment: DeploymentConfig;
  quality: QualityConfig;
  agents: AgentConfig;
}

export interface BuildSystemConfig {
  type: 'webpack' | 'vite' | 'rollup' | 'parcel' | 'gradle' | 'maven' | 'custom';
  configFile: string;
  outputDirectory: string;
  sourceDirectory: string;
  entryPoints: string[];
  optimization: OptimizationConfig;
}

export interface OptimizationConfig {
  minification: boolean;
  treeshaking: boolean;
  codesplitting: boolean;
  bundleAnalysis: boolean;
  compressionLevel: 'none' | 'basic' | 'aggressive';
}

export interface EnvironmentConfig {
  environments: Environment[];
  currentEnvironment: string;
  environmentVariables: Record<string, EnvironmentVariable>;
}

export interface Environment {
  name: string;
  type: 'development' | 'staging' | 'production' | 'testing';
  url?: string;
  apiEndpoints: Record<string, string>;
  databaseConfig?: DatabaseConfig;
  features: FeatureFlag[];
}

export interface EnvironmentVariable {
  value: string;
  encrypted: boolean;
  required: boolean;
  description: string;
  environments: string[];
}

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'redis';
  host: string;
  port: number;
  database: string;
  ssl: boolean;
  poolSize: number;
  connectionTimeout: number;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  conditions: FeatureFlagCondition[];
}

export interface FeatureFlagCondition {
  type: 'user_group' | 'environment' | 'date_range' | 'custom';
  value: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

export interface TestingConfig {
  frameworks: TestFramework[];
  coverageThreshold: number;
  testDirectories: string[];
  excludePatterns: string[];
  parallelExecution: boolean;
  maxWorkers: number;
  timeout: number;
  retryFailedTests: boolean;
  generateReports: boolean;
}

export interface TestFramework {
  name: string;
  version: string;
  configFile: string;
  testPattern: string;
  setupFiles: string[];
}

export interface DeploymentConfig {
  targets: DeploymentTarget[];
  pipeline: DeploymentPipeline;
  rollback: RollbackConfig;
  monitoring: MonitoringConfig;
}

export interface DeploymentTarget {
  name: string;
  type: 'static' | 'serverless' | 'container' | 'vm' | 'kubernetes';
  provider: 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'custom';
  configuration: Record<string, any>;
  healthCheck: HealthCheckConfig;
}

export interface HealthCheckConfig {
  enabled: boolean;
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
  expectedStatus: number;
}

export interface DeploymentPipeline {
  stages: PipelineStage[];
  triggers: PipelineTrigger[];
  notifications: NotificationConfig[];
}

export interface PipelineStage {
  name: string;
  type: 'build' | 'test' | 'security_scan' | 'deploy' | 'smoke_test' | 'custom';
  dependsOn: string[];
  parallelExecution: boolean;
  timeout: number;
  retryPolicy: RetryPolicy;
  conditions: StageCondition[];
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryConditions: string[];
}

export interface StageCondition {
  type: 'branch' | 'tag' | 'environment' | 'manual_approval' | 'custom';
  value: string;
  operator: 'equals' | 'contains' | 'matches_regex';
}

export interface PipelineTrigger {
  type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'webhook';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'teams' | 'webhook';
  recipients: string[];
  events: NotificationEvent[];
  configuration: Record<string, any>;
}

export interface NotificationEvent {
  event: 'build_started' | 'build_completed' | 'build_failed' | 'deployment_started' | 'deployment_completed' | 'deployment_failed';
  enabled: boolean;
}

export interface RollbackConfig {
  enabled: boolean;
  automaticRollback: boolean;
  rollbackTriggers: RollbackTrigger[];
  maxRollbackVersions: number;
}

export interface RollbackTrigger {
  type: 'error_rate' | 'response_time' | 'health_check' | 'manual';
  threshold: number;
  duration: number;
  enabled: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricConfig[];
  alerts: AlertConfig[];
  dashboards: DashboardConfig[];
}

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
  enabled: boolean;
}

export interface AlertConfig {
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  notifications: string[];
  enabled: boolean;
}

export interface DashboardConfig {
  name: string;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
}

export interface DashboardWidget {
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

export interface QualityConfig {
  codeQuality: CodeQualityConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  accessibility: AccessibilityConfig;
}

export interface CodeQualityConfig {
  enabled: boolean;
  tools: QualityTool[];
  thresholds: QualityThreshold[];
  excludePatterns: string[];
  failOnViolation: boolean;
}

export interface QualityTool {
  name: string;
  version: string;
  configFile: string;
  enabled: boolean;
}

export interface QualityThreshold {
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals';
  value: number;
  severity: 'info' | 'warning' | 'error';
}

export interface SecurityConfig {
  enabled: boolean;
  scanners: SecurityScanner[];
  vulnerabilityThreshold: 'low' | 'medium' | 'high' | 'critical';
  excludePatterns: string[];
  failOnVulnerability: boolean;
}

export interface SecurityScanner {
  name: string;
  type: 'sast' | 'dast' | 'dependency' | 'container' | 'infrastructure';
  configFile: string;
  enabled: boolean;
}

export interface PerformanceConfig {
  enabled: boolean;
  budgets: PerformanceBudget[];
  monitoring: PerformanceMonitoring;
  optimization: PerformanceOptimization;
}

export interface PerformanceBudget {
  metric: 'bundle_size' | 'load_time' | 'first_contentful_paint' | 'largest_contentful_paint' | 'cumulative_layout_shift';
  threshold: number;
  unit: 'bytes' | 'milliseconds' | 'score';
  severity: 'warning' | 'error';
}

export interface PerformanceMonitoring {
  enabled: boolean;
  realUserMonitoring: boolean;
  syntheticMonitoring: boolean;
  coreWebVitals: boolean;
  customMetrics: CustomMetric[];
}

export interface CustomMetric {
  name: string;
  description: string;
  type: 'timing' | 'counter' | 'gauge';
  threshold?: number;
}

export interface PerformanceOptimization {
  imageOptimization: boolean;
  codeMinification: boolean;
  gzipCompression: boolean;
  caching: CachingConfig;
  cdn: CDNConfig;
}

export interface CachingConfig {
  enabled: boolean;
  strategy: 'cache_first' | 'network_first' | 'stale_while_revalidate';
  maxAge: number;
  excludePatterns: string[];
}

export interface CDNConfig {
  enabled: boolean;
  provider: string;
  configuration: Record<string, any>;
}

export interface AccessibilityConfig {
  enabled: boolean;
  standards: AccessibilityStandard[];
  testing: AccessibilityTesting;
  reporting: AccessibilityReporting;
}

export interface AccessibilityStandard {
  name: 'WCAG_2_1' | 'WCAG_2_2' | 'Section_508' | 'EN_301_549';
  level: 'A' | 'AA' | 'AAA';
  enabled: boolean;
}

export interface AccessibilityTesting {
  automated: boolean;
  manual: boolean;
  userTesting: boolean;
  tools: AccessibilityTool[];
}

export interface AccessibilityTool {
  name: string;
  type: 'linter' | 'scanner' | 'validator';
  configFile: string;
  enabled: boolean;
}

export interface AccessibilityReporting {
  generateReports: boolean;
  includeScreenshots: boolean;
  detailedAnalysis: boolean;
  complianceMatrix: boolean;
}

export interface AgentConfig {
  enabledAgents: EnabledAgent[];
  coordination: AgentCoordination;
  governance: AgentGovernance;
  monitoring: AgentMonitoring;
}

export interface EnabledAgent {
  agentId: string;
  agentType: 'frontend' | 'backend' | 'testing' | 'design' | 'devops' | 'qa' | 'orchestrator';
  configuration: Record<string, any>;
  permissions: AgentPermissions;
  enabled: boolean;
}

export interface AgentPermissions {
  canCreateFiles: boolean;
  canModifyFiles: boolean;
  canDeleteFiles: boolean;
  canExecuteCommands: boolean;
  canAccessNetwork: boolean;
  canModifyConfiguration: boolean;
  restrictedPaths: string[];
}

export interface AgentCoordination {
  orchestrationMode: 'centralized' | 'distributed' | 'hybrid';
  communicationProtocol: 'direct' | 'message_queue' | 'event_driven';
  conflictResolution: 'first_wins' | 'last_wins' | 'merge' | 'manual';
  workloadDistribution: 'round_robin' | 'capability_based' | 'load_balanced';
}

export interface AgentGovernance {
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
  approvalRequired: boolean;
  reviewThreshold: 'low' | 'medium' | 'high';
  qualityGates: string[];
}

export interface AgentMonitoring {
  performanceTracking: boolean;
  errorTracking: boolean;
  resourceUsage: boolean;
  activityLogging: boolean;
  realTimeAlerts: boolean;
}

export interface BuildConfiguration {
  buildSystem: string;
  buildCommands: BuildCommand[];
  artifacts: BuildArtifact[];
  optimization: BuildOptimization;
  caching: BuildCaching;
  parallelization: BuildParallelization;
}

export interface BuildCommand {
  name: string;
  command: string;
  workingDirectory: string;
  environment: Record<string, string>;
  timeout: number;
  retryOnFailure: boolean;
  dependsOn: string[];
}

export interface BuildArtifact {
  name: string;
  path: string;
  type: 'executable' | 'library' | 'archive' | 'image' | 'documentation';
  size?: number;
  checksum?: string;
  retention: ArtifactRetention;
}

export interface ArtifactRetention {
  policy: 'keep_all' | 'keep_latest' | 'keep_by_count' | 'keep_by_age';
  value?: number;
  unit?: 'days' | 'weeks' | 'months' | 'versions';
}

export interface BuildOptimization {
  incrementalBuild: boolean;
  parallelCompilation: boolean;
  optimizationLevel: 'none' | 'basic' | 'aggressive';
  targetPlatforms: string[];
}

export interface BuildCaching {
  enabled: boolean;
  type: 'local' | 'distributed' | 'cloud';
  configuration: Record<string, any>;
  invalidationRules: CacheInvalidationRule[];
}

export interface CacheInvalidationRule {
  trigger: 'file_change' | 'dependency_change' | 'time_based' | 'manual';
  pattern: string;
  scope: 'local' | 'global';
}

export interface BuildParallelization {
  enabled: boolean;
  maxWorkers: number;
  strategy: 'file_based' | 'module_based' | 'task_based';
  loadBalancing: boolean;
}

export interface DeploymentRecord {
  id: string;
  version: string;
  environment: string;
  deployedAt: Date;
  deployedBy: string;
  status: 'success' | 'failed' | 'rolled_back' | 'in_progress';
  
  // Deployment details
  artifacts: string[];
  configuration: Record<string, any>;
  duration: number;
  
  // Health and monitoring
  healthChecks: HealthCheckResult[];
  performanceMetrics: DeploymentPerformanceMetrics;
  
  // Rollback information
  rollbackVersion?: string;
  rollbackReason?: string;
  rollbackAt?: Date;
  
  // Governance
  approvals: DeploymentApproval[];
  auditTrail: DeploymentAuditEntry[];
}

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  message: string;
  timestamp: Date;
}

export interface DeploymentPerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface DeploymentApproval {
  approver: string;
  approvedAt: Date;
  status: 'approved' | 'rejected' | 'pending';
  comments: string;
  conditions: string[];
}

export interface DeploymentAuditEntry {
  timestamp: Date;
  action: string;
  actor: string;
  details: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ProjectCollaborator {
  userId: string;
  username: string;
  email: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermissions;
  joinedAt: Date;
  lastActiveAt: Date;
  invitedBy: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}

export interface CollaboratorRole {
  name: 'owner' | 'admin' | 'developer' | 'tester' | 'viewer' | 'custom';
  description: string;
  inheritsFrom?: string;
}

export interface CollaboratorPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canDeploy: boolean;
  canManageCollaborators: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canManageAgents: boolean;
  restrictedAreas: string[];
}

export interface ProjectPermissions {
  defaultRole: string;
  publicAccess: boolean;
  requireApproval: boolean;
  allowForks: boolean;
  allowTemplateCreation: boolean;
  customRoles: CustomRole[];
}

export interface CustomRole {
  name: string;
  description: string;
  permissions: CollaboratorPermissions;
  conditions: RoleCondition[];
}

export interface RoleCondition {
  type: 'time_based' | 'location_based' | 'ip_based' | 'device_based';
  value: string;
  operator: 'equals' | 'contains' | 'matches';
}

export interface ProjectVersion {
  version: string;
  tag?: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  
  // Changes
  changes: VersionChange[];
  fileChanges: FileChangeRecord[];
  
  // Build and deployment
  buildStatus: 'success' | 'failed' | 'in_progress' | 'not_built';
  buildArtifacts: string[];
  deploymentStatus: Record<string, string>;
  
  // Quality metrics
  testResults: VersionTestResults;
  qualityMetrics: VersionQualityMetrics;
  
  // Governance
  approvals: VersionApproval[];
  releaseNotes: string;
}

export interface VersionChange {
  type: 'feature' | 'bugfix' | 'improvement' | 'breaking' | 'security' | 'documentation';
  description: string;
  impact: 'low' | 'medium' | 'high';
  affectedComponents: string[];
}

export interface VersionTestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: number;
  testDuration: number;
  testReports: string[];
}

export interface VersionQualityMetrics {
  codeQuality: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  securityScore: number;
  performanceScore: number;
  accessibilityScore: number;
}

export interface VersionApproval {
  approver: string;
  approvedAt: Date;
  status: 'approved' | 'rejected' | 'pending';
  type: 'code_review' | 'security_review' | 'performance_review' | 'business_approval';
  comments: string;
}

export interface ProjectGovernanceProfile {
  complianceFrameworks: ComplianceFramework[];
  auditRequirements: AuditRequirement[];
  qualityStandards: QualityStandard[];
  securityPolicies: SecurityPolicy[];
  dataGovernance: DataGovernancePolicy;
}

export interface ComplianceFramework {
  name: string;
  version: string;
  requirements: ComplianceRequirement[];
  validationMethods: string[];
  auditFrequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  category: string;
  mandatory: boolean;
  validationCriteria: string[];
  evidence: string[];
}

export interface AuditRequirement {
  type: 'code_changes' | 'deployments' | 'access_control' | 'data_access' | 'configuration_changes';
  level: 'basic' | 'detailed' | 'comprehensive';
  retention: number; // days
  encryption: boolean;
  accessControl: string[];
}

export interface QualityStandard {
  name: string;
  category: 'code_quality' | 'security' | 'performance' | 'accessibility' | 'documentation';
  requirements: QualityRequirement[];
  thresholds: QualityThreshold[];
  validationMethods: string[];
}

export interface QualityRequirement {
  id: string;
  description: string;
  mandatory: boolean;
  validationCriteria: string[];
  automatedValidation: boolean;
}

export interface SecurityPolicy {
  name: string;
  type: 'authentication' | 'authorization' | 'data_protection' | 'network_security' | 'application_security';
  rules: SecurityRule[];
  enforcement: 'advisory' | 'warning' | 'blocking';
  exceptions: SecurityException[];
}

export interface SecurityRule {
  id: string;
  description: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityException {
  ruleId: string;
  reason: string;
  approvedBy: string;
  expiresAt: Date;
  conditions: string[];
}

export interface DataGovernancePolicy {
  dataClassification: DataClassification[];
  retentionPolicies: DataRetentionPolicy[];
  accessControls: DataAccessControl[];
  privacyControls: PrivacyControl[];
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  description: string;
  handlingRequirements: string[];
  accessRestrictions: string[];
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  archivalPolicy: 'delete' | 'archive' | 'anonymize';
  legalHolds: LegalHold[];
}

export interface LegalHold {
  id: string;
  reason: string;
  startDate: Date;
  endDate?: Date;
  scope: string[];
}

export interface DataAccessControl {
  dataType: string;
  accessLevel: 'read' | 'write' | 'delete' | 'admin';
  requiredRoles: string[];
  approvalRequired: boolean;
  auditRequired: boolean;
}

export interface PrivacyControl {
  type: 'anonymization' | 'pseudonymization' | 'encryption' | 'masking';
  dataTypes: string[];
  method: string;
  keyManagement: string;
}

export interface ProjectAuditEntry {
  id: string;
  timestamp: Date;
  actor: string;
  actorType: 'user' | 'agent' | 'system';
  action: string;
  category: 'file_change' | 'configuration_change' | 'deployment' | 'access_control' | 'collaboration';
  
  // Details
  description: string;
  affectedResources: string[];
  beforeState?: any;
  afterState?: any;
  
  // Context
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Risk and compliance
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceImpact: string[];
  
  // Governance
  approvalRequired: boolean;
  approvals: AuditApproval[];
  
  // Metadata
  tags: string[];
  correlationId?: string;
}

export interface AuditApproval {
  approver: string;
  approvedAt: Date;
  status: 'approved' | 'rejected' | 'pending';
  reason: string;
}

export interface TemplateMetadata {
  templateId: string;
  templateName: string;
  templateDescription: string;
  templateVersion: string;
  
  // Template characteristics
  category: string;
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number; // hours
  
  // Usage statistics
  usageCount: number;
  rating: number;
  reviews: TemplateReview[];
  
  // Template content
  includesFiles: string[];
  includesConfiguration: boolean;
  includesDocumentation: boolean;
  includesTests: boolean;
  
  // Customization
  customizableFields: CustomizableField[];
  requiredInputs: TemplateInput[];
  
  // Maintenance
  maintainer: string;
  lastUpdated: Date;
  supportedVersions: string[];
  deprecationDate?: Date;
}

export interface TemplateReview {
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
}

export interface CustomizableField {
  fieldName: string;
  fieldType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  description: string;
  defaultValue: any;
  required: boolean;
  validation: FieldValidation;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  options?: string[];
}

export interface TemplateInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'directory';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation: FieldValidation;
}

export interface ProjectAnalytics {
  overview: AnalyticsOverview;
  development: DevelopmentAnalytics;
  quality: QualityAnalytics;
  performance: PerformanceAnalytics;
  collaboration: CollaborationAnalytics;
  deployment: DeploymentAnalytics;
}

export interface AnalyticsOverview {
  totalFiles: number;
  totalLines: number;
  totalCommits: number;
  totalBuilds: number;
  totalDeployments: number;
  activeCollaborators: number;
  lastActivity: Date;
  projectAge: number; // days
}

export interface DevelopmentAnalytics {
  codeVelocity: CodeVelocity;
  fileActivity: FileActivity[];
  languageDistribution: LanguageDistribution[];
  agentContributions: AgentContribution[];
  developmentTrends: DevelopmentTrend[];
}

export interface CodeVelocity {
  linesPerDay: number;
  filesPerDay: number;
  commitsPerDay: number;
  velocity7Day: number;
  velocity30Day: number;
  velocityTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface FileActivity {
  filePath: string;
  changeCount: number;
  lastChanged: Date;
  contributors: string[];
  complexity: number;
  hotspot: boolean;
}

export interface LanguageDistribution {
  language: string;
  fileCount: number;
  lineCount: number;
  percentage: number;
}

export interface AgentContribution {
  agentId: string;
  agentType: string;
  filesCreated: number;
  filesModified: number;
  linesAdded: number;
  linesRemoved: number;
  efficiency: number;
  qualityScore: number;
}

export interface DevelopmentTrend {
  date: Date;
  metric: string;
  value: number;
  change: number;
  changePercentage: number;
}

export interface QualityAnalytics {
  overallQuality: number;
  qualityTrends: QualityTrend[];
  codeSmells: CodeSmellAnalytics;
  testCoverage: TestCoverageAnalytics;
  securityMetrics: SecurityMetrics;
  technicalDebt: TechnicalDebtAnalytics;
}

export interface QualityTrend {
  date: Date;
  qualityScore: number;
  maintainabilityIndex: number;
  testCoverage: number;
  codeSmells: number;
  securityHotspots: number;
}

export interface CodeSmellAnalytics {
  totalSmells: number;
  smellsByType: Record<string, number>;
  smellsBySeverity: Record<string, number>;
  smellTrends: SmellTrend[];
  topFiles: FileSmellSummary[];
}

export interface SmellTrend {
  date: Date;
  smellType: string;
  count: number;
  change: number;
}

export interface FileSmellSummary {
  filePath: string;
  smellCount: number;
  severity: string;
  estimatedFixTime: number;
}

export interface TestCoverageAnalytics {
  overallCoverage: number;
  coverageByFile: FileCoverage[];
  coverageByType: TypeCoverage[];
  coverageTrends: CoverageTrend[];
  uncoveredAreas: UncoveredArea[];
}

export interface FileCoverage {
  filePath: string;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  uncoveredLines: number[];
}

export interface TypeCoverage {
  type: 'unit' | 'integration' | 'e2e' | 'performance';
  coverage: number;
  testCount: number;
}

export interface CoverageTrend {
  date: Date;
  coverage: number;
  change: number;
  testCount: number;
}

export interface UncoveredArea {
  filePath: string;
  startLine: number;
  endLine: number;
  complexity: number;
  risk: 'low' | 'medium' | 'high';
}

export interface SecurityMetrics {
  securityScore: number;
  vulnerabilities: VulnerabilityMetrics;
  securityTrends: SecurityTrend[];
  complianceStatus: ComplianceStatus[];
}

export interface VulnerabilityMetrics {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  resolved: number;
  pending: number;
  falsePositives: number;
}

export interface SecurityTrend {
  date: Date;
  vulnerabilities: number;
  resolved: number;
  newVulnerabilities: number;
  securityScore: number;
}

export interface ComplianceStatus {
  framework: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  score: number;
  lastAssessment: Date;
  gaps: string[];
}

export interface TechnicalDebtAnalytics {
  totalDebt: number; // minutes
  debtRatio: number; // percentage
  debtByCategory: Record<string, number>;
  debtTrends: DebtTrend[];
  topDebtFiles: FileDebtSummary[];
}

export interface DebtTrend {
  date: Date;
  totalDebt: number;
  newDebt: number;
  resolvedDebt: number;
  debtRatio: number;
}

export interface FileDebtSummary {
  filePath: string;
  debt: number;
  debtRatio: number;
  issues: number;
  estimatedFixTime: number;
}

export interface PerformanceAnalytics {
  buildPerformance: BuildPerformanceMetrics;
  deploymentPerformance: DeploymentPerformanceMetrics;
  applicationPerformance: ApplicationPerformanceMetrics;
  performanceTrends: PerformanceTrend[];
}

export interface BuildPerformanceMetrics {
  averageBuildTime: number;
  buildSuccessRate: number;
  buildTrends: BuildTrend[];
  slowestStages: BuildStageMetrics[];
  cacheHitRate: number;
}

export interface BuildTrend {
  date: Date;
  buildTime: number;
  successRate: number;
  cacheHitRate: number;
}

export interface BuildStageMetrics {
  stageName: string;
  averageTime: number;
  successRate: number;
  bottlenecks: string[];
}

export interface ApplicationPerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  coreWebVitals: CoreWebVitals;
}

export interface CoreWebVitals {
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
}

export interface PerformanceTrend {
  date: Date;
  metric: string;
  value: number;
  change: number;
  threshold: number;
}

export interface CollaborationAnalytics {
  activeCollaborators: number;
  collaborationPatterns: CollaborationPattern[];
  communicationMetrics: CommunicationMetrics;
  workDistribution: WorkDistribution[];
  teamEfficiency: TeamEfficiencyMetrics;
}

export interface CollaborationPattern {
  collaboratorId: string;
  activityLevel: 'low' | 'medium' | 'high';
  preferredAreas: string[];
  collaborationScore: number;
  lastActivity: Date;
}

export interface CommunicationMetrics {
  totalMessages: number;
  averageResponseTime: number;
  collaborationEvents: number;
  meetingFrequency: number;
  documentationUpdates: number;
}

export interface WorkDistribution {
  collaboratorId: string;
  workload: number;
  efficiency: number;
  qualityScore: number;
  specialization: string[];
}

export interface TeamEfficiencyMetrics {
  overallEfficiency: number;
  velocityConsistency: number;
  qualityConsistency: number;
  collaborationEffectiveness: number;
  knowledgeSharing: number;
}

export interface DeploymentAnalytics {
  deploymentFrequency: number;
  deploymentSuccessRate: number;
  meanTimeToDeployment: number;
  meanTimeToRecovery: number;
  changeFailureRate: number;
  deploymentTrends: DeploymentTrend[];
}

export interface DeploymentTrend {
  date: Date;
  deployments: number;
  successRate: number;
  averageTime: number;
  rollbacks: number;
}

// Service interfaces
export interface ProjectPersistenceService {
  // Project CRUD operations
  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>): Promise<Project>;
  getProject(projectId: string): Promise<Project | null>;
  updateProject(projectId: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(projectId: string): Promise<boolean>;
  
  // Project listing and search
  listProjects(userId: string, filters?: ProjectFilters): Promise<ProjectSummary[]>;
  searchProjects(query: string, filters?: ProjectFilters): Promise<ProjectSummary[]>;
  
  // Project versioning
  createVersion(projectId: string, version: Omit<ProjectVersion, 'createdAt'>): Promise<ProjectVersion>;
  getVersions(projectId: string): Promise<ProjectVersion[]>;
  getVersion(projectId: string, version: string): Promise<ProjectVersion | null>;
  restoreVersion(projectId: string, version: string): Promise<Project>;
  
  // File management
  saveFile(projectId: string, file: ProjectFile): Promise<ProjectFile>;
  getFile(projectId: string, filePath: string): Promise<ProjectFile | null>;
  deleteFile(projectId: string, filePath: string): Promise<boolean>;
  listFiles(projectId: string, directory?: string): Promise<ProjectFile[]>;
  
  // Collaboration
  addCollaborator(projectId: string, collaborator: Omit<ProjectCollaborator, 'joinedAt' | 'lastActiveAt'>): Promise<ProjectCollaborator>;
  removeCollaborator(projectId: string, userId: string): Promise<boolean>;
  updateCollaboratorRole(projectId: string, userId: string, role: CollaboratorRole): Promise<ProjectCollaborator>;
  getCollaborators(projectId: string): Promise<ProjectCollaborator[]>;
  
  // Templates
  createTemplate(project: Project, metadata: TemplateMetadata): Promise<Template>;
  getTemplate(templateId: string): Promise<Template | null>;
  listTemplates(filters?: TemplateFilters): Promise<TemplateSummary[]>;
  instantiateTemplate(templateId: string, customization: TemplateCustomization): Promise<Project>;
  
  // Analytics
  getProjectAnalytics(projectId: string, timeRange?: TimeRange): Promise<ProjectAnalytics>;
  getAggregatedAnalytics(projectIds: string[], timeRange?: TimeRange): Promise<AggregatedAnalytics>;
  
  // Audit and governance
  getAuditTrail(projectId: string, filters?: AuditFilters): Promise<ProjectAuditEntry[]>;
  addAuditEntry(projectId: string, entry: Omit<ProjectAuditEntry, 'id' | 'timestamp'>): Promise<ProjectAuditEntry>;
  
  // Build and deployment
  saveBuildRecord(projectId: string, buildRecord: BuildRecord): Promise<BuildRecord>;
  saveDeploymentRecord(projectId: string, deploymentRecord: DeploymentRecord): Promise<DeploymentRecord>;
  getBuildHistory(projectId: string): Promise<BuildRecord[]>;
  getDeploymentHistory(projectId: string): Promise<DeploymentRecord[]>;
}

export interface ProjectFilters {
  type?: string;
  status?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  collaboratorId?: string;
  visibility?: 'private' | 'team' | 'public';
  complexity?: 'simple' | 'moderate' | 'complex' | 'enterprise';
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  collaborators: number;
  tags: string[];
  visibility: 'private' | 'team' | 'public';
  thumbnail?: string;
}

export interface Template {
  id: string;
  project: Project;
  metadata: TemplateMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFilters {
  category?: string;
  tags?: string[];
  complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  rating?: number;
  maintainer?: string;
}

export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  rating: number;
  usageCount: number;
  maintainer: string;
  lastUpdated: Date;
  thumbnail?: string;
}

export interface TemplateCustomization {
  projectName: string;
  projectDescription: string;
  customFields: Record<string, any>;
  selectedFeatures: string[];
  targetEnvironment: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface AggregatedAnalytics {
  totalProjects: number;
  activeProjects: number;
  totalCollaborators: number;
  totalBuilds: number;
  totalDeployments: number;
  averageQuality: number;
  trends: AnalyticsTrend[];
}

export interface AnalyticsTrend {
  metric: string;
  values: TrendValue[];
  change: number;
  changePercentage: number;
}

export interface TrendValue {
  timestamp: Date;
  value: number;
}

export interface AuditFilters {
  actor?: string;
  actorType?: 'user' | 'agent' | 'system';
  action?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface BuildRecord {
  id: string;
  projectId: string;
  version: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'success' | 'failed' | 'in_progress' | 'cancelled';
  duration?: number;
  artifacts: BuildArtifact[];
  logs: string[];
  triggeredBy: string;
  configuration: BuildConfiguration;
  metrics: BuildMetrics;
}

export interface BuildMetrics {
  totalTime: number;
  compilationTime: number;
  testTime: number;
  packageTime: number;
  cacheHitRate: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
}

/**
 * In-Memory Project Persistence Service Implementation
 * 
 * Provides a complete implementation of the ProjectPersistenceService interface
 * using in-memory storage. This can be extended to use databases, cloud storage,
 * or other persistence mechanisms.
 */
export class InMemoryProjectPersistenceService implements ProjectPersistenceService {
  private projects: Map<string, Project> = new Map();
  private projectVersions: Map<string, Map<string, ProjectVersion>> = new Map();
  private projectFiles: Map<string, Map<string, ProjectFile>> = new Map();
  private templates: Map<string, Template> = new Map();
  private auditEntries: Map<string, ProjectAuditEntry[]> = new Map();
  private buildRecords: Map<string, BuildRecord[]> = new Map();
  private deploymentRecords: Map<string, DeploymentRecord[]> = new Map();
  
  // Governance integration
  private sharedQAService: SharedGovernedInsightsQAService;
  private modernChatQAService: ModernChatGovernedInsightsQAService;
  
  constructor() {
    this.sharedQAService = new SharedGovernedInsightsQAService();
    this.modernChatQAService = new ModernChatGovernedInsightsQAService();
  }

  /**
   * Create a new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>): Promise<Project> {
    const projectId = this.generateId();
    const now = new Date();
    
    const project: Project = {
      ...projectData,
      id: projectId,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now
    };
    
    this.projects.set(projectId, project);
    this.projectVersions.set(projectId, new Map());
    this.projectFiles.set(projectId, new Map());
    this.auditEntries.set(projectId, []);
    this.buildRecords.set(projectId, []);
    this.deploymentRecords.set(projectId, []);
    
    // Create initial version
    await this.createVersion(projectId, {
      version: '1.0.0',
      description: 'Initial project version',
      createdBy: project.createdBy,
      changes: [{
        type: 'feature',
        description: 'Initial project creation',
        impact: 'high',
        affectedComponents: ['project']
      }],
      fileChanges: [],
      buildStatus: 'not_built',
      buildArtifacts: [],
      deploymentStatus: {},
      testResults: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        coverage: 0,
        testDuration: 0,
        testReports: []
      },
      qualityMetrics: {
        codeQuality: 0,
        maintainabilityIndex: 0,
        technicalDebt: 0,
        securityScore: 0,
        performanceScore: 0,
        accessibilityScore: 0
      },
      approvals: [],
      releaseNotes: 'Initial project creation'
    });
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: project.createdBy,
      actorType: 'user',
      action: 'create_project',
      category: 'collaboration',
      description: `Created project: ${project.name}`,
      affectedResources: [projectId],
      riskLevel: 'low',
      complianceImpact: [],
      approvalRequired: false,
      approvals: [],
      tags: ['project_creation']
    });
    
    // Generate governance Q&A
    await this.generateProjectCreationQA(project);
    
    // Log to audit system
    await enhancedAuditLoggingService.logInteraction({
      type: 'project_created',
      agentId: 'project_persistence_service',
      userId: project.createdBy,
      content: `Created project: ${project.name}`,
      metadata: {
        projectId,
        projectType: project.type.type,
        projectComplexity: project.type.complexity
      },
      timestamp: now,
      governanceContext: {
        policyCompliance: true,
        trustLevel: 0.9,
        qualityScore: 0.8
      }
    });
    
    return project;
  }

  /**
   * Get a project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    const project = this.projects.get(projectId);
    if (project) {
      // Update last accessed time
      project.lastAccessedAt = new Date();
      this.projects.set(projectId, project);
    }
    return project || null;
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const existingProject = this.projects.get(projectId);
    if (!existingProject) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    const updatedProject: Project = {
      ...existingProject,
      ...updates,
      id: projectId, // Ensure ID cannot be changed
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: 'current_user', // In real implementation, get from context
      actorType: 'user',
      action: 'update_project',
      category: 'configuration_change',
      description: `Updated project: ${updatedProject.name}`,
      affectedResources: [projectId],
      beforeState: existingProject,
      afterState: updatedProject,
      riskLevel: 'low',
      complianceImpact: [],
      approvalRequired: false,
      approvals: [],
      tags: ['project_update']
    });
    
    return updatedProject;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) {
      return false;
    }
    
    // Add audit entry before deletion
    await this.addAuditEntry(projectId, {
      actor: 'current_user',
      actorType: 'user',
      action: 'delete_project',
      category: 'collaboration',
      description: `Deleted project: ${project.name}`,
      affectedResources: [projectId],
      beforeState: project,
      riskLevel: 'high',
      complianceImpact: ['data_retention'],
      approvalRequired: true,
      approvals: [],
      tags: ['project_deletion']
    });
    
    // Remove all related data
    this.projects.delete(projectId);
    this.projectVersions.delete(projectId);
    this.projectFiles.delete(projectId);
    this.auditEntries.delete(projectId);
    this.buildRecords.delete(projectId);
    this.deploymentRecords.delete(projectId);
    
    return true;
  }

  /**
   * List projects for a user
   */
  async listProjects(userId: string, filters?: ProjectFilters): Promise<ProjectSummary[]> {
    const projects = Array.from(this.projects.values())
      .filter(project => {
        // Check if user has access to the project
        const hasAccess = project.createdBy === userId || 
          project.collaborators.some(c => c.userId === userId) ||
          project.visibility === 'public';
        
        if (!hasAccess) return false;
        
        // Apply filters
        if (filters) {
          if (filters.type && project.type.type !== filters.type) return false;
          if (filters.status && project.status.phase !== filters.status) return false;
          if (filters.visibility && project.visibility !== filters.visibility) return false;
          if (filters.complexity && project.type.complexity !== filters.complexity) return false;
          if (filters.tags && !filters.tags.some(tag => project.tags.includes(tag))) return false;
          if (filters.createdAfter && project.createdAt < filters.createdAfter) return false;
          if (filters.createdBefore && project.createdAt > filters.createdBefore) return false;
          if (filters.updatedAfter && project.updatedAt < filters.updatedAfter) return false;
          if (filters.updatedBefore && project.updatedAt > filters.updatedBefore) return false;
          if (filters.collaboratorId && !project.collaborators.some(c => c.userId === filters.collaboratorId)) return false;
        }
        
        return true;
      })
      .map(project => this.projectToSummary(project))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return projects;
  }

  /**
   * Search projects
   */
  async searchProjects(query: string, filters?: ProjectFilters): Promise<ProjectSummary[]> {
    const lowerQuery = query.toLowerCase();
    
    const projects = Array.from(this.projects.values())
      .filter(project => {
        // Search in name, description, and tags
        const matchesQuery = project.name.toLowerCase().includes(lowerQuery) ||
          project.description.toLowerCase().includes(lowerQuery) ||
          project.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        
        if (!matchesQuery) return false;
        
        // Apply filters (same as listProjects)
        if (filters) {
          if (filters.type && project.type.type !== filters.type) return false;
          if (filters.status && project.status.phase !== filters.status) return false;
          if (filters.visibility && project.visibility !== filters.visibility) return false;
          if (filters.complexity && project.type.complexity !== filters.complexity) return false;
          if (filters.tags && !filters.tags.some(tag => project.tags.includes(tag))) return false;
        }
        
        return true;
      })
      .map(project => this.projectToSummary(project))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return projects;
  }

  /**
   * Create a new version
   */
  async createVersion(projectId: string, versionData: Omit<ProjectVersion, 'createdAt'>): Promise<ProjectVersion> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    const version: ProjectVersion = {
      ...versionData,
      createdAt: new Date()
    };
    
    let versions = this.projectVersions.get(projectId);
    if (!versions) {
      versions = new Map();
      this.projectVersions.set(projectId, versions);
    }
    
    versions.set(version.version, version);
    
    // Update project's current version
    project.currentVersion = version.version;
    project.versionHistory = Array.from(versions.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    this.projects.set(projectId, project);
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: version.createdBy,
      actorType: 'user',
      action: 'create_version',
      category: 'configuration_change',
      description: `Created version: ${version.version}`,
      affectedResources: [projectId],
      riskLevel: 'medium',
      complianceImpact: ['version_control'],
      approvalRequired: false,
      approvals: [],
      tags: ['version_creation']
    });
    
    return version;
  }

  /**
   * Get all versions for a project
   */
  async getVersions(projectId: string): Promise<ProjectVersion[]> {
    const versions = this.projectVersions.get(projectId);
    if (!versions) {
      return [];
    }
    
    return Array.from(versions.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get a specific version
   */
  async getVersion(projectId: string, version: string): Promise<ProjectVersion | null> {
    const versions = this.projectVersions.get(projectId);
    if (!versions) {
      return null;
    }
    
    return versions.get(version) || null;
  }

  /**
   * Restore a project to a specific version
   */
  async restoreVersion(projectId: string, version: string): Promise<Project> {
    const project = this.projects.get(projectId);
    const versionData = await this.getVersion(projectId, version);
    
    if (!project || !versionData) {
      throw new Error(`Project or version not found: ${projectId}@${version}`);
    }
    
    // In a real implementation, this would restore file contents, configuration, etc.
    // For now, we'll just update the current version
    project.currentVersion = version;
    project.updatedAt = new Date();
    this.projects.set(projectId, project);
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: 'current_user',
      actorType: 'user',
      action: 'restore_version',
      category: 'configuration_change',
      description: `Restored project to version: ${version}`,
      affectedResources: [projectId],
      riskLevel: 'high',
      complianceImpact: ['version_control', 'data_integrity'],
      approvalRequired: true,
      approvals: [],
      tags: ['version_restore']
    });
    
    return project;
  }

  /**
   * Save a file to a project
   */
  async saveFile(projectId: string, file: ProjectFile): Promise<ProjectFile> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    let files = this.projectFiles.get(projectId);
    if (!files) {
      files = new Map();
      this.projectFiles.set(projectId, files);
    }
    
    const existingFile = files.get(file.path);
    const isNewFile = !existingFile;
    
    // Update file metadata
    const now = new Date();
    if (isNewFile) {
      file.createdAt = now;
      file.createdBy = file.createdBy || 'current_user';
    }
    file.updatedAt = now;
    file.lastModifiedBy = file.lastModifiedBy || 'current_user';
    
    // Add change record
    const changeRecord: FileChangeRecord = {
      id: this.generateId(),
      timestamp: now,
      author: file.lastModifiedBy,
      type: isNewFile ? 'created' : 'modified',
      description: isNewFile ? `Created file: ${file.name}` : `Modified file: ${file.name}`,
      agentGenerated: file.assignedAgent !== undefined
    };
    
    if (!file.changeHistory) {
      file.changeHistory = [];
    }
    file.changeHistory.push(changeRecord);
    
    files.set(file.path, file);
    
    // Update project file structure
    project.fileStructure.files = Array.from(files.values());
    project.fileStructure.totalFiles = files.size;
    project.fileStructure.totalSize = Array.from(files.values()).reduce((sum, f) => sum + f.size, 0);
    project.fileStructure.lastScan = now;
    project.updatedAt = now;
    this.projects.set(projectId, project);
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: file.lastModifiedBy,
      actorType: file.assignedAgent ? 'agent' : 'user',
      action: isNewFile ? 'create_file' : 'modify_file',
      category: 'file_change',
      description: `${isNewFile ? 'Created' : 'Modified'} file: ${file.path}`,
      affectedResources: [projectId, file.path],
      beforeState: existingFile,
      afterState: file,
      riskLevel: 'low',
      complianceImpact: [],
      approvalRequired: false,
      approvals: [],
      tags: ['file_operation']
    });
    
    return file;
  }

  /**
   * Get a file from a project
   */
  async getFile(projectId: string, filePath: string): Promise<ProjectFile | null> {
    const files = this.projectFiles.get(projectId);
    if (!files) {
      return null;
    }
    
    return files.get(filePath) || null;
  }

  /**
   * Delete a file from a project
   */
  async deleteFile(projectId: string, filePath: string): Promise<boolean> {
    const files = this.projectFiles.get(projectId);
    if (!files) {
      return false;
    }
    
    const file = files.get(filePath);
    if (!file) {
      return false;
    }
    
    files.delete(filePath);
    
    // Update project file structure
    const project = this.projects.get(projectId);
    if (project) {
      project.fileStructure.files = Array.from(files.values());
      project.fileStructure.totalFiles = files.size;
      project.fileStructure.totalSize = Array.from(files.values()).reduce((sum, f) => sum + f.size, 0);
      project.fileStructure.lastScan = new Date();
      project.updatedAt = new Date();
      this.projects.set(projectId, project);
    }
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: 'current_user',
      actorType: 'user',
      action: 'delete_file',
      category: 'file_change',
      description: `Deleted file: ${filePath}`,
      affectedResources: [projectId, filePath],
      beforeState: file,
      riskLevel: 'medium',
      complianceImpact: ['data_retention'],
      approvalRequired: false,
      approvals: [],
      tags: ['file_deletion']
    });
    
    return true;
  }

  /**
   * List files in a project directory
   */
  async listFiles(projectId: string, directory?: string): Promise<ProjectFile[]> {
    const files = this.projectFiles.get(projectId);
    if (!files) {
      return [];
    }
    
    const allFiles = Array.from(files.values());
    
    if (!directory) {
      return allFiles;
    }
    
    return allFiles.filter(file => file.path.startsWith(directory));
  }

  /**
   * Add a collaborator to a project
   */
  async addCollaborator(projectId: string, collaboratorData: Omit<ProjectCollaborator, 'joinedAt' | 'lastActiveAt'>): Promise<ProjectCollaborator> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    // Check if collaborator already exists
    const existingCollaborator = project.collaborators.find(c => c.userId === collaboratorData.userId);
    if (existingCollaborator) {
      throw new Error(`User is already a collaborator: ${collaboratorData.userId}`);
    }
    
    const collaborator: ProjectCollaborator = {
      ...collaboratorData,
      joinedAt: new Date(),
      lastActiveAt: new Date()
    };
    
    project.collaborators.push(collaborator);
    project.updatedAt = new Date();
    this.projects.set(projectId, project);
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: collaborator.invitedBy,
      actorType: 'user',
      action: 'add_collaborator',
      category: 'collaboration',
      description: `Added collaborator: ${collaborator.username} (${collaborator.role.name})`,
      affectedResources: [projectId],
      riskLevel: 'medium',
      complianceImpact: ['access_control'],
      approvalRequired: false,
      approvals: [],
      tags: ['collaboration']
    });
    
    return collaborator;
  }

  /**
   * Remove a collaborator from a project
   */
  async removeCollaborator(projectId: string, userId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) {
      return false;
    }
    
    const collaboratorIndex = project.collaborators.findIndex(c => c.userId === userId);
    if (collaboratorIndex === -1) {
      return false;
    }
    
    const collaborator = project.collaborators[collaboratorIndex];
    project.collaborators.splice(collaboratorIndex, 1);
    project.updatedAt = new Date();
    this.projects.set(projectId, project);
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: 'current_user',
      actorType: 'user',
      action: 'remove_collaborator',
      category: 'collaboration',
      description: `Removed collaborator: ${collaborator.username}`,
      affectedResources: [projectId],
      riskLevel: 'medium',
      complianceImpact: ['access_control'],
      approvalRequired: false,
      approvals: [],
      tags: ['collaboration']
    });
    
    return true;
  }

  /**
   * Update a collaborator's role
   */
  async updateCollaboratorRole(projectId: string, userId: string, role: CollaboratorRole): Promise<ProjectCollaborator> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    const collaborator = project.collaborators.find(c => c.userId === userId);
    if (!collaborator) {
      throw new Error(`Collaborator not found: ${userId}`);
    }
    
    const oldRole = collaborator.role;
    collaborator.role = role;
    collaborator.lastActiveAt = new Date();
    project.updatedAt = new Date();
    this.projects.set(projectId, project);
    
    // Add audit entry
    await this.addAuditEntry(projectId, {
      actor: 'current_user',
      actorType: 'user',
      action: 'update_collaborator_role',
      category: 'collaboration',
      description: `Updated collaborator role: ${collaborator.username} from ${oldRole.name} to ${role.name}`,
      affectedResources: [projectId],
      beforeState: { role: oldRole },
      afterState: { role },
      riskLevel: 'medium',
      complianceImpact: ['access_control'],
      approvalRequired: false,
      approvals: [],
      tags: ['collaboration', 'role_change']
    });
    
    return collaborator;
  }

  /**
   * Get all collaborators for a project
   */
  async getCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
    const project = this.projects.get(projectId);
    if (!project) {
      return [];
    }
    
    return project.collaborators;
  }

  /**
   * Create a template from a project
   */
  async createTemplate(project: Project, metadata: TemplateMetadata): Promise<Template> {
    const templateId = this.generateId();
    
    const template: Template = {
      id: templateId,
      project: {
        ...project,
        id: this.generateId(), // New ID for template project
        isTemplate: true,
        templateMetadata: metadata
      },
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.templates.set(templateId, template);
    
    return template;
  }

  /**
   * Get a template by ID
   */
  async getTemplate(templateId: string): Promise<Template | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * List available templates
   */
  async listTemplates(filters?: TemplateFilters): Promise<TemplateSummary[]> {
    const templates = Array.from(this.templates.values())
      .filter(template => {
        if (filters) {
          if (filters.category && template.metadata.category !== filters.category) return false;
          if (filters.complexity && template.metadata.complexity !== filters.complexity) return false;
          if (filters.rating && template.metadata.rating < filters.rating) return false;
          if (filters.maintainer && template.metadata.maintainer !== filters.maintainer) return false;
          if (filters.tags && !filters.tags.some(tag => template.metadata.tags.includes(tag))) return false;
        }
        return true;
      })
      .map(template => this.templateToSummary(template))
      .sort((a, b) => b.rating - a.rating);
    
    return templates;
  }

  /**
   * Instantiate a template to create a new project
   */
  async instantiateTemplate(templateId: string, customization: TemplateCustomization): Promise<Project> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Create new project based on template
    const projectData = {
      ...template.project,
      name: customization.projectName,
      description: customization.projectDescription,
      isTemplate: false,
      templateMetadata: undefined,
      collaborators: [],
      versionHistory: [],
      auditTrail: [],
      deploymentHistory: []
    };
    
    // Apply customizations
    // In a real implementation, this would process customFields and selectedFeatures
    // to modify the project structure, configuration, etc.
    
    const project = await this.createProject(projectData);
    
    // Update template usage statistics
    template.metadata.usageCount++;
    template.updatedAt = new Date();
    this.templates.set(templateId, template);
    
    return project;
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(projectId: string, timeRange?: TimeRange): Promise<ProjectAnalytics> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    // In a real implementation, this would calculate actual analytics
    // For now, return mock data
    return this.generateMockAnalytics(project);
  }

  /**
   * Get aggregated analytics for multiple projects
   */
  async getAggregatedAnalytics(projectIds: string[], timeRange?: TimeRange): Promise<AggregatedAnalytics> {
    const projects = projectIds.map(id => this.projects.get(id)).filter(p => p !== undefined) as Project[];
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status.phase === 'development').length,
      totalCollaborators: new Set(projects.flatMap(p => p.collaborators.map(c => c.userId))).size,
      totalBuilds: projects.reduce((sum, p) => sum + (this.buildRecords.get(p.id)?.length || 0), 0),
      totalDeployments: projects.reduce((sum, p) => sum + (this.deploymentRecords.get(p.id)?.length || 0), 0),
      averageQuality: projects.reduce((sum, p) => sum + (p.analytics?.quality?.overallQuality || 0), 0) / projects.length,
      trends: []
    };
  }

  /**
   * Get audit trail for a project
   */
  async getAuditTrail(projectId: string, filters?: AuditFilters): Promise<ProjectAuditEntry[]> {
    const entries = this.auditEntries.get(projectId) || [];
    
    if (!filters) {
      return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    
    return entries
      .filter(entry => {
        if (filters.actor && entry.actor !== filters.actor) return false;
        if (filters.actorType && entry.actorType !== filters.actorType) return false;
        if (filters.action && entry.action !== filters.action) return false;
        if (filters.category && entry.category !== filters.category) return false;
        if (filters.riskLevel && entry.riskLevel !== filters.riskLevel) return false;
        if (filters.startDate && entry.timestamp < filters.startDate) return false;
        if (filters.endDate && entry.timestamp > filters.endDate) return false;
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Add an audit entry
   */
  async addAuditEntry(projectId: string, entryData: Omit<ProjectAuditEntry, 'id' | 'timestamp'>): Promise<ProjectAuditEntry> {
    const entry: ProjectAuditEntry = {
      ...entryData,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    let entries = this.auditEntries.get(projectId);
    if (!entries) {
      entries = [];
      this.auditEntries.set(projectId, entries);
    }
    
    entries.push(entry);
    
    return entry;
  }

  /**
   * Save a build record
   */
  async saveBuildRecord(projectId: string, buildRecord: BuildRecord): Promise<BuildRecord> {
    let records = this.buildRecords.get(projectId);
    if (!records) {
      records = [];
      this.buildRecords.set(projectId, records);
    }
    
    records.push(buildRecord);
    
    // Update project status
    const project = this.projects.get(projectId);
    if (project) {
      project.status.lastBuildStatus = buildRecord.status;
      project.updatedAt = new Date();
      this.projects.set(projectId, project);
    }
    
    return buildRecord;
  }

  /**
   * Save a deployment record
   */
  async saveDeploymentRecord(projectId: string, deploymentRecord: DeploymentRecord): Promise<DeploymentRecord> {
    let records = this.deploymentRecords.get(projectId);
    if (!records) {
      records = [];
      this.deploymentRecords.set(projectId, records);
    }
    
    records.push(deploymentRecord);
    
    // Update project status
    const project = this.projects.get(projectId);
    if (project) {
      project.status.deploymentStatus = deploymentRecord.status;
      project.deploymentHistory = records;
      project.updatedAt = new Date();
      this.projects.set(projectId, project);
    }
    
    return deploymentRecord;
  }

  /**
   * Get build history for a project
   */
  async getBuildHistory(projectId: string): Promise<BuildRecord[]> {
    return this.buildRecords.get(projectId) || [];
  }

  /**
   * Get deployment history for a project
   */
  async getDeploymentHistory(projectId: string): Promise<DeploymentRecord[]> {
    return this.deploymentRecords.get(projectId) || [];
  }

  // Helper methods

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert project to summary
   */
  private projectToSummary(project: Project): ProjectSummary {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastAccessedAt: project.lastAccessedAt,
      collaborators: project.collaborators.length,
      tags: project.tags,
      visibility: project.visibility
    };
  }

  /**
   * Convert template to summary
   */
  private templateToSummary(template: Template): TemplateSummary {
    return {
      id: template.id,
      name: template.metadata.templateName,
      description: template.metadata.templateDescription,
      category: template.metadata.category,
      tags: template.metadata.tags,
      complexity: template.metadata.complexity,
      rating: template.metadata.rating,
      usageCount: template.metadata.usageCount,
      maintainer: template.metadata.maintainer,
      lastUpdated: template.updatedAt
    };
  }

  /**
   * Generate mock analytics for a project
   */
  private generateMockAnalytics(project: Project): ProjectAnalytics {
    const now = new Date();
    const files = this.projectFiles.get(project.id);
    const fileCount = files ? files.size : 0;
    
    return {
      overview: {
        totalFiles: fileCount,
        totalLines: fileCount * 100, // Mock: 100 lines per file
        totalCommits: project.versionHistory.length,
        totalBuilds: this.buildRecords.get(project.id)?.length || 0,
        totalDeployments: this.deploymentRecords.get(project.id)?.length || 0,
        activeCollaborators: project.collaborators.filter(c => c.status === 'active').length,
        lastActivity: project.updatedAt,
        projectAge: Math.floor((now.getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      },
      development: {
        codeVelocity: {
          linesPerDay: 50,
          filesPerDay: 2,
          commitsPerDay: 3,
          velocity7Day: 350,
          velocity30Day: 1500,
          velocityTrend: 'increasing'
        },
        fileActivity: [],
        languageDistribution: [
          { language: 'TypeScript', fileCount: Math.floor(fileCount * 0.6), lineCount: Math.floor(fileCount * 60), percentage: 60 },
          { language: 'JavaScript', fileCount: Math.floor(fileCount * 0.3), lineCount: Math.floor(fileCount * 30), percentage: 30 },
          { language: 'CSS', fileCount: Math.floor(fileCount * 0.1), lineCount: Math.floor(fileCount * 10), percentage: 10 }
        ],
        agentContributions: [],
        developmentTrends: []
      },
      quality: {
        overallQuality: 0.85,
        qualityTrends: [],
        codeSmells: {
          totalSmells: 5,
          smellsByType: { 'code_duplication': 2, 'long_method': 3 },
          smellsBySeverity: { 'minor': 3, 'major': 2 },
          smellTrends: [],
          topFiles: []
        },
        testCoverage: {
          overallCoverage: 80,
          coverageByFile: [],
          coverageByType: [],
          coverageTrends: [],
          uncoveredAreas: []
        },
        securityMetrics: {
          securityScore: 90,
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
          totalDebt: 120, // minutes
          debtRatio: 5, // percentage
          debtByCategory: { 'code_smells': 80, 'duplicated_code': 40 },
          debtTrends: [],
          topDebtFiles: []
        }
      },
      performance: {
        buildPerformance: {
          averageBuildTime: 300, // seconds
          buildSuccessRate: 95,
          buildTrends: [],
          slowestStages: [],
          cacheHitRate: 80
        },
        deploymentPerformance: {
          responseTime: 200,
          throughput: 1000,
          errorRate: 0.1,
          cpuUsage: 50,
          memoryUsage: 60,
          diskUsage: 30
        },
        applicationPerformance: {
          responseTime: 150,
          throughput: 2000,
          errorRate: 0.05,
          availability: 99.9,
          coreWebVitals: {
            largestContentfulPaint: 1200,
            firstInputDelay: 50,
            cumulativeLayoutShift: 0.05,
            firstContentfulPaint: 800,
            timeToInteractive: 1500
          }
        },
        performanceTrends: []
      },
      collaboration: {
        activeCollaborators: project.collaborators.filter(c => c.status === 'active').length,
        collaborationPatterns: [],
        communicationMetrics: {
          totalMessages: 100,
          averageResponseTime: 30, // minutes
          collaborationEvents: 50,
          meetingFrequency: 2, // per week
          documentationUpdates: 10
        },
        workDistribution: [],
        teamEfficiency: {
          overallEfficiency: 0.85,
          velocityConsistency: 0.9,
          qualityConsistency: 0.88,
          collaborationEffectiveness: 0.82,
          knowledgeSharing: 0.75
        }
      },
      deployment: {
        deploymentFrequency: 2, // per week
        deploymentSuccessRate: 95,
        meanTimeToDeployment: 15, // minutes
        meanTimeToRecovery: 30, // minutes
        changeFailureRate: 5, // percentage
        deploymentTrends: []
      }
    };
  }

  /**
   * Generate governance Q&A for project creation
   */
  private async generateProjectCreationQA(project: Project): Promise<void> {
    const qaContext = {
      projectId: project.id,
      projectName: project.name,
      projectType: project.type.type,
      projectComplexity: project.type.complexity,
      createdBy: project.createdBy
    };

    const projectCreationQuestions = [
      "How did you ensure the project structure aligns with best practices and governance requirements?",
      "What security and compliance considerations were incorporated into the project setup?",
      "How were collaboration permissions and access controls configured for this project?",
      "What quality standards and governance policies were applied to this project?",
      "How will project governance and audit requirements be maintained throughout development?",
      "What risk assessment was performed for this project configuration?",
      "How were data governance and privacy requirements addressed in the project setup?",
      "What monitoring and analytics capabilities were enabled for governance oversight?",
      "How will version control and change management be governed in this project?",
      "What documentation and audit trail requirements were established for this project?"
    ];

    // Generate Q&A for both governance systems
    await this.sharedQAService.generateQASession(qaContext, projectCreationQuestions);
    await this.modernChatQAService.generateQASession(qaContext, projectCreationQuestions);
  }
}

