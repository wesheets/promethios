/**
 * Trust Attestations Backend Service
 * 
 * Provides API integration for managing trust attestations.
 * Now connected to real backend API endpoints.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

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
    this.baseUrl = `${API_BASE_URL}/api/attestations`;
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

      const url = `${this.baseUrl}?${queryParams.toString()}`;
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
      const response = await fetch(this.baseUrl, {
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
      const response = await fetch(`${this.baseUrl}/${attestationId}`);
      
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
      const response = await fetch(`${this.baseUrl}/${attestationId}`, {
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
      const response = await fetch(`${this.baseUrl}/${attestationId}`, {
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
      const response = await fetch(`${this.baseUrl}/verify`, {
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
      const response = await fetch(`${this.baseUrl}/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
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
      const response = await fetch(`${this.baseUrl}/agent/${agentId}`);
      
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
      const response = await fetch(`${this.baseUrl}/health`);
      
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

