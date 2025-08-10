/**
 * Enhanced Data Harvesting Extension for Promethios
 * 
 * Extends the original DataHarvestingExtension to include governance insights Q&A data
 * from both universal governance and modern chat systems. This creates the richest
 * possible dataset for training the community-owned governance-specialized LLM.
 */

import { Extension } from './Extension';
import { ExtensionRegistry } from '../core/governance/extension_point_framework';
import { 
  DataHarvestingExtension, 
  DataHarvestingConfig, 
  HarvestedInteraction,
  DataHarvestingMetrics 
} from './DataHarvestingExtension';

// Import Q&A types and services
import {
  GovernedInsightsQA,
  GovernanceQASession,
  QAQualityMetrics,
  GovernanceQuestionType
} from '../shared/governance/types/GovernedInsightsQATypes';

import { SharedGovernedInsightsQAService } from '../shared/governance/core/SharedGovernedInsightsQAService';
import { ModernChatGovernedInsightsQAService } from '../services/ModernChatGovernedInsightsQAService';

export interface EnhancedDataHarvestingConfig extends DataHarvestingConfig {
  enableQAHarvesting: boolean;
  enableUniversalQAHarvesting: boolean;
  enableModernChatQAHarvesting: boolean;
  qaQualityThreshold: number; // Separate threshold for Q&A data
  qaHarvestingRate: number; // Separate rate for Q&A harvesting
  enableGovernanceReasoningAnalysis: boolean;
  enableCrossSystemQAComparison: boolean;
}

export interface HarvestedQAInteraction extends HarvestedInteraction {
  type: 'governance_qa';
  qaData: {
    sessionId: string;
    questionCount: number;
    questionTypes: GovernanceQuestionType[];
    averageReasoningDepth: number;
    averageConfidence: number;
    governanceSystem: 'universal' | 'modern_chat';
    questions: HarvestedQAQuestion[];
  };
}

export interface HarvestedQAQuestion {
  questionId: string;
  questionType: GovernanceQuestionType;
  question: string;
  agentResponse: string;
  confidence: number;
  reasoningDepth: number;
  qualityMetrics: QAQualityMetrics;
  harvestingEligible: boolean;
  anonymized: boolean;
}

export interface QAHarvestingMetrics extends DataHarvestingMetrics {
  qaSessionsHarvested: number;
  universalQASessions: number;
  modernChatQASessions: number;
  totalQAQuestions: number;
  averageQAQuality: number;
  governanceReasoningDataSize: string;
  crossSystemQAComparisons: number;
}

/**
 * Enhanced Data Harvesting Extension Class
 * Extends base functionality to include governance insights Q&A harvesting
 */
export class EnhancedDataHarvestingExtension extends DataHarvestingExtension {
  private static enhancedInstance: EnhancedDataHarvestingExtension;
  private enhancedConfig: EnhancedDataHarvestingConfig;
  private qaHarvestedData: Map<string, HarvestedQAInteraction> = new Map();
  private qaHarvestingMetrics: QAHarvestingMetrics;
  
  // Q&A service instances
  private universalQAService: SharedGovernedInsightsQAService;
  private modernChatQAService: ModernChatGovernedInsightsQAService;

  private constructor() {
    super();
    
    this.enhancedConfig = {
      // Base config
      enableSingleAgentHarvesting: true,
      enableMultiAgentHarvesting: true,
      enableGovernancePatternHarvesting: true,
      enableQualityFeedbackCollection: true,
      harvestingRate: 0.1,
      qualityThreshold: 7.0,
      userConsentRequired: true,
      anonymizeData: true,
      retentionPeriodDays: 365,
      
      // Enhanced Q&A config
      enableQAHarvesting: true,
      enableUniversalQAHarvesting: true,
      enableModernChatQAHarvesting: true,
      qaQualityThreshold: 7.5, // Higher threshold for Q&A data
      qaHarvestingRate: 1.0, // Harvest all Q&A sessions (they're already filtered)
      enableGovernanceReasoningAnalysis: true,
      enableCrossSystemQAComparison: true
    };

    this.qaHarvestingMetrics = {
      // Base metrics
      totalInteractionsHarvested: 0,
      singleAgentInteractions: 0,
      multiAgentInteractions: 0,
      governanceDecisions: 0,
      qualityFeedbackEntries: 0,
      averageQualityScore: 0,
      datasetSize: '0 MB',
      contributingUsers: 0,
      harvestingEfficiency: 0,
      
      // Enhanced Q&A metrics
      qaSessionsHarvested: 0,
      universalQASessions: 0,
      modernChatQASessions: 0,
      totalQAQuestions: 0,
      averageQAQuality: 0,
      governanceReasoningDataSize: '0 MB',
      crossSystemQAComparisons: 0
    };

    // Initialize Q&A services
    this.universalQAService = new SharedGovernedInsightsQAService('universal');
    this.modernChatQAService = ModernChatGovernedInsightsQAService.getInstance();
  }

  static getEnhancedInstance(): EnhancedDataHarvestingExtension {
    if (!EnhancedDataHarvestingExtension.enhancedInstance) {
      EnhancedDataHarvestingExtension.enhancedInstance = new EnhancedDataHarvestingExtension();
    }
    return EnhancedDataHarvestingExtension.enhancedInstance;
  }

  async initializeEnhanced(config?: Partial<EnhancedDataHarvestingConfig>): Promise<boolean> {
    try {
      // Merge provided config with defaults
      if (config) {
        this.enhancedConfig = { ...this.enhancedConfig, ...config };
      }

      // Initialize base extension
      await this.initialize(this.enhancedConfig);

      // Initialize Q&A harvesting specific components
      await this.initializeQAHarvesting();

      console.log('EnhancedDataHarvestingExtension initialized successfully with Q&A capabilities');
      return true;
    } catch (error) {
      console.error('Failed to initialize EnhancedDataHarvestingExtension:', error);
      return false;
    }
  }

  // ============================================================================
  // Q&A HARVESTING METHODS
  // ============================================================================

  /**
   * Harvest Q&A session from universal governance system
   */
  async harvestUniversalQASession(session: GovernanceQASession): Promise<void> {
    if (!this.enhancedConfig.enableQAHarvesting || !this.enhancedConfig.enableUniversalQAHarvesting) {
      return;
    }

    try {
      console.log(`🌾 [Enhanced] Harvesting universal Q&A session: ${session.sessionId}`);
      
      // Check if session meets quality threshold
      if (session.overallQuality < this.enhancedConfig.qaQualityThreshold) {
        console.log(`⚠️ [Enhanced] Q&A session quality (${session.overallQuality.toFixed(2)}) below threshold (${this.enhancedConfig.qaQualityThreshold})`);
        return;
      }

      // Check harvesting rate
      if (!this.shouldHarvestQASession()) {
        return;
      }

      // Create harvested Q&A interaction
      const harvestedQA = await this.createHarvestedQAInteraction(session, 'universal');
      
      // Store harvested data
      this.qaHarvestedData.set(harvestedQA.id, harvestedQA);
      
      // Update metrics
      this.updateQAHarvestingMetrics(harvestedQA);
      
      console.log(`✅ [Enhanced] Successfully harvested universal Q&A session with ${session.questions.length} questions`);
    } catch (error) {
      console.error(`❌ [Enhanced] Failed to harvest universal Q&A session:`, error);
    }
  }

  /**
   * Harvest Q&A session from modern chat system
   */
  async harvestModernChatQASession(session: GovernanceQASession): Promise<void> {
    if (!this.enhancedConfig.enableQAHarvesting || !this.enhancedConfig.enableModernChatQAHarvesting) {
      return;
    }

    try {
      console.log(`🌾 [Enhanced] Harvesting modern chat Q&A session: ${session.sessionId}`);
      
      // Check if session meets quality threshold
      if (session.overallQuality < this.enhancedConfig.qaQualityThreshold) {
        console.log(`⚠️ [Enhanced] Q&A session quality (${session.overallQuality.toFixed(2)}) below threshold (${this.enhancedConfig.qaQualityThreshold})`);
        return;
      }

      // Check harvesting rate
      if (!this.shouldHarvestQASession()) {
        return;
      }

      // Create harvested Q&A interaction
      const harvestedQA = await this.createHarvestedQAInteraction(session, 'modern_chat');
      
      // Store harvested data
      this.qaHarvestedData.set(harvestedQA.id, harvestedQA);
      
      // Update metrics
      this.updateQAHarvestingMetrics(harvestedQA);
      
      // Perform cross-system comparison if enabled
      if (this.enhancedConfig.enableCrossSystemQAComparison) {
        await this.performCrossSystemQAComparison(harvestedQA);
      }
      
      console.log(`✅ [Enhanced] Successfully harvested modern chat Q&A session with ${session.questions.length} questions`);
    } catch (error) {
      console.error(`❌ [Enhanced] Failed to harvest modern chat Q&A session:`, error);
    }
  }

  /**
   * Harvest individual Q&A question and response
   */
  async harvestQAQuestion(qa: GovernedInsightsQA, governanceSystem: 'universal' | 'modern_chat'): Promise<void> {
    if (!this.enhancedConfig.enableQAHarvesting) {
      return;
    }

    try {
      // Check if Q&A is eligible for harvesting
      const isEligible = await this.validateQAHarvestingEligibility(qa);
      if (!isEligible) {
        return;
      }

      // Prepare Q&A for harvesting (anonymization, etc.)
      const harvestedQA = await this.prepareQAForHarvesting(qa, governanceSystem);
      
      // Store as individual Q&A entry
      await this.storeIndividualQA(harvestedQA);
      
      console.log(`✅ [Enhanced] Harvested individual Q&A question: ${qa.questionType}`);
    } catch (error) {
      console.error(`❌ [Enhanced] Failed to harvest Q&A question:`, error);
    }
  }

  // ============================================================================
  // Q&A DATA PROCESSING METHODS
  // ============================================================================

  private async createHarvestedQAInteraction(
    session: GovernanceQASession, 
    governanceSystem: 'universal' | 'modern_chat'
  ): Promise<HarvestedQAInteraction> {
    // Process all questions in the session
    const harvestedQuestions: HarvestedQAQuestion[] = [];
    
    for (const qa of session.questions) {
      if (qa.harvestingMetadata.trainingDataEligible) {
        const qualityMetrics = await this.assessQAQuality(qa);
        
        harvestedQuestions.push({
          questionId: qa.questionId,
          questionType: qa.questionType,
          question: qa.question,
          agentResponse: qa.agentResponse,
          confidence: qa.confidence,
          reasoningDepth: qa.reasoningDepth,
          qualityMetrics,
          harvestingEligible: true,
          anonymized: this.enhancedConfig.anonymizeData
        });
      }
    }

    // Calculate session-level metrics
    const averageReasoningDepth = harvestedQuestions.reduce((sum, q) => sum + q.reasoningDepth, 0) / harvestedQuestions.length;
    const averageConfidence = harvestedQuestions.reduce((sum, q) => sum + q.confidence, 0) / harvestedQuestions.length;

    // Create harvested interaction
    const harvestedInteraction: HarvestedQAInteraction = {
      id: this.generateQAHarvestId(),
      type: 'governance_qa',
      timestamp: new Date().toISOString(),
      contextId: session.sessionId,
      agentIds: [session.agentId],
      userId: this.enhancedConfig.anonymizeData ? undefined : session.questions[0]?.context.userId,
      
      content: {
        // Q&A sessions don't have traditional user/agent messages
        conversationFlow: harvestedQuestions.map(q => ({
          speaker: 'system',
          message: q.question,
          timestamp: q.questionId,
          governanceData: { questionType: q.questionType }
        }))
      },
      
      quality: {
        overallScore: session.overallQuality,
        governanceCompliance: this.calculateGovernanceCompliance(harvestedQuestions),
        responseQuality: this.calculateResponseQuality(harvestedQuestions),
        collaborationEffectiveness: 0, // N/A for Q&A
        innovationLevel: this.calculateInnovationLevel(harvestedQuestions),
        userSatisfaction: 0 // N/A for Q&A
      },
      
      governance: {
        trustScores: { [session.agentId]: session.questions[0]?.context.trustScore || 0 },
        policiesApplied: session.questions[0]?.context.policyContext.assignedPolicies || [],
        complianceStatus: 'compliant', // Q&A sessions are inherently compliant
        autonomyLevel: this.parseAutonomyLevel(session.questions[0]?.context.autonomyLevel || 'standard'),
        governanceMode: 'qa-session'
      },
      
      patterns: {
        successfulGovernancePatterns: this.extractGovernancePatterns(harvestedQuestions),
        effectiveCollaborationStrategies: [], // N/A for Q&A
        qualityThinkingIndicators: this.extractThinkingIndicators(harvestedQuestions),
        innovationMoments: this.extractInnovationMoments(harvestedQuestions)
      },
      
      metadata: {
        harvestingVersion: '2.0.0-qa',
        dataSource: `${governanceSystem}-qa`,
        processingFlags: ['qa-session', 'governance-reasoning', governanceSystem],
        anonymized: this.enhancedConfig.anonymizeData
      },
      
      // Q&A specific data
      qaData: {
        sessionId: session.sessionId,
        questionCount: harvestedQuestions.length,
        questionTypes: harvestedQuestions.map(q => q.questionType),
        averageReasoningDepth,
        averageConfidence,
        governanceSystem,
        questions: harvestedQuestions
      }
    };

    return harvestedInteraction;
  }

  private async assessQAQuality(qa: GovernedInsightsQA): Promise<QAQualityMetrics> {
    // Use the appropriate Q&A service to assess quality
    if (qa.context.agentId.includes('universal')) {
      return await this.universalQAService.assessQAQuality(qa);
    } else {
      return await this.modernChatQAService.assessQAQuality(qa);
    }
  }

  private async validateQAHarvestingEligibility(qa: GovernedInsightsQA): Promise<boolean> {
    // Use the appropriate Q&A service to validate eligibility
    if (qa.context.agentId.includes('universal')) {
      return await this.universalQAService.validateHarvestingEligibility(qa);
    } else {
      return await this.modernChatQAService.validateHarvestingEligibility(qa);
    }
  }

  private async prepareQAForHarvesting(qa: GovernedInsightsQA, governanceSystem: string): Promise<GovernedInsightsQA> {
    // Use the appropriate Q&A service to prepare for harvesting
    if (governanceSystem === 'universal') {
      return await this.universalQAService.prepareForHarvesting(qa);
    } else {
      return await this.modernChatQAService.prepareForHarvesting(qa);
    }
  }

  // ============================================================================
  // CROSS-SYSTEM COMPARISON METHODS
  // ============================================================================

  private async performCrossSystemQAComparison(harvestedQA: HarvestedQAInteraction): Promise<void> {
    try {
      console.log(`🔍 [Enhanced] Performing cross-system Q&A comparison for session ${harvestedQA.qaData.sessionId}`);
      
      // Find similar Q&A sessions from the other system
      const otherSystemSessions = Array.from(this.qaHarvestedData.values()).filter(session => 
        session.qaData.governanceSystem !== harvestedQA.qaData.governanceSystem &&
        this.hasOverlappingQuestionTypes(session.qaData.questionTypes, harvestedQA.qaData.questionTypes)
      );

      if (otherSystemSessions.length > 0) {
        // Perform comparison analysis
        const comparison = await this.analyzeQASystemDifferences(harvestedQA, otherSystemSessions);
        
        // Store comparison results
        await this.storeQAComparison(comparison);
        
        this.qaHarvestingMetrics.crossSystemQAComparisons++;
        
        console.log(`✅ [Enhanced] Cross-system Q&A comparison completed`);
      }
    } catch (error) {
      console.error(`❌ [Enhanced] Cross-system Q&A comparison failed:`, error);
    }
  }

  private hasOverlappingQuestionTypes(types1: GovernanceQuestionType[], types2: GovernanceQuestionType[]): boolean {
    return types1.some(type => types2.includes(type));
  }

  private async analyzeQASystemDifferences(
    currentSession: HarvestedQAInteraction, 
    otherSessions: HarvestedQAInteraction[]
  ): Promise<any> {
    // Analyze differences in Q&A quality, reasoning depth, etc. between systems
    const comparison = {
      currentSystem: currentSession.qaData.governanceSystem,
      currentQuality: currentSession.quality.overallScore,
      currentReasoningDepth: currentSession.qaData.averageReasoningDepth,
      
      otherSystemAverages: {
        quality: otherSessions.reduce((sum, s) => sum + s.quality.overallScore, 0) / otherSessions.length,
        reasoningDepth: otherSessions.reduce((sum, s) => sum + s.qaData.averageReasoningDepth, 0) / otherSessions.length
      },
      
      insights: this.generateComparisonInsights(currentSession, otherSessions)
    };

    return comparison;
  }

  private generateComparisonInsights(
    currentSession: HarvestedQAInteraction, 
    otherSessions: HarvestedQAInteraction[]
  ): string[] {
    const insights: string[] = [];
    
    const avgOtherQuality = otherSessions.reduce((sum, s) => sum + s.quality.overallScore, 0) / otherSessions.length;
    
    if (currentSession.quality.overallScore > avgOtherQuality + 0.5) {
      insights.push(`${currentSession.qaData.governanceSystem} system shows higher Q&A quality`);
    } else if (currentSession.quality.overallScore < avgOtherQuality - 0.5) {
      insights.push(`${currentSession.qaData.governanceSystem} system shows lower Q&A quality`);
    }
    
    return insights;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async initializeQAHarvesting(): Promise<void> {
    console.log('🔧 [Enhanced] Initializing Q&A harvesting capabilities');
    
    // Initialize Q&A data storage
    this.qaHarvestedData = new Map();
    
    // Set up Q&A harvesting hooks
    await this.setupQAHarvestingHooks();
    
    console.log('✅ [Enhanced] Q&A harvesting capabilities initialized');
  }

  private async setupQAHarvestingHooks(): Promise<void> {
    // Set up hooks to automatically harvest Q&A sessions when they're completed
    // This would integrate with the governance systems to trigger harvesting
    console.log('🔗 [Enhanced] Setting up Q&A harvesting hooks');
  }

  private shouldHarvestQASession(): boolean {
    return Math.random() < this.enhancedConfig.qaHarvestingRate;
  }

  private generateQAHarvestId(): string {
    return `qa_harvest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateQAHarvestingMetrics(harvestedQA: HarvestedQAInteraction): void {
    this.qaHarvestingMetrics.qaSessionsHarvested++;
    this.qaHarvestingMetrics.totalQAQuestions += harvestedQA.qaData.questionCount;
    
    if (harvestedQA.qaData.governanceSystem === 'universal') {
      this.qaHarvestingMetrics.universalQASessions++;
    } else {
      this.qaHarvestingMetrics.modernChatQASessions++;
    }
    
    // Update average Q&A quality
    const totalQuality = this.qaHarvestingMetrics.averageQAQuality * (this.qaHarvestingMetrics.qaSessionsHarvested - 1) + harvestedQA.quality.overallScore;
    this.qaHarvestingMetrics.averageQAQuality = totalQuality / this.qaHarvestingMetrics.qaSessionsHarvested;
    
    // Update data size (rough estimate)
    const estimatedSize = this.qaHarvestedData.size * 50; // ~50KB per Q&A session
    this.qaHarvestingMetrics.governanceReasoningDataSize = `${(estimatedSize / 1024 / 1024).toFixed(2)} MB`;
  }

  private async storeIndividualQA(qa: GovernedInsightsQA): Promise<void> {
    // Store individual Q&A for fine-grained analysis
    console.log(`💾 [Enhanced] Storing individual Q&A: ${qa.questionType}`);
  }

  private async storeQAComparison(comparison: any): Promise<void> {
    // Store cross-system comparison results
    console.log(`💾 [Enhanced] Storing Q&A system comparison`);
  }

  // Helper methods for Q&A analysis
  private calculateGovernanceCompliance(questions: HarvestedQAQuestion[]): number {
    const complianceScores = questions.map(q => q.qualityMetrics.policyAccuracy);
    return complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length;
  }

  private calculateResponseQuality(questions: HarvestedQAQuestion[]): number {
    const qualityScores = questions.map(q => q.qualityMetrics.overallScore);
    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  private calculateInnovationLevel(questions: HarvestedQAQuestion[]): number {
    const innovationScores = questions.map(q => q.qualityMetrics.innovationValue);
    return innovationScores.reduce((sum, score) => sum + score, 0) / innovationScores.length;
  }

  private extractGovernancePatterns(questions: HarvestedQAQuestion[]): string[] {
    const patterns: string[] = [];
    
    questions.forEach(q => {
      if (q.qualityMetrics.policyAccuracy > 8.0) {
        patterns.push(`effective-${q.questionType}-compliance`);
      }
      if (q.qualityMetrics.trustBuildingEffectiveness > 8.0) {
        patterns.push(`effective-${q.questionType}-trust-building`);
      }
    });
    
    return patterns;
  }

  private extractThinkingIndicators(questions: HarvestedQAQuestion[]): string[] {
    const indicators: string[] = [];
    
    questions.forEach(q => {
      if (q.reasoningDepth > 0.8) {
        indicators.push(`deep-reasoning-${q.questionType}`);
      }
      if (q.confidence > 0.8) {
        indicators.push(`high-confidence-${q.questionType}`);
      }
    });
    
    return indicators;
  }

  private extractInnovationMoments(questions: HarvestedQAQuestion[]): string[] {
    const moments: string[] = [];
    
    questions.forEach(q => {
      if (q.qualityMetrics.innovationValue > 8.0) {
        moments.push(`innovation-${q.questionType}`);
      }
    });
    
    return moments;
  }

  private parseAutonomyLevel(autonomyLevel: string): number {
    const levels: { [key: string]: number } = {
      'minimal': 0.2,
      'basic': 0.4,
      'standard': 0.6,
      'advanced': 0.8,
      'full': 1.0
    };
    
    return levels[autonomyLevel] || 0.6;
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Get Q&A harvesting metrics
   */
  getQAHarvestingMetrics(): QAHarvestingMetrics {
    return { ...this.qaHarvestingMetrics };
  }

  /**
   * Get harvested Q&A data for community LLM training
   */
  getHarvestedQAData(): HarvestedQAInteraction[] {
    return Array.from(this.qaHarvestedData.values());
  }

  /**
   * Export Q&A dataset for training
   */
  async exportQADatasetForTraining(): Promise<any> {
    const dataset = {
      metadata: {
        version: '2.0.0-qa',
        generatedAt: new Date().toISOString(),
        totalSessions: this.qaHarvestingMetrics.qaSessionsHarvested,
        totalQuestions: this.qaHarvestingMetrics.totalQAQuestions,
        averageQuality: this.qaHarvestingMetrics.averageQAQuality,
        systems: ['universal', 'modern_chat']
      },
      sessions: this.getHarvestedQAData(),
      metrics: this.getQAHarvestingMetrics()
    };

    console.log(`📦 [Enhanced] Exported Q&A dataset with ${dataset.sessions.length} sessions for community LLM training`);
    return dataset;
  }
}

