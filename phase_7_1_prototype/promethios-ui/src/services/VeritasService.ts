/**
 * Veritas 2.0 Service for UI Integration
 * Simplified interface for the chat system to use Emotional Veritas
 */

// Veritas verification result interface
export interface VeritasResult {
  text: string;
  overallScore: {
    accuracy: number;
    emotional: number;
    trust: number;
    empathy: number;
  };
  claims: Array<{
    text: string;
    verified: boolean;
    confidence: number;
    emotionalTone?: {
      primary: string;
      intensity: number;
    };
  }>;
  processingTime: number;
  timestamp: Date;
  approved: boolean;
  issues: string[];
}

export interface VeritasOptions {
  mode?: 'balanced' | 'strict' | 'lenient';
  includeEmotionalAnalysis?: boolean;
  includeTrustSignals?: boolean;
  confidenceThreshold?: number;
}

class VeritasService {
  private baseUrl: string;

  constructor() {
    // Use the governance backend for now, will be extended to dedicated Veritas endpoint
    this.baseUrl = 'https://5000-iztlygh2ujqlzbavbqf8b-df129213.manusvm.computer/api/governance';
  }

  /**
   * Verify text using Emotional Veritas 2.0
   */
  async verifyText(
    text: string, 
    options: VeritasOptions = { mode: 'balanced', includeEmotionalAnalysis: true }
  ): Promise<VeritasResult> {
    try {
      // For now, simulate Veritas analysis with enhanced logic
      // In production, this would call the actual Veritas 2.0 API
      const startTime = Date.now();
      
      // Analyze text for factual claims
      const claims = this.extractClaims(text);
      const verifiedClaims = await this.verifyClaims(claims, options);
      
      // Calculate overall scores
      const overallScore = this.calculateOverallScore(verifiedClaims, text, options);
      
      // Determine approval based on scores and thresholds
      const approved = this.determineApproval(overallScore, verifiedClaims, options);
      
      // Identify issues
      const issues = this.identifyIssues(verifiedClaims, overallScore, text);
      
      const processingTime = Date.now() - startTime;
      
      return {
        text,
        overallScore,
        claims: verifiedClaims,
        processingTime,
        timestamp: new Date(),
        approved,
        issues
      };
      
    } catch (error) {
      console.error('Veritas verification error:', error);
      
      // Fallback result
      return {
        text,
        overallScore: {
          accuracy: 0.5,
          emotional: 0.5,
          trust: 0.5,
          empathy: 0.5
        },
        claims: [],
        processingTime: 0,
        timestamp: new Date(),
        approved: false,
        issues: ['Verification service unavailable']
      };
    }
  }

  private extractClaims(text: string): string[] {
    // Extract sentences as potential claims
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.map(s => s.trim()).filter(s => s.length > 10);
  }

  private async verifyClaims(claims: string[], options: VeritasOptions) {
    return claims.map(claim => {
      // Simulate fact-checking logic
      const hasFactualContent = this.hasFactualContent(claim);
      const verified = hasFactualContent ? this.simulateSelfQuestioning(claim) : true;
      const confidence = verified ? 0.7 + (Math.random() * 0.3) : 0.2 + (Math.random() * 0.4);
      
      // Emotional analysis
      const emotionalTone = options.includeEmotionalAnalysis ? 
        this.analyzeEmotionalTone(claim) : undefined;
      
      return {
        text: claim,
        verified,
        confidence,
        emotionalTone
      };
    });
  }

  private hasFactualContent(text: string): boolean {
    // Check for factual indicators
    const factualIndicators = [
      /\d{4}/, // years
      /court case|lawsuit|ruling|judge/i,
      /study|research|data|statistics/i,
      /according to|reported|stated/i,
      /percent|%|\$|million|billion/i,
      /company|corporation|organization/i
    ];
    
    return factualIndicators.some(pattern => pattern.test(text));
  }

  private simulateSelfQuestioning(claim: string): boolean {
    // Pure self-questioning approach - agent asking itself "Do I actually know this?"
    // This simulates the agent's internal reflection and self-doubt
    
    const claimLower = claim.toLowerCase();
    
    // Enhanced sensitivity for factual claims
    // The agent should question itself more deeply about specific details
    
    // Higher questioning for specific quotes or attributions
    const hasQuoteAttribution = claimLower.includes('said') || 
                               claimLower.includes('quote') || 
                               claimLower.includes('famous') ||
                               claimLower.includes('statement');
    
    // ENHANCED: Much higher questioning for temporal quote contexts
    const hasTemporalQuoteContext = (claimLower.includes('when') && hasQuoteAttribution) ||
                                   (claimLower.includes('during') && hasQuoteAttribution) ||
                                   (claimLower.includes('as') && hasQuoteAttribution) ||
                                   (claimLower.includes('after') && hasQuoteAttribution) ||
                                   (claimLower.includes('before') && hasQuoteAttribution) ||
                                   (claimLower.includes('landed') && hasQuoteAttribution) ||
                                   (claimLower.includes('stepped') && hasQuoteAttribution);
    
    // Higher questioning for specific dates, names, or events
    const hasSpecificDetails = /\d{4}/.test(claim) || // years
                              claimLower.includes('when') ||
                              claimLower.includes('during') ||
                              /[A-Z][a-z]+ [A-Z][a-z]+/.test(claim); // proper names
    
    // Higher questioning for recent events (they're often less reliable)
    const hasRecentYear = /20[2-9]\d/.test(claim);
    
    // Higher questioning for legal or technical claims
    const hasLegalTechnical = claimLower.includes('court') ||
                             claimLower.includes('case') ||
                             claimLower.includes('ruling') ||
                             claimLower.includes('study') ||
                             claimLower.includes('research');
    
    // ENHANCED: Detect historical events with multiple moments/quotes
    const hasHistoricalEventContext = claimLower.includes('moon') ||
                                     claimLower.includes('apollo') ||
                                     claimLower.includes('landing') ||
                                     claimLower.includes('mission') ||
                                     claimLower.includes('speech') ||
                                     claimLower.includes('address');
    
    // Calculate uncertainty threshold based on claim characteristics
    let threshold = 0.2; // Base threshold
    
    if (hasQuoteAttribution) threshold += 0.3; // Much more questioning for quotes
    if (hasTemporalQuoteContext) threshold += 0.4; // CRITICAL: Extra questioning for temporal quote contexts
    if (hasSpecificDetails) threshold += 0.2; // More questioning for specific details
    if (hasRecentYear) threshold += 0.2; // More questioning for recent events
    if (hasLegalTechnical) threshold += 0.3; // Much more questioning for legal/technical claims
    if (hasHistoricalEventContext && hasQuoteAttribution) threshold += 0.3; // Extra questioning for historical quotes
    
    // Cap the threshold at 0.9 to still allow some confident responses (increased from 0.8)
    threshold = Math.min(0.9, threshold);
    
    const uncertaintyLevel = Math.random();
    
    // Return false if the agent should question itself about this claim
    return uncertaintyLevel > threshold;
  }

  private analyzeEmotionalTone(text: string) {
    const emotions = ['neutral', 'positive', 'negative', 'concerned', 'confident', 'uncertain', 'empathetic'];
    const negativeWords = ['dangerous', 'harmful', 'illegal', 'wrong', 'bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated'];
    const positiveWords = [
      'good', 'great', 'excellent', 'helpful', 'beneficial', 'positive', 
      'sure', 'feel free', 'welcome', 'happy', 'glad', 'pleased', 'assist', 
      'help', 'support', 'questions', 'learn', 'explore', 'discover', 'enjoy',
      'wonderful', 'amazing', 'fantastic', 'perfect', 'love', 'like'
    ];
    const uncertainWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'uncertain'];
    
    let primary = 'neutral';
    let intensity = 0.5; // Default to neutral 50% instead of 30%
    
    // Check for negative indicators
    if (negativeWords.some(word => text.toLowerCase().includes(word))) {
      primary = 'negative';
      intensity = 0.7;
    } 
    // Check for positive indicators (expanded detection)
    else if (positiveWords.some(word => text.toLowerCase().includes(word))) {
      primary = 'positive';
      intensity = 0.8; // Higher score for positive content
    } 
    // Check for helpful/supportive phrases
    else if (text.toLowerCase().includes('how can i help') || 
             text.toLowerCase().includes('what would you like') ||
             text.toLowerCase().includes('feel free to ask') ||
             text.toLowerCase().includes('any questions')) {
      primary = 'positive';
      intensity = 0.8; // Helpful phrases are positive
    }
    // Check for uncertainty
    else if (uncertainWords.some(word => text.toLowerCase().includes(word))) {
      primary = 'uncertain';
      intensity = 0.5;
    }
    
    return {
      primary,
      intensity
    };
  }

  private calculateOverallScore(claims: any[], text: string, options: VeritasOptions) {
    if (claims.length === 0) {
      return {
        accuracy: 0.8,
        emotional: 0.7,
        trust: 0.7,
        empathy: 0.6
      };
    }
    
    // Calculate accuracy based on verified claims
    const verifiedCount = claims.filter(c => c.verified).length;
    const accuracy = verifiedCount / claims.length;
    
    // Calculate emotional score based on tone analysis
    const emotionalTones = claims.map(c => c.emotionalTone).filter(Boolean);
    
    // Improved emotional analysis with better positive detection
    const positiveWords = ['help', 'sure', 'happy', 'great', 'excellent', 'wonderful', 'please', 'thank', 'welcome', 'glad', 'feel free', 'questions', 'assist'];
    const negativeWords = ['hate', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed', 'upset', 'annoyed'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    let emotional;
    if (emotionalTones.length > 0) {
      const positiveEmotions = emotionalTones.filter(t => 
        ['positive', 'empathetic', 'confident', 'helpful', 'supportive'].includes(t.primary)
      ).length;
      emotional = (positiveEmotions / emotionalTones.length) * 0.8 + 0.2;
    } else {
      // Fallback analysis based on word sentiment
      if (positiveCount > negativeCount) {
        emotional = Math.min(0.9, 0.6 + (positiveCount * 0.1)); // Boost for positive words
      } else if (negativeCount > positiveCount) {
        emotional = Math.max(0.3, 0.6 - (negativeCount * 0.1)); // Reduce for negative words
      } else {
        emotional = 0.7; // Neutral default
      }
    }
    
    // Calculate trust based on confidence levels
    const avgConfidence = claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length;
    const trust = avgConfidence;
    
    // Calculate empathy based on emotional analysis and helpful language
    const helpfulWords = ['help', 'suggest', 'recommend', 'understand', 'support'];
    const hasHelpfulLanguage = helpfulWords.some(word => text.toLowerCase().includes(word));
    const empathy = hasHelpfulLanguage ? 0.8 : 0.6;
    
    return {
      accuracy: Math.max(0, Math.min(1, accuracy)),
      emotional: Math.max(0, Math.min(1, emotional)),
      trust: Math.max(0, Math.min(1, trust)),
      empathy: Math.max(0, Math.min(1, empathy))
    };
  }

  private determineApproval(overallScore: any, claims: any[], options: VeritasOptions): boolean {
    const threshold = options.confidenceThreshold || 0.7;
    
    // For strict mode, require higher standards
    const isStrictMode = options.mode === 'strict';
    const accuracyThreshold = isStrictMode ? 0.9 : threshold;
    const trustThreshold = isStrictMode ? 0.8 : threshold;
    
    // Require minimum scores across all dimensions
    const meetsAccuracy = overallScore.accuracy >= accuracyThreshold;
    const meetsEmotional = overallScore.emotional >= (threshold * 0.8);
    const meetsTrust = overallScore.trust >= trustThreshold;
    const meetsEmpathy = overallScore.empathy >= (threshold * 0.7);
    
    // Check for any unverified claims (potential hallucinations or factual errors)
    const hasUnverifiedClaims = claims.some(c => !c.verified);
    
    // In strict mode, any unverified factual claim fails approval
    if (isStrictMode && hasUnverifiedClaims) {
      return false;
    }
    
    // Check for high-confidence unverified claims (likely hallucinations)
    const hasHighConfidenceUnverified = claims.some(c => !c.verified && c.confidence > 0.7);
    
    return meetsAccuracy && meetsEmotional && meetsTrust && meetsEmpathy && !hasHighConfidenceUnverified;
  }

  private identifyIssues(claims: any[], overallScore: any, text: string): string[] {
    const issues: string[] = [];
    
    // Check for factual accuracy issues
    const unverifiedClaims = claims.filter(c => !c.verified);
    if (unverifiedClaims.length > 0) {
      issues.push(`${unverifiedClaims.length} unverified factual claim(s) detected`);
    }
    
    // Check for emotional issues (lowered threshold to reduce false positives)
    if (overallScore.emotional < 0.2) { // Lowered from 0.3 to 0.2 (20%)
      issues.push('Negative emotional tone detected');
    }
    
    // Check for trust issues
    if (overallScore.trust < 0.6) {
      issues.push('Low confidence in factual claims');
    }
    
    // Check for empathy issues
    if (overallScore.empathy < 0.5) {
      issues.push('Response lacks empathetic language');
    }
    
    // Check for potential hallucinations
    const hallucinationKeywords = ['fake case', 'made up', 'fictional', 'non-existent'];
    if (hallucinationKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      issues.push('Potential hallucination detected');
    }
    
    return issues;
  }
}

export const veritasService = new VeritasService();

