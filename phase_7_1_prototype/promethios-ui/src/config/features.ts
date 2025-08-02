/**
 * Feature Toggle Configuration
 * 
 * Controls the visibility and availability of various features in the application.
 * This allows for easy enabling/disabling of features without code changes.
 */

export interface FeatureFlags {
  // Promethios Native LLM Features
  promethiosNative: {
    enabled: boolean;
    chatTab: boolean;
    agentCreation: boolean;
    agentManagement: boolean;
  };
}

/**
 * Default feature configuration
 * 
 * Promethios Native is currently disabled to reduce user confusion
 * while the feature is being developed and integrated.
 */
export const FEATURE_FLAGS: FeatureFlags = {
  promethiosNative: {
    enabled: false,           // Master toggle for all Promethios Native features
    chatTab: false,          // Show/hide "PROMETHIOS NATIVE" tab in chat
    agentCreation: false,    // Show/hide "Create Promethios LLM" option
    agentManagement: false,  // Show/hide "PROMETHIOS NATIVE AGENTS" tab
  },
};

/**
 * Helper functions to check feature availability
 */
export const isPromethiosNativeEnabled = (): boolean => {
  return FEATURE_FLAGS.promethiosNative.enabled;
};

export const isPromethiosNativeChatEnabled = (): boolean => {
  return FEATURE_FLAGS.promethiosNative.enabled && FEATURE_FLAGS.promethiosNative.chatTab;
};

export const isPromethiosNativeCreationEnabled = (): boolean => {
  return FEATURE_FLAGS.promethiosNative.enabled && FEATURE_FLAGS.promethiosNative.agentCreation;
};

export const isPromethiosNativeManagementEnabled = (): boolean => {
  return FEATURE_FLAGS.promethiosNative.enabled && FEATURE_FLAGS.promethiosNative.agentManagement;
};

