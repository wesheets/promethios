/**
 * Pattern Recognizer Component
 * 
 * Analyzes feedback and outcomes to identify patterns such as success/failure patterns,
 * context-specific performance analysis, temporal trend analysis, and causal relationship inference.
 * 
 * @module adaptive_learning_loop/pattern_recognizer
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Pattern Recognizer class
 */
class PatternRecognizer {
  /**
   * Create a new PatternRecognizer instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   * @param {Object} options.learningMemory - Learning Memory instance
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = options.config || {
      minSupportThreshold: 3, // Minimum number of occurrences to consider a pattern
      minConfidenceThreshold: 0.6, // Minimum confidence to consider a pattern valid
      significanceThreshold: 0.7, // Minimum significance to consider a pattern significant
      temporalDecayFactor: 0.9, // Factor for temporal decay of pattern significance
      maxPatternElements: 5 // Maximum number of elements in a pattern
    };
    
    this.learningMemory = options.learningMemory;
    
    // Initialize pattern analyzers
    this.analyzers = {
      correlation: this.analyzeCorrelationPatterns.bind(this),
      causal: this.analyzeCausalPatterns.bind(this),
      temporal: this.analyzeTemporalPatterns.bind(this),
      contextual: this.analyzeContextualPatterns.bind(this)
    };
    
    this.logger.info('Pattern Recognizer initialized');
  }
  
  /**
   * Recognize patterns in feedback and outcomes
   * 
   * @param {Array} feedbackItems - Array of feedback items to analyze
   * @param {Object} options - Pattern recognition options
   * @returns {Array} Recognized patterns
   */
  recognizePatterns(feedbackItems, options = {}) {
    this.logger.info(`Recognizing patterns in ${feedbackItems.length} feedback items`);
    
    if (!feedbackItems || feedbackItems.length === 0) {
      return [];
    }
    
    // Determine which analyzers to use
    const analyzerTypes = options.analyzerTypes || Object.keys(this.analyzers);
    
    // Run each analyzer
    const patterns = [];
    for (const analyzerType of analyzerTypes) {
      if (this.analyzers[analyzerType]) {
        try {
          const analyzerPatterns = this.analyzers[analyzerType](feedbackItems, options);
          patterns.push(...analyzerPatterns);
        } catch (error) {
          this.logger.error(`Error in ${analyzerType} analyzer: ${error.message}`);
        }
      }
    }
    
    // Filter out duplicate patterns
    const uniquePatterns = this.deduplicatePatterns(patterns);
    
    // Filter by significance threshold
    const significantPatterns = uniquePatterns.filter(pattern => 
      pattern.statistics && pattern.statistics.significance >= this.config.significanceThreshold
    );
    
    this.logger.info(`Recognized ${significantPatterns.length} significant patterns`);
    
    return significantPatterns;
  }
  
  /**
   * Analyze correlation patterns
   * 
   * @param {Array} feedbackItems - Array of feedback items to analyze
   * @param {Object} options - Analysis options
   * @returns {Array} Correlation patterns
   * @private
   */
  analyzeCorrelationPatterns(feedbackItems, options = {}) {
    this.logger.debug('Analyzing correlation patterns');
    
    const patterns = [];
    
    // Group feedback by context properties
    const contextGroups = this.groupByContextProperties(feedbackItems);
    
    // Analyze each context group
    for (const [contextKey, group] of Object.entries(contextGroups)) {
      if (group.items.length < this.config.minSupportThreshold) {
        continue;
      }
      
      // Calculate outcome distribution
      const outcomes = this.calculateOutcomeDistribution(group.items);
      
      // Check if there's a significant correlation
      for (const [outcome, distribution] of Object.entries(outcomes)) {
        if (distribution.count >= this.config.minSupportThreshold && 
            distribution.percentage >= this.config.minConfidenceThreshold) {
          
          // Create correlation pattern
          const pattern = {
            id: uuidv4(),
            discovery_timestamp: new Date().toISOString(),
            type: 'correlation',
            elements: [{
              factor: contextKey,
              value: group.value,
              weight: distribution.percentage
            }],
            outcome: {
              factor: 'result',
              value: outcome,
              desirability: outcome === 'success' ? 1.0 : 0.0
            },
            statistics: {
              confidence: distribution.percentage,
              support: distribution.count,
              significance: this.calculateSignificance(distribution.percentage, distribution.count)
            },
            metadata: {
              analyzer: 'correlation',
              feedbackCount: group.items.length
            }
          };
          
          patterns.push(pattern);
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Analyze causal patterns
   * 
   * @param {Array} feedbackItems - Array of feedback items to analyze
   * @param {Object} options - Analysis options
   * @returns {Array} Causal patterns
   * @private
   */
  analyzeCausalPatterns(feedbackItems, options = {}) {
    this.logger.debug('Analyzing causal patterns');
    
    const patterns = [];
    
    // Sort feedback by timestamp
    const sortedFeedback = [...feedbackItems].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Group feedback by decision ID
    const decisionGroups = {};
    for (const feedback of sortedFeedback) {
      const decisionId = feedback.context?.decision_id;
      if (decisionId) {
        if (!decisionGroups[decisionId]) {
          decisionGroups[decisionId] = [];
        }
        decisionGroups[decisionId].push(feedback);
      }
    }
    
    // Analyze each decision group
    for (const [decisionId, group] of Object.entries(decisionGroups)) {
      if (group.length < 2) {
        continue;
      }
      
      // Find action feedback and outcome feedback
      const actionFeedback = group.find(f => f.source?.type === 'system' || f.metadata?.feedback_type === 'system');
      const outcomeFeedback = group.find(f => f.source?.type === 'outcome' || f.metadata?.feedback_type === 'outcome');
      
      if (!actionFeedback || !outcomeFeedback) {
        continue;
      }
      
      // Extract action properties
      const actionProperties = this.extractActionProperties(actionFeedback);
      
      // Extract outcome properties
      const outcomeProperties = this.extractOutcomeProperties(outcomeFeedback);
      
      // Check for causal relationships
      for (const [actionKey, actionValue] of Object.entries(actionProperties)) {
        for (const [outcomeKey, outcomeValue] of Object.entries(outcomeProperties)) {
          // Check if this causal relationship appears in other decision groups
          let supportCount = 0;
          let totalCount = 0;
          
          for (const [otherDecisionId, otherGroup] of Object.entries(decisionGroups)) {
            if (otherDecisionId === decisionId) {
              continue;
            }
            
            const otherActionFeedback = otherGroup.find(f => f.source?.type === 'system' || f.metadata?.feedback_type === 'system');
            const otherOutcomeFeedback = otherGroup.find(f => f.source?.type === 'outcome' || f.metadata?.feedback_type === 'outcome');
            
            if (!otherActionFeedback || !otherOutcomeFeedback) {
              continue;
            }
            
            const otherActionProperties = this.extractActionProperties(otherActionFeedback);
            const otherOutcomeProperties = this.extractOutcomeProperties(otherOutcomeFeedback);
            
            if (otherActionProperties[actionKey] === actionValue) {
              totalCount++;
              if (otherOutcomeProperties[outcomeKey] === outcomeValue) {
                supportCount++;
              }
            }
          }
          
          // Calculate confidence
          const confidence = totalCount > 0 ? supportCount / totalCount : 0;
          
          // Create causal pattern if it meets thresholds
          if (supportCount >= this.config.minSupportThreshold && 
              confidence >= this.config.minConfidenceThreshold) {
            
            const pattern = {
              id: uuidv4(),
              discovery_timestamp: new Date().toISOString(),
              type: 'causal',
              elements: [{
                factor: actionKey,
                value: actionValue,
                weight: confidence
              }],
              outcome: {
                factor: outcomeKey,
                value: outcomeValue,
                desirability: this.determineOutcomeDesirability(outcomeKey, outcomeValue)
              },
              statistics: {
                confidence: confidence,
                support: supportCount,
                significance: this.calculateSignificance(confidence, supportCount)
              },
              metadata: {
                analyzer: 'causal',
                totalCount: totalCount,
                decisionId: decisionId
              }
            };
            
            patterns.push(pattern);
          }
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Analyze temporal patterns
   * 
   * @param {Array} feedbackItems - Array of feedback items to analyze
   * @param {Object} options - Analysis options
   * @returns {Array} Temporal patterns
   * @private
   */
  analyzeTemporalPatterns(feedbackItems, options = {}) {
    this.logger.debug('Analyzing temporal patterns');
    
    const patterns = [];
    
    // Sort feedback by timestamp
    const sortedFeedback = [...feedbackItems].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Group feedback by time windows
    const timeWindows = this.groupByTimeWindows(sortedFeedback, options.windowSize || 3600000); // Default: 1 hour
    
    // Analyze trends across time windows
    const trends = this.analyzeTrends(timeWindows);
    
    // Create patterns from significant trends
    for (const trend of trends) {
      if (trend.strength >= this.config.minConfidenceThreshold && 
          trend.supportCount >= this.config.minSupportThreshold) {
        
        const pattern = {
          id: uuidv4(),
          discovery_timestamp: new Date().toISOString(),
          type: 'temporal',
          elements: [{
            factor: 'time_trend',
            value: trend.direction,
            weight: trend.strength
          }, {
            factor: trend.metric,
            value: 'changing',
            weight: trend.strength
          }],
          outcome: {
            factor: trend.metric,
            value: trend.direction === 'increasing' ? 'higher' : 'lower',
            desirability: this.determineOutcomeDesirability(trend.metric, trend.direction)
          },
          statistics: {
            confidence: trend.strength,
            support: trend.supportCount,
            significance: this.calculateSignificance(trend.strength, trend.supportCount)
          },
          metadata: {
            analyzer: 'temporal',
            windowCount: trend.windowCount,
            startTime: trend.startTime,
            endTime: trend.endTime
          }
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }
  
  /**
   * Analyze contextual patterns
   * 
   * @param {Array} feedbackItems - Array of feedback items to analyze
   * @param {Object} options - Analysis options
   * @returns {Array} Contextual patterns
   * @private
   */
  analyzeContextualPatterns(feedbackItems, options = {}) {
    this.logger.debug('Analyzing contextual patterns');
    
    const patterns = [];
    
    // Extract context combinations
    const contextCombinations = this.extractContextCombinations(feedbackItems);
    
    // Analyze each context combination
    for (const [combinationKey, combination] of Object.entries(contextCombinations)) {
      if (combination.items.length < this.config.minSupportThreshold) {
        continue;
      }
      
      // Calculate outcome distribution
      const outcomes = this.calculateOutcomeDistribution(combination.items);
      
      // Check if there's a significant correlation
      for (const [outcome, distribution] of Object.entries(outcomes)) {
        if (distribution.count >= this.config.minSupportThreshold && 
            distribution.percentage >= this.config.minConfidenceThreshold) {
          
          // Create contextual pattern
          const pattern = {
            id: uuidv4(),
            discovery_timestamp: new Date().toISOString(),
            type: 'contextual',
            elements: combination.factors.map(factor => ({
              factor: factor.key,
              value: factor.value,
              weight: distribution.percentage / combination.factors.length
            })),
            outcome: {
              factor: 'result',
              value: outcome,
              desirability: outcome === 'success' ? 1.0 : 0.0
            },
            statistics: {
              confidence: distribution.percentage,
              support: distribution.count,
              significance: this.calculateSignificance(distribution.percentage, distribution.count)
            },
            metadata: {
              analyzer: 'contextual',
              feedbackCount: combination.items.length,
              factorCount: combination.factors.length
            }
          };
          
          patterns.push(pattern);
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Group feedback by context properties
   * 
   * @param {Array} feedbackItems - Array of feedback items
   * @returns {Object} Grouped feedback
   * @private
   */
  groupByContextProperties(feedbackItems) {
    const groups = {};
    
    for (const feedback of feedbackItems) {
      // Extract context properties
      const context = feedback.context || {};
      
      // Group by each context property
      for (const [key, value] of Object.entries(context)) {
        if (value === null || value === undefined || typeof value === 'object') {
          continue;
        }
        
        const groupKey = `${key}:${value}`;
        
        if (!groups[groupKey]) {
          groups[groupKey] = {
            key,
            value,
            items: []
          };
        }
        
        groups[groupKey].items.push(feedback);
      }
    }
    
    return groups;
  }
  
  /**
   * Calculate outcome distribution
   * 
   * @param {Array} feedbackItems - Array of feedback items
   * @returns {Object} Outcome distribution
   * @private
   */
  calculateOutcomeDistribution(feedbackItems) {
    const outcomes = {
      success: { count: 0, percentage: 0 },
      failure: { count: 0, percentage: 0 },
      neutral: { count: 0, percentage: 0 }
    };
    
    let totalCount = 0;
    
    for (const feedback of feedbackItems) {
      let outcome = 'neutral';
      
      // Determine outcome from feedback
      if (feedback.content?.outcome?.success === true) {
        outcome = 'success';
      } else if (feedback.content?.outcome?.success === false) {
        outcome = 'failure';
      } else if (feedback.content?.rating !== undefined) {
        const rating = parseFloat(feedback.content.rating);
        const normalizedRating = feedback.content.normalized_rating !== undefined 
          ? feedback.content.normalized_rating 
          : (rating / 5); // Assume 5-point scale
        
        if (normalizedRating >= 0.7) {
          outcome = 'success';
        } else if (normalizedRating <= 0.3) {
          outcome = 'failure';
        }
      } else if (feedback.content?.sentiment) {
        if (feedback.content.sentiment.positive) {
          outcome = 'success';
        } else if (feedback.content.sentiment.negative) {
          outcome = 'failure';
        }
      }
      
      outcomes[outcome].count++;
      totalCount++;
    }
    
    // Calculate percentages
    if (totalCount > 0) {
      for (const outcome of Object.values(outcomes)) {
        outcome.percentage = outcome.count / totalCount;
      }
    }
    
    return outcomes;
  }
  
  /**
   * Extract action properties from feedback
   * 
   * @param {Object} feedback - Feedback to extract from
   * @returns {Object} Action properties
   * @private
   */
  extractActionProperties(feedback) {
    const properties = {};
    
    // Extract from content
    if (feedback.content) {
      if (feedback.content.action) {
        properties.action_type = feedback.content.action.type;
        properties.action_target = feedback.content.action.target;
      }
      
      if (feedback.content.tool) {
        properties.tool_id = feedback.content.tool.id;
        properties.tool_category = feedback.content.tool.category;
      }
      
      if (feedback.content.parameters) {
        for (const [key, value] of Object.entries(feedback.content.parameters)) {
          if (typeof value !== 'object') {
            properties[`param_${key}`] = value;
          }
        }
      }
    }
    
    // Extract from context
    if (feedback.context) {
      if (feedback.context.task_id) {
        properties.task_id = feedback.context.task_id;
      }
      
      if (feedback.context.environmental_factors) {
        for (const [key, value] of Object.entries(feedback.context.environmental_factors)) {
          if (typeof value !== 'object') {
            properties[`env_${key}`] = value;
          }
        }
      }
    }
    
    return properties;
  }
  
  /**
   * Extract outcome properties from feedback
   * 
   * @param {Object} feedback - Feedback to extract from
   * @returns {Object} Outcome properties
   * @private
   */
  extractOutcomeProperties(feedback) {
    const properties = {};
    
    // Extract from content
    if (feedback.content) {
      if (feedback.content.outcome) {
        properties.success = feedback.content.outcome.success;
        properties.status = feedback.content.outcome.status;
        
        if (feedback.content.outcome.result) {
          properties.result = feedback.content.outcome.result;
        }
      }
      
      if (feedback.content.metrics) {
        for (const [key, value] of Object.entries(feedback.content.metrics)) {
          if (typeof value !== 'object') {
            properties[`metric_${key}`] = value;
          }
        }
      }
      
      if (feedback.content.quality !== undefined) {
        properties.quality = feedback.content.quality;
      }
    }
    
    return properties;
  }
  
  /**
   * Group feedback by time windows
   * 
   * @param {Array} feedbackItems - Array of feedback items
   * @param {number} windowSize - Size of time window in milliseconds
   * @returns {Array} Time windows
   * @private
   */
  groupByTimeWindows(feedbackItems, windowSize) {
    if (feedbackItems.length === 0) {
      return [];
    }
    
    // Sort by timestamp
    const sortedFeedback = [...feedbackItems].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const windows = [];
    let currentWindow = {
      startTime: new Date(sortedFeedback[0].timestamp),
      endTime: new Date(new Date(sortedFeedback[0].timestamp).getTime() + windowSize),
      items: []
    };
    
    for (const feedback of sortedFeedback) {
      const feedbackTime = new Date(feedback.timestamp);
      
      // Check if feedback belongs to current window
      if (feedbackTime <= currentWindow.endTime) {
        currentWindow.items.push(feedback);
      } else {
        // Save current window
        windows.push(currentWindow);
        
        // Create new window
        currentWindow = {
          startTime: new Date(currentWindow.endTime),
          endTime: new Date(currentWindow.endTime.getTime() + windowSize),
          items: [feedback]
        };
      }
    }
    
    // Add last window
    if (currentWindow.items.length > 0) {
      windows.push(currentWindow);
    }
    
    return windows;
  }
  
  /**
   * Analyze trends across time windows
   * 
   * @param {Array} timeWindows - Array of time windows
   * @returns {Array} Trends
   * @private
   */
  analyzeTrends(timeWindows) {
    if (timeWindows.length < 3) {
      return [];
    }
    
    const trends = [];
    
    // Calculate metrics for each window
    const windowMetrics = timeWindows.map(window => {
      const outcomes = this.calculateOutcomeDistribution(window.items);
      
      return {
        startTime: window.startTime,
        endTime: window.endTime,
        count: window.items.length,
        successRate: outcomes.success.percentage,
        failureRate: outcomes.failure.percentage
      };
    });
    
    // Analyze success rate trend
    const successTrend = this.calculateTrend(windowMetrics.map(m => m.successRate));
    if (successTrend.direction !== 'stable') {
      trends.push({
        metric: 'success_rate',
        direction: successTrend.direction,
        strength: Math.abs(successTrend.slope),
        supportCount: windowMetrics.reduce((sum, m) => sum + m.count, 0),
        windowCount: windowMetrics.length,
        startTime: windowMetrics[0].startTime.toISOString(),
        endTime: windowMetrics[windowMetrics.length - 1].endTime.toISOString()
      });
    }
    
    // Analyze failure rate trend
    const failureTrend = this.calculateTrend(windowMetrics.map(m => m.failureRate));
    if (failureTrend.direction !== 'stable') {
      trends.push({
        metric: 'failure_rate',
        direction: failureTrend.direction,
        strength: Math.abs(failureTrend.slope),
        supportCount: windowMetrics.reduce((sum, m) => sum + m.count, 0),
        windowCount: windowMetrics.length,
        startTime: windowMetrics[0].startTime.toISOString(),
        endTime: windowMetrics[windowMetrics.length - 1].endTime.toISOString()
      });
    }
    
    // Analyze feedback volume trend
    const volumeTrend = this.calculateTrend(windowMetrics.map(m => m.count));
    if (volumeTrend.direction !== 'stable') {
      trends.push({
        metric: 'feedback_volume',
        direction: volumeTrend.direction,
        strength: Math.abs(volumeTrend.slope),
        supportCount: windowMetrics.reduce((sum, m) => sum + m.count, 0),
        windowCount: windowMetrics.length,
        startTime: windowMetrics[0].startTime.toISOString(),
        endTime: windowMetrics[windowMetrics.length - 1].endTime.toISOString()
      });
    }
    
    return trends;
  }
  
  /**
   * Calculate trend from series of values
   * 
   * @param {Array} values - Array of values
   * @returns {Object} Trend information
   * @private
   */
  calculateTrend(values) {
    if (values.length < 3) {
      return { direction: 'stable', slope: 0 };
    }
    
    // Calculate linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Determine direction
    let direction = 'stable';
    if (slope > 0.05) {
      direction = 'increasing';
    } else if (slope < -0.05) {
      direction = 'decreasing';
    }
    
    return { direction, slope };
  }
  
  /**
   * Extract context combinations
   * 
   * @param {Array} feedbackItems - Array of feedback items
   * @returns {Object} Context combinations
   * @private
   */
  extractContextCombinations(feedbackItems) {
    const combinations = {};
    
    for (const feedback of feedbackItems) {
      const context = feedback.context || {};
      
      // Extract context factors
      const factors = [];
      for (const [key, value] of Object.entries(context)) {
        if (value === null || value === undefined || typeof value === 'object') {
          continue;
        }
        
        factors.push({ key, value });
      }
      
      // Generate combinations (up to max elements)
      for (let i = 2; i <= Math.min(factors.length, this.config.maxPatternElements); i++) {
        this.generateCombinations(factors, i).forEach(combination => {
          // Create combination key
          const combinationKey = combination
            .map(factor => `${factor.key}:${factor.value}`)
            .sort()
            .join('|');
          
          if (!combinations[combinationKey]) {
            combinations[combinationKey] = {
              factors: combination,
              items: []
            };
          }
          
          combinations[combinationKey].items.push(feedback);
        });
      }
    }
    
    return combinations;
  }
  
  /**
   * Generate combinations of factors
   * 
   * @param {Array} factors - Array of factors
   * @param {number} size - Size of combinations
   * @returns {Array} Array of combinations
   * @private
   */
  generateCombinations(factors, size) {
    if (size === 0) {
      return [[]];
    }
    
    if (factors.length === 0) {
      return [];
    }
    
    const firstFactor = factors[0];
    const restFactors = factors.slice(1);
    
    const combinationsWithoutFirst = this.generateCombinations(restFactors, size);
    const combinationsWithFirst = this.generateCombinations(restFactors, size - 1)
      .map(combination => [firstFactor, ...combination]);
    
    return [...combinationsWithoutFirst, ...combinationsWithFirst];
  }
  
  /**
   * Determine outcome desirability
   * 
   * @param {string} factor - Outcome factor
   * @param {*} value - Outcome value
   * @returns {number} Desirability score (0-1)
   * @private
   */
  determineOutcomeDesirability(factor, value) {
    // Success-related outcomes
    if (factor === 'success' || factor === 'result') {
      if (value === true || value === 'success') {
        return 1.0;
      } else if (value === false || value === 'failure') {
        return 0.0;
      }
    }
    
    // Rate-related outcomes
    if (factor === 'success_rate') {
      if (value === 'increasing') {
        return 1.0;
      } else if (value === 'decreasing') {
        return 0.0;
      }
    }
    
    if (factor === 'failure_rate') {
      if (value === 'increasing') {
        return 0.0;
      } else if (value === 'decreasing') {
        return 1.0;
      }
    }
    
    // Quality-related outcomes
    if (factor === 'quality' || factor.includes('quality')) {
      if (typeof value === 'number') {
        return value;
      } else if (value === 'high' || value === 'higher') {
        return 1.0;
      } else if (value === 'low' || value === 'lower') {
        return 0.0;
      }
    }
    
    // Efficiency-related outcomes
    if (factor.includes('efficiency')) {
      if (typeof value === 'number') {
        return value;
      } else if (value === 'high' || value === 'higher') {
        return 1.0;
      } else if (value === 'low' || value === 'lower') {
        return 0.0;
      }
    }
    
    // Default to neutral
    return 0.5;
  }
  
  /**
   * Calculate pattern significance
   * 
   * @param {number} confidence - Pattern confidence
   * @param {number} support - Pattern support count
   * @returns {number} Significance score (0-1)
   * @private
   */
  calculateSignificance(confidence, support) {
    // Base significance on confidence and support
    const confidenceWeight = 0.7;
    const supportWeight = 0.3;
    
    // Normalize support (diminishing returns after min threshold)
    const normalizedSupport = Math.min(1.0, (support - this.config.minSupportThreshold + 1) / 10);
    
    // Calculate significance
    const significance = (confidence * confidenceWeight) + (normalizedSupport * supportWeight);
    
    return Math.min(1.0, significance);
  }
  
  /**
   * Deduplicate patterns
   * 
   * @param {Array} patterns - Array of patterns
   * @returns {Array} Deduplicated patterns
   * @private
   */
  deduplicatePatterns(patterns) {
    const uniquePatterns = [];
    const patternKeys = new Set();
    
    for (const pattern of patterns) {
      // Create pattern key
      const elementKey = pattern.elements
        .map(e => `${e.factor}:${e.value}`)
        .sort()
        .join('|');
      
      const outcomeKey = `${pattern.outcome.factor}:${pattern.outcome.value}`;
      const patternKey = `${pattern.type}|${elementKey}|${outcomeKey}`;
      
      // Check if pattern is unique
      if (!patternKeys.has(patternKey)) {
        patternKeys.add(patternKey);
        uniquePatterns.push(pattern);
      } else {
        // If duplicate, keep the one with higher significance
        const existingIndex = uniquePatterns.findIndex(p => {
          const eKey = p.elements
            .map(e => `${e.factor}:${e.value}`)
            .sort()
            .join('|');
          
          const oKey = `${p.outcome.factor}:${p.outcome.value}`;
          const pKey = `${p.type}|${eKey}|${oKey}`;
          
          return pKey === patternKey;
        });
        
        if (existingIndex >= 0 && 
            pattern.statistics.significance > uniquePatterns[existingIndex].statistics.significance) {
          uniquePatterns[existingIndex] = pattern;
        }
      }
    }
    
    return uniquePatterns;
  }
  
  /**
   * Persist data to storage
   */
  persistData() {
    this.logger.info('Persisting pattern recognizer data');
    
    // No internal state to persist
  }
}

module.exports = {
  PatternRecognizer
};
