// Custom GPT Service for handling GPT import and governance integration
import { 
  CustomGPTConfig, 
  CustomGPTProfile, 
  GovernanceSettings, 
  CustomGPTCreationResult,
  CustomGPTValidationResult,
  OpenAPISchema,
  CustomGPTAction
} from '../types/CustomGPTTypes';

export interface GPTMetadata {
  id?: string;
  name: string;
  description: string;
  isPublic: boolean;
  confidence: number;
}

export interface GovernedAgent {
  id: string;
  type: string;
  provider: string;
  model: string;
  name: string;
  description: string;
  apiKey: string;
  endpoint: string;
  instructions?: string;
  tools?: any[];
  capabilities?: string[];
  actions?: CustomGPTAction[];
  trustLevel: string;
  complianceLevel: string;
  rateLimiting: any;
  auditLogging: boolean;
  createdAt: string;
  status: string;
  metadata?: any;
  metrics?: {
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    successRate?: number;
    costTracking?: {
      totalCost: number;
      costPerRequest: number;
      monthlyBudget?: number;
    };
  };
}

export class CustomGPTService {
  
  /**
   * Validate OpenAI API key
   */
  async validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return { valid: true };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded. Please try again later.' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      return { valid: false, error: 'Network error validating API key' };
    }
  }
  
  /**
   * Analyze GPT URL and extract metadata
   */
  async analyzeGPTUrl(url: string): Promise<GPTMetadata> {
    // Extract GPT ID and slug from URL
    const gptUrlPattern = /https:\/\/chatgpt\.com\/g\/(g-[a-zA-Z0-9]+)-(.+)/;
    const match = url.match(gptUrlPattern);
    
    if (!match) {
      throw new Error('Invalid Custom GPT URL format. Expected: https://chatgpt.com/g/g-abc123-name');
    }
    
    const [, gptId, gptSlug] = match;
    
    // Convert slug to human-readable name
    const estimatedName = gptSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // In a real implementation, you might try to fetch additional metadata
    // For now, we'll return estimated data based on URL structure
    return {
      id: gptId,
      name: estimatedName,
      description: 'Auto-detected from URL',
      isPublic: true, // Assume public if URL is accessible
      confidence: 0.8
    };
  }
  
  /**
   * Create a governed agent from Custom GPT configuration
   */
  async createGovernedAgent(
    config: CustomGPTConfig,
    apiKey: string,
    governanceSettings: GovernanceSettings
  ): Promise<GovernedAgent> {
    
    // Validate API key first
    const keyValidation = await this.validateOpenAIKey(apiKey);
    if (!keyValidation.valid) {
      throw new Error(`Invalid OpenAI API key: ${keyValidation.error}`);
    }
    
    // Convert capabilities to OpenAI tools format
    const tools = this.convertCapabilitiesToTools(config.capabilities);
    
    // Add custom actions as tools
    const customTools = this.convertActionsToTools(config.actions);
    
    // Create the governed agent configuration
    const governedAgent: GovernedAgent = {
      id: `custom-gpt-${Date.now()}`,
      type: 'custom_gpt_wrapped',
      provider: 'OpenAI', // Backend treats as OpenAI
      model: 'gpt-4o', // Auto-assigned for Custom GPTs
      name: config.name,
      description: `Governed version of Custom GPT: ${config.name}`,
      
      // API Configuration
      apiKey: apiKey,
      endpoint: 'https://api.openai.com/v1/chat/completions',
      
      // Custom GPT specific
      instructions: config.instructions,
      tools: [...tools, ...customTools],
      capabilities: config.capabilities,
      actions: config.actions,
      
      // Governance settings
      trustLevel: governanceSettings.trustLevel,
      complianceLevel: governanceSettings.complianceLevel,
      rateLimiting: governanceSettings.rateLimiting,
      auditLogging: governanceSettings.auditLogging,
      
      // Tracking
      createdAt: new Date().toISOString(),
      status: 'active',
      
      // Custom GPT metadata
      metadata: {
        type: 'custom_gpt_wrapped',
        originalGPTUrl: config.url,
        originalGPTId: config.url.match(/g-[a-zA-Z0-9]+/)?.[0],
        importedAt: new Date().toISOString(),
        knowledgeFilesCount: config.knowledgeFiles.length,
        customActionsCount: config.actions.length,
        importSource: 'manual_configuration'
      },
      
      // Initialize metrics
      metrics: {
        totalRequests: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        successRate: 100,
        costTracking: {
          totalCost: 0,
          costPerRequest: 0,
          monthlyBudget: 100 // Default budget
        }
      }
    };
    
    return governedAgent;
  }
  
  /**
   * Convert capabilities to OpenAI tools format
   */
  private convertCapabilitiesToTools(capabilities: string[]): any[] {
    const tools = [];
    
    if (capabilities.includes('web_browsing')) {
      tools.push({ 
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for current information',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' }
            },
            required: ['query']
          }
        }
      });
    }
    
    if (capabilities.includes('code_interpreter')) {
      tools.push({ 
        type: 'code_interpreter',
        description: 'Execute Python code and analyze data'
      });
    }
    
    if (capabilities.includes('dalle_image_generation')) {
      tools.push({ 
        type: 'function',
        function: {
          name: 'generate_image',
          description: 'Generate images using DALL-E',
          parameters: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'Image generation prompt' },
              size: { type: 'string', enum: ['1024x1024', '1792x1024', '1024x1792'] }
            },
            required: ['prompt']
          }
        }
      });
    }
    
    return tools;
  }
  
  /**
   * Convert custom actions to OpenAI tools format
   */
  private convertActionsToTools(actions: CustomAction[]): any[] {
    return actions.map(action => ({
      type: 'function',
      function: {
        name: action.name.replace(/[^a-zA-Z0-9_]/g, '_'), // Sanitize name
        description: action.description,
        parameters: this.extractParametersFromSchema(action.schema)
      }
    }));
  }
  
  /**
   * Extract parameters from OpenAPI schema for OpenAI function format
   */
  private extractParametersFromSchema(schema: any): any {
    // This is a simplified conversion from OpenAPI to OpenAI function schema
    // In a full implementation, you'd want more robust schema conversion
    
    if (!schema || !schema.paths) {
      return {
        type: 'object',
        properties: {},
        required: []
      };
    }
    
    // Extract parameters from the first path/method found
    const paths = Object.keys(schema.paths);
    if (paths.length === 0) return { type: 'object', properties: {}, required: [] };
    
    const firstPath = schema.paths[paths[0]];
    const methods = Object.keys(firstPath);
    if (methods.length === 0) return { type: 'object', properties: {}, required: [] };
    
    const firstMethod = firstPath[methods[0]];
    const parameters = firstMethod.parameters || [];
    
    const properties: any = {};
    const required: string[] = [];
    
    parameters.forEach((param: any) => {
      if (param.name && param.schema) {
        properties[param.name] = {
          type: param.schema.type || 'string',
          description: param.description || ''
        };
        
        if (param.required) {
          required.push(param.name);
        }
      }
    });
    
    return {
      type: 'object',
      properties,
      required
    };
  }
  
  /**
   * Upload knowledge files (placeholder for future implementation)
   */
  async uploadKnowledgeFiles(files: File[], agentId: string): Promise<string[]> {
    // This would integrate with your file storage system
    // For now, return placeholder file IDs
    return files.map((file, index) => `file-${agentId}-${index}`);
  }
  
  /**
   * Deploy agent to command center (placeholder for integration)
   */
  async deployToCommandCenter(agent: GovernedAgent): Promise<{ success: boolean; commandCenterUrl?: string }> {
    // This would integrate with your command center deployment system
    // For now, simulate successful deployment
    
    try {
      // Simulate API call to deploy agent
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        commandCenterUrl: `/command-center/agents/${agent.id}`
      };
    } catch (error) {
      return {
        success: false
      };
    }
  }
  
  /**
   * Get cost estimate for Custom GPT usage
   */
  getCostEstimate(monthlyMessages: number = 100): {
    estimatedMonthlyCost: number;
    costPerMessage: number;
    comparisonToChatGPTPlus: {
      chatGPTPlusCost: number;
      savings: number;
      savingsPercentage: number;
    };
  } {
    // GPT-4o pricing (as of 2024)
    const inputCostPer1kTokens = 0.0025;
    const outputCostPer1kTokens = 0.01;
    
    // Estimate average tokens per message (input + output)
    const avgInputTokensPerMessage = 150;
    const avgOutputTokensPerMessage = 300;
    
    const inputCostPerMessage = (avgInputTokensPerMessage / 1000) * inputCostPer1kTokens;
    const outputCostPerMessage = (avgOutputTokensPerMessage / 1000) * outputCostPer1kTokens;
    const totalCostPerMessage = inputCostPerMessage + outputCostPerMessage;
    
    const estimatedMonthlyCost = monthlyMessages * totalCostPerMessage;
    const chatGPTPlusCost = 20; // $20/month
    const savings = chatGPTPlusCost - estimatedMonthlyCost;
    const savingsPercentage = (savings / chatGPTPlusCost) * 100;
    
    return {
      estimatedMonthlyCost: Math.round(estimatedMonthlyCost * 100) / 100,
      costPerMessage: Math.round(totalCostPerMessage * 10000) / 10000,
      comparisonToChatGPTPlus: {
        chatGPTPlusCost,
        savings: Math.round(savings * 100) / 100,
        savingsPercentage: Math.round(savingsPercentage)
      }
    };
  }
}

export default CustomGPTService;

