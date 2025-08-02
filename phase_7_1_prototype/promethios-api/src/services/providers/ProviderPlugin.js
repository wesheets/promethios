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
   * @param {Object} requestData - Request data including messages, model, etc.
   * @returns {Object} Provider response
   */
  async generateResponse(requestData) {
    if (!this.initialized) {
      throw new Error(`Provider ${this.providerName} not initialized`);
    }
    
    const startTime = Date.now();
    
    try {
      console.log(`🔧 ProviderPlugin: Generating response with ${this.providerName}`);
      
      // Validate request data
      this.validateRequestData(requestData);
      
      // Pre-process request (governance context already injected by registry)
      const processedRequest = await this.preprocessRequest(requestData);
      
      // Generate response using provider-specific implementation
      const rawResponse = await this.callProviderAPI(processedRequest);
      
      // Post-process response
      const processedResponse = await this.postprocessResponse(rawResponse, requestData);
      
      // Add provider metadata
      const finalResponse = {
        ...processedResponse,
        provider: {
          id: this.providerId,
          name: this.providerName,
          model: requestData.model,
          responseTime: Date.now() - startTime
        }
      };
      
      console.log(`✅ ProviderPlugin: Response generated successfully with ${this.providerName}`);
      
      // Audit successful response
      await this.auditEvent('response_generated', {
        providerId: this.providerId,
        model: requestData.model,
        responseTime: Date.now() - startTime,
        responseLength: finalResponse.content?.length || 0,
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
  // UTILITY METHODS
  // ========================================

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
}

module.exports = ProviderPlugin;

