/**
 * ProviderRegistry.js
 * /**
 * ProviderRegistry - Central registry for LLM providers
 * Provides provider discovery, registration, and lifecycle management
 * Integrates with existing Promethios governance and audit services
 */

const ProviderPlugin = require('./ProviderPlugin');
const AuditService = require('../auditService');
const CryptographicAuditService = require('../cryptographicAuditService');
const governanceContextService = require('../governanceContextService');

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
    // Add debugging information
    console.log(`🔍 ProviderRegistry: Looking for provider '${providerId}'`);
    console.log(`🔍 ProviderRegistry: Available providers:`, Array.from(this.providers.keys()));
    console.log(`🔍 ProviderRegistry: Total registered providers: ${this.providers.size}`);
    
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.error(`❌ ProviderRegistry: Provider '${providerId}' not found in registry`);
      console.error(`❌ ProviderRegistry: Available providers: [${Array.from(this.providers.keys()).join(', ')}]`);
      throw new Error(`Provider ${providerId} not found`);
    }
    
    console.log(`✅ ProviderRegistry: Found provider '${providerId}'`);
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
    
    // Debug: Log the start of generateResponse
    addDebugLog('info', 'provider', `Starting generateResponse`, {
      providerId,
      agentId,
      userId,
      model: requestData.model,
      messageCount: requestData.messages?.length || 0
    });
    
    try {
      console.log(`🔧 ProviderRegistry: Generating response with provider ${providerId} for agent ${agentId}`);
      
      // Check circuit breaker
      if (!this.isCircuitBreakerClosed(providerId)) {
        addDebugLog('error', 'provider', `Circuit breaker is open for provider`, { providerId });
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
      
      // Load tool schemas if provider supports tools
      let toolSchemas = [];
      if (provider.supportsTools()) {
        try {
          console.log(`🛠️ ProviderRegistry: Loading tool schemas for provider ${providerId}`);
          addDebugLog('debug', 'tool_schema', `Provider supports tools, loading schemas`, { providerId });
          
          toolSchemas = await this.loadToolSchemas();
          
          addDebugLog('info', 'tool_schema', `Tool schemas loaded successfully`, {
            providerId,
            schemaCount: toolSchemas.length,
            toolNames: toolSchemas.map(schema => schema.function?.name || schema.name)
          });
          
          console.log(`🛠️ ProviderRegistry: Loaded ${toolSchemas.length} tool schemas`);
        } catch (error) {
          addDebugLog('error', 'tool_schema', `Failed to load tool schemas`, {
            providerId,
            error: error.message
          });
          console.warn(`⚠️ ProviderRegistry: Failed to load tool schemas:`, error);
          // Continue without tools if loading fails
        }
      } else {
        addDebugLog('warn', 'tool_schema', `Provider does not support tools`, { providerId });
      }
      
      // Inject governance context if enabled
      let enhancedRequestData = requestData;
      if (config.governanceEnabled) {
        enhancedRequestData = await this.injectGovernanceContext(
          requestData, agentId, userId, providerId
        );
      }
      
      // Add tool schemas to request data
      if (toolSchemas.length > 0) {
        const formattedTools = provider.formatToolsForProvider(toolSchemas);
        enhancedRequestData = {
          ...enhancedRequestData,
          tools: formattedTools
        };
        
        // Inject tool instructions into system message
        const toolNames = toolSchemas.map(schema => schema.function?.name || schema.name);
        const toolInstructions = `\n\nTOOL ACCESS:\nYou have ${toolSchemas.length} tool(s) available: ${toolNames.join(', ')}. To use a tool, call it with the appropriate parameters. Always use tools when they can help answer user questions or provide current information.`;
        
        // Add tool instructions to system message
        if (enhancedRequestData.messages && enhancedRequestData.messages[0]?.role === 'system') {
          enhancedRequestData.messages[0].content += toolInstructions;
          console.log(`🛠️ ProviderRegistry: Added tool instructions to system message for ${providerId}`);
        }
        
        addDebugLog('debug', 'tool_schema', `Tools added to request data`, {
          providerId,
          toolCount: formattedTools.length,
          sampleTool: formattedTools[0]?.function?.name || formattedTools[0]?.name
        });
      }
      
      // Debug: Log before calling provider
      addDebugLog('debug', 'provider', `Calling provider generateResponse`, {
        providerId,
        hasTools: toolSchemas.length > 0,
        requestDataKeys: Object.keys(enhancedRequestData)
      });
      
      // Generate response using provider
      const response = await provider.generateResponse(enhancedRequestData);
      
      // Debug: Log provider response
      addDebugLog('info', 'provider', `Provider response received`, {
        providerId,
        hasContent: !!response.content,
        contentLength: response.content?.length || 0,
        responseKeys: Object.keys(response)
      });
      
      // Process tool calls if present
      if (provider.hasToolCalls(response)) {
        addDebugLog('info', 'tool_execution', `Tool calls detected in provider response`, {
          providerId,
          responseType: typeof response
        });
        
        console.log(`🛠️ ProviderRegistry: Processing tool calls from provider ${providerId}`);
        
        // Set up tool execution context
        const toolContext = {
          agentId,
          userId,
          providerId,
          auditEventId
        };
        
        // Override the provider's executeToolCall method to use our registry
        provider.executeToolCall = async (toolCall, context) => {
          return await this.executeToolCall(toolCall, { ...toolContext, ...context });
        };
        
        // Process tool calls
        const toolCalls = provider.extractToolCalls(response);
        
        addDebugLog('debug', 'tool_execution', `Extracted tool calls from response`, {
          providerId,
          toolCallsCount: toolCalls?.length || 0,
          toolNames: toolCalls?.map(call => call.function?.name || call.name) || []
        });
        
        const toolResults = await provider.processToolCalls(toolCalls, toolContext);
        
        addDebugLog('info', 'tool_execution', `Tool calls processed successfully`, {
          providerId,
          toolResultsCount: toolResults?.length || 0,
          successfulCalls: toolResults?.filter(result => !result.content?.includes('error')).length || 0
        });
        
        // Generate follow-up response with tool results
        if (toolResults && toolResults.length > 0) {
          console.log(`🔄 ProviderRegistry: Generating follow-up response with tool results for ${providerId}`);
          
          // Add tool results to conversation
          const updatedMessages = [...enhancedRequestData.messages];
          
          // Provider-specific tool result formatting
          if (providerId === 'anthropic') {
            // Anthropic format: tool results are included in assistant message content
            // For now, let's add tool results as user message with results summary
            const toolResultsSummary = toolResults.map(result => 
              `Tool ${result.name} executed successfully. Result: ${result.content}`
            ).join('\n\n');
            
            updatedMessages.push({
              role: 'user',
              content: `Here are the tool execution results:\n\n${toolResultsSummary}\n\nPlease provide a response based on these results.`
            });
            
            console.log(`🔧 ProviderRegistry: Using Anthropic-specific tool result format`);
          } else {
            // OpenAI format: use assistant message with tool calls + tool role messages
            updatedMessages.push({
              role: 'assistant',
              content: response.content || '',
              tool_calls: toolCalls
            });
            
            // Add tool results as tool messages
            for (const result of toolResults) {
              updatedMessages.push({
                role: 'tool',
                tool_call_id: result.tool_call_id,
                name: result.name,
                content: result.content
              });
            }
            
            console.log(`🔧 ProviderRegistry: Using OpenAI-specific tool result format`);
          }
          
          // Generate follow-up response with tool results
          const followUpRequestData = {
            ...enhancedRequestData,
            messages: updatedMessages
          };
          
          console.log(`🤖 ProviderRegistry: Making follow-up API call to ${providerId} with ${toolResults.length} tool results`);
          
          const followUpResponse = await provider.generateResponse(followUpRequestData);
          
          addDebugLog('info', 'tool_execution', `Follow-up response generated`, {
            providerId,
            hasContent: !!followUpResponse.content,
            contentLength: followUpResponse.content?.length || 0,
            toolResultsIncluded: toolResults.length
          });
          
          console.log(`✅ ProviderRegistry: Follow-up response generated with tool results (${followUpResponse.content?.length || 0} chars)`);
          
          // Return the follow-up response (which should have actual content)
          return {
            ...followUpResponse,
            tool_results: toolResults,
            has_tool_calls: true,
            metadata: {
              providerId,
              responseTime: Date.now() - startTime,
              auditEventId,
              governanceApplied: config.governanceEnabled,
              toolCallsProcessed: toolResults.length
            }
          };
        }
        
        // Add tool results to response (fallback if no follow-up needed)
        response.tool_results = toolResults;
        response.has_tool_calls = true;
      } else {
        addDebugLog('debug', 'tool_execution', `No tool calls detected in response`, {
          providerId,
          hasToolCallsMethod: !!provider.hasToolCalls,
          responseContent: response.content?.substring(0, 100) + '...'
        });
      }
      
      // Record successful request
      this.recordRequestSuccess(providerId, Date.now() - startTime);
      
      // Audit successful response
      await this.auditProviderEvent(providerId, 'request_completed', {
        auditEventId,
        agentId,
        userId,
        responseTime: Date.now() - startTime,
        responseLength: response.content?.length || 0,
        toolsEnabled: toolSchemas.length > 0,
        toolCallsCount: response.tool_calls?.length || 0,
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
      await AuditService.logEvent(eventType, 'system', auditEvent);
      
      // Use cryptographic audit service for tamper-evident logging
      if (CryptographicAuditService && typeof CryptographicAuditService.logEvent === 'function') {
        const auditEventId = await CryptographicAuditService.logEvent(
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

  // ============================================================================
  // TOOL INTEGRATION METHODS
  // ============================================================================

  /**
   * Load tool schemas from the tools API
   * @returns {Array} Array of tool schemas
   */
  async loadToolSchemas() {
    try {
      console.log('🛠️ ProviderRegistry: Loading tool schemas from tools API');
      
      // Use environment variable or default to deployed API URL
      const apiBaseUrl = process.env.API_BASE_URL || 'https://promethios-phase-7-1-api.onrender.com';
      const toolsUrl = `${apiBaseUrl}/api/tools/schemas`;
      
      console.log(`🛠️ ProviderRegistry: Fetching tool schemas from ${toolsUrl}`);
      
      // Make request to tools API to get schemas
      const response = await fetch(toolsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Tools API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.schemas)) {
        throw new Error('Invalid response format from tools API');
      }
      
      console.log(`✅ ProviderRegistry: Loaded ${data.schemas.length} tool schemas`);
      return data.schemas;
      
    } catch (error) {
      console.error('❌ ProviderRegistry: Failed to load tool schemas:', error);
      
      // Return empty array as fallback to prevent breaking the system
      console.log('🛠️ ProviderRegistry: Returning empty tool schemas array as fallback');
      return [];
    }
  }

  /**
   * Execute a tool call with governance and audit integration
   * @param {Object} toolCall - Tool call object
   * @param {Object} context - Execution context
   * @returns {Object} Tool execution result
   */
  async executeToolCall(toolCall, context = {}) {
    try {
      console.log(`🛠️ ProviderRegistry: Executing tool call: ${toolCall.function?.name || toolCall.name}`);
      
      // Extract tool information
      const toolName = toolCall.function?.name || toolCall.name;
      const toolParameters = toolCall.function?.arguments 
        ? (typeof toolCall.function.arguments === 'string' 
           ? JSON.parse(toolCall.function.arguments) 
           : toolCall.function.arguments)
        : toolCall.parameters || {};
      
      // Use environment variable or default to deployed API URL
      const apiBaseUrl = process.env.API_BASE_URL || 'https://promethios-phase-7-1-api.onrender.com';
      const executeUrl = `${apiBaseUrl}/api/tools/execute`;
      
      console.log(`🛠️ ProviderRegistry: Executing tool via ${executeUrl}`);
      
      // Make request to tools API to execute the tool
      const response = await fetch(executeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool_id: toolName,
          parameters: toolParameters,
          user_message: context.userMessage || '',
          governance_context: {
            agentId: context.agentId,
            userId: context.userId,
            providerId: context.providerId,
            auditEventId: context.auditEventId
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Tool execution API responded with status ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed');
      }
      
      console.log(`✅ ProviderRegistry: Tool executed successfully: ${toolName}`);
      
      // Return in the format expected by providers
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolName,
        content: JSON.stringify(result.data)
      };
      
    } catch (error) {
      console.error(`❌ ProviderRegistry: Tool execution failed:`, error);
      
      // Return error result
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function?.name || toolCall.name,
        content: JSON.stringify({
          error: error.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  }
}

// Export the class, not an instance
module.exports = ProviderRegistry;

