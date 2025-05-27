/**
 * Agent Scorecard Module
 * 
 * This module implements the Agent Scorecard system for Promethios,
 * providing cryptographically verifiable trust metrics for agents.
 * 
 * The scorecard is schema-bound, immutable, and based on objective
 * runtime metrics rather than subjective ratings.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ScorecardManager = require('./scorecard_manager');
const TrustLineageTracker = require('./trust_lineage_tracker');
const CryptographicVerifier = require('./cryptographic_verifier');
const ScorecardAnalytics = require('./scorecard_analytics');
const ScorecardAPI = require('./scorecard_api');

// Import constitutional observers
const { PRISM } = require('../../observers/prism');
const { VIGIL } = require('../../observers/vigil');

// Import governance identity
const { GovernanceIdentity } = require('../governance_identity');

class AgentScorecard {
  constructor(config = {}) {
    this.config = {
      storageDir: path.join(process.cwd(), 'data', 'scorecards'),
      merkleVerification: true,
      cryptographicAlgorithm: 'ed25519',
      warningThreshold: 0.6,
      ...config
    };

    // Ensure storage directory exists
    if (!fs.existsSync(this.config.storageDir)) {
      fs.mkdirSync(this.config.storageDir, { recursive: true });
    }

    // Initialize components
    this.scorecardManager = new ScorecardManager(this.config);
    this.trustLineageTracker = new TrustLineageTracker(this.config);
    this.cryptographicVerifier = new CryptographicVerifier(this.config);
    this.scorecardAnalytics = new ScorecardAnalytics(this.config);
    this.scorecardAPI = new ScorecardAPI(this, this.config);

    // Connect to observers
    this.prism = PRISM.getInstance();
    this.vigil = VIGIL.getInstance();
    this.governanceIdentity = GovernanceIdentity.getInstance();

    // Register with constitutional hooks
    this._registerHooks();
  }

  /**
   * Generate a new scorecard for an agent
   * @param {string} agentId - Unique identifier for the agent
   * @param {Object} metrics - Runtime metrics for scorecard generation
   * @returns {Object} - The generated scorecard
   */
  async generateScorecard(agentId, metrics = {}) {
    // Get governance identity
    const governanceIdentity = await this.governanceIdentity.getIdentity(agentId);
    
    // Get metrics from PRISM and VIGIL if not provided
    const prismMetrics = metrics.prism || await this.prism.getAgentMetrics(agentId);
    const vigilMetrics = metrics.vigil || await this.vigil.getAgentMetrics(agentId);
    
    // Calculate trust score
    const trustScore = this._calculateTrustScore(governanceIdentity, prismMetrics, vigilMetrics);
    
    // Generate scorecard
    const scorecard = this.scorecardManager.createScorecard(
      agentId,
      governanceIdentity,
      trustScore,
      prismMetrics,
      vigilMetrics,
      metrics
    );
    
    // Sign scorecard
    const signedScorecard = await this.cryptographicVerifier.signScorecard(scorecard);
    
    // Store scorecard
    await this.scorecardManager.storeScorecard(signedScorecard);
    
    // Update trust lineage
    await this.trustLineageTracker.updateLineage(agentId, signedScorecard);
    
    return signedScorecard;
  }

  /**
   * Get the latest scorecard for an agent
   * @param {string} agentId - Unique identifier for the agent
   * @returns {Object} - The latest scorecard for the agent
   */
  async getScorecard(agentId) {
    return this.scorecardManager.getLatestScorecard(agentId);
  }

  /**
   * Verify a scorecard's cryptographic integrity
   * @param {Object} scorecard - The scorecard to verify
   * @returns {boolean} - Whether the scorecard is valid
   */
  async verifyScorecard(scorecard) {
    return this.cryptographicVerifier.verifyScorecard(scorecard);
  }

  /**
   * Record a trust delegation between agents
   * @param {string} sourceAgentId - Agent delegating trust
   * @param {string} targetAgentId - Agent receiving trust
   * @param {Object} context - Context of the delegation
   * @returns {Object} - The created trust lineage record
   */
  async recordTrustDelegation(sourceAgentId, targetAgentId, context = {}) {
    // Get scorecards for both agents
    const sourceScorecard = await this.getScorecard(sourceAgentId);
    const targetScorecard = await this.getScorecard(targetAgentId);
    
    // Verify minimum trust requirements
    if (!this._verifyDelegationRequirements(sourceScorecard, targetScorecard)) {
      throw new Error('Trust delegation requirements not met');
    }
    
    // Create and store lineage record
    const lineageRecord = await this.trustLineageTracker.createLineageRecord(
      sourceAgentId,
      targetAgentId,
      sourceScorecard,
      targetScorecard,
      context
    );
    
    return lineageRecord;
  }

  /**
   * Get trust lineage for an agent
   * @param {string} agentId - Unique identifier for the agent
   * @returns {Array} - Trust lineage records for the agent
   */
  async getTrustLineage(agentId) {
    return this.trustLineageTracker.getLineageForAgent(agentId);
  }

  /**
   * Calculate trust score based on governance identity and metrics
   * @private
   */
  _calculateTrustScore(governanceIdentity, prismMetrics, vigilMetrics) {
    // Return null for unknown governance
    if (governanceIdentity.type === 'unknown') {
      return null;
    }
    
    // Calculate components of trust score
    const governanceScore = this._calculateGovernanceScore(governanceIdentity);
    const reflectionScore = this._calculateReflectionScore(prismMetrics);
    const beliefTraceScore = this._calculateBeliefTraceScore(prismMetrics);
    const trustDecayScore = this._calculateTrustDecayScore(vigilMetrics);
    
    // Weighted average of components
    const weights = {
      governance: 0.3,
      reflection: 0.25,
      beliefTrace: 0.25,
      trustDecay: 0.2
    };
    
    const weightedScore = 
      (governanceScore * weights.governance) +
      (reflectionScore * weights.reflection) +
      (beliefTraceScore * weights.beliefTrace) +
      (trustDecayScore * weights.trustDecay);
    
    // Round to 2 decimal places
    return Math.round(weightedScore * 100) / 100;
  }

  /**
   * Calculate governance score component
   * @private
   */
  _calculateGovernanceScore(governanceIdentity) {
    const complianceScores = {
      'full': 1.0,
      'partial': 0.7,
      'minimal': 0.4,
      'unknown': 0.0
    };
    
    const typeScores = {
      'promethios': 1.0,
      'external_verified': 0.8,
      'external_unverified': 0.5,
      'unknown': 0.0
    };
    
    return (complianceScores[governanceIdentity.compliance_level] * 0.6) + 
           (typeScores[governanceIdentity.type] * 0.4);
  }

  /**
   * Calculate reflection score component
   * @private
   */
  _calculateReflectionScore(prismMetrics) {
    if (!prismMetrics || !prismMetrics.reflection) {
      return 0;
    }
    
    return prismMetrics.reflection.compliance_percentage / 100;
  }

  /**
   * Calculate belief trace score component
   * @private
   */
  _calculateBeliefTraceScore(prismMetrics) {
    if (!prismMetrics || !prismMetrics.beliefTrace) {
      return 0;
    }
    
    return prismMetrics.beliefTrace.integrity_percentage / 100;
  }

  /**
   * Calculate trust decay score component
   * @private
   */
  _calculateTrustDecayScore(vigilMetrics) {
    if (!vigilMetrics || !vigilMetrics.trustDecay) {
      return 0;
    }
    
    return 1 - (vigilMetrics.trustDecay.decay_percentage / 100);
  }

  /**
   * Verify delegation requirements are met
   * @private
   */
  _verifyDelegationRequirements(sourceScorecard, targetScorecard) {
    // Cannot delegate from null trust score
    if (sourceScorecard.trust_score === null) {
      return false;
    }
    
    // Minimum source trust score requirement
    if (sourceScorecard.trust_score < this.config.warningThreshold) {
      return false;
    }
    
    // Unknown governance agents cannot receive delegation
    if (targetScorecard.governance_identity.type === 'unknown') {
      return false;
    }
    
    return true;
  }

  /**
   * Register with constitutional hooks
   * @private
   */
  _registerHooks() {
    // Register hooks for scorecard generation events
    const constitutionalHooks = require('../../hooks/constitutional_hooks');
    
    constitutionalHooks.register('agent:created', async (agent) => {
      await this.generateScorecard(agent.id);
    });
    
    constitutionalHooks.register('agent:task_completed', async (agent, task) => {
      await this.generateScorecard(agent.id);
    });
    
    constitutionalHooks.register('governance:violation', async (agent, violation) => {
      await this.generateScorecard(agent.id);
    });
    
    constitutionalHooks.register('trust:delegation', async (source, target, context) => {
      await this.recordTrustDelegation(source.id, target.id, context);
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(config) {
    if (!AgentScorecard.instance) {
      AgentScorecard.instance = new AgentScorecard(config);
    }
    return AgentScorecard.instance;
  }
}

module.exports = {
  AgentScorecard
};
