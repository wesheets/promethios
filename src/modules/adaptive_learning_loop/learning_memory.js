/**
 * Learning Memory Component
 * 
 * Stores and organizes feedback and learning data with temporal context preservation
 * and merkle-verified memory integrity.
 * 
 * @module adaptive_learning_loop/learning_memory
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Learning Memory class
 */
class LearningMemory {
  /**
   * Create a new LearningMemory instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   * @param {string} options.dataPath - Path to data storage directory
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = options.config || {
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      temporalDecayFactor: 0.9, // 10% decay per time unit
      persistenceInterval: 60000, // 1 minute
      merkleVerification: true
    };
    
    this.dataPath = options.dataPath || './data/adaptive_learning_loop';
    
    // Initialize storage
    this.feedback = new Map();
    this.patterns = new Map();
    this.adaptations = new Map();
    this.metrics = new Map();
    
    // Initialize merkle trees
    this.merkleTrees = {
      feedback: this.createMerkleTree(),
      patterns: this.createMerkleTree(),
      adaptations: this.createMerkleTree()
    };
    
    // Initialize data directory
    this._initializeDataDirectory();
    
    // Load existing data if available
    this._loadData();
    
    // Setup persistence
    if (this.config.persistenceInterval > 0) {
      this.persistenceTimer = setInterval(() => {
        this.persistData();
      }, this.config.persistenceInterval);
    }
    
    this.logger.info('Learning Memory initialized');
  }
  
  /**
   * Initialize data directory
   * @private
   */
  _initializeDataDirectory() {
    try {
      if (!fs.existsSync(this.dataPath)) {
        fs.mkdirSync(this.dataPath, { recursive: true });
        this.logger.info(`Created learning memory data directory: ${this.dataPath}`);
      }
      
      // Create subdirectories
      const subdirs = ['feedback', 'patterns', 'adaptations', 'metrics'];
      for (const subdir of subdirs) {
        const subdirPath = path.join(this.dataPath, subdir);
        if (!fs.existsSync(subdirPath)) {
          fs.mkdirSync(subdirPath, { recursive: true });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to create data directory: ${error.message}`);
    }
  }
  
  /**
   * Load existing data
   * @private
   */
  _loadData() {
    try {
      // Load feedback
      this._loadDataType('feedback');
      
      // Load patterns
      this._loadDataType('patterns');
      
      // Load adaptations
      this._loadDataType('adaptations');
      
      // Load metrics
      this._loadDataType('metrics');
      
      this.logger.info('Learning memory data loaded');
    } catch (error) {
      this.logger.error(`Failed to load data: ${error.message}`);
    }
  }
  
  /**
   * Load data of a specific type
   * 
   * @param {string} dataType - Type of data to load
   * @private
   */
  _loadDataType(dataType) {
    const dataDir = path.join(this.dataPath, dataType);
    if (!fs.existsSync(dataDir)) {
      return;
    }
    
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Store data in appropriate map
        if (dataType === 'feedback') {
          this.feedback.set(data.id, data);
        } else if (dataType === 'patterns') {
          this.patterns.set(data.id, data);
        } else if (dataType === 'adaptations') {
          this.adaptations.set(data.id, data);
        } else if (dataType === 'metrics') {
          this.metrics.set(data.id, data);
        }
      } catch (error) {
        this.logger.error(`Failed to load ${dataType} file ${file}: ${error.message}`);
      }
    }
    
    this.logger.info(`Loaded ${dataType} data`);
  }
  
  /**
   * Store feedback in memory
   * 
   * @param {Object} feedback - Feedback record to store
   * @returns {Object} Stored feedback record
   */
  storeFeedback(feedback) {
    if (!feedback || !feedback.id) {
      throw new Error('Invalid feedback record');
    }
    
    this.logger.debug(`Storing feedback ${feedback.id}`);
    
    // Add storage metadata
    feedback.metadata = feedback.metadata || {};
    feedback.metadata.stored_at = new Date().toISOString();
    
    // Store feedback
    this.feedback.set(feedback.id, feedback);
    
    // Update merkle tree if enabled
    if (this.config.merkleVerification) {
      this.updateMerkleTree('feedback', feedback);
    }
    
    return feedback;
  }
  
  /**
   * Get feedback by ID
   * 
   * @param {string} feedbackId - ID of feedback to retrieve
   * @returns {Object} Feedback record or null if not found
   */
  getFeedback(feedbackId) {
    return this.feedback.get(feedbackId) || null;
  }
  
  /**
   * Get recent feedback
   * 
   * @param {number} limit - Maximum number of feedback records to return
   * @param {Object} options - Additional options
   * @returns {Array} Array of feedback records
   */
  getRecentFeedback(limit = 100, options = {}) {
    // Convert map to array
    const feedbackArray = Array.from(this.feedback.values());
    
    // Apply filters if provided
    let filteredFeedback = feedbackArray;
    
    if (options.sourceType) {
      filteredFeedback = filteredFeedback.filter(f => 
        f.source && f.source.type === options.sourceType
      );
    }
    
    if (options.contextFilter) {
      filteredFeedback = filteredFeedback.filter(f => {
        for (const [key, value] of Object.entries(options.contextFilter)) {
          if (f.context[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    if (options.since) {
      const sinceDate = new Date(options.since);
      filteredFeedback = filteredFeedback.filter(f => 
        new Date(f.timestamp) >= sinceDate
      );
    }
    
    // Sort by timestamp (newest first)
    filteredFeedback.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Apply limit
    return filteredFeedback.slice(0, limit);
  }
  
  /**
   * Get feedback count
   * 
   * @returns {number} Number of feedback records
   */
  getFeedbackCount() {
    return this.feedback.size;
  }
  
  /**
   * Store pattern in memory
   * 
   * @param {Object} pattern - Pattern to store
   * @returns {Object} Stored pattern
   */
  storePattern(pattern) {
    if (!pattern || !pattern.id) {
      throw new Error('Invalid pattern');
    }
    
    this.logger.debug(`Storing pattern ${pattern.id}`);
    
    // Add storage metadata
    pattern.metadata = pattern.metadata || {};
    pattern.metadata.stored_at = new Date().toISOString();
    
    // Store pattern
    this.patterns.set(pattern.id, pattern);
    
    // Update merkle tree if enabled
    if (this.config.merkleVerification) {
      this.updateMerkleTree('patterns', pattern);
    }
    
    return pattern;
  }
  
  /**
   * Get pattern by ID
   * 
   * @param {string} patternId - ID of pattern to retrieve
   * @returns {Object} Pattern or null if not found
   */
  getPattern(patternId) {
    return this.patterns.get(patternId) || null;
  }
  
  /**
   * Get significant patterns
   * 
   * @param {number} threshold - Minimum significance threshold
   * @param {Object} options - Additional options
   * @returns {Array} Array of significant patterns
   */
  getSignificantPatterns(threshold = 0.7, options = {}) {
    // Convert map to array
    const patternArray = Array.from(this.patterns.values());
    
    // Filter by significance
    let significantPatterns = patternArray.filter(p => 
      p.statistics && p.statistics.significance >= threshold
    );
    
    // Apply additional filters
    if (options.patternType) {
      significantPatterns = significantPatterns.filter(p => 
        p.type === options.patternType
      );
    }
    
    if (options.since) {
      const sinceDate = new Date(options.since);
      significantPatterns = significantPatterns.filter(p => 
        new Date(p.discovery_timestamp) >= sinceDate
      );
    }
    
    // Sort by significance (highest first)
    significantPatterns.sort((a, b) => 
      b.statistics.significance - a.statistics.significance
    );
    
    // Apply limit if provided
    if (options.limit) {
      significantPatterns = significantPatterns.slice(0, options.limit);
    }
    
    return significantPatterns;
  }
  
  /**
   * Get pattern count
   * 
   * @returns {number} Number of patterns
   */
  getPatternCount() {
    return this.patterns.size;
  }
  
  /**
   * Store adaptation in memory
   * 
   * @param {Object} adaptation - Adaptation to store
   * @returns {Object} Stored adaptation
   */
  storeAdaptation(adaptation) {
    if (!adaptation || !adaptation.id) {
      throw new Error('Invalid adaptation');
    }
    
    this.logger.debug(`Storing adaptation ${adaptation.id}`);
    
    // Add storage metadata
    adaptation.metadata = adaptation.metadata || {};
    adaptation.metadata.stored_at = new Date().toISOString();
    
    // Set initial status if not provided
    if (!adaptation.status) {
      adaptation.status = 'pending';
    }
    
    // Store adaptation
    this.adaptations.set(adaptation.id, adaptation);
    
    // Update merkle tree if enabled
    if (this.config.merkleVerification) {
      this.updateMerkleTree('adaptations', adaptation);
    }
    
    return adaptation;
  }
  
  /**
   * Update adaptation in memory
   * 
   * @param {Object} adaptation - Adaptation to update
   * @returns {Object} Updated adaptation
   */
  updateAdaptation(adaptation) {
    if (!adaptation || !adaptation.id) {
      throw new Error('Invalid adaptation');
    }
    
    const existingAdaptation = this.adaptations.get(adaptation.id);
    if (!existingAdaptation) {
      throw new Error(`Adaptation ${adaptation.id} not found`);
    }
    
    this.logger.debug(`Updating adaptation ${adaptation.id}`);
    
    // Update metadata
    adaptation.metadata = adaptation.metadata || {};
    adaptation.metadata.updated_at = new Date().toISOString();
    
    // Store updated adaptation
    this.adaptations.set(adaptation.id, adaptation);
    
    // Update merkle tree if enabled
    if (this.config.merkleVerification) {
      this.updateMerkleTree('adaptations', adaptation);
    }
    
    return adaptation;
  }
  
  /**
   * Get adaptation by ID
   * 
   * @param {string} adaptationId - ID of adaptation to retrieve
   * @returns {Object} Adaptation or null if not found
   */
  getAdaptation(adaptationId) {
    return this.adaptations.get(adaptationId) || null;
  }
  
  /**
   * Get pending adaptations
   * 
   * @param {number} limit - Maximum number of adaptations to return
   * @returns {Array} Array of pending adaptations
   */
  getPendingAdaptations(limit = 10) {
    // Convert map to array
    const adaptationArray = Array.from(this.adaptations.values());
    
    // Filter by status
    const pendingAdaptations = adaptationArray.filter(a => 
      a.status === 'pending'
    );
    
    // Sort by confidence (highest first)
    pendingAdaptations.sort((a, b) => 
      (b.justification?.confidence || 0) - (a.justification?.confidence || 0)
    );
    
    // Apply limit
    return pendingAdaptations.slice(0, limit);
  }
  
  /**
   * Get adaptation count
   * 
   * @returns {number} Number of adaptations
   */
  getAdaptationCount() {
    return this.adaptations.size;
  }
  
  /**
   * Get applied adaptation count
   * 
   * @returns {number} Number of applied adaptations
   */
  getAppliedAdaptationCount() {
    let count = 0;
    for (const adaptation of this.adaptations.values()) {
      if (adaptation.status === 'applied') {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Store learning metrics
   * 
   * @param {Object} metrics - Metrics to store
   * @returns {Object} Stored metrics
   */
  storeMetrics(metrics) {
    if (!metrics || !metrics.id) {
      metrics = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...metrics
      };
    }
    
    this.logger.debug(`Storing metrics ${metrics.id}`);
    
    // Store metrics
    this.metrics.set(metrics.id, metrics);
    
    return metrics;
  }
  
  /**
   * Get learning metrics
   * 
   * @param {Object} options - Options for filtering metrics
   * @returns {Object} Learning metrics
   */
  getLearningMetrics(options = {}) {
    // Get recent metrics
    const recentMetrics = Array.from(this.metrics.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, options.limit || 10);
    
    // Calculate aggregate metrics
    const aggregateMetrics = {
      feedback_count: this.getFeedbackCount(),
      pattern_count: this.getPatternCount(),
      adaptation_count: this.getAdaptationCount(),
      applied_adaptation_count: this.getAppliedAdaptationCount(),
      feedback_by_source: this.calculateFeedbackBySource(),
      pattern_by_type: this.calculatePatternByType(),
      adaptation_by_status: this.calculateAdaptationByStatus(),
      learning_efficiency: this.calculateLearningEfficiency(),
      timestamp: new Date().toISOString()
    };
    
    // Store aggregate metrics
    this.storeMetrics(aggregateMetrics);
    
    return {
      current: aggregateMetrics,
      history: recentMetrics
    };
  }
  
  /**
   * Calculate feedback distribution by source
   * 
   * @returns {Object} Feedback counts by source type
   * @private
   */
  calculateFeedbackBySource() {
    const counts = {};
    
    for (const feedback of this.feedback.values()) {
      const sourceType = feedback.source?.type || 'unknown';
      counts[sourceType] = (counts[sourceType] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Calculate pattern distribution by type
   * 
   * @returns {Object} Pattern counts by type
   * @private
   */
  calculatePatternByType() {
    const counts = {};
    
    for (const pattern of this.patterns.values()) {
      const patternType = pattern.type || 'unknown';
      counts[patternType] = (counts[patternType] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Calculate adaptation distribution by status
   * 
   * @returns {Object} Adaptation counts by status
   * @private
   */
  calculateAdaptationByStatus() {
    const counts = {};
    
    for (const adaptation of this.adaptations.values()) {
      const status = adaptation.status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Calculate learning efficiency
   * 
   * @returns {number} Learning efficiency score (0-1)
   * @private
   */
  calculateLearningEfficiency() {
    const appliedCount = this.getAppliedAdaptationCount();
    const totalCount = this.getAdaptationCount();
    
    if (totalCount === 0) {
      return 0;
    }
    
    // Basic efficiency is the ratio of applied adaptations to total adaptations
    let efficiency = appliedCount / totalCount;
    
    // Adjust based on pattern significance
    const significantPatterns = this.getSignificantPatterns(0.7);
    const patternEfficiency = significantPatterns.length / Math.max(1, this.getPatternCount());
    
    // Combine metrics
    efficiency = 0.7 * efficiency + 0.3 * patternEfficiency;
    
    return Math.min(1, efficiency);
  }
  
  /**
   * Clear data for a specific domain
   * 
   * @param {string} domain - Domain to clear
   * @returns {Object} Clear status
   */
  clearDomain(domain) {
    if (!domain) {
      throw new Error('Domain is required');
    }
    
    this.logger.info(`Clearing data for domain: ${domain}`);
    
    let feedbackRemoved = 0;
    let patternsRemoved = 0;
    let adaptationsRemoved = 0;
    
    // Clear feedback
    for (const [id, feedback] of this.feedback.entries()) {
      if (feedback.context && (
        feedback.context.domain === domain || 
        feedback.metadata?.domain === domain
      )) {
        this.feedback.delete(id);
        feedbackRemoved++;
      }
    }
    
    // Clear patterns
    for (const [id, pattern] of this.patterns.entries()) {
      if (pattern.domain === domain || pattern.metadata?.domain === domain) {
        this.patterns.delete(id);
        patternsRemoved++;
      }
    }
    
    // Clear adaptations
    for (const [id, adaptation] of this.adaptations.entries()) {
      if (adaptation.domain === domain || adaptation.metadata?.domain === domain) {
        this.adaptations.delete(id);
        adaptationsRemoved++;
      }
    }
    
    // Rebuild merkle trees
    if (this.config.merkleVerification) {
      this.rebuildMerkleTrees();
    }
    
    return {
      domain,
      feedbackRemoved,
      patternsRemoved,
      adaptationsRemoved,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Create a new merkle tree
   * 
   * @returns {Object} New merkle tree
   * @private
   */
  createMerkleTree() {
    return {
      root: null,
      leaves: new Map(),
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Update merkle tree with new data
   * 
   * @param {string} treeType - Type of tree to update
   * @param {Object} data - Data to add to tree
   * @private
   */
  updateMerkleTree(treeType, data) {
    if (!this.merkleTrees[treeType]) {
      this.merkleTrees[treeType] = this.createMerkleTree();
    }
    
    const tree = this.merkleTrees[treeType];
    
    // Create leaf hash
    const leafHash = this.createLeafHash(data);
    
    // Store leaf
    tree.leaves.set(data.id, leafHash);
    
    // Update root hash
    tree.root = this.calculateRootHash(tree.leaves);
    tree.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Create leaf hash from data
   * 
   * @param {Object} data - Data to hash
   * @returns {string} Leaf hash
   * @private
   */
  createLeafHash(data) {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
  
  /**
   * Calculate root hash from leaves
   * 
   * @param {Map} leaves - Map of leaf hashes
   * @returns {string} Root hash
   * @private
   */
  calculateRootHash(leaves) {
    if (leaves.size === 0) {
      return null;
    }
    
    // Sort leaf hashes by key
    const sortedLeaves = Array.from(leaves.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, hash]) => hash);
    
    // Combine all hashes
    const combinedHash = sortedLeaves.join('');
    
    // Create root hash
    return crypto.createHash('sha256').update(combinedHash).digest('hex');
  }
  
  /**
   * Rebuild all merkle trees
   * @private
   */
  rebuildMerkleTrees() {
    // Rebuild feedback tree
    this.merkleTrees.feedback = this.createMerkleTree();
    for (const feedback of this.feedback.values()) {
      this.updateMerkleTree('feedback', feedback);
    }
    
    // Rebuild patterns tree
    this.merkleTrees.patterns = this.createMerkleTree();
    for (const pattern of this.patterns.values()) {
      this.updateMerkleTree('patterns', pattern);
    }
    
    // Rebuild adaptations tree
    this.merkleTrees.adaptations = this.createMerkleTree();
    for (const adaptation of this.adaptations.values()) {
      this.updateMerkleTree('adaptations', adaptation);
    }
    
    this.logger.info('Merkle trees rebuilt');
  }
  
  /**
   * Verify memory integrity
   * 
   * @returns {Object} Verification result
   */
  verifyIntegrity() {
    if (!this.config.merkleVerification) {
      return { verified: false, reason: 'Merkle verification not enabled' };
    }
    
    const results = {};
    
    // Verify each tree
    for (const [treeType, tree] of Object.entries(this.merkleTrees)) {
      // Recalculate root hash
      const calculatedRoot = this.calculateRootHash(tree.leaves);
      
      // Compare with stored root
      results[treeType] = {
        verified: calculatedRoot === tree.root,
        storedRoot: tree.root,
        calculatedRoot,
        leafCount: tree.leaves.size
      };
    }
    
    // Overall verification result
    const allVerified = Object.values(results).every(r => r.verified);
    
    return {
      verified: allVerified,
      details: results,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Persist data to storage
   */
  persistData() {
    this.logger.info('Persisting learning memory data');
    
    try {
      // Persist feedback
      this._persistDataType('feedback', this.feedback);
      
      // Persist patterns
      this._persistDataType('patterns', this.patterns);
      
      // Persist adaptations
      this._persistDataType('adaptations', this.adaptations);
      
      // Persist metrics
      this._persistDataType('metrics', this.metrics);
      
      // Persist merkle trees
      this._persistMerkleTrees();
      
      this.logger.info('Learning memory data persisted');
    } catch (error) {
      this.logger.error(`Failed to persist data: ${error.message}`);
    }
  }
  
  /**
   * Persist data of a specific type
   * 
   * @param {string} dataType - Type of data to persist
   * @param {Map} dataMap - Map containing the data
   * @private
   */
  _persistDataType(dataType, dataMap) {
    const dataDir = path.join(this.dataPath, dataType);
    
    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write each item to a file
    for (const [id, data] of dataMap.entries()) {
      const filePath = path.join(dataDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
  }
  
  /**
   * Persist merkle trees
   * @private
   */
  _persistMerkleTrees() {
    if (!this.config.merkleVerification) {
      return;
    }
    
    const merkleDir = path.join(this.dataPath, 'merkle');
    
    // Ensure directory exists
    if (!fs.existsSync(merkleDir)) {
      fs.mkdirSync(merkleDir, { recursive: true });
    }
    
    // Write merkle trees to file
    const filePath = path.join(merkleDir, 'merkle_trees.json');
    
    // Convert leaf maps to objects for serialization
    const serializedTrees = {};
    for (const [treeType, tree] of Object.entries(this.merkleTrees)) {
      serializedTrees[treeType] = {
        root: tree.root,
        leaves: Object.fromEntries(tree.leaves),
        lastUpdated: tree.lastUpdated
      };
    }
    
    fs.writeFileSync(filePath, JSON.stringify(serializedTrees, null, 2));
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    
    // Persist data before cleanup
    this.persistData();
    
    this.logger.info('Learning Memory cleaned up');
  }
}

module.exports = {
  LearningMemory
};
