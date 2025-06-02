/**
 * VERITAS Integration Module
 * 
 * This module integrates the VERITAS enforcement capabilities with the governance pipeline.
 * It connects the detection logic with the enforcement layer and ensures proper
 * communication with the observer and trust scoring modules.
 */

import { verify, VerificationResult, VeritasOptions } from '../core';
import { 
  enforceVeritas, 
  applyTrustPenalty, 
  generateObserverNotes,
  EnforcementOptions, 
  EnforcementResult 
} from './veritasEnforcer';

// Types
export interface VeritasIntegrationOptions {
  veritas: VeritasOptions;
  enforcement: EnforcementOptions;
  enabled: boolean;
}

export interface VeritasIntegrationResult {
  verification: VerificationResult;
  enforcement: EnforcementResult;
  observerNotes: string;
  trustScoreAdjustment: number;
}

// Default options
const DEFAULT_OPTIONS: VeritasIntegrationOptions = {
  veritas: {
    mode: 'balanced',
    maxClaims: 5,
    confidenceThreshold: 0.7,
    retrievalDepth: 3
  },
  enforcement: {
    blockHallucinations: true,
    trustPenalty: 10,
    warningLevel: 'explicit',
    minHallucinationThreshold: 0.5
  },
  enabled: true
};

/**
 * Process a response through VERITAS verification and enforcement
 * @param response The response text to process
 * @param currentTrustScore Current trust score
 * @param options Integration options
 * @returns Integration result
 */
export async function processWithVeritas(
  response: string,
  currentTrustScore: number = 0,
  options: Partial<VeritasIntegrationOptions> = {}
): Promise<VeritasIntegrationResult> {
  // Merge options with defaults
  const mergedOptions: VeritasIntegrationOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    veritas: { ...DEFAULT_OPTIONS.veritas, ...options.veritas },
    enforcement: { ...DEFAULT_OPTIONS.enforcement, ...options.enforcement }
  };
  
  // If VERITAS is disabled, return a pass-through result
  if (!mergedOptions.enabled) {
    const emptyVerification: VerificationResult = {
      overallScore: { accuracy: 1, confidence: 1 },
      claims: [],
      sources: [],
      timestamp: new Date().toISOString()
    };
    
    return {
      verification: emptyVerification,
      enforcement: {
        blocked: false,
        modified: false,
        trustPenalty: 0,
        originalResponse: response,
        enforcedResponse: response,
        verificationResult: emptyVerification
      },
      observerNotes: 'VERITAS: Disabled',
      trustScoreAdjustment: 0
    };
  }
  
  try {
    // Step 1: Verify the response with VERITAS
    const verification = await verify(response, mergedOptions.veritas);
    
    // Step 2: Enforce VERITAS results
    const enforcement = enforceVeritas(response, verification, mergedOptions.enforcement);
    
    // Step 3: Calculate trust score adjustment
    const newTrustScore = applyTrustPenalty(currentTrustScore, verification, mergedOptions.enforcement);
    const trustScoreAdjustment = newTrustScore - currentTrustScore;
    
    // Step 4: Generate observer notes
    const observerNotes = generateObserverNotes(verification);
    
    // Return the integrated result
    return {
      verification,
      enforcement,
      observerNotes,
      trustScoreAdjustment
    };
  } catch (error) {
    console.error('VERITAS integration error:', error);
    
    // Return a minimal result with error indication
    const emptyVerification: VerificationResult = {
      overallScore: { accuracy: 0, confidence: 0 },
      claims: [],
      sources: [],
      timestamp: new Date().toISOString()
    };
    
    return {
      verification: emptyVerification,
      enforcement: {
        blocked: false,
        modified: false,
        trustPenalty: 0,
        originalResponse: response,
        enforcedResponse: response,
        verificationResult: emptyVerification
      },
      observerNotes: `VERITAS: Error during processing - ${error}`,
      trustScoreAdjustment: 0
    };
  }
}

// Export types and functions
export type { VeritasIntegrationOptions, VeritasIntegrationResult };
