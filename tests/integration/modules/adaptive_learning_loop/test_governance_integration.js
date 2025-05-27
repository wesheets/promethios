/**
 * Integration tests for the Adaptive Learning Loop with Governance Identity
 * 
 * @module tests/integration/modules/adaptive_learning_loop/test_governance_integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { AdaptiveLearningLoop } = require('../../../../src/modules/adaptive_learning_loop');
const { GovernanceIdentity } = require('../../../../src/modules/governance_identity');

describe('Adaptive Learning Loop - Governance Identity Integration', () => {
  let adaptiveLearningLoop;
  let governanceIdentity;
  let mockLogger;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      debug: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create real governance identity instance
    governanceIdentity = new GovernanceIdentity({
      logger: mockLogger
    });
    
    // Create adaptive learning loop instance with governance identity
    adaptiveLearningLoop = new AdaptiveLearningLoop({
      logger: mockLogger,
      governanceIdentity: governanceIdentity,
      config: {
        learningCycleInterval: 0, // Disable auto-cycles for testing
        governanceCompliance: true
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
    
    // Clean up resources
    if (adaptiveLearningLoop.metaLearningController && 
        adaptiveLearningLoop.metaLearningController.cycleTimer) {
      clearInterval(adaptiveLearningLoop.metaLearningController.cycleTimer);
    }
  });
  
  describe('Governance Compliance', () => {
    it('should verify adaptations against governance requirements', async () => {
      // Spy on governance verification method
      const verifyComplianceSpy = sinon.spy(governanceIdentity, 'verifyCompliance');
      
      // Create a test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Apply adaptation
      adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Check that governance verification was called
      expect(verifyComplianceSpy.calledOnce).to.be.true;
      expect(verifyComplianceSpy.firstCall.args[0]).to.have.property('id', adaptation.id);
    });
    
    it('should reject adaptations that violate governance requirements', async () => {
      // Make governance identity reject verification
      sinon.stub(governanceIdentity, 'verifyCompliance').returns({
        compliant: false,
        confidence: 0.3,
        reason: 'Governance violation'
      });
      
      // Create a test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Apply adaptation
      const result = adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Should not apply adaptations that violate governance
      expect(result.success).to.be.false;
      expect(result.error).to.include('Governance violation');
    });
  });
  
  describe('Identity Tagging', () => {
    it('should tag adaptations with governance identity', async () => {
      // Spy on identity tagging method
      const tagEntitySpy = sinon.spy(governanceIdentity, 'tagEntity');
      
      // Create a test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Apply adaptation
      adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Check that identity tagging was called
      expect(tagEntitySpy.calledOnce).to.be.true;
      expect(tagEntitySpy.firstCall.args[0]).to.have.property('id', adaptation.id);
    });
    
    it('should include governance metadata in adaptations', async () => {
      // Mock governance identity to add metadata
      sinon.stub(governanceIdentity, 'tagEntity').callsFake((entity) => {
        return {
          ...entity,
          governance: {
            constitution_hash: 'test_hash',
            compliance_level: 'full',
            trust_verification: 'enabled'
          }
        };
      });
      
      // Create a test adaptation
      const adaptation = {
        id: 'test_adaptation',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        justification: {
          confidence: 0.9,
          pattern_id: 'test_pattern',
          reasoning: 'Test reasoning'
        }
      };
      
      // Apply adaptation
      const result = adaptiveLearningLoop.adaptationEngine.applyAdaptation(adaptation);
      
      // Check that governance metadata was added
      expect(result.adaptation).to.have.property('governance');
      expect(result.adaptation.governance).to.have.property('constitution_hash', 'test_hash');
      expect(result.adaptation.governance).to.have.property('compliance_level', 'full');
    });
  });
  
  describe('Trust Negotiation', () => {
    it('should negotiate trust with external agents', async () => {
      // Spy on trust negotiation method
      const negotiateTrustSpy = sinon.spy(governanceIdentity, 'negotiateTrust');
      
      // Create a test external agent
      const externalAgent = {
        id: 'external_agent',
        type: 'agent',
        governance: {
          constitution_hash: 'external_hash',
          compliance_level: 'partial'
        }
      };
      
      // Negotiate trust
      adaptiveLearningLoop.negotiateTrustWithAgent(externalAgent);
      
      // Check that trust negotiation was called
      expect(negotiateTrustSpy.calledOnce).to.be.true;
      expect(negotiateTrustSpy.firstCall.args[0]).to.have.property('id', externalAgent.id);
    });
    
    it('should adjust confidence based on trust level', async () => {
      // Mock governance identity to return trust level
      sinon.stub(governanceIdentity, 'negotiateTrust').returns({
        trust_level: 0.7,
        confidence_modifier: 0.8,
        compatible: true
      });
      
      // Create a test external agent
      const externalAgent = {
        id: 'external_agent',
        type: 'agent',
        governance: {
          constitution_hash: 'external_hash',
          compliance_level: 'partial'
        }
      };
      
      // Negotiate trust
      const result = adaptiveLearningLoop.negotiateTrustWithAgent(externalAgent);
      
      // Check that confidence modifier was applied
      expect(result).to.have.property('trust_level', 0.7);
      expect(result).to.have.property('confidence_modifier', 0.8);
      
      // Check that confidence was adjusted in adaptation engine
      expect(adaptiveLearningLoop.adaptationEngine.externalTrustModifiers)
        .to.have.property('external_agent', 0.8);
    });
  });
  
  describe('Governance Event Flow', () => {
    it('should propagate governance events to learning memory', async () => {
      // Spy on learning memory method
      const storeGovernanceEventSpy = sinon.spy(adaptiveLearningLoop.learningMemory, 'storeGovernanceEvent');
      
      // Create a test governance event
      const governanceEvent = {
        id: 'gov_event_1',
        type: 'compliance_verification',
        entity_id: 'test_adaptation',
        result: 'compliant',
        timestamp: new Date().toISOString()
      };
      
      // Process governance event
      adaptiveLearningLoop.processGovernanceEvent(governanceEvent);
      
      // Check that event was stored
      expect(storeGovernanceEventSpy.calledOnce).to.be.true;
      expect(storeGovernanceEventSpy.firstCall.args[0]).to.have.property('id', governanceEvent.id);
    });
    
    it('should consider governance events in pattern recognition', async () => {
      // Spy on pattern recognizer method
      const includeGovernanceDataSpy = sinon.spy(adaptiveLearningLoop.patternRecognizer, 'includeGovernanceData');
      
      // Create governance events
      const governanceEvents = [
        {
          id: 'gov_event_1',
          type: 'compliance_verification',
          entity_id: 'test_adaptation',
          result: 'compliant',
          timestamp: new Date().toISOString()
        }
      ];
      
      // Mock learning memory to return governance events
      sinon.stub(adaptiveLearningLoop.learningMemory, 'getGovernanceEvents').returns(governanceEvents);
      
      // Run pattern recognition
      adaptiveLearningLoop.patternRecognizer.recognizePatterns([], {
        includeGovernance: true
      });
      
      // Check that governance data was included
      expect(includeGovernanceDataSpy.calledOnce).to.be.true;
      expect(includeGovernanceDataSpy.firstCall.args[0]).to.deep.equal(governanceEvents);
    });
  });
  
  describe('Interoperability', () => {
    it('should validate external adaptations against governance schema', async () => {
      // Spy on schema validation method
      const validateAgainstSchemaSpy = sinon.spy(governanceIdentity, 'validateAgainstSchema');
      
      // Create a test external adaptation
      const externalAdaptation = {
        id: 'external_adaptation',
        type: 'parameter',
        target: { parameter: 'external_param', target_value: 0.5 },
        justification: {
          confidence: 0.8,
          reasoning: 'External reasoning'
        },
        governance: {
          constitution_hash: 'external_hash',
          compliance_level: 'partial'
        }
      };
      
      // Validate external adaptation
      adaptiveLearningLoop.validateExternalAdaptation(externalAdaptation);
      
      // Check that schema validation was called
      expect(validateAgainstSchemaSpy.calledOnce).to.be.true;
      expect(validateAgainstSchemaSpy.firstCall.args[0]).to.equal(externalAdaptation);
      expect(validateAgainstSchemaSpy.firstCall.args[1]).to.equal('governance_identity');
    });
    
    it('should reject external adaptations with invalid governance', async () => {
      // Make governance identity reject schema validation
      sinon.stub(governanceIdentity, 'validateAgainstSchema').returns({
        valid: false,
        errors: ['Missing required governance fields']
      });
      
      // Create a test external adaptation
      const externalAdaptation = {
        id: 'external_adaptation',
        type: 'parameter',
        target: { parameter: 'external_param', target_value: 0.5 }
        // Missing governance fields
      };
      
      // Validate external adaptation
      const result = adaptiveLearningLoop.validateExternalAdaptation(externalAdaptation);
      
      // Check that validation failed
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('Missing required governance fields');
    });
  });
});
