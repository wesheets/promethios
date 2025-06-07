/**
 * Enhanced test file for MetricsVisualization with improved context setup
 * 
 * Tests for the TestMetricsVisualization component with better debugging
 * and context integration.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestMetricsVisualization } from '../test-utils/TestMetricsVisualization';
import { GovernanceDomain } from '../governance/types';
import { GovernanceContext } from '../governance/context';
import { DEFAULT_MOCK_PROFILES } from '../test-utils/governance-testing';

// Extended waitFor options with longer timeout
const extendedWaitForOptions = {
  timeout: 10000,
  interval: 100
};

describe('TestMetricsVisualization Component', () => {
  test('renders empty state when no profile is selected', async () => {
    // Create a wrapper with null currentDomain
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GovernanceContext.Provider
        value={{
          currentDomain: null,
          setCurrentDomain: jest.fn(),
          profiles: {},
          loading: false,
          error: null,
          apiService: null
        }}
      >
        {children}
      </GovernanceContext.Provider>
    );
    
    render(<TestMetricsVisualization />, { wrapper });
    
    // Should show empty state
    await waitFor(() => {
      expect(screen.getByTestId('async-content-empty')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    expect(screen.getByText('No profile selected')).toBeInTheDocument();
  });

  test('renders metrics when profile is available', async () => {
    // Create a wrapper with valid profile data
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GovernanceContext.Provider
        value={{
          currentDomain: GovernanceDomain.SOFTWARE_ENGINEERING,
          setCurrentDomain: jest.fn(),
          profiles: DEFAULT_MOCK_PROFILES,
          loading: false,
          error: null,
          apiService: null
        }}
      >
        {children}
      </GovernanceContext.Provider>
    );
    
    render(<TestMetricsVisualization />, { wrapper });
    
    // Should show loaded content
    await waitFor(() => {
      expect(screen.getByTestId('async-content-loaded')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    expect(screen.getByText('Governance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Trust Metrics')).toBeInTheDocument();
  });
});
