/**
 * Unit tests for the Evidence Mapper component of the Confidence Scoring module
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

describe('Evidence Mapper', () => {
  let confidenceScoring;
  
  beforeEach(() => {
    // Initialize confidence scoring module
    confidenceScoring = new ConfidenceScoring({
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
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
  
  describe('createEvidenceMap', () => {
    test('should create evidence map with root evidence', () => {
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
      expect(result.evidenceMap).toBeDefined();
      expect(result.evidenceMap.id).toBeDefined();
      expect(result.evidenceMap.decisionId).toBe(decisionId);
      expect(result.evidenceMap.rootEvidence).toHaveLength(2);
      expect(result.evidenceMap.rootEvidence[0].id).toBe('evidence-1');
      expect(result.evidenceMap.rootEvidence[1].id).toBe('evidence-2');
      expect(result.evidenceMap.relationships).toEqual([]);
      expect(result.evidenceMap.timestamp).toBeDefined();
    });
    
    test('should create evidence map with hierarchical relationships', () => {
      // Arrange
      const decisionId = 'decision-123';
      const parentEvidence = {
        id: 'evidence-parent',
        type: 'source',
        content: { text: 'Parent Evidence' },
        weight: 0.8,
        quality: 0.7
      };
      
      // First create map with parent evidence
      const initialResult = confidenceScoring.calculateConfidence(decisionId, [parentEvidence]);
      
      // Now add child evidence with relationship
      const childEvidence = {
        id: 'evidence-child',
        type: 'reasoning',
        content: { text: 'Child Evidence' },
        weight: 0.6,
        quality: 0.9,
        parentId: 'evidence-parent' // Specify parent relationship
      };
      
      // Act
      const updatedResult = confidenceScoring.updateConfidence(decisionId, [childEvidence]);
      
      // Assert
      expect(updatedResult.evidenceMap).toBeDefined();
      expect(updatedResult.evidenceMap.rootEvidence).toHaveLength(2);
      expect(updatedResult.evidenceMap.relationships).toHaveLength(1);
      expect(updatedResult.evidenceMap.relationships[0]).toEqual({
        parentId: 'evidence-parent',
        childId: 'evidence-child',
        relationshipType: 'supports'
      });
    });
  });
  
  describe('getEvidenceMap', () => {
    test('should retrieve evidence map by decision ID', () => {
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
      
      // Create evidence map
      confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      
      // Act
      const evidenceMap = confidenceScoring.getEvidenceMap(decisionId);
      
      // Assert
      expect(evidenceMap).toBeDefined();
      expect(evidenceMap.decisionId).toBe(decisionId);
      expect(evidenceMap.rootEvidence).toHaveLength(1);
    });
    
    test('should return null for non-existent decision ID', () => {
      // Act
      const evidenceMap = confidenceScoring.getEvidenceMap('non-existent-decision');
      
      // Assert
      expect(evidenceMap).toBeNull();
    });
  });
  
  describe('getEvidenceMapById', () => {
    test('should retrieve evidence map by map ID', () => {
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
      
      // Create evidence map
      const result = confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      const mapId = result.evidenceMap.id;
      
      // Act
      const evidenceMap = confidenceScoring.getEvidenceMapById(mapId);
      
      // Assert
      expect(evidenceMap).toBeDefined();
      expect(evidenceMap.id).toBe(mapId);
      expect(evidenceMap.decisionId).toBe(decisionId);
    });
    
    test('should return null for non-existent map ID', () => {
      // Act
      const evidenceMap = confidenceScoring.getEvidenceMapById('non-existent-map');
      
      // Assert
      expect(evidenceMap).toBeNull();
    });
  });
});
