/**
 * Updated governance testing utilities with improved context integration and React imports
 * 
 * Provides test utilities for governance-related component tests with better
 * alignment between mock data structure and component expectations.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import * as React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { GovernanceContext } from '../governance/context';
import { GovernanceDomain } from '../governance/types';

// Define the GovernanceProfileConfig interface to match what the component expects
export interface GovernanceProfileConfig {
  id: string;
  domain: GovernanceDomain;
  displayName: string;
  description: string;
  name: string; // Added to match what ProfileSelector expects
  trustMetrics: {
    trustDecayRate: number;
    minTrustThreshold: number;
    trustRecoveryRate: number;
    maxTrustLevel: number;
  };
  monitoring: {
    eventGranularity: number;
    monitoredEventTypes: string[];
    reportingFrequencyMs: number;
  };
  recovery: {
    statePreservationDepth: number;
    maxRecoveryAttempts: number;
    recoveryDelayMs: number;
  };
  loopState: {
    useAbortedForResourceLimits: boolean;
  };
  version: string;
  isDefault: boolean;
}

// Mock Governance API Service
export class MockGovernanceApiService {
  private mockProfiles: Record<GovernanceDomain, GovernanceProfileConfig> = {} as Record<GovernanceDomain, GovernanceProfileConfig>;
  private mockErrors: Record<GovernanceDomain, Error> = {} as Record<GovernanceDomain, Error>;
  private mockDelay: number = 0;
  
  constructor(mockDelay: number = 0) {
    this.mockDelay = mockDelay;
  }
  
  setMockProfiles(profiles: Record<GovernanceDomain, GovernanceProfileConfig>) {
    this.mockProfiles = profiles;
  }
  
  setMockErrors(errors: Record<GovernanceDomain, Error>) {
    this.mockErrors = errors;
  }
  
  setMockError(domain: GovernanceDomain, error: Error) {
    if (!this.mockErrors) {
      this.mockErrors = {} as Record<GovernanceDomain, Error>;
    }
    this.mockErrors[domain] = error;
  }
  
  async getProfile(domain: GovernanceDomain): Promise<GovernanceProfileConfig> {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
    
    if (this.mockErrors[domain]) {
      throw this.mockErrors[domain];
    }
    
    return this.mockProfiles[domain];
  }
  
  async getAllProfiles(): Promise<Record<GovernanceDomain, GovernanceProfileConfig>> {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
    
    return this.mockProfiles;
  }
}

// Default mock profiles for testing with complete structure
export const DEFAULT_MOCK_PROFILES: Record<GovernanceDomain, GovernanceProfileConfig> = {
  [GovernanceDomain.SOFTWARE_ENGINEERING]: {
    id: GovernanceDomain.SOFTWARE_ENGINEERING, // Changed to match domain for ProfileSelector
    domain: GovernanceDomain.SOFTWARE_ENGINEERING,
    displayName: 'Software Engineering',
    name: 'Software Engineering', // Added to match what ProfileSelector expects
    description: 'Governance profile for software engineering teams',
    trustMetrics: {
      trustDecayRate: 0.05,
      minTrustThreshold: 0.65,
      trustRecoveryRate: 0.08,
      maxTrustLevel: 0.95,
    },
    monitoring: {
      eventGranularity: 4,
      monitoredEventTypes: ['code_review', 'build', 'deploy'],
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
    version: '2.0',
    isDefault: true,
  },
  [GovernanceDomain.PRODUCT_MANAGEMENT]: {
    id: GovernanceDomain.PRODUCT_MANAGEMENT, // Changed to match domain for ProfileSelector
    domain: GovernanceDomain.PRODUCT_MANAGEMENT,
    displayName: 'Product Management',
    name: 'Product Management', // Added to match what ProfileSelector expects
    description: 'Governance profile for product management teams',
    trustMetrics: {
      trustDecayRate: 0.04,
      minTrustThreshold: 0.70,
      trustRecoveryRate: 0.06,
      maxTrustLevel: 0.90,
    },
    monitoring: {
      eventGranularity: 3,
      monitoredEventTypes: ['feature_request', 'prioritization', 'release'],
      reportingFrequencyMs: 10000,
    },
    recovery: {
      statePreservationDepth: 2,
      maxRecoveryAttempts: 2,
      recoveryDelayMs: 2000,
    },
    loopState: {
      useAbortedForResourceLimits: false,
    },
    version: '2.0',
    isDefault: true,
  }
};

// Render with governance context
interface RenderWithGovernanceContextOptions {
  initialDomain?: GovernanceDomain | null;
  mockProfiles?: Record<GovernanceDomain, GovernanceProfileConfig>;
  mockErrors?: Record<GovernanceDomain, Error>;
  mockApiService?: MockGovernanceApiService;
  mockDelay?: number;
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
}

export function renderWithGovernanceContext(
  ui: React.ReactElement,
  {
    initialDomain = GovernanceDomain.SOFTWARE_ENGINEERING,
    mockProfiles = DEFAULT_MOCK_PROFILES,
    mockErrors = {},
    mockApiService,
    mockDelay = 0,
    ...renderOptions
  }: RenderWithGovernanceContextOptions = {}
) {
  // Use provided mockApiService or create a new one
  const apiService = mockApiService || new MockGovernanceApiService(mockDelay);
  
  // Only set profiles and errors if we created a new service
  if (!mockApiService) {
    apiService.setMockProfiles(mockProfiles);
    
    // Set individual errors if provided
    Object.entries(mockErrors).forEach(([domain, error]) => {
      apiService.setMockError(domain as unknown as GovernanceDomain, error);
    });
  }
  
  // Create a wrapper that provides the context with the correct structure
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Use state to allow for domain changes in tests
    const [currentDomain, setCurrentDomain] = React.useState(initialDomain);
    
    // Create a context value that matches what the component expects
    const contextValue = {
      currentDomain,
      setCurrentDomain,
      profiles: mockProfiles,
      loading: false,
      error: null,
      apiService
    };
    
    return (
      <GovernanceContext.Provider value={contextValue}>
        {children}
      </GovernanceContext.Provider>
    );
  };
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
