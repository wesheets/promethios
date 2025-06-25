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
        setError(null);
        
        if (user && db && auth) {
          // Try to load from storage
          await agentWrapperRegistry.loadWrappers(db, auth);
          const allWrappers = agentWrapperRegistry.getAllWrappers();
          
          if (allWrappers.length > 0) {
            setWrappers(allWrappers);
          } else {
            // If no wrappers found, add some mock agents for testing
            console.log('No agents found in storage, adding mock agents for testing');
            const mockAgents = createMockAgents();
            setWrappers(mockAgents);
          }
        } else {
          // If no auth, use mock agents
          console.log('No authentication, using mock agents');
          const mockAgents = createMockAgents();
          setWrappers(mockAgents);
        }
      } catch (err) {
        console.error('Error loading wrappers:', err);
        setError(err instanceof Error ? err : new Error('Failed to load wrappers'));
        
        // Fallback to mock agents on error
        console.log('Loading failed, falling back to mock agents');
        const mockAgents = createMockAgents();
        setWrappers(mockAgents);
      } finally {
        setLoading(false);
      }
    };

    loadWrappers();
  }, [user, db, auth]);

  // Create mock agents for testing when storage fails
  const createMockAgents = () => {
    return [
      {
        id: 'mock-agent-1',
        name: 'Content Generator',
        description: 'Generates high-quality content based on prompts and guidelines',
        version: '1.0.0',
        supportedProviders: ['openai', 'anthropic'],
        inputSchema: {},
        outputSchema: {},
        enabled: true,
        wrap: async (request: any) => request,
        unwrap: async (response: any) => response,
        initialize: async () => true,
        cleanup: async () => true
      },
      {
        id: 'mock-agent-2', 
        name: 'Data Analyzer',
        description: 'Analyzes data patterns and generates insights',
        version: '1.0.0',
        supportedProviders: ['openai'],
        inputSchema: {},
        outputSchema: {},
        enabled: true,
        wrap: async (request: any) => request,
        unwrap: async (response: any) => response,
        initialize: async () => true,
        cleanup: async () => true
      },
      {
        id: 'mock-agent-3',
        name: 'Code Assistant', 
        description: 'Helps with code generation, review, and debugging',
        version: '1.0.0',
        supportedProviders: ['openai', 'anthropic'],
        inputSchema: {},
        outputSchema: {},
        enabled: true,
        wrap: async (request: any) => request,
        unwrap: async (response: any) => response,
        initialize: async () => true,
        cleanup: async () => true
      },
      {
        id: 'mock-agent-4',
        name: 'Research Assistant',
        description: 'Conducts research and summarizes findings',
        version: '1.0.0', 
        supportedProviders: ['openai'],
        inputSchema: {},
        outputSchema: {},
        enabled: true,
        wrap: async (request: any) => request,
        unwrap: async (response: any) => response,
        initialize: async () => true,
        cleanup: async () => true
      }
    ];
  };

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


