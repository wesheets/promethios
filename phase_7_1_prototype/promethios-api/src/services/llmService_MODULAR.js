/**
 * Modular LLM Service
 * 
 * Enterprise-grade LLM service that uses the modular provider architecture.
 * Provides bulletproof reliability, governance integration, and comprehensive monitoring.
 */

const ProviderRegistry = require('./providers/ProviderRegistry');
const OpenAIProvider = require('./providers/OpenAIProvider');
const AnthropicProvider = require('./providers/AnthropicProvider');
const CohereProvider = require('./providers/CohereProvider');
const GeminiProvider = require('./providers/GeminiProvider');

class ModularLLMService {
  constructor() {
    this.registry = new ProviderRegistry();
    this.isInitialized = false;
  }

  /**
   * Initialize the modular LLM service with all providers
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Modular LLM Service...');

      // Register all provider plugins
      await this.registry.registerProvider(new OpenAIProvider());
      await this.registry.registerProvider(new AnthropicProvider());
      await this.registry.registerProvider(new CohereProvider());
      await this.registry.registerProvider(new GeminiProvider());

      // Initialize providers with their configurations
      await this.initializeProviders();

      this.isInitialized = true;
      console.log('✅ Modular LLM Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Modular LLM Service:', error.message);
      throw error;
    }
  }

  /**
   * Initialize all registered providers with their configurations
   */
  async initializeProviders() {
    const providers = [
      {
        name: 'openai',
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-3.5-turbo',
          timeout: 30000
        }
      },
      {
        name: 'anthropic',
        config: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-3-sonnet-20240229',
          timeout: 30000
        }
      },
      {
        name: 'cohere',
        config: {
          apiKey: process.env.COHERE_API_KEY,
          model: 'command-r-plus',
          timeout: 30000
        }
      },
      {
        name: 'gemini',
        config: {
          apiKey: process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-pro',
          timeout: 30000
        }
      }
    ];

    for (const providerConfig of providers) {
      try {
        if (providerConfig.config.apiKey) {
          await this.registry.initializeProvider(providerConfig.name, providerConfig.config);
          console.log(`✅ ${providerConfig.name} provider initialized`);
        } else {
          console.warn(`⚠️ ${providerConfig.name} API key not found, skipping initialization`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${providerConfig.name} provider:`, error.message);
      }
    }
  }

  /**
   * Main generateResponse method - the primary interface for LLM interactions
   * This maintains backward compatibility with the existing LLM service
   */
  async generateResponse(prompt, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Determine which provider to use
      const providerName = this.determineProvider(options);
      
      // Get governance context if agent information is provided
      let governanceContext = null;
      if (options.agentId) {
        governanceContext = await this.getGovernanceContext(options.agentId, options);
      }

      // Prepare enhanced options with governance context
      const enhancedOptions = {
        ...options,
        governanceContext
      };

      console.log(`🎯 Routing request to ${providerName} provider`);

      // Generate response using the modular provider
      const result = await this.registry.generateResponse(providerName, prompt, enhancedOptions);

      // Update agent metrics if agent ID is provided
      if (options.agentId && result.success) {
        await this.updateAgentMetrics(options.agentId, result.metadata);
      }

      return result;

    } catch (error) {
      console.error('❌ LLM Service error:', error.message);
      
      // Try fallback provider if primary fails
      if (options.allowFallback !== false) {
        return await this.tryFallbackProvider(prompt, options, error);
      }
      
      throw error;
    }
  }

  /**
   * Determine which provider to use based on options and agent configuration
   */
  determineProvider(options) {
    // If provider is explicitly specified, use it
    if (options.provider) {
      return options.provider;
    }

    // If agent has a preferred provider, use it
    if (options.agentProvider) {
      return options.agentProvider;
    }

    // Default fallback logic
    const healthyProviders = this.registry.getHealthyProviders();
    
    if (healthyProviders.includes('openai')) {
      return 'openai';
    } else if (healthyProviders.includes('anthropic')) {
      return 'anthropic';
    } else if (healthyProviders.includes('gemini')) {
      return 'gemini';
    } else if (healthyProviders.includes('cohere')) {
      return 'cohere';
    }

    throw new Error('No healthy LLM providers available');
  }

  /**
   * Get governance context for an agent
   */
  async getGovernanceContext(agentId, options) {
    try {
      // This would integrate with the existing governance services
      // For now, return a basic governance context structure
      return {
        agentId,
        auditLogAccess: options.auditLogAccess || false,
        policies: options.policies || [],
        trustScore: options.trustScore || null,
        complianceRate: options.complianceRate || null
      };
    } catch (error) {
      console.warn('⚠️ Failed to get governance context:', error.message);
      return null;
    }
  }

  /**
   * Update agent metrics after successful interaction
   */
  async updateAgentMetrics(agentId, metadata) {
    try {
      // This would integrate with the existing metrics system
      // For now, just log the metrics update
      console.log(`📊 Updating metrics for agent ${agentId}:`, {
        provider: metadata.provider,
        responseTime: metadata.responseTime,
        tokensUsed: metadata.tokensUsed,
        success: true
      });
    } catch (error) {
      console.warn('⚠️ Failed to update agent metrics:', error.message);
    }
  }

  /**
   * Try fallback provider if primary provider fails
   */
  async tryFallbackProvider(prompt, options, originalError) {
    try {
      console.log('🔄 Attempting fallback provider...');
      
      const healthyProviders = this.registry.getHealthyProviders();
      const originalProvider = this.determineProvider(options);
      
      // Find a different healthy provider
      const fallbackProvider = healthyProviders.find(p => p !== originalProvider);
      
      if (!fallbackProvider) {
        throw new Error(`No fallback provider available. Original error: ${originalError.message}`);
      }

      console.log(`🔄 Using fallback provider: ${fallbackProvider}`);
      
      // Try with fallback provider
      const fallbackOptions = {
        ...options,
        provider: fallbackProvider,
        allowFallback: false // Prevent infinite recursion
      };

      return await this.generateResponse(prompt, fallbackOptions);
      
    } catch (fallbackError) {
      console.error('❌ Fallback provider also failed:', fallbackError.message);
      throw new Error(`Primary provider failed: ${originalError.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }

  /**
   * Get provider health status
   */
  async getProviderHealth() {
    return await this.registry.getProviderHealth();
  }

  /**
   * Get provider metrics
   */
  async getProviderMetrics() {
    return await this.registry.getProviderMetrics();
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return this.registry.getAvailableProviders();
  }

  /**
   * Get supported models for a provider
   */
  getSupportedModels(providerName) {
    return this.registry.getSupportedModels(providerName);
  }

  /**
   * Legacy compatibility methods
   * These maintain backward compatibility with the existing LLM service interface
   */

  async callOpenAI(prompt, options = {}) {
    return await this.generateResponse(prompt, { ...options, provider: 'openai' });
  }

  async callAnthropic(prompt, options = {}) {
    return await this.generateResponse(prompt, { ...options, provider: 'anthropic' });
  }

  async callCohere(prompt, options = {}) {
    return await this.generateResponse(prompt, { ...options, provider: 'cohere' });
  }

  async callGemini(prompt, options = {}) {
    return await this.generateResponse(prompt, { ...options, provider: 'gemini' });
  }

  /**
   * Health check for the entire service
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return { healthy: false, error: 'Service not initialized' };
      }

      const providerHealth = await this.getProviderHealth();
      const healthyCount = Object.values(providerHealth).filter(h => h.healthy).length;
      const totalCount = Object.keys(providerHealth).length;

      return {
        healthy: healthyCount > 0,
        providers: providerHealth,
        summary: `${healthyCount}/${totalCount} providers healthy`
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const modularLLMService = new ModularLLMService();

module.exports = modularLLMService;

