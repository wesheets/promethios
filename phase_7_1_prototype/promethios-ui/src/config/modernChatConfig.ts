/**
 * Modern Chat Feature Configuration
 * Centralized feature flags for progressive rollout of modern chat features
 */

export interface ModernChatFeatureFlags {
  // Week 1: Foundation
  'enhanced-message-wrapper': boolean;
  'unified-state-management': boolean;
  'modern-chat-analytics': boolean;
  
  // Week 2: Drag & Drop Behavioral Injection
  'drag-drop-injection': boolean;
  'enhanced-agent-avatars': boolean;
  'contextual-prompts': boolean;
  
  // Week 3: Smart Threading
  'smart-threading': boolean;
  'thread-detection': boolean;
  'thread-ui-components': boolean;
  
  // Week 4: Conversation Intelligence
  'conversation-intelligence': boolean;
  'smart-suggestions': boolean;
  'insights-panel': boolean;
  
  // Week 5: Advanced Features
  'virtualized-rendering': boolean;
  'multi-agent-chains': boolean;
  'performance-optimization': boolean;
}

// Default configuration - start with foundation only
export const DEFAULT_MODERN_CHAT_FLAGS: ModernChatFeatureFlags = {
  // Week 1: Foundation - Enable for development
  'enhanced-message-wrapper': true,
  'unified-state-management': true,
  'modern-chat-analytics': false,
  
  // Week 2: Drag & Drop - Disabled initially
  'drag-drop-injection': false,
  'enhanced-agent-avatars': false,
  'contextual-prompts': false,
  
  // Week 3: Threading - Disabled initially
  'smart-threading': false,
  'thread-detection': false,
  'thread-ui-components': false,
  
  // Week 4: Intelligence - Disabled initially
  'conversation-intelligence': false,
  'smart-suggestions': false,
  'insights-panel': false,
  
  // Week 5: Advanced - Disabled initially
  'virtualized-rendering': false,
  'multi-agent-chains': false,
  'performance-optimization': false
};

// Environment-based overrides
export const getModernChatConfig = (): ModernChatFeatureFlags => {
  const baseConfig = { ...DEFAULT_MODERN_CHAT_FLAGS };
  
  // Development environment - enable more features for testing
  if (import.meta.env.DEV) {
    return {
      ...baseConfig,
      'enhanced-message-wrapper': true,
      'unified-state-management': true,
      'modern-chat-analytics': true
    };
  }
  
  // Production environment - conservative rollout
  if (import.meta.env.PROD) {
    return {
      ...baseConfig,
      'enhanced-message-wrapper': import.meta.env.VITE_ENABLE_ENHANCED_MESSAGES === 'true',
      'unified-state-management': import.meta.env.VITE_ENABLE_UNIFIED_STATE === 'true'
    };
  }
  
  return baseConfig;
};

// Feature flag hook
export const useModernChatFeature = (feature: keyof ModernChatFeatureFlags): boolean => {
  const config = getModernChatConfig();
  return config[feature];
};

// Batch feature check
export const useModernChatFeatures = (features: (keyof ModernChatFeatureFlags)[]): Record<string, boolean> => {
  const config = getModernChatConfig();
  return features.reduce((acc, feature) => {
    acc[feature] = config[feature];
    return acc;
  }, {} as Record<string, boolean>);
};

// Analytics for feature usage
export const trackFeatureUsage = (feature: keyof ModernChatFeatureFlags, action: string, metadata?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'modern_chat_feature_usage', {
      feature_name: feature,
      action: action,
      metadata: JSON.stringify(metadata || {}),
      timestamp: new Date().toISOString()
    });
  }
  
  console.log(`🎯 [ModernChat] Feature: ${feature}, Action: ${action}`, metadata);
};

// Feature rollout utilities
export const enableFeatureForUser = (userId: string, feature: keyof ModernChatFeatureFlags): boolean => {
  // Simple hash-based rollout - can be replaced with more sophisticated logic
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rolloutPercentage = getRolloutPercentage(feature);
  return (hash % 100) < rolloutPercentage;
};

const getRolloutPercentage = (feature: keyof ModernChatFeatureFlags): number => {
  // Define rollout percentages for gradual feature deployment
  const rolloutConfig: Partial<Record<keyof ModernChatFeatureFlags, number>> = {
    'enhanced-message-wrapper': 100, // Foundation - enable for all
    'unified-state-management': 100, // Foundation - enable for all
    'drag-drop-injection': 25,       // Week 2 - 25% rollout
    'smart-threading': 10,           // Week 3 - 10% rollout
    'conversation-intelligence': 5,   // Week 4 - 5% rollout
    'virtualized-rendering': 1       // Week 5 - 1% rollout
  };
  
  return rolloutConfig[feature] || 0;
};

export default {
  getModernChatConfig,
  useModernChatFeature,
  useModernChatFeatures,
  trackFeatureUsage,
  enableFeatureForUser,
  DEFAULT_MODERN_CHAT_FLAGS
};

