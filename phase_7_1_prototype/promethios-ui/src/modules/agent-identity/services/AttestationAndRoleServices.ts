import { 
  AgentAttestation,
  AgentRoleDefinition,
  AttestationTypeDefinition 
} from './types';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';

/**
 * AgentAttestationService - Manages attestations for agents
 * Handles compliance certifications, security reviews, and other attestations
 */
export class AgentAttestationService {
  private static instance: AgentAttestationService;
  private attestationTypes: Map<string, AttestationTypeDefinition> = new Map();

  private constructor() {
    this.initializeDefaultAttestationTypes();
  }

  public static getInstance(): AgentAttestationService {
    if (!AgentAttestationService.instance) {
      AgentAttestationService.instance = new AgentAttestationService();
    }
    return AgentAttestationService.instance;
  }

  /**
   * Add an attestation to an agent
   * @param agentId - The agent ID
   * @param attestation - The attestation to add
   * @returns Promise<string> - The attestation ID
   */
  async addAttestation(agentId: string, attestation: Omit<AgentAttestation, 'id'>): Promise<string> {
    console.log('AttestationAndRoleServices: Attempting to add attestation for agent:', agentId);
    try {
      const attestationData = {
        ...attestation,
        agentId, // Store the agent ID with the attestation
        issueDate: Timestamp.fromDate(attestation.issueDate),
        expiryDate: attestation.expiryDate ? Timestamp.fromDate(attestation.expiryDate) : null,
        status: attestation.status || 'active'
      };

      const docRef = await addDoc(collection(db, 'agentAttestations'), attestationData);
      
      // Update the document with its own ID
      await updateDoc(docRef, { id: docRef.id });
      
      console.log('AttestationAndRoleServices: Attestation added successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error adding attestation:', error);
      throw new Error('Failed to add attestation');
    }
  }

  /**
   * Get a specific attestation
   * @param agentId - The agent ID
   * @param attestationId - The attestation ID
   * @returns Promise<AgentAttestation | null>
   */
  async getAttestation(agentId: string, attestationId: string): Promise<AgentAttestation | null> {
    console.log('AttestationAndRoleServices: Attempting to get attestation:', attestationId, 'for agent:', agentId);
    try {
      const docRef = doc(db, 'agentAttestations', attestationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Verify the attestation belongs to the specified agent
        if (data.agentId !== agentId) {
          console.warn('AttestationAndRoleServices: Attestation does not belong to agent:', attestationId, agentId);
          return null;
        }
        
        console.log('AttestationAndRoleServices: Attestation found:', attestationId);
        return {
          ...data,
          id: docSnap.id,
          issueDate: data.issueDate.toDate(),
          expiryDate: data.expiryDate ? data.expiryDate.toDate() : undefined
        } as AgentAttestation;
      }
      
      console.log('AttestationAndRoleServices: Attestation not found:', attestationId);
      return null;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error getting attestation:', error);
      throw new Error('Failed to retrieve attestation');
    }
  }

  /**
   * List all attestations for an agent
   * @param agentId - The agent ID
   * @returns Promise<AgentAttestation[]>
   */
  async listAttestationsForAgent(agentId: string): Promise<AgentAttestation[]> {
    console.log('AttestationAndRoleServices: Attempting to list attestations for agent:', agentId);
    try {
      const q = query(
        collection(db, 'agentAttestations'),
        where('agentId', '==', agentId),
        orderBy('issueDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const attestations: AgentAttestation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        attestations.push({
          ...data,
          id: doc.id,
          issueDate: data.issueDate.toDate(),
          expiryDate: data.expiryDate ? data.expiryDate.toDate() : undefined
        } as AgentAttestation);
      });

      console.log('AttestationAndRoleServices: Successfully listed attestations. Count:', attestations.length);
      return attestations;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error listing attestations:', error);
      throw new Error('Failed to list attestations');
    }
  }

  /**
   * Revoke an attestation
   * @param agentId - The agent ID
   * @param attestationId - The attestation ID
   * @param reason - The revocation reason
   * @returns Promise<boolean> - Success status
   */
  async revokeAttestation(agentId: string, attestationId: string, reason: string): Promise<boolean> {
    console.log('AttestationAndRoleServices: Attempting to revoke attestation:', attestationId, 'for agent:', agentId);
    try {
      const docRef = doc(db, 'agentAttestations', attestationId);
      
      // Verify the attestation exists and belongs to the agent
      const attestation = await this.getAttestation(agentId, attestationId);
      if (!attestation) {
        throw new Error('Attestation not found or does not belong to the specified agent');
      }

      await updateDoc(docRef, {
        status: 'revoked',
        revocationReason: reason,
        revocationDate: Timestamp.fromDate(new Date())
      });

      console.log('AttestationAndRoleServices: Attestation revoked successfully:', attestationId);
      return true;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error revoking attestation:', error);
      throw new Error('Failed to revoke attestation');
    }
  }

  /**
   * Register a custom attestation type
   * @param attestationType - The attestation type definition
   * @returns boolean - Success status
   */
  registerAttestationType(attestationType: AttestationTypeDefinition): boolean {
    try {
      this.attestationTypes.set(attestationType.id, attestationType);
      console.log('AttestationAndRoleServices: Attestation type registered:', attestationType.id);
      return true;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error registering attestation type:', error);
      return false;
    }
  }

  /**
   * Get all registered attestation types
   * @returns AttestationTypeDefinition[]
   */
  getAttestationTypes(): AttestationTypeDefinition[] {
    return Array.from(this.attestationTypes.values());
  }

  /**
   * Get a specific attestation type
   * @param typeId - The attestation type ID
   * @returns AttestationTypeDefinition | null
   */
  getAttestationType(typeId: string): AttestationTypeDefinition | null {
    return this.attestationTypes.get(typeId) || null;
  }

  /**
   * Check if an agent has a specific type of attestation
   * @param agentId - The agent ID
   * @param attestationType - The attestation type to check
   * @returns Promise<boolean>
   */
  async hasValidAttestation(agentId: string, attestationType: string): Promise<boolean> {
    console.log('AttestationAndRoleServices: Checking for valid attestation for agent:', agentId, 'type:', attestationType);
    try {
      const attestations = await this.listAttestationsForAgent(agentId);
      const now = new Date();
      
      const isValid = attestations.some(attestation => 
        attestation.type === attestationType &&
        attestation.status === 'active' &&
        (!attestation.expiryDate || attestation.expiryDate > now)
      );
      console.log('AttestationAndRoleServices: Has valid attestation:', isValid);
      return isValid;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error checking attestation:', error);
      return false;
    }
  }

  /**
   * Get expiring attestations for an agent
   * @param agentId - The agent ID
   * @param daysAhead - Number of days to look ahead for expiring attestations
   * @returns Promise<AgentAttestation[]>
   */
  async getExpiringAttestations(agentId: string, daysAhead: number = 30): Promise<AgentAttestation[]> {
    console.log('AttestationAndRoleServices: Getting expiring attestations for agent:', agentId, 'days ahead:', daysAhead);
    try {
      const attestations = await this.listAttestationsForAgent(agentId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
      
      const expiring = attestations.filter(attestation => 
        attestation.status === 'active' &&
        attestation.expiryDate &&
        attestation.expiryDate <= cutoffDate &&
        attestation.expiryDate > new Date()
      );
      console.log('AttestationAndRoleServices: Found expiring attestations. Count:', expiring.length);
      return expiring;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error getting expiring attestations:', error);
      throw new Error('Failed to get expiring attestations');
    }
  }

  /**
   * Initialize default attestation types
   */
  private initializeDefaultAttestationTypes(): void {
    this.registerAttestationType({
      id: 'security-audit',
      name: 'Security Audit',
      description: 'Comprehensive security audit and penetration testing',
      requiredFields: ['evidenceLink', 'issuer'],
      validityPeriod: 365, // 1 year
      autoRenewal: false
    });

    this.registerAttestationType({
      id: 'bias-testing',
      name: 'Bias Testing Certification',
      description: 'Testing for bias and fairness in AI responses',
      requiredFields: ['evidenceLink', 'issuer'],
      validityPeriod: 180, // 6 months
      autoRenewal: false
    });

    this.registerAttestationType({
      id: 'gdpr-compliance',
      name: 'GDPR Compliance',
      description: 'General Data Protection Regulation compliance certification',
      requiredFields: ['evidenceLink', 'issuer'],
      validityPeriod: 365, // 1 year
      autoRenewal: true
    });

    this.registerAttestationType({
      id: 'hipaa-compliance',
      name: 'HIPAA Compliance',
      description: 'Health Insurance Portability and Accountability Act compliance',
      requiredFields: ['evidenceLink', 'issuer'],
      validityPeriod: 365, // 1 year
      autoRenewal: false
    });

    this.registerAttestationType({
      id: 'soc2-type2',
      name: 'SOC 2 Type II',
      description: 'Service Organization Control 2 Type II audit',
      requiredFields: ['evidenceLink', 'issuer'],
      validityPeriod: 365, // 1 year
      autoRenewal: false
    });

    this.registerAttestationType({
      id: 'iso27001',
      name: 'ISO 27001',
      description: 'Information Security Management System certification',
      requiredFields: ['evidenceLink', 'issuer'],
      validityPeriod: 1095, // 3 years
      autoRenewal: false
    });
  }
}

/**
 * AgentRoleService - Manages roles that can be assigned to agents
 */
export class AgentRoleService {
  private static instance: AgentRoleService;

  private constructor() {}

  public static getInstance(): AgentRoleService {
    if (!AgentRoleService.instance) {
      AgentRoleService.instance = new AgentRoleService();
    }
    return AgentRoleService.instance;
  }

  /**
   * Define a new agent role
   * @param role - The role definition
   * @returns Promise<string> - The role ID
   */
  async defineRole(role: Omit<AgentRoleDefinition, 'id'>): Promise<string> {
    console.log('AttestationAndRoleServices: Attempting to define role.');
    try {
      const docRef = await addDoc(collection(db, 'agentRoles'), role);
      
      // Update the document with its own ID
      await updateDoc(docRef, { id: docRef.id });
      
      console.log('AttestationAndRoleServices: Agent role defined successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error defining agent role:', error);
      throw new Error('Failed to define agent role');
    }
  }

  /**
   * Get a role definition by ID
   * @param roleId - The role ID
   * @returns Promise<AgentRoleDefinition | null>
   */
  async getRoleDefinition(roleId: string): Promise<AgentRoleDefinition | null> {
    console.log('AttestationAndRoleServices: Attempting to get role definition:', roleId);
    try {
      const docRef = doc(db, 'agentRoles', roleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('AttestationAndRoleServices: Role definition found:', roleId);
        return { id: docSnap.id, ...docSnap.data() } as AgentRoleDefinition;
      }
      
      console.log('AttestationAndRoleServices: Role definition not found:', roleId);
      return null;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error getting role definition:', error);
      throw new Error('Failed to retrieve role definition');
    }
  }

  /**
   * List all role definitions
   * @returns Promise<AgentRoleDefinition[]>
   */
  async listRoleDefinitions(): Promise<AgentRoleDefinition[]> {
    console.log('AttestationAndRoleServices: Attempting to list role definitions.');
    try {
      const q = query(collection(db, 'agentRoles'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const roles: AgentRoleDefinition[] = [];
      querySnapshot.forEach((doc) => {
        roles.push({ id: doc.id, ...doc.data() } as AgentRoleDefinition);
      });
      
      console.log('AttestationAndRoleServices: Successfully listed role definitions. Count:', roles.length);
      return roles;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error listing role definitions:', error);
      throw new Error('Failed to list role definitions');
    }
  }

  /**
   * Assign a role to an agent
   * @param agentId - The agent ID
   * @param roleId - The role ID
   * @returns Promise<boolean> - Success status
   */
  async assignRoleToAgent(agentId: string, roleId: string): Promise<boolean> {
    console.log('AttestationAndRoleServices: Attempting to assign role:', roleId, 'to agent:', agentId);
    try {
      // Verify the role exists
      const role = await this.getRoleDefinition(roleId);
      if (!role) {
        throw new Error('Role definition not found');
      }

      // Create a role assignment record
      await addDoc(collection(db, 'agentRoleAssignments'), {
        agentId,
        roleId,
        assignedDate: Timestamp.fromDate(new Date()),
        status: 'active'
      });

      console.log('AttestationAndRoleServices: Role assigned to agent successfully:', { agentId, roleId });
      return true;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error assigning role to agent:', error);
      throw new Error('Failed to assign role to agent');
    }
  }

  /**
   * Unassign a role from an agent
   * @param agentId - The agent ID
   * @param roleId - The role ID
   * @returns Promise<boolean> - Success status
   */
  async unassignRoleFromAgent(agentId: string, roleId: string): Promise<boolean> {
    console.log('AttestationAndRoleServices: Attempting to unassign role:', roleId, 'from agent:', agentId);
    try {
      const q = query(
        collection(db, 'agentRoleAssignments'),
        where('agentId', '==', agentId),
        where('roleId', '==', roleId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Active role assignment not found');
      }

      // Update all matching assignments to inactive
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'inactive',
          unassignedDate: Timestamp.fromDate(new Date())
        })
      );

      await Promise.all(updatePromises);
      
      console.log('AttestationAndRoleServices: Role unassigned from agent successfully:', { agentId, roleId });
      return true;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error unassigning role from agent:', error);
      throw new Error('Failed to unassign role from agent');
    }
  }

  /**
   * Get all roles assigned to an agent
   * @param agentId - The agent ID
   * @returns Promise<AgentRoleDefinition[]>
   */
  async getAgentRoles(agentId: string): Promise<AgentRoleDefinition[]> {
    console.log('AttestationAndRoleServices: Attempting to get roles for agent:', agentId);
    try {
      const q = query(
        collection(db, 'agentRoleAssignments'),
        where('agentId', '==', agentId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      const roleIds: string[] = [];
      
      querySnapshot.forEach((doc) => {
        roleIds.push(doc.data().roleId);
      });

      // Fetch role definitions
      const roles: AgentRoleDefinition[] = [];
      for (const roleId of roleIds) {
        const role = await this.getRoleDefinition(roleId);
        if (role) {
          roles.push(role);
        }
      }
      
      console.log('AttestationAndRoleServices: Successfully retrieved roles. Count:', roles.length);
      return roles;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error getting agent roles:', error);
      throw new Error('Failed to get agent roles');
    }
  }

  /**
   * Get all agents with a specific role
   * @param roleId - The role ID
   * @returns Promise<string[]> - Array of agent IDs
   */
  async getAgentsWithRole(roleId: string): Promise<string[]> {
    console.log('AttestationAndRoleServices: Attempting to get agents with role:', roleId);
    try {
      const q = query(
        collection(db, 'agentRoleAssignments'),
        where('roleId', '==', roleId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      const agentIds: string[] = [];
      
      querySnapshot.forEach((doc) => {
        agentIds.push(doc.data().agentId);
      });
      
      console.log('AttestationAndRoleServices: Successfully retrieved agents with role. Count:', agentIds.length);
      return agentIds;
    } catch (error) {
      console.error('AttestationAndRoleServices: Error getting agents with role:', error);
      throw new Error('Failed to get agents with role');
    }
  }
}

// Export singleton instances
export const agentAttestationService = AgentAttestationService.getInstance();
export const agentRoleService = AgentRoleService.getInstance();


