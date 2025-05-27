/**
 * Unit tests for the Feedback Collector component
 * 
 * @module tests/unit/modules/adaptive_learning_loop/test_feedback_collector
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { FeedbackCollector } = require('../../../../src/modules/adaptive_learning_loop/feedback_collector');

describe('Feedback Collector', () => {
  let feedbackCollector;
  let mockLogger;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      debug: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create feedback collector instance
    feedbackCollector = new FeedbackCollector({
      logger: mockLogger,
      config: {
        sourceReliability: {
          user: 0.9,
          system: 0.8,
          observer: 0.85,
          outcome: 0.75
        },
        requiredFields: ['source', 'content'],
        samplingRate: 100
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default config when none provided', () => {
      const defaultCollector = new FeedbackCollector();
      expect(defaultCollector).to.be.an('object');
      expect(defaultCollector.config).to.be.an('object');
      expect(defaultCollector.feedbackHandlers).to.be.an('object');
    });
    
    it('should initialize with provided config', () => {
      expect(feedbackCollector.config.sourceReliability.user).to.equal(0.9);
      expect(feedbackCollector.config.requiredFields).to.deep.equal(['source', 'content']);
    });
    
    it('should initialize feedback handlers', () => {
      expect(feedbackCollector.feedbackHandlers).to.have.keys(['user', 'system', 'observer', 'outcome']);
    });
  });
  
  describe('processFeedback', () => {
    it('should validate required fields', () => {
      expect(() => feedbackCollector.processFeedback({})).to.throw('Missing required feedback field');
      expect(() => feedbackCollector.processFeedback({ source: 'user' })).to.throw('Missing required feedback field');
    });
    
    it('should process valid feedback', () => {
      const feedback = {
        source: 'user',
        content: { text: 'This is helpful' }
      };
      
      const result = feedbackCollector.processFeedback(feedback);
      
      expect(result).to.be.an('object');
      expect(result.id).to.be.a('string');
      expect(result.timestamp).to.be.a('string');
      expect(result.source.type).to.equal('user');
      expect(result.content).to.deep.equal({ text: 'This is helpful' });
      expect(result.metadata).to.be.an('object');
    });
    
    it('should normalize source information', () => {
      const feedback = {
        source: 'user',
        content: {}
      };
      
      const result = feedbackCollector.processFeedback(feedback);
      
      expect(result.source).to.be.an('object');
      expect(result.source.type).to.equal('user');
      expect(result.source.id).to.be.a('string');
      expect(result.source.reliability).to.equal(0.9);
    });
    
    it('should normalize context information', () => {
      const feedback = {
        source: 'user',
        content: {},
        context: {
          task_id: '123',
          custom_field: 'value'
        }
      };
      
      const result = feedbackCollector.processFeedback(feedback);
      
      expect(result.context).to.be.an('object');
      expect(result.context.task_id).to.equal('123');
      expect(result.context.custom_field).to.equal('value');
    });
    
    it('should merge additional context', () => {
      const feedback = {
        source: 'user',
        content: {},
        context: {
          task_id: '123'
        }
      };
      
      const additionalContext = {
        decision_id: '456',
        environmental_factors: {
          temperature: 'high'
        }
      };
      
      const result = feedbackCollector.processFeedback(feedback, additionalContext);
      
      expect(result.context.task_id).to.equal('123');
      expect(result.context.decision_id).to.equal('456');
      expect(result.context.environmental_factors).to.deep.equal({ temperature: 'high' });
    });
    
    it('should respect sampling rate', () => {
      // Create collector with 0% sampling rate
      const noSamplingCollector = new FeedbackCollector({
        logger: mockLogger,
        config: {
          sourceReliability: { user: 0.9 },
          requiredFields: ['source', 'content'],
          samplingRate: 0
        }
      });
      
      const feedback = {
        source: 'user',
        content: {}
      };
      
      // Mock Math.random to return 0.5
      sinon.stub(Math, 'random').returns(0.5);
      
      const result = noSamplingCollector.processFeedback(feedback);
      
      expect(result).to.be.null;
    });
  });
  
  describe('processUserFeedback', () => {
    it('should process user feedback with rating', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'user' },
        content: {
          rating: 4,
          text: 'Good service'
        },
        metadata: {}
      };
      
      feedbackCollector.processUserFeedback(feedbackRecord);
      
      expect(feedbackRecord.content.normalized_rating).to.equal(0.8);
      expect(feedbackRecord.metadata.feedback_type).to.equal('explicit');
      expect(feedbackRecord.metadata.user_provided).to.be.true;
    });
    
    it('should extract sentiment from text', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'user' },
        content: {
          text: 'This is very helpful and I like it'
        },
        metadata: {}
      };
      
      feedbackCollector.processUserFeedback(feedbackRecord);
      
      expect(feedbackRecord.content.sentiment).to.be.an('object');
      expect(feedbackRecord.content.sentiment.positive).to.be.true;
      expect(feedbackRecord.content.sentiment.score).to.be.above(0.5);
    });
    
    it('should warn when user feedback is missing rating and text', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'user' },
        content: {},
        metadata: {}
      };
      
      feedbackCollector.processUserFeedback(feedbackRecord);
      
      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockLogger.warn.firstCall.args[0]).to.include('User feedback missing rating or text');
    });
  });
  
  describe('processSystemFeedback', () => {
    it('should process system feedback', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'system', id: 'module_x' },
        content: {},
        metadata: {}
      };
      
      feedbackCollector.processSystemFeedback(feedbackRecord);
      
      expect(feedbackRecord.content.metrics).to.be.an('object');
      expect(feedbackRecord.metadata.feedback_type).to.equal('system');
      expect(feedbackRecord.metadata.system_generated).to.be.true;
      expect(feedbackRecord.metadata.system_component).to.equal('module_x');
    });
  });
  
  describe('processObserverFeedback', () => {
    it('should process observer feedback', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'observer', id: 'prism' },
        content: {},
        metadata: {}
      };
      
      feedbackCollector.processObserverFeedback(feedbackRecord);
      
      expect(feedbackRecord.metadata.feedback_type).to.equal('observation');
      expect(feedbackRecord.metadata.observer_generated).to.be.true;
      expect(feedbackRecord.metadata.observer_id).to.equal('prism');
      expect(feedbackRecord.metadata.constitutional_verification).to.be.true;
      expect(feedbackRecord.metadata.verification_type).to.equal('prism');
    });
    
    it('should handle non-constitutional observers', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'observer', id: 'custom_observer' },
        content: {},
        metadata: {}
      };
      
      feedbackCollector.processObserverFeedback(feedbackRecord);
      
      expect(feedbackRecord.metadata.observer_id).to.equal('custom_observer');
      expect(feedbackRecord.metadata.constitutional_verification).to.be.undefined;
    });
  });
  
  describe('processOutcomeFeedback', () => {
    it('should process outcome feedback with success', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'outcome' },
        content: {
          outcome: {
            success: true,
            result: 'completed'
          }
        },
        metadata: {}
      };
      
      feedbackCollector.processOutcomeFeedback(feedbackRecord);
      
      expect(feedbackRecord.metadata.feedback_type).to.equal('outcome');
      expect(feedbackRecord.metadata.outcome_generated).to.be.true;
    });
    
    it('should infer success from status', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'outcome' },
        content: {
          outcome: {
            status: 'completed'
          }
        },
        metadata: {}
      };
      
      feedbackCollector.processOutcomeFeedback(feedbackRecord);
      
      expect(feedbackRecord.content.outcome.success).to.be.true;
    });
    
    it('should warn when outcome is missing', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'outcome' },
        content: {},
        metadata: {}
      };
      
      feedbackCollector.processOutcomeFeedback(feedbackRecord);
      
      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockLogger.warn.firstCall.args[0]).to.include('Outcome feedback missing outcome data');
      expect(feedbackRecord.content.outcome).to.deep.equal({ success: false });
    });
    
    it('should calculate outcome quality when metrics are available', () => {
      const feedbackRecord = {
        id: '123',
        source: { type: 'outcome' },
        content: {
          outcome: {
            success: true
          },
          metrics: {
            accuracy: 0.8,
            time_efficiency: 0.6
          }
        },
        metadata: {}
      };
      
      feedbackCollector.processOutcomeFeedback(feedbackRecord);
      
      expect(feedbackRecord.content.quality).to.be.a('number');
      expect(feedbackRecord.content.quality).to.be.above(0.5);
    });
  });
  
  describe('extractSentiment', () => {
    it('should detect positive sentiment', () => {
      const result = feedbackCollector.extractSentiment('This is good and helpful');
      
      expect(result.positive).to.be.true;
      expect(result.negative).to.be.false;
      expect(result.score).to.be.above(0.5);
    });
    
    it('should detect negative sentiment', () => {
      const result = feedbackCollector.extractSentiment('This is bad and terrible');
      
      expect(result.positive).to.be.false;
      expect(result.negative).to.be.true;
      expect(result.score).to.be.below(0.5);
    });
    
    it('should detect neutral sentiment', () => {
      const result = feedbackCollector.extractSentiment('This is a statement without sentiment');
      
      expect(result.neutral).to.be.true;
      expect(result.score).to.equal(0.5);
    });
  });
  
  describe('calculateOutcomeQuality', () => {
    it('should calculate quality based on success', () => {
      const outcome = { success: true };
      const metrics = {};
      
      const quality = feedbackCollector.calculateOutcomeQuality(outcome, metrics);
      
      expect(quality).to.equal(0.7);
    });
    
    it('should adjust quality based on metrics', () => {
      const outcome = { success: true };
      const metrics = {
        accuracy: 0.9,
        time_efficiency: 0.8
      };
      
      const quality = feedbackCollector.calculateOutcomeQuality(outcome, metrics);
      
      expect(quality).to.be.above(0.7);
    });
    
    it('should ensure quality is in 0-1 range', () => {
      const outcome = { success: true };
      const metrics = {
        accuracy: 2.0, // Invalid value
        time_efficiency: -0.5 // Invalid value
      };
      
      const quality = feedbackCollector.calculateOutcomeQuality(outcome, metrics);
      
      expect(quality).to.be.at.least(0);
      expect(quality).to.be.at.most(1);
    });
  });
});
