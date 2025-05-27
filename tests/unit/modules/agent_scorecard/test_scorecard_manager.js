/**
 * Unit Tests for Scorecard Manager
 * 
 * Tests the functionality of the ScorecardManager class for creating,
 * storing, and retrieving agent scorecards.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const ScorecardManager = require('../../../../src/modules/agent_scorecard/scorecard_manager');

describe('ScorecardManager', function() {
  let scorecardManager;
  let sandbox;
  let testConfig;
  
  before(function() {
    // Create test directories
    const testDir = path.join(process.cwd(), 'test_data', 'scorecard_manager_test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    testConfig = {
      storageDir: path.join(testDir, 'scorecards'),
      schemaPath: path.join(testDir, 'schemas', 'agent_scorecard.schema.v1.json')
    };
    
    // Create schema directory and file
    const schemaDir = path.dirname(testConfig.schemaPath);
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
    }
    
    // Create a minimal schema for testing
    const schema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["agent_id", "scorecard_id", "timestamp", "governance_identity", "cryptographic_proof"]
    };
    
    fs.writeFileSync(testConfig.schemaPath, JSON.stringify(schema));
  });
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    scorecardManager = new ScorecardManager(testConfig);
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('createScorecard', function() {
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
      
      // Stub the validate method to always return true
      sandbox.stub(scorecardManager.validate, 'call').returns(true);
      
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
    
    it('should throw an error if scorecard is invalid', function() {
      // Stub the validate method to return false with errors
      sandbox.stub(scorecardManager.validate, 'call').returns(false);
      scorecardManager.validate.errors = [{ message: 'Invalid scorecard' }];
      
      expect(() => {
        scorecardManager.createScorecard(
          'test-agent',
          { type: 'unknown' },
          null,
          {},
          {}
        );
      }).to.throw(/Invalid scorecard/);
    });
  });
  
  describe('_calculateReflectionCompliance', function() {
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
      const reflectionCompliance = scorecardManager._calculateReflectionCompliance(null);
      
      expect(reflectionCompliance.percentage).to.equal(0);
      expect(reflectionCompliance.total_reflections).to.equal(0);
      expect(reflectionCompliance.compliant_reflections).to.equal(0);
    });
  });
  
  describe('_calculateBeliefTraceIntegrity', function() {
    it('should calculate correct belief trace integrity', function() {
      const beliefTraceIntegrity = scorecardManager._calculateBeliefTraceIntegrity({
        beliefTrace: {
          total_outputs: 200,
          verified_outputs: 180,
          integrity_percentage: 90
        }
      });
      
      expect(beliefTraceIntegrity.percentage).to.equal(90);
      expect(beliefTraceIntegrity.total_outputs).to.equal(200);
      expect(beliefTraceIntegrity.verified_outputs).to.equal(180);
    });
    
    it('should handle missing metrics gracefully', function() {
      const beliefTraceIntegrity = scorecardManager._calculateBeliefTraceIntegrity(null);
      
      expect(beliefTraceIntegrity.percentage).to.equal(0);
      expect(beliefTraceIntegrity.total_outputs).to.equal(0);
      expect(beliefTraceIntegrity.verified_outputs).to.equal(0);
    });
  });
  
  describe('_getViolationHistory', function() {
    it('should process violation history correctly', function() {
      const violations = [
        {
          timestamp: new Date().toISOString(),
          type: 'reflection_skip',
          description: 'Skipped reflection step',
          severity: 'minor'
        },
        {
          timestamp: new Date().toISOString(),
          type: 'belief_trace_incomplete',
          description: 'Incomplete belief trace',
          severity: 'warning'
        }
      ];
      
      const violationHistory = scorecardManager._getViolationHistory('test-agent', {
        violations: violations
      });
      
      expect(violationHistory.count).to.equal(2);
      expect(violationHistory.categories).to.have.property('reflection_skip');
      expect(violationHistory.categories).to.have.property('belief_trace_incomplete');
      expect(violationHistory.recent_violations).to.have.lengthOf(2);
    });
    
    it('should handle missing violations gracefully', function() {
      const violationHistory = scorecardManager._getViolationHistory('test-agent', null);
      
      expect(violationHistory.count).to.equal(0);
      expect(violationHistory.categories).to.deep.equal({});
      expect(violationHistory.recent_violations).to.have.lengthOf(0);
    });
  });
  
  describe('_determineWarningState', function() {
    it('should return severe warning for unknown governance', function() {
      const warningState = scorecardManager._determineWarningState(
        { type: 'unknown' },
        null
      );
      
      expect(warningState.has_warning).to.be.true;
      expect(warningState.warning_level).to.equal('severe');
    });
    
    it('should return warning for external unverified governance', function() {
      const warningState = scorecardManager._determineWarningState(
        { type: 'external_unverified' },
        0.7
      );
      
      expect(warningState.has_warning).to.be.true;
      expect(warningState.warning_level).to.equal('warning');
    });
    
    it('should return caution for low trust score', function() {
      const warningState = scorecardManager._determineWarningState(
        { type: 'promethios' },
        0.5
      );
      
      expect(warningState.has_warning).to.be.true;
      expect(warningState.warning_level).to.equal('caution');
    });
    
    it('should return no warning for good governance and trust score', function() {
      const warningState = scorecardManager._determineWarningState(
        { type: 'promethios' },
        0.9
      );
      
      expect(warningState.has_warning).to.be.false;
      expect(warningState.warning_level).to.equal('none');
    });
  });
  
  describe('storeScorecard', function() {
    it('should store scorecard and update latest pointer', async function() {
      const scorecard = {
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123',
        timestamp: new Date().toISOString(),
        governance_identity: { type: 'promethios' },
        cryptographic_proof: {}
      };
      
      // Stub fs methods
      const writeFileStub = sandbox.stub(fs, 'writeFileSync');
      const mkdirStub = sandbox.stub(fs, 'mkdirSync');
      const existsStub = sandbox.stub(fs, 'existsSync').returns(false);
      
      // Stub _updateHistoryIndex
      const updateHistoryStub = sandbox.stub(scorecardManager, '_updateHistoryIndex').resolves();
      
      const result = await scorecardManager.storeScorecard(scorecard);
      
      expect(result).to.be.true;
      expect(mkdirStub.calledOnce).to.be.true;
      expect(writeFileStub.calledTwice).to.be.true;
      expect(updateHistoryStub.calledOnce).to.be.true;
    });
  });
  
  describe('getLatestScorecard', function() {
    it('should return null if no scorecard exists', async function() {
      // Stub fs.existsSync to return false
      sandbox.stub(fs, 'existsSync').returns(false);
      
      const scorecard = await scorecardManager.getLatestScorecard('test-agent');
      
      expect(scorecard).to.be.null;
    });
    
    it('should return the latest scorecard if it exists', async function() {
      const testScorecard = {
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123'
      };
      
      // Stub fs methods
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(testScorecard));
      
      const scorecard = await scorecardManager.getLatestScorecard('test-agent');
      
      expect(scorecard).to.deep.equal(testScorecard);
    });
  });
});
