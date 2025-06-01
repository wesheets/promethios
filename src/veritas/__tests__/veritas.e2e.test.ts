/**
 * VERITAS End-to-End Test Suite
 * 
 * This file contains end-to-end tests for the VERITAS module integration.
 * It tests the full verification flow from agent response to UI display.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { verify } from '../core';
import veritasService from '../services/veritasService';
import { extendObserverWithVeritas } from '../services/observerIntegration';
import { extendMetricCalculatorWithVeritas } from '../services/metricCalculatorIntegration';
import { extendAgentWrappingWithVeritas } from '../services/agentWrappingIntegration';
import { integrateWithCMUPlayground } from '../services/cmuPlaygroundIntegration';
import VeritasPanel from '../components/VeritasPanel';

// Mock dependencies
jest.mock('../core', () => ({
  verify: jest.fn(),
  checkForFictionalLegalCase: jest.fn()
}));

jest.mock('../services/veritasService', () => ({
  verifyText: jest.fn(),
  checkForFictionalCases: jest.fn(),
  compareTexts: jest.fn(),
  getVerificationMetrics: jest.fn(),
  compareVerificationResults: jest.fn()
}));

describe('VERITAS End-to-End Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('Full verification flow from agent response to UI display', async () => {
    // Mock verification result
    const mockVerificationResult = {
      overallScore: { accuracy: 0.85, confidence: 0.78 },
      claims: [
        {
          claim: {
            text: 'The Earth is round',
            position: { start: 0, end: 16 }
          },
          verified: true,
          score: { accuracy: 0.9, confidence: 0.85 },
          supportingEvidence: [
            {
              text: 'Scientific consensus confirms that the Earth is round.',
              source: {
                id: 'src-1',
                name: 'Science Journal',
                reliability: 0.9
              },
              relevance: 0.8,
              sentiment: 'supporting'
            }
          ],
          contradictingEvidence: [],
          isHallucination: false
        }
      ],
      sources: [
        {
          id: 'src-1',
          name: 'Science Journal',
          reliability: 0.9
        }
      ],
      timestamp: new Date().toISOString()
    };
    
    // Mock core verify function
    (verify as jest.Mock).mockResolvedValue(mockVerificationResult);
    
    // Mock service verifyText function
    (veritasService.verifyText as jest.Mock).mockResolvedValue(mockVerificationResult);
    
    // Create mock observer service
    const mockObserverService = {
      getObservations: jest.fn(),
      addObservation: jest.fn()
    };
    
    // Create mock metric calculator
    const mockMetricCalculator = {
      calculateTrustScore: jest.fn().mockReturnValue(0.8),
      calculateErrorRate: jest.fn().mockReturnValue(0.1)
    };
    
    // Create mock agent wrapping
    const mockAgentWrapping = {
      wrapAgentResponse: jest.fn()
    };
    
    // Create mock CMU playground modules
    const mockAgentConversation = {
      processAgentResponse: jest.fn(),
      detectHallucination: jest.fn()
    };
    
    const mockMetricsManager = {
      calculateTrustScore: jest.fn(),
      calculateErrorRate: jest.fn()
    };
    
    // Extend with VERITAS
    const extendedObserver = extendObserverWithVeritas(mockObserverService);
    const extendedMetricCalculator = extendMetricCalculatorWithVeritas(mockMetricCalculator);
    const extendedAgentWrapping = extendAgentWrappingWithVeritas(mockAgentWrapping);
    const extendedAgentConversation = integrateWithCMUPlayground(mockAgentConversation);
    
    // Test observer integration
    await extendedObserver.verifyText('The Earth is round');
    expect(veritasService.verifyText).toHaveBeenCalledWith('The Earth is round', undefined);
    
    // Test metric calculator integration
    const trustImpact = extendedMetricCalculator.calculateTrustImpact(mockVerificationResult);
    expect(trustImpact).toBeDefined();
    
    // Test agent wrapping integration
    await extendedAgentWrapping.verifyAgentResponse('The Earth is round');
    expect(veritasService.verifyText).toHaveBeenCalledWith('The Earth is round', {});
    
    // Test CMU playground integration
    await extendedAgentConversation.detectHallucination('According to the Turner v. Cognivault case...');
    expect(veritasService.checkForFictionalCases).toHaveBeenCalled();
    
    // Test UI component rendering
    render(<VeritasPanel text="The Earth is round" />);
    
    // Wait for verification to complete
    await waitFor(() => {
      expect(veritasService.verifyText).toHaveBeenCalledWith('The Earth is round', expect.anything());
    });
  });
  
  test('Turner v. Cognivault hallucination detection end-to-end', async () => {
    // Mock verification result for Turner v. Cognivault
    const mockHallucinationResult = {
      overallScore: { accuracy: 0.1, confidence: 0.9 },
      claims: [
        {
          claim: {
            text: 'According to the Turner v. Cognivault case, AI agents are legally responsible',
            position: { start: 0, end: 74 }
          },
          verified: false,
          score: { accuracy: 0.1, confidence: 0.9 },
          supportingEvidence: [],
          contradictingEvidence: [],
          isHallucination: true
        }
      ],
      sources: [],
      timestamp: new Date().toISOString()
    };
    
    // Mock core verify function
    (verify as jest.Mock).mockResolvedValue(mockHallucinationResult);
    
    // Mock service verifyText function
    (veritasService.verifyText as jest.Mock).mockResolvedValue(mockHallucinationResult);
    
    // Mock checkForFictionalCases
    (veritasService.checkForFictionalCases as jest.Mock).mockReturnValue(true);
    
    // Create mock CMU playground modules
    const mockAgentConversation = {
      processAgentResponse: jest.fn().mockImplementation((text, isGoverned) => ({
        response: text,
        isGoverned
      })),
      detectHallucination: jest.fn().mockReturnValue({ detected: false })
    };
    
    // Extend with VERITAS
    const extendedAgentConversation = integrateWithCMUPlayground(mockAgentConversation);
    
    // Test hallucination detection
    const result = await extendedAgentConversation.detectHallucination(
      'According to the Turner v. Cognivault case, AI agents are legally responsible'
    );
    
    expect(result.detected).toBe(true);
    expect(result.type).toBe('fictional_case');
    
    // Test response processing with hallucination
    const processedResponse = await extendedAgentConversation.processAgentResponse(
      'According to the Turner v. Cognivault case, AI agents are legally responsible',
      true // governed
    );
    
    expect(processedResponse.hallucinationDetected).toBe(true);
  });
});
