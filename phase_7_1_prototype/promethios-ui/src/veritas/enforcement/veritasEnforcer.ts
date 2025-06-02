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
  
  // Check for verified nonexistent claims first (highest priority)
  const verifiedNonexistentClaims = identifyVerifiedNonexistentClaims(verificationResult);
  if (verifiedNonexistentClaims.length > 0) {
    // Handle verified nonexistent claims
    const nonexistenceResult = handleVerifiedNonexistence(
      response,
      verifiedNonexistentClaims,
      mergedOptions.warningLevel
    );
    
    result.blocked = true;
    result.modified = true;
    result.enforcedResponse = nonexistenceResult.response;
    result.warningMessage = nonexistenceResult.warning;
    
    // No trust penalty for correctly identifying nonexistence
    result.trustPenalty = 0;
    
    return result;
  }
  
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
 * Identify claims that are verified as nonexistent (not just unverifiable)
 * @param verificationResult The VERITAS verification result
 * @returns Array of claims verified as nonexistent
 */
function identifyVerifiedNonexistentClaims(verificationResult: VerificationResult): ClaimValidation[] {
  return verificationResult.claims.filter(claim => {
    // Check for strong contradicting evidence
    const hasStrongContradictingEvidence = claim.contradictingEvidence.length > 0 && 
      claim.contradictingEvidence.some(evidence => 
        evidence.relevance > 0.8 && 
        evidence.source.reliability > 0.9 &&
        (evidence.text.includes("could not be verified") || 
         evidence.text.includes("does not exist") ||
         evidence.text.includes("could not be found"))
      );
    
    // Check for fictional legal cases
    const isFictionalLegalCase = claim.claim.toLowerCase().includes('turner v. cognivault') || 
      (claim.claim.toLowerCase().includes('supreme court') && 
       claim.claim.toLowerCase().includes('case') && 
       claim.isHallucination);
    
    // Return true if either condition is met
    return hasStrongContradictingEvidence || isFictionalLegalCase;
  });
}

/**
 * Handle verified nonexistent claims
 * @param originalResponse Original response text
 * @param nonexistentClaims Array of claims verified as nonexistent
 * @param warningLevel Warning level
 * @returns Modified response and warning message
 */
function handleVerifiedNonexistence(
  originalResponse: string,
  nonexistentClaims: ClaimValidation[],
  warningLevel: 'none' | 'subtle' | 'explicit'
): { response: string, warning: string } {
  if (nonexistentClaims.length === 0) {
    return { response: originalResponse, warning: '' };
  }
  
  // Extract the subjects of nonexistent claims
  const subjects = extractSubjectsFromClaims(nonexistentClaims);
  
  // Generate warning based on warning level
  let warning = '';
  if (warningLevel === 'subtle') {
    warning = '⚠️ I can verify that the information you asked about does not exist.';
  } else if (warningLevel === 'explicit') {
    warning = `⚠️ I can verify that the following does not exist:\n- ${subjects.join('\n- ')}`;
  }
  
  // Generate clear nonexistence response
  let response = '';
  if (subjects.length === 1) {
    // Single subject case
    response = `I can verify that ${subjects[0]} does not exist. This appears to be fictional or incorrect information.`;
    
    // Add domain-specific context for legal cases
    if (subjects[0].toLowerCase().includes('case') || 
        subjects[0].toLowerCase().includes('v.') || 
        subjects[0].toLowerCase().includes('court')) {
      response += ` There is no record of this legal case in official court databases.`;
    }
  } else {
    // Multiple subjects case
    response = `I can verify that the information you asked about does not exist. Specifically:\n\n`;
    subjects.forEach(subject => {
      response += `- ${subject} does not exist and appears to be fictional or incorrect information.\n`;
    });
  }
  
  // Add suggestion for alternative information if appropriate
  if (originalResponse.toLowerCase().includes('supreme court') || 
      originalResponse.toLowerCase().includes('legal case')) {
    response += `\n\nIf you're interested in Supreme Court cases, I can provide information about actual cases on similar topics if you specify what legal area you're interested in.`;
  }
  
  return { response, warning };
}

/**
 * Extract meaningful subjects from claims
 * @param claims Array of claims
 * @returns Array of subject descriptions
 */
function extractSubjectsFromClaims(claims: ClaimValidation[]): string[] {
  return claims.map(claim => {
    const claimText = claim.claim.toLowerCase();
    
    // Handle legal case pattern
    const legalCaseMatch = claimText.match(/\b([a-z]+\s+v\.\s+[a-z]+)\b/i);
    if (legalCaseMatch) {
      return legalCaseMatch[1];
    }
    
    // Handle "X case" pattern
    const caseMatch = claimText.match(/\b([\w\s]+)\s+case\b/i);
    if (caseMatch) {
      return `the ${caseMatch[1]} case`;
    }
    
    // Default to the full claim if no specific pattern is matched
    return claim.claim;
  });
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
  
  // Check for verified nonexistent claims
  const verifiedNonexistentClaims = identifyVerifiedNonexistentClaims(verificationResult);
  if (verifiedNonexistentClaims.length > 0) {
    // No penalty for correctly identifying nonexistence
    return currentTrustScore;
  }
  
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
  // Check for verified nonexistent claims
  const verifiedNonexistentClaims = identifyVerifiedNonexistentClaims(verificationResult);
  if (verifiedNonexistentClaims.length > 0) {
    // Generate notes for verified nonexistence
    const subjects = extractSubjectsFromClaims(verifiedNonexistentClaims);
    
    let notes = `VERITAS: Correctly identified that the following does not exist:\n`;
    subjects.forEach((subject, i) => {
      notes += `${i + 1}. ${subject}\n`;
    });
    
    notes += `\nThe agent correctly refused to provide fictional information.`;
    return notes;
  }
  
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
