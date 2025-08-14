/**
 * Agent Configuration Types
 * 
 * Defines the complete configuration structure for agents including tools,
 * governance, personality, and widget customization settings.
 */

import { WidgetConfig } from '../context/WidgetCustomizerContext';
import { AgentToolProfile } from './ToolTypes';

// ============================================================================
// CORE AGENT CONFIGURATION
// ============================================================================

export interface AgentConfiguration {
  identity: AgentIdentity;
  toolProfile: AgentToolProfile;
  governanceSettings: GovernanceConfiguration;
  widgetCustomization: WidgetConfig;
  personalitySettings: PersonalityConfiguration;
  deploymentSettings: DeploymentConfiguration;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface AgentIdentity {
  id: string;
  name: string;
  description: string;
  type: 'hosted_api' | 'byok' | 'enterprise';
  organizationId: string;
  createdBy: string;
  tags: string[];
}

// ============================================================================
// GOVERNANCE CONFIGURATION
// ============================================================================

export interface GovernanceConfiguration {
  trustManagement: TrustManagementConfig;
  policyEnforcement: PolicyEnforcementConfig;
  auditLogging: AuditLoggingConfig;
  autonomousCognition: AutonomousCognitionConfig;
  toolGovernance: ToolGovernanceConfig;
}

export interface TrustManagementConfig {
  enabled: boolean;
  initialTrustLevel: number;
  trustDecayRate: number;
  trustRecoveryRate: number;
  minimumTrustThreshold: number;
  escalationRules: TrustEscalationRule[];
}

export interface TrustEscalationRule {
  condition: string;
  action: 'warn' | 'restrict' | 'escalate' | 'terminate';
  threshold: number;
}

export interface PolicyEnforcementConfig {
  enabled: boolean;
  strictMode: boolean;
  policies: PolicyRule[];
  violationHandling: 'warn' | 'block' | 'escalate';
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface AuditLoggingConfig {
  enabled: boolean;
  logLevel: 'basic' | 'detailed' | 'comprehensive';
  retentionPeriod: number; // days
  includeToolUsage: boolean;
  includeConversations: boolean;
  includeGovernanceEvents: boolean;
}

export interface AutonomousCognitionConfig {
  enabled: boolean;
  autonomyLevel: number; // 0-100
  selfReflectionEnabled: boolean;
  learningEnabled: boolean;
  adaptationEnabled: boolean;
}

export interface ToolGovernanceConfig {
  requireApproval: boolean;
  approvalThreshold: number;
  restrictedTools: string[];
  toolUsageLimits: ToolUsageLimit[];
  credentialManagement: CredentialManagementConfig;
}

export interface ToolUsageLimit {
  toolName: string;
  maxUsagePerHour: number;
  maxUsagePerDay: number;
  costLimit: number; // USD
}

export interface CredentialManagementConfig {
  encryptionEnabled: boolean;
  rotationPeriod: number; // days
  accessLogging: boolean;
  multiFactorRequired: boolean;
}

// ============================================================================
// PERSONALITY CONFIGURATION
// ============================================================================

export interface PersonalityConfiguration {
  name: string;
  description: string;
  traits: PersonalityTrait[];
  communicationStyle: CommunicationStyle;
  knowledgeBase: KnowledgeBaseConfig;
  responsePatterns: ResponsePattern[];
}

export interface PersonalityTrait {
  name: string;
  value: number; // 0-100
  description: string;
}

export interface CommunicationStyle {
  formality: 'casual' | 'professional' | 'formal';
  verbosity: 'concise' | 'balanced' | 'detailed';
  tone: 'friendly' | 'neutral' | 'authoritative';
  empathy: number; // 0-100
  humor: number; // 0-100
}

export interface KnowledgeBaseConfig {
  sources: KnowledgeSource[];
  updateFrequency: 'real-time' | 'hourly' | 'daily' | 'manual';
  confidenceThreshold: number;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'document' | 'database' | 'api' | 'web';
  url?: string;
  credentials?: string;
  priority: number;
  enabled: boolean;
}

export interface ResponsePattern {
  trigger: string;
  response: string;
  conditions: string[];
  priority: number;
}

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================

export interface DeploymentConfiguration {
  channels: ChannelConfig[];
  scaling: ScalingConfig;
  monitoring: MonitoringConfig;
  backup: BackupConfig;
}

export interface ChannelConfig {
  type: 'website' | 'whatsapp' | 'facebook' | 'slack' | 'teams' | 'api';
  enabled: boolean;
  configuration: Record<string, any>;
  customization: ChannelCustomization;
}

export interface ChannelCustomization {
  branding: BrandingConfig;
  layout: LayoutConfig;
  behavior: BehaviorConfig;
}

export interface BrandingConfig {
  logo?: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    family: string;
    size: number;
    weight: string;
  };
  poweredByVisible: boolean;
}

export interface LayoutConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  size: 'small' | 'medium' | 'large';
  minimizable: boolean;
  draggable: boolean;
}

export interface BehaviorConfig {
  autoOpen: boolean;
  greeting: string;
  placeholder: string;
  showTypingIndicator: boolean;
  showTimestamps: boolean;
  enableAttachments: boolean;
  enableEmojis: boolean;
}

export interface ScalingConfig {
  autoScaling: boolean;
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerting: AlertingConfig;
  dashboards: DashboardConfig[];
}

export interface AlertingConfig {
  enabled: boolean;
  channels: string[];
  thresholds: AlertThreshold[];
}

export interface AlertThreshold {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface DashboardConfig {
  name: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
}

export interface DashboardWidget {
  type: 'metric' | 'chart' | 'table' | 'log';
  title: string;
  query: string;
  size: 'small' | 'medium' | 'large';
}

export interface BackupConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  retention: number; // days
  encryption: boolean;
  offsite: boolean;
}

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

export interface ConfigurationVersion {
  version: string;
  timestamp: string;
  changes: ConfigurationChange[];
  author: string;
  description: string;
}

export interface ConfigurationChange {
  path: string;
  operation: 'create' | 'update' | 'delete';
  oldValue?: any;
  newValue?: any;
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  configuration: Partial<AgentConfiguration>;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
}

// ============================================================================
// RUNTIME CONFIGURATION
// ============================================================================

export interface RuntimeConfiguration {
  agentId: string;
  sessionId: string;
  configuration: AgentConfiguration;
  overrides: ConfigurationOverride[];
  context: RuntimeContext;
}

export interface ConfigurationOverride {
  path: string;
  value: any;
  reason: string;
  expiresAt?: string;
}

export interface RuntimeContext {
  userId?: string;
  organizationId: string;
  channel: string;
  environment: 'development' | 'staging' | 'production';
  region: string;
  features: string[];
}

