/**
 * Metrics Collection Extension for Promethios
 * 
 * Provides metrics collection functionality for deployed agents following extension pattern
 */

import { MetricsCollectionService } from '../services/MetricsCollectionService';
import { UnifiedStorageService } from '../services/UnifiedStorageService';
import { deployedAgentAPI } from '../services/api/deployedAgentAPI';
import { DeployedAgentDataProcessor } from '../services/DeployedAgentDataProcessor';
import { notificationBackendService } from '../services/notificationBackendService';

export interface AgentMetrics {
  agentId: string;
  deploymentId: string;
  timestamp: Date;
  governanceMetrics: {
    trustScore: number;
    complianceRate: number;
    violationCount: number;
    policyViolations: string[];
  };
  performanceMetrics: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  businessMetrics: {
    requestCount: number;
    userInteractions: number;
    successRate: number;
    revenue?: number;
  };
}

export interface MetricsAggregation {
  userId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  totalAgents: number;
  averageTrustScore: number;
  averageComplianceRate: number;
  totalViolations: number;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  trends: {
    trustScoreTrend: 'up' | 'down' | 'stable';
    complianceTrend: 'up' | 'down' | 'stable';
    performanceTrend: 'up' | 'down' | 'stable';
  };
}

export interface MetricsAlert {
  id: string;
  agentId: string;
  deploymentId: string;
  type: 'trust_drop' | 'compliance_violation' | 'performance_degradation' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Metrics Collection Extension Class
 * Provides metrics collection functionality following extension pattern
 */
export class MetricsCollectionExtension {
  private static instance: MetricsCollectionExtension;
  private initialized = false;
  private metricsService: MetricsCollectionService;
  private storage: UnifiedStorageService;
  private dataProcessor: DeployedAgentDataProcessor;

  private constructor() {
    this.metricsService = new MetricsCollectionService();
    this.storage = new UnifiedStorageService();
    this.dataProcessor = new DeployedAgentDataProcessor();
  }

  static getInstance(): MetricsCollectionExtension {
    if (!MetricsCollectionExtension.instance) {
      MetricsCollectionExtension.instance = new MetricsCollectionExtension();
    }
    return MetricsCollectionExtension.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // Initialize storage
      await this.storage.initialize();
      
      // Initialize data processor
      await this.dataProcessor.initialize();
      
      this.initialized = true;
      console.log('MetricsCollectionExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MetricsCollectionExtension:', error);
      return false;
    }
  }

  // Extension point: Before metrics collection
  async beforeMetricsCollection(agentId: string, deploymentId: string): Promise<void> {
    console.log(`Before metrics collection: ${agentId} (${deploymentId})`);
    
    // Log collection attempt
    await this.storage.set('metrics_audit', `before_${agentId}_${Date.now()}`, {
      agentId,
      deploymentId,
      action: 'collect',
      timestamp: new Date()
    });
  }

  // Extension point: After metrics collection
  async afterMetricsCollection(agentId: string, metrics: AgentMetrics): Promise<void> {
    console.log(`After metrics collection: ${agentId}`);
    
    // Store metrics
    await this.storage.set('agent_metrics', `${agentId}_${Date.now()}`, metrics);
    
    // Process metrics for alerts
    await this.processMetricsForAlerts(metrics);
    
    // Log successful collection
    await this.storage.set('metrics_audit', `after_${agentId}_${Date.now()}`, {
      agentId,
      metricsCollected: true,
      timestamp: new Date()
    });
  }

  // Extension point: On metrics error
  async onMetricsError(agentId: string, error: Error, context: any): Promise<void> {
    console.error(`Metrics collection error for agent ${agentId}:`, error);
    
    // Log metrics error
    await this.storage.set('metrics_errors', `error_${agentId}_${Date.now()}`, {
      agentId,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    });
  }

  // Extension point: On alert triggered
  async onAlertTriggered(alert: MetricsAlert): Promise<void> {
    console.log(`Alert triggered: ${alert.type} for agent ${alert.agentId}`);
    
    // Store alert
    await this.storage.set('metrics_alerts', alert.id, alert);
    
    // Send notification if critical
    if (alert.severity === 'critical' || alert.severity === 'high') {
      await this.sendAlertNotification(alert);
    }
  }

  // Extension point: On aggregation complete
  async onAggregationComplete(userId: string, aggregation: MetricsAggregation): Promise<void> {
    console.log(`Aggregation complete for user ${userId}`);
    
    // Store aggregation
    await this.storage.set('metrics_aggregations', `${userId}_${Date.now()}`, aggregation);
    
    // Update user dashboard data
    await this.updateDashboardData(userId, aggregation);
  }

  // Core metrics collection methods
  async collectAgentMetrics(agentId: string, deploymentId: string): Promise<AgentMetrics | null> {
    try {
      // Before collection extension point
      await this.beforeMetricsCollection(agentId, deploymentId);
      
      // Get latest metrics from deployed agent
      const rawMetrics = await deployedAgentAPI.getAgentMetrics(agentId);
      if (!rawMetrics) {
        return null;
      }
      
      // Process and structure metrics
      const processedMetrics = await this.dataProcessor.processMetrics(rawMetrics);
      
      const agentMetrics: AgentMetrics = {
        agentId,
        deploymentId,
        timestamp: new Date(),
        governanceMetrics: {
          trustScore: processedMetrics.trustScore || 0,
          complianceRate: processedMetrics.complianceRate || 0,
          violationCount: processedMetrics.violationCount || 0,
          policyViolations: processedMetrics.policyViolations || []
        },
        performanceMetrics: {
          responseTime: processedMetrics.responseTime || 0,
          throughput: processedMetrics.throughput || 0,
          errorRate: processedMetrics.errorRate || 0,
          uptime: processedMetrics.uptime || 0
        },
        systemMetrics: {
          cpuUsage: processedMetrics.cpuUsage || 0,
          memoryUsage: processedMetrics.memoryUsage || 0,
          diskUsage: processedMetrics.diskUsage || 0,
          networkIO: processedMetrics.networkIO || 0
        },
        businessMetrics: {
          requestCount: processedMetrics.requestCount || 0,
          userInteractions: processedMetrics.userInteractions || 0,
          successRate: processedMetrics.successRate || 0,
          revenue: processedMetrics.revenue
        }
      };
      
      // After collection extension point
      await this.afterMetricsCollection(agentId, agentMetrics);
      
      return agentMetrics;
      
    } catch (error) {
      await this.onMetricsError(agentId, error as Error, { deploymentId });
      return null;
    }
  }

  async aggregateUserMetrics(userId: string, timeRange: { start: Date; end: Date }): Promise<MetricsAggregation> {
    try {
      // Get all user's agent metrics in time range
      const userAgents = await this.getUserAgents(userId);
      const allMetrics: AgentMetrics[] = [];
      
      for (const agentId of userAgents) {
        const agentMetrics = await this.getAgentMetricsInRange(agentId, timeRange);
        allMetrics.push(...agentMetrics);
      }
      
      // Calculate aggregations
      const aggregation: MetricsAggregation = {
        userId,
        timeRange,
        totalAgents: userAgents.length,
        averageTrustScore: this.calculateAverage(allMetrics, 'governanceMetrics.trustScore'),
        averageComplianceRate: this.calculateAverage(allMetrics, 'governanceMetrics.complianceRate'),
        totalViolations: this.calculateSum(allMetrics, 'governanceMetrics.violationCount'),
        systemHealth: this.calculateSystemHealth(allMetrics),
        trends: {
          trustScoreTrend: this.calculateTrend(allMetrics, 'governanceMetrics.trustScore'),
          complianceTrend: this.calculateTrend(allMetrics, 'governanceMetrics.complianceRate'),
          performanceTrend: this.calculateTrend(allMetrics, 'performanceMetrics.responseTime', true) // inverse for response time
        }
      };
      
      // After aggregation extension point
      await this.onAggregationComplete(userId, aggregation);
      
      return aggregation;
      
    } catch (error) {
      console.error(`Failed to aggregate metrics for user ${userId}:`, error);
      throw error;
    }
  }

  async getActiveAlerts(userId: string): Promise<MetricsAlert[]> {
    try {
      const userAgents = await this.getUserAgents(userId);
      const allAlerts = await this.storage.getMany<MetricsAlert>('metrics_alerts', []);
      
      return allAlerts
        .filter(alert => alert && userAgents.includes(alert.agentId) && !alert.acknowledged)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
    } catch (error) {
      console.error(`Failed to get active alerts for user ${userId}:`, error);
      return [];
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const alert = await this.storage.get<MetricsAlert>('metrics_alerts', alertId);
      if (alert) {
        alert.acknowledged = true;
        await this.storage.set('metrics_alerts', alertId, alert);
      }
    } catch (error) {
      console.error(`Failed to acknowledge alert ${alertId}:`, error);
    }
  }

  // Private helper methods
  private async processMetricsForAlerts(metrics: AgentMetrics): Promise<void> {
    const alerts: MetricsAlert[] = [];
    
    // Trust score alerts
    if (metrics.governanceMetrics.trustScore < 0.7) {
      alerts.push({
        id: `trust_${metrics.agentId}_${Date.now()}`,
        agentId: metrics.agentId,
        deploymentId: metrics.deploymentId,
        type: 'trust_drop',
        severity: metrics.governanceMetrics.trustScore < 0.5 ? 'critical' : 'high',
        message: `Trust score dropped to ${(metrics.governanceMetrics.trustScore * 100).toFixed(1)}%`,
        threshold: 0.7,
        currentValue: metrics.governanceMetrics.trustScore,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // Compliance alerts
    if (metrics.governanceMetrics.complianceRate < 0.9) {
      alerts.push({
        id: `compliance_${metrics.agentId}_${Date.now()}`,
        agentId: metrics.agentId,
        deploymentId: metrics.deploymentId,
        type: 'compliance_violation',
        severity: metrics.governanceMetrics.complianceRate < 0.8 ? 'critical' : 'medium',
        message: `Compliance rate dropped to ${(metrics.governanceMetrics.complianceRate * 100).toFixed(1)}%`,
        threshold: 0.9,
        currentValue: metrics.governanceMetrics.complianceRate,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // Performance alerts
    if (metrics.performanceMetrics.responseTime > 5000) { // 5 seconds
      alerts.push({
        id: `performance_${metrics.agentId}_${Date.now()}`,
        agentId: metrics.agentId,
        deploymentId: metrics.deploymentId,
        type: 'performance_degradation',
        severity: metrics.performanceMetrics.responseTime > 10000 ? 'high' : 'medium',
        message: `Response time increased to ${metrics.performanceMetrics.responseTime}ms`,
        threshold: 5000,
        currentValue: metrics.performanceMetrics.responseTime,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // Trigger alerts
    for (const alert of alerts) {
      await this.onAlertTriggered(alert);
    }
  }

  private async sendAlertNotification(alert: MetricsAlert): Promise<void> {
    try {
      // Get user ID from agent
      const deployment = await this.storage.get('deployments', alert.deploymentId);
      if (!deployment) return;
      
      await notificationBackendService.createNotification({
        userId: deployment.userId,
        type: 'governance_alert',
        title: `${alert.type.replace('_', ' ').toUpperCase()} Alert`,
        message: alert.message,
        source: 'system',
        severity: alert.severity,
        action_required: alert.severity === 'critical',
        metadata: {
          agentId: alert.agentId,
          deploymentId: alert.deploymentId,
          alertId: alert.id
        }
      });
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  private async updateDashboardData(userId: string, aggregation: MetricsAggregation): Promise<void> {
    // Update dashboard cache
    await this.storage.set('dashboard_data', userId, {
      ...aggregation,
      lastUpdated: new Date()
    });
  }

  private async getUserAgents(userId: string): Promise<string[]> {
    try {
      const deployments = await this.storage.getMany('deployments', []);
      return deployments
        .filter(d => d && d.userId === userId)
        .map(d => d.agentId || d.wrapperId);
    } catch (error) {
      console.error(`Failed to get user agents for ${userId}:`, error);
      return [];
    }
  }

  private async getAgentMetricsInRange(agentId: string, timeRange: { start: Date; end: Date }): Promise<AgentMetrics[]> {
    try {
      const allMetrics = await this.storage.getMany<AgentMetrics>('agent_metrics', []);
      return allMetrics
        .filter(m => m && 
          m.agentId === agentId && 
          m.timestamp >= timeRange.start && 
          m.timestamp <= timeRange.end
        )
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error(`Failed to get metrics for agent ${agentId}:`, error);
      return [];
    }
  }

  private calculateAverage(metrics: AgentMetrics[], path: string): number {
    if (metrics.length === 0) return 0;
    
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => typeof v === 'number');
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateSum(metrics: AgentMetrics[], path: string): number {
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => typeof v === 'number');
    return values.reduce((sum, val) => sum + val, 0);
  }

  private calculateSystemHealth(metrics: AgentMetrics[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (metrics.length === 0) return 'unhealthy';
    
    const avgTrust = this.calculateAverage(metrics, 'governanceMetrics.trustScore');
    const avgCompliance = this.calculateAverage(metrics, 'governanceMetrics.complianceRate');
    const avgErrorRate = this.calculateAverage(metrics, 'performanceMetrics.errorRate');
    
    if (avgTrust > 0.8 && avgCompliance > 0.9 && avgErrorRate < 0.05) {
      return 'healthy';
    } else if (avgTrust > 0.6 && avgCompliance > 0.8 && avgErrorRate < 0.1) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  private calculateTrend(metrics: AgentMetrics[], path: string, inverse: boolean = false): 'up' | 'down' | 'stable' {
    if (metrics.length < 2) return 'stable';
    
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => typeof v === 'number');
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;
    const threshold = Math.abs(first) * 0.05; // 5% threshold
    
    if (Math.abs(change) < threshold) {
      return 'stable';
    }
    
    const isUp = change > 0;
    return inverse ? (isUp ? 'down' : 'up') : (isUp ? 'up' : 'down');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Getter methods
  getMetricsService(): MetricsCollectionService {
    return this.metricsService;
  }

  getStorageService(): UnifiedStorageService {
    return this.storage;
  }

  getDataProcessor(): DeployedAgentDataProcessor {
    return this.dataProcessor;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const metricsCollectionExtension = MetricsCollectionExtension.getInstance();

