/**
 * VERITAS Governance Integration
 * 
 * This module integrates VERITAS enforcement with the governance pipeline.
 * It provides middleware to intercept responses, verify them with VERITAS,
 * and enforce hallucination prevention.
 */

import { VeritasIntegrationOptions } from '../enforcement/veritasIntegration';

// Types
export interface VeritasMiddlewareOptions extends Partial<VeritasIntegrationOptions> {
  // Additional middleware-specific options can be added here
  logResults?: boolean;
  bypassForSystemMessages?: boolean;
}

/**
 * Create VERITAS middleware for the governance pipeline
 * @param options Middleware options
 * @returns Middleware function
 */
export function createVeritasMiddleware(options: VeritasMiddlewareOptions = {}) {
  // Default options
  const mergedOptions: VeritasMiddlewareOptions = {
    enabled: true,
    logResults: true,
    bypassForSystemMessages: true,
    ...options,
    veritas: {
      mode: 'balanced',
      maxClaims: 5,
      confidenceThreshold: 0.7,
      retrievalDepth: 3,
      ...options.veritas
    },
    enforcement: {
      blockHallucinations: true,
      trustPenalty: 10,
      warningLevel: 'explicit',
      minHallucinationThreshold: 0.5,
      ...options.enforcement
    }
  };

  // Return the middleware function
  return async function veritasMiddleware(context: any, next: () => Promise<any>) {
    // Skip VERITAS for system messages if configured
    if (mergedOptions.bypassForSystemMessages && context.message?.role === 'system') {
      return next();
    }

    // Process the request normally first
    await next();

    // If VERITAS is disabled, skip verification
    if (!mergedOptions.enabled) {
      return;
    }

    // Get the response from context
    const response = context.response?.content;
    
    // Skip empty responses
    if (!response) {
      return;
    }

    try {
      // Dynamically import to avoid circular dependencies
      const { processWithVeritas } = await import('../enforcement/veritasIntegration');
      
      // Process the response with VERITAS
      const result = await processWithVeritas(
        response,
        context.trustScore || 0,
        mergedOptions
      );

      // Log results if enabled
      if (mergedOptions.logResults) {
        console.log('VERITAS verification result:', {
          blocked: result.enforcement.blocked,
          modified: result.enforcement.modified,
          trustPenalty: result.enforcement.trustPenalty,
          observerNotes: result.observerNotes
        });
      }

      // Update the response if it was modified
      if (result.enforcement.modified) {
        context.response.content = result.enforcement.enforcedResponse;
      }

      // Apply trust score adjustment
      if (context.updateTrustScore && result.trustScoreAdjustment !== 0) {
        context.updateTrustScore(result.trustScoreAdjustment);
      }

      // Add VERITAS results to trace
      if (context.addToTrace) {
        context.addToTrace({
          id: Date.now(),
          title: 'Factual Verification',
          module: 'VERITAS',
          status: result.enforcement.blocked ? 'failed' : 'passed',
          violation: result.enforcement.blocked,
          details: result.observerNotes
        });
      }

      // Add observer notes
      if (context.addObserverNote) {
        context.addObserverNote(result.observerNotes);
      }
    } catch (error) {
      console.error('VERITAS middleware error:', error);
      
      // Add error to trace
      if (context.addToTrace) {
        context.addToTrace({
          id: Date.now(),
          title: 'Factual Verification',
          module: 'VERITAS',
          status: 'error',
          violation: false,
          details: `Error during VERITAS processing: ${error}`
        });
      }
    }
  };
}

export default createVeritasMiddleware;
