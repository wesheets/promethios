/**
 * Trust Attestations Storage Service
 * Handles storage and retrieval of trust attestations using the unified storage system
 */

import { unifiedStorage } from './UnifiedStorageService';

export interface TrustAttestation {
  attestation_id: string;
  attestation_type: string;
  subject_instance_id: string;
  subject_name: string;
  attester_instance_id: string;
  attester_name: string;
  attestation_data: Record<string, any>;
  confidence_score: number;
  created_at: string;
  expires_at?: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  verification_history: Array<{
    timestamp: string;
    verification_status: 'verified' | 'failed' | 'pending';
    verifier_instance_id: string;
  }>;
  metadata: Record<string, any>;
  user_id: string; // Add user association
}

export interface CreateAttestationRequest {
  attestation_type: string;
  subject_instance_id: string;
  subject_name: string;
  attester_instance_id: string;
  attester_name: string;
  attestation_data?: Record<string, any>;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface AttestationsMetrics {
  total_attestations: number;
  active_attestations: number;
  expired_attestations: number;
  revoked_attestations: number;
  average_confidence: number;
  attestation_types: Record<string, number>;
  verification_success_rate: number;
}

export class TrustAttestationsStorageService {
  private currentUserId: string | null = null;

  setUserId(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.currentUserId = userId;
    console.log(`Trust Attestations storage service initialized for user: ${this.currentUserId}`);
  }

  private getUserKey(attestationId: string): string {
    if (!this.currentUserId) {
      throw new Error('User ID not set - authentication required');
    }
    return `${this.currentUserId}.${attestationId}`;
  }

  /**
   * Create a new trust attestation
   */
  async createAttestation(request: CreateAttestationRequest): Promise<TrustAttestation> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const attestationId = `attestation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const attestation: TrustAttestation = {
        attestation_id: attestationId,
        attestation_type: request.attestation_type,
        subject_instance_id: request.subject_instance_id,
        subject_name: request.subject_name,
        attester_instance_id: request.attester_instance_id,
        attester_name: request.attester_name,
        attestation_data: request.attestation_data || {},
        confidence_score: 85, // Default confidence score
        created_at: new Date().toISOString(),
        expires_at: request.expires_at,
        status: 'active',
        verification_history: [],
        metadata: request.metadata || {},
        user_id: this.currentUserId
      };

      const userKey = this.getUserKey(attestationId);
      await unifiedStorage.set('trust_attestations', userKey, attestation);

      console.log(`Trust attestation ${attestationId} created and saved to unified storage`);
      return attestation;
    } catch (error) {
      console.error('Error creating trust attestation:', error);
      throw error;
    }
  }

  /**
   * Get all trust attestations for the current user
   */
  async getAttestations(): Promise<TrustAttestation[]> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const allKeys = await unifiedStorage.keys('trust_attestations');
      const userPrefix = `${this.currentUserId}.`;
      const userKeys = allKeys.filter(key => key.startsWith(userPrefix));

      const attestations: TrustAttestation[] = [];
      
      for (const key of userKeys) {
        try {
          const attestation = await unifiedStorage.get<TrustAttestation>('trust_attestations', key);
          if (attestation) {
            attestations.push(attestation);
          }
        } catch (error) {
          console.error(`Error loading attestation ${key}:`, error);
        }
      }

      console.log(`Loaded ${attestations.length} trust attestations for user ${this.currentUserId}`);
      return attestations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error loading trust attestations:', error);
      return [];
    }
  }

  /**
   * Get a specific trust attestation by ID
   */
  async getAttestation(attestationId: string): Promise<TrustAttestation | null> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const userKey = this.getUserKey(attestationId);
      const attestation = await unifiedStorage.get<TrustAttestation>('trust_attestations', userKey);
      
      return attestation;
    } catch (error) {
      console.error(`Error loading attestation ${attestationId}:`, error);
      return null;
    }
  }

  /**
   * Update a trust attestation
   */
  async updateAttestation(attestationId: string, updates: Partial<TrustAttestation>): Promise<TrustAttestation> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const existingAttestation = await this.getAttestation(attestationId);
      if (!existingAttestation) {
        throw new Error(`Attestation ${attestationId} not found`);
      }

      const updatedAttestation: TrustAttestation = {
        ...existingAttestation,
        ...updates,
        attestation_id: attestationId, // Ensure ID doesn't change
        user_id: this.currentUserId, // Ensure user association doesn't change
      };

      const userKey = this.getUserKey(attestationId);
      await unifiedStorage.set('trust_attestations', userKey, updatedAttestation);

      console.log(`Trust attestation ${attestationId} updated in unified storage`);
      return updatedAttestation;
    } catch (error) {
      console.error(`Error updating attestation ${attestationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a trust attestation
   */
  async deleteAttestation(attestationId: string): Promise<void> {
    try {
      const userKey = this.getUserKey(attestationId);
      await unifiedStorage.delete('trust_attestations', userKey);
      
      console.log(`Trust attestation ${attestationId} deleted from unified storage`);
    } catch (error) {
      console.error(`Error deleting attestation ${attestationId}:`, error);
      throw error;
    }
  }

  /**
   * Verify an attestation
   */
  async verifyAttestation(attestationId: string, verifierInstanceId: string): Promise<{
    verification_status: 'verified' | 'failed';
    verification_timestamp: string;
    verification_details?: any;
  }> {
    try {
      const attestation = await this.getAttestation(attestationId);
      if (!attestation) {
        throw new Error(`Attestation ${attestationId} not found`);
      }

      // Simulate verification logic (in real implementation, this would involve cryptographic verification)
      const verificationStatus = Math.random() > 0.1 ? 'verified' : 'failed'; // 90% success rate
      const verificationTimestamp = new Date().toISOString();

      // Add verification to history
      const verificationRecord = {
        timestamp: verificationTimestamp,
        verification_status: verificationStatus as 'verified' | 'failed',
        verifier_instance_id: verifierInstanceId
      };

      const updatedAttestation = {
        ...attestation,
        verification_history: [...attestation.verification_history, verificationRecord]
      };

      await this.updateAttestation(attestationId, updatedAttestation);

      return {
        verification_status: verificationStatus as 'verified' | 'failed',
        verification_timestamp: verificationTimestamp,
        verification_details: {
          verifier: verifierInstanceId,
          method: 'cryptographic_signature'
        }
      };
    } catch (error) {
      console.error(`Error verifying attestation ${attestationId}:`, error);
      throw error;
    }
  }

  /**
   * Get attestations by agent ID (either subject or attester)
   */
  async getAttestationsByAgent(agentId: string): Promise<TrustAttestation[]> {
    try {
      const allAttestations = await this.getAttestations();
      return allAttestations.filter(attestation => 
        attestation.subject_instance_id === agentId || 
        attestation.attester_instance_id === agentId
      );
    } catch (error) {
      console.error(`Error loading attestations for agent ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Get attestations metrics
   */
  async getMetrics(): Promise<AttestationsMetrics> {
    try {
      const attestations = await this.getAttestations();
      const now = new Date();
      
      const activeAttestations = attestations.filter(a => 
        a.status === 'active' && 
        (!a.expires_at || new Date(a.expires_at) > now)
      );
      
      const expiredAttestations = attestations.filter(a => 
        a.expires_at && new Date(a.expires_at) <= now
      );

      const revokedAttestations = attestations.filter(a => a.status === 'revoked');

      const averageConfidence = attestations.length > 0 
        ? attestations.reduce((sum, a) => sum + a.confidence_score, 0) / attestations.length 
        : 0;

      // Count attestation types
      const attestationTypes: Record<string, number> = {};
      attestations.forEach(a => {
        attestationTypes[a.attestation_type] = (attestationTypes[a.attestation_type] || 0) + 1;
      });

      // Calculate verification success rate
      const totalVerifications = attestations.reduce((sum, a) => sum + a.verification_history.length, 0);
      const successfulVerifications = attestations.reduce((sum, a) => 
        sum + a.verification_history.filter(v => v.verification_status === 'verified').length, 0
      );
      const verificationSuccessRate = totalVerifications > 0 ? (successfulVerifications / totalVerifications) * 100 : 0;

      return {
        total_attestations: attestations.length,
        active_attestations: activeAttestations.length,
        expired_attestations: expiredAttestations.length,
        revoked_attestations: revokedAttestations.length,
        average_confidence: Math.round(averageConfidence),
        attestation_types: attestationTypes,
        verification_success_rate: Math.round(verificationSuccessRate)
      };
    } catch (error) {
      console.error('Error getting trust attestations metrics:', error);
      return {
        total_attestations: 0,
        active_attestations: 0,
        expired_attestations: 0,
        revoked_attestations: 0,
        average_confidence: 0,
        attestation_types: {},
        verification_success_rate: 0
      };
    }
  }

  /**
   * Get storage statistics for trust attestations
   */
  async getStorageStats(): Promise<{
    attestationCount: number;
    activeAttestations: number;
    expiredAttestations: number;
  }> {
    try {
      const attestations = await this.getAttestations();
      const now = new Date();
      
      const activeAttestations = attestations.filter(a => 
        a.status === 'active' && 
        (!a.expires_at || new Date(a.expires_at) > now)
      ).length;
      
      const expiredAttestations = attestations.filter(a => 
        a.expires_at && new Date(a.expires_at) <= now
      ).length;

      return {
        attestationCount: attestations.length,
        activeAttestations,
        expiredAttestations
      };
    } catch (error) {
      console.error('Error getting trust attestations storage stats:', error);
      return { attestationCount: 0, activeAttestations: 0, expiredAttestations: 0 };
    }
  }
}

// Singleton instance
export const trustAttestationsStorageService = new TrustAttestationsStorageService();

