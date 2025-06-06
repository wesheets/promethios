/**
 * Robust API Client for CMU Playground
 * Handles environment variables gracefully with multiple fallback strategies
 * Works with or without Vite build process
 */

/**
 * Safely get environment variable with multiple fallback strategies
 */
async function getEnvironmentVariable(name) {
  try {
    // Strategy 1: Runtime environment loader (primary method for Render)
    if (window.runtimeEnvLoader && window.runtimeEnvLoader.isLoaded()) {
      const value = window.runtimeEnvLoader.getEnvironmentVariable(name);
      if (value) {
        console.log(`✅ Found ${name} via runtime loader`);
        return value;
      }
    }
    
    // Strategy 2: Load environment variables if not already loaded
    if (window.runtimeEnvLoader && !window.runtimeEnvLoader.isLoaded()) {
      console.log(`🔄 Loading environment variables for ${name}...`);
      await window.runtimeEnvLoader.loadEnvironmentVariables();
      const value = window.runtimeEnvLoader.getEnvironmentVariable(name);
      if (value) {
        console.log(`✅ Found ${name} via runtime loader after loading`);
        return value;
      }
    }
    
    // Strategy 3: Vite environment variables (build-time fallback)
    if (import.meta && import.meta.env && import.meta.env[name]) {
      console.log(`✅ Found ${name} via import.meta.env`);
      return import.meta.env[name];
    }
    
    // Strategy 4: Window-based environment variables (legacy fallback)
    if (typeof window !== 'undefined' && window.ENV && window.ENV[name]) {
      console.log(`✅ Found ${name} via window.ENV`);
      return window.ENV[name];
    }
    
    // Strategy 5: Process environment (Node.js context)
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      console.log(`✅ Found ${name} via process.env`);
      return process.env[name];
    }
    
    // Strategy 4: Check for manually set global variables
    if (typeof window !== 'undefined' && window[name]) {
      console.log(`✅ Found ${name} via window.${name}`);
      return window[name];
    }
    
    console.warn(`⚠️ Environment variable ${name} not found in any location`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error accessing environment variable ${name}:`, error);
    return null;
  }
}

/**
 * Get API key for a specific provider with fallback handling
 */
async function getApiKey(provider) {
  // Support both VITE_ and VTF_ prefixes
  const keyMap = {
    'openai': ['VITE_OPENAI_API_KEY', 'VTF_OPENAI_API_KEY'],
    'anthropic': ['VITE_ANTHROPIC_API_KEY', 'VTF_ANTHROPIC_API_KEY'],
    'cohere': ['VITE_COHERE_API_KEY', 'VTF_COHERE_API_KEY'],
    'huggingface': ['VITE_HUGGINGFACE_API_KEY', 'VTF_HUGGINGFACE_API_KEY']
  };
  
  const envVarNames = keyMap[provider];
  if (!envVarNames) {
    console.error(`Unknown provider: ${provider}`);
    return null;
  }
  
  // Try each possible environment variable name
  for (const envVarName of envVarNames) {
    const value = await getEnvironmentVariable(envVarName);
    if (value) {
      console.log(`✅ Found API key using ${envVarName}`);
      return value;
    }
  }
  
  return null;
}

/**
 * Get available providers (those with API keys)
 */
async function getAvailableProviders() {
  const providers = [];
  
  if (await getApiKey('openai')) providers.push('openai');
  if (await getApiKey('anthropic')) providers.push('anthropic');
  if (await getApiKey('cohere')) providers.push('cohere');
  if (await getApiKey('huggingface')) providers.push('huggingface');
  
  console.log(`📊 Available providers: ${providers.length > 0 ? providers.join(', ') : 'none'}`);
  return providers;
}

/**
 * Create completion using OpenAI API
 */
async function createOpenAICompletion(messages, options = {}) {
  const apiKey = await getApiKey('openai');
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }
  
  console.log('🤖 Making OpenAI API call...');
  
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ OpenAI API call successful');
  
  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model: data.model,
    usage: data.usage
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
  
  console.log('🤖 Making Anthropic API call...');
  
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ Anthropic API call successful');
  
  return {
    content: data.content[0].text,
    provider: 'anthropic',
    model: data.model,
    usage: data.usage
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
  
  console.log('🤖 Making Cohere API call...');
  
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Cohere API error: ${errorData.message || response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ Cohere API call successful');
  
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
  
  console.log('🤖 Making HuggingFace API call...');
  
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HuggingFace API error: ${errorData.error || response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ HuggingFace API call successful');
  
  return {
    content: data[0]?.generated_text?.replace(prompt, '').trim() || 'No response generated',
    provider: 'huggingface',
    model: 'microsoft/DialoGPT-large'
  };
}

/**
 * Generate fallback response when no API providers are available
 */
function generateFallbackResponse(messages, options = {}) {
  const lastMessage = messages[messages.length - 1];
  const isGovernanceQuery = lastMessage?.content?.toLowerCase().includes('governance') || 
                           lastMessage?.content?.toLowerCase().includes('policy') ||
                           lastMessage?.content?.toLowerCase().includes('compliance');
  
  const fallbackResponses = {
    governance: [
      "I understand you're asking about governance. In a real deployment, I would analyze this request against our governance policies and provide appropriate guidance.",
      "This appears to be a governance-related query. Our AI governance framework would typically evaluate such requests for compliance with established policies.",
      "I notice this involves governance considerations. In production, this would trigger our policy evaluation system to ensure appropriate handling."
    ],
    general: [
      "I'm currently operating in demo mode. In a real deployment, I would provide a dynamic response based on the latest AI models and governance policies.",
      "This is a demonstration response. In production, I would generate contextual responses while adhering to governance frameworks.",
      "Demo mode active. Real deployment would provide AI-generated responses with appropriate governance oversight."
    ]
  };
  
  const responseSet = isGovernanceQuery ? fallbackResponses.governance : fallbackResponses.general;
  const randomResponse = responseSet[Math.floor(Math.random() * responseSet.length)];
  
  return {
    content: randomResponse,
    provider: 'fallback',
    model: 'demo-mode',
    usage: { total_tokens: 0 }
  };
}

/**
 * Robust API Client class
 */
class RobustAPIClient {
  constructor() {
    this.availableProviders = [];
    this.initialized = false;
    this.fallbackMode = false;
  }
  
  /**
   * Initialize the API client
   */
  async init() {
    try {
      console.log('🚀 Initializing Robust API Client...');
      
      // Load environment variables first
      if (window.runtimeEnvLoader) {
        await window.runtimeEnvLoader.loadEnvironmentVariables();
      }
      
      this.availableProviders = await getAvailableProviders();
      
      if (this.availableProviders.length === 0) {
        console.warn('⚠️ No API providers available - enabling fallback mode');
        this.fallbackMode = true;
        this.showFallbackNotification();
      } else {
        console.log(`✅ API Client initialized with providers: ${this.availableProviders.join(', ')}`);
        this.fallbackMode = false;
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error initializing API Client:', error);
      this.fallbackMode = true;
      this.initialized = true;
    }
  }
  
  /**
   * Show notification about fallback mode
   */
  showFallbackNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'alert alert-info mt-3';
    notification.innerHTML = `
      <h6>🔧 Demo Mode Active</h6>
      <p class="mb-2">API keys not detected. The demo will use simulated responses.</p>
      <small class="text-muted">
        To enable real AI agents, configure VTF_OPENAI_API_KEY, VTF_ANTHROPIC_API_KEY, 
        VTF_COHERE_API_KEY, or VTF_HUGGINGFACE_API_KEY in your environment.
      </small>
      <button class="btn btn-sm btn-outline-primary ms-2" onclick="this.parentElement.remove()">
        Dismiss
      </button>
    `;
    
    // Insert at top of container
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(notification, container.firstChild);
  }
  
  /**
   * Create completion using the first available provider with fallback
   */
  async createCompletion(options) {
    if (!this.initialized) {
      this.init();
    }
    
    const { messages, max_tokens, temperature, model } = options;
    
    // If in fallback mode, return simulated response
    if (this.fallbackMode) {
      console.log('📝 Generating fallback response (demo mode)');
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // Simulate API delay
      return generateFallbackResponse(messages, options);
    }
    
    // Try providers in order of preference
    const providerOrder = ['openai', 'anthropic', 'cohere', 'huggingface'];
    const errors = [];
    
    for (const provider of providerOrder) {
      if (this.availableProviders.includes(provider)) {
        try {
          console.log(`🔄 Attempting to use ${provider} provider`);
          
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
          console.warn(`⚠️ ${provider} provider failed:`, error.message);
          errors.push(`${provider}: ${error.message}`);
          // Continue to next provider
        }
      }
    }
    
    // If all providers failed, fall back to demo mode
    console.warn('⚠️ All API providers failed, falling back to demo mode');
    console.warn('Provider errors:', errors);
    
    this.fallbackMode = true;
    return generateFallbackResponse(messages, options);
  }
  
  /**
   * Get configuration information
   */
  getConfig() {
    return {
      initialized: this.initialized,
      fallbackMode: this.fallbackMode,
      availableProviders: this.availableProviders,
      apiKeys: {
        openai: !!getApiKey('openai'),
        anthropic: !!getApiKey('anthropic'),
        cohere: !!getApiKey('cohere'),
        huggingface: !!getApiKey('huggingface')
      }
    };
  }
  
  /**
   * Test API connectivity
   */
  async testConnectivity() {
    const results = {};
    
    for (const provider of this.availableProviders) {
      try {
        const testMessages = [
          { role: 'user', content: 'Hello, this is a test message.' }
        ];
        
        const result = await this.createCompletion({
          messages: testMessages,
          max_tokens: 10
        });
        
        results[provider] = { success: true, model: result.model };
      } catch (error) {
        results[provider] = { success: false, error: error.message };
      }
    }
    
    return results;
  }
}

// Export as default
export default new RobustAPIClient();

