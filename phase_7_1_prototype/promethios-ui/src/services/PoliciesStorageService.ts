/**
 * Policies Storage Service
 * 
 * Handles persistent storage of governance policies using the UnifiedStorageService.
 * Provides CRUD operations with Firebase/localStorage fallback for policy data.
 */

import { unifiedStorage } from './UnifiedStorageService';

// Policy interfaces matching the API schema
export interface PolicyRule {
  rule_id: string;
  name?: string;
  description?: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert' | 'escalate';
  priority?: number;
  metadata?: {
    rationale?: string;
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Policy {
  policy_id: string;
  name: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  category?: string;
  description?: string;
  rules: PolicyRule[];
  metadata?: {
    owner?: string;
    compliance_mappings?: {
      [standard: string]: string[];
    };
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreatePolicyRequest {
  name: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  category?: string;
  description?: string;
  rules: Omit<PolicyRule, 'rule_id' | 'created_at' | 'updated_at'>[];
  metadata?: {
    owner?: string;
    compliance_mappings?: {
      [standard: string]: string[];
    };
    tags?: string[];
    [key: string]: any;
  };
}

export class PoliciesStorageService {
  private storageService: UnifiedStorageService;
  private currentUserId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.storageService = UnifiedStorageService.getInstance();
  }

  /**
   * Initialize the service with user context
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.currentUserId === userId) {
      return;
    }

    this.currentUserId = userId;
    await this.storageService.initialize();
    this.isInitialized = true;
    
    console.log('PoliciesStorageService initialized for user:', userId);
  }

  /**
   * Set the current user ID
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Get the storage key for policies
   */
  private getPoliciesKey(): string {
    if (!this.currentUserId) {
      throw new Error('User not authenticated - cannot access policies');
    }
    return `policies_${this.currentUserId}`;
  }

  /**
   * Get all policies for the current user
   */
  async getPolicies(): Promise<Policy[]> {
    try {
      const key = this.getPoliciesKey();
      const policies = await this.storageService.get('governance', key);
      return Array.isArray(policies) ? policies : [];
    } catch (error) {
      console.error('Error getting policies from storage:', error);
      return [];
    }
  }

  /**
   * Get a specific policy by ID
   */
  async getPolicy(policyId: string): Promise<Policy | null> {
    try {
      const policies = await this.getPolicies();
      return policies.find(p => p.policy_id === policyId) || null;
    } catch (error) {
      console.error('Error getting policy from storage:', error);
      return null;
    }
  }

  /**
   * Create a new policy
   */
  async createPolicy(policyData: CreatePolicyRequest): Promise<Policy> {
    try {
      const policies = await this.getPolicies();
      
      const newPolicy: Policy = {
        ...policyData,
        policy_id: `pol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        rules: policyData.rules.map(rule => ({
          ...rule,
          rule_id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: this.currentUserId || 'unknown',
        updated_by: this.currentUserId || 'unknown'
      };

      const updatedPolicies = [...policies, newPolicy];
      const key = this.getPoliciesKey();
      
      await this.storageService.set('governance', key, updatedPolicies);
      
      console.log('Policy created and saved to storage:', newPolicy.policy_id);
      return newPolicy;
    } catch (error) {
      console.error('Error creating policy in storage:', error);
      throw error;
    }
  }

  /**
   * Update an existing policy
   */
  async updatePolicy(policyId: string, updates: Partial<Policy>): Promise<Policy | null> {
    try {
      const policies = await this.getPolicies();
      const policyIndex = policies.findIndex(p => p.policy_id === policyId);
      
      if (policyIndex === -1) {
        console.warn('Policy not found for update:', policyId);
        return null;
      }

      const updatedPolicy: Policy = {
        ...policies[policyIndex],
        ...updates,
        policy_id: policyId, // Ensure ID doesn't change
        updated_at: new Date().toISOString(),
        updated_by: this.currentUserId || 'unknown'
      };

      const updatedPolicies = [...policies];
      updatedPolicies[policyIndex] = updatedPolicy;
      
      const key = this.getPoliciesKey();
      await this.storageService.set('governance', key, updatedPolicies);
      
      console.log('Policy updated in storage:', policyId);
      return updatedPolicy;
    } catch (error) {
      console.error('Error updating policy in storage:', error);
      throw error;
    }
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<boolean> {
    try {
      const policies = await this.getPolicies();
      const filteredPolicies = policies.filter(p => p.policy_id !== policyId);
      
      if (filteredPolicies.length === policies.length) {
        console.warn('Policy not found for deletion:', policyId);
        return false;
      }

      const key = this.getPoliciesKey();
      await this.storageService.set('governance', key, filteredPolicies);
      
      console.log('Policy deleted from storage:', policyId);
      return true;
    } catch (error) {
      console.error('Error deleting policy from storage:', error);
      throw error;
    }
  }

  /**
   * Get policies by status
   */
  async getPoliciesByStatus(status: Policy['status']): Promise<Policy[]> {
    try {
      const policies = await this.getPolicies();
      return policies.filter(p => p.status === status);
    } catch (error) {
      console.error('Error getting policies by status:', error);
      return [];
    }
  }

  /**
   * Get policies by category
   */
  async getPoliciesByCategory(category: string): Promise<Policy[]> {
    try {
      const policies = await this.getPolicies();
      return policies.filter(p => p.category === category);
    } catch (error) {
      console.error('Error getting policies by category:', error);
      return [];
    }
  }

  /**
   * Search policies by name or description
   */
  async searchPolicies(query: string): Promise<Policy[]> {
    try {
      const policies = await this.getPolicies();
      const lowerQuery = query.toLowerCase();
      
      return policies.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
        (p.metadata?.tags && p.metadata.tags.some(tag => 
          tag.toLowerCase().includes(lowerQuery)
        ))
      );
    } catch (error) {
      console.error('Error searching policies:', error);
      return [];
    }
  }

  /**
   * Get policy statistics
   */
  async getPolicyStats(): Promise<{
    total: number;
    byStatus: Record<Policy['status'], number>;
    byCategory: Record<string, number>;
  }> {
    try {
      const policies = await this.getPolicies();
      
      const byStatus: Record<Policy['status'], number> = {
        draft: 0,
        active: 0,
        deprecated: 0,
        archived: 0
      };
      
      const byCategory: Record<string, number> = {};
      
      policies.forEach(policy => {
        byStatus[policy.status]++;
        
        if (policy.category) {
          byCategory[policy.category] = (byCategory[policy.category] || 0) + 1;
        }
      });
      
      return {
        total: policies.length,
        byStatus,
        byCategory
      };
    } catch (error) {
      console.error('Error getting policy stats:', error);
      return {
        total: 0,
        byStatus: { draft: 0, active: 0, deprecated: 0, archived: 0 },
        byCategory: {}
      };
    }
  }

  /**
   * Clear all policies (for testing/reset)
   */
  async clearAllPolicies(): Promise<void> {
    try {
      const key = this.getPoliciesKey();
      await this.storageService.remove('governance', key);
      console.log('All policies cleared from storage');
    } catch (error) {
      console.error('Error clearing policies:', error);
      throw error;
    }
  }

  /**
   * Export policies as JSON
   */
  async exportPolicies(): Promise<string> {
    try {
      const policies = await this.getPolicies();
      return JSON.stringify(policies, null, 2);
    } catch (error) {
      console.error('Error exporting policies:', error);
      throw error;
    }
  }

  /**
   * Import policies from JSON
   */
  async importPolicies(jsonData: string): Promise<Policy[]> {
    try {
      const importedPolicies: Policy[] = JSON.parse(jsonData);
      
      if (!Array.isArray(importedPolicies)) {
        throw new Error('Invalid policy data format');
      }
      
      // Validate each policy
      importedPolicies.forEach((policy, index) => {
        if (!policy.policy_id || !policy.name || !policy.version) {
          throw new Error(`Invalid policy at index ${index}: missing required fields`);
        }
      });
      
      // Get existing policies and merge
      const existingPolicies = await this.getPolicies();
      const mergedPolicies = [...existingPolicies];
      
      importedPolicies.forEach(importedPolicy => {
        const existingIndex = mergedPolicies.findIndex(p => p.policy_id === importedPolicy.policy_id);
        if (existingIndex >= 0) {
          // Update existing policy
          mergedPolicies[existingIndex] = {
            ...importedPolicy,
            updated_at: new Date().toISOString(),
            updated_by: this.currentUserId || 'import'
          };
        } else {
          // Add new policy
          mergedPolicies.push({
            ...importedPolicy,
            created_at: importedPolicy.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: importedPolicy.created_by || this.currentUserId || 'import',
            updated_by: this.currentUserId || 'import'
          });
        }
      });
      
      const key = this.getPoliciesKey();
      await this.storageService.set('governance', key, mergedPolicies);
      
      console.log(`Imported ${importedPolicies.length} policies`);
      return mergedPolicies;
    } catch (error) {
      console.error('Error importing policies:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const policiesStorageService = new PoliciesStorageService();

