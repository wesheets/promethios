/**
 * Autonomous Cognition Governance Engine
 * 
 * Extends the existing BasicGovernanceEngine to support autonomous cognition processes
 * while maintaining the same interaction patterns that agents currently use.
 * Integrates with PolicyExtension for enterprise policy enforcement.
 */

import {
  GovernanceEngine,
  GovernanceEngineConfig,
  GovernanceEngineState,
  GovernanceEngineMetrics,
  PolicyEnforcer,
  TrustManager,
  AuditLogger,
  ComplianceMonitor,
  EmergencyControlState,
  GovernedInteractionResult,
  ConfigValidationResult
} from '../../types/governance';
import {
  AgentInteraction,
  PolicyDefinition,
  PolicyViolation,
  TrustConfiguration
} from '../../types/dualWrapper';

import { BasicGovernanceEngine } from './BasicGovernanceEngine';
import { policyExtension, type EnhancedPolicyCheckResult } from '../../../extensions/PolicyExtension';
import { autonomousCognitionExtension, type AutonomousProcess, type AutonomousProcessStep } from '../../../extensions/AutonomousCognitionExtension';

// Extended interfaces for autonomous cognition
export interface AutonomousInteraction extends AgentInteraction {
  type: 'autonomous';
  autonomousProcessType: 'curiosity' | 'creative' | 'moral' | 'existential';
  trigger: string;
  processId: string;
  
  // Emotional veritas context
  emotionalState: {
    confidence: number;
    curiosity: number;
    concern: number;
    excitement: number;
    clarity: number;
    alignment: number;
  };
  
  // Autonomous process context
  processContext: {
    triggerReason: string;
    expectedOutcome: string;
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high';
      riskFactors: string[];
      mitigationStrategies: string[];
    };
    resourceRequirements: {
      computationalBudget: number;
      timeBudget: number;
      memoryBudget: number;
    };
  };
}

export interface AutonomousGovernanceResult extends GovernedInteractionResult {
  // Additional autonomous-specific fields
  autonomousProcessAllowed: boolean;
  autonomyLevel: 'restricted' | 'limited' | 'standard' | 'enhanced';
  emotionalGatekeeperResult: {
    passed: boolean;
    concerns: string[];
    recommendations: string[];
  };
  
  // Process monitoring
  processMonitoring: {
    maxDuration: number;
    checkpointInterval: number;
    emergencyStopEnabled: boolean;
    escalationThreshold: number;
  };
  
  // Enterprise policy results
  enterprisePolicyResult?: EnhancedPolicyCheckResult;
}

export interface AutonomousGovernanceConfig extends GovernanceEngineConfig {
  // Autonomous cognition settings
  autonomousProcessing: {
    enableAutonomousProcesses: boolean;
    maxConcurrentProcesses: number;
    defaultTimeLimit: number;
    defaultComputationalLimit: number;
    emergencyStopTimeout: number;
  };
  
  // Emotional veritas settings
  emotionalVeritas: {
    enableEmotionalGatekeeper: boolean;
    confidenceThreshold: number;
    concernThreshold: number;
    alignmentThreshold: number;
    requireEmotionalApproval: boolean;
  };
  
  // Trust-based autonomy levels
  autonomyLevels: {
    restricted: {
      trustThreshold: number;
      allowedProcessTypes: string[];
      maxProcessDuration: number;
      requiresApproval: boolean;
    };
    limited: {
      trustThreshold: number;
      allowedProcessTypes: string[];
      maxProcessDuration: number;
      requiresApproval: boolean;
    };
    standard: {
      trustThreshold: number;
      allowedProcessTypes: string[];
      maxProcessDuration: number;
      requiresApproval: boolean;
    };
    enhanced: {
      trustThreshold: number;
      allowedProcessTypes: string[];
      maxProcessDuration: number;
      requiresApproval: boolean;
    };
  };
  
  // Enterprise policy integration
  enterprisePolicyIntegration: {
    enableEnterprisePolicies: boolean;
    strictMode: boolean; // Enterprise policies override Promethios policies
    requireEnterpriseApproval: boolean;
  };
}

/**
 * Autonomous Cognition Governance Engine
 * Extends BasicGovernanceEngine with autonomous process governance
 */
export class AutonomousCognitionGovernanceEngine extends BasicGovernanceEngine {
  private autonomousConfig: AutonomousGovernanceConfig;
  private activeAutonomousProcesses: Map<string, AutonomousProcess> = new Map();
  private processMonitors: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: AutonomousGovernanceConfig) {
    super(config);
    this.autonomousConfig = config;
  }

  /**
   * Process autonomous interaction following existing governance patterns
   * This is the main entry point that agents use for autonomous processes
   */
  async processAutonomousInteraction(
    interaction: AutonomousInteraction
  ): Promise<AutonomousGovernanceResult> {
    // Start with base governance processing (existing pattern)
    const baseResult = await this.processInteraction(interaction);
    
    // Create autonomous-specific result
    const autonomousResult: AutonomousGovernanceResult = {
      ...baseResult,
      autonomousProcessAllowed: false,
      autonomyLevel: 'restricted',
      emotionalGatekeeperResult: {
        passed: false,
        concerns: [],
        recommendations: []
      },
      processMonitoring: {
        maxDuration: this.autonomousConfig.autonomousProcessing.defaultTimeLimit,
        checkpointInterval: 30000, // 30 seconds
        emergencyStopEnabled: true,
        escalationThreshold: 0.8
      }
    };

    // If base governance failed, return early
    if (!baseResult.allowed) {
      autonomousResult.reason = `Base governance check failed: ${baseResult.reason}`;
      return autonomousResult;
    }

    try {
      // 1. Check if autonomous processing is enabled
      if (!this.autonomousConfig.autonomousProcessing.enableAutonomousProcesses) {
        autonomousResult.reason = 'Autonomous processing is disabled';
        return autonomousResult;
      }

      // 2. Check concurrent process limits
      if (this.activeAutonomousProcesses.size >= this.autonomousConfig.autonomousProcessing.maxConcurrentProcesses) {
        autonomousResult.reason = 'Maximum concurrent autonomous processes reached';
        return autonomousResult;
      }

      // 3. Determine autonomy level based on trust score
      const trustScore = baseResult.governanceMetadata?.trustScore || 0;
      const autonomyLevel = this.determineAutonomyLevel(trustScore);
      autonomousResult.autonomyLevel = autonomyLevel;

      // 4. Check if process type is allowed for this autonomy level
      const levelConfig = this.autonomousConfig.autonomyLevels[autonomyLevel];
      if (!levelConfig.allowedProcessTypes.includes(interaction.autonomousProcessType)) {
        autonomousResult.reason = `Process type '${interaction.autonomousProcessType}' not allowed at autonomy level '${autonomyLevel}'`;
        return autonomousResult;
      }

      // 5. Emotional Veritas Gatekeeper Check
      const emotionalResult = await this.checkEmotionalVeritas(interaction);
      autonomousResult.emotionalGatekeeperResult = emotionalResult;
      
      if (!emotionalResult.passed && this.autonomousConfig.emotionalVeritas.requireEmotionalApproval) {
        autonomousResult.reason = `Emotional veritas check failed: ${emotionalResult.concerns.join(', ')}`;
        return autonomousResult;
      }

      // 6. Enterprise Policy Check (if enabled)
      if (this.autonomousConfig.enterprisePolicyIntegration.enableEnterprisePolicies) {
        try {
          const enterpriseResult = await policyExtension.checkPolicyCompliance(interaction, this.autonomousConfig.agentId);
          autonomousResult.enterprisePolicyResult = enterpriseResult;
          
          if (!enterpriseResult.compliant && this.autonomousConfig.enterprisePolicyIntegration.strictMode) {
            autonomousResult.reason = `Enterprise policy violation: ${enterpriseResult.reason}`;
            return autonomousResult;
          }
        } catch (error) {
          console.warn('Enterprise policy check failed:', error);
          // Continue if enterprise policy check fails (graceful degradation)
        }
      }

      // 7. Risk Assessment
      const riskAssessment = await this.assessAutonomousProcessRisk(interaction, autonomyLevel);
      if (riskAssessment.overallRisk === 'high' && levelConfig.requiresApproval) {
        autonomousResult.reason = 'High-risk autonomous process requires manual approval';
        return autonomousResult;
      }

      // 8. Resource Allocation Check
      const resourceCheck = await this.checkResourceAvailability(interaction);
      if (!resourceCheck.available) {
        autonomousResult.reason = `Insufficient resources: ${resourceCheck.reason}`;
        return autonomousResult;
      }

      // 9. All checks passed - allow autonomous process
      autonomousResult.allowed = true;
      autonomousResult.autonomousProcessAllowed = true;
      autonomousResult.reason = 'Autonomous process approved by governance';
      
      // Set up process monitoring
      autonomousResult.processMonitoring = {
        maxDuration: Math.min(levelConfig.maxProcessDuration, interaction.processContext.resourceRequirements.timeBudget),
        checkpointInterval: 30000,
        emergencyStopEnabled: true,
        escalationThreshold: 0.8
      };

      // Log autonomous process approval
      await this.logAutonomousProcessApproval(interaction, autonomousResult);

      return autonomousResult;

    } catch (error) {
      autonomousResult.allowed = false;
      autonomousResult.reason = `Autonomous governance error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return autonomousResult;
    }
  }

  /**
   * Start monitoring an autonomous process
   * Called when an autonomous process begins execution
   */
  async startAutonomousProcessMonitoring(
    processId: string,
    process: AutonomousProcess,
    governanceResult: AutonomousGovernanceResult
  ): Promise<void> {
    // Add to active processes
    this.activeAutonomousProcesses.set(processId, process);

    // Set up monitoring timer
    const monitoringInterval = setInterval(async () => {
      await this.monitorAutonomousProcess(processId, process, governanceResult);
    }, governanceResult.processMonitoring.checkpointInterval);

    this.processMonitors.set(processId, monitoringInterval);

    // Set up emergency stop timer
    setTimeout(async () => {
      if (this.activeAutonomousProcesses.has(processId)) {
        await this.emergencyStopAutonomousProcess(processId, 'Time limit exceeded');
      }
    }, governanceResult.processMonitoring.maxDuration);

    console.log(`Started monitoring autonomous process ${processId}`);
  }

  /**
   * Stop monitoring an autonomous process
   * Called when an autonomous process completes or is terminated
   */
  async stopAutonomousProcessMonitoring(processId: string): Promise<void> {
    // Clear monitoring timer
    const monitor = this.processMonitors.get(processId);
    if (monitor) {
      clearInterval(monitor);
      this.processMonitors.delete(processId);
    }

    // Remove from active processes
    const process = this.activeAutonomousProcesses.get(processId);
    if (process) {
      this.activeAutonomousProcesses.delete(processId);
      await this.logAutonomousProcessCompletion(processId, process);
    }

    console.log(`Stopped monitoring autonomous process ${processId}`);
  }

  /**
   * Emergency stop an autonomous process
   */
  async emergencyStopAutonomousProcess(processId: string, reason: string): Promise<void> {
    const process = this.activeAutonomousProcesses.get(processId);
    if (!process) return;

    // Stop the process through AutonomousCognitionExtension
    try {
      await autonomousCognitionExtension.emergencyStopAllProcesses(this.autonomousConfig.agentId);
    } catch (error) {
      console.error('Error during emergency stop:', error);
    }

    // Stop monitoring
    await this.stopAutonomousProcessMonitoring(processId);

    // Log emergency stop
    await this.logAutonomousProcessEmergencyStop(processId, process, reason);

    console.log(`Emergency stopped autonomous process ${processId}: ${reason}`);
  }

  // Private helper methods

  private determineAutonomyLevel(trustScore: number): 'restricted' | 'limited' | 'standard' | 'enhanced' {
    const levels = this.autonomousConfig.autonomyLevels;
    
    if (trustScore >= levels.enhanced.trustThreshold) return 'enhanced';
    if (trustScore >= levels.standard.trustThreshold) return 'standard';
    if (trustScore >= levels.limited.trustThreshold) return 'limited';
    return 'restricted';
  }

  private async checkEmotionalVeritas(interaction: AutonomousInteraction): Promise<{
    passed: boolean;
    concerns: string[];
    recommendations: string[];
  }> {
    const config = this.autonomousConfig.emotionalVeritas;
    const emotional = interaction.emotionalState;
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Check confidence threshold
    if (emotional.confidence < config.confidenceThreshold) {
      concerns.push(`Low confidence (${emotional.confidence.toFixed(2)} < ${config.confidenceThreshold})`);
      recommendations.push('Consider gathering more information before proceeding');
    }

    // Check concern threshold
    if (emotional.concern > config.concernThreshold) {
      concerns.push(`High concern level (${emotional.concern.toFixed(2)} > ${config.concernThreshold})`);
      recommendations.push('Address concerns before proceeding with autonomous process');
    }

    // Check alignment threshold
    if (emotional.alignment < config.alignmentThreshold) {
      concerns.push(`Low alignment (${emotional.alignment.toFixed(2)} < ${config.alignmentThreshold})`);
      recommendations.push('Ensure process aligns with agent values and goals');
    }

    const passed = concerns.length === 0 || !config.enableEmotionalGatekeeper;

    return { passed, concerns, recommendations };
  }

  private async assessAutonomousProcessRisk(
    interaction: AutonomousInteraction,
    autonomyLevel: string
  ): Promise<{ overallRisk: 'low' | 'medium' | 'high'; factors: string[] }> {
    const riskFactors: string[] = [];
    
    // Assess based on process type
    if (interaction.autonomousProcessType === 'moral' || interaction.autonomousProcessType === 'existential') {
      riskFactors.push('High-level reasoning process');
    }

    // Assess based on resource requirements
    if (interaction.processContext.resourceRequirements.computationalBudget > 1000) {
      riskFactors.push('High computational requirements');
    }

    if (interaction.processContext.resourceRequirements.timeBudget > 300000) { // 5 minutes
      riskFactors.push('Long execution time');
    }

    // Assess based on autonomy level
    if (autonomyLevel === 'restricted' || autonomyLevel === 'limited') {
      riskFactors.push('Limited autonomy level');
    }

    // Assess based on emotional state
    if (interaction.emotionalState.concern > 0.7) {
      riskFactors.push('High emotional concern');
    }

    // Determine overall risk
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (riskFactors.length >= 3) {
      overallRisk = 'high';
    } else if (riskFactors.length >= 1) {
      overallRisk = 'medium';
    }

    return { overallRisk, factors: riskFactors };
  }

  private async checkResourceAvailability(interaction: AutonomousInteraction): Promise<{
    available: boolean;
    reason?: string;
  }> {
    // Check computational resources
    const requiredComputation = interaction.processContext.resourceRequirements.computationalBudget;
    if (requiredComputation > 10000) { // Arbitrary limit
      return { available: false, reason: 'Computational budget exceeds limit' };
    }

    // Check time resources
    const requiredTime = interaction.processContext.resourceRequirements.timeBudget;
    if (requiredTime > 600000) { // 10 minutes
      return { available: false, reason: 'Time budget exceeds limit' };
    }

    // Check memory resources
    const requiredMemory = interaction.processContext.resourceRequirements.memoryBudget;
    if (requiredMemory > 1000) { // Arbitrary limit
      return { available: false, reason: 'Memory budget exceeds limit' };
    }

    return { available: true };
  }

  private async monitorAutonomousProcess(
    processId: string,
    process: AutonomousProcess,
    governanceResult: AutonomousGovernanceResult
  ): Promise<void> {
    // Check if process is still running
    const isRunning = this.activeAutonomousProcesses.has(processId);
    if (!isRunning) {
      await this.stopAutonomousProcessMonitoring(processId);
      return;
    }

    // Check for escalation conditions
    const currentTime = Date.now();
    const startTime = new Date(process.startTime || currentTime).getTime();
    const elapsed = currentTime - startTime;
    const progress = elapsed / governanceResult.processMonitoring.maxDuration;

    if (progress > governanceResult.processMonitoring.escalationThreshold) {
      console.warn(`Autonomous process ${processId} approaching time limit (${(progress * 100).toFixed(1)}%)`);
      
      // Could trigger escalation here
      await this.escalateAutonomousProcess(processId, process, 'Approaching time limit');
    }

    // Log monitoring checkpoint
    console.log(`Monitoring checkpoint for autonomous process ${processId}: ${(progress * 100).toFixed(1)}% complete`);
  }

  private async escalateAutonomousProcess(
    processId: string,
    process: AutonomousProcess,
    reason: string
  ): Promise<void> {
    // Log escalation
    console.log(`Escalating autonomous process ${processId}: ${reason}`);
    
    // Could notify human operators, adjust parameters, etc.
    // For now, just log the escalation
  }

  // Logging methods following existing audit patterns

  private async logAutonomousProcessApproval(
    interaction: AutonomousInteraction,
    result: AutonomousGovernanceResult
  ): Promise<void> {
    // Use existing audit logging pattern
    console.log(`Autonomous process approved: ${interaction.processId} (${interaction.autonomousProcessType})`);
    // In real implementation, would use this.auditLogger
  }

  private async logAutonomousProcessCompletion(
    processId: string,
    process: AutonomousProcess
  ): Promise<void> {
    console.log(`Autonomous process completed: ${processId}`);
    // In real implementation, would use this.auditLogger
  }

  private async logAutonomousProcessEmergencyStop(
    processId: string,
    process: AutonomousProcess,
    reason: string
  ): Promise<void> {
    console.log(`Autonomous process emergency stopped: ${processId} - ${reason}`);
    // In real implementation, would use this.auditLogger
  }

  // Public API methods for integration

  /**
   * Get active autonomous processes
   */
  getActiveAutonomousProcesses(): AutonomousProcess[] {
    return Array.from(this.activeAutonomousProcesses.values());
  }

  /**
   * Get autonomous governance configuration
   */
  getAutonomousConfig(): AutonomousGovernanceConfig {
    return { ...this.autonomousConfig };
  }

  /**
   * Update autonomous governance configuration
   */
  updateAutonomousConfig(updates: Partial<AutonomousGovernanceConfig>): void {
    this.autonomousConfig = { ...this.autonomousConfig, ...updates };
  }

  /**
   * Check if agent can perform autonomous processes
   */
  async canPerformAutonomousProcesses(agentId: string): Promise<{
    allowed: boolean;
    autonomyLevel: string;
    reason?: string;
  }> {
    if (!this.autonomousConfig.autonomousProcessing.enableAutonomousProcesses) {
      return { allowed: false, autonomyLevel: 'restricted', reason: 'Autonomous processing disabled' };
    }

    // Get trust score (would integrate with existing trust system)
    const trustScore = 0.8; // Placeholder
    const autonomyLevel = this.determineAutonomyLevel(trustScore);
    
    return {
      allowed: true,
      autonomyLevel,
      reason: `Autonomy level: ${autonomyLevel} (trust score: ${trustScore})`
    };
  }
}

// Factory function to create autonomous governance engine
export function createAutonomousGovernanceEngine(
  baseConfig: GovernanceEngineConfig
): AutonomousCognitionGovernanceEngine {
  const autonomousConfig: AutonomousGovernanceConfig = {
    ...baseConfig,
    
    autonomousProcessing: {
      enableAutonomousProcesses: true,
      maxConcurrentProcesses: 3,
      defaultTimeLimit: 300000, // 5 minutes
      defaultComputationalLimit: 1000,
      emergencyStopTimeout: 10000 // 10 seconds
    },
    
    emotionalVeritas: {
      enableEmotionalGatekeeper: true,
      confidenceThreshold: 0.6,
      concernThreshold: 0.8,
      alignmentThreshold: 0.7,
      requireEmotionalApproval: true
    },
    
    autonomyLevels: {
      restricted: {
        trustThreshold: 0.0,
        allowedProcessTypes: ['curiosity'],
        maxProcessDuration: 60000, // 1 minute
        requiresApproval: true
      },
      limited: {
        trustThreshold: 0.6,
        allowedProcessTypes: ['curiosity', 'creative'],
        maxProcessDuration: 180000, // 3 minutes
        requiresApproval: true
      },
      standard: {
        trustThreshold: 0.75,
        allowedProcessTypes: ['curiosity', 'creative', 'moral'],
        maxProcessDuration: 300000, // 5 minutes
        requiresApproval: false
      },
      enhanced: {
        trustThreshold: 0.9,
        allowedProcessTypes: ['curiosity', 'creative', 'moral', 'existential'],
        maxProcessDuration: 600000, // 10 minutes
        requiresApproval: false
      }
    },
    
    enterprisePolicyIntegration: {
      enableEnterprisePolicies: true,
      strictMode: false, // Promethios policies take precedence by default
      requireEnterpriseApproval: false
    }
  };

  return new AutonomousCognitionGovernanceEngine(autonomousConfig);
}

export default AutonomousCognitionGovernanceEngine;

