/**
 * Reporting Extension
 * 
 * Enterprise-grade reporting system extension for Promethios governance.
 * Provides comprehensive report generation, scheduling, distribution, and analytics
 * with full integration to existing Promethios modules and real data sources.
 * Now includes proper user authentication and scoping.
 */

import { Extension } from './Extension';
import { authApiService } from '../services/authApiService';
import type { User } from 'firebase/auth';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'audit' | 'performance' | 'security' | 'trust' | 'policy' | 'custom';
  format: 'pdf' | 'excel' | 'json' | 'csv';
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  sections: ReportSection[];
  filters: ReportFilter[];
  access_control: {
    required_roles: string[];
    approval_required: boolean;
    approvers: string[];
  };
  retention_policy: {
    keep_for_days: number;
    auto_archive: boolean;
    encryption_required: boolean;
  };
  distribution: {
    email_recipients: string[];
    cloud_storage: boolean;
    notification_channels: string[];
  };
  created_at: string;
  created_by: string;
  last_modified: string;
  version: number;
  status: 'active' | 'draft' | 'archived';
  usage_stats: {
    generation_count: number;
    last_generated: string;
    avg_generation_time: number;
    download_count: number;
  };
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'summary' | 'chart' | 'table' | 'metrics' | 'violations' | 'trends' | 'compliance' | 'trust_analysis' | 'policy_analysis';
  data_source: 'agent_metrics' | 'agent_violations' | 'agent_logs' | 'policy_management' | 'trust_metrics' | 'combined';
  enabled: boolean;
  order: number;
  config: {
    title?: string;
    description?: string;
    chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';
    time_period?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
    filters?: Record<string, any>;
    columns?: string[];
    sort_by?: string;
    limit?: number;
    include_trends?: boolean;
    show_predictions?: boolean;
  };
}

export interface ReportFilter {
  id: string;
  name: string;
  type: 'agent_selection' | 'date_range' | 'severity' | 'status' | 'category' | 'policy_type' | 'trust_threshold';
  required: boolean;
  default_value: any;
  options?: any[];
  validation?: {
    min?: any;
    max?: any;
    pattern?: string;
  };
}

export interface GeneratedReport {
  id: string;
  template_id: string;
  template_name: string;
  template_version: number;
  generated_at: string;
  generated_by: string;
  generation_time: number;
  file_path: string;
  file_size: number;
  format: string;
  status: 'generating' | 'completed' | 'failed' | 'approved' | 'rejected';
  approval_status?: {
    required: boolean;
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
  };
  filters_applied: Record<string, any>;
  data_snapshot: {
    agents_included: string[];
    date_range: { start: string; end: string };
    total_records: number;
    data_sources: string[];
  };
  access_log: {
    downloads: number;
    last_accessed: string;
    accessed_by: string[];
  };
  distribution_log: {
    email_sent: boolean;
    email_recipients: string[];
    cloud_uploaded: boolean;
    notifications_sent: string[];
  };
  retention: {
    expires_at: string;
    archived: boolean;
    encrypted: boolean;
  };
}

export interface ReportAnalytics {
  overview: {
    total_templates: number;
    active_templates: number;
    total_reports_generated: number;
    reports_this_month: number;
    total_downloads: number;
    avg_generation_time: number;
    most_popular_template: string;
    compliance_score: number;
    audit_coverage: number;
  };
  usage_patterns: {
    generation_by_day: Array<{ date: string; count: number }>;
    downloads_by_template: Array<{ template: string; downloads: number }>;
    format_distribution: Array<{ format: string; count: number; percentage: number }>;
    user_activity: Array<{ user: string; reports_generated: number; last_activity: string }>;
  };
  performance_metrics: {
    generation_times: Array<{ template: string; avg_time: number; min_time: number; max_time: number }>;
    failure_rates: Array<{ template: string; total_attempts: number; failures: number; failure_rate: number }>;
    resource_usage: Array<{ date: string; cpu_usage: number; memory_usage: number; storage_used: number }>;
  };
  compliance_insights: {
    compliance_trends: Array<{ date: string; score: number; violations: number }>;
    audit_coverage_by_area: Array<{ area: string; coverage: number; last_audit: string }>;
    policy_adherence: Array<{ policy: string; adherence_rate: number; violations: number }>;
  };
}

export interface ReportGenerationProgress {
  report_id: string;
  status: 'initializing' | 'collecting_data' | 'processing' | 'generating_charts' | 'creating_document' | 'finalizing' | 'completed' | 'failed';
  progress_percentage: number;
  current_step: string;
  estimated_completion: string;
  data_collected: {
    agents: number;
    violations: number;
    policies: number;
    metrics: number;
  };
  errors?: string[];
}

export class ReportingExtension extends Extension {
  private baseUrl: string;
  private wsConnection: WebSocket | null = null;
  private progressCallbacks: Map<string, (progress: ReportGenerationProgress) => void> = new Map();

  constructor() {
    super('reporting');
    this.baseUrl = '/api/reporting';
  }

  async initialize(config?: any, user?: User | null): Promise<boolean> {
    try {
      // Initialize WebSocket connection for real-time progress updates
      await this.initializeWebSocket();
      
      // Verify backend connectivity with authentication if user provided
      if (user) {
        const healthCheck = await authApiService.authenticatedFetch(`${this.baseUrl}/health`, {
          method: 'GET',
          user: user
        });
        if (!healthCheck.ok) {
          throw new Error('Reporting backend not available');
        }
      } else {
        // Fallback to unauthenticated health check for initialization
        const healthCheck = await fetch(`${this.baseUrl}/health`);
        if (!healthCheck.ok) {
          throw new Error('Reporting backend not available');
        }
      }

      // Initialize report generation engine
      await this.initializeReportEngine(user);
      
      console.log('Reporting extension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize reporting extension:', error);
      return false;
    }
  }

  private async initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:5004/ws/reporting`;
        this.wsConnection = new WebSocket(wsUrl);
        
        this.wsConnection.onopen = () => {
          console.log('Reporting WebSocket connected');
          resolve();
        };
        
        this.wsConnection.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'report_progress' && this.progressCallbacks.has(data.report_id)) {
            const callback = this.progressCallbacks.get(data.report_id);
            if (callback) {
              callback(data.progress);
            }
          }
        };
        
        this.wsConnection.onerror = (error) => {
          console.error('Reporting WebSocket error:', error);
          reject(error);
        };
        
        this.wsConnection.onclose = () => {
          console.log('Reporting WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => this.initializeWebSocket(), 5000);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private async initializeReportEngine(user?: User | null): Promise<void> {
    if (user) {
      const response = await authApiService.authenticatedFetch(`${this.baseUrl}/engine/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enable_real_time: true,
          enable_ml_insights: true,
          enable_predictive_analytics: true
        }),
        user: user
      });

      if (!response.ok) {
        throw new Error('Failed to initialize report engine');
      }
    } else {
      // Fallback for initialization without user
      const response = await fetch(`${this.baseUrl}/engine/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enable_real_time: true,
          enable_ml_insights: true,
          enable_predictive_analytics: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize report engine');
      }
    }
  }

  // Template Management with authentication
  async getReportTemplates(user: User | null): Promise<ReportTemplate[]> {
    if (!user) {
      throw new Error('User authentication required for report templates');
    }

    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/templates`, {
      method: 'GET',
      user: user
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch report templates');
    }
    
    return response.json();
  }

  async createReportTemplate(user: User | null, template: Omit<ReportTemplate, 'id' | 'created_at' | 'version' | 'usage_stats'>): Promise<ReportTemplate> {
    if (!user) {
      throw new Error('User authentication required for creating report templates');
    }

    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to create report template');
    }
    return response.json();
  }

  async updateReportTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update report template');
    }
    return response.json();
  }

  async deleteReportTemplate(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete report template');
    }
  }

  // Report Generation with authentication
  async generateReport(
    user: User | null,
    templateId: string, 
    filters: Record<string, any>,
    onProgress?: (progress: ReportGenerationProgress) => void
  ): Promise<GeneratedReport> {
    if (!user) {
      throw new Error('User authentication required for report generation');
    }

    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        filters,
        real_time_progress: !!onProgress
      }),
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to start report generation');
    }

    const result = await response.json();
    
    if (onProgress && result.report_id) {
      this.progressCallbacks.set(result.report_id, onProgress);
    }

    return result;
  }

  async getGenerationProgress(reportId: string): Promise<ReportGenerationProgress> {
    const response = await fetch(`${this.baseUrl}/generate/${reportId}/progress`);
    if (!response.ok) {
      throw new Error('Failed to fetch generation progress');
    }
    return response.json();
  }

  async cancelReportGeneration(reportId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/generate/${reportId}/cancel`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to cancel report generation');
    }

    this.progressCallbacks.delete(reportId);
  }

  // Generated Reports Management with authentication
  async getGeneratedReports(user: User | null, filters?: {
    template_id?: string;
    status?: string;
    date_range?: { start: string; end: string };
    generated_by?: string;
  }): Promise<GeneratedReport[]> {
    if (!user) {
      throw new Error('User authentication required for accessing generated reports');
    }

    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
      });
    }

    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/reports?${params}`, {
      method: 'GET',
      user: user
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch generated reports');
    }
    return response.json();
  }

  async downloadReport(user: User | null, reportId: string): Promise<Blob> {
    if (!user) {
      throw new Error('User authentication required for downloading reports');
    }

    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/reports/${reportId}/download`, {
      method: 'GET',
      user: user
    });
    
    if (!response.ok) {
      throw new Error('Failed to download report');
    }
    return response.blob();
  }

  async shareReport(reportId: string, recipients: string[], message?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reports/${reportId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients, message })
    });

    if (!response.ok) {
      throw new Error('Failed to share report');
    }
  }

  async approveReport(reportId: string, comments?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reports/${reportId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments })
    });

    if (!response.ok) {
      throw new Error('Failed to approve report');
    }
  }

  async rejectReport(reportId: string, reason: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reports/${reportId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error('Failed to reject report');
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reports/${reportId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete report');
    }
  }

  // Scheduling
  async scheduleReport(templateId: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time: string;
    timezone: string;
    filters: Record<string, any>;
    recipients: string[];
    enabled: boolean;
  }): Promise<{ schedule_id: string }> {
    const response = await fetch(`${this.baseUrl}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        ...schedule
      })
    });

    if (!response.ok) {
      throw new Error('Failed to schedule report');
    }
    return response.json();
  }

  async getScheduledReports(): Promise<Array<{
    id: string;
    template_id: string;
    template_name: string;
    frequency: string;
    next_run: string;
    last_run?: string;
    enabled: boolean;
    recipients: string[];
  }>> {
    const response = await fetch(`${this.baseUrl}/schedules`);
    if (!response.ok) {
      throw new Error('Failed to fetch scheduled reports');
    }
    return response.json();
  }

  async updateSchedule(scheduleId: string, updates: any): Promise<void> {
    const response = await fetch(`${this.baseUrl}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update schedule');
    }
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/schedules/${scheduleId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete schedule');
    }
  }

  // Analytics
  async getReportAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ReportAnalytics> {
    const response = await fetch(`${this.baseUrl}/analytics?time_range=${timeRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch report analytics');
    }
    return response.json();
  }

  async getTemplateUsageStats(templateId: string): Promise<{
    generation_count: number;
    download_count: number;
    avg_generation_time: number;
    success_rate: number;
    usage_by_day: Array<{ date: string; count: number }>;
    user_activity: Array<{ user: string; count: number }>;
  }> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch template usage stats');
    }
    return response.json();
  }

  // Data Preview
  async previewReportData(templateId: string, filters: Record<string, any>): Promise<{
    sections: Array<{
      section_id: string;
      section_name: string;
      data_preview: any;
      record_count: number;
      estimated_size: string;
    }>;
    total_records: number;
    estimated_generation_time: number;
  }> {
    const response = await fetch(`${this.baseUrl}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        filters
      })
    });

    if (!response.ok) {
      throw new Error('Failed to preview report data');
    }
    return response.json();
  }

  // Export Utilities
  async exportReportData(reportId: string, format: 'csv' | 'json' | 'excel'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/reports/${reportId}/export?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to export report data');
    }
    return response.blob();
  }

  async bulkExport(reportIds: string[], format: 'zip' | 'tar'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/reports/bulk-export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_ids: reportIds, format })
    });

    if (!response.ok) {
      throw new Error('Failed to bulk export reports');
    }
    return response.blob();
  }

  // Cleanup
  cleanup(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.progressCallbacks.clear();
  }
}

// Export singleton instance
export const reportingExtension = new ReportingExtension();

