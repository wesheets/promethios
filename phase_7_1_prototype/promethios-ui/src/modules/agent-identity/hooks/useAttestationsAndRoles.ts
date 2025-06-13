import { useState, useEffect } from 'react';
import { 
  AgentAttestation,
  AgentRoleDefinition,
  AttestationTypeDefinition 
} from '../types';
import { agentAttestationService, agentRoleService } from '../services/AttestationAndRoleServices';

/**
 * React hook for managing agent attestations
 */
export const useAgentAttestations = (agentId: string | null) => {
  const [attestations, setAttestations] = useState<AgentAttestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      loadAttestations(agentId);
    } else {
      setAttestations([]);
    }
  }, [agentId]);

  const loadAttestations = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const attestationList = await agentAttestationService.listAttestationsForAgent(id);
      setAttestations(attestationList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attestations');
      console.error('Error loading attestations:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAttestation = async (attestationData: Omit<AgentAttestation, 'id'>) => {
    if (!agentId) return null;

    try {
      setError(null);
      const attestationId = await agentAttestationService.addAttestation(agentId, attestationData);
      
      // Reload attestations to get the updated list
      await loadAttestations(agentId);
      
      return attestationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add attestation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const revokeAttestation = async (attestationId: string, reason: string) => {
    if (!agentId) return false;

    try {
      setError(null);
      const success = await agentAttestationService.revokeAttestation(agentId, attestationId, reason);
      
      if (success) {
        // Update the local state
        setAttestations(prev => 
          prev.map(attestation => 
            attestation.id === attestationId 
              ? { ...attestation, status: 'revoked' as const, revocationReason: reason }
              : attestation
          )
        );
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke attestation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getExpiringAttestations = async (daysAhead: number = 30) => {
    if (!agentId) return [];

    try {
      setError(null);
      return await agentAttestationService.getExpiringAttestations(agentId, daysAhead);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get expiring attestations';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const hasValidAttestation = async (attestationType: string) => {
    if (!agentId) return false;

    try {
      setError(null);
      return await agentAttestationService.hasValidAttestation(agentId, attestationType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check attestation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    attestations,
    loading,
    error,
    addAttestation,
    revokeAttestation,
    getExpiringAttestations,
    hasValidAttestation,
    refreshAttestations: () => agentId && loadAttestations(agentId)
  };
};

/**
 * React hook for managing attestation types
 */
export const useAttestationTypes = () => {
  const [attestationTypes, setAttestationTypes] = useState<AttestationTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttestationTypes();
  }, []);

  const loadAttestationTypes = () => {
    try {
      setLoading(true);
      const types = agentAttestationService.getAttestationTypes();
      setAttestationTypes(types);
    } catch (err) {
      console.error('Error loading attestation types:', err);
    } finally {
      setLoading(false);
    }
  };

  const registerAttestationType = (attestationType: AttestationTypeDefinition): boolean => {
    const success = agentAttestationService.registerAttestationType(attestationType);
    if (success) {
      loadAttestationTypes(); // Refresh the list
    }
    return success;
  };

  const getAttestationType = (typeId: string): AttestationTypeDefinition | null => {
    return agentAttestationService.getAttestationType(typeId);
  };

  return {
    attestationTypes,
    loading,
    registerAttestationType,
    getAttestationType,
    refreshAttestationTypes: loadAttestationTypes
  };
};

/**
 * React hook for managing agent roles
 */
export const useAgentRoles = (agentId: string | null) => {
  const [roles, setRoles] = useState<AgentRoleDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      loadAgentRoles(agentId);
    } else {
      setRoles([]);
    }
  }, [agentId]);

  const loadAgentRoles = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const roleList = await agentRoleService.getAgentRoles(id);
      setRoles(roleList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent roles');
      console.error('Error loading agent roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (roleId: string) => {
    if (!agentId) return false;

    try {
      setError(null);
      const success = await agentRoleService.assignRoleToAgent(agentId, roleId);
      
      if (success) {
        // Reload roles to get the updated list
        await loadAgentRoles(agentId);
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const unassignRole = async (roleId: string) => {
    if (!agentId) return false;

    try {
      setError(null);
      const success = await agentRoleService.unassignRoleFromAgent(agentId, roleId);
      
      if (success) {
        // Remove the role from local state
        setRoles(prev => prev.filter(role => role.id !== roleId));
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unassign role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    roles,
    loading,
    error,
    assignRole,
    unassignRole,
    refreshRoles: () => agentId && loadAgentRoles(agentId)
  };
};

/**
 * React hook for managing role definitions
 */
export const useRoleDefinitions = () => {
  const [roleDefinitions, setRoleDefinitions] = useState<AgentRoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoleDefinitions();
  }, []);

  const loadRoleDefinitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const definitions = await agentRoleService.listRoleDefinitions();
      setRoleDefinitions(definitions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role definitions');
      console.error('Error loading role definitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRoleDefinition = async (roleData: Omit<AgentRoleDefinition, 'id'>) => {
    try {
      setError(null);
      const roleId = await agentRoleService.defineRole(roleData);
      
      // Reload role definitions to get the updated list
      await loadRoleDefinitions();
      
      return roleId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role definition';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getRoleDefinition = async (roleId: string): Promise<AgentRoleDefinition | null> => {
    try {
      setError(null);
      return await agentRoleService.getRoleDefinition(roleId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get role definition';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getAgentsWithRole = async (roleId: string): Promise<string[]> => {
    try {
      setError(null);
      return await agentRoleService.getAgentsWithRole(roleId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get agents with role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    roleDefinitions,
    loading,
    error,
    createRoleDefinition,
    getRoleDefinition,
    getAgentsWithRole,
    refreshRoleDefinitions: loadRoleDefinitions
  };
};

/**
 * Hook for a single role definition
 */
export const useRoleDefinition = (roleId: string | null) => {
  const [roleDefinition, setRoleDefinition] = useState<AgentRoleDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleId) {
      loadRoleDefinition(roleId);
    } else {
      setRoleDefinition(null);
    }
  }, [roleId]);

  const loadRoleDefinition = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const definition = await agentRoleService.getRoleDefinition(id);
      setRoleDefinition(definition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role definition');
      console.error('Error loading role definition:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    roleDefinition,
    loading,
    error,
    refreshRoleDefinition: () => roleId && loadRoleDefinition(roleId)
  };
};

