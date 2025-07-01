/**
 * Governance Notification Extension
 * 
 * Unified notification system for all governance pages including policies, violations,
 * trust metrics, and reports. Integrates with existing NotificationExtension pattern.
 */

import { NotificationExtension } from './NotificationExtension';

export interface GovernanceNotification {
  id: string;
  type: 'policy' | 'violation' | 'trust' | 'report' | 'compliance' | 'audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: Record<string, any>;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  read: boolean;
  archived: boolean;
  escalated: boolean;
  assigned_to?: string;
  due_date?: string;
  tags?: string[];
}

export interface GovernanceNotificationConfig {
  enable_real_time: boolean;
  enable_email_notifications: boolean;
  enable_slack_integration: boolean;
  notification_thresholds: {
    trust_score_drop: number;
    violation_count: number;
    policy_compliance: number;
    report_generation_time: number;
  };
  escalation_rules: {
    critical_violations: number; // minutes before escalation
    trust_degradation: number;
    policy_failures: number;
    report_delays: number;
  };
  notification_channels: {
    in_app: boolean;
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
}

export class GovernanceNotificationExtension {
  private config: GovernanceNotificationConfig;
  private notificationExtension: NotificationExtension;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.config = {
      enable_real_time: true,
      enable_email_notifications: true,
      enable_slack_integration: false,
      notification_thresholds: {
        trust_score_drop: 10, // 10 point drop
        violation_count: 5,   // 5 violations per hour
        policy_compliance: 80, // below 80%
        report_generation_time: 300 // 5 minutes
      },
      escalation_rules: {
        critical_violations: 15, // 15 minutes
        trust_degradation: 30,   // 30 minutes
        policy_failures: 60,     // 1 hour
        report_delays: 120       // 2 hours
      },
      notification_channels: {
        in_app: true,
        email: true,
        slack: false,
        webhook: false
      }
    };

    this.notificationExtension = new NotificationExtension();
  }

  /**
   * Initialize the governance notification system
   */
  async initialize(config?: Partial<GovernanceNotificationConfig>): Promise<boolean> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Initialize base notification extension
      const baseInitialized = await this.notificationExtension.initialize();
      if (!baseInitialized) {
        throw new Error('Failed to initialize base notification system');
      }

      // Setup real-time connection if enabled
      if (this.config.enable_real_time) {
        await this.setupWebSocketConnection();
      }

      // Register governance-specific notification handlers
      this.registerNotificationHandlers();

      console.log('Governance notification system initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize governance notifications:', error);
      return false;
    }
  }

  /**
   * Setup WebSocket connection for real-time notifications
   */
  private async setupWebSocketConnection(): Promise<void> {
    try {
      const wsUrl = `ws://localhost:5000/ws/governance-notifications`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('Governance notification WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        try {
          const notification: GovernanceNotification = JSON.parse(event.data);
          this.handleIncomingNotification(notification);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('Governance notification WebSocket disconnected');
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.setupWebSocketConnection();
          }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        }
      };

      this.websocket.onerror = (error) => {
        console.error('Governance notification WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error);
    }
  }

  /**
   * Register governance-specific notification handlers
   */
  private registerNotificationHandlers(): void {
    // Policy notifications
    this.registerPolicyNotifications();
    
    // Violation notifications
    this.registerViolationNotifications();
    
    // Trust metrics notifications
    this.registerTrustMetricsNotifications();
    
    // Report notifications
    this.registerReportNotifications();
    
    // Compliance notifications
    this.registerComplianceNotifications();
  }

  /**
   * Policy-related notifications
   */
  private registerPolicyNotifications(): void {
    // Policy creation
    this.onPolicyCreated = (policyId: string, policyName: string) => {
      this.addNotification({
        id: `policy_created_${policyId}`,
        type: 'policy',
        severity: 'low',
        title: 'New Policy Created',
        message: `Policy "${policyName}" has been created and is ready for deployment`,
        timestamp: new Date().toISOString(),
        source: 'PolicyManagement',
        entity_id: policyId,
        entity_type: 'policy',
        actions: [
          {
            label: 'View Policy',
            action: () => this.navigateToPolicy(policyId),
            primary: true
          },
          {
            label: 'Deploy',
            action: () => this.deployPolicy(policyId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['policy', 'creation']
      });
    };

    // Policy conflicts
    this.onPolicyConflict = (policyId: string, conflictDetails: any) => {
      this.addNotification({
        id: `policy_conflict_${policyId}`,
        type: 'policy',
        severity: 'high',
        title: 'Policy Conflict Detected',
        message: `Policy conflicts detected that may cause governance issues`,
        timestamp: new Date().toISOString(),
        source: 'PolicyValidation',
        entity_id: policyId,
        entity_type: 'policy',
        metadata: { conflicts: conflictDetails },
        actions: [
          {
            label: 'Resolve Conflicts',
            action: () => this.resolvePolicyConflicts(policyId),
            primary: true
          },
          {
            label: 'View Details',
            action: () => this.viewPolicyConflicts(policyId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['policy', 'conflict', 'urgent']
      });
    };

    // Policy optimization suggestions
    this.onPolicyOptimization = (policyId: string, suggestions: any) => {
      this.addNotification({
        id: `policy_optimization_${policyId}`,
        type: 'policy',
        severity: 'medium',
        title: 'Policy Optimization Available',
        message: `ML analysis suggests optimizations for improved policy effectiveness`,
        timestamp: new Date().toISOString(),
        source: 'PolicyIntelligence',
        entity_id: policyId,
        entity_type: 'policy',
        metadata: { suggestions },
        actions: [
          {
            label: 'Apply Optimizations',
            action: () => this.applyPolicyOptimizations(policyId),
            primary: true
          },
          {
            label: 'Review Suggestions',
            action: () => this.reviewOptimizations(policyId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['policy', 'optimization', 'ml']
      });
    };
  }

  /**
   * Violation-related notifications
   */
  private registerViolationNotifications(): void {
    // Critical violations
    this.onCriticalViolation = (violationId: string, agentId: string, policyId: string) => {
      this.addNotification({
        id: `critical_violation_${violationId}`,
        type: 'violation',
        severity: 'critical',
        title: 'Critical Policy Violation',
        message: `Agent ${agentId} has committed a critical policy violation requiring immediate attention`,
        timestamp: new Date().toISOString(),
        source: 'ViolationMonitoring',
        entity_id: violationId,
        entity_type: 'violation',
        metadata: { agent_id: agentId, policy_id: policyId },
        actions: [
          {
            label: 'Investigate',
            action: () => this.investigateViolation(violationId),
            primary: true
          },
          {
            label: 'Suspend Agent',
            action: () => this.suspendAgent(agentId)
          },
          {
            label: 'View Details',
            action: () => this.viewViolationDetails(violationId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        due_date: new Date(Date.now() + this.config.escalation_rules.critical_violations * 60000).toISOString(),
        tags: ['violation', 'critical', 'urgent']
      });

      // Auto-escalate after configured time
      setTimeout(() => {
        this.escalateNotification(`critical_violation_${violationId}`);
      }, this.config.escalation_rules.critical_violations * 60000);
    };

    // Violation patterns
    this.onViolationPattern = (pattern: any) => {
      this.addNotification({
        id: `violation_pattern_${Date.now()}`,
        type: 'violation',
        severity: 'high',
        title: 'Violation Pattern Detected',
        message: `Recurring violation pattern detected across multiple agents`,
        timestamp: new Date().toISOString(),
        source: 'PatternAnalysis',
        metadata: { pattern },
        actions: [
          {
            label: 'Analyze Pattern',
            action: () => this.analyzeViolationPattern(pattern),
            primary: true
          },
          {
            label: 'Update Policies',
            action: () => this.updatePoliciesForPattern(pattern)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['violation', 'pattern', 'analysis']
      });
    };

    // Bulk violation resolution
    this.onBulkViolationResolution = (count: number, resolvedBy: string) => {
      this.addNotification({
        id: `bulk_resolution_${Date.now()}`,
        type: 'violation',
        severity: 'low',
        title: 'Bulk Violation Resolution',
        message: `${count} violations have been resolved by ${resolvedBy}`,
        timestamp: new Date().toISOString(),
        source: 'ViolationManagement',
        metadata: { count, resolved_by: resolvedBy },
        read: false,
        archived: false,
        escalated: false,
        tags: ['violation', 'bulk', 'resolution']
      });
    };
  }

  /**
   * Trust metrics notifications
   */
  private registerTrustMetricsNotifications(): void {
    // Trust score degradation
    this.onTrustScoreDrop = (agentId: string, oldScore: number, newScore: number) => {
      const drop = oldScore - newScore;
      const severity = drop >= 20 ? 'critical' : drop >= 10 ? 'high' : 'medium';

      this.addNotification({
        id: `trust_drop_${agentId}`,
        type: 'trust',
        severity,
        title: 'Trust Score Degradation',
        message: `Agent ${agentId} trust score dropped from ${oldScore.toFixed(1)} to ${newScore.toFixed(1)}`,
        timestamp: new Date().toISOString(),
        source: 'TrustMonitoring',
        entity_id: agentId,
        entity_type: 'agent',
        metadata: { old_score: oldScore, new_score: newScore, drop },
        actions: [
          {
            label: 'Investigate',
            action: () => this.investigateTrustDrop(agentId),
            primary: true
          },
          {
            label: 'Create Remediation Plan',
            action: () => this.createRemediationPlan(agentId)
          },
          {
            label: 'View Trust Details',
            action: () => this.viewTrustDetails(agentId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        due_date: new Date(Date.now() + this.config.escalation_rules.trust_degradation * 60000).toISOString(),
        tags: ['trust', 'degradation', 'agent']
      });
    };

    // Trust threshold breach
    this.onTrustThresholdBreach = (agentId: string, threshold: string, score: number) => {
      this.addNotification({
        id: `trust_threshold_${agentId}`,
        type: 'trust',
        severity: 'high',
        title: 'Trust Threshold Breach',
        message: `Agent ${agentId} has fallen below ${threshold} trust threshold (${score.toFixed(1)})`,
        timestamp: new Date().toISOString(),
        source: 'TrustMonitoring',
        entity_id: agentId,
        entity_type: 'agent',
        metadata: { threshold, score },
        actions: [
          {
            label: 'Review Agent',
            action: () => this.reviewAgent(agentId),
            primary: true
          },
          {
            label: 'Suspend Operations',
            action: () => this.suspendAgentOperations(agentId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['trust', 'threshold', 'breach']
      });
    };

    // Trust recovery
    this.onTrustRecovery = (agentId: string, oldScore: number, newScore: number) => {
      this.addNotification({
        id: `trust_recovery_${agentId}`,
        type: 'trust',
        severity: 'low',
        title: 'Trust Score Recovery',
        message: `Agent ${agentId} trust score improved from ${oldScore.toFixed(1)} to ${newScore.toFixed(1)}`,
        timestamp: new Date().toISOString(),
        source: 'TrustMonitoring',
        entity_id: agentId,
        entity_type: 'agent',
        metadata: { old_score: oldScore, new_score: newScore },
        actions: [
          {
            label: 'View Progress',
            action: () => this.viewTrustProgress(agentId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['trust', 'recovery', 'improvement']
      });
    };
  }

  /**
   * Report-related notifications
   */
  private registerReportNotifications(): void {
    // Report generation complete
    this.onReportComplete = (reportId: string, templateName: string) => {
      this.addNotification({
        id: `report_complete_${reportId}`,
        type: 'report',
        severity: 'low',
        title: 'Report Generated',
        message: `${templateName} report has been generated successfully`,
        timestamp: new Date().toISOString(),
        source: 'ReportGeneration',
        entity_id: reportId,
        entity_type: 'report',
        actions: [
          {
            label: 'Download',
            action: () => this.downloadReport(reportId),
            primary: true
          },
          {
            label: 'Share',
            action: () => this.shareReport(reportId)
          },
          {
            label: 'View Reports',
            action: () => this.navigateToReports()
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['report', 'generation', 'complete']
      });
    };

    // Report generation failed
    this.onReportFailed = (reportId: string, templateName: string, error: string) => {
      this.addNotification({
        id: `report_failed_${reportId}`,
        type: 'report',
        severity: 'medium',
        title: 'Report Generation Failed',
        message: `Failed to generate ${templateName}: ${error}`,
        timestamp: new Date().toISOString(),
        source: 'ReportGeneration',
        entity_id: reportId,
        entity_type: 'report',
        metadata: { error },
        actions: [
          {
            label: 'Retry',
            action: () => this.retryReportGeneration(reportId),
            primary: true
          },
          {
            label: 'View Logs',
            action: () => this.viewReportLogs(reportId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['report', 'generation', 'failed']
      });
    };

    // Scheduled report execution
    this.onScheduledReportExecution = (scheduleId: string, templateName: string) => {
      this.addNotification({
        id: `scheduled_report_${scheduleId}`,
        type: 'report',
        severity: 'low',
        title: 'Scheduled Report Executing',
        message: `Scheduled ${templateName} report is now being generated`,
        timestamp: new Date().toISOString(),
        source: 'ReportScheduler',
        entity_id: scheduleId,
        entity_type: 'schedule',
        actions: [
          {
            label: 'View Progress',
            action: () => this.viewReportProgress(scheduleId)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['report', 'scheduled', 'execution']
      });
    };
  }

  /**
   * Compliance-related notifications
   */
  private registerComplianceNotifications(): void {
    // Compliance score drop
    this.onComplianceScoreDrop = (score: number, threshold: number) => {
      this.addNotification({
        id: `compliance_drop_${Date.now()}`,
        type: 'compliance',
        severity: 'high',
        title: 'Compliance Score Below Threshold',
        message: `Overall compliance score (${score.toFixed(1)}%) has fallen below threshold (${threshold}%)`,
        timestamp: new Date().toISOString(),
        source: 'ComplianceMonitoring',
        metadata: { score, threshold },
        actions: [
          {
            label: 'Review Compliance',
            action: () => this.reviewCompliance(),
            primary: true
          },
          {
            label: 'Generate Report',
            action: () => this.generateComplianceReport()
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        tags: ['compliance', 'threshold', 'drop']
      });
    };

    // Audit requirement
    this.onAuditRequired = (auditType: string, dueDate: string) => {
      this.addNotification({
        id: `audit_required_${Date.now()}`,
        type: 'audit',
        severity: 'medium',
        title: 'Audit Required',
        message: `${auditType} audit is required by ${new Date(dueDate).toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        source: 'AuditScheduler',
        metadata: { audit_type: auditType, due_date: dueDate },
        actions: [
          {
            label: 'Start Audit',
            action: () => this.startAudit(auditType),
            primary: true
          },
          {
            label: 'Schedule Audit',
            action: () => this.scheduleAudit(auditType)
          }
        ],
        read: false,
        archived: false,
        escalated: false,
        due_date: dueDate,
        tags: ['audit', 'required', 'compliance']
      });
    };
  }

  /**
   * Add a governance notification
   */
  addNotification(notification: GovernanceNotification): void {
    // Add to base notification system
    this.notificationExtension.addNotification({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      read: notification.read,
      actions: notification.actions
    });

    // Store governance-specific metadata
    this.storeGovernanceNotification(notification);

    // Send to external systems if configured
    if (this.config.notification_channels.email && this.config.enable_email_notifications) {
      this.sendEmailNotification(notification);
    }

    if (this.config.notification_channels.slack && this.config.enable_slack_integration) {
      this.sendSlackNotification(notification);
    }

    if (this.config.notification_channels.webhook) {
      this.sendWebhookNotification(notification);
    }
  }

  /**
   * Handle incoming real-time notification
   */
  private handleIncomingNotification(notification: GovernanceNotification): void {
    this.addNotification(notification);

    // Auto-escalate critical notifications
    if (notification.severity === 'critical') {
      setTimeout(() => {
        this.escalateNotification(notification.id);
      }, 5 * 60000); // 5 minutes
    }
  }

  /**
   * Escalate a notification
   */
  private escalateNotification(notificationId: string): void {
    // Implementation for escalation logic
    console.log(`Escalating notification: ${notificationId}`);
  }

  /**
   * Store governance notification with metadata
   */
  private storeGovernanceNotification(notification: GovernanceNotification): void {
    // Store in local storage or send to backend
    const stored = localStorage.getItem('governance_notifications') || '[]';
    const notifications = JSON.parse(stored);
    notifications.push(notification);
    localStorage.setItem('governance_notifications', JSON.stringify(notifications));
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: GovernanceNotification): Promise<void> {
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(notification: GovernanceNotification): Promise<void> {
    try {
      await fetch('/api/notifications/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(notification: GovernanceNotification): Promise<void> {
    try {
      await fetch('/api/notifications/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Navigation and action methods
   */
  private navigateToPolicy(policyId: string): void {
    window.location.href = `/governance/policies?policy=${policyId}`;
  }

  private deployPolicy(policyId: string): void {
    // Implementation for policy deployment
  }

  private resolvePolicyConflicts(policyId: string): void {
    window.location.href = `/governance/policies?policy=${policyId}&action=resolve-conflicts`;
  }

  private viewPolicyConflicts(policyId: string): void {
    window.location.href = `/governance/policies?policy=${policyId}&view=conflicts`;
  }

  private applyPolicyOptimizations(policyId: string): void {
    // Implementation for applying optimizations
  }

  private reviewOptimizations(policyId: string): void {
    window.location.href = `/governance/policies?policy=${policyId}&view=optimizations`;
  }

  private investigateViolation(violationId: string): void {
    window.location.href = `/governance/violations?violation=${violationId}&action=investigate`;
  }

  private suspendAgent(agentId: string): void {
    // Implementation for agent suspension
  }

  private viewViolationDetails(violationId: string): void {
    window.location.href = `/governance/violations?violation=${violationId}`;
  }

  private analyzeViolationPattern(pattern: any): void {
    window.location.href = `/governance/violations?view=patterns&pattern=${pattern.id}`;
  }

  private updatePoliciesForPattern(pattern: any): void {
    // Implementation for policy updates based on patterns
  }

  private investigateTrustDrop(agentId: string): void {
    window.location.href = `/governance/trust-metrics?agent=${agentId}&action=investigate`;
  }

  private createRemediationPlan(agentId: string): void {
    window.location.href = `/governance/trust-metrics?agent=${agentId}&action=remediate`;
  }

  private viewTrustDetails(agentId: string): void {
    window.location.href = `/governance/trust-metrics?agent=${agentId}`;
  }

  private reviewAgent(agentId: string): void {
    window.location.href = `/governance/trust-metrics?agent=${agentId}&action=review`;
  }

  private suspendAgentOperations(agentId: string): void {
    // Implementation for suspending agent operations
  }

  private viewTrustProgress(agentId: string): void {
    window.location.href = `/governance/trust-metrics?agent=${agentId}&view=progress`;
  }

  private downloadReport(reportId: string): void {
    window.location.href = `/api/reporting/download/${reportId}`;
  }

  private shareReport(reportId: string): void {
    window.location.href = `/governance/reports?report=${reportId}&action=share`;
  }

  private navigateToReports(): void {
    window.location.href = `/governance/reports`;
  }

  private retryReportGeneration(reportId: string): void {
    // Implementation for retrying report generation
  }

  private viewReportLogs(reportId: string): void {
    window.location.href = `/governance/reports?report=${reportId}&view=logs`;
  }

  private viewReportProgress(scheduleId: string): void {
    window.location.href = `/governance/reports?schedule=${scheduleId}&view=progress`;
  }

  private reviewCompliance(): void {
    window.location.href = `/governance/compliance`;
  }

  private generateComplianceReport(): void {
    window.location.href = `/governance/reports?template=compliance&action=generate`;
  }

  private startAudit(auditType: string): void {
    window.location.href = `/governance/audit?type=${auditType}&action=start`;
  }

  private scheduleAudit(auditType: string): void {
    window.location.href = `/governance/audit?type=${auditType}&action=schedule`;
  }

  /**
   * Event handlers (to be called by governance pages)
   */
  onPolicyCreated: (policyId: string, policyName: string) => void = () => {};
  onPolicyConflict: (policyId: string, conflictDetails: any) => void = () => {};
  onPolicyOptimization: (policyId: string, suggestions: any) => void = () => {};
  onCriticalViolation: (violationId: string, agentId: string, policyId: string) => void = () => {};
  onViolationPattern: (pattern: any) => void = () => {};
  onBulkViolationResolution: (count: number, resolvedBy: string) => void = () => {};
  onTrustScoreDrop: (agentId: string, oldScore: number, newScore: number) => void = () => {};
  onTrustThresholdBreach: (agentId: string, threshold: string, score: number) => void = () => {};
  onTrustRecovery: (agentId: string, oldScore: number, newScore: number) => void = () => {};
  onReportComplete: (reportId: string, templateName: string) => void = () => {};
  onReportFailed: (reportId: string, templateName: string, error: string) => void = () => {};
  onScheduledReportExecution: (scheduleId: string, templateName: string) => void = () => {};
  onComplianceScoreDrop: (score: number, threshold: number) => void = () => {};
  onAuditRequired: (auditType: string, dueDate: string) => void = () => {};

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.notificationExtension.cleanup();
  }
}

// Export singleton instance
export const governanceNotificationExtension = new GovernanceNotificationExtension();

