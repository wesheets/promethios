/**
 * Unified Chat System Configuration
 * 
 * Centralized configuration for feature flags, settings, and integration options.
 */

export interface UnifiedChatConfig {
  // Feature flags
  enabled: boolean;
  features: {
    messages: boolean;
    participants: boolean;
    realTime: boolean;
    notifications: boolean;
  };
  
  // Debug settings
  debug: boolean;
  verboseLogging: boolean;
  
  // Performance settings
  batchMessages: boolean;
  cacheParticipants: boolean;
  
  // Limits and thresholds
  maxParticipants: number;
  optimalParticipants: number;
  warningThreshold: number;
  
  // Timeouts
  typingTimeoutMs: number;
  presenceTimeoutMs: number;
  messageRetryMs: number;
}

// Default configuration
const defaultConfig: UnifiedChatConfig = {
  enabled: false,
  features: {
    messages: false,
    participants: false,
    realTime: false,
    notifications: false
  },
  debug: true,
  verboseLogging: true,
  batchMessages: true,
  cacheParticipants: true,
  maxParticipants: 10,
  optimalParticipants: 5,
  warningThreshold: 8,
  typingTimeoutMs: 3000,
  presenceTimeoutMs: 30000,
  messageRetryMs: 5000
};

// Load configuration from environment variables
export const unifiedChatConfig: UnifiedChatConfig = {
  // Use defaults first, then override with environment variables
  ...defaultConfig,
  enabled: import.meta.env.VITE_UNIFIED_CHAT_ENABLED === 'true',
  features: {
    messages: import.meta.env.VITE_UNIFIED_MESSAGES === 'true',
    participants: import.meta.env.VITE_UNIFIED_PARTICIPANTS === 'true',
    realTime: import.meta.env.VITE_UNIFIED_REALTIME === 'true',
    notifications: import.meta.env.VITE_UNIFIED_NOTIFICATIONS === 'true'
  },
  debug: import.meta.env.VITE_UNIFIED_CHAT_DEBUG === 'true',
  verboseLogging: import.meta.env.VITE_UNIFIED_CHAT_VERBOSE_LOGGING === 'true',
  batchMessages: import.meta.env.VITE_UNIFIED_CHAT_BATCH_MESSAGES !== 'false',
  cacheParticipants: import.meta.env.VITE_UNIFIED_CHAT_CACHE_PARTICIPANTS !== 'false'
};

// Logging utility for unified chat system
export const unifiedChatLogger = {
  debug: (message: string, ...args: any[]) => {
    if (unifiedChatConfig.debug) {
      console.log(`🔧 [UnifiedChat] ${message}`, ...args);
    }
  },
  
  verbose: (message: string, ...args: any[]) => {
    if (unifiedChatConfig.verboseLogging) {
      console.log(`📝 [UnifiedChat] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    console.log(`ℹ️ [UnifiedChat] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ [UnifiedChat] ${message}`, ...args);
  },
  
  error: (message: string, error?: any, ...args: any[]) => {
    console.error(`❌ [UnifiedChat] ${message}`, error, ...args);
  }
};

// Feature flag utilities
export const isUnifiedChatEnabled = () => unifiedChatConfig.enabled;
export const isFeatureEnabled = (feature: keyof UnifiedChatConfig['features']) => 
  unifiedChatConfig.enabled && unifiedChatConfig.features[feature];

// Configuration validation
export const validateUnifiedChatConfig = (): boolean => {
  const config = unifiedChatConfig;
  
  if (config.maxParticipants < 2) {
    unifiedChatLogger.error('Invalid maxParticipants: must be at least 2');
    return false;
  }
  
  if (config.optimalParticipants > config.maxParticipants) {
    unifiedChatLogger.error('Invalid optimalParticipants: cannot exceed maxParticipants');
    return false;
  }
  
  if (config.warningThreshold > config.maxParticipants) {
    unifiedChatLogger.error('Invalid warningThreshold: cannot exceed maxParticipants');
    return false;
  }
  
  if (config.typingTimeoutMs < 1000) {
    unifiedChatLogger.warn('typingTimeoutMs is very low, may cause performance issues');
  }
  
  return true;
};

// Initialize configuration
if (unifiedChatConfig.enabled) {
  unifiedChatLogger.info('Unified Chat System enabled with config:', unifiedChatConfig);
  
  if (!validateUnifiedChatConfig()) {
    unifiedChatLogger.error('Configuration validation failed');
  }
} else {
  unifiedChatLogger.debug('Unified Chat System disabled');
}

export default unifiedChatConfig;

