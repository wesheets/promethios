/**
 * useObserverBackend Hook
 * 
 * React hook for managing observer agents with real backend integration.
 * Provides state management for observer registration, suggestions, trust metrics, and context awareness.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  observerBackendService,
  ObserverRegistration,
  ObserverSuggestion,
  TrustMetrics,
  ContextAwareness,
  ObserverConfiguration,
  RegistrationResponse,
  SuggestionsResponse
} from '../services/observerBackendService';

// Hook state interface
interface UseObserverBackendState {
  // Observer data
  observers: Array<Record<string, any>>;
  currentObserver: Record<string, any> | null;
  suggestions: ObserverSuggestion[];
  trustMetrics: TrustMetrics | null;
  contextAwareness: ContextAwareness | null;
  configuration: ObserverConfiguration | null;
  
  // Loading states
  loading: boolean;
  registering: boolean;
  generatingSuggestions: boolean;
  loadingMetrics: boolean;
  loadingContext: boolean;
  updatingConfig: boolean;
  
  // Error states
  error: string | null;
  registrationError: string | null;
  suggestionsError: string | null;
  metricsError: string | null;
  contextError: string | null;
  configError: string | null;
}

// Hook return interface
interface UseObserverBackendReturn extends UseObserverBackendState {
  // Actions
  registerObserver: (registration: ObserverRegistration) => Promise<RegistrationResponse>;
  generateSuggestions: (observerId: string, contextData: Record<string, any>) => Promise<SuggestionsResponse>;
  getSuggestions: (observerId: string, limit?: number, type?: string) => Promise<void>;
  getTrustMetrics: (observerId: string) => Promise<void>;
  getContextAwareness: (observerId: string) => Promise<void>;
  updateContext: (observerId: string, contextUpdate: Record<string, any>) => Promise<void>;
  getObserverConfig: (observerId: string) => Promise<void>;
  updateObserverConfig: (observerId: string, config: ObserverConfiguration) => Promise<void>;
  listObservers: (userId?: string, isActive?: boolean, limit?: number) => Promise<void>;
  deleteObserver: (observerId: string) => Promise<void>;
  setCurrentObserver: (observerId: string) => Promise<void>;
  clearError: () => void;
  refreshData: (observerId?: string) => Promise<void>;
}

/**
 * useObserverBackend Hook
 */
export const useObserverBackend = (
  autoLoadObservers: boolean = true,
  defaultObserverId?: string
): UseObserverBackendReturn => {
  // State
  const [state, setState] = useState<UseObserverBackendState>({
    observers: [],
    currentObserver: null,
    suggestions: [],
    trustMetrics: null,
    contextAwareness: null,
    configuration: null,
    loading: false,
    registering: false,
    generatingSuggestions: false,
    loadingMetrics: false,
    loadingContext: false,
    updatingConfig: false,
    error: null,
    registrationError: null,
    suggestionsError: null,
    metricsError: null,
    contextError: null,
    configError: null,
  });

  // Refs for cleanup
  const mountedRef = useRef(true);

  // Helper to update state safely
  const updateState = useCallback((updates: Partial<UseObserverBackendState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({
      error: null,
      registrationError: null,
      suggestionsError: null,
      metricsError: null,
      contextError: null,
      configError: null,
    });
  }, [updateState]);

  // Register observer
  const registerObserver = useCallback(async (registration: ObserverRegistration): Promise<RegistrationResponse> => {
    try {
      updateState({ registering: true, registrationError: null });
      
      const result = await observerBackendService.registerObserver(registration);
      
      // Refresh observers list
      await listObservers();
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register observer';
      updateState({ registrationError: errorMessage });
      throw error;
    } finally {
      updateState({ registering: false });
    }
  }, [updateState]);

  // Generate suggestions
  const generateSuggestions = useCallback(async (
    observerId: string,
    contextData: Record<string, any>
  ): Promise<SuggestionsResponse> => {
    try {
      updateState({ generatingSuggestions: true, suggestionsError: null });
      
      const result = await observerBackendService.generateSuggestions(observerId, contextData);
      
      // Update suggestions in state
      updateState({ suggestions: result.suggestions });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions';
      updateState({ suggestionsError: errorMessage });
      throw error;
    } finally {
      updateState({ generatingSuggestions: false });
    }
  }, [updateState]);

  // Get suggestions
  const getSuggestions = useCallback(async (
    observerId: string,
    limit: number = 10,
    type?: string
  ): Promise<void> => {
    try {
      updateState({ loading: true, suggestionsError: null });
      
      const result = await observerBackendService.getSuggestions(observerId, limit, type);
      updateState({ suggestions: result.suggestions });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get suggestions';
      updateState({ suggestionsError: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Get trust metrics
  const getTrustMetrics = useCallback(async (observerId: string): Promise<void> => {
    try {
      updateState({ loadingMetrics: true, metricsError: null });
      
      const metrics = await observerBackendService.getTrustMetrics(observerId);
      updateState({ trustMetrics: metrics });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get trust metrics';
      updateState({ metricsError: errorMessage });
    } finally {
      updateState({ loadingMetrics: false });
    }
  }, [updateState]);

  // Get context awareness
  const getContextAwareness = useCallback(async (observerId: string): Promise<void> => {
    try {
      updateState({ loadingContext: true, contextError: null });
      
      const context = await observerBackendService.getContextAwareness(observerId);
      updateState({ contextAwareness: context });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get context awareness';
      updateState({ contextError: errorMessage });
    } finally {
      updateState({ loadingContext: false });
    }
  }, [updateState]);

  // Update context
  const updateContext = useCallback(async (
    observerId: string,
    contextUpdate: Record<string, any>
  ): Promise<void> => {
    try {
      updateState({ loading: true, contextError: null });
      
      await observerBackendService.updateContext(observerId, contextUpdate);
      
      // Refresh context awareness
      await getContextAwareness(observerId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update context';
      updateState({ contextError: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, getContextAwareness]);

  // Get observer config
  const getObserverConfig = useCallback(async (observerId: string): Promise<void> => {
    try {
      updateState({ loading: true, configError: null });
      
      const config = await observerBackendService.getObserverConfig(observerId);
      updateState({ configuration: config });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get observer config';
      updateState({ configError: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Update observer config
  const updateObserverConfig = useCallback(async (
    observerId: string,
    config: ObserverConfiguration
  ): Promise<void> => {
    try {
      updateState({ updatingConfig: true, configError: null });
      
      await observerBackendService.updateObserverConfig(observerId, config);
      updateState({ configuration: config });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update observer config';
      updateState({ configError: errorMessage });
    } finally {
      updateState({ updatingConfig: false });
    }
  }, [updateState]);

  // List observers
  const listObservers = useCallback(async (
    userId?: string,
    isActive?: boolean,
    limit: number = 50
  ): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      
      const observers = await observerBackendService.listObservers(userId, isActive, limit);
      updateState({ observers });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list observers';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Delete observer
  const deleteObserver = useCallback(async (observerId: string): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      
      await observerBackendService.deleteObserver(observerId);
      
      // Refresh observers list
      await listObservers();
      
      // Clear current observer if it was deleted
      if (state.currentObserver?.observer_id === observerId) {
        updateState({ currentObserver: null });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete observer';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, listObservers, state.currentObserver]);

  // Set current observer
  const setCurrentObserver = useCallback(async (observerId: string): Promise<void> => {
    const observer = state.observers.find(obs => obs.observer_id === observerId);
    if (observer) {
      updateState({ currentObserver: observer });
      
      // Load related data for the current observer
      await Promise.all([
        getSuggestions(observerId),
        getTrustMetrics(observerId),
        getContextAwareness(observerId),
        getObserverConfig(observerId),
      ]);
    }
  }, [state.observers, updateState, getSuggestions, getTrustMetrics, getContextAwareness, getObserverConfig]);

  // Refresh all data for an observer
  const refreshData = useCallback(async (observerId?: string): Promise<void> => {
    const targetObserverId = observerId || state.currentObserver?.observer_id;
    
    if (targetObserverId) {
      await Promise.all([
        getSuggestions(targetObserverId),
        getTrustMetrics(targetObserverId),
        getContextAwareness(targetObserverId),
        getObserverConfig(targetObserverId),
      ]);
    }
    
    // Always refresh observers list
    await listObservers();
  }, [state.currentObserver, getSuggestions, getTrustMetrics, getContextAwareness, getObserverConfig, listObservers]);

  // Initial load
  useEffect(() => {
    if (autoLoadObservers) {
      listObservers();
    }
    
    // Set default observer if provided
    if (defaultObserverId) {
      setCurrentObserver(defaultObserverId);
    }
  }, [autoLoadObservers, defaultObserverId, listObservers, setCurrentObserver]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    registerObserver,
    generateSuggestions,
    getSuggestions,
    getTrustMetrics,
    getContextAwareness,
    updateContext,
    getObserverConfig,
    updateObserverConfig,
    listObservers,
    deleteObserver,
    setCurrentObserver,
    clearError,
    refreshData,
  };
};

