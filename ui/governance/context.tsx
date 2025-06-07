/**
 * Governance context for React components
 * 
 * Provides context for governance-related components.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { createContext, useContext, useState } from 'react';
import { GovernanceDomain, GovernanceContextType, GovernanceProfile } from './types';

// Create the context with default values
export const GovernanceContext = createContext<GovernanceContextType>({
  currentDomain: null,
  setCurrentDomain: () => {},
  profiles: {} as Record<GovernanceDomain, GovernanceProfile>,
  loading: false,
  error: null,
  apiService: null
});

// Hook for using the governance context
export const useGovernance = () => useContext(GovernanceContext);

// Provider component
interface GovernanceProviderProps {
  children: React.ReactNode;
  initialDomain?: GovernanceDomain | null;
}

export const GovernanceProvider: React.FC<GovernanceProviderProps> = ({ 
  children, 
  initialDomain = GovernanceDomain.SOFTWARE_ENGINEERING 
}) => {
  const [currentDomain, setCurrentDomain] = useState<GovernanceDomain | null>(initialDomain);
  const [profiles, setProfiles] = useState<Record<GovernanceDomain, GovernanceProfile>>({} as Record<GovernanceDomain, GovernanceProfile>);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock API service for development
  const apiService = {
    getProfile: async (domain: GovernanceDomain) => {
      return profiles[domain];
    },
    getAllProfiles: async () => {
      return profiles;
    }
  };
  
  return (
    <GovernanceContext.Provider
      value={{
        currentDomain,
        setCurrentDomain,
        profiles,
        loading,
        error,
        apiService
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
};
