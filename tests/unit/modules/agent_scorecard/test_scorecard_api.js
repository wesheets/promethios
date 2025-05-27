/**
 * Unit Tests for Scorecard API
 * 
 * Tests the functionality of the ScorecardAPI class for providing
 * public access to agent scorecards and verification services.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');
const request = require('supertest');

const ScorecardAPI = require('../../../../src/modules/agent_scorecard/scorecard_api');
const ScorecardManager = require('../../../../src/modules/agent_scorecard/scorecard_manager');
const TrustLineageTracker = require('../../../../src/modules/agent_scorecard/trust_lineage_tracker');
const CryptographicVerifier = require('../../../../src/modules/agent_scorecard/cryptographic_verifier');

describe('ScorecardAPI', function() {
  let scorecardAPI;
  let app;
  let sandbox;
  let scorecardManagerStub;
  let trustLineageTrackerStub;
  let cryptographicVerifierStub;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Create stubs for dependencies
    scorecardManagerStub = sandbox.createStubInstance(ScorecardManager);
    trustLineageTrackerStub = sandbox.createStubInstance(TrustLineageTracker);
    cryptographicVerifierStub = sandbox.createStubInstance(CryptographicVerifier);
    
    // Setup express app
    app = express();
    
    // Create test instance
    scorecardAPI = new ScorecardAPI({
      scorecardManager: scorecardManagerStub,
      trustLineageTracker: trustLineageTrackerStub,
      cryptographicVerifier: cryptographicVerifierStub
    });
    
    // Register routes
    scorecardAPI.registerRoutes(app);
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('GET /api/scorecard/:agentId', function() {
    it('should return agent scorecard', async function() {
      const agentId = 'test-agent';
      const mockScorecard = {
        agent_id: agentId,
        scorecard_id: 'test-scorecard-123',
        trust_score: 0.85
      };
      
      scorecardManagerStub.getLatestScorecard.resolves(mockScorecard);
      
      const response = await request(app)
        .get(`/api/scorecard/${agentId}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.deep.equal(mockScorecard);
      expect(scorecardManagerStub.getLatestScorecard.calledWith(agentId)).to.be.true;
    });
    
    it('should return 404 if scorecard not found', async function() {
      const agentId = 'nonexistent-agent';
      
      scorecardManagerStub.getLatestScorecard.resolves(null);
      
      await request(app)
        .get(`/api/scorecard/${agentId}`)
        .expect(404);
      
      expect(scorecardManagerStub.getLatestScorecard.calledWith(agentId)).to.be.true;
    });
  });
  
  describe('GET /api/scorecard/:agentId/history', function() {
    it('should return agent scorecard history', async function() {
      const agentId = 'test-agent';
      const mockHistory = [
        {
          scorecard_id: 'test-scorecard-123',
          timestamp: '2025-05-26T12:00:00Z',
          trust_score: 0.85
        },
        {
          scorecard_id: 'test-scorecard-122',
          timestamp: '2025-05-25T12:00:00Z',
          trust_score: 0.83
        }
      ];
      
      scorecardManagerStub.getScorecardHistory.resolves(mockHistory);
      
      const response = await request(app)
        .get(`/api/scorecard/${agentId}/history`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.deep.equal(mockHistory);
      expect(scorecardManagerStub.getScorecardHistory.calledWith(agentId)).to.be.true;
    });
    
    it('should return empty array if no history found', async function() {
      const agentId = 'new-agent';
      
      scorecardManagerStub.getScorecardHistory.resolves([]);
      
      const response = await request(app)
        .get(`/api/scorecard/${agentId}/history`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.be.an('array').that.is.empty;
      expect(scorecardManagerStub.getScorecardHistory.calledWith(agentId)).to.be.true;
    });
  });
  
  describe('GET /api/lineage/:agentId', function() {
    it('should return agent trust lineage', async function() {
      const agentId = 'test-agent';
      const mockLineage = [
        {
          lineage_id: 'test-lineage-123',
          source_agent: { agent_id: agentId },
          target_agent: { agent_id: 'target-agent' }
        }
      ];
      
      trustLineageTrackerStub.getLineageForAgent.resolves(mockLineage);
      
      const response = await request(app)
        .get(`/api/lineage/${agentId}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.deep.equal(mockLineage);
      expect(trustLineageTrackerStub.getLineageForAgent.calledWith(agentId)).to.be.true;
    });
  });
  
  describe('POST /api/verify/scorecard', function() {
    it('should verify valid scorecard', async function() {
      const mockScorecard = {
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123',
        cryptographic_proof: {
          signature: 'valid-signature'
        }
      };
      
      cryptographicVerifierStub.verifyScorecard.resolves(true);
      
      const response = await request(app)
        .post('/api/verify/scorecard')
        .send(mockScorecard)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.valid).to.be.true;
      expect(cryptographicVerifierStub.verifyScorecard.calledWith(mockScorecard)).to.be.true;
    });
    
    it('should reject invalid scorecard', async function() {
      const mockScorecard = {
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123',
        cryptographic_proof: {
          signature: 'invalid-signature'
        }
      };
      
      cryptographicVerifierStub.verifyScorecard.resolves(false);
      
      const response = await request(app)
        .post('/api/verify/scorecard')
        .send(mockScorecard)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.valid).to.be.false;
      expect(cryptographicVerifierStub.verifyScorecard.calledWith(mockScorecard)).to.be.true;
    });
    
    it('should return 400 for malformed request', async function() {
      await request(app)
        .post('/api/verify/scorecard')
        .send({}) // Empty object
        .expect(400);
      
      expect(cryptographicVerifierStub.verifyScorecard.called).to.be.false;
    });
  });
  
  describe('POST /api/verify/lineage', function() {
    it('should verify valid lineage record', async function() {
      const mockLineage = {
        lineage_id: 'test-lineage-123',
        source_agent: { agent_id: 'source-agent' },
        target_agent: { agent_id: 'target-agent' },
        cryptographic_proof: {
          signature: 'valid-signature'
        }
      };
      
      cryptographicVerifierStub.verifyLineageRecord.resolves(true);
      
      const response = await request(app)
        .post('/api/verify/lineage')
        .send(mockLineage)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.valid).to.be.true;
      expect(cryptographicVerifierStub.verifyLineageRecord.calledWith(mockLineage)).to.be.true;
    });
  });
});
