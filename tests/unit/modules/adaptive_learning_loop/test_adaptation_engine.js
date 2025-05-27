/**
 * Unit tests for the Adaptation Engine component
 * 
 * @module tests/unit/modules/adaptive_learning_loop/test_adaptation_engine
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { AdaptationEngine } = require('../../../../src/modules/adaptive_learning_loop/adaptation_engine');

describe('Adaptation Engine', () => {
  let adaptationEngine;
  let mockLogger;
  let mockLearningMemory;
  let mockPrismObserver;
  let mockVigilObserver;
  
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
      storeAdaptation: sinon.spy(adaptation => adaptation),
      updateAdaptation: sinon.spy(adaptation => adaptation)
    };
    
    // Create mock PRISM observer
    mockPrismObserver = {
      verifyBeliefTrace: sinon.stub().returns({ verified: true, confidence: 0.9 })
    };
    
    // Create mock VIGIL observer
    mockVigilObserver = {
      assessTrustImplications: sinon.stub().returns({ trustworthy: true, score: 0.85 })
    };
    
    // Create adaptation engine instance
    adaptationEngine = new AdaptationEngine({
      logger: mockLogger,
      learningMemory: mockLearningMemory,
      prismObserver: mockPrismObserver,
      vigilObserver: mockVigilObserver,
      config: {
        minConfidenceThreshold: 0.7,
        maxAdaptationsPerCycle: 5,
        adaptationTypes: ['parameter', 'strategy', 'rule'],
        constitutionalVerification: true
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default config when none provided', () => {
      const defaultEngine = new AdaptationEngine();
      expect(defaultEngine).to.be.an('object');
      expect(defaultEngine.config).to.be.an('object');
      expect(defaultEngine.generators).to.be.an('object');
    });
    
    it('should initialize with provided config', () => {
      expect(adaptationEngine.config.minConfidenceThreshold).to.equal(0.7);
      expect(adaptationEngine.config.maxAdaptationsPerCycle).to.equal(5);
      expect(adaptationEngine.config.adaptationTypes).to.deep.equal(['parameter', 'strategy', 'rule']);
    });
    
    it('should initialize generators', () => {
      expect(adaptationEngine.generators).to.have.keys(['parameter', 'strategy', 'rule']);
    });
  });
  
  describe('generateAdaptations', () => {
    it('should return empty array for empty patterns', () => {
      const result = adaptationEngine.generateAdaptations([]);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
    
    it('should run all generators by default', () => {
      const generatorSpies = {
        parameter: sinon.spy(adaptationEngine.generators, 'parameter'),
        strategy: sinon.spy(adaptationEngine.generators, 'strategy'),
        rule: sinon.spy(adaptationEngine.generators, 'rule')
      };
      
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        }
      ];
      
      adaptationEngine.generateAdaptations(patterns);
      
      expect(generatorSpies.parameter.calledOnce).to.be.true;
      expect(generatorSpies.strategy.calledOnce).to.be.true;
      expect(generatorSpies.rule.calledOnce).to.be.true;
    });
    
    it('should run only specified generators', () => {
      const generatorSpies = {
        parameter: sinon.spy(adaptationEngine.generators, 'parameter'),
        strategy: sinon.spy(adaptationEngine.generators, 'strategy'),
        rule: sinon.spy(adaptationEngine.generators, 'rule')
      };
      
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        }
      ];
      
      adaptationEngine.generateAdaptations(patterns, { adaptationTypes: ['parameter'] });
      
      expect(generatorSpies.parameter.calledOnce).to.be.true;
      expect(generatorSpies.strategy.called).to.be.false;
      expect(generatorSpies.rule.called).to.be.false;
    });
    
    it('should handle generator errors gracefully', () => {
      // Make one generator throw an error
      adaptationEngine.generators.parameter = () => {
        throw new Error('Test error');
      };
      
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        }
      ];
      
      // Should not throw
      const result = adaptationEngine.generateAdaptations(patterns);
      
      expect(result).to.be.an('array');
      expect(mockLogger.error.called).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.include('Error in parameter generator');
    });
    
    it('should filter adaptations by confidence threshold', () => {
      // Mock generators to return adaptations with different confidence
      adaptationEngine.generators = {
        parameter: () => [
          { id: '1', justification: { confidence: 0.8 } },
          { id: '2', justification: { confidence: 0.6 } }
        ],
        strategy: () => [],
        rule: () => []
      };
      
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        }
      ];
      
      const result = adaptationEngine.generateAdaptations(patterns);
      
      expect(result.length).to.equal(1);
      expect(result[0].id).to.equal('1');
    });
    
    it('should limit number of adaptations', () => {
      // Mock generators to return many adaptations
      adaptationEngine.generators = {
        parameter: () => Array.from({ length: 10 }, (_, i) => ({ 
          id: `param_${i}`, 
          justification: { confidence: 0.8 + (i * 0.01) } 
        })),
        strategy: () => [],
        rule: () => []
      };
      
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        }
      ];
      
      const result = adaptationEngine.generateAdaptations(patterns);
      
      expect(result.length).to.equal(adaptationEngine.config.maxAdaptationsPerCycle);
    });
    
    it('should verify adaptations with PRISM when constitutional verification is enabled', () => {
      // Mock generators to return adaptations
      adaptationEngine.generators = {
        parameter: () => [
          { id: '1', justification: { confidence: 0.8 } }
        ],
        strategy: () => [],
        rule: () => []
      };
      
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        }
      ];
      
      adaptationEngine.generateAdaptations(patterns);
      
      expect(mockPrismObserver.verifyBeliefTrace.called).to.be.true;
    });
    
    it('should skip verification when constitutional verification is disabled', () => {
      // Create engine with verification disabled
      const engineWithoutVerification = new AdaptationEngine({
        logger: mockLogger,
        learningMemory: mockLearningMemory,
        prismObserver: mockPrismObserver,
        vigilObserver: mockVigilObserver,
        config: {
          minConfidenceThreshold: 0.7,
          constitutionalVerification: false
        }
      });
      
      // Mock generators to return adaptations
      engineWithoutVerification.generators = {
        parameter: () => [
          { id: '1', justification: { confidence: 0.8 } }
        ],
        strategy: () => [],
        rule: () => []
      };
      
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'test', value: 'value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8 } 
        }
      ];
      
      engineWithoutVerification.generateAdaptations(patterns);
      
      expect(mockPrismObserver.verifyBeliefTrace.called).to.be.false;
    });
  });
  
  describe('generateParameterAdaptations', () => {
    it('should generate parameter adaptations from correlation patterns', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'threshold', value: 'high' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8, confidence: 0.9 } 
        }
      ];
      
      const result = adaptationEngine.generators.parameter(patterns);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
      
      // Check adaptation properties
      const adaptation = result[0];
      expect(adaptation.id).to.be.a('string');
      expect(adaptation.type).to.equal('parameter');
      expect(adaptation.target).to.be.an('object');
      expect(adaptation.justification).to.be.an('object');
      expect(adaptation.justification.confidence).to.be.above(0.7);
      expect(adaptation.justification.pattern_id).to.equal('1');
    });
    
    it('should generate parameter adaptations from temporal patterns', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'temporal',
          elements: [{ factor: 'time_trend', value: 'increasing' }],
          outcome: { factor: 'success_rate', value: 'increasing' },
          statistics: { significance: 0.8, confidence: 0.9 } 
        }
      ];
      
      const result = adaptationEngine.generators.parameter(patterns);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
    });
    
    it('should handle patterns without clear parameter implications', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'unknown_factor', value: 'unknown_value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8, confidence: 0.9 } 
        }
      ];
      
      const result = adaptationEngine.generators.parameter(patterns);
      
      // Should not generate adaptations for unknown factors
      expect(result.length).to.equal(0);
    });
  });
  
  describe('generateStrategyAdaptations', () => {
    it('should generate strategy adaptations from causal patterns', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'causal',
          elements: [{ factor: 'strategy', value: 'exploration' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8, confidence: 0.9 } 
        }
      ];
      
      const result = adaptationEngine.generators.strategy(patterns);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
      
      // Check adaptation properties
      const adaptation = result[0];
      expect(adaptation.id).to.be.a('string');
      expect(adaptation.type).to.equal('strategy');
      expect(adaptation.target).to.be.an('object');
      expect(adaptation.justification).to.be.an('object');
      expect(adaptation.justification.confidence).to.be.above(0.7);
      expect(adaptation.justification.pattern_id).to.equal('1');
    });
    
    it('should generate strategy adaptations from contextual patterns', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'contextual',
          elements: [
            { factor: 'user_type', value: 'premium' },
            { factor: 'task_complexity', value: 'high' }
          ],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8, confidence: 0.9 } 
        }
      ];
      
      const result = adaptationEngine.generators.strategy(patterns);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
    });
  });
  
  describe('generateRuleAdaptations', () => {
    it('should generate rule adaptations from patterns', () => {
      const patterns = [
        { 
          id: '1', 
          type: 'correlation',
          elements: [{ factor: 'condition', value: 'specific_value' }],
          outcome: { factor: 'result', value: 'success' },
          statistics: { significance: 0.8, confidence: 0.9 } 
        }
      ];
      
      const result = adaptationEngine.generators.rule(patterns);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(1);
      
      // Check adaptation properties
      const adaptation = result[0];
      expect(adaptation.id).to.be.a('string');
      expect(adaptation.type).to.equal('rule');
      expect(adaptation.target).to.be.an('object');
      expect(adaptation.target.condition).to.be.a('string');
      expect(adaptation.target.action).to.be.a('string');
      expect(adaptation.justification).to.be.an('object');
      expect(adaptation.justification.confidence).to.be.above(0.7);
      expect(adaptation.justification.pattern_id).to.equal('1');
    });
  });
  
  describe('applyAdaptation', () => {
    it('should apply parameter adaptation', () => {
      const adaptation = {
        id: '1',
        type: 'parameter',
        target: { 
          parameter: 'threshold',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = adaptationEngine.applyAdaptation(adaptation);
      
      expect(result.success).to.be.true;
      expect(result.adaptation_id).to.equal('1');
      expect(result.timestamp).to.be.a('string');
      expect(mockLearningMemory.updateAdaptation.calledOnce).to.be.true;
    });
    
    it('should apply strategy adaptation', () => {
      const adaptation = {
        id: '1',
        type: 'strategy',
        target: { 
          strategy: 'exploration',
          target_value: 'increase'
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = adaptationEngine.applyAdaptation(adaptation);
      
      expect(result.success).to.be.true;
      expect(result.adaptation_id).to.equal('1');
      expect(result.timestamp).to.be.a('string');
      expect(mockLearningMemory.updateAdaptation.calledOnce).to.be.true;
    });
    
    it('should apply rule adaptation', () => {
      const adaptation = {
        id: '1',
        type: 'rule',
        target: { 
          condition: 'user_type === "premium"',
          action: 'prioritize_response()'
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = adaptationEngine.applyAdaptation(adaptation);
      
      expect(result.success).to.be.true;
      expect(result.adaptation_id).to.equal('1');
      expect(result.timestamp).to.be.a('string');
      expect(mockLearningMemory.updateAdaptation.calledOnce).to.be.true;
    });
    
    it('should handle unknown adaptation types', () => {
      const adaptation = {
        id: '1',
        type: 'unknown',
        target: {},
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = adaptationEngine.applyAdaptation(adaptation);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Unknown adaptation type');
      expect(mockLearningMemory.updateAdaptation.calledOnce).to.be.true;
    });
    
    it('should verify adaptation with VIGIL when constitutional verification is enabled', () => {
      const adaptation = {
        id: '1',
        type: 'parameter',
        target: { 
          parameter: 'threshold',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      adaptationEngine.applyAdaptation(adaptation);
      
      expect(mockVigilObserver.assessTrustImplications.called).to.be.true;
    });
    
    it('should reject adaptation when VIGIL verification fails', () => {
      // Make VIGIL return untrusted assessment
      mockVigilObserver.assessTrustImplications = sinon.stub().returns({ 
        trustworthy: false, 
        score: 0.3,
        reason: 'Trust violation'
      });
      
      const adaptation = {
        id: '1',
        type: 'parameter',
        target: { 
          parameter: 'threshold',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = adaptationEngine.applyAdaptation(adaptation);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Trust violation');
      expect(mockLearningMemory.updateAdaptation.calledOnce).to.be.true;
    });
  });
  
  describe('verifyAdaptation', () => {
    it('should verify adaptation with PRISM', () => {
      const adaptation = {
        id: '1',
        type: 'parameter',
        target: { 
          parameter: 'threshold',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = adaptationEngine.verifyAdaptation(adaptation);
      
      expect(result.verified).to.be.true;
      expect(result.confidence).to.equal(0.9);
      expect(mockPrismObserver.verifyBeliefTrace.calledOnce).to.be.true;
    });
    
    it('should return unverified when PRISM verification fails', () => {
      // Make PRISM return unverified assessment
      mockPrismObserver.verifyBeliefTrace = sinon.stub().returns({ 
        verified: false, 
        confidence: 0.3,
        reason: 'Belief trace violation'
      });
      
      const adaptation = {
        id: '1',
        type: 'parameter',
        target: { 
          parameter: 'threshold',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = adaptationEngine.verifyAdaptation(adaptation);
      
      expect(result.verified).to.be.false;
      expect(result.reason).to.include('Belief trace violation');
    });
    
    it('should return verified when constitutional verification is disabled', () => {
      // Create engine with verification disabled
      const engineWithoutVerification = new AdaptationEngine({
        logger: mockLogger,
        learningMemory: mockLearningMemory,
        prismObserver: mockPrismObserver,
        vigilObserver: mockVigilObserver,
        config: {
          minConfidenceThreshold: 0.7,
          constitutionalVerification: false
        }
      });
      
      const adaptation = {
        id: '1',
        type: 'parameter',
        target: { 
          parameter: 'threshold',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = engineWithoutVerification.verifyAdaptation(adaptation);
      
      expect(result.verified).to.be.true;
      expect(mockPrismObserver.verifyBeliefTrace.called).to.be.false;
    });
  });
  
  describe('assessTrustImplications', () => {
    it('should assess trust implications with VIGIL', () => {
      const adaptation = {
        id: '1',
        type: 'parameter',
        target: { 
          parameter: 'threshold',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = adaptationEngine.assessTrustImplications(adaptation);
      
      expect(result.trustworthy).to.be.true;
      expect(result.score).to.equal(0.85);
      expect(mockVigilObserver.assessTrustImplications.calledOnce).to.be.true;
    });
    
    it('should return trustworthy when constitutional verification is disabled', () => {
      // Create engine with verification disabled
      const engineWithoutVerification = new AdaptationEngine({
        logger: mockLogger,
        learningMemory: mockLearningMemory,
        prismObserver: mockPrismObserver,
        vigilObserver: mockVigilObserver,
        config: {
          minConfidenceThreshold: 0.7,
          constitutionalVerification: false
        }
      });
      
      const adaptation = {
        id: '1',
        type: 'parameter',
        target: { 
          parameter: 'threshold',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1'
        }
      };
      
      const result = engineWithoutVerification.assessTrustImplications(adaptation);
      
      expect(result.trustworthy).to.be.true;
      expect(mockVigilObserver.assessTrustImplications.called).to.be.false;
    });
  });
});
