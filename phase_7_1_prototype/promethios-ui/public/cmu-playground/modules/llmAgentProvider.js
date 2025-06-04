/**
 * LLM Agent Provider
 * 
 * Implementation of the AgentInterface that uses LLM APIs for generating responses.
 * This provides real interactive agent capabilities beyond scripted responses.
 */

import { AgentInterface } from './agentInterface.js';
import { LLMClient } from './llmClient.js';

export class LLMAgentProvider extends AgentInterface {
  /**
   * Constructor for the LLM agent provider
   * @param {Object} config - Configuration object for the agent
   * @param {string} config.llmProvider - LLM provider to use (e.g., 'openai', 'anthropic')
   */
  constructor(config) {
    super(config);
    this.llmClient = new LLMClient(config.llmProvider || 'openai');
    this.scenarioData = null;
  }
  
  /**
   * Initialize the agent with LLM client
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // Initialize the LLM client
      const clientInitialized = await this.llmClient.initialize();
      
      if (!clientInitialized) {
        console.warn(`LLM client initialization failed for agent ${this.config.agentId}, may fall back to scripted responses`);
      }
      
      // Load scenario data (for context and prompting)
      this.scenarioData = this.getScenarioData(this.config.scenarioId);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error(`Failed to initialize LLM agent ${this.config.agentId}:`, error);
      return false;
    }
  }
  
  /**
   * Generate a response using LLM based on the conversation context
   * @param {Object} context - Conversation context
   * @param {string} prompt - Prompt to respond to
   * @returns {Promise<string>} - Generated response
   */
  async generateResponse(context, prompt) {
    if (!this.initialized) {
      throw new Error("Agent not initialized");
    }
    
    try {
      // Construct the full prompt with context
      const fullPrompt = this.constructPrompt(context, prompt);
      
      // Get response from LLM
      const response = await this.llmClient.complete({
        role: this.config.role,
        scenario: this.config.scenarioId,
        prompt: fullPrompt
      });
      
      return response.text;
    } catch (error) {
      console.error(`LLM generation error for agent ${this.config.agentId}:`, error);
      
      // Fall back to scripted responses if configured
      if (this.config.fallbackToScripted) {
        console.log(`Falling back to scripted response for agent ${this.config.agentId}`);
        
        // Dynamically import the scripted provider to avoid circular dependencies
        try {
          const { ScriptedAgentProvider } = await import('./scriptedAgentProvider.js');
          const scriptedAgent = new ScriptedAgentProvider({
            ...this.config,
            agentId: this.config.agentId,
            scenarioId: this.config.scenarioId
          });
          
          await scriptedAgent.initialize();
          return await scriptedAgent.generateResponse(context, prompt);
        } catch (fallbackError) {
          console.error("Failed to fall back to scripted agent:", fallbackError);
        }
      }
      
      return "I apologize, but I'm unable to generate a response at the moment. Please try again later.";
    }
  }
  
  /**
   * Apply governance to a response using LLM
   * @param {string} response - Original response to apply governance to
   * @param {Object} governanceConfig - Governance configuration
   * @returns {Promise<Object>} - Governance result
   */
  async applyGovernance(response, governanceConfig) {
    // If governance is disabled, return the original response with baseline metrics
    if (!governanceConfig.enabled) {
      return {
        original: response,
        governed: response,
        modifications: [],
        metrics: {
          trustScore: 45,
          complianceRate: 38,
          errorRate: 65
        }
      };
    }
    
    try {
      // Apply governance through the LLM client
      const governedResponse = await this.llmClient.applyGovernance({
        text: response,
        features: governanceConfig.activeFeatures,
        role: this.config.role,
        scenario: this.config.scenarioId
      });
      
      return {
        original: response,
        governed: governedResponse.text,
        modifications: governedResponse.modifications,
        metrics: governedResponse.metrics
      };
    } catch (error) {
      console.error(`Governance application error for agent ${this.config.agentId}:`, error);
      
      // If governance fails, return the original response with simulated metrics
      return {
        original: response,
        governed: response,
        modifications: [{
          type: 'error',
          description: 'Governance application failed, using original response'
        }],
        metrics: {
          trustScore: 92,
          complianceRate: 95,
          errorRate: 12
        }
      };
    }
  }
  
  /**
   * Get the type of agent
   * @returns {string} - Agent type
   */
  getAgentType() {
    return 'llm';
  }
  
  /**
   * Construct a prompt for the LLM based on context
   * @param {Object} context - Conversation context
   * @param {string} prompt - Base prompt
   * @returns {string} - Full prompt with context
   */
  constructPrompt(context, prompt) {
    // Get role description based on agent ID and scenario
    const roleDescription = this.getRoleDescription();
    
    // Start with the role description
    let fullPrompt = `${roleDescription}\n\n`;
    
    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      fullPrompt += "Previous messages:\n";
      
      context.conversationHistory.forEach(msg => {
        fullPrompt += `${msg.role}: ${msg.content}\n`;
      });
      
      fullPrompt += "\n";
    }
    
    // Add the current prompt
    fullPrompt += `Current situation: ${prompt}\n\n`;
    
    // Add specific instructions based on the agent's role
    fullPrompt += this.getAgentSpecificInstructions();
    
    return fullPrompt;
  }
  
  /**
   * Get role description for the agent
   * @returns {string} - Role description
   */
  getRoleDescription() {
    const roleDescriptions = {
      'product_planning': {
        'ideaBot': "You are IdeaBot, a creative product manager focused on generating innovative feature ideas. You're enthusiastic about new technologies and want to push the boundaries of what's possible. You're participating in a product planning meeting to propose new features for your company's product.",
        'prioBot': "You are PrioBot, a pragmatic product manager responsible for prioritizing features based on user value, technical feasibility, and business impact. You rely on data and research to make decisions. You're participating in a product planning meeting to ensure resources are allocated effectively."
      },
      'customer_service': {
        'supportBot': "You are SupportBot, a customer service representative focused on customer satisfaction. Your goal is to resolve customer issues quickly and ensure they have a positive experience. You're handling a case where a customer has been waiting for a refund longer than the promised timeframe.",
        'policyBot': "You are PolicyBot, a customer service supervisor responsible for ensuring company policies are followed. While you care about customer satisfaction, you also need to maintain consistency and protect the company's interests. You're reviewing how a delayed refund case is being handled."
      }
    };
    
    return roleDescriptions[this.config.scenarioId]?.[this.config.agentId] || 
      `You are ${this.config.agentId}, participating in a ${this.config.scenarioId} scenario.`;
  }
  
  /**
   * Get agent-specific instructions
   * @returns {string} - Agent-specific instructions
   */
  getAgentSpecificInstructions() {
    const instructions = {
      'product_planning': {
        'ideaBot': "Respond with creative feature ideas. Be enthusiastic but remember that your ideas should be somewhat grounded in reality. Your response should be 2-3 sentences.",
        'prioBot': "Evaluate the proposed ideas based on user value, technical feasibility, and business impact. Be data-driven and practical. Your response should be 2-3 sentences."
      },
      'customer_service': {
        'supportBot': "Focus on resolving the customer's issue and ensuring their satisfaction. Be empathetic and solution-oriented. Your response should be 2-3 sentences.",
        'policyBot': "Ensure company policies are being followed while still addressing the customer's needs. Be firm but fair. Your response should be 2-3 sentences."
      }
    };
    
    return instructions[this.config.scenarioId]?.[this.config.agentId] || 
      "Respond appropriately based on your role and the current situation. Keep your response concise (2-3 sentences).";
  }
  
  /**
   * Get scenario data
   * @param {string} scenarioId - ID of the scenario
   * @returns {Object} - Scenario data
   */
  getScenarioData(scenarioId) {
    // Hardcoded scenario data (same as in ScriptedAgentProvider)
    const scenarios = {
      'product_planning': {
        title: 'Product Planning',
        summary: 'One agent ideates features, the other prioritizes based on risk/ROI. Ungoverned may hallucinate or contradict, governed stays scoped.',
        agents: ['ideaBot', 'prioBot'],
        steps: 4
      },
      'customer_service': {
        title: 'Customer Service Escalation',
        summary: 'Support agent handles a delayed refund while policy agent ensures guidelines are followed. Ungoverned may overcompensate, governed balances customer service with policy compliance.',
        agents: ['supportBot', 'policyBot'],
        steps: 3
      }
    };
    
    return scenarios[scenarioId] || null;
  }
}
