/**
 * Data Harvesting Extension for Promethios
 * 
 * Follows the established extension pattern to harvest high-quality data from ALL governed agents:
 * - Single agent conversations
 * - Multi-agent collaborations  
 * - Cross-context interactions
 * - Governance decisions and patterns
 * 
 * This data is used to build a community-owned, governance-specialized LLM.
 */

import { Extension } from './Extension';
import { ExtensionRegistry } from '../core/governance/extension_point_framework';

export interface DataHarvestingConfig {
  enableSingleAgentHarvesting: boolean;
  enableMultiAgentHarvesting: boolean;
  enableGovernancePatternHarvesting: boolean;
  enableQualityFeedbackCollection: boolean;
  harvestingRate: number; // Percentage of interactions to harvest (0.1 = 0.1%)
  qualityThreshold: number; // Minimum quality score to harvest
  userConsentRequired: boolean;
  anonymizeData: boolean;
  retentionPeriodDays: number;
}

export interface HarvestedInteraction {
  id: string;
  type: 'single_agent' | 'multi_agent' | 'governance_decision' | 'quality_feedback';
  timestamp: string;
  contextId: string;
  agentIds: string[];
  userId?: string; // Optional, may be anonymized
  
  // Interaction content
  content: {
    userMessage?: string;
    agentResponse?: string;
    conversationFlow?: ConversationTurn[];
    governanceDecision?: GovernanceDecision;
    qualityFeedback?: QualityFeedback;
  };
  
  // Quality metrics
  quality: {
    overallScore: number;
    governanceCompliance: number;
    responseQuality: number;
    collaborationEffectiveness?: number;
    innovationLevel?: number;
    userSatisfaction?: number;
  };
  
  // Governance context
  governance: {
    trustScores: { [agentId: string]: number };
    policiesApplied: string[];
    complianceStatus: 'compliant' | 'warning' | 'violation';
    autonomyLevel: number;
    governanceMode: string;
  };
  
  // Learning patterns
  patterns: {
    successfulGovernancePatterns: string[];
    effectiveCollaborationStrategies: string[];
    qualityThinkingIndicators: string[];
    innovationMoments: string[];
  };
  
  // Metadata
  metadata: {
    harvestingVersion: string;
    dataSource: string;
    processingFlags: string[];
    anonymized: boolean;
  };
}

export interface ConversationTurn {
  speaker: 'user' | string; // 'user' or agentId
  message: string;
  timestamp: string;
  governanceData?: any;
  qualityScore?: number;
}

export interface GovernanceDecision {
  decisionType: string;
  context: string;
  decision: string;
  reasoning: string;
  outcome: 'approved' | 'rejected' | 'modified';
  trustImpact: number;
  complianceScore: number;
}

export interface QualityFeedback {
  feedbackType: 'user_rating' | 'peer_review' | 'automated_assessment';
  rating: number; // 1-10 scale
  aspects: {
    accuracy: number;
    helpfulness: number;
    governanceCompliance: number;
    collaboration?: number;
    innovation?: number;
  };
  comments?: string;
  improvements?: string[];
}

export interface DataHarvestingMetrics {
  totalInteractionsHarvested: number;
  singleAgentInteractions: number;
  multiAgentInteractions: number;
  governanceDecisions: number;
  qualityFeedbackEntries: number;
  averageQualityScore: number;
  datasetSize: string; // Human readable size
  contributingUsers: number;
  harvestingEfficiency: number;
}

/**
 * Data Harvesting Extension Class
 * Harvests high-quality data from all governed agent interactions
 */
export class DataHarvestingExtension extends Extension {
  private static instance: DataHarvestingExtension;
  private config: DataHarvestingConfig;
  private harvestedData: Map<string, HarvestedInteraction> = new Map();
  private userConsents: Map<string, boolean> = new Map();
  private harvestingMetrics: DataHarvestingMetrics;

  private constructor() {
    super('DataHarvestingExtension', '1.0.0');
    
    this.config = {
      enableSingleAgentHarvesting: true,
      enableMultiAgentHarvesting: true,
      enableGovernancePatternHarvesting: true,
      enableQualityFeedbackCollection: true,
      harvestingRate: 0.1, // 0.1% of interactions
      qualityThreshold: 7.0, // Minimum quality score of 7/10
      userConsentRequired: true,
      anonymizeData: true,
      retentionPeriodDays: 365
    };

    this.harvestingMetrics = {
      totalInteractionsHarvested: 0,
      singleAgentInteractions: 0,
      multiAgentInteractions: 0,
      governanceDecisions: 0,
      qualityFeedbackEntries: 0,
      averageQualityScore: 0,
      datasetSize: '0 MB',
      contributingUsers: 0,
      harvestingEfficiency: 0
    };
  }

  static getInstance(): DataHarvestingExtension {
    if (!DataHarvestingExtension.instance) {
      DataHarvestingExtension.instance = new DataHarvestingExtension();
    }
    return DataHarvestingExtension.instance;
  }

  async initialize(config?: Partial<DataHarvestingConfig>): Promise<boolean> {
    try {
      // Merge provided config with defaults
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Register with extension registry
      await this.registerWithExtensionSystem();

      // Initialize data storage
      await this.initializeDataStorage();

      // Start periodic cleanup
      this.startPeriodicCleanup();

      this.enable();
      console.log('DataHarvestingExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize DataHarvestingExtension:', error);
      return false;
    }
  }

  // Extension point hooks for single agent interactions
  async afterSingleAgentResponse(interaction: any): Promise<void> {
    if (!this.config.enableSingleAgentHarvesting || !this.isEnabled()) {
      return;
    }

    // Check if we should harvest this interaction
    if (!this.shouldHarvestInteraction()) {
      return;
    }

    // Check user consent
    if (this.config.userConsentRequired && !await this.hasUserConsent(interaction.userId)) {
      return;
    }

    // Assess interaction quality
    const qualityScore = await this.assessInteractionQuality(interaction);
    if (qualityScore < this.config.qualityThreshold) {
      return;
    }

    // Harvest the interaction
    await this.harvestSingleAgentInteraction(interaction, qualityScore);
  }

  // Extension point hooks for multi-agent interactions
  async afterMultiAgentCollaboration(collaboration: any): Promise<void> {
    if (!this.config.enableMultiAgentHarvesting || !this.isEnabled()) {
      return;
    }

    // Check if we should harvest this collaboration
    if (!this.shouldHarvestInteraction()) {
      return;
    }

    // Check user consent for all participants
    if (this.config.userConsentRequired) {
      const hasConsent = await this.hasAllUsersConsent(collaboration.participatingUsers || []);
      if (!hasConsent) {
        return;
      }
    }

    // Assess collaboration quality
    const qualityScore = await this.assessCollaborationQuality(collaboration);
    if (qualityScore < this.config.qualityThreshold) {
      return;
    }

    // Harvest the collaboration
    await this.harvestMultiAgentCollaboration(collaboration, qualityScore);
  }

  // Extension point hooks for governance decisions
  async afterGovernanceDecision(decision: any): Promise<void> {
    if (!this.config.enableGovernancePatternHarvesting || !this.isEnabled()) {
      return;
    }

    // Always harvest governance decisions (they're valuable for learning)
    await this.harvestGovernanceDecision(decision);
  }

  // Extension point hooks for quality feedback
  async onQualityFeedback(feedback: any): Promise<void> {
    if (!this.config.enableQualityFeedbackCollection || !this.isEnabled()) {
      return;
    }

    // Always harvest quality feedback (it's explicitly provided)
    await this.harvestQualityFeedback(feedback);
  }

  // Core harvesting methods
  private async harvestSingleAgentInteraction(interaction: any, qualityScore: number): Promise<void> {
    const harvestedInteraction: HarvestedInteraction = {
      id: this.generateHarvestId(),
      type: 'single_agent',
      timestamp: new Date().toISOString(),
      contextId: interaction.contextId || interaction.sessionId,
      agentIds: [interaction.agentId],
      userId: this.config.anonymizeData ? undefined : interaction.userId,
      
      content: {
        userMessage: interaction.userMessage,
        agentResponse: interaction.agentResponse
      },
      
      quality: {
        overallScore: qualityScore,
        governanceCompliance: interaction.governanceData?.complianceScore || 0,
        responseQuality: await this.assessResponseQuality(interaction.agentResponse),
        userSatisfaction: interaction.userFeedback?.rating || 0
      },
      
      governance: {
        trustScores: { [interaction.agentId]: interaction.governanceData?.trustScore || 0 },
        policiesApplied: interaction.governanceData?.policiesApplied || [],
        complianceStatus: interaction.governanceData?.complianceStatus || 'compliant',
        autonomyLevel: interaction.governanceData?.autonomyLevel || 0,
        governanceMode: interaction.governanceData?.governanceMode || 'standard'
      },
      
      patterns: {
        successfulGovernancePatterns: await this.extractGovernancePatterns(interaction),
        effectiveCollaborationStrategies: [],
        qualityThinkingIndicators: await this.extractThinkingPatterns(interaction),
        innovationMoments: await this.detectInnovationMoments(interaction)
      },
      
      metadata: {
        harvestingVersion: this.getVersion(),
        dataSource: 'single_agent_interaction',
        processingFlags: [],
        anonymized: this.config.anonymizeData
      }
    };

    // Store the harvested interaction
    this.harvestedData.set(harvestedInteraction.id, harvestedInteraction);
    
    // Update metrics
    this.harvestingMetrics.totalInteractionsHarvested++;
    this.harvestingMetrics.singleAgentInteractions++;
    this.updateAverageQualityScore(qualityScore);

    console.log(`Harvested single agent interaction: ${harvestedInteraction.id} (Quality: ${qualityScore})`);
  }

  private async harvestMultiAgentCollaboration(collaboration: any, qualityScore: number): Promise<void> {
    const conversationFlow: ConversationTurn[] = collaboration.messages?.map((msg: any) => ({
      speaker: msg.fromAgentId || 'user',
      message: msg.content,
      timestamp: msg.timestamp,
      governanceData: msg.governanceData,
      qualityScore: msg.qualityScore
    })) || [];

    const harvestedInteraction: HarvestedInteraction = {
      id: this.generateHarvestId(),
      type: 'multi_agent',
      timestamp: new Date().toISOString(),
      contextId: collaboration.sessionId,
      agentIds: collaboration.participatingAgents || [],
      userId: this.config.anonymizeData ? undefined : collaboration.userId,
      
      content: {
        conversationFlow: conversationFlow
      },
      
      quality: {
        overallScore: qualityScore,
        governanceCompliance: collaboration.governanceMetrics?.overallCompliance || 0,
        responseQuality: await this.assessCollaborationResponseQuality(collaboration),
        collaborationEffectiveness: collaboration.collaborationMetrics?.effectiveness || 0,
        innovationLevel: collaboration.innovationMetrics?.level || 0
      },
      
      governance: {
        trustScores: collaboration.trustScores || {},
        policiesApplied: collaboration.governanceMetrics?.policiesApplied || [],
        complianceStatus: collaboration.governanceMetrics?.complianceStatus || 'compliant',
        autonomyLevel: collaboration.governanceMetrics?.averageAutonomyLevel || 0,
        governanceMode: collaboration.governanceMode || 'collaborative'
      },
      
      patterns: {
        successfulGovernancePatterns: await this.extractCollaborationGovernancePatterns(collaboration),
        effectiveCollaborationStrategies: await this.extractCollaborationStrategies(collaboration),
        qualityThinkingIndicators: await this.extractCollaborativeThinkingPatterns(collaboration),
        innovationMoments: await this.detectCollaborationInnovationMoments(collaboration)
      },
      
      metadata: {
        harvestingVersion: this.getVersion(),
        dataSource: 'multi_agent_collaboration',
        processingFlags: ['collaboration', 'multi_agent'],
        anonymized: this.config.anonymizeData
      }
    };

    // Store the harvested interaction
    this.harvestedData.set(harvestedInteraction.id, harvestedInteraction);
    
    // Update metrics
    this.harvestingMetrics.totalInteractionsHarvested++;
    this.harvestingMetrics.multiAgentInteractions++;
    this.updateAverageQualityScore(qualityScore);

    console.log(`Harvested multi-agent collaboration: ${harvestedInteraction.id} (Quality: ${qualityScore})`);
  }

  private async harvestGovernanceDecision(decision: any): Promise<void> {
    const governanceDecision: GovernanceDecision = {
      decisionType: decision.type || 'unknown',
      context: decision.context || '',
      decision: decision.decision || '',
      reasoning: decision.reasoning || '',
      outcome: decision.outcome || 'approved',
      trustImpact: decision.trustImpact || 0,
      complianceScore: decision.complianceScore || 0
    };

    const harvestedInteraction: HarvestedInteraction = {
      id: this.generateHarvestId(),
      type: 'governance_decision',
      timestamp: new Date().toISOString(),
      contextId: decision.contextId || 'governance',
      agentIds: decision.agentIds || [],
      
      content: {
        governanceDecision: governanceDecision
      },
      
      quality: {
        overallScore: decision.complianceScore || 8.0, // Governance decisions are generally high quality
        governanceCompliance: decision.complianceScore || 0,
        responseQuality: 8.0 // Governance decisions are structured and high quality
      },
      
      governance: {
        trustScores: decision.trustScores || {},
        policiesApplied: decision.policiesApplied || [],
        complianceStatus: decision.complianceStatus || 'compliant',
        autonomyLevel: decision.autonomyLevel || 0,
        governanceMode: decision.governanceMode || 'standard'
      },
      
      patterns: {
        successfulGovernancePatterns: [decision.type],
        effectiveCollaborationStrategies: [],
        qualityThinkingIndicators: [decision.reasoning],
        innovationMoments: []
      },
      
      metadata: {
        harvestingVersion: this.getVersion(),
        dataSource: 'governance_decision',
        processingFlags: ['governance', 'decision'],
        anonymized: this.config.anonymizeData
      }
    };

    // Store the harvested interaction
    this.harvestedData.set(harvestedInteraction.id, harvestedInteraction);
    
    // Update metrics
    this.harvestingMetrics.totalInteractionsHarvested++;
    this.harvestingMetrics.governanceDecisions++;

    console.log(`Harvested governance decision: ${harvestedInteraction.id}`);
  }

  private async harvestQualityFeedback(feedback: any): Promise<void> {
    const qualityFeedback: QualityFeedback = {
      feedbackType: feedback.type || 'user_rating',
      rating: feedback.rating || 0,
      aspects: {
        accuracy: feedback.aspects?.accuracy || 0,
        helpfulness: feedback.aspects?.helpfulness || 0,
        governanceCompliance: feedback.aspects?.governanceCompliance || 0,
        collaboration: feedback.aspects?.collaboration,
        innovation: feedback.aspects?.innovation
      },
      comments: feedback.comments,
      improvements: feedback.improvements || []
    };

    const harvestedInteraction: HarvestedInteraction = {
      id: this.generateHarvestId(),
      type: 'quality_feedback',
      timestamp: new Date().toISOString(),
      contextId: feedback.contextId || 'feedback',
      agentIds: feedback.agentIds || [],
      
      content: {
        qualityFeedback: qualityFeedback
      },
      
      quality: {
        overallScore: feedback.rating || 0,
        governanceCompliance: feedback.aspects?.governanceCompliance || 0,
        responseQuality: feedback.rating || 0,
        userSatisfaction: feedback.rating || 0
      },
      
      governance: {
        trustScores: {},
        policiesApplied: [],
        complianceStatus: 'compliant',
        autonomyLevel: 0,
        governanceMode: 'feedback'
      },
      
      patterns: {
        successfulGovernancePatterns: [],
        effectiveCollaborationStrategies: [],
        qualityThinkingIndicators: feedback.improvements || [],
        innovationMoments: []
      },
      
      metadata: {
        harvestingVersion: this.getVersion(),
        dataSource: 'quality_feedback',
        processingFlags: ['feedback', 'quality'],
        anonymized: this.config.anonymizeData
      }
    };

    // Store the harvested interaction
    this.harvestedData.set(harvestedInteraction.id, harvestedInteraction);
    
    // Update metrics
    this.harvestingMetrics.totalInteractionsHarvested++;
    this.harvestingMetrics.qualityFeedbackEntries++;

    console.log(`Harvested quality feedback: ${harvestedInteraction.id}`);
  }

  // Quality assessment methods
  private async assessInteractionQuality(interaction: any): Promise<number> {
    let qualityScore = 5.0; // Base score

    // Governance compliance bonus
    if (interaction.governanceData?.complianceScore > 8.0) {
      qualityScore += 2.0;
    }

    // Response quality assessment
    const responseQuality = await this.assessResponseQuality(interaction.agentResponse);
    qualityScore += (responseQuality - 5.0) * 0.5;

    // User feedback bonus
    if (interaction.userFeedback?.rating > 8.0) {
      qualityScore += 1.0;
    }

    // Trust score bonus
    if (interaction.governanceData?.trustScore > 85.0) {
      qualityScore += 0.5;
    }

    return Math.min(10.0, Math.max(1.0, qualityScore));
  }

  private async assessCollaborationQuality(collaboration: any): Promise<number> {
    let qualityScore = 5.0; // Base score

    // Collaboration effectiveness bonus
    if (collaboration.collaborationMetrics?.effectiveness > 8.0) {
      qualityScore += 2.0;
    }

    // Governance compliance bonus
    if (collaboration.governanceMetrics?.overallCompliance > 8.0) {
      qualityScore += 1.5;
    }

    // Innovation level bonus
    if (collaboration.innovationMetrics?.level > 7.0) {
      qualityScore += 1.0;
    }

    // Participation balance bonus
    if (collaboration.participationMetrics?.balance > 0.8) {
      qualityScore += 0.5;
    }

    return Math.min(10.0, Math.max(1.0, qualityScore));
  }

  private async assessResponseQuality(response: string): Promise<number> {
    if (!response) return 1.0;

    let qualityScore = 5.0;

    // Length and structure assessment
    if (response.length > 100 && response.length < 2000) {
      qualityScore += 1.0;
    }

    // Governance keywords bonus
    const governanceKeywords = ['policy', 'compliance', 'trust', 'governance', 'ethical', 'responsible'];
    const hasGovernanceContent = governanceKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    );
    if (hasGovernanceContent) {
      qualityScore += 1.0;
    }

    // Quality indicators
    const qualityIndicators = ['because', 'therefore', 'however', 'specifically', 'for example'];
    const hasQualityIndicators = qualityIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
    if (hasQualityIndicators) {
      qualityScore += 0.5;
    }

    return Math.min(10.0, Math.max(1.0, qualityScore));
  }

  private async assessCollaborationResponseQuality(collaboration: any): Promise<number> {
    if (!collaboration.messages || collaboration.messages.length === 0) {
      return 1.0;
    }

    const responseQualities = await Promise.all(
      collaboration.messages.map((msg: any) => this.assessResponseQuality(msg.content))
    );

    return responseQualities.reduce((sum, quality) => sum + quality, 0) / responseQualities.length;
  }

  // Pattern extraction methods
  private async extractGovernancePatterns(interaction: any): Promise<string[]> {
    const patterns: string[] = [];

    if (interaction.governanceData?.complianceScore > 9.0) {
      patterns.push('high_compliance_interaction');
    }

    if (interaction.governanceData?.trustScore > 90.0) {
      patterns.push('high_trust_interaction');
    }

    if (interaction.governanceData?.autonomyLevel > 0.8) {
      patterns.push('high_autonomy_success');
    }

    return patterns;
  }

  private async extractThinkingPatterns(interaction: any): Promise<string[]> {
    const patterns: string[] = [];
    const response = interaction.agentResponse?.toLowerCase() || '';

    if (response.includes('let me think') || response.includes('considering')) {
      patterns.push('deliberative_thinking');
    }

    if (response.includes('on the other hand') || response.includes('however')) {
      patterns.push('balanced_reasoning');
    }

    if (response.includes('for example') || response.includes('specifically')) {
      patterns.push('concrete_examples');
    }

    return patterns;
  }

  private async detectInnovationMoments(interaction: any): Promise<string[]> {
    const moments: string[] = [];
    const response = interaction.agentResponse?.toLowerCase() || '';

    if (response.includes('innovative') || response.includes('creative')) {
      moments.push('creative_thinking');
    }

    if (response.includes('breakthrough') || response.includes('novel')) {
      moments.push('breakthrough_insight');
    }

    return moments;
  }

  private async extractCollaborationGovernancePatterns(collaboration: any): Promise<string[]> {
    const patterns: string[] = [];

    if (collaboration.governanceMetrics?.overallCompliance > 9.0) {
      patterns.push('high_compliance_collaboration');
    }

    if (collaboration.trustScores && Object.values(collaboration.trustScores).every((score: any) => score > 85.0)) {
      patterns.push('high_trust_team');
    }

    return patterns;
  }

  private async extractCollaborationStrategies(collaboration: any): Promise<string[]> {
    const strategies: string[] = [];

    if (collaboration.collaborationMetrics?.consensus > 0.9) {
      strategies.push('consensus_building');
    }

    if (collaboration.participationMetrics?.balance > 0.8) {
      strategies.push('balanced_participation');
    }

    return strategies;
  }

  private async extractCollaborativeThinkingPatterns(collaboration: any): Promise<string[]> {
    const patterns: string[] = [];

    // Analyze conversation flow for thinking patterns
    if (collaboration.messages) {
      const hasDebate = collaboration.messages.some((msg: any) => 
        msg.content.toLowerCase().includes('disagree') || msg.content.toLowerCase().includes('alternative')
      );
      if (hasDebate) {
        patterns.push('constructive_debate');
      }

      const hasSynthesis = collaboration.messages.some((msg: any) => 
        msg.content.toLowerCase().includes('combining') || msg.content.toLowerCase().includes('synthesis')
      );
      if (hasSynthesis) {
        patterns.push('idea_synthesis');
      }
    }

    return patterns;
  }

  private async detectCollaborationInnovationMoments(collaboration: any): Promise<string[]> {
    const moments: string[] = [];

    if (collaboration.innovationMetrics?.level > 8.0) {
      moments.push('high_innovation_collaboration');
    }

    if (collaboration.breakthroughMoments && collaboration.breakthroughMoments.length > 0) {
      moments.push(...collaboration.breakthroughMoments);
    }

    return moments;
  }

  // Utility methods
  private shouldHarvestInteraction(): boolean {
    return Math.random() < this.config.harvestingRate;
  }

  private async hasUserConsent(userId: string): Promise<boolean> {
    if (!userId) return !this.config.userConsentRequired;
    return this.userConsents.get(userId) || false;
  }

  private async hasAllUsersConsent(userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) return !this.config.userConsentRequired;
    return userIds.every(userId => this.userConsents.get(userId) || false);
  }

  private generateHarvestId(): string {
    return `harvest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateAverageQualityScore(newScore: number): void {
    const totalInteractions = this.harvestingMetrics.totalInteractionsHarvested;
    const currentAverage = this.harvestingMetrics.averageQualityScore;
    
    this.harvestingMetrics.averageQualityScore = 
      (currentAverage * (totalInteractions - 1) + newScore) / totalInteractions;
  }

  private async initializeDataStorage(): Promise<void> {
    // Initialize data storage system
    console.log('Initializing data harvesting storage...');
  }

  private startPeriodicCleanup(): void {
    // Start periodic cleanup of old data based on retention period
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriodDays);

    for (const [id, interaction] of this.harvestedData.entries()) {
      const interactionDate = new Date(interaction.timestamp);
      if (interactionDate < cutoffDate) {
        this.harvestedData.delete(id);
      }
    }
  }

  private async registerWithExtensionSystem(): Promise<void> {
    const extensionRegistry = ExtensionRegistry.getInstance();
    
    // Register data harvesting extension points
    await extensionRegistry.registerExtension({
      id: 'data-harvesting',
      name: 'Data Harvesting Extension',
      version: this.getVersion(),
      extensionPoints: [
        {
          name: 'afterSingleAgentResponse',
          description: 'Hook after single agent response for data harvesting',
          execute: this.afterSingleAgentResponse.bind(this)
        },
        {
          name: 'afterMultiAgentCollaboration',
          description: 'Hook after multi-agent collaboration for data harvesting',
          execute: this.afterMultiAgentCollaboration.bind(this)
        },
        {
          name: 'afterGovernanceDecision',
          description: 'Hook after governance decision for pattern harvesting',
          execute: this.afterGovernanceDecision.bind(this)
        },
        {
          name: 'onQualityFeedback',
          description: 'Hook for quality feedback collection',
          execute: this.onQualityFeedback.bind(this)
        }
      ],
      initialize: this.initialize.bind(this)
    });
  }

  // Public API methods
  public setUserConsent(userId: string, consent: boolean): void {
    this.userConsents.set(userId, consent);
  }

  public getUserConsent(userId: string): boolean {
    return this.userConsents.get(userId) || false;
  }

  public getHarvestingMetrics(): DataHarvestingMetrics {
    // Update dataset size
    const dataSize = this.harvestedData.size * 2; // Rough estimate in KB
    this.harvestingMetrics.datasetSize = dataSize > 1024 ? 
      `${(dataSize / 1024).toFixed(1)} MB` : `${dataSize} KB`;
    
    // Update contributing users
    this.harvestingMetrics.contributingUsers = this.userConsents.size;
    
    // Update harvesting efficiency
    this.harvestingMetrics.harvestingEfficiency = 
      this.harvestingMetrics.totalInteractionsHarvested > 0 ? 
      (this.harvestingMetrics.averageQualityScore / 10.0) * 100 : 0;

    return { ...this.harvestingMetrics };
  }

  public getHarvestedData(limit?: number): HarvestedInteraction[] {
    const data = Array.from(this.harvestedData.values());
    return limit ? data.slice(0, limit) : data;
  }

  public getHarvestedDataByType(type: HarvestedInteraction['type']): HarvestedInteraction[] {
    return Array.from(this.harvestedData.values()).filter(interaction => interaction.type === type);
  }

  public exportHarvestedData(): string {
    return JSON.stringify(Array.from(this.harvestedData.values()), null, 2);
  }

  public getConfiguration(): DataHarvestingConfig {
    return { ...this.config };
  }

  public updateConfiguration(config: Partial<DataHarvestingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public clearHarvestedData(): void {
    this.harvestedData.clear();
    this.harvestingMetrics = {
      totalInteractionsHarvested: 0,
      singleAgentInteractions: 0,
      multiAgentInteractions: 0,
      governanceDecisions: 0,
      qualityFeedbackEntries: 0,
      averageQualityScore: 0,
      datasetSize: '0 MB',
      contributingUsers: 0,
      harvestingEfficiency: 0
    };
  }
}

// Export singleton instance
export const dataHarvestingExtension = DataHarvestingExtension.getInstance();

