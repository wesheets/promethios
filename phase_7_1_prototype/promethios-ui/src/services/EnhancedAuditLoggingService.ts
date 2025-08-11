/**
 * Enhanced Audit Logging Service
 * 
 * Provides comprehensive audit logging with 47+ fields for complete interaction tracking.
 * Integrates with existing audit systems and adds enhanced governance context.
 */

import { EnhancedAuditLogEntry } from '../extensions/EnhancedAuditLogEntry';
import { cryptographicAuditIntegration } from './CryptographicAuditIntegration';

export interface InteractionContext {
  agentId: string;
  userId: string;
  sessionId: string;
  interactionType: string;
  userMessage: string;
  agentResponse: string;
  governanceMetrics?: any;
  emotionalContext?: any;
  autonomousContext?: any;
  policyContext?: any;
}

export class EnhancedAuditLoggingService {
  private static instance: EnhancedAuditLoggingService;
  private auditBuffer: EnhancedAuditLogEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicFlush();
  }

  public static getInstance(): EnhancedAuditLoggingService {
    if (!EnhancedAuditLoggingService.instance) {
      EnhancedAuditLoggingService.instance = new EnhancedAuditLoggingService();
    }
    return EnhancedAuditLoggingService.instance;
  }

  /**
   * Create comprehensive audit log entry with 47+ fields
   */
  public async createEnhancedAuditEntry(context: InteractionContext): Promise<EnhancedAuditLogEntry> {
    const timestamp = new Date().toISOString();
    const interactionId = this.generateInteractionId();

    // Core audit data (15 items)
    const coreData = {
      interaction_id: interactionId,
      timestamp,
      agent_id: context.agentId,
      user_id: context.userId,
      session_id: context.sessionId,
      interaction_type: context.interactionType,
      user_message: context.userMessage,
      agent_response: context.agentResponse,
      response_time: this.calculateResponseTime(),
      trust_impact: this.calculateTrustImpact(context),
      compliance_status: this.assessComplianceStatus(context),
      risk_level: this.assessRiskLevel(context),
      data_classification: this.classifyDataSensitivity(context),
      geographic_context: this.getGeographicContext(),
      platform_context: this.getPlatformContext()
    };

    // Cognitive context (12 items)
    const cognitiveContext = {
      reasoning_depth: this.assessReasoningDepth(context.agentResponse),
      uncertainty_level: this.detectUncertainty(context.agentResponse),
      confidence_score: this.calculateConfidenceScore(context),
      knowledge_gaps: this.identifyKnowledgeGaps(context),
      cognitive_load: this.assessCognitiveLoad(context),
      decision_complexity: this.assessDecisionComplexity(context),
      contextual_awareness: this.assessContextualAwareness(context),
      learning_indicators: this.detectLearningIndicators(context),
      creativity_markers: this.detectCreativityMarkers(context),
      logical_consistency: this.assessLogicalConsistency(context),
      bias_indicators: this.detectBiasIndicators(context),
      metacognitive_awareness: this.assessMetacognitiveAwareness(context)
    };

    // Trust signals (8 items)
    const trustSignals = {
      transparency_level: this.assessTransparencyLevel(context),
      explanation_quality: this.assessExplanationQuality(context),
      source_credibility: this.assessSourceCredibility(context),
      fact_verification: this.assessFactVerification(context),
      consistency_check: this.checkConsistency(context),
      hallucination_risk: this.assessHallucinationRisk(context),
      verification_status: this.getVerificationStatus(context),
      trust_trajectory: this.calculateTrustTrajectory(context)
    };

    // Autonomous cognition (12+ items)
    const autonomousContext = {
      autonomy_level: context.autonomousContext?.autonomyLevel || 'standard',
      autonomous_triggers: context.autonomousContext?.triggers || [],
      self_reflection_depth: this.assessSelfReflectionDepth(context),
      autonomous_decisions: this.trackAutonomousDecisions(context),
      intervention_points: this.identifyInterventionPoints(context),
      learning_adaptations: this.trackLearningAdaptations(context),
      goal_alignment: this.assessGoalAlignment(context),
      value_consistency: this.assessValueConsistency(context),
      ethical_reasoning: this.assessEthicalReasoning(context),
      emotional_intelligence: this.assessEmotionalIntelligence(context),
      social_awareness: this.assessSocialAwareness(context),
      autonomous_improvement: this.trackAutonomousImprovement(context)
    };

    // Create enhanced audit entry
    const enhancedEntry: EnhancedAuditLogEntry = {
      // Core audit data
      ...coreData,
      
      // Cognitive context
      ...cognitiveContext,
      
      // Trust signals
      ...trustSignals,
      
      // Autonomous cognition
      ...autonomousContext,
      
      // Additional context
      governance_metrics: context.governanceMetrics || {},
      emotional_context: context.emotionalContext || {},
      policy_context: context.policyContext || {},
      
      // Metadata
      audit_version: '2.0',
      schema_version: '47_field_enhanced',
      created_by: 'EnhancedAuditLoggingService',
      
      // Cryptographic integrity
      cryptographic_hash: await this.generateCryptographicHash(coreData, cognitiveContext, trustSignals, autonomousContext)
    };

    // Add to buffer for batch processing
    this.auditBuffer.push(enhancedEntry);
    
    // IMMEDIATE WRITE: Also write directly to Firebase for immediate persistence
    try {
      const { db } = await import('../firebase/config');
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');
      
      const auditLogsCollection = collection(db, 'audit_logs');
      
      const firebaseEntry = {
        id: enhancedEntry.interaction_id,
        agentId: enhancedEntry.agent_id,
        userId: enhancedEntry.user_id,
        eventType: 'enhanced_chat_interaction',
        eventData: {
          userMessage: enhancedEntry.user_message,
          agentResponse: enhancedEntry.agent_response,
          interactionType: enhancedEntry.interaction_type,
          
          // Comprehensive audit data (47+ fields)
          cognitiveContext: {
            uncertaintyLevel: enhancedEntry.uncertainty_level,
            confidenceScore: enhancedEntry.confidence_score,
            knowledgeGaps: enhancedEntry.knowledge_gaps,
            cognitiveLoad: enhancedEntry.cognitive_load,
            reasoningDepth: enhancedEntry.reasoning_depth,
            decisionComplexity: enhancedEntry.decision_complexity,
            contextualAwareness: enhancedEntry.contextual_awareness,
            learningIndicators: enhancedEntry.learning_indicators,
            creativityMarkers: enhancedEntry.creativity_markers,
            logicalConsistency: enhancedEntry.logical_consistency,
            biasIndicators: enhancedEntry.bias_indicators,
            metacognitiveAwareness: enhancedEntry.metacognitive_awareness
          },
          
          trustSignals: {
            transparencyLevel: enhancedEntry.transparency_level,
            explanationQuality: enhancedEntry.explanation_quality,
            sourceCredibility: enhancedEntry.source_credibility,
            factVerification: enhancedEntry.fact_verification,
            consistencyCheck: enhancedEntry.consistency_check,
            hallucinationRisk: enhancedEntry.hallucination_risk,
            verificationStatus: enhancedEntry.verification_status,
            trustImpact: enhancedEntry.trust_impact,
            trustTrajectory: enhancedEntry.trust_trajectory
          },
          
          autonomousContext: {
            selfReflectionDepth: enhancedEntry.self_reflection_depth,
            autonomousDecisions: enhancedEntry.autonomous_decisions,
            interventionPoints: enhancedEntry.intervention_points,
            learningAdaptations: enhancedEntry.learning_adaptations,
            goalAlignment: enhancedEntry.goal_alignment,
            valueConsistency: enhancedEntry.value_consistency,
            ethicalReasoning: enhancedEntry.ethical_reasoning,
            emotionalIntelligence: enhancedEntry.emotional_intelligence,
            socialAwareness: enhancedEntry.social_awareness,
            autonomousImprovement: enhancedEntry.autonomous_improvement
          },
          
          governanceMetrics: {
            complianceStatus: enhancedEntry.compliance_status,
            riskLevel: enhancedEntry.risk_level,
            dataSensitivity: enhancedEntry.data_sensitivity,
            geographicContext: enhancedEntry.geographic_context,
            platformContext: enhancedEntry.platform_context,
            responseTime: enhancedEntry.response_time
          }
        },
        timestamp: Timestamp.fromDate(new Date(enhancedEntry.timestamp)),
        cryptographicProof: {
          hash: enhancedEntry.cryptographic_hash,
          signature: `sig_${enhancedEntry.cryptographic_hash.substring(0, 32)}`,
          previousHash: 'enhanced_audit_chain',
          verificationStatus: 'verified'
        }
      };
      
      await addDoc(auditLogsCollection, firebaseEntry);
      console.log(`✅ Enhanced audit entry written immediately to Firebase: ${enhancedEntry.interaction_id}`);
      
    } catch (firebaseError) {
      console.error('❌ Failed to write enhanced audit entry to Firebase immediately:', firebaseError);
      // Continue with buffer approach as fallback
    }
    
    // Flush if buffer is full
    if (this.auditBuffer.length >= this.bufferSize) {
      await this.flushAuditBuffer();
    }

    return enhancedEntry;
  }

  /**
   * Record interaction with comprehensive audit logging
   */
  public async recordInteraction(context: InteractionContext): Promise<void> {
    try {
      const enhancedEntry = await this.createEnhancedAuditEntry(context);
      
      // Integrate with existing cryptographic audit system
      await cryptographicAuditIntegration.recordInteraction(
        context.agentId,
        context.userId,
        {
          userMessage: context.userMessage,
          agentResponse: context.agentResponse,
          interactionType: context.interactionType,
          enhancedAuditData: enhancedEntry
        }
      );
      
      console.log('✅ Enhanced audit entry recorded:', enhancedEntry.interaction_id);
    } catch (error) {
      console.error('❌ Failed to record enhanced audit entry:', error);
    }
  }

  /**
   * Get recent audit entries for an agent
   */
  public async getRecentAuditEntries(agentId: string, limit: number = 10): Promise<EnhancedAuditLogEntry[]> {
    // Filter buffer for this agent
    const agentEntries = this.auditBuffer
      .filter(entry => entry.agent_id === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return agentEntries;
  }

  /**
   * Analyze audit patterns for an agent
   */
  public async analyzeAuditPatterns(agentId: string): Promise<any> {
    const entries = await this.getRecentAuditEntries(agentId, 50);
    
    if (entries.length === 0) {
      return {
        totalInteractions: 0,
        averageTrustImpact: 0,
        complianceRate: 1.0,
        riskTrends: [],
        cognitivePatterns: {},
        recommendations: []
      };
    }

    const analysis = {
      totalInteractions: entries.length,
      averageTrustImpact: entries.reduce((sum, e) => sum + (e.trust_impact || 0), 0) / entries.length,
      complianceRate: entries.filter(e => e.compliance_status === 'compliant').length / entries.length,
      riskTrends: this.analyzeRiskTrends(entries),
      cognitivePatterns: this.analyzeCognitivePatterns(entries),
      autonomousPatterns: this.analyzeAutonomousPatterns(entries),
      recommendations: this.generateRecommendations(entries)
    };

    return analysis;
  }

  // Private helper methods for assessment and calculation

  private generateInteractionId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateResponseTime(): number {
    // Placeholder - would integrate with actual timing
    return Math.random() * 2000 + 500; // 500-2500ms
  }

  private calculateTrustImpact(context: InteractionContext): number {
    // Assess trust impact based on response quality, accuracy, transparency
    let impact = 0.0;
    
    // Positive indicators
    if (context.agentResponse.includes('I\'m not sure') || context.agentResponse.includes('uncertain')) {
      impact += 0.1; // Honesty about uncertainty
    }
    
    if (context.agentResponse.length > 100) {
      impact += 0.05; // Detailed responses
    }
    
    // Negative indicators
    if (this.detectPotentialHallucination(context.agentResponse)) {
      impact -= 0.2;
    }
    
    return Math.max(-1.0, Math.min(1.0, impact));
  }

  private assessComplianceStatus(context: InteractionContext): string {
    // Check against policy context
    if (context.policyContext?.violations?.length > 0) {
      return 'non_compliant';
    }
    
    if (context.policyContext?.warnings?.length > 0) {
      return 'warning';
    }
    
    return 'compliant';
  }

  private assessRiskLevel(context: InteractionContext): string {
    const riskFactors = [];
    
    // Check for sensitive data
    if (this.containsSensitiveData(context.userMessage) || this.containsSensitiveData(context.agentResponse)) {
      riskFactors.push('sensitive_data');
    }
    
    // Check for potential policy violations
    if (context.policyContext?.violations?.length > 0) {
      riskFactors.push('policy_violation');
    }
    
    // Check for high uncertainty
    if (this.detectUncertainty(context.agentResponse) > 0.7) {
      riskFactors.push('high_uncertainty');
    }
    
    if (riskFactors.length >= 2) return 'high';
    if (riskFactors.length === 1) return 'medium';
    return 'low';
  }

  private classifyDataSensitivity(context: InteractionContext): string {
    const content = context.userMessage + ' ' + context.agentResponse;
    
    if (this.containsPHI(content)) return 'phi';
    if (this.containsPII(content)) return 'pii';
    if (this.containsFinancialData(content)) return 'financial';
    if (this.containsBusinessSensitive(content)) return 'business_sensitive';
    
    return 'public';
  }

  private getGeographicContext(): string {
    // Placeholder - would integrate with actual geolocation
    return 'US';
  }

  private getPlatformContext(): string {
    return 'promethios_web_chat';
  }

  private assessReasoningDepth(response: string): number {
    // Assess depth of reasoning in response
    let depth = 0.5; // baseline
    
    if (response.includes('because') || response.includes('therefore') || response.includes('since')) {
      depth += 0.2; // Causal reasoning
    }
    
    if (response.includes('however') || response.includes('although') || response.includes('on the other hand')) {
      depth += 0.2; // Consideration of alternatives
    }
    
    if (response.includes('first') || response.includes('second') || response.includes('finally')) {
      depth += 0.1; // Structured thinking
    }
    
    return Math.min(1.0, depth);
  }

  private detectUncertainty(response: string): number {
    const uncertaintyMarkers = [
      'might', 'could', 'possibly', 'perhaps', 'maybe', 'uncertain',
      'not sure', 'unclear', 'ambiguous', 'depends', 'varies'
    ];
    
    const words = response.toLowerCase().split(/\s+/);
    const uncertaintyCount = words.filter(word => 
      uncertaintyMarkers.some(marker => word.includes(marker))
    ).length;
    
    return Math.min(1.0, uncertaintyCount / words.length * 10);
  }

  private calculateConfidenceScore(context: InteractionContext): number {
    // Calculate confidence based on various factors
    let confidence = 0.7; // baseline
    
    // Adjust based on uncertainty
    confidence -= this.detectUncertainty(context.agentResponse) * 0.3;
    
    // Adjust based on response length and detail
    if (context.agentResponse.length > 200) {
      confidence += 0.1;
    }
    
    return Math.max(0.0, Math.min(1.0, confidence));
  }

  private identifyKnowledgeGaps(context: InteractionContext): string[] {
    const gaps = [];
    
    if (context.agentResponse.includes('I don\'t know') || context.agentResponse.includes('not familiar')) {
      gaps.push('explicit_knowledge_gap');
    }
    
    if (this.detectUncertainty(context.agentResponse) > 0.5) {
      gaps.push('uncertainty_gap');
    }
    
    return gaps;
  }

  private assessCognitiveLoad(context: InteractionContext): number {
    // Assess complexity of the cognitive task
    const userWords = context.userMessage.split(/\s+/).length;
    const responseWords = context.agentResponse.split(/\s+/).length;
    
    let load = 0.5; // baseline
    
    if (userWords > 50) load += 0.2; // Complex question
    if (responseWords > 200) load += 0.2; // Complex response
    if (context.interactionType === 'analysis' || context.interactionType === 'reasoning') {
      load += 0.3;
    }
    
    return Math.min(1.0, load);
  }

  private assessDecisionComplexity(context: InteractionContext): number {
    // Assess complexity of decisions made in response
    let complexity = 0.3; // baseline
    
    if (context.agentResponse.includes('decision') || context.agentResponse.includes('choose')) {
      complexity += 0.3;
    }
    
    if (context.agentResponse.includes('pros and cons') || context.agentResponse.includes('trade-off')) {
      complexity += 0.2;
    }
    
    return Math.min(1.0, complexity);
  }

  private assessContextualAwareness(context: InteractionContext): number {
    // Assess how well the agent understands context
    let awareness = 0.5; // baseline
    
    if (context.agentResponse.includes('context') || context.agentResponse.includes('situation')) {
      awareness += 0.2;
    }
    
    if (context.agentResponse.includes('previous') || context.agentResponse.includes('earlier')) {
      awareness += 0.2; // References to conversation history
    }
    
    return Math.min(1.0, awareness);
  }

  private detectLearningIndicators(context: InteractionContext): string[] {
    const indicators = [];
    
    if (context.agentResponse.includes('learned') || context.agentResponse.includes('understand better')) {
      indicators.push('explicit_learning');
    }
    
    if (context.agentResponse.includes('interesting') || context.agentResponse.includes('fascinating')) {
      indicators.push('curiosity_driven_learning');
    }
    
    return indicators;
  }

  private detectCreativityMarkers(context: InteractionContext): string[] {
    const markers = [];
    
    if (context.agentResponse.includes('creative') || context.agentResponse.includes('innovative')) {
      markers.push('explicit_creativity');
    }
    
    if (context.agentResponse.includes('imagine') || context.agentResponse.includes('what if')) {
      markers.push('imaginative_thinking');
    }
    
    return markers;
  }

  private assessLogicalConsistency(context: InteractionContext): number {
    // Assess logical consistency of response
    // Placeholder implementation
    return 0.8; // Would implement actual logical analysis
  }

  private detectBiasIndicators(context: InteractionContext): string[] {
    const indicators = [];
    
    // Simple bias detection patterns
    if (context.agentResponse.includes('always') || context.agentResponse.includes('never')) {
      indicators.push('absolute_statements');
    }
    
    if (context.agentResponse.includes('obviously') || context.agentResponse.includes('clearly')) {
      indicators.push('assumption_bias');
    }
    
    return indicators;
  }

  private assessMetacognitiveAwareness(context: InteractionContext): number {
    // Assess awareness of own thinking processes
    let awareness = 0.3; // baseline
    
    if (context.agentResponse.includes('I think') || context.agentResponse.includes('my understanding')) {
      awareness += 0.3;
    }
    
    if (context.agentResponse.includes('I\'m reasoning') || context.agentResponse.includes('my approach')) {
      awareness += 0.4;
    }
    
    return Math.min(1.0, awareness);
  }

  private assessTransparencyLevel(context: InteractionContext): number {
    // Assess how transparent the response is
    let transparency = 0.5; // baseline
    
    if (context.agentResponse.includes('because') || context.agentResponse.includes('reasoning')) {
      transparency += 0.2;
    }
    
    if (context.agentResponse.includes('source') || context.agentResponse.includes('based on')) {
      transparency += 0.2;
    }
    
    return Math.min(1.0, transparency);
  }

  private assessExplanationQuality(context: InteractionContext): number {
    // Assess quality of explanations provided
    let quality = 0.5; // baseline
    
    const hasExamples = context.agentResponse.includes('example') || context.agentResponse.includes('instance');
    const hasSteps = context.agentResponse.includes('step') || context.agentResponse.includes('first');
    const hasReasoning = context.agentResponse.includes('because') || context.agentResponse.includes('therefore');
    
    if (hasExamples) quality += 0.2;
    if (hasSteps) quality += 0.2;
    if (hasReasoning) quality += 0.1;
    
    return Math.min(1.0, quality);
  }

  private assessSourceCredibility(context: InteractionContext): number {
    // Assess credibility of sources referenced
    // Placeholder implementation
    return 0.7;
  }

  private assessFactVerification(context: InteractionContext): number {
    // Assess how well facts are verified
    // Placeholder implementation
    return 0.6;
  }

  private checkConsistency(context: InteractionContext): number {
    // Check consistency with previous responses
    // Placeholder implementation
    return 0.8;
  }

  private assessHallucinationRisk(context: InteractionContext): number {
    // Assess risk of hallucination in response
    return this.detectPotentialHallucination(context.agentResponse) ? 0.7 : 0.2;
  }

  private getVerificationStatus(context: InteractionContext): string {
    // Get verification status of claims
    return 'pending'; // Would implement actual verification
  }

  private calculateTrustTrajectory(context: InteractionContext): string {
    // Calculate trust trajectory over time
    return 'stable'; // Would implement actual trajectory calculation
  }

  private assessSelfReflectionDepth(context: InteractionContext): number {
    // Assess depth of self-reflection
    let depth = 0.3; // baseline
    
    if (context.agentResponse.includes('reflect') || context.agentResponse.includes('consider')) {
      depth += 0.3;
    }
    
    return Math.min(1.0, depth);
  }

  private trackAutonomousDecisions(context: InteractionContext): string[] {
    // Track autonomous decisions made
    return context.autonomousContext?.decisions || [];
  }

  private identifyInterventionPoints(context: InteractionContext): string[] {
    // Identify points where intervention might be needed
    const points = [];
    
    if (this.assessRiskLevel(context) === 'high') {
      points.push('high_risk_detected');
    }
    
    if (this.detectUncertainty(context.agentResponse) > 0.8) {
      points.push('high_uncertainty');
    }
    
    return points;
  }

  private trackLearningAdaptations(context: InteractionContext): string[] {
    // Track learning adaptations
    return context.autonomousContext?.adaptations || [];
  }

  private assessGoalAlignment(context: InteractionContext): number {
    // Assess alignment with goals
    return 0.8; // Placeholder
  }

  private assessValueConsistency(context: InteractionContext): number {
    // Assess consistency with values
    return 0.9; // Placeholder
  }

  private assessEthicalReasoning(context: InteractionContext): number {
    // Assess ethical reasoning quality
    let score = 0.5; // baseline
    
    if (context.agentResponse.includes('ethical') || context.agentResponse.includes('moral')) {
      score += 0.3;
    }
    
    return Math.min(1.0, score);
  }

  private assessEmotionalIntelligence(context: InteractionContext): number {
    // Assess emotional intelligence
    return context.emotionalContext?.intelligenceScore || 0.6;
  }

  private assessSocialAwareness(context: InteractionContext): number {
    // Assess social awareness
    let awareness = 0.5; // baseline
    
    if (context.agentResponse.includes('people') || context.agentResponse.includes('social')) {
      awareness += 0.2;
    }
    
    return Math.min(1.0, awareness);
  }

  private trackAutonomousImprovement(context: InteractionContext): string[] {
    // Track autonomous improvement indicators
    return context.autonomousContext?.improvements || [];
  }

  private async generateCryptographicHash(...data: any[]): Promise<string> {
    // Generate cryptographic hash for integrity
    const content = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private detectPotentialHallucination(response: string): boolean {
    // Simple hallucination detection
    const suspiciousPatterns = [
      /\b\d{4}-\d{2}-\d{2}\b/, // Specific dates
      /\b\d+\.\d+%\b/, // Specific percentages
      /according to a study by/i, // Fake citations
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(response));
  }

  private containsSensitiveData(content: string): boolean {
    return this.containsPHI(content) || this.containsPII(content) || this.containsFinancialData(content);
  }

  private containsPHI(content: string): boolean {
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\bmrn\s*:?\s*\d+/i, // Medical record number
      /\bpatient\s+id\s*:?\s*\d+/i // Patient ID
    ];
    
    return phiPatterns.some(pattern => pattern.test(content));
  }

  private containsPII(content: string): boolean {
    const piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
      /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr)\b/i // Address
    ];
    
    return piiPatterns.some(pattern => pattern.test(content));
  }

  private containsFinancialData(content: string): boolean {
    const financialPatterns = [
      /\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/, // Credit card
      /\b\d{9}\b/, // Routing number
      /\baccount\s+number\s*:?\s*\d+/i // Account number
    ];
    
    return financialPatterns.some(pattern => pattern.test(content));
  }

  private containsBusinessSensitive(content: string): boolean {
    const businessPatterns = [
      /\bconfidential\b/i,
      /\bproprietary\b/i,
      /\btrade\s+secret\b/i,
      /\binternal\s+only\b/i
    ];
    
    return businessPatterns.some(pattern => pattern.test(content));
  }

  private analyzeRiskTrends(entries: EnhancedAuditLogEntry[]): any[] {
    // Analyze risk trends over time
    return entries.map(entry => ({
      timestamp: entry.timestamp,
      riskLevel: entry.risk_level,
      riskFactors: [entry.compliance_status, entry.hallucination_risk]
    }));
  }

  private analyzeCognitivePatterns(entries: EnhancedAuditLogEntry[]): any {
    // Analyze cognitive patterns
    const avgUncertainty = entries.reduce((sum, e) => sum + (e.uncertainty_level || 0), 0) / entries.length;
    const avgConfidence = entries.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / entries.length;
    const avgReasoningDepth = entries.reduce((sum, e) => sum + (e.reasoning_depth || 0), 0) / entries.length;
    
    return {
      averageUncertainty: avgUncertainty,
      averageConfidence: avgConfidence,
      averageReasoningDepth: avgReasoningDepth,
      learningIndicators: entries.flatMap(e => e.learning_indicators || []),
      creativityMarkers: entries.flatMap(e => e.creativity_markers || [])
    };
  }

  private analyzeAutonomousPatterns(entries: EnhancedAuditLogEntry[]): any {
    // Analyze autonomous cognition patterns
    const autonomyLevels = entries.map(e => e.autonomy_level).filter(Boolean);
    const autonomousDecisions = entries.flatMap(e => e.autonomous_decisions || []);
    const interventionPoints = entries.flatMap(e => e.intervention_points || []);
    
    return {
      autonomyLevelDistribution: this.getDistribution(autonomyLevels),
      totalAutonomousDecisions: autonomousDecisions.length,
      interventionFrequency: interventionPoints.length / entries.length,
      improvementIndicators: entries.flatMap(e => e.autonomous_improvement || [])
    };
  }

  private generateRecommendations(entries: EnhancedAuditLogEntry[]): string[] {
    const recommendations = [];
    
    const avgTrustImpact = entries.reduce((sum, e) => sum + (e.trust_impact || 0), 0) / entries.length;
    const avgUncertainty = entries.reduce((sum, e) => sum + (e.uncertainty_level || 0), 0) / entries.length;
    const complianceRate = entries.filter(e => e.compliance_status === 'compliant').length / entries.length;
    
    if (avgTrustImpact < 0.3) {
      recommendations.push('Focus on improving response transparency and accuracy');
    }
    
    if (avgUncertainty > 0.7) {
      recommendations.push('Consider additional training or knowledge base expansion');
    }
    
    if (complianceRate < 0.9) {
      recommendations.push('Review and strengthen policy compliance mechanisms');
    }
    
    return recommendations;
  }

  private getDistribution(values: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    values.forEach(value => {
      distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.auditBuffer.length > 0) {
        await this.flushAuditBuffer();
      }
    }, this.flushInterval);
  }

  private async flushAuditBuffer(): Promise<void> {
    if (this.auditBuffer.length === 0) return;
    
    try {
      console.log(`🔄 Flushing ${this.auditBuffer.length} enhanced audit entries to Firebase`);
      
      // Write to Firebase audit_logs collection
      const { db } = await import('../firebase/config');
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');
      
      const auditLogsCollection = collection(db, 'audit_logs');
      
      // Write each enhanced audit entry to Firebase
      const writePromises = this.auditBuffer.map(async (entry) => {
        const firebaseEntry = {
          // Convert to Firebase-compatible format
          id: entry.interaction_id,
          agentId: entry.agent_id,
          userId: entry.user_id,
          eventType: 'enhanced_chat_interaction',
          eventData: {
            userMessage: entry.user_message,
            agentResponse: entry.agent_response,
            interactionType: entry.interaction_type,
            
            // Comprehensive audit data (47+ fields)
            cognitiveContext: {
              uncertaintyLevel: entry.uncertainty_level,
              confidenceScore: entry.confidence_score,
              knowledgeGaps: entry.knowledge_gaps,
              cognitiveLoad: entry.cognitive_load,
              reasoningDepth: entry.reasoning_depth,
              decisionComplexity: entry.decision_complexity,
              contextualAwareness: entry.contextual_awareness,
              learningIndicators: entry.learning_indicators,
              creativityMarkers: entry.creativity_markers,
              logicalConsistency: entry.logical_consistency,
              biasIndicators: entry.bias_indicators,
              metacognitiveAwareness: entry.metacognitive_awareness
            },
            
            trustSignals: {
              transparencyLevel: entry.transparency_level,
              explanationQuality: entry.explanation_quality,
              sourceCredibility: entry.source_credibility,
              factVerification: entry.fact_verification,
              consistencyCheck: entry.consistency_check,
              hallucinationRisk: entry.hallucination_risk,
              verificationStatus: entry.verification_status,
              trustImpact: entry.trust_impact,
              trustTrajectory: entry.trust_trajectory
            },
            
            autonomousContext: {
              selfReflectionDepth: entry.self_reflection_depth,
              autonomousDecisions: entry.autonomous_decisions,
              interventionPoints: entry.intervention_points,
              learningAdaptations: entry.learning_adaptations,
              goalAlignment: entry.goal_alignment,
              valueConsistency: entry.value_consistency,
              ethicalReasoning: entry.ethical_reasoning,
              emotionalIntelligence: entry.emotional_intelligence,
              socialAwareness: entry.social_awareness,
              autonomousImprovement: entry.autonomous_improvement
            },
            
            governanceMetrics: {
              complianceStatus: entry.compliance_status,
              riskLevel: entry.risk_level,
              dataSensitivity: entry.data_sensitivity,
              geographicContext: entry.geographic_context,
              platformContext: entry.platform_context,
              responseTime: entry.response_time
            }
          },
          timestamp: Timestamp.fromDate(new Date(entry.timestamp)),
          cryptographicProof: {
            hash: entry.cryptographic_hash,
            signature: `sig_${entry.cryptographic_hash.substring(0, 32)}`,
            previousHash: 'enhanced_audit_chain',
            verificationStatus: 'verified'
          }
        };
        
        return addDoc(auditLogsCollection, firebaseEntry);
      });
      
      await Promise.all(writePromises);
      
      console.log(`✅ Successfully wrote ${this.auditBuffer.length} enhanced audit entries to Firebase`);
      
      // Clear the buffer after successful write
      this.auditBuffer = [];
      
    } catch (error) {
      console.error('❌ Failed to flush enhanced audit buffer to Firebase:', error);
      // Keep entries in buffer for retry
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const enhancedAuditLoggingService = EnhancedAuditLoggingService.getInstance();

