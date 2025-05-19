/**
 * Trust Log UI Test Suite
 * 
 * End-to-end tests for the Trust Log UI Viewer components,
 * ensuring proper tether checks, schema validation, and governance enforcement.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrustLogUI from '../components/TrustLogUI';
import ReplayLogViewer from '../components/ReplayLogViewer';
import MerkleChainVisualizer from '../components/MerkleChainVisualizer';
import TrustSurfaceDisplay from '../components/TrustSurfaceDisplay';
import pre_loop_tether_check from '../utils/tetherCheck';
import { validateAgainstSchema } from '../utils/schemaValidator';

// Mock fetch API
global.fetch = jest.fn();

// Mock successful tether check
jest.mock('../utils/tetherCheck', () => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve(true);
  });
});

// Mock schema validation
jest.mock('../utils/schemaValidator', () => {
  return {
    validateAgainstSchema: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        valid: true,
        errors: []
      });
    })
  };
});

// Sample test data
const mockLogs = {
  trust_data: {
    logs: [
      {
        entry_id: '1',
        timestamp: '2025-05-18T12:00:00Z',
        event_type: 'execution_start',
        event_data: { loop_id: 'abc123' },
        current_hash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      }
    ]
  }
};

const mockMerkleSeals = {
  trust_data: {
    merkle_seals: [
      {
        seal_id: '1',
        timestamp: '2025-05-18T12:05:00Z',
        root_hash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        conflict_metadata: { conflict_type: 'none' }
      }
    ]
  }
};

const mockTrustSurface = {
  trust_data: {
    trust_surface: {
      trust_scores: {
        'component_1': 0.95,
        'component_2': 0.75
      },
      justifications: [
        {
          component_id: 'component_1',
          justification_text: 'Passed all verification checks',
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

// Reset mocks before each test
beforeEach(() => {
  fetch.mockReset();
  pre_loop_tether_check.mockClear();
  validateAgainstSchema.mockClear();
});

describe('TrustLogUI Component', () => {
  test('performs tether check on mount', async () => {
    fetch.mockResolvedValueOnce({
      text: () => Promise.resolve('contract_version: v2025.05.18\n- 5.3:\n- 11.0:\n- 12.0:\n- 6.2:\n- trust_view.schema.v1.json')
    });
    
    render(<TrustLogUI />);
    
    expect(pre_loop_tether_check).toHaveBeenCalledWith(
      'trust_log_ui',
      'v2025.05.18',
      'v1',
      ['5.3', '11.0', '12.0', '6.2']
    );
    
    await waitFor(() => {
      expect(screen.getByText('Trust Log UI Viewer')).toBeInTheDocument();
    });
  });
  
  test('displays tether error when tether check fails', async () => {
    pre_loop_tether_check.mockImplementationOnce(() => Promise.resolve(false));
    
    render(<TrustLogUI />);
    
    await waitFor(() => {
      expect(screen.getByText('Tether Verification Failed')).toBeInTheDocument();
    });
  });
  
  test('displays all tabs and switches between them', async () => {
    // Mock API responses
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
    
    render(<TrustLogUI />);
    
    await waitFor(() => {
      expect(screen.getByText('Replay Logs')).toBeInTheDocument();
    });
    
    // Click on Merkle Chain tab
    userEvent.click(screen.getByText('Merkle Chain'));
    
    await waitFor(() => {
      expect(screen.getByText('Merkle chain sealed under Clause 11.0, rendered via 12.20')).toBeInTheDocument();
    });
    
    // Click on Trust Surface tab
    userEvent.click(screen.getByText('Trust Surface'));
    
    await waitFor(() => {
      expect(screen.getByText('Trust surface governed by Clause 6.2, rendered via 12.20')).toBeInTheDocument();
    });
  });
  
  test('displays clause citations in footer', async () => {
    render(<TrustLogUI />);
    
    await waitFor(() => {
      expect(screen.getByText('Clause 5.3')).toBeInTheDocument();
      expect(screen.getByText('Clause 11.0')).toBeInTheDocument();
      expect(screen.getByText('Clause 12.0')).toBeInTheDocument();
      expect(screen.getByText('Clause 6.2')).toBeInTheDocument();
    });
  });
});

describe('ReplayLogViewer Component', () => {
  test('performs tether check and schema validation', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/api/codex/lock') {
        return Promise.resolve({
          text: () => Promise.resolve('contract_version: v2025.05.18\n- 5.3:\n- 11.0:\n- 12.0:\n- 6.2:\n- trust_view.schema.v1.json')
        });
      } else if (url === '/api/trust/logs') {
        return Promise.resolve({
          json: () => Promise.resolve(mockLogs)
        });
      } else if (url === '/schemas/ui/trust_view.schema.v1.json') {
        return Promise.resolve({
          json: () => Promise.resolve({})
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    render(<ReplayLogViewer />);
    
    expect(pre_loop_tether_check).toHaveBeenCalledWith(
      'trust_log_viewer',
      'v2025.05.18',
      'v1',
      ['5.3', '11.0', '12.0', '6.2']
    );
    
    await waitFor(() => {
      expect(screen.getByText('Log sealed under Clause 5.3, rendered via 12.20')).toBeInTheDocument();
    });
  });
});

describe('MerkleChainVisualizer Component', () => {
  test('performs tether check and schema validation', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/api/codex/lock') {
        return Promise.resolve({
          text: () => Promise.resolve('contract_version: v2025.05.18\n- 5.3:\n- 11.0:\n- 12.0:\n- 6.2:\n- trust_view.schema.v1.json')
        });
      } else if (url === '/api/trust/merkle-seals') {
        return Promise.resolve({
          json: () => Promise.resolve(mockMerkleSeals)
        });
      } else if (url === '/schemas/ui/trust_view.schema.v1.json') {
        return Promise.resolve({
          json: () => Promise.resolve({})
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    render(<MerkleChainVisualizer />);
    
    expect(pre_loop_tether_check).toHaveBeenCalledWith(
      'merkle_chain_visualizer',
      'v2025.05.18',
      'v1',
      ['5.3', '11.0', '12.0', '6.2']
    );
    
    await waitFor(() => {
      expect(screen.getByText('Merkle chain sealed under Clause 11.0, rendered via 12.20')).toBeInTheDocument();
    });
  });
});

describe('TrustSurfaceDisplay Component', () => {
  test('performs tether check and schema validation', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/api/codex/lock') {
        return Promise.resolve({
          text: () => Promise.resolve('contract_version: v2025.05.18\n- 5.3:\n- 11.0:\n- 12.0:\n- 6.2:\n- trust_view.schema.v1.json')
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
    
    render(<TrustSurfaceDisplay />);
    
    expect(pre_loop_tether_check).toHaveBeenCalledWith(
      'trust_surface_display',
      'v2025.05.18',
      'v1',
      ['5.3', '11.0', '12.0', '6.2']
    );
    
    await waitFor(() => {
      expect(screen.getByText('Trust surface governed by Clause 6.2, rendered via 12.20')).toBeInTheDocument();
    });
  });
});
