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

