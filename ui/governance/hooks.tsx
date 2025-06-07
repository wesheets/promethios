/**
 * Governance hooks for React components
 * 
 * Provides custom hooks for governance-related components.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import { useState, useEffect } from 'react';
import { useGovernance } from './context';
import { GovernanceDomain, GovernanceProfile } from './types';

// Hook for using governance profile data
export function useGovernanceProfile() {
  const { 
    currentDomain, 
    setCurrentDomain, 
    profiles, 
    loading, 
    error, 
    apiService 
  } = useGovernance();
  
  const [currentProfile, setCurrentProfile] = useState<GovernanceProfile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<GovernanceProfile[]>([]);
  
  // Load profiles when component mounts
  useEffect(() => {
    if (currentDomain && profiles[currentDomain]) {
      setCurrentProfile(profiles[currentDomain]);
    }
    
    // Convert profiles object to array
    const profileArray = Object.values(profiles);
    setAvailableProfiles(profileArray);
  }, [currentDomain, profiles]);
  
  // Function to select a profile
  const selectProfile = (domain: GovernanceDomain) => {
    setCurrentDomain(domain);
  };
  
  return {
    currentProfile,
    availableProfiles,
    selectProfile,
    currentDomain,
    loading,
    error
  };
}
