/**
 * Basic Governance Engine
 * 
 * Core implementation of the governance engine that provides policy enforcement,
 * trust management, and audit logging for deployed agents. This engine can be
 * embedded directly into deployment packages for independent operation.
 * 
 * @author Manus AI
 * @version 1.0.0
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
import { BasicPolicyEnforcer } from './BasicPolicyEnforcer';
import { BasicTrustManager } from './BasicTrustManager';
import { BasicAuditLogger } from './BasicAuditLogger';
import { BasicComplianceMonitor } from './BasicComplianceMonitor';

/**
 * Basic governance engine implementation
 */
export class BasicGovernanceEngine implements GovernanceEngine {
  private config: GovernanceEngineConfig;
  private state: GovernanceEngineState;
  private policyEnforcer: PolicyEnforcer;
  private trustManager: TrustManager;
  private auditLogger: AuditLogger;
  private complianceMonitor: ComplianceMonitor;
  private emergencyState: EmergencyControlState;
  private metrics: GovernanceEngineMetrics;
  private isRunning: boolean = false;
  private startTime: Date | null = null;

  constructor(config: GovernanceEngineConfig) {
    this.config = config;
    this.state = this.initializeState();
    this.emergencyState = this.initializeEmergencyState();
    this.metrics = this.initializeMetrics();

    // Initialize components
    this.policyEnforcer = new BasicPolicyEnforcer(config.policies);
    this.trustManager = new BasicTrustManager(config.trustConfig);
    this.auditLogger = new BasicAuditLogger(config.auditConfig);
    this.complianceMonitor = new BasicComplianceMonitor(config);
  }

  /**
   * Start the governance engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Governance engine is already running');
    }

    try {
      this.startTime = new Date();
      this.isRunning = true;
      this.state.status = 'running';
      this.state.lastStarted = this.startTime;

      // Start components
      await this.auditLogger.logGovernanceEvent({
        id: this.generateId(),
        type: 'system',
        agentId: this.config.agentId,
        userId: this.config.userId,
        timestamp: new Date(),
        severity: 'info',
        description: 'Governance engine started',
        data: {
          config: {
            policiesCount: this.config.policies.length,
            trustConfig: this.config.trustConfig,
            debugMode: this.config.debugMode,
          },
        },
      });

      console.log(`🛡️ Governance engine started for agent: ${this.config.agentId}`);
    } catch (error) {
      this.state.status = 'error';
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Stop the governance engine
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.isRunning = false;
      this.state.status = 'stopped';
      this.state.lastStopped = new Date();

      await this.auditLogger.logGovernanceEvent({
        id: this.generateId(),
        type: 'system',
        agentId: this.config.agentId,
        userId: this.config.userId,
        timestamp: new Date(),
        severity: 'info',
        description: 'Governance engine stopped',
        data: {
          uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
          metrics: this.metrics,
        },
      });

      console.log(`🛑 Governance engine stopped for agent: ${this.config.agentId}`);
    } catch (error) {
      console.error('Error stopping governance engine:', error);
    }
  }

  /**
   * Process an agent interaction through the governance pipeline
   */
  async processInteraction(interaction: AgentInteraction): Promise<GovernedInteractionResult> {
    if (!this.isRunning) {
      throw new Error('Governance engine is not running');
    }

    const startTime = Date.now();
    const interactionId = this.generateId();

    try {
      // Update metrics
      this.metrics.totalInteractions++;

      // Start compliance monitoring
      const monitorSession = this.complianceMonitor.startMonitoring(interaction);

      // Check emergency state
      if (this.emergencyState.status === 'suspended') {
        const result: GovernedInteractionResult = {
          interactionId,
          allowed: false,
          action: 'blocked',
          reason: 'Agent suspended due to emergency controls',
          originalInteraction: interaction,
          governanceMetadata: {
            processingTime: Date.now() - startTime,
            policiesChecked: 0,
            trustScore: await this.trustManager.getTrustScore(this.config.agentId),
            complianceLevel: this.config.policies.length > 0 ? 'strict' : 'basic',
            emergencyTriggered: true,
          },
        };

        await this.auditLogger.logInteraction(interaction, result);
        return result;
      }

      // Policy enforcement
      const policyResult = await this.policyEnforcer.checkCompliance(interaction);
      this.metrics.policyChecksPerformed++;

      if (!policyResult.compliant) {
        // Handle policy violation
        const violation: PolicyViolation = {
          id: this.generateId(),
          policyId: policyResult.violatedPolicies[0]?.id || 'unknown',
          agentId: this.config.agentId,
          userId: this.config.userId,
          interactionId,
          type: policyResult.violatedPolicies[0]?.type || 'unknown',
          severity: policyResult.violatedPolicies[0]?.severity || 'medium',
          description: policyResult.reason || 'Policy violation detected',
          timestamp: new Date(),
          context: {
            interaction,
            policyResult,
          },
          resolved: false,
        };

        await this.auditLogger.logPolicyViolation(violation);
        this.metrics.violationsDetected++;

        // Check if violation triggers emergency controls
        await this.checkEmergencyTriggers(violation);

        const result: GovernedInteractionResult = {
          interactionId,
          allowed: false,
          action: 'blocked',
          reason: policyResult.reason || 'Policy violation',
          violations: [violation],
          originalInteraction: interaction,
          governanceMetadata: {
            processingTime: Date.now() - startTime,
            policiesChecked: policyResult.policiesChecked || 0,
            trustScore: await this.trustManager.getTrustScore(this.config.agentId),
            complianceLevel: this.getComplianceLevel(),
            emergencyTriggered: false,
          },
        };

        monitorSession.recordError(new Error('Policy violation'));
        monitorSession.stop();

        await this.auditLogger.logInteraction(interaction, result);
        return result;
      }

      // Trust management
      const currentTrustScore = await this.trustManager.getTrustScore(this.config.agentId);
      
      if (currentTrustScore < this.config.trustConfig.minimumThreshold) {
        const result: GovernedInteractionResult = {
          interactionId,
          allowed: false,
          action: 'blocked',
          reason: `Trust score (${currentTrustScore}) below minimum threshold (${this.config.trustConfig.minimumThreshold})`,
          originalInteraction: interaction,
          governanceMetadata: {
            processingTime: Date.now() - startTime,
            policiesChecked: policyResult.policiesChecked || 0,
            trustScore: currentTrustScore,
            complianceLevel: this.getComplianceLevel(),
            emergencyTriggered: false,
          },
        };

        monitorSession.recordError(new Error('Trust score below threshold'));
        monitorSession.stop();

        await this.auditLogger.logInteraction(interaction, result);
        return result;
      }

      // Interaction allowed - create successful result
      const result: GovernedInteractionResult = {
        interactionId,
        allowed: true,
        action: 'allowed',
        reason: 'All governance checks passed',
        originalInteraction: interaction,
        modifiedInteraction: policyResult.modifications ? {
          ...interaction,
          ...policyResult.modifications,
        } : undefined,
        governanceMetadata: {
          processingTime: Date.now() - startTime,
          policiesChecked: policyResult.policiesChecked || 0,
          trustScore: currentTrustScore,
          complianceLevel: this.getComplianceLevel(),
          emergencyTriggered: false,
        },
      };

      // Update trust score based on successful interaction
      await this.trustManager.updateTrustScore(this.config.agentId, interaction, result);
      this.metrics.trustScoreUpdates++;

      monitorSession.recordSuccess();
      const monitorResult = monitorSession.stop();

      // Update performance metrics
      this.updatePerformanceMetrics(Date.now() - startTime);

      await this.auditLogger.logInteraction(interaction, result);
      this.metrics.auditLogsGenerated++;

      return result;

    } catch (error) {
      this.metrics.errorRate++;
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error';

      const result: GovernedInteractionResult = {
        interactionId,
        allowed: false,
        action: 'blocked',
        reason: `Governance engine error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalInteraction: interaction,
        governanceMetadata: {
          processingTime: Date.now() - startTime,
          policiesChecked: 0,
          trustScore: await this.trustManager.getTrustScore(this.config.agentId).catch(() => 0),
          complianceLevel: this.getComplianceLevel(),
          emergencyTriggered: false,
        },
      };

      await this.auditLogger.logInteraction(interaction, result).catch(() => {});
      throw error;
    }
  }

  /**
   * Update governance configuration
   */
  async updateConfiguration(config: Partial<GovernanceEngineConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };

    // Update components if needed
    if (config.policies) {
      await this.policyEnforcer.updatePolicies(config.policies);
    }

    await this.auditLogger.logGovernanceEvent({
      id: this.generateId(),
      type: 'system',
      agentId: this.config.agentId,
      userId: this.config.userId,
      timestamp: new Date(),
      severity: 'info',
      description: 'Governance configuration updated',
      data: {
        oldConfig: {
          policiesCount: oldConfig.policies.length,
          trustConfig: oldConfig.trustConfig,
        },
        newConfig: {
          policiesCount: this.config.policies.length,
          trustConfig: this.config.trustConfig,
        },
      },
    });

    console.log(`🔄 Governance configuration updated for agent: ${this.config.agentId}`);
  }

  /**
   * Get current governance engine status
   */
  async getStatus(): Promise<GovernanceEngineState> {
    this.state.uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    return { ...this.state };
  }

  /**
   * Get governance engine metrics
   */
  async getMetrics(): Promise<GovernanceEngineMetrics> {
    this.metrics.uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    this.metrics.lastUpdated = new Date();
    return { ...this.metrics };
  }

  /**
   * Get emergency control state
   */
  async getEmergencyState(): Promise<EmergencyControlState> {
    return { ...this.emergencyState };
  }

  /**
   * Suspend the agent
   */
  async suspend(reason: string): Promise<void> {
    this.emergencyState.status = 'suspended';
    this.emergencyState.lastTriggered = new Date();
    this.emergencyState.actionsExecuted.push(`suspended: ${reason}`);

    await this.auditLogger.logGovernanceEvent({
      id: this.generateId(),
      type: 'emergency',
      agentId: this.config.agentId,
      userId: this.config.userId,
      timestamp: new Date(),
      severity: 'critical',
      description: `Agent suspended: ${reason}`,
      data: { reason, emergencyState: this.emergencyState },
    });

    console.log(`🚨 Agent suspended: ${this.config.agentId} - ${reason}`);
  }

  /**
   * Resume the agent
   */
  async resume(): Promise<void> {
    this.emergencyState.status = 'normal';
    this.emergencyState.activeTriggers = [];
    this.emergencyState.actionsExecuted.push('resumed');

    await this.auditLogger.logGovernanceEvent({
      id: this.generateId(),
      type: 'emergency',
      agentId: this.config.agentId,
      userId: this.config.userId,
      timestamp: new Date(),
      severity: 'info',
      description: 'Agent resumed from suspension',
      data: { emergencyState: this.emergencyState },
    });

    console.log(`✅ Agent resumed: ${this.config.agentId}`);
  }

  /**
   * Reset the governance engine
   */
  async reset(): Promise<void> {
    this.state = this.initializeState();
    this.emergencyState = this.initializeEmergencyState();
    this.metrics = this.initializeMetrics();

    await this.trustManager.resetTrustScore(this.config.agentId, 'Manual reset');

    await this.auditLogger.logGovernanceEvent({
      id: this.generateId(),
      type: 'system',
      agentId: this.config.agentId,
      userId: this.config.userId,
      timestamp: new Date(),
      severity: 'warning',
      description: 'Governance engine reset',
      data: {},
    });

    console.log(`🔄 Governance engine reset for agent: ${this.config.agentId}`);
  }

  /**
   * Destroy the governance engine
   */
  async destroy(): Promise<void> {
    await this.stop();
    
    // Cleanup resources
    this.policyEnforcer = null as any;
    this.trustManager = null as any;
    this.auditLogger = null as any;
    this.complianceMonitor = null as any;

    console.log(`💥 Governance engine destroyed for agent: ${this.config.agentId}`);
  }

  // Component accessors
  getPolicyEnforcer(): PolicyEnforcer {
    return this.policyEnforcer;
  }

  getTrustManager(): TrustManager {
    return this.trustManager;
  }

  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  getComplianceMonitor(): ComplianceMonitor {
    return this.complianceMonitor;
  }

  // Private helper methods

  private initializeState(): GovernanceEngineState {
    return {
      status: 'stopped',
      agentId: this.config.agentId,
      version: '1.0.0',
      uptime: 0,
      lastStarted: null,
      lastStopped: null,
      lastError: null,
      configuration: this.config,
    };
  }

  private initializeEmergencyState(): EmergencyControlState {
    return {
      agentId: this.config.agentId,
      status: 'normal',
      activeTriggers: [],
      lastTriggered: undefined,
      actionsExecuted: [],
      notificationsSent: 0,
      canRecover: true,
      recoveryConditions: [],
    };
  }

  private initializeMetrics(): GovernanceEngineMetrics {
    return {
      agentId: this.config.agentId,
      uptime: 0,
      totalInteractions: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      policyChecksPerformed: 0,
      violationsDetected: 0,
      trustScoreUpdates: 0,
      auditLogsGenerated: 0,
      performance: {
        cpu: 0,
        memory: 0,
        latency: 0,
      },
      lastUpdated: new Date(),
    };
  }

  private async checkEmergencyTriggers(violation: PolicyViolation): Promise<void> {
    // Check if violation triggers emergency controls
    for (const trigger of this.config.emergencyControls.triggers) {
      if (trigger.enabled && this.shouldTriggerEmergency(trigger, violation)) {
        this.emergencyState.activeTriggers.push(trigger.type);
        
        // Execute emergency actions
        for (const action of this.config.emergencyControls.actions) {
          if (action.enabled) {
            await this.executeEmergencyAction(action, violation);
          }
        }
      }
    }
  }

  private shouldTriggerEmergency(trigger: any, violation: PolicyViolation): boolean {
    // Simplified trigger logic - in production, this would be more sophisticated
    switch (trigger.type) {
      case 'policy_violation_rate':
        const recentViolations = this.metrics.violationsDetected;
        const recentInteractions = this.metrics.totalInteractions;
        const violationRate = recentInteractions > 0 ? recentViolations / recentInteractions : 0;
        return violationRate >= trigger.threshold;
      
      case 'trust_threshold':
        // This would be checked in the main processing loop
        return false;
      
      default:
        return false;
    }
  }

  private async executeEmergencyAction(action: any, violation: PolicyViolation): Promise<void> {
    switch (action.type) {
      case 'suspend_agent':
        await this.suspend(`Emergency trigger: ${violation.description}`);
        break;
      
      case 'notify_admin':
        this.emergencyState.notificationsSent++;
        // In production, this would send actual notifications
        console.log(`🚨 Emergency notification: ${violation.description}`);
        break;
    }
  }

  private updatePerformanceMetrics(processingTime: number): void {
    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalInteractions - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalInteractions;

    // Update performance metrics (simplified)
    this.metrics.performance.latency = processingTime;
  }

  private getComplianceLevel(): string {
    if (this.config.policies.length === 0) return 'basic';
    if (this.config.policies.length < 5) return 'standard';
    return 'strict';
  }

  private generateId(): string {
    return `gov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Governance engine factory
 */
export class GovernanceEngineFactory {
  /**
   * Create a new governance engine instance
   */
  static async createEngine(config: GovernanceEngineConfig): Promise<GovernanceEngine> {
    const validation = await this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    return new BasicGovernanceEngine(config);
  }

  /**
   * Validate governance engine configuration
   */
  static async validateConfig(config: GovernanceEngineConfig): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate required fields
    if (!config.agentId) errors.push('agentId is required');
    if (!config.userId) errors.push('userId is required');
    if (!config.policies) errors.push('policies array is required');
    if (!config.trustConfig) errors.push('trustConfig is required');
    if (!config.auditConfig) errors.push('auditConfig is required');

    // Validate trust configuration
    if (config.trustConfig) {
      if (config.trustConfig.minimumThreshold < 0 || config.trustConfig.minimumThreshold > 100) {
        errors.push('Trust minimum threshold must be between 0 and 100');
      }
      if (config.trustConfig.initialScore < 0 || config.trustConfig.initialScore > 100) {
        errors.push('Trust initial score must be between 0 and 100');
      }
      if (config.trustConfig.factors.length === 0) {
        warnings.push('No trust factors configured - trust scoring will be limited');
      }
    }

    // Validate policies
    if (config.policies) {
      for (const policy of config.policies) {
        if (!policy.id) errors.push(`Policy missing id: ${policy.name}`);
        if (!policy.name) errors.push(`Policy missing name: ${policy.id}`);
        if (!policy.type) errors.push(`Policy missing type: ${policy.id}`);
        if (!policy.rules || policy.rules.length === 0) {
          warnings.push(`Policy has no rules: ${policy.name}`);
        }
      }
    }

    // Performance suggestions
    if (config.policies && config.policies.length > 10) {
      suggestions.push('Consider grouping policies for better performance');
    }

    if (config.trustConfig && config.trustConfig.evaluationInterval < 30) {
      suggestions.push('Trust evaluation interval below 30 minutes may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Get default governance configuration
   */
  static getDefaultConfig(): Partial<GovernanceEngineConfig> {
    return {
      policies: [],
      trustConfig: {
        initialScore: 75,
        minimumThreshold: 50,
        decayRate: 0.1,
        recoveryRate: 0.05,
        factors: [],
        evaluationInterval: 60,
      },
      auditConfig: {
        enabled: true,
        logLevel: 'standard',
        retention: { days: 90 },
        destinations: [],
        includeContent: false,
        includeMetadata: true,
      },
      performanceConfig: {
        maxProcessingTime: 5000,
        enableCaching: true,
        cacheSize: 100,
        batchSize: 10,
        parallelProcessing: false,
        timeoutHandling: 'fail',
      },
      debugMode: false,
    };
  }

  /**
   * Get supported policy types
   */
  static getSupportedPolicyTypes(): string[] {
    return [
      'content_filter',
      'behavior_constraint',
      'output_validation',
      'interaction_limit',
      'custom'
    ];
  }

  /**
   * Get supported trust factors
   */
  static getSupportedTrustFactors(): string[] {
    return [
      'policy_compliance',
      'response_quality',
      'user_feedback',
      'error_rate',
      'response_time',
      'custom'
    ];
  }
}

