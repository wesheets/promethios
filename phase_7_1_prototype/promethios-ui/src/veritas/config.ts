/**
 * VERITAS Configuration
 * 
 * This file contains configuration settings for the VERITAS verification system.
 * These settings can be adjusted to enable/disable VERITAS functionality.
 */

export const VERITAS_CONFIG = {
  // Master toggle for VERITAS functionality
  enabled: false,
  
  // Feature-specific toggles (only apply when master toggle is enabled)
  features: {
    factVerification: true,
    domainSpecificVerification: true,
    uncertaintyDetection: true,
    nonexistenceHandling: true
  },
  
  // Logging configuration
  logging: {
    enabled: true,
    level: 'info' // 'debug' | 'info' | 'warn' | 'error'
  }
};

/**
 * Helper function to check if VERITAS is enabled
 * @returns boolean indicating if VERITAS is currently enabled
 */
export function isVeritasEnabled(): boolean {
  return VERITAS_CONFIG.enabled;
}

/**
 * Helper function to check if a specific VERITAS feature is enabled
 * @param feature The feature to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof VERITAS_CONFIG.features): boolean {
  return VERITAS_CONFIG.enabled && VERITAS_CONFIG.features[feature];
}
