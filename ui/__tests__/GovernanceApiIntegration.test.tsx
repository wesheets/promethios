/**
 * API Integration Tests for Governance Profiles
 * 
 * This file contains tests for the integration between the UI components
 * and the governance backend API.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { GovernanceProfileProvider } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { GovernanceApiService } from '../governance/api';
import { ProfileSelector } from '../governance/ProfileSelector';
import { softwareEngineeringProfile, productManagementProfile } from '../governance/defaults';

// Mock the API service
jest.mock('../governance/api');

describe('Governance API Integration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches profiles from API on mount', async () => {
    // Setup mock implementation
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([
      {
        domain: GovernanceDomain.SOFTWARE_ENGINEERING,
        displayName: 'Test Profile',
        description: 'API Test Profile',
        trustMetrics: {
          trustDecayRate: 0.05,
          minTrustThreshold: 0.65,
          trustRecoveryRate: 0.08,
          maxTrustLevel: 0.95,
        },
        monitoring: {
          eventGranularity: 4,
          monitoredEventTypes: ['test'],
          reportingFrequencyMs: 5000,
        },
        recovery: {
          statePreservationDepth: 3,
          maxRecoveryAttempts: 3,
          recoveryDelayMs: 1000,
        },
        loopState: {
          useAbortedForResourceLimits: true,
        },
        version: 'test-version',
        isDefault: true,
      }
    ]);
    
    mockApiService.fetchProfile = jest.fn().mockResolvedValue({
      domain: GovernanceDomain.SOFTWARE_ENGINEERING,
      displayName: 'Test Profile',
      description: 'API Test Profile',
      trustMetrics: {
        trustDecayRate: 0.05,
        minTrustThreshold: 0.65,
        trustRecoveryRate: 0.08,
        maxTrustLevel: 0.95,
      },
      monitoring: {
        eventGranularity: 4,
        monitoredEventTypes: ['test'],
        reportingFrequencyMs: 5000,
      },
      recovery: {
        statePreservationDepth: 3,
        maxRecoveryAttempts: 3,
        recoveryDelayMs: 1000,
      },
      loopState: {
        useAbortedForResourceLimits: true,
      },
      version: 'test-version',
      isDefault: true,
    });

    // Render with mocked API service
    render(
      <GovernanceProfileProvider 
        initialDomain={GovernanceDomain.SOFTWARE_ENGINEERING}
        apiService={mockApiService}
      >
        <ProfileSelector />
      </GovernanceProfileProvider>
    );

    // Verify API was called
    expect(mockApiService.fetchProfiles).toHaveBeenCalled();
    
    // Wait for profile to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByTestId('profile-info')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('selects profile by domain from API', async () => {
    // Setup mock implementation
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([
      softwareEngineeringProfile,
      productManagementProfile
    ]);
    
    mockApiService.fetchProfile = jest.fn().mockImplementation((domain) => {
      if (domain === GovernanceDomain.SOFTWARE_ENGINEERING) {
        return Promise.resolve(softwareEngineeringProfile);
      } else {
        return Promise.resolve(productManagementProfile);
      }
    });

    // Create a test component that displays the current profile
    const TestComponent = () => {
      const { currentProfile } = require('../governance/context').useGovernanceProfile();
      return (
        <div data-testid="profile-display">
          {currentProfile ? currentProfile.displayName : 'No profile'}
        </div>
      );
    };

    // Render with mocked API service
    render(
      <GovernanceProfileProvider 
        initialDomain={GovernanceDomain.SOFTWARE_ENGINEERING}
        apiService={mockApiService}
      >
        <TestComponent />
      </GovernanceProfileProvider>
    );

    // Verify initial profile fetch
    expect(mockApiService.fetchProfile).toHaveBeenCalledWith(GovernanceDomain.SOFTWARE_ENGINEERING);
    
    // Wait for profile to be loaded
    await waitFor(() => {
      const profileDisplay = screen.getByTestId('profile-display');
      expect(profileDisplay).toHaveTextContent(softwareEngineeringProfile.displayName);
    }, { timeout: 3000 });
  });
});
