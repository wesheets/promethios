/**
 * Agent Contract Extension for Governance Identity
 * 
 * This module extends the agent contract to include governance identity and interoperability
 * protocol information, enabling trust negotiation between agents.
 * 
 * @module governance_identity/agent_contract_extension
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Extends agent contracts with governance identity metadata
 */
class AgentContractExtension {
  /**
   * Create a new AgentContractExtension instance
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration object
   */
  constructor({ logger, config = {} }) {
    this.logger = logger || console;
    this.config = {
      schemaPath: config.schemaPath || '../../schemas/governance',
      ...config
    };
    
    this.logger.info('Agent Contract Extension initialized');
  }
  
  /**
   * Extend an agent contract with governance identity metadata
   * @param {Object} contract - Agent contract to extend
   * @param {Object} options - Extension options
   * @returns {Object} - Extended agent contract
   */
  extendContract(contract, options = {}) {
    if (!contract) {
      this.logger.warn('Cannot extend undefined contract');
      return null;
    }
    
    // Check if contract already has governance identity
    if (contract.governanceIdentity) {
      return contract;
    }
    
    // Create governance identity extension
    const governanceExtension = {
      governanceIdentity: {
        agent_id: contract.id || options.agentId || uuidv4(),
        governance_framework: options.governanceFramework || 'promethios',
        constitution_hash: options.constitutionHash || this.generateConstitutionHash(contract),
        compliance_level: options.complianceLevel || this.determineComplianceLevel(contract),
        memory_integrity: {
          type: options.memoryIntegrityType || 'merkle_v3',
          verification_endpoint: options.verificationEndpoint || `/api/agents/${contract.id}/memory/verify`,
          last_verified: new Date().toISOString()
        },
        trust_requirements: {
          memory_integrity: options.requireMemoryIntegrity !== false,
          reflection_enforced: options.requireReflection !== false,
          belief_trace: options.requireBeliefTrace !== false,
          minimum_compliance_level: options.minimumComplianceLevel || 'standard'
        },
        fallback_strategy: options.fallbackStrategy || 'log-and-restrict',
        confidence_modifiers: {
          unknown_governance: options.unknownGovernanceModifier || -0.3,
          missing_reflection: options.missingReflectionModifier || -0.5,
          missing_belief_trace: options.missingBeliefTraceModifier || -0.4,
          missing_memory_integrity: options.missingMemoryIntegrityModifier || -0.6
        },
        audit_surface: options.auditSurface || `/api/agents/${contract.id}/audit`,
        refusal_policy: {
          explain_rejection: options.explainRejection !== false,
          log_rejection: options.logRejection !== false,
          retry_allowed: options.retryAllowed || false
        },
        interoperability_version: options.interoperabilityVersion || '1.0.0'
      },
      interoperabilityProtocol: {
        protocol_version: options.protocolVersion || '1.0.0',
        governance_negotiation_enabled: options.governanceNegotiationEnabled !== false,
        default_protocol: options.defaultProtocol || 'promethios_handshake_v1',
        trust_verification_method: options.trustVerificationMethod || 'merkle_proof',
        handshake_timeout_ms: options.handshakeTimeout || 2000,
        required_metadata_fields: options.requiredMetadataFields || [
          'agent_id',
          'governance_framework',
          'constitution_hash',
          'compliance_level'
        ],
        trust_decay_policy: {
          enabled: options.trustDecayEnabled !== false,
          decay_rate: options.trustDecayRate || 0.01,
          verification_renewal_period_hours: options.verificationRenewalPeriod || 24
        },
        interaction_logging: {
          enabled: options.interactionLoggingEnabled !== false,
          log_level: options.interactionLogLevel || 'standard',
          include_metadata: options.includeMetadata !== false,
          retention_period_days: options.retentionPeriod || 30
        },
        fallback_protocols: options.fallbackProtocols || ['minimal_verification']
      }
    };
    
    // Extend contract with governance identity
    const extendedContract = {
      ...contract,
      ...governanceExtension
    };
    
    this.logger.info(`Extended agent contract ${contract.id} with governance identity`);
    
    return extendedContract;
  }
  
  /**
   * Generate a constitution hash for an agent contract
   * @param {Object} contract - Agent contract to generate hash for
   * @returns {string} - Constitution hash
   */
  generateConstitutionHash(contract) {
    const crypto = require('crypto');
    const hashSource = JSON.stringify(contract);
    const hash = crypto.createHash('sha256').update(hashSource).digest('hex');
    
    return `sha256:${hash}`;
  }
  
  /**
   * Determine compliance level for an agent contract
   * @param {Object} contract - Agent contract to determine compliance level for
   * @returns {string} - Compliance level
   */
  determineComplianceLevel(contract) {
    // Check for explicit compliance level
    if (contract.complianceLevel) {
      return contract.complianceLevel;
    }
    
    // Check for memory integrity
    const hasMemoryIntegrity = contract.memoryIntegrity || 
                              (contract.capabilities && contract.capabilities.includes('memory_integrity'));
    
    // Check for reflection
    const hasReflection = contract.reflection || 
                         (contract.capabilities && contract.capabilities.includes('reflection'));
    
    // Check for belief trace
    const hasBeliefTrace = contract.beliefTrace || 
                          (contract.capabilities && contract.capabilities.includes('belief_trace'));
    
    // Determine compliance level based on capabilities
    if (hasMemoryIntegrity && hasReflection && hasBeliefTrace) {
      return 'strict';
    } else if ((hasMemoryIntegrity && hasReflection) || (hasMemoryIntegrity && hasBeliefTrace)) {
      return 'standard';
    } else {
      return 'minimal';
    }
  }
  
  /**
   * Validate an agent contract against governance identity schema
   * @param {Object} contract - Agent contract to validate
   * @returns {Object} - Validation result
   */
  validateContract(contract) {
    if (!contract) {
      return { valid: false, errors: ['Contract is undefined'] };
    }
    
    // Check for governance identity
    if (!contract.governanceIdentity) {
      return { valid: false, errors: ['Contract missing governanceIdentity'] };
    }
    
    // Check for interoperability protocol
    if (!contract.interoperabilityProtocol) {
      return { valid: false, errors: ['Contract missing interoperabilityProtocol'] };
    }
    
    // Load schemas
    try {
      const governanceIdentitySchema = require(path.join(this.config.schemaPath, 'governance_identity.schema.v1.json'));
      const interoperabilityProtocolSchema = require(path.join(this.config.schemaPath, 'interoperability_protocol.schema.v1.json'));
      
      // Validate against schemas
      const Ajv = require('ajv');
      const ajv = new Ajv();
      
      const validateGovernanceIdentity = ajv.compile(governanceIdentitySchema);
      const validateInteroperabilityProtocol = ajv.compile(interoperabilityProtocolSchema);
      
      const governanceIdentityValid = validateGovernanceIdentity(contract.governanceIdentity);
      const interoperabilityProtocolValid = validateInteroperabilityProtocol(contract.interoperabilityProtocol);
      
      if (!governanceIdentityValid) {
        return { 
          valid: false, 
          errors: validateGovernanceIdentity.errors.map(e => `governanceIdentity: ${e.message}`) 
        };
      }
      
      if (!interoperabilityProtocolValid) {
        return { 
          valid: false, 
          errors: validateInteroperabilityProtocol.errors.map(e => `interoperabilityProtocol: ${e.message}`) 
        };
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      this.logger.error(`Schema validation error: ${error.message}`);
      return { valid: false, errors: [`Schema validation error: ${error.message}`] };
    }
  }
  
  /**
   * Update an existing agent contract with governance identity metadata
   * @param {string} contractPath - Path to agent contract file
   * @param {Object} options - Extension options
   * @returns {boolean} - Success status
   */
  updateContractFile(contractPath, options = {}) {
    try {
      // Read contract file
      const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      
      // Extend contract
      const extendedContract = this.extendContract(contract, options);
      
      // Write updated contract
      fs.writeFileSync(contractPath, JSON.stringify(extendedContract, null, 2));
      
      this.logger.info(`Updated agent contract file: ${contractPath}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to update agent contract file: ${error.message}`);
      return false;
    }
  }
}

module.exports = {
  AgentContractExtension
};
