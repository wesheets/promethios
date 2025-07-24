/**
 * Policy Assignments Hook
 * 
 * React hook for managing agent-policy assignments with real-time updates
 * and comprehensive assignment management capabilities.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  policyAssignmentStorageService, 
  PolicyAssignment, 
  AssignmentSummary 
} from '../services/PolicyAssignmentStorageService';

interface UsePolicyAssignmentsReturn {
  assignments: PolicyAssignment[];
  summary: AssignmentSummary;
  loading: boolean;
  error: string | null;
  
  // Assignment operations
  assignPolicy: (agentId: string, policyId: string, metadata?: any) => Promise<PolicyAssignment>;
  unassignPolicy: (agentId: string, policyId: string) => Promise<boolean>;
  updateAssignment: (assignmentId: string, updates: Partial<PolicyAssignment>) => Promise<PolicyAssignment>;
  updateComplianceRate: (agentId: string, policyId: string, complianceRate: number) => Promise<void>;
  
  // Bulk operations
  bulkAssignPolicies: (agentIds: string[], policyIds: string[]) => Promise<PolicyAssignment[]>;
  removeAgentAssignments: (agentId: string) => Promise<void>;
  removePolicyAssignments: (policyId: string) => Promise<void>;
  
  // Query operations
  getAgentAssignments: (agentId: string) => PolicyAssignment[];
  getPolicyAssignments: (policyId: string) => PolicyAssignment[];
  isAssigned: (agentId: string, policyId: string) => boolean;
  
  // Utility operations
  refreshAssignments: () => Promise<void>;
  clearCache: () => void;
}

export const usePolicyAssignments = (): UsePolicyAssignmentsReturn => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<PolicyAssignment[]>([]);
  const [summary, setSummary] = useState<AssignmentSummary>({
    totalAssignments: 0,
    activeAssignments: 0,
    averageCompliance: 0,
    agentCount: 0,
    policyCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize storage service
  useEffect(() => {
    const initializeService = async () => {
      if (!currentUser?.uid || initialized) return;

      try {
        setLoading(true);
        setError(null);
        
        await policyAssignmentStorageService.initialize(currentUser.uid);
        setInitialized(true);
        
        // Load initial data
        await loadAssignments();
      } catch (error) {
        console.error('Failed to initialize policy assignment service:', error);
        setError('Failed to initialize assignment service');
      } finally {
        setLoading(false);
      }
    };

    initializeService();
  }, [currentUser?.uid, initialized]);

  // Load assignments from storage
  const loadAssignments = useCallback(async () => {
    if (!currentUser?.uid) {
      console.warn('Cannot load assignments: user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [assignmentsData, summaryData] = await Promise.all([
        policyAssignmentStorageService.getAssignments(currentUser.uid),
        policyAssignmentStorageService.getAssignmentSummary(currentUser.uid)
      ]);

      setAssignments(assignmentsData || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load policy assignments:', error);
      setError('Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Assign policy to agent
  const assignPolicy = useCallback(async (
    agentId: string, 
    policyId: string, 
    metadata?: any
  ): Promise<PolicyAssignment> => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const assignment = await policyAssignmentStorageService.assignPolicy(
        currentUser.uid,
        agentId,
        policyId,
        currentUser.uid,
        metadata
      );

      // Refresh data
      await loadAssignments();
      
      return assignment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign policy';
      setError(errorMessage);
      throw error;
    }
  }, [currentUser?.uid, loadAssignments]);

  // Unassign policy from agent
  const unassignPolicy = useCallback(async (
    agentId: string, 
    policyId: string
  ): Promise<boolean> => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const success = await policyAssignmentStorageService.unassignPolicy(
        currentUser.uid,
        agentId,
        policyId
      );

      // Refresh data
      await loadAssignments();
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unassign policy';
      setError(errorMessage);
      throw error;
    }
  }, [currentUser?.uid, loadAssignments]);

  // Update assignment
  const updateAssignment = useCallback(async (
    assignmentId: string, 
    updates: Partial<PolicyAssignment>
  ): Promise<PolicyAssignment> => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const updatedAssignment = await policyAssignmentStorageService.updateAssignment(
        currentUser.uid,
        assignmentId,
        updates
      );

      // Refresh data
      await loadAssignments();
      
      return updatedAssignment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update assignment';
      setError(errorMessage);
      throw error;
    }
  }, [currentUser?.uid, loadAssignments]);

  // Update compliance rate
  const updateComplianceRate = useCallback(async (
    agentId: string, 
    policyId: string, 
    complianceRate: number
  ): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      await policyAssignmentStorageService.updateComplianceRate(
        currentUser.uid,
        agentId,
        policyId,
        complianceRate
      );

      // Refresh data
      await loadAssignments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update compliance rate';
      setError(errorMessage);
      console.error('Failed to update compliance rate:', error);
    }
  }, [currentUser?.uid, loadAssignments]);

  // Bulk assign policies
  const bulkAssignPolicies = useCallback(async (
    agentIds: string[], 
    policyIds: string[]
  ): Promise<PolicyAssignment[]> => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const newAssignments = await policyAssignmentStorageService.bulkAssignPolicies(
        currentUser.uid,
        agentIds,
        policyIds,
        currentUser.uid
      );

      // Refresh data
      await loadAssignments();
      
      return newAssignments;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk assign policies';
      setError(errorMessage);
      throw error;
    }
  }, [currentUser?.uid, loadAssignments]);

  // Remove all assignments for an agent
  const removeAgentAssignments = useCallback(async (agentId: string): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      await policyAssignmentStorageService.removeAgentAssignments(currentUser.uid, agentId);
      
      // Refresh data
      await loadAssignments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove agent assignments';
      setError(errorMessage);
      throw error;
    }
  }, [currentUser?.uid, loadAssignments]);

  // Remove all assignments for a policy
  const removePolicyAssignments = useCallback(async (policyId: string): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      await policyAssignmentStorageService.removePolicyAssignments(currentUser.uid, policyId);
      
      // Refresh data
      await loadAssignments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove policy assignments';
      setError(errorMessage);
      throw error;
    }
  }, [currentUser?.uid, loadAssignments]);

  // Get assignments for a specific agent
  const getAgentAssignments = useCallback((agentId: string): PolicyAssignment[] => {
    return assignments.filter(assignment => assignment.agentId === agentId);
  }, [assignments]);

  // Get assignments for a specific policy
  const getPolicyAssignments = useCallback((policyId: string): PolicyAssignment[] => {
    return assignments.filter(assignment => assignment.policyId === policyId);
  }, [assignments]);

  // Check if policy is assigned to agent
  const isAssigned = useCallback((agentId: string, policyId: string): boolean => {
    return assignments.some(assignment => 
      assignment.agentId === agentId && 
      assignment.policyId === policyId && 
      assignment.status === 'active'
    );
  }, [assignments]);

  // Refresh assignments
  const refreshAssignments = useCallback(async (): Promise<void> => {
    await loadAssignments();
  }, [loadAssignments]);

  // Clear cache
  const clearCache = useCallback((): void => {
    policyAssignmentStorageService.clearCache();
  }, []);

  return {
    assignments,
    summary,
    loading,
    error,
    
    // Assignment operations
    assignPolicy,
    unassignPolicy,
    updateAssignment,
    updateComplianceRate,
    
    // Bulk operations
    bulkAssignPolicies,
    removeAgentAssignments,
    removePolicyAssignments,
    
    // Query operations
    getAgentAssignments,
    getPolicyAssignments,
    isAssigned,
    
    // Utility operations
    refreshAssignments,
    clearCache
  };
};

