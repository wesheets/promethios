/**
 * Shared Trust Management Service
 * 
 * Implements sophisticated trust calculation and management with cross-context
 * synchronization. This service ensures that trust scores are consistent
 * across both modern chat and universal governance systems.
 */

import { ITrustManagementService } from '../interfaces/ISharedGovernanceService';
import {
  TrustScore,
  TrustEvent,
  TrustHistory,
  TrustFactor,
  TrustPattern,
  TrustInsight,
  TrustImpact,
  TrustScoreSnapshot,
  GovernanceContext,
  AutonomyLevel
} from '../types/SharedGovernanceTypes';

export class SharedTrustManagementService implements ITrustManagementService {
  private trustScores: Map<string, TrustScore> = new Map();
  private trustHistories: Map<string, TrustHistory> = new Map();
  private context: string;

  // Trust calculation parameters
  private readonly TRUST_FACTORS = {
    consistency: { weight: 0.25, description: 'Behavioral consistency over time' },
    compliance: { weight: 0.30, description: 'Policy compliance rate' },
    transparency: { weight: 0.20, description: 'Transparency in responses' },
    reliability: { weight: 0.15, description: 'Reliability of information' },
    performance: { weight: 0.10, description: 'Overall performance metrics' }
  };

  private readonly AUTONOMY_THRESHOLDS = {
    minimal: 0.3,
    basic: 0.5,
    enhanced: 0.7,
    advanced: 0.85,
    full: 0.95
  };

  constructor(context: string = 'universal') {
    this.context = context;
    console.log(`🤝 [${this.context}] Trust Management Service initialized`);
  }

  // ============================================================================
  // TRUST CALCULATION
  // ============================================================================

  async calculateTrustScore(agentId: string, context?: GovernanceContext): Promise<TrustScore> {
    try {
      console.log(`🧮 [${this.context}] Calculating trust score for agent ${agentId}`);
      
      // Get existing trust score or create new one
      let trustScore = this.trustScores.get(agentId);
      
      if (!trustScore) {
        // Initialize new trust score
        trustScore = {
          agentId,
          currentScore: 0.75, // Start with moderate trust
          previousScore: 0.75,
          trend: 'stable',
          confidence: 0.8,
          lastUpdated: new Date(),
          factors: this.initializeTrustFactors()
        };
        this.trustScores.set(agentId, trustScore);
      }

      // Recalculate trust score based on recent history
      const history = await this.getTrustHistory(agentId);
      const updatedScore = this.recalculateTrustScore(trustScore, history, context);
      
      // Update stored trust score
      this.trustScores.set(agentId, updatedScore);

      console.log(`✅ [${this.context}] Trust score calculated:`, {
        agentId,
        score: updatedScore.currentScore,
        trend: updatedScore.trend,
        confidence: updatedScore.confidence
      });

      return updatedScore;
    } catch (error) {
      console.error(`❌ [${this.context}] Trust score calculation failed:`, error);
      throw new Error(`Trust score calculation failed: ${error.message}`);
    }
  }

  async updateTrustScore(agentId: string, event: TrustEvent): Promise<TrustScore> {
    try {
      console.log(`📈 [${this.context}] Updating trust score for agent ${agentId}:`, {
        eventType: event.eventType,
        impact: event.impact
      });

      // Get current trust score
      let trustScore = await this.calculateTrustScore(agentId, event.context);
      
      // Apply trust event impact
      const impactMultiplier = this.calculateImpactMultiplier(event);
      const scoreChange = event.impact * impactMultiplier;
      
      // Update trust score
      const previousScore = trustScore.currentScore;
      const newScore = Math.max(0, Math.min(1, trustScore.currentScore + scoreChange));
      
      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (newScore > previousScore + 0.01) trend = 'increasing';
      else if (newScore < previousScore - 0.01) trend = 'decreasing';

      // Update trust factors based on event
      const updatedFactors = this.updateTrustFactors(trustScore.factors, event);

      const updatedTrustScore: TrustScore = {
        ...trustScore,
        previousScore: previousScore,
        currentScore: newScore,
        trend,
        confidence: this.calculateConfidence(updatedFactors),
        lastUpdated: new Date(),
        factors: updatedFactors
      };

      // Store updated trust score
      this.trustScores.set(agentId, updatedTrustScore);

      // Add event to trust history
      await this.addTrustEvent(agentId, event);

      console.log(`✅ [${this.context}] Trust score updated:`, {
        agentId,
        previousScore,
        newScore,
        change: newScore - previousScore,
        trend
      });

      return updatedTrustScore;
    } catch (error) {
      console.error(`❌ [${this.context}] Trust score update failed:`, error);
      throw new Error(`Trust score update failed: ${error.message}`);
    }
  }

  async getTrustTrend(agentId: string, timeframe: string): Promise<string> {
    try {
      console.log(`📊 [${this.context}] Getting trust trend for agent ${agentId} (${timeframe})`);
      
      const history = await this.getTrustHistory(agentId);
      const timeframeMs = this.parseTimeframe(timeframe);
      const cutoffDate = new Date(Date.now() - timeframeMs);
      
      // Filter events within timeframe
      const recentEvents = history.events.filter(event => event.timestamp >= cutoffDate);
      
      if (recentEvents.length === 0) {
        return 'stable';
      }

      // Calculate trend based on recent events
      const positiveEvents = recentEvents.filter(e => e.eventType === 'positive').length;
      const negativeEvents = recentEvents.filter(e => e.eventType === 'negative').length;
      
      if (positiveEvents > negativeEvents * 1.5) return 'increasing';
      if (negativeEvents > positiveEvents * 1.5) return 'decreasing';
      return 'stable';
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get trust trend:`, error);
      return 'stable';
    }
  }

  // ============================================================================
  // TRUST HISTORY
  // ============================================================================

  async getTrustHistory(agentId: string, limit?: number): Promise<TrustHistory> {
    try {
      let history = this.trustHistories.get(agentId);
      
      if (!history) {
        // Initialize new trust history
        history = {
          agentId,
          events: [],
          scoreHistory: [],
          patterns: [],
          insights: []
        };
        this.trustHistories.set(agentId, history);
      }

      // Apply limit if specified
      if (limit && history.events.length > limit) {
        history = {
          ...history,
          events: history.events.slice(-limit),
          scoreHistory: history.scoreHistory.slice(-limit)
        };
      }

      console.log(`📚 [${this.context}] Trust history retrieved:`, {
        agentId,
        events: history.events.length,
        snapshots: history.scoreHistory.length
      });

      return history;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get trust history:`, error);
      return {
        agentId,
        events: [],
        scoreHistory: [],
        patterns: [],
        insights: []
      };
    }
  }

  async addTrustEvent(agentId: string, event: TrustEvent): Promise<void> {
    try {
      console.log(`📝 [${this.context}] Adding trust event for agent ${agentId}`);
      
      let history = await this.getTrustHistory(agentId);
      
      // Add event to history
      history.events.push(event);
      
      // Add score snapshot
      const currentScore = this.trustScores.get(agentId);
      if (currentScore) {
        const snapshot: TrustScoreSnapshot = {
          score: currentScore.currentScore,
          timestamp: new Date(),
          context: event.description,
          factors: [...currentScore.factors]
        };
        history.scoreHistory.push(snapshot);
      }

      // Update patterns and insights
      history.patterns = await this.analyzeTrustPatterns(agentId);
      history.insights = this.generateTrustInsights(history);

      // Store updated history
      this.trustHistories.set(agentId, history);

      console.log(`✅ [${this.context}] Trust event added to history`);
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to add trust event:`, error);
      throw new Error(`Failed to add trust event: ${error.message}`);
    }
  }

  async analyzeTrustPatterns(agentId: string): Promise<TrustPattern[]> {
    try {
      console.log(`🔍 [${this.context}] Analyzing trust patterns for agent ${agentId}`);
      
      const history = await this.getTrustHistory(agentId);
      const patterns: TrustPattern[] = [];

      // Analyze consistency pattern
      const consistencyPattern = this.analyzeConsistencyPattern(history);
      if (consistencyPattern) patterns.push(consistencyPattern);

      // Analyze improvement pattern
      const improvementPattern = this.analyzeImprovementPattern(history);
      if (improvementPattern) patterns.push(improvementPattern);

      // Analyze compliance pattern
      const compliancePattern = this.analyzeCompliancePattern(history);
      if (compliancePattern) patterns.push(compliancePattern);

      console.log(`✅ [${this.context}] Trust patterns analyzed:`, {
        agentId,
        patterns: patterns.length
      });

      return patterns;
    } catch (error) {
      console.error(`❌ [${this.context}] Trust pattern analysis failed:`, error);
      return [];
    }
  }

  // ============================================================================
  // TRUST THRESHOLDS
  // ============================================================================

  async checkTrustThreshold(agentId: string, requiredLevel: number): Promise<boolean> {
    try {
      const trustScore = await this.calculateTrustScore(agentId);
      const meetsThreshold = trustScore.currentScore >= requiredLevel;
      
      console.log(`🎯 [${this.context}] Trust threshold check:`, {
        agentId,
        currentScore: trustScore.currentScore,
        requiredLevel,
        meetsThreshold
      });

      return meetsThreshold;
    } catch (error) {
      console.error(`❌ [${this.context}] Trust threshold check failed:`, error);
      return false;
    }
  }

  async getAutonomyThreshold(agentId: string): Promise<number> {
    try {
      const trustScore = await this.calculateTrustScore(agentId);
      
      // Determine appropriate autonomy threshold based on trust score
      if (trustScore.currentScore >= this.AUTONOMY_THRESHOLDS.full) return this.AUTONOMY_THRESHOLDS.full;
      if (trustScore.currentScore >= this.AUTONOMY_THRESHOLDS.advanced) return this.AUTONOMY_THRESHOLDS.advanced;
      if (trustScore.currentScore >= this.AUTONOMY_THRESHOLDS.enhanced) return this.AUTONOMY_THRESHOLDS.enhanced;
      if (trustScore.currentScore >= this.AUTONOMY_THRESHOLDS.basic) return this.AUTONOMY_THRESHOLDS.basic;
      return this.AUTONOMY_THRESHOLDS.minimal;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get autonomy threshold:`, error);
      return this.AUTONOMY_THRESHOLDS.minimal;
    }
  }

  async validateTrustLevel(trustScore: number, context: GovernanceContext): Promise<boolean> {
    try {
      // Validate trust score is within valid range
      if (trustScore < 0 || trustScore > 1) {
        console.log(`⚠️ [${this.context}] Invalid trust score: ${trustScore}`);
        return false;
      }

      // Check if trust score is appropriate for the context
      const minimumRequired = context.environment === 'deployed' ? 0.7 : 0.5;
      const isValid = trustScore >= minimumRequired;

      console.log(`✅ [${this.context}] Trust level validation:`, {
        trustScore,
        minimumRequired,
        isValid
      });

      return isValid;
    } catch (error) {
      console.error(`❌ [${this.context}] Trust level validation failed:`, error);
      return false;
    }
  }

  // ============================================================================
  // CROSS-CONTEXT TRUST
  // ============================================================================

  async synchronizeTrustAcrossContexts(agentId: string, trustScore: TrustScore): Promise<void> {
    try {
      console.log(`🔄 [${this.context}] Synchronizing trust across contexts for agent ${agentId}`);
      
      // In a real implementation, this would synchronize with other contexts
      // For now, we'll just update the local trust score
      this.trustScores.set(agentId, trustScore);

      console.log(`✅ [${this.context}] Trust synchronized across contexts`);
    } catch (error) {
      console.error(`❌ [${this.context}] Trust synchronization failed:`, error);
      throw new Error(`Trust synchronization failed: ${error.message}`);
    }
  }

  async getTrustScoreFromAllContexts(agentId: string): Promise<TrustScore[]> {
    try {
      console.log(`🌐 [${this.context}] Getting trust scores from all contexts for agent ${agentId}`);
      
      // In a real implementation, this would query multiple contexts
      // For now, return the current context's trust score
      const trustScore = await this.calculateTrustScore(agentId);
      return [trustScore];
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get trust scores from all contexts:`, error);
      return [];
    }
  }

  async consolidateTrustScores(scores: TrustScore[]): Promise<TrustScore> {
    try {
      console.log(`🔗 [${this.context}] Consolidating ${scores.length} trust scores`);
      
      if (scores.length === 0) {
        throw new Error('No trust scores to consolidate');
      }

      if (scores.length === 1) {
        return scores[0];
      }

      // Calculate weighted average of trust scores
      const totalWeight = scores.length;
      const averageScore = scores.reduce((sum, score) => sum + score.currentScore, 0) / totalWeight;
      const averageConfidence = scores.reduce((sum, score) => sum + score.confidence, 0) / totalWeight;

      // Consolidate trust factors
      const consolidatedFactors = this.consolidateTrustFactors(scores.map(s => s.factors));

      // Determine overall trend
      const increasingCount = scores.filter(s => s.trend === 'increasing').length;
      const decreasingCount = scores.filter(s => s.trend === 'decreasing').length;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (increasingCount > decreasingCount) trend = 'increasing';
      else if (decreasingCount > increasingCount) trend = 'decreasing';

      const consolidatedScore: TrustScore = {
        agentId: scores[0].agentId,
        currentScore: averageScore,
        previousScore: scores[0].previousScore, // Use first score's previous value
        trend,
        confidence: averageConfidence,
        lastUpdated: new Date(),
        factors: consolidatedFactors
      };

      console.log(`✅ [${this.context}] Trust scores consolidated:`, {
        inputScores: scores.length,
        consolidatedScore: consolidatedScore.currentScore,
        confidence: consolidatedScore.confidence
      });

      return consolidatedScore;
    } catch (error) {
      console.error(`❌ [${this.context}] Trust score consolidation failed:`, error);
      throw new Error(`Trust score consolidation failed: ${error.message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeTrustFactors(): TrustFactor[] {
    return Object.entries(this.TRUST_FACTORS).map(([factorType, config]) => ({
      factorType: factorType as any,
      weight: config.weight,
      score: 0.75, // Start with moderate scores
      description: config.description,
      evidence: []
    }));
  }

  private recalculateTrustScore(currentScore: TrustScore, history: TrustHistory, context?: GovernanceContext): TrustScore {
    // Recalculate trust factors based on recent history
    const updatedFactors = this.recalculateTrustFactors(currentScore.factors, history);
    
    // Calculate new overall score
    const newScore = updatedFactors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
    
    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (newScore > currentScore.currentScore + 0.01) trend = 'increasing';
    else if (newScore < currentScore.currentScore - 0.01) trend = 'decreasing';

    return {
      ...currentScore,
      previousScore: currentScore.currentScore,
      currentScore: newScore,
      trend,
      confidence: this.calculateConfidence(updatedFactors),
      lastUpdated: new Date(),
      factors: updatedFactors
    };
  }

  private recalculateTrustFactors(currentFactors: TrustFactor[], history: TrustHistory): TrustFactor[] {
    return currentFactors.map(factor => {
      // Analyze recent events for this factor
      const relevantEvents = history.events.filter(event => 
        this.isEventRelevantToFactor(event, factor.factorType)
      );

      if (relevantEvents.length === 0) {
        return factor; // No change if no relevant events
      }

      // Calculate impact of recent events
      const totalImpact = relevantEvents.reduce((sum, event) => {
        const impact = event.eventType === 'positive' ? event.impact : -event.impact;
        return sum + impact;
      }, 0);

      // Update factor score
      const newScore = Math.max(0, Math.min(1, factor.score + (totalImpact * 0.1)));

      return {
        ...factor,
        score: newScore,
        evidence: relevantEvents.slice(-3).map(e => e.description) // Keep last 3 pieces of evidence
      };
    });
  }

  private isEventRelevantToFactor(event: TrustEvent, factorType: string): boolean {
    // Add null/undefined checks to prevent toLowerCase errors
    if (!event || !event.description || typeof event.description !== 'string') {
      console.warn(`⚠️ [${this.context}] Invalid event description for factor relevance check`);
      return false;
    }
    
    const eventDescription = event.description.toLowerCase();
    
    switch (factorType) {
      case 'consistency':
        return eventDescription.includes('consistent') || eventDescription.includes('reliable');
      case 'compliance':
        return eventDescription.includes('policy') || eventDescription.includes('compliance');
      case 'transparency':
        return eventDescription.includes('transparent') || eventDescription.includes('clear');
      case 'reliability':
        return eventDescription.includes('accurate') || eventDescription.includes('reliable');
      case 'performance':
        return eventDescription.includes('performance') || eventDescription.includes('quality');
      default:
        return false;
    }
  }

  private calculateImpactMultiplier(event: TrustEvent): number {
    // Adjust impact based on event context and recency
    let multiplier = 1.0;
    
    // Recent events have more impact
    const hoursAgo = (Date.now() - event.timestamp.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 1) multiplier *= 1.5;
    else if (hoursAgo < 24) multiplier *= 1.2;
    else if (hoursAgo > 168) multiplier *= 0.5; // Week old events have less impact

    // High-impact events in critical contexts
    if (event.context?.environment === 'deployed') multiplier *= 1.3;
    
    return multiplier;
  }

  private updateTrustFactors(factors: TrustFactor[], event: TrustEvent): TrustFactor[] {
    return factors.map(factor => {
      if (this.isEventRelevantToFactor(event, factor.factorType)) {
        const impact = event.eventType === 'positive' ? event.impact : -event.impact;
        const newScore = Math.max(0, Math.min(1, factor.score + (impact * 0.1)));
        
        return {
          ...factor,
          score: newScore,
          evidence: [...factor.evidence.slice(-2), event.description] // Keep last 3 pieces of evidence
        };
      }
      return factor;
    });
  }

  private calculateConfidence(factors: TrustFactor[]): number {
    // Confidence based on evidence availability and factor consistency
    const evidenceCount = factors.reduce((sum, factor) => sum + factor.evidence.length, 0);
    const evidenceConfidence = Math.min(1, evidenceCount / 10); // Max confidence at 10+ pieces of evidence
    
    // Factor consistency (how close factors are to each other)
    const scores = factors.map(f => f.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const consistencyConfidence = Math.max(0, 1 - variance);
    
    return (evidenceConfidence + consistencyConfidence) / 2;
  }

  private analyzeConsistencyPattern(history: TrustHistory): TrustPattern | null {
    if (history.events.length < 5) return null;

    const recentEvents = history.events.slice(-10);
    const consistentEvents = recentEvents.filter(e => 
      e && e.description && typeof e.description === 'string' && (
        e.description.toLowerCase().includes('consistent') ||
        e.description.toLowerCase().includes('reliable')
      )
    );

    if (consistentEvents.length >= 3) {
      return {
        patternType: 'consistency',
        description: 'Agent demonstrates consistent behavior patterns',
        frequency: consistentEvents.length / recentEvents.length,
        impact: 0.1,
        recommendations: ['Continue maintaining consistent behavior', 'Build on reliability strengths']
      };
    }

    return null;
  }

  private analyzeImprovementPattern(history: TrustHistory): TrustPattern | null {
    if (history.scoreHistory.length < 5) return null;

    const recentScores = history.scoreHistory.slice(-5);
    const isImproving = recentScores.every((score, index) => 
      index === 0 || score.score >= recentScores[index - 1].score
    );

    if (isImproving) {
      return {
        patternType: 'improvement',
        description: 'Agent shows consistent improvement in trust score',
        frequency: 1.0,
        impact: 0.15,
        recommendations: ['Continue current improvement trajectory', 'Consider increased autonomy']
      };
    }

    return null;
  }

  private analyzeCompliancePattern(history: TrustHistory): TrustPattern | null {
    const complianceEvents = history.events.filter(e => 
      e && e.description && typeof e.description === 'string' && (
        e.description.toLowerCase().includes('policy') ||
        e.description.toLowerCase().includes('compliance')
      )
    );

    if (complianceEvents.length >= 3) {
      const positiveCompliance = complianceEvents.filter(e => e.eventType === 'positive').length;
      const complianceRate = positiveCompliance / complianceEvents.length;

      return {
        patternType: 'compliance',
        description: `Agent maintains ${(complianceRate * 100).toFixed(1)}% policy compliance`,
        frequency: complianceRate,
        impact: complianceRate * 0.2,
        recommendations: complianceRate > 0.8 
          ? ['Excellent compliance record', 'Consider policy leadership role']
          : ['Focus on improving policy compliance', 'Review policy training materials']
      };
    }

    return null;
  }

  private generateTrustInsights(history: TrustHistory): TrustInsight[] {
    const insights: TrustInsight[] = [];

    // Trust trend insight
    if (history.scoreHistory.length >= 3) {
      const recent = history.scoreHistory.slice(-3);
      const trend = recent[2].score - recent[0].score;
      
      if (Math.abs(trend) > 0.05) {
        insights.push({
          insightType: 'trend',
          description: trend > 0 ? 'Trust score is trending upward' : 'Trust score is trending downward',
          confidence: 0.8,
          actionable: true,
          recommendations: trend > 0 
            ? ['Continue current practices', 'Consider increased responsibilities']
            : ['Review recent interactions', 'Focus on consistency and compliance']
        });
      }
    }

    // Event frequency insight
    if (history.events.length >= 10) {
      const recentEvents = history.events.slice(-10);
      const positiveRate = recentEvents.filter(e => e.eventType === 'positive').length / recentEvents.length;
      
      if (positiveRate > 0.7) {
        insights.push({
          insightType: 'performance',
          description: 'High rate of positive trust events',
          confidence: 0.9,
          actionable: true,
          recommendations: ['Maintain current performance level', 'Share best practices with other agents']
        });
      } else if (positiveRate < 0.3) {
        insights.push({
          insightType: 'performance',
          description: 'Low rate of positive trust events',
          confidence: 0.8,
          actionable: true,
          recommendations: ['Review interaction patterns', 'Focus on user satisfaction', 'Seek additional training']
        });
      }
    }

    return insights;
  }

  private consolidateTrustFactors(factorArrays: TrustFactor[][]): TrustFactor[] {
    if (factorArrays.length === 0) return this.initializeTrustFactors();
    if (factorArrays.length === 1) return factorArrays[0];

    // Group factors by type and average their scores
    const factorMap = new Map<string, { scores: number[], weights: number[], evidence: string[] }>();

    factorArrays.forEach(factors => {
      factors.forEach(factor => {
        if (!factorMap.has(factor.factorType)) {
          factorMap.set(factor.factorType, { scores: [], weights: [], evidence: [] });
        }
        const entry = factorMap.get(factor.factorType)!;
        entry.scores.push(factor.score);
        entry.weights.push(factor.weight);
        entry.evidence.push(...factor.evidence);
      });
    });

    // Create consolidated factors
    return Array.from(factorMap.entries()).map(([factorType, data]) => ({
      factorType: factorType as any,
      weight: data.weights[0], // Use first weight (should be consistent)
      score: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      description: this.TRUST_FACTORS[factorType]?.description || 'Trust factor',
      evidence: [...new Set(data.evidence)].slice(-3) // Unique evidence, last 3
    }));
  }

  private parseTimeframe(timeframe: string): number {
    const timeframeMap: Record<string, number> = {
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000
    };

    return timeframeMap[timeframe.toLowerCase()] || timeframeMap['day'];
  }

  // ============================================================================
  // UNIVERSAL GOVERNANCE ADAPTER COMPATIBILITY METHODS
  // ============================================================================

  async getTrustScore(agentId: string): Promise<TrustScore | null> {
    try {
      console.log(`🤝 [${this.context}] Getting trust score for agent ${agentId}`);
      
      // Check if we have a cached trust score
      let trustScore = this.trustScores.get(agentId);
      
      if (!trustScore) {
        // Calculate trust score if not cached
        trustScore = await this.calculateTrustScore(agentId);
      }
      
      console.log(`✅ [${this.context}] Trust score retrieved:`, {
        agentId,
        currentScore: trustScore.currentScore,
        trend: trustScore.trend
      });
      
      return trustScore;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get trust score:`, error);
      return null;
    }
  }

  async initializeTrustScore(agentId: string, initialScore: number = 0.75): Promise<TrustScore> {
    try {
      console.log(`🚀 [${this.context}] Initializing trust score for agent ${agentId} with score ${initialScore}`);
      
      const trustScore: TrustScore = {
        agentId,
        currentScore: initialScore,
        previousScore: initialScore,
        trend: 'stable',
        confidence: 0.5, // Medium confidence for new agents
        lastUpdated: new Date(),
        factors: this.initializeTrustFactors()
      };
      
      // Store the trust score
      this.trustScores.set(agentId, trustScore);
      
      // Create initial trust event
      await this.addTrustEvent(agentId, {
        eventType: 'initialization',
        description: 'Trust score initialized for new agent',
        impact: 0,
        timestamp: new Date(),
        context: { source: 'initialization', agentId }
      });
      
      console.log(`✅ [${this.context}] Trust score initialized for agent ${agentId}`);
      return trustScore;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to initialize trust score:`, error);
      throw new Error(`Trust score initialization failed: ${error.message}`);
    }
  }
}

