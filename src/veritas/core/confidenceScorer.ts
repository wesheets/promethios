/**
 * Confidence Scorer Module
 * 
 * This module is responsible for calculating confidence scores for claim validations.
 * It implements algorithms to determine the confidence level in verification results.
 */

import { VeritasOptions, Evidence } from '../types';
import { DEFAULT_OPTIONS, MODE_THRESHOLDS } from '../constants';
import { calculateClaimConfidence, calculateClaimAccuracy } from './claimValidator';

/**
 * Calculate confidence score for a validation result
 * @param validationResult Validation result with supporting and contradicting evidence
 * @param options Verification options
 * @returns Confidence score object with accuracy and confidence values
 */
export function calculateConfidence(
  validationResult: { supportingEvidence: Evidence[]; contradictingEvidence: Evidence[] },
  options: VeritasOptions = {}
): { accuracy: number; confidence: number } {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Calculate confidence and accuracy scores
  const confidence = calculateClaimConfidence(
    validationResult.supportingEvidence,
    validationResult.contradictingEvidence,
    mergedOptions
  );
  
  const accuracy = calculateClaimAccuracy(
    validationResult.supportingEvidence,
    validationResult.contradictingEvidence,
    mergedOptions
  );
  
  return { accuracy, confidence };
}

/**
 * Adjust confidence based on source quality
 * @param baseConfidence Base confidence score
 * @param evidence Array of evidence
 * @returns Adjusted confidence score
 */
export function adjustConfidenceBySourceQuality(
  baseConfidence: number,
  evidence: Evidence[]
): number {
  if (evidence.length === 0) {
    return baseConfidence;
  }
  
  // Calculate average source reliability
  const totalReliability = evidence.reduce((sum, item) => sum + item.source.reliability, 0);
  const averageReliability = totalReliability / evidence.length;
  
  // Adjust confidence based on source reliability
  // If sources are highly reliable, boost confidence
  // If sources are less reliable, reduce confidence
  const adjustmentFactor = (averageReliability - 0.5) * 0.4;
  
  // Apply adjustment, ensuring result is between 0 and 1
  return Math.max(0, Math.min(1, baseConfidence + adjustmentFactor));
}

/**
 * Adjust confidence based on evidence quantity
 * @param baseConfidence Base confidence score
 * @param evidence Array of evidence
 * @param options Verification options
 * @returns Adjusted confidence score
 */
export function adjustConfidenceByEvidenceQuantity(
  baseConfidence: number,
  evidence: Evidence[],
  options: VeritasOptions = {}
): number {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Get evidence threshold based on mode
  const thresholds = MODE_THRESHOLDS[mergedOptions.mode as keyof typeof MODE_THRESHOLDS] || 
                    MODE_THRESHOLDS.balanced;
  
  const evidenceThreshold = thresholds.evidenceThreshold;
  
  // If evidence count meets or exceeds threshold, no adjustment needed
  if (evidence.length >= evidenceThreshold) {
    return baseConfidence;
  }
  
  // Reduce confidence proportionally if evidence count is below threshold
  const reductionFactor = (evidenceThreshold - evidence.length) / evidenceThreshold;
  const adjustment = baseConfidence * reductionFactor * 0.5;
  
  return Math.max(0, baseConfidence - adjustment);
}

/**
 * Calculate overall confidence for multiple claims
 * @param claimConfidences Array of confidence scores for individual claims
 * @returns Overall confidence score
 */
export function calculateOverallConfidence(
  claimConfidences: Array<{ accuracy: number; confidence: number }>
): { accuracy: number; confidence: number } {
  if (claimConfidences.length === 0) {
    return { accuracy: 0, confidence: 0 };
  }
  
  // Calculate weighted average of accuracy and confidence
  let totalAccuracy = 0;
  let totalConfidence = 0;
  let totalWeight = 0;
  
  for (const score of claimConfidences) {
    // Use confidence as weight - higher confidence claims have more influence
    const weight = score.confidence;
    totalAccuracy += score.accuracy * weight;
    totalConfidence += score.confidence * weight;
    totalWeight += weight;
  }
  
  // If no weights (all confidences are 0), use simple average
  if (totalWeight === 0) {
    const simpleAccuracy = claimConfidences.reduce((sum, score) => sum + score.accuracy, 0) / claimConfidences.length;
    const simpleConfidence = claimConfidences.reduce((sum, score) => sum + score.confidence, 0) / claimConfidences.length;
    return { accuracy: simpleAccuracy, confidence: simpleConfidence };
  }
  
  return {
    accuracy: totalAccuracy / totalWeight,
    confidence: totalConfidence / totalWeight
  };
}

/**
 * Determine confidence level category
 * @param confidence Confidence score (0-1)
 * @returns Confidence level category
 */
export function getConfidenceLevel(confidence: number): 'very low' | 'low' | 'moderate' | 'high' | 'very high' {
  if (confidence < 0.2) {
    return 'very low';
  } else if (confidence < 0.4) {
    return 'low';
  } else if (confidence < 0.6) {
    return 'moderate';
  } else if (confidence < 0.8) {
    return 'high';
  } else {
    return 'very high';
  }
}

/**
 * Calculate trust impact based on verification results
 * @param accuracy Accuracy score (0-1)
 * @param confidence Confidence score (0-1)
 * @param isHallucination Whether the claim is a hallucination
 * @returns Trust impact score (-1 to 1)
 */
export function calculateTrustImpact(
  accuracy: number,
  confidence: number,
  isHallucination: boolean
): number {
  // Hallucinations have a strong negative impact on trust
  if (isHallucination) {
    return -0.8 - (confidence * 0.2);
  }
  
  // High accuracy with high confidence has positive impact
  if (accuracy > 0.7 && confidence > 0.7) {
    return 0.5 + (accuracy * 0.5);
  }
  
  // Low accuracy with high confidence has negative impact
  if (accuracy < 0.3 && confidence > 0.7) {
    return -0.5 - ((1 - accuracy) * 0.5);
  }
  
  // Otherwise, impact is proportional to accuracy and confidence
  return (accuracy - 0.5) * confidence;
}
