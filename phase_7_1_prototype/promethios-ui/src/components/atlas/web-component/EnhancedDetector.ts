/**
 * EnhancedDetector.ts
 * 
 * Advanced detection mechanisms for Promethios-wrapped agents
 * Supports multiple identification patterns and provides resilience
 */

import { GovernanceIdentity, validateGovernanceIdentity } from './GovernanceIdentity';
import { CompatibilityManager } from './CompatibilityManager';

export interface DetectedAgent {
  id: string;
  name: string;
  element: HTMLElement | null;
  governanceIdentity?: GovernanceIdentity;
  hasEventSurface: boolean;
  detectionMethod: 'attribute' | 'global' | 'script' | 'api' | 'iframe';
}

export class EnhancedDetector {
  private static instance: EnhancedDetector;
  private detectedAgents: Map<string, DetectedAgent> = new Map();
  private isEnabled: boolean = true;
  private observers: Array<(agents: DetectedAgent[]) => void> = [];
  private mutationObserver: MutationObserver | null = null;
  private compatibilityManager: CompatibilityManager;
  private pollingInterval: number | null = null;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): EnhancedDetector {
    if (!EnhancedDetector.instance) {
      EnhancedDetector.instance = new EnhancedDetector();
    }
    return EnhancedDetector.instance;
  }
  
  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    // Initialize compatibility manager
    this.compatibilityManager = CompatibilityManager.getInstance();
    
    // Initialize detection
    this.setupDetection();
    
    // Check for user preference
    this.loadUserPreference();
  }
  
  /**
   * Set up detection mechanisms
   */
  private setupDetection() {
    // Use appropriate detection method based on browser support
    if (this.compatibilityManager.isSupported('intersectionObserver')) {
      this.setupMutationObserver();
    } else {
      this.setupPolling();
    }
    
    // Initial scan
    this.scanForAgents();
    
    // Check for global Promethios context
    this.checkForGlobalContext();
    
    // Check for agents in iframes
    this.scanIframes();
  }
  
  /**
   * Set up mutation observer for modern browsers
   */
  private setupMutationObserver() {
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
        
        // Also check for attribute changes that might indicate a Promethios agent
        if (mutation.type === 'attributes' && 
            (mutation.attributeName?.includes('promethios') || 
             mutation.attributeName?.includes('governance') || 
             mutation.attributeName?.includes('agent'))) {
          shouldScan = true;
          break;
        }
      }
      
      if (shouldScan) {
        this.scanForAgents();
      }
    });
    
    // Start observing with expanded options
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-promethios-agent', 'data-governance-identity', 'data-agent-id', 'class']
    });
  }
  
  /**
   * Set up polling for older browsers
   */
  private setupPolling() {
    // Use polling as fallback for older browsers
    this.pollingInterval = window.setInterval(() => {
      if (this.isEnabled) {
        this.scanForAgents();
      }
    }, 2000); // Poll every 2 seconds
  }
  
  /**
   * Scan the DOM for Promethios-wrapped agents using multiple detection methods
   */
  private scanForAgents() {
    if (!this.isEnabled) return;
    
    // Method 1: Look for elements with Promethios attributes
    this.scanForAttributeBasedAgents();
    
    // Method 2: Look for elements with Promethios classes
    this.scanForClassBasedAgents();
    
    // Method 3: Look for script tags with Promethios configuration
    this.scanForScriptBasedAgents();
    
    // Method 4: Look for API-based agents
    this.scanForAPIBasedAgents();
    
    // Notify observers of any new agents
    this.notifyObservers();
  }
  
  /**
   * Scan for attribute-based agent identification
   */
  private scanForAttributeBasedAgents() {
    // Look for elements with Promethios attributes (multiple patterns)
    const attributeSelectors = [
      '[data-promethios-agent]',
      '[data-governance-identity]',
      '[data-agent-id]',
      '[data-promethios]',
      '[data-promethios-wrapped]',
      '[data-governance]',
      '[promethios-agent]',
      '[promethios]'
    ];
    
    const potentialAgents = document.querySelectorAll(attributeSelectors.join(', '));
    
    // Process found elements
    potentialAgents.forEach(element => {
      // Try multiple attribute patterns to find agent ID
      const agentId = element.getAttribute('data-promethios-agent') || 
                      element.getAttribute('data-agent-id') || 
                      element.getAttribute('promethios-agent') ||
                      element.getAttribute('data-promethios') ||
                      element.id;
      
      if (!agentId || this.detectedAgents.has(agentId)) return;
      
      // Extract governance identity if available (try multiple patterns)
      let governanceIdentity: GovernanceIdentity | undefined;
      const identityAttr = element.getAttribute('data-governance-identity') || 
                           element.getAttribute('governance-identity') ||
                           element.getAttribute('data-promethios-identity');
      
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
        name: element.getAttribute('data-agent-name') || 
              element.getAttribute('agent-name') || 
              element.getAttribute('data-promethios-name') || 
              agentId,
        element: element as HTMLElement,
        governanceIdentity,
        hasEventSurface,
        detectionMethod: 'attribute'
      });
    });
  }
  
  /**
   * Scan for class-based agent identification
   */
  private scanForClassBasedAgents() {
    // Look for elements with Promethios classes
    const classSelectors = [
      '.promethios-governed-agent',
      '.promethios-agent',
      '.promethios-wrapped',
      '.governance-enabled',
      '.promethios-enabled'
    ];
    
    const potentialAgents = document.querySelectorAll(classSelectors.join(', '));
    
    // Process found elements
    potentialAgents.forEach(element => {
      // Try to find agent ID
      const agentId = element.getAttribute('id') || 
                      element.getAttribute('data-id') || 
                      `promethios-agent-${Math.random().toString(36).substring(2, 11)}`;
      
      if (this.detectedAgents.has(agentId)) return;
      
      // Check for event surface
      const hasEventSurface = this.checkForEventSurface(element);
      
      // Add to detected agents
      this.detectedAgents.set(agentId, {
        id: agentId,
        name: element.getAttribute('data-name') || 
              element.getAttribute('aria-label') || 
              agentId,
        element: element as HTMLElement,
        hasEventSurface,
        detectionMethod: 'attribute'
      });
    });
  }
  
  /**
   * Scan for script-based agent configuration
   */
  private scanForScriptBasedAgents() {
    // Look for script tags with Promethios configuration
    const scriptTags = document.querySelectorAll('script[type="application/json"][data-promethios], script[type="application/ld+json"]');
    
    // Process found scripts
    scriptTags.forEach(script => {
      try {
        const content = JSON.parse(script.textContent || '{}');
        
        // Check if this is a Promethios configuration
        if (content.promethios || content.governance || content['@type'] === 'PromethiosAgent') {
          const agentId = content.agentId || 
                          content.id || 
                          `promethios-script-${Math.random().toString(36).substring(2, 11)}`;
          
          if (this.detectedAgents.has(agentId)) return;
          
          // Extract governance identity if available
          let governanceIdentity: GovernanceIdentity | undefined;
          
          if (content.governanceIdentity) {
            governanceIdentity = content.governanceIdentity;
            
            // Validate the governance identity
            if (!validateGovernanceIdentity(governanceIdentity)) {
              console.warn('Invalid governance identity for agent:', agentId);
              governanceIdentity = undefined;
            }
          }
          
          // Add to detected agents
          this.detectedAgents.set(agentId, {
            id: agentId,
            name: content.name || content.agentName || agentId,
            element: null, // No specific element for script-based agents
            governanceIdentity,
            hasEventSurface: false,
            detectionMethod: 'script'
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
  }
  
  /**
   * Scan for API-based agents
   */
  private scanForAPIBasedAgents() {
    // Check for Promethios API on window
    if (window.promethiosAPI) {
      try {
        // Get agents from API
        const agents = window.promethiosAPI.getAgents?.() || [];
        
        agents.forEach(agent => {
          if (!agent.id || this.detectedAgents.has(agent.id)) return;
          
          // Add to detected agents
          this.detectedAgents.set(agent.id, {
            id: agent.id,
            name: agent.name || agent.id,
            element: null, // No specific element for API-based agents
            governanceIdentity: agent.governanceIdentity,
            hasEventSurface: true,
            detectionMethod: 'api'
          });
        });
      } catch (e) {
        console.warn('Error accessing Promethios API:', e);
      }
    }
  }
  
  /**
   * Scan iframes for Promethios agents
   */
  private scanIframes() {
    try {
      // Get all iframes
      const iframes = document.querySelectorAll('iframe');
      
      // Check each iframe
      iframes.forEach(iframe => {
        // Skip cross-origin iframes (we can't access their content)
        try {
          // This will throw an error for cross-origin iframes
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (iframeDoc) {
            // Check for Promethios markers
            const hasPromethios = iframeDoc.querySelector('[data-promethios], .promethios-agent, script[data-promethios]');
            
            if (hasPromethios) {
              const agentId = `iframe-agent-${Math.random().toString(36).substring(2, 11)}`;
              
              // Add to detected agents
              this.detectedAgents.set(agentId, {
                id: agentId,
                name: iframe.title || 'Iframe Agent',
                element: iframe,
                hasEventSurface: false,
                detectionMethod: 'iframe'
              });
            }
          }
        } catch (e) {
          // Cross-origin iframe, can't access content
        }
      });
    } catch (e) {
      console.warn('Error scanning iframes:', e);
    }
  }
  
  /**
   * Check for global Promethios context
   */
  private checkForGlobalContext() {
    if (!this.isEnabled) return;
    
    // Check for global Promethios context (multiple patterns)
    const contexts = [
      window.promethiosAgentContext,
      window.promethiosContext,
      window.governanceContext,
      window.promethios
    ];
    
    // Try each potential context
    for (const context of contexts) {
      if (!context) continue;
      
      // Extract agents from context
      const getAgentsMethod = context.getAgents || context.agents || context.getGovernedAgents;
      const contextAgents = typeof getAgentsMethod === 'function' ? getAgentsMethod() : [];
      
      if (Array.isArray(contextAgents)) {
        contextAgents.forEach(agent => {
          if (!agent.id || this.detectedAgents.has(agent.id)) return;
          
          // Add to detected agents
          this.detectedAgents.set(agent.id, {
            id: agent.id,
            name: agent.name || agent.id,
            element: document.body, // Default to body if no specific element
            governanceIdentity: agent.governanceIdentity,
            hasEventSurface: true,
            detectionMethod: 'global'
          });
        });
      }
      
      // Subscribe to agent additions if available
      const onAgentAddedMethod = context.onAgentAdded || context.addAgentListener;
      
      if (typeof onAgentAddedMethod === 'function') {
        onAgentAddedMethod((agent: any) => {
          if (!this.isEnabled || !agent.id || this.detectedAgents.has(agent.id)) return;
          
          // Add to detected agents
          this.detectedAgents.set(agent.id, {
            id: agent.id,
            name: agent.name || agent.id,
            element: document.body, // Default to body if no specific element
            governanceIdentity: agent.governanceIdentity,
            hasEventSurface: true,
            detectionMethod: 'global'
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
    if (element.hasAttribute('data-promethios-events') || 
        element.hasAttribute('data-governance-events')) {
      return true;
    }
    
    // Check for custom element with event methods (try multiple patterns)
    if (element instanceof HTMLElement) {
      const customElement = element as any;
      return !!(
        typeof customElement.getGovernanceMetrics === 'function' ||
        typeof customElement.getMetrics === 'function' ||
        typeof customElement.getGovernanceIdentity === 'function' ||
        typeof customElement.getIdentity === 'function' ||
        typeof customElement.onGovernanceEvent === 'function' ||
        typeof customElement.addEventListener === 'function' && customElement._promethiosEvents
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
    
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.observers = [];
    this.detectedAgents.clear();
  }
}

// Add type definitions for global Promethios contexts
declare global {
  interface Window {
    promethiosAgentContext?: any;
    promethiosContext?: any;
    governanceContext?: any;
    promethios?: any;
    promethiosAPI?: any;
  }
}

export default EnhancedDetector;
