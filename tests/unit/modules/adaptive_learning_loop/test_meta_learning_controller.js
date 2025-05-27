/**
 * Unit tests for the Meta-Learning Controller component
 * 
 * @module tests/unit/modules/adaptive_learning_loop/test_meta_learning_controller
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { MetaLearningController } = require('../../../../src/modules/adaptive_learning_loop/meta_learning_controller');

describe('Meta-Learning Controller', () => {
  let metaLearningController;
  let mockLogger;
  let mockLearningMemory;
  let mockFeedbackCollector;
  let mockPatternRecognizer;
  let mockAdaptationEngine;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      debug: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create mock learning memory
    mockLearningMemory = {
      getRecentFeedback: sinon.stub().returns([]),
      storePattern: sinon.spy(),
      storeAdaptation: sinon.spy(),
      storeMetrics: sinon.spy(),
      getAdaptation: sinon.stub().returns(null)
    };
    
    // Create mock feedback collector
    mockFeedbackCollector = {};
    
    // Create mock pattern recognizer
    mockPatternRecognizer = {
      recognizePatterns: sinon.stub().returns([])
    };
    
    // Create mock adaptation engine
    mockAdaptationEngine = {
      generateAdaptations: sinon.stub().returns([]),
      applyAdaptation: sinon.stub().returns({ success: true, timestamp: new Date().toISOString() })
    };
    
    // Create meta-learning controller instance
    metaLearningController = new MetaLearningController({
      logger: mockLogger,
      learningMemory: mockLearningMemory,
      feedbackCollector: mockFeedbackCollector,
      patternRecognizer: mockPatternRecognizer,
      adaptationEngine: mockAdaptationEngine,
      config: {
        learningRate: 0.1,
        explorationRate: 0.2,
        forgettingFactor: 0.01,
        adaptationBatchSize: 3,
        learningCycleInterval: 0, // Disable auto-cycles for testing
        minFeedbackThreshold: 10,
        maxConcurrentAdaptations: 5
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
    
    // Clean up any timers
    if (metaLearningController.cycleTimer) {
      clearInterval(metaLearningController.cycleTimer);
    }
  });
  
  describe('constructor', () => {
    it('should initialize with default config when none provided', () => {
      const defaultController = new MetaLearningController();
      expect(defaultController).to.be.an('object');
      expect(defaultController.config).to.be.an('object');
      expect(defaultController.learningState).to.be.an('object');
    });
    
    it('should initialize with provided config', () => {
      expect(metaLearningController.config.learningRate).to.equal(0.1);
      expect(metaLearningController.config.explorationRate).to.equal(0.2);
      expect(metaLearningController.config.adaptationBatchSize).to.equal(3);
    });
    
    it('should initialize learning state', () => {
      expect(metaLearningController.learningState.cycle).to.equal(0);
      expect(metaLearningController.learningState.activeAdaptations).to.be.an('object');
      expect(metaLearningController.learningState.explorationMode).to.be.false;
      expect(metaLearningController.learningState.currentLearningRate).to.equal(0.1);
    });
    
    it('should set up cycle timer if interval > 0', () => {
      const controllerWithTimer = new MetaLearningController({
        logger: mockLogger,
        config: {
          learningCycleInterval: 1000
        }
      });
      
      expect(controllerWithTimer.cycleTimer).to.not.be.undefined;
      
      // Clean up
      clearInterval(controllerWithTimer.cycleTimer);
    });
  });
  
  describe('runLearningCycle', () => {
    it('should skip cycle when insufficient feedback', () => {
      // Mock learning memory to return few feedback items
      mockLearningMemory.getRecentFeedback = sinon.stub().returns(Array(5).fill({}));
      
      const result = metaLearningController.runLearningCycle();
      
      expect(result.status).to.equal('skipped');
      expect(result.reason).to.equal('insufficient_feedback');
      expect(mockPatternRecognizer.recognizePatterns.called).to.be.false;
    });
    
    it('should complete cycle with sufficient feedback', () => {
      // Mock learning memory to return sufficient feedback
      mockLearningMemory.getRecentFeedback = sinon.stub().returns(Array(15).fill({}));
      
      // Mock pattern recognizer to return patterns
      mockPatternRecognizer.recognizePatterns = sinon.stub().returns([
        { id: '1', type: 'correlation', statistics: { significance: 0.8 } }
      ]);
      
      // Mock adaptation engine to return adaptations
      mockAdaptationEngine.generateAdaptations = sinon.stub().returns([
        { id: '1', type: 'parameter', justification: { confidence: 0.9 } }
      ]);
      
      const result = metaLearningController.runLearningCycle();
      
      expect(result.status).to.equal('completed');
      expect(result.cycle_number).to.equal(1);
      expect(result.feedback_processed).to.equal(15);
      expect(result.patterns_recognized).to.equal(1);
      expect(result.adaptations_generated).to.equal(1);
      expect(result.adaptations_applied).to.equal(1);
    });
    
    it('should handle errors during cycle', () => {
      // Mock learning memory to return sufficient feedback
      mockLearningMemory.getRecentFeedback = sinon.stub().returns(Array(15).fill({}));
      
      // Make pattern recognizer throw an error
      mockPatternRecognizer.recognizePatterns = sinon.stub().throws(new Error('Test error'));
      
      const result = metaLearningController.runLearningCycle();
      
      expect(result.status).to.equal('error');
      expect(result.error).to.equal('Test error');
    });
    
    it('should update learning state after cycle', () => {
      // Mock learning memory to return sufficient feedback
      mockLearningMemory.getRecentFeedback = sinon.stub().returns(Array(15).fill({}));
      
      // Mock pattern recognizer to return patterns
      mockPatternRecognizer.recognizePatterns = sinon.stub().returns([
        { id: '1', type: 'correlation', statistics: { significance: 0.8 } }
      ]);
      
      // Mock adaptation engine to return adaptations
      mockAdaptationEngine.generateAdaptations = sinon.stub().returns([
        { id: '1', type: 'parameter', justification: { confidence: 0.9 } }
      ]);
      
      metaLearningController.runLearningCycle();
      
      expect(metaLearningController.learningState.cycle).to.equal(1);
      expect(metaLearningController.learningState.lastCycleTime).to.be.a('string');
      expect(metaLearningController.learningState.performanceHistory.length).to.equal(1);
    });
  });
  
  describe('collectRecentFeedback', () => {
    it('should return empty array when learning memory is not available', () => {
      // Create controller without learning memory
      const controllerWithoutMemory = new MetaLearningController({
        logger: mockLogger
      });
      
      const result = controllerWithoutMemory.collectRecentFeedback();
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
    
    it('should get recent feedback from learning memory', () => {
      // Mock learning memory to return feedback
      mockLearningMemory.getRecentFeedback = sinon.stub().returns([
        { id: '1', source: { type: 'user' } },
        { id: '2', source: { type: 'system' } }
      ]);
      
      const result = metaLearningController.collectRecentFeedback();
      
      expect(result.length).to.equal(2);
      expect(mockLearningMemory.getRecentFeedback.calledOnce).to.be.true;
    });
  });
  
  describe('recognizePatterns', () => {
    it('should return empty array when pattern recognizer is not available', () => {
      // Create controller without pattern recognizer
      const controllerWithoutRecognizer = new MetaLearningController({
        logger: mockLogger
      });
      
      const result = controllerWithoutRecognizer.recognizePatterns([]);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
    
    it('should recognize patterns from feedback', () => {
      // Mock pattern recognizer to return patterns
      mockPatternRecognizer.recognizePatterns = sinon.stub().returns([
        { id: '1', type: 'correlation', statistics: { significance: 0.8 } }
      ]);
      
      const feedbackItems = [
        { id: '1', source: { type: 'user' } },
        { id: '2', source: { type: 'system' } }
      ];
      
      const result = metaLearningController.recognizePatterns(feedbackItems, {});
      
      expect(result.length).to.equal(1);
      expect(mockPatternRecognizer.recognizePatterns.calledOnce).to.be.true;
      expect(mockPatternRecognizer.recognizePatterns.firstCall.args[0]).to.equal(feedbackItems);
    });
    
    it('should store patterns in learning memory', () => {
      // Mock pattern recognizer to return patterns
      mockPatternRecognizer.recognizePatterns = sinon.stub().returns([
        { id: '1', type: 'correlation', statistics: { significance: 0.8 } }
      ]);
      
      const feedbackItems = [
        { id: '1', source: { type: 'user' } }
      ];
      
      metaLearningController.recognizePatterns(feedbackItems, {});
      
      expect(mockLearningMemory.storePattern.calledOnce).to.be.true;
    });
    
    it('should pass exploration mode to pattern recognizer', () => {
      // Set exploration mode
      metaLearningController.learningState.explorationMode = true;
      
      // Mock pattern recognizer
      mockPatternRecognizer.recognizePatterns = sinon.stub().returns([]);
      
      const feedbackItems = [
        { id: '1', source: { type: 'user' } }
      ];
      
      metaLearningController.recognizePatterns(feedbackItems, {});
      
      expect(mockPatternRecognizer.recognizePatterns.firstCall.args[1].explorationMode).to.be.true;
    });
  });
  
  describe('generateAdaptations', () => {
    it('should return empty array when adaptation engine is not available', () => {
      // Create controller without adaptation engine
      const controllerWithoutEngine = new MetaLearningController({
        logger: mockLogger
      });
      
      const result = controllerWithoutEngine.generateAdaptations([]);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
    
    it('should generate adaptations from patterns', () => {
      // Mock adaptation engine to return adaptations
      mockAdaptationEngine.generateAdaptations = sinon.stub().returns([
        { id: '1', type: 'parameter', justification: { confidence: 0.9 } }
      ]);
      
      const patterns = [
        { id: '1', type: 'correlation', statistics: { significance: 0.8 } }
      ];
      
      const result = metaLearningController.generateAdaptations(patterns, {});
      
      expect(result.length).to.equal(1);
      expect(mockAdaptationEngine.generateAdaptations.calledOnce).to.be.true;
      expect(mockAdaptationEngine.generateAdaptations.firstCall.args[0]).to.equal(patterns);
    });
    
    it('should store adaptations in learning memory', () => {
      // Mock adaptation engine to return adaptations
      mockAdaptationEngine.generateAdaptations = sinon.stub().returns([
        { id: '1', type: 'parameter', justification: { confidence: 0.9 } }
      ]);
      
      const patterns = [
        { id: '1', type: 'correlation', statistics: { significance: 0.8 } }
      ];
      
      metaLearningController.generateAdaptations(patterns, {});
      
      expect(mockLearningMemory.storeAdaptation.calledOnce).to.be.true;
    });
  });
  
  describe('applyAdaptations', () => {
    it('should apply adaptations', () => {
      // Mock adaptation engine
      mockAdaptationEngine.applyAdaptation = sinon.stub().returns({ 
        success: true, 
        timestamp: new Date().toISOString() 
      });
      
      const adaptations = [
        { id: '1', type: 'parameter', justification: { confidence: 0.9 } }
      ];
      
      const result = metaLearningController.applyAdaptations(adaptations, {});
      
      expect(result.length).to.equal(1);
      expect(mockAdaptationEngine.applyAdaptation.calledOnce).to.be.true;
      expect(metaLearningController.learningState.activeAdaptations.has('1')).to.be.true;
    });
    
    it('should respect maximum concurrent adaptations limit', () => {
      // Add max adaptations to active set
      for (let i = 0; i < metaLearningController.config.maxConcurrentAdaptations; i++) {
        metaLearningController.learningState.activeAdaptations.add(`existing_${i}`);
      }
      
      const adaptations = [
        { id: 'new_1', type: 'parameter', justification: { confidence: 0.9 } }
      ];
      
      const result = metaLearningController.applyAdaptations(adaptations, {});
      
      expect(result.length).to.equal(0);
      expect(mockAdaptationEngine.applyAdaptation.called).to.be.false;
    });
    
    it('should sort adaptations by confidence', () => {
      // Mock adaptation engine
      mockAdaptationEngine.applyAdaptation = sinon.stub().returns({ 
        success: true, 
        timestamp: new Date().toISOString() 
      });
      
      const adaptations = [
        { id: '1', type: 'parameter', justification: { confidence: 0.7 } },
        { id: '2', type: 'parameter', justification: { confidence: 0.9 } },
        { id: '3', type: 'parameter', justification: { confidence: 0.8 } }
      ];
      
      metaLearningController.applyAdaptations(adaptations, {});
      
      // Should apply highest confidence first
      expect(mockAdaptationEngine.applyAdaptation.firstCall.args[0].id).to.equal('2');
    });
    
    it('should limit number of adaptations to batch size', () => {
      // Mock adaptation engine
      mockAdaptationEngine.applyAdaptation = sinon.stub().returns({ 
        success: true, 
        timestamp: new Date().toISOString() 
      });
      
      // Create more adaptations than batch size
      const adaptations = [];
      for (let i = 0; i < metaLearningController.config.adaptationBatchSize + 2; i++) {
        adaptations.push({ 
          id: `${i}`, 
          type: 'parameter', 
          justification: { confidence: 0.9 - (i * 0.01) } 
        });
      }
      
      metaLearningController.applyAdaptations(adaptations, {});
      
      expect(mockAdaptationEngine.applyAdaptation.callCount).to.equal(metaLearningController.config.adaptationBatchSize);
    });
    
    it('should handle adaptation application failures', () => {
      // Mock adaptation engine to fail
      mockAdaptationEngine.applyAdaptation = sinon.stub().returns({ 
        success: false, 
        error: 'Application failed',
        timestamp: new Date().toISOString() 
      });
      
      const adaptations = [
        { id: '1', type: 'parameter', justification: { confidence: 0.9 } }
      ];
      
      const result = metaLearningController.applyAdaptations(adaptations, {});
      
      expect(result.length).to.equal(0);
      expect(metaLearningController.learningState.activeAdaptations.has('1')).to.be.false;
    });
  });
  
  describe('updateLearningParameters', () => {
    it('should update learning parameters based on cycle results', () => {
      const cycleResults = {
        cycle_number: 1,
        patterns_recognized: 5,
        adaptations_applied: 3,
        start_time: new Date().toISOString()
      };
      
      const initialLearningRate = metaLearningController.learningState.currentLearningRate;
      const initialExplorationMode = metaLearningController.learningState.explorationMode;
      
      metaLearningController.updateLearningParameters(cycleResults);
      
      expect(metaLearningController.learningState.performanceHistory.length).to.equal(1);
      
      // Learning rate and exploration mode might change, but we can't predict exactly how
      // due to randomness in exploration mode determination
    });
    
    it('should calculate cycle performance', () => {
      const cycleResults = {
        patterns_recognized: 5,
        adaptations_applied: 3
      };
      
      const performance = metaLearningController.calculateCyclePerformance(cycleResults);
      
      expect(performance).to.be.a('number');
      expect(performance).to.be.at.least(0);
      expect(performance).to.be.at.most(1);
    });
  });
  
  describe('updateExplorationMode', () => {
    it('should stay in exploitation mode with less than 3 cycles', () => {
      // Initial state
      metaLearningController.learningState.explorationMode = false;
      
      // Add 2 performance records
      metaLearningController.learningState.performanceHistory = [
        { cycle: 1, performance: 0.7 },
        { cycle: 2, performance: 0.8 }
      ];
      
      metaLearningController.updateExplorationMode();
      
      expect(metaLearningController.learningState.explorationMode).to.be.false;
    });
    
    it('should consider switching to exploration with decreasing performance', () => {
      // Mock Math.random to return 0 (will choose exploration)
      sinon.stub(Math, 'random').returns(0);
      
      // Add 3 performance records with decreasing trend
      metaLearningController.learningState.performanceHistory = [
        { cycle: 1, performance: 0.8 },
        { cycle: 2, performance: 0.7 },
        { cycle: 3, performance: 0.6 }
      ];
      
      metaLearningController.updateExplorationMode();
      
      expect(metaLearningController.learningState.explorationMode).to.be.true;
    });
    
    it('should consider staying in exploitation with increasing performance', () => {
      // Mock Math.random to return 0 (will choose exploitation)
      sinon.stub(Math, 'random').returns(0);
      
      // Add 3 performance records with increasing trend
      metaLearningController.learningState.performanceHistory = [
        { cycle: 1, performance: 0.6 },
        { cycle: 2, performance: 0.7 },
        { cycle: 3, performance: 0.8 }
      ];
      
      metaLearningController.updateExplorationMode();
      
      expect(metaLearningController.learningState.explorationMode).to.be.false;
    });
  });
  
  describe('updateLearningRate', () => {
    it('should increase learning rate for good performance', () => {
      const initialRate = metaLearningController.learningState.currentLearningRate;
      
      metaLearningController.updateLearningRate(0.8); // Good performance
      
      expect(metaLearningController.learningState.currentLearningRate).to.be.above(initialRate);
    });
    
    it('should decrease learning rate for poor performance', () => {
      const initialRate = metaLearningController.learningState.currentLearningRate;
      
      metaLearningController.updateLearningRate(0.2); // Poor performance
      
      expect(metaLearningController.learningState.currentLearningRate).to.be.below(initialRate);
    });
    
    it('should use higher learning rate in exploration mode', () => {
      // Set exploration mode
      metaLearningController.learningState.explorationMode = true;
      
      const initialRate = metaLearningController.learningState.currentLearningRate;
      
      metaLearningController.updateLearningRate(0.5); // Neutral performance
      
      expect(metaLearningController.learningState.currentLearningRate).to.be.above(initialRate);
    });
  });
  
  describe('calculateTrend', () => {
    it('should calculate positive trend', () => {
      const values = [0.5, 0.6, 0.7, 0.8];
      
      const trend = metaLearningController.calculateTrend(values);
      
      expect(trend).to.be.above(0);
    });
    
    it('should calculate negative trend', () => {
      const values = [0.8, 0.7, 0.6, 0.5];
      
      const trend = metaLearningController.calculateTrend(values);
      
      expect(trend).to.be.below(0);
    });
    
    it('should calculate flat trend', () => {
      const values = [0.5, 0.5, 0.5, 0.5];
      
      const trend = metaLearningController.calculateTrend(values);
      
      expect(trend).to.equal(0);
    });
    
    it('should return 0 for single value', () => {
      const values = [0.5];
      
      const trend = metaLearningController.calculateTrend(values);
      
      expect(trend).to.equal(0);
    });
  });
  
  describe('manageMemory', () => {
    it('should check active adaptations', () => {
      // Add an adaptation to active set
      metaLearningController.learningState.activeAdaptations.add('1');
      
      // Mock learning memory to return adaptation
      mockLearningMemory.getAdaptation = sinon.stub().returns({
        id: '1',
        status: 'applied'
      });
      
      metaLearningController.manageMemory();
      
      expect(mockLearningMemory.getAdaptation.calledOnce).to.be.true;
      expect(metaLearningController.learningState.activeAdaptations.has('1')).to.be.true;
    });
    
    it('should remove inactive adaptations', () => {
      // Add an adaptation to active set
      metaLearningController.learningState.activeAdaptations.add('1');
      
      // Mock learning memory to return adaptation with non-applied status
      mockLearningMemory.getAdaptation = sinon.stub().returns({
        id: '1',
        status: 'completed'
      });
      
      metaLearningController.manageMemory();
      
      expect(mockLearningMemory.getAdaptation.calledOnce).to.be.true;
      expect(metaLearningController.learningState.activeAdaptations.has('1')).to.be.false;
    });
    
    it('should remove non-existent adaptations', () => {
      // Add an adaptation to active set
      metaLearningController.learningState.activeAdaptations.add('1');
      
      // Mock learning memory to return null (adaptation doesn't exist)
      mockLearningMemory.getAdaptation = sinon.stub().returns(null);
      
      metaLearningController.manageMemory();
      
      expect(mockLearningMemory.getAdaptation.calledOnce).to.be.true;
      expect(metaLearningController.learningState.activeAdaptations.has('1')).to.be.false;
    });
  });
  
  describe('finalizeCycle', () => {
    it('should add final metrics to cycle results', () => {
      const cycleResults = {
        id: '123',
        cycle_number: 1,
        start_time: new Date(Date.now() - 1000).toISOString() // 1 second ago
      };
      
      // Add an active adaptation
      metaLearningController.learningState.activeAdaptations.add('1');
      
      const result = metaLearningController.finalizeCycle(cycleResults);
      
      expect(result.end_time).to.be.a('string');
      expect(result.duration_ms).to.be.above(0);
      expect(result.active_adaptations).to.equal(1);
    });
    
    it('should store metrics in learning memory', () => {
      const cycleResults = {
        id: '123',
        cycle_number: 1,
        start_time: new Date().toISOString()
      };
      
      metaLearningController.finalizeCycle(cycleResults);
      
      expect(mockLearningMemory.storeMetrics.calledOnce).to.be.true;
      expect(mockLearningMemory.storeMetrics.firstCall.args[0].cycle_id).to.equal('123');
    });
  });
  
  describe('getLearningState', () => {
    it('should return current learning state', () => {
      // Add an active adaptation
      metaLearningController.learningState.activeAdaptations.add('1');
      
      const state = metaLearningController.getLearningState();
      
      expect(state.cycle).to.equal(0);
      expect(state.activeAdaptations).to.be.an('array');
      expect(state.activeAdaptations).to.deep.equal(['1']);
      expect(state.explorationMode).to.be.false;
      expect(state.currentLearningRate).to.equal(0.1);
    });
  });
  
  describe('getLearningMetrics', () => {
    it('should return metrics from learning memory when available', () => {
      // Mock learning memory to return metrics
      mockLearningMemory.getLearningMetrics = sinon.stub().returns({
        cycles: 5,
        patterns: 10,
        adaptations: 8
      });
      
      const metrics = metaLearningController.getLearningMetrics();
      
      expect(metrics.cycles).to.equal(5);
      expect(metrics.patterns).to.equal(10);
      expect(metrics.adaptations).to.equal(8);
    });
    
    it('should return basic metrics when learning memory not available', () => {
      // Create controller without learning memory
      const controllerWithoutMemory = new MetaLearningController({
        logger: mockLogger
      });
      
      const metrics = controllerWithoutMemory.getLearningMetrics();
      
      expect(metrics.cycles).to.equal(0);
      expect(metrics.active_adaptations).to.equal(0);
      expect(metrics.exploration_mode).to.be.false;
    });
  });
  
  describe('cleanup', () => {
    it('should clean up resources', () => {
      // Create controller with timer
      const controllerWithTimer = new MetaLearningController({
        logger: mockLogger,
        config: {
          learningCycleInterval: 1000
        }
      });
      
      expect(controllerWithTimer.cycleTimer).to.not.be.undefined;
      
      controllerWithTimer.cleanup();
      
      expect(controllerWithTimer.cycleTimer).to.be.undefined;
    });
  });
});
