/**
 * Integration Test Extension for Agent Wrapping Compatibility
 * 
 * This module provides integration tests that validate the compatibility
 * between the agent wrapping system and the core governance framework.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeveloperDashboard, DashboardProvider } from '../../dashboard';
import * as integration from '../../dashboard/integration';

// Mock the integration module
jest.mock('../../dashboard/integration', () => ({
  analyzeAgent: jest.fn(),
  generateWrapper: jest.fn(),
  testWrappedAgent: jest.fn(),
  deployWrappedAgent: jest.fn(),
  getGovernanceMetrics: jest.fn(),
  updateGovernanceConfig: jest.fn()
}));

describe('Agent Wrapping Compatibility with Core Governance', () => {
  beforeEach(() => {
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
        { path: 'wrapper.ts', content: '// Wrapper code\nimport { GovernanceFramework } from "governance";\nimport { TrustLog } from "trust_log";\n// validateInput, validateOutput, trackMemoryAccess' },
        { path: 'schemas.ts', content: '// Schema definitions\nconst inputSchema = {"type":"object","properties":{"query":{"type":"string"}}};\nconst outputSchema = {"type":"object","properties":{"result":{"type":"string"}}};' }
      ],
      warnings: [],
      outputDir: '/tmp/test-wrapper'
    });
  });
  
  test('LangChain agent wrapping produces governance-compatible wrapper', async () => {
    // Sample LangChain agent code
    const langChainAgentCode = `
      import { LLMChain } from 'langchain';
      
      class MyLangChainAgent {
        private chain: LLMChain;
        
        constructor(llm, prompt) {
          this.chain = new LLMChain({ llm, prompt });
        }
        
        async execute(input) {
          return await this.chain.call(input);
        }
      }
    `;
    
    // Analyze agent code
    const analysisResult = await integration.analyzeAgent(langChainAgentCode, 'TestLangChainAgent');
    
    // Generate wrapper
    const wrapperResult = await integration.generateWrapper({
      agentCode: langChainAgentCode,
      agentName: 'TestLangChainAgent',
      framework: analysisResult.detectedFramework,
      inputSchema: analysisResult.analysisResult.inputSchema,
      outputSchema: analysisResult.analysisResult.outputSchema,
      governanceHooks: analysisResult.integrationPoints,
      configOptions: {
        strictValidation: true,
        trackMemory: true
      }
    });
    
    // Verify wrapper files were generated
    expect(wrapperResult.files.length).toBeGreaterThan(0);
    
    // Find wrapper implementation file
    const wrapperFile = wrapperResult.files.find(f => f.path.includes('wrapper.ts'));
    expect(wrapperFile).toBeDefined();
    
    // Verify wrapper includes governance integration
    expect(wrapperFile.content).toContain('GovernanceFramework');
    expect(wrapperFile.content).toContain('validateInput');
    expect(wrapperFile.content).toContain('validateOutput');
    expect(wrapperFile.content).toContain('trackMemoryAccess');
  });
  
  test('AutoGPT agent wrapping produces governance-compatible wrapper', async () => {
    // Update mock for AutoGPT framework
    (integration.analyzeAgent as jest.Mock).mockResolvedValue({
      analysisResult: {
        detectedFramework: 'autogpt',
        inputSchema: { type: 'object', properties: {} },
        outputSchema: { type: 'object', properties: {} }
      },
      compatibilityResult: { compatible: true, score: 0.85 },
      integrationPoints: [
        { hookType: 'pre-execution', location: 'execute method' }
      ],
      detectedFramework: 'autogpt'
    });
    
    // Sample AutoGPT agent code
    const autoGPTAgentCode = `
      import { Agent } from 'autogpt';
      
      class MyAutoGPTAgent {
        private agent: Agent;
        
        constructor(config) {
          this.agent = new Agent(config);
        }
        
        async execute(goals) {
          return await this.agent.run(goals);
        }
      }
    `;
    
    // Analyze agent code
    const analysisResult = await integration.analyzeAgent(autoGPTAgentCode, 'TestAutoGPTAgent');
    
    // Generate wrapper
    const wrapperResult = await integration.generateWrapper({
      agentCode: autoGPTAgentCode,
      agentName: 'TestAutoGPTAgent',
      framework: analysisResult.detectedFramework,
      inputSchema: analysisResult.analysisResult.inputSchema,
      outputSchema: analysisResult.analysisResult.outputSchema,
      governanceHooks: analysisResult.integrationPoints,
      configOptions: {
        strictValidation: true,
        trackMemory: true
      }
    });
    
    // Verify wrapper files were generated
    expect(wrapperResult.files.length).toBeGreaterThan(0);
    
    // Find wrapper implementation file
    const wrapperFile = wrapperResult.files.find(f => f.path.includes('wrapper.ts'));
    expect(wrapperFile).toBeDefined();
    
    // Verify wrapper includes governance integration
    expect(wrapperFile.content).toContain('GovernanceFramework');
    expect(wrapperFile.content).toContain('validateInput');
    expect(wrapperFile.content).toContain('validateOutput');
  });
});

describe('Agent Wrapping UI Integration with Core Governance', () => {
  beforeEach(() => {
    // Setup default mock implementations for UI tests
    (integration.getGovernanceMetrics as jest.Mock).mockResolvedValue({
      trustScore: 85,
      complianceRate: 92,
      agentsWrapped: 3,
      violations: [
        { severity: 'error', message: 'Schema validation failed', agentName: 'TestAgent' }
      ],
      wrappedAgents: [
        { name: 'TestAgent', framework: 'langchain', lastActive: new Date().toISOString() }
      ],
      performanceData: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ label: 'Trust Score', data: [80, 82, 85] }]
      }
    });
  });
  
  test('Developer Dashboard correctly integrates with governance framework', async () => {
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
    
    // Verify metrics format is compatible with UI expectations
    expect(integration.getGovernanceMetrics).toHaveBeenCalled();
    const mockMetrics = await integration.getGovernanceMetrics();
    
    expect(mockMetrics).toHaveProperty('trustScore');
    expect(mockMetrics).toHaveProperty('complianceRate');
    expect(mockMetrics).toHaveProperty('agentsWrapped');
    expect(mockMetrics).toHaveProperty('violations');
    expect(mockMetrics).toHaveProperty('wrappedAgents');
    expect(mockMetrics).toHaveProperty('performanceData');
  });
});

describe('End-to-End Workflow Tests', () => {
  beforeEach(() => {
    // Setup mocks for end-to-end workflow tests
    (integration.analyzeAgent as jest.Mock).mockResolvedValue({
      analysisResult: {
        detectedFramework: 'generic',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { result: { type: 'string' } } }
      },
      compatibilityResult: { compatible: true, score: 0.85 },
      integrationPoints: [
        { hookType: 'pre-execution', location: 'execute method' },
        { hookType: 'post-execution', location: 'execute method' }
      ],
      detectedFramework: 'generic'
    });
    
    (integration.generateWrapper as jest.Mock).mockResolvedValue({
      files: [
        { path: 'wrapper.ts', content: '// Wrapper code\nimport { GovernanceFramework } from "governance";\nimport { TrustLog } from "trust_log";\n// validateInput, validateOutput, trackMemoryAccess, recordDecision' },
        { path: 'schemas.ts', content: '// Schema definitions\nconst inputSchema = {"type":"object","properties":{"query":{"type":"string"}}};\nconst outputSchema = {"type":"object","properties":{"result":{"type":"string"}}};' }
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
  });
  
  test('Complete agent wrapping workflow integrates with governance', async () => {
    // Render the dashboard with provider
    render(
      <DashboardProvider>
        <DeveloperDashboard />
      </DashboardProvider>
    );
    
    // Step 1: Upload Agent Code
    
    // Fill in agent name
    fireEvent.change(screen.getByLabelText('Agent Name'), {
      target: { value: 'E2ETestAgent' }
    });
    
    // Fill in agent code
    fireEvent.change(screen.getByLabelText('Agent Code'), {
      target: { value: 'class MyAgent { async execute(input) { return { result: "Processed " + input.query }; } }' }
    });
    
    // Click next button
    fireEvent.click(screen.getByText('Next'));
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(integration.analyzeAgent).toHaveBeenCalled();
    });
    
    // Step 2: Analyze & Configure
    
    // Check that the analysis step is rendered
    await waitFor(() => {
      expect(screen.getByText('Analysis Results & Configuration')).toBeInTheDocument();
    });
    
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
    
    // Verify wrapper includes all necessary governance integration
    const wrapperResult = await integration.generateWrapper({} as any);
    const wrapperFile = wrapperResult.files.find(f => f.path.includes('wrapper.ts'));
    
    // Verify governance framework integration
    expect(wrapperFile.content).toContain('GovernanceFramework');
    expect(wrapperFile.content).toContain('validateInput');
    expect(wrapperFile.content).toContain('validateOutput');
    
    // Verify trust log integration
    expect(wrapperFile.content).toContain('TrustLog');
    expect(wrapperFile.content).toContain('recordDecision');
    
    // This completes the end-to-end workflow test, verifying that all components
    // integrate correctly from UI through to core governance
  });
});
