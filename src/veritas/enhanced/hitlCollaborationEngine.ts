/**
 * Human-in-the-Loop Collaboration Engine
 * 
 * Manages progressive clarification workflows, context-aware engagement strategies,
 * and collaborative reflection sessions between humans and AI agents.
 */

import {
  HITLSession,
  HITLSessionConfig,
  HITLResponse,
  HITLResolution,
  HITLInteraction,
  ClarificationStrategy,
  ClarificationStage,
  ClarificationQuestion,
  ResponseProcessingResult,
  SessionLearningData,
  UncertaintyAnalysis,
  VerificationContext,
  EnhancedVerificationResult
} from './types';
import { uncertaintyEngine } from './uncertaintyEngine';

/**
 * HITL Collaboration Engine
 */
export class HITLCollaborationEngine {
  private readonly STRATEGY_CONFIGS = {
    progressive: {
      maxStages: 5,
      questionsPerStage: 3,
      adaptationThreshold: 0.3
    },
    direct: {
      maxStages: 2,
      questionsPerStage: 5,
      adaptationThreshold: 0.5
    },
    contextual: {
      maxStages: 4,
      questionsPerStage: 2,
      adaptationThreshold: 0.2
    }
  };

  /**
   * Create new HITL collaboration session
   */
  async createSession(sessionId: string, config: HITLSessionConfig): Promise<HITLSession> {
    // Determine clarification strategy
    const strategy = this.selectClarificationStrategy(config);
    
    // Generate progressive stages
    const stages = await this.generateProgressiveStages(config.uncertaintyAnalysis, strategy, config.context);
    
    // Create session
    const session: HITLSession = {
      id: sessionId,
      config,
      strategy,
      stages,
      currentStage: 0,
      status: 'active',
      startTime: new Date(),
      interactions: [],
      learningData: []
    };

    return session;
  }

  /**
   * Process human response to clarification question
   */
  async processHumanResponse(
    session: HITLSession,
    questionId: string,
    response: HITLResponse
  ): Promise<HITLSession> {
    // Find the question
    const currentStage = session.stages[session.currentStage];
    const question = currentStage.questions.find(q => q.id === questionId);
    
    if (!question) {
      throw new Error(`Question ${questionId} not found in current stage`);
    }

    // Process the response
    const processingResult = await this.processResponse(question, response, session);
    
    // Create interaction record
    const interaction: HITLInteraction = {
      id: `interaction_${session.interactions.length + 1}`,
      timestamp: new Date(),
      question,
      response,
      processingResult,
      uncertaintyReduction: processingResult.updatedUncertainty.overallUncertainty - 
                           session.config.uncertaintyAnalysis.overallUncertainty
    };

    // Update session
    session.interactions.push(interaction);
    session.config.uncertaintyAnalysis = processingResult.updatedUncertainty;

    // Collect learning data
    const learningData = this.extractLearningData(interaction, session);
    session.learningData.push(...learningData);

    // Check if stage is complete
    if (this.isStageComplete(currentStage, session.interactions)) {
      await this.advanceToNextStage(session);
    }

    // Check if session should be completed
    if (this.shouldCompleteSession(session)) {
      session.status = 'completed';
      session.endTime = new Date();
    }

    return session;
  }

  /**
   * Complete HITL session and generate resolution
   */
  async completeSession(session: HITLSession): Promise<HITLResolution> {
    // Generate enhanced verification result
    const enhancedResult = await this.generateEnhancedResult(session);
    
    // Create resolution
    const resolution: HITLResolution = {
      type: this.determineResolutionType(session),
      finalUncertainty: session.config.uncertaintyAnalysis,
      enhancedResult,
      summary: this.generateResolutionSummary(session),
      confidence: this.calculateResolutionConfidence(session),
      futureRecommendations: this.generateFutureRecommendations(session)
    };

    session.resolution = resolution;
    session.status = 'completed';
    session.endTime = new Date();

    return resolution;
  }

  /**
   * Select appropriate clarification strategy
   */
  private selectClarificationStrategy(config: HITLSessionConfig): ClarificationStrategy {
    const strategyType = config.strategy || this.determineOptimalStrategy(config);
    
    const baseStrategy = {
      type: strategyType,
      description: this.getStrategyDescription(strategyType),
      questioningApproach: this.getQuestioningApproach(strategyType),
      maxQuestionsPerStage: this.STRATEGY_CONFIGS[strategyType].questionsPerStage,
      adaptationRules: this.generateAdaptationRules(strategyType)
    };

    return baseStrategy;
  }

  /**
   * Determine optimal strategy based on context
   */
  private determineOptimalStrategy(config: HITLSessionConfig): 'progressive' | 'direct' | 'contextual' {
    const uncertainty = config.uncertaintyAnalysis;
    const context = config.context;

    // High uncertainty with complex context -> progressive
    if (uncertainty.overallUncertainty > 0.8 && context.domain !== 'general') {
      return 'progressive';
    }

    // Simple context with specific questions -> direct
    if (context.domain === 'general' || uncertainty.sources.length <= 2) {
      return 'direct';
    }

    // Domain-specific with moderate uncertainty -> contextual
    return 'contextual';
  }

  /**
   * Generate progressive clarification stages
   */
  private async generateProgressiveStages(
    uncertainty: UncertaintyAnalysis,
    strategy: ClarificationStrategy,
    context: VerificationContext
  ): Promise<ClarificationStage[]> {
    const stages: ClarificationStage[] = [];

    if (strategy.type === 'progressive') {
      // Stage 1: Initial Context Gathering
      stages.push({
        id: 'initial_context',
        name: 'Initial Context',
        description: 'Gather basic context and requirements',
        questions: await this.generateInitialContextQuestions(uncertainty, context),
        completionCriteria: { type: 'all_questions_answered', parameters: {} },
        nextStageLogic: { type: 'sequential' }
      });

      // Stage 2: Requirements Clarification
      stages.push({
        id: 'requirements',
        name: 'Requirements',
        description: 'Clarify specific requirements and constraints',
        questions: await this.generateRequirementsQuestions(uncertainty, context),
        completionCriteria: { type: 'uncertainty_threshold_met', parameters: { threshold: 0.6 } },
        nextStageLogic: { type: 'conditional', conditions: { uncertainty_reduced: 'preferences' } }
      });

      // Stage 3: Preferences and Priorities
      stages.push({
        id: 'preferences',
        name: 'Preferences',
        description: 'Understand preferences and priorities',
        questions: await this.generatePreferencesQuestions(uncertainty, context),
        completionCriteria: { type: 'uncertainty_threshold_met', parameters: { threshold: 0.4 } },
        nextStageLogic: { type: 'sequential' }
      });

      // Stage 4: Validation and Refinement
      stages.push({
        id: 'validation',
        name: 'Validation',
        description: 'Validate understanding and refine details',
        questions: await this.generateValidationQuestions(uncertainty, context),
        completionCriteria: { type: 'uncertainty_threshold_met', parameters: { threshold: 0.2 } },
        nextStageLogic: { type: 'sequential' }
      });

    } else if (strategy.type === 'direct') {
      // Direct approach: fewer stages, more questions per stage
      stages.push({
        id: 'direct_clarification',
        name: 'Direct Clarification',
        description: 'Direct questions to resolve uncertainty',
        questions: await this.generateDirectQuestions(uncertainty, context),
        completionCriteria: { type: 'uncertainty_threshold_met', parameters: { threshold: 0.3 } },
        nextStageLogic: { type: 'sequential' }
      });

      stages.push({
        id: 'confirmation',
        name: 'Confirmation',
        description: 'Confirm understanding and finalize',
        questions: await this.generateConfirmationQuestions(uncertainty, context),
        completionCriteria: { type: 'all_questions_answered', parameters: {} },
        nextStageLogic: { type: 'sequential' }
      });

    } else { // contextual
      // Context-aware approach
      stages.push(...await this.generateContextualStages(uncertainty, context));
    }

    return stages;
  }

  /**
   * Generate questions for different stages
   */
  private async generateInitialContextQuestions(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationQuestion[]> {
    const questions: ClarificationQuestion[] = [];

    // Domain-specific context question
    questions.push({
      id: 'domain_context',
      question: this.getDomainContextQuestion(context.domain),
      type: 'open_ended',
      priority: 5,
      uncertaintyReduction: 0.3
    });

    // General context question
    questions.push({
      id: 'general_context',
      question: "Could you provide more context about what you're trying to accomplish?",
      type: 'open_ended',
      priority: 4,
      uncertaintyReduction: 0.2
    });

    // Urgency question
    if (context.timeContext?.urgency) {
      questions.push({
        id: 'urgency_context',
        question: "How time-sensitive is this request?",
        type: 'multiple_choice',
        options: ['Very urgent (minutes)', 'Urgent (hours)', 'Moderate (days)', 'Not urgent'],
        priority: 3,
        uncertaintyReduction: 0.15
      });
    }

    return questions;
  }

  private async generateRequirementsQuestions(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationQuestion[]> {
    const questions: ClarificationQuestion[] = [];

    // Requirements based on uncertainty sources
    for (const source of uncertainty.sources) {
      if (source.type === 'knowledge_gap') {
        questions.push({
          id: `requirement_${source.type}`,
          question: "What specific information or evidence would be most helpful?",
          type: 'open_ended',
          priority: 5,
          uncertaintyReduction: source.severity * 0.8
        });
      } else if (source.type === 'ambiguous_context') {
        questions.push({
          id: `requirement_${source.type}`,
          question: "Could you clarify the specific context or constraints?",
          type: 'open_ended',
          priority: 4,
          uncertaintyReduction: source.severity * 0.7
        });
      }
    }

    return questions;
  }

  private async generatePreferencesQuestions(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationQuestion[]> {
    return [
      {
        id: 'accuracy_preference',
        question: "What's more important: speed or thoroughness?",
        type: 'multiple_choice',
        options: ['Speed is critical', 'Balance both', 'Thoroughness is critical'],
        priority: 3,
        uncertaintyReduction: 0.2
      },
      {
        id: 'risk_tolerance',
        question: "What's your tolerance for uncertainty in the results?",
        type: 'scale',
        priority: 3,
        uncertaintyReduction: 0.25
      }
    ];
  }

  private async generateValidationQuestions(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationQuestion[]> {
    return [
      {
        id: 'understanding_validation',
        question: "Based on our discussion, does this understanding seem correct?",
        type: 'yes_no',
        priority: 4,
        uncertaintyReduction: 0.3
      }
    ];
  }

  private async generateDirectQuestions(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationQuestion[]> {
    const questions: ClarificationQuestion[] = [];

    // Direct questions based on clarification needs
    for (const need of uncertainty.clarificationNeeds.slice(0, 5)) {
      questions.push({
        id: `direct_${need.type}`,
        question: need.question,
        type: need.expectedResponseType,
        options: need.responseOptions,
        priority: need.priority,
        uncertaintyReduction: need.uncertaintyReduction
      });
    }

    return questions;
  }

  private async generateConfirmationQuestions(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationQuestion[]> {
    return [
      {
        id: 'final_confirmation',
        question: "Is there anything else I should know to provide the best response?",
        type: 'open_ended',
        priority: 2,
        uncertaintyReduction: 0.1
      }
    ];
  }

  private async generateContextualStages(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationStage[]> {
    // Generate stages based on specific context
    const stages: ClarificationStage[] = [];

    if (context.domain === 'technical') {
      stages.push({
        id: 'technical_requirements',
        name: 'Technical Requirements',
        description: 'Gather technical specifications and constraints',
        questions: await this.generateTechnicalQuestions(uncertainty, context),
        completionCriteria: { type: 'uncertainty_threshold_met', parameters: { threshold: 0.5 } },
        nextStageLogic: { type: 'sequential' }
      });
    }

    if (context.complianceContext) {
      stages.push({
        id: 'compliance_requirements',
        name: 'Compliance Requirements',
        description: 'Understand regulatory and compliance needs',
        questions: await this.generateComplianceQuestions(uncertainty, context),
        completionCriteria: { type: 'uncertainty_threshold_met', parameters: { threshold: 0.3 } },
        nextStageLogic: { type: 'sequential' }
      });
    }

    return stages;
  }

  private async generateTechnicalQuestions(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationQuestion[]> {
    return [
      {
        id: 'technical_constraints',
        question: "What are the key technical constraints or requirements?",
        type: 'open_ended',
        priority: 5,
        uncertaintyReduction: 0.4
      },
      {
        id: 'technical_environment',
        question: "What's the technical environment or platform?",
        type: 'open_ended',
        priority: 4,
        uncertaintyReduction: 0.3
      }
    ];
  }

  private async generateComplianceQuestions(
    uncertainty: UncertaintyAnalysis,
    context: VerificationContext
  ): Promise<ClarificationQuestion[]> {
    return [
      {
        id: 'regulatory_requirements',
        question: "What specific regulations or compliance requirements apply?",
        type: 'open_ended',
        priority: 5,
        uncertaintyReduction: 0.5
      },
      {
        id: 'audit_requirements',
        question: "Are there specific audit or documentation requirements?",
        type: 'yes_no',
        priority: 4,
        uncertaintyReduction: 0.3
      }
    ];
  }

  /**
   * Process human response and update uncertainty
   */
  private async processResponse(
    question: ClarificationQuestion,
    response: HITLResponse,
    session: HITLSession
  ): Promise<ResponseProcessingResult> {
    // Simulate response processing
    const insights = this.extractInsights(question, response, session);
    const uncertaintyReduction = this.calculateUncertaintyReduction(question, response);
    
    // Update uncertainty analysis
    const updatedUncertainty = await this.updateUncertaintyFromResponse(
      session.config.uncertaintyAnalysis,
      question,
      response,
      uncertaintyReduction
    );

    // Generate follow-up questions if needed
    const followUpQuestions = await this.generateFollowUpQuestions(question, response, session);

    return {
      success: true,
      updatedUncertainty,
      insights,
      followUpQuestions,
      nextActions: []
    };
  }

  /**
   * Helper methods
   */
  private getDomainContextQuestion(domain: string): string {
    switch (domain) {
      case 'technical':
        return "What technical domain or system are you working with?";
      case 'legal':
        return "What legal area or jurisdiction is relevant?";
      case 'medical':
        return "What medical specialty or condition is involved?";
      case 'financial':
        return "What financial context or regulations apply?";
      case 'compliance':
        return "What compliance framework or regulations are relevant?";
      default:
        return "What domain or area does this relate to?";
    }
  }

  private getStrategyDescription(type: string): string {
    switch (type) {
      case 'progressive':
        return 'Step-by-step clarification building from general to specific';
      case 'direct':
        return 'Direct questions targeting specific uncertainty sources';
      case 'contextual':
        return 'Context-aware questions adapted to domain and situation';
      default:
        return 'Adaptive clarification strategy';
    }
  }

  private getQuestioningApproach(type: string): 'broad_to_specific' | 'specific_to_broad' | 'priority_based' | 'adaptive' {
    switch (type) {
      case 'progressive':
        return 'broad_to_specific';
      case 'direct':
        return 'priority_based';
      case 'contextual':
        return 'adaptive';
      default:
        return 'adaptive';
    }
  }

  private generateAdaptationRules(type: string) {
    return [
      {
        condition: 'uncertainty_not_reducing',
        action: 'switch_question_type',
        parameters: { threshold: 0.1 }
      },
      {
        condition: 'user_confusion_detected',
        action: 'simplify_questions',
        parameters: { complexity_reduction: 0.5 }
      }
    ];
  }

  private extractInsights(question: ClarificationQuestion, response: HITLResponse, session: HITLSession): string[] {
    const insights: string[] = [];
    
    if (response.type === 'text' && typeof response.value === 'string') {
      if (response.value.length > 50) {
        insights.push('User provided detailed context');
      }
      if (response.value.includes('urgent') || response.value.includes('critical')) {
        insights.push('High urgency detected');
      }
    }

    if (response.confidence && response.confidence < 0.5) {
      insights.push('User expressed low confidence in response');
    }

    return insights;
  }

  private calculateUncertaintyReduction(question: ClarificationQuestion, response: HITLResponse): number {
    let reduction = question.uncertaintyReduction;

    // Adjust based on response quality
    if (response.type === 'text' && typeof response.value === 'string') {
      if (response.value.length < 10) {
        reduction *= 0.5; // Short responses provide less information
      } else if (response.value.length > 100) {
        reduction *= 1.2; // Detailed responses provide more information
      }
    }

    if (response.confidence) {
      reduction *= response.confidence; // Confidence affects uncertainty reduction
    }

    return Math.min(reduction, 0.8); // Cap at 80% reduction per question
  }

  private async updateUncertaintyFromResponse(
    currentUncertainty: UncertaintyAnalysis,
    question: ClarificationQuestion,
    response: HITLResponse,
    reduction: number
  ): Promise<UncertaintyAnalysis> {
    // Create updated uncertainty analysis
    const updatedUncertainty = { ...currentUncertainty };
    
    // Reduce overall uncertainty
    updatedUncertainty.overallUncertainty = Math.max(0, currentUncertainty.overallUncertainty - reduction);
    
    // Update specific dimensions based on question type
    if (question.type === 'open_ended') {
      updatedUncertainty.dimensions.contextual = Math.max(0, updatedUncertainty.dimensions.contextual - reduction);
    }
    
    // Remove resolved clarification needs
    updatedUncertainty.clarificationNeeds = updatedUncertainty.clarificationNeeds.filter(need => 
      need.priority > 2 || Math.random() > 0.5 // Simulate some needs being resolved
    );

    return updatedUncertainty;
  }

  private async generateFollowUpQuestions(
    question: ClarificationQuestion,
    response: HITLResponse,
    session: HITLSession
  ): Promise<ClarificationQuestion[]> {
    // Generate follow-up questions based on response
    const followUps: ClarificationQuestion[] = [];

    if (question.followUpLogic && response.type === 'choice') {
      const followUpCondition = String(response.value);
      const followUpQuestions = question.followUpLogic.conditions[followUpCondition];
      if (followUpQuestions) {
        followUps.push(...followUpQuestions);
      }
    }

    return followUps;
  }

  private isStageComplete(stage: ClarificationStage, interactions: HITLInteraction[]): boolean {
    const stageInteractions = interactions.filter(i => 
      stage.questions.some(q => q.id === i.question.id)
    );

    switch (stage.completionCriteria.type) {
      case 'all_questions_answered':
        return stageInteractions.length >= stage.questions.length;
      case 'uncertainty_threshold_met':
        const threshold = stage.completionCriteria.parameters.threshold;
        const lastInteraction = stageInteractions[stageInteractions.length - 1];
        return lastInteraction?.processingResult.updatedUncertainty.overallUncertainty <= threshold;
      default:
        return stageInteractions.length >= Math.ceil(stage.questions.length * 0.7);
    }
  }

  private async advanceToNextStage(session: HITLSession): Promise<void> {
    if (session.currentStage < session.stages.length - 1) {
      session.currentStage++;
    }
  }

  private shouldCompleteSession(session: HITLSession): boolean {
    return session.currentStage >= session.stages.length - 1 ||
           session.config.uncertaintyAnalysis.overallUncertainty <= 0.2 ||
           session.interactions.length >= 20; // Safety limit
  }

  private async generateEnhancedResult(session: HITLSession): Promise<EnhancedVerificationResult> {
    // This would generate an enhanced verification result based on the session
    // For now, return a placeholder
    return {
      overallScore: { accuracy: 0.9, confidence: 0.85 },
      claims: [],
      sources: [],
      timestamp: new Date().toISOString(),
      uncertaintyAnalysis: session.config.uncertaintyAnalysis,
      hitlSession: session,
      enhancementMetadata: {
        version: '2.0.0',
        featuresUsed: ['hitl_collaboration'],
        processingTime: {
          uncertainty_analysis: 0,
          hitl_processing: Date.now() - session.startTime.getTime(),
          multi_agent_coordination: 0,
          quantum_analysis: 0,
          total_time: Date.now() - session.startTime.getTime()
        },
        qualityMetrics: {
          accuracy_improvement: 0.2,
          confidence_improvement: 0.25,
          uncertainty_reduction: 0.6,
          user_satisfaction: 0.9
        },
        learningDataGenerated: session.learningData.length > 0
      }
    };
  }

  private determineResolutionType(session: HITLSession): 'uncertainty_resolved' | 'partial_resolution' | 'escalation_needed' | 'timeout' {
    if (session.status === 'timeout') return 'timeout';
    if (session.config.uncertaintyAnalysis.overallUncertainty <= 0.2) return 'uncertainty_resolved';
    if (session.config.uncertaintyAnalysis.overallUncertainty <= 0.5) return 'partial_resolution';
    return 'escalation_needed';
  }

  private generateResolutionSummary(session: HITLSession): string {
    const interactionCount = session.interactions.length;
    const uncertaintyReduction = session.config.uncertaintyAnalysis.overallUncertainty;
    
    return `HITL session completed with ${interactionCount} interactions. ` +
           `Uncertainty reduced to ${(uncertaintyReduction * 100).toFixed(1)}%. ` +
           `${session.learningData.length} learning insights captured.`;
  }

  private calculateResolutionConfidence(session: HITLSession): number {
    const uncertaintyLevel = session.config.uncertaintyAnalysis.overallUncertainty;
    const interactionQuality = session.interactions.reduce((sum, i) => 
      sum + (i.response.confidence || 0.5), 0) / session.interactions.length;
    
    return Math.min(0.95, (1 - uncertaintyLevel) * 0.7 + interactionQuality * 0.3);
  }

  private generateFutureRecommendations(session: HITLSession): string[] {
    const recommendations: string[] = [];
    
    if (session.learningData.some(d => d.type === 'user_preference')) {
      recommendations.push('Apply learned user preferences to similar future cases');
    }
    
    if (session.config.uncertaintyAnalysis.overallUncertainty > 0.3) {
      recommendations.push('Consider gathering additional context upfront for similar cases');
    }
    
    if (session.interactions.length > 10) {
      recommendations.push('Optimize question sequencing to reduce interaction count');
    }

    return recommendations;
  }

  private extractLearningData(interaction: HITLInteraction, session: HITLSession): SessionLearningData[] {
    const learningData: SessionLearningData[] = [];

    // Extract user preferences
    if (interaction.response.type === 'choice' && interaction.question.id.includes('preference')) {
      learningData.push({
        type: 'user_preference',
        description: `User prefers ${interaction.response.value} for ${interaction.question.id}`,
        data: { preference: interaction.response.value, context: session.config.context.domain },
        confidence: interaction.response.confidence || 0.7,
        scope: 'user_specific'
      });
    }

    // Extract successful patterns
    if (interaction.uncertaintyReduction > 0.3) {
      learningData.push({
        type: 'successful_pattern',
        description: `Question type ${interaction.question.type} effective for ${interaction.question.id}`,
        data: { 
          questionType: interaction.question.type, 
          uncertaintyReduction: interaction.uncertaintyReduction,
          context: session.config.context.domain
        },
        confidence: 0.8,
        scope: 'domain_specific'
      });
    }

    return learningData;
  }
}

export const hitlCollaborationEngine = new HITLCollaborationEngine();

