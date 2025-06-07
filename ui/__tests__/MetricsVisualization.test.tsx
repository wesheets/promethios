/**
 * Updated MetricsVisualization test with specialized context integration
 * 
 * This test file has been updated to use the specialized metrics testing utilities
 * for better context integration and API service mocking.
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

// Extended waitFor options with longer timeout
const extendedWaitForOptions = {
  timeout: 10000,
  interval: 100
};

describe('MetricsVisualization Component', () => {
  test('renders metrics visualization with profile data after loading', async () => {
    // Render with mock data and a small delay to simulate API call
    renderWithMetricsContext(<MetricsVisualization />, {
      mockProfiles: DEFAULT_MOCK_PROFILES,
      mockDelay: 10
    });
    
    // Initially should show loading state
    expect(screen.getByTestId('async-content-loading')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('async-content-loading')).not.toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Now check for the expected content
    expect(screen.getByText(/governance metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/trust decay rate/i)).toBeInTheDocument();
    expect(screen.getByText(/trust recovery rate/i)).toBeInTheDocument();
    expect(screen.getByText(/event granularity/i)).toBeInTheDocument();
    expect(screen.getByText(/state preservation/i)).toBeInTheDocument();
  }, 15000); // Increased test timeout
  
  test('displays empty state when no profile is selected', async () => {
    // Create a custom provider that doesn't set an initial profile
    renderWithMetricsContext(<MetricsVisualization />, {
      initialDomain: null
    });
    
    // Should show empty state immediately (no loading)
    expect(screen.getByText(/no profile selected/i)).toBeInTheDocument();
  }, 15000); // Increased test timeout
  
  test('shows comparison section when showComparison is true', async () => {
    renderWithMetricsContext(
      <MetricsVisualization 
        showComparison={true} 
        comparisonDomains={[GovernanceDomain.PRODUCT_MANAGEMENT]} 
      />,
      {
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('async-content-loading')).not.toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Check for comparison section
    expect(screen.getByText(/domain comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/software_engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/product_management/i)).toBeInTheDocument();
  }, 15000); // Increased test timeout
  
  test('hides comparison section when showComparison is false', async () => {
    renderWithMetricsContext(
      <MetricsVisualization showComparison={false} />,
      {
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('async-content-loading')).not.toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Comparison section should not be present
    expect(screen.queryByText(/domain comparison/i)).not.toBeInTheDocument();
  }, 15000); // Increased test timeout
  
  test('handles API errors gracefully', async () => {
    // Create context with error
    renderWithMetricsContext(<MetricsVisualization />, {
      mockProfiles: DEFAULT_MOCK_PROFILES,
      mockError: new Error('API error')
    });
    
    // Wait for error to appear with increased timeout
    await waitFor(() => {
      expect(screen.getByTestId('async-content-error')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Check error message
    expect(screen.getByText(/API error/i)).toBeInTheDocument();
  }, 15000); // Increased test timeout
});
