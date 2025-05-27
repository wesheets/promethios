/**
 * Unit tests for the Tool Selection History module main class
 * 
 * @module tests/unit/modules/tool_selection_history/test_index
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { ToolSelectionHistory } = require('../../../../src/modules/tool_selection_history');

describe('ToolSelectionHistory', () => {
  let toolSelectionHistory;
  let mockLogger;
  let mockUsageTracker;
  let mockOutcomeEvaluator;
  let mockPatternAnalyzer;
  let mockRecommendationEngine;
  let mockBeliefTraceManager;
  let mockConfidenceScoring;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      debug: sinon.spy()
    };
    
    // Create mock components
    mockUsageTracker = {
      recordToolInvocation: sinon.stub().returns({ id: 'inv-123', toolId: 'tool-1' }),
      updateOutcome: sinon.stub().returns({ id: 'inv-123', toolId: 'tool-1', outcome: { status: 'success' } }),
      addFeedback: sinon.stub().returns({ id: 'inv-123', toolId: 'tool-1', feedback: { rating: 0.8 } }),
      persistData: sinon.spy()
    };
    
    mockOutcomeEvaluator = {
      evaluateOutcome: sinon.stub().returns({ id: 'eval-123', success: true }),
      persistData: sinon.spy()
    };
    
    mockPatternAnalyzer = {
      updatePatterns: sinon.stub().returns({ id: 'pattern-tool-1', toolId: 'tool-1' }),
      getToolUsagePatterns: sinon.stub().returns([{ id: 'pattern-tool-1', toolId: 'tool-1' }]),
      detectToolOveruse: sinon.stub().returns([]),
      detectToolUnderuse: sinon.stub().returns([]),
      getToolEfficiencyMetrics: sinon.stub().returns({ toolId: 'tool-1', successRate: 0.8 }),
      generateInsights: sinon.stub().returns([{ id: 'insight-1', toolId: 'tool-1' }]),
      persistData: sinon.spy()
    };
    
    mockRecommendationEngine = {
      getToolRecommendation: sinon.stub().returns({ 
        id: 'rec-123', 
        recommendations: [{ toolId: 'tool-1', confidence: 0.8 }] 
      }),
      persistData: sinon.spy()
    };
    
    mockBeliefTraceManager = {
      getTrace: sinon.stub().returns({ id: 'trace-1' }),
      verifyTrace: sinon.stub().returns({ confidence: 0.9 })
    };
    
    mockConfidenceScoring = {
      calculateConfidence: sinon.stub().returns({ 
        confidenceScore: { value: 0.8 }, 
        evidenceMap: { id: 'map-1' } 
      })
    };
    
    // Create ToolSelectionHistory instance with mocks
    toolSelectionHistory = new ToolSelectionHistory({
      logger: mockLogger,
      config: {
        persistenceInterval: 0 // Disable automatic persistence
      },
      beliefTraceManager: mockBeliefTraceManager,
      confidenceScoring: mockConfidenceScoring
    });
    
    // Replace component instances with mocks
    toolSelectionHistory.usageTracker = mockUsageTracker;
    toolSelectionHistory.outcomeEvaluator = mockOutcomeEvaluator;
    toolSelectionHistory.patternAnalyzer = mockPatternAnalyzer;
    toolSelectionHistory.recommendationEngine = mockRecommendationEngine;
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('recordToolInvocation', () => {
    it('should record a tool invocation', () => {
      const toolId = 'tool-1';
      const parameters = { param1: 'value1' };
      const context = { taskId: 'task-1', agentId: 'agent-1' };
      
      const result = toolSelectionHistory.recordToolInvocation(toolId, parameters, context);
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('inv-123');
      expect(result.toolId).to.equal('tool-1');
      expect(mockUsageTracker.recordToolInvocation.calledOnce).to.be.true;
      expect(mockUsageTracker.recordToolInvocation.calledWith(toolId, parameters, context)).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
  });
  
  describe('updateOutcome', () => {
    it('should update the outcome of a tool invocation', () => {
      const invocationId = 'inv-123';
      const outcome = { status: 'success', resultSummary: 'Operation completed successfully' };
      
      const result = toolSelectionHistory.updateOutcome(invocationId, outcome);
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('inv-123');
      expect(result.outcome.status).to.equal('success');
      expect(mockUsageTracker.updateOutcome.calledOnce).to.be.true;
      expect(mockUsageTracker.updateOutcome.calledWith(invocationId, outcome)).to.be.true;
      expect(mockOutcomeEvaluator.evaluateOutcome.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.updatePatterns.calledOnce).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
  });
  
  describe('addFeedback', () => {
    it('should add feedback to a tool invocation', () => {
      const invocationId = 'inv-123';
      const feedback = { rating: 0.8, comments: 'Good tool' };
      
      const result = toolSelectionHistory.addFeedback(invocationId, feedback);
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('inv-123');
      expect(result.feedback.rating).to.equal(0.8);
      expect(mockUsageTracker.addFeedback.calledOnce).to.be.true;
      expect(mockUsageTracker.addFeedback.calledWith(invocationId, feedback)).to.be.true;
      expect(mockOutcomeEvaluator.evaluateOutcome.calledOnce).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
  });
  
  describe('getToolRecommendation', () => {
    it('should get a tool recommendation for a context', () => {
      const context = { taskType: 'search', intentId: 'find_information' };
      
      const result = toolSelectionHistory.getToolRecommendation(context);
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('rec-123');
      expect(result.recommendations).to.be.an('array');
      expect(result.recommendations[0].toolId).to.equal('tool-1');
      expect(mockRecommendationEngine.getToolRecommendation.calledOnce).to.be.true;
      expect(mockRecommendationEngine.getToolRecommendation.calledWith(context)).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
  });
  
  describe('getToolUsagePatterns', () => {
    it('should get tool usage patterns', () => {
      const options = { toolType: 'search' };
      
      const result = toolSelectionHistory.getToolUsagePatterns(options);
      
      expect(result).to.be.an('array');
      expect(result[0].id).to.equal('pattern-tool-1');
      expect(result[0].toolId).to.equal('tool-1');
      expect(mockPatternAnalyzer.getToolUsagePatterns.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.getToolUsagePatterns.calledWith(options)).to.be.true;
    });
  });
  
  describe('getToolEfficiencyMetrics', () => {
    it('should get tool efficiency metrics', () => {
      const toolId = 'tool-1';
      const options = { timeRange: { startTime: 1620000000000, endTime: 1630000000000 } };
      
      const result = toolSelectionHistory.getToolEfficiencyMetrics(toolId, options);
      
      expect(result).to.be.an('object');
      expect(result.toolId).to.equal('tool-1');
      expect(result.successRate).to.equal(0.8);
      expect(mockPatternAnalyzer.getToolEfficiencyMetrics.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.getToolEfficiencyMetrics.calledWith(toolId, options)).to.be.true;
    });
  });
  
  describe('detectToolOveruse', () => {
    it('should detect tool overuse patterns', () => {
      const threshold = 0.7;
      
      const result = toolSelectionHistory.detectToolOveruse(threshold);
      
      expect(result).to.be.an('array');
      expect(mockPatternAnalyzer.detectToolOveruse.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.detectToolOveruse.calledWith(threshold)).to.be.true;
    });
  });
  
  describe('detectToolUnderuse', () => {
    it('should detect tool underuse patterns', () => {
      const threshold = 0.1;
      
      const result = toolSelectionHistory.detectToolUnderuse(threshold);
      
      expect(result).to.be.an('array');
      expect(mockPatternAnalyzer.detectToolUnderuse.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.detectToolUnderuse.calledWith(threshold)).to.be.true;
    });
  });
  
  describe('generateInsights', () => {
    it('should generate insights from tool usage patterns', () => {
      const options = { toolType: 'search' };
      
      const result = toolSelectionHistory.generateInsights(options);
      
      expect(result).to.be.an('array');
      expect(result[0].id).to.equal('insight-1');
      expect(result[0].toolId).to.equal('tool-1');
      expect(mockPatternAnalyzer.generateInsights.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.generateInsights.calledWith(options)).to.be.true;
    });
  });
  
  describe('registerHooks', () => {
    it('should register hooks with the Constitutional Hooks Manager', () => {
      const mockHooksManager = {
        registerHook: sinon.spy()
      };
      
      toolSelectionHistory.registerHooks(mockHooksManager);
      
      expect(mockHooksManager.registerHook.callCount).to.equal(3);
      expect(mockHooksManager.registerHook.calledWith('tool_selection')).to.be.true;
      expect(mockHooksManager.registerHook.calledWith('tool_execution')).to.be.true;
      expect(mockHooksManager.registerHook.calledWith('tool_outcome')).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
    
    it('should log a warning if no hooks manager is provided', () => {
      toolSelectionHistory.registerHooks(null);
      
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('handleToolSelectionHook', () => {
    it('should handle tool selection hook', () => {
      const data = { toolId: 'tool-1', parameters: { param1: 'value1' }, context: { taskId: 'task-1' } };
      
      toolSelectionHistory.handleToolSelectionHook(data);
      
      expect(mockUsageTracker.recordToolInvocation.calledOnce).to.be.true;
      expect(mockUsageTracker.recordToolInvocation.calledWith(data.toolId, data.parameters, data.context)).to.be.true;
    });
    
    it('should do nothing if data is invalid', () => {
      toolSelectionHistory.handleToolSelectionHook(null);
      
      expect(mockUsageTracker.recordToolInvocation.called).to.be.false;
    });
  });
  
  describe('handleToolExecutionHook', () => {
    it('should handle tool execution hook', () => {
      const data = { 
        invocationId: 'inv-123', 
        executionTime: 1000, 
        resourceUsage: { memory: 100 } 
      };
      
      toolSelectionHistory.handleToolExecutionHook(data);
      
      expect(mockUsageTracker.updateExecutionMetrics.calledOnce).to.be.true;
      expect(mockUsageTracker.updateExecutionMetrics.calledWith(
        data.invocationId, 
        { executionTime: data.executionTime, resourceUsage: data.resourceUsage }
      )).to.be.true;
    });
    
    it('should do nothing if data is invalid', () => {
      toolSelectionHistory.handleToolExecutionHook(null);
      
      expect(mockUsageTracker.updateExecutionMetrics.called).to.be.false;
    });
  });
  
  describe('handleToolOutcomeHook', () => {
    it('should handle tool outcome hook', () => {
      const data = { invocationId: 'inv-123', outcome: { status: 'success' } };
      
      toolSelectionHistory.handleToolOutcomeHook(data);
      
      expect(mockUsageTracker.updateOutcome.calledOnce).to.be.true;
      expect(mockUsageTracker.updateOutcome.calledWith(data.invocationId, data.outcome)).to.be.true;
    });
    
    it('should do nothing if data is invalid', () => {
      toolSelectionHistory.handleToolOutcomeHook(null);
      
      expect(mockUsageTracker.updateOutcome.called).to.be.false;
    });
  });
  
  describe('persistData', () => {
    it('should persist data to storage', () => {
      toolSelectionHistory.persistData();
      
      expect(mockUsageTracker.persistData.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.persistData.calledOnce).to.be.true;
      expect(mockRecommendationEngine.persistData.calledOnce).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
  });
  
  describe('integrateWithPrism', () => {
    it('should integrate with PRISM observer', () => {
      const mockPrismObserver = { id: 'prism' };
      
      toolSelectionHistory.integrateWithPrism(mockPrismObserver);
      
      expect(toolSelectionHistory.prismObserver).to.equal(mockPrismObserver);
      expect(mockLogger.info.calledOnce).to.be.true;
    });
    
    it('should log a warning if no PRISM observer is provided', () => {
      toolSelectionHistory.integrateWithPrism(null);
      
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('integrateWithVigil', () => {
    it('should integrate with VIGIL observer', () => {
      const mockVigilObserver = { id: 'vigil' };
      
      toolSelectionHistory.integrateWithVigil(mockVigilObserver);
      
      expect(toolSelectionHistory.vigilObserver).to.equal(mockVigilObserver);
      expect(mockLogger.info.calledOnce).to.be.true;
    });
    
    it('should log a warning if no VIGIL observer is provided', () => {
      toolSelectionHistory.integrateWithVigil(null);
      
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('integrateWithConfidenceScoring', () => {
    it('should integrate with Confidence Scoring module', () => {
      const mockConfidenceScoringModule = { id: 'confidence_scoring' };
      
      toolSelectionHistory.integrateWithConfidenceScoring(mockConfidenceScoringModule);
      
      expect(toolSelectionHistory.confidenceScoring).to.equal(mockConfidenceScoringModule);
      expect(mockRecommendationEngine.setConfidenceScoring.calledOnce).to.be.true;
      expect(mockRecommendationEngine.setConfidenceScoring.calledWith(mockConfidenceScoringModule)).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
    
    it('should log a warning if no Confidence Scoring module is provided', () => {
      toolSelectionHistory.integrateWithConfidenceScoring(null);
      
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('cleanup', () => {
    it('should clean up resources', () => {
      // Create instance with persistence timer
      const instance = new ToolSelectionHistory({
        logger: mockLogger,
        config: {
          persistenceInterval: 1000 // Enable persistence timer
        }
      });
      
      // Replace component instances with mocks
      instance.usageTracker = mockUsageTracker;
      instance.patternAnalyzer = mockPatternAnalyzer;
      instance.recommendationEngine = mockRecommendationEngine;
      
      // Call cleanup
      instance.cleanup();
      
      expect(mockUsageTracker.persistData.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.persistData.calledOnce).to.be.true;
      expect(mockRecommendationEngine.persistData.calledOnce).to.be.true;
      expect(mockLogger.info.calledOnce).to.be.true;
    });
  });
});
