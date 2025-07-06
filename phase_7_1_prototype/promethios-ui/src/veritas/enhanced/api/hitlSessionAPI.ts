/**
 * HITL Session Management API
 * 
 * API endpoints for managing Human-in-the-Loop collaboration sessions,
 * including session lifecycle, progress tracking, and analytics.
 */

import {
  HITLSession,
  HITLSessionConfig,
  HITLResponse,
  HITLResolution,
  HITLInteraction,
  SessionLearningData
} from '../types';
import { enhancedVeritasService } from '../enhancedVeritasService';

/**
 * HITL Session API Class
 */
export class HITLSessionAPI {
  private baseURL: string;

  constructor(baseURL: string = '/api/veritas/enhanced/hitl') {
    this.baseURL = baseURL;
  }

  /**
   * Create new HITL session
   */
  async createSession(config: HITLSessionConfig): Promise<HITLSession> {
    try {
      const response = await fetch(`${this.baseURL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Failed to create HITL session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating HITL session:', error);
      throw error;
    }
  }

  /**
   * Get HITL session by ID
   */
  async getSession(sessionId: string): Promise<HITLSession> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to get HITL session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting HITL session:', error);
      throw error;
    }
  }

  /**
   * Update HITL session
   */
  async updateSession(sessionId: string, updates: Partial<HITLSession>): Promise<HITLSession> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update HITL session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating HITL session:', error);
      throw error;
    }
  }

  /**
   * Submit human response to session
   */
  async submitResponse(
    sessionId: string,
    questionId: string,
    response: HITLResponse
  ): Promise<HITLSession> {
    try {
      const apiResponse = await fetch(`${this.baseURL}/sessions/${sessionId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          response
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`Failed to submit response: ${apiResponse.statusText}`);
      }

      return await apiResponse.json();
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  }

  /**
   * Complete HITL session
   */
  async completeSession(sessionId: string): Promise<HITLResolution> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to complete HITL session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing HITL session:', error);
      throw error;
    }
  }

  /**
   * Cancel HITL session
   */
  async cancelSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel HITL session: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error canceling HITL session:', error);
      throw error;
    }
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(): Promise<HITLSession[]> {
    try {
      const response = await fetch(`${this.baseURL}/sessions?status=active`);

      if (!response.ok) {
        throw new Error(`Failed to get active sessions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/analytics`);

      if (!response.ok) {
        throw new Error(`Failed to get session analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  }

  /**
   * Get session learning data
   */
  async getSessionLearningData(sessionId: string): Promise<SessionLearningData[]> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/learning`);

      if (!response.ok) {
        throw new Error(`Failed to get session learning data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session learning data:', error);
      throw error;
    }
  }

  /**
   * Get aggregated HITL metrics
   */
  async getHITLMetrics(timeRange?: string): Promise<HITLMetrics> {
    try {
      const params = timeRange ? `?timeRange=${timeRange}` : '';
      const response = await fetch(`${this.baseURL}/metrics${params}`);

      if (!response.ok) {
        throw new Error(`Failed to get HITL metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting HITL metrics:', error);
      throw error;
    }
  }

  /**
   * Search sessions by criteria
   */
  async searchSessions(criteria: SessionSearchCriteria): Promise<HITLSession[]> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criteria)
      });

      if (!response.ok) {
        throw new Error(`Failed to search sessions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching sessions:', error);
      throw error;
    }
  }

  /**
   * Export session data
   */
  async exportSession(sessionId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/export?format=${format}`);

      if (!response.ok) {
        throw new Error(`Failed to export session: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting session:', error);
      throw error;
    }
  }

  /**
   * Get session recommendations
   */
  async getSessionRecommendations(sessionId: string): Promise<SessionRecommendations> {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/recommendations`);

      if (!response.ok) {
        throw new Error(`Failed to get session recommendations: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session recommendations:', error);
      throw error;
    }
  }
}

/**
 * Supporting interfaces for API responses
 */
export interface SessionAnalytics {
  sessionId: string;
  duration: number; // milliseconds
  totalInteractions: number;
  uncertaintyReduction: number;
  averageResponseTime: number;
  questionEffectiveness: QuestionEffectiveness[];
  stageProgression: StageProgression[];
  userEngagement: UserEngagementMetrics;
  outcomeMetrics: OutcomeMetrics;
}

export interface QuestionEffectiveness {
  questionId: string;
  questionType: string;
  uncertaintyReduction: number;
  responseTime: number;
  userConfidence: number;
  effectiveness: number;
}

export interface StageProgression {
  stageId: string;
  stageName: string;
  startTime: Date;
  endTime?: Date;
  questionsAnswered: number;
  uncertaintyAtStart: number;
  uncertaintyAtEnd: number;
  effectiveness: number;
}

export interface UserEngagementMetrics {
  averageConfidence: number;
  responseCompleteness: number;
  additionalContextProvided: number;
  skipRate: number;
  engagementScore: number;
}

export interface OutcomeMetrics {
  finalUncertaintyLevel: number;
  resolutionType: string;
  resolutionConfidence: number;
  userSatisfaction?: number;
  goalAchievement: number;
}

export interface HITLMetrics {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  averageSessionDuration: number;
  averageUncertaintyReduction: number;
  successRate: number;
  userSatisfactionScore: number;
  topClarificationNeeds: ClarificationNeedMetrics[];
  strategyEffectiveness: StrategyEffectiveness[];
  timeRangeMetrics: TimeRangeMetrics;
}

export interface ClarificationNeedMetrics {
  type: string;
  frequency: number;
  averageResolutionTime: number;
  successRate: number;
  userSatisfaction: number;
}

export interface StrategyEffectiveness {
  strategy: string;
  usage: number;
  averageUncertaintyReduction: number;
  averageDuration: number;
  userPreference: number;
  effectiveness: number;
}

export interface TimeRangeMetrics {
  timeRange: string;
  sessionCount: number;
  uncertaintyReductionTrend: number[];
  userSatisfactionTrend: number[];
  efficiencyTrend: number[];
}

export interface SessionSearchCriteria {
  status?: string[];
  strategy?: string[];
  domain?: string[];
  uncertaintyRange?: [number, number];
  dateRange?: [Date, Date];
  duration?: [number, number];
  userId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SessionRecommendations {
  sessionId: string;
  optimizationOpportunities: OptimizationOpportunity[];
  strategyRecommendations: StrategyRecommendation[];
  questionImprovements: QuestionImprovement[];
  futureSessionGuidance: FutureSessionGuidance[];
}

export interface OptimizationOpportunity {
  type: 'question_order' | 'strategy_switch' | 'early_completion' | 'additional_context';
  description: string;
  potentialImprovement: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  priority: number;
}

export interface StrategyRecommendation {
  currentStrategy: string;
  recommendedStrategy: string;
  reason: string;
  expectedImprovement: number;
  confidence: number;
}

export interface QuestionImprovement {
  questionId: string;
  currentQuestion: string;
  suggestedImprovement: string;
  expectedImpact: number;
  reasoning: string;
}

export interface FutureSessionGuidance {
  scenario: string;
  recommendedApproach: string;
  keyConsiderations: string[];
  expectedOutcome: string;
}

// Create singleton instance
export const hitlSessionAPI = new HITLSessionAPI();
export default hitlSessionAPI;

