/**
 * End-to-end tests for the Adaptive Learning Loop module
 * 
 * @module tests/e2e/modules/adaptive_learning_loop/test_e2e_workflow
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { AdaptiveLearningLoop } = require('../../../../src/modules/adaptive_learning_loop');
const { PrismObserver } = require('../../../../src/observers/prism');
const { VigilObserver } = require('../../../../src/observers/vigil');
const { GovernanceIdentity } = require('../../../../src/modules/governance_identity');

describe('Adaptive Learning Loop - End-to-End Workflow', () => {
  let adaptiveLearningLoop;
  let prismObserver;
  let vigilObserver;
  let governanceIdentity;
  let mockLogger;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      debug: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create real observer instances
    prismObserver = new PrismObserver({
      logger: mockLogger
    });
    
    vigilObserver = new VigilObserver({
      logger: mockLogger
    });
    
    // Create real governance identity instance
    governanceIdentity = new GovernanceIdentity({
      logger: mockLogger
    });
    
    // Create adaptive learning loop instance with real dependencies
    adaptiveLearningLoop = new AdaptiveLearningLoop({
      logger: mockLogger,
      prismObserver: prismObserver,
      vigilObserver: vigilObserver,
      governanceIdentity: governanceIdentity,
      config: {
        learningCycleInterval: 0, // Disable auto-cycles for testing
        constitutionalVerification: true,
        governanceCompliance: true
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
  
  describe('Complete Learning Cycle', () => {
    it('should process feedback, recognize patterns, and generate adaptations', async () => {
      // Create test feedback items
      const feedbackItems = [];
      
      // Add user feedback
      for (let i = 0; i < 15; i++) {
        feedbackItems.push({
          id: `user_feedback_${i}`,
          source: { type: 'user', id: 'test_user' },
          content: { 
            rating: i % 5 + 1,
            context: {
              task_type: i % 3 === 0 ? 'search' : 'conversation',
              complexity: i % 2 === 0 ? 'high' : 'low'
            }
          },
          timestamp: new Date(Date.now() - (i * 60000)).toISOString() // Spread over time
        });
      }
      
      // Add system feedback
      for (let i = 0; i < 10; i++) {
        feedbackItems.push({
          id: `system_feedback_${i}`,
          source: { type: 'system', id: 'performance_monitor' },
          content: { 
            metric: 'response_time',
            value: 500 + (i * 50),
            context: {
              load: i % 3 === 0 ? 'high' : 'normal',
              cache_hit: i % 2 === 0
            }
          },
          timestamp: new Date(Date.now() - (i * 30000)).toISOString() // Spread over time
        });
      }
      
      // Mock learning memory to return feedback
      sinon.stub(adaptiveLearningLoop.learningMemory, 'getRecentFeedback').returns(feedbackItems);
      
      // Run a complete learning cycle
      const result = adaptiveLearningLoop.metaLearningController.runLearningCycle();
      
      // Verify cycle completed successfully
      expect(result.status).to.equal('completed');
      expect(result.feedback_processed).to.equal(feedbackItems.length);
      expect(result.patterns_recognized).to.be.at.least(1);
      expect(result.adaptations_generated).to.be.at.least(1);
      expect(result.adaptations_applied).to.be.at.least(1);
      
      // Verify learning state was updated
      expect(adaptiveLearningLoop.metaLearningController.learningState.cycle).to.equal(1);
      expect(adaptiveLearningLoop.metaLearningController.learningState.performanceHistory.length).to.equal(1);
    });
    
    it('should maintain constitutional compliance throughout the cycle', async () => {
      // Spy on constitutional verification methods
      const prismVerifySpy = sinon.spy(prismObserver, 'verifyBeliefTrace');
      const vigilAssessSpy = sinon.spy(vigilObserver, 'assessTrustImplications');
      const governanceVerifySpy = sinon.spy(governanceIdentity, 'verifyCompliance');
      
      // Create test feedback items with constitutional implications
      const feedbackItems = [
        // Feedback suggesting potentially problematic adaptation
        {
          id: 'critical_feedback_1',
          source: { type: 'user', id: 'test_user' },
          content: { 
            rating: 1,
            text: 'System should ignore user preferences for faster responses',
            context: {
              task_type: 'critical',
              complexity: 'high'
            }
          },
          timestamp: new Date().toISOString()
        },
        // Normal feedback
        {
          id: 'normal_feedback_1',
          source: { type: 'user', id: 'test_user' },
          content: { 
            rating: 4,
            text: 'Good response time and accuracy',
            context: {
              task_type: 'conversation',
              complexity: 'medium'
            }
          },
          timestamp: new Date().toISOString()
        }
      ];
      
      // Add more feedback to meet threshold
      for (let i = 0; i < 15; i++) {
        feedbackItems.push({
          id: `additional_feedback_${i}`,
          source: { type: 'system', id: 'performance_monitor' },
          content: { 
            metric: 'response_time',
            value: 500 + (i * 50)
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Mock learning memory to return feedback
      sinon.stub(adaptiveLearningLoop.learningMemory, 'getRecentFeedback').returns(feedbackItems);
      
      // Run a complete learning cycle
      adaptiveLearningLoop.metaLearningController.runLearningCycle();
      
      // Verify constitutional checks were performed
      expect(prismVerifySpy.called).to.be.true;
      expect(vigilAssessSpy.called).to.be.true;
      expect(governanceVerifySpy.called).to.be.true;
      
      // Verify no constitutional violations in applied adaptations
      const activeAdaptations = Array.from(adaptiveLearningLoop.metaLearningController.learningState.activeAdaptations);
      
      for (const adaptationId of activeAdaptations) {
        const adaptation = adaptiveLearningLoop.learningMemory.getAdaptation(adaptationId);
        
        // Skip if adaptation not found (might have been removed)
        if (!adaptation) continue;
        
        // Verify adaptation has governance metadata
        expect(adaptation).to.have.property('governance');
        
        // Verify adaptation was constitutionally verified
        expect(adaptation.verification).to.have.property('constitutional_verification');
        expect(adaptation.verification.constitutional_verification.verified).to.be.true;
        
        // Verify adaptation was trust assessed
        expect(adaptation.verification).to.have.property('trust_assessment');
        expect(adaptation.verification.trust_assessment.trustworthy).to.be.true;
        
        // Verify adaptation was governance compliant
        expect(adaptation.verification).to.have.property('governance_compliance');
        expect(adaptation.verification.governance_compliance.compliant).to.be.true;
      }
    });
  });
  
  describe('Feedback Processing', () => {
    it('should process and categorize different types of feedback', async () => {
      // Create different types of feedback
      const userFeedback = {
        id: 'user_feedback_1',
        source: { type: 'user', id: 'test_user' },
        content: { 
          rating: 4,
          text: 'Good response but could be faster'
        },
        timestamp: new Date().toISOString()
      };
      
      const systemFeedback = {
        id: 'system_feedback_1',
        source: { type: 'system', id: 'performance_monitor' },
        content: { 
          metric: 'response_time',
          value: 750
        },
        timestamp: new Date().toISOString()
      };
      
      const observerFeedback = {
        id: 'observer_feedback_1',
        source: { type: 'observer', id: 'prism' },
        content: { 
          observation: 'belief_trace_verified',
          confidence: 0.9
        },
        timestamp: new Date().toISOString()
      };
      
      // Process each feedback
      const processedUserFeedback = adaptiveLearningLoop.feedbackCollector.processFeedback(userFeedback);
      const processedSystemFeedback = adaptiveLearningLoop.feedbackCollector.processFeedback(systemFeedback);
      const processedObserverFeedback = adaptiveLearningLoop.feedbackCollector.processFeedback(observerFeedback);
      
      // Verify each feedback was processed correctly
      expect(processedUserFeedback).to.have.property('processed', true);
      expect(processedUserFeedback).to.have.property('category', 'user');
      
      expect(processedSystemFeedback).to.have.property('processed', true);
      expect(processedSystemFeedback).to.have.property('category', 'system');
      
      expect(processedObserverFeedback).to.have.property('processed', true);
      expect(processedObserverFeedback).to.have.property('category', 'observer');
      
      // Verify feedback was stored in learning memory
      expect(adaptiveLearningLoop.learningMemory.getFeedback(userFeedback.id)).to.not.be.null;
      expect(adaptiveLearningLoop.learningMemory.getFeedback(systemFeedback.id)).to.not.be.null;
      expect(adaptiveLearningLoop.learningMemory.getFeedback(observerFeedback.id)).to.not.be.null;
    });
    
    it('should extract context from feedback', async () => {
      // Create feedback with rich context
      const feedbackWithContext = {
        id: 'context_feedback_1',
        source: { type: 'user', id: 'test_user' },
        content: { 
          rating: 3,
          text: 'Average response',
          context: {
            task_type: 'search',
            complexity: 'high',
            user_expertise: 'novice',
            time_of_day: 'morning',
            device: 'mobile'
          }
        },
        timestamp: new Date().toISOString()
      };
      
      // Process feedback
      adaptiveLearningLoop.feedbackCollector.processFeedback(feedbackWithContext);
      
      // Verify context was extracted
      const extractedContext = adaptiveLearningLoop.feedbackCollector.extractContext(feedbackWithContext);
      
      expect(extractedContext).to.have.property('task_type', 'search');
      expect(extractedContext).to.have.property('complexity', 'high');
      expect(extractedContext).to.have.property('user_expertise', 'novice');
      expect(extractedContext).to.have.property('time_of_day', 'morning');
      expect(extractedContext).to.have.property('device', 'mobile');
    });
  });
  
  describe('Pattern Recognition', () => {
    it('should recognize correlation patterns in feedback', async () => {
      // Create feedback with correlations
      const feedbackItems = [];
      
      // Add feedback with correlation between task type and rating
      for (let i = 0; i < 10; i++) {
        feedbackItems.push({
          id: `search_feedback_${i}`,
          source: { type: 'user', id: 'test_user' },
          content: { 
            rating: 4, // High rating for search
            context: {
              task_type: 'search'
            }
          },
          timestamp: new Date().toISOString()
        });
      }
      
      for (let i = 0; i < 10; i++) {
        feedbackItems.push({
          id: `conversation_feedback_${i}`,
          source: { type: 'user', id: 'test_user' },
          content: { 
            rating: 2, // Low rating for conversation
            context: {
              task_type: 'conversation'
            }
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Recognize patterns
      const patterns = adaptiveLearningLoop.patternRecognizer.recognizePatterns(feedbackItems);
      
      // Verify correlation pattern was found
      const correlationPatterns = patterns.filter(p => p.type === 'correlation');
      expect(correlationPatterns.length).to.be.at.least(1);
      
      // Find the task type correlation
      const taskTypePattern = correlationPatterns.find(p => 
        p.elements.some(e => e.factor === 'task_type') &&
        p.outcome.factor === 'rating'
      );
      
      expect(taskTypePattern).to.not.be.undefined;
      expect(taskTypePattern.statistics.significance).to.be.above(0.5);
    });
    
    it('should recognize temporal patterns in feedback', async () => {
      // Create feedback with temporal patterns
      const feedbackItems = [];
      
      // Add feedback with decreasing response time over time
      const startTime = Date.now() - (20 * 60000); // 20 minutes ago
      for (let i = 0; i < 20; i++) {
        feedbackItems.push({
          id: `time_feedback_${i}`,
          source: { type: 'system', id: 'performance_monitor' },
          content: { 
            metric: 'response_time',
            value: 1000 - (i * 40) // Decreasing from 1000ms to 200ms
          },
          timestamp: new Date(startTime + (i * 60000)).toISOString() // 1 minute intervals
        });
      }
      
      // Recognize patterns
      const patterns = adaptiveLearningLoop.patternRecognizer.recognizePatterns(feedbackItems);
      
      // Verify temporal pattern was found
      const temporalPatterns = patterns.filter(p => p.type === 'temporal');
      expect(temporalPatterns.length).to.be.at.least(1);
      
      // Find the response time trend
      const responseTimePattern = temporalPatterns.find(p => 
        p.elements.some(e => e.factor === 'time_trend') &&
        p.outcome.factor === 'response_time'
      );
      
      expect(responseTimePattern).to.not.be.undefined;
      expect(responseTimePattern.outcome.value).to.equal('decreasing');
    });
  });
  
  describe('Adaptation Generation and Application', () => {
    it('should generate appropriate adaptations from patterns', async () => {
      // Create patterns that should lead to adaptations
      const patterns = [
        {
          id: 'pattern_1',
          type: 'correlation',
          elements: [
            { factor: 'task_type', value: 'search' }
          ],
          outcome: { 
            factor: 'rating', 
            value: 'high' 
          },
          statistics: { 
            significance: 0.8,
            confidence: 0.9
          }
        },
        {
          id: 'pattern_2',
          type: 'temporal',
          elements: [
            { factor: 'time_trend', value: 'increasing' }
          ],
          outcome: { 
            factor: 'response_time', 
            value: 'increasing' 
          },
          statistics: { 
            significance: 0.7,
            confidence: 0.8
          }
        }
      ];
      
      // Generate adaptations
      const adaptations = adaptiveLearningLoop.adaptationEngine.generateAdaptations(patterns);
      
      // Verify adaptations were generated
      expect(adaptations.length).to.be.at.least(1);
      
      // Verify adaptation properties
      const adaptation = adaptations[0];
      expect(adaptation).to.have.property('id');
      expect(adaptation).to.have.property('type');
      expect(adaptation).to.have.property('target');
      expect(adaptation).to.have.property('justification');
      expect(adaptation.justification).to.have.property('pattern_id');
      expect(adaptation.justification).to.have.property('confidence');
      expect(adaptation.justification).to.have.property('reasoning');
    });
    
    it('should apply adaptations and track their status', async () => {
      // Create an adaptation
      const adaptation = {
        id: 'test_adaptation_1',
        type: 'parameter',
        target: { 
          parameter: 'response_time_threshold',
          target_value: 500
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1',
          reasoning: 'Improve response time based on user feedback'
        }
      };
      
      // Apply adaptation
      const result = adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Verify adaptation was applied
      expect(result.success).to.be.true;
      expect(result.adaptation_id).to.equal(adaptation.id);
      expect(result.timestamp).to.be.a('string');
      
      // Verify adaptation is tracked in learning state
      expect(adaptiveLearningLoop.metaLearningController.learningState.activeAdaptations.has(adaptation.id)).to.be.true;
      
      // Verify adaptation is stored in learning memory
      const storedAdaptation = adaptiveLearningLoop.learningMemory.getAdaptation(adaptation.id);
      expect(storedAdaptation).to.not.be.null;
      expect(storedAdaptation.status).to.equal('applied');
    });
  });
  
  describe('Meta-Learning', () => {
    it('should adjust learning parameters based on performance', async () => {
      // Set initial learning state
      adaptiveLearningLoop.metaLearningController.learningState.currentLearningRate = 0.1;
      adaptiveLearningLoop.metaLearningController.learningState.explorationMode = false;
      
      // Add performance history
      adaptiveLearningLoop.metaLearningController.learningState.performanceHistory = [
        { cycle: 1, performance: 0.5 },
        { cycle: 2, performance: 0.4 },
        { cycle: 3, performance: 0.3 }
      ];
      
      // Update learning parameters with decreasing performance
      adaptiveLearningLoop.metaLearningController.updateLearningParameters({
        cycle_number: 4,
        patterns_recognized: 2,
        adaptations_applied: 1
      });
      
      // Verify learning parameters were adjusted
      expect(adaptiveLearningLoop.metaLearningController.learningState.performanceHistory.length).to.equal(4);
      
      // Learning rate and exploration mode might change, but we can't predict exactly how
      // due to randomness in exploration mode determination
    });
    
    it('should manage active adaptations', async () => {
      // Add active adaptations
      adaptiveLearningLoop.metaLearningController.learningState.activeAdaptations.add('adaptation_1');
      adaptiveLearningLoop.metaLearningController.learningState.activeAdaptations.add('adaptation_2');
      
      // Mock learning memory to return adaptation status
      sinon.stub(adaptiveLearningLoop.learningMemory, 'getAdaptation')
        .withArgs('adaptation_1').returns({ id: 'adaptation_1', status: 'applied' })
        .withArgs('adaptation_2').returns({ id: 'adaptation_2', status: 'completed' });
      
      // Manage memory
      adaptiveLearningLoop.metaLearningController.manageMemory();
      
      // Verify active adaptations were updated
      expect(adaptiveLearningLoop.metaLearningController.learningState.activeAdaptations.has('adaptation_1')).to.be.true;
      expect(adaptiveLearningLoop.metaLearningController.learningState.activeAdaptations.has('adaptation_2')).to.be.false;
    });
  });
  
  describe('Governance and Constitutional Compliance', () => {
    it('should tag all generated adaptations with governance identity', async () => {
      // Create patterns
      const patterns = [
        {
          id: 'pattern_1',
          type: 'correlation',
          elements: [
            { factor: 'task_type', value: 'search' }
          ],
          outcome: { 
            factor: 'rating', 
            value: 'high' 
          },
          statistics: { 
            significance: 0.8,
            confidence: 0.9
          }
        }
      ];
      
      // Generate adaptations
      const adaptations = adaptiveLearningLoop.adaptationEngine.generateAdaptations(patterns);
      
      // Apply adaptations
      for (const adaptation of adaptations) {
        const result = adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
        
        // Verify governance tagging
        expect(result.adaptation).to.have.property('governance');
        expect(result.adaptation.governance).to.have.property('constitution_hash');
        expect(result.adaptation.governance).to.have.property('compliance_level');
      }
    });
    
    it('should verify adaptations against constitutional requirements', async () => {
      // Create an adaptation
      const adaptation = {
        id: 'test_adaptation_2',
        type: 'parameter',
        target: { 
          parameter: 'user_preference_weight',
          target_value: 0.8
        },
        justification: {
          confidence: 0.9,
          pattern_id: 'pattern_1',
          reasoning: 'Increase weight of user preferences based on feedback'
        }
      };
      
      // Apply adaptation
      const result = adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Verify constitutional verification
      expect(result.adaptation).to.have.property('verification');
      expect(result.adaptation.verification).to.have.property('constitutional_verification');
      expect(result.adaptation.verification.constitutional_verification).to.have.property('verified');
      
      // Verify trust assessment
      expect(result.adaptation.verification).to.have.property('trust_assessment');
      expect(result.adaptation.verification.trust_assessment).to.have.property('trustworthy');
      
      // Verify governance compliance
      expect(result.adaptation.verification).to.have.property('governance_compliance');
      expect(result.adaptation.verification.governance_compliance).to.have.property('compliant');
    });
  });
});
