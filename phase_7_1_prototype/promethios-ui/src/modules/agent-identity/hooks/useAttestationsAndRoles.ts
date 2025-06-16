import { useState, useEffect } from 'react';
import {
  AgentAttestation,
  AgentRoleDefinition,
  AttestationTypeDefinition
} from '../types';
import { agentAttestationService, agentRoleService } from '../services/AttestationAndRoleServices';
import { useAuth } from '../../../context/AuthContext';

/**
 * React hook for managing agent attestations
 */
export const useAgentAttestations = (agentId: string | null) => {
  const [attestations, setAttestations] = useState<AgentAttestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { db } = useAuth();

  useEffect(() => {
    if (agentId && db) {
      loadAttestations(agentId);
    } else {
      setAttestations([]);
    }
  }, [agentId, db]);

  const loadAttestations = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const attestationList = await agentAttestationService.listAttestationsForAgent(db, id);
      setAttestations(attestationList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attestations');
      console.error('Error loading attestations:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAttestation = async (attestationData: Omit<AgentAttestation, 'id'>) => {
    if (!agentId || !db) return null;

    try {
      setError(null);
      const attestationId = await agentAttestationService.addAttestation(db, agentId, attestationData);
      
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
    if (!agentId || !db) return false;

    try {
      setError(null);
      const success = await agentAttestationService.revokeAttestation(db, agentId, attestationId, reason);
      
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
    if (!agentId || !db) return [];

    try {
      setError(null);
      return await agentAttestationService.getExpiringAttestations(db, agentId, daysAhead);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get expiring attestations';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const hasValidAttestation = async (attestationType: string) => {
    if (!agentId || !db) return false;

    try {
      setError(null);
      return await agentAttestationService.hasValidAttestation(db, agentId, attestationType);
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
  const { db } = useAuth();

  useEffect(() => {
    if (agentId && db) {
      loadAgentRoles(agentId);
    } else {
      setRoles([]);
    }
  }, [agentId, db]);

  const loadAgentRoles = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const roleList = await agentRoleService.getAgentRoles(db, id);
      setRoles(roleList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent roles');
      console.error('Error loading agent roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (roleId: string) => {
    if (!agentId || !db) return false;

    try {
      setError(null);
      const success = await agentRoleService.assignRoleToAgent(db, agentId, roleId);
      
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
    if (!agentId || !db) return false;

    try {
      setError(null);
      const success = await agentRoleService.unassignRoleFromAgent(db, agentId, roleId);
      
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
  const { db } = useAuth();

  useEffect(() => {
    if (db) {
      loadRoleDefinitions();
    }
  }, [db]);

  const loadRoleDefinitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const definitions = await agentRoleService.listRoleDefinitions(db);
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
      const roleId = await agentRoleService.defineRole(db, roleData);
      
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
      return await agentRoleService.getRoleDefinition(db, roleId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get role definition';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getAgentsWithRole = async (roleId: string): Promise<string[]> => {
    if (!db) return [];
    try {
      setError(null);
      return await agentRoleService.getAgentsWithRole(db, roleId);
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
  const { db } = useAuth();

  useEffect(() => {
    if (roleId && db) {
      loadRoleDefinition(roleId);
    } else {
      setRoleDefinition(null);
    }
  }, [roleId, db]);

  const loadRoleDefinition = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const definition = await agentRoleService.getRoleDefinition(db, id);
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

