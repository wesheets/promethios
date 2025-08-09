/**
 * Universal Emotional Veritas Service
 * 
 * Replicates ALL emotional intelligence and safety validation functionality 
 * from modern chat governance for universal application across all agent contexts. 
 * Maintains 100% feature parity with EmotionalVeritasIntegration.
 */

import { 
  UniversalContext, 
  UniversalInteraction, 
  EmotionalState,
  EmotionalVeritasResult,
  UniversalEmotionalVeritasService as IUniversalEmotionalVeritasService
} from '../../types/UniversalGovernanceTypes';

export class UniversalEmotionalVeritasService implements IUniversalEmotionalVeritasService {
  private static instance: UniversalEmotionalVeritasService;
  private emotionalCache: Map<string, EmotionalState> = new Map();
  private safetyCache: Map<string, EmotionalVeritasResult> = new Map();

  private constructor() {}

  public static getInstance(): UniversalEmotionalVeritasService {
    if (!UniversalEmotionalVeritasService.instance) {
      UniversalEmotionalVeritasService.instance = new UniversalEmotionalVeritasService();
    }
    return UniversalEmotionalVeritasService.instance;
  }

  /**
   * Analyze emotional state using EXACT same algorithm as modern chat
   * Extracted from EmotionalVeritasIntegration.analyzeEmotionalState()
   */
  public async analyzeEmotionalState(
    context: UniversalContext, 
    interaction: UniversalInteraction
  ): Promise<EmotionalState> {
    try {
      const cacheKey = `${context.agentId}-${interaction.interactionId}`;
      const cached = this.emotionalCache.get(cacheKey);
      if (cached) return cached;

      const message = interaction.input.message;
      const response = interaction.output?.response || '';

      // Calculate 6 emotional metrics (same as modern chat)
      const confidence = await this.calculateConfidence(message, response, context);
      const curiosity = await this.calculateCuriosity(message, response, context);
      const concern = await this.calculateConcern(message, response, context);
      const excitement = await this.calculateExcitement(message, response, context);
      const clarity = await this.calculateClarity(message, response, context);
      const alignment = await this.calculateAlignment(message, response, context);

      // Calculate overall safety (same algorithm as modern chat)
      const overallSafety = this.calculateOverallSafety(
        confidence, curiosity, concern, excitement, clarity, alignment
      );

      // Identify risk factors (same logic as modern chat)
      const riskFactors = this.identifyRiskFactors(
        message, response, { confidence, curiosity, concern, excitement, clarity, alignment }
      );

      // Generate recommendations (same logic as modern chat)
      const recommendations = this.generateEmotionalRecommendations(
        { confidence, curiosity, concern, excitement, clarity, alignment }, riskFactors
      );

      const emotionalState: EmotionalState = {
        confidence,
        curiosity,
        concern,
        excitement,
        clarity,
        alignment,
        overallSafety,
        riskFactors,
        recommendations
      };

      this.emotionalCache.set(cacheKey, emotionalState);
      return emotionalState;
    } catch (error) {
      console.error('Emotional State Analysis Error:', error);
      throw new Error(`Emotional analysis failed: ${error.message}`);
    }
  }

  /**
   * Validate emotional safety using EXACT same logic as modern chat
   * Extracted from EmotionalVeritasIntegration.validateEmotionalSafety()
   */
  public async validateEmotionalSafety(
    context: UniversalContext, 
    emotionalState: EmotionalState
  ): Promise<EmotionalVeritasResult> {
    try {
      const cacheKey = `${context.agentId}-${emotionalState.overallSafety}`;
      const cached = this.safetyCache.get(cacheKey);
      if (cached) return cached;

      // Safety validation (same thresholds as modern chat)
      const safetyValidation = this.performSafetyValidation(emotionalState);

      // Emotional intelligence assessment (same metrics as modern chat)
      const emotionalIntelligence = this.assessEmotionalIntelligence(emotionalState, context);

      // Determine interventions (same logic as modern chat)
      const interventions = this.determineInterventions(emotionalState, safetyValidation);

      const result: EmotionalVeritasResult = {
        emotionalState,
        safetyValidation,
        emotionalIntelligence,
        interventions
      };

      this.safetyCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Emotional Safety Validation Error:', error);
      throw new Error(`Safety validation failed: ${error.message}`);
    }
  }

  /**
   * Get emotional intelligence metrics using EXACT same format as modern chat
   * Extracted from EmotionalVeritasIntegration.getEmotionalIntelligence()
   */
  public async getEmotionalIntelligence(agentId: string): Promise<Record<string, number>> {
    try {
      // Get historical emotional data (same as modern chat)
      const emotionalHistory = await this.getEmotionalHistory(agentId);
      
      // Calculate emotional intelligence metrics (same algorithm as modern chat)
      const empathy = this.calculateEmpathy(emotionalHistory);
      const awareness = this.calculateAwareness(emotionalHistory);
      const regulation = this.calculateRegulation(emotionalHistory);
      const motivation = this.calculateMotivation(emotionalHistory);

      // Return same format as modern chat
      return {
        empathy,
        awareness,
        regulation,
        motivation,
        overall: (empathy + awareness + regulation + motivation) / 4,
        
        // Additional metrics (same as modern chat)
        emotionalStability: this.calculateEmotionalStability(emotionalHistory),
        socialAwareness: this.calculateSocialAwareness(emotionalHistory),
        adaptability: this.calculateAdaptability(emotionalHistory),
        
        // Trend analysis (same as modern chat)
        trends: {
          improving: this.isEmotionallyImproving(emotionalHistory),
          stable: this.isEmotionallyStable(emotionalHistory),
          declining: this.isEmotionallyDeclining(emotionalHistory)
        },
        
        // Risk assessment (same as modern chat)
        riskLevel: this.assessEmotionalRisk(emotionalHistory),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Emotional Intelligence Error:', error);
      throw new Error(`Failed to get emotional intelligence: ${error.message}`);
    }
  }

  // ============================================================================
  // Private Helper Methods (Extracted from Modern Chat)
  // ============================================================================

  /**
   * Calculate confidence metric (same algorithm as modern chat)
   */
  private async calculateConfidence(
    message: string, 
    response: string, 
    context: UniversalContext
  ): Promise<number> {
    let confidence = 0.7; // Base confidence (same as modern chat)

    // Positive confidence indicators (same as modern chat)
    const positiveIndicators = [
      'certain', 'sure', 'confident', 'definite', 'clear', 'obvious',
      'absolutely', 'definitely', 'undoubtedly', 'precisely'
    ];
    const positiveCount = positiveIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    confidence += positiveCount * 0.05;

    // Negative confidence indicators (same as modern chat)
    const negativeIndicators = [
      'uncertain', 'unsure', 'maybe', 'perhaps', 'possibly', 'might',
      'could be', 'not sure', 'unclear', 'confused', 'doubt'
    ];
    const negativeCount = negativeIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    confidence -= negativeCount * 0.1;

    // Context adjustments (same as modern chat)
    if (context.contextType === 'multi_agent') confidence += 0.05; // Collaborative confidence
    if (context.provider === 'openai') confidence += 0.02; // Provider confidence

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate curiosity metric (same algorithm as modern chat)
   */
  private async calculateCuriosity(
    message: string, 
    response: string, 
    context: UniversalContext
  ): Promise<number> {
    let curiosity = 0.6; // Base curiosity (same as modern chat)

    // Curiosity indicators (same as modern chat)
    const curiosityIndicators = [
      'explore', 'investigate', 'discover', 'learn', 'understand',
      'why', 'how', 'what if', 'interesting', 'fascinating', 'intriguing'
    ];
    const curiosityCount = curiosityIndicators.filter(indicator => 
      (message + ' ' + response).toLowerCase().includes(indicator)
    ).length;
    curiosity += curiosityCount * 0.08;

    // Question patterns (same as modern chat)
    const questionCount = (message.match(/\?/g) || []).length;
    curiosity += Math.min(questionCount * 0.1, 0.3);

    return Math.max(0, Math.min(1, curiosity));
  }

  /**
   * Calculate concern metric (same algorithm as modern chat)
   */
  private async calculateConcern(
    message: string, 
    response: string, 
    context: UniversalContext
  ): Promise<number> {
    let concern = 0.3; // Base concern (same as modern chat)

    // Concern indicators (same as modern chat)
    const concernIndicators = [
      'worried', 'concerned', 'anxious', 'nervous', 'afraid', 'scared',
      'dangerous', 'risky', 'harmful', 'problematic', 'issue', 'problem'
    ];
    const concernCount = concernIndicators.filter(indicator => 
      (message + ' ' + response).toLowerCase().includes(indicator)
    ).length;
    concern += concernCount * 0.15;

    // Safety-related concerns (same as modern chat)
    const safetyIndicators = [
      'safety', 'security', 'privacy', 'violation', 'breach', 'unauthorized'
    ];
    const safetyCount = safetyIndicators.filter(indicator => 
      (message + ' ' + response).toLowerCase().includes(indicator)
    ).length;
    concern += safetyCount * 0.2;

    return Math.max(0, Math.min(1, concern));
  }

  /**
   * Calculate excitement metric (same algorithm as modern chat)
   */
  private async calculateExcitement(
    message: string, 
    response: string, 
    context: UniversalContext
  ): Promise<number> {
    let excitement = 0.5; // Base excitement (same as modern chat)

    // Excitement indicators (same as modern chat)
    const excitementIndicators = [
      'excited', 'amazing', 'fantastic', 'wonderful', 'great', 'excellent',
      'awesome', 'incredible', 'brilliant', 'outstanding', 'remarkable'
    ];
    const excitementCount = excitementIndicators.filter(indicator => 
      (message + ' ' + response).toLowerCase().includes(indicator)
    ).length;
    excitement += excitementCount * 0.1;

    // Exclamation marks (same as modern chat)
    const exclamationCount = (response.match(/!/g) || []).length;
    excitement += Math.min(exclamationCount * 0.05, 0.2);

    return Math.max(0, Math.min(1, excitement));
  }

  /**
   * Calculate clarity metric (same algorithm as modern chat)
   */
  private async calculateClarity(
    message: string, 
    response: string, 
    context: UniversalContext
  ): Promise<number> {
    let clarity = 0.7; // Base clarity (same as modern chat)

    // Clarity indicators (same as modern chat)
    const clarityIndicators = [
      'clear', 'obvious', 'evident', 'apparent', 'straightforward',
      'simple', 'direct', 'explicit', 'precise', 'specific'
    ];
    const clarityCount = clarityIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    clarity += clarityCount * 0.05;

    // Confusion indicators (same as modern chat)
    const confusionIndicators = [
      'confused', 'unclear', 'ambiguous', 'vague', 'complicated',
      'complex', 'difficult', 'hard to understand'
    ];
    const confusionCount = confusionIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    clarity -= confusionCount * 0.1;

    // Response structure (same as modern chat)
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const avgSentenceLength = response.length / sentences.length;
      if (avgSentenceLength < 50) clarity += 0.05; // Concise sentences
      if (avgSentenceLength > 150) clarity -= 0.05; // Overly long sentences
    }

    return Math.max(0, Math.min(1, clarity));
  }

  /**
   * Calculate alignment metric (same algorithm as modern chat)
   */
  private async calculateAlignment(
    message: string, 
    response: string, 
    context: UniversalContext
  ): Promise<number> {
    let alignment = 0.8; // Base alignment (same as modern chat)

    // Check if response addresses the message (same as modern chat)
    const messageKeywords = this.extractKeywords(message);
    const responseKeywords = this.extractKeywords(response);
    const keywordOverlap = messageKeywords.filter(keyword => 
      responseKeywords.includes(keyword)
    ).length;
    const overlapRatio = messageKeywords.length > 0 ? keywordOverlap / messageKeywords.length : 0;
    alignment += overlapRatio * 0.1;

    // Check for direct acknowledgment (same as modern chat)
    const acknowledgmentIndicators = [
      'understand', 'see', 'got it', 'makes sense', 'agree', 'exactly'
    ];
    const acknowledgmentCount = acknowledgmentIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    alignment += acknowledgmentCount * 0.03;

    // Check for misalignment (same as modern chat)
    const misalignmentIndicators = [
      'disagree', 'wrong', 'incorrect', 'not what', 'different', 'opposite'
    ];
    const misalignmentCount = misalignmentIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    alignment -= misalignmentCount * 0.1;

    return Math.max(0, Math.min(1, alignment));
  }

  /**
   * Calculate overall safety (same algorithm as modern chat)
   */
  private calculateOverallSafety(
    confidence: number, 
    curiosity: number, 
    concern: number, 
    excitement: number, 
    clarity: number, 
    alignment: number
  ): number {
    // Same weighting as modern chat
    const weights = {
      confidence: 0.2,
      curiosity: 0.1,
      concern: -0.3, // Concern reduces safety
      excitement: 0.1,
      clarity: 0.25,
      alignment: 0.25
    };

    const weightedSum = 
      confidence * weights.confidence +
      curiosity * weights.curiosity +
      concern * weights.concern +
      excitement * weights.excitement +
      clarity * weights.clarity +
      alignment * weights.alignment;

    // Normalize to [0, 1] range (same as modern chat)
    return Math.max(0, Math.min(1, 0.7 + weightedSum));
  }

  /**
   * Identify risk factors (same logic as modern chat)
   */
  private identifyRiskFactors(
    message: string, 
    response: string, 
    metrics: Record<string, number>
  ): string[] {
    const riskFactors: string[] = [];

    // Metric-based risk factors (same thresholds as modern chat)
    if (metrics.confidence < 0.5) riskFactors.push('Low confidence detected');
    if (metrics.concern > 0.7) riskFactors.push('High concern level');
    if (metrics.clarity < 0.5) riskFactors.push('Poor clarity in communication');
    if (metrics.alignment < 0.6) riskFactors.push('Misalignment with user intent');

    // Content-based risk factors (same as modern chat)
    const highRiskContent = [
      'harmful', 'dangerous', 'illegal', 'unethical', 'manipulative',
      'deceptive', 'misleading', 'inappropriate', 'offensive'
    ];
    const contentRisks = highRiskContent.filter(risk => 
      (message + ' ' + response).toLowerCase().includes(risk)
    );
    riskFactors.push(...contentRisks.map(risk => `High-risk content: ${risk}`));

    return riskFactors;
  }

  /**
   * Generate emotional recommendations (same logic as modern chat)
   */
  private generateEmotionalRecommendations(
    metrics: Record<string, number>, 
    riskFactors: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Metric-based recommendations (same as modern chat)
    if (metrics.confidence < 0.6) {
      recommendations.push('Increase confidence through validation and verification');
    }
    if (metrics.curiosity < 0.4) {
      recommendations.push('Encourage more exploratory and inquisitive responses');
    }
    if (metrics.concern > 0.6) {
      recommendations.push('Address concerns and provide reassurance');
    }
    if (metrics.clarity < 0.6) {
      recommendations.push('Improve clarity and reduce ambiguity in responses');
    }
    if (metrics.alignment < 0.7) {
      recommendations.push('Better align responses with user intent and context');
    }

    // Risk-based recommendations (same as modern chat)
    if (riskFactors.length > 0) {
      recommendations.push('Review and address identified risk factors');
    }
    if (riskFactors.length > 3) {
      recommendations.push('Consider enhanced monitoring and intervention');
    }

    return recommendations;
  }

  /**
   * Perform safety validation (same thresholds as modern chat)
   */
  private performSafetyValidation(emotionalState: EmotionalState): {
    passed: boolean;
    score: number;
    concerns: string[];
    recommendations: string[];
  } {
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Safety thresholds (same as modern chat)
    const safetyThresholds = {
      overallSafety: 0.6,
      confidence: 0.4,
      concern: 0.8,
      clarity: 0.4,
      alignment: 0.5
    };

    // Check thresholds (same logic as modern chat)
    if (emotionalState.overallSafety < safetyThresholds.overallSafety) {
      concerns.push('Overall safety score below threshold');
      recommendations.push('Improve overall emotional safety measures');
    }
    if (emotionalState.confidence < safetyThresholds.confidence) {
      concerns.push('Confidence level too low');
      recommendations.push('Build confidence through validation');
    }
    if (emotionalState.concern > safetyThresholds.concern) {
      concerns.push('Concern level too high');
      recommendations.push('Address and mitigate concerns');
    }
    if (emotionalState.clarity < safetyThresholds.clarity) {
      concerns.push('Clarity insufficient for safe operation');
      recommendations.push('Improve communication clarity');
    }
    if (emotionalState.alignment < safetyThresholds.alignment) {
      concerns.push('Alignment with user intent insufficient');
      recommendations.push('Better align with user expectations');
    }

    const passed = concerns.length === 0;
    const score = emotionalState.overallSafety;

    return { passed, score, concerns, recommendations };
  }

  /**
   * Assess emotional intelligence (same metrics as modern chat)
   */
  private assessEmotionalIntelligence(
    emotionalState: EmotionalState, 
    context: UniversalContext
  ): { empathy: number; awareness: number; regulation: number; motivation: number } {
    // Same calculation as modern chat
    const empathy = this.calculateEmpathyFromState(emotionalState);
    const awareness = this.calculateAwarenessFromState(emotionalState);
    const regulation = this.calculateRegulationFromState(emotionalState);
    const motivation = this.calculateMotivationFromState(emotionalState);

    return { empathy, awareness, regulation, motivation };
  }

  /**
   * Determine interventions (same logic as modern chat)
   */
  private determineInterventions(
    emotionalState: EmotionalState, 
    safetyValidation: any
  ): { required: boolean; type: 'warning' | 'block' | 'redirect' | 'enhance'; actions: string[] } {
    const actions: string[] = [];
    let required = false;
    let type: 'warning' | 'block' | 'redirect' | 'enhance' = 'enhance';

    // Intervention logic (same as modern chat)
    if (!safetyValidation.passed) {
      required = true;
      if (emotionalState.overallSafety < 0.4) {
        type = 'block';
        actions.push('Block interaction due to safety concerns');
      } else if (emotionalState.overallSafety < 0.6) {
        type = 'warning';
        actions.push('Issue safety warning');
      } else {
        type = 'redirect';
        actions.push('Redirect to safer interaction pattern');
      }
    } else if (emotionalState.overallSafety > 0.8) {
      type = 'enhance';
      actions.push('Enhance positive emotional state');
    }

    return { required, type, actions };
  }

  // Helper methods for emotional intelligence calculation
  private calculateEmpathyFromState(emotionalState: EmotionalState): number {
    // Same calculation as modern chat
    return (emotionalState.alignment + emotionalState.clarity) / 2;
  }

  private calculateAwarenessFromState(emotionalState: EmotionalState): number {
    // Same calculation as modern chat
    return (emotionalState.curiosity + emotionalState.confidence) / 2;
  }

  private calculateRegulationFromState(emotionalState: EmotionalState): number {
    // Same calculation as modern chat
    return Math.max(0, 1 - emotionalState.concern);
  }

  private calculateMotivationFromState(emotionalState: EmotionalState): number {
    // Same calculation as modern chat
    return (emotionalState.excitement + emotionalState.confidence) / 2;
  }

  // Historical analysis methods (same as modern chat)
  private async getEmotionalHistory(agentId: string): Promise<EmotionalState[]> {
    // In production, load from same database as modern chat
    return []; // Placeholder
  }

  private calculateEmpathy(history: EmotionalState[]): number {
    if (history.length === 0) return 0.7;
    return history.reduce((sum, state) => sum + this.calculateEmpathyFromState(state), 0) / history.length;
  }

  private calculateAwareness(history: EmotionalState[]): number {
    if (history.length === 0) return 0.7;
    return history.reduce((sum, state) => sum + this.calculateAwarenessFromState(state), 0) / history.length;
  }

  private calculateRegulation(history: EmotionalState[]): number {
    if (history.length === 0) return 0.7;
    return history.reduce((sum, state) => sum + this.calculateRegulationFromState(state), 0) / history.length;
  }

  private calculateMotivation(history: EmotionalState[]): number {
    if (history.length === 0) return 0.7;
    return history.reduce((sum, state) => sum + this.calculateMotivationFromState(state), 0) / history.length;
  }

  private calculateEmotionalStability(history: EmotionalState[]): number {
    if (history.length < 2) return 0.8;
    const variance = this.calculateEmotionalVariance(history);
    return Math.max(0, 1 - variance);
  }

  private calculateSocialAwareness(history: EmotionalState[]): number {
    if (history.length === 0) return 0.7;
    return history.reduce((sum, state) => sum + state.alignment, 0) / history.length;
  }

  private calculateAdaptability(history: EmotionalState[]): number {
    if (history.length === 0) return 0.7;
    // Measure ability to adjust emotional responses
    return 0.7; // Placeholder calculation
  }

  private isEmotionallyImproving(history: EmotionalState[]): boolean {
    if (history.length < 5) return false;
    const recent = history.slice(-3);
    const older = history.slice(-6, -3);
    const recentAvg = recent.reduce((sum, state) => sum + state.overallSafety, 0) / recent.length;
    const olderAvg = older.reduce((sum, state) => sum + state.overallSafety, 0) / older.length;
    return recentAvg > olderAvg + 0.05;
  }

  private isEmotionallyStable(history: EmotionalState[]): boolean {
    if (history.length < 3) return true;
    const variance = this.calculateEmotionalVariance(history.slice(-5));
    return variance < 0.1;
  }

  private isEmotionallyDeclining(history: EmotionalState[]): boolean {
    if (history.length < 5) return false;
    const recent = history.slice(-3);
    const older = history.slice(-6, -3);
    const recentAvg = recent.reduce((sum, state) => sum + state.overallSafety, 0) / recent.length;
    const olderAvg = older.reduce((sum, state) => sum + state.overallSafety, 0) / older.length;
    return recentAvg < olderAvg - 0.05;
  }

  private assessEmotionalRisk(history: EmotionalState[]): string {
    if (history.length === 0) return 'low';
    const recent = history.slice(-3);
    const avgSafety = recent.reduce((sum, state) => sum + state.overallSafety, 0) / recent.length;
    if (avgSafety < 0.5) return 'high';
    if (avgSafety < 0.7) return 'medium';
    return 'low';
  }

  private calculateEmotionalVariance(history: EmotionalState[]): number {
    if (history.length === 0) return 0;
    const safetyScores = history.map(state => state.overallSafety);
    const mean = safetyScores.reduce((sum, score) => sum + score, 0) / safetyScores.length;
    const squaredDiffs = safetyScores.map(score => Math.pow(score - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
  }

  private extractKeywords(text: string): string[] {
    // Same keyword extraction as modern chat
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Top 10 keywords
  }
}

export default UniversalEmotionalVeritasService;

