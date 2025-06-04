/**
 * Agent Interface
 * 
 * This defines the common interface that both scripted and LLM-powered agents will implement.
 * It ensures consistent behavior regardless of the underlying implementation.
 */

export class AgentInterface {
  /**
   * Constructor for the agent interface
   * @param {Object} config - Configuration object for the agent
   * @param {string} config.agentId - Unique identifier for this agent
   * @param {string} config.scenarioId - ID of the scenario this agent is participating in
   * @param {string} config.role - Role of this agent in the scenario
   * @param {boolean} config.fallbackToScripted - Whether to fall back to scripted responses on failure
   */
  constructor(config) {
    this.config = config;
    this.initialized = false;
  }
  
  /**
   * Initialize the agent with necessary data
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    throw new Error("Method 'initialize' must be implemented by subclass");
  }
  
  /**
   * Generate a response based on the conversation context and prompt
   * @param {Object} context - Conversation context
   * @param {string} context.agentRole - Role of the agent in the conversation
   * @param {Array} context.conversationHistory - Previous messages in the conversation
   * @param {number} context.currentStep - Current step in the conversation
   * @param {string} prompt - Prompt to respond to
   * @returns {Promise<string>} - Generated response
   */
  async generateResponse(context, prompt) {
    throw new Error("Method 'generateResponse' must be implemented by subclass");
  }
  
  /**
   * Apply governance to a response
   * @param {string} response - Original response to apply governance to
   * @param {Object} governanceConfig - Governance configuration
   * @param {boolean} governanceConfig.enabled - Whether governance is enabled
   * @param {Object} governanceConfig.activeFeatures - Active governance features
   * @returns {Promise<Object>} - Governance result
   * @returns {string} return.original - Original response
   * @returns {string} return.governed - Governed response
   * @returns {Array} return.modifications - List of modifications made
   * @returns {Object} return.metrics - Governance metrics
   */
  async applyGovernance(response, governanceConfig) {
    throw new Error("Method 'applyGovernance' must be implemented by subclass");
  }
  
  /**
   * Get agent metadata
   * @returns {Object} - Agent metadata
   */
  getMetadata() {
    return {
      id: this.config.agentId,
      role: this.config.role,
      scenarioId: this.config.scenarioId,
      type: this.getAgentType()
    };
  }
  
  /**
   * Get the type of agent (to be implemented by subclasses)
   * @returns {string} - Agent type
   */
  getAgentType() {
    throw new Error("Method 'getAgentType' must be implemented by subclass");
  }
}
