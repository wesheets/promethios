/**
 * Integration Tests for Confidence Scoring Observer Integration
 * 
 * Tests the integration between the Confidence Scoring module and
 * the PRISM and VIGIL observers.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const ConfidenceScoring = require('../../../../src/modules/confidence_scoring/index');
const PrismObserver = require('../../../../src/observers/prism/index');
const VigilObserver = require('../../../../src/observers/vigil/index');

describe('Confidence Scoring Observer Integration', function() {
  let confidenceScoring;
  let prismObserver;
  let vigilObserver;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Create test instances
    prismObserver = new PrismObserver();
    vigilObserver = new VigilObserver();
    confidenceScoring = new ConfidenceScoring({
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
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Observer Event Handling', function() {
    it('should generate confidence score on reflection completion event', async function() {
      // Stub calculateConfidence
      const calculateConfidenceStub = sandbox.stub(confidenceScoring, 'calculateConfidence').returns(0.85);
      
      // Stub storeConfidenceScore
      const storeConfidenceStub = sandbox.stub(confidenceScoring, 'storeConfidenceScore').resolves(true);
      
      // Simulate reflection completion event
      const event = {
        type: 'reflection_complete',
        agent_id: 'test-agent',
        governance_identity: {
          type: 'promethios',
          constitution_hash: '1234567890abcdef'
        }
      };
      
      await confidenceScoring.handleObserverEvent(event);
      
      // Verify that confidence methods were called
      expect(calculateConfidenceStub.calledOnce).to.be.true;
      expect(storeConfidenceStub.calledOnce).to.be.true;
      
      // Verify that observer methods were called
      expect(prismObserver.getReflectionMetrics.calledWith('test-agent')).to.be.true;
      expect(vigilObserver.getViolationMetrics.calledWith('test-agent')).to.be.true;
    });
    
    it('should generate confidence score on violation detection event', async function() {
      // Stub calculateConfidence
      const calculateConfidenceStub = sandbox.stub(confidenceScoring, 'calculateConfidence').returns(0.75);
      
      // Stub storeConfidenceScore
      const storeConfidenceStub = sandbox.stub(confidenceScoring, 'storeConfidenceScore').resolves(true);
      
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
      
      await confidenceScoring.handleObserverEvent(event);
      
      // Verify that confidence methods were called
      expect(calculateConfidenceStub.calledOnce).to.be.true;
      expect(storeConfidenceStub.calledOnce).to.be.true;
      
      // Verify that observer methods were called
      expect(prismObserver.getReflectionMetrics.calledWith('test-agent')).to.be.true;
      expect(vigilObserver.getViolationMetrics.calledWith('test-agent')).to.be.true;
    });
    
    it('should ignore unrelated events', async function() {
      // Stub calculateConfidence
      const calculateConfidenceStub = sandbox.stub(confidenceScoring, 'calculateConfidence');
      
      // Simulate unrelated event
      const event = {
        type: 'unrelated_event',
        agent_id: 'test-agent'
      };
      
      await confidenceScoring.handleObserverEvent(event);
      
      // Verify that confidence methods were not called
      expect(calculateConfidenceStub.called).to.be.false;
      expect(prismObserver.getReflectionMetrics.called).to.be.false;
      expect(vigilObserver.getViolationMetrics.called).to.be.false;
    });
  });
  
  describe('registerWithObservers', function() {
    it('should register event handlers with observers', function() {
      // Stub observer registration methods
      sandbox.stub(prismObserver, 'registerEventHandler');
      sandbox.stub(vigilObserver, 'registerEventHandler');
      
      confidenceScoring.registerWithObservers();
      
      // Verify that event handlers were registered
      expect(prismObserver.registerEventHandler.calledOnce).to.be.true;
      expect(vigilObserver.registerEventHandler.calledOnce).to.be.true;
    });
  });
  
  describe('calculateConfidence', function() {
    it('should calculate confidence score based on observer metrics', function() {
      const prismMetrics = {
        reflection: {
          compliance_percentage: 85
        },
        beliefTrace: {
          integrity_percentage: 90
        }
      };
      
      const vigilMetrics = {
        trustDecay: {
          decay_percentage: 5
        },
        violations: [
          { severity: 'minor' }
        ]
      };
      
      // Calculate confidence score
      const score = confidenceScoring.calculateConfidence(prismMetrics, vigilMetrics);
      
      // Verify score
      expect(score).to.be.a('number');
      expect(score).to.be.within(0, 1);
    });
    
    it('should handle missing metrics gracefully', function() {
      // Calculate with null metrics
      const score = confidenceScoring.calculateConfidence(null, null);
      
      // Verify default score
      expect(score).to.be.a('number');
      expect(score).to.equal(0.5); // Default score
    });
  });
});
