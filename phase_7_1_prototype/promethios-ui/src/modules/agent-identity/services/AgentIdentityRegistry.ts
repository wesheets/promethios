import { 
  AgentIdentity, 
  AgentModelLink, 
  AgentFilter,
  CustomAttribute 
} from '../types';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';

/**
 * AgentIdentityRegistry - Manages the identities of AI agents
 * Implements the core identity management functionality as specified in the design document
 */
export class AgentIdentityRegistry {
  private static instance: AgentIdentityRegistry;
  private customAttributes: Map<string, CustomAttribute> = new Map();

  private constructor() {}

  public static getInstance(): AgentIdentityRegistry {
    if (!AgentIdentityRegistry.instance) {
      AgentIdentityRegistry.instance = new AgentIdentityRegistry();
    }
    return AgentIdentityRegistry.instance;
  }

  /**
   * Register a new agent identity
   * @param identity - The agent identity to register
   * @returns Promise<string> - The generated agent ID
   */
  async registerAgent(identity: Omit<AgentIdentity, 'id' | 'creationDate' | 'lastModifiedDate'>): Promise<string> {
    try {
      const now = new Date();
      const agentData = {
        ...identity,
        creationDate: Timestamp.fromDate(now),
        lastModifiedDate: Timestamp.fromDate(now),
        status: identity.status || 'active'
      };

      const docRef = await addDoc(collection(db, 'agentIdentities'), agentData);
      
      // Update the document with its own ID
      await updateDoc(docRef, { id: docRef.id });
      
      console.log('Agent registered successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error registering agent:', error);
      throw new Error('Failed to register agent identity');
    }
  }

  /**
   * Get an agent identity by ID
   * @param agentId - The agent ID to retrieve
   * @returns Promise<AgentIdentity | null>
   */
  async getAgentIdentity(agentId: string): Promise<AgentIdentity | null> {
    try {
      const docRef = doc(db, 'agentIdentities', agentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          creationDate: data.creationDate.toDate(),
          lastModifiedDate: data.lastModifiedDate.toDate()
        } as AgentIdentity;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting agent identity:', error);
      throw new Error('Failed to retrieve agent identity');
    }
  }

  /**
   * Update an agent identity
   * @param agentId - The agent ID to update
   * @param updates - Partial updates to apply
   * @returns Promise<boolean> - Success status
   */
  async updateAgentIdentity(agentId: string, updates: Partial<AgentIdentity>): Promise<boolean> {
    try {
      const docRef = doc(db, 'agentIdentities', agentId);
      
      // Remove fields that shouldn't be updated directly
      const { id, creationDate, ...allowedUpdates } = updates;
      
      const updateData = {
        ...allowedUpdates,
        lastModifiedDate: Timestamp.fromDate(new Date())
      };

      await updateDoc(docRef, updateData);
      console.log('Agent identity updated successfully:', agentId);
      return true;
    } catch (error) {
      console.error('Error updating agent identity:', error);
      throw new Error('Failed to update agent identity');
    }
  }

  /**
   * List agents with optional filtering
   * @param filters - Optional filters to apply
   * @returns Promise<AgentIdentity[]>
   */
  async listAgents(filters?: AgentFilter): Promise<AgentIdentity[]> {
    try {
      let q = query(collection(db, 'agentIdentities'), orderBy('creationDate', 'desc'));

      // Apply filters
      if (filters?.ownerId) {
        q = query(q, where('ownerId', '==', filters.ownerId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const querySnapshot = await getDocs(q);
      const agents: AgentIdentity[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const agent = {
          ...data,
          id: doc.id,
          creationDate: data.creationDate.toDate(),
          lastModifiedDate: data.lastModifiedDate.toDate()
        } as AgentIdentity;

        // Apply tag filtering (client-side for now)
        if (filters?.tagsInclude) {
          const hasRequiredTags = filters.tagsInclude.every(tag => 
            agent.tags?.includes(tag)
          );
          if (hasRequiredTags) {
            agents.push(agent);
          }
        } else {
          agents.push(agent);
        }
      });

      return agents;
    } catch (error) {
      console.error('Error listing agents:', error);
      throw new Error('Failed to list agents');
    }
  }

  /**
   * Link an agent to its underlying model/endpoint
   * @param agentId - The agent ID
   * @param modelDetails - The model link details
   * @returns Promise<boolean> - Success status
   */
  async linkAgentToModel(agentId: string, modelDetails: AgentModelLink): Promise<boolean> {
    try {
      return await this.updateAgentIdentity(agentId, { modelLink: modelDetails });
    } catch (error) {
      console.error('Error linking agent to model:', error);
      throw new Error('Failed to link agent to model');
    }
  }

  /**
   * Register a custom attribute type for agent identities
   * @param attributeDefinition - The custom attribute definition
   * @returns boolean - Success status
   */
  registerCustomAttribute(attributeDefinition: CustomAttribute): boolean {
    try {
      this.customAttributes.set(attributeDefinition.id, attributeDefinition);
      console.log('Custom attribute registered:', attributeDefinition.id);
      return true;
    } catch (error) {
      console.error('Error registering custom attribute:', error);
      return false;
    }
  }

  /**
   * Get all registered custom attributes
   * @returns CustomAttribute[]
   */
  getCustomAttributes(): CustomAttribute[] {
    return Array.from(this.customAttributes.values());
  }

  /**
   * Get agents by owner ID (convenience method)
   * @param ownerId - The owner ID
   * @returns Promise<AgentIdentity[]>
   */
  async getAgentsByOwner(ownerId: string): Promise<AgentIdentity[]> {
    return this.listAgents({ ownerId });
  }

  /**
   * Get active agents only
   * @returns Promise<AgentIdentity[]>
   */
  async getActiveAgents(): Promise<AgentIdentity[]> {
    return this.listAgents({ status: 'active' });
  }

  /**
   * Deactivate an agent (soft delete)
   * @param agentId - The agent ID to deactivate
   * @returns Promise<boolean>
   */
  async deactivateAgent(agentId: string): Promise<boolean> {
    return this.updateAgentIdentity(agentId, { status: 'inactive' });
  }

  /**
   * Reactivate an agent
   * @param agentId - The agent ID to reactivate
   * @returns Promise<boolean>
   */
  async reactivateAgent(agentId: string): Promise<boolean> {
    return this.updateAgentIdentity(agentId, { status: 'active' });
  }
}

// Export singleton instance
export const agentIdentityRegistry = AgentIdentityRegistry.getInstance();

