/**
 * Agent Trust Boundary React Hook
 * 
 * React hook for managing agent trust boundary operations including queries,
 * collaboration discovery, and real-time updates. Provides state management
 * and error handling for agent-facing trust boundary functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  agentTrustBoundaryApiService, 
  AgentAuthenticationRequest, 
  AgentAuthenticationResponse,
  TrustBoundaryQueryRequest,
  CollaborationDiscoveryRequest,
  CollaborationRecommendation,
  TrustVerificationRequest,
  TrustVerificationResponse,
  TrustBoundarySubscription
} from '../services/agentTrustBoundaryApiService';
import { 
  AgentTrustQueryResponse, 
  AgentTrustBoundary, 
  TrustBoundaryAlert 
} from '../extensions/AgentTrustBoundaryExtension';

interface UseAgentTrustBoundaryState {
  // Authentication state
  authenticated: boolean;
  sessionToken: string | null;
  permissions: {
    can_query_trust: boolean;
    can_discover_collaborators: boolean;
    can_receive_updates: boolean;
    query_rate_limit: number;
  } | null;
  
  // Query state
  trustBoundaries: AgentTrustBoundary[];
  queryLoading: boolean;
  queryError: string | null;
  lastQueryResponse: AgentTrustQueryResponse | null;
  
  // Collaboration discovery state
  collaborationRecommendations: CollaborationRecommendation[];
  discoveryLoading: boolean;
  discoveryError: string | null;
  
  // Trust verification state
  verificationResults: Map<string, TrustVerificationResponse>;
  verificationLoading: boolean;
  verificationError: string | null;
  
  // Subscription state
  activeSubscriptions: TrustBoundarySubscription[];
  subscriptionLoading: boolean;
  subscriptionError: string | null;
  pendingAlerts: TrustBoundaryAlert[];
  
  // Configuration state
  trustConfiguration: any;
  configurationLoading: boolean;
  configurationError: string | null;
}

interface UseAgentTrustBoundaryActions {
  // Authentication actions
  authenticateAgent: (request: AgentAuthenticationRequest) => Promise<boolean>;
  clearAuthentication: () => void;
  
  // Query actions
  queryTrustBoundaries: (query: Omit<TrustBoundaryQueryRequest, 'session_token'>) => Promise<AgentTrustQueryResponse | null>;
  clearTrustBoundaries: () => void;
  
  // Collaboration discovery actions
  discoverCollaborationPartners: (request: Omit<CollaborationDiscoveryRequest, 'session_token'>) => Promise<CollaborationRecommendation[]>;
  clearCollaborationRecommendations: () => void;
  
  // Trust verification actions
  verifyTrustRelationship: (request: Omit<TrustVerificationRequest, 'session_token'>) => Promise<TrustVerificationResponse | null>;
  clearVerificationResults: () => void;
  
  // Subscription actions
  subscribeToTrustUpdates: (
    agentId: string,
    subscriptionType: 'trust_changes' | 'collaboration_opportunities' | 'risk_alerts' | 'all',
    deliveryMethod?: 'webhook' | 'polling' | 'websocket',
    webhookUrl?: string
  ) => Promise<TrustBoundarySubscription | null>;
  unsubscribeFromTrustUpdates: (subscriptionId: string) => Promise<void>;
  getPendingAlerts: (subscriptionId: string) => Promise<TrustBoundaryAlert[]>;
  clearPendingAlerts: () => void;
  
  // Configuration actions
  getTrustConfiguration: (agentId: string) => Promise<any>;
  updateTrustConfiguration: (agentId: string, updates: any) => Promise<void>;
  
  // Utility actions
  refreshAll: () => Promise<void>;
  clearAllErrors: () => void;
}

export interface UseAgentTrustBoundaryOptions {
  autoRefreshInterval?: number; // milliseconds
  enableRealTimeUpdates?: boolean;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

export function useAgentTrustBoundary(
  options: UseAgentTrustBoundaryOptions = {}
): [UseAgentTrustBoundaryState, UseAgentTrustBoundaryActions] {
  const {
    autoRefreshInterval = 30000, // 30 seconds
    enableRealTimeUpdates = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  // State management
  const [state, setState] = useState<UseAgentTrustBoundaryState>({
    authenticated: false,
    sessionToken: null,
    permissions: null,
    trustBoundaries: [],
    queryLoading: false,
    queryError: null,
    lastQueryResponse: null,
    collaborationRecommendations: [],
    discoveryLoading: false,
    discoveryError: null,
    verificationResults: new Map(),
    verificationLoading: false,
    verificationError: null,
    activeSubscriptions: [],
    subscriptionLoading: false,
    subscriptionError: null,
    pendingAlerts: [],
    trustConfiguration: null,
    configurationLoading: false,
    configurationError: null
  });

  // Refs for cleanup and intervals
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Utility function for retrying operations
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    retries: number = maxRetries
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return withRetry(operation, retries - 1);
      }
      throw error;
    }
  }, [maxRetries, retryDelay]);

  // Authentication actions
  const authenticateAgent = useCallback(async (request: AgentAuthenticationRequest): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, queryLoading: true, queryError: null }));
      
      const response = await withRetry(() => 
        agentTrustBoundaryApiService.authenticateAgent(request)
      );

      if (response.authenticated) {
        setState(prev => ({
          ...prev,
          authenticated: true,
          sessionToken: response.session_token,
          permissions: response.permissions,
          queryLoading: false
        }));
        
        // Start auto-refresh if enabled
        if (autoRefreshInterval > 0) {
          startAutoRefresh();
        }
        
        return true;
      } else {
        setState(prev => ({
          ...prev,
          authenticated: false,
          sessionToken: null,
          permissions: null,
          queryLoading: false,
          queryError: 'Authentication failed'
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        queryLoading: false,
        queryError: error instanceof Error ? error.message : 'Authentication failed'
      }));
      return false;
    }
  }, [autoRefreshInterval, withRetry]);

  const clearAuthentication = useCallback(() => {
    setState(prev => ({
      ...prev,
      authenticated: false,
      sessionToken: null,
      permissions: null,
      trustBoundaries: [],
      collaborationRecommendations: [],
      verificationResults: new Map(),
      activeSubscriptions: [],
      pendingAlerts: [],
      trustConfiguration: null
    }));
    
    // Clear intervals
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (alertPollingIntervalRef.current) {
      clearInterval(alertPollingIntervalRef.current);
      alertPollingIntervalRef.current = null;
    }
  }, []);

  // Query actions
  const queryTrustBoundaries = useCallback(async (
    query: Omit<TrustBoundaryQueryRequest, 'session_token'>
  ): Promise<AgentTrustQueryResponse | null> => {
    if (!state.sessionToken) {
      setState(prev => ({ ...prev, queryError: 'Not authenticated' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, queryLoading: true, queryError: null }));
      
      const response = await withRetry(() =>
        agentTrustBoundaryApiService.queryTrustBoundaries({
          ...query,
          session_token: state.sessionToken!
        })
      );

      setState(prev => ({
        ...prev,
        trustBoundaries: response.boundaries,
        lastQueryResponse: response,
        queryLoading: false
      }));

      return response;
    } catch (error) {
      setState(prev => ({
        ...prev,
        queryLoading: false,
        queryError: error instanceof Error ? error.message : 'Query failed'
      }));
      return null;
    }
  }, [state.sessionToken, withRetry]);

  const clearTrustBoundaries = useCallback(() => {
    setState(prev => ({
      ...prev,
      trustBoundaries: [],
      lastQueryResponse: null,
      queryError: null
    }));
  }, []);

  // Collaboration discovery actions
  const discoverCollaborationPartners = useCallback(async (
    request: Omit<CollaborationDiscoveryRequest, 'session_token'>
  ): Promise<CollaborationRecommendation[]> => {
    if (!state.sessionToken) {
      setState(prev => ({ ...prev, discoveryError: 'Not authenticated' }));
      return [];
    }

    try {
      setState(prev => ({ ...prev, discoveryLoading: true, discoveryError: null }));
      
      const recommendations = await withRetry(() =>
        agentTrustBoundaryApiService.discoverCollaborationPartners({
          ...request,
          session_token: state.sessionToken!
        })
      );

      setState(prev => ({
        ...prev,
        collaborationRecommendations: recommendations,
        discoveryLoading: false
      }));

      return recommendations;
    } catch (error) {
      setState(prev => ({
        ...prev,
        discoveryLoading: false,
        discoveryError: error instanceof Error ? error.message : 'Discovery failed'
      }));
      return [];
    }
  }, [state.sessionToken, withRetry]);

  const clearCollaborationRecommendations = useCallback(() => {
    setState(prev => ({
      ...prev,
      collaborationRecommendations: [],
      discoveryError: null
    }));
  }, []);

  // Trust verification actions
  const verifyTrustRelationship = useCallback(async (
    request: Omit<TrustVerificationRequest, 'session_token'>
  ): Promise<TrustVerificationResponse | null> => {
    if (!state.sessionToken) {
      setState(prev => ({ ...prev, verificationError: 'Not authenticated' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, verificationLoading: true, verificationError: null }));
      
      const response = await withRetry(() =>
        agentTrustBoundaryApiService.verifyTrustRelationship({
          ...request,
          session_token: state.sessionToken!
        })
      );

      setState(prev => {
        const newResults = new Map(prev.verificationResults);
        newResults.set(request.target_agent_id, response);
        return {
          ...prev,
          verificationResults: newResults,
          verificationLoading: false
        };
      });

      return response;
    } catch (error) {
      setState(prev => ({
        ...prev,
        verificationLoading: false,
        verificationError: error instanceof Error ? error.message : 'Verification failed'
      }));
      return null;
    }
  }, [state.sessionToken, withRetry]);

  const clearVerificationResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      verificationResults: new Map(),
      verificationError: null
    }));
  }, []);

  // Subscription actions
  const subscribeToTrustUpdates = useCallback(async (
    agentId: string,
    subscriptionType: 'trust_changes' | 'collaboration_opportunities' | 'risk_alerts' | 'all',
    deliveryMethod: 'webhook' | 'polling' | 'websocket' = 'polling',
    webhookUrl?: string
  ): Promise<TrustBoundarySubscription | null> => {
    if (!state.sessionToken) {
      setState(prev => ({ ...prev, subscriptionError: 'Not authenticated' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, subscriptionLoading: true, subscriptionError: null }));
      
      const subscription = await withRetry(() =>
        agentTrustBoundaryApiService.subscribeToTrustUpdates(
          agentId,
          subscriptionType,
          state.sessionToken!,
          deliveryMethod,
          webhookUrl
        )
      );

      setState(prev => ({
        ...prev,
        activeSubscriptions: [...prev.activeSubscriptions, subscription],
        subscriptionLoading: false
      }));

      // Start polling for alerts if using polling delivery
      if (deliveryMethod === 'polling' && enableRealTimeUpdates) {
        startAlertPolling(subscription.subscription_id);
      }

      return subscription;
    } catch (error) {
      setState(prev => ({
        ...prev,
        subscriptionLoading: false,
        subscriptionError: error instanceof Error ? error.message : 'Subscription failed'
      }));
      return null;
    }
  }, [state.sessionToken, enableRealTimeUpdates, withRetry]);

  const unsubscribeFromTrustUpdates = useCallback(async (subscriptionId: string): Promise<void> => {
    if (!state.sessionToken) {
      setState(prev => ({ ...prev, subscriptionError: 'Not authenticated' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, subscriptionLoading: true, subscriptionError: null }));
      
      await withRetry(() =>
        agentTrustBoundaryApiService.unsubscribeFromTrustUpdates(subscriptionId, state.sessionToken!)
      );

      setState(prev => ({
        ...prev,
        activeSubscriptions: prev.activeSubscriptions.filter(sub => sub.subscription_id !== subscriptionId),
        subscriptionLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        subscriptionLoading: false,
        subscriptionError: error instanceof Error ? error.message : 'Unsubscription failed'
      }));
    }
  }, [state.sessionToken, withRetry]);

  const getPendingAlerts = useCallback(async (subscriptionId: string): Promise<TrustBoundaryAlert[]> => {
    if (!state.sessionToken) {
      return [];
    }

    try {
      const alerts = await withRetry(() =>
        agentTrustBoundaryApiService.getPendingAlerts(subscriptionId, state.sessionToken!)
      );

      setState(prev => ({
        ...prev,
        pendingAlerts: [...prev.pendingAlerts, ...alerts]
      }));

      return alerts;
    } catch (error) {
      console.error('Failed to get pending alerts:', error);
      return [];
    }
  }, [state.sessionToken, withRetry]);

  const clearPendingAlerts = useCallback(() => {
    setState(prev => ({ ...prev, pendingAlerts: [] }));
  }, []);

  // Configuration actions
  const getTrustConfiguration = useCallback(async (agentId: string): Promise<any> => {
    if (!state.sessionToken) {
      setState(prev => ({ ...prev, configurationError: 'Not authenticated' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, configurationLoading: true, configurationError: null }));
      
      const configuration = await withRetry(() =>
        agentTrustBoundaryApiService.getAgentTrustConfiguration(agentId, state.sessionToken!)
      );

      setState(prev => ({
        ...prev,
        trustConfiguration: configuration,
        configurationLoading: false
      }));

      return configuration;
    } catch (error) {
      setState(prev => ({
        ...prev,
        configurationLoading: false,
        configurationError: error instanceof Error ? error.message : 'Configuration retrieval failed'
      }));
      return null;
    }
  }, [state.sessionToken, withRetry]);

  const updateTrustConfiguration = useCallback(async (agentId: string, updates: any): Promise<void> => {
    if (!state.sessionToken) {
      setState(prev => ({ ...prev, configurationError: 'Not authenticated' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, configurationLoading: true, configurationError: null }));
      
      await withRetry(() =>
        agentTrustBoundaryApiService.updateAgentTrustConfiguration(agentId, updates, state.sessionToken!)
      );

      // Refresh configuration
      await getTrustConfiguration(agentId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        configurationLoading: false,
        configurationError: error instanceof Error ? error.message : 'Configuration update failed'
      }));
    }
  }, [state.sessionToken, getTrustConfiguration, withRetry]);

  // Utility actions
  const refreshAll = useCallback(async (): Promise<void> => {
    // Refresh all data if authenticated
    if (state.authenticated && state.sessionToken) {
      // This would refresh all relevant data
      console.log('Refreshing all trust boundary data');
    }
  }, [state.authenticated, state.sessionToken]);

  const clearAllErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      queryError: null,
      discoveryError: null,
      verificationError: null,
      subscriptionError: null,
      configurationError: null
    }));
  }, []);

  // Auto-refresh functionality
  const startAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      refreshAll();
    }, autoRefreshInterval);
  }, [refreshAll, autoRefreshInterval]);

  // Alert polling functionality
  const startAlertPolling = useCallback((subscriptionId: string) => {
    if (alertPollingIntervalRef.current) {
      clearInterval(alertPollingIntervalRef.current);
    }
    
    alertPollingIntervalRef.current = setInterval(() => {
      getPendingAlerts(subscriptionId);
    }, 10000); // Poll every 10 seconds
  }, [getPendingAlerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (alertPollingIntervalRef.current) {
        clearInterval(alertPollingIntervalRef.current);
      }
    };
  }, []);

  // Actions object
  const actions: UseAgentTrustBoundaryActions = {
    authenticateAgent,
    clearAuthentication,
    queryTrustBoundaries,
    clearTrustBoundaries,
    discoverCollaborationPartners,
    clearCollaborationRecommendations,
    verifyTrustRelationship,
    clearVerificationResults,
    subscribeToTrustUpdates,
    unsubscribeFromTrustUpdates,
    getPendingAlerts,
    clearPendingAlerts,
    getTrustConfiguration,
    updateTrustConfiguration,
    refreshAll,
    clearAllErrors
  };

  return [state, actions];
}

