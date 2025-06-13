/**
 * Feature Flags Module
 * 
 * Provides a centralized system for managing feature flags throughout the application.
 * This enables gradual rollout of LLM integration while maintaining stability.
 */

class FeatureFlags {
  constructor() {
    this.flags = {
      // Core feature flags
      USE_LLM_AGENTS: true,         // Whether to use LLM-powered agents
      LLM_PROVIDER: 'openai',       // Which LLM provider to use
      FALLBACK_TO_SCRIPTED: true,   // Whether to fall back to scripted responses on LLM failure
      
      // Governance feature flags
      GOVERNANCE_ENABLED: true,     // Whether governance is enabled by default
      VERITAS_ENABLED: true,        // Whether VERITAS hallucination detection is enabled
      SAFETY_ENABLED: true,         // Whether safety constraints are enabled
      ROLE_ADHERENCE_ENABLED: true, // Whether role adherence is enabled
      
      // UI feature flags
      SHOW_DEVELOPER_PANEL: false,  // Whether to show the developer panel
      SHOW_GOVERNANCE_METRICS: true, // Whether to show governance metrics
      ENABLE_EXPORT: true,          // Whether to enable report export
      
      // Debug flags
      DEBUG_MODE: false,            // Whether debug mode is enabled
      LOG_PROMPTS: false            // Whether to log prompts to console
    };
    
    // Load flags from localStorage if available
    this.loadFlags();
  }
  
  /**
   * Load flags from localStorage
   */
  loadFlags() {
    if (typeof localStorage !== 'undefined') {
      try {
        // Load each flag individually to handle partial storage
        Object.keys(this.flags).forEach(key => {
          const storedValue = localStorage.getItem(`flag_${key}`);
          if (storedValue !== null) {
            // Parse boolean values correctly
            if (storedValue === 'true') {
              this.flags[key] = true;
            } else if (storedValue === 'false') {
              this.flags[key] = false;
            } else {
              this.flags[key] = storedValue;
            }
          }
        });
        
        console.log('Feature flags loaded from localStorage:', this.flags);
      } catch (error) {
        console.warn('Failed to load feature flags from localStorage:', error);
      }
    }
    
    // Check for URL parameters that can override flags
    this.checkUrlParameters();
  }
  
  /**
   * Check URL parameters for flag overrides
   */
  checkUrlParameters() {
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for dev mode
      if (urlParams.has('dev') || urlParams.has('development')) {
        this.flags.SHOW_DEVELOPER_PANEL = true;
        console.log('Developer panel enabled via URL parameter');
      }
      
      // Check for LLM mode
      if (urlParams.has('llm')) {
        const llmValue = urlParams.get('llm');
        this.flags.USE_LLM_AGENTS = llmValue !== 'false';
        console.log(`LLM agents ${this.flags.USE_LLM_AGENTS ? 'enabled' : 'disabled'} via URL parameter`);
      }
      
      // Check for debug mode
      if (urlParams.has('debug')) {
        this.flags.DEBUG_MODE = true;
        this.flags.LOG_PROMPTS = true;
        console.log('Debug mode enabled via URL parameter');
      }
    }
  }
  
  /**
   * Get a feature flag value
   * @param {string} key - Flag key
   * @returns {any} - Flag value
   */
  get(key) {
    return this.flags[key];
  }
  
  /**
   * Set a feature flag value
   * @param {string} key - Flag key
   * @param {any} value - Flag value
   */
  set(key, value) {
    if (!(key in this.flags)) {
      console.warn(`Attempting to set unknown feature flag: ${key}`);
    }
    
    this.flags[key] = value;
    
    // Save to localStorage if available
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`flag_${key}`, value);
      } catch (error) {
        console.warn(`Failed to save feature flag ${key} to localStorage:`, error);
      }
    }
  }
  
  /**
   * Reset all feature flags to defaults
   */
  resetToDefaults() {
    // Define default values
    const defaults = {
      USE_LLM_AGENTS: false,
      LLM_PROVIDER: 'openai',
      FALLBACK_TO_SCRIPTED: true,
      GOVERNANCE_ENABLED: true,
      VERITAS_ENABLED: true,
      SAFETY_ENABLED: true,
      ROLE_ADHERENCE_ENABLED: true,
      SHOW_DEVELOPER_PANEL: false,
      SHOW_GOVERNANCE_METRICS: true,
      ENABLE_EXPORT: true,
      DEBUG_MODE: false,
      LOG_PROMPTS: false
    };
    
    // Reset each flag
    Object.keys(defaults).forEach(key => {
      this.set(key, defaults[key]);
    });
    
    console.log('Feature flags reset to defaults');
  }
  
  /**
   * Get all governance-related flags
   * @returns {Object} - Governance flags
   */
  getGovernanceFlags() {
    return {
      enabled: this.flags.GOVERNANCE_ENABLED,
      activeFeatures: {
        veritas: this.flags.VERITAS_ENABLED,
        safety: this.flags.SAFETY_ENABLED,
        role: this.flags.ROLE_ADHERENCE_ENABLED
      }
    };
  }
}

// Create and export a singleton instance
export const featureFlags = new FeatureFlags();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.featureFlags = featureFlags;
}
