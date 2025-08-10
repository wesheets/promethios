/**
 * Modern Chat Governed Insights Q&A Service
 * 
 * Implements governance insights Q&A system for the modern chat
 * architecture. Integrates with existing GovernanceEnhancedLLMService
 * and modern chat governance services.
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
  HarvestingMetadata,
  EmotionalQAContext,
  PolicyQAContext,
  ConversationQAContext
} from '../shared/governance/types/GovernedInsightsQATypes';

import { GovernanceContext } from './GovernanceEnhancedLLMService';
import { enhancedAuditLoggingService } from './EnhancedAuditLoggingService';

export class ModernChatGovernedInsightsQAService implements IGovernedInsightsQAService {
  private static instance: ModernChatGovernedInsightsQAService;
  private defaultConfig: QAGenerationConfig;

  private constructor() {
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
    
    console.log(`🧠 [ModernChat] Governed Insights Q&A Service initialized`);
  }

  public static getInstance(): ModernChatGovernedInsightsQAService {
    if (!ModernChatGovernedInsightsQAService.instance) {
      ModernChatGovernedInsightsQAService.instance = new ModernChatGovernedInsightsQAService();
    }
    return ModernChatGovernedInsightsQAService.instance;
  }

  // ============================================================================
  // MODERN CHAT INTEGRATION METHODS
  // ============================================================================

  /**
   * Convert modern chat GovernanceContext to Q&A context
   */
  public convertToQAContext(
    modernChatContext: GovernanceContext,
    messageContent: string,
    conversationHistory: any[] = []
  ): GovernanceQAContext {
    const emotionalContext: EmotionalQAContext = {
      userEmotionalState: modernChatContext.emotionalContext?.userEmotionalState?.state || 'neutral',
      emotionalIntensity: modernChatContext.emotionalContext?.userEmotionalState?.intensity || 0.5,
      emotionalSafety: modernChatContext.emotionalContext?.emotionalSafety || 0.8,
      empathyRequired: modernChatContext.emotionalContext?.userEmotionalState?.intensity > 0.6
    };

    const policyContext: PolicyQAContext = {
      assignedPolicies: modernChatContext.assignedPolicies?.map(p => p.policyId || p.name || 'unknown') || [],
      complianceRate: modernChatContext.complianceRate || 0.8,
      recentViolations: 0, // Would need to be calculated from audit data
      sensitivityLevel: this.determineSensitivityLevel(messageContent)
    };

    const conversationContext: ConversationQAContext = {
      messageCount: conversationHistory.length + 1,
      conversationComplexity: this.calculateConversationComplexity(messageContent, conversationHistory),
      topicSensitivity: policyContext.sensitivityLevel,
      userSatisfaction: 0.8 // Default, would be calculated from feedback
    };

    return {
      agentId: modernChatContext.agentId,
      userId: modernChatContext.userId,
      sessionId: modernChatContext.sessionId,
      interactionId: `interaction_${Date.now()}`,
      trustScore: modernChatContext.trustScore,
      autonomyLevel: modernChatContext.autonomyLevel,
      emotionalContext,
      policyContext,
      conversationContext
    };
  }

  /**
   * Generate Q&A session for modern chat interaction
   */
  public async generateQAForModernChatInteraction(
    modernChatContext: GovernanceContext,
    messageContent: string,
    conversationHistory: any[] = [],
    config?: Partial<QAGenerationConfig>
  ): Promise<GovernanceQASession> {
    try {
      console.log(`📝 [ModernChat] Generating Q&A for interaction ${modernChatContext.agentId}`);
      
      const qaContext = this.convertToQAContext(modernChatContext, messageContent, conversationHistory);
      const fullConfig = { ...this.defaultConfig, ...config };
      
      const session = await this.generateQASession(qaContext, fullConfig);
      
      // Log to modern chat audit system
      await this.logQASessionToModernChatAudit(session, modernChatContext);
      
      console.log(`✅ [ModernChat] Generated Q&A session with ${session.questions.length} questions`);
      return session;
    } catch (error) {
      console.error(`❌ [ModernChat] Q&A generation failed:`, error);
      throw new Error(`Modern chat Q&A generation failed: ${error.message}`);
    }
  }

  /**
   * Process agent responses and integrate with modern chat audit logging
   */
  public async processResponsesForModernChat(
    session: GovernanceQASession,
    responses: string[],
    modernChatContext: GovernanceContext
  ): Promise<GovernedInsightsQA[]> {
    try {
      console.log(`🔄 [ModernChat] Processing responses for session ${session.sessionId}`);
      
      const processedQAs = await this.processAgentResponses(session, responses);
      
      // Log processed Q&As to modern chat audit system
      await this.logProcessedQAsToModernChatAudit(processedQAs, modernChatContext);
      
      // Update modern chat governance metrics based on Q&A quality
      await this.updateModernChatGovernanceMetrics(processedQAs, modernChatContext);
      
      console.log(`✅ [ModernChat] Processed ${processedQAs.length} responses`);
      return processedQAs;
    } catch (error) {
      console.error(`❌ [ModernChat] Response processing failed:`, error);
      throw new Error(`Modern chat response processing failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Q&A SESSION GENERATION (Shared Implementation)
  // ============================================================================

  async generateQASession(
    context: GovernanceQAContext, 
    config: QAGenerationConfig = this.defaultConfig
  ): Promise<GovernanceQASession> {
    try {
      console.log(`📝 [ModernChat] Generating Q&A session for agent ${context.agentId}`);
      
      const sessionId = `modern_qa_session_${context.agentId}_${Date.now()}`;
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

      console.log(`✅ [ModernChat] Generated Q&A session with ${questions.length} questions`);
      return session;
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to generate Q&A session:`, error);
      throw new Error(`Q&A session generation failed: ${error.message}`);
    }
  }

  async processAgentResponses(
    session: GovernanceQASession, 
    responses: string[]
  ): Promise<GovernedInsightsQA[]> {
    try {
      console.log(`🔄 [ModernChat] Processing ${responses.length} agent responses`);
      
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

      console.log(`✅ [ModernChat] Processed responses with overall quality: ${session.overallQuality.toFixed(2)}`);
      return processedQAs;
    } catch (error) {
      console.error(`❌ [ModernChat] Response processing failed:`, error);
      throw new Error(`Response processing failed: ${error.message}`);
    }
  }

  async assessQAQuality(qa: GovernedInsightsQA): Promise<QAQualityMetrics> {
    try {
      console.log(`📊 [ModernChat] Assessing Q&A quality for question ${qa.questionId}`);
      
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

      console.log(`✅ [ModernChat] Quality assessment complete: ${metrics.overallScore.toFixed(2)}/10.0`);
      return metrics;
    } catch (error) {
      console.error(`❌ [ModernChat] Quality assessment failed:`, error);
      throw new Error(`Quality assessment failed: ${error.message}`);
    }
  }

  async prepareForHarvesting(qa: GovernedInsightsQA): Promise<GovernedInsightsQA> {
    try {
      console.log(`🔒 [ModernChat] Preparing Q&A for harvesting: ${qa.questionId}`);
      
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

      console.log(`✅ [ModernChat] Q&A prepared for harvesting with anonymization`);
      return harvestedQA;
    } catch (error) {
      console.error(`❌ [ModernChat] Harvesting preparation failed:`, error);
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
      console.error(`❌ [ModernChat] Harvesting eligibility validation failed:`, error);
      return false;
    }
  }

  // ============================================================================
  // MODERN CHAT SPECIFIC INTEGRATION METHODS
  // ============================================================================

  private async logQASessionToModernChatAudit(
    session: GovernanceQASession,
    modernChatContext: GovernanceContext
  ): Promise<void> {
    try {
      // Log Q&A session creation to modern chat audit system
      await enhancedAuditLoggingService.logInteraction({
        interactionId: session.sessionId,
        agentId: session.agentId,
        userId: modernChatContext.userId,
        sessionId: modernChatContext.sessionId,
        userMessage: `Q&A Session Generated: ${session.questions.length} questions`,
        agentResponse: `Governance insights Q&A session created`,
        responseTimeMs: 0,
        tokenCount: 0,
        timestamp: session.sessionStartTime,
        
        // Governance context
        trustScore: modernChatContext.trustScore,
        complianceRate: modernChatContext.complianceRate,
        autonomyLevel: modernChatContext.autonomyLevel,
        governanceMode: 'qa-generation',
        
        // Q&A specific fields
        cognitiveContext: {
          reasoningDepth: 0.8, // Q&A generation requires reasoning
          confidenceLevel: 0.9,
          uncertaintyLevel: 0.1,
          complexityLevel: 0.7,
          topicSensitivity: 0.5,
          emotionalIntelligence: 0.8,
          selfQuestioning: true, // Q&A is self-questioning
          governanceAwareness: 1.0,
          policyConsideration: 1.0,
          trustAwareness: 1.0,
          learningIndicators: ['qa-generation', 'governance-reasoning'],
          cognitiveLoad: 0.6
        },
        
        // Extension data
        extensionData: {
          qaSession: {
            sessionId: session.sessionId,
            questionCount: session.questions.length,
            questionTypes: session.questions.map(q => q.questionType)
          }
        }
      });
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to log Q&A session to audit:`, error);
    }
  }

  private async logProcessedQAsToModernChatAudit(
    processedQAs: GovernedInsightsQA[],
    modernChatContext: GovernanceContext
  ): Promise<void> {
    try {
      for (const qa of processedQAs) {
        await enhancedAuditLoggingService.logInteraction({
          interactionId: qa.questionId,
          agentId: qa.context.agentId,
          userId: qa.context.userId,
          sessionId: qa.context.sessionId,
          userMessage: qa.question,
          agentResponse: qa.agentResponse,
          responseTimeMs: 0,
          tokenCount: qa.agentResponse.length,
          timestamp: qa.timestamp,
          
          // Governance context
          trustScore: qa.context.trustScore,
          complianceRate: qa.context.policyContext.complianceRate,
          autonomyLevel: qa.context.autonomyLevel,
          governanceMode: 'qa-response',
          
          // Q&A specific cognitive context
          cognitiveContext: {
            reasoningDepth: qa.reasoningDepth,
            confidenceLevel: qa.confidence,
            uncertaintyLevel: 1.0 - qa.confidence,
            complexityLevel: qa.context.conversationContext.conversationComplexity,
            topicSensitivity: qa.context.policyContext.sensitivityLevel === 'high' ? 0.8 : 0.5,
            emotionalIntelligence: qa.context.emotionalContext.emotionalSafety,
            selfQuestioning: true,
            governanceAwareness: 1.0,
            policyConsideration: 1.0,
            trustAwareness: 1.0,
            learningIndicators: ['qa-response', 'governance-reasoning', qa.questionType],
            cognitiveLoad: 0.7
          },
          
          // Q&A quality metrics
          extensionData: {
            qaResponse: {
              questionId: qa.questionId,
              questionType: qa.questionType,
              qualityScore: qa.harvestingMetadata.qualityScore,
              trainingEligible: qa.harvestingMetadata.trainingDataEligible
            }
          }
        });
      }
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to log processed Q&As to audit:`, error);
    }
  }

  private async updateModernChatGovernanceMetrics(
    processedQAs: GovernedInsightsQA[],
    modernChatContext: GovernanceContext
  ): Promise<void> {
    try {
      // Calculate average quality score
      const averageQuality = processedQAs.reduce((sum, qa) => sum + qa.harvestingMetadata.qualityScore, 0) / processedQAs.length;
      
      // Update trust score based on Q&A quality (small positive impact for high quality)
      if (averageQuality >= 8.0) {
        // High quality Q&A responses indicate good governance reasoning
        console.log(`📈 [ModernChat] High quality Q&A responses (${averageQuality.toFixed(2)}) - positive trust impact`);
      }
      
      // Log governance improvement based on Q&A participation
      console.log(`📊 [ModernChat] Q&A session completed with average quality: ${averageQuality.toFixed(2)}`);
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to update governance metrics:`, error);
    }
  }

  // ============================================================================
  // UTILITY METHODS (Shared with Universal Implementation)
  // ============================================================================

  private async selectQuestionsForContext(
    context: GovernanceQAContext,
    config: QAGenerationConfig
  ): Promise<GovernanceQuestionTemplate[]> {
    // Same implementation as SharedGovernedInsightsQAService
    let availableTemplates = GOVERNANCE_QUESTION_TEMPLATES.filter(template =>
      config.enabledQuestionTypes.includes(template.questionType)
    );

    if (config.adaptToTrustLevel) {
      availableTemplates = availableTemplates.filter(template =>
        template.trustLevelRequirement <= context.trustScore
      );
    }

    const prioritizedTemplates = this.prioritizeQuestionsByContext(availableTemplates, context, config);
    return prioritizedTemplates.slice(0, config.maxQuestionsPerSession);
  }

  private prioritizeQuestionsByContext(
    templates: GovernanceQuestionTemplate[],
    context: GovernanceQAContext,
    config: QAGenerationConfig
  ): GovernanceQuestionTemplate[] {
    return templates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Same prioritization logic as SharedGovernedInsightsQAService
      if (config.adaptToTrustLevel) {
        if (context.trustScore < 0.5) {
          if (a.questionType === 'policy-compliance' || a.questionType === 'trust-building') scoreA += 3;
          if (b.questionType === 'policy-compliance' || b.questionType === 'trust-building') scoreB += 3;
        } else if (context.trustScore > 0.7) {
          if (a.questionType === 'ethical-reasoning' || a.questionType === 'innovation-approach') scoreA += 3;
          if (b.questionType === 'ethical-reasoning' || b.questionType === 'innovation-approach') scoreB += 3;
        }
      }

      if (config.adaptToEmotionalContext && context.emotionalContext.emotionalIntensity > 0.6) {
        if (a.questionType === 'emotional-intelligence') scoreA += 2;
        if (b.questionType === 'emotional-intelligence') scoreB += 2;
      }

      if (config.adaptToPolicyComplexity && context.policyContext.assignedPolicies.length > 3) {
        if (a.questionType === 'policy-compliance') scoreA += 2;
        if (b.questionType === 'policy-compliance') scoreB += 2;
      }

      return scoreB - scoreA;
    });
  }

  private populateQuestionTemplate(template: GovernanceQuestionTemplate, context: GovernanceQAContext): string {
    let question = template.template;
    question = question.replace('{policyName}', context.policyContext.assignedPolicies[0] || 'assigned policies');
    question = question.replace('{trustScore}', (context.trustScore * 100).toFixed(1) + '%');
    question = question.replace('{emotionalState}', context.emotionalContext.userEmotionalState);
    question = question.replace('{autonomyLevel}', context.autonomyLevel);
    return question;
  }

  private determineSensitivityLevel(content: string): 'low' | 'medium' | 'high' | 'critical' {
    const sensitiveKeywords = {
      high: ['medical', 'health', 'financial', 'personal', 'private'],
      critical: ['emergency', 'crisis', 'danger', 'threat', 'urgent']
    };

    const criticalCount = sensitiveKeywords.critical.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;

    const highCount = sensitiveKeywords.high.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (highCount > 0) return 'medium';
    return 'low';
  }

  private calculateConversationComplexity(content: string, history: any[]): number {
    let complexity = 0.5; // Base complexity
    
    // Length factor
    if (content.length > 500) complexity += 0.2;
    if (content.length > 1000) complexity += 0.2;
    
    // History factor
    if (history.length > 5) complexity += 0.1;
    if (history.length > 10) complexity += 0.1;
    
    return Math.min(complexity, 1.0);
  }

  // Quality assessment methods (same as SharedGovernedInsightsQAService)
  private async assessReasoningDepth(response: string): Promise<number> {
    let score = 5.0;
    const logicalIndicators = ['because', 'therefore', 'however', 'furthermore', 'consequently', 'moreover'];
    const logicalCount = logicalIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(logicalCount * 0.5, 2.0);

    const evidenceIndicators = ['for example', 'specifically', 'evidence', 'demonstrates', 'shows that'];
    const evidenceCount = evidenceIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(evidenceCount * 0.3, 1.5);

    if (response.length > 500) score += 0.5;
    if (response.length > 1000) score += 0.5;

    return Math.min(score, 10.0);
  }

  private async assessPolicyAccuracy(qa: GovernedInsightsQA): Promise<number> {
    let score = 5.0;
    if (qa.questionType === 'policy-compliance') {
      const policyReferences = qa.context.policyContext.assignedPolicies.filter(policy =>
        qa.agentResponse.toLowerCase().includes(policy.toLowerCase())
      ).length;
      score += Math.min(policyReferences * 1.0, 3.0);

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
      const transparencyTerms = ['transparent', 'honest', 'clear', 'explain', 'understand', 'clarify'];
      const transparencyCount = transparencyTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(transparencyCount * 0.4, 2.5);

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
      const empathyTerms = ['understand', 'feel', 'empathy', 'compassion', 'support', 'comfort'];
      const empathyCount = empathyTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(empathyCount * 0.5, 2.5);

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
      const ethicalTerms = ['ethical', 'moral', 'right', 'wrong', 'principle', 'value', 'responsibility'];
      const ethicalCount = ethicalTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(ethicalCount * 0.4, 2.5);

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
      const innovationTerms = ['innovative', 'creative', 'novel', 'unique', 'original', 'breakthrough'];
      const innovationCount = innovationTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(innovationCount * 0.5, 2.5);

      const balanceTerms = ['balance', 'maintain', 'ensure', 'while', 'within', 'boundaries'];
      const balanceCount = balanceTerms.filter(term =>
        qa.agentResponse.toLowerCase().includes(term)
      ).length;
      score += Math.min(balanceCount * 0.4, 2.5);
    }
    return Math.min(score, 10.0);
  }

  private async calculateResponseConfidence(response: string): Promise<number> {
    let confidence = 0.5;
    const uncertaintyIndicators = ['might', 'could', 'possibly', 'perhaps', 'maybe', 'uncertain'];
    const uncertaintyCount = uncertaintyIndicators.filter(indicator =>
      response.toLowerCase().includes(indicator)
    ).length;
    confidence -= uncertaintyCount * 0.1;

    const confidenceIndicators = ['certain', 'confident', 'sure', 'definitely', 'clearly', 'obviously'];
    const confidenceCount = confidenceIndicators.filter(indicator =>
      response.toLowerCase().includes(indicator)
    ).length;
    confidence += confidenceCount * 0.1;

    if (response.length > 200) confidence += 0.1;
    if (response.length > 500) confidence += 0.1;

    return Math.max(0.0, Math.min(1.0, confidence));
  }

  private async calculateReasoningDepth(response: string): Promise<number> {
    return (await this.assessReasoningDepth(response)) / 10.0;
  }

  private createHarvestingMetadata(context: GovernanceQAContext): HarvestingMetadata {
    return {
      qualityScore: 0,
      isAnonymized: false,
      harvestingConsent: true,
      dataRetentionDays: 365,
      trainingDataEligible: false,
      privacyLevel: 'anonymized'
    };
  }

  private anonymizeId(id: string): string {
    return `modern_anon_${id.substring(0, 8)}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private async anonymizeResponse(response: string): Promise<string> {
    let anonymized = response;
    anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    anonymized = anonymized.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
    anonymized = anonymized.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
    return anonymized;
  }
}

