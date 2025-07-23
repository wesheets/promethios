/**
 * Trust Attestations Hook
 * 
 * React hook for managing trust attestations state and backend integration.
 * Provides state management for attestations, metrics, and operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { trustAttestationsBackendService } from '../services/trustAttestationsBackendService';
import { TrustAttestation, CreateAttestationRequest, AttestationsMetrics } from '../services/TrustAttestationsStorageService';
import { observerIntegrationService } from '../services/observerIntegrationService';
import { notificationService } from '../services/notificationService';

// Default metrics fallback
const DEFAULT_METRICS: AttestationMetrics = {
  total_attestations: 0,
  active_attestations: 0,
  expired_attestations: 0,
  revoked_attestations: 0,
  attestations_by_type: {
    identity: 0,
    capability: 0,
    compliance: 0,
    integrity: 0,
    behavior: 0
  },
  average_confidence_score: 0,
  verification_success_rate: 0,
  recent_attestations: 0
};

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
  const { user } = useAuth();
  
  // State
  const [attestations, setAttestations] = useState<TrustAttestation[]>([]);
  const [attestationsLoading, setAttestationsLoading] = useState(false);
  const [attestationsError, setAttestationsError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<AttestationMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  
  const [creatingAttestation, setCreatingAttestation] = useState(false);

  // Initialize service with user authentication
  useEffect(() => {
    if (user?.uid) {
      trustAttestationsBackendService.initialize(user.uid).catch(error => {
        console.error('Failed to initialize Trust Attestations service:', error);
      });
    }
  }, [user?.uid]);
  const [verifyingAttestation, setVerifyingAttestation] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Attestation Actions
  const loadAttestations = useCallback(async (filters: AttestationFilters = {}) => {
    setAttestationsLoading(true);
    setAttestationsError(null);
    
    try {
      const response = await trustAttestationsBackendService.getAttestations(filters);
      setAttestations(response.attestations);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load attestations';
      console.warn('Attestations API failed:', errorMessage);
      
      // Set empty array instead of breaking the UI
      setAttestations([]);
      setAttestationsError(`API unavailable: ${errorMessage}`);
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
      
      // Notify observer about attestation creation
      try {
        await observerIntegrationService.notifyAttestationCreated(newAttestation);
      } catch (observerError) {
        console.warn('Failed to notify observer about attestation creation:', observerError);
        // Don't fail the entire operation if observer notification fails
      }
      
      // Send notification about attestation creation
      try {
        await notificationService.notifyAttestationCreated(newAttestation);
      } catch (notificationError) {
        console.warn('Failed to send notification about attestation creation:', notificationError);
        // Don't fail the entire operation if notification fails
      }
      
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
      
      // Notify observer about attestation verification
      try {
        await observerIntegrationService.notifyAttestationVerified(
          attestationId, 
          verificationResult.verification_status, 
          verifierInstanceId
        );
      } catch (observerError) {
        console.warn('Failed to notify observer about attestation verification:', observerError);
        // Don't fail the entire operation if observer notification fails
      }
      
      // Send notification about attestation verification
      try {
        const attestation = attestations.find(a => a.attestation_id === attestationId);
        const agentName = attestation?.subject_name || 'Unknown Agent';
        await notificationService.notifyAttestationVerified(
          attestationId, 
          verificationResult.verification_status, 
          agentName
        );
      } catch (notificationError) {
        console.warn('Failed to send notification about attestation verification:', notificationError);
        // Don't fail the entire operation if notification fails
      }
      
      return verificationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify attestation';
      setOperationError(errorMessage);
      
      // Notify observer about verification failure
      try {
        await observerIntegrationService.notifyVerificationFailed(
          attestationId, 
          verifierInstanceId, 
          'Verifier Agent', 
          errorMessage
        );
      } catch (observerError) {
        console.warn('Failed to notify observer about verification failure:', observerError);
      }
      
      // Send notification about verification failure
      try {
        const attestation = attestations.find(a => a.attestation_id === attestationId);
        const agentName = attestation?.subject_name || 'Unknown Agent';
        await notificationService.notifyVerificationFailed(
          attestationId, 
          verifierInstanceId, 
          agentName, 
          errorMessage
        );
      } catch (notificationError) {
        console.warn('Failed to send notification about verification failure:', notificationError);
      }
      
      console.error('Error verifying attestation:', error);
      throw error;
    } finally {
      setVerifyingAttestation(false);
    }
  }, [attestations]);

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
      
      // Notify observer about status changes (especially revocations)
      if (updates.status === 'revoked') {
        try {
          const revocationReason = updates.metadata?.revocation_reason || 'No reason provided';
          await observerIntegrationService.notifyAttestationRevoked(updatedAttestation, revocationReason);
        } catch (observerError) {
          console.warn('Failed to notify observer about attestation revocation:', observerError);
        }
        
        // Send notification about attestation revocation
        try {
          await notificationService.notifyAttestationRevoked(updatedAttestation, revocationReason);
        } catch (notificationError) {
          console.warn('Failed to send notification about attestation revocation:', notificationError);
        }
      }
      
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
      console.warn('Metrics API failed, using default metrics:', errorMessage);
      
      // Use default metrics instead of showing error
      setMetrics(DEFAULT_METRICS);
      
      // Only set error for debugging, don't break the UI
      setMetricsError(`API unavailable (using defaults): ${errorMessage}`);
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
    // Defensive coding: ensure attestations is an array
    const attestationsArray = Array.isArray(attestations) ? attestations : [];
    let filtered = [...attestationsArray];
    
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

