/**
 * GovernanceDiscoveryProtocol.ts
 * 
 * Implements the Governance Discovery Protocol for finding and validating
 * Promethios-wrapped agents across different environments
 */

import { GovernanceIdentity } from './GovernanceIdentity';
import { VerifiableTrust, DeploymentToken, GovernanceManifest } from './VerifiableTrust';
import { CrossOriginAdapter } from './CrossOriginAdapter';

export interface DiscoveredAgent {
  id: string;
  name: string;
  element?: HTMLElement;
  governanceIdentity?: GovernanceIdentity;
  deploymentToken?: DeploymentToken;
  manifest?: GovernanceManifest;
  verificationStatus: 'verified' | 'pending' | 'failed';
  verificationDetails?: string;
  discoveryMethod: 'registration' | 'attribute' | 'global' | 'script' | 'api';
}

export class GovernanceDiscoveryProtocol {
  private static instance: GovernanceDiscoveryProtocol;
  private discoveredAgents: Map<string, DiscoveredAgent> = new Map();
  private observers: Array<(agents: DiscoveredAgent[]) => void> = [];
  private verifiableTrust: VerifiableTrust;
  private crossOriginAdapter: CrossOriginAdapter;
  private isInitialized: boolean = false;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): GovernanceDiscoveryProtocol {
    if (!GovernanceDiscoveryProtocol.instance) {
      GovernanceDiscoveryProtocol.instance = new GovernanceDiscoveryProtocol();
    }
    return GovernanceDiscoveryProtocol.instance;
  }
  
  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    this.verifiableTrust = VerifiableTrust.getInstance();
    this.crossOriginAdapter = CrossOriginAdapter.getInstance();
  }
  
  /**
   * Initialize the discovery protocol
   */
  public init(): void {
    if (this.isInitialized) return;
    
    // Initialize cross-origin adapter
    this.crossOriginAdapter.init();
    
    // Set up discovery methods
    this.setupWindowRegistrationListener();
    this.checkForRegisteredAgents();
    this.scanForAgentAttributes();
    this.checkForGlobalContext();
    this.scanForScriptTags();
    
    this.isInitialized = true;
  }
  
  /**
   * Set up listener for window registration events
   */
  private setupWindowRegistrationListener(): void {
    // Listen for agent registration
    window.addEventListener('promethios:register-agent', (event: CustomEvent) => {
      const registration = event.detail;
      
      if (registration && registration.agentId) {
        this.registerAgent(registration);
      }
    });
    
    // Listen for cross-origin registration
    this.crossOriginAdapter.on('register_agent', (payload) => {
      if (payload && payload.agentId) {
        this.registerAgent(payload);
      }
    });
  }
  
  /**
   * Check for agents already registered on window
   */
  private checkForRegisteredAgents(): void {
    // Check for standard registration object
    if (window.__PROMETHIOS_AGENT__) {
      this.registerAgent(window.__PROMETHIOS_AGENT__);
    }
    
    // Check for multiple agents
    if (window.__PROMETHIOS_AGENTS__ && Array.isArray(window.__PROMETHIOS_AGENTS__)) {
      window.__PROMETHIOS_AGENTS__.forEach(agent => {
        this.registerAgent(agent);
      });
    }
  }
  
  /**
   * Scan for agent attributes in DOM
   */
  private scanForAgentAttributes(): void {
    // Look for elements with Promethios governance attributes
    const elements = document.querySelectorAll(
      '[data-promethios-agent], ' +
      '[data-governance-identity], ' +
      '[data-promethios-token]'
    );
    
    elements.forEach(element => {
      const agentId = element.getAttribute('data-promethios-agent') || 
                      element.getAttribute('data-agent-id') || 
                      element.id;
      
      if (!agentId) return;
      
      // Extract governance identity
      let governanceIdentity: GovernanceIdentity | undefined;
      const identityAttr = element.getAttribute('data-governance-identity');
      
      if (identityAttr) {
        try {
          governanceIdentity = JSON.parse(identityAttr);
        } catch (e) {
          console.warn('Failed to parse governance identity:', e);
        }
      }
      
      // Extract deployment token
      let deploymentToken: DeploymentToken | undefined;
      const tokenAttr = element.getAttribute('data-promethios-token');
      
      if (tokenAttr) {
        try {
          deploymentToken = JSON.parse(tokenAttr);
        } catch (e) {
          console.warn('Failed to parse deployment token:', e);
        }
      }
      
      // Register agent
      this.registerAgent({
        agentId,
        name: element.getAttribute('data-agent-name') || agentId,
        element: element as HTMLElement,
        governanceIdentity,
        deploymentToken,
        discoveryMethod: 'attribute'
      });
    });
  }
  
  /**
   * Check for global context with agent information
   */
  private checkForGlobalContext(): void {
    // Check various global contexts
    const contexts = [
      window.promethiosAgentContext,
      window.promethiosContext,
      window.governanceContext
    ];
    
    for (const context of contexts) {
      if (!context) continue;
      
      // Get agents from context
      const getAgentsMethod = context.getAgents || context.agents;
      const agents = typeof getAgentsMethod === 'function' ? getAgentsMethod() : [];
      
      if (Array.isArray(agents)) {
        agents.forEach(agent => {
          if (!agent.id) return;
          
          this.registerAgent({
            agentId: agent.id,
            name: agent.name || agent.id,
            governanceIdentity: agent.governanceIdentity,
            deploymentToken: agent.deploymentToken,
            manifest: agent.manifest,
            discoveryMethod: 'global'
          });
        });
      }
    }
  }
  
  /**
   * Scan for script tags with agent configuration
   */
  private scanForScriptTags(): void {
    // Look for script tags with Promethios configuration
    const scripts = document.querySelectorAll(
      'script[type="application/json"][data-promethios], ' +
      'script[type="application/ld+json"]'
    );
    
    scripts.forEach(script => {
      try {
        const content = JSON.parse(script.textContent || '{}');
        
        // Check if this is a Promethios configuration
        if (content.promethios || content.governance || content['@type'] === 'PromethiosAgent') {
          const agentId = content.agentId || content.id;
          
          if (!agentId) return;
          
          this.registerAgent({
            agentId,
            name: content.name || content.agentName || agentId,
            governanceIdentity: content.governanceIdentity,
            deploymentToken: content.deploymentToken,
            manifest: content.manifest,
            discoveryMethod: 'script'
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
  }
  
  /**
   * Register an agent with the discovery protocol
   */
  private registerAgent(registration: any): void {
    const agentId = registration.agentId || registration.id;
    
    if (!agentId || this.discoveredAgents.has(agentId)) return;
    
    // Create discovered agent
    const agent: DiscoveredAgent = {
      id: agentId,
      name: registration.name || agentId,
      element: registration.element,
      governanceIdentity: registration.governanceIdentity,
      deploymentToken: registration.deploymentToken,
      manifest: registration.manifest,
      verificationStatus: 'pending',
      discoveryMethod: registration.discoveryMethod || 'registration'
    };
    
    // Add to discovered agents
    this.discoveredAgents.set(agentId, agent);
    
    // Verify the agent
    this.verifyAgent(agent);
    
    // Notify observers
    this.notifyObservers();
  }
  
  /**
   * Verify an agent's governance credentials
   */
  private async verifyAgent(agent: DiscoveredAgent): Promise<void> {
    try {
      // Verify deployment token if available
      if (agent.deploymentToken) {
        const isTokenValid = this.verifiableTrust.verifyDeploymentToken(agent.deploymentToken);
        
        if (!isTokenValid) {
          agent.verificationStatus = 'failed';
          agent.verificationDetails = 'Invalid deployment token';
          this.notifyObservers();
          return;
        }
      } else {
        // Try to create a test token for development
        agent.deploymentToken = this.verifiableTrust.createTestToken(agent.id);
      }
      
      // Verify manifest
      const manifestUrl = agent.governanceIdentity?.governanceProfileUrl;
      const verificationStatus = await this.verifiableTrust.fetchAndVerifyManifest(agent.id, manifestUrl);
      
      // Update agent verification status
      agent.verificationStatus = verificationStatus === 'verified' ? 'verified' : 'failed';
      agent.verificationDetails = verificationStatus;
      
      // Notify observers
      this.notifyObservers();
    } catch (error) {
      console.error('Error verifying agent:', error);
      
      agent.verificationStatus = 'failed';
      agent.verificationDetails = 'Verification error';
      
      this.notifyObservers();
    }
  }
  
  /**
   * Notify observers of changes
   */
  private notifyObservers(): void {
    const agents = Array.from(this.discoveredAgents.values());
    this.observers.forEach(observer => observer(agents));
  }
  
  /**
   * Get all discovered agents
   */
  public getDiscoveredAgents(): DiscoveredAgent[] {
    return Array.from(this.discoveredAgents.values());
  }
  
  /**
   * Get verified agents only
   */
  public getVerifiedAgents(): DiscoveredAgent[] {
    return this.getDiscoveredAgents().filter(agent => agent.verificationStatus === 'verified');
  }
  
  /**
   * Subscribe to agent discovery events
   */
  public subscribe(callback: (agents: DiscoveredAgent[]) => void): () => void {
    this.observers.push(callback);
    
    // Immediately notify with current agents
    callback(this.getDiscoveredAgents());
    
    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(observer => observer !== callback);
    };
  }
  
  /**
   * Register the current page as a Promethios agent host
   */
  public registerCurrentPage(agentConfig: {
    agentId: string;
    name: string;
    governanceIdentity?: GovernanceIdentity;
    deploymentToken?: DeploymentToken;
  }): void {
    // Create window registration object
    window.__PROMETHIOS_AGENT__ = {
      agentId: agentConfig.agentId,
      name: agentConfig.name,
      governanceIdentity: agentConfig.governanceIdentity,
      deploymentToken: agentConfig.deploymentToken
    };
    
    // Dispatch registration event
    window.dispatchEvent(new CustomEvent('promethios:register-agent', {
      detail: window.__PROMETHIOS_AGENT__
    }));
  }
}

// Add type definitions for global Promethios registration
declare global {
  interface Window {
    __PROMETHIOS_AGENT__?: any;
    __PROMETHIOS_AGENTS__?: any[];
    promethiosAgentContext?: any;
    promethiosContext?: any;
    governanceContext?: any;
  }
}

export default GovernanceDiscoveryProtocol;
