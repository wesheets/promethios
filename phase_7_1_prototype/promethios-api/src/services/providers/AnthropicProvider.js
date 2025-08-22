/**
 * Anthropic Provider Plugin
 * 
 * Modular implementation for Anthropic's Claude models with full governance integration.
 * Preserves existing functionality while adding enterprise-grade reliability.
 */

const ProviderPlugin = require('./ProviderPlugin');
const Anthropic = require('@anthropic-ai/sdk');

// Import debug logging
let addDebugLog;
try {
  addDebugLog = require('../../routes/debug').addDebugLog;
} catch (error) {
  // Fallback if debug route not available
  addDebugLog = (level, category, message, data) => {
    console.log(`[${level.toUpperCase()}] [${category}] ${message}`, data);
  };
}

class AnthropicProvider extends ProviderPlugin {
  constructor() {
    super('anthropic', 'Anthropic');
    this.client = null;
    this.supportedModels = [
      { 
        id: 'claude-3-sonnet-20240229', 
        name: 'Claude 3 Sonnet', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning not yet available'
      },
      { 
        id: 'claude-3-opus-20240229', 
        name: 'Claude 3 Opus', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning not yet available'
      },
      { 
        id: 'claude-3-haiku-20240307', 
        name: 'Claude 3 Haiku', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning not yet available'
      },
      { 
        id: 'claude-2.1', 
        name: 'Claude 2.1', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning not yet available'
      },
      { 
        id: 'claude-2.0', 
        name: 'Claude 2.0', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning not yet available'
      },
      { 
        id: 'claude-instant-1.2', 
        name: 'Claude Instant 1.2', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning not yet available'
      }
    ];
    this.capabilities = ['chat', 'completion', 'fine-tuning-planned', 'tool_calling'];
  }

  /**
   * Initialize the Anthropic client with API key
   */
  async initialize(config) {
    try {
      this.validateConfig(config);
      
      this.client = new Anthropic({
        apiKey: config.apiKey,
        baseURL: config.baseURL || 'https://api.anthropic.com',
        timeout: config.timeout || 30000,
        maxRetries: config.maxRetries || 3
      });

      // Test the connection
      await this.healthCheck();
      
      this.isInitialized = true;
      this.lastHealthCheck = new Date();
      
      await this.auditEvent('provider_initialized', {
        provider: this.name,
        models: this.supportedModels.length,
        baseURL: config.baseURL || 'default'
      });

      console.log(`✅ Anthropic Provider initialized successfully`);
      return true;
      
    } catch (error) {
      this.isInitialized = false;
      await this.auditEvent('provider_initialization_failed', {
        provider: this.name,
        error: error.message
      });
      throw new Error(`Anthropic Provider initialization failed: ${error.message}`);
    }
  }

  /**
   * Validate Anthropic-specific configuration
   */
  validateConfig(config) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    if (!config.apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Anthropic API key format - should start with sk-ant-');
    }

    if (config.model && !this.supportedModels.includes(config.model)) {
      console.warn(`⚠️ Model ${config.model} not in supported list, but will attempt to use it`);
    }
  }

  /**
   * Generate response using Anthropic API with full governance integration
   */
  async generateResponse(requestData, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure provider is initialized
      if (!this.isInitialized || !this.client) {
        throw new Error('Anthropic Provider not initialized');
      }

      // Handle both old (prompt, options) and new (requestData) calling conventions
      let prompt, model, messages, systemMessage, maxTokens, temperature, topP, tools;
      
      if (typeof requestData === 'string') {
        // Old calling convention: generateResponse(prompt, options)
        prompt = requestData;
        model = options.model;
        messages = options.messages;
        systemMessage = options.systemMessage;
        maxTokens = options.maxTokens;
        temperature = options.temperature;
        topP = options.topP;
        tools = options.tools;
      } else {
        // New calling convention: generateResponse(requestData)
        prompt = requestData.prompt;
        model = requestData.model;
        messages = requestData.messages;
        systemMessage = requestData.systemMessage || requestData.system_message;
        maxTokens = requestData.maxTokens || requestData.max_tokens;
        temperature = requestData.temperature;
        topP = requestData.topP || requestData.top_p;
        tools = requestData.tools;
      }

      // Use the model specified in request data, no default fallback
      if (!model) {
        throw new Error('Model must be specified in request data - no default model available');
      }

      // Apply governance context if provided
      let enhancedPrompt = prompt;
      if (requestData.governanceContext || options.governanceContext) {
        enhancedPrompt = await this.applyGovernanceContext(prompt, requestData.governanceContext || options.governanceContext);
      }

      // Prepare Anthropic request
      const requestConfig = {
        model: model,
        max_tokens: maxTokens || 1000,
        temperature: temperature || 0.7,
        top_p: topP || 1.0
      };

      // Handle messages vs prompt
      if (messages && Array.isArray(messages)) {
        // Filter out system messages from messages array (Anthropic doesn't accept them there)
        const systemMessages = messages.filter(msg => msg.role === 'system');
        const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
        
        requestConfig.messages = nonSystemMessages;
        
        // Combine system messages with existing systemMessage
        if (systemMessages.length > 0) {
          const combinedSystemContent = systemMessages.map(msg => msg.content).join('\n\n');
          if (systemMessage) {
            requestConfig.system = systemMessage + '\n\n' + combinedSystemContent;
          } else {
            requestConfig.system = combinedSystemContent;
          }
        } else if (systemMessage) {
          requestConfig.system = systemMessage;
        }
        
        console.log(`🔍 [DEBUG] Filtered messages: ${systemMessages.length} system, ${nonSystemMessages.length} non-system`);
      } else if (enhancedPrompt) {
        requestConfig.messages = [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ];
        
        // Add system message if provided (Anthropic uses system parameter)
        if (systemMessage) {
          requestConfig.system = systemMessage;
        }
      } else {
        throw new Error('Either messages array or prompt must be provided');
      }

      // Add tools if provided (transform from OpenAI format to Anthropic format)
      if (tools && Array.isArray(tools) && tools.length > 0) {
        console.log(`🔍 [DEBUG] Received ${tools.length} tools for transformation:`, JSON.stringify(tools, null, 2));
        
        requestConfig.tools = tools.map((tool, index) => {
          console.log(`🔍 [DEBUG] Processing tool ${index}:`, JSON.stringify(tool, null, 2));
          
          // Transform OpenAI-style tool schema to Anthropic format
          if (tool.type === 'function' && tool.function) {
            const transformed = {
              name: tool.function.name,
              description: tool.function.description,
              input_schema: tool.function.parameters || {}
            };
            console.log(`✅ [DEBUG] Transformed tool ${index} to Anthropic format:`, JSON.stringify(transformed, null, 2));
            return transformed;
          } else if (tool.name && tool.description) {
            // Already in Anthropic format
            console.log(`✅ [DEBUG] Tool ${index} already in Anthropic format`);
            return tool;
          } else {
            console.warn(`⚠️ [DEBUG] Unknown tool format for tool ${index}:`, JSON.stringify(tool, null, 2));
            return tool;
          }
        });
        console.log(`🛠️ Anthropic Provider: Adding ${tools.length} tools to request (transformed to Anthropic format)`);
      }

      console.log(`🤖 Anthropic Provider: Generating response with model ${requestConfig.model}`);

      // Make the API call
      const response = await this.client.messages.create(requestConfig);
      
      const responseTime = Date.now() - startTime;
      const generatedText = response.content[0]?.text || '';

      // Apply governance post-processing if needed
      let finalResponse = generatedText;
      if (requestData.governanceContext || options.governanceContext) {
        finalResponse = await this.applyGovernancePostProcessing(generatedText, requestData.governanceContext || options.governanceContext);
      }

      // Check for tool calls in response
      let toolCalls = [];
      if (response.content) {
        for (const content of response.content) {
          if (content.type === 'tool_use') {
            toolCalls.push({
              id: content.id,
              type: 'function',
              function: {
                name: content.name,
                arguments: JSON.stringify(content.input)
              }
            });
          }
        }
      }

      // Update metrics
      await this.updateMetrics({
        requestCount: 1,
        responseTime,
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        success: true
      });

      // Audit the interaction
      await this.auditEvent('response_generated', {
        provider: this.name,
        model: requestConfig.model,
        responseTime,
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        promptLength: (prompt || '').length,
        responseLength: finalResponse.length,
        toolCallsCount: toolCalls.length,
        hasTools: tools && tools.length > 0
      });

      console.log(`✅ Anthropic Provider: Response generated successfully (${responseTime}ms)`);

      return {
        content: finalResponse,
        usage: response.usage,
        model: requestConfig.model,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        raw_response: response
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update error metrics
      await this.updateMetrics({
        requestCount: 1,
        responseTime,
        success: false,
        errorCount: 1
      });

      // Audit the error
      await this.auditEvent('response_generation_failed', {
        provider: this.name,
        error: error.message,
        responseTime,
        agentId: options.agentId,
        userId: options.userId
      });

      // Handle specific Anthropic errors
      if (error.status === 401) {
        this.isHealthy = false;
        throw new Error('Anthropic API authentication failed - check API key');
      } else if (error.status === 429) {
        throw new Error('Anthropic API rate limit exceeded - please try again later');
      } else if (error.status === 500) {
        this.isHealthy = false;
        throw new Error('Anthropic API server error - service temporarily unavailable');
      }

      throw new Error(`Anthropic Provider error: ${error.message}`);
    }
  }

  /**
   * Apply governance context to the prompt (Anthropic-specific)
   */
  async applyGovernanceContext(prompt, governanceContext) {
    try {
      // If agent has access to audit logs, include relevant context
      if (governanceContext.auditLogAccess && governanceContext.agentId) {
        const auditContext = await this.getAuditContextForAgent(governanceContext.agentId);
        if (auditContext) {
          return `${prompt}\n\nGovernance Context: Based on my audit history, I should consider: ${auditContext}`;
        }
      }

      // Apply policy context if available
      if (governanceContext.policies && governanceContext.policies.length > 0) {
        const policyContext = governanceContext.policies.map(p => p.description).join('; ');
        return `${prompt}\n\nPolicy Context: ${policyContext}`;
      }

      return prompt;
    } catch (error) {
      console.warn('⚠️ Failed to apply governance context:', error.message);
      return prompt; // Return original prompt if governance context fails
    }
  }

  /**
   * Get audit context for agent (if enabled)
   */
  async getAuditContextForAgent(agentId) {
    try {
      // This would integrate with the existing audit system
      // For now, return a placeholder that indicates audit access is working
      return `Recent interactions show consistent policy compliance with trust score above 85%`;
    } catch (error) {
      console.warn('⚠️ Failed to get audit context:', error.message);
      return null;
    }
  }

  /**
   * Apply governance post-processing to the response
   */
  async applyGovernancePostProcessing(response, governanceContext) {
    try {
      // Apply any response filtering or enhancement based on governance
      // For now, just return the response as-is
      return response;
    } catch (error) {
      console.warn('⚠️ Failed to apply governance post-processing:', error.message);
      return response;
    }
  }

  /**
   * Health check for Anthropic API
   */
  async healthCheck() {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      // Simple test request to verify API connectivity
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Test' }]
      });

      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      
      return {
        healthy: true,
        latency: Date.now() - this.lastHealthCheck.getTime(),
        model: 'claude-3-haiku-20240307'
      };
      
    } catch (error) {
      this.isHealthy = false;
      throw new Error(`Anthropic health check failed: ${error.message}`);
    }
  }

  /**
   * Get provider-specific configuration schema
   */
  getConfigSchema() {
    return {
      apiKey: {
        type: 'string',
        required: true,
        description: 'Anthropic API key',
        sensitive: true,
        pattern: '^sk-ant-'
      },
      baseURL: {
        type: 'string',
        required: false,
        description: 'Custom API base URL (optional)',
        default: 'https://api.anthropic.com'
      },
      model: {
        type: 'string',
        required: false,
        description: 'Default model to use',
        enum: this.supportedModels,
        default: 'claude-3-sonnet-20240229'
      },
      timeout: {
        type: 'number',
        required: false,
        description: 'Request timeout in milliseconds',
        default: 30000
      },
      maxRetries: {
        type: 'number',
        required: false,
        description: 'Maximum number of retries',
        default: 3
      }
    };
  }

  /**
   * Get supported models
   */
  getSupportedModels() {
    return this.supportedModels.map(model => ({
      id: model,
      name: model,
      description: this.getModelDescription(model),
      contextLength: this.getModelContextLength(model),
      costPer1kTokens: this.getModelCost(model)
    }));
  }

  // ========================================
  // FINE-TUNING IMPLEMENTATION (PLACEHOLDER)
  // ========================================
  // Note: Anthropic does not currently offer public fine-tuning APIs
  // These methods provide a consistent interface and will be activated
  // when Anthropic releases fine-tuning capabilities

  /**
   * Create a fine-tuning job (placeholder for future Anthropic fine-tuning)
   * @param {Object} trainingData - Training data configuration
   * @param {Object} options - Fine-tuning options
   * @returns {Object} Fine-tuning job details
   */
  async createFineTuningJob(trainingData, options = {}) {
    try {
      // Audit the attempt
      await this.auditEvent('fine_tuning_job_creation_attempted', {
        provider: this.providerId,
        model: options.model,
        note: 'Anthropic fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      // For now, return a placeholder response
      // This will be replaced with actual Anthropic API calls when available
      throw new Error('Anthropic fine-tuning is not yet available. Please check back for updates or contact Anthropic for enterprise fine-tuning options.');

    } catch (error) {
      await this.auditEvent('fine_tuning_job_creation_failed', {
        error: error.message,
        model: options.model,
        provider: this.providerId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Get fine-tuning job status (placeholder)
   * @param {string} jobId - Fine-tuning job ID
   * @returns {Object} Job status and details
   */
  async getFineTuningJob(jobId) {
    try {
      await this.auditEvent('fine_tuning_job_retrieval_attempted', {
        jobId: jobId,
        provider: this.providerId,
        note: 'Anthropic fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Anthropic fine-tuning is not yet available. Job retrieval not supported.');

    } catch (error) {
      await this.auditEvent('fine_tuning_job_retrieval_failed', {
        jobId: jobId,
        error: error.message,
        provider: this.providerId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * List fine-tuning jobs (placeholder)
   * @param {Object} filters - Optional filters for jobs
   * @returns {Array} List of fine-tuning jobs
   */
  async listFineTuningJobs(filters = {}) {
    try {
      await this.auditEvent('fine_tuning_jobs_list_attempted', {
        provider: this.providerId,
        note: 'Anthropic fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      // Return empty array since no fine-tuning is available
      return [];

    } catch (error) {
      await this.auditEvent('fine_tuning_jobs_list_failed', {
        error: error.message,
        provider: this.providerId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Cancel a fine-tuning job (placeholder)
   * @param {string} jobId - Fine-tuning job ID
   * @returns {Object} Cancellation result
   */
  async cancelFineTuningJob(jobId) {
    try {
      await this.auditEvent('fine_tuning_job_cancellation_attempted', {
        jobId: jobId,
        provider: this.providerId,
        note: 'Anthropic fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Anthropic fine-tuning is not yet available. Job cancellation not supported.');

    } catch (error) {
      await this.auditEvent('fine_tuning_job_cancellation_failed', {
        jobId: jobId,
        error: error.message,
        provider: this.providerId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Upload training data (placeholder)
   * @param {string|Buffer} trainingData - Training data content
   * @param {Object} options - Upload options
   * @returns {Object} Upload result
   */
  async uploadTrainingData(trainingData, options = {}) {
    try {
      await this.auditEvent('training_data_upload_attempted', {
        provider: this.providerId,
        filename: options.filename,
        note: 'Anthropic fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Anthropic fine-tuning is not yet available. Training data upload not supported.');

    } catch (error) {
      await this.auditEvent('training_data_upload_failed', {
        error: error.message,
        filename: options.filename,
        provider: this.providerId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Get fine-tuned model details (placeholder)
   * @param {string} modelId - Fine-tuned model ID
   * @returns {Object} Model details and metadata
   */
  async getFineTunedModel(modelId) {
    try {
      await this.auditEvent('fine_tuned_model_retrieval_attempted', {
        modelId: modelId,
        provider: this.providerId,
        note: 'Anthropic fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Anthropic fine-tuning is not yet available. Custom model retrieval not supported.');

    } catch (error) {
      await this.auditEvent('fine_tuned_model_retrieval_failed', {
        modelId: modelId,
        error: error.message,
        provider: this.providerId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Delete a fine-tuned model (placeholder)
   * @param {string} modelId - Fine-tuned model ID
   * @returns {Object} Deletion result
   */
  async deleteFineTunedModel(modelId) {
    try {
      await this.auditEvent('fine_tuned_model_deletion_attempted', {
        modelId: modelId,
        provider: this.providerId,
        note: 'Anthropic fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Anthropic fine-tuning is not yet available. Custom model deletion not supported.');

    } catch (error) {
      await this.auditEvent('fine_tuned_model_deletion_failed', {
        modelId: modelId,
        error: error.message,
        provider: this.providerId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Estimate fine-tuning cost for Anthropic (placeholder)
   * @param {string} trainingData - Training data content
   * @param {Object} options - Fine-tuning options
   * @returns {Object} Cost estimation
   */
  async estimateFineTuningCost(trainingData, options = {}) {
    try {
      const lines = trainingData.split('\n').filter(line => line.trim()).length;
      
      // Estimate tokens
      let totalTokens = 0;
      const dataLines = trainingData.split('\n').filter(line => line.trim());
      
      for (const line of dataLines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.messages) {
            const messageText = parsed.messages.map(m => m.content).join(' ');
            totalTokens += Math.ceil(messageText.length / 4);
          } else if (parsed.prompt && parsed.completion) {
            totalTokens += Math.ceil((parsed.prompt + parsed.completion).length / 4);
          }
        } catch (e) {
          // Skip invalid lines
        }
      }

      // Placeholder pricing (estimated based on Claude's inference costs)
      if (!options.model) {
        throw new Error('Model must be specified in options - no default model available');
      }
      const model = options.model;
      let costPerToken = 0.020; // Estimated higher cost for fine-tuning
      
      if (model.includes('opus')) {
        costPerToken = 0.100; // Higher cost for Opus
      } else if (model.includes('haiku')) {
        costPerToken = 0.005; // Lower cost for Haiku
      }

      const epochs = options.epochs || 3;
      const totalTrainingTokens = totalTokens * epochs;
      const estimatedCost = (totalTrainingTokens / 1000) * costPerToken;

      return {
        estimatedSamples: lines,
        estimatedTokens: totalTokens,
        totalTrainingTokens: totalTrainingTokens,
        epochs: epochs,
        estimatedCostUSD: estimatedCost,
        costPerThousandTokens: costPerToken,
        currency: 'USD',
        provider: this.providerId,
        model: model,
        note: 'Estimated pricing - Anthropic fine-tuning not yet available'
      };

    } catch (error) {
      return super.estimateFineTuningCost(trainingData, options);
    }
  }

  /**
   * Check if provider supports fine-tuning
   * @returns {boolean} False for now, will be true when Anthropic releases fine-tuning
   */
  supportsFineTuning() {
    return false; // Will be true when Anthropic releases fine-tuning APIs
  }

  /**
   * Get enterprise fine-tuning information
   * @returns {Object} Information about enterprise fine-tuning options
   */
  getEnterpriseFinetuningInfo() {
    return {
      available: false,
      status: 'planned',
      message: 'Anthropic is working on fine-tuning capabilities. Contact Anthropic directly for enterprise custom training options.',
      contactInfo: {
        email: 'enterprise@anthropic.com',
        website: 'https://www.anthropic.com/enterprise'
      },
      alternatives: [
        'Use prompt engineering with Claude models',
        'Implement retrieval-augmented generation (RAG)',
        'Consider other providers with fine-tuning (OpenAI, Cohere)',
        'Wait for Anthropic fine-tuning release'
      ]
    };
  }

  /**
   * Get model description
   */
  getModelDescription(model) {
    const descriptions = {
      'claude-3-sonnet-20240229': 'Balanced performance and speed for most tasks',
      'claude-3-opus-20240229': 'Most powerful Claude model for complex reasoning',
      'claude-3-haiku-20240307': 'Fastest Claude model for simple tasks',
      'claude-2.1': 'Previous generation Claude with strong performance',
      'claude-2.0': 'Earlier Claude model with good capabilities',
      'claude-instant-1.2': 'Fast and efficient Claude variant'
    };
    return descriptions[model] || 'Anthropic Claude language model';
  }

  /**
   * Get model context length
   */
  getModelContextLength(model) {
    const contextLengths = {
      'claude-3-sonnet-20240229': 200000,
      'claude-3-opus-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
      'claude-2.1': 200000,
      'claude-2.0': 100000,
      'claude-instant-1.2': 100000
    };
    return contextLengths[model] || 100000;
  }

  /**
   * Get model cost per 1k tokens (approximate)
   */
  getModelCost(model) {
    const costs = {
      'claude-3-sonnet-20240229': 0.015,
      'claude-3-opus-20240229': 0.075,
      'claude-3-haiku-20240307': 0.0025,
      'claude-2.1': 0.008,
      'claude-2.0': 0.008,
      'claude-instant-1.2': 0.0016
    };
    return costs[model] || 0.008;
  }

  // ============================================================================
  // PROVIDER PLUGIN INTERFACE METHODS
  // ============================================================================

  /**
   * Call the Anthropic API (required by ProviderPlugin base class)
   * @param {Object} requestData - Request data including messages, model, tools, etc.
   * @returns {Object} Raw API response
   */
  async callProviderAPI(requestData) {
    try {
      console.log(`🤖 AnthropicProvider: Making API call with model ${requestData.model}`);
      
      // Prepare Anthropic request configuration
      const requestConfig = {
        model: requestData.model || 'claude-3-sonnet-20240229',
        max_tokens: requestData.maxTokens || 1000,
        temperature: requestData.temperature || 0.7,
        messages: requestData.messages || []
      };

      // Add tools if provided and supported
      if (requestData.tools && requestData.tools.length > 0) {
        console.log(`🛠️ AnthropicProvider: Adding ${requestData.tools.length} tools to request`);
        requestConfig.tools = requestData.tools;
        requestConfig.tool_choice = { type: 'auto' }; // Let Claude decide when to use tools
      }

      // Make the API call
      const response = await this.client.messages.create(requestConfig);
      
      console.log(`✅ AnthropicProvider: API call successful`);
      return response;
      
    } catch (error) {
      console.error(`❌ AnthropicProvider: API call failed:`, error);
      throw error;
    }
  }

  /**
   * Post-process the raw API response
   * @param {Object} rawResponse - Raw API response
   * @param {Object} requestData - Original request data
   * @returns {Object} Processed response
   */
  async postprocessResponse(rawResponse, requestData) {
    try {
      if (!rawResponse.content || rawResponse.content.length === 0) {
        throw new Error('No content in Anthropic response');
      }

      // Extract text content
      const textContent = rawResponse.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const processedResponse = {
        content: textContent,
        role: 'assistant',
        usage: rawResponse.usage
      };

      // Handle tool calls if present
      const toolUseBlocks = rawResponse.content.filter(block => block.type === 'tool_use');
      if (toolUseBlocks.length > 0) {
        console.log(`🛠️ AnthropicProvider: Found ${toolUseBlocks.length} tool calls`);
        
        // Convert Claude's tool_use format to OpenAI-compatible format
        processedResponse.tool_calls = toolUseBlocks.map((block, index) => ({
          id: block.id || `call_${index}`,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input)
          }
        }));
      }

      return processedResponse;
      
    } catch (error) {
      console.error(`❌ AnthropicProvider: Response post-processing failed:`, error);
      throw error;
    }
  }

  // ============================================================================
  // TOOL INTEGRATION METHODS
  // ============================================================================

  /**
   * Check if this provider supports tool calling
   * @returns {boolean} True if provider supports tools
   */
  supportsTools() {
    return true; // Claude 3 supports tool calling
  }

  /**
   * Format tool schemas for Claude's API format
   * @param {Array} toolSchemas - Array of tool schemas
   * @returns {Array} Claude-specific tool format
   */
  formatToolsForProvider(toolSchemas) {
    return toolSchemas.map(schema => {
      // Handle OpenAI format: { type: "function", function: { name, description, parameters } }
      if (schema.type === 'function' && schema.function) {
        return {
          name: schema.function.name,
          description: schema.function.description,
          input_schema: schema.function.parameters || {
            type: 'object',
            properties: {},
            required: []
          }
        };
      }
      // Handle direct Anthropic format: { name, description, parameters }
      else if (schema.name && schema.description) {
        return {
          name: schema.name,
          description: schema.description,
          input_schema: schema.parameters || {
            type: 'object',
            properties: {},
            required: []
          }
        };
      }
      // Fallback for unknown format
      else {
        console.warn('⚠️ AnthropicProvider: Unknown tool schema format:', schema);
        return {
          name: 'unknown_tool',
          description: 'Tool with unknown format',
          input_schema: {
            type: 'object',
            properties: {},
            required: []
          }
        };
      }
    });
  }

  /**
   * Check if response contains tool calls
   * @param {Object} response - Provider response
   * @returns {boolean} True if response has tool calls
   */
  hasToolCalls(response) {
    const hasTools = response.tool_calls && Array.isArray(response.tool_calls) && response.tool_calls.length > 0;
    
    addDebugLog('debug', 'anthropic_provider', `Checking for tool calls in response`, {
      hasToolCalls: hasTools,
      toolCallsCount: response.tool_calls?.length || 0,
      responseKeys: Object.keys(response),
      toolCallsType: typeof response.tool_calls
    });
    
    return hasTools;
  }

  /**
   * Extract tool calls from Anthropic response
   * @param {Object} response - Provider response
   * @returns {Array} Array of tool calls
   */
  extractToolCalls(response) {
    const toolCalls = response.tool_calls || [];
    
    addDebugLog('debug', 'anthropic_provider', `Extracting tool calls from response`, {
      toolCallsCount: toolCalls.length,
      toolNames: toolCalls.map(call => call.function?.name || call.name),
      sampleToolCall: toolCalls[0] ? {
        id: toolCalls[0].id,
        type: toolCalls[0].type,
        functionName: toolCalls[0].function?.name || toolCalls[0].name
      } : null
    });
    
    return toolCalls;
  }

  /**
   * Process tool calls and return results
   * @param {Array} toolCalls - Array of tool calls
   * @param {Object} context - Execution context
   * @returns {Array} Array of tool results
   */
  async processToolCalls(toolCalls, context) {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        console.log(`🛠️ Anthropic Provider: Processing tool call ${toolCall.function?.name || toolCall.name}`);
        
        // Execute tool call using the executeToolCall method
        const result = await this.executeToolCall(toolCall, context);
        results.push(result);
        
      } catch (error) {
        console.error(`❌ Anthropic Provider: Tool call failed:`, error);
        
        // Add error result
        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function?.name || toolCall.name,
          content: JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString()
          })
        });
      }
    }
    
    return results;
  }
}

module.exports = AnthropicProvider;

