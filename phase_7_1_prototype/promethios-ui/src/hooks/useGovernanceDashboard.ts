/**
 * Governance Dashboard Backend Hook
 * 
 * React hook for managing governance dashboard state and backend integration.
 * Provides state management for metrics, violations, reports, and overview data.
 */

import { useState, useEffect, useCallback } from 'react';
import governanceDashboardBackendService, {
  GovernanceMetrics,
  GovernanceViolation,
  GovernanceReport,
  DashboardOverview
} from '../services/governanceDashboardBackendService';

interface UseGovernanceDashboardState {
  // Metrics
  metrics: GovernanceMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Violations
  violations: GovernanceViolation[];
  violationsLoading: boolean;
  violationsError: string | null;
  
  // Reports
  reports: GovernanceReport[];
  reportsLoading: boolean;
  reportsError: string | null;
  
  // Overview
  overview: DashboardOverview | null;
  overviewLoading: boolean;
  overviewError: string | null;
  
  // Operations
  generatingReport: boolean;
  resolvingViolation: boolean;
  operationError: string | null;
}

interface UseGovernanceDashboardActions {
  // Metrics Actions
  loadMetrics: () => Promise<void>;
  
  // Violations Actions
  loadViolations: () => Promise<void>;
  resolveViolation: (violationId: string, resolutionNotes: string) => Promise<void>;
  
  // Reports Actions
  loadReports: () => Promise<void>;
  generateReport: (reportType: 'compliance' | 'audit' | 'violations' | 'trust' | 'summary') => Promise<GovernanceReport>;
  
  // Overview Actions
  loadOverview: () => Promise<void>;
  
  // Utility Actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
  
  // Filter Actions
  filterViolations: (filters: {
    type?: string;
    severity?: string;
    status?: string;
    agent?: string;
  }) => GovernanceViolation[];
}

export interface UseGovernanceDashboardReturn extends UseGovernanceDashboardState, UseGovernanceDashboardActions {}

export const useGovernanceDashboard = (): UseGovernanceDashboardReturn => {
  // State
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  
  const [violations, setViolations] = useState<GovernanceViolation[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [violationsError, setViolationsError] = useState<string | null>(null);
  
  const [reports, setReports] = useState<GovernanceReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  
  const [generatingReport, setGeneratingReport] = useState(false);
  const [resolvingViolation, setResolvingViolation] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Metrics Actions
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metricsData = await governanceDashboardBackendService.getGovernanceMetrics();
      setMetrics(metricsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load governance metrics';
      setMetricsError(errorMessage);
      console.error('Error loading governance metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Violations Actions
  const loadViolations = useCallback(async () => {
    setViolationsLoading(true);
    setViolationsError(null);
    
    try {
      const violationsData = await governanceDashboardBackendService.getGovernanceViolations();
      setViolations(violationsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load governance violations';
      setViolationsError(errorMessage);
      console.error('Error loading governance violations:', error);
    } finally {
      setViolationsLoading(false);
    }
  }, []);

  const resolveViolation = useCallback(async (violationId: string, resolutionNotes: string) => {
    setResolvingViolation(true);
    setOperationError(null);
    
    try {
      await governanceDashboardBackendService.resolveViolation(violationId, resolutionNotes);
      
      // Update the violation status locally
      setViolations(prev => prev.map(violation => 
        violation.violation_id === violationId 
          ? { 
              ...violation, 
              status: 'resolved' as const,
              resolved_at: new Date().toISOString(),
              resolution_notes: resolutionNotes
            }
          : violation
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve violation';
      setOperationError(errorMessage);
      console.error('Error resolving violation:', error);
      throw error;
    } finally {
      setResolvingViolation(false);
    }
  }, []);

  // Reports Actions
  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    
    try {
      // Simulate loading existing reports
      const mockReports: GovernanceReport[] = [
        await governanceDashboardBackendService.generateGovernanceReport('summary'),
        await governanceDashboardBackendService.generateGovernanceReport('compliance'),
        await governanceDashboardBackendService.generateGovernanceReport('violations')
      ];
      
      setReports(mockReports);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load governance reports';
      setReportsError(errorMessage);
      console.error('Error loading governance reports:', error);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (reportType: 'compliance' | 'audit' | 'violations' | 'trust' | 'summary') => {
    setGeneratingReport(true);
    setOperationError(null);
    
    try {
      const report = await governanceDashboardBackendService.generateGovernanceReport(reportType);
      setReports(prev => [report, ...prev]);
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setOperationError(errorMessage);
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setGeneratingReport(false);
    }
  }, []);

  // Overview Actions
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    
    try {
      const overviewData = await governanceDashboardBackendService.getDashboardOverview();
      setOverview(overviewData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard overview';
      setOverviewError(errorMessage);
      console.error('Error loading dashboard overview:', error);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // Utility Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadMetrics(),
      loadViolations(),
      loadReports(),
      loadOverview()
    ]);
  }, [loadMetrics, loadViolations, loadReports, loadOverview]);

  const clearErrors = useCallback(() => {
    setMetricsError(null);
    setViolationsError(null);
    setReportsError(null);
    setOverviewError(null);
    setOperationError(null);
  }, []);

  // Filter Actions
  const filterViolations = useCallback((filters: {
    type?: string;
    severity?: string;
    status?: string;
    agent?: string;
  }) => {
    return violations.filter(violation => {
      if (filters.type && violation.violation_type !== filters.type) {
        return false;
      }
      if (filters.severity && violation.severity !== filters.severity) {
        return false;
      }
      if (filters.status && violation.status !== filters.status) {
        return false;
      }
      if (filters.agent && !violation.agent_name.toLowerCase().includes(filters.agent.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [violations]);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    // State
    metrics,
    metricsLoading,
    metricsError,
    violations,
    violationsLoading,
    violationsError,
    reports,
    reportsLoading,
    reportsError,
    overview,
    overviewLoading,
    overviewError,
    generatingReport,
    resolvingViolation,
    operationError,
    
    // Actions
    loadMetrics,
    loadViolations,
    resolveViolation,
    loadReports,
    generateReport,
    loadOverview,
    refreshAll,
    clearErrors,
    filterViolations
  };
};

export default useGovernanceDashboard;

