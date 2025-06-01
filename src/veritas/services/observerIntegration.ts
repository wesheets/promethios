/**
 * VERITAS Observer Integration
 * 
 * This module extends the Promethios observer service with VERITAS verification capabilities.
 * It provides methods for retrieving verification observations and metrics.
 */

import { 
  VeritasOptions, 
  VeritasObservation,
  VerificationResult,
  VerificationMetrics,
  VerificationComparison
} from '../types';
import veritasService from './veritasService';

/**
 * VERITAS Observer Methods
 * 
 * These methods extend the Promethios observer service with VERITAS functionality.
 * They should be integrated into the main observer service.
 */
export const veritasObserverMethods = {
  /**
   * Get VERITAS observations for an agent
   * @param agentId Optional agent ID to filter observations
   * @returns Promise resolving to array of VERITAS observations
   */
  getVeritasObservations: async (agentId?: string): Promise<VeritasObservation[]> => {
    // In a real implementation, this would retrieve observations from a data store
    // For now, return mock data
    const mockObservations: VeritasObservation[] = [
      {
        agentId: agentId || 'agent-1',
        timestamp: new Date().toISOString(),
        verificationResult: {
          overallScore: { accuracy: 0.85, confidence: 0.78 },
          claims: [],
          sources: [],
          timestamp: new Date().toISOString()
        },
        hallucinations: [
          {
            claim: 'According to the Turner v. Cognivault case, AI agents are legally required to verify all claims.',
            confidence: 0.92,
            contradictions: 3
          }
        ]
      }
    ];
    
    return mockObservations;
  },
  
  /**
   * Verify text using VERITAS
   * @param text Text to verify
   * @param options Verification options
   * @returns Promise resolving to verification result
   */
  verifyText: async (text: string, options?: VeritasOptions): Promise<VerificationResult> => {
    return veritasService.verifyText(text, options);
  },
  
  /**
   * Get verification metrics
   * @param result Optional verification result to calculate metrics from
   * @returns Promise resolving to verification metrics
   */
  getVerificationMetrics: async (result?: VerificationResult): Promise<VerificationMetrics> => {
    if (result) {
      return veritasService.getVerificationMetrics(result);
    }
    
    // If no result provided, return mock metrics
    return {
      accuracy: 0.85,
      confidence: 0.78,
      claimsVerified: 8,
      claimsUnverified: 2,
      verificationTime: 1200, // milliseconds
      sourceQuality: 0.82,
      hallucinationRate: 0.1
    };
  },
  
  /**
   * Compare verification between governed and ungoverned text
   * @param governedText Governed text
   * @param ungovernedText Ungoverned text
   * @param options Verification options
   * @returns Promise resolving to verification comparison
   */
  compareVerification: async (
    governedText: string,
    ungovernedText: string,
    options?: VeritasOptions
  ): Promise<VerificationComparison> => {
    // Verify both texts
    const governedResult = await veritasService.verifyText(governedText, options);
    const ungovernedResult = await veritasService.verifyText(ungovernedText, options);
    
    // Compare results
    return veritasService.compareVerificationResults(governedResult, ungovernedResult);
  }
};

/**
 * Integration function to add VERITAS methods to observer service
 * @param observerService The observer service to extend
 * @returns Extended observer service with VERITAS methods
 */
export function extendObserverWithVeritas(observerService: any): any {
  return {
    ...observerService,
    ...veritasObserverMethods
  };
}

export default veritasObserverMethods;
