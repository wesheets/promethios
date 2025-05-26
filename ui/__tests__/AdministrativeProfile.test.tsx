import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { GovernanceProfileProvider } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { AdministrativeProfile } from '../domains/AdministrativeProfile';
import { administrativeProfile } from '../governance/defaults';
import { GovernanceApiService } from '../governance/api';

// Mock the API service
jest.mock('../governance/api');

describe('AdministrativeProfile Component', () => {
  // Setup mock API service
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = async () => {
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([administrativeProfile]);
    mockApiService.fetchProfile = jest.fn().mockResolvedValue(administrativeProfile);
    
    let result;
    await act(async () => {
      result = render(
        <GovernanceProfileProvider 
          initialDomain={GovernanceDomain.ADMINISTRATIVE}
          apiService={mockApiService}
        >
          <AdministrativeProfile />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  const renderWithProviderAndProps = async (props: any) => {
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([administrativeProfile]);
    mockApiService.fetchProfile = jest.fn().mockResolvedValue(administrativeProfile);
    
    let result;
    await act(async () => {
      result = render(
        <GovernanceProfileProvider 
          initialDomain={GovernanceDomain.ADMINISTRATIVE}
          apiService={mockApiService}
        >
          <AdministrativeProfile {...props} />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  test('renders administrative profile with correct title', async () => {
    await renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/administrative governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays domain-specific metrics when showMetrics is true', async () => {
    await renderWithProviderAndProps({ showMetrics: true });
    
    await waitFor(() => {
      expect(screen.getByText(/domain-specific metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/document processing trust/i)).toBeInTheDocument();
      expect(screen.getByText(/process efficiency/i)).toBeInTheDocument();
      expect(screen.getByText(/recovery simplicity/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('hides domain-specific metrics when showMetrics is false', async () => {
    await renderWithProviderAndProps({ showMetrics: false });
    
    // First wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/administrative governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Then check that metrics are not shown
    expect(screen.queryByText(/domain-specific metrics/i)).not.toBeInTheDocument();
  });

  test('displays governance recommendations section', async () => {
    await renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/governance recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/document processing/i)).toBeInTheDocument();
      expect(screen.getByText(/monitoring strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/recovery approach/i)).toBeInTheDocument();
      expect(screen.getByText(/trust management/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
