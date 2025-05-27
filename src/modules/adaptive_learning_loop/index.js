/**
 * Adaptive Learning Loop Module
 * 
 * This module enables agents to improve their decision-making capabilities over time
 * through systematic feedback processing and behavioral adaptation. By implementing
 * a closed-loop learning system, agents can continuously refine their responses based
 * on outcomes, user feedback, and environmental changes.
 * 
 * @module adaptive_learning_loop
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Import components
const { FeedbackCollector } = require('./feedback_collector');
const { LearningMemory } = require('./learning_memory');
const { PatternRecognizer } = require('./pattern_recognizer');
const { AdaptationEngine } = require('./adaptation_engine');
const { MetaLearningController } = require('./meta_learning_controller');

/**
 * Adaptive Learning Loop Module main class
 */
class AdaptiveLearningLoop {
  /**
   * Create a new AdaptiveLearningLoop instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   * @param {Object} options.beliefTraceManager - Belief Trace Manager for PRISM integration
   * @param {Object} options.toolSelectionHistory - Tool Selection History module
   * @param {Object} options.confidenceScoring - Confidence Scoring module
   * @param {Object} options.governanceIdentity - Governance Identity module
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = options.config || {
      persistenceInterval: 60000, // 1 minute
      learningRate: 0.05,
      explorationRate: 0.2,
      adaptationThreshold: 0.7,
      maxAdaptationsPerCycle: 3,
      dataPath: './data/adaptive_learning_loop'
    };
    
    // Store references to other modules
    this.beliefTraceManager = options.beliefTraceManager;
    this.toolSelectionHistory = options.toolSelectionHistory;
    this.confidenceScoring = options.confidenceScoring;
    this.governanceIdentity = options.governanceIdentity;
    
    // Initialize data directory
    this._initializeDataDirectory();
    
    // Initialize components
    this.feedbackCollector = new FeedbackCollector({
      logger: this.logger,
      config: this.config
    });
    
    this.learningMemory = new LearningMemory({
      logger: this.logger,
      config: this.config,
      dataPath: this.config.dataPath
    });
    
    this.patternRecognizer = new PatternRecognizer({
      logger: this.logger,
      config: this.config,
      learningMemory: this.learningMemory
    });
    
    this.adaptationEngine = new AdaptationEngine({
      logger: this.logger,
      config: this.config,
      patternRecognizer: this.patternRecognizer,
      governanceIdentity: this.governanceIdentity
    });
    
    this.metaLearningController = new MetaLearningController({
      logger: this.logger,
      config: this.config,
      adaptationEngine: this.adaptationEngine,
      learningMemory: this.learningMemory
    });
    
    // Setup persistence
    if (this.config.persistenceInterval > 0) {
      this.persistenceTimer = setInterval(() => {
        this.persistData();
      }, this.config.persistenceInterval);
    }
    
    this.logger.info('Adaptive Learning Loop module initialized');
  }
  
  /**
   * Initialize data directory
   * @private
   */
  _initializeDataDirectory() {
    try {
      if (!fs.existsSync(this.config.dataPath)) {
        fs.mkdirSync(this.config.dataPath, { recursive: true });
        this.logger.info(`Created adaptive learning loop data directory: ${this.config.dataPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create data directory: ${error.message}`);
    }
  }
  
  /**
   * Collect feedback from a source
   * 
   * @param {Object} feedback - Feedback data
   * @param {Object} context - Context information
   * @returns {Object} Processed feedback record
   */
  collectFeedback(feedback, context = {}) {
    this.logger.info('Collecting feedback');
    
    // Process and validate feedback
    const feedbackRecord = this.feedbackCollector.processFeedback(feedback, context);
    
    // Store feedback in learning memory
    this.learningMemory.storeFeedback(feedbackRecord);
    
    // Trigger pattern recognition if needed
    if (this.config.immediatePatternRecognition) {
      this.recognizePatterns({ feedbackId: feedbackRecord.id });
    }
    
    return feedbackRecord;
  }
  
  /**
   * Recognize patterns in feedback and outcomes
   * 
   * @param {Object} options - Pattern recognition options
   * @returns {Array} Recognized patterns
   */
  recognizePatterns(options = {}) {
    this.logger.info('Recognizing patterns');
    
    // Retrieve relevant feedback from memory
    const relevantFeedback = options.feedbackId 
      ? [this.learningMemory.getFeedback(options.feedbackId)]
      : this.learningMemory.getRecentFeedback(options.limit || 100);
    
    // Recognize patterns
    const patterns = this.patternRecognizer.recognizePatterns(relevantFeedback, options);
    
    // Store patterns in memory
    patterns.forEach(pattern => {
      this.learningMemory.storePattern(pattern);
    });
    
    // Trigger adaptation generation if needed
    if (this.config.immediateAdaptation && patterns.length > 0) {
      this.generateAdaptations({ patternIds: patterns.map(p => p.id) });
    }
    
    return patterns;
  }
  
  /**
   * Generate adaptations based on patterns
   * 
   * @param {Object} options - Adaptation generation options
   * @returns {Array} Generated adaptations
   */
  generateAdaptations(options = {}) {
    this.logger.info('Generating adaptations');
    
    // Retrieve relevant patterns
    const relevantPatterns = options.patternIds
      ? options.patternIds.map(id => this.learningMemory.getPattern(id)).filter(Boolean)
      : this.learningMemory.getSignificantPatterns(options.threshold || this.config.adaptationThreshold);
    
    // Generate adaptations
    const adaptations = this.adaptationEngine.generateAdaptations(relevantPatterns, options);
    
    // Store adaptations in memory
    adaptations.forEach(adaptation => {
      this.learningMemory.storeAdaptation(adaptation);
    });
    
    return adaptations;
  }
  
  /**
   * Apply adaptations to agent behavior
   * 
   * @param {Object} options - Adaptation application options
   * @returns {Array} Applied adaptations
   */
  applyAdaptations(options = {}) {
    this.logger.info('Applying adaptations');
    
    // Get pending adaptations
    const pendingAdaptations = options.adaptationIds
      ? options.adaptationIds.map(id => this.learningMemory.getAdaptation(id)).filter(Boolean)
      : this.learningMemory.getPendingAdaptations(options.limit || this.config.maxAdaptationsPerCycle);
    
    // Apply adaptations
    const appliedAdaptations = this.adaptationEngine.applyAdaptations(pendingAdaptations, options);
    
    // Update adaptation status in memory
    appliedAdaptations.forEach(adaptation => {
      adaptation.status = 'applied';
      adaptation.appliedAt = new Date().toISOString();
      this.learningMemory.updateAdaptation(adaptation);
    });
    
    return appliedAdaptations;
  }
  
  /**
   * Rollback an adaptation
   * 
   * @param {string} adaptationId - ID of the adaptation to rollback
   * @returns {Object} Rolled back adaptation
   */
  rollbackAdaptation(adaptationId) {
    this.logger.info(`Rolling back adaptation ${adaptationId}`);
    
    // Get adaptation
    const adaptation = this.learningMemory.getAdaptation(adaptationId);
    if (!adaptation) {
      throw new Error(`Adaptation ${adaptationId} not found`);
    }
    
    // Rollback adaptation
    const rolledBackAdaptation = this.adaptationEngine.rollbackAdaptation(adaptation);
    
    // Update adaptation status in memory
    rolledBackAdaptation.status = 'rolled_back';
    rolledBackAdaptation.rolledBackAt = new Date().toISOString();
    this.learningMemory.updateAdaptation(rolledBackAdaptation);
    
    return rolledBackAdaptation;
  }
  
  /**
   * Optimize learning parameters
   * 
   * @param {Object} options - Optimization options
   * @returns {Object} Updated learning parameters
   */
  optimizeLearning(options = {}) {
    this.logger.info('Optimizing learning parameters');
    
    // Get learning performance metrics
    const metrics = this.learningMemory.getLearningMetrics();
    
    // Optimize learning parameters
    const optimizedParams = this.metaLearningController.optimizeLearning(metrics, options);
    
    // Apply optimized parameters
    Object.assign(this.config, optimizedParams);
    
    return optimizedParams;
  }
  
  /**
   * Get learning status
   * 
   * @returns {Object} Learning status
   */
  getLearningStatus() {
    return {
      feedbackCount: this.learningMemory.getFeedbackCount(),
      patternCount: this.learningMemory.getPatternCount(),
      adaptationCount: this.learningMemory.getAdaptationCount(),
      appliedAdaptationCount: this.learningMemory.getAppliedAdaptationCount(),
      learningRate: this.config.learningRate,
      explorationRate: this.config.explorationRate,
      adaptationThreshold: this.config.adaptationThreshold,
      learningEfficiency: this.metaLearningController.calculateLearningEfficiency(),
      lastOptimization: this.metaLearningController.getLastOptimizationTime()
    };
  }
  
  /**
   * Reset learning in a specific domain
   * 
   * @param {string} domain - Domain to reset
   * @returns {Object} Reset status
   */
  resetLearning(domain) {
    this.logger.info(`Resetting learning in domain: ${domain}`);
    
    // Reset domain-specific learning
    const resetStatus = this.metaLearningController.resetDomain(domain);
    
    // Clear domain-specific data from memory
    this.learningMemory.clearDomain(domain);
    
    return resetStatus;
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
    
    // Register feedback collection hook
    hooksManager.registerHook('feedback_received', (data) => {
      this.handleFeedbackHook(data);
    });
    
    // Register decision outcome hook
    hooksManager.registerHook('decision_outcome', (data) => {
      this.handleDecisionOutcomeHook(data);
    });
    
    // Register adaptation application hook
    hooksManager.registerHook('before_adaptation_application', (data) => {
      return this.handleBeforeAdaptationHook(data);
    });
    
    // Register post-adaptation hook
    hooksManager.registerHook('after_adaptation_application', (data) => {
      this.handleAfterAdaptationHook(data);
    });
    
    this.logger.info('Adaptive Learning Loop hooks registered');
  }
  
  /**
   * Handle feedback hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleFeedbackHook(data) {
    if (!data || !data.feedback) return;
    
    this.collectFeedback(data.feedback, data.context || {});
  }
  
  /**
   * Handle decision outcome hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleDecisionOutcomeHook(data) {
    if (!data || !data.decision || !data.outcome) return;
    
    // Create feedback from outcome
    const feedback = {
      source: {
        type: 'outcome',
        id: data.outcome.id || uuidv4()
      },
      context: {
        task_id: data.task ? data.task.id : undefined,
        decision_id: data.decision.id
      },
      content: {
        outcome: data.outcome,
        metrics: data.metrics || {}
      }
    };
    
    this.collectFeedback(feedback, data);
  }
  
  /**
   * Handle before adaptation hook
   * 
   * @param {Object} data - Hook data
   * @returns {boolean} Whether to proceed with adaptation
   * @private
   */
  handleBeforeAdaptationHook(data) {
    if (!data || !data.adaptation) return true;
    
    // Verify adaptation with governance identity
    if (this.governanceIdentity) {
      const verificationResult = this.verifyAdaptationCompliance(data.adaptation);
      if (!verificationResult.compliant) {
        this.logger.warn(`Adaptation ${data.adaptation.id} failed governance compliance check: ${verificationResult.reason}`);
        return false;
      }
    }
    
    // Verify adaptation with belief trace
    if (this.beliefTraceManager && data.adaptation.justification && data.adaptation.justification.pattern_ids) {
      const patterns = data.adaptation.justification.pattern_ids.map(id => this.learningMemory.getPattern(id)).filter(Boolean);
      
      for (const pattern of patterns) {
        if (pattern.elements && pattern.elements.some(e => e.traceId)) {
          const traceIds = pattern.elements.filter(e => e.traceId).map(e => e.traceId);
          
          for (const traceId of traceIds) {
            const verification = this.beliefTraceManager.verifyTrace(traceId);
            if (!verification || !verification.valid) {
              this.logger.warn(`Adaptation ${data.adaptation.id} failed belief trace verification for trace ${traceId}`);
              return false;
            }
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Handle after adaptation hook
   * 
   * @param {Object} data - Hook data
   * @private
   */
  handleAfterAdaptationHook(data) {
    if (!data || !data.adaptation || !data.result) return;
    
    // Update adaptation with result
    const adaptation = this.learningMemory.getAdaptation(data.adaptation.id);
    if (adaptation) {
      adaptation.result = data.result;
      adaptation.appliedAt = new Date().toISOString();
      this.learningMemory.updateAdaptation(adaptation);
    }
    
    // Create feedback about adaptation
    const feedback = {
      source: {
        type: 'system',
        id: 'adaptation_system'
      },
      context: {
        adaptation_id: data.adaptation.id
      },
      content: {
        result: data.result,
        metrics: data.metrics || {}
      }
    };
    
    this.collectFeedback(feedback, { type: 'adaptation_result' });
  }
  
  /**
   * Verify adaptation compliance with governance requirements
   * 
   * @param {Object} adaptation - Adaptation to verify
   * @returns {Object} Verification result
   * @private
   */
  verifyAdaptationCompliance(adaptation) {
    if (!this.governanceIdentity) {
      return { compliant: true };
    }
    
    // Check adaptation target against governance boundaries
    const targetComponent = adaptation.target.component;
    const restrictedComponents = ['constitution', 'governance', 'memory_integrity', 'belief_trace'];
    
    if (restrictedComponents.includes(targetComponent)) {
      return {
        compliant: false,
        reason: `Adaptation target ${targetComponent} is restricted by governance policy`
      };
    }
    
    // Check adaptation magnitude
    if (adaptation.change.magnitude > 0.5) {
      return {
        compliant: false,
        reason: `Adaptation magnitude ${adaptation.change.magnitude} exceeds governance limit of 0.5`
      };
    }
    
    // Check adaptation justification
    if (!adaptation.justification || !adaptation.justification.pattern_ids || adaptation.justification.pattern_ids.length === 0) {
      return {
        compliant: false,
        reason: 'Adaptation lacks required justification patterns'
      };
    }
    
    // Check confidence threshold
    if (adaptation.justification.confidence < this.config.adaptationThreshold) {
      return {
        compliant: false,
        reason: `Adaptation confidence ${adaptation.justification.confidence} is below threshold ${this.config.adaptationThreshold}`
      };
    }
    
    return { compliant: true };
  }
  
  /**
   * Integrate with PRISM observer
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
    
    // Register for belief trace events
    prismObserver.on('belief_trace_created', (trace) => {
      // Create feedback from belief trace
      const feedback = {
        source: {
          type: 'observer',
          id: 'prism'
        },
        context: {
          trace_id: trace.id
        },
        content: {
          trace: trace,
          metrics: {
            confidence: trace.confidence || 0.5
          }
        }
      };
      
      this.collectFeedback(feedback, { type: 'belief_trace' });
    });
    
    // Register for belief verification events
    prismObserver.on('belief_verified', (verification) => {
      if (verification.adaptations && verification.adaptations.length > 0) {
        // Check if adaptations need to be rolled back
        for (const adaptation of verification.adaptations) {
          if (!verification.valid && adaptation.status === 'applied') {
            this.rollbackAdaptation(adaptation.id);
          }
        }
      }
    });
  }
  
  /**
   * Integrate with VIGIL observer
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
    
    // Register for trust assessment events
    vigilObserver.on('trust_assessment', (assessment) => {
      // Create feedback from trust assessment
      const feedback = {
        source: {
          type: 'observer',
          id: 'vigil'
        },
        context: {
          assessment_id: assessment.id
        },
        content: {
          assessment: assessment,
          metrics: {
            trust_score: assessment.score || 0.5
          }
        }
      };
      
      this.collectFeedback(feedback, { type: 'trust_assessment' });
      
      // Adjust learning parameters based on trust
      if (assessment.score < 0.3) {
        // Low trust - reduce learning rate and adaptation threshold
        this.metaLearningController.adjustLearningParameters({
          learningRate: this.config.learningRate * 0.5,
          adaptationThreshold: Math.min(0.9, this.config.adaptationThreshold * 1.5)
        });
      } else if (assessment.score > 0.8) {
        // High trust - increase learning rate
        this.metaLearningController.adjustLearningParameters({
          learningRate: Math.min(0.2, this.config.learningRate * 1.5),
          adaptationThreshold: Math.max(0.5, this.config.adaptationThreshold * 0.9)
        });
      }
    });
  }
  
  /**
   * Integrate with Tool Selection History module
   * 
   * @param {Object} toolSelectionHistory - Tool Selection History module instance
   */
  integrateWithToolSelectionHistory(toolSelectionHistory) {
    if (!toolSelectionHistory) {
      this.logger.warn('No Tool Selection History module provided, skipping integration');
      return;
    }
    
    this.logger.info('Integrating with Tool Selection History module');
    
    // Store reference to Tool Selection History
    this.toolSelectionHistory = toolSelectionHistory;
    
    // Register for tool usage pattern events
    toolSelectionHistory.on('pattern_discovered', (pattern) => {
      // Create feedback from tool usage pattern
      const feedback = {
        source: {
          type: 'module',
          id: 'tool_selection_history'
        },
        context: {
          pattern_id: pattern.id
        },
        content: {
          pattern: pattern,
          metrics: {
            confidence: pattern.statistics.confidence || 0.5,
            support: pattern.statistics.support || 0.5
          }
        }
      };
      
      this.collectFeedback(feedback, { type: 'tool_usage_pattern' });
    });
    
    // Register for tool efficiency metrics events
    toolSelectionHistory.on('efficiency_metrics_updated', (metrics) => {
      // Create feedback from efficiency metrics
      const feedback = {
        source: {
          type: 'module',
          id: 'tool_selection_history'
        },
        context: {
          tool_id: metrics.toolId
        },
        content: {
          metrics: metrics
        }
      };
      
      this.collectFeedback(feedback, { type: 'tool_efficiency_metrics' });
    });
    
    // Register adaptation handler for tool selection
    this.adaptationEngine.registerAdaptationHandler('tool_selection', (adaptation) => {
      if (adaptation.target.component === 'tool_selection') {
        // Apply adaptation to tool selection preferences
        return toolSelectionHistory.updateToolPreference(
          adaptation.target.parameter,
          adaptation.change.value,
          adaptation.change.magnitude
        );
      }
      return null;
    });
  }
  
  /**
   * Integrate with Confidence Scoring module
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
    
    // Register for confidence score events
    confidenceScoring.on('confidence_calculated', (score) => {
      // Create feedback from confidence score
      const feedback = {
        source: {
          type: 'module',
          id: 'confidence_scoring'
        },
        context: {
          decision_id: score.decisionId
        },
        content: {
          confidence_score: score,
          metrics: {
            value: score.value,
            threshold_status: score.thresholdStatus
          }
        }
      };
      
      this.collectFeedback(feedback, { type: 'confidence_score' });
    });
    
    // Register adaptation handler for confidence calculation
    this.adaptationEngine.registerAdaptationHandler('confidence_calculation', (adaptation) => {
      if (adaptation.target.component === 'confidence_calculation') {
        // Apply adaptation to confidence calculation parameters
        return confidenceScoring.updateCalculationParameters(
          adaptation.target.parameter,
          adaptation.change.value,
          adaptation.change.magnitude
        );
      }
      return null;
    });
  }
  
  /**
   * Integrate with Governance Identity module
   * 
   * @param {Object} governanceIdentity - Governance Identity module instance
   */
  integrateWithGovernanceIdentity(governanceIdentity) {
    if (!governanceIdentity) {
      this.logger.warn('No Governance Identity module provided, skipping integration');
      return;
    }
    
    this.logger.info('Integrating with Governance Identity module');
    
    // Store reference to Governance Identity
    this.governanceIdentity = governanceIdentity;
    
    // Register for governance verification events
    governanceIdentity.on('governance_verified', (verification) => {
      // Create feedback from governance verification
      const feedback = {
        source: {
          type: 'module',
          id: 'governance_identity'
        },
        context: {
          verification_id: verification.verificationId
        },
        content: {
          verification: verification,
          metrics: {
            compatible: verification.compatible ? 1.0 : 0.0
          }
        }
      };
      
      this.collectFeedback(feedback, { type: 'governance_verification' });
    });
    
    // Update governance identity with learning capabilities
    governanceIdentity.updateAgentCapabilities({
      adaptive_learning: true,
      learning_rate: this.config.learningRate,
      adaptation_threshold: this.config.adaptationThreshold,
      learning_boundaries: {
        restricted_components: ['constitution', 'governance', 'memory_integrity', 'belief_trace'],
        max_adaptation_magnitude: 0.5
      }
    });
  }
  
  /**
   * Persist data to storage
   */
  persistData() {
    this.logger.info('Persisting Adaptive Learning Loop data');
    
    // Persist component data
    this.learningMemory.persistData();
    this.patternRecognizer.persistData();
    this.adaptationEngine.persistData();
    this.metaLearningController.persistData();
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
    
    this.logger.info('Adaptive Learning Loop module cleaned up');
  }
}

module.exports = {
  AdaptiveLearningLoop
};
