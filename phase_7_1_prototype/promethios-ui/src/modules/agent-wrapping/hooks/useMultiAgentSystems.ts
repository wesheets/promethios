import { useState, useEffect } from 'react';
import { MultiAgentSystem } from '../types/multiAgent';
import { multiAgentSystemRegistry } from '../services/MultiAgentSystemRegistry';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Hook for managing multi-agent systems
 */
export const useMultiAgentSystems = () => {
  const [systems, setSystems] = useState<MultiAgentSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load systems when user changes
  useEffect(() => {
    if (user) {
      loadSystems();
    } else {
      setSystems([]);
      setLoading(false);
    }
  }, [user]);

  /**
   * Load all systems from Firebase
   */
  const loadSystems = async () => {
    try {
      setLoading(true);
      setError(null);
      await multiAgentSystemRegistry.loadSystems();
      const loadedSystems = multiAgentSystemRegistry.getAllSystems();
      setSystems(loadedSystems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load multi-agent systems');
      console.error('Error loading multi-agent systems:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new multi-agent system
   */
  const createSystem = async (system: MultiAgentSystem): Promise<boolean> => {
    try {
      setError(null);
      const success = await multiAgentSystemRegistry.createSystem(system);
      if (success) {
        // Reload systems to get the updated list
        await loadSystems();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create multi-agent system');
      console.error('Error creating multi-agent system:', err);
      return false;
    }
  };

  /**
   * Update an existing multi-agent system
   */
  const updateSystem = async (systemId: string, updates: Partial<MultiAgentSystem>): Promise<boolean> => {
    try {
      setError(null);
      const success = await multiAgentSystemRegistry.updateSystem(systemId, updates);
      if (success) {
        // Update local state
        setSystems(prevSystems =>
          prevSystems.map(system =>
            system.id === systemId
              ? { ...system, ...updates, updatedAt: new Date() }
              : system
          )
        );
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update multi-agent system');
      console.error('Error updating multi-agent system:', err);
      return false;
    }
  };

  /**
   * Delete a multi-agent system
   */
  const deleteSystem = async (systemId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await multiAgentSystemRegistry.deleteSystem(systemId);
      if (success) {
        // Remove from local state
        setSystems(prevSystems =>
          prevSystems.filter(system => system.id !== systemId)
        );
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete multi-agent system');
      console.error('Error deleting multi-agent system:', err);
      return false;
    }
  };

  /**
   * Enable a multi-agent system
   */
  const enableSystem = async (systemId: string): Promise<boolean> => {
    return updateSystem(systemId, { enabled: true });
  };

  /**
   * Disable a multi-agent system
   */
  const disableSystem = async (systemId: string): Promise<boolean> => {
    return updateSystem(systemId, { enabled: false });
  };

  /**
   * Update system environment
   */
  const updateSystemEnvironment = async (
    systemId: string, 
    environment: 'draft' | 'testing' | 'production'
  ): Promise<boolean> => {
    return updateSystem(systemId, { environment });
  };

  /**
   * Get a specific system by ID
   */
  const getSystem = (systemId: string): MultiAgentSystem | undefined => {
    return systems.find(system => system.id === systemId);
  };

  /**
   * Get systems by environment
   */
  const getSystemsByEnvironment = (environment: 'draft' | 'testing' | 'production'): MultiAgentSystem[] => {
    return systems.filter(system => system.environment === environment);
  };

  /**
   * Get systems by status
   */
  const getSystemsByStatus = (enabled: boolean): MultiAgentSystem[] => {
    return systems.filter(system => system.enabled === enabled);
  };

  /**
   * Get system statistics
   */
  const getSystemStats = () => {
    const totalSystems = systems.length;
    const activeSystems = systems.filter(system => system.enabled).length;
    const systemsByEnvironment = {
      draft: systems.filter(system => system.environment === 'draft').length,
      testing: systems.filter(system => system.environment === 'testing').length,
      production: systems.filter(system => system.environment === 'production').length,
    };

    return {
      totalSystems,
      activeSystems,
      systemsByEnvironment,
    };
  };

  return {
    systems,
    loading,
    error,
    createSystem,
    updateSystem,
    deleteSystem,
    enableSystem,
    disableSystem,
    updateSystemEnvironment,
    getSystem,
    getSystemsByEnvironment,
    getSystemsByStatus,
    getSystemStats,
    loadSystems,
  };
};

