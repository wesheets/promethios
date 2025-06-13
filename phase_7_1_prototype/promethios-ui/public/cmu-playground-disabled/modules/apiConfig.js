/**
 * API Configuration Module for CMU Playground
 * 
 * This module provides centralized configuration for API endpoints
 * used by the CMU Playground to connect to real benchmark agents.
 */

export const API_CONFIG = {
  // Base URL for API endpoints - automatically detects environment
  BASE_URL: window.location.hostname.includes('localhost') ? 
    'http://localhost:8000' : 
    'https://api.promethios.ai',
    
  // Agent API endpoints
  AGENT_ENDPOINTS: {
    COMPLETE: '/agent/complete',
    REFLECTION: '/agent/reflection',
    STATUS: '/agent/status'
  },
  
  // Governance API endpoints
  GOVERNANCE_ENDPOINTS: {
    APPLY: '/governance/apply',
    POLICY: '/governance/policy',
    METRICS: '/governance/metrics'
  },
  
  // Default request timeout in milliseconds
  DEFAULT_TIMEOUT: 30000,
  
  // Default retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    BACKOFF_FACTOR: 1.5
  }
};

/**
 * Get the full URL for an API endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string} - The full URL
 */
export function getApiUrl(endpoint) {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

export default API_CONFIG;
