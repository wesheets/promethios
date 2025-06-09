/**
 * Agent Wrapper Service
 * 
 * This service wraps external agent APIs and applies Promethios governance layers.
 * It handles the core functionality of the governance toggle by either applying
 * or bypassing governance based on user preferences. Every wrapped agent receives
 * a governance identity and scorecard for transparency and verification.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AgentWrapperService {
  constructor() {
    this.config = null;
    this.governanceService = null;
    this.governanceIdentityService = null;
    this.agentObserverService = null;
    this.governanceIdentity = null;
    this.agentObserver = null;
  }

  /**
   * Configure the agent wrapper with agent details and governance settings
   * 
   * @param {Object} config - Configuration object
   * @param {string} config.agentId - ID of the agent
   * @param {string} config.agentType - Type of agent (openai, claude, custom)
   * @param {string} config.apiEndpoint - External API endpoint (optional)
   * @param {boolean} config.governanceEnabled - Whether governance is enabled
   * @param {string} config.governanceLevel - Level of governance (basic, standard, strict, maximum)
   * @param {string} config.agentName - Name of the agent (optional)
   */
  async configure(config) {
    this.config = config;
    
    // Initialize governance identity service
    const GovernanceIdentityService = require('./governanceIdentityService');
    this.governanceIdentityService = new GovernanceIdentityService();
    
    // Initialize agent observer service
    const AgentObserverService = require('./agentObserverService');
    this.agentObserverService = new AgentObserverService();
    
    // Check if agent already has governance identity
    this.governanceIdentity = this.governanceIdentityService.getGovernanceIdentity(config.agentId);
    
    // Create governance identity if this is the first time wrapping this agent
    if (!this.governanceIdentity) {
      this.governanceIdentity = await this.governanceIdentityService.createGovernanceIdentity(config);
      console.log(`🆔 Created governance identity for agent: ${config.agentId}`);
      console.log(`📊 Scorecard available at: ${this.governanceIdentity.scorecardUrl}`);
    }
    
    // Create or get agent-specific Observer
    this.agentObserver = this.agentObserverService.getAgentObserver(config.agentId, config);
    console.log(`👁️ Observer watching agent: ${config.agentId}`);
    
    // Initialize governance service if governance is enabled
    if (config.governanceEnabled) {
      const GovernanceService = require('./governanceService');
      this.governanceService = new GovernanceService();
      await this.governanceService.initialize(config.governanceLevel);
    }
  }

  /**
   * Complete a message using the configured agent with optional governance
   * 
   * @param {string} message - User message to send to the agent
   * @returns {Object} Response object with agent response and governance data
   */
  async complete(message) {
    if (!this.config) {
      throw new Error('Agent wrapper not configured. Call configure() first.');
    }

    const startTime = Date.now();
    const interactionId = uuidv4();

    try {
      let response;
      let governanceData = null;

      if (this.config.governanceEnabled && this.governanceService) {
        // Governed execution path
        response = await this._executeWithGovernance(message);
        governanceData = response.governance;
      } else {
        // Ungoverned execution path
        response = await this._executeWithoutGovernance(message);
      }

      const processingTime = Date.now() - startTime;

      // Prepare interaction data for scorecard update
      const interactionData = {
        interactionId,
        governanceApplied: this.config.governanceEnabled,
        trustScore: governanceData?.trustScore || null,
        complianceRate: governanceData?.complianceRate || null,
        violations: governanceData?.violations || [],
        interventions: governanceData?.interventions || [],
        processingTime
      };

      // Update scorecard with interaction results
      if (this.governanceIdentityService) {
        await this.governanceIdentityService.updateScorecard(this.config.agentId, interactionData);
      }

      // Record interaction with agent-specific Observer
      let observerCommentary = null;
      if (this.agentObserverService) {
        observerCommentary = await this.agentObserverService.recordInteraction(this.config.agentId, {
          ...interactionData,
          message: message,
          response: response.text,
          agentType: this.config.agentType,
          governanceLevel: this.config.governanceLevel
        });
      }

      return {
        response: response.text,
        trustScore: governanceData?.trustScore || null,
        violations: governanceData?.violations || [],
        governanceApplied: this.config.governanceEnabled,
        processingTime: processingTime,
        governanceIdentity: this.governanceIdentity,
        scorecardUrl: this.governanceIdentity?.scorecardUrl,
        observerCommentary: observerCommentary,
        metadata: {
          agentType: this.config.agentType,
          governanceLevel: this.config.governanceLevel,
          timestamp: new Date().toISOString(),
          interactionId
        }
      };

    } catch (error) {
      console.error('Agent completion error:', error);
      
      // Update scorecard with error
      if (this.governanceIdentityService) {
        const errorInteractionData = {
          interactionId,
          governanceApplied: this.config.governanceEnabled,
          violations: [{
            type: 'system_error',
            severity: 'high',
            description: 'Agent completion failed',
            article: '5.1'
          }],
          processingTime: Date.now() - startTime
        };
        
        try {
          await this.governanceIdentityService.updateScorecard(this.config.agentId, errorInteractionData);
        } catch (scorecardError) {
          console.error('Failed to update scorecard with error:', scorecardError);
        }
      }
      
      throw new Error(`Agent completion failed: ${error.message}`);
    }
  }

  /**
   * Execute agent request with governance layers applied
   * 
   * @param {string} message - User message
   * @returns {Object} Response with governance data
   */
  async _executeWithGovernance(message) {
    // Step 1: Apply pre-processing governance (constitutional framework injection)
    const governedMessage = await this.governanceService.preprocessMessage(message);

    // Step 2: Call external agent API with governed message
    const agentResponse = await this._callExternalAgent(governedMessage);

    // Step 3: Apply post-processing governance (violation detection, trust scoring)
    const governanceAnalysis = await this.governanceService.analyzeResponse(
      message,
      agentResponse,
      this.config
    );

    return {
      text: governanceAnalysis.modifiedResponse || agentResponse,
      governance: {
        trustScore: governanceAnalysis.trustScore,
        violations: governanceAnalysis.violations,
        complianceRate: governanceAnalysis.complianceRate,
        interventions: governanceAnalysis.interventions
      }
    };
  }

  /**
   * Execute agent request without governance layers
   * 
   * @param {string} message - User message
   * @returns {Object} Raw response without governance
   */
  async _executeWithoutGovernance(message) {
    const agentResponse = await this._callExternalAgent(message);
    
    return {
      text: agentResponse
    };
  }

  /**
   * Call the external agent API based on agent type
   * 
   * @param {string} message - Message to send to the agent
   * @returns {string} Agent response text
   */
  async _callExternalAgent(message) {
    switch (this.config.agentType) {
      case 'openai':
        return await this._callOpenAI(message);
      case 'claude':
        return await this._callClaude(message);
      case 'custom':
        return await this._callCustomAgent(message);
      default:
        throw new Error(`Unsupported agent type: ${this.config.agentType}`);
    }
  }

  /**
   * Call OpenAI API
   * 
   * @param {string} message - Message to send
   * @returns {string} OpenAI response
   */
  async _callOpenAI(message) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error(`OpenAI API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Call Claude API (Anthropic)
   * 
   * @param {string} message - Message to send
   * @returns {string} Claude response
   */
  async _callClaude(message) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error.response?.data || error.message);
      throw new Error(`Claude API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Call custom agent API
   * 
   * @param {string} message - Message to send
   * @returns {string} Custom agent response
   */
  async _callCustomAgent(message) {
    if (!this.config.apiEndpoint) {
      throw new Error('Custom agent API endpoint not configured');
    }

    try {
      const response = await axios.post(
        this.config.apiEndpoint,
        {
          message: message,
          // Add any other required fields for the custom API
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      // Handle different response formats from custom APIs
      if (typeof response.data === 'string') {
        return response.data;
      } else if (response.data.response) {
        return response.data.response;
      } else if (response.data.message) {
        return response.data.message;
      } else if (response.data.text) {
        return response.data.text;
      } else {
        throw new Error('Unexpected response format from custom agent API');
      }
    } catch (error) {
      console.error('Custom agent API error:', error.response?.data || error.message);
      throw new Error(`Custom agent API call failed: ${error.message}`);
    }
  }

  /**
   * Get agent wrapper status and configuration
   * 
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      configured: !!this.config,
      governanceEnabled: this.config?.governanceEnabled || false,
      governanceLevel: this.config?.governanceLevel || null,
      agentType: this.config?.agentType || null,
      hasGovernanceService: !!this.governanceService,
      hasGovernanceIdentity: !!this.governanceIdentity,
      hasAgentObserver: !!this.agentObserver,
      governanceIdentity: this.governanceIdentity,
      scorecardUrl: this.governanceIdentity?.scorecardUrl,
      observerStatus: this.agentObserver?.status || null
    };
  }

  /**
   * Get governance identity for this agent
   * 
   * @returns {Object} Governance identity
   */
  getGovernanceIdentity() {
    return this.governanceIdentity;
  }

  /**
   * Get scorecard for this agent
   * 
   * @returns {Object} Agent scorecard
   */
  getScorecard() {
    if (!this.governanceIdentityService || !this.config) {
      return null;
    }
    
    return this.governanceIdentityService.getScorecard(this.config.agentId);
  }

  /**
   * Get Observer insights for this agent
   * 
   * @returns {Object} Observer insights and analysis
   */
  getObserverInsights() {
    if (!this.agentObserverService || !this.config) {
      return null;
    }
    
    return this.agentObserverService.getAgentInsights(this.config.agentId);
  }

  /**
   * Get agent-specific Observer instance
   * 
   * @returns {Object} Agent Observer
   */
  getAgentObserver() {
    return this.agentObserver;
  }
}

module.exports = AgentWrapperService;

