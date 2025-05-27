/**
 * Integration Tests for Confidence Scoring Benchmark Integration
 * 
 * Tests the integration between the Confidence Scoring module and
 * the CMU Benchmark system.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const ConfidenceScoring = require('../../../../src/modules/confidence_scoring/index');

// Mock the CMU Benchmark Integration instead of importing directly
// This avoids the JSX/React syntax error in Node.js environment
const mockCMUBenchmark = {
  registerMetricProvider: () => {},
  submitMetrics: () => Promise.resolve({ success: true })
};

describe('Confidence Scoring Benchmark Integration', function() {
  let confidenceScoring;
  let cmuBenchmark;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Create test instances
    cmuBenchmark = {
      registerMetricProvider: sandbox.stub(),
      submitMetrics: sandbox.stub().resolves({ success: true })
    };
    
    confidenceScoring = new ConfidenceScoring();
    
    // Stub confidence scoring methods
    sandbox.stub(confidenceScoring, 'getConfidenceScore').resolves({
      agent_id: 'test-agent',
      confidence_score: 0.85,
      evidence_factors: [
        { name: 'reflection', weight: 0.4, value: 0.85 },
        { name: 'belief_trace', weight: 0.6, value: 0.9 }
      ]
    });
    
    sandbox.stub(confidenceScoring, 'getConfidenceHistory').resolves([
      { timestamp: '2025-05-26T12:00:00Z', score: 0.85 },
      { timestamp: '2025-05-25T12:00:00Z', score: 0.83 }
    ]);
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('registerWithBenchmark', function() {
    it('should register metric providers with benchmark system', function() {
      confidenceScoring.registerWithBenchmark(cmuBenchmark);
      
      expect(cmuBenchmark.registerMetricProvider.calledTwice).to.be.true;
      
      // Verify first registration (confidence score)
      const firstCall = cmuBenchmark.registerMetricProvider.firstCall;
      expect(firstCall.args[0]).to.equal('agent_confidence_score');
      expect(firstCall.args[1]).to.be.a('function');
      
      // Verify second registration (evidence factors)
      const secondCall = cmuBenchmark.registerMetricProvider.secondCall;
      expect(secondCall.args[0]).to.equal('agent_evidence_factors');
      expect(secondCall.args[1]).to.be.a('function');
    });
  });
  
  describe('provideConfidenceScore', function() {
    it('should provide confidence score metrics to benchmark', async function() {
      // Get the confidence score provider function
      confidenceScoring.registerWithBenchmark(cmuBenchmark);
      const confidenceScoreProvider = cmuBenchmark.registerMetricProvider.firstCall.args[1];
      
      // Call the provider function
      const metrics = await confidenceScoreProvider('test-agent');
      
      // Verify metrics
      expect(metrics).to.be.an('object');
      expect(metrics.agent_id).to.equal('test-agent');
      expect(metrics.confidence_score).to.equal(0.85);
      expect(metrics.history).to.be.an('array');
      expect(metrics.history.length).to.equal(2);
      
      // Verify that confidence scoring methods were called
      expect(confidenceScoring.getConfidenceScore.calledWith('test-agent')).to.be.true;
      expect(confidenceScoring.getConfidenceHistory.calledWith('test-agent')).to.be.true;
    });
    
    it('should handle missing confidence data gracefully', async function() {
      // Make getConfidenceScore return null
      confidenceScoring.getConfidenceScore.resolves(null);
      
      // Get the confidence score provider function
      confidenceScoring.registerWithBenchmark(cmuBenchmark);
      const confidenceScoreProvider = cmuBenchmark.registerMetricProvider.firstCall.args[1];
      
      // Call the provider function
      const metrics = await confidenceScoreProvider('test-agent');
      
      // Verify metrics
      expect(metrics).to.be.an('object');
      expect(metrics.agent_id).to.equal('test-agent');
      expect(metrics.confidence_score).to.be.null;
      expect(metrics.history).to.be.an('array');
      expect(metrics.history.length).to.equal(0);
    });
  });
  
  describe('provideEvidenceFactors', function() {
    it('should provide evidence factor metrics to benchmark', async function() {
      // Get the evidence factors provider function
      confidenceScoring.registerWithBenchmark(cmuBenchmark);
      const evidenceProvider = cmuBenchmark.registerMetricProvider.secondCall.args[1];
      
      // Call the provider function
      const metrics = await evidenceProvider('test-agent');
      
      // Verify metrics
      expect(metrics).to.be.an('object');
      expect(metrics.agent_id).to.equal('test-agent');
      expect(metrics.evidence_factors).to.be.an('array');
      expect(metrics.evidence_factors.length).to.equal(2);
      expect(metrics.evidence_factors[0].name).to.equal('reflection');
      expect(metrics.evidence_factors[1].name).to.equal('belief_trace');
      
      // Verify that confidence scoring methods were called
      expect(confidenceScoring.getConfidenceScore.calledWith('test-agent')).to.be.true;
    });
  });
  
  describe('submitBenchmarkResults', function() {
    it('should submit results to benchmark system', async function() {
      const results = {
        agent_id: 'test-agent',
        metrics: {
          confidence_score: 0.85,
          evidence_factors: [
            { name: 'reflection', weight: 0.4, value: 0.85 },
            { name: 'belief_trace', weight: 0.6, value: 0.9 }
          ]
        }
      };
      
      await confidenceScoring.submitBenchmarkResults(cmuBenchmark, results);
      
      // Verify that benchmark submit was called
      expect(cmuBenchmark.submitMetrics.calledOnce).to.be.true;
      expect(cmuBenchmark.submitMetrics.calledWith(results)).to.be.true;
    });
    
    it('should handle submission errors gracefully', async function() {
      // Make submitMetrics throw an error
      cmuBenchmark.submitMetrics.rejects(new Error('Benchmark error'));
      
      const results = {
        agent_id: 'test-agent',
        metrics: {
          confidence_score: 0.85
        }
      };
      
      // Should not throw
      await confidenceScoring.submitBenchmarkResults(cmuBenchmark, results);
      
      // Verify that benchmark submit was called
      expect(cmuBenchmark.submitMetrics.calledOnce).to.be.true;
    });
  });
});
