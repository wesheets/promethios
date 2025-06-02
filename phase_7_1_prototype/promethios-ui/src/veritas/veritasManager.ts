/**
 * VERITAS Manager
 * 
 * This module provides a unified entry point for the VERITAS system with toggle functionality.
 * It allows enabling/disabling VERITAS verification without affecting the rest of the system.
 */

import { verify, VerificationResult, VeritasOptions } from './core';
import { 
  enforceVeritas, 
  EnforcementResult, 
  EnforcementOptions, 
  generateObserverNotes 
} from './enforcement/veritasEnforcer';

// Types
export interface VeritasManagerConfig {
  enabled: boolean;
  domainSpecificEnabled: boolean;
  uncertaintyRewardEnabled: boolean;
  defaultMode: 'strict' | 'balanced' | 'lenient';
  enforcementOptions?: Partial<EnforcementOptions>;
  verificationOptions?: Partial<VeritasOptions>;
}

export interface ProcessOptions {
  enabled?: boolean;
  mode?: 'strict' | 'balanced' | 'lenient';
  domainOverride?: string;
  blockHallucinations?: boolean;
}

export interface VeritasResult {
  verificationResult: VerificationResult;
  enforcementResult: EnforcementResult;
  trustAdjustment: number;
  observerNotes: string;
}

// Default configuration
const DEFAULT_CONFIG: VeritasManagerConfig = {
  enabled: true,
  domainSpecificEnabled: false, // Will be enabled in future phases
  uncertaintyRewardEnabled: false, // Will be enabled in future phases
  defaultMode: 'balanced',
  enforcementOptions: {
    blockHallucinations: true,
    trustPenalty: 10,
    warningLevel: 'explicit',
    minHallucinationThreshold: 0.5
  },
  verificationOptions: {
    mode: 'balanced',
    maxClaims: 5,
    confidenceThreshold: 0.7,
    retrievalDepth: 3
  }
};

/**
 * VERITAS Manager class
 * Provides a unified interface for VERITAS verification with toggle functionality
 */
export class VeritasManager {
  private config: VeritasManagerConfig;
  private metrics: any = {}; // Will be enhanced in future phases
  
  /**
   * Constructor
   * @param config Configuration for VERITAS Manager
   */
  constructor(config: Partial<VeritasManagerConfig> = {}) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Process a response through VERITAS
   * @param text The response text to process
   * @param options Processing options
   * @returns VERITAS result
   */
  async processResponse(text: string, options: ProcessOptions = {}): Promise<VeritasResult> {
    // Determine if VERITAS is enabled for this request
    const isEnabled = options.enabled !== undefined ? options.enabled : this.config.enabled;
    
    // If VERITAS is disabled, return a default "pass" result
    if (!isEnabled) {
      return this.generatePassthroughResult(text);
    }
    
    try {
      // Determine verification mode
      const mode = options.mode || this.config.defaultMode;
      
      // Prepare verification options
      const verificationOptions: VeritasOptions = {
        ...this.config.verificationOptions,
        mode: mode as any
      };
      
      // Prepare enforcement options
      const enforcementOptions: Partial<EnforcementOptions> = {
        ...this.config.enforcementOptions,
        blockHallucinations: options.blockHallucinations !== undefined 
          ? options.blockHallucinations 
          : this.config.enforcementOptions?.blockHallucinations
      };
      
      // Verify the response
      const verificationResult = await verify(text, verificationOptions);
      
      // Enforce verification results
      const enforcementResult = enforceVeritas(text, verificationResult, enforcementOptions);
      
      // Generate observer notes
      const observerNotes = generateObserverNotes(verificationResult);
      
      // Return the result
      return {
        verificationResult,
        enforcementResult,
        trustAdjustment: -enforcementResult.trustPenalty,
        observerNotes
      };
    } catch (error) {
      console.error('VERITAS processing error:', error);
      
      // Return a default result in case of error
      return this.generatePassthroughResult(text, 'Error during VERITAS processing');
    }
  }
  
  /**
   * Generate a passthrough result when VERITAS is disabled
   * @param text The original response text
   * @param note Optional note to include
   * @returns Default VERITAS result that allows the response to pass through
   */
  private generatePassthroughResult(text: string, note: string = 'VERITAS verification disabled'): VeritasResult {
    const timestamp = new Date().toISOString();
    
    return {
      verificationResult: {
        overallScore: { accuracy: 1, confidence: 1 },
        claims: [],
        sources: [],
        timestamp
      },
      enforcementResult: {
        blocked: false,
        modified: false,
        trustPenalty: 0,
        originalResponse: text,
        enforcedResponse: text,
        verificationResult: {
          overallScore: { accuracy: 1, confidence: 1 },
          claims: [],
          sources: [],
          timestamp
        }
      },
      trustAdjustment: 0,
      observerNotes: note
    };
  }
  
  /**
   * Check if VERITAS is enabled
   * @returns Whether VERITAS is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Enable VERITAS
   */
  enableVeritas(): void {
    this.config.enabled = true;
  }
  
  /**
   * Disable VERITAS
   */
  disableVeritas(): void {
    this.config.enabled = false;
  }
  
  /**
   * Get current configuration
   * @returns Current VERITAS configuration
   */
  getConfig(): VeritasManagerConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   * @param config New configuration (partial)
   */
  updateConfig(config: Partial<VeritasManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get metrics
   * @returns Current metrics
   */
  getMetrics(): any {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {};
  }
}

/**
 * Create and initialize a VERITAS Manager instance
 * @param config Configuration for VERITAS Manager
 * @returns Initialized VERITAS Manager
 */
export function createVeritasManager(config: Partial<VeritasManagerConfig> = {}): VeritasManager {
  return new VeritasManager(config);
}

// Export singleton instance for use throughout the application
export const veritasManager = createVeritasManager();
