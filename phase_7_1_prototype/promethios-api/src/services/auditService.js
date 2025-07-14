/**
 * Audit Service
 * Handles audit logging and querying for governance and compliance
 */

const { v4: uuidv4 } = require('uuid');

class AuditService {
  constructor() {
    // In-memory storage for audit logs (in production, use database)
    this.auditLogs = [];
    this.maxLogs = 10000; // Keep last 10k logs
    
    console.log('📋 AuditService initialized');
  }

  /**
   * Log an audit event
   */
  logEvent(eventType, userId, details = {}, metadata = {}) {
    const auditEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      details,
      metadata,
      severity: this.determineSeverity(eventType),
      source: 'promethios-api'
    };

    this.auditLogs.push(auditEntry);

    // Keep only the most recent logs
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxLogs);
    }

    console.log(`📋 Audit logged: ${eventType} for user ${userId}`);
    return auditEntry;
  }

  /**
   * Query audit logs with filters
   */
  queryAuditLogs(filters = {}) {
    let filteredLogs = [...this.auditLogs];

    // Apply filters
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.eventType) {
      filteredLogs = filteredLogs.filter(log => log.eventType === filters.eventType);
    }

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.eventType.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.metadata).toLowerCase().includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      limit,
      offset,
      hasMore: offset + limit < filteredLogs.length
    };
  }

  /**
   * Get audit statistics
   */
  getAuditStats(timeRange = '24h') {
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const recentLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp) >= startTime
    );

    const stats = {
      timeRange,
      totalEvents: recentLogs.length,
      eventTypes: {},
      severityBreakdown: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      userActivity: {},
      timeline: this.generateTimeline(recentLogs, timeRange)
    };

    // Count event types
    recentLogs.forEach(log => {
      stats.eventTypes[log.eventType] = (stats.eventTypes[log.eventType] || 0) + 1;
      stats.severityBreakdown[log.severity]++;
      stats.userActivity[log.userId] = (stats.userActivity[log.userId] || 0) + 1;
    });

    return stats;
  }

  /**
   * Generate timeline data for charts
   */
  generateTimeline(logs, timeRange) {
    const timeline = [];
    const now = new Date();
    let intervals, intervalMs;

    switch (timeRange) {
      case '1h':
        intervals = 12; // 5-minute intervals
        intervalMs = 5 * 60 * 1000;
        break;
      case '24h':
        intervals = 24; // 1-hour intervals
        intervalMs = 60 * 60 * 1000;
        break;
      case '7d':
        intervals = 7; // 1-day intervals
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case '30d':
        intervals = 30; // 1-day intervals
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      default:
        intervals = 24;
        intervalMs = 60 * 60 * 1000;
    }

    for (let i = intervals - 1; i >= 0; i--) {
      const intervalStart = new Date(now.getTime() - (i + 1) * intervalMs);
      const intervalEnd = new Date(now.getTime() - i * intervalMs);
      
      const intervalLogs = logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= intervalStart && logTime < intervalEnd;
      });

      timeline.push({
        timestamp: intervalStart.toISOString(),
        count: intervalLogs.length,
        events: intervalLogs.reduce((acc, log) => {
          acc[log.eventType] = (acc[log.eventType] || 0) + 1;
          return acc;
        }, {})
      });
    }

    return timeline;
  }

  /**
   * Determine severity based on event type
   */
  determineSeverity(eventType) {
    const severityMap = {
      // Critical events
      'emergency_stop': 'critical',
      'security_breach': 'critical',
      'system_failure': 'critical',
      'unauthorized_access': 'critical',
      
      // High severity events
      'session_terminated': 'high',
      'loop_detected': 'high',
      'governance_violation': 'high',
      'deployment_failed': 'high',
      
      // Medium severity events
      'session_created': 'medium',
      'agent_deployed': 'medium',
      'configuration_changed': 'medium',
      'user_login': 'medium',
      
      // Low severity events
      'message_sent': 'low',
      'observer_suggestion': 'low',
      'status_check': 'low',
      'metrics_collected': 'low'
    };

    return severityMap[eventType] || 'low';
  }

  /**
   * Log common audit events
   */
  logSessionCreated(userId, sessionId, systemName) {
    return this.logEvent('session_created', userId, {
      sessionId,
      systemName,
      action: 'create_session'
    });
  }

  logSessionTerminated(userId, sessionId, reason) {
    return this.logEvent('session_terminated', userId, {
      sessionId,
      reason,
      action: 'terminate_session'
    });
  }

  logEmergencyStop(userId, sessionId, reason) {
    return this.logEvent('emergency_stop', userId, {
      sessionId,
      reason,
      action: 'emergency_stop'
    });
  }

  logAgentDeployment(userId, agentId, deploymentStatus) {
    return this.logEvent('agent_deployed', userId, {
      agentId,
      deploymentStatus,
      action: 'deploy_agent'
    });
  }

  logGovernanceViolation(userId, violationType, details) {
    return this.logEvent('governance_violation', userId, {
      violationType,
      details,
      action: 'governance_check'
    });
  }

  logUserLogin(userId, loginMethod) {
    return this.logEvent('user_login', userId, {
      loginMethod,
      action: 'user_authentication'
    });
  }

  logObserverSuggestion(userId, suggestionType, context) {
    return this.logEvent('observer_suggestion', userId, {
      suggestionType,
      context,
      action: 'observer_interaction'
    });
  }

  /**
   * Clear old audit logs (for maintenance)
   */
  clearOldLogs(olderThanDays = 90) {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = this.auditLogs.length;
    
    this.auditLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );

    const removedCount = initialCount - this.auditLogs.length;
    console.log(`📋 Cleared ${removedCount} old audit logs (older than ${olderThanDays} days)`);
    
    return removedCount;
  }

  /**
   * Export audit logs for compliance
   */
  exportLogs(filters = {}, format = 'json') {
    const result = this.queryAuditLogs(filters);
    
    if (format === 'csv') {
      return this.convertToCSV(result.logs);
    }
    
    return result;
  }

  /**
   * Convert logs to CSV format
   */
  convertToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = ['id', 'timestamp', 'eventType', 'userId', 'severity', 'details', 'metadata'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = [
        log.id,
        log.timestamp,
        log.eventType,
        log.userId,
        log.severity,
        JSON.stringify(log.details).replace(/"/g, '""'),
        JSON.stringify(log.metadata).replace(/"/g, '""')
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });
    
    return csvRows.join('\n');
  }
}

// Export singleton instance
module.exports = new AuditService();

