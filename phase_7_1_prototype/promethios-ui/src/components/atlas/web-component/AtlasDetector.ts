/**
 * AtlasDetector.ts
 * 
 * Detects Promethios-wrapped agents in the wild and enables ATLAS to monitor them
 * This module implements the "tag along" capability for ATLAS
 */

import { GovernanceIdentity, validateGovernanceIdentity } from './GovernanceIdentity';

export interface DetectedAgent {
  id: string;
  name: string;
  element: HTMLElement;
  governanceIdentity?: GovernanceIdentity;
  hasEventSurface: boolean;
}

export class AtlasDetector {
  private static instance: AtlasDetector;
  private detectedAgents: Map<string, DetectedAgent> = new Map();
  private isEnabled: boolean = true;
  private observers: Array<(agents: DetectedAgent[]) => void> = [];
  private mutationObserver: MutationObserver | null = null;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AtlasDetector {
    if (!AtlasDetector.instance) {
      AtlasDetector.instance = new AtlasDetector();
    }
    return AtlasDetector.instance;
  }
  
  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    // Initialize detection
    this.setupDetection();
    
    // Check for user preference
    this.loadUserPreference();
  }
  
  /**
   * Set up detection mechanisms
   */
  private setupDetection() {
    // Set up mutation observer to detect new agents
    this.mutationObserver = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      
      let shouldScan = false;
      
      // Check if we need to scan
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      
      if (shouldScan) {
        this.scanForAgents();
      }
    });
    
    // Start observing
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial scan
    this.scanForAgents();
    
    // Check for global Promethios context
    this.checkForGlobalContext();
  }
  
  /**
   * Scan the DOM for Promethios-wrapped agents
   */
  private scanForAgents() {
    if (!this.isEnabled) return;
    
    // Look for elements with Promethios attributes
    const potentialAgents = document.querySelectorAll(
      '[data-promethios-agent], ' +
      '[data-governance-identity], ' +
      '.promethios-governed-agent'
    );
    
    // Process found elements
    potentialAgents.forEach(element => {
      const agentId = element.getAttribute('data-promethios-agent') || 
                      element.getAttribute('data-agent-id') || 
                      element.id;
      
      if (!agentId || this.detectedAgents.has(agentId)) return;
      
      // Extract governance identity if available
      let governanceIdentity: GovernanceIdentity | undefined;
      const identityAttr = element.getAttribute('data-governance-identity');
      
      if (identityAttr) {
        try {
          governanceIdentity = JSON.parse(identityAttr);
          
          // Validate the governance identity
          if (!validateGovernanceIdentity(governanceIdentity)) {
            console.warn('Invalid governance identity for agent:', agentId);
            governanceIdentity = undefined;
          }
        } catch (e) {
          console.warn('Failed to parse governance identity for agent:', agentId);
        }
      }
      
      // Check for event surface
      const hasEventSurface = this.checkForEventSurface(element);
      
      // Add to detected agents
      this.detectedAgents.set(agentId, {
        id: agentId,
        name: element.getAttribute('data-agent-name') || agentId,
        element: element as HTMLElement,
        governanceIdentity,
        hasEventSurface
      });
      
      // Notify observers
      this.notifyObservers();
    });
  }
  
  /**
   * Check for global Promethios context
   */
  private checkForGlobalContext() {
    if (!this.isEnabled) return;
    
    // Check for global Promethios context
    if (window.promethiosAgentContext) {
      // Extract agents from global context
      const contextAgents = window.promethiosAgentContext.getAgents?.() || [];
      
      contextAgents.forEach(agent => {
        if (!agent.id || this.detectedAgents.has(agent.id)) return;
        
        // Add to detected agents
        this.detectedAgents.set(agent.id, {
          id: agent.id,
          name: agent.name || agent.id,
          element: document.body, // Default to body if no specific element
          governanceIdentity: agent.governanceIdentity,
          hasEventSurface: true
        });
      });
      
      // Notify observers
      this.notifyObservers();
      
      // Subscribe to agent additions
      if (window.promethiosAgentContext.onAgentAdded) {
        window.promethiosAgentContext.onAgentAdded((agent) => {
          if (!this.isEnabled || !agent.id || this.detectedAgents.has(agent.id)) return;
          
          // Add to detected agents
          this.detectedAgents.set(agent.id, {
            id: agent.id,
            name: agent.name || agent.id,
            element: document.body, // Default to body if no specific element
            governanceIdentity: agent.governanceIdentity,
            hasEventSurface: true
          });
          
          // Notify observers
          this.notifyObservers();
        });
      }
    }
  }
  
  /**
   * Check if an element has a Promethios event surface
   */
  private checkForEventSurface(element: Element): boolean {
    // Check for data attribute indicating event surface
    if (element.hasAttribute('data-promethios-events')) {
      return true;
    }
    
    // Check for custom element with event methods
    if (element instanceof HTMLElement) {
      const customElement = element as any;
      return !!(
        typeof customElement.getGovernanceMetrics === 'function' ||
        typeof customElement.getGovernanceIdentity === 'function' ||
        typeof customElement.onGovernanceEvent === 'function'
      );
    }
    
    return false;
  }
  
  /**
   * Notify observers of changes
   */
  private notifyObservers() {
    const agents = Array.from(this.detectedAgents.values());
    this.observers.forEach(observer => observer(agents));
  }
  
  /**
   * Enable agent detection
   */
  public enable() {
    this.isEnabled = true;
    this.saveUserPreference();
    this.scanForAgents();
    return this;
  }
  
  /**
   * Disable agent detection
   */
  public disable() {
    this.isEnabled = false;
    this.saveUserPreference();
    return this;
  }
  
  /**
   * Check if detection is enabled
   */
  public isDetectionEnabled(): boolean {
    return this.isEnabled;
  }
  
  /**
   * Get all detected agents
   */
  public getDetectedAgents(): DetectedAgent[] {
    return Array.from(this.detectedAgents.values());
  }
  
  /**
   * Subscribe to agent detection events
   */
  public subscribe(callback: (agents: DetectedAgent[]) => void): () => void {
    this.observers.push(callback);
    
    // Immediately notify with current agents
    callback(this.getDetectedAgents());
    
    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(observer => observer !== callback);
    };
  }
  
  /**
   * Save user preference
   */
  private saveUserPreference() {
    try {
      localStorage.setItem('atlas-detection-enabled', this.isEnabled ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to save ATLAS detection preference');
    }
  }
  
  /**
   * Load user preference
   */
  private loadUserPreference() {
    try {
      const preference = localStorage.getItem('atlas-detection-enabled');
      if (preference !== null) {
        this.isEnabled = preference === 'true';
      }
    } catch (e) {
      console.warn('Failed to load ATLAS detection preference');
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    this.observers = [];
    this.detectedAgents.clear();
  }
}

// Add type definitions for global Promethios context
declare global {
  interface Window {
    promethiosAgentContext?: {
      getAgents?: () => Array<{
        id: string;
        name?: string;
        governanceIdentity?: GovernanceIdentity;
      }>;
      onAgentAdded?: (callback: (agent: {
        id: string;
        name?: string;
        governanceIdentity?: GovernanceIdentity;
      }) => void) => void;
    };
  }
}

export default AtlasDetector;
