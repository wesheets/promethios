/**
 * ProviderRegistry.js
 * 
 * Core registry service for managing LLM provider plugins
 * Provides provider discovery, registration, and lifecycle management
 * Integrates with existing Promethios governance and audit services
 */

const governanceContextService = require('../governanceContextService');
const auditService = require('../auditService');
const cryptographicAuditService = require('../cryptographicAuditService');

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.providerConfigs = new Map();
    this.healthStatus = new Map();
    this.performanceMetrics = new Map();
    this.circuitBreakers = new Map();
    
    // Initialize with default configuration
    this.defaultConfig = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      governanceEnabled: true,
      auditEnabled: true
    };
    
    console.log('🔧 ProviderRegistry: Initialized with governance and audit integration');
  }

  /**
   * Register a provider plugin
   * @param {string} providerId - Unique identifier for the provider
   * @param {ProviderPlugin} providerPlugin - The provider plugin instance
   * @param {Object} config - Provider-specific configuration
   */
  async registerProvider(providerId, providerPlugin, config = {}) {
    try {
      console.log(`🔧 ProviderRegistry: Registering provider ${providerId}`);
      
      // Validate provider plugin interface
      this.validateProviderPlugin(providerPlugin);
      
      // Merge with default configuration
      const providerConfig = { ...this.defaultConfig, ...config };
      
      // Initialize provider with configuration
      await providerPlugin.initialize(providerConfig);
      
      // Register provider
      this.providers.set(providerId, providerPlugin);
      this.providerConfigs.set(providerId, providerConfig);
      this.healthStatus.set(providerId, { status: 'healthy', lastCheck: Date.now() });
      this.performanceMetrics.set(providerId, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastRequestTime: null
      });
      
      // Initialize circuit breaker
      this.circuitBreakers.set(providerId, {
        state: 'closed', // closed, open, half-open
        failureCount: 0,
        lastFailureTime: null,
        nextAttemptTime: null
      });
      
      // Audit provider registration
      await this.auditProviderEvent(providerId, 'provider_registered', {
        config: this.sanitizeConfigForAudit(providerConfig),
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ ProviderRegistry: Provider ${providerId} registered successfully`);
      return true;
      
    } catch (error) {
      console.error(`❌ ProviderRegistry: Failed to register provider ${providerId}:`, error);
      
      // Audit registration failure
      await this.auditProviderEvent(providerId, 'provider_registration_failed', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Get a provider by ID
   * @param {string} providerId - Provider identifier
   * @returns {ProviderPlugin} The provider plugin instance
   */
  getProvider(providerId) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    return provider;
  }

  /**
   * Get all registered providers
   * @returns {Array} Array of provider information
   */
  getAllProviders() {
    const providers = [];
    for (const [providerId, provider] of this.providers) {
      const config = this.providerConfigs.get(providerId);
      const health = this.healthStatus.get(providerId);
      const metrics = this.performanceMetrics.get(providerId);
      const circuitBreaker = this.circuitBreakers.get(providerId);
      
      providers.push({
        id: providerId,
        name: provider.getName(),
        status: health.status,
        circuitBreakerState: circuitBreaker.state,
        metrics: {
          totalRequests: metrics.totalRequests,
          successRate: metrics.totalRequests > 0 ? 
            (metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2) : 0,
          averageResponseTime: metrics.averageResponseTime
        },
        capabilities: provider.getCapabilities(),
        models: provider.getSupportedModels()
      });
    }
    return providers;
  }

  /**
   * Generate response using specified provider with governance integration
   * @param {string} providerId - Provider to use
   * @param {string} agentId - Agent making the request
   * @param {string} userId - User making the request
   * @param {Object} requestData - Request data including messages, model, etc.
   * @returns {Object} Provider response with governance context
   */
  async generateResponse(providerId, agentId, userId, requestData) {
    const startTime = Date.now();
    let auditEventId = null;
    
    try {
      console.log(`🔧 ProviderRegistry: Generating response with provider ${providerId} for agent ${agentId}`);
      
      // Check circuit breaker
      if (!this.isCircuitBreakerClosed(providerId)) {
        throw new Error(`Provider ${providerId} circuit breaker is open`);
      }
      
      // Get provider
      const provider = this.getProvider(providerId);
      const config = this.providerConfigs.get(providerId);
      
      // Create audit event for request
      auditEventId = await this.auditProviderEvent(providerId, 'request_started', {
        agentId,
        userId,
        model: requestData.model,
        messageCount: requestData.messages?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      // Inject governance context if enabled
      let enhancedRequestData = requestData;
      if (config.governanceEnabled) {
        enhancedRequestData = await this.injectGovernanceContext(
          requestData, agentId, userId, providerId
        );
      }
      
      // Generate response using provider
      const response = await provider.generateResponse(enhancedRequestData);
      
      // Record successful request
      this.recordRequestSuccess(providerId, Date.now() - startTime);
      
      // Audit successful response
      await this.auditProviderEvent(providerId, 'request_completed', {
        auditEventId,
        agentId,
        userId,
        responseTime: Date.now() - startTime,
        responseLength: response.content?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ ProviderRegistry: Response generated successfully with provider ${providerId}`);
      
      return {
        ...response,
        metadata: {
          providerId,
          responseTime: Date.now() - startTime,
          auditEventId,
          governanceApplied: config.governanceEnabled
        }
      };
      
    } catch (error) {
      console.error(`❌ ProviderRegistry: Error generating response with provider ${providerId}:`, error);
      
      // Record failed request
      this.recordRequestFailure(providerId);
      
      // Audit failed response
      await this.auditProviderEvent(providerId, 'request_failed', {
        auditEventId,
        agentId,
        userId,
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Inject governance context into request
   */
  async injectGovernanceContext(requestData, agentId, userId, providerId) {
    try {
      console.log(`🔧 ProviderRegistry: Injecting governance context for agent ${agentId}`);
      
      // Get governance context
      const governanceContext = await governanceContextService.getGovernanceContext(agentId, userId);
      
      // Enhance system prompt with governance context
      const messages = [...requestData.messages];
      if (messages.length > 0 && messages[0].role === 'system') {
        // Inject governance context into existing system message
        messages[0].content = await governanceContextService.injectGovernanceContext(
          messages[0].content, agentId, userId
        );
      } else {
        // Add governance context as new system message
        const governanceSystemPrompt = await governanceContextService.injectGovernanceContext(
          '', agentId, userId
        );
        messages.unshift({
          role: 'system',
          content: governanceSystemPrompt
        });
      }
      
      return {
        ...requestData,
        messages,
        governanceContext
      };
      
    } catch (error) {
      console.error('❌ ProviderRegistry: Error injecting governance context:', error);
      // Return original request data if governance injection fails
      return requestData;
    }
  }

  /**
   * Validate provider plugin interface
   */
  validateProviderPlugin(providerPlugin) {
    const requiredMethods = [
      'initialize',
      'generateResponse',
      'getName',
      'getCapabilities',
      'getSupportedModels',
      'healthCheck'
    ];
    
    for (const method of requiredMethods) {
      if (typeof providerPlugin[method] !== 'function') {
        throw new Error(`Provider plugin missing required method: ${method}`);
      }
    }
  }

  /**
   * Circuit breaker management
   */
  isCircuitBreakerClosed(providerId) {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (!circuitBreaker) return true;
    
    const now = Date.now();
    
    switch (circuitBreaker.state) {
      case 'closed':
        return true;
      case 'open':
        if (now >= circuitBreaker.nextAttemptTime) {
          circuitBreaker.state = 'half-open';
          return true;
        }
        return false;
      case 'half-open':
        return true;
      default:
        return true;
    }
  }

  /**
   * Record request success
   */
  recordRequestSuccess(providerId, responseTime) {
    const metrics = this.performanceMetrics.get(providerId);
    if (metrics) {
      metrics.totalRequests++;
      metrics.successfulRequests++;
      metrics.averageResponseTime = 
        (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;
      metrics.lastRequestTime = Date.now();
    }
    
    // Reset circuit breaker on success
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (circuitBreaker) {
      circuitBreaker.failureCount = 0;
      circuitBreaker.state = 'closed';
    }
  }

  /**
   * Record request failure
   */
  recordRequestFailure(providerId) {
    const metrics = this.performanceMetrics.get(providerId);
    if (metrics) {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.lastRequestTime = Date.now();
    }
    
    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(providerId);
    const config = this.providerConfigs.get(providerId);
    
    if (circuitBreaker && config) {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();
      
      if (circuitBreaker.failureCount >= config.circuitBreakerThreshold) {
        circuitBreaker.state = 'open';
        circuitBreaker.nextAttemptTime = Date.now() + config.circuitBreakerTimeout;
        console.log(`⚠️ ProviderRegistry: Circuit breaker opened for provider ${providerId}`);
      }
    }
  }

  /**
   * Audit provider events
   */
  async auditProviderEvent(providerId, eventType, eventData) {
    try {
      const auditEvent = {
        eventType: `provider_${eventType}`,
        providerId,
        ...eventData
      };
      
      // Use existing audit service
      await auditService.logEvent(eventType, 'system', auditEvent);
      
      // Use cryptographic audit service for tamper-evident logging
      if (cryptographicAuditService) {
        const auditEventId = await cryptographicAuditService.logEvent(
          'provider_operation',
          auditEvent,
          'system'
        );
        return auditEventId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ ProviderRegistry: Error auditing provider event:', error);
      return null;
    }
  }

  /**
   * Sanitize configuration for audit logging
   */
  sanitizeConfigForAudit(config) {
    const sanitized = { ...config };
    
    // Remove sensitive information
    delete sanitized.apiKey;
    delete sanitized.secretKey;
    delete sanitized.password;
    delete sanitized.token;
    
    return sanitized;
  }

  /**
   * Health check for all providers
   */
  async performHealthChecks() {
    console.log('🔧 ProviderRegistry: Performing health checks for all providers');
    
    const healthResults = [];
    
    for (const [providerId, provider] of this.providers) {
      try {
        const startTime = Date.now();
        const healthResult = await provider.healthCheck();
        const responseTime = Date.now() - startTime;
        
        const status = {
          providerId,
          status: healthResult.healthy ? 'healthy' : 'unhealthy',
          responseTime,
          details: healthResult.details || {},
          timestamp: new Date().toISOString()
        };
        
        this.healthStatus.set(providerId, {
          status: status.status,
          lastCheck: Date.now(),
          details: status.details
        });
        
        healthResults.push(status);
        
      } catch (error) {
        console.error(`❌ ProviderRegistry: Health check failed for provider ${providerId}:`, error);
        
        const status = {
          providerId,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        this.healthStatus.set(providerId, {
          status: 'error',
          lastCheck: Date.now(),
          error: error.message
        });
        
        healthResults.push(status);
      }
    }
    
    return healthResults;
  }

  /**
   * Get provider statistics
   */
  getProviderStatistics() {
    const statistics = {
      totalProviders: this.providers.size,
      healthyProviders: 0,
      unhealthyProviders: 0,
      totalRequests: 0,
      totalSuccessfulRequests: 0,
      totalFailedRequests: 0,
      averageResponseTime: 0,
      circuitBreakersOpen: 0
    };
    
    let totalResponseTime = 0;
    let providersWithRequests = 0;
    
    for (const [providerId, health] of this.healthStatus) {
      if (health.status === 'healthy') {
        statistics.healthyProviders++;
      } else {
        statistics.unhealthyProviders++;
      }
      
      const metrics = this.performanceMetrics.get(providerId);
      if (metrics) {
        statistics.totalRequests += metrics.totalRequests;
        statistics.totalSuccessfulRequests += metrics.successfulRequests;
        statistics.totalFailedRequests += metrics.failedRequests;
        
        if (metrics.totalRequests > 0) {
          totalResponseTime += metrics.averageResponseTime;
          providersWithRequests++;
        }
      }
      
      const circuitBreaker = this.circuitBreakers.get(providerId);
      if (circuitBreaker && circuitBreaker.state === 'open') {
        statistics.circuitBreakersOpen++;
      }
    }
    
    if (providersWithRequests > 0) {
      statistics.averageResponseTime = totalResponseTime / providersWithRequests;
    }
    
    return statistics;
  }
}

// Export singleton instance
module.exports = new ProviderRegistry();

