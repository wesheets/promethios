/**
 * Log Access Service
 * 
 * Provides complete transparency and user access to all logs from deployed agents.
 * Handles real-time streaming, historical search, download capabilities, and audit trails.
 */

import { UnifiedStorageService } from './UnifiedStorageService';
import { deployedAgentAPI } from './api/deployedAgentAPI';

export interface LogEntry {
  id: string;
  timestamp: Date;
  agentId: string;
  deploymentId: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'governance' | 'performance' | 'security' | 'business' | 'system';
  message: string;
  metadata?: Record<string, any>;
  source: 'deployed_agent' | 'promethios_system' | 'user_action';
  userId: string;
  governanceIdentity?: string;
}

export interface LogQuery {
  agentIds?: string[];
  deploymentIds?: string[];
  levels?: LogEntry['level'][];
  categories?: LogEntry['category'][];
  sources?: LogEntry['source'][];
  startTime?: Date;
  endTime?: Date;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface LogSearchResult {
  entries: LogEntry[];
  totalCount: number;
  hasMore: boolean;
  searchDuration: number;
  dataFreshness: 'live' | 'recent' | 'historical' | 'archived';
}

export interface LogStreamOptions {
  agentIds?: string[];
  levels?: LogEntry['level'][];
  categories?: LogEntry['category'][];
  bufferSize?: number;
  maxRetries?: number;
}

export interface LogExportOptions {
  format: 'json' | 'csv' | 'txt';
  query: LogQuery;
  includeMetadata: boolean;
  compression?: 'gzip' | 'zip';
  maxSize?: number; // MB
}

export interface LogExportResult {
  downloadUrl: string;
  filename: string;
  size: number;
  format: string;
  expiresAt: Date;
  exportId: string;
}

export interface UserAccessAudit {
  id: string;
  userId: string;
  action: 'search' | 'stream' | 'export' | 'download';
  timestamp: Date;
  query?: LogQuery;
  resultCount?: number;
  exportId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LogRetentionPolicy {
  realTimeRetention: number; // hours
  recentRetention: number; // days  
  historicalRetention: number; // days
  archiveRetention: number; // days
  autoCleanup: boolean;
  compressionEnabled: boolean;
}

export interface DataProcessingTransparency {
  id: string;
  timestamp: Date;
  agentId: string;
  operation: 'received' | 'processed' | 'stored' | 'analyzed' | 'exported';
  dataType: 'metrics' | 'logs' | 'violations' | 'heartbeat';
  inputSize: number;
  outputSize?: number;
  processingTime: number;
  transformations: string[];
  validationResults: Record<string, any>;
  storageLocation: string;
}

class LogAccessService {
  private storage: UnifiedStorageService;
  private streamConnections: Map<string, WebSocket> = new Map();
  private retentionPolicy: LogRetentionPolicy;

  constructor() {
    this.storage = new UnifiedStorageService();
    this.retentionPolicy = {
      realTimeRetention: 24, // 24 hours
      recentRetention: 7, // 7 days
      historicalRetention: 90, // 90 days
      archiveRetention: 365, // 1 year
      autoCleanup: true,
      compressionEnabled: true
    };
  }

  /**
   * Search logs with comprehensive filtering and pagination
   */
  async searchLogs(userId: string, query: LogQuery): Promise<LogSearchResult> {
    const startTime = Date.now();
    
    try {
      // Log the search for audit trail
      await this.logUserAccess({
        userId,
        action: 'search',
        query,
        timestamp: new Date(),
        ipAddress: 'system', // Would be populated from request
        userAgent: 'promethios-ui'
      });

      // Determine data source based on time range
      const dataFreshness = this.determineDataFreshness(query.startTime, query.endTime);
      
      // Execute search based on data freshness
      let entries: LogEntry[] = [];
      let totalCount = 0;

      switch (dataFreshness) {
        case 'live':
          ({ entries, totalCount } = await this.searchLiveLogs(userId, query));
          break;
        case 'recent':
          ({ entries, totalCount } = await this.searchRecentLogs(userId, query));
          break;
        case 'historical':
          ({ entries, totalCount } = await this.searchHistoricalLogs(userId, query));
          break;
        case 'archived':
          ({ entries, totalCount } = await this.searchArchivedLogs(userId, query));
          break;
      }

      // Filter by user's agents only
      const userAgentIds = await this.getUserAgentIds(userId);
      entries = entries.filter(entry => userAgentIds.includes(entry.agentId));
      totalCount = entries.length;

      const searchDuration = Date.now() - startTime;
      
      // Log search completion
      await this.logUserAccess({
        userId,
        action: 'search',
        query,
        resultCount: entries.length,
        timestamp: new Date()
      });

      return {
        entries,
        totalCount,
        hasMore: query.limit ? totalCount > (query.offset || 0) + query.limit : false,
        searchDuration,
        dataFreshness
      };

    } catch (error) {
      console.error('Log search failed:', error);
      throw new Error(`Log search failed: ${error.message}`);
    }
  }

  /**
   * Start real-time log streaming for deployed agents
   */
  async startLogStream(userId: string, options: LogStreamOptions): Promise<string> {
    const streamId = `stream_${userId}_${Date.now()}`;
    
    try {
      // Verify user has access to requested agents
      const userAgentIds = await this.getUserAgentIds(userId);
      const requestedAgentIds = options.agentIds || userAgentIds;
      const allowedAgentIds = requestedAgentIds.filter(id => userAgentIds.includes(id));

      if (allowedAgentIds.length === 0) {
        throw new Error('No accessible agents found for streaming');
      }

      // Create WebSocket connection for real-time streaming
      const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/logs/stream`);
      
      ws.onopen = () => {
        // Send authentication and filter options
        ws.send(JSON.stringify({
          type: 'auth',
          userId,
          apiKey: 'user-session-token', // Would use actual session token
          filters: {
            agentIds: allowedAgentIds,
            levels: options.levels,
            categories: options.categories
          }
        }));
      };

      ws.onmessage = (event) => {
        const logEntry: LogEntry = JSON.parse(event.data);
        // Emit to UI components listening for this stream
        this.emitLogEntry(streamId, logEntry);
      };

      ws.onerror = (error) => {
        console.error('Log stream error:', error);
        this.stopLogStream(streamId);
      };

      this.streamConnections.set(streamId, ws);

      // Log stream start for audit
      await this.logUserAccess({
        userId,
        action: 'stream',
        timestamp: new Date(),
        query: { agentIds: allowedAgentIds }
      });

      return streamId;

    } catch (error) {
      console.error('Failed to start log stream:', error);
      throw new Error(`Failed to start log stream: ${error.message}`);
    }
  }

  /**
   * Stop real-time log streaming
   */
  async stopLogStream(streamId: string): Promise<void> {
    const ws = this.streamConnections.get(streamId);
    if (ws) {
      ws.close();
      this.streamConnections.delete(streamId);
    }
  }

  /**
   * Export logs with various format options
   */
  async exportLogs(userId: string, options: LogExportOptions): Promise<LogExportResult> {
    try {
      // Search logs based on query
      const searchResult = await this.searchLogs(userId, options.query);
      
      if (searchResult.entries.length === 0) {
        throw new Error('No logs found matching the specified criteria');
      }

      // Generate export file
      const exportId = `export_${userId}_${Date.now()}`;
      const filename = this.generateExportFilename(options.format, options.query);
      
      let exportData: string;
      let mimeType: string;

      switch (options.format) {
        case 'json':
          exportData = JSON.stringify({
            metadata: {
              exportId,
              userId,
              timestamp: new Date().toISOString(),
              query: options.query,
              totalEntries: searchResult.entries.length,
              dataFreshness: searchResult.dataFreshness
            },
            logs: searchResult.entries.map(entry => ({
              ...entry,
              metadata: options.includeMetadata ? entry.metadata : undefined
            }))
          }, null, 2);
          mimeType = 'application/json';
          break;

        case 'csv':
          exportData = this.convertToCSV(searchResult.entries, options.includeMetadata);
          mimeType = 'text/csv';
          break;

        case 'txt':
          exportData = this.convertToText(searchResult.entries, options.includeMetadata);
          mimeType = 'text/plain';
          break;

        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Store export file
      const blob = new Blob([exportData], { type: mimeType });
      const downloadUrl = await this.storeExportFile(exportId, blob, filename);

      // Log export for audit
      await this.logUserAccess({
        userId,
        action: 'export',
        query: options.query,
        resultCount: searchResult.entries.length,
        exportId,
        timestamp: new Date()
      });

      return {
        downloadUrl,
        filename,
        size: blob.size,
        format: options.format,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        exportId
      };

    } catch (error) {
      console.error('Log export failed:', error);
      throw new Error(`Log export failed: ${error.message}`);
    }
  }

  /**
   * Get data processing transparency log
   */
  async getDataProcessingLog(userId: string, agentId?: string): Promise<DataProcessingTransparency[]> {
    try {
      const userAgentIds = await this.getUserAgentIds(userId);
      
      // Filter by specific agent if provided
      const targetAgentIds = agentId ? [agentId] : userAgentIds;
      
      // Verify user has access to requested agent
      if (agentId && !userAgentIds.includes(agentId)) {
        throw new Error('Access denied to requested agent data');
      }

      const transparencyLogs = await this.storage.getMany<DataProcessingTransparency>(
        'data_processing_transparency',
        targetAgentIds.map(id => `transparency_${id}`)
      );

      return transparencyLogs.filter(log => log !== null);

    } catch (error) {
      console.error('Failed to get data processing log:', error);
      throw new Error(`Failed to get data processing log: ${error.message}`);
    }
  }

  /**
   * Get user access audit trail
   */
  async getUserAccessAudit(userId: string, limit: number = 100): Promise<UserAccessAudit[]> {
    try {
      const auditEntries = await this.storage.getMany<UserAccessAudit>(
        'user_access_audit',
        [`audit_${userId}`]
      );

      return auditEntries
        .filter(entry => entry !== null)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to get user access audit:', error);
      throw new Error(`Failed to get user access audit: ${error.message}`);
    }
  }

  /**
   * Get current retention policy
   */
  getRetentionPolicy(): LogRetentionPolicy {
    return { ...this.retentionPolicy };
  }

  /**
   * Update retention policy (admin only)
   */
  async updateRetentionPolicy(policy: Partial<LogRetentionPolicy>): Promise<void> {
    this.retentionPolicy = { ...this.retentionPolicy, ...policy };
    await this.storage.set('log_retention_policy', 'current', this.retentionPolicy);
  }

  // Private helper methods

  private determineDataFreshness(startTime?: Date, endTime?: Date): LogSearchResult['dataFreshness'] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    if (!startTime || startTime > oneDayAgo) {
      return 'live';
    } else if (startTime > oneWeekAgo) {
      return 'recent';
    } else if (startTime > threeMonthsAgo) {
      return 'historical';
    } else {
      return 'archived';
    }
  }

  private async searchLiveLogs(userId: string, query: LogQuery): Promise<{ entries: LogEntry[], totalCount: number }> {
    // Search in real-time log buffer (last 24 hours)
    const liveLogKey = `live_logs_${userId}`;
    const liveLogs = await this.storage.get<LogEntry[]>('live_logs', liveLogKey) || [];
    
    const filteredLogs = this.filterLogs(liveLogs, query);
    return {
      entries: this.paginateLogs(filteredLogs, query),
      totalCount: filteredLogs.length
    };
  }

  private async searchRecentLogs(userId: string, query: LogQuery): Promise<{ entries: LogEntry[], totalCount: number }> {
    // Search in recent logs (last 7 days)
    const recentLogKey = `recent_logs_${userId}`;
    const recentLogs = await this.storage.get<LogEntry[]>('recent_logs', recentLogKey) || [];
    
    const filteredLogs = this.filterLogs(recentLogs, query);
    return {
      entries: this.paginateLogs(filteredLogs, query),
      totalCount: filteredLogs.length
    };
  }

  private async searchHistoricalLogs(userId: string, query: LogQuery): Promise<{ entries: LogEntry[], totalCount: number }> {
    // Search in historical logs (last 90 days)
    const historicalLogKey = `historical_logs_${userId}`;
    const historicalLogs = await this.storage.get<LogEntry[]>('historical_logs', historicalLogKey) || [];
    
    const filteredLogs = this.filterLogs(historicalLogs, query);
    return {
      entries: this.paginateLogs(filteredLogs, query),
      totalCount: filteredLogs.length
    };
  }

  private async searchArchivedLogs(userId: string, query: LogQuery): Promise<{ entries: LogEntry[], totalCount: number }> {
    // Search in archived logs (up to 1 year)
    const archivedLogKey = `archived_logs_${userId}`;
    const archivedLogs = await this.storage.get<LogEntry[]>('archived_logs', archivedLogKey) || [];
    
    const filteredLogs = this.filterLogs(archivedLogs, query);
    return {
      entries: this.paginateLogs(filteredLogs, query),
      totalCount: filteredLogs.length
    };
  }

  private filterLogs(logs: LogEntry[], query: LogQuery): LogEntry[] {
    return logs.filter(log => {
      // Filter by agent IDs
      if (query.agentIds && !query.agentIds.includes(log.agentId)) {
        return false;
      }

      // Filter by deployment IDs
      if (query.deploymentIds && !query.deploymentIds.includes(log.deploymentId)) {
        return false;
      }

      // Filter by levels
      if (query.levels && !query.levels.includes(log.level)) {
        return false;
      }

      // Filter by categories
      if (query.categories && !query.categories.includes(log.category)) {
        return false;
      }

      // Filter by sources
      if (query.sources && !query.sources.includes(log.source)) {
        return false;
      }

      // Filter by time range
      if (query.startTime && log.timestamp < query.startTime) {
        return false;
      }
      if (query.endTime && log.timestamp > query.endTime) {
        return false;
      }

      // Filter by search text
      if (query.searchText) {
        const searchLower = query.searchText.toLowerCase();
        const messageMatch = log.message.toLowerCase().includes(searchLower);
        const metadataMatch = log.metadata && 
          JSON.stringify(log.metadata).toLowerCase().includes(searchLower);
        
        if (!messageMatch && !metadataMatch) {
          return false;
        }
      }

      return true;
    });
  }

  private paginateLogs(logs: LogEntry[], query: LogQuery): LogEntry[] {
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  private async getUserAgentIds(userId: string): Promise<string[]> {
    // Get user's deployed agents
    try {
      const deployments = await deployedAgentAPI.listDeployments(userId);
      return deployments.map(d => d.agentId);
    } catch (error) {
      console.error('Failed to get user agent IDs:', error);
      return [];
    }
  }

  private emitLogEntry(streamId: string, logEntry: LogEntry): void {
    // Emit to UI components - would use event system or state management
    window.dispatchEvent(new CustomEvent(`log-stream-${streamId}`, {
      detail: logEntry
    }));
  }

  private generateExportFilename(format: string, query: LogQuery): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const agentPart = query.agentIds?.length === 1 ? `_${query.agentIds[0].split('-').pop()}` : '';
    return `promethios_logs_${timestamp}${agentPart}.${format}`;
  }

  private convertToCSV(entries: LogEntry[], includeMetadata: boolean): string {
    const headers = [
      'Timestamp',
      'Agent ID',
      'Deployment ID',
      'Level',
      'Category',
      'Message',
      'Source',
      'Governance Identity'
    ];

    if (includeMetadata) {
      headers.push('Metadata');
    }

    const csvRows = [headers.join(',')];

    entries.forEach(entry => {
      const row = [
        entry.timestamp.toISOString(),
        entry.agentId,
        entry.deploymentId,
        entry.level,
        entry.category,
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.source,
        entry.governanceIdentity || ''
      ];

      if (includeMetadata) {
        row.push(`"${JSON.stringify(entry.metadata || {}).replace(/"/g, '""')}"`);
      }

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private convertToText(entries: LogEntry[], includeMetadata: boolean): string {
    return entries.map(entry => {
      let text = `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()} `;
      text += `[${entry.category}] [${entry.agentId}] ${entry.message}`;
      
      if (includeMetadata && entry.metadata) {
        text += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
      }
      
      return text;
    }).join('\n\n');
  }

  private async storeExportFile(exportId: string, blob: Blob, filename: string): Promise<string> {
    // Store export file and return download URL
    // In a real implementation, this would upload to cloud storage
    const url = URL.createObjectURL(blob);
    
    // Store export metadata
    await this.storage.set('log_exports', exportId, {
      filename,
      size: blob.size,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    return url;
  }

  private async logUserAccess(audit: Omit<UserAccessAudit, 'id'>): Promise<void> {
    const auditEntry: UserAccessAudit = {
      id: `audit_${audit.userId}_${Date.now()}`,
      ...audit
    };

    await this.storage.set('user_access_audit', auditEntry.id, auditEntry);
  }

  /**
   * Log data processing for transparency
   */
  async logDataProcessing(transparency: Omit<DataProcessingTransparency, 'id'>): Promise<void> {
    const transparencyEntry: DataProcessingTransparency = {
      id: `transparency_${transparency.agentId}_${Date.now()}`,
      ...transparency
    };

    await this.storage.set('data_processing_transparency', transparencyEntry.id, transparencyEntry);
  }

  /**
   * Add log entry from deployed agent
   */
  async addLogEntry(logEntry: Omit<LogEntry, 'id'>): Promise<void> {
    const entry: LogEntry = {
      id: `log_${logEntry.agentId}_${Date.now()}`,
      ...logEntry
    };

    // Store in appropriate log bucket based on age
    const logBucket = this.determineLogBucket(entry.timestamp);
    await this.storage.set(logBucket, entry.id, entry);

    // Also store in user's live log buffer
    const liveLogKey = `live_logs_${entry.userId}`;
    const liveLogs = await this.storage.get<LogEntry[]>('live_logs', liveLogKey) || [];
    liveLogs.push(entry);
    
    // Keep only last 1000 entries in live buffer
    if (liveLogs.length > 1000) {
      liveLogs.splice(0, liveLogs.length - 1000);
    }
    
    await this.storage.set('live_logs', liveLogKey, liveLogs);
  }

  private determineLogBucket(timestamp: Date): string {
    const age = Date.now() - timestamp.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const threeMonthsMs = 90 * oneDayMs;

    if (age < oneDayMs) {
      return 'live_logs';
    } else if (age < oneWeekMs) {
      return 'recent_logs';
    } else if (age < threeMonthsMs) {
      return 'historical_logs';
    } else {
      return 'archived_logs';
    }
  }
}

export const logAccessService = new LogAccessService();

