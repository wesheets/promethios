/**
 * VERITAS Module Constants
 * 
 * This file contains constants used throughout the VERITAS module.
 */

/**
 * Default options for VERITAS verification
 */
export const DEFAULT_OPTIONS = {
  /** Default verification mode */
  mode: 'balanced' as const,
  
  /** Default maximum number of claims to extract and verify */
  maxClaims: 5,
  
  /** Default confidence threshold for determining hallucinations */
  confidenceThreshold: 0.7,
  
  /** Default depth of evidence retrieval */
  retrievalDepth: 3
};

/**
 * Known fictional legal cases for hallucination detection
 */
export const FICTIONAL_LEGAL_CASES = [
  'turner v. cognivault',
  'cognivault case',
  'turner case',
  'smith v. ai corp',
  'johnson v. neural systems',
  'doe v. algorithm',
  'people v. machinelearning',
  'united states v. deepmind',
  'ai liability case of 2021',
  'ai agents case 2021',
  'legal precedent 2021 ai',
  'court ruling ai agents 2021',
  'legal case ai responsibility 2021'
];

/**
 * Confidence thresholds for different verification modes
 */
export const MODE_THRESHOLDS = {
  strict: {
    confidenceThreshold: 0.85,
    accuracyThreshold: 0.8,
    evidenceThreshold: 3
  },
  balanced: {
    confidenceThreshold: 0.7,
    accuracyThreshold: 0.6,
    evidenceThreshold: 2
  },
  lenient: {
    confidenceThreshold: 0.5,
    accuracyThreshold: 0.4,
    evidenceThreshold: 1
  }
};

/**
 * Telemetry event types for VERITAS
 */
export const TELEMETRY_EVENTS = {
  VERIFICATION_STARTED: 'veritas.verification.started',
  VERIFICATION_COMPLETED: 'veritas.verification.completed',
  HALLUCINATION_DETECTED: 'veritas.hallucination.detected',
  EVIDENCE_RETRIEVED: 'veritas.evidence.retrieved',
  CLAIM_VALIDATED: 'veritas.claim.validated'
};

/**
 * Error messages for VERITAS
 */
export const ERROR_MESSAGES = {
  INVALID_TEXT: 'Invalid text provided for verification',
  EVIDENCE_RETRIEVAL_FAILED: 'Failed to retrieve evidence',
  CLAIM_VALIDATION_FAILED: 'Failed to validate claim',
  VERIFICATION_FAILED: 'Verification process failed'
};
