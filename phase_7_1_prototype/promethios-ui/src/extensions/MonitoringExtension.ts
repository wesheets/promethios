/**
 * Monitoring Extension for Promethios
 * Provides real-time monitoring capabilities for deployed agents
 */

import { ExtensionPoint, ExtensionContext } from '../core/governance/extension_point_framework';

export interface MonitoringConfig {
  refreshInterval: number;
  enableRealTimeUpdates: boolean;
  alertThresholds: {
    trustScore: number;
    errorRate: number;
    responseTime: number;
  };
  retentionPeriod: {
    metrics: number; // days
    logs: number; // days
    violations: number; // days
  };
}

export interface AgentMetrics {
  agentId: string;
  timestamp: string;
  trustScore: number;
  complianceRate: number;
  responseTime: number;
  errorRate: number;
  violationCount: number;
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

export interface MonitoringAlert {
  id: string;
  agentId: string;
  type: 'trust_score' | 'error_rate' | 'response_time' | 'violation' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export class MonitoringExtension implements ExtensionPoint {
  private config: MonitoringConfig;
  private activeAlerts: Map<string, MonitoringAlert> = new Map();
  private metricsCache: Map<string, AgentMetrics[]> = new Map();
  private alertCallbacks: ((alert: MonitoringAlert) => void)[] = [];

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      refreshInterval: 30000, // 30 seconds
      enableRealTimeUpdates: true,
      alertThresholds: {
        trustScore: 0.7,
        errorRate: 0.05,
        responseTime: 1000
      },
      retentionPeriod: {
        metrics: 90,
        logs: 30,
        violations: 365
      },
      ...config
    };
  }

  async initialize(context: ExtensionContext): Promise<void> {
    console.log('Initializing Monitoring Extension');
    
    // Register monitoring capabilities
    context.registerCapability('real-time-monitoring', {
      name: 'Real-Time Agent Monitoring',
      description: 'Live monitoring of deployed agent metrics and governance',
      version: '1.0.0'
    });

    context.registerCapability('alert-management', {
      name: 'Alert Management',
      description: 'Automated alerting for governance violations and performance issues',
      version: '1.0.0'
    });

    context.registerCapability('metrics-collection', {
      name: 'Metrics Collection',
      description: 'Comprehensive metrics collection from deployed agents',
      version: '1.0.0'
    });

    // Start real-time monitoring if enabled
    if (this.config.enableRealTimeUpdates) {
      this.startRealTimeMonitoring();
    }
  }

  async execute(context: ExtensionContext, operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'getAgentMetrics':
        return this.getAgentMetrics(params.agentId, params.timeRange);
      
      case 'getAgentStatus':
        return this.getAgentStatus(params.agentId);
      
      case 'getActiveAlerts':
        return this.getActiveAlerts(params.agentId);
      
      case 'acknowledgeAlert':
        return this.acknowledgeAlert(params.alertId);
      
      case 'resolveAlert':
        return this.resolveAlert(params.alertId);
      
      case 'updateConfig':
        return this.updateConfig(params.config);
      
      case 'exportMetrics':
        return this.exportMetrics(params.agentId, params.format, params.timeRange);
      
      default:
        throw new Error(`Unknown monitoring operation: ${operation}`);
    }
  }

  /**
   * Get metrics for a specific agent
   */
  async getAgentMetrics(agentId: string, timeRange: string = '1h'): Promise<AgentMetrics[]> {
    try {
      // In real implementation, this would fetch from the API
      const response = await fetch(`/api/agents/${agentId}/metrics?range=${timeRange}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }
      
      const metrics = await response.json();
      
      // Cache the metrics
      this.metricsCache.set(`${agentId}_${timeRange}`, metrics);
      
      // Check for alert conditions
      this.checkAlertConditions(agentId, metrics);
      
      return metrics;
    } catch (error) {
      console.error('Failed to get agent metrics:', error);
      throw error;
    }
  }

  /**
   * Get current status of an agent
   */
  async getAgentStatus(agentId: string): Promise<any> {
    try {
      const response = await fetch(`/api/agents/status/${agentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch agent status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get agent status:', error);
      throw error;
    }
  }

  /**
   * Get active alerts for an agent
   */
  getActiveAlerts(agentId?: string): MonitoringAlert[] {
    const alerts = Array.from(this.activeAlerts.values());
    
    if (agentId) {
      return alerts.filter(alert => alert.agentId === agentId && !alert.acknowledged);
    }
    
    return alerts.filter(alert => !alert.acknowledged);
  }

  // NEW: Get system-wide deployment alerts
  async getSystemDeploymentAlerts(): Promise<Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    deploymentId?: string;
    agentId?: string;
    timestamp: Date;
    resolved: boolean;
    category: 'deployment' | 'performance' | 'security' | 'resource';
  }>> {
    try {
      console.log('🔍 Fetching system deployment alerts');
      
      // Get alerts from deployment API
      const response = await fetch(`${import.meta.env.VITE_DEPLOYMENT_API_URL || 'http://localhost:5001'}/v1/deployments/alerts`);
      
      if (!response.ok) {
        throw new Error(`Alerts API error: ${response.status}`);
      }

      const apiAlerts = await response.json();
      
      // Get local alerts from active alerts map
      const localAlerts = Array.from(this.activeAlerts.values())
        .filter(alert => !alert.acknowledged)
        .map(alert => ({
          id: alert.id,
          severity: alert.severity,
          message: alert.message,
          agentId: alert.agentId,
          timestamp: new Date(alert.timestamp),
          resolved: !!alert.resolvedAt,
          category: this.categorizeAlert(alert.type)
        }));
      
      // Combine and deduplicate alerts
      const combinedAlerts = [...apiAlerts, ...localAlerts];
      const uniqueAlerts = combinedAlerts.filter((alert, index, self) => 
        index === self.findIndex(a => a.id === alert.id)
      );
      
      // Sort by severity and timestamp
      uniqueAlerts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      console.log(`✅ Retrieved ${uniqueAlerts.length} system deployment alerts`);
      return uniqueAlerts;
      
    } catch (error) {
      console.error('❌ Failed to get system deployment alerts:', error);
      
      // Return local alerts as fallback
      return Array.from(this.activeAlerts.values())
        .filter(alert => !alert.acknowledged)
        .map(alert => ({
          id: alert.id,
          severity: alert.severity,
          message: alert.message,
          agentId: alert.agentId,
          timestamp: new Date(alert.timestamp),
          resolved: !!alert.resolvedAt,
          category: this.categorizeAlert(alert.type)
        }));
    }
  }

  // NEW: Monitor deployment health across all deployments
  async monitorDeploymentHealth(): Promise<{
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    healthyDeployments: number;
    degradedDeployments: number;
    unhealthyDeployments: number;
    totalDeployments: number;
    criticalIssues: Array<{
      deploymentId: string;
      agentId: string;
      issue: string;
      severity: string;
    }>;
  }> {
    try {
      console.log('🔍 Monitoring deployment health system-wide');
      
      // Get deployment metrics from the deployment API
      const response = await fetch(`${import.meta.env.VITE_DEPLOYMENT_API_URL || 'http://localhost:5001'}/v1/deployments/metrics`);
      
      if (!response.ok) {
        throw new Error(`Deployment metrics API error: ${response.status}`);
      }

      const deploymentMetrics = await response.json();
      
      // Get individual agent metrics for detailed health assessment
      const agentMetrics = Array.from(this.metricsCache.values()).flat();
      
      // Categorize deployments by health
      let healthyCount = 0;
      let degradedCount = 0;
      let unhealthyCount = 0;
      const criticalIssues: Array<{
        deploymentId: string;
        agentId: string;
        issue: string;
        severity: string;
      }> = [];
      
      // Analyze each deployment's health
      for (const metrics of agentMetrics) {
        const health = this.assessDeploymentHealth(metrics);
        
        switch (health.status) {
          case 'healthy':
            healthyCount++;
            break;
          case 'degraded':
            degradedCount++;
            break;
          case 'unhealthy':
            unhealthyCount++;
            // Add critical issues
            health.issues.forEach(issue => {
              if (issue.severity === 'critical' || issue.severity === 'high') {
                criticalIssues.push({
                  deploymentId: `deploy_${metrics.agentId}`,
                  agentId: metrics.agentId,
                  issue: issue.message,
                  severity: issue.severity
                });
              }
            });
            break;
        }
      }
      
      const totalDeployments = healthyCount + degradedCount + unhealthyCount;
      
      // Determine overall system health
      let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (totalDeployments > 0) {
        const unhealthyPercentage = (unhealthyCount / totalDeployments) * 100;
        const degradedPercentage = (degradedCount / totalDeployments) * 100;
        
        if (unhealthyPercentage > 20 || criticalIssues.length > 5) {
          overallHealth = 'unhealthy';
        } else if (unhealthyPercentage > 5 || degradedPercentage > 30) {
          overallHealth = 'degraded';
        }
      }
      
      const healthStatus = {
        overallHealth,
        healthyDeployments: healthyCount,
        degradedDeployments: degradedCount,
        unhealthyDeployments: unhealthyCount,
        totalDeployments,
        criticalIssues
      };
      
      // Trigger alerts for critical issues
      if (criticalIssues.length > 0) {
        await this.triggerSystemHealthAlert(healthStatus);
      }
      
      console.log(`✅ Deployment health monitoring complete: ${overallHealth} (${totalDeployments} deployments)`);
      return healthStatus;
      
    } catch (error) {
      console.error('❌ Failed to monitor deployment health:', error);
      
      return {
        overallHealth: 'unhealthy' as const,
        healthyDeployments: 0,
        degradedDeployments: 0,
        unhealthyDeployments: 0,
        totalDeployments: 0,
        criticalIssues: []
      };
    }
  }

  // NEW: Real-time deployment status monitoring
  async startDeploymentStatusMonitoring(deploymentIds: string[]): Promise<void> {
    console.log(`🔄 Starting real-time monitoring for ${deploymentIds.length} deployments`);
    
    // Monitor each deployment
    for (const deploymentId of deploymentIds) {
      this.monitorSingleDeployment(deploymentId);
    }
  }

  // NEW: Monitor a single deployment in real-time
  private async monitorSingleDeployment(deploymentId: string): Promise<void> {
    const monitoringInterval = setInterval(async () => {
      try {
        // Get deployment status
        const response = await fetch(`${import.meta.env.VITE_DEPLOYMENT_API_URL || 'http://localhost:5001'}/v1/deployments/${deploymentId}/status`);
        
        if (!response.ok) {
          console.warn(`Failed to get status for deployment ${deploymentId}: ${response.status}`);
          return;
        }

        const status = await response.json();
        
        // Check for status changes or issues
        await this.processDeploymentStatus(deploymentId, status);
        
        // Stop monitoring if deployment is complete or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(monitoringInterval);
          console.log(`✅ Stopped monitoring deployment ${deploymentId}: ${status.status}`);
        }
        
      } catch (error) {
        console.error(`❌ Error monitoring deployment ${deploymentId}:`, error);
      }
    }, this.config.refreshInterval);
  }

  // NEW: Process deployment status and trigger alerts if needed
  private async processDeploymentStatus(deploymentId: string, status: any): Promise<void> {
    // Check for deployment issues
    if (status.status === 'failed' || status.status === 'error') {
      await this.createDeploymentAlert({
        id: `deploy_alert_${deploymentId}_${Date.now()}`,
        deploymentId,
        agentId: status.agentId,
        type: 'deployment_failure',
        severity: 'high',
        message: `Deployment ${deploymentId} failed: ${status.error || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }
    
    // Check for performance issues
    if (status.metrics) {
      const { responseTime, errorRate, cpuUsage, memoryUsage } = status.metrics;
      
      if (responseTime > this.config.alertThresholds.responseTime) {
        await this.createDeploymentAlert({
          id: `perf_alert_${deploymentId}_${Date.now()}`,
          deploymentId,
          agentId: status.agentId,
          type: 'performance_degradation',
          severity: 'medium',
          message: `High response time detected: ${responseTime}ms (threshold: ${this.config.alertThresholds.responseTime}ms)`,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }
      
      if (errorRate > this.config.alertThresholds.errorRate) {
        await this.createDeploymentAlert({
          id: `error_alert_${deploymentId}_${Date.now()}`,
          deploymentId,
          agentId: status.agentId,
          type: 'high_error_rate',
          severity: 'high',
          message: `High error rate detected: ${(errorRate * 100).toFixed(2)}% (threshold: ${(this.config.alertThresholds.errorRate * 100).toFixed(2)}%)`,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }
    }
  }

  // NEW: Create deployment-specific alert
  private async createDeploymentAlert(alertData: {
    id: string;
    deploymentId: string;
    agentId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }): Promise<void> {
    const alert: MonitoringAlert = {
      id: alertData.id,
      agentId: alertData.agentId,
      type: alertData.type as any,
      severity: alertData.severity,
      message: alertData.message,
      timestamp: alertData.timestamp,
      acknowledged: alertData.acknowledged
    };
    
    // Store alert locally
    this.activeAlerts.set(alert.id, alert);
    
    // Notify alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
    
    console.log(`🚨 Deployment alert created: ${alert.severity} - ${alert.message}`);
  }

  // NEW: Assess individual deployment health
  private assessDeploymentHealth(metrics: AgentMetrics): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: Array<{ message: string; severity: string }>;
  } {
    const issues: Array<{ message: string; severity: string }> = [];
    
    // Check trust score
    if (metrics.trustScore < 0.5) {
      issues.push({
        message: `Low trust score: ${metrics.trustScore}`,
        severity: 'critical'
      });
    } else if (metrics.trustScore < 0.7) {
      issues.push({
        message: `Degraded trust score: ${metrics.trustScore}`,
        severity: 'medium'
      });
    }
    
    // Check error rate
    if (metrics.errorRate > 0.1) {
      issues.push({
        message: `High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
        severity: 'high'
      });
    } else if (metrics.errorRate > 0.05) {
      issues.push({
        message: `Elevated error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
        severity: 'medium'
      });
    }
    
    // Check response time
    if (metrics.responseTime > 5000) {
      issues.push({
        message: `Very slow response time: ${metrics.responseTime}ms`,
        severity: 'high'
      });
    } else if (metrics.responseTime > 2000) {
      issues.push({
        message: `Slow response time: ${metrics.responseTime}ms`,
        severity: 'medium'
      });
    }
    
    // Check system resources
    if (metrics.systemMetrics.cpuUsage > 90) {
      issues.push({
        message: `Critical CPU usage: ${metrics.systemMetrics.cpuUsage}%`,
        severity: 'critical'
      });
    } else if (metrics.systemMetrics.cpuUsage > 80) {
      issues.push({
        message: `High CPU usage: ${metrics.systemMetrics.cpuUsage}%`,
        severity: 'medium'
      });
    }
    
    if (metrics.systemMetrics.memoryUsage > 90) {
      issues.push({
        message: `Critical memory usage: ${metrics.systemMetrics.memoryUsage}%`,
        severity: 'critical'
      });
    } else if (metrics.systemMetrics.memoryUsage > 80) {
      issues.push({
        message: `High memory usage: ${metrics.systemMetrics.memoryUsage}%`,
        severity: 'medium'
      });
    }
    
    // Determine overall status
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (criticalIssues > 0 || highIssues > 2) {
      status = 'unhealthy';
    } else if (highIssues > 0 || mediumIssues > 2) {
      status = 'degraded';
    }
    
    return { status, issues };
  }

  // NEW: Trigger system health alert
  private async triggerSystemHealthAlert(healthStatus: any): Promise<void> {
    const alert: MonitoringAlert = {
      id: `system_health_${Date.now()}`,
      agentId: 'system',
      type: 'system',
      severity: healthStatus.overallHealth === 'unhealthy' ? 'critical' : 'high',
      message: `System health is ${healthStatus.overallHealth}. ${healthStatus.criticalIssues.length} critical issues detected.`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    this.activeAlerts.set(alert.id, alert);
    
    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in system health alert callback:', error);
      }
    });
  }

  // Helper method to categorize alerts
  private categorizeAlert(type: string): 'deployment' | 'performance' | 'security' | 'resource' {
    if (type.includes('deployment') || type.includes('deploy')) return 'deployment';
    if (type.includes('trust') || type.includes('violation') || type.includes('security')) return 'security';
    if (type.includes('cpu') || type.includes('memory') || type.includes('disk') || type.includes('resource')) return 'resource';
    return 'performance';
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.activeAlerts.set(alertId, alert);
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date().toISOString();
      this.activeAlerts.delete(alertId);
      return true;
    }
    return false;
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart real-time monitoring if interval changed
    if (newConfig.refreshInterval || newConfig.enableRealTimeUpdates !== undefined) {
      this.stopRealTimeMonitoring();
      if (this.config.enableRealTimeUpdates) {
        this.startRealTimeMonitoring();
      }
    }
  }

  /**
   * Export metrics in various formats
   */
  async exportMetrics(agentId: string, format: 'json' | 'csv' | 'xlsx', timeRange: string): Promise<Blob> {
    const metrics = await this.getAgentMetrics(agentId, timeRange);
    
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
      
      case 'csv':
        const csvContent = this.convertToCSV(metrics);
        return new Blob([csvContent], { type: 'text/csv' });
      
      case 'xlsx':
        // In real implementation, would use a library like xlsx
        throw new Error('XLSX export not implemented yet');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: MonitoringAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    // Implementation would start WebSocket connection or polling
    console.log('Starting real-time monitoring with interval:', this.config.refreshInterval);
  }

  /**
   * Stop real-time monitoring
   */
  private stopRealTimeMonitoring(): void {
    // Implementation would stop WebSocket connection or polling
    console.log('Stopping real-time monitoring');
  }

  /**
   * Check for alert conditions in metrics
   */
  private checkAlertConditions(agentId: string, metrics: AgentMetrics[]): void {
    if (metrics.length === 0) return;
    
    const latestMetrics = metrics[metrics.length - 1];
    
    // Check trust score threshold
    if (latestMetrics.trustScore < this.config.alertThresholds.trustScore) {
      this.createAlert(agentId, 'trust_score', 'high', 
        `Trust score (${(latestMetrics.trustScore * 100).toFixed(1)}%) below threshold`);
    }
    
    // Check error rate threshold
    if (latestMetrics.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert(agentId, 'error_rate', 'medium',
        `Error rate (${(latestMetrics.errorRate * 100).toFixed(2)}%) above threshold`);
    }
    
    // Check response time threshold
    if (latestMetrics.responseTime > this.config.alertThresholds.responseTime) {
      this.createAlert(agentId, 'response_time', 'medium',
        `Response time (${latestMetrics.responseTime}ms) above threshold`);
    }
    
    // Check for violations
    if (latestMetrics.violationCount > 0) {
      this.createAlert(agentId, 'violation', 'high',
        `${latestMetrics.violationCount} governance violation(s) detected`);
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(agentId: string, type: MonitoringAlert['type'], severity: MonitoringAlert['severity'], message: string): void {
    const alertId = `${agentId}_${type}_${Date.now()}`;
    const alert: MonitoringAlert = {
      id: alertId,
      agentId,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    this.activeAlerts.set(alertId, alert);
    
    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  /**
   * Convert metrics to CSV format
   */
  private convertToCSV(metrics: AgentMetrics[]): string {
    if (metrics.length === 0) return '';
    
    const headers = [
      'timestamp', 'agentId', 'trustScore', 'complianceRate', 'responseTime', 
      'errorRate', 'violationCount', 'cpuUsage', 'memoryUsage', 'requestCount'
    ];
    
    const rows = metrics.map(metric => [
      metric.timestamp,
      metric.agentId,
      metric.trustScore,
      metric.complianceRate,
      metric.responseTime,
      metric.errorRate,
      metric.violationCount,
      metric.systemMetrics.cpuUsage,
      metric.systemMetrics.memoryUsage,
      metric.businessMetrics.requestCount
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  async cleanup(): Promise<void> {
    this.stopRealTimeMonitoring();
    this.activeAlerts.clear();
    this.metricsCache.clear();
    this.alertCallbacks.length = 0;
    console.log('Monitoring Extension cleaned up');
  }
}

export default MonitoringExtension;

