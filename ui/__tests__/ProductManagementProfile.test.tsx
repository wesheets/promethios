/**
 * ProductManagementProfile component tests with improved async handling and imports
 * 
 * This test file has been updated with:
 * - Corrected import paths for test utilities
 * - Increased timeouts for all async operations
 * - Improved error handling
 * - Better mock data consistency
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GovernanceDomain } from '../governance/types';
import { ProductManagementProfile } from '../domains/ProductManagementProfile';
import { 
  renderWithGovernanceContext,
  MockGovernanceApiService,
  DEFAULT_MOCK_PROFILES,
  extendedWaitForOptions
} from '../test-utils/governance-testing';

describe('ProductManagementProfile Component', () => {
  // Setup mock API service
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders product management profile with correct title', async () => {
    renderWithGovernanceContext(
      <ProductManagementProfile />,
      {
        initialDomain: GovernanceDomain.PRODUCT_MANAGEMENT,
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    await waitFor(() => {
      expect(screen.getByText(/product management governance/i)).toBeInTheDocument();
    }, extendedWaitForOptions);
  }, 15000); // Increased test timeout

  test('displays domain-specific metrics when showMetrics is true', async () => {
    renderWithGovernanceContext(
      <ProductManagementProfile showMetrics={true} />,
      {
        initialDomain: GovernanceDomain.PRODUCT_MANAGEMENT,
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    await waitFor(() => {
      expect(screen.getByText(/domain-specific metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/market analysis trust/i)).toBeInTheDocument();
      expect(screen.getByText(/planning efficiency/i)).toBeInTheDocument();
      expect(screen.getByText(/decision recovery/i)).toBeInTheDocument();
    }, extendedWaitForOptions);
  }, 15000); // Increased test timeout

  test('hides domain-specific metrics when showMetrics is false', async () => {
    renderWithGovernanceContext(
      <ProductManagementProfile showMetrics={false} />,
      {
        initialDomain: GovernanceDomain.PRODUCT_MANAGEMENT,
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    // First wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/product management governance/i)).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Then check that metrics are not shown
    expect(screen.queryByText(/domain-specific metrics/i)).not.toBeInTheDocument();
  }, 15000); // Increased test timeout

  test('displays governance recommendations section', async () => {
    renderWithGovernanceContext(
      <ProductManagementProfile />,
      {
        initialDomain: GovernanceDomain.PRODUCT_MANAGEMENT,
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    await waitFor(() => {
      expect(screen.getByText(/governance recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/market analysis policy/i)).toBeInTheDocument();
      expect(screen.getByText(/planning strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/recovery approach/i)).toBeInTheDocument();
      expect(screen.getByText(/trust management/i)).toBeInTheDocument();
    }, extendedWaitForOptions);
  }, 15000); // Increased test timeout
});
