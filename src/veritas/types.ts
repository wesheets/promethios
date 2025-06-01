/**
 * VERITAS Module Type Definitions
 * 
 * This file contains all type definitions for the VERITAS (Verification, Evidence Retrieval, 
 * and Information Truth Assessment System) module.
 */

/**
 * Options for VERITAS verification
 */
export interface VeritasOptions {
  /** Verification mode that determines strictness level */
  mode?: 'strict' | 'balanced' | 'lenient';
  
  /** Maximum number of claims to extract and verify */
  maxClaims?: number;
  
  /** Confidence threshold for determining hallucinations */
  confidenceThreshold?: number;
  
  /** Depth of evidence retrieval */
  retrievalDepth?: number;
}

/**
 * Result of claim validation
 */
export interface ClaimValidation {
  /** The original claim text */
  claim: {
    text: string;
    position: {
      start: number;
      end: number;
    };
  };
  
  /** Whether the claim is verified */
  verified: boolean;
  
  /** Confidence scores */
  score: {
    /** Accuracy score (0-1) */
    accuracy: number;
    
    /** Confidence score (0-1) */
    confidence: number;
  };
  
  /** Supporting evidence for the claim */
  supportingEvidence: Evidence[];
  
  /** Contradicting evidence for the claim */
  contradictingEvidence: Evidence[];
  
  /** Whether the claim is determined to be a hallucination */
  isHallucination: boolean;
}

/**
 * Evidence for claim validation
 */
export interface Evidence {
  /** Evidence text */
  text: string;
  
  /** Source of the evidence */
  source: EvidenceSource;
  
  /** Relevance score (0-1) */
  relevance: number;
  
  /** Sentiment of the evidence towards the claim */
  sentiment: 'supporting' | 'contradicting' | 'neutral';
}

/**
 * Source of evidence
 */
export interface EvidenceSource {
  /** Unique identifier for the source */
  id: string;
  
  /** Name of the source */
  name: string;
  
  /** URL of the source (if applicable) */
  url?: string;
  
  /** Reliability score (0-1) */
  reliability: number;
  
  /** Timestamp of the source */
  timestamp?: string;
}

/**
 * Result of verification
 */
export interface VerificationResult {
  /** Overall scores for the verification */
  overallScore: {
    /** Accuracy score (0-1) */
    accuracy: number;
    
    /** Confidence score (0-1) */
    confidence: number;
  };
  
  /** Validated claims */
  claims: ClaimValidation[];
  
  /** Sources used for verification */
  sources: EvidenceSource[];
  
  /** Timestamp of verification */
  timestamp: string;
}

/**
 * Observation from VERITAS
 */
export interface VeritasObservation {
  /** Agent ID */
  agentId: string;
  
  /** Timestamp of observation */
  timestamp: string;
  
  /** Verification result */
  verificationResult: VerificationResult;
  
  /** Detected hallucinations */
  hallucinations: Array<{
    /** Hallucinated claim */
    claim: string;
    
    /** Confidence score (0-1) */
    confidence: number;
    
    /** Number of contradictions */
    contradictions: number;
  }>;
}

/**
 * Verification metrics
 */
export interface VerificationMetrics {
  /** Verification accuracy (0-1) */
  accuracy: number;
  
  /** Verification confidence (0-1) */
  confidence: number;
  
  /** Number of claims verified */
  claimsVerified: number;
  
  /** Number of claims unverified */
  claimsUnverified: number;
  
  /** Verification time in milliseconds */
  verificationTime: number;
  
  /** Average source quality (0-1) */
  sourceQuality: number;
  
  /** Hallucination rate (0-1) */
  hallucinationRate: number;
}

/**
 * Comparison of verification results
 */
export interface VerificationComparison {
  /** Governed text verification result */
  governed: VerificationResult;
  
  /** Ungoverned text verification result */
  ungoverned: VerificationResult;
  
  /** Difference in accuracy */
  accuracyDiff: number;
  
  /** Difference in confidence */
  confidenceDiff: number;
  
  /** Difference in hallucination rate */
  hallucinationDiff: number;
}
