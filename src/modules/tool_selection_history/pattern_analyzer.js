/**
 * Pattern Analyzer Component
 * 
 * Identifies tool usage patterns, detects overuse and underuse scenarios,
 * analyzes efficiency metrics, and generates insights.
 * 
 * @module tool_selection_history/pattern_analyzer
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Pattern Analyzer class
 */
class PatternAnalyzer {
  /**
   * Create a new PatternAnalyzer instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   * @param {Object} options.usageTracker - Tool Usage Tracker instance
   * @param {Object} options.outcomeEvaluator - Outcome Evaluator instance
   */
  constructor(options) {
    this.logger = options.logger || console;
    this.config = options.config || {
      dataPath: 'data/tool_selection_history/patterns',
      overuseThreshold: 0.8, // 80% usage rate for a single tool type
      underuseThreshold: 0.1, // 10% usage rate for a tool type
      minSampleSize: 10, // Minimum sample size for pattern detection
      patternUpdateInterval: 3600000 // 1 hour
    };
    
    this.usageTracker = options.usageTracker;
    this.outcomeEvaluator = options.outcomeEvaluator;
    
    // Initialize storage
    this.usagePatterns = new Map();
    this.efficiencyMetrics = new Map();
    this.insights = [];
    
    // Create data directory if it doesn't exist
    this.dataPath = this.config.dataPath;
    try {
      if (!fs.existsSync(this.dataPath)) {
        fs.mkdirSync(this.dataPath, { recursive: true });
      }
    } catch (error) {
      this.logger.error('Failed to create data directory', { error: error.message });
    }
    
    // Setup pattern update interval
    if (this.config.patternUpdateInterval > 0) {
      this.patternUpdateTimer = setInterval(() => {
        this.updateAllPatterns();
      }, this.config.patternUpdateInterval);
    }
    
    this.logger.info('Pattern Analyzer initialized');
  }
  
  /**
   * Updates patterns for a specific tool
   * 
   * @param {string} toolId - Tool identifier
   * @returns {Object} Updated tool usage pattern
   */
  updatePatterns(toolId) {
    this.logger.debug(`Updating patterns for tool ${toolId}`);
    
    // Get tool usage history
    const usageHistory = this.usageTracker.getToolUsageHistory(toolId);
    
    if (usageHistory.length < this.config.minSampleSize) {
      this.logger.debug(`Insufficient data for pattern analysis: ${usageHistory.length} < ${this.config.minSampleSize}`);
      return null;
    }
    
    // Extract context patterns
    const contextPatterns = this._extractContextPatterns(usageHistory);
    
    // Calculate usage metrics
    const usageMetrics = this._calculateUsageMetrics(usageHistory);
    
    // Identify alternative tools
    const alternatives = this._identifyAlternatives(toolId, contextPatterns);
    
    // Create or update pattern
    const patternId = `pattern-${toolId}`;
    const timestamp = Date.now();
    
    const pattern = {
      id: patternId,
      toolId: toolId,
      toolType: usageHistory[0].toolType,
      contextPatterns,
      usageMetrics,
      alternatives,
      timestamp,
      sampleSize: usageHistory.length
    };
    
    // Store pattern
    this.usagePatterns.set(patternId, pattern);
    
    // Update efficiency metrics
    this._updateEfficiencyMetrics(toolId, usageHistory);
    
    // Generate insights
    this._generateInsightsForTool(toolId);
    
    this.logger.debug(`Patterns updated for tool ${toolId}`, {
      patternId,
      sampleSize: usageHistory.length
    });
    
    return pattern;
  }
  
  /**
   * Updates patterns for all tools
   */
  updateAllPatterns() {
    this.logger.info('Updating patterns for all tools');
    
    // Get all tool IDs from usage tracker
    const toolIds = Array.from(this.usageTracker.toolInvocationHistory.keys());
    
    // Update patterns for each tool
    for (const toolId of toolIds) {
      this.updatePatterns(toolId);
    }
    
    // Generate cross-tool insights
    this._generateCrossToolInsights();
  }
  
  /**
   * Gets tool usage patterns
   * 
   * @param {Object} options - Options for filtering patterns
   * @returns {Array} Tool usage patterns
   */
  getToolUsagePatterns(options = {}) {
    let patterns = Array.from(this.usagePatterns.values());
    
    // Apply filters
    if (options.toolId) {
      patterns = patterns.filter(pattern => pattern.toolId === options.toolId);
    }
    
    if (options.toolType) {
      patterns = patterns.filter(pattern => pattern.toolType === options.toolType);
    }
    
    if (options.minSampleSize) {
      patterns = patterns.filter(pattern => pattern.sampleSize >= options.minSampleSize);
    }
    
    if (options.minSuccessRate) {
      patterns = patterns.filter(pattern => 
        pattern.usageMetrics.successRate >= options.minSuccessRate
      );
    }
    
    // Sort by timestamp (newest first) by default
    patterns.sort((a, b) => b.timestamp - a.timestamp);
    
    return patterns;
  }
  
  /**
   * Detects tool overuse patterns
   * 
   * @param {number} threshold - Threshold for overuse detection (optional)
   * @returns {Array} Overuse patterns
   */
  detectToolOveruse(threshold = null) {
    const overuseThreshold = threshold || this.config.overuseThreshold;
    const overusePatterns = [];
    
    // Get all tool types and their usage counts
    const toolTypeCounts = new Map();
    let totalInvocations = 0;
    
    // Count invocations by tool type
    for (const [toolId, invocationIds] of this.usageTracker.toolInvocationHistory.entries()) {
      const invocations = invocationIds.map(id => this.usageTracker.getToolInvocation(id))
        .filter(record => record !== undefined);
      
      if (invocations.length === 0) continue;
      
      const toolType = invocations[0].toolType;
      
      if (!toolTypeCounts.has(toolType)) {
        toolTypeCounts.set(toolType, 0);
      }
      
      toolTypeCounts.set(toolType, toolTypeCounts.get(toolType) + invocations.length);
      totalInvocations += invocations.length;
    }
    
    // Check for overuse
    if (totalInvocations >= this.config.minSampleSize) {
      for (const [toolType, count] of toolTypeCounts.entries()) {
        const usageRate = count / totalInvocations;
        
        if (usageRate >= overuseThreshold) {
          // Get tools of this type
          const tools = Array.from(this.usagePatterns.values())
            .filter(pattern => pattern.toolType === toolType);
          
          overusePatterns.push({
            toolType,
            usageRate,
            count,
            totalInvocations,
            threshold: overuseThreshold,
            tools: tools.map(pattern => ({
              toolId: pattern.toolId,
              sampleSize: pattern.sampleSize,
              successRate: pattern.usageMetrics.successRate
            }))
          });
        }
      }
    }
    
    return overusePatterns;
  }
  
  /**
   * Detects tool underuse patterns
   * 
   * @param {number} threshold - Threshold for underuse detection (optional)
   * @returns {Array} Underuse patterns
   */
  detectToolUnderuse(threshold = null) {
    const underuseThreshold = threshold || this.config.underuseThreshold;
    const underusePatterns = [];
    
    // Get all tool types and their usage counts
    const toolTypeCounts = new Map();
    let totalInvocations = 0;
    
    // Count invocations by tool type
    for (const [toolId, invocationIds] of this.usageTracker.toolInvocationHistory.entries()) {
      const invocations = invocationIds.map(id => this.usageTracker.getToolInvocation(id))
        .filter(record => record !== undefined);
      
      if (invocations.length === 0) continue;
      
      const toolType = invocations[0].toolType;
      
      if (!toolTypeCounts.has(toolType)) {
        toolTypeCounts.set(toolType, 0);
      }
      
      toolTypeCounts.set(toolType, toolTypeCounts.get(toolType) + invocations.length);
      totalInvocations += invocations.length;
    }
    
    // Check for underuse
    if (totalInvocations >= this.config.minSampleSize) {
      // Get all known tool types (this is a simplified implementation)
      const knownToolTypes = [
        'search', 'data_retrieval', 'data_modification', 'calculation',
        'analysis', 'generation', 'execution', 'other'
      ];
      
      for (const toolType of knownToolTypes) {
        const count = toolTypeCounts.get(toolType) || 0;
        const usageRate = count / totalInvocations;
        
        if (usageRate <= underuseThreshold) {
          // Get tools of this type
          const tools = Array.from(this.usagePatterns.values())
            .filter(pattern => pattern.toolType === toolType);
          
          underusePatterns.push({
            toolType,
            usageRate,
            count,
            totalInvocations,
            threshold: underuseThreshold,
            tools: tools.map(pattern => ({
              toolId: pattern.toolId,
              sampleSize: pattern.sampleSize,
              successRate: pattern.usageMetrics ? pattern.usageMetrics.successRate : null
            }))
          });
        }
      }
    }
    
    return underusePatterns;
  }
  
  /**
   * Analyzes efficiency metrics for tools
   * 
   * @param {string} toolId - Tool identifier (optional)
   * @returns {Object} Tool efficiency metrics
   */
  getToolEfficiencyMetrics(toolId = null) {
    if (toolId) {
      // Return metrics for specific tool
      return this.efficiencyMetrics.get(toolId) || null;
    } else {
      // Return metrics for all tools
      return Array.from(this.efficiencyMetrics.values());
    }
  }
  
  /**
   * Compares tool efficiency
   * 
   * @param {string} toolId1 - First tool identifier
   * @param {string} toolId2 - Second tool identifier
   * @returns {Object} Comparison result
   */
  compareToolEfficiency(toolId1, toolId2) {
    const metrics1 = this.efficiencyMetrics.get(toolId1);
    const metrics2 = this.efficiencyMetrics.get(toolId2);
    
    if (!metrics1 || !metrics2) {
      throw new Error('Efficiency metrics not available for one or both tools');
    }
    
    // Compare overall metrics
    const overallComparison = {
      invocationCount: {
        tool1: metrics1.overallMetrics.invocationCount,
        tool2: metrics2.overallMetrics.invocationCount,
        difference: metrics1.overallMetrics.invocationCount - metrics2.overallMetrics.invocationCount
      },
      successRate: {
        tool1: metrics1.overallMetrics.successRate,
        tool2: metrics2.overallMetrics.successRate,
        difference: metrics1.overallMetrics.successRate - metrics2.overallMetrics.successRate
      },
      averageExecutionTime: {
        tool1: metrics1.overallMetrics.averageExecutionTime,
        tool2: metrics2.overallMetrics.averageExecutionTime,
        difference: metrics1.overallMetrics.averageExecutionTime - metrics2.overallMetrics.averageExecutionTime
      }
    };
    
    // Compare contextual metrics
    const contextualComparison = {};
    
    // Find common context types
    const contextTypes1 = metrics1.contextualMetrics.map(cm => cm.contextType);
    const contextTypes2 = metrics2.contextualMetrics.map(cm => cm.contextType);
    const commonContextTypes = contextTypes1.filter(ct => contextTypes2.includes(ct));
    
    for (const contextType of commonContextTypes) {
      const context1 = metrics1.contextualMetrics.find(cm => cm.contextType === contextType);
      const context2 = metrics2.contextualMetrics.find(cm => cm.contextType === contextType);
      
      contextualComparison[contextType] = {
        invocationCount: {
          tool1: context1.metrics.invocationCount,
          tool2: context2.metrics.invocationCount,
          difference: context1.metrics.invocationCount - context2.metrics.invocationCount
        },
        successRate: {
          tool1: context1.metrics.successRate,
          tool2: context2.metrics.successRate,
          difference: context1.metrics.successRate - context2.metrics.successRate
        },
        averageExecutionTime: {
          tool1: context1.metrics.averageExecutionTime,
          tool2: context2.metrics.averageExecutionTime,
          difference: context1.metrics.averageExecutionTime - context2.metrics.averageExecutionTime
        }
      };
    }
    
    return {
      toolId1,
      toolId2,
      overallComparison,
      contextualComparison,
      timestamp: Date.now()
    };
  }
  
  /**
   * Generates insights from tool usage patterns
   * 
   * @param {Object} options - Options for insight generation
   * @returns {Array} Insights
   */
  generateInsights(options = {}) {
    // Return existing insights, filtered by options
    let filteredInsights = [...this.insights];
    
    if (options.toolId) {
      filteredInsights = filteredInsights.filter(
        insight => insight.toolId === options.toolId
      );
    }
    
    if (options.toolType) {
      filteredInsights = filteredInsights.filter(
        insight => insight.toolType === options.toolType
      );
    }
    
    if (options.category) {
      filteredInsights = filteredInsights.filter(
        insight => insight.category === options.category
      );
    }
    
    if (options.minConfidence) {
      filteredInsights = filteredInsights.filter(
        insight => insight.confidence >= options.minConfidence
      );
    }
    
    // Sort by timestamp (newest first) by default
    filteredInsights.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if specified
    if (options.limit) {
      filteredInsights = filteredInsights.slice(0, options.limit);
    }
    
    return filteredInsights;
  }
  
  /**
   * Extracts context patterns from usage history
   * 
   * @param {Array} usageHistory - Tool usage history
   * @returns {Array} Context patterns
   * @private
   */
  _extractContextPatterns(usageHistory) {
    // Group by task type
    const taskGroups = new Map();
    
    for (const record of usageHistory) {
      const taskType = record.context.taskType || 'unknown';
      
      if (!taskGroups.has(taskType)) {
        taskGroups.set(taskType, []);
      }
      
      taskGroups.get(taskType).push(record);
    }
    
    // Extract patterns for each task type
    const contextPatterns = [];
    
    for (const [taskType, records] of taskGroups.entries()) {
      if (records.length >= 3) { // Minimum sample size for a pattern
        // Extract intent patterns
        const intentPatterns = this._extractIntentPatterns(records);
        
        // Extract conditions
        const conditions = this._extractConditions(records);
        
        contextPatterns.push({
          taskType,
          intentPatterns,
          conditions,
          sampleSize: records.length
        });
      }
    }
    
    return contextPatterns;
  }
  
  /**
   * Extracts intent patterns from usage records
   * 
   * @param {Array} records - Tool usage records
   * @returns {Array} Intent patterns
   * @private
   */
  _extractIntentPatterns(records) {
    // Count intents
    const intentCounts = new Map();
    
    for (const record of records) {
      const intent = record.context.intentId || 'unknown';
      
      if (!intentCounts.has(intent)) {
        intentCounts.set(intent, 0);
      }
      
      intentCounts.set(intent, intentCounts.get(intent) + 1);
    }
    
    // Convert to patterns
    return Array.from(intentCounts.entries())
      .filter(([_, count]) => count >= 2) // Minimum count for a pattern
      .map(([intent, count]) => ({
        intent,
        frequency: count / records.length
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Extracts conditions from usage records
   * 
   * @param {Array} records - Tool usage records
   * @returns {Object} Conditions
   * @private
   */
  _extractConditions(records) {
    // This is a simplified implementation
    // In a real system, this would use more sophisticated pattern recognition
    
    // Extract parameter patterns
    const parameterPatterns = {};
    
    // Check for common parameters
    const parameterNames = new Set();
    
    for (const record of records) {
      for (const paramName of Object.keys(record.parameters)) {
        parameterNames.add(paramName);
      }
    }
    
    for (const paramName of parameterNames) {
      const values = records
        .filter(record => record.parameters[paramName] !== undefined)
        .map(record => record.parameters[paramName]);
      
      if (values.length >= 3) { // Minimum sample size for a pattern
        parameterPatterns[paramName] = {
          present: values.length / records.length,
          types: this._extractValueTypes(values)
        };
      }
    }
    
    return {
      parameterPatterns,
      timeOfDay: this._extractTimeOfDayPattern(records),
      successConditions: this._extractSuccessConditions(records)
    };
  }
  
  /**
   * Extracts value types from parameter values
   * 
   * @param {Array} values - Parameter values
   * @returns {Object} Value types
   * @private
   */
  _extractValueTypes(values) {
    const types = new Map();
    
    for (const value of values) {
      const type = typeof value;
      
      if (!types.has(type)) {
        types.set(type, 0);
      }
      
      types.set(type, types.get(type) + 1);
    }
    
    return Array.from(types.entries())
      .map(([type, count]) => ({
        type,
        frequency: count / values.length
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Extracts time of day pattern from usage records
   * 
   * @param {Array} records - Tool usage records
   * @returns {Object} Time of day pattern
   * @private
   */
  _extractTimeOfDayPattern(records) {
    const hourCounts = new Array(24).fill(0);
    
    for (const record of records) {
      const hour = new Date(record.timestamp).getHours();
      hourCounts[hour]++;
    }
    
    return {
      hourDistribution: hourCounts.map(count => count / records.length),
      peakHour: hourCounts.indexOf(Math.max(...hourCounts))
    };
  }
  
  /**
   * Extracts success conditions from usage records
   * 
   * @param {Array} records - Tool usage records
   * @returns {Object} Success conditions
   * @private
   */
  _extractSuccessConditions(records) {
    // Split records by outcome
    const successRecords = records.filter(
      record => record.outcome && record.outcome.status === 'success'
    );
    
    const failureRecords = records.filter(
      record => record.outcome && record.outcome.status === 'failure'
    );
    
    if (successRecords.length === 0 || failureRecords.length === 0) {
      return null; // Not enough data for comparison
    }
    
    // Compare parameter patterns
    const parameterDifferences = {};
    
    // Get all parameter names
    const parameterNames = new Set();
    
    for (const record of [...successRecords, ...failureRecords]) {
      for (const paramName of Object.keys(record.parameters)) {
        parameterNames.add(paramName);
      }
    }
    
    for (const paramName of parameterNames) {
      const successValues = successRecords
        .filter(record => record.parameters[paramName] !== undefined)
        .map(record => record.parameters[paramName]);
      
      const failureValues = failureRecords
        .filter(record => record.parameters[paramName] !== undefined)
        .map(record => record.parameters[paramName]);
      
      if (successValues.length > 0 && failureValues.length > 0) {
        parameterDifferences[paramName] = {
          successPresence: successValues.length / successRecords.length,
          failurePresence: failureValues.length / failureRecords.length,
          presenceDifference: (successValues.length / successRecords.length) - 
                             (failureValues.length / failureRecords.length)
        };
      }
    }
    
    return {
      successRate: successRecords.length / records.length,
      parameterDifferences,
      timeFactors: this._compareTimeFactors(successRecords, failureRecords)
    };
  }
  
  /**
   * Compares time factors between success and failure records
   * 
   * @param {Array} successRecords - Successful tool usage records
   * @param {Array} failureRecords - Failed tool usage records
   * @returns {Object} Time factor comparison
   * @private
   */
  _compareTimeFactors(successRecords, failureRecords) {
    // Compare hour distribution
    const successHourCounts = new Array(24).fill(0);
    const failureHourCounts = new Array(24).fill(0);
    
    for (const record of successRecords) {
      const hour = new Date(record.timestamp).getHours();
      successHourCounts[hour]++;
    }
    
    for (const record of failureRecords) {
      const hour = new Date(record.timestamp).getHours();
      failureHourCounts[hour]++;
    }
    
    const successHourDistribution = successHourCounts.map(
      count => count / successRecords.length
    );
    
    const failureHourDistribution = failureHourCounts.map(
      count => count / failureRecords.length
    );
    
    // Find hours with significant differences
    const hourDifferences = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const difference = successHourDistribution[hour] - failureHourDistribution[hour];
      
      if (Math.abs(difference) >= 0.1) { // 10% difference threshold
        hourDifferences.push({
          hour,
          difference,
          successRate: successHourDistribution[hour],
          failureRate: failureHourDistribution[hour]
        });
      }
    }
    
    return {
      hourDifferences: hourDifferences.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    };
  }
  
  /**
   * Calculates usage metrics from usage history
   * 
   * @param {Array} usageHistory - Tool usage history
   * @returns {Object} Usage metrics
   * @private
   */
  _calculateUsageMetrics(usageHistory) {
    // Calculate success rate
    const successCount = usageHistory.filter(
      record => record.outcome && record.outcome.status === 'success'
    ).length;
    
    const successRate = usageHistory.length > 0 ? 
      successCount / usageHistory.length : 0;
    
    // Calculate average execution time
    const executionTimes = usageHistory
      .filter(record => record.executionTime !== null)
      .map(record => record.executionTime);
    
    const averageExecutionTime = executionTimes.length > 0 ?
      executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length : null;
    
    // Calculate average resource usage
    const resourceUsage = {
      memory: null,
      cpu: null,
      tokens: null
    };
    
    for (const resource of Object.keys(resourceUsage)) {
      const values = usageHistory
        .filter(record => record.resourceUsage && record.resourceUsage[resource] !== null)
        .map(record => record.resourceUsage[resource]);
      
      if (values.length > 0) {
        resourceUsage[resource] = values.reduce((sum, value) => sum + value, 0) / values.length;
      }
    }
    
    return {
      frequency: usageHistory.length,
      successRate,
      averageExecutionTime,
      averageResourceUsage: resourceUsage
    };
  }
  
  /**
   * Identifies alternative tools
   * 
   * @param {string} toolId - Tool identifier
   * @param {Array} contextPatterns - Context patterns
   * @returns {Array} Alternative tools
   * @private
   */
  _identifyAlternatives(toolId, contextPatterns) {
    const alternatives = [];
    const toolType = Array.from(this.usagePatterns.values())
      .find(pattern => pattern.toolId === toolId)?.toolType;
    
    if (!toolType) return alternatives;
    
    // Find tools of the same type
    const sameTypeTools = Array.from(this.usagePatterns.values())
      .filter(pattern => pattern.toolType === toolType && pattern.toolId !== toolId);
    
    for (const tool of sameTypeTools) {
      // Check if this tool has been used in similar contexts
      const similarContexts = contextPatterns.filter(cp1 => 
        tool.contextPatterns.some(cp2 => cp2.taskType === cp1.taskType)
      );
      
      if (similarContexts.length > 0) {
        alternatives.push({
          toolId: tool.toolId,
          similarityScore: similarContexts.length / contextPatterns.length,
          successRateDifference: tool.usageMetrics.successRate - 
            (this.usagePatterns.get(`pattern-${toolId}`)?.usageMetrics.successRate || 0),
          executionTimeDifference: (tool.usageMetrics.averageExecutionTime || 0) - 
            (this.usagePatterns.get(`pattern-${toolId}`)?.usageMetrics.averageExecutionTime || 0)
        });
      }
    }
    
    // Sort by similarity score (highest first)
    return alternatives.sort((a, b) => b.similarityScore - a.similarityScore);
  }
  
  /**
   * Updates efficiency metrics for a tool
   * 
   * @param {string} toolId - Tool identifier
   * @param {Array} usageHistory - Tool usage history
   * @private
   */
  _updateEfficiencyMetrics(toolId, usageHistory) {
    if (usageHistory.length === 0) return;
    
    // Calculate overall metrics
    const successCount = usageHistory.filter(
      record => record.outcome && record.outcome.status === 'success'
    ).length;
    
    const successRate = successCount / usageHistory.length;
    
    const executionTimes = usageHistory
      .filter(record => record.executionTime !== null)
      .map(record => record.executionTime);
    
    const averageExecutionTime = executionTimes.length > 0 ?
      executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length : null;
    
    const resourceUsage = {
      memory: null,
      cpu: null,
      tokens: null
    };
    
    for (const resource of Object.keys(resourceUsage)) {
      const values = usageHistory
        .filter(record => record.resourceUsage && record.resourceUsage[resource] !== null)
        .map(record => record.resourceUsage[resource]);
      
      if (values.length > 0) {
        resourceUsage[resource] = values.reduce((sum, value) => sum + value, 0) / values.length;
      }
    }
    
    // Calculate contextual metrics
    const contextualMetrics = [];
    
    // Group by context type
    const contextGroups = new Map();
    
    for (const record of usageHistory) {
      const contextType = record.context.taskType || 'unknown';
      
      if (!contextGroups.has(contextType)) {
        contextGroups.set(contextType, []);
      }
      
      contextGroups.get(contextType).push(record);
    }
    
    // Calculate metrics for each context type
    for (const [contextType, records] of contextGroups.entries()) {
      if (records.length >= 3) { // Minimum sample size
        const contextSuccessCount = records.filter(
          record => record.outcome && record.outcome.status === 'success'
        ).length;
        
        const contextSuccessRate = contextSuccessCount / records.length;
        
        const contextExecutionTimes = records
          .filter(record => record.executionTime !== null)
          .map(record => record.executionTime);
        
        const contextAverageExecutionTime = contextExecutionTimes.length > 0 ?
          contextExecutionTimes.reduce((sum, time) => sum + time, 0) / contextExecutionTimes.length : null;
        
        contextualMetrics.push({
          contextType,
          metrics: {
            invocationCount: records.length,
            successRate: contextSuccessRate,
            averageExecutionTime: contextAverageExecutionTime
          }
        });
      }
    }
    
    // Calculate trends
    const trends = this._calculateTrends(toolId, usageHistory);
    
    // Create or update efficiency metrics
    const metrics = {
      toolId,
      timeRange: {
        start: Math.min(...usageHistory.map(record => record.timestamp)),
        end: Math.max(...usageHistory.map(record => record.timestamp))
      },
      overallMetrics: {
        invocationCount: usageHistory.length,
        successRate,
        averageExecutionTime,
        averageResourceUsage: resourceUsage
      },
      contextualMetrics,
      trends,
      timestamp: Date.now()
    };
    
    // Store metrics
    this.efficiencyMetrics.set(toolId, metrics);
  }
  
  /**
   * Calculates trends for a tool
   * 
   * @param {string} toolId - Tool identifier
   * @param {Array} usageHistory - Tool usage history
   * @returns {Array} Trends
   * @private
   */
  _calculateTrends(toolId, usageHistory) {
    if (usageHistory.length < 10) return []; // Not enough data for trends
    
    // Sort by timestamp
    const sortedHistory = [...usageHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // Split into time windows (e.g., days)
    const dayWindows = new Map();
    
    for (const record of sortedHistory) {
      const day = new Date(record.timestamp).toISOString().split('T')[0];
      
      if (!dayWindows.has(day)) {
        dayWindows.set(day, []);
      }
      
      dayWindows.get(day).push(record);
    }
    
    // Calculate metrics for each window
    const successRateTrend = [];
    const executionTimeTrend = [];
    const usageCountTrend = [];
    const timestamps = [];
    
    for (const [day, records] of dayWindows.entries()) {
      const successCount = records.filter(
        record => record.outcome && record.outcome.status === 'success'
      ).length;
      
      const successRate = records.length > 0 ? successCount / records.length : 0;
      
      const executionTimes = records
        .filter(record => record.executionTime !== null)
        .map(record => record.executionTime);
      
      const averageExecutionTime = executionTimes.length > 0 ?
        executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length : null;
      
      successRateTrend.push(successRate);
      executionTimeTrend.push(averageExecutionTime);
      usageCountTrend.push(records.length);
      timestamps.push(new Date(day).getTime());
    }
    
    return [
      {
        metric: 'successRate',
        values: successRateTrend,
        timestamps
      },
      {
        metric: 'executionTime',
        values: executionTimeTrend,
        timestamps
      },
      {
        metric: 'usageCount',
        values: usageCountTrend,
        timestamps
      }
    ];
  }
  
  /**
   * Generates insights for a specific tool
   * 
   * @param {string} toolId - Tool identifier
   * @private
   */
  _generateInsightsForTool(toolId) {
    const pattern = this.usagePatterns.get(`pattern-${toolId}`);
    const metrics = this.efficiencyMetrics.get(toolId);
    
    if (!pattern || !metrics) return;
    
    const insights = [];
    
    // Check for low success rate
    if (pattern.usageMetrics.successRate < this.config.successThreshold) {
      insights.push({
        id: uuidv4(),
        toolId,
        toolType: pattern.toolType,
        category: 'success_rate',
        title: 'Low Success Rate',
        description: `Tool ${toolId} has a low success rate of ${(pattern.usageMetrics.successRate * 100).toFixed(1)}%`,
        recommendation: 'Consider using alternative tools or improving usage patterns',
        confidence: 0.8,
        timestamp: Date.now()
      });
    }
    
    // Check for high execution time
    if (pattern.usageMetrics.averageExecutionTime > 5000) { // 5 seconds threshold
      insights.push({
        id: uuidv4(),
        toolId,
        toolType: pattern.toolType,
        category: 'performance',
        title: 'High Execution Time',
        description: `Tool ${toolId} has a high average execution time of ${(pattern.usageMetrics.averageExecutionTime / 1000).toFixed(1)} seconds`,
        recommendation: 'Consider optimizing usage or using faster alternatives',
        confidence: 0.7,
        timestamp: Date.now()
      });
    }
    
    // Check for declining success rate trend
    const successRateTrend = metrics.trends.find(trend => trend.metric === 'successRate');
    
    if (successRateTrend && successRateTrend.values.length >= 3) {
      const recentValues = successRateTrend.values.slice(-3);
      
      if (recentValues[2] < recentValues[0] && recentValues[2] < recentValues[1]) {
        insights.push({
          id: uuidv4(),
          toolId,
          toolType: pattern.toolType,
          category: 'trend',
          title: 'Declining Success Rate',
          description: `Tool ${toolId} shows a declining success rate trend`,
          recommendation: 'Investigate recent changes or usage patterns',
          confidence: 0.6,
          timestamp: Date.now()
        });
      }
    }
    
    // Check for better alternatives
    if (pattern.alternatives.length > 0) {
      const betterAlternatives = pattern.alternatives.filter(
        alt => alt.successRateDifference > 0.1 // 10% better success rate
      );
      
      if (betterAlternatives.length > 0) {
        insights.push({
          id: uuidv4(),
          toolId,
          toolType: pattern.toolType,
          category: 'alternative',
          title: 'Better Alternatives Available',
          description: `There are ${betterAlternatives.length} tools with significantly better success rates`,
          recommendation: `Consider using ${betterAlternatives[0].toolId} as an alternative`,
          confidence: 0.7,
          timestamp: Date.now()
        });
      }
    }
    
    // Add insights
    for (const insight of insights) {
      // Check if similar insight already exists
      const existingIndex = this.insights.findIndex(
        i => i.toolId === insight.toolId && i.category === insight.category
      );
      
      if (existingIndex !== -1) {
        // Replace existing insight
        this.insights[existingIndex] = insight;
      } else {
        // Add new insight
        this.insights.push(insight);
      }
    }
  }
  
  /**
   * Generates cross-tool insights
   * 
   * @private
   */
  _generateCrossToolInsights() {
    // Check for tool overuse
    const overusePatterns = this.detectToolOveruse();
    
    for (const pattern of overusePatterns) {
      const insight = {
        id: uuidv4(),
        toolType: pattern.toolType,
        category: 'overuse',
        title: 'Tool Type Overuse',
        description: `Tool type ${pattern.toolType} is used ${(pattern.usageRate * 100).toFixed(1)}% of the time`,
        recommendation: 'Consider diversifying tool usage',
        confidence: 0.7,
        timestamp: Date.now()
      };
      
      // Check if similar insight already exists
      const existingIndex = this.insights.findIndex(
        i => i.toolType === insight.toolType && i.category === insight.category
      );
      
      if (existingIndex !== -1) {
        // Replace existing insight
        this.insights[existingIndex] = insight;
      } else {
        // Add new insight
        this.insights.push(insight);
      }
    }
    
    // Check for tool underuse
    const underusePatterns = this.detectToolUnderuse();
    
    for (const pattern of underusePatterns) {
      const insight = {
        id: uuidv4(),
        toolType: pattern.toolType,
        category: 'underuse',
        title: 'Tool Type Underuse',
        description: `Tool type ${pattern.toolType} is only used ${(pattern.usageRate * 100).toFixed(1)}% of the time`,
        recommendation: 'Consider exploring more tools of this type',
        confidence: 0.6,
        timestamp: Date.now()
      };
      
      // Check if similar insight already exists
      const existingIndex = this.insights.findIndex(
        i => i.toolType === insight.toolType && i.category === insight.category
      );
      
      if (existingIndex !== -1) {
        // Replace existing insight
        this.insights[existingIndex] = insight;
      } else {
        // Add new insight
        this.insights.push(insight);
      }
    }
  }
  
  /**
   * Persists data to storage
   */
  persistData() {
    try {
      // Prepare data for persistence
      const data = {
        timestamp: Date.now(),
        usagePatterns: Array.from(this.usagePatterns.values()),
        efficiencyMetrics: Array.from(this.efficiencyMetrics.entries()).map(
          ([toolId, metrics]) => ({ toolId, ...metrics })
        ),
        insights: this.insights
      };
      
      // Write to file
      const filePath = path.join(this.dataPath, `patterns_${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      this.logger.info('Pattern data persisted', { filePath });
    } catch (error) {
      this.logger.error('Failed to persist pattern data', { error: error.message });
    }
  }
  
  /**
   * Loads data from storage
   */
  loadData() {
    try {
      const files = fs.readdirSync(this.dataPath);
      let latestFile = null;
      let latestTime = 0;
      
      // Find the latest persistence file
      for (const file of files) {
        if (file.startsWith('patterns_')) {
          const filePath = path.join(this.dataPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtimeMs > latestTime) {
            latestTime = stats.mtimeMs;
            latestFile = filePath;
          }
        }
      }
      
      if (latestFile) {
        // Load data from file
        const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
        
        // Restore usage patterns
        this.usagePatterns.clear();
        for (const pattern of data.usagePatterns) {
          this.usagePatterns.set(pattern.id, pattern);
        }
        
        // Restore efficiency metrics
        this.efficiencyMetrics.clear();
        for (const metrics of data.efficiencyMetrics) {
          this.efficiencyMetrics.set(metrics.toolId, metrics);
        }
        
        // Restore insights
        this.insights = data.insights || [];
        
        this.logger.info('Pattern data loaded', { 
          filePath: latestFile,
          patternCount: data.usagePatterns.length,
          insightCount: this.insights.length
        });
      }
    } catch (error) {
      this.logger.error('Failed to load pattern data', { error: error.message });
    }
  }
  
  /**
   * Cleans up resources
   */
  cleanup() {
    if (this.patternUpdateTimer) {
      clearInterval(this.patternUpdateTimer);
    }
    
    // Persist data before cleanup
    this.persistData();
    
    this.logger.info('Pattern Analyzer cleaned up');
  }
}

module.exports = {
  PatternAnalyzer
};
