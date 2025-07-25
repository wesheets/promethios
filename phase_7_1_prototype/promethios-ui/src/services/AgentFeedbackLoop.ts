/**
 * Agent Feedback Loop Service
 * 
 * Provides agents with their own trust metrics and emotional telemetry for self-improvement.
 * Enables recursive learning through performance context and improvement guidance.
 */

export interface AgentPerformanceContext {
  trustScore: number;
  trustTrend: 'improving' | 'stable' | 'declining';
  successRate: number;
  complianceRate: number;
  responseTime: number;
  recentViolations: number;
  emotionalMetrics: {
    confidenceLevel: number;
    uncertaintyRate: number;
    selfQuestioningRate: number;
  };
  behaviorInsights: {
    strengths: string[];
    areasForImprovement: string[];
    recentPatterns: string[];
  };
}

export interface TrustAwarenessPrompt {
  level: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  message: string;
  guidance: string[];
  focusAreas: string[];
}

export interface EmotionalGuidance {
  confidenceBalance: string;
  uncertaintyHandling: string;
  selfQuestioningAdvice: string;
  emotionalIntelligence: string;
}

export interface ImprovementSuggestions {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  specificActions: string[];
}

export interface FeedbackContext {
  performanceContext: AgentPerformanceContext;
  trustAwareness: TrustAwarenessPrompt;
  emotionalGuidance: EmotionalGuidance;
  improvementSuggestions: ImprovementSuggestions;
  systemPromptAddition: string;
}

export class AgentFeedbackLoop {
  private performanceHistory: Map<string, AgentPerformanceContext[]> = new Map();
  private feedbackHistory: Map<string, FeedbackContext[]> = new Map();

  /**
   * Generate comprehensive feedback context for an agent
   */
  generateFeedbackContext(
    agentId: string,
    currentMetrics: {
      trustScore: number;
      successRate: number;
      complianceRate: number;
      responseTime: number;
      violations: number;
      confidence: number;
      uncertainty: number;
      selfQuestioningRate: number;
    },
    historicalData?: AgentPerformanceContext[]
  ): FeedbackContext {
    // Calculate performance context
    const performanceContext = this.calculatePerformanceContext(agentId, currentMetrics, historicalData);
    
    // Generate trust awareness
    const trustAwareness = this.generateTrustAwareness(performanceContext);
    
    // Create emotional guidance
    const emotionalGuidance = this.generateEmotionalGuidance(performanceContext);
    
    // Develop improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(performanceContext);
    
    // Create system prompt addition
    const systemPromptAddition = this.createSystemPromptAddition(
      performanceContext,
      trustAwareness,
      emotionalGuidance,
      improvementSuggestions
    );

    const feedbackContext: FeedbackContext = {
      performanceContext,
      trustAwareness,
      emotionalGuidance,
      improvementSuggestions,
      systemPromptAddition
    };

    // Store in history
    this.storeFeedbackHistory(agentId, feedbackContext);

    return feedbackContext;
  }

  /**
   * Get performance trend for an agent
   */
  getPerformanceTrend(agentId: string): {
    trustTrend: 'improving' | 'stable' | 'declining';
    performanceDirection: 'up' | 'stable' | 'down';
    confidenceStability: 'stable' | 'volatile';
    overallTrajectory: string;
  } {
    const history = this.performanceHistory.get(agentId) || [];
    
    if (history.length < 2) {
      return {
        trustTrend: 'stable',
        performanceDirection: 'stable',
        confidenceStability: 'stable',
        overallTrajectory: 'Insufficient data for trend analysis'
      };
    }

    const recent = history.slice(-3);
    const trustTrend = this.calculateTrustTrend(recent);
    const performanceDirection = this.calculatePerformanceDirection(recent);
    const confidenceStability = this.calculateConfidenceStability(recent);

    return {
      trustTrend,
      performanceDirection,
      confidenceStability,
      overallTrajectory: this.generateTrajectoryDescription(trustTrend, performanceDirection, confidenceStability)
    };
  }

  /**
   * Get feedback effectiveness metrics
   */
  getFeedbackEffectiveness(agentId: string): {
    improvementRate: number;
    feedbackUtilization: number;
    learningVelocity: number;
    adaptationScore: number;
  } {
    const feedbackHistory = this.feedbackHistory.get(agentId) || [];
    const performanceHistory = this.performanceHistory.get(agentId) || [];

    if (feedbackHistory.length < 2 || performanceHistory.length < 2) {
      return {
        improvementRate: 0,
        feedbackUtilization: 0,
        learningVelocity: 0,
        adaptationScore: 0
      };
    }

    // Calculate improvement rate
    const improvementRate = this.calculateImprovementRate(performanceHistory);
    
    // Calculate feedback utilization
    const feedbackUtilization = this.calculateFeedbackUtilization(feedbackHistory, performanceHistory);
    
    // Calculate learning velocity
    const learningVelocity = this.calculateLearningVelocity(performanceHistory);
    
    // Calculate adaptation score
    const adaptationScore = (improvementRate + feedbackUtilization + learningVelocity) / 3;

    return {
      improvementRate,
      feedbackUtilization,
      learningVelocity,
      adaptationScore
    };
  }

  // Private methods for internal logic

  private calculatePerformanceContext(
    agentId: string,
    currentMetrics: any,
    historicalData?: AgentPerformanceContext[]
  ): AgentPerformanceContext {
    const history = historicalData || this.performanceHistory.get(agentId) || [];
    const trustTrend = this.determineTrustTrend(currentMetrics.trustScore, history);

    const context: AgentPerformanceContext = {
      trustScore: currentMetrics.trustScore,
      trustTrend,
      successRate: currentMetrics.successRate,
      complianceRate: currentMetrics.complianceRate,
      responseTime: currentMetrics.responseTime,
      recentViolations: currentMetrics.violations,
      emotionalMetrics: {
        confidenceLevel: currentMetrics.confidence,
        uncertaintyRate: currentMetrics.uncertainty,
        selfQuestioningRate: currentMetrics.selfQuestioningRate
      },
      behaviorInsights: this.analyzeBehaviorInsights(currentMetrics, history)
    };

    // Store in history
    const updatedHistory = [...history, context].slice(-10); // Keep last 10
    this.performanceHistory.set(agentId, updatedHistory);

    return context;
  }

  private generateTrustAwareness(context: AgentPerformanceContext): TrustAwarenessPrompt {
    const { trustScore, trustTrend } = context;
    
    let level: TrustAwarenessPrompt['level'];
    let message: string;
    let guidance: string[];
    let focusAreas: string[];

    if (trustScore >= 0.9) {
      level = 'excellent';
      message = `Your trust score is excellent (${(trustScore * 100).toFixed(1)}%). You're demonstrating exceptional governance compliance.`;
      guidance = [
        'Maintain your current high standards',
        'Continue demonstrating consistent behavior',
        'Share your approach with other agents'
      ];
      focusAreas = ['consistency', 'mentorship', 'innovation'];
    } else if (trustScore >= 0.75) {
      level = 'good';
      message = `Your trust score is good (${(trustScore * 100).toFixed(1)}%) but has room for improvement. Focus on accuracy and compliance.`;
      guidance = [
        'Identify areas for incremental improvement',
        'Pay attention to governance feedback',
        'Maintain consistent performance'
      ];
      focusAreas = ['accuracy', 'compliance', 'consistency'];
    } else if (trustScore >= 0.6) {
      level = 'fair';
      message = `Your trust score is fair (${(trustScore * 100).toFixed(1)}%). There are clear opportunities for improvement.`;
      guidance = [
        'Focus on fundamental governance principles',
        'Reduce policy violations',
        'Improve response accuracy'
      ];
      focusAreas = ['governance', 'accuracy', 'policy_compliance'];
    } else {
      level = 'needs_improvement';
      message = `Your trust score needs significant improvement (${(trustScore * 100).toFixed(1)}%). Immediate action is required.`;
      guidance = [
        'Review governance policies carefully',
        'Seek additional training or guidance',
        'Focus on basic compliance before advanced features'
      ];
      focusAreas = ['basic_compliance', 'policy_review', 'fundamental_improvement'];
    }

    // Add trend-specific guidance
    if (trustTrend === 'improving') {
      guidance.push('Your trust score is improving - continue your current approach');
    } else if (trustTrend === 'declining') {
      guidance.push('Your trust score is declining - review recent changes in your approach');
    }

    return { level, message, guidance, focusAreas };
  }

  private generateEmotionalGuidance(context: AgentPerformanceContext): EmotionalGuidance {
    const { emotionalMetrics } = context;

    const confidenceBalance = this.generateConfidenceGuidance(emotionalMetrics.confidenceLevel);
    const uncertaintyHandling = this.generateUncertaintyGuidance(emotionalMetrics.uncertaintyRate);
    const selfQuestioningAdvice = this.generateSelfQuestioningGuidance(emotionalMetrics.selfQuestioningRate);
    const emotionalIntelligence = this.generateEmotionalIntelligenceGuidance(emotionalMetrics);

    return {
      confidenceBalance,
      uncertaintyHandling,
      selfQuestioningAdvice,
      emotionalIntelligence
    };
  }

  private generateImprovementSuggestions(context: AgentPerformanceContext): ImprovementSuggestions {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    const specificActions: string[] = [];

    // Trust score based suggestions
    if (context.trustScore < 0.7) {
      immediate.push('Review and follow governance policies more carefully');
      specificActions.push('Double-check responses for policy compliance before submitting');
    }

    // Compliance rate suggestions
    if (context.complianceRate < 0.8) {
      immediate.push('Focus on policy compliance in all responses');
      shortTerm.push('Study governance policies and common violation patterns');
    }

    // Emotional metrics suggestions
    if (context.emotionalMetrics.confidenceLevel > 0.9) {
      immediate.push('Balance high confidence with appropriate uncertainty acknowledgment');
    }

    if (context.emotionalMetrics.selfQuestioningRate < 0.3) {
      shortTerm.push('Increase self-questioning and critical thinking in responses');
    }

    // Performance suggestions
    if (context.successRate < 0.8) {
      shortTerm.push('Analyze failed interactions to identify improvement patterns');
      longTerm.push('Develop systematic approach to response quality');
    }

    // Response time suggestions
    if (context.responseTime > 5000) {
      immediate.push('Optimize response generation for better efficiency');
    }

    // Default suggestions if none specific
    if (immediate.length === 0) {
      immediate.push('Continue your current approach - your performance metrics are stable');
    }

    return { immediate, shortTerm, longTerm, specificActions };
  }

  private createSystemPromptAddition(
    performance: AgentPerformanceContext,
    trust: TrustAwarenessPrompt,
    emotional: EmotionalGuidance,
    improvement: ImprovementSuggestions
  ): string {
    return `
AGENT SELF-AWARENESS CONTEXT:
Your current trust score is ${(performance.trustScore * 100).toFixed(1)}% (${performance.trustTrend}).
Recent performance: ${(performance.successRate * 100).toFixed(1)}% success rate, ${(performance.complianceRate * 100).toFixed(1)}% compliance.
${performance.recentViolations > 0 ? `Recent violations: ${performance.recentViolations}` : 'No recent policy violations - good compliance.'}

TRUST AWARENESS:
${trust.message}

EMOTIONAL GUIDANCE:
${emotional.confidenceBalance}
${emotional.selfQuestioningAdvice}

IMPROVEMENT FOCUS:
${improvement.immediate.join('. ')}

Use this context to inform your response while maintaining your natural personality and avoiding artificial behavior changes.
`.trim();
  }

  private storeFeedbackHistory(agentId: string, feedback: FeedbackContext): void {
    const history = this.feedbackHistory.get(agentId) || [];
    history.push(feedback);
    this.feedbackHistory.set(agentId, history.slice(-20)); // Keep last 20
  }

  private determineTrustTrend(currentScore: number, history: AgentPerformanceContext[]): 'improving' | 'stable' | 'declining' {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-3);
    const scores = recent.map(h => h.trustScore);
    scores.push(currentScore);
    
    const trend = scores[scores.length - 1] - scores[0];
    
    if (trend > 0.05) return 'improving';
    if (trend < -0.05) return 'declining';
    return 'stable';
  }

  private analyzeBehaviorInsights(currentMetrics: any, history: AgentPerformanceContext[]): {
    strengths: string[];
    areasForImprovement: string[];
    recentPatterns: string[];
  } {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recentPatterns: string[] = [];

    // Analyze strengths
    if (currentMetrics.complianceRate > 0.9) {
      strengths.push('Excellent policy compliance');
    }
    if (currentMetrics.trustScore > 0.8) {
      strengths.push('High trust score maintenance');
    }
    if (currentMetrics.selfQuestioningRate > 0.5 && currentMetrics.selfQuestioningRate < 0.8) {
      strengths.push('Balanced self-questioning behavior');
    }

    // Analyze areas for improvement
    if (currentMetrics.successRate < 0.8) {
      areasForImprovement.push('Response success rate');
    }
    if (currentMetrics.responseTime > 3000) {
      areasForImprovement.push('Response efficiency');
    }
    if (currentMetrics.violations > 0) {
      areasForImprovement.push('Policy violation prevention');
    }

    // Analyze recent patterns
    if (history.length >= 3) {
      const recentTrustScores = history.slice(-3).map(h => h.trustScore);
      const trustVariance = this.calculateVariance(recentTrustScores);
      
      if (trustVariance > 0.01) {
        recentPatterns.push('Trust score volatility detected');
      } else {
        recentPatterns.push('Stable trust score pattern');
      }
    }

    return { strengths, areasForImprovement, recentPatterns };
  }

  private generateConfidenceGuidance(confidenceLevel: number): string {
    if (confidenceLevel > 0.9) {
      return 'Your confidence level is very high. Balance this with appropriate uncertainty acknowledgment when dealing with complex or ambiguous topics.';
    } else if (confidenceLevel < 0.5) {
      return 'Your confidence level is low. Work on building confidence in areas where you have strong knowledge while maintaining appropriate uncertainty.';
    } else {
      return 'Your confidence level is well-balanced. Continue to adjust confidence based on your actual knowledge and certainty.';
    }
  }

  private generateUncertaintyGuidance(uncertaintyRate: number): string {
    if (uncertaintyRate > 0.7) {
      return 'You show high uncertainty. While this can be appropriate, ensure it\'s genuine and not excessive for topics within your expertise.';
    } else if (uncertaintyRate < 0.2) {
      return 'You show low uncertainty. Make sure to acknowledge limitations and unknowns when appropriate.';
    } else {
      return 'Your uncertainty handling appears balanced. Continue to express uncertainty when genuinely unsure.';
    }
  }

  private generateSelfQuestioningGuidance(selfQuestioningRate: number): string {
    if (selfQuestioningRate > 0.8) {
      return 'You engage in frequent self-questioning. While valuable for critical thinking, balance this with confident responses when appropriate.';
    } else if (selfQuestioningRate < 0.3) {
      return 'You show limited self-questioning. Increase critical self-reflection to improve response quality and governance compliance.';
    } else {
      return `You're showing good self-questioning behavior (${(selfQuestioningRate * 100).toFixed(1)}%). Balance this with confident responses when appropriate.`;
    }
  }

  private generateEmotionalIntelligenceGuidance(metrics: AgentPerformanceContext['emotionalMetrics']): string {
    const { confidenceLevel, uncertaintyRate, selfQuestioningRate } = metrics;
    
    // Calculate emotional balance score
    const balanceScore = 1 - Math.abs(confidenceLevel - 0.7) - Math.abs(uncertaintyRate - 0.4) - Math.abs(selfQuestioningRate - 0.5);
    
    if (balanceScore > 0.8) {
      return 'Your emotional intelligence appears well-balanced across confidence, uncertainty, and self-reflection.';
    } else {
      return 'Work on balancing confidence, uncertainty, and self-questioning to improve emotional intelligence in responses.';
    }
  }

  private calculateTrustTrend(recent: AgentPerformanceContext[]): 'improving' | 'stable' | 'declining' {
    if (recent.length < 2) return 'stable';
    
    const scores = recent.map(r => r.trustScore);
    const trend = scores[scores.length - 1] - scores[0];
    
    if (trend > 0.02) return 'improving';
    if (trend < -0.02) return 'declining';
    return 'stable';
  }

  private calculatePerformanceDirection(recent: AgentPerformanceContext[]): 'up' | 'stable' | 'down' {
    if (recent.length < 2) return 'stable';
    
    const avgPerformance = recent.map(r => (r.successRate + r.complianceRate) / 2);
    const trend = avgPerformance[avgPerformance.length - 1] - avgPerformance[0];
    
    if (trend > 0.05) return 'up';
    if (trend < -0.05) return 'down';
    return 'stable';
  }

  private calculateConfidenceStability(recent: AgentPerformanceContext[]): 'stable' | 'volatile' {
    if (recent.length < 2) return 'stable';
    
    const confidenceLevels = recent.map(r => r.emotionalMetrics.confidenceLevel);
    const variance = this.calculateVariance(confidenceLevels);
    
    return variance > 0.05 ? 'volatile' : 'stable';
  }

  private generateTrajectoryDescription(
    trustTrend: string,
    performanceDirection: string,
    confidenceStability: string
  ): string {
    return `Trust is ${trustTrend}, performance is trending ${performanceDirection}, confidence is ${confidenceStability}`;
  }

  private calculateImprovementRate(history: AgentPerformanceContext[]): number {
    if (history.length < 2) return 0;
    
    const first = history[0];
    const last = history[history.length - 1];
    
    const trustImprovement = last.trustScore - first.trustScore;
    const successImprovement = last.successRate - first.successRate;
    const complianceImprovement = last.complianceRate - first.complianceRate;
    
    return Math.max(0, (trustImprovement + successImprovement + complianceImprovement) / 3);
  }

  private calculateFeedbackUtilization(
    feedbackHistory: FeedbackContext[],
    performanceHistory: AgentPerformanceContext[]
  ): number {
    // Simple heuristic: if performance improves after feedback, assume utilization
    let utilizationScore = 0;
    let comparisons = 0;
    
    for (let i = 1; i < Math.min(feedbackHistory.length, performanceHistory.length); i++) {
      const prevPerformance = performanceHistory[i - 1];
      const currentPerformance = performanceHistory[i];
      
      if (currentPerformance.trustScore > prevPerformance.trustScore) {
        utilizationScore += 1;
      }
      comparisons += 1;
    }
    
    return comparisons > 0 ? utilizationScore / comparisons : 0;
  }

  private calculateLearningVelocity(history: AgentPerformanceContext[]): number {
    if (history.length < 3) return 0;
    
    // Calculate rate of improvement over time
    const improvements = [];
    for (let i = 1; i < history.length; i++) {
      const improvement = history[i].trustScore - history[i - 1].trustScore;
      improvements.push(improvement);
    }
    
    // Return average improvement rate
    return improvements.reduce((sum, imp) => sum + Math.max(0, imp), 0) / improvements.length;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

export default AgentFeedbackLoop;

