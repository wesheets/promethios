/**
 * Tool Selection History Module
 * 
 * This module tracks agent tool usage patterns, effectiveness, and outcomes
 * to improve tool selection efficiency over time. It transforms Promethios
 * from a reactive to a learning system by creating a memory of when and why
 * specific tools succeed or fail in different contexts.
 * 
 * @module tool_selection_history
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');
const { registerWithPhaseChangeTracker } = require('../../tools/phase-change-tracker');

// Import components
const { ToolUsageTracker } = require('./tool_usage_tracker');
const { OutcomeEvaluator } = require('./outcome_evaluator');
const { PatternAnalyzer } = require('./pattern_analyzer');
const { RecommendationEngine } = require('./recommendation_engine');

/**
 * Tool Selection History Module main class
 */
class ToolSelectionHistory {
  /**
   * Create a new ToolSelectionHistory instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   * @param {Object} options.beliefTraceManager - Belief Trace Manager for PRISM integration
   * @param {Object} options.confidenceScoring - Confidence Scoring module for recommendation confidence
   */
  constructor(options) {
    this.logger = options.logger || console;
    this.config = options.config || {
      persistenceInterval: 60000, // 1 minute
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      samplingRate: 100, // 100%
      thresholds: {
        overuse: 0.8, // 80% usage rate for a single tool type
        underuse: 0.1, // 10% usage rate for a tool type
        inefficiency: 0.4 // 40% failure rate
      }
    };
    
    this.beliefTraceManager = options.beliefTraceManager;
    this.confidenceScoring = options.confidenceScoring;
    
    // Initialize components
    this.usageTracker = new ToolUsageTracker({
      logger: this.logger,
      config: this.config
    });
    
    this.outcomeEvaluator = new OutcomeEvaluator({
      logger: this.logger,
      config: this.config
    });
    
    this.patternAnalyzer = new PatternAnalyzer({
      logger: this.logger,
      config: this.config,
      usageTracker: this.usageTracker,
      outcomeEvaluator: this.outcomeEvaluator
    });
    
    this.recommendationEngine = new RecommendationEngine({
      logger: this.logger,
      config: this.config,
      patternAnalyzer: this.patternAnalyzer,
      confidenceScoring: this.confidenceScoring
    });
    
    // Setup persistence
    if (this.config.persistenceInterval > 0) {
      this.persistenceTimer = setInterval(() => {
        this.persistData();
      }, this.config.persistenceInterval);
    }
    
    // Register with Phase Change Tracker
    this._registerWithPhaseChangeTracker();
    
    this.logger.info('Tool Selection History module initialized');
  }
  
  /**
   * Registers the module with the Phase Change Tracker
   * @private
   */
  _registerWithPhaseChangeTracker() {
    try {
      registerWithPhaseChangeTracker({
        componentType: 'module',
        componentName: 'tool_selection_history',
        version: '1.0.0',
        apis: [
          { name: 'recordToolInvocation', version: '1.0.0', description: 'Records a tool invocation' },
          { name: 'updateOutcome', version: '1.0.0', description: 'Updates the outcome of a tool invocation' },
          { name: 'getToolRecommendation', version: '1.0.0', description: 'Gets a tool recommendation for a context' },
          { name: 'getToolUsagePatterns', version: '1.0.0', description: 'Gets tool usage patterns' },
          { name: 'getToolEfficiencyMetrics', version: '1.0.0', description: 'Gets tool efficiency metrics' }
        ]
      });
    } catch (error) {
      this.logger.error('Failed to register with Phase Change Tracker', { error: error.message });
    }
  }
  
  /**
   * Records a tool invocation
   * 
   * @param {string} toolId - Tool identifier
   * @param {Object} parameters - Parameters passed to the tool
   * @param {Object} context - Context of the invocation
   * @returns {Object} Tool invocation record
   */
  recordToolInvocation(toolId, parameters, context) {
    this.logger.info(`Recording tool invocation for ${toolId}`);
    
    // Create invocation record
    const invocationRecord = this.usageTracker.recordToolInvocation(toolId, parameters, context);
    
    return invocationRecord;
  }
  
  /**
   * Updates the outcome of a tool invocation
   * 
   * @param {string} invocationId - Invocation identifier
   * @param {Object} outcome - Outcome of the invocation
   * @returns {Object} Updated tool invocation record
   */
  updateOutcome(invocationId, outcome) {
    this.logger.info(`Updating outcome for invocation ${invocationId}`);
    
    // Update invocation record
    const updatedRecord = this.usageTracker.updateOutcome(invocationId, outcome);
    
    // Evaluate outcome
    this.outcomeEvaluator.evaluateOutcome(invocationId);
    
    // Update patterns if needed
    this.patternAnalyzer.updatePatterns(updatedRecord.toolId);
    
    return updatedRecord;
  }
  
  /**
   * Adds feedback to a tool invocation
   * 
   * @param {string} invocationId - Invocation identifier
   * @param {Object} feedback - Feedback for the invocation
   * @returns {Object} Updated tool invocation record
   */
  addFeedback(invocationId, feedback) {
    this.logger.info(`Adding feedback for invocation ${invocationId}`);
    
    // Add feedback to invocation record
    const updatedRecord = this.usageTracker.addFeedback(invocationId, feedback);
    
    // Re-evaluate outcome with feedback
    this.outcomeEvaluator.evaluateOutcome(invocationId);
    
    return updatedRecord;
  }
  
  /**
   * Gets a tool recommendation for a context
   * 
   * @param {Object} context - Context for the recommendation
   * @returns {Object} Tool recommendation
   */
  getToolRecommendation(context) {
    this.logger.info('Getting tool recommendation');
    
    // Get recommendation from engine
    const recommendation = this.recommendationEngine.getToolRecommendation(context);
    
    return recommendation;
  }
  
  /**
   * Gets tool usage patterns
   * 
   * @param {Object} options - Options for filtering patterns
   * @returns {Array} Tool usage patterns
   */
  getToolUsagePatterns(options = {}) {
    return this.patternAnalyzer.getToolUsagePatterns(options);
  }
  
  /**
   * Gets tool efficiency metrics
   * 
   * @param {string} toolId - Tool identifier (optional)
   * @param {Object} options - Options for filtering metrics
   * @returns {Object} Tool efficiency metrics
   */
  getToolEfficiencyMetrics(toolId, options = {}) {
    return this.patternAnalyzer.getToolEfficiencyMetrics(toolId, options);
  }
  
  /**
   * Detects tool overuse patterns
   * 
   * @param {number} threshold - Threshold for overuse detection (optional)
   * @returns {Array} Overuse patterns
   */
  detectToolOveruse(threshold) {
    return this.patternAnalyzer.detectToolOveruse(threshold);
  }
  
  /**
   * Detects tool underuse patterns
   * 
   * @param {number} threshold - Threshold for underuse detection (optional)
   * @returns {Array} Underuse patterns
   */
  detectToolUnderuse(threshold) {
    return this.patternAnalyzer.detectToolUnderuse(threshold);
  }
  
  /**
   * Generates insights from tool usage patterns
   * 
   * @param {Object} options - Options for insight generation
   * @returns {Array} Insights
   */
  generateInsights(options = {}) {
    return this.patternAnalyzer.generateInsights(options);
  }
  
  /**
   * Registers hooks with the Constitutional Hooks Manager
   * 
   * @param {Object} hooksManager - Constitutional Hooks Manager instance
   */
  registerHooks(hooksManager) {
    if (!hooksManager) {
      this.logger.warn('No hooks manager provided, skipping hook registration');
      return;
    }
    
    // Register hook for tool selection
    hooksManager.registerHook('tool_selection', (data) => {
      this.handleToolSelectionHook(data);
    });
    
    // Register hook for tool execution
    hooksManager.registerHook('tool_execution', (data) => {
      this.handleToolExecutionHook(data);
    });
    
    // Register hook for tool outcome
    hooksManager.registerHook('tool_outcome', (data) => {
      this.handleToolOutcomeHook(data);
    });
    
    this.logger.info('Tool Selection History hooks registered');
  }
  
  /**
   * Handles tool selection hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleToolSelectionHook(data) {
    if (!data || !data.toolId) return;
    
    // Record tool selection
    this.recordToolInvocation(data.toolId, data.parameters, data.context);
  }
  
  /**
   * Handles tool execution hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleToolExecutionHook(data) {
    if (!data || !data.invocationId) return;
    
    // Update execution metrics
    this.usageTracker.updateExecutionMetrics(data.invocationId, {
      executionTime: data.executionTime,
      resourceUsage: data.resourceUsage
    });
  }
  
  /**
   * Handles tool outcome hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleToolOutcomeHook(data) {
    if (!data || !data.invocationId) return;
    
    // Update outcome
    this.updateOutcome(data.invocationId, data.outcome);
  }
  
  /**
   * Persists data to storage
   */
  persistData() {
    this.logger.info('Persisting Tool Selection History data');
    
    // Persist component data
    this.usageTracker.persistData();
    this.patternAnalyzer.persistData();
    this.recommendationEngine.persistData();
  }
  
  /**
   * Integrates with PRISM observer
   * 
   * @param {Object} prismObserver - PRISM observer instance
   */
  integrateWithPrism(prismObserver) {
    if (!prismObserver) {
      this.logger.warn('No PRISM observer provided, skipping integration');
      return;
    }
    
    this.logger.info('Integrating with PRISM observer');
    
    // Store reference to PRISM
    this.prismObserver = prismObserver;
    
    // Integration logic will be implemented here
  }
  
  /**
   * Integrates with VIGIL observer
   * 
   * @param {Object} vigilObserver - VIGIL observer instance
   */
  integrateWithVigil(vigilObserver) {
    if (!vigilObserver) {
      this.logger.warn('No VIGIL observer provided, skipping integration');
      return;
    }
    
    this.logger.info('Integrating with VIGIL observer');
    
    // Store reference to VIGIL
    this.vigilObserver = vigilObserver;
    
    // Integration logic will be implemented here
  }
  
  /**
   * Integrates with Confidence Scoring module
   * 
   * @param {Object} confidenceScoring - Confidence Scoring module instance
   */
  integrateWithConfidenceScoring(confidenceScoring) {
    if (!confidenceScoring) {
      this.logger.warn('No Confidence Scoring module provided, skipping integration');
      return;
    }
    
    this.logger.info('Integrating with Confidence Scoring module');
    
    // Store reference to Confidence Scoring
    this.confidenceScoring = confidenceScoring;
    
    // Update recommendation engine
    this.recommendationEngine.setConfidenceScoring(confidenceScoring);
  }
  
  /**
   * Cleans up resources
   */
  cleanup() {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    
    // Persist data before cleanup
    this.persistData();
    
    this.logger.info('Tool Selection History module cleaned up');
  }
}

module.exports = {
  ToolSelectionHistory
};
