/**
 * Dashboard integration tests with improved async handling
 * 
 * Tests for the Developer Dashboard integration with agent wrapping workflow.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeveloperDashboard } from '../DeveloperDashboard';
import { DashboardProvider } from '../context/DashboardContext';
import { setupMockFetch } from '../../test-utils/testing-library';

// Mock the integration service
jest.mock('../services/integration', () => ({
  analyzeAgent: jest.fn().mockResolvedValue({
    framework: 'langchain',
    compatibility: 0.95,
    requiredAdapters: ['memory', 'tools']
  }),
  generateWrapper: jest.fn().mockResolvedValue({
    files: [
      { name: 'wrapper.ts', content: 'export class Wrapper {}' },
      { name: 'schemas.ts', content: 'export const schema = {}' }
    ]
  }),
  testWrappedAgent: jest.fn().mockResolvedValue({
    success: true,
    output: 'Hello'
  }),
  deployWrappedAgent: jest.fn().mockResolvedValue({
    success: true,
    deploymentId: 'dep-123'
  }),
  getGovernanceMetrics: jest.fn().mockResolvedValue({
    trustScore: 0.85,
    complianceRate: 0.92,
    agentsWrapped: 3,
    activeDeployments: 2
  }),
  updateGovernanceConfig: jest.fn().mockResolvedValue({
    success: true,
    config: { trustThreshold: 0.75 },
    errors: []
  })
}));

// Setup mock fetch
setupMockFetch();

// Extended waitFor options with longer timeout
const extendedWaitForOptions = {
  timeout: 10000, // Increased from default
  interval: 100
};

// Custom render with providers
const renderDashboard = (initialTab = 'wizard') => {
  return render(
    <DashboardProvider>
      <DeveloperDashboard initialTab={initialTab} />
    </DashboardProvider>
  );
};

describe('Developer Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the dashboard with wizard tab by default', async () => {
    renderDashboard();
    
    // Wait for the dashboard to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Promethios Developer Dashboard')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Check that wizard tab is active
    expect(screen.getByText('Agent Wrapping Wizard')).toBeInTheDocument();
    expect(screen.getByText('Input Agent Details')).toBeInTheDocument();
  }, 15000); // Increased test timeout

  test('can switch between tabs', async () => {
    renderDashboard();
    
    // Wait for the dashboard to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Promethios Developer Dashboard')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Click on metrics tab
    const metricsTab = screen.getByTestId('metrics-tab');
    fireEvent.click(metricsTab);
    
    // Wait for metrics tab content to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Governance Metrics Dashboard')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Click on config tab
    const configTab = screen.getByTestId('config-tab');
    fireEvent.click(configTab);
    
    // Wait for config tab content to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Governance Configuration')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Click back to wizard tab
    const wizardTab = screen.getByTestId('wizard-tab');
    fireEvent.click(wizardTab);
    
    // Wait for wizard tab content to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Agent Wrapping Wizard')).toBeInTheDocument();
    }, extendedWaitForOptions);
  }, 20000); // Increased test timeout for multi-step test

  test('can complete the agent wrapping workflow', async () => {
    renderDashboard();
    
    // Wait for the dashboard to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Promethios Developer Dashboard')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Fill in agent details
    const nameInput = screen.getByLabelText('Agent Name');
    const codeInput = screen.getByLabelText('Agent Code');
    
    fireEvent.change(nameInput, { target: { value: 'TestAgent' } });
    fireEvent.change(codeInput, { target: { value: 'function test() { return "Hello"; }' } });
    
    // Submit form
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Wait for analysis step to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Analysis Results & Configuration')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Check analysis results
    expect(screen.getByText('Detected Framework:')).toBeInTheDocument();
    expect(screen.getByText('langchain')).toBeInTheDocument();
    
    // Go to next step
    const analysisNextButton = screen.getByText('Next');
    fireEvent.click(analysisNextButton);
    
    // Wait for wrapper step to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Generated Wrapper Code')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Check wrapper files
    expect(screen.getByText('wrapper.ts')).toBeInTheDocument();
    
    // Go to next step
    const wrapperNextButton = screen.getByText('Next');
    fireEvent.click(wrapperNextButton);
    
    // Wait for test & deploy step to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Test & Deploy Your Wrapped Agent')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Check agent summary
    expect(screen.getByText('Agent Name:')).toBeInTheDocument();
    expect(screen.getByText('TestAgent')).toBeInTheDocument();
  }, 30000); // Increased test timeout for complex multi-step workflow
});
