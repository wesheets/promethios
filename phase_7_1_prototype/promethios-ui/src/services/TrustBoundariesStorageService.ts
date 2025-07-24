/**
 * Trust Boundaries Storage Service
 * Handles storage and retrieval of trust boundaries using the unified storage system
 */

import { unifiedStorage } from './UnifiedStorageService';
import { useAuth } from '../context/AuthContext';

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
  user_id: string; // Add user association
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

export class TrustBoundariesStorageService {
  private currentUserId: string | null = null;

  setUserId(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.currentUserId = userId;
    console.log(`Trust Boundaries storage service initialized for user: ${this.currentUserId}`);
  }

  private getUserKey(boundaryId: string): string {
    if (!this.currentUserId) {
      throw new Error('User ID not set - authentication required');
    }
    return `${this.currentUserId}.${boundaryId}`;
  }

  /**
   * Create a new trust boundary
   */
  async createBoundary(request: CreateBoundaryRequest): Promise<TrustBoundary> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const boundaryId = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const boundary: TrustBoundary = {
        boundary_id: boundaryId,
        source_instance_id: request.source_instance_id,
        target_instance_id: request.target_instance_id,
        source_name: request.source_name || 'Unknown Agent',
        target_name: request.target_name || 'Unknown Agent',
        trust_level: request.trust_level || 50,
        boundary_type: request.boundary_type,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: request.expires_at,
        policies: request.policies || [],
        attestations: [],
        metadata: request.metadata || {},
        user_id: this.currentUserId
      };

      const userKey = this.getUserKey(boundaryId);
      await unifiedStorage.set('trust_boundaries', userKey, boundary);

      console.log(`Trust boundary ${boundaryId} created and saved to unified storage`);
      return boundary;
    } catch (error) {
      console.error('Error creating trust boundary:', error);
      throw error;
    }
  }

  /**
   * Get all trust boundaries for the current user
   */
  async getBoundaries(): Promise<TrustBoundary[]> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const allKeys = await unifiedStorage.keys('trust_boundaries');
      const userPrefix = `${this.currentUserId}.`;
      const userKeys = allKeys.filter(key => key.startsWith(userPrefix));

      const boundaries: TrustBoundary[] = [];
      
      for (const key of userKeys) {
        try {
          const boundary = await unifiedStorage.get<TrustBoundary>('trust_boundaries', key);
          if (boundary) {
            boundaries.push(boundary);
          }
        } catch (error) {
          console.error(`Error loading boundary ${key}:`, error);
        }
      }

      console.log(`Loaded ${boundaries.length} trust boundaries for user ${this.currentUserId}`);
      return boundaries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error loading trust boundaries:', error);
      return [];
    }
  }

  /**
   * Get a specific trust boundary by ID
   */
  async getBoundary(boundaryId: string): Promise<TrustBoundary | null> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const userKey = this.getUserKey(boundaryId);
      const boundary = await unifiedStorage.get<TrustBoundary>('trust_boundaries', userKey);
      
      return boundary;
    } catch (error) {
      console.error(`Error loading boundary ${boundaryId}:`, error);
      return null;
    }
  }

  /**
   * Update a trust boundary
   */
  async updateBoundary(boundaryId: string, updates: Partial<TrustBoundary>): Promise<TrustBoundary> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const existingBoundary = await this.getBoundary(boundaryId);
      if (!existingBoundary) {
        throw new Error(`Boundary ${boundaryId} not found`);
      }

      const updatedBoundary: TrustBoundary = {
        ...existingBoundary,
        ...updates,
        boundary_id: boundaryId, // Ensure ID doesn't change
        user_id: this.currentUserId, // Ensure user association doesn't change
      };

      const userKey = this.getUserKey(boundaryId);
      await unifiedStorage.set('trust_boundaries', userKey, updatedBoundary);

      console.log(`Trust boundary ${boundaryId} updated in unified storage`);
      return updatedBoundary;
    } catch (error) {
      console.error(`Error updating boundary ${boundaryId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a trust boundary
   */
  async deleteBoundary(boundaryId: string): Promise<void> {
    try {
      const userKey = this.getUserKey(boundaryId);
      await unifiedStorage.delete('trust_boundaries', userKey);
      
      console.log(`Trust boundary ${boundaryId} deleted from unified storage`);
    } catch (error) {
      console.error(`Error deleting boundary ${boundaryId}:`, error);
      throw error;
    }
  }

  /**
   * Get boundaries by agent ID (either source or target)
   */
  async getBoundariesByAgent(agentId: string): Promise<TrustBoundary[]> {
    try {
      const allBoundaries = await this.getBoundaries();
      return allBoundaries.filter(boundary => 
        boundary.source_instance_id === agentId || 
        boundary.target_instance_id === agentId
      );
    } catch (error) {
      console.error(`Error loading boundaries for agent ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Get storage statistics for trust boundaries
   */
  async getStorageStats(): Promise<{
    boundaryCount: number;
    activeBoundaries: number;
    expiredBoundaries: number;
  }> {
    try {
      const boundaries = await this.getBoundaries();
      const now = new Date();
      
      const activeBoundaries = boundaries.filter(b => 
        b.status === 'active' && 
        (!b.expires_at || new Date(b.expires_at) > now)
      ).length;
      
      const expiredBoundaries = boundaries.filter(b => 
        b.expires_at && new Date(b.expires_at) <= now
      ).length;

      return {
        boundaryCount: boundaries.length,
        activeBoundaries,
        expiredBoundaries
      };
    } catch (error) {
      console.error('Error getting trust boundaries storage stats:', error);
      return { boundaryCount: 0, activeBoundaries: 0, expiredBoundaries: 0 };
    }
  }

  /**
   * Get comprehensive metrics for trust boundaries
   */
  async getMetrics(): Promise<{
    total_boundaries: number;
    active_boundaries: number;
    pending_boundaries: number;
    expired_boundaries: number;
    average_trust_level: number;
    boundary_types: {
      direct: number;
      delegated: number;
      transitive: number;
      federated: number;
    };
  }> {
    try {
      const boundaries = await this.getBoundaries();
      const now = new Date();
      
      const activeBoundaries = boundaries.filter(b => 
        b.status === 'active' && 
        (!b.expires_at || new Date(b.expires_at) > now)
      );
      
      const pendingBoundaries = boundaries.filter(b => b.status === 'pending_deployment');
      
      const expiredBoundaries = boundaries.filter(b => 
        b.expires_at && new Date(b.expires_at) <= now
      );

      const averageTrustLevel = boundaries.length > 0 
        ? boundaries.reduce((sum, b) => sum + b.trust_level, 0) / boundaries.length 
        : 0;

      const boundaryTypes = {
        direct: boundaries.filter(b => b.boundary_type === 'direct').length,
        delegated: boundaries.filter(b => b.boundary_type === 'delegated').length,
        transitive: boundaries.filter(b => b.boundary_type === 'transitive').length,
        federated: boundaries.filter(b => b.boundary_type === 'federated').length,
      };

      return {
        total_boundaries: boundaries.length,
        active_boundaries: activeBoundaries.length,
        pending_boundaries: pendingBoundaries.length,
        expired_boundaries: expiredBoundaries.length,
        average_trust_level: averageTrustLevel,
        boundary_types: boundaryTypes
      };
    } catch (error) {
      console.error('Error getting trust boundaries metrics:', error);
      return {
        total_boundaries: 0,
        active_boundaries: 0,
        pending_boundaries: 0,
        expired_boundaries: 0,
        average_trust_level: 0,
        boundary_types: {
          direct: 0,
          delegated: 0,
          transitive: 0,
          federated: 0
        }
      };
    }
  }
}

// Singleton instance
export const trustBoundariesStorageService = new TrustBoundariesStorageService();

