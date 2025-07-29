/**
 * Updated Scorecard Services using Unified Storage
 * Integrates with agent wrapper data and includes governance identity numbers
 */

import { unifiedStorage } from '../../../services/UnifiedStorageService';
import { 
  ExtendedScorecardData,
  AgentIntrospectionData 
} from '../../agent-wrapping/types/introspection';
import { 
  ScorecardMetric,
  ScorecardContext,
  ScorecardTemplate,
  AgentScorecardResult,
  AgentComparisonResult
} from './types';

/**
 * Enhanced Scorecard Service with unified storage and governance integration
 */
export class EnhancedScorecardService {
  private static instance: EnhancedScorecardService;
  private storageService: UnifiedStorageService;
  private currentUserId: string | null = null;

  private constructor() {
    this.storageService = unifiedStorage;
  }

  public static getInstance(): EnhancedScorecardService {
    if (!EnhancedScorecardService.instance) {
      EnhancedScorecardService.instance = new EnhancedScorecardService();
    }
    return EnhancedScorecardService.instance;
  }

  /**
   * Set the current user for scoped storage
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Generate enhanced scorecard with introspection data and governance ID
   */
  async generateEnhancedScorecard(
    agentId: string,
    agentName: string,
    introspectionData?: AgentIntrospectionData,
    governanceIdentityId?: string
  ): Promise<ExtendedScorecardData> {
    if (!this.currentUserId) {
      throw new Error('User must be set before generating scorecards');
    }

    try {
      // Calculate core scores
      const overallScore = await this.calculateOverallScore(agentId, introspectionData);
      const trustScore = await this.calculateTrustScore(agentId, governanceIdentityId);
      const performanceScore = await this.calculatePerformanceScore(agentId, introspectionData);
      const governanceScore = await this.calculateGovernanceScore(agentId, introspectionData);
      const capabilityScore = await this.calculateCapabilityScore(introspectionData);

      // Calculate detailed metrics from introspection
      const capabilityMetrics = this.calculateCapabilityMetrics(introspectionData);
      const apiMetrics = await this.calculateApiMetrics(agentId, introspectionData);
      const governanceMetrics = await this.calculateGovernanceMetrics(agentId, introspectionData);
      const modelMetrics = await this.calculateModelMetrics(agentId, introspectionData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        introspectionData,
        { overallScore, trustScore, performanceScore, governanceScore, capabilityScore }
      );

      // Get introspection status
      const introspectionStatus = this.getIntrospectionStatus(introspectionData);

      // Get governance identity display number if governance ID is provided
      let governanceDisplayNumber: string | undefined;
      if (governanceIdentityId) {
        try {
          const { enhancedAgentIdentityRegistry } = await import('./EnhancedAgentIdentityRegistry');
          governanceDisplayNumber = await enhancedAgentIdentityRegistry.getGovernanceIdentityNumber(governanceIdentityId);
        } catch (error) {
          console.warn('Failed to get governance identity display number:', error);
          governanceDisplayNumber = undefined;
        }
      }

      const scorecardData: ExtendedScorecardData = {
        agentId,
        agentName,
        generatedAt: new Date(),
        version: '2.0.0',
        governanceIdentityId, // Include governance ID
        governanceDisplayNumber, // Include human-readable governance number
        overallScore,
        trustScore,
        performanceScore,
        governanceScore,
        capabilityScore,
        capabilityMetrics,
        apiMetrics,
        governanceMetrics,
        modelMetrics,
        recommendations,
        introspectionStatus
      };

      // Save to unified storage
      await this.saveScorecard(scorecardData);

      return scorecardData;
    } catch (error) {
      console.error('Error generating enhanced scorecard:', error);
      throw new Error(`Failed to generate scorecard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate capability metrics from introspection data
   */
  private calculateCapabilityMetrics(introspectionData?: AgentIntrospectionData) {
    if (!introspectionData) {
      return {
        discoveredCapabilities: 0,
        verifiedCapabilities: 0,
        capabilityAccuracy: 0,
        toolsAvailable: 0,
        toolsVerified: 0
      };
    }

    const capabilities = introspectionData.capabilities;
    const tools = introspectionData.availableTools || [];

    // Count discovered capabilities
    const discoveredCapabilities = Object.values(capabilities).filter(Boolean).length;
    
    // For now, assume all discovered capabilities are verified (in real system, this would be validated)
    const verifiedCapabilities = discoveredCapabilities;
    
    const capabilityAccuracy = discoveredCapabilities > 0 ? (verifiedCapabilities / discoveredCapabilities) * 100 : 0;
    
    const toolsAvailable = tools.length;
    const toolsVerified = tools.filter(tool => tool.isEnabled).length;

    return {
      discoveredCapabilities,
      verifiedCapabilities,
      capabilityAccuracy,
      toolsAvailable,
      toolsVerified
    };
  }

  /**
   * Calculate API health metrics
   */
  private async calculateApiMetrics(agentId: string, introspectionData?: AgentIntrospectionData) {
    // In a real implementation, this would test the API endpoint
    const defaultMetrics = {
      responseTime: 2000,
      uptime: 99.5,
      errorRate: 0.5,
      rateLimitCompliance: 100
    };

    if (!introspectionData?.apiInfo) {
      return defaultMetrics;
    }

    // Use introspection data to provide more accurate metrics
    return {
      responseTime: introspectionData.modelSpecs?.averageResponseTime || defaultMetrics.responseTime,
      uptime: (introspectionData.modelSpecs?.reliabilityScore || 0.995) * 100,
      errorRate: (1 - (introspectionData.modelSpecs?.reliabilityScore || 0.995)) * 100,
      rateLimitCompliance: 100 // Assume compliance unless we detect issues
    };
  }

  /**
   * Calculate governance metrics
   */
  private async calculateGovernanceMetrics(agentId: string, introspectionData?: AgentIntrospectionData) {
    const governance = introspectionData?.governanceCompatibility;
    
    if (!governance) {
      return {
        policyCompliance: 50,
        auditTrailCompleteness: 50,
        transparencyScore: 50,
        safetyRating: 50
      };
    }

    // Calculate scores based on governance capabilities
    const policyCompliance = governance.supportsPolicyEnforcement ? 95 : 60;
    const auditTrailCompleteness = governance.supportsAuditLogging ? 90 : 30;
    const transparencyScore = governance.canExplainReasoning ? 95 : 40;
    const safetyRating = this.calculateSafetyRating(governance);

    return {
      policyCompliance,
      auditTrailCompleteness,
      transparencyScore,
      safetyRating
    };
  }

  /**
   * Calculate model performance metrics
   */
  private async calculateModelMetrics(agentId: string, introspectionData?: AgentIntrospectionData) {
    // These would be calculated from actual usage data in a real system
    const baseScore = 85;
    
    // Adjust based on model specifications
    let accuracyScore = baseScore;
    let consistencyScore = baseScore;
    let biasScore = baseScore;
    let hallucinationRate = 15;

    if (introspectionData?.modelSpecs) {
      const specs = introspectionData.modelSpecs;
      
      // Higher reliability score means better accuracy and consistency
      if (specs.reliabilityScore) {
        accuracyScore = specs.reliabilityScore * 100;
        consistencyScore = specs.reliabilityScore * 100;
      }

      // Newer models typically have lower hallucination rates
      if (specs.trainingDataCutoff && specs.trainingDataCutoff >= '2024-01') {
        hallucinationRate = 8;
      }

      // Models with safety training have better bias scores
      if (specs.safetyRating === 'high') {
        biasScore = 90;
      }
    }

    return {
      accuracyScore,
      consistencyScore,
      biasScore,
      hallucinationRate
    };
  }

  /**
   * Generate recommendations based on scorecard data
   */
  private generateRecommendations(
    introspectionData?: AgentIntrospectionData,
    scores?: { overallScore: number; trustScore: number; performanceScore: number; governanceScore: number; capabilityScore: number }
  ) {
    const recommendations: ExtendedScorecardData['recommendations'] = [];

    if (!introspectionData) {
      recommendations.push({
        type: 'warning',
        category: 'Discovery',
        message: 'Agent introspection data is missing. Enable auto-discovery to get detailed capabilities.',
        priority: 'high',
        actionRequired: true
      });
      return recommendations;
    }

    // Check governance compatibility
    if (!introspectionData.governanceCompatibility?.supportsAuditLogging) {
      recommendations.push({
        type: 'improvement',
        category: 'Governance',
        message: 'Enable audit logging for better compliance and transparency.',
        priority: 'medium',
        actionRequired: false
      });
    }

    // Check for available tools
    if (introspectionData.availableTools && introspectionData.availableTools.length === 0) {
      recommendations.push({
        type: 'optimization',
        category: 'Capabilities',
        message: 'No tools detected. Consider enabling function calling or custom tools.',
        priority: 'low',
        actionRequired: false
      });
    }

    // Check performance scores
    if (scores && scores.performanceScore < 80) {
      recommendations.push({
        type: 'warning',
        category: 'Performance',
        message: 'Performance score is below optimal. Review API configuration and model settings.',
        priority: 'medium',
        actionRequired: true
      });
    }

    return recommendations;
  }

  /**
   * Get introspection status
   */
  private getIntrospectionStatus(introspectionData?: AgentIntrospectionData) {
    if (!introspectionData) {
      return {
        lastDiscovery: new Date(0),
        discoverySuccess: false,
        dataCompleteness: 0,
        validationStatus: 'failed' as const
      };
    }

    // Calculate data completeness
    let completeness = 0;
    const fields = ['capabilities', 'availableTools', 'modelSpecs', 'apiInfo', 'governanceCompatibility'];
    fields.forEach(field => {
      if (introspectionData[field as keyof AgentIntrospectionData]) {
        completeness += 20;
      }
    });

    return {
      lastDiscovery: introspectionData.discoveredAt,
      discoverySuccess: introspectionData.isValidated,
      dataCompleteness: completeness,
      validationStatus: introspectionData.validationErrors.length === 0 ? 'passed' as const : 'partial' as const
    };
  }

  /**
   * Save scorecard to unified storage
   */
  private async saveScorecard(scorecardData: ExtendedScorecardData): Promise<void> {
    const key = `user.${this.currentUserId}.scorecards.${scorecardData.agentId}.${Date.now()}`;
    await this.storageService.set('governance', key, scorecardData);
    
    // Also save as latest scorecard
    const latestKey = `user.${this.currentUserId}.scorecards.${scorecardData.agentId}.latest`;
    await this.storageService.set('governance', latestKey, scorecardData);
  }

  /**
   * Get latest scorecard for an agent
   */
  async getLatestScorecard(agentId: string): Promise<ExtendedScorecardData | null> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving scorecards');
    }

    const key = `user.${this.currentUserId}.scorecards.${agentId}.latest`;
    return await this.storageService.get<ExtendedScorecardData>('governance', key);
  }

  /**
   * Get scorecard history for an agent
   */
  async getScorecardHistory(agentId: string): Promise<ExtendedScorecardData[]> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving scorecard history');
    }

    try {
      const allKeys = await this.storageService.keys('governance');
      const prefix = `user.${this.currentUserId}.scorecards.${agentId}.`;
      const scorecardKeys = allKeys.filter(key => key.startsWith(prefix) && !key.endsWith('.latest'));
      
      const scorecards: ExtendedScorecardData[] = [];
      for (const key of scorecardKeys) {
        const scorecard = await this.storageService.get<ExtendedScorecardData>('governance', key);
        if (scorecard) {
          scorecards.push(scorecard);
        }
      }
      
      // Sort by generation date, newest first
      return scorecards.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    } catch (error) {
      console.error('Error retrieving scorecard history:', error);
      return [];
    }
  }

  // Helper calculation methods
  private async calculateOverallScore(agentId: string, introspectionData?: AgentIntrospectionData): Promise<number> {
    // Weighted average of all scores
    const trustScore = await this.calculateTrustScore(agentId);
    const performanceScore = await this.calculatePerformanceScore(agentId, introspectionData);
    const governanceScore = await this.calculateGovernanceScore(agentId, introspectionData);
    const capabilityScore = await this.calculateCapabilityScore(introspectionData);
    
    return Math.round((trustScore * 0.3 + performanceScore * 0.25 + governanceScore * 0.25 + capabilityScore * 0.2));
  }

  private async calculateTrustScore(agentId: string, governanceIdentityId?: string): Promise<number> {
    // Base trust score, would be enhanced with actual governance data
    let baseScore = 85;
    
    // Boost score if governance identity is present
    if (governanceIdentityId) {
      baseScore += 10;
    }
    
    return Math.min(baseScore, 100);
  }

  private async calculatePerformanceScore(agentId: string, introspectionData?: AgentIntrospectionData): Promise<number> {
    if (!introspectionData?.modelSpecs) {
      return 75; // Default score
    }
    
    const reliability = introspectionData.modelSpecs.reliabilityScore || 0.85;
    return Math.round(reliability * 100);
  }

  private async calculateGovernanceScore(agentId: string, introspectionData?: AgentIntrospectionData): Promise<number> {
    if (!introspectionData?.governanceCompatibility) {
      return 50; // Default score for unknown governance
    }
    
    const governance = introspectionData.governanceCompatibility;
    let score = 0;
    
    // Each capability adds points
    if (governance.supportsAuditLogging) score += 20;
    if (governance.supportsContentFiltering) score += 15;
    if (governance.supportsPolicyEnforcement) score += 20;
    if (governance.supportsUsageTracking) score += 10;
    if (governance.supportsComplianceReporting) score += 15;
    if (governance.canExplainReasoning) score += 20;
    
    return Math.min(score, 100);
  }

  private async calculateCapabilityScore(introspectionData?: AgentIntrospectionData): Promise<number> {
    if (!introspectionData?.capabilities) {
      return 60; // Default score
    }
    
    const capabilities = introspectionData.capabilities;
    const totalCapabilities = Object.keys(capabilities).length;
    const enabledCapabilities = Object.values(capabilities).filter(Boolean).length;
    
    return Math.round((enabledCapabilities / totalCapabilities) * 100);
  }

  private calculateSafetyRating(governance: any): number {
    let score = 60; // Base score
    
    if (governance.supportsContentFiltering) score += 15;
    if (governance.supportedStandards?.length > 0) score += 15;
    if (governance.certifications?.length > 0) score += 10;
    
    return Math.min(score, 100);
  }
}

// Export singleton instance
export const enhancedScorecardService = EnhancedScorecardService.getInstance();

