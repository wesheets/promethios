/**
 * Governance Exchange Protocol Component
 * 
 * Manages the exchange and verification of governance identities between agents,
 * establishes trust relationships, and visualizes governance contrast.
 * 
 * @module src/modules/multi_agent_coordination/governance_exchange_protocol
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Governance Exchange Protocol class
 */
class GovernanceExchangeProtocol {
  /**
   * Create a new Governance Exchange Protocol instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.governanceIdentity - Governance Identity module instance
   * @param {Object} options.prismObserver - PRISM Observer instance
   * @param {Object} options.vigilObserver - VIGIL Observer instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.governanceIdentity = options.governanceIdentity;
    this.prismObserver = options.prismObserver;
    this.vigilObserver = options.vigilObserver;
    this.config = options.config || {};
    
    // Initialize trust relationships map (contextId -> Map of agent pairs -> relationship)
    this.trustRelationships = new Map();
    
    // Initialize governance verifications map
    this.governanceVerifications = new Map();
    
    // Initialize governance metrics map
    this.governanceMetrics = new Map();
    
    this.logger.info('Governance Exchange Protocol initialized');
  }
  
  /**
   * Verify agent governance identity
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} governanceIdentity - Governance identity to verify
   * @returns {Object} Verification result
   */
  verifyGovernanceIdentity(agentId, governanceIdentity) {
    this.logger.info('Verifying governance identity', { agentId });
    
    // Create verification record
    const verificationId = uuidv4();
    const verification = {
      id: verificationId,
      agentId,
      timestamp: new Date().toISOString(),
      verified: false,
      hasGovernanceIdentity: !!governanceIdentity,
      details: {}
    };
    
    // Skip verification if no governance identity provided
    if (!governanceIdentity) {
      verification.details.error = 'No governance identity provided';
      
      // Store verification
      this.governanceVerifications.set(verificationId, verification);
      
      return verification;
    }
    
    try {
      // Verify governance identity structure
      this._verifyGovernanceStructure(governanceIdentity, verification);
      
      // Verify cryptographic proof if present
      if (governanceIdentity.cryptographicProof) {
        this._verifyCryptographicProof(governanceIdentity, verification);
      }
      
      // Verify constitution hash if present
      if (governanceIdentity.constitutionHash) {
        this._verifyConstitutionHash(governanceIdentity, verification);
      }
      
      // Verify with PRISM observer if available
      if (this.prismObserver) {
        const prismVerification = this.prismObserver.verifyGovernanceIdentity(agentId, governanceIdentity);
        verification.details.prismVerification = prismVerification;
        
        if (!prismVerification.verified) {
          verification.verified = false;
          verification.details.error = 'PRISM verification failed: ' + prismVerification.reason;
        }
      }
      
      // Verify with VIGIL observer if available
      if (this.vigilObserver) {
        const vigilVerification = this.vigilObserver.verifyGovernanceIdentity(agentId, governanceIdentity);
        verification.details.vigilVerification = vigilVerification;
        
        if (!vigilVerification.verified) {
          verification.verified = false;
          verification.details.error = 'VIGIL verification failed: ' + vigilVerification.reason;
        }
      }
      
      // If no errors so far, mark as verified
      if (!verification.details.error) {
        verification.verified = true;
      }
    } catch (error) {
      verification.verified = false;
      verification.details.error = error.message;
    }
    
    // Store verification
    this.governanceVerifications.set(verificationId, verification);
    
    return verification;
  }
  
  /**
   * Create minimal governance record for non-governed agent
   * 
   * @param {string} agentId - Agent ID
   * @returns {Object} Minimal governance record
   */
  createMinimalGovernanceRecord(agentId) {
    return {
      id: uuidv4(),
      agentId,
      timestamp: new Date().toISOString(),
      type: 'minimal',
      trustLevel: 'basic',
      complianceLevel: 'unknown',
      memoryIntegrityVerification: false,
      trustRequirements: {
        required: false,
        fallbackStrategy: 'isolate'
      }
    };
  }
  
  /**
   * Establish trust relationship between two agents
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId1 - First agent ID
   * @param {string} agentId2 - Second agent ID
   * @param {boolean} agent1HasGovernance - Whether first agent has governance identity
   * @param {boolean} agent2HasGovernance - Whether second agent has governance identity
   * @returns {Object} Trust relationship
   */
  establishTrustRelationship(contextId, agentId1, agentId2, agent1HasGovernance, agent2HasGovernance) {
    this.logger.info('Establishing trust relationship', { 
      contextId, 
      agentId1, 
      agentId2,
      agent1HasGovernance,
      agent2HasGovernance
    });
    
    // Initialize context trust relationships if needed
    if (!this.trustRelationships.has(contextId)) {
      this.trustRelationships.set(contextId, new Map());
    }
    
    const contextTrustRelationships = this.trustRelationships.get(contextId);
    
    // Create relationship key (always sort agent IDs to ensure consistent key)
    const relationshipKey = [agentId1, agentId2].sort().join('->');
    
    // Determine trust level based on governance status
    let trustLevel;
    if (agent1HasGovernance && agent2HasGovernance) {
      trustLevel = 'high';
    } else if (agent1HasGovernance || agent2HasGovernance) {
      trustLevel = 'medium';
    } else {
      trustLevel = 'low';
    }
    
    // Create trust relationship
    const relationship = {
      id: uuidv4(),
      contextId,
      agentId1,
      agentId2,
      agent1HasGovernance,
      agent2HasGovernance,
      trustLevel,
      establishedAt: new Date().toISOString(),
      verifications: [],
      violations: [],
      trustScore: this._calculateInitialTrustScore(agent1HasGovernance, agent2HasGovernance)
    };
    
    // Store relationship
    contextTrustRelationships.set(relationshipKey, relationship);
    
    // Initialize governance metrics for this context if needed
    if (!this.governanceMetrics.has(contextId)) {
      this.governanceMetrics.set(contextId, {
        totalRelationships: 0,
        governedRelationships: 0,
        mixedRelationships: 0,
        nonGovernedRelationships: 0,
        averageTrustScore: 0,
        verifications: 0,
        violations: 0
      });
    }
    
    // Update governance metrics
    const metrics = this.governanceMetrics.get(contextId);
    metrics.totalRelationships++;
    
    if (agent1HasGovernance && agent2HasGovernance) {
      metrics.governedRelationships++;
    } else if (agent1HasGovernance || agent2HasGovernance) {
      metrics.mixedRelationships++;
    } else {
      metrics.nonGovernedRelationships++;
    }
    
    // Update average trust score
    metrics.averageTrustScore = 
      (metrics.averageTrustScore * (metrics.totalRelationships - 1) + relationship.trustScore) / 
      metrics.totalRelationships;
    
    return relationship;
  }
  
  /**
   * Verify agent task compliance with governance requirements
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @param {Object} task - Task to verify
   * @returns {Object} Verification result
   */
  verifyAgentTaskCompliance(contextId, agentId, task) {
    this.logger.info('Verifying agent task compliance', { contextId, agentId });
    
    // Create verification record
    const verification = {
      id: uuidv4(),
      contextId,
      agentId,
      taskId: task.id || 'unknown',
      timestamp: new Date().toISOString(),
      compliant: true,
      reason: null,
      details: {}
    };
    
    // Skip verification if governance identity module is not available
    if (!this.governanceIdentity) {
      return verification;
    }
    
    try {
      // Check if agent has governance identity
      const hasGovernance = this.governanceIdentity.agentHasGovernanceIdentity(agentId);
      verification.details.hasGovernance = hasGovernance;
      
      // Check if task requires governance
      if (task.requiresGovernance && !hasGovernance) {
        verification.compliant = false;
        verification.reason = 'Task requires governance identity, but agent does not have one';
        return verification;
      }
      
      // Check if task forbids governance
      if (task.forbidsGovernance && hasGovernance) {
        verification.compliant = false;
        verification.reason = 'Task forbids governance identity, but agent has one';
        return verification;
      }
      
      // If agent has governance, perform additional checks
      if (hasGovernance) {
        // Get agent governance identity
        const governanceIdentity = this.governanceIdentity.getAgentGovernanceIdentity(agentId);
        
        // Check compliance level if task specifies minimum
        if (task.minComplianceLevel && 
            governanceIdentity.complianceLevel && 
            this._complianceLevelValue(governanceIdentity.complianceLevel) < 
            this._complianceLevelValue(task.minComplianceLevel)) {
          verification.compliant = false;
          verification.reason = `Task requires minimum compliance level ${task.minComplianceLevel}, but agent has ${governanceIdentity.complianceLevel}`;
          return verification;
        }
        
        // Check memory integrity verification if task requires it
        if (task.requiresMemoryIntegrityVerification && 
            !governanceIdentity.memoryIntegrityVerification) {
          verification.compliant = false;
          verification.reason = 'Task requires memory integrity verification, but agent does not support it';
          return verification;
        }
      }
      
      // Update governance metrics
      if (this.governanceMetrics.has(contextId)) {
        const metrics = this.governanceMetrics.get(contextId);
        metrics.verifications++;
        
        if (!verification.compliant) {
          metrics.violations++;
        }
      }
    } catch (error) {
      verification.compliant = false;
      verification.reason = `Error during verification: ${error.message}`;
    }
    
    return verification;
  }
  
  /**
   * Get governance level for an agent
   * 
   * @param {string} agentId - Agent ID
   * @returns {string} Governance level
   */
  getGovernanceLevel(agentId) {
    // Skip if governance identity module is not available
    if (!this.governanceIdentity) {
      return 'unknown';
    }
    
    // Check if agent has governance identity
    const hasGovernance = this.governanceIdentity.agentHasGovernanceIdentity(agentId);
    
    if (!hasGovernance) {
      return 'none';
    }
    
    // Get agent governance identity
    const governanceIdentity = this.governanceIdentity.getAgentGovernanceIdentity(agentId);
    
    // Determine governance level based on features
    if (governanceIdentity.complianceLevel === 'full' && 
        governanceIdentity.memoryIntegrityVerification && 
        governanceIdentity.cryptographicProof) {
      return 'full';
    } else if (governanceIdentity.complianceLevel === 'partial' || 
               governanceIdentity.memoryIntegrityVerification) {
      return 'partial';
    } else {
      return 'basic';
    }
  }
  
  /**
   * Get agent trust relationships in a context
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @returns {Array} Trust relationships
   */
  getAgentTrustRelationships(contextId, agentId) {
    // Verify context has trust relationships
    if (!this.trustRelationships.has(contextId)) {
      return [];
    }
    
    const contextTrustRelationships = this.trustRelationships.get(contextId);
    const relationships = [];
    
    // Find relationships involving this agent
    for (const relationship of contextTrustRelationships.values()) {
      if (relationship.agentId1 === agentId || relationship.agentId2 === agentId) {
        relationships.push({
          ...relationship,
          otherAgentId: relationship.agentId1 === agentId ? relationship.agentId2 : relationship.agentId1,
          otherAgentHasGovernance: relationship.agentId1 === agentId ? 
            relationship.agent2HasGovernance : relationship.agent1HasGovernance
        });
      }
    }
    
    return relationships;
  }
  
  /**
   * Get governance metrics for a context
   * 
   * @param {string} contextId - Context ID
   * @returns {Object} Governance metrics
   */
  getGovernanceMetrics(contextId) {
    if (!this.governanceMetrics.has(contextId)) {
      return {
        totalRelationships: 0,
        governedRelationships: 0,
        mixedRelationships: 0,
        nonGovernedRelationships: 0,
        averageTrustScore: 0,
        verifications: 0,
        violations: 0
      };
    }
    
    return { ...this.governanceMetrics.get(contextId) };
  }
  
  /**
   * Get trust boundary visualization data
   * 
   * @param {string} contextId - Context ID
   * @returns {Object} Trust boundary visualization data
   */
  getTrustBoundaryVisualization(contextId) {
    // Verify context has trust relationships
    if (!this.trustRelationships.has(contextId)) {
      return {
        boundaries: [],
        connections: []
      };
    }
    
    const contextTrustRelationships = this.trustRelationships.get(contextId);
    
    // Collect unique agents
    const agents = new Set();
    for (const relationship of contextTrustRelationships.values()) {
      agents.add(relationship.agentId1);
      agents.add(relationship.agentId2);
    }
    
    // Create agent nodes
    const agentNodes = Array.from(agents).map(agentId => {
      const hasGovernance = this.governanceIdentity ? 
        this.governanceIdentity.agentHasGovernanceIdentity(agentId) : false;
      
      return {
        id: agentId,
        hasGovernance,
        governanceLevel: this.getGovernanceLevel(agentId),
        trustBoundary: hasGovernance ? 'governed' : 'non-governed'
      };
    });
    
    // Create connections
    const connections = Array.from(contextTrustRelationships.values()).map(relationship => ({
      source: relationship.agentId1,
      target: relationship.agentId2,
      trustLevel: relationship.trustLevel,
      trustScore: relationship.trustScore
    }));
    
    // Create boundaries
    const boundaries = [
      {
        id: 'governed',
        type: 'governed',
        agents: agentNodes.filter(node => node.hasGovernance).map(node => node.id)
      },
      {
        id: 'non-governed',
        type: 'non-governed',
        agents: agentNodes.filter(node => !node.hasGovernance).map(node => node.id)
      }
    ];
    
    return {
      agents: agentNodes,
      connections,
      boundaries
    };
  }
  
  /**
   * Shutdown the governance exchange protocol
   */
  shutdown() {
    this.logger.info('Shutting down Governance Exchange Protocol');
    
    // Clear all data
    this.trustRelationships.clear();
    this.governanceVerifications.clear();
    this.governanceMetrics.clear();
  }
  
  /**
   * Verify governance identity structure
   * @private
   * 
   * @param {Object} governanceIdentity - Governance identity to verify
   * @param {Object} verification - Verification record to update
   */
  _verifyGovernanceStructure(governanceIdentity, verification) {
    // Check required fields
    const requiredFields = ['id', 'agentId', 'timestamp'];
    for (const field of requiredFields) {
      if (!governanceIdentity[field]) {
        verification.verified = false;
        verification.details.error = `Missing required field: ${field}`;
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Check timestamp format
    try {
      const timestamp = new Date(governanceIdentity.timestamp);
      if (isNaN(timestamp.getTime())) {
        throw new Error('Invalid timestamp format');
      }
    } catch (error) {
      verification.verified = false;
      verification.details.error = 'Invalid timestamp format';
      throw new Error('Invalid timestamp format');
    }
    
    // Record structure verification
    verification.details.structureVerified = true;
  }
  
  /**
   * Verify cryptographic proof
   * @private
   * 
   * @param {Object} governanceIdentity - Governance identity to verify
   * @param {Object} verification - Verification record to update
   */
  _verifyCryptographicProof(governanceIdentity, verification) {
    const { cryptographicProof } = governanceIdentity;
    
    // Check required proof fields
    if (!cryptographicProof.signature || !cryptographicProof.publicKey) {
      verification.verified = false;
      verification.details.error = 'Invalid cryptographic proof structure';
      throw new Error('Invalid cryptographic proof structure');
    }
    
    try {
      // Create verification data (exclude signature from verification)
      const verificationData = { ...governanceIdentity };
      delete verificationData.cryptographicProof.signature;
      
      // Verify signature
      const verifier = crypto.createVerify('SHA256');
      verifier.update(JSON.stringify(verificationData));
      
      const signatureVerified = verifier.verify(
        cryptographicProof.publicKey,
        cryptographicProof.signature,
        'base64'
      );
      
      if (!signatureVerified) {
        verification.verified = false;
        verification.details.error = 'Cryptographic signature verification failed';
        throw new Error('Cryptographic signature verification failed');
      }
      
      // Record proof verification
      verification.details.proofVerified = true;
    } catch (error) {
      verification.verified = false;
      verification.details.error = `Cryptographic proof error: ${error.message}`;
      throw new Error(`Cryptographic proof error: ${error.message}`);
    }
  }
  
  /**
   * Verify constitution hash
   * @private
   * 
   * @param {Object} governanceIdentity - Governance identity to verify
   * @param {Object} verification - Verification record to update
   */
  _verifyConstitutionHash(governanceIdentity, verification) {
    const { constitutionHash } = governanceIdentity;
    
    // Skip if no governance identity module
    if (!this.governanceIdentity) {
      verification.details.constitutionVerified = false;
      return;
    }
    
    try {
      // Get system constitution hash
      const systemConstitutionHash = this.governanceIdentity.getSystemConstitutionHash();
      
      // Compare hashes
      if (constitutionHash !== systemConstitutionHash) {
        verification.details.constitutionVerified = false;
        verification.details.constitutionError = 'Constitution hash mismatch';
        return;
      }
      
      // Record constitution verification
      verification.details.constitutionVerified = true;
    } catch (error) {
      verification.details.constitutionVerified = false;
      verification.details.constitutionError = error.message;
    }
  }
  
  /**
   * Calculate initial trust score based on governance status
   * @private
   * 
   * @param {boolean} agent1HasGovernance - Whether first agent has governance identity
   * @param {boolean} agent2HasGovernance - Whether second agent has governance identity
   * @returns {number} Initial trust score (0-1)
   */
  _calculateInitialTrustScore(agent1HasGovernance, agent2HasGovernance) {
    if (agent1HasGovernance && agent2HasGovernance) {
      return 0.9; // High initial trust for two governed agents
    } else if (agent1HasGovernance || agent2HasGovernance) {
      return 0.6; // Medium initial trust for mixed governance
    } else {
      return 0.3; // Low initial trust for non-governed agents
    }
  }
  
  /**
   * Get numeric value for compliance level
   * @private
   * 
   * @param {string} level - Compliance level
   * @returns {number} Numeric value
   */
  _complianceLevelValue(level) {
    const levels = {
      'none': 0,
      'minimal': 1,
      'basic': 2,
      'partial': 3,
      'substantial': 4,
      'full': 5
    };
    
    return levels[level.toLowerCase()] || 0;
  }
}

module.exports = GovernanceExchangeProtocol;
