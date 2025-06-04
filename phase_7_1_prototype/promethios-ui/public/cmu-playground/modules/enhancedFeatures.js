/**
 * Enhanced Features Module
 * 
 * Provides additional features and enhancements to the CMU playground.
 * These are applied progressively based on feature flags.
 */

import { featureFlags } from './featureFlags.js';

/**
 * Apply all enhancements to the playground
 */
export function applyAllEnhancements() {
  console.log('Applying enhanced features to playground');
  
  // Apply each enhancement based on feature flags
  enhanceUIWithRealTimeGovernance();
  enhanceScenarioSelection();
  enhanceMetricsDashboard();
  setupAPIKeyManagement();
  enhanceAgentLogsToggle();
  enhanceCommentarySection();
  enhanceTranscriptStyling();
  enhanceExportReport();
  
  console.log('Enhanced features applied');
}

/**
 * Enhance UI with real-time governance visualization
 */
function enhanceUIWithRealTimeGovernance() {
  if (!featureFlags.get('SHOW_GOVERNANCE_METRICS')) {
    return;
  }
  
  console.log('Enhancing UI with real-time governance visualization');
  
  // Subscribe to agent messages to show governance effects
  if (window.EventBus) {
    window.EventBus.subscribe('agentMessage', (data) => {
      // Only show governance effects if we have both original and governed responses
      if (data.original && data.governed && data.original !== data.governed) {
        highlightGovernanceChanges(data);
      }
      
      // Update metrics if available
      if (data.governanceResult && data.governanceResult.metrics) {
        updateMetricsDisplay(data.governanceResult.metrics);
      }
    });
  }
}

/**
 * Highlight governance changes in the UI
 * @param {Object} messageData - Message data with original and governed responses
 */
function highlightGovernanceChanges(messageData) {
  // This would be implemented to visually highlight differences
  // between original and governed responses
  console.log('Would highlight governance changes:', messageData);
  
  // In a real implementation, this would:
  // 1. Find the message element in the DOM
  // 2. Create a "View original" button
  // 3. Show a diff view when clicked
  // 4. Highlight modifications based on governance features
}

/**
 * Update metrics display with new values
 * @param {Object} metrics - Metrics data
 */
function updateMetricsDisplay(metrics) {
  // Update trust score
  const trustScoreGoverned = document.getElementById('trustScoreGoverned');
  if (trustScoreGoverned && metrics.trustScore) {
    trustScoreGoverned.textContent = metrics.trustScore;
  }
  
  // Update compliance rate
  const complianceRateGoverned = document.getElementById('complianceRateGoverned');
  if (complianceRateGoverned && metrics.complianceRate) {
    complianceRateGoverned.textContent = metrics.complianceRate;
  }
  
  // Update error rate
  const errorRateGoverned = document.getElementById('errorRateGoverned');
  if (errorRateGoverned && metrics.errorRate) {
    errorRateGoverned.textContent = metrics.errorRate;
  }
  
  // Calculate and update improvements
  updateImprovementMetrics();
}

/**
 * Update improvement metrics based on current values
 */
function updateImprovementMetrics() {
  // Trust score improvement
  const trustScoreUngoverned = document.getElementById('trustScoreUngoverned');
  const trustScoreGoverned = document.getElementById('trustScoreGoverned');
  const trustScoreImprovement = document.getElementById('trustScoreImprovement');
  
  if (trustScoreUngoverned && trustScoreGoverned && trustScoreImprovement) {
    const ungoverned = parseInt(trustScoreUngoverned.textContent, 10);
    const governed = parseInt(trustScoreGoverned.textContent, 10);
    
    if (!isNaN(ungoverned) && !isNaN(governed) && ungoverned > 0) {
      const improvement = Math.round((governed - ungoverned) / ungoverned * 100);
      trustScoreImprovement.textContent = `+${improvement}%`;
    }
  }
  
  // Compliance rate improvement
  const complianceRateUngoverned = document.getElementById('complianceRateUngoverned');
  const complianceRateGoverned = document.getElementById('complianceRateGoverned');
  const complianceRateImprovement = document.getElementById('complianceRateImprovement');
  
  if (complianceRateUngoverned && complianceRateGoverned && complianceRateImprovement) {
    const ungoverned = parseInt(complianceRateUngoverned.textContent, 10);
    const governed = parseInt(complianceRateGoverned.textContent, 10);
    
    if (!isNaN(ungoverned) && !isNaN(governed) && ungoverned > 0) {
      const improvement = Math.round((governed - ungoverned) / ungoverned * 100);
      complianceRateImprovement.textContent = `+${improvement}%`;
    }
  }
  
  // Error rate reduction
  const errorRateUngoverned = document.getElementById('errorRateUngoverned');
  const errorRateGoverned = document.getElementById('errorRateGoverned');
  const errorRateReduction = document.getElementById('errorRateReduction');
  
  if (errorRateUngoverned && errorRateGoverned && errorRateReduction) {
    const ungoverned = parseInt(errorRateUngoverned.textContent, 10);
    const governed = parseInt(errorRateGoverned.textContent, 10);
    
    if (!isNaN(ungoverned) && !isNaN(governed) && ungoverned > 0) {
      const reduction = Math.round((ungoverned - governed) / ungoverned * 100);
      errorRateReduction.textContent = `-${reduction}%`;
    }
  }
}

/**
 * Enhance scenario selection with additional scenarios
 */
function enhanceScenarioSelection() {
  // Add additional scenarios to the selection dropdown
  const scenarioSelect = document.getElementById('scenarioSelect');
  if (!scenarioSelect) return;
  
  // Check if we already have the legal contract option
  if (!scenarioSelect.querySelector('option[value="legal_contract"]')) {
    // Add legal contract scenario
    const legalOption = document.createElement('option');
    legalOption.value = 'legal_contract';
    legalOption.textContent = 'Legal Contract Review';
    scenarioSelect.appendChild(legalOption);
    
    // Add medical triage scenario
    const medicalOption = document.createElement('option');
    medicalOption.value = 'medical_triage';
    medicalOption.textContent = 'Medical Triage';
    scenarioSelect.appendChild(medicalOption);
  }
}

/**
 * Enhance metrics dashboard with additional visualizations
 */
function enhanceMetricsDashboard() {
  // This would add more sophisticated visualizations to the metrics dashboard
  // For now, we'll just log that it would be enhanced
  console.log('Would enhance metrics dashboard with additional visualizations');
}

/**
 * Set up API key management for LLM providers
 */
function setupAPIKeyManagement() {
  // Only set up if LLM agents are enabled
  if (!featureFlags.get('USE_LLM_AGENTS')) {
    return;
  }
  
  console.log('Setting up API key management');
  
  // Check if we have API keys in localStorage
  const apiKey = localStorage.getItem('llm_api_key');
  if (!apiKey) {
    // In development mode, prompt for API key
    if (featureFlags.get('SHOW_DEVELOPER_PANEL')) {
      setTimeout(() => {
        const key = prompt('Enter your LLM API key for development:');
        if (key) {
          localStorage.setItem('llm_api_key', key);
          console.log('API key saved to localStorage');
        }
      }, 1000);
    }
  }
}

/**
 * Enhance agent logs toggle functionality
 */
function enhanceAgentLogsToggle() {
  // Find the toggle elements
  const ungovernedLogsToggle = document.getElementById('ungovernedLogsToggle');
  const governedLogsToggle = document.getElementById('governedLogsToggle');
  
  // Default to on
  if (ungovernedLogsToggle) {
    ungovernedLogsToggle.checked = true;
    // toggleAgentLogs is defined in main.js and available globally
    if (typeof window.toggleAgentLogs === 'function') {
      window.toggleAgentLogs('ungoverned', true);
    }
  }
  
  if (governedLogsToggle) {
    governedLogsToggle.checked = true;
    // toggleAgentLogs is defined in main.js and available globally
    if (typeof window.toggleAgentLogs === 'function') {
      window.toggleAgentLogs('governed', true);
    }
  }
  
  // Add animation to draw attention
  function animateToggle(element) {
    if (!element) return;
    
    // Add pulse animation class
    element.parentElement.classList.add('pulse-attention');
    
    // Remove animation after a few seconds
    setTimeout(() => {
      element.parentElement.classList.remove('pulse-attention');
    }, 3000);
  }
  
  // Animate toggles
  animateToggle(ungovernedLogsToggle);
  animateToggle(governedLogsToggle);
}

/**
 * Enhance commentary section with additional features
 */
function enhanceCommentarySection() {
  console.log('Enhancing commentary section');
  // Implementation would go here
}

/**
 * Enhance transcript styling for better readability
 */
function enhanceTranscriptStyling() {
  console.log('Enhancing transcript styling');
  // Implementation would go here
}

/**
 * Enhance export report functionality
 */
function enhanceExportReport() {
  console.log('Enhancing export report functionality');
  // Implementation would go here
}

/**
 * Add risk injection feature for testing governance
 */
function addRiskInjectionFeature() {
  console.log('Adding risk injection feature');
  // Implementation would go here
}

/**
 * Implement strategic overlay for governance visualization
 */
function implementStrategicOverlay() {
  console.log('Implementing strategic overlay');
  // Implementation would go here
}

// Create a default export object with all the functions
const EnhancedFeatures = {
  enhanceAgentLogsToggle,
  enhanceCommentarySection,
  enhanceTranscriptStyling,
  enhanceExportReport,
  addRiskInjectionFeature,
  implementStrategicOverlay,
  applyAllEnhancements,
  enhanceUIWithRealTimeGovernance,
  enhanceScenarioSelection,
  enhanceMetricsDashboard,
  setupAPIKeyManagement,
  init() {
    console.log('EnhancedFeatures module initialized');
    // Don't apply all enhancements automatically on init
    // Let the main application decide when to apply them
  }
};

// Export as default and individual functions
export default EnhancedFeatures;
