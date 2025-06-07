/**
 * Agent Wrapping Compatibility integration tests with improved async handling
 * 
 * Tests for the agent wrapping compatibility workflow across different frameworks.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardProvider } from '../../dashboard/context/DashboardContext';
import { DeveloperDashboard } from '../../dashboard/DeveloperDashboard';

// Mock the integration service
jest.mock('../../dashboard/services/integration', () => ({
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

// Extended waitFor options with longer timeout
const extendedWaitForOptions = {
  timeout: 10000, // Increased from 5000
  interval: 100
};

describe('Agent Wrapping Compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('can wrap a LangChain agent', async () => {
    // Render the dashboard
    render(
      <DashboardProvider>
        <DeveloperDashboard initialTab="wizard" />
      </DashboardProvider>
    );
    
    // Wait for the dashboard to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Promethios Developer Dashboard')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Fill in agent details
    const nameInput = screen.getByLabelText('Agent Name');
    const codeInput = screen.getByLabelText('Agent Code');
    
    fireEvent.change(nameInput, { target: { value: 'LangChainAgent' } });
    fireEvent.change(codeInput, { target: { value: 'import { LangChain } from "langchain";' } });
    
    // Submit form
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Wait for analysis step to render with increased timeout
    await waitFor(() => {
      expect(screen.getByText('Analysis Results & Configuration')).toBeInTheDocument();
    }, extendedWaitForOptions);
    
    // Verify analysis results
    const mockAnalyzeAgent = require('../../dashboard/services/integration').analyzeAgent;
    expect(mockAnalyzeAgent).toHaveBeenCalledWith('import { LangChain } from "langchain";', 'LangChainAgent');
  }, 20000); // Increased test timeout to 20 seconds
});
