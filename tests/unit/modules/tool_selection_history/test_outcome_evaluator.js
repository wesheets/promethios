/**
 * Unit tests for the Outcome Evaluator component
 * 
 * @module tests/unit/modules/tool_selection_history/test_outcome_evaluator
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const { OutcomeEvaluator } = require('../../../../src/modules/tool_selection_history/outcome_evaluator');

describe('OutcomeEvaluator', () => {
  let outcomeEvaluator;
  let mockLogger;
  let fsExistsSyncStub;
  let fsMkdirSyncStub;
  let fsWriteFileSyncStub;
  let fsReadFileSyncStub;
  let fsReaddirSyncStub;
  let fsStatSyncStub;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      debug: sinon.spy()
    };
    
    // Stub fs methods
    fsExistsSyncStub = sinon.stub(fs, 'existsSync');
    fsExistsSyncStub.returns(true);
    fsMkdirSyncStub = sinon.stub(fs, 'mkdirSync').returns(true);
    fsWriteFileSyncStub = sinon.stub(fs, 'writeFileSync').returns(true);
    fsReadFileSyncStub = sinon.stub(fs, 'readFileSync').returns('{"evaluations":[],"failurePatterns":{}}');
    fsReaddirSyncStub = sinon.stub(fs, 'readdirSync').returns([]);
    fsStatSyncStub = sinon.stub(fs, 'statSync').returns({ mtimeMs: Date.now() });
    
    // Create OutcomeEvaluator instance
    outcomeEvaluator = new OutcomeEvaluator({
      logger: mockLogger,
      config: {
        dataPath: 'test/data/path',
        successThreshold: 0.6,
        failureThreshold: 0.4,
        minSampleSize: 5
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default config if not provided', () => {
      const evaluator = new OutcomeEvaluator({ logger: mockLogger });
      expect(evaluator.config).to.be.an('object');
      expect(evaluator.config.successThreshold).to.be.a('number');
      expect(evaluator.config.failureThreshold).to.be.a('number');
      expect(evaluator.config.minSampleSize).to.be.a('number');
    });
    
    it('should create data directory if it does not exist', () => {
      fsExistsSyncStub.returns(false);
      
      const evaluator = new OutcomeEvaluator({
        logger: mockLogger,
        config: { dataPath: 'test/data/path' }
      });
      
      expect(fsExistsSyncStub.calledOnce).to.be.true;
      expect(fsMkdirSyncStub.calledOnce).to.be.true;
      expect(fsMkdirSyncStub.calledWith('test/data/path', { recursive: true })).to.be.true;
    });
    
    it('should handle errors when creating data directory', () => {
      fsExistsSyncStub.returns(false);
      fsMkdirSyncStub.throws(new Error('Directory creation failed'));
      
      const evaluator = new OutcomeEvaluator({
        logger: mockLogger,
        config: { dataPath: 'test/data/path' }
      });
      
      expect(mockLogger.error.calledOnce).to.be.true;
    });
  });
  
  describe('evaluateOutcome', () => {
    it('should evaluate a successful outcome', () => {
      const invocationId = 'inv-123';
      const invocationRecord = {
        id: invocationId,
        toolId: 'tool-1',
        toolType: 'search',
        outcome: { status: 'success' },
        executionTime: 1000,
        feedback: { rating: 0.8 }
      };
      
      const result = outcomeEvaluator.evaluateOutcome(invocationId, invocationRecord);
      
      expect(result).to.be.an('object');
      expect(result.id).to.be.a('string');
      expect(result.invocationId).to.equal(invocationId);
      expect(result.toolId).to.equal('tool-1');
      expect(result.toolType).to.equal('search');
      expect(result.success).to.be.true;
      expect(result.efficiency).to.be.a('number');
      expect(result.qualityScore).to.be.a('number');
      expect(result.contextRelevance).to.be.a('number');
      
      // Verify it's stored in the map
      expect(outcomeEvaluator.evaluations.has(result.id)).to.be.true;
      expect(outcomeEvaluator.evaluations.get(result.id)).to.equal(result);
      
      expect(mockLogger.debug.calledOnce).to.be.true;
    });
    
    it('should evaluate a failed outcome', () => {
      const invocationId = 'inv-123';
      const invocationRecord = {
        id: invocationId,
        toolId: 'tool-1',
        toolType: 'search',
        outcome: { 
          status: 'failure',
          errorCode: 'PERMISSION_DENIED',
          errorMessage: 'Access denied'
        },
        executionTime: 1000
      };
      
      const result = outcomeEvaluator.evaluateOutcome(invocationId, invocationRecord);
      
      expect(result).to.be.an('object');
      expect(result.success).to.be.false;
      expect(result.failureAnalysis).to.be.an('object');
      expect(result.failureAnalysis.errorCategory).to.equal('permission');
      expect(result.failureAnalysis.severity).to.equal('high');
      expect(result.failureAnalysis.remediation).to.be.a('string');
      
      // Verify failure patterns are updated
      expect(outcomeEvaluator.failurePatterns.has('tool-1')).to.be.true;
      const patterns = outcomeEvaluator.failurePatterns.get('tool-1');
      expect(patterns.length).to.be.at.least(1);
      expect(patterns[0].errorCategory).to.equal('permission');
      expect(patterns[0].frequency).to.equal(1);
      
      expect(mockLogger.debug.calledOnce).to.be.true;
    });
    
    it('should return null if outcome is not available', () => {
      const invocationId = 'inv-123';
      const invocationRecord = {
        id: invocationId,
        toolId: 'tool-1',
        toolType: 'search'
      };
      
      const result = outcomeEvaluator.evaluateOutcome(invocationId, invocationRecord);
      
      expect(result).to.be.null;
      expect(mockLogger.debug.calledOnce).to.be.true;
    });
    
    it('should return null if invocation record is not provided', () => {
      const result = outcomeEvaluator.evaluateOutcome('inv-123');
      
      expect(result).to.be.null;
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('calculateSuccessRate', () => {
    beforeEach(() => {
      // Create some evaluations for testing
      outcomeEvaluator.evaluations.set('eval-1', {
        toolId: 'tool-1',
        success: true,
        context: { taskType: 'search' }
      });
      
      outcomeEvaluator.evaluations.set('eval-2', {
        toolId: 'tool-1',
        success: false,
        context: { taskType: 'search' }
      });
      
      outcomeEvaluator.evaluations.set('eval-3', {
        toolId: 'tool-1',
        success: true,
        context: { taskType: 'analysis' }
      });
      
      outcomeEvaluator.evaluations.set('eval-4', {
        toolId: 'tool-2',
        success: true,
        context: { taskType: 'search' }
      });
    });
    
    it('should calculate success rate for a tool with no context filter', () => {
      const successRate = outcomeEvaluator.calculateSuccessRate('tool-1');
      
      expect(successRate).to.equal(2/3); // 2 successes out of 3 invocations
    });
    
    it('should calculate success rate with context filter', () => {
      const successRate = outcomeEvaluator.calculateSuccessRate('tool-1', { taskType: 'search' });
      
      expect(successRate).to.equal(0.5); // 1 success out of 2 invocations with taskType=search
    });
    
    it('should return null if no evaluations found for tool', () => {
      const successRate = outcomeEvaluator.calculateSuccessRate('non-existent-tool');
      
      expect(successRate).to.be.null;
    });
  });
  
  describe('identifyFailurePatterns', () => {
    beforeEach(() => {
      // Create some failure patterns for testing
      outcomeEvaluator.failurePatterns.set('tool-1', [
        {
          toolId: 'tool-1',
          errorCategory: 'permission',
          frequency: 3,
          examples: [{ invocationId: 'inv-1' }],
          lastOccurrence: Date.now()
        },
        {
          toolId: 'tool-1',
          errorCategory: 'timeout',
          frequency: 1,
          examples: [{ invocationId: 'inv-2' }],
          lastOccurrence: Date.now()
        }
      ]);
    });
    
    it('should identify failure patterns for a tool', () => {
      const patterns = outcomeEvaluator.identifyFailurePatterns('tool-1');
      
      expect(patterns).to.be.an('array');
      expect(patterns.length).to.equal(2);
      
      // Should be sorted by frequency (most frequent first)
      expect(patterns[0].errorCategory).to.equal('permission');
      expect(patterns[0].frequency).to.equal(3);
      expect(patterns[1].errorCategory).to.equal('timeout');
      expect(patterns[1].frequency).to.equal(1);
    });
    
    it('should return empty array if no patterns found for tool', () => {
      const patterns = outcomeEvaluator.identifyFailurePatterns('non-existent-tool');
      
      expect(patterns).to.be.an('array');
      expect(patterns.length).to.equal(0);
    });
  });
  
  describe('compareOutcomes', () => {
    beforeEach(() => {
      // Create some evaluations for testing
      for (let i = 1; i <= 5; i++) {
        outcomeEvaluator.evaluations.set(`eval-tool1-${i}`, {
          toolId: 'tool-1',
          success: i <= 4, // 4/5 success rate
          efficiency: 0.7
        });
      }
      
      for (let i = 1; i <= 5; i++) {
        outcomeEvaluator.evaluations.set(`eval-tool2-${i}`, {
          toolId: 'tool-2',
          success: i <= 3, // 3/5 success rate
          efficiency: 0.8
        });
      }
    });
    
    it('should compare outcomes between two tools', () => {
      const comparison = outcomeEvaluator.compareOutcomes('tool-1', 'tool-2');
      
      expect(comparison).to.be.an('object');
      expect(comparison.toolId1).to.equal('tool-1');
      expect(comparison.toolId2).to.equal('tool-2');
      expect(comparison.successRate1).to.equal(0.8); // 4/5
      expect(comparison.successRate2).to.equal(0.6); // 3/5
      expect(comparison.successRateDifference).to.equal(0.2);
      expect(comparison.avgEfficiency1).to.equal(0.7);
      expect(comparison.avgEfficiency2).to.equal(0.8);
      expect(comparison.efficiencyDifference).to.equal(-0.1);
      expect(comparison.sampleSize1).to.equal(5);
      expect(comparison.sampleSize2).to.equal(5);
    });
    
    it('should handle context filter', () => {
      // Add context to evaluations
      outcomeEvaluator.evaluations.forEach((eval, id) => {
        if (id.startsWith('eval-tool1')) {
          eval.context = { taskType: id.includes('1') ? 'search' : 'analysis' };
        } else if (id.startsWith('eval-tool2')) {
          eval.context = { taskType: id.includes('1') ? 'search' : 'analysis' };
        }
      });
      
      const comparison = outcomeEvaluator.compareOutcomes('tool-1', 'tool-2', { taskType: 'search' });
      
      expect(comparison).to.be.an('object');
      expect(comparison.contextFilter).to.deep.equal({ taskType: 'search' });
    });
  });
  
  describe('getToolReliabilityMetrics', () => {
    beforeEach(() => {
      // Create some evaluations for testing
      for (let i = 1; i <= 5; i++) {
        outcomeEvaluator.evaluations.set(`eval-tool1-${i}`, {
          toolId: 'tool-1',
          success: i <= 4, // 4/5 success rate
          efficiency: 0.7,
          qualityScore: 0.8
        });
      }
      
      // Add some failure patterns
      outcomeEvaluator.failurePatterns.set('tool-1', [
        {
          toolId: 'tool-1',
          errorCategory: 'permission',
          frequency: 3,
          examples: [{ invocationId: 'inv-1' }],
          lastOccurrence: Date.now()
        }
      ]);
    });
    
    it('should get reliability metrics for a tool', () => {
      const metrics = outcomeEvaluator.getToolReliabilityMetrics('tool-1');
      
      expect(metrics).to.be.an('object');
      expect(metrics.toolId).to.equal('tool-1');
      expect(metrics.sampleSize).to.equal(5);
      expect(metrics.successRate).to.equal(0.8); // 4/5
      expect(metrics.avgEfficiency).to.equal(0.7);
      expect(metrics.avgQualityScore).to.equal(0.8);
      expect(metrics.reliabilityScore).to.be.a('number');
      expect(metrics.failurePatterns).to.be.an('array');
      expect(metrics.failurePatterns.length).to.equal(1);
      expect(metrics.failurePatterns[0].errorCategory).to.equal('permission');
    });
    
    it('should return default metrics if no evaluations found for tool', () => {
      const metrics = outcomeEvaluator.getToolReliabilityMetrics('non-existent-tool');
      
      expect(metrics).to.be.an('object');
      expect(metrics.toolId).to.equal('non-existent-tool');
      expect(metrics.sampleSize).to.equal(0);
      expect(metrics.reliabilityScore).to.be.null;
      expect(metrics.successRate).to.be.null;
      expect(metrics.failurePatterns).to.be.an('array');
      expect(metrics.failurePatterns.length).to.equal(0);
    });
  });
  
  describe('exportEvaluationData', () => {
    beforeEach(() => {
      // Create some evaluations for testing
      outcomeEvaluator.evaluations.set('eval-1', {
        id: 'eval-1',
        invocationId: 'inv-1',
        toolId: 'tool-1',
        toolType: 'search',
        timestamp: Date.now(),
        success: true,
        efficiency: 0.7,
        qualityScore: 0.8
      });
      
      outcomeEvaluator.evaluations.set('eval-2', {
        id: 'eval-2',
        invocationId: 'inv-2',
        toolId: 'tool-2',
        toolType: 'analysis',
        timestamp: Date.now(),
        success: false,
        efficiency: 0.5,
        qualityScore: 0.6
      });
    });
    
    it('should export evaluation data as JSON', () => {
      const data = outcomeEvaluator.exportEvaluationData('json');
      
      expect(data).to.be.a('string');
      expect(data).to.include('eval-1');
      expect(data).to.include('eval-2');
      
      // Should be valid JSON
      const parsed = JSON.parse(data);
      expect(parsed).to.be.an('array');
      expect(parsed.length).to.equal(2);
    });
    
    it('should export evaluation data as CSV', () => {
      const data = outcomeEvaluator.exportEvaluationData('csv');
      
      expect(data).to.be.a('string');
      expect(data).to.include('id,invocationId,toolId,toolType,timestamp,success,efficiency,qualityScore');
      expect(data.split('\n').length).to.equal(3); // Header + 2 rows
    });
    
    it('should throw error for unsupported format', () => {
      expect(() => outcomeEvaluator.exportEvaluationData('xml'))
        .to.throw('Unsupported export format: xml');
    });
  });
  
  describe('_determineSuccess', () => {
    it('should determine success based on outcome status', () => {
      expect(outcomeEvaluator._determineSuccess({ status: 'success' })).to.be.true;
      expect(outcomeEvaluator._determineSuccess({ status: 'failure' })).to.be.false;
      expect(outcomeEvaluator._determineSuccess({ status: 'error' })).to.be.false;
      expect(outcomeEvaluator._determineSuccess({ status: 'unknown' })).to.be.false;
    });
  });
  
  describe('_calculateEfficiency', () => {
    it('should calculate efficiency based on execution time', () => {
      const fastInvocation = { executionTime: 1000 }; // 1 second
      const slowInvocation = { executionTime: 10000 }; // 10 seconds
      
      const fastEfficiency = outcomeEvaluator._calculateEfficiency(fastInvocation);
      const slowEfficiency = outcomeEvaluator._calculateEfficiency(slowInvocation);
      
      expect(fastEfficiency).to.be.a('number');
      expect(slowEfficiency).to.be.a('number');
      expect(fastEfficiency).to.be.greaterThan(slowEfficiency);
    });
    
    it('should return default efficiency if execution time not available', () => {
      const invocation = { toolId: 'tool-1' };
      
      const efficiency = outcomeEvaluator._calculateEfficiency(invocation);
      
      expect(efficiency).to.equal(0.5);
    });
  });
  
  describe('_calculateQualityScore', () => {
    it('should use feedback rating if available', () => {
      const invocation = {
        feedback: { rating: 0.9 }
      };
      
      const qualityScore = outcomeEvaluator._calculateQualityScore(invocation);
      
      expect(qualityScore).to.equal(0.9);
    });
    
    it('should return low quality for failed outcomes', () => {
      const invocation = {
        outcome: { status: 'failure' }
      };
      
      const qualityScore = outcomeEvaluator._calculateQualityScore(invocation);
      
      expect(qualityScore).to.equal(0.2);
    });
    
    it('should return default quality for successful outcomes without feedback', () => {
      const invocation = {
        outcome: { status: 'success' }
      };
      
      const qualityScore = outcomeEvaluator._calculateQualityScore(invocation);
      
      expect(qualityScore).to.equal(0.7);
    });
  });
  
  describe('_analyzeFailure', () => {
    it('should analyze authentication failure', () => {
      const invocation = {
        outcome: {
          status: 'failure',
          errorCode: 'AUTH_FAILED',
          errorMessage: 'Authentication failed'
        }
      };
      
      const analysis = outcomeEvaluator._analyzeFailure(invocation);
      
      expect(analysis.errorCategory).to.equal('authentication');
      expect(analysis.severity).to.equal('high');
      expect(analysis.remediation).to.include('authentication');
    });
    
    it('should analyze permission failure', () => {
      const invocation = {
        outcome: {
          status: 'failure',
          errorCode: 'PERMISSION_DENIED',
          errorMessage: 'Access denied'
        }
      };
      
      const analysis = outcomeEvaluator._analyzeFailure(invocation);
      
      expect(analysis.errorCategory).to.equal('permission');
      expect(analysis.severity).to.equal('high');
      expect(analysis.remediation).to.include('permission');
    });
    
    it('should analyze timeout failure', () => {
      const invocation = {
        outcome: {
          status: 'failure',
          errorCode: 'TIMEOUT',
          errorMessage: 'Operation timed out'
        }
      };
      
      const analysis = outcomeEvaluator._analyzeFailure(invocation);
      
      expect(analysis.errorCategory).to.equal('timeout');
      expect(analysis.severity).to.equal('medium');
      expect(analysis.remediation).to.include('timeout');
    });
    
    it('should analyze not found failure', () => {
      const invocation = {
        outcome: {
          status: 'failure',
          errorCode: 'NOT_FOUND',
          errorMessage: 'Resource not found'
        }
      };
      
      const analysis = outcomeEvaluator._analyzeFailure(invocation);
      
      expect(analysis.errorCategory).to.equal('not_found');
      expect(analysis.severity).to.equal('low');
      expect(analysis.remediation).to.include('resource');
    });
    
    it('should analyze invalid input failure', () => {
      const invocation = {
        outcome: {
          status: 'failure',
          errorCode: 'INVALID_INPUT',
          errorMessage: 'Invalid input parameters'
        }
      };
      
      const analysis = outcomeEvaluator._analyzeFailure(invocation);
      
      expect(analysis.errorCategory).to.equal('invalid_input');
      expect(analysis.severity).to.equal('medium');
      expect(analysis.remediation.toLowerCase()).to.include('validate');
    });
    
    it('should analyze rate limit failure', () => {
      const invocation = {
        outcome: {
          status: 'failure',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          errorMessage: 'Rate limit exceeded'
        }
      };
      
      const analysis = outcomeEvaluator._analyzeFailure(invocation);
      
      expect(analysis.errorCategory).to.equal('rate_limit');
      expect(analysis.severity).to.equal('medium');
      expect(analysis.remediation).to.include('rate');
    });
    
    it('should handle unknown failure types', () => {
      const invocation = {
        outcome: {
          status: 'failure',
          errorCode: 'UNKNOWN_ERROR',
          errorMessage: 'Unknown error occurred'
        }
      };
      
      const analysis = outcomeEvaluator._analyzeFailure(invocation);
      
      expect(analysis.errorCategory).to.equal('other');
      expect(analysis.severity).to.equal('medium');
      expect(analysis.remediation).to.include('documentation');
    });
  });
  
  describe('_updateFailurePatterns', () => {
    it('should add new failure pattern', () => {
      const invocation = {
        id: 'inv-123',
        toolId: 'tool-1',
        outcome: {
          status: 'failure',
          errorCode: 'PERMISSION_DENIED',
          errorMessage: 'Access denied'
        }
      };
      
      outcomeEvaluator._updateFailurePatterns(invocation);
      
      expect(outcomeEvaluator.failurePatterns.has('tool-1')).to.be.true;
      const patterns = outcomeEvaluator.failurePatterns.get('tool-1');
      expect(patterns.length).to.equal(1);
      expect(patterns[0].toolId).to.equal('tool-1');
      expect(patterns[0].errorCategory).to.equal('permission');
      expect(patterns[0].frequency).to.equal(1);
      expect(patterns[0].examples.length).to.equal(1);
      expect(patterns[0].examples[0].invocationId).to.equal('inv-123');
    });
    
    it('should update existing failure pattern', () => {
      // Add initial pattern
      outcomeEvaluator.failurePatterns.set('tool-1', [
        {
          id: 'pattern-1',
          toolId: 'tool-1',
          errorCategory: 'permission',
          frequency: 1,
          examples: [{ invocationId: 'inv-1', errorMessage: 'Access denied' }],
          firstOccurrence: Date.now() - 1000,
          lastOccurrence: Date.now() - 1000
        }
      ]);
      
      // Update with new invocation
      const invocation = {
        id: 'inv-2',
        toolId: 'tool-1',
        outcome: {
          status: 'failure',
          errorCode: 'PERMISSION_DENIED',
          errorMessage: 'Access denied again'
        }
      };
      
      outcomeEvaluator._updateFailurePatterns(invocation);
      
      const patterns = outcomeEvaluator.failurePatterns.get('tool-1');
      expect(patterns.length).to.equal(1);
      expect(patterns[0].frequency).to.equal(2);
      expect(patterns[0].examples.length).to.equal(2);
      expect(patterns[0].examples[1].invocationId).to.equal('inv-2');
    });
    
    it('should limit number of examples', () => {
      // Add initial pattern with 5 examples
      const examples = [];
      for (let i = 1; i <= 5; i++) {
        examples.push({ 
          invocationId: `inv-${i}`, 
          errorMessage: `Error ${i}`,
          timestamp: Date.now() - (6 - i) * 1000 // Oldest first
        });
      }
      
      outcomeEvaluator.failurePatterns.set('tool-1', [
        {
          id: 'pattern-1',
          toolId: 'tool-1',
          errorCategory: 'permission',
          frequency: 5,
          examples: examples,
          firstOccurrence: Date.now() - 5000,
          lastOccurrence: Date.now() - 1000
        }
      ]);
      
      // Update with new invocation
      const invocation = {
        id: 'inv-6',
        toolId: 'tool-1',
        outcome: {
          status: 'failure',
          errorCode: 'PERMISSION_DENIED',
          errorMessage: 'Access denied again'
        }
      };
      
      outcomeEvaluator._updateFailurePatterns(invocation);
      
      const patterns = outcomeEvaluator.failurePatterns.get('tool-1');
      expect(patterns[0].examples.length).to.equal(5);
      expect(patterns[0].examples[0].invocationId).to.equal('inv-2');
      expect(patterns[0].examples[4].invocationId).to.equal('inv-6');
    });
    
    it('should do nothing for successful outcomes', () => {
      const invocation = {
        id: 'inv-123',
        toolId: 'tool-1',
        outcome: {
          status: 'success'
        }
      };
      
      outcomeEvaluator._updateFailurePatterns(invocation);
      
      expect(outcomeEvaluator.failurePatterns.has('tool-1')).to.be.false;
    });
    
    it('should do nothing if outcome is missing', () => {
      const invocation = {
        id: 'inv-123',
        toolId: 'tool-1'
      };
      
      outcomeEvaluator._updateFailurePatterns(invocation);
      
      expect(outcomeEvaluator.failurePatterns.has('tool-1')).to.be.false;
    });
  });
  
  describe('persistData', () => {
    it('should persist data to storage', () => {
      fsExistsSyncStub.returns(true);
      fsWriteFileSyncStub.returns(true);
      
      const result = outcomeEvaluator.persistData();
      
      expect(result).to.be.true;
      expect(fsWriteFileSyncStub.calledOnce).to.be.true;
      expect(mockLogger.info.calledWith('Outcome Evaluator data persisted')).to.be.true;
    });
    
    it('should handle errors during persistence', () => {
      fsExistsSyncStub.returns(true);
      fsWriteFileSyncStub.throws(new Error('Write failed'));
      
      const result = outcomeEvaluator.persistData();
      
      expect(result).to.be.false;
      expect(mockLogger.error.calledOnce).to.be.true;
    });
  });
  
  describe('loadData', () => {
    it('should load data from storage', () => {
      fsExistsSyncStub.returns(true);
      fsReadFileSyncStub.returns(JSON.stringify({
        evaluations: [
          { id: 'eval-1', toolId: 'tool-1', success: true }
        ],
        failurePatterns: {
          'tool-1': [
            { id: 'pattern-1', toolId: 'tool-1', errorCategory: 'permission', frequency: 1 }
          ]
        }
      }));
      
      const result = outcomeEvaluator.loadData();
      
      expect(result).to.be.true;
      expect(fsReadFileSyncStub.calledOnce).to.be.true;
      expect(mockLogger.info.calledWith('Outcome Evaluator data loaded')).to.be.true;
    });
    
    it('should handle errors during loading', () => {
      fsExistsSyncStub.returns(true);
      fsReadFileSyncStub.throws(new Error('Read failed'));
      
      const result = outcomeEvaluator.loadData();
      
      expect(result).to.be.false;
      expect(mockLogger.error.calledOnce).to.be.true;
    });
    
    it('should do nothing if no persistence files found', () => {
      fsExistsSyncStub.returns(false);
      
      const result = outcomeEvaluator.loadData();
      
      expect(result).to.be.false;
      expect(mockLogger.info.calledWith('No persisted data found for Outcome Evaluator')).to.be.true;
    });
  });
});
