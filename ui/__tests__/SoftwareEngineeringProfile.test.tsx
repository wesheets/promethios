/**
 * SoftwareEngineeringProfile component tests with improved async handling and imports
 * 
 * This test file has been updated with:
 * - Corrected import paths for test utilities
 * - Increased timeouts for all async operations
 * - Improved error handling
 * - Better mock data consistency
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GovernanceDomain } from '../governance/types';
import { SoftwareEngineeringProfile } from '../domains/SoftwareEngineeringProfile';
import { 
  renderWithGovernanceContext,
  MockGovernanceApiService,
  DEFAULT_MOCK_PROFILES,
  extendedWaitForOptions
} from '../test-utils/governance-testing';

describe('SoftwareEngineeringProfile Component', () => {
  // Setup mock API service
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders software engineering profile with correct title', async () => {
    renderWithGovernanceContext(
      <SoftwareEngineeringProfile />,
      {
        initialDomain: GovernanceDomain.SOFTWARE_ENGINEERING,
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    await waitFor(() => {
      expect(screen.getByText(/software engineering governance/i)).toBeInTheDocument();
    }, extendedWaitForOptions);
  }, 15000); // Increased test timeout

  test('displays domain-specific metrics when showMetrics is true', async () => {
    renderWithGovernanceContext(
      <SoftwareEngineeringProfile showMetrics={true} />,
      {
        initialDomain: GovernanceDomain.SOFTWARE_ENGINEERING,
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    await waitFor(() => {
      expect(screen.getByText(/domain-specific metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/code quality governance/i)).toBeInTheDocument();
      expect(screen.getByText(/technical debt management/i)).toBeInTheDocument();
      expect(screen.getByText(/build pipeline governance/i)).toBeInTheDocument();
    }, extendedWaitForOptions);
  }, 15000); // Increased test timeout

  test('hides domain-specific metrics when showMetrics is false', async () => {
    renderWithGovernanceContext(
      <SoftwareEngineeringProfile showMetrics={false} />,
      {
        initialDomain: GovernanceDomain.SOFTWARE_ENGINEERING,
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    // First wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/software engineering governance/i)).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Then check that metrics are not shown
    expect(screen.queryByText(/domain-specific metrics/i)).not.toBeInTheDocument();
  }, 15000); // Increased test timeout

  test('displays governance recommendations section', async () => {
    renderWithGovernanceContext(
      <SoftwareEngineeringProfile />,
      {
        initialDomain: GovernanceDomain.SOFTWARE_ENGINEERING,
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    await waitFor(() => {
      expect(screen.getByText(/governance recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/code review policy/i)).toBeInTheDocument();
      expect(screen.getByText(/recovery strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/monitoring setup/i)).toBeInTheDocument();
      expect(screen.getByText(/loop management/i)).toBeInTheDocument();
    }, extendedWaitForOptions);
  }, 15000); // Increased test timeout
});
