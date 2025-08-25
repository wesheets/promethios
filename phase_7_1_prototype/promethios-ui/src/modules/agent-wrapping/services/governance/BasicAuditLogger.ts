/**
 * Basic Audit Logger
 * 
 * Implementation of audit logging for the governance engine.
 * Provides comprehensive logging of interactions, policy violations,
 * governance events, and system activities for compliance and monitoring.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import {
  AuditLogger,
  AuditLogEntry,
  GovernanceEvent,
  AuditConfiguration,
  AuditDestination,
  AuditQuery,
  AuditQueryResult
} from '../../types/governance';
import {
  AgentInteraction,
  GovernedInteractionResult,
  PolicyViolation
} from '../../types/dualWrapper';

/**
 * Basic audit logger implementation
 */
export class BasicAuditLogger implements AuditLogger {
  private config: AuditConfiguration;
  private logs: Map<string, AuditLogEntry[]> = new Map();
  private logCounter: number = 0;

  constructor(config: AuditConfiguration) {
    this.config = config;
  }

  /**
   * Log an agent interaction and its governance result
   */
  async logInteraction(
    interaction: AgentInteraction,
    result: GovernedInteractionResult
  ): Promise<void> {
    if (!this.config.enabled) return;

    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'interaction',
      agentId: interaction.agentId,
      userId: interaction.userId,
      severity: result.allowed ? 'info' : 'warning',
      category: 'governance',
      description: `Agent interaction ${result.action}: ${result.reason}`,
      data: {
        interaction: this.sanitizeInteractionData(interaction),
        result: this.sanitizeResultData(result),
        metadata: {
          processingTime: result.governanceMetadata?.processingTime,
          policiesChecked: result.governanceMetadata?.policiesChecked,
          trustScore: result.governanceMetadata?.trustScore,
          complianceLevel: result.governanceMetadata?.complianceLevel,
        },
      },
      source: 'governance_engine',
      correlationId: result.interactionId,
    };

    await this.writeLogEntry(logEntry);

    if (this.config.logLevel === 'verbose') {
      console.log(`📝 Audit log: ${logEntry.description} (${logEntry.id})`);
    }
  }

  /**
   * Log a policy violation
   */
  async logPolicyViolation(violation: PolicyViolation): Promise<void> {
    if (!this.config.enabled) return;

    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: violation.timestamp,
      type: 'policy_violation',
      agentId: violation.agentId,
      userId: violation.userId,
      severity: this.mapViolationSeverity(violation.severity),
      category: 'compliance',
      description: `Policy violation: ${violation.description}`,
      data: {
        violation: {
          id: violation.id,
          policyId: violation.policyId,
          type: violation.type,
          severity: violation.severity,
          description: violation.description,
          resolved: violation.resolved,
        },
        context: this.sanitizeViolationContext(violation.context),
      },
      source: 'policy_enforcer',
      correlationId: violation.interactionId,
    };

    await this.writeLogEntry(logEntry);

    console.log(`🚨 Policy violation logged: ${violation.description} (${logEntry.id})`);
  }

  /**
   * Log a governance event
   */
  async logGovernanceEvent(event: GovernanceEvent): Promise<void> {
    if (!this.config.enabled) return;

    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: event.timestamp,
      type: 'governance_event',
      agentId: event.agentId,
      userId: event.userId,
      severity: event.severity,
      category: 'system',
      description: event.description,
      data: {
        event: {
          type: event.type,
          data: event.data,
        },
      },
      source: 'governance_engine',
      correlationId: event.id,
    };

    await this.writeLogEntry(logEntry);

    if (event.severity === 'critical' || event.severity === 'error') {
      smartLogger.smartLog(`🔥 Critical governance event: ${event.description} (${logEntry.id})`);
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(query: AuditQuery): Promise<AuditQueryResult> {
    const startTime = Date.now();
    let allLogs: AuditLogEntry[] = [];

    // Collect logs from all agents if no specific agent requested
    if (query.agentId) {
      allLogs = this.logs.get(query.agentId) || [];
    } else {
      for (const agentLogs of this.logs.values()) {
        allLogs.push(...agentLogs);
      }
    }

    // Apply filters
    let filteredLogs = allLogs;

    // Time range filter
    if (query.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= query.endTime!);
    }

    // Type filter
    if (query.types && query.types.length > 0) {
      filteredLogs = filteredLogs.filter(log => query.types!.includes(log.type));
    }

    // Severity filter
    if (query.severities && query.severities.length > 0) {
      filteredLogs = filteredLogs.filter(log => query.severities!.includes(log.severity));
    }

    // User filter
    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }

    // Text search
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.description.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const totalCount = filteredLogs.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    const processingTime = Date.now() - startTime;

    return {
      logs: paginatedLogs,
      totalCount,
      offset,
      limit,
      hasMore: offset + limit < totalCount,
      processingTime,
      query,
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(agentId?: string, days: number = 30): Promise<{
    totalLogs: number;
    logsByType: Record<string, number>;
    logsBySeverity: Record<string, number>;
    violationCount: number;
    averageLogsPerDay: number;
  }> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let allLogs: AuditLogEntry[] = [];

    if (agentId) {
      allLogs = this.logs.get(agentId) || [];
    } else {
      for (const agentLogs of this.logs.values()) {
        allLogs.push(...agentLogs);
      }
    }

    // Filter by date range
    const recentLogs = allLogs.filter(log => log.timestamp >= cutoffDate);

    // Calculate statistics
    const logsByType: Record<string, number> = {};
    const logsBySeverity: Record<string, number> = {};
    let violationCount = 0;

    for (const log of recentLogs) {
      // Count by type
      logsByType[log.type] = (logsByType[log.type] || 0) + 1;
      
      // Count by severity
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1;
      
      // Count violations
      if (log.type === 'policy_violation') {
        violationCount++;
      }
    }

    return {
      totalLogs: recentLogs.length,
      logsByType,
      logsBySeverity,
      violationCount,
      averageLogsPerDay: recentLogs.length / days,
    };
  }

  /**
   * Export audit logs
   */
  async exportLogs(
    query: AuditQuery,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const result = await this.queryLogs(query);
    
    if (format === 'csv') {
      return this.convertToCSV(result.logs);
    } else {
      return JSON.stringify(result.logs, null, 2);
    }
  }

  /**
   * Clear old audit logs based on retention policy
   */
  async clearOldLogs(): Promise<number> {
    if (!this.config.retention) return 0;

    const cutoffDate = new Date(Date.now() - this.config.retention.days * 24 * 60 * 60 * 1000);
    let clearedCount = 0;

    for (const [agentId, logs] of this.logs.entries()) {
      const originalLength = logs.length;
      const filteredLogs = logs.filter(log => log.timestamp >= cutoffDate);
      
      this.logs.set(agentId, filteredLogs);
      clearedCount += originalLength - filteredLogs.length;
    }

    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} old audit logs (retention: ${this.config.retention.days} days)`);
    }

    return clearedCount;
  }

  // Private helper methods

  /**
   * Write a log entry to storage
   */
  private async writeLogEntry(entry: AuditLogEntry): Promise<void> {
    // Add to in-memory storage
    const agentLogs = this.logs.get(entry.agentId) || [];
    agentLogs.push(entry);
    
    // Keep only recent logs in memory (last 1000 per agent)
    if (agentLogs.length > 1000) {
      agentLogs.splice(0, agentLogs.length - 1000);
    }
    
    this.logs.set(entry.agentId, agentLogs);

    // Write to configured destinations
    for (const destination of this.config.destinations) {
      if (destination.enabled) {
        await this.writeToDestination(entry, destination);
      }
    }
  }

  /**
   * Write log entry to a specific destination
   */
  private async writeToDestination(
    entry: AuditLogEntry,
    destination: AuditDestination
  ): Promise<void> {
    try {
      switch (destination.type) {
        case 'console':
          console.log(`[AUDIT] ${entry.timestamp.toISOString()} ${entry.severity.toUpperCase()} ${entry.description}`);
          break;
        
        case 'file':
          // In a real implementation, this would write to a file
          // For now, we'll just log to console with file prefix
          console.log(`[FILE-AUDIT] ${JSON.stringify(entry)}`);
          break;
        
        case 'database':
          // In a real implementation, this would write to a database
          // For now, we'll just log to console with database prefix
          console.log(`[DB-AUDIT] ${JSON.stringify(entry)}`);
          break;
        
        case 'webhook':
          // In a real implementation, this would send to a webhook
          // For now, we'll just log to console with webhook prefix
          console.log(`[WEBHOOK-AUDIT] ${JSON.stringify(entry)}`);
          break;
      }
    } catch (error) {
      console.error(`Failed to write audit log to ${destination.type}:`, error);
    }
  }

  /**
   * Sanitize interaction data for logging
   */
  private sanitizeInteractionData(interaction: AgentInteraction): any {
    const sanitized = { ...interaction };
    
    if (!this.config.includeContent) {
      delete sanitized.content;
    }
    
    if (!this.config.includeMetadata) {
      delete sanitized.metadata;
    }
    
    return sanitized;
  }

  /**
   * Sanitize result data for logging
   */
  private sanitizeResultData(result: GovernedInteractionResult): any {
    const sanitized = { ...result };
    
    if (!this.config.includeContent) {
      delete sanitized.originalInteraction;
      delete sanitized.modifiedInteraction;
    }
    
    return sanitized;
  }

  /**
   * Sanitize violation context for logging
   */
  private sanitizeViolationContext(context: any): any {
    if (!this.config.includeContent) {
      return { contextType: typeof context };
    }
    
    return context;
  }

  /**
   * Map violation severity to log severity
   */
  private mapViolationSeverity(severity: string): 'info' | 'warning' | 'error' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'warning';
    }
  }

  /**
   * Convert logs to CSV format
   */
  private convertToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'id', 'timestamp', 'type', 'agentId', 'userId', 'severity', 
      'category', 'description', 'source', 'correlationId'
    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.id,
        log.timestamp.toISOString(),
        log.type,
        log.agentId,
        log.userId || '',
        log.severity,
        log.category,
        `"${log.description.replace(/"/g, '""')}"`, // Escape quotes
        log.source,
        log.correlationId || ''
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    this.logCounter++;
    return `audit_${Date.now()}_${this.logCounter.toString().padStart(6, '0')}`;
  }
}

