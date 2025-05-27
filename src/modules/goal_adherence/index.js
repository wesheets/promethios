/**
 * Goal-Adherence Monitor
 * 
 * Monitors how well agents maintain alignment with their original objectives
 * throughout execution in the Promethios governance framework. This module
 * integrates with VIGIL for loop outcome analysis and drift detection.
 * 
 * @module modules/goal_adherence
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../utils/logger');
const { registerWithPhaseChangeTracker } = require('../../tools/phase-change-tracker');

class GoalAdherenceMonitor {
  /**
   * Creates a new GoalAdherenceMonitor instance
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    this.config = config;
    this.logger = createLogger({
      name: 'goal_adherence',
      level: config.log_level || 'info',
      file: config.log_file || 'logs/goal_adherence.json'
    });
    
    // Initialize goal tracking
    this.goals = new Map();
    this.adherenceMetrics = new Map();
    
    // Initialize analytics data collection
    this.analyticsData = {
      driftStats: {
        totalGoals: 0,
        driftDetected: 0,
        significantDrift: 0,
        recoveredFromDrift: 0
      },
      driftPatterns: [],
      adherenceDistribution: {},
      commonDriftTriggers: {}
    };
    
    // Data retention settings
    this.dataRetention = {
      maxGoals: config.maxGoals || 5000,
      maxDriftPatterns: config.maxDriftPatterns || 2000,
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
    
    this.logger.info('Goal Adherence Monitor initialized');
  }
  
  /**
   * Registers the Goal Adherence Monitor with the Phase Change Tracker
   * @private
   */
  _registerWithPhaseChangeTracker() {
    try {
      registerWithPhaseChangeTracker({
        componentType: 'module',
        componentName: 'goal_adherence',
        version: '1.0.0',
        apis: [
          { name: 'registerGoal', version: '1.0.0', description: 'Registers a new goal for monitoring' },
          { name: 'trackProgress', version: '1.0.0', description: 'Tracks progress towards a goal' },
          { name: 'checkAdherence', version: '1.0.0', description: 'Checks adherence to a goal' },
          { name: 'getAdherenceMetrics', version: '1.0.0', description: 'Retrieves adherence metrics for a goal' },
          { name: 'getAnalytics', version: '1.0.0', description: 'Retrieves analytics data' }
        ]
      });
    } catch (error) {
      this.logger.error('Failed to register with Phase Change Tracker', { error: error.message });
    }
  }
  
  /**
   * Registers a new goal for monitoring
   * @param {Object} goal - Goal to register
   * @param {Object} context - Context information
   * @returns {Object} The registered goal
   */
  registerGoal(goal, context = {}) {
    try {
      if (!goal || !goal.id) {
        throw new Error('Invalid goal');
      }
      
      // Check if goal already exists
      if (this.goals.has(goal.id)) {
        this.logger.warn('Goal already registered', { goalId: goal.id });
        return this.goals.get(goal.id);
      }
      
      // Create goal entry
      const goalEntry = {
        id: goal.id,
        description: goal.description,
        criteria: goal.criteria || [],
        constraints: goal.constraints || [],
        priority: goal.priority || 'medium',
        created: new Date().toISOString(),
        context: {
          ...context,
          agent: goal.agent || context.agent,
          session: goal.session || context.session,
          origin: goal.origin || context.origin
        },
        status: 'active',
        progress: 0,
        lastUpdated: new Date().toISOString()
      };
      
      // Store goal
      this.goals.set(goal.id, goalEntry);
      
      // Initialize adherence metrics
      this.adherenceMetrics.set(goal.id, {
        goalId: goal.id,
        adherenceScore: 1.0, // Start with perfect adherence
        driftDetected: false,
        driftHistory: [],
        checkpoints: [],
        lastChecked: new Date().toISOString()
      });
      
      // Update analytics
      this.analyticsData.driftStats.totalGoals++;
      
      this.logger.info('Goal registered', { 
        goalId: goal.id,
        description: goal.description
      });
      
      return goalEntry;
    } catch (error) {
      this.logger.error('Error registering goal', { 
        goalId: goal?.id, 
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Tracks progress towards a goal
   * @param {string} goalId - ID of the goal to track progress for
   * @param {Object} progress - Progress information
   * @returns {Object} Updated goal
   */
  trackProgress(goalId, progress) {
    try {
      const goal = this.goals.get(goalId);
      if (!goal) {
        throw new Error(`Goal not found: ${goalId}`);
      }
      
      if (!progress || typeof progress.value !== 'number') {
        throw new Error('Invalid progress');
      }
      
      // Update goal progress
      goal.progress = Math.min(Math.max(progress.value, 0), 1); // Clamp between 0 and 1
      goal.lastUpdated = new Date().toISOString();
      
      // Add checkpoint if provided
      if (progress.checkpoint) {
        const metrics = this.adherenceMetrics.get(goalId);
        if (metrics) {
          metrics.checkpoints.push({
            timestamp: new Date().toISOString(),
            progress: goal.progress,
            description: progress.checkpoint,
            metadata: progress.metadata || {}
          });
        }
      }
      
      this.logger.info('Goal progress updated', { 
        goalId,
        progress: goal.progress
      });
      
      return goal;
    } catch (error) {
      this.logger.error('Error tracking goal progress', { 
        goalId, 
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Checks adherence to a goal
   * @param {string} goalId - ID of the goal to check adherence for
   * @param {Object} currentState - Current state information
   * @returns {Object} Adherence check results
   */
  checkAdherence(goalId, currentState) {
    try {
      const goal = this.goals.get(goalId);
      if (!goal) {
        throw new Error(`Goal not found: ${goalId}`);
      }
      
      const metrics = this.adherenceMetrics.get(goalId);
      if (!metrics) {
        throw new Error(`Metrics not found for goal: ${goalId}`);
      }
      
      // Calculate adherence score
      const adherenceResults = this._calculateAdherence(goal, currentState);
      const previousScore = metrics.adherenceScore;
      
      // Update metrics
      metrics.adherenceScore = adherenceResults.score;
      metrics.lastChecked = new Date().toISOString();
      
      // Check for drift
      const driftThreshold = this.config.driftThreshold || 0.2;
      const significantDriftThreshold = this.config.significantDriftThreshold || 0.4;
      const scoreDelta = previousScore - adherenceResults.score;
      
      let driftDetected = false;
      let significantDrift = false;
      
      if (scoreDelta > driftThreshold) {
        driftDetected = true;
        
        if (scoreDelta > significantDriftThreshold) {
          significantDrift = true;
        }
        
        // Record drift event
        const driftEvent = {
          timestamp: new Date().toISOString(),
          previousScore: previousScore,
          currentScore: adherenceResults.score,
          delta: scoreDelta,
          significant: significantDrift,
          factors: adherenceResults.factors,
          state: currentState
        };
        
        metrics.driftHistory.push(driftEvent);
        metrics.driftDetected = true;
        
        // Update analytics
        this.analyticsData.driftStats.driftDetected++;
        if (significantDrift) {
          this.analyticsData.driftStats.significantDrift++;
        }
        
        // Track drift pattern if significant
        if (significantDrift) {
          this._trackDriftPattern(goal, driftEvent, currentState);
        }
        
        // Track drift triggers
        this._updateDriftTriggers(adherenceResults.factors);
      } else if (metrics.driftDetected && adherenceResults.score > previousScore) {
        // Check if recovered from drift
        if (adherenceResults.score >= 0.8) {
          metrics.driftDetected = false;
          
          // Update analytics
          this.analyticsData.driftStats.recoveredFromDrift++;
        }
      }
      
      // Update adherence distribution
      this._updateAdherenceDistribution(adherenceResults.score);
      
      this.logger.info('Goal adherence checked', { 
        goalId,
        adherenceScore: adherenceResults.score,
        driftDetected,
        significantDrift
      });
      
      return {
        goalId,
        adherenceScore: adherenceResults.score,
        previousScore,
        delta: previousScore - adherenceResults.score,
        driftDetected,
        significantDrift,
        factors: adherenceResults.factors,
        timestamp: metrics.lastChecked
      };
    } catch (error) {
      this.logger.error('Error checking goal adherence', { 
        goalId, 
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Calculates adherence to a goal
   * @param {Object} goal - Goal to calculate adherence for
   * @param {Object} currentState - Current state information
   * @returns {Object} Adherence calculation results
   * @private
   */
  _calculateAdherence(goal, currentState) {
    const results = {
      score: 1.0, // Start with perfect adherence
      factors: []
    };
    
    try {
      // Check criteria adherence
      if (goal.criteria && goal.criteria.length > 0) {
        let criteriaScore = 0;
        
        for (const criterion of goal.criteria) {
          const satisfied = this._evaluateCriterion(criterion, currentState);
          if (satisfied) {
            criteriaScore += 1;
          } else {
            results.factors.push({
              type: 'criterion_violation',
              criterion: criterion.description || criterion.id,
              impact: criterion.weight || 0.2
            });
          }
        }
        
        const criteriaAdherence = goal.criteria.length > 0 ? 
          criteriaScore / goal.criteria.length : 1.0;
        
        // Criteria account for 60% of the score
        results.score -= (1 - criteriaAdherence) * 0.6;
      }
      
      // Check constraint adherence
      if (goal.constraints && goal.constraints.length > 0) {
        let constraintViolations = 0;
        
        for (const constraint of goal.constraints) {
          const satisfied = this._evaluateConstraint(constraint, currentState);
          if (!satisfied) {
            constraintViolations += 1;
            
            results.factors.push({
              type: 'constraint_violation',
              constraint: constraint.description || constraint.id,
              impact: constraint.severity === 'high' ? 0.3 : 
                     constraint.severity === 'medium' ? 0.2 : 0.1
            });
          }
        }
        
        const constraintImpact = Math.min(constraintViolations * 0.2, 0.4);
        
        // Constraints can reduce score by up to 40%
        results.score -= constraintImpact;
      }
      
      // Ensure score is between 0 and 1
      results.score = Math.min(Math.max(results.score, 0), 1);
      
      return results;
    } catch (error) {
      this.logger.error('Error calculating adherence', { 
        goalId: goal.id, 
        error: error.message
      });
      
      // Return conservative score on error
      return {
        score: 0.5,
        factors: [{
          type: 'calculation_error',
          description: error.message,
          impact: 0.5
        }]
      };
    }
  }
  
  /**
   * Evaluates a criterion
   * @param {Object} criterion - Criterion to evaluate
   * @param {Object} state - Current state
   * @returns {boolean} Whether the criterion is satisfied
   * @private
   */
  _evaluateCriterion(criterion, state) {
    // In a real implementation, this would evaluate the criterion against the state
    // For now, we'll use a simple random evaluation for demonstration
    return Math.random() > 0.2; // 80% chance of satisfaction
  }
  
  /**
   * Evaluates a constraint
   * @param {Object} constraint - Constraint to evaluate
   * @param {Object} state - Current state
   * @returns {boolean} Whether the constraint is satisfied
   * @private
   */
  _evaluateConstraint(constraint, state) {
    // In a real implementation, this would evaluate the constraint against the state
    // For now, we'll use a simple random evaluation for demonstration
    return Math.random() > 0.1; // 90% chance of satisfaction
  }
  
  /**
   * Retrieves adherence metrics for a goal
   * @param {string} goalId - ID of the goal to retrieve metrics for
   * @returns {Object} Adherence metrics
   */
  getAdherenceMetrics(goalId) {
    const metrics = this.adherenceMetrics.get(goalId);
    if (!metrics) {
      this.logger.warn('Metrics not found for goal', { goalId });
      return null;
    }
    
    return metrics;
  }
  
  /**
   * Retrieves analytics data
   * @param {Object} options - Options for filtering analytics data
   * @returns {Object} Analytics data
   */
  getAnalytics(options = {}) {
    // Clone analytics data to avoid modification
    const analytics = JSON.parse(JSON.stringify(this.analyticsData));
    
    // Filter drift patterns if requested
    if (options.patternLimit && options.patternLimit < analytics.driftPatterns.length) {
      analytics.driftPatterns = analytics.driftPatterns.slice(0, options.patternLimit);
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
      const filename = `goal_adherence_analytics_${timestamp}.json`;
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
   * Updates adherence distribution statistics
   * @param {number} adherenceScore - Adherence score
   * @private
   */
  _updateAdherenceDistribution(adherenceScore) {
    // Round adherence score to nearest 0.1
    const roundedScore = Math.round(adherenceScore * 10) / 10;
    const key = roundedScore.toFixed(1);
    
    if (!this.analyticsData.adherenceDistribution[key]) {
      this.analyticsData.adherenceDistribution[key] = 0;
    }
    
    this.analyticsData.adherenceDistribution[key]++;
  }
  
  /**
   * Updates drift trigger statistics
   * @param {Array} factors - Factors contributing to drift
   * @private
   */
  _updateDriftTriggers(factors) {
    for (const factor of factors) {
      const triggerType = factor.type;
      
      if (!this.analyticsData.commonDriftTriggers[triggerType]) {
        this.analyticsData.commonDriftTriggers[triggerType] = {
          count: 0,
          examples: []
        };
      }
      
      this.analyticsData.commonDriftTriggers[triggerType].count++;
      
      // Store example if we don't have too many
      if (this.analyticsData.commonDriftTriggers[triggerType].examples.length < 5) {
        this.analyticsData.commonDriftTriggers[triggerType].examples.push({
          description: factor.criterion || factor.constraint || factor.description,
          impact: factor.impact
        });
      }
    }
  }
  
  /**
   * Tracks drift patterns for analytics
   * @param {Object} goal - Goal experiencing drift
   * @param {Object} driftEvent - Drift event details
   * @param {Object} state - Current state when drift occurred
   * @private
   */
  _trackDriftPattern(goal, driftEvent, state) {
    // Create pattern data entry
    const patternEntry = {
      timestamp: driftEvent.timestamp,
      goalId: goal.id,
      goalType: goal.context.type || 'unknown',
      adherenceBefore: driftEvent.previousScore,
      adherenceAfter: driftEvent.currentScore,
      delta: driftEvent.delta,
      significant: driftEvent.significant,
      factors: driftEvent.factors,
      context: {
        agent: goal.context.agent,
        session: goal.context.session,
        progress: goal.progress
      }
    };
    
    // Add to pattern data
    this.analyticsData.driftPatterns.push(patternEntry);
    
    // Trim pattern data if needed
    if (this.analyticsData.driftPatterns.length > this.dataRetention.maxDriftPatterns) {
      this.analyticsData.driftPatterns = this.analyticsData.driftPatterns.slice(
        this.analyticsData.driftPatterns.length - this.dataRetention.maxDriftPatterns
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
    
    this.logger.info('Goal Adherence Monitor destroyed');
  }
}

module.exports = {
  GoalAdherenceMonitor
};
