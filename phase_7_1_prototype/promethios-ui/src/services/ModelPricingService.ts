/**
 * ModelPricingService - Centralized model pricing and cost calculation
 * Part of the revolutionary token-aware AI collaboration system
 */

export interface ModelPricing {
  input: number;  // Cost per 1K input tokens
  output: number; // Cost per 1K output tokens
  provider: string;
  model: string;
  tier: 'budget' | 'standard' | 'premium' | 'enterprise';
  contextWindow: number;
  lastUpdated: Date;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ModelComparison {
  model: string;
  provider: string;
  estimatedCost: number;
  tier: string;
  costEfficiency: number; // cost per quality point
  recommendationScore: number; // 0-100
  reasoning: string;
}

export class ModelPricingService {
  private static instance: ModelPricingService;
  
  // Comprehensive model pricing database - Updated December 2024
  private readonly MODEL_PRICING: Record<string, ModelPricing> = {
    // OpenAI Models
    'gpt-4o': {
      input: 0.0025, output: 0.01, provider: 'OpenAI', model: 'GPT-4o',
      tier: 'premium', contextWindow: 128000, lastUpdated: new Date('2024-12-01')
    },
    'gpt-4-turbo': {
      input: 0.01, output: 0.03, provider: 'OpenAI', model: 'GPT-4 Turbo',
      tier: 'enterprise', contextWindow: 128000, lastUpdated: new Date('2024-12-01')
    },
    'gpt-4': {
      input: 0.03, output: 0.06, provider: 'OpenAI', model: 'GPT-4',
      tier: 'enterprise', contextWindow: 8192, lastUpdated: new Date('2024-12-01')
    },
    'gpt-3.5-turbo': {
      input: 0.0005, output: 0.0015, provider: 'OpenAI', model: 'GPT-3.5 Turbo',
      tier: 'budget', contextWindow: 16385, lastUpdated: new Date('2024-12-01')
    },
    
    // Anthropic Claude Models
    'claude-3.5-sonnet': {
      input: 0.003, output: 0.015, provider: 'Anthropic', model: 'Claude 3.5 Sonnet',
      tier: 'premium', contextWindow: 200000, lastUpdated: new Date('2024-12-01')
    },
    'claude-3-opus': {
      input: 0.015, output: 0.075, provider: 'Anthropic', model: 'Claude 3 Opus',
      tier: 'enterprise', contextWindow: 200000, lastUpdated: new Date('2024-12-01')
    },
    'claude-3-sonnet': {
      input: 0.003, output: 0.015, provider: 'Anthropic', model: 'Claude 3 Sonnet',
      tier: 'standard', contextWindow: 200000, lastUpdated: new Date('2024-12-01')
    },
    'claude-3-haiku': {
      input: 0.00025, output: 0.00125, provider: 'Anthropic', model: 'Claude 3 Haiku',
      tier: 'budget', contextWindow: 200000, lastUpdated: new Date('2024-12-01')
    },
    
    // Google Gemini Models
    'gemini-1.5-pro': {
      input: 0.00125, output: 0.005, provider: 'Google', model: 'Gemini 1.5 Pro',
      tier: 'standard', contextWindow: 2000000, lastUpdated: new Date('2024-12-01')
    },
    'gemini-1.5-flash': {
      input: 0.000075, output: 0.0003, provider: 'Google', model: 'Gemini 1.5 Flash',
      tier: 'budget', contextWindow: 1000000, lastUpdated: new Date('2024-12-01')
    },
    'gemini-pro': {
      input: 0.001, output: 0.002, provider: 'Google', model: 'Gemini Pro',
      tier: 'standard', contextWindow: 32768, lastUpdated: new Date('2024-12-01')
    },
    
    // Meta Llama Models (via various providers)
    'llama-2-70b': {
      input: 0.0007, output: 0.0009, provider: 'Meta', model: 'Llama 2 70B',
      tier: 'standard', contextWindow: 4096, lastUpdated: new Date('2024-12-01')
    },
    'llama-2-13b': {
      input: 0.0002, output: 0.0003, provider: 'Meta', model: 'Llama 2 13B',
      tier: 'budget', contextWindow: 4096, lastUpdated: new Date('2024-12-01')
    },
    
    // Mistral Models
    'mistral-large': {
      input: 0.008, output: 0.024, provider: 'Mistral', model: 'Mistral Large',
      tier: 'premium', contextWindow: 32768, lastUpdated: new Date('2024-12-01')
    },
    'mistral-medium': {
      input: 0.0027, output: 0.0081, provider: 'Mistral', model: 'Mistral Medium',
      tier: 'standard', contextWindow: 32768, lastUpdated: new Date('2024-12-01')
    },
    'mistral-small': {
      input: 0.0006, output: 0.0018, provider: 'Mistral', model: 'Mistral Small',
      tier: 'budget', contextWindow: 32768, lastUpdated: new Date('2024-12-01')
    }
  };

  private constructor() {}

  public static getInstance(): ModelPricingService {
    if (!ModelPricingService.instance) {
      ModelPricingService.instance = new ModelPricingService();
    }
    return ModelPricingService.instance;
  }

  /**
   * Get pricing information for a specific model
   */
  public getModelPricing(modelId: string): ModelPricing | null {
    return this.MODEL_PRICING[modelId] || null;
  }

  /**
   * Calculate cost for a specific model and token usage
   */
  public calculateCost(modelId: string, inputTokens: number, outputTokens: number): CostEstimate {
    const pricing = this.getModelPricing(modelId);
    
    if (!pricing) {
      // Fallback to default pricing
      const inputCost = (inputTokens / 1000) * 0.001;
      const outputCost = (outputTokens / 1000) * 0.002;
      
      return {
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
        model: modelId,
        provider: 'Unknown',
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      };
    }

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      model: pricing.model,
      provider: pricing.provider,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }

  /**
   * Estimate cost for a message (rough estimation)
   */
  public estimateMessageCost(modelId: string, message: string, expectedResponseLength: number = 500): CostEstimate {
    // Rough token estimation: ~4 characters per token
    const inputTokens = Math.ceil(message.length / 4);
    const outputTokens = Math.ceil(expectedResponseLength / 4);
    
    return this.calculateCost(modelId, inputTokens, outputTokens);
  }

  /**
   * Get all models by tier
   */
  public getModelsByTier(tier: 'budget' | 'standard' | 'premium' | 'enterprise'): ModelPricing[] {
    return Object.values(this.MODEL_PRICING).filter(model => model.tier === tier);
  }

  /**
   * Get cheapest models for a given task
   */
  public getCheapestModels(limit: number = 5): ModelPricing[] {
    return Object.values(this.MODEL_PRICING)
      .sort((a, b) => (a.input + a.output) - (b.input + b.output))
      .slice(0, limit);
  }

  /**
   * Compare models for cost efficiency
   */
  public compareModelsForTask(
    message: string, 
    expectedResponseLength: number = 500,
    qualityRequirement: 'basic' | 'good' | 'excellent' = 'good'
  ): ModelComparison[] {
    const comparisons: ModelComparison[] = [];
    
    // Quality scores (subjective, based on general performance)
    const qualityScores: Record<string, number> = {
      'gpt-4o': 95,
      'gpt-4-turbo': 92,
      'gpt-4': 90,
      'claude-3.5-sonnet': 93,
      'claude-3-opus': 94,
      'claude-3-sonnet': 88,
      'claude-3-haiku': 82,
      'gemini-1.5-pro': 87,
      'gemini-1.5-flash': 80,
      'gpt-3.5-turbo': 78,
      'mistral-large': 85,
      'mistral-medium': 80,
      'mistral-small': 75
    };

    Object.entries(this.MODEL_PRICING).forEach(([modelId, pricing]) => {
      const costEstimate = this.estimateMessageCost(modelId, message, expectedResponseLength);
      const qualityScore = qualityScores[modelId] || 70;
      const costEfficiency = costEstimate.totalCost / qualityScore * 100; // Lower is better
      
      // Calculate recommendation score based on quality requirement
      let recommendationScore = 0;
      if (qualityRequirement === 'basic' && qualityScore >= 70) {
        recommendationScore = Math.max(0, 100 - (costEfficiency * 10));
      } else if (qualityRequirement === 'good' && qualityScore >= 80) {
        recommendationScore = Math.max(0, 100 - (costEfficiency * 8));
      } else if (qualityRequirement === 'excellent' && qualityScore >= 90) {
        recommendationScore = Math.max(0, 100 - (costEfficiency * 6));
      }

      let reasoning = '';
      if (pricing.tier === 'budget') {
        reasoning = 'Most cost-effective option';
      } else if (pricing.tier === 'premium') {
        reasoning = 'High quality with reasonable cost';
      } else if (pricing.tier === 'enterprise') {
        reasoning = 'Premium quality for critical tasks';
      } else {
        reasoning = 'Balanced cost and performance';
      }

      comparisons.push({
        model: modelId,
        provider: pricing.provider,
        estimatedCost: costEstimate.totalCost,
        tier: pricing.tier,
        costEfficiency,
        recommendationScore,
        reasoning
      });
    });

    return comparisons.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Get budget-friendly alternatives for expensive models
   */
  public getBudgetAlternatives(modelId: string): ModelPricing[] {
    const currentModel = this.getModelPricing(modelId);
    if (!currentModel) return [];

    const currentCost = currentModel.input + currentModel.output;
    
    return Object.values(this.MODEL_PRICING)
      .filter(model => {
        const modelCost = model.input + model.output;
        return modelCost < currentCost * 0.5; // At least 50% cheaper
      })
      .sort((a, b) => (a.input + a.output) - (b.input + b.output));
  }

  /**
   * Check if pricing data is up to date
   */
  public isPricingCurrent(modelId: string, maxAgeInDays: number = 30): boolean {
    const pricing = this.getModelPricing(modelId);
    if (!pricing) return false;

    const ageInMs = Date.now() - pricing.lastUpdated.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    
    return ageInDays <= maxAgeInDays;
  }

  /**
   * Get all available models
   */
  public getAllModels(): ModelPricing[] {
    return Object.values(this.MODEL_PRICING);
  }

  /**
   * Get models by provider
   */
  public getModelsByProvider(provider: string): ModelPricing[] {
    return Object.values(this.MODEL_PRICING).filter(model => 
      model.provider.toLowerCase() === provider.toLowerCase()
    );
  }
}

export default ModelPricingService;

