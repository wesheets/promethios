/**
 * Enhanced renderWithGovernanceContext implementation for MetricsVisualization tests
 * 
 * This file provides a specialized render function for MetricsVisualization tests
 * with proper context integration and API service mocking.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import * as React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { GovernanceContext } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { GovernanceProfileConfig } from './governance-testing';

/**
 * Specialized render function for MetricsVisualization tests
 */
export function renderWithMetricsContext(
  ui: React.ReactElement,
  {
    initialDomain = GovernanceDomain.SOFTWARE_ENGINEERING,
    mockProfiles,
    mockError = null,
    mockLoading = false,
    mockDelay = 0,
    ...renderOptions
  }: {
    initialDomain?: GovernanceDomain | null;
    mockProfiles?: Record<GovernanceDomain, GovernanceProfileConfig>;
    mockError?: Error | null;
    mockLoading?: boolean;
    mockDelay?: number;
    renderOptions?: Omit<RenderOptions, 'wrapper'>;
  } = {}
) {
  // Create a wrapper that provides the context with the correct structure
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Use state to allow for domain changes in tests
    const [currentDomain, setCurrentDomain] = React.useState(initialDomain);
    const [loading, setLoading] = React.useState(mockLoading);
    const [error, setError] = React.useState<Error | null>(mockError);
    
    // Simulate loading delay if specified
    React.useEffect(() => {
      if (mockDelay > 0) {
        setLoading(true);
        const timer = setTimeout(() => {
          setLoading(false);
        }, mockDelay);
        return () => clearTimeout(timer);
      }
    }, []);
    
    // Create a mock API service with the expected methods
    const apiService = {
      fetchProfile: jest.fn().mockImplementation(async (domain: GovernanceDomain) => {
        if (mockError) throw mockError;
        return mockProfiles?.[domain];
      }),
      fetchProfiles: jest.fn().mockImplementation(async () => {
        if (mockError) throw mockError;
        return mockProfiles ? Object.values(mockProfiles) : [];
      }),
      getAllProfiles: jest.fn().mockImplementation(async () => {
        if (mockError) throw mockError;
        return mockProfiles || {};
      }),
      getProfile: jest.fn().mockImplementation(async (domain: GovernanceDomain) => {
        if (mockError) throw mockError;
        return mockProfiles?.[domain];
      })
    };
    
    // Create a context value that matches what the component expects
    const contextValue = {
      currentDomain,
      setCurrentDomain,
      profiles: mockProfiles || {},
      loading,
      error,
      apiService
    };
    
    return (
      <GovernanceContext.Provider value={contextValue}>
        {children}
      </GovernanceContext.Provider>
    );
  };
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
