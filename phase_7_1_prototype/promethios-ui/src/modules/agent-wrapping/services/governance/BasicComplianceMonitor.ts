/**
 * Basic Compliance Monitor
 * 
 * Implementation of compliance monitoring for the governance engine.
 * Provides real-time monitoring of agent interactions, policy compliance,
 * and governance effectiveness with session-based tracking.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import {
  ComplianceMonitor,
  ComplianceSession,
  ComplianceMetrics,
  ComplianceAlert,
  ComplianceReport
} from '../../types/governance';
import {
  AgentInteraction,
  GovernanceEngineConfig
} from '../../types/dualWrapper';

/**
 * Compliance monitoring session implementation
 */
class BasicComplianceSession implements ComplianceSession {
  public readonly id: string;
  public readonly agentId: string;
  public readonly startTime: Date;
  public endTime?: Date;
  public readonly interaction: AgentInteraction;
  
  private errors: Error[] = [];
  private warnings: string[] = [];
  private metrics: Record<string, number> = {};
  private isActive: boolean = true;

  constructor(id: string, agentId: string, interaction: AgentInteraction) {
    this.id = id;
    this.agentId = agentId;
    this.interaction = interaction;
    this.startTime = new Date();
  }

  recordError(error: Error): void {
    if (this.isActive) {
      this.errors.push(error);
      console.log(`⚠️ Compliance session error: ${error.message} (${this.id})`);
    }
  }

  recordWarning(warning: string): void {
    if (this.isActive) {
      this.warnings.push(warning);
      console.log(`⚠️ Compliance session warning: ${warning} (${this.id})`);
    }
  }

  recordMetric(name: string, value: number): void {
    if (this.isActive) {
      this.metrics[name] = value;
    }
  }

  recordSuccess(): void {
    if (this.isActive) {
      this.recordMetric('success', 1);
    }
  }

  stop(): {
    duration: number;
    errors: Error[];
    warnings: string[];
    metrics: Record<string, number>;
  } {
    if (this.isActive) {
      this.endTime = new Date();
      this.isActive = false;
      
      const duration = this.endTime.getTime() - this.startTime.getTime();
      this.recordMetric('duration', duration);
      
      return {
        duration,
        errors: [...this.errors],
        warnings: [...this.warnings],
        metrics: { ...this.metrics },
      };
    }
    
    return {
      duration: 0,
      errors: [],
      warnings: [],
      metrics: {},
    };
  }

  isCompliant(): boolean {
    return this.errors.length === 0;
  }

  getDuration(): number {
    const endTime = this.endTime || new Date();
    return endTime.getTime() - this.startTime.getTime();
  }
}

/**
 * Basic compliance monitor implementation
 */
export class BasicComplianceMonitor implements ComplianceMonitor {
  private config: GovernanceEngineConfig;
  private activeSessions: Map<string, BasicComplianceSession> = new Map();
  private completedSessions: BasicComplianceSession[] = [];
  private alerts: ComplianceAlert[] = [];
  private metrics: ComplianceMetrics;
  private sessionCounter: number = 0;

  constructor(config: GovernanceEngineConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Start monitoring an interaction
   */
  startMonitoring(interaction: AgentInteraction): ComplianceSession {
    const sessionId = this.generateSessionId();
    const session = new BasicComplianceSession(sessionId, interaction.agentId, interaction);
    
    this.activeSessions.set(sessionId, session);
    this.updateMetrics();
    
    console.log(`🔍 Started compliance monitoring session: ${sessionId} for agent: ${interaction.agentId}`);
    
    return session;
  }

  /**
   * Stop monitoring a session
   */
  stopMonitoring(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const result = session.stop();
      this.activeSessions.delete(sessionId);
      this.completedSessions.push(session);
      
      // Keep only last 100 completed sessions
      if (this.completedSessions.length > 100) {
        this.completedSessions.splice(0, this.completedSessions.length - 100);
      }
      
      this.updateMetrics();
      this.checkForAlerts(session, result);
      
      console.log(`✅ Stopped compliance monitoring session: ${sessionId} (duration: ${result.duration}ms)`);
    }
  }

  /**
   * Get current compliance metrics
   */
  getMetrics(): ComplianceMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get compliance alerts
   */
  getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): ComplianceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Generate compliance report
   */
  generateReport(timeRange: { start: Date; end: Date }): ComplianceReport {
    const sessionsInRange = this.completedSessions.filter(session => 
      session.startTime >= timeRange.start && 
      (session.endTime || new Date()) <= timeRange.end
    );

    const totalSessions = sessionsInRange.length;
    const compliantSessions = sessionsInRange.filter(session => session.isCompliant()).length;
    const complianceRate = totalSessions > 0 ? compliantSessions / totalSessions : 1;

    // Calculate average processing time
    const totalDuration = sessionsInRange.reduce((sum, session) => sum + session.getDuration(), 0);
    const averageProcessingTime = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // Count violations by severity
    const violationsBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    // Count policy violations (simplified)
    for (const session of sessionsInRange) {
      const result = session.stop();
      if (result.errors.length > 0) {
        violationsBySeverity.medium += result.errors.length;
      }
    }

    // Get alerts in time range
    const alertsInRange = this.alerts.filter(alert => 
      alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end
    );

    return {
      timeRange,
      totalSessions,
      complianceRate,
      averageProcessingTime,
      violationsBySeverity,
      alerts: alertsInRange,
      recommendations: this.generateRecommendations(complianceRate, violationsBySeverity),
      generatedAt: new Date(),
    };
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThan: Date): number {
    const initialCount = this.alerts.length;
    this.alerts = this.alerts.filter(alert => alert.timestamp >= olderThan);
    const clearedCount = initialCount - this.alerts.length;
    
    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} old compliance alerts`);
    }
    
    return clearedCount;
  }

  // Private helper methods

  /**
   * Initialize compliance metrics
   */
  private initializeMetrics(): ComplianceMetrics {
    return {
      activeSessions: 0,
      totalSessions: 0,
      complianceRate: 1.0,
      averageProcessingTime: 0,
      errorRate: 0,
      alertCount: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Update compliance metrics
   */
  private updateMetrics(): void {
    const totalCompleted = this.completedSessions.length;
    const compliantSessions = this.completedSessions.filter(session => session.isCompliant()).length;
    
    this.metrics = {
      activeSessions: this.activeSessions.size,
      totalSessions: totalCompleted,
      complianceRate: totalCompleted > 0 ? compliantSessions / totalCompleted : 1.0,
      averageProcessingTime: this.calculateAverageProcessingTime(),
      errorRate: totalCompleted > 0 ? (totalCompleted - compliantSessions) / totalCompleted : 0,
      alertCount: this.alerts.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate average processing time
   */
  private calculateAverageProcessingTime(): number {
    if (this.completedSessions.length === 0) return 0;
    
    const totalDuration = this.completedSessions.reduce((sum, session) => sum + session.getDuration(), 0);
    return totalDuration / this.completedSessions.length;
  }

  /**
   * Check for compliance alerts
   */
  private checkForAlerts(session: BasicComplianceSession, result: any): void {
    // Check for error-based alerts
    if (result.errors.length > 0) {
      this.createAlert(
        'compliance_violation',
        'medium',
        `Compliance violations detected in session ${session.id}`,
        {
          sessionId: session.id,
          agentId: session.agentId,
          errorCount: result.errors.length,
          errors: result.errors.map((e: Error) => e.message),
        }
      );
    }

    // Check for performance alerts
    if (result.duration > 10000) { // More than 10 seconds
      this.createAlert(
        'performance_degradation',
        'low',
        `Slow processing detected in session ${session.id}`,
        {
          sessionId: session.id,
          agentId: session.agentId,
          duration: result.duration,
        }
      );
    }

    // Check compliance rate alerts
    if (this.metrics.complianceRate < 0.8) { // Less than 80% compliance
      this.createAlert(
        'low_compliance_rate',
        'high',
        `Compliance rate below threshold: ${(this.metrics.complianceRate * 100).toFixed(1)}%`,
        {
          complianceRate: this.metrics.complianceRate,
          threshold: 0.8,
          totalSessions: this.metrics.totalSessions,
        }
      );
    }
  }

  /**
   * Create a compliance alert
   */
  private createAlert(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    data: any
  ): void {
    const alert: ComplianceAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      timestamp: new Date(),
      agentId: this.config.agentId,
      data,
      resolved: false,
    };

    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.splice(0, this.alerts.length - 50);
    }

    console.log(`🚨 Compliance alert (${severity}): ${message} (${alert.id})`);
  }

  /**
   * Generate recommendations based on compliance data
   */
  private generateRecommendations(
    complianceRate: number,
    violationsBySeverity: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    if (complianceRate < 0.9) {
      recommendations.push('Review and strengthen policy enforcement mechanisms');
    }

    if (violationsBySeverity.critical > 0) {
      recommendations.push('Immediate attention required for critical policy violations');
    }

    if (violationsBySeverity.high > 5) {
      recommendations.push('High number of high-severity violations - review agent behavior patterns');
    }

    if (complianceRate > 0.95) {
      recommendations.push('Excellent compliance rate - maintain current governance policies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Compliance monitoring is functioning normally');
    }

    return recommendations;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    this.sessionCounter++;
    return `compliance_${Date.now()}_${this.sessionCounter.toString().padStart(6, '0')}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

