import { useState, useEffect } from 'react';
import { AgentIdentity, AgentFilter } from '../types';
import { agentIdentityRegistry } from '../services/AgentIdentityRegistry';
import { useAuth } from '../../../context/AuthContext';

/**
 * React hook for managing agent identities
 * Provides CRUD operations and real-time updates for agent identities
 */
export const useAgentIdentities = (filters?: AgentFilter) => {
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, db } = useAuth();

  // Load agents on mount and when filters change
  useEffect(() => {
    if (db) {
      loadAgents();
    }
  }, [filters, user, db]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply user-specific filtering if no ownerId filter is provided
      const effectiveFilters = filters || {};
      if (!effectiveFilters.ownerId && user) {
        effectiveFilters.ownerId = user.uid;
      }
      
      const agentList = await agentIdentityRegistry.listAgents(db, effectiveFilters);
      // Ensure we always have an array, even if the service returns null/undefined
      setAgents(Array.isArray(agentList) ? agentList : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
      console.error('Error loading agents:', err);
      // Set empty array on error to prevent undefined access
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: Omit<AgentIdentity, 'id' | 'creationDate' | 'lastModifiedDate'>) => {
    try {
      setError(null);
      
      // Ensure the agent is associated with the current user
      const agentWithOwner = {
        ...agentData,
        ownerId: agentData.ownerId || user?.uid || ''
      };
      
      const agentId = await agentIdentityRegistry.registerAgent(db, agentWithOwner);
      
      // Reload agents to get the updated list
      await loadAgents();
      
      return agentId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateAgent = async (agentId: string, updates: Partial<AgentIdentity>) => {
    try {
      setError(null);
      
      const success = await agentIdentityRegistry.updateAgentIdentity(db, agentId, updates);
      
      if (success) {
        // Update the local state
        setAgents(prevAgents => 
          (prevAgents || []).map(agent => 
            agent.id === agentId 
              ? { ...agent, ...updates, lastModifiedDate: new Date() }
              : agent
          )
        );
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      setError(null);
      
      // Soft delete by setting status to inactive
      const success = await agentIdentityRegistry.deactivateAgent(db, agentId);
      
      if (success) {
        // Remove from local state or update status based on current filters
        if (filters?.status === 'active') {
          setAgents(prevAgents => (prevAgents || []).filter(agent => agent.id !== agentId));
        } else {
          setAgents(prevAgents => 
            (prevAgents || []).map(agent => 
              agent.id === agentId 
                ? { ...agent, status: 'inactive' as const, lastModifiedDate: new Date() }
                : agent
            )
          );
        }
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete agent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getAgent = async (agentId: string): Promise<AgentIdentity | null> => {
    try {
      setError(null);
      return await agentIdentityRegistry.getAgentIdentity(db, agentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get agent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshAgents = () => {
    loadAgents();
  };

  return {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    refreshAgents
  };
};

/**
 * Hook for managing a single agent identity
 */
export const useAgentIdentity = (agentId: string | null) => {
  const [agent, setAgent] = useState<AgentIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { db } = useAuth();

  useEffect(() => {
    if (agentId && db) {
      loadAgent(agentId);
    } else {
      setAgent(null);
    }
  }, [agentId, db]);

  const loadAgent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const agentData = await agentIdentityRegistry.getAgentIdentity(db, id);
      setAgent(agentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
      console.error('Error loading agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (updates: Partial<AgentIdentity>) => {
    if (!agentId || !db) return false;
    
    try {
      setError(null);
      
      const success = await agentIdentityRegistry.updateAgentIdentity(db, agentId, updates);
      
      if (success && agent) {
        setAgent({ ...agent, ...updates, lastModifiedDate: new Date() });
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    agent,
    loading,
    error,
    updateAgent,
    refreshAgent: () => agentId && loadAgent(agentId)
  };
};

