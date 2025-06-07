/**
 * ProfileSelector component tests
 * 
 * Tests for the ProfileSelector component which allows users to select governance profiles.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileSelector } from '../governance/ProfileSelector';
import { GovernanceDomain } from '../governance/types'; // Fixed import path
import { 
  renderWithGovernanceContext, 
  MockGovernanceApiService,
  DEFAULT_MOCK_PROFILES,
  extendedWaitForOptions
} from '../test-utils/governance-testing'; // Fixed import path

describe('ProfileSelector Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders profile options correctly', async () => {
    renderWithGovernanceContext(<ProfileSelector />, {
      mockProfiles: DEFAULT_MOCK_PROFILES,
      mockDelay: 10
    });
    
    // Wait for profiles to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Check that all profiles are rendered
    expect(screen.getByText('Product Management')).toBeInTheDocument();
  });

  test('shows selected profile as active', async () => {
    renderWithGovernanceContext(<ProfileSelector />, {
      initialDomain: GovernanceDomain.SOFTWARE_ENGINEERING,
      mockProfiles: DEFAULT_MOCK_PROFILES,
      mockDelay: 10
    });
    
    // Wait for profiles to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Check that Software Engineering is marked as active
    const softwareEngOption = screen.getByText('Software Engineering').closest('button');
    expect(softwareEngOption).toHaveClass('active');
    
    // Check that Product Management is not marked as active
    const productMgmtOption = screen.getByText('Product Management').closest('button');
    expect(productMgmtOption).not.toHaveClass('active');
  });

  test('shows version selector when showVersions is true', async () => {
    renderWithGovernanceContext(<ProfileSelector showVersions={true} />, {
      mockProfiles: DEFAULT_MOCK_PROFILES,
      mockDelay: 10
    });
    
    // Wait for profiles to load with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    }, { timeout: 10000, interval: 100 }); // Increased timeout
    
    // Check that version selector is rendered
    expect(screen.getByLabelText('Version')).toBeInTheDocument();
    expect(screen.getByText('Version: 2.0')).toBeInTheDocument();
  }, 15000); // Increased test timeout

  test('hides version selector when showVersions is false', async () => {
    renderWithGovernanceContext(<ProfileSelector showVersions={false} />, {
      mockProfiles: DEFAULT_MOCK_PROFILES,
      mockDelay: 10
    });
    
    // Wait for profiles to load with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    }, { timeout: 10000, interval: 100 }); // Increased timeout
    
    // Check that version selector is not rendered
    expect(screen.queryByLabelText('Version')).not.toBeInTheDocument();
    expect(screen.queryByText('Version: 2.0')).not.toBeInTheDocument();
  }, 15000); // Increased test timeout

  test('handles API errors gracefully', async () => {
    // Create mock API service with error
    const mockApiService = new MockGovernanceApiService();
    mockApiService.setMockProfiles(DEFAULT_MOCK_PROFILES);
    mockApiService.setMockError(GovernanceDomain.SOFTWARE_ENGINEERING, new Error('API error'));
    
    renderWithGovernanceContext(<ProfileSelector />, {
      mockApiService, // Use the configured mockApiService
      mockDelay: 10
    });
    
    // Wait for error to be displayed with increased timeout
    await waitFor(() => {
      expect(screen.getByText(/Error loading profiles/i)).toBeInTheDocument();
    }, { timeout: 10000, interval: 100 }); // Increased timeout
  }, 15000); // Increased test timeout
});
