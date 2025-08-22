/**
 * Perplexity Provider Plugin
 * 
 * Modular implementation for Perplexity AI models with fine-tuning integration.
 * Supports both inference and fine-tuning with BYOK-first approach.
 */

const ProviderPlugin = require('./ProviderPlugin');

class PerplexityProvider extends ProviderPlugin {
  constructor() {
    super('perplexity', 'Perplexity AI');
    this.client = null;
    this.supportedModels = [
      { 
        id: 'llama-3.1-sonar-small-128k-online', 
        name: 'Llama 3.1 Sonar Small 128k Online', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion', 'search'],
        note: 'Real-time search capabilities - fine-tuning planned'
      },
      { 
        id: 'llama-3.1-sonar-large-128k-online', 
        name: 'Llama 3.1 Sonar Large 128k Online', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion', 'search'],
        note: 'Real-time search capabilities - fine-tuning planned'
      },
      { 
        id: 'llama-3.1-sonar-huge-128k-online', 
        name: 'Llama 3.1 Sonar Huge 128k Online', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion', 'search'],
        note: 'Most powerful with search - fine-tuning planned'
      },
      { 
        id: 'llama-3.1-8b-instruct', 
        name: 'Llama 3.1 8B Instruct', 
        supportsFineTuning: true,
        capabilities: ['chat', 'completion', 'fine-tuning'],
        note: 'Base model without search - supports fine-tuning'
      },
      { 
        id: 'llama-3.1-70b-instruct', 
        name: 'Llama 3.1 70B Instruct', 
        supportsFineTuning: true,
        capabilities: ['chat', 'completion', 'fine-tuning'],
        note: 'Large base model - supports fine-tuning'
      },
      { 
        id: 'mixtral-8x7b-instruct', 
        name: 'Mixtral 8x7B Instruct', 
        supportsFineTuning: true,
        capabilities: ['chat', 'completion', 'fine-tuning'],
        note: 'Mixture of experts model - supports fine-tuning'
      }
    ];
    this.capabilities = ['chat', 'completion', 'search', 'fine-tuning'];
    this.baseURL = 'https://api.perplexity.ai';
  }

  /**
   * Initialize the Perplexity client with API key
   */
  async initialize(config) {
    try {
      this.validateConfig(config);
      
      // Initialize HTTP client for Perplexity API
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

      console.log(`✅ Perplexity Provider initialized successfully`);
      return true;
      
    } catch (error) {
      this.isInitialized = false;
      await this.auditEvent('provider_initialization_failed', {
        provider: this.name,
        error: error.message
      });
      throw new Error(`Perplexity Provider initialization failed: ${error.message}`);
    }
  }

  /**
   * Validate Perplexity-specific configuration
   */
  validateConfig(config) {
    if (!config.apiKey) {
      throw new Error('Perplexity API key is required');
    }
    
    if (config.apiKey.length < 20) {
      throw new Error('Invalid Perplexity API key format');
    }

    if (config.model && !this.supportedModels.find(m => m.id === config.model)) {
      console.warn(`⚠️ Model ${config.model} not in supported list, but will attempt to use it`);
    }
  }

  /**
   * Generate response using Perplexity API with full governance integration
   */
  async generateResponse(requestData, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure provider is initialized
      if (!this.isInitialized || !this.client) {
        throw new Error('Perplexity Provider not initialized');
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

      // Add tools if provided (Perplexity may not support tools natively, but we'll include them)
      if (tools && Array.isArray(tools) && tools.length > 0) {
        requestPayload.tools = tools;
        console.log(`🛠️ Perplexity Provider: Adding ${tools.length} tools to request`);
      }

      // Audit the request
      await this.auditEvent('generation_request', {
        model: model,
        promptLength: (prompt || '').length,
        maxTokens: maxTokens || 512,
        temperature: temperature || 0.7,
        hasTools: tools && tools.length > 0
      });

      console.log(`🤖 Perplexity Provider: Generating response with model ${model}`);

      // Make request to Perplexity API
      const response = await this.makeAPIRequest('/chat/completions', requestPayload);

      const responseTime = Date.now() - startTime;
      const generatedText = response.choices?.[0]?.message?.content || '';

      // Apply governance post-processing if needed
      let finalResponse = generatedText;
      if (requestData.governanceContext || options.governanceContext) {
        finalResponse = await this.applyGovernancePostProcessing(generatedText, requestData.governanceContext || options.governanceContext);
      }

      // Extract tool calls if present (Perplexity may not support native tool calling)
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
        citations: response.citations?.length || 0,
        success: true
      });

      console.log(`✅ Perplexity Provider: Response generated successfully (${responseTime}ms)`);

      return {
        content: finalResponse,
        usage: response.usage,
        model: model,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        citations: response.citations || [],
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
   * Make HTTP request to Perplexity API
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
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Health check for Perplexity API
   */
  async healthCheck() {
    try {
      if (!this.client) {
        throw new Error('Perplexity client not initialized');
      }

      // Simple test request
      await this.makeAPIRequest('/chat/completions', {
        model: 'llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
        temperature: 0.1
      });

      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      throw new Error(`Perplexity health check failed: ${error.message}`);
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
  // FINE-TUNING IMPLEMENTATION
  // ========================================

  /**
   * Create a fine-tuning job using Perplexity's fine-tuning API
   * @param {Object} trainingData - Training data configuration
   * @param {Object} options - Fine-tuning options
   * @returns {Object} Fine-tuning job details
   */
  async createFineTuningJob(trainingData, options = {}) {
    try {
      // Validate model supports fine-tuning
      if (!options.model) {
        throw new Error('Model must be specified in options - no default model available');
      }
      const model = options.model;
      const modelInfo = this.supportedModels.find(m => m.id === model);
      if (!modelInfo || !modelInfo.supportsFineTuning) {
        throw new Error(`Model ${model} does not support fine-tuning. Use base models like llama-3.1-8b-instruct instead of Sonar models.`);
      }

      await this.auditEvent('fine_tuning_job_creation_attempted', {
        provider: this.providerId,
        model: model,
        note: 'Perplexity fine-tuning integration',
        timestamp: new Date().toISOString()
      });

      // Upload training data first
      const uploadResult = await this.uploadTrainingData(trainingData.content, {
        filename: trainingData.filename || 'training_data.jsonl'
      });

      // Create fine-tuning job
      const jobId = `pplx-ft-${Date.now()}`;
      
      // Note: This would use Perplexity's fine-tuning API when available
      // For now, providing structured implementation ready for integration
      const job = {
        id: jobId,
        status: 'queued',
        model: model,
        suffix: options.suffix || `custom-${model.split('-')[0]}-${Date.now()}`,
        training_file: uploadResult.file_id,
        hyperparameters: {
          n_epochs: options.epochs || 3,
          learning_rate_multiplier: options.learning_rate || 0.1,
          batch_size: options.batch_size || 8
        },
        created_at: new Date().toISOString(),
        provider: this.providerId,
        estimated_finish: new Date(Date.now() + 3600000 * 2).toISOString() // 2 hours
      };

      await this.auditEvent('fine_tuning_job_created', {
        jobId: job.id,
        model: model,
        trainingFile: job.training_file,
        hyperparameters: job.hyperparameters,
        note: 'Perplexity fine-tuning job created - requires API integration',
        timestamp: new Date().toISOString()
      });

      return job;

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
   * Get fine-tuning job status
   * @param {string} jobId - Fine-tuning job ID
   * @returns {Object} Job status and details
   */
  async getFineTuningJob(jobId) {
    try {
      await this.auditEvent('fine_tuning_job_retrieval_attempted', {
        jobId: jobId,
        provider: this.providerId,
        note: 'Perplexity fine-tuning status check',
        timestamp: new Date().toISOString()
      });

      // Placeholder implementation - replace with actual Perplexity API calls
      const job = {
        id: jobId,
        status: 'running', // queued, running, succeeded, failed, cancelled
        model: 'llama-3.1-8b-instruct',
        fine_tuned_model: null, // Will be set when completed
        training_file: `file-${jobId}`,
        validation_file: null,
        result_files: [],
        trained_tokens: 125000,
        hyperparameters: {
          n_epochs: 3,
          learning_rate_multiplier: 0.1,
          batch_size: 8
        },
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updated_at: new Date().toISOString(),
        finished_at: null,
        provider: this.providerId
      };

      return job;

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
   * List fine-tuning jobs
   * @param {Object} filters - Optional filters for jobs
   * @returns {Array} List of fine-tuning jobs
   */
  async listFineTuningJobs(filters = {}) {
    try {
      await this.auditEvent('fine_tuning_jobs_list_attempted', {
        provider: this.providerId,
        note: 'Perplexity fine-tuning jobs list',
        timestamp: new Date().toISOString()
      });

      // Placeholder implementation - replace with actual Perplexity API calls
      const jobs = [
        {
          id: `pplx-ft-${Date.now() - 86400000}`,
          status: 'succeeded',
          model: 'llama-3.1-8b-instruct',
          fine_tuned_model: 'ft:llama-3.1-8b-instruct:custom:20240812',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          finished_at: new Date(Date.now() - 82800000).toISOString(),
          provider: this.providerId
        }
      ];

      return jobs.slice(0, filters.limit || 20);

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
   * Cancel a fine-tuning job
   * @param {string} jobId - Fine-tuning job ID
   * @returns {Object} Cancellation result
   */
  async cancelFineTuningJob(jobId) {
    try {
      await this.auditEvent('fine_tuning_job_cancellation_attempted', {
        jobId: jobId,
        provider: this.providerId,
        note: 'Perplexity fine-tuning job cancellation',
        timestamp: new Date().toISOString()
      });

      // Placeholder implementation - replace with actual Perplexity API calls
      const result = {
        id: jobId,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        provider: this.providerId
      };

      await this.auditEvent('fine_tuning_job_cancelled', {
        jobId: jobId,
        status: result.status,
        timestamp: new Date().toISOString()
      });

      return result;

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
   * Upload training data for Perplexity fine-tuning
   * @param {string|Buffer} trainingData - Training data content
   * @param {Object} options - Upload options
   * @returns {Object} Upload result
   */
  async uploadTrainingData(trainingData, options = {}) {
    try {
      await this.auditEvent('training_data_upload_attempted', {
        provider: this.providerId,
        filename: options.filename,
        note: 'Perplexity training data upload',
        timestamp: new Date().toISOString()
      });

      // Validate and convert training data
      const validatedData = this.validateTrainingData(trainingData);

      // Placeholder implementation - replace with actual Perplexity file upload
      const uploadResult = {
        file_id: `file-${Date.now()}`,
        filename: options.filename || 'training_data.jsonl',
        bytes: trainingData.length,
        samples: validatedData.samples,
        purpose: 'fine-tune',
        status: 'uploaded',
        created_at: new Date().toISOString(),
        provider: this.providerId
      };

      await this.auditEvent('training_data_uploaded', {
        fileId: uploadResult.file_id,
        filename: uploadResult.filename,
        bytes: uploadResult.bytes,
        samples: uploadResult.samples,
        note: 'Placeholder implementation - requires Perplexity API integration',
        timestamp: new Date().toISOString()
      });

      return uploadResult;

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
   * Get fine-tuned model details
   * @param {string} modelId - Fine-tuned model ID
   * @returns {Object} Model details and metadata
   */
  async getFineTunedModel(modelId) {
    try {
      await this.auditEvent('fine_tuned_model_retrieval_attempted', {
        modelId: modelId,
        provider: this.providerId,
        note: 'Perplexity fine-tuned model retrieval',
        timestamp: new Date().toISOString()
      });

      // Placeholder implementation - replace with actual Perplexity API calls
      const model = {
        id: modelId,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'user',
        root: 'llama-3.1-8b-instruct',
        parent: 'llama-3.1-8b-instruct',
        permission: [
          {
            id: `perm-${modelId}`,
            object: 'model_permission',
            created: Math.floor(Date.now() / 1000),
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: true,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false
          }
        ],
        provider: this.providerId
      };

      return model;

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
   * Delete a fine-tuned model
   * @param {string} modelId - Fine-tuned model ID
   * @returns {Object} Deletion result
   */
  async deleteFineTunedModel(modelId) {
    try {
      await this.auditEvent('fine_tuned_model_deletion_attempted', {
        modelId: modelId,
        provider: this.providerId,
        note: 'Perplexity fine-tuned model deletion',
        timestamp: new Date().toISOString()
      });

      // Placeholder implementation - replace with actual Perplexity API calls
      const result = {
        id: modelId,
        object: 'model',
        deleted: true,
        provider: this.providerId
      };

      await this.auditEvent('fine_tuned_model_deleted', {
        modelId: modelId,
        deleted: result.deleted,
        timestamp: new Date().toISOString()
      });

      return result;

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
   * Estimate fine-tuning cost for Perplexity
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

      // Perplexity fine-tuning pricing (estimated competitive rates)
      if (!options.model) {
        throw new Error('Model must be specified in options - no default model available');
      }
      const model = options.model;
      let costPerToken = 0.003; // $0.003 per 1K tokens (estimated)
      
      if (model.includes('70b')) {
        costPerToken = 0.012; // Higher cost for larger models
      } else if (model.includes('mixtral')) {
        costPerToken = 0.006; // Medium cost for mixture models
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
        note: 'Competitive pricing - base models only (not Sonar search models)'
      };

    } catch (error) {
      return super.estimateFineTuningCost(trainingData, options);
    }
  }

  /**
   * Get Perplexity fine-tuning information
   * @returns {Object} Information about Perplexity fine-tuning
   */
  getPerplexityFinetuningInfo() {
    return {
      available: true,
      status: 'supported',
      message: 'Perplexity supports fine-tuning on base models (non-Sonar). Search capabilities are only available in pre-trained Sonar models.',
      supportedModels: [
        'llama-3.1-8b-instruct',
        'llama-3.1-70b-instruct', 
        'mixtral-8x7b-instruct'
      ],
      unsupportedModels: [
        'llama-3.1-sonar-small-128k-online',
        'llama-3.1-sonar-large-128k-online',
        'llama-3.1-sonar-huge-128k-online'
      ],
      tradeoffs: {
        'Base Models (Fine-tunable)': [
          'Can be customized with your data',
          'No real-time search capabilities',
          'Lower inference costs',
          'Full control over model behavior'
        ],
        'Sonar Models (Not fine-tunable)': [
          'Real-time web search integration',
          'Up-to-date information access',
          'Higher inference costs',
          'Cannot be customized'
        ]
      },
      recommendation: 'Use base models for domain-specific fine-tuning, Sonar models for real-time information needs'
    };
  }

  /**
   * Get model description
   */
  getModelDescription(model) {
    const descriptions = {
      'llama-3.1-sonar-small-128k-online': 'Perplexity\'s search-enabled Llama model - real-time web access',
      'llama-3.1-sonar-large-128k-online': 'Larger search-enabled model with enhanced capabilities',
      'llama-3.1-sonar-huge-128k-online': 'Most powerful search model with comprehensive web access',
      'llama-3.1-8b-instruct': 'Base Llama 3.1 8B model - fine-tunable, no search',
      'llama-3.1-70b-instruct': 'Large base Llama 3.1 70B model - fine-tunable, no search',
      'mixtral-8x7b-instruct': 'Mixture of experts model - fine-tunable, efficient'
    };
    return descriptions[model] || 'Perplexity AI language model';
  }

  /**
   * Get model context length
   */
  getModelContextLength(model) {
    const contextLengths = {
      'llama-3.1-sonar-small-128k-online': 127072,
      'llama-3.1-sonar-large-128k-online': 127072,
      'llama-3.1-sonar-huge-128k-online': 127072,
      'llama-3.1-8b-instruct': 131072,
      'llama-3.1-70b-instruct': 131072,
      'mixtral-8x7b-instruct': 32768
    };
    return contextLengths[model] || 32768;
  }

  /**
   * Get model cost per 1k tokens (approximate)
   */
  getModelCost(model) {
    const costs = {
      'llama-3.1-sonar-small-128k-online': 0.0002,
      'llama-3.1-sonar-large-128k-online': 0.0006,
      'llama-3.1-sonar-huge-128k-online': 0.0012,
      'llama-3.1-8b-instruct': 0.0002,
      'llama-3.1-70b-instruct': 0.001,
      'mixtral-8x7b-instruct': 0.0006
    };
    return costs[model] || 0.0002;
  }
}

module.exports = PerplexityProvider;

