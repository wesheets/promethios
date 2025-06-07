/**
 * Debug utilities for troubleshooting test failures
 * 
 * Provides enhanced debugging tools for component tests.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { render } from '@testing-library/react';
import { GovernanceContext } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { MockGovernanceApiService, DEFAULT_MOCK_PROFILES } from './governance-testing';

// Debug wrapper that logs context values
export function renderWithDebugContext(
  ui: React.ReactElement,
  {
    initialDomain = GovernanceDomain.SOFTWARE_ENGINEERING,
    mockProfiles = DEFAULT_MOCK_PROFILES,
    mockDelay = 0,
  } = {}
) {
  // Create a debug API service
  const apiService = new MockGovernanceApiService(mockDelay);
  apiService.setMockProfiles(mockProfiles);
  
  // Log debug information
  console.log('Debug Context Setup:');
  console.log('- initialDomain:', initialDomain);
  console.log('- mockProfiles keys:', Object.keys(mockProfiles));
  console.log('- mockProfiles[SOFTWARE_ENGINEERING]:', mockProfiles[GovernanceDomain.SOFTWARE_ENGINEERING]);
  
  // Create a wrapper with debug logging
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const [currentDomain, setCurrentDomain] = React.useState(initialDomain);
    
    // Log when domain changes
    const wrappedSetCurrentDomain = (domain: GovernanceDomain) => {
      console.log('setCurrentDomain called with:', domain);
      setCurrentDomain(domain);
    };
    
    // Log context value on each render
    const contextValue = {
      currentDomain,
      setCurrentDomain: wrappedSetCurrentDomain,
      profiles: mockProfiles,
      loading: false,
      error: null,
      apiService
    };
    
    console.log('Context value on render:', {
      currentDomain: contextValue.currentDomain,
      profilesCount: Object.keys(contextValue.profiles).length,
      loading: contextValue.loading,
      error: contextValue.error
    });
    
    return (
      <GovernanceContext.Provider value={contextValue}>
        {children}
      </GovernanceContext.Provider>
    );
  };
  
  return render(ui, { wrapper: Wrapper });
}

// Debug component to visualize profile data
export const ProfileDebugDisplay: React.FC = () => {
  const context = React.useContext(GovernanceContext);
  
  return (
    <div data-testid="profile-debug">
      <h3>Context Debug Info</h3>
      <div>Current Domain: {context.currentDomain || 'null'}</div>
      <div>Profiles Count: {Object.keys(context.profiles).length}</div>
      <div>Loading: {context.loading ? 'true' : 'false'}</div>
      <div>Error: {context.error ? context.error.toString() : 'null'}</div>
      <h4>Available Profiles</h4>
      <ul>
        {Object.entries(context.profiles).map(([domain, profile]) => (
          <li key={domain}>
            {domain}: {profile.displayName} (ID: {profile.id})
          </li>
        ))}
      </ul>
    </div>
  );
};
