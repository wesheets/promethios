/**
 * Audit Backend Service
 * 
 * Service layer for communicating with the audit and compliance backend APIs.
 * Handles audit logging, compliance reporting, and governance evidence collection.
 */

import { API_BASE_URL } from '../config/api';

export interface AuditLogRequest {
  agent_id: string;
  event_type: string;
  event_details: Record<string, any>;
  source: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  related_resources?: Array<{
    type: string;
    id: string;
  }>;
  tags?: string[];
  timestamp?: string;
}

export interface AuditLogResponse {
  audit_id: string;
  agent_id: string;
  event_type: string;
  source: string;
  severity: string;
  timestamp: string;
  status: 'logged' | 'processed' | 'archived';
}

export interface AuditLogEntry {
  audit_id: string;
  agent_id: string;
  event_type: string;
  event_details: Record<string, any>;
  source: string;
  severity: string;
  related_resources: Array<{
    type: string;
    id: string;
  }>;
  tags: string[];
  timestamp: string;
  status: string;
}

export interface AuditQueryRequest {
  agent_id?: string;
  event_type?: string;
  source?: string;
  severity?: string;
  start_time?: string;
  end_time?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface AuditQueryResponse {
  audit_logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface ComplianceReportRequest {
  report_type: 'summary' | 'detailed' | 'violations' | 'trends';
  scope: {
    agent_ids?: string[];
    event_types?: string[];
    start_time?: string;
    end_time?: string;
  };
  format: 'json' | 'pdf' | 'csv';
  include_recommendations?: boolean;
}

export interface ComplianceReportResponse {
  report_id: string;
  report_type: string;
  scope: Record<string, any>;
  format: string;
  status: 'generating' | 'completed' | 'failed';
  generated_at: string;
  download_url?: string;
  summary: {
    total_events: number;
    compliance_score: number;
    violations_count: number;
    recommendations_count: number;
  };
  content?: Record<string, any>;
}

export interface AuditMetrics {
  total_logs: number;
  logs_by_severity: Record<string, number>;
  logs_by_event_type: Record<string, number>;
  recent_activity: Array<{
    date: string;
    count: number;
    severity_breakdown: Record<string, number>;
  }>;
  compliance_trends: Array<{
    period: string;
    compliance_score: number;
    violations: number;
  }>;
  top_agents_by_activity: Array<{
    agent_id: string;
    log_count: number;
    compliance_score: number;
  }>;
}

class AuditBackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/audit`;
  }

  /**
   * Log an audit event
   */
  async logEvent(request: AuditLogRequest): Promise<AuditLogResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(request: AuditQueryRequest): Promise<AuditQueryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (request.agent_id) params.append('agent_id', request.agent_id);
      if (request.event_type) params.append('event_type', request.event_type);
      if (request.source) params.append('source', request.source);
      if (request.severity) params.append('severity', request.severity);
      if (request.start_time) params.append('start_time', request.start_time);
      if (request.end_time) params.append('end_time', request.end_time);
      if (request.tags) params.append('tags', request.tags.join(','));
      if (request.limit) params.append('limit', request.limit.toString());
      if (request.offset) params.append('offset', request.offset.toString());
      
      const response = await fetch(`${this.baseUrl}/query?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return {
        audit_logs: [],
        total: 0,
        page: 1,
        limit: request.limit || 100
      };
    }
  }

  /**
   * Get a specific audit log entry by ID
   */
  async getAuditLog(auditId: string): Promise<AuditLogEntry | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${auditId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return null;
    }
  }

  /**
   * Generate a compliance report
   */
  async generateReport(request: ComplianceReportRequest): Promise<ComplianceReportResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Get a compliance report by ID
   */
  async getReport(reportId: string): Promise<ComplianceReportResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/report/${reportId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching compliance report:', error);
      return null;
    }
  }

  /**
   * Export audit data
   */
  async exportData(request: {
    format: 'json' | 'csv' | 'pdf';
    filters?: AuditQueryRequest;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('format', request.format);
      
      if (request.filters) {
        Object.entries(request.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }
      
      const response = await fetch(`${this.baseUrl}/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error exporting audit data:', error);
      throw error;
    }
  }

  /**
   * Get audit metrics and statistics
   */
  async getMetrics(): Promise<AuditMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching audit metrics:', error);
      // Return default metrics on error
      return {
        total_logs: 0,
        logs_by_severity: {},
        logs_by_event_type: {},
        recent_activity: [],
        compliance_trends: [],
        top_agents_by_activity: []
      };
    }
  }

  /**
   * Get recent audit activity for an agent
   */
  async getAgentActivity(agentId: string, limit: number = 10): Promise<AuditLogEntry[]> {
    try {
      const response = await this.queryLogs({ 
        agent_id: agentId, 
        limit 
      });
      return response.audit_logs;
    } catch (error) {
      console.error('Error fetching agent activity:', error);
      return [];
    }
  }

  /**
   * Get compliance score for an agent
   */
  async getAgentComplianceScore(agentId: string): Promise<number> {
    try {
      const response = await this.queryLogs({ 
        agent_id: agentId,
        limit: 100 
      });
      
      if (response.audit_logs.length === 0) {
        return 100; // Perfect score if no violations
      }
      
      const violations = response.audit_logs.filter(log => 
        log.severity === 'error' || log.severity === 'critical'
      ).length;
      
      const complianceScore = Math.max(0, 100 - (violations / response.audit_logs.length) * 100);
      return Math.round(complianceScore);
    } catch (error) {
      console.error('Error calculating agent compliance score:', error);
      return 0;
    }
  }
}

export const auditBackendService = new AuditBackendService();
export default auditBackendService;

