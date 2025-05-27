/**
 * Confidence Scoring Module
 * 
 * This module provides transparency into agent decision-making by calculating
 * confidence levels for agent outputs and creating evidence maps that link
 * decisions to supporting data.
 * 
 * @module confidence_scoring
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Confidence Scoring Module main class
 */
class ConfidenceScoring {
  /**
   * Create a new ConfidenceScoring instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.beliefTraceManager - Belief Trace Manager instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options) {
    this.logger = options.logger || console;
    this.beliefTraceManager = options.beliefTraceManager;
    this.config = options.config || {
      defaultAlgorithm: 'weighted',
      thresholds: {
        critical: 0.8,
        standard: 0.6,
        informational: 0.4
      },
      persistenceInterval: 60000 // 1 minute
    };
    
    // Initialize components
    this.calculator = new ConfidenceCalculator(this.config);
    this.evidenceMapper = new EvidenceMapper(this.config);
    this.analytics = new ConfidenceAnalytics(this.config);
    this.visualizationManager = new VisualizationManager(this.config);
    
    // Initialize storage
    this.evidenceMaps = new Map();
    this.confidenceScores = new Map();
    
    // Setup persistence
    if (this.config.persistenceInterval > 0) {
      this.persistenceTimer = setInterval(() => {
        this.persistAnalytics();
      }, this.config.persistenceInterval);
    }
    
    this.logger.info('Confidence Scoring module initialized');
  }
  
  /**
   * Calculate confidence score for a decision based on evidence
   * 
   * @param {string} decisionId - Unique identifier for the decision
   * @param {Array} evidenceItems - Array of evidence items supporting the decision
   * @param {Object} options - Calculation options
   * @returns {Object} Confidence score and evidence map
   */
  calculateConfidence(decisionId, evidenceItems, options = {}) {
    this.logger.info(`Calculating confidence for decision ${decisionId}`);
    
    // Validate evidence items
    const validatedEvidence = this.validateEvidence(evidenceItems);
    
    // Calculate confidence score
    const confidenceScore = this.calculator.calculateConfidence(validatedEvidence, options);
    
    // Create evidence map
    const evidenceMap = this.evidenceMapper.createEvidenceMap(decisionId, validatedEvidence);
    
    // Store results
    this.confidenceScores.set(decisionId, confidenceScore);
    this.evidenceMaps.set(evidenceMap.id, evidenceMap);
    
    // Track analytics
    this.analytics.trackConfidenceScore(confidenceScore, {
      decisionId,
      evidenceCount: validatedEvidence.length,
      mapId: evidenceMap.id
    });
    
    return {
      confidenceScore,
      evidenceMap
    };
  }
  
  /**
   * Update confidence for an existing decision with new evidence
   * 
   * @param {string} decisionId - Unique identifier for the decision
   * @param {Array} newEvidence - Array of new evidence items
   * @returns {Object} Updated confidence score and evidence map
   */
  updateConfidence(decisionId, newEvidence) {
    this.logger.info(`Updating confidence for decision ${decisionId}`);
    
    // Get existing confidence score
    const existingScore = this.confidenceScores.get(decisionId);
    if (!existingScore) {
      throw new Error(`No existing confidence score found for decision ${decisionId}`);
    }
    
    // Get existing evidence map
    const existingMapId = Array.from(this.evidenceMaps.values())
      .find(map => map.decisionId === decisionId)?.id;
    
    if (!existingMapId) {
      throw new Error(`No existing evidence map found for decision ${decisionId}`);
    }
    
    // Validate new evidence
    const validatedEvidence = this.validateEvidence(newEvidence);
    
    // Update confidence score
    const updatedScore = this.calculator.updateConfidence(existingScore, validatedEvidence);
    
    // Update evidence map
    const updatedMap = this.evidenceMapper.addEvidence(existingMapId, validatedEvidence);
    
    // Store updated results
    this.confidenceScores.set(decisionId, updatedScore);
    this.evidenceMaps.set(updatedMap.id, updatedMap);
    
    // Track analytics
    this.analytics.trackConfidenceUpdate(existingScore, updatedScore, {
      decisionId,
      newEvidenceCount: validatedEvidence.length,
      mapId: updatedMap.id
    });
    
    return {
      confidenceScore: updatedScore,
      evidenceMap: updatedMap
    };
  }
  
  /**
   * Get confidence score for a decision
   * 
   * @param {string} decisionId - Unique identifier for the decision
   * @returns {Object} Confidence score or null if not found
   */
  getConfidenceScore(decisionId) {
    return this.confidenceScores.get(decisionId) || null;
  }
  
  /**
   * Get evidence map for a decision
   * 
   * @param {string} decisionId - Unique identifier for the decision
   * @returns {Object} Evidence map or null if not found
   */
  getEvidenceMap(decisionId) {
    const mapId = Array.from(this.evidenceMaps.values())
      .find(map => map.decisionId === decisionId)?.id;
    
    return mapId ? this.evidenceMaps.get(mapId) : null;
  }
  
  /**
   * Get evidence map by ID
   * 
   * @param {string} mapId - Unique identifier for the evidence map
   * @returns {Object} Evidence map or null if not found
   */
  getEvidenceMapById(mapId) {
    return this.evidenceMaps.get(mapId) || null;
  }
  
  /**
   * Check if a confidence score meets a specified threshold
   * 
   * @param {Object} score - Confidence score to check
   * @param {string} thresholdType - Type of threshold to check against
   * @returns {boolean} Whether the score meets the threshold
   */
  meetsThreshold(score, thresholdType = 'standard') {
    return this.calculator.meetsThreshold(score, thresholdType);
  }
  
  /**
   * Validate evidence items
   * 
   * @param {Array} evidenceItems - Array of evidence items to validate
   * @returns {Array} Array of validated evidence items
   * @private
   */
  validateEvidence(evidenceItems) {
    // Ensure evidence is an array
    if (!Array.isArray(evidenceItems)) {
      evidenceItems = [evidenceItems];
    }
    
    // Validate each evidence item
    return evidenceItems.map(item => {
      // Ensure ID
      if (!item.id) {
        item.id = uuidv4();
      }
      
      // Ensure timestamp
      if (!item.timestamp) {
        item.timestamp = Date.now();
      }
      
      // Validate trace if present
      if (item.traceId && this.beliefTraceManager) {
        const trace = this.beliefTraceManager.getTrace(item.traceId);
        if (trace) {
          // Adjust quality based on trace verification
          const verification = this.beliefTraceManager.verifyTrace(trace);
          if (verification) {
            item.quality = item.quality * verification.confidence;
          }
        }
      }
      
      // Ensure quality is between 0 and 1
      item.quality = Math.max(0, Math.min(1, item.quality || 0.5));
      
      // Ensure weight is between 0 and 1
      item.weight = Math.max(0, Math.min(1, item.weight || 1.0));
      
      // Ensure metadata exists
      item.metadata = item.metadata || {};
      
      return item;
    });
  }
  
  /**
   * Get analytics data
   * 
   * @param {Object} options - Options for analytics retrieval
   * @returns {Object} Analytics data
   */
  getAnalytics(options = {}) {
    return this.analytics.getAnalytics(options);
  }
  
  /**
   * Persist analytics data
   * 
   * @private
   */
  persistAnalytics() {
    this.logger.info('Persisting confidence analytics data');
    this.analytics.persistData();
  }
  
  /**
   * Prepare visualization data for UI
   * 
   * @param {string} decisionId - Unique identifier for the decision
   * @param {Object} options - Visualization options
   * @returns {Object} Visualization data
   */
  prepareVisualization(decisionId, options = {}) {
    const confidenceScore = this.getConfidenceScore(decisionId);
    const evidenceMap = this.getEvidenceMap(decisionId);
    
    if (!confidenceScore || !evidenceMap) {
      throw new Error(`No confidence data found for decision ${decisionId}`);
    }
    
    return this.visualizationManager.prepareVisualization(confidenceScore, evidenceMap, options);
  }
  
  /**
   * Register hooks with the Constitutional Hooks Manager
   * 
   * @param {Object} hooksManager - Constitutional Hooks Manager instance
   */
  registerHooks(hooksManager) {
    if (!hooksManager) {
      this.logger.warn('No hooks manager provided, skipping hook registration');
      return;
    }
    
    // Register hooks for belief generation
    hooksManager.registerHook('beliefGeneration', (data) => {
      this.handleBeliefGenerationHook(data);
    });
    
    // Register hooks for decision making
    hooksManager.registerHook('decisionMaking', (data) => {
      this.handleDecisionMakingHook(data);
    });
    
    // Register hooks for evidence collection
    hooksManager.registerHook('evidenceCollection', (data) => {
      this.handleEvidenceCollectionHook(data);
    });
    
    this.logger.info('Confidence Scoring hooks registered');
  }
  
  /**
   * Handle belief generation hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleBeliefGenerationHook(data) {
    if (!data || !data.belief) return;
    
    const belief = data.belief;
    
    // Extract evidence from belief
    const evidenceItems = this.extractEvidenceFromBelief(belief);
    
    // Calculate confidence
    if (evidenceItems.length > 0) {
      this.calculateConfidence(belief.id, evidenceItems, {
        algorithm: this.config.defaultAlgorithm,
        context: 'belief'
      });
    }
  }
  
  /**
   * Handle decision making hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleDecisionMakingHook(data) {
    if (!data || !data.decision) return;
    
    const decision = data.decision;
    
    // Extract evidence from decision
    const evidenceItems = this.extractEvidenceFromDecision(decision);
    
    // Calculate confidence
    if (evidenceItems.length > 0) {
      this.calculateConfidence(decision.id, evidenceItems, {
        algorithm: this.config.defaultAlgorithm,
        context: 'decision'
      });
    }
  }
  
  /**
   * Handle evidence collection hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleEvidenceCollectionHook(data) {
    if (!data || !data.evidence || !data.targetId) return;
    
    const { evidence, targetId } = data;
    
    // Update confidence with new evidence
    try {
      this.updateConfidence(targetId, Array.isArray(evidence) ? evidence : [evidence]);
    } catch (error) {
      // If no existing confidence, calculate new
      if (error.message.includes('No existing confidence')) {
        this.calculateConfidence(targetId, Array.isArray(evidence) ? evidence : [evidence]);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Extract evidence from belief
   * 
   * @param {Object} belief - Belief object
   * @returns {Array} Array of evidence items
   * @private
   */
  extractEvidenceFromBelief(belief) {
    const evidenceItems = [];
    
    // Extract from trace if available
    if (belief.trace) {
      evidenceItems.push({
        id: uuidv4(),
        type: 'trace',
        content: belief.trace,
        weight: 1.0,
        quality: 0.8,
        traceId: belief.trace.id,
        timestamp: belief.trace.timestamp || Date.now(),
        metadata: {
          sourceType: belief.trace.sourceType,
          beliefId: belief.id
        }
      });
    }
    
    // Extract from sources if available
    if (belief.sources && Array.isArray(belief.sources)) {
      belief.sources.forEach(source => {
        evidenceItems.push({
          id: uuidv4(),
          type: 'source',
          content: source,
          weight: 0.8,
          quality: source.quality || 0.7,
          timestamp: source.timestamp || Date.now(),
          metadata: {
            sourceType: source.type,
            beliefId: belief.id
          }
        });
      });
    }
    
    // Extract from reasoning if available
    if (belief.reasoning) {
      evidenceItems.push({
        id: uuidv4(),
        type: 'reasoning',
        content: belief.reasoning,
        weight: 0.6,
        quality: 0.6,
        timestamp: Date.now(),
        metadata: {
          beliefId: belief.id
        }
      });
    }
    
    return evidenceItems;
  }
  
  /**
   * Extract evidence from decision
   * 
   * @param {Object} decision - Decision object
   * @returns {Array} Array of evidence items
   * @private
   */
  extractEvidenceFromDecision(decision) {
    const evidenceItems = [];
    
    // Extract from supporting beliefs if available
    if (decision.supportingBeliefs && Array.isArray(decision.supportingBeliefs)) {
      decision.supportingBeliefs.forEach(beliefId => {
        const confidenceScore = this.getConfidenceScore(beliefId);
        if (confidenceScore) {
          evidenceItems.push({
            id: uuidv4(),
            type: 'belief',
            content: { beliefId },
            weight: 0.9,
            quality: confidenceScore.value,
            timestamp: Date.now(),
            metadata: {
              decisionId: decision.id,
              beliefConfidence: confidenceScore.value
            }
          });
        }
      });
    }
    
    // Extract from reasoning if available
    if (decision.reasoning) {
      evidenceItems.push({
        id: uuidv4(),
        type: 'reasoning',
        content: decision.reasoning,
        weight: 0.7,
        quality: 0.6,
        timestamp: Date.now(),
        metadata: {
          decisionId: decision.id
        }
      });
    }
    
    // Extract from constraints if available
    if (decision.constraints && Array.isArray(decision.constraints)) {
      decision.constraints.forEach(constraint => {
        evidenceItems.push({
          id: uuidv4(),
          type: 'constraint',
          content: constraint,
          weight: 0.5,
          quality: constraint.satisfaction || 0.5,
          timestamp: Date.now(),
          metadata: {
            decisionId: decision.id,
            constraintType: constraint.type
          }
        });
      });
    }
    
    return evidenceItems;
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    
    // Persist analytics before cleanup
    this.persistAnalytics();
    
    this.logger.info('Confidence Scoring module cleaned up');
  }
}

/**
 * Confidence Calculator component
 */
class ConfidenceCalculator {
  /**
   * Create a new ConfidenceCalculator instance
   * 
   * @param {Object} config - Configuration settings
   */
  constructor(config) {
    this.config = config;
    this.algorithms = {
      weighted: this.weightedAlgorithm,
      bayesian: this.bayesianAlgorithm,
      average: this.averageAlgorithm
    };
  }
  
  /**
   * Calculate confidence score based on evidence
   * 
   * @param {Array} evidenceItems - Array of evidence items
   * @param {Object} options - Calculation options
   * @returns {Object} Confidence score
   */
  calculateConfidence(evidenceItems, options = {}) {
    const algorithm = options.algorithm || this.config.defaultAlgorithm;
    
    if (!this.algorithms[algorithm]) {
      throw new Error(`Unknown confidence algorithm: ${algorithm}`);
    }
    
    // Calculate confidence using selected algorithm
    const value = this.algorithms[algorithm].call(this, evidenceItems);
    
    // Calculate confidence interval if needed
    const interval = options.includeInterval ? this.calculateInterval(value, evidenceItems) : undefined;
    
    // Determine threshold status
    const thresholdType = options.thresholdType || 'standard';
    const thresholdValue = this.getThresholdValue(thresholdType);
    const thresholdStatus = value >= thresholdValue ? 'above' : 'below';
    
    return {
      value,
      interval,
      algorithm,
      timestamp: Date.now(),
      evidenceCount: evidenceItems.length,
      thresholdStatus
    };
  }
  
  /**
   * Update existing confidence score with new evidence
   * 
   * @param {Object} existingScore - Existing confidence score
   * @param {Array} newEvidence - Array of new evidence items
   * @returns {Object} Updated confidence score
   */
  updateConfidence(existingScore, newEvidence) {
    // Combine existing evidence weight with new evidence
    const effectiveExistingWeight = existingScore.value * existingScore.evidenceCount;
    
    // Calculate new evidence contribution
    const algorithm = existingScore.algorithm || this.config.defaultAlgorithm;
    const newEvidenceValue = this.algorithms[algorithm].call(this, newEvidence);
    const newEvidenceWeight = newEvidenceValue * newEvidence.length;
    
    // Calculate combined confidence
    const totalItems = existingScore.evidenceCount + newEvidence.length;
    const combinedValue = (effectiveExistingWeight + newEvidenceWeight) / totalItems;
    
    // Calculate confidence interval if needed
    const interval = existingScore.interval ? 
      this.calculateInterval(combinedValue, newEvidence, existingScore) : undefined;
    
    // Determine threshold status
    const thresholdType = existingScore.thresholdType || 'standard';
    const thresholdValue = this.getThresholdValue(thresholdType);
    const thresholdStatus = combinedValue >= thresholdValue ? 'above' : 'below';
    
    return {
      value: combinedValue,
      interval,
      algorithm: existingScore.algorithm,
      timestamp: Date.now(),
      evidenceCount: totalItems,
      thresholdStatus
    };
  }
  
  /**
   * Check if a confidence score meets a specified threshold
   * 
   * @param {Object} score - Confidence score to check
   * @param {string} thresholdType - Type of threshold to check against
   * @returns {boolean} Whether the score meets the threshold
   */
  meetsThreshold(score, thresholdType = 'standard') {
    const thresholdValue = this.getThresholdValue(thresholdType);
    return score.value >= thresholdValue;
  }
  
  /**
   * Get threshold value for a specified threshold type
   * 
   * @param {string} thresholdType - Type of threshold
   * @returns {number} Threshold value
   * @private
   */
  getThresholdValue(thresholdType) {
    const thresholds = this.config.thresholds || {};
    
    switch (thresholdType) {
      case 'critical':
        return thresholds.critical || 0.8;
      case 'standard':
        return thresholds.standard || 0.6;
      case 'informational':
        return thresholds.informational || 0.4;
      default:
        if (thresholds[thresholdType] !== undefined) {
          return thresholds[thresholdType];
        }
        return thresholds.standard || 0.6;
    }
  }
  
  /**
   * Calculate confidence using weighted algorithm
   * 
   * @param {Array} evidenceItems - Array of evidence items
   * @returns {number} Confidence value
   * @private
   */
  weightedAlgorithm(evidenceItems) {
    if (!evidenceItems || evidenceItems.length === 0) {
      return 0;
    }
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    evidenceItems.forEach(item => {
      const weight = item.weight || 1;
      const quality = item.quality || 0.5;
      
      totalWeight += weight;
      weightedSum += weight * quality;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Calculate confidence using Bayesian algorithm
   * 
   * @param {Array} evidenceItems - Array of evidence items
   * @returns {number} Confidence value
   * @private
   */
  bayesianAlgorithm(evidenceItems) {
    if (!evidenceItems || evidenceItems.length === 0) {
      return 0;
    }
    
    // Start with a prior of 0.5
    let belief = 0.5;
    
    // Update belief with each piece of evidence
    evidenceItems.forEach(item => {
      const quality = item.quality || 0.5;
      const weight = item.weight || 1;
      
      // Apply weight to quality
      const effectiveQuality = 0.5 + (quality - 0.5) * weight;
      
      // Bayesian update
      const support = effectiveQuality;
      const against = 1 - effectiveQuality;
      
      belief = (belief * support) / 
        ((belief * support) + ((1 - belief) * against));
    });
    
    return belief;
  }
  
  /**
   * Calculate confidence using simple average algorithm
   * 
   * @param {Array} evidenceItems - Array of evidence items
   * @returns {number} Confidence value
   * @private
   */
  averageAlgorithm(evidenceItems) {
    if (!evidenceItems || evidenceItems.length === 0) {
      return 0;
    }
    
    let sum = 0;
    
    evidenceItems.forEach(item => {
      sum += item.quality || 0.5;
    });
    
    return sum / evidenceItems.length;
  }
  
  /**
   * Calculate confidence interval
   * 
   * @param {number} value - Confidence value
   * @param {Array} evidenceItems - Array of evidence items
   * @param {Object} existingScore - Existing confidence score (for updates)
   * @returns {Object} Confidence interval
   * @private
   */
  calculateInterval(value, evidenceItems, existingScore) {
    // Simple interval calculation based on evidence count and variance
    const count = evidenceItems.length + (existingScore ? existingScore.evidenceCount : 0);
    
    // Calculate variance of evidence quality
    let sumSquaredDiff = 0;
    evidenceItems.forEach(item => {
      const diff = (item.quality || 0.5) - value;
      sumSquaredDiff += diff * diff;
    });
    
    // Add variance from existing score if available
    if (existingScore && existingScore.interval) {
      const existingRange = existingScore.interval.upper - existingScore.interval.lower;
      const existingVariance = Math.pow(existingRange / 2, 2) * existingScore.evidenceCount;
      sumSquaredDiff += existingVariance;
    }
    
    const variance = count > 1 ? sumSquaredDiff / count : 0.1;
    const stdDev = Math.sqrt(variance);
    
    // Adjust interval based on evidence count (more evidence = narrower interval)
    const intervalWidth = stdDev / Math.sqrt(count);
    
    // Ensure interval is within [0, 1]
    return {
      lower: Math.max(0, value - intervalWidth),
      upper: Math.min(1, value + intervalWidth)
    };
  }
}

/**
 * Evidence Mapper component
 */
class EvidenceMapper {
  /**
   * Create a new EvidenceMapper instance
   * 
   * @param {Object} config - Configuration settings
   */
  constructor(config) {
    this.config = config;
  }
  
  /**
   * Create evidence map for a decision
   * 
   * @param {string} decisionId - Unique identifier for the decision
   * @param {Array} evidenceItems - Array of evidence items
   * @returns {Object} Evidence map
   */
  createEvidenceMap(decisionId, evidenceItems) {
    const mapId = uuidv4();
    
    // Group evidence by type
    const evidenceByType = this.groupEvidenceByType(evidenceItems);
    
    // Identify relationships between evidence items
    const relationships = this.identifyRelationships(evidenceItems);
    
    // Create map structure
    const map = {
      id: mapId,
      decisionId,
      rootEvidence: this.identifyRootEvidence(evidenceItems, relationships),
      relationships,
      evidenceByType,
      allEvidence: evidenceItems,
      timestamp: Date.now(),
      metadata: {
        evidenceCount: evidenceItems.length,
        typeDistribution: Object.keys(evidenceByType).reduce((dist, type) => {
          dist[type] = evidenceByType[type].length;
          return dist;
        }, {})
      }
    };
    
    return map;
  }
  
  /**
   * Add evidence to an existing map
   * 
   * @param {string} mapId - Unique identifier for the evidence map
   * @param {Array} newEvidence - Array of new evidence items
   * @param {string} parentId - Optional parent evidence ID for hierarchical relationships
   * @returns {Object} Updated evidence map
   */
  addEvidence(mapId, newEvidence, parentId = null) {
    // Ensure newEvidence is an array
    if (!Array.isArray(newEvidence)) {
      newEvidence = [newEvidence];
    }
    
    // Clone the map to avoid modifying the original
    const map = { ...this.getMap(mapId) };
    
    // Add new evidence to allEvidence
    map.allEvidence = [...map.allEvidence, ...newEvidence];
    
    // Update evidenceByType
    const newEvidenceByType = this.groupEvidenceByType(newEvidence);
    Object.keys(newEvidenceByType).forEach(type => {
      if (!map.evidenceByType[type]) {
        map.evidenceByType[type] = [];
      }
      map.evidenceByType[type] = [...map.evidenceByType[type], ...newEvidenceByType[type]];
    });
    
    // Update relationships
    const newRelationships = this.identifyRelationships(newEvidence);
    
    // Add parent relationship if specified
    if (parentId) {
      newEvidence.forEach(item => {
        newRelationships.push({
          parentId,
          childId: item.id,
          relationshipType: 'supports'
        });
      });
    }
    
    map.relationships = [...map.relationships, ...newRelationships];
    
    // Update root evidence if no parent specified
    if (!parentId) {
      const newRoots = this.identifyRootEvidence(newEvidence, map.relationships);
      map.rootEvidence = [...map.rootEvidence, ...newRoots];
    }
    
    // Update metadata
    map.timestamp = Date.now();
    map.metadata.evidenceCount = map.allEvidence.length;
    map.metadata.typeDistribution = Object.keys(map.evidenceByType).reduce((dist, type) => {
      dist[type] = map.evidenceByType[type].length;
      return dist;
    }, {});
    
    return map;
  }
  
  /**
   * Remove evidence from a map
   * 
   * @param {string} mapId - Unique identifier for the evidence map
   * @param {string} evidenceId - Unique identifier for the evidence to remove
   * @returns {Object} Updated evidence map
   */
  removeEvidence(mapId, evidenceId) {
    // Clone the map to avoid modifying the original
    const map = { ...this.getMap(mapId) };
    
    // Find the evidence item
    const evidenceIndex = map.allEvidence.findIndex(item => item.id === evidenceId);
    if (evidenceIndex === -1) {
      throw new Error(`Evidence ${evidenceId} not found in map ${mapId}`);
    }
    
    const evidence = map.allEvidence[evidenceIndex];
    
    // Remove from allEvidence
    map.allEvidence = map.allEvidence.filter(item => item.id !== evidenceId);
    
    // Remove from evidenceByType
    if (map.evidenceByType[evidence.type]) {
      map.evidenceByType[evidence.type] = map.evidenceByType[evidence.type]
        .filter(item => item.id !== evidenceId);
    }
    
    // Remove from rootEvidence
    map.rootEvidence = map.rootEvidence.filter(item => item.id !== evidenceId);
    
    // Remove relationships
    map.relationships = map.relationships.filter(rel => 
      rel.parentId !== evidenceId && rel.childId !== evidenceId);
    
    // Update metadata
    map.timestamp = Date.now();
    map.metadata.evidenceCount = map.allEvidence.length;
    map.metadata.typeDistribution = Object.keys(map.evidenceByType).reduce((dist, type) => {
      dist[type] = map.evidenceByType[type].length;
      return dist;
    }, {});
    
    return map;
  }
  
  /**
   * Get map by ID (placeholder - would be replaced with actual storage)
   * 
   * @param {string} mapId - Unique identifier for the evidence map
   * @returns {Object} Evidence map
   * @private
   */
  getMap(mapId) {
    // In a real implementation, this would retrieve from storage
    // For now, return a placeholder
    return {
      id: mapId,
      decisionId: 'decision-123',
      rootEvidence: [],
      relationships: [],
      evidenceByType: {},
      allEvidence: [],
      timestamp: Date.now(),
      metadata: {
        evidenceCount: 0,
        typeDistribution: {}
      }
    };
  }
  
  /**
   * Group evidence items by type
   * 
   * @param {Array} evidenceItems - Array of evidence items
   * @returns {Object} Evidence grouped by type
   * @private
   */
  groupEvidenceByType(evidenceItems) {
    return evidenceItems.reduce((groups, item) => {
      const type = item.type || 'unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
      return groups;
    }, {});
  }
  
  /**
   * Identify relationships between evidence items
   * 
   * @param {Array} evidenceItems - Array of evidence items
   * @returns {Array} Array of relationships
   * @private
   */
  identifyRelationships(evidenceItems) {
    const relationships = [];
    
    // Simple relationship identification based on metadata
    evidenceItems.forEach(item => {
      if (item.metadata && item.metadata.parentId) {
        relationships.push({
          parentId: item.metadata.parentId,
          childId: item.id,
          relationshipType: item.metadata.relationshipType || 'supports'
        });
      }
    });
    
    return relationships;
  }
  
  /**
   * Identify root evidence items
   * 
   * @param {Array} evidenceItems - Array of evidence items
   * @param {Array} relationships - Array of relationships
   * @returns {Array} Array of root evidence items
   * @private
   */
  identifyRootEvidence(evidenceItems, relationships) {
    // Find all child IDs in relationships
    const childIds = relationships.map(rel => rel.childId);
    
    // Root evidence is evidence that is not a child in any relationship
    return evidenceItems.filter(item => !childIds.includes(item.id));
  }
}

/**
 * Confidence Analytics component
 */
class ConfidenceAnalytics {
  /**
   * Create a new ConfidenceAnalytics instance
   * 
   * @param {Object} config - Configuration settings
   */
  constructor(config) {
    this.config = config;
    
    // Initialize analytics storage
    this.confidenceScores = [];
    this.confidenceUpdates = [];
    this.confidenceTrends = {};
    this.lowConfidencePatterns = [];
    this.thresholdViolations = [];
  }
  
  /**
   * Track confidence score
   * 
   * @param {Object} score - Confidence score
   * @param {Object} context - Context information
   */
  trackConfidenceScore(score, context = {}) {
    // Store score with context
    this.confidenceScores.push({
      ...score,
      context,
      recordedAt: Date.now()
    });
    
    // Check for threshold violation
    if (score.thresholdStatus === 'below') {
      this.thresholdViolations.push({
        score,
        context,
        timestamp: Date.now()
      });
    }
    
    // Update trends
    this.updateTrends(score, context);
    
    // Check for patterns
    this.checkForPatterns();
  }
  
  /**
   * Track confidence update
   * 
   * @param {Object} previousScore - Previous confidence score
   * @param {Object} newScore - New confidence score
   * @param {Object} context - Context information
   */
  trackConfidenceUpdate(previousScore, newScore, context = {}) {
    // Store update
    this.confidenceUpdates.push({
      previousScore,
      newScore,
      change: newScore.value - previousScore.value,
      context,
      timestamp: Date.now()
    });
    
    // Update trends
    this.updateTrends(newScore, context);
    
    // Check for patterns
    this.checkForPatterns();
  }
  
  /**
   * Update confidence trends
   * 
   * @param {Object} score - Confidence score
   * @param {Object} context - Context information
   * @private
   */
  updateTrends(score, context) {
    // Group by context type if available
    const contextType = context.type || 'default';
    
    if (!this.confidenceTrends[contextType]) {
      this.confidenceTrends[contextType] = {
        scores: [],
        average: 0,
        min: 1,
        max: 0
      };
    }
    
    const trend = this.confidenceTrends[contextType];
    
    // Add score
    trend.scores.push({
      value: score.value,
      timestamp: Date.now(),
      context
    });
    
    // Limit array size
    if (trend.scores.length > 100) {
      trend.scores.shift();
    }
    
    // Update statistics
    trend.average = trend.scores.reduce((sum, s) => sum + s.value, 0) / trend.scores.length;
    trend.min = Math.min(trend.min, score.value);
    trend.max = Math.max(trend.max, score.value);
  }
  
  /**
   * Check for confidence patterns
   * 
   * @private
   */
  checkForPatterns() {
    // Check for low confidence patterns
    this.identifyLowConfidencePatterns();
  }
  
  /**
   * Identify low confidence patterns
   * 
   * @private
   */
  identifyLowConfidencePatterns() {
    // Simple pattern detection based on recent scores
    const recentScores = this.confidenceScores.slice(-20);
    
    // Group by context type
    const scoresByContext = recentScores.reduce((groups, score) => {
      const contextType = score.context.type || 'default';
      if (!groups[contextType]) {
        groups[contextType] = [];
      }
      groups[contextType].push(score);
      return groups;
    }, {});
    
    // Check each context group for patterns
    Object.keys(scoresByContext).forEach(contextType => {
      const scores = scoresByContext[contextType];
      
      // Check for consistently low scores
      const lowScores = scores.filter(s => s.value < 0.5);
      if (lowScores.length >= 3 && lowScores.length / scores.length >= 0.6) {
        // Add pattern if not already tracked
        const patternExists = this.lowConfidencePatterns.some(p => 
          p.contextType === contextType && 
          Date.now() - p.detectedAt < 3600000); // Within last hour
        
        if (!patternExists) {
          this.lowConfidencePatterns.push({
            contextType,
            averageConfidence: lowScores.reduce((sum, s) => sum + s.value, 0) / lowScores.length,
            sampleSize: lowScores.length,
            detectedAt: Date.now()
          });
        }
      }
    });
  }
  
  /**
   * Get analytics data
   * 
   * @param {Object} options - Options for analytics retrieval
   * @returns {Object} Analytics data
   */
  getAnalytics(options = {}) {
    // Filter data based on options
    const timeRange = options.timeRange || {
      start: 0,
      end: Date.now()
    };
    
    // Filter scores by time range
    const filteredScores = this.confidenceScores.filter(score => 
      score.recordedAt >= timeRange.start && score.recordedAt <= timeRange.end);
    
    // Calculate distribution
    const distribution = this.calculateDistribution(filteredScores);
    
    // Get trends
    const trends = Object.keys(this.confidenceTrends).reduce((result, key) => {
      result[key] = {
        average: this.confidenceTrends[key].average,
        min: this.confidenceTrends[key].min,
        max: this.confidenceTrends[key].max
      };
      return result;
    }, {});
    
    return {
      scoreCount: filteredScores.length,
      distribution,
      trends,
      lowConfidencePatterns: this.lowConfidencePatterns,
      thresholdViolations: this.thresholdViolations.filter(v => 
        v.timestamp >= timeRange.start && v.timestamp <= timeRange.end)
    };
  }
  
  /**
   * Calculate confidence distribution
   * 
   * @param {Array} scores - Array of confidence scores
   * @returns {Object} Confidence distribution
   * @private
   */
  calculateDistribution(scores) {
    const buckets = {
      veryLow: 0,    // 0.0 - 0.2
      low: 0,        // 0.2 - 0.4
      medium: 0,     // 0.4 - 0.6
      high: 0,       // 0.6 - 0.8
      veryHigh: 0    // 0.8 - 1.0
    };
    
    scores.forEach(score => {
      const value = score.value;
      
      if (value < 0.2) buckets.veryLow++;
      else if (value < 0.4) buckets.low++;
      else if (value < 0.6) buckets.medium++;
      else if (value < 0.8) buckets.high++;
      else buckets.veryHigh++;
    });
    
    // Calculate percentages
    const total = scores.length;
    return {
      veryLow: total > 0 ? buckets.veryLow / total : 0,
      low: total > 0 ? buckets.low / total : 0,
      medium: total > 0 ? buckets.medium / total : 0,
      high: total > 0 ? buckets.high / total : 0,
      veryHigh: total > 0 ? buckets.veryHigh / total : 0,
      counts: buckets
    };
  }
  
  /**
   * Persist analytics data
   */
  persistData() {
    // In a real implementation, this would save to disk or database
    // For now, just log the data size
    console.log(`Would persist ${this.confidenceScores.length} confidence scores and ${this.confidenceUpdates.length} updates`);
  }
}

/**
 * Visualization Manager component
 */
class VisualizationManager {
  /**
   * Create a new VisualizationManager instance
   * 
   * @param {Object} config - Configuration settings
   */
  constructor(config) {
    this.config = config;
    
    // Register default visualizations
    this.visualizations = {
      confidenceIndicator: this.prepareConfidenceIndicator,
      evidenceMap: this.prepareEvidenceMap,
      evidenceTable: this.prepareEvidenceTable,
      confidenceTrend: this.prepareConfidenceTrend
    };
  }
  
  /**
   * Prepare visualization data
   * 
   * @param {Object} confidenceScore - Confidence score
   * @param {Object} evidenceMap - Evidence map
   * @param {Object} options - Visualization options
   * @returns {Object} Visualization data
   */
  prepareVisualization(confidenceScore, evidenceMap, options = {}) {
    const visualizationType = options.type || 'confidenceIndicator';
    
    if (!this.visualizations[visualizationType]) {
      throw new Error(`Unknown visualization type: ${visualizationType}`);
    }
    
    return this.visualizations[visualizationType].call(this, confidenceScore, evidenceMap, options);
  }
  
  /**
   * Get available visualization options
   * 
   * @returns {Array} Array of visualization options
   */
  getVisualizationOptions() {
    return Object.keys(this.visualizations).map(key => ({
      id: key,
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }));
  }
  
  /**
   * Register custom visualization
   * 
   * @param {string} name - Visualization name
   * @param {Function} renderer - Visualization renderer function
   */
  registerCustomVisualization(name, renderer) {
    if (typeof renderer !== 'function') {
      throw new Error('Visualization renderer must be a function');
    }
    
    this.visualizations[name] = renderer;
  }
  
  /**
   * Prepare confidence indicator visualization
   * 
   * @param {Object} confidenceScore - Confidence score
   * @param {Object} evidenceMap - Evidence map
   * @param {Object} options - Visualization options
   * @returns {Object} Visualization data
   * @private
   */
  prepareConfidenceIndicator(confidenceScore, evidenceMap, options) {
    // Get threshold for comparison
    const thresholdType = options.thresholdType || 'standard';
    const thresholds = this.config.thresholds || {
      critical: 0.8,
      standard: 0.6,
      informational: 0.4
    };
    
    const threshold = thresholds[thresholdType] || thresholds.standard;
    
    // Determine color based on confidence value
    let color;
    if (confidenceScore.value >= thresholds.critical) {
      color = 'green';
    } else if (confidenceScore.value >= thresholds.standard) {
      color = 'blue';
    } else if (confidenceScore.value >= thresholds.informational) {
      color = 'yellow';
    } else {
      color = 'red';
    }
    
    return {
      type: 'confidenceIndicator',
      value: confidenceScore.value,
      color,
      threshold,
      thresholdType,
      meetsThreshold: confidenceScore.value >= threshold,
      evidenceCount: confidenceScore.evidenceCount,
      algorithm: confidenceScore.algorithm,
      timestamp: confidenceScore.timestamp
    };
  }
  
  /**
   * Prepare evidence map visualization
   * 
   * @param {Object} confidenceScore - Confidence score
   * @param {Object} evidenceMap - Evidence map
   * @param {Object} options - Visualization options
   * @returns {Object} Visualization data
   * @private
   */
  prepareEvidenceMap(confidenceScore, evidenceMap, options) {
    // Prepare nodes (evidence items)
    const nodes = evidenceMap.allEvidence.map(item => ({
      id: item.id,
      type: item.type,
      label: this.getEvidenceLabel(item),
      quality: item.quality,
      weight: item.weight,
      metadata: item.metadata
    }));
    
    // Prepare edges (relationships)
    const edges = evidenceMap.relationships.map(rel => ({
      source: rel.parentId,
      target: rel.childId,
      type: rel.relationshipType
    }));
    
    // Add decision node
    nodes.push({
      id: 'decision',
      type: 'decision',
      label: `Decision (${confidenceScore.value.toFixed(2)})`,
      confidence: confidenceScore.value
    });
    
    // Add edges from root evidence to decision
    evidenceMap.rootEvidence.forEach(item => {
      edges.push({
        source: item.id,
        target: 'decision',
        type: 'supports'
      });
    });
    
    return {
      type: 'evidenceMap',
      nodes,
      edges,
      confidence: confidenceScore.value,
      timestamp: evidenceMap.timestamp
    };
  }
  
  /**
   * Prepare evidence table visualization
   * 
   * @param {Object} confidenceScore - Confidence score
   * @param {Object} evidenceMap - Evidence map
   * @param {Object} options - Visualization options
   * @returns {Object} Visualization data
   * @private
   */
  prepareEvidenceTable(confidenceScore, evidenceMap, options) {
    // Prepare table rows
    const rows = evidenceMap.allEvidence.map(item => ({
      id: item.id,
      type: item.type,
      description: this.getEvidenceLabel(item),
      quality: item.quality,
      weight: item.weight,
      contribution: item.quality * item.weight,
      timestamp: new Date(item.timestamp).toISOString()
    }));
    
    // Sort by contribution if requested
    if (options.sortByContribution) {
      rows.sort((a, b) => b.contribution - a.contribution);
    }
    
    return {
      type: 'evidenceTable',
      rows,
      confidence: confidenceScore.value,
      evidenceCount: rows.length,
      timestamp: evidenceMap.timestamp
    };
  }
  
  /**
   * Prepare confidence trend visualization
   * 
   * @param {Object} confidenceScore - Confidence score
   * @param {Object} evidenceMap - Evidence map
   * @param {Object} options - Visualization options
   * @returns {Object} Visualization data
   * @private
   */
  prepareConfidenceTrend(confidenceScore, evidenceMap, options) {
    // In a real implementation, this would retrieve historical data
    // For now, return placeholder data
    const trendPoints = [
      { value: 0.5, timestamp: Date.now() - 50000 },
      { value: 0.55, timestamp: Date.now() - 40000 },
      { value: 0.6, timestamp: Date.now() - 30000 },
      { value: 0.58, timestamp: Date.now() - 20000 },
      { value: confidenceScore.value, timestamp: confidenceScore.timestamp }
    ];
    
    return {
      type: 'confidenceTrend',
      points: trendPoints,
      currentValue: confidenceScore.value,
      averageValue: trendPoints.reduce((sum, p) => sum + p.value, 0) / trendPoints.length,
      minValue: Math.min(...trendPoints.map(p => p.value)),
      maxValue: Math.max(...trendPoints.map(p => p.value))
    };
  }
  
  /**
   * Get label for evidence item
   * 
   * @param {Object} evidence - Evidence item
   * @returns {string} Evidence label
   * @private
   */
  getEvidenceLabel(evidence) {
    switch (evidence.type) {
      case 'trace':
        return `Trace: ${evidence.content.sourceType || 'Unknown'}`;
      case 'source':
        return `Source: ${evidence.content.type || 'Unknown'}`;
      case 'reasoning':
        return 'Reasoning';
      case 'belief':
        return `Belief: ${evidence.content.beliefId || 'Unknown'}`;
      case 'constraint':
        return `Constraint: ${evidence.content.type || 'Unknown'}`;
      default:
        return `Evidence: ${evidence.type}`;
    }
  }
}

module.exports = ConfidenceScoring;
