/**
 * Trust Backend Hook
 * 
 * React hook for managing trust state and backend integration.
 * Provides state management for trust evaluations, metrics, and relationships.
 */

import { useState, useEffect, useCallback } from 'react';
import trustBackendService, {
  TrustEvaluateRequest,
  TrustEvaluateResponse,
  TrustEvaluation,
  TrustQueryRequest,
  TrustQueryResponse,
  TrustUpdateRequest,
  TrustMetrics
} from '../services/trustBackendService';

interface UseTrustBackendState {
  // Trust Evaluations
  evaluations: TrustEvaluation[];
  evaluationsLoading: boolean;
  evaluationsError: string | null;
  
  // Trust Metrics
  metrics: TrustMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Current Evaluation
  currentEvaluation: TrustEvaluation | null;
  currentEvaluationLoading: boolean;
  currentEvaluationError: string | null;
  
  // Operations
  evaluatingTrust: boolean;
  evaluationError: string | null;
  updatingTrust: boolean;
  updateError: string | null;
}

interface UseTrustBackendActions {
  // Trust Evaluation Actions
  evaluateTrust: (request: TrustEvaluateRequest) => Promise<TrustEvaluateResponse>;
  updateTrust: (request: TrustUpdateRequest) => Promise<TrustEvaluateResponse>;
  
  // Query Actions
  queryEvaluations: (request: TrustQueryRequest) => Promise<TrustQueryResponse>;
  getTrustEvaluation: (evaluationId: string) => Promise<TrustEvaluation | null>;
  
  // Metrics Actions
  loadMetrics: () => Promise<void>;
  
  // Agent-specific Actions
  getAgentTrustRelationships: (agentId: string) => Promise<TrustEvaluation[]>;
  getAgentPairTrustScore: (agentId: string, targetId: string) => Promise<number | null>;
  
  // Utility Actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
}

export interface UseTrustBackendReturn extends UseTrustBackendState, UseTrustBackendActions {}

export const useTrustBackend = (): UseTrustBackendReturn => {
  // State
  const [evaluations, setEvaluations] = useState<TrustEvaluation[]>([]);
  const [evaluationsLoading, setEvaluationsLoading] = useState(false);
  const [evaluationsError, setEvaluationsError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  
  const [currentEvaluation, setCurrentEvaluation] = useState<TrustEvaluation | null>(null);
  const [currentEvaluationLoading, setCurrentEvaluationLoading] = useState(false);
  const [currentEvaluationError, setCurrentEvaluationError] = useState<string | null>(null);
  
  const [evaluatingTrust, setEvaluatingTrust] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [updatingTrust, setUpdatingTrust] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Trust Evaluation Actions
  const evaluateTrust = useCallback(async (request: TrustEvaluateRequest) => {
    setEvaluatingTrust(true);
    setEvaluationError(null);
    
    try {
      const response = await trustBackendService.evaluateTrust(request);
      
      // Refresh evaluations to include the new one
      await queryEvaluations({ limit: 100 });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to evaluate trust';
      setEvaluationError(errorMessage);
      console.error('Error evaluating trust:', error);
      throw error;
    } finally {
      setEvaluatingTrust(false);
    }
  }, []);

  const updateTrust = useCallback(async (request: TrustUpdateRequest) => {
    setUpdatingTrust(true);
    setUpdateError(null);
    
    try {
      const response = await trustBackendService.updateTrust(request);
      
      // Refresh evaluations to reflect the update
      await queryEvaluations({ limit: 100 });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update trust';
      setUpdateError(errorMessage);
      console.error('Error updating trust:', error);
      throw error;
    } finally {
      setUpdatingTrust(false);
    }
  }, []);

  // Query Actions
  const queryEvaluations = useCallback(async (request: TrustQueryRequest) => {
    setEvaluationsLoading(true);
    setEvaluationsError(null);
    
    try {
      const response = await trustBackendService.queryTrust(request);
      setEvaluations(response.evaluations);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to query trust evaluations';
      setEvaluationsError(errorMessage);
      console.error('Error querying trust evaluations:', error);
      throw error;
    } finally {
      setEvaluationsLoading(false);
    }
  }, []);

  const getTrustEvaluation = useCallback(async (evaluationId: string) => {
    setCurrentEvaluationLoading(true);
    setCurrentEvaluationError(null);
    
    try {
      const evaluation = await trustBackendService.getTrustEvaluation(evaluationId);
      setCurrentEvaluation(evaluation);
      return evaluation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get trust evaluation';
      setCurrentEvaluationError(errorMessage);
      console.error('Error getting trust evaluation:', error);
      throw error;
    } finally {
      setCurrentEvaluationLoading(false);
    }
  }, []);

  // Metrics Actions
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metricsData = await trustBackendService.getTrustMetrics();
      setMetrics(metricsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load trust metrics';
      setMetricsError(errorMessage);
      console.error('Error loading trust metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Agent-specific Actions
  const getAgentTrustRelationships = useCallback(async (agentId: string) => {
    try {
      const relationships = await trustBackendService.getAgentTrustRelationships(agentId);
      return relationships;
    } catch (error) {
      console.error('Error getting agent trust relationships:', error);
      return [];
    }
  }, []);

  const getAgentPairTrustScore = useCallback(async (agentId: string, targetId: string) => {
    try {
      const score = await trustBackendService.getAgentPairTrustScore(agentId, targetId);
      return score;
    } catch (error) {
      console.error('Error getting agent pair trust score:', error);
      return null;
    }
  }, []);

  // Utility Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadMetrics(),
      queryEvaluations({ limit: 100 })
    ]);
  }, [loadMetrics, queryEvaluations]);

  const clearErrors = useCallback(() => {
    setEvaluationsError(null);
    setMetricsError(null);
    setCurrentEvaluationError(null);
    setEvaluationError(null);
    setUpdateError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    // State
    evaluations,
    evaluationsLoading,
    evaluationsError,
    metrics,
    metricsLoading,
    metricsError,
    currentEvaluation,
    currentEvaluationLoading,
    currentEvaluationError,
    evaluatingTrust,
    evaluationError,
    updatingTrust,
    updateError,
    
    // Actions
    evaluateTrust,
    updateTrust,
    queryEvaluations,
    getTrustEvaluation,
    loadMetrics,
    getAgentTrustRelationships,
    getAgentPairTrustScore,
    refreshAll,
    clearErrors
  };
};

export default useTrustBackend;

