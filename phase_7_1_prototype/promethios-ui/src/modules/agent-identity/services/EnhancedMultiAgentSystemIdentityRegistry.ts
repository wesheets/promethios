/**
 * Enhanced Multi-Agent System Identity Registry using Unified Storage
 * Creates system-level governance identities separate from individual agents
 */

import { unifiedStorage } from '../../../services/UnifiedStorageService';
import { 
  MultiAgentSystemIdentity, 
  SystemAttestation, 
  SystemWorkflow,
  WorkflowStep,
  DataFlowMapping,
  ErrorHandlingStrategy 
} from '../types/multiAgent';
import { AgentIdentity } from '../types';
import { ExtendedAgentWrapper } from '../../agent-wrapping/types/introspection';

/**
 * Enhanced Multi-Agent System Identity Registry with unified storage
 */
export class EnhancedMultiAgentSystemIdentityRegistry {
  private static instance: EnhancedMultiAgentSystemIdentityRegistry;
  private storageService: UnifiedStorageService;
  private currentUserId: string | null = null;

  private constructor() {
    this.storageService = unifiedStorage;
  }

  public static getInstance(): EnhancedMultiAgentSystemIdentityRegistry {
    if (!EnhancedMultiAgentSystemIdentityRegistry.instance) {
      EnhancedMultiAgentSystemIdentityRegistry.instance = new EnhancedMultiAgentSystemIdentityRegistry();
    }
    return EnhancedMultiAgentSystemIdentityRegistry.instance;
  }

  /**
   * Set the current user for scoped storage
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Create multi-agent system identity
   */
  async createMultiAgentSystemIdentity(
    systemData: {
      name: string;
      description?: string;
      version: string;
      systemType: 'sequential' | 'parallel' | 'conditional' | 'custom';
      componentAgentIds: string[]; // Individual agent governance IDs
      agentRoles: Record<string, string>;
      workflowDefinition: SystemWorkflow;
      tags?: string[];
    }
  ): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('User must be set before creating multi-agent system identities');
    }

    try {
      // Generate unique system governance identity ID
      const systemGovernanceId = `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create multi-agent system identity
      const systemIdentity: MultiAgentSystemIdentity = {
        id: systemGovernanceId,
        name: systemData.name,
        version: systemData.version,
        description: systemData.description,
        ownerId: this.currentUserId,
        tags: systemData.tags || [],
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        status: 'active',
        systemType: systemData.systemType,
        agentIds: systemData.componentAgentIds,
        agentRoles: systemData.agentRoles,
        workflowDefinition: systemData.workflowDefinition,
        governanceProfileId: `sys_profile_${systemGovernanceId}`,
        systemAttestations: [],
        systemRoles: this.deriveSystemRoles(systemData.systemType, systemData.componentAgentIds.length)
      };

      // Save to unified storage
      await this.saveSystemIdentity(systemIdentity);

      // Create links to component agents
      await this.linkComponentAgents(systemGovernanceId, systemData.componentAgentIds);

      console.log(`Created multi-agent system identity ${systemGovernanceId} with ${systemData.componentAgentIds.length} component agents`);
      return systemGovernanceId;
    } catch (error) {
      console.error('Error creating multi-agent system identity:', error);
      throw new Error(`Failed to create system identity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get multi-agent system identity
   */
  async getSystemIdentity(systemGovernanceId: string): Promise<MultiAgentSystemIdentity | null> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving system identities');
    }

    try {
      const key = `user.${this.currentUserId}.system_identities.${systemGovernanceId}`;
      return await this.storageService.get<MultiAgentSystemIdentity>('governance', key);
    } catch (error) {
      console.error('Error getting system identity:', error);
      return null;
    }
  }

  /**
   * Update multi-agent system identity
   */
  async updateSystemIdentity(
    systemGovernanceId: string,
    updates: Partial<MultiAgentSystemIdentity>
  ): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error('User must be set before updating system identities');
    }

    try {
      const existingIdentity = await this.getSystemIdentity(systemGovernanceId);
      if (!existingIdentity) {
        throw new Error('System identity not found');
      }

      // Remove fields that shouldn't be updated directly
      const { id, creationDate, ...allowedUpdates } = updates;
      
      const updatedIdentity: MultiAgentSystemIdentity = {
        ...existingIdentity,
        ...allowedUpdates,
        lastModifiedDate: new Date()
      };

      await this.saveSystemIdentity(updatedIdentity);
      console.log(`Updated system identity: ${systemGovernanceId}`);
      return true;
    } catch (error) {
      console.error('Error updating system identity:', error);
      return false;
    }
  }

  /**
   * Add component agent to system
   */
  async addComponentAgent(
    systemGovernanceId: string,
    agentGovernanceId: string,
    role: string
  ): Promise<boolean> {
    try {
      const systemIdentity = await this.getSystemIdentity(systemGovernanceId);
      if (!systemIdentity) {
        throw new Error('System identity not found');
      }

      // Add agent to the system
      const updatedAgentIds = [...systemIdentity.agentIds, agentGovernanceId];
      const updatedAgentRoles = { ...systemIdentity.agentRoles, [agentGovernanceId]: role };

      await this.updateSystemIdentity(systemGovernanceId, {
        agentIds: updatedAgentIds,
        agentRoles: updatedAgentRoles
      });

      // Create link
      await this.linkComponentAgents(systemGovernanceId, [agentGovernanceId]);

      console.log(`Added component agent ${agentGovernanceId} to system ${systemGovernanceId}`);
      return true;
    } catch (error) {
      console.error('Error adding component agent:', error);
      return false;
    }
  }

  /**
   * Remove component agent from system
   */
  async removeComponentAgent(
    systemGovernanceId: string,
    agentGovernanceId: string
  ): Promise<boolean> {
    try {
      const systemIdentity = await this.getSystemIdentity(systemGovernanceId);
      if (!systemIdentity) {
        throw new Error('System identity not found');
      }

      // Remove agent from the system
      const updatedAgentIds = systemIdentity.agentIds.filter(id => id !== agentGovernanceId);
      const updatedAgentRoles = { ...systemIdentity.agentRoles };
      delete updatedAgentRoles[agentGovernanceId];

      await this.updateSystemIdentity(systemGovernanceId, {
        agentIds: updatedAgentIds,
        agentRoles: updatedAgentRoles
      });

      // Remove link
      await this.unlinkComponentAgent(systemGovernanceId, agentGovernanceId);

      console.log(`Removed component agent ${agentGovernanceId} from system ${systemGovernanceId}`);
      return true;
    } catch (error) {
      console.error('Error removing component agent:', error);
      return false;
    }
  }

  /**
   * Get all system identities for current user
   */
  async getAllSystemIdentities(): Promise<MultiAgentSystemIdentity[]> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving system identities');
    }

    try {
      const allKeys = await this.storageService.keys('governance');
      const systemPrefix = `user.${this.currentUserId}.system_identities.`;
      const systemKeys = allKeys.filter(key => key.startsWith(systemPrefix));
      
      const systems: MultiAgentSystemIdentity[] = [];
      for (const key of systemKeys) {
        const system = await this.storageService.get<MultiAgentSystemIdentity>('governance', key);
        if (system) {
          systems.push(system);
        }
      }
      
      return systems.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime());
    } catch (error) {
      console.error('Error getting all system identities:', error);
      return [];
    }
  }

  /**
   * Get systems that contain a specific agent
   */
  async getSystemsContainingAgent(agentGovernanceId: string): Promise<MultiAgentSystemIdentity[]> {
    try {
      const allSystems = await this.getAllSystemIdentities();
      return allSystems.filter(system => system.agentIds.includes(agentGovernanceId));
    } catch (error) {
      console.error('Error getting systems containing agent:', error);
      return [];
    }
  }

  /**
   * Add system attestation
   */
  async addSystemAttestation(
    systemGovernanceId: string,
    attestation: Omit<SystemAttestation, 'id' | 'systemId'>
  ): Promise<boolean> {
    try {
      const systemIdentity = await this.getSystemIdentity(systemGovernanceId);
      if (!systemIdentity) {
        throw new Error('System identity not found');
      }

      const newAttestation: SystemAttestation = {
        ...attestation,
        id: `sys_att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        systemId: systemGovernanceId
      };

      const updatedAttestations = [...(systemIdentity.systemAttestations || []), newAttestation];
      
      return await this.updateSystemIdentity(systemGovernanceId, {
        systemAttestations: updatedAttestations
      });
    } catch (error) {
      console.error('Error adding system attestation:', error);
      return false;
    }
  }

  /**
   * Delete multi-agent system identity
   */
  async deleteSystemIdentity(systemGovernanceId: string): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error('User must be set before deleting system identities');
    }

    try {
      // Get system to find component agents
      const systemIdentity = await this.getSystemIdentity(systemGovernanceId);
      
      // Remove the system identity
      const systemKey = `user.${this.currentUserId}.system_identities.${systemGovernanceId}`;
      await this.storageService.delete('governance', systemKey);

      // Remove links to component agents
      if (systemIdentity) {
        for (const agentId of systemIdentity.agentIds) {
          await this.unlinkComponentAgent(systemGovernanceId, agentId);
        }
      }

      // Remove system governance number
      const numberKey = `user.${this.currentUserId}.system_identity_numbers.${systemGovernanceId}`;
      await this.storageService.delete('governance', numberKey);

      console.log(`Deleted system identity: ${systemGovernanceId}`);
      return true;
    } catch (error) {
      console.error('Error deleting system identity:', error);
      return false;
    }
  }

  /**
   * Generate system governance identity number (for display on scorecards)
   */
  generateSystemGovernanceIdentityNumber(systemGovernanceId: string): string {
    // Create a human-readable system governance ID number
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const hash = systemGovernanceId.slice(-4); // Last 4 chars of ID
    return `SGID-${timestamp}-${hash.toUpperCase()}`;
  }

  /**
   * Get system governance identity number for display
   */
  async getSystemGovernanceIdentityNumber(systemGovernanceId: string): Promise<string> {
    // Check if we've already generated a display number
    const numberKey = `user.${this.currentUserId}.system_identity_numbers.${systemGovernanceId}`;
    let displayNumber = await this.storageService.get<string>('governance', numberKey);
    
    if (!displayNumber) {
      // Generate and store new display number
      displayNumber = this.generateSystemGovernanceIdentityNumber(systemGovernanceId);
      await this.storageService.set('governance', numberKey, displayNumber);
    }
    
    return displayNumber;
  }

  /**
   * Save system identity to unified storage
   */
  private async saveSystemIdentity(identity: MultiAgentSystemIdentity): Promise<void> {
    const key = `user.${this.currentUserId}.system_identities.${identity.id}`;
    await this.storageService.set('governance', key, identity);
  }

  /**
   * Create links between system and component agents
   */
  private async linkComponentAgents(systemGovernanceId: string, agentGovernanceIds: string[]): Promise<void> {
    for (const agentId of agentGovernanceIds) {
      // Store link from agent to systems it belongs to
      const agentSystemsKey = `user.${this.currentUserId}.agent_systems.${agentId}`;
      const existingSystems = await this.storageService.get<string[]>('governance', agentSystemsKey) || [];
      
      if (!existingSystems.includes(systemGovernanceId)) {
        const updatedSystems = [...existingSystems, systemGovernanceId];
        await this.storageService.set('governance', agentSystemsKey, updatedSystems);
      }

      // Store link from system to component agents
      const systemAgentsKey = `user.${this.currentUserId}.system_agents.${systemGovernanceId}`;
      const existingAgents = await this.storageService.get<string[]>('governance', systemAgentsKey) || [];
      
      if (!existingAgents.includes(agentId)) {
        const updatedAgents = [...existingAgents, agentId];
        await this.storageService.set('governance', systemAgentsKey, updatedAgents);
      }
    }
  }

  /**
   * Remove link between system and component agent
   */
  private async unlinkComponentAgent(systemGovernanceId: string, agentGovernanceId: string): Promise<void> {
    // Remove system from agent's systems list
    const agentSystemsKey = `user.${this.currentUserId}.agent_systems.${agentGovernanceId}`;
    const existingSystems = await this.storageService.get<string[]>('governance', agentSystemsKey) || [];
    const updatedSystems = existingSystems.filter(id => id !== systemGovernanceId);
    
    if (updatedSystems.length > 0) {
      await this.storageService.set('governance', agentSystemsKey, updatedSystems);
    } else {
      await this.storageService.delete('governance', agentSystemsKey);
    }

    // Remove agent from system's agents list
    const systemAgentsKey = `user.${this.currentUserId}.system_agents.${systemGovernanceId}`;
    const existingAgents = await this.storageService.get<string[]>('governance', systemAgentsKey) || [];
    const updatedAgents = existingAgents.filter(id => id !== agentGovernanceId);
    
    if (updatedAgents.length > 0) {
      await this.storageService.set('governance', systemAgentsKey, updatedAgents);
    } else {
      await this.storageService.delete('governance', systemAgentsKey);
    }
  }

  /**
   * Derive system roles based on system type and agent count
   */
  private deriveSystemRoles(systemType: string, agentCount: number): string[] {
    const roles: string[] = [];
    
    // Base role
    roles.push('multi-agent-system');
    
    // Type-specific roles
    switch (systemType) {
      case 'sequential':
        roles.push('sequential-workflow');
        break;
      case 'parallel':
        roles.push('parallel-processing');
        break;
      case 'conditional':
        roles.push('conditional-logic');
        break;
      case 'custom':
        roles.push('custom-workflow');
        break;
    }
    
    // Scale-based roles
    if (agentCount >= 5) {
      roles.push('large-scale-system');
    } else if (agentCount >= 3) {
      roles.push('medium-scale-system');
    } else {
      roles.push('small-scale-system');
    }
    
    return roles;
  }
}

// Export singleton instance
export const enhancedMultiAgentSystemIdentityRegistry = EnhancedMultiAgentSystemIdentityRegistry.getInstance();

