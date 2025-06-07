/**
 * Enhanced test hooks for debugging and isolating context issues
 * 
 * Provides specialized hooks for testing that help isolate context and provider issues.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { useState, useEffect, useContext } from 'react';
import { GovernanceContext } from '../governance/context';
import { GovernanceDomain, GovernanceProfile } from '../governance/types';

/**
 * A test version of useGovernanceProfile that adds debugging and better error handling
 */
export function useGovernanceProfileForTests() {
  const context = useContext(GovernanceContext);
  
  // Debug log the context value
  console.log('Context in useGovernanceProfileForTests:', {
    currentDomain: context.currentDomain,
    setCurrentDomain: context.setCurrentDomain,
    profiles: context.profiles,
    loading: context.loading,
    error: context.error,
    apiService: context.apiService
  });
  
  const [currentProfile, setCurrentProfile] = useState<GovernanceProfile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<GovernanceProfile[]>([]);
  
  // Load profiles when component mounts or context changes
  useEffect(() => {
    // Debug log the effect dependencies
    console.log('useEffect in useGovernanceProfileForTests', {
      currentDomain: context.currentDomain,
      profilesAvailable: !!context.profiles,
      profileForDomain: context.currentDomain ? context.profiles[context.currentDomain] : null
    });
    
    // Set current profile based on domain
    if (context.currentDomain && context.profiles && context.profiles[context.currentDomain]) {
      const profile = context.profiles[context.currentDomain];
      console.log('Setting current profile:', profile);
      setCurrentProfile(profile);
    } else {
      console.log('No current profile available');
      setCurrentProfile(null);
    }
    
    // Convert profiles object to array with error handling
    if (context.profiles) {
      try {
        const profileArray = Object.values(context.profiles);
        console.log('Setting available profiles:', profileArray);
        setAvailableProfiles(profileArray);
      } catch (err) {
        console.error('Error converting profiles to array:', err);
        setAvailableProfiles([]);
      }
    } else {
      console.log('No profiles available');
      setAvailableProfiles([]);
    }
  }, [context.currentDomain, context.profiles]);
  
  // Function to select a profile with error handling
  const selectProfile = (domain: GovernanceDomain) => {
    try {
      console.log('selectProfile called with domain:', domain);
      if (context.setCurrentDomain) {
        context.setCurrentDomain(domain);
      } else {
        console.error('setCurrentDomain is not available in context');
      }
    } catch (err) {
      console.error('Error in selectProfile:', err);
    }
  };
  
  const result = {
    currentProfile,
    availableProfiles,
    selectProfile,
    currentDomain: context.currentDomain,
    loading: context.loading,
    error: context.error
  };
  
  // Debug log the return value
  console.log('useGovernanceProfileForTests returning:', result);
  
  return result;
}
