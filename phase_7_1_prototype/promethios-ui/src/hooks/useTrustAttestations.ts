/**
 * Trust Attestations Backend Hook
 * 
 * React hook for managing trust attestations state and backend integration.
 * Provides state management for attestations, chains, and metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import trustAttestationsBackendService, {
  Attestation,
  AttestationChain,
  AttestationMetrics,
  CreateAttestationRequest,
  VerifyAttestationRequest
} from '../services/trustAttestationsBackendService';

interface UseTrustAttestationsState {
  // Attestations
  attestations: Attestation[];
  attestationsLoading: boolean;
  attestationsError: string | null;
  
  // Chains
  chains: AttestationChain[];
  chainsLoading: boolean;
  chainsError: string | null;
  
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
  loadAttestations: () => Promise<void>;
  createAttestation: (request: CreateAttestationRequest) => Promise<Attestation>;
  verifyAttestation: (request: VerifyAttestationRequest) => Promise<{
    attestation_id: string;
    verification_status: 'valid' | 'invalid' | 'expired' | 'revoked';
    verification_timestamp: string;
    verifier_instance_id: string;
  }>;
  revokeAttestation: (attestationId: string) => Promise<void>;
  
  // Chain Actions
  loadChains: () => Promise<void>;
  
  // Metrics Actions
  loadMetrics: () => Promise<void>;
  
  // Utility Actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
  
  // Filter Actions
  filterAttestations: (filters: {
    type?: string;
    status?: string;
    subject?: string;
    attester?: string;
  }) => Attestation[];
}

export interface UseTrustAttestationsReturn extends UseTrustAttestationsState, UseTrustAttestationsActions {}

export const useTrustAttestations = (): UseTrustAttestationsReturn => {
  // State
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [attestationsLoading, setAttestationsLoading] = useState(false);
  const [attestationsError, setAttestationsError] = useState<string | null>(null);
  
  const [chains, setChains] = useState<AttestationChain[]>([]);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [chainsError, setChainsError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<AttestationMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  
  const [creatingAttestation, setCreatingAttestation] = useState(false);
  const [verifyingAttestation, setVerifyingAttestation] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Attestation Actions
  const loadAttestations = useCallback(async () => {
    setAttestationsLoading(true);
    setAttestationsError(null);
    
    try {
      const attestationsData = await trustAttestationsBackendService.getAttestations();
      setAttestations(attestationsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load attestations';
      setAttestationsError(errorMessage);
      console.error('Error loading attestations:', error);
    } finally {
      setAttestationsLoading(false);
    }
  }, []);

  const createAttestation = useCallback(async (request: CreateAttestationRequest) => {
    setCreatingAttestation(true);
    setOperationError(null);
    
    try {
      const attestation = await trustAttestationsBackendService.createAttestation(request);
      setAttestations(prev => [...prev, attestation]);
      return attestation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create attestation';
      setOperationError(errorMessage);
      console.error('Error creating attestation:', error);
      throw error;
    } finally {
      setCreatingAttestation(false);
    }
  }, []);

  const verifyAttestation = useCallback(async (request: VerifyAttestationRequest) => {
    setVerifyingAttestation(true);
    setOperationError(null);
    
    try {
      const verification = await trustAttestationsBackendService.verifyAttestation(request);
      
      // Update the attestation's verification history
      setAttestations(prev => prev.map(attestation => {
        if (attestation.attestation_id === request.attestation_id) {
          return {
            ...attestation,
            verification_history: [
              {
                timestamp: verification.verification_timestamp,
                verification_status: verification.verification_status,
                verifier_instance_id: verification.verifier_instance_id
              },
              ...attestation.verification_history
            ]
          };
        }
        return attestation;
      }));
      
      return verification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify attestation';
      setOperationError(errorMessage);
      console.error('Error verifying attestation:', error);
      throw error;
    } finally {
      setVerifyingAttestation(false);
    }
  }, []);

  const revokeAttestation = useCallback(async (attestationId: string) => {
    setOperationError(null);
    
    try {
      await trustAttestationsBackendService.revokeAttestation(attestationId);
      
      // Update the attestation status
      setAttestations(prev => prev.map(attestation => 
        attestation.attestation_id === attestationId 
          ? { ...attestation, status: 'revoked' as const }
          : attestation
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke attestation';
      setOperationError(errorMessage);
      console.error('Error revoking attestation:', error);
      throw error;
    }
  }, []);

  // Chain Actions
  const loadChains = useCallback(async () => {
    setChainsLoading(true);
    setChainsError(null);
    
    try {
      const chainsData = await trustAttestationsBackendService.getAttestationChains();
      setChains(chainsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load attestation chains';
      setChainsError(errorMessage);
      console.error('Error loading attestation chains:', error);
    } finally {
      setChainsLoading(false);
    }
  }, []);

  // Metrics Actions
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metricsData = await trustAttestationsBackendService.getAttestationMetrics();
      setMetrics(metricsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load attestation metrics';
      setMetricsError(errorMessage);
      console.error('Error loading attestation metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Utility Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadAttestations(),
      loadChains(),
      loadMetrics()
    ]);
  }, [loadAttestations, loadChains, loadMetrics]);

  const clearErrors = useCallback(() => {
    setAttestationsError(null);
    setChainsError(null);
    setMetricsError(null);
    setOperationError(null);
  }, []);

  // Filter Actions
  const filterAttestations = useCallback((filters: {
    type?: string;
    status?: string;
    subject?: string;
    attester?: string;
  }) => {
    return attestations.filter(attestation => {
      if (filters.type && attestation.attestation_type !== filters.type) {
        return false;
      }
      if (filters.status && attestation.status !== filters.status) {
        return false;
      }
      if (filters.subject && !attestation.subject_name.toLowerCase().includes(filters.subject.toLowerCase())) {
        return false;
      }
      if (filters.attester && !attestation.attester_name.toLowerCase().includes(filters.attester.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [attestations]);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    // State
    attestations,
    attestationsLoading,
    attestationsError,
    chains,
    chainsLoading,
    chainsError,
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
    revokeAttestation,
    loadChains,
    loadMetrics,
    refreshAll,
    clearErrors,
    filterAttestations
  };
};

export default useTrustAttestations;

