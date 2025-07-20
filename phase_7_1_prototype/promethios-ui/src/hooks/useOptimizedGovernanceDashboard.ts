import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { optimizedDataBridge } from '../services/OptimizedExistingDataBridge';

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
    lastCheck: string;
    uptime: string;
  };
  recentActivity: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
  }>;
  lastUpdated: string;
}

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'down';
  components: {
    governanceCore: boolean;
    trustMetrics: boolean;
    emotionalVeritas: boolean;
    eventBus: boolean;
    storage: boolean;
  };
  lastCheck: string;
  uptime: string;
  responseTime: string;
}

export interface BackendHealthStatus {
  status: 'operational' | 'degraded' | 'down';
  services: {
    database: 'operational' | 'degraded' | 'down';
    cache: 'operational' | 'degraded' | 'down';
    eventBus: 'operational' | 'degraded' | 'down';
  };
  lastCheck: string;
}

export function useOptimizedGovernanceDashboard() {
  const { currentUser } = useAuth();
  const mountedRef = useRef(true);
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  /**
   * Refresh dashboard metrics with optimized caching and parallel loading
   */
  const refreshMetrics = useCallback(async () => {
    if (!currentUser?.uid || !mountedRef.current) return;

    try {
      setLoadingProgress(0);
      setCurrentStage(0);
      console.log(`🚀 useOptimizedGovernanceDashboard: Refreshing metrics for user: ${currentUser.uid}`);
      
      // Stage 1: Connecting to Firebase
      setLoadingProgress(25);
      setCurrentStage(0);
      await optimizedDataBridge.setCurrentUser(currentUser.uid);
      
      // Stage 2: Loading User Agents
      setLoadingProgress(50);
      setCurrentStage(1);
      
      // Stage 3: Calculating Metrics
      setLoadingProgress(75);
      setCurrentStage(2);
      
      // Get metrics and health data in parallel (from cache if available)
      const [metricsData, healthData] = await Promise.all([
        optimizedDataBridge.getDashboardMetrics(),
        optimizedDataBridge.getSystemHealth()
      ]);

      // Stage 4: Preparing Dashboard
      setLoadingProgress(100);
      setCurrentStage(3);

      if (mountedRef.current) {
        setMetrics(metricsData);
        setHealth(healthData);
        setIsConnected(true);
        setError(null);
        setLastUpdated(new Date());
        console.log(`✅ Optimized dashboard metrics refreshed successfully`);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to refresh dashboard');
        setIsConnected(false);
        console.error('Optimized dashboard refresh error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingProgress(100);
      }
    }
  }, [currentUser?.uid]);

  /**
   * Trigger governance action with cache invalidation
   */
  const triggerAction = useCallback(async (action: string, params: any = {}) => {
    if (!currentUser?.uid) return false;

    try {
      console.log(`🎯 Triggering optimized action: ${action}`, params);
      const success = await optimizedDataBridge.triggerAction(action, params);
      
      if (success) {
        // Refresh metrics after successful action (cache will be invalidated)
        await refreshMetrics();
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Optimized action failed: ${action}`, error);
      return false;
    }
  }, [currentUser?.uid, refreshMetrics]);

  // Initial load with performance monitoring
  useEffect(() => {
    if (currentUser?.uid) {
      const startTime = Date.now();
      console.log('🚀 useOptimizedGovernanceDashboard: Initial load for user:', currentUser.uid);
      
      refreshMetrics().then(() => {
        const loadTime = Date.now() - startTime;
        console.log(`⚡ Optimized dashboard loaded in ${loadTime}ms`);
      });
    } else {
      setLoading(false);
    }
  }, [currentUser?.uid, refreshMetrics]);

  // Smart periodic refresh - only if not cached
  useEffect(() => {
    if (!currentUser?.uid) return;

    const interval = setInterval(() => {
      if (mountedRef.current) {
        console.log('🔄 Smart periodic dashboard refresh (cache-aware)');
        refreshMetrics();
      }
    }, 30000); // 30 seconds

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
    loadingProgress,
    currentStage,
    refreshMetrics,
    triggerAction
  };
}

