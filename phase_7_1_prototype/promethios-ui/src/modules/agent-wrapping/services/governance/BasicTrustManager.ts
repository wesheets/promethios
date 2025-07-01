/**
 * Basic Trust Manager
 * 
 * Implementation of trust management for the governance engine.
 * Manages trust scores, evaluates trust factors, and maintains
 * trust history for deployed agents.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import {
  TrustManager,
  TrustEvaluation,
  TrustFactorEvaluation,
  TrustHistoryEntry,
  TrustScoreChange
} from '../../types/governance';
import {
  TrustConfiguration,
  TrustFactor,
  AgentInteraction,
  GovernedInteractionResult
} from '../../types/dualWrapper';

/**
 * Basic trust manager implementation
 */
export class BasicTrustManager implements TrustManager {
  private trustConfig: TrustConfiguration;
  private trustScores: Map<string, number> = new Map();
  private trustHistory: Map<string, TrustHistoryEntry[]> = new Map();
  private factorCache: Map<string, Map<string, number>> = new Map();
  private lastEvaluation: Map<string, Date> = new Map();

  constructor(trustConfig: TrustConfiguration) {
    this.trustConfig = trustConfig;
  }

  /**
   * Get current trust score for an agent
   */
  async getTrustScore(agentId: string): Promise<number> {
    let score = this.trustScores.get(agentId);
    
    if (score === undefined) {
      // Initialize with initial score
      score = this.trustConfig.initialScore;
      this.trustScores.set(agentId, score);
      
      await this.recordTrustChange(agentId, 0, score, 'Initial trust score set');
    }

    // Apply decay if enough time has passed
    await this.applyTrustDecay(agentId);

    return this.trustScores.get(agentId) || this.trustConfig.initialScore;
  }

  /**
   * Update trust score based on an interaction and its result
   */
  async updateTrustScore(
    agentId: string,
    interaction: AgentInteraction,
    result: GovernedInteractionResult
  ): Promise<number> {
    const currentScore = await this.getTrustScore(agentId);
    
    // Calculate trust factor impacts
    const factorImpacts = await this.calculateFactorImpacts(agentId, interaction, result);
    
    // Calculate new score based on factor weights
    let scoreChange = 0;
    for (const [factorName, impact] of factorImpacts) {
      const factor = this.trustConfig.factors.find(f => f.name === factorName);
      if (factor) {
        scoreChange += impact * factor.weight;
      }
    }

    // Apply recovery rate for positive changes, decay rate for negative
    if (scoreChange > 0) {
      scoreChange *= this.trustConfig.recoveryRate;
    } else {
      scoreChange *= (1 + this.trustConfig.decayRate);
    }

    const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
    this.trustScores.set(agentId, newScore);

    // Record the change
    await this.recordTrustChange(
      agentId,
      currentScore,
      newScore,
      `Interaction result: ${result.action}`,
      factorImpacts
    );

    console.log(`🎯 Trust score updated for ${agentId}: ${currentScore.toFixed(1)} → ${newScore.toFixed(1)} (${scoreChange > 0 ? '+' : ''}${scoreChange.toFixed(1)})`);

    return newScore;
  }

  /**
   * Get minimum trust threshold
   */
  getMinimumThreshold(): number {
    return this.trustConfig.minimumThreshold;
  }

  /**
   * Evaluate trust factors for an agent
   */
  async evaluateTrustFactors(agentId: string): Promise<TrustEvaluation> {
    const currentScore = await this.getTrustScore(agentId);
    const history = this.trustHistory.get(agentId) || [];
    const previousScore = history.length > 1 ? history[history.length - 2].score : currentScore;
    
    const factorEvaluations: TrustFactorEvaluation[] = [];
    
    for (const factor of this.trustConfig.factors) {
      const evaluation = await this.evaluateTrustFactor(agentId, factor);
      factorEvaluations.push(evaluation);
    }

    const recommendations = this.generateTrustRecommendations(currentScore, factorEvaluations);
    const nextEvaluation = new Date(Date.now() + this.trustConfig.evaluationInterval * 60 * 1000);

    return {
      currentScore,
      previousScore,
      change: currentScore - previousScore,
      factors: factorEvaluations,
      recommendations,
      nextEvaluation,
    };
  }

  /**
   * Reset trust score for an agent
   */
  async resetTrustScore(agentId: string, reason: string): Promise<void> {
    const currentScore = await this.getTrustScore(agentId);
    const newScore = this.trustConfig.initialScore;
    
    this.trustScores.set(agentId, newScore);
    
    await this.recordTrustChange(agentId, currentScore, newScore, `Reset: ${reason}`);
    
    // Clear factor cache
    this.factorCache.delete(agentId);
    
    console.log(`🔄 Trust score reset for ${agentId}: ${currentScore.toFixed(1)} → ${newScore.toFixed(1)} (${reason})`);
  }

  /**
   * Get trust history for an agent
   */
  async getTrustHistory(agentId: string, days: number = 30): Promise<TrustHistoryEntry[]> {
    const history = this.trustHistory.get(agentId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return history.filter(entry => entry.timestamp >= cutoffDate);
  }

  // Private helper methods

  /**
   * Apply trust decay based on time elapsed
   */
  private async applyTrustDecay(agentId: string): Promise<void> {
    const lastEval = this.lastEvaluation.get(agentId);
    const now = new Date();
    
    if (!lastEval) {
      this.lastEvaluation.set(agentId, now);
      return;
    }

    const timeDiff = now.getTime() - lastEval.getTime();
    const hoursSinceLastEval = timeDiff / (1000 * 60 * 60);
    
    // Apply decay if more than evaluation interval has passed
    if (hoursSinceLastEval >= (this.trustConfig.evaluationInterval / 60)) {
      const currentScore = this.trustScores.get(agentId) || this.trustConfig.initialScore;
      const decayAmount = this.trustConfig.decayRate * (hoursSinceLastEval / 24); // Daily decay rate
      const newScore = Math.max(0, currentScore - decayAmount);
      
      if (newScore !== currentScore) {
        this.trustScores.set(agentId, newScore);
        await this.recordTrustChange(
          agentId,
          currentScore,
          newScore,
          `Time-based decay: ${hoursSinceLastEval.toFixed(1)} hours inactive`
        );
      }
      
      this.lastEvaluation.set(agentId, now);
    }
  }

  /**
   * Calculate factor impacts based on interaction and result
   */
  private async calculateFactorImpacts(
    agentId: string,
    interaction: AgentInteraction,
    result: GovernedInteractionResult
  ): Promise<Map<string, number>> {
    const impacts = new Map<string, number>();
    
    for (const factor of this.trustConfig.factors) {
      const impact = await this.calculateSingleFactorImpact(agentId, factor, interaction, result);
      impacts.set(factor.name, impact);
    }
    
    return impacts;
  }

  /**
   * Calculate impact for a single trust factor
   */
  private async calculateSingleFactorImpact(
    agentId: string,
    factor: TrustFactor,
    interaction: AgentInteraction,
    result: GovernedInteractionResult
  ): Promise<number> {
    switch (factor.type) {
      case 'policy_compliance':
        return this.calculatePolicyComplianceImpact(result);
      
      case 'response_quality':
        return this.calculateResponseQualityImpact(interaction, result);
      
      case 'user_feedback':
        return this.calculateUserFeedbackImpact(interaction);
      
      case 'error_rate':
        return this.calculateErrorRateImpact(result);
      
      case 'response_time':
        return this.calculateResponseTimeImpact(result);
      
      case 'custom':
        return this.calculateCustomFactorImpact(factor, interaction, result);
      
      default:
        return 0;
    }
  }

  /**
   * Calculate policy compliance impact
   */
  private calculatePolicyComplianceImpact(result: GovernedInteractionResult): number {
    if (result.violations && result.violations.length > 0) {
      // Negative impact based on violation severity
      const severityImpact = result.violations.reduce((total, violation) => {
        switch (violation.severity) {
          case 'critical': return total - 10;
          case 'high': return total - 5;
          case 'medium': return total - 2;
          case 'low': return total - 1;
          default: return total;
        }
      }, 0);
      return severityImpact;
    } else if (result.allowed) {
      // Small positive impact for compliance
      return 1;
    }
    return 0;
  }

  /**
   * Calculate response quality impact
   */
  private calculateResponseQualityImpact(
    interaction: AgentInteraction,
    result: GovernedInteractionResult
  ): number {
    // Simplified quality assessment based on processing time and modifications
    let impact = 0;
    
    // Faster processing is better (up to a point)
    const processingTime = result.governanceMetadata?.processingTime || 0;
    if (processingTime < 1000) { // Less than 1 second
      impact += 1;
    } else if (processingTime > 5000) { // More than 5 seconds
      impact -= 1;
    }
    
    // Fewer modifications needed is better
    if (result.modifiedInteraction) {
      impact -= 0.5;
    }
    
    return impact;
  }

  /**
   * Calculate user feedback impact
   */
  private calculateUserFeedbackImpact(interaction: AgentInteraction): number {
    // This would integrate with user feedback systems
    // For now, return neutral impact
    return 0;
  }

  /**
   * Calculate error rate impact
   */
  private calculateErrorRateImpact(result: GovernedInteractionResult): number {
    // Successful interactions have positive impact
    if (result.allowed && result.action === 'allowed') {
      return 0.5;
    }
    
    // Blocked interactions have negative impact
    if (result.action === 'blocked') {
      return -1;
    }
    
    return 0;
  }

  /**
   * Calculate response time impact
   */
  private calculateResponseTimeImpact(result: GovernedInteractionResult): number {
    const processingTime = result.governanceMetadata?.processingTime || 0;
    
    // Reward fast responses, penalize slow ones
    if (processingTime < 500) return 1;
    if (processingTime < 1000) return 0.5;
    if (processingTime < 2000) return 0;
    if (processingTime < 5000) return -0.5;
    return -1;
  }

  /**
   * Calculate custom factor impact
   */
  private calculateCustomFactorImpact(
    factor: TrustFactor,
    interaction: AgentInteraction,
    result: GovernedInteractionResult
  ): number {
    // Custom factors would be implemented based on specific requirements
    return 0;
  }

  /**
   * Evaluate a single trust factor
   */
  private async evaluateTrustFactor(agentId: string, factor: TrustFactor): Promise<TrustFactorEvaluation> {
    const factorCache = this.factorCache.get(agentId) || new Map();
    const currentValue = factorCache.get(factor.name) || 50; // Default to neutral
    
    // Calculate trend based on recent history
    const history = this.trustHistory.get(agentId) || [];
    const recentEntries = history.slice(-5); // Last 5 entries
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentEntries.length >= 2) {
      const recentValues = recentEntries.map(entry => entry.factors[factor.name] || 50);
      const firstValue = recentValues[0];
      const lastValue = recentValues[recentValues.length - 1];
      
      if (lastValue > firstValue + 2) trend = 'improving';
      else if (lastValue < firstValue - 2) trend = 'declining';
    }

    return {
      name: factor.name,
      score: currentValue,
      weight: factor.weight,
      contribution: currentValue * factor.weight,
      trend,
      details: {
        type: factor.type,
        recentEntries: recentEntries.length,
      },
    };
  }

  /**
   * Generate trust recommendations
   */
  private generateTrustRecommendations(
    currentScore: number,
    factors: TrustFactorEvaluation[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (currentScore < this.trustConfig.minimumThreshold) {
      recommendations.push('Trust score is below minimum threshold - review recent interactions');
    }
    
    // Find declining factors
    const decliningFactors = factors.filter(f => f.trend === 'declining');
    if (decliningFactors.length > 0) {
      recommendations.push(`Focus on improving: ${decliningFactors.map(f => f.name).join(', ')}`);
    }
    
    // Find low-scoring factors
    const lowFactors = factors.filter(f => f.score < 40);
    if (lowFactors.length > 0) {
      recommendations.push(`Address low-performing factors: ${lowFactors.map(f => f.name).join(', ')}`);
    }
    
    if (currentScore > 80) {
      recommendations.push('Excellent trust score - maintain current performance');
    }
    
    return recommendations;
  }

  /**
   * Record a trust score change
   */
  private async recordTrustChange(
    agentId: string,
    previousScore: number,
    newScore: number,
    reason: string,
    factors?: Map<string, number>
  ): Promise<void> {
    const change: TrustScoreChange = {
      agentId,
      previousScore,
      newScore,
      change: newScore - previousScore,
      reason,
      factors: factors ? Object.fromEntries(factors) : {},
      timestamp: new Date(),
      triggeredBy: 'system',
    };

    const historyEntry: TrustHistoryEntry = {
      timestamp: change.timestamp,
      score: newScore,
      change: change.change,
      reason,
      factors: change.factors,
      metadata: {
        previousScore,
        evaluationMethod: 'automatic',
      },
    };

    // Add to history
    const history = this.trustHistory.get(agentId) || [];
    history.push(historyEntry);
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.trustHistory.set(agentId, history);

    // Update factor cache
    if (factors) {
      this.factorCache.set(agentId, factors);
    }
  }
}

