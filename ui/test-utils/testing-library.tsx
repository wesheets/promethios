/**
 * Test utilities for Promethios UI testing
 * 
 * Provides common utilities for testing UI components with proper
 * async handling and mocking.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { DashboardProvider } from '../dashboard/context/DashboardContext';

// Mock service responses
export const mockServiceResponses = {
  analyzeAgent: {
    framework: 'langchain',
    compatibility: 0.95,
    requiredAdapters: ['memory', 'tools']
  },
  generateWrapper: {
    files: [
      { name: 'wrapper.ts', content: 'export class Wrapper {}' },
      { name: 'schemas.ts', content: 'export const schema = {}' }
    ]
  },
  testWrappedAgent: {
    success: true,
    output: 'Hello'
  },
  deployWrappedAgent: {
    success: true,
    deploymentId: 'dep-123'
  },
  governanceMetrics: {
    trustScore: 0.85,
    complianceRate: 0.92,
    agentsWrapped: 3,
    activeDeployments: 2
  },
  updateGovernanceConfig: {
    success: true,
    config: { trustThreshold: 0.75 },
    errors: []
  }
};

// Custom render function with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <DashboardProvider>
        {children}
      </DashboardProvider>
    ),
    ...options
  });
}

// Setup mock fetch for tests
export function setupMockFetch() {
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/codex/lock') {
        return Promise.resolve({
          text: () => Promise.resolve('contract_version: v2025.05.18\n- 5.3:\n- 11.0:\n- 12.0:\n- 6.2:\n- trust_view.schema.v1.json')
        });
      } else if (url === '/api/trust/logs') {
        return Promise.resolve({
          json: () => Promise.resolve({
            trust_data: {
              logs: [
                {
                  entry_id: 'log-001',
                  timestamp: '2025-05-18T14:30:00Z',
                  event_type: 'GOVERNANCE_DECISION',
                  event_data: { decision_id: 'dec-123', outcome: 'APPROVED' },
                  current_hash: 'a1b2c3d4e5f6g7h8i9j0'
                }
              ]
            }
          })
        });
      } else if (url === '/api/trust/merkle-seals') {
        return Promise.resolve({
          json: () => Promise.resolve({
            trust_data: {
              merkle_seals: [
                {
                  seal_id: 'seal-001',
                  timestamp: '2025-05-18T14:35:00Z',
                  root_hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
                  conflict_metadata: { conflict_type: 'none' }
                }
              ]
            }
          })
        });
      } else if (url === '/api/trust/surface') {
        return Promise.resolve({
          json: () => Promise.resolve({
            trust_data: {
              trust_surface: {
                trust_scores: {
                  'governance.core': 0.95,
                  'verification.seal': 0.87,
                  'crypto.manager': 0.92
                },
                justifications: [
                  {
                    component_id: 'governance.core',
                    justification_text: 'All governance tests passing',
                    trust_score: 0.95
                  }
                ],
                override_status: {
                  active_overrides: [],
                  pending_overrides: []
                }
              }
            }
          })
        });
      } else if (url === '/schemas/ui/trust_view.schema.v1.json') {
        return Promise.resolve({
          json: () => Promise.resolve({})
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });
}

// Setup mock window.matchMedia
export function setupMockMatchMedia() {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });
}

// Extended waitFor options with longer timeout
export const extendedWaitForOptions = {
  timeout: 5000,
  interval: 100
};
