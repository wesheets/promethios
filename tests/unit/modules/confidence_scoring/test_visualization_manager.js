/**
 * Unit tests for the Visualization Manager component of the Confidence Scoring module
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

describe('Visualization Manager', () => {
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
  
  describe('prepareVisualization', () => {
    test('should prepare visualization data for confidence score and evidence map', () => {
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
      
      // Create confidence score and evidence map
      confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      
      // Act
      const visualizationData = confidenceScoring.prepareVisualization(decisionId);
      
      // Assert
      expect(visualizationData).toBeDefined();
      expect(visualizationData.confidenceIndicator).toBeDefined();
      expect(visualizationData.evidenceMap).toBeDefined();
      expect(visualizationData.confidenceIndicator.value).toBeGreaterThan(0);
      expect(visualizationData.confidenceIndicator.value).toBeLessThanOrEqual(1);
      expect(visualizationData.evidenceMap.nodes).toBeDefined();
      expect(visualizationData.evidenceMap.edges).toBeDefined();
      expect(visualizationData.evidenceMap.nodes.length).toBe(2);
    });
    
    test('should prepare visualization with custom options', () => {
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
      
      // Create confidence score and evidence map
      confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      
      // Act
      const visualizationData = confidenceScoring.prepareVisualization(decisionId, {
        format: 'table',
        includeMetadata: true
      });
      
      // Assert
      expect(visualizationData).toBeDefined();
      expect(visualizationData.format).toBe('table');
      expect(visualizationData.metadata).toBeDefined();
    });
    
    test('should throw error for non-existent decision', () => {
      // Act & Assert
      expect(() => {
        confidenceScoring.prepareVisualization('non-existent-decision');
      }).toThrow(/No confidence data found/);
    });
  });
});
