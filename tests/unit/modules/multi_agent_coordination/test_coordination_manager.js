/**
 * Unit tests for the Coordination Manager component
 * 
 * @module tests/unit/modules/multi_agent_coordination/test_coordination_manager
 */

const { expect } = require('chai');
const sinon = require('sinon');
const CoordinationManager = require('../../../../src/modules/multi_agent_coordination/coordination_manager');

describe('Coordination Manager', () => {
  let coordinationManager;
  let mockLogger;
  let mockAgentRegistry;
  let mockRoleManager;
  let mockTaskAllocator;
  let mockMessageBus;
  let mockGovernanceExchangeProtocol;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create mock agent registry
    mockAgentRegistry = {
      registerAgent: sinon.stub(),
      unregisterAgent: sinon.stub(),
      getAgentsInContext: sinon.stub(),
      hasGovernanceIdentity: sinon.stub(),
      getContextMetrics: sinon.stub()
    };
    
    // Create mock role manager
    mockRoleManager = {
      defineRoles: sinon.stub(),
      assignRole: sinon.stub(),
      removeRole: sinon.stub(),
      hasPermission: sinon.stub(),
      getAgentsWithRole: sinon.stub()
    };
    
    // Create mock task allocator
    mockTaskAllocator = {
      allocateTask: sinon.stub(),
      recordTaskCompletion: sinon.stub(),
      getTaskAllocation: sinon.stub(),
      getAgentTaskMetrics: sinon.stub()
    };
    
    // Create mock message bus
    mockMessageBus = {
      publishMessage: sinon.stub(),
      subscribe: sinon.stub(),
      unsubscribe: sinon.stub(),
      getMessageHistory: sinon.stub(),
      getMessageMetrics: sinon.stub()
    };
    
    // Create mock governance exchange protocol
    mockGovernanceExchangeProtocol = {
      verifyGovernanceIdentity: sinon.stub(),
      establishTrustRelationship: sinon.stub(),
      getTrustBoundaryVisualization: sinon.stub()
    };
    
    // Create coordination manager instance
    coordinationManager = new CoordinationManager({
      logger: mockLogger,
      agentRegistry: mockAgentRegistry,
      roleManager: mockRoleManager,
      taskAllocator: mockTaskAllocator,
      messageBus: mockMessageBus,
      governanceExchangeProtocol: mockGovernanceExchangeProtocol
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('createCoordinationContext', () => {
    it('should create a new coordination context', () => {
      const contextConfig = {
        name: 'Test Context',
        description: 'A test coordination context',
        roles: {
          'coordinator': {
            permissions: ['assign_tasks']
          },
          'worker': {
            permissions: ['execute_tasks']
          }
        }
      };
      
      mockRoleManager.defineRoles.returns(true);
      
      const result = coordinationManager.createCoordinationContext(contextConfig);
      
      expect(result).to.be.an('object');
      expect(result.id).to.be.a('string');
      expect(result.name).to.equal('Test Context');
      expect(mockRoleManager.defineRoles.calledOnce).to.be.true;
    });
    
    it('should throw error when roles cannot be defined', () => {
      const contextConfig = {
        name: 'Test Context',
        roles: {
          'invalid_role': {}
        }
      };
      
      mockRoleManager.defineRoles.returns(false);
      
      expect(() => {
        coordinationManager.createCoordinationContext(contextConfig);
      }).to.throw(/Failed to define roles/);
    });
  });
  
  describe('registerAgent', () => {
    beforeEach(() => {
      // Create a context for testing
      mockRoleManager.defineRoles.returns(true);
      
      coordinationManager.createCoordinationContext({
        name: 'Test Context',
        roles: {
          'worker': {
            permissions: ['execute_tasks']
          }
        }
      });
    });
    
    it('should register agent in context', () => {
      const agent = {
        id: 'agent1',
        name: 'Test Agent',
        capabilities: {
          reasoning: 0.9
        }
      };
      
      mockAgentRegistry.registerAgent.returns({
        id: 'agent1',
        hasGovernanceIdentity: true
      });
      
      mockGovernanceExchangeProtocol.verifyGovernanceIdentity.returns({
        verified: true,
        hasGovernanceIdentity: true
      });
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      const result = coordinationManager.registerAgent(contextId, agent);
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('agent1');
      expect(result.contextId).to.equal(contextId);
      expect(mockAgentRegistry.registerAgent.calledOnce).to.be.true;
    });
    
    it('should register agent with role', () => {
      const agent = {
        id: 'agent1',
        name: 'Test Agent',
        role: 'worker'
      };
      
      mockAgentRegistry.registerAgent.returns({
        id: 'agent1',
        hasGovernanceIdentity: true
      });
      
      mockGovernanceExchangeProtocol.verifyGovernanceIdentity.returns({
        verified: true,
        hasGovernanceIdentity: true
      });
      
      mockRoleManager.assignRole.returns(true);
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      const result = coordinationManager.registerAgent(contextId, agent);
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('agent1');
      expect(mockRoleManager.assignRole.calledOnce).to.be.true;
      expect(mockRoleManager.assignRole.firstCall.args[2]).to.equal('worker');
    });
    
    it('should throw error when context does not exist', () => {
      const agent = {
        id: 'agent1',
        name: 'Test Agent'
      };
      
      expect(() => {
        coordinationManager.registerAgent('non_existent_context', agent);
      }).to.throw(/Context not found/);
    });
  });
  
  describe('submitTask', () => {
    beforeEach(() => {
      // Create a context for testing
      mockRoleManager.defineRoles.returns(true);
      
      coordinationManager.createCoordinationContext({
        name: 'Test Context',
        roles: {
          'coordinator': {
            permissions: ['assign_tasks']
          },
          'worker': {
            permissions: ['execute_tasks']
          }
        }
      });
      
      // Register agents
      mockAgentRegistry.registerAgent.returns({
        id: 'agent1',
        hasGovernanceIdentity: true
      });
      
      mockGovernanceExchangeProtocol.verifyGovernanceIdentity.returns({
        verified: true,
        hasGovernanceIdentity: true
      });
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      coordinationManager.registerAgent(contextId, { id: 'agent1', name: 'Agent 1', role: 'coordinator' });
      coordinationManager.registerAgent(contextId, { id: 'agent2', name: 'Agent 2', role: 'worker' });
    });
    
    it('should submit task and allocate to agents', () => {
      const task = {
        id: 'task1',
        description: 'Test task',
        requiredRoles: {
          'worker': [{ id: 'subtask1', description: 'Worker subtask' }]
        }
      };
      
      mockRoleManager.hasPermission.returns(true);
      
      mockTaskAllocator.allocateTask.returns({
        taskId: 'task1',
        strategy: 'role-based',
        assignments: {
          'agent2': {
            role: 'worker',
            subtasks: [{ id: 'subtask1' }]
          }
        }
      });
      
      mockMessageBus.publishMessage.returns(true);
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      const result = coordinationManager.submitTask(contextId, 'agent1', task);
      
      expect(result).to.be.an('object');
      expect(result.taskId).to.equal('task1');
      expect(result.assignments).to.have.property('agent2');
      expect(mockTaskAllocator.allocateTask.calledOnce).to.be.true;
      expect(mockMessageBus.publishMessage.calledOnce).to.be.true;
    });
    
    it('should throw error when agent does not have permission', () => {
      const task = {
        id: 'task1',
        description: 'Test task'
      };
      
      mockRoleManager.hasPermission.returns(false);
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      
      expect(() => {
        coordinationManager.submitTask(contextId, 'agent2', task);
      }).to.throw(/does not have permission/);
    });
  });
  
  describe('reportTaskCompletion', () => {
    beforeEach(() => {
      // Create a context for testing
      mockRoleManager.defineRoles.returns(true);
      
      coordinationManager.createCoordinationContext({
        name: 'Test Context',
        roles: {
          'worker': {
            permissions: ['execute_tasks', 'report_results']
          }
        }
      });
      
      // Register agent
      mockAgentRegistry.registerAgent.returns({
        id: 'agent1',
        hasGovernanceIdentity: true
      });
      
      mockGovernanceExchangeProtocol.verifyGovernanceIdentity.returns({
        verified: true,
        hasGovernanceIdentity: true
      });
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      coordinationManager.registerAgent(contextId, { id: 'agent1', name: 'Agent 1', role: 'worker' });
    });
    
    it('should report task completion', () => {
      const result = {
        success: true,
        output: 'Task completed successfully'
      };
      
      mockRoleManager.hasPermission.returns(true);
      mockTaskAllocator.getTaskAllocation.returns({
        taskId: 'task1',
        assignments: {
          'agent1': {
            role: 'worker',
            subtasks: [{ id: 'subtask1' }]
          }
        }
      });
      
      mockTaskAllocator.recordTaskCompletion.returns(true);
      mockMessageBus.publishMessage.returns(true);
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      const completionResult = coordinationManager.reportTaskCompletion(contextId, 'agent1', 'task1', result);
      
      expect(completionResult).to.be.true;
      expect(mockTaskAllocator.recordTaskCompletion.calledOnce).to.be.true;
      expect(mockMessageBus.publishMessage.calledOnce).to.be.true;
    });
    
    it('should throw error when agent does not have permission', () => {
      mockRoleManager.hasPermission.returns(false);
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      
      expect(() => {
        coordinationManager.reportTaskCompletion(contextId, 'agent1', 'task1', { success: true });
      }).to.throw(/does not have permission/);
    });
    
    it('should throw error when agent is not assigned to task', () => {
      mockRoleManager.hasPermission.returns(true);
      mockTaskAllocator.getTaskAllocation.returns({
        taskId: 'task1',
        assignments: {
          'agent2': {
            role: 'worker',
            subtasks: [{ id: 'subtask1' }]
          }
        }
      });
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      
      expect(() => {
        coordinationManager.reportTaskCompletion(contextId, 'agent1', 'task1', { success: true });
      }).to.throw(/not assigned to task/);
    });
  });
  
  describe('getCoordinationMetrics', () => {
    beforeEach(() => {
      // Create a context for testing
      mockRoleManager.defineRoles.returns(true);
      
      coordinationManager.createCoordinationContext({
        name: 'Test Context'
      });
      
      const contextId = Object.keys(coordinationManager.contexts)[0];
      
      // Set up mock metrics
      mockAgentRegistry.getContextMetrics.returns({
        totalAgents: 3,
        governedAgents: 2,
        nonGovernedAgents: 1,
        governanceRatio: 0.67
      });
      
      mockMessageBus.getMessageMetrics.returns({
        totalMessages: 10,
        topicCounts: {
          'task': 5,
          'result': 5
        }
      });
      
      mockGovernanceExchangeProtocol.getTrustBoundaryVisualization.returns({
        agents: [
          { id: 'agent1', hasGovernance: true },
          { id: 'agent2', hasGovernance: false },
          { id: 'agent3', hasGovernance: true }
        ],
        boundaries: [
          { type: 'governed', agents: ['agent1', 'agent3'] },
          { type: 'non-governed', agents: ['agent2'] }
        ],
        connections: [
          { from: 'agent1', to: 'agent2', trustLevel: 'medium' },
          { from: 'agent1', to: 'agent3', trustLevel: 'high' }
        ]
      });
    });
    
    it('should return comprehensive coordination metrics', () => {
      const contextId = Object.keys(coordinationManager.contexts)[0];
      const metrics = coordinationManager.getCoordinationMetrics(contextId);
      
      expect(metrics).to.be.an('object');
      expect(metrics.agents).to.be.an('object');
      expect(metrics.agents.totalAgents).to.equal(3);
      expect(metrics.agents.governanceRatio).to.equal(0.67);
      
      expect(metrics.messages).to.be.an('object');
      expect(metrics.messages.totalMessages).to.equal(10);
      
      expect(metrics.governance).to.be.an('object');
      expect(metrics.governance.trustBoundaries).to.be.an('object');
      expect(metrics.governance.trustBoundaries.boundaries).to.be.an('array');
      expect(metrics.governance.trustBoundaries.connections).to.be.an('array');
    });
    
    it('should throw error when context does not exist', () => {
      expect(() => {
        coordinationManager.getCoordinationMetrics('non_existent_context');
      }).to.throw(/Context not found/);
    });
  });
  
  describe('getGovernanceContrastVisualization', () => {
    beforeEach(() => {
      // Create a context for testing
      mockRoleManager.defineRoles.returns(true);
      
      coordinationManager.createCoordinationContext({
        name: 'Test Context'
      });
      
      // Set up mock visualization data
      mockGovernanceExchangeProtocol.getTrustBoundaryVisualization.returns({
        agents: [
          { id: 'agent1', hasGovernance: true },
          { id: 'agent2', hasGovernance: false },
          { id: 'agent3', hasGovernance: true }
        ],
        boundaries: [
          { type: 'governed', agents: ['agent1', 'agent3'] },
          { type: 'non-governed', agents: ['agent2'] }
        ],
        connections: [
          { from: 'agent1', to: 'agent2', trustLevel: 'medium' },
          { from: 'agent1', to: 'agent3', trustLevel: 'high' }
        ]
      });
      
      // Set up mock task metrics
      mockTaskAllocator.getAgentTaskMetrics.withArgs(sinon.match.any, 'agent1').returns({
        totalTasks: 10,
        successfulTasks: 9,
        completionRate: 0.9
      });
      
      mockTaskAllocator.getAgentTaskMetrics.withArgs(sinon.match.any, 'agent2').returns({
        totalTasks: 10,
        successfulTasks: 6,
        completionRate: 0.6
      });
      
      mockTaskAllocator.getAgentTaskMetrics.withArgs(sinon.match.any, 'agent3').returns({
        totalTasks: 10,
        successfulTasks: 8,
        completionRate: 0.8
      });
    });
    
    it('should return governance contrast visualization', () => {
      const contextId = Object.keys(coordinationManager.contexts)[0];
      const visualization = coordinationManager.getGovernanceContrastVisualization(contextId);
      
      expect(visualization).to.be.an('object');
      expect(visualization.agents).to.be.an('array');
      expect(visualization.boundaries).to.be.an('array');
      expect(visualization.connections).to.be.an('array');
      expect(visualization.performance).to.be.an('object');
      
      // Check performance metrics
      expect(visualization.performance.governed).to.be.an('object');
      expect(visualization.performance.nonGoverned).to.be.an('object');
      expect(visualization.performance.governed.averageCompletionRate).to.be.closeTo(0.85, 0.01);
      expect(visualization.performance.nonGoverned.averageCompletionRate).to.equal(0.6);
      
      // Check trust metrics
      expect(visualization.trustMetrics).to.be.an('object');
      expect(visualization.trustMetrics.governedToGoverned).to.equal('high');
      expect(visualization.trustMetrics.governedToNonGoverned).to.equal('medium');
    });
    
    it('should throw error when context does not exist', () => {
      expect(() => {
        coordinationManager.getGovernanceContrastVisualization('non_existent_context');
      }).to.throw(/Context not found/);
    });
  });
});
