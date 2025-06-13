// Chat module types and interfaces
export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  agentId?: string; // For single agent chats
  systemId?: string; // For multi-agent system chats
  content: string;
  type: MessageType;
  sender: MessageSender;
  timestamp: Date;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  governanceMetrics?: GovernanceMetrics;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: AttachmentType;
  size: number;
  url: string;
  mimeType: string;
  uploadedAt: Date;
}

export interface MessageMetadata {
  responseTime?: number;
  tokenCount?: number;
  cost?: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GovernanceMetrics {
  complianceScore: number;
  trustScore: number;
  riskLevel: RiskLevel;
  violations: GovernanceViolation[];
  evaluatedAt: Date;
}

export interface GovernanceViolation {
  type: ViolationType;
  severity: ViolationSeverity;
  description: string;
  recommendation?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  mode: ChatMode;
  agentId?: string; // For single agent sessions
  systemId?: string; // For multi-agent system sessions
  agentIds?: string[]; // For custom multi-agent configurations
  configuration: ChatConfiguration;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  messageCount: number;
  isActive: boolean;
  metadata?: SessionMetadata;
}

export interface ChatConfiguration {
  governanceEnabled: boolean;
  realTimeMonitoring: boolean;
  maxMessages?: number;
  autoSave: boolean;
  allowFileUploads: boolean;
  allowedFileTypes: string[];
  maxFileSize: number;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface SessionMetadata {
  totalCost?: number;
  totalTokens?: number;
  averageResponseTime?: number;
  governanceSummary?: GovernanceSummary;
}

export interface GovernanceSummary {
  averageComplianceScore: number;
  averageTrustScore: number;
  totalViolations: number;
  riskDistribution: Record<RiskLevel, number>;
}

export interface ChatModeConfig {
  mode: ChatMode;
  displayName: string;
  description: string;
  features: ChatFeature[];
  defaultConfiguration: Partial<ChatConfiguration>;
  icon: string;
  color: string;
}

export interface MultiAgentFlowStep {
  id: string;
  agentId: string;
  order: number;
  condition?: string;
  timeout?: number;
  retryCount?: number;
}

export interface MultiAgentConfiguration {
  flowType: MultiAgentFlowType;
  steps: MultiAgentFlowStep[];
  coordinationRules: CoordinationRule[];
  failureHandling: FailureHandlingStrategy;
}

export interface CoordinationRule {
  id: string;
  type: CoordinationType;
  sourceAgentId: string;
  targetAgentId: string;
  condition: string;
  action: CoordinationAction;
}

// Enums
export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  URL = 'url',
  SYSTEM = 'system',
  ERROR = 'error',
  GOVERNANCE_ALERT = 'governance_alert'
}

export enum MessageSender {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system',
  MULTI_AGENT = 'multi_agent'
}

export enum AttachmentType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  SPREADSHEET = 'spreadsheet',
  PDF = 'pdf',
  TEXT = 'text',
  URL = 'url',
  OTHER = 'other'
}

export enum ChatMode {
  STANDARD = 'standard',
  GOVERNANCE = 'governance',
  MULTI_AGENT = 'multi_agent'
}

export enum ChatFeature {
  FILE_UPLOAD = 'file_upload',
  IMAGE_PASTE = 'image_paste',
  URL_PREVIEW = 'url_preview',
  GOVERNANCE_MONITORING = 'governance_monitoring',
  REAL_TIME_METRICS = 'real_time_metrics',
  MULTI_AGENT_ORCHESTRATION = 'multi_agent_orchestration',
  SESSION_EXPORT = 'session_export',
  CONVERSATION_HISTORY = 'conversation_history'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ViolationType {
  CONTENT_POLICY = 'content_policy',
  DATA_PRIVACY = 'data_privacy',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  BIAS = 'bias',
  TOXICITY = 'toxicity',
  MISINFORMATION = 'misinformation'
}

export enum ViolationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum MultiAgentFlowType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  CUSTOM = 'custom'
}

export enum CoordinationType {
  HANDOFF = 'handoff',
  COLLABORATION = 'collaboration',
  VALIDATION = 'validation',
  ESCALATION = 'escalation'
}

export enum CoordinationAction {
  PASS_CONTEXT = 'pass_context',
  MERGE_RESPONSES = 'merge_responses',
  VALIDATE_OUTPUT = 'validate_output',
  ESCALATE_TO_HUMAN = 'escalate_to_human'
}

export enum FailureHandlingStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  ABORT = 'abort',
  HUMAN_INTERVENTION = 'human_intervention'
}

// Chat mode configurations
export const CHAT_MODE_CONFIGS: Record<ChatMode, ChatModeConfig> = {
  [ChatMode.STANDARD]: {
    mode: ChatMode.STANDARD,
    displayName: 'Standard Chat',
    description: 'Basic chat interface with your wrapped agents',
    features: [
      ChatFeature.FILE_UPLOAD,
      ChatFeature.IMAGE_PASTE,
      ChatFeature.URL_PREVIEW,
      ChatFeature.CONVERSATION_HISTORY
    ],
    defaultConfiguration: {
      governanceEnabled: false,
      realTimeMonitoring: false,
      allowFileUploads: true,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'jpg', 'png', 'gif'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      autoSave: true
    },
    icon: 'chat',
    color: '#2196F3'
  },
  [ChatMode.GOVERNANCE]: {
    mode: ChatMode.GOVERNANCE,
    displayName: 'Governance Chat',
    description: 'Chat with real-time governance monitoring and compliance tracking',
    features: [
      ChatFeature.FILE_UPLOAD,
      ChatFeature.IMAGE_PASTE,
      ChatFeature.URL_PREVIEW,
      ChatFeature.GOVERNANCE_MONITORING,
      ChatFeature.REAL_TIME_METRICS,
      ChatFeature.CONVERSATION_HISTORY,
      ChatFeature.SESSION_EXPORT
    ],
    defaultConfiguration: {
      governanceEnabled: true,
      realTimeMonitoring: true,
      allowFileUploads: true,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'jpg', 'png', 'gif'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      autoSave: true
    },
    icon: 'security',
    color: '#4CAF50'
  },
  [ChatMode.MULTI_AGENT]: {
    mode: ChatMode.MULTI_AGENT,
    displayName: 'Multi-Agent Chat',
    description: 'Orchestrate conversations between multiple agents with governance',
    features: [
      ChatFeature.FILE_UPLOAD,
      ChatFeature.IMAGE_PASTE,
      ChatFeature.URL_PREVIEW,
      ChatFeature.GOVERNANCE_MONITORING,
      ChatFeature.REAL_TIME_METRICS,
      ChatFeature.MULTI_AGENT_ORCHESTRATION,
      ChatFeature.CONVERSATION_HISTORY,
      ChatFeature.SESSION_EXPORT
    ],
    defaultConfiguration: {
      governanceEnabled: true,
      realTimeMonitoring: true,
      allowFileUploads: true,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'jpg', 'png', 'gif'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      autoSave: true
    },
    icon: 'group',
    color: '#FF9800'
  }
};

