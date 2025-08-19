/**
 * OpenAI Provider Plugin
 * 
 * Reference implementation for the modular LLM provider architecture.
 * Demonstrates how to integrate with existing governance systems while
 * providing bulletproof isolation and reliability.
 */

const ProviderPlugin = require('./ProviderPlugin');
const OpenAI = require('openai');

class OpenAIProvider extends ProviderPlugin {
  constructor() {
    super('openai', 'OpenAI');
    this.client = null;
    this.supportedModels = [
      { 
        id: 'gpt-4', 
        name: 'GPT-4', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion']
      },
      { 
        id: 'gpt-4-turbo', 
        name: 'GPT-4 Turbo', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion']
      },
      { 
        id: 'gpt-4-turbo-preview', 
        name: 'GPT-4 Turbo Preview', 
        supportsFineTuning: false,
        capabilities: ['chat', 'completion']
      },
      { 
        id: 'gpt-3.5-turbo', 
        name: 'GPT-3.5 Turbo', 
        supportsFineTuning: true,
        capabilities: ['chat', 'completion', 'fine-tuning']
      },
      { 
        id: 'gpt-3.5-turbo-16k', 
        name: 'GPT-3.5 Turbo 16K', 
        supportsFineTuning: true,
        capabilities: ['chat', 'completion', 'fine-tuning']
      }
    ];
    this.capabilities = ['chat', 'completion', 'fine-tuning', 'function_calling'];
  }

  /**
   * Initialize the OpenAI client with API key
   */
  async initialize(config) {
    try {
      this.validateConfig(config);
      
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL || 'https://api.openai.com/v1',
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

      console.log(`✅ OpenAI Provider initialized successfully`);
      return true;
      
    } catch (error) {
      this.isInitialized = false;
      await this.auditEvent('provider_initialization_failed', {
        provider: this.name,
        error: error.message
      });
      throw new Error(`OpenAI Provider initialization failed: ${error.message}`);
    }
  }

  /**
   * Validate OpenAI-specific configuration
   */
  validateConfig(config) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    if (config.apiKey.length < 20) {
      throw new Error('Invalid OpenAI API key format');
    }

    if (config.model && !this.supportedModels.find(m => m.id === config.model)) {
      console.warn(`⚠️ Model ${config.model} not in supported list, but will attempt to use it`);
    }
  }

  // ========================================
  // FINE-TUNING IMPLEMENTATION
  // ========================================

  /**
   * Create a fine-tuning job
   * @param {Object} trainingData - Training data configuration
   * @param {Object} options - Fine-tuning options
   * @returns {Object} Fine-tuning job details
   */
  async createFineTuningJob(trainingData, options = {}) {
    try {
      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      // Validate model supports fine-tuning
      const model = options.model || 'gpt-3.5-turbo';
      const modelInfo = this.supportedModels.find(m => m.id === model);
      if (!modelInfo || !modelInfo.supportsFineTuning) {
        throw new Error(`Model ${model} does not support fine-tuning`);
      }

      // Upload training data first
      const uploadResult = await this.uploadTrainingData(trainingData.content, {
        filename: trainingData.filename || 'training_data.jsonl'
      });

      // Create fine-tuning job
      const job = await this.client.fineTuning.jobs.create({
        training_file: uploadResult.file_id,
        model: model,
        hyperparameters: {
          n_epochs: options.epochs || 3,
          batch_size: options.batch_size || 'auto',
          learning_rate_multiplier: options.learning_rate || 'auto'
        },
        suffix: options.suffix || null
      });

      // Audit job creation
      await this.auditEvent('fine_tuning_job_created', {
        jobId: job.id,
        model: model,
        trainingFile: uploadResult.file_id,
        hyperparameters: job.hyperparameters,
        timestamp: new Date().toISOString()
      });

      return {
        id: job.id,
        status: job.status,
        model: job.model,
        training_file: job.training_file,
        hyperparameters: job.hyperparameters,
        created_at: new Date(job.created_at * 1000).toISOString(),
        provider: this.providerId
      };

    } catch (error) {
      await this.auditEvent('fine_tuning_job_creation_failed', {
        error: error.message,
        model: options.model,
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
      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      const job = await this.client.fineTuning.jobs.retrieve(jobId);

      return {
        id: job.id,
        status: job.status,
        model: job.model,
        fine_tuned_model: job.fine_tuned_model,
        training_file: job.training_file,
        validation_file: job.validation_file,
        hyperparameters: job.hyperparameters,
        result_files: job.result_files,
        trained_tokens: job.trained_tokens,
        created_at: new Date(job.created_at * 1000).toISOString(),
        updated_at: job.updated_at ? new Date(job.updated_at * 1000).toISOString() : null,
        finished_at: job.finished_at ? new Date(job.finished_at * 1000).toISOString() : null,
        provider: this.providerId
      };

    } catch (error) {
      await this.auditEvent('fine_tuning_job_retrieval_failed', {
        jobId: jobId,
        error: error.message,
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
      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      const jobs = await this.client.fineTuning.jobs.list({
        limit: filters.limit || 20
      });

      return jobs.data.map(job => ({
        id: job.id,
        status: job.status,
        model: job.model,
        fine_tuned_model: job.fine_tuned_model,
        created_at: new Date(job.created_at * 1000).toISOString(),
        finished_at: job.finished_at ? new Date(job.finished_at * 1000).toISOString() : null,
        provider: this.providerId
      }));

    } catch (error) {
      await this.auditEvent('fine_tuning_jobs_list_failed', {
        error: error.message,
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
      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      const job = await this.client.fineTuning.jobs.cancel(jobId);

      await this.auditEvent('fine_tuning_job_cancelled', {
        jobId: jobId,
        status: job.status,
        timestamp: new Date().toISOString()
      });

      return {
        id: job.id,
        status: job.status,
        cancelled_at: new Date().toISOString(),
        provider: this.providerId
      };

    } catch (error) {
      await this.auditEvent('fine_tuning_job_cancellation_failed', {
        jobId: jobId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Upload training data file
   * @param {string|Buffer} trainingData - Training data content
   * @param {Object} options - Upload options
   * @returns {Object} Upload result with file ID
   */
  async uploadTrainingData(trainingData, options = {}) {
    try {
      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      // Create temporary file for upload
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const tempDir = os.tmpdir();
      const filename = options.filename || 'training_data.jsonl';
      const tempFilePath = path.join(tempDir, `openai_${Date.now()}_${filename}`);

      // Write training data to temporary file
      fs.writeFileSync(tempFilePath, trainingData);

      try {
        // Upload file to OpenAI
        const file = await this.client.files.create({
          file: fs.createReadStream(tempFilePath),
          purpose: 'fine-tune'
        });

        await this.auditEvent('training_data_uploaded', {
          fileId: file.id,
          filename: filename,
          bytes: file.bytes,
          timestamp: new Date().toISOString()
        });

        return {
          file_id: file.id,
          filename: file.filename,
          bytes: file.bytes,
          status: file.status,
          provider: this.providerId
        };

      } finally {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn('⚠️ Failed to clean up temporary file:', cleanupError);
        }
      }

    } catch (error) {
      await this.auditEvent('training_data_upload_failed', {
        error: error.message,
        filename: options.filename,
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
      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      const model = await this.client.models.retrieve(modelId);

      return {
        id: model.id,
        object: model.object,
        created: new Date(model.created * 1000).toISOString(),
        owned_by: model.owned_by,
        root: model.root,
        parent: model.parent,
        provider: this.providerId
      };

    } catch (error) {
      await this.auditEvent('fine_tuned_model_retrieval_failed', {
        modelId: modelId,
        error: error.message,
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
      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      const result = await this.client.models.del(modelId);

      await this.auditEvent('fine_tuned_model_deleted', {
        modelId: modelId,
        deleted: result.deleted,
        timestamp: new Date().toISOString()
      });

      return {
        id: result.id,
        deleted: result.deleted,
        provider: this.providerId
      };

    } catch (error) {
      await this.auditEvent('fine_tuned_model_deletion_failed', {
        modelId: modelId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Estimate fine-tuning cost for OpenAI
   * @param {string} trainingData - Training data content
   * @param {Object} options - Fine-tuning options
   * @returns {Object} Cost estimation
   */
  async estimateFineTuningCost(trainingData, options = {}) {
    try {
      const lines = trainingData.split('\n').filter(line => line.trim()).length;
      
      // Estimate tokens (rough calculation)
      let totalTokens = 0;
      const dataLines = trainingData.split('\n').filter(line => line.trim());
      
      for (const line of dataLines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.messages) {
            // Chat format
            const messageText = parsed.messages.map(m => m.content).join(' ');
            totalTokens += Math.ceil(messageText.length / 4); // Rough token estimate
          } else if (parsed.prompt && parsed.completion) {
            // Completion format
            totalTokens += Math.ceil((parsed.prompt + parsed.completion).length / 4);
          }
        } catch (e) {
          // Skip invalid lines
        }
      }

      // OpenAI fine-tuning pricing (as of 2024)
      const model = options.model || 'gpt-3.5-turbo';
      let costPerToken = 0.0080; // $0.0080 per 1K tokens for gpt-3.5-turbo training
      
      if (model.includes('gpt-4')) {
        costPerToken = 0.0300; // Higher cost for GPT-4 (when available)
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
        model: model
      };

    } catch (error) {
      // Return default estimate on error
      return super.estimateFineTuningCost(trainingData, options);
    }
  }

  /**
   * Generate response using OpenAI API with full governance integration
   */
  async generateResponse(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure provider is initialized
      if (!this.isInitialized || !this.client) {
        throw new Error('OpenAI Provider not initialized');
      }

      // Apply governance context if provided
      let enhancedPrompt = prompt;
      if (options.governanceContext) {
        enhancedPrompt = await this.applyGovernanceContext(prompt, options.governanceContext);
      }

      // Prepare OpenAI request
      const requestConfig = {
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1.0,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0
      };

      // Add system message if provided
      if (options.systemMessage) {
        requestConfig.messages.unshift({
          role: 'system',
          content: options.systemMessage
        });
      }

      console.log(`🤖 OpenAI Provider: Generating response with model ${requestConfig.model}`);

      // Make the API call
      const response = await this.client.chat.completions.create(requestConfig);
      
      const responseTime = Date.now() - startTime;
      const generatedText = response.choices[0]?.message?.content || '';

      // Apply governance post-processing if needed
      let finalResponse = generatedText;
      if (options.governanceContext) {
        finalResponse = await this.applyGovernancePostProcessing(generatedText, options.governanceContext);
      }

      // Update metrics
      await this.updateMetrics({
        requestCount: 1,
        responseTime,
        tokensUsed: response.usage?.total_tokens || 0,
        success: true
      });

      // Audit the interaction
      await this.auditEvent('response_generated', {
        provider: this.name,
        model: requestConfig.model,
        responseTime,
        tokensUsed: response.usage?.total_tokens || 0,
        promptLength: prompt.length,
        responseLength: finalResponse.length,
        agentId: options.agentId,
        userId: options.userId
      });

      return {
        success: true,
        response: finalResponse,
        metadata: {
          provider: this.name,
          model: requestConfig.model,
          responseTime,
          tokensUsed: response.usage?.total_tokens || 0,
          finishReason: response.choices[0]?.finish_reason,
          governanceApplied: !!options.governanceContext
        }
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

      // Handle specific OpenAI errors
      if (error.status === 401) {
        this.isHealthy = false;
        throw new Error('OpenAI API authentication failed - check API key');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded - please try again later');
      } else if (error.status === 500) {
        this.isHealthy = false;
        throw new Error('OpenAI API server error - service temporarily unavailable');
      }

      throw new Error(`OpenAI Provider error: ${error.message}`);
    }
  }

  /**
   * Apply governance context to the prompt
   */
  async applyGovernanceContext(prompt, governanceContext) {
    try {
      // If agent has access to audit logs, include relevant context
      if (governanceContext.auditLogAccess && governanceContext.agentId) {
        const auditContext = await this.getAuditContextForAgent(governanceContext.agentId);
        if (auditContext) {
          return `${prompt}\n\n[Governance Context: Based on my audit history, I should consider: ${auditContext}]`;
        }
      }

      // Apply policy context if available
      if (governanceContext.policies && governanceContext.policies.length > 0) {
        const policyContext = governanceContext.policies.map(p => p.description).join('; ');
        return `${prompt}\n\n[Policy Context: ${policyContext}]`;
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
   * Health check for OpenAI API
   */
  async healthCheck() {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      // Simple test request to verify API connectivity
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });

      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      
      return {
        healthy: true,
        latency: Date.now() - this.lastHealthCheck.getTime(),
        model: 'gpt-3.5-turbo'
      };
      
    } catch (error) {
      this.isHealthy = false;
      throw new Error(`OpenAI health check failed: ${error.message}`);
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
        description: 'OpenAI API key',
        sensitive: true
      },
      baseURL: {
        type: 'string',
        required: false,
        description: 'Custom API base URL (optional)',
        default: 'https://api.openai.com/v1'
      },
      model: {
        type: 'string',
        required: false,
        description: 'Default model to use',
        enum: this.supportedModels,
        default: 'gpt-3.5-turbo'
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

  /**
   * Get model description
   */
  getModelDescription(model) {
    const descriptions = {
      'gpt-4': 'Most capable GPT-4 model, great for complex tasks',
      'gpt-4-turbo': 'Faster and more efficient GPT-4 variant',
      'gpt-4-turbo-preview': 'Latest GPT-4 Turbo preview with enhanced capabilities',
      'gpt-3.5-turbo': 'Fast and efficient model for most tasks',
      'gpt-3.5-turbo-16k': 'GPT-3.5 with extended context length'
    };
    return descriptions[model] || 'OpenAI language model';
  }

  /**
   * Get model context length
   */
  getModelContextLength(model) {
    const contextLengths = {
      'gpt-4': 8192,
      'gpt-4-turbo': 128000,
      'gpt-4-turbo-preview': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384
    };
    return contextLengths[model] || 4096;
  }

  /**
   * Get model cost per 1k tokens (approximate)
   */
  getModelCost(model) {
    const costs = {
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-4-turbo-preview': 0.01,
      'gpt-3.5-turbo': 0.002,
      'gpt-3.5-turbo-16k': 0.004
    };
    return costs[model] || 0.002;
  }

  // ============================================================================
  // PROVIDER PLUGIN INTERFACE METHODS
  // ============================================================================

  /**
   * Call the OpenAI API (required by ProviderPlugin base class)
   * @param {Object} requestData - Request data including messages, model, tools, etc.
   * @returns {Object} Raw API response
   */
  async callProviderAPI(requestData) {
    try {
      console.log(`🤖 OpenAIProvider: Making API call with model ${requestData.model}`);
      
      // Prepare OpenAI request configuration
      const requestConfig = {
        model: requestData.model || 'gpt-4',
        messages: requestData.messages || [],
        max_tokens: requestData.maxTokens || 1000,
        temperature: requestData.temperature || 0.7,
        top_p: requestData.topP || 1.0,
        frequency_penalty: requestData.frequencyPenalty || 0,
        presence_penalty: requestData.presencePenalty || 0
      };

      // Add tools if provided and supported
      if (requestData.tools && requestData.tools.length > 0) {
        console.log(`🛠️ OpenAIProvider: Adding ${requestData.tools.length} tools to request`);
        requestConfig.tools = requestData.tools;
        requestConfig.tool_choice = 'auto'; // Let OpenAI decide when to use tools
      }

      // Make the API call
      const response = await this.client.chat.completions.create(requestConfig);
      
      console.log(`✅ OpenAIProvider: API call successful`);
      return response;
      
    } catch (error) {
      console.error(`❌ OpenAIProvider: API call failed:`, error);
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
      const message = rawResponse.choices[0]?.message;
      
      if (!message) {
        throw new Error('No message in OpenAI response');
      }

      const processedResponse = {
        content: message.content,
        role: message.role,
        usage: rawResponse.usage
      };

      // Handle tool calls if present
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🛠️ OpenAIProvider: Found ${message.tool_calls.length} tool calls`);
        processedResponse.tool_calls = message.tool_calls;
      }

      return processedResponse;
      
    } catch (error) {
      console.error(`❌ OpenAIProvider: Response post-processing failed:`, error);
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
    return true; // OpenAI supports function calling
  }

  /**
   * Format tool schemas for OpenAI's API format
   * @param {Array} toolSchemas - Array of tool schemas
   * @returns {Array} OpenAI-specific tool format
   */
  formatToolsForProvider(toolSchemas) {
    return toolSchemas.map(schema => ({
      type: 'function',
      function: {
        name: schema.name,
        description: schema.description,
        parameters: schema.parameters || {
          type: 'object',
          properties: {},
          required: []
        }
      }
    }));
  }

  /**
   * Check if response contains tool calls
   * @param {Object} response - Provider response
   * @returns {boolean} True if response has tool calls
   */
  hasToolCalls(response) {
    return response.tool_calls && Array.isArray(response.tool_calls) && response.tool_calls.length > 0;
  }

  /**
   * Extract tool calls from OpenAI response
   * @param {Object} response - Provider response
   * @returns {Array} Array of tool calls
   */
  extractToolCalls(response) {
    return response.tool_calls || [];
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
        console.log(`🛠️ OpenAI Provider: Processing tool call ${toolCall.function.name}`);
        
        // Execute tool call using the executeToolCall method
        const result = await this.executeToolCall(toolCall, context);
        results.push(result);
        
      } catch (error) {
        console.error(`❌ OpenAI Provider: Tool call failed:`, error);
        
        // Add error result
        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
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

module.exports = OpenAIProvider;

