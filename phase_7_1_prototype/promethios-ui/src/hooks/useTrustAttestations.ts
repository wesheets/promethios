/**
 * Trust Attestations Backend Hook
 * 
 * React hook for managing trust attestations state and backend integration.
 * Provides state management for attestations and metrics with real API integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  trustAttestationsBackendService,
  TrustAttestation,
  AttestationMetrics,
  AttestationFilters
} from '../services/trustAttestationsBackendService';

interface UseTrustAttestationsState {
  // Attestations
  attestations: TrustAttestation[];
  attestationsLoading: boolean;
  attestationsError: string | null;
  
  // Metrics
  metrics: AttestationMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Operations
  creatingAttestation: boolean;
  verifyingAttestation: boolean;
  operationError: string | null;
}

interface UseTrustAttestationsActions {
  // Attestation Actions
  loadAttestations: (filters?: AttestationFilters) => Promise<void>;
  createAttestation: (attestationData: {
    attestation_type: string;
    subject_instance_id: string;
    subject_name: string;
    attester_instance_id: string;
    attester_name: string;
    attestation_data?: Record<string, any>;
    expires_at?: string;
    metadata?: Record<string, any>;
  }) => Promise<TrustAttestation>;
  verifyAttestation: (attestationId: string, verifierInstanceId: string) => Promise<{
    attestation_id: string;
    verification_status: string;
    verification_timestamp: string;
    verifier_instance_id: string;
  }>;
  updateAttestation: (attestationId: string, updates: {
    status?: string;
    metadata?: Record<string, any>;
  }) => Promise<TrustAttestation>;
  deleteAttestation: (attestationId: string) => Promise<void>;
  
  // Metrics Actions
  loadMetrics: () => Promise<void>;
  
  // Utility Actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
  
  // Filter Actions
  filterAttestations: (filters: AttestationFilters) => TrustAttestation[];
}

export interface UseTrustAttestationsReturn extends UseTrustAttestationsState, UseTrustAttestationsActions {}

export const useTrustAttestations = (): UseTrustAttestationsReturn => {
  // State
  const [attestations, setAttestations] = useState<TrustAttestation[]>([]);
  const [attestationsLoading, setAttestationsLoading] = useState(false);
  const [attestationsError, setAttestationsError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<AttestationMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  
  const [creatingAttestation, setCreatingAttestation] = useState(false);
  const [verifyingAttestation, setVerifyingAttestation] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Attestation Actions
  const loadAttestations = useCallback(async (filters: AttestationFilters = {}) => {
    setAttestationsLoading(true);
    setAttestationsError(null);
    
    try {
      const result = await trustAttestationsBackendService.getAttestations(filters);
      setAttestations(result.attestations);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load attestations';
      setAttestationsError(errorMessage);
      console.error('Error loading attestations:', error);
    } finally {
      setAttestationsLoading(false);
    }
  }, []);

  const createAttestation = useCallback(async (attestationData: {
    attestation_type: string;
    subject_instance_id: string;
    subject_name: string;
    attester_instance_id: string;
    attester_name: string;
    attestation_data?: Record<string, any>;
    expires_at?: string;
    metadata?: Record<string, any>;
  }) => {
    setCreatingAttestation(true);
    setOperationError(null);
    
    try {
      const newAttestation = await trustAttestationsBackendService.createAttestation(attestationData);
      
      // Add to local state
      setAttestations(prev => [newAttestation, ...prev]);
      
      return newAttestation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create attestation';
      setOperationError(errorMessage);
      console.error('Error creating attestation:', error);
      throw error;
    } finally {
      setCreatingAttestation(false);
    }
  }, []);

  const verifyAttestation = useCallback(async (attestationId: string, verifierInstanceId: string) => {
    setVerifyingAttestation(true);
    setOperationError(null);
    
    try {
      const verificationResult = await trustAttestationsBackendService.verifyAttestation(attestationId, verifierInstanceId);
      
      // Update local state to reflect verification
      setAttestations(prev => prev.map(attestation => {
        if (attestation.attestation_id === attestationId) {
          return {
            ...attestation,
            verification_history: [
              ...attestation.verification_history,
              {
                timestamp: verificationResult.verification_timestamp,
                verification_status: verificationResult.verification_status as any,
                verifier_instance_id: verifierInstanceId
              }
            ]
          };
        }
        return attestation;
      }));
      
      return verificationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify attestation';
      setOperationError(errorMessage);
      console.error('Error verifying attestation:', error);
      throw error;
    } finally {
      setVerifyingAttestation(false);
    }
  }, []);

  const updateAttestation = useCallback(async (attestationId: string, updates: {
    status?: string;
    metadata?: Record<string, any>;
  }) => {
    setOperationError(null);
    
    try {
      const updatedAttestation = await trustAttestationsBackendService.updateAttestation(attestationId, updates);
      
      // Update local state
      setAttestations(prev => prev.map(attestation => 
        attestation.attestation_id === attestationId ? updatedAttestation : attestation
      ));
      
      return updatedAttestation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update attestation';
      setOperationError(errorMessage);
      console.error('Error updating attestation:', error);
      throw error;
    }
  }, []);

  const deleteAttestation = useCallback(async (attestationId: string) => {
    setOperationError(null);
    
    try {
      await trustAttestationsBackendService.deleteAttestation(attestationId);
      
      // Remove from local state
      setAttestations(prev => prev.filter(attestation => attestation.attestation_id !== attestationId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete attestation';
      setOperationError(errorMessage);
      console.error('Error deleting attestation:', error);
      throw error;
    }
  }, []);

  // Metrics Actions
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metricsData = await trustAttestationsBackendService.getMetrics();
      setMetrics(metricsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load metrics';
      setMetricsError(errorMessage);
      console.error('Error loading metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Utility Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadAttestations(),
      loadMetrics()
    ]);
  }, [loadAttestations, loadMetrics]);

  const clearErrors = useCallback(() => {
    setAttestationsError(null);
    setMetricsError(null);
    setOperationError(null);
  }, []);

  // Filter Actions
  const filterAttestations = useCallback((filters: AttestationFilters) => {
    let filtered = [...attestations];
    
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(a => a.attestation_type === filters.type);
    }
    
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    
    if (filters.subject) {
      filtered = filtered.filter(a => 
        a.subject_name.toLowerCase().includes(filters.subject!.toLowerCase()) ||
        a.subject_instance_id.includes(filters.subject!)
      );
    }
    
    if (filters.attester) {
      filtered = filtered.filter(a => 
        a.attester_name.toLowerCase().includes(filters.attester!.toLowerCase()) ||
        a.attester_instance_id.includes(filters.attester!)
      );
    }
    
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [attestations]);

  // Load initial data
  useEffect(() => {
    loadAttestations();
    loadMetrics();
  }, [loadAttestations, loadMetrics]);

  return {
    // State
    attestations,
    attestationsLoading,
    attestationsError,
    metrics,
    metricsLoading,
    metricsError,
    creatingAttestation,
    verifyingAttestation,
    operationError,
    
    // Actions
    loadAttestations,
    createAttestation,
    verifyAttestation,
    updateAttestation,
    deleteAttestation,
    loadMetrics,
    refreshAll,
    clearErrors,
    filterAttestations
  };
};

