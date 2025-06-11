/**
 * Agent Management Components Tests
 * 
 * This file contains unit and integration tests for the agent management components
 * implemented in Phase 3 of the Promethios UI integration.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardProvider } from '../AdminDashboardContext';
import AgentGovernanceDashboard from '../AgentGovernanceDashboard';
import AgentComplianceCard from '../AgentComplianceCard';
import AgentViolationsList from '../AgentViolationsList';
import AgentComparisonChart from '../AgentComparisonChart';
import EnforcementConfigPanel from '../EnforcementConfigPanel';
import AgentActivityFeed from '../AgentActivityFeed';

// Mock the extension points and services
jest.mock('../../core/extensions/vigilObserverExtension', () => ({
  getVigilObserverExtensionPoint: jest.fn().mockReturnValue({
    getDefault: jest.fn().mockReturnValue({
      getMetrics: jest.fn().mockResolvedValue({}),
      getObservations: jest.fn().mockResolvedValue([]),
      analyzeComplianceStatus: jest.fn().mockResolvedValue({
        compliant: true,
        violationCount: 0,
        enforcementCount: 0,
        complianceScore: 95
      })
    })
  })
}));

jest.mock('../../core/veritas/VeritasService', () => ({
  getVeritasService: jest.fn().mockReturnValue({
    analyzeEmotionalImpact: jest.fn().mockResolvedValue({
      trust: 90,
      transparency: 85,
      safety: 95,
      overall: 90
    })
  })
}));

// Mock chart.js to avoid canvas rendering issues in tests
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}));

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart</div>,
  Line: () => <div data-testid="mock-line-chart">Line Chart</div>
}));

// Helper function to wrap components with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AdminDashboardProvider>
        {ui}
      </AdminDashboardProvider>
    </MemoryRouter>
  );
};

describe('Agent Management Components', () => {
  // AgentGovernanceDashboard tests
  describe('AgentGovernanceDashboard', () => {
    it('renders without crashing', async () => {
      renderWithProviders(<AgentGovernanceDashboard />);
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Agent Governance')).toBeInTheDocument();
      });
    });
    
    it('displays filters correctly', async () => {
      renderWithProviders(<AgentGovernanceDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
      });
    });
    
    it('displays agent table with correct columns', async () => {
      renderWithProviders(<AgentGovernanceDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Agent Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Last Active')).toBeInTheDocument();
        expect(screen.getByText('Compliance')).toBeInTheDocument();
        expect(screen.getByText('Violations')).toBeInTheDocument();
      });
    });
  });
  
  // AgentComplianceCard tests
  describe('AgentComplianceCard', () => {
    const mockAgent = {
      id: 'agent-001',
      name: 'Test Agent',
      type: 'support',
      status: 'active',
      lastActive: new Date().toISOString(),
      complianceScore: 95,
      violationCount: 2,
      enforcementCount: 1
    };
    
    it('renders agent information correctly', () => {
      render(<AgentComplianceCard agent={mockAgent} />);
      
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('Compliance Score')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });
    
    it('displays violation and enforcement counts', () => {
      render(<AgentComplianceCard agent={mockAgent} />);
      
      expect(screen.getByText('Violations')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Enforcements')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    
    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<AgentComplianceCard agent={mockAgent} onClick={handleClick} />);
      
      fireEvent.click(screen.getByText('Test Agent'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
  
  // AgentViolationsList tests
  describe('AgentViolationsList', () => {
    it('renders without crashing', async () => {
      renderWithProviders(<AgentViolationsList />);
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('All Violations')).toBeInTheDocument();
      });
    });
    
    it('displays filters correctly', async () => {
      renderWithProviders(<AgentViolationsList />);
      
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
        expect(screen.getByText('Severity')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Enforcement')).toBeInTheDocument();
      });
    });
    
    it('displays violations table with correct columns', async () => {
      renderWithProviders(<AgentViolationsList />);
      
      await waitFor(() => {
        expect(screen.getByText('Time')).toBeInTheDocument();
        expect(screen.getByText('Rule')).toBeInTheDocument();
        expect(screen.getByText('Severity')).toBeInTheDocument();
        expect(screen.getByText('Message')).toBeInTheDocument();
        expect(screen.getByText('Enforcement')).toBeInTheDocument();
      });
    });
  });
  
  // AgentComparisonChart tests
  describe('AgentComparisonChart', () => {
    it('renders without crashing', async () => {
      renderWithProviders(<AgentComparisonChart />);
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Agent Compliance Comparison')).toBeInTheDocument();
      });
    });
    
    it('displays filters and options correctly', async () => {
      renderWithProviders(<AgentComparisonChart />);
      
      await waitFor(() => {
        expect(screen.getByText('Filters & Options')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Agent Type')).toBeInTheDocument();
        expect(screen.getByText('Metric')).toBeInTheDocument();
        expect(screen.getByText('Time Range')).toBeInTheDocument();
      });
    });
    
    it('renders charts correctly', async () => {
      renderWithProviders(<AgentComparisonChart />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
      });
    });
    
    it('displays summary statistics', async () => {
      renderWithProviders(<AgentComparisonChart />);
      
      await waitFor(() => {
        expect(screen.getByText('Summary Statistics')).toBeInTheDocument();
        expect(screen.getByText('Average Compliance Score')).toBeInTheDocument();
        expect(screen.getByText('Total Violations')).toBeInTheDocument();
        expect(screen.getByText('Total Enforcements')).toBeInTheDocument();
      });
    });
  });
  
  // EnforcementConfigPanel tests
  describe('EnforcementConfigPanel', () => {
    it('renders without crashing', async () => {
      renderWithProviders(<EnforcementConfigPanel />);
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Default Enforcement Configuration')).toBeInTheDocument();
      });
    });
    
    it('displays rule assignments table', async () => {
      renderWithProviders(<EnforcementConfigPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Rule Assignments')).toBeInTheDocument();
        expect(screen.getByText('Rule')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Severity')).toBeInTheDocument();
        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('Custom Message')).toBeInTheDocument();
      });
    });
    
    it('displays configuration summary', async () => {
      renderWithProviders(<EnforcementConfigPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Configuration Summary')).toBeInTheDocument();
        expect(screen.getByText('Total Rules')).toBeInTheDocument();
        expect(screen.getByText('Enabled Rules')).toBeInTheDocument();
        expect(screen.getByText('Blocking Rules')).toBeInTheDocument();
      });
    });
    
    it('has a save button', async () => {
      renderWithProviders(<EnforcementConfigPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Configuration')).toBeInTheDocument();
      });
    });
  });
  
  // AgentActivityFeed tests
  describe('AgentActivityFeed', () => {
    it('renders without crashing', async () => {
      renderWithProviders(<AgentActivityFeed />);
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Agent Activity Feed')).toBeInTheDocument();
      });
    });
    
    it('displays filters correctly', async () => {
      renderWithProviders(<AgentActivityFeed />);
      
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
        expect(screen.getByText('Activity Type')).toBeInTheDocument();
        expect(screen.getByText('Severity')).toBeInTheDocument();
        expect(screen.getByText('Search')).toBeInTheDocument();
      });
    });
    
    it('displays recent activities section', async () => {
      renderWithProviders(<AgentActivityFeed />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Activities')).toBeInTheDocument();
      });
    });
    
    it('has auto-refresh toggle', async () => {
      renderWithProviders(<AgentActivityFeed />);
      
      await waitFor(() => {
        expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
      });
    });
  });
});
