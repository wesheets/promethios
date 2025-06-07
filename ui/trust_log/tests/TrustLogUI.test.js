/**
 * Trust Log UI Tests
 * 
 * Tests for the Trust Log UI components including:
 * - TrustLogUI
 * - ReplayLogViewer
 * - MerkleChainVisualizer
 * - TrustSurfaceDisplay
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrustLogUI from '../components/TrustLogUI';
import ReplayLogViewer from '../components/ReplayLogViewer';
import MerkleChainVisualizer from '../components/MerkleChainVisualizer';
import TrustSurfaceDisplay from '../components/TrustSurfaceDisplay';
import pre_loop_tether_check from '../utils/tetherCheck';

// Mock the tether check function
jest.mock('../utils/tetherCheck', () => {
  return jest.fn().mockResolvedValue(true);
});

// Mock data for tests
const mockLogs = {
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
};

const mockMerkleSeals = {
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
};

const mockTrustSurface = {
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
};

// Mock fetch
global.fetch = jest.fn();

// Helper function to setup fetch mocks for all tests
const setupFetchMocks = () => {
  fetch.mockImplementation((url) => {
    if (url === '/api/codex/lock') {
      return Promise.resolve({
        text: () => Promise.resolve('contract_version: v2025.05.18\n- 5.3:\n- 11.0:\n- 12.0:\n- 6.2:\n- trust_view.schema.v1.json')
      });
    } else if (url === '/api/trust/logs') {
      return Promise.resolve({
        json: () => Promise.resolve(mockLogs)
      });
    } else if (url === '/api/trust/merkle-seals') {
      return Promise.resolve({
        json: () => Promise.resolve(mockMerkleSeals)
      });
    } else if (url === '/api/trust/surface') {
      return Promise.resolve({
        json: () => Promise.resolve(mockTrustSurface)
      });
    } else if (url === '/schemas/ui/trust_view.schema.v1.json') {
      return Promise.resolve({
        json: () => Promise.resolve({})
      });
    }
    return Promise.reject(new Error('Not found'));
  });
};

describe('TrustLogUI Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    pre_loop_tether_check.mockClear();
    setupFetchMocks();
  });
  
  test('renders tabs and switches between them', async () => {
    render(<TrustLogUI />);
    
    // Wait for component to load and verify tether
    await waitFor(() => {
      expect(screen.queryByText('Tether Verification Failed')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Wait for tabs to be visible
    await waitFor(() => {
      expect(screen.getByText('Replay Logs')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Click on Merkle Chain tab
    userEvent.click(screen.getByText('Merkle Chain'));
    
    // Increase timeout for async rendering
    await waitFor(() => {
      expect(screen.queryByText('Loading Merkle chain...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Click on Trust Surface tab
    userEvent.click(screen.getByText('Trust Surface'));
    
    // Increase timeout for async rendering
    await waitFor(() => {
      expect(screen.queryByText('Loading trust surface...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  test('displays clause citations in footer', async () => {
    render(<TrustLogUI />);
    
    await waitFor(() => {
      expect(screen.getByText('Clause 5.3')).toBeInTheDocument();
      expect(screen.getByText('Clause 11.0')).toBeInTheDocument();
      expect(screen.getByText('Clause 12.0')).toBeInTheDocument();
      expect(screen.getByText('Clause 6.2')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('ReplayLogViewer Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    pre_loop_tether_check.mockClear();
    setupFetchMocks();
  });
  
  test('performs tether check and schema validation', async () => {
    render(<ReplayLogViewer />);
    
    expect(pre_loop_tether_check).toHaveBeenCalledWith(
      'trust_log_viewer',
      'v2025.05.18',
      'v1',
      ['5.3', '11.0', '12.0', '6.2']
    );
    
    // Wait for loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText('Loading trust logs...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for clause citation text
    await waitFor(() => {
      expect(screen.getByText('Log sealed under Clause 5.3, rendered via 12.20')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('MerkleChainVisualizer Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    pre_loop_tether_check.mockClear();
    setupFetchMocks();
  });
  
  test('performs tether check and schema validation', async () => {
    render(<MerkleChainVisualizer />);
    
    expect(pre_loop_tether_check).toHaveBeenCalledWith(
      'merkle_chain_visualizer',
      'v2025.05.18',
      'v1',
      ['5.3', '11.0', '12.0', '6.2']
    );
    
    // Wait for loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText('Loading Merkle chain...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for clause citation text
    await waitFor(() => {
      expect(screen.getByText('Merkle chain sealed under Clause 11.0, rendered via 12.20')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('TrustSurfaceDisplay Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    pre_loop_tether_check.mockClear();
    setupFetchMocks();
  });
  
  test('performs tether check and schema validation', async () => {
    render(<TrustSurfaceDisplay />);
    
    expect(pre_loop_tether_check).toHaveBeenCalledWith(
      'trust_surface_display',
      'v2025.05.18',
      'v1',
      ['5.3', '11.0', '12.0', '6.2']
    );
    
    // Wait for loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText('Loading trust surface...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for clause citation text
    await waitFor(() => {
      expect(screen.getByText('Trust surface governed by Clause 6.2, rendered via 12.20')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
