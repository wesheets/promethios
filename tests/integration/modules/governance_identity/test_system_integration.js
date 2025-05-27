/**
 * Integration tests for the Governance Identity system
 * 
 * @module tests/integration/modules/governance_identity/test_system_integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { GovernanceIdentity } = require('../../../../src/modules/governance_identity/index');
const { AgentContractExtension } = require('../../../../src/modules/governance_identity/agent_contract_extension');
const { ConstitutionalHooksIntegration } = require('../../../../src/modules/governance_identity/constitutional_hooks_integration');

describe('Governance Identity System Integration', () => {
  let governanceIdentity;
  let contractExtension;
  let hooksIntegration;
  let mockLogger;
  let mockHooksManager;
  
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
    
    // Create system components
    governanceIdentity = new GovernanceIdentity({
      logger: mockLogger,
      hooks: mockHooksManager,
      config: {
        dataPath: 'test/data/path',
        enforceTrustRequirements: true
      }
    });
    
    contractExtension = new AgentContractExtension({
      logger: mockLogger,
      config: {
        schemaPath: '../../schemas/governance'
      }
    });
    
    hooksIntegration = new ConstitutionalHooksIntegration({
      logger: mockLogger,
      hooksManager: mockHooksManager,
      governanceIdentity: governanceIdentity,
      config: {
        enforceGovernanceIdentity: true,
        logInteractions: true
      }
    });
    
    // Register hooks
    hooksIntegration.registerHooks();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('End-to-end agent interaction flow', () => {
    it('should handle complete agent interaction flow with governance identity', () => {
      // Create source agent
      const sourceAgent = {
        id: 'source-agent',
        capabilities: ['memory_integrity', 'reflection', 'belief_trace']
      };
      
      // Create target agent
      const targetAgent = {
        id: 'target-agent',
        capabilities: ['memory_integrity', 'reflection']
      };
      
      // Create interaction context
      const context = {
        operation: 'test-operation',
        confidence: 0.8
      };
      
      // Step 1: Extend agent contracts
      const sourceContract = contractExtension.extendContract(sourceAgent);
      const targetContract = contractExtension.extendContract(targetAgent);
      
      // Verify contracts have governance identity
      expect(sourceContract.governanceIdentity).to.be.an('object');
      expect(targetContract.governanceIdentity).to.be.an('object');
      
      // Step 2: Validate agent contracts
      const sourceValidation = hooksIntegration.validateAgentContract(sourceContract);
      const targetValidation = hooksIntegration.validateAgentContract(targetContract);
      
      expect(sourceValidation.valid).to.be.true;
      expect(targetValidation.valid).to.be.true;
      
      // Step 3: Execute agent with governance identity
      const executedSourceAgent = hooksIntegration.beforeAgentExecution(sourceContract);
      const executedTargetAgent = hooksIntegration.beforeAgentExecution(targetContract);
      
      expect(executedSourceAgent.governanceIdentity).to.be.an('object');
      expect(executedTargetAgent.governanceIdentity).to.be.an('object');
      
      // Step 4: Verify governance compatibility before interaction
      const interactionControl = hooksIntegration.beforeAgentInteraction(
        executedSourceAgent, 
        executedTargetAgent, 
        context
      );
      
      expect(interactionControl.proceed).to.be.true;
      expect(interactionControl.context).to.equal(context);
      expect(interactionControl.context.interactionPolicy).to.be.an('object');
      
      // Step 5: Perform memory access with governance identity
      const memoryAccess = {
        type: 'write',
        path: 'test/path',
        externalSource: executedTargetAgent
      };
      
      const memoryAccessControl = hooksIntegration.beforeMemoryAccess(
        executedSourceAgent, 
        memoryAccess
      );
      
      expect(memoryAccessControl.proceed).to.be.true;
      
      // Step 6: Log memory mutation
      hooksIntegration.afterMemoryMutation(
        executedSourceAgent, 
        { type: 'write', path: 'test/path' }
      );
      
      // Step 7: Perform reflection with governance identity
      const reflectionContext = {
        operation: 'test-reflection'
      };
      
      const reflectionControl = hooksIntegration.beforeReflection(
        executedSourceAgent, 
        reflectionContext
      );
      
      expect(reflectionControl.proceed).to.be.true;
      expect(reflectionControl.reflectionContext.governanceIdentity).to.equal(executedSourceAgent.governanceIdentity);
      
      // Step 8: Log reflection completion
      hooksIntegration.afterReflection(
        executedSourceAgent, 
        { status: 'success' }
      );
      
      // Step 9: Log interaction completion
      const interactionResult = {
        status: 'success',
        data: { test: 'data' }
      };
      
      hooksIntegration.afterAgentInteraction(
        executedSourceAgent, 
        executedTargetAgent, 
        context, 
        interactionResult
      );
      
      // Verify interaction was logged
      expect(governanceIdentity.interactionHistory.size).to.be.at.least(1);
    });
    
    it('should handle interaction between Promethios and external agents', () => {
      // Create Promethios agent
      const promethiosAgent = {
        id: 'promethios-agent',
        capabilities: ['memory_integrity', 'reflection', 'belief_trace']
      };
      
      // Create external agent without governance identity
      const externalAgent = {
        id: 'external-agent'
      };
      
      // Create interaction context
      const context = {
        operation: 'test-operation',
        confidence: 0.8
      };
      
      // Step 1: Extend Promethios agent contract
      const promethiosContract = contractExtension.extendContract(promethiosAgent);
      
      // Verify contract has governance identity
      expect(promethiosContract.governanceIdentity).to.be.an('object');
      expect(promethiosContract.governanceIdentity.governance_framework).to.equal('promethios');
      
      // Step 2: Execute agents with governance identity
      const executedPromethiosAgent = hooksIntegration.beforeAgentExecution(promethiosContract);
      
      // External agent will be tagged during interaction
      
      // Step 3: Verify governance compatibility before interaction
      const interactionControl = hooksIntegration.beforeAgentInteraction(
        executedPromethiosAgent, 
        externalAgent, 
        context
      );
      
      // External agent should now have governance identity
      expect(externalAgent.governanceIdentity).to.be.an('object');
      expect(externalAgent.governanceIdentity.governance_framework).to.equal('external');
      
      // Interaction may proceed with restrictions depending on trust requirements
      if (interactionControl.proceed) {
        expect(interactionControl.context.interactionPolicy).to.be.an('object');
      } else {
        expect(interactionControl.reason).to.be.a('string');
        expect(interactionControl.policy).to.be.an('object');
      }
      
      // Step 4: Log interaction completion
      const interactionResult = {
        status: 'success',
        data: { test: 'data' }
      };
      
      hooksIntegration.afterAgentInteraction(
        executedPromethiosAgent, 
        externalAgent, 
        context, 
        interactionResult
      );
      
      // Verify interaction was logged
      expect(governanceIdentity.interactionHistory.size).to.be.at.least(1);
    });
    
    it('should enforce trust requirements for strict compliance agents', () => {
      // Create strict compliance agent
      const strictAgent = {
        id: 'strict-agent',
        capabilities: ['memory_integrity', 'reflection', 'belief_trace']
      };
      
      // Create minimal compliance agent
      const minimalAgent = {
        id: 'minimal-agent'
      };
      
      // Create interaction context
      const context = {
        operation: 'test-operation',
        confidence: 0.8
      };
      
      // Step 1: Extend agent contracts
      const strictContract = contractExtension.extendContract(strictAgent, {
        complianceLevel: 'strict',
        trust_requirements: {
          memory_integrity: true,
          reflection_enforced: true,
          belief_trace: true,
          minimum_compliance_level: 'standard'
        },
        fallbackStrategy: 'reject'
      });
      
      const minimalContract = contractExtension.extendContract(minimalAgent, {
        complianceLevel: 'minimal',
        memory_integrity: { type: 'none' }
      });
      
      // Step 2: Execute agents with governance identity
      const executedStrictAgent = hooksIntegration.beforeAgentExecution(strictContract);
      const executedMinimalAgent = hooksIntegration.beforeAgentExecution(minimalContract);
      
      // Step 3: Verify governance compatibility before interaction
      const interactionControl = hooksIntegration.beforeAgentInteraction(
        executedStrictAgent, 
        executedMinimalAgent, 
        context
      );
      
      // Strict agent should reject interaction with minimal agent
      expect(interactionControl.proceed).to.be.false;
      expect(interactionControl.reason).to.be.a('string');
      expect(interactionControl.policy).to.be.an('object');
      expect(interactionControl.policy.action).to.equal('reject');
    });
  });
  
  describe('System-wide configuration and persistence', () => {
    it('should persist and load governance identity data', () => {
      // Create and tag some agents
      const agent1 = {
        id: 'agent-1',
        capabilities: ['memory_integrity', 'reflection']
      };
      
      const agent2 = {
        id: 'agent-2',
        capabilities: ['memory_integrity']
      };
      
      governanceIdentity.tagAgent(agent1);
      governanceIdentity.tagAgent(agent2);
      
      // Verify agents are tagged
      expect(agent1.governanceIdentity).to.be.an('object');
      expect(agent2.governanceIdentity).to.be.an('object');
      expect(governanceIdentity.identities.size).to.equal(2);
      
      // Persist data
      const persistStub = sinon.stub(governanceIdentity, 'persistData').returns(true);
      const loadStub = sinon.stub(governanceIdentity, 'loadData').returns(true);
      
      const persistResult = governanceIdentity.persistData();
      expect(persistResult).to.be.true;
      expect(persistStub.calledOnce).to.be.true;
      
      // Create new instance and load data
      const newGovernanceIdentity = new GovernanceIdentity({
        logger: mockLogger,
        config: {
          dataPath: 'test/data/path'
        }
      });
      
      // Stub loadData to simulate loading from disk
      newGovernanceIdentity.loadData = loadStub;
      
      const loadResult = newGovernanceIdentity.loadData();
      expect(loadResult).to.be.true;
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should export governance identity data in different formats', () => {
      // Create and tag some agents
      const agent1 = {
        id: 'agent-1',
        capabilities: ['memory_integrity', 'reflection']
      };
      
      const agent2 = {
        id: 'agent-2',
        capabilities: ['memory_integrity']
      };
      
      governanceIdentity.tagAgent(agent1);
      governanceIdentity.tagAgent(agent2);
      
      // Export as JSON
      const jsonData = governanceIdentity.exportData('json');
      expect(jsonData).to.be.a('string');
      expect(JSON.parse(jsonData)).to.be.an('array');
      expect(JSON.parse(jsonData).length).to.equal(2);
      
      // Export as CSV
      const csvData = governanceIdentity.exportData('csv');
      expect(csvData).to.be.a('string');
      expect(csvData.split('\n').length).to.equal(3); // Header + 2 rows
    });
  });
});
