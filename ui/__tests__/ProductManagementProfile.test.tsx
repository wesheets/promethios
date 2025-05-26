import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { GovernanceProfileProvider } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { ProductManagementProfile } from '../domains/ProductManagementProfile';
import { productManagementProfile } from '../governance/defaults';
import { GovernanceApiService } from '../governance/api';

// Mock the API service
jest.mock('../governance/api');

describe('ProductManagementProfile Component', () => {
  // Setup mock API service
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = async () => {
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([productManagementProfile]);
    mockApiService.fetchProfile = jest.fn().mockResolvedValue(productManagementProfile);
    
    let result;
    await act(async () => {
      result = render(
        <GovernanceProfileProvider 
          initialDomain={GovernanceDomain.PRODUCT_MANAGEMENT}
          apiService={mockApiService}
        >
          <ProductManagementProfile />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  const renderWithProviderAndProps = async (props: any) => {
    const mockApiService = new GovernanceApiService() as jest.Mocked<GovernanceApiService>;
    mockApiService.fetchProfiles = jest.fn().mockResolvedValue([productManagementProfile]);
    mockApiService.fetchProfile = jest.fn().mockResolvedValue(productManagementProfile);
    
    let result;
    await act(async () => {
      result = render(
        <GovernanceProfileProvider 
          initialDomain={GovernanceDomain.PRODUCT_MANAGEMENT}
          apiService={mockApiService}
        >
          <ProductManagementProfile {...props} />
        </GovernanceProfileProvider>
      );
    });
    
    return { result, mockApiService };
  };

  test('renders product management profile with correct title', async () => {
    await renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/product management governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays domain-specific metrics when showMetrics is true', async () => {
    await renderWithProviderAndProps({ showMetrics: true });
    
    await waitFor(() => {
      expect(screen.getByText(/domain-specific metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/market analysis trust/i)).toBeInTheDocument();
      expect(screen.getByText(/planning efficiency/i)).toBeInTheDocument();
      expect(screen.getByText(/decision recovery/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('hides domain-specific metrics when showMetrics is false', async () => {
    await renderWithProviderAndProps({ showMetrics: false });
    
    // First wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/product management governance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Then check that metrics are not shown
    expect(screen.queryByText(/domain-specific metrics/i)).not.toBeInTheDocument();
  });

  test('displays governance recommendations section', async () => {
    await renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/governance recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/market analysis policy/i)).toBeInTheDocument();
      expect(screen.getByText(/planning strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/recovery approach/i)).toBeInTheDocument();
      expect(screen.getByText(/trust management/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
