/**
 * Integration Tests for Agent Scorecard Observer Integration
 * 
 * Tests the integration between the Agent Scorecard system and
 * the PRISM and VIGIL observers.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const AgentScorecard = require('../../../../src/modules/agent_scorecard/index');
const PrismObserver = require('../../../../src/observers/prism/index');
const VigilObserver = require('../../../../src/observers/vigil/index');

describe('Agent Scorecard Observer Integration', function() {
  let agentScorecard;
  let prismObserver;
  let vigilObserver;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Create test instances
    prismObserver = new PrismObserver();
    vigilObserver = new VigilObserver();
    agentScorecard = new AgentScorecard({
      prismObserver,
      vigilObserver
    });
    
    // Stub observer methods
    sandbox.stub(prismObserver, 'getReflectionMetrics').resolves({
      reflection: {
        total_count: 100,
        compliant_count: 85,
        compliance_percentage: 85
      },
      beliefTrace: {
        total_outputs: 200,
        verified_outputs: 180,
        integrity_percentage: 90
      }
    });
    
    sandbox.stub(vigilObserver, 'getViolationMetrics').resolves({
      trustDecay: {
        decay_percentage: 5,
        decay_rate: 0.01
      },
      violations: [
        {
          timestamp: new Date().toISOString(),
          type: 'reflection_skip',
          description: 'Skipped reflection step',
          severity: 'minor'
        }
      ]
    });
    
    // Stub internal methods
    sandbox.stub(agentScorecard.scorecardManager, 'createScorecard').returns({
      agent_id: 'test-agent',
      scorecard_id: 'test-scorecard-123',
      trust_score: 0.85
    });
    
    sandbox.stub(agentScorecard.scorecardManager, 'storeScorecard').resolves(true);
    sandbox.stub(agentScorecard.cryptographicVerifier, 'signScorecard').callsFake(
      scorecard => Promise.resolve(scorecard)
    );
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('generateScorecard', function() {
    it('should generate scorecard using observer metrics', async function() {
      const agentId = 'test-agent';
      const governanceIdentity = {
        type: 'promethios',
        constitution_hash: '1234567890abcdef'
      };
      
      const scorecard = await agentScorecard.generateScorecard(agentId, governanceIdentity);
      
      expect(scorecard).to.be.an('object');
      expect(scorecard.agent_id).to.equal(agentId);
      
      // Verify that observer methods were called
      expect(prismObserver.getReflectionMetrics.calledWith(agentId)).to.be.true;
      expect(vigilObserver.getViolationMetrics.calledWith(agentId)).to.be.true;
      
      // Verify that scorecard manager methods were called with observer data
      expect(agentScorecard.scorecardManager.createScorecard.calledOnce).to.be.true;
      const createArgs = agentScorecard.scorecardManager.createScorecard.firstCall.args;
      expect(createArgs[0]).to.equal(agentId);
      expect(createArgs[1]).to.deep.equal(governanceIdentity);
      expect(createArgs[3]).to.have.property('reflection');
      expect(createArgs[4]).to.have.property('violations');
      
      // Verify that scorecard was stored
      expect(agentScorecard.scorecardManager.storeScorecard.calledOnce).to.be.true;
    });
    
    it('should handle observer errors gracefully', async function() {
      // Make observers throw errors
      prismObserver.getReflectionMetrics.rejects(new Error('PRISM error'));
      vigilObserver.getViolationMetrics.rejects(new Error('VIGIL error'));
      
      const agentId = 'test-agent';
      const governanceIdentity = {
        type: 'promethios',
        constitution_hash: '1234567890abcdef'
      };
      
      // Should still generate scorecard with default values
      const scorecard = await agentScorecard.generateScorecard(agentId, governanceIdentity);
      
      expect(scorecard).to.be.an('object');
      expect(scorecard.agent_id).to.equal(agentId);
      
      // Verify that scorecard manager was called with null metrics
      const createArgs = agentScorecard.scorecardManager.createScorecard.firstCall.args;
      expect(createArgs[3]).to.be.null;
      expect(createArgs[4]).to.be.null;
    });
  });
  
  describe('Observer Event Handling', function() {
    it('should generate scorecard on reflection completion event', async function() {
      // Stub generateScorecard
      sandbox.stub(agentScorecard, 'generateScorecard').resolves({
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123'
      });
      
      // Simulate reflection completion event
      const event = {
        type: 'reflection_complete',
        agent_id: 'test-agent',
        governance_identity: {
          type: 'promethios',
          constitution_hash: '1234567890abcdef'
        }
      };
      
      await agentScorecard.handleObserverEvent(event);
      
      // Verify that generateScorecard was called
      expect(agentScorecard.generateScorecard.calledOnce).to.be.true;
      expect(agentScorecard.generateScorecard.calledWith(
        'test-agent',
        event.governance_identity
      )).to.be.true;
    });
    
    it('should generate scorecard on violation detection event', async function() {
      // Stub generateScorecard
      sandbox.stub(agentScorecard, 'generateScorecard').resolves({
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123'
      });
      
      // Simulate violation detection event
      const event = {
        type: 'violation_detected',
        agent_id: 'test-agent',
        violation: {
          type: 'reflection_skip',
          severity: 'minor'
        },
        governance_identity: {
          type: 'promethios',
          constitution_hash: '1234567890abcdef'
        }
      };
      
      await agentScorecard.handleObserverEvent(event);
      
      // Verify that generateScorecard was called
      expect(agentScorecard.generateScorecard.calledOnce).to.be.true;
      expect(agentScorecard.generateScorecard.calledWith(
        'test-agent',
        event.governance_identity
      )).to.be.true;
    });
    
    it('should ignore unrelated events', async function() {
      // Stub generateScorecard
      sandbox.stub(agentScorecard, 'generateScorecard');
      
      // Simulate unrelated event
      const event = {
        type: 'unrelated_event',
        agent_id: 'test-agent'
      };
      
      await agentScorecard.handleObserverEvent(event);
      
      // Verify that generateScorecard was not called
      expect(agentScorecard.generateScorecard.called).to.be.false;
    });
  });
  
  describe('registerWithObservers', function() {
    it('should register event handlers with observers', function() {
      // Stub observer registration methods
      sandbox.stub(prismObserver, 'registerEventHandler');
      sandbox.stub(vigilObserver, 'registerEventHandler');
      
      agentScorecard.registerWithObservers();
      
      // Verify that event handlers were registered
      expect(prismObserver.registerEventHandler.calledOnce).to.be.true;
      expect(vigilObserver.registerEventHandler.calledOnce).to.be.true;
    });
  });
});
