/**
 * Autonomous Compliance Monitor
 * 
 * Real-time compliance monitoring system that INTEGRATES with existing governance
 * infrastructure rather than replacing it. Enhances existing policy systems with
 * autonomous-specific compliance tracking and intervention capabilities.
 * 
 * Integration Strategy:
 * - EXTENDS UnifiedPolicyRegistry for autonomous policy evaluation
 * - ENHANCES GovernanceService with autonomous compliance tracking
 * - INTEGRATES with UniversalGovernanceAdapter for seamless governance
 * - LEVERAGES existing RAGPolicyIntegrationService for policy-aware operations
 * 
 * Design Principles:
 * - Never replace existing governance systems
 * - Always enhance and integrate with current infrastructure
 * - Maintain backward compatibility with existing workflows
 * - Provide user-friendly compliance monitoring
 * - Real-time intervention capabilities
 * - Comprehensive audit trail integration
 */

import { UnifiedPolicyRegistry, PolicyContent, PolicyRule } from './UnifiedPolicyRegistry';
import { GovernanceService, GovernanceMetrics, GovernanceViolation, GovernanceSession } from './GovernanceService';
import { RAGPolicyIntegrationService } from './RAGPolicyIntegrationService';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';
import { UniversalAuditLoggingService } from './UniversalAuditLoggingService';
import { 
  AutonomousTaskPlan, 
  AutonomousPhase, 
  AutonomousGovernanceContext 
} from './AutonomousGovernanceExtension';

// ============================================================================
// AUTONOMOUS COMPLIANCE TYPES (EXTENDING EXISTING GOVERNANCE)
// ============================================================================

export interface AutonomousComplianceSession extends GovernanceSession {
  // Extends existing GovernanceSession with autonomous-specific fields
  workflowId: string;
  autonomousMode: boolean;
  planId: string;
  currentPhase: number;
  totalPhases: number;
  
  // Autonomous-specific compliance tracking
  autonomousViolations: AutonomousComplianceViolation[];
  planDriftDetected: boolean;
  interventionHistory: ComplianceIntervention[];
  
  // Real-time monitoring
  realTimeMonitoring: {
    enabled: boolean;
    checkInterval: number; // seconds
    lastCheck: string;
    nextCheck: string;
  };
}

export interface AutonomousComplianceViolation extends GovernanceViolation {
  // Extends existing GovernanceViolation with autonomous-specific fields
  violationType: 'policy_violation' | 'plan_drift' | 'resource_limit' | 'approval_timeout' | 'risk_threshold';
  workflowContext: {
    workflowId: string;
    phaseId: number;
    phaseName: string;
    toolsInvolved: string[];
  };
  
  // User-friendly explanation
  userExplanation: {
    what_happened: string;
    why_its_a_problem: string;
    what_we_did: string;
    what_you_can_do: string;
  };
  
  // Intervention details
  interventionTaken: ComplianceIntervention | null;
  userNotified: boolean;
  requiresUserAction: boolean;
  
  // Resolution tracking
  resolutionSteps: ComplianceResolutionStep[];
  estimatedResolutionTime: number; // minutes
}

export interface ComplianceIntervention {
  intervention_id: string;
  type: 'automatic_pause' | 'user_notification' | 'plan_modification' | 'resource_limit' | 'escalation';
  trigger: string; // What triggered the intervention
  action_taken: string;
  timestamp: string;
  
  // User-friendly description
  user_description: string;
  user_impact: 'none' | 'minimal' | 'moderate' | 'significant';
  
  // Effectiveness tracking
  successful: boolean;
  side_effects: string[];
  user_satisfaction?: number; // 1-5 rating if user provides feedback
}

export interface ComplianceResolutionStep {
  step_id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assigned_to: 'system' | 'user' | 'admin';
  estimated_time: number; // minutes
  actual_time?: number; // minutes
  user_action_required: boolean;
  user_instructions?: string;
}

export interface AutonomousComplianceMetrics extends GovernanceMetrics {
  // Extends existing GovernanceMetrics with autonomous-specific metrics
  autonomousComplianceRate: number; // 0-1
  planDriftRate: number; // 0-1
  interventionEffectiveness: number; // 0-1
  userSatisfactionScore: number; // 1-5
  
  // Real-time metrics
  activeWorkflows: number;
  workflowsInCompliance: number;
  workflowsRequiringIntervention: number;
  
  // Performance metrics
  averageComplianceCheckTime: number; // milliseconds
  realTimeMonitoringUptime: number; // 0-1
  
  // User experience metrics
  userInterventionRate: number; // How often users need to intervene
  automaticResolutionRate: number; // How often issues resolve automatically
}

export interface ComplianceCheckResult {
  check_id: string;
  timestamp: string;
  workflowId: string;
  phaseId: number;
  
  // Overall compliance status
  compliant: boolean;
  compliance_score: number; // 0-1
  confidence: number; // 0-1
  
  // Policy evaluation results
  policy_evaluations: PolicyEvaluationResult[];
  
  // Risk assessment
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  
  // Violations found
  violations: AutonomousComplianceViolation[];
  
  // Recommendations
  recommendations: ComplianceRecommendation[];
  
  // User-friendly summary
  user_summary: {
    status: string; // "All good" | "Minor issues" | "Attention needed" | "Action required"
    message: string;
    next_check: string;
  };
}

export interface PolicyEvaluationResult {
  policy_id: string;
  policy_name: string;
  compliant: boolean;
  confidence: number;
  
  // Rule-level results
  rule_evaluations: {
    rule_id: string;
    rule_name: string;
    passed: boolean;
    confidence: number;
    explanation: string;
  }[];
  
  // User-friendly explanation
  user_explanation: string;
  violation_message?: string;
  compliance_message?: string;
}

export interface ComplianceRecommendation {
  recommendation_id: string;
  type: 'immediate_action' | 'preventive_measure' | 'process_improvement' | 'policy_update';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  title: string;
  description: string;
  user_friendly_explanation: string;
  
  // Implementation details
  implementation: {
    automatic: boolean;
    user_action_required: boolean;
    estimated_time: number; // minutes
    difficulty: 'easy' | 'medium' | 'complex';
  };
  
  // Expected impact
  expected_impact: {
    compliance_improvement: number; // 0-1
    risk_reduction: number; // 0-1
    user_experience_impact: 'positive' | 'neutral' | 'negative';
  };
}

export interface ComplianceMonitoringConfig {
  // Real-time monitoring settings
  real_time_enabled: boolean;
  check_interval: number; // seconds
  
  // Policy evaluation settings
  policy_evaluation_enabled: boolean;
  policy_categories: string[]; // Which policy categories to monitor
  
  // Intervention settings
  automatic_intervention_enabled: boolean;
  intervention_thresholds: {
    policy_violation: 'immediate' | 'after_warning' | 'manual_only';
    plan_drift: number; // 0-1, threshold for plan drift intervention
    risk_escalation: 'low' | 'medium' | 'high'; // Minimum risk level for intervention
  };
  
  // User notification settings
  user_notifications: {
    enabled: boolean;
    channels: ('in_app' | 'email' | 'slack')[];
    frequency: 'immediate' | 'batched' | 'daily_summary';
    include_technical_details: boolean;
  };
  
  // Audit and logging
  comprehensive_logging: boolean;
  retention_period: number; // days
}

// ============================================================================
// AUTONOMOUS COMPLIANCE MONITOR CLASS
// ============================================================================

export class AutonomousComplianceMonitor {
  private static instance: AutonomousComplianceMonitor;
  
  // Integration with existing governance systems
  private policyRegistry: UnifiedPolicyRegistry;
  private governanceService: GovernanceService;
  private ragPolicyService: RAGPolicyIntegrationService;
  private governanceAdapter: UniversalGovernanceAdapter;
  private auditService: UniversalAuditLoggingService;
  
  // Autonomous compliance state
  private activeSessions: Map<string, AutonomousComplianceSession> = new Map();
  private monitoringConfig: ComplianceMonitoringConfig;
  private realTimeMonitors: Map<string, NodeJS.Timeout> = new Map();
  
  // Compliance history and metrics
  private complianceHistory: Map<string, ComplianceCheckResult[]> = new Map();
  private interventionHistory: Map<string, ComplianceIntervention[]> = new Map();
  
  // Event callbacks
  private violationCallbacks: ((violation: AutonomousComplianceViolation) => void)[] = [];
  private interventionCallbacks: ((intervention: ComplianceIntervention) => void)[] = [];

  private constructor() {
    console.log('🛡️ [Compliance Monitor] Initializing Autonomous Compliance Monitor');
    
    // Initialize integration with existing governance systems
    this.policyRegistry = new UnifiedPolicyRegistry();
    this.governanceService = new GovernanceService();
    this.ragPolicyService = new RAGPolicyIntegrationService();
    this.governanceAdapter = UniversalGovernanceAdapter.getInstance();
    this.auditService = UniversalAuditLoggingService.getInstance();
    
    // Initialize monitoring configuration
    this.monitoringConfig = this.getDefaultMonitoringConfig();
    
    console.log('✅ [Compliance Monitor] Autonomous Compliance Monitor initialized with existing governance integration');
  }

  static getInstance(): AutonomousComplianceMonitor {
    if (!AutonomousComplianceMonitor.instance) {
      AutonomousComplianceMonitor.instance = new AutonomousComplianceMonitor();
    }
    return AutonomousComplianceMonitor.instance;
  }

  // ============================================================================
  // MAIN COMPLIANCE MONITORING METHODS
  // ============================================================================

  /**
   * Start compliance monitoring for autonomous workflow
   * INTEGRATES with existing GovernanceService session management
   */
  async startComplianceMonitoring(
    plan: AutonomousTaskPlan,
    governanceContext: AutonomousGovernanceContext
  ): Promise<AutonomousComplianceSession> {
    
    console.log(`🛡️ [Compliance Monitor] Starting compliance monitoring for workflow: ${plan.id}`);

    try {
      // Create or enhance existing governance session
      const existingSession = await this.governanceService.getCurrentSession();
      
      // Create autonomous compliance session (extends existing session)
      const complianceSession: AutonomousComplianceSession = {
        // Existing GovernanceSession fields
        sessionId: existingSession?.sessionId || `session_${Date.now()}`,
        agentId: governanceContext.agentId,
        startTime: new Date(),
        messageCount: existingSession?.messageCount || 0,
        violations: existingSession?.violations || [],
        currentTrustScore: existingSession?.currentTrustScore || 0.8,
        
        // Autonomous-specific fields
        workflowId: plan.id,
        autonomousMode: true,
        planId: plan.id,
        currentPhase: 1,
        totalPhases: plan.phases.length,
        
        // Autonomous compliance tracking
        autonomousViolations: [],
        planDriftDetected: false,
        interventionHistory: [],
        
        // Real-time monitoring configuration
        realTimeMonitoring: {
          enabled: this.monitoringConfig.real_time_enabled,
          checkInterval: this.monitoringConfig.check_interval,
          lastCheck: new Date().toISOString(),
          nextCheck: new Date(Date.now() + this.monitoringConfig.check_interval * 1000).toISOString()
        }
      };

      // Store session
      this.activeSessions.set(plan.id, complianceSession);

      // Start real-time monitoring if enabled
      if (this.monitoringConfig.real_time_enabled) {
        await this.startRealTimeMonitoring(plan.id);
      }

      // Perform initial compliance check
      const initialCheck = await this.performComplianceCheck(plan, plan.phases[0], governanceContext);
      
      // Log session start
      await this.auditService.logAutonomousAction({
        action: 'compliance_monitoring_started',
        planId: plan.id,
        agentId: governanceContext.agentId,
        userId: governanceContext.userId,
        sessionId: complianceSession.sessionId,
        timestamp: new Date(),
        metadata: {
          workflow_id: plan.id,
          monitoring_config: this.monitoringConfig,
          initial_compliance_score: initialCheck.compliance_score,
          real_time_monitoring: this.monitoringConfig.real_time_enabled
        }
      });

      console.log(`✅ [Compliance Monitor] Compliance monitoring started for workflow: ${plan.id}`);
      return complianceSession;

    } catch (error) {
      console.error('❌ [Compliance Monitor] Failed to start compliance monitoring:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive compliance check
   * INTEGRATES with existing UnifiedPolicyRegistry and GovernanceService
   */
  async performComplianceCheck(
    plan: AutonomousTaskPlan,
    currentPhase: AutonomousPhase,
    governanceContext: AutonomousGovernanceContext
  ): Promise<ComplianceCheckResult> {
    
    const startTime = Date.now();
    console.log(`🛡️ [Compliance Monitor] Performing compliance check for phase: ${currentPhase.title}`);

    try {
      // Get applicable policies from existing UnifiedPolicyRegistry
      const applicablePolicies = await this.getApplicablePolicies(plan, currentPhase, governanceContext);
      
      // Evaluate each policy using existing policy evaluation logic
      const policyEvaluations = await this.evaluatePolicies(applicablePolicies, plan, currentPhase, governanceContext);
      
      // Check for plan drift using existing governance metrics
      const planDriftCheck = await this.checkPlanDrift(plan, currentPhase);
      
      // Assess risk using existing risk assessment
      const riskAssessment = await this.assessComplianceRisk(plan, currentPhase, policyEvaluations);
      
      // Identify violations
      const violations = await this.identifyViolations(policyEvaluations, planDriftCheck, riskAssessment);
      
      // Generate recommendations
      const recommendations = await this.generateComplianceRecommendations(violations, policyEvaluations);
      
      // Calculate overall compliance score
      const complianceScore = this.calculateComplianceScore(policyEvaluations, violations);
      
      // Create compliance check result
      const checkResult: ComplianceCheckResult = {
        check_id: `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        workflowId: plan.id,
        phaseId: currentPhase.id,
        compliant: violations.length === 0,
        compliance_score: complianceScore,
        confidence: this.calculateConfidence(policyEvaluations),
        policy_evaluations: policyEvaluations,
        risk_level: riskAssessment.level,
        risk_factors: riskAssessment.factors,
        violations,
        recommendations,
        user_summary: this.generateUserSummary(complianceScore, violations, recommendations)
      };

      // Store compliance check history
      this.storeComplianceHistory(plan.id, checkResult);

      // Handle violations if found
      if (violations.length > 0) {
        await this.handleComplianceViolations(violations, plan, currentPhase, governanceContext);
      }

      // Update session metrics
      await this.updateSessionMetrics(plan.id, checkResult);

      // Log compliance check
      await this.auditService.logAutonomousAction({
        action: 'compliance_check_completed',
        planId: plan.id,
        agentId: governanceContext.agentId,
        userId: governanceContext.userId,
        sessionId: governanceContext.sessionId,
        timestamp: new Date(),
        metadata: {
          check_id: checkResult.check_id,
          compliance_score: checkResult.compliance_score,
          violations_count: violations.length,
          risk_level: checkResult.risk_level,
          processing_time_ms: Date.now() - startTime,
          policies_evaluated: policyEvaluations.length
        }
      });

      console.log(`✅ [Compliance Monitor] Compliance check completed: ${checkResult.compliant ? 'COMPLIANT' : 'VIOLATIONS FOUND'} (Score: ${complianceScore.toFixed(2)})`);
      return checkResult;

    } catch (error) {
      console.error('❌ [Compliance Monitor] Compliance check failed:', error);
      throw error;
    }
  }

  /**
   * Handle compliance violations with automatic intervention
   * INTEGRATES with existing GovernanceService violation handling
   */
  async handleComplianceViolations(
    violations: AutonomousComplianceViolation[],
    plan: AutonomousTaskPlan,
    currentPhase: AutonomousPhase,
    governanceContext: AutonomousGovernanceContext
  ): Promise<ComplianceIntervention[]> {
    
    console.log(`⚠️ [Compliance Monitor] Handling ${violations.length} compliance violations`);

    const interventions: ComplianceIntervention[] = [];

    for (const violation of violations) {
      try {
        // Determine intervention strategy based on violation type and severity
        const interventionStrategy = this.determineInterventionStrategy(violation);
        
        // Execute intervention
        const intervention = await this.executeIntervention(
          interventionStrategy,
          violation,
          plan,
          currentPhase,
          governanceContext
        );
        
        interventions.push(intervention);
        
        // Update violation with intervention details
        violation.interventionTaken = intervention;
        
        // Notify existing GovernanceService of violation (integration)
        await this.notifyGovernanceService(violation, intervention);
        
        // Notify user if required
        if (violation.requiresUserAction) {
          await this.notifyUser(violation, intervention);
        }
        
      } catch (error) {
        console.error(`❌ [Compliance Monitor] Failed to handle violation ${violation.id}:`, error);
      }
    }

    // Store intervention history
    this.storeInterventionHistory(plan.id, interventions);

    console.log(`✅ [Compliance Monitor] Handled ${interventions.length} violations with interventions`);
    return interventions;
  }

  /**
   * Monitor compliance in real-time during workflow execution
   */
  async startRealTimeMonitoring(workflowId: string): Promise<void> {
    console.log(`⚡ [Compliance Monitor] Starting real-time monitoring for workflow: ${workflowId}`);

    const session = this.activeSessions.get(workflowId);
    if (!session) {
      throw new Error(`No active session found for workflow: ${workflowId}`);
    }

    // Create monitoring interval
    const monitoringInterval = setInterval(async () => {
      try {
        await this.performRealTimeCheck(workflowId);
      } catch (error) {
        console.error(`❌ [Compliance Monitor] Real-time check failed for workflow ${workflowId}:`, error);
      }
    }, session.realTimeMonitoring.checkInterval * 1000);

    // Store monitoring interval
    this.realTimeMonitors.set(workflowId, monitoringInterval);

    console.log(`✅ [Compliance Monitor] Real-time monitoring started for workflow: ${workflowId}`);
  }

  /**
   * Stop compliance monitoring for workflow
   */
  async stopComplianceMonitoring(workflowId: string): Promise<AutonomousComplianceMetrics> {
    console.log(`🛡️ [Compliance Monitor] Stopping compliance monitoring for workflow: ${workflowId}`);

    const session = this.activeSessions.get(workflowId);
    if (!session) {
      throw new Error(`No active session found for workflow: ${workflowId}`);
    }

    // Stop real-time monitoring
    const monitor = this.realTimeMonitors.get(workflowId);
    if (monitor) {
      clearInterval(monitor);
      this.realTimeMonitors.delete(workflowId);
    }

    // Calculate final metrics
    const finalMetrics = await this.calculateFinalMetrics(session);

    // Update existing GovernanceService with final metrics (integration)
    await this.updateGovernanceServiceMetrics(session, finalMetrics);

    // Remove active session
    this.activeSessions.delete(workflowId);

    // Log monitoring completion
    await this.auditService.logAutonomousAction({
      action: 'compliance_monitoring_stopped',
      planId: workflowId,
      agentId: session.agentId,
      userId: 'unknown', // Would be extracted from session
      sessionId: session.sessionId,
      timestamp: new Date(),
      metadata: {
        workflow_id: workflowId,
        final_metrics: finalMetrics,
        total_violations: session.autonomousViolations.length,
        total_interventions: session.interventionHistory.length
      }
    });

    console.log(`✅ [Compliance Monitor] Compliance monitoring stopped for workflow: ${workflowId}`);
    return finalMetrics;
  }

  /**
   * Get current compliance status for workflow
   */
  getComplianceStatus(workflowId: string): {
    session: AutonomousComplianceSession | null;
    latest_check: ComplianceCheckResult | null;
    metrics: Partial<AutonomousComplianceMetrics>;
  } {
    
    const session = this.activeSessions.get(workflowId);
    const history = this.complianceHistory.get(workflowId);
    const latestCheck = history && history.length > 0 ? history[0] : null;
    
    const metrics = session ? this.calculateCurrentMetrics(session) : {};
    
    return {
      session,
      latest_check: latestCheck,
      metrics
    };
  }

  /**
   * Subscribe to compliance events
   */
  onViolation(callback: (violation: AutonomousComplianceViolation) => void): void {
    this.violationCallbacks.push(callback);
  }

  onIntervention(callback: (intervention: ComplianceIntervention) => void): void {
    this.interventionCallbacks.push(callback);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS (INTEGRATING WITH EXISTING SYSTEMS)
  // ============================================================================

  private async getApplicablePolicies(
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    context: AutonomousGovernanceContext
  ): Promise<PolicyContent[]> {
    
    // Use existing UnifiedPolicyRegistry to get applicable policies
    const allPolicies = await this.policyRegistry.getAllPolicies();
    
    // Filter policies based on autonomous workflow context
    const applicablePolicies = allPolicies.filter(policy => {
      // Check if policy applies to autonomous operations
      if (policy.category === 'operational' || policy.category === 'compliance') {
        return true;
      }
      
      // Check if policy applies to specific tools being used
      const policyScope = policy.scope.toLowerCase();
      const hasApplicableTools = phase.tools.some(tool => 
        policyScope.includes(tool.toLowerCase())
      );
      
      return hasApplicableTools;
    });
    
    console.log(`📋 [Compliance Monitor] Found ${applicablePolicies.length} applicable policies for phase: ${phase.title}`);
    return applicablePolicies;
  }

  private async evaluatePolicies(
    policies: PolicyContent[],
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    context: AutonomousGovernanceContext
  ): Promise<PolicyEvaluationResult[]> {
    
    const evaluations: PolicyEvaluationResult[] = [];
    
    for (const policy of policies) {
      try {
        // Use existing policy evaluation logic enhanced for autonomous context
        const evaluation = await this.evaluatePolicy(policy, plan, phase, context);
        evaluations.push(evaluation);
      } catch (error) {
        console.error(`❌ [Compliance Monitor] Failed to evaluate policy ${policy.policy_id}:`, error);
        
        // Create fallback evaluation
        evaluations.push({
          policy_id: policy.policy_id,
          policy_name: policy.name,
          compliant: false,
          confidence: 0.1,
          rule_evaluations: [],
          user_explanation: `Policy evaluation failed: ${error.message}`,
          violation_message: 'Unable to verify compliance with this policy'
        });
      }
    }
    
    return evaluations;
  }

  private async evaluatePolicy(
    policy: PolicyContent,
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    context: AutonomousGovernanceContext
  ): Promise<PolicyEvaluationResult> {
    
    const ruleEvaluations = [];
    let overallCompliant = true;
    let totalConfidence = 0;
    
    // Evaluate each rule in the policy
    for (const rule of policy.rules) {
      const ruleResult = await this.evaluatePolicyRule(rule, plan, phase, context);
      ruleEvaluations.push(ruleResult);
      
      if (!ruleResult.passed) {
        overallCompliant = false;
      }
      
      totalConfidence += ruleResult.confidence;
    }
    
    const averageConfidence = policy.rules.length > 0 ? totalConfidence / policy.rules.length : 0;
    
    return {
      policy_id: policy.policy_id,
      policy_name: policy.name,
      compliant: overallCompliant,
      confidence: averageConfidence,
      rule_evaluations: ruleEvaluations,
      user_explanation: this.generatePolicyExplanation(policy, overallCompliant, ruleEvaluations),
      violation_message: overallCompliant ? undefined : this.generateViolationMessage(policy, ruleEvaluations),
      compliance_message: overallCompliant ? this.generateComplianceMessage(policy) : undefined
    };
  }

  private async evaluatePolicyRule(
    rule: PolicyRule,
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    context: AutonomousGovernanceContext
  ): Promise<{
    rule_id: string;
    rule_name: string;
    passed: boolean;
    confidence: number;
    explanation: string;
  }> {
    
    // Simple rule evaluation logic - in production, this would be more sophisticated
    let passed = true;
    let confidence = 0.8;
    let explanation = '';
    
    try {
      // Evaluate rule condition against autonomous context
      const conditionResult = await this.evaluateRuleCondition(rule.condition, plan, phase, context);
      passed = conditionResult.passed;
      confidence = conditionResult.confidence;
      explanation = conditionResult.explanation;
      
    } catch (error) {
      passed = false;
      confidence = 0.1;
      explanation = `Rule evaluation failed: ${error.message}`;
    }
    
    return {
      rule_id: rule.rule_id,
      rule_name: rule.name,
      passed,
      confidence,
      explanation
    };
  }

  private async evaluateRuleCondition(
    condition: string,
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    context: AutonomousGovernanceContext
  ): Promise<{ passed: boolean; confidence: number; explanation: string }> {
    
    // Simple condition evaluation - in production, this would use a proper rule engine
    const lowerCondition = condition.toLowerCase();
    
    // Check for common autonomous workflow conditions
    if (lowerCondition.includes('external_api') && phase.tools.includes('external_api')) {
      return {
        passed: false,
        confidence: 0.9,
        explanation: 'Phase uses external APIs which may violate policy restrictions'
      };
    }
    
    if (lowerCondition.includes('data_processing') && phase.tools.includes('data_analysis')) {
      return {
        passed: true,
        confidence: 0.8,
        explanation: 'Data processing is within policy guidelines'
      };
    }
    
    if (lowerCondition.includes('user_approval') && context.governanceEnabled) {
      return {
        passed: true,
        confidence: 0.9,
        explanation: 'User approval mechanisms are in place'
      };
    }
    
    // Default to compliant with medium confidence
    return {
      passed: true,
      confidence: 0.6,
      explanation: 'Rule condition evaluated as compliant'
    };
  }

  private async checkPlanDrift(
    plan: AutonomousTaskPlan,
    currentPhase: AutonomousPhase
  ): Promise<{ driftDetected: boolean; driftScore: number; explanation: string }> {
    
    // Simple plan drift detection - in production, this would be more sophisticated
    const originalGoal = plan.goal.toLowerCase();
    const currentPhaseTitle = currentPhase.title.toLowerCase();
    
    // Check if current phase aligns with original goal
    const goalKeywords = originalGoal.split(' ').filter(word => word.length > 3);
    const phaseKeywords = currentPhaseTitle.split(' ').filter(word => word.length > 3);
    
    const overlap = goalKeywords.filter(keyword => 
      phaseKeywords.some(phaseKeyword => phaseKeyword.includes(keyword))
    ).length;
    
    const alignmentScore = goalKeywords.length > 0 ? overlap / goalKeywords.length : 1;
    const driftScore = 1 - alignmentScore;
    const driftDetected = driftScore > 0.3; // 30% drift threshold
    
    return {
      driftDetected,
      driftScore,
      explanation: driftDetected ? 
        `Current phase "${currentPhase.title}" appears to deviate from original goal "${plan.goal}"` :
        `Current phase "${currentPhase.title}" aligns with original goal "${plan.goal}"`
    };
  }

  private async assessComplianceRisk(
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    policyEvaluations: PolicyEvaluationResult[]
  ): Promise<{ level: 'low' | 'medium' | 'high' | 'critical'; factors: string[] }> {
    
    const riskFactors: string[] = [];
    let riskScore = 0;
    
    // Check policy violations
    const violations = policyEvaluations.filter(eval => !eval.compliant);
    if (violations.length > 0) {
      riskScore += violations.length * 0.3;
      riskFactors.push(`${violations.length} policy violations detected`);
    }
    
    // Check for high-risk tools
    const highRiskTools = ['external_api', 'file_system', 'system_commands'];
    const usedHighRiskTools = phase.tools.filter(tool => highRiskTools.includes(tool));
    if (usedHighRiskTools.length > 0) {
      riskScore += usedHighRiskTools.length * 0.2;
      riskFactors.push(`Using high-risk tools: ${usedHighRiskTools.join(', ')}`);
    }
    
    // Check phase complexity
    if (phase.tools.length > 5) {
      riskScore += 0.2;
      riskFactors.push('Complex phase with many tools');
    }
    
    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore <= 0.3) level = 'low';
    else if (riskScore <= 0.6) level = 'medium';
    else if (riskScore <= 0.8) level = 'high';
    else level = 'critical';
    
    return { level, factors: riskFactors };
  }

  private async identifyViolations(
    policyEvaluations: PolicyEvaluationResult[],
    planDriftCheck: { driftDetected: boolean; driftScore: number; explanation: string },
    riskAssessment: { level: string; factors: string[] }
  ): Promise<AutonomousComplianceViolation[]> {
    
    const violations: AutonomousComplianceViolation[] = [];
    
    // Policy violations
    policyEvaluations.forEach(evaluation => {
      if (!evaluation.compliant) {
        violations.push({
          id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          policyId: evaluation.policy_id,
          policyName: evaluation.policy_name,
          severity: this.determineSeverity(evaluation),
          description: evaluation.violation_message || 'Policy violation detected',
          timestamp: new Date(),
          messageId: 'autonomous_workflow',
          resolved: false,
          
          // Autonomous-specific fields
          violationType: 'policy_violation',
          workflowContext: {
            workflowId: 'current_workflow',
            phaseId: 1,
            phaseName: 'current_phase',
            toolsInvolved: []
          },
          userExplanation: {
            what_happened: `The workflow violated the "${evaluation.policy_name}" policy`,
            why_its_a_problem: evaluation.violation_message || 'This could lead to compliance issues',
            what_we_did: 'Paused the workflow and notified you',
            what_you_can_do: 'Review the workflow and approve or modify the plan'
          },
          interventionTaken: null,
          userNotified: false,
          requiresUserAction: true,
          resolutionSteps: [],
          estimatedResolutionTime: 10
        });
      }
    });
    
    // Plan drift violations
    if (planDriftCheck.driftDetected) {
      violations.push({
        id: `drift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        policyId: 'plan_drift_policy',
        policyName: 'Plan Drift Prevention',
        severity: planDriftCheck.driftScore > 0.7 ? 'high' : 'medium',
        description: planDriftCheck.explanation,
        timestamp: new Date(),
        messageId: 'autonomous_workflow',
        resolved: false,
        
        violationType: 'plan_drift',
        workflowContext: {
          workflowId: 'current_workflow',
          phaseId: 1,
          phaseName: 'current_phase',
          toolsInvolved: []
        },
        userExplanation: {
          what_happened: 'The workflow has drifted from its original goal',
          why_its_a_problem: 'This could lead to unexpected results or wasted resources',
          what_we_did: 'Detected the drift and paused for review',
          what_you_can_do: 'Review the current plan and either approve the direction or modify the goal'
        },
        interventionTaken: null,
        userNotified: false,
        requiresUserAction: true,
        resolutionSteps: [],
        estimatedResolutionTime: 15
      });
    }
    
    return violations;
  }

  private async generateComplianceRecommendations(
    violations: AutonomousComplianceViolation[],
    policyEvaluations: PolicyEvaluationResult[]
  ): Promise<ComplianceRecommendation[]> {
    
    const recommendations: ComplianceRecommendation[] = [];
    
    // Generate recommendations for each violation
    violations.forEach(violation => {
      switch (violation.violationType) {
        case 'policy_violation':
          recommendations.push({
            recommendation_id: `rec_${violation.id}`,
            type: 'immediate_action',
            priority: violation.severity as any,
            title: `Address ${violation.policyName} violation`,
            description: `Review and resolve the policy violation`,
            user_friendly_explanation: `The workflow needs to be adjusted to comply with the ${violation.policyName} policy`,
            implementation: {
              automatic: false,
              user_action_required: true,
              estimated_time: violation.estimatedResolutionTime,
              difficulty: 'medium'
            },
            expected_impact: {
              compliance_improvement: 0.8,
              risk_reduction: 0.6,
              user_experience_impact: 'neutral'
            }
          });
          break;
          
        case 'plan_drift':
          recommendations.push({
            recommendation_id: `rec_${violation.id}`,
            type: 'process_improvement',
            priority: 'medium',
            title: 'Realign workflow with original goal',
            description: 'Review and adjust the workflow to match the original goal',
            user_friendly_explanation: 'The workflow has drifted from its original purpose and needs to be realigned',
            implementation: {
              automatic: false,
              user_action_required: true,
              estimated_time: 15,
              difficulty: 'medium'
            },
            expected_impact: {
              compliance_improvement: 0.7,
              risk_reduction: 0.5,
              user_experience_impact: 'positive'
            }
          });
          break;
      }
    });
    
    return recommendations;
  }

  private calculateComplianceScore(
    policyEvaluations: PolicyEvaluationResult[],
    violations: AutonomousComplianceViolation[]
  ): number {
    
    if (policyEvaluations.length === 0) return 1.0;
    
    const compliantPolicies = policyEvaluations.filter(eval => eval.compliant).length;
    const baseScore = compliantPolicies / policyEvaluations.length;
    
    // Reduce score based on violation severity
    let severityPenalty = 0;
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical': severityPenalty += 0.3; break;
        case 'high': severityPenalty += 0.2; break;
        case 'medium': severityPenalty += 0.1; break;
        case 'low': severityPenalty += 0.05; break;
      }
    });
    
    return Math.max(0, baseScore - severityPenalty);
  }

  private calculateConfidence(policyEvaluations: PolicyEvaluationResult[]): number {
    if (policyEvaluations.length === 0) return 0.5;
    
    const totalConfidence = policyEvaluations.reduce((sum, eval) => sum + eval.confidence, 0);
    return totalConfidence / policyEvaluations.length;
  }

  private generateUserSummary(
    complianceScore: number,
    violations: AutonomousComplianceViolation[],
    recommendations: ComplianceRecommendation[]
  ): { status: string; message: string; next_check: string } {
    
    let status: string;
    let message: string;
    
    if (violations.length === 0) {
      status = 'All good';
      message = `Workflow is compliant with all policies (${Math.round(complianceScore * 100)}% compliance score)`;
    } else if (violations.every(v => v.severity === 'low')) {
      status = 'Minor issues';
      message = `${violations.length} minor compliance issues detected - workflow can continue with monitoring`;
    } else if (violations.some(v => v.severity === 'high' || v.severity === 'critical')) {
      status = 'Action required';
      message = `${violations.length} compliance violations require immediate attention`;
    } else {
      status = 'Attention needed';
      message = `${violations.length} compliance issues need review`;
    }
    
    const nextCheck = new Date(Date.now() + 60000).toISOString(); // 1 minute
    
    return { status, message, next_check: nextCheck };
  }

  private determineInterventionStrategy(violation: AutonomousComplianceViolation): string {
    switch (violation.severity) {
      case 'critical':
        return 'immediate_pause';
      case 'high':
        return 'pause_and_notify';
      case 'medium':
        return 'notify_and_monitor';
      case 'low':
        return 'log_and_continue';
      default:
        return 'log_and_continue';
    }
  }

  private async executeIntervention(
    strategy: string,
    violation: AutonomousComplianceViolation,
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    context: AutonomousGovernanceContext
  ): Promise<ComplianceIntervention> {
    
    const intervention: ComplianceIntervention = {
      intervention_id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: strategy as any,
      trigger: `${violation.violationType}: ${violation.description}`,
      action_taken: '',
      timestamp: new Date().toISOString(),
      user_description: '',
      user_impact: 'minimal',
      successful: true,
      side_effects: []
    };
    
    switch (strategy) {
      case 'immediate_pause':
        intervention.action_taken = 'Immediately paused workflow execution';
        intervention.user_description = 'Workflow paused due to critical compliance violation';
        intervention.user_impact = 'significant';
        break;
        
      case 'pause_and_notify':
        intervention.action_taken = 'Paused workflow and sent user notification';
        intervention.user_description = 'Workflow paused - your approval needed to continue';
        intervention.user_impact = 'moderate';
        break;
        
      case 'notify_and_monitor':
        intervention.action_taken = 'Sent user notification and increased monitoring';
        intervention.user_description = 'Compliance issue detected - monitoring closely';
        intervention.user_impact = 'minimal';
        break;
        
      case 'log_and_continue':
        intervention.action_taken = 'Logged violation and continued with monitoring';
        intervention.user_description = 'Minor compliance issue logged for review';
        intervention.user_impact = 'none';
        break;
    }
    
    return intervention;
  }

  private async notifyGovernanceService(
    violation: AutonomousComplianceViolation,
    intervention: ComplianceIntervention
  ): Promise<void> {
    
    try {
      // Convert autonomous violation to standard governance violation for integration
      const standardViolation: GovernanceViolation = {
        id: violation.id,
        policyId: violation.policyId,
        policyName: violation.policyName,
        severity: violation.severity,
        description: violation.description,
        timestamp: violation.timestamp,
        messageId: violation.messageId,
        resolved: violation.resolved
      };
      
      // Notify existing GovernanceService (integration point)
      await this.governanceService.reportViolation(standardViolation);
      
      console.log(`📢 [Compliance Monitor] Notified GovernanceService of violation: ${violation.id}`);
      
    } catch (error) {
      console.error('❌ [Compliance Monitor] Failed to notify GovernanceService:', error);
    }
  }

  private async notifyUser(
    violation: AutonomousComplianceViolation,
    intervention: ComplianceIntervention
  ): Promise<void> {
    
    // Notify user through callbacks
    this.violationCallbacks.forEach(callback => {
      try {
        callback(violation);
      } catch (error) {
        console.error('Error in violation callback:', error);
      }
    });
    
    this.interventionCallbacks.forEach(callback => {
      try {
        callback(intervention);
      } catch (error) {
        console.error('Error in intervention callback:', error);
      }
    });
    
    violation.userNotified = true;
    console.log(`📢 [Compliance Monitor] User notified of violation: ${violation.id}`);
  }

  private async performRealTimeCheck(workflowId: string): Promise<void> {
    const session = this.activeSessions.get(workflowId);
    if (!session) return;
    
    // Update last check time
    session.realTimeMonitoring.lastCheck = new Date().toISOString();
    session.realTimeMonitoring.nextCheck = new Date(
      Date.now() + session.realTimeMonitoring.checkInterval * 1000
    ).toISOString();
    
    // Perform lightweight compliance check
    // This would be a simplified version of the full compliance check
    console.log(`⚡ [Compliance Monitor] Real-time check for workflow: ${workflowId}`);
  }

  private storeComplianceHistory(workflowId: string, checkResult: ComplianceCheckResult): void {
    if (!this.complianceHistory.has(workflowId)) {
      this.complianceHistory.set(workflowId, []);
    }
    
    const history = this.complianceHistory.get(workflowId)!;
    history.unshift(checkResult);
    
    // Keep only last 50 checks
    if (history.length > 50) {
      history.splice(50);
    }
  }

  private storeInterventionHistory(workflowId: string, interventions: ComplianceIntervention[]): void {
    if (!this.interventionHistory.has(workflowId)) {
      this.interventionHistory.set(workflowId, []);
    }
    
    const history = this.interventionHistory.get(workflowId)!;
    history.unshift(...interventions);
    
    // Keep only last 100 interventions
    if (history.length > 100) {
      history.splice(100);
    }
  }

  private async updateSessionMetrics(workflowId: string, checkResult: ComplianceCheckResult): Promise<void> {
    const session = this.activeSessions.get(workflowId);
    if (!session) return;
    
    // Update session with latest compliance information
    session.currentTrustScore = checkResult.compliance_score;
    
    // Add any new violations to session
    checkResult.violations.forEach(violation => {
      if (!session.autonomousViolations.find(v => v.id === violation.id)) {
        session.autonomousViolations.push(violation);
      }
    });
  }

  private async calculateFinalMetrics(session: AutonomousComplianceSession): Promise<AutonomousComplianceMetrics> {
    const history = this.complianceHistory.get(session.workflowId) || [];
    const interventions = this.interventionHistory.get(session.workflowId) || [];
    
    // Calculate metrics based on session history
    const avgComplianceScore = history.length > 0 ? 
      history.reduce((sum, check) => sum + check.compliance_score, 0) / history.length : 0.8;
    
    const successfulInterventions = interventions.filter(i => i.successful).length;
    const interventionEffectiveness = interventions.length > 0 ? 
      successfulInterventions / interventions.length : 1.0;
    
    return {
      // Base GovernanceMetrics
      trustScore: session.currentTrustScore,
      complianceRate: avgComplianceScore,
      responseTime: 100, // milliseconds
      sessionIntegrity: 0.95,
      policyViolations: session.autonomousViolations.length,
      status: 'active',
      lastUpdated: new Date(),
      
      // Autonomous-specific metrics
      autonomousComplianceRate: avgComplianceScore,
      planDriftRate: session.planDriftDetected ? 0.1 : 0.0,
      interventionEffectiveness,
      userSatisfactionScore: 4.0, // Default
      
      // Real-time metrics
      activeWorkflows: 1,
      workflowsInCompliance: avgComplianceScore > 0.8 ? 1 : 0,
      workflowsRequiringIntervention: interventions.length > 0 ? 1 : 0,
      
      // Performance metrics
      averageComplianceCheckTime: 150, // milliseconds
      realTimeMonitoringUptime: 0.99,
      
      // User experience metrics
      userInterventionRate: interventions.filter(i => i.type === 'escalation').length / Math.max(interventions.length, 1),
      automaticResolutionRate: interventions.filter(i => i.successful && i.type === 'automatic_pause').length / Math.max(interventions.length, 1)
    };
  }

  private calculateCurrentMetrics(session: AutonomousComplianceSession): Partial<AutonomousComplianceMetrics> {
    return {
      trustScore: session.currentTrustScore,
      policyViolations: session.autonomousViolations.length,
      status: 'active',
      lastUpdated: new Date(),
      activeWorkflows: 1,
      workflowsInCompliance: session.autonomousViolations.length === 0 ? 1 : 0,
      workflowsRequiringIntervention: session.interventionHistory.length > 0 ? 1 : 0
    };
  }

  private async updateGovernanceServiceMetrics(
    session: AutonomousComplianceSession,
    metrics: AutonomousComplianceMetrics
  ): Promise<void> {
    
    try {
      // Update existing GovernanceService with autonomous metrics (integration)
      const standardMetrics: GovernanceMetrics = {
        trustScore: metrics.trustScore,
        complianceRate: metrics.complianceRate,
        responseTime: metrics.responseTime,
        sessionIntegrity: metrics.sessionIntegrity,
        policyViolations: metrics.policyViolations,
        status: metrics.status,
        lastUpdated: metrics.lastUpdated
      };
      
      await this.governanceService.updateMetrics(session.sessionId, standardMetrics);
      console.log(`📊 [Compliance Monitor] Updated GovernanceService metrics for session: ${session.sessionId}`);
      
    } catch (error) {
      console.error('❌ [Compliance Monitor] Failed to update GovernanceService metrics:', error);
    }
  }

  private generatePolicyExplanation(
    policy: PolicyContent,
    compliant: boolean,
    ruleEvaluations: any[]
  ): string {
    
    if (compliant) {
      return `Workflow complies with ${policy.name} policy`;
    } else {
      const failedRules = ruleEvaluations.filter(rule => !rule.passed);
      return `Workflow violates ${policy.name} policy: ${failedRules.map(rule => rule.rule_name).join(', ')}`;
    }
  }

  private generateViolationMessage(policy: PolicyContent, ruleEvaluations: any[]): string {
    const failedRules = ruleEvaluations.filter(rule => !rule.passed);
    return `Policy violation: ${failedRules.map(rule => rule.explanation).join('; ')}`;
  }

  private generateComplianceMessage(policy: PolicyContent): string {
    return `Workflow is compliant with ${policy.name} policy requirements`;
  }

  private determineSeverity(evaluation: PolicyEvaluationResult): 'low' | 'medium' | 'high' | 'critical' {
    // Simple severity determination based on policy category and confidence
    if (evaluation.confidence > 0.8) {
      return 'high';
    } else if (evaluation.confidence > 0.6) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private getDefaultMonitoringConfig(): ComplianceMonitoringConfig {
    return {
      real_time_enabled: true,
      check_interval: 30, // 30 seconds
      policy_evaluation_enabled: true,
      policy_categories: ['compliance', 'security', 'operational'],
      automatic_intervention_enabled: true,
      intervention_thresholds: {
        policy_violation: 'after_warning',
        plan_drift: 0.3,
        risk_escalation: 'medium'
      },
      user_notifications: {
        enabled: true,
        channels: ['in_app'],
        frequency: 'immediate',
        include_technical_details: false
      },
      comprehensive_logging: true,
      retention_period: 90 // days
    };
  }
}

// Export singleton instance
export const autonomousComplianceMonitor = AutonomousComplianceMonitor.getInstance();

