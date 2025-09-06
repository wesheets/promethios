/**
 * Trust Attestations Backend Service
 * 
 * Provides API integration for managing trust attestations.
 * Now connected to real backend API endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

export interface TrustAttestation {
  attestation_id: string;
  attestation_type: 'identity' | 'capability' | 'compliance' | 'integrity' | 'behavior';
  subject_instance_id: string;
  subject_name: string;
  attester_instance_id: string;
  attester_name: string;
  attestation_data: Record<string, any>;
  created_at: string;
  expires_at?: string;
  status: 'active' | 'revoked' | 'expired';
  signature: string;
  verification_history: VerificationRecord[];
  metadata: Record<string, any>;
  confidence_score: number;
  trust_impact: number;
}

export interface VerificationRecord {
  timestamp: string;
  verification_status: 'valid' | 'invalid' | 'expired' | 'revoked';
  verifier_instance_id: string;
}

export interface AttestationMetrics {
  total_attestations: number;
  active_attestations: number;
  expired_attestations: number;
  revoked_attestations: number;
  attestations_by_type: Record<string, number>;
  average_confidence_score: number;
  verification_success_rate: number;
  recent_attestations: number;
}

export interface AttestationFilters {
  type?: string;
  status?: string;
  subject?: string;
  attester?: string;
  limit?: number;
}

class TrustAttestationsBackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get all attestations with optional filtering
   */
  async getAttestations(filters: AttestationFilters = {}): Promise<{
    attestations: TrustAttestation[];
    total: number;
    filtered: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.subject) queryParams.append('subject', filters.subject);
      if (filters.attester) queryParams.append('attester', filters.attester);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const url = `${this.baseUrl}/api/attestations?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching attestations:', error);
      throw error;
    }
  }

  /**
   * Create a new attestation
   */
  async createAttestation(attestationData: {
    attestation_type: string;
    subject_instance_id: string;
    subject_name: string;
    attester_instance_id: string;
    attester_name: string;
    attestation_data?: Record<string, any>;
    expires_at?: string;
    metadata?: Record<string, any>;
  }): Promise<TrustAttestation> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attestations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attestationData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating attestation:', error);
      throw error;
    }
  }

  /**
   * Get a specific attestation by ID
   */
  async getAttestation(attestationId: string): Promise<TrustAttestation> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attestations/${attestationId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching attestation:', error);
      throw error;
    }
  }

  /**
   * Update an attestation (status and metadata only)
   */
  async updateAttestation(attestationId: string, updates: {
    status?: string;
    metadata?: Record<string, any>;
  }): Promise<TrustAttestation> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attestations/${attestationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating attestation:', error);
      throw error;
    }
  }

  /**
   * Delete an attestation
   */
  async deleteAttestation(attestationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attestations/${attestationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting attestation:', error);
      throw error;
    }
  }

  /**
   * Verify an attestation
   */
  async verifyAttestation(attestationId: string, verifierInstanceId: string): Promise<{
    attestation_id: string;
    verification_status: string;
    verification_timestamp: string;
    verifier_instance_id: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attestations/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attestation_id: attestationId,
          verifier_instance_id: verifierInstanceId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error verifying attestation:', error);
      throw error;
    }
  }

  /**
   * Get attestation metrics
   */
  async getMetrics(): Promise<AttestationMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attestations/metrics`);
      
      if (!response.ok) {
        // If metrics endpoint fails, return default metrics
        console.warn(`Metrics endpoint returned ${response.status}, using default metrics`);
        return {
          total_attestations: 0,
          active_attestations: 0,
          expired_attestations: 0,
          revoked_attestations: 0,
          attestations_by_type: {},
          average_confidence_score: 0,
          verification_success_rate: 0,
          recent_attestations: 0
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Return default metrics instead of throwing
      return {
        total_attestations: 0,
        active_attestations: 0,
        expired_attestations: 0,
        revoked_attestations: 0,
        attestations_by_type: {},
        average_confidence_score: 0,
        verification_success_rate: 0,
        recent_attestations: 0
      };
    }
  }

  /**
   * Get attestations for a specific agent
   */
  async getAgentAttestations(agentId: string): Promise<{
    agent_id: string;
    attestations: TrustAttestation[];
    total: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attestations/agent/${agentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching agent attestations:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attestations/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }
}

export const trustAttestationsBackendService = new TrustAttestationsBackendService();

