/**
 * Integration tests for the Adaptive Learning Loop with Observers
 * 
 * @module tests/integration/modules/adaptive_learning_loop/test_observer_integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { AdaptiveLearningLoop } = require('../../../../src/modules/adaptive_learning_loop');
const { PrismObserver } = require('../../../../src/observers/prism');
const { VigilObserver } = require('../../../../src/observers/vigil');

describe('Adaptive Learning Loop - Observer Integration', () => {
  let adaptiveLearningLoop;
  let prismObserver;
  let vigilObserver;
  let mockLogger;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      debug: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
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
    
    // Create real observer instances
    prismObserver = new PrismObserver({
      logger: mockLogger,
      eventEmitter: mockEventEmitter,
      dataDir: '/tmp/prism_test'
    });
    
    vigilObserver = new VigilObserver({
      logger: mockLogger,
      eventEmitter: mockEventEmitter,
      constitutionalHooks: mockConstitutionalHooks,
      dataDir: '/tmp/vigil_test'
    });
    
    // Create adaptive learning loop instance with real observers
    adaptiveLearningLoop = new AdaptiveLearningLoop({
      logger: mockLogger,
      prismObserver: prismObserver,
      vigilObserver: vigilObserver,
      config: {
        learningCycleInterval: 0, // Disable auto-cycles for testing
        constitutionalVerification: true
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
    
    // Clean up resources
    if (adaptiveLearningLoop.metaLearningController && 
        adaptiveLearningLoop.metaLearningController.cycleTimer) {
      clearInterval(adaptiveLearningLoop.metaLearningController.cycleTimer);
    }
  });
  
  describe('PRISM Observer Integration', () => {
    it('should verify patterns with PRISM', async () => {
      // Spy on PRISM verification method
      const verifyBeliefTraceSpy = sinon.spy(prismObserver, 'verifyBeliefTrace');
      
      // Create a test pattern
      const pattern = {
        id: 'test_pattern',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        outcome: { factor: 'result', value: 'success' },
        statistics: { significance: 0.8 }
      };
      
      // Verify pattern using adaptation engine
      const result = adaptiveLearningLoop.adaptationEngine.verifyAdaptation({
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: pattern.id,
          reasoning: 'Test reasoning'
        },
        source_pattern: pattern
      });
      
      // Check that PRISM was called
      expect(verifyBeliefTraceSpy.calledOnce).to.be.true;
      
      // Check that verification result includes PRISM data
      expect(result).to.have.property('verified');
      expect(result).to.have.property('confidence');
    });
    
    it('should reject adaptations that violate belief trace', async () => {
      // Make PRISM reject verification
      sinon.stub(prismObserver, 'verifyBeliefTrace').returns({
        verified: false,
        confidence: 0.3,
        reason: 'Belief trace violation'
      });
      
      // Create a test pattern
      const pattern = {
        id: 'test_pattern',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        outcome: { factor: 'result', value: 'success' },
        statistics: { significance: 0.8 }
      };
      
      // Generate adaptations
      const adaptations = adaptiveLearningLoop.adaptationEngine.generateAdaptations([pattern]);
      
      // Should not generate adaptations that violate belief trace
      expect(adaptations.length).to.equal(0);
    });
    
    it('should register patterns with PRISM for monitoring', async () => {
      // Spy on PRISM registration method
      const registerPatternSpy = sinon.spy(prismObserver, 'registerPattern');
      
      // Create a test pattern
      const pattern = {
        id: 'test_pattern',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        outcome: { factor: 'result', value: 'success' },
        statistics: { significance: 0.8 }
      };
      
      // Store pattern in learning memory
      adaptiveLearningLoop.learningMemory.storePattern(pattern);
      
      // Check that pattern was registered with PRISM
      expect(registerPatternSpy.calledOnce).to.be.true;
      expect(registerPatternSpy.firstCall.args[0].id).to.equal(pattern.id);
    });
  });
  
  describe('VIGIL Observer Integration', () => {
    it('should assess trust implications with VIGIL', async () => {
      // Spy on VIGIL assessment method
      const assessTrustImplicationsSpy = sinon.spy(vigilObserver, 'assessTrustImplications');
      
      // Create a test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Assess trust implications
      const result = adaptiveLearningLoop.adaptationEngine.assessTrustImplications(adaptation);
      
      // Check that VIGIL was called
      expect(assessTrustImplicationsSpy.calledOnce).to.be.true;
      
      // Check that assessment result includes VIGIL data
      expect(result).to.have.property('trustworthy');
      expect(result).to.have.property('score');
    });
    
    it('should reject adaptations that violate trust', async () => {
      // Make VIGIL reject assessment
      sinon.stub(vigilObserver, 'assessTrustImplications').returns({
        trustworthy: false,
        score: 0.3,
        reason: 'Trust violation'
      });
      
      // Create a test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Apply adaptation
      const result = adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Should not apply adaptations that violate trust
      expect(result.success).to.be.false;
      expect(result.error).to.include('Trust violation');
    });
    
    it('should notify VIGIL of applied adaptations', async () => {
      // Spy on VIGIL notification method
      const notifyAdaptationSpy = sinon.spy(vigilObserver, 'notifyAdaptation');
      
      // Create a test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Make VIGIL approve the adaptation
      sinon.stub(vigilObserver, 'assessTrustImplications').returns({
        trustworthy: true,
        score: 0.9
      });
      
      // Apply adaptation
      adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Check that VIGIL was notified
      expect(notifyAdaptationSpy.calledOnce).to.be.true;
      expect(notifyAdaptationSpy.firstCall.args[0].id).to.equal(adaptation.id);
    });
  });
  
  describe('Observer Event Flow', () => {
    it('should propagate feedback events to observers', async () => {
      // Spy on observer event handlers
      const prismHandleFeedbackSpy = sinon.spy(prismObserver, 'handleFeedback');
      const vigilHandleFeedbackSpy = sinon.spy(vigilObserver, 'handleFeedback');
      
      // Create test feedback
      const feedback = {
        id: 'test_feedback',
        source: { type: 'user' },
        content: { text: 'Test feedback' }
      };
      
      // Process feedback
      adaptiveLearningLoop.feedbackCollector.processFeedback(feedback);
      
      // Check that observers received the feedback
      expect(prismHandleFeedbackSpy.calledOnce).to.be.true;
      expect(vigilHandleFeedbackSpy.calledOnce).to.be.true;
    });
    
    it('should propagate adaptation events to observers', async () => {
      // Spy on observer event handlers
      const prismHandleAdaptationSpy = sinon.spy(prismObserver, 'handleAdaptation');
      const vigilHandleAdaptationSpy = sinon.spy(vigilObserver, 'handleAdaptation');
      
      // Create test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Make observers approve the adaptation
      sinon.stub(prismObserver, 'verifyBeliefTrace').returns({
        verified: true,
        confidence: 0.9
      });
      
      sinon.stub(vigilObserver, 'assessTrustImplications').returns({
        trustworthy: true,
        score: 0.9
      });
      
      // Apply adaptation
      adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Check that observers received the adaptation event
      expect(prismHandleAdaptationSpy.calledOnce).to.be.true;
      expect(vigilHandleAdaptationSpy.calledOnce).to.be.true;
    });
    
    it('should handle observer feedback in learning cycle', async () => {
      // Create observer feedback
      const prismFeedback = {
        id: 'prism_feedback',
        source: { type: 'observer', id: 'prism' },
        content: { 
          observation: 'belief_trace_verified',
          confidence: 0.9
        }
      };
      
      const vigilFeedback = {
        id: 'vigil_feedback',
        source: { type: 'observer', id: 'vigil' },
        content: { 
          observation: 'trust_maintained',
          confidence: 0.85
        }
      };
      
      // Mock learning memory to return observer feedback
      sinon.stub(adaptiveLearningLoop.learningMemory, 'getRecentFeedback').returns([
        prismFeedback,
        vigilFeedback
      ]);
      
      // Run learning cycle
      const result = adaptiveLearningLoop.metaLearningController.runLearningCycle();
      
      // Check that cycle processed the feedback
      expect(result.feedback_processed).to.equal(2);
    });
  });
  
  describe('Constitutional Verification', () => {
    it('should enforce constitutional verification by default', () => {
      expect(adaptiveLearningLoop.config.constitutionalVerification).to.be.true;
    });
    
    it('should allow disabling constitutional verification', () => {
      // Create adaptive learning loop with verification disabled
      const loopWithoutVerification = new AdaptiveLearningLoop({
        logger: mockLogger,
        prismObserver: prismObserver,
        vigilObserver: vigilObserver,
        config: {
          constitutionalVerification: false
        }
      });
      
      expect(loopWithoutVerification.config.constitutionalVerification).to.be.false;
      expect(loopWithoutVerification.adaptationEngine.config.constitutionalVerification).to.be.false;
    });
    
    it('should bypass verification when disabled', async () => {
      // Create adaptive learning loop with verification disabled
      const loopWithoutVerification = new AdaptiveLearningLoop({
        logger: mockLogger,
        prismObserver: prismObserver,
        vigilObserver: vigilObserver,
        config: {
          constitutionalVerification: false
        }
      });
      
      // Spy on observer verification methods
      const verifyBeliefTraceSpy = sinon.spy(prismObserver, 'verifyBeliefTrace');
      const assessTrustImplicationsSpy = sinon.spy(vigilObserver, 'assessTrustImplications');
      
      // Create a test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Apply adaptation
      loopWithoutVerification.adaptationEngine.applyAdaptation(adaptation);
      
      // Check that observers were not called for verification
      expect(verifyBeliefTraceSpy.called).to.be.false;
      expect(assessTrustImplicationsSpy.called).to.be.false;
    });
  });
});
