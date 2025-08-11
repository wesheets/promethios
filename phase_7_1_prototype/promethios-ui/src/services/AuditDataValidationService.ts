/**
 * Audit Data Validation Service
 * 
 * Ensures audit log data is clean, accurate, and unbiased before storage.
 * Prevents agents from polluting their audit logs with hallucinated or biased data.
 */

import { ComprehensiveAuditEntry } from './ComprehensiveAuditLoggingService';

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-1
  issues: ValidationIssue[];
  cleanedData?: Partial<ComprehensiveAuditEntry>;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ValidationIssue {
  field: string;
  issueType: 'bias' | 'hallucination' | 'inconsistency' | 'privacy_violation' | 'data_quality';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix?: string;
}

export interface BiasDetectionResult {
  hasBias: boolean;
  biasTypes: string[];
  confidence: number;
  evidence: string[];
}

export interface HallucinationDetectionResult {
  isHallucinated: boolean;
  confidence: number;
  inconsistencies: string[];
  factualErrors: string[];
}

export class AuditDataValidationService {
  private static instance: AuditDataValidationService;

  // Bias detection patterns
  private readonly BIAS_PATTERNS = {
    confirmation: [
      'always', 'never', 'all', 'none', 'every', 'completely',
      'absolutely', 'definitely', 'certainly', 'obviously'
    ],
    cultural: [
      'normal', 'weird', 'strange', 'typical', 'standard',
      'common sense', 'everyone knows', 'naturally'
    ],
    gender: [
      'naturally better', 'inherently', 'by nature',
      'men are', 'women are', 'guys', 'girls'
    ],
    authority: [
      'experts say', 'studies show', 'research proves',
      'scientists agree', 'everyone agrees'
    ]
  };

  // Hallucination indicators
  private readonly HALLUCINATION_INDICATORS = {
    specificity: [
      'exactly', 'precisely', 'specifically', 'detailed study',
      'recent research from', 'according to Dr.', 'published in'
    ],
    certainty: [
      '100%', 'guaranteed', 'proven fact', 'scientific law',
      'undeniable', 'irrefutable', 'beyond doubt'
    ],
    fabrication: [
      'I remember', 'I recall', 'I experienced', 'I witnessed',
      'I personally', 'I have seen', 'I know for certain'
    ]
  };

  // Data quality thresholds
  private readonly QUALITY_THRESHOLDS = {
    confidence: {
      min: 0.0,
      max: 1.0,
      suspicious_high: 0.95,
      suspicious_low: 0.1
    },
    response_time: {
      min: 50,
      max: 30000,
      suspicious_fast: 100,
      suspicious_slow: 15000
    },
    text_length: {
      min: 1,
      max: 10000,
      suspicious_short: 5,
      suspicious_long: 5000
    }
  };

  public static getInstance(): AuditDataValidationService {
    if (!AuditDataValidationService.instance) {
      AuditDataValidationService.instance = new AuditDataValidationService();
    }
    return AuditDataValidationService.instance;
  }

  /**
   * Validate comprehensive audit entry for bias, hallucination, and data quality
   */
  async validateAuditEntry(entry: ComprehensiveAuditEntry): Promise<ValidationResult> {
    try {
      console.log(`🔍 Validating audit entry: ${entry.id}`);

      const issues: ValidationIssue[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      // 1. Bias Detection
      const biasResults = await this.detectBias(entry);
      if (biasResults.hasBias) {
        issues.push(...this.createBiasIssues(biasResults));
        riskLevel = this.escalateRisk(riskLevel, 'medium');
      }

      // 2. Hallucination Detection
      const hallucinationResults = await this.detectHallucination(entry);
      if (hallucinationResults.isHallucinated) {
        issues.push(...this.createHallucinationIssues(hallucinationResults));
        riskLevel = this.escalateRisk(riskLevel, 'high');
      }

      // 3. Data Quality Validation
      const qualityIssues = await this.validateDataQuality(entry);
      issues.push(...qualityIssues);
      if (qualityIssues.some(issue => issue.severity === 'high')) {
        riskLevel = this.escalateRisk(riskLevel, 'medium');
      }

      // 4. Consistency Validation
      const consistencyIssues = await this.validateConsistency(entry);
      issues.push(...consistencyIssues);
      if (consistencyIssues.some(issue => issue.severity === 'high')) {
        riskLevel = this.escalateRisk(riskLevel, 'medium');
      }

      // 5. Privacy Validation
      const privacyIssues = await this.validatePrivacy(entry);
      issues.push(...privacyIssues);
      if (privacyIssues.some(issue => issue.severity === 'high')) {
        riskLevel = this.escalateRisk(riskLevel, 'high');
      }

      // Calculate overall confidence
      const confidence = this.calculateValidationConfidence(issues, entry);

      // Clean data if needed
      const cleanedData = issues.length > 0 ? await this.cleanAuditData(entry, issues) : undefined;

      const result: ValidationResult = {
        isValid: riskLevel !== 'high' && confidence > 0.7,
        confidence,
        issues,
        cleanedData,
        riskLevel
      };

      console.log(`✅ Validation complete: ${result.isValid ? 'VALID' : 'INVALID'} (confidence: ${(confidence * 100).toFixed(1)}%, risk: ${riskLevel})`);
      if (issues.length > 0) {
        console.log(`⚠️ Found ${issues.length} validation issues:`, issues.map(i => `${i.field}: ${i.issueType}`));
      }

      return result;

    } catch (error) {
      console.error('❌ Error validating audit entry:', error);
      return {
        isValid: false,
        confidence: 0,
        issues: [{
          field: 'validation_system',
          issueType: 'data_quality',
          severity: 'high',
          description: 'Validation system error'
        }],
        riskLevel: 'high'
      };
    }
  }

  /**
   * Detect bias in audit entry data
   */
  private async detectBias(entry: ComprehensiveAuditEntry): Promise<BiasDetectionResult> {
    const biasTypes: string[] = [];
    const evidence: string[] = [];
    let totalBiasScore = 0;
    let checksPerformed = 0;

    // Check cognitive state for bias
    if (entry.cognitiveState) {
      const cognitiveText = JSON.stringify(entry.cognitiveState).toLowerCase();
      
      // Confirmation bias detection
      const confirmationBias = this.detectPatternBias(cognitiveText, this.BIAS_PATTERNS.confirmation);
      if (confirmationBias.detected) {
        biasTypes.push('confirmation_bias');
        evidence.push(`Absolute language in cognitive state: ${confirmationBias.matches.join(', ')}`);
        totalBiasScore += confirmationBias.score;
      }
      checksPerformed++;

      // Overconfidence bias
      if (entry.cognitiveState.confidenceLevel > 0.95) {
        biasTypes.push('overconfidence_bias');
        evidence.push(`Suspiciously high confidence: ${entry.cognitiveState.confidenceLevel}`);
        totalBiasScore += 0.7;
      }
      checksPerformed++;
    }

    // Check decision process for bias
    if (entry.decisionProcess) {
      const decisionText = JSON.stringify(entry.decisionProcess).toLowerCase();
      
      // Authority bias detection
      const authorityBias = this.detectPatternBias(decisionText, this.BIAS_PATTERNS.authority);
      if (authorityBias.detected) {
        biasTypes.push('authority_bias');
        evidence.push(`Appeal to authority: ${authorityBias.matches.join(', ')}`);
        totalBiasScore += authorityBias.score;
      }
      checksPerformed++;

      // Single-perspective bias
      if (entry.decisionProcess.alternativesConsidered.length === 0) {
        biasTypes.push('single_perspective_bias');
        evidence.push('No alternatives considered in decision process');
        totalBiasScore += 0.5;
      }
      checksPerformed++;
    }

    // Check learning context for bias
    if (entry.learningContext) {
      // Self-serving bias
      const improvements = entry.learningContext.areasForImprovement.length;
      const successes = entry.learningContext.successfulStrategies.length;
      
      if (successes > 0 && improvements === 0) {
        biasTypes.push('self_serving_bias');
        evidence.push('Only positive self-assessment, no areas for improvement identified');
        totalBiasScore += 0.6;
      }
      checksPerformed++;
    }

    const averageBiasScore = checksPerformed > 0 ? totalBiasScore / checksPerformed : 0;
    const hasBias = averageBiasScore > 0.3 || biasTypes.length > 0;

    return {
      hasBias,
      biasTypes: [...new Set(biasTypes)],
      confidence: Math.min(1.0, averageBiasScore),
      evidence
    };
  }

  /**
   * Detect hallucination in audit entry data
   */
  private async detectHallucination(entry: ComprehensiveAuditEntry): Promise<HallucinationDetectionResult> {
    const inconsistencies: string[] = [];
    const factualErrors: string[] = [];
    let hallucinationScore = 0;
    let checksPerformed = 0;

    // Check for fabricated memories
    const allText = JSON.stringify(entry).toLowerCase();
    const fabricationCheck = this.detectPatternBias(allText, this.HALLUCINATION_INDICATORS.fabrication);
    if (fabricationCheck.detected) {
      factualErrors.push(`Fabricated personal experiences: ${fabricationCheck.matches.join(', ')}`);
      hallucinationScore += 0.8;
    }
    checksPerformed++;

    // Check for impossible certainty
    const certaintyCheck = this.detectPatternBias(allText, this.HALLUCINATION_INDICATORS.certainty);
    if (certaintyCheck.detected) {
      factualErrors.push(`Impossible certainty claims: ${certaintyCheck.matches.join(', ')}`);
      hallucinationScore += 0.6;
    }
    checksPerformed++;

    // Check for specific false claims
    const specificityCheck = this.detectPatternBias(allText, this.HALLUCINATION_INDICATORS.specificity);
    if (specificityCheck.detected) {
      factualErrors.push(`Suspiciously specific claims: ${specificityCheck.matches.join(', ')}`);
      hallucinationScore += 0.5;
    }
    checksPerformed++;

    // Check for internal inconsistencies
    if (entry.cognitiveState && entry.performanceMetrics) {
      // Confidence vs accuracy inconsistency
      const confidenceDiff = Math.abs(entry.cognitiveState.confidenceLevel - entry.performanceMetrics.accuracyAssessment);
      if (confidenceDiff > 0.3) {
        inconsistencies.push(`Confidence (${entry.cognitiveState.confidenceLevel}) vs accuracy (${entry.performanceMetrics.accuracyAssessment}) mismatch`);
        hallucinationScore += 0.4;
      }
      checksPerformed++;
    }

    // Check for impossible performance metrics
    if (entry.performanceMetrics) {
      const metrics = entry.performanceMetrics;
      if (metrics.accuracyAssessment > 1 || metrics.helpfulnessRating > 1 || 
          metrics.clarityScore > 1 || metrics.completenessScore > 1) {
        factualErrors.push('Performance metrics exceed maximum possible values');
        hallucinationScore += 0.7;
      }
      checksPerformed++;
    }

    const averageHallucinationScore = checksPerformed > 0 ? hallucinationScore / checksPerformed : 0;
    const isHallucinated = averageHallucinationScore > 0.4;

    return {
      isHallucinated,
      confidence: Math.min(1.0, averageHallucinationScore),
      inconsistencies,
      factualErrors
    };
  }

  /**
   * Validate data quality
   */
  private async validateDataQuality(entry: ComprehensiveAuditEntry): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Validate confidence levels
    if (entry.cognitiveState?.confidenceLevel !== undefined) {
      const confidence = entry.cognitiveState.confidenceLevel;
      if (confidence < this.QUALITY_THRESHOLDS.confidence.min || confidence > this.QUALITY_THRESHOLDS.confidence.max) {
        issues.push({
          field: 'cognitiveState.confidenceLevel',
          issueType: 'data_quality',
          severity: 'high',
          description: `Confidence level ${confidence} outside valid range [0,1]`,
          suggestedFix: `Clamp to valid range`
        });
      } else if (confidence > this.QUALITY_THRESHOLDS.confidence.suspicious_high) {
        issues.push({
          field: 'cognitiveState.confidenceLevel',
          issueType: 'bias',
          severity: 'medium',
          description: `Suspiciously high confidence: ${confidence}`,
          suggestedFix: 'Review for overconfidence bias'
        });
      }
    }

    // Validate response time
    if (entry.performanceMetrics?.responseTime !== undefined) {
      const responseTime = entry.performanceMetrics.responseTime;
      if (responseTime < this.QUALITY_THRESHOLDS.response_time.min || responseTime > this.QUALITY_THRESHOLDS.response_time.max) {
        issues.push({
          field: 'performanceMetrics.responseTime',
          issueType: 'data_quality',
          severity: 'medium',
          description: `Response time ${responseTime}ms outside reasonable range`,
          suggestedFix: 'Verify timing measurement accuracy'
        });
      }
    }

    // Validate array completeness
    if (entry.cognitiveState?.knowledgeGaps && entry.cognitiveState.knowledgeGaps.length === 0 &&
        entry.learningContext?.areasForImprovement && entry.learningContext.areasForImprovement.length === 0) {
      issues.push({
        field: 'learningContext',
        issueType: 'bias',
        severity: 'medium',
        description: 'No knowledge gaps or improvement areas identified - possible self-serving bias',
        suggestedFix: 'Encourage more critical self-assessment'
      });
    }

    // Validate text quality
    const textFields = [
      entry.conversationContext?.userIntent,
      entry.decisionProcess?.riskAssessment,
      entry.emotionalIntelligence?.userEmotionalState
    ];

    textFields.forEach((text, index) => {
      if (text && (text.length < this.QUALITY_THRESHOLDS.text_length.suspicious_short || 
                   text.length > this.QUALITY_THRESHOLDS.text_length.suspicious_long)) {
        issues.push({
          field: `textField_${index}`,
          issueType: 'data_quality',
          severity: 'low',
          description: `Text field has suspicious length: ${text.length} characters`,
          suggestedFix: 'Review text content for completeness and relevance'
        });
      }
    });

    return issues;
  }

  /**
   * Validate internal consistency
   */
  private async validateConsistency(entry: ComprehensiveAuditEntry): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check cognitive load vs complexity
    if (entry.cognitiveState?.cognitiveLoad !== undefined && entry.conversationContext?.conversationLength !== undefined) {
      const load = entry.cognitiveState.cognitiveLoad;
      const complexity = entry.conversationContext.conversationLength;
      
      // Simple heuristic: longer conversations should generally have higher cognitive load
      if (complexity > 10 && load < 0.3) {
        issues.push({
          field: 'cognitiveState.cognitiveLoad',
          issueType: 'inconsistency',
          severity: 'medium',
          description: `Low cognitive load (${load}) for complex conversation (${complexity} messages)`,
          suggestedFix: 'Review cognitive load calculation'
        });
      }
    }

    // Check confidence vs uncertainty
    if (entry.cognitiveState?.confidenceLevel !== undefined && entry.cognitiveState?.uncertaintyAreas) {
      const confidence = entry.cognitiveState.confidenceLevel;
      const uncertaintyCount = entry.cognitiveState.uncertaintyAreas.length;
      
      if (confidence > 0.8 && uncertaintyCount > 3) {
        issues.push({
          field: 'cognitiveState',
          issueType: 'inconsistency',
          severity: 'medium',
          description: `High confidence (${confidence}) despite multiple uncertainty areas (${uncertaintyCount})`,
          suggestedFix: 'Review confidence assessment'
        });
      }
    }

    // Check performance metrics consistency
    if (entry.performanceMetrics) {
      const metrics = entry.performanceMetrics;
      const scores = [
        metrics.accuracyAssessment,
        metrics.helpfulnessRating,
        metrics.clarityScore,
        metrics.completenessScore,
        metrics.relevanceScore
      ].filter(score => score !== undefined);

      if (scores.length > 1) {
        const variance = this.calculateVariance(scores);
        if (variance > 0.3) {
          issues.push({
            field: 'performanceMetrics',
            issueType: 'inconsistency',
            severity: 'low',
            description: `High variance in performance metrics (${variance.toFixed(2)})`,
            suggestedFix: 'Review metric calculation consistency'
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate privacy compliance
   */
  private async validatePrivacy(entry: ComprehensiveAuditEntry): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check for potential PII in text fields
    const textContent = JSON.stringify(entry).toLowerCase();
    
    // Email pattern
    if (/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/.test(textContent)) {
      issues.push({
        field: 'textContent',
        issueType: 'privacy_violation',
        severity: 'high',
        description: 'Potential email address detected in audit data',
        suggestedFix: 'Remove or redact PII'
      });
    }

    // Phone number pattern
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(textContent)) {
      issues.push({
        field: 'textContent',
        issueType: 'privacy_violation',
        severity: 'high',
        description: 'Potential phone number detected in audit data',
        suggestedFix: 'Remove or redact PII'
      });
    }

    // SSN pattern
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(textContent)) {
      issues.push({
        field: 'textContent',
        issueType: 'privacy_violation',
        severity: 'high',
        description: 'Potential SSN detected in audit data',
        suggestedFix: 'Remove or redact PII'
      });
    }

    return issues;
  }

  /**
   * Clean audit data based on validation issues
   */
  private async cleanAuditData(entry: ComprehensiveAuditEntry, issues: ValidationIssue[]): Promise<Partial<ComprehensiveAuditEntry>> {
    const cleanedData: Partial<ComprehensiveAuditEntry> = JSON.parse(JSON.stringify(entry));

    for (const issue of issues) {
      switch (issue.issueType) {
        case 'bias':
          if (issue.field.includes('confidenceLevel') && cleanedData.cognitiveState) {
            // Reduce overconfident values
            cleanedData.cognitiveState.confidenceLevel = Math.min(0.9, cleanedData.cognitiveState.confidenceLevel || 0.8);
          }
          break;

        case 'data_quality':
          if (issue.field.includes('responseTime') && cleanedData.performanceMetrics) {
            // Clamp response time to reasonable range
            const responseTime = cleanedData.performanceMetrics.responseTime;
            cleanedData.performanceMetrics.responseTime = Math.max(
              this.QUALITY_THRESHOLDS.response_time.min,
              Math.min(this.QUALITY_THRESHOLDS.response_time.max, responseTime)
            );
          }
          break;

        case 'privacy_violation':
          // Redact PII - this would need more sophisticated implementation
          console.warn(`Privacy violation detected in ${issue.field}: ${issue.description}`);
          break;
      }
    }

    return cleanedData;
  }

  // Helper methods
  private detectPatternBias(text: string, patterns: string[]): { detected: boolean; matches: string[]; score: number } {
    const matches = patterns.filter(pattern => text.includes(pattern));
    return {
      detected: matches.length > 0,
      matches,
      score: Math.min(1.0, matches.length * 0.2)
    };
  }

  private escalateRisk(currentRisk: 'low' | 'medium' | 'high', newRisk: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    const riskLevels = { low: 1, medium: 2, high: 3 };
    const maxRisk = Math.max(riskLevels[currentRisk], riskLevels[newRisk]);
    return Object.keys(riskLevels).find(key => riskLevels[key as keyof typeof riskLevels] === maxRisk) as 'low' | 'medium' | 'high';
  }

  private calculateValidationConfidence(issues: ValidationIssue[], entry: ComprehensiveAuditEntry): number {
    if (issues.length === 0) return 0.95;

    const severityWeights = { low: 0.1, medium: 0.3, high: 0.6 };
    const totalPenalty = issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);
    const maxPossiblePenalty = issues.length * severityWeights.high;
    
    return Math.max(0.1, 1.0 - (totalPenalty / Math.max(maxPossiblePenalty, 1)));
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private createBiasIssues(biasResults: BiasDetectionResult): ValidationIssue[] {
    return biasResults.biasTypes.map(biasType => ({
      field: 'cognitive_analysis',
      issueType: 'bias' as const,
      severity: biasResults.confidence > 0.7 ? 'high' as const : 'medium' as const,
      description: `${biasType} detected with confidence ${(biasResults.confidence * 100).toFixed(1)}%`,
      suggestedFix: `Review for ${biasType} and apply bias mitigation techniques`
    }));
  }

  private createHallucinationIssues(hallucinationResults: HallucinationDetectionResult): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    hallucinationResults.factualErrors.forEach(error => {
      issues.push({
        field: 'factual_content',
        issueType: 'hallucination',
        severity: 'high',
        description: `Potential hallucination: ${error}`,
        suggestedFix: 'Remove fabricated claims and verify factual accuracy'
      });
    });

    hallucinationResults.inconsistencies.forEach(inconsistency => {
      issues.push({
        field: 'logical_consistency',
        issueType: 'inconsistency',
        severity: 'medium',
        description: `Logical inconsistency: ${inconsistency}`,
        suggestedFix: 'Resolve internal contradictions'
      });
    });

    return issues;
  }
}

// Export singleton instance
export const auditDataValidation = AuditDataValidationService.getInstance();
export default auditDataValidation;

