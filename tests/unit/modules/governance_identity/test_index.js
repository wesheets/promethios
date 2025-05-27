/**
 * Unit tests for the Governance Identity module
 * 
 * @module tests/unit/modules/governance_identity/test_index
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const { GovernanceIdentity } = require('../../../../src/modules/governance_identity/index');

describe('GovernanceIdentity', () => {
  let governanceIdentity;
  let mockLogger;
  let mockHooks;
  let fsExistsSyncStub;
  let fsMkdirSyncStub;
  let fsWriteFileSyncStub;
  let fsReadFileSyncStub;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      debug: sinon.spy()
    };
    
    // Create mock hooks manager
    mockHooks = {
      register: sinon.spy(),
      trigger: sinon.spy()
    };
    
    // Stub fs methods
    fsExistsSyncStub = sinon.stub(fs, 'existsSync');
    fsExistsSyncStub.returns(true);
    fsMkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    fsWriteFileSyncStub = sinon.stub(fs, 'writeFileSync');
    fsReadFileSyncStub = sinon.stub(fs, 'readFileSync');
    
    // Create GovernanceIdentity instance
    governanceIdentity = new GovernanceIdentity({
      logger: mockLogger,
      hooks: mockHooks,
      config: {
        dataPath: 'test/data/path',
        enforceTrustRequirements: true
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default config if not provided', () => {
      const gi = new GovernanceIdentity({ logger: mockLogger });
      expect(gi.config).to.be.an('object');
      expect(gi.config.dataPath).to.be.a('string');
      expect(gi.config.enforceTrustRequirements).to.be.a('boolean');
    });
    
    it('should create data directory if it does not exist', () => {
      // Reset the stub to return false for this specific test
      fsExistsSyncStub.restore();
      fsExistsSyncStub = sinon.stub(fs, 'existsSync').returns(false);
      
      const gi = new GovernanceIdentity({
        logger: mockLogger,
        config: { dataPath: 'test/data/path' }
      });
      
      expect(fsExistsSyncStub.calledOnce).to.be.true;
      expect(fsMkdirSyncStub.calledOnce).to.be.true;
      expect(fsMkdirSyncStub.calledWith('test/data/path', { recursive: true })).to.be.true;
    });
    
    it('should handle errors when creating data directory', () => {
      fsExistsSyncStub.returns(false);
      fsMkdirSyncStub.throws(new Error('Directory creation failed'));
      
      const gi = new GovernanceIdentity({
        logger: mockLogger,
        config: { dataPath: 'test/data/path' }
      });
      
      expect(mockLogger.error.calledOnce).to.be.true;
    });
    
    it('should register hooks if hooks manager is provided', () => {
      expect(mockHooks.register.called).to.be.true;
      expect(mockHooks.register.calledWith('beforeAgentExecution')).to.be.true;
      expect(mockHooks.register.calledWith('beforeAgentInteraction')).to.be.true;
      expect(mockHooks.register.calledWith('afterAgentInteraction')).to.be.true;
    });
  });
  
  describe('tagAgent', () => {
    it('should tag an agent with governance identity metadata', () => {
      const agent = {
        id: 'test-agent-1',
        contract: JSON.stringify({ id: 'test-agent-1', capabilities: ['memory_integrity', 'reflection'] })
      };
      
      const taggedAgent = governanceIdentity.tagAgent(agent);
      
      expect(taggedAgent).to.equal(agent);
      expect(taggedAgent.governanceIdentity).to.be.an('object');
      expect(taggedAgent.governanceIdentity.agent_id).to.equal('test-agent-1');
      expect(taggedAgent.governanceIdentity.governance_framework).to.equal('promethios');
      expect(taggedAgent.governanceIdentity.constitution_hash).to.be.a('string');
      expect(taggedAgent.governanceIdentity.compliance_level).to.be.a('string');
      expect(taggedAgent.governanceIdentity.memory_integrity).to.be.an('object');
      expect(taggedAgent.governanceIdentity.trust_requirements).to.be.an('object');
      expect(taggedAgent.governanceIdentity.fallback_strategy).to.be.a('string');
      expect(taggedAgent.governanceIdentity.confidence_modifiers).to.be.an('object');
      expect(taggedAgent.governanceIdentity.audit_surface).to.be.a('string');
      expect(taggedAgent.governanceIdentity.refusal_policy).to.be.an('object');
      expect(taggedAgent.governanceIdentity.interoperability_version).to.be.a('string');
      
      // Verify it's stored in the map
      expect(governanceIdentity.identities.has('test-agent-1')).to.be.true;
      expect(governanceIdentity.identities.get('test-agent-1')).to.equal(taggedAgent.governanceIdentity);
    });
    
    it('should not re-tag an agent that already has governance identity', () => {
      const agent = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios'
        }
      };
      
      const taggedAgent = governanceIdentity.tagAgent(agent);
      
      expect(taggedAgent).to.equal(agent);
      expect(taggedAgent.governanceIdentity).to.equal(agent.governanceIdentity);
      expect(mockHooks.trigger.called).to.be.false;
    });
    
    it('should handle undefined agent', () => {
      const taggedAgent = governanceIdentity.tagAgent(undefined);
      
      expect(taggedAgent).to.be.null;
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
    
    it('should trigger hook after tagging agent', () => {
      const agent = {
        id: 'test-agent-1',
        contract: JSON.stringify({ id: 'test-agent-1' })
      };
      
      const taggedAgent = governanceIdentity.tagAgent(agent);
      
      expect(mockHooks.trigger.called).to.be.true;
      expect(mockHooks.trigger.firstCall.args[0]).to.equal('agentTagged');
    });
  });
  
  describe('generateConstitutionHash', () => {
    it('should generate a constitution hash for an agent', () => {
      const agent = {
        id: 'test-agent-1',
        contract: JSON.stringify({ id: 'test-agent-1', capabilities: ['memory_integrity'] })
      };
      
      const hash = governanceIdentity.generateConstitutionHash(agent);
      
      expect(hash).to.be.a('string');
      expect(hash).to.match(/^sha256:[a-f0-9]{64}$/);
    });
    
    it('should use existing constitution hash if available', () => {
      const agent = {
        id: 'test-agent-1',
        constitutionHash: 'sha256:1234567890abcdef'
      };
      
      const hash = governanceIdentity.generateConstitutionHash(agent);
      
      expect(hash).to.equal('sha256:1234567890abcdef');
    });
  });
  
  describe('determineComplianceLevel', () => {
    it('should determine strict compliance level for agents with all capabilities', () => {
      const agent = {
        id: 'test-agent-1',
        memoryIntegrity: true,
        reflection: true,
        beliefTrace: true
      };
      
      const level = governanceIdentity.determineComplianceLevel(agent);
      
      expect(level).to.equal('strict');
    });
    
    it('should determine standard compliance level for agents with some capabilities', () => {
      const agent = {
        id: 'test-agent-1',
        memoryIntegrity: true,
        reflection: true
      };
      
      const level = governanceIdentity.determineComplianceLevel(agent);
      
      expect(level).to.equal('standard');
    });
    
    it('should determine minimal compliance level for agents with few capabilities', () => {
      const agent = {
        id: 'test-agent-1'
      };
      
      const level = governanceIdentity.determineComplianceLevel(agent);
      
      expect(level).to.equal('minimal');
    });
    
    it('should use explicit compliance level if available', () => {
      const agent = {
        id: 'test-agent-1',
        complianceLevel: 'custom'
      };
      
      const level = governanceIdentity.determineComplianceLevel(agent);
      
      expect(level).to.equal('custom');
    });
  });
  
  describe('getMemoryIntegrityInfo', () => {
    it('should get memory integrity info for an agent', () => {
      const agent = {
        id: 'test-agent-1',
        merkleMemory: true
      };
      
      const info = governanceIdentity.getMemoryIntegrityInfo(agent);
      
      expect(info).to.be.an('object');
      expect(info.type).to.equal('merkle_v3');
      expect(info.verification_endpoint).to.be.a('string');
      expect(info.last_verified).to.be.a('string');
    });
    
    it('should use existing memory integrity info if available', () => {
      const agent = {
        id: 'test-agent-1',
        memoryIntegrity: {
          type: 'hash_chain',
          verification_endpoint: '/custom/endpoint'
        }
      };
      
      const info = governanceIdentity.getMemoryIntegrityInfo(agent);
      
      expect(info).to.equal(agent.memoryIntegrity);
    });
  });
  
  describe('getAuditSurfaceUrl', () => {
    it('should get audit surface URL for an agent', () => {
      const agent = {
        id: 'test-agent-1'
      };
      
      const url = governanceIdentity.getAuditSurfaceUrl(agent);
      
      expect(url).to.be.a('string');
      expect(url).to.include('test-agent-1');
    });
    
    it('should use existing audit surface URL if available', () => {
      const agent = {
        id: 'test-agent-1',
        auditSurface: 'https://custom.audit.url'
      };
      
      const url = governanceIdentity.getAuditSurfaceUrl(agent);
      
      expect(url).to.equal('https://custom.audit.url');
    });
  });
  
  describe('verifyGovernanceCompatibility', () => {
    it('should verify compatibility between two Promethios agents', () => {
      const sourceAgent = {
        id: 'source-agent',
        governanceIdentity: {
          agent_id: 'source-agent',
          governance_framework: 'promethios',
          compliance_level: 'strict',
          memory_integrity: { type: 'merkle_v3' },
          trust_requirements: {
            memory_integrity: true,
            reflection_enforced: true,
            belief_trace: true,
            minimum_compliance_level: 'standard'
          },
          confidence_modifiers: {
            unknown_governance: -0.3,
            missing_reflection: -0.5,
            missing_belief_trace: -0.4,
            missing_memory_integrity: -0.6
          },
          fallback_strategy: 'log-and-restrict',
          governance_proof: {
            signed_by: 'promethios',
            signature: 'ecdsa256:1234567890abcdef',
            timestamp: new Date().toISOString(),
            valid_until: new Date(Date.now() + 86400000).toISOString()
          }
        }
      };
      
      const targetAgent = {
        id: 'target-agent',
        governanceIdentity: {
          agent_id: 'target-agent',
          governance_framework: 'promethios',
          compliance_level: 'standard',
          memory_integrity: { type: 'merkle_v3' },
          trust_requirements: {
            memory_integrity: true,
            reflection_enforced: true,
            belief_trace: false,
            minimum_compliance_level: 'minimal'
          },
          confidence_modifiers: {
            unknown_governance: -0.2,
            missing_reflection: -0.4,
            missing_belief_trace: -0.3,
            missing_memory_integrity: -0.5
          },
          fallback_strategy: 'log-and-proceed',
          governance_proof: {
            signed_by: 'promethios',
            signature: 'ecdsa256:1234567890abcdef',
            timestamp: new Date().toISOString(),
            valid_until: new Date(Date.now() + 86400000).toISOString()
          }
        }
      };
      
      const result = governanceIdentity.verifyGovernanceCompatibility(sourceAgent, targetAgent);
      
      expect(result).to.be.an('object');
      expect(result.compatible).to.be.true;
      expect(result.confidenceModifiers).to.be.an('object');
      expect(result.interactionPolicy).to.be.an('object');
      expect(result.interactionPolicy.action).to.equal('proceed');
      expect(result.verificationId).to.be.a('string');
      
      // Verify interaction is logged
      expect(governanceIdentity.interactionHistory.size).to.equal(1);
    });
    
    it('should tag external agent without governance identity', () => {
      const sourceAgent = {
        id: 'source-agent',
        governanceIdentity: {
          agent_id: 'source-agent',
          governance_framework: 'promethios',
          compliance_level: 'strict',
          memory_integrity: { type: 'merkle_v3' },
          trust_requirements: {
            memory_integrity: true,
            reflection_enforced: true,
            belief_trace: true,
            minimum_compliance_level: 'standard'
          },
          confidence_modifiers: {
            unknown_governance: -0.3,
            missing_reflection: -0.5,
            missing_belief_trace: -0.4,
            missing_memory_integrity: -0.6
          },
          fallback_strategy: 'log-and-restrict',
          governance_proof: {
            signed_by: 'promethios',
            signature: 'ecdsa256:1234567890abcdef',
            timestamp: new Date().toISOString(),
            valid_until: new Date(Date.now() + 86400000).toISOString()
          }
        }
      };
      
      const targetAgent = {
        id: 'external-agent'
      };
      
      const result = governanceIdentity.verifyGovernanceCompatibility(sourceAgent, targetAgent);
      
      expect(result).to.be.an('object');
      expect(targetAgent.governanceIdentity).to.be.an('object');
      expect(targetAgent.governanceIdentity.governance_framework).to.equal('external');
      
      // External agent should fail strict requirements
      expect(result.compatible).to.be.false;
      expect(result.interactionPolicy.action).to.equal('restrict');
    });
    
    it('should handle undefined agents', () => {
      const result = governanceIdentity.verifyGovernanceCompatibility(undefined, undefined);
      
      expect(result).to.be.an('object');
      expect(result.compatible).to.be.false;
      expect(result.reason).to.equal('Missing agent(s)');
    });
    
    it('should trigger hook after verification', () => {
      const sourceAgent = {
        id: 'source-agent',
        governanceIdentity: {
          agent_id: 'source-agent',
          governance_framework: 'promethios',
          compliance_level: 'standard',
          memory_integrity: { type: 'merkle_v3' },
          trust_requirements: {
            memory_integrity: false,
            reflection_enforced: false,
            belief_trace: false,
            minimum_compliance_level: 'minimal'
          },
          fallback_strategy: 'log-and-proceed',
          governance_proof: {
            signed_by: 'promethios',
            signature: 'ecdsa256:1234567890abcdef',
            timestamp: new Date().toISOString(),
            valid_until: new Date(Date.now() + 86400000).toISOString()
          }
        }
      };
      
      const targetAgent = {
        id: 'target-agent',
        governanceIdentity: {
          agent_id: 'target-agent',
          governance_framework: 'promethios',
          compliance_level: 'minimal',
          memory_integrity: { type: 'none' },
          trust_requirements: {
            memory_integrity: false,
            reflection_enforced: false,
            belief_trace: false,
            minimum_compliance_level: 'minimal'
          },
          fallback_strategy: 'log-and-proceed',
          governance_proof: {
            signed_by: 'promethios',
            signature: 'ecdsa256:1234567890abcdef',
            timestamp: new Date().toISOString(),
            valid_until: new Date(Date.now() + 86400000).toISOString()
          }
        }
      };
      
      const result = governanceIdentity.verifyGovernanceCompatibility(sourceAgent, targetAgent);
      
      expect(mockHooks.trigger.called).to.be.true;
      expect(mockHooks.trigger.calledWith('governanceVerified')).to.be.true;
    });
  });
  
  describe('tagExternalAgent', () => {
    it('should tag an external agent with governance identity metadata', () => {
      const agent = {
        id: 'external-agent-1'
      };
      
      const taggedAgent = governanceIdentity.tagExternalAgent(agent);
      
      expect(taggedAgent).to.equal(agent);
      expect(taggedAgent.governanceIdentity).to.be.an('object');
      expect(taggedAgent.governanceIdentity.agent_id).to.equal('external-agent-1');
      expect(taggedAgent.governanceIdentity.governance_framework).to.equal('external');
      expect(taggedAgent.governanceIdentity.compliance_level).to.equal('minimal');
      expect(taggedAgent.governanceIdentity.memory_integrity.type).to.equal('none');
      
      // Verify it's stored in the map
      expect(governanceIdentity.identities.has('external-agent-1')).to.be.true;
      expect(governanceIdentity.identities.get('external-agent-1')).to.equal(taggedAgent.governanceIdentity);
      
      expect(mockLogger.info.called).to.be.true;
    });
    
    it('should handle undefined agent', () => {
      const taggedAgent = governanceIdentity.tagExternalAgent(undefined);
      
      expect(taggedAgent).to.be.null;
      expect(mockLogger.warn.called).to.be.true;
    });
  });
  
  describe('checkTrustRequirements', () => {
    it('should check trust requirements between agents', () => {
      const sourceIdentity = {
        trust_requirements: {
          memory_integrity: true,
          reflection_enforced: true,
          belief_trace: true,
          minimum_compliance_level: 'standard'
        }
      };
      
      const targetIdentity = {
        governance_framework: 'promethios',
        compliance_level: 'strict',
        memory_integrity: { type: 'merkle_v3' }
      };
      
      const result = governanceIdentity.checkTrustRequirements(sourceIdentity, targetIdentity);
      
      expect(result).to.be.an('object');
      expect(result.compatible).to.be.true;
    });
    
    it('should fail when memory integrity is required but not provided', () => {
      const sourceIdentity = {
        trust_requirements: {
          memory_integrity: true,
          reflection_enforced: false,
          belief_trace: false,
          minimum_compliance_level: 'minimal'
        }
      };
      
      const targetIdentity = {
        governance_framework: 'external',
        compliance_level: 'minimal',
        memory_integrity: { type: 'none' }
      };
      
      const result = governanceIdentity.checkTrustRequirements(sourceIdentity, targetIdentity);
      
      expect(result).to.be.an('object');
      expect(result.compatible).to.be.false;
      expect(result.reason).to.include('Memory integrity');
    });
    
    it('should fail when reflection enforcement is required but not guaranteed', () => {
      const sourceIdentity = {
        trust_requirements: {
          memory_integrity: false,
          reflection_enforced: true,
          belief_trace: false,
          minimum_compliance_level: 'minimal'
        }
      };
      
      const targetIdentity = {
        governance_framework: 'external',
        compliance_level: 'minimal',
        memory_integrity: { type: 'merkle_v3' }
      };
      
      const result = governanceIdentity.checkTrustRequirements(sourceIdentity, targetIdentity);
      
      expect(result).to.be.an('object');
      expect(result.compatible).to.be.false;
      expect(result.reason).to.include('Reflection');
    });
    
    it('should fail when belief trace is required but not guaranteed', () => {
      const sourceIdentity = {
        trust_requirements: {
          memory_integrity: false,
          reflection_enforced: false,
          belief_trace: true,
          minimum_compliance_level: 'minimal'
        }
      };
      
      const targetIdentity = {
        governance_framework: 'external',
        compliance_level: 'minimal',
        memory_integrity: { type: 'merkle_v3' }
      };
      
      const result = governanceIdentity.checkTrustRequirements(sourceIdentity, targetIdentity);
      
      expect(result).to.be.an('object');
      expect(result.compatible).to.be.false;
      expect(result.reason).to.include('Belief trace');
    });
    
    it('should fail when compliance level is insufficient', () => {
      const sourceIdentity = {
        trust_requirements: {
          memory_integrity: false,
          reflection_enforced: false,
          belief_trace: false,
          minimum_compliance_level: 'strict'
        }
      };
      
      const targetIdentity = {
        governance_framework: 'promethios',
        compliance_level: 'standard',
        memory_integrity: { type: 'merkle_v3' }
      };
      
      const result = governanceIdentity.checkTrustRequirements(sourceIdentity, targetIdentity);
      
      expect(result).to.be.an('object');
      expect(result.compatible).to.be.false;
      expect(result.reason).to.include('Compliance level');
    });
    
    it('should return compatible if trust requirements not enforced', () => {
      // Temporarily disable trust requirements enforcement
      const originalConfig = governanceIdentity.config.enforceTrustRequirements;
      governanceIdentity.config.enforceTrustRequirements = false;
      
      const sourceIdentity = {
        trust_requirements: {
          memory_integrity: true,
          reflection_enforced: true,
          belief_trace: true,
          minimum_compliance_level: 'strict'
        }
      };
      
      const targetIdentity = {
        governance_framework: 'external',
        compliance_level: 'minimal',
        memory_integrity: { type: 'none' }
      };
      
      const result = governanceIdentity.checkTrustRequirements(sourceIdentity, targetIdentity);
      
      expect(result).to.be.an('object');
      expect(result.compatible).to.be.true;
      
      // Restore original config
      governanceIdentity.config.enforceTrustRequirements = originalConfig;
    });
  });
  
  describe('calculateConfidenceModifiers', () => {
    it('should calculate confidence modifiers based on governance identity', () => {
      const sourceIdentity = {
        confidence_modifiers: {
          unknown_governance: -0.3,
          missing_reflection: -0.5,
          missing_belief_trace: -0.4,
          missing_memory_integrity: -0.6
        }
      };
      
      const targetIdentity = {
        governance_framework: 'external',
        memory_integrity: { type: 'none' }
      };
      
      const modifiers = governanceIdentity.calculateConfidenceModifiers(sourceIdentity, targetIdentity);
      
      expect(modifiers).to.be.an('object');
      expect(modifiers.total).to.be.a('number');
      expect(modifiers.total).to.be.below(0);
      expect(modifiers.factors).to.be.an('object');
      expect(Object.keys(modifiers.factors).length).to.be.above(0);
    });
    
    it('should not apply modifiers for Promethios agents with memory integrity', () => {
      const sourceIdentity = {
        confidence_modifiers: {
          unknown_governance: -0.3,
          missing_reflection: -0.5,
          missing_belief_trace: -0.4,
          missing_memory_integrity: -0.6
        }
      };
      
      const targetIdentity = {
        governance_framework: 'promethios',
        memory_integrity: { type: 'merkle_v3' }
      };
      
      const modifiers = governanceIdentity.calculateConfidenceModifiers(sourceIdentity, targetIdentity);
      
      expect(modifiers).to.be.an('object');
      expect(modifiers.total).to.equal(0);
      expect(modifiers.factors).to.be.an('object');
      expect(Object.keys(modifiers.factors).length).to.equal(0);
    });
  });
  
  describe('determineInteractionPolicy', () => {
    it('should determine proceed policy for compatible agents', () => {
      const sourceIdentity = {
        fallback_strategy: 'log-and-restrict'
      };
      
      const targetIdentity = {
        governance_framework: 'promethios'
      };
      
      const trustResult = {
        compatible: true,
        reason: 'All trust requirements met'
      };
      
      const policy = governanceIdentity.determineInteractionPolicy(sourceIdentity, targetIdentity, trustResult);
      
      expect(policy).to.be.an('object');
      expect(policy.action).to.equal('proceed');
      expect(policy.restrictions).to.be.an('array');
      expect(policy.restrictions.length).to.equal(0);
    });
    
    it('should determine reject policy for incompatible agents with reject strategy', () => {
      const sourceIdentity = {
        fallback_strategy: 'reject'
      };
      
      const targetIdentity = {
        governance_framework: 'external'
      };
      
      const trustResult = {
        compatible: false,
        reason: 'Memory integrity required but not provided'
      };
      
      const policy = governanceIdentity.determineInteractionPolicy(sourceIdentity, targetIdentity, trustResult);
      
      expect(policy).to.be.an('object');
      expect(policy.action).to.equal('reject');
      expect(policy.explanation).to.include('Memory integrity');
    });
    
    it('should determine restrict policy for incompatible agents with restrict strategy', () => {
      const sourceIdentity = {
        fallback_strategy: 'log-and-restrict'
      };
      
      const targetIdentity = {
        governance_framework: 'external'
      };
      
      const trustResult = {
        compatible: false,
        reason: 'Reflection enforcement required but not guaranteed'
      };
      
      const policy = governanceIdentity.determineInteractionPolicy(sourceIdentity, targetIdentity, trustResult);
      
      expect(policy).to.be.an('object');
      expect(policy.action).to.equal('restrict');
      expect(policy.restrictions).to.be.an('array');
      expect(policy.restrictions.length).to.be.at.least(1);
      expect(policy.explanation).to.include('Reflection');
    });
    
    it('should determine proceed policy for incompatible agents with proceed strategy', () => {
      const sourceIdentity = {
        fallback_strategy: 'log-and-proceed'
      };
      
      const targetIdentity = {
        governance_framework: 'external'
      };
      
      const trustResult = {
        compatible: false,
        reason: 'Belief trace required but not guaranteed'
      };
      
      const policy = governanceIdentity.determineInteractionPolicy(sourceIdentity, targetIdentity, trustResult);
      
      expect(policy).to.be.an('object');
      expect(policy.action).to.equal('proceed');
      expect(policy.explanation).to.include('Belief trace');
    });
  });
  
  describe('logInteractionVerification', () => {
    it('should log interaction verification between agents', () => {
      const sourceAgentId = 'source-agent';
      const targetAgentId = 'target-agent';
      const verificationResult = {
        compatible: true,
        reason: 'All trust requirements met',
        confidenceModifiers: { total: 0, factors: {} },
        interactionPolicy: { action: 'proceed', restrictions: [] }
      };
      
      governanceIdentity.logInteractionVerification(sourceAgentId, targetAgentId, verificationResult);
      
      expect(governanceIdentity.interactionHistory.size).to.equal(1);
      
      // Get the first entry from the map
      const entry = Array.from(governanceIdentity.interactionHistory.values())[0];
      
      expect(entry).to.be.an('object');
      expect(entry.sourceAgentId).to.equal(sourceAgentId);
      expect(entry.targetAgentId).to.equal(targetAgentId);
      expect(entry.verificationResult).to.equal(verificationResult);
    });
  });
  
  describe('logInteraction', () => {
    it('should log interaction between agents', () => {
      const sourceAgent = { id: 'source-agent' };
      const targetAgent = { id: 'target-agent' };
      const context = { operation: 'test' };
      const result = { success: true };
      
      governanceIdentity.logInteraction(sourceAgent, targetAgent, context, result);
      
      expect(governanceIdentity.interactionHistory.size).to.equal(1);
      
      // Get the first entry from the map
      const entry = Array.from(governanceIdentity.interactionHistory.values())[0];
      
      expect(entry).to.be.an('object');
      expect(entry.sourceAgentId).to.equal(sourceAgent.id);
      expect(entry.targetAgentId).to.equal(targetAgent.id);
      expect(entry.context).to.equal(context);
      expect(entry.result).to.equal(result);
    });
    
    it('should handle undefined agents', () => {
      governanceIdentity.logInteraction(undefined, undefined);
      
      expect(governanceIdentity.interactionHistory.size).to.equal(0);
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
  });
  
  describe('persistInteractionRecord', () => {
    it('should persist interaction record to disk', () => {
      const interactionRecord = {
        id: 'test-interaction',
        sourceAgentId: 'source-agent',
        targetAgentId: 'target-agent',
        timestamp: new Date().toISOString()
      };
      
      governanceIdentity.persistInteractionRecord(interactionRecord);
      
      expect(fsWriteFileSyncStub.calledOnce).to.be.true;
      expect(fsWriteFileSyncStub.firstCall.args[0]).to.include('test-interaction');
      expect(fsWriteFileSyncStub.firstCall.args[1]).to.be.a('string');
    });
    
    it('should handle errors during persistence', () => {
      fsWriteFileSyncStub.throws(new Error('Write failed'));
      
      const interactionRecord = {
        id: 'test-interaction',
        sourceAgentId: 'source-agent',
        targetAgentId: 'target-agent',
        timestamp: new Date().toISOString()
      };
      
      governanceIdentity.persistInteractionRecord(interactionRecord);
      
      expect(mockLogger.error.calledOnce).to.be.true;
    });
  });
  
  describe('getGovernanceIdentity', () => {
    it('should get governance identity for an agent', () => {
      const agentId = 'test-agent';
      const identity = { agent_id: agentId, governance_framework: 'promethios' };
      
      governanceIdentity.identities.set(agentId, identity);
      
      const result = governanceIdentity.getGovernanceIdentity(agentId);
      
      expect(result).to.equal(identity);
    });
    
    it('should return undefined for unknown agent', () => {
      const result = governanceIdentity.getGovernanceIdentity('unknown-agent');
      
      expect(result).to.be.undefined;
    });
  });
  
  describe('getInteractionHistory', () => {
    it('should get all interaction history for an agent', () => {
      const agentId = 'test-agent';
      
      // Add some interaction records
      governanceIdentity.interactionHistory.set('interaction1', {
        sourceAgentId: agentId,
        targetAgentId: 'other-agent',
        timestamp: new Date().toISOString()
      });
      
      governanceIdentity.interactionHistory.set('interaction2', {
        sourceAgentId: 'other-agent',
        targetAgentId: agentId,
        timestamp: new Date().toISOString()
      });
      
      governanceIdentity.interactionHistory.set('interaction3', {
        sourceAgentId: 'agent1',
        targetAgentId: 'agent2',
        timestamp: new Date().toISOString()
      });
      
      const history = governanceIdentity.getInteractionHistory(agentId);
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(2);
      expect(history[0].sourceAgentId === agentId || history[0].targetAgentId === agentId).to.be.true;
      expect(history[1].sourceAgentId === agentId || history[1].targetAgentId === agentId).to.be.true;
    });
    
    it('should filter interaction history by time range', () => {
      const agentId = 'test-agent';
      const now = Date.now();
      
      // Add some interaction records with different timestamps
      governanceIdentity.interactionHistory.set('interaction1', {
        sourceAgentId: agentId,
        targetAgentId: 'other-agent',
        timestamp: new Date(now - 3600000).toISOString() // 1 hour ago
      });
      
      governanceIdentity.interactionHistory.set('interaction2', {
        sourceAgentId: 'other-agent',
        targetAgentId: agentId,
        timestamp: new Date(now - 7200000).toISOString() // 2 hours ago
      });
      
      const history = governanceIdentity.getInteractionHistory(agentId, {
        startTime: now - 5400000, // 1.5 hours ago
        endTime: now
      });
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(1);
      expect(history[0].sourceAgentId).to.equal(agentId);
    });
    
    it('should return empty array for unknown agent', () => {
      const history = governanceIdentity.getInteractionHistory('unknown-agent');
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(0);
    });
  });
  
  describe('exportData', () => {
    it('should export data as JSON', () => {
      // Add some identities
      governanceIdentity.identities.set('agent1', {
        agent_id: 'agent1',
        governance_framework: 'promethios',
        compliance_level: 'strict'
      });
      
      governanceIdentity.identities.set('agent2', {
        agent_id: 'agent2',
        governance_framework: 'external',
        compliance_level: 'minimal'
      });
      
      const json = governanceIdentity.exportData('json');
      
      expect(json).to.be.a('string');
      
      const parsed = JSON.parse(json);
      expect(parsed).to.be.an('array');
      expect(parsed.length).to.equal(2);
      expect(parsed[0].agent_id).to.be.a('string');
      expect(parsed[1].agent_id).to.be.a('string');
    });
    
    it('should export data as CSV', () => {
      // Add some identities
      governanceIdentity.identities.set('agent1', {
        agent_id: 'agent1',
        governance_framework: 'promethios',
        compliance_level: 'strict',
        memory_integrity: { type: 'merkle_v3' },
        fallback_strategy: 'log-and-restrict'
      });
      
      governanceIdentity.identities.set('agent2', {
        agent_id: 'agent2',
        governance_framework: 'external',
        compliance_level: 'minimal',
        memory_integrity: { type: 'none' },
        fallback_strategy: 'log-and-proceed'
      });
      
      const csv = governanceIdentity.exportData('csv');
      
      expect(csv).to.be.a('string');
      expect(csv.split('\n').length).to.equal(3); // Header + 2 rows
      expect(csv.split('\n')[0].split(',').length).to.be.at.least(5); // At least 5 columns
    });
    
    it('should throw error for unsupported format', () => {
      expect(() => governanceIdentity.exportData('xml')).to.throw();
    });
  });
  
  describe('persistData', () => {
    it('should persist all governance identity data', () => {
      // Add some identities and disputes
      governanceIdentity.identities.set('agent1', {
        agent_id: 'agent1',
        governance_framework: 'promethios'
      });
      
      governanceIdentity.disputeLog.set('dispute1', {
        id: 'dispute1',
        type: 'trust_requirements',
        sourceAgentId: 'agent1',
        targetAgentId: 'agent2'
      });
      
      const result = governanceIdentity.persistData();
      
      expect(result).to.be.true;
      expect(fsWriteFileSyncStub.calledOnce).to.be.true;
      expect(fsWriteFileSyncStub.firstCall.args[0]).to.include('governance_identities.json');
      
      // Verify the content
      const content = fsWriteFileSyncStub.firstCall.args[1];
      expect(content).to.be.a('string');
      
      const parsed = JSON.parse(content);
      expect(parsed).to.be.an('object');
      expect(parsed.identities).to.be.an('array');
      expect(parsed.disputes).to.be.an('array');
      expect(parsed.timestamp).to.be.a('string');
    });
    
    it('should handle errors during persistence', () => {
      fsWriteFileSyncStub.throws(new Error('Write failed'));
      
      const result = governanceIdentity.persistData();
      
      expect(result).to.be.false;
      expect(mockLogger.error.calledOnce).to.be.true;
    });
  });
  
  describe('loadData', () => {
    it('should load governance identity data', () => {
      // Prepare mock data
      const mockData = {
        identities: [
          ['agent1', { agent_id: 'agent1', governance_framework: 'promethios' }],
          ['agent2', { agent_id: 'agent2', governance_framework: 'external' }]
        ],
        disputes: [
          ['dispute1', { id: 'dispute1', type: 'trust_requirements' }]
        ],
        timestamp: new Date().toISOString()
      };
      
      // Ensure existsSync returns true for this test
      fsExistsSyncStub.returns(true);
      fsReadFileSyncStub.returns(JSON.stringify(mockData));
      
      const result = governanceIdentity.loadData();
      
      expect(result).to.be.true;
      expect(fsExistsSyncStub.called).to.be.true;
      expect(fsReadFileSyncStub.called).to.be.true;
    });
    
    it('should handle errors during loading', () => {
      fsReadFileSyncStub.throws(new Error('Read failed'));
      
      const result = governanceIdentity.loadData();
      
      expect(result).to.be.false;
      expect(mockLogger.error.calledOnce).to.be.true;
    });
    
    it('should handle missing data file', () => {
      fsExistsSyncStub.returns(false);
      
      const result = governanceIdentity.loadData();
      
      expect(result).to.be.false;
      expect(mockLogger.info.called).to.be.true;
      expect(fsReadFileSyncStub.called).to.be.false;
    });
  });
});
