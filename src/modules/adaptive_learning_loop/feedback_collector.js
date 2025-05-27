/**
 * Feedback Collector Component
 * 
 * Responsible for gathering feedback from multiple sources including user explicit feedback,
 * implicit feedback, outcome measurements, system performance metrics, and constitutional
 * observer evaluations.
 * 
 * @module adaptive_learning_loop/feedback_collector
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Feedback Collector class
 */
class FeedbackCollector {
  /**
   * Create a new FeedbackCollector instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = options.config || {
      sourceReliability: {
        user: 0.9,
        system: 0.8,
        observer: 0.85,
        outcome: 0.75
      },
      requiredFields: ['source', 'content'],
      samplingRate: 100 // 100% sampling rate by default
    };
    
    this.feedbackHandlers = {
      user: this.processUserFeedback.bind(this),
      system: this.processSystemFeedback.bind(this),
      observer: this.processObserverFeedback.bind(this),
      outcome: this.processOutcomeFeedback.bind(this)
    };
    
    this.logger.info('Feedback Collector initialized');
  }
  
  /**
   * Process and validate feedback
   * 
   * @param {Object} feedback - Raw feedback data
   * @param {Object} context - Additional context information
   * @returns {Object} Processed feedback record
   */
  processFeedback(feedback, context = {}) {
    this.logger.debug('Processing feedback', { feedback, context });
    
    // Apply sampling rate - randomly skip some feedback
    if (this.config.samplingRate < 100 && Math.random() * 100 > this.config.samplingRate) {
      this.logger.debug('Feedback skipped due to sampling rate');
      return null;
    }
    
    // Validate required fields
    this.validateRequiredFields(feedback);
    
    // Create base feedback record
    const feedbackRecord = {
      id: feedback.id || uuidv4(),
      timestamp: feedback.timestamp || new Date().toISOString(),
      source: this.normalizeSource(feedback.source),
      context: this.normalizeContext(feedback.context, context),
      content: feedback.content || {},
      metadata: feedback.metadata || {}
    };
    
    // Apply source-specific processing
    const sourceType = feedbackRecord.source.type;
    if (this.feedbackHandlers[sourceType]) {
      this.feedbackHandlers[sourceType](feedbackRecord);
    }
    
    // Add processing metadata
    feedbackRecord.metadata.processed_at = new Date().toISOString();
    feedbackRecord.metadata.processor_version = '1.0.0';
    
    this.logger.debug('Feedback processed', { feedbackId: feedbackRecord.id });
    
    return feedbackRecord;
  }
  
  /**
   * Validate required fields in feedback
   * 
   * @param {Object} feedback - Feedback to validate
   * @throws {Error} If required fields are missing
   * @private
   */
  validateRequiredFields(feedback) {
    for (const field of this.config.requiredFields) {
      if (!feedback[field]) {
        throw new Error(`Missing required feedback field: ${field}`);
      }
    }
  }
  
  /**
   * Normalize feedback source
   * 
   * @param {Object|string} source - Source information
   * @returns {Object} Normalized source object
   * @private
   */
  normalizeSource(source) {
    // Handle string source (assume it's the type)
    if (typeof source === 'string') {
      source = { type: source };
    }
    
    // Ensure source is an object
    if (!source || typeof source !== 'object') {
      source = { type: 'unknown' };
    }
    
    // Normalize source object
    const normalizedSource = {
      type: source.type || 'unknown',
      id: source.id || uuidv4(),
      reliability: source.reliability || this.getDefaultReliability(source.type)
    };
    
    return normalizedSource;
  }
  
  /**
   * Get default reliability for a source type
   * 
   * @param {string} sourceType - Type of feedback source
   * @returns {number} Default reliability score
   * @private
   */
  getDefaultReliability(sourceType) {
    return this.config.sourceReliability[sourceType] || 0.5;
  }
  
  /**
   * Normalize feedback context
   * 
   * @param {Object} feedbackContext - Context from feedback
   * @param {Object} additionalContext - Additional context information
   * @returns {Object} Normalized context object
   * @private
   */
  normalizeContext(feedbackContext = {}, additionalContext = {}) {
    // Merge contexts
    const mergedContext = { ...additionalContext, ...feedbackContext };
    
    // Normalize context object
    const normalizedContext = {
      task_id: mergedContext.task_id || mergedContext.taskId || null,
      decision_id: mergedContext.decision_id || mergedContext.decisionId || null,
      environmental_factors: mergedContext.environmental_factors || mergedContext.environmentalFactors || {}
    };
    
    // Add any additional context properties
    for (const [key, value] of Object.entries(mergedContext)) {
      if (!normalizedContext.hasOwnProperty(key)) {
        normalizedContext[key] = value;
      }
    }
    
    return normalizedContext;
  }
  
  /**
   * Process user feedback
   * 
   * @param {Object} feedbackRecord - Feedback record to process
   * @private
   */
  processUserFeedback(feedbackRecord) {
    // Ensure content has expected structure
    if (!feedbackRecord.content.rating && !feedbackRecord.content.text) {
      this.logger.warn('User feedback missing rating or text', { feedbackId: feedbackRecord.id });
    }
    
    // Normalize rating to 0-1 scale if present
    if (feedbackRecord.content.rating !== undefined) {
      const rating = parseFloat(feedbackRecord.content.rating);
      if (!isNaN(rating)) {
        // Assume ratings are on a 1-5 scale by default
        const scale = feedbackRecord.metadata.rating_scale || 5;
        feedbackRecord.content.normalized_rating = rating / scale;
      }
    }
    
    // Extract sentiment from text if present
    if (feedbackRecord.content.text && !feedbackRecord.content.sentiment) {
      feedbackRecord.content.sentiment = this.extractSentiment(feedbackRecord.content.text);
    }
    
    // Add user feedback specific metadata
    feedbackRecord.metadata.feedback_type = 'explicit';
    feedbackRecord.metadata.user_provided = true;
  }
  
  /**
   * Process system feedback
   * 
   * @param {Object} feedbackRecord - Feedback record to process
   * @private
   */
  processSystemFeedback(feedbackRecord) {
    // Ensure metrics are present
    if (!feedbackRecord.content.metrics) {
      feedbackRecord.content.metrics = {};
    }
    
    // Add system feedback specific metadata
    feedbackRecord.metadata.feedback_type = 'system';
    feedbackRecord.metadata.system_generated = true;
    
    // Add system component information if available
    if (feedbackRecord.source.id) {
      feedbackRecord.metadata.system_component = feedbackRecord.source.id;
    }
  }
  
  /**
   * Process observer feedback
   * 
   * @param {Object} feedbackRecord - Feedback record to process
   * @private
   */
  processObserverFeedback(feedbackRecord) {
    // Add observer feedback specific metadata
    feedbackRecord.metadata.feedback_type = 'observation';
    feedbackRecord.metadata.observer_generated = true;
    
    // Add observer information
    feedbackRecord.metadata.observer_id = feedbackRecord.source.id;
    
    // Add constitutional verification if this is from a constitutional observer
    if (['prism', 'vigil'].includes(feedbackRecord.source.id.toLowerCase())) {
      feedbackRecord.metadata.constitutional_verification = true;
      feedbackRecord.metadata.verification_type = feedbackRecord.source.id.toLowerCase();
    }
  }
  
  /**
   * Process outcome feedback
   * 
   * @param {Object} feedbackRecord - Feedback record to process
   * @private
   */
  processOutcomeFeedback(feedbackRecord) {
    // Ensure outcome is present
    if (!feedbackRecord.content.outcome) {
      this.logger.warn('Outcome feedback missing outcome data', { feedbackId: feedbackRecord.id });
      feedbackRecord.content.outcome = { success: false };
    }
    
    // Normalize outcome success to boolean
    if (feedbackRecord.content.outcome.success === undefined) {
      // Try to infer success from other properties
      if (feedbackRecord.content.outcome.status) {
        feedbackRecord.content.outcome.success = 
          ['success', 'completed', 'done'].includes(feedbackRecord.content.outcome.status.toLowerCase());
      } else if (feedbackRecord.content.outcome.result) {
        feedbackRecord.content.outcome.success = !!feedbackRecord.content.outcome.result;
      }
    }
    
    // Add outcome feedback specific metadata
    feedbackRecord.metadata.feedback_type = 'outcome';
    feedbackRecord.metadata.outcome_generated = true;
    
    // Calculate outcome quality if metrics are available
    if (feedbackRecord.content.metrics) {
      feedbackRecord.content.quality = this.calculateOutcomeQuality(
        feedbackRecord.content.outcome,
        feedbackRecord.content.metrics
      );
    }
  }
  
  /**
   * Extract sentiment from text
   * 
   * @param {string} text - Text to analyze
   * @returns {Object} Sentiment analysis result
   * @private
   */
  extractSentiment(text) {
    // Simple sentiment analysis based on keywords
    // In a real implementation, this would use a more sophisticated NLP approach
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'helpful', 'useful', 'like', 'love'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'unhelpful', 'useless', 'dislike', 'hate'];
    
    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) {
        positiveCount += matches.length;
      }
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) {
        negativeCount += matches.length;
      }
    });
    
    const total = positiveCount + negativeCount;
    const score = total > 0 ? (positiveCount - negativeCount) / total : 0;
    
    return {
      score: (score + 1) / 2, // Normalize to 0-1 range
      positive: positiveCount > negativeCount,
      negative: negativeCount > positiveCount,
      neutral: positiveCount === negativeCount
    };
  }
  
  /**
   * Calculate outcome quality based on outcome and metrics
   * 
   * @param {Object} outcome - Outcome data
   * @param {Object} metrics - Metrics data
   * @returns {number} Quality score (0-1)
   * @private
   */
  calculateOutcomeQuality(outcome, metrics) {
    // Start with base quality based on success
    let quality = outcome.success ? 0.7 : 0.3;
    
    // Adjust based on available metrics
    if (metrics.accuracy !== undefined) {
      quality = quality * 0.5 + parseFloat(metrics.accuracy) * 0.5;
    }
    
    if (metrics.time_efficiency !== undefined) {
      quality = quality * 0.8 + parseFloat(metrics.time_efficiency) * 0.2;
    }
    
    if (metrics.resource_efficiency !== undefined) {
      quality = quality * 0.8 + parseFloat(metrics.resource_efficiency) * 0.2;
    }
    
    // Ensure quality is in 0-1 range
    return Math.max(0, Math.min(1, quality));
  }
}

module.exports = {
  FeedbackCollector
};
