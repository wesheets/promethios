/**
 * Enhanced debug utilities for context and hook inspection
 * 
 * This file provides specialized debug utilities for inspecting context values,
 * hook usage patterns, and API service wiring in tests.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import * as React from 'react';
import { GovernanceContext } from '../governance/context';
import { GovernanceDomain } from '../governance/types';

/**
 * Debug hook for inspecting context values and hook usage
 */
export function useGovernanceProfileDebug() {
  const context = React.useContext(GovernanceContext);
  
  // Log detailed context structure
  console.log('CONTEXT DEBUG - Raw context value:', {
    currentDomain: context.currentDomain,
    hasProfiles: !!context.profiles,
    profilesCount: context.profiles ? Object.keys(context.profiles).length : 0,
    profileKeys: context.profiles ? Object.keys(context.profiles) : [],
    loading: context.loading,
    error: context.error,
    hasApiService: !!context.apiService,
    apiServiceMethods: context.apiService ? Object.keys(context.apiService) : []
  });
  
  // Extract current profile with error handling
  let currentProfile = null;
  try {
    if (context.currentDomain && context.profiles && context.profiles[context.currentDomain]) {
      currentProfile = context.profiles[context.currentDomain];
      console.log('CONTEXT DEBUG - Current profile found:', {
        id: currentProfile.id,
        domain: currentProfile.domain,
        name: currentProfile.name
      });
    } else {
      console.log('CONTEXT DEBUG - No current profile available:', {
        currentDomain: context.currentDomain,
        hasProfiles: !!context.profiles,
        profileKeys: context.profiles ? Object.keys(context.profiles) : []
      });
    }
  } catch (err) {
    console.error('CONTEXT DEBUG - Error extracting current profile:', err);
  }
  
  // Extract available profiles with error handling
  let availableProfiles = [];
  try {
    if (context.profiles) {
      availableProfiles = Object.values(context.profiles);
      console.log('CONTEXT DEBUG - Available profiles:', {
        count: availableProfiles.length,
        domains: availableProfiles.map(p => p.domain)
      });
    } else {
      console.log('CONTEXT DEBUG - No profiles available');
    }
  } catch (err) {
    console.error('CONTEXT DEBUG - Error extracting available profiles:', err);
  }
  
  // Create select profile function with debug logging
  const selectProfile = (domain: GovernanceDomain) => {
    console.log('CONTEXT DEBUG - selectProfile called with domain:', domain);
    try {
      if (context.setCurrentDomain) {
        context.setCurrentDomain(domain);
        console.log('CONTEXT DEBUG - setCurrentDomain called successfully');
      } else {
        console.error('CONTEXT DEBUG - setCurrentDomain is not available in context');
      }
    } catch (err) {
      console.error('CONTEXT DEBUG - Error in selectProfile:', err);
    }
  };
  
  // Return the same structure as useGovernanceProfile
  return {
    currentProfile,
    availableProfiles,
    selectProfile,
    currentDomain: context.currentDomain,
    loading: context.loading,
    error: context.error
  };
}

/**
 * Debug wrapper for MetricsVisualization component
 */
export function DebugMetricsWrapper({ children }: { children: React.ReactNode }) {
  const hookResult = useGovernanceProfileDebug();
  
  console.log('DEBUG WRAPPER - Hook result:', {
    hasCurrentProfile: !!hookResult.currentProfile,
    currentDomain: hookResult.currentDomain,
    availableProfilesCount: hookResult.availableProfiles.length,
    loading: hookResult.loading,
    hasError: !!hookResult.error
  });
  
  return <>{children}</>;
}
