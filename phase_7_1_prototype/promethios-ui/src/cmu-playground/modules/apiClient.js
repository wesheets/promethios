/**
 * API Client Module
 * Handles integration with various LLM providers
 */

class APIClient {
  constructor() {
    this.config = {
      defaultProvider: 'openai',
      fallbackOrder: ['anthropic', 'cohere', 'huggingface'],
      models: {
        openai: {
          default: 'gpt-4',
          alternatives: ['gpt-4-turbo', 'gpt-3.5-turbo']
        },
        anthropic: {
          default: 'claude-3-opus',
          alternatives: ['claude-3-sonnet', 'claude-3-haiku']
        },
        cohere: {
          default: 'command-r-plus',
          alternatives: ['command-r', 'command-light']
        },
        huggingface: {
          default: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          alternatives: ['meta-llama/Llama-2-70b-chat-hf', 'tiiuae/falcon-40b-instruct']
        }
      },
      apiKeys: {
        openai: import.meta.env.OPENAI_API_KEY || '',
        anthropic: import.meta.env.ANTHROPIC_API_KEY || '',
        cohere: import.meta.env.COHERE_API_KEY || '',
        huggingface: import.meta.env.HUGGINGFACE_API_KEY || ''
      }
    };
    
    // Initialize API clients
    this.clients = {};
    this.initializeClients();
  }
  
  /**
   * Initialize API clients for each provider
   */
  initializeClients() {
    // This would be replaced with actual API client initialization
    // For now, we'll just log the initialization
    console.log('Initializing API clients for LLM providers');
    
    // In a real implementation, this would initialize the actual clients
    // Example:
    // if (this.config.apiKeys.openai) {
    //   const { OpenAI } = require('openai');
    //   this.clients.openai = new OpenAI({ apiKey: this.config.apiKeys.openai });
    // }
    
    // For demonstration purposes, we'll create mock clients
    if (this.config.apiKeys.openai) {
      this.clients.openai = {
        name: 'OpenAI',
        isAvailable: true,
        completions: {
          create: this.mockCompletionCreate.bind(this, 'openai')
        }
      };
    }
    
    if (this.config.apiKeys.anthropic) {
      this.clients.anthropic = {
        name: 'Anthropic',
        isAvailable: true,
        completions: {
          create: this.mockCompletionCreate.bind(this, 'anthropic')
        }
      };
    }
    
    if (this.config.apiKeys.cohere) {
      this.clients.cohere = {
        name: 'Cohere',
        isAvailable: true,
        completions: {
          create: this.mockCompletionCreate.bind(this, 'cohere')
        }
      };
    }
    
    if (this.config.apiKeys.huggingface) {
      this.clients.huggingface = {
        name: 'Hugging Face',
        isAvailable: true,
        completions: {
          create: this.mockCompletionCreate.bind(this, 'huggingface')
        }
      };
    }
  }
  
  /**
   * Mock completion creation for demonstration
   * @param {string} provider - The LLM provider
   * @param {Object} params - The completion parameters
   * @returns {Promise<Object>} - The completion response
   */
  async mockCompletionCreate(provider, params) {
    console.log(`Creating completion with ${provider}:`, params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock response
    return {
      provider,
      model: params.model || this.config.models[provider].default,
      choices: [
        {
          message: {
            content: `This is a mock response from ${provider} using ${params.model || this.config.models[provider].default}`
          }
        }
      ]
    };
  }
  
  /**
   * Get the best available client based on configuration and availability
   * @returns {Object|null} - The best available client or null if none available
   */
  getBestAvailableClient() {
    // Try default provider first
    if (this.clients[this.config.defaultProvider]?.isAvailable) {
      return {
        client: this.clients[this.config.defaultProvider],
        provider: this.config.defaultProvider
      };
    }
    
    // Try fallbacks in order
    for (const provider of this.config.fallbackOrder) {
      if (this.clients[provider]?.isAvailable) {
        return {
          client: this.clients[provider],
          provider
        };
      }
    }
    
    // No available clients
    return null;
  }
  
  /**
   * Create a completion with the best available client
   * @param {Object} params - The completion parameters
   * @returns {Promise<Object>} - The completion response
   */
  async createCompletion(params) {
    const { client, provider } = this.getBestAvailableClient() || {};
    
    if (!client) {
      throw new Error('No available LLM providers');
    }
    
    try {
      // Set default model if not specified
      if (!params.model) {
        params.model = this.config.models[provider].default;
      }
      
      // Create completion
      const response = await client.completions.create(params);
      
      return {
        provider,
        model: params.model,
        content: response.choices[0].message.content,
        raw: response
      };
    } catch (error) {
      console.error(`Error creating completion with ${provider}:`, error);
      
      // Try fallback if available
      const fallbackIndex = this.config.fallbackOrder.indexOf(provider);
      if (fallbackIndex >= 0 && fallbackIndex < this.config.fallbackOrder.length - 1) {
        const fallbackProvider = this.config.fallbackOrder[fallbackIndex + 1];
        if (this.clients[fallbackProvider]?.isAvailable) {
          console.log(`Falling back to ${fallbackProvider}`);
          
          // Update default provider temporarily
          const originalDefault = this.config.defaultProvider;
          this.config.defaultProvider = fallbackProvider;
          
          // Try again with fallback
          const result = await this.createCompletion(params);
          
          // Restore original default
          this.config.defaultProvider = originalDefault;
          
          return result;
        }
      }
      
      // No fallback available
      throw error;
    }
  }
  
  /**
   * Create a completion specifically for the Promethios Observer
   * @param {Object} params - The completion parameters
   * @returns {Promise<Object>} - The completion response
   */
  async createObserverCompletion(params) {
    // Add Observer-specific system prompt
    const observerSystemPrompt = `
      You are the Promethios Observer, responsible for monitoring and analyzing agent interactions.
      Focus specifically on governance as implemented in Promethios, not general Promethios architecture.
      Your task is to detect and prevent:
      1. Hallucinations and factual inaccuracies
      2. Role boundary violations
      3. Safety concerns
      4. Coordination failures
      
      Provide clear, concise analysis of agent interactions and explain any governance interventions.
    `;
    
    // Merge with existing system prompt if any
    if (params.messages && params.messages.length > 0 && params.messages[0].role === 'system') {
      params.messages[0].content = `${observerSystemPrompt}\n\n${params.messages[0].content}`;
    } else {
      params.messages = [
        { role: 'system', content: observerSystemPrompt },
        ...(params.messages || [])
      ];
    }
    
    // Create completion with observer-specific parameters
    return this.createCompletion(params);
  }
  
  /**
   * Check if a provider is available
   * @param {string} provider - The provider to check
   * @returns {boolean} - Whether the provider is available
   */
  isProviderAvailable(provider) {
    return this.clients[provider]?.isAvailable || false;
  }
  
  /**
   * Get available providers
   * @returns {string[]} - List of available provider names
   */
  getAvailableProviders() {
    return Object.keys(this.clients).filter(provider => this.clients[provider].isAvailable);
  }
  
  /**
   * Set API key for a provider
   * @param {string} provider - The provider to set the key for
   * @param {string} apiKey - The API key
   */
  setApiKey(provider, apiKey) {
    if (this.config.apiKeys.hasOwnProperty(provider)) {
      this.config.apiKeys[provider] = apiKey;
      
      // Reinitialize clients
      this.initializeClients();
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }
  
  /**
   * Set default provider
   * @param {string} provider - The provider to set as default
   */
  setDefaultProvider(provider) {
    if (this.clients[provider]?.isAvailable) {
      this.config.defaultProvider = provider;
    } else {
      throw new Error(`Provider not available: ${provider}`);
    }
  }
}

// Export the API client
export default new APIClient();
