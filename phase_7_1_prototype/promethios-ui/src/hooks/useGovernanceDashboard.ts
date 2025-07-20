/**
 * useGovernanceDashboard Hook
 * React hook for managing Dashboard state with existing Promethios data sources
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import existingDataBridgeService from '../services/ExistingDataBridgeService';
import { DashboardMetrics, BackendHealthStatus } from '../services/GovernanceDashboardService';
import { useAuth } from '../context/AuthContext';

interface UseGovernanceDashboardReturn {
  metrics: DashboardMetrics;
  health: BackendHealthStatus;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isConnected: boolean;
  refreshMetrics: () => Promise<void>;
  triggerAction: (action: string, params?: any) => Promise<any>;
}

export const useGovernanceDashboard = (): UseGovernanceDashboardReturn => {
  const { currentUser } = useAuth(); // Get current authenticated user
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    agents: { total: 0, individual: 0, multiAgent: 0, healthy: 0, warning: 0, critical: 0 },
    governance: { score: 0, activePolicies: 0, violations: 0, complianceRate: 0 },
    trust: { averageScore: 0, competence: 0, reliability: 0, honesty: 0, transparency: 0, totalAttestations: 0, activeBoundaries: 0 },
    activity: { recentEvents: [] },
  });

  const [health, setHealth] = useState<BackendHealthStatus>({
    status: 'down',
    lastCheck: new Date().toISOString(),
    components: {
      trustMetricsCalculator: false,
      enhancedVeritas: false,
      emotionTelemetry: false,
      governanceCore: false,
      eventBus: false,
      storage: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  /**
   * Fetch dashboard metrics from bridge service
   */
  const refreshMetrics = useCallback(async () => {
    if (!mountedRef.current || loading) return;

    setLoading(true);

    try {
      setError(null);
      
      // CRITICAL: Set the current user in the bridge service
      if (currentUser?.uid) {
        console.log('🔧 useGovernanceDashboard: Setting current user in bridge service:', currentUser.uid);
        existingDataBridgeService.setCurrentUser(currentUser.uid);
      } else {
        console.warn('⚠️ useGovernanceDashboard: No current user available');
        setLoading(false);
        return;
      }
      
      // Fetch metrics and health in parallel
      const [metricsData, healthData] = await Promise.all([
        existingDataBridgeService.getDashboardMetrics(),
        existingDataBridgeService.getBackendHealth(),
      ]);

      if (mountedRef.current) {
        setMetrics(metricsData);
        setHealth(healthData);
        setLastUpdated(new Date());
        setIsConnected(healthData.status !== 'down');
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
        setError(errorMessage);
        setIsConnected(false);
        console.error('Dashboard refresh error:', err);
      } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loading, currentUser]); // Add currentUser as dependency

  /**
   * Trigger governance action
   */
  const triggerAction = useCallback(async (action: string, params: any = {}) => {
    try {
      setError(null);
      const result = await existingDataBridgeService.triggerGovernanceAction(action, params);
      
      // Refresh metrics after action
      await refreshMetrics();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to execute action: ${action}`;
      setError(errorMessage);
      throw err;
    }
  }, [refreshMetrics]);

  /**
   * Handle real-time updates from existing data bridge service
   */
  useEffect(() => {
    const handleMetricsUpdate = (data: any) => {
      if (mountedRef.current) {
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          ...data,
        }));
        setLastUpdated(new Date());
      }
    };

    const handleConnectionChange = (data: any) => {
      if (mountedRef.current) {
        setIsConnected(data.status === 'connected');
        if (data.status === 'connected') {
          setError(null);
          // Refresh data when reconnected
          refreshMetrics();
        } else if (data.status === 'error') {
          setError('Data bridge connection error');
        }
      }
    };

    // Subscribe to real-time updates from existing data bridge
    existingDataBridgeService.on('metrics_update', handleMetricsUpdate);
    existingDataBridgeService.on('connection', handleConnectionChange);

    return () => {
      existingDataBridgeService.off('metrics_update', handleMetricsUpdate);
      existingDataBridgeService.off('connection', handleConnectionChange);
    };
  }, [refreshMetrics]);

  /**
   * Initialize dashboard data and set up refresh interval
   */
  useEffect(() => {
    // Initial data fetch
    refreshMetrics();

    // Set up periodic refresh (every 30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        // Refresh data periodically to check for changes
        refreshMetrics();
      }
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshMetrics, isConnected]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    metrics,
    health,
    loading,
    error,
    lastUpdated,
    isConnected,
    refreshMetrics,
    triggerAction,
  };
};

export default useGovernanceDashboard;

