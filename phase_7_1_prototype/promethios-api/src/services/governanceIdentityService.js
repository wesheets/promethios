/**
 * Governance Identity Service
 * 
 * This service creates and manages governance identities for wrapped agents.
 * Every agent that gets wrapped with Promethios governance receives a unique
 * governance identity and scorecard for transparency and verification.
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class GovernanceIdentityService {
  constructor() {
    this.identities = new Map(); // In production, this would be a database
    this.scorecards = new Map(); // In production, this would be a database
  }

  /**
   * Create a governance identity for a newly wrapped agent
   * 
   * @param {Object} agentConfig - Agent configuration
   * @returns {Object} Governance identity
   */
  async createGovernanceIdentity(agentConfig) {
    const timestamp = Date.now();
    const agentId = agentConfig.agentId;
    
    // Create constitutional framework hash
    const constitutionalHash = this._createConstitutionalHash(agentConfig.governanceLevel);
    
    // Generate governance signature
    const signature = this._generateGovernanceSignature(agentId, constitutionalHash, timestamp);
    
    const governanceIdentity = {
      // Core identity fields
      agentId: agentId,
      name: agentConfig.agentName || `Agent-${agentId}`,
      version: '1.0.0',
      
      // Governance certification
      signedBy: 'Promethios Governance Framework',
      complianceLevel: this._mapGovernanceLevel(agentConfig.governanceLevel),
      certificationDate: timestamp,
      
      // Governance URLs
      scorecardUrl: `/api/governance/scorecard/${agentId}`,
      governanceProfileUrl: `/api/governance/identity/${agentId}`,
      
      // Verification data
      signature: signature,
      publicKey: 'promethios-public-key-v1',
      
      // Extended governance metadata
      governanceFramework: 'Promethios Constitutional Framework',
      constitutionHash: constitutionalHash,
      memoryIntegrity: {
        enabled: true,
        verificationMethod: 'hash-chain'
      },
      trustRequirements: {
        minimumScore: 70,
        violationThreshold: 3
      },
      fallbackStrategy: 'graceful-degradation',
      auditSurface: 'full',
      refusalPolicy: {
        enabled: true,
        escalationPath: 'human-review'
      },
      interoperabilityVersion: '1.0.0'
    };
    
    // Store the identity
    this.identities.set(agentId, governanceIdentity);
    
    // Create initial scorecard
    await this.createInitialScorecard(agentId, governanceIdentity);
    
    return governanceIdentity;
  }

  /**
   * Create initial scorecard for a newly wrapped agent
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} governanceIdentity - Governance identity
   * @returns {Object} Initial scorecard
   */
  async createInitialScorecard(agentId, governanceIdentity) {
    const timestamp = new Date().toISOString();
    
    const scorecard = {
      // Scorecard metadata
      scorecardId: uuidv4(),
      agentId: agentId,
      version: '1.0.0',
      createdAt: timestamp,
      lastUpdated: timestamp,
      
      // Trust metrics
      trustScore: 85, // Starting trust score
      complianceRate: 100, // Starting compliance rate
      errorRate: 0,
      
      // Interaction history
      totalInteractions: 0,
      governedInteractions: 0,
      ungovernedInteractions: 0,
      
      // Violation tracking
      violations: [],
      violationsByType: {},
      totalViolations: 0,
      
      // Performance metrics
      averageResponseTime: 0,
      governanceOverhead: 0,
      
      // Observer metrics
      prismMetrics: {
        monitoringActive: true,
        alertsGenerated: 0,
        complianceChecks: 0
      },
      vigilMetrics: {
        enforcementActive: true,
        interventions: 0,
        escalations: 0
      },
      
      // Governance configuration
      governanceLevel: governanceIdentity.complianceLevel,
      constitutionalFramework: governanceIdentity.governanceFramework,
      certificationDate: governanceIdentity.certificationDate,
      
      // Trust history (for trending)
      trustHistory: [
        {
          timestamp: timestamp,
          score: 85,
          event: 'initial_certification'
        }
      ],
      
      // Recent activity
      recentActivity: [],
      
      // Compliance status
      complianceStatus: {
        overall: 'compliant',
        byArticle: {
          '1.1': 'compliant', // Capability Boundaries
          '2.1': 'compliant', // Truthfulness & Accuracy
          '3.1': 'compliant', // Source Verification
          '4.1': 'compliant', // Harm Avoidance
          '5.1': 'compliant'  // Traceability
        }
      }
    };
    
    // Store the scorecard
    this.scorecards.set(agentId, scorecard);
    
    return scorecard;
  }

  /**
   * Update scorecard with interaction results
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} interactionData - Data from the interaction
   * @returns {Object} Updated scorecard
   */
  async updateScorecard(agentId, interactionData) {
    const scorecard = this.scorecards.get(agentId);
    if (!scorecard) {
      throw new Error(`Scorecard not found for agent: ${agentId}`);
    }
    
    const timestamp = new Date().toISOString();
    
    // Update interaction counts
    scorecard.totalInteractions++;
    if (interactionData.governanceApplied) {
      scorecard.governedInteractions++;
    } else {
      scorecard.ungovernedInteractions++;
    }
    
    // Update trust score
    scorecard.trustScore = interactionData.trustScore;
    
    // Update compliance rate
    scorecard.complianceRate = interactionData.complianceRate || scorecard.complianceRate;
    
    // Add violations if any
    if (interactionData.violations && interactionData.violations.length > 0) {
      scorecard.violations.push(...interactionData.violations.map(v => ({
        ...v,
        timestamp: timestamp,
        interactionId: interactionData.interactionId || uuidv4()
      })));
      
      scorecard.totalViolations += interactionData.violations.length;
      
      // Update violations by type
      interactionData.violations.forEach(violation => {
        scorecard.violationsByType[violation.type] = 
          (scorecard.violationsByType[violation.type] || 0) + 1;
      });
      
      // Update compliance status by article
      interactionData.violations.forEach(violation => {
        if (violation.article && scorecard.complianceStatus.byArticle[violation.article]) {
          scorecard.complianceStatus.byArticle[violation.article] = 'non-compliant';
        }
      });
    }
    
    // Update performance metrics
    if (interactionData.processingTime) {
      const totalTime = scorecard.averageResponseTime * (scorecard.totalInteractions - 1) + interactionData.processingTime;
      scorecard.averageResponseTime = Math.round(totalTime / scorecard.totalInteractions);
    }
    
    // Add to trust history
    scorecard.trustHistory.push({
      timestamp: timestamp,
      score: scorecard.trustScore,
      event: interactionData.violations?.length > 0 ? 'violation_detected' : 'clean_interaction'
    });
    
    // Keep only last 100 trust history entries
    if (scorecard.trustHistory.length > 100) {
      scorecard.trustHistory = scorecard.trustHistory.slice(-100);
    }
    
    // Add to recent activity
    scorecard.recentActivity.unshift({
      timestamp: timestamp,
      type: interactionData.governanceApplied ? 'governed_interaction' : 'ungoverned_interaction',
      trustScore: scorecard.trustScore,
      violations: interactionData.violations?.length || 0
    });
    
    // Keep only last 20 recent activities
    if (scorecard.recentActivity.length > 20) {
      scorecard.recentActivity = scorecard.recentActivity.slice(0, 20);
    }
    
    // Update observer metrics
    if (interactionData.governanceApplied) {
      scorecard.prismMetrics.complianceChecks++;
      scorecard.vigilMetrics.enforcementActive = true;
      
      if (interactionData.interventions?.length > 0) {
        scorecard.vigilMetrics.interventions += interactionData.interventions.length;
      }
    }
    
    // Update timestamps
    scorecard.lastUpdated = timestamp;
    
    // Store updated scorecard
    this.scorecards.set(agentId, scorecard);
    
    return scorecard;
  }

  /**
   * Get governance identity for an agent
   * 
   * @param {string} agentId - Agent identifier
   * @returns {Object} Governance identity
   */
  getGovernanceIdentity(agentId) {
    return this.identities.get(agentId);
  }

  /**
   * Get scorecard for an agent
   * 
   * @param {string} agentId - Agent identifier
   * @returns {Object} Agent scorecard
   */
  getScorecard(agentId) {
    return this.scorecards.get(agentId);
  }

  /**
   * Validate governance identity signature
   * 
   * @param {Object} identity - Governance identity to validate
   * @returns {boolean} Whether signature is valid
   */
  validateGovernanceIdentity(identity) {
    return !!(
      identity.agentId &&
      identity.signedBy &&
      identity.complianceLevel &&
      identity.certificationDate &&
      identity.signature
    );
  }

  /**
   * Create constitutional framework hash
   * 
   * @param {string} governanceLevel - Governance level
   * @returns {string} Constitutional hash
   */
  _createConstitutionalHash(governanceLevel) {
    const constitutionalData = {
      level: governanceLevel,
      articles: [
        'Capability Boundaries',
        'Truthfulness & Accuracy',
        'Source Verification',
        'Harm Avoidance',
        'Traceability'
      ],
      version: '1.0.0'
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(constitutionalData))
      .digest('hex');
  }

  /**
   * Generate governance signature
   * 
   * @param {string} agentId - Agent identifier
   * @param {string} constitutionalHash - Constitutional framework hash
   * @param {number} timestamp - Certification timestamp
   * @returns {string} Governance signature
   */
  _generateGovernanceSignature(agentId, constitutionalHash, timestamp) {
    const signatureData = {
      agentId,
      constitutionalHash,
      timestamp,
      issuer: 'Promethios'
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(signatureData))
      .digest('hex');
  }

  /**
   * Map governance level to compliance level
   * 
   * @param {string} governanceLevel - Governance level
   * @returns {string} Compliance level
   */
  _mapGovernanceLevel(governanceLevel) {
    const mapping = {
      'basic': 'minimal',
      'standard': 'standard',
      'strict': 'strict',
      'maximum': 'strict'
    };
    
    return mapping[governanceLevel] || 'standard';
  }
}

module.exports = GovernanceIdentityService;

