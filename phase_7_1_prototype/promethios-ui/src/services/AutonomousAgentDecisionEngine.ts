/**
 * AutonomousAgentDecisionEngine - Intelligent agent self-management and decision making
 * Part of the revolutionary multi-agent autonomous research system
 */

import { TokenEconomicsService, EngagementDecision, AgentEngagementMetrics } from './TokenEconomicsService';
import { ModelPricingService, ModelComparison } from './ModelPricingService';
import { UnifiedStorageService } from './UnifiedStorageService';

export interface AutonomousDecisionContext {
  sessionId: string;
  userId: string;
  currentMessage: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    agentId?: string;
    timestamp: Date;
    cost?: number;
  }>;
  availableAgents: Array<{
    agentId: string;
    name: string;
    model: string;
    specialization: string[];
    currentLoad: number; // 0-1
    averageResponseTime: number;
    qualityScore: number; // 1-10
  }>;
  budgetConstraints: {
    totalBudget: number;
    remainingBudget: number;
    maxCostPerInteraction: number;
    prioritizeQuality: boolean; // vs cost
  };
  userPreferences: {
    preferredAgents: string[];
    qualityThreshold: number; // 1-10
    maxWaitTime: number; // seconds
    costSensitivity: 'low' | 'medium' | 'high';
  };
}

export interface AutonomousDecision {
  decisionId: string;
  timestamp: Date;
  selectedAgents: Array<{
    agentId: string;
    name: string;
    model: string;
    estimatedCost: number;
    expectedQuality: number;
    reasoning: string;
    priority: number; // 1-10
  }>;
  rejectedAgents: Array<{
    agentId: string;
    reason: string;
    alternativeModel?: string;
  }>;
  totalEstimatedCost: number;
  expectedOutcome: {
    qualityScore: number;
    completionTime: number;
    costEfficiency: number;
  };
  decisionReasoning: string;
  confidence: number; // 0-1
  fallbackStrategy?: {
    condition: string;
    action: string;
    alternativeAgents: string[];
  };
}

export interface AgentNegotiation {
  negotiationId: string;
  participants: string[];
  topic: string;
  proposals: Array<{
    agentId: string;
    proposal: {
      costShare: number;
      workloadShare: number;
      expectedContribution: string;
      qualityGuarantee: number;
    };
    timestamp: Date;
  }>;
  finalAgreement?: {
    agentAllocations: Record<string, {
      costShare: number;
      workloadShare: number;
      responsibilities: string[];
    }>;
    totalCost: number;
    expectedQuality: number;
    completionDeadline: Date;
  };
  status: 'negotiating' | 'agreed' | 'failed' | 'executing';
}

export interface LearningPattern {
  patternId: string;
  userId: string;
  context: {
    messageType: string;
    complexity: 'simple' | 'medium' | 'complex';
    domain: string;
    timeOfDay: string;
    urgency: 'low' | 'medium' | 'high';
  };
  userFeedback: {
    satisfactionScore: number; // 1-5
    costAcceptable: boolean;
    qualityMet: boolean;
    speedAcceptable: boolean;
    wouldUseAgain: boolean;
  };
  agentPerformance: {
    agentId: string;
    actualCost: number;
    actualQuality: number;
    responseTime: number;
    userRating: number;
  };
  learnedPreferences: {
    preferredCostRange: [number, number];
    qualityExpectation: number;
    speedExpectation: number;
    agentPreference: number; // -1 to 1
  };
  confidence: number; // How confident we are in this pattern
  occurrences: number; // How many times we've seen this pattern
  lastUpdated: Date;
}

export class AutonomousAgentDecisionEngine {
  private static instance: AutonomousAgentDecisionEngine;
  private tokenEconomics: TokenEconomicsService;
  private modelPricing: ModelPricingService;
  private storage: UnifiedStorageService;
  private learningPatterns = new Map<string, LearningPattern>();
  private activeNegotiations = new Map<string, AgentNegotiation>();
  private decisionHistory: AutonomousDecision[] = [];

  private constructor() {
    this.tokenEconomics = TokenEconomicsService.getInstance();
    this.modelPricing = ModelPricingService.getInstance();
    this.storage = UnifiedStorageService.getInstance();
    this.initializeEngine();
  }

  public static getInstance(): AutonomousAgentDecisionEngine {
    if (!AutonomousAgentDecisionEngine.instance) {
      AutonomousAgentDecisionEngine.instance = new AutonomousAgentDecisionEngine();
    }
    return AutonomousAgentDecisionEngine.instance;
  }

  private async initializeEngine(): Promise<void> {
    try {
      console.log('🤖 [AutonomousDecision] Initializing Autonomous Agent Decision Engine');
      
      // Load learning patterns and decision history
      await this.loadLearningPatterns();
      await this.loadDecisionHistory();
      
      console.log('✅ [AutonomousDecision] Engine initialized successfully');
    } catch (error) {
      console.error('❌ [AutonomousDecision] Error initializing engine:', error);
    }
  }

  /**
   * Make autonomous decision about which agents should engage
   */
  public async makeAutonomousDecision(context: AutonomousDecisionContext): Promise<AutonomousDecision> {
    console.log('🤖 [AutonomousDecision] Making autonomous decision for session:', context.sessionId);

    const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Analyze the context and user preferences
    const contextAnalysis = await this.analyzeContext(context);
    
    // Get agent recommendations based on learned patterns
    const agentRecommendations = await this.getAgentRecommendations(context, contextAnalysis);
    
    // Perform cost-benefit analysis
    const costBenefitAnalysis = await this.performCostBenefitAnalysis(context, agentRecommendations);
    
    // Make final selection
    const selectedAgents = await this.selectOptimalAgents(context, costBenefitAnalysis);
    
    // Create decision object
    const decision: AutonomousDecision = {
      decisionId,
      timestamp: new Date(),
      selectedAgents: selectedAgents.selected,
      rejectedAgents: selectedAgents.rejected,
      totalEstimatedCost: selectedAgents.selected.reduce((sum, agent) => sum + agent.estimatedCost, 0),
      expectedOutcome: {
        qualityScore: selectedAgents.selected.reduce((sum, agent) => sum + agent.expectedQuality, 0) / selectedAgents.selected.length,
        completionTime: Math.max(...selectedAgents.selected.map(agent => context.availableAgents.find(a => a.agentId === agent.agentId)?.averageResponseTime || 5)),
        costEfficiency: this.calculateCostEfficiency(selectedAgents.selected)
      },
      decisionReasoning: this.generateDecisionReasoning(context, selectedAgents),
      confidence: this.calculateDecisionConfidence(context, selectedAgents),
      fallbackStrategy: await this.createFallbackStrategy(context, selectedAgents)
    };

    // Store decision for learning
    this.decisionHistory.push(decision);
    await this.storage.set('autonomous_decisions', decisionId, decision);

    console.log('✅ [AutonomousDecision] Decision made:', decision.selectedAgents.length, 'agents selected');
    return decision;
  }

  /**
   * Initiate agent negotiation for complex tasks
   */
  public async initiateAgentNegotiation(
    sessionId: string,
    topic: string,
    participantAgents: string[],
    constraints: {
      maxTotalCost: number;
      qualityRequirement: number;
      deadline: Date;
    }
  ): Promise<AgentNegotiation> {
    const negotiationId = `negotiation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const negotiation: AgentNegotiation = {
      negotiationId,
      participants: participantAgents,
      topic,
      proposals: [],
      status: 'negotiating'
    };

    // Generate initial proposals from each agent
    for (const agentId of participantAgents) {
      const proposal = await this.generateAgentProposal(agentId, topic, constraints);
      negotiation.proposals.push({
        agentId,
        proposal,
        timestamp: new Date()
      });
    }

    this.activeNegotiations.set(negotiationId, negotiation);
    await this.storage.set('agent_negotiations', negotiationId, negotiation);

    console.log('🤝 [AutonomousDecision] Initiated negotiation:', negotiationId, 'with', participantAgents.length, 'agents');
    return negotiation;
  }

  /**
   * Learn from user feedback to improve future decisions
   */
  public async learnFromFeedback(
    decisionId: string,
    userFeedback: {
      satisfactionScore: number;
      costAcceptable: boolean;
      qualityMet: boolean;
      speedAcceptable: boolean;
      wouldUseAgain: boolean;
      specificComments?: string;
    },
    actualOutcome: {
      actualCost: number;
      actualQuality: number;
      responseTime: number;
      agentPerformance: Array<{
        agentId: string;
        userRating: number;
        effectiveness: number;
      }>;
    }
  ): Promise<void> {
    console.log('📚 [AutonomousDecision] Learning from feedback for decision:', decisionId);

    const decision = this.decisionHistory.find(d => d.decisionId === decisionId);
    if (!decision) {
      console.warn('⚠️ [AutonomousDecision] Decision not found for learning:', decisionId);
      return;
    }

    // Extract context patterns
    const contextPattern = this.extractContextPattern(decision, userFeedback, actualOutcome);
    
    // Update or create learning pattern
    const patternKey = this.generatePatternKey(contextPattern.context);
    const existingPattern = this.learningPatterns.get(patternKey);

    if (existingPattern) {
      // Update existing pattern with new data
      await this.updateLearningPattern(existingPattern, contextPattern, userFeedback, actualOutcome);
    } else {
      // Create new learning pattern
      const newPattern: LearningPattern = {
        patternId: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: contextPattern.userId,
        context: contextPattern.context,
        userFeedback,
        agentPerformance: actualOutcome.agentPerformance[0], // Simplified for now
        learnedPreferences: {
          preferredCostRange: [actualOutcome.actualCost * 0.8, actualOutcome.actualCost * 1.2],
          qualityExpectation: userFeedback.qualityMet ? actualOutcome.actualQuality : actualOutcome.actualQuality + 1,
          speedExpectation: userFeedback.speedAcceptable ? actualOutcome.responseTime : actualOutcome.responseTime * 0.8,
          agentPreference: userFeedback.wouldUseAgain ? 0.5 : -0.5
        },
        confidence: 0.3, // Low confidence for new patterns
        occurrences: 1,
        lastUpdated: new Date()
      };

      this.learningPatterns.set(patternKey, newPattern);
      await this.storage.set('learning_patterns', patternKey, newPattern);
    }

    console.log('✅ [AutonomousDecision] Learning pattern updated for context:', patternKey);
  }

  /**
   * Get autonomous recommendations for agent selection
   */
  public async getAutonomousRecommendations(
    context: AutonomousDecisionContext
  ): Promise<{
    recommendations: Array<{
      agentId: string;
      confidence: number;
      reasoning: string;
      estimatedValue: number;
    }>;
    learningInsights: {
      patternsFound: number;
      confidenceLevel: number;
      recommendations: string[];
    };
  }> {
    const contextKey = this.generatePatternKey({
      messageType: this.classifyMessageType(context.currentMessage),
      complexity: this.assessComplexity(context.currentMessage),
      domain: this.identifyDomain(context.currentMessage),
      timeOfDay: new Date().getHours().toString(),
      urgency: this.assessUrgency(context.currentMessage)
    });

    const relevantPatterns = Array.from(this.learningPatterns.values())
      .filter(pattern => pattern.userId === context.userId)
      .filter(pattern => this.isPatternRelevant(pattern, contextKey))
      .sort((a, b) => b.confidence - a.confidence);

    const recommendations = context.availableAgents.map(agent => {
      const agentPatterns = relevantPatterns.filter(p => 
        p.agentPerformance.agentId === agent.agentId
      );

      let confidence = 0.5; // Base confidence
      let estimatedValue = agent.qualityScore;
      let reasoning = 'No historical data available';

      if (agentPatterns.length > 0) {
        const avgSatisfaction = agentPatterns.reduce((sum, p) => sum + p.userFeedback.satisfactionScore, 0) / agentPatterns.length;
        const avgRating = agentPatterns.reduce((sum, p) => sum + p.agentPerformance.userRating, 0) / agentPatterns.length;
        
        confidence = Math.min(0.9, 0.3 + (agentPatterns.length * 0.1));
        estimatedValue = (avgSatisfaction * 2) + avgRating; // Scale to 1-10
        reasoning = `Based on ${agentPatterns.length} previous interactions (avg satisfaction: ${avgSatisfaction.toFixed(1)})`;
      }

      return {
        agentId: agent.agentId,
        confidence,
        reasoning,
        estimatedValue
      };
    }).sort((a, b) => b.estimatedValue - a.estimatedValue);

    return {
      recommendations,
      learningInsights: {
        patternsFound: relevantPatterns.length,
        confidenceLevel: relevantPatterns.length > 0 ? relevantPatterns[0].confidence : 0,
        recommendations: this.generateLearningRecommendations(relevantPatterns)
      }
    };
  }

  // Private helper methods

  private async analyzeContext(context: AutonomousDecisionContext): Promise<{
    messageType: string;
    complexity: string;
    domain: string;
    urgency: string;
    estimatedTokens: number;
  }> {
    return {
      messageType: this.classifyMessageType(context.currentMessage),
      complexity: this.assessComplexity(context.currentMessage),
      domain: this.identifyDomain(context.currentMessage),
      urgency: this.assessUrgency(context.currentMessage),
      estimatedTokens: Math.ceil(context.currentMessage.length / 4)
    };
  }

  private async getAgentRecommendations(
    context: AutonomousDecisionContext,
    analysis: any
  ): Promise<Array<{
    agentId: string;
    score: number;
    reasoning: string;
  }>> {
    const recommendations = [];

    for (const agent of context.availableAgents) {
      let score = agent.qualityScore; // Base score
      let reasoning = `Base quality score: ${agent.qualityScore}`;

      // Adjust for specialization match
      if (agent.specialization.some(spec => analysis.domain.includes(spec.toLowerCase()))) {
        score += 2;
        reasoning += `, specialization match (+2)`;
      }

      // Adjust for current load
      if (agent.currentLoad < 0.5) {
        score += 1;
        reasoning += `, low load (+1)`;
      } else if (agent.currentLoad > 0.8) {
        score -= 1;
        reasoning += `, high load (-1)`;
      }

      // Adjust for user preferences
      if (context.userPreferences.preferredAgents.includes(agent.agentId)) {
        score += 1.5;
        reasoning += `, user preference (+1.5)`;
      }

      recommendations.push({
        agentId: agent.agentId,
        score,
        reasoning
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async performCostBenefitAnalysis(
    context: AutonomousDecisionContext,
    recommendations: Array<{ agentId: string; score: number; reasoning: string }>
  ): Promise<Array<{
    agentId: string;
    costBenefitRatio: number;
    estimatedCost: number;
    expectedQuality: number;
    recommendation: 'strong' | 'moderate' | 'weak';
  }>> {
    const analysis = [];

    for (const rec of recommendations) {
      const agent = context.availableAgents.find(a => a.agentId === rec.agentId);
      if (!agent) continue;

      const estimatedCost = this.modelPricing.estimateMessageCost(agent.model, context.currentMessage).totalCost;
      const expectedQuality = rec.score;
      const costBenefitRatio = expectedQuality / Math.max(estimatedCost * 1000, 0.01); // Scale cost for ratio

      let recommendation: 'strong' | 'moderate' | 'weak' = 'weak';
      if (costBenefitRatio > 100 && estimatedCost <= context.budgetConstraints.maxCostPerInteraction) {
        recommendation = 'strong';
      } else if (costBenefitRatio > 50) {
        recommendation = 'moderate';
      }

      analysis.push({
        agentId: rec.agentId,
        costBenefitRatio,
        estimatedCost,
        expectedQuality,
        recommendation
      });
    }

    return analysis.sort((a, b) => b.costBenefitRatio - a.costBenefitRatio);
  }

  private async selectOptimalAgents(
    context: AutonomousDecisionContext,
    analysis: Array<{
      agentId: string;
      costBenefitRatio: number;
      estimatedCost: number;
      expectedQuality: number;
      recommendation: 'strong' | 'moderate' | 'weak';
    }>
  ): Promise<{
    selected: Array<{
      agentId: string;
      name: string;
      model: string;
      estimatedCost: number;
      expectedQuality: number;
      reasoning: string;
      priority: number;
    }>;
    rejected: Array<{
      agentId: string;
      reason: string;
      alternativeModel?: string;
    }>;
  }> {
    const selected = [];
    const rejected = [];
    let totalCost = 0;

    // Sort by recommendation strength and cost-benefit ratio
    const sortedAnalysis = analysis.sort((a, b) => {
      const strengthOrder = { 'strong': 3, 'moderate': 2, 'weak': 1 };
      const strengthDiff = strengthOrder[b.recommendation] - strengthOrder[a.recommendation];
      if (strengthDiff !== 0) return strengthDiff;
      return b.costBenefitRatio - a.costBenefitRatio;
    });

    for (let i = 0; i < sortedAnalysis.length; i++) {
      const item = sortedAnalysis[i];
      const agent = context.availableAgents.find(a => a.agentId === item.agentId);
      if (!agent) continue;

      // Check budget constraints
      if (totalCost + item.estimatedCost > context.budgetConstraints.remainingBudget) {
        rejected.push({
          agentId: item.agentId,
          reason: `Budget constraint: would exceed remaining budget ($${context.budgetConstraints.remainingBudget.toFixed(4)})`
        });
        continue;
      }

      // Check quality threshold
      if (item.expectedQuality < context.userPreferences.qualityThreshold) {
        rejected.push({
          agentId: item.agentId,
          reason: `Quality below threshold: ${item.expectedQuality} < ${context.userPreferences.qualityThreshold}`
        });
        continue;
      }

      // Select agent
      selected.push({
        agentId: item.agentId,
        name: agent.name,
        model: agent.model,
        estimatedCost: item.estimatedCost,
        expectedQuality: item.expectedQuality,
        reasoning: `Cost-benefit ratio: ${item.costBenefitRatio.toFixed(2)}, recommendation: ${item.recommendation}`,
        priority: selected.length + 1
      });

      totalCost += item.estimatedCost;

      // Limit number of agents based on complexity and budget
      const maxAgents = context.budgetConstraints.prioritizeQuality ? 3 : 2;
      if (selected.length >= maxAgents) break;
    }

    // If no agents selected, select the best available within budget
    if (selected.length === 0 && analysis.length > 0) {
      const cheapest = analysis.reduce((min, current) => 
        current.estimatedCost < min.estimatedCost ? current : min
      );

      if (cheapest.estimatedCost <= context.budgetConstraints.remainingBudget) {
        const agent = context.availableAgents.find(a => a.agentId === cheapest.agentId);
        if (agent) {
          selected.push({
            agentId: cheapest.agentId,
            name: agent.name,
            model: agent.model,
            estimatedCost: cheapest.estimatedCost,
            expectedQuality: cheapest.expectedQuality,
            reasoning: 'Fallback selection: cheapest available option within budget',
            priority: 1
          });
        }
      }
    }

    return { selected, rejected };
  }

  private generateDecisionReasoning(
    context: AutonomousDecisionContext,
    selection: any
  ): string {
    const reasons = [];
    
    if (selection.selected.length === 0) {
      reasons.push('No agents selected due to budget or quality constraints');
    } else {
      reasons.push(`Selected ${selection.selected.length} agent(s) based on cost-benefit analysis`);
      
      if (context.budgetConstraints.prioritizeQuality) {
        reasons.push('Quality prioritized over cost');
      } else {
        reasons.push('Cost efficiency prioritized');
      }

      const totalCost = selection.selected.reduce((sum: number, agent: any) => sum + agent.estimatedCost, 0);
      const budgetUsage = (totalCost / context.budgetConstraints.remainingBudget) * 100;
      reasons.push(`Budget usage: ${budgetUsage.toFixed(1)}%`);
    }

    return reasons.join('. ');
  }

  private calculateDecisionConfidence(context: AutonomousDecisionContext, selection: any): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on available data
    const relevantPatterns = Array.from(this.learningPatterns.values())
      .filter(pattern => pattern.userId === context.userId);
    
    if (relevantPatterns.length > 5) confidence += 0.2;
    if (relevantPatterns.length > 10) confidence += 0.1;

    // Increase confidence if agents are well-known
    const knownAgents = selection.selected.filter((agent: any) => 
      context.userPreferences.preferredAgents.includes(agent.agentId)
    );
    confidence += (knownAgents.length / selection.selected.length) * 0.2;

    // Decrease confidence if budget is very tight
    const totalCost = selection.selected.reduce((sum: number, agent: any) => sum + agent.estimatedCost, 0);
    const budgetUsage = totalCost / context.budgetConstraints.remainingBudget;
    if (budgetUsage > 0.8) confidence -= 0.1;

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  private async createFallbackStrategy(context: AutonomousDecisionContext, selection: any): Promise<any> {
    if (selection.selected.length === 0) {
      return {
        condition: 'No agents selected',
        action: 'Request budget increase or lower quality threshold',
        alternativeAgents: context.availableAgents.slice(0, 2).map(a => a.agentId)
      };
    }

    return {
      condition: 'Selected agents fail to respond',
      action: 'Fallback to cheaper alternatives',
      alternativeAgents: context.availableAgents
        .filter(a => !selection.selected.some((s: any) => s.agentId === a.agentId))
        .slice(0, 2)
        .map(a => a.agentId)
    };
  }

  private calculateCostEfficiency(selectedAgents: any[]): number {
    if (selectedAgents.length === 0) return 0;
    
    const totalCost = selectedAgents.reduce((sum, agent) => sum + agent.estimatedCost, 0);
    const avgQuality = selectedAgents.reduce((sum, agent) => sum + agent.expectedQuality, 0) / selectedAgents.length;
    
    return avgQuality / Math.max(totalCost * 1000, 0.01); // Scale for readability
  }

  private async generateAgentProposal(agentId: string, topic: string, constraints: any): Promise<any> {
    // Simplified proposal generation
    return {
      costShare: Math.random() * 0.5 + 0.25, // 25-75%
      workloadShare: Math.random() * 0.4 + 0.3, // 30-70%
      expectedContribution: `Specialized analysis for ${topic}`,
      qualityGuarantee: Math.random() * 3 + 7 // 7-10
    };
  }

  private classifyMessageType(message: string): string {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('analyze') || lowerMessage.includes('research')) return 'analysis';
    if (lowerMessage.includes('create') || lowerMessage.includes('generate')) return 'creation';
    if (lowerMessage.includes('explain') || lowerMessage.includes('how')) return 'explanation';
    if (lowerMessage.includes('compare') || lowerMessage.includes('versus')) return 'comparison';
    return 'general';
  }

  private assessComplexity(message: string): 'simple' | 'medium' | 'complex' {
    const wordCount = message.split(' ').length;
    const hasComplexTerms = /\b(analyze|research|comprehensive|detailed|complex|multi|various|several)\b/i.test(message);
    
    if (wordCount > 50 || hasComplexTerms) return 'complex';
    if (wordCount > 20) return 'medium';
    return 'simple';
  }

  private identifyDomain(message: string): string {
    const lowerMessage = message.toLowerCase();
    if (/\b(code|programming|software|development|api|database)\b/.test(lowerMessage)) return 'technology';
    if (/\b(business|market|finance|economy|strategy|sales)\b/.test(lowerMessage)) return 'business';
    if (/\b(science|research|study|analysis|data|statistics)\b/.test(lowerMessage)) return 'research';
    if (/\b(creative|design|art|writing|content|story)\b/.test(lowerMessage)) return 'creative';
    return 'general';
  }

  private assessUrgency(message: string): 'low' | 'medium' | 'high' {
    const urgentWords = /\b(urgent|asap|immediately|quickly|fast|rush|deadline|emergency)\b/i;
    if (urgentWords.test(message)) return 'high';
    
    const moderateWords = /\b(soon|today|this week|priority|important)\b/i;
    if (moderateWords.test(message)) return 'medium';
    
    return 'low';
  }

  private generatePatternKey(context: any): string {
    return `${context.messageType}_${context.complexity}_${context.domain}_${context.urgency}`;
  }

  private isPatternRelevant(pattern: LearningPattern, contextKey: string): boolean {
    const patternKey = this.generatePatternKey(pattern.context);
    return patternKey === contextKey || patternKey.split('_').some(part => contextKey.includes(part));
  }

  private extractContextPattern(decision: AutonomousDecision, feedback: any, outcome: any): any {
    // Simplified context extraction
    return {
      userId: 'user', // Would be extracted from decision context
      context: {
        messageType: 'general',
        complexity: 'medium',
        domain: 'general',
        timeOfDay: new Date().getHours().toString(),
        urgency: 'medium'
      }
    };
  }

  private async updateLearningPattern(
    existingPattern: LearningPattern,
    contextPattern: any,
    feedback: any,
    outcome: any
  ): Promise<void> {
    // Update pattern with weighted averages
    existingPattern.occurrences += 1;
    existingPattern.confidence = Math.min(0.95, existingPattern.confidence + 0.05);
    
    // Update learned preferences with weighted average
    const weight = 0.2; // How much new data influences the pattern
    existingPattern.learnedPreferences.qualityExpectation = 
      (existingPattern.learnedPreferences.qualityExpectation * (1 - weight)) + 
      (outcome.actualQuality * weight);
    
    existingPattern.lastUpdated = new Date();
    
    await this.storage.set('learning_patterns', this.generatePatternKey(existingPattern.context), existingPattern);
  }

  private generateLearningRecommendations(patterns: LearningPattern[]): string[] {
    const recommendations = [];
    
    if (patterns.length === 0) {
      recommendations.push('No historical patterns found - decisions based on general heuristics');
    } else {
      const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
      recommendations.push(`${patterns.length} relevant patterns found with ${(avgConfidence * 100).toFixed(0)}% confidence`);
      
      const highSatisfactionPatterns = patterns.filter(p => p.userFeedback.satisfactionScore >= 4);
      if (highSatisfactionPatterns.length > 0) {
        recommendations.push(`${highSatisfactionPatterns.length} patterns show high user satisfaction`);
      }
    }
    
    return recommendations;
  }

  private async loadLearningPatterns(): Promise<void> {
    try {
      console.log('📚 [AutonomousDecision] Loading learning patterns...');
      // In production, this would load from storage with proper indexing
    } catch (error) {
      console.error('❌ [AutonomousDecision] Error loading learning patterns:', error);
    }
  }

  private async loadDecisionHistory(): Promise<void> {
    try {
      console.log('📊 [AutonomousDecision] Loading decision history...');
      // In production, this would load from storage with proper indexing
    } catch (error) {
      console.error('❌ [AutonomousDecision] Error loading decision history:', error);
    }
  }
}

export default AutonomousAgentDecisionEngine;

