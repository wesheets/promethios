import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { GovernanceProfileProvider } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { SoftwareEngineeringProfile } from '../domains/SoftwareEngineeringProfile';
import { softwareEngineeringProfile } from '../governance/defaults';
import { GovernanceApiService } from '../governance/api';

// Mock the API service
jest.mock('../governance/api');

describe('SoftwareEngineeringProfile Component', () => {
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
          <SoftwareEngineeringProfile />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  const renderWithProviderAndProps = async (props: any) => {
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
          <SoftwareEngineeringProfile {...props} />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  test('renders software engineering profile with correct title', async () => {
    await renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/software engineering governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays domain-specific metrics when showMetrics is true', async () => {
    await renderWithProviderAndProps({ showMetrics: true });
    
    await waitFor(() => {
      expect(screen.getByText(/domain-specific metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/code quality governance/i)).toBeInTheDocument();
      expect(screen.getByText(/technical debt management/i)).toBeInTheDocument();
      expect(screen.getByText(/build pipeline governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('hides domain-specific metrics when showMetrics is false', async () => {
    await renderWithProviderAndProps({ showMetrics: false });
    
    // First wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/software engineering governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Then check that metrics are not shown
    expect(screen.queryByText(/domain-specific metrics/i)).not.toBeInTheDocument();
  });

  test('displays governance recommendations section', async () => {
    await renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/governance recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/code review policy/i)).toBeInTheDocument();
      expect(screen.getByText(/recovery strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/monitoring setup/i)).toBeInTheDocument();
      expect(screen.getByText(/loop management/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
