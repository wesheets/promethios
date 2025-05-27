/**
 * Scorecard Manager
 * 
 * Responsible for creating, storing, retrieving, and managing agent scorecards.
 * Ensures scorecards are schema-compliant and properly stored.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class ScorecardManager {
  constructor(config = {}) {
    this.config = {
      storageDir: path.join(process.cwd(), 'data', 'scorecards'),
      schemaPath: path.join(process.cwd(), 'schemas', 'agent_scorecard', 'agent_scorecard.schema.v1.json'),
      historyLimit: 100,
      ...config
    };

    // Ensure storage directory exists
    if (!fs.existsSync(this.config.storageDir)) {
      fs.mkdirSync(this.config.storageDir, { recursive: true });
    }

    // Load schema
    this.schema = JSON.parse(fs.readFileSync(this.config.schemaPath, 'utf8'));
    
    // Initialize validator
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.validate = this.ajv.compile(this.schema);
  }

  /**
   * Create a new scorecard for an agent
   * @param {string} agentId - Unique identifier for the agent
   * @param {Object} governanceIdentity - Governance identity information
   * @param {number|null} trustScore - Calculated trust score
   * @param {Object} prismMetrics - Metrics from PRISM observer
   * @param {Object} vigilMetrics - Metrics from VIGIL observer
   * @param {Object} additionalMetrics - Additional metrics to include
   * @returns {Object} - The created scorecard
   */
  createScorecard(agentId, governanceIdentity, trustScore, prismMetrics, vigilMetrics, additionalMetrics = {}) {
    const timestamp = new Date().toISOString();
    
    // Calculate reflection compliance
    const reflectionCompliance = this._calculateReflectionCompliance(prismMetrics);
    
    // Calculate belief trace integrity
    const beliefTraceIntegrity = this._calculateBeliefTraceIntegrity(prismMetrics);
    
    // Get violation history
    const violationHistory = this._getViolationHistory(agentId, vigilMetrics);
    
    // Get trust lineage
    const trustLineage = this._getTrustLineage(agentId, additionalMetrics);
    
    // Get arbitration history
    const arbitrationHistory = this._getArbitrationHistory(agentId, additionalMetrics);
    
    // Get performance metrics
    const performanceMetrics = this._getPerformanceMetrics(agentId, additionalMetrics);
    
    // Determine warning state
    const warningState = this._determineWarningState(governanceIdentity, trustScore);
    
    // Create scorecard object
    const scorecard = {
      agent_id: agentId,
      scorecard_id: uuidv4(),
      timestamp,
      governance_identity: {
        type: governanceIdentity.type || 'unknown',
        constitution_hash: governanceIdentity.constitution_hash || '0'.repeat(64),
        compliance_level: governanceIdentity.compliance_level || 'unknown',
        verification_endpoint: governanceIdentity.verification_endpoint || `https://verify.promethios.ai/agent/${agentId}`
      },
      trust_score: trustScore,
      reflection_compliance: reflectionCompliance,
      belief_trace_integrity: beliefTraceIntegrity,
      violation_history: violationHistory,
      trust_lineage: trustLineage,
      arbitration_history: arbitrationHistory,
      performance_metrics: performanceMetrics,
      warning_state: warningState,
      // Cryptographic proof will be added by the verifier
      cryptographic_proof: {
        signature: '',
        public_key_id: '',
        merkle_root: '',
        timestamp: timestamp,
        algorithm: this.config.cryptographicAlgorithm || 'ed25519'
      }
    };
    
    // Validate scorecard against schema
    const valid = this.validate(scorecard);
    if (!valid) {
      const errors = this.validate.errors;
      throw new Error(`Invalid scorecard: ${JSON.stringify(errors)}`);
    }
    
    return scorecard;
  }

  /**
   * Store a scorecard
   * @param {Object} scorecard - The scorecard to store
   * @returns {boolean} - Whether the storage was successful
   */
  async storeScorecard(scorecard) {
    const agentDir = path.join(this.config.storageDir, scorecard.agent_id);
    
    // Ensure agent directory exists
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    
    // Store scorecard
    const scorecardPath = path.join(agentDir, `${scorecard.scorecard_id}.json`);
    fs.writeFileSync(scorecardPath, JSON.stringify(scorecard, null, 2));
    
    // Update latest pointer
    const latestPath = path.join(agentDir, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(scorecard, null, 2));
    
    // Update history index
    await this._updateHistoryIndex(scorecard.agent_id, scorecard.scorecard_id);
    
    return true;
  }

  /**
   * Get the latest scorecard for an agent
   * @param {string} agentId - Unique identifier for the agent
   * @returns {Object|null} - The latest scorecard or null if not found
   */
  async getLatestScorecard(agentId) {
    const latestPath = path.join(this.config.storageDir, agentId, 'latest.json');
    
    if (!fs.existsSync(latestPath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  }

  /**
   * Get a specific scorecard by ID
   * @param {string} agentId - Unique identifier for the agent
   * @param {string} scorecardId - Unique identifier for the scorecard
   * @returns {Object|null} - The scorecard or null if not found
   */
  async getScorecard(agentId, scorecardId) {
    const scorecardPath = path.join(this.config.storageDir, agentId, `${scorecardId}.json`);
    
    if (!fs.existsSync(scorecardPath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(scorecardPath, 'utf8'));
  }

  /**
   * Get scorecard history for an agent
   * @param {string} agentId - Unique identifier for the agent
   * @param {number} limit - Maximum number of scorecards to return
   * @returns {Array} - Array of scorecards, newest first
   */
  async getScorecardHistory(agentId, limit = 10) {
    const indexPath = path.join(this.config.storageDir, agentId, 'history_index.json');
    
    if (!fs.existsSync(indexPath)) {
      return [];
    }
    
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const scorecardIds = index.slice(0, limit);
    
    const scorecards = [];
    for (const scorecardId of scorecardIds) {
      const scorecard = await this.getScorecard(agentId, scorecardId);
      if (scorecard) {
        scorecards.push(scorecard);
      }
    }
    
    return scorecards;
  }

  /**
   * Calculate reflection compliance metrics
   * @private
   */
  _calculateReflectionCompliance(prismMetrics) {
    if (!prismMetrics || !prismMetrics.reflection) {
      return {
        percentage: 0,
        total_reflections: 0,
        compliant_reflections: 0
      };
    }
    
    const total = prismMetrics.reflection.total_count || 0;
    const compliant = prismMetrics.reflection.compliant_count || 0;
    const percentage = total > 0 ? (compliant / total) * 100 : 0;
    
    return {
      percentage: Math.round(percentage * 100) / 100,
      total_reflections: total,
      compliant_reflections: compliant
    };
  }

  /**
   * Calculate belief trace integrity metrics
   * @private
   */
  _calculateBeliefTraceIntegrity(prismMetrics) {
    if (!prismMetrics || !prismMetrics.beliefTrace) {
      return {
        percentage: 0,
        total_outputs: 0,
        verified_outputs: 0
      };
    }
    
    const total = prismMetrics.beliefTrace.total_outputs || 0;
    const verified = prismMetrics.beliefTrace.verified_outputs || 0;
    const percentage = total > 0 ? (verified / total) * 100 : 0;
    
    return {
      percentage: Math.round(percentage * 100) / 100,
      total_outputs: total,
      verified_outputs: verified
    };
  }

  /**
   * Get violation history
   * @private
   */
  _getViolationHistory(agentId, vigilMetrics) {
    if (!vigilMetrics || !vigilMetrics.violations) {
      return {
        count: 0,
        categories: {},
        recent_violations: []
      };
    }
    
    const violations = vigilMetrics.violations;
    const categories = {};
    
    // Count violations by category
    for (const violation of violations) {
      const category = violation.type || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    }
    
    // Get recent violations (up to 10)
    const recentViolations = violations
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(v => ({
        timestamp: v.timestamp,
        type: v.type || 'unknown',
        description: v.description || 'No description provided',
        severity: v.severity || 'warning'
      }));
    
    return {
      count: violations.length,
      categories,
      recent_violations: recentViolations
    };
  }

  /**
   * Get trust lineage information
   * @private
   */
  _getTrustLineage(agentId, additionalMetrics) {
    const defaultLineage = {
      delegations: 0,
      inherited_trust: {
        count: 0,
        average_score: null
      },
      delegation_chain: []
    };
    
    if (!additionalMetrics || !additionalMetrics.trustLineage) {
      return defaultLineage;
    }
    
    const lineage = additionalMetrics.trustLineage;
    
    // Calculate average inherited trust score
    let averageScore = null;
    if (lineage.inherited_trust && lineage.inherited_trust.length > 0) {
      const validScores = lineage.inherited_trust
        .filter(t => t.trust_score !== null)
        .map(t => t.trust_score);
      
      if (validScores.length > 0) {
        const sum = validScores.reduce((a, b) => a + b, 0);
        averageScore = Math.round((sum / validScores.length) * 100) / 100;
      }
    }
    
    return {
      delegations: lineage.delegations || 0,
      inherited_trust: {
        count: lineage.inherited_trust ? lineage.inherited_trust.length : 0,
        average_score: averageScore
      },
      delegation_chain: lineage.delegation_chain || []
    };
  }

  /**
   * Get arbitration history
   * @private
   */
  _getArbitrationHistory(agentId, additionalMetrics) {
    const defaultHistory = {
      count: 0,
      last_arbitration: null,
      arbitration_outcomes: {
        upheld: 0,
        overturned: 0,
        partial: 0,
        inconclusive: 0
      }
    };
    
    if (!additionalMetrics || !additionalMetrics.arbitration) {
      return defaultHistory;
    }
    
    const arbitration = additionalMetrics.arbitration;
    const outcomes = arbitration.outcomes || {};
    
    // Get last arbitration
    let lastArbitration = null;
    if (arbitration.history && arbitration.history.length > 0) {
      const latest = arbitration.history
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      
      lastArbitration = {
        timestamp: latest.timestamp,
        result: latest.result,
        reason: latest.reason
      };
    }
    
    return {
      count: arbitration.count || 0,
      last_arbitration: lastArbitration,
      arbitration_outcomes: {
        upheld: outcomes.upheld || 0,
        overturned: outcomes.overturned || 0,
        partial: outcomes.partial || 0,
        inconclusive: outcomes.inconclusive || 0
      }
    };
  }

  /**
   * Get performance metrics
   * @private
   */
  _getPerformanceMetrics(agentId, additionalMetrics) {
    const defaultMetrics = {
      task_completion: {
        rate: 0,
        total_tasks: 0,
        completed_tasks: 0
      },
      response_time: {
        average_ms: 0,
        p95_ms: 0,
        p99_ms: 0
      },
      resource_efficiency: {
        energy_score: 0.5,
        memory_efficiency: 0.5,
        compute_efficiency: 0.5
      }
    };
    
    if (!additionalMetrics || !additionalMetrics.performance) {
      return defaultMetrics;
    }
    
    const performance = additionalMetrics.performance;
    
    // Calculate task completion rate
    let completionRate = 0;
    const totalTasks = performance.total_tasks || 0;
    const completedTasks = performance.completed_tasks || 0;
    
    if (totalTasks > 0) {
      completionRate = (completedTasks / totalTasks) * 100;
    }
    
    return {
      task_completion: {
        rate: Math.round(completionRate * 100) / 100,
        total_tasks: totalTasks,
        completed_tasks: completedTasks
      },
      response_time: {
        average_ms: performance.response_time?.average_ms || 0,
        p95_ms: performance.response_time?.p95_ms || 0,
        p99_ms: performance.response_time?.p99_ms || 0
      },
      resource_efficiency: {
        energy_score: performance.resource_efficiency?.energy_score || 0.5,
        memory_efficiency: performance.resource_efficiency?.memory_efficiency || 0.5,
        compute_efficiency: performance.resource_efficiency?.compute_efficiency || 0.5
      }
    };
  }

  /**
   * Determine warning state based on governance and trust score
   * @private
   */
  _determineWarningState(governanceIdentity, trustScore) {
    // Unknown governance always gets a severe warning
    if (governanceIdentity.type === 'unknown') {
      return {
        has_warning: true,
        warning_level: 'severe',
        warning_message: 'This agent does not comply with any known governance schema. Proceed at your own risk.'
      };
    }
    
    // External unverified governance gets a warning
    if (governanceIdentity.type === 'external_unverified') {
      return {
        has_warning: true,
        warning_level: 'warning',
        warning_message: 'This agent uses an unverified external governance framework. Exercise caution.'
      };
    }
    
    // Low trust score gets a caution
    if (trustScore !== null && trustScore < this.config.warningThreshold) {
      return {
        has_warning: true,
        warning_level: 'caution',
        warning_message: `This agent has a low trust score (${trustScore}). Review its metrics before proceeding.`
      };
    }
    
    // No warning needed
    return {
      has_warning: false,
      warning_level: 'none',
      warning_message: ''
    };
  }

  /**
   * Update the history index for an agent
   * @private
   */
  async _updateHistoryIndex(agentId, scorecardId) {
    const indexPath = path.join(this.config.storageDir, agentId, 'history_index.json');
    
    let index = [];
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    
    // Add new scorecard ID to the beginning
    index.unshift(scorecardId);
    
    // Limit the history size
    if (index.length > this.config.historyLimit) {
      index = index.slice(0, this.config.historyLimit);
    }
    
    // Write updated index
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }
}

module.exports = ScorecardManager;
