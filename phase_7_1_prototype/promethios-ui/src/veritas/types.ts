/**
 * Basic Veritas Types
 * 
 * Core types for Veritas verification system
 */

export interface VerificationResult {
  text: string;
  verified: boolean;
  confidence: number;
  timestamp: Date;
  issues?: string[];
}

export interface VeritasOptions {
  mode?: 'balanced' | 'strict' | 'lenient';
  includeEmotionalAnalysis?: boolean;
  includeTrustSignals?: boolean;
  confidenceThreshold?: number;
}

export interface VeritasConfig {
  apiEndpoint?: string;
  timeout?: number;
  retryAttempts?: number;
}

