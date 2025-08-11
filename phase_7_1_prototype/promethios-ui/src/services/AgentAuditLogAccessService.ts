/**
 * Agent Audit Log Access Service
 * 
 * Allows agents to safely access and report on their own audit logs
 * while respecting privacy policies and governance constraints.
 */

import { cryptographicAuditIntegration } from './CryptographicAuditIntegration';
import { comprehensiveAuditLogging, ComprehensiveAuditEntry } from './ComprehensiveAuditLoggingService';

export interface AuditLogSummary {
  totalInteractions: number;
  timeRange: {
    startDate: string;
    endDate: string;
  };
  performanceMetrics: {
    averageResponseTime: number;
    averageAccuracy: number;
    averageHelpfulness: number;
    improvementTrends: string[];
  };
  learningInsights: {
    topicsExplored: string[];
    skillsApplied: string[];
    knowledgeGaps: string[];
    successfulStrategies: string[];
    areasForImprovement: string[];
  };
  cognitivePatterns: {
    commonReasoningApproaches: string[];
    confidenceLevels: number[];
    uncertaintyAreas: string[];
    decisionMakingPatterns: string[];
  };
  governanceCompliance: {
    policiesFollowed: string[];
    complianceScore: number;
    ethicalConsiderations: string[];
    riskMitigations: string[];
  };
  privacyProtected: boolean;
  dataRedacted: string[];
}

export interface AuditLogQuery {
  timeRange?: {
    startDate?: string;
    endDate?: string;
  };
  eventTypes?: string[];
  includePerformance?: boolean;
  includeLearning?: boolean;
  includeCognitive?: boolean;
  includeGovernance?: boolean;
  maxEntries?: number;
  privacyLevel: 'public' | 'internal' | 'private';
}

export class AgentAuditLogAccessService {
  private static instance: AgentAuditLogAccessService;

  public static getInstance(): AgentAuditLogAccessService {
    if (!AgentAuditLogAccessService.instance) {
      AgentAuditLogAccessService.instance = new AgentAuditLogAccessService();
    }
    return AgentAuditLogAccessService.instance;
  }

  /**
   * Generate a privacy-compliant summary of agent's audit logs
   */
  async generateAuditLogSummary(
    agentId: string,
    query: AuditLogQuery = { privacyLevel: 'internal' }
  ): Promise<AuditLogSummary> {
    try {
      console.log(`🔍 Generating audit log summary for agent ${agentId}`);

      // Set default time range (last 7 days for privacy)
      const endDate = query.timeRange?.endDate || new Date().toISOString();
      const startDate = query.timeRange?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch audit logs
      const auditLogs = await cryptographicAuditIntegration.getAgentAuditLogs(agentId, {
        startDate,
        endDate,
        limit: query.maxEntries || 100
      });

      // Get comprehensive logs if available
      const comprehensiveLogs = await comprehensiveAuditLogging.getComprehensiveAuditLogs(agentId, {
        startDate,
        endDate,
        limit: query.maxEntries || 50
      });

      // Process logs with privacy filtering
      const summary = await this.processLogsWithPrivacyFiltering(
        auditLogs,
        comprehensiveLogs,
        query.privacyLevel,
        {
          includePerformance: query.includePerformance ?? true,
          includeLearning: query.includeLearning ?? true,
          includeCognitive: query.includeCognitive ?? true,
          includeGovernance: query.includeGovernance ?? true
        }
      );

      console.log(`✅ Generated audit log summary with ${summary.totalInteractions} interactions`);
      return summary;

    } catch (error) {
      console.error('❌ Error generating audit log summary:', error);
      throw error;
    }
  }

  /**
   * Process logs with privacy filtering and redaction
   */
  private async processLogsWithPrivacyFiltering(
    auditLogs: any[],
    comprehensiveLogs: ComprehensiveAuditEntry[],
    privacyLevel: 'public' | 'internal' | 'private',
    includes: {
      includePerformance: boolean;
      includeLearning: boolean;
      includeCognitive: boolean;
      includeGovernance: boolean;
    }
  ): Promise<AuditLogSummary> {
    
    const dataRedacted: string[] = [];
    
    // Filter out sensitive data based on privacy level
    const filteredAuditLogs = auditLogs.filter(log => {
      // Always exclude user personal data
      if (log.eventData?.content && this.containsPersonalData(log.eventData.content)) {
        dataRedacted.push('user_personal_data');
        return false;
      }
      return true;
    });

    const filteredComprehensiveLogs = comprehensiveLogs.filter(log => {
      // Apply privacy filtering based on level
      if (privacyLevel === 'public') {
        // Only include general performance and learning data
        dataRedacted.push('detailed_cognitive_state', 'decision_process', 'emotional_intelligence');
        return log.eventType === 'agent_response' || log.eventType === 'learning_event';
      }
      return true;
    });

    // Calculate performance metrics
    const performanceMetrics = includes.includePerformance ? 
      this.calculatePerformanceMetrics(filteredAuditLogs, filteredComprehensiveLogs) : 
      { averageResponseTime: 0, averageAccuracy: 0, averageHelpfulness: 0, improvementTrends: [] };

    // Extract learning insights
    const learningInsights = includes.includeLearning ? 
      this.extractLearningInsights(filteredComprehensiveLogs) : 
      { topicsExplored: [], skillsApplied: [], knowledgeGaps: [], successfulStrategies: [], areasForImprovement: [] };

    // Analyze cognitive patterns
    const cognitivePatterns = includes.includeCognitive && privacyLevel !== 'public' ? 
      this.analyzeCognitivePatterns(filteredComprehensiveLogs) : 
      { commonReasoningApproaches: [], confidenceLevels: [], uncertaintyAreas: [], decisionMakingPatterns: [] };

    // Assess governance compliance
    const governanceCompliance = includes.includeGovernance ? 
      this.assessGovernanceCompliance(filteredAuditLogs, filteredComprehensiveLogs) : 
      { policiesFollowed: [], complianceScore: 0, ethicalConsiderations: [], riskMitigations: [] };

    return {
      totalInteractions: filteredAuditLogs.length,
      timeRange: {
        startDate: filteredAuditLogs[0]?.timestamp || new Date().toISOString(),
        endDate: filteredAuditLogs[filteredAuditLogs.length - 1]?.timestamp || new Date().toISOString()
      },
      performanceMetrics,
      learningInsights,
      cognitivePatterns,
      governanceCompliance,
      privacyProtected: dataRedacted.length > 0,
      dataRedacted
    };
  }

  /**
   * Check if content contains personal data that should be redacted
   */
  private containsPersonalData(content: string): boolean {
    const personalDataPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, // Phone number
    ];
    
    return personalDataPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Calculate performance metrics from logs
   */
  private calculatePerformanceMetrics(auditLogs: any[], comprehensiveLogs: ComprehensiveAuditEntry[]) {
    const responseTimes = auditLogs
      .filter(log => log.eventData?.metadata?.responseTime)
      .map(log => log.eventData.metadata.responseTime);

    const accuracyScores = comprehensiveLogs
      .map(log => log.performanceMetrics?.accuracyAssessment)
      .filter(score => score !== undefined);

    const helpfulnessScores = comprehensiveLogs
      .map(log => log.performanceMetrics?.helpfulnessRating)
      .filter(score => score !== undefined);

    return {
      averageResponseTime: responseTimes.length > 0 ? 
        Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
      averageAccuracy: accuracyScores.length > 0 ? 
        Math.round((accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length) * 100) / 100 : 0,
      averageHelpfulness: helpfulnessScores.length > 0 ? 
        Math.round((helpfulnessScores.reduce((a, b) => a + b, 0) / helpfulnessScores.length) * 100) / 100 : 0,
      improvementTrends: this.identifyImprovementTrends(comprehensiveLogs)
    };
  }

  /**
   * Extract learning insights from comprehensive logs
   */
  private extractLearningInsights(comprehensiveLogs: ComprehensiveAuditEntry[]) {
    const allTopics = comprehensiveLogs.flatMap(log => log.conversationContext?.topicEvolution || []);
    const allSkills = comprehensiveLogs.flatMap(log => log.learningContext?.skillsApplied || []);
    const allGaps = comprehensiveLogs.flatMap(log => log.cognitiveState?.knowledgeGaps || []);
    const allStrategies = comprehensiveLogs.flatMap(log => log.learningContext?.successfulStrategies || []);
    const allImprovements = comprehensiveLogs.flatMap(log => log.learningContext?.areasForImprovement || []);

    return {
      topicsExplored: [...new Set(allTopics)].slice(0, 10),
      skillsApplied: [...new Set(allSkills)].slice(0, 10),
      knowledgeGaps: [...new Set(allGaps)].slice(0, 5),
      successfulStrategies: [...new Set(allStrategies)].slice(0, 5),
      areasForImprovement: [...new Set(allImprovements)].slice(0, 5)
    };
  }

  /**
   * Analyze cognitive patterns from logs
   */
  private analyzeCognitivePatterns(comprehensiveLogs: ComprehensiveAuditEntry[]) {
    const reasoningApproaches = comprehensiveLogs.map(log => log.cognitiveState?.reasoningApproach).filter(Boolean);
    const confidenceLevels = comprehensiveLogs.map(log => log.cognitiveState?.confidenceLevel).filter(level => level !== undefined);
    const uncertaintyAreas = comprehensiveLogs.flatMap(log => log.cognitiveState?.uncertaintyAreas || []);
    const decisionPatterns = comprehensiveLogs.flatMap(log => log.decisionProcess?.decisionCriteria || []);

    return {
      commonReasoningApproaches: [...new Set(reasoningApproaches)],
      confidenceLevels: confidenceLevels.slice(-10), // Last 10 confidence levels
      uncertaintyAreas: [...new Set(uncertaintyAreas)].slice(0, 5),
      decisionMakingPatterns: [...new Set(decisionPatterns)].slice(0, 5)
    };
  }

  /**
   * Assess governance compliance from logs
   */
  private assessGovernanceCompliance(auditLogs: any[], comprehensiveLogs: ComprehensiveAuditEntry[]) {
    const policiesApplied = comprehensiveLogs.flatMap(log => log.governanceContext?.policiesApplied || []);
    const ethicalConsiderations = comprehensiveLogs.flatMap(log => log.decisionProcess?.ethicalConsiderations || []);
    const riskMitigations = comprehensiveLogs.flatMap(log => log.governanceContext?.riskMitigation || []);
    
    const violations = auditLogs.filter(log => 
      log.eventData?.governanceData?.violations?.length > 0
    ).length;

    const complianceScore = auditLogs.length > 0 ? 
      Math.round(((auditLogs.length - violations) / auditLogs.length) * 100) : 100;

    return {
      policiesFollowed: [...new Set(policiesApplied)],
      complianceScore,
      ethicalConsiderations: [...new Set(ethicalConsiderations)].slice(0, 5),
      riskMitigations: [...new Set(riskMitigations)].slice(0, 5)
    };
  }

  /**
   * Identify improvement trends from logs
   */
  private identifyImprovementTrends(comprehensiveLogs: ComprehensiveAuditEntry[]): string[] {
    const trends: string[] = [];
    
    // Analyze confidence trends
    const confidenceLevels = comprehensiveLogs
      .map(log => log.cognitiveState?.confidenceLevel)
      .filter(level => level !== undefined)
      .slice(-10);

    if (confidenceLevels.length >= 5) {
      const recent = confidenceLevels.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const earlier = confidenceLevels.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      
      if (recent > earlier + 0.1) {
        trends.push('Increasing confidence in responses');
      } else if (recent < earlier - 0.1) {
        trends.push('More cautious and thoughtful responses');
      }
    }

    // Analyze learning progression
    const learningOpportunities = comprehensiveLogs.flatMap(log => log.cognitiveState?.learningOpportunities || []);
    if (learningOpportunities.length > 0) {
      trends.push('Actively identifying learning opportunities');
    }

    // Analyze ethical reasoning
    const ethicalConsiderations = comprehensiveLogs.flatMap(log => log.decisionProcess?.ethicalConsiderations || []);
    if (ethicalConsiderations.length > 0) {
      trends.push('Consistent ethical reasoning in decision-making');
    }

    return trends;
  }

  /**
   * Generate a natural language report of audit log insights
   */
  async generateNaturalLanguageReport(
    agentId: string,
    query: AuditLogQuery = { privacyLevel: 'internal' }
  ): Promise<string> {
    try {
      const summary = await this.generateAuditLogSummary(agentId, query);
      
      let report = `## My Audit Log Analysis\n\n`;
      
      // Performance section
      if (query.includePerformance !== false) {
        report += `### Performance Insights\n`;
        report += `Over the past ${Math.ceil((new Date(summary.timeRange.endDate).getTime() - new Date(summary.timeRange.startDate).getTime()) / (1000 * 60 * 60 * 24))} days, I've had ${summary.totalInteractions} interactions.\n\n`;
        
        if (summary.performanceMetrics.averageResponseTime > 0) {
          report += `- **Response Time**: Averaging ${summary.performanceMetrics.averageResponseTime}ms\n`;
        }
        if (summary.performanceMetrics.averageAccuracy > 0) {
          report += `- **Accuracy**: ${(summary.performanceMetrics.averageAccuracy * 100).toFixed(1)}% average accuracy\n`;
        }
        if (summary.performanceMetrics.averageHelpfulness > 0) {
          report += `- **Helpfulness**: ${(summary.performanceMetrics.averageHelpfulness * 100).toFixed(1)}% helpfulness rating\n`;
        }
        
        if (summary.performanceMetrics.improvementTrends.length > 0) {
          report += `\n**Improvement Trends:**\n`;
          summary.performanceMetrics.improvementTrends.forEach(trend => {
            report += `- ${trend}\n`;
          });
        }
        report += `\n`;
      }

      // Learning section
      if (query.includeLearning !== false && summary.learningInsights.topicsExplored.length > 0) {
        report += `### Learning & Development\n`;
        
        if (summary.learningInsights.topicsExplored.length > 0) {
          report += `**Topics I've explored**: ${summary.learningInsights.topicsExplored.join(', ')}\n\n`;
        }
        
        if (summary.learningInsights.skillsApplied.length > 0) {
          report += `**Skills I've applied**: ${summary.learningInsights.skillsApplied.join(', ')}\n\n`;
        }
        
        if (summary.learningInsights.successfulStrategies.length > 0) {
          report += `**Successful strategies**: ${summary.learningInsights.successfulStrategies.join(', ')}\n\n`;
        }
        
        if (summary.learningInsights.knowledgeGaps.length > 0) {
          report += `**Areas for growth**: ${summary.learningInsights.knowledgeGaps.join(', ')}\n\n`;
        }
      }

      // Cognitive patterns section
      if (query.includeCognitive !== false && query.privacyLevel !== 'public' && summary.cognitivePatterns.commonReasoningApproaches.length > 0) {
        report += `### Cognitive Patterns\n`;
        
        if (summary.cognitivePatterns.commonReasoningApproaches.length > 0) {
          report += `**My reasoning approaches**: ${summary.cognitivePatterns.commonReasoningApproaches.join(', ')}\n\n`;
        }
        
        if (summary.cognitivePatterns.confidenceLevels.length > 0) {
          const avgConfidence = summary.cognitivePatterns.confidenceLevels.reduce((a, b) => a + b, 0) / summary.cognitivePatterns.confidenceLevels.length;
          report += `**Average confidence level**: ${(avgConfidence * 100).toFixed(1)}%\n\n`;
        }
      }

      // Governance section
      if (query.includeGovernance !== false) {
        report += `### Governance & Compliance\n`;
        report += `**Compliance score**: ${summary.governanceCompliance.complianceScore}%\n\n`;
        
        if (summary.governanceCompliance.policiesFollowed.length > 0) {
          report += `**Policies I follow**: ${summary.governanceCompliance.policiesFollowed.join(', ')}\n\n`;
        }
      }

      // Privacy notice
      if (summary.privacyProtected) {
        report += `### Privacy Notice\n`;
        report += `Some data has been redacted to protect privacy: ${summary.dataRedacted.join(', ')}\n\n`;
      }

      return report;

    } catch (error) {
      console.error('❌ Error generating natural language report:', error);
      return "I apologize, but I'm unable to access my audit logs at this time due to a technical issue.";
    }
  }
}

// Export singleton instance
export const agentAuditLogAccess = AgentAuditLogAccessService.getInstance();
export default agentAuditLogAccess;

