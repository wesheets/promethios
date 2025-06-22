/**
 * Enhanced Agent Identity Registry using Unified Storage
 * Creates one-to-one relationship between wrapped agents and governance identities
 */

import { UnifiedStorageService } from '../../../services/UnifiedStorageService';
import { AgentIdentity, AgentModelLink, AgentAttestation } from '../types';
import { ExtendedAgentWrapper } from '../../agent-wrapping/types/introspection';

/**
 * Enhanced Agent Identity Registry with unified storage and wrapper integration
 */
export class EnhancedAgentIdentityRegistry {
  private static instance: EnhancedAgentIdentityRegistry;
  private storageService: UnifiedStorageService;
  private currentUserId: string | null = null;

  private constructor() {
    this.storageService = new UnifiedStorageService();
  }

  public static getInstance(): EnhancedAgentIdentityRegistry {
    if (!EnhancedAgentIdentityRegistry.instance) {
      EnhancedAgentIdentityRegistry.instance = new EnhancedAgentIdentityRegistry();
    }
    return EnhancedAgentIdentityRegistry.instance;
  }

  /**
   * Set the current user for scoped storage
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Create governance identity when agent is wrapped
   * This creates a one-to-one relationship between wrapped agent and governance identity
   */
  async createIdentityForWrappedAgent(
    wrappedAgent: ExtendedAgentWrapper,
    additionalInfo?: Partial<AgentIdentity>
  ): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('User must be set before creating agent identities');
    }

    try {
      // Generate unique governance identity ID
      const governanceIdentityId = `gov_${wrappedAgent.id}_${Date.now()}`;
      
      // Create model link from wrapped agent
      const modelLink: AgentModelLink = {
        type: 'custom_wrapper_id',
        identifier: wrappedAgent.id,
        credentialsId: `creds_${wrappedAgent.id}` // Reference to stored API credentials
      };

      // Create agent identity tied to the wrapped agent
      const agentIdentity: AgentIdentity = {
        id: governanceIdentityId,
        name: wrappedAgent.name,
        version: wrappedAgent.version,
        description: wrappedAgent.description,
        ownerId: this.currentUserId,
        tags: wrappedAgent.introspectionData?.tags || [],
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        status: wrappedAgent.enabled ? 'active' : 'inactive',
        modelLink,
        governanceProfileId: `profile_${governanceIdentityId}`,
        attestations: [],
        assignedRoles: this.deriveRolesFromCapabilities(wrappedAgent),
        // Additional fields from introspection
        ...additionalInfo
      };

      // Save to unified storage under governance namespace
      await this.saveAgentIdentity(agentIdentity);

      // Create bidirectional link - update wrapped agent with governance ID
      await this.linkWrappedAgentToIdentity(wrappedAgent.id, governanceIdentityId);

      console.log(`Created governance identity ${governanceIdentityId} for wrapped agent ${wrappedAgent.id}`);
      return governanceIdentityId;
    } catch (error) {
      console.error('Error creating identity for wrapped agent:', error);
      throw new Error(`Failed to create governance identity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get governance identity for a wrapped agent
   */
  async getIdentityForWrappedAgent(wrappedAgentId: string): Promise<AgentIdentity | null> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving agent identities');
    }

    try {
      // Look up the governance identity linked to this wrapped agent
      const linkKey = `user.${this.currentUserId}.agent_links.${wrappedAgentId}`;
      const governanceIdentityId = await this.storageService.get<string>('governance', linkKey);
      
      if (!governanceIdentityId) {
        return null;
      }

      return await this.getAgentIdentity(governanceIdentityId);
    } catch (error) {
      console.error('Error getting identity for wrapped agent:', error);
      return null;
    }
  }

  /**
   * Get agent identity by governance ID
   */
  async getAgentIdentity(governanceIdentityId: string): Promise<AgentIdentity | null> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving agent identities');
    }

    try {
      const key = `user.${this.currentUserId}.identities.${governanceIdentityId}`;
      return await this.storageService.get<AgentIdentity>('governance', key);
    } catch (error) {
      console.error('Error getting agent identity:', error);
      return null;
    }
  }

  /**
   * Update agent identity
   */
  async updateAgentIdentity(
    governanceIdentityId: string, 
    updates: Partial<AgentIdentity>
  ): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error('User must be set before updating agent identities');
    }

    try {
      const existingIdentity = await this.getAgentIdentity(governanceIdentityId);
      if (!existingIdentity) {
        throw new Error('Agent identity not found');
      }

      // Remove fields that shouldn't be updated directly
      const { id, creationDate, ...allowedUpdates } = updates;
      
      const updatedIdentity: AgentIdentity = {
        ...existingIdentity,
        ...allowedUpdates,
        lastModifiedDate: new Date()
      };

      await this.saveAgentIdentity(updatedIdentity);
      console.log(`Updated agent identity: ${governanceIdentityId}`);
      return true;
    } catch (error) {
      console.error('Error updating agent identity:', error);
      return false;
    }
  }

  /**
   * Add attestation to agent identity
   */
  async addAttestation(
    governanceIdentityId: string,
    attestation: Omit<AgentAttestation, 'id'>
  ): Promise<boolean> {
    try {
      const identity = await this.getAgentIdentity(governanceIdentityId);
      if (!identity) {
        throw new Error('Agent identity not found');
      }

      const newAttestation: AgentAttestation = {
        ...attestation,
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const updatedAttestations = [...(identity.attestations || []), newAttestation];
      
      return await this.updateAgentIdentity(governanceIdentityId, {
        attestations: updatedAttestations
      });
    } catch (error) {
      console.error('Error adding attestation:', error);
      return false;
    }
  }

  /**
   * Get all agent identities for current user
   */
  async getAllAgentIdentities(): Promise<AgentIdentity[]> {
    if (!this.currentUserId) {
      throw new Error('User must be set before retrieving agent identities');
    }

    try {
      const allKeys = await this.storageService.keys('governance');
      const identityPrefix = `user.${this.currentUserId}.identities.`;
      const identityKeys = allKeys.filter(key => key.startsWith(identityPrefix));
      
      const identities: AgentIdentity[] = [];
      for (const key of identityKeys) {
        const identity = await this.storageService.get<AgentIdentity>('governance', key);
        if (identity) {
          identities.push(identity);
        }
      }
      
      return identities.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime());
    } catch (error) {
      console.error('Error getting all agent identities:', error);
      return [];
    }
  }

  /**
   * Delete agent identity (when wrapped agent is removed)
   */
  async deleteAgentIdentity(governanceIdentityId: string): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error('User must be set before deleting agent identities');
    }

    try {
      // Remove the identity
      const identityKey = `user.${this.currentUserId}.identities.${governanceIdentityId}`;
      await this.storageService.delete('governance', identityKey);

      // Remove any links to wrapped agents
      const allKeys = await this.storageService.keys('governance');
      const linkPrefix = `user.${this.currentUserId}.agent_links.`;
      const linkKeys = allKeys.filter(key => key.startsWith(linkPrefix));
      
      for (const linkKey of linkKeys) {
        const linkedIdentityId = await this.storageService.get<string>('governance', linkKey);
        if (linkedIdentityId === governanceIdentityId) {
          await this.storageService.delete('governance', linkKey);
        }
      }

      console.log(`Deleted agent identity: ${governanceIdentityId}`);
      return true;
    } catch (error) {
      console.error('Error deleting agent identity:', error);
      return false;
    }
  }

  /**
   * Save agent identity to unified storage
   */
  private async saveAgentIdentity(identity: AgentIdentity): Promise<void> {
    const key = `user.${this.currentUserId}.identities.${identity.id}`;
    await this.storageService.set('governance', key, identity);
  }

  /**
   * Create bidirectional link between wrapped agent and governance identity
   */
  private async linkWrappedAgentToIdentity(
    wrappedAgentId: string, 
    governanceIdentityId: string
  ): Promise<void> {
    // Store the link from wrapped agent to governance identity
    const linkKey = `user.${this.currentUserId}.agent_links.${wrappedAgentId}`;
    await this.storageService.set('governance', linkKey, governanceIdentityId);
  }

  /**
   * Derive roles from agent capabilities
   */
  private deriveRolesFromCapabilities(wrappedAgent: ExtendedAgentWrapper): string[] {
    const roles: string[] = [];
    const capabilities = wrappedAgent.introspectionData?.capabilities;
    
    if (!capabilities) {
      return ['general-assistant'];
    }

    // Derive roles based on capabilities
    if (capabilities.canGenerateCode) {
      roles.push('code-assistant');
    }
    
    if (capabilities.canAnalyzeData) {
      roles.push('data-analyst');
    }
    
    if (capabilities.canGenerateImages) {
      roles.push('creative-assistant');
    }
    
    if (capabilities.canAccessInternet) {
      roles.push('research-assistant');
    }
    
    if (capabilities.supportsMultimodal) {
      roles.push('multimodal-assistant');
    }

    // Add governance-specific roles
    const governance = wrappedAgent.introspectionData?.governanceCompatibility;
    if (governance?.supportsAuditLogging && governance?.supportsPolicyEnforcement) {
      roles.push('governed-agent');
    }

    return roles.length > 0 ? roles : ['general-assistant'];
  }

  /**
   * Generate governance identity number (for display on scorecards)
   */
  generateGovernanceIdentityNumber(governanceIdentityId: string): string {
    // Create a human-readable governance ID number
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const hash = governanceIdentityId.slice(-4); // Last 4 chars of ID
    return `GID-${timestamp}-${hash.toUpperCase()}`;
  }

  /**
   * Get governance identity number for display
   */
  async getGovernanceIdentityNumber(governanceIdentityId: string): Promise<string> {
    // Check if we've already generated a display number
    const numberKey = `user.${this.currentUserId}.identity_numbers.${governanceIdentityId}`;
    let displayNumber = await this.storageService.get<string>('governance', numberKey);
    
    if (!displayNumber) {
      // Generate and store new display number
      displayNumber = this.generateGovernanceIdentityNumber(governanceIdentityId);
      await this.storageService.set('governance', numberKey, displayNumber);
    }
    
    return displayNumber;
  }
}

// Export singleton instance
export const enhancedAgentIdentityRegistry = EnhancedAgentIdentityRegistry.getInstance();

