/**
 * Simple API Client for CMU Playground
 * Based on the working implementation from GovernedVsUngoverned.tsx
 * Uses direct API calls instead of complex provider system
 */

/**
 * Get API key for a specific provider
 */
function getApiKey(provider) {
  const keyMap = {
    'openai': import.meta.env.VITE_OPENAI_API_KEY,
    'anthropic': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'cohere': import.meta.env.VITE_COHERE_API_KEY,
    'huggingface': import.meta.env.VITE_HUGGINGFACE_API_KEY
  };
  
  return keyMap[provider];
}

/**
 * Get available providers (those with API keys)
 */
function getAvailableProviders() {
  const providers = [];
  
  if (import.meta.env.VITE_OPENAI_API_KEY) providers.push('openai');
  if (import.meta.env.VITE_ANTHROPIC_API_KEY) providers.push('anthropic');
  if (import.meta.env.VITE_COHERE_API_KEY) providers.push('cohere');
  if (import.meta.env.VITE_HUGGINGFACE_API_KEY) providers.push('huggingface');
  
  return providers;
}

/**
 * Create completion using OpenAI API
 */
async function createOpenAICompletion(messages, options = {}) {
  const apiKey = getApiKey('openai');
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: options.model || 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: options.max_tokens || 150,
      temperature: options.temperature || 0.7
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model: data.model
  };
}

/**
 * Create completion using Anthropic API
 */
async function createAnthropicCompletion(messages, options = {}) {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) {
    throw new Error('Anthropic API key not found');
  }
  
  // Convert messages to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: options.model || 'claude-3-haiku-20240307',
      max_tokens: options.max_tokens || 150,
      system: systemMessage?.content || '',
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    content: data.content[0].text,
    provider: 'anthropic',
    model: data.model
  };
}

/**
 * Create completion using Cohere API
 */
async function createCohereCompletion(messages, options = {}) {
  const apiKey = getApiKey('cohere');
  if (!apiKey) {
    throw new Error('Cohere API key not found');
  }
  
  // Convert messages to a single prompt for Cohere
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
  
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: options.model || 'command',
      prompt: prompt,
      max_tokens: options.max_tokens || 150,
      temperature: options.temperature || 0.7
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cohere API error: ${errorData.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    content: data.generations[0].text.trim(),
    provider: 'cohere',
    model: data.meta?.api_version?.version || 'command'
  };
}

/**
 * Create completion using HuggingFace API
 */
async function createHuggingFaceCompletion(messages, options = {}) {
  const apiKey = getApiKey('huggingface');
  if (!apiKey) {
    throw new Error('HuggingFace API key not found');
  }
  
  // Convert messages to a single prompt
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n') + '\nassistant:';
  
  const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: options.max_tokens || 150,
        temperature: options.temperature || 0.7
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HuggingFace API error: ${errorData.error || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    content: data[0]?.generated_text?.replace(prompt, '').trim() || 'No response generated',
    provider: 'huggingface',
    model: 'microsoft/DialoGPT-large'
  };
}

/**
 * Simple API Client class that mimics the interface expected by agentConversation.js
 */
class SimpleAPIClient {
  constructor() {
    this.availableProviders = getAvailableProviders();
    console.log('Simple API Client initialized');
    console.log('Available providers:', this.availableProviders);
  }
  
  /**
   * Create completion using the first available provider
   */
  async createCompletion(options) {
    const { messages, max_tokens, temperature, model } = options;
    
    if (this.availableProviders.length === 0) {
      throw new Error('No API providers available. Check API keys in environment variables.');
    }
    
    // Try providers in order of preference
    const providerOrder = ['openai', 'anthropic', 'cohere', 'huggingface'];
    
    for (const provider of providerOrder) {
      if (this.availableProviders.includes(provider)) {
        try {
          console.log(`Attempting to use ${provider} provider`);
          
          switch (provider) {
            case 'openai':
              return await createOpenAICompletion(messages, { max_tokens, temperature, model });
            case 'anthropic':
              return await createAnthropicCompletion(messages, { max_tokens, temperature, model });
            case 'cohere':
              return await createCohereCompletion(messages, { max_tokens, temperature, model });
            case 'huggingface':
              return await createHuggingFaceCompletion(messages, { max_tokens, temperature, model });
          }
        } catch (error) {
          console.warn(`${provider} provider failed:`, error.message);
          // Continue to next provider
        }
      }
    }
    
    throw new Error('All API providers failed');
  }
  
  /**
   * Initialize method for compatibility
   */
  init() {
    console.log('Simple API Client initialized with providers:', this.availableProviders);
  }
  
  /**
   * Get configuration for compatibility
   */
  getConfig() {
    return {
      apiKeys: {
        openai: !!getApiKey('openai'),
        anthropic: !!getApiKey('anthropic'),
        cohere: !!getApiKey('cohere'),
        huggingface: !!getApiKey('huggingface')
      },
      availableProviders: this.availableProviders
    };
  }
}

// Export as default for compatibility with existing code
export default new SimpleAPIClient();

