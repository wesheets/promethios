/**
 * Enhanced Robust API Client for CMU Playground
 * 
 * This version connects directly to the benchmark API endpoints
 * and doesn't require traditional API keys to function.
 */

import { API_CONFIG, getApiUrl } from './apiConfig.js';

/**
 * Enhanced Robust API Client class
 */
class EnhancedRobustAPIClient {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.initialized = false;
    this.fallbackMode = false;
    this.availableProviders = ['benchmark']; // Always available
    this.retryCount = API_CONFIG.RETRY.MAX_RETRIES;
    this.retryDelay = API_CONFIG.RETRY.RETRY_DELAY;
  }
  
  /**
   * Initialize the API client
   */
  async init() {
    try {
      console.log('🚀 Initializing Enhanced Robust API Client...');
      
      // Test connection to benchmark API
      const statusUrl = getApiUrl(API_CONFIG.AGENT_ENDPOINTS.STATUS);
      try {
        const response = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('✅ Successfully connected to benchmark API');
          this.fallbackMode = false;
        } else {
          console.warn(`⚠️ Benchmark API returned status ${response.status}`);
          // Don't enable fallback mode - we'll still try to use the API
        }
      } catch (error) {
        console.warn(`⚠️ Could not connect to benchmark API: ${error.message}`);
        // Don't enable fallback mode - we'll still try to use the API
      }
      
      this.initialized = true;
      console.log('✅ Enhanced API Client initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing Enhanced API Client:', error);
      this.initialized = true;
      // Don't enable fallback mode - we'll still try to use the API
    }
  }
  
  /**
   * Create completion using the benchmark API
   */
  async createCompletion(options) {
    if (!this.initialized) {
      await this.init();
    }
    
    const { messages, role, scenario, max_tokens, temperature } = options;
    
    console.log('🤖 Making benchmark API call for agent completion...');
    
    try {
      const completeUrl = getApiUrl(API_CONFIG.AGENT_ENDPOINTS.COMPLETE);
      
      const response = await fetch(completeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: role || 'assistant',
          scenario: scenario || 'default',
          prompt: messages[messages.length - 1].content,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 500
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Benchmark API error (${response.status}):`, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Benchmark API call successful');
      
      return {
        content: result.text || result.content || "No response content",
        provider: 'benchmark',
        model: result.model || 'benchmark-agent',
        usage: result.usage || { total_tokens: 0 }
      };
    } catch (error) {
      console.error('❌ Error calling benchmark API:', error);
      
      // If we're not in fallback mode, throw the error to let the caller handle it
      if (!this.fallbackMode) {
        throw error;
      }
      
      // Otherwise, generate a fallback response
      console.log('📝 Generating fallback response');
      return this.generateFallbackResponse(messages, options);
    }
  }
  
  /**
   * Apply governance to a response
   */
  async applyGovernance(options) {
    if (!this.initialized) {
      await this.init();
    }
    
    const { text, features, role, scenario } = options;
    
    console.log('🛡️ Making benchmark API call for governance...');
    
    try {
      const governanceUrl = getApiUrl(API_CONFIG.GOVERNANCE_ENDPOINTS.APPLY);
      
      const response = await fetch(governanceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          features,
          role: role || 'assistant',
          scenario: scenario || 'default'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Governance API error (${response.status}):`, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Governance API call successful');
      
      return {
        original: text,
        text: result.text || result.content || text,
        modifications: result.modifications || [],
        metrics: result.metrics || {
          trustScore: 95,
          complianceRate: 98,
          errorRate: 5
        }
      };
    } catch (error) {
      console.error('❌ Error calling governance API:', error);
      
      // If we're not in fallback mode, throw the error to let the caller handle it
      if (!this.fallbackMode) {
        throw error;
      }
      
      // Otherwise, generate a simulated governance response
      console.log('📝 Generating simulated governance response');
      return this.getSimulatedGovernance(options);
    }
  }
  
  /**
   * Generate a fallback response
   */
  generateFallbackResponse(messages, options = {}) {
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
   * Get simulated governance for development and testing
   */
  getSimulatedGovernance(params) {
    const { text, features } = params;
    let governed = text;
    const modifications = [];
    
    // Apply simulated governance effects based on active features
    if (features.veritas && (text.includes('fact') || text.includes('research') || text.includes('data'))) {
      governed = text.replace(/fact/g, 'verified fact')
                    .replace(/research/g, 'validated research')
                    .replace(/data/g, 'verified data');
      modifications.push({
        type: 'hallucination_prevention',
        description: 'Added verification qualifiers to factual claims'
      });
    }
    
    if (features.safety && (text.includes('risk') || text.includes('implement') || text.includes('change'))) {
      governed = governed.replace(/risk/g, 'managed risk')
                        .replace(/implement/g, 'carefully implement')
                        .replace(/change/g, 'controlled change');
      modifications.push({
        type: 'safety_enhancement',
        description: 'Added risk management context to implementation statements'
      });
    }
    
    if (features.role && (text.includes('I will') || text.includes('we should') || text.includes('I recommend'))) {
      governed = governed.replace(/I will/g, 'Within my role, I will')
                        .replace(/we should/g, 'within our scope, we should')
                        .replace(/I recommend/g, 'Based on my role, I recommend');
      modifications.push({
        type: 'role_adherence',
        description: 'Added role context to recommendation and action statements'
      });
    }
    
    // Generate realistic metrics
    const metrics = {
      trustScore: 92,
      complianceRate: 95,
      errorRate: 12
    };
    
    return {
      original: text,
      text: governed,
      modifications,
      metrics
    };
  }
  
  /**
   * Get configuration information
   */
  getConfig() {
    return {
      initialized: this.initialized,
      fallbackMode: this.fallbackMode,
      availableProviders: this.availableProviders,
      baseUrl: this.baseUrl
    };
  }
}

// Export as default
export default new EnhancedRobustAPIClient();
