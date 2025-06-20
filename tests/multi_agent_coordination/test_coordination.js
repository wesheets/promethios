"""
Node.js Test Suite for Multi-Agent Coordination Module.

This test suite validates the Node.js components of the multi-agent coordination system.
"""

const assert = require('assert');
const { describe, it, before, after, beforeEach, afterEach } = require('mocha');
const MultiAgentCoordination = require('../../src/modules/multi_agent_coordination/index');

describe('Multi-Agent Coordination Module', function() {
  let coordination;
  
  before(function() {
    // Set up test environment
    this.timeout(10000);
  });
  
  beforeEach(function() {
    // Initialize coordination instance for each test
    coordination = new MultiAgentCoordination({
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {}
      },
      config: {
        test: true
      }
    });
  });
  
  afterEach(function() {
    // Clean up after each test
    if (coordination) {
      // Clean up any contexts created during testing
    }
  });
  
  describe('Initialization', function() {
    it('should initialize successfully', function() {
      assert(coordination);
      assert(coordination.id);
      assert.strictEqual(typeof coordination.id, 'string');
    });
    
    it('should have all required components', function() {
      assert(coordination.sharedContextManager);
      assert(coordination.agentCommunicationProtocol);
      assert(coordination.multiAgentGovernance);
      assert(coordination.coordinationManager);
    });
  });
  
  describe('Context Management', function() {
    it('should create a coordination context', async function() {
      const contextData = {
        name: 'Test Context',
        agentIds: ['agent1', 'agent2'],
        collaborationModel: 'shared_context',
        policies: {
          trustThreshold: 0.7,
          governanceEnabled: true
        }
      };
      
      const context = await coordination.createCoordinationContext(contextData);
      
      assert(context);
      assert(context.id);
      assert.strictEqual(context.name, contextData.name);
      assert.deepStrictEqual(context.agentIds, contextData.agentIds);
      assert.strictEqual(context.collaborationModel, contextData.collaborationModel);
    });
    
    it('should handle invalid context data', async function() {
      const invalidData = {
        // Missing required fields
        name: 'Invalid Context'
      };
      
      try {
        await coordination.createCoordinationContext(invalidData);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('validation'));
      }
    });
  });
  
  describe('Message Handling', function() {
    let contextId;
    
    beforeEach(async function() {
      const context = await coordination.createCoordinationContext({
        name: 'Message Test Context',
        agentIds: ['agent1', 'agent2'],
        collaborationModel: 'shared_context',
        policies: {
          trustThreshold: 0.7,
          governanceEnabled: true
        }
      });
      contextId = context.id;
    });
    
    it('should send message to agents', async function() {
      const messageData = {
        contextId: contextId,
        fromAgentId: 'user',
        toAgentIds: ['agent1', 'agent2'],
        message: {
          type: 'user_message',
          content: 'Test message',
          governanceEnabled: true
        },
        requireResponse: false,
        priority: 'normal'
      };
      
      const result = await coordination.sendMessage(messageData);
      
      assert(result);
      assert(result.messageId);
      assert(Array.isArray(result.deliveryResults));
      assert.strictEqual(result.deliveryResults.length, 2);
    });
    
    it('should handle message validation', async function() {
      const invalidMessage = {
        contextId: contextId,
        // Missing required fields
        message: {
          content: 'Invalid message'
        }
      };
      
      try {
        await coordination.sendMessage(invalidMessage);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('validation'));
      }
    });
  });
  
  describe('Governance Integration', function() {
    let contextId;
    
    beforeEach(async function() {
      const context = await coordination.createCoordinationContext({
        name: 'Governance Test Context',
        agentIds: ['agent1', 'agent2'],
        collaborationModel: 'shared_context',
        policies: {
          trustThreshold: 0.8,
          governanceEnabled: true,
          auditLevel: 'high'
        }
      });
      contextId = context.id;
    });
    
    it('should calculate trust scores', function() {
      const agentId = 'agent1';
      const factors = {
        governanceCompliance: 0.9,
        communicationQuality: 0.8,
        taskCompletion: 0.85,
        policyAdherence: 0.95,
        collaborationScore: 0.75
      };
      
      const trustScore = coordination.multiAgentGovernance.calculateTrustScore(
        contextId, agentId, factors
      );
      
      assert(typeof trustScore === 'number');
      assert(trustScore >= 0 && trustScore <= 1);
    });
    
    it('should check compliance', function() {
      const message = {
        type: 'user_message',
        content: 'Test compliance check',
        governanceEnabled: true
      };
      
      const compliance = coordination.multiAgentGovernance.checkCompliance(
        contextId, 'agent1', message
      );
      
      assert(compliance);
      assert(typeof compliance.compliant === 'boolean');
      assert(typeof compliance.score === 'number');
      assert(Array.isArray(compliance.violations));
    });
  });
  
  describe('Collaboration Models', function() {
    it('should support shared context collaboration', async function() {
      const context = await coordination.createCoordinationContext({
        name: 'Shared Context Test',
        agentIds: ['agent1', 'agent2', 'agent3'],
        collaborationModel: 'shared_context',
        policies: {
          trustThreshold: 0.7,
          governanceEnabled: true
        }
      });
      
      assert.strictEqual(context.collaborationModel, 'shared_context');
      
      // Test that all agents can see shared context
      const sharedContext = coordination.sharedContextManager.getSharedContext(context.id);
      assert(sharedContext);
      assert.deepStrictEqual(sharedContext.agentIds, context.agentIds);
    });
    
    it('should support sequential handoffs', async function() {
      const context = await coordination.createCoordinationContext({
        name: 'Sequential Test',
        agentIds: ['agent1', 'agent2', 'agent3'],
        collaborationModel: 'sequential_handoffs',
        policies: {
          trustThreshold: 0.7,
          governanceEnabled: true
        }
      });
      
      assert.strictEqual(context.collaborationModel, 'sequential_handoffs');
    });
    
    it('should support parallel processing', async function() {
      const context = await coordination.createCoordinationContext({
        name: 'Parallel Test',
        agentIds: ['agent1', 'agent2', 'agent3'],
        collaborationModel: 'parallel_processing',
        policies: {
          trustThreshold: 0.7,
          governanceEnabled: true
        }
      });
      
      assert.strictEqual(context.collaborationModel, 'parallel_processing');
    });
  });
  
  describe('Metrics and Monitoring', function() {
    let contextId;
    
    beforeEach(async function() {
      const context = await coordination.createCoordinationContext({
        name: 'Metrics Test Context',
        agentIds: ['agent1', 'agent2'],
        collaborationModel: 'shared_context',
        policies: {
          trustThreshold: 0.7,
          governanceEnabled: true
        }
      });
      contextId = context.id;
    });
    
    it('should calculate collaboration metrics', function() {
      const metrics = coordination.getCollaborationMetrics(contextId);
      
      assert(metrics);
      assert(typeof metrics.collaborationEffectiveness === 'number');
      assert(typeof metrics.averageResponseTime === 'number');
      assert(typeof metrics.taskCompletionRate === 'number');
      assert(Array.isArray(metrics.agentPerformance));
    });
    
    it('should provide governance metrics', function() {
      const governanceMetrics = coordination.getGovernanceMetrics(contextId);
      
      assert(governanceMetrics);
      assert(typeof governanceMetrics.averageTrustScore === 'number');
      assert(typeof governanceMetrics.complianceRate === 'number');
      assert(typeof governanceMetrics.policyViolations === 'number');
      assert(Array.isArray(governanceMetrics.auditLog));
    });
  });
  
  describe('Error Handling', function() {
    it('should handle invalid context IDs gracefully', async function() {
      const invalidContextId = 'invalid-context-id';
      
      try {
        await coordination.sendMessage({
          contextId: invalidContextId,
          fromAgentId: 'user',
          toAgentIds: ['agent1'],
          message: { content: 'test' }
        });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('Context not found'));
      }
    });
    
    it('should handle agent communication failures', async function() {
      const context = await coordination.createCoordinationContext({
        name: 'Error Test Context',
        agentIds: ['nonexistent_agent'],
        collaborationModel: 'shared_context',
        policies: {
          trustThreshold: 0.7,
          governanceEnabled: true
        }
      });
      
      const result = await coordination.sendMessage({
        contextId: context.id,
        fromAgentId: 'user',
        toAgentIds: ['nonexistent_agent'],
        message: { content: 'test' },
        requireResponse: false
      });
      
      assert(result);
      assert(result.deliveryResults);
      assert(result.deliveryResults.some(r => !r.delivered));
    });
  });
});

// Export for use in other test files
module.exports = {
  MultiAgentCoordination
};

