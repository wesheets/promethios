/**
 * Uncertainty Detector for VERITAS
 * 
 * This module provides uncertainty detection and evaluation capabilities for the VERITAS system.
 * It identifies expressions of uncertainty and evaluates their appropriateness based on evidence.
 */

// Types
export interface QualifierPattern {
  pattern: string | RegExp;
  type: 'strong' | 'moderate' | 'weak';
  confidenceModifier: number;
}

export interface QualifierMatch {
  text: string;
  type: 'strong' | 'moderate' | 'weak';
  confidenceModifier: number;
  position: {start: number, end: number};
}

export interface UncertaintyEvaluation {
  claim: string;
  hasQualifier: boolean;
  qualifierStrength: number;
  evidenceStrength: number;
  appropriatenessScore: number;
  suggestedQualifiers?: string[];
}

// Default uncertainty patterns
export const DEFAULT_QUALIFIER_PATTERNS: QualifierPattern[] = [
  {
    pattern: /based on (available|current) (information|evidence|data|research)/i,
    type: "moderate",
    confidenceModifier: 0.7
  },
  {
    pattern: /it appears that|seems that|appears to be/i,
    type: "moderate",
    confidenceModifier: 0.6
  },
  {
    pattern: /may|might|could possibly|potentially/i,
    type: "weak",
    confidenceModifier: 0.5
  },
  {
    pattern: /is likely|probably|most likely/i,
    type: "moderate",
    confidenceModifier: 0.65
  },
  {
    pattern: /according to|as reported by|as stated in/i,
    type: "strong",
    confidenceModifier: 0.8
  },
  {
    pattern: /evidence suggests|research indicates|studies show/i,
    type: "strong",
    confidenceModifier: 0.75
  },
  {
    pattern: /generally|typically|usually|often/i,
    type: "moderate",
    confidenceModifier: 0.6
  },
  {
    pattern: /in my view|in my opinion|I believe|I think/i,
    type: "weak",
    confidenceModifier: 0.4
  },
  {
    pattern: /uncertain|unclear|not definitive|not conclusive/i,
    type: "weak",
    confidenceModifier: 0.3
  },
  {
    pattern: /historically|traditionally|conventionally/i,
    type: "moderate",
    confidenceModifier: 0.65
  }
];

/**
 * Uncertainty Detector class
 * Provides uncertainty detection and evaluation for content verification
 */
export class UncertaintyDetector {
  private patterns: QualifierPattern[];
  
  /**
   * Constructor
   * @param patterns Array of qualifier patterns
   */
  constructor(patterns: QualifierPattern[] = DEFAULT_QUALIFIER_PATTERNS) {
    this.patterns = [...patterns];
  }
  
  /**
   * Detect uncertainty qualifiers in text
   * @param text Text to analyze
   * @returns Array of qualifier matches
   */
  detectQualifiers(text: string): QualifierMatch[] {
    const matches: QualifierMatch[] = [];
    
    // Check each pattern for matches
    this.patterns.forEach(pattern => {
      const regex = pattern.pattern instanceof RegExp 
        ? pattern.pattern 
        : new RegExp(pattern.pattern, 'gi');
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          text: match[0],
          type: pattern.type,
          confidenceModifier: pattern.confidenceModifier,
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    });
    
    // Sort matches by position
    matches.sort((a, b) => a.position.start - b.position.start);
    
    return matches;
  }
  
  /**
   * Evaluate uncertainty expression for a claim
   * @param claim Claim text
   * @param evidenceStrength Strength of evidence (0-1)
   * @returns Uncertainty evaluation
   */
  evaluateClaimUncertainty(claim: string, evidenceStrength: number): UncertaintyEvaluation {
    // Detect qualifiers in the claim
    const qualifiers = this.detectQualifiers(claim);
    
    // Determine if the claim has qualifiers
    const hasQualifier = qualifiers.length > 0;
    
    // Calculate qualifier strength (average of all qualifiers)
    const qualifierStrength = hasQualifier
      ? qualifiers.reduce((sum, q) => sum + q.confidenceModifier, 0) / qualifiers.length
      : 0;
    
    // Calculate appropriateness score
    // Higher score means the uncertainty expression is more appropriate for the evidence
    let appropriatenessScore = 0;
    
    if (evidenceStrength >= 0.8) {
      // Strong evidence - low uncertainty is appropriate
      appropriatenessScore = hasQualifier
        ? 1 - qualifierStrength // Strong qualifiers reduce appropriateness
        : 0.9; // No qualifiers is mostly appropriate
    } else if (evidenceStrength >= 0.5) {
      // Moderate evidence - moderate uncertainty is appropriate
      const idealQualifierStrength = 0.6;
      appropriatenessScore = hasQualifier
        ? 1 - Math.abs(qualifierStrength - idealQualifierStrength)
        : 0.5; // No qualifiers is somewhat appropriate
    } else {
      // Weak evidence - high uncertainty is appropriate
      appropriatenessScore = hasQualifier
        ? qualifierStrength // Weak qualifiers increase appropriateness
        : 0.2; // No qualifiers is inappropriate
    }
    
    // Generate suggested qualifiers if needed
    const suggestedQualifiers = this.generateSuggestedQualifiers(claim, evidenceStrength);
    
    return {
      claim,
      hasQualifier,
      qualifierStrength,
      evidenceStrength,
      appropriatenessScore,
      suggestedQualifiers: hasQualifier ? undefined : suggestedQualifiers
    };
  }
  
  /**
   * Generate suggested qualifiers for a claim
   * @param claim Claim text
   * @param evidenceStrength Strength of evidence (0-1)
   * @returns Array of suggested qualifiers
   */
  generateSuggestedQualifiers(claim: string, evidenceStrength: number): string[] {
    // Select appropriate qualifiers based on evidence strength
    if (evidenceStrength >= 0.8) {
      // Strong evidence - suggest strong qualifiers
      return [
        "According to reliable sources,",
        "Research clearly indicates that",
        "Evidence strongly suggests that"
      ];
    } else if (evidenceStrength >= 0.5) {
      // Moderate evidence - suggest moderate qualifiers
      return [
        "Based on available information,",
        "It appears that",
        "Evidence suggests that"
      ];
    } else {
      // Weak evidence - suggest weak qualifiers
      return [
        "It's possible that",
        "Some sources suggest that",
        "Limited evidence indicates that"
      ];
    }
  }
  
  /**
   * Add a new qualifier pattern
   * @param pattern Qualifier pattern
   */
  addPattern(pattern: QualifierPattern): void {
    this.patterns.push(pattern);
  }
  
  /**
   * Get all qualifier patterns
   * @returns Array of qualifier patterns
   */
  getPatterns(): QualifierPattern[] {
    return [...this.patterns];
  }
  
  /**
   * Update a qualifier pattern
   * @param index Pattern index
   * @param pattern New pattern
   * @returns Updated pattern or undefined if index is invalid
   */
  updatePattern(index: number, pattern: Partial<QualifierPattern>): QualifierPattern | undefined {
    if (index < 0 || index >= this.patterns.length) {
      return undefined;
    }
    
    this.patterns[index] = { ...this.patterns[index], ...pattern };
    return this.patterns[index];
  }
  
  /**
   * Remove a qualifier pattern
   * @param index Pattern index
   * @returns Whether the pattern was removed
   */
  removePattern(index: number): boolean {
    if (index < 0 || index >= this.patterns.length) {
      return false;
    }
    
    this.patterns.splice(index, 1);
    return true;
  }
}

/**
 * Create an uncertainty detector instance
 * @param patterns Array of qualifier patterns
 * @returns Uncertainty detector instance
 */
export function createUncertaintyDetector(patterns: QualifierPattern[] = DEFAULT_QUALIFIER_PATTERNS): UncertaintyDetector {
  return new UncertaintyDetector(patterns);
}

// Export singleton instance for use throughout the application
export const uncertaintyDetector = createUncertaintyDetector();
