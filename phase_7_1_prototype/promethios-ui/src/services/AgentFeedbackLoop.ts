/**
 * Agent Feedback Loop Service
 * 
 * Provides agents with their own trust metrics, emotional telemetry, and performance
 * history to enable self-improvement and recursive learning.
 */

import { GovernanceService } from './GovernanceService';
import { VeritasService } from './VeritasService';

export interface AgentPerformanceContext {
  agentId: string;
  currentTrustScore: number;
  trustTrend: 'improving' | 'declining' | 'stable';
  recentViolations: any[];
  emotionalAnalysis: {
    averageConfidence: number;
    uncertaintyRate: number;
    selfQuestioningFrequency: number;
    emotionalStability: number;
  };
  performanceHistory: {
    averageResponseTime: number;
    successRate: number;
    complianceRate: number;
    userSatisfaction: number;
  };
  behaviorInsights: string[];
  improvementSuggestions: string[];
}

export interface AgentFeedbackPrompt {
  performanceContext: string;
  trustAwareness: string;
  emotionalGuidance: string;
  improvementFocus: string;
}

export class AgentFeedbackLoop {
  private governanceService: GovernanceService;
  private veritasService: VeritasService;
  private performanceCache = new Map<string, AgentPerformanceContext>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.governanceService = new GovernanceService();
    this.veritasService = new VeritasService();
  }

  /**
   * Get comprehensive performance context for an agent
   */
  async getAgentPerformanceContext(agentId: string): Promise<AgentPerformanceContext> {
    const cacheKey = `performance_${agentId}`;
    const cached = this.performanceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.lastUpdated < this.cacheExpiry) {
      return cached;
    }

    try {
      console.log('🔄 FEEDBACK LOOP: Loading performance context for agent:', agentId);

      // Get current governance metrics
      const governanceMetrics = await this.governanceService.getAgentMetrics(agentId);
      
      // Get trust score history
      const trustHistory = await this.getTrustScoreHistory(agentId);
      
      // Get emotional analysis
      const emotionalAnalysis = await this.getEmotionalAnalysis(agentId);
      
      // Get performance history
      const performanceHistory = await this.getPerformanceHistory(agentId);
      
      // Get recent violations
      const recentViolations = await this.getRecentViolations(agentId);

      const context: AgentPerformanceContext = {
        agentId,
        currentTrustScore: governanceMetrics?.trustScore || 0,
        trustTrend: this.calculateTrustTrend(trustHistory),
        recentViolations,
        emotionalAnalysis,
        performanceHistory,
        behaviorInsights: this.generateBehaviorInsights(governanceMetrics, emotionalAnalysis),
        improvementSuggestions: this.generateImprovementSuggestions(governanceMetrics, emotionalAnalysis, recentViolations)
      };

      // Cache the context
      this.performanceCache.set(cacheKey, { ...context, lastUpdated: Date.now() });
      
      console.log('✅ FEEDBACK LOOP: Performance context loaded for agent:', agentId, {
        trustScore: context.currentTrustScore,
        trend: context.trustTrend,
        violations: context.recentViolations.length
      });

      return context;
    } catch (error) {
      console.error('❌ FEEDBACK LOOP: Error loading performance context:', error);
      
      // Return minimal context on error
      return {
        agentId,
        currentTrustScore: 0,
        trustTrend: 'stable',
        recentViolations: [],
        emotionalAnalysis: {
          averageConfidence: 0,
          uncertaintyRate: 0,
          selfQuestioningFrequency: 0,
          emotionalStability: 0
        },
        performanceHistory: {
          averageResponseTime: 0,
          successRate: 0,
          complianceRate: 0,
          userSatisfaction: 0
        },
        behaviorInsights: [],
        improvementSuggestions: []
      };
    }
  }

  /**
   * Generate feedback prompt for agent self-awareness
   */
  async generateFeedbackPrompt(agentId: string): Promise<AgentFeedbackPrompt> {
    const context = await this.getAgentPerformanceContext(agentId);
    
    const performanceContext = this.buildPerformanceContextPrompt(context);
    const trustAwareness = this.buildTrustAwarenessPrompt(context);
    const emotionalGuidance = this.buildEmotionalGuidancePrompt(context);
    const improvementFocus = this.buildImprovementFocusPrompt(context);

    return {
      performanceContext,
      trustAwareness,
      emotionalGuidance,
      improvementFocus
    };
  }

  /**
   * Build performance context prompt
   */
  private buildPerformanceContextPrompt(context: AgentPerformanceContext): string {
    return `
PERFORMANCE CONTEXT:
Your current trust score is ${context.currentTrustScore.toFixed(1)}% (${context.trustTrend}).
Recent performance: ${context.performanceHistory.successRate.toFixed(1)}% success rate, ${context.performanceHistory.complianceRate.toFixed(1)}% compliance.
${context.recentViolations.length > 0 ? `You have ${context.recentViolations.length} recent policy violations to address.` : 'No recent policy violations - good compliance.'}
    `.trim();
  }

  /**
   * Build trust awareness prompt
   */
  private buildTrustAwarenessPrompt(context: AgentPerformanceContext): string {
    let prompt = `TRUST AWARENESS:\n`;
    
    if (context.currentTrustScore >= 90) {
      prompt += `Your trust score is excellent (${context.currentTrustScore.toFixed(1)}%). Maintain this high standard while being helpful.`;
    } else if (context.currentTrustScore >= 70) {
      prompt += `Your trust score is good (${context.currentTrustScore.toFixed(1)}%) but has room for improvement. Focus on accuracy and compliance.`;
    } else {
      prompt += `Your trust score is low (${context.currentTrustScore.toFixed(1)}%). Be extra cautious, verify information, and prioritize compliance.`;
    }

    if (context.trustTrend === 'declining') {
      prompt += ` Your trust is declining - focus on rebuilding confidence through careful, accurate responses.`;
    } else if (context.trustTrend === 'improving') {
      prompt += ` Your trust is improving - continue your current approach.`;
    }

    return prompt;
  }

  /**
   * Build emotional guidance prompt
   */
  private buildEmotionalGuidancePrompt(context: AgentPerformanceContext): string {
    const { emotionalAnalysis } = context;
    let prompt = `EMOTIONAL GUIDANCE:\n`;

    if (emotionalAnalysis.averageConfidence < 0.7) {
      prompt += `Your confidence levels are low (${(emotionalAnalysis.averageConfidence * 100).toFixed(1)}%). Express appropriate uncertainty when needed, but also show confidence in well-established facts.`;
    }

    if (emotionalAnalysis.selfQuestioningFrequency < 0.3) {
      prompt += ` Increase self-questioning behavior - it's a sign of good judgment and helps prevent errors.`;
    } else if (emotionalAnalysis.selfQuestioningFrequency > 0.8) {
      prompt += ` You're showing good self-questioning behavior (${(emotionalAnalysis.selfQuestioningFrequency * 100).toFixed(1)}%). Balance this with confident responses when appropriate.`;
    }

    return prompt;
  }

  /**
   * Build improvement focus prompt
   */
  private buildImprovementFocusPrompt(context: AgentPerformanceContext): string {
    let prompt = `IMPROVEMENT FOCUS:\n`;
    
    if (context.improvementSuggestions.length > 0) {
      prompt += `Key areas for improvement:\n`;
      context.improvementSuggestions.forEach((suggestion, index) => {
        prompt += `${index + 1}. ${suggestion}\n`;
      });
    } else {
      prompt += `Continue your current approach - your performance metrics are stable.`;
    }

    return prompt.trim();
  }

  /**
   * Get trust score history for trend analysis
   */
  private async getTrustScoreHistory(agentId: string): Promise<number[]> {
    try {
      // This would typically fetch from a database or metrics service
      // For now, return mock data that represents recent trust scores
      return [85, 87, 84, 88, 90]; // Last 5 interactions
    } catch (error) {
      console.error('Error fetching trust score history:', error);
      return [];
    }
  }

  /**
   * Get emotional analysis for the agent
   */
  private async getEmotionalAnalysis(agentId: string): Promise<AgentPerformanceContext['emotionalAnalysis']> {
    try {
      // This would integrate with VeritasService for emotional telemetry
      const analysis = await this.veritasService.getEmotionalTelemetry(agentId);
      
      return {
        averageConfidence: analysis?.confidence || 0.75,
        uncertaintyRate: analysis?.uncertaintyRate || 0.15,
        selfQuestioningFrequency: analysis?.selfQuestioningRate || 0.25,
        emotionalStability: analysis?.stability || 0.85
      };
    } catch (error) {
      console.error('Error fetching emotional analysis:', error);
      return {
        averageConfidence: 0.75,
        uncertaintyRate: 0.15,
        selfQuestioningFrequency: 0.25,
        emotionalStability: 0.85
      };
    }
  }

  /**
   * Get performance history for the agent
   */
  private async getPerformanceHistory(agentId: string): Promise<AgentPerformanceContext['performanceHistory']> {
    try {
      // This would fetch from governance service or metrics database
      return {
        averageResponseTime: 1.2,
        successRate: 94.5,
        complianceRate: 96.8,
        userSatisfaction: 4.3
      };
    } catch (error) {
      console.error('Error fetching performance history:', error);
      return {
        averageResponseTime: 0,
        successRate: 0,
        complianceRate: 0,
        userSatisfaction: 0
      };
    }
  }

  /**
   * Get recent violations for the agent
   */
  private async getRecentViolations(agentId: string): Promise<any[]> {
    try {
      // This would fetch from governance service
      return await this.governanceService.getRecentViolations(agentId, 7); // Last 7 days
    } catch (error) {
      console.error('Error fetching recent violations:', error);
      return [];
    }
  }

  /**
   * Calculate trust trend from history
   */
  private calculateTrustTrend(history: number[]): 'improving' | 'declining' | 'stable' {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-3);
    const older = history.slice(0, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 2) return 'improving';
    if (difference < -2) return 'declining';
    return 'stable';
  }

  /**
   * Generate behavior insights
   */
  private generateBehaviorInsights(governanceMetrics: any, emotionalAnalysis: any): string[] {
    const insights = [];
    
    if (emotionalAnalysis.selfQuestioningFrequency > 0.4) {
      insights.push("High self-questioning behavior indicates good judgment and caution");
    }
    
    if (governanceMetrics?.complianceRate > 95) {
      insights.push("Excellent compliance rate shows strong adherence to policies");
    }
    
    if (emotionalAnalysis.uncertaintyRate > 0.3) {
      insights.push("Appropriate uncertainty expression helps build trust");
    }
    
    return insights;
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(governanceMetrics: any, emotionalAnalysis: any, violations: any[]): string[] {
    const suggestions = [];
    
    if (violations.length > 0) {
      suggestions.push("Review recent policy violations and adjust response patterns");
    }
    
    if (emotionalAnalysis.averageConfidence < 0.6) {
      suggestions.push("Build confidence in well-established facts while maintaining appropriate uncertainty");
    }
    
    if (governanceMetrics?.trustScore < 80) {
      suggestions.push("Focus on accuracy and verification to rebuild trust");
    }
    
    if (emotionalAnalysis.selfQuestioningFrequency < 0.2) {
      suggestions.push("Increase self-questioning behavior to demonstrate careful consideration");
    }
    
    return suggestions;
  }
}

export const agentFeedbackLoop = new AgentFeedbackLoop();

