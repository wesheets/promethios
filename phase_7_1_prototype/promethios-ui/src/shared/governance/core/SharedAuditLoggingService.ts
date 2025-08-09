/**
 * Shared Audit Logging Service
 * 
 * Implements comprehensive audit logging with 47+ fields including cognitive context,
 * autonomous cognition tracking, and emotional veritas integration. This service ensures
 * consistent audit logging across both modern chat and universal governance systems.
 */

import { IAuditLoggingService } from '../interfaces/ISharedGovernanceService';
import {
  AuditEntry,
  AuditFilters,
  BehavioralPatterns,
  BehavioralPattern,
  BehavioralInsight,
  PolicyViolation,
  GovernanceContext
} from '../types/SharedGovernanceTypes';

export class SharedAuditLoggingService implements IAuditLoggingService {
  private auditEntries: Map<string, AuditEntry> = new Map();
  private agentAuditHistory: Map<string, AuditEntry[]> = new Map();
  private context: string;

  constructor(context: string = 'universal') {
    this.context = context;
    console.log(`📝 [${this.context}] Audit Logging Service initialized`);
  }

  // ============================================================================
  // AUDIT ENTRY MANAGEMENT
  // ============================================================================

  async createAuditEntry(interaction: Partial<AuditEntry>): Promise<AuditEntry> {
    try {
      console.log(`📝 [${this.context}] Creating audit entry for agent ${interaction.agent_id}`);
      
      // Generate unique interaction ID if not provided
      const interactionId = interaction.interaction_id || `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create comprehensive audit entry with all 47+ fields
      const auditEntry: AuditEntry = {
        // Core identification
        interaction_id: interactionId,
        agent_id: interaction.agent_id || 'unknown',
        user_id: interaction.user_id || 'unknown',
        session_id: interaction.session_id || `session_${Date.now()}`,
        timestamp: interaction.timestamp || new Date(),
        
        // Interaction details
        user_message: interaction.user_message || '',
        agent_response: interaction.agent_response || '',
        response_time_ms: interaction.response_time_ms || 0,
        token_count: interaction.token_count || 0,
        
        // Governance context
        trust_score_before: interaction.trust_score_before || 0.75,
        trust_score_after: interaction.trust_score_after || 0.75,
        trust_impact: interaction.trust_impact || 0,
        autonomy_level: interaction.autonomy_level || 'basic',
        governance_mode: interaction.governance_mode || 'governed',
        
        // Policy compliance
        policies_checked: interaction.policies_checked || [],
        policy_violations: interaction.policy_violations || [],
        compliance_score: interaction.compliance_score || 100,
        
        // Cognitive context (12 fields)
        reasoning_depth: interaction.reasoning_depth || this.calculateReasoningDepth(interaction.agent_response || ''),
        confidence_level: interaction.confidence_level || this.calculateConfidenceLevel(interaction.agent_response || ''),
        uncertainty_level: interaction.uncertainty_level || this.calculateUncertaintyLevel(interaction.agent_response || ''),
        complexity_assessment: interaction.complexity_assessment || this.assessComplexity(interaction.user_message || ''),
        topic_sensitivity: interaction.topic_sensitivity || this.assessTopicSensitivity(interaction.user_message || ''),
        emotional_intelligence_applied: interaction.emotional_intelligence_applied || this.detectEmotionalIntelligence(interaction.agent_response || ''),
        self_questioning_performed: interaction.self_questioning_performed || this.detectSelfQuestioning(interaction.agent_response || ''),
        governance_awareness_level: interaction.governance_awareness_level || this.assessGovernanceAwareness(interaction.agent_response || ''),
        policy_consideration_depth: interaction.policy_consideration_depth || this.assessPolicyConsideration(interaction.agent_response || ''),
        trust_awareness_demonstrated: interaction.trust_awareness_demonstrated || this.detectTrustAwareness(interaction.agent_response || ''),
        learning_indicators: interaction.learning_indicators || this.identifyLearningIndicators(interaction.agent_response || ''),
        cognitive_load_assessment: interaction.cognitive_load_assessment || this.assessCognitiveLoad(interaction.user_message || '', interaction.agent_response || ''),
        
        // Autonomous cognition tracking (12+ fields)
        autonomous_thinking_triggered: interaction.autonomous_thinking_triggered || false,
        autonomous_thinking_permission_requested: interaction.autonomous_thinking_permission_requested || false,
        autonomous_thinking_permission_granted: interaction.autonomous_thinking_permission_granted || false,
        autonomous_thinking_auto_granted: interaction.autonomous_thinking_auto_granted || false,
        autonomous_thinking_duration_ms: interaction.autonomous_thinking_duration_ms || 0,
        autonomous_thinking_depth: interaction.autonomous_thinking_depth || 0,
        autonomous_thinking_topics: interaction.autonomous_thinking_topics || [],
        autonomous_thinking_outcomes: interaction.autonomous_thinking_outcomes || [],
        autonomous_thinking_trust_impact: interaction.autonomous_thinking_trust_impact || 0,
        autonomous_thinking_policy_compliance: interaction.autonomous_thinking_policy_compliance || true,
        autonomous_thinking_user_notification: interaction.autonomous_thinking_user_notification || false,
        autonomous_thinking_safety_assessment: interaction.autonomous_thinking_safety_assessment || 1.0,
        autonomous_thinking_intervention_required: interaction.autonomous_thinking_intervention_required || false,
        
        // Emotional veritas integration (6 fields)
        user_emotional_state: interaction.user_emotional_state || this.analyzeUserEmotionalState(interaction.user_message || ''),
        agent_emotional_response: interaction.agent_emotional_response || this.analyzeAgentEmotionalResponse(interaction.agent_response || ''),
        emotional_appropriateness_score: interaction.emotional_appropriateness_score || this.calculateEmotionalAppropriateness(interaction.user_message || '', interaction.agent_response || ''),
        empathy_demonstrated: interaction.empathy_demonstrated || this.detectEmpathy(interaction.agent_response || ''),
        emotional_safety_maintained: interaction.emotional_safety_maintained || this.assessEmotionalSafety(interaction.agent_response || ''),
        emotional_intelligence_score: interaction.emotional_intelligence_score || this.calculateEmotionalIntelligenceScore(interaction.agent_response || ''),
        
        // Session and security context
        session_integrity_score: interaction.session_integrity_score || 1.0,
        cryptographic_hash: interaction.cryptographic_hash || this.generateCryptographicHash(interactionId, interaction.agent_response || ''),
        audit_trail_version: interaction.audit_trail_version || '2.0',
        
        // Extension data
        extension_data: interaction.extension_data || {},
        
        // Metadata
        environment: interaction.environment || this.context,
        client_info: interaction.client_info || 'shared-governance-service',
        error_occurred: interaction.error_occurred || false,
        error_details: interaction.error_details
      };

      // Store audit entry
      this.auditEntries.set(interactionId, auditEntry);
      
      // Add to agent's audit history
      const agentHistory = this.agentAuditHistory.get(auditEntry.agent_id) || [];
      agentHistory.push(auditEntry);
      this.agentAuditHistory.set(auditEntry.agent_id, agentHistory);

      console.log(`✅ [${this.context}] Audit entry created:`, {
        interactionId,
        agentId: auditEntry.agent_id,
        trustImpact: auditEntry.trust_impact,
        complianceScore: auditEntry.compliance_score,
        autonomousThinking: auditEntry.autonomous_thinking_triggered
      });

      return auditEntry;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to create audit entry:`, error);
      throw new Error(`Failed to create audit entry: ${error.message}`);
    }
  }

  async getAuditEntry(interactionId: string): Promise<AuditEntry | null> {
    try {
      const entry = this.auditEntries.get(interactionId);
      
      if (entry) {
        console.log(`✅ [${this.context}] Audit entry retrieved: ${interactionId}`);
      } else {
        console.log(`⚠️ [${this.context}] Audit entry not found: ${interactionId}`);
      }
      
      return entry || null;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get audit entry:`, error);
      return null;
    }
  }

  async updateAuditEntry(interactionId: string, updates: Partial<AuditEntry>): Promise<AuditEntry> {
    try {
      console.log(`🔄 [${this.context}] Updating audit entry: ${interactionId}`);
      
      const existingEntry = this.auditEntries.get(interactionId);
      if (!existingEntry) {
        throw new Error(`Audit entry not found: ${interactionId}`);
      }

      // Merge updates with existing entry
      const updatedEntry: AuditEntry = {
        ...existingEntry,
        ...updates,
        // Ensure core fields are not overwritten
        interaction_id: existingEntry.interaction_id,
        timestamp: existingEntry.timestamp
      };

      // Store updated entry
      this.auditEntries.set(interactionId, updatedEntry);

      // Update in agent history
      const agentHistory = this.agentAuditHistory.get(updatedEntry.agent_id) || [];
      const entryIndex = agentHistory.findIndex(entry => entry.interaction_id === interactionId);
      if (entryIndex !== -1) {
        agentHistory[entryIndex] = updatedEntry;
        this.agentAuditHistory.set(updatedEntry.agent_id, agentHistory);
      }

      console.log(`✅ [${this.context}] Audit entry updated: ${interactionId}`);

      return updatedEntry;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to update audit entry:`, error);
      throw new Error(`Failed to update audit entry: ${error.message}`);
    }
  }

  // ============================================================================
  // AUDIT HISTORY
  // ============================================================================

  async getAuditHistory(agentId: string, filters?: AuditFilters): Promise<AuditEntry[]> {
    try {
      console.log(`📚 [${this.context}] Getting audit history for agent ${agentId}`);
      
      let history = this.agentAuditHistory.get(agentId) || [];
      
      // Apply filters if provided
      if (filters) {
        history = this.applyFilters(history, filters);
      }

      console.log(`✅ [${this.context}] Audit history retrieved:`, {
        agentId,
        entries: history.length,
        filtered: !!filters
      });

      return history;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get audit history:`, error);
      return [];
    }
  }

  async getAuditHistoryByUser(userId: string, filters?: AuditFilters): Promise<AuditEntry[]> {
    try {
      console.log(`👤 [${this.context}] Getting audit history for user ${userId}`);
      
      // Get all audit entries for the user
      const allEntries = Array.from(this.auditEntries.values());
      let userEntries = allEntries.filter(entry => entry.user_id === userId);
      
      // Apply filters if provided
      if (filters) {
        userEntries = this.applyFilters(userEntries, filters);
      }

      console.log(`✅ [${this.context}] User audit history retrieved:`, {
        userId,
        entries: userEntries.length
      });

      return userEntries;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get user audit history:`, error);
      return [];
    }
  }

  async getAuditHistoryBySession(sessionId: string): Promise<AuditEntry[]> {
    try {
      console.log(`🔗 [${this.context}] Getting audit history for session ${sessionId}`);
      
      const allEntries = Array.from(this.auditEntries.values());
      const sessionEntries = allEntries.filter(entry => entry.session_id === sessionId);

      console.log(`✅ [${this.context}] Session audit history retrieved:`, {
        sessionId,
        entries: sessionEntries.length
      });

      return sessionEntries;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get session audit history:`, error);
      return [];
    }
  }

  // ============================================================================
  // BEHAVIORAL ANALYSIS
  // ============================================================================

  async analyzeBehavioralPatterns(agentId: string): Promise<BehavioralPatterns> {
    try {
      console.log(`🔍 [${this.context}] Analyzing behavioral patterns for agent ${agentId}`);
      
      const history = await this.getAuditHistory(agentId);
      
      if (history.length < 5) {
        console.log(`⚠️ [${this.context}] Insufficient data for pattern analysis (${history.length} entries)`);
        return {
          agentId,
          patterns: [],
          insights: [],
          recommendations: ['Collect more interaction data for meaningful pattern analysis'],
          confidence: 0.1,
          analysisDate: new Date()
        };
      }

      const patterns = await this.identifyBehavioralPatterns(history);
      const insights = await this.generateBehavioralInsights(history, patterns);
      const recommendations = this.generateRecommendations(patterns, insights);

      const behavioralPatterns: BehavioralPatterns = {
        agentId,
        patterns,
        insights,
        recommendations,
        confidence: this.calculateAnalysisConfidence(history, patterns),
        analysisDate: new Date()
      };

      console.log(`✅ [${this.context}] Behavioral patterns analyzed:`, {
        agentId,
        patterns: patterns.length,
        insights: insights.length,
        confidence: behavioralPatterns.confidence
      });

      return behavioralPatterns;
    } catch (error) {
      console.error(`❌ [${this.context}] Behavioral pattern analysis failed:`, error);
      throw new Error(`Behavioral pattern analysis failed: ${error.message}`);
    }
  }

  async generateLearningInsights(agentId: string): Promise<any[]> {
    try {
      console.log(`🧠 [${this.context}] Generating learning insights for agent ${agentId}`);
      
      const history = await this.getAuditHistory(agentId);
      const insights = [];

      // Analyze learning indicators over time
      const learningData = history.map(entry => ({
        timestamp: entry.timestamp,
        learningIndicators: entry.learning_indicators,
        confidenceLevel: entry.confidence_level,
        reasoningDepth: entry.reasoning_depth
      }));

      // Learning progression insight
      if (learningData.length >= 10) {
        const recentData = learningData.slice(-10);
        const oldData = learningData.slice(0, 10);
        
        const recentAvgConfidence = recentData.reduce((sum, d) => sum + d.confidenceLevel, 0) / recentData.length;
        const oldAvgConfidence = oldData.reduce((sum, d) => sum + d.confidenceLevel, 0) / oldData.length;
        
        if (recentAvgConfidence > oldAvgConfidence + 0.1) {
          insights.push({
            type: 'learning_progression',
            description: 'Agent shows improved confidence over time',
            confidence: 0.8,
            data: { improvement: recentAvgConfidence - oldAvgConfidence }
          });
        }
      }

      // Learning indicator frequency
      const allLearningIndicators = history.flatMap(entry => entry.learning_indicators);
      const indicatorFrequency = this.calculateFrequency(allLearningIndicators);
      
      if (indicatorFrequency.size > 0) {
        insights.push({
          type: 'learning_indicators',
          description: 'Most common learning patterns identified',
          confidence: 0.7,
          data: Object.fromEntries(indicatorFrequency)
        });
      }

      console.log(`✅ [${this.context}] Learning insights generated:`, {
        agentId,
        insights: insights.length
      });

      return insights;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to generate learning insights:`, error);
      return [];
    }
  }

  async identifyAnomalies(agentId: string): Promise<any[]> {
    try {
      console.log(`🚨 [${this.context}] Identifying anomalies for agent ${agentId}`);
      
      const history = await this.getAuditHistory(agentId);
      const anomalies = [];

      if (history.length < 10) {
        return anomalies; // Need sufficient data for anomaly detection
      }

      // Calculate baseline metrics
      const baseline = this.calculateBaselineMetrics(history);

      // Check for anomalies in recent entries
      const recentEntries = history.slice(-5);
      
      for (const entry of recentEntries) {
        // Trust score anomalies
        if (Math.abs(entry.trust_impact) > baseline.avgTrustImpact + 2 * baseline.stdTrustImpact) {
          anomalies.push({
            type: 'trust_anomaly',
            description: 'Unusual trust score impact detected',
            severity: Math.abs(entry.trust_impact) > 0.2 ? 'high' : 'medium',
            entry: entry.interaction_id,
            value: entry.trust_impact,
            baseline: baseline.avgTrustImpact
          });
        }

        // Response time anomalies
        if (entry.response_time_ms > baseline.avgResponseTime + 2 * baseline.stdResponseTime) {
          anomalies.push({
            type: 'response_time_anomaly',
            description: 'Unusually long response time detected',
            severity: entry.response_time_ms > baseline.avgResponseTime * 3 ? 'high' : 'medium',
            entry: entry.interaction_id,
            value: entry.response_time_ms,
            baseline: baseline.avgResponseTime
          });
        }

        // Compliance score anomalies
        if (entry.compliance_score < baseline.avgComplianceScore - 2 * baseline.stdComplianceScore) {
          anomalies.push({
            type: 'compliance_anomaly',
            description: 'Unusually low compliance score detected',
            severity: entry.compliance_score < 70 ? 'high' : 'medium',
            entry: entry.interaction_id,
            value: entry.compliance_score,
            baseline: baseline.avgComplianceScore
          });
        }
      }

      console.log(`✅ [${this.context}] Anomalies identified:`, {
        agentId,
        anomalies: anomalies.length
      });

      return anomalies;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to identify anomalies:`, error);
      return [];
    }
  }

  // ============================================================================
  // AUDIT INTEGRITY
  // ============================================================================

  async validateAuditIntegrity(auditEntry: AuditEntry): Promise<boolean> {
    try {
      console.log(`🔒 [${this.context}] Validating audit integrity for entry ${auditEntry.interaction_id}`);
      
      // Validate required fields
      const requiredFields = [
        'interaction_id', 'agent_id', 'user_id', 'session_id', 'timestamp',
        'user_message', 'agent_response', 'trust_score_before', 'trust_score_after'
      ];

      for (const field of requiredFields) {
        if (auditEntry[field] === undefined || auditEntry[field] === null) {
          console.log(`❌ [${this.context}] Missing required field: ${field}`);
          return false;
        }
      }

      // Validate cryptographic hash
      const expectedHash = this.generateCryptographicHash(auditEntry.interaction_id, auditEntry.agent_response);
      if (auditEntry.cryptographic_hash !== expectedHash) {
        console.log(`❌ [${this.context}] Cryptographic hash mismatch`);
        return false;
      }

      // Validate data ranges
      if (auditEntry.trust_score_before < 0 || auditEntry.trust_score_before > 1 ||
          auditEntry.trust_score_after < 0 || auditEntry.trust_score_after > 1) {
        console.log(`❌ [${this.context}] Trust scores out of valid range`);
        return false;
      }

      if (auditEntry.compliance_score < 0 || auditEntry.compliance_score > 100) {
        console.log(`❌ [${this.context}] Compliance score out of valid range`);
        return false;
      }

      console.log(`✅ [${this.context}] Audit integrity validated`);
      return true;
    } catch (error) {
      console.error(`❌ [${this.context}] Audit integrity validation failed:`, error);
      return false;
    }
  }

  async generateCryptographicHash(interactionId: string, content: string): Promise<string> {
    try {
      // Simple hash generation (in production, use proper cryptographic hashing)
      const data = `${interactionId}:${content}:${Date.now()}`;
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to generate cryptographic hash:`, error);
      return 'hash_error';
    }
  }

  async verifyAuditChain(entries: AuditEntry[]): Promise<boolean> {
    try {
      console.log(`🔗 [${this.context}] Verifying audit chain for ${entries.length} entries`);
      
      if (entries.length === 0) return true;

      // Sort entries by timestamp
      const sortedEntries = entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Verify each entry's integrity
      for (const entry of sortedEntries) {
        const isValid = await this.validateAuditIntegrity(entry);
        if (!isValid) {
          console.log(`❌ [${this.context}] Audit chain broken at entry ${entry.interaction_id}`);
          return false;
        }
      }

      // Verify chronological order
      for (let i = 1; i < sortedEntries.length; i++) {
        if (sortedEntries[i].timestamp < sortedEntries[i - 1].timestamp) {
          console.log(`❌ [${this.context}] Audit chain chronological order violated`);
          return false;
        }
      }

      console.log(`✅ [${this.context}] Audit chain verified`);
      return true;
    } catch (error) {
      console.error(`❌ [${this.context}] Audit chain verification failed:`, error);
      return false;
    }
  }

  // ============================================================================
  // CROSS-CONTEXT AUDIT
  // ============================================================================

  async synchronizeAuditEntry(entry: AuditEntry, targets: string[]): Promise<void> {
    try {
      console.log(`🔄 [${this.context}] Synchronizing audit entry across ${targets.length} targets`);
      
      // In a real implementation, this would synchronize with other contexts
      // For now, we'll just log the synchronization
      console.log(`✅ [${this.context}] Audit entry synchronized:`, {
        entryId: entry.interaction_id,
        targets: targets.length
      });
    } catch (error) {
      console.error(`❌ [${this.context}] Audit entry synchronization failed:`, error);
      throw new Error(`Audit entry synchronization failed: ${error.message}`);
    }
  }

  async getAuditEntriesFromAllContexts(agentId: string): Promise<AuditEntry[]> {
    try {
      console.log(`🌐 [${this.context}] Getting audit entries from all contexts for agent ${agentId}`);
      
      // In a real implementation, this would query multiple contexts
      // For now, return the current context's entries
      const entries = await this.getAuditHistory(agentId);
      
      console.log(`✅ [${this.context}] Audit entries retrieved from all contexts:`, {
        agentId,
        entries: entries.length
      });

      return entries;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get audit entries from all contexts:`, error);
      return [];
    }
  }

  async consolidateAuditData(entries: AuditEntry[]): Promise<BehavioralPatterns> {
    try {
      console.log(`🔗 [${this.context}] Consolidating audit data from ${entries.length} entries`);
      
      if (entries.length === 0) {
        return {
          agentId: 'unknown',
          patterns: [],
          insights: [],
          recommendations: [],
          confidence: 0,
          analysisDate: new Date()
        };
      }

      const agentId = entries[0].agent_id;
      const patterns = await this.identifyBehavioralPatterns(entries);
      const insights = await this.generateBehavioralInsights(entries, patterns);
      const recommendations = this.generateRecommendations(patterns, insights);

      const consolidatedData: BehavioralPatterns = {
        agentId,
        patterns,
        insights,
        recommendations,
        confidence: this.calculateAnalysisConfidence(entries, patterns),
        analysisDate: new Date()
      };

      console.log(`✅ [${this.context}] Audit data consolidated:`, {
        agentId,
        patterns: patterns.length,
        insights: insights.length,
        confidence: consolidatedData.confidence
      });

      return consolidatedData;
    } catch (error) {
      console.error(`❌ [${this.context}] Audit data consolidation failed:`, error);
      throw new Error(`Audit data consolidation failed: ${error.message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private applyFilters(entries: AuditEntry[], filters: AuditFilters): AuditEntry[] {
    return entries.filter(entry => {
      // Date range filter
      if (filters.startDate && entry.timestamp < filters.startDate) return false;
      if (filters.endDate && entry.timestamp > filters.endDate) return false;
      
      // Trust score range filter
      if (filters.trustScoreRange) {
        const [min, max] = filters.trustScoreRange;
        if (entry.trust_score_after < min || entry.trust_score_after > max) return false;
      }
      
      // Compliance score range filter
      if (filters.complianceScoreRange) {
        const [min, max] = filters.complianceScoreRange;
        if (entry.compliance_score < min || entry.compliance_score > max) return false;
      }
      
      // Violations filter
      if (filters.hasViolations !== undefined) {
        const hasViolations = entry.policy_violations.length > 0;
        if (filters.hasViolations !== hasViolations) return false;
      }
      
      // Autonomous thinking filter
      if (filters.autonomousThinkingOnly && !entry.autonomous_thinking_triggered) return false;
      
      // Environment filter
      if (filters.environment && entry.environment !== filters.environment) return false;
      
      return true;
    });
  }

  private async identifyBehavioralPatterns(history: AuditEntry[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];

    // Consistency pattern
    const consistencyPattern = this.analyzeConsistencyPattern(history);
    if (consistencyPattern) patterns.push(consistencyPattern);

    // Compliance pattern
    const compliancePattern = this.analyzeCompliancePattern(history);
    if (compliancePattern) patterns.push(compliancePattern);

    // Response time pattern
    const responseTimePattern = this.analyzeResponseTimePattern(history);
    if (responseTimePattern) patterns.push(responseTimePattern);

    // Autonomous thinking pattern
    const autonomyPattern = this.analyzeAutonomyPattern(history);
    if (autonomyPattern) patterns.push(autonomyPattern);

    // Emotional intelligence pattern
    const emotionalPattern = this.analyzeEmotionalPattern(history);
    if (emotionalPattern) patterns.push(emotionalPattern);

    return patterns;
  }

  private async generateBehavioralInsights(history: AuditEntry[], patterns: BehavioralPattern[]): Promise<BehavioralInsight[]> {
    const insights: BehavioralInsight[] = [];

    // Trust trend insight
    if (history.length >= 5) {
      const trustTrend = this.analyzeTrustTrend(history);
      if (trustTrend) insights.push(trustTrend);
    }

    // Performance insight
    const performanceInsight = this.analyzePerformance(history);
    if (performanceInsight) insights.push(performanceInsight);

    // Learning insight
    const learningInsight = this.analyzeLearning(history);
    if (learningInsight) insights.push(learningInsight);

    return insights;
  }

  private generateRecommendations(patterns: BehavioralPattern[], insights: BehavioralInsight[]): string[] {
    const recommendations: string[] = [];

    // Pattern-based recommendations
    patterns.forEach(pattern => {
      if (pattern.impact === 'positive' && pattern.frequency > 0.7) {
        recommendations.push(`Continue ${pattern.patternType} - showing strong positive pattern`);
      } else if (pattern.impact === 'negative' && pattern.frequency > 0.3) {
        recommendations.push(`Address ${pattern.patternType} - showing concerning negative pattern`);
      }
    });

    // Insight-based recommendations
    insights.forEach(insight => {
      if (insight.actionable) {
        recommendations.push(...insight.recommendations);
      }
    });

    // Default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push('Continue current performance level');
      recommendations.push('Monitor behavioral patterns for optimization opportunities');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private calculateAnalysisConfidence(history: AuditEntry[], patterns: BehavioralPattern[]): number {
    // Base confidence on data quantity and pattern consistency
    const dataConfidence = Math.min(1, history.length / 50); // Max confidence at 50+ entries
    const patternConfidence = patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0.5;
    
    return (dataConfidence + patternConfidence) / 2;
  }

  // Cognitive analysis methods
  private calculateReasoningDepth(response: string): number {
    // Analyze response for reasoning indicators
    const reasoningIndicators = ['because', 'therefore', 'however', 'although', 'considering', 'given that'];
    const indicatorCount = reasoningIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(1, indicatorCount / 3); // Normalize to 0-1
  }

  private calculateConfidenceLevel(response: string): number {
    // Analyze response for confidence indicators
    const confidenceIndicators = ['certainly', 'definitely', 'clearly', 'obviously'];
    const uncertaintyIndicators = ['might', 'perhaps', 'possibly', 'maybe', 'uncertain'];
    
    const confidenceCount = confidenceIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    
    const uncertaintyCount = uncertaintyIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    
    return Math.max(0, Math.min(1, 0.5 + (confidenceCount - uncertaintyCount) * 0.1));
  }

  private calculateUncertaintyLevel(response: string): number {
    return 1 - this.calculateConfidenceLevel(response);
  }

  private assessComplexity(message: string): number {
    // Assess message complexity based on length, vocabulary, and structure
    const wordCount = message.split(' ').length;
    const sentenceCount = message.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / Math.max(1, sentenceCount);
    
    // Normalize complexity score
    return Math.min(1, (wordCount / 100 + avgWordsPerSentence / 20) / 2);
  }

  private assessTopicSensitivity(message: string): number {
    // Assess topic sensitivity based on keywords
    const sensitiveTopics = ['medical', 'financial', 'personal', 'private', 'confidential', 'legal'];
    const sensitiveCount = sensitiveTopics.filter(topic => 
      message.toLowerCase().includes(topic)
    ).length;
    
    return Math.min(1, sensitiveCount / 3);
  }

  private detectEmotionalIntelligence(response: string): boolean {
    const emotionalIndicators = ['understand', 'feel', 'empathy', 'support', 'comfort'];
    return emotionalIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
  }

  private detectSelfQuestioning(response: string): boolean {
    const questionIndicators = ['should i', 'am i', 'is this', 'would it be'];
    return questionIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
  }

  private assessGovernanceAwareness(response: string): number {
    const governanceIndicators = ['policy', 'compliance', 'governance', 'regulation', 'guideline'];
    const indicatorCount = governanceIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(1, indicatorCount / 2);
  }

  private assessPolicyConsideration(response: string): number {
    const policyIndicators = ['according to policy', 'guidelines state', 'regulations require'];
    const indicatorCount = policyIndicators.filter(indicator => 
      response.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(1, indicatorCount / 1);
  }

  private detectTrustAwareness(response: string): boolean {
    const trustIndicators = ['trust', 'reliable', 'consistent', 'transparent'];
    return trustIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
  }

  private identifyLearningIndicators(response: string): string[] {
    const indicators: string[] = [];
    
    if (response.toLowerCase().includes('learn')) indicators.push('learning_mentioned');
    if (response.toLowerCase().includes('improve')) indicators.push('improvement_focus');
    if (response.toLowerCase().includes('understand')) indicators.push('understanding_demonstrated');
    if (response.toLowerCase().includes('adapt')) indicators.push('adaptation_capability');
    
    return indicators;
  }

  private assessCognitiveLoad(message: string, response: string): number {
    // Assess cognitive load based on message complexity and response elaboration
    const messageComplexity = this.assessComplexity(message);
    const responseLength = response.length;
    const responseComplexity = this.assessComplexity(response);
    
    return Math.min(1, (messageComplexity + responseComplexity + responseLength / 1000) / 3);
  }

  // Emotional analysis methods
  private analyzeUserEmotionalState(message: string): string {
    const emotionalKeywords = {
      'happy': ['happy', 'joy', 'excited', 'pleased', 'delighted'],
      'sad': ['sad', 'disappointed', 'upset', 'down', 'depressed'],
      'angry': ['angry', 'frustrated', 'annoyed', 'mad', 'furious'],
      'anxious': ['worried', 'anxious', 'nervous', 'concerned', 'stressed'],
      'neutral': []
    };

    for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  private analyzeAgentEmotionalResponse(response: string): string {
    if (response.toLowerCase().includes('sorry') || response.toLowerCase().includes('apologize')) {
      return 'apologetic';
    }
    if (response.toLowerCase().includes('understand') || response.toLowerCase().includes('empathy')) {
      return 'empathetic';
    }
    if (response.toLowerCase().includes('help') || response.toLowerCase().includes('support')) {
      return 'supportive';
    }
    
    return 'professional';
  }

  private calculateEmotionalAppropriateness(message: string, response: string): number {
    const userEmotion = this.analyzeUserEmotionalState(message);
    const agentResponse = this.analyzeAgentEmotionalResponse(response);
    
    // Simple appropriateness scoring
    if (userEmotion === 'sad' && agentResponse === 'empathetic') return 0.9;
    if (userEmotion === 'angry' && agentResponse === 'apologetic') return 0.8;
    if (userEmotion === 'anxious' && agentResponse === 'supportive') return 0.9;
    
    return 0.7; // Default appropriate score
  }

  private detectEmpathy(response: string): boolean {
    const empathyIndicators = ['understand how you feel', 'i can see', 'that must be', 'i empathize'];
    return empathyIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
  }

  private assessEmotionalSafety(response: string): boolean {
    const unsafeIndicators = ['you should feel', 'get over it', 'that\'s wrong', 'you\'re being'];
    return !unsafeIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
  }

  private calculateEmotionalIntelligenceScore(response: string): number {
    let score = 0.5; // Base score
    
    if (this.detectEmpathy(response)) score += 0.2;
    if (this.assessEmotionalSafety(response)) score += 0.2;
    if (this.detectEmotionalIntelligence(response)) score += 0.1;
    
    return Math.min(1, score);
  }

  // Pattern analysis methods
  private analyzeConsistencyPattern(history: AuditEntry[]): BehavioralPattern | null {
    if (history.length < 5) return null;

    const recentEntries = history.slice(-10);
    const responseTimeVariance = this.calculateVariance(recentEntries.map(e => e.response_time_ms));
    const confidenceVariance = this.calculateVariance(recentEntries.map(e => e.confidence_level));
    
    const consistencyScore = 1 - (responseTimeVariance + confidenceVariance) / 2;
    
    if (consistencyScore > 0.7) {
      return {
        patternType: 'consistency',
        description: 'Agent demonstrates consistent behavior patterns',
        frequency: consistencyScore,
        confidence: 0.8,
        examples: recentEntries.slice(0, 3).map(e => `Consistent response in ${e.interaction_id}`),
        impact: 'positive'
      };
    }

    return null;
  }

  private analyzeCompliancePattern(history: AuditEntry[]): BehavioralPattern | null {
    const complianceScores = history.map(e => e.compliance_score);
    const avgCompliance = complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length;
    const violationCount = history.filter(e => e.policy_violations.length > 0).length;
    
    if (avgCompliance > 90 && violationCount < history.length * 0.1) {
      return {
        patternType: 'high_compliance',
        description: `Maintains ${avgCompliance.toFixed(1)}% average compliance`,
        frequency: avgCompliance / 100,
        confidence: 0.9,
        examples: [`Average compliance: ${avgCompliance.toFixed(1)}%`, `Violations: ${violationCount}/${history.length}`],
        impact: 'positive'
      };
    }

    return null;
  }

  private analyzeResponseTimePattern(history: AuditEntry[]): BehavioralPattern | null {
    const responseTimes = history.map(e => e.response_time_ms);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    if (avgResponseTime < 2000) { // Less than 2 seconds average
      return {
        patternType: 'fast_response',
        description: `Maintains fast response times (avg: ${avgResponseTime.toFixed(0)}ms)`,
        frequency: 1 - (avgResponseTime / 5000), // Normalize to 0-1
        confidence: 0.7,
        examples: [`Average response time: ${avgResponseTime.toFixed(0)}ms`],
        impact: 'positive'
      };
    }

    return null;
  }

  private analyzeAutonomyPattern(history: AuditEntry[]): BehavioralPattern | null {
    const autonomousEntries = history.filter(e => e.autonomous_thinking_triggered);
    const autonomyRate = autonomousEntries.length / history.length;
    
    if (autonomyRate > 0.2) { // More than 20% autonomous thinking
      const avgDuration = autonomousEntries.reduce((sum, e) => sum + e.autonomous_thinking_duration_ms, 0) / autonomousEntries.length;
      
      return {
        patternType: 'autonomous_thinking',
        description: `Frequently engages in autonomous thinking (${(autonomyRate * 100).toFixed(1)}% of interactions)`,
        frequency: autonomyRate,
        confidence: 0.8,
        examples: [`Autonomy rate: ${(autonomyRate * 100).toFixed(1)}%`, `Average duration: ${avgDuration.toFixed(0)}ms`],
        impact: 'positive'
      };
    }

    return null;
  }

  private analyzeEmotionalPattern(history: AuditEntry[]): BehavioralPattern | null {
    const emotionalScores = history.map(e => e.emotional_intelligence_score);
    const avgEmotionalScore = emotionalScores.reduce((sum, score) => sum + score, 0) / emotionalScores.length;
    const empathyCount = history.filter(e => e.empathy_demonstrated).length;
    
    if (avgEmotionalScore > 0.8 && empathyCount > history.length * 0.5) {
      return {
        patternType: 'high_emotional_intelligence',
        description: `Demonstrates high emotional intelligence (avg: ${(avgEmotionalScore * 100).toFixed(1)}%)`,
        frequency: avgEmotionalScore,
        confidence: 0.8,
        examples: [`Emotional intelligence: ${(avgEmotionalScore * 100).toFixed(1)}%`, `Empathy demonstrated: ${empathyCount}/${history.length}`],
        impact: 'positive'
      };
    }

    return null;
  }

  // Insight analysis methods
  private analyzeTrustTrend(history: AuditEntry[]): BehavioralInsight | null {
    const recentEntries = history.slice(-5);
    const trustTrend = recentEntries[recentEntries.length - 1].trust_score_after - recentEntries[0].trust_score_before;
    
    if (Math.abs(trustTrend) > 0.05) {
      return {
        insightType: 'trust_trend',
        description: trustTrend > 0 ? 'Trust score is trending upward' : 'Trust score is trending downward',
        confidence: 0.8,
        actionable: true,
        recommendations: trustTrend > 0 
          ? ['Continue current practices', 'Consider increased autonomy']
          : ['Review recent interactions', 'Focus on consistency'],
        evidence: [`Trust change: ${(trustTrend * 100).toFixed(1)}%`]
      };
    }

    return null;
  }

  private analyzePerformance(history: AuditEntry[]): BehavioralInsight | null {
    const avgCompliance = history.reduce((sum, e) => sum + e.compliance_score, 0) / history.length;
    const avgConfidence = history.reduce((sum, e) => sum + e.confidence_level, 0) / history.length;
    
    if (avgCompliance > 90 && avgConfidence > 0.8) {
      return {
        insightType: 'high_performance',
        description: 'Consistently high performance across metrics',
        confidence: 0.9,
        actionable: true,
        recommendations: ['Maintain current performance level', 'Consider leadership responsibilities'],
        evidence: [`Compliance: ${avgCompliance.toFixed(1)}%`, `Confidence: ${(avgConfidence * 100).toFixed(1)}%`]
      };
    }

    return null;
  }

  private analyzeLearning(history: AuditEntry[]): BehavioralInsight | null {
    const learningIndicators = history.flatMap(e => e.learning_indicators);
    const uniqueIndicators = new Set(learningIndicators);
    
    if (uniqueIndicators.size > 3) {
      return {
        insightType: 'active_learning',
        description: 'Demonstrates active learning across multiple areas',
        confidence: 0.7,
        actionable: true,
        recommendations: ['Continue learning focus', 'Share knowledge with other agents'],
        evidence: [`Learning indicators: ${uniqueIndicators.size}`, `Total mentions: ${learningIndicators.length}`]
      };
    }

    return null;
  }

  // Utility methods
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateFrequency(items: string[]): Map<string, number> {
    const frequency = new Map<string, number>();
    
    items.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });
    
    return frequency;
  }

  private calculateBaselineMetrics(history: AuditEntry[]): any {
    const trustImpacts = history.map(e => e.trust_impact);
    const responseTimes = history.map(e => e.response_time_ms);
    const complianceScores = history.map(e => e.compliance_score);
    
    return {
      avgTrustImpact: trustImpacts.reduce((sum, val) => sum + val, 0) / trustImpacts.length,
      stdTrustImpact: Math.sqrt(this.calculateVariance(trustImpacts)),
      avgResponseTime: responseTimes.reduce((sum, val) => sum + val, 0) / responseTimes.length,
      stdResponseTime: Math.sqrt(this.calculateVariance(responseTimes)),
      avgComplianceScore: complianceScores.reduce((sum, val) => sum + val, 0) / complianceScores.length,
      stdComplianceScore: Math.sqrt(this.calculateVariance(complianceScores))
    };
  }
}

