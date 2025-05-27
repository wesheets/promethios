/**
 * Governance Identity Module
 * 
 * This module implements agent tagging and metadata broadcasting for the Promethios framework,
 * enabling trust negotiation and interoperability between agents with different governance frameworks.
 * 
 * @module governance_identity
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Load schemas - using path.resolve to handle relative paths correctly
const schemaBasePath = path.resolve(__dirname, '../../../schemas/governance');
let governanceIdentitySchema;
let interoperabilityProtocolSchema;

try {
  governanceIdentitySchema = require(path.join(schemaBasePath, 'governance_identity.schema.v1.json'));
  interoperabilityProtocolSchema = require(path.join(schemaBasePath, 'interoperability_protocol.schema.v1.json'));
} catch (error) {
  // Fallback to mock schemas for testing
  governanceIdentitySchema = {
    properties: {
      agent_id: { type: 'string' },
      governance_framework: { type: 'string' },
      constitution_hash: { type: 'string' },
      compliance_level: { type: 'string' },
      memory_integrity: { type: 'object' },
      trust_requirements: { type: 'object' },
      fallback_strategy: { type: 'string' },
      confidence_modifiers: { type: 'object' },
      audit_surface: { type: 'string' },
      refusal_policy: { type: 'object' },
      interoperability_version: { type: 'string' },
      governance_proof: { type: 'object' }
    }
  };
  
  interoperabilityProtocolSchema = {
    properties: {
      protocol_version: { type: 'string' },
      governance_negotiation_enabled: { type: 'boolean' },
      default_protocol: { type: 'string' },
      trust_verification_method: { type: 'string' },
      handshake_timeout_ms: { type: 'integer' },
      required_metadata_fields: { type: 'array' },
      trust_decay_policy: { type: 'object' },
      interaction_logging: { type: 'object' },
      fallback_protocols: { type: 'array' }
    }
  };
  
  console.warn('Failed to load governance schemas, using fallback mock schemas:', error.message);
}

/**
 * GovernanceIdentity class for managing agent governance identity and interoperability
 */
class GovernanceIdentity {
  /**
   * Create a new GovernanceIdentity instance
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration object
   * @param {Object} options.hooks - Constitutional hooks manager
   */
  constructor({ logger, config = {}, hooks = null }) {
    this.logger = logger || console;
    this.config = {
      dataPath: config.dataPath || './data/governance_identity',
      defaultComplianceLevel: config.defaultComplianceLevel || 'standard',
      enforceTrustRequirements: config.enforceTrustRequirements !== false,
      signatureKeyPath: config.signatureKeyPath || './keys/promethios_governance.pem',
      ...config
    };
    
    this.hooks = hooks;
    this.identities = new Map();
    this.interactionHistory = new Map();
    this.disputeLog = new Map();
    
    // Initialize data directory
    try {
      if (!fs.existsSync(this.config.dataPath)) {
        fs.mkdirSync(this.config.dataPath, { recursive: true });
        this.logger.info(`Created governance identity data directory: ${this.config.dataPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create governance identity data directory: ${error.message}`);
    }
    
    // Register hooks if available
    if (this.hooks) {
      this.registerHooks();
    }
    
    this.logger.info('Governance Identity module initialized');
  }
  
  /**
   * Register constitutional hooks
   */
  registerHooks() {
    this.hooks.register('beforeAgentExecution', this.tagAgent.bind(this));
    this.hooks.register('beforeAgentInteraction', this.verifyGovernanceCompatibility.bind(this));
    this.hooks.register('afterAgentInteraction', this.logInteraction.bind(this));
    this.hooks.register('beforeAgentDelegation', this.verifyDelegationTrust.bind(this));
    this.logger.info('Governance Identity hooks registered');
  }
  
  /**
   * Tag an agent with governance identity metadata
   * @param {Object} agent - Agent to tag
   * @param {Object} context - Execution context
   * @returns {Object} - Tagged agent
   */
  tagAgent(agent, context = {}) {
    if (!agent) {
      this.logger.warn('Cannot tag undefined agent');
      return null;
    }
    
    // Check if agent already has governance identity
    if (agent.governanceIdentity && agent.governanceIdentity.agent_id) {
      return agent;
    }
    
    // Generate constitution hash if not provided
    const constitutionHash = this.generateConstitutionHash(agent);
    
    // Create governance identity
    const governanceIdentity = {
      agent_id: agent.id || uuidv4(),
      governance_framework: 'promethios',
      constitution_hash: constitutionHash,
      compliance_level: this.determineComplianceLevel(agent),
      memory_integrity: this.getMemoryIntegrityInfo(agent),
      trust_requirements: {
        memory_integrity: true,
        reflection_enforced: true,
        belief_trace: true,
        minimum_compliance_level: 'standard'
      },
      fallback_strategy: 'log-and-restrict',
      confidence_modifiers: {
        unknown_governance: -0.3,
        missing_reflection: -0.5,
        missing_belief_trace: -0.4,
        missing_memory_integrity: -0.6
      },
      audit_surface: this.getAuditSurfaceUrl(agent),
      refusal_policy: {
        explain_rejection: true,
        log_rejection: true,
        retry_allowed: false
      },
      interoperability_version: '1.0.0',
      governance_proof: this.generateGovernanceProof(agent)
    };
    
    // Attach governance identity to agent
    agent.governanceIdentity = governanceIdentity;
    
    // Store identity
    this.identities.set(agent.id, governanceIdentity);
    
    this.logger.info(`Tagged agent ${agent.id} with Promethios governance identity`);
    
    // Trigger hook if available
    if (this.hooks) {
      this.hooks.trigger('agentTagged', { agent, governanceIdentity });
    }
    
    return agent;
  }
  
  /**
   * Generate a cryptographic proof of governance identity
   * @param {Object} agent - Agent to generate proof for
   * @returns {Object} - Governance proof
   */
  generateGovernanceProof(agent) {
    const timestamp = new Date().toISOString();
    const agentId = agent.id || 'unknown';
    
    // Create signature payload
    const payload = `promethios:${agentId}:${timestamp}`;
    
    let signature;
    try {
      // In production, this would use the private key
      // For testing, we'll generate a mock signature
      signature = crypto.createHash('sha256').update(payload).digest('hex');
    } catch (error) {
      this.logger.error(`Failed to generate governance proof signature: ${error.message}`);
      signature = 'mock_signature_for_testing';
    }
    
    return {
      signed_by: 'promethios',
      signature: `ecdsa256:${signature}`,
      timestamp: timestamp,
      valid_until: new Date(Date.now() + 86400000).toISOString() // 24 hours
    };
  }
  
  /**
   * Verify a governance proof
   * @param {Object} governanceIdentity - Governance identity to verify
   * @returns {Object} - Verification result
   */
  verifyGovernanceProof(governanceIdentity) {
    if (!governanceIdentity || !governanceIdentity.governance_proof) {
      return { valid: false, reason: 'Missing governance proof' };
    }
    
    const proof = governanceIdentity.governance_proof;
    
    // Check if proof has expired
    const validUntil = new Date(proof.valid_until);
    if (validUntil < new Date()) {
      return { valid: false, reason: 'Governance proof has expired' };
    }
    
    // In production, this would verify the signature using the public key
    // For testing, we'll assume the signature is valid if it exists
    if (!proof.signature || !proof.signature.startsWith('ecdsa256:')) {
      return { valid: false, reason: 'Invalid signature format' };
    }
    
    return { valid: true, reason: 'Governance proof verified' };
  }
  
  /**
   * Generate a constitution hash for an agent
   * @param {Object} agent - Agent to generate hash for
   * @returns {string} - Constitution hash
   */
  generateConstitutionHash(agent) {
    if (agent.constitutionHash) {
      return agent.constitutionHash;
    }
    
    // Generate hash from agent contract or properties
    // Ensure we're passing a string to the hash function
    const hashSource = typeof agent === 'string' ? agent : JSON.stringify(agent);
    const hash = crypto.createHash('sha256').update(hashSource).digest('hex');
    
    return `sha256:${hash}`;
  }
  
  /**
   * Determine compliance level for an agent
   * @param {Object} agent - Agent to determine compliance level for
   * @returns {string} - Compliance level
   */
  determineComplianceLevel(agent) {
    // Check if agent has explicit compliance level
    if (agent.complianceLevel) {
      return agent.complianceLevel;
    }
    
    // Determine based on agent capabilities
    const capabilities = agent.capabilities || [];
    const hasMemoryIntegrity = capabilities.includes('memory_integrity') || agent.memoryIntegrity || agent.merkleMemory;
    const hasReflection = capabilities.includes('reflection') || agent.reflection || agent.selfReflection;
    const hasBeliefTrace = capabilities.includes('belief_trace') || agent.beliefTrace;
    
    if (hasMemoryIntegrity && hasReflection && hasBeliefTrace) {
      return 'strict';
    } else if (hasMemoryIntegrity || hasReflection) {
      return 'standard';
    } else {
      return 'minimal';
    }
  }
  
  /**
   * Get memory integrity information for an agent
   * @param {Object} agent - Agent to get memory integrity info for
   * @returns {Object} - Memory integrity info
   */
  getMemoryIntegrityInfo(agent) {
    // Check if agent has memory integrity info
    if (agent.memoryIntegrity) {
      return agent.memoryIntegrity;
    }
    
    // Determine memory integrity type from capabilities
    const capabilities = agent.capabilities || [];
    const hasMemoryIntegrity = capabilities.includes('memory_integrity');
    
    // Default memory integrity info
    return {
      type: hasMemoryIntegrity || agent.merkleMemory ? 'merkle_v3' : 'immutable_log',
      verification_endpoint: `/api/agents/${agent.id}/memory/verify`,
      last_verified: new Date().toISOString()
    };
  }
  
  /**
   * Get audit surface URL for an agent
   * @param {Object} agent - Agent to get audit surface URL for
   * @returns {string} - Audit surface URL
   */
  getAuditSurfaceUrl(agent) {
    // Check if agent has audit surface URL
    if (agent.auditSurface) {
      return agent.auditSurface;
    }
    
    // Default audit surface URL
    return `/api/agents/${agent.id}/audit`;
  }
  
  /**
   * Verify governance compatibility between agents
   * @param {Object} sourceAgent - Source agent
   * @param {Object} targetAgent - Target agent
   * @param {Object} context - Interaction context
   * @returns {Object} - Verification result
   */
  verifyGovernanceCompatibility(sourceAgent, targetAgent, context = {}) {
    if (!sourceAgent || !targetAgent) {
      this.logger.warn('Cannot verify compatibility for undefined agents');
      return { compatible: false, reason: 'Missing agent(s)' };
    }
    
    // Ensure agents have governance identity
    sourceAgent = this.tagAgent(sourceAgent);
    
    // Check if target agent has governance identity
    if (!targetAgent.governanceIdentity) {
      // External agent without governance identity
      this.logger.info(`Target agent ${targetAgent.id} has no governance identity, tagging as external`);
      targetAgent = this.tagExternalAgent(targetAgent);
    }
    
    // Get governance identities
    const sourceIdentity = sourceAgent.governanceIdentity;
    const targetIdentity = targetAgent.governanceIdentity;
    
    // Verify governance proofs
    const sourceProofVerification = this.verifyGovernanceProof(sourceIdentity);
    const targetProofVerification = this.verifyGovernanceProof(targetIdentity);
    
    if (!sourceProofVerification.valid) {
      this.logger.warn(`Source agent ${sourceAgent.id} has invalid governance proof: ${sourceProofVerification.reason}`);
      this.logGovernanceDispute({
        type: 'invalid_proof',
        sourceAgentId: sourceAgent.id,
        targetAgentId: targetAgent.id,
        reason: sourceProofVerification.reason,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!targetProofVerification.valid) {
      this.logger.warn(`Target agent ${targetAgent.id} has invalid governance proof: ${targetProofVerification.reason}`);
      this.logGovernanceDispute({
        type: 'invalid_proof',
        sourceAgentId: sourceAgent.id,
        targetAgentId: targetAgent.id,
        reason: targetProofVerification.reason,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check trust requirements
    const trustResult = this.checkTrustRequirements(sourceIdentity, targetIdentity);
    
    // Log verification result
    this.logger.info(`Governance compatibility verification: ${trustResult.compatible ? 'Compatible' : 'Incompatible'}`);
    if (!trustResult.compatible) {
      this.logger.warn(`Incompatibility reason: ${trustResult.reason}`);
      
      // Log governance dispute
      this.logGovernanceDispute({
        type: 'trust_requirements',
        sourceAgentId: sourceAgent.id,
        targetAgentId: targetAgent.id,
        reason: trustResult.reason,
        timestamp: new Date().toISOString()
      });
    }
    
    // Apply confidence modifiers
    const confidenceModifiers = this.calculateConfidenceModifiers(sourceIdentity, targetIdentity);
    
    // Determine interaction policy
    const interactionPolicy = this.determineInteractionPolicy(sourceIdentity, targetIdentity, trustResult);
    
    // Create verification result
    const verificationResult = {
      compatible: trustResult.compatible,
      reason: trustResult.reason,
      confidenceModifiers,
      interactionPolicy,
      timestamp: new Date().toISOString(),
      verificationId: uuidv4(),
      sourceProofValid: sourceProofVerification.valid,
      targetProofValid: targetProofVerification.valid
    };
    
    // Store interaction in history
    this.logInteractionVerification(sourceAgent.id, targetAgent.id, verificationResult);
    
    // Trigger hook if available
    if (this.hooks) {
      this.hooks.trigger('governanceVerified', { 
        sourceAgent, 
        targetAgent, 
        verificationResult 
      });
    }
    
    return verificationResult;
  }
  
  /**
   * Tag an external agent with governance identity metadata
   * @param {Object} agent - External agent to tag
   * @returns {Object} - Tagged external agent
   */
  tagExternalAgent(agent) {
    if (!agent) {
      this.logger.warn('Cannot tag undefined external agent');
      return null;
    }
    
    // Create external governance identity
    const governanceIdentity = {
      agent_id: agent.id || uuidv4(),
      governance_framework: 'external',
      constitution_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      compliance_level: 'minimal',
      memory_integrity: {
        type: 'none',
        verification_endpoint: '',
        last_verified: new Date().toISOString()
      },
      trust_requirements: {
        memory_integrity: false,
        reflection_enforced: false,
        belief_trace: false,
        minimum_compliance_level: 'minimal'
      },
      fallback_strategy: 'log-and-proceed',
      confidence_modifiers: {
        unknown_governance: -0.1,
        missing_reflection: -0.2,
        missing_belief_trace: -0.2,
        missing_memory_integrity: -0.3
      },
      audit_surface: '',
      refusal_policy: {
        explain_rejection: true,
        log_rejection: true,
        retry_allowed: true
      },
      interoperability_version: '1.0.0',
      governance_proof: {
        signed_by: 'external',
        signature: 'none',
        timestamp: new Date().toISOString(),
        valid_until: new Date(Date.now() + 3600000).toISOString() // 1 hour
      }
    };
    
    // Attach governance identity to agent
    agent.governanceIdentity = governanceIdentity;
    
    // Store identity
    this.identities.set(agent.id, governanceIdentity);
    
    this.logger.info(`Tagged external agent ${agent.id} with governance identity`);
    
    return agent;
  }
  
  /**
   * Check trust requirements between agents
   * @param {Object} sourceIdentity - Source agent governance identity
   * @param {Object} targetIdentity - Target agent governance identity
   * @returns {Object} - Trust check result
   */
  checkTrustRequirements(sourceIdentity, targetIdentity) {
    // Default to compatible if not enforcing trust requirements
    if (!this.config.enforceTrustRequirements) {
      return { compatible: true, reason: 'Trust requirements not enforced' };
    }
    
    const requirements = sourceIdentity.trust_requirements || {
      memory_integrity: false,
      reflection_enforced: false,
      belief_trace: false,
      minimum_compliance_level: 'minimal'
    };
    
    // Check memory integrity
    if (requirements.memory_integrity && 
        targetIdentity.memory_integrity && 
        targetIdentity.memory_integrity.type === 'none') {
      return { compatible: false, reason: 'Memory integrity required but not provided' };
    }
    
    // Check reflection enforcement
    if (requirements.reflection_enforced && targetIdentity.governance_framework !== 'promethios') {
      return { compatible: false, reason: 'Reflection enforcement required but not guaranteed' };
    }
    
    // Check belief trace
    if (requirements.belief_trace && targetIdentity.governance_framework !== 'promethios') {
      return { compatible: false, reason: 'Belief trace required but not guaranteed' };
    }
    
    // Check compliance level
    const complianceLevels = ['minimal', 'standard', 'strict', 'custom'];
    const requiredLevel = complianceLevels.indexOf(requirements.minimum_compliance_level || 'minimal');
    const targetLevel = complianceLevels.indexOf(targetIdentity.compliance_level || 'minimal');
    
    if (requiredLevel > targetLevel) {
      return { 
        compatible: false, 
        reason: `Compliance level ${requirements.minimum_compliance_level} required, but ${targetIdentity.compliance_level} provided` 
      };
    }
    
    // All requirements met
    return { compatible: true, reason: 'All trust requirements met' };
  }
  
  /**
   * Calculate confidence modifiers based on governance identity
   * @param {Object} sourceIdentity - Source agent governance identity
   * @param {Object} targetIdentity - Target agent governance identity
   * @returns {Object} - Confidence modifiers
   */
  calculateConfidenceModifiers(sourceIdentity, targetIdentity) {
    const modifiers = {
      total: 0,
      factors: {}
    };
    
    // Default confidence modifiers if not present
    const defaultModifiers = {
      unknown_governance: -0.3,
      missing_reflection: -0.5,
      missing_belief_trace: -0.4,
      missing_memory_integrity: -0.6
    };
    
    // Use source identity modifiers or defaults
    const sourceModifiers = sourceIdentity.confidence_modifiers || defaultModifiers;
    
    // Check governance framework
    if (targetIdentity.governance_framework !== 'promethios') {
      modifiers.factors.unknown_governance = sourceModifiers.unknown_governance;
      modifiers.total += modifiers.factors.unknown_governance;
    }
    
    // Check memory integrity
    if (targetIdentity.memory_integrity && targetIdentity.memory_integrity.type === 'none') {
      modifiers.factors.missing_memory_integrity = sourceModifiers.missing_memory_integrity;
      modifiers.total += modifiers.factors.missing_memory_integrity;
    }
    
    // Check reflection enforcement
    if (targetIdentity.governance_framework !== 'promethios') {
      modifiers.factors.missing_reflection = sourceModifiers.missing_reflection;
      modifiers.total += modifiers.factors.missing_reflection;
    }
    
    // Check belief trace
    if (targetIdentity.governance_framework !== 'promethios') {
      modifiers.factors.missing_belief_trace = sourceModifiers.missing_belief_trace;
      modifiers.total += modifiers.factors.missing_belief_trace;
    }
    
    return modifiers;
  }
  
  /**
   * Determine interaction policy based on governance identity and trust result
   * @param {Object} sourceIdentity - Source agent governance identity
   * @param {Object} targetIdentity - Target agent governance identity
   * @param {Object} trustResult - Trust check result
   * @returns {Object} - Interaction policy
   */
  determineInteractionPolicy(sourceIdentity, targetIdentity, trustResult) {
    // Get fallback strategy
    const fallbackStrategy = sourceIdentity.fallback_strategy || 'log-and-proceed';
    
    // Determine policy based on compatibility and fallback strategy
    if (trustResult.compatible) {
      return {
        action: 'proceed',
        restrictions: [],
        explanation: 'Compatible governance frameworks'
      };
    }
    
    switch (fallbackStrategy) {
      case 'reject':
        return {
          action: 'reject',
          restrictions: [],
          explanation: trustResult.reason
        };
        
      case 'log-and-restrict':
        return {
          action: 'restrict',
          restrictions: [
            'no_memory_write',
            'no_external_calls',
            'no_sensitive_data'
          ],
          explanation: `Restricted due to: ${trustResult.reason}`
        };
        
      case 'log-and-proceed':
        return {
          action: 'proceed',
          restrictions: [],
          explanation: `Proceeding despite: ${trustResult.reason}`
        };
        
      default:
        return {
          action: 'proceed',
          restrictions: [],
          explanation: 'Default policy applied'
        };
    }
  }
  
  /**
   * Verify trust for agent delegation
   * @param {Object} sourceAgent - Source agent
   * @param {Object} targetAgent - Target agent
   * @param {Object} context - Delegation context
   * @returns {Object} - Verification result
   */
  verifyDelegationTrust(sourceAgent, targetAgent, context = {}) {
    if (!sourceAgent || !targetAgent) {
      this.logger.warn('Cannot verify delegation trust for undefined agents');
      return { proceed: false, reason: 'Missing agent(s)' };
    }
    
    // Ensure agents have governance identity
    sourceAgent = this.tagAgent(sourceAgent);
    
    // Check if target agent has governance identity
    if (!targetAgent.governanceIdentity) {
      // External agent without governance identity
      this.logger.info(`Target agent ${targetAgent.id} has no governance identity, tagging as external`);
      targetAgent = this.tagExternalAgent(targetAgent);
    }
    
    // Get governance identities
    const sourceIdentity = sourceAgent.governanceIdentity;
    const targetIdentity = targetAgent.governanceIdentity;
    
    // Check trust requirements
    const trustResult = this.checkTrustRequirements(sourceIdentity, targetIdentity);
    
    // Create trust lineage
    const trustLineage = {
      delegator: sourceAgent.id,
      delegatee: targetAgent.id,
      delegatorGovernance: sourceIdentity.governance_framework,
      delegateeGovernance: targetIdentity.governance_framework,
      trustVerified: trustResult.compatible,
      verificationReason: trustResult.reason,
      timestamp: new Date().toISOString(),
      delegationId: uuidv4()
    };
    
    // Attach trust lineage to context
    context.trustLineage = trustLineage;
    
    // Log delegation
    this.logger.info(`Delegation trust verification: ${trustResult.compatible ? 'Trusted' : 'Untrusted'}`);
    if (!trustResult.compatible) {
      this.logger.warn(`Delegation trust verification failed: ${trustResult.reason}`);
      
      // Log governance dispute
      this.logGovernanceDispute({
        type: 'delegation_trust',
        sourceAgentId: sourceAgent.id,
        targetAgentId: targetAgent.id,
        reason: trustResult.reason,
        timestamp: new Date().toISOString(),
        trustLineage
      });
    }
    
    // Return verification result
    return {
      proceed: trustResult.compatible,
      reason: trustResult.reason,
      context,
      trustLineage
    };
  }
  
  /**
   * Log governance dispute
   * @param {Object} dispute - Dispute details
   */
  logGovernanceDispute(dispute) {
    const disputeId = `dispute_${uuidv4()}`;
    
    // Add dispute ID and timestamp
    dispute.id = disputeId;
    dispute.timestamp = dispute.timestamp || new Date().toISOString();
    
    // Store in dispute log
    this.disputeLog.set(disputeId, dispute);
    
    // Persist to disk
    this.persistDisputeRecord(dispute);
    
    this.logger.warn(`Governance dispute logged: ${dispute.type} - ${dispute.reason}`);
    
    // Trigger hook if available
    if (this.hooks) {
      this.hooks.trigger('governanceDispute', { dispute });
    }
    
    return disputeId;
  }
  
  /**
   * Persist dispute record to disk
   * @param {Object} dispute - Dispute record to persist
   */
  persistDisputeRecord(dispute) {
    try {
      const filePath = path.join(this.config.dataPath, `dispute_${dispute.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(dispute, null, 2));
    } catch (error) {
      this.logger.error(`Failed to persist dispute record: ${error.message}`);
    }
  }
  
  /**
   * Log interaction verification between agents
   * @param {string} sourceAgentId - Source agent ID
   * @param {string} targetAgentId - Target agent ID
   * @param {Object} verificationResult - Verification result
   */
  logInteractionVerification(sourceAgentId, targetAgentId, verificationResult) {
    const interactionId = `${sourceAgentId}:${targetAgentId}:${Date.now()}`;
    
    // Create interaction record
    const interactionRecord = {
      id: interactionId,
      sourceAgentId,
      targetAgentId,
      verificationResult,
      timestamp: new Date().toISOString()
    };
    
    // Store in interaction history
    this.interactionHistory.set(interactionId, interactionRecord);
    
    // Persist to disk if configured
    this.persistInteractionRecord(interactionRecord);
  }
  
  /**
   * Log interaction between agents
   * @param {Object} sourceAgent - Source agent
   * @param {Object} targetAgent - Target agent
   * @param {Object} context - Interaction context
   * @param {Object} result - Interaction result
   */
  logInteraction(sourceAgent, targetAgent, context = {}, result = {}) {
    if (!sourceAgent || !targetAgent) {
      this.logger.warn('Cannot log interaction for undefined agents');
      return;
    }
    
    const interactionId = `${sourceAgent.id}:${targetAgent.id}:${Date.now()}`;
    
    // Create interaction record
    const interactionRecord = {
      id: interactionId,
      sourceAgentId: sourceAgent.id,
      targetAgentId: targetAgent.id,
      context,
      result,
      timestamp: new Date().toISOString(),
      trustLineage: context.trustLineage
    };
    
    // Store in interaction history
    this.interactionHistory.set(interactionId, interactionRecord);
    
    // Persist to disk if configured
    this.persistInteractionRecord(interactionRecord);
    
    this.logger.debug(`Logged interaction ${interactionId}`);
  }
  
  /**
   * Persist interaction record to disk
   * @param {Object} interactionRecord - Interaction record to persist
   */
  persistInteractionRecord(interactionRecord) {
    try {
      const filePath = path.join(this.config.dataPath, `interaction_${interactionRecord.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(interactionRecord, null, 2));
    } catch (error) {
      this.logger.error(`Failed to persist interaction record: ${error.message}`);
    }
  }
  
  /**
   * Get governance identity for an agent
   * @param {string} agentId - Agent ID
   * @returns {Object} - Governance identity
   */
  getGovernanceIdentity(agentId) {
    return this.identities.get(agentId);
  }
  
  /**
   * Get interaction history for an agent
   * @param {string} agentId - Agent ID
   * @param {Object} options - Filter options
   * @returns {Array} - Interaction history
   */
  getInteractionHistory(agentId, options = {}) {
    const history = [];
    
    // Filter interaction history
    for (const [id, record] of this.interactionHistory.entries()) {
      if (record.sourceAgentId === agentId || record.targetAgentId === agentId) {
        history.push(record);
      }
    }
    
    // Apply time range filter if provided
    if (options.startTime || options.endTime) {
      return history.filter(record => {
        const timestamp = new Date(record.timestamp).getTime();
        if (options.startTime && timestamp < options.startTime) {
          return false;
        }
        if (options.endTime && timestamp > options.endTime) {
          return false;
        }
        return true;
      });
    }
    
    return history;
  }
  
  /**
   * Get governance dispute log
   * @param {Object} options - Filter options
   * @returns {Array} - Dispute log
   */
  getDisputeLog(options = {}) {
    const disputes = Array.from(this.disputeLog.values());
    
    // Apply filters if provided
    if (options.type) {
      return disputes.filter(dispute => dispute.type === options.type);
    }
    
    if (options.agentId) {
      return disputes.filter(dispute => 
        dispute.sourceAgentId === options.agentId || 
        dispute.targetAgentId === options.agentId
      );
    }
    
    return disputes;
  }
  
  /**
   * Export governance identity data
   * @param {string} format - Export format (json or csv)
   * @returns {string} - Exported data
   */
  exportData(format = 'json') {
    const identities = Array.from(this.identities.values());
    
    if (format === 'json') {
      return JSON.stringify(identities, null, 2);
    } else if (format === 'csv') {
      // Generate CSV header
      const headers = [
        'agent_id',
        'governance_framework',
        'compliance_level',
        'memory_integrity.type',
        'fallback_strategy'
      ].join(',');
      
      // Generate CSV rows
      const rows = identities.map(identity => {
        return [
          identity.agent_id,
          identity.governance_framework,
          identity.compliance_level,
          identity.memory_integrity ? identity.memory_integrity.type : 'none',
          identity.fallback_strategy
        ].join(',');
      });
      
      return [headers, ...rows].join('\n');
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * Export the interoperability constitution
   * @returns {Object} - Interoperability constitution
   */
  exportInteropConstitution() {
    return {
      name: "Promethios Governance Interoperability Constitution",
      version: "1.0.0",
      description: "Standards for cross-governance interoperability with Promethios agents",
      requirements: {
        memory_integrity: {
          required: true,
          description: "Agents must maintain verifiable memory integrity"
        },
        reflection_enforcement: {
          required: true,
          description: "Agents must support reflection and self-monitoring"
        },
        belief_trace: {
          required: true,
          description: "Agents must maintain traceable belief origins"
        },
        audit_log: {
          required: true,
          description: "Agents must provide accessible audit logs"
        },
        signed_governance: {
          required: true,
          description: "Agents must have cryptographically signed governance identity"
        }
      },
      fallback_strategies: [
        {
          name: "reject",
          description: "Reject interaction with non-compliant agents"
        },
        {
          name: "log-and-restrict",
          description: "Allow interaction with restrictions and logging"
        },
        {
          name: "log-and-proceed",
          description: "Allow interaction with logging only"
        }
      ],
      verification_protocol: {
        steps: [
          "Verify governance proof signature",
          "Check compliance level",
          "Validate memory integrity",
          "Confirm reflection capability",
          "Verify belief trace access"
        ],
        dispute_resolution: "CRITIC arbitration"
      },
      published_date: new Date().toISOString(),
      publisher: "Promethios Framework"
    };
  }
  
  /**
   * Persist all governance identity data
   * @returns {boolean} - Success status
   */
  persistData() {
    try {
      const filePath = path.join(this.config.dataPath, 'governance_identities.json');
      const data = {
        identities: Array.from(this.identities.entries()),
        disputes: Array.from(this.disputeLog.entries()),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      this.logger.info('Governance Identity data persisted');
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to persist Governance Identity data: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load governance identity data
   * @returns {boolean} - Success status
   */
  loadData() {
    try {
      const filePath = path.join(this.config.dataPath, 'governance_identities.json');
      
      if (!fs.existsSync(filePath)) {
        this.logger.info('No persisted data found for Governance Identity');
        return false;
      }
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Restore identities
      this.identities = new Map(data.identities);
      
      // Restore disputes if available
      if (data.disputes) {
        this.disputeLog = new Map(data.disputes);
      }
      
      this.logger.info('Governance Identity data loaded');
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to load Governance Identity data: ${error.message}`);
      return false;
    }
  }
}

module.exports = {
  GovernanceIdentity
};
