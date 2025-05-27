/**
 * Unit tests for the Learning Memory component
 * 
 * @module tests/unit/modules/adaptive_learning_loop/test_learning_memory
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const { LearningMemory } = require('../../../../src/modules/adaptive_learning_loop/learning_memory');

describe('Learning Memory', () => {
  let learningMemory;
  let mockLogger;
  let mockFs;
  let tempDataPath;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      debug: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create temp data path
    tempDataPath = path.join(__dirname, 'temp_data');
    
    // Mock fs methods
    mockFs = {
      existsSync: sinon.stub(fs, 'existsSync').returns(false),
      mkdirSync: sinon.stub(fs, 'mkdirSync'),
      readdirSync: sinon.stub(fs, 'readdirSync').returns([]),
      writeFileSync: sinon.stub(fs, 'writeFileSync')
    };
    
    // Create learning memory instance
    learningMemory = new LearningMemory({
      logger: mockLogger,
      dataPath: tempDataPath,
      config: {
        retentionPeriod: 30 * 24 * 60 * 60 * 1000,
        temporalDecayFactor: 0.9,
        persistenceInterval: 0, // Disable auto-persistence
        merkleVerification: true
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
    
    // Clean up any timers
    if (learningMemory.persistenceTimer) {
      clearInterval(learningMemory.persistenceTimer);
    }
  });
  
  describe('constructor', () => {
    it('should initialize with default config when none provided', () => {
      const defaultMemory = new LearningMemory();
      expect(defaultMemory).to.be.an('object');
      expect(defaultMemory.config).to.be.an('object');
      expect(defaultMemory.feedback).to.be.an('object');
      expect(defaultMemory.patterns).to.be.an('object');
      expect(defaultMemory.adaptations).to.be.an('object');
    });
    
    it('should initialize with provided config', () => {
      expect(learningMemory.config.retentionPeriod).to.equal(30 * 24 * 60 * 60 * 1000);
      expect(learningMemory.config.temporalDecayFactor).to.equal(0.9);
    });
    
    it('should initialize data directory', () => {
      expect(mockFs.mkdirSync.called).to.be.true;
      expect(mockFs.mkdirSync.firstCall.args[0]).to.equal(tempDataPath);
    });
    
    it('should initialize merkle trees', () => {
      expect(learningMemory.merkleTrees).to.be.an('object');
      expect(learningMemory.merkleTrees.feedback).to.be.an('object');
      expect(learningMemory.merkleTrees.patterns).to.be.an('object');
      expect(learningMemory.merkleTrees.adaptations).to.be.an('object');
    });
    
    it('should set up persistence timer if interval > 0', () => {
      const memoryWithPersistence = new LearningMemory({
        logger: mockLogger,
        dataPath: tempDataPath,
        config: {
          persistenceInterval: 1000
        }
      });
      
      expect(memoryWithPersistence.persistenceTimer).to.not.be.undefined;
      
      // Clean up
      clearInterval(memoryWithPersistence.persistenceTimer);
    });
  });
  
  describe('storeFeedback', () => {
    it('should store valid feedback', () => {
      const feedback = {
        id: '123',
        source: { type: 'user' },
        content: { text: 'Feedback' }
      };
      
      const result = learningMemory.storeFeedback(feedback);
      
      expect(result).to.equal(feedback);
      expect(learningMemory.feedback.get('123')).to.equal(feedback);
      expect(feedback.metadata.stored_at).to.be.a('string');
    });
    
    it('should throw error for invalid feedback', () => {
      expect(() => learningMemory.storeFeedback(null)).to.throw('Invalid feedback record');
      expect(() => learningMemory.storeFeedback({})).to.throw('Invalid feedback record');
    });
    
    it('should update merkle tree', () => {
      const updateMerkleTreeSpy = sinon.spy(learningMemory, 'updateMerkleTree');
      
      const feedback = {
        id: '123',
        source: { type: 'user' },
        content: { text: 'Feedback' }
      };
      
      learningMemory.storeFeedback(feedback);
      
      expect(updateMerkleTreeSpy.calledOnce).to.be.true;
      expect(updateMerkleTreeSpy.firstCall.args[0]).to.equal('feedback');
      expect(updateMerkleTreeSpy.firstCall.args[1]).to.equal(feedback);
    });
  });
  
  describe('getFeedback', () => {
    it('should retrieve stored feedback', () => {
      const feedback = {
        id: '123',
        source: { type: 'user' },
        content: { text: 'Feedback' }
      };
      
      learningMemory.storeFeedback(feedback);
      
      const result = learningMemory.getFeedback('123');
      
      expect(result).to.equal(feedback);
    });
    
    it('should return null for non-existent feedback', () => {
      const result = learningMemory.getFeedback('non-existent');
      
      expect(result).to.be.null;
    });
  });
  
  describe('getRecentFeedback', () => {
    beforeEach(() => {
      // Store some test feedback
      for (let i = 0; i < 5; i++) {
        learningMemory.storeFeedback({
          id: `user_${i}`,
          timestamp: new Date(2023, 0, i + 1).toISOString(),
          source: { type: 'user' },
          content: { text: `User feedback ${i}` },
          context: { task_id: `task_${i % 2}` }
        });
        
        learningMemory.storeFeedback({
          id: `system_${i}`,
          timestamp: new Date(2023, 0, i + 1).toISOString(),
          source: { type: 'system' },
          content: { text: `System feedback ${i}` },
          context: { task_id: `task_${i % 2}` }
        });
      }
    });
    
    it('should retrieve recent feedback with default limit', () => {
      const result = learningMemory.getRecentFeedback();
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.at.most(100);
      expect(result.length).to.equal(10); // 5 user + 5 system
    });
    
    it('should respect limit parameter', () => {
      const result = learningMemory.getRecentFeedback(5);
      
      expect(result.length).to.equal(5);
    });
    
    it('should filter by source type', () => {
      const result = learningMemory.getRecentFeedback(100, { sourceType: 'user' });
      
      expect(result.length).to.equal(5);
      expect(result.every(f => f.source.type === 'user')).to.be.true;
    });
    
    it('should filter by context', () => {
      const result = learningMemory.getRecentFeedback(100, { contextFilter: { task_id: 'task_0' } });
      
      expect(result.length).to.equal(5);
      expect(result.every(f => f.context.task_id === 'task_0')).to.be.true;
    });
    
    it('should filter by timestamp', () => {
      const result = learningMemory.getRecentFeedback(100, { since: new Date(2023, 0, 3).toISOString() });
      
      expect(result.length).to.equal(6); // 3 days * 2 types
      expect(result.every(f => new Date(f.timestamp) >= new Date(2023, 0, 3))).to.be.true;
    });
    
    it('should sort by timestamp (newest first)', () => {
      const result = learningMemory.getRecentFeedback();
      
      for (let i = 0; i < result.length - 1; i++) {
        expect(new Date(result[i].timestamp) >= new Date(result[i + 1].timestamp)).to.be.true;
      }
    });
  });
  
  describe('storePattern', () => {
    it('should store valid pattern', () => {
      const pattern = {
        id: '123',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        statistics: { significance: 0.8 }
      };
      
      const result = learningMemory.storePattern(pattern);
      
      expect(result).to.equal(pattern);
      expect(learningMemory.patterns.get('123')).to.equal(pattern);
      expect(pattern.metadata.stored_at).to.be.a('string');
    });
    
    it('should throw error for invalid pattern', () => {
      expect(() => learningMemory.storePattern(null)).to.throw('Invalid pattern');
      expect(() => learningMemory.storePattern({})).to.throw('Invalid pattern');
    });
    
    it('should update merkle tree', () => {
      const updateMerkleTreeSpy = sinon.spy(learningMemory, 'updateMerkleTree');
      
      const pattern = {
        id: '123',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        statistics: { significance: 0.8 }
      };
      
      learningMemory.storePattern(pattern);
      
      expect(updateMerkleTreeSpy.calledOnce).to.be.true;
      expect(updateMerkleTreeSpy.firstCall.args[0]).to.equal('patterns');
      expect(updateMerkleTreeSpy.firstCall.args[1]).to.equal(pattern);
    });
  });
  
  describe('getSignificantPatterns', () => {
    beforeEach(() => {
      // Store some test patterns
      for (let i = 0; i < 5; i++) {
        learningMemory.storePattern({
          id: `correlation_${i}`,
          discovery_timestamp: new Date(2023, 0, i + 1).toISOString(),
          type: 'correlation',
          elements: [{ factor: 'test', value: `value_${i}` }],
          statistics: { significance: 0.5 + (i * 0.1) }
        });
        
        learningMemory.storePattern({
          id: `causal_${i}`,
          discovery_timestamp: new Date(2023, 0, i + 1).toISOString(),
          type: 'causal',
          elements: [{ factor: 'test', value: `value_${i}` }],
          statistics: { significance: 0.5 + (i * 0.1) }
        });
      }
    });
    
    it('should retrieve patterns above threshold', () => {
      const result = learningMemory.getSignificantPatterns(0.7);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(6); // 3 correlation + 3 causal with significance >= 0.7
      expect(result.every(p => p.statistics.significance >= 0.7)).to.be.true;
    });
    
    it('should filter by pattern type', () => {
      const result = learningMemory.getSignificantPatterns(0.7, { patternType: 'correlation' });
      
      expect(result.length).to.equal(3);
      expect(result.every(p => p.type === 'correlation')).to.be.true;
    });
    
    it('should filter by timestamp', () => {
      const result = learningMemory.getSignificantPatterns(0.7, { since: new Date(2023, 0, 3).toISOString() });
      
      expect(result.length).to.equal(4); // 2 days * 2 types with significance >= 0.7
      expect(result.every(p => new Date(p.discovery_timestamp) >= new Date(2023, 0, 3))).to.be.true;
    });
    
    it('should sort by significance (highest first)', () => {
      const result = learningMemory.getSignificantPatterns(0.5);
      
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].statistics.significance >= result[i + 1].statistics.significance).to.be.true;
      }
    });
    
    it('should respect limit parameter', () => {
      const result = learningMemory.getSignificantPatterns(0.5, { limit: 3 });
      
      expect(result.length).to.equal(3);
    });
  });
  
  describe('storeAdaptation', () => {
    it('should store valid adaptation', () => {
      const adaptation = {
        id: '123',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 }
      };
      
      const result = learningMemory.storeAdaptation(adaptation);
      
      expect(result).to.equal(adaptation);
      expect(learningMemory.adaptations.get('123')).to.equal(adaptation);
      expect(adaptation.metadata.stored_at).to.be.a('string');
      expect(adaptation.status).to.equal('pending');
    });
    
    it('should throw error for invalid adaptation', () => {
      expect(() => learningMemory.storeAdaptation(null)).to.throw('Invalid adaptation');
      expect(() => learningMemory.storeAdaptation({})).to.throw('Invalid adaptation');
    });
    
    it('should update merkle tree', () => {
      const updateMerkleTreeSpy = sinon.spy(learningMemory, 'updateMerkleTree');
      
      const adaptation = {
        id: '123',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 }
      };
      
      learningMemory.storeAdaptation(adaptation);
      
      expect(updateMerkleTreeSpy.calledOnce).to.be.true;
      expect(updateMerkleTreeSpy.firstCall.args[0]).to.equal('adaptations');
      expect(updateMerkleTreeSpy.firstCall.args[1]).to.equal(adaptation);
    });
  });
  
  describe('updateAdaptation', () => {
    it('should update existing adaptation', () => {
      const adaptation = {
        id: '123',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        status: 'pending'
      };
      
      learningMemory.storeAdaptation(adaptation);
      
      const updatedAdaptation = {
        id: '123',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        status: 'applied'
      };
      
      const result = learningMemory.updateAdaptation(updatedAdaptation);
      
      expect(result).to.equal(updatedAdaptation);
      expect(learningMemory.adaptations.get('123')).to.equal(updatedAdaptation);
      expect(updatedAdaptation.metadata.updated_at).to.be.a('string');
    });
    
    it('should throw error for non-existent adaptation', () => {
      const adaptation = {
        id: '123',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        status: 'applied'
      };
      
      expect(() => learningMemory.updateAdaptation(adaptation)).to.throw('Adaptation 123 not found');
    });
  });
  
  describe('getPendingAdaptations', () => {
    beforeEach(() => {
      // Store some test adaptations
      for (let i = 0; i < 5; i++) {
        learningMemory.storeAdaptation({
          id: `pending_${i}`,
          type: 'parameter',
          target: { parameter: 'threshold', target_value: 0.8 },
          status: 'pending',
          justification: { confidence: 0.5 + (i * 0.1) }
        });
        
        learningMemory.storeAdaptation({
          id: `applied_${i}`,
          type: 'parameter',
          target: { parameter: 'threshold', target_value: 0.8 },
          status: 'applied',
          justification: { confidence: 0.5 + (i * 0.1) }
        });
      }
    });
    
    it('should retrieve pending adaptations', () => {
      const result = learningMemory.getPendingAdaptations();
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(5);
      expect(result.every(a => a.status === 'pending')).to.be.true;
    });
    
    it('should sort by confidence (highest first)', () => {
      const result = learningMemory.getPendingAdaptations();
      
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].justification.confidence >= result[i + 1].justification.confidence).to.be.true;
      }
    });
    
    it('should respect limit parameter', () => {
      const result = learningMemory.getPendingAdaptations(3);
      
      expect(result.length).to.equal(3);
    });
  });
  
  describe('merkle tree operations', () => {
    it('should create leaf hash', () => {
      const data = { id: '123', content: 'test' };
      
      const hash = learningMemory.createLeafHash(data);
      
      expect(hash).to.be.a('string');
      expect(hash.length).to.equal(64); // SHA-256 hash length
    });
    
    it('should calculate root hash', () => {
      const leaves = new Map();
      leaves.set('1', 'hash1');
      leaves.set('2', 'hash2');
      
      const rootHash = learningMemory.calculateRootHash(leaves);
      
      expect(rootHash).to.be.a('string');
      expect(rootHash.length).to.equal(64); // SHA-256 hash length
    });
    
    it('should return null root hash for empty leaves', () => {
      const leaves = new Map();
      
      const rootHash = learningMemory.calculateRootHash(leaves);
      
      expect(rootHash).to.be.null;
    });
    
    it('should verify integrity', () => {
      // Add some data
      learningMemory.storeFeedback({
        id: '123',
        source: { type: 'user' },
        content: { text: 'Feedback' }
      });
      
      learningMemory.storePattern({
        id: '456',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        statistics: { significance: 0.8 }
      });
      
      const result = learningMemory.verifyIntegrity();
      
      expect(result.verified).to.be.true;
      expect(result.details).to.be.an('object');
      expect(result.details.feedback.verified).to.be.true;
      expect(result.details.patterns.verified).to.be.true;
    });
  });
  
  describe('persistData', () => {
    it('should persist data to storage', () => {
      // Add some data
      learningMemory.storeFeedback({
        id: '123',
        source: { type: 'user' },
        content: { text: 'Feedback' }
      });
      
      learningMemory.storePattern({
        id: '456',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        statistics: { significance: 0.8 }
      });
      
      learningMemory.persistData();
      
      expect(mockFs.writeFileSync.called).to.be.true;
    });
  });
  
  describe('clearDomain', () => {
    beforeEach(() => {
      // Store some test data with domains
      learningMemory.storeFeedback({
        id: 'f1',
        source: { type: 'user' },
        content: { text: 'Feedback' },
        context: { domain: 'domain1' }
      });
      
      learningMemory.storeFeedback({
        id: 'f2',
        source: { type: 'user' },
        content: { text: 'Feedback' },
        context: { domain: 'domain2' }
      });
      
      learningMemory.storePattern({
        id: 'p1',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        statistics: { significance: 0.8 },
        domain: 'domain1'
      });
      
      learningMemory.storePattern({
        id: 'p2',
        type: 'correlation',
        elements: [{ factor: 'test', value: 'value' }],
        statistics: { significance: 0.8 },
        domain: 'domain2'
      });
      
      learningMemory.storeAdaptation({
        id: 'a1',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        domain: 'domain1'
      });
      
      learningMemory.storeAdaptation({
        id: 'a2',
        type: 'parameter',
        target: { parameter: 'threshold', target_value: 0.8 },
        domain: 'domain2'
      });
    });
    
    it('should clear data for specified domain', () => {
      const result = learningMemory.clearDomain('domain1');
      
      expect(result.domain).to.equal('domain1');
      expect(result.feedbackRemoved).to.equal(1);
      expect(result.patternsRemoved).to.equal(1);
      expect(result.adaptationsRemoved).to.equal(1);
      
      expect(learningMemory.feedback.has('f1')).to.be.false;
      expect(learningMemory.feedback.has('f2')).to.be.true;
      expect(learningMemory.patterns.has('p1')).to.be.false;
      expect(learningMemory.patterns.has('p2')).to.be.true;
      expect(learningMemory.adaptations.has('a1')).to.be.false;
      expect(learningMemory.adaptations.has('a2')).to.be.true;
    });
    
    it('should throw error if domain is not provided', () => {
      expect(() => learningMemory.clearDomain()).to.throw('Domain is required');
    });
  });
  
  describe('cleanup', () => {
    it('should clean up resources', () => {
      const memoryWithPersistence = new LearningMemory({
        logger: mockLogger,
        dataPath: tempDataPath,
        config: {
          persistenceInterval: 1000
        }
      });
      
      const persistDataSpy = sinon.spy(memoryWithPersistence, 'persistData');
      
      memoryWithPersistence.cleanup();
      
      expect(persistDataSpy.calledOnce).to.be.true;
      expect(memoryWithPersistence.persistenceTimer).to.be.undefined;
    });
  });
});
