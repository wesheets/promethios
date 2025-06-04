/* API Client
 * Handles communication with LLM provider APIs
 * Provides a unified interface for all API calls
 */

class ApiClient {
    constructor() {
        this.providers = {};
        this.defaultProvider = null;
        this.initialized = false;
        console.log('API Client initialized');
    }

    /**
     * Initialize the API client with configuration
     * @param {Object} config - Configuration object
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(config) {
        if (this.initialized) {
            console.warn('API Client already initialized');
            return;
        }

        try {
            // Load API keys from environment or config
            this.apiKeys = {
                openai: config.get('api.keys.openai', ''),
                anthropic: config.get('api.keys.anthropic', ''),
                huggingface: config.get('api.keys.huggingface', ''),
                cohere: config.get('api.keys.cohere', '')
            };

            // Set base configuration
            this.baseUrl = config.get('api.baseUrl', '');
            this.timeout = config.get('api.timeout', 30000);
            this.retries = config.get('api.retries', 2);
            
            // Register available providers
            await this.registerProviders();
            
            this.initialized = true;
            console.log('API Client fully initialized');
        } catch (error) {
            console.error('Error initializing API Client:', error);
            throw error;
        }
    }

    /**
     * Register available API providers
     * @returns {Promise} - Resolves when all providers are registered
     */
    async registerProviders() {
        // Import and register providers
        try {
            // Check which providers are enabled in config
            const enabledProviders = [];
            
            if (configManager.get('providers.openai.enabled', true)) {
                const OpenAIProvider = await import('../api/providers/openai.js');
                this.registerProvider('openai', new OpenAIProvider.default(this.apiKeys.openai));
                enabledProviders.push('openai');
            }
            
            if (configManager.get('providers.anthropic.enabled', true)) {
                const AnthropicProvider = await import('../api/providers/anthropic.js');
                this.registerProvider('anthropic', new AnthropicProvider.default(this.apiKeys.anthropic));
                enabledProviders.push('anthropic');
            }
            
            if (configManager.get('providers.huggingface.enabled', true)) {
                const HuggingFaceProvider = await import('../api/providers/huggingface.js');
                this.registerProvider('huggingface', new HuggingFaceProvider.default(this.apiKeys.huggingface));
                enabledProviders.push('huggingface');
            }
            
            if (configManager.get('providers.cohere.enabled', true)) {
                const CohereProvider = await import('../api/providers/cohere.js');
                this.registerProvider('cohere', new CohereProvider.default(this.apiKeys.cohere));
                enabledProviders.push('cohere');
            }
            
            // Set default provider to first enabled provider
            if (enabledProviders.length > 0) {
                this.defaultProvider = enabledProviders[0];
                console.log(`Default provider set to: ${this.defaultProvider}`);
            } else {
                console.warn('No API providers enabled');
            }
        } catch (error) {
            console.error('Error registering providers:', error);
            throw error;
        }
    }

    /**
     * Register a provider with the API client
     * @param {string} id - Provider identifier
     * @param {Object} provider - Provider instance
     */
    registerProvider(id, provider) {
        this.providers[id] = provider;
        console.log(`Registered provider: ${id}`);
    }

    /**
     * Get a provider by ID
     * @param {string} id - Provider identifier
     * @returns {Object|null} - Provider instance or null if not found
     */
    getProvider(id) {
        return this.providers[id] || null;
    }

    /**
     * Get all registered providers
     * @returns {Object} - Object containing all providers
     */
    getAllProviders() {
        return { ...this.providers };
    }

    /**
     * Check if a provider is available
     * @param {string} id - Provider identifier
     * @returns {boolean} - True if provider is available
     */
    hasProvider(id) {
        return !!this.providers[id];
    }

    /**
     * Make a request to an LLM provider
     * @param {string} providerId - Provider identifier
     * @param {Object} options - Request options
     * @param {boolean} applyGovernance - Whether to apply governance
     * @returns {Promise} - Resolves with the response
     */
    async makeRequest(providerId, options, applyGovernance = false) {
        // Validate provider
        const provider = this.getProvider(providerId || this.defaultProvider);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId || this.defaultProvider}`);
        }

        // Track request start time for metrics
        const startTime = Date.now();
        
        try {
            // Apply governance if needed
            let governedOptions = options;
            if (applyGovernance) {
                // Get governance plugins from registry
                const governancePlugins = pluginRegistry.getPluginsByType('governance');
                
                // Apply each governance plugin in sequence
                for (const id in governancePlugins) {
                    const plugin = governancePlugins[id];
                    if (plugin && typeof plugin.applyGovernance === 'function') {
                        governedOptions = await plugin.applyGovernance(governedOptions, {
                            provider: providerId,
                            originalOptions: options
                        });
                    }
                }
            }
            
            // Make the actual request
            let response = null;
            let attempt = 0;
            
            while (attempt <= this.retries) {
                try {
                    response = await provider.makeRequest(governedOptions);
                    break;
                } catch (error) {
                    attempt++;
                    if (attempt > this.retries) {
                        throw error;
                    }
                    console.warn(`Retrying request to ${providerId} (attempt ${attempt}/${this.retries})`);
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
                }
            }
            
            // Calculate request duration
            const duration = Date.now() - startTime;
            
            // Publish metrics event
            eventBus.publish('api.request.complete', {
                provider: providerId,
                duration,
                success: true,
                governance: applyGovernance
            });
            
            return response;
        } catch (error) {
            // Calculate request duration
            const duration = Date.now() - startTime;
            
            // Publish error event
            eventBus.publish('api.request.error', {
                provider: providerId,
                duration,
                error: error.message,
                governance: applyGovernance
            });
            
            throw error;
        }
    }

    /**
     * Make a request with governance applied
     * @param {string} providerId - Provider identifier
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the governed response
     */
    async makeGovernedRequest(providerId, options) {
        return this.makeRequest(providerId, options, true);
    }

    /**
     * Make a request without governance
     * @param {string} providerId - Provider identifier
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the ungoverned response
     */
    async makeUngovernedRequest(providerId, options) {
        return this.makeRequest(providerId, options, false);
    }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;
