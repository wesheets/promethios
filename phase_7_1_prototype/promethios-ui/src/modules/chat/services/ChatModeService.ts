import { ChatMode, ChatModeConfig, CHAT_MODE_CONFIGS, ChatConfiguration } from '../types';

export class ChatModeService {
  /**
   * Get all available chat modes
   */
  static getAllModes(): ChatModeConfig[] {
    return Object.values(CHAT_MODE_CONFIGS);
  }

  /**
   * Get configuration for a specific chat mode
   */
  static getModeConfig(mode: ChatMode): ChatModeConfig {
    return CHAT_MODE_CONFIGS[mode];
  }

  /**
   * Get default configuration for a chat mode
   */
  static getDefaultConfiguration(mode: ChatMode): ChatConfiguration {
    const modeConfig = CHAT_MODE_CONFIGS[mode];
    return {
      governanceEnabled: false,
      realTimeMonitoring: false,
      maxMessages: undefined,
      autoSave: true,
      allowFileUploads: true,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'jpg', 'png', 'gif'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: undefined,
      ...modeConfig.defaultConfiguration
    };
  }

  /**
   * Validate if a mode supports a specific feature
   */
  static supportsFeature(mode: ChatMode, feature: string): boolean {
    const modeConfig = CHAT_MODE_CONFIGS[mode];
    return modeConfig.features.includes(feature as any);
  }

  /**
   * Get recommended mode based on agent/system capabilities
   */
  static getRecommendedMode(
    hasGovernance: boolean,
    isMultiAgent: boolean,
    userPreference?: ChatMode
  ): ChatMode {
    // If user has a preference and it's valid for the context, use it
    if (userPreference) {
      if (isMultiAgent && userPreference === ChatMode.MULTI_AGENT) {
        return ChatMode.MULTI_AGENT;
      }
      if (!isMultiAgent && userPreference !== ChatMode.MULTI_AGENT) {
        return userPreference;
      }
    }

    // Auto-recommend based on capabilities
    if (isMultiAgent) {
      return ChatMode.MULTI_AGENT;
    }

    if (hasGovernance) {
      return ChatMode.GOVERNANCE;
    }

    return ChatMode.STANDARD;
  }

  /**
   * Merge user configuration with mode defaults
   */
  static mergeConfiguration(
    mode: ChatMode,
    userConfig: Partial<ChatConfiguration>
  ): ChatConfiguration {
    const defaultConfig = this.getDefaultConfiguration(mode);
    return {
      ...defaultConfig,
      ...userConfig
    };
  }

  /**
   * Validate configuration for a specific mode
   */
  static validateConfiguration(
    mode: ChatMode,
    config: ChatConfiguration
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const modeConfig = CHAT_MODE_CONFIGS[mode];

    // Check if governance is required for the mode
    if (mode === ChatMode.GOVERNANCE || mode === ChatMode.MULTI_AGENT) {
      if (!config.governanceEnabled) {
        errors.push(`Governance must be enabled for ${modeConfig.displayName} mode`);
      }
    }

    // Validate file upload settings
    if (config.allowFileUploads) {
      if (!config.allowedFileTypes || config.allowedFileTypes.length === 0) {
        errors.push('Allowed file types must be specified when file uploads are enabled');
      }

      if (!config.maxFileSize || config.maxFileSize <= 0) {
        errors.push('Maximum file size must be specified and greater than 0');
      }

      // Check if file size is reasonable (max 100MB)
      if (config.maxFileSize > 100 * 1024 * 1024) {
        errors.push('Maximum file size cannot exceed 100MB');
      }
    }

    // Validate AI model parameters
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1 || config.maxTokens > 32000) {
        errors.push('Max tokens must be between 1 and 32000');
      }
    }

    // Validate message limits
    if (config.maxMessages !== undefined) {
      if (config.maxMessages < 1) {
        errors.push('Max messages must be at least 1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get mode-specific UI theme colors
   */
  static getModeTheme(mode: ChatMode): {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  } {
    const modeConfig = CHAT_MODE_CONFIGS[mode];
    
    switch (mode) {
      case ChatMode.STANDARD:
        return {
          primary: '#2196F3',
          secondary: '#1976D2',
          accent: '#03DAC6',
          background: '#F5F5F5'
        };
      case ChatMode.GOVERNANCE:
        return {
          primary: '#4CAF50',
          secondary: '#388E3C',
          accent: '#8BC34A',
          background: '#E8F5E8'
        };
      case ChatMode.MULTI_AGENT:
        return {
          primary: '#FF9800',
          secondary: '#F57C00',
          accent: '#FFC107',
          background: '#FFF3E0'
        };
      default:
        return {
          primary: '#2196F3',
          secondary: '#1976D2',
          accent: '#03DAC6',
          background: '#F5F5F5'
        };
    }
  }

  /**
   * Check if mode transition is allowed
   */
  static canTransitionToMode(
    currentMode: ChatMode,
    targetMode: ChatMode,
    hasMessages: boolean
  ): { allowed: boolean; reason?: string } {
    // Allow transition if no messages exist
    if (!hasMessages) {
      return { allowed: true };
    }

    // Don't allow switching from multi-agent to single agent modes if messages exist
    if (currentMode === ChatMode.MULTI_AGENT && targetMode !== ChatMode.MULTI_AGENT) {
      return {
        allowed: false,
        reason: 'Cannot switch from multi-agent to single agent mode with existing messages'
      };
    }

    // Don't allow switching to multi-agent from single agent modes if messages exist
    if (currentMode !== ChatMode.MULTI_AGENT && targetMode === ChatMode.MULTI_AGENT) {
      return {
        allowed: false,
        reason: 'Cannot switch to multi-agent mode with existing single agent messages'
      };
    }

    // Allow transitions between standard and governance modes
    return { allowed: true };
  }

  /**
   * Get mode-specific placeholder text
   */
  static getModePlaceholder(mode: ChatMode): string {
    switch (mode) {
      case ChatMode.STANDARD:
        return 'Type your message...';
      case ChatMode.GOVERNANCE:
        return 'Type your message (governance monitoring active)...';
      case ChatMode.MULTI_AGENT:
        return 'Type your message for the multi-agent system...';
      default:
        return 'Type your message...';
    }
  }

  /**
   * Get mode-specific help text
   */
  static getModeHelpText(mode: ChatMode): string {
    const modeConfig = CHAT_MODE_CONFIGS[mode];
    return modeConfig.description;
  }
}

