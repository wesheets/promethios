/**
 * Trust Attestations Backend Service
 * Handles trust attestations using unified storage with API fallback
 */

import { API_BASE_URL } from '../config/api';
import { 
  trustAttestationsStorageService, 
  TrustAttestation, 
  CreateAttestationRequest,
  AttestationsMetrics 
} from './TrustAttestationsStorageService';

export interface VerifyAttestationRequest {
  verifier_instance_id: string;
  verification_method?: string;
}

export interface VerifyAttestationResponse {
  verification_status: 'verified' | 'failed';
  verification_timestamp: string;
  verification_details?: any;
}

class TrustAttestationsBackendService {
  private baseUrl: string;
  private useUnifiedStorage: boolean = true;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/attestations`;
  }

  /**
   * Initialize the service with user authentication
   */
  async initialize(userId: string): Promise<void> {
    try {
      trustAttestationsStorageService.setUserId(userId);
      console.log('Trust Attestations service initialized with unified storage');
    } catch (error) {
      console.error('Error initializing Trust Attestations service:', error);
      this.useUnifiedStorage = false;
    }
  }

  /**
   * Create a new trust attestation
   */
  async createAttestation(request: CreateAttestationRequest): Promise<TrustAttestation> {
    try {
      if (this.useUnifiedStorage) {
        // Use unified storage (primary method)
        return await trustAttestationsStorageService.createAttestation(request);
      } else {
        // Fallback to API
        return await this.createAttestationViaAPI(request);
      }
    } catch (error) {
      console.error('Error creating attestation:', error);
      // Try API fallback if unified storage fails
      if (this.useUnifiedStorage) {
        console.log('Falling back to API for attestation creation');
        return await this.createAttestationViaAPI(request);
      }
      throw error;
    }
  }

  /**
   * Get all trust attestations
   */
  async getAttestations(): Promise<TrustAttestation[]> {
    try {
      if (this.useUnifiedStorage) {
        // Use unified storage (primary method)
        return await trustAttestationsStorageService.getAttestations();
      } else {
        // Fallback to API
        return await this.getAttestationsViaAPI();
      }
    } catch (error) {
      console.error('Error getting attestations:', error);
      // Try API fallback if unified storage fails
      if (this.useUnifiedStorage) {
        console.log('Falling back to API for attestations retrieval');
        return await this.getAttestationsViaAPI();
      }
      return [];
    }
  }

  /**
   * Get a specific trust attestation
   */
  async getAttestation(attestationId: string): Promise<TrustAttestation | null> {
    try {
      if (this.useUnifiedStorage) {
        return await trustAttestationsStorageService.getAttestation(attestationId);
      } else {
        return await this.getAttestationViaAPI(attestationId);
      }
    } catch (error) {
      console.error(`Error getting attestation ${attestationId}:`, error);
      return null;
    }
  }

  /**
   * Update a trust attestation
   */
  async updateAttestation(attestationId: string, updates: Partial<TrustAttestation>): Promise<TrustAttestation> {
    try {
      if (this.useUnifiedStorage) {
        return await trustAttestationsStorageService.updateAttestation(attestationId, updates);
      } else {
        return await this.updateAttestationViaAPI(attestationId, updates);
      }
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
      if (this.useUnifiedStorage) {
        await trustAttestationsStorageService.deleteAttestation(attestationId);
      } else {
        await this.deleteAttestationViaAPI(attestationId);
      }
    } catch (error) {
      console.error(`Error deleting attestation ${attestationId}:`, error);
      throw error;
    }
  }

  /**
   * Verify an attestation
   */
  async verifyAttestation(attestationId: string, request: VerifyAttestationRequest): Promise<VerifyAttestationResponse> {
    try {
      if (this.useUnifiedStorage) {
        return await trustAttestationsStorageService.verifyAttestation(attestationId, request.verifier_instance_id);
      } else {
        return await this.verifyAttestationViaAPI(attestationId, request);
      }
    } catch (error) {
      console.error(`Error verifying attestation ${attestationId}:`, error);
      throw error;
    }
  }

  /**
   * Get attestations by agent ID
   */
  async getAgentAttestations(agentId: string): Promise<TrustAttestation[]> {
    try {
      if (this.useUnifiedStorage) {
        return await trustAttestationsStorageService.getAttestationsByAgent(agentId);
      } else {
        return await this.getAgentAttestationsViaAPI(agentId);
      }
    } catch (error) {
      console.error(`Error getting attestations for agent ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Get attestations metrics
   */
  async getMetrics(): Promise<AttestationsMetrics> {
    try {
      if (this.useUnifiedStorage) {
        return await trustAttestationsStorageService.getMetrics();
      } else {
        return await this.getMetricsViaAPI();
      }
    } catch (error) {
      console.error('Error getting attestations metrics:', error);
      // Return default metrics on error
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
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; storage_type: string; user_authenticated: boolean }> {
    try {
      return {
        status: 'healthy',
        storage_type: this.useUnifiedStorage ? 'unified_storage' : 'api_fallback',
        user_authenticated: trustAttestationsStorageService['currentUserId'] !== null
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        storage_type: 'unknown',
        user_authenticated: false
      };
    }
  }

  // API Fallback Methods
  private async createAttestationViaAPI(request: CreateAttestationRequest): Promise<TrustAttestation> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private async getAttestationsViaAPI(): Promise<TrustAttestation[]> {
    const response = await fetch(`${this.baseUrl}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.attestations || [];
  }

  private async getAttestationViaAPI(attestationId: string): Promise<TrustAttestation | null> {
    const response = await fetch(`${this.baseUrl}/${attestationId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private async updateAttestationViaAPI(attestationId: string, updates: Partial<TrustAttestation>): Promise<TrustAttestation> {
    const response = await fetch(`${this.baseUrl}/${attestationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private async deleteAttestationViaAPI(attestationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${attestationId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  private async verifyAttestationViaAPI(attestationId: string, request: VerifyAttestationRequest): Promise<VerifyAttestationResponse> {
    const response = await fetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attestation_id: attestationId,
        ...request
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private async getAgentAttestationsViaAPI(agentId: string): Promise<TrustAttestation[]> {
    const response = await fetch(`${this.baseUrl}/agent/${agentId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.attestations || [];
  }

  private async getMetricsViaAPI(): Promise<AttestationsMetrics> {
    const response = await fetch(`${this.baseUrl}/metrics`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

export const trustAttestationsBackendService = new TrustAttestationsBackendService();

