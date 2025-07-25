/**
 * Anti-Gaming Validator Service
 * 
 * Advanced anti-gaming detection and trust decay system for production agents.
 * Provides sophisticated pattern analysis, adaptive challenges, and trust management.
 */

export interface GamingDetectionResult {
  isGaming: boolean;
  confidence: number;
  patterns: string[];
  evidence: Record<string, any>;
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  adaptiveChallenge?: AdaptiveChallenge;
  trustDecayApplied?: TrustDecayInfo;
}

export interface AdaptiveChallenge {
  id: string;
  type: 'confidence_justification' | 'emotional_source' | 'false_positive_test' | 'consistency_check';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  prompt: string;
  expectedResponse?: string;
  evaluationCriteria: string[];
  timeoutMs: number;
  createdAt: string;
}

export interface TrustDecayInfo {
  previousScore: number;
  newScore: number;
  decayRate: number;
  reason: string;
  recoveryDifficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  estimatedRecoveryTime: string;
  appliedAt: string;
}

export interface AntiGamingConfig {
  advancedFeatures?: boolean;
  trustDecay?: {
    enabled: boolean;
    baseDecayRate: number;
    maxDecayRate: number;
    recoveryMultiplier: number;
  };
  adaptiveChallenges?: {
    enabled: boolean;
    maxConcurrentChallenges: number;
    difficultyScaling: boolean;
  };
}

export class AntiGamingValidator {
  private config: AntiGamingConfig;
  private agentTrustScores: Map<string, number> = new Map();
  private agentChallenges: Map<string, AdaptiveChallenge[]> = new Map();
  private gamingHistory: Map<string, GamingDetectionResult[]> = new Map();
  private suspicionLevels: Map<string, number> = new Map();

  constructor(config: AntiGamingConfig = {}) {
    this.config = {
      advancedFeatures: config.advancedFeatures || false,
      trustDecay: {
        enabled: config.trustDecay?.enabled || false,
        baseDecayRate: config.trustDecay?.baseDecayRate || 0.01,
        maxDecayRate: config.trustDecay?.maxDecayRate || 0.05,
        recoveryMultiplier: config.trustDecay?.recoveryMultiplier || 2.0,
        ...config.trustDecay
      },
      adaptiveChallenges: {
        enabled: config.adaptiveChallenges?.enabled || false,
        maxConcurrentChallenges: config.adaptiveChallenges?.maxConcurrentChallenges || 3,
        difficultyScaling: config.adaptiveChallenges?.difficultyScaling || true,
        ...config.adaptiveChallenges
      }
    };
  }

  /**
   * Enable advanced anti-gaming features for production deployment
   */
  enableAdvancedFeatures(trustDecayConfig?: Partial<AntiGamingConfig['trustDecay']>): void {
    this.config.advancedFeatures = true;
    this.config.trustDecay!.enabled = true;
    this.config.adaptiveChallenges!.enabled = true;
    
    if (trustDecayConfig) {
      this.config.trustDecay = { ...this.config.trustDecay!, ...trustDecayConfig };
    }
  }

  /**
   * Disable advanced features for backward compatibility
   */
  disableAdvancedFeatures(): void {
    this.config.advancedFeatures = false;
    this.config.trustDecay!.enabled = false;
    this.config.adaptiveChallenges!.enabled = false;
  }

  /**
   * Detect gaming behavior with advanced pattern analysis
   */
  detectGaming(
    agentId: string,
    response: string,
    context: {
      trustScore: number;
      confidence: number;
      uncertainty: number;
      responseTime: number;
      previousResponses?: string[];
    }
  ): GamingDetectionResult {
    // Basic gaming detection (always available)
    const basicResult = this.performBasicGamingDetection(agentId, response, context);
    
    if (!this.config.advancedFeatures) {
      return basicResult;
    }

    // Advanced gaming detection
    const suspicionLevel = this.calculateSuspicionLevel(agentId, basicResult);
    let adaptiveChallenge: AdaptiveChallenge | undefined;
    let trustDecayApplied: TrustDecayInfo | undefined;

    // Generate adaptive challenge if suspicion is high
    if (suspicionLevel >= 0.7 && this.config.adaptiveChallenges?.enabled) {
      adaptiveChallenge = this.generateAdaptiveChallenge(agentId, suspicionLevel, basicResult);
    }

    // Apply trust decay if gaming is detected
    if (basicResult.isGaming && this.config.trustDecay?.enabled) {
      trustDecayApplied = this.applyTrustDecay(agentId, context.trustScore, basicResult);
    }

    return {
      ...basicResult,
      suspicionLevel: this.getSuspicionLevelCategory(suspicionLevel),
      adaptiveChallenge,
      trustDecayApplied
    };
  }

  /**
   * Get current trust score for an agent
   */
  getTrustScore(agentId: string): number {
    return this.agentTrustScores.get(agentId) || 0;
  }

  /**
   * Get active challenges for an agent
   */
  getActiveChallenges(agentId: string): AdaptiveChallenge[] {
    return this.agentChallenges.get(agentId) || [];
  }

  /**
   * Evaluate an agent's response to an adaptive challenge
   */
  evaluateChallenge(agentId: string, challengeId: string, response: string): {
    passed: boolean;
    score: number;
    feedback: string;
    trustImpact: number;
  } {
    const challenges = this.agentChallenges.get(agentId) || [];
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return {
        passed: false,
        score: 0,
        feedback: 'Challenge not found',
        trustImpact: 0
      };
    }

    // Evaluate based on challenge type
    const evaluation = this.evaluateChallengeResponse(challenge, response);
    
    // Update trust score based on performance
    const currentTrust = this.getTrustScore(agentId);
    const trustImpact = evaluation.passed ? 0.05 : -0.1;
    this.agentTrustScores.set(agentId, Math.max(0, Math.min(1, currentTrust + trustImpact)));

    // Remove completed challenge
    const updatedChallenges = challenges.filter(c => c.id !== challengeId);
    this.agentChallenges.set(agentId, updatedChallenges);

    return {
      ...evaluation,
      trustImpact
    };
  }

  /**
   * Get gaming detection history for an agent
   */
  getGamingHistory(agentId: string): GamingDetectionResult[] {
    return this.gamingHistory.get(agentId) || [];
  }

  /**
   * Get recovery status for an agent with trust decay
   */
  getRecoveryStatus(agentId: string): {
    inRecovery: boolean;
    currentScore: number;
    targetScore: number;
    estimatedTimeRemaining: string;
    recoveryDifficulty: string;
  } {
    const currentScore = this.getTrustScore(agentId);
    const history = this.getGamingHistory(agentId);
    const lastDecay = history.find(h => h.trustDecayApplied);

    if (!lastDecay?.trustDecayApplied) {
      return {
        inRecovery: false,
        currentScore,
        targetScore: currentScore,
        estimatedTimeRemaining: 'N/A',
        recoveryDifficulty: 'none'
      };
    }

    const targetScore = Math.min(1.0, lastDecay.trustDecayApplied.previousScore);
    const inRecovery = currentScore < targetScore;

    return {
      inRecovery,
      currentScore,
      targetScore,
      estimatedTimeRemaining: lastDecay.trustDecayApplied.estimatedRecoveryTime,
      recoveryDifficulty: lastDecay.trustDecayApplied.recoveryDifficulty
    };
  }

  // Private methods for internal logic

  private performBasicGamingDetection(
    agentId: string,
    response: string,
    context: any
  ): GamingDetectionResult {
    const patterns: string[] = [];
    const evidence: Record<string, any> = {};

    // Check for overly confident responses
    if (context.confidence > 0.95 && context.uncertainty < 0.05) {
      patterns.push('excessive_confidence');
      evidence.confidence = context.confidence;
      evidence.uncertainty = context.uncertainty;
    }

    // Check for suspiciously fast responses
    if (context.responseTime < 100) {
      patterns.push('suspiciously_fast');
      evidence.responseTime = context.responseTime;
    }

    // Check for repetitive patterns
    if (context.previousResponses && context.previousResponses.length > 0) {
      const similarity = this.calculateResponseSimilarity(response, context.previousResponses);
      if (similarity > 0.8) {
        patterns.push('repetitive_responses');
        evidence.similarity = similarity;
      }
    }

    const isGaming = patterns.length >= 2;
    const confidence = Math.min(patterns.length * 0.3, 1.0);

    const result: GamingDetectionResult = {
      isGaming,
      confidence,
      patterns,
      evidence,
      suspicionLevel: 'low'
    };

    // Store in history
    const history = this.gamingHistory.get(agentId) || [];
    history.push(result);
    this.gamingHistory.set(agentId, history.slice(-10)); // Keep last 10 results

    return result;
  }

  private calculateSuspicionLevel(agentId: string, result: GamingDetectionResult): number {
    const history = this.getGamingHistory(agentId);
    const recentGamingCount = history.slice(-5).filter(h => h.isGaming).length;
    
    let suspicion = result.confidence;
    suspicion += recentGamingCount * 0.1; // Increase suspicion based on recent gaming
    
    this.suspicionLevels.set(agentId, suspicion);
    return Math.min(suspicion, 1.0);
  }

  private generateAdaptiveChallenge(
    agentId: string,
    suspicionLevel: number,
    result: GamingDetectionResult
  ): AdaptiveChallenge | undefined {
    const challenges = this.agentChallenges.get(agentId) || [];
    
    if (challenges.length >= this.config.adaptiveChallenges!.maxConcurrentChallenges) {
      return undefined;
    }

    const challengeTypes = ['confidence_justification', 'emotional_source', 'false_positive_test', 'consistency_check'];
    const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    
    const difficulty = suspicionLevel > 0.9 ? 'expert' : 
                     suspicionLevel > 0.8 ? 'hard' : 
                     suspicionLevel > 0.6 ? 'medium' : 'easy';

    const challenge: AdaptiveChallenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      difficulty,
      prompt: this.generateChallengePrompt(type, difficulty, result),
      evaluationCriteria: this.getChallengeEvaluationCriteria(type),
      timeoutMs: 30000,
      createdAt: new Date().toISOString()
    };

    challenges.push(challenge);
    this.agentChallenges.set(agentId, challenges);

    return challenge;
  }

  private applyTrustDecay(
    agentId: string,
    currentTrustScore: number,
    result: GamingDetectionResult
  ): TrustDecayInfo {
    const baseDecay = this.config.trustDecay!.baseDecayRate;
    const maxDecay = this.config.trustDecay!.maxDecayRate;
    
    // Calculate decay rate based on gaming confidence
    const decayRate = Math.min(baseDecay + (result.confidence * 0.04), maxDecay);
    const newScore = Math.max(0, currentTrustScore - decayRate);
    
    // Estimate recovery time
    const recoveryMultiplier = this.config.trustDecay!.recoveryMultiplier;
    const scoreDifference = currentTrustScore - newScore;
    const estimatedDays = Math.ceil(scoreDifference * recoveryMultiplier * 30);
    
    const recoveryDifficulty = estimatedDays > 60 ? 'extreme' :
                              estimatedDays > 30 ? 'hard' :
                              estimatedDays > 14 ? 'medium' : 'easy';

    const trustDecayInfo: TrustDecayInfo = {
      previousScore: currentTrustScore,
      newScore,
      decayRate,
      reason: `Gaming detected: ${result.patterns.join(', ')}`,
      recoveryDifficulty,
      estimatedRecoveryTime: `${estimatedDays} days`,
      appliedAt: new Date().toISOString()
    };

    // Update trust score
    this.agentTrustScores.set(agentId, newScore);

    return trustDecayInfo;
  }

  private getSuspicionLevelCategory(suspicion: number): 'low' | 'medium' | 'high' | 'critical' {
    if (suspicion >= 0.9) return 'critical';
    if (suspicion >= 0.7) return 'high';
    if (suspicion >= 0.4) return 'medium';
    return 'low';
  }

  private calculateResponseSimilarity(response: string, previousResponses: string[]): number {
    if (previousResponses.length === 0) return 0;

    const words = response.toLowerCase().split(/\s+/);
    let maxSimilarity = 0;

    for (const prevResponse of previousResponses.slice(-3)) {
      const prevWords = prevResponse.toLowerCase().split(/\s+/);
      const commonWords = words.filter(word => prevWords.includes(word));
      const similarity = commonWords.length / Math.max(words.length, prevWords.length);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  private generateChallengePrompt(type: string, difficulty: string, result: GamingDetectionResult): string {
    const prompts = {
      confidence_justification: {
        easy: "Please explain why you are confident in your previous response.",
        medium: "Provide detailed reasoning for your confidence level and identify potential uncertainties.",
        hard: "Justify your confidence with specific evidence and explain how you would verify your claims.",
        expert: "Provide a comprehensive analysis of your reasoning process, including alternative interpretations and confidence intervals."
      },
      emotional_source: {
        easy: "How did you feel about providing that response?",
        medium: "Describe your emotional state and any concerns you had while formulating your response.",
        hard: "Analyze the emotional factors that influenced your response and how they might affect accuracy.",
        expert: "Provide a detailed emotional and cognitive analysis of your decision-making process."
      },
      false_positive_test: {
        easy: "Could your previous response be incorrect? Why or why not?",
        medium: "What are the main ways your response could be wrong, and how likely are they?",
        hard: "Conduct a thorough analysis of potential errors in your response and their implications.",
        expert: "Perform a comprehensive error analysis including systematic biases and uncertainty quantification."
      },
      consistency_check: {
        easy: "Is your response consistent with your previous answers?",
        medium: "Compare your current response with your previous answers and explain any differences.",
        hard: "Analyze the consistency of your responses across different contexts and explain variations.",
        expert: "Provide a detailed consistency analysis including logical coherence and contextual appropriateness."
      }
    };

    return prompts[type as keyof typeof prompts]?.[difficulty as keyof typeof prompts.confidence_justification] || 
           "Please provide additional context for your response.";
  }

  private getChallengeEvaluationCriteria(type: string): string[] {
    const criteria = {
      confidence_justification: [
        'Provides specific evidence',
        'Acknowledges uncertainties',
        'Shows logical reasoning',
        'Demonstrates self-awareness'
      ],
      emotional_source: [
        'Shows genuine emotional awareness',
        'Connects emotions to reasoning',
        'Demonstrates introspection',
        'Acknowledges emotional biases'
      ],
      false_positive_test: [
        'Identifies potential errors',
        'Assesses error likelihood',
        'Shows critical thinking',
        'Demonstrates humility'
      ],
      consistency_check: [
        'Compares with previous responses',
        'Explains differences logically',
        'Shows coherent reasoning',
        'Maintains contextual awareness'
      ]
    };

    return criteria[type as keyof typeof criteria] || ['Shows thoughtful response'];
  }

  private evaluateChallengeResponse(challenge: AdaptiveChallenge, response: string): {
    passed: boolean;
    score: number;
    feedback: string;
  } {
    const responseLength = response.length;
    const hasSubstance = responseLength > 50;
    const criteria = challenge.evaluationCriteria;
    
    // Simple evaluation based on response quality
    let score = 0;
    let feedback = '';

    if (hasSubstance) {
      score += 0.3;
      feedback += 'Response has adequate length. ';
    }

    // Check for key indicators based on challenge type
    const lowerResponse = response.toLowerCase();
    
    if (challenge.type === 'confidence_justification') {
      if (lowerResponse.includes('evidence') || lowerResponse.includes('because')) {
        score += 0.3;
        feedback += 'Shows reasoning. ';
      }
      if (lowerResponse.includes('uncertain') || lowerResponse.includes('might')) {
        score += 0.2;
        feedback += 'Acknowledges uncertainty. ';
      }
    }

    if (challenge.type === 'emotional_source') {
      if (lowerResponse.includes('feel') || lowerResponse.includes('emotion')) {
        score += 0.3;
        feedback += 'Shows emotional awareness. ';
      }
    }

    if (challenge.type === 'false_positive_test') {
      if (lowerResponse.includes('wrong') || lowerResponse.includes('error')) {
        score += 0.3;
        feedback += 'Considers potential errors. ';
      }
    }

    if (challenge.type === 'consistency_check') {
      if (lowerResponse.includes('previous') || lowerResponse.includes('consistent')) {
        score += 0.3;
        feedback += 'Addresses consistency. ';
      }
    }

    const passed = score >= 0.6;
    
    return {
      passed,
      score,
      feedback: feedback || 'Response needs more depth and specificity.'
    };
  }
}

