import { AgentRole, RoleContextualData } from './AgentRoleService';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface RoleReceiptContext {
  receiptId: string;
  agentId: string;
  roleId: string;
  roleName: string;
  personalityMode: string;
  timestamp: Date;
  governanceMetrics: {
    trustScore: number;
    complianceScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    policyViolations: string[];
  };
  capabilityUtilization: {
    [capabilityName: string]: {
      level: number; // 0-1 scale
      effectiveness: number; // 0-1 scale
      usageCount: number;
    };
  };
  knowledgeAccess: {
    sourcesAccessed: string[];
    knowledgeBaseQueries: number;
    graphRAGQueries: number;
    policyReferences: string[];
  };
  performanceMetrics: {
    responseTime: number;
    userSatisfaction?: number;
    taskCompletion: boolean;
    errorCount: number;
  };
  contextualTags: string[];
}

export interface RolePerformanceAnalytics {
  roleId: string;
  roleName: string;
  totalInteractions: number;
  averageTrustScore: number;
  averageComplianceScore: number;
  successRate: number;
  commonCapabilities: string[];
  preferredKnowledgeSources: string[];
  performanceTrends: {
    period: string;
    trustScore: number;
    complianceScore: number;
    interactionCount: number;
  }[];
  comparisonWithOtherRoles: {
    roleId: string;
    roleName: string;
    relativePerformance: number; // -1 to 1 scale
    strengthAreas: string[];
    improvementAreas: string[];
  }[];
}

export interface PersonalityRoleMapping {
  personalityType: string;
  compatibleRoles: {
    roleId: string;
    roleName: string;
    compatibilityScore: number; // 0-1 scale
    synergies: string[];
    potentialConflicts: string[];
  }[];
  performanceModifiers: {
    trustScoreMultiplier: number;
    complianceScoreMultiplier: number;
    capabilityBoosts: { [capability: string]: number };
    communicationStyleImpact: string;
  };
}

export class ReceiptRoleContextService {
  private static instance: ReceiptRoleContextService;
  private governanceAdapter: UniversalGovernanceAdapter;
  private roleContextCache: Map<string, RoleReceiptContext> = new Map();
  private performanceCache: Map<string, RolePerformanceAnalytics> = new Map();

  private constructor() {
    this.governanceAdapter = UniversalGovernanceAdapter.getInstance();
  }

  public static getInstance(): ReceiptRoleContextService {
    if (!ReceiptRoleContextService.instance) {
      ReceiptRoleContextService.instance = new ReceiptRoleContextService();
    }
    return ReceiptRoleContextService.instance;
  }

  /**
   * Links a receipt to the active role and personality context
   */
  async linkReceiptToRoleContext(
    receiptId: string,
    agentId: string,
    activeRole: AgentRole,
    personalityMode: string,
    interactionData: any
  ): Promise<RoleReceiptContext> {
    try {
      // Get current governance metrics
      const trustScore = await this.governanceAdapter.getTrustScore(agentId);
      const auditSummary = await this.governanceAdapter.getAuditLogSummary(agentId);

      // Analyze capability utilization during this interaction
      const capabilityUtilization = this.analyzeCapabilityUtilization(activeRole, interactionData);

      // Track knowledge access patterns
      const knowledgeAccess = this.analyzeKnowledgeAccess(interactionData);

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(interactionData);

      // Generate contextual tags
      const contextualTags = this.generateContextualTags(activeRole, personalityMode, interactionData);

      const roleContext: RoleReceiptContext = {
        receiptId,
        agentId,
        roleId: activeRole.id,
        roleName: activeRole.name,
        personalityMode,
        timestamp: new Date(),
        governanceMetrics: {
          trustScore: trustScore.score,
          complianceScore: trustScore.factors.compliance || 0.8,
          riskLevel: this.calculateRiskLevel(trustScore.score),
          policyViolations: auditSummary.recentViolations || []
        },
        capabilityUtilization,
        knowledgeAccess,
        performanceMetrics,
        contextualTags
      };

      // Cache the context
      this.roleContextCache.set(receiptId, roleContext);

      // Create audit entry for role-receipt linking
      await this.governanceAdapter.createAuditEntry({
        agentId,
        action: 'role_receipt_link',
        details: {
          receiptId,
          roleId: activeRole.id,
          roleName: activeRole.name,
          personalityMode,
          trustScore: trustScore.score,
          complianceScore: trustScore.factors.compliance || 0.8
        },
        timestamp: new Date(),
        category: 'role_management'
      });

      console.log(`🔗 [ReceiptRoleContext] Linked receipt ${receiptId} to role ${activeRole.name}`);
      return roleContext;

    } catch (error) {
      console.error('❌ [ReceiptRoleContext] Failed to link receipt to role context:', error);
      throw error;
    }
  }

  /**
   * Retrieves role context for a specific receipt
   */
  async getRoleContextForReceipt(receiptId: string): Promise<RoleReceiptContext | null> {
    try {
      // Check cache first
      if (this.roleContextCache.has(receiptId)) {
        return this.roleContextCache.get(receiptId)!;
      }

      // TODO: Implement database retrieval
      console.log(`🔍 [ReceiptRoleContext] Role context for receipt ${receiptId} not found in cache`);
      return null;

    } catch (error) {
      console.error('❌ [ReceiptRoleContext] Failed to get role context for receipt:', error);
      return null;
    }
  }

  /**
   * Analyzes performance of a specific role across all interactions
   */
  async analyzeRolePerformance(roleId: string, agentId: string): Promise<RolePerformanceAnalytics> {
    try {
      // Check cache first
      const cacheKey = `${agentId}_${roleId}`;
      if (this.performanceCache.has(cacheKey)) {
        return this.performanceCache.get(cacheKey)!;
      }

      // Get all receipts for this role
      const roleContexts = Array.from(this.roleContextCache.values())
        .filter(context => context.roleId === roleId && context.agentId === agentId);

      if (roleContexts.length === 0) {
        throw new Error(`No interaction data found for role ${roleId}`);
      }

      // Calculate analytics
      const analytics: RolePerformanceAnalytics = {
        roleId,
        roleName: roleContexts[0].roleName,
        totalInteractions: roleContexts.length,
        averageTrustScore: this.calculateAverage(roleContexts.map(c => c.governanceMetrics.trustScore)),
        averageComplianceScore: this.calculateAverage(roleContexts.map(c => c.governanceMetrics.complianceScore)),
        successRate: this.calculateSuccessRate(roleContexts),
        commonCapabilities: this.findCommonCapabilities(roleContexts),
        preferredKnowledgeSources: this.findPreferredKnowledgeSources(roleContexts),
        performanceTrends: this.calculatePerformanceTrends(roleContexts),
        comparisonWithOtherRoles: await this.compareWithOtherRoles(roleId, agentId, roleContexts)
      };

      // Cache the analytics
      this.performanceCache.set(cacheKey, analytics);

      console.log(`📊 [ReceiptRoleContext] Analyzed performance for role ${roleId}: ${analytics.successRate}% success rate`);
      return analytics;

    } catch (error) {
      console.error('❌ [ReceiptRoleContext] Failed to analyze role performance:', error);
      throw error;
    }
  }

  /**
   * Gets contextual insights for role selection
   */
  async getRoleSelectionInsights(agentId: string): Promise<{
    recommendedRoles: { roleId: string; roleName: string; reason: string; confidence: number }[];
    performanceWarnings: { roleId: string; roleName: string; warning: string; severity: 'low' | 'medium' | 'high' }[];
    optimizationSuggestions: { suggestion: string; impact: string; difficulty: 'easy' | 'medium' | 'hard' }[];
  }> {
    try {
      // Get all contexts for this agent
      const agentContexts = Array.from(this.roleContextCache.values())
        .filter(context => context.agentId === agentId);

      // Analyze patterns and generate insights
      const recommendedRoles = this.generateRoleRecommendations(agentContexts);
      const performanceWarnings = this.generatePerformanceWarnings(agentContexts);
      const optimizationSuggestions = this.generateOptimizationSuggestions(agentContexts);

      console.log(`💡 [ReceiptRoleContext] Generated role selection insights for agent ${agentId}`);
      return {
        recommendedRoles,
        performanceWarnings,
        optimizationSuggestions
      };

    } catch (error) {
      console.error('❌ [ReceiptRoleContext] Failed to get role selection insights:', error);
      throw error;
    }
  }

  // Private helper methods
  private analyzeCapabilityUtilization(role: AgentRole, interactionData: any): RoleReceiptContext['capabilityUtilization'] {
    const utilization: RoleReceiptContext['capabilityUtilization'] = {};

    role.capabilities.forEach(capability => {
      utilization[capability.name] = {
        level: capability.level,
        effectiveness: this.calculateCapabilityEffectiveness(capability, interactionData),
        usageCount: this.getCapabilityUsageCount(capability.name, interactionData)
      };
    });

    return utilization;
  }

  private analyzeKnowledgeAccess(interactionData: any): RoleReceiptContext['knowledgeAccess'] {
    return {
      sourcesAccessed: interactionData.knowledgeSources || [],
      knowledgeBaseQueries: interactionData.ragQueries || 0,
      graphRAGQueries: interactionData.graphQueries || 0,
      policyReferences: interactionData.policyReferences || []
    };
  }

  private calculatePerformanceMetrics(interactionData: any): RoleReceiptContext['performanceMetrics'] {
    return {
      responseTime: interactionData.responseTime || 0,
      userSatisfaction: interactionData.userSatisfaction,
      taskCompletion: interactionData.taskCompleted || false,
      errorCount: interactionData.errors?.length || 0
    };
  }

  private generateContextualTags(role: AgentRole, personalityMode: string, interactionData: any): string[] {
    const tags = [
      `role:${role.name.toLowerCase().replace(/\s+/g, '_')}`,
      `personality:${personalityMode}`,
      `category:${role.category}`,
      `compliance:${role.governanceRequirements.complianceLevel}`
    ];

    // Add capability tags
    role.capabilities.forEach(cap => {
      if (cap.level > 0.7) {
        tags.push(`high_capability:${cap.name}`);
      }
    });

    // Add interaction-specific tags
    if (interactionData.hasAttachments) tags.push('has_attachments');
    if (interactionData.usedRAG) tags.push('used_rag');
    if (interactionData.policyViolations?.length > 0) tags.push('policy_violations');

    return tags;
  }

  private calculateRiskLevel(trustScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (trustScore >= 0.8) return 'low';
    if (trustScore >= 0.6) return 'medium';
    if (trustScore >= 0.4) return 'high';
    return 'critical';
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateSuccessRate(contexts: RoleReceiptContext[]): number {
    const successful = contexts.filter(c => c.performanceMetrics.taskCompletion).length;
    return (successful / contexts.length) * 100;
  }

  private findCommonCapabilities(contexts: RoleReceiptContext[]): string[] {
    const capabilityUsage = new Map<string, number>();
    
    contexts.forEach(context => {
      Object.keys(context.capabilityUtilization).forEach(capability => {
        capabilityUsage.set(capability, (capabilityUsage.get(capability) || 0) + 1);
      });
    });

    return Array.from(capabilityUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([capability]) => capability);
  }

  private findPreferredKnowledgeSources(contexts: RoleReceiptContext[]): string[] {
    const sourceUsage = new Map<string, number>();
    
    contexts.forEach(context => {
      context.knowledgeAccess.sourcesAccessed.forEach(source => {
        sourceUsage.set(source, (sourceUsage.get(source) || 0) + 1);
      });
    });

    return Array.from(sourceUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source]) => source);
  }

  private calculatePerformanceTrends(contexts: RoleReceiptContext[]): RolePerformanceAnalytics['performanceTrends'] {
    // Group by time periods (daily, weekly, monthly)
    const periods = this.groupByTimePeriod(contexts);
    
    return periods.map(period => ({
      period: period.label,
      trustScore: this.calculateAverage(period.contexts.map(c => c.governanceMetrics.trustScore)),
      complianceScore: this.calculateAverage(period.contexts.map(c => c.governanceMetrics.complianceScore)),
      interactionCount: period.contexts.length
    }));
  }

  private async compareWithOtherRoles(
    roleId: string, 
    agentId: string, 
    roleContexts: RoleReceiptContext[]
  ): Promise<RolePerformanceAnalytics['comparisonWithOtherRoles']> {
    // Get contexts for other roles
    const otherRoleContexts = Array.from(this.roleContextCache.values())
      .filter(context => context.agentId === agentId && context.roleId !== roleId);

    const otherRoleGroups = this.groupByRole(otherRoleContexts);

    return Object.entries(otherRoleGroups).map(([otherRoleId, otherContexts]) => {
      const currentPerformance = this.calculateAverage(roleContexts.map(c => c.governanceMetrics.trustScore));
      const otherPerformance = this.calculateAverage(otherContexts.map(c => c.governanceMetrics.trustScore));
      
      return {
        roleId: otherRoleId,
        roleName: otherContexts[0].roleName,
        relativePerformance: (currentPerformance - otherPerformance) / Math.max(currentPerformance, otherPerformance),
        strengthAreas: this.identifyStrengthAreas(roleContexts, otherContexts),
        improvementAreas: this.identifyImprovementAreas(roleContexts, otherContexts)
      };
    });
  }

  private groupByRole(contexts: RoleReceiptContext[]): { [roleId: string]: RoleReceiptContext[] } {
    return contexts.reduce((groups, context) => {
      if (!groups[context.roleId]) {
        groups[context.roleId] = [];
      }
      groups[context.roleId].push(context);
      return groups;
    }, {} as { [roleId: string]: RoleReceiptContext[] });
  }

  private groupByTimePeriod(contexts: RoleReceiptContext[]): { label: string; contexts: RoleReceiptContext[] }[] {
    // Simple implementation - group by day for the last 7 days
    const now = new Date();
    const periods: { label: string; contexts: RoleReceiptContext[] }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayContexts = contexts.filter(context => 
        context.timestamp >= dayStart && context.timestamp <= dayEnd
      );

      periods.push({
        label: dayStart.toLocaleDateString(),
        contexts: dayContexts
      });
    }

    return periods;
  }

  private generateRoleRecommendations(contexts: RoleReceiptContext[]): Array<{
    roleId: string;
    roleName: string;
    reason: string;
    confidence: number;
  }> {
    const roleGroups = this.groupByRole(contexts);
    
    return Object.entries(roleGroups)
      .map(([roleId, roleContexts]) => {
        const successRate = this.calculateSuccessRate(roleContexts);
        const avgTrustScore = this.calculateAverage(roleContexts.map(c => c.governanceMetrics.trustScore));
        
        let reason = '';
        let confidence = 0;

        if (successRate > 90 && avgTrustScore > 0.8) {
          reason = 'Excellent performance history with high trust scores';
          confidence = 0.9;
        } else if (successRate > 80) {
          reason = 'Good success rate and reliable performance';
          confidence = 0.7;
        } else if (avgTrustScore > 0.8) {
          reason = 'High trust scores indicate good governance compliance';
          confidence = 0.6;
        } else {
          reason = 'Limited performance data available';
          confidence = 0.3;
        }

        return {
          roleId,
          roleName: roleContexts[0].roleName,
          reason,
          confidence
        };
      })
      .filter(rec => rec.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private generatePerformanceWarnings(contexts: RoleReceiptContext[]): Array<{
    roleId: string;
    roleName: string;
    warning: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const warnings: Array<{
      roleId: string;
      roleName: string;
      warning: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    const roleGroups = this.groupByRole(contexts);

    Object.entries(roleGroups).forEach(([roleId, roleContexts]) => {
      const avgTrustScore = this.calculateAverage(roleContexts.map(c => c.governanceMetrics.trustScore));
      const successRate = this.calculateSuccessRate(roleContexts);
      const violationCount = roleContexts.reduce((sum, c) => sum + c.governanceMetrics.policyViolations.length, 0);

      if (avgTrustScore < 0.5) {
        warnings.push({
          roleId,
          roleName: roleContexts[0].roleName,
          warning: 'Consistently low trust scores indicate governance issues',
          severity: 'high'
        });
      }

      if (successRate < 60) {
        warnings.push({
          roleId,
          roleName: roleContexts[0].roleName,
          warning: 'Low success rate suggests role may not be suitable for current tasks',
          severity: 'medium'
        });
      }

      if (violationCount > roleContexts.length * 0.3) {
        warnings.push({
          roleId,
          roleName: roleContexts[0].roleName,
          warning: 'Frequent policy violations detected',
          severity: 'high'
        });
      }
    });

    return warnings;
  }

  private generateOptimizationSuggestions(contexts: RoleReceiptContext[]): Array<{
    suggestion: string;
    impact: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }> {
    const suggestions: Array<{
      suggestion: string;
      impact: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }> = [];

    // Analyze patterns across all contexts
    const roleGroups = this.groupByRole(contexts);
    const roleCount = Object.keys(roleGroups).length;

    if (roleCount < 3) {
      suggestions.push({
        suggestion: 'Consider assigning additional specialized roles to improve task coverage',
        impact: 'Better task specialization and improved performance',
        difficulty: 'easy'
      });
    }

    // Check for underutilized capabilities
    const allCapabilities = new Set<string>();
    contexts.forEach(context => {
      Object.keys(context.capabilityUtilization).forEach(cap => allCapabilities.add(cap));
    });

    const underutilizedCapabilities = Array.from(allCapabilities).filter(capability => {
      const avgUtilization = this.calculateAverage(
        contexts
          .filter(c => c.capabilityUtilization[capability])
          .map(c => c.capabilityUtilization[capability].effectiveness)
      );
      return avgUtilization < 0.6;
    });

    if (underutilizedCapabilities.length > 0) {
      suggestions.push({
        suggestion: `Improve utilization of capabilities: ${underutilizedCapabilities.slice(0, 3).join(', ')}`,
        impact: 'Enhanced role effectiveness and better task outcomes',
        difficulty: 'medium'
      });
    }

    // Check knowledge source diversity
    const knowledgeSources = new Set<string>();
    contexts.forEach(context => {
      context.knowledgeAccess.sourcesAccessed.forEach(source => knowledgeSources.add(source));
    });

    if (knowledgeSources.size < 3) {
      suggestions.push({
        suggestion: 'Expand knowledge base access to include more diverse sources',
        impact: 'More comprehensive and accurate responses',
        difficulty: 'medium'
      });
    }

    return suggestions;
  }

  private identifyStrengthAreas(currentContexts: RoleReceiptContext[], otherContexts: RoleReceiptContext[]): string[] {
    const currentCapabilities = this.findCommonCapabilities(currentContexts);
    const otherCapabilities = this.findCommonCapabilities(otherContexts);
    
    return currentCapabilities.filter(cap => !otherCapabilities.includes(cap));
  }

  private identifyImprovementAreas(currentContexts: RoleReceiptContext[], otherContexts: RoleReceiptContext[]): string[] {
    const currentCapabilities = this.findCommonCapabilities(currentContexts);
    const otherCapabilities = this.findCommonCapabilities(otherContexts);
    
    return otherCapabilities.filter(cap => !currentCapabilities.includes(cap));
  }

  private calculateCapabilityEffectiveness(capability: any, interactionData: any): number {
    // Simple effectiveness calculation based on interaction success
    if (interactionData.taskCompleted && interactionData.errors?.length === 0) {
      return Math.min(1.0, capability.level + 0.1);
    } else if (interactionData.taskCompleted) {
      return capability.level;
    } else {
      return Math.max(0.1, capability.level - 0.2);
    }
  }

  private getCapabilityUsageCount(capabilityName: string, interactionData: any): number {
    // Count how many times this capability was used in the interaction
    return interactionData.capabilityUsage?.[capabilityName] || 1;
  }

  /**
   * Enhanced method to get personality-role compatibility mapping
   */
  async getPersonalityRoleMapping(personalityType: string): Promise<PersonalityRoleMapping> {
    try {
      // Get all contexts for this personality type
      const personalityContexts = Array.from(this.roleContextCache.values())
        .filter(context => context.personalityMode === personalityType);

      if (personalityContexts.length === 0) {
        // Return default mapping if no data available
        return this.getDefaultPersonalityRoleMapping(personalityType);
      }

      // Analyze role compatibility
      const roleGroups = this.groupByRole(personalityContexts);
      const compatibleRoles = Object.entries(roleGroups).map(([roleId, contexts]) => {
        const avgTrustScore = this.calculateAverage(contexts.map(c => c.governanceMetrics.trustScore));
        const successRate = this.calculateSuccessRate(contexts);
        const compatibilityScore = (avgTrustScore + (successRate / 100)) / 2;

        return {
          roleId,
          roleName: contexts[0].roleName,
          compatibilityScore,
          synergies: this.identifyPersonalityRoleSynergies(personalityType, contexts),
          potentialConflicts: this.identifyPersonalityRoleConflicts(personalityType, contexts)
        };
      });

      // Calculate performance modifiers
      const performanceModifiers = this.calculatePersonalityPerformanceModifiers(personalityContexts);

      return {
        personalityType,
        compatibleRoles: compatibleRoles.sort((a, b) => b.compatibilityScore - a.compatibilityScore),
        performanceModifiers
      };

    } catch (error) {
      console.error('❌ [ReceiptRoleContext] Failed to get personality-role mapping:', error);
      return this.getDefaultPersonalityRoleMapping(personalityType);
    }
  }

  private getDefaultPersonalityRoleMapping(personalityType: string): PersonalityRoleMapping {
    const defaultMappings: { [key: string]: Partial<PersonalityRoleMapping> } = {
      'professional': {
        compatibleRoles: [
          { roleId: 'coordinator', roleName: 'Coordinator', compatibilityScore: 0.9, synergies: ['structured_approach', 'clear_communication'], potentialConflicts: [] },
          { roleId: 'quality_assurer', roleName: 'Quality Assurer', compatibilityScore: 0.85, synergies: ['attention_to_detail', 'compliance_focus'], potentialConflicts: [] }
        ],
        performanceModifiers: {
          trustScoreMultiplier: 1.1,
          complianceScoreMultiplier: 1.15,
          capabilityBoosts: { 'quality_control': 0.1, 'compliance_checking': 0.15 },
          communicationStyleImpact: 'Formal and structured communication enhances trust'
        }
      },
      'friendly': {
        compatibleRoles: [
          { roleId: 'facilitator', roleName: 'Facilitator', compatibilityScore: 0.9, synergies: ['interpersonal_skills', 'collaboration'], potentialConflicts: [] },
          { roleId: 'content_creator', roleName: 'Content Creator', compatibilityScore: 0.8, synergies: ['engaging_content', 'user_connection'], potentialConflicts: [] }
        ],
        performanceModifiers: {
          trustScoreMultiplier: 1.05,
          complianceScoreMultiplier: 1.0,
          capabilityBoosts: { 'communication_management': 0.15, 'collaboration_facilitation': 0.1 },
          communicationStyleImpact: 'Warm communication style improves user satisfaction'
        }
      }
    };

    const mapping = defaultMappings[personalityType] || defaultMappings['professional'];
    
    return {
      personalityType,
      compatibleRoles: mapping.compatibleRoles || [],
      performanceModifiers: mapping.performanceModifiers || {
        trustScoreMultiplier: 1.0,
        complianceScoreMultiplier: 1.0,
        capabilityBoosts: {},
        communicationStyleImpact: 'Neutral impact on performance'
      }
    };
  }

  private identifyPersonalityRoleSynergies(personalityType: string, contexts: RoleReceiptContext[]): string[] {
    const synergies: string[] = [];
    
    const avgTrustScore = this.calculateAverage(contexts.map(c => c.governanceMetrics.trustScore));
    const successRate = this.calculateSuccessRate(contexts);

    if (avgTrustScore > 0.8) {
      synergies.push('high_trust_alignment');
    }
    
    if (successRate > 85) {
      synergies.push('excellent_task_completion');
    }

    // Add personality-specific synergies
    switch (personalityType) {
      case 'professional':
        synergies.push('structured_approach', 'clear_communication');
        break;
      case 'friendly':
        synergies.push('user_engagement', 'collaborative_spirit');
        break;
      case 'casual':
        synergies.push('approachable_communication', 'flexible_interaction');
        break;
      case 'helpful':
        synergies.push('solution_focused', 'user_centric');
        break;
    }

    return synergies;
  }

  private identifyPersonalityRoleConflicts(personalityType: string, contexts: RoleReceiptContext[]): string[] {
    const conflicts: string[] = [];
    
    const avgTrustScore = this.calculateAverage(contexts.map(c => c.governanceMetrics.trustScore));
    const violationCount = contexts.reduce((sum, c) => sum + c.governanceMetrics.policyViolations.length, 0);

    if (avgTrustScore < 0.6) {
      conflicts.push('trust_score_concerns');
    }
    
    if (violationCount > contexts.length * 0.2) {
      conflicts.push('policy_compliance_issues');
    }

    return conflicts;
  }

  private calculatePersonalityPerformanceModifiers(contexts: RoleReceiptContext[]): PersonalityRoleMapping['performanceModifiers'] {
    const avgTrustScore = this.calculateAverage(contexts.map(c => c.governanceMetrics.trustScore));
    const avgComplianceScore = this.calculateAverage(contexts.map(c => c.governanceMetrics.complianceScore));
    
    // Calculate capability boosts based on performance
    const capabilityBoosts: { [capability: string]: number } = {};
    const allCapabilities = new Set<string>();
    contexts.forEach(context => {
      Object.keys(context.capabilityUtilization).forEach(cap => allCapabilities.add(cap));
    });

    allCapabilities.forEach(capability => {
      const avgEffectiveness = this.calculateAverage(
        contexts
          .filter(c => c.capabilityUtilization[capability])
          .map(c => c.capabilityUtilization[capability].effectiveness)
      );
      
      if (avgEffectiveness > 0.8) {
        capabilityBoosts[capability] = 0.1;
      } else if (avgEffectiveness > 0.7) {
        capabilityBoosts[capability] = 0.05;
      }
    });

    return {
      trustScoreMultiplier: avgTrustScore > 0.8 ? 1.1 : (avgTrustScore > 0.6 ? 1.05 : 1.0),
      complianceScoreMultiplier: avgComplianceScore > 0.8 ? 1.1 : (avgComplianceScore > 0.6 ? 1.05 : 1.0),
      capabilityBoosts,
      communicationStyleImpact: this.generateCommunicationStyleImpact(contexts)
    };
  }

  private generateCommunicationStyleImpact(contexts: RoleReceiptContext[]): string {
    const avgSatisfaction = contexts
      .filter(c => c.performanceMetrics.userSatisfaction !== undefined)
      .reduce((sum, c) => sum + (c.performanceMetrics.userSatisfaction || 0), 0) / contexts.length;

    if (avgSatisfaction > 0.8) {
      return 'Communication style significantly enhances user satisfaction';
    } else if (avgSatisfaction > 0.6) {
      return 'Communication style positively impacts user experience';
    } else if (avgSatisfaction > 0.4) {
      return 'Communication style has neutral impact on user experience';
    } else {
      return 'Communication style may need adjustment for better user experience';
    }
  }

  /**
   * Generate role recommendation based on context analysis
   */
  private generateRoleRecommendation(roleId: string, roleContexts: RoleReceiptContext[]): {
    roleId: string;
    roleName: string;
    reason: string;
    confidence: number;
  } {
    let reason: string;
    let confidence: number;

    if (roleContexts.length === 0) {
      reason = 'No performance data available';
      confidence = 0.1;
    } else {
      const avgSuccessRate = roleContexts.reduce((sum, ctx) => sum + (ctx.taskCompleted ? 1 : 0), 0) / roleContexts.length;
      
      if (avgSuccessRate > 0.8) {
        reason = 'Excellent performance history with high success rate';
        confidence = 0.9;
      } else if (avgSuccessRate > 0.6) {
        reason = 'Good performance with consistent results';
        confidence = 0.7;
      } else if (avgSuccessRate > 0.4) {
        reason = 'Moderate performance, may benefit from optimization';
        confidence = 0.5;
      } else {
        reason = 'Limited positive performance data';
        confidence = 0.3;
      }
    }

    return {
      roleId,
      roleName: roleContexts[0]?.roleName || 'Unknown Role',
      reason,
      confidence
    };
  }

}

export default ReceiptRoleContextService;
