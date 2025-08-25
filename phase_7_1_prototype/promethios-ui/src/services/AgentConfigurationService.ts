/**
 * Agent Configuration Service
 * 
 * Manages agent configurations including persistence, validation, and runtime loading.
 * Integrates with the Universal Governance Adapter to ensure configurations are
 * properly applied to agent instances.
 */

import {
  AgentConfiguration,
  AgentIdentity,
  GovernanceConfiguration,
  PersonalityConfiguration,
  DeploymentConfiguration,
  ConfigurationVersion,
  ConfigurationTemplate,
  RuntimeConfiguration,
  ConfigurationOverride
} from '../types/AgentConfigurationTypes';
import { AgentToolProfile, DEFAULT_ENABLED_TOOLS, AVAILABLE_TOOLS } from '../types/ToolTypes';
import { WidgetConfig } from '../context/WidgetCustomizerContext';
import FirebaseConfigurationService from './FirebaseConfigurationService';

export class AgentConfigurationService {
  private configurations: Map<string, AgentConfiguration> = new Map();
  private versions: Map<string, ConfigurationVersion[]> = new Map();
  private templates: Map<string, ConfigurationTemplate> = new Map();
  private firebaseService: FirebaseConfigurationService | null = null;

  constructor(userId?: string, organizationId?: string) {
    if (userId) {
      this.firebaseService = new FirebaseConfigurationService(userId, organizationId);
    }
    this.loadConfigurations();
  }

  /**
   * Initialize Firebase service with user context
   */
  initializeFirebase(userId: string, organizationId: string = 'default'): void {
    this.firebaseService = new FirebaseConfigurationService(userId, organizationId);
    smartLogger.smartLog(`🔥 [Config] Firebase service initialized for user ${userId}`);
  }

  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================

  async getConfiguration(agentId: string): Promise<AgentConfiguration | null> {
    try {
      console.log(`📁 [Config] Loading configuration for agent ${agentId}`);
      
      const configuration = await this.loadConfiguration(agentId);
      
      if (configuration) {
        console.log(`✅ [Config] Configuration loaded successfully for agent ${agentId}`);
        return configuration;
      } else {
        console.log(`ℹ️ [Config] No configuration found for agent ${agentId}, will use defaults`);
        return null;
      }
    } catch (error) {
      console.error(`❌ [Config] Failed to load configuration for agent ${agentId}:`, error);
      return null;
    }
  }

  async saveConfiguration(agentId: string, configuration: Partial<AgentConfiguration>): Promise<void> {
    try {
      console.log(`💾 [Config] Saving configuration for agent ${agentId}`);

      // Get existing configuration or create new one
      const existingConfig = await this.loadConfiguration(agentId);
      const fullConfiguration: AgentConfiguration = existingConfig ? {
        ...existingConfig,
        ...configuration,
        updatedAt: new Date().toISOString()
      } : {
        identity: {
          id: agentId,
          name: `Agent ${agentId}`,
          description: 'AI Assistant with comprehensive tool access',
          organizationId: 'default',
          version: '1.0.0',
          ...configuration.identity
        },
        toolProfile: configuration.toolProfile || this.getDefaultToolProfile(),
        governanceSettings: configuration.governanceSettings || this.getDefaultGovernanceSettings(),
        personalitySettings: configuration.personalitySettings || this.getDefaultPersonalitySettings(),
        deploymentSettings: configuration.deploymentSettings || this.getDefaultDeploymentSettings(),
        widgetCustomization: configuration.widgetCustomization || this.getDefaultWidgetConfig(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: configuration.version || 1
      };

      // Validate configuration
      await this.validateConfiguration(fullConfiguration);

      // Save to Firebase if available, otherwise use localStorage
      if (this.firebaseService) {
        await this.firebaseService.saveConfiguration(agentId, fullConfiguration);
      } else {
        await this.persistConfiguration(agentId, fullConfiguration);
      }

      // Update memory cache
      this.configurations.set(agentId, fullConfiguration);

      // Create version entry
      const version = this.createVersionEntry(agentId, fullConfiguration);
      const versions = this.versions.get(agentId) || [];
      versions.push(version);
      this.versions.set(agentId, versions);

      // Notify Universal Governance Adapter of configuration change
      await this.notifyConfigurationChange(agentId, fullConfiguration);

      console.log(`✅ [Config] Configuration saved successfully for agent ${agentId}`);
    } catch (error) {
      console.error(`❌ [Config] Failed to save configuration for agent ${agentId}:`, error);
      throw error;
    }
  }

  async loadConfiguration(agentId: string): Promise<AgentConfiguration | null> {
    try {
      console.log(`📁 [Config] Loading configuration for agent ${agentId}`);
      
      // Try to load from memory cache first
      let configuration = this.configurations.get(agentId);
      
      if (!configuration) {
        // Load from Firebase if available, otherwise use localStorage
        if (this.firebaseService) {
          configuration = await this.firebaseService.loadConfiguration(agentId);
        } else {
          configuration = await this.loadFromStorage(agentId);
        }
        
        if (configuration) {
          this.configurations.set(agentId, configuration);
        }
      }

      if (configuration) {
        console.log(`✅ [Config] Configuration loaded successfully for agent ${agentId}`);
        return configuration;
      } else {
        console.log(`ℹ️ [Config] No configuration found for agent ${agentId}, creating default configuration`);
        
        // Create default configuration
        const defaultConfig = this.createDefaultConfiguration(agentId);
        await this.saveConfiguration(agentId, defaultConfig);
        
        return defaultConfig;
      }
    } catch (error) {
      console.error(`❌ [Config] Failed to load configuration for agent ${agentId}:`, error);
      return null;
    }
  }

  async updateToolProfile(agentId: string, toolProfile: AgentToolProfile): Promise<void> {
    try {
      console.log(`🛠️ [Config] Updating tool profile for agent ${agentId}`);

      // Update via Firebase if available
      if (this.firebaseService) {
        await this.firebaseService.updateToolProfile(agentId, toolProfile);
      } else {
        // Fallback to full configuration update
        const configuration = await this.loadConfiguration(agentId);
        if (!configuration) {
          throw new Error(`Agent configuration not found: ${agentId}`);
        }
        configuration.toolProfile = toolProfile;
        await this.saveConfiguration(agentId, configuration);
      }

      // Update memory cache
      const cachedConfig = this.configurations.get(agentId);
      if (cachedConfig) {
        cachedConfig.toolProfile = toolProfile;
        cachedConfig.updatedAt = new Date().toISOString();
        this.configurations.set(agentId, cachedConfig);
      }

      console.log(`✅ [Config] Tool profile updated successfully for agent ${agentId}`);
    } catch (error) {
      console.error(`❌ [Config] Failed to update tool profile for agent ${agentId}:`, error);
      throw error;
    }
  }

  async updateGovernanceSettings(agentId: string, governanceSettings: GovernanceConfiguration): Promise<void> {
    const configuration = await this.loadConfiguration(agentId);
    if (!configuration) {
      throw new Error(`Agent configuration not found: ${agentId}`);
    }

    configuration.governanceSettings = governanceSettings;
    await this.saveConfiguration(agentId, configuration);
  }

  async updateWidgetCustomization(agentId: string, widgetCustomization: WidgetConfig): Promise<void> {
    const configuration = await this.loadConfiguration(agentId);
    if (!configuration) {
      throw new Error(`Agent configuration not found: ${agentId}`);
    }

    configuration.widgetCustomization = widgetCustomization;
    await this.saveConfiguration(agentId, configuration);
  }

  // ============================================================================
  // RUNTIME CONFIGURATION
  // ============================================================================

  async getRuntimeConfiguration(agentId: string, sessionId: string, context: any): Promise<RuntimeConfiguration> {
    const baseConfiguration = await this.loadConfiguration(agentId);
    if (!baseConfiguration) {
      throw new Error(`Agent configuration not found: ${agentId}`);
    }

    // Apply any runtime overrides
    const overrides = await this.getConfigurationOverrides(agentId, context);
    const configuration = this.applyOverrides(baseConfiguration, overrides);

    return {
      agentId,
      sessionId,
      configuration,
      overrides,
      context: {
        userId: context.userId,
        organizationId: baseConfiguration.identity.organizationId,
        channel: context.channel || 'web',
        environment: process.env.NODE_ENV as any || 'development',
        region: context.region || 'us-east-1',
        features: this.getEnabledFeatures(configuration)
      }
    };
  }

  async applyConfigurationOverrides(agentId: string, overrides: ConfigurationOverride[]): Promise<void> {
    const configuration = await this.loadConfiguration(agentId);
    if (!configuration) {
      throw new Error(`Agent configuration not found: ${agentId}`);
    }

    const updatedConfiguration = this.applyOverrides(configuration, overrides);
    await this.saveConfiguration(agentId, updatedConfiguration);
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  async createTemplate(template: ConfigurationTemplate): Promise<void> {
    this.templates.set(template.id, template);
    await this.persistTemplate(template);
  }

  async getTemplate(templateId: string): Promise<ConfigurationTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async listTemplates(category?: string): Promise<ConfigurationTemplate[]> {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.category === category) : templates;
  }

  async createAgentFromTemplate(templateId: string, identity: AgentIdentity): Promise<AgentConfiguration> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const configuration: AgentConfiguration = {
      identity,
      toolProfile: template.configuration.toolProfile || this.getDefaultToolProfile(),
      governanceSettings: template.configuration.governanceSettings || this.getDefaultGovernanceSettings(),
      widgetCustomization: template.configuration.widgetCustomization || this.getDefaultWidgetConfig(),
      personalitySettings: template.configuration.personalitySettings || this.getDefaultPersonalitySettings(),
      deploymentSettings: template.configuration.deploymentSettings || this.getDefaultDeploymentSettings(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    await this.saveConfiguration(identity.id, configuration);
    return configuration;
  }

  // ============================================================================
  // VALIDATION & UTILITIES
  // ============================================================================

  private async validateConfiguration(configuration: AgentConfiguration): Promise<void> {
    // Validate identity
    if (!configuration.identity.id || !configuration.identity.name) {
      throw new Error('Agent identity must have id and name');
    }

    // Validate tool profile
    if (configuration.toolProfile.enabledTools.length === 0) {
      console.warn('⚠️ [Config] Agent has no enabled tools');
    }

    // Validate governance settings
    if (configuration.governanceSettings.trustManagement.enabled) {
      if (configuration.governanceSettings.trustManagement.initialTrustLevel < 0 || 
          configuration.governanceSettings.trustManagement.initialTrustLevel > 100) {
        throw new Error('Trust level must be between 0 and 100');
      }
    }

    // Validate tool credentials
    for (const tool of configuration.toolProfile.enabledTools) {
      if (tool.requiresCredentials && !tool.credentials) {
        throw new Error(`Tool ${tool.name} requires credentials but none provided`);
      }
    }
  }

  private createVersionEntry(agentId: string, configuration: AgentConfiguration): ConfigurationVersion {
    const existingVersions = this.versions.get(agentId) || [];
    const versionNumber = existingVersions.length + 1;

    return {
      version: `${versionNumber}.0.0`,
      timestamp: new Date().toISOString(),
      changes: [], // TODO: Calculate changes from previous version
      author: 'system', // TODO: Get from context
      description: `Configuration update ${versionNumber}`
    };
  }

  private applyOverrides(configuration: AgentConfiguration, overrides: ConfigurationOverride[]): AgentConfiguration {
    const result = JSON.parse(JSON.stringify(configuration)); // Deep clone

    for (const override of overrides) {
      // Check if override is still valid
      if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
        continue;
      }

      // Apply override using path notation (e.g., "governanceSettings.trustManagement.initialTrustLevel")
      this.setNestedProperty(result, override.path, override.value);
    }

    return result;
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  private getEnabledFeatures(configuration: AgentConfiguration): string[] {
    const features: string[] = [];

    if (configuration.governanceSettings.trustManagement.enabled) {
      features.push('trust_management');
    }
    if (configuration.governanceSettings.policyEnforcement.enabled) {
      features.push('policy_enforcement');
    }
    if (configuration.governanceSettings.auditLogging.enabled) {
      features.push('audit_logging');
    }
    if (configuration.governanceSettings.autonomousCognition.enabled) {
      features.push('autonomous_cognition');
    }
    if (configuration.toolProfile.enabledTools.length > 0) {
      features.push('tool_usage');
    }

    return features;
  }

  // ============================================================================
  // PERSISTENCE LAYER
  // ============================================================================

  private async persistConfiguration(agentId: string, configuration: AgentConfiguration): Promise<void> {
    // TODO: Implement actual persistence to database/storage
    localStorage.setItem(`agent_config_${agentId}`, JSON.stringify(configuration));
  }

  private async loadFromStorage(agentId: string): Promise<AgentConfiguration | null> {
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(`agent_config_${agentId}`);
      if (stored) {
        console.log(`📁 [Config] Found stored configuration for agent ${agentId}`);
        return JSON.parse(stored);
      }

      // If no stored configuration, create a default one
      console.log(`🔧 [Config] No stored configuration found for agent ${agentId}, creating default configuration`);
      
      const defaultConfig: AgentConfiguration = {
        identity: {
          id: agentId,
          name: `Agent ${agentId}`,
          description: 'AI Assistant with comprehensive tool access',
          organizationId: 'default',
          version: '1.0.0'
        },
        toolProfile: this.getDefaultToolProfile(),
        governanceSettings: this.getDefaultGovernanceSettings(),
        personalitySettings: this.getDefaultPersonalitySettings(),
        deploymentSettings: this.getDefaultDeploymentSettings(),
        widgetCustomization: this.getDefaultWidgetConfig(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      // Save the default configuration for future use
      await this.saveConfiguration(agentId, defaultConfig);
      
      console.log(`✅ [Config] Default configuration created and saved for agent ${agentId}`);
      return defaultConfig;
    } catch (error) {
      console.error(`❌ [Config] Failed to load/create configuration for agent ${agentId}:`, error);
      return null;
    }
  }

  private async persistTemplate(template: ConfigurationTemplate): Promise<void> {
    // TODO: Implement actual persistence to database/storage
    localStorage.setItem(`agent_template_${template.id}`, JSON.stringify(template));
  }

  private async loadConfigurations(): Promise<void> {
    // TODO: Load all configurations from persistent storage
    console.log('📁 [Config] Loading agent configurations from storage');
  }

  private async getConfigurationOverrides(agentId: string, context: any): Promise<ConfigurationOverride[]> {
    // TODO: Load any runtime overrides for this agent/context
    return [];
  }

  private async notifyConfigurationChange(agentId: string, configuration: AgentConfiguration): Promise<void> {
    // TODO: Notify Universal Governance Adapter and other services of configuration change
    console.log(`🔄 [Config] Configuration changed for agent ${agentId}`);
  }

  // ============================================================================
  // DEFAULT CONFIGURATIONS
  // ============================================================================

  /**
   * Create a default configuration for a new agent
   */
  private createDefaultConfiguration(agentId: string): AgentConfiguration {
    return {
      identity: {
        id: agentId,
        name: `Agent ${agentId}`,
        description: 'AI Assistant with comprehensive tool access',
        organizationId: 'default',
        version: '1.0.0'
      },
      toolProfile: this.getDefaultToolProfile(),
      governanceSettings: this.getDefaultGovernanceSettings(),
      personalitySettings: this.getDefaultPersonalitySettings(),
      deploymentSettings: this.getDefaultDeploymentSettings(),
      widgetCustomization: this.getDefaultWidgetConfig(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
  }

  private getDefaultToolProfile(): AgentToolProfile {
    // Enable all tools by default (since we removed payment gates)
    const enabledTools = DEFAULT_ENABLED_TOOLS.map(toolId => {
      const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
      return {
        name: tool?.name || toolId,
        enabled: true,
        tier: tool?.tier || 'basic',
        category: tool?.category || 'general',
        configuration: tool?.configuration || {},
        credentials: tool?.credentials || {}
      };
    });

    return {
      agentId: '',
      enabledTools,
      toolConfigurations: {},
      lastUpdated: new Date(),
      totalToolsEnabled: enabledTools.length,
      enterpriseToolsEnabled: enabledTools.filter(t => t.tier === 'enterprise').length
    };
  }

  private getDefaultGovernanceSettings(): GovernanceConfiguration {
    return {
      trustManagement: {
        enabled: true,
        initialTrustLevel: 75,
        trustDecayRate: 0.1,
        trustRecoveryRate: 0.05,
        minimumTrustThreshold: 50,
        escalationRules: []
      },
      policyEnforcement: {
        enabled: true,
        strictMode: false,
        policies: [],
        violationHandling: 'warn'
      },
      auditLogging: {
        enabled: true,
        logLevel: 'detailed',
        retentionPeriod: 90,
        includeToolUsage: true,
        includeConversations: true,
        includeGovernanceEvents: true
      },
      autonomousCognition: {
        enabled: true,
        autonomyLevel: 50,
        selfReflectionEnabled: true,
        learningEnabled: true,
        adaptationEnabled: true
      },
      toolGovernance: {
        requireApproval: false,
        approvalThreshold: 80,
        restrictedTools: [],
        toolUsageLimits: [],
        credentialManagement: {
          encryptionEnabled: true,
          rotationPeriod: 90,
          accessLogging: true,
          multiFactorRequired: false
        }
      }
    };
  }

  private getDefaultWidgetConfig(): WidgetConfig {
    return {
      colors: {
        primary: '#3b82f6',
        secondary: '#1e293b',
        userBubble: '#3b82f6',
        botBubble: '#f3f4f6',
        background: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'Regular (400)'
      },
      layout: {
        borderRadius: 12,
        spacing: 16,
        maxWidth: 380
      },
      chatBubbles: {
        userBubbleColor: '#3b82f6',
        botBubbleColor: '#f3f4f6',
        borderRadius: 18,
        spacing: 8,
        maxWidth: 280,
        showDropShadow: true
      },
      branding: {
        showPoweredBy: true,
        customLogo: null,
        customCSS: ''
      },
      animations: {
        enableAnimations: true,
        typingIndicator: true,
        messageAnimations: true,
        hoverEffects: true,
        showThinkingIndicator: true,
        animationSpeed: 300,
        enableSounds: false
      },
      behavior: {
        position: 'bottom-right',
        minimizable: true,
        draggable: false,
        autoOpen: false,
        placeholder: 'Type your message...',
        showAttachmentsButton: true,
        showEmojiButton: true,
        showSendButton: true,
        showTimestamps: false
      },
      widgetAppearance: {
        initialState: 'bubble',
        bubbleText: 'Chat with us',
        bubbleIcon: '💬'
      }
    };
  }

  private getDefaultPersonalitySettings(): PersonalityConfiguration {
    return {
      name: 'Professional Assistant',
      description: 'A helpful and professional AI assistant',
      traits: [
        { name: 'Helpfulness', value: 90, description: 'Eagerness to assist users' },
        { name: 'Professionalism', value: 85, description: 'Maintains professional demeanor' },
        { name: 'Empathy', value: 70, description: 'Understanding of user emotions' },
        { name: 'Accuracy', value: 95, description: 'Commitment to providing accurate information' }
      ],
      communicationStyle: {
        formality: 'professional',
        verbosity: 'balanced',
        tone: 'friendly',
        empathy: 70,
        humor: 30
      },
      knowledgeBase: {
        sources: [],
        updateFrequency: 'daily',
        confidenceThreshold: 0.8
      },
      responsePatterns: []
    };
  }

  private getDefaultDeploymentSettings(): DeploymentConfiguration {
    return {
      channels: [
        {
          type: 'website',
          enabled: true,
          configuration: {},
          customization: {
            branding: {
              colors: {
                primary: '#3b82f6',
                secondary: '#1e293b',
                background: '#ffffff',
                text: '#1f2937'
              },
              fonts: {
                family: 'Inter',
                size: 14,
                weight: 'normal'
              },
              poweredByVisible: true
            },
            layout: {
              position: 'bottom-right',
              size: 'medium',
              minimizable: true,
              draggable: false
            },
            behavior: {
              autoOpen: false,
              greeting: 'Hello! How can I help you today?',
              placeholder: 'Type your message...',
              showTypingIndicator: true,
              showTimestamps: false,
              enableAttachments: true,
              enableEmojis: true
            }
          }
        }
      ],
      scaling: {
        autoScaling: true,
        minInstances: 1,
        maxInstances: 10,
        targetCPU: 70,
        targetMemory: 80
      },
      monitoring: {
        enabled: true,
        metrics: ['response_time', 'error_rate', 'user_satisfaction'],
        alerting: {
          enabled: true,
          channels: ['email'],
          thresholds: [
            { metric: 'response_time', operator: '>', value: 5000, severity: 'warning' },
            { metric: 'error_rate', operator: '>', value: 0.05, severity: 'error' }
          ]
        },
        dashboards: []
      },
      backup: {
        enabled: true,
        frequency: 'daily',
        retention: 30,
        encryption: true,
        offsite: true
      }
    };
  }
}

