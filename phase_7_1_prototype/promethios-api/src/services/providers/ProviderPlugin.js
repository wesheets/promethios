/**
 * ProviderPlugin.js
 * 
 * Base class for all LLM provider plugins
 * Defines the standard interface and common functionality
 * Integrates with Promethios governance and audit systems
 */

const auditService = require('../auditService');

class ProviderPlugin {
  constructor(providerId, providerName) {
    this.providerId = providerId;
    this.providerName = providerName;
    this.config = {};
    this.initialized = false;
    this.capabilities = [];
    this.supportedModels = [];
    
    console.log(`🔧 ProviderPlugin: Creating ${providerName} plugin (${providerId})`);
  }

  /**
   * Initialize the provider plugin with configuration
   * @param {Object} config - Provider configuration
   */
  async initialize(config) {
    try {
      console.log(`🔧 ProviderPlugin: Initializing ${this.providerName} with config`);
      
      this.config = { ...config };
      
      // Validate required configuration
      await this.validateConfiguration(config);
      
      // Initialize provider-specific setup
      await this.initializeProvider(config);
      
      // Discover capabilities and models
      await this.discoverCapabilities();
      await this.discoverSupportedModels();
      
      this.initialized = true;
      
      console.log(`✅ ProviderPlugin: ${this.providerName} initialized successfully`);
      
      // Audit initialization
      await this.auditEvent('provider_initialized', {
        providerId: this.providerId,
        capabilities: this.capabilities,
        modelCount: this.supportedModels.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ ProviderPlugin: Failed to initialize ${this.providerName}:`, error);
      
      // Audit initialization failure
      await this.auditEvent('provider_initialization_failed', {
        providerId: this.providerId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Generate response using this provider
   * @param {Object} requestData - Request data including messages, model, tools, etc.
   * @returns {Object} Provider response
   */
  async generateResponse(requestData) {
    if (!this.initialized) {
      throw new Error(`Provider ${this.providerName} not initialized`);
    }
    
    const startTime = Date.now();
    
    try {
      console.log(`🔧 ProviderPlugin: Generating response with ${this.providerName}`);
      
      // Log tool availability
      if (requestData.tools && requestData.tools.length > 0) {
        console.log(`🛠️ ProviderPlugin: ${requestData.tools.length} tools available for ${this.providerName}`);
      }
      
      // Validate request data
      this.validateRequestData(requestData);
      
      // Pre-process request (governance context already injected by registry)
      const processedRequest = await this.preprocessRequest(requestData);
      
      // Generate response using provider-specific implementation
      const rawResponse = await this.callProviderAPI(processedRequest);
      
      // Post-process response (handle tool calls if present)
      const processedResponse = await this.postprocessResponse(rawResponse, requestData);
      
      // Add provider metadata
      const finalResponse = {
        ...processedResponse,
        provider: {
          id: this.providerId,
          name: this.providerName,
          model: requestData.model,
          responseTime: Date.now() - startTime,
          toolsEnabled: !!(requestData.tools && requestData.tools.length > 0)
        }
      };
      
      console.log(`✅ ProviderPlugin: Response generated successfully with ${this.providerName}`);
      
      // Audit successful response
      await this.auditEvent('response_generated', {
        providerId: this.providerId,
        model: requestData.model,
        responseTime: Date.now() - startTime,
        responseLength: finalResponse.content?.length || 0,
        toolsEnabled: !!(requestData.tools && requestData.tools.length > 0),
        toolCallsCount: finalResponse.tool_calls?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      return finalResponse;
      
    } catch (error) {
      console.error(`❌ ProviderPlugin: Error generating response with ${this.providerName}:`, error);
      
      // Audit failed response
      await this.auditEvent('response_generation_failed', {
        providerId: this.providerId,
        model: requestData.model,
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Perform health check
   * @returns {Object} Health check result
   */
  async healthCheck() {
    try {
      console.log(`🔧 ProviderPlugin: Performing health check for ${this.providerName}`);
      
      if (!this.initialized) {
        return {
          healthy: false,
          details: { error: 'Provider not initialized' }
        };
      }
      
      // Perform provider-specific health check
      const healthResult = await this.performHealthCheck();
      
      console.log(`✅ ProviderPlugin: Health check completed for ${this.providerName}:`, healthResult.healthy ? 'healthy' : 'unhealthy');
      
      return healthResult;
      
    } catch (error) {
      console.error(`❌ ProviderPlugin: Health check failed for ${this.providerName}:`, error);
      
      return {
        healthy: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Get provider name
   * @returns {string} Provider name
   */
  getName() {
    return this.providerName;
  }

  /**
   * Get provider capabilities
   * @returns {Array} Array of capability strings
   */
  getCapabilities() {
    return [...this.capabilities];
  }

  /**
   * Get supported models
   * @returns {Array} Array of supported model objects
   */
  getSupportedModels() {
    return [...this.supportedModels];
  }

  /**
   * Get provider configuration (sanitized)
   * @returns {Object} Sanitized configuration
   */
  getConfiguration() {
    const sanitized = { ...this.config };
    
    // Remove sensitive information
    delete sanitized.apiKey;
    delete sanitized.secretKey;
    delete sanitized.password;
    delete sanitized.token;
    
    return sanitized;
  }

  // ========================================
  // ABSTRACT METHODS - Must be implemented by subclasses
  // ========================================

  /**
   * Validate provider-specific configuration
   * @param {Object} config - Configuration to validate
   */
  async validateConfiguration(config) {
    throw new Error('validateConfiguration must be implemented by provider subclass');
  }

  /**
   * Initialize provider-specific setup
   * @param {Object} config - Provider configuration
   */
  async initializeProvider(config) {
    throw new Error('initializeProvider must be implemented by provider subclass');
  }

  /**
   * Discover provider capabilities
   */
  async discoverCapabilities() {
    throw new Error('discoverCapabilities must be implemented by provider subclass');
  }

  /**
   * Discover supported models
   */
  async discoverSupportedModels() {
    throw new Error('discoverSupportedModels must be implemented by provider subclass');
  }

  /**
   * Call the provider's API
   * @param {Object} requestData - Processed request data
   * @returns {Object} Raw provider response
   */
  async callProviderAPI(requestData) {
    throw new Error('callProviderAPI must be implemented by provider subclass');
  }

  /**
   * Perform provider-specific health check
   * @returns {Object} Health check result
   */
  async performHealthCheck() {
    throw new Error('performHealthCheck must be implemented by provider subclass');
  }

  // ========================================
  // FINE-TUNING ABSTRACT METHODS - Must be implemented by subclasses
  // ========================================

  /**
   * Create a fine-tuning job
   * @param {Object} trainingData - Training data configuration
   * @param {Object} options - Fine-tuning options
   * @returns {Object} Fine-tuning job details
   */
  async createFineTuningJob(trainingData, options = {}) {
    throw new Error('createFineTuningJob must be implemented by provider subclass');
  }

  /**
   * Get fine-tuning job status
   * @param {string} jobId - Fine-tuning job ID
   * @returns {Object} Job status and details
   */
  async getFineTuningJob(jobId) {
    throw new Error('getFineTuningJob must be implemented by provider subclass');
  }

  /**
   * List fine-tuning jobs
   * @param {Object} filters - Optional filters for jobs
   * @returns {Array} List of fine-tuning jobs
   */
  async listFineTuningJobs(filters = {}) {
    throw new Error('listFineTuningJobs must be implemented by provider subclass');
  }

  /**
   * Cancel a fine-tuning job
   * @param {string} jobId - Fine-tuning job ID
   * @returns {Object} Cancellation result
   */
  async cancelFineTuningJob(jobId) {
    throw new Error('cancelFineTuningJob must be implemented by provider subclass');
  }

  /**
   * Upload training data file
   * @param {string|Buffer} trainingData - Training data content
   * @param {Object} options - Upload options
   * @returns {Object} Upload result with file ID
   */
  async uploadTrainingData(trainingData, options = {}) {
    throw new Error('uploadTrainingData must be implemented by provider subclass');
  }

  /**
   * Get fine-tuned model details
   * @param {string} modelId - Fine-tuned model ID
   * @returns {Object} Model details and metadata
   */
  async getFineTunedModel(modelId) {
    throw new Error('getFineTunedModel must be implemented by provider subclass');
  }

  /**
   * Delete a fine-tuned model
   * @param {string} modelId - Fine-tuned model ID
   * @returns {Object} Deletion result
   */
  async deleteFineTunedModel(modelId) {
    throw new Error('deleteFineTunedModel must be implemented by provider subclass');
  }

  /**
   * Check if provider supports fine-tuning
   * @returns {boolean} True if fine-tuning is supported
   */
  supportsFineTuning() {
    return this.capabilities.includes('fine-tuning');
  }

  /**
   * Get supported fine-tuning models
   * @returns {Array} List of models that support fine-tuning
   */
  getFineTuningModels() {
    return this.supportedModels.filter(model => model.supportsFineTuning);
  }

  // ========================================
  // OPTIONAL METHODS - Can be overridden by subclasses
  // ========================================

  /**
   * Validate request data
   * @param {Object} requestData - Request data to validate
   */
  validateRequestData(requestData) {
    if (!requestData) {
      throw new Error('Request data is required');
    }
    
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      throw new Error('Messages array is required');
    }
    
    if (requestData.messages.length === 0) {
      throw new Error('At least one message is required');
    }
    
    // Validate message format
    for (const message of requestData.messages) {
      if (!message.role || !message.content) {
        throw new Error('Each message must have role and content');
      }
      
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        throw new Error('Message role must be system, user, or assistant');
      }
    }
  }

  /**
   * Pre-process request data
   * @param {Object} requestData - Original request data
   * @returns {Object} Processed request data
   */
  async preprocessRequest(requestData) {
    // Default implementation - return as-is
    // Subclasses can override for provider-specific preprocessing
    return requestData;
  }

  /**
   * Post-process provider response
   * @param {Object} rawResponse - Raw provider response
   * @param {Object} originalRequest - Original request data
   * @returns {Object} Processed response
   */
  async postprocessResponse(rawResponse, originalRequest) {
    // Default implementation - return as-is
    // Subclasses can override for provider-specific postprocessing
    return rawResponse;
  }

  // ========================================
  // FINE-TUNING HELPER METHODS
  // ========================================

  /**
   * Validate training data format
   * @param {Object} trainingData - Training data to validate
   * @param {string} format - Expected format (jsonl, csv, etc.)
   */
  validateTrainingData(trainingData, format = 'jsonl') {
    if (!trainingData) {
      throw new Error('Training data is required');
    }

    if (format === 'jsonl') {
      // Validate JSONL format for chat/completion training
      const lines = trainingData.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Training data cannot be empty');
      }

      for (let i = 0; i < lines.length; i++) {
        try {
          const parsed = JSON.parse(lines[i]);
          
          // Validate chat format
          if (parsed.messages) {
            if (!Array.isArray(parsed.messages)) {
              throw new Error(`Line ${i + 1}: messages must be an array`);
            }
            
            for (const message of parsed.messages) {
              if (!message.role || !message.content) {
                throw new Error(`Line ${i + 1}: each message must have role and content`);
              }
            }
          }
          // Validate completion format
          else if (parsed.prompt !== undefined && parsed.completion !== undefined) {
            if (typeof parsed.prompt !== 'string' || typeof parsed.completion !== 'string') {
              throw new Error(`Line ${i + 1}: prompt and completion must be strings`);
            }
          } else {
            throw new Error(`Line ${i + 1}: must have either messages array or prompt/completion pair`);
          }
          
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new Error(`Line ${i + 1}: invalid JSON format`);
          }
          throw error;
        }
      }
    }
  }

  /**
   * Prepare training data for provider-specific format
   * @param {Array} samples - Training samples
   * @param {string} format - Target format
   * @returns {string} Formatted training data
   */
  prepareTrainingData(samples, format = 'jsonl') {
    if (!Array.isArray(samples)) {
      throw new Error('Training samples must be an array');
    }

    if (format === 'jsonl') {
      return samples.map(sample => JSON.stringify(sample)).join('\n');
    }

    throw new Error(`Unsupported training data format: ${format}`);
  }

  /**
   * Estimate fine-tuning cost
   * @param {Object} trainingData - Training data
   * @param {Object} options - Fine-tuning options
   * @returns {Object} Cost estimation
   */
  async estimateFineTuningCost(trainingData, options = {}) {
    // Default implementation - providers should override with specific pricing
    const lines = trainingData.split('\n').filter(line => line.trim()).length;
    const estimatedTokens = lines * 100; // Rough estimate
    
    return {
      estimatedSamples: lines,
      estimatedTokens: estimatedTokens,
      estimatedCostUSD: estimatedTokens * 0.0001, // Generic estimate
      currency: 'USD',
      provider: this.providerId
    };
  }

  /**
   * Monitor fine-tuning job progress
   * @param {string} jobId - Fine-tuning job ID
   * @param {Function} progressCallback - Callback for progress updates
   * @param {number} pollInterval - Polling interval in milliseconds
   */
  async monitorFineTuningJob(jobId, progressCallback, pollInterval = 30000) {
    const startTime = Date.now();
    let lastStatus = null;

    const poll = async () => {
      try {
        const jobStatus = await this.getFineTuningJob(jobId);
        
        if (jobStatus.status !== lastStatus) {
          lastStatus = jobStatus.status;
          
          // Audit status change
          await this.auditEvent('fine_tuning_status_change', {
            jobId: jobId,
            status: jobStatus.status,
            progress: jobStatus.progress || 0,
            elapsedTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });

          // Call progress callback
          if (progressCallback) {
            progressCallback(jobStatus);
          }
        }

        // Continue polling if job is still running
        if (['queued', 'running', 'validating'].includes(jobStatus.status)) {
          setTimeout(poll, pollInterval);
        } else {
          // Job completed or failed
          await this.auditEvent('fine_tuning_job_completed', {
            jobId: jobId,
            finalStatus: jobStatus.status,
            totalTime: Date.now() - startTime,
            modelId: jobStatus.fine_tuned_model,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error(`❌ Error monitoring fine-tuning job ${jobId}:`, error);
        
        await this.auditEvent('fine_tuning_monitoring_error', {
          jobId: jobId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Start polling
    poll();
  }

  /**
   * Generate fine-tuning job with governance oversight
   * @param {Object} trainingData - Training data configuration
   * @param {Object} options - Fine-tuning options with governance
   * @returns {Object} Fine-tuning job with governance metadata
   */
  async createGovernedFineTuningJob(trainingData, options = {}) {
    const startTime = Date.now();

    try {
      // Validate training data
      this.validateTrainingData(trainingData.content, trainingData.format);

      // Apply governance context if provided
      if (options.governanceContext) {
        // Log governance context application
        await this.auditEvent('fine_tuning_governance_applied', {
          governanceContext: options.governanceContext,
          trainingDataSize: trainingData.content.length,
          timestamp: new Date().toISOString()
        });
      }

      // Estimate cost
      const costEstimate = await this.estimateFineTuningCost(trainingData.content, options);

      // Create fine-tuning job
      const job = await this.createFineTuningJob(trainingData, options);

      // Add governance metadata
      const governedJob = {
        ...job,
        governance: {
          context: options.governanceContext,
          costEstimate: costEstimate,
          createdAt: new Date().toISOString(),
          provider: this.providerId
        }
      };

      // Audit job creation
      await this.auditEvent('governed_fine_tuning_job_created', {
        jobId: job.id,
        provider: this.providerId,
        costEstimate: costEstimate,
        governanceContext: options.governanceContext,
        creationTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      return governedJob;

    } catch (error) {
      // Audit job creation failure
      await this.auditEvent('governed_fine_tuning_job_failed', {
        provider: this.providerId,
        error: error.message,
        governanceContext: options.governanceContext,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Audit provider events
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   */
  async auditEvent(eventType, eventData) {
    try {
      await auditService.logEvent(`provider_${eventType}`, 'system', {
        providerId: this.providerId,
        providerName: this.providerName,
        ...eventData
      });
    } catch (error) {
      console.error(`❌ ProviderPlugin: Error auditing event ${eventType}:`, error);
      // Don't throw - audit failures shouldn't break provider functionality
    }
  }

  /**
   * Create standardized error response
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   * @returns {Error} Standardized error
   */
  createError(message, code = 'PROVIDER_ERROR', details = {}) {
    const error = new Error(message);
    error.code = code;
    error.provider = this.providerId;
    error.details = details;
    return error;
  }

  /**
   * Retry mechanism with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {number} maxAttempts - Maximum retry attempts
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {*} Operation result
   */
  async retryWithBackoff(operation, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⚠️ ProviderPlugin: Attempt ${attempt} failed for ${this.providerName}, retrying in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Sanitize data for logging
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
  sanitizeForLogging(data) {
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove sensitive fields
    const sensitiveFields = ['apiKey', 'secretKey', 'password', 'token', 'authorization'];
    
    const removeSensitiveFields = (obj) => {
      if (typeof obj !== 'object' || obj === null) return;
      
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          removeSensitiveFields(obj[key]);
        }
      }
    };
    
    removeSensitiveFields(sanitized);
    return sanitized;
  }

  // ============================================================================
  // TOOL INTEGRATION METHODS
  // ============================================================================

  /**
   * Check if this provider supports tool calling
   * @returns {boolean} True if provider supports tools
   */
  supportsTools() {
    return this.capabilities.includes('function_calling') || this.capabilities.includes('tool_calling');
  }

  /**
   * Format tool schemas for this provider's API format
   * @param {Array} toolSchemas - Array of tool schemas
   * @returns {Array} Provider-specific tool format
   */
  formatToolsForProvider(toolSchemas) {
    // Default implementation - override in provider-specific classes
    return toolSchemas;
  }

  /**
   * Extract tool calls from provider response
   * @param {Object} response - Provider response
   * @returns {Array} Array of tool calls
   */
  extractToolCalls(response) {
    // Default implementation - override in provider-specific classes
    return response.tool_calls || [];
  }

  /**
   * Check if response contains tool calls
   * @param {Object} response - Provider response
   * @returns {boolean} True if response contains tool calls
   */
  hasToolCalls(response) {
    const toolCalls = this.extractToolCalls(response);
    return toolCalls && toolCalls.length > 0;
  }

  /**
   * Process tool calls and execute them
   * @param {Array} toolCalls - Array of tool calls
   * @param {Object} context - Execution context
   * @returns {Array} Array of tool results
   */
  async processToolCalls(toolCalls, context = {}) {
    console.log(`🛠️ ProviderPlugin: Processing ${toolCalls.length} tool calls for ${this.providerName}`);
    
    const toolResults = [];
    
    for (const toolCall of toolCalls) {
      try {
        console.log(`🛠️ ProviderPlugin: Executing tool: ${toolCall.function?.name || toolCall.name}`);
        
        // This will be handled by the Universal Governance Adapter
        const result = await this.executeToolCall(toolCall, context);
        toolResults.push(result);
        
      } catch (error) {
        console.error(`❌ ProviderPlugin: Tool execution failed:`, error);
        
        // Create error result
        const errorResult = {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function?.name || toolCall.name,
          content: JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString()
          })
        };
        
        toolResults.push(errorResult);
      }
    }
    
    return toolResults;
  }

  /**
   * Execute a single tool call (to be implemented by registry/governance layer)
   * @param {Object} toolCall - Tool call to execute
   * @param {Object} context - Execution context
   * @returns {Object} Tool execution result
   */
  async executeToolCall(toolCall, context = {}) {
    // This method should be overridden by the registry or governance layer
    throw new Error(`Tool execution not implemented for provider ${this.providerName}. This should be handled by the registry or governance layer.`);
  }
}

module.exports = ProviderPlugin;

