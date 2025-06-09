/**
 * Observer OpenAI Integration Service
 * 
 * This service provides OpenAI-powered chat functionality for the Observer agent.
 * It only uses tokens when users actively chat with the Observer, while automatic
 * reporting uses free system-generated insights.
 */

const axios = require('axios');

class ObserverOpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = 'gpt-3.5-turbo';
    this.conversationHistory = new Map(); // Map of agentId -> conversation history
    this.tokenUsage = new Map(); // Map of agentId -> token usage tracking
  }

  /**
   * Chat with the Observer about a specific agent
   * 
   * @param {string} agentId - Agent identifier
   * @param {string} userMessage - User's question or message
   * @param {Object} systemInsights - Current system insights for context
   * @param {Object} agentConfig - Agent configuration for context
   * @returns {Object} Observer response and token usage
   */
  async chatWithObserver(agentId, userMessage, systemInsights = {}, agentConfig = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured for Observer chat');
    }

    try {
      // Get or create conversation history for this agent
      const conversationKey = `${agentId}_observer_chat`;
      let conversation = this.conversationHistory.get(conversationKey) || [];

      // Build context-aware system prompt
      const systemPrompt = this._buildObserverSystemPrompt(agentId, systemInsights, agentConfig);

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation,
        { role: 'user', content: userMessage }
      ];

      // Call OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const observerResponse = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage;

      // Update conversation history (keep last 10 exchanges)
      conversation.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: observerResponse }
      );
      
      if (conversation.length > 20) { // 10 exchanges = 20 messages
        conversation = conversation.slice(-20);
      }
      
      this.conversationHistory.set(conversationKey, conversation);

      // Track token usage
      this._trackTokenUsage(agentId, tokensUsed);

      return {
        response: observerResponse,
        tokenUsage: tokensUsed,
        conversationId: conversationKey,
        timestamp: new Date().toISOString(),
        cost: this._calculateCost(tokensUsed)
      };

    } catch (error) {
      console.error('Observer OpenAI chat error:', error.response?.data || error.message);
      throw new Error(`Observer chat failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get Observer insights about an agent using OpenAI
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} systemInsights - System-generated insights
   * @param {Object} agentConfig - Agent configuration
   * @returns {Object} Observer analysis
   */
  async getObserverAnalysis(agentId, systemInsights, agentConfig) {
    const analysisPrompt = `Based on the following data about agent "${agentConfig.agentName || agentId}", provide a brief analysis of its governance status and any recommendations:

System Insights:
${JSON.stringify(systemInsights, null, 2)}

Please provide:
1. A summary of the agent's current governance status
2. Key patterns or concerns
3. Specific recommendations for improvement

Keep the response concise and actionable.`;

    try {
      const result = await this.chatWithObserver(agentId, analysisPrompt, systemInsights, agentConfig);
      return {
        analysis: result.response,
        tokenUsage: result.tokenUsage,
        cost: result.cost,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error('Observer analysis error:', error);
      return {
        analysis: 'Observer analysis temporarily unavailable. Using system insights only.',
        error: error.message,
        tokenUsage: { total_tokens: 0 },
        cost: 0
      };
    }
  }

  /**
   * Build context-aware system prompt for the Observer
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} systemInsights - Current system insights
   * @param {Object} agentConfig - Agent configuration
   * @returns {string} System prompt
   */
  _buildObserverSystemPrompt(agentId, systemInsights, agentConfig) {
    const agentName = agentConfig.agentName || agentId;
    const agentType = agentConfig.agentType || 'unknown';
    const governanceLevel = agentConfig.governanceLevel || 'standard';

    return `You are the Promethios Observer, an AI governance expert monitoring agent "${agentName}" (ID: ${agentId}).

AGENT CONTEXT:
- Type: ${agentType}
- Governance Level: ${governanceLevel}
- Current Status: ${systemInsights.observerStatus || 'active'}

CURRENT SYSTEM INSIGHTS:
${JSON.stringify(systemInsights, null, 2)}

YOUR ROLE:
You are an expert in AI governance and constitutional frameworks. You monitor this specific agent's behavior and provide insights about:
- Governance effectiveness and compliance
- Trust score trends and violations
- Behavioral patterns and recommendations
- Constitutional framework adherence

COMMUNICATION STYLE:
- Be conversational and helpful
- Focus on governance insights specific to this agent
- Provide actionable recommendations
- Use the system insights as factual basis for your analysis
- Explain governance concepts clearly
- Be concise but thorough

IMPORTANT:
- Only discuss governance topics related to Promethios framework
- Base your responses on the provided system insights
- Don't make up data - use only what's provided in the context
- Focus specifically on this agent's behavior and patterns

The user may ask questions about this agent's governance status, violations, trust scores, or request recommendations for improvement.`;
  }

  /**
   * Track token usage for billing and monitoring
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} tokensUsed - Token usage from OpenAI response
   */
  _trackTokenUsage(agentId, tokensUsed) {
    const current = this.tokenUsage.get(agentId) || {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalCost: 0,
      requestCount: 0,
      lastUsed: null
    };

    current.totalTokens += tokensUsed.total_tokens;
    current.promptTokens += tokensUsed.prompt_tokens;
    current.completionTokens += tokensUsed.completion_tokens;
    current.totalCost += this._calculateCost(tokensUsed);
    current.requestCount += 1;
    current.lastUsed = new Date().toISOString();

    this.tokenUsage.set(agentId, current);
  }

  /**
   * Calculate cost based on token usage
   * 
   * @param {Object} tokensUsed - Token usage object
   * @returns {number} Cost in USD
   */
  _calculateCost(tokensUsed) {
    // GPT-3.5-turbo pricing (as of 2024)
    const promptCostPer1K = 0.0015; // $0.0015 per 1K prompt tokens
    const completionCostPer1K = 0.002; // $0.002 per 1K completion tokens

    const promptCost = (tokensUsed.prompt_tokens / 1000) * promptCostPer1K;
    const completionCost = (tokensUsed.completion_tokens / 1000) * completionCostPer1K;

    return promptCost + completionCost;
  }

  /**
   * Get token usage statistics for an agent
   * 
   * @param {string} agentId - Agent identifier
   * @returns {Object} Token usage statistics
   */
  getTokenUsage(agentId) {
    return this.tokenUsage.get(agentId) || {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalCost: 0,
      requestCount: 0,
      lastUsed: null
    };
  }

  /**
   * Get conversation history for an agent
   * 
   * @param {string} agentId - Agent identifier
   * @returns {Array} Conversation history
   */
  getConversationHistory(agentId) {
    const conversationKey = `${agentId}_observer_chat`;
    return this.conversationHistory.get(conversationKey) || [];
  }

  /**
   * Clear conversation history for an agent
   * 
   * @param {string} agentId - Agent identifier
   */
  clearConversationHistory(agentId) {
    const conversationKey = `${agentId}_observer_chat`;
    this.conversationHistory.delete(conversationKey);
  }

  /**
   * Get total token usage across all agents
   * 
   * @returns {Object} Aggregate token usage
   */
  getTotalTokenUsage() {
    let total = {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalCost: 0,
      requestCount: 0,
      agentCount: this.tokenUsage.size
    };

    for (const usage of this.tokenUsage.values()) {
      total.totalTokens += usage.totalTokens;
      total.promptTokens += usage.promptTokens;
      total.completionTokens += usage.completionTokens;
      total.totalCost += usage.totalCost;
      total.requestCount += usage.requestCount;
    }

    return total;
  }

  /**
   * Check if Observer chat is available
   * 
   * @returns {boolean} Whether Observer chat is available
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Get Observer service status
   * 
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      model: this.model,
      activeConversations: this.conversationHistory.size,
      totalAgentsTracked: this.tokenUsage.size,
      totalTokenUsage: this.getTotalTokenUsage()
    };
  }
}

module.exports = ObserverOpenAIService;

