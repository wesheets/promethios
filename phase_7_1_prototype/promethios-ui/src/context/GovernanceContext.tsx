import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GovernanceState {
  isGovernanceEnabled: boolean;
  governanceLevel: 'basic' | 'standard' | 'strict' | 'maximum';
  currentAgent: string | null;
  comparisonMode: boolean;
  lastGovernedResponse: string | null;
  lastUngovernedResponse: string | null;
}

export interface GovernanceContextType {
  state: GovernanceState;
  toggleGovernance: () => void;
  setGovernanceLevel: (level: GovernanceState['governanceLevel']) => void;
  setCurrentAgent: (agentId: string | null) => void;
  enableComparisonMode: () => void;
  disableComparisonMode: () => void;
  setLastResponses: (governed: string, ungoverned: string) => void;
  resetState: () => void;
}

const defaultState: GovernanceState = {
  isGovernanceEnabled: true,
  governanceLevel: 'standard',
  currentAgent: null,
  comparisonMode: false,
  lastGovernedResponse: null,
  lastUngovernedResponse: null,
};

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const useGovernance = () => {
  const context = useContext(GovernanceContext);
  if (context === undefined) {
    throw new Error('useGovernance must be used within a GovernanceProvider');
  }
  return context;
};

interface GovernanceProviderProps {
  children: ReactNode;
}

export const GovernanceProvider: React.FC<GovernanceProviderProps> = ({ children }) => {
  const [state, setState] = useState<GovernanceState>(defaultState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('promethios-governance-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse saved governance state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('promethios-governance-state', JSON.stringify(state));
  }, [state]);

  const toggleGovernance = () => {
    setState(prev => ({
      ...prev,
      isGovernanceEnabled: !prev.isGovernanceEnabled,
      comparisonMode: false, // Reset comparison mode when toggling
    }));
  };

  const setGovernanceLevel = (level: GovernanceState['governanceLevel']) => {
    setState(prev => ({ ...prev, governanceLevel: level }));
  };

  const setCurrentAgent = (agentId: string | null) => {
    setState(prev => ({ 
      ...prev, 
      currentAgent: agentId,
      lastGovernedResponse: null,
      lastUngovernedResponse: null,
    }));
  };

  const enableComparisonMode = () => {
    setState(prev => ({ ...prev, comparisonMode: true }));
  };

  const disableComparisonMode = () => {
    setState(prev => ({ 
      ...prev, 
      comparisonMode: false,
      lastGovernedResponse: null,
      lastUngovernedResponse: null,
    }));
  };

  const setLastResponses = (governed: string, ungoverned: string) => {
    setState(prev => ({
      ...prev,
      lastGovernedResponse: governed,
      lastUngovernedResponse: ungoverned,
    }));
  };

  const resetState = () => {
    setState(defaultState);
    localStorage.removeItem('promethios-governance-state');
  };

  const contextValue: GovernanceContextType = {
    state,
    toggleGovernance,
    setGovernanceLevel,
    setCurrentAgent,
    enableComparisonMode,
    disableComparisonMode,
    setLastResponses,
    resetState,
  };

  return (
    <GovernanceContext.Provider value={contextValue}>
      {children}
    </GovernanceContext.Provider>
  );
};

