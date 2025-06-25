/**
 * Comprehensive Test Suite for Multi-Agent Orchestration
 * 
 * Tests all orchestration functionality with backward compatibility validation.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  PrometheosOrchestrationEngine, 
  PrometheosLegacyConverter,
  orchestrationEngine,
  legacyConverter
} from '../services/OrchestrationService';
import { 
  OrchestrationFlow, 
  OrchestrationContext, 
  OrchestrationResult,
  OrchestrationEvent,
  ExecutionStatus
} from '../types/orchestration';
import { AgentWrapperRegistry } from '../services/AgentWrapperRegistry';

// Mock dependencies
jest.mock('../services/AgentWrapperRegistry');
jest.mock('../../../services/multiAgentService');

describe('Multi-Agent Orchestration Engine', () => {
  let engine: PrometheosOrchestrationEngine;
  let mockAgentRegistry: jest.Mocked<AgentWrapperRegistry>;
  let testFlow: OrchestrationFlow;
  let testContext: OrchestrationContext;

  beforeEach(() => {
    engine = new PrometheosOrchestrationEngine();
    mockAgentRegistry = AgentWrapperRegistry.getInstance() as jest.Mocked<AgentWrapperRegistry>;
    
    // Setup test flow
    testFlow = {
      id: 'test-flow-1',
      name: 'Test Sequential Flow',
      description: 'Test flow for unit testing',
      type: 'sequential',
      collaborationModel: 'sequential_handoffs',
      nodes: [
        {
          id: 'node-1',
          agentId: 'agent-1',
          position: { x: 0, y: 0 },
          status: 'pending',
          retryCount: 0,
          maxRetries: 3
        },
        {
          id: 'node-2',
          agentId: 'agent-2',
          position: { x: 200, y: 0 },
          status: 'pending',
          retryCount: 0,
          maxRetries: 3
        }
      ],
      connections: [
        {
          id: 'conn-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2'
        }
      ],
      entryPointId: 'node-1',
      exitPointIds: ['node-2'],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Setup test context
    testContext = {
      flowId: 'test-flow-1',
      userId: 'test-user',
      sessionId: 'test-session',
      startTime: new Date(),
      timeout: 300000, // 5 minutes
      governanceConfig: {
        trustManagement: {
          minimumTrustThreshold: 0.7,
          trustVerificationProtocols: [],
          trustRecoveryMechanisms: []
        },
        policyCompliance: {
          requiredPolicies: [],
          complianceValidation: 'moderate',
          violationHandling: 'warn'
        },
        qualityAssurance: {
          qualityGates: [],
          validationCriteria: [],
          reworkProtocols: []
        }
      },
      collaborationConfig: {
        model: 'sequential_handoffs',
        settings: {
          sequentialHandoffs: {
            handoffValidation: true,
            qualityGates: [],
            timeoutHandling: 'retry'
          }
        }
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Flow Validation', () => {
    test('should validate a correct flow', async () => {
      const result = await engine.validateFlow(testFlow);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject flow without nodes', async () => {
      const invalidFlow = { ...testFlow, nodes: [] };
      const result = await engine.validateFlow(invalidFlow);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Flow must have at least one node');
    });

    test('should reject flow without entry point', async () => {
      const invalidFlow = { ...testFlow, entryPointId: '' };
      const result = await engine.validateFlow(invalidFlow);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Flow must have an entry point');
    });

    test('should reject flow without exit points', async () => {
      const invalidFlow = { ...testFlow, exitPointIds: [] };
      const result = await engine.validateFlow(invalidFlow);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Flow must have at least one exit point');
    });

    test('should validate node agent IDs', async () => {
      const invalidFlow = { 
        ...testFlow, 
        nodes: [{ ...testFlow.nodes[0], agentId: '' }] 
      };
      const result = await engine.validateFlow(invalidFlow);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Node node-1 must have an agent ID');
    });

    test('should validate connections reference existing nodes', async () => {
      const invalidFlow = { 
        ...testFlow, 
        connections: [{
          id: 'invalid-conn',
          sourceNodeId: 'non-existent',
          targetNodeId: 'node-2'
        }]
      };
      const result = await engine.validateFlow(invalidFlow);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Connection invalid-conn references non-existent source node non-existent');
    });
  });

  describe('Flow Execution', () => {
    test('should execute sequential flow successfully', async () => {
      const result = await engine.executeFlow(testFlow, testContext);
      
      expect(result.status).toBe('completed');
      expect(result.flowId).toBe('test-flow-1');
      expect(result.metrics.totalNodes).toBe(2);
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    test('should handle flow execution errors', async () => {
      // Create a flow that will fail validation
      const invalidFlow = { ...testFlow, nodes: [] };
      
      await expect(engine.executeFlow(invalidFlow, testContext))
        .rejects.toThrow('Flow validation failed');
    });

    test('should track active flows', async () => {
      const activeFlowsBefore = await engine.getActiveFlows();
      expect(activeFlowsBefore).toHaveLength(0);

      // Start flow execution (don't await to keep it active)
      const executionPromise = engine.executeFlow(testFlow, testContext);
      
      // Check active flows during execution
      const activeFlowsDuring = await engine.getActiveFlows();
      expect(activeFlowsDuring).toContain('test-flow-1');

      // Wait for completion
      await executionPromise;
      
      // Check active flows after completion
      const activeFlowsAfter = await engine.getActiveFlows();
      expect(activeFlowsAfter).not.toContain('test-flow-1');
    });
  });

  describe('Flow Control', () => {
    test('should pause and resume flow', async () => {
      // Start flow
      const executionPromise = engine.executeFlow(testFlow, testContext);
      
      // Pause flow
      const pauseResult = await engine.pauseFlow('test-flow-1');
      expect(pauseResult).toBe(true);
      
      // Check status
      const pausedStatus = await engine.getFlowStatus('test-flow-1');
      expect(pausedStatus).toBe('paused');
      
      // Resume flow
      const resumeResult = await engine.resumeFlow('test-flow-1');
      expect(resumeResult).toBe(true);
      
      // Check status
      const resumedStatus = await engine.getFlowStatus('test-flow-1');
      expect(resumedStatus).toBe('running');
      
      // Wait for completion
      await executionPromise;
    });

    test('should cancel flow', async () => {
      // Start flow
      const executionPromise = engine.executeFlow(testFlow, testContext);
      
      // Cancel flow
      const cancelResult = await engine.cancelFlow('test-flow-1');
      expect(cancelResult).toBe(true);
      
      // Check status
      const cancelledStatus = await engine.getFlowStatus('test-flow-1');
      expect(cancelledStatus).toBe('cancelled');
      
      // Wait for execution to complete
      await executionPromise;
    });

    test('should not pause non-running flow', async () => {
      const pauseResult = await engine.pauseFlow('non-existent-flow');
      expect(pauseResult).toBe(false);
    });
  });

  describe('Event Handling', () => {
    test('should emit flow events', async () => {
      const events: OrchestrationEvent[] = [];
      const eventListener = (event: OrchestrationEvent) => {
        events.push(event);
      };

      engine.addEventListener(eventListener);
      
      await engine.executeFlow(testFlow, testContext);
      
      expect(events).toHaveLength(2); // flow_started, flow_completed
      expect(events[0].type).toBe('flow_started');
      expect(events[1].type).toBe('flow_completed');
      
      engine.removeEventListener(eventListener);
    });

    test('should remove event listeners', async () => {
      const events: OrchestrationEvent[] = [];
      const eventListener = (event: OrchestrationEvent) => {
        events.push(event);
      };

      engine.addEventListener(eventListener);
      engine.removeEventListener(eventListener);
      
      await engine.executeFlow(testFlow, testContext);
      
      expect(events).toHaveLength(0);
    });
  });

  describe('Result Retrieval', () => {
    test('should retrieve flow results', async () => {
      await engine.executeFlow(testFlow, testContext);
      
      const result = await engine.getFlowResult('test-flow-1');
      
      expect(result).toBeDefined();
      expect(result?.flowId).toBe('test-flow-1');
      expect(result?.status).toBe('completed');
    });

    test('should return null for non-existent flow', async () => {
      const result = await engine.getFlowResult('non-existent-flow');
      expect(result).toBeNull();
    });
  });
});

describe('Legacy Converter', () => {
  let converter: PrometheosLegacyConverter;

  beforeEach(() => {
    converter = new PrometheosLegacyConverter();
  });

  describe('Legacy to Flow Conversion', () => {
    test('should convert legacy sequential system', () => {
      const legacySystem = {
        id: 'legacy-1',
        name: 'Legacy Sequential System',
        description: 'Test legacy system',
        agents: ['agent-1', 'agent-2', 'agent-3'],
        collaborationModel: 'sequential',
        governanceRules: { rateLimiting: { requestsPerMinute: 60 } }
      };

      const flow = converter.convertLegacyMultiAgentSystem(legacySystem);

      expect(flow.id).toBe('legacy-1');
      expect(flow.name).toBe('Legacy Sequential System');
      expect(flow.type).toBe('sequential');
      expect(flow.collaborationModel).toBe('sequential_handoffs');
      expect(flow.nodes).toHaveLength(3);
      expect(flow.connections).toHaveLength(2); // n-1 connections for sequential
      expect(flow.agents).toEqual(['agent-1', 'agent-2', 'agent-3']);
    });

    test('should convert legacy parallel system', () => {
      const legacySystem = {
        id: 'legacy-2',
        name: 'Legacy Parallel System',
        agents: ['agent-1', 'agent-2'],
        collaborationModel: 'parallel'
      };

      const flow = converter.convertLegacyMultiAgentSystem(legacySystem);

      expect(flow.type).toBe('parallel');
      expect(flow.collaborationModel).toBe('parallel_processing');
      expect(flow.connections).toHaveLength(0); // No connections for parallel
    });

    test('should handle missing legacy fields', () => {
      const legacySystem = {
        agents: ['agent-1']
      };

      const flow = converter.convertLegacyMultiAgentSystem(legacySystem);

      expect(flow.id).toMatch(/^flow-\d+$/);
      expect(flow.name).toBe('Converted Flow');
      expect(flow.description).toBe('Converted from legacy multi-agent system');
      expect(flow.type).toBe('sequential');
    });
  });

  describe('Flow to Legacy Conversion', () => {
    test('should convert flow to legacy format', () => {
      const flow: OrchestrationFlow = {
        id: 'flow-1',
        name: 'Test Flow',
        description: 'Test description',
        type: 'sequential',
        collaborationModel: 'sequential_handoffs',
        nodes: [
          { id: 'node-1', agentId: 'agent-1', position: { x: 0, y: 0 }, status: 'pending', retryCount: 0, maxRetries: 3 },
          { id: 'node-2', agentId: 'agent-2', position: { x: 200, y: 0 }, status: 'pending', retryCount: 0, maxRetries: 3 }
        ],
        connections: [],
        entryPointId: 'node-1',
        exitPointIds: ['node-2'],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        governanceRules: { rateLimiting: { requestsPerMinute: 60 } }
      };

      const legacy = converter.convertToLegacyFormat(flow);

      expect(legacy.id).toBe('flow-1');
      expect(legacy.name).toBe('Test Flow');
      expect(legacy.agents).toEqual(['agent-1', 'agent-2']);
      expect(legacy.collaborationModel).toBe('sequential_handoffs');
      expect(legacy.governanceRules).toEqual({ rateLimiting: { requestsPerMinute: 60 } });
    });
  });
});

describe('Backward Compatibility', () => {
  test('should maintain compatibility with existing multiAgentService', async () => {
    // Test that orchestration engine can work with existing service types
    const legacyContext = {
      context_id: 'legacy-context-1',
      name: 'Legacy Context',
      agent_ids: ['agent-1', 'agent-2'],
      collaboration_model: 'sequential',
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Convert to orchestration flow
    const flow = legacyConverter.convertLegacyMultiAgentSystem({
      id: legacyContext.context_id,
      name: legacyContext.name,
      agents: legacyContext.agent_ids,
      collaborationModel: legacyContext.collaboration_model
    });

    expect(flow.id).toBe(legacyContext.context_id);
    expect(flow.nodes.map(n => n.agentId)).toEqual(legacyContext.agent_ids);
  });

  test('should work with existing agent wrapper types', () => {
    // Test that orchestration types are compatible with existing AgentWrapper
    const mockWrapper = {
      id: 'wrapper-1',
      agentId: 'agent-1',
      name: 'Test Wrapper',
      description: 'Test wrapper',
      capabilities: [],
      governance: {},
      metrics: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const node = {
      id: 'node-1',
      agentId: 'agent-1',
      wrapper: mockWrapper,
      position: { x: 0, y: 0 },
      status: 'pending' as const,
      retryCount: 0,
      maxRetries: 3
    };

    expect(node.wrapper.id).toBe('wrapper-1');
    expect(node.agentId).toBe('agent-1');
  });
});

describe('Integration Tests', () => {
  test('should integrate with singleton orchestration engine', async () => {
    const testFlow: OrchestrationFlow = {
      id: 'integration-test-flow',
      name: 'Integration Test Flow',
      description: 'Test flow for integration testing',
      type: 'sequential',
      collaborationModel: 'sequential_handoffs',
      nodes: [
        {
          id: 'node-1',
          agentId: 'agent-1',
          position: { x: 0, y: 0 },
          status: 'pending',
          retryCount: 0,
          maxRetries: 3
        }
      ],
      connections: [],
      entryPointId: 'node-1',
      exitPointIds: ['node-1'],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const testContext: OrchestrationContext = {
      flowId: 'integration-test-flow',
      userId: 'test-user',
      sessionId: 'test-session',
      startTime: new Date(),
      timeout: 300000,
      governanceConfig: {
        trustManagement: {
          minimumTrustThreshold: 0.7,
          trustVerificationProtocols: [],
          trustRecoveryMechanisms: []
        },
        policyCompliance: {
          requiredPolicies: [],
          complianceValidation: 'moderate',
          violationHandling: 'warn'
        },
        qualityAssurance: {
          qualityGates: [],
          validationCriteria: [],
          reworkProtocols: []
        }
      },
      collaborationConfig: {
        model: 'sequential_handoffs',
        settings: {}
      }
    };

    // Test with singleton instance
    const result = await orchestrationEngine.executeFlow(testFlow, testContext);
    
    expect(result.status).toBe('completed');
    expect(result.flowId).toBe('integration-test-flow');
  });

  test('should integrate with legacy converter singleton', () => {
    const legacySystem = {
      id: 'legacy-integration-test',
      name: 'Legacy Integration Test',
      agents: ['agent-1', 'agent-2'],
      collaborationModel: 'sequential'
    };

    // Test with singleton instance
    const flow = legacyConverter.convertLegacyMultiAgentSystem(legacySystem);
    
    expect(flow.id).toBe('legacy-integration-test');
    expect(flow.nodes).toHaveLength(2);
  });
});

describe('Error Handling', () => {
  test('should handle orchestration engine errors gracefully', async () => {
    const invalidFlow = {
      id: 'invalid-flow',
      name: 'Invalid Flow',
      description: 'Flow with missing required fields',
      type: 'sequential' as const,
      collaborationModel: 'sequential_handoffs' as const,
      nodes: [], // Invalid: no nodes
      connections: [],
      entryPointId: '',
      exitPointIds: [],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const testContext: OrchestrationContext = {
      flowId: 'invalid-flow',
      userId: 'test-user',
      sessionId: 'test-session',
      startTime: new Date(),
      timeout: 300000,
      governanceConfig: {
        trustManagement: {
          minimumTrustThreshold: 0.7,
          trustVerificationProtocols: [],
          trustRecoveryMechanisms: []
        },
        policyCompliance: {
          requiredPolicies: [],
          complianceValidation: 'moderate',
          violationHandling: 'warn'
        },
        qualityAssurance: {
          qualityGates: [],
          validationCriteria: [],
          reworkProtocols: []
        }
      },
      collaborationConfig: {
        model: 'sequential_handoffs',
        settings: {}
      }
    };

    await expect(orchestrationEngine.executeFlow(invalidFlow, testContext))
      .rejects.toThrow();
  });

  test('should handle event listener errors gracefully', async () => {
    const faultyListener = () => {
      throw new Error('Listener error');
    };

    orchestrationEngine.addEventListener(faultyListener);

    // Should not throw even with faulty listener
    await expect(orchestrationEngine.executeFlow(testFlow, testContext))
      .resolves.toBeDefined();

    orchestrationEngine.removeEventListener(faultyListener);
  });
});

// Performance Tests
describe('Performance Tests', () => {
  test('should handle multiple concurrent flows', async () => {
    const flows = Array.from({ length: 5 }, (_, i) => ({
      ...testFlow,
      id: `concurrent-flow-${i}`,
      name: `Concurrent Flow ${i}`
    }));

    const contexts = flows.map(flow => ({
      ...testContext,
      flowId: flow.id
    }));

    const startTime = Date.now();
    
    const results = await Promise.all(
      flows.map((flow, i) => orchestrationEngine.executeFlow(flow, contexts[i]))
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(results).toHaveLength(5);
    expect(results.every(r => r.status === 'completed')).toBe(true);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });

  test('should handle large flows efficiently', async () => {
    const largeFlow: OrchestrationFlow = {
      ...testFlow,
      id: 'large-flow',
      name: 'Large Flow Test',
      nodes: Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        agentId: `agent-${i}`,
        position: { x: i * 50, y: 0 },
        status: 'pending' as const,
        retryCount: 0,
        maxRetries: 3
      }))
    };

    const startTime = Date.now();
    
    const result = await orchestrationEngine.executeFlow(largeFlow, {
      ...testContext,
      flowId: 'large-flow'
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result.status).toBe('completed');
    expect(result.metrics.totalNodes).toBe(100);
    expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
  });
});

