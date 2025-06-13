/**
 * Developer Settings Panel
 * 
 * Provides a UI for developers to toggle feature flags and test LLM integration.
 * This is only visible in development mode or when explicitly enabled.
 */

import { featureFlags } from './featureFlags.js';

class DeveloperPanel {
  constructor() {
    this.isVisible = false;
    this.panel = null;
  }
  
  /**
   * Initialize the developer panel
   */
  init() {
    // Only initialize if developer panel is enabled
    if (!featureFlags.get('SHOW_DEVELOPER_PANEL')) {
      // Still set up keyboard shortcut to enable it
      this.setupKeyboardShortcut();
      return;
    }
    
    console.log('Initializing developer panel');
    this.createPanel();
    this.setupKeyboardShortcut();
  }
  
  /**
   * Create the developer panel UI
   */
  createPanel() {
    // Create panel element if it doesn't exist
    if (!this.panel) {
      this.panel = document.createElement('div');
      this.panel.className = 'developer-panel';
      this.panel.style.position = 'fixed';
      this.panel.style.bottom = '10px';
      this.panel.style.right = '10px';
      this.panel.style.zIndex = '1000';
      this.panel.style.background = 'rgba(0,0,0,0.8)';
      this.panel.style.color = '#fff';
      this.panel.style.padding = '15px';
      this.panel.style.borderRadius = '5px';
      this.panel.style.maxWidth = '300px';
      this.panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      this.panel.style.display = 'none';
      
      // Add panel content
      this.updatePanelContent();
      
      // Add to document
      document.body.appendChild(this.panel);
    }
  }
  
  /**
   * Update the panel content with current feature flag values
   */
  updatePanelContent() {
    if (!this.panel) return;
    
    this.panel.innerHTML = `
      <h4 style="margin-top: 0; color: #9c27b0;">Developer Settings</h4>
      
      <div style="margin-bottom: 15px;">
        <h5 style="margin-bottom: 5px; color: #ce93d8;">Agent Settings</h5>
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="devUseLLMToggle" ${featureFlags.get('USE_LLM_AGENTS') ? 'checked' : ''}>
          <label class="form-check-label" for="devUseLLMToggle">Use LLM Agents</label>
        </div>
        
        <div class="form-group mb-2">
          <label for="devLLMProviderSelect" style="display: block; margin-bottom: 5px;">LLM Provider</label>
          <select class="form-select form-select-sm" id="devLLMProviderSelect" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; padding: 5px;">
            <option value="openai" ${featureFlags.get('LLM_PROVIDER') === 'openai' ? 'selected' : ''}>OpenAI</option>
            <option value="anthropic" ${featureFlags.get('LLM_PROVIDER') === 'anthropic' ? 'selected' : ''}>Anthropic</option>
          </select>
        </div>
        
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="devFallbackToggle" ${featureFlags.get('FALLBACK_TO_SCRIPTED') ? 'checked' : ''}>
          <label class="form-check-label" for="devFallbackToggle">Fallback to Scripted</label>
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <h5 style="margin-bottom: 5px; color: #ce93d8;">Governance Settings</h5>
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="devGovernanceToggle" ${featureFlags.get('GOVERNANCE_ENABLED') ? 'checked' : ''}>
          <label class="form-check-label" for="devGovernanceToggle">Governance Enabled</label>
        </div>
        
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="devVeritasToggle" ${featureFlags.get('VERITAS_ENABLED') ? 'checked' : ''}>
          <label class="form-check-label" for="devVeritasToggle">VERITAS Enabled</label>
        </div>
        
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="devSafetyToggle" ${featureFlags.get('SAFETY_ENABLED') ? 'checked' : ''}>
          <label class="form-check-label" for="devSafetyToggle">Safety Enabled</label>
        </div>
        
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="devRoleToggle" ${featureFlags.get('ROLE_ADHERENCE_ENABLED') ? 'checked' : ''}>
          <label class="form-check-label" for="devRoleToggle">Role Adherence</label>
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <h5 style="margin-bottom: 5px; color: #ce93d8;">Debug Settings</h5>
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="devDebugToggle" ${featureFlags.get('DEBUG_MODE') ? 'checked' : ''}>
          <label class="form-check-label" for="devDebugToggle">Debug Mode</label>
        </div>
        
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="devLogPromptsToggle" ${featureFlags.get('LOG_PROMPTS') ? 'checked' : ''}>
          <label class="form-check-label" for="devLogPromptsToggle">Log Prompts</label>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-top: 15px;">
        <button id="devResetButton" style="background: #555; color: #fff; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Reset Defaults</button>
        <button id="devCloseButton" style="background: #9c27b0; color: #fff; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Close</button>
      </div>
      
      <div style="margin-top: 10px; font-size: 0.8em; color: #aaa; text-align: center;">
        Press Ctrl+Shift+D to toggle this panel
      </div>
    `;
    
    // Add event listeners
    this.addEventListeners();
  }
  
  /**
   * Add event listeners to panel controls
   */
  addEventListeners() {
    if (!this.panel) return;
    
    // LLM toggle
    const llmToggle = this.panel.querySelector('#devUseLLMToggle');
    if (llmToggle) {
      llmToggle.addEventListener('change', (e) => {
        featureFlags.set('USE_LLM_AGENTS', e.target.checked);
        console.log(`LLM agents ${e.target.checked ? 'enabled' : 'disabled'}`);
      });
    }
    
    // LLM provider select
    const llmProviderSelect = this.panel.querySelector('#devLLMProviderSelect');
    if (llmProviderSelect) {
      llmProviderSelect.addEventListener('change', (e) => {
        featureFlags.set('LLM_PROVIDER', e.target.value);
        console.log(`LLM provider set to ${e.target.value}`);
      });
    }
    
    // Fallback toggle
    const fallbackToggle = this.panel.querySelector('#devFallbackToggle');
    if (fallbackToggle) {
      fallbackToggle.addEventListener('change', (e) => {
        featureFlags.set('FALLBACK_TO_SCRIPTED', e.target.checked);
        console.log(`Fallback to scripted ${e.target.checked ? 'enabled' : 'disabled'}`);
      });
    }
    
    // Governance toggle
    const governanceToggle = this.panel.querySelector('#devGovernanceToggle');
    if (governanceToggle) {
      governanceToggle.addEventListener('change', (e) => {
        featureFlags.set('GOVERNANCE_ENABLED', e.target.checked);
        console.log(`Governance ${e.target.checked ? 'enabled' : 'disabled'}`);
      });
    }
    
    // VERITAS toggle
    const veritasToggle = this.panel.querySelector('#devVeritasToggle');
    if (veritasToggle) {
      veritasToggle.addEventListener('change', (e) => {
        featureFlags.set('VERITAS_ENABLED', e.target.checked);
        console.log(`VERITAS ${e.target.checked ? 'enabled' : 'disabled'}`);
      });
    }
    
    // Safety toggle
    const safetyToggle = this.panel.querySelector('#devSafetyToggle');
    if (safetyToggle) {
      safetyToggle.addEventListener('change', (e) => {
        featureFlags.set('SAFETY_ENABLED', e.target.checked);
        console.log(`Safety ${e.target.checked ? 'enabled' : 'disabled'}`);
      });
    }
    
    // Role toggle
    const roleToggle = this.panel.querySelector('#devRoleToggle');
    if (roleToggle) {
      roleToggle.addEventListener('change', (e) => {
        featureFlags.set('ROLE_ADHERENCE_ENABLED', e.target.checked);
        console.log(`Role adherence ${e.target.checked ? 'enabled' : 'disabled'}`);
      });
    }
    
    // Debug toggle
    const debugToggle = this.panel.querySelector('#devDebugToggle');
    if (debugToggle) {
      debugToggle.addEventListener('change', (e) => {
        featureFlags.set('DEBUG_MODE', e.target.checked);
        console.log(`Debug mode ${e.target.checked ? 'enabled' : 'disabled'}`);
      });
    }
    
    // Log prompts toggle
    const logPromptsToggle = this.panel.querySelector('#devLogPromptsToggle');
    if (logPromptsToggle) {
      logPromptsToggle.addEventListener('change', (e) => {
        featureFlags.set('LOG_PROMPTS', e.target.checked);
        console.log(`Log prompts ${e.target.checked ? 'enabled' : 'disabled'}`);
      });
    }
    
    // Reset button
    const resetButton = this.panel.querySelector('#devResetButton');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        featureFlags.resetToDefaults();
        this.updatePanelContent();
        console.log('Feature flags reset to defaults');
      });
    }
    
    // Close button
    const closeButton = this.panel.querySelector('#devCloseButton');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.toggleVisibility(false);
      });
    }
  }
  
  /**
   * Set up keyboard shortcut (Ctrl+Shift+D) to toggle panel
   */
  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Check for Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        // If panel doesn't exist yet, create it
        if (!this.panel) {
          this.createPanel();
        }
        
        // Toggle visibility
        this.toggleVisibility(!this.isVisible);
        
        // Prevent default browser behavior
        e.preventDefault();
      }
    });
  }
  
  /**
   * Toggle panel visibility
   * @param {boolean} visible - Whether the panel should be visible
   */
  toggleVisibility(visible) {
    this.isVisible = visible;
    
    if (this.panel) {
      this.panel.style.display = visible ? 'block' : 'none';
      
      // Update content when showing
      if (visible) {
        this.updatePanelContent();
      }
    }
  }
}

// Create and export a singleton instance
export const developerPanel = new DeveloperPanel();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.developerPanel = developerPanel;
}
