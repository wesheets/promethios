import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { UserAgentStorageService, AgentProfile } from '../../phase_7_1_prototype/promethios-ui/src/services/UserAgentStorageService';

interface WrappedAgent {
  id: string;
  name: string;
  description: string;
  type: 'assistant' | 'specialist' | 'tool' | 'creative' | 'validator' | 'coordinator';
  provider: string;
  model: string;
  capabilities: string[];
  governance_enabled: boolean;
  status: 'active' | 'configured' | 'demo';
  api_endpoint?: string;
  system_prompt?: string;
  collaboration_style?: 'sequential' | 'parallel' | 'hierarchical';
  role?: 'coordinator' | 'specialist' | 'validator' | 'executor';
  wrapped_at?: string;
  user_created?: boolean;
}

interface AgentContextType {
  wrappedAgents: WrappedAgent[];
  addWrappedAgent: (agent: WrappedAgent) => void;
  removeWrappedAgent: (agentId: string) => void;
  updateWrappedAgent: (agentId: string, updates: Partial<WrappedAgent>) => void;
  getWrappedAgent: (agentId: string) => WrappedAgent | undefined;
  hasWrappedAgents: boolean;
  userCreatedAgents: WrappedAgent[];
  demoAgents: WrappedAgent[];
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgentContext = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
};

interface AgentProviderProps {
  children: React.ReactNode;
}

// Create a singleton instance of the storage service
const userAgentStorage = new UserAgentStorageService();

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [wrappedAgents, setWrappedAgents] = useState<WrappedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert AgentProfile to WrappedAgent format for compatibility
  const convertAgentProfileToWrappedAgent = (profile: AgentProfile): WrappedAgent => {
    return {
      id: profile.identity.id,
      name: profile.identity.name,
      description: profile.identity.description,
      type: 'assistant',
      provider: profile.apiDetails?.provider || 'openai',
      model: profile.apiDetails?.selectedModel || 'gpt-4',
      capabilities: profile.apiDetails?.selectedCapabilities || [],
      governance_enabled: !!profile.governancePolicy,
      status: 'active',
      api_endpoint: profile.apiDetails?.endpoint,
      system_prompt: '',
      collaboration_style: 'sequential',
      role: 'specialist',
      wrapped_at: profile.identity.creationDate.toISOString(),
      user_created: true
    };
  };

  // Convert WrappedAgent to AgentProfile format for storage
  const convertWrappedAgentToAgentProfile = (agent: WrappedAgent): AgentProfile => {
    return {
      identity: {
        id: agent.id,
        name: agent.name,
        version: '1.0.0',
        description: agent.description,
        ownerId: user?.uid || 'unknown',
        creationDate: agent.wrapped_at ? new Date(agent.wrapped_at) : new Date(),
        lastModifiedDate: new Date(),
        status: agent.status
      },
      latestScorecard: null,
      attestationCount: 0,
      lastActivity: null,
      healthStatus: 'healthy',
      trustLevel: 'medium',
      isWrapped: true,
      governancePolicy: null,
      isDeployed: false,
      apiDetails: {
        endpoint: agent.api_endpoint || '',
        key: '',
        provider: agent.provider,
        selectedModel: agent.model,
        selectedCapabilities: agent.capabilities,
        selectedContextLength: 4096
      }
    };
  };

  // Load wrapped agents from unified storage when user changes
  useEffect(() => {
    const loadUserAgents = async () => {
      console.log('AgentContext: loadUserAgents called');
      console.log('AgentContext: user object:', user);
      console.log('AgentContext: user?.uid:', user?.uid);
      console.log('AgentContext: user?.email:', user?.email);
      
      if (!user?.uid) {
        console.log('AgentContext: No authenticated user, clearing agents');
        setWrappedAgents([]);
        setLoading(false);
        return;
      }

      try {
        console.log('AgentContext: Loading agents for user:', user.email, 'UID:', user.uid);
        setLoading(true);
        
        // Set the current user for the storage service
        userAgentStorage.setCurrentUser(user.uid);
        
        // Get user-specific agents from unified storage
        const agentProfiles = await userAgentStorage.loadUserAgents();
        console.log('AgentContext: Loaded user agents from unified storage:', agentProfiles);
        
        if (agentProfiles && agentProfiles.length > 0) {
          // Convert AgentProfile to WrappedAgent format
          const formattedAgents = agentProfiles.map(convertAgentProfileToWrappedAgent);
          setWrappedAgents(formattedAgents);
          console.log('AgentContext: Converted and set agents:', formattedAgents);
        } else {
          console.log('AgentContext: No agents found for user, setting empty array');
          setWrappedAgents([]);
        }
      } catch (error) {
        console.error('Failed to load user agents from unified storage:', error);
        // Fallback to localStorage for backward compatibility
        const savedAgents = localStorage.getItem('promethios_wrapped_agents');
        if (savedAgents) {
          try {
            const agents = JSON.parse(savedAgents);
            console.log('Fallback: loaded agents from localStorage:', agents);
            setWrappedAgents(agents);
          } catch (parseError) {
            console.error('Failed to parse localStorage agents:', parseError);
            setWrappedAgents([]);
          }
        } else {
          setWrappedAgents([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserAgents();
  }, [user?.uid]);

  // Save wrapped agents to unified storage whenever they change (and user is authenticated)
  useEffect(() => {
    const saveUserAgents = async () => {
      if (!user?.uid || loading) {
        return; // Don't save if no user or still loading
      }

      try {
        console.log('Saving agents to unified storage for user:', user.email);
        
        // Set the current user for the storage service
        userAgentStorage.setCurrentUser(user.uid);
        
        // Save each agent to unified storage
        for (const agent of wrappedAgents) {
          const agentProfile = convertWrappedAgentToAgentProfile(agent);
          await userAgentStorage.saveAgent(agentProfile);
        }
        
        console.log('AgentContext: Agents saved to unified storage');
        
        // Also save to localStorage as backup
        localStorage.setItem('promethios_wrapped_agents', JSON.stringify(wrappedAgents));
      } catch (error) {
        console.error('Failed to save agents to unified storage:', error);
        // Fallback to localStorage only
        localStorage.setItem('promethios_wrapped_agents', JSON.stringify(wrappedAgents));
      }
    };

    saveUserAgents();
  }, [wrappedAgents, user?.uid, loading]);

  const addWrappedAgent = (agent: WrappedAgent) => {
    const agentWithTimestamp = {
      ...agent,
      wrapped_at: new Date().toISOString(),
      user_created: !agent.status || agent.status !== 'demo'
    };
    
    setWrappedAgents(prev => {
      // Check if agent already exists
      const existingIndex = prev.findIndex(a => a.id === agent.id);
      if (existingIndex >= 0) {
        // Update existing agent
        const updated = [...prev];
        updated[existingIndex] = agentWithTimestamp;
        return updated;
      } else {
        // Add new agent
        return [...prev, agentWithTimestamp];
      }
    });
  };

  const removeWrappedAgent = (agentId: string) => {
    setWrappedAgents(prev => prev.filter(agent => agent.id !== agentId));
  };

  const updateWrappedAgent = (agentId: string, updates: Partial<WrappedAgent>) => {
    setWrappedAgents(prev => 
      prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, ...updates }
          : agent
      )
    );
  };

  const getWrappedAgent = (agentId: string): WrappedAgent | undefined => {
    return wrappedAgents.find(agent => agent.id === agentId);
  };

  const hasWrappedAgents = wrappedAgents.length > 0;
  
  const userCreatedAgents = wrappedAgents.filter(agent => agent.user_created);
  const demoAgents = wrappedAgents.filter(agent => !agent.user_created);

  const contextValue: AgentContextType = {
    wrappedAgents,
    addWrappedAgent,
    removeWrappedAgent,
    updateWrappedAgent,
    getWrappedAgent,
    hasWrappedAgents,
    userCreatedAgents,
    demoAgents
  };

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
};

export default AgentProvider;

