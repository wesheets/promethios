/**
 * Policy Backend Hook
 * 
 * React hook for managing policy state and backend integration.
 * Provides state management for policy templates, decisions, and enforcement.
 */

import { useState, useEffect, useCallback } from 'react';
import policyBackendService, {
  PolicyTemplate,
  PolicyStatistics,
  PolicyDecision,
  PolicyEnforceRequest,
  PolicyEnforceResponse,
  PolicyQueryRequest,
  PolicyQueryResponse
} from '../services/policyBackendService';

interface UsePolicyBackendState {
  // Policy Templates
  policies: PolicyTemplate[];
  policiesLoading: boolean;
  policiesError: string | null;
  
  // Policy Statistics
  statistics: PolicyStatistics | null;
  statisticsLoading: boolean;
  statisticsError: string | null;
  
  // Policy Decisions
  decisions: PolicyDecision[];
  decisionsLoading: boolean;
  decisionsError: string | null;
  
  // Enforcement
  enforcementLoading: boolean;
  enforcementError: string | null;
}

interface UsePolicyBackendActions {
  // Policy Template Actions
  loadPolicies: () => Promise<void>;
  createPolicy: (policy: Omit<PolicyTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<PolicyTemplate>;
  updatePolicy: (policyId: string, policy: Partial<PolicyTemplate>) => Promise<PolicyTemplate>;
  deletePolicy: (policyId: string) => Promise<void>;
  
  // Statistics Actions
  loadStatistics: () => Promise<void>;
  
  // Decision Actions
  queryDecisions: (request: PolicyQueryRequest) => Promise<PolicyQueryResponse>;
  getDecision: (decisionId: string) => Promise<PolicyDecision | null>;
  
  // Enforcement Actions
  enforcePolicy: (request: PolicyEnforceRequest) => Promise<PolicyEnforceResponse>;
  
  // Utility Actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
}

export interface UsePolicyBackendReturn extends UsePolicyBackendState, UsePolicyBackendActions {}

export const usePolicyBackend = (): UsePolicyBackendReturn => {
  // State
  const [policies, setPolicies] = useState<PolicyTemplate[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState<string | null>(null);
  
  const [statistics, setStatistics] = useState<PolicyStatistics | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  
  const [decisions, setDecisions] = useState<PolicyDecision[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(false);
  const [decisionsError, setDecisionsError] = useState<string | null>(null);
  
  const [enforcementLoading, setEnforcementLoading] = useState(false);
  const [enforcementError, setEnforcementError] = useState<string | null>(null);

  // Policy Template Actions
  const loadPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    setPoliciesError(null);
    
    try {
      const policiesData = await policyBackendService.listPolicies();
      setPolicies(policiesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load policies';
      setPoliciesError(errorMessage);
      console.error('Error loading policies:', error);
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  const createPolicy = useCallback(async (policy: Omit<PolicyTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    setPoliciesLoading(true);
    setPoliciesError(null);
    
    try {
      const newPolicy = await policyBackendService.createPolicy(policy);
      setPolicies(prev => [...prev, newPolicy]);
      return newPolicy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create policy';
      setPoliciesError(errorMessage);
      console.error('Error creating policy:', error);
      throw error;
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  const updatePolicy = useCallback(async (policyId: string, policy: Partial<PolicyTemplate>) => {
    setPoliciesLoading(true);
    setPoliciesError(null);
    
    try {
      const updatedPolicy = await policyBackendService.updatePolicy(policyId, policy);
      setPolicies(prev => prev.map(p => p.id === policyId ? updatedPolicy : p));
      return updatedPolicy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update policy';
      setPoliciesError(errorMessage);
      console.error('Error updating policy:', error);
      throw error;
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  const deletePolicy = useCallback(async (policyId: string) => {
    setPoliciesLoading(true);
    setPoliciesError(null);
    
    try {
      await policyBackendService.deletePolicy(policyId);
      setPolicies(prev => prev.filter(p => p.id !== policyId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete policy';
      setPoliciesError(errorMessage);
      console.error('Error deleting policy:', error);
      throw error;
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  // Statistics Actions
  const loadStatistics = useCallback(async () => {
    setStatisticsLoading(true);
    setStatisticsError(null);
    
    try {
      const statisticsData = await policyBackendService.getStatistics();
      setStatistics(statisticsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      setStatisticsError(errorMessage);
      console.error('Error loading statistics:', error);
    } finally {
      setStatisticsLoading(false);
    }
  }, []);

  // Decision Actions
  const queryDecisions = useCallback(async (request: PolicyQueryRequest) => {
    setDecisionsLoading(true);
    setDecisionsError(null);
    
    try {
      const response = await policyBackendService.queryDecisions(request);
      setDecisions(response.decisions);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to query decisions';
      setDecisionsError(errorMessage);
      console.error('Error querying decisions:', error);
      throw error;
    } finally {
      setDecisionsLoading(false);
    }
  }, []);

  const getDecision = useCallback(async (decisionId: string) => {
    setDecisionsLoading(true);
    setDecisionsError(null);
    
    try {
      const decision = await policyBackendService.getDecision(decisionId);
      return decision;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get decision';
      setDecisionsError(errorMessage);
      console.error('Error getting decision:', error);
      throw error;
    } finally {
      setDecisionsLoading(false);
    }
  }, []);

  // Enforcement Actions
  const enforcePolicy = useCallback(async (request: PolicyEnforceRequest) => {
    setEnforcementLoading(true);
    setEnforcementError(null);
    
    try {
      const response = await policyBackendService.enforcePolicy(request);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enforce policy';
      setEnforcementError(errorMessage);
      console.error('Error enforcing policy:', error);
      throw error;
    } finally {
      setEnforcementLoading(false);
    }
  }, []);

  // Utility Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadPolicies(),
      loadStatistics()
    ]);
  }, [loadPolicies, loadStatistics]);

  const clearErrors = useCallback(() => {
    setPoliciesError(null);
    setStatisticsError(null);
    setDecisionsError(null);
    setEnforcementError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    // State
    policies,
    policiesLoading,
    policiesError,
    statistics,
    statisticsLoading,
    statisticsError,
    decisions,
    decisionsLoading,
    decisionsError,
    enforcementLoading,
    enforcementError,
    
    // Actions
    loadPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    loadStatistics,
    queryDecisions,
    getDecision,
    enforcePolicy,
    refreshAll,
    clearErrors
  };
};

export default usePolicyBackend;

