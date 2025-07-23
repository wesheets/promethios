/**
 * Trust Boundaries Backend Service
 * Handles trust boundaries using unified storage with API fallback
 */

import { API_BASE_URL } from '../config/api';
import { trustBoundariesStorageService, TrustBoundary, CreateBoundaryRequest } from './TrustBoundariesStorageService';

export interface CreateThresholdRequest {
  name: string;
  description: string;
  min_trust_level: number;
  max_trust_level: number;
  agent_types: string[];
  actions: {
    alert: boolean;
    block: boolean;
    escalate: boolean;
  };
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
    block: boolean;
    escalate: boolean;
  };
  created_at: string;
  status: 'active' | 'inactive';
}

export interface BoundariesMetrics {
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
}

class TrustBoundariesBackendService {
  private baseUrl: string;
  private useUnifiedStorage: boolean = true;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/trust-boundaries`;
  }

  /**
   * Initialize the service with user authentication
   */
  async initialize(userId: string): Promise<void> {
    try {
      trustBoundariesStorageService.setUserId(userId);
      console.log('Trust Boundaries service initialized with unified storage');
    } catch (error) {
      console.error('Error initializing Trust Boundaries service:', error);
      this.useUnifiedStorage = false;
    }
  }

  /**
   * Create a new trust boundary
   */
  async createBoundary(request: CreateBoundaryRequest): Promise<TrustBoundary> {
    try {
      if (this.useUnifiedStorage) {
        // Use unified storage (primary method)
        return await trustBoundariesStorageService.createBoundary(request);
      } else {
        // Fallback to API
        return await this.createBoundaryViaAPI(request);
      }
    } catch (error) {
      console.error('Error creating boundary:', error);
      // Try API fallback if unified storage fails
      if (this.useUnifiedStorage) {
        console.log('Falling back to API for boundary creation');
        return await this.createBoundaryViaAPI(request);
      }
      throw error;
    }
  }

  /**
   * Get all trust boundaries
   */
  async getBoundaries(): Promise<TrustBoundary[]> {
    try {
      if (this.useUnifiedStorage) {
        // Use unified storage (primary method)
        return await trustBoundariesStorageService.getBoundaries();
      } else {
        // Fallback to API
        return await this.getBoundariesViaAPI();
      }
    } catch (error) {
      console.error('Error getting boundaries:', error);
      // Try API fallback if unified storage fails
      if (this.useUnifiedStorage) {
        console.log('Falling back to API for boundaries retrieval');
        return await this.getBoundariesViaAPI();
      }
      return [];
    }
  }

  /**
   * Get a specific trust boundary
   */
  async getBoundary(boundaryId: string): Promise<TrustBoundary | null> {
    try {
      if (this.useUnifiedStorage) {
        return await trustBoundariesStorageService.getBoundary(boundaryId);
      } else {
        return await this.getBoundaryViaAPI(boundaryId);
      }
    } catch (error) {
      console.error(`Error getting boundary ${boundaryId}:`, error);
      return null;
    }
  }

  /**
   * Update a trust boundary
   */
  async updateBoundary(boundaryId: string, updates: Partial<TrustBoundary>): Promise<TrustBoundary> {
    try {
      if (this.useUnifiedStorage) {
        return await trustBoundariesStorageService.updateBoundary(boundaryId, updates);
      } else {
        return await this.updateBoundaryViaAPI(boundaryId, updates);
      }
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
      if (this.useUnifiedStorage) {
        await trustBoundariesStorageService.deleteBoundary(boundaryId);
      } else {
        await this.deleteBoundaryViaAPI(boundaryId);
      }
    } catch (error) {
      console.error(`Error deleting boundary ${boundaryId}:`, error);
      throw error;
    }
  }

  /**
   * Get boundaries metrics
   */
  async getMetrics(): Promise<BoundariesMetrics> {
    try {
      if (this.useUnifiedStorage) {
        const boundaries = await trustBoundariesStorageService.getBoundaries();
        return this.calculateMetricsFromBoundaries(boundaries);
      } else {
        return await this.getMetricsViaAPI();
      }
    } catch (error) {
      console.error('Error getting boundaries metrics:', error);
      // Return default metrics on error
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

  /**
   * Calculate metrics from boundaries array
   */
  private calculateMetricsFromBoundaries(boundaries: TrustBoundary[]): BoundariesMetrics {
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
      average_trust_level: Math.round(averageTrustLevel),
      boundary_types
    };
  }

  // API Fallback Methods
  private async createBoundaryViaAPI(request: CreateBoundaryRequest): Promise<TrustBoundary> {
    const response = await fetch(`${this.baseUrl}/boundaries`, {
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

  private async getBoundariesViaAPI(): Promise<TrustBoundary[]> {
    const response = await fetch(`${this.baseUrl}/boundaries`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.boundaries || [];
  }

  private async getBoundaryViaAPI(boundaryId: string): Promise<TrustBoundary | null> {
    const response = await fetch(`${this.baseUrl}/boundaries/${boundaryId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private async updateBoundaryViaAPI(boundaryId: string, updates: Partial<TrustBoundary>): Promise<TrustBoundary> {
    const response = await fetch(`${this.baseUrl}/boundaries/${boundaryId}`, {
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

  private async deleteBoundaryViaAPI(boundaryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/boundaries/${boundaryId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  private async getMetricsViaAPI(): Promise<BoundariesMetrics> {
    const response = await fetch(`${this.baseUrl}/metrics`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Threshold methods (still use API for now)
  async createThreshold(request: CreateThresholdRequest): Promise<TrustThreshold> {
    const response = await fetch(`${this.baseUrl}/thresholds`, {
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

  async getThresholds(): Promise<TrustThreshold[]> {
    const response = await fetch(`${this.baseUrl}/thresholds`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.thresholds || [];
  }

  async deleteThreshold(thresholdId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/thresholds/${thresholdId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Get boundary metrics
   */
  async getBoundaryMetrics(): Promise<BoundariesMetrics> {
    try {
      if (this.useUnifiedStorage) {
        return await trustBoundariesStorageService.getMetrics();
      } else {
        return await this.getBoundaryMetricsViaAPI();
      }
    } catch (error) {
      console.error('Error getting boundary metrics:', error);
      // Return default metrics on error
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

  private async getBoundaryMetricsViaAPI(): Promise<BoundariesMetrics> {
    const response = await fetch(`${this.baseUrl}/metrics`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

export const trustBoundariesBackendService = new TrustBoundariesBackendService();

