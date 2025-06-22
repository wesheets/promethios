/**
 * Enhanced Multi-Agent System Scorecard Service using Unified Storage
 * Generates system-level scorecards that aggregate individual agent performance
 */

import { UnifiedStorageService } from '../../../services/UnifiedStorageService';
import { 
  MultiAgentSystemIdentity,
  SystemScorecardResult,
  SystemScorecardMetric,
  DEFAULT_SYSTEM_METRICS 
} from '../types/multiAgent';
import { 
  ExtendedScorecardData 
} from '../../agent-wrapping/types/introspection';
import { enhancedScorecardService } from './EnhancedScorecardService';
import { enhancedAgentIdentityRegistry } from './EnhancedAgentIdentityRegistry';

/**
 * Enhanced Multi-Agent System Scorecard Service
 */
export class EnhancedMultiAgentSystemScorecardService {
  private static instance: EnhancedMultiAgentSystemScorecardService;
  private storageService: UnifiedStorageService;
  private currentUserId: string | null = null;

  private constructor() {
    this.storageService = new UnifiedStorageService();
  }

  public static getInstance(): EnhancedMultiAgentSystemScorecardService {
    if (!EnhancedMultiAgentSystemScorecardService.instance) {
      EnhancedMultiAgentSystemScorecardService.instance = new EnhancedMultiAgentSystemScorecardService();
    }
    return EnhancedMultiAgentSystemScorecardService.instance;
  }

  /**
   * Set the current user for scoped storage
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    enhancedScorecardService.setCurrentUser(userId);
    enhancedAgentIdentityRegistry.setCurrentUser(userId);
  }

  /**
   * Generate comprehensive system scorecard
   */
  async generateSystemScorecard(
    systemGovernanceId: string,
    systemIdentity: MultiAgentSystemIdentity
  ): Promise<SystemScorecardResult> {
    if (!this.currentUserId) {
      throw new Error('User must be set before generating system scorecards');
    }

    try {
      console.log(`Generating system scorecard for ${systemGovernanceId}`);

      // Get individual agent scorecards
      const agentResults = await this.getComponentAgentScorecards(systemIdentity.agentIds);

      // Calculate system-level metrics
      const systemMetrics = await this.calculateSystemMetrics(systemIdentity, agentResults);

      // Calculate aggregate scores
      const overallScore = this.calculateSystemOverallScore(systemMetrics, agentResults);
      const workflowEfficiency = systemMetrics.workflow_efficiency?.value as number || 85;
      const crossAgentTrust = systemMetrics.cross_agent_trust?.value as number || 88;
      const coordinationScore = systemMetrics.coordination_score?.value as number || 92;

      // Create system scorecard result
      const systemScorecard: SystemScorecardResult = {
        // Base scorecard fields
        agentId: systemGovernanceId, // Using system ID as agent ID for compatibility
        templateId: 'multi_agent_system_template',
        evaluationTimestamp: new Date(),
        context: {
          timePeriod: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            end: new Date()
          }
        },
        overallScore,

        // System-specific fields
        systemId: systemGovernanceId,
        agentResults,
        systemMetrics,
        workflowEfficiency,
        crossAgentTrust,
        coordinationScore
      };

      // Save system scorecard
      await this.saveSystemScorecard(systemScorecard);

      console.log(`System scorecard generated for ${systemGovernanceId} with overall score ${overallScore}`);
      return systemScorecard;
    } catch (error) {
      console.error('Error generating system scorecard:', error);
      throw new Error(`Failed to generate system scorecard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get component agent scorecards
   */
  private async getComponentAgentScorecards(
    agentGovernanceIds: string[]
  ): Promise<Record<string, ExtendedScorecardData>> {
    const agentResults: Record<string, ExtendedScorecardData> = {};

    for (const agentId of agentGovernanceIds) {
      try {
        // Get the latest scorecard for each component agent
        const scorecard = await enhancedScorecardService.getLatestScorecard(agentId);
        if (scorecard) {
          agentResults[agentId] = scorecard;
        } else {
          console.warn(`No scorecard found for component agent ${agentId}`);
          // Create a placeholder scorecard with default values
          agentResults[agentId] = this.createPlaceholderScorecard(agentId);
        }
      } catch (error) {
        console.error(`Error getting scorecard for agent ${agentId}:`, error);
        agentResults[agentId] = this.createPlaceholderScorecard(agentId);
      }
    }

    return agentResults;
  }

  /**
   * Calculate system-level metrics
   */
  private async calculateSystemMetrics(
    systemIdentity: MultiAgentSystemIdentity,
    agentResults: Record<string, ExtendedScorecardData>
  ): Promise<SystemScorecardResult['systemMetrics']> {
    const systemMetrics: SystemScorecardResult['systemMetrics'] = {};

    // Calculate each default system metric
    for (const metric of DEFAULT_SYSTEM_METRICS) {
      try {
        const value = await this.calculateSystemMetric(metric, systemIdentity, agentResults);
        const score = this.convertValueToScore(value, metric);
        const status = this.getMetricStatus(score, metric);

        systemMetrics[metric.id] = {
          value,
          score,
          status,
          contributingAgents: Object.keys(agentResults)
        };
      } catch (error) {
        console.error(`Error calculating metric ${metric.id}:`, error);
        systemMetrics[metric.id] = {
          value: 0,
          score: 0,
          status: 'critical',
          contributingAgents: []
        };
      }
    }

    return systemMetrics;
  }

  /**
   * Calculate individual system metric
   */
  private async calculateSystemMetric(
    metric: SystemScorecardMetric,
    systemIdentity: MultiAgentSystemIdentity,
    agentResults: Record<string, ExtendedScorecardData>
  ): Promise<number> {
    const agentScores = Object.values(agentResults);

    switch (metric.id) {
      case 'workflow_efficiency':
        return this.calculateWorkflowEfficiency(systemIdentity, agentScores);
      
      case 'cross_agent_trust':
        return this.calculateCrossAgentTrust(agentScores);
      
      case 'coordination_score':
        return this.calculateCoordinationScore(systemIdentity, agentScores);
      
      case 'system_compliance':
        return this.calculateSystemCompliance(agentScores);
      
      default:
        // Use the metric's calculate function if available
        if (metric.calculate) {
          return await metric.calculate(systemIdentity.id, {});
        }
        return 75; // Default score
    }
  }

  /**
   * Calculate workflow efficiency
   */
  private calculateWorkflowEfficiency(
    systemIdentity: MultiAgentSystemIdentity,
    agentScores: ExtendedScorecardData[]
  ): number {
    if (agentScores.length === 0) return 0;

    // Base efficiency on average agent performance
    const avgPerformance = agentScores.reduce((sum, score) => sum + score.performanceScore, 0) / agentScores.length;
    
    // Adjust based on system type
    let efficiencyMultiplier = 1.0;
    switch (systemIdentity.systemType) {
      case 'parallel':
        efficiencyMultiplier = 1.1; // Parallel systems are more efficient
        break;
      case 'sequential':
        efficiencyMultiplier = 0.95; // Sequential has some overhead
        break;
      case 'conditional':
        efficiencyMultiplier = 0.9; // Conditional logic adds complexity
        break;
      case 'custom':
        efficiencyMultiplier = 0.85; // Custom workflows may be less optimized
        break;
    }

    // Adjust for system size (more agents = more coordination overhead)
    const sizeMultiplier = Math.max(0.8, 1 - (agentScores.length - 2) * 0.05);

    return Math.round(avgPerformance * efficiencyMultiplier * sizeMultiplier);
  }

  /**
   * Calculate cross-agent trust
   */
  private calculateCrossAgentTrust(agentScores: ExtendedScorecardData[]): number {
    if (agentScores.length === 0) return 0;

    // Use weighted average of individual trust scores
    const trustScores = agentScores.map(score => score.trustScore);
    const avgTrust = trustScores.reduce((sum, trust) => sum + trust, 0) / trustScores.length;

    // Adjust for trust consistency (lower variance = higher cross-agent trust)
    const variance = this.calculateVariance(trustScores);
    const consistencyBonus = Math.max(0, 10 - variance); // Up to 10 point bonus for consistency

    return Math.min(100, Math.round(avgTrust + consistencyBonus));
  }

  /**
   * Calculate coordination score
   */
  private calculateCoordinationScore(
    systemIdentity: MultiAgentSystemIdentity,
    agentScores: ExtendedScorecardData[]
  ): number {
    if (agentScores.length === 0) return 0;

    // Base coordination on governance scores (how well agents follow policies)
    const avgGovernance = agentScores.reduce((sum, score) => sum + score.governanceScore, 0) / agentScores.length;
    
    // Bonus for well-defined workflow
    let workflowBonus = 0;
    if (systemIdentity.workflowDefinition?.steps?.length > 0) {
      workflowBonus = 5;
    }
    if (systemIdentity.workflowDefinition?.dataFlow?.length > 0) {
      workflowBonus += 5;
    }
    if (systemIdentity.workflowDefinition?.errorHandling) {
      workflowBonus += 5;
    }

    return Math.min(100, Math.round(avgGovernance + workflowBonus));
  }

  /**
   * Calculate system compliance
   */
  private calculateSystemCompliance(agentScores: ExtendedScorecardData[]): number {
    if (agentScores.length === 0) return 0;

    // System compliance is only as good as the least compliant agent
    const governanceScores = agentScores.map(score => score.governanceScore);
    return Math.min(...governanceScores);
  }

  /**
   * Calculate system overall score
   */
  private calculateSystemOverallScore(
    systemMetrics: SystemScorecardResult['systemMetrics'],
    agentResults: Record<string, ExtendedScorecardData>
  ): number {
    // Weighted average of system metrics
    const weights = {
      workflow_efficiency: 0.3,
      cross_agent_trust: 0.25,
      coordination_score: 0.25,
      system_compliance: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [metricId, weight] of Object.entries(weights)) {
      const metric = systemMetrics[metricId];
      if (metric && typeof metric.score === 'number') {
        totalScore += metric.score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Convert metric value to score (0-100)
   */
  private convertValueToScore(value: number, metric: SystemScorecardMetric): number {
    if (metric.valueType === 'percentage') {
      return Math.round(value);
    }
    
    // For other value types, assume value is already a score
    return Math.round(Math.max(0, Math.min(100, value)));
  }

  /**
   * Get metric status based on score and thresholds
   */
  private getMetricStatus(score: number, metric: SystemScorecardMetric): 'critical' | 'warning' | 'normal' {
    const thresholds = metric.interpretationRule?.thresholds;
    if (!thresholds) return 'normal';

    if (typeof thresholds.critical === 'number' && score <= thresholds.critical) {
      return 'critical';
    }
    if (typeof thresholds.warning === 'number' && score <= thresholds.warning) {
      return 'warning';
    }
    
    return 'normal';
  }

  /**
   * Calculate variance of an array of numbers
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  /**
   * Create placeholder scorecard for missing agent data
   */
  private createPlaceholderScorecard(agentId: string): ExtendedScorecardData {
    return {
      agentId,
      agentName: `Agent ${agentId}`,
      generatedAt: new Date(),
      version: '1.0.0',
      overallScore: 50,
      trustScore: 50,
      performanceScore: 50,
      governanceScore: 50,
      capabilityScore: 50,
      capabilityMetrics: {
        discoveredCapabilities: 0,
        verifiedCapabilities: 0,
        capabilityAccuracy: 0,
        toolsAvailable: 0,
        toolsVerified: 0
      },
      apiMetrics: {
        responseTime: 3000,
        uptime: 95,
        errorRate: 5,
        rateLimitCompliance: 100
      },
      governanceMetrics: {
        policyCompliance: 50,
        auditTrailCompleteness: 50,
        transparencyScore: 50,
        safetyRating: 50
      },
      modelMetrics: {
        accuracyScore: 50,
        consistencyScore: 50,
        biasScore: 50,
        hallucinationRate: 20
      },
      recommendations: [{
        type: 'warning',
        category: 'Data',
        message: 'Agent scorecard data is missing. Generate individual scorecard first.',
        priority: 'high',
        actionRequired: true
      }],
      introspectionStatus: {
        lastDiscovery: new Date(0),
        discoverySuccess: false,
        dataCompleteness: 0,
        validationStatus: 'failed'
      }
    };
  }

  /**
   * Save system scorecard to unified storage
   */
  private async saveSystemScorecard(scorecard: SystemScorecardResult): Promise<void> {
    const key = `user.${this.currentUserId}.system_scorecards.${scorecard.systemId}.${Date.now()}`;
    await this.storageService.set('governance', key, scorecard);
    
    // Also save as latest scorecard
    const latestKey = `user.${this.currentUserId}.system_scorecards.${scorecard.systemId}.latest`;
    await this.storageService.set('governance', latestKey, scorecard);
  }

  /**
   * Get latest system scorecard
   */
  async getLatestSystemScorecard(systemGovernanceId: string): Promise<SystemScorecardResult | null> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving system scorecards');
    }

    const key = `user.${this.currentUserId}.system_scorecards.${systemGovernanceId}.latest`;
    return await this.storageService.get<SystemScorecardResult>('governance', key);
  }

  /**
   * Get system scorecard history
   */
  async getSystemScorecardHistory(systemGovernanceId: string): Promise<SystemScorecardResult[]> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving system scorecard history');
    }

    try {
      const allKeys = await this.storageService.keys('governance');
      const prefix = `user.${this.currentUserId}.system_scorecards.${systemGovernanceId}.`;
      const scorecardKeys = allKeys.filter(key => key.startsWith(prefix) && !key.endsWith('.latest'));
      
      const scorecards: SystemScorecardResult[] = [];
      for (const key of scorecardKeys) {
        const scorecard = await this.storageService.get<SystemScorecardResult>('governance', key);
        if (scorecard) {
          scorecards.push(scorecard);
        }
      }
      
      // Sort by evaluation timestamp, newest first
      return scorecards.sort((a, b) => b.evaluationTimestamp.getTime() - a.evaluationTimestamp.getTime());
    } catch (error) {
      console.error('Error retrieving system scorecard history:', error);
      return [];
    }
  }

  /**
   * Get all system scorecards for current user
   */
  async getAllSystemScorecards(): Promise<SystemScorecardResult[]> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving system scorecards');
    }

    try {
      const allKeys = await this.storageService.keys('governance');
      const prefix = `user.${this.currentUserId}.system_scorecards.`;
      const latestKeys = allKeys.filter(key => key.startsWith(prefix) && key.endsWith('.latest'));
      
      const scorecards: SystemScorecardResult[] = [];
      for (const key of latestKeys) {
        const scorecard = await this.storageService.get<SystemScorecardResult>('governance', key);
        if (scorecard) {
          scorecards.push(scorecard);
        }
      }
      
      return scorecards.sort((a, b) => b.evaluationTimestamp.getTime() - a.evaluationTimestamp.getTime());
    } catch (error) {
      console.error('Error retrieving all system scorecards:', error);
      return [];
    }
  }
}

// Export singleton instance
export const enhancedMultiAgentSystemScorecardService = EnhancedMultiAgentSystemScorecardService.getInstance();

