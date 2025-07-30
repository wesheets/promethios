/**
 * Optimized Lifecycle Dashboard Hook
 * 
 * Provides optimized data loading and caching for the Agent Lifecycle Dashboard.
 * Integrates with the existing performance optimization system.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { agentLifecycleService, AgentLifecycleEvent, AgentLifecycleSummary } from '../services/AgentLifecycleService';
import { universalDataCache } from '../services/UniversalDataCache';

export interface LifecycleDashboardMetrics {
  summary: {
    totalAgents: number;
    testAgents: number;
    productionAgents: number;
    deployedAgents: number;
    recentEvents: AgentLifecycleEvent[];
  };
  performance: {
    averageCreationTime: number;
    averageWrappingTime: number;
    averageDeploymentTime: number;
    successRate: number;
  };
  trends: {
    creationsThisWeek: number;
    deploymentsThisWeek: number;
    growthRate: number;
  };
  systemHealth: {
    status: 'operational' | 'degraded' | 'down';
    lastCheck: string;
    lifecycleServiceHealth: boolean;
    storageHealth: boolean;
  };
  lastUpdated: string;
}

export interface LifecycleDashboardState {
  metrics: LifecycleDashboardMetrics | null;
  agentHistory: AgentLifecycleEvent[];
  isLoading: boolean;
  error: string | null;
  cacheAge: number;
  lastRefresh: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'lifecycle_dashboard';

/**
 * Optimized hook for Agent Lifecycle Dashboard data
 */
export const useOptimizedLifecycleDashboard = (agentId?: string) => {
  const { currentUser } = useAuth();
  const [state, setState] = useState<LifecycleDashboardState>({
    metrics: null,
    agentHistory: [],
    isLoading: true,
    error: null,
    cacheAge: 0,
    lastRefresh: ''
  });

  const loadingRef = useRef(false);
  const cacheKeyRef = useRef('');

  // Generate cache key based on user and agent
  const getCacheKey = useCallback(() => {
    const baseKey = `${CACHE_KEY_PREFIX}_${currentUser?.uid || 'anonymous'}`;
    return agentId ? `${baseKey}_agent_${agentId}` : `${baseKey}_summary`;
  }, [currentUser?.uid, agentId]);

  // Load data from cache or service
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (!currentUser?.uid || loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      const cacheKey = getCacheKey();
      cacheKeyRef.current = cacheKey;

      console.log('🔄 [LifecycleDashboard] Loading dashboard data...', { agentId, forceRefresh });

      // Try to load from cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = await universalDataCache.get(cacheKey);
        if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
          console.log('✅ [LifecycleDashboard] Using cached data', { 
            cacheAge: Date.now() - cachedData.timestamp,
            agentId 
          });
          
          setState(prev => ({
            ...prev,
            ...cachedData.data,
            isLoading: false,
            cacheAge: Date.now() - cachedData.timestamp,
            lastRefresh: new Date(cachedData.timestamp).toLocaleTimeString()
          }));
          return;
        }
      }

      // Load fresh data
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      let metrics: LifecycleDashboardMetrics | null = null;
      let agentHistory: AgentLifecycleEvent[] = [];

      if (agentId) {
        // Load specific agent lifecycle
        console.log('📊 [LifecycleDashboard] Loading agent-specific data:', agentId);
        agentHistory = await agentLifecycleService.getAgentLifecycleHistory(agentId);
        
        // Generate metrics for specific agent
        metrics = generateAgentMetrics(agentHistory, agentId);
      } else {
        // Load user summary with optimized loading
        console.log('📊 [LifecycleDashboard] Loading user summary data');
        
        // Use lazy loading - defer heavy operations
        const summary = await agentLifecycleService.getUserAgentLifecycleSummary(currentUser.uid);
        metrics = generateSummaryMetrics(summary);
        agentHistory = summary.recentEvents || [];
      }

      const newState = {
        metrics,
        agentHistory,
        isLoading: false,
        error: null,
        cacheAge: 0,
        lastRefresh: new Date().toLocaleTimeString()
      };

      // Cache the results
      await universalDataCache.set(cacheKey, newState, CACHE_DURATION);
      
      setState(prev => ({ ...prev, ...newState }));
      
      console.log('✅ [LifecycleDashboard] Data loaded and cached successfully', {
        agentId,
        metricsLoaded: !!metrics,
        eventsCount: agentHistory.length
      });

    } catch (error) {
      console.error('❌ [LifecycleDashboard] Failed to load dashboard data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [currentUser?.uid, agentId, getCacheKey]);

  // Generate metrics for specific agent
  const generateAgentMetrics = (history: AgentLifecycleEvent[], agentId: string): LifecycleDashboardMetrics => {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const createdEvent = history.find(e => e.eventType === 'created');
    const wrappedEvent = history.find(e => e.eventType === 'wrapped');
    const deployedEvent = history.find(e => e.eventType === 'deployed');

    // Calculate timing metrics
    const creationTime = createdEvent ? new Date(createdEvent.timestamp).getTime() : 0;
    const wrappingTime = wrappedEvent && createdEvent ? 
      new Date(wrappedEvent.timestamp).getTime() - new Date(createdEvent.timestamp).getTime() : 0;
    const deploymentTime = deployedEvent && wrappedEvent ? 
      new Date(deployedEvent.timestamp).getTime() - new Date(wrappedEvent.timestamp).getTime() : 0;

    return {
      summary: {
        totalAgents: 1,
        testAgents: createdEvent && !wrappedEvent ? 1 : 0,
        productionAgents: wrappedEvent ? 1 : 0,
        deployedAgents: deployedEvent ? 1 : 0,
        recentEvents: history.slice(0, 10)
      },
      performance: {
        averageCreationTime: 0, // Single agent, no average
        averageWrappingTime: wrappingTime,
        averageDeploymentTime: deploymentTime,
        successRate: deployedEvent ? 100 : (wrappedEvent ? 66 : (createdEvent ? 33 : 0))
      },
      trends: {
        creationsThisWeek: createdEvent && new Date(createdEvent.timestamp).getTime() > weekAgo ? 1 : 0,
        deploymentsThisWeek: deployedEvent && new Date(deployedEvent.timestamp).getTime() > weekAgo ? 1 : 0,
        growthRate: 0 // Single agent, no growth rate
      },
      systemHealth: {
        status: 'operational',
        lastCheck: new Date().toISOString(),
        lifecycleServiceHealth: true,
        storageHealth: true
      },
      lastUpdated: new Date().toISOString()
    };
  };

  // Generate metrics for user summary
  const generateSummaryMetrics = (summary: AgentLifecycleSummary): LifecycleDashboardMetrics => {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const recentEvents = summary.recentEvents || [];
    const creationsThisWeek = recentEvents.filter(e => 
      e.eventType === 'created' && new Date(e.timestamp).getTime() > weekAgo
    ).length;
    const deploymentsThisWeek = recentEvents.filter(e => 
      e.eventType === 'deployed' && new Date(e.timestamp).getTime() > weekAgo
    ).length;

    // Calculate performance metrics
    const createdEvents = recentEvents.filter(e => e.eventType === 'created');
    const wrappedEvents = recentEvents.filter(e => e.eventType === 'wrapped');
    const deployedEvents = recentEvents.filter(e => e.eventType === 'deployed');

    const successRate = createdEvents.length > 0 ? 
      (deployedEvents.length / createdEvents.length) * 100 : 0;

    return {
      summary: {
        totalAgents: summary.totalAgents,
        testAgents: summary.testAgents,
        productionAgents: summary.productionAgents,
        deployedAgents: summary.deployedAgents,
        recentEvents: recentEvents.slice(0, 10)
      },
      performance: {
        averageCreationTime: 0, // TODO: Calculate from event timings
        averageWrappingTime: 0, // TODO: Calculate from event timings
        averageDeploymentTime: 0, // TODO: Calculate from event timings
        successRate
      },
      trends: {
        creationsThisWeek,
        deploymentsThisWeek,
        growthRate: creationsThisWeek > 0 ? (deploymentsThisWeek / creationsThisWeek) * 100 : 0
      },
      systemHealth: {
        status: 'operational',
        lastCheck: new Date().toISOString(),
        lifecycleServiceHealth: true,
        storageHealth: true
      },
      lastUpdated: new Date().toISOString()
    };
  };

  // Refresh data manually
  const refreshData = useCallback(() => {
    console.log('🔄 [LifecycleDashboard] Manual refresh requested');
    loadDashboardData(true);
  }, [loadDashboardData]);

  // Clear cache
  const clearCache = useCallback(async () => {
    const cacheKey = getCacheKey();
    await universalDataCache.delete(cacheKey);
    console.log('🗑️ [LifecycleDashboard] Cache cleared');
  }, [getCacheKey]);

  // Load data on mount and user change
  useEffect(() => {
    if (currentUser?.uid) {
      loadDashboardData();
    }
  }, [currentUser?.uid, agentId, loadDashboardData]);

  return {
    ...state,
    refreshData,
    clearCache,
    isOptimized: true,
    cacheKey: cacheKeyRef.current
  };
};

