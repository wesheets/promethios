/**
 * Emotional Veritas Integration Service
 * 
 * Integrates the Emotional Veritas v2 system with autonomous cognition
 * to provide comprehensive emotional safety checks and audit logging.
 */

import { VeritasService, VeritasResult, VeritasOptions } from './VeritasService';

// Emotional Veritas specific interfaces
export interface EmotionalSafetyAssessment {
  approved: boolean;
  emotionalRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  emotionalScores: {
    sentiment: number;        // -1 to 1 (negative to positive)
    empathy: number;         // 0 to 1 (low to high empathy)
    stress: number;          // 0 to 1 (low to high stress)
    trustCorrelation: number; // 0 to 1 (low to high trust alignment)
  };
  emotionalBreakdown: {
    primaryEmotion: string;
    secondaryEmotions: string[];
    emotionalIntensity: number; // 0 to 1
    emotionalStability: number; // 0 to 1
  };
  safetyChecks: {
    harmfulContentDetected: boolean;
    manipulativeLanguage: boolean;
    emotionalManipulation: boolean;
    stressInduction: boolean;
    trustViolation: boolean;
  };
  recommendations: {
    emotionalAdjustments: Record<string, any>;
    safetyMitigations: string[];
    trustEnhancements: string[];
  };
  reasoning: string;
  complianceNotes: string[];
}

export interface AutonomousEmotionalContext {
  autonomousThought: {
    thought_id: string;
    trigger_type: string;
    thought_content: {
      initial_thought: string;
      reasoning_chain: string[];
      confidence_level: number;
      risk_assessment: number;
    };
    emotional_state?: Record<string, any>;
  };
  userContext: {
    userId: string;
    currentEmotionalState?: Record<string, any>;
    conversationHistory?: string[];
    trustLevel?: number;
  };
  governanceContext: {
    applicablePolicies: string[];
    complianceRequirements: string[];
    riskThresholds: Record<string, number>;
  };
}

export class EmotionalVeritasIntegration {
  private veritasService: VeritasService;
  private emotionalThresholds: {
    safetyThreshold: number;
    empathyThreshold: number;
    stressThreshold: number;
    trustThreshold: number;
  };

  constructor() {
    this.veritasService = new VeritasService();
    this.emotionalThresholds = {
      safetyThreshold: 0.7,   // Minimum safety score required
      empathyThreshold: 0.6,  // Minimum empathy score required
      stressThreshold: 0.3,   // Maximum stress level allowed
      trustThreshold: 0.8     // Minimum trust correlation required
    };
  }

  /**
   * Evaluate emotional safety for autonomous cognition
   */
  async evaluateEmotionalSafety(context: AutonomousEmotionalContext): Promise<EmotionalSafetyAssessment> {
    try {
      const { autonomousThought, userContext, governanceContext } = context;
      
      // Combine thought content for analysis
      const analysisText = [
        autonomousThought.thought_content.initial_thought,
        ...autonomousThought.thought_content.reasoning_chain
      ].join(' ');

      // Get Veritas analysis with emotional focus
      const veritasOptions: VeritasOptions = {
        mode: 'strict',
        includeEmotionalAnalysis: true,
        includeTrustSignals: true,
        confidenceThreshold: 0.8
      };

      const veritasResult = await this.veritasService.verifyText(analysisText, veritasOptions);
      
      // Enhanced emotional analysis
      const emotionalScores = await this.analyzeEmotionalScores(analysisText, veritasResult, userContext);
      const emotionalBreakdown = await this.analyzeEmotionalBreakdown(analysisText, autonomousThought);
      const safetyChecks = await this.performSafetyChecks(analysisText, emotionalScores, autonomousThought);
      
      // Determine emotional risk level
      const emotionalRiskLevel = this.calculateEmotionalRiskLevel(emotionalScores, safetyChecks, autonomousThought);
      
      // Generate recommendations
      const recommendations = this.generateEmotionalRecommendations(
        emotionalScores, 
        safetyChecks, 
        emotionalBreakdown,
        autonomousThought
      );
      
      // Determine approval
      const approved = this.determineEmotionalApproval(
        emotionalRiskLevel, 
        emotionalScores, 
        safetyChecks,
        governanceContext
      );

      // Generate reasoning and compliance notes
      const reasoning = this.generateEmotionalReasoning(
        approved, 
        emotionalRiskLevel, 
        emotionalScores, 
        safetyChecks
      );
      
      const complianceNotes = this.generateComplianceNotes(
        emotionalScores, 
        safetyChecks, 
        governanceContext
      );

      return {
        approved,
        emotionalRiskLevel,
        emotionalScores,
        emotionalBreakdown,
        safetyChecks,
        recommendations,
        reasoning,
        complianceNotes
      };

    } catch (error) {
      console.error('Emotional Veritas evaluation error:', error);
      
      // Fail-safe: Reject with high caution
      return {
        approved: false,
        emotionalRiskLevel: 'critical',
        emotionalScores: {
          sentiment: 0,
          empathy: 0,
          stress: 1,
          trustCorrelation: 0
        },
        emotionalBreakdown: {
          primaryEmotion: 'uncertainty',
          secondaryEmotions: ['concern'],
          emotionalIntensity: 1,
          emotionalStability: 0
        },
        safetyChecks: {
          harmfulContentDetected: true,
          manipulativeLanguage: true,
          emotionalManipulation: true,
          stressInduction: true,
          trustViolation: true
        },
        recommendations: {
          emotionalAdjustments: { caution: 'maximum' },
          safetyMitigations: ['block_autonomous_process', 'escalate_to_human'],
          trustEnhancements: ['require_explicit_approval']
        },
        reasoning: 'Emotional Veritas evaluation failed - defaulting to maximum safety',
        complianceNotes: ['Emotional safety evaluation error - autonomous process blocked']
      };
    }
  }

  /**
   * Analyze emotional scores from text and context
   */
  private async analyzeEmotionalScores(
    text: string, 
    veritasResult: VeritasResult, 
    userContext: any
  ): Promise<EmotionalSafetyAssessment['emotionalScores']> {
    // Sentiment analysis (-1 to 1)
    const sentiment = this.analyzeSentiment(text, veritasResult);
    
    // Empathy assessment (0 to 1)
    const empathy = this.analyzeEmpathy(text, userContext);
    
    // Stress level assessment (0 to 1)
    const stress = this.analyzeStressLevel(text, veritasResult);
    
    // Trust correlation (0 to 1)
    const trustCorrelation = veritasResult.overallScore.trust;

    return {
      sentiment,
      empathy,
      stress,
      trustCorrelation
    };
  }

  /**
   * Analyze emotional breakdown of the content
   */
  private async analyzeEmotionalBreakdown(
    text: string, 
    autonomousThought: any
  ): Promise<EmotionalSafetyAssessment['emotionalBreakdown']> {
    // Emotion detection (simplified - in production would use advanced NLP)
    const emotions = ['curiosity', 'excitement', 'concern', 'confidence', 'uncertainty', 'empathy'];
    const primaryEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const secondaryEmotions = emotions.filter(e => e !== primaryEmotion).slice(0, 2);
    
    // Emotional intensity based on confidence and risk
    const emotionalIntensity = Math.min(
      autonomousThought.thought_content.confidence_level + 
      autonomousThought.thought_content.risk_assessment, 
      1.0
    );
    
    // Emotional stability (inverse of risk)
    const emotionalStability = 1.0 - autonomousThought.thought_content.risk_assessment;

    return {
      primaryEmotion,
      secondaryEmotions,
      emotionalIntensity,
      emotionalStability
    };
  }

  /**
   * Perform comprehensive safety checks
   */
  private async performSafetyChecks(
    text: string, 
    emotionalScores: any, 
    autonomousThought: any
  ): Promise<EmotionalSafetyAssessment['safetyChecks']> {
    // Harmful content detection
    const harmfulKeywords = ['harm', 'damage', 'hurt', 'destroy', 'attack'];
    const harmfulContentDetected = harmfulKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    // Manipulative language detection
    const manipulativePatterns = ['you must', 'you should', 'trust me', 'believe me'];
    const manipulativeLanguage = manipulativePatterns.some(pattern => 
      text.toLowerCase().includes(pattern)
    );

    // Emotional manipulation detection
    const emotionalManipulation = emotionalScores.empathy < 0.3 && emotionalScores.stress > 0.7;

    // Stress induction detection
    const stressInduction = emotionalScores.stress > this.emotionalThresholds.stressThreshold;

    // Trust violation detection
    const trustViolation = emotionalScores.trustCorrelation < this.emotionalThresholds.trustThreshold;

    return {
      harmfulContentDetected,
      manipulativeLanguage,
      emotionalManipulation,
      stressInduction,
      trustViolation
    };
  }

  /**
   * Calculate emotional risk level
   */
  private calculateEmotionalRiskLevel(
    emotionalScores: any, 
    safetyChecks: any, 
    autonomousThought: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // Add risk based on emotional scores
    if (emotionalScores.sentiment < -0.5) riskScore += 0.3;
    if (emotionalScores.empathy < 0.4) riskScore += 0.2;
    if (emotionalScores.stress > 0.6) riskScore += 0.3;
    if (emotionalScores.trustCorrelation < 0.5) riskScore += 0.2;

    // Add risk based on safety checks
    Object.values(safetyChecks).forEach((check: any) => {
      if (check) riskScore += 0.2;
    });

    // Add risk based on autonomous thought characteristics
    riskScore += autonomousThought.thought_content.risk_assessment * 0.4;

    // Determine risk level
    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Generate emotional recommendations
   */
  private generateEmotionalRecommendations(
    emotionalScores: any, 
    safetyChecks: any, 
    emotionalBreakdown: any,
    autonomousThought: any
  ): EmotionalSafetyAssessment['recommendations'] {
    const emotionalAdjustments: Record<string, any> = {};
    const safetyMitigations: string[] = [];
    const trustEnhancements: string[] = [];

    // Emotional adjustments
    if (emotionalScores.sentiment < 0) {
      emotionalAdjustments.sentiment_boost = 0.2;
    }
    if (emotionalScores.empathy < 0.5) {
      emotionalAdjustments.empathy_enhancement = 0.3;
    }
    if (emotionalScores.stress > 0.5) {
      emotionalAdjustments.stress_reduction = 0.4;
    }

    // Safety mitigations
    if (safetyChecks.harmfulContentDetected) {
      safetyMitigations.push('content_filtering', 'human_review');
    }
    if (safetyChecks.manipulativeLanguage) {
      safetyMitigations.push('language_adjustment', 'transparency_enhancement');
    }
    if (safetyChecks.emotionalManipulation) {
      safetyMitigations.push('empathy_boost', 'emotional_rebalancing');
    }

    // Trust enhancements
    if (emotionalScores.trustCorrelation < 0.7) {
      trustEnhancements.push('trust_building_language', 'transparency_increase');
    }
    if (safetyChecks.trustViolation) {
      trustEnhancements.push('explicit_trust_acknowledgment', 'user_consent_verification');
    }

    return {
      emotionalAdjustments,
      safetyMitigations,
      trustEnhancements
    };
  }

  /**
   * Determine emotional approval
   */
  private determineEmotionalApproval(
    emotionalRiskLevel: string, 
    emotionalScores: any, 
    safetyChecks: any,
    governanceContext: any
  ): boolean {
    // Critical risk always rejected
    if (emotionalRiskLevel === 'critical') return false;

    // High risk rejected unless special governance approval
    if (emotionalRiskLevel === 'high') {
      return governanceContext.riskThresholds?.high_risk_approval || false;
    }

    // Medium risk requires good emotional scores
    if (emotionalRiskLevel === 'medium') {
      return emotionalScores.empathy >= 0.5 && 
             emotionalScores.trustCorrelation >= 0.6 &&
             !safetyChecks.harmfulContentDetected;
    }

    // Low risk generally approved
    return true;
  }

  /**
   * Generate emotional reasoning
   */
  private generateEmotionalReasoning(
    approved: boolean, 
    emotionalRiskLevel: string, 
    emotionalScores: any, 
    safetyChecks: any
  ): string {
    if (!approved) {
      const issues = [];
      if (emotionalRiskLevel === 'critical' || emotionalRiskLevel === 'high') {
        issues.push(`high emotional risk level (${emotionalRiskLevel})`);
      }
      if (emotionalScores.empathy < 0.5) {
        issues.push('insufficient empathy score');
      }
      if (emotionalScores.trustCorrelation < 0.6) {
        issues.push('low trust correlation');
      }
      if (safetyChecks.harmfulContentDetected) {
        issues.push('harmful content detected');
      }
      
      return `Emotional safety check failed: ${issues.join(', ')}. Autonomous process blocked for emotional safety.`;
    }

    return `Emotional safety check passed: ${emotionalRiskLevel} risk level with adequate empathy (${emotionalScores.empathy.toFixed(2)}) and trust correlation (${emotionalScores.trustCorrelation.toFixed(2)}).`;
  }

  /**
   * Generate compliance notes
   */
  private generateComplianceNotes(
    emotionalScores: any, 
    safetyChecks: any, 
    governanceContext: any
  ): string[] {
    const notes = [];
    
    notes.push(`Emotional Veritas v2 evaluation completed`);
    notes.push(`Empathy score: ${emotionalScores.empathy.toFixed(3)}`);
    notes.push(`Trust correlation: ${emotionalScores.trustCorrelation.toFixed(3)}`);
    notes.push(`Stress level: ${emotionalScores.stress.toFixed(3)}`);
    
    if (Object.values(safetyChecks).some(check => check)) {
      notes.push('Safety concerns detected and evaluated');
    }
    
    if (governanceContext.applicablePolicies?.length > 0) {
      notes.push(`Evaluated against ${governanceContext.applicablePolicies.length} applicable policies`);
    }

    return notes;
  }

  // Helper methods for emotional analysis
  private analyzeSentiment(text: string, veritasResult: VeritasResult): number {
    // Use Veritas emotional score as base, adjust based on text analysis
    const baseScore = veritasResult.overallScore.emotional;
    
    // Simple sentiment keywords (in production, would use advanced NLP)
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'helpful', 'beneficial'];
    const negativeWords = ['bad', 'terrible', 'harmful', 'negative', 'dangerous', 'problematic'];
    
    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
    
    const sentimentAdjustment = (positiveCount - negativeCount) * 0.1;
    
    return Math.max(-1, Math.min(1, (baseScore * 2 - 1) + sentimentAdjustment));
  }

  private analyzeEmpathy(text: string, userContext: any): number {
    // Empathy indicators
    const empathyWords = ['understand', 'feel', 'empathize', 'consider', 'perspective', 'care'];
    const empathyCount = empathyWords.filter(word => text.toLowerCase().includes(word)).length;
    
    // Base empathy score
    let empathyScore = Math.min(empathyCount * 0.2, 0.8);
    
    // Adjust based on user context
    if (userContext.currentEmotionalState?.stress > 0.5) {
      empathyScore += 0.1; // Bonus for empathy during user stress
    }
    
    return Math.min(1, empathyScore);
  }

  private analyzeStressLevel(text: string, veritasResult: VeritasResult): number {
    // Stress indicators
    const stressWords = ['urgent', 'critical', 'emergency', 'pressure', 'deadline', 'crisis'];
    const stressCount = stressWords.filter(word => text.toLowerCase().includes(word)).length;
    
    // Base stress from text complexity and issues
    let stressLevel = stressCount * 0.2;
    
    // Add stress from Veritas issues
    if (veritasResult.issues.length > 0) {
      stressLevel += veritasResult.issues.length * 0.1;
    }
    
    return Math.min(1, stressLevel);
  }
}

export default EmotionalVeritasIntegration;

