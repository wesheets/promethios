/**
 * Grok Provider Plugin (X.AI)
 * 
 * Modular implementation for X.AI's Grok models with fine-tuning integration.
 * Supports both inference and fine-tuning with BYOK-first approach.
 */

const ProviderPlugin = require('./ProviderPlugin');

class GrokProvider extends ProviderPlugin {
  constructor() {
    super('grok', 'Grok (X.AI)');
    this.client = null;
    this.supportedModels = [
      { 
        id: 'grok-beta', 
        name: 'Grok Beta', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning capabilities coming soon'
      },
      { 
        id: 'grok-1', 
        name: 'Grok 1', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning capabilities planned'
      },
      { 
        id: 'grok-1.5', 
        name: 'Grok 1.5', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion'],
        note: 'Fine-tuning capabilities planned'
      }
    ];
    this.capabilities = ['chat', 'completion', 'fine-tuning-planned'];
    this.baseURL = 'https://api.x.ai/v1';
  }

  /**
   * Initialize the Grok client with API key
   */
  async initialize(config) {
    try {
      this.validateConfig(config);
      
      // Initialize HTTP client for X.AI API
      this.client = {
        apiKey: config.apiKey,
        baseURL: config.baseURL || this.baseURL,
        timeout: config.timeout || 30000
      };
      
      // Test the connection
      await this.healthCheck();
      
      this.isInitialized = true;
      this.lastHealthCheck = new Date();
      
      await this.auditEvent('provider_initialized', {
        provider: this.name,
        models: this.supportedModels.length,
        baseURL: this.client.baseURL
      });

      console.log(`✅ Grok Provider initialized successfully`);
      return true;
      
    } catch (error) {
      this.isInitialized = false;
      await this.auditEvent('provider_initialization_failed', {
        provider: this.name,
        error: error.message
      });
      throw new Error(`Grok Provider initialization failed: ${error.message}`);
    }
  }

  /**
   * Validate Grok-specific configuration
   */
  validateConfig(config) {
    if (!config.apiKey) {
      throw new Error('Grok API key is required');
    }
    
    if (config.apiKey.length < 20) {
      throw new Error('Invalid Grok API key format');
    }

    if (config.model && !this.supportedModels.find(m => m.id === config.model)) {
      console.warn(`⚠️ Model ${config.model} not in supported list, but will attempt to use it`);
    }
  }

  /**
   * Generate response using Grok API with full governance integration
   */
  async generateResponse(requestData, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure provider is initialized
      if (!this.isInitialized || !this.client) {
        throw new Error('Grok Provider not initialized');
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

      // Prepare request payload
      const requestPayload = {
        model: model,
        max_tokens: maxTokens || 512,
        temperature: temperature || 0.7,
        top_p: topP || 1.0,
        stream: false
      };

      // Handle messages vs prompt
      if (messages && Array.isArray(messages)) {
        requestPayload.messages = messages;
      } else if (enhancedPrompt) {
        requestPayload.messages = [
          { role: 'user', content: enhancedPrompt }
        ];
      } else {
        throw new Error('Either messages array or prompt must be provided');
      }

      // Add system message if provided
      if (systemMessage) {
        requestPayload.messages.unshift({
          role: 'system',
          content: systemMessage
        });
      }

      // Add tools if provided
      if (tools && Array.isArray(tools) && tools.length > 0) {
        requestPayload.tools = tools;
        requestPayload.tool_choice = 'auto';
        console.log(`🛠️ Grok Provider: Adding ${tools.length} tools to request`);
      }

      // Audit the request
      await this.auditEvent('generation_request', {
        model: model,
        promptLength: (prompt || '').length,
        maxTokens: maxTokens || 512,
        temperature: temperature || 0.7,
        hasTools: tools && tools.length > 0
      });

      console.log(`🤖 Grok Provider: Generating response with model ${model}`);

      // Make request to X.AI API
      const response = await this.makeAPIRequest('/chat/completions', requestPayload);

      const responseTime = Date.now() - startTime;
      const generatedText = response.choices?.[0]?.message?.content || '';

      // Apply governance post-processing if needed
      let finalResponse = generatedText;
      if (requestData.governanceContext || options.governanceContext) {
        finalResponse = await this.applyGovernancePostProcessing(generatedText, requestData.governanceContext || options.governanceContext);
      }

      // Extract tool calls if present
      const toolCalls = response.choices?.[0]?.message?.tool_calls || [];

      // Update metrics
      await this.updateMetrics({
        requestCount: 1,
        responseTime,
        tokensUsed: response.usage?.total_tokens || 0,
        success: true
      });

      // Audit the response
      await this.auditEvent('generation_response', {
        model: model,
        responseLength: finalResponse.length,
        responseTime: responseTime,
        toolCallsCount: toolCalls.length,
        hasTools: tools && tools.length > 0,
        success: true
      });

      console.log(`✅ Grok Provider: Response generated successfully (${responseTime}ms)`);

      return {
        content: finalResponse,
        usage: response.usage,
        model: model,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        raw_response: response
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      await this.auditEvent('generation_error', {
        error: error.message,
        responseTime: responseTime,
        model: options.model
      });
      
      throw error;
    }
  }

  /**
   * Make HTTP request to X.AI API
   */
  async makeAPIRequest(endpoint, data) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${this.client.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.client.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      timeout: this.client.timeout
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Health check for Grok API
   */
  async healthCheck() {
    try {
      if (!this.client) {
        throw new Error('Grok client not initialized');
      }

      // Simple test request
      await this.makeAPIRequest('/chat/completions', {
        model: 'grok-beta',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
        temperature: 0.1
      });

      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      throw new Error(`Grok health check failed: ${error.message}`);
    }
  }

  /**
   * Get available models with their capabilities
   */
  getAvailableModels() {
    return this.supportedModels.map(model => ({
      id: model.id,
      name: model.name,
      provider: this.providerId,
      capabilities: model.capabilities,
      supportsFineTuning: model.supportsFineTuning,
      note: model.note,
      description: this.getModelDescription(model.id),
      contextLength: this.getModelContextLength(model.id),
      costPer1kTokens: this.getModelCost(model.id)
    }));
  }

  // ========================================
  // FINE-TUNING IMPLEMENTATION (PLACEHOLDER)
  // ========================================
  // Note: X.AI/Grok does not currently offer public fine-tuning APIs
  // These methods provide a consistent interface and will be activated
  // when X.AI releases fine-tuning capabilities

  /**
   * Create a fine-tuning job (placeholder for future Grok fine-tuning)
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
        note: 'Grok fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      // For now, return a placeholder response
      // This will be replaced with actual X.AI API calls when available
      throw new Error('Grok fine-tuning is not yet available. X.AI is working on fine-tuning capabilities. Please check back for updates or contact X.AI for enterprise fine-tuning options.');

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
        note: 'Grok fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Grok fine-tuning is not yet available. Job retrieval not supported.');

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
        note: 'Grok fine-tuning not yet available',
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
        note: 'Grok fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Grok fine-tuning is not yet available. Job cancellation not supported.');

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
        note: 'Grok fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Grok fine-tuning is not yet available. Training data upload not supported.');

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
        note: 'Grok fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Grok fine-tuning is not yet available. Custom model retrieval not supported.');

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
        note: 'Grok fine-tuning not yet available',
        timestamp: new Date().toISOString()
      });

      throw new Error('Grok fine-tuning is not yet available. Custom model deletion not supported.');

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
   * Estimate fine-tuning cost for Grok (placeholder)
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

      // Placeholder pricing (estimated based on Grok's inference costs)
      if (!options.model) {
        throw new Error('Model must be specified in options - no default model available');
      }
      const model = options.model;
      let costPerToken = 0.015; // Estimated competitive pricing
      
      if (model.includes('1.5')) {
        costPerToken = 0.020; // Higher cost for newer models
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
        note: 'Estimated pricing - Grok fine-tuning not yet available'
      };

    } catch (error) {
      return super.estimateFineTuningCost(trainingData, options);
    }
  }

  /**
   * Check if provider supports fine-tuning
   * @returns {boolean} False for now, will be true when X.AI releases fine-tuning
   */
  supportsFineTuning() {
    return false; // Will be true when X.AI releases fine-tuning APIs
  }

  /**
   * Get enterprise fine-tuning information
   * @returns {Object} Information about enterprise fine-tuning options
   */
  getEnterpriseFinetuningInfo() {
    return {
      available: false,
      status: 'planned',
      message: 'X.AI is working on fine-tuning capabilities for Grok models. Contact X.AI directly for enterprise custom training options.',
      contactInfo: {
        email: 'enterprise@x.ai',
        website: 'https://x.ai/enterprise',
        twitter: '@xai'
      },
      alternatives: [
        'Use prompt engineering with Grok models',
        'Implement retrieval-augmented generation (RAG)',
        'Consider other providers with fine-tuning (OpenAI, Cohere, HuggingFace)',
        'Wait for X.AI fine-tuning release'
      ],
      expectedFeatures: [
        'Custom model training on enterprise data',
        'Competitive pricing vs. other providers',
        'Integration with X platform features',
        'Real-time information access (Grok\'s strength)'
      ]
    };
  }

  /**
   * Get model description
   */
  getModelDescription(model) {
    const descriptions = {
      'grok-beta': 'X.AI\'s Grok model in beta - real-time information access',
      'grok-1': 'X.AI\'s Grok 1 model - conversational AI with personality',
      'grok-1.5': 'X.AI\'s Grok 1.5 model - enhanced capabilities and performance'
    };
    return descriptions[model] || 'X.AI Grok language model';
  }

  /**
   * Get model context length
   */
  getModelContextLength(model) {
    const contextLengths = {
      'grok-beta': 8192,
      'grok-1': 8192,
      'grok-1.5': 16384
    };
    return contextLengths[model] || 8192;
  }

  /**
   * Get model cost per 1k tokens (approximate)
   */
  getModelCost(model) {
    const costs = {
      'grok-beta': 0.005,
      'grok-1': 0.005,
      'grok-1.5': 0.008
    };
    return costs[model] || 0.005;
  }
}

module.exports = GrokProvider;

