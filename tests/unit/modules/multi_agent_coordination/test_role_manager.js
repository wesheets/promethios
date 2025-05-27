/**
 * Unit tests for the Role Manager component
 * 
 * @module tests/unit/modules/multi_agent_coordination/test_role_manager
 */

const { expect } = require('chai');
const sinon = require('sinon');
const RoleManager = require('../../../../src/modules/multi_agent_coordination/role_manager');

describe('Role Manager', () => {
  let roleManager;
  let mockLogger;
  let mockAgentRegistry;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create mock agent registry
    mockAgentRegistry = {
      isAgentRegistered: sinon.stub(),
      hasGovernanceIdentity: sinon.stub()
    };
    
    // Create role manager instance
    roleManager = new RoleManager({
      logger: mockLogger,
      agentRegistry: mockAgentRegistry
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('defineRoles', () => {
    it('should define roles for a context', () => {
      const contextId = 'context1';
      const roleDefinitions = {
        'coordinator': {
          permissions: ['assign_tasks', 'view_all_results'],
          responsibilities: ['coordinate_agents', 'report_results'],
          governanceRequirements: { required: true }
        },
        'worker': {
          permissions: ['execute_tasks', 'report_progress'],
          responsibilities: ['complete_tasks'],
          maxAgents: 5
        }
      };
      
      const result = roleManager.defineRoles(contextId, roleDefinitions);
      
      expect(result).to.be.true;
      expect(mockLogger.info.calledTwice).to.be.true;
      
      // Verify roles were defined
      const coordinatorRole = roleManager.getRoleDefinition(contextId, 'coordinator');
      expect(coordinatorRole).to.be.an('object');
      expect(coordinatorRole.permissions).to.include('assign_tasks');
      expect(coordinatorRole.governanceRequirements.required).to.be.true;
      
      const workerRole = roleManager.getRoleDefinition(contextId, 'worker');
      expect(workerRole).to.be.an('object');
      expect(workerRole.maxAgents).to.equal(5);
    });
    
    it('should return all role definitions for a context', () => {
      const contextId = 'context1';
      const roleDefinitions = {
        'coordinator': {
          permissions: ['assign_tasks', 'view_all_results']
        },
        'worker': {
          permissions: ['execute_tasks', 'report_progress']
        }
      };
      
      roleManager.defineRoles(contextId, roleDefinitions);
      
      const allRoles = roleManager.getAllRoleDefinitions(contextId);
      
      expect(allRoles).to.be.an('object');
      expect(Object.keys(allRoles)).to.have.lengthOf(2);
      expect(allRoles.coordinator).to.be.an('object');
      expect(allRoles.worker).to.be.an('object');
    });
  });
  
  describe('assignRole', () => {
    beforeEach(() => {
      // Define roles for testing
      roleManager.defineRoles('context1', {
        'coordinator': {
          permissions: ['assign_tasks'],
          governanceRequirements: { required: true }
        },
        'worker': {
          permissions: ['execute_tasks'],
          maxAgents: 2
        },
        'observer': {
          permissions: ['view_results'],
          governanceRequirements: { forbidden: true }
        }
      });
      
      // Set up mock agent registry
      mockAgentRegistry.isAgentRegistered.returns(true);
    });
    
    it('should assign role to agent', () => {
      mockAgentRegistry.hasGovernanceIdentity.withArgs('agent1').returns(true);
      
      const result = roleManager.assignRole('context1', 'agent1', 'coordinator');
      
      expect(result).to.be.true;
      expect(roleManager.hasRole('context1', 'agent1', 'coordinator')).to.be.true;
    });
    
    it('should throw error when role requires governance but agent does not have it', () => {
      mockAgentRegistry.hasGovernanceIdentity.withArgs('agent1').returns(false);
      
      expect(() => {
        roleManager.assignRole('context1', 'agent1', 'coordinator');
      }).to.throw(/requires governance identity/);
    });
    
    it('should throw error when role forbids governance but agent has it', () => {
      mockAgentRegistry.hasGovernanceIdentity.withArgs('agent1').returns(true);
      
      expect(() => {
        roleManager.assignRole('context1', 'agent1', 'observer');
      }).to.throw(/forbids governance identity/);
    });
    
    it('should throw error when role has maximum number of agents', () => {
      mockAgentRegistry.hasGovernanceIdentity.returns(false);
      
      // Assign worker role to two agents
      roleManager.assignRole('context1', 'agent1', 'worker');
      roleManager.assignRole('context1', 'agent2', 'worker');
      
      // Try to assign to a third agent
      expect(() => {
        roleManager.assignRole('context1', 'agent3', 'worker');
      }).to.throw(/already has maximum number of agents/);
    });
  });
  
  describe('hasPermission', () => {
    beforeEach(() => {
      // Define roles for testing
      roleManager.defineRoles('context1', {
        'coordinator': {
          permissions: ['assign_tasks', 'view_all_results']
        },
        'worker': {
          permissions: ['execute_tasks', 'report_progress']
        }
      });
      
      // Set up mock agent registry
      mockAgentRegistry.isAgentRegistered.returns(true);
      mockAgentRegistry.hasGovernanceIdentity.returns(true);
      
      // Assign roles to agents
      roleManager.assignRole('context1', 'agent1', 'coordinator');
      roleManager.assignRole('context1', 'agent2', 'worker');
      roleManager.assignRole('context1', 'agent3', 'worker');
      
      // Assign multiple roles to one agent
      roleManager.assignRole('context1', 'agent4', 'coordinator');
      roleManager.assignRole('context1', 'agent4', 'worker');
    });
    
    it('should return true when agent has permission through role', () => {
      expect(roleManager.hasPermission('context1', 'agent1', 'assign_tasks')).to.be.true;
      expect(roleManager.hasPermission('context1', 'agent2', 'execute_tasks')).to.be.true;
    });
    
    it('should return false when agent does not have permission', () => {
      expect(roleManager.hasPermission('context1', 'agent1', 'execute_tasks')).to.be.false;
      expect(roleManager.hasPermission('context1', 'agent2', 'assign_tasks')).to.be.false;
    });
    
    it('should return true when agent has permission through multiple roles', () => {
      expect(roleManager.hasPermission('context1', 'agent4', 'assign_tasks')).to.be.true;
      expect(roleManager.hasPermission('context1', 'agent4', 'execute_tasks')).to.be.true;
    });
    
    it('should return all permissions for an agent', () => {
      const permissions = roleManager.getAgentPermissions('context1', 'agent4');
      
      expect(permissions).to.be.an('array');
      expect(permissions).to.include('assign_tasks');
      expect(permissions).to.include('view_all_results');
      expect(permissions).to.include('execute_tasks');
      expect(permissions).to.include('report_progress');
    });
  });
  
  describe('getAgentsWithRole', () => {
    beforeEach(() => {
      // Define roles for testing
      roleManager.defineRoles('context1', {
        'coordinator': {
          permissions: ['assign_tasks']
        },
        'worker': {
          permissions: ['execute_tasks']
        }
      });
      
      // Set up mock agent registry
      mockAgentRegistry.isAgentRegistered.returns(true);
      mockAgentRegistry.hasGovernanceIdentity.returns(true);
      
      // Assign roles to agents
      roleManager.assignRole('context1', 'agent1', 'coordinator');
      roleManager.assignRole('context1', 'agent2', 'worker');
      roleManager.assignRole('context1', 'agent3', 'worker');
    });
    
    it('should return agents with a specific role', () => {
      const workersResult = roleManager.getAgentsWithRole('context1', 'worker');
      
      expect(workersResult).to.be.an('array');
      expect(workersResult).to.have.lengthOf(2);
      expect(workersResult).to.include('agent2');
      expect(workersResult).to.include('agent3');
      
      const coordinatorsResult = roleManager.getAgentsWithRole('context1', 'coordinator');
      
      expect(coordinatorsResult).to.be.an('array');
      expect(coordinatorsResult).to.have.lengthOf(1);
      expect(coordinatorsResult).to.include('agent1');
    });
    
    it('should return empty array for non-existent role', () => {
      const result = roleManager.getAgentsWithRole('context1', 'non_existent_role');
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
  });
  
  describe('removeRole', () => {
    beforeEach(() => {
      // Define roles for testing
      roleManager.defineRoles('context1', {
        'coordinator': {
          permissions: ['assign_tasks'],
          minAgents: 1
        },
        'worker': {
          permissions: ['execute_tasks']
        }
      });
      
      // Set up mock agent registry
      mockAgentRegistry.isAgentRegistered.returns(true);
      mockAgentRegistry.hasGovernanceIdentity.returns(true);
      
      // Assign roles to agents
      roleManager.assignRole('context1', 'agent1', 'coordinator');
      roleManager.assignRole('context1', 'agent2', 'worker');
      roleManager.assignRole('context1', 'agent3', 'worker');
    });
    
    it('should remove role from agent', () => {
      const result = roleManager.removeRole('context1', 'agent2', 'worker');
      
      expect(result).to.be.true;
      expect(roleManager.hasRole('context1', 'agent2', 'worker')).to.be.false;
    });
    
    it('should return false when agent does not have role', () => {
      const result = roleManager.removeRole('context1', 'agent1', 'worker');
      
      expect(result).to.be.false;
    });
    
    it('should warn when removing role results in fewer than minimum required agents', () => {
      const result = roleManager.removeRole('context1', 'agent1', 'coordinator');
      
      expect(result).to.be.true;
      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockLogger.warn.firstCall.args[0]).to.include('fewer than minimum required agents');
    });
  });
});
