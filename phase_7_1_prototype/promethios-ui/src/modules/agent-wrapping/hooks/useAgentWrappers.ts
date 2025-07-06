import { useState, useEffect } from 'react';
import { AgentWrapper, WrapperMetrics } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { useDemoAuth } from '../../../hooks/useDemoAuth';

/**
 * Hook for accessing and managing agent wrappers
 * Updated to use the same data source as the working My Agents page
 */
export const useAgentWrappers = () => {
  const [wrappers, setWrappers] = useState<AgentWrapper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();
  
  // Fallback to demo auth for testing if no Firebase user
  const { currentUser: demoUser } = useDemoAuth();
  const effectiveUser = currentUser || demoUser;

  // Load wrappers on mount
  useEffect(() => {
    const loadWrappers = async () => {
      if (!effectiveUser?.uid) {
        console.log('useAgentWrappers: No user logged in, skipping agent loading');
        setWrappers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('useAgentWrappers: Loading agents for user:', effectiveUser.uid);
        
        // Use the same storage service as the working My Agents page
        const { userAgentStorage } = await import('../../../services/UserAgentStorageService');
        userAgentStorage.setCurrentUser(effectiveUser.uid);
        
        // Load user's agents
        const userAgents = await userAgentStorage.loadUserAgents();
        console.log('useAgentWrappers: Loaded user agents:', userAgents);
        
        // Convert AgentProfile format to AgentWrapper format for compatibility
        const convertedWrappers: AgentWrapper[] = (userAgents || []).map(agent => ({
          id: agent.identity.id,
          name: agent.identity.name,
          description: agent.identity.description,
          version: agent.identity.version,
          supportedProviders: ['openai'], // Default, could be enhanced based on agent data
          inputSchema: {},
          outputSchema: {},
          enabled: agent.identity.status === 'active',
          wrap: async (request: any) => request,
          unwrap: async (response: any) => response,
          initialize: async () => true,
          cleanup: async () => true
        }));
        
        setWrappers(convertedWrappers);
        console.log('useAgentWrappers: Successfully loaded', convertedWrappers.length, 'agents');
        
      } catch (err) {
        console.error('useAgentWrappers: Error loading agents:', err);
        setError(err instanceof Error ? err : new Error('Failed to load agents'));
        setWrappers([]); // Empty array instead of mock agents
      } finally {
        setLoading(false);
      }
    };

    loadWrappers();
  }, [effectiveUser?.uid]);

  // Add wrapper function
  const addWrapper = async (wrapper: AgentWrapper) => {
    try {
      if (!effectiveUser?.uid) {
        throw new Error('No user logged in');
      }

      // Convert AgentWrapper to AgentProfile format and save
      const { userAgentStorage } = await import('../../../services/UserAgentStorageService');
      userAgentStorage.setCurrentUser(effectiveUser.uid);
      
      const agentProfile = {
        identity: {
          id: wrapper.id,
          name: wrapper.name,
          description: wrapper.description,
          version: wrapper.version,
          status: wrapper.enabled ? 'active' : 'inactive'
        },
        // Add other required fields with defaults
        healthStatus: 'healthy',
        governanceStatus: 'compliant',
        lastActivity: new Date().toISOString()
      };
      
      await userAgentStorage.saveUserAgent(agentProfile);
      
      // Reload wrappers to reflect changes
      const userAgents = await userAgentStorage.loadUserAgents();
      const convertedWrappers: AgentWrapper[] = (userAgents || []).map(agent => ({
        id: agent.identity.id,
        name: agent.identity.name,
        description: agent.identity.description,
        version: agent.identity.version,
        supportedProviders: ['openai'],
        inputSchema: {},
        outputSchema: {},
        enabled: agent.identity.status === 'active',
        wrap: async (request: any) => request,
        unwrap: async (response: any) => response,
        initialize: async () => true,
        cleanup: async () => true
      }));
      
      setWrappers(convertedWrappers);
    } catch (err) {
      console.error('Error adding wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to add wrapper'));
    }
  };

  // Remove wrapper function
  const removeWrapper = async (wrapperId: string) => {
    try {
      if (!effectiveUser?.uid) {
        throw new Error('No user logged in');
      }

      const { userAgentStorage } = await import('../../../services/UserAgentStorageService');
      userAgentStorage.setCurrentUser(effectiveUser.uid);
      
      await userAgentStorage.deleteUserAgent(wrapperId);
      
      // Update local state
      setWrappers(prev => prev.filter(w => w.id !== wrapperId));
    } catch (err) {
      console.error('Error removing wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to remove wrapper'));
    }
  };

  // Update wrapper function
  const updateWrapper = async (wrapperId: string, updates: Partial<AgentWrapper>) => {
    try {
      if (!effectiveUser?.uid) {
        throw new Error('No user logged in');
      }

      // Update local state immediately for better UX
      setWrappers(prev => prev.map(w => 
        w.id === wrapperId ? { ...w, ...updates } : w
      ));

      // TODO: Implement backend update if needed
      // For now, just update local state
    } catch (err) {
      console.error('Error updating wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to update wrapper'));
    }
  };

  // Get wrapper metrics function
  const getWrapperMetrics = async (wrapperId: string): Promise<WrapperMetrics | null> => {
    try {
      if (!effectiveUser?.uid) {
        return null;
      }

      const { userAgentStorage } = await import('../../../services/UserAgentStorageService');
      userAgentStorage.setCurrentUser(effectiveUser.uid);
      
      const scorecard = await userAgentStorage.loadScorecard(wrapperId);
      
      if (scorecard) {
        return {
          totalRequests: scorecard.metrics?.totalRequests || 0,
          successfulRequests: scorecard.metrics?.successfulRequests || 0,
          failedRequests: scorecard.metrics?.failedRequests || 0,
          averageResponseTime: scorecard.metrics?.averageResponseTime || 0,
          lastActivity: scorecard.lastUpdated || new Date().toISOString()
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error getting wrapper metrics:', err);
      return null;
    }
  };

  return {
    wrappers,
    loading,
    error,
    addWrapper,
    removeWrapper,
    updateWrapper,
    getWrapperMetrics,
    // Refresh function to manually reload data
    refresh: () => {
      if (effectiveUser?.uid) {
        const loadWrappers = async () => {
          try {
            setLoading(true);
            const { userAgentStorage } = await import('../../../services/UserAgentStorageService');
            userAgentStorage.setCurrentUser(effectiveUser.uid);
            const userAgents = await userAgentStorage.loadUserAgents();
            const convertedWrappers: AgentWrapper[] = (userAgents || []).map(agent => ({
              id: agent.identity.id,
              name: agent.identity.name,
              description: agent.identity.description,
              version: agent.identity.version,
              supportedProviders: ['openai'],
              inputSchema: {},
              outputSchema: {},
              enabled: agent.identity.status === 'active',
              wrap: async (request: any) => request,
              unwrap: async (response: any) => response,
              initialize: async () => true,
              cleanup: async () => true
            }));
            setWrappers(convertedWrappers);
          } catch (err) {
            console.error('Error refreshing wrappers:', err);
            setError(err instanceof Error ? err : new Error('Failed to refresh wrappers'));
          } finally {
            setLoading(false);
          }
        };
        loadWrappers();
      }
    }
  };
};

