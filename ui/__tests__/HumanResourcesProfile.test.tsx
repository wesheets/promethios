import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { GovernanceProfileProvider } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { HumanResourcesProfile } from '../domains/HumanResourcesProfile';
import { humanResourcesProfile } from '../governance/defaults';
import { GovernanceApiService } from '../governance/api';

// Mock the API service
jest.mock('../governance/api');

describe('HumanResourcesProfile Component', () => {
  // Setup mock API service
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = async () => {
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([humanResourcesProfile]);
    mockApiService.fetchProfile = jest.fn().mockResolvedValue(humanResourcesProfile);
    
    let result;
    await act(async () => {
      result = render(
        <GovernanceProfileProvider 
          initialDomain={GovernanceDomain.HUMAN_RESOURCES}
          apiService={mockApiService}
        >
          <HumanResourcesProfile />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  const renderWithProviderAndProps = async (props: any) => {
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([humanResourcesProfile]);
    mockApiService.fetchProfile = jest.fn().mockResolvedValue(humanResourcesProfile);
    
    let result;
    await act(async () => {
      result = render(
        <GovernanceProfileProvider 
          initialDomain={GovernanceDomain.HUMAN_RESOURCES}
          apiService={mockApiService}
        >
          <HumanResourcesProfile {...props} />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  test('renders human resources profile with correct title', async () => {
    await renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/human resources governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays domain-specific metrics when showMetrics is true', async () => {
    await renderWithProviderAndProps({ showMetrics: true });
    
    await waitFor(() => {
      expect(screen.getByText(/domain-specific metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/personnel trust/i)).toBeInTheDocument();
      expect(screen.getByText(/compliance monitoring/i)).toBeInTheDocument();
      expect(screen.getByText(/data preservation/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('hides domain-specific metrics when showMetrics is false', async () => {
    await renderWithProviderAndProps({ showMetrics: false });
    
    // First wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/human resources governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Then check that metrics are not shown
    expect(screen.queryByText(/domain-specific metrics/i)).not.toBeInTheDocument();
  });

  test('displays governance recommendations section', async () => {
    await renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/governance recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/personnel policy/i)).toBeInTheDocument();
      expect(screen.getByText(/compliance strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/data protection/i)).toBeInTheDocument();
      expect(screen.getByText(/trust management/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
