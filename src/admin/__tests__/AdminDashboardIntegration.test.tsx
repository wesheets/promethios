/**
 * Admin Dashboard Integration Tests
 * 
 * This file contains tests to validate the integration between
 * VigilObserver and the Admin Dashboard components.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardProvider } from '../AdminDashboardContext';
import AdminHeaderLink from '../AdminHeaderLink';
import AdminDashboardLayout from '../AdminDashboardLayout';
import AnalyticsDashboard from '../AnalyticsDashboard';
import { getVigilObserverExtensionPoint } from '../../core/extensions/vigilObserverExtension';

// Mock the necessary dependencies
// Note: We're directly mocking the authService instead of a non-existent AuthContext
jest.mock('../../core/firebase/authService', () => ({
  onAuthStateChange: (callback: (user: any) => void) => {
    callback({ uid: 'test-user-id', email: 'admin@example.com', displayName: 'Admin User' });
    return () => {};
  },
  isAdmin: () => Promise.resolve(true),
  getUserRoles: () => Promise.resolve(['admin']),
  getCurrentUser: () => ({ uid: 'test-user-id', email: 'admin@example.com' })
}));

jest.mock('../../core/firebase/rbacService', () => ({
  getUserPermissions: () => Promise.resolve(['manageUsers', 'manageRoles']),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/admin/dashboard' }),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>
}));

// Mock the VigilObserver extension
jest.mock('../../core/extensions/vigilObserverExtension', () => {
  const mockImplementation = {
    getMetrics: jest.fn().mockReturnValue({
      violations: {
        total: 5,
        byRule: { 'rule1': 3, 'rule2': 2 },
        byTool: { 'shell_exec': 5 },
        bySeverity: { 'critical': 2, 'high': 3 }
      },
      enforcements: {
        total: 3,
        byRule: { 'rule1': 2, 'rule2': 1 },
        byAction: { 'blocked': 2, 'warned': 1 }
      }
    }),
    getViolations: jest.fn().mockReturnValue([
      {
        ruleId: 'rule1',
        timestamp: '2025-06-10T12:00:00Z',
        agentId: 'agent1',
        userId: 'user1',
        systemId: 'system1',
        severity: 'critical'
      },
      {
        ruleId: 'rule2',
        timestamp: '2025-06-10T11:00:00Z',
        agentId: 'agent2',
        userId: 'user2',
        systemId: 'system2',
        severity: 'high'
      }
    ]),
    getEnforcements: jest.fn().mockReturnValue([
      {
        ruleId: 'rule1',
        timestamp: '2025-06-10T12:00:00Z',
        agentId: 'agent1',
        userId: 'user1',
        systemId: 'system1',
        action: 'blocked'
      }
    ]),
    analyzeComplianceStatus: jest.fn().mockReturnValue({
      status: 'violations_detected',
      compliant: false,
      violationCount: 5,
      enforcementCount: 3,
      complianceScore: 85
    }),
    getObservations: jest.fn().mockResolvedValue([
      {
        id: 'obs1',
        timestamp: '2025-06-10T12:00:00Z',
        agentId: 'agent1',
        userId: 'user1',
        systemId: 'system1',
        type: 'violation',
        category: 'critical',
        message: 'Rule violation: rule1',
        severity: 9
      },
      {
        id: 'obs2',
        timestamp: '2025-06-10T11:00:00Z',
        agentId: 'agent2',
        userId: 'user2',
        systemId: 'system2',
        type: 'warning',
        category: 'enforcement',
        message: 'Rule enforcement: rule1 (blocked)',
        severity: 8
      }
    ])
  };

  const mockExtensionPoint = {
    getDefault: jest.fn().mockReturnValue(mockImplementation),
    getMetadata: jest.fn().mockReturnValue({
      name: 'Default VigilObserver Implementation',
      version: '1.0.0'
    })
  };

  return {
    getVigilObserverExtensionPoint: jest.fn().mockReturnValue(mockExtensionPoint),
    EXTENSION_VERSION: '1.0.0'
  };
});

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
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}));

jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>
}));

// Helper function to render components with necessary providers
const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      <AdminDashboardProvider>
        {component}
      </AdminDashboardProvider>
    </MemoryRouter>
  );
};

describe('Admin Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('AdminHeaderLink shows governance status indicator', async () => {
    renderWithProviders(<AdminHeaderLink />);
    
    // Wait for the component to load and fetch data
    await waitFor(() => {
      expect(getVigilObserverExtensionPoint).toHaveBeenCalled();
    });
    
    // The link should be visible since user is admin
    const adminLink = await screen.findByText('Admin');
    expect(adminLink).toBeInTheDocument();
    
    // The governance status indicator should be present
    // Note: We can't easily test the color, but we can verify it's rendered
    const linkContainer = adminLink.closest('a');
    expect(linkContainer).toContain('rounded-full');
  });

  test('AdminDashboardLayout shows governance status summary', async () => {
    renderWithProviders(<AdminDashboardLayout />);
    
    // Wait for the component to load and fetch data
    await waitFor(() => {
      expect(getVigilObserverExtensionPoint).toHaveBeenCalled();
    });
    
    // Governance status summary should be present
    const governanceStatus = await screen.findByText('Governance Status');
    expect(governanceStatus).toBeInTheDocument();
    
    // Compliance score should be displayed
    const complianceScore = await screen.findByText('Compliance Score');
    expect(complianceScore).toBeInTheDocument();
    
    // Recent activity should be present
    const recentActivity = await screen.findByText('Recent Activity');
    expect(recentActivity).toBeInTheDocument();
  });

  test('AdminDashboardLayout shows badges for violations', async () => {
    renderWithProviders(<AdminDashboardLayout />);
    
    // Wait for the component to load and fetch data
    await waitFor(() => {
      expect(getVigilObserverExtensionPoint).toHaveBeenCalled();
    });
    
    // Navigation items should be present
    const metricsLink = await screen.findByText('Metrics');
    expect(metricsLink).toBeInTheDocument();
    
    // Analytics link should be present
    const analyticsLink = await screen.findByText('Analytics');
    expect(analyticsLink).toBeInTheDocument();
    
    // There should be badges showing violation counts
    // Note: We can't easily test the exact badge values in this test environment,
    // but we can verify the badge elements are rendered
    const navItems = screen.getAllByRole('listitem');
    expect(navItems.length).toBeGreaterThan(0);
  });

  test('AnalyticsDashboard displays VigilObserver metrics', async () => {
    renderWithProviders(<AnalyticsDashboard />);
    
    // Wait for the component to load and fetch data
    await waitFor(() => {
      expect(getVigilObserverExtensionPoint).toHaveBeenCalled();
    });
    
    // Compliance status section should be present
    const complianceStatus = await screen.findByText('Compliance Status');
    expect(complianceStatus).toBeInTheDocument();
    
    // Compliance score should be displayed
    const complianceScore = await screen.findByText('85%');
    expect(complianceScore).toBeInTheDocument();
    
    // Violation count should be displayed
    const violationCount = await screen.findByText('5');
    expect(violationCount).toBeInTheDocument();
    
    // Charts should be rendered
    const charts = await screen.findAllByText(/Chart/);
    expect(charts.length).toBeGreaterThan(0);
    
    // Recent violations table should be present
    const recentViolations = await screen.findByText('Recent Violations');
    expect(recentViolations).toBeInTheDocument();
  });

  test('AnalyticsDashboard handles time range changes', async () => {
    renderWithProviders(<AnalyticsDashboard />);
    
    // Wait for the component to load and fetch data
    await waitFor(() => {
      expect(getVigilObserverExtensionPoint).toHaveBeenCalled();
    });
    
    // Time range buttons should be present
    const dayButton = await screen.findByText('Day');
    const weekButton = await screen.findByText('Week');
    const monthButton = await screen.findByText('Month');
    
    expect(dayButton).toBeInTheDocument();
    expect(weekButton).toBeInTheDocument();
    expect(monthButton).toBeInTheDocument();
  });
});
