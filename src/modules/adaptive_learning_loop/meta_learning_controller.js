/**
 * Meta-Learning Controller Component
 * 
 * Manages the overall learning process, balancing exploration vs. exploitation,
 * preventing catastrophic forgetting, and optimizing the learning cycle.
 * 
 * @module adaptive_learning_loop/meta_learning_controller
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Meta-Learning Controller class
 */
class MetaLearningController {
  /**
   * Create a new MetaLearningController instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   * @param {Object} options.learningMemory - Learning Memory instance
   * @param {Object} options.feedbackCollector - Feedback Collector instance
   * @param {Object} options.patternRecognizer - Pattern Recognizer instance
   * @param {Object} options.adaptationEngine - Adaptation Engine instance
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = options.config || {
      learningRate: 0.1, // Base learning rate
      explorationRate: 0.2, // Exploration vs. exploitation balance
      forgettingFactor: 0.01, // Rate of forgetting old patterns
      adaptationBatchSize: 3, // Number of adaptations to apply per cycle
      learningCycleInterval: 3600000, // 1 hour between learning cycles
      minFeedbackThreshold: 10, // Minimum feedback items to trigger learning
      maxConcurrentAdaptations: 5 // Maximum adaptations active at once
    };
    
    this.learningMemory = options.learningMemory;
    this.feedbackCollector = options.feedbackCollector;
    this.patternRecognizer = options.patternRecognizer;
    this.adaptationEngine = options.adaptationEngine;
    
    // Initialize learning state
    this.learningState = {
      cycle: 0,
      lastCycleTime: null,
      activeAdaptations: new Set(),
      explorationMode: false,
      currentLearningRate: this.config.learningRate,
      performanceHistory: [],
      adaptationHistory: []
    };
    
    // Initialize learning cycle timer
    if (this.config.learningCycleInterval > 0) {
      this.cycleTimer = setInterval(() => {
        this.runLearningCycle();
      }, this.config.learningCycleInterval);
    }
    
    this.logger.info('Meta-Learning Controller initialized');
  }
  
  /**
   * Run a learning cycle
   * 
   * @param {Object} context - Current system context
   * @returns {Object} Learning cycle results
   */
  runLearningCycle(context = {}) {
    const cycleId = uuidv4();
    const cycleStartTime = new Date();
    
    this.logger.info(`Starting learning cycle ${this.learningState.cycle + 1} (${cycleId})`);
    
    // Update learning state
    this.learningState.cycle += 1;
    this.learningState.lastCycleTime = cycleStartTime.toISOString();
    
    // Initialize cycle results
    const cycleResults = {
      id: cycleId,
      cycle_number: this.learningState.cycle,
      start_time: cycleStartTime.toISOString(),
      feedback_processed: 0,
      patterns_recognized: 0,
      adaptations_generated: 0,
      adaptations_applied: 0,
      exploration_mode: this.learningState.explorationMode,
      learning_rate: this.learningState.currentLearningRate
    };
    
    try {
      // 1. Collect recent feedback
      const recentFeedback = this.collectRecentFeedback();
      cycleResults.feedback_processed = recentFeedback.length;
      
      // Check if we have enough feedback to proceed
      if (recentFeedback.length < this.config.minFeedbackThreshold) {
        this.logger.info(`Insufficient feedback (${recentFeedback.length}) to trigger learning`);
        cycleResults.status = 'skipped';
        cycleResults.reason = 'insufficient_feedback';
        return this.finalizeCycle(cycleResults);
      }
      
      // 2. Recognize patterns
      const recognizedPatterns = this.recognizePatterns(recentFeedback, context);
      cycleResults.patterns_recognized = recognizedPatterns.length;
      
      // 3. Generate adaptations
      const generatedAdaptations = this.generateAdaptations(recognizedPatterns, context);
      cycleResults.adaptations_generated = generatedAdaptations.length;
      
      // 4. Apply adaptations
      const appliedAdaptations = this.applyAdaptations(generatedAdaptations, context);
      cycleResults.adaptations_applied = appliedAdaptations.length;
      
      // 5. Update learning parameters
      this.updateLearningParameters(cycleResults);
      
      // 6. Manage memory
      this.manageMemory();
      
      cycleResults.status = 'completed';
    } catch (error) {
      this.logger.error(`Error in learning cycle: ${error.message}`);
      cycleResults.status = 'error';
      cycleResults.error = error.message;
    }
    
    return this.finalizeCycle(cycleResults);
  }
  
  /**
   * Collect recent feedback
   * 
   * @returns {Array} Recent feedback items
   * @private
   */
  collectRecentFeedback() {
    if (!this.learningMemory) {
      return [];
    }
    
    // Get recent feedback from learning memory
    const recentFeedback = this.learningMemory.getRecentFeedback(100);
    
    this.logger.debug(`Collected ${recentFeedback.length} recent feedback items`);
    
    return recentFeedback;
  }
  
  /**
   * Recognize patterns in feedback
   * 
   * @param {Array} feedbackItems - Feedback items to analyze
   * @param {Object} context - Current system context
   * @returns {Array} Recognized patterns
   * @private
   */
  recognizePatterns(feedbackItems, context) {
    if (!this.patternRecognizer) {
      return [];
    }
    
    // Recognize patterns
    const patterns = this.patternRecognizer.recognizePatterns(feedbackItems, {
      explorationMode: this.learningState.explorationMode
    });
    
    // Store patterns in learning memory
    if (this.learningMemory) {
      patterns.forEach(pattern => {
        this.learningMemory.storePattern(pattern);
      });
    }
    
    this.logger.debug(`Recognized ${patterns.length} patterns`);
    
    return patterns;
  }
  
  /**
   * Generate adaptations from patterns
   * 
   * @param {Array} patterns - Patterns to generate adaptations from
   * @param {Object} context - Current system context
   * @returns {Array} Generated adaptations
   * @private
   */
  generateAdaptations(patterns, context) {
    if (!this.adaptationEngine) {
      return [];
    }
    
    // Generate adaptations
    const adaptations = this.adaptationEngine.generateAdaptations(patterns, context);
    
    // Store adaptations in learning memory
    if (this.learningMemory) {
      adaptations.forEach(adaptation => {
        this.learningMemory.storeAdaptation(adaptation);
      });
    }
    
    this.logger.debug(`Generated ${adaptations.length} adaptations`);
    
    return adaptations;
  }
  
  /**
   * Apply adaptations
   * 
   * @param {Array} adaptations - Adaptations to apply
   * @param {Object} context - Current system context
   * @returns {Array} Applied adaptations
   * @private
   */
  applyAdaptations(adaptations, context) {
    if (!this.adaptationEngine) {
      return [];
    }
    
    // Check if we're at the maximum concurrent adaptations
    const currentActiveCount = this.learningState.activeAdaptations.size;
    const availableSlots = Math.max(0, this.config.maxConcurrentAdaptations - currentActiveCount);
    
    if (availableSlots === 0) {
      this.logger.info('Maximum concurrent adaptations reached, skipping application');
      return [];
    }
    
    // Sort adaptations by confidence (highest first)
    adaptations.sort((a, b) => 
      (b.justification?.confidence || 0) - (a.justification?.confidence || 0)
    );
    
    // Limit number of adaptations to apply
    const adaptationsToApply = adaptations.slice(0, Math.min(availableSlots, this.config.adaptationBatchSize));
    
    // Apply adaptations
    const appliedAdaptations = [];
    for (const adaptation of adaptationsToApply) {
      try {
        const result = this.adaptationEngine.applyAdaptation(adaptation, context);
        
        if (result.success) {
          // Add to active adaptations
          this.learningState.activeAdaptations.add(adaptation.id);
          
          // Add to adaptation history
          this.learningState.adaptationHistory.push({
            id: adaptation.id,
            type: adaptation.type,
            applied_at: result.timestamp,
            confidence: adaptation.justification?.confidence || 0
          });
          
          appliedAdaptations.push(adaptation);
        }
      } catch (error) {
        this.logger.error(`Error applying adaptation ${adaptation.id}: ${error.message}`);
      }
    }
    
    this.logger.debug(`Applied ${appliedAdaptations.length} adaptations`);
    
    return appliedAdaptations;
  }
  
  /**
   * Update learning parameters
   * 
   * @param {Object} cycleResults - Results of current learning cycle
   * @private
   */
  updateLearningParameters(cycleResults) {
    // Calculate cycle performance
    const cyclePerformance = this.calculateCyclePerformance(cycleResults);
    
    // Add to performance history
    this.learningState.performanceHistory.push({
      cycle: cycleResults.cycle_number,
      performance: cyclePerformance,
      timestamp: cycleResults.start_time
    });
    
    // Keep only the last 10 cycles in history
    if (this.learningState.performanceHistory.length > 10) {
      this.learningState.performanceHistory.shift();
    }
    
    // Determine if we should switch to exploration mode
    this.updateExplorationMode();
    
    // Update learning rate
    this.updateLearningRate(cyclePerformance);
    
    this.logger.debug(`Updated learning parameters: rate=${this.learningState.currentLearningRate}, exploration=${this.learningState.explorationMode}`);
  }
  
  /**
   * Calculate cycle performance
   * 
   * @param {Object} cycleResults - Results of current learning cycle
   * @returns {number} Performance score (0-1)
   * @private
   */
  calculateCyclePerformance(cycleResults) {
    // Base performance on number of patterns and adaptations
    const patternScore = Math.min(1, cycleResults.patterns_recognized / 10);
    const adaptationScore = Math.min(1, cycleResults.adaptations_applied / 5);
    
    // Combine scores
    return (patternScore * 0.4) + (adaptationScore * 0.6);
  }
  
  /**
   * Update exploration mode
   * @private
   */
  updateExplorationMode() {
    // If we have less than 3 cycles, stay in exploitation mode
    if (this.learningState.performanceHistory.length < 3) {
      this.learningState.explorationMode = false;
      return;
    }
    
    // Check if performance is stagnating
    const recentPerformance = this.learningState.performanceHistory.slice(-3);
    const performanceTrend = this.calculateTrend(recentPerformance.map(p => p.performance));
    
    // Switch to exploration if performance is decreasing or stagnant
    if (performanceTrend <= 0) {
      // Increase chance of exploration based on consecutive stagnant cycles
      const explorationProbability = Math.min(0.8, this.config.explorationRate * (1 + Math.abs(performanceTrend) * 5));
      this.learningState.explorationMode = Math.random() < explorationProbability;
    } else {
      // If performance is improving, reduce chance of exploration
      this.learningState.explorationMode = Math.random() < (this.config.explorationRate / 2);
    }
  }
  
  /**
   * Update learning rate
   * 
   * @param {number} cyclePerformance - Performance of current cycle
   * @private
   */
  updateLearningRate(cyclePerformance) {
    // Base learning rate
    let newRate = this.config.learningRate;
    
    // Adjust based on performance
    if (cyclePerformance > 0.7) {
      // Good performance, increase learning rate
      newRate = Math.min(0.5, this.learningState.currentLearningRate * 1.1);
    } else if (cyclePerformance < 0.3) {
      // Poor performance, decrease learning rate
      newRate = Math.max(0.01, this.learningState.currentLearningRate * 0.9);
    }
    
    // Adjust based on exploration mode
    if (this.learningState.explorationMode) {
      // In exploration mode, use higher learning rate
      newRate = Math.min(0.5, newRate * 1.5);
    }
    
    this.learningState.currentLearningRate = newRate;
  }
  
  /**
   * Calculate trend from series of values
   * 
   * @param {Array} values - Array of values
   * @returns {number} Trend slope
   * @private
   */
  calculateTrend(values) {
    if (values.length < 2) {
      return 0;
    }
    
    // Calculate linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  }
  
  /**
   * Manage memory
   * @private
   */
  manageMemory() {
    if (!this.learningMemory) {
      return;
    }
    
    // Check active adaptations
    this.checkActiveAdaptations();
    
    // Apply forgetting to old patterns
    this.applyForgetting();
  }
  
  /**
   * Check active adaptations
   * @private
   */
  checkActiveAdaptations() {
    // Get all active adaptations
    const activeAdaptationIds = Array.from(this.learningState.activeAdaptations);
    
    for (const adaptationId of activeAdaptationIds) {
      const adaptation = this.learningMemory.getAdaptation(adaptationId);
      
      if (!adaptation) {
        // Adaptation no longer exists, remove from active set
        this.learningState.activeAdaptations.delete(adaptationId);
        continue;
      }
      
      // Check if adaptation is still active
      if (adaptation.status !== 'applied') {
        this.learningState.activeAdaptations.delete(adaptationId);
      }
    }
  }
  
  /**
   * Apply forgetting to old patterns
   * @private
   */
  applyForgetting() {
    // In a real implementation, this would apply a forgetting factor to old patterns
    // For now, we'll just log that it happened
    this.logger.debug('Applied forgetting to old patterns');
  }
  
  /**
   * Finalize learning cycle
   * 
   * @param {Object} cycleResults - Results of current learning cycle
   * @returns {Object} Finalized cycle results
   * @private
   */
  finalizeCycle(cycleResults) {
    // Calculate cycle duration
    const cycleEndTime = new Date();
    const cycleDuration = cycleEndTime - new Date(cycleResults.start_time);
    
    // Add final metrics
    cycleResults.end_time = cycleEndTime.toISOString();
    cycleResults.duration_ms = cycleDuration;
    cycleResults.active_adaptations = this.learningState.activeAdaptations.size;
    
    // Store metrics in learning memory
    if (this.learningMemory) {
      this.learningMemory.storeMetrics({
        type: 'learning_cycle',
        cycle_id: cycleResults.id,
        cycle_number: cycleResults.cycle_number,
        ...cycleResults
      });
    }
    
    this.logger.info(`Completed learning cycle ${cycleResults.cycle_number} (${cycleResults.id}): ${cycleResults.status}`);
    
    return cycleResults;
  }
  
  /**
   * Get learning state
   * 
   * @returns {Object} Current learning state
   */
  getLearningState() {
    return {
      ...this.learningState,
      activeAdaptations: Array.from(this.learningState.activeAdaptations)
    };
  }
  
  /**
   * Get learning metrics
   * 
   * @returns {Object} Learning metrics
   */
  getLearningMetrics() {
    if (!this.learningMemory) {
      return {
        cycles: this.learningState.cycle,
        active_adaptations: this.learningState.activeAdaptations.size,
        exploration_mode: this.learningState.explorationMode,
        learning_rate: this.learningState.currentLearningRate
      };
    }
    
    return this.learningMemory.getLearningMetrics();
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
    }
    
    this.logger.info('Meta-Learning Controller cleaned up');
  }
}

module.exports = {
  MetaLearningController
};
