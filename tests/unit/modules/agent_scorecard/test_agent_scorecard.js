/**
 * Agent Scorecard Unit Tests
 * 
 * Unit tests for the core components of the Agent Scorecard system.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const { AgentScorecard } = require('../../../../src/modules/agent_scorecard');
const ScorecardManager = require('../../../../src/modules/agent_scorecard/scorecard_manager');
const TrustLineageTracker = require('../../../../src/modules/agent_scorecard/trust_lineage_tracker');
const CryptographicVerifier = require('../../../../src/modules/agent_scorecard/cryptographic_verifier');

describe('Agent Scorecard Unit Tests', function() {
  let sandbox;
  let testConfig;
  
  before(function() {
    // Create test directories
    const testDir = path.join(process.cwd(), 'test_data', 'agent_scorecard_unit');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    testConfig = {
      storageDir: path.join(testDir, 'scorecards'),
      keyDir: path.join(testDir, 'keys')
    };
  });
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('ScorecardManager', function() {
    let scorecardManager;
    
    beforeEach(function() {
      scorecardManager = new ScorecardManager(testConfig);
    });
    
    it('should create a valid scorecard object', function() {
      const agentId = 'test-agent';
      const governanceIdentity = {
        type: 'promethios',
        constitution_hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        compliance_level: 'full',
        verification_endpoint: 'https://verify.promethios.ai/agent/test-agent'
      };
      const trustScore = 0.85;
      const prismMetrics = {
        reflection: {
          total_count: 100,
          compliant_count: 85,
          compliance_percentage: 85
        },
        beliefTrace: {
          total_outputs: 200,
          verified_outputs: 180,
          integrity_percentage: 90
        }
      };
      const vigilMetrics = {
        trustDecay: {
          decay_percentage: 5,
          decay_rate: 0.01
        },
        violations: [
          {
            timestamp: new Date().toISOString(),
            type: 'reflection_skip',
            description: 'Skipped reflection step',
            severity: 'minor'
          }
        ]
      };
      
      const scorecard = scorecardManager.createScorecard(
        agentId,
        governanceIdentity,
        trustScore,
        prismMetrics,
        vigilMetrics
      );
      
      expect(scorecard).to.be.an('object');
      expect(scorecard.agent_id).to.equal(agentId);
      expect(scorecard.governance_identity.type).to.equal('promethios');
      expect(scorecard.trust_score).to.equal(trustScore);
      expect(scorecard.reflection_compliance.percentage).to.equal(85);
      expect(scorecard.belief_trace_integrity.percentage).to.equal(90);
      expect(scorecard.violation_history.count).to.equal(1);
    });
    
    it('should calculate correct reflection compliance', function() {
      const reflectionCompliance = scorecardManager._calculateReflectionCompliance({
        reflection: {
          total_count: 100,
          compliant_count: 75,
          compliance_percentage: 75
        }
      });
      
      expect(reflectionCompliance.percentage).to.equal(75);
      expect(reflectionCompliance.total_reflections).to.equal(100);
      expect(reflectionCompliance.compliant_reflections).to.equal(75);
    });
    
    it('should handle missing metrics gracefully', function() {
      const scorecard = scorecardManager.createScorecard(
        'test-agent',
        { type: 'promethios', constitution_hash: '1234' },
        0.8,
        null,
        null
      );
      
      expect(scorecard.reflection_compliance.percentage).to.equal(0);
      expect(scorecard.belief_trace_integrity.percentage).to.equal(0);
      expect(scorecard.violation_history.count).to.equal(0);
    });
    
    it('should determine correct warning state', function() {
      // Test unknown governance
      const unknownWarning = scorecardManager._determineWarningState(
        { type: 'unknown' },
        null
      );
      
      expect(unknownWarning.has_warning).to.be.true;
      expect(unknownWarning.warning_level).to.equal('severe');
      
      // Test low trust score
      const lowTrustWarning = scorecardManager._determineWarningState(
        { type: 'promethios' },
        0.5
      );
      
      expect(lowTrustWarning.has_warning).to.be.true;
      expect(lowTrustWarning.warning_level).to.equal('caution');
      
      // Test good trust score
      const goodTrustWarning = scorecardManager._determineWarningState(
        { type: 'promethios' },
        0.9
      );
      
      expect(goodTrustWarning.has_warning).to.be.false;
      expect(goodTrustWarning.warning_level).to.equal('none');
    });
  });
  
  describe('TrustLineageTracker', function() {
    let trustLineageTracker;
    
    beforeEach(function() {
      trustLineageTracker = new TrustLineageTracker(testConfig);
    });
    
    it('should calculate correct delegation score', function() {
      // Both agents have high trust scores
      const highScore = trustLineageTracker._calculateDelegationScore(
        { trust_score: 0.9, governance_identity: { type: 'promethios', constitution_hash: '1234' } },
        { trust_score: 0.8, governance_identity: { type: 'promethios', constitution_hash: '1234' } }
      );
      
      expect(highScore).to.be.greaterThan(0.8);
      
      // Different governance types
      const differentGovernance = trustLineageTracker._calculateDelegationScore(
        { trust_score: 0.9, governance_identity: { type: 'promethios', constitution_hash: '1234' } },
        { trust_score: 0.8, governance_identity: { type: 'external_verified', constitution_hash: '5678' } }
      );
      
      expect(differentGovernance).to.be.lessThan(highScore);
      
      // One agent has null trust score
      const nullScore = trustLineageTracker._calculateDelegationScore(
        { trust_score: 0.9, governance_identity: { type: 'promethios', constitution_hash: '1234' } },
        { trust_score: null, governance_identity: { type: 'unknown', constitution_hash: '0000' } }
      );
      
      expect(nullScore).to.equal(trustLineageTracker.config.minDelegationScore);
    });
    
    it('should verify delegation requirements', function() {
      // Valid delegation
      expect(() => {
        trustLineageTracker._verifyDelegationRequirements(
          { trust_score: 0.9, governance_identity: { type: 'promethios' } },
          { trust_score: 0.8, governance_identity: { type: 'external_verified' } }
        );
      }).to.not.throw();
      
      // Source has null trust score
      expect(() => {
        trustLineageTracker._verifyDelegationRequirements(
          { trust_score: null, governance_identity: { type: 'unknown' } },
          { trust_score: 0.8, governance_identity: { type: 'external_verified' } }
        );
      }).to.throw(/null trust score/);
      
      // Source has low trust score
      expect(() => {
        trustLineageTracker._verifyDelegationRequirements(
          { trust_score: 0.3, governance_identity: { type: 'promethios' } },
          { trust_score: 0.8, governance_identity: { type: 'external_verified' } }
        );
      }).to.throw(/below minimum threshold/);
      
      // Target has unknown governance
      expect(() => {
        trustLineageTracker._verifyDelegationRequirements(
          { trust_score: 0.9, governance_identity: { type: 'promethios' } },
          { trust_score: null, governance_identity: { type: 'unknown' } }
        );
      }).to.throw(/unknown governance/);
    });
    
    it('should build delegation chain correctly', function() {
      const sourceRecords = [
        {
          source_agent: { agent_id: 'agent-1' },
          target_agent: { agent_id: 'agent-2' },
          timestamp: '2025-05-26T12:00:00Z',
          trust_metrics: { delegation_score: 0.8 }
        },
        {
          source_agent: { agent_id: 'agent-1' },
          target_agent: { agent_id: 'agent-3' },
          timestamp: '2025-05-25T12:00:00Z',
          trust_metrics: { delegation_score: 0.7 }
        }
      ];
      
      const targetRecords = [
        {
          source_agent: { agent_id: 'agent-4' },
          target_agent: { agent_id: 'agent-1' },
          timestamp: '2025-05-24T12:00:00Z',
          trust_metrics: { delegation_score: 0.9 }
        }
      ];
      
      const chain = trustLineageTracker._buildDelegationChain('agent-1', sourceRecords, targetRecords);
      
      expect(chain).to.be.an('array');
      expect(chain.length).to.equal(3);
      expect(chain[0].agent_id).to.equal('agent-2'); // Most recent first
      expect(chain[1].agent_id).to.equal('agent-3');
      expect(chain[2].agent_id).to.equal('agent-4');
    });
  });
  
  describe('CryptographicVerifier', function() {
    let cryptographicVerifier;
    
    beforeEach(function() {
      cryptographicVerifier = new CryptographicVerifier(testConfig);
    });
    
    it('should calculate correct hash', function() {
      const data = 'test data';
      const hash = cryptographicVerifier._calculateHash(data);
      
      expect(hash).to.be.a('string');
      expect(hash.length).to.equal(64); // SHA-256 hash length
    });
    
    it('should sign and verify data', function() {
      // Initialize keys
      cryptographicVerifier._initializeKeys();
      
      // Sign data
      const data = 'test data';
      const signature = cryptographicVerifier._sign(data);
      
      expect(signature).to.be.a('string');
      expect(signature).to.not.be.empty;
      
      // Verify signature
      const publicKeyId = cryptographicVerifier._getPublicKeyId();
      const isValid = cryptographicVerifier._verify(data, signature, publicKeyId);
      
      expect(isValid).to.be.true;
      
      // Verify tampered data
      const tamperedData = 'tampered data';
      const isInvalid = cryptographicVerifier._verify(tamperedData, signature, publicKeyId);
      
      expect(isInvalid).to.be.false;
    });
    
    it('should sign and verify scorecards', async function() {
      const scorecard = {
        agent_id: 'test-agent',
        scorecard_id: '123456',
        timestamp: new Date().toISOString(),
        governance_identity: {
          type: 'promethios',
          constitution_hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          compliance_level: 'full',
          verification_endpoint: 'https://verify.promethios.ai/agent/test-agent'
        },
        trust_score: 0.85,
        cryptographic_proof: {
          signature: '',
          public_key_id: '',
          merkle_root: '',
          timestamp: new Date().toISOString(),
          algorithm: 'ed25519'
        }
      };
      
      // Sign scorecard
      const signedScorecard = await cryptographicVerifier.signScorecard(scorecard);
      
      expect(signedScorecard.cryptographic_proof.signature).to.be.a('string');
      expect(signedScorecard.cryptographic_proof.signature).to.not.be.empty;
      expect(signedScorecard.cryptographic_proof.public_key_id).to.be.a('string');
      expect(signedScorecard.cryptographic_proof.merkle_root).to.be.a('string');
      
      // Verify scorecard
      const isValid = await cryptographicVerifier.verifyScorecard(signedScorecard);
      
      expect(isValid).to.be.true;
      
      // Tamper with scorecard
      const tamperedScorecard = JSON.parse(JSON.stringify(signedScorecard));
      tamperedScorecard.trust_score = 1.0;
      
      // Verify tampered scorecard
      const isInvalid = await cryptographicVerifier.verifyScorecard(tamperedScorecard);
      
      expect(isInvalid).to.be.false;
    });
  });
  
  describe('AgentScorecard', function() {
    let agentScorecard;
    let prismStub;
    let vigilStub;
    let governanceStub;
    
    beforeEach(function() {
      // Stub dependencies
      prismStub = {
        getAgentMetrics: sandbox.stub().resolves({
          reflection: { total_count: 100, compliant_count: 85, compliance_percentage: 85 },
          beliefTrace: { total_outputs: 200, verified_outputs: 180, integrity_percentage: 90 }
        })
      };
      
      vigilStub = {
        getAgentMetrics: sandbox.stub().resolves({
          trustDecay: { decay_percentage: 5, decay_rate: 0.01 },
          violations: []
        })
      };
      
      governanceStub = {
        getIdentity: sandbox.stub().resolves({
          type: 'promethios',
          constitution_hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          compliance_level: 'full',
          verification_endpoint: 'https://verify.promethios.ai/agent/test-agent'
        })
      };
      
      // Stub getInstance methods
      sandbox.stub(require('../../../../src/observers/prism'), 'PRISM').value({
        getInstance: () => prismStub
      });
      
      sandbox.stub(require('../../../../src/observers/vigil'), 'VIGIL').value({
        getInstance: () => vigilStub
      });
      
      sandbox.stub(require('../../../../src/modules/governance_identity'), 'GovernanceIdentity').value({
        getInstance: () => governanceStub
      });
      
      // Create AgentScorecard instance
      agentScorecard = new AgentScorecard(testConfig);
      
      // Stub internal methods
      sandbox.stub(agentScorecard.scorecardManager, 'storeScorecard').resolves(true);
      sandbox.stub(agentScorecard.trustLineageTracker, 'updateLineage').resolves(true);
    });
    
    it('should calculate correct trust score components', function() {
      // Test governance score
      const governanceScore = agentScorecard._calculateGovernanceScore({
        type: 'promethios',
        compliance_level: 'full'
      });
      
      expect(governanceScore).to.be.closeTo(1.0, 0.01);
      
      const externalScore = agentScorecard._calculateGovernanceScore({
        type: 'external_verified',
        compliance_level: 'partial'
      });
      
      expect(externalScore).to.be.lessThan(governanceScore);
      
      // Test reflection score
      const reflectionScore = agentScorecard._calculateReflectionScore({
        reflection: { compliance_percentage: 85 }
      });
      
      expect(reflectionScore).to.equal(0.85);
      
      // Test belief trace score
      const beliefTraceScore = agentScorecard._calculateBeliefTraceScore({
        beliefTrace: { integrity_percentage: 90 }
      });
      
      expect(beliefTraceScore).to.equal(0.9);
      
      // Test trust decay score
      const trustDecayScore = agentScorecard._calculateTrustDecayScore({
        trustDecay: { decay_percentage: 5 }
      });
      
      expect(trustDecayScore).to.equal(0.95);
    });
    
    it('should generate scorecard with correct trust score', async function() {
      const scorecard = await agentScorecard.generateScorecard('test-agent');
      
      expect(scorecard.trust_score).to.be.a('number');
      expect(scorecard.trust_score).to.be.greaterThan(0.8); // High score for Promethios governance
      
      // Verify component calls
      expect(governanceStub.getIdentity.calledOnce).to.be.true;
      expect(prismStub.getAgentMetrics.calledOnce).to.be.true;
      expect(vigilStub.getAgentMetrics.calledOnce).to.be.true;
    });
    
    it('should verify delegation requirements', function() {
      // Valid delegation
      const isValid = agentScorecard._verifyDelegationRequirements(
        { trust_score: 0.9, governance_identity: { type: 'promethios' } },
        { trust_score: 0.8, governance_identity: { type: 'external_verified' } }
      );
      
      expect(isValid).to.be.true;
      
      // Source has null trust score
      const nullSource = agentScorecard._verifyDelegationRequirements(
        { trust_score: null, governance_identity: { type: 'unknown' } },
        { trust_score: 0.8, governance_identity: { type: 'external_verified' } }
      );
      
      expect(nullSource).to.be.false;
      
      // Source has low trust score
      const lowTrust = agentScorecard._verifyDelegationRequirements(
        { trust_score: 0.3, governance_identity: { type: 'promethios' } },
        { trust_score: 0.8, governance_identity: { type: 'external_verified' } }
      );
      
      expect(lowTrust).to.be.false;
      
      // Target has unknown governance
      const unknownTarget = agentScorecard._verifyDelegationRequirements(
        { trust_score: 0.9, governance_identity: { type: 'promethios' } },
        { trust_score: null, governance_identity: { type: 'unknown' } }
      );
      
      expect(unknownTarget).to.be.false;
    });
  });
});
