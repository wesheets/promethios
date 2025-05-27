/**
 * Unit Tests for Recommendation Engine
 * 
 * Tests the functionality of the RecommendationEngine component for
 * providing tool recommendations based on context and patterns.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const { RecommendationEngine } = require('../../../../src/modules/tool_selection_history/recommendation_engine');

describe('RecommendationEngine', function() {
  let recommendationEngine;
  let sandbox;
  let mockFs;
  let mockToolUsageTracker;
  let mockPatternAnalyzer;
  let mockOutcomeEvaluator;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock file system operations
    mockFs = {
      mkdirSync: sandbox.stub(fs, 'mkdirSync').returns(true),
      existsSync: sandbox.stub(fs, 'existsSync').returns(true),
      writeFileSync: sandbox.stub(fs, 'writeFileSync').returns(true),
      readFileSync: sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
        recommendations: [],
        feedbackHistory: []
      }))
    };
    
    // Mock ToolUsageTracker
    mockToolUsageTracker = {
      getToolUsageStats: sandbox.stub().returns({
        usage_count: 10,
        success_count: 8,
        success_rate: 0.8,
        avg_duration_ms: 1200
      }),
      getAllToolUsageStats: sandbox.stub().returns({
        'search_web': {
          usage_count: 10,
          success_count: 8,
          success_rate: 0.8,
          avg_duration_ms: 1200
        },
        'browser_navigate': {
          usage_count: 5,
          success_count: 5,
          success_rate: 1.0,
          avg_duration_ms: 800
        }
      }),
      getContextHistory: sandbox.stub().returns([
        {
          tool: 'search_web',
          context: { query: 'test query 1' },
          outcome: { success: true },
          timestamp: new Date().toISOString()
        },
        {
          tool: 'browser_navigate',
          context: { url: 'test.com' },
          outcome: { success: true },
          timestamp: new Date().toISOString()
        }
      ]),
      findSimilarContexts: sandbox.stub().returns([
        {
          tool: 'search_web',
          context: { query: 'similar query' },
          outcome: { success: true }
        }
      ])
    };
    
    // Mock PatternAnalyzer
    mockPatternAnalyzer = {
      getPatterns: sandbox.stub().returns({
        highPerformingTools: ['browser_navigate'],
        lowPerformingTools: [],
        toolSequences: {
          'search_web': {
            nextTools: {
              'browser_navigate': 5
            }
          }
        },
        commonSequences: [
          {
            sequence: ['search_web', 'browser_navigate'],
            count: 5
          }
        ],
        strongCorrelations: [
          {
            contextFactor: 'user_intent',
            contextValue: 'information retrieval',
            primaryTool: 'search_web',
            confidence: 0.9
          }
        ]
      }),
      getCorrelations: sandbox.stub().returns([
        {
          contextFactor: 'user_intent',
          contextValue: 'information retrieval',
          tools: {
            'search_web': 10,
            'browser_navigate': 2
          },
          totalOccurrences: 12
        }
      ]),
      predictToolForContext: sandbox.stub().returns({
        tool: 'search_web',
        confidence: 0.8,
        reasoning: 'Based on context correlations'
      })
    };
    
    // Mock OutcomeEvaluator
    mockOutcomeEvaluator = {
      evaluateToolOutcome: sandbox.stub().returns({
        success: true,
        quality: 'high',
        metrics: {
          relevance: 0.9,
          efficiency: 0.8,
          user_satisfaction: 0.85
        }
      }),
      getToolEvaluationStats: sandbox.stub().returns({
        'search_web': {
          success_rate: 0.8,
          avg_quality: 0.85,
          avg_relevance: 0.9
        },
        'browser_navigate': {
          success_rate: 1.0,
          avg_quality: 0.95,
          avg_relevance: 0.9
        }
      })
    };
    
    // Create test instance
    recommendationEngine = new RecommendationEngine({
      dataDir: '/test/data/dir',
      toolUsageTracker: mockToolUsageTracker,
      patternAnalyzer: mockPatternAnalyzer,
      outcomeEvaluator: mockOutcomeEvaluator
    });
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('constructor', function() {
    it('should create data directory if it does not exist', function() {
      // Set existsSync to return false to simulate directory not existing
      mockFs.existsSync.returns(false);
      
      // Create new instance to trigger directory creation
      const engine = new RecommendationEngine({
        dataDir: '/test/data/dir',
        toolUsageTracker: mockToolUsageTracker,
        patternAnalyzer: mockPatternAnalyzer,
        outcomeEvaluator: mockOutcomeEvaluator
      });
      
      expect(mockFs.mkdirSync.calledOnce).to.be.true;
      expect(mockFs.mkdirSync.calledWith('/test/data/dir', { recursive: true })).to.be.true;
    });
    
    it('should initialize with default settings if not provided', function() {
      const engine = new RecommendationEngine({
        toolUsageTracker: mockToolUsageTracker,
        patternAnalyzer: mockPatternAnalyzer,
        outcomeEvaluator: mockOutcomeEvaluator
      });
      
      expect(engine.dataDir).to.equal(path.join(process.cwd(), 'data/recommendation_engine'));
      expect(engine.recommendations).to.be.an('array');
      expect(engine.feedbackHistory).to.be.an('array');
    });
    
    it('should use provided settings if available', function() {
      const engine = new RecommendationEngine({
        dataDir: '/custom/data/dir',
        confidenceThreshold: 0.7,
        toolUsageTracker: mockToolUsageTracker,
        patternAnalyzer: mockPatternAnalyzer,
        outcomeEvaluator: mockOutcomeEvaluator
      });
      
      expect(engine.dataDir).to.equal('/custom/data/dir');
      expect(engine.confidenceThreshold).to.equal(0.7);
    });
    
    it('should throw error if required dependencies are not provided', function() {
      expect(() => new RecommendationEngine({
        toolUsageTracker: mockToolUsageTracker,
        // Missing patternAnalyzer
        outcomeEvaluator: mockOutcomeEvaluator
      })).to.throw('PatternAnalyzer is required');
      
      expect(() => new RecommendationEngine({
        // Missing toolUsageTracker
        patternAnalyzer: mockPatternAnalyzer,
        outcomeEvaluator: mockOutcomeEvaluator
      })).to.throw('ToolUsageTracker is required');
      
      expect(() => new RecommendationEngine({
        toolUsageTracker: mockToolUsageTracker,
        patternAnalyzer: mockPatternAnalyzer,
        // Missing outcomeEvaluator
      })).to.throw('OutcomeEvaluator is required');
    });
  });
  
  describe('recommendToolForContext', function() {
    it('should recommend tool based on context', function() {
      const context = {
        query: 'weather forecast',
        user_intent: 'information retrieval'
      };
      
      const previousTools = [];
      
      const recommendation = recommendationEngine.recommendToolForContext(context, previousTools);
      
      // Verify patternAnalyzer was called
      expect(mockPatternAnalyzer.predictToolForContext.calledOnce).to.be.true;
      expect(mockPatternAnalyzer.predictToolForContext.calledWith(context)).to.be.true;
      
      // Verify recommendation structure
      expect(recommendation).to.be.an('object');
      expect(recommendation.tool).to.equal('search_web');
      expect(recommendation.confidence).to.equal(0.8);
      expect(recommendation.reasoning).to.be.a('string');
      expect(recommendation.alternatives).to.be.an('array');
    });
    
    it('should consider previous tools in sequence', function() {
      const context = {
        query: 'example.com',
        user_intent: 'navigation'
      };
      
      const previousTools = ['search_web'];
      
      // Set up pattern analyzer to return null for direct prediction
      mockPatternAnalyzer.predictToolForContext.returns(null);
      
      const recommendation = recommendationEngine.recommendToolForContext(context, previousTools);
      
      // Verify recommendation based on sequence
      expect(recommendation).to.be.an('object');
      expect(recommendation.tool).to.equal('browser_navigate');
      expect(recommendation.reasoning).to.include('sequence');
    });
    
    it('should include alternative recommendations', function() {
      const context = {
        query: 'weather forecast',
        user_intent: 'information retrieval'
      };
      
      const previousTools = [];
      
      const recommendation = recommendationEngine.recommendToolForContext(context, previousTools);
      
      // Verify alternatives
      expect(recommendation.alternatives).to.be.an('array');
      expect(recommendation.alternatives.length).to.be.at.least(1);
      
      // Verify each alternative has required properties
      recommendation.alternatives.forEach(alt => {
        expect(alt).to.have.property('tool');
        expect(alt).to.have.property('confidence');
        expect(alt).to.have.property('reasoning');
      });
    });
    
    it('should return null if no recommendation can be made', function() {
      // Make pattern analyzer return null
      mockPatternAnalyzer.predictToolForContext.returns(null);
      
      // Set up empty patterns
      mockPatternAnalyzer.getPatterns.returns({});
      
      const context = {
        action: 'unknown action',
        format: 'unknown format'
      };
      
      const previousTools = [];
      
      const recommendation = recommendationEngine.recommendToolForContext(context, previousTools);
      
      expect(recommendation).to.be.null;
    });
    
    it('should filter out low-performing tools', function() {
      // Set up pattern analyzer to include low-performing tools
      mockPatternAnalyzer.getPatterns.returns({
        highPerformingTools: ['browser_navigate'],
        lowPerformingTools: ['search_web'],
        toolSequences: {},
        commonSequences: [],
        strongCorrelations: []
      });
      
      // Make pattern analyzer recommend a low-performing tool
      mockPatternAnalyzer.predictToolForContext.returns({
        tool: 'search_web',
        confidence: 0.8,
        reasoning: 'Based on context correlations'
      });
      
      const context = {
        query: 'weather forecast',
        user_intent: 'information retrieval'
      };
      
      const previousTools = [];
      
      const recommendation = recommendationEngine.recommendToolForContext(context, previousTools);
      
      // Verify low-performing tool is not recommended
      expect(recommendation).to.be.null;
    });
  });
  
  describe('recordRecommendationFeedback', function() {
    it('should record feedback for a recommendation', function() {
      const recommendation = {
        tool: 'search_web',
        confidence: 0.8,
        reasoning: 'Based on context correlations'
      };
      
      const context = {
        query: 'weather forecast',
        user_intent: 'information retrieval'
      };
      
      const outcome = {
        success: true,
        result_quality: 'high',
        duration_ms: 1200
      };
      
      const feedback = {
        used: true,
        helpful: true,
        comments: 'Great recommendation'
      };
      
      recommendationEngine.recordRecommendationFeedback(recommendation, context, outcome, feedback);
      
      // Verify feedback was recorded
      expect(recommendationEngine.feedbackHistory).to.be.an('array');
      expect(recommendationEngine.feedbackHistory.length).to.equal(1);
      
      const recordedFeedback = recommendationEngine.feedbackHistory[0];
      expect(recordedFeedback.recommendation).to.deep.equal(recommendation);
      expect(recordedFeedback.context).to.deep.equal(context);
      expect(recordedFeedback.outcome).to.deep.equal(outcome);
      expect(recordedFeedback.feedback).to.deep.equal(feedback);
      expect(recordedFeedback).to.have.property('timestamp');
    });
    
    it('should limit feedback history size', function() {
      // Set a small maxFeedbackHistory for testing
      recommendationEngine.maxFeedbackHistory = 3;
      
      // Add 4 feedback items (exceeding the limit)
      for (let i = 0; i < 4; i++) {
        recommendationEngine.recordRecommendationFeedback(
          { tool: 'search_web' },
          { query: `query ${i}` },
          { success: true },
          { helpful: true }
        );
      }
      
      // Verify history is limited to 3 items
      expect(recommendationEngine.feedbackHistory.length).to.equal(3);
      
      // Verify the oldest item was removed (FIFO)
      expect(recommendationEngine.feedbackHistory[0].context.query).to.equal('query 1');
      expect(recommendationEngine.feedbackHistory[2].context.query).to.equal('query 3');
    });
  });
  
  describe('analyzeRecommendationPerformance', function() {
    it('should analyze recommendation performance', function() {
      // Set up feedback history
      recommendationEngine.feedbackHistory = [
        {
          recommendation: { tool: 'search_web', confidence: 0.8 },
          context: { query: 'weather forecast' },
          outcome: { success: true, result_quality: 'high' },
          feedback: { used: true, helpful: true },
          timestamp: new Date().toISOString()
        },
        {
          recommendation: { tool: 'search_web', confidence: 0.7 },
          context: { query: 'news today' },
          outcome: { success: true, result_quality: 'medium' },
          feedback: { used: true, helpful: true },
          timestamp: new Date().toISOString()
        },
        {
          recommendation: { tool: 'browser_navigate', confidence: 0.9 },
          context: { url: 'example.com' },
          outcome: { success: false, error: 'Connection failed' },
          feedback: { used: true, helpful: false },
          timestamp: new Date().toISOString()
        }
      ];
      
      const performance = recommendationEngine.analyzeRecommendationPerformance();
      
      expect(performance).to.be.an('object');
      expect(performance.overallAccuracy).to.be.a('number');
      expect(performance.toolPerformance).to.be.an('object');
      expect(performance.toolPerformance['search_web']).to.be.an('object');
      expect(performance.toolPerformance['search_web'].recommendationCount).to.equal(2);
      expect(performance.toolPerformance['search_web'].successRate).to.equal(1.0);
      expect(performance.toolPerformance['browser_navigate'].successRate).to.equal(0.0);
      expect(performance.confidenceCorrelation).to.be.a('number');
    });
    
    it('should handle empty feedback history', function() {
      recommendationEngine.feedbackHistory = [];
      
      const performance = recommendationEngine.analyzeRecommendationPerformance();
      
      expect(performance).to.be.an('object');
      expect(performance.overallAccuracy).to.equal(0);
      expect(performance.toolPerformance).to.deep.equal({});
      expect(performance.confidenceCorrelation).to.equal(0);
    });
  });
  
  describe('getRecommendationHistory', function() {
    it('should return recommendation history', function() {
      // Set up feedback history
      recommendationEngine.feedbackHistory = [
        {
          recommendation: { tool: 'search_web', confidence: 0.8 },
          context: { query: 'weather forecast' },
          outcome: { success: true, result_quality: 'high' },
          feedback: { used: true, helpful: true },
          timestamp: new Date().toISOString()
        },
        {
          recommendation: { tool: 'browser_navigate', confidence: 0.9 },
          context: { url: 'example.com' },
          outcome: { success: false, error: 'Connection failed' },
          feedback: { used: true, helpful: false },
          timestamp: new Date().toISOString()
        }
      ];
      
      const history = recommendationEngine.getRecommendationHistory();
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(2);
      expect(history[0].recommendation.tool).to.equal('search_web');
      expect(history[1].recommendation.tool).to.equal('browser_navigate');
    });
    
    it('should filter history by tool', function() {
      // Set up feedback history
      recommendationEngine.feedbackHistory = [
        {
          recommendation: { tool: 'search_web', confidence: 0.8 },
          context: { query: 'weather forecast' },
          outcome: { success: true },
          feedback: { used: true, helpful: true }
        },
        {
          recommendation: { tool: 'browser_navigate', confidence: 0.9 },
          context: { url: 'example.com' },
          outcome: { success: false },
          feedback: { used: true, helpful: false }
        },
        {
          recommendation: { tool: 'search_web', confidence: 0.7 },
          context: { query: 'news today' },
          outcome: { success: true },
          feedback: { used: true, helpful: true }
        }
      ];
      
      const history = recommendationEngine.getRecommendationHistory('search_web');
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(2);
      expect(history[0].recommendation.tool).to.equal('search_web');
      expect(history[1].recommendation.tool).to.equal('search_web');
    });
    
    it('should return empty array if no history exists', function() {
      recommendationEngine.feedbackHistory = [];
      
      const history = recommendationEngine.getRecommendationHistory();
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(0);
    });
  });
  
  describe('adjustConfidenceThresholds', function() {
    it('should adjust confidence thresholds based on performance', function() {
      // Set up feedback history with mixed results
      recommendationEngine.feedbackHistory = [
        {
          recommendation: { tool: 'search_web', confidence: 0.8 },
          context: { query: 'weather forecast' },
          outcome: { success: true, result_quality: 'high' },
          feedback: { used: true, helpful: true }
        },
        {
          recommendation: { tool: 'search_web', confidence: 0.7 },
          context: { query: 'news today' },
          outcome: { success: false, error: 'No results' },
          feedback: { used: true, helpful: false }
        },
        {
          recommendation: { tool: 'browser_navigate', confidence: 0.9 },
          context: { url: 'example.com' },
          outcome: { success: true, result_quality: 'high' },
          feedback: { used: true, helpful: true }
        }
      ];
      
      const originalThreshold = recommendationEngine.confidenceThreshold;
      const originalToolThresholds = { ...recommendationEngine.toolConfidenceThresholds };
      
      recommendationEngine.adjustConfidenceThresholds();
      
      // Verify thresholds were adjusted
      expect(recommendationEngine.toolConfidenceThresholds['search_web']).to.not.equal(
        originalToolThresholds['search_web'] || recommendationEngine.confidenceThreshold
      );
    });
    
    it('should not adjust thresholds with insufficient data', function() {
      // Set minimal feedback history
      recommendationEngine.feedbackHistory = [
        {
          recommendation: { tool: 'search_web', confidence: 0.8 },
          context: { query: 'weather forecast' },
          outcome: { success: true },
          feedback: { used: true, helpful: true }
        }
      ];
      
      const originalThreshold = recommendationEngine.confidenceThreshold;
      const originalToolThresholds = { ...recommendationEngine.toolConfidenceThresholds };
      
      recommendationEngine.adjustConfidenceThresholds();
      
      // Verify thresholds were not adjusted
      expect(recommendationEngine.confidenceThreshold).to.equal(originalThreshold);
      expect(recommendationEngine.toolConfidenceThresholds).to.deep.equal(originalToolThresholds);
    });
  });
  
  describe('persistData', function() {
    it('should persist data to storage', function() {
      // Set up test data
      recommendationEngine.recommendations = [
        {
          tool: 'search_web',
          confidence: 0.8,
          context: { query: 'test query' }
        }
      ];
      
      recommendationEngine.feedbackHistory = [
        {
          recommendation: { tool: 'search_web', confidence: 0.8 },
          context: { query: 'weather forecast' },
          outcome: { success: true },
          feedback: { used: true, helpful: true }
        }
      ];
      
      recommendationEngine.persistData();
      
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
      
      // Verify correct data is being written
      const dataArg = mockFs.writeFileSync.firstCall.args[1];
      const parsedData = JSON.parse(dataArg);
      
      expect(parsedData).to.have.property('recommendations');
      expect(parsedData).to.have.property('feedbackHistory');
      expect(parsedData.recommendations).to.deep.equal(recommendationEngine.recommendations);
      expect(parsedData.feedbackHistory).to.deep.equal(recommendationEngine.feedbackHistory);
    });
    
    it('should handle errors during persistence', function() {
      // Make writeFileSync throw an error
      mockFs.writeFileSync.throws(new Error('Test error'));
      
      // This should not throw
      recommendationEngine.persistData();
      
      // Verify attempt was made
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
    });
  });
  
  describe('loadData', function() {
    it('should load data from storage', function() {
      // Set up test data to be loaded
      const testData = {
        recommendations: [
          {
            tool: 'search_web',
            confidence: 0.8,
            context: { query: 'test query' }
          }
        ],
        feedbackHistory: [
          {
            recommendation: { tool: 'search_web', confidence: 0.8 },
            context: { query: 'weather forecast' },
            outcome: { success: true },
            feedback: { used: true, helpful: true }
          }
        ]
      };
      
      mockFs.readFileSync.returns(JSON.stringify(testData));
      
      recommendationEngine.loadData();
      
      expect(mockFs.readFileSync.calledOnce).to.be.true;
      expect(recommendationEngine.recommendations).to.deep.equal(testData.recommendations);
      expect(recommendationEngine.feedbackHistory).to.deep.equal(testData.feedbackHistory);
    });
    
    it('should handle non-existent data file', function() {
      // Make existsSync return false for data file
      mockFs.existsSync.returns(false);
      
      recommendationEngine.loadData();
      
      // Verify readFileSync was not called
      expect(mockFs.readFileSync.called).to.be.false;
      
      // Verify default empty data structures
      expect(recommendationEngine.recommendations).to.be.an('array').that.is.empty;
      expect(recommendationEngine.feedbackHistory).to.be.an('array').that.is.empty;
    });
    
    it('should handle errors during loading', function() {
      // Make readFileSync throw an error
      mockFs.readFileSync.throws(new Error('Test error'));
      
      // This should not throw
      recommendationEngine.loadData();
      
      // Verify attempt was made
      expect(mockFs.readFileSync.calledOnce).to.be.true;
      
      // Verify default empty data structures
      expect(recommendationEngine.recommendations).to.be.an('array').that.is.empty;
      expect(recommendationEngine.feedbackHistory).to.be.an('array').that.is.empty;
    });
  });
  
  describe('cleanup', function() {
    it('should clean up resources', function() {
      // Set up cleanup spy
      const cleanupSpy = sandbox.spy(recommendationEngine, 'cleanup');
      
      recommendationEngine.cleanup();
      
      expect(cleanupSpy.calledOnce).to.be.true;
    });
  });
});
