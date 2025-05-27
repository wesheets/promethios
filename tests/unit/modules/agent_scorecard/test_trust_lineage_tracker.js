/**
 * Unit Tests for Trust Lineage Tracker
 * 
 * Tests the functionality of the TrustLineageTracker class for managing
 * trust delegation between agents.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const TrustLineageTracker = require('../../../../src/modules/agent_scorecard/trust_lineage_tracker');

describe('TrustLineageTracker', function() {
  let trustLineageTracker;
  let sandbox;
  let testConfig;
  
  before(function() {
    // Create test directories
    const testDir = path.join(process.cwd(), 'test_data', 'trust_lineage_test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    testConfig = {
      storageDir: path.join(testDir, 'trust_lineage'),
      schemaPath: path.join(testDir, 'schemas', 'trust_lineage.schema.v1.json'),
      minDelegationScore: 0.6
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
      "required": ["lineage_id", "source_agent", "target_agent", "cryptographic_proof"]
    };
    
    fs.writeFileSync(testConfig.schemaPath, JSON.stringify(schema));
  });
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    trustLineageTracker = new TrustLineageTracker(testConfig);
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('_calculateDelegationScore', function() {
    it('should calculate correct delegation score for high trust agents', function() {
      const sourceScorecard = {
        trust_score: 0.9,
        governance_identity: {
          type: 'promethios',
          constitution_hash: '1234567890abcdef'
        }
      };
      
      const targetScorecard = {
        trust_score: 0.8,
        governance_identity: {
          type: 'promethios',
          constitution_hash: '1234567890abcdef'
        }
      };
      
      const score = trustLineageTracker._calculateDelegationScore(sourceScorecard, targetScorecard);
      
      expect(score).to.be.a('number');
      expect(score).to.be.greaterThan(0.8);
      expect(score).to.be.lessThanOrEqual(1.0);
    });
    
    it('should apply governance compatibility adjustments', function() {
      // Same governance type, different constitution
      const score1 = trustLineageTracker._calculateDelegationScore(
        {
          trust_score: 0.9,
          governance_identity: {
            type: 'promethios',
            constitution_hash: '1234'
          }
        },
        {
          trust_score: 0.8,
          governance_identity: {
            type: 'promethios',
            constitution_hash: '5678'
          }
        }
      );
      
      // Different governance type
      const score2 = trustLineageTracker._calculateDelegationScore(
        {
          trust_score: 0.9,
          governance_identity: {
            type: 'promethios',
            constitution_hash: '1234'
          }
        },
        {
          trust_score: 0.8,
          governance_identity: {
            type: 'external_verified',
            constitution_hash: '5678'
          }
        }
      );
      
      expect(score1).to.be.greaterThan(score2);
    });
    
    it('should handle null trust scores', function() {
      const score = trustLineageTracker._calculateDelegationScore(
        {
          trust_score: 0.9,
          governance_identity: {
            type: 'promethios',
            constitution_hash: '1234'
          }
        },
        {
          trust_score: null,
          governance_identity: {
            type: 'unknown',
            constitution_hash: '0000'
          }
        }
      );
      
      expect(score).to.equal(testConfig.minDelegationScore);
    });
  });
  
  describe('_verifyDelegationRequirements', function() {
    it('should accept valid delegation', function() {
      expect(() => {
        trustLineageTracker._verifyDelegationRequirements(
          {
            trust_score: 0.9,
            governance_identity: {
              type: 'promethios'
            }
          },
          {
            trust_score: 0.8,
            governance_identity: {
              type: 'external_verified'
            }
          }
        );
      }).to.not.throw();
    });
    
    it('should reject delegation from null trust score', function() {
      expect(() => {
        trustLineageTracker._verifyDelegationRequirements(
          {
            trust_score: null,
            governance_identity: {
              type: 'unknown'
            }
          },
          {
            trust_score: 0.8,
            governance_identity: {
              type: 'external_verified'
            }
          }
        );
      }).to.throw(/null trust score/);
    });
    
    it('should reject delegation from low trust score', function() {
      expect(() => {
        trustLineageTracker._verifyDelegationRequirements(
          {
            trust_score: 0.3,
            governance_identity: {
              type: 'promethios'
            }
          },
          {
            trust_score: 0.8,
            governance_identity: {
              type: 'external_verified'
            }
          }
        );
      }).to.throw(/below minimum threshold/);
    });
    
    it('should reject delegation to unknown governance', function() {
      expect(() => {
        trustLineageTracker._verifyDelegationRequirements(
          {
            trust_score: 0.9,
            governance_identity: {
              type: 'promethios'
            }
          },
          {
            trust_score: null,
            governance_identity: {
              type: 'unknown'
            }
          }
        );
      }).to.throw(/unknown governance/);
    });
  });
  
  describe('_buildDelegationChain', function() {
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
    
    it('should handle empty records', function() {
      const chain = trustLineageTracker._buildDelegationChain('agent-1', [], []);
      
      expect(chain).to.be.an('array');
      expect(chain.length).to.equal(0);
    });
  });
  
  describe('createLineageRecord', function() {
    it('should create a valid lineage record', async function() {
      // Stub methods
      sandbox.stub(trustLineageTracker, '_verifyDelegationRequirements').returns(true);
      sandbox.stub(trustLineageTracker, '_getLatestLineageForPair').resolves(null);
      sandbox.stub(trustLineageTracker, '_storeLineageRecord').resolves(true);
      sandbox.stub(trustLineageTracker.validate, 'call').returns(true);
      
      const sourceAgentId = 'source-agent';
      const targetAgentId = 'target-agent';
      const sourceScorecard = {
        agent_id: sourceAgentId,
        governance_identity: {
          type: 'promethios',
          constitution_hash: '1234'
        },
        trust_score: 0.9
      };
      const targetScorecard = {
        agent_id: targetAgentId,
        governance_identity: {
          type: 'external_verified',
          constitution_hash: '5678'
        },
        trust_score: 0.8
      };
      const context = {
        domain: 'test-domain',
        scope: ['read', 'write']
      };
      
      const lineageRecord = await trustLineageTracker.createLineageRecord(
        sourceAgentId,
        targetAgentId,
        sourceScorecard,
        targetScorecard,
        context
      );
      
      expect(lineageRecord).to.be.an('object');
      expect(lineageRecord.source_agent.agent_id).to.equal(sourceAgentId);
      expect(lineageRecord.target_agent.agent_id).to.equal(targetAgentId);
      expect(lineageRecord.trust_context.domain).to.equal('test-domain');
      expect(lineageRecord.trust_metrics.delegation_score).to.be.a('number');
    });
    
    it('should throw error if delegation requirements not met', async function() {
      // Stub methods to throw error
      sandbox.stub(trustLineageTracker, '_verifyDelegationRequirements').throws(
        new Error('Delegation requirements not met')
      );
      
      try {
        await trustLineageTracker.createLineageRecord(
          'source-agent',
          'target-agent',
          { trust_score: 0.5 },
          { trust_score: 0.8 }
        );
        
        // Should not reach here
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Delegation requirements not met');
      }
    });
  });
  
  describe('getLineageForAgent', function() {
    it('should combine source and target records', async function() {
      // Stub methods
      const sourceRecords = [{ id: 'source-1' }, { id: 'source-2' }];
      const targetRecords = [{ id: 'target-1' }];
      
      sandbox.stub(trustLineageTracker, 'getLineageBySource').resolves(sourceRecords);
      sandbox.stub(trustLineageTracker, 'getLineageByTarget').resolves(targetRecords);
      
      const lineage = await trustLineageTracker.getLineageForAgent('agent-1');
      
      expect(lineage).to.be.an('array');
      expect(lineage.length).to.equal(3);
    });
  });
  
  describe('_storeLineageRecord', function() {
    it('should store record in all required locations', async function() {
      // Stub fs methods
      const mkdirStub = sandbox.stub(fs, 'mkdirSync');
      const writeFileStub = sandbox.stub(fs, 'writeFileSync');
      const existsStub = sandbox.stub(fs, 'existsSync').returns(false);
      
      // Stub _updatePairIndex
      const updatePairStub = sandbox.stub(trustLineageTracker, '_updatePairIndex').resolves();
      
      const lineageRecord = {
        lineage_id: 'test-lineage-123',
        source_agent: {
          agent_id: 'source-agent'
        },
        target_agent: {
          agent_id: 'target-agent'
        }
      };
      
      await trustLineageTracker._storeLineageRecord(lineageRecord);
      
      // Should create 3 directories and write to 3 files
      expect(mkdirStub.callCount).to.equal(3);
      expect(writeFileStub.callCount).to.equal(3);
      expect(updatePairStub.calledOnce).to.be.true;
    });
  });
});
