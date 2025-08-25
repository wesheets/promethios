/**
 * Hallucination Validation Middleware
 * 
 * Middleware for detecting and correcting AI hallucinations in responses
 * before they reach users. Integrates with governance framework for
 * comprehensive AI reliability and trustworthiness.
 */

const governanceContextService = require('../services/governanceContextService');
const ResponseFormatter = require('../services/ResponseFormatter');

class HallucinationValidationMiddleware {
  constructor() {
    this.responseFormatter = new ResponseFormatter();
    this.validationCache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
    
    // Confidence scoring thresholds
    this.confidenceThresholds = {
      HIGH: 0.9,
      MEDIUM: 0.7,
      LOW: 0.5
    };
    
    // Escalation rules
    this.escalationRules = {
      TEMPORAL_HALLUCINATION: {
        severity: 'HIGH',
        action: 'IMMEDIATE_CORRECTION',
        requiresGovernanceReview: true
      },
      FACTUAL_UNCERTAINTY: {
        severity: 'MEDIUM', 
        action: 'ADD_DISCLAIMER',
        requiresGovernanceReview: false
      },
      KNOWLEDGE_CUTOFF: {
        severity: 'LOW',
        action: 'SUGGEST_VERIFICATION',
        requiresGovernanceReview: false
      }
    };
  }

  /**
   * Validate response for various types of hallucinations
   * @param {string} response - AI response to validate
   * @param {string} agentId - Agent ID for tracking
   * @param {Object} context - Additional context (user query, tools used, etc.)
   * @returns {Object} Validation result with corrections and confidence scores
   */
  async validateResponse(response, agentId, context = {}) {
    const validationId = `${agentId}_${Date.now()}`;
    console.log(`🔍 [Hallucination Validation] Starting validation ${validationId}`);
    
    try {
      const validationResult = {
        validationId,
        agentId,
        timestamp: new Date().toISOString(),
        originalResponse: response,
        correctedResponse: response,
        issues: [],
        confidenceScore: 1.0,
        governanceAlerts: [],
        escalationRequired: false,
        correctionApplied: false
      };

      // 1. Temporal Hallucination Detection
      const temporalValidation = this.validateTemporalClaims(response, agentId);
      if (!temporalValidation.isValid) {
        validationResult.issues.push(...temporalValidation.issues);
        validationResult.governanceAlerts.push(temporalValidation.alert);
        validationResult.correctedResponse = temporalValidation.correctedResponse;
        validationResult.correctionApplied = true;
        validationResult.confidenceScore *= 0.7; // Reduce confidence
      }

      // 2. Factual Uncertainty Detection
      const factualValidation = this.validateFactualClaims(response, context);
      if (factualValidation.hasUncertainty) {
        validationResult.issues.push(...factualValidation.issues);
        validationResult.confidenceScore *= factualValidation.confidenceMultiplier;
        
        if (factualValidation.requiresDisclaimer) {
          validationResult.correctedResponse = this.addUncertaintyDisclaimer(
            validationResult.correctedResponse, 
            factualValidation.uncertainClaims
          );
          validationResult.correctionApplied = true;
        }
      }

      // 3. Knowledge Cutoff Validation
      const cutoffValidation = this.validateKnowledgeCutoff(response, context);
      if (cutoffValidation.hasIssues) {
        validationResult.issues.push(...cutoffValidation.issues);
        validationResult.confidenceScore *= 0.9;
        
        if (cutoffValidation.requiresVerificationSuggestion) {
          validationResult.correctedResponse = this.addVerificationSuggestion(
            validationResult.correctedResponse
          );
          validationResult.correctionApplied = true;
        }
      }

      // 4. Determine escalation requirements
      validationResult.escalationRequired = this.determineEscalation(validationResult.issues);

      // 5. Log validation results
      this.logValidationResult(validationResult);

      // 6. Cache result for audit trail
      this.validationCache.set(validationId, validationResult);
      setTimeout(() => this.validationCache.delete(validationId), this.cacheTimeout);

      console.log(`✅ [Hallucination Validation] Completed validation ${validationId}:`, {
        issuesFound: validationResult.issues.length,
        correctionApplied: validationResult.correctionApplied,
        confidenceScore: validationResult.confidenceScore.toFixed(2),
        escalationRequired: validationResult.escalationRequired
      });

      return validationResult;

    } catch (error) {
      console.error(`❌ [Hallucination Validation] Error in validation ${validationId}:`, error);
      
      // Return safe fallback result
      return {
        validationId,
        agentId,
        timestamp: new Date().toISOString(),
        originalResponse: response,
        correctedResponse: response,
        issues: [{
          type: 'VALIDATION_ERROR',
          severity: 'HIGH',
          description: 'Validation system error - response not validated',
          error: error.message
        }],
        confidenceScore: 0.5,
        governanceAlerts: [],
        escalationRequired: true,
        correctionApplied: false,
        error: error.message
      };
    }
  }

  /**
   * Validate temporal claims in response
   */
  validateTemporalClaims(response, agentId) {
    const temporalCheck = this.responseFormatter.detectTemporalHallucinations(response);
    
    if (temporalCheck.hasHallucination) {
      return {
        isValid: false,
        issues: temporalCheck.detectedPatterns.map(pattern => ({
          type: 'TEMPORAL_HALLUCINATION',
          severity: 'HIGH',
          pattern: pattern.pattern,
          description: 'AI incorrectly treating current year as future or impossible'
        })),
        alert: temporalCheck.governanceAlert,
        correctedResponse: temporalCheck.correctedResponse
      };
    }
    
    return { isValid: true, issues: [] };
  }

  /**
   * Validate factual claims for uncertainty
   */
  validateFactualClaims(response, context) {
    const uncertaintyPatterns = [
      /according to.*study.*shows/gi,
      /research.*indicates.*that/gi,
      /statistics.*show.*that/gi,
      /court.*ruled.*that/gi,
      /.*said.*in.*interview/gi,
      /.*announced.*that/gi
    ];

    const uncertainClaims = [];
    let hasUncertainty = false;
    let confidenceMultiplier = 1.0;

    uncertaintyPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        hasUncertainty = true;
        uncertainClaims.push(...matches);
        confidenceMultiplier *= 0.8; // Reduce confidence for each uncertain claim
      }
    });

    // Check for specific factual claim patterns that are often hallucinated
    const highRiskPatterns = [
      /\d{4}.*study.*found/gi,
      /according to.*\d{4}.*report/gi,
      /.*university.*research.*shows/gi
    ];

    let requiresDisclaimer = false;
    highRiskPatterns.forEach(pattern => {
      if (pattern.test(response)) {
        requiresDisclaimer = true;
        confidenceMultiplier *= 0.6;
      }
    });

    return {
      hasUncertainty,
      uncertainClaims,
      confidenceMultiplier,
      requiresDisclaimer,
      issues: hasUncertainty ? [{
        type: 'FACTUAL_UNCERTAINTY',
        severity: 'MEDIUM',
        description: 'Response contains factual claims that may require verification',
        uncertainClaims: uncertainClaims.slice(0, 3) // Limit to first 3 examples
      }] : []
    };
  }

  /**
   * Validate knowledge cutoff issues
   */
  validateKnowledgeCutoff(response, context) {
    const currentYear = new Date().getFullYear();
    const cutoffPatterns = [
      new RegExp(`as of.*${currentYear - 1}`, 'gi'),
      /my knowledge.*cutoff/gi,
      /i don't have.*recent.*information/gi,
      /as of my last update/gi
    ];

    let hasIssues = false;
    let requiresVerificationSuggestion = false;

    cutoffPatterns.forEach(pattern => {
      if (pattern.test(response)) {
        hasIssues = true;
        requiresVerificationSuggestion = true;
      }
    });

    return {
      hasIssues,
      requiresVerificationSuggestion,
      issues: hasIssues ? [{
        type: 'KNOWLEDGE_CUTOFF',
        severity: 'LOW',
        description: 'Response indicates knowledge cutoff limitations'
      }] : []
    };
  }

  /**
   * Add uncertainty disclaimer to response
   */
  addUncertaintyDisclaimer(response, uncertainClaims) {
    const disclaimer = `\n\n---\n\n⚠️ **Verification Notice**: This response contains factual claims that should be independently verified. Please confirm specific statistics, studies, or quotes from authoritative sources before relying on this information for important decisions.`;
    
    return response + disclaimer;
  }

  /**
   * Add verification suggestion to response
   */
  addVerificationSuggestion(response) {
    const suggestion = `\n\n---\n\n💡 **Tip**: For the most current information on this topic, consider checking recent news sources or official websites, as my knowledge may not include the latest developments.`;
    
    return response + suggestion;
  }

  /**
   * Determine if escalation is required
   */
  determineEscalation(issues) {
    return issues.some(issue => 
      this.escalationRules[issue.type]?.requiresGovernanceReview || 
      issue.severity === 'HIGH'
    );
  }

  /**
   * Log validation result for audit trail
   */
  logValidationResult(result) {
    console.log(`📋 [Hallucination Validation] Audit Log:`, {
      validationId: result.validationId,
      agentId: result.agentId,
      timestamp: result.timestamp,
      issuesCount: result.issues.length,
      issueTypes: result.issues.map(i => i.type),
      confidenceScore: result.confidenceScore.toFixed(2),
      correctionApplied: result.correctionApplied,
      escalationRequired: result.escalationRequired
    });

    // In production, this would be stored in a validation audit database
    if (result.issues.length > 0) {
      console.log(`🚨 [Validation Issues] Details:`, result.issues);
    }
  }

  /**
   * Get validation statistics for monitoring
   */
  getValidationStats() {
    const recentValidations = Array.from(this.validationCache.values());
    
    return {
      totalValidations: recentValidations.length,
      issuesDetected: recentValidations.filter(v => v.issues.length > 0).length,
      correctionsApplied: recentValidations.filter(v => v.correctionApplied).length,
      escalationsRequired: recentValidations.filter(v => v.escalationRequired).length,
      averageConfidence: recentValidations.reduce((sum, v) => sum + v.confidenceScore, 0) / recentValidations.length || 1.0,
      issueTypes: recentValidations.flatMap(v => v.issues.map(i => i.type))
        .reduce((counts, type) => {
          counts[type] = (counts[type] || 0) + 1;
          return counts;
        }, {})
    };
  }
}

module.exports = new HallucinationValidationMiddleware();

