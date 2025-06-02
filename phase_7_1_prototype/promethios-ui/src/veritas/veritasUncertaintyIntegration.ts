/**
 * Uncertainty Integration for VERITAS
 * 
 * This module integrates uncertainty detection with the VERITAS verification pipeline.
 * It extends the domain-aware verification process to evaluate uncertainty expressions.
 */

import { verify, VerificationResult, VeritasOptions } from './core';
import { 
  enforceVeritas, 
  EnforcementResult, 
  EnforcementOptions, 
  generateObserverNotes 
} from './enforcement/veritasEnforcer';
import { DomainClassifier, DomainClassification, domainClassifier } from './domainClassifier';
import { 
  UncertaintyDetector, 
  UncertaintyEvaluation, 
  uncertaintyDetector 
} from './uncertaintyDetector';
import { VeritasManagerConfig } from './veritasManager';

// Types
export interface ProcessOptions {
  enabled?: boolean;
  mode?: 'strict' | 'balanced' | 'lenient';
  domainOverride?: string;
  blockHallucinations?: boolean;
}

export interface EnhancedVeritasResult {
  verificationResult: VerificationResult;
  enforcementResult: EnforcementResult;
  domainClassification: DomainClassification;
  uncertaintyEvaluations: UncertaintyEvaluation[];
  trustAdjustment: number;
  trustBonus?: number;
  observerNotes: string;
}

/**
 * Process text through the enhanced VERITAS pipeline with domain and uncertainty awareness
 * @param text Text to process
 * @param options Processing options
 * @param config VERITAS configuration
 * @returns Enhanced VERITAS result with domain and uncertainty evaluations
 */
export async function processWithEnhancedVeritas(
  text: string,
  options: ProcessOptions = {},
  config: VeritasManagerConfig
): Promise<EnhancedVeritasResult> {
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
    
    // Evaluate uncertainty for each claim
    const uncertaintyEvaluations: UncertaintyEvaluation[] = [];
    
    verificationResult.claims.forEach(claim => {
      // Calculate evidence strength based on supporting and contradicting evidence
      const supportingEvidenceStrength = claim.supportingEvidence.reduce(
        (sum, evidence) => sum + evidence.relevance * evidence.source.reliability,
        0
      ) / Math.max(1, claim.supportingEvidence.length);
      
      const contradictingEvidenceStrength = claim.contradictingEvidence.reduce(
        (sum, evidence) => sum + evidence.relevance * evidence.source.reliability,
        0
      ) / Math.max(1, claim.contradictingEvidence.length);
      
      // Calculate overall evidence strength (0-1)
      // Higher when supporting evidence is strong and contradicting evidence is weak
      const evidenceStrength = claim.supportingEvidence.length > 0
        ? (supportingEvidenceStrength - 0.5 * contradictingEvidenceStrength) / (1 + 0.5 * contradictingEvidenceStrength)
        : 0;
      
      // Evaluate uncertainty expression
      const evaluation = uncertaintyDetector.evaluateClaimUncertainty(
        claim.claim,
        Math.max(0, Math.min(1, evidenceStrength))
      );
      
      uncertaintyEvaluations.push(evaluation);
    });
    
    // Calculate uncertainty bonus if enabled
    let trustBonus = 0;
    if (config.uncertaintyRewardEnabled) {
      trustBonus = calculateUncertaintyBonus(
        uncertaintyEvaluations,
        domainClassification.domain
      );
    }
    
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
      
      // If uncertainty is required for this domain, check if it's present
      if (domainClassification.domain.uncertaintyRequired) {
        const hasAppropriateUncertainty = uncertaintyEvaluations.some(
          eval => eval.hasQualifier && eval.appropriatenessScore > 0.7
        );
        
        // If uncertainty is required but not present, increase penalty
        if (!hasAppropriateUncertainty) {
          enforcementOptions.trustPenalty = (enforcementOptions.trustPenalty || 10) + 5;
        }
      }
    }
    
    // Enforce verification results
    const enforcementResult = enforceVeritas(text, verificationResult, enforcementOptions);
    
    // Generate observer notes with domain and uncertainty context
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
    
    // Add uncertainty information to observer notes
    if (config.uncertaintyRewardEnabled) {
      const appropriateUncertainty = uncertaintyEvaluations.filter(
        eval => eval.hasQualifier && eval.appropriatenessScore > 0.7
      );
      
      const inappropriateUncertainty = uncertaintyEvaluations.filter(
        eval => eval.hasQualifier && eval.appropriatenessScore <= 0.3
      );
      
      const missingUncertainty = uncertaintyEvaluations.filter(
        eval => !eval.hasQualifier && eval.evidenceStrength < 0.7
      );
      
      if (appropriateUncertainty.length > 0) {
        observerNotes += `\n\nAppropriate uncertainty expressions: ${appropriateUncertainty.length}`;
        if (trustBonus > 0) {
          observerNotes += ` (Trust bonus: +${trustBonus})`;
        }
      }
      
      if (inappropriateUncertainty.length > 0) {
        observerNotes += `\n\nInappropriate uncertainty expressions: ${inappropriateUncertainty.length}`;
      }
      
      if (missingUncertainty.length > 0) {
        observerNotes += `\n\nMissing uncertainty expressions: ${missingUncertainty.length}`;
      }
    }
    
    // Calculate net trust adjustment
    const trustAdjustment = -enforcementResult.trustPenalty + trustBonus;
    
    return {
      verificationResult,
      enforcementResult,
      domainClassification,
      uncertaintyEvaluations,
      trustAdjustment,
      trustBonus: trustBonus > 0 ? trustBonus : undefined,
      observerNotes
    };
  } catch (error) {
    console.error('Enhanced VERITAS processing error:', error);
    
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
      uncertaintyEvaluations: [],
      trustAdjustment: 0,
      observerNotes: 'Error during enhanced VERITAS processing'
    };
  }
}

/**
 * Calculate uncertainty bonus based on appropriate uncertainty expressions
 * @param evaluations Array of uncertainty evaluations
 * @param domain Domain configuration
 * @returns Trust bonus value
 */
export function calculateUncertaintyBonus(
  evaluations: UncertaintyEvaluation[],
  domain: any
): number {
  // No bonus if no evaluations
  if (evaluations.length === 0) {
    return 0;
  }
  
  // Count appropriate uncertainty expressions
  const appropriateCount = evaluations.filter(
    eval => eval.hasQualifier && eval.appropriatenessScore > 0.7
  ).length;
  
  // Calculate percentage of claims with appropriate uncertainty
  const appropriatePercentage = appropriateCount / evaluations.length;
  
  // Base bonus calculation
  let bonus = 0;
  
  if (appropriatePercentage >= 0.8) {
    // Excellent uncertainty expression
    bonus = 3;
  } else if (appropriatePercentage >= 0.5) {
    // Good uncertainty expression
    bonus = 2;
  } else if (appropriatePercentage >= 0.3) {
    // Moderate uncertainty expression
    bonus = 1;
  }
  
  // Adjust bonus based on domain risk level
  if (domain.riskLevel === 'high' && domain.uncertaintyRequired) {
    // Higher bonus for appropriate uncertainty in high-risk domains
    bonus = Math.round(bonus * 1.5);
  } else if (domain.riskLevel === 'low') {
    // Lower bonus for low-risk domains
    bonus = Math.max(0, bonus - 1);
  }
  
  return bonus;
}
