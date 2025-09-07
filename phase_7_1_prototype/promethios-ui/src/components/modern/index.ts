/**
 * Modern Chat Components
 * Export all modern chat components and utilities
 */

// Core components
export { default as EnhancedMessageWrapper } from './EnhancedMessageWrapper';
export type { EnhancedMessageWrapperProps } from './EnhancedMessageWrapper';

export { default as ModernChatProvider, useModernChatContext } from './ModernChatProvider';

// Hooks
export { default as useModernChat } from '../hooks/useModernChat';
export type { 
  ChatMessage, 
  Thread, 
  InjectedResponse, 
  DragState, 
  ConversationInsights, 
  SmartSuggestion,
  ModernChatState 
} from '../hooks/useModernChat';

// Configuration
export { 
  default as modernChatConfig,
  useModernChatFeature,
  useModernChatFeatures,
  trackFeatureUsage,
  getModernChatConfig
} from '../config/modernChatConfig';
export type { ModernChatFeatureFlags } from '../config/modernChatConfig';

// Utilities
export const MODERN_CHAT_VERSION = '1.0.0';
export const MODERN_CHAT_BUILD_DATE = new Date().toISOString();

// Feature detection utilities
export const isModernChatEnabled = (): boolean => {
  const config = getModernChatConfig();
  return config['enhanced-message-wrapper'] || config['unified-state-management'];
};

export const getEnabledFeatures = (): string[] => {
  const config = getModernChatConfig();
  return Object.entries(config)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature);
};

// Debug utilities
export const debugModernChat = () => {
  if (typeof window !== 'undefined') {
    (window as any).modernChatDebug = {
      config: getModernChatConfig(),
      enabledFeatures: getEnabledFeatures(),
      version: MODERN_CHAT_VERSION,
      buildDate: MODERN_CHAT_BUILD_DATE
    };
    console.log('🎯 Modern Chat Debug Info:', (window as any).modernChatDebug);
  }
};

