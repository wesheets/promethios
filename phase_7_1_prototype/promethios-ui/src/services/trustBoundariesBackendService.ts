/**
 * Trust Boundaries Backend Service
 * Handles communication with the trust boundaries API endpoints
 */

import { API_BASE_URL } from '../config/api';

export interface TrustBoundary {
  boundary_id: string;
  source_instance_id: string;
  target_instance_id: string;
  source_name: string;
  target_name: string;
  trust_level: number;
  boundary_type: 'direct' | 'delegated' | 'transitive' | 'federated';
  status: 'active' | 'suspended' | 'expired' | 'pending_deployment';
  created_at: string;
  expires_at?: string;
  policies: Array<{
    policy_id: string;
    policy_type: 'access' | 'data' | 'operation' | 'resource';
    policy_config: any;
  }>;
  attestations: string[];
  metadata: any;
}

export interface CreateBoundaryRequest {
  source_instance_id: string;
  target_instance_id: string;
  source_name?: string;
  target_name?: string;
  trust_level?: number;
  boundary_type: 'direct' | 'delegated' | 'transitive' | 'federated';
  policies?: Array<{
    policy_type: 'access' | 'data' | 'operation' | 'resource';
    policy_config: any;
  }>;
  expires_at?: string;
  metadata?: any;
}

export interface CreateThresholdRequest {
  name: string;
  description: string;
  min_trust_level: number;
  max_trust_level: number;
  agent_types: string[];
  actions: {
    alert: boolean;
    quarantine: boolean;
    disable: boolean;
    retrain: boolean;
  };
}

export interface TrustBoundaryMetrics {
  active_boundaries: number;
  total_boundaries: number;
  average_trust_level: number;
  at_risk_boundaries: number;
  active_policies: number;
  timestamp: string;
}

class TrustBoundariesBackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/trust`;
  }

  /**
   * Get all trust boundaries
   */
  async getBoundaries(): Promise<TrustBoundary[]> {
    try {
      const response = await fetch('/api/trust/boundaries');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.boundaries || [];
    } catch (error) {
      console.error('Error fetching trust boundaries:', error);
      // Return empty array if API is not available (agents not deployed)
      return [];
    }
  }

  /**
   * Create a new trust boundary
   */
  async createBoundary(request: CreateBoundaryRequest): Promise<TrustBoundary> {
    try {
      const response = await fetch('/api/trust/boundaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const boundary = await response.json();
      return boundary;
    } catch (error) {
      console.error('Error creating trust boundary:', error);
      throw error;
    }
  }

  /**
   * Update a trust boundary
   */
  async updateBoundary(boundaryId: string, updates: Partial<TrustBoundary>): Promise<TrustBoundary> {
    try {
      const response = await fetch(`/api/trust/boundaries/${boundaryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const boundary = await response.json();
      return boundary;
    } catch (error) {
      console.error('Error updating trust boundary:', error);
      throw error;
    }
  }

  /**
   * Delete a trust boundary
   */
  async deleteBoundary(boundaryId: string): Promise<void> {
    try {
      const response = await fetch(`/api/trust/boundaries/${boundaryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting trust boundary:', error);
      throw error;
    }
  }

  /**
   * Get trust boundary metrics
   */
  async getMetrics(): Promise<TrustBoundaryMetrics> {
    try {
      const response = await fetch('/api/trust/metrics');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const metrics = await response.json();
      return metrics;
    } catch (error) {
      console.error('Error fetching trust boundary metrics:', error);
      // Return default metrics if API is not available
      return {
        active_boundaries: 0,
        total_boundaries: 0,
        average_trust_level: 0,
        at_risk_boundaries: 0,
        active_policies: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get a specific trust boundary
   */
  async getBoundary(boundaryId: string): Promise<TrustBoundary | null> {
    try {
      const response = await fetch(`/api/trust/boundaries/${boundaryId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const boundary = await response.json();
      return boundary;
    } catch (error) {
      console.error('Error fetching trust boundary:', error);
      return null;
    }
  }

  /**
   * Create a trust threshold configuration
   */
  async createThreshold(request: CreateThresholdRequest): Promise<any> {
    try {
      // This would be implemented when threshold management is added
      console.log('Creating trust threshold:', request);
      return { success: true, message: 'Threshold creation not yet implemented' };
    } catch (error) {
      console.error('Error creating threshold:', error);
      throw error;
    }
  }

  /**
   * Get industry standard templates
   */
  async getIndustryStandards(): Promise<any[]> {
    try {
      // Return predefined industry standards
      return [
        {
          id: 'financial_services',
          name: 'Financial Services',
          description: 'Compliance templates for financial institutions',
          trust_levels: {
            high: 95,
            medium: 85,
            low: 70
          },
          policies: ['data_encryption', 'audit_logging', 'access_control']
        },
        {
          id: 'healthcare',
          name: 'Healthcare (HIPAA)',
          description: 'HIPAA-compliant trust boundaries for healthcare data',
          trust_levels: {
            high: 98,
            medium: 90,
            low: 80
          },
          policies: ['hipaa_compliance', 'data_minimization', 'audit_trail']
        },
        {
          id: 'government',
          name: 'Government/Defense',
          description: 'High-security trust boundaries for government systems',
          trust_levels: {
            high: 99,
            medium: 95,
            low: 85
          },
          policies: ['security_clearance', 'classification_handling', 'need_to_know']
        }
      ];
    } catch (error) {
      console.error('Error fetching industry standards:', error);
      return [];
    }
  }

  /**
   * Get policy mapping configurations
   */
  async getPolicyMappings(): Promise<any[]> {
    try {
      // Return predefined policy mappings
      return [
        {
          id: 'access_control',
          name: 'Access Control Policy',
          description: 'Controls agent access to resources and operations',
          trust_requirements: {
            minimum: 70,
            recommended: 85
          }
        },
        {
          id: 'data_sharing',
          name: 'Data Sharing Policy',
          description: 'Governs how agents can share sensitive data',
          trust_requirements: {
            minimum: 80,
            recommended: 90
          }
        },
        {
          id: 'operation_execution',
          name: 'Operation Execution Policy',
          description: 'Controls which operations agents can perform',
          trust_requirements: {
            minimum: 75,
            recommended: 85
          }
        }
      ];
    } catch (error) {
      console.error('Error fetching policy mappings:', error);
      return [];
    }
  }
}

export const trustBoundariesBackendService = new TrustBoundariesBackendService();

