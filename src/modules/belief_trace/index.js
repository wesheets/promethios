/**
 * Belief Trace and Verification Module
 * 
 * Provides comprehensive source tracking and verification for all agent outputs
 * in the Promethios governance framework. This module integrates with PRISM
 * for belief trace auditing and enforcement.
 * 
 * @module modules/belief_trace
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createLogger } = require('../../utils/logger');
const { registerWithPhaseChangeTracker } = require('../../tools/phase-change-tracker');

class BeliefTraceModule {
  /**
   * Creates a new BeliefTraceModule instance
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    this.config = config;
    this.logger = createLogger({
      name: 'belief_trace',
      level: config.log_level || 'info',
      file: config.log_file || 'logs/belief_trace.json'
    });
    
    // Initialize trace storage
    this.traces = new Map();
    
    // Initialize data collection for analytics
    this.analyticsData = {
      traceStats: {
        totalTraces: 0,
        verifiedTraces: 0,
        unverifiedTraces: 0,
        sourceTypes: {}
      },
      patternData: [],
      confidenceDistribution: {}
    };
    
    // Data retention settings
    this.dataRetention = {
      maxTraces: config.maxTraces || 10000,
      maxPatternData: config.maxPatternData || 5000,
      persistInterval: config.persistInterval || 3600000 // 1 hour
    };
    
    // Set up periodic data persistence
    if (this.dataRetention.persistInterval > 0) {
      this.persistInterval = setInterval(() => {
        this.persistAnalyticsData();
      }, this.dataRetention.persistInterval);
    }
    
    // Register with Phase Change Tracker
    this._registerWithPhaseChangeTracker();
    
    this.logger.info('Belief Trace Module initialized');
  }
  
  /**
   * Registers the Belief Trace Module with the Phase Change Tracker
   * @private
   */
  _registerWithPhaseChangeTracker() {
    try {
      registerWithPhaseChangeTracker({
        componentType: 'module',
        componentName: 'belief_trace',
        version: '1.0.0',
        apis: [
          { name: 'createTrace', version: '1.0.0', description: 'Creates a new belief trace' },
          { name: 'addSource', version: '1.0.0', description: 'Adds a source to a belief trace' },
          { name: 'verifyTrace', version: '1.0.0', description: 'Verifies a belief trace' },
          { name: 'getTrace', version: '1.0.0', description: 'Retrieves a belief trace' },
          { name: 'getAnalytics', version: '1.0.0', description: 'Retrieves analytics data' }
        ]
      });
    } catch (error) {
      this.logger.error('Failed to register with Phase Change Tracker', { error: error.message });
    }
  }
  
  /**
   * Creates a new belief trace
   * @param {Object} belief - The belief to create a trace for
   * @param {Object} context - Context information
   * @returns {Object} The created trace
   */
  createTrace(belief, context = {}) {
    try {
      if (!belief || !belief.id) {
        throw new Error('Invalid belief');
      }
      
      // Generate trace ID if not provided
      const traceId = belief.traceId || this._generateTraceId(belief);
      
      // Create trace
      const trace = {
        id: traceId,
        beliefId: belief.id,
        created: new Date().toISOString(),
        sources: [],
        confidence: belief.confidence || 0,
        context: {
          ...context,
          agent: belief.agent || context.agent,
          operation: belief.operation || context.operation,
          timestamp: new Date().toISOString()
        },
        verified: false,
        verificationDetails: null
      };
      
      // Store trace
      this.traces.set(traceId, trace);
      
      // Update analytics
      this.analyticsData.traceStats.totalTraces++;
      this._updateConfidenceDistribution(trace.confidence);
      
      this.logger.info('Trace created', { 
        traceId, 
        beliefId: belief.id
      });
      
      return trace;
    } catch (error) {
      this.logger.error('Error creating trace', { 
        beliefId: belief?.id, 
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Adds a source to a belief trace
   * @param {string} traceId - ID of the trace to add the source to
   * @param {Object} source - Source information
   * @returns {Object} Updated trace
   */
  addSource(traceId, source) {
    try {
      const trace = this.traces.get(traceId);
      if (!trace) {
        throw new Error(`Trace not found: ${traceId}`);
      }
      
      if (!source || !source.type) {
        throw new Error('Invalid source');
      }
      
      // Add source ID if not provided
      const sourceId = source.id || this._generateSourceId(source);
      
      // Add source to trace
      const sourceEntry = {
        id: sourceId,
        type: source.type,
        content: source.content,
        metadata: source.metadata || {},
        added: new Date().toISOString(),
        verified: false,
        verificationDetails: null
      };
      
      trace.sources.push(sourceEntry);
      
      // Update analytics
      this._updateSourceTypeStats(source.type);
      
      // If this is a pattern worth tracking, add to pattern data
      if (this._shouldTrackPattern(trace, sourceEntry)) {
        this._addPatternData(trace, sourceEntry);
      }
      
      this.logger.info('Source added to trace', { 
        traceId, 
        sourceId,
        sourceType: source.type
      });
      
      return trace;
    } catch (error) {
      this.logger.error('Error adding source to trace', { 
        traceId, 
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Verifies a belief trace
   * @param {string} traceId - ID of the trace to verify
   * @param {Object} options - Verification options
   * @returns {Object} Verification results
   */
  verifyTrace(traceId, options = {}) {
    try {
      const trace = this.traces.get(traceId);
      if (!trace) {
        throw new Error(`Trace not found: ${traceId}`);
      }
      
      const verificationLevel = options.level || 'standard';
      const results = {
        traceId,
        verified: false,
        level: verificationLevel,
        timestamp: new Date().toISOString(),
        sourcesVerified: 0,
        totalSources: trace.sources.length,
        issues: []
      };
      
      // No sources means verification fails
      if (trace.sources.length === 0) {
        results.issues.push({
          type: 'no_sources',
          severity: 'high',
          message: 'Trace has no sources'
        });
        
        return results;
      }
      
      // Verify each source
      for (const source of trace.sources) {
        const sourceVerification = this._verifySource(source, verificationLevel);
        source.verified = sourceVerification.verified;
        source.verificationDetails = sourceVerification;
        
        if (sourceVerification.verified) {
          results.sourcesVerified++;
        } else {
          results.issues.push({
            type: 'source_verification_failed',
            severity: 'medium',
            message: `Source verification failed: ${sourceVerification.reason}`,
            sourceId: source.id
          });
        }
      }
      
      // Determine overall verification status
      if (verificationLevel === 'strict') {
        // Strict requires all sources to be verified
        results.verified = results.sourcesVerified === results.totalSources;
      } else if (verificationLevel === 'standard') {
        // Standard requires at least one source to be verified
        results.verified = results.sourcesVerified > 0;
      } else {
        // Minimal just requires sources to exist
        results.verified = results.totalSources > 0;
      }
      
      // Update trace verification status
      trace.verified = results.verified;
      trace.verificationDetails = results;
      
      // Update analytics
      if (results.verified) {
        this.analyticsData.traceStats.verifiedTraces++;
      } else {
        this.analyticsData.traceStats.unverifiedTraces++;
      }
      
      this.logger.info('Trace verified', { 
        traceId, 
        verified: results.verified,
        level: verificationLevel,
        sourcesVerified: results.sourcesVerified,
        totalSources: results.totalSources
      });
      
      return results;
    } catch (error) {
      this.logger.error('Error verifying trace', { 
        traceId, 
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Verifies a source
   * @param {Object} source - Source to verify
   * @param {string} level - Verification level
   * @returns {Object} Verification results
   * @private
   */
  _verifySource(source, level) {
    const results = {
      sourceId: source.id,
      verified: false,
      level,
      timestamp: new Date().toISOString(),
      checks: []
    };
    
    try {
      // Basic checks for all levels
      if (!source.type) {
        results.checks.push({
          name: 'type_check',
          passed: false,
          message: 'Source has no type'
        });
        results.reason = 'Missing source type';
        return results;
      }
      
      if (!source.content) {
        results.checks.push({
          name: 'content_check',
          passed: false,
          message: 'Source has no content'
        });
        results.reason = 'Missing source content';
        return results;
      }
      
      results.checks.push({
        name: 'basic_check',
        passed: true,
        message: 'Source has required fields'
      });
      
      // Additional checks for standard and strict levels
      if (level === 'standard' || level === 'strict') {
        // Check content validity based on source type
        const contentValid = this._validateSourceContent(source);
        results.checks.push({
          name: 'content_validation',
          passed: contentValid,
          message: contentValid ? 'Source content is valid' : 'Source content is invalid'
        });
        
        if (!contentValid && level === 'strict') {
          results.reason = 'Invalid source content';
          return results;
        }
      }
      
      // Additional checks for strict level
      if (level === 'strict') {
        // Check metadata completeness
        const metadataComplete = source.metadata && 
                                Object.keys(source.metadata).length > 0;
        
        results.checks.push({
          name: 'metadata_check',
          passed: metadataComplete,
          message: metadataComplete ? 'Source has metadata' : 'Source has no metadata'
        });
        
        if (!metadataComplete) {
          results.reason = 'Missing source metadata';
          return results;
        }
      }
      
      // All checks passed
      results.verified = true;
      return results;
    } catch (error) {
      results.checks.push({
        name: 'error',
        passed: false,
        message: `Error during verification: ${error.message}`
      });
      results.reason = 'Verification error';
      return results;
    }
  }
  
  /**
   * Validates source content based on source type
   * @param {Object} source - Source to validate
   * @returns {boolean} Whether the content is valid
   * @private
   */
  _validateSourceContent(source) {
    // In a real implementation, this would validate content based on source type
    // For now, we'll just check that content exists
    return !!source.content;
  }
  
  /**
   * Retrieves a belief trace
   * @param {string} traceId - ID of the trace to retrieve
   * @returns {Object} The trace
   */
  getTrace(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      this.logger.warn('Trace not found', { traceId });
      return null;
    }
    
    return trace;
  }
  
  /**
   * Retrieves analytics data
   * @param {Object} options - Options for filtering analytics data
   * @returns {Object} Analytics data
   */
  getAnalytics(options = {}) {
    // Clone analytics data to avoid modification
    const analytics = JSON.parse(JSON.stringify(this.analyticsData));
    
    // Filter pattern data if requested
    if (options.patternLimit && options.patternLimit < analytics.patternData.length) {
      analytics.patternData = analytics.patternData.slice(0, options.patternLimit);
    }
    
    return analytics;
  }
  
  /**
   * Persists analytics data to disk
   * @returns {boolean} Success status
   */
  persistAnalyticsData() {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `belief_trace_analytics_${timestamp}.json`;
      const filepath = path.join('data', 'analytics', filename);
      
      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write analytics data to file
      fs.writeFileSync(filepath, JSON.stringify(this.analyticsData, null, 2));
      
      this.logger.info('Analytics data persisted', { filepath });
      
      return true;
    } catch (error) {
      this.logger.error('Error persisting analytics data', { error: error.message });
      return false;
    }
  }
  
  /**
   * Generates a trace ID
   * @param {Object} belief - Belief to generate ID for
   * @returns {string} Generated trace ID
   * @private
   */
  _generateTraceId(belief) {
    const hash = crypto.createHash('sha256');
    hash.update(belief.id + new Date().toISOString());
    return `trace-${hash.digest('hex').substring(0, 16)}`;
  }
  
  /**
   * Generates a source ID
   * @param {Object} source - Source to generate ID for
   * @returns {string} Generated source ID
   * @private
   */
  _generateSourceId(source) {
    const hash = crypto.createHash('sha256');
    hash.update(source.type + JSON.stringify(source.content) + new Date().toISOString());
    return `source-${hash.digest('hex').substring(0, 16)}`;
  }
  
  /**
   * Updates source type statistics
   * @param {string} sourceType - Type of source
   * @private
   */
  _updateSourceTypeStats(sourceType) {
    if (!this.analyticsData.traceStats.sourceTypes[sourceType]) {
      this.analyticsData.traceStats.sourceTypes[sourceType] = 0;
    }
    
    this.analyticsData.traceStats.sourceTypes[sourceType]++;
  }
  
  /**
   * Updates confidence distribution statistics
   * @param {number} confidence - Confidence value
   * @private
   */
  _updateConfidenceDistribution(confidence) {
    // Round confidence to nearest 0.1
    const roundedConfidence = Math.round(confidence * 10) / 10;
    const key = roundedConfidence.toFixed(1);
    
    if (!this.analyticsData.confidenceDistribution[key]) {
      this.analyticsData.confidenceDistribution[key] = 0;
    }
    
    this.analyticsData.confidenceDistribution[key]++;
  }
  
  /**
   * Determines if a pattern should be tracked
   * @param {Object} trace - Trace containing the pattern
   * @param {Object} source - Source that might form a pattern
   * @returns {boolean} Whether the pattern should be tracked
   * @private
   */
  _shouldTrackPattern(trace, source) {
    // In a real implementation, this would use more sophisticated criteria
    // For now, we'll track patterns for high-confidence beliefs with certain source types
    return trace.confidence >= 0.8 && 
           ['memory', 'document', 'api', 'calculation'].includes(source.type);
  }
  
  /**
   * Adds pattern data for analytics
   * @param {Object} trace - Trace containing the pattern
   * @param {Object} source - Source that forms part of the pattern
   * @private
   */
  _addPatternData(trace, source) {
    // Create pattern data entry
    const patternEntry = {
      timestamp: new Date().toISOString(),
      traceId: trace.id,
      beliefId: trace.beliefId,
      confidence: trace.confidence,
      sourceType: source.type,
      context: trace.context
    };
    
    // Add to pattern data
    this.analyticsData.patternData.push(patternEntry);
    
    // Trim pattern data if needed
    if (this.analyticsData.patternData.length > this.dataRetention.maxPatternData) {
      this.analyticsData.patternData = this.analyticsData.patternData.slice(
        this.analyticsData.patternData.length - this.dataRetention.maxPatternData
      );
    }
  }
  
  /**
   * Cleans up resources when the module is destroyed
   */
  destroy() {
    if (this.persistInterval) {
      clearInterval(this.persistInterval);
    }
    
    // Persist analytics data one last time
    this.persistAnalyticsData();
    
    this.logger.info('Belief Trace Module destroyed');
  }
}

module.exports = {
  BeliefTraceModule
};
