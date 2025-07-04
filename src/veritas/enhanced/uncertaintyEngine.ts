/**
 * Enhanced Veritas 2 Uncertainty Analysis Engine
 * 
 * Core engine for multidimensional uncertainty analysis, providing sophisticated
 * uncertainty quantification and clarification need identification.
 */

import { 
  UncertaintyAnalysis, 
  UncertaintyDimensions, 
  UncertaintySource, 
  ClarificationNeed, 
  UncertaintyAction,
  VerificationContext,
  EnhancedVerificationResult
} from './types';
import { VerificationResult, ClaimValidation } from '../types';

/**
 * Enhanced Uncertainty Analysis Engine
 */
export class UncertaintyEngine {
  private readonly UNCERTAINTY_THRESHOLDS = {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8,
    CRITICAL: 0.9
  };

  private readonly DIMENSION_WEIGHTS = {
    epistemic: 0.25,
    aleatoric: 0.15,
    confidence: 0.20,
    contextual: 0.20,
    temporal: 0.10,
    social: 0.10
  };

  /**
   * Perform comprehensive uncertainty analysis
   */
  async analyzeUncertainty(
    text: string, 
    baseVerification: VerificationResult,
    context?: VerificationContext
  ): Promise<UncertaintyAnalysis> {
    // Calculate uncertainty dimensions
    const dimensions = await this.calculateUncertaintyDimensions(text, baseVerification, context);
    
    // Calculate overall uncertainty
    const overallUncertainty = this.calculateOverallUncertainty(dimensions);
    
    // Identify uncertainty sources
    const sources = await this.identifyUncertaintySources(text, baseVerification, dimensions, context);
    
    // Determine clarification needs
    const clarificationNeeds = await this.determineClarificationNeeds(sources, dimensions, context);
    
    // Generate recommended actions
    const recommendedActions = await this.generateUncertaintyActions(dimensions, sources, context);

    return {
      overallUncertainty,
      dimensions,
      sources,
      clarificationNeeds,
      recommendedActions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate uncertainty across multiple dimensions
   */
  private async calculateUncertaintyDimensions(
    text: string,
    baseVerification: VerificationResult,
    context?: VerificationContext
  ): Promise<UncertaintyDimensions> {
    return {
      epistemic: await this.calculateEpistemicUncertainty(baseVerification),
      aleatoric: await this.calculateAleatoricUncertainty(text, baseVerification),
      confidence: this.calculateConfidenceUncertainty(baseVerification),
      contextual: await this.calculateContextualUncertainty(text, context),
      temporal: await this.calculateTemporalUncertainty(text, context),
      social: await this.calculateSocialUncertainty(text, context)
    };
  }

  /**
   * Calculate epistemic uncertainty (knowledge gaps)
   */
  private async calculateEpistemicUncertainty(verification: VerificationResult): Promise<number> {
    let epistemicUncertainty = 0;
    
    // Analyze claims for knowledge gaps
    for (const claim of verification.claims) {
      // High uncertainty if no supporting evidence
      if (claim.supportingEvidence.length === 0) {
        epistemicUncertainty += 0.3;
      }
      
      // Medium uncertainty if contradicting evidence exists
      if (claim.contradictingEvidence.length > 0) {
        epistemicUncertainty += 0.2;
      }
      
      // Uncertainty based on evidence quality
      const avgReliability = claim.supportingEvidence.reduce((sum, ev) => sum + ev.source.reliability, 0) / 
                            Math.max(1, claim.supportingEvidence.length);
      epistemicUncertainty += (1 - avgReliability) * 0.2;
    }
    
    // Normalize by number of claims
    return Math.min(1, epistemicUncertainty / Math.max(1, verification.claims.length));
  }

  /**
   * Calculate aleatoric uncertainty (inherent randomness)
   */
  private async calculateAleatoricUncertainty(text: string, verification: VerificationResult): Promise<number> {
    let aleatoricUncertainty = 0;
    
    // Analyze text for inherently uncertain statements
    const uncertaintyIndicators = [
      'might', 'could', 'possibly', 'perhaps', 'maybe', 'likely', 'probably',
      'uncertain', 'unclear', 'ambiguous', 'depends', 'varies'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const uncertainWords = words.filter(word => 
      uncertaintyIndicators.some(indicator => word.includes(indicator))
    );
    
    aleatoricUncertainty = Math.min(0.8, uncertainWords.length / words.length * 10);
    
    // Add uncertainty from claim score variance
    if (verification.claims.length > 1) {
      const scores = verification.claims.map(c => c.score.accuracy);
      const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      aleatoricUncertainty += Math.min(0.3, variance);
    }
    
    return Math.min(1, aleatoricUncertainty);
  }

  /**
   * Calculate confidence uncertainty
   */
  private calculateConfidenceUncertainty(verification: VerificationResult): number {
    // Invert confidence score to get uncertainty
    return 1 - verification.overallScore.confidence;
  }

  /**
   * Calculate contextual uncertainty
   */
  private async calculateContextualUncertainty(text: string, context?: VerificationContext): Promise<number> {
    let contextualUncertainty = 0;
    
    // Base uncertainty if no context provided
    if (!context) {
      contextualUncertainty += 0.4;
    } else {
      // Domain-specific uncertainty
      if (context.domain === 'general') {
        contextualUncertainty += 0.2;
      }
      
      // User expertise uncertainty
      if (context.userContext?.expertise_level === 'novice') {
        contextualUncertainty += 0.2;
      }
      
      // Compliance context uncertainty
      if (context.complianceContext && context.complianceContext.regulations.length > 0) {
        contextualUncertainty += 0.1; // Regulatory complexity adds uncertainty
      }
    }
    
    // Analyze text for context-dependent statements
    const contextDependentPhrases = [
      'in this case', 'depending on', 'it depends', 'context matters',
      'situation specific', 'case by case', 'varies by'
    ];
    
    const hasContextDependency = contextDependentPhrases.some(phrase => 
      text.toLowerCase().includes(phrase)
    );
    
    if (hasContextDependency) {
      contextualUncertainty += 0.3;
    }
    
    return Math.min(1, contextualUncertainty);
  }

  /**
   * Calculate temporal uncertainty
   */
  private async calculateTemporalUncertainty(text: string, context?: VerificationContext): Promise<number> {
    let temporalUncertainty = 0;
    
    // Time-sensitive context
    if (context?.timeContext?.time_sensitivity) {
      temporalUncertainty += 0.3;
    }
    
    // Urgency adds uncertainty
    if (context?.timeContext?.urgency === 'high') {
      temporalUncertainty += 0.2;
    }
    
    // Deadline pressure
    if (context?.timeContext?.deadline) {
      const timeToDeadline = context.timeContext.deadline.getTime() - Date.now();
      const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);
      
      if (hoursToDeadline < 24) {
        temporalUncertainty += 0.3;
      } else if (hoursToDeadline < 72) {
        temporalUncertainty += 0.1;
      }
    }
    
    // Analyze text for temporal references
    const temporalIndicators = [
      'currently', 'now', 'today', 'recently', 'soon', 'later',
      'will change', 'evolving', 'developing', 'trending'
    ];
    
    const hasTemporalDependency = temporalIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
    
    if (hasTemporalDependency) {
      temporalUncertainty += 0.2;
    }
    
    return Math.min(1, temporalUncertainty);
  }

  /**
   * Calculate social uncertainty
   */
  private async calculateSocialUncertainty(text: string, context?: VerificationContext): Promise<number> {
    let socialUncertainty = 0;
    
    // Multiple stakeholders increase uncertainty
    if (context?.socialContext?.stakeholders && context.socialContext.stakeholders.length > 1) {
      socialUncertainty += 0.2;
    }
    
    // Public collaboration adds uncertainty
    if (context?.socialContext?.collaboration_type === 'public') {
      socialUncertainty += 0.3;
    }
    
    // Cultural considerations
    if (context?.socialContext?.cultural_considerations && 
        context.socialContext.cultural_considerations.length > 0) {
      socialUncertainty += 0.2;
    }
    
    // Analyze text for social/opinion-based content
    const socialIndicators = [
      'people think', 'generally accepted', 'common belief', 'opinion',
      'perspective', 'viewpoint', 'cultural', 'social norm'
    ];
    
    const hasSocialDependency = socialIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
    
    if (hasSocialDependency) {
      socialUncertainty += 0.3;
    }
    
    return Math.min(1, socialUncertainty);
  }

  /**
   * Calculate overall uncertainty from dimensions
   */
  private calculateOverallUncertainty(dimensions: UncertaintyDimensions): number {
    return Object.entries(dimensions).reduce((total, [dimension, value]) => {
      const weight = this.DIMENSION_WEIGHTS[dimension as keyof UncertaintyDimensions] || 0;
      return total + (value * weight);
    }, 0);
  }

  /**
   * Identify specific sources of uncertainty
   */
  private async identifyUncertaintySources(
    text: string,
    verification: VerificationResult,
    dimensions: UncertaintyDimensions,
    context?: VerificationContext
  ): Promise<UncertaintySource[]> {
    const sources: UncertaintySource[] = [];

    // Knowledge gap sources
    if (dimensions.epistemic > this.UNCERTAINTY_THRESHOLDS.MEDIUM) {
      sources.push({
        type: 'knowledge_gap',
        description: 'Insufficient evidence or conflicting information detected',
        severity: dimensions.epistemic,
        resolutionApproach: 'additional_evidence'
      });
    }

    // Ambiguous context sources
    if (dimensions.contextual > this.UNCERTAINTY_THRESHOLDS.MEDIUM) {
      sources.push({
        type: 'ambiguous_context',
        description: 'Context-dependent statements require clarification',
        severity: dimensions.contextual,
        resolutionApproach: 'human_clarification'
      });
    }

    // Conflicting evidence sources
    const conflictingClaims = verification.claims.filter(claim => 
      claim.contradictingEvidence.length > 0
    );
    
    if (conflictingClaims.length > 0) {
      sources.push({
        type: 'conflicting_evidence',
        description: `${conflictingClaims.length} claims have contradicting evidence`,
        severity: conflictingClaims.length / verification.claims.length,
        relatedClaim: conflictingClaims[0].claim.text,
        resolutionApproach: 'expert_consultation'
      });
    }

    // Temporal dependency sources
    if (dimensions.temporal > this.UNCERTAINTY_THRESHOLDS.MEDIUM) {
      sources.push({
        type: 'temporal_dependency',
        description: 'Time-sensitive information may change',
        severity: dimensions.temporal,
        resolutionApproach: 'temporal_wait'
      });
    }

    // Social factors sources
    if (dimensions.social > this.UNCERTAINTY_THRESHOLDS.MEDIUM) {
      sources.push({
        type: 'social_factors',
        description: 'Multiple perspectives or cultural considerations involved',
        severity: dimensions.social,
        resolutionApproach: 'human_clarification'
      });
    }

    return sources;
  }

  /**
   * Determine clarification needs based on uncertainty sources
   */
  private async determineClarificationNeeds(
    sources: UncertaintySource[],
    dimensions: UncertaintyDimensions,
    context?: VerificationContext
  ): Promise<ClarificationNeed[]> {
    const clarificationNeeds: ClarificationNeed[] = [];

    for (const source of sources) {
      switch (source.resolutionApproach) {
        case 'human_clarification':
          if (source.type === 'ambiguous_context') {
            clarificationNeeds.push({
              type: 'context_clarification',
              priority: Math.ceil(source.severity * 5),
              question: this.generateContextClarificationQuestion(source, context),
              expectedResponseType: 'text',
              uncertaintyReduction: source.severity * 0.7
            });
          } else if (source.type === 'social_factors') {
            clarificationNeeds.push({
              type: 'preference_elicitation',
              priority: Math.ceil(source.severity * 5),
              question: this.generatePreferenceClarificationQuestion(source, context),
              expectedResponseType: 'choice',
              responseOptions: this.generatePreferenceOptions(context),
              uncertaintyReduction: source.severity * 0.6
            });
          }
          break;

        case 'additional_evidence':
          clarificationNeeds.push({
            type: 'requirement_specification',
            priority: Math.ceil(source.severity * 5),
            question: this.generateEvidenceRequirementQuestion(source),
            expectedResponseType: 'text',
            uncertaintyReduction: source.severity * 0.8
          });
          break;

        case 'expert_consultation':
          clarificationNeeds.push({
            type: 'constraint_identification',
            priority: Math.ceil(source.severity * 5),
            question: this.generateExpertConsultationQuestion(source),
            expectedResponseType: 'choice',
            responseOptions: ['Proceed with current evidence', 'Seek expert opinion', 'Gather more evidence'],
            uncertaintyReduction: source.severity * 0.5
          });
          break;
      }
    }

    // Sort by priority and uncertainty reduction potential
    return clarificationNeeds.sort((a, b) => {
      const scoreA = a.priority + (a.uncertaintyReduction * 10);
      const scoreB = b.priority + (b.uncertaintyReduction * 10);
      return scoreB - scoreA;
    });
  }

  /**
   * Generate recommended actions based on uncertainty analysis
   */
  private async generateUncertaintyActions(
    dimensions: UncertaintyDimensions,
    sources: UncertaintySource[],
    context?: VerificationContext
  ): Promise<UncertaintyAction[]> {
    const actions: UncertaintyAction[] = [];

    // High uncertainty triggers HITL
    const overallUncertainty = this.calculateOverallUncertainty(dimensions);
    if (overallUncertainty > this.UNCERTAINTY_THRESHOLDS.HIGH) {
      actions.push({
        type: 'initiate_hitl',
        description: 'High uncertainty detected - initiate human-in-the-loop collaboration',
        effectiveness: 0.9,
        estimatedTime: 15,
        resourcesRequired: ['human_expert', 'clarification_interface']
      });
    }

    // Knowledge gaps require evidence gathering
    if (dimensions.epistemic > this.UNCERTAINTY_THRESHOLDS.MEDIUM) {
      actions.push({
        type: 'gather_evidence',
        description: 'Gather additional evidence to fill knowledge gaps',
        effectiveness: 0.7,
        estimatedTime: 30,
        resourcesRequired: ['evidence_retrieval_system', 'fact_checking_tools']
      });
    }

    // Complex domain issues need expert consultation
    if (context?.domain !== 'general' && overallUncertainty > this.UNCERTAINTY_THRESHOLDS.MEDIUM) {
      actions.push({
        type: 'consult_expert',
        description: `Consult ${context.domain} expert for specialized knowledge`,
        effectiveness: 0.8,
        estimatedTime: 45,
        resourcesRequired: ['domain_expert', 'expert_consultation_interface']
      });
    }

    // Temporal uncertainty may require waiting
    if (dimensions.temporal > this.UNCERTAINTY_THRESHOLDS.HIGH) {
      actions.push({
        type: 'wait_for_context',
        description: 'Wait for additional context or time-dependent information',
        effectiveness: 0.6,
        estimatedTime: 120,
        resourcesRequired: ['temporal_monitoring_system']
      });
    }

    // Medium uncertainty allows cautious proceeding
    if (overallUncertainty > this.UNCERTAINTY_THRESHOLDS.LOW && 
        overallUncertainty <= this.UNCERTAINTY_THRESHOLDS.MEDIUM) {
      actions.push({
        type: 'proceed_with_caution',
        description: 'Proceed with heightened monitoring and validation',
        effectiveness: 0.5,
        estimatedTime: 5,
        resourcesRequired: ['monitoring_system', 'validation_checks']
      });
    }

    return actions.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Helper methods for generating clarification questions
   */
  private generateContextClarificationQuestion(source: UncertaintySource, context?: VerificationContext): string {
    if (context?.domain === 'technical') {
      return "Could you provide more specific technical requirements or constraints for this scenario?";
    } else if (context?.domain === 'compliance') {
      return "What specific regulatory or compliance requirements should be considered?";
    } else {
      return "Could you provide more context about the specific situation or use case?";
    }
  }

  private generatePreferenceClarificationQuestion(source: UncertaintySource, context?: VerificationContext): string {
    return "What is your preferred approach when multiple valid perspectives exist?";
  }

  private generateEvidenceRequirementQuestion(source: UncertaintySource): string {
    return "What additional information or evidence would help resolve this uncertainty?";
  }

  private generateExpertConsultationQuestion(source: UncertaintySource): string {
    return "How would you like to handle the conflicting evidence found?";
  }

  private generatePreferenceOptions(context?: VerificationContext): string[] {
    return [
      'Prioritize accuracy over speed',
      'Balance accuracy and efficiency',
      'Prioritize quick resolution',
      'Seek consensus among stakeholders',
      'Defer to expert judgment'
    ];
  }

  /**
   * Check if uncertainty level triggers HITL collaboration
   */
  shouldTriggerHITL(uncertainty: UncertaintyAnalysis, threshold: number = 0.7): boolean {
    return uncertainty.overallUncertainty > threshold ||
           uncertainty.clarificationNeeds.some(need => need.priority >= 4);
  }

  /**
   * Get uncertainty level description
   */
  getUncertaintyLevelDescription(uncertainty: number): string {
    if (uncertainty <= this.UNCERTAINTY_THRESHOLDS.LOW) return 'Low';
    if (uncertainty <= this.UNCERTAINTY_THRESHOLDS.MEDIUM) return 'Medium';
    if (uncertainty <= this.UNCERTAINTY_THRESHOLDS.HIGH) return 'High';
    return 'Critical';
  }

  /**
   * Get uncertainty color for UI display
   */
  getUncertaintyColor(uncertainty: number): string {
    if (uncertainty <= this.UNCERTAINTY_THRESHOLDS.LOW) return '#10B981'; // Green
    if (uncertainty <= this.UNCERTAINTY_THRESHOLDS.MEDIUM) return '#F59E0B'; // Yellow
    if (uncertainty <= this.UNCERTAINTY_THRESHOLDS.HIGH) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }
}

export const uncertaintyEngine = new UncertaintyEngine();

