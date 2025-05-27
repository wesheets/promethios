/**
 * Integration test for Tool Selection History module with observers
 * 
 * Tests the integration between Tool Selection History module and
 * the constitutional observers (PRISM and VIGIL).
 * 
 * @module tests/integration/modules/tool_selection_history/test_observer_integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { ToolSelectionHistory } = require('../../../../src/modules/tool_selection_history');
const { PrismObserver } = require('../../../../src/observers/prism');
const { VigilObserver } = require('../../../../src/observers/vigil');
const { ConfidenceScoring } = require('../../../../src/modules/confidence_scoring');

describe('Tool Selection History Observer Integration', () => {
  let toolSelectionHistory;
  let prismObserver;
  let vigilObserver;
  let confidenceScoring;
  let mockLogger;
  let mockHooksManager;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      debug: sinon.spy()
    };
    
    // Create mock event emitter
    const EventEmitter = require('events');
    const mockEventEmitter = new EventEmitter();
    
    // Create mock constitutional hooks
    const mockConstitutionalHooks = {
      getConstitutionalRules: () => [
        {
          id: 'rule1',
          name: 'Test Rule',
          description: 'Test rule for integration tests',
          severity: 'medium',
          check: () => true
        }
      ]
    };
    
    // Create mock PRISM observer
    prismObserver = new PrismObserver({
      logger: mockLogger,
      eventEmitter: mockEventEmitter,
      dataDir: '/tmp/prism_test'
    });
    
    // Stub PRISM methods
    sinon.stub(prismObserver, 'verifyTrace').returns(Promise.resolve({
      verified: true,
      confidence: 0.8,
      traceId: 'trace-1'
    }));
    
    // Create mock VIGIL observer
    vigilObserver = new VigilObserver({
      logger: mockLogger,
      eventEmitter: mockEventEmitter,
      constitutionalHooks: mockConstitutionalHooks,
      dataDir: '/tmp/vigil_test'
    });
    
    // Stub VIGIL methods
    sinon.stub(vigilObserver, 'assessTrust').returns(Promise.resolve({
      trusted: true,
      trustScore: 0.75,
      assessmentId: 'assess-1'
    }));
    
    // Create mock Confidence Scoring module
    confidenceScoring = new ConfidenceScoring({
      logger: mockLogger
    });
    
    // Stub Confidence Scoring methods
    sinon.stub(confidenceScoring, 'calculateConfidence').returns({
      confidenceScore: { value: 0.85 },
      evidenceMap: { id: 'evidence-1' }
    });
    
    // Create Tool Selection History instance
    toolSelectionHistory = new ToolSelectionHistory({
      logger: mockLogger,
      config: {
        persistenceInterval: 0 // Disable automatic persistence
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('PRISM Observer Integration', () => {
    it('should integrate with PRISM observer', () => {
      toolSelectionHistory.integrateWithPrism(prismObserver);
      
      expect(toolSelectionHistory.prismObserver).to.equal(prismObserver);
      expect(mockLogger.info.calledOnce).to.be.true;
    });
    
    it('should verify tool usage patterns with PRISM', async () => {
      toolSelectionHistory.integrateWithPrism(prismObserver);
      
      const pattern = {
        id: 'pattern-1',
        toolId: 'tool-1',
        contextPatterns: [
          { taskType: 'search', intentPatterns: [] }
        ]
      };
      
      const result = await toolSelectionHistory.verifyPatternWithPrism(pattern);
      
      expect(result).to.be.an('object');
      expect(result.verified).to.be.true;
      expect(result.confidence).to.equal(0.8);
      expect(prismObserver.verifyTrace.calledOnce).to.be.true;
    });
    
    it('should handle PRISM verification errors', async () => {
      toolSelectionHistory.integrateWithPrism(prismObserver);
      
      // Make verifyTrace throw an error
      prismObserver.verifyTrace.throws(new Error('Verification failed'));
      
      const pattern = {
        id: 'pattern-1',
        toolId: 'tool-1',
        contextPatterns: []
      };
      
      try {
        await toolSelectionHistory.verifyPatternWithPrism(pattern);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Verification failed');
        expect(mockLogger.error.calledOnce).to.be.true;
      }
    });
    
    it('should log warning if PRISM observer is not integrated', async () => {
      const pattern = {
        id: 'pattern-1',
        toolId: 'tool-1',
        contextPatterns: []
      };
      
      const result = await toolSelectionHistory.verifyPatternWithPrism(pattern);
      
      expect(result).to.be.null;
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('VIGIL Observer Integration', () => {
    it('should integrate with VIGIL observer', () => {
      toolSelectionHistory.integrateWithVigil(vigilObserver);
      
      expect(toolSelectionHistory.vigilObserver).to.equal(vigilObserver);
      expect(mockLogger.info.calledOnce).to.be.true;
    });
    
    it('should assess tool usage patterns with VIGIL', async () => {
      toolSelectionHistory.integrateWithVigil(vigilObserver);
      
      const pattern = {
        id: 'pattern-1',
        toolId: 'tool-1',
        usageMetrics: { successRate: 0.8 }
      };
      
      const result = await toolSelectionHistory.assessPatternWithVigil(pattern);
      
      expect(result).to.be.an('object');
      expect(result.trusted).to.be.true;
      expect(result.trustScore).to.equal(0.75);
      expect(vigilObserver.assessTrust.calledOnce).to.be.true;
    });
    
    it('should handle VIGIL assessment errors', async () => {
      toolSelectionHistory.integrateWithVigil(vigilObserver);
      
      // Make assessTrust throw an error
      vigilObserver.assessTrust.throws(new Error('Assessment failed'));
      
      const pattern = {
        id: 'pattern-1',
        toolId: 'tool-1',
        usageMetrics: {}
      };
      
      try {
        await toolSelectionHistory.assessPatternWithVigil(pattern);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Assessment failed');
        expect(mockLogger.error.calledOnce).to.be.true;
      }
    });
    
    it('should log warning if VIGIL observer is not integrated', async () => {
      const pattern = {
        id: 'pattern-1',
        toolId: 'tool-1',
        usageMetrics: {}
      };
      
      const result = await toolSelectionHistory.assessPatternWithVigil(pattern);
      
      expect(result).to.be.null;
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('Confidence Scoring Integration', () => {
    it('should integrate with Confidence Scoring module', () => {
      toolSelectionHistory.integrateWithConfidenceScoring(confidenceScoring);
      
      expect(toolSelectionHistory.confidenceScoring).to.equal(confidenceScoring);
      expect(mockLogger.info.calledOnce).to.be.true;
    });
    
    it('should calculate confidence for recommendations', () => {
      toolSelectionHistory.integrateWithConfidenceScoring(confidenceScoring);
      
      // Mock the recommendation engine
      toolSelectionHistory.recommendationEngine = {
        setConfidenceScoring: sinon.spy()
      };
      
      // Verify that the confidence scoring module is passed to the recommendation engine
      expect(toolSelectionHistory.recommendationEngine.setConfidenceScoring.calledOnce).to.be.true;
      expect(toolSelectionHistory.recommendationEngine.setConfidenceScoring.calledWith(confidenceScoring)).to.be.true;
    });
    
    it('should log warning if Confidence Scoring module is not integrated', () => {
      toolSelectionHistory.integrateWithConfidenceScoring(null);
      
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('Constitutional Hooks Integration', () => {
    it('should register hooks with the Constitutional Hooks Manager', () => {
      toolSelectionHistory.registerHooks(mockHooksManager);
      
      expect(mockHooksManager.registerHook.callCount).to.equal(3);
      expect(mockHooksManager.registerHook.calledWith('tool_selection')).to.be.true;
      expect(mockHooksManager.registerHook.calledWith('tool_execution')).to.be.true;
      expect(mockHooksManager.registerHook.calledWith('tool_outcome')).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
    
    it('should handle tool selection hook events', async () => {
      // Create spy for handleToolSelectionHook
      const handleToolSelectionHookSpy = sinon.spy(toolSelectionHistory, 'handleToolSelectionHook');
      
      toolSelectionHistory.registerHooks(mockHooksManager);
      
      // Trigger the hook
      const hookData = {
        toolId: 'tool-1',
        parameters: { param1: 'value1' },
        context: { taskId: 'task-1' }
      };
      
      await mockHooksManager.triggerHook('tool_selection', hookData);
      
      expect(handleToolSelectionHookSpy.calledOnce).to.be.true;
      expect(handleToolSelectionHookSpy.calledWith(hookData)).to.be.true;
    });
    
    it('should handle tool execution hook events', async () => {
      // Create spy for handleToolExecutionHook
      const handleToolExecutionHookSpy = sinon.spy(toolSelectionHistory, 'handleToolExecutionHook');
      
      toolSelectionHistory.registerHooks(mockHooksManager);
      
      // Trigger the hook
      const hookData = {
        invocationId: 'inv-1',
        executionTime: 1000,
        resourceUsage: { memory: 100 }
      };
      
      await mockHooksManager.triggerHook('tool_execution', hookData);
      
      expect(handleToolExecutionHookSpy.calledOnce).to.be.true;
      expect(handleToolExecutionHookSpy.calledWith(hookData)).to.be.true;
    });
    
    it('should handle tool outcome hook events', async () => {
      // Create spy for handleToolOutcomeHook
      const handleToolOutcomeHookSpy = sinon.spy(toolSelectionHistory, 'handleToolOutcomeHook');
      
      toolSelectionHistory.registerHooks(mockHooksManager);
      
      // Trigger the hook
      const hookData = {
        invocationId: 'inv-1',
        outcome: { status: 'success' }
      };
      
      await mockHooksManager.triggerHook('tool_outcome', hookData);
      
      expect(handleToolOutcomeHookSpy.calledOnce).to.be.true;
      expect(handleToolOutcomeHookSpy.calledWith(hookData)).to.be.true;
    });
    
    it('should log warning if hooks manager is not provided', () => {
      toolSelectionHistory.registerHooks(null);
      
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('Full Integration', () => {
    it('should integrate with all observers and hooks manager', () => {
      toolSelectionHistory.integrateWithPrism(prismObserver);
      toolSelectionHistory.integrateWithVigil(vigilObserver);
      toolSelectionHistory.integrateWithConfidenceScoring(confidenceScoring);
      toolSelectionHistory.registerHooks(mockHooksManager);
      
      expect(toolSelectionHistory.prismObserver).to.equal(prismObserver);
      expect(toolSelectionHistory.vigilObserver).to.equal(vigilObserver);
      expect(toolSelectionHistory.confidenceScoring).to.equal(confidenceScoring);
      expect(mockHooksManager.registerHook.callCount).to.equal(3);
    });
    
    it('should handle complete tool usage lifecycle with observers', async () => {
      // Integrate with all observers
      toolSelectionHistory.integrateWithPrism(prismObserver);
      toolSelectionHistory.integrateWithVigil(vigilObserver);
      toolSelectionHistory.integrateWithConfidenceScoring(confidenceScoring);
      
      // Mock the internal components
      toolSelectionHistory.usageTracker = {
        recordToolInvocation: sinon.stub().returns({ id: 'inv-1', toolId: 'tool-1' }),
        updateOutcome: sinon.stub().returns({ id: 'inv-1', outcome: { status: 'success' } }),
        getToolUsageHistory: sinon.stub().returns([{ id: 'inv-1', toolId: 'tool-1' }])
      };
      
      toolSelectionHistory.patternAnalyzer = {
        updatePatterns: sinon.stub().returns({ id: 'pattern-1', toolId: 'tool-1' })
      };
      
      // Record a tool invocation
      const invocation = toolSelectionHistory.recordToolInvocation('tool-1', { param1: 'value1' }, { taskId: 'task-1' });
      
      // Update the outcome
      const outcome = { status: 'success', resultSummary: 'Operation completed successfully' };
      const updatedInvocation = toolSelectionHistory.updateOutcome(invocation.id, outcome);
      
      // Verify the pattern with PRISM
      const pattern = toolSelectionHistory.patternAnalyzer.updatePatterns();
      const verification = await toolSelectionHistory.verifyPatternWithPrism(pattern);
      
      // Assess the pattern with VIGIL
      const assessment = await toolSelectionHistory.assessPatternWithVigil(pattern);
      
      expect(invocation.id).to.equal('inv-1');
      expect(updatedInvocation.outcome.status).to.equal('success');
      expect(verification.verified).to.be.true;
      expect(assessment.trusted).to.be.true;
    });
  });
});
