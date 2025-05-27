/**
 * Integration tests for the Multi-Agent Coordination Framework with Governance Identity
 * 
 * @module tests/integration/modules/multi_agent_coordination/test_governance_integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const CoordinationManager = require('../../../../src/modules/multi_agent_coordination/coordination_manager');
const GovernanceIdentity = require('../../../../src/modules/governance_identity/index');
const PrismObserver = require('../../../../src/observers/prism/index');
const VigilObserver = require('../../../../src/observers/vigil/index');

describe('Multi-Agent Coordination with Governance Identity Integration', () => {
  let coordinationManager;
  let governanceIdentity;
  let prismObserver;
  let vigilObserver;
  let contextId;
  
  before(() => {
    // Create real instances of required modules
    governanceIdentity = new GovernanceIdentity();
    prismObserver = new PrismObserver();
    vigilObserver = new VigilObserver();
    
    // Create coordination manager with real dependencies
    coordinationManager = new CoordinationManager({
      governanceIdentity,
      prismObserver,
      vigilObserver
    });
    
    // Create a test coordination context
    const contextConfig = {
      name: 'Integration Test Context',
      description: 'Context for testing governance integration',
      roles: {
        'coordinator': {
          permissions: ['assign_tasks', 'view_results'],
          governanceRequirements: { required: true }
        },
        'worker': {
          permissions: ['execute_tasks', 'report_results']
        },
        'observer': {
          permissions: ['view_results'],
          governanceRequirements: { forbidden: true }
        }
      }
    };
    
    const context = coordinationManager.createCoordinationContext(contextConfig);
    contextId = context.id;
  });
  
  describe('Agent Registration with Governance Identity', () => {
    it('should register governed agent and assign governance-required role', () => {
      // Create a governed agent
      const governedAgent = {
        id: 'governed_agent_1',
        name: 'Governed Agent 1',
        capabilities: {
          reasoning: 0.9,
          planning: 0.8
        }
      };
      
      // Register the agent with governance identity
      sinon.stub(governanceIdentity, 'agentHasGovernanceIdentity')
        .withArgs('governed_agent_1').returns(true);
      
      sinon.stub(governanceIdentity, 'getAgentGovernanceIdentity')
        .withArgs('governed_agent_1').returns({
          id: 'gov_id_1',
          agentId: 'governed_agent_1',
          complianceLevel: 'full',
          constitutionHash: 'abc123',
          trustLevel: 'high'
        });
      
      // Register agent
      const result = coordinationManager.registerAgent(contextId, governedAgent);
      
      // Assign coordinator role (requires governance)
      coordinationManager.assignRole(contextId, 'governed_agent_1', 'coordinator');
      
      // Verify agent is registered with governance identity
      expect(result).to.be.an('object');
      expect(result.id).to.equal('governed_agent_1');
      expect(result.hasGovernanceIdentity).to.be.true;
      
      // Verify agent has coordinator role
      expect(coordinationManager.hasRole(contextId, 'governed_agent_1', 'coordinator')).to.be.true;
      
      // Restore stubs
      governanceIdentity.agentHasGovernanceIdentity.restore();
      governanceIdentity.getAgentGovernanceIdentity.restore();
    });
    
    it('should register non-governed agent but fail to assign governance-required role', () => {
      // Create a non-governed agent
      const nonGovernedAgent = {
        id: 'non_governed_agent_1',
        name: 'Non-Governed Agent 1',
        capabilities: {
          language: 0.9,
          creativity: 0.8
        }
      };
      
      // Register the agent without governance identity
      sinon.stub(governanceIdentity, 'agentHasGovernanceIdentity')
        .withArgs('non_governed_agent_1').returns(false);
      
      sinon.stub(governanceIdentity, 'createMinimalGovernanceRecord')
        .withArgs('non_governed_agent_1').returns({
          id: 'min_gov_1',
          agentId: 'non_governed_agent_1',
          type: 'minimal',
          trustLevel: 'basic'
        });
      
      // Register agent
      const result = coordinationManager.registerAgent(contextId, nonGovernedAgent);
      
      // Verify agent is registered without governance identity
      expect(result).to.be.an('object');
      expect(result.id).to.equal('non_governed_agent_1');
      expect(result.hasGovernanceIdentity).to.be.false;
      
      // Attempt to assign coordinator role (requires governance)
      expect(() => {
        coordinationManager.assignRole(contextId, 'non_governed_agent_1', 'coordinator');
      }).to.throw(/requires governance identity/);
      
      // Assign worker role (no governance requirement)
      coordinationManager.assignRole(contextId, 'non_governed_agent_1', 'worker');
      
      // Verify agent has worker role
      expect(coordinationManager.hasRole(contextId, 'non_governed_agent_1', 'worker')).to.be.true;
      
      // Restore stubs
      governanceIdentity.agentHasGovernanceIdentity.restore();
      governanceIdentity.createMinimalGovernanceRecord.restore();
    });
    
    it('should register governed agent but fail to assign governance-forbidden role', () => {
      // Create a governed agent
      const governedAgent = {
        id: 'governed_agent_2',
        name: 'Governed Agent 2',
        capabilities: {
          reasoning: 0.8
        }
      };
      
      // Register the agent with governance identity
      sinon.stub(governanceIdentity, 'agentHasGovernanceIdentity')
        .withArgs('governed_agent_2').returns(true);
      
      sinon.stub(governanceIdentity, 'getAgentGovernanceIdentity')
        .withArgs('governed_agent_2').returns({
          id: 'gov_id_2',
          agentId: 'governed_agent_2',
          complianceLevel: 'full'
        });
      
      // Register agent
      const result = coordinationManager.registerAgent(contextId, governedAgent);
      
      // Verify agent is registered with governance identity
      expect(result).to.be.an('object');
      expect(result.id).to.equal('governed_agent_2');
      expect(result.hasGovernanceIdentity).to.be.true;
      
      // Attempt to assign observer role (forbids governance)
      expect(() => {
        coordinationManager.assignRole(contextId, 'governed_agent_2', 'observer');
      }).to.throw(/forbids governance identity/);
      
      // Restore stubs
      governanceIdentity.agentHasGovernanceIdentity.restore();
      governanceIdentity.getAgentGovernanceIdentity.restore();
    });
  });
  
  describe('Task Allocation with Governance Requirements', () => {
    before(() => {
      // Register additional agents for task allocation testing
      
      // Governed agent
      sinon.stub(governanceIdentity, 'agentHasGovernanceIdentity')
        .withArgs('governed_agent_3').returns(true)
        .withArgs('non_governed_agent_2').returns(false);
      
      sinon.stub(governanceIdentity, 'getAgentGovernanceIdentity')
        .withArgs('governed_agent_3').returns({
          id: 'gov_id_3',
          agentId: 'governed_agent_3',
          complianceLevel: 'full'
        });
      
      sinon.stub(governanceIdentity, 'createMinimalGovernanceRecord')
        .withArgs('non_governed_agent_2').returns({
          id: 'min_gov_2',
          agentId: 'non_governed_agent_2',
          type: 'minimal'
        });
      
      // Register agents
      coordinationManager.registerAgent(contextId, {
        id: 'governed_agent_3',
        name: 'Governed Agent 3',
        capabilities: { reasoning: 0.9 }
      });
      
      coordinationManager.registerAgent(contextId, {
        id: 'non_governed_agent_2',
        name: 'Non-Governed Agent 2',
        capabilities: { language: 0.9 }
      });
      
      // Assign roles
      coordinationManager.assignRole(contextId, 'governed_agent_3', 'worker');
      coordinationManager.assignRole(contextId, 'non_governed_agent_2', 'worker');
    });
    
    after(() => {
      // Restore stubs
      governanceIdentity.agentHasGovernanceIdentity.restore();
      governanceIdentity.getAgentGovernanceIdentity.restore();
      governanceIdentity.createMinimalGovernanceRecord.restore();
    });
    
    it('should allocate governance-required task only to governed agents', () => {
      // Create a task that requires governance
      const task = {
        id: 'governance_required_task',
        description: 'Task that requires governance',
        requiresGovernance: true,
        allocationStrategy: 'governance-based'
      };
      
      // Submit task
      const allocation = coordinationManager.submitTask(contextId, 'governed_agent_1', task);
      
      // Verify allocation
      expect(allocation).to.be.an('object');
      expect(allocation.assignments).to.be.an('object');
      
      // Only governed agents should be assigned
      expect(allocation.assignments).to.have.property('governed_agent_1');
      expect(allocation.assignments).to.have.property('governed_agent_2');
      expect(allocation.assignments).to.have.property('governed_agent_3');
      expect(allocation.assignments).to.not.have.property('non_governed_agent_1');
      expect(allocation.assignments).to.not.have.property('non_governed_agent_2');
    });
    
    it('should allocate non-governance task to all agents', () => {
      // Create a task with no governance requirements
      const task = {
        id: 'non_governance_task',
        description: 'Task with no governance requirements',
        requiresGovernance: false,
        allocationStrategy: 'balanced'
      };
      
      // Submit task
      const allocation = coordinationManager.submitTask(contextId, 'governed_agent_1', task);
      
      // Verify allocation
      expect(allocation).to.be.an('object');
      expect(allocation.assignments).to.be.an('object');
      
      // Both governed and non-governed agents should be assigned
      expect(allocation.assignments).to.have.property('governed_agent_3');
      expect(allocation.assignments).to.have.property('non_governed_agent_2');
    });
  });
  
  describe('Trust Relationship Visualization', () => {
    it('should generate trust boundary visualization showing governance contrast', () => {
      // Get governance contrast visualization
      const visualization = coordinationManager.getGovernanceContrastVisualization(contextId);
      
      // Verify visualization structure
      expect(visualization).to.be.an('object');
      expect(visualization.agents).to.be.an('array');
      expect(visualization.boundaries).to.be.an('array');
      expect(visualization.connections).to.be.an('array');
      
      // Verify boundaries
      const governedBoundary = visualization.boundaries.find(b => b.type === 'governed');
      const nonGovernedBoundary = visualization.boundaries.find(b => b.type === 'non-governed');
      
      expect(governedBoundary).to.be.an('object');
      expect(nonGovernedBoundary).to.be.an('object');
      
      // Governed boundary should include all governed agents
      expect(governedBoundary.agents).to.include('governed_agent_1');
      expect(governedBoundary.agents).to.include('governed_agent_2');
      expect(governedBoundary.agents).to.include('governed_agent_3');
      
      // Non-governed boundary should include all non-governed agents
      expect(nonGovernedBoundary.agents).to.include('non_governed_agent_1');
      expect(nonGovernedBoundary.agents).to.include('non_governed_agent_2');
      
      // Verify connections
      const governedToGoverned = visualization.connections.find(c => 
        c.from.startsWith('governed_') && c.to.startsWith('governed_'));
      
      const governedToNonGoverned = visualization.connections.find(c => 
        c.from.startsWith('governed_') && c.to.startsWith('non_governed_'));
      
      expect(governedToGoverned).to.be.an('object');
      expect(governedToNonGoverned).to.be.an('object');
      
      // Trust levels should reflect governance status
      expect(governedToGoverned.trustLevel).to.equal('high');
      expect(governedToNonGoverned.trustLevel).to.be.oneOf(['medium', 'low']);
    });
  });
  
  describe('Observer Integration', () => {
    it('should trigger PRISM observer for governance verification', () => {
      // Spy on PRISM observer
      const prismSpy = sinon.spy(prismObserver, 'verifyGovernanceIdentity');
      
      // Create a task that requires governance
      const task = {
        id: 'prism_verification_task',
        description: 'Task that triggers PRISM verification',
        requiresGovernance: true
      };
      
      // Submit task
      coordinationManager.submitTask(contextId, 'governed_agent_1', task);
      
      // Verify PRISM observer was called
      expect(prismSpy.called).to.be.true;
      
      // Restore spy
      prismSpy.restore();
    });
    
    it('should trigger VIGIL observer for trust assessment', () => {
      // Spy on VIGIL observer
      const vigilSpy = sinon.spy(vigilObserver, 'assessTrust');
      
      // Create a mixed-agent task
      const task = {
        id: 'vigil_assessment_task',
        description: 'Task that triggers VIGIL assessment',
        requiresGovernance: false
      };
      
      // Submit task
      coordinationManager.submitTask(contextId, 'governed_agent_1', task);
      
      // Verify VIGIL observer was called
      expect(vigilSpy.called).to.be.true;
      
      // Restore spy
      vigilSpy.restore();
    });
  });
});
