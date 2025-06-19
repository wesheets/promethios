import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [wrappedAgents, setWrappedAgents] = useState<WrappedAgent[]>([]);

  // Load wrapped agents from localStorage on mount
  useEffect(() => {
    const savedAgents = localStorage.getItem('promethios_wrapped_agents');
    if (savedAgents) {
      try {
        const agents = JSON.parse(savedAgents);
        setWrappedAgents(agents);
      } catch (error) {
        console.error('Failed to load wrapped agents from localStorage:', error);
      }
    }
  }, []);

  // Save wrapped agents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('promethios_wrapped_agents', JSON.stringify(wrappedAgents));
  }, [wrappedAgents]);

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

