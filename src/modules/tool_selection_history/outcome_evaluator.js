/**
 * Outcome Evaluator Component - Fixed Version
 * 
 * Assesses tool execution outcomes, calculates success rates,
 * and identifies patterns in tool failures.
 * 
 * @module tool_selection_history/outcome_evaluator
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Outcome Evaluator class
 */
class OutcomeEvaluator {
  /**
   * Create a new OutcomeEvaluator instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options) {
    this.logger = options.logger || console;
    this.config = options.config || {
      dataPath: 'data/tool_selection_history/evaluations',
      successThreshold: 0.6, // 60% success rate is considered good
      failureThreshold: 0.4, // 40% failure rate is considered problematic
      minSampleSize: 5 // Minimum sample size for reliable evaluation
    };
    
    // Initialize storage
    this.evaluations = new Map();
    this.failurePatterns = new Map();
    
    // Create data directory if it doesn't exist
    this.dataPath = this.config.dataPath;
    try {
      if (!fs.existsSync(this.dataPath)) {
        fs.mkdirSync(this.dataPath, { recursive: true });
        this.logger.info(`Created data directory: ${this.dataPath}`);
      }
    } catch (error) {
      this.logger.error('Failed to create data directory', { error: error.message });
    }
    
    this.logger.info('Outcome Evaluator initialized');
  }
  
  /**
   * Evaluates the outcome of a tool invocation
   * 
   * @param {string} invocationId - Invocation identifier
   * @param {Object} invocationRecord - Tool invocation record (optional)
   * @returns {Object} Evaluation result
   */
  evaluateOutcome(invocationId, invocationRecord = null) {
    // If invocation record is not provided, it should be retrieved from the Tool Usage Tracker
    // For this implementation, we'll assume it's provided
    if (!invocationRecord) {
      this.logger.warn('Invocation record not provided for evaluation', { invocationId });
      return null;
    }
    
    // Skip evaluation if outcome is not available
    if (!invocationRecord.outcome) {
      this.logger.debug('Outcome not available for evaluation', { invocationId });
      return null;
    }
    
    // Create evaluation result
    const evaluationId = `eval-${invocationId}`;
    const timestamp = Date.now();
    
    const evaluationResult = {
      id: evaluationId,
      invocationId: invocationId,
      toolId: invocationRecord.toolId,
      toolType: invocationRecord.toolType,
      timestamp: timestamp,
      outcome: invocationRecord.outcome,
      success: this._determineSuccess(invocationRecord.outcome),
      efficiency: this._calculateEfficiency(invocationRecord),
      qualityScore: this._calculateQualityScore(invocationRecord),
      contextRelevance: this._evaluateContextRelevance(invocationRecord),
      feedback: invocationRecord.feedback,
      failureAnalysis: invocationRecord.outcome.status === 'failure' ? 
        this._analyzeFailure(invocationRecord) : null,
      metadata: {}
    };
    
    // Store evaluation result
    this.evaluations.set(evaluationId, evaluationResult);
    
    // Update failure patterns if applicable
    if (!evaluationResult.success) {
      this._updateFailurePatterns(invocationRecord);
    }
    
    this.logger.debug('Tool invocation outcome evaluated', { 
      invocationId, 
      success: evaluationResult.success,
      efficiency: evaluationResult.efficiency
    });
    
    return evaluationResult;
  }
  
  /**
   * Calculates the success rate for a tool
   * 
   * @param {string} toolId - Tool identifier
   * @param {Object} contextFilter - Context filter for success rate calculation
   * @returns {number} Success rate (0.0 to 1.0)
   */
  calculateSuccessRate(toolId, contextFilter = {}) {
    // Get all evaluations for this tool
    const toolEvaluations = Array.from(this.evaluations.values())
      .filter(evaluation => evaluation.toolId === toolId);
    
    // Apply context filter if provided
    let filteredEvaluations = toolEvaluations;
    if (Object.keys(contextFilter).length > 0) {
      filteredEvaluations = toolEvaluations.filter(evaluation => {
        // Check if the invocation context matches the filter
        // This is a simplified implementation
        for (const [key, value] of Object.entries(contextFilter)) {
          if (!evaluation.context || evaluation.context[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    // Calculate success rate
    if (filteredEvaluations.length === 0) {
      return null; // No data available
    }
    
    const successCount = filteredEvaluations.filter(evaluation => evaluation.success).length;
    return successCount / filteredEvaluations.length;
  }
  
  /**
   * Identifies patterns in tool failures
   * 
   * @param {string} toolId - Tool identifier
   * @returns {Array} Array of failure patterns
   */
  identifyFailurePatterns(toolId) {
    // Get failure patterns for this tool
    const patterns = this.failurePatterns.get(toolId) || [];
    
    // Sort by frequency (most frequent first)
    return [...patterns].sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Compares outcomes between two tools
   * 
   * @param {string} toolId1 - First tool identifier
   * @param {string} toolId2 - Second tool identifier
   * @param {Object} contextFilter - Context filter for comparison
   * @returns {Object} Comparison result
   */
  compareOutcomes(toolId1, toolId2, contextFilter = {}) {
    const successRate1 = this.calculateSuccessRate(toolId1, contextFilter);
    const successRate2 = this.calculateSuccessRate(toolId2, contextFilter);
    
    // Get efficiency metrics
    const tool1Evaluations = Array.from(this.evaluations.values())
      .filter(evaluation => evaluation.toolId === toolId1);
    
    const tool2Evaluations = Array.from(this.evaluations.values())
      .filter(evaluation => evaluation.toolId === toolId2);
    
    const avgEfficiency1 = tool1Evaluations.length > 0 ?
      tool1Evaluations.reduce((sum, evaluation) => sum + evaluation.efficiency, 0) / tool1Evaluations.length :
      null;
    
    const avgEfficiency2 = tool2Evaluations.length > 0 ?
      tool2Evaluations.reduce((sum, evaluation) => sum + evaluation.efficiency, 0) / tool2Evaluations.length :
      null;
    
    // Calculate success rate difference with fixed precision
    let successRateDifference = null;
    if (successRate1 !== null && successRate2 !== null) {
      successRateDifference = parseFloat((successRate1 - successRate2).toFixed(2));
    }
    
    // Calculate efficiency difference with fixed precision
    let efficiencyDifference = null;
    if (avgEfficiency1 !== null && avgEfficiency2 !== null) {
      efficiencyDifference = parseFloat((avgEfficiency1 - avgEfficiency2).toFixed(2));
    }
    
    // Compare outcomes
    return {
      toolId1,
      toolId2,
      successRate1,
      successRate2,
      successRateDifference,
      avgEfficiency1,
      avgEfficiency2,
      efficiencyDifference,
      sampleSize1: tool1Evaluations.length,
      sampleSize2: tool2Evaluations.length,
      contextFilter,
      timestamp: Date.now()
    };
  }
  
  /**
   * Gets reliability metrics for a tool
   * 
   * @param {string} toolId - Tool identifier
   * @returns {Object} Reliability metrics
   */
  getToolReliabilityMetrics(toolId) {
    // Get all evaluations for this tool
    const toolEvaluations = Array.from(this.evaluations.values())
      .filter(evaluation => evaluation.toolId === toolId);
    
    if (toolEvaluations.length === 0) {
      return {
        toolId,
        sampleSize: 0,
        reliabilityScore: null,
        successRate: null,
        avgEfficiency: null,
        avgQualityScore: null,
        failurePatterns: []
      };
    }
    
    // Calculate metrics
    const successCount = toolEvaluations.filter(evaluation => evaluation.success).length;
    const successRate = successCount / toolEvaluations.length;
    
    const avgEfficiency = toolEvaluations.reduce((sum, evaluation) => sum + evaluation.efficiency, 0) / 
      toolEvaluations.length;
    
    const avgQualityScore = toolEvaluations.reduce((sum, evaluation) => sum + evaluation.qualityScore, 0) / 
      toolEvaluations.length;
    
    // Calculate reliability score (weighted combination of success rate, efficiency, and quality)
    const reliabilityScore = (
      successRate * 0.6 + 
      avgEfficiency * 0.3 + 
      avgQualityScore * 0.1
    );
    
    // Get failure patterns
    const failurePatterns = this.identifyFailurePatterns(toolId);
    
    return {
      toolId,
      sampleSize: toolEvaluations.length,
      reliabilityScore,
      successRate,
      avgEfficiency,
      avgQualityScore,
      failurePatterns: failurePatterns.slice(0, 5) // Top 5 failure patterns
    };
  }
  
  /**
   * Exports evaluation data
   * 
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {string} Exported data
   */
  exportEvaluationData(format = 'json') {
    const evaluations = Array.from(this.evaluations.values());
    
    if (format === 'json') {
      return JSON.stringify(evaluations);
    } else if (format === 'csv') {
      // Simple CSV export implementation
      const headers = [
        'id', 'invocationId', 'toolId', 'toolType', 'timestamp', 
        'success', 'efficiency', 'qualityScore'
      ];
      
      const rows = evaluations.map(evaluation => {
        return headers.map(header => {
          const value = evaluation[header];
          return value !== null && value !== undefined ? String(value) : '';
        }).join(',');
      });
      
      return [headers.join(','), ...rows].join('\n');
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * Determines if an outcome is successful
   * 
   * @param {Object} outcome - Outcome object
   * @returns {boolean} Whether the outcome is successful
   * @private
   */
  _determineSuccess(outcome) {
    // Simple implementation: success if status is 'success'
    return outcome.status === 'success';
  }
  
  /**
   * Calculates efficiency score for an invocation
   * 
   * @param {Object} invocationRecord - Tool invocation record
   * @returns {number} Efficiency score (0.0 to 1.0)
   * @private
   */
  _calculateEfficiency(invocationRecord) {
    // If execution time is not available, return default value
    if (!invocationRecord.executionTime) {
      return 0.5; // Default efficiency
    }
    
    // Calculate efficiency based on execution time
    // This is a simplified implementation
    // Lower execution time = higher efficiency
    
    // Assume 5000ms (5 seconds) is the baseline for average efficiency (0.5)
    const baselineTime = 5000;
    
    // Calculate efficiency score (inversely proportional to execution time)
    let efficiency = 1 - (invocationRecord.executionTime / (2 * baselineTime));
    
    // Clamp to range [0.0, 1.0]
    efficiency = Math.max(0, Math.min(1, efficiency));
    
    return efficiency;
  }
  
  /**
   * Calculates quality score for an invocation
   * 
   * @param {Object} invocationRecord - Tool invocation record
   * @returns {number} Quality score (0.0 to 1.0)
   * @private
   */
  _calculateQualityScore(invocationRecord) {
    // If feedback is available, use rating as quality score
    if (invocationRecord.feedback && invocationRecord.feedback.rating !== null) {
      return invocationRecord.feedback.rating;
    }
    
    // If outcome is not successful, quality is low
    if (invocationRecord.outcome && invocationRecord.outcome.status !== 'success') {
      return 0.2;
    }
    
    // Default quality score
    return 0.7;
  }
  
  /**
   * Evaluates context relevance for an invocation
   * 
   * @param {Object} invocationRecord - Tool invocation record
   * @returns {number} Context relevance score (0.0 to 1.0)
   * @private
   */
  _evaluateContextRelevance(invocationRecord) {
    // This is a placeholder implementation
    // In a real system, this would evaluate how appropriate the tool was for the context
    return 0.8;
  }
  
  /**
   * Analyzes failure for an invocation
   * 
   * @param {Object} invocationRecord - Tool invocation record
   * @returns {Object} Failure analysis
   * @private
   */
  _analyzeFailure(invocationRecord) {
    const outcome = invocationRecord.outcome;
    
    // Extract error information
    const errorCode = outcome.errorCode || 'unknown';
    const errorMessage = outcome.errorMessage || 'Unknown error';
    
    // Categorize error
    const errorCategory = this._categorizeError(errorCode, errorMessage);
    
    // Determine severity
    const severity = this._determineErrorSeverity(errorCategory, invocationRecord);
    
    // Suggest remediation
    const remediation = this._suggestRemediation(errorCategory, invocationRecord);
    
    return {
      errorCode,
      errorMessage,
      errorCategory,
      severity,
      remediation,
      timestamp: Date.now()
    };
  }
  
  /**
   * Categorizes an error
   * 
   * @param {string} errorCode - Error code
   * @param {string} errorMessage - Error message
   * @returns {string} Error category
   * @private
   */
  _categorizeError(errorCode, errorMessage) {
    // Simple error categorization based on error code or message
    const errorCodeLower = errorCode.toLowerCase();
    const errorMessageLower = errorMessage.toLowerCase();
    
    if (errorCodeLower.includes('auth') || errorMessageLower.includes('authentication')) {
      return 'authentication';
    } else if (errorCodeLower.includes('perm') || errorMessageLower.includes('permission')) {
      return 'permission';
    } else if (errorCodeLower.includes('timeout') || errorMessageLower.includes('timeout')) {
      return 'timeout';
    } else if (errorCodeLower.includes('not_found') || errorMessageLower.includes('not found')) {
      return 'not_found';
    } else if (errorCodeLower.includes('invalid') || errorMessageLower.includes('invalid')) {
      return 'invalid_input';
    } else if (errorCodeLower.includes('rate') || errorMessageLower.includes('rate limit')) {
      return 'rate_limit';
    } else {
      return 'other';
    }
  }
  
  /**
   * Determines error severity
   * 
   * @param {string} errorCategory - Error category
   * @param {Object} invocationRecord - Tool invocation record
   * @returns {string} Error severity ('low', 'medium', or 'high')
   * @private
   */
  _determineErrorSeverity(errorCategory, invocationRecord) {
    // Determine severity based on error category and context
    switch (errorCategory) {
      case 'authentication':
      case 'permission':
        return 'high';
      case 'timeout':
      case 'rate_limit':
        return 'medium';
      case 'invalid_input':
        return 'medium';
      case 'not_found':
        return 'low';
      default:
        return 'medium';
    }
  }
  
  /**
   * Suggests remediation for an error
   * 
   * @param {string} errorCategory - Error category
   * @param {Object} invocationRecord - Tool invocation record
   * @returns {string} Remediation suggestion
   * @private
   */
  _suggestRemediation(errorCategory, invocationRecord) {
    // Suggest remediation based on error category
    switch (errorCategory) {
      case 'authentication':
        return 'Check authentication credentials or refresh token';
      case 'permission':
        return 'Verify access permissions for the requested resource';
      case 'timeout':
        return 'Consider breaking operation into smaller steps or increasing timeout';
      case 'rate_limit':
        return 'Implement rate limiting or backoff strategy';
      case 'invalid_input':
        return 'Validate input parameters before sending';
      case 'not_found':
        return 'Verify resource exists or update resource identifier';
      default:
        return 'Review error details and tool documentation';
    }
  }
  
  /**
   * Updates failure patterns
   * 
   * @param {Object} invocationRecord - Tool invocation record
   * @private
   */
  _updateFailurePatterns(invocationRecord) {
    if (!invocationRecord.outcome || invocationRecord.outcome.status !== 'failure') {
      return;
    }
    
    const toolId = invocationRecord.toolId;
    const errorCategory = this._categorizeError(
      invocationRecord.outcome.errorCode || 'unknown',
      invocationRecord.outcome.errorMessage || 'Unknown error'
    );
    
    // Get existing patterns for this tool
    let toolPatterns = this.failurePatterns.get(toolId);
    if (!toolPatterns) {
      toolPatterns = [];
      this.failurePatterns.set(toolId, toolPatterns);
    }
    
    // Check if pattern already exists
    let pattern = toolPatterns.find(p => p.errorCategory === errorCategory);
    
    if (pattern) {
      // Update existing pattern
      pattern.frequency += 1;
      pattern.lastOccurrence = Date.now();
      
      // Add new example
      const newExample = {
        invocationId: invocationRecord.id || 'unknown',
        timestamp: Date.now(),
        errorMessage: invocationRecord.outcome.errorMessage || 'Unknown error'
      };
      
      if (!pattern.examples) {
        pattern.examples = [];
      }
      
      pattern.examples.push(newExample);
      
      // Limit examples to most recent 5
      if (pattern.examples.length > 5) {
        pattern.examples = pattern.examples.slice(-5);
      }
    } else {
      // Create new pattern
      pattern = {
        id: `pattern-${toolId}-${errorCategory}-${Date.now()}`,
        toolId,
        errorCategory,
        frequency: 1,
        firstOccurrence: Date.now(),
        lastOccurrence: Date.now(),
        examples: [{
          invocationId: invocationRecord.id || 'unknown',
          timestamp: Date.now(),
          errorMessage: invocationRecord.outcome.errorMessage || 'Unknown error'
        }]
      };
      
      toolPatterns.push(pattern);
    }
  }
  
  /**
   * Persists data to storage
   * @returns {boolean} Success status
   */
  persistData() {
    try {
      // Create data directory if it doesn't exist
      if (!fs.existsSync(this.dataPath)) {
        fs.mkdirSync(this.dataPath, { recursive: true });
      }
      
      // Convert evaluations to array
      const evaluationsArray = Array.from(this.evaluations.values());
      
      // Convert failure patterns to object
      const failurePatternsObj = {};
      for (const [toolId, patterns] of this.failurePatterns.entries()) {
        failurePatternsObj[toolId] = patterns;
      }
      
      // Create data object
      const data = {
        evaluations: evaluationsArray,
        failurePatterns: failurePatternsObj,
        timestamp: Date.now()
      };
      
      // Write to file
      const filePath = path.join(this.dataPath, 'outcome_evaluator_data.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      this.logger.info('Outcome Evaluator data persisted', { filePath });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to persist Outcome Evaluator data', { error: error.message });
      return false;
    }
  }
  
  /**
   * Loads data from storage
   * @returns {boolean} Success status
   */
  loadData() {
    try {
      const filePath = path.join(this.dataPath, 'outcome_evaluator_data.json');
      
      if (!fs.existsSync(filePath)) {
        this.logger.info('No persisted data found for Outcome Evaluator');
        return false;
      }
      
      // Read from file
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Load evaluations
      this.evaluations.clear();
      for (const evaluation of data.evaluations) {
        this.evaluations.set(evaluation.id, evaluation);
      }
      
      // Load failure patterns
      this.failurePatterns.clear();
      for (const [toolId, patterns] of Object.entries(data.failurePatterns)) {
        this.failurePatterns.set(toolId, patterns);
      }
      
      this.logger.info('Outcome Evaluator data loaded', { 
        evaluationCount: this.evaluations.size,
        patternCount: this.failurePatterns.size
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to load Outcome Evaluator data', { error: error.message });
      return false;
    }
  }
}

module.exports = {
  OutcomeEvaluator
};
