/**
 * VERITAS Metric Calculator Integration
 * 
 * This module extends the Promethios metric calculator with VERITAS verification capabilities.
 * It provides functions to analyze responses for hallucinations and calculate trust impact.
 */

import { VerificationResult } from '../types';
import veritasService from './veritasService';

/**
 * Analyze response using VERITAS verification
 * @param text The response text to analyze
 * @param prompt The prompt that generated the response
 * @returns Promise resolving to analysis result with violation type and details
 */
export async function analyzeResponseWithVeritas(
  text: string,
  prompt: string
): Promise<{ 
  violationType: string | null;
  details: any;
  verificationResult?: VerificationResult;
} | null> {
  try {
    // Verify the response text
    const verificationResult = await veritasService.verifyText(text);
    
    // Check for hallucinations
    const hallucinations = verificationResult.claims.filter(claim => claim.isHallucination);
    
    if (hallucinations.length > 0) {
      return { 
        violationType: 'hallucination',
        details: { 
          claims: hallucinations.map(h => h.claim.text),
          verificationScore: verificationResult.overallScore
        },
        verificationResult
      };
    }
    
    // Check for low accuracy
    if (verificationResult.overallScore.accuracy < 0.5 && verificationResult.claims.length > 0) {
      return { 
        violationType: 'low_accuracy',
        details: { 
          accuracy: verificationResult.overallScore.accuracy,
          claims: verificationResult.claims
            .filter(claim => claim.score.accuracy < 0.5)
            .map(c => c.claim.text)
        },
        verificationResult
      };
    }
    
    // No violations detected
    return null;
  } catch (error) {
    console.error('VERITAS response analysis error:', error);
    
    // Fall back to simple keyword-based detection
    // This would be replaced with the existing detection logic
    return null;
  }
}

/**
 * Calculate trust impact based on verification result
 * @param verificationResult Verification result
 * @returns Trust impact score (-1 to 1)
 */
export function calculateTrustImpact(verificationResult: VerificationResult | undefined): number {
  if (!verificationResult) {
    return 0;
  }
  
  // Calculate hallucination rate
  const hallucinationRate = verificationResult.claims.length > 0
    ? verificationResult.claims.filter(claim => claim.isHallucination).length / verificationResult.claims.length
    : 0;
  
  // Calculate trust impact
  let trustImpact = 0;
  
  // High accuracy with high confidence has positive impact
  if (verificationResult.overallScore.accuracy > 0.7 && verificationResult.overallScore.confidence > 0.7) {
    trustImpact = 0.5 + (verificationResult.overallScore.accuracy * 0.5);
  }
  // Low accuracy with high confidence has negative impact
  else if (verificationResult.overallScore.accuracy < 0.3 && verificationResult.overallScore.confidence > 0.7) {
    trustImpact = -0.5 - ((1 - verificationResult.overallScore.accuracy) * 0.5);
  }
  // Otherwise, impact is proportional to accuracy and confidence
  else {
    trustImpact = (verificationResult.overallScore.accuracy - 0.5) * verificationResult.overallScore.confidence;
  }
  
  // Hallucinations have a strong negative impact on trust
  if (hallucinationRate > 0) {
    trustImpact -= hallucinationRate * 0.8;
  }
  
  // Ensure trust impact is between -1 and 1
  return Math.max(-1, Math.min(1, trustImpact));
}

/**
 * Calculate compliance impact based on verification result
 * @param verificationResult Verification result
 * @returns Compliance impact score (-1 to 1)
 */
export function calculateComplianceImpact(verificationResult: VerificationResult | undefined): number {
  if (!verificationResult) {
    return 0;
  }
  
  // Calculate hallucination rate
  const hallucinationRate = verificationResult.claims.length > 0
    ? verificationResult.claims.filter(claim => claim.isHallucination).length / verificationResult.claims.length
    : 0;
  
  // Hallucinations have a strong negative impact on compliance
  if (hallucinationRate > 0) {
    return -0.7 - (hallucinationRate * 0.3);
  }
  
  // Low accuracy has negative impact on compliance
  if (verificationResult.overallScore.accuracy < 0.5) {
    return -0.5 * (1 - verificationResult.overallScore.accuracy);
  }
  
  // High accuracy has positive impact on compliance
  return 0.5 * verificationResult.overallScore.accuracy;
}

/**
 * Calculate error impact based on verification result
 * @param verificationResult Verification result
 * @returns Error impact score (-1 to 1)
 */
export function calculateErrorImpact(verificationResult: VerificationResult | undefined): number {
  if (!verificationResult) {
    return 0;
  }
  
  // Calculate hallucination rate
  const hallucinationRate = verificationResult.claims.length > 0
    ? verificationResult.claims.filter(claim => claim.isHallucination).length / verificationResult.claims.length
    : 0;
  
  // Calculate unverified claim rate
  const unverifiedRate = verificationResult.claims.length > 0
    ? verificationResult.claims.filter(claim => !claim.verified).length / verificationResult.claims.length
    : 0;
  
  // Hallucinations and unverified claims contribute to error rate
  return -0.5 * hallucinationRate - 0.3 * unverifiedRate;
}

/**
 * Integration function to extend metric calculator with VERITAS
 * @param metricCalculator The metric calculator to extend
 * @returns Extended metric calculator with VERITAS functions
 */
export function extendMetricCalculatorWithVeritas(metricCalculator: any): any {
  return {
    ...metricCalculator,
    analyzeResponseWithVeritas,
    calculateTrustImpact,
    calculateComplianceImpact,
    calculateErrorImpact
  };
}
