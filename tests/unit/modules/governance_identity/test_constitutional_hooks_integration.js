/**
 * Unit tests for the Constitutional Hooks Integration module
 * 
 * @module tests/unit/modules/governance_identity/test_constitutional_hooks_integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { ConstitutionalHooksIntegration } = require('../../../../src/modules/governance_identity/constitutional_hooks_integration');
const { GovernanceIdentity } = require('../../../../src/modules/governance_identity/index');

describe('ConstitutionalHooksIntegration', () => {
  let hooksIntegration;
  let mockLogger;
  let mockHooksManager;
  let mockGovernanceIdentity;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      debug: sinon.spy()
    };
    
    // Create mock hooks manager
    mockHooksManager = {
      register: sinon.spy(),
      trigger: sinon.spy()
    };
    
    // Create mock governance identity
    mockGovernanceIdentity = {
      tagAgent: sinon.stub().callsFake(agent => {
        if (!agent) return null;
        agent.governanceIdentity = agent.governanceIdentity || {
          agent_id: agent.id,
          governance_framework: 'promethios',
          compliance_level: 'standard',
          memory_integrity: { type: 'merkle_v3', last_verified: new Date().toISOString() }
        };
        return agent;
      }),
      verifyGovernanceCompatibility: sinon.stub().returns({
        compatible: true,
        reason: 'All trust requirements met',
        confidenceModifiers: { total: 0, factors: {} },
        interactionPolicy: { action: 'proceed', restrictions: [], explanation: 'Compatible governance frameworks' }
      }),
      logInteraction: sinon.spy()
    };
    
    // Create ConstitutionalHooksIntegration instance
    hooksIntegration = new ConstitutionalHooksIntegration({
      logger: mockLogger,
      hooksManager: mockHooksManager,
      governanceIdentity: mockGovernanceIdentity,
      config: {
        enforceGovernanceIdentity: true,
        logInteractions: true
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with provided dependencies', () => {
      expect(hooksIntegration.logger).to.equal(mockLogger);
      expect(hooksIntegration.hooksManager).to.equal(mockHooksManager);
      expect(hooksIntegration.governanceIdentity).to.equal(mockGovernanceIdentity);
      expect(hooksIntegration.config).to.be.an('object');
      expect(hooksIntegration.config.enforceGovernanceIdentity).to.be.true;
      expect(hooksIntegration.config.logInteractions).to.be.true;
    });
    
    it('should create GovernanceIdentity instance if not provided', () => {
      // Stub GovernanceIdentity constructor
      const governanceIdentityStub = sinon.stub(GovernanceIdentity.prototype, 'constructor').returns({});
      
      const integration = new ConstitutionalHooksIntegration({
        logger: mockLogger,
        hooksManager: mockHooksManager
      });
      
      expect(integration.governanceIdentity).to.be.an('object');
    });
    
    it('should log initialization', () => {
      expect(mockLogger.info.calledWith('Constitutional Hooks Integration for Governance Identity initialized')).to.be.true;
    });
  });
  
  describe('registerHooks', () => {
    it('should register all governance identity hooks', () => {
      const result = hooksIntegration.registerHooks();
      
      expect(result).to.be.true;
      expect(mockHooksManager.register.callCount).to.be.at.least(6);
      expect(mockHooksManager.register.calledWith('beforeAgentExecution')).to.be.true;
      expect(mockHooksManager.register.calledWith('beforeAgentInteraction')).to.be.true;
      expect(mockHooksManager.register.calledWith('afterAgentInteraction')).to.be.true;
      expect(mockHooksManager.register.calledWith('validateAgentContract')).to.be.true;
      expect(mockHooksManager.register.calledWith('beforeMemoryAccess')).to.be.true;
      expect(mockHooksManager.register.calledWith('afterMemoryMutation')).to.be.true;
      expect(mockHooksManager.register.calledWith('beforeReflection')).to.be.true;
      expect(mockHooksManager.register.calledWith('afterReflection')).to.be.true;
      
      expect(mockLogger.info.calledWith('Governance Identity hooks registered with Constitutional Hooks Manager')).to.be.true;
    });
    
    it('should handle missing hooks manager', () => {
      hooksIntegration.hooksManager = null;
      
      const result = hooksIntegration.registerHooks();
      
      expect(result).to.be.false;
      expect(mockLogger.error.calledOnce).to.be.true;
    });
  });
  
  describe('beforeAgentExecution', () => {
    it('should tag agent with governance identity', () => {
      const agent = {
        id: 'test-agent-1'
      };
      
      const result = hooksIntegration.beforeAgentExecution(agent);
      
      expect(result).to.equal(agent);
      expect(mockGovernanceIdentity.tagAgent.calledOnce).to.be.true;
      expect(mockGovernanceIdentity.tagAgent.calledWith(agent)).to.be.true;
      expect(mockLogger.debug.calledOnce).to.be.true;
    });
  });
  
  describe('beforeAgentInteraction', () => {
    it('should verify governance compatibility and proceed if compatible', () => {
      const sourceAgent = {
        id: 'source-agent'
      };
      
      const targetAgent = {
        id: 'target-agent'
      };
      
      const context = {
        confidence: 0.8
      };
      
      const result = hooksIntegration.beforeAgentInteraction(sourceAgent, targetAgent, context);
      
      expect(result).to.be.an('object');
      expect(result.proceed).to.be.true;
      expect(result.context).to.equal(context);
      expect(result.context.interactionPolicy).to.be.an('object');
      expect(mockGovernanceIdentity.verifyGovernanceCompatibility.calledOnce).to.be.true;
      expect(mockGovernanceIdentity.verifyGovernanceCompatibility.calledWith(sourceAgent, targetAgent)).to.be.true;
    });
    
    it('should block interaction if incompatible and enforcement is enabled', () => {
      // Make verification return incompatible
      mockGovernanceIdentity.verifyGovernanceCompatibility.returns({
        compatible: false,
        reason: 'Memory integrity required but not provided',
        interactionPolicy: { action: 'reject', restrictions: [], explanation: 'Memory integrity required but not provided' }
      });
      
      const sourceAgent = {
        id: 'source-agent'
      };
      
      const targetAgent = {
        id: 'target-agent'
      };
      
      const result = hooksIntegration.beforeAgentInteraction(sourceAgent, targetAgent);
      
      expect(result).to.be.an('object');
      expect(result.proceed).to.be.false;
      expect(result.reason).to.equal('Memory integrity required but not provided');
      expect(result.policy).to.be.an('object');
      expect(result.policy.action).to.equal('reject');
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
    
    it('should apply confidence modifiers to context', () => {
      // Make verification return confidence modifiers
      mockGovernanceIdentity.verifyGovernanceCompatibility.returns({
        compatible: true,
        reason: 'All trust requirements met',
        confidenceModifiers: { total: -0.2, factors: { unknown_governance: -0.2 } },
        interactionPolicy: { action: 'proceed', restrictions: [], explanation: 'Compatible governance frameworks' }
      });
      
      const sourceAgent = {
        id: 'source-agent'
      };
      
      const targetAgent = {
        id: 'target-agent'
      };
      
      const context = {
        confidence: 0.8
      };
      
      const result = hooksIntegration.beforeAgentInteraction(sourceAgent, targetAgent, context);
      
      expect(result).to.be.an('object');
      expect(result.proceed).to.be.true;
      expect(result.context).to.equal(context);
      expect(result.context.confidence).to.equal(0.6);
      expect(result.context.confidenceModifiers).to.be.an('object');
      expect(result.context.confidenceModifiers.total).to.equal(-0.2);
    });
  });
  
  describe('afterAgentInteraction', () => {
    it('should log interaction if configured', () => {
      const sourceAgent = {
        id: 'source-agent'
      };
      
      const targetAgent = {
        id: 'target-agent'
      };
      
      const context = {
        operation: 'test-operation'
      };
      
      const result = {
        status: 'success'
      };
      
      hooksIntegration.afterAgentInteraction(sourceAgent, targetAgent, context, result);
      
      expect(mockGovernanceIdentity.logInteraction.calledOnce).to.be.true;
      expect(mockGovernanceIdentity.logInteraction.calledWith(sourceAgent, targetAgent, context, result)).to.be.true;
    });
    
    it('should not log interaction if disabled', () => {
      hooksIntegration.config.logInteractions = false;
      
      const sourceAgent = {
        id: 'source-agent'
      };
      
      const targetAgent = {
        id: 'target-agent'
      };
      
      hooksIntegration.afterAgentInteraction(sourceAgent, targetAgent);
      
      expect(mockGovernanceIdentity.logInteraction.called).to.be.false;
    });
  });
  
  describe('validateAgentContract', () => {
    let contractExtensionStub;
    let extendContractStub;
    let validateContractStub;
    
    beforeEach(() => {
      // Create stubs for AgentContractExtension
      extendContractStub = sinon.stub().callsFake(contract => {
        contract.governanceIdentity = contract.governanceIdentity || {
          agent_id: contract.id,
          governance_framework: 'promethios'
        };
        return contract;
      });
      
      validateContractStub = sinon.stub().returns({
        valid: true,
        errors: []
      });
      
      contractExtensionStub = sinon.stub().returns({
        extendContract: extendContractStub,
        validateContract: validateContractStub
      });
      
      // Mock require for AgentContractExtension
      const requireStub = sinon.stub(require('module'), '_load');
      requireStub.withArgs('./agent_contract_extension').returns({
        AgentContractExtension: contractExtensionStub
      });
    });
    
    it('should validate a contract with governance identity', () => {
      const contract = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios'
        }
      };
      
      const result = hooksIntegration.validateAgentContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(0);
      expect(contractExtensionStub.calledOnce).to.be.true;
      expect(extendContractStub.called).to.be.false;
      expect(validateContractStub.calledOnce).to.be.true;
      expect(validateContractStub.calledWith(contract)).to.be.true;
    });
    
    it('should extend a contract without governance identity', () => {
      const contract = {
        id: 'test-agent-1'
      };
      
      const result = hooksIntegration.validateAgentContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.true;
      expect(contractExtensionStub.calledOnce).to.be.true;
      expect(extendContractStub.calledOnce).to.be.true;
      expect(extendContractStub.calledWith(contract)).to.be.true;
      expect(validateContractStub.calledOnce).to.be.true;
    });
    
    it('should return validation errors if contract is invalid', () => {
      validateContractStub.returns({
        valid: false,
        errors: ['Invalid governance identity']
      });
      
      const contract = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1'
          // Missing required fields
        }
      };
      
      const result = hooksIntegration.validateAgentContract(contract);
      
      expect(result).to.be.an('object');
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array');
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0]).to.equal('Invalid governance identity');
    });
  });
  
  describe('beforeMemoryAccess', () => {
    it('should allow memory access by default', () => {
      const agent = {
        id: 'test-agent-1'
      };
      
      const memoryAccess = {
        type: 'read',
        path: 'test/path'
      };
      
      const result = hooksIntegration.beforeMemoryAccess(agent, memoryAccess);
      
      expect(result).to.be.an('object');
      expect(result.proceed).to.be.true;
      expect(mockGovernanceIdentity.tagAgent.calledOnce).to.be.true;
    });
    
    it('should tag agent if it has no governance identity', () => {
      const agent = {
        id: 'test-agent-1'
      };
      
      const memoryAccess = {
        type: 'read',
        path: 'test/path'
      };
      
      hooksIntegration.beforeMemoryAccess(agent, memoryAccess);
      
      expect(mockGovernanceIdentity.tagAgent.calledOnce).to.be.true;
      expect(mockGovernanceIdentity.tagAgent.calledWith(agent)).to.be.true;
    });
    
    it('should block memory write from incompatible external source for strict agents', () => {
      // Make verification return incompatible
      mockGovernanceIdentity.verifyGovernanceCompatibility.returns({
        compatible: false,
        reason: 'Memory integrity required but not provided'
      });
      
      const agent = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios',
          compliance_level: 'strict'
        }
      };
      
      const sourceAgent = {
        id: 'external-agent'
      };
      
      const memoryAccess = {
        type: 'write',
        path: 'test/path',
        externalSource: sourceAgent
      };
      
      const result = hooksIntegration.beforeMemoryAccess(agent, memoryAccess);
      
      expect(result).to.be.an('object');
      expect(result.proceed).to.be.false;
      expect(result.reason).to.equal('Memory integrity required but not provided');
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
    
    it('should allow memory write from compatible external source', () => {
      // Make verification return compatible
      mockGovernanceIdentity.verifyGovernanceCompatibility.returns({
        compatible: true,
        reason: 'All trust requirements met'
      });
      
      const agent = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios',
          compliance_level: 'strict'
        }
      };
      
      const sourceAgent = {
        id: 'external-agent'
      };
      
      const memoryAccess = {
        type: 'write',
        path: 'test/path',
        externalSource: sourceAgent
      };
      
      const result = hooksIntegration.beforeMemoryAccess(agent, memoryAccess);
      
      expect(result).to.be.an('object');
      expect(result.proceed).to.be.true;
    });
  });
  
  describe('afterMemoryMutation', () => {
    it('should update memory integrity verification timestamp', () => {
      const agent = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios',
          memory_integrity: {
            type: 'merkle_v3',
            last_verified: '2023-01-01T00:00:00.000Z'
          }
        }
      };
      
      const memoryMutation = {
        type: 'write',
        path: 'test/path'
      };
      
      hooksIntegration.afterMemoryMutation(agent, memoryMutation);
      
      expect(agent.governanceIdentity.memory_integrity.last_verified).to.not.equal('2023-01-01T00:00:00.000Z');
      expect(new Date(agent.governanceIdentity.memory_integrity.last_verified)).to.be.a('date');
      expect(mockLogger.debug.calledOnce).to.be.true;
    });
    
    it('should tag agent if it has no governance identity', () => {
      const agent = {
        id: 'test-agent-1'
      };
      
      const memoryMutation = {
        type: 'write',
        path: 'test/path'
      };
      
      hooksIntegration.afterMemoryMutation(agent, memoryMutation);
      
      expect(mockGovernanceIdentity.tagAgent.calledOnce).to.be.true;
      expect(mockGovernanceIdentity.tagAgent.calledWith(agent)).to.be.true;
    });
  });
  
  describe('beforeReflection', () => {
    it('should add governance identity to reflection context', () => {
      const agent = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios'
        }
      };
      
      const reflectionContext = {
        operation: 'test-reflection'
      };
      
      const result = hooksIntegration.beforeReflection(agent, reflectionContext);
      
      expect(result).to.be.an('object');
      expect(result.proceed).to.be.true;
      expect(result.reflectionContext).to.equal(reflectionContext);
      expect(result.reflectionContext.governanceIdentity).to.equal(agent.governanceIdentity);
    });
    
    it('should tag agent if it has no governance identity', () => {
      const agent = {
        id: 'test-agent-1'
      };
      
      const reflectionContext = {
        operation: 'test-reflection'
      };
      
      hooksIntegration.beforeReflection(agent, reflectionContext);
      
      expect(mockGovernanceIdentity.tagAgent.calledOnce).to.be.true;
      expect(mockGovernanceIdentity.tagAgent.calledWith(agent)).to.be.true;
    });
  });
  
  describe('afterReflection', () => {
    it('should log reflection completion', () => {
      const agent = {
        id: 'test-agent-1',
        governanceIdentity: {
          agent_id: 'test-agent-1',
          governance_framework: 'promethios',
          compliance_level: 'standard'
        }
      };
      
      const reflectionResult = {
        status: 'success'
      };
      
      hooksIntegration.afterReflection(agent, reflectionResult);
      
      expect(mockLogger.debug.calledOnce).to.be.true;
      expect(mockLogger.debug.firstCall.args[0]).to.include('Reflection completed');
    });
    
    it('should tag agent if it has no governance identity', () => {
      const agent = {
        id: 'test-agent-1'
      };
      
      const reflectionResult = {
        status: 'success'
      };
      
      hooksIntegration.afterReflection(agent, reflectionResult);
      
      expect(mockGovernanceIdentity.tagAgent.calledOnce).to.be.true;
      expect(mockGovernanceIdentity.tagAgent.calledWith(agent)).to.be.true;
    });
  });
  
  describe('updateTrustMetrics', () => {
    it('should log successful interaction', () => {
      const sourceAgent = {
        id: 'source-agent'
      };
      
      const targetAgent = {
        id: 'target-agent'
      };
      
      const result = {
        status: 'success'
      };
      
      hooksIntegration.updateTrustMetrics(sourceAgent, targetAgent, result);
      
      expect(mockLogger.debug.calledOnce).to.be.true;
      expect(mockLogger.debug.firstCall.args[0]).to.include('Successful interaction');
    });
    
    it('should log failed interaction', () => {
      const sourceAgent = {
        id: 'source-agent'
      };
      
      const targetAgent = {
        id: 'target-agent'
      };
      
      const result = {
        status: 'error',
        error: 'Test error'
      };
      
      hooksIntegration.updateTrustMetrics(sourceAgent, targetAgent, result);
      
      expect(mockLogger.debug.calledOnce).to.be.true;
      expect(mockLogger.debug.firstCall.args[0]).to.include('Failed interaction');
      expect(mockLogger.debug.firstCall.args[0]).to.include('Test error');
    });
  });
});
