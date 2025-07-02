/**
 * Deployed Agent Data Processor
 * 
 * Real-time data processing pipeline for deployed agent metrics, logs, and violations.
 * Integrates with existing notification system and MetricsCollectionService.
 * 
 * Features:
 * - Real-time data processing from deployed agents
 * - Automatic notification generation for critical events
 * - Integration with existing MetricsCollectionService
 * - Data validation and quality checks
 * - Transparent logging of all processing activities
 */

import { metricsService, GovernanceMetric } from './MetricsCollectionService';
import { UnifiedStorageService } from './UnifiedStorageService';
import { notificationBackendService } from './notificationBackendService';
import { deployedAgentAPI, AgentMetrics, AgentViolation, AgentLog } from './api/deployedAgentAPI';

export interface ProcessedAgentData {
  agentId: string;
  governanceIdentity: string;
  userId: string;
  processedAt: string;
  dataSource: 'deployed_agent';
  
  // Processed metrics
  metrics: {
    trustScore: number;
    complianceRate: number;
    responseTime: number;
    errorRate: number;
    requestCount: number;
    lastActivity: string;
  };
  
  // Processed violations
  violations: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    recent: AgentViolation[];
  };
  
  // Health assessment
  health: {
    status: 'healthy' | 'degraded' | 'critical' | 'offline';
    score: number;
    issues: string[];
    recommendations: string[];
  };
  
  // Data quality
  dataQuality: {
    freshness: 'live' | 'recent' | 'stale' | 'offline';
    completeness: number; // 0-100%
    accuracy: number; // 0-100%
    lastValidated: string;
  };
}

export interface DataProcessingEvent {
  id: string;
  agentId: string;
  eventType: 'metrics_processed' | 'violation_detected' | 'health_changed' | 'data_quality_issue';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: any;
  processedAt: string;
  notificationSent: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: string;
}

/**
 * Real-time data processor for deployed agents
 */
export class DeployedAgentDataProcessor {
  private storage: UnifiedStorageService;
  private processingQueue: Map<string, any[]> = new Map();
  private notificationRules: NotificationRule[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.storage = new UnifiedStorageService();
    this.initializeNotificationRules();
    this.startProcessing();
  }

  /**
   * Process incoming metrics from deployed agent
   */
  async processAgentMetrics(
    agentId: string,
    metrics: AgentMetrics,
    userId: string
  ): Promise<ProcessedAgentData> {
    try {
      console.log(`📊 Processing metrics for agent ${agentId}`);

      // Validate incoming data
      this.validateMetricsData(metrics);

      // Get existing agent data for comparison
      const existingData = await this.getExistingAgentData(agentId);

      // Process and calculate derived metrics
      const processedMetrics = this.calculateDerivedMetrics(metrics, existingData);

      // Assess agent health
      const healthAssessment = this.assessAgentHealth(processedMetrics, metrics);

      // Evaluate data quality
      const dataQuality = this.evaluateDataQuality(metrics);

      // Create processed data object
      const processedData: ProcessedAgentData = {
        agentId,
        governanceIdentity: metrics.governanceIdentity,
        userId,
        processedAt: new Date().toISOString(),
        dataSource: 'deployed_agent',
        metrics: processedMetrics,
        violations: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          recent: []
        },
        health: healthAssessment,
        dataQuality
      };

      // Store processed data
      await this.storeProcessedData(processedData);

      // Send to MetricsCollectionService for analytics
      await this.sendToMetricsCollection(processedData);

      // Check for notification triggers
      await this.checkNotificationRules(processedData, existingData);

      // Log processing event
      await this.logProcessingEvent({
        id: `metrics-${Date.now()}`,
        agentId,
        eventType: 'metrics_processed',
        severity: 'info',
        message: `Metrics processed successfully for agent ${agentId}`,
        data: { metricsCount: Object.keys(metrics.metrics).length },
        processedAt: new Date().toISOString(),
        notificationSent: false
      });

      console.log(`✅ Successfully processed metrics for agent ${agentId}`);
      return processedData;

    } catch (error) {
      console.error(`❌ Failed to process metrics for agent ${agentId}:`, error);
      
      // Log error event
      await this.logProcessingEvent({
        id: `error-${Date.now()}`,
        agentId,
        eventType: 'data_quality_issue',
        severity: 'critical',
        message: `Failed to process metrics: ${error.message}`,
        data: { error: error.message },
        processedAt: new Date().toISOString(),
        notificationSent: false
      });

      throw error;
    }
  }

  /**
   * Process incoming violations from deployed agent
   */
  async processAgentViolations(
    agentId: string,
    violations: AgentViolation[],
    userId: string
  ): Promise<void> {
    try {
      console.log(`🚨 Processing ${violations.length} violations for agent ${agentId}`);

      // Get existing agent data
      const existingData = await this.getExistingAgentData(agentId);
      if (!existingData) {
        throw new Error(`No existing data found for agent ${agentId}`);
      }

      // Process violations by severity
      const violationCounts = this.categorizeViolations(violations);

      // Update agent data with new violations
      existingData.violations = {
        total: violationCounts.total,
        critical: violationCounts.critical,
        high: violationCounts.high,
        medium: violationCounts.medium,
        low: violationCounts.low,
        recent: violations.slice(0, 10) // Keep 10 most recent
      };

      // Reassess health based on violations
      existingData.health = this.assessAgentHealthWithViolations(existingData, violations);

      // Store updated data
      await this.storeProcessedData(existingData);

      // Send violations to MetricsCollectionService
      for (const violation of violations) {
        const governanceMetric: GovernanceMetric = {
          type: 'violation_count',
          agentId,
          metric: 'policy_violation',
          value: 1,
          metadata: {
            severity: violation.severity,
            policyId: violation.policyId,
            description: violation.description,
            timestamp: violation.timestamp
          }
        };

        await metricsService.collectGovernanceMetric(governanceMetric, userId);
      }

      // Check for critical violation notifications
      const criticalViolations = violations.filter(v => v.severity === 'critical');
      if (criticalViolations.length > 0) {
        await this.sendCriticalViolationNotification(agentId, criticalViolations, userId);
      }

      // Log processing event
      await this.logProcessingEvent({
        id: `violations-${Date.now()}`,
        agentId,
        eventType: 'violation_detected',
        severity: criticalViolations.length > 0 ? 'critical' : 'warning',
        message: `Processed ${violations.length} violations (${criticalViolations.length} critical)`,
        data: { violations: violationCounts },
        processedAt: new Date().toISOString(),
        notificationSent: criticalViolations.length > 0
      });

      console.log(`✅ Successfully processed violations for agent ${agentId}`);

    } catch (error) {
      console.error(`❌ Failed to process violations for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Process incoming logs from deployed agent
   */
  async processAgentLogs(
    agentId: string,
    logs: AgentLog[],
    userId: string
  ): Promise<void> {
    try {
      console.log(`📝 Processing ${logs.length} logs for agent ${agentId}`);

      // Store logs with retention policy
      await this.storeLogs(agentId, logs, userId);

      // Analyze logs for patterns and issues
      const logAnalysis = this.analyzeLogs(logs);

      // Update agent health if issues detected
      if (logAnalysis.issuesDetected > 0) {
        const existingData = await this.getExistingAgentData(agentId);
        if (existingData) {
          existingData.health.issues.push(...logAnalysis.issues);
          await this.storeProcessedData(existingData);
        }
      }

      // Log processing event
      await this.logProcessingEvent({
        id: `logs-${Date.now()}`,
        agentId,
        eventType: 'metrics_processed',
        severity: logAnalysis.issuesDetected > 0 ? 'warning' : 'info',
        message: `Processed ${logs.length} logs (${logAnalysis.issuesDetected} issues detected)`,
        data: { logCount: logs.length, issues: logAnalysis.issuesDetected },
        processedAt: new Date().toISOString(),
        notificationSent: false
      });

      console.log(`✅ Successfully processed logs for agent ${agentId}`);

    } catch (error) {
      console.error(`❌ Failed to process logs for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get processed data for agent
   */
  async getProcessedAgentData(agentId: string): Promise<ProcessedAgentData | null> {
    try {
      return await this.storage.get('agents', `processed-data-${agentId}`);
    } catch (error) {
      console.error(`Failed to get processed data for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Get all processed data for user
   */
  async getUserProcessedData(userId: string): Promise<ProcessedAgentData[]> {
    try {
      // Get user's deployed agents
      const deployedAgents = await deployedAgentAPI.getUserDeployedAgents(userId);
      
      // Get processed data for each agent
      const processedDataPromises = deployedAgents.map(agent => 
        this.getProcessedAgentData(agent.agentId)
      );
      
      const processedDataResults = await Promise.all(processedDataPromises);
      
      // Filter out null results and return
      return processedDataResults.filter(data => data !== null) as ProcessedAgentData[];
    } catch (error) {
      console.error(`Failed to get user processed data for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private validateMetricsData(metrics: AgentMetrics): void {
    if (!metrics.agentId || !metrics.governanceIdentity) {
      throw new Error('Invalid metrics data: missing required fields');
    }

    if (!metrics.timestamp || new Date(metrics.timestamp).getTime() > Date.now()) {
      throw new Error('Invalid metrics data: invalid timestamp');
    }

    // Validate metric values
    for (const [key, value] of Object.entries(metrics.metrics)) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Invalid metric value for ${key}: ${value}`);
      }
    }
  }

  private async getExistingAgentData(agentId: string): Promise<ProcessedAgentData | null> {
    return await this.storage.get('agents', `processed-data-${agentId}`);
  }

  private calculateDerivedMetrics(metrics: AgentMetrics, existingData: ProcessedAgentData | null): ProcessedAgentData['metrics'] {
    const baseMetrics = metrics.metrics;
    
    // Calculate trust score based on compliance and performance
    const trustScore = this.calculateTrustScore(baseMetrics, existingData);
    
    // Calculate compliance rate
    const complianceRate = this.calculateComplianceRate(baseMetrics, existingData);
    
    return {
      trustScore,
      complianceRate,
      responseTime: baseMetrics.responseTime || 0,
      errorRate: baseMetrics.errorRate || 0,
      requestCount: baseMetrics.requestCount || 0,
      lastActivity: metrics.timestamp
    };
  }

  private calculateTrustScore(metrics: any, existingData: ProcessedAgentData | null): number {
    // Base trust score calculation
    let trustScore = 100;
    
    // Reduce based on error rate
    if (metrics.errorRate > 0) {
      trustScore -= Math.min(metrics.errorRate * 10, 30);
    }
    
    // Reduce based on response time
    if (metrics.responseTime > 5000) {
      trustScore -= Math.min((metrics.responseTime - 5000) / 1000 * 5, 20);
    }
    
    // Consider historical performance
    if (existingData) {
      const historicalTrust = existingData.metrics.trustScore;
      trustScore = (trustScore * 0.3) + (historicalTrust * 0.7); // Weighted average
    }
    
    return Math.max(0, Math.min(100, Math.round(trustScore)));
  }

  private calculateComplianceRate(metrics: any, existingData: ProcessedAgentData | null): number {
    // Base compliance rate (100% if no violations)
    let complianceRate = 100;
    
    // This will be updated when violations are processed
    if (existingData && existingData.violations.total > 0) {
      const violationImpact = Math.min(existingData.violations.total * 2, 50);
      complianceRate = Math.max(0, 100 - violationImpact);
    }
    
    return Math.round(complianceRate);
  }

  private assessAgentHealth(metrics: ProcessedAgentData['metrics'], rawMetrics: AgentMetrics): ProcessedAgentData['health'] {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;
    
    // Check response time
    if (metrics.responseTime > 5000) {
      issues.push('High response time detected');
      recommendations.push('Optimize agent processing or increase resources');
      score -= 20;
    }
    
    // Check error rate
    if (metrics.errorRate > 5) {
      issues.push('High error rate detected');
      recommendations.push('Review agent logic and error handling');
      score -= 30;
    }
    
    // Check trust score
    if (metrics.trustScore < 70) {
      issues.push('Low trust score');
      recommendations.push('Review governance policies and agent behavior');
      score -= 25;
    }
    
    // Determine status
    let status: ProcessedAgentData['health']['status'];
    if (score >= 80) status = 'healthy';
    else if (score >= 60) status = 'degraded';
    else if (score >= 30) status = 'critical';
    else status = 'offline';
    
    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  private assessAgentHealthWithViolations(data: ProcessedAgentData, violations: AgentViolation[]): ProcessedAgentData['health'] {
    const health = { ...data.health };
    
    // Add violation-specific issues
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      health.issues.push(`${criticalViolations.length} critical policy violations`);
      health.recommendations.push('Review and address critical policy violations immediately');
      health.score = Math.max(0, health.score - (criticalViolations.length * 15));
    }
    
    // Update status based on new score
    if (health.score >= 80) health.status = 'healthy';
    else if (health.score >= 60) health.status = 'degraded';
    else if (health.score >= 30) health.status = 'critical';
    else health.status = 'offline';
    
    return health;
  }

  private evaluateDataQuality(metrics: AgentMetrics): ProcessedAgentData['dataQuality'] {
    const now = Date.now();
    const metricsTime = new Date(metrics.timestamp).getTime();
    const ageMinutes = (now - metricsTime) / (1000 * 60);
    
    // Determine freshness
    let freshness: ProcessedAgentData['dataQuality']['freshness'];
    if (ageMinutes < 1) freshness = 'live';
    else if (ageMinutes < 5) freshness = 'recent';
    else if (ageMinutes < 30) freshness = 'stale';
    else freshness = 'offline';
    
    // Calculate completeness (percentage of expected metrics present)
    const expectedMetrics = ['responseTime', 'errorRate', 'requestCount', 'trustScore'];
    const presentMetrics = expectedMetrics.filter(metric => 
      metrics.metrics.hasOwnProperty(metric) && metrics.metrics[metric] !== undefined
    );
    const completeness = Math.round((presentMetrics.length / expectedMetrics.length) * 100);
    
    // Calculate accuracy (basic validation)
    let accuracy = 100;
    if (metrics.metrics.errorRate < 0 || metrics.metrics.errorRate > 100) accuracy -= 25;
    if (metrics.metrics.responseTime < 0) accuracy -= 25;
    if (metrics.metrics.requestCount < 0) accuracy -= 25;
    
    return {
      freshness,
      completeness,
      accuracy: Math.max(0, accuracy),
      lastValidated: new Date().toISOString()
    };
  }

  private categorizeViolations(violations: AgentViolation[]) {
    const counts = {
      total: violations.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical': counts.critical++; break;
        case 'high': counts.high++; break;
        case 'medium': counts.medium++; break;
        case 'low': counts.low++; break;
      }
    });
    
    return counts;
  }

  private analyzeLogs(logs: AgentLog[]) {
    const issues: string[] = [];
    let issuesDetected = 0;
    
    // Look for error patterns
    const errorLogs = logs.filter(log => log.level === 'error');
    if (errorLogs.length > 0) {
      issues.push(`${errorLogs.length} error logs detected`);
      issuesDetected += errorLogs.length;
    }
    
    // Look for warning patterns
    const warningLogs = logs.filter(log => log.level === 'warn');
    if (warningLogs.length > 5) {
      issues.push(`High number of warning logs (${warningLogs.length})`);
      issuesDetected += 1;
    }
    
    return { issues, issuesDetected };
  }

  private async storeProcessedData(data: ProcessedAgentData): Promise<void> {
    await this.storage.set('agents', `processed-data-${data.agentId}`, data);
  }

  private async storeLogs(agentId: string, logs: AgentLog[], userId: string): Promise<void> {
    const logData = {
      agentId,
      userId,
      logs,
      storedAt: new Date().toISOString()
    };
    
    await this.storage.set('agents', `logs-${agentId}-${Date.now()}`, logData);
  }

  private async sendToMetricsCollection(data: ProcessedAgentData): Promise<void> {
    // Send governance metrics to existing MetricsCollectionService
    const governanceMetrics: GovernanceMetric[] = [
      {
        type: 'trust_score',
        agentId: data.agentId,
        metric: 'trust_score',
        value: data.metrics.trustScore,
        metadata: { governanceIdentity: data.governanceIdentity }
      },
      {
        type: 'compliance_rate',
        agentId: data.agentId,
        metric: 'compliance_rate',
        value: data.metrics.complianceRate,
        metadata: { governanceIdentity: data.governanceIdentity }
      }
    ];
    
    for (const metric of governanceMetrics) {
      await metricsService.collectGovernanceMetric(metric, data.userId);
    }
  }

  private async checkNotificationRules(
    currentData: ProcessedAgentData, 
    previousData: ProcessedAgentData | null
  ): Promise<void> {
    for (const rule of this.notificationRules) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered).getTime() + (rule.cooldownMinutes * 60 * 1000);
        if (Date.now() < cooldownEnd) continue;
      }
      
      // Evaluate rule condition
      if (this.evaluateNotificationRule(rule, currentData, previousData)) {
        await this.sendNotification(rule, currentData);
        rule.lastTriggered = new Date().toISOString();
      }
    }
  }

  private evaluateNotificationRule(
    rule: NotificationRule,
    currentData: ProcessedAgentData,
    previousData: ProcessedAgentData | null
  ): boolean {
    // Simple rule evaluation (could be expanded with a proper rule engine)
    switch (rule.condition) {
      case 'trust_score_below_70':
        return currentData.metrics.trustScore < 70;
      
      case 'health_status_critical':
        return currentData.health.status === 'critical';
      
      case 'data_quality_stale':
        return currentData.dataQuality.freshness === 'stale' || currentData.dataQuality.freshness === 'offline';
      
      case 'trust_score_dropped_significantly':
        return previousData && (previousData.metrics.trustScore - currentData.metrics.trustScore) > 20;
      
      default:
        return false;
    }
  }

  private async sendNotification(rule: NotificationRule, data: ProcessedAgentData): Promise<void> {
    try {
      await notificationBackendService.createNotification({
        userId: data.userId,
        type: 'governance_alert',
        title: `Agent Governance Alert: ${rule.name}`,
        message: this.generateNotificationMessage(rule, data),
        source: 'system',
        severity: rule.severity,
        action_required: rule.severity === 'critical',
        metadata: {
          agentId: data.agentId,
          governanceIdentity: data.governanceIdentity,
          ruleId: rule.id,
          triggerData: {
            trustScore: data.metrics.trustScore,
            healthStatus: data.health.status,
            dataFreshness: data.dataQuality.freshness
          }
        }
      });
      
      console.log(`📢 Sent notification for rule ${rule.name} to user ${data.userId}`);
    } catch (error) {
      console.error(`Failed to send notification for rule ${rule.name}:`, error);
    }
  }

  private async sendCriticalViolationNotification(
    agentId: string,
    violations: AgentViolation[],
    userId: string
  ): Promise<void> {
    try {
      await notificationBackendService.createNotification({
        userId,
        type: 'governance_violation',
        title: 'Critical Policy Violations Detected',
        message: `Agent ${agentId} has ${violations.length} critical policy violation${violations.length === 1 ? '' : 's'}. Immediate attention required.`,
        source: 'system',
        severity: 'critical',
        action_required: true,
        metadata: {
          agentId,
          violationCount: violations.length,
          violations: violations.map(v => ({
            policyId: v.policyId,
            description: v.description,
            timestamp: v.timestamp
          }))
        }
      });
      
      console.log(`🚨 Sent critical violation notification for agent ${agentId}`);
    } catch (error) {
      console.error(`Failed to send critical violation notification:`, error);
    }
  }

  private generateNotificationMessage(rule: NotificationRule, data: ProcessedAgentData): string {
    switch (rule.condition) {
      case 'trust_score_below_70':
        return `Agent ${data.agentId} trust score has dropped to ${data.metrics.trustScore}%. Review governance policies and agent behavior.`;
      
      case 'health_status_critical':
        return `Agent ${data.agentId} health status is critical (${data.health.score}%). Issues: ${data.health.issues.join(', ')}.`;
      
      case 'data_quality_stale':
        return `Agent ${data.agentId} data is ${data.dataQuality.freshness}. Last update: ${data.metrics.lastActivity}.`;
      
      default:
        return `Agent ${data.agentId} triggered governance alert: ${rule.name}`;
    }
  }

  private async logProcessingEvent(event: DataProcessingEvent): Promise<void> {
    await this.storage.set('agents', `processing-event-${event.id}`, event);
  }

  private initializeNotificationRules(): void {
    this.notificationRules = [
      {
        id: 'trust-score-low',
        name: 'Low Trust Score',
        condition: 'trust_score_below_70',
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 60
      },
      {
        id: 'health-critical',
        name: 'Critical Health Status',
        condition: 'health_status_critical',
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30
      },
      {
        id: 'data-stale',
        name: 'Stale Data',
        condition: 'data_quality_stale',
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 120
      },
      {
        id: 'trust-drop',
        name: 'Significant Trust Score Drop',
        condition: 'trust_score_dropped_significantly',
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30
      }
    ];
  }

  private startProcessing(): void {
    // Start background processing every 30 seconds
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        this.isProcessing = true;
        try {
          await this.processQueuedData();
        } catch (error) {
          console.error('Error in background processing:', error);
        } finally {
          this.isProcessing = false;
        }
      }
    }, 30000);
  }

  private async processQueuedData(): Promise<void> {
    // Process any queued data (for batch processing if needed)
    // This could be expanded for more sophisticated queuing
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Export singleton instance
export const deployedAgentDataProcessor = new DeployedAgentDataProcessor();

