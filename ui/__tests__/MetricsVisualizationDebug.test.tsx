/**
 * Debug-enhanced MetricsVisualization test with detailed context inspection
 * 
 * This test file has been updated to use the debug utilities for detailed
 * inspection of context values, hook usage, and API service wiring.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricsVisualization } from '../governance/MetricsVisualization';
import { GovernanceDomain } from '../governance/types';
import { DEFAULT_MOCK_PROFILES } from '../test-utils/governance-testing';
import { renderWithMetricsContext } from '../test-utils/metrics-testing';
import { DebugMetricsWrapper } from '../test-utils/debug-utilities';

// Extended waitFor options with longer timeout
const extendedWaitForOptions = {
  timeout: 10000,
  interval: 100
};

describe('MetricsVisualization Component with Debug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log('TEST DEBUG - Starting new test case');
  });

  test('renders metrics visualization with profile data after loading', async () => {
    console.log('TEST DEBUG - Setting up test with mock profiles:', {
      profileCount: Object.keys(DEFAULT_MOCK_PROFILES).length,
      domains: Object.keys(DEFAULT_MOCK_PROFILES)
    });
    
    // Render with debug wrapper and mock data
    renderWithMetricsContext(
      <DebugMetricsWrapper>
        <MetricsVisualization />
      </DebugMetricsWrapper>, 
      {
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    console.log('TEST DEBUG - Component rendered, checking for loading state');
    
    // Initially should show loading state
    expect(screen.getByTestId('async-content-loading')).toBeInTheDocument();
    console.log('TEST DEBUG - Loading state found, waiting for it to complete');
    
    // Wait for loading to complete with detailed logging
    await waitFor(() => {
      const loadingElement = screen.queryByTestId('async-content-loading');
      console.log('TEST DEBUG - Current loading element state:', { exists: !!loadingElement });
      expect(loadingElement).not.toBeInTheDocument();
    }, extendedWaitForOptions);
    
    console.log('TEST DEBUG - Loading completed, checking for content');
    
    // Now check for the expected content with detailed logging
    const metricsHeading = screen.queryByText(/governance metrics/i);
    console.log('TEST DEBUG - Metrics heading found:', { exists: !!metricsHeading });
    expect(metricsHeading).toBeInTheDocument();
    
    const trustDecayText = screen.queryByText(/trust decay rate/i);
    console.log('TEST DEBUG - Trust decay rate text found:', { exists: !!trustDecayText });
    expect(trustDecayText).toBeInTheDocument();
    
    const eventGranularityText = screen.queryByText(/event granularity/i);
    console.log('TEST DEBUG - Event granularity text found:', { exists: !!eventGranularityText });
    expect(eventGranularityText).toBeInTheDocument();
  }, 15000); // Increased test timeout
  
  test('displays empty state when no profile is selected', async () => {
    console.log('TEST DEBUG - Setting up test with null initial domain');
    
    // Create a custom provider that doesn't set an initial profile
    renderWithMetricsContext(
      <DebugMetricsWrapper>
        <MetricsVisualization />
      </DebugMetricsWrapper>,
      {
        initialDomain: null
      }
    );
    
    console.log('TEST DEBUG - Component rendered, checking for empty state');
    
    // Should show empty state immediately (no loading)
    const emptyStateText = screen.queryByText(/no profile selected/i);
    console.log('TEST DEBUG - Empty state text found:', { exists: !!emptyStateText });
    expect(emptyStateText).toBeInTheDocument();
  }, 15000); // Increased test timeout
});
