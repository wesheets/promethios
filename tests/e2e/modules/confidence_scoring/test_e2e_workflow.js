/**
 * E2E Tests for Confidence Scoring Workflow
 * 
 * Tests the end-to-end workflow of the Confidence Scoring module
 * in a realistic environment.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const ConfidenceScoring = require('../../../../src/modules/confidence_scoring/index');
const PrismObserver = require('../../../../src/observers/prism/index');
const VigilObserver = require('../../../../src/observers/vigil/index');

describe('Confidence Scoring E2E Workflow', function() {
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
  
  describe('Full Workflow', function() {
    it('should execute the complete confidence scoring workflow', async function() {
      // Stub internal methods to track execution
      const calculateConfidenceStub = sandbox.stub(confidenceScoring, 'calculateConfidence').callThrough();
      const storeConfidenceStub = sandbox.stub(confidenceScoring, 'storeConfidenceScore').resolves(true);
      const notifyObserversStub = sandbox.stub(confidenceScoring, 'notifyObservers').resolves();
      
      // Execute the workflow
      const result = await confidenceScoring.executeWorkflow('test-agent', {
        input: 'Test input',
        context: { domain: 'test' }
      });
      
      // Verify workflow execution
      expect(result).to.be.an('object');
      expect(result.agent_id).to.equal('test-agent');
      expect(result.confidence_score).to.be.a('number');
      expect(result.confidence_score).to.be.within(0, 1);
      
      // Verify method calls
      expect(calculateConfidenceStub.calledOnce).to.be.true;
      expect(storeConfidenceStub.calledOnce).to.be.true;
      expect(notifyObserversStub.calledOnce).to.be.true;
      
      // Verify observer interactions
      expect(prismObserver.getReflectionMetrics.calledWith('test-agent')).to.be.true;
      expect(vigilObserver.getViolationMetrics.calledWith('test-agent')).to.be.true;
    });
    
    it('should handle errors in the workflow gracefully', async function() {
      // Make calculateConfidence throw an error
      sandbox.stub(confidenceScoring, 'calculateConfidence').throws(new Error('Calculation error'));
      
      // Execute the workflow
      const result = await confidenceScoring.executeWorkflow('test-agent', {
        input: 'Test input',
        context: { domain: 'test' }
      });
      
      // Verify error handling
      expect(result).to.be.an('object');
      expect(result.agent_id).to.equal('test-agent');
      expect(result.confidence_score).to.equal(0);
      expect(result.error).to.be.a('string');
      expect(result.error).to.include('Calculation error');
    });
  });
  
  describe('Integration with UI', function() {
    it('should provide data for visualization components', async function() {
      // Stub visualization data method
      const visualizationData = {
        agent_id: 'test-agent',
        confidence_history: [
          { timestamp: '2025-05-26T12:00:00Z', score: 0.85 },
          { timestamp: '2025-05-25T12:00:00Z', score: 0.83 }
        ],
        evidence_factors: [
          { name: 'reflection', weight: 0.4, value: 0.85 },
          { name: 'belief_trace', weight: 0.6, value: 0.9 }
        ]
      };
      
      sandbox.stub(confidenceScoring, 'getVisualizationData').resolves(visualizationData);
      
      // Get visualization data
      const data = await confidenceScoring.getVisualizationData('test-agent');
      
      // Verify data structure
      expect(data).to.deep.equal(visualizationData);
      expect(data.confidence_history).to.be.an('array');
      expect(data.evidence_factors).to.be.an('array');
    });
  });
  
  describe('Benchmark Integration', function() {
    it('should submit metrics to benchmark system', async function() {
      // Create mock benchmark system
      const benchmarkSystem = {
        submitMetrics: sandbox.stub().resolves({ success: true })
      };
      
      // Submit metrics
      await confidenceScoring.submitBenchmarkMetrics(benchmarkSystem, 'test-agent');
      
      // Verify submission
      expect(benchmarkSystem.submitMetrics.calledOnce).to.be.true;
      
      const submittedData = benchmarkSystem.submitMetrics.firstCall.args[0];
      expect(submittedData.agent_id).to.equal('test-agent');
      expect(submittedData.metrics).to.be.an('object');
      expect(submittedData.metrics.confidence_score).to.be.a('number');
    });
  });
});
