/**
 * Integration Tests for Agent Scorecard Benchmark Integration
 * 
 * Tests the integration between the Agent Scorecard system and
 * the CMU Benchmark system.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const AgentScorecard = require('../../../../src/modules/agent_scorecard/index');

// Mock the CMU Benchmark Integration instead of importing directly
// This avoids the JSX/React syntax error in Node.js environment
const mockCMUBenchmarkIntegration = {
  registerMetricProvider: () => {},
  submitMetrics: () => Promise.resolve({ success: true })
};

describe('Agent Scorecard Benchmark Integration', function() {
  let agentScorecard;
  let cmuBenchmark;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Create test instances
    cmuBenchmark = {
      registerMetricProvider: sandbox.stub(),
      submitMetrics: sandbox.stub().resolves({ success: true })
    };
    
    agentScorecard = new AgentScorecard();
    
    // Stub scorecard methods
    sandbox.stub(agentScorecard.scorecardManager, 'getLatestScorecard').resolves({
      agent_id: 'test-agent',
      scorecard_id: 'test-scorecard-123',
      trust_score: 0.85,
      reflection_compliance: {
        percentage: 85
      },
      belief_trace_integrity: {
        percentage: 90
      }
    });
    
    sandbox.stub(agentScorecard.scorecardAnalytics, 'generateTrustScoreTrend').resolves({
      agent_id: 'test-agent',
      trend_data: [
        { date: '2025-05-26', score: 0.85 },
        { date: '2025-05-25', score: 0.83 }
      ]
    });
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('registerWithBenchmark', function() {
    it('should register metric providers with benchmark system', function() {
      agentScorecard.registerWithBenchmark(cmuBenchmark);
      
      expect(cmuBenchmark.registerMetricProvider.calledTwice).to.be.true;
      
      // Verify first registration (trust score)
      const firstCall = cmuBenchmark.registerMetricProvider.firstCall;
      expect(firstCall.args[0]).to.equal('agent_trust_score');
      expect(firstCall.args[1]).to.be.a('function');
      
      // Verify second registration (compliance metrics)
      const secondCall = cmuBenchmark.registerMetricProvider.secondCall;
      expect(secondCall.args[0]).to.equal('agent_compliance_metrics');
      expect(secondCall.args[1]).to.be.a('function');
    });
  });
  
  describe('provideTrustScore', function() {
    it('should provide trust score metrics to benchmark', async function() {
      // Get the trust score provider function
      agentScorecard.registerWithBenchmark(cmuBenchmark);
      const trustScoreProvider = cmuBenchmark.registerMetricProvider.firstCall.args[1];
      
      // Call the provider function
      const metrics = await trustScoreProvider('test-agent');
      
      // Verify metrics
      expect(metrics).to.be.an('object');
      expect(metrics.agent_id).to.equal('test-agent');
      expect(metrics.trust_score).to.equal(0.85);
      expect(metrics.trend).to.be.an('array');
      expect(metrics.trend.length).to.equal(2);
      
      // Verify that scorecard methods were called
      expect(agentScorecard.scorecardManager.getLatestScorecard.calledWith('test-agent')).to.be.true;
      expect(agentScorecard.scorecardAnalytics.generateTrustScoreTrend.calledWith('test-agent')).to.be.true;
    });
    
    it('should handle missing scorecard gracefully', async function() {
      // Make getLatestScorecard return null
      agentScorecard.scorecardManager.getLatestScorecard.resolves(null);
      
      // Get the trust score provider function
      agentScorecard.registerWithBenchmark(cmuBenchmark);
      const trustScoreProvider = cmuBenchmark.registerMetricProvider.firstCall.args[1];
      
      // Call the provider function
      const metrics = await trustScoreProvider('test-agent');
      
      // Verify metrics
      expect(metrics).to.be.an('object');
      expect(metrics.agent_id).to.equal('test-agent');
      expect(metrics.trust_score).to.be.null;
      expect(metrics.trend).to.be.an('array');
      expect(metrics.trend.length).to.equal(0);
    });
  });
  
  describe('provideComplianceMetrics', function() {
    it('should provide compliance metrics to benchmark', async function() {
      // Get the compliance metrics provider function
      agentScorecard.registerWithBenchmark(cmuBenchmark);
      const complianceProvider = cmuBenchmark.registerMetricProvider.secondCall.args[1];
      
      // Call the provider function
      const metrics = await complianceProvider('test-agent');
      
      // Verify metrics
      expect(metrics).to.be.an('object');
      expect(metrics.agent_id).to.equal('test-agent');
      expect(metrics.reflection_compliance).to.equal(85);
      expect(metrics.belief_trace_integrity).to.equal(90);
      
      // Verify that scorecard methods were called
      expect(agentScorecard.scorecardManager.getLatestScorecard.calledWith('test-agent')).to.be.true;
    });
  });
  
  describe('submitBenchmarkResults', function() {
    it('should submit results to benchmark system', async function() {
      const results = {
        agent_id: 'test-agent',
        metrics: {
          trust_score: 0.85,
          reflection_compliance: 85,
          belief_trace_integrity: 90
        }
      };
      
      await agentScorecard.submitBenchmarkResults(cmuBenchmark, results);
      
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
          trust_score: 0.85
        }
      };
      
      // Should not throw
      await agentScorecard.submitBenchmarkResults(cmuBenchmark, results);
      
      // Verify that benchmark submit was called
      expect(cmuBenchmark.submitMetrics.calledOnce).to.be.true;
    });
  });
});
