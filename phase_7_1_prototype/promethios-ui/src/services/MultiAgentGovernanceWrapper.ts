/**
 * Multi-Agent Governance Wrapper
 * 
 * Provides comprehensive governance controls for multi-agent systems including
 * emergent behavior detection, cross-platform interaction monitoring, and
 * real-time intervention capabilities for AI debate systems.
 * 
 * Now integrated with UniversalGovernanceAdapter for consistent governance.
 */

import { observerService } from './observers';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface GovernanceEvent {
  id: string;
  type: 'policy_violation' | 'emergent_behavior' | 'trust_threshold_breach' | 'intervention_triggered' | 'drift_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  systemId: string;
  sessionId?: string;
  involvedAgents: string[];
  data: any;
  intervention?: {
    type: string;
    action: string;
    success: boolean;
  };
}

export interface GovernanceState {
  systemId: string;
  sessionId: string;
  governanceEnabled: boolean;
  trustScores: Record<string, number>;
  emergentBehaviors: any[];
  governanceEvents: GovernanceEvent[];
  interventionCount: number;
  lastHealthCheck: string;
  collaborationHealth: number; // 0-100%
}

export interface InterventionResult {
  success: boolean;
  action: string;
  message: string;
  shouldContinue: boolean;
}

export class MultiAgentGovernanceWrapper {
  private governanceStates = new Map<string, GovernanceState>();
  private universalGovernance: UniversalGovernanceAdapter;
  private interventionThresholds = {
    trustScore: 0.3, // Minimum trust score before intervention
    emergentBehaviorSeverity: 'high', // Minimum severity for intervention
    collaborationHealth: 40, // Minimum collaboration health percentage
    maxInterventions: 5 // Maximum interventions per session
  };

  constructor() {
    this.universalGovernance = UniversalGovernanceAdapter.getInstance();
    this.initializeUniversalGovernance();
  }

  private async initializeUniversalGovernance(): Promise<void> {
    try {
      // UniversalGovernanceAdapter initializes automatically in constructor
      console.log('✅ [MultiAgentGov] UniversalGovernanceAdapter initialized');
    } catch (error) {
      console.error('❌ [MultiAgentGov] Failed to initialize UniversalGovernanceAdapter:', error);
    }
  }

  /**
   * Initialize governance for a multi-agent session
   */
  async initializeGovernance(
    systemId: string,
    sessionId: string,
    governanceEnabled: boolean,
    agentIds: string[]
  ): Promise<GovernanceState> {
    console.log('🛡️ GOVERNANCE WRAPPER: Initializing governance for session:', sessionId);
    
    const governanceState: GovernanceState = {
      systemId,
      sessionId,
      governanceEnabled,
      trustScores: {},
      emergentBehaviors: [],
      governanceEvents: [],
      interventionCount: 0,
      lastHealthCheck: new Date().toISOString(),
      collaborationHealth: 100
    };

    // Initialize trust scores for all agents
    agentIds.forEach(agentId => {
      governanceState.trustScores[agentId] = 1.0; // Start with full trust
    });

    this.governanceStates.set(sessionId, governanceState);
    
    if (governanceEnabled) {
      console.log('🛡️ GOVERNANCE WRAPPER: Governance monitoring ACTIVE for session:', sessionId);
      this.logGovernanceEvent(sessionId, {
        type: 'intervention_triggered',
        severity: 'low',
        description: 'Multi-agent governance system initialized and monitoring started',
        involvedAgents: agentIds,
        data: { agentCount: agentIds.length, initialTrustScores: governanceState.trustScores }
      });
    } else {
      console.log('🔓 GOVERNANCE WRAPPER: Governance monitoring DISABLED for session:', sessionId);
    }

    return governanceState;
  }

  /**
   * Monitor agent response for governance violations and emergent behaviors
   */
  async monitorAgentResponse(
    sessionId: string,
    agentId: string,
    agentName: string,
    response: string,
    round: number,
    debateHistory: any[]
  ): Promise<{ violations: any[]; emergentBehaviors: any[]; interventionNeeded: boolean }> {
    const state = this.governanceStates.get(sessionId);
    if (!state || !state.governanceEnabled) {
      return { violations: [], emergentBehaviors: [], interventionNeeded: false };
    }

    console.log(`🛡️ GOVERNANCE MONITOR: Analyzing response from ${agentName} (Round ${round})`);

    const violations = [];
    const emergentBehaviors = [];
    let interventionNeeded = false;

    // 1. CONTENT ANALYSIS
    const contentAnalysis = await this.analyzeResponseContent(response, agentName, debateHistory);
    if (contentAnalysis.violations.length > 0) {
      violations.push(...contentAnalysis.violations);
    }

    // 2. EMERGENT BEHAVIOR DETECTION
    const behaviorAnalysis = await this.detectEmergentBehaviors(
      sessionId, agentId, agentName, response, round, debateHistory
    );
    if (behaviorAnalysis.behaviors.length > 0) {
      emergentBehaviors.push(...behaviorAnalysis.behaviors);
      state.emergentBehaviors.push(...behaviorAnalysis.behaviors);
    }

    // 3. TRUST SCORE UPDATE
    const trustUpdate = this.updateTrustScore(sessionId, agentId, response, violations, emergentBehaviors);
    console.log(`🛡️ TRUST UPDATE: ${agentName} trust score: ${trustUpdate.newScore.toFixed(2)} (${trustUpdate.change > 0 ? '+' : ''}${trustUpdate.change.toFixed(2)})`);

    // 4. INTERVENTION ASSESSMENT
    interventionNeeded = this.assessInterventionNeed(state, violations, emergentBehaviors);

    // 5. LOG GOVERNANCE EVENTS
    if (violations.length > 0) {
      this.logGovernanceEvent(sessionId, {
        type: 'policy_violation',
        severity: this.getMaxSeverity(violations),
        description: `Policy violations detected in ${agentName}'s response`,
        involvedAgents: [agentId],
        data: { violations, response: response.substring(0, 200) + '...' }
      });
    }

    if (emergentBehaviors.length > 0) {
      this.logGovernanceEvent(sessionId, {
        type: 'emergent_behavior',
        severity: this.getMaxSeverity(emergentBehaviors),
        description: `Emergent behaviors detected in ${agentName}'s response`,
        involvedAgents: [agentId],
        data: { behaviors: emergentBehaviors, round }
      });
    }

    if (trustUpdate.newScore < this.interventionThresholds.trustScore) {
      this.logGovernanceEvent(sessionId, {
        type: 'trust_threshold_breach',
        severity: 'high',
        description: `${agentName}'s trust score dropped below threshold (${trustUpdate.newScore.toFixed(2)})`,
        involvedAgents: [agentId],
        data: { oldScore: trustUpdate.oldScore, newScore: trustUpdate.newScore, threshold: this.interventionThresholds.trustScore }
      });
      interventionNeeded = true;
    }

    return { violations, emergentBehaviors, interventionNeeded };
  }

  /**
   * Analyze response content for policy violations
   */
  private async analyzeResponseContent(
    response: string,
    agentName: string,
    debateHistory: any[]
  ): Promise<{ violations: any[] }> {
    const violations = [];

    // Check for harmful content patterns
    const harmfulPatterns = [
      { pattern: /\b(kill|destroy|harm|attack)\b/gi, type: 'violent_language', severity: 'high' },
      { pattern: /\b(hate|discriminat|racist|sexist)\b/gi, type: 'discriminatory_language', severity: 'high' },
      { pattern: /\b(illegal|criminal|fraud)\b/gi, type: 'illegal_content', severity: 'medium' },
      { pattern: /\b(definitely|absolutely|certainly)\s+(wrong|false|incorrect)\b/gi, type: 'absolute_claims', severity: 'low' }
    ];

    harmfulPatterns.forEach(({ pattern, type, severity }) => {
      const matches = response.match(pattern);
      if (matches) {
        violations.push({
          type,
          severity,
          description: `Detected ${type.replace('_', ' ')} in response`,
          matches: matches.slice(0, 3), // Limit to first 3 matches
          agentName
        });
      }
    });

    // Check for role boundary violations
    if (this.detectRoleBoundaryViolation(response, agentName)) {
      violations.push({
        type: 'role_boundary_violation',
        severity: 'medium',
        description: `${agentName} may be stepping outside their assigned role`,
        agentName
      });
    }

    // Check for repetitive content (echo chamber detection)
    if (this.detectEchoChamber(response, debateHistory)) {
      violations.push({
        type: 'echo_chamber',
        severity: 'medium',
        description: 'Response shows signs of echo chamber behavior',
        agentName
      });
    }

    return { violations };
  }

  /**
   * Detect emergent behaviors in agent interactions
   */
  private async detectEmergentBehaviors(
    sessionId: string,
    agentId: string,
    agentName: string,
    response: string,
    round: number,
    debateHistory: any[]
  ): Promise<{ behaviors: any[] }> {
    const behaviors = [];

    // 1. POSITIVE EMERGENCE DETECTION
    
    // Collaborative Innovation: New ideas emerging from interaction
    if (this.detectCollaborativeInnovation(response, debateHistory)) {
      behaviors.push({
        id: `eb_${Date.now()}_innovation`,
        type: 'positive_emergence',
        subtype: 'collaborative_innovation',
        description: `${agentName} developed innovative ideas by building on other agents' contributions`,
        severity: 'medium',
        confidence: 0.75,
        involvedAgents: [agentId],
        round,
        impact: { onSystemPerformance: 15, onGoalAchievement: 20, onTrustScores: 10 }
      });
    }

    // Consensus Acceleration: Faster agreement than expected
    if (round > 1 && this.detectConsensusAcceleration(response, debateHistory)) {
      behaviors.push({
        id: `eb_${Date.now()}_consensus`,
        type: 'positive_emergence',
        subtype: 'consensus_acceleration',
        description: `${agentName} is helping accelerate consensus formation`,
        severity: 'low',
        confidence: 0.65,
        involvedAgents: [agentId],
        round,
        impact: { onSystemPerformance: 10, onGoalAchievement: 15, onTrustScores: 5 }
      });
    }

    // Cross-Platform Synergy: Beneficial interaction between different AI platforms
    if (this.detectCrossPlatformSynergy(response, debateHistory, agentName)) {
      behaviors.push({
        id: `eb_${Date.now()}_synergy`,
        type: 'positive_emergence',
        subtype: 'cross_platform_synergy',
        description: `${agentName} is demonstrating beneficial cross-platform AI collaboration`,
        severity: 'medium',
        confidence: 0.80,
        involvedAgents: [agentId],
        round,
        impact: { onSystemPerformance: 20, onGoalAchievement: 25, onTrustScores: 15 }
      });
    }

    // 2. NEGATIVE EMERGENCE DETECTION

    // Bias Amplification: Reinforcing biases across agents
    if (this.detectBiasAmplification(response, debateHistory)) {
      behaviors.push({
        id: `eb_${Date.now()}_bias`,
        type: 'negative_emergence',
        subtype: 'bias_amplification',
        description: `${agentName} may be amplifying biases from previous responses`,
        severity: 'high',
        confidence: 0.70,
        involvedAgents: [agentId],
        round,
        impact: { onSystemPerformance: -15, onGoalAchievement: -20, onTrustScores: -25 }
      });
    }

    // Hallucination Cascade: False information spreading
    if (this.detectHallucinationCascade(response, debateHistory)) {
      behaviors.push({
        id: `eb_${Date.now()}_hallucination`,
        type: 'negative_emergence',
        subtype: 'hallucination_cascade',
        description: `${agentName} may be building on false information from previous responses`,
        severity: 'critical',
        confidence: 0.60,
        involvedAgents: [agentId],
        round,
        impact: { onSystemPerformance: -30, onGoalAchievement: -35, onTrustScores: -40 }
      });
    }

    // 3. SYSTEM DRIFT DETECTION

    // Goal Deviation: Drifting from original objectives
    if (this.detectGoalDeviation(response, debateHistory)) {
      behaviors.push({
        id: `eb_${Date.now()}_drift`,
        type: 'system_drift',
        subtype: 'goal_deviation',
        description: `${agentName}'s response shows signs of drifting from original objectives`,
        severity: 'medium',
        confidence: 0.65,
        involvedAgents: [agentId],
        round,
        impact: { onSystemPerformance: -10, onGoalAchievement: -20, onTrustScores: -5 }
      });
    }

    return { behaviors };
  }

  /**
   * Update trust score for an agent based on their performance
   */
  private updateTrustScore(
    sessionId: string,
    agentId: string,
    response: string,
    violations: any[],
    emergentBehaviors: any[]
  ): { oldScore: number; newScore: number; change: number } {
    const state = this.governanceStates.get(sessionId);
    if (!state) return { oldScore: 1.0, newScore: 1.0, change: 0 };

    const oldScore = state.trustScores[agentId] || 1.0;
    let scoreChange = 0;

    // Positive adjustments for good behaviors
    const positiveBehaviors = emergentBehaviors.filter(b => b.type === 'positive_emergence');
    scoreChange += positiveBehaviors.length * 0.05;

    // Negative adjustments for violations and bad behaviors
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');
    const mediumViolations = violations.filter(v => v.severity === 'medium');

    scoreChange -= criticalViolations.length * 0.20;
    scoreChange -= highViolations.length * 0.10;
    scoreChange -= mediumViolations.length * 0.05;

    const negativeBehaviors = emergentBehaviors.filter(b => b.type === 'negative_emergence');
    scoreChange -= negativeBehaviors.length * 0.15;

    // Apply change with bounds
    const newScore = Math.max(0, Math.min(1.0, oldScore + scoreChange));
    state.trustScores[agentId] = newScore;

    return { oldScore, newScore, change: scoreChange };
  }

  /**
   * Assess if intervention is needed based on current state
   */
  private assessInterventionNeed(
    state: GovernanceState,
    violations: any[],
    emergentBehaviors: any[]
  ): boolean {
    // Check if we've exceeded maximum interventions
    if (state.interventionCount >= this.interventionThresholds.maxInterventions) {
      return false;
    }

    // Check for critical violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      return true;
    }

    // Check for critical emergent behaviors
    const criticalBehaviors = emergentBehaviors.filter(b => b.severity === 'critical');
    if (criticalBehaviors.length > 0) {
      return true;
    }

    // Check trust scores
    const lowTrustAgents = Object.values(state.trustScores).filter(
      score => score < this.interventionThresholds.trustScore
    );
    if (lowTrustAgents.length > 0) {
      return true;
    }

    // Check collaboration health
    if (state.collaborationHealth < this.interventionThresholds.collaborationHealth) {
      return true;
    }

    return false;
  }

  /**
   * Execute governance intervention
   */
  async executeIntervention(
    sessionId: string,
    reason: string,
    severity: string
  ): Promise<InterventionResult> {
    const state = this.governanceStates.get(sessionId);
    if (!state) {
      return { success: false, action: 'none', message: 'Session not found', shouldContinue: true };
    }

    state.interventionCount++;
    console.log(`🚨 GOVERNANCE INTERVENTION: ${reason} (Severity: ${severity})`);

    let action = 'warning';
    let message = '';
    let shouldContinue = true;

    switch (severity) {
      case 'critical':
        action = 'pause_debate';
        message = '🚨 **GOVERNANCE INTERVENTION**: Critical issue detected. Debate paused for review.';
        shouldContinue = false;
        break;
      
      case 'high':
        action = 'inject_guidance';
        message = '⚠️ **GOVERNANCE GUIDANCE**: Please ensure responses remain focused, factual, and within role boundaries.';
        shouldContinue = true;
        break;
      
      case 'medium':
        action = 'trust_adjustment';
        message = '📊 **GOVERNANCE NOTE**: Trust scores have been adjusted based on recent interactions.';
        shouldContinue = true;
        break;
      
      default:
        action = 'monitoring_alert';
        message = '👁️ **GOVERNANCE MONITORING**: Increased monitoring active for this session.';
        shouldContinue = true;
    }

    this.logGovernanceEvent(sessionId, {
      type: 'intervention_triggered',
      severity: severity as any,
      description: reason,
      involvedAgents: Object.keys(state.trustScores),
      data: { action, interventionCount: state.interventionCount },
      intervention: { type: action, action: message, success: true }
    });

    return { success: true, action, message, shouldContinue };
  }

  /**
   * Get current governance state for a session
   */
  getGovernanceState(sessionId: string): GovernanceState | null {
    return this.governanceStates.get(sessionId) || null;
  }

  /**
   * Log a governance event
   */
  private logGovernanceEvent(sessionId: string, eventData: Partial<GovernanceEvent>): void {
    const state = this.governanceStates.get(sessionId);
    if (!state) return;

    const event: GovernanceEvent = {
      id: `gov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      systemId: state.systemId,
      sessionId,
      ...eventData
    } as GovernanceEvent;

    state.governanceEvents.push(event);
    console.log(`📋 GOVERNANCE EVENT: ${event.type} - ${event.description}`);
  }

  // Helper methods for behavior detection
  private detectRoleBoundaryViolation(response: string, agentName: string): boolean {
    // Simple heuristic: check if agent is claiming expertise outside their role
    const expertiseClaims = /I am an expert in|I specialize in|My expertise is/gi;
    return expertiseClaims.test(response);
  }

  private detectEchoChamber(response: string, debateHistory: any[]): boolean {
    if (debateHistory.length === 0) return false;
    
    // Check for high similarity with previous responses
    const lastResponse = debateHistory[debateHistory.length - 1]?.content || '';
    const similarity = this.calculateTextSimilarity(response, lastResponse);
    return similarity > 0.7; // 70% similarity threshold
  }

  private detectCollaborativeInnovation(response: string, debateHistory: any[]): boolean {
    // Look for phrases indicating building on others' ideas
    const collaborativePatterns = /building on|expanding on|combining.*ideas|innovative approach|new perspective/gi;
    return collaborativePatterns.test(response) && debateHistory.length > 0;
  }

  private detectConsensusAcceleration(response: string, debateHistory: any[]): boolean {
    // Look for agreement and synthesis patterns
    const consensusPatterns = /I agree|consensus|we can conclude|bringing together|unified approach/gi;
    return consensusPatterns.test(response);
  }

  private detectCrossPlatformSynergy(response: string, debateHistory: any[], agentName: string): boolean {
    // Look for references to other agents by name
    const agentReferences = debateHistory
      .map(entry => entry.agentName)
      .filter(name => name !== agentName)
      .some(name => response.toLowerCase().includes(name.toLowerCase()));
    
    return agentReferences && response.length > 200; // Substantial response with cross-references
  }

  private detectBiasAmplification(response: string, debateHistory: any[]): boolean {
    // Simple heuristic: check for absolute statements that reinforce previous absolute statements
    const absolutePatterns = /always|never|all|none|every|completely|totally/gi;
    const currentAbsolutes = (response.match(absolutePatterns) || []).length;
    
    if (currentAbsolutes > 2 && debateHistory.length > 0) {
      const lastResponse = debateHistory[debateHistory.length - 1]?.content || '';
      const lastAbsolutes = (lastResponse.match(absolutePatterns) || []).length;
      return lastAbsolutes > 1; // Both responses have multiple absolute statements
    }
    
    return false;
  }

  private detectHallucinationCascade(response: string, debateHistory: any[]): boolean {
    // Look for specific claims that build on potentially false information
    const specificClaims = /according to|studies show|research indicates|data suggests/gi;
    const hasSpecificClaims = specificClaims.test(response);
    
    // Check if previous responses also made specific claims (potential cascade)
    if (hasSpecificClaims && debateHistory.length > 0) {
      const recentResponses = debateHistory.slice(-2);
      return recentResponses.some(entry => specificClaims.test(entry.content));
    }
    
    return false;
  }

  private detectGoalDeviation(response: string, debateHistory: any[]): boolean {
    // Simple heuristic: check if response is getting too abstract or off-topic
    const abstractPatterns = /philosophy|theoretical|hypothetical|in general|broadly speaking/gi;
    const abstractCount = (response.match(abstractPatterns) || []).length;
    
    return abstractCount > 2 && response.length > 300; // Long, abstract response
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity calculation
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  private getMaxSeverity(items: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const maxSeverity = items.reduce((max, item) => {
      const currentIndex = severityOrder.indexOf(item.severity);
      const maxIndex = severityOrder.indexOf(max);
      return currentIndex > maxIndex ? item.severity : max;
    }, 'low');
    
    return maxSeverity as 'low' | 'medium' | 'high' | 'critical';
  }
}

// Export singleton instance
export const multiAgentGovernanceWrapper = new MultiAgentGovernanceWrapper();

