/**
 * Unit tests for the Task Allocator component
 * 
 * @module tests/unit/modules/multi_agent_coordination/test_task_allocator
 */

const { expect } = require('chai');
const sinon = require('sinon');
const TaskAllocator = require('../../../../src/modules/multi_agent_coordination/task_allocator');

describe('Task Allocator', () => {
  let taskAllocator;
  let mockLogger;
  let mockAgentRegistry;
  let mockRoleManager;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create mock agent registry
    mockAgentRegistry = {
      getAgentsInContext: sinon.stub(),
      isAgentRegistered: sinon.stub(),
      hasGovernanceIdentity: sinon.stub()
    };
    
    // Create mock role manager
    mockRoleManager = {
      getAgentsWithRole: sinon.stub(),
      getAgentRoles: sinon.stub()
    };
    
    // Create task allocator instance
    taskAllocator = new TaskAllocator({
      logger: mockLogger,
      agentRegistry: mockAgentRegistry,
      roleManager: mockRoleManager
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('allocateTask', () => {
    beforeEach(() => {
      // Set up mock agents
      const agents = [
        { id: 'agent1', hasGovernanceIdentity: true, capabilities: { math: 0.9, reasoning: 0.8 } },
        { id: 'agent2', hasGovernanceIdentity: false, capabilities: { language: 0.9, creativity: 0.7 } },
        { id: 'agent3', hasGovernanceIdentity: true, capabilities: { reasoning: 0.9, planning: 0.8 } }
      ];
      
      mockAgentRegistry.getAgentsInContext.returns(agents);
      mockAgentRegistry.isAgentRegistered.returns(true);
      
      // Set up mock roles
      mockRoleManager.getAgentsWithRole.withArgs('context1', 'coordinator').returns(['agent1']);
      mockRoleManager.getAgentsWithRole.withArgs('context1', 'worker').returns(['agent2', 'agent3']);
      
      mockRoleManager.getAgentRoles.withArgs('context1', 'agent1').returns(['coordinator']);
      mockRoleManager.getAgentRoles.withArgs('context1', 'agent2').returns(['worker']);
      mockRoleManager.getAgentRoles.withArgs('context1', 'agent3').returns(['worker']);
    });
    
    it('should allocate task using role-based strategy', () => {
      const task = {
        id: 'task1',
        requiredRoles: {
          'coordinator': [{ id: 'subtask1', description: 'Coordinate work' }],
          'worker': [{ id: 'subtask2', description: 'Execute work' }]
        }
      };
      
      const allocation = taskAllocator.allocateTask('context1', task);
      
      expect(allocation).to.be.an('object');
      expect(allocation.strategy).to.equal('role-based');
      expect(allocation.assignments).to.have.property('agent1');
      expect(allocation.assignments).to.have.property('agent2');
      expect(allocation.assignments).to.have.property('agent3');
      expect(allocation.assignments.agent1.role).to.equal('coordinator');
      expect(allocation.assignments.agent2.role).to.equal('worker');
      expect(allocation.assignments.agent3.role).to.equal('worker');
    });
    
    it('should allocate task using capability-based strategy', () => {
      const task = {
        id: 'task1',
        allocationStrategy: 'capability-based',
        requiredCapabilities: {
          'reasoning': [{ id: 'subtask1', description: 'Reasoning task' }],
          'language': [{ id: 'subtask2', description: 'Language task' }]
        }
      };
      
      const allocation = taskAllocator.allocateTask('context1', task);
      
      expect(allocation).to.be.an('object');
      expect(allocation.strategy).to.equal('capability-based');
      
      // Both agent1 and agent3 have reasoning capability
      expect(allocation.assignments).to.have.property('agent1');
      expect(allocation.assignments).to.have.property('agent3');
      expect(allocation.assignments.agent1.capability).to.equal('reasoning');
      expect(allocation.assignments.agent3.capability).to.equal('reasoning');
      
      // Only agent2 has language capability
      expect(allocation.assignments).to.have.property('agent2');
      expect(allocation.assignments.agent2.capability).to.equal('language');
    });
    
    it('should allocate task using governance-based strategy', () => {
      const task = {
        id: 'task1',
        allocationStrategy: 'governance-based',
        requiresGovernance: true
      };
      
      const allocation = taskAllocator.allocateTask('context1', task);
      
      expect(allocation).to.be.an('object');
      expect(allocation.strategy).to.equal('governance-based');
      
      // Only governed agents should be assigned
      expect(allocation.assignments).to.have.property('agent1');
      expect(allocation.assignments).to.have.property('agent3');
      expect(allocation.assignments).to.not.have.property('agent2');
      
      expect(allocation.assignments.agent1.governance).to.equal('full');
      expect(allocation.assignments.agent3.governance).to.equal('full');
    });
    
    it('should throw error when task requires governance but no governed agents available', () => {
      // Override mock to return only non-governed agents
      mockAgentRegistry.getAgentsInContext.returns([
        { id: 'agent2', hasGovernanceIdentity: false }
      ]);
      
      const task = {
        id: 'task1',
        allocationStrategy: 'governance-based',
        requiresGovernance: true
      };
      
      expect(() => {
        taskAllocator.allocateTask('context1', task);
      }).to.throw(/no governed agents available/);
    });
    
    it('should allocate task using balanced strategy', () => {
      const task = {
        id: 'task1',
        allocationStrategy: 'balanced',
        requiredCapabilities: {
          'reasoning': true
        },
        requiresGovernance: true
      };
      
      // Set up completion rates
      sinon.stub(taskAllocator, 'getAgentTaskCompletionRate')
        .withArgs('context1', 'agent1').returns(0.8)
        .withArgs('context1', 'agent2').returns(0.9)
        .withArgs('context1', 'agent3').returns(0.7);
      
      const allocation = taskAllocator.allocateTask('context1', task);
      
      expect(allocation).to.be.an('object');
      expect(allocation.strategy).to.equal('balanced');
      
      // Should select agents based on combined score of completion rate, 
      // capability match, and governance status
      expect(Object.keys(allocation.assignments)).to.have.lengthOf(2); // Default is half of agents
      
      // Agent1 should be selected (high completion rate, has governance, has reasoning)
      expect(allocation.assignments).to.have.property('agent1');
      
      // Agent3 should be selected (has governance, highest reasoning capability)
      expect(allocation.assignments).to.have.property('agent3');
    });
  });
  
  describe('recordTaskCompletion', () => {
    it('should record task completion and update metrics', () => {
      // First allocate a task
      mockAgentRegistry.getAgentsInContext.returns([
        { id: 'agent1', hasGovernanceIdentity: true },
        { id: 'agent2', hasGovernanceIdentity: false }
      ]);
      
      const task = { id: 'task1' };
      const allocation = taskAllocator.allocateTask('context1', task);
      
      // Now record completion
      const result = {
        success: true,
        agentResults: {
          'agent1': { success: true, completionTime: 500 },
          'agent2': { success: true, completionTime: 700 }
        }
      };
      
      const recorded = taskAllocator.recordTaskCompletion('context1', 'task1', result);
      
      expect(recorded).to.be.true;
      
      // Check that allocation was updated
      const updatedAllocation = taskAllocator.getTaskAllocation('context1', 'task1');
      expect(updatedAllocation.completed).to.be.true;
      expect(updatedAllocation.result).to.equal(result);
      
      // Check that metrics were updated
      const agent1Metrics = taskAllocator.getAgentTaskMetrics('context1', 'agent1');
      expect(agent1Metrics.totalTasks).to.equal(1);
      expect(agent1Metrics.successfulTasks).to.equal(1);
      expect(agent1Metrics.completionRate).to.equal(1);
      
      const agent2Metrics = taskAllocator.getAgentTaskMetrics('context1', 'agent2');
      expect(agent2Metrics.totalTasks).to.equal(1);
      expect(agent2Metrics.successfulTasks).to.equal(1);
      expect(agent2Metrics.averageCompletionTime).to.equal(700);
    });
    
    it('should return false when task allocation does not exist', () => {
      const result = taskAllocator.recordTaskCompletion('context1', 'non_existent_task', { success: true });
      
      expect(result).to.be.false;
    });
  });
  
  describe('getAgentTaskMetrics', () => {
    it('should return default metrics when agent has no task history', () => {
      const metrics = taskAllocator.getAgentTaskMetrics('context1', 'agent1');
      
      expect(metrics).to.be.an('object');
      expect(metrics.totalTasks).to.equal(0);
      expect(metrics.successfulTasks).to.equal(0);
      expect(metrics.failedTasks).to.equal(0);
      expect(metrics.completionRate).to.equal(0);
      expect(metrics.averageCompletionTime).to.equal(0);
    });
  });
});
