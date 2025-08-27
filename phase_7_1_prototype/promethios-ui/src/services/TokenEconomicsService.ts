/**
 * TokenEconomicsService - Token-aware AI collaboration with cost tracking and budget management
 * Part of the revolutionary multi-agent autonomous research system
 */

import { UnifiedStorageService } from './UnifiedStorageService';
import { ModelPricingService } from './ModelPricingService';

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface AgentCost {
  agentId: string;
  agentName: string;
  model: string;
  tokens: TokenUsage;
  cost: number;
  timestamp: Date;
  sessionId: string;
  interactionId?: string;
}

export interface SessionBudget {
  sessionId: string;
  userId: string;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  agentCosts: AgentCost[];
  alertThresholds: {
    warning: number; // 0.7 = 70%
    critical: number; // 0.9 = 90%
  };
  autoStopEnabled: boolean;
  maxAgentExchanges: number;
  currentExchanges: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface AgentEngagementMetrics {
  agentId: string;
  agentName: string;
  totalInteractions: number;
  totalCost: number;
  averageCost: number;
  valueAddScore: number; // 1-10 based on user feedback
  tokenEfficiency: number; // cost per valuable interaction
  engagementAppropriatenesss: number; // 1-10 how appropriate their engagements are
  userSatisfactionScore: number; // 1-5 based on user ratings
  costBenefitRatio: number; // calculated metric
  lastActivity: Date;
}

export interface TokenBudgetAlert {
  alertId: string;
  sessionId: string;
  userId: string;
  type: 'warning' | 'critical' | 'budget_exceeded' | 'agent_expensive';
  message: string;
  currentUsage: number;
  budgetLimit: number;
  suggestedAction: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface EngagementDecision {
  agentId: string;
  shouldEngage: boolean;
  confidence: number; // 0-1
  reasoning: string;
  estimatedCost: number;
  valueScore: number; // 1-10
  tokenJustification: string;
}

export class TokenEconomicsService {
  private static instance: TokenEconomicsService;
  private storageService: UnifiedStorageService;
  private modelPricingService: ModelPricingService;
  private activeBudgets = new Map<string, SessionBudget>();
  private agentMetrics = new Map<string, AgentEngagementMetrics>();

  private constructor() {
    this.storageService = UnifiedStorageService.getInstance();
    this.modelPricingService = ModelPricingService.getInstance();
    this.initializeService();
  }

  public static getInstance(): TokenEconomicsService {
    if (!TokenEconomicsService.instance) {
      TokenEconomicsService.instance = new TokenEconomicsService();
    }
    return TokenEconomicsService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('💰 [TokenEconomics] Initializing Token Economics Service');
      
      // Load existing budgets and metrics
      await this.loadActiveBudgets();
      await this.loadAgentMetrics();
      
      console.log('✅ [TokenEconomics] Token Economics Service initialized');
    } catch (error) {
      console.error('❌ [TokenEconomics] Error initializing service:', error);
    }
  }

  /**
   * Create a new session budget
   */
  public async createSessionBudget(
    sessionId: string,
    userId: string,
    totalBudget: number = 5.0, // Default $5 budget
    options?: {
      autoStopEnabled?: boolean;
      maxAgentExchanges?: number;
      warningThreshold?: number;
      criticalThreshold?: number;
    }
  ): Promise<SessionBudget> {
    const budget: SessionBudget = {
      sessionId,
      userId,
      totalBudget,
      usedBudget: 0,
      remainingBudget: totalBudget,
      agentCosts: [],
      alertThresholds: {
        warning: options?.warningThreshold || 0.7,
        critical: options?.criticalThreshold || 0.9
      },
      autoStopEnabled: options?.autoStopEnabled ?? true,
      maxAgentExchanges: options?.maxAgentExchanges || 5,
      currentExchanges: 0,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.activeBudgets.set(sessionId, budget);
    await this.storageService.set('session_budgets', sessionId, budget);
    
    console.log('💰 [TokenEconomics] Created session budget:', sessionId, `$${totalBudget}`);
    return budget;
  }

  /**
   * Calculate cost for token usage using ModelPricingService
   */
  public calculateCost(tokens: TokenUsage, model: string): number {
    const costEstimate = this.modelPricingService.calculateCost(model, tokens.input, tokens.output);
    return costEstimate.totalCost;
  }

  /**
   * Estimate cost for a message using ModelPricingService
   */
  public estimateMessageCost(message: string, model: string = 'gpt-3.5-turbo'): number {
    const costEstimate = this.modelPricingService.estimateMessageCost(model, message);
    return costEstimate.totalCost;
  }

  /**
   * Record agent cost and update budget
   */
  public async recordAgentCost(
    sessionId: string,
    agentId: string,
    agentName: string,
    model: string,
    tokens: TokenUsage,
    interactionId?: string
  ): Promise<AgentCost> {
    const cost = this.calculateCost(tokens, model);
    
    const agentCost: AgentCost = {
      agentId,
      agentName,
      model,
      tokens,
      cost,
      timestamp: new Date(),
      sessionId,
      interactionId
    };

    // Update session budget
    const budget = this.activeBudgets.get(sessionId);
    if (budget) {
      budget.usedBudget += cost;
      budget.remainingBudget = budget.totalBudget - budget.usedBudget;
      budget.agentCosts.push(agentCost);
      budget.currentExchanges += 1;
      budget.lastUpdated = new Date();

      // Check for budget alerts
      await this.checkBudgetAlerts(budget);

      // Update storage
      await this.storageService.set('session_budgets', sessionId, budget);
    }

    // Update agent metrics
    await this.updateAgentMetrics(agentId, agentName, cost);

    console.log('💰 [TokenEconomics] Recorded cost:', agentName, `$${cost.toFixed(4)}`);
    return agentCost;
  }

  /**
   * Check if agent should engage based on token economics
   */
  public async shouldAgentEngage(
    sessionId: string,
    agentId: string,
    message: string,
    engagementReason: string,
    model: string = 'gpt-3.5-turbo'
  ): Promise<EngagementDecision> {
    const budget = this.activeBudgets.get(sessionId);
    const agentMetrics = this.agentMetrics.get(agentId);
    const estimatedCost = this.estimateMessageCost(message, model);

    // Default decision
    let decision: EngagementDecision = {
      agentId,
      shouldEngage: true,
      confidence: 0.5,
      reasoning: 'Default engagement',
      estimatedCost,
      valueScore: 5,
      tokenJustification: 'Standard response'
    };

    // Budget checks
    if (budget) {
      if (budget.remainingBudget < estimatedCost) {
        decision.shouldEngage = false;
        decision.confidence = 0.9;
        decision.reasoning = 'Insufficient budget remaining';
        decision.tokenJustification = `Estimated cost $${estimatedCost.toFixed(4)} exceeds remaining budget $${budget.remainingBudget.toFixed(4)}`;
        return decision;
      }

      if (budget.currentExchanges >= budget.maxAgentExchanges) {
        decision.shouldEngage = false;
        decision.confidence = 0.8;
        decision.reasoning = 'Maximum agent exchanges reached';
        decision.tokenJustification = `Already at ${budget.currentExchanges}/${budget.maxAgentExchanges} exchanges`;
        return decision;
      }
    }

    // Agent performance checks
    if (agentMetrics) {
      const costEfficiencyThreshold = 0.01; // $0.01 per interaction
      if (agentMetrics.averageCost > costEfficiencyThreshold && agentMetrics.valueAddScore < 6) {
        decision.shouldEngage = false;
        decision.confidence = 0.7;
        decision.reasoning = 'Poor cost-benefit ratio';
        decision.tokenJustification = `Agent has low value score (${agentMetrics.valueAddScore}/10) with high average cost ($${agentMetrics.averageCost.toFixed(4)})`;
        return decision;
      }
    }

    // Engagement reason analysis
    const highValueReasons = [
      'factual_error', 'safety_concern', 'expertise_gap', 
      'logical_inconsistency', 'missing_perspective'
    ];
    
    const lowValueReasons = [
      'agreement', 'minor_clarification', 'social_pleasantry'
    ];

    if (highValueReasons.some(reason => engagementReason.includes(reason))) {
      decision.valueScore = 9;
      decision.confidence = 0.9;
      decision.reasoning = 'High-value engagement detected';
      decision.tokenJustification = `Important contribution: ${engagementReason}`;
    } else if (lowValueReasons.some(reason => engagementReason.includes(reason))) {
      decision.shouldEngage = false;
      decision.valueScore = 2;
      decision.confidence = 0.8;
      decision.reasoning = 'Low-value engagement detected';
      decision.tokenJustification = `Not worth the cost: ${engagementReason}`;
    }

    return decision;
  }

  /**
   * Get session budget status
   */
  public getSessionBudget(sessionId: string): SessionBudget | null {
    return this.activeBudgets.get(sessionId) || null;
  }

  /**
   * Get agent engagement metrics
   */
  public getAgentMetrics(agentId: string): AgentEngagementMetrics | null {
    return this.agentMetrics.get(agentId) || null;
  }

  /**
   * Update agent engagement metrics
   */
  private async updateAgentMetrics(
    agentId: string,
    agentName: string,
    cost: number,
    valueScore: number = 5
  ): Promise<void> {
    let metrics = this.agentMetrics.get(agentId);
    
    if (!metrics) {
      metrics = {
        agentId,
        agentName,
        totalInteractions: 0,
        totalCost: 0,
        averageCost: 0,
        valueAddScore: 5,
        tokenEfficiency: 0,
        engagementAppropriatenesss: 5,
        userSatisfactionScore: 3,
        costBenefitRatio: 1,
        lastActivity: new Date()
      };
    }

    metrics.totalInteractions += 1;
    metrics.totalCost += cost;
    metrics.averageCost = metrics.totalCost / metrics.totalInteractions;
    metrics.valueAddScore = (metrics.valueAddScore * 0.9) + (valueScore * 0.1); // Weighted average
    metrics.tokenEfficiency = metrics.totalCost / Math.max(metrics.totalInteractions, 1);
    metrics.costBenefitRatio = metrics.valueAddScore / Math.max(metrics.averageCost * 100, 0.01);
    metrics.lastActivity = new Date();

    this.agentMetrics.set(agentId, metrics);
    await this.storageService.set('agent_metrics', agentId, metrics);
  }

  /**
   * Check for budget alerts
   */
  private async checkBudgetAlerts(budget: SessionBudget): Promise<void> {
    const usagePercentage = budget.usedBudget / budget.totalBudget;
    
    if (usagePercentage >= budget.alertThresholds.critical) {
      await this.createBudgetAlert(budget, 'critical', 
        `Critical: ${(usagePercentage * 100).toFixed(1)}% of budget used`,
        'Consider stopping conversation or increasing budget'
      );
    } else if (usagePercentage >= budget.alertThresholds.warning) {
      await this.createBudgetAlert(budget, 'warning',
        `Warning: ${(usagePercentage * 100).toFixed(1)}% of budget used`,
        'Monitor remaining interactions carefully'
      );
    }

    if (budget.currentExchanges >= budget.maxAgentExchanges * 0.8) {
      await this.createBudgetAlert(budget, 'warning',
        `Approaching exchange limit: ${budget.currentExchanges}/${budget.maxAgentExchanges}`,
        'Consider wrapping up the conversation'
      );
    }
  }

  /**
   * Create budget alert
   */
  private async createBudgetAlert(
    budget: SessionBudget,
    type: TokenBudgetAlert['type'],
    message: string,
    suggestedAction: string
  ): Promise<void> {
    const alert: TokenBudgetAlert = {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: budget.sessionId,
      userId: budget.userId,
      type,
      message,
      currentUsage: budget.usedBudget,
      budgetLimit: budget.totalBudget,
      suggestedAction,
      timestamp: new Date(),
      acknowledged: false
    };

    await this.storageService.set('budget_alerts', alert.alertId, alert);
    console.log(`🚨 [TokenEconomics] Budget alert: ${message}`);
  }

  /**
   * Load active budgets from storage
   */
  private async loadActiveBudgets(): Promise<void> {
    try {
      // This would need proper indexing in production
      console.log('💰 [TokenEconomics] Loading active budgets...');
    } catch (error) {
      console.error('❌ [TokenEconomics] Error loading budgets:', error);
    }
  }

  /**
   * Load agent metrics from storage
   */
  private async loadAgentMetrics(): Promise<void> {
    try {
      // This would need proper indexing in production
      console.log('💰 [TokenEconomics] Loading agent metrics...');
    } catch (error) {
      console.error('❌ [TokenEconomics] Error loading metrics:', error);
    }
  }

  /**
   * Get budget summary for UI
   */
  public getBudgetSummary(sessionId: string): {
    totalBudget: number;
    usedBudget: number;
    remainingBudget: number;
    usagePercentage: number;
    exchangesUsed: number;
    maxExchanges: number;
    status: 'good' | 'warning' | 'critical';
  } | null {
    const budget = this.activeBudgets.get(sessionId);
    if (!budget) return null;

    const usagePercentage = (budget.usedBudget / budget.totalBudget) * 100;
    let status: 'good' | 'warning' | 'critical' = 'good';
    
    if (usagePercentage >= budget.alertThresholds.critical * 100) {
      status = 'critical';
    } else if (usagePercentage >= budget.alertThresholds.warning * 100) {
      status = 'warning';
    }

    return {
      totalBudget: budget.totalBudget,
      usedBudget: budget.usedBudget,
      remainingBudget: budget.remainingBudget,
      usagePercentage,
      exchangesUsed: budget.currentExchanges,
      maxExchanges: budget.maxAgentExchanges,
      status
    };
  }
}

export default TokenEconomicsService;

