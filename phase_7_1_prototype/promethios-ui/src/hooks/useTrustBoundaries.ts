/**
 * Trust Boundaries Backend Hook
 * 
 * React hook for managing trust boundaries state and backend integration.
 * Provides state management for boundaries, thresholds, and metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import trustBoundariesBackendService, {
  TrustBoundary,
  TrustThreshold,
  CreateBoundaryRequest,
  CreateThresholdRequest
} from '../services/trustBoundariesBackendService';
import { TrustBoundariesStorageService } from '../services/TrustBoundariesStorageService';
import { useAuth } from '../context/AuthContext';

interface UseTrustBoundariesState {
  // Boundaries
  boundaries: TrustBoundary[];
  boundariesLoading: boolean;
  boundariesError: string | null;
  
  // Thresholds
  thresholds: TrustThreshold[];
  thresholdsLoading: boolean;
  thresholdsError: string | null;
  
  // Metrics
  metrics: {
    total_boundaries: number;
    active_boundaries: number;
    expired_boundaries: number;
    average_trust_level: number;
    boundary_types: Record<string, number>;
  } | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Operations
  creatingBoundary: boolean;
  creatingThreshold: boolean;
  operationError: string | null;
}

interface UseTrustBoundariesActions {
  // Boundary Actions
  loadBoundaries: () => Promise<void>;
  createBoundary: (request: CreateBoundaryRequest) => Promise<TrustBoundary>;
  updateBoundary: (boundaryId: string, updates: Partial<TrustBoundary>) => Promise<TrustBoundary>;
  deleteBoundary: (boundaryId: string) => Promise<void>;
  
  // Threshold Actions
  loadThresholds: () => Promise<void>;
  createThreshold: (request: CreateThresholdRequest) => Promise<TrustThreshold>;
  updateThreshold: (thresholdId: string, updates: Partial<TrustThreshold>) => Promise<TrustThreshold>;
  deleteThreshold: (thresholdId: string) => Promise<void>;
  
  // Metrics Actions
  loadMetrics: () => Promise<void>;
  
  // Utility Actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
}

export interface UseTrustBoundariesReturn extends UseTrustBoundariesState, UseTrustBoundariesActions {}

export const useTrustBoundaries = (): UseTrustBoundariesReturn => {
  const { currentUser } = useAuth();
  
  // State
  const [boundaries, setBoundaries] = useState<TrustBoundary[]>([]);
  const [boundariesLoading, setBoundariesLoading] = useState(false);
  const [boundariesError, setBoundariesError] = useState<string | null>(null);
  
  const [thresholds, setThresholds] = useState<TrustThreshold[]>([]);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [thresholdsError, setThresholdsError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<{
    total_boundaries: number;
    active_boundaries: number;
    expired_boundaries: number;
    average_trust_level: number;
    boundary_types: Record<string, number>;
  } | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  
  const [creatingBoundary, setCreatingBoundary] = useState(false);
  const [creatingThreshold, setCreatingThreshold] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Storage service instance
  const [storageService] = useState(() => new TrustBoundariesStorageService());

  // Initialize storage service when user changes
  useEffect(() => {
    if (currentUser?.uid) {
      try {
        storageService.setUserId(currentUser.uid);
        console.log('Trust boundaries storage service initialized for user:', currentUser.uid);
      } catch (error) {
        console.error('Failed to initialize trust boundaries storage service:', error);
      }
    }
  }, [currentUser?.uid, storageService]);

  // Boundary Actions
  const loadBoundaries = useCallback(async () => {
    setBoundariesLoading(true);
    setBoundariesError(null);
    
    try {
      const boundariesData = await trustBoundariesBackendService.getBoundaries();
      setBoundaries(boundariesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load trust boundaries';
      setBoundariesError(errorMessage);
      console.error('Error loading trust boundaries:', error);
    } finally {
      setBoundariesLoading(false);
    }
  }, []);

  const createBoundary = useCallback(async (request: CreateBoundaryRequest) => {
    setCreatingBoundary(true);
    setOperationError(null);
    
    try {
      const boundary = await trustBoundariesBackendService.createBoundary(request);
      setBoundaries(prev => [...prev, boundary]);
      return boundary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trust boundary';
      setOperationError(errorMessage);
      console.error('Error creating trust boundary:', error);
      throw error;
    } finally {
      setCreatingBoundary(false);
    }
  }, []);

  const updateBoundary = useCallback(async (boundaryId: string, updates: Partial<TrustBoundary>) => {
    setOperationError(null);
    
    try {
      const updatedBoundary = await trustBoundariesBackendService.updateBoundary(boundaryId, updates);
      setBoundaries(prev => prev.map(b => b.boundary_id === boundaryId ? updatedBoundary : b));
      return updatedBoundary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update trust boundary';
      setOperationError(errorMessage);
      console.error('Error updating trust boundary:', error);
      throw error;
    }
  }, []);

  const deleteBoundary = useCallback(async (boundaryId: string) => {
    setOperationError(null);
    
    try {
      await trustBoundariesBackendService.deleteBoundary(boundaryId);
      setBoundaries(prev => prev.filter(b => b.boundary_id !== boundaryId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete trust boundary';
      setOperationError(errorMessage);
      console.error('Error deleting trust boundary:', error);
      throw error;
    }
  }, []);

  // Threshold Actions
  const loadThresholds = useCallback(async () => {
    setThresholdsLoading(true);
    setThresholdsError(null);
    
    try {
      const thresholdsData = await trustBoundariesBackendService.getThresholds();
      setThresholds(thresholdsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load trust thresholds';
      setThresholdsError(errorMessage);
      console.error('Error loading trust thresholds:', error);
    } finally {
      setThresholdsLoading(false);
    }
  }, []);

  const createThreshold = useCallback(async (request: CreateThresholdRequest) => {
    setCreatingThreshold(true);
    setOperationError(null);
    
    try {
      const threshold = await trustBoundariesBackendService.createThreshold(request);
      setThresholds(prev => [...prev, threshold]);
      return threshold;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trust threshold';
      setOperationError(errorMessage);
      console.error('Error creating trust threshold:', error);
      throw error;
    } finally {
      setCreatingThreshold(false);
    }
  }, []);

  const updateThreshold = useCallback(async (thresholdId: string, updates: Partial<TrustThreshold>) => {
    setOperationError(null);
    
    try {
      const updatedThreshold = await trustBoundariesBackendService.updateThreshold(thresholdId, updates);
      setThresholds(prev => prev.map(t => t.threshold_id === thresholdId ? updatedThreshold : t));
      return updatedThreshold;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update trust threshold';
      setOperationError(errorMessage);
      console.error('Error updating trust threshold:', error);
      throw error;
    }
  }, []);

  const deleteThreshold = useCallback(async (thresholdId: string) => {
    setOperationError(null);
    
    try {
      await trustBoundariesBackendService.deleteThreshold(thresholdId);
      setThresholds(prev => prev.filter(t => t.threshold_id !== thresholdId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete trust threshold';
      setOperationError(errorMessage);
      console.error('Error deleting trust threshold:', error);
      throw error;
    }
  }, []);

  // Metrics Actions
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metricsData = await trustBoundariesBackendService.getBoundaryMetrics();
      setMetrics(metricsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load boundary metrics';
      setMetricsError(errorMessage);
      console.error('Error loading boundary metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Utility Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadBoundaries(),
      loadThresholds(),
      loadMetrics()
    ]);
  }, [loadBoundaries, loadThresholds, loadMetrics]);

  const clearErrors = useCallback(() => {
    setBoundariesError(null);
    setThresholdsError(null);
    setMetricsError(null);
    setOperationError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    // State
    boundaries,
    boundariesLoading,
    boundariesError,
    thresholds,
    thresholdsLoading,
    thresholdsError,
    metrics,
    metricsLoading,
    metricsError,
    creatingBoundary,
    creatingThreshold,
    operationError,
    
    // Actions
    loadBoundaries,
    createBoundary,
    updateBoundary,
    deleteBoundary,
    loadThresholds,
    createThreshold,
    updateThreshold,
    deleteThreshold,
    loadMetrics,
    refreshAll,
    clearErrors
  };
};

export default useTrustBoundaries;

