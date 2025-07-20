import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { existingDataBridgeService } from '../services/ExistingDataBridgeService';

export interface DashboardMetrics {
  agents: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  governance: {
    score: number;
    activePolicies: number;
    violations: number;
  };
  trust: {
    averageScore: number;
    competence: number;
    reliability: number;
    honesty: number;
    transparency: number;
    attestations: number;
    boundaries: number;
  };
  systemHealth: {
    status: 'operational' | 'degraded' | 'down';
    lastCheck: Date;
  };
  recentActivity: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
  }>;
}

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  lastCheck: Date;
  components: {
    storage: 'operational' | 'degraded' | 'down';
    eventBus: 'operational' | 'degraded' | 'down';
    governance: 'operational' | 'degraded' | 'down';
  };
}

export function useGovernanceDashboard() {
  const { currentUser } = useAuth();
  const mountedRef = useRef(true);
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * Refresh dashboard metrics from backend
   */
  const refreshMetrics = useCallback(async () => {
    if (!mountedRef.current || !currentUser?.uid) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔧 useGovernanceDashboard: Setting current user in bridge service:', currentUser.uid);
      await existingDataBridgeService.setCurrentUser(currentUser.uid);
      
      setError(null);
      
      const newMetrics = await existingDataBridgeService.getDashboardMetrics();
      const healthData = await existingDataBridgeService.getSystemHealth();
      
      if (mountedRef.current) {
        setMetrics(newMetrics);
        setHealth(healthData);
        setIsConnected(true);
        setLastUpdated(new Date());
        console.log('✅ Dashboard metrics loaded successfully');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        setIsConnected(false);
        console.error('Dashboard refresh error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser?.uid]);

  /**
   * Trigger governance action
   */
  const triggerAction = useCallback(async (action: string, params: any = {}) => {
    if (!currentUser?.uid) return;
    
    try {
      await existingDataBridgeService.triggerAction(action, params);
      // Refresh metrics after action
      await refreshMetrics();
    } catch (err) {
      console.error('Action trigger error:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger action');
    }
  }, [currentUser?.uid, refreshMetrics]);

  // Initial load and setup
  useEffect(() => {
    if (currentUser?.uid) {
      console.log('🚀 useGovernanceDashboard: Initial load for user:', currentUser.uid);
      refreshMetrics();
    } else {
      setLoading(false);
    }
  }, [currentUser?.uid, refreshMetrics]);

  // Periodic refresh every 30 seconds
  useEffect(() => {
    if (!currentUser?.uid) return;

    const interval = setInterval(() => {
      if (mountedRef.current) {
        console.log('🔄 Periodic dashboard refresh');
        refreshMetrics();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser?.uid, refreshMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    metrics,
    health,
    loading,
    error,
    isConnected,
    lastUpdated,
    refreshMetrics,
    triggerAction
  };
}

