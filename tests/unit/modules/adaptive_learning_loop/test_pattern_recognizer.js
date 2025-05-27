/**
 * Unit tests for the Pattern Recognizer component
 * 
 * @module tests/unit/modules/adaptive_learning_loop/test_pattern_recognizer
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { PatternRecognizer } = require('../../../../src/modules/adaptive_learning_loop/pattern_recognizer');

describe('Pattern Recognizer', () => {
  let patternRecognizer;
  let mockLogger;
  let mockLearningMemory;
  
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
      storePattern: sinon.spy()
    };
    
    // Create pattern recognizer instance
    patternRecognizer = new PatternRecognizer({
      logger: mockLogger,
      learningMemory: mockLearningMemory,
      config: {
        minSupportThreshold: 3,
        minConfidenceThreshold: 0.6,
        significanceThreshold: 0.7,
        temporalDecayFactor: 0.9,
        maxPatternElements: 5
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default config when none provided', () => {
      const defaultRecognizer = new PatternRecognizer();
      expect(defaultRecognizer).to.be.an('object');
      expect(defaultRecognizer.config).to.be.an('object');
      expect(defaultRecognizer.analyzers).to.be.an('object');
    });
    
    it('should initialize with provided config', () => {
      expect(patternRecognizer.config.minSupportThreshold).to.equal(3);
      expect(patternRecognizer.config.minConfidenceThreshold).to.equal(0.6);
      expect(patternRecognizer.config.significanceThreshold).to.equal(0.7);
    });
    
    it('should initialize analyzers', () => {
      expect(patternRecognizer.analyzers).to.have.keys(['correlation', 'causal', 'temporal', 'contextual']);
    });
  });
  
  describe('recognizePatterns', () => {
    it('should return empty array for empty feedback', () => {
      const result = patternRecognizer.recognizePatterns([]);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
    
    it('should run all analyzers by default', () => {
      const analyzerSpies = {
        correlation: sinon.spy(patternRecognizer.analyzers, 'correlation'),
        causal: sinon.spy(patternRecognizer.analyzers, 'causal'),
        temporal: sinon.spy(patternRecognizer.analyzers, 'temporal'),
        contextual: sinon.spy(patternRecognizer.analyzers, 'contextual')
      };
      
      const feedbackItems = [
        { id: '1', source: { type: 'user' }, content: { text: 'Feedback' } }
      ];
      
      patternRecognizer.recognizePatterns(feedbackItems);
      
      expect(analyzerSpies.correlation.calledOnce).to.be.true;
      expect(analyzerSpies.causal.calledOnce).to.be.true;
      expect(analyzerSpies.temporal.calledOnce).to.be.true;
      expect(analyzerSpies.contextual.calledOnce).to.be.true;
    });
    
    it('should run only specified analyzers', () => {
      const analyzerSpies = {
        correlation: sinon.spy(patternRecognizer.analyzers, 'correlation'),
        causal: sinon.spy(patternRecognizer.analyzers, 'causal'),
        temporal: sinon.spy(patternRecognizer.analyzers, 'temporal'),
        contextual: sinon.spy(patternRecognizer.analyzers, 'contextual')
      };
      
      const feedbackItems = [
        { id: '1', source: { type: 'user' }, content: { text: 'Feedback' } }
      ];
      
      patternRecognizer.recognizePatterns(feedbackItems, { analyzerTypes: ['correlation', 'causal'] });
      
      expect(analyzerSpies.correlation.calledOnce).to.be.true;
      expect(analyzerSpies.causal.calledOnce).to.be.true;
      expect(analyzerSpies.temporal.called).to.be.false;
      expect(analyzerSpies.contextual.called).to.be.false;
    });
    
    it('should handle analyzer errors gracefully', () => {
      // Make one analyzer throw an error
      patternRecognizer.analyzers.correlation = () => {
        throw new Error('Test error');
      };
      
      const feedbackItems = [
        { id: '1', source: { type: 'user' }, content: { text: 'Feedback' } }
      ];
      
      // Should not throw
      const result = patternRecognizer.recognizePatterns(feedbackItems);
      
      expect(result).to.be.an('array');
      expect(mockLogger.error.called).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.include('Error in correlation analyzer');
    });
    
    it('should filter patterns by significance threshold', () => {
      // Mock analyzers to return patterns with different significance
      patternRecognizer.analyzers = {
        correlation: () => [
          { id: '1', statistics: { significance: 0.8 } },
          { id: '2', statistics: { significance: 0.6 } }
        ]
      };
      
      const feedbackItems = [
        { id: '1', source: { type: 'user' }, content: { text: 'Feedback' } }
      ];
      
      const result = patternRecognizer.recognizePatterns(feedbackItems);
      
      expect(result.length).to.equal(1);
      expect(result[0].id).to.equal('1');
    });
    
    it('should deduplicate patterns', () => {
      // Mock analyzers to return duplicate patterns
      patternRecognizer.analyzers = {
        correlation: () => [
          { 
            id: '1', 
            type: 'correlation',
            elements: [{ factor: 'test', value: 'value' }],
            outcome: { factor: 'result', value: 'success' },
            statistics: { significance: 0.8 } 
          }
        ],
        causal: () => [
          { 
            id: '2', 
            type: 'correlation',
            elements: [{ factor: 'test', value: 'value' }],
            outcome: { factor: 'result', value: 'success' },
            statistics: { significance: 0.9 } 
          }
        ]
      };
      
      const feedbackItems = [
        { id: '1', source: { type: 'user' }, content: { text: 'Feedback' } }
      ];
      
      const result = patternRecognizer.recognizePatterns(feedbackItems);
      
      expect(result.length).to.equal(1);
      expect(result[0].id).to.equal('2'); // Should keep the one with higher significance
    });
  });
  
  describe('analyzeCorrelationPatterns', () => {
    it('should identify correlation patterns', () => {
      // Create feedback items with correlation
      const feedbackItems = [];
      
      // Add feedback with context property 'feature_x' = 'enabled'
      for (let i = 0; i < 5; i++) {
        feedbackItems.push({
          id: `success_${i}`,
          source: { type: 'outcome' },
          content: { 
            outcome: { success: true } 
          },
          context: { 
            feature_x: 'enabled' 
          }
        });
      }
      
      // Add feedback with context property 'feature_x' = 'disabled'
      for (let i = 0; i < 5; i++) {
        feedbackItems.push({
          id: `failure_${i}`,
          source: { type: 'outcome' },
          content: { 
            outcome: { success: false } 
          },
          context: { 
            feature_x: 'disabled' 
          }
        });
      }
      
      const result = patternRecognizer.analyzeCorrelationPatterns(feedbackItems);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
      
      // Check pattern properties
      const pattern = result.find(p => p.elements[0].factor === 'feature_x' && p.elements[0].value === 'enabled');
      expect(pattern).to.not.be.undefined;
      expect(pattern.type).to.equal('correlation');
      expect(pattern.outcome.factor).to.equal('result');
      expect(pattern.outcome.value).to.equal('success');
      expect(pattern.statistics.confidence).to.be.above(0.5);
    });
    
    it('should ignore groups with insufficient support', () => {
      // Create feedback items with insufficient support
      const feedbackItems = [];
      
      // Add only 2 feedback items (below minSupportThreshold of 3)
      for (let i = 0; i < 2; i++) {
        feedbackItems.push({
          id: `success_${i}`,
          source: { type: 'outcome' },
          content: { 
            outcome: { success: true } 
          },
          context: { 
            feature_x: 'enabled' 
          }
        });
      }
      
      const result = patternRecognizer.analyzeCorrelationPatterns(feedbackItems);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
  });
  
  describe('analyzeCausalPatterns', () => {
    it('should identify causal patterns', () => {
      // Create feedback items with causal relationship
      const feedbackItems = [];
      
      // Create 5 decision groups with action -> outcome
      for (let i = 0; i < 5; i++) {
        // Action feedback
        feedbackItems.push({
          id: `action_${i}`,
          timestamp: new Date(2023, 0, i, 10, 0).toISOString(),
          source: { type: 'system' },
          content: { 
            action: { type: 'use_tool', target: 'tool_x' }
          },
          context: { 
            decision_id: `decision_${i}`
          }
        });
        
        // Outcome feedback (success)
        feedbackItems.push({
          id: `outcome_${i}`,
          timestamp: new Date(2023, 0, i, 10, 5).toISOString(),
          source: { type: 'outcome' },
          content: { 
            outcome: { success: true }
          },
          context: { 
            decision_id: `decision_${i}`
          }
        });
      }
      
      const result = patternRecognizer.analyzeCausalPatterns(feedbackItems);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
      
      // Check pattern properties
      const pattern = result.find(p => p.elements[0].factor.includes('action') || p.elements[0].factor.includes('tool'));
      expect(pattern).to.not.be.undefined;
      expect(pattern.type).to.equal('causal');
      expect(pattern.statistics.confidence).to.be.above(0);
    });
    
    it('should handle missing action or outcome feedback', () => {
      // Create feedback items with missing components
      const feedbackItems = [];
      
      // Only action feedback, no outcome
      feedbackItems.push({
        id: 'action_1',
        timestamp: new Date(2023, 0, 1, 10, 0).toISOString(),
        source: { type: 'system' },
        content: { 
          action: { type: 'use_tool', target: 'tool_x' }
        },
        context: { 
          decision_id: 'decision_1'
        }
      });
      
      // Only outcome feedback, no action
      feedbackItems.push({
        id: 'outcome_2',
        timestamp: new Date(2023, 0, 2, 10, 5).toISOString(),
        source: { type: 'outcome' },
        content: { 
          outcome: { success: true }
        },
        context: { 
          decision_id: 'decision_2'
        }
      });
      
      const result = patternRecognizer.analyzeCausalPatterns(feedbackItems);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
  });
  
  describe('analyzeTemporalPatterns', () => {
    it('should identify temporal trends', () => {
      // Create feedback items with temporal trend
      const feedbackItems = [];
      
      // Create feedback with increasing success rate over time
      for (let i = 0; i < 10; i++) {
        // Success rate increases over time
        const successCount = Math.min(10, Math.floor(i * 0.7) + 3);
        const failureCount = 10 - successCount;
        
        // Add success feedback
        for (let j = 0; j < successCount; j++) {
          feedbackItems.push({
            id: `success_${i}_${j}`,
            timestamp: new Date(2023, 0, i, 10, j).toISOString(),
            source: { type: 'outcome' },
            content: { 
              outcome: { success: true }
            }
          });
        }
        
        // Add failure feedback
        for (let j = 0; j < failureCount; j++) {
          feedbackItems.push({
            id: `failure_${i}_${j}`,
            timestamp: new Date(2023, 0, i, 10, j + 10).toISOString(),
            source: { type: 'outcome' },
            content: { 
              outcome: { success: false }
            }
          });
        }
      }
      
      const result = patternRecognizer.analyzeTemporalPatterns(feedbackItems);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
      
      // Check pattern properties
      const pattern = result.find(p => p.elements[0].factor === 'time_trend');
      expect(pattern).to.not.be.undefined;
      expect(pattern.type).to.equal('temporal');
      expect(pattern.statistics.confidence).to.be.above(0);
    });
    
    it('should handle insufficient time windows', () => {
      // Create feedback items with only 2 time windows (insufficient for trend)
      const feedbackItems = [];
      
      // Add feedback for 2 time windows
      for (let i = 0; i < 2; i++) {
        feedbackItems.push({
          id: `feedback_${i}`,
          timestamp: new Date(2023, 0, i, 10, 0).toISOString(),
          source: { type: 'outcome' },
          content: { 
            outcome: { success: true }
          }
        });
      }
      
      const result = patternRecognizer.analyzeTemporalPatterns(feedbackItems);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
  });
  
  describe('analyzeContextualPatterns', () => {
    it('should identify contextual patterns', () => {
      // Create feedback items with contextual patterns
      const feedbackItems = [];
      
      // Add feedback with multiple context properties
      for (let i = 0; i < 5; i++) {
        feedbackItems.push({
          id: `success_${i}`,
          source: { type: 'outcome' },
          content: { 
            outcome: { success: true } 
          },
          context: { 
            feature_x: 'enabled',
            user_type: 'premium',
            device: 'mobile'
          }
        });
      }
      
      // Add feedback with different context
      for (let i = 0; i < 5; i++) {
        feedbackItems.push({
          id: `failure_${i}`,
          source: { type: 'outcome' },
          content: { 
            outcome: { success: false } 
          },
          context: { 
            feature_x: 'disabled',
            user_type: 'free',
            device: 'desktop'
          }
        });
      }
      
      const result = patternRecognizer.analyzeContextualPatterns(feedbackItems);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
      
      // Check pattern properties
      const pattern = result.find(p => p.elements.length > 1);
      expect(pattern).to.not.be.undefined;
      expect(pattern.type).to.equal('contextual');
      expect(pattern.elements.length).to.be.at.least(2);
      expect(pattern.statistics.confidence).to.be.above(0.5);
    });
    
    it('should respect maxPatternElements config', () => {
      // Create feedback with many context properties
      const feedbackItems = [];
      
      // Add feedback with 6 context properties
      for (let i = 0; i < 5; i++) {
        feedbackItems.push({
          id: `success_${i}`,
          source: { type: 'outcome' },
          content: { 
            outcome: { success: true } 
          },
          context: { 
            prop1: 'value1',
            prop2: 'value2',
            prop3: 'value3',
            prop4: 'value4',
            prop5: 'value5',
            prop6: 'value6'
          }
        });
      }
      
      const result = patternRecognizer.analyzeContextualPatterns(feedbackItems);
      
      // Check that no pattern has more than maxPatternElements
      const maxElements = patternRecognizer.config.maxPatternElements;
      const allValid = result.every(p => p.elements.length <= maxElements);
      
      expect(allValid).to.be.true;
    });
  });
  
  describe('calculateOutcomeDistribution', () => {
    it('should calculate distribution from explicit outcomes', () => {
      const feedbackItems = [
        {
          content: { outcome: { success: true } }
        },
        {
          content: { outcome: { success: true } }
        },
        {
          content: { outcome: { success: false } }
        }
      ];
      
      const result = patternRecognizer.calculateOutcomeDistribution(feedbackItems);
      
      expect(result.success.count).to.equal(2);
      expect(result.failure.count).to.equal(1);
      expect(result.neutral.count).to.equal(0);
      expect(result.success.percentage).to.equal(2/3);
      expect(result.failure.percentage).to.equal(1/3);
    });
    
    it('should infer outcomes from ratings', () => {
      const feedbackItems = [
        {
          content: { rating: 5 }
        },
        {
          content: { rating: 1 }
        },
        {
          content: { rating: 3 }
        }
      ];
      
      const result = patternRecognizer.calculateOutcomeDistribution(feedbackItems);
      
      expect(result.success.count).to.equal(1);
      expect(result.failure.count).to.equal(1);
      expect(result.neutral.count).to.equal(1);
    });
    
    it('should infer outcomes from sentiment', () => {
      const feedbackItems = [
        {
          content: { sentiment: { positive: true, negative: false } }
        },
        {
          content: { sentiment: { positive: false, negative: true } }
        },
        {
          content: { sentiment: { positive: false, negative: false, neutral: true } }
        }
      ];
      
      const result = patternRecognizer.calculateOutcomeDistribution(feedbackItems);
      
      expect(result.success.count).to.equal(1);
      expect(result.failure.count).to.equal(1);
      expect(result.neutral.count).to.equal(1);
    });
  });
  
  describe('determineOutcomeDesirability', () => {
    it('should determine desirability for success outcomes', () => {
      expect(patternRecognizer.determineOutcomeDesirability('success', true)).to.equal(1.0);
      expect(patternRecognizer.determineOutcomeDesirability('result', 'success')).to.equal(1.0);
      expect(patternRecognizer.determineOutcomeDesirability('success', false)).to.equal(0.0);
      expect(patternRecognizer.determineOutcomeDesirability('result', 'failure')).to.equal(0.0);
    });
    
    it('should determine desirability for rate outcomes', () => {
      expect(patternRecognizer.determineOutcomeDesirability('success_rate', 'increasing')).to.equal(1.0);
      expect(patternRecognizer.determineOutcomeDesirability('success_rate', 'decreasing')).to.equal(0.0);
      expect(patternRecognizer.determineOutcomeDesirability('failure_rate', 'increasing')).to.equal(0.0);
      expect(patternRecognizer.determineOutcomeDesirability('failure_rate', 'decreasing')).to.equal(1.0);
    });
    
    it('should determine desirability for quality outcomes', () => {
      expect(patternRecognizer.determineOutcomeDesirability('quality', 0.8)).to.equal(0.8);
      expect(patternRecognizer.determineOutcomeDesirability('output_quality', 'high')).to.equal(1.0);
      expect(patternRecognizer.determineOutcomeDesirability('quality', 'low')).to.equal(0.0);
    });
    
    it('should default to neutral for unknown factors', () => {
      expect(patternRecognizer.determineOutcomeDesirability('unknown', 'value')).to.equal(0.5);
    });
  });
  
  describe('calculateSignificance', () => {
    it('should calculate significance based on confidence and support', () => {
      const significance = patternRecognizer.calculateSignificance(0.8, 10);
      
      expect(significance).to.be.above(0.5);
      expect(significance).to.be.at.most(1.0);
    });
    
    it('should handle minimum support threshold', () => {
      const minThreshold = patternRecognizer.config.minSupportThreshold;
      
      // At threshold
      const sig1 = patternRecognizer.calculateSignificance(0.8, minThreshold);
      
      // Above threshold
      const sig2 = patternRecognizer.calculateSignificance(0.8, minThreshold + 5);
      
      expect(sig2).to.be.above(sig1);
    });
    
    it('should cap significance at 1.0', () => {
      const significance = patternRecognizer.calculateSignificance(1.0, 100);
      
      expect(significance).to.equal(1.0);
    });
  });
  
  describe('deduplicatePatterns', () => {
    it('should remove duplicate patterns', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        },
        { 
          id: '2', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.9 } 
        }
      ];
      
      const result = patternRecognizer.deduplicatePatterns(patterns);
      
      expect(result.length).to.equal(1);
      expect(result[0].id).to.equal('2'); // Should keep the one with higher significance
    });
    
    it('should keep patterns with different types', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        },
        { 
          id: '2', 
          type: 'causal',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.9 } 
        }
      ];
      
      const result = patternRecognizer.deduplicatePatterns(patterns);
      
      expect(result.length).to.equal(2);
    });
    
    it('should keep patterns with different elements', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test1', value: 'value1' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        },
        { 
          id: '2', 
          type: 'correlation',
          elements: [{ factor: 'test2', value: 'value2' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.9 } 
        }
      ];
      
      const result = patternRecognizer.deduplicatePatterns(patterns);
      
      expect(result.length).to.equal(2);
    });
    
    it('should keep patterns with different outcomes', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        },
        { 
          id: '2', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'failure' },
          statistics: { significance: 0.9 } 
        }
      ];
      
      const result = patternRecognizer.deduplicatePatterns(patterns);
      
      expect(result.length).to.equal(2);
    });
  });
});
