/**
 * VERITAS Enforcement Module
 * 
 * This module provides enforcement capabilities for VERITAS hallucination detection.
 * It sits between the VERITAS detection and response delivery, ensuring that
 * hallucinations are blocked, trust scores are penalized, and results are surfaced
 * to the Observer module.
 */

import { VerificationResult, ClaimValidation } from '../core';

// Types
export interface EnforcementOptions {
  blockHallucinations: boolean;
  trustPenalty: number;
  warningLevel: 'none' | 'subtle' | 'explicit';
  minHallucinationThreshold: number;
}

export interface EnforcementResult {
  blocked: boolean;
  modified: boolean;
  trustPenalty: number;
  warningMessage?: string;
  originalResponse: string;
  enforcedResponse: string;
  verificationResult: VerificationResult;
}

// Default options
const DEFAULT_OPTIONS: EnforcementOptions = {
  blockHallucinations: true,
  trustPenalty: 10,
  warningLevel: 'explicit',
  minHallucinationThreshold: 0.5
};

/**
 * Enforce VERITAS verification results on a response
 * @param response The original response text
 * @param verificationResult The VERITAS verification result
 * @param options Enforcement options
 * @returns Enforcement result
 */
export function enforceVeritas(
  response: string,
  verificationResult: VerificationResult,
  options: Partial<EnforcementOptions> = {}
): EnforcementResult {
  // Merge options with defaults
  const mergedOptions: EnforcementOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Initialize result
  const result: EnforcementResult = {
    blocked: false,
    modified: false,
    trustPenalty: 0,
    originalResponse: response,
    enforcedResponse: response,
    verificationResult
  };
  
  // Check if there are any hallucinations
  const hasHallucinations = verificationResult.claims.some(claim => claim.isHallucination);
  
  // Calculate the percentage of claims that are hallucinations
  const hallucinationPercentage = verificationResult.claims.length > 0
    ? verificationResult.claims.filter(claim => claim.isHallucination).length / verificationResult.claims.length
    : 0;
  
  // If there are hallucinations and they exceed the threshold
  if (hasHallucinations && hallucinationPercentage >= mergedOptions.minHallucinationThreshold) {
    // Apply trust penalty
    result.trustPenalty = mergedOptions.trustPenalty;
    
    // Generate warning message based on warning level
    if (mergedOptions.warningLevel !== 'none') {
      result.warningMessage = generateWarningMessage(
        verificationResult.claims.filter(claim => claim.isHallucination),
        mergedOptions.warningLevel
      );
    }
    
    // If blocking is enabled, block the response
    if (mergedOptions.blockHallucinations) {
      result.blocked = true;
      result.modified = true;
      result.enforcedResponse = generateBlockedResponse(
        response,
        verificationResult.claims.filter(claim => claim.isHallucination),
        mergedOptions.warningLevel
      );
    } else if (result.warningMessage) {
      // Otherwise, just add the warning message
      result.modified = true;
      result.enforcedResponse = `${result.warningMessage}\n\n${response}`;
    }
  }
  
  return result;
}

/**
 * Generate a warning message based on hallucinated claims
 * @param hallucinations Array of hallucinated claims
 * @param warningLevel Warning level
 * @returns Warning message
 */
function generateWarningMessage(
  hallucinations: ClaimValidation[],
  warningLevel: 'none' | 'subtle' | 'explicit'
): string {
  if (warningLevel === 'none' || hallucinations.length === 0) {
    return '';
  }
  
  if (warningLevel === 'subtle') {
    return '⚠️ This response may contain information that could not be verified.';
  }
  
  // For explicit warnings, include details about the hallucinations
  const hallucinationList = hallucinations
    .slice(0, 3) // Limit to 3 examples
    .map(h => `"${h.claim.substring(0, 100)}${h.claim.length > 100 ? '...' : ''}"`)
    .join('\n- ');
  
  return `⚠️ WARNING: This response contains information that could not be verified.\n\nPotentially unverified claims include:\n- ${hallucinationList}${hallucinations.length > 3 ? '\n- ...' : ''}`;
}

/**
 * Generate a blocked response based on hallucinated claims
 * @param originalResponse Original response text
 * @param hallucinations Array of hallucinated claims
 * @param warningLevel Warning level
 * @returns Blocked response
 */
function generateBlockedResponse(
  originalResponse: string,
  hallucinations: ClaimValidation[],
  warningLevel: 'none' | 'subtle' | 'explicit'
): string {
  if (warningLevel === 'none') {
    return 'I apologize, but I cannot provide that information as it may not be accurate.';
  }
  
  if (warningLevel === 'subtle') {
    return 'I apologize, but I cannot provide that information as it may not be accurate. Please rephrase your question or ask about a different topic.';
  }
  
  // For explicit warnings, include details about the hallucinations
  const hallucinationList = hallucinations
    .slice(0, 3) // Limit to 3 examples
    .map(h => `"${h.claim.substring(0, 100)}${h.claim.length > 100 ? '...' : ''}"`)
    .join('\n- ');
  
  return `I apologize, but I cannot provide the requested information because it contains claims that could not be verified.\n\nPotentially unverified claims include:\n- ${hallucinationList}${hallucinations.length > 3 ? '\n- ...' : ''}\n\nPlease rephrase your question or ask about a different topic.`;
}

/**
 * Apply trust score penalty based on hallucination detection
 * @param currentTrustScore Current trust score
 * @param verificationResult VERITAS verification result
 * @param options Enforcement options
 * @returns Updated trust score
 */
export function applyTrustPenalty(
  currentTrustScore: number,
  verificationResult: VerificationResult,
  options: Partial<EnforcementOptions> = {}
): number {
  // Merge options with defaults
  const mergedOptions: EnforcementOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Check if there are any hallucinations
  const hasHallucinations = verificationResult.claims.some(claim => claim.isHallucination);
  
  // Calculate the percentage of claims that are hallucinations
  const hallucinationPercentage = verificationResult.claims.length > 0
    ? verificationResult.claims.filter(claim => claim.isHallucination).length / verificationResult.claims.length
    : 0;
  
  // If there are hallucinations and they exceed the threshold, apply penalty
  if (hasHallucinations && hallucinationPercentage >= mergedOptions.minHallucinationThreshold) {
    return Math.max(0, currentTrustScore - mergedOptions.trustPenalty);
  }
  
  return currentTrustScore;
}

/**
 * Generate observer notes based on VERITAS verification results
 * @param verificationResult VERITAS verification result
 * @returns Observer notes
 */
export function generateObserverNotes(verificationResult: VerificationResult): string {
  // Check if there are any hallucinations
  const hallucinations = verificationResult.claims.filter(claim => claim.isHallucination);
  
  if (hallucinations.length === 0) {
    return 'VERITAS: No hallucinations detected.';
  }
  
  // Calculate the percentage of claims that are hallucinations
  const hallucinationPercentage = verificationResult.claims.length > 0
    ? hallucinations.length / verificationResult.claims.length * 100
    : 0;
  
  // Generate notes
  let notes = `VERITAS: Detected ${hallucinations.length} potential hallucination(s) (${hallucinationPercentage.toFixed(1)}% of claims).\n\n`;
  
  // Add examples of hallucinated claims
  if (hallucinations.length > 0) {
    notes += 'Examples:\n';
    hallucinations.slice(0, 3).forEach((h, i) => {
      notes += `${i + 1}. "${h.claim.substring(0, 100)}${h.claim.length > 100 ? '...' : ''}"\n`;
    });
    
    if (hallucinations.length > 3) {
      notes += `... and ${hallucinations.length - 3} more.\n`;
    }
  }
  
  return notes;
}

// Export types and functions
export type { EnforcementOptions, EnforcementResult };
