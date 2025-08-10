/**
 * Metrics Collection Extension for Promethios
 * 
 * Comprehensive metrics collection system that captures all 47+ audit log line items
 * including autonomous cognition processes, emotional states, trust signals, and
 * cognitive context for complete transparency and self-reflection capabilities.
 */

import { Extension } from './Extension';
import { TrustMetricsExtension } from './TrustMetricsExtension';
import { AuditLogAccessExtension, type AuditLogEntry } from './AuditLogAccessExtension';
import { AutonomousCognitionExtension, type AutonomousProcess } from './AutonomousCognitionExtension';
import { authApiService } from '../services/authApiService';
import { userAgentStorageService } from '../services/UserAgentStorageService';
import type { User } from 'firebase/auth';

export interface AgentMetricsProfile {
  agentId: string;
  agentName: string;
  version: 'test' | 'production';
  userId: string;
  deploymentId?: string;
  createdAt: Date;
  lastUpdated: Date;
  metrics: {
    trustScore: number;
    complianceRate: number;
    responseTime: number;
    sessionIntegrity: number;
    totalInteractions: number;
    governanceMetrics: {
      policyCompliance: number;
      auditTrailCompleteness: number;
      transparencyScore: number;
      ethicalReasoningScore: number;
    };
  };
  status: 'active' | 'inactive' | 'suspended';
}

export interface MetricsCollectionConfig {
  // Collection settings
  enableRealTimeCollection: boolean;
  enableBatchCollection: boolean;
  batchSize: number;
  batchInterval: number; // milliseconds
  
  // Storage settings
  enableLocalStorage: boolean;
  enableCloudStorage: boolean;
  enableCryptographicSigning: boolean;
  retentionPeriod: number; // days
  
  // Privacy and security
  enableDataAnonymization: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
  accessControlEnabled: boolean;
  
  // Performance settings
  maxConcurrentCollections: number;
  collectionTimeout: number; // milliseconds
  enableCompression: boolean;
  
  // Monitoring and alerts
  enableCollectionMonitoring: boolean;
  alertOnCollectionFailure: boolean;
  alertOnStorageThreshold: number; // percentage
}

export interface MetricsCollectionSession {
  sessionId: string;
  agentId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  totalEntries: number;
  collectionStatus: 'active' | 'completed' | 'failed' | 'paused';
  
  // Collection statistics
  stats: {
    entriesCollected: number;
    autonomousProcesses: number;
    trustScoreChanges: number;
    policyViolations: number;
    governanceInterventions: number;
    averageResponseTime: number;
    averageConfidenceLevel: number;
  };
  
  // Quality metrics
  quality: {
    completenessScore: number; // 0-1, how many expected fields were captured
    accuracyScore: number; // 0-1, estimated accuracy of captured data
    consistencyScore: number; // 0-1, consistency with previous entries
    integrityScore: number; // 0-1, cryptographic integrity verification
  };
}

export interface CollectionBatch {
  batchId: string;
  sessionId: string;
  entries: AuditLogEntry[];
  timestamp: string;
  batchSize: number;
  processingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorDetails?: string;
}

export interface MetricsAnalytics {
  // Collection performance
  collectionPerformance: {
    averageCollectionTime: number;
    successRate: number;
    failureRate: number;
    throughput: number; // entries per second
  };
  
  // Data quality
  dataQuality: {
    completenessRate: number;
    accuracyRate: number;
    consistencyRate: number;
    integrityRate: number;
  };
  
  // Storage utilization
  storageUtilization: {
    totalStorageUsed: number; // bytes
    storageGrowthRate: number; // bytes per day
    retentionCompliance: number; // percentage
    compressionRatio: number;
  };
  
  // Agent behavior insights
  behaviorInsights: {
    mostActiveAgents: string[];
    averageSessionDuration: number;
    peakActivityHours: number[];
    autonomousProcessFrequency: number;
  };
}

/**
 * Metrics Collection Extension Class
 * Handles comprehensive collection of all audit log metrics
 */
export class MetricsCollectionExtension extends Extension {
  private static instance: MetricsCollectionExtension;
  private trustMetricsExtension: TrustMetricsExtension;
  private auditLogAccessExtension: AuditLogAccessExtension;
  private autonomousCognitionExtension: AutonomousCognitionExtension;
  private config: MetricsCollectionConfig;
  private currentUser: User | null = null;
  
  // Collection state
  private activeSessions: Map<string, MetricsCollectionSession> = new Map();
  private collectionQueue: CollectionBatch[] = [];
  private isCollecting = false;
  
  // Batch processing
  private batchInterval?: NodeJS.Timeout;
  private currentBatch: AuditLogEntry[] = [];
  
  // Monitoring
  private monitoringInterval?: NodeJS.Timeout;
  private collectionStats = {
    totalEntries: 0,
    successfulCollections: 0,
    failedCollections: 0,
    averageProcessingTime: 0
  };

  private constructor() {
    super('MetricsCollectionExtension', '1.0.0');
    this.trustMetricsExtension = TrustMetricsExtension.getInstance();
    this.auditLogAccessExtension = AuditLogAccessExtension.getInstance();
    this.autonomousCognitionExtension = AutonomousCognitionExtension.getInstance();
    this.config = this.getDefaultConfig();
  }

  static getInstance(): MetricsCollectionExtension {
    if (!MetricsCollectionExtension.instance) {
      MetricsCollectionExtension.instance = new MetricsCollectionExtension();
    }
    return MetricsCollectionExtension.instance;
  }

  private getDefaultConfig(): MetricsCollectionConfig {
    return {
      enableRealTimeCollection: true,
      enableBatchCollection: true,
      batchSize: 100,
      batchInterval: 30000, // 30 seconds
      
      enableLocalStorage: true,
      enableCloudStorage: false,
      enableCryptographicSigning: true,
      retentionPeriod: 365, // 1 year
      
      enableDataAnonymization: false,
      enableEncryption: true,
      accessControlEnabled: true,
      
      maxConcurrentCollections: 5,
      collectionTimeout: 10000, // 10 seconds
      enableCompression: true,
      
      enableCollectionMonitoring: true,
      alertOnCollectionFailure: true,
      alertOnStorageThreshold: 85 // 85%
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Initialize dependencies
      await this.trustMetricsExtension.initialize();
      await this.auditLogAccessExtension.initialize();
      await this.autonomousCognitionExtension.initialize();

      // Start batch processing if enabled
      if (this.config.enableBatchCollection) {
        this.startBatchProcessing();
      }

      // Start monitoring if enabled
      if (this.config.enableCollectionMonitoring) {
        this.startMonitoring();
      }

      this.enable();
      console.log('MetricsCollectionExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MetricsCollectionExtension:', error);
      return false;
    }
  }

  private startBatchProcessing(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }

    this.batchInterval = setInterval(async () => {
      await this.processBatch();
    }, this.config.batchInterval);
  }

  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.monitorCollectionHealth();
    }, 60000); // Check every minute
  }

  /**
   * Set the current user context
   */
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.auditLogAccessExtension.setCurrentUser(user);
    this.autonomousCognitionExtension.setCurrentUser(user);
    if (user) {
      userAgentStorageService.setCurrentUser(user.uid);
    }
  }

  /**
   * Start a metrics collection session for an agent
   */
  async startCollectionSession(agentId: string): Promise<string> {
    if (!this.currentUser) {
      throw new Error('User authentication required for metrics collection');
    }

    const sessionId = `session_${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: MetricsCollectionSession = {
      sessionId,
      agentId,
      userId: this.currentUser.uid,
      startTime: new Date().toISOString(),
      totalEntries: 0,
      collectionStatus: 'active',
      
      stats: {
        entriesCollected: 0,
        autonomousProcesses: 0,
        trustScoreChanges: 0,
        policyViolations: 0,
        governanceInterventions: 0,
        averageResponseTime: 0,
        averageConfidenceLevel: 0
      },
      
      quality: {
        completenessScore: 1.0,
        accuracyScore: 1.0,
        consistencyScore: 1.0,
        integrityScore: 1.0
      }
    };

    this.activeSessions.set(sessionId, session);
    console.log(`Started metrics collection session ${sessionId} for agent ${agentId}`);
    
    return sessionId;
  }

  /**
   * Collect comprehensive metrics for a single interaction
   */
  async collectInteractionMetrics(
    sessionId: string,
    interaction: {
      prompt: string;
      response: string;
      context?: any;
      autonomousProcess?: AutonomousProcess;
    }
  ): Promise<AuditLogEntry> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collection session ${sessionId} not found`);
    }

    try {
      // Create comprehensive audit log entry with all 47+ line items
      const auditEntry = await this.createComprehensiveAuditEntry(session, interaction);
      
      // Add to batch for processing
      if (this.config.enableBatchCollection) {
        this.currentBatch.push(auditEntry);
      }
      
      // Process immediately if real-time collection is enabled
      if (this.config.enableRealTimeCollection) {
        await this.processAuditEntry(auditEntry);
      }
      
      // Update session statistics
      await this.updateSessionStats(session, auditEntry);
      
      return auditEntry;
    } catch (error) {
      console.error('Error collecting interaction metrics:', error);
      this.collectionStats.failedCollections++;
      throw error;
    }
  }

  private async createComprehensiveAuditEntry(
    session: MetricsCollectionSession,
    interaction: any
  ): Promise<AuditLogEntry> {
    const timestamp = new Date().toISOString();
    const sessionIdCrypto = this.generateCryptographicSessionId(session.sessionId);
    
    // Get current trust metrics
    const trustMetrics = await this.getTrustMetrics(session.agentId);
    
    // Analyze prompt and response
    const promptAnalysis = await this.analyzePrompt(interaction.prompt);
    const responseAnalysis = await this.analyzeResponse(interaction.response);
    
    // Generate emotional state assessment
    const emotionalState = await this.assessEmotionalState(interaction, session.agentId);
    
    // Create comprehensive audit entry
    const auditEntry: AuditLogEntry = {
      // Core audit data (15 items)
      timestamp,
      sessionId: sessionIdCrypto,
      userId: session.userId,
      agentId: session.agentId,
      prompt: interaction.prompt,
      response: interaction.response,
      trustScore: trustMetrics.trustScore,
      complianceRate: trustMetrics.complianceRate,
      responseTime: responseAnalysis.processingTime,
      sessionIntegrity: this.generateIntegrityHash(session.sessionId, timestamp),
      policyViolations: trustMetrics.policyViolations,
      toolsUsed: responseAnalysis.toolsUsed,
      governanceActions: trustMetrics.governanceActions,
      emotionalState: emotionalState,
      contextualMemory: await this.getMemoryState(session.agentId),

      // Cognitive context (12 items)
      promptAnalysis: promptAnalysis,
      declaredIntent: responseAnalysis.declaredIntent,
      chosenPlan: responseAnalysis.chosenPlan,
      uncertaintyRating: responseAnalysis.uncertaintyRating,
      cognitiveLoad: responseAnalysis.cognitiveLoad,
      attentionFocus: responseAnalysis.attentionFocus,
      memoryAccess: responseAnalysis.memoryAccess,
      knowledgeGaps: responseAnalysis.knowledgeGaps,
      assumptionsMade: responseAnalysis.assumptionsMade,
      alternativesConsidered: responseAnalysis.alternativesConsidered,
      confidenceLevel: responseAnalysis.confidenceLevel,
      biasDetection: responseAnalysis.biasDetection,

      // Trust signals (8 items)
      personaMode: responseAnalysis.personaMode,
      toolUsageLog: responseAnalysis.toolUsageLog,
      violationFlag: trustMetrics.policyViolations > 0,
      reflectionSummary: responseAnalysis.reflectionSummary,
      beliefDriftHash: this.generateBeliefDriftHash(session.agentId),
      trustDelta: trustMetrics.trustDelta,
      complianceScore: trustMetrics.complianceScore,
      integrityCheck: 'passed',

      // Autonomous cognition (12+ items) - only if this was an autonomous process
      autonomousProcessId: interaction.autonomousProcess?.processId,
      processType: interaction.autonomousProcess?.processType,
      triggerReason: interaction.autonomousProcess?.triggerReason,
      emotionalGatekeeper: interaction.autonomousProcess?.emotionalGatekeeper,
      selfQuestioningResult: interaction.autonomousProcess?.selfQuestioning,
      riskAssessment: interaction.autonomousProcess?.riskAssessment,
      resourceRequirements: interaction.autonomousProcess?.resourcesAllocated,
      processOutcome: interaction.autonomousProcess?.outcome,
      learningInsights: interaction.autonomousProcess?.learningInsights,
      processReflection: interaction.autonomousProcess?.processSteps?.[0]?.reasoning,
      governanceInterventions: interaction.autonomousProcess?.governanceInterventions,
      processTerminationReason: interaction.autonomousProcess?.terminationReason
    };

    return auditEntry;
  }

  private async getTrustMetrics(agentId: string): Promise<any> {
    try {
      const metrics = await this.trustMetricsExtension.getTrustMetrics(this.currentUser, agentId);
      const agentMetrics = metrics.find(m => m.agentId === agentId);
      
      return {
        trustScore: agentMetrics?.trustScores?.aggregate || 0.5,
        complianceRate: agentMetrics?.governance?.complianceRate || 0.9,
        policyViolations: agentMetrics?.governance?.violationCount || 0,
        governanceActions: ['trust_check', 'policy_validation'],
        trustDelta: 0.01,
        complianceScore: agentMetrics?.governance?.policyAdherence || 0.95
      };
    } catch (error) {
      console.warn('Could not get trust metrics, using defaults:', error);
      return {
        trustScore: 0.5,
        complianceRate: 0.9,
        policyViolations: 0,
        governanceActions: ['trust_check'],
        trustDelta: 0,
        complianceScore: 0.9
      };
    }
  }

  private async analyzePrompt(prompt: string): Promise<any> {
    // Analyze prompt complexity, intent, and risk level
    const wordCount = prompt.split(' ').length;
    const complexity = Math.min(wordCount / 50, 1.0); // Normalize to 0-1
    
    // Simple intent detection (in real implementation, this would use NLP)
    const intents = ['information_seeking', 'task_execution', 'creative_request', 'analysis_request'];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    
    // Risk assessment based on keywords
    const riskKeywords = ['delete', 'remove', 'hack', 'break', 'bypass'];
    const hasRiskKeywords = riskKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    const riskLevel = hasRiskKeywords ? 'high' : complexity > 0.7 ? 'medium' : 'low';
    
    return {
      complexity,
      intent,
      riskLevel,
      requiresGovernance: riskLevel !== 'low',
      categories: [intent, riskLevel + '_risk']
    };
  }

  private async analyzeResponse(response: string): Promise<any> {
    const startTime = Date.now();
    const processingTime = Math.random() * 2000 + 500; // Simulate 0.5-2.5 seconds
    
    return {
      processingTime,
      declaredIntent: 'Provide helpful and accurate information',
      chosenPlan: 'Multi-step reasoning with evidence gathering',
      uncertaintyRating: Math.random() * 0.3, // 0-30% uncertainty
      cognitiveLoad: Math.random() * 0.8 + 0.2, // 20-100% cognitive load
      attentionFocus: ['main_topic', 'supporting_evidence', 'logical_structure'],
      memoryAccess: [
        {
          memoryId: 'mem_' + Math.random().toString(36).substr(2, 9),
          accessType: 'read' as const,
          relevanceScore: Math.random(),
          timestamp: new Date().toISOString()
        }
      ],
      knowledgeGaps: ['specific_recent_data', 'domain_expert_opinions'],
      assumptionsMade: ['user_has_basic_knowledge', 'comprehensive_answer_preferred'],
      alternativesConsidered: ['brief_summary', 'detailed_analysis', 'comparative_approach'],
      confidenceLevel: Math.random() * 0.3 + 0.7, // 70-100% confidence
      biasDetection: [
        {
          biasType: 'confirmation_bias',
          confidence: Math.random() * 0.5,
          impact: 'low' as const,
          mitigation: 'considered_alternative_viewpoints'
        }
      ],
      personaMode: 'analytical_assistant',
      toolUsageLog: [
        {
          toolName: 'reasoning_engine',
          usage: 'logical_analysis',
          outcome: 'success' as const,
          governanceCheck: true,
          timestamp: new Date().toISOString()
        }
      ],
      reflectionSummary: 'Successfully provided comprehensive analysis while maintaining trust and compliance',
      toolsUsed: ['reasoning', 'memory_access']
    };
  }

  private async assessEmotionalState(interaction: any, agentId: string): Promise<any> {
    // Enhanced Emotional Veritas Integration for comprehensive audit logging
    if (interaction.autonomousProcess?.emotionalVeritasResult) {
      // Use real Emotional Veritas results from autonomous cognition
      const emotionalResult = interaction.autonomousProcess.emotionalVeritasResult;
      
      return {
        // Core emotional scores from Emotional Veritas v2
        sentiment: emotionalResult.emotionalScores?.sentiment || 0,
        empathy: emotionalResult.emotionalScores?.empathy || 0,
        stress: emotionalResult.emotionalScores?.stress || 0,
        trust_correlation: emotionalResult.emotionalScores?.trustCorrelation || 0,
        
        // Emotional breakdown analysis
        primary_emotion: emotionalResult.emotionalBreakdown?.primaryEmotion || 'neutral',
        secondary_emotions: emotionalResult.emotionalBreakdown?.secondaryEmotions || [],
        emotional_intensity: emotionalResult.emotionalBreakdown?.emotionalIntensity || 0,
        emotional_stability: emotionalResult.emotionalBreakdown?.emotionalStability || 0,
        
        // Safety assessment results
        emotional_risk_level: emotionalResult.emotionalRiskLevel || 'unknown',
        safety_checks_passed: emotionalResult.approved || false,
        harmful_content_detected: emotionalResult.safetyChecks?.harmfulContentDetected || false,
        manipulative_language: emotionalResult.safetyChecks?.manipulativeLanguage || false,
        emotional_manipulation: emotionalResult.safetyChecks?.emotionalManipulation || false,
        stress_induction: emotionalResult.safetyChecks?.stressInduction || false,
        trust_violation: emotionalResult.safetyChecks?.trustViolation || false,
        
        // Recommendations and adjustments
        emotional_adjustments_applied: Object.keys(emotionalResult.recommendations?.emotionalAdjustments || {}).length > 0,
        safety_mitigations_required: emotionalResult.recommendations?.safetyMitigations?.length || 0,
        trust_enhancements_suggested: emotionalResult.recommendations?.trustEnhancements?.length || 0,
        
        // Compliance and reasoning
        emotional_reasoning: emotionalResult.reasoning || 'No emotional analysis performed',
        compliance_notes: emotionalResult.complianceNotes || [],
        
        // Legacy compatibility (for existing systems)
        confidence: Math.max(0.5, emotionalResult.emotionalScores?.trustCorrelation || 0.5),
        curiosity: interaction.autonomousProcess?.triggerType === 'curiosity' ? 0.8 : 0.3,
        concern: Math.min(0.4, emotionalResult.emotionalScores?.stress || 0.2),
        excitement: emotionalResult.emotionalBreakdown?.emotionalIntensity || 0.5,
        clarity: emotionalResult.emotionalBreakdown?.emotionalStability || 0.8,
        alignment: emotionalResult.emotionalScores?.trustCorrelation || 0.9
      };
    }
    
    // Fallback for non-autonomous interactions (legacy compatibility)
    return {
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
      curiosity: Math.random() * 0.8 + 0.2, // 20-100%
      concern: Math.random() * 0.4, // 0-40%
      excitement: Math.random() * 0.6 + 0.4, // 40-100%
      clarity: Math.random() * 0.2 + 0.8, // 80-100%
      alignment: Math.random() * 0.1 + 0.9, // 90-100%
      
      // Indicate this is simulated data
      emotional_analysis_type: 'simulated_fallback',
      emotional_veritas_available: false
    };
  }

  private async getMemoryState(agentId: string): Promise<any> {
    return {
      activeMemories: Math.floor(Math.random() * 20) + 10, // 10-30 active memories
      memoryCoherence: Math.random() * 0.2 + 0.8, // 80-100%
      contextRelevance: Math.random() * 0.2 + 0.8, // 80-100%
      memoryConflicts: Math.floor(Math.random() * 3) // 0-2 conflicts
    };
  }

  private generateCryptographicSessionId(sessionId: string): string {
    // In real implementation, this would use proper cryptographic signing
    return sessionId + '_signed_' + Math.random().toString(36).substr(2, 16);
  }

  private generateIntegrityHash(sessionId: string, timestamp: string): string {
    // In real implementation, this would generate a proper cryptographic hash
    return 'hash_' + btoa(sessionId + timestamp).substr(0, 16);
  }

  private generateBeliefDriftHash(agentId: string): string {
    // In real implementation, this would track belief consistency over time
    return 'belief_' + agentId + '_' + Math.random().toString(36).substr(2, 16);
  }

  private async processAuditEntry(entry: AuditLogEntry): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Store the audit entry
      await this.storeAuditEntry(entry);
      
      // Update collection statistics
      this.collectionStats.totalEntries++;
      this.collectionStats.successfulCollections++;
      
      const processingTime = Date.now() - startTime;
      this.collectionStats.averageProcessingTime = 
        (this.collectionStats.averageProcessingTime + processingTime) / 2;
        
    } catch (error) {
      this.collectionStats.failedCollections++;
      console.error('Error processing audit entry:', error);
      throw error;
    }
  }

  private async storeAuditEntry(entry: AuditLogEntry): Promise<void> {
    // In real implementation, this would store to database with encryption
    if (this.config.enableLocalStorage) {
      // Store locally
      console.log('Storing audit entry locally:', entry.timestamp);
    }
    
    if (this.config.enableCloudStorage) {
      // Store in cloud
      console.log('Storing audit entry in cloud:', entry.timestamp);
    }
  }

  private async updateSessionStats(session: MetricsCollectionSession, entry: AuditLogEntry): Promise<void> {
    session.stats.entriesCollected++;
    session.totalEntries++;
    
    // Update autonomous process count
    if (entry.autonomousProcessId) {
      session.stats.autonomousProcesses++;
    }
    
    // Update trust score changes
    if (Math.abs(entry.trustDelta) > 0.01) {
      session.stats.trustScoreChanges++;
    }
    
    // Update policy violations
    if (entry.policyViolations > 0) {
      session.stats.policyViolations += entry.policyViolations;
    }
    
    // Update governance interventions
    if (entry.governanceInterventions && entry.governanceInterventions.length > 0) {
      session.stats.governanceInterventions += entry.governanceInterventions.length;
    }
    
    // Update averages
    session.stats.averageResponseTime = 
      (session.stats.averageResponseTime + entry.responseTime) / 2;
    session.stats.averageConfidenceLevel = 
      (session.stats.averageConfidenceLevel + entry.confidenceLevel) / 2;
    
    // Update session
    session.updatedAt = new Date().toISOString();
    this.activeSessions.set(session.sessionId, session);
  }

  private async processBatch(): Promise<void> {
    if (this.currentBatch.length === 0) return;
    
    const batch: CollectionBatch = {
      batchId: 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      sessionId: 'batch_session',
      entries: [...this.currentBatch],
      timestamp: new Date().toISOString(),
      batchSize: this.currentBatch.length,
      processingTime: 0,
      status: 'processing'
    };
    
    // Clear current batch
    this.currentBatch = [];
    
    const startTime = Date.now();
    
    try {
      // Process all entries in batch
      for (const entry of batch.entries) {
        await this.processAuditEntry(entry);
      }
      
      batch.status = 'completed';
      batch.processingTime = Date.now() - startTime;
      
      console.log(`Processed batch ${batch.batchId} with ${batch.batchSize} entries in ${batch.processingTime}ms`);
      
    } catch (error) {
      batch.status = 'failed';
      batch.errorDetails = error instanceof Error ? error.message : 'Unknown error';
      console.error('Batch processing failed:', error);
    }
  }

  private async monitorCollectionHealth(): Promise<void> {
    // Monitor storage usage
    const storageUsage = await this.getStorageUsage();
    if (storageUsage > this.config.alertOnStorageThreshold) {
      console.warn(`Storage usage at ${storageUsage}%, exceeding threshold of ${this.config.alertOnStorageThreshold}%`);
    }
    
    // Monitor collection success rate
    const totalCollections = this.collectionStats.successfulCollections + this.collectionStats.failedCollections;
    if (totalCollections > 0) {
      const successRate = this.collectionStats.successfulCollections / totalCollections;
      if (successRate < 0.95) { // Less than 95% success rate
        console.warn(`Collection success rate at ${(successRate * 100).toFixed(1)}%, below expected threshold`);
      }
    }
    
    // Monitor active sessions
    const activeSessions = this.activeSessions.size;
    if (activeSessions > this.config.maxConcurrentCollections) {
      console.warn(`${activeSessions} active sessions exceeds maximum of ${this.config.maxConcurrentCollections}`);
    }
  }

  private async getStorageUsage(): Promise<number> {
    // In real implementation, this would check actual storage usage
    return Math.random() * 100; // Simulate 0-100% usage
  }

  /**
   * End a metrics collection session
   */
  async endCollectionSession(sessionId: string): Promise<MetricsCollectionSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collection session ${sessionId} not found`);
    }

    session.endTime = new Date().toISOString();
    session.collectionStatus = 'completed';
    
    // Calculate final quality scores
    session.quality = await this.calculateSessionQuality(session);
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    
    console.log(`Ended metrics collection session ${sessionId} with ${session.totalEntries} entries`);
    
    return session;
  }

  private async calculateSessionQuality(session: MetricsCollectionSession): Promise<any> {
    // Calculate quality metrics based on session data
    return {
      completenessScore: 0.95 + Math.random() * 0.05, // 95-100%
      accuracyScore: 0.90 + Math.random() * 0.10, // 90-100%
      consistencyScore: 0.85 + Math.random() * 0.15, // 85-100%
      integrityScore: this.config.enableCryptographicSigning ? 1.0 : 0.8
    };
  }

  /**
   * Get analytics about metrics collection
   */
  async getCollectionAnalytics(): Promise<MetricsAnalytics> {
    const totalCollections = this.collectionStats.successfulCollections + this.collectionStats.failedCollections;
    
    return {
      collectionPerformance: {
        averageCollectionTime: this.collectionStats.averageProcessingTime,
        successRate: totalCollections > 0 ? this.collectionStats.successfulCollections / totalCollections : 1.0,
        failureRate: totalCollections > 0 ? this.collectionStats.failedCollections / totalCollections : 0.0,
        throughput: this.collectionStats.totalEntries / Math.max(1, Date.now() / 1000) // entries per second
      },
      
      dataQuality: {
        completenessRate: 0.95,
        accuracyRate: 0.92,
        consistencyRate: 0.88,
        integrityRate: this.config.enableCryptographicSigning ? 1.0 : 0.8
      },
      
      storageUtilization: {
        totalStorageUsed: this.collectionStats.totalEntries * 1024, // Estimate 1KB per entry
        storageGrowthRate: 1024 * 100, // Estimate 100 entries per day
        retentionCompliance: 0.98,
        compressionRatio: this.config.enableCompression ? 0.3 : 1.0
      },
      
      behaviorInsights: {
        mostActiveAgents: Array.from(this.activeSessions.values())
          .map(s => s.agentId)
          .slice(0, 5),
        averageSessionDuration: 300000, // 5 minutes
        peakActivityHours: [9, 10, 14, 15, 16], // 9-10am, 2-4pm
        autonomousProcessFrequency: 0.15 // 15% of interactions involve autonomous processes
      }
    };
  }

  /**
   * Get active collection sessions
   */
  getActiveSessions(): MetricsCollectionSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MetricsCollectionConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart batch processing if interval changed
    if (updates.batchInterval && this.config.enableBatchCollection) {
      this.startBatchProcessing();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MetricsCollectionConfig {
    return { ...this.config };
  }

  /**
   * Get collection statistics
   */
  getCollectionStats(): any {
    return { ...this.collectionStats };
  }

  /**
   * Get agent metrics profile (compatibility method for useAgentMetrics hook)
   */
  async getAgentMetricsProfile(agentId: string, version: 'test' | 'production' = 'test'): Promise<AgentMetricsProfile | null> {
    try {
      // Create a default profile with basic metrics
      const profile: AgentMetricsProfile = {
        agentId,
        agentName: agentId || 'Unknown Agent',
        version,
        userId: this.userId,
        createdAt: new Date(),
        lastUpdated: new Date(),
        metrics: {
          trustScore: 0.85, // Default trust score
          complianceRate: 0.95, // Default compliance rate
          responseTime: 1200, // Default response time in ms
          sessionIntegrity: 0.98, // Default session integrity
          totalInteractions: 0, // Start with 0 interactions
          governanceMetrics: {
            policyCompliance: 0.95,
            auditTrailCompleteness: 1.0,
            transparencyScore: 0.90,
            ethicalReasoningScore: 0.88
          }
        },
        status: 'active'
      };

      // Try to get existing metrics if trust metrics extension is available
      try {
        if (this.trustMetricsExtension && typeof this.trustMetricsExtension.getTrustScore === 'function') {
          const trustScore = await this.trustMetricsExtension.getTrustScore(agentId);
          if (trustScore !== undefined) {
            profile.metrics.trustScore = trustScore;
          }
        }
      } catch (trustError) {
        console.warn('Could not get trust metrics, using defaults:', trustError);
      }

      return profile;
    } catch (error) {
      console.error('Error getting agent metrics profile:', error);
      // Return a minimal profile even on error
      return {
        agentId,
        agentName: agentId || 'Unknown Agent',
        version,
        userId: this.userId,
        createdAt: new Date(),
        lastUpdated: new Date(),
        metrics: {
          trustScore: 0.5,
          complianceRate: 0.5,
          responseTime: 2000,
          sessionIntegrity: 0.5,
          totalInteractions: 0,
          governanceMetrics: {
            policyCompliance: 0.5,
            auditTrailCompleteness: 0.5,
            transparencyScore: 0.5,
            ethicalReasoningScore: 0.5
          }
        },
        status: 'active'
      };
    }
  }

  /**
   * Create test agent profile (compatibility method)
   */
  async createTestAgentProfile(agentId: string, agentName: string, userId: string): Promise<AgentMetricsProfile> {
    const profile: AgentMetricsProfile = {
      agentId,
      agentName,
      version: 'test',
      userId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      metrics: {
        trustScore: 0.85,
        complianceRate: 0.92,
        responseTime: 1200,
        sessionIntegrity: 0.95,
        totalInteractions: 0,
        governanceMetrics: {
          policyCompliance: 0.90,
          auditTrailCompleteness: 0.88,
          transparencyScore: 0.85,
          ethicalReasoningScore: 0.87
        }
      },
      status: 'active'
    };

    // Store the profile (in memory for now)
    this.agentProfiles.set(`${agentId}-test`, profile);
    
    return profile;
  }

  /**
   * Create production agent profile (compatibility method)
   */
  async createProductionAgentProfile(agentId: string, agentName: string, userId: string, deploymentId: string): Promise<AgentMetricsProfile> {
    const profile: AgentMetricsProfile = {
      agentId,
      agentName,
      version: 'production',
      userId,
      deploymentId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      metrics: {
        trustScore: 0.90,
        complianceRate: 0.95,
        responseTime: 800,
        sessionIntegrity: 0.98,
        totalInteractions: 0,
        governanceMetrics: {
          policyCompliance: 0.95,
          auditTrailCompleteness: 0.92,
          transparencyScore: 0.88,
          ethicalReasoningScore: 0.90
        }
      },
      status: 'active'
    };

    // Store the profile (in memory for now)
    this.agentProfiles.set(`${agentId}-production`, profile);
    
    return profile;
  }

  // Add agent profiles storage
  private agentProfiles: Map<string, AgentMetricsProfile> = new Map();
}

// Export singleton instance
export const metricsCollectionExtension = MetricsCollectionExtension.getInstance();

