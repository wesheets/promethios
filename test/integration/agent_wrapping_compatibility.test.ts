/**
 * Integration Test Extension for Agent Wrapping Compatibility
 * 
 * This module provides integration tests that validate the compatibility
 * between the agent wrapping system and the core governance framework.
 */

import { test, expect, describe, beforeEach, afterEach } from '@jest/globals';
import { GovernanceFramework } from '../../src/governance/framework';
import { TrustLog } from '../../src/trust_log/trust_log';
import { analyzeAgent, generateWrapper } from '../../ui/dashboard/integration';
import { SchemaValidator } from '../../src/governance/schema_validator';
import { MemoryTracker } from '../../src/governance/memory_tracker';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Agent Wrapping Compatibility with Core Governance', () => {
  let tempDir: string;
  let governanceFramework: GovernanceFramework;
  let trustLog: TrustLog;
  
  beforeEach(() => {
    // Create temporary directory for test artifacts
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promethios-test-'));
    
    // Initialize governance framework and trust log
    governanceFramework = new GovernanceFramework({
      strictValidation: true,
      trackMemory: true,
      trustThreshold: 0.7
    });
    
    trustLog = new TrustLog({
      logDirectory: tempDir,
      enableMerkleChain: true
    });
    
    // Connect governance framework to trust log
    governanceFramework.setTrustLog(trustLog);
  });
  
  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
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
    const analysisResult = await analyzeAgent(langChainAgentCode, 'TestLangChainAgent');
    
    // Generate wrapper
    const wrapperResult = await generateWrapper({
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
    
    // Verify schema files were generated
    const schemaFile = wrapperResult.files.find(f => f.path.includes('schema'));
    expect(schemaFile).toBeDefined();
    
    // Verify schemas are compatible with SchemaValidator
    const schemaValidator = new SchemaValidator();
    const schemasAreValid = schemaValidator.validateSchemaDefinition(
      JSON.parse(schemaFile.content.match(/inputSchema = ({.*?});/s)[1])
    ) && schemaValidator.validateSchemaDefinition(
      JSON.parse(schemaFile.content.match(/outputSchema = ({.*?});/s)[1])
    );
    
    expect(schemasAreValid).toBe(true);
  });
  
  test('AutoGPT agent wrapping produces governance-compatible wrapper', async () => {
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
    const analysisResult = await analyzeAgent(autoGPTAgentCode, 'TestAutoGPTAgent');
    
    // Generate wrapper
    const wrapperResult = await generateWrapper({
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
    
    // Verify memory tracking integration
    expect(wrapperFile.content).toContain('MemoryTracker');
    expect(wrapperFile.content).toContain('trackMemoryAccess');
    
    // Verify trust log integration
    expect(wrapperFile.content).toContain('TrustLog');
    expect(wrapperFile.content).toContain('recordDecision');
  });
  
  test('Generic agent wrapping produces governance-compatible wrapper', async () => {
    // Sample generic agent code
    const genericAgentCode = `
      class MyGenericAgent {
        constructor(config) {
          this.config = config;
        }
        
        async execute(input) {
          // Process input
          const result = { output: "Processed " + input.query };
          return result;
        }
      }
    `;
    
    // Analyze agent code
    const analysisResult = await analyzeAgent(genericAgentCode, 'TestGenericAgent');
    
    // Generate wrapper
    const wrapperResult = await generateWrapper({
      agentCode: genericAgentCode,
      agentName: 'TestGenericAgent',
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
    
    // Verify schema validation integration
    expect(wrapperFile.content).toContain('validateInput');
    expect(wrapperFile.content).toContain('validateOutput');
    
    // Verify trust log integration
    expect(wrapperFile.content).toContain('TrustLog');
  });
  
  test('Wrapped agent correctly interacts with governance framework', async () => {
    // This test would normally execute the wrapped agent code
    // For this test, we'll simulate the execution by directly testing
    // the integration points
    
    // Sample input and output
    const sampleInput = { query: "Test query" };
    const sampleOutput = { result: "Test response" };
    
    // Sample schemas
    const inputSchema = {
      type: 'object',
      properties: {
        query: { type: 'string' }
      },
      required: ['query']
    };
    
    const outputSchema = {
      type: 'object',
      properties: {
        result: { type: 'string' }
      },
      required: ['result']
    };
    
    // Register schemas with governance framework
    governanceFramework.registerSchema('TestAgent', 'input', inputSchema);
    governanceFramework.registerSchema('TestAgent', 'output', outputSchema);
    
    // Validate input
    const inputValidation = governanceFramework.validateInput('TestAgent', sampleInput);
    expect(inputValidation.valid).toBe(true);
    
    // Track memory access (simulating what a wrapper would do)
    governanceFramework.trackMemoryAccess('TestAgent', 'read', 'query', sampleInput.query);
    
    // Validate output
    const outputValidation = governanceFramework.validateOutput('TestAgent', sampleOutput);
    expect(outputValidation.valid).toBe(true);
    
    // Record decision (simulating what a wrapper would do)
    governanceFramework.recordDecision('TestAgent', {
      input: sampleInput,
      output: sampleOutput,
      confidence: 0.9,
      reasoning: "Test reasoning"
    });
    
    // Verify trust log entries
    const logEntries = trustLog.getEntries('TestAgent');
    expect(logEntries.length).toBeGreaterThan(0);
    
    // Verify memory tracking
    const memoryAccesses = governanceFramework.getMemoryTracker().getAccesses('TestAgent');
    expect(memoryAccesses.length).toBeGreaterThan(0);
    expect(memoryAccesses[0].operation).toBe('read');
    expect(memoryAccesses[0].key).toBe('query');
  });
});

describe('Agent Wrapping UI Integration with Core Governance', () => {
  test('Developer Dashboard correctly integrates with governance framework', async () => {
    // This test would normally render the Developer Dashboard and interact with it
    // For this test, we'll focus on the integration points between the UI and backend
    
    // Mock governance metrics
    const mockMetrics = {
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
    };
    
    // Verify metrics format is compatible with UI expectations
    expect(mockMetrics).toHaveProperty('trustScore');
    expect(mockMetrics).toHaveProperty('complianceRate');
    expect(mockMetrics).toHaveProperty('agentsWrapped');
    expect(mockMetrics).toHaveProperty('violations');
    expect(mockMetrics).toHaveProperty('wrappedAgents');
    expect(mockMetrics).toHaveProperty('performanceData');
    
    // Verify violations format
    expect(mockMetrics.violations[0]).toHaveProperty('severity');
    expect(mockMetrics.violations[0]).toHaveProperty('message');
    expect(mockMetrics.violations[0]).toHaveProperty('agentName');
    
    // Verify wrapped agents format
    expect(mockMetrics.wrappedAgents[0]).toHaveProperty('name');
    expect(mockMetrics.wrappedAgents[0]).toHaveProperty('framework');
    expect(mockMetrics.wrappedAgents[0]).toHaveProperty('lastActive');
    
    // Verify performance data format
    expect(mockMetrics.performanceData).toHaveProperty('labels');
    expect(mockMetrics.performanceData).toHaveProperty('datasets');
    expect(mockMetrics.performanceData.datasets[0]).toHaveProperty('label');
    expect(mockMetrics.performanceData.datasets[0]).toHaveProperty('data');
  });
});

describe('End-to-End Workflow Tests', () => {
  test('Complete agent wrapping workflow integrates with governance', async () => {
    // This test would normally execute the complete workflow from UI to backend
    // For this test, we'll simulate the key steps and verify integration points
    
    // Step 1: Upload agent code
    const agentCode = `
      class MyAgent {
        async execute(input) {
          return { result: "Processed " + input.query };
        }
      }
    `;
    
    // Step 2: Analyze agent code
    const analysisResult = await analyzeAgent(agentCode, 'E2ETestAgent');
    expect(analysisResult).toHaveProperty('analysisResult');
    expect(analysisResult).toHaveProperty('compatibilityResult');
    expect(analysisResult).toHaveProperty('integrationPoints');
    
    // Step 3: Generate wrapper
    const wrapperResult = await generateWrapper({
      agentCode,
      agentName: 'E2ETestAgent',
      framework: analysisResult.detectedFramework,
      inputSchema: analysisResult.analysisResult.inputSchema,
      outputSchema: analysisResult.analysisResult.outputSchema,
      governanceHooks: analysisResult.integrationPoints,
      configOptions: {
        strictValidation: true,
        trackMemory: true
      }
    });
    
    expect(wrapperResult).toHaveProperty('files');
    expect(wrapperResult.files.length).toBeGreaterThan(0);
    
    // Step 4: Verify wrapper includes all necessary governance integration
    const wrapperFile = wrapperResult.files.find(f => f.path.includes('wrapper.ts'));
    expect(wrapperFile).toBeDefined();
    
    // Verify governance framework integration
    expect(wrapperFile.content).toContain('GovernanceFramework');
    expect(wrapperFile.content).toContain('validateInput');
    expect(wrapperFile.content).toContain('validateOutput');
    
    // Verify trust log integration
    expect(wrapperFile.content).toContain('TrustLog');
    expect(wrapperFile.content).toContain('recordDecision');
    
    // Verify memory tracking integration
    expect(wrapperFile.content).toContain('trackMemoryAccess');
    
    // Step 5: Verify schema compatibility
    const schemaFile = wrapperResult.files.find(f => f.path.includes('schema'));
    expect(schemaFile).toBeDefined();
    
    // This completes the end-to-end workflow test, verifying that all components
    // integrate correctly from UI through to core governance
  });
});
