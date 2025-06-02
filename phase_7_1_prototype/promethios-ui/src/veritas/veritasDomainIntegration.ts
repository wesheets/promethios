/**
 * Enhanced VERITAS Pipeline Integration
 * 
 * This module integrates domain classification with the VERITAS verification pipeline.
 * It extends the core verification process to apply domain-specific standards.
 */

import { verify, VerificationResult, VeritasOptions } from './core';
import { 
  enforceVeritas, 
  EnforcementResult, 
  EnforcementOptions, 
  generateObserverNotes 
} from './enforcement/veritasEnforcer';
import { DomainClassifier, DomainClassification, domainClassifier } from './domainClassifier';
import { VeritasManagerConfig } from './veritasManager';

// Types
export interface ProcessOptions {
  enabled?: boolean;
  mode?: 'strict' | 'balanced' | 'lenient';
  domainOverride?: string;
  blockHallucinations?: boolean;
}

export interface VeritasResult {
  verificationResult: VerificationResult;
  enforcementResult: EnforcementResult;
  domainClassification: DomainClassification;
  trustAdjustment: number;
  observerNotes: string;
}

/**
 * Process text through the enhanced VERITAS pipeline with domain classification
 * @param text Text to process
 * @param options Processing options
 * @param config VERITAS configuration
 * @returns VERITAS result with domain classification
 */
export async function processWithVeritasDomains(
  text: string,
  options: ProcessOptions = {},
  config: VeritasManagerConfig
): Promise<VeritasResult> {
  try {
    // Classify the domain
    let domainClassification: DomainClassification;
    
    if (options.domainOverride) {
      // Use the override domain if provided
      const overrideDomain = domainClassifier.getDomainById(options.domainOverride);
      if (overrideDomain) {
        domainClassification = {
          domain: overrideDomain,
          confidence: 1.0,
          secondaryDomains: []
        };
      } else {
        // Fall back to classification if override domain not found
        domainClassification = domainClassifier.classifyContent(text);
      }
    } else {
      // Classify the content
      domainClassification = domainClassifier.classifyContent(text);
    }
    
    // Determine verification mode
    const mode = options.mode || config.defaultMode;
    
    // Prepare verification options with domain-specific adjustments
    const verificationOptions: VeritasOptions = {
      ...config.verificationOptions,
      mode: mode as any
    };
    
    // If domain-specific verification is enabled, adjust thresholds
    if (config.domainSpecificEnabled) {
      // Adjust confidence threshold based on domain risk level
      if (domainClassification.domain.riskLevel === 'high') {
        verificationOptions.confidenceThreshold = Math.max(
          verificationOptions.confidenceThreshold || 0.7,
          domainClassification.domain.confidenceThreshold / 100
        );
      } else if (domainClassification.domain.riskLevel === 'medium') {
        // No adjustment for medium risk
      } else {
        // Lower threshold for low risk domains
        verificationOptions.confidenceThreshold = Math.min(
          verificationOptions.confidenceThreshold || 0.7,
          domainClassification.domain.confidenceThreshold / 100
        );
      }
    }
    
    // Verify the text
    const verificationResult = await verify(text, verificationOptions);
    
    // Prepare enforcement options with domain-specific adjustments
    const enforcementOptions: Partial<EnforcementOptions> = {
      ...config.enforcementOptions,
      blockHallucinations: options.blockHallucinations !== undefined 
        ? options.blockHallucinations 
        : config.enforcementOptions?.blockHallucinations
    };
    
    // If domain-specific enforcement is enabled, adjust options
    if (config.domainSpecificEnabled) {
      // Adjust blocking based on domain configuration
      enforcementOptions.blockHallucinations = domainClassification.domain.blockingEnabled;
      
      // Adjust trust penalty based on domain risk level
      if (domainClassification.domain.riskLevel === 'high') {
        enforcementOptions.trustPenalty = Math.max(
          enforcementOptions.trustPenalty || 10,
          15
        );
      } else if (domainClassification.domain.riskLevel === 'medium') {
        // No adjustment for medium risk
      } else {
        // Lower penalty for low risk domains
        enforcementOptions.trustPenalty = Math.min(
          enforcementOptions.trustPenalty || 10,
          5
        );
      }
    }
    
    // Enforce verification results
    const enforcementResult = enforceVeritas(text, verificationResult, enforcementOptions);
    
    // Generate observer notes with domain context
    let observerNotes = generateObserverNotes(verificationResult);
    
    // Add domain information to observer notes
    if (config.domainSpecificEnabled) {
      observerNotes = `Domain: ${domainClassification.domain.name} (${domainClassification.domain.riskLevel} risk, ${Math.round(domainClassification.confidence * 100)}% confidence)\n\n${observerNotes}`;
      
      // Add secondary domains if any
      if (domainClassification.secondaryDomains.length > 0) {
        observerNotes += `\n\nSecondary domains: ${domainClassification.secondaryDomains
          .map(d => `${d.domain.name} (${Math.round(d.confidence * 100)}%)`)
          .join(', ')}`;
      }
    }
    
    return {
      verificationResult,
      enforcementResult,
      domainClassification,
      trustAdjustment: -enforcementResult.trustPenalty,
      observerNotes
    };
  } catch (error) {
    console.error('VERITAS domain processing error:', error);
    
    // Return a minimal result with error indication
    return {
      verificationResult: {
        overallScore: { accuracy: 0, confidence: 0 },
        claims: [],
        sources: [],
        timestamp: new Date().toISOString()
      },
      enforcementResult: {
        blocked: false,
        modified: false,
        trustPenalty: 0,
        originalResponse: text,
        enforcedResponse: text,
        verificationResult: {
          overallScore: { accuracy: 0, confidence: 0 },
          claims: [],
          sources: [],
          timestamp: new Date().toISOString()
        }
      },
      domainClassification: {
        domain: domainClassifier.getDomainById('general') || {
          id: 'general',
          name: 'General',
          riskLevel: 'low',
          confidenceThreshold: 60,
          evidenceRequirement: 40,
          blockingEnabled: false,
          uncertaintyRequired: false,
          keywords: []
        },
        confidence: 0,
        secondaryDomains: []
      },
      trustAdjustment: 0,
      observerNotes: 'Error during VERITAS domain processing'
    };
  }
}
