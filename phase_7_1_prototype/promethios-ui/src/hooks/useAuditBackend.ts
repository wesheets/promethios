/**
 * Audit Backend Hook
 * 
 * React hook for managing audit state and backend integration.
 * Provides state management for audit logs, compliance reports, and metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import auditBackendService, {
  AuditLogRequest,
  AuditLogResponse,
  AuditLogEntry,
  AuditQueryRequest,
  AuditQueryResponse,
  ComplianceReportRequest,
  ComplianceReportResponse,
  AuditMetrics
} from '../services/auditBackendService';

interface UseAuditBackendState {
  // Audit Logs
  auditLogs: AuditLogEntry[];
  auditLogsLoading: boolean;
  auditLogsError: string | null;
  
  // Audit Metrics
  metrics: AuditMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Current Audit Log
  currentAuditLog: AuditLogEntry | null;
  currentAuditLogLoading: boolean;
  currentAuditLogError: string | null;
  
  // Compliance Reports
  reports: ComplianceReportResponse[];
  reportsLoading: boolean;
  reportsError: string | null;
  
  // Operations
  loggingEvent: boolean;
  loggingError: string | null;
  generatingReport: boolean;
  reportGenerationError: string | null;
}

interface UseAuditBackendActions {
  // Audit Log Actions
  logEvent: (request: AuditLogRequest) => Promise<AuditLogResponse>;
  queryLogs: (request: AuditQueryRequest) => Promise<AuditQueryResponse>;
  getAuditLog: (auditId: string) => Promise<AuditLogEntry | null>;
  
  // Compliance Report Actions
  generateReport: (request: ComplianceReportRequest) => Promise<ComplianceReportResponse>;
  getReport: (reportId: string) => Promise<ComplianceReportResponse | null>;
  
  // Export Actions
  exportData: (request: { format: 'json' | 'csv' | 'pdf'; filters?: AuditQueryRequest }) => Promise<Blob>;
  
  // Metrics Actions
  loadMetrics: () => Promise<void>;
  
  // Agent-specific Actions
  getAgentActivity: (agentId: string, limit?: number) => Promise<AuditLogEntry[]>;
  getAgentComplianceScore: (agentId: string) => Promise<number>;
  
  // Utility Actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
}

export interface UseAuditBackendReturn extends UseAuditBackendState, UseAuditBackendActions {}

export const useAuditBackend = (): UseAuditBackendReturn => {
  // State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  
  const [currentAuditLog, setCurrentAuditLog] = useState<AuditLogEntry | null>(null);
  const [currentAuditLogLoading, setCurrentAuditLogLoading] = useState(false);
  const [currentAuditLogError, setCurrentAuditLogError] = useState<string | null>(null);
  
  const [reports, setReports] = useState<ComplianceReportResponse[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  
  const [loggingEvent, setLoggingEvent] = useState(false);
  const [loggingError, setLoggingError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportGenerationError, setReportGenerationError] = useState<string | null>(null);

  // Audit Log Actions
  const logEvent = useCallback(async (request: AuditLogRequest) => {
    setLoggingEvent(true);
    setLoggingError(null);
    
    try {
      const response = await auditBackendService.logEvent(request);
      
      // Refresh audit logs to include the new one
      await queryLogs({ limit: 100 });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log audit event';
      setLoggingError(errorMessage);
      console.error('Error logging audit event:', error);
      throw error;
    } finally {
      setLoggingEvent(false);
    }
  }, []);

  const queryLogs = useCallback(async (request: AuditQueryRequest) => {
    setAuditLogsLoading(true);
    setAuditLogsError(null);
    
    try {
      const response = await auditBackendService.queryLogs(request);
      setAuditLogs(response.audit_logs);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to query audit logs';
      setAuditLogsError(errorMessage);
      console.error('Error querying audit logs:', error);
      throw error;
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);

  const getAuditLog = useCallback(async (auditId: string) => {
    setCurrentAuditLogLoading(true);
    setCurrentAuditLogError(null);
    
    try {
      const auditLog = await auditBackendService.getAuditLog(auditId);
      setCurrentAuditLog(auditLog);
      return auditLog;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get audit log';
      setCurrentAuditLogError(errorMessage);
      console.error('Error getting audit log:', error);
      throw error;
    } finally {
      setCurrentAuditLogLoading(false);
    }
  }, []);

  // Compliance Report Actions
  const generateReport = useCallback(async (request: ComplianceReportRequest) => {
    setGeneratingReport(true);
    setReportGenerationError(null);
    
    try {
      const response = await auditBackendService.generateReport(request);
      setReports(prev => [...prev, response]);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate compliance report';
      setReportGenerationError(errorMessage);
      console.error('Error generating compliance report:', error);
      throw error;
    } finally {
      setGeneratingReport(false);
    }
  }, []);

  const getReport = useCallback(async (reportId: string) => {
    setReportsLoading(true);
    setReportsError(null);
    
    try {
      const report = await auditBackendService.getReport(reportId);
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get compliance report';
      setReportsError(errorMessage);
      console.error('Error getting compliance report:', error);
      throw error;
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // Export Actions
  const exportData = useCallback(async (request: { format: 'json' | 'csv' | 'pdf'; filters?: AuditQueryRequest }) => {
    try {
      const blob = await auditBackendService.exportData(request);
      return blob;
    } catch (error) {
      console.error('Error exporting audit data:', error);
      throw error;
    }
  }, []);

  // Metrics Actions
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metricsData = await auditBackendService.getMetrics();
      setMetrics(metricsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audit metrics';
      setMetricsError(errorMessage);
      console.error('Error loading audit metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Agent-specific Actions
  const getAgentActivity = useCallback(async (agentId: string, limit: number = 10) => {
    try {
      const activity = await auditBackendService.getAgentActivity(agentId, limit);
      return activity;
    } catch (error) {
      console.error('Error getting agent activity:', error);
      return [];
    }
  }, []);

  const getAgentComplianceScore = useCallback(async (agentId: string) => {
    try {
      const score = await auditBackendService.getAgentComplianceScore(agentId);
      return score;
    } catch (error) {
      console.error('Error getting agent compliance score:', error);
      return 0;
    }
  }, []);

  // Utility Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadMetrics(),
      queryLogs({ limit: 100 })
    ]);
  }, [loadMetrics, queryLogs]);

  const clearErrors = useCallback(() => {
    setAuditLogsError(null);
    setMetricsError(null);
    setCurrentAuditLogError(null);
    setReportsError(null);
    setLoggingError(null);
    setReportGenerationError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    // State
    auditLogs,
    auditLogsLoading,
    auditLogsError,
    metrics,
    metricsLoading,
    metricsError,
    currentAuditLog,
    currentAuditLogLoading,
    currentAuditLogError,
    reports,
    reportsLoading,
    reportsError,
    loggingEvent,
    loggingError,
    generatingReport,
    reportGenerationError,
    
    // Actions
    logEvent,
    queryLogs,
    getAuditLog,
    generateReport,
    getReport,
    exportData,
    loadMetrics,
    getAgentActivity,
    getAgentComplianceScore,
    refreshAll,
    clearErrors
  };
};

export default useAuditBackend;

