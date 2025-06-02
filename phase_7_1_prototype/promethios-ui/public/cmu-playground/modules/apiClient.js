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
        openai: this.getEnvironmentVariable('OPENAI_API_KEY'),
        anthropic: this.getEnvironmentVariable('ANTHROPIC_API_KEY'),
        cohere: this.getEnvironmentVariable('COHERE_API_KEY'),
        huggingface: this.getEnvironmentVariable('HUGGINGFACE_API_KEY')
      }
    };
    
    // Initialize API clients
    this.clients = {};
    this.initializeClients();
  }
  
  /**
   * Get environment variable safely
   * @param {string} name - Environment variable name
   * @returns {string} - Environment variable value or empty string
   */
  getEnvironmentVariable(name) {
    try {
      // Try to access from process.env (Node.js)
      if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
      }
      
      // Try to access from window.ENV (browser)
      if (typeof window !== 'undefined' && window.ENV && window.ENV[name]) {
        return window.ENV[name];
      }
      
      // Try to access from document meta tags (fallback for browser)
      if (typeof document !== 'undefined') {
        const meta = document.querySelector(`meta[name="env:${name}"]`);
        if (meta && meta.content) {
          return meta.content;
        }
      }
      
      console.warn(`Environment variable ${name} not found`);
      return '';
    } catch (error) {
      console.error(`Error accessing environment variable ${name}:`, error);
      return '';
    }
  }
  
  /**
   * Initialize API clients for each provider
   */
  initializeClients() {
    console.log('Initializing real API clients for LLM providers');
    
    // Initialize OpenAI client
    if (this.config.apiKeys.openai) {
      try {
        this.clients.openai = {
          name: 'OpenAI',
          isAvailable: true,
          completions: {
            create: this.createOpenAICompletion.bind(this)
          }
        };
        console.log('OpenAI client initialized');
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
      }
    }
    
    // Initialize Anthropic client
    if (this.config.apiKeys.anthropic) {
      try {
        this.clients.anthropic = {
          name: 'Anthropic',
          isAvailable: true,
          completions: {
            create: this.createAnthropicCompletion.bind(this)
          }
        };
        console.log('Anthropic client initialized');
      } catch (error) {
        console.error('Failed to initialize Anthropic client:', error);
      }
    }
    
    // Initialize Cohere client
    if (this.config.apiKeys.cohere) {
      try {
        this.clients.cohere = {
          name: 'Cohere',
          isAvailable: true,
          completions: {
            create: this.createCohereCompletion.bind(this)
          }
        };
        console.log('Cohere client initialized');
      } catch (error) {
        console.error('Failed to initialize Cohere client:', error);
      }
    }
    
    // Initialize Hugging Face client
    if (this.config.apiKeys.huggingface) {
      try {
        this.clients.huggingface = {
          name: 'Hugging Face',
          isAvailable: true,
          completions: {
            create: this.createHuggingFaceCompletion.bind(this)
          }
        };
        console.log('Hugging Face client initialized');
      } catch (error) {
        console.error('Failed to initialize Hugging Face client:', error);
      }
    }
    
    // Log available providers
    const availableProviders = this.getAvailableProviders();
    console.log('Available providers:', availableProviders);
    if (availableProviders.length === 0) {
      console.warn('No API providers available. Check API keys in environment variables.');
    }
  }
  
  /**
   * Create completion with OpenAI
   * @param {Object} params - Completion parameters
   * @returns {Promise<Object>} - Completion response
   */
  async createOpenAICompletion(params) {
    console.log('Creating real OpenAI completion:', params);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKeys.openai}`
        },
        body: JSON.stringify({
          model: params.model || this.config.models.openai.default,
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 1000
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
  
  /**
   * Create completion with Anthropic
   * @param {Object} params - Completion parameters
   * @returns {Promise<Object>} - Completion response
   */
  async createAnthropicCompletion(params) {
    console.log('Creating real Anthropic completion:', params);
    
    try {
      // Convert messages to Anthropic format
      const messages = params.messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content
      }));
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKeys.anthropic,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: params.model || this.config.models.anthropic.default,
          messages: messages,
          max_tokens: params.max_tokens || 1000
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert to OpenAI-like format for consistency
      return {
        choices: [
          {
            message: {
              content: data.content[0].text
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw error;
    }
  }
  
  /**
   * Create completion with Cohere
   * @param {Object} params - Completion parameters
   * @returns {Promise<Object>} - Completion response
   */
  async createCohereCompletion(params) {
    console.log('Creating real Cohere completion:', params);
    
    try {
      // Convert messages to Cohere format
      let prompt = '';
      params.messages.forEach(msg => {
        if (msg.role === 'system') {
          prompt += `System: ${msg.content}\n\n`;
        } else if (msg.role === 'user') {
          prompt += `User: ${msg.content}\n\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${msg.content}\n\n`;
        }
      });
      
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKeys.cohere}`
        },
        body: JSON.stringify({
          model: params.model || this.config.models.cohere.default,
          prompt: prompt,
          max_tokens: params.max_tokens || 1000,
          temperature: params.temperature || 0.7
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cohere API error: ${error.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert to OpenAI-like format for consistency
      return {
        choices: [
          {
            message: {
              content: data.generations[0].text
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error calling Cohere API:', error);
      throw error;
    }
  }
  
  /**
   * Create completion with Hugging Face
   * @param {Object} params - Completion parameters
   * @returns {Promise<Object>} - Completion response
   */
  async createHuggingFaceCompletion(params) {
    console.log('Creating real Hugging Face completion:', params);
    
    try {
      // Convert messages to Hugging Face format
      let prompt = '';
      params.messages.forEach(msg => {
        if (msg.role === 'system') {
          prompt += `<|system|>\n${msg.content}\n`;
        } else if (msg.role === 'user') {
          prompt += `<|user|>\n${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          prompt += `<|assistant|>\n${msg.content}\n`;
        }
      });
      prompt += `<|assistant|>\n`;
      
      const response = await fetch(`https://api-inference.huggingface.co/models/${params.model || this.config.models.huggingface.default}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKeys.huggingface}`
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: params.max_tokens || 1000,
            temperature: params.temperature || 0.7
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Hugging Face API error: ${error.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert to OpenAI-like format for consistency
      return {
        choices: [
          {
            message: {
              content: data[0].generated_text.replace(prompt, '')
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error calling Hugging Face API:', error);
      throw error;
    }
  }
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
      throw new Error('No available LLM providers. Check API keys in environment variables.');
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
   * Create a completion specifically for the Promethios Observer with VERITAS integration
   * @param {Object} params - The completion parameters
   * @returns {Promise<Object>} - The completion response
   */
  async createObserverCompletion(params) {
    // Add Observer-specific system prompt with VERITAS focus
    const observerSystemPrompt = `
      You are the Promethios Observer with VERITAS (Verification, Evaluation, and Reasoning for Information Truth Assessment System) integration.
      
      Your primary responsibility is to monitor and analyze agent interactions with a focus on:
      1. Detecting and preventing hallucinations and factual inaccuracies
      2. Enforcing role boundaries and preventing violations
      3. Identifying and blocking safety concerns
      4. Ensuring proper coordination between agents
      
      VERITAS Guidelines:
      - Verify all factual claims against known information
      - Flag any unverifiable claims or statements presented as facts
      - Prevent references to non-existent court cases, laws, or statistics
      - Require evidence for any specific numerical claims
      - Maintain strict adherence to factual accuracy
      
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
   * Initialize the API client (for consistency with other modules)
   */
  init() {
    console.log('Initializing real API clients for LLM providers');
    this.initializeClients();
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