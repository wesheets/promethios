/**
 * Unit Tests for Cryptographic Verifier
 * 
 * Tests the functionality of the CryptographicVerifier class for signing
 * and verifying agent scorecards and trust lineage records.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CryptographicVerifier = require('../../../../src/modules/agent_scorecard/cryptographic_verifier');

describe('CryptographicVerifier', function() {
  let cryptographicVerifier;
  let sandbox;
  let testConfig;
  
  before(function() {
    // Create test directories
    const testDir = path.join(process.cwd(), 'test_data', 'crypto_verifier_test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    testConfig = {
      keyDir: path.join(testDir, 'keys'),
      algorithm: 'ed25519',
      merkleVerification: true
    };
  });
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Stub fs methods to avoid actual file operations
    sandbox.stub(fs, 'existsSync').returns(false);
    sandbox.stub(fs, 'mkdirSync');
    
    // Stub crypto methods
    const keyPairStub = {
      publicKey: {
        export: () => Buffer.from('test-public-key')
      },
      privateKey: {
        export: () => Buffer.from('test-private-key')
      }
    };
    
    sandbox.stub(crypto, 'generateKeyPairSync').returns(keyPairStub);
    sandbox.stub(fs, 'writeFileSync');
    
    // Create test instance
    cryptographicVerifier = new CryptographicVerifier(testConfig);
    
    // Stub internal methods
    sandbox.stub(cryptographicVerifier, '_sign').returns('test-signature');
    sandbox.stub(cryptographicVerifier, '_verify').returns(true);
    sandbox.stub(cryptographicVerifier, '_calculateMerkleRoot').returns('test-merkle-root');
    sandbox.stub(cryptographicVerifier, '_getPublicKeyId').returns('test-public-key-id');
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('_initializeKeys', function() {
    it('should create keys if they do not exist', function() {
      cryptographicVerifier._initializeKeys();
      
      expect(fs.existsSync.calledOnce).to.be.true;
      expect(crypto.generateKeyPairSync.calledOnce).to.be.true;
      expect(fs.writeFileSync.calledOnce).to.be.true;
    });
    
    it('should not create keys if they already exist', function() {
      // Restore existsSync stub and make it return true
      fs.existsSync.restore();
      sandbox.stub(fs, 'existsSync').returns(true);
      
      cryptographicVerifier._initializeKeys();
      
      expect(fs.existsSync.calledOnce).to.be.true;
      expect(crypto.generateKeyPairSync.called).to.be.false;
      expect(fs.writeFileSync.called).to.be.false;
    });
  });
  
  describe('signScorecard', function() {
    it('should sign a scorecard correctly', async function() {
      const scorecard = {
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123',
        timestamp: new Date().toISOString(),
        governance_identity: {
          type: 'promethios',
          constitution_hash: '1234567890abcdef'
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
      
      const signedScorecard = await cryptographicVerifier.signScorecard(scorecard);
      
      expect(signedScorecard).to.be.an('object');
      expect(signedScorecard.cryptographic_proof.signature).to.equal('test-signature');
      expect(signedScorecard.cryptographic_proof.public_key_id).to.equal('test-public-key-id');
      expect(signedScorecard.cryptographic_proof.merkle_root).to.equal('test-merkle-root');
      expect(signedScorecard.cryptographic_proof.algorithm).to.equal('ed25519');
    });
  });
  
  describe('verifyScorecard', function() {
    it('should verify a valid scorecard', async function() {
      const scorecard = {
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123',
        cryptographic_proof: {
          signature: 'test-signature',
          public_key_id: 'test-public-key-id',
          merkle_root: 'test-merkle-root'
        }
      };
      
      const isValid = await cryptographicVerifier.verifyScorecard(scorecard);
      
      expect(isValid).to.be.true;
      expect(cryptographicVerifier._calculateMerkleRoot.calledOnce).to.be.true;
      expect(cryptographicVerifier._verify.calledOnce).to.be.true;
    });
    
    it('should reject a scorecard with invalid merkle root', async function() {
      // Restore _calculateMerkleRoot stub and make it return a different value
      cryptographicVerifier._calculateMerkleRoot.restore();
      sandbox.stub(cryptographicVerifier, '_calculateMerkleRoot').returns('different-merkle-root');
      
      // Restore _verify stub to ensure it's not called
      cryptographicVerifier._verify.restore();
      const verifyStub = sandbox.stub(cryptographicVerifier, '_verify');
      
      const scorecard = {
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123',
        cryptographic_proof: {
          signature: 'test-signature',
          public_key_id: 'test-public-key-id',
          merkle_root: 'test-merkle-root'
        }
      };
      
      const isValid = await cryptographicVerifier.verifyScorecard(scorecard);
      
      expect(isValid).to.be.false;
      expect(cryptographicVerifier._calculateMerkleRoot.calledOnce).to.be.true;
      expect(verifyStub.called).to.be.false;
    });
  });
  
  describe('signLineageRecord', function() {
    it('should sign a lineage record correctly', async function() {
      const lineageRecord = {
        lineage_id: 'test-lineage-123',
        source_agent: {
          agent_id: 'source-agent'
        },
        target_agent: {
          agent_id: 'target-agent'
        },
        cryptographic_proof: {
          signature: '',
          public_key_id: '',
          timestamp: new Date().toISOString(),
          algorithm: 'ed25519'
        }
      };
      
      const signedRecord = await cryptographicVerifier.signLineageRecord(lineageRecord);
      
      expect(signedRecord).to.be.an('object');
      expect(signedRecord.cryptographic_proof.signature).to.equal('test-signature');
      expect(signedRecord.cryptographic_proof.public_key_id).to.equal('test-public-key-id');
      expect(signedRecord.cryptographic_proof.algorithm).to.equal('ed25519');
    });
  });
  
  describe('verifyLineageRecord', function() {
    it('should verify a valid lineage record', async function() {
      const lineageRecord = {
        lineage_id: 'test-lineage-123',
        source_agent: {
          agent_id: 'source-agent'
        },
        target_agent: {
          agent_id: 'target-agent'
        },
        cryptographic_proof: {
          signature: 'test-signature',
          public_key_id: 'test-public-key-id'
        }
      };
      
      const isValid = await cryptographicVerifier.verifyLineageRecord(lineageRecord);
      
      expect(isValid).to.be.true;
      expect(cryptographicVerifier._verify.calledOnce).to.be.true;
    });
  });
  
  describe('_calculateHash', function() {
    it('should calculate hash correctly', function() {
      // Restore stub to test actual implementation
      cryptographicVerifier._calculateHash.restore?.();
      
      // Stub crypto.createHash
      const hashUpdateMock = {
        update: sinon.stub().returnsThis(),
        digest: sinon.stub().returns('test-hash')
      };
      sandbox.stub(crypto, 'createHash').returns(hashUpdateMock);
      
      const hash = cryptographicVerifier._calculateHash('test-data');
      
      expect(hash).to.equal('test-hash');
      expect(crypto.createHash.calledWith('sha256')).to.be.true;
      expect(hashUpdateMock.update.calledWith('test-data')).to.be.true;
      expect(hashUpdateMock.digest.calledWith('hex')).to.be.true;
    });
  });
  
  describe('_calculateMerkleRoot', function() {
    it('should calculate merkle root for a scorecard', function() {
      // Restore stub to test actual implementation
      cryptographicVerifier._calculateMerkleRoot.restore?.();
      
      // Stub _calculateHash
      sandbox.stub(cryptographicVerifier, '_calculateHash').returns('test-hash');
      
      const scorecard = {
        agent_id: 'test-agent',
        scorecard_id: 'test-scorecard-123'
      };
      
      const merkleRoot = cryptographicVerifier._calculateMerkleRoot(scorecard);
      
      expect(merkleRoot).to.equal('test-hash');
      expect(cryptographicVerifier._calculateHash.calledOnce).to.be.true;
    });
  });
});
