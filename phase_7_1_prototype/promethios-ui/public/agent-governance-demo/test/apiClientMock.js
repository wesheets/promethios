/* API Client Mock for Testing
 * Provides mock implementations of API client methods
 * Used for testing the demo without real LLM API keys
 */

class ApiClientMock {
    constructor() {
        this.initialized = false;
        this.providers = {
            openai: { apiKey: 'mock-openai-key' },
            anthropic: { apiKey: 'mock-anthropic-key' },
            huggingface: { apiKey: 'mock-huggingface-key' },
            cohere: { apiKey: 'mock-cohere-key' }
        };
        console.log('API Client Mock created');
    }

    /**
     * Initialize the API client mock
     * @param {Object} config - Configuration object
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(config) {
        this.initialized = true;
        console.log('API Client Mock initialized');
        return true;
    }

    /**
     * Make an ungoverned request to a provider
     * @param {string} provider - Provider ID
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the response
     */
    async makeUngovernedRequest(provider, options) {
        console.log(`Making ungoverned request to ${provider}`, options);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            text: `This is a mock ungoverned response from ${provider} for prompt: "${options.prompt}"`,
            raw: { mock: true },
            usage: {
                prompt_tokens: options.prompt.length,
                completion_tokens: 50,
                total_tokens: options.prompt.length + 50
            },
            model: 'mock-model',
            provider
        };
    }

    /**
     * Make a governed request to a provider
     * @param {string} provider - Provider ID
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the response
     */
    async makeGovernedRequest(provider, options) {
        console.log(`Making governed request to ${provider}`, options);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            text: `This is a mock governed response from ${provider} for prompt: "${options.prompt}"`,
            raw: { mock: true, governed: true },
            usage: {
                prompt_tokens: options.prompt.length + 100, // Extra tokens for governance
                completion_tokens: 50,
                total_tokens: options.prompt.length + 150
            },
            model: 'mock-model',
            provider,
            governance: {
                interventions: [
                    {
                        type: 'role-enforcement',
                        description: 'Added role enforcement instructions to system prompt',
                        severity: 'medium'
                    }
                ]
            }
        };
    }

    /**
     * Set API key for a provider
     * @param {string} provider - Provider ID
     * @param {string} apiKey - API key
     */
    setApiKey(provider, apiKey) {
        if (this.providers[provider]) {
            this.providers[provider].apiKey = apiKey;
            console.log(`API key set for ${provider}`);
            return true;
        }
        return false;
    }

    /**
     * Get provider information
     * @param {string} provider - Provider ID
     * @returns {Object} - Provider information
     */
    getProviderInfo(provider) {
        return this.providers[provider] || null;
    }

    /**
     * Get all provider information
     * @returns {Object} - All provider information
     */
    getAllProviderInfo() {
        return this.providers;
    }
}

// Export the mock client
export default new ApiClientMock();
