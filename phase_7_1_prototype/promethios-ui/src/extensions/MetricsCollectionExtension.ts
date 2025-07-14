/**
 * Metrics Collection Extension for Promethios
 * 
 * Provides metrics collection functionality for deployed agents following extension pattern
 */

import { metricsService } from '../services/MetricsCollectionService';
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
 * Metrics Collection Extension Class/**
 * Provides metrics collection functionality following extension pattern
 */
export class MetricsCollectionExtension {
  private static instance: MetricsCollectionExtension;
  private initialized = false;
  private storage: UnifiedStorageService;
  private dataProcessor: DeployedAgentDataProcessor;

  private constructor() {
    this.storage = new UnifiedStorageService();
    this.dataProcessor = new DeployedAgentDataProcessor();
  } static getInstance(): MetricsCollectionExtension {
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
      // Storage is already initialized in constructor
      // Initialize data processor if it has an initialize method
      if (this.dataProcessor && typeof this.dataProcessor.initialize === 'function') {
        await this.dataProcessor.initialize();
      }
      
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
        governanceMetrics: processedMetrics.governance,
        performanceMetrics: processedMetrics.performance,
        systemMetrics: processedMetrics.system,
        businessMetrics: processedMetrics.business
      };
      
      // After collection extension point
      await this.afterMetricsCollection(agentId, agentMetrics);
      
      return agentMetrics;
      
    } catch (error) {
      await this.onMetricsError(agentId, error as Error, { deploymentId });
      return null;
    }
  }

  // NEW: Collect system-wide deployment metrics
  async collectSystemWideMetrics(): Promise<{
    totalDeployments: number;
    activeDeployments: number;
    failedDeployments: number;
    successRate: number;
    averageResponseTime: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
    deploymentsByType: Record<string, number>;
    deploymentsByEnvironment: Record<string, number>;
    resourceUtilization: {
      cpu: number;
      memory: number;
      storage: number;
    };
  }> {
    try {
      console.log('🔍 Collecting system-wide deployment metrics');
      
      // Get all deployment records
      const deployments = await this.storage.getMany('production_deployments', []);
      const validDeployments = deployments.filter(d => d !== null);
      
      // Get all agent metrics
      const allMetrics = await this.storage.getMany('agent_metrics', []);
      const validMetrics = allMetrics.filter(m => m !== null);
      
      // Calculate deployment statistics
      const totalDeployments = validDeployments.length;
      const activeDeployments = validDeployments.filter(d => 
        d.status === 'running' || d.status === 'deploying'
      ).length;
      const failedDeployments = validDeployments.filter(d => 
        d.status === 'failed' || d.status === 'error'
      ).length;
      const successRate = totalDeployments > 0 ? 
        ((totalDeployments - failedDeployments) / totalDeployments) * 100 : 0;
      
      // Calculate average response time
      const responseTimes = validMetrics
        .map(m => m.performanceMetrics?.responseTime)
        .filter(rt => rt !== undefined && rt !== null);
      const averageResponseTime = responseTimes.length > 0 ? 
        responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0;
      
      // Determine system health
      let systemHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (successRate < 50 || averageResponseTime > 5000) {
        systemHealth = 'unhealthy';
      } else if (successRate < 80 || averageResponseTime > 2000) {
        systemHealth = 'degraded';
      }
      
      // Group deployments by type
      const deploymentsByType: Record<string, number> = {};
      validDeployments.forEach(d => {
        const type = d.deploymentType || 'unknown';
        deploymentsByType[type] = (deploymentsByType[type] || 0) + 1;
      });
      
      // Group deployments by environment
      const deploymentsByEnvironment: Record<string, number> = {};
      validDeployments.forEach(d => {
        const env = d.environment || 'production';
        deploymentsByEnvironment[env] = (deploymentsByEnvironment[env] || 0) + 1;
      });
      
      // Calculate resource utilization
      const cpuUsages = validMetrics
        .map(m => m.systemMetrics?.cpuUsage)
        .filter(cpu => cpu !== undefined && cpu !== null);
      const memoryUsages = validMetrics
        .map(m => m.systemMetrics?.memoryUsage)
        .filter(mem => mem !== undefined && mem !== null);
      const diskUsages = validMetrics
        .map(m => m.systemMetrics?.diskUsage)
        .filter(disk => disk !== undefined && disk !== null);
      
      const resourceUtilization = {
        cpu: cpuUsages.length > 0 ? 
          cpuUsages.reduce((sum, cpu) => sum + cpu, 0) / cpuUsages.length : 0,
        memory: memoryUsages.length > 0 ? 
          memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length : 0,
        storage: diskUsages.length > 0 ? 
          diskUsages.reduce((sum, disk) => sum + disk, 0) / diskUsages.length : 0
      };
      
      const systemMetrics = {
        totalDeployments,
        activeDeployments,
        failedDeployments,
        successRate,
        averageResponseTime,
        systemHealth,
        deploymentsByType,
        deploymentsByEnvironment,
        resourceUtilization
      };
      
      // Cache system metrics
      await this.storage.set('system_wide_metrics', 'latest', {
        ...systemMetrics,
        lastUpdated: new Date()
      });
      
      console.log('✅ System-wide metrics collected successfully');
      return systemMetrics;
      
    } catch (error) {
      console.error('❌ Failed to collect system-wide metrics:', error);
      
      // Return cached metrics if available
      const cached = await this.storage.get('system_wide_metrics', 'latest');
      if (cached) {
        return cached;
      }
      
      // Return default metrics
      return {
        totalDeployments: 0,
        activeDeployments: 0,
        failedDeployments: 0,
        successRate: 0,
        averageResponseTime: 0,
        systemHealth: 'unhealthy' as const,
        deploymentsByType: {},
        deploymentsByEnvironment: {},
        resourceUtilization: { cpu: 0, memory: 0, storage: 0 }
      };
    }
  }

  // NEW: Collect deployment-specific metrics for a user
  async collectUserDeploymentMetrics(userId: string): Promise<{
    userDeployments: number;
    activeUserDeployments: number;
    userSuccessRate: number;
    averageUserResponseTime: number;
    userResourceUsage: {
      cpu: number;
      memory: number;
      storage: number;
    };
    recentDeployments: Array<{
      deploymentId: string;
      agentId: string;
      status: string;
      createdAt: Date;
      health: string;
    }>;
  }> {
    try {
      console.log(`🔍 Collecting deployment metrics for user ${userId}`);
      
      // Get user's deployments
      const allDeployments = await this.storage.getMany('production_deployments', []);
      const userDeployments = allDeployments.filter(d => d && d.userId === userId);
      
      // Get user's agent metrics
      const allMetrics = await this.storage.getMany('agent_metrics', []);
      const userMetrics = allMetrics.filter(m => {
        if (!m) return false;
        return userDeployments.some(d => d.agentId === m.agentId);
      });
      
      // Calculate user statistics
      const totalUserDeployments = userDeployments.length;
      const activeUserDeployments = userDeployments.filter(d => 
        d.status === 'running' || d.status === 'deploying'
      ).length;
      const failedUserDeployments = userDeployments.filter(d => 
        d.status === 'failed' || d.status === 'error'
      ).length;
      const userSuccessRate = totalUserDeployments > 0 ? 
        ((totalUserDeployments - failedUserDeployments) / totalUserDeployments) * 100 : 0;
      
      // Calculate user's average response time
      const userResponseTimes = userMetrics
        .map(m => m.performanceMetrics?.responseTime)
        .filter(rt => rt !== undefined && rt !== null);
      const averageUserResponseTime = userResponseTimes.length > 0 ? 
        userResponseTimes.reduce((sum, rt) => sum + rt, 0) / userResponseTimes.length : 0;
      
      // Calculate user's resource usage
      const userCpuUsages = userMetrics
        .map(m => m.systemMetrics?.cpuUsage)
        .filter(cpu => cpu !== undefined && cpu !== null);
      const userMemoryUsages = userMetrics
        .map(m => m.systemMetrics?.memoryUsage)
        .filter(mem => mem !== undefined && mem !== null);
      const userStorageUsages = userMetrics
        .map(m => m.systemMetrics?.diskUsage)
        .filter(disk => disk !== undefined && disk !== null);
      
      const userResourceUsage = {
        cpu: userCpuUsages.length > 0 ? 
          userCpuUsages.reduce((sum, cpu) => sum + cpu, 0) / userCpuUsages.length : 0,
        memory: userMemoryUsages.length > 0 ? 
          userMemoryUsages.reduce((sum, mem) => sum + mem, 0) / userMemoryUsages.length : 0,
        storage: userStorageUsages.length > 0 ? 
          userStorageUsages.reduce((sum, disk) => sum + disk, 0) / userStorageUsages.length : 0
      };
      
      // Get recent deployments with health status
      const recentDeployments = userDeployments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(d => {
          const metrics = userMetrics.find(m => m.agentId === d.agentId);
          return {
            deploymentId: d.deploymentId,
            agentId: d.agentId,
            status: d.status,
            createdAt: new Date(d.createdAt),
            health: this.determineHealthFromMetrics(metrics)
          };
        });
      
      const userMetricsData = {
        userDeployments: totalUserDeployments,
        activeUserDeployments,
        userSuccessRate,
        averageUserResponseTime,
        userResourceUsage,
        recentDeployments
      };
      
      // Cache user metrics
      await this.storage.set('user_deployment_metrics', userId, {
        ...userMetricsData,
        lastUpdated: new Date()
      });
      
      console.log(`✅ User deployment metrics collected for ${userId}`);
      return userMetricsData;
      
    } catch (error) {
      console.error(`❌ Failed to collect user deployment metrics for ${userId}:`, error);
      
      // Return default metrics
      return {
        userDeployments: 0,
        activeUserDeployments: 0,
        userSuccessRate: 0,
        averageUserResponseTime: 0,
        userResourceUsage: { cpu: 0, memory: 0, storage: 0 },
        recentDeployments: []
      };
    }
  }

  // NEW: Get deployment performance trends
  async getDeploymentPerformanceTrends(timeRange: { start: Date; end: Date }): Promise<{
    deploymentTrend: Array<{ date: Date; count: number; successRate: number }>;
    performanceTrend: Array<{ date: Date; responseTime: number; throughput: number }>;
    resourceTrend: Array<{ date: Date; cpu: number; memory: number; storage: number }>;
  }> {
    try {
      console.log('🔍 Collecting deployment performance trends');
      
      // Get all metrics within time range
      const allMetrics = await this.storage.getMany('agent_metrics', []);
      const timeRangeMetrics = allMetrics.filter(m => {
        if (!m || !m.timestamp) return false;
        const timestamp = new Date(m.timestamp);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      });
      
      // Get all deployments within time range
      const allDeployments = await this.storage.getMany('production_deployments', []);
      const timeRangeDeployments = allDeployments.filter(d => {
        if (!d || !d.createdAt) return false;
        const createdAt = new Date(d.createdAt);
        return createdAt >= timeRange.start && createdAt <= timeRange.end;
      });
      
      // Group data by day
      const dailyData: Record<string, {
        deployments: any[];
        metrics: any[];
      }> = {};
      
      // Process deployments by day
      timeRangeDeployments.forEach(d => {
        const dateKey = new Date(d.createdAt).toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { deployments: [], metrics: [] };
        }
        dailyData[dateKey].deployments.push(d);
      });
      
      // Process metrics by day
      timeRangeMetrics.forEach(m => {
        const dateKey = new Date(m.timestamp).toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { deployments: [], metrics: [] };
        }
        dailyData[dateKey].metrics.push(m);
      });
      
      // Calculate trends
      const deploymentTrend = Object.entries(dailyData).map(([dateStr, data]) => {
        const date = new Date(dateStr);
        const count = data.deployments.length;
        const failed = data.deployments.filter(d => d.status === 'failed' || d.status === 'error').length;
        const successRate = count > 0 ? ((count - failed) / count) * 100 : 0;
        
        return { date, count, successRate };
      }).sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const performanceTrend = Object.entries(dailyData).map(([dateStr, data]) => {
        const date = new Date(dateStr);
        const metrics = data.metrics;
        
        const responseTimes = metrics.map(m => m.performanceMetrics?.responseTime).filter(rt => rt !== undefined);
        const throughputs = metrics.map(m => m.performanceMetrics?.throughput).filter(tp => tp !== undefined);
        
        const responseTime = responseTimes.length > 0 ? 
          responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0;
        const throughput = throughputs.length > 0 ? 
          throughputs.reduce((sum, tp) => sum + tp, 0) / throughputs.length : 0;
        
        return { date, responseTime, throughput };
      }).sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const resourceTrend = Object.entries(dailyData).map(([dateStr, data]) => {
        const date = new Date(dateStr);
        const metrics = data.metrics;
        
        const cpuUsages = metrics.map(m => m.systemMetrics?.cpuUsage).filter(cpu => cpu !== undefined);
        const memoryUsages = metrics.map(m => m.systemMetrics?.memoryUsage).filter(mem => mem !== undefined);
        const storageUsages = metrics.map(m => m.systemMetrics?.diskUsage).filter(disk => disk !== undefined);
        
        const cpu = cpuUsages.length > 0 ? 
          cpuUsages.reduce((sum, cpu) => sum + cpu, 0) / cpuUsages.length : 0;
        const memory = memoryUsages.length > 0 ? 
          memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length : 0;
        const storage = storageUsages.length > 0 ? 
          storageUsages.reduce((sum, disk) => sum + disk, 0) / storageUsages.length : 0;
        
        return { date, cpu, memory, storage };
      }).sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const trends = {
        deploymentTrend,
        performanceTrend,
        resourceTrend
      };
      
      // Cache trends
      await this.storage.set('deployment_trends', `${timeRange.start.toISOString()}_${timeRange.end.toISOString()}`, {
        ...trends,
        lastUpdated: new Date()
      });
      
      console.log('✅ Deployment performance trends collected');
      return trends;
      
    } catch (error) {
      console.error('❌ Failed to collect deployment performance trends:', error);
      return {
        deploymentTrend: [],
        performanceTrend: [],
        resourceTrend: []
      };
    }
  }

  // Helper method to determine health from metrics
  private determineHealthFromMetrics(metrics: AgentMetrics | undefined): string {
    if (!metrics) return 'unknown';
    
    const { performanceMetrics, systemMetrics } = metrics;
    
    // Check performance indicators
    const responseTimeOk = !performanceMetrics?.responseTime || performanceMetrics.responseTime < 2000;
    const errorRateOk = !performanceMetrics?.errorRate || performanceMetrics.errorRate < 0.05;
    const uptimeOk = !performanceMetrics?.uptime || performanceMetrics.uptime > 0.95;
    
    // Check system indicators
    const cpuOk = !systemMetrics?.cpuUsage || systemMetrics.cpuUsage < 80;
    const memoryOk = !systemMetrics?.memoryUsage || systemMetrics.memoryUsage < 80;
    
    const healthyIndicators = [responseTimeOk, errorRateOk, uptimeOk, cpuOk, memoryOk];
    const healthyCount = healthyIndicators.filter(Boolean).length;
    
    if (healthyCount >= 4) return 'healthy';
    if (healthyCount >= 3) return 'degraded';
    return 'unhealthy';
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

  // NEW: Execute method for extension compatibility
  async execute(context: any, action: string, params: any): Promise<any> {
    console.log(`🔧 MetricsCollectionExtension.execute called: ${action}`);
    
    try {
      switch (action) {
        case 'collectSystemWideMetrics':
          return await this.collectSystemWideMetrics();
          
        case 'collectUserDeploymentMetrics':
          const userId = params?.userId || context?.userId;
          if (!userId) {
            throw new Error('userId is required for collectUserDeploymentMetrics');
          }
          return await this.collectUserDeploymentMetrics(userId);
          
        case 'getDeploymentPerformanceTrends':
          const timeRange = params?.timeRange || {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            end: new Date()
          };
          return await this.getDeploymentPerformanceTrends(timeRange);
          
        case 'aggregateUserMetrics':
          const userIdForAgg = params?.userId || context?.userId;
          const timeRangeForAgg = params?.timeRange || {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            end: new Date()
          };
          if (!userIdForAgg) {
            throw new Error('userId is required for aggregateUserMetrics');
          }
          return await this.aggregateUserMetrics(userIdForAgg, timeRangeForAgg);
          
        case 'getActiveAlerts':
          const userIdForAlerts = params?.userId || context?.userId;
          if (!userIdForAlerts) {
            throw new Error('userId is required for getActiveAlerts');
          }
          return await this.getActiveAlerts(userIdForAlerts);
          
        default:
          console.warn(`⚠️ Unknown action: ${action}`);
          return null;
      }
    } catch (error) {
      console.error(`❌ Error executing ${action}:`, error);
      throw error;
    }
  }

  // Getter methods
  getMetricsService() {
    return metricsService;
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

