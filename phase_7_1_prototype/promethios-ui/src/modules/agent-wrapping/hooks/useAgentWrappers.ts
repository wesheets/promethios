import { useState, useEffect } from 'react';
import { agentWrapperRegistry } from '../services/AgentWrapperRegistry';
import { AgentWrapper, WrapperMetrics } from '../types';
import { useAuth } from '../../../context/AuthContext';

/**
 * Hook for accessing and managing agent wrappers
 */
export const useAgentWrappers = () => {
  const [wrappers, setWrappers] = useState<AgentWrapper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, db, auth } = useAuth();

  // Load wrappers on mount
  useEffect(() => {
    const loadWrappers = async () => {
      try {
        setLoading(true);
        await agentWrapperRegistry.loadWrappers(db, auth);
        const allWrappers = agentWrapperRegistry.getAllWrappers();
        setWrappers(allWrappers);
        setError(null);
      } catch (err) {
        console.error('Error loading wrappers:', err);
        setError(err instanceof Error ? err : new Error('Failed to load wrappers'));
      } finally {
        setLoading(false);
      }
    };

    if (user && db && auth) {
      loadWrappers();
    }
  }, [user, db, auth]);

  // Register a new wrapper
  const registerWrapper = async (wrapper: AgentWrapper): Promise<boolean> => {
    try {
      const success = await agentWrapperRegistry.registerWrapper(db, auth, wrapper);
      if (success) {
        setWrappers(agentWrapperRegistry.getAllWrappers());
      }
      return success;
    } catch (err) {
      console.error('Error registering wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to register wrapper'));
      return false;
    }
  };

  // Deregister a wrapper
  const deregisterWrapper = async (wrapperId: string): Promise<boolean> => {
    try {
      const success = await agentWrapperRegistry.deregisterWrapper(db, auth, wrapperId);
      if (success) {
        setWrappers(agentWrapperRegistry.getAllWrappers());
      }
      return success;
    } catch (err) {
      console.error('Error deregistering wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to deregister wrapper'));
      return false;
    }
  };

  // Enable a wrapper
  const enableWrapper = async (wrapperId: string): Promise<boolean> => {
    try {
      const success = await agentWrapperRegistry.enableWrapper(db, auth, wrapperId);
      if (success) {
        // Update local state to reflect the change
        setWrappers(prev => 
          prev.map(w => 
            w.id === wrapperId ? { ...w, enabled: true } : w
          )
        );
      }
      return success;
    } catch (err) {
      console.error('Error enabling wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to enable wrapper'));
      return false;
    }
  };

  // Disable a wrapper
  const disableWrapper = async (wrapperId: string): Promise<boolean> => {
    try {
      const success = await agentWrapperRegistry.disableWrapper(db, auth, wrapperId);
      if (success) {
        // Update local state to reflect the change
        setWrappers(prev => 
          prev.map(w => 
            w.id === wrapperId ? { ...w, enabled: false } : w
          )
        );
      }
      return success;
    } catch (err) {
      console.error('Error disabling wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to disable wrapper'));
      return false;
    }
  };

  // Get metrics for a wrapper
  const getWrapperMetrics = (wrapperId: string): WrapperMetrics | null => {
    return agentWrapperRegistry.getWrapperMetrics(wrapperId);
  };

  // Check if a wrapper is enabled
  const isWrapperEnabled = (wrapperId: string): boolean => {
    return agentWrapperRegistry.isWrapperEnabled(wrapperId);
  };

  return {
    wrappers,
    loading,
    error,
    registerWrapper,
    deregisterWrapper,
    enableWrapper,
    disableWrapper,
    getWrapperMetrics,
    isWrapperEnabled
  };
};

export default useAgentWrappers;


