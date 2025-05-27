/**
 * Unit tests for the Agent Contract Extension module
 * 
 * @module tests/unit/modules/governance_identity/test_agent_contract_extension
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const { AgentContractExtension } = require('../../../../src/modules/governance_identity/agent_contract_extension');

describe('AgentContractExtension', () => {
  let contractExtension;
  let mockLogger;
  let fsReadFileSyncStub;
  let fsWriteFileSyncStub;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      debug: sinon.spy()
    };
    
    // Stub fs methods
    fsReadFileSyncStub = sinon.stub(fs, 'readFileSync');
    fsWriteFileSyncStub = sinon.stub(fs, 'writeFileSync');
    
    // Create AgentContractExtension instance
    contractExtension = new AgentContractExtension({
      logger: mockLogger,
      config: {
        schemaPath: '../../schemas/governance'
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default config if not provided', () => {
      const extension = new AgentContractExtension({ logger: mockLogger });
      expect(extension.config).to.be.an('object');
      expect(extension.config.schemaPath).to.be.a('string');
    });
    
    it('should log initialization', () => {
      expect(mockLogger.info.calledOnce).to.be.true;
      expect(mockLogger.info.calledWith('Agent Contract Extension initialized')).to.be.true;
    });
  });
  
  describe('extendContract', () => {
    it('should extend an agent contract with governance identity metadata', () => {
      const contract = {
        id: 'test-agent-1',
        capabilities: ['memory_integrity', 'reflection']
      };
      
      const extendedContract = contractExtension.extendContract(contract);
      
      expect(extendedContract).to.include(contract);
      expect(extendedContract.governanceIdentity).to.be.an('object');
      expect(extendedContract.governanceIdentity.agent_id).to.equal('test-agent-1');
      expect(extendedContract.governanceIdentity.governance_framework).to.equal('promethios');
      expect(extendedContract.governanceIdentity.constitution_hash).to.be.a('string');
      expect(extendedContract.governanceIdentity.compliance_level).to.be.a('string');
      expect(extendedContract.governanceIdentity.memory_integrity).to.be.an('object');
      expect(extendedContract.governanceIdentity.trust_requirements).to.be.an('object');
      expect(extendedContract.governanceIdentity.fallback_strategy).to.be.a('string');
      expect(extendedContract.governanceIdentity.confidence_modifiers).to.be.an('object');
      expect(extendedContract.governanceIdentity.audit_surface).to.be.a('string');
      expect(extendedContract.governanceIdentity.refusal_policy).to.be.an('object');
      expect(extendedContract.governanceIdentity.interoperability_version).to.be.a('string');
      
      expect(extendedContract.interoperabilityProtocol).to.be.an('object');
      expect(extendedContract.interoperabilityProtocol.protocol_version).to.be.a('string');
      expect(extendedContract.interoperabilityProtocol.governance_negotiation_enabled).to.be.true;
      expect(extendedContract.interoperabilityProtocol.default_protocol).to.be.a('string');
      expect(extendedContract.interoperabilityProtocol.trust_verification_method).to.be.a('string');
      expect(extendedContract.interoperabilityProtocol.handshake_timeout_ms).to.be.a('number');
      expect(extendedContract.interoperabilityProtocol.required_metadata_fields).to.be.an('array');
      expect(extendedContract.interoperabilityProtocol.trust_decay_policy).to.be.an('object');
      expect(extendedContract.interoperabilityProtocol.interaction_logging).to.be.an('object');
      expect(extendedContract.interoperabilityProtocol.fallback_protocols).to.be.an('array');
      
      expect(mockLogger.info.calledWith(`Extended agent contract ${contract.id} with governance identity`)).to.be.true;
    });
    
    it('should not re-extend a contract that already has governance identity', () => {
      const contract = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios'
        }
      };
      
      const extendedContract = contractExtension.extendContract(contract);
      
      expect(extendedContract).to.equal(contract);
      expect(extendedContract.governanceIdentity).to.equal(contract.governanceIdentity);
    });
    
    it('should handle undefined contract', () => {
      const extendedContract = contractExtension.extendContract(undefined);
      
      expect(extendedContract).to.be.null;
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
    
    it('should use provided options to customize extension', () => {
      const contract = {
        id: 'test-agent-1'
      };
      
      const options = {
        governanceFramework: 'external',
        complianceLevel: 'custom',
        memoryIntegrityType: 'hash_chain',
        fallbackStrategy: 'reject',
        interoperabilityVersion: '2.0.0'
      };
      
      const extendedContract = contractExtension.extendContract(contract, options);
      
      expect(extendedContract.governanceIdentity.governance_framework).to.equal('external');
      expect(extendedContract.governanceIdentity.compliance_level).to.equal('custom');
      expect(extendedContract.governanceIdentity.memory_integrity.type).to.equal('hash_chain');
      expect(extendedContract.governanceIdentity.fallback_strategy).to.equal('reject');
      expect(extendedContract.governanceIdentity.interoperability_version).to.equal('2.0.0');
    });
  });
  
  describe('generateConstitutionHash', () => {
    it('should generate a constitution hash for a contract', () => {
      const contract = {
        id: 'test-agent-1',
        capabilities: ['memory_integrity', 'reflection']
      };
      
      const hash = contractExtension.generateConstitutionHash(contract);
      
      expect(hash).to.be.a('string');
      expect(hash).to.match(/^sha256:[a-f0-9]{64}$/);
    });
  });
  
  describe('determineComplianceLevel', () => {
    it('should determine strict compliance level for contracts with all capabilities', () => {
      const contract = {
        id: 'test-agent-1',
        capabilities: ['memory_integrity', 'reflection', 'belief_trace']
      };
      
      const level = contractExtension.determineComplianceLevel(contract);
      
      expect(level).to.equal('strict');
    });
    
    it('should determine standard compliance level for contracts with some capabilities', () => {
      const contract = {
        id: 'test-agent-1',
        capabilities: ['memory_integrity', 'reflection']
      };
      
      const level = contractExtension.determineComplianceLevel(contract);
      
      expect(level).to.equal('standard');
    });
    
    it('should determine minimal compliance level for contracts with few capabilities', () => {
      const contract = {
        id: 'test-agent-1',
        capabilities: []
      };
      
      const level = contractExtension.determineComplianceLevel(contract);
      
      expect(level).to.equal('minimal');
    });
    
    it('should use explicit compliance level if available', () => {
      const contract = {
        id: 'test-agent-1',
        complianceLevel: 'custom'
      };
      
      const level = contractExtension.determineComplianceLevel(contract);
      
      expect(level).to.equal('custom');
    });
    
    it('should check for capabilities in the capabilities array', () => {
      const contract = {
        id: 'test-agent-1',
        capabilities: ['memory_integrity', 'reflection', 'belief_trace']
      };
      
      const level = contractExtension.determineComplianceLevel(contract);
      
      expect(level).to.equal('strict');
    });
  });
  
  describe('validateContract', () => {
    let ajvCompileStub;
    let validateGovernanceIdentityStub;
    let validateInteroperabilityProtocolStub;
    
    beforeEach(() => {
      // Mock require for schemas
      const requireStub = sinon.stub(require('module'), '_load');
      requireStub.withArgs(sinon.match(/governance_identity\.schema\.v1\.json/)).returns({});
      requireStub.withArgs(sinon.match(/interoperability_protocol\.schema\.v1\.json/)).returns({});
      
      // Mock Ajv
      validateGovernanceIdentityStub = sinon.stub().returns(true);
      validateInteroperabilityProtocolStub = sinon.stub().returns(true);
      ajvCompileStub = sinon.stub().returns(validateGovernanceIdentityStub);
      ajvCompileStub.onSecondCall().returns(validateInteroperabilityProtocolStub);
      
      const ajvStub = sinon.stub();
      ajvStub.prototype.compile = ajvCompileStub;
      
      requireStub.withArgs('ajv').returns(ajvStub);
    });
    
    it('should validate a contract against governance identity schema', () => {
      const contract = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios'
        },
        interoperabilityProtocol: {
          protocol_version: '1.0.0'
        }
      };
      
      const result = contractExtension.validateContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(0);
    });
    
    it('should handle undefined contract', () => {
      const result = contractExtension.validateContract(undefined);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0]).to.equal('Contract is undefined');
    });
    
    it('should handle missing governanceIdentity', () => {
      const contract = {
        id: 'test-agent-1',
        interoperabilityProtocol: {
          protocol_version: '1.0.0'
        }
      };
      
      const result = contractExtension.validateContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0]).to.equal('Contract missing governanceIdentity');
    });
    
    it('should handle missing interoperabilityProtocol', () => {
      const contract = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios'
        }
      };
      
      const result = contractExtension.validateContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0]).to.equal('Contract missing interoperabilityProtocol');
    });
    
    it('should handle validation errors for governanceIdentity', () => {
      validateGovernanceIdentityStub.returns(false);
      validateGovernanceIdentityStub.errors = [
        { message: 'should have required property \'agent_id\'' }
      ];
      
      const contract = {
        id: 'test-agent-1',
        governanceIdentity: {
          governance_framework: 'promethios'
        },
        interoperabilityProtocol: {
          protocol_version: '1.0.0'
        }
      };
      
      const result = contractExtension.validateContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0]).to.include('governanceIdentity');
    });
    
    it('should handle validation errors for interoperabilityProtocol', () => {
      validateInteroperabilityProtocolStub.returns(false);
      validateInteroperabilityProtocolStub.errors = [
        { message: 'should have required property \'protocol_version\'' }
      ];
      
      const contract = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios'
        },
        interoperabilityProtocol: {}
      };
      
      const result = contractExtension.validateContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0]).to.include('interoperabilityProtocol');
    });
    
    it('should handle schema loading errors', () => {
      // Restore the original require
      require('module')._load.restore();
      
      // Mock require to throw an error
      const requireStub = sinon.stub(require('module'), '_load');
      requireStub.throws(new Error('Schema not found'));
      
      const contract = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios'
        },
        interoperabilityProtocol: {
          protocol_version: '1.0.0'
        }
      };
      
      const result = contractExtension.validateContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0]).to.include('Schema validation error');
      expect(mockLogger.error.calledOnce).to.be.true;
    });
  });
  
  describe('updateContractFile', () => {
    it('should update an existing agent contract file', () => {
      const contractPath = '/path/to/contract.json';
      const contract = {
        id: 'test-agent-1',
        capabilities: ['memory_integrity']
      };
      
      fsReadFileSyncStub.returns(JSON.stringify(contract));
      
      const result = contractExtension.updateContractFile(contractPath);
      
      expect(result).to.be.true;
      expect(fsReadFileSyncStub.calledOnce).to.be.true;
      expect(fsReadFileSyncStub.calledWith(contractPath, 'utf8')).to.be.true;
      expect(fsWriteFileSyncStub.calledOnce).to.be.true;
      expect(fsWriteFileSyncStub.calledWith(contractPath)).to.be.true;
      expect(mockLogger.info.calledWith(`Updated agent contract file: ${contractPath}`)).to.be.true;
    });
    
    it('should handle errors during file reading', () => {
      const contractPath = '/path/to/contract.json';
      
      fsReadFileSyncStub.throws(new Error('File not found'));
      
      const result = contractExtension.updateContractFile(contractPath);
      
      expect(result).to.be.false;
      expect(fsReadFileSyncStub.calledOnce).to.be.true;
      expect(fsWriteFileSyncStub.called).to.be.false;
      expect(mockLogger.error.calledOnce).to.be.true;
    });
    
    it('should handle errors during file writing', () => {
      const contractPath = '/path/to/contract.json';
      const contract = {
        id: 'test-agent-1',
        capabilities: ['memory_integrity']
      };
      
      fsReadFileSyncStub.returns(JSON.stringify(contract));
      fsWriteFileSyncStub.throws(new Error('Write failed'));
      
      const result = contractExtension.updateContractFile(contractPath);
      
      expect(result).to.be.false;
      expect(fsReadFileSyncStub.calledOnce).to.be.true;
      expect(fsWriteFileSyncStub.calledOnce).to.be.true;
      expect(mockLogger.error.calledOnce).to.be.true;
    });
    
    it('should use provided options when updating contract', () => {
      const contractPath = '/path/to/contract.json';
      const contract = {
        id: 'test-agent-1',
        capabilities: ['memory_integrity']
      };
      
      fsReadFileSyncStub.returns(JSON.stringify(contract));
      
      const options = {
        governanceFramework: 'external',
        complianceLevel: 'custom'
      };
      
      const result = contractExtension.updateContractFile(contractPath, options);
      
      expect(result).to.be.true;
      expect(fsWriteFileSyncStub.calledOnce).to.be.true;
      
      // Extract the written contract from the call arguments
      const writtenContract = JSON.parse(fsWriteFileSyncStub.firstCall.args[1]);
      expect(writtenContract.governanceIdentity.governance_framework).to.equal('external');
      expect(writtenContract.governanceIdentity.compliance_level).to.equal('custom');
    });
  });
});
