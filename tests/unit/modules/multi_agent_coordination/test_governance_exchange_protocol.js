/**
 * Unit tests for the Governance Exchange Protocol component
 * 
 * @module tests/unit/modules/multi_agent_coordination/test_governance_exchange_protocol
 */

const { expect } = require('chai');
const sinon = require('sinon');
const GovernanceExchangeProtocol = require('../../../../src/modules/multi_agent_coordination/governance_exchange_protocol');

describe('Governance Exchange Protocol', () => {
  let governanceExchangeProtocol;
  let mockLogger;
  let mockGovernanceIdentity;
  let mockPrismObserver;
  let mockVigilObserver;
  
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
      getSystemConstitutionHash: sinon.stub()
    };
    
    // Create mock PRISM observer
    mockPrismObserver = {
      verifyGovernanceIdentity: sinon.stub()
    };
    
    // Create mock VIGIL observer
    mockVigilObserver = {
      verifyGovernanceIdentity: sinon.stub()
    };
    
    // Create governance exchange protocol instance
    governanceExchangeProtocol = new GovernanceExchangeProtocol({
      logger: mockLogger,
      governanceIdentity: mockGovernanceIdentity,
      prismObserver: mockPrismObserver,
      vigilObserver: mockVigilObserver
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('verifyGovernanceIdentity', () => {
    it('should return verification result with verified=false when no governance identity provided', () => {
      const result = governanceExchangeProtocol.verifyGovernanceIdentity('agent1', null);
      
      expect(result).to.be.an('object');
      expect(result.verified).to.be.false;
      expect(result.hasGovernanceIdentity).to.be.false;
      expect(result.details.error).to.equal('No governance identity provided');
    });
    
    it('should verify governance identity structure', () => {
      const governanceIdentity = {
        id: 'gov1',
        agentId: 'agent1',
        timestamp: new Date().toISOString()
      };
      
      mockPrismObserver.verifyGovernanceIdentity.returns({ verified: true });
      mockVigilObserver.verifyGovernanceIdentity.returns({ verified: true });
      
      const result = governanceExchangeProtocol.verifyGovernanceIdentity('agent1', governanceIdentity);
      
      expect(result).to.be.an('object');
      expect(result.verified).to.be.true;
      expect(result.hasGovernanceIdentity).to.be.true;
    });
    
    it('should fail verification when governance identity structure is invalid', () => {
      const governanceIdentity = {
        id: 'gov1',
        // Missing agentId
        timestamp: new Date().toISOString()
      };
      
      const result = governanceExchangeProtocol.verifyGovernanceIdentity('agent1', governanceIdentity);
      
      expect(result).to.be.an('object');
      expect(result.verified).to.be.false;
      expect(result.hasGovernanceIdentity).to.be.true;
      expect(result.details.error).to.include('Missing required field');
    });
    
    it('should verify with PRISM observer', () => {
      const governanceIdentity = {
        id: 'gov1',
        agentId: 'agent1',
        timestamp: new Date().toISOString()
      };
      
      mockPrismObserver.verifyGovernanceIdentity.returns({ verified: true });
      mockVigilObserver.verifyGovernanceIdentity.returns({ verified: true });
      
      const result = governanceExchangeProtocol.verifyGovernanceIdentity('agent1', governanceIdentity);
      
      expect(mockPrismObserver.verifyGovernanceIdentity.calledOnce).to.be.true;
      expect(result.verified).to.be.true;
      expect(result.details.prismVerification).to.deep.equal({ verified: true });
    });
    
    it('should fail verification when PRISM verification fails', () => {
      const governanceIdentity = {
        id: 'gov1',
        agentId: 'agent1',
        timestamp: new Date().toISOString()
      };
      
      mockPrismObserver.verifyGovernanceIdentity.returns({ verified: false, reason: 'Invalid belief trace' });
      mockVigilObserver.verifyGovernanceIdentity.returns({ verified: true });
      
      const result = governanceExchangeProtocol.verifyGovernanceIdentity('agent1', governanceIdentity);
      
      expect(result.verified).to.be.false;
      expect(result.details.error).to.include('PRISM verification failed');
    });
  });
  
  describe('establishTrustRelationship', () => {
    it('should establish high trust relationship between two governed agents', () => {
      const result = governanceExchangeProtocol.establishTrustRelationship(
        'context1', 'agent1', 'agent2', true, true
      );
      
      expect(result).to.be.an('object');
      expect(result.trustLevel).to.equal('high');
      expect(result.agent1HasGovernance).to.be.true;
      expect(result.agent2HasGovernance).to.be.true;
      expect(result.trustScore).to.be.closeTo(0.9, 0.01);
    });
    
    it('should establish medium trust relationship between governed and non-governed agents', () => {
      const result = governanceExchangeProtocol.establishTrustRelationship(
        'context1', 'agent1', 'agent2', true, false
      );
      
      expect(result).to.be.an('object');
      expect(result.trustLevel).to.equal('medium');
      expect(result.agent1HasGovernance).to.be.true;
      expect(result.agent2HasGovernance).to.be.false;
      expect(result.trustScore).to.be.closeTo(0.6, 0.01);
    });
    
    it('should establish low trust relationship between two non-governed agents', () => {
      const result = governanceExchangeProtocol.establishTrustRelationship(
        'context1', 'agent1', 'agent2', false, false
      );
      
      expect(result).to.be.an('object');
      expect(result.trustLevel).to.equal('low');
      expect(result.agent1HasGovernance).to.be.false;
      expect(result.agent2HasGovernance).to.be.false;
      expect(result.trustScore).to.be.closeTo(0.3, 0.01);
    });
    
    it('should update governance metrics when establishing trust relationship', () => {
      governanceExchangeProtocol.establishTrustRelationship(
        'context1', 'agent1', 'agent2', true, true
      );
      
      const metrics = governanceExchangeProtocol.getGovernanceMetrics('context1');
      
      expect(metrics.totalRelationships).to.equal(1);
      expect(metrics.governedRelationships).to.equal(1);
      expect(metrics.mixedRelationships).to.equal(0);
      expect(metrics.nonGovernedRelationships).to.equal(0);
    });
  });
  
  describe('verifyAgentTaskCompliance', () => {
    it('should verify compliance when agent has governance and task requires it', () => {
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent1').returns(true);
      
      const task = {
        id: 'task1',
        requiresGovernance: true
      };
      
      const result = governanceExchangeProtocol.verifyAgentTaskCompliance('context1', 'agent1', task);
      
      expect(result).to.be.an('object');
      expect(result.compliant).to.be.true;
    });
    
    it('should fail compliance when agent does not have governance but task requires it', () => {
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent1').returns(false);
      
      const task = {
        id: 'task1',
        requiresGovernance: true
      };
      
      const result = governanceExchangeProtocol.verifyAgentTaskCompliance('context1', 'agent1', task);
      
      expect(result).to.be.an('object');
      expect(result.compliant).to.be.false;
      expect(result.reason).to.include('requires governance identity');
    });
    
    it('should fail compliance when agent has governance but task forbids it', () => {
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent1').returns(true);
      
      const task = {
        id: 'task1',
        forbidsGovernance: true
      };
      
      const result = governanceExchangeProtocol.verifyAgentTaskCompliance('context1', 'agent1', task);
      
      expect(result).to.be.an('object');
      expect(result.compliant).to.be.false;
      expect(result.reason).to.include('forbids governance identity');
    });
  });
  
  describe('getTrustBoundaryVisualization', () => {
    it('should return empty visualization when no trust relationships exist', () => {
      const result = governanceExchangeProtocol.getTrustBoundaryVisualization('context1');
      
      expect(result).to.be.an('object');
      expect(result.boundaries).to.be.an('array').that.is.empty;
      expect(result.connections).to.be.an('array').that.is.empty;
    });
    
    it('should return visualization with governed and non-governed boundaries', () => {
      // Set up mock governance identity checks
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent1').returns(true);
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent2').returns(false);
      mockGovernanceIdentity.agentHasGovernanceIdentity.withArgs('agent3').returns(true);
      
      // Establish trust relationships
      governanceExchangeProtocol.establishTrustRelationship('context1', 'agent1', 'agent2', true, false);
      governanceExchangeProtocol.establishTrustRelationship('context1', 'agent1', 'agent3', true, true);
      
      const result = governanceExchangeProtocol.getTrustBoundaryVisualization('context1');
      
      expect(result).to.be.an('object');
      expect(result.agents).to.be.an('array').with.lengthOf(3);
      expect(result.connections).to.be.an('array').with.lengthOf(2);
      expect(result.boundaries).to.be.an('array').with.lengthOf(2);
      
      // Check boundaries
      const governedBoundary = result.boundaries.find(b => b.type === 'governed');
      const nonGovernedBoundary = result.boundaries.find(b => b.type === 'non-governed');
      
      expect(governedBoundary.agents).to.include('agent1');
      expect(governedBoundary.agents).to.include('agent3');
      expect(nonGovernedBoundary.agents).to.include('agent2');
    });
  });
});
