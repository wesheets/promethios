/**
 * Trust Boundaries Backend Service
 * 
 * Service layer for trust boundaries management using existing trust evaluation APIs.
 * Since specific boundary APIs don't exist, we'll use trust evaluations to simulate boundaries.
 */

import { API_BASE_URL } from '../config/api';
import { trustBackendService, TrustEvaluation } from './trustBackendService';

export interface TrustBoundary {
  boundary_id: string;
  source_instance_id: string;
  target_instance_id: string;
  source_name: string;
  target_name: string;
  trust_level: number;
  boundary_type: 'direct' | 'delegated' | 'transitive' | 'federated';
  status: 'active' | 'revoked' | 'expired' | 'suspended';
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

export interface TrustThreshold {
  threshold_id: string;
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
  industry_standard: boolean;
}

export interface CreateBoundaryRequest {
  source_instance_id: string;
  target_instance_id: string;
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

class TrustBoundariesBackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/trust`;
  }

  /**
   * Get all trust boundaries (only show real data for deployed agents)
   */
  async getBoundaries(): Promise<TrustBoundary[]> {
    try {
      // Load real agent data (same as Trust Metrics)
      const userAgentStorageService = (await import('./UserAgentStorageService')).userAgentStorageService;
      const agents = await userAgentStorageService.loadUserAgents();
      
      // Add multi-agent system if not present
      const hasMultiAgent = agents.some(agent => agent.identity?.name?.includes('Multi-Agent'));
      if (!hasMultiAgent) {
        agents.push({
          identity: {
            id: 'test-multi-agent-system',
            name: 'Test Multi-Agent System',
            description: 'Test multi-agent system for boundary testing',
            status: 'active'
          }
        });
      }
      
      // Only create boundaries for actually deployed agents
      const deployedAgents = agents.filter(agent => 
        agent.deploymentStatus === 'deployed' && 
        agent.healthStatus && 
        agent.lastActivity
      );
      
      // If no agents are deployed, return empty array (will show N/A in UI)
      if (deployedAgents.length === 0) {
        return [];
      }
      
      // Create real boundaries only between deployed agents
      const boundaries: TrustBoundary[] = [];
      
      for (let i = 0; i < deployedAgents.length; i++) {
        for (let j = i + 1; j < deployedAgents.length; j++) {
          const sourceAgent = deployedAgents[i];
          const targetAgent = deployedAgents[j];
          
          if (sourceAgent.identity?.id && targetAgent.identity?.id) {
            // Use real trust data from deployed agents
            const trustLevel = sourceAgent.trustScore || 0;
            const boundaryType = trustLevel > 85 ? 'direct' : 'delegated';
            
            boundaries.push({
              boundary_id: `boundary_${sourceAgent.identity.id}_${targetAgent.identity.id}`,
              source_instance_id: sourceAgent.identity.id,
              target_instance_id: targetAgent.identity.id,
              source_name: sourceAgent.identity.name || 'Unknown Agent',
              target_name: targetAgent.identity.name || 'Unknown Agent',
              trust_level: Math.round(trustLevel * 100),
              boundary_type: boundaryType as any,
              status: trustLevel > 70 ? 'active' : 'suspended',
              created_at: sourceAgent.lastActivity?.toISOString() || new Date().toISOString(),
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              policies: [
                {
                  policy_id: `policy_${sourceAgent.identity.id}_${targetAgent.identity.id}`,
                  policy_type: 'access',
                  policy_config: { 
                    max_requests_per_hour: trustLevel > 85 ? 10000 : 1000,
                    allowed_operations: trustLevel > 85 ? ['read', 'write', 'execute'] : ['read']
                  }
                }
              ],
              attestations: [`attestation_${sourceAgent.identity.id}_${targetAgent.identity.id}`],
              metadata: {
                created_by: 'deployment_system',
                trust_based: true,
                source_deployment: sourceAgent.deploymentStatus,
                target_deployment: targetAgent.deploymentStatus
              }
            });
          }
        }
      }
      
      return boundaries;
    } catch (error) {
      console.error('Error fetching trust boundaries:', error);
      return [];
    }
  }

  /**
   * Create a new trust boundary (simulated)
   */
  async createBoundary(request: CreateBoundaryRequest): Promise<TrustBoundary> {
    try {
      // Simulate boundary creation by creating a trust evaluation
      const trustRequest = {
        agent_id: request.source_instance_id,
        target_id: request.target_instance_id,
        context: {
          boundary_type: request.boundary_type,
          creation_request: true
        },
        evidence: [
          {
            type: 'boundary_creation',
            timestamp: new Date().toISOString(),
            details: {
              boundary_type: request.boundary_type,
              policies: request.policies || []
            }
          }
        ],
        trust_dimensions: ['competence', 'reliability', 'honesty', 'transparency']
      };

      const evaluation = await trustBackendService.evaluateTrust(trustRequest);

      const boundary: TrustBoundary = {
        boundary_id: `boundary_${evaluation.evaluation_id}`,
        source_instance_id: request.source_instance_id,
        target_instance_id: request.target_instance_id,
        source_name: `Agent ${request.source_instance_id}`,
        target_name: `Target ${request.target_instance_id}`,
        trust_level: Math.round(evaluation.trust_score * 100),
        boundary_type: request.boundary_type,
        status: 'active',
        created_at: evaluation.evaluation_timestamp,
        expires_at: request.expires_at,
        policies: request.policies?.map((policy, index) => ({
          policy_id: `policy_${evaluation.evaluation_id}_${index}`,
          policy_type: policy.policy_type,
          policy_config: policy.policy_config
        })) || [],
        attestations: [`attestation_${evaluation.evaluation_id}`],
        metadata: request.metadata || {}
      };

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
      // Simulate boundary update
      const boundaries = await this.getBoundaries();
      const boundary = boundaries.find(b => b.boundary_id === boundaryId);
      
      if (!boundary) {
        throw new Error(`Boundary ${boundaryId} not found`);
      }

      const updatedBoundary = { ...boundary, ...updates };
      return updatedBoundary;
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
      // Simulate boundary deletion
      console.log(`Boundary ${boundaryId} marked for deletion`);
    } catch (error) {
      console.error('Error deleting trust boundary:', error);
      throw error;
    }
  }

  /**
   * Get trust thresholds (simulated)
   */
  async getThresholds(): Promise<TrustThreshold[]> {
    try {
      // Return predefined trust thresholds
      const thresholds: TrustThreshold[] = [
        {
          threshold_id: 'threshold_high_trust',
          name: 'High Trust Threshold',
          description: 'Threshold for high-trust operations requiring minimal oversight',
          min_trust_level: 85,
          max_trust_level: 100,
          agent_types: ['financial', 'medical', 'legal'],
          actions: {
            alert: false,
            quarantine: false,
            disable: false,
            retrain: false
          },
          industry_standard: true
        },
        {
          threshold_id: 'threshold_medium_trust',
          name: 'Medium Trust Threshold',
          description: 'Threshold for standard operations with moderate oversight',
          min_trust_level: 70,
          max_trust_level: 84,
          agent_types: ['general', 'support', 'analysis'],
          actions: {
            alert: true,
            quarantine: false,
            disable: false,
            retrain: false
          },
          industry_standard: true
        },
        {
          threshold_id: 'threshold_low_trust',
          name: 'Low Trust Threshold',
          description: 'Threshold for low-trust agents requiring strict oversight',
          min_trust_level: 0,
          max_trust_level: 69,
          agent_types: ['experimental', 'untested', 'new'],
          actions: {
            alert: true,
            quarantine: true,
            disable: false,
            retrain: true
          },
          industry_standard: false
        }
      ];

      return thresholds;
    } catch (error) {
      console.error('Error fetching trust thresholds:', error);
      return [];
    }
  }

  /**
   * Create a new trust threshold
   */
  async createThreshold(request: CreateThresholdRequest): Promise<TrustThreshold> {
    try {
      const threshold: TrustThreshold = {
        threshold_id: `threshold_${Date.now()}`,
        name: request.name,
        description: request.description,
        min_trust_level: request.min_trust_level,
        max_trust_level: request.max_trust_level,
        agent_types: request.agent_types,
        actions: request.actions,
        industry_standard: false
      };

      return threshold;
    } catch (error) {
      console.error('Error creating trust threshold:', error);
      throw error;
    }
  }

  /**
   * Update a trust threshold
   */
  async updateThreshold(thresholdId: string, updates: Partial<TrustThreshold>): Promise<TrustThreshold> {
    try {
      const thresholds = await this.getThresholds();
      const threshold = thresholds.find(t => t.threshold_id === thresholdId);
      
      if (!threshold) {
        throw new Error(`Threshold ${thresholdId} not found`);
      }

      const updatedThreshold = { ...threshold, ...updates };
      return updatedThreshold;
    } catch (error) {
      console.error('Error updating trust threshold:', error);
      throw error;
    }
  }

  /**
   * Delete a trust threshold
   */
  async deleteThreshold(thresholdId: string): Promise<void> {
    try {
      console.log(`Threshold ${thresholdId} marked for deletion`);
    } catch (error) {
      console.error('Error deleting trust threshold:', error);
      throw error;
    }
  }

  /**
   * Get boundary metrics
   */
  async getBoundaryMetrics(): Promise<{
    total_boundaries: number;
    active_boundaries: number;
    expired_boundaries: number;
    average_trust_level: number;
    boundary_types: Record<string, number>;
  }> {
    try {
      const boundaries = await this.getBoundaries();
      
      const metrics = {
        total_boundaries: boundaries.length,
        active_boundaries: boundaries.filter(b => b.status === 'active').length,
        expired_boundaries: boundaries.filter(b => b.status === 'expired').length,
        average_trust_level: boundaries.reduce((sum, b) => sum + b.trust_level, 0) / boundaries.length || 0,
        boundary_types: boundaries.reduce((acc, b) => {
          acc[b.boundary_type] = (acc[b.boundary_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return metrics;
    } catch (error) {
      console.error('Error fetching boundary metrics:', error);
      return {
        total_boundaries: 0,
        active_boundaries: 0,
        expired_boundaries: 0,
        average_trust_level: 0,
        boundary_types: {}
      };
    }
  }
}

export const trustBoundariesBackendService = new TrustBoundariesBackendService();
export default trustBoundariesBackendService;

