/**
 * AtlasPlugin.ts
 * 
 * Web Component wrapper for the ATLAS Companion Agent
 * This provides complete isolation from the host application
 * through Shadow DOM encapsulation.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import AtlasRoot from './AtlasRoot';

export class AtlasPlugin extends HTMLElement {
  private shadow: ShadowRoot;
  private root: ReactDOM.Root | null = null;
  private config: any = {};
  
  // API version
  static version = '1.0.0';
  
  constructor() {
    super();
    
    // Create shadow DOM for isolation
    this.shadow = this.attachShadow({ mode: 'open' });
    
    // Create container for React app
    const container = document.createElement('div');
    container.className = 'atlas-container';
    this.shadow.appendChild(container);
    
    // Add base styles
    const style = document.createElement('style');
    style.textContent = this.getBaseStyles();
    this.shadow.appendChild(style);
  }
  
  /**
   * Web Component lifecycle: when element is added to DOM
   */
  connectedCallback() {
    // Parse attributes
    this.parseAttributes();
    
    // Mount React app
    const container = this.shadow.querySelector('.atlas-container');
    if (container && !this.root) {
      this.root = ReactDOM.createRoot(container);
      this.renderApp();
    }
    
    // Notify host that ATLAS is ready
    this.dispatchEvent(new CustomEvent('atlas:ready', {
      bubbles: true,
      composed: true,
      detail: {
        version: AtlasPlugin.version
      }
    }));
  }
  
  /**
   * Web Component lifecycle: when element is removed from DOM
   */
  disconnectedCallback() {
    // Clean up React app
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    
    // Notify host that ATLAS is disconnected
    this.dispatchEvent(new CustomEvent('atlas:disconnected', {
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Web Component lifecycle: when attributes change
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.parseAttributes();
      this.renderApp();
    }
  }
  
  /**
   * List of observed attributes for attributeChangedCallback
   */
  static get observedAttributes() {
    return ['context', 'position', 'theme', 'trust-score'];
  }
  
  /**
   * Parse HTML attributes into config object
   */
  private parseAttributes() {
    // Get attributes with defaults
    this.config = {
      context: this.getAttribute('context') || 'default',
      position: this.getAttribute('position') || 'bottom-right',
      theme: this.getAttribute('theme') || 'light',
      trustScore: parseInt(this.getAttribute('trust-score') || '95', 10)
    };
  }
  
  /**
   * Render the React application
   */
  private renderApp() {
    if (this.root) {
      this.root.render(
        React.createElement(AtlasRoot, {
          config: this.config,
          onAction: this.handleAction.bind(this)
        })
      );
    }
  }
  
  /**
   * Handle actions from the React app
   */
  private handleAction(action: string, data: any) {
    // Dispatch custom event to host
    this.dispatchEvent(new CustomEvent('atlas:action', {
      bubbles: true,
      composed: true,
      detail: {
        type: action,
        payload: data,
        meta: {
          version: AtlasPlugin.version,
          timestamp: Date.now()
        }
      }
    }));
  }
  
  /**
   * Base styles for the web component
   */
  private getBaseStyles(): string {
    return `
      .atlas-container {
        width: 100%;
        height: 100%;
        display: block;
      }
      
      /* CSS Variables for theming */
      :host {
        --atlas-primary-color: #3a86ff;
        --atlas-secondary-color: #8338ec;
        --atlas-background-color: #ffffff;
        --atlas-text-color: #333333;
        --atlas-border-color: #e5e7eb;
        --atlas-trust-high: #10b981;
        --atlas-trust-medium: #f59e0b;
        --atlas-trust-low: #ef4444;
        
        /* Size variables */
        --atlas-bubble-size: 48px;
        --atlas-z-index: 1000;
        
        /* Font variables */
        --atlas-font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      /* Dark theme variables */
      :host([theme="dark"]) {
        --atlas-background-color: #1f2937;
        --atlas-text-color: #f9fafb;
        --atlas-border-color: #374151;
        --atlas-trust-high: #34d399;
        --atlas-trust-medium: #fbbf24;
        --atlas-trust-low: #f87171;
      }
    `;
  }
  
  /**
   * Public API: Update configuration
   */
  public updateConfig(config: any) {
    this.config = { ...this.config, ...config };
    this.renderApp();
    return this;
  }
  
  /**
   * Public API: Show the ATLAS bubble
   */
  public show() {
    this.style.display = 'block';
    return this;
  }
  
  /**
   * Public API: Hide the ATLAS bubble
   */
  public hide() {
    this.style.display = 'none';
    return this;
  }
}

// Register the web component
customElements.define('atlas-plugin', AtlasPlugin);

// Export global API
declare global {
  interface Window {
    AtlasPlugin: {
      version: string;
      init: (config?: any) => AtlasPlugin;
    };
  }
}

// Initialize global API
window.AtlasPlugin = {
  version: AtlasPlugin.version,
  init: (config = {}) => {
    const atlas = document.createElement('atlas-plugin') as AtlasPlugin;
    
    // Apply configuration via attributes
    Object.entries(config).forEach(([key, value]) => {
      atlas.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), String(value));
    });
    
    // Append to document
    document.body.appendChild(atlas);
    
    return atlas;
  }
};

export default AtlasPlugin;
