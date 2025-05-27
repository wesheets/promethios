/**
 * Agent Registry Component
 * 
 * Maintains information about available agents, their capabilities,
 * governance identities, and trust relationships.
 * 
 * @module src/modules/multi_agent_coordination/agent_registry
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Agent Registry class
 */
class AgentRegistry {
  /**
   * Create a new Agent Registry instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.governanceIdentity - Governance Identity module instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.governanceIdentity = options.governanceIdentity;
    this.config = options.config || {};
    
    // Initialize agents map
    this.agents = new Map();
    
    // Initialize context-agent mapping
    this.contextAgents = new Map();
    
    this.logger.info('Agent Registry initialized');
  }
  
  /**
   * Register an agent with the registry
   * 
   * @param {Object} agent - Agent to register
   * @returns {Object} Registration result
   */
  registerAgent(agent) {
    if (!agent.id) {
      throw new Error('Agent must have an id');
    }
    
    // Check if agent already registered
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent already registered: ${agent.id}`);
    }
    
    // Create agent record
    const agentRecord = {
      id: agent.id,
      name: agent.name || agent.id,
      capabilities: agent.capabilities || {},
      governanceIdentity: agent.governanceIdentity || null,
      hasGovernanceIdentity: !!agent.governanceIdentity,
      registeredAt: new Date().toISOString(),
      contexts: [],
      status: 'active'
    };
    
    this.agents.set(agent.id, agentRecord);
    
    this.logger.info('Agent registered', { agentId: agent.id });
    
    return {
      id: agent.id,
      registered: true,
      timestamp: agentRecord.registeredAt
    };
  }
  
  /**
   * Check if an agent is registered
   * 
   * @param {string} agentId - Agent ID to check
   * @returns {boolean} Whether agent is registered
   */
  isAgentRegistered(agentId) {
    return this.agents.has(agentId);
  }
  
  /**
   * Check if an agent has governance identity
   * 
   * @param {string} agentId - Agent ID to check
   * @returns {boolean} Whether agent has governance identity
   */
  hasGovernanceIdentity(agentId) {
    if (!this.isAgentRegistered(agentId)) {
      return false;
    }
    
    return this.agents.get(agentId).hasGovernanceIdentity;
  }
  
  /**
   * Get agent governance identity
   * 
   * @param {string} agentId - Agent ID
   * @returns {Object|null} Agent governance identity or null if not available
   */
  getAgentGovernanceIdentity(agentId) {
    if (!this.isAgentRegistered(agentId)) {
      return null;
    }
    
    return this.agents.get(agentId).governanceIdentity;
  }
  
  /**
   * Add agent to context
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   */
  addAgentToContext(contextId, agentId) {
    if (!this.isAgentRegistered(agentId)) {
      throw new Error(`Agent not registered: ${agentId}`);
    }
    
    // Initialize context agents if needed
    if (!this.contextAgents.has(contextId)) {
      this.contextAgents.set(contextId, new Set());
    }
    
    // Add agent to context
    this.contextAgents.get(contextId).add(agentId);
    
    // Add context to agent
    const agent = this.agents.get(agentId);
    if (!agent.contexts.includes(contextId)) {
      agent.contexts.push(contextId);
    }
    
    this.logger.info('Agent added to context', { contextId, agentId });
  }
  
  /**
   * Remove agent from context
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   */
  removeAgentFromContext(contextId, agentId) {
    if (!this.contextAgents.has(contextId)) {
      return;
    }
    
    // Remove agent from context
    this.contextAgents.get(contextId).delete(agentId);
    
    // Remove context from agent
    if (this.isAgentRegistered(agentId)) {
      const agent = this.agents.get(agentId);
      agent.contexts = agent.contexts.filter(id => id !== contextId);
    }
    
    this.logger.info('Agent removed from context', { contextId, agentId });
  }
  
  /**
   * Get agents in context
   * 
   * @param {string} contextId - Context ID
   * @returns {Array} Array of agents in context
   */
  getAgentsInContext(contextId) {
    if (!this.contextAgents.has(contextId)) {
      return [];
    }
    
    const agentIds = Array.from(this.contextAgents.get(contextId));
    return agentIds.map(id => this.agents.get(id)).filter(Boolean);
  }
  
  /**
   * Get agent by ID
   * 
   * @param {string} agentId - Agent ID
   * @returns {Object|null} Agent record or null if not found
   */
  getAgent(agentId) {
    if (!this.isAgentRegistered(agentId)) {
      return null;
    }
    
    return { ...this.agents.get(agentId) };
  }
  
  /**
   * Update agent capabilities
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} capabilities - Updated capabilities
   * @returns {boolean} Whether update was successful
   */
  updateAgentCapabilities(agentId, capabilities) {
    if (!this.isAgentRegistered(agentId)) {
      return false;
    }
    
    const agent = this.agents.get(agentId);
    agent.capabilities = { ...agent.capabilities, ...capabilities };
    
    this.logger.info('Agent capabilities updated', { agentId });
    
    return true;
  }
  
  /**
   * Update agent governance identity
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} governanceIdentity - Updated governance identity
   * @returns {boolean} Whether update was successful
   */
  updateAgentGovernanceIdentity(agentId, governanceIdentity) {
    if (!this.isAgentRegistered(agentId)) {
      return false;
    }
    
    const agent = this.agents.get(agentId);
    agent.governanceIdentity = governanceIdentity;
    agent.hasGovernanceIdentity = !!governanceIdentity;
    
    this.logger.info('Agent governance identity updated', { 
      agentId,
      hasGovernanceIdentity: agent.hasGovernanceIdentity
    });
    
    return true;
  }
  
  /**
   * Deactivate agent
   * 
   * @param {string} agentId - Agent ID
   * @returns {boolean} Whether deactivation was successful
   */
  deactivateAgent(agentId) {
    if (!this.isAgentRegistered(agentId)) {
      return false;
    }
    
    const agent = this.agents.get(agentId);
    agent.status = 'inactive';
    
    this.logger.info('Agent deactivated', { agentId });
    
    return true;
  }
  
  /**
   * Activate agent
   * 
   * @param {string} agentId - Agent ID
   * @returns {boolean} Whether activation was successful
   */
  activateAgent(agentId) {
    if (!this.isAgentRegistered(agentId)) {
      return false;
    }
    
    const agent = this.agents.get(agentId);
    agent.status = 'active';
    
    this.logger.info('Agent activated', { agentId });
    
    return true;
  }
  
  /**
   * Get all registered agents
   * 
   * @returns {Array} Array of all registered agents
   */
  getAllAgents() {
    return Array.from(this.agents.values()).map(agent => ({ ...agent }));
  }
  
  /**
   * Get agents with governance identity
   * 
   * @returns {Array} Array of agents with governance identity
   */
  getAgentsWithGovernanceIdentity() {
    return Array.from(this.agents.values())
      .filter(agent => agent.hasGovernanceIdentity)
      .map(agent => ({ ...agent }));
  }
  
  /**
   * Get agents without governance identity
   * 
   * @returns {Array} Array of agents without governance identity
   */
  getAgentsWithoutGovernanceIdentity() {
    return Array.from(this.agents.values())
      .filter(agent => !agent.hasGovernanceIdentity)
      .map(agent => ({ ...agent }));
  }
  
  /**
   * Shutdown the agent registry
   */
  shutdown() {
    this.logger.info('Shutting down Agent Registry');
    
    // Clear all data
    this.agents.clear();
    this.contextAgents.clear();
  }
}

module.exports = AgentRegistry;
