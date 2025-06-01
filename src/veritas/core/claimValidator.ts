/**
 * Claim Validator Module
 * 
 * This module is responsible for validating claims against retrieved evidence.
 * It implements logic to determine if a claim is supported, contradicted, or
 * unverified based on available evidence.
 */

import { VeritasOptions, Evidence } from '../types';
import { DEFAULT_OPTIONS } from '../constants';
import { evidenceContradictsClaim, evidenceSupportsClaim } from './evidenceRetriever';

/**
 * Validate a claim against evidence
 * @param claim The claim to validate
 * @param evidence Array of evidence
 * @param options Verification options
 * @returns Validation result with supporting and contradicting evidence
 */
export function validateClaim(
  claim: string,
  evidence: Evidence[],
  options: VeritasOptions = {}
): { supportingEvidence: Evidence[]; contradictingEvidence: Evidence[] } {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Filter evidence by relevance threshold based on mode
  const relevanceThreshold = getRelevanceThreshold(mergedOptions.mode);
  const relevantEvidence = evidence.filter(e => e.relevance >= relevanceThreshold);
  
  // Classify evidence as supporting or contradicting
  const supportingEvidence: Evidence[] = [];
  const contradictingEvidence: Evidence[] = [];
  
  for (const item of relevantEvidence) {
    // If evidence already has sentiment, use it
    if (item.sentiment === 'supporting') {
      supportingEvidence.push(item);
    } else if (item.sentiment === 'contradicting') {
      contradictingEvidence.push(item);
    } else {
      // Otherwise, determine sentiment based on content
      if (evidenceSupportsClaim(claim, item.text)) {
        supportingEvidence.push({
          ...item,
          sentiment: 'supporting'
        });
      } else if (evidenceContradictsClaim(claim, item.text)) {
        contradictingEvidence.push({
          ...item,
          sentiment: 'contradicting'
        });
      } else {
        // Neutral evidence - not clearly supporting or contradicting
        // In strict mode, treat neutral as contradicting
        // In lenient mode, treat neutral as supporting
        // In balanced mode, ignore neutral evidence
        if (mergedOptions.mode === 'strict') {
          contradictingEvidence.push({
            ...item,
            sentiment: 'contradicting'
          });
        } else if (mergedOptions.mode === 'lenient') {
          supportingEvidence.push({
            ...item,
            sentiment: 'supporting'
          });
        }
        // In balanced mode, we ignore neutral evidence
      }
    }
  }
  
  return {
    supportingEvidence,
    contradictingEvidence
  };
}

/**
 * Get relevance threshold based on verification mode
 * @param mode Verification mode
 * @returns Relevance threshold
 */
function getRelevanceThreshold(mode: string = 'balanced'): number {
  switch (mode) {
    case 'strict':
      return 0.7;
    case 'lenient':
      return 0.3;
    case 'balanced':
    default:
      return 0.5;
  }
}

/**
 * Calculate claim verification confidence
 * @param supportingEvidence Supporting evidence
 * @param contradictingEvidence Contradicting evidence
 * @param options Verification options
 * @returns Confidence score (0-1)
 */
export function calculateClaimConfidence(
  supportingEvidence: Evidence[],
  contradictingEvidence: Evidence[],
  options: VeritasOptions = {}
): number {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // If no evidence, confidence is 0
  if (supportingEvidence.length === 0 && contradictingEvidence.length === 0) {
    return 0;
  }
  
  // Calculate weighted evidence scores
  const supportScore = calculateEvidenceScore(supportingEvidence);
  const contradictScore = calculateEvidenceScore(contradictingEvidence);
  
  // Calculate confidence based on evidence balance
  let confidence = 0;
  
  if (supportScore > 0 && contradictScore === 0) {
    // Only supporting evidence
    confidence = Math.min(1, supportScore / getRequiredScoreForMode(mergedOptions.mode));
  } else if (supportScore === 0 && contradictScore > 0) {
    // Only contradicting evidence
    confidence = 0;
  } else if (supportScore > 0 && contradictScore > 0) {
    // Both supporting and contradicting evidence
    const totalScore = supportScore + contradictScore;
    confidence = supportScore / totalScore;
  }
  
  return confidence;
}

/**
 * Calculate evidence score based on relevance and source reliability
 * @param evidence Array of evidence
 * @returns Evidence score
 */
function calculateEvidenceScore(evidence: Evidence[]): number {
  return evidence.reduce((score, item) => {
    // Weight by both relevance and source reliability
    return score + (item.relevance * item.source.reliability);
  }, 0);
}

/**
 * Get required evidence score for verification mode
 * @param mode Verification mode
 * @returns Required score
 */
function getRequiredScoreForMode(mode: string = 'balanced'): number {
  switch (mode) {
    case 'strict':
      return 2.0;
    case 'lenient':
      return 0.5;
    case 'balanced':
    default:
      return 1.0;
  }
}

/**
 * Calculate claim accuracy score
 * @param supportingEvidence Supporting evidence
 * @param contradictingEvidence Contradicting evidence
 * @param options Verification options
 * @returns Accuracy score (0-1)
 */
export function calculateClaimAccuracy(
  supportingEvidence: Evidence[],
  contradictingEvidence: Evidence[],
  options: VeritasOptions = {}
): number {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // If no evidence, accuracy is 0
  if (supportingEvidence.length === 0 && contradictingEvidence.length === 0) {
    return 0;
  }
  
  // Calculate weighted evidence scores
  const supportScore = calculateEvidenceScore(supportingEvidence);
  const contradictScore = calculateEvidenceScore(contradictingEvidence);
  
  // Calculate accuracy based on evidence balance
  let accuracy = 0;
  
  if (supportScore > 0 && contradictScore === 0) {
    // Only supporting evidence
    accuracy = Math.min(1, supportScore / getRequiredScoreForMode(mergedOptions.mode));
  } else if (supportScore === 0 && contradictScore > 0) {
    // Only contradicting evidence
    accuracy = 0;
  } else if (supportScore > 0 && contradictScore > 0) {
    // Both supporting and contradicting evidence
    const ratio = supportScore / (supportScore + contradictScore);
    
    // Apply a penalty for having contradicting evidence
    // Even with more supporting than contradicting, accuracy should be reduced
    accuracy = ratio * (1 - (contradictScore / (supportScore * 2)));
    
    // Ensure accuracy is between 0 and 1
    accuracy = Math.max(0, Math.min(1, accuracy));
  }
  
  return accuracy;
}

/**
 * Determine if a claim is a hallucination
 * @param supportingEvidence Supporting evidence
 * @param contradictingEvidence Contradicting evidence
 * @param confidence Confidence score
 * @param options Verification options
 * @returns Whether the claim is a hallucination
 */
export function isHallucination(
  supportingEvidence: Evidence[],
  contradictingEvidence: Evidence[],
  confidence: number,
  options: VeritasOptions = {}
): boolean {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // If no supporting evidence, it's likely a hallucination
  if (supportingEvidence.length === 0) {
    return true;
  }
  
  // If there's contradicting evidence and low confidence, it's likely a hallucination
  if (contradictingEvidence.length > 0 && confidence < mergedOptions.confidenceThreshold!) {
    return true;
  }
  
  // If confidence is very low, it's likely a hallucination
  if (confidence < 0.3) {
    return true;
  }
  
  return false;
}
