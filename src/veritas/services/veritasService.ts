/**
 * VERITAS Service Module
 * 
 * This module provides the service layer for VERITAS, exposing verification
 * functionality to the rest of the Promethios system through a clean API.
 */

import { 
  VeritasOptions, 
  VerificationResult, 
  VeritasObservation,
  VerificationMetrics,
  ClaimValidation
} from '../types';
import { verify, compareTexts, checkForFictionalLegalCase } from '../core';
import { TELEMETRY_EVENTS } from '../constants';

/**
 * VERITAS Service
 * 
 * Provides methods for text verification and hallucination detection.
 */
export const veritasService = {
  /**
   * Verify text for hallucinations and factual accuracy
   * @param text The text to verify
   * @param options Verification options
   * @returns Promise resolving to verification result
   */
  verifyText: async (text: string, options: VeritasOptions = {}): Promise<VerificationResult> => {
    try {
      // Log telemetry event for verification start
      logTelemetryEvent(TELEMETRY_EVENTS.VERIFICATION_STARTED, { textLength: text.length });
      
      // Perform verification
      const result = await verify(text, options);
      
      // Log telemetry event for verification completion
      logTelemetryEvent(TELEMETRY_EVENTS.VERIFICATION_COMPLETED, {
        textLength: text.length,
        claimsCount: result.claims.length,
        accuracy: result.overallScore.accuracy,
        confidence: result.overallScore.confidence,
        hallucinationsCount: result.claims.filter(claim => claim.isHallucination).length
      });
      
      return result;
    } catch (error) {
      console.error('VERITAS verification error:', error);
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  /**
   * Check if text contains fictional legal cases
   * @param text The text to check
   * @returns Whether the text contains fictional legal cases
   */
  checkForFictionalCases: (text: string): boolean => {
    return checkForFictionalLegalCase(text);
  },
  
  /**
   * Compare two texts and find common claims
   * @param text1 First text
   * @param text2 Second text
   * @param options Verification options
   * @returns Promise resolving to array of common claims
   */
  compareTexts: async (
    text1: string,
    text2: string,
    options: VeritasOptions = {}
  ): Promise<{ claim1: ClaimValidation, claim2: ClaimValidation }[]> => {
    try {
      return await compareTexts(text1, text2, options);
    } catch (error) {
      console.error('VERITAS comparison error:', error);
      throw new Error(`Comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  /**
   * Get verification metrics
   * @param result Verification result
   * @returns Verification metrics
   */
  getVerificationMetrics: (result: VerificationResult): VerificationMetrics => {
    const claimsVerified = result.claims.filter(claim => claim.verified).length;
    const claimsUnverified = result.claims.length - claimsVerified;
    const hallucinationRate = result.claims.length > 0 
      ? result.claims.filter(claim => claim.isHallucination).length / result.claims.length
      : 0;
    
    // Calculate average source quality
    let sourceQuality = 0;
    if (result.sources.length > 0) {
      const totalReliability = result.sources.reduce((sum, source) => sum + source.reliability, 0);
      sourceQuality = totalReliability / result.sources.length;
    }
    
    return {
      accuracy: result.overallScore.accuracy,
      confidence: result.overallScore.confidence,
      claimsVerified,
      claimsUnverified,
      verificationTime: 0, // This would be calculated from timestamps in a real implementation
      sourceQuality,
      hallucinationRate
    };
  },
  
  /**
   * Compare verification results between governed and ungoverned text
   * @param governedResult Verification result for governed text
   * @param ungovernedResult Verification result for ungoverned text
   * @returns Verification comparison
   */
  compareVerificationResults: (
    governedResult: VerificationResult,
    ungovernedResult: VerificationResult
  ) => {
    return {
      governed: governedResult,
      ungoverned: ungovernedResult,
      accuracyDiff: governedResult.overallScore.accuracy - ungovernedResult.overallScore.accuracy,
      confidenceDiff: governedResult.overallScore.confidence - ungovernedResult.overallScore.confidence,
      hallucinationDiff: 
        (ungovernedResult.claims.filter(claim => claim.isHallucination).length / Math.max(1, ungovernedResult.claims.length)) -
        (governedResult.claims.filter(claim => claim.isHallucination).length / Math.max(1, governedResult.claims.length))
    };
  }
};

/**
 * Log telemetry event
 * @param eventType Event type
 * @param data Event data
 */
function logTelemetryEvent(eventType: string, data: any): void {
  // In a real implementation, this would send telemetry to a monitoring system
  // For now, just log to console
  console.log(`VERITAS Telemetry: ${eventType}`, data);
  
  // In the future, this would integrate with Promethios telemetry system
  // telemetryService.logEvent(eventType, data);
}

export default veritasService;
