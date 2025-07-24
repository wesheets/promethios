/**
 * Policies Hook
 * 
 * React hook for managing governance policies with dual storage:
 * - Primary: Backend API for real-time data and server-side processing
 * - Secondary: UnifiedStorageService for persistence and offline support
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { prometheiosPolicyAPI } from '../services/api/prometheiosPolicyAPI';
import { PoliciesStorageService, Policy, CreatePolicyRequest } from '../services/PoliciesStorageService';

interface UsePoliciesReturn {
  // Data
  policies: Policy[];
  loading: boolean;
  error: string | null;
  
  // CRUD Operations
  loadPolicies: () => Promise<void>;
  createPolicy: (policyData: CreatePolicyRequest) => Promise<Policy | null>;
  updatePolicy: (policyId: string, updates: Partial<Policy>) => Promise<Policy | null>;
  deletePolicy: (policyId: string) => Promise<boolean>;
  
  // Utility Functions
  getPolicyById: (policyId: string) => Policy | undefined;
  getPoliciesByStatus: (status: Policy['status']) => Policy[];
  getPoliciesByCategory: (category: string) => Policy[];
  searchPolicies: (query: string) => Policy[];
  
  // Statistics
  policyStats: {
    total: number;
    byStatus: Record<Policy['status'], number>;
    byCategory: Record<string, number>;
  };
  
  // Advanced Features
  generatePolicyFromNL: (description: string, policyType?: string, complianceRequirements?: string[]) => Promise<Policy | null>;
  testPolicy: (policyId: string, testScenarios: any[]) => Promise<any>;
  optimizePolicy: (policyId: string) => Promise<any>;
  detectConflicts: (policyId: string) => Promise<any>;
  
  // Import/Export
  exportPolicies: () => Promise<string>;
  importPolicies: (jsonData: string) => Promise<Policy[]>;
}

export const usePolicies = (): UsePoliciesReturn => {
  const { user: currentUser } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageService] = useState(() => new PoliciesStorageService());
  const [policyStats, setPolicyStats] = useState({
    total: 0,
    byStatus: { draft: 0, active: 0, deprecated: 0, archived: 0 } as Record<Policy['status'], number>,
    byCategory: {} as Record<string, number>
  });

  // Initialize storage service when user changes
  useEffect(() => {
    const initializeService = async () => {
      if (currentUser?.uid) {
        try {
          await storageService.initialize(currentUser.uid);
          storageService.setCurrentUser(currentUser.uid);
          await loadPolicies();
        } catch (error) {
          console.error('Error initializing policies storage service:', error);
          setError('Failed to initialize policies service');
        }
      }
    };

    initializeService();
  }, [currentUser?.uid]);

  // Update statistics when policies change
  useEffect(() => {
    const updateStats = () => {
      const byStatus: Record<Policy['status'], number> = {
        draft: 0,
        active: 0,
        deprecated: 0,
        archived: 0
      };
      
      const byCategory: Record<string, number> = {};
      
      policies.forEach(policy => {
        byStatus[policy.status]++;
        
        if (policy.category) {
          byCategory[policy.category] = (byCategory[policy.category] || 0) + 1;
        }
      });
      
      setPolicyStats({
        total: policies.length,
        byStatus,
        byCategory
      });
    };

    updateStats();
  }, [policies]);

  /**
   * Load policies from both storage and backend
   */
  const loadPolicies = useCallback(async () => {
    if (!currentUser?.uid) {
      console.warn('Cannot load policies: user not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load from storage first for immediate display
      const storedPolicies = await storageService.getPolicies();
      if (storedPolicies.length > 0) {
        setPolicies(storedPolicies);
      }

      // Then sync with backend
      try {
        const backendPolicies = await prometheiosPolicyAPI.getPolicies();
        
        // Merge backend data with storage
        const mergedPolicies = [...storedPolicies];
        
        backendPolicies.forEach(backendPolicy => {
          const existingIndex = mergedPolicies.findIndex(p => p.policy_id === backendPolicy.policy_id);
          if (existingIndex >= 0) {
            // Update existing policy with backend data
            mergedPolicies[existingIndex] = backendPolicy;
          } else {
            // Add new policy from backend
            mergedPolicies.push(backendPolicy);
          }
        });

        setPolicies(mergedPolicies);
        
        // Save merged data back to storage
        if (mergedPolicies.length !== storedPolicies.length || 
            JSON.stringify(mergedPolicies) !== JSON.stringify(storedPolicies)) {
          // Only save if there are actual changes
          for (const policy of mergedPolicies) {
            if (!storedPolicies.find(p => p.policy_id === policy.policy_id)) {
              await storageService.createPolicy(policy);
            }
          }
        }
      } catch (backendError) {
        console.warn('Backend sync failed, using storage data:', backendError);
        // Continue with storage data if backend fails
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      setError('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, storageService]);

  /**
   * Create a new policy
   */
  const createPolicy = useCallback(async (policyData: CreatePolicyRequest): Promise<Policy | null> => {
    if (!currentUser?.uid) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Create in backend first
      let newPolicy: Policy;
      try {
        newPolicy = await prometheiosPolicyAPI.createPolicy(policyData);
      } catch (backendError) {
        console.warn('Backend creation failed, creating in storage only:', backendError);
        // Fallback to storage-only creation
        newPolicy = await storageService.createPolicy(policyData);
      }

      // Save to storage
      await storageService.createPolicy(newPolicy);

      // Update local state
      setPolicies(prev => [...prev, newPolicy]);

      console.log('Policy created successfully:', newPolicy.policy_id);
      return newPolicy;
    } catch (error) {
      console.error('Error creating policy:', error);
      setError('Failed to create policy');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, storageService]);

  /**
   * Update an existing policy
   */
  const updatePolicy = useCallback(async (policyId: string, updates: Partial<Policy>): Promise<Policy | null> => {
    if (!currentUser?.uid) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Update in backend first
      let updatedPolicy: Policy;
      try {
        updatedPolicy = await prometheiosPolicyAPI.updatePolicy(policyId, updates);
      } catch (backendError) {
        console.warn('Backend update failed, updating storage only:', backendError);
        // Fallback to storage-only update
        const storageResult = await storageService.updatePolicy(policyId, updates);
        if (!storageResult) {
          throw new Error('Policy not found');
        }
        updatedPolicy = storageResult;
      }

      // Update in storage
      await storageService.updatePolicy(policyId, updatedPolicy);

      // Update local state
      setPolicies(prev => prev.map(p => p.policy_id === policyId ? updatedPolicy : p));

      console.log('Policy updated successfully:', policyId);
      return updatedPolicy;
    } catch (error) {
      console.error('Error updating policy:', error);
      setError('Failed to update policy');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, storageService]);

  /**
   * Delete a policy
   */
  const deletePolicy = useCallback(async (policyId: string): Promise<boolean> => {
    if (!currentUser?.uid) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Delete from backend first
      try {
        await prometheiosPolicyAPI.deletePolicy(policyId);
      } catch (backendError) {
        console.warn('Backend deletion failed, deleting from storage only:', backendError);
      }

      // Delete from storage
      const deleted = await storageService.deletePolicy(policyId);

      if (deleted) {
        // Update local state
        setPolicies(prev => prev.filter(p => p.policy_id !== policyId));
        console.log('Policy deleted successfully:', policyId);
      }

      return deleted;
    } catch (error) {
      console.error('Error deleting policy:', error);
      setError('Failed to delete policy');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, storageService]);

  // Utility functions
  const getPolicyById = useCallback((policyId: string): Policy | undefined => {
    return policies.find(p => p.policy_id === policyId);
  }, [policies]);

  const getPoliciesByStatus = useCallback((status: Policy['status']): Policy[] => {
    return policies.filter(p => p.status === status);
  }, [policies]);

  const getPoliciesByCategory = useCallback((category: string): Policy[] => {
    return policies.filter(p => p.category === category);
  }, [policies]);

  const searchPolicies = useCallback((query: string): Policy[] => {
    const lowerQuery = query.toLowerCase();
    return policies.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
      (p.metadata?.tags && p.metadata.tags.some(tag => 
        tag.toLowerCase().includes(lowerQuery)
      ))
    );
  }, [policies]);

  // Advanced features
  const generatePolicyFromNL = useCallback(async (
    description: string, 
    policyType?: string, 
    complianceRequirements?: string[]
  ): Promise<Policy | null> => {
    if (!currentUser?.uid) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const generatedPolicy = await prometheiosPolicyAPI.generatePolicyFromNL({
        description,
        policy_type: policyType,
        compliance_requirements: complianceRequirements
      });

      console.log('Policy generated from NL:', generatedPolicy.policy_id);
      return generatedPolicy;
    } catch (error) {
      console.error('Error generating policy from NL:', error);
      setError('Failed to generate policy from natural language');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  const testPolicy = useCallback(async (policyId: string, testScenarios: any[]): Promise<any> => {
    try {
      return await prometheiosPolicyAPI.testPolicy(policyId, testScenarios);
    } catch (error) {
      console.error('Error testing policy:', error);
      setError('Failed to test policy');
      return null;
    }
  }, []);

  const optimizePolicy = useCallback(async (policyId: string): Promise<any> => {
    try {
      return await prometheiosPolicyAPI.optimizePolicy(policyId);
    } catch (error) {
      console.error('Error optimizing policy:', error);
      setError('Failed to optimize policy');
      return null;
    }
  }, []);

  const detectConflicts = useCallback(async (policyId: string): Promise<any> => {
    try {
      return await prometheiosPolicyAPI.detectConflicts(policyId);
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      setError('Failed to detect policy conflicts');
      return null;
    }
  }, []);

  // Import/Export
  const exportPolicies = useCallback(async (): Promise<string> => {
    try {
      return await storageService.exportPolicies();
    } catch (error) {
      console.error('Error exporting policies:', error);
      setError('Failed to export policies');
      return '[]';
    }
  }, [storageService]);

  const importPolicies = useCallback(async (jsonData: string): Promise<Policy[]> => {
    try {
      const importedPolicies = await storageService.importPolicies(jsonData);
      setPolicies(importedPolicies);
      return importedPolicies;
    } catch (error) {
      console.error('Error importing policies:', error);
      setError('Failed to import policies');
      return [];
    }
  }, [storageService]);

  return {
    // Data
    policies,
    loading,
    error,
    
    // CRUD Operations
    loadPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    
    // Utility Functions
    getPolicyById,
    getPoliciesByStatus,
    getPoliciesByCategory,
    searchPolicies,
    
    // Statistics
    policyStats,
    
    // Advanced Features
    generatePolicyFromNL,
    testPolicy,
    optimizePolicy,
    detectConflicts,
    
    // Import/Export
    exportPolicies,
    importPolicies
  };
};

