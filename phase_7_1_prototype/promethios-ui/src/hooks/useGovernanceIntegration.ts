/**
 * Governance Integration Hook
 * 
 * Unified hook for all governance pages to ensure consistent integration with:
 * - Notification system
 * - Real-time updates
 * - Error handling
 * - Loading states
 * - Navigation
 * - Data synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { governanceNotificationExtension, GovernanceNotification } from '../extensions/GovernanceNotificationExtension';
import { useNotificationBackend } from './useNotificationBackend';

export interface GovernanceIntegrationConfig {
  page_type: 'policies' | 'violations' | 'trust-metrics' | 'reports' | 'compliance';
  enable_real_time: boolean;
  enable_notifications: boolean;
  auto_refresh_interval?: number; // seconds
  error_retry_attempts?: number;
  error_retry_delay?: number; // milliseconds
}

export interface GovernanceState {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  realTimeConnected: boolean;
  notificationsEnabled: boolean;
  autoRefreshEnabled: boolean;
}

export interface GovernanceActions {
  // Data management
  refreshData: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Real-time controls
  enableRealTime: () => void;
  disableRealTime: () => void;
  toggleRealTime: () => void;
  
  // Notification controls
  enableNotifications: () => void;
  disableNotifications: () => void;
  toggleNotifications: () => void;
  addNotification: (notification: Omit<GovernanceNotification, 'id' | 'timestamp' | 'read' | 'archived' | 'escalated'>) => void;
  
  // Auto-refresh controls
  enableAutoRefresh: (interval?: number) => void;
  disableAutoRefresh: () => void;
  toggleAutoRefresh: () => void;
  
  // Error handling
  handleError: (error: Error | string, context?: string) => void;
  retryLastOperation: () => Promise<void>;
  
  // Navigation helpers
  navigateToPolicy: (policyId: string) => void;
  navigateToViolation: (violationId: string) => void;
  navigateToAgent: (agentId: string) => void;
  navigateToReport: (reportId: string) => void;
  
  // Data synchronization
  syncWithBackend: () => Promise<void>;
  invalidateCache: () => void;
  
  // Bulk operations
  performBulkOperation: (operation: string, items: string[], options?: any) => Promise<void>;
}

export interface GovernanceIntegrationReturn {
  state: GovernanceState;
  actions: GovernanceActions;
  config: GovernanceIntegrationConfig;
  updateConfig: (newConfig: Partial<GovernanceIntegrationConfig>) => void;
}

export const useGovernanceIntegration = (
  initialConfig: GovernanceIntegrationConfig,
  dataLoader?: () => Promise<void>
): GovernanceIntegrationReturn => {
  
  // Configuration state
  const [config, setConfig] = useState<GovernanceIntegrationConfig>({
    auto_refresh_interval: 30,
    error_retry_attempts: 3,
    error_retry_delay: 1000,
    ...initialConfig
  });

  // Governance state
  const [state, setState] = useState<GovernanceState>({
    loading: false,
    error: null,
    lastUpdated: null,
    realTimeConnected: false,
    notificationsEnabled: config.enable_notifications,
    autoRefreshEnabled: false
  });

  // Refs for cleanup and retry logic
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const retryAttempts = useRef(0);
  const lastOperation = useRef<(() => Promise<void>) | null>(null);
  const mountedRef = useRef(true);

  // Notification backend integration
  const { addNotification: addBaseNotification } = useNotificationBackend();

  // Initialize governance integration
  useEffect(() => {
    const initializeIntegration = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Initialize governance notification system
        if (config.enable_notifications) {
          const initialized = await governanceNotificationExtension.initialize({
            enable_real_time: config.enable_real_time,
            enable_email_notifications: true,
            enable_slack_integration: false
          });

          if (initialized) {
            setState(prev => ({ 
              ...prev, 
              notificationsEnabled: true,
              realTimeConnected: config.enable_real_time
            }));
          }
        }

        // Load initial data
        if (dataLoader) {
          await dataLoader();
          lastOperation.current = dataLoader;
        }

        setState(prev => ({ 
          ...prev, 
          loading: false, 
          lastUpdated: new Date(),
          error: null
        }));

        // Setup auto-refresh if enabled
        if (config.auto_refresh_interval && config.auto_refresh_interval > 0) {
          enableAutoRefresh(config.auto_refresh_interval);
        }

      } catch (error) {
        console.error('Failed to initialize governance integration:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Initialization failed'
        }));
      }
    };

    initializeIntegration();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
      governanceNotificationExtension.cleanup();
    };
  }, [config.enable_notifications, config.enable_real_time]);

  // Data refresh function
  const refreshData = useCallback(async () => {
    if (!dataLoader || !mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await dataLoader();
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        lastUpdated: new Date(),
        error: null
      }));
      retryAttempts.current = 0;
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh data'
      }));
    }
  }, [dataLoader]);

  // Error handling
  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    setState(prev => ({ ...prev, error: fullMessage, loading: false }));
    
    // Add error notification
    addBaseNotification({
      id: `error_${Date.now()}`,
      type: 'error',
      title: 'Governance System Error',
      message: fullMessage,
      timestamp: new Date().toISOString(),
      read: false,
      actions: [
        {
          label: 'Retry',
          action: retryLastOperation
        },
        {
          label: 'Refresh Page',
          action: () => window.location.reload()
        }
      ]
    });
  }, [addBaseNotification]);

  // Retry last operation
  const retryLastOperation = useCallback(async () => {
    if (!lastOperation.current || retryAttempts.current >= (config.error_retry_attempts || 3)) {
      return;
    }

    try {
      retryAttempts.current++;
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Add delay before retry
      await new Promise(resolve => setTimeout(resolve, config.error_retry_delay || 1000));
      
      await lastOperation.current();
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        lastUpdated: new Date(),
        error: null
      }));
      retryAttempts.current = 0;
      
    } catch (error) {
      console.error('Retry failed:', error);
      handleError(error instanceof Error ? error : 'Retry operation failed');
    }
  }, [config.error_retry_attempts, config.error_retry_delay, handleError]);

  // Auto-refresh controls
  const enableAutoRefresh = useCallback((interval?: number) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }

    const refreshInterval = interval || config.auto_refresh_interval || 30;
    autoRefreshInterval.current = setInterval(refreshData, refreshInterval * 1000);
    
    setState(prev => ({ ...prev, autoRefreshEnabled: true }));
  }, [config.auto_refresh_interval, refreshData]);

  const disableAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
    setState(prev => ({ ...prev, autoRefreshEnabled: false }));
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    if (state.autoRefreshEnabled) {
      disableAutoRefresh();
    } else {
      enableAutoRefresh();
    }
  }, [state.autoRefreshEnabled, enableAutoRefresh, disableAutoRefresh]);

  // Real-time controls
  const enableRealTime = useCallback(() => {
    setState(prev => ({ ...prev, realTimeConnected: true }));
    setConfig(prev => ({ ...prev, enable_real_time: true }));
  }, []);

  const disableRealTime = useCallback(() => {
    setState(prev => ({ ...prev, realTimeConnected: false }));
    setConfig(prev => ({ ...prev, enable_real_time: false }));
  }, []);

  const toggleRealTime = useCallback(() => {
    if (state.realTimeConnected) {
      disableRealTime();
    } else {
      enableRealTime();
    }
  }, [state.realTimeConnected, enableRealTime, disableRealTime]);

  // Notification controls
  const enableNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notificationsEnabled: true }));
    setConfig(prev => ({ ...prev, enable_notifications: true }));
  }, []);

  const disableNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notificationsEnabled: false }));
    setConfig(prev => ({ ...prev, enable_notifications: false }));
  }, []);

  const toggleNotifications = useCallback(() => {
    if (state.notificationsEnabled) {
      disableNotifications();
    } else {
      enableNotifications();
    }
  }, [state.notificationsEnabled, enableNotifications, disableNotifications]);

  // Add governance notification
  const addNotification = useCallback((notification: Omit<GovernanceNotification, 'id' | 'timestamp' | 'read' | 'archived' | 'escalated'>) => {
    const fullNotification: GovernanceNotification = {
      ...notification,
      id: `${config.page_type}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      archived: false,
      escalated: false
    };

    governanceNotificationExtension.addNotification(fullNotification);
  }, [config.page_type]);

  // Navigation helpers
  const navigateToPolicy = useCallback((policyId: string) => {
    window.location.href = `/governance/policies?policy=${policyId}`;
  }, []);

  const navigateToViolation = useCallback((violationId: string) => {
    window.location.href = `/governance/violations?violation=${violationId}`;
  }, []);

  const navigateToAgent = useCallback((agentId: string) => {
    window.location.href = `/governance/trust-metrics?agent=${agentId}`;
  }, []);

  const navigateToReport = useCallback((reportId: string) => {
    window.location.href = `/governance/reports?report=${reportId}`;
  }, []);

  // Data synchronization
  const syncWithBackend = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Sync with backend APIs
      const syncPromises = [];
      
      if (config.page_type === 'policies') {
        syncPromises.push(fetch('/api/promethios-policy/sync', { method: 'POST' }));
      } else if (config.page_type === 'violations') {
        syncPromises.push(fetch('/api/agent-metrics/violations/sync', { method: 'POST' }));
      } else if (config.page_type === 'trust-metrics') {
        syncPromises.push(fetch('/api/trust-metrics/sync', { method: 'POST' }));
      } else if (config.page_type === 'reports') {
        syncPromises.push(fetch('/api/reporting/sync', { method: 'POST' }));
      }
      
      await Promise.all(syncPromises);
      await refreshData();
      
      addNotification({
        type: 'compliance',
        severity: 'low',
        title: 'Data Synchronized',
        message: `${config.page_type} data has been synchronized with backend systems`,
        source: 'DataSync'
      });
      
    } catch (error) {
      handleError(error instanceof Error ? error : 'Synchronization failed', 'Data Sync');
    }
  }, [config.page_type, refreshData, addNotification, handleError]);

  // Cache invalidation
  const invalidateCache = useCallback(() => {
    // Clear local storage cache
    const cacheKeys = [
      'governance_policies',
      'governance_violations', 
      'governance_trust_metrics',
      'governance_reports',
      'governance_notifications'
    ];
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Refresh data
    refreshData();
    
    addNotification({
      type: 'compliance',
      severity: 'low',
      title: 'Cache Cleared',
      message: 'Local cache has been cleared and data refreshed',
      source: 'CacheManagement'
    });
  }, [refreshData, addNotification]);

  // Bulk operations
  const performBulkOperation = useCallback(async (operation: string, items: string[], options?: any) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await fetch(`/api/${config.page_type}/bulk/${operation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, options })
      });
      
      if (!response.ok) {
        throw new Error(`Bulk operation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      addNotification({
        type: config.page_type as any,
        severity: 'low',
        title: 'Bulk Operation Complete',
        message: `${operation} completed for ${items.length} items`,
        source: 'BulkOperations',
        metadata: { operation, count: items.length, result }
      });
      
      await refreshData();
      
    } catch (error) {
      handleError(error instanceof Error ? error : 'Bulk operation failed', 'Bulk Operations');
    }
  }, [config.page_type, refreshData, addNotification, handleError]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<GovernanceIntegrationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  // Return governance integration interface
  return {
    state,
    actions: {
      refreshData,
      clearError,
      setLoading,
      enableRealTime,
      disableRealTime,
      toggleRealTime,
      enableNotifications,
      disableNotifications,
      toggleNotifications,
      addNotification,
      enableAutoRefresh,
      disableAutoRefresh,
      toggleAutoRefresh,
      handleError,
      retryLastOperation,
      navigateToPolicy,
      navigateToViolation,
      navigateToAgent,
      navigateToReport,
      syncWithBackend,
      invalidateCache,
      performBulkOperation
    },
    config,
    updateConfig
  };
};

