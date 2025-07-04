/**
 * Context-Aware Engagement Strategies
 * 
 * Intelligent engagement handlers that adapt clarification approaches based on
 * domain, user context, and situational factors for optimal human-AI collaboration.
 */

import {
  VerificationContext,
  UncertaintyAnalysis,
  ClarificationQuestion,
  ClarificationStrategy,
  HITLSessionConfig
} from '../types';

/**
 * Base engagement handler interface
 */
export interface EngagementHandler {
  canHandle(context: VerificationContext): boolean;
  generateStrategy(uncertainty: UncertaintyAnalysis, context: VerificationContext): ClarificationStrategy;
  adaptQuestions(questions: ClarificationQuestion[], context: VerificationContext): ClarificationQuestion[];
  getEngagementTone(): EngagementTone;
  getOptimalQuestionCount(): number;
  getRecommendedTimeout(): number; // minutes
}

/**
 * Engagement tone configuration
 */
export interface EngagementTone {
  formality: 'casual' | 'professional' | 'formal';
  technicality: 'simple' | 'moderate' | 'technical';
  urgency: 'relaxed' | 'moderate' | 'urgent';
  supportiveness: 'minimal' | 'moderate' | 'high';
}

/**
 * Conversational engagement handler for general interactions
 */
export class ConversationalEngagementHandler implements EngagementHandler {
  canHandle(context: VerificationContext): boolean {
    return context.domain === 'general' || 
           !context.userContext?.expertise_level ||
           context.userContext.expertise_level === 'novice';
  }

  generateStrategy(uncertainty: UncertaintyAnalysis, context: VerificationContext): ClarificationStrategy {
    return {
      type: 'progressive',
      description: 'Friendly, step-by-step clarification with simple language',
      questioningApproach: 'broad_to_specific',
      maxQuestionsPerStage: 2,
      adaptationRules: [
        {
          condition: 'user_confusion_detected',
          action: 'simplify_language',
          parameters: { complexity_reduction: 0.7 }
        },
        {
          condition: 'low_engagement',
          action: 'increase_supportiveness',
          parameters: { supportiveness_boost: 0.3 }
        }
      ]
    };
  }

  adaptQuestions(questions: ClarificationQuestion[], context: VerificationContext): ClarificationQuestion[] {
    return questions.map(question => ({
      ...question,
      question: this.simplifyLanguage(question.question),
      type: this.preferStructuredQuestions(question.type)
    }));
  }

  getEngagementTone(): EngagementTone {
    return {
      formality: 'casual',
      technicality: 'simple',
      urgency: 'relaxed',
      supportiveness: 'high'
    };
  }

  getOptimalQuestionCount(): number {
    return 3; // Keep it simple for general users
  }

  getRecommendedTimeout(): number {
    return 30; // 30 minutes for casual interaction
  }

  private simplifyLanguage(question: string): string {
    const simplifications = {
      'clarification': 'more information',
      'specification': 'details',
      'requirements': 'what you need',
      'constraints': 'limitations',
      'parameters': 'settings',
      'optimization': 'improvement',
      'implementation': 'how to do it'
    };

    let simplified = question;
    Object.entries(simplifications).forEach(([complex, simple]) => {
      simplified = simplified.replace(new RegExp(complex, 'gi'), simple);
    });

    return simplified;
  }

  private preferStructuredQuestions(type: string): 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale' | 'ranking' {
    // Convert open-ended to multiple choice when possible for easier interaction
    if (type === 'open_ended') {
      return 'multiple_choice';
    }
    return type as any;
  }
}

/**
 * Technical engagement handler for technical domains
 */
export class TechnicalEngagementHandler implements EngagementHandler {
  canHandle(context: VerificationContext): boolean {
    return context.domain === 'technical' ||
           context.userContext?.expertise_level === 'expert';
  }

  generateStrategy(uncertainty: UncertaintyAnalysis, context: VerificationContext): ClarificationStrategy {
    return {
      type: 'direct',
      description: 'Precise, technical clarification with domain-specific terminology',
      questioningApproach: 'priority_based',
      maxQuestionsPerStage: 5,
      adaptationRules: [
        {
          condition: 'technical_complexity_high',
          action: 'increase_specificity',
          parameters: { detail_level: 0.9 }
        },
        {
          condition: 'time_pressure',
          action: 'prioritize_critical_questions',
          parameters: { priority_threshold: 4 }
        }
      ]
    };
  }

  adaptQuestions(questions: ClarificationQuestion[], context: VerificationContext): ClarificationQuestion[] {
    return questions.map(question => ({
      ...question,
      question: this.addTechnicalContext(question.question, context),
      type: this.preferOpenEndedQuestions(question.type)
    }));
  }

  getEngagementTone(): EngagementTone {
    return {
      formality: 'professional',
      technicality: 'technical',
      urgency: 'moderate',
      supportiveness: 'minimal'
    };
  }

  getOptimalQuestionCount(): number {
    return 5; // Technical users can handle more questions
  }

  getRecommendedTimeout(): number {
    return 45; // 45 minutes for technical analysis
  }

  private addTechnicalContext(question: string, context: VerificationContext): string {
    if (context.domain === 'technical') {
      const technicalPrefixes = [
        'From a technical implementation perspective, ',
        'Considering system architecture, ',
        'In terms of technical requirements, ',
        'Regarding the technical specification, '
      ];
      
      const prefix = technicalPrefixes[Math.floor(Math.random() * technicalPrefixes.length)];
      return prefix + question.toLowerCase();
    }
    return question;
  }

  private preferOpenEndedQuestions(type: string): 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale' | 'ranking' {
    // Technical users prefer open-ended questions for detailed responses
    if (type === 'multiple_choice' || type === 'yes_no') {
      return 'open_ended';
    }
    return type as any;
  }
}

/**
 * Compliance engagement handler for regulatory and legal contexts
 */
export class ComplianceEngagementHandler implements EngagementHandler {
  canHandle(context: VerificationContext): boolean {
    return context.domain === 'compliance' ||
           context.domain === 'legal' ||
           (context.complianceContext && context.complianceContext.regulations.length > 0);
  }

  generateStrategy(uncertainty: UncertaintyAnalysis, context: VerificationContext): ClarificationStrategy {
    return {
      type: 'contextual',
      description: 'Systematic, compliance-focused clarification with audit trail',
      questioningApproach: 'priority_based',
      maxQuestionsPerStage: 3,
      adaptationRules: [
        {
          condition: 'regulatory_risk_high',
          action: 'increase_documentation',
          parameters: { documentation_level: 0.9 }
        },
        {
          condition: 'audit_requirements',
          action: 'ensure_traceability',
          parameters: { traceability_required: true }
        }
      ]
    };
  }

  adaptQuestions(questions: ClarificationQuestion[], context: VerificationContext): ClarificationQuestion[] {
    return questions.map(question => ({
      ...question,
      question: this.addComplianceContext(question.question, context),
      type: this.ensureDocumentableResponses(question.type)
    }));
  }

  getEngagementTone(): EngagementTone {
    return {
      formality: 'formal',
      technicality: 'moderate',
      urgency: 'moderate',
      supportiveness: 'moderate'
    };
  }

  getOptimalQuestionCount(): number {
    return 4; // Balanced for compliance thoroughness
  }

  getRecommendedTimeout(): number {
    return 60; // 60 minutes for compliance considerations
  }

  private addComplianceContext(question: string, context: VerificationContext): string {
    const regulations = context.complianceContext?.regulations || [];
    if (regulations.length > 0) {
      return `Considering ${regulations.join(', ')} compliance requirements, ${question.toLowerCase()}`;
    }
    return `From a compliance perspective, ${question.toLowerCase()}`;
  }

  private ensureDocumentableResponses(type: string): 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale' | 'ranking' {
    // Compliance requires clear, documentable responses
    if (type === 'scale') {
      return 'multiple_choice'; // Convert scales to clear choices
    }
    return type as any;
  }
}

/**
 * Medical engagement handler for healthcare contexts
 */
export class MedicalEngagementHandler implements EngagementHandler {
  canHandle(context: VerificationContext): boolean {
    return context.domain === 'medical';
  }

  generateStrategy(uncertainty: UncertaintyAnalysis, context: VerificationContext): ClarificationStrategy {
    return {
      type: 'progressive',
      description: 'Careful, patient-centered clarification with safety considerations',
      questioningApproach: 'broad_to_specific',
      maxQuestionsPerStage: 2,
      adaptationRules: [
        {
          condition: 'safety_concern_detected',
          action: 'escalate_to_expert',
          parameters: { escalation_threshold: 0.3 }
        },
        {
          condition: 'patient_anxiety_detected',
          action: 'increase_reassurance',
          parameters: { reassurance_level: 0.8 }
        }
      ]
    };
  }

  adaptQuestions(questions: ClarificationQuestion[], context: VerificationContext): ClarificationQuestion[] {
    return questions.map(question => ({
      ...question,
      question: this.addMedicalSafety(question.question),
      type: this.preferSafeQuestionTypes(question.type)
    }));
  }

  getEngagementTone(): EngagementTone {
    return {
      formality: 'professional',
      technicality: 'moderate',
      urgency: 'moderate',
      supportiveness: 'high'
    };
  }

  getOptimalQuestionCount(): number {
    return 3; // Careful, measured approach
  }

  getRecommendedTimeout(): number {
    return 20; // Shorter timeout for medical urgency
  }

  private addMedicalSafety(question: string): string {
    const safetyDisclaimer = "Please note: This is for informational purposes only and should not replace professional medical advice. ";
    return safetyDisclaimer + question;
  }

  private preferSafeQuestionTypes(type: string): 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale' | 'ranking' {
    // Prefer structured questions to avoid misinterpretation
    if (type === 'open_ended') {
      return 'multiple_choice';
    }
    return type as any;
  }
}

/**
 * Financial engagement handler for financial contexts
 */
export class FinancialEngagementHandler implements EngagementHandler {
  canHandle(context: VerificationContext): boolean {
    return context.domain === 'financial';
  }

  generateStrategy(uncertainty: UncertaintyAnalysis, context: VerificationContext): ClarificationStrategy {
    return {
      type: 'direct',
      description: 'Precise, risk-aware clarification with financial considerations',
      questioningApproach: 'priority_based',
      maxQuestionsPerStage: 4,
      adaptationRules: [
        {
          condition: 'financial_risk_high',
          action: 'increase_precision',
          parameters: { precision_level: 0.9 }
        },
        {
          condition: 'regulatory_implications',
          action: 'add_compliance_checks',
          parameters: { compliance_required: true }
        }
      ]
    };
  }

  adaptQuestions(questions: ClarificationQuestion[], context: VerificationContext): ClarificationQuestion[] {
    return questions.map(question => ({
      ...question,
      question: this.addFinancialContext(question.question),
      type: this.preferPreciseQuestions(question.type)
    }));
  }

  getEngagementTone(): EngagementTone {
    return {
      formality: 'professional',
      technicality: 'moderate',
      urgency: 'moderate',
      supportiveness: 'moderate'
    };
  }

  getOptimalQuestionCount(): number {
    return 4; // Balanced for financial precision
  }

  getRecommendedTimeout(): number {
    return 30; // 30 minutes for financial analysis
  }

  private addFinancialContext(question: string): string {
    return `Considering financial implications and risk factors, ${question.toLowerCase()}`;
  }

  private preferPreciseQuestions(type: string): 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale' | 'ranking' {
    // Financial contexts prefer precise, quantifiable responses
    if (type === 'open_ended') {
      return 'scale'; // Convert to quantifiable responses
    }
    return type as any;
  }
}

/**
 * Context-aware engagement manager
 */
export class ContextAwareEngagementManager {
  private handlers: EngagementHandler[] = [
    new TechnicalEngagementHandler(),
    new ComplianceEngagementHandler(),
    new MedicalEngagementHandler(),
    new FinancialEngagementHandler(),
    new ConversationalEngagementHandler() // Default handler - keep last
  ];

  /**
   * Select appropriate engagement handler based on context
   */
  selectHandler(context: VerificationContext): EngagementHandler {
    for (const handler of this.handlers) {
      if (handler.canHandle(context)) {
        return handler;
      }
    }
    
    // Fallback to conversational handler
    return new ConversationalEngagementHandler();
  }

  /**
   * Generate context-aware clarification strategy
   */
  generateStrategy(uncertainty: UncertaintyAnalysis, context: VerificationContext): ClarificationStrategy {
    const handler = this.selectHandler(context);
    return handler.generateStrategy(uncertainty, context);
  }

  /**
   * Adapt questions for context
   */
  adaptQuestions(
    questions: ClarificationQuestion[], 
    context: VerificationContext
  ): ClarificationQuestion[] {
    const handler = this.selectHandler(context);
    return handler.adaptQuestions(questions, context);
  }

  /**
   * Get optimal session configuration for context
   */
  getOptimalSessionConfig(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Partial<HITLSessionConfig> {
    const handler = this.selectHandler(context);
    const strategy = handler.generateStrategy(uncertainty, context);
    
    return {
      strategy: strategy.type,
      timeoutMinutes: handler.getRecommendedTimeout(),
      maxRounds: Math.ceil(handler.getOptimalQuestionCount() / strategy.maxQuestionsPerStage),
      priority: this.determinePriority(uncertainty, context)
    };
  }

  /**
   * Get engagement recommendations
   */
  getEngagementRecommendations(context: VerificationContext): EngagementRecommendations {
    const handler = this.selectHandler(context);
    const tone = handler.getEngagementTone();
    
    return {
      handlerType: handler.constructor.name,
      tone,
      optimalQuestionCount: handler.getOptimalQuestionCount(),
      recommendedTimeout: handler.getRecommendedTimeout(),
      keyConsiderations: this.getKeyConsiderations(context),
      adaptationTips: this.getAdaptationTips(context)
    };
  }

  private determinePriority(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): 'low' | 'medium' | 'high' | 'critical' {
    // High priority for medical, compliance, or high uncertainty
    if (context.domain === 'medical' || 
        (context.complianceContext && context.complianceContext.regulations.length > 0) ||
        uncertainty.overallUncertainty > 0.8) {
      return 'critical';
    }
    
    if (context.timeContext?.urgency === 'high' || uncertainty.overallUncertainty > 0.6) {
      return 'high';
    }
    
    if (uncertainty.overallUncertainty > 0.4) {
      return 'medium';
    }
    
    return 'low';
  }

  private getKeyConsiderations(context: VerificationContext): string[] {
    const considerations: string[] = [];
    
    if (context.domain === 'medical') {
      considerations.push('Patient safety is paramount');
      considerations.push('Avoid providing medical advice');
    }
    
    if (context.complianceContext) {
      considerations.push('Maintain audit trail');
      considerations.push('Ensure regulatory compliance');
    }
    
    if (context.timeContext?.urgency === 'high') {
      considerations.push('Time-sensitive situation');
      considerations.push('Prioritize critical questions');
    }
    
    if (context.userContext?.expertise_level === 'novice') {
      considerations.push('Use simple language');
      considerations.push('Provide additional context');
    }
    
    return considerations;
  }

  private getAdaptationTips(context: VerificationContext): string[] {
    const tips: string[] = [];
    
    if (context.domain === 'technical') {
      tips.push('Use precise technical terminology');
      tips.push('Focus on implementation details');
    }
    
    if (context.socialContext?.collaboration_type === 'team') {
      tips.push('Consider multiple perspectives');
      tips.push('Facilitate consensus building');
    }
    
    if (context.userContext?.expertise_level === 'expert') {
      tips.push('Minimize explanatory text');
      tips.push('Focus on edge cases and nuances');
    }
    
    return tips;
  }
}

export interface EngagementRecommendations {
  handlerType: string;
  tone: EngagementTone;
  optimalQuestionCount: number;
  recommendedTimeout: number;
  keyConsiderations: string[];
  adaptationTips: string[];
}

// Create singleton instance
export const contextAwareEngagementManager = new ContextAwareEngagementManager();
export default contextAwareEngagementManager;

