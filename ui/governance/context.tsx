/**
 * Enhanced Governance Profile Context with API Integration
 * 
 * This component provides the context for domain-specific governance profiles
 * with backend API integration for profile selection, persistence, and domain detection.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  GovernanceProfileConfig, 
  GovernanceProfileContext as GovernanceProfileContextType,
  GovernanceDomain
} from './types';
import { defaultProfiles } from './defaults';
import { GovernanceApiService } from './api';

// Create the context with default values
const GovernanceProfileContext = createContext<GovernanceProfileContextType>({
  currentProfile: null,
  availableProfiles: [],
  selectProfile: () => {},
  resetToDefault: () => {},
  currentDomain: null,
});

interface GovernanceProfileProviderProps {
  children: ReactNode;
  initialDomain?: GovernanceDomain;
  apiService?: GovernanceApiService;
}

/**
 * Provider component for governance profiles with API integration
 */
export const GovernanceProfileProvider: React.FC<GovernanceProfileProviderProps> = ({ 
  children,
  initialDomain = GovernanceDomain.SOFTWARE_ENGINEERING,
  apiService = new GovernanceApiService()
}) => {
  const [availableProfiles, setAvailableProfiles] = useState<GovernanceProfileConfig[]>(defaultProfiles);
  const [currentDomain, setCurrentDomain] = useState<GovernanceDomain | null>(initialDomain);
  const [currentProfile, setCurrentProfile] = useState<GovernanceProfileConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch available profiles from API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const profiles = await apiService.fetchProfiles();
        // Only update state if component is still mounted
        if (isMounted) {
          setAvailableProfiles(profiles);
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        // Fall back to default profiles
        if (isMounted) {
          setAvailableProfiles(defaultProfiles);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfiles();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [apiService]);

  // Initialize with default profile for the initial domain
  useEffect(() => {
    let isMounted = true;
    if (currentDomain && !isLoading) {
      const fetchProfileForDomain = async () => {
        try {
          const profile = await apiService.fetchProfile(currentDomain);
          if (isMounted) {
            setCurrentProfile(profile);
          }
        } catch (error) {
          console.error(`Failed to fetch profile for domain ${currentDomain}:`, error);
          // Fall back to default profile
          if (isMounted) {
            const defaultProfile = availableProfiles.find(
              profile => profile.domain === currentDomain && profile.isDefault
            ) || null;
            setCurrentProfile(defaultProfile);
          }
        }
      };

      fetchProfileForDomain();
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [currentDomain, availableProfiles, apiService, isLoading]);

  /**
   * Select a profile by domain and optional version
   */
  const selectProfile = async (domain: GovernanceDomain, version?: string) => {
    setCurrentDomain(domain);
    setIsLoading(true);
    
    try {
      const profile = await apiService.fetchProfile(domain, version);
      setCurrentProfile(profile);
    } catch (error) {
      console.error(`Failed to fetch profile for domain ${domain} with version ${version || 'default'}:`, error);
      
      // Fall back to local profile selection
      let profile: GovernanceProfileConfig | undefined;
      
      if (version) {
        // Find specific version if provided
        profile = availableProfiles.find(
          p => p.domain === domain && p.version === version
        );
      } else {
        // Otherwise use the default for this domain
        profile = availableProfiles.find(
          p => p.domain === domain && p.isDefault
        );
      }
      
      if (profile) {
        setCurrentProfile(profile);
      } else {
        console.warn(`No profile found for domain ${domain} with version ${version || 'default'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset to the default profile for the current domain
   */
  const resetToDefault = async () => {
    if (currentDomain) {
      await selectProfile(currentDomain);
    }
  };

  // Detect domain from current task context (simplified implementation)
  // In a real implementation, this would analyze the current task or user context
  useEffect(() => {
    // This is a placeholder for domain detection logic
    // In a real implementation, this would analyze the current task or user context
    const detectDomain = async () => {
      // For now, we'll just use the initialDomain
      return initialDomain;
    };
    
    const updateDomain = async () => {
      const detectedDomain = await detectDomain();
      if (detectedDomain !== currentDomain) {
        setCurrentDomain(detectedDomain);
      }
    };
    
    updateDomain();
  }, [initialDomain, currentDomain]);

  const contextValue: GovernanceProfileContextType = {
    currentProfile,
    availableProfiles,
    selectProfile,
    resetToDefault,
    currentDomain,
  };

  return (
    <GovernanceProfileContext.Provider value={contextValue}>
      {children}
    </GovernanceProfileContext.Provider>
  );
};

/**
 * Hook to use the governance profile context
 */
export const useGovernanceProfile = () => useContext(GovernanceProfileContext);
