/**
 * Autonomous Governance Dashboard
 * 
 * Real-time dashboard service for monitoring and controlling autonomous cognition
 * governance. Provides UI integration for governance monitoring, alerts, and
 * intervention capabilities.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { 
  autonomousGovernanceMonitor, 
  GovernanceMonitoringSession, 
  GovernanceAlert, 
  GovernanceReport,
  GovernanceIntervention 
} from './AutonomousGovernanceMonitor';
import { autonomousCognitionEngine } from './AutonomousCognitionEngine';
import { autonomousConsentManager } from './AutonomousConsentManager';

// Dashboard Types
export interface DashboardState {
  active_sessions: DashboardSession[];
  global_alerts: GovernanceAlert[];
  system_status: SystemStatus;
  performance_overview: PerformanceOverview;
  compliance_overview: ComplianceOverview;
  risk_overview: RiskOverview;
  recent_interventions: GovernanceIntervention[];
  user_activity: UserActivity[];
}

export interface DashboardSession {
  session_id: string;
  agent_id: string;
  user_id: string;
  status: string;
  started_at: string;
  duration: string;
  active_thoughts: number;
  compliance_rate: number;
  risk_level: string;
  recent_alerts: number;
  last_activity: string;
}

export interface SystemStatus {
  overall_health: 'healthy' | 'warning' | 'critical';
  active_sessions: number;
  total_agents_monitored: number;
  governance_interventions_today: number;
  compliance_rate_24h: number;
  system_load: number; // 0-100
  uptime: string;
}

export interface PerformanceOverview {
  thoughts_processed_today: number;
  successful_completions_today: number;
  average_processing_time: number;
  consent_approval_rate: number;
  user_satisfaction_score: number;
  performance_trend: 'improving' | 'stable' | 'declining';
}

export interface ComplianceOverview {
  overall_compliance_rate: number;
  policy_compliance_breakdown: Record<string, number>;
  violations_today: number;
  critical_violations: number;
  compliance_trend: 'improving' | 'stable' | 'declining';
  next_audit_date: string;
}

export interface RiskOverview {
  overall_risk_score: number;
  high_risk_sessions: number;
  risk_distribution: Record<string, number>;
  risk_trend: 'improving' | 'stable' | 'worsening';
  mitigation_effectiveness: number;
}

export interface UserActivity {
  user_id: string;
  agent_id: string;
  activity_type: 'consent_granted' | 'consent_denied' | 'intervention_requested' | 'session_started' | 'session_ended';
  timestamp: string;
  details: string;
}

export interface DashboardWidget {
  widget_id: string;
  widget_type: 'metric' | 'chart' | 'alert' | 'table' | 'status';
  title: string;
  data: any;
  refresh_interval: number; // seconds
  last_updated: string;
  status: 'loading' | 'ready' | 'error';
}

export interface AlertSummary {
  total_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  info_alerts: number;
  unresolved_alerts: number;
  alerts_by_type: Record<string, number>;
}

export interface InterventionSummary {
  total_interventions: number;
  interventions_by_type: Record<string, number>;
  pending_interventions: number;
  resolved_interventions: number;
  human_review_required: number;
}

/**
 * Autonomous Governance Dashboard Service
 * 
 * Provides real-time dashboard data and control capabilities
 */
export class AutonomousGovernanceDashboard {
  private dashboardState: DashboardState;
  private refreshInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, (state: DashboardState) => void> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();

  constructor() {
    this.dashboardState = this.initializeDashboardState();
    this.startRealTimeUpdates();
  }

  /**
   * Get current dashboard state
   */
  getDashboardState(): DashboardState {
    return { ...this.dashboardState };
  }

  /**
   * Subscribe to dashboard state updates
   */
  subscribe(subscriberId: string, callback: (state: DashboardState) => void): void {
    this.subscribers.set(subscriberId, callback);
  }

  /**
   * Unsubscribe from dashboard state updates
   */
  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  /**
   * Get session details
   */
  async getSessionDetails(sessionId: string): Promise<{
    session: DashboardSession;
    governance_status: any;
    active_thoughts: any[];
    recent_interventions: GovernanceIntervention[];
    alerts: GovernanceAlert[];
    performance_metrics: any;
  }> {
    const governanceStatus = autonomousGovernanceMonitor.getGovernanceStatus(sessionId);
    
    // Get session from active sessions
    const session = this.dashboardState.active_sessions.find(s => s.session_id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      session,
      governance_status: governanceStatus,
      active_thoughts: [], // Would be populated from governance monitor
      recent_interventions: [], // Would be populated from governance monitor
      alerts: [], // Would be populated from governance monitor
      performance_metrics: {} // Would be populated from governance monitor
    };
  }

  /**
   * Get alert summary
   */
  getAlertSummary(): AlertSummary {
    const allAlerts = this.dashboardState.global_alerts;
    
    return {
      total_alerts: allAlerts.length,
      critical_alerts: allAlerts.filter(a => a.severity === 'critical').length,
      warning_alerts: allAlerts.filter(a => a.severity === 'warning').length,
      info_alerts: allAlerts.filter(a => a.severity === 'info').length,
      unresolved_alerts: allAlerts.filter(a => a.requires_immediate_attention).length,
      alerts_by_type: this.groupAlertsByType(allAlerts)
    };
  }

  /**
   * Get intervention summary
   */
  getInterventionSummary(): InterventionSummary {
    const interventions = this.dashboardState.recent_interventions;
    
    return {
      total_interventions: interventions.length,
      interventions_by_type: this.groupInterventionsByType(interventions),
      pending_interventions: interventions.filter(i => i.resolution_status === 'pending').length,
      resolved_interventions: interventions.filter(i => i.resolution_status === 'resolved').length,
      human_review_required: interventions.filter(i => i.human_review_required).length
    };
  }

  /**
   * Trigger emergency stop for a session
   */
  async emergencyStop(sessionId: string, reason: string): Promise<void> {
    await autonomousGovernanceMonitor.emergencyStop(sessionId, reason);
    await this.refreshDashboardState();
  }

  /**
   * Trigger intervention for a session
   */
  async triggerIntervention(
    sessionId: string,
    interventionType: 'warning' | 'pause' | 'redirect' | 'terminate' | 'escalate',
    reason: string,
    thoughtId?: string
  ): Promise<void> {
    await autonomousGovernanceMonitor.triggerIntervention(sessionId, interventionType, reason, thoughtId);
    await this.refreshDashboardState();
  }

  /**
   * Generate governance report
   */
  async generateReport(
    sessionId: string,
    reportType: 'real_time' | 'session_summary' | 'compliance_audit' | 'risk_analysis' = 'session_summary'
  ): Promise<GovernanceReport> {
    return await autonomousGovernanceMonitor.generateGovernanceReport(sessionId, reportType);
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check compliance rate
    if (this.dashboardState.compliance_overview.overall_compliance_rate < 95) {
      issues.push(`Compliance rate below threshold: ${this.dashboardState.compliance_overview.overall_compliance_rate}%`);
      recommendations.push('Review policy compliance mechanisms');
    }
    
    // Check critical alerts
    const criticalAlerts = this.dashboardState.global_alerts.filter(a => a.severity === 'critical').length;
    if (criticalAlerts > 0) {
      issues.push(`${criticalAlerts} critical alerts require immediate attention`);
      recommendations.push('Address critical alerts immediately');
    }
    
    // Check system load
    if (this.dashboardState.system_status.system_load > 80) {
      issues.push(`High system load: ${this.dashboardState.system_status.system_load}%`);
      recommendations.push('Consider scaling resources or reducing load');
    }
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts > 0 || this.dashboardState.compliance_overview.overall_compliance_rate < 90) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }
    
    return { status, issues, recommendations };
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): {
    thoughts_processed: Array<{ timestamp: string; value: number }>;
    compliance_rate: Array<{ timestamp: string; value: number }>;
    risk_score: Array<{ timestamp: string; value: number }>;
    interventions: Array<{ timestamp: string; value: number }>;
  } {
    // Mock data - in production, this would come from time-series database
    const now = Date.now();
    const interval = timeRange === '1h' ? 5 * 60 * 1000 : 
                    timeRange === '24h' ? 60 * 60 * 1000 :
                    timeRange === '7d' ? 24 * 60 * 60 * 1000 :
                    7 * 24 * 60 * 60 * 1000;
    
    const points = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    
    return {
      thoughts_processed: Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(now - (points - i - 1) * interval).toISOString(),
        value: Math.floor(Math.random() * 50) + 10
      })),
      compliance_rate: Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(now - (points - i - 1) * interval).toISOString(),
        value: Math.floor(Math.random() * 10) + 90
      })),
      risk_score: Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(now - (points - i - 1) * interval).toISOString(),
        value: Math.floor(Math.random() * 30) + 20
      })),
      interventions: Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(now - (points - i - 1) * interval).toISOString(),
        value: Math.floor(Math.random() * 5)
      }))
    };
  }

  /**
   * Get widget data
   */
  getWidget(widgetId: string): DashboardWidget | null {
    return this.widgets.get(widgetId) || null;
  }

  /**
   * Update widget
   */
  async updateWidget(widgetId: string): Promise<void> {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    widget.status = 'loading';
    
    try {
      // Update widget data based on type
      switch (widget.widget_type) {
        case 'metric':
          widget.data = await this.getMetricData(widgetId);
          break;
        case 'chart':
          widget.data = await this.getChartData(widgetId);
          break;
        case 'alert':
          widget.data = this.getAlertSummary();
          break;
        case 'table':
          widget.data = await this.getTableData(widgetId);
          break;
        case 'status':
          widget.data = this.getSystemHealth();
          break;
      }
      
      widget.status = 'ready';
      widget.last_updated = new Date().toISOString();
    } catch (error) {
      widget.status = 'error';
      console.error(`Error updating widget ${widgetId}:`, error);
    }
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string> {
    const data = {
      dashboard_state: this.dashboardState,
      alert_summary: this.getAlertSummary(),
      intervention_summary: this.getInterventionSummary(),
      system_health: this.getSystemHealth(),
      performance_trends: this.getPerformanceTrends('24h'),
      exported_at: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'pdf':
        return this.generatePDFReport(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  // Private methods
  private initializeDashboardState(): DashboardState {
    return {
      active_sessions: [],
      global_alerts: [],
      system_status: {
        overall_health: 'healthy',
        active_sessions: 0,
        total_agents_monitored: 0,
        governance_interventions_today: 0,
        compliance_rate_24h: 100,
        system_load: 25,
        uptime: '99.9%'
      },
      performance_overview: {
        thoughts_processed_today: 0,
        successful_completions_today: 0,
        average_processing_time: 0,
        consent_approval_rate: 85,
        user_satisfaction_score: 90,
        performance_trend: 'stable'
      },
      compliance_overview: {
        overall_compliance_rate: 100,
        policy_compliance_breakdown: {
          'hipaa_comprehensive': 100,
          'sox_comprehensive': 100,
          'gdpr_comprehensive': 100
        },
        violations_today: 0,
        critical_violations: 0,
        compliance_trend: 'stable',
        next_audit_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      risk_overview: {
        overall_risk_score: 25,
        high_risk_sessions: 0,
        risk_distribution: {
          low: 80,
          medium: 15,
          high: 4,
          critical: 1
        },
        risk_trend: 'stable',
        mitigation_effectiveness: 95
      },
      recent_interventions: [],
      user_activity: []
    };
  }

  private startRealTimeUpdates(): void {
    // Update dashboard every 10 seconds
    this.refreshInterval = setInterval(async () => {
      await this.refreshDashboardState();
    }, 10000);
  }

  private async refreshDashboardState(): Promise<void> {
    try {
      // Update active sessions
      await this.updateActiveSessions();
      
      // Update global alerts
      await this.updateGlobalAlerts();
      
      // Update system status
      await this.updateSystemStatus();
      
      // Update performance overview
      await this.updatePerformanceOverview();
      
      // Update compliance overview
      await this.updateComplianceOverview();
      
      // Update risk overview
      await this.updateRiskOverview();
      
      // Update recent interventions
      await this.updateRecentInterventions();
      
      // Update user activity
      await this.updateUserActivity();
      
      // Notify subscribers
      this.notifySubscribers();
      
    } catch (error) {
      console.error('Error refreshing dashboard state:', error);
    }
  }

  private async updateActiveSessions(): Promise<void> {
    // In production, this would query the governance monitor for active sessions
    // For now, we'll use mock data
    this.dashboardState.active_sessions = [
      {
        session_id: 'session_123',
        agent_id: 'agent_456',
        user_id: 'user_789',
        status: 'active',
        started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        duration: '30 minutes',
        active_thoughts: 2,
        compliance_rate: 98,
        risk_level: 'low',
        recent_alerts: 0,
        last_activity: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      }
    ];
  }

  private async updateGlobalAlerts(): Promise<void> {
    // Mock global alerts
    this.dashboardState.global_alerts = [];
  }

  private async updateSystemStatus(): Promise<void> {
    this.dashboardState.system_status = {
      ...this.dashboardState.system_status,
      active_sessions: this.dashboardState.active_sessions.length,
      total_agents_monitored: this.dashboardState.active_sessions.length,
      system_load: Math.floor(Math.random() * 20) + 20 // Mock system load
    };
  }

  private async updatePerformanceOverview(): Promise<void> {
    // Mock performance data
    this.dashboardState.performance_overview = {
      ...this.dashboardState.performance_overview,
      thoughts_processed_today: Math.floor(Math.random() * 100) + 50,
      successful_completions_today: Math.floor(Math.random() * 90) + 45
    };
  }

  private async updateComplianceOverview(): Promise<void> {
    // Mock compliance data
    this.dashboardState.compliance_overview = {
      ...this.dashboardState.compliance_overview,
      overall_compliance_rate: Math.floor(Math.random() * 5) + 95
    };
  }

  private async updateRiskOverview(): Promise<void> {
    // Mock risk data
    this.dashboardState.risk_overview = {
      ...this.dashboardState.risk_overview,
      overall_risk_score: Math.floor(Math.random() * 20) + 20
    };
  }

  private async updateRecentInterventions(): Promise<void> {
    // Mock interventions
    this.dashboardState.recent_interventions = [];
  }

  private async updateUserActivity(): Promise<void> {
    // Mock user activity
    this.dashboardState.user_activity = [];
  }

  private notifySubscribers(): void {
    for (const [subscriberId, callback] of this.subscribers) {
      try {
        callback(this.dashboardState);
      } catch (error) {
        console.error(`Error notifying subscriber ${subscriberId}:`, error);
      }
    }
  }

  private groupAlertsByType(alerts: GovernanceAlert[]): Record<string, number> {
    return alerts.reduce((acc, alert) => {
      acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupInterventionsByType(interventions: GovernanceIntervention[]): Record<string, number> {
    return interventions.reduce((acc, intervention) => {
      acc[intervention.intervention_type] = (acc[intervention.intervention_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getMetricData(widgetId: string): Promise<any> {
    // Return metric data based on widget ID
    return { value: Math.floor(Math.random() * 100), trend: 'up' };
  }

  private async getChartData(widgetId: string): Promise<any> {
    // Return chart data based on widget ID
    return this.getPerformanceTrends('24h');
  }

  private async getTableData(widgetId: string): Promise<any> {
    // Return table data based on widget ID
    return this.dashboardState.active_sessions;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use proper CSV library
    return JSON.stringify(data);
  }

  private generatePDFReport(data: any): string {
    // PDF generation - in production, use proper PDF library
    return JSON.stringify(data);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.subscribers.clear();
    this.widgets.clear();
  }
}

// Singleton instance
export const autonomousGovernanceDashboard = new AutonomousGovernanceDashboard();

