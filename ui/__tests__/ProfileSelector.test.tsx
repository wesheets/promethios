import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { GovernanceProfileProvider } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { ProfileSelector } from '../governance/ProfileSelector';
import { softwareEngineeringProfile } from '../governance/defaults';
import { GovernanceApiService } from '../governance/api';

// Mock the API service
jest.mock('../governance/api');

describe('ProfileSelector Component', () => {
  // Setup mock API service
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = async () => {
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([softwareEngineeringProfile]);
    mockApiService.fetchProfile = jest.fn().mockResolvedValue(softwareEngineeringProfile);
    
    let result;
    await act(async () => {
      result = render(
        <GovernanceProfileProvider 
          initialDomain={GovernanceDomain.SOFTWARE_ENGINEERING}
          apiService={mockApiService}
        >
          <ProfileSelector />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  test('renders domain selector dropdown', async () => {
    await renderWithProvider();
    
    const domainSelect = screen.getByLabelText(/governance domain/i);
    expect(domainSelect).toBeInTheDocument();
  });

  test('displays software engineering as initial domain', async () => {
    await renderWithProvider();
    
    const domainSelect = screen.getByLabelText(/governance domain/i) as HTMLSelectElement;
    expect(domainSelect.value).toBe(GovernanceDomain.SOFTWARE_ENGINEERING);
  });

  test('displays profile information when profile is selected', async () => {
    await renderWithProvider();
    
    // Use waitFor to handle the async profile loading
    await waitFor(() => {
      // First check if the profile-info div exists
      const profileInfoDiv = screen.queryByTestId('profile-info');
      if (profileInfoDiv) {
        expect(profileInfoDiv).toBeInTheDocument();
      } else {
        // If not found by test ID, try to find by text content
        const profileInfo = screen.queryByText(softwareEngineeringProfile.displayName);
        expect(profileInfo).toBeInTheDocument();
      }
    }, { timeout: 3000 });
  });

  test('hides version selector when showVersionSelector is false', async () => {
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([softwareEngineeringProfile]);
    mockApiService.fetchProfile = jest.fn().mockResolvedValue(softwareEngineeringProfile);
    
    await act(async () => {
      render(
        <GovernanceProfileProvider 
          initialDomain={GovernanceDomain.SOFTWARE_ENGINEERING}
          apiService={mockApiService}
        >
          <ProfileSelector showVersionSelector={false} />
        </GovernanceProfileProvider>
      );
    });
    
    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByLabelText(/governance domain/i)).toBeInTheDocument();
    }, { timeout: 1000 });
    
    const versionSelect = screen.queryByLabelText(/profile version/i);
    expect(versionSelect).not.toBeInTheDocument();
  });
});
