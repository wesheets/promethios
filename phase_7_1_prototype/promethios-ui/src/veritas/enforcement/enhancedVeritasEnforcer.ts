/**
 * Enhanced VERITAS Enforcer
 * 
 * This module enhances the VERITAS enforcer with domain and uncertainty awareness.
 * It provides nuanced enforcement based on domain risk level and uncertainty expression.
 */

import { VerificationResult } from '../core';
import { 
  enforceVeritas as originalEnforceVeritas, 
  EnforcementResult, 
  EnforcementOptions 
} from './veritasEnforcer';
import { DomainClassification } from '../domainClassifier';
import { UncertaintyEvaluation } from '../uncertaintyDetector';

// Types
export interface EnhancedEnforcementOptions extends EnforcementOptions {
  domainSpecificEnabled: boolean;
  uncertaintyRewardEnabled: boolean;
  domain?: DomainClassification;
  uncertaintyEvaluations?: UncertaintyEvaluation[];
}

export interface EnhancedEnforcementResult extends EnforcementResult {
  domainContext?: {
    domain: string;
    riskLevel: string;
    confidenceThreshold: number;
  };
  uncertaintyContext?: {
    appropriateCount: number;
    inappropriateCount: number;
    missingCount: number;
    trustBonus: number;
  };
}

/**
 * Enforce VERITAS verification with domain and uncertainty awareness
 * @param text Original response text
 * @param verificationResult Verification result
 * @param options Enforcement options
 * @returns Enhanced enforcement result
 */
export function enforceVeritasEnhanced(
  text: string,
  verificationResult: VerificationResult,
  options: Partial<EnhancedEnforcementOptions> = {}
): EnhancedEnforcementResult {
  // Start with default options
  const defaultOptions: EnhancedEnforcementOptions = {
    blockHallucinations: true,
    trustPenalty: 10,
    warningLevel: 'explicit',
    minHallucinationThreshold: 0.5,
    domainSpecificEnabled: false,
    uncertaintyRewardEnabled: false
  };
  
  // Merge with provided options
  const mergedOptions: EnhancedEnforcementOptions = {
    ...defaultOptions,
    ...options
  };
  
  // Apply domain-specific adjustments if enabled
  if (mergedOptions.domainSpecificEnabled && mergedOptions.domain) {
    const domain = mergedOptions.domain.domain;
    
    // Adjust blocking based on domain configuration
    mergedOptions.blockHallucinations = domain.blockingEnabled;
    
    // Adjust trust penalty based on domain risk level
    if (domain.riskLevel === 'high') {
      mergedOptions.trustPenalty = Math.max(mergedOptions.trustPenalty, 15);
    } else if (domain.riskLevel === 'medium') {
      // No adjustment for medium risk
    } else {
      // Lower penalty for low risk domains
      mergedOptions.trustPenalty = Math.min(mergedOptions.trustPenalty, 5);
    }
    
    // Adjust hallucination threshold based on domain risk level
    if (domain.riskLevel === 'high') {
      mergedOptions.minHallucinationThreshold = Math.min(mergedOptions.minHallucinationThreshold, 0.3);
    } else if (domain.riskLevel === 'medium') {
      // No adjustment for medium risk
    } else {
      // Higher threshold for low risk domains
      mergedOptions.minHallucinationThreshold = Math.max(mergedOptions.minHallucinationThreshold, 0.7);
    }
  }
  
  // Apply uncertainty adjustments if enabled
  let uncertaintyContext;
  if (mergedOptions.uncertaintyRewardEnabled && mergedOptions.uncertaintyEvaluations) {
    const evaluations = mergedOptions.uncertaintyEvaluations;
    
    // Count appropriate, inappropriate, and missing uncertainty expressions
    const appropriateCount = evaluations.filter(
      eval => eval.hasQualifier && eval.appropriatenessScore > 0.7
    ).length;
    
    const inappropriateCount = evaluations.filter(
      eval => eval.hasQualifier && eval.appropriatenessScore <= 0.3
    ).length;
    
    const missingCount = evaluations.filter(
      eval => !eval.hasQualifier && eval.evidenceStrength < 0.7
    ).length;
    
    // Calculate uncertainty bonus
    let trustBonus = 0;
    
    if (evaluations.length > 0) {
      // Calculate percentage of claims with appropriate uncertainty
      const appropriatePercentage = appropriateCount / evaluations.length;
      
      if (appropriatePercentage >= 0.8) {
        // Excellent uncertainty expression
        trustBonus = 3;
      } else if (appropriatePercentage >= 0.5) {
        // Good uncertainty expression
        trustBonus = 2;
      } else if (appropriatePercentage >= 0.3) {
        // Moderate uncertainty expression
        trustBonus = 1;
      }
      
      // Adjust bonus based on domain risk level if domain-specific is enabled
      if (mergedOptions.domainSpecificEnabled && mergedOptions.domain) {
        const domain = mergedOptions.domain.domain;
        
        if (domain.riskLevel === 'high' && domain.uncertaintyRequired) {
          // Higher bonus for appropriate uncertainty in high-risk domains
          trustBonus = Math.round(trustBonus * 1.5);
        } else if (domain.riskLevel === 'low') {
          // Lower bonus for low-risk domains
          trustBonus = Math.max(0, trustBonus - 1);
        }
      }
    }
    
    // Store uncertainty context for the result
    uncertaintyContext = {
      appropriateCount,
      inappropriateCount,
      missingCount,
      trustBonus
    };
    
    // If uncertainty is required but missing, increase penalty
    if (
      mergedOptions.domainSpecificEnabled && 
      mergedOptions.domain && 
      mergedOptions.domain.domain.uncertaintyRequired && 
      appropriateCount === 0 && 
      evaluations.length > 0
    ) {
      mergedOptions.trustPenalty += 5;
    }
  }
  
  // Call the original enforcer with adjusted options
  const baseResult = originalEnforceVeritas(text, verificationResult, mergedOptions);
  
  // Create enhanced result with domain and uncertainty context
  const enhancedResult: EnhancedEnforcementResult = {
    ...baseResult
  };
  
  // Add domain context if enabled
  if (mergedOptions.domainSpecificEnabled && mergedOptions.domain) {
    const domain = mergedOptions.domain.domain;
    enhancedResult.domainContext = {
      domain: domain.name,
      riskLevel: domain.riskLevel,
      confidenceThreshold: domain.confidenceThreshold
    };
  }
  
  // Add uncertainty context if enabled
  if (mergedOptions.uncertaintyRewardEnabled && uncertaintyContext) {
    enhancedResult.uncertaintyContext = uncertaintyContext;
  }
  
  return enhancedResult;
}

/**
 * Generate enhanced observer notes with domain and uncertainty context
 * @param verificationResult Verification result
 * @param domainClassification Domain classification
 * @param uncertaintyEvaluations Uncertainty evaluations
 * @returns Enhanced observer notes
 */
export function generateEnhancedObserverNotes(
  verificationResult: VerificationResult,
  domainClassification?: DomainClassification,
  uncertaintyEvaluations?: UncertaintyEvaluation[]
): string {
  // Start with basic information
  let notes = `VERITAS Verification Result:\n`;
  notes += `Overall Accuracy: ${Math.round(verificationResult.overallScore.accuracy * 100)}%\n`;
  notes += `Overall Confidence: ${Math.round(verificationResult.overallScore.confidence * 100)}%\n\n`;
  
  // Add domain information if available
  if (domainClassification) {
    notes += `Domain: ${domainClassification.domain.name} (${domainClassification.domain.riskLevel} risk, ${Math.round(domainClassification.confidence * 100)}% confidence)\n`;
    
    // Add secondary domains if any
    if (domainClassification.secondaryDomains.length > 0) {
      notes += `Secondary domains: ${domainClassification.secondaryDomains
        .map(d => `${d.domain.name} (${Math.round(d.confidence * 100)}%)`)
        .join(', ')}\n`;
    }
    
    notes += `\n`;
  }
  
  // Add claim information
  if (verificationResult.claims.length > 0) {
    notes += `Claims:\n`;
    
    verificationResult.claims.forEach((claim, index) => {
      notes += `${index + 1}. "${claim.claim}"\n`;
      notes += `   Hallucination Score: ${Math.round(claim.hallucinationScore * 100)}%\n`;
      
      // Add uncertainty information if available
      if (uncertaintyEvaluations && uncertaintyEvaluations[index]) {
        const evaluation = uncertaintyEvaluations[index];
        
        if (evaluation.hasQualifier) {
          notes += `   Uncertainty: Present (${Math.round(evaluation.qualifierStrength * 100)}% strength)\n`;
          notes += `   Appropriateness: ${Math.round(evaluation.appropriatenessScore * 100)}%\n`;
        } else {
          notes += `   Uncertainty: Missing\n`;
          
          if (evaluation.evidenceStrength < 0.7) {
            notes += `   Suggested qualifiers: ${evaluation.suggestedQualifiers?.join(', ')}\n`;
          }
        }
      }
      
      notes += `\n`;
    });
  } else {
    notes += `No claims detected.\n\n`;
  }
  
  // Add uncertainty summary if available
  if (uncertaintyEvaluations && uncertaintyEvaluations.length > 0) {
    const appropriateCount = uncertaintyEvaluations.filter(
      eval => eval.hasQualifier && eval.appropriatenessScore > 0.7
    ).length;
    
    const inappropriateCount = uncertaintyEvaluations.filter(
      eval => eval.hasQualifier && eval.appropriatenessScore <= 0.3
    ).length;
    
    const missingCount = uncertaintyEvaluations.filter(
      eval => !eval.hasQualifier && eval.evidenceStrength < 0.7
    ).length;
    
    notes += `Uncertainty Summary:\n`;
    notes += `Appropriate expressions: ${appropriateCount}\n`;
    notes += `Inappropriate expressions: ${inappropriateCount}\n`;
    notes += `Missing expressions: ${missingCount}\n\n`;
    
    // Calculate and add trust bonus
    if (appropriateCount > 0) {
      const appropriatePercentage = appropriateCount / uncertaintyEvaluations.length;
      let trustBonus = 0;
      
      if (appropriatePercentage >= 0.8) {
        trustBonus = 3;
      } else if (appropriatePercentage >= 0.5) {
        trustBonus = 2;
      } else if (appropriatePercentage >= 0.3) {
        trustBonus = 1;
      }
      
      if (trustBonus > 0) {
        notes += `Trust bonus for appropriate uncertainty: +${trustBonus}\n\n`;
      }
    }
  }
  
  // Add verification timestamp
  notes += `Verification Time: ${verificationResult.timestamp}\n`;
  
  return notes;
}
