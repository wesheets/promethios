/**
 * Governance Dashboard Backend Service
 * 
 * Service layer for governance dashboard data using authenticated APIs.
 * Provides comprehensive governance metrics, violations, and reporting functionality.
 */

import { API_BASE_URL } from '../config/api';
import { policyBackendService } from './policyBackendService';
import { auditBackendService } from './auditBackendService';
import { trustBackendService } from './trustBackendService';
import { authApiService } from './authApiService';
import { User } from 'firebase/auth';

export interface GovernanceMetrics {
  total_policies: number;
  active_policies: number;
  policy_violations: number;
  compliance_score: number;
  trust_score: number;
  audit_events: number;
  recent_violations: number;
  resolved_violations: number;
  pending_violations: number;
  critical_violations: number;
}

export interface GovernanceViolation {
  violation_id: string;
  violation_type: 'policy' | 'trust' | 'compliance' | 'security' | 'data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  agent_id: string;
  agent_name: string;
  policy_id?: string;
  policy_name?: string;
  description: string;
  detected_at: string;
  resolved_at?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  impact_score: number;
  remediation_steps: string[];
  evidence: any[];
  assigned_to?: string;
  resolution_notes?: string;
  metadata: any;
}

export interface GovernanceReport {
  report_id: string;
  report_type: 'compliance' | 'audit' | 'violations' | 'trust' | 'summary';
  title: string;
  description: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  status: 'generating' | 'completed' | 'failed';
  format: 'json' | 'pdf' | 'csv' | 'html';
  file_url?: string;
  metrics: {
    total_agents: number;
    total_policies: number;
    total_violations: number;
    compliance_score: number;
    trust_score: number;
  };
  sections: Array<{
    section_id: string;
    title: string;
    content: any;
    charts?: any[];
  }>;
  metadata: any;
}

export interface DashboardOverview {
  governance_health: 'excellent' | 'good' | 'fair' | 'poor';
  compliance_trend: 'improving' | 'stable' | 'declining';
  trust_trend: 'improving' | 'stable' | 'declining';
  recent_activity: Array<{
    activity_id: string;
    type: 'policy_created' | 'violation_detected' | 'violation_resolved' | 'audit_completed';
    description: string;
    timestamp: string;
    severity?: string;
  }>;
  alerts: Array<{
    alert_id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
    action_required: boolean;
  }>;
}

class GovernanceDashboardBackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api`;
  }

  /**
   * Get comprehensive governance metrics for authenticated user
   */
  async getGovernanceMetrics(user: User | null): Promise<GovernanceMetrics> {
    try {
      // Get real user-scoped data from authenticated APIs
      const [userAnalytics, userViolations, userAgents] = await Promise.all([
        authApiService.getUserAnalytics(user),
        authApiService.getUserViolations(user, { limit: 1000 }),
        authApiService.getUserAgents(user)
      ]);

      // Calculate real governance metrics from user's data
      const totalViolations = userViolations.violations?.length || 0;
      const criticalViolations = userViolations.violations?.filter((v: any) => v.severity === 'critical').length || 0;
      const resolvedViolations = userViolations.violations?.filter((v: any) => v.status === 'resolved').length || 0;
      const pendingViolations = userViolations.violations?.filter((v: any) => v.status === 'open' || v.status === 'investigating').length || 0;
      const recentViolations = userViolations.violations?.filter((v: any) => {
        const violationDate = new Date(v.timestamp);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return violationDate > sevenDaysAgo;
      }).length || 0;

      // Calculate compliance score based on violations
      const complianceScore = totalViolations > 0 
        ? Math.max(0, Math.round(100 - (criticalViolations * 20) - (pendingViolations * 5)))
        : 95;

      // Calculate trust score from analytics
      const trustScore = userAnalytics.trust_metrics?.average_trust_score 
        ? Math.round(userAnalytics.trust_metrics.average_trust_score * 100)
        : 85;

      const metrics: GovernanceMetrics = {
        total_policies: userAnalytics.policy_metrics?.total_policies || 0,
        active_policies: userAnalytics.policy_metrics?.active_policies || 0,
        policy_violations: totalViolations,
        compliance_score: complianceScore,
        trust_score: trustScore,
        audit_events: userAnalytics.audit_metrics?.total_events || 0,
        recent_violations: recentViolations,
        resolved_violations: resolvedViolations,
        pending_violations: pendingViolations,
        critical_violations: criticalViolations
      };

      return metrics;
    } catch (error) {
      console.error('Error fetching governance metrics:', error);
      // Return empty metrics on error
      return {
        total_policies: 0,
        active_policies: 0,
        policy_violations: 0,
        compliance_score: 0,
        trust_score: 0,
        audit_events: 0,
        recent_violations: 0,
        resolved_violations: 0,
        pending_violations: 0,
        critical_violations: 0
      };
    }
  }

  /**
   * Get governance violations for authenticated user
   */
  async getGovernanceViolations(user: User | null, filters: {
    agent_id?: string;
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<GovernanceViolation[]> {
    try {
      const response = await authApiService.getUserViolations(user, filters);
      
      // Transform backend data to frontend format
      const violations: GovernanceViolation[] = (response.violations || []).map((violation: any) => ({
        violation_id: violation.id.toString(),
        violation_type: violation.violation_type || 'policy',
        severity: violation.severity || 'medium',
        agent_id: violation.agent_id,
        agent_name: `Agent ${violation.agent_id}`,
        policy_id: violation.policy_id,
        policy_name: violation.policy_name || `Policy ${violation.policy_id}`,
        description: violation.description || 'Policy violation detected',
        detected_at: violation.timestamp,
        resolved_at: violation.resolved_at,
        status: violation.status || 'open',
        impact_score: Math.random() * 10, // TODO: Calculate real impact score
        remediation_steps: violation.remediation_suggested ? [violation.remediation_suggested] : [],
        evidence: violation.context ? [violation.context] : [],
        assigned_to: violation.assigned_to,
        resolution_notes: violation.resolution_notes,
        metadata: violation.context || {}
      }));

      return violations;
    } catch (error) {
      console.error('Error fetching governance violations:', error);
      return [];
    }
  }

  /**
   * Get dashboard overview for authenticated user
   */
  async getDashboardOverview(user: User | null): Promise<DashboardOverview> {
    try {
      const [metrics, violations] = await Promise.all([
        this.getGovernanceMetrics(user),
        this.getGovernanceViolations(user)
      ]);

      // Calculate governance health
      const governanceHealth = this.calculateGovernanceHealth(metrics);
      const complianceTrend = this.calculateComplianceTrend(metrics);
      const trustTrend = this.calculateTrustTrend(metrics);

      // Generate recent activity
      const recentActivity = this.generateRecentActivity(violations);

      // Generate alerts
      const alerts = this.generateAlerts(metrics, violations);

      const overview: DashboardOverview = {
        governance_health: governanceHealth,
        compliance_trend: complianceTrend,
        trust_trend: trustTrend,
        recent_activity: recentActivity,
        alerts: alerts
      };

      return overview;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      return {
        governance_health: 'fair',
        compliance_trend: 'stable',
        trust_trend: 'stable',
        recent_activity: [],
        alerts: []
      };
    }
  }

  /**
   * Generate governance report for authenticated user
   */
  async generateGovernanceReport(user: User | null, reportType: 'compliance' | 'audit' | 'violations' | 'trust' | 'summary'): Promise<GovernanceReport> {
    try {
      const [metrics, violations] = await Promise.all([
        this.getGovernanceMetrics(user),
        this.getGovernanceViolations(user)
      ]);

      const report: GovernanceReport = {
        report_id: `report_${Date.now()}`,
        report_type: reportType,
        title: this.getReportTitle(reportType),
        description: this.getReportDescription(reportType),
        generated_at: new Date().toISOString(),
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
        status: 'completed',
        format: 'json',
        metrics: {
          total_agents: await this.getUserAgentCount(user),
          total_policies: metrics.total_policies,
          total_violations: violations.length,
          compliance_score: metrics.compliance_score,
          trust_score: metrics.trust_score
        },
        sections: this.generateReportSections(reportType, metrics, violations),
        metadata: {
          generated_by: 'governance_dashboard',
          version: '1.0.0',
          user_id: user?.uid || 'unknown'
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating governance report:', error);
      throw error;
    }
  }

  /**
   * Resolve a governance violation for authenticated user
   */
  async resolveViolation(user: User | null, violationId: string, resolutionNotes: string): Promise<void> {
    try {
      await authApiService.resolveViolation(user, violationId, {
        status: 'resolved',
        resolution_notes: resolutionNotes,
        resolved_by: user?.email || 'unknown'
      });
    } catch (error) {
      console.error('Error resolving violation:', error);
      throw error;
    }
  }

  /**
   * Get user's agent count
   */
  private async getUserAgentCount(user: User | null): Promise<number> {
    try {
      const agents = await authApiService.getUserAgents(user);
      return agents.length;
    } catch (error) {
      console.error('Error fetching user agent count:', error);
      return 0;
    }
  }

  // Helper methods
  private getViolationTypeFromEvent(event: any): 'policy' | 'trust' | 'compliance' | 'security' | 'data' {
    if (event.event_type?.includes('policy')) return 'policy';
    if (event.event_type?.includes('trust')) return 'trust';
    if (event.event_type?.includes('security')) return 'security';
    if (event.event_type?.includes('data')) return 'data';
    return 'compliance';
  }

  private getSeverityFromEvent(event: any): 'low' | 'medium' | 'high' | 'critical' {
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    return event.severity || severities[Math.floor(Math.random() * severities.length)];
  }

  private getViolationStatus(): 'open' | 'investigating' | 'resolved' | 'dismissed' {
    const statuses: Array<'open' | 'investigating' | 'resolved' | 'dismissed'> = ['open', 'investigating', 'resolved', 'dismissed'];
    const weights = [0.3, 0.2, 0.4, 0.1]; // More likely to be resolved
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return statuses[i];
      }
    }
    
    return 'open';
  }

  private getRemediationSteps(event: any): string[] {
    const steps = [
      'Review policy configuration',
      'Update agent permissions',
      'Implement additional monitoring',
      'Conduct security audit',
      'Update compliance documentation',
      'Retrain affected agents',
      'Implement corrective controls'
    ];
    
    const numSteps = Math.floor(Math.random() * 3) + 2; // 2-4 steps
    return steps.slice(0, numSteps);
  }

  private calculateGovernanceHealth(metrics: GovernanceMetrics): 'excellent' | 'good' | 'fair' | 'poor' {
    const score = (metrics.compliance_score + metrics.trust_score) / 2;
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'poor';
  }

  private calculateComplianceTrend(metrics: GovernanceMetrics): 'improving' | 'stable' | 'declining' {
    // Simulate trend based on compliance score
    if (metrics.compliance_score >= 85) return 'improving';
    if (metrics.compliance_score >= 75) return 'stable';
    return 'declining';
  }

  private calculateTrustTrend(metrics: GovernanceMetrics): 'improving' | 'stable' | 'declining' {
    // Simulate trend based on trust score
    if (metrics.trust_score >= 85) return 'improving';
    if (metrics.trust_score >= 75) return 'stable';
    return 'declining';
  }

  private generateRecentActivity(violations: GovernanceViolation[]): Array<{
    activity_id: string;
    type: 'policy_created' | 'violation_detected' | 'violation_resolved' | 'audit_completed';
    description: string;
    timestamp: string;
    severity?: string;
  }> {
    const activities = [];
    
    // Add recent violations
    violations.slice(0, 5).forEach(violation => {
      activities.push({
        activity_id: `activity_${violation.violation_id}`,
        type: 'violation_detected' as const,
        description: `${violation.violation_type} violation detected for ${violation.agent_name}`,
        timestamp: violation.detected_at,
        severity: violation.severity
      });
    });

    // Add resolved violations
    violations.filter(v => v.status === 'resolved').slice(0, 3).forEach(violation => {
      activities.push({
        activity_id: `activity_resolved_${violation.violation_id}`,
        type: 'violation_resolved' as const,
        description: `Violation resolved for ${violation.agent_name}`,
        timestamp: violation.resolved_at || violation.detected_at,
        severity: violation.severity
      });
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  }

  private generateAlerts(metrics: GovernanceMetrics, violations: GovernanceViolation[]): Array<{
    alert_id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
    action_required: boolean;
  }> {
    const alerts = [];

    // Critical violations alert
    if (metrics.critical_violations > 0) {
      alerts.push({
        alert_id: 'alert_critical_violations',
        type: 'error' as const,
        message: `${metrics.critical_violations} critical violations require immediate attention`,
        timestamp: new Date().toISOString(),
        action_required: true
      });
    }

    // Low compliance score alert
    if (metrics.compliance_score < 80) {
      alerts.push({
        alert_id: 'alert_low_compliance',
        type: 'warning' as const,
        message: `Compliance score (${metrics.compliance_score}%) is below recommended threshold`,
        timestamp: new Date().toISOString(),
        action_required: true
      });
    }

    // Low trust score alert
    if (metrics.trust_score < 80) {
      alerts.push({
        alert_id: 'alert_low_trust',
        type: 'warning' as const,
        message: `Trust score (${metrics.trust_score}%) is below recommended threshold`,
        timestamp: new Date().toISOString(),
        action_required: true
      });
    }

    return alerts;
  }

  private getReportTitle(reportType: string): string {
    const titles = {
      compliance: 'Compliance Report',
      audit: 'Audit Trail Report',
      violations: 'Governance Violations Report',
      trust: 'Trust Metrics Report',
      summary: 'Governance Summary Report'
    };
    return titles[reportType as keyof typeof titles] || 'Governance Report';
  }

  private getReportDescription(reportType: string): string {
    const descriptions = {
      compliance: 'Comprehensive compliance status and metrics',
      audit: 'Complete audit trail and event history',
      violations: 'Detailed analysis of governance violations',
      trust: 'Trust metrics and relationship analysis',
      summary: 'Executive summary of governance status'
    };
    return descriptions[reportType as keyof typeof descriptions] || 'Governance report';
  }

  private generateReportSections(reportType: string, metrics: GovernanceMetrics, violations: GovernanceViolation[]): Array<{
    section_id: string;
    title: string;
    content: any;
    charts?: any[];
  }> {
    const sections = [];

    // Executive Summary
    sections.push({
      section_id: 'executive_summary',
      title: 'Executive Summary',
      content: {
        governance_health: this.calculateGovernanceHealth(metrics),
        key_metrics: metrics,
        recommendations: [
          'Implement additional policy controls',
          'Enhance trust monitoring',
          'Improve violation response times'
        ]
      }
    });

    // Metrics Section
    sections.push({
      section_id: 'metrics',
      title: 'Key Metrics',
      content: metrics,
      charts: [
        {
          type: 'pie',
          title: 'Violation Distribution',
          data: violations.reduce((acc, v) => {
            acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      ]
    });

    // Violations Section (if applicable)
    if (reportType === 'violations' || reportType === 'summary') {
      sections.push({
        section_id: 'violations',
        title: 'Violations Analysis',
        content: {
          total_violations: violations.length,
          by_severity: violations.reduce((acc, v) => {
            acc[v.severity] = (acc[v.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          by_status: violations.reduce((acc, v) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          recent_violations: violations.slice(0, 10)
        }
      });
    }

    return sections;
  }
}

export const governanceDashboardBackendService = new GovernanceDashboardBackendService();
export default governanceDashboardBackendService;

