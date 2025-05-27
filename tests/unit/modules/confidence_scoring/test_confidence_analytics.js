/**
 * Unit tests for the Confidence Analytics component of the Confidence Scoring module
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

describe('Confidence Analytics', () => {
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
        },
        persistenceInterval: 0 // Disable automatic persistence for testing
      }
    });
  });
  
  describe('trackConfidenceScore', () => {
    test('should track confidence score in analytics', () => {
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
      
      // Act
      confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      const analytics = confidenceScoring.getAnalytics();
      
      // Assert
      expect(analytics).toBeDefined();
      expect(analytics.confidenceScores).toBeDefined();
      expect(analytics.confidenceScores.length).toBeGreaterThan(0);
      expect(analytics.confidenceScores[0].decisionId).toBe(decisionId);
    });
    
    test('should track confidence updates in analytics', () => {
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
      confidenceScoring.calculateConfidence(decisionId, initialEvidence);
      
      // Act
      confidenceScoring.updateConfidence(decisionId, newEvidence);
      const analytics = confidenceScoring.getAnalytics();
      
      // Assert
      expect(analytics).toBeDefined();
      expect(analytics.confidenceUpdates).toBeDefined();
      expect(analytics.confidenceUpdates.length).toBeGreaterThan(0);
      expect(analytics.confidenceUpdates[0].decisionId).toBe(decisionId);
    });
  });
  
  describe('getAnalytics', () => {
    test('should retrieve filtered analytics based on options', () => {
      // Arrange
      const decisionIds = ['decision-1', 'decision-2', 'decision-3'];
      
      // Create multiple confidence scores
      decisionIds.forEach(decisionId => {
        confidenceScoring.calculateConfidence(decisionId, [
          {
            id: `evidence-${decisionId}`,
            type: 'source',
            content: { text: `Evidence for ${decisionId}` },
            weight: 0.8,
            quality: 0.7
          }
        ]);
      });
      
      // Act
      const filteredAnalytics = confidenceScoring.getAnalytics({
        decisionId: 'decision-2'
      });
      
      // Assert
      expect(filteredAnalytics).toBeDefined();
      expect(filteredAnalytics.confidenceScores).toBeDefined();
      expect(filteredAnalytics.confidenceScores.length).toBe(1);
      expect(filteredAnalytics.confidenceScores[0].decisionId).toBe('decision-2');
    });
    
    test('should retrieve analytics with time range filtering', () => {
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
      
      // Set a specific timestamp for testing
      const now = Date.now();
      const pastTime = now - 3600000; // 1 hour ago
      
      // Mock Date.now to return a fixed timestamp
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => pastTime);
      
      // Create first confidence score in the past
      confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      
      // Restore Date.now to current time
      Date.now = jest.fn(() => now);
      
      // Create second confidence score now
      confidenceScoring.calculateConfidence('decision-456', evidenceItems);
      
      // Restore original Date.now
      Date.now = originalDateNow;
      
      // Act
      const recentAnalytics = confidenceScoring.getAnalytics({
        startTime: now - 1800000 // 30 minutes ago
      });
      
      // Assert
      expect(recentAnalytics).toBeDefined();
      expect(recentAnalytics.confidenceScores).toBeDefined();
      expect(recentAnalytics.confidenceScores.length).toBe(1);
      expect(recentAnalytics.confidenceScores[0].decisionId).toBe('decision-456');
    });
  });
  
  describe('persistAnalytics', () => {
    test('should persist analytics data', () => {
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
      
      // Create confidence score
      confidenceScoring.calculateConfidence(decisionId, evidenceItems);
      
      // Mock the analytics persist method
      confidenceScoring.analytics.persistData = jest.fn();
      
      // Act
      confidenceScoring.persistAnalytics();
      
      // Assert
      expect(confidenceScoring.analytics.persistData).toHaveBeenCalled();
    });
  });
});
