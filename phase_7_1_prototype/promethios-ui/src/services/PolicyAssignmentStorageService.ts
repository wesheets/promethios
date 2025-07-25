/**
 * Policy Assignment Storage Service
 * 
 * Manages storage and persistence of agent-policy assignments
 * with support for multi-policy per agent governance.
 */

import { UnifiedStorageService } from './UnifiedStorageService';

// Interfaces
export interface PolicyAssignment {
  id: string;
  agentId: string;
  policyId: string;
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'inactive' | 'suspended';
  complianceRate?: number;
  lastEvaluated?: string;
  metadata?: {
    priority?: number;
    notes?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface AssignmentSummary {
  totalAssignments: number;
  activeAssignments: number;
  averageCompliance: number;
  agentCount: number;
  policyCount: number;
}

export class PolicyAssignmentStorageService {
  private storageService: UnifiedStorageService;
  private readonly STORAGE_KEY = 'policy_assignments';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, PolicyAssignment[]> = new Map();
  private lastCacheUpdate: number = 0;

  constructor() {
    this.storageService = UnifiedStorageService.getInstance();
  }

  /**
   * Initialize the storage service
   */
  async initialize(userId: string): Promise<void> {
    try {
      await this.storageService.initialize(userId);
      console.log('PolicyAssignmentStorageService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PolicyAssignmentStorageService:', error);
      throw error;
    }
  }

  /**
   * Get all policy assignments
   */
  async getAssignments(userId: string): Promise<PolicyAssignment[]> {
    try {
      // Check cache first
      const cacheKey = `assignments_${userId}`;
      const now = Date.now();
      
      if (this.cache.has(cacheKey) && (now - this.lastCacheUpdate) < this.CACHE_DURATION) {
        return this.cache.get(cacheKey) || [];
      }

      // Load from storage
      const assignments = await this.storageService.getData<PolicyAssignment[]>(
        this.STORAGE_KEY,
        userId
      );

      const result = assignments || [];
      
      // Update cache
      this.cache.set(cacheKey, result);
      this.lastCacheUpdate = now;

      return result;
    } catch (error) {
      console.error('Failed to get policy assignments:', error);
      return [];
    }
  }

  /**
   * Get assignments for a specific agent
   */
  async getAgentAssignments(userId: string, agentId: string): Promise<PolicyAssignment[]> {
    try {
      const allAssignments = await this.getAssignments(userId);
      return allAssignments.filter(assignment => assignment.agentId === agentId);
    } catch (error) {
      console.error('Failed to get agent assignments:', error);
      return [];
    }
  }

  /**
   * Get assignments for a specific policy
   */
  async getPolicyAssignments(userId: string, policyId: string): Promise<PolicyAssignment[]> {
    try {
      const allAssignments = await this.getAssignments(userId);
      return allAssignments.filter(assignment => assignment.policyId === policyId);
    } catch (error) {
      console.error('Failed to get policy assignments:', error);
      return [];
    }
  }

  /**
   * Check if a policy is assigned to an agent
   */
  async isAssigned(userId: string, agentId: string, policyId: string): Promise<boolean> {
    try {
      const assignments = await this.getAssignments(userId);
      return assignments.some(assignment => 
        assignment.agentId === agentId && 
        assignment.policyId === policyId && 
        assignment.status === 'active'
      );
    } catch (error) {
      console.error('Failed to check assignment:', error);
      return false;
    }
  }

  /**
   * Assign a policy to an agent
   */
  async assignPolicy(
    userId: string, 
    agentId: string, 
    policyId: string, 
    assignedBy: string,
    metadata?: PolicyAssignment['metadata']
  ): Promise<PolicyAssignment> {
    try {
      const assignments = await this.getAssignments(userId);
      
      // Check if already assigned
      const existingAssignment = assignments.find(assignment => 
        assignment.agentId === agentId && assignment.policyId === policyId
      );

      if (existingAssignment) {
        // Reactivate if inactive
        if (existingAssignment.status !== 'active') {
          existingAssignment.status = 'active';
          existingAssignment.assignedAt = new Date().toISOString();
          existingAssignment.assignedBy = assignedBy;
          if (metadata) {
            existingAssignment.metadata = { ...existingAssignment.metadata, ...metadata };
          }
          
          await this.saveAssignments(userId, assignments);
          return existingAssignment;
        } else {
          throw new Error('Policy is already assigned to this agent');
        }
      }

      // Create new assignment
      const newAssignment: PolicyAssignment = {
        id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        policyId,
        assignedAt: new Date().toISOString(),
        assignedBy,
        status: 'active',
        complianceRate: 1.0, // Start with perfect compliance
        metadata: metadata || {}
      };

      assignments.push(newAssignment);
      await this.saveAssignments(userId, assignments);

      return newAssignment;
    } catch (error) {
      console.error('Failed to assign policy:', error);
      throw error;
    }
  }

  /**
   * Unassign a policy from an agent
   */
  async unassignPolicy(userId: string, agentId: string, policyId: string): Promise<boolean> {
    try {
      const assignments = await this.getAssignments(userId);
      const assignmentIndex = assignments.findIndex(assignment => 
        assignment.agentId === agentId && assignment.policyId === policyId
      );

      if (assignmentIndex === -1) {
        throw new Error('Assignment not found');
      }

      // Remove the assignment
      assignments.splice(assignmentIndex, 1);
      await this.saveAssignments(userId, assignments);

      return true;
    } catch (error) {
      console.error('Failed to unassign policy:', error);
      throw error;
    }
  }

  /**
   * Update an assignment
   */
  async updateAssignment(
    userId: string, 
    assignmentId: string, 
    updates: Partial<PolicyAssignment>
  ): Promise<PolicyAssignment> {
    try {
      const assignments = await this.getAssignments(userId);
      const assignmentIndex = assignments.findIndex(assignment => assignment.id === assignmentId);

      if (assignmentIndex === -1) {
        throw new Error('Assignment not found');
      }

      // Update the assignment
      assignments[assignmentIndex] = {
        ...assignments[assignmentIndex],
        ...updates,
        lastEvaluated: new Date().toISOString()
      };

      await this.saveAssignments(userId, assignments);
      return assignments[assignmentIndex];
    } catch (error) {
      console.error('Failed to update assignment:', error);
      throw error;
    }
  }

  /**
   * Update compliance rate for an assignment
   */
  async updateComplianceRate(
    userId: string, 
    agentId: string, 
    policyId: string, 
    complianceRate: number
  ): Promise<void> {
    try {
      const assignments = await this.getAssignments(userId);
      const assignment = assignments.find(assignment => 
        assignment.agentId === agentId && assignment.policyId === policyId
      );

      if (assignment) {
        assignment.complianceRate = complianceRate;
        assignment.lastEvaluated = new Date().toISOString();
        await this.saveAssignments(userId, assignments);
      }
    } catch (error) {
      console.error('Failed to update compliance rate:', error);
    }
  }

  /**
   * Get assignment summary statistics
   */
  async getAssignmentSummary(userId: string): Promise<AssignmentSummary> {
    try {
      const assignments = await this.getAssignments(userId);
      const activeAssignments = assignments.filter(a => a.status === 'active');
      
      const uniqueAgents = new Set(assignments.map(a => a.agentId));
      const uniquePolicies = new Set(assignments.map(a => a.policyId));
      
      const complianceRates = activeAssignments
        .map(a => a.complianceRate)
        .filter(rate => typeof rate === 'number');
      
      const averageCompliance = complianceRates.length > 0 
        ? complianceRates.reduce((sum, rate) => sum + rate, 0) / complianceRates.length
        : 0;

      return {
        totalAssignments: assignments.length,
        activeAssignments: activeAssignments.length,
        averageCompliance: Math.round(averageCompliance * 100),
        agentCount: uniqueAgents.size,
        policyCount: uniquePolicies.size
      };
    } catch (error) {
      console.error('Failed to get assignment summary:', error);
      return {
        totalAssignments: 0,
        activeAssignments: 0,
        averageCompliance: 0,
        agentCount: 0,
        policyCount: 0
      };
    }
  }

  /**
   * Bulk assign policies to multiple agents
   */
  async bulkAssignPolicies(
    userId: string,
    agentIds: string[],
    policyIds: string[],
    assignedBy: string
  ): Promise<PolicyAssignment[]> {
    try {
      const newAssignments: PolicyAssignment[] = [];
      
      for (const agentId of agentIds) {
        for (const policyId of policyIds) {
          try {
            const assignment = await this.assignPolicy(userId, agentId, policyId, assignedBy);
            newAssignments.push(assignment);
          } catch (error) {
            console.warn(`Failed to assign policy ${policyId} to agent ${agentId}:`, error);
          }
        }
      }

      return newAssignments;
    } catch (error) {
      console.error('Failed to bulk assign policies:', error);
      throw error;
    }
  }

  /**
   * Remove all assignments for an agent
   */
  async removeAgentAssignments(userId: string, agentId: string): Promise<void> {
    try {
      const assignments = await this.getAssignments(userId);
      const filteredAssignments = assignments.filter(assignment => assignment.agentId !== agentId);
      await this.saveAssignments(userId, filteredAssignments);
    } catch (error) {
      console.error('Failed to remove agent assignments:', error);
      throw error;
    }
  }

  /**
   * Remove all assignments for a policy
   */
  async removePolicyAssignments(userId: string, policyId: string): Promise<void> {
    try {
      const assignments = await this.getAssignments(userId);
      const filteredAssignments = assignments.filter(assignment => assignment.policyId !== policyId);
      await this.saveAssignments(userId, filteredAssignments);
    } catch (error) {
      console.error('Failed to remove policy assignments:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Save assignments to storage
   */
  private async saveAssignments(userId: string, assignments: PolicyAssignment[]): Promise<void> {
    try {
      await this.storageService.saveData(this.STORAGE_KEY, assignments, userId);
      
      // Update cache
      const cacheKey = `assignments_${userId}`;
      this.cache.set(cacheKey, assignments);
      this.lastCacheUpdate = Date.now();
      
      console.log('Policy assignments saved successfully');
    } catch (error) {
      console.error('Failed to save policy assignments:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const policyAssignmentStorageService = new PolicyAssignmentStorageService();

