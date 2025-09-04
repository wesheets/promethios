/**
 * Custom GPT Integration Types
 * 
 * Comprehensive type definitions for Custom GPT wrapping, storage, and governance
 */

export interface CustomGPTConfig {
  // Basic Configuration
  url: string;
  name: string;
  description?: string;
  instructions: string;
  
  // Capabilities
  capabilities: CustomGPTCapability[];
  
  // Knowledge Base
  knowledgeFiles: CustomGPTKnowledgeFile[];
  
  // Custom Actions/Tools
  actions: CustomGPTAction[];
  
  // Metadata
  originalGPTId?: string;
  originalGPTUrl?: string;
  importedAt?: Date;
  lastUpdated?: Date;
}

export interface CustomGPTCapability {
  id: string;
  name: string;
  enabled: boolean;
  type: 'web_browsing' | 'dalle' | 'code_interpreter' | 'custom_action';
  description?: string;
  configuration?: Record<string, any>;
}

export interface CustomGPTKnowledgeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  firebaseUrl?: string;
  uploadedAt: Date;
  processed: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface CustomGPTAction {
  id: string;
  name: string;
  description: string;
  schema: OpenAPISchema;
  enabled: boolean;
  usage: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
    lastUsed?: Date;
  };
  configuration: {
    authentication?: {
      type: 'none' | 'api_key' | 'oauth' | 'bearer';
      apiKey?: string;
      headers?: Record<string, string>;
    };
    rateLimit?: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  };
}

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export interface CustomGPTProfile {
  // Agent Identity
  identity: {
    id: string;
    name: string;
    version: string;
    description: string;
    creationDate: Date;
    lastModifiedDate: Date;
  };
  
  // Custom GPT Configuration
  customGPTConfig: {
    originalConfig: CustomGPTConfig;
    preservedContent: {
      instructions: {
        original: string;
        processed: string;
        lastUpdated: Date;
      };
      knowledgeBase: {
        files: CustomGPTKnowledgeFile[];
        totalSize: number;
        lastSync: Date;
      };
      actions: {
        list: CustomGPTAction[];
        totalActions: number;
        activeActions: number;
      };
    };
    commandCenter: {
      iconColor: string;
      displayName: string;
      shortDescription: string;
      tags: string[];
    };
  };
  
  // API Configuration
  apiDetails: {
    endpoint: string;
    key: string;
    provider: 'OpenAI';
    selectedModel: 'gpt-4o';
    selectedCapabilities: string[];
    selectedContextLength: number;
    discoveredInfo: any;
  };
  
  // Governance
  governancePolicy: any;
  trustLevel: 'low' | 'medium' | 'high';
  healthStatus: 'healthy' | 'warning' | 'error';
  
  // Metadata
  metadata: {
    type: 'custom_gpt_wrapped';
    importSource: 'manual_configuration';
    originalGPTUrl?: string;
    originalGPTId?: string;
    createdVia: 'custom_gpt_wizard';
    parentAgentId?: string;
  };
  
  // Usage Metrics
  usage: {
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
    averageResponseTime: number;
    lastUsed?: Date;
    costTracking: {
      totalCost: number;
      costThisMonth: number;
      estimatedMonthlyCost: number;
    };
  };
  
  // Backup & Restore
  backup: {
    lastBackup?: Date;
    backupHistory: CustomGPTBackup[];
    autoBackupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

export interface CustomGPTBackup {
  id: string;
  timestamp: Date;
  version: string;
  size: number;
  firebaseUrl: string;
  metadata: {
    configHash: string;
    fileCount: number;
    actionCount: number;
    description?: string;
  };
  status: 'creating' | 'completed' | 'failed';
}

export interface GovernanceSettings {
  trustLevel: 'low' | 'medium' | 'high';
  complianceLevel: string;
  rateLimiting: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    dailyLimit: number;
  };
  auditLogging: boolean;
  contentFiltering: boolean;
}

export interface CustomGPTCreationResult {
  success: boolean;
  agentId?: string;
  profile?: CustomGPTProfile;
  error?: string;
  warnings?: string[];
}

export interface CustomGPTValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  extractedMetadata?: {
    name: string;
    description: string;
    capabilities: string[];
  };
}

export interface CustomGPTImportProgress {
  stage: 'validating' | 'extracting' | 'uploading' | 'processing' | 'creating' | 'completed';
  progress: number; // 0-100
  message: string;
  details?: {
    filesProcessed?: number;
    totalFiles?: number;
    actionsProcessed?: number;
    totalActions?: number;
  };
}

// Command Center Integration Types
export interface CustomGPTTabProps {
  agentId: string;
  onClose: () => void;
}

export interface CustomGPTTabData {
  profile: CustomGPTProfile;
  files: CustomGPTKnowledgeFile[];
  actions: CustomGPTAction[];
  usage: any;
  backups: CustomGPTBackup[];
}

// Wizard Integration Types
export interface CustomGPTWizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
  isOptional: boolean;
}

export interface CustomGPTConfigurationStepProps {
  config: CustomGPTConfig;
  setConfig: (config: CustomGPTConfig) => void;
}

