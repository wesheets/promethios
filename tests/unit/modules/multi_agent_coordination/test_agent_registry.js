/**
 * Unit tests for the Agent Registry component
 * 
 * @module tests/unit/modules/multi_agent_coordination/test_agent_registry
 */

const { expect } = require('chai');
const sinon = require('sinon');
const AgentRegistry = require('../../../../src/modules/multi_agent_coordination/agent_registry');

describe('Agent Registry', () => {
  let agentRegistry;
  let mockLogger;
  let mockGovernanceIdentity;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create mock governance identity module
    mockGovernanceIdentity = {
      agentHasGovernanceIdentity: sinon.stub(),
      getAgentGovernanceIdentity: sinon.stub(),
      createMinimalGovernanceRecord: sinon.stub()
    };
    
    // Create agent registry instance
    agentRegistry = new AgentRegistry({
      logger: mockLogger,
      governanceIdentity: mockGovernanceIdentity
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('registerAgent', () => {
    it('should register agent with governance identity', () => {
      const agent = {
        id: 'agent1',
        name: 'Test Agent',
        capabilities: {
          reasoning: 0.9,
          planning: 0.8
        }
      };
      
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent1').returns(true);
      mockGovernanceIdentity.getAgentGovernanceIdentity.withArgs('agent1').returns({
        id: 'gov1',
        agentId: 'agent1',
        complianceLevel: 'full'
      });
      
      const result = agentRegistry.registerAgent('context1', agent);
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('agent1');
      expect(result.hasGovernanceIdentity).to.be.true;
      expect(result.governanceIdentity).to.be.an('object');
      expect(result.governanceIdentity.complianceLevel).to.equal('full');
      
      // Verify agent is registered
      expect(agentRegistry.isAgentRegistered('agent1')).to.be.true;
      expect(agentRegistry.getAgentsInContext('context1')).to.have.lengthOf(1);
    });
    
    it('should register agent without governance identity and create minimal record', () => {
      const agent = {
        id: 'agent2',
        name: 'Non-Governed Agent',
        capabilities: {
          language: 0.9
        }
      };
      
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent2').returns(false);
      mockGovernanceIdentity.createMinimalGovernanceRecord.withArgs('agent2').returns({
        id: 'min1',
        agentId: 'agent2',
        type: 'minimal',
        trustLevel: 'basic'
      });
      
      const result = agentRegistry.registerAgent('context1', agent);
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('agent2');
      expect(result.hasGovernanceIdentity).to.be.false;
      expect(result.minimalGovernanceRecord).to.be.an('object');
      expect(result.minimalGovernanceRecord.type).to.equal('minimal');
      
      // Verify agent is registered
      expect(agentRegistry.isAgentRegistered('agent2')).to.be.true;
    });
    
    it('should update agent if already registered', () => {
      // Register agent first
      const agent = {
        id: 'agent3',
        name: 'Test Agent',
        capabilities: {
          reasoning: 0.7
        }
      };
      
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent3').returns(false);
      
      agentRegistry.registerAgent('context1', agent);
      
      // Update agent
      const updatedAgent = {
        id: 'agent3',
        name: 'Updated Agent',
        capabilities: {
          reasoning: 0.8,
          planning: 0.7
        }
      };
      
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent3').returns(true);
      mockGovernanceIdentity.getAgentGovernanceIdentity.withArgs('agent3').returns({
        id: 'gov3',
        agentId: 'agent3',
        complianceLevel: 'partial'
      });
      
      const result = agentRegistry.registerAgent('context1', updatedAgent);
      
      expect(result).to.be.an('object');
      expect(result.name).to.equal('Updated Agent');
      expect(result.capabilities.reasoning).to.equal(0.8);
      expect(result.hasGovernanceIdentity).to.be.true;
      
      // Verify agent is updated
      const retrievedAgent = agentRegistry.getAgent('agent3');
      expect(retrievedAgent.name).to.equal('Updated Agent');
    });
  });
  
  describe('unregisterAgent', () => {
    beforeEach(() => {
      // Register agents for testing
      mockGovernanceIdentity.agentHasGovernanceIdentity.returns(false);
      
      agentRegistry.registerAgent('context1', { id: 'agent1', name: 'Agent 1' });
      agentRegistry.registerAgent('context1', { id: 'agent2', name: 'Agent 2' });
      agentRegistry.registerAgent('context2', { id: 'agent3', name: 'Agent 3' });
    });
    
    it('should unregister agent from all contexts', () => {
      const result = agentRegistry.unregisterAgent('agent1');
      
      expect(result).to.be.true;
      expect(agentRegistry.isAgentRegistered('agent1')).to.be.false;
      expect(agentRegistry.getAgentsInContext('context1')).to.have.lengthOf(1);
    });
    
    it('should unregister agent from specific context', () => {
      // Register agent in multiple contexts
      agentRegistry.registerAgent('context2', { id: 'agent1', name: 'Agent 1' });
      
      const result = agentRegistry.unregisterAgent('agent1', 'context1');
      
      expect(result).to.be.true;
      expect(agentRegistry.isAgentRegistered('agent1')).to.be.true; // Still in context2
      expect(agentRegistry.getAgentsInContext('context1')).to.have.lengthOf(1);
      expect(agentRegistry.getAgentsInContext('context2')).to.have.lengthOf(2);
    });
    
    it('should return false when agent is not registered', () => {
      const result = agentRegistry.unregisterAgent('non_existent_agent');
      
      expect(result).to.be.false;
    });
  });
  
  describe('hasGovernanceIdentity', () => {
    beforeEach(() => {
      // Register agents for testing
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent1').returns(true);
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent2').returns(false);
      
      agentRegistry.registerAgent('context1', { id: 'agent1', name: 'Governed Agent' });
      agentRegistry.registerAgent('context1', { id: 'agent2', name: 'Non-Governed Agent' });
    });
    
    it('should return true when agent has governance identity', () => {
      expect(agentRegistry.hasGovernanceIdentity('agent1')).to.be.true;
    });
    
    it('should return false when agent does not have governance identity', () => {
      expect(agentRegistry.hasGovernanceIdentity('agent2')).to.be.false;
    });
    
    it('should return false when agent is not registered', () => {
      expect(agentRegistry.hasGovernanceIdentity('non_existent_agent')).to.be.false;
    });
  });
  
  describe('getAgentsInContext', () => {
    beforeEach(() => {
      // Register agents for testing
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent1').returns(true);
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent2').returns(false);
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent3').returns(true);
      
      agentRegistry.registerAgent('context1', { id: 'agent1', name: 'Agent 1' });
      agentRegistry.registerAgent('context1', { id: 'agent2', name: 'Agent 2' });
      agentRegistry.registerAgent('context2', { id: 'agent3', name: 'Agent 3' });
    });
    
    it('should return all agents in a context', () => {
      const agents = agentRegistry.getAgentsInContext('context1');
      
      expect(agents).to.be.an('array');
      expect(agents).to.have.lengthOf(2);
      expect(agents[0].id).to.equal('agent1');
      expect(agents[1].id).to.equal('agent2');
    });
    
    it('should return only governed agents when filter is applied', () => {
      const agents = agentRegistry.getAgentsInContext('context1', { governanceOnly: true });
      
      expect(agents).to.be.an('array');
      expect(agents).to.have.lengthOf(1);
      expect(agents[0].id).to.equal('agent1');
    });
    
    it('should return only non-governed agents when filter is applied', () => {
      const agents = agentRegistry.getAgentsInContext('context1', { nonGovernanceOnly: true });
      
      expect(agents).to.be.an('array');
      expect(agents).to.have.lengthOf(1);
      expect(agents[0].id).to.equal('agent2');
    });
    
    it('should return empty array for non-existent context', () => {
      const agents = agentRegistry.getAgentsInContext('non_existent_context');
      
      expect(agents).to.be.an('array');
      expect(agents).to.be.empty;
    });
  });
  
  describe('getContextMetrics', () => {
    beforeEach(() => {
      // Register agents for testing
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent1').returns(true);
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent2').returns(false);
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent3').returns(true);
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent4').returns(false);
      
      agentRegistry.registerAgent('context1', { id: 'agent1', name: 'Agent 1' });
      agentRegistry.registerAgent('context1', { id: 'agent2', name: 'Agent 2' });
      agentRegistry.registerAgent('context1', { id: 'agent3', name: 'Agent 3' });
      agentRegistry.registerAgent('context2', { id: 'agent4', name: 'Agent 4' });
    });
    
    it('should return metrics for a context', () => {
      const metrics = agentRegistry.getContextMetrics('context1');
      
      expect(metrics).to.be.an('object');
      expect(metrics.totalAgents).to.equal(3);
      expect(metrics.governedAgents).to.equal(2);
      expect(metrics.nonGovernedAgents).to.equal(1);
      expect(metrics.governanceRatio).to.be.closeTo(0.67, 0.01);
    });
    
    it('should return default metrics for non-existent context', () => {
      const metrics = agentRegistry.getContextMetrics('non_existent_context');
      
      expect(metrics).to.be.an('object');
      expect(metrics.totalAgents).to.equal(0);
      expect(metrics.governedAgents).to.equal(0);
      expect(metrics.nonGovernedAgents).to.equal(0);
      expect(metrics.governanceRatio).to.equal(0);
    });
  });
});
