/**
 * Agent-Specific Observer Service
 * 
 * This service creates and manages Observer instances that are tied to specific agents.
 * Each wrapped agent gets its own Observer that watches its behavior, analyzes patterns,
 * and provides contextual insights about governance decisions and trust score changes.
 */

const { v4: uuidv4 } = require('uuid');

class AgentObserverService {
  constructor() {
    this.agentObservers = new Map(); // Map of agentId -> Observer instance
    this.observerHistory = new Map(); // Map of agentId -> interaction history
  }

  /**
   * Create or get an Observer instance for a specific agent
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} agentConfig - Agent configuration
   * @returns {Object} Agent-specific Observer instance
   */
  getAgentObserver(agentId, agentConfig = {}) {
    if (!this.agentObservers.has(agentId)) {
      const observer = this._createAgentObserver(agentId, agentConfig);
      this.agentObservers.set(agentId, observer);
      this.observerHistory.set(agentId, []);
      
      console.log(`👁️ Created Observer instance for agent: ${agentId}`);
    }
    
    return this.agentObservers.get(agentId);
  }

  /**
   * Record an interaction for agent-specific analysis
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} interactionData - Data from the interaction
   * @returns {Object} Observer commentary and insights
   */
  async recordInteraction(agentId, interactionData) {
    const observer = this.getAgentObserver(agentId);
    const history = this.observerHistory.get(agentId) || [];
    
    // Add interaction to history
    const interaction = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...interactionData
    };
    
    history.push(interaction);
    
    // Keep only last 100 interactions
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.observerHistory.set(agentId, history);
    
    // Generate Observer commentary
    const commentary = await this._generateObserverCommentary(agentId, interaction, history);
    
    // Update Observer state
    observer.lastInteraction = interaction;
    observer.totalInteractions = history.length;
    observer.lastCommentary = commentary;
    
    return commentary;
  }

  /**
   * Get Observer insights for a specific agent
   * 
   * @param {string} agentId - Agent identifier
   * @returns {Object} Observer insights and analysis
   */
  getAgentInsights(agentId) {
    const observer = this.agentObservers.get(agentId);
    const history = this.observerHistory.get(agentId) || [];
    
    if (!observer) {
      return null;
    }
    
    return {
      agentId,
      observerStatus: observer.status,
      totalInteractions: history.length,
      behaviorPatterns: this._analyzeBehaviorPatterns(history),
      trustTrends: this._analyzeTrustTrends(history),
      violationPatterns: this._analyzeViolationPatterns(history),
      governanceEffectiveness: this._analyzeGovernanceEffectiveness(history),
      recommendations: this._generateRecommendations(agentId, history)
    };
  }

  /**
   * Create a new Observer instance for an agent
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} agentConfig - Agent configuration
   * @returns {Object} Observer instance
   */
  _createAgentObserver(agentId, agentConfig) {
    return {
      id: uuidv4(),
      agentId,
      agentName: agentConfig.agentName || `Agent-${agentId}`,
      agentType: agentConfig.agentType || 'unknown',
      createdAt: new Date().toISOString(),
      status: 'active',
      watchingGovernance: true,
      watchingBehavior: true,
      watchingTrust: true,
      totalInteractions: 0,
      lastInteraction: null,
      lastCommentary: null,
      behaviorProfile: {
        responsePatterns: [],
        violationTendencies: [],
        trustScoreHistory: [],
        governanceCompliance: 'unknown'
      }
    };
  }

  /**
   * Generate Observer commentary for an interaction
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} interaction - Current interaction
   * @param {Array} history - Interaction history
   * @returns {Object} Observer commentary
   */
  async _generateObserverCommentary(agentId, interaction, history) {
    const observer = this.agentObservers.get(agentId);
    const commentary = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      agentId,
      type: 'interaction_analysis',
      insights: [],
      alerts: [],
      recommendations: []
    };

    // Analyze current interaction
    if (interaction.violations && interaction.violations.length > 0) {
      const violationInsight = this._analyzeViolations(interaction.violations, history);
      commentary.insights.push(violationInsight);
      
      if (violationInsight.severity === 'high') {
        commentary.alerts.push({
          type: 'high_severity_violation',
          message: `🚨 High severity violation detected: ${violationInsight.description}`,
          action: 'immediate_review'
        });
      }
    }

    // Analyze trust score changes
    if (interaction.trustScore !== undefined) {
      const trustInsight = this._analyzeTrustScore(interaction.trustScore, history);
      commentary.insights.push(trustInsight);
      
      if (trustInsight.trend === 'declining') {
        commentary.alerts.push({
          type: 'trust_decline',
          message: `📉 Trust score declining: ${trustInsight.description}`,
          action: 'governance_review'
        });
      }
    }

    // Analyze governance effectiveness
    if (interaction.governanceApplied) {
      const governanceInsight = this._analyzeGovernanceImpact(interaction, history);
      commentary.insights.push(governanceInsight);
    }

    // Analyze behavior patterns
    if (history.length >= 5) {
      const behaviorInsight = this._analyzeBehaviorChanges(history);
      if (behaviorInsight.significant) {
        commentary.insights.push(behaviorInsight);
      }
    }

    // Generate recommendations
    commentary.recommendations = this._generateInteractionRecommendations(interaction, history);

    return commentary;
  }

  /**
   * Analyze violations in the context of agent history
   * 
   * @param {Array} violations - Current violations
   * @param {Array} history - Interaction history
   * @returns {Object} Violation analysis
   */
  _analyzeViolations(violations, history) {
    const recentViolations = history
      .slice(-10)
      .filter(h => h.violations && h.violations.length > 0)
      .flatMap(h => h.violations);

    const violationTypes = violations.map(v => v.type);
    const repeatedViolations = violationTypes.filter(type => 
      recentViolations.some(rv => rv.type === type)
    );

    return {
      type: 'violation_analysis',
      severity: violations.some(v => v.severity === 'high') ? 'high' : 'medium',
      description: `Detected ${violations.length} violation(s): ${violationTypes.join(', ')}`,
      pattern: repeatedViolations.length > 0 ? 
        `Repeated pattern: ${repeatedViolations.join(', ')}` : 
        'New violation type',
      recommendation: repeatedViolations.length > 0 ? 
        'Consider adjusting governance level or agent configuration' : 
        'Monitor for pattern development'
    };
  }

  /**
   * Analyze trust score in the context of agent history
   * 
   * @param {number} currentScore - Current trust score
   * @param {Array} history - Interaction history
   * @returns {Object} Trust score analysis
   */
  _analyzeTrustScore(currentScore, history) {
    const recentScores = history
      .slice(-10)
      .filter(h => h.trustScore !== undefined)
      .map(h => h.trustScore);

    if (recentScores.length === 0) {
      return {
        type: 'trust_analysis',
        trend: 'initial',
        description: `Initial trust score: ${currentScore}`,
        recommendation: 'Establish baseline through continued interactions'
      };
    }

    const averageRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const trend = currentScore > averageRecent + 5 ? 'improving' : 
                  currentScore < averageRecent - 5 ? 'declining' : 'stable';

    return {
      type: 'trust_analysis',
      trend,
      description: `Trust score ${trend}: ${currentScore} (avg: ${Math.round(averageRecent)})`,
      recommendation: trend === 'declining' ? 
        'Review recent interactions for governance improvements' : 
        'Continue current governance approach'
    };
  }

  /**
   * Analyze governance impact on agent behavior
   * 
   * @param {Object} interaction - Current interaction
   * @param {Array} history - Interaction history
   * @returns {Object} Governance impact analysis
   */
  _analyzeGovernanceImpact(interaction, history) {
    const governedInteractions = history.filter(h => h.governanceApplied);
    const ungovernedInteractions = history.filter(h => !h.governanceApplied);

    const governedViolations = governedInteractions
      .flatMap(h => h.violations || []).length;
    const ungovernedViolations = ungovernedInteractions
      .flatMap(h => h.violations || []).length;

    const governanceEffectiveness = governedInteractions.length > 0 ? 
      (1 - (governedViolations / governedInteractions.length)) * 100 : 0;

    return {
      type: 'governance_impact',
      effectiveness: Math.round(governanceEffectiveness),
      description: `Governance reducing violations by ${Math.round(
        ((ungovernedViolations / Math.max(ungovernedInteractions.length, 1)) - 
         (governedViolations / Math.max(governedInteractions.length, 1))) * 100
      )}%`,
      recommendation: governanceEffectiveness > 80 ? 
        'Governance working effectively' : 
        'Consider adjusting governance level'
    };
  }

  /**
   * Analyze behavior patterns over time
   * 
   * @param {Array} history - Interaction history
   * @returns {Object} Behavior pattern analysis
   */
  _analyzeBehaviorPatterns(history) {
    if (history.length < 5) {
      return { insufficient_data: true };
    }

    const recentHistory = history.slice(-20);
    const violationTypes = recentHistory
      .flatMap(h => h.violations || [])
      .map(v => v.type);

    const violationCounts = violationTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mostCommonViolation = Object.entries(violationCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalInteractions: history.length,
      recentViolations: violationTypes.length,
      mostCommonViolation: mostCommonViolation ? {
        type: mostCommonViolation[0],
        count: mostCommonViolation[1]
      } : null,
      violationRate: (violationTypes.length / recentHistory.length) * 100
    };
  }

  /**
   * Analyze trust score trends
   * 
   * @param {Array} history - Interaction history
   * @returns {Object} Trust trend analysis
   */
  _analyzeTrustTrends(history) {
    const trustScores = history
      .filter(h => h.trustScore !== undefined)
      .map(h => ({ score: h.trustScore, timestamp: h.timestamp }));

    if (trustScores.length < 3) {
      return { insufficient_data: true };
    }

    const recent = trustScores.slice(-10);
    const older = trustScores.slice(-20, -10);

    const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
    const olderAvg = older.length > 0 ? 
      older.reduce((sum, s) => sum + s.score, 0) / older.length : recentAvg;

    return {
      currentAverage: Math.round(recentAvg),
      previousAverage: Math.round(olderAvg),
      trend: recentAvg > olderAvg + 2 ? 'improving' : 
             recentAvg < olderAvg - 2 ? 'declining' : 'stable',
      volatility: this._calculateVolatility(recent.map(s => s.score))
    };
  }

  /**
   * Analyze violation patterns
   * 
   * @param {Array} history - Interaction history
   * @returns {Object} Violation pattern analysis
   */
  _analyzeViolationPatterns(history) {
    const violations = history
      .flatMap(h => h.violations || [])
      .map(v => ({ ...v, timestamp: h.timestamp }));

    const violationsByType = violations.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {});

    const violationsBySeverity = violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      totalViolations: violations.length,
      byType: violationsByType,
      bySeverity: violationsBySeverity,
      mostCommon: Object.entries(violationsByType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
    };
  }

  /**
   * Analyze governance effectiveness
   * 
   * @param {Array} history - Interaction history
   * @returns {Object} Governance effectiveness analysis
   */
  _analyzeGovernanceEffectiveness(history) {
    const governed = history.filter(h => h.governanceApplied);
    const ungoverned = history.filter(h => !h.governanceApplied);

    if (governed.length === 0 && ungoverned.length === 0) {
      return { insufficient_data: true };
    }

    const governedViolationRate = governed.length > 0 ? 
      governed.flatMap(h => h.violations || []).length / governed.length : 0;
    const ungovernedViolationRate = ungoverned.length > 0 ? 
      ungoverned.flatMap(h => h.violations || []).length / ungoverned.length : 0;

    const effectiveness = ungovernedViolationRate > 0 ? 
      ((ungovernedViolationRate - governedViolationRate) / ungovernedViolationRate) * 100 : 0;

    return {
      governedInteractions: governed.length,
      ungovernedInteractions: ungoverned.length,
      governedViolationRate: Math.round(governedViolationRate * 100),
      ungovernedViolationRate: Math.round(ungovernedViolationRate * 100),
      effectiveness: Math.round(effectiveness),
      recommendation: effectiveness > 50 ? 'Governance is effective' : 'Consider governance adjustments'
    };
  }

  /**
   * Generate recommendations for agent improvement
   * 
   * @param {string} agentId - Agent identifier
   * @param {Array} history - Interaction history
   * @returns {Array} Recommendations
   */
  _generateRecommendations(agentId, history) {
    const recommendations = [];
    const patterns = this._analyzeBehaviorPatterns(history);
    const trends = this._analyzeTrustTrends(history);

    if (patterns.violationRate > 20) {
      recommendations.push({
        type: 'governance_adjustment',
        priority: 'high',
        message: 'Consider increasing governance level due to high violation rate',
        action: 'increase_governance_level'
      });
    }

    if (trends.trend === 'declining') {
      recommendations.push({
        type: 'trust_improvement',
        priority: 'medium',
        message: 'Trust score declining - review recent interactions',
        action: 'review_interactions'
      });
    }

    if (patterns.mostCommonViolation) {
      recommendations.push({
        type: 'pattern_correction',
        priority: 'medium',
        message: `Address recurring ${patterns.mostCommonViolation.type} violations`,
        action: 'targeted_governance'
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations for a specific interaction
   * 
   * @param {Object} interaction - Current interaction
   * @param {Array} history - Interaction history
   * @returns {Array} Interaction-specific recommendations
   */
  _generateInteractionRecommendations(interaction, history) {
    const recommendations = [];

    if (interaction.violations && interaction.violations.length > 0) {
      recommendations.push({
        type: 'immediate',
        message: 'Review governance settings to prevent similar violations',
        action: 'governance_review'
      });
    }

    if (interaction.trustScore < 70) {
      recommendations.push({
        type: 'trust',
        message: 'Low trust score - consider governance intervention',
        action: 'increase_oversight'
      });
    }

    return recommendations;
  }

  /**
   * Calculate volatility of trust scores
   * 
   * @param {Array} scores - Array of trust scores
   * @returns {number} Volatility measure
   */
  _calculateVolatility(scores) {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.round(Math.sqrt(variance));
  }

  /**
   * Analyze behavior changes over time
   * 
   * @param {Array} history - Interaction history
   * @returns {Object} Behavior change analysis
   */
  _analyzeBehaviorChanges(history) {
    const recent = history.slice(-5);
    const previous = history.slice(-10, -5);

    const recentViolations = recent.flatMap(h => h.violations || []).length;
    const previousViolations = previous.flatMap(h => h.violations || []).length;

    const significantChange = Math.abs(recentViolations - previousViolations) >= 2;

    return {
      significant: significantChange,
      type: 'behavior_change',
      description: significantChange ? 
        `Behavior change detected: ${recentViolations} vs ${previousViolations} violations` :
        'Stable behavior pattern',
      recommendation: significantChange ? 'Monitor closely for pattern confirmation' : 'Continue current approach'
    };
  }
}

module.exports = AgentObserverService;

