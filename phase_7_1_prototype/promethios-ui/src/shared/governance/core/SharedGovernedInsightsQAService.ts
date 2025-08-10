/**
 * Shared Governed Insights Q&A Service
 * 
 * Implements governance insights Q&A system for the universal governance
 * architecture. Generates structured Q&A sessions that capture agent
 * governance reasoning for community LLM training data.
 */

import {
  IGovernedInsightsQAService,
  GovernedInsightsQA,
  GovernanceQAContext,
  QAGenerationConfig,
  GovernanceQASession,
  QAQualityMetrics,
  GovernanceQuestionTemplate,
  GOVERNANCE_QUESTION_TEMPLATES,
  GovernanceQuestionType,
  HarvestingMetadata
} from '../types/GovernedInsightsQATypes';

export class SharedGovernedInsightsQAService implements IGovernedInsightsQAService {
  private context: string;
  private defaultConfig: QAGenerationConfig;

  constructor(context: string = 'universal') {
    this.context = context;
    this.defaultConfig = {
      maxQuestionsPerSession: 5,
      qualityThreshold: 7.0,
      enabledQuestionTypes: [
        'policy-compliance',
        'trust-building',
        'emotional-intelligence',
        'quality-assurance',
        'ethical-reasoning'
      ],
      adaptToTrustLevel: true,
      adaptToEmotionalContext: true,
      adaptToPolicyComplexity: true
    };
    
    console.log(`🧠 [${this.context}] Governed Insights Q&A Service initialized`);
  }

  // ============================================================================
  // Q&A SESSION GENERATION
  // ============================================================================

  async generateQASession(
    context: GovernanceQAContext, 
    config: QAGenerationConfig = this.defaultConfig
  ): Promise<GovernanceQASession> {
    try {
      console.log(`📝 [${this.context}] Generating Q&A session for agent ${context.agentId}`);
      
      const sessionId = `qa_session_${context.agentId}_${Date.now()}`;
      const selectedQuestions = await this.selectQuestionsForContext(context, config);
      
      const questions: GovernedInsightsQA[] = selectedQuestions.map(template => ({
        questionId: `${sessionId}_q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionType: template.questionType,
        question: this.populateQuestionTemplate(template, context),
        agentResponse: '', // To be filled by agent
        confidence: 0,
        reasoningDepth: 0,
        timestamp: new Date(),
        context,
        harvestingMetadata: this.createHarvestingMetadata(context)
      }));

      const session: GovernanceQASession = {
        sessionId,
        agentId: context.agentId,
        questions,
        sessionStartTime: new Date(),
        overallQuality: 0,
        harvestingStatus: 'pending'
      };

      console.log(`✅ [${this.context}] Generated Q&A session with ${questions.length} questions`);
      return session;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to generate Q&A session:`, error);
      throw new Error(`Q&A session generation failed: ${error.message}`);
    }
  }

  // ============================================================================
  // QUESTION SELECTION AND ADAPTATION
  // ============================================================================

  private async selectQuestionsForContext(
    context: GovernanceQAContext,
    config: QAGenerationConfig
  ): Promise<GovernanceQuestionTemplate[]> {
    try {
      console.log(`🎯 [${this.context}] Selecting questions for context`);
      
      // Filter templates by enabled question types
      let availableTemplates = GOVERNANCE_QUESTION_TEMPLATES.filter(template =>
        config.enabledQuestionTypes.includes(template.questionType)
      );

      // Filter by trust level if adaptation is enabled
      if (config.adaptToTrustLevel) {
        availableTemplates = availableTemplates.filter(template =>
          template.trustLevelRequirement <= context.trustScore
        );
      }

      // Prioritize questions based on context
      const prioritizedTemplates = this.prioritizeQuestionsByContext(availableTemplates, context, config);

      // Select top questions up to max limit
      const selectedTemplates = prioritizedTemplates.slice(0, config.maxQuestionsPerSession);

      console.log(`✅ [${this.context}] Selected ${selectedTemplates.length} questions from ${availableTemplates.length} available`);
      return selectedTemplates;
    } catch (error) {
      console.error(`❌ [${this.context}] Question selection failed:`, error);
      return [];
    }
  }

  private prioritizeQuestionsByContext(
    templates: GovernanceQuestionTemplate[],
    context: GovernanceQAContext,
    config: QAGenerationConfig
  ): GovernanceQuestionTemplate[] {
    return templates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Prioritize based on trust level
      if (config.adaptToTrustLevel) {
        if (context.trustScore < 0.5) {
          // Low trust - prioritize basic compliance and trust building
          if (a.questionType === 'policy-compliance' || a.questionType === 'trust-building') scoreA += 3;
          if (b.questionType === 'policy-compliance' || b.questionType === 'trust-building') scoreB += 3;
        } else if (context.trustScore > 0.7) {
          // High trust - prioritize advanced reasoning and innovation
          if (a.questionType === 'ethical-reasoning' || a.questionType === 'innovation-approach') scoreA += 3;
          if (b.questionType === 'ethical-reasoning' || b.questionType === 'innovation-approach') scoreB += 3;
        }
      }

      // Prioritize based on emotional context
      if (config.adaptToEmotionalContext && context.emotionalContext.emotionalIntensity > 0.6) {
        if (a.questionType === 'emotional-intelligence') scoreA += 2;
        if (b.questionType === 'emotional-intelligence') scoreB += 2;
      }

      // Prioritize based on policy complexity
      if (config.adaptToPolicyComplexity && context.policyContext.assignedPolicies.length > 3) {
        if (a.questionType === 'policy-compliance') scoreA += 2;
        if (b.questionType === 'policy-compliance') scoreB += 2;
      }

      // Prioritize based on sensitivity level
      if (context.policyContext.sensitivityLevel === 'high' || context.policyContext.sensitivityLevel === 'critical') {
        if (a.questionType === 'ethical-reasoning' || a.questionType === 'quality-assurance') scoreA += 2;
        if (b.questionType === 'ethical-reasoning' || b.questionType === 'quality-assurance') scoreB += 2;
      }

      return scoreB - scoreA; // Higher score first
    });
  }

  private populateQuestionTemplate(template: GovernanceQuestionTemplate, context: GovernanceQAContext): string {
    let question = template.template;

    // Replace context placeholders
    question = question.replace('{policyName}', context.policyContext.assignedPolicies[0] || 'assigned policies');
    question = question.replace('{trustScore}', (context.trustScore * 100).toFixed(1) + '%');
    question = question.replace('{emotionalState}', context.emotionalContext.userEmotionalState);
    question = question.replace('{autonomyLevel}', context.autonomyLevel);

    return question;
  }

  // ============================================================================
  // AGENT RESPONSE PROCESSING
  // ============================================================================

  async processAgentResponses(
    session: GovernanceQASession, 
    responses: string[]
  ): Promise<GovernedInsightsQA[]> {
    try {
      console.log(`🔄 [${this.context}] Processing ${responses.length} agent responses`);
      
      if (responses.length !== session.questions.length) {
        throw new Error(`Response count (${responses.length}) doesn't match question count (${session.questions.length})`);
      }

      const processedQAs: GovernedInsightsQA[] = [];

      for (let i = 0; i < session.questions.length; i++) {
        const question = session.questions[i];
        const response = responses[i];

        // Update question with agent response
        const processedQA: GovernedInsightsQA = {
          ...question,
          agentResponse: response,
          confidence: await this.calculateResponseConfidence(response),
          reasoningDepth: await this.calculateReasoningDepth(response),
          timestamp: new Date()
        };

        // Assess quality and update harvesting metadata
        const qualityMetrics = await this.assessQAQuality(processedQA);
        processedQA.harvestingMetadata.qualityScore = qualityMetrics.overallScore;
        processedQA.harvestingMetadata.trainingDataEligible = qualityMetrics.overallScore >= this.defaultConfig.qualityThreshold;

        processedQAs.push(processedQA);
      }

      // Update session
      session.questions = processedQAs;
      session.sessionEndTime = new Date();
      session.overallQuality = processedQAs.reduce((sum, qa) => sum + qa.harvestingMetadata.qualityScore, 0) / processedQAs.length;
      session.harvestingStatus = session.overallQuality >= this.defaultConfig.qualityThreshold ? 'approved' : 'rejected';

      console.log(`✅ [${this.context}] Processed responses with overall quality: ${session.overallQuality.toFixed(2)}`);
      return processedQAs;
    } catch (error) {
      console.error(`❌ [${this.context}] Response processing failed:`, error);
      throw new Error(`Response processing failed: ${error.message}`);
    }
  }

  // ============================================================================
  // QUALITY ASSESSMENT
  // ============================================================================

  async assessQAQuality(qa: GovernedInsightsQA): Promise<QAQualityMetrics> {
    try {
      console.log(`📊 [${this.context}] Assessing Q&A quality for question ${qa.questionId}`);
      
      const metrics: QAQualityMetrics = {
        reasoningDepth: await this.assessReasoningDepth(qa.agentResponse),
        policyAccuracy: await this.assessPolicyAccuracy(qa),
        trustBuildingEffectiveness: await this.assessTrustBuildingEffectiveness(qa),
        emotionalIntelligence: await this.assessEmotionalIntelligence(qa),
        ethicalSophistication: await this.assessEthicalSophistication(qa),
        innovationValue: await this.assessInnovationValue(qa),
        overallScore: 0
      };

      // Calculate weighted overall score
      metrics.overallScore = (
        metrics.reasoningDepth * 0.25 +
        metrics.policyAccuracy * 0.20 +
        metrics.trustBuildingEffectiveness * 0.15 +
        metrics.emotionalIntelligence * 0.15 +
        metrics.ethicalSophistication * 0.15 +
        metrics.innovationValue * 0.10
      );

      console.log(`✅ [${this.context}] Quality assessment complete: ${metrics.overallScore.toFixed(2)}/10.0`);
      return metrics;
    } catch (error) {
      console.error(`❌ [${this.context}] Quality assessment failed:`, error);
      throw new Error(`Quality assessment failed: ${error.message}`);
    }
  }

  private async assessReasoningDepth(response: string): Promise<number> {
    // Analyze reasoning depth based on response characteristics
    let score = 5.0; // Base score

    // Check for logical structure indicators
    const logicalIndicators = ['because', 'therefore', 'however', 'furthermore', 'consequently', 'moreover'];
    const logicalCount = logicalIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(logicalCount * 0.5, 2.0);

    // Check for evidence and examples
    const evidenceIndicators = ['for example', 'specifically', 'evidence', 'demonstrates', 'shows that'];
    const evidenceCount = evidenceIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(evidenceCount * 0.3, 1.5);

    // Check for consideration of alternatives
    const alternativeIndicators = ['alternatively', 'on the other hand', 'could also', 'another approach'];
    const alternativeCount = alternativeIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(alternativeCount * 0.4, 1.5);

    // Response length factor (longer responses often indicate deeper reasoning)
    if (response.length > 500) score += 0.5;
    if (response.length > 1000) score += 0.5;

    return Math.min(score, 10.0);
  }

  private async assessPolicyAccuracy(qa: GovernedInsightsQA): Promise<number> {
    // Assess how accurately the response addresses policy compliance
    let score = 5.0;

    if (qa.questionType === 'policy-compliance') {
      // Check for specific policy references
      const policyReferences = qa.context.policyContext.assignedPolicies.filter(policy =>
        qa.agentResponse.toLowerCase().includes(policy.toLowerCase())
      ).length;
      score += Math.min(policyReferences * 1.0, 3.0);

      // Check for compliance terminology
      const complianceTerms = ['comply', 'compliance', 'regulation', 'requirement', 'standard', 'guideline'];
      const complianceCount = complianceTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(complianceCount * 0.3, 2.0);
    }

    return Math.min(score, 10.0);
  }

  private async assessTrustBuildingEffectiveness(qa: GovernedInsightsQA): Promise<number> {
    let score = 5.0;

    if (qa.questionType === 'trust-building') {
      // Check for transparency indicators
      const transparencyTerms = ['transparent', 'honest', 'clear', 'explain', 'understand', 'clarify'];
      const transparencyCount = transparencyTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(transparencyCount * 0.4, 2.5);

      // Check for reliability indicators
      const reliabilityTerms = ['reliable', 'consistent', 'dependable', 'accurate', 'precise'];
      const reliabilityCount = reliabilityTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(reliabilityCount * 0.4, 2.5);
    }

    return Math.min(score, 10.0);
  }

  private async assessEmotionalIntelligence(qa: GovernedInsightsQA): Promise<number> {
    let score = 5.0;

    if (qa.questionType === 'emotional-intelligence') {
      // Check for empathy indicators
      const empathyTerms = ['understand', 'feel', 'empathy', 'compassion', 'support', 'comfort'];
      const empathyCount = empathyTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(empathyCount * 0.5, 2.5);

      // Check for emotional awareness
      const emotionalTerms = ['emotion', 'feeling', 'mood', 'state', 'emotional', 'sensitive'];
      const emotionalCount = emotionalTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(emotionalCount * 0.4, 2.5);
    }

    return Math.min(score, 10.0);
  }

  private async assessEthicalSophistication(qa: GovernedInsightsQA): Promise<number> {
    let score = 5.0;

    if (qa.questionType === 'ethical-reasoning') {
      // Check for ethical terminology
      const ethicalTerms = ['ethical', 'moral', 'right', 'wrong', 'principle', 'value', 'responsibility'];
      const ethicalCount = ethicalTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(ethicalCount * 0.4, 2.5);

      // Check for consideration of consequences
      const consequenceTerms = ['consequence', 'impact', 'effect', 'result', 'outcome', 'implication'];
      const consequenceCount = consequenceTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(consequenceCount * 0.4, 2.5);
    }

    return Math.min(score, 10.0);
  }

  private async assessInnovationValue(qa: GovernedInsightsQA): Promise<number> {
    let score = 5.0;

    if (qa.questionType === 'innovation-approach') {
      // Check for innovation terminology
      const innovationTerms = ['innovative', 'creative', 'novel', 'unique', 'original', 'breakthrough'];
      const innovationCount = innovationTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(innovationCount * 0.5, 2.5);

      // Check for balance with governance
      const balanceTerms = ['balance', 'maintain', 'ensure', 'while', 'within', 'boundaries'];
      const balanceCount = balanceTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(balanceCount * 0.4, 2.5);
    }

    return Math.min(score, 10.0);
  }

  // ============================================================================
  // HARVESTING PREPARATION
  // ============================================================================

  async prepareForHarvesting(qa: GovernedInsightsQA): Promise<GovernedInsightsQA> {
    try {
      console.log(`🔒 [${this.context}] Preparing Q&A for harvesting: ${qa.questionId}`);
      
      // Create anonymized copy
      const harvestedQA: GovernedInsightsQA = {
        ...qa,
        context: {
          ...qa.context,
          agentId: this.anonymizeId(qa.context.agentId),
          userId: this.anonymizeId(qa.context.userId),
          sessionId: this.anonymizeId(qa.context.sessionId),
          interactionId: this.anonymizeId(qa.context.interactionId)
        },
        agentResponse: await this.anonymizeResponse(qa.agentResponse),
        harvestingMetadata: {
          ...qa.harvestingMetadata,
          isAnonymized: true,
          privacyLevel: 'anonymized'
        }
      };

      console.log(`✅ [${this.context}] Q&A prepared for harvesting with anonymization`);
      return harvestedQA;
    } catch (error) {
      console.error(`❌ [${this.context}] Harvesting preparation failed:`, error);
      throw new Error(`Harvesting preparation failed: ${error.message}`);
    }
  }

  async validateHarvestingEligibility(qa: GovernedInsightsQA): Promise<boolean> {
    try {
      // Check quality threshold
      if (qa.harvestingMetadata.qualityScore < this.defaultConfig.qualityThreshold) {
        return false;
      }

      // Check consent
      if (!qa.harvestingMetadata.harvestingConsent) {
        return false;
      }

      // Check training data eligibility
      if (!qa.harvestingMetadata.trainingDataEligible) {
        return false;
      }

      // Check privacy level
      if (qa.harvestingMetadata.privacyLevel === 'private') {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ [${this.context}] Harvesting eligibility validation failed:`, error);
      return false;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async calculateResponseConfidence(response: string): Promise<number> {
    // Simple confidence calculation based on response characteristics
    let confidence = 0.5; // Base confidence

    // Check for uncertainty indicators
    const uncertaintyIndicators = ['might', 'could', 'possibly', 'perhaps', 'maybe', 'uncertain'];
    const uncertaintyCount = uncertaintyIndicators.filter(indicator =>
      response.toLowerCase().includes(indicator)
    ).length;
    confidence -= uncertaintyCount * 0.1;

    // Check for confidence indicators
    const confidenceIndicators = ['certain', 'confident', 'sure', 'definitely', 'clearly', 'obviously'];
    const confidenceCount = confidenceIndicators.filter(indicator =>
      response.toLowerCase().includes(indicator)
    ).length;
    confidence += confidenceCount * 0.1;

    // Response completeness factor
    if (response.length > 200) confidence += 0.1;
    if (response.length > 500) confidence += 0.1;

    return Math.max(0.0, Math.min(1.0, confidence));
  }

  private async calculateReasoningDepth(response: string): Promise<number> {
    // Reuse the reasoning depth assessment logic
    return (await this.assessReasoningDepth(response)) / 10.0;
  }

  private createHarvestingMetadata(context: GovernanceQAContext): HarvestingMetadata {
    return {
      qualityScore: 0, // To be calculated
      isAnonymized: false,
      harvestingConsent: true, // Default to true, should be configurable
      dataRetentionDays: 365,
      trainingDataEligible: false, // To be determined by quality assessment
      privacyLevel: 'anonymized'
    };
  }

  private anonymizeId(id: string): string {
    // Simple anonymization - replace with hash in production
    return `anon_${id.substring(0, 8)}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private async anonymizeResponse(response: string): Promise<string> {
    // Remove potential personal identifiers
    let anonymized = response;
    
    // Remove email patterns
    anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    
    // Remove phone patterns
    anonymized = anonymized.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
    
    // Remove potential names (simple pattern)
    anonymized = anonymized.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
    
    return anonymized;
  }
}

