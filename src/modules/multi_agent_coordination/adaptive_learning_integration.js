/**
 * Integration module for Multi-Agent Coordination Framework with Adaptive Learning Loop
 * 
 * This module connects the Multi-Agent Coordination Framework with the Adaptive Learning Loop,
 * enabling agents to learn from coordination experiences and improve over time.
 * 
 * @module src/modules/multi_agent_coordination/adaptive_learning_integration
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Class that integrates Multi-Agent Coordination with Adaptive Learning
 */
class AdaptiveLearningIntegration {
  /**
   * Create a new AdaptiveLearningIntegration instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.coordinationManager - Coordination Manager instance
   * @param {Object} options.adaptiveLearningLoop - Adaptive Learning Loop instance
   * @param {Object} options.governanceIdentity - Governance Identity instance
   */
  constructor(options) {
    this.logger = options.logger;
    this.coordinationManager = options.coordinationManager;
    this.adaptiveLearningLoop = options.adaptiveLearningLoop;
    this.governanceIdentity = options.governanceIdentity;
    
    this.feedbackCollectors = {};
    this.learningContexts = {};
    
    this.logger.info('AdaptiveLearningIntegration initialized');
  }
  
  /**
   * Initialize learning for a coordination context
   * 
   * @param {string} contextId - Coordination context ID
   * @returns {Object} Learning context information
   */
  initializeLearningContext(contextId) {
    if (!this.coordinationManager.contextExists(contextId)) {
      throw new Error(`Coordination context ${contextId} not found`);
    }
    
    const learningContextId = uuidv4();
    
    // Create learning context
    this.learningContexts[contextId] = {
      id: learningContextId,
      coordinationContextId: contextId,
      initialized: Date.now(),
      metrics: {
        totalFeedback: 0,
        totalAdaptations: 0,
        governanceImprovements: 0
      }
    };
    
    // Initialize feedback collector for this context
    this.feedbackCollectors[contextId] = this.setupFeedbackCollection(contextId);
    
    // Register with adaptive learning loop
    this.adaptiveLearningLoop.registerLearningContext(learningContextId, {
      source: 'multi_agent_coordination',
      contextId: contextId,
      metadataSchema: {
        agentId: 'string',
        hasGovernanceIdentity: 'boolean',
        taskId: 'string',
        interactionType: 'string'
      }
    });
    
    this.logger.info(`Learning context initialized for coordination context ${contextId}`);
    
    return this.learningContexts[contextId];
  }
  
  /**
   * Set up feedback collection for a coordination context
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @returns {Object} Feedback collector
   */
  setupFeedbackCollection(contextId) {
    const learningContextId = this.learningContexts[contextId].id;
    
    // Subscribe to task completion events
    this.coordinationManager.on(`${contextId}:task:completed`, (taskData) => {
      this.collectTaskCompletionFeedback(contextId, taskData);
    });
    
    // Subscribe to agent interaction events
    this.coordinationManager.on(`${contextId}:agent:interaction`, (interactionData) => {
      this.collectAgentInteractionFeedback(contextId, interactionData);
    });
    
    // Subscribe to governance verification events
    this.coordinationManager.on(`${contextId}:governance:verification`, (verificationData) => {
      this.collectGovernanceVerificationFeedback(contextId, verificationData);
    });
    
    return {
      contextId,
      learningContextId,
      active: true
    };
  }
  
  /**
   * Collect feedback from task completion
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @param {Object} taskData - Task completion data
   */
  collectTaskCompletionFeedback(contextId, taskData) {
    const learningContextId = this.learningContexts[contextId].id;
    
    // Extract task performance metrics
    const taskMetrics = {
      taskId: taskData.taskId,
      success: taskData.success,
      completionTime: taskData.completionTime,
      agentResults: {}
    };
    
    // Process agent-specific results
    Object.keys(taskData.agentResults || {}).forEach(agentId => {
      const agentResult = taskData.agentResults[agentId];
      const hasGovernanceIdentity = this.governanceIdentity.agentHasGovernanceIdentity(agentId);
      
      taskMetrics.agentResults[agentId] = {
        ...agentResult,
        hasGovernanceIdentity
      };
    });
    
    // Submit feedback to adaptive learning loop
    this.adaptiveLearningLoop.submitFeedback(learningContextId, {
      type: 'task_completion',
      source: 'coordination_manager',
      timestamp: Date.now(),
      data: taskMetrics,
      metadata: {
        taskId: taskData.taskId,
        requiresGovernance: taskData.requiresGovernance || false
      }
    });
    
    this.learningContexts[contextId].metrics.totalFeedback++;
    this.logger.info(`Task completion feedback collected for task ${taskData.taskId} in context ${contextId}`);
  }
  
  /**
   * Collect feedback from agent interactions
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @param {Object} interactionData - Agent interaction data
   */
  collectAgentInteractionFeedback(contextId, interactionData) {
    const learningContextId = this.learningContexts[contextId].id;
    
    // Extract interaction metrics
    const interactionMetrics = {
      interactionId: interactionData.id,
      interactionType: interactionData.type,
      agents: interactionData.agents.map(agentId => ({
        id: agentId,
        hasGovernanceIdentity: this.governanceIdentity.agentHasGovernanceIdentity(agentId)
      })),
      outcome: interactionData.outcome,
      trustLevel: interactionData.trustLevel
    };
    
    // Submit feedback to adaptive learning loop
    this.adaptiveLearningLoop.submitFeedback(learningContextId, {
      type: 'agent_interaction',
      source: 'coordination_manager',
      timestamp: Date.now(),
      data: interactionMetrics,
      metadata: {
        interactionType: interactionData.type
      }
    });
    
    this.learningContexts[contextId].metrics.totalFeedback++;
    this.logger.info(`Agent interaction feedback collected for interaction ${interactionData.id} in context ${contextId}`);
  }
  
  /**
   * Collect feedback from governance verification
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @param {Object} verificationData - Governance verification data
   */
  collectGovernanceVerificationFeedback(contextId, verificationData) {
    const learningContextId = this.learningContexts[contextId].id;
    
    // Extract verification metrics
    const verificationMetrics = {
      verificationId: verificationData.id,
      agentId: verificationData.agentId,
      hasGovernanceIdentity: verificationData.hasGovernanceIdentity,
      verified: verificationData.verified,
      details: verificationData.details
    };
    
    // Submit feedback to adaptive learning loop
    this.adaptiveLearningLoop.submitFeedback(learningContextId, {
      type: 'governance_verification',
      source: 'governance_exchange_protocol',
      timestamp: Date.now(),
      data: verificationMetrics,
      metadata: {
        agentId: verificationData.agentId,
        hasGovernanceIdentity: verificationData.hasGovernanceIdentity
      }
    });
    
    this.learningContexts[contextId].metrics.totalFeedback++;
    this.logger.info(`Governance verification feedback collected for agent ${verificationData.agentId} in context ${contextId}`);
  }
  
  /**
   * Apply adaptations from learning loop to coordination framework
   * 
   * @param {string} contextId - Coordination context ID
   * @returns {Object} Adaptation results
   */
  applyAdaptations(contextId) {
    if (!this.learningContexts[contextId]) {
      throw new Error(`Learning context for coordination context ${contextId} not found`);
    }
    
    const learningContextId = this.learningContexts[contextId].id;
    
    // Get adaptations from adaptive learning loop
    const adaptations = this.adaptiveLearningLoop.generateAdaptations(learningContextId, {
      targetModule: 'multi_agent_coordination',
      contextId: contextId
    });
    
    if (!adaptations || adaptations.length === 0) {
      this.logger.info(`No adaptations available for context ${contextId}`);
      return { applied: 0, results: [] };
    }
    
    const results = [];
    let appliedCount = 0;
    
    // Apply each adaptation
    adaptations.forEach(adaptation => {
      try {
        const result = this.applyAdaptation(contextId, adaptation);
        results.push({
          adaptationId: adaptation.id,
          success: true,
          result
        });
        appliedCount++;
        
        if (adaptation.type === 'governance_improvement') {
          this.learningContexts[contextId].metrics.governanceImprovements++;
        }
      } catch (error) {
        results.push({
          adaptationId: adaptation.id,
          success: false,
          error: error.message
        });
        this.logger.error(`Failed to apply adaptation ${adaptation.id}: ${error.message}`);
      }
    });
    
    this.learningContexts[contextId].metrics.totalAdaptations += appliedCount;
    this.logger.info(`Applied ${appliedCount} adaptations to context ${contextId}`);
    
    return {
      applied: appliedCount,
      results
    };
  }
  
  /**
   * Apply a specific adaptation to the coordination framework
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @param {Object} adaptation - Adaptation to apply
   * @returns {Object} Adaptation result
   */
  applyAdaptation(contextId, adaptation) {
    switch (adaptation.type) {
      case 'task_allocation_strategy':
        return this.applyTaskAllocationStrategyAdaptation(contextId, adaptation);
        
      case 'trust_threshold_adjustment':
        return this.applyTrustThresholdAdaptation(contextId, adaptation);
        
      case 'role_requirement_adjustment':
        return this.applyRoleRequirementAdaptation(contextId, adaptation);
        
      case 'governance_improvement':
        return this.applyGovernanceImprovementAdaptation(contextId, adaptation);
        
      default:
        throw new Error(`Unknown adaptation type: ${adaptation.type}`);
    }
  }
  
  /**
   * Apply task allocation strategy adaptation
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @param {Object} adaptation - Adaptation to apply
   * @returns {Object} Adaptation result
   */
  applyTaskAllocationStrategyAdaptation(contextId, adaptation) {
    const { taskType, newStrategy, parameters } = adaptation.data;
    
    // Update task allocation strategy for the specified task type
    this.coordinationManager.updateTaskAllocationStrategy(contextId, taskType, newStrategy, parameters);
    
    return {
      taskType,
      strategy: newStrategy,
      parameters
    };
  }
  
  /**
   * Apply trust threshold adaptation
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @param {Object} adaptation - Adaptation to apply
   * @returns {Object} Adaptation result
   */
  applyTrustThresholdAdaptation(contextId, adaptation) {
    const { governanceType, newThreshold } = adaptation.data;
    
    // Update trust threshold for the specified governance type
    this.coordinationManager.updateTrustThreshold(contextId, governanceType, newThreshold);
    
    return {
      governanceType,
      threshold: newThreshold
    };
  }
  
  /**
   * Apply role requirement adaptation
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @param {Object} adaptation - Adaptation to apply
   * @returns {Object} Adaptation result
   */
  applyRoleRequirementAdaptation(contextId, adaptation) {
    const { role, requirementType, newValue } = adaptation.data;
    
    // Update role requirement
    this.coordinationManager.updateRoleRequirement(contextId, role, requirementType, newValue);
    
    return {
      role,
      requirementType,
      value: newValue
    };
  }
  
  /**
   * Apply governance improvement adaptation
   * 
   * @private
   * @param {string} contextId - Coordination context ID
   * @param {Object} adaptation - Adaptation to apply
   * @returns {Object} Adaptation result
   */
  applyGovernanceImprovementAdaptation(contextId, adaptation) {
    const { agentType, improvementType, parameters } = adaptation.data;
    
    // Apply governance improvement
    const result = this.coordinationManager.applyGovernanceImprovement(
      contextId,
      agentType,
      improvementType,
      parameters
    );
    
    return {
      agentType,
      improvementType,
      result
    };
  }
  
  /**
   * Get learning metrics for a coordination context
   * 
   * @param {string} contextId - Coordination context ID
   * @returns {Object} Learning metrics
   */
  getLearningMetrics(contextId) {
    if (!this.learningContexts[contextId]) {
      throw new Error(`Learning context for coordination context ${contextId} not found`);
    }
    
    const learningContextId = this.learningContexts[contextId].id;
    
    // Get metrics from adaptive learning loop
    const loopMetrics = this.adaptiveLearningLoop.getLearningMetrics(learningContextId);
    
    // Combine with local metrics
    return {
      ...this.learningContexts[contextId].metrics,
      patterns: loopMetrics.patterns || [],
      adaptations: loopMetrics.adaptations || [],
      performance: loopMetrics.performance || {}
    };
  }
  
  /**
   * Get governance learning visualization
   * 
   * @param {string} contextId - Coordination context ID
   * @returns {Object} Governance learning visualization
   */
  getGovernanceLearningVisualization(contextId) {
    if (!this.learningContexts[contextId]) {
      throw new Error(`Learning context for coordination context ${contextId} not found`);
    }
    
    const learningContextId = this.learningContexts[contextId].id;
    
    // Get governance contrast visualization from coordination manager
    const governanceContrast = this.coordinationManager.getGovernanceContrastVisualization(contextId);
    
    // Get learning patterns from adaptive learning loop
    const learningPatterns = this.adaptiveLearningLoop.getPatternVisualization(learningContextId, {
      patternType: 'governance_related'
    });
    
    // Combine visualizations
    return {
      governanceContrast,
      learningPatterns,
      metrics: this.getLearningMetrics(contextId),
      timestamp: Date.now()
    };
  }
}

module.exports = AdaptiveLearningIntegration;
