/**
 * Agent Discovery Service
 * Automatically discovers agent capabilities, tools, and specifications from API endpoints
 */

import { 
  AgentIntrospectionData, 
  AgentCapabilities, 
  AgentTool, 
  AgentModelSpecs, 
  ApiEndpointInfo, 
  GovernanceCompatibility,
  AgentDiscoveryService 
} from '../types/introspection';
import { ValidationResult } from '../types';

export class AgentDiscoveryServiceImpl implements AgentDiscoveryService {
  private static instance: AgentDiscoveryServiceImpl;

  public static getInstance(): AgentDiscoveryServiceImpl {
    if (!AgentDiscoveryServiceImpl.instance) {
      AgentDiscoveryServiceImpl.instance = new AgentDiscoveryServiceImpl();
    }
    return AgentDiscoveryServiceImpl.instance;
  }

  /**
   * Discover agent capabilities from API endpoint
   */
  async discoverAgent(apiEndpoint: string, apiKey: string, provider: string): Promise<AgentIntrospectionData> {
    console.log(`🔍 Starting agent discovery for ${provider} at ${apiEndpoint}`);
    
    try {
      // Discover based on provider
      const discoveryData = await this.discoverByProvider(apiEndpoint, apiKey, provider);
      
      return {
        discoveredAt: new Date(),
        discoveryMethod: 'api-introspection',
        lastUpdated: new Date(),
        discoveryVersion: '1.0.0',
        ...discoveryData,
        isValidated: false,
        validationErrors: [],
      };
    } catch (error) {
      console.error('Error during agent discovery:', error);
      throw new Error(`Failed to discover agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Provider-specific discovery logic
   */
  private async discoverByProvider(apiEndpoint: string, apiKey: string, provider: string): Promise<Partial<AgentIntrospectionData>> {
    switch (provider.toLowerCase()) {
      case 'openai':
        return this.discoverOpenAI(apiEndpoint, apiKey);
      case 'anthropic':
        return this.discoverAnthropic(apiEndpoint, apiKey);
      case 'cohere':
        return this.discoverCohere(apiEndpoint, apiKey);
      case 'google':
      case 'google-ai':
      case 'gemini':
        return this.discoverGoogle(apiEndpoint, apiKey);
      case 'custom':
        return this.discoverCustomAPI(apiEndpoint, apiKey);
      default:
        return this.discoverGeneric(apiEndpoint, apiKey, provider);
    }
  }

  /**
   * Discover OpenAI agent capabilities
   */
  private async discoverOpenAI(apiEndpoint: string, apiKey: string): Promise<Partial<AgentIntrospectionData>> {
    const capabilities: AgentCapabilities = {
      canChat: true,
      canGenerateCode: true,
      canAnalyzeData: true,
      canGenerateImages: false, // Depends on model
      canProcessFiles: true,
      canAccessInternet: false,
      canExecuteCode: false,
      canManageMemory: false,
      supportsStreaming: true,
      supportsMultimodal: true,
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      supportsTemperatureControl: true,
      supportsTokenLimits: true,
      customCapabilities: []
    };

    // Try to get model information
    const modelSpecs = await this.getOpenAIModelSpecs(apiKey);
    const apiInfo = this.getOpenAIApiInfo(apiEndpoint);
    const tools = this.getOpenAITools();
    const governance = this.getOpenAIGovernanceCompatibility();

    return {
      capabilities,
      availableTools: tools,
      modelSpecs,
      apiInfo,
      governanceCompatibility: governance,
      tags: ['openai', 'llm', 'chat', 'code-generation'],
      categories: ['Language Model', 'AI Assistant'],
      useCases: ['Chat', 'Code Generation', 'Text Analysis', 'Question Answering'],
      limitations: ['No internet access', 'Knowledge cutoff', 'No persistent memory']
    };
  }

  /**
   * Get OpenAI model specifications
   */
  private async getOpenAIModelSpecs(apiKey: string): Promise<AgentModelSpecs> {
    try {
      // Try to fetch models list
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Use the first available model or default to gpt-3.5-turbo
        const model = data.data?.[0] || { id: 'gpt-3.5-turbo' };
        
        return {
          modelName: model.id,
          provider: 'openai',
          maxContextLength: this.getOpenAIContextLength(model.id),
          maxOutputTokens: this.getOpenAIMaxOutput(model.id),
          inputTokenCost: this.getOpenAIInputCost(model.id),
          outputTokenCost: this.getOpenAIOutputCost(model.id),
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
          knowledgeDomains: ['general', 'science', 'technology', 'history', 'literature', 'mathematics'],
          trainingDataCutoff: '2023-04',
          averageResponseTime: 2000,
          reliabilityScore: 0.95,
          safetyRating: 'high'
        };
      }
    } catch (error) {
      console.warn('Could not fetch OpenAI model specs, using defaults');
    }

    // Default specs
    return {
      modelName: 'gpt-3.5-turbo',
      provider: 'openai',
      maxContextLength: 4096,
      maxOutputTokens: 4096,
      supportedLanguages: ['en'],
      knowledgeDomains: ['general'],
      averageResponseTime: 2000,
      reliabilityScore: 0.95,
      safetyRating: 'high'
    };
  }

  /**
   * Get OpenAI API information
   */
  private getOpenAIApiInfo(apiEndpoint: string): ApiEndpointInfo {
    return {
      baseUrl: 'https://api.openai.com/v1',
      version: 'v1',
      authMethod: 'bearer',
      rateLimits: {
        requestsPerMinute: 3500,
        requestsPerDay: 200000,
        tokensPerMinute: 90000
      },
      availableEndpoints: [
        {
          path: '/chat/completions',
          method: 'POST',
          description: 'Create a chat completion',
          parameters: {
            model: 'string',
            messages: 'array',
            temperature: 'number',
            max_tokens: 'number'
          }
        },
        {
          path: '/completions',
          method: 'POST',
          description: 'Create a text completion',
          parameters: {
            model: 'string',
            prompt: 'string',
            max_tokens: 'number'
          }
        }
      ],
      healthCheckEndpoint: '/models',
      documentationUrl: 'https://platform.openai.com/docs/api-reference'
    };
  }

  /**
   * Get OpenAI available tools
   */
  private getOpenAITools(): AgentTool[] {
    return [
      {
        name: 'function_calling',
        description: 'Call custom functions with structured parameters',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            parameters: { type: 'object' }
          },
          required: ['name']
        },
        category: 'built-in',
        isEnabled: true
      },
      {
        name: 'code_interpreter',
        description: 'Execute Python code in a sandboxed environment',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string' }
          },
          required: ['code']
        },
        category: 'built-in',
        isEnabled: false // Requires specific model
      }
    ];
  }

  /**
   * Get OpenAI governance compatibility
   */
  private getOpenAIGovernanceCompatibility(): GovernanceCompatibility {
    return {
      supportsAuditLogging: true,
      supportsContentFiltering: true,
      supportsPolicyEnforcement: false,
      supportsUsageTracking: true,
      supportsComplianceReporting: false,
      canExplainReasoning: false,
      providesConfidenceScores: false,
      supportsHumanInTheLoop: false,
      allowsCustomPolicies: false,
      supportedStandards: ['SOC2'],
      certifications: ['SOC2 Type II']
    };
  }

  /**
   * Discover Google AI/Gemini agent capabilities
   */
  private async discoverGoogle(apiEndpoint: string, apiKey: string): Promise<Partial<AgentIntrospectionData>> {
    const capabilities: AgentCapabilities = {
      canChat: true,
      canGenerateCode: true,
      canAnalyzeData: true,
      canGenerateImages: false,
      canProcessFiles: true,
      canAccessInternet: true, // Google models can access real-time info
      canExecuteCode: false,
      canManageMemory: false,
      supportsStreaming: true,
      supportsMultimodal: true, // Gemini supports text, images, audio, video
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      supportsTemperatureControl: true,
      supportsTokenLimits: true,
      customCapabilities: ['real_time_info', 'multimodal_understanding', 'google_search_integration']
    };

    // Try to get model information
    const modelSpecs = await this.getGoogleModelSpecs(apiKey);
    const apiInfo = this.getGoogleApiInfo(apiEndpoint);
    const tools = this.getGoogleTools();
    const governance = this.getGoogleGovernanceCompatibility();

    return {
      capabilities,
      availableTools: tools,
      modelSpecs,
      apiInfo,
      governanceCompatibility: governance,
      tags: ['google', 'gemini', 'multimodal', 'real-time'],
      categories: ['Language Model', 'Multimodal AI', 'Search-Enhanced'],
      useCases: ['Chat', 'Code Generation', 'Image Analysis', 'Real-time Information', 'Multimodal Tasks'],
      limitations: ['API rate limits', 'Content policy restrictions', 'Regional availability']
    };
  }

  /**
   * Get Google/Gemini model specifications
   */
  private async getGoogleModelSpecs(apiKey: string): Promise<AgentModelSpecs> {
    try {
      // Try to fetch models list from Google AI API
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Use the first available model or default to gemini-pro
        const model = data.models?.[0] || { name: 'models/gemini-pro' };
        const modelName = model.name.replace('models/', '');
        
        return {
          modelName,
          provider: 'google',
          maxContextLength: this.getGoogleContextLength(modelName),
          maxOutputTokens: this.getGoogleMaxOutput(modelName),
          inputTokenCost: this.getGoogleInputCost(modelName),
          outputTokenCost: this.getGoogleOutputCost(modelName),
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi', 'ar'],
          knowledgeDomains: ['general', 'science', 'technology', 'current_events', 'mathematics', 'programming'],
          trainingDataCutoff: '2024-04', // Gemini has more recent training data
          averageResponseTime: 1500,
          reliabilityScore: 0.94,
          safetyRating: 'high'
        };
      }
    } catch (error) {
      console.warn('Could not fetch Google model specs, using defaults');
    }

    // Default specs for Gemini Pro
    return {
      modelName: 'gemini-pro',
      provider: 'google',
      maxContextLength: 32768,
      maxOutputTokens: 8192,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      knowledgeDomains: ['general', 'science', 'technology', 'current_events'],
      trainingDataCutoff: '2024-04',
      averageResponseTime: 1500,
      reliabilityScore: 0.94,
      safetyRating: 'high'
    };
  }

  /**
   * Get Google AI API information
   */
  private getGoogleApiInfo(apiEndpoint: string): ApiEndpointInfo {
    return {
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      version: 'v1',
      authMethod: 'api-key',
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerDay: 1500,
        tokensPerMinute: 32000
      },
      availableEndpoints: [
        {
          path: '/models/{model}:generateContent',
          method: 'POST',
          description: 'Generate content using Gemini models',
          parameters: {
            model: 'string',
            contents: 'array',
            generationConfig: 'object',
            safetySettings: 'array'
          }
        },
        {
          path: '/models/{model}:streamGenerateContent',
          method: 'POST',
          description: 'Stream content generation',
          parameters: {
            model: 'string',
            contents: 'array',
            generationConfig: 'object'
          }
        },
        {
          path: '/models',
          method: 'GET',
          description: 'List available models',
          parameters: {}
        }
      ],
      healthCheckEndpoint: '/models',
      documentationUrl: 'https://ai.google.dev/docs'
    };
  }

  /**
   * Get Google AI available tools
   */
  private getGoogleTools(): AgentTool[] {
    return [
      {
        name: 'function_calling',
        description: 'Call custom functions with structured parameters',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            parameters: { type: 'object' }
          },
          required: ['name']
        },
        category: 'built-in',
        isEnabled: true
      },
      {
        name: 'google_search',
        description: 'Access real-time information via Google Search',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        },
        category: 'built-in',
        isEnabled: true
      },
      {
        name: 'multimodal_analysis',
        description: 'Analyze images, audio, and video content',
        parameters: {
          type: 'object',
          properties: {
            media_type: { type: 'string', enum: ['image', 'audio', 'video'] },
            content: { type: 'string' }
          },
          required: ['media_type', 'content']
        },
        category: 'built-in',
        isEnabled: true
      }
    ];
  }

  /**
   * Get Google AI governance compatibility
   */
  private getGoogleGovernanceCompatibility(): GovernanceCompatibility {
    return {
      supportsAuditLogging: true,
      supportsContentFiltering: true,
      supportsPolicyEnforcement: true,
      supportsUsageTracking: true,
      supportsComplianceReporting: true,
      canExplainReasoning: false,
      providesConfidenceScores: true,
      supportsHumanInTheLoop: false,
      allowsCustomPolicies: true,
      supportedStandards: ['ISO 27001', 'SOC 2'],
      certifications: ['ISO 27001', 'SOC 2 Type II']
    };
  }

  // Helper methods for Google AI specs
  private getGoogleContextLength(model: string): number {
    const contextLengths: Record<string, number> = {
      'gemini-pro': 32768,
      'gemini-pro-vision': 16384,
      'gemini-ultra': 32768,
      'gemini-1.5-pro': 1000000, // 1M context window
      'gemini-1.5-flash': 1000000
    };
    return contextLengths[model] || 32768;
  }

  private getGoogleMaxOutput(model: string): number {
    const maxOutputs: Record<string, number> = {
      'gemini-pro': 8192,
      'gemini-pro-vision': 4096,
      'gemini-ultra': 8192,
      'gemini-1.5-pro': 8192,
      'gemini-1.5-flash': 8192
    };
    return maxOutputs[model] || 8192;
  }

  private getGoogleInputCost(model: string): number {
    const costs: Record<string, number> = {
      'gemini-pro': 0.0005,
      'gemini-pro-vision': 0.00025,
      'gemini-ultra': 0.0125,
      'gemini-1.5-pro': 0.0035,
      'gemini-1.5-flash': 0.00035
    };
    return costs[model] || 0.0005;
  }

  private getGoogleOutputCost(model: string): number {
    const costs: Record<string, number> = {
      'gemini-pro': 0.0015,
      'gemini-pro-vision': 0.00025,
      'gemini-ultra': 0.0375,
      'gemini-1.5-pro': 0.0105,
      'gemini-1.5-flash': 0.00105
    };
    return costs[model] || 0.0015;
  }

  /**
   * Discover Anthropic agent capabilities
   */
  private async discoverAnthropic(apiEndpoint: string, apiKey: string): Promise<Partial<AgentIntrospectionData>> {
    console.log('🔍 Discovering Anthropic Claude models...');
    
    // Try to get available models from Anthropic API
    let availableModels: string[] = [];
    let defaultModel = 'claude-3-5-sonnet-20241022';
    
    try {
      // Test API connection with a simple request
      const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      if (testResponse.ok || testResponse.status === 400) {
        // API key is valid, use current model list
        availableModels = [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022', 
          'claude-3-opus-20240229'
        ];
        console.log('✅ Anthropic API connection successful, using current models');
      } else {
        console.warn('⚠️ Anthropic API test failed, using fallback models');
        availableModels = ['claude-3-5-sonnet-20241022'];
      }
    } catch (error) {
      console.warn('⚠️ Could not test Anthropic API, using fallback models:', error);
      availableModels = ['claude-3-5-sonnet-20241022'];
    }

    const capabilities: AgentCapabilities = {
      canChat: true,
      canGenerateText: true,
      canAnswerQuestions: true,
      canSummarize: true,
      canTranslate: true,
      canGenerateCode: true,
      canAnalyzeData: true,
      canGenerateImages: false,
      canProcessFiles: true,
      canAccessInternet: false,
      canExecuteCode: false,
      canManageMemory: false,
      supportsStreaming: true,
      supportsMultimodal: true,
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      supportsTemperatureControl: true,
      supportsTokenLimits: true,
      customCapabilities: ['constitutional_ai', 'harmlessness_training']
    };

    return {
      capabilities,
      availableTools: this.getAnthropicTools(),
      modelSpecs: this.getAnthropicModelSpecs(defaultModel, availableModels),
      apiInfo: this.getAnthropicApiInfo(),
      governanceCompatibility: this.getAnthropicGovernanceCompatibility(),
      tags: ['anthropic', 'claude', 'constitutional-ai', 'safety'],
      categories: ['Language Model', 'AI Assistant', 'Safety-Focused'],
      useCases: ['Safe Chat', 'Ethical AI', 'Content Analysis', 'Research'],
      limitations: ['No internet access', 'Knowledge cutoff', 'Conservative responses']
    };
  }

  /**
   * Discover custom API capabilities
   */
  private async discoverCustomAPI(apiEndpoint: string, apiKey: string): Promise<Partial<AgentIntrospectionData>> {
    try {
      // Try to introspect the API
      const introspectionData = await this.introspectCustomAPI(apiEndpoint, apiKey);
      return introspectionData;
    } catch (error) {
      console.warn('Custom API introspection failed, using generic discovery');
      return this.discoverGeneric(apiEndpoint, apiKey, 'custom');
    }
  }

  /**
   * Introspect custom API endpoints
   */
  private async introspectCustomAPI(apiEndpoint: string, apiKey: string): Promise<Partial<AgentIntrospectionData>> {
    // Try common introspection endpoints
    const introspectionEndpoints = [
      '/capabilities',
      '/info',
      '/metadata',
      '/schema',
      '/.well-known/ai-agent'
    ];

    for (const endpoint of introspectionEndpoints) {
      try {
        const response = await fetch(`${apiEndpoint}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return this.parseIntrospectionResponse(data);
        }
      } catch (error) {
        // Continue to next endpoint
        continue;
      }
    }

    throw new Error('No introspection endpoints found');
  }

  /**
   * Parse introspection response from custom API
   */
  private parseIntrospectionResponse(data: any): Partial<AgentIntrospectionData> {
    // This would parse various formats of introspection data
    // For now, return a basic structure
    return {
      capabilities: {
        canChat: data.capabilities?.chat || true,
        canGenerateCode: data.capabilities?.code || false,
        canAnalyzeData: data.capabilities?.analysis || false,
        canGenerateImages: data.capabilities?.images || false,
        canProcessFiles: data.capabilities?.files || false,
        canAccessInternet: data.capabilities?.internet || false,
        canExecuteCode: data.capabilities?.execution || false,
        canManageMemory: data.capabilities?.memory || false,
        supportsStreaming: data.features?.streaming || false,
        supportsMultimodal: data.features?.multimodal || false,
        supportsFunctionCalling: data.features?.functions || false,
        supportsSystemPrompts: data.features?.system_prompts || false,
        supportsTemperatureControl: data.features?.temperature || false,
        supportsTokenLimits: data.features?.token_limits || false,
        customCapabilities: data.custom_capabilities || []
      },
      availableTools: data.tools || [],
      tags: data.tags || ['custom'],
      categories: data.categories || ['Custom API'],
      useCases: data.use_cases || ['General Purpose'],
      limitations: data.limitations || []
    };
  }

  /**
   * Generic discovery for unknown providers
   */
  private async discoverGeneric(apiEndpoint: string, apiKey: string, provider: string): Promise<Partial<AgentIntrospectionData>> {
    // Basic capabilities for unknown providers
    const capabilities: AgentCapabilities = {
      canChat: true,
      canGenerateCode: false,
      canAnalyzeData: false,
      canGenerateImages: false,
      canProcessFiles: false,
      canAccessInternet: false,
      canExecuteCode: false,
      canManageMemory: false,
      supportsStreaming: false,
      supportsMultimodal: false,
      supportsFunctionCalling: false,
      supportsSystemPrompts: false,
      supportsTemperatureControl: false,
      supportsTokenLimits: false,
      customCapabilities: []
    };

    return {
      capabilities,
      availableTools: [],
      modelSpecs: {
        modelName: 'unknown',
        provider,
        maxContextLength: 2048,
        maxOutputTokens: 1024,
        supportedLanguages: ['en'],
        knowledgeDomains: ['general']
      },
      apiInfo: {
        baseUrl: apiEndpoint,
        version: 'unknown',
        authMethod: 'api-key',
        rateLimits: {
          requestsPerMinute: 60
        },
        availableEndpoints: []
      },
      governanceCompatibility: {
        supportsAuditLogging: false,
        supportsContentFiltering: false,
        supportsPolicyEnforcement: false,
        supportsUsageTracking: false,
        supportsComplianceReporting: false,
        canExplainReasoning: false,
        providesConfidenceScores: false,
        supportsHumanInTheLoop: false,
        allowsCustomPolicies: false,
        supportedStandards: [],
        certifications: []
      },
      tags: [provider, 'unknown'],
      categories: ['Unknown'],
      useCases: ['General Purpose'],
      limitations: ['Unknown capabilities', 'Limited introspection']
    };
  }

  /**
   * Validate discovered data
   */
  async validateDiscoveredData(data: AgentIntrospectionData): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate required fields
    if (!data.capabilities) {
      errors.push('Capabilities data is missing');
    }

    if (!data.modelSpecs) {
      errors.push('Model specifications are missing');
    }

    if (!data.apiInfo) {
      errors.push('API information is missing');
    }

    // Validate capabilities consistency
    if (data.capabilities && data.availableTools) {
      if (data.capabilities.supportsFunctionCalling && data.availableTools.length === 0) {
        errors.push('Agent claims to support function calling but no tools are available');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.map(error => ({
        path: 'root',
        message: error,
        code: 'VALIDATION_ERROR'
      }))
    };
  }

  /**
   * Update existing agent with new discovery data
   */
  async updateAgentIntrospection(agentId: string, data: AgentIntrospectionData): Promise<boolean> {
    try {
      // This would integrate with the storage system
      console.log(`Updating agent ${agentId} with new introspection data`);
      return true;
    } catch (error) {
      console.error('Error updating agent introspection:', error);
      return false;
    }
  }

  /**
   * Schedule periodic discovery
   */
  async scheduleDiscovery(agentId: string, schedule: string): Promise<boolean> {
    try {
      console.log(`Scheduling discovery for agent ${agentId} with schedule ${schedule}`);
      return true;
    } catch (error) {
      console.error('Error scheduling discovery:', error);
      return false;
    }
  }

  /**
   * Get discovery history
   */
  async getDiscoveryHistory(agentId: string): Promise<AgentIntrospectionData[]> {
    try {
      // This would fetch from storage
      return [];
    } catch (error) {
      console.error('Error getting discovery history:', error);
      return [];
    }
  }

  // Helper methods for OpenAI specs
  private getOpenAIContextLength(model: string): number {
    const contextLengths: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-4-turbo': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384
    };
    return contextLengths[model] || 4096;
  }

  private getOpenAIMaxOutput(model: string): number {
    return Math.min(this.getOpenAIContextLength(model), 4096);
  }

  private getOpenAIInputCost(model: string): number {
    const costs: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.0015
    };
    return costs[model] || 0.002;
  }

  private getOpenAIOutputCost(model: string): number {
    const costs: Record<string, number> = {
      'gpt-4': 0.06,
      'gpt-4-turbo': 0.03,
      'gpt-3.5-turbo': 0.002
    };
    return costs[model] || 0.002;
  }

  // Placeholder methods for other providers
  private getAnthropicTools(): AgentTool[] { return []; }
  private getAnthropicModelSpecs(defaultModel: string = 'claude-3-5-sonnet-20241022', availableModels: string[] = []): AgentModelSpecs { 
    return {
      modelName: defaultModel,
      provider: 'anthropic',
      maxContextLength: 200000,
      maxOutputTokens: 4096,
      supportedLanguages: ['en'],
      knowledgeDomains: ['general'],
      availableModels: availableModels.length > 0 ? availableModels : [defaultModel]
    };
  }
  private getAnthropicApiInfo(): ApiEndpointInfo {
    return {
      baseUrl: 'https://api.anthropic.com/v1',
      version: 'v1',
      authMethod: 'api-key',
      rateLimits: { requestsPerMinute: 1000 },
      availableEndpoints: []
    };
  }
  private getAnthropicGovernanceCompatibility(): GovernanceCompatibility {
    return {
      supportsAuditLogging: true,
      supportsContentFiltering: true,
      supportsPolicyEnforcement: true,
      supportsUsageTracking: true,
      supportsComplianceReporting: false,
      canExplainReasoning: true,
      providesConfidenceScores: false,
      supportsHumanInTheLoop: true,
      allowsCustomPolicies: true,
      supportedStandards: ['Constitutional AI'],
      certifications: []
    };
  }
}

// Export singleton instance
export const agentDiscoveryService = AgentDiscoveryServiceImpl.getInstance();

