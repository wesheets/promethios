/**
 * Integration Tests for Developer Dashboard
 * 
 * This module contains tests for validating the integration between
 * the UI components and backend services in the developer dashboard.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeveloperDashboard } from '../DeveloperDashboard';
import { DashboardProvider } from '../DashboardContext';
import * as integration from '../integration';

// Mock the integration module
jest.mock('../integration', () => ({
  analyzeAgent: jest.fn(),
  generateWrapper: jest.fn(),
  testWrappedAgent: jest.fn(),
  deployWrappedAgent: jest.fn(),
  getGovernanceMetrics: jest.fn(),
  updateGovernanceConfig: jest.fn()
}));

describe('Developer Dashboard Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (integration.analyzeAgent as jest.Mock).mockResolvedValue({
      analysisResult: {
        detectedFramework: 'langchain',
        inputSchema: { type: 'object', properties: {} },
        outputSchema: { type: 'object', properties: {} }
      },
      compatibilityResult: { compatible: true, score: 0.85 },
      integrationPoints: [
        { hookType: 'pre-execution', location: 'execute method' }
      ],
      detectedFramework: 'langchain'
    });
    
    (integration.generateWrapper as jest.Mock).mockResolvedValue({
      files: [
        { path: 'wrapper.ts', content: '// Wrapper code' },
        { path: 'schemas.ts', content: '// Schema definitions' }
      ],
      warnings: [],
      outputDir: '/tmp/test-wrapper'
    });
    
    (integration.testWrappedAgent as jest.Mock).mockResolvedValue({
      success: true,
      results: [
        { input: { query: 'test' }, output: { result: 'Test response' } }
      ],
      errors: []
    });
    
    (integration.deployWrappedAgent as jest.Mock).mockResolvedValue({
      success: true,
      deploymentUrl: 'https://api.example.com/agents/test-agent',
      errors: []
    });
    
    (integration.getGovernanceMetrics as jest.Mock).mockResolvedValue({
      trustScore: 85,
      complianceRate: 92,
      agentsWrapped: 3,
      violations: [],
      wrappedAgents: [],
      performanceData: { labels: [], datasets: [] }
    });
  });
  
  test('Complete agent wrapping workflow', async () => {
    // Render the dashboard with provider
    render(
      <DashboardProvider>
        <DeveloperDashboard />
      </DashboardProvider>
    );
    
    // Step 1: Upload Agent Code
    
    // Check that the initial step is rendered
    expect(screen.getByText('Upload Your Agent Code')).toBeInTheDocument();
    
    // Fill in agent name
    fireEvent.change(screen.getByLabelText('Agent Name'), {
      target: { value: 'Test Agent' }
    });
    
    // Fill in agent code
    fireEvent.change(screen.getByLabelText('Agent Code'), {
      target: { value: 'class TestAgent { execute() { return "Hello"; } }' }
    });
    
    // Click next button
    fireEvent.click(screen.getByText('Next'));
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(integration.analyzeAgent).toHaveBeenCalledWith(
        'class TestAgent { execute() { return "Hello"; } }',
        'Test Agent'
      );
    });
    
    // Step 2: Analyze & Configure
    
    // Check that the analysis step is rendered
    await waitFor(() => {
      expect(screen.getByText('Analysis Results & Configuration')).toBeInTheDocument();
    });
    
    // Check that detected framework is displayed
    expect(screen.getByText('langchain')).toBeInTheDocument();
    
    // Click next button
    fireEvent.click(screen.getByText('Next'));
    
    // Wait for wrapper generation to complete
    await waitFor(() => {
      expect(integration.generateWrapper).toHaveBeenCalled();
    });
    
    // Step 3: Generate Wrapper
    
    // Check that the wrapper step is rendered
    await waitFor(() => {
      expect(screen.getByText('Generated Wrapper Code')).toBeInTheDocument();
    });
    
    // Check that wrapper files are displayed
    expect(screen.getByText('wrapper.ts')).toBeInTheDocument();
    expect(screen.getByText('schemas.ts')).toBeInTheDocument();
    
    // Click next button
    fireEvent.click(screen.getByText('Next'));
    
    // Step 4: Test & Deploy
    
    // Check that the test step is rendered
    await waitFor(() => {
      expect(screen.getByText('Test & Deploy Your Wrapped Agent')).toBeInTheDocument();
    });
    
    // Check that success message is displayed
    expect(screen.getByText('Agent Successfully Wrapped!')).toBeInTheDocument();
    
    // Click test button
    fireEvent.click(screen.getByText('Test Agent'));
    
    // Wait for test to complete
    await waitFor(() => {
      expect(integration.testWrappedAgent).toHaveBeenCalled();
    });
    
    // Click deploy button
    fireEvent.click(screen.getByText('Deploy to Production'));
    
    // Wait for deployment to complete
    await waitFor(() => {
      expect(integration.deployWrappedAgent).toHaveBeenCalled();
    });
    
    // Verify metrics are refreshed after deployment
    await waitFor(() => {
      expect(integration.getGovernanceMetrics).toHaveBeenCalledTimes(2);
    });
  });
  
  test('Handles analysis errors gracefully', async () => {
    // Mock analysis error
    (integration.analyzeAgent as jest.Mock).mockRejectedValue(
      new Error('Failed to analyze agent code')
    );
    
    // Render the dashboard with provider
    render(
      <DashboardProvider>
        <DeveloperDashboard />
      </DashboardProvider>
    );
    
    // Fill in agent name
    fireEvent.change(screen.getByLabelText('Agent Name'), {
      target: { value: 'Test Agent' }
    });
    
    // Fill in agent code
    fireEvent.change(screen.getByLabelText('Agent Code'), {
      target: { value: 'invalid code' }
    });
    
    // Click next button
    fireEvent.click(screen.getByText('Next'));
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(integration.analyzeAgent).toHaveBeenCalled();
      expect(screen.getByText('Failed to analyze agent code')).toBeInTheDocument();
    });
  });
  
  test('Metrics dashboard displays governance data', async () => {
    // Render the dashboard with provider
    render(
      <DashboardProvider>
        <DeveloperDashboard />
      </DashboardProvider>
    );
    
    // Click on Metrics Dashboard tab
    fireEvent.click(screen.getByText('Metrics Dashboard'));
    
    // Check that metrics are displayed
    await waitFor(() => {
      expect(screen.getByText('Governance Metrics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // Trust Score
      expect(screen.getByText('92%')).toBeInTheDocument(); // Compliance Rate
      expect(screen.getByText('3')).toBeInTheDocument(); // Agents Wrapped
    });
  });
  
  test('Configuration panel updates settings', async () => {
    // Mock config update success
    (integration.updateGovernanceConfig as jest.Mock).mockResolvedValue({
      success: true,
      config: { trustThreshold: 0.8 },
      errors: []
    });
    
    // Render the dashboard with provider
    render(
      <DashboardProvider>
        <DeveloperDashboard />
      </DashboardProvider>
    );
    
    // Click on Configuration tab
    fireEvent.click(screen.getByText('Configuration'));
    
    // Check that configuration panel is displayed
    expect(screen.getByText('Governance Configuration')).toBeInTheDocument();
    
    // Change trust threshold
    fireEvent.change(screen.getByLabelText('Trust Threshold'), {
      target: { value: '0.8' }
    });
    
    // Click save button
    fireEvent.click(screen.getByText('Save Configuration'));
    
    // Wait for config update to complete
    await waitFor(() => {
      expect(integration.updateGovernanceConfig).toHaveBeenCalledWith(
        expect.objectContaining({ trustThreshold: 0.8 })
      );
    });
  });
});
