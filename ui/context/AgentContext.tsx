import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { AgentUserLinkageService } from '../firebase/AgentUserLinkageService';

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

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [wrappedAgents, setWrappedAgents] = useState<WrappedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wrapped agents from Firebase when user changes
  useEffect(() => {
    const loadUserAgents = async () => {
      if (!user?.uid) {
        console.log('No authenticated user, clearing agents');
        setWrappedAgents([]);
        setLoading(false);
        return;
      }

      try {
        console.log('Loading agents for user:', user.email, 'UID:', user.uid);
        setLoading(true);
        
        // Get user-specific agents from Firebase
        const userAgents = await AgentUserLinkageService.getUserAgents(user.uid);
        console.log('Loaded user agents from Firebase:', userAgents);
        
        // Convert Firebase format to WrappedAgent format
        const formattedAgents: WrappedAgent[] = userAgents.map(agent => ({
          id: agent.id,
          name: agent.name || 'Unnamed Agent',
          description: agent.description || '',
          type: agent.type || 'assistant',
          provider: agent.provider || 'openai',
          model: agent.model || 'gpt-4',
          capabilities: agent.capabilities || [],
          governance_enabled: agent.governance_enabled || false,
          status: agent.status || 'active',
          api_endpoint: agent.api_endpoint,
          system_prompt: agent.system_prompt,
          collaboration_style: agent.collaboration_style,
          role: agent.role,
          wrapped_at: agent.createdAt?.toISOString() || new Date().toISOString(),
          user_created: true // All Firebase agents are user-created
        }));
        
        setWrappedAgents(formattedAgents);
      } catch (error) {
        console.error('Failed to load user agents from Firebase:', error);
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

  // Save wrapped agents to Firebase whenever they change (and user is authenticated)
  useEffect(() => {
    const saveUserAgents = async () => {
      if (!user?.uid || loading) {
        return; // Don't save if no user or still loading
      }

      try {
        console.log('Saving agents to Firebase for user:', user.email);
        
        // Save each agent to Firebase
        for (const agent of wrappedAgents) {
          await AgentUserLinkageService.saveAgentConfiguration(
            user.uid,
            agent.id,
            {
              name: agent.name,
              description: agent.description,
              type: agent.type,
              provider: agent.provider,
              model: agent.model,
              capabilities: agent.capabilities,
              governance_enabled: agent.governance_enabled,
              status: agent.status,
              api_endpoint: agent.api_endpoint,
              system_prompt: agent.system_prompt,
              collaboration_style: agent.collaboration_style,
              role: agent.role,
              user_created: agent.user_created
            }
          );
        }
        
        // Also save to localStorage as backup
        localStorage.setItem('promethios_wrapped_agents', JSON.stringify(wrappedAgents));
      } catch (error) {
        console.error('Failed to save agents to Firebase:', error);
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

