/**
 * Unit tests for the Confidence Calculator component of the Confidence Scoring module
 * 
 * @jest
 */

const { ConfidenceScoring } = require('../../../../src/modules/confidence_scoring');

// Mock dependencies
jest.mock('../../../../src/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('Confidence Calculator', () => {
  let confidenceScoring;
  let mockBeliefTraceManager;
  
  beforeEach(() => {
    // Mock belief trace manager
    mockBeliefTraceManager = {
      getTrace: jest.fn((traceId) => ({ id: traceId, verified: true })),
      verifyTrace: jest.fn(() => ({ confidence: 0.9 }))
    };
    
    // Initialize confidence scoring module
    confidenceScoring = new ConfidenceScoring({
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      beliefTraceManager: mockBeliefTraceManager,
      config: {
        defaultAlgorithm: 'weighted',
        thresholds: {
          critical: 0.8,
          standard: 0.6,
          informational: 0.4
        }
      }
    });
  });
  
  describe('calculateConfidence', () => {
    test('should calculate confidence score using weighted algorithm', () => {
      // Arrange
      const decisionId = 'decision-123';
      const evidenceItems = [
        {
          id: 'evidence-1',
          type: 'source',
          content: { text: 'Evidence 1' },
          weight: 0.8,
          quality: 0.7
        },
        {
          id: 'evidence-2',
          type: 'reasoning',
          content: { text: 'Evidence 2' },
          weight: 0.6,
          quality: 0.9
        }
      ];
      
      // Act
      const result = confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.confidenceScore).toBeDefined();
      expect(result.evidenceMap).toBeDefined();
      expect(result.confidenceScore.value).toBeGreaterThan(0);
      expect(result.confidenceScore.value).toBeLessThanOrEqual(1);
      expect(result.confidenceScore.algorithm).toBe('weighted');
      expect(result.evidenceMap.decisionId).toBe(decisionId);
    });
    
    test('should calculate confidence score using bayesian algorithm', () => {
      // Arrange
      const decisionId = 'decision-123';
      const evidenceItems = [
        {
          id: 'evidence-1',
          type: 'source',
          content: { text: 'Evidence 1' },
          weight: 0.8,
          quality: 0.7
        }
      ];
      const options = { algorithm: 'bayesian' };
      
      // Act
      const result = confidenceScoring.calculateConfidence(decisionId, evidenceItems, options);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.confidenceScore).toBeDefined();
      expect(result.confidenceScore.algorithm).toBe('bayesian');
    });
    
    test('should calculate confidence score using average algorithm', () => {
      // Arrange
      const decisionId = 'decision-123';
      const evidenceItems = [
        {
          id: 'evidence-1',
          type: 'source',
          content: { text: 'Evidence 1' },
          weight: 0.8,
          quality: 0.7
        }
      ];
      const options = { algorithm: 'average' };
      
      // Act
      const result = confidenceScoring.calculateConfidence(decisionId, evidenceItems, options);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.confidenceScore).toBeDefined();
      expect(result.confidenceScore.algorithm).toBe('average');
    });
    
    test('should throw error for unknown algorithm', () => {
      // Arrange
      const decisionId = 'decision-123';
      const evidenceItems = [
        {
          id: 'evidence-1',
          type: 'source',
          content: { text: 'Evidence 1' },
          weight: 0.8,
          quality: 0.7
        }
      ];
      const options = { algorithm: 'unknown' };
      
      // Act & Assert
      expect(() => {
        confidenceScoring.calculateConfidence(decisionId, evidenceItems, options);
      }).toThrow(/Unknown confidence algorithm/);
    });
    
    test('should validate evidence items', () => {
      // Arrange
      const decisionId = 'decision-123';
      const evidenceItems = [
        {
          // No ID provided, should be generated
          type: 'source',
          content: { text: 'Evidence 1' },
          // No weight provided, should default to 1.0
          quality: 0.7
        },
        {
          id: 'evidence-2',
          type: 'reasoning',
          content: { text: 'Evidence 2' },
          weight: 0.6,
          // No quality provided, should default to 0.5
          traceId: 'trace-123'
        }
      ];
      
      // Act
      const result = confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.evidenceMap.rootEvidence).toHaveLength(2);
      expect(result.evidenceMap.rootEvidence[0].id).toBeDefined();
      expect(result.evidenceMap.rootEvidence[0].weight).toBe(1.0);
      expect(result.evidenceMap.rootEvidence[1].quality).toBeDefined();
      
      // Verify trace validation was called
      expect(mockBeliefTraceManager.getTrace).toHaveBeenCalledWith('trace-123');
      expect(mockBeliefTraceManager.verifyTrace).toHaveBeenCalled();
    });
  });
  
  describe('updateConfidence', () => {
    test('should update confidence with new evidence', () => {
      // Arrange
      const decisionId = 'decision-123';
      const initialEvidence = [
        {
          id: 'evidence-1',
          type: 'source',
          content: { text: 'Evidence 1' },
          weight: 0.8,
          quality: 0.7
        }
      ];
      
      const newEvidence = [
        {
          id: 'evidence-2',
          type: 'reasoning',
          content: { text: 'Evidence 2' },
          weight: 0.6,
          quality: 0.9
        }
      ];
      
      // First calculate initial confidence
      const initialResult = confidenceScoring.calculateConfidence(decisionId, initialEvidence);
      const initialConfidence = initialResult.confidenceScore.value;
      
      // Act
      const updatedResult = confidenceScoring.updateConfidence(decisionId, newEvidence);
      
      // Assert
      expect(updatedResult).toBeDefined();
      expect(updatedResult.confidenceScore).toBeDefined();
      expect(updatedResult.evidenceMap).toBeDefined();
      expect(updatedResult.confidenceScore.value).not.toBe(initialConfidence);
      expect(updatedResult.evidenceMap.rootEvidence.length).toBeGreaterThan(initialResult.evidenceMap.rootEvidence.length);
    });
    
    test('should throw error when updating non-existent decision', () => {
      // Arrange
      const decisionId = 'non-existent-decision';
      const newEvidence = [
        {
          id: 'evidence-1',
          type: 'source',
          content: { text: 'Evidence 1' },
          weight: 0.8,
          quality: 0.7
        }
      ];
      
      // Act & Assert
      expect(() => {
        confidenceScoring.updateConfidence(decisionId, newEvidence);
      }).toThrow(/No existing confidence score found/);
    });
  });
  
  describe('meetsThreshold', () => {
    test('should return true when confidence meets threshold', () => {
      // Arrange
      const decisionId = 'decision-123';
      const highQualityEvidence = [
        {
          id: 'evidence-1',
          type: 'source',
          content: { text: 'High quality evidence' },
          weight: 1.0,
          quality: 0.9
        }
      ];
      
      // Calculate confidence
      const result = confidenceScoring.calculateConfidence(decisionId, highQualityEvidence);
      
      // Act
      const meetsStandard = confidenceScoring.meetsThreshold(result.confidenceScore, 'standard');
      
      // Assert
      expect(meetsStandard).toBe(true);
    });
    
    test('should return false when confidence does not meet threshold', () => {
      // Arrange
      const decisionId = 'decision-123';
      const lowQualityEvidence = [
        {
          id: 'evidence-1',
          type: 'source',
          content: { text: 'Low quality evidence' },
          weight: 0.5,
          quality: 0.3
        }
      ];
      
      // Calculate confidence
      const result = confidenceScoring.calculateConfidence(decisionId, lowQualityEvidence);
      
      // Act
      const meetsCritical = confidenceScoring.meetsThreshold(result.confidenceScore, 'critical');
      
      // Assert
      expect(meetsCritical).toBe(false);
    });
  });
});
