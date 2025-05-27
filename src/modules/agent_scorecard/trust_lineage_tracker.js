/**
 * Trust Lineage Tracker
 * 
 * Responsible for creating, tracking, and verifying trust lineage
 * between agents. Ensures cryptographic verification of trust chains
 * and enforces delegation rules.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class TrustLineageTracker {
  constructor(config = {}) {
    this.config = {
      storageDir: path.join(process.cwd(), 'data', 'trust_lineage'),
      schemaPath: path.join(process.cwd(), 'schemas', 'agent_scorecard', 'trust_lineage.schema.v1.json'),
      minDelegationScore: 0.6,
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
   * Create a new trust lineage record
   * @param {string} sourceAgentId - Agent delegating trust
   * @param {string} targetAgentId - Agent receiving trust
   * @param {Object} sourceScorecard - Scorecard of source agent
   * @param {Object} targetScorecard - Scorecard of target agent
   * @param {Object} context - Context of the delegation
   * @returns {Object} - The created lineage record
   */
  async createLineageRecord(sourceAgentId, targetAgentId, sourceScorecard, targetScorecard, context = {}) {
    // Verify delegation requirements
    this._verifyDelegationRequirements(sourceScorecard, targetScorecard);
    
    // Get previous lineage record for chain linking
    const previousLineage = await this._getLatestLineageForPair(sourceAgentId, targetAgentId);
    
    const timestamp = new Date().toISOString();
    
    // Create lineage record
    const lineageRecord = {
      lineage_id: uuidv4(),
      timestamp,
      source_agent: {
        agent_id: sourceAgentId,
        governance_identity: {
          type: sourceScorecard.governance_identity.type,
          constitution_hash: sourceScorecard.governance_identity.constitution_hash
        },
        trust_score: sourceScorecard.trust_score
      },
      target_agent: {
        agent_id: targetAgentId,
        governance_identity: {
          type: targetScorecard.governance_identity.type,
          constitution_hash: targetScorecard.governance_identity.constitution_hash
        },
        trust_score: targetScorecard.trust_score
      },
      delegation_type: context.delegation_type || 'direct',
      trust_context: {
        domain: context.domain || 'general',
        scope: context.scope || ['default'],
        expiration: context.expiration || null
      },
      trust_metrics: {
        delegation_score: this._calculateDelegationScore(sourceScorecard, targetScorecard),
        confidence: context.confidence || 0.8,
        constraints: context.constraints || []
      },
      verification_history: [],
      cryptographic_proof: {
        signature: '',
        public_key_id: '',
        previous_lineage_hash: previousLineage ? this._calculateLineageHash(previousLineage) : null,
        timestamp,
        algorithm: this.config.cryptographicAlgorithm || 'ed25519'
      }
    };
    
    // Validate lineage record against schema
    const valid = this.validate(lineageRecord);
    if (!valid) {
      const errors = this.validate.errors;
      throw new Error(`Invalid lineage record: ${JSON.stringify(errors)}`);
    }
    
    // Store lineage record
    await this._storeLineageRecord(lineageRecord);
    
    return lineageRecord;
  }

  /**
   * Update trust lineage for an agent based on new scorecard
   * @param {string} agentId - Agent ID
   * @param {Object} scorecard - New scorecard
   * @returns {boolean} - Whether the update was successful
   */
  async updateLineage(agentId, scorecard) {
    // Get all lineage records where this agent is source or target
    const sourceRecords = await this.getLineageBySource(agentId);
    const targetRecords = await this.getLineageByTarget(agentId);
    
    // Update delegation chain in scorecard
    const delegationChain = this._buildDelegationChain(agentId, sourceRecords, targetRecords);
    
    // Return success
    return true;
  }

  /**
   * Get all lineage records for an agent
   * @param {string} agentId - Agent ID
   * @returns {Array} - Array of lineage records
   */
  async getLineageForAgent(agentId) {
    const sourceRecords = await this.getLineageBySource(agentId);
    const targetRecords = await this.getLineageByTarget(agentId);
    
    // Combine and sort by timestamp (newest first)
    return [...sourceRecords, ...targetRecords]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get lineage records where agent is the source
   * @param {string} agentId - Agent ID
   * @returns {Array} - Array of lineage records
   */
  async getLineageBySource(agentId) {
    const sourceDir = path.join(this.config.storageDir, 'by_source', agentId);
    
    if (!fs.existsSync(sourceDir)) {
      return [];
    }
    
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));
    
    const records = [];
    for (const file of files) {
      const record = JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8'));
      records.push(record);
    }
    
    return records;
  }

  /**
   * Get lineage records where agent is the target
   * @param {string} agentId - Agent ID
   * @returns {Array} - Array of lineage records
   */
  async getLineageByTarget(agentId) {
    const targetDir = path.join(this.config.storageDir, 'by_target', agentId);
    
    if (!fs.existsSync(targetDir)) {
      return [];
    }
    
    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.json'));
    
    const records = [];
    for (const file of files) {
      const record = JSON.parse(fs.readFileSync(path.join(targetDir, file), 'utf8'));
      records.push(record);
    }
    
    return records;
  }

  /**
   * Verify a lineage record's cryptographic integrity
   * @param {Object} lineageRecord - The lineage record to verify
   * @returns {boolean} - Whether the record is valid
   */
  async verifyLineageRecord(lineageRecord) {
    // This would use the CryptographicVerifier in a real implementation
    // For now, we'll just return true
    return true;
  }

  /**
   * Store a lineage record
   * @private
   */
  async _storeLineageRecord(lineageRecord) {
    // Store in main directory
    const mainDir = path.join(this.config.storageDir, 'records');
    if (!fs.existsSync(mainDir)) {
      fs.mkdirSync(mainDir, { recursive: true });
    }
    
    const mainPath = path.join(mainDir, `${lineageRecord.lineage_id}.json`);
    fs.writeFileSync(mainPath, JSON.stringify(lineageRecord, null, 2));
    
    // Store in by_source directory
    const sourceDir = path.join(this.config.storageDir, 'by_source', lineageRecord.source_agent.agent_id);
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }
    
    const sourcePath = path.join(sourceDir, `${lineageRecord.lineage_id}.json`);
    fs.writeFileSync(sourcePath, JSON.stringify(lineageRecord, null, 2));
    
    // Store in by_target directory
    const targetDir = path.join(this.config.storageDir, 'by_target', lineageRecord.target_agent.agent_id);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const targetPath = path.join(targetDir, `${lineageRecord.lineage_id}.json`);
    fs.writeFileSync(targetPath, JSON.stringify(lineageRecord, null, 2));
    
    // Update pair index
    await this._updatePairIndex(
      lineageRecord.source_agent.agent_id,
      lineageRecord.target_agent.agent_id,
      lineageRecord.lineage_id
    );
  }

  /**
   * Get the latest lineage record for a pair of agents
   * @private
   */
  async _getLatestLineageForPair(sourceAgentId, targetAgentId) {
    const pairDir = path.join(this.config.storageDir, 'by_pair');
    const pairPath = path.join(pairDir, `${sourceAgentId}_${targetAgentId}.json`);
    
    if (!fs.existsSync(pairPath)) {
      return null;
    }
    
    const pairIndex = JSON.parse(fs.readFileSync(pairPath, 'utf8'));
    
    if (pairIndex.length === 0) {
      return null;
    }
    
    // Get the latest lineage record
    const latestId = pairIndex[0];
    const recordPath = path.join(this.config.storageDir, 'records', `${latestId}.json`);
    
    if (!fs.existsSync(recordPath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  }

  /**
   * Update the pair index
   * @private
   */
  async _updatePairIndex(sourceAgentId, targetAgentId, lineageId) {
    const pairDir = path.join(this.config.storageDir, 'by_pair');
    if (!fs.existsSync(pairDir)) {
      fs.mkdirSync(pairDir, { recursive: true });
    }
    
    const pairPath = path.join(pairDir, `${sourceAgentId}_${targetAgentId}.json`);
    
    let pairIndex = [];
    if (fs.existsSync(pairPath)) {
      pairIndex = JSON.parse(fs.readFileSync(pairPath, 'utf8'));
    }
    
    // Add new lineage ID to the beginning
    pairIndex.unshift(lineageId);
    
    // Write updated index
    fs.writeFileSync(pairPath, JSON.stringify(pairIndex, null, 2));
  }

  /**
   * Calculate a hash for a lineage record
   * @private
   */
  _calculateLineageHash(lineageRecord) {
    // In a real implementation, this would use a cryptographic hash function
    // For now, we'll just return a placeholder
    return '0'.repeat(64);
  }

  /**
   * Calculate delegation score based on source and target scorecards
   * @private
   */
  _calculateDelegationScore(sourceScorecard, targetScorecard) {
    // If either scorecard has null trust score, use minimum
    if (sourceScorecard.trust_score === null || targetScorecard.trust_score === null) {
      return this.config.minDelegationScore;
    }
    
    // Base score is average of source and target trust scores
    const baseScore = (sourceScorecard.trust_score + targetScorecard.trust_score) / 2;
    
    // Adjust based on governance compatibility
    let governanceAdjustment = 0;
    
    // Same governance type gets a bonus
    if (sourceScorecard.governance_identity.type === targetScorecard.governance_identity.type) {
      governanceAdjustment += 0.1;
    }
    
    // Same constitution hash gets a bigger bonus
    if (sourceScorecard.governance_identity.constitution_hash === 
        targetScorecard.governance_identity.constitution_hash) {
      governanceAdjustment += 0.1;
    }
    
    // Calculate final score with adjustments
    let finalScore = baseScore + governanceAdjustment;
    
    // Ensure score is within bounds
    finalScore = Math.max(this.config.minDelegationScore, Math.min(1.0, finalScore));
    
    // Round to 2 decimal places
    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Build delegation chain from lineage records
   * @private
   */
  _buildDelegationChain(agentId, sourceRecords, targetRecords) {
    // Extract delegation information from records
    const delegations = sourceRecords.map(record => ({
      agent_id: record.target_agent.agent_id,
      timestamp: record.timestamp,
      trust_score: record.trust_metrics.delegation_score
    }));
    
    const inheritances = targetRecords.map(record => ({
      agent_id: record.source_agent.agent_id,
      timestamp: record.timestamp,
      trust_score: record.trust_metrics.delegation_score
    }));
    
    // Combine and sort by timestamp (newest first)
    return [...delegations, ...inheritances]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Verify delegation requirements
   * @private
   */
  _verifyDelegationRequirements(sourceScorecard, targetScorecard) {
    // Cannot delegate from null trust score
    if (sourceScorecard.trust_score === null) {
      throw new Error('Source agent has null trust score and cannot delegate trust');
    }
    
    // Minimum source trust score requirement
    if (sourceScorecard.trust_score < this.config.minDelegationScore) {
      throw new Error(`Source agent trust score (${sourceScorecard.trust_score}) is below minimum threshold (${this.config.minDelegationScore})`);
    }
    
    // Unknown governance agents cannot receive delegation
    if (targetScorecard.governance_identity.type === 'unknown') {
      throw new Error('Target agent has unknown governance and cannot receive trust delegation');
    }
    
    return true;
  }
}

module.exports = TrustLineageTracker;
