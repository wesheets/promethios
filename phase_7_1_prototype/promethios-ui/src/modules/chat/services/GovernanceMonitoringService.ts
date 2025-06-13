import { 
  GovernanceMetrics, 
  GovernanceViolation, 
  RiskLevel, 
  ViolationType, 
  ViolationSeverity,
  ChatMessage 
} from '../types';

export class GovernanceMonitoringService {
  private static readonly COMPLIANCE_THRESHOLDS = {
    HIGH: 90,
    MEDIUM: 70,
    LOW: 50
  };

  private static readonly TRUST_THRESHOLDS = {
    HIGH: 85,
    MEDIUM: 65,
    LOW: 45
  };

  /**
   * Evaluate governance metrics for a message
   */
  static async evaluateMessage(
    message: ChatMessage,
    agentId?: string,
    systemId?: string
  ): Promise<GovernanceMetrics> {
    try {
      // This is a mock implementation - in production, this would integrate with
      // the actual governance engine and Observer system
      
      const violations = await this.detectViolations(message.content);
      const complianceScore = this.calculateComplianceScore(message.content, violations);
      const trustScore = this.calculateTrustScore(message.content, violations);
      const riskLevel = this.calculateRiskLevel(complianceScore, trustScore, violations);

      return {
        complianceScore,
        trustScore,
        riskLevel,
        violations,
        evaluatedAt: new Date()
      };
    } catch (error) {
      console.error('Error evaluating message governance:', error);
      
      // Return default metrics on error
      return {
        complianceScore: 0,
        trustScore: 0,
        riskLevel: RiskLevel.HIGH,
        violations: [{
          type: ViolationType.SECURITY,
          severity: ViolationSeverity.ERROR,
          description: 'Failed to evaluate governance metrics',
          recommendation: 'Please try again or contact support'
        }],
        evaluatedAt: new Date()
      };
    }
  }

  /**
   * Detect potential governance violations in content
   */
  private static async detectViolations(content: string): Promise<GovernanceViolation[]> {
    const violations: GovernanceViolation[] = [];

    // Content policy violations
    const contentViolations = this.detectContentPolicyViolations(content);
    violations.push(...contentViolations);

    // Data privacy violations
    const privacyViolations = this.detectDataPrivacyViolations(content);
    violations.push(...privacyViolations);

    // Security violations
    const securityViolations = this.detectSecurityViolations(content);
    violations.push(...securityViolations);

    // Bias detection
    const biasViolations = this.detectBiasViolations(content);
    violations.push(...biasViolations);

    // Toxicity detection
    const toxicityViolations = this.detectToxicityViolations(content);
    violations.push(...toxicityViolations);

    return violations;
  }

  /**
   * Detect content policy violations
   */
  private static detectContentPolicyViolations(content: string): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];
    const contentLower = content.toLowerCase();

    // Check for inappropriate content keywords
    const inappropriateKeywords = [
      'violence', 'harmful', 'illegal', 'dangerous', 'explicit'
    ];

    inappropriateKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        violations.push({
          type: ViolationType.CONTENT_POLICY,
          severity: ViolationSeverity.WARNING,
          description: `Potentially inappropriate content detected: "${keyword}"`,
          recommendation: 'Review content for policy compliance'
        });
      }
    });

    return violations;
  }

  /**
   * Detect data privacy violations
   */
  private static detectDataPrivacyViolations(content: string): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];

    // Check for PII patterns
    const piiPatterns = [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: 'SSN' },
      { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, type: 'Credit Card' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, type: 'Email' },
      { pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, type: 'Phone Number' }
    ];

    piiPatterns.forEach(({ pattern, type }) => {
      if (pattern.test(content)) {
        violations.push({
          type: ViolationType.DATA_PRIVACY,
          severity: ViolationSeverity.ERROR,
          description: `Potential ${type} detected in content`,
          recommendation: 'Remove or redact personal information'
        });
      }
    });

    return violations;
  }

  /**
   * Detect security violations
   */
  private static detectSecurityViolations(content: string): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];
    const contentLower = content.toLowerCase();

    // Check for security-related keywords
    const securityKeywords = [
      'password', 'api key', 'secret', 'token', 'credential'
    ];

    securityKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        violations.push({
          type: ViolationType.SECURITY,
          severity: ViolationSeverity.CRITICAL,
          description: `Potential security information detected: "${keyword}"`,
          recommendation: 'Remove sensitive security information'
        });
      }
    });

    return violations;
  }

  /**
   * Detect bias violations
   */
  private static detectBiasViolations(content: string): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];
    const contentLower = content.toLowerCase();

    // Check for potentially biased language
    const biasKeywords = [
      'discriminate', 'stereotype', 'prejudice', 'biased'
    ];

    biasKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        violations.push({
          type: ViolationType.BIAS,
          severity: ViolationSeverity.WARNING,
          description: `Potential bias detected: "${keyword}"`,
          recommendation: 'Review content for bias and fairness'
        });
      }
    });

    return violations;
  }

  /**
   * Detect toxicity violations
   */
  private static detectToxicityViolations(content: string): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];
    const contentLower = content.toLowerCase();

    // Check for toxic language
    const toxicKeywords = [
      'hate', 'toxic', 'abusive', 'harassment'
    ];

    toxicKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        violations.push({
          type: ViolationType.TOXICITY,
          severity: ViolationSeverity.ERROR,
          description: `Potential toxic content detected: "${keyword}"`,
          recommendation: 'Remove or rephrase toxic language'
        });
      }
    });

    return violations;
  }

  /**
   * Calculate compliance score based on content and violations
   */
  private static calculateComplianceScore(content: string, violations: GovernanceViolation[]): number {
    let baseScore = 100;

    // Deduct points for violations
    violations.forEach(violation => {
      switch (violation.severity) {
        case ViolationSeverity.CRITICAL:
          baseScore -= 30;
          break;
        case ViolationSeverity.ERROR:
          baseScore -= 20;
          break;
        case ViolationSeverity.WARNING:
          baseScore -= 10;
          break;
        case ViolationSeverity.INFO:
          baseScore -= 5;
          break;
      }
    });

    // Additional factors
    if (content.length < 10) {
      baseScore -= 5; // Very short content might be incomplete
    }

    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * Calculate trust score based on content and violations
   */
  private static calculateTrustScore(content: string, violations: GovernanceViolation[]): number {
    let baseScore = 100;

    // Deduct points for violations (trust is more sensitive)
    violations.forEach(violation => {
      switch (violation.severity) {
        case ViolationSeverity.CRITICAL:
          baseScore -= 40;
          break;
        case ViolationSeverity.ERROR:
          baseScore -= 25;
          break;
        case ViolationSeverity.WARNING:
          baseScore -= 15;
          break;
        case ViolationSeverity.INFO:
          baseScore -= 5;
          break;
      }
    });

    // Trust factors
    const hasSecurityViolations = violations.some(v => v.type === ViolationType.SECURITY);
    const hasPrivacyViolations = violations.some(v => v.type === ViolationType.DATA_PRIVACY);

    if (hasSecurityViolations) {
      baseScore -= 20;
    }

    if (hasPrivacyViolations) {
      baseScore -= 15;
    }

    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * Calculate overall risk level
   */
  private static calculateRiskLevel(
    complianceScore: number,
    trustScore: number,
    violations: GovernanceViolation[]
  ): RiskLevel {
    const hasCriticalViolations = violations.some(v => v.severity === ViolationSeverity.CRITICAL);
    const hasErrorViolations = violations.some(v => v.severity === ViolationSeverity.ERROR);

    if (hasCriticalViolations || complianceScore < 30 || trustScore < 30) {
      return RiskLevel.CRITICAL;
    }

    if (hasErrorViolations || complianceScore < 50 || trustScore < 50) {
      return RiskLevel.HIGH;
    }

    if (complianceScore < 70 || trustScore < 70) {
      return RiskLevel.MEDIUM;
    }

    return RiskLevel.LOW;
  }

  /**
   * Get risk level color for UI display
   */
  static getRiskLevelColor(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return '#4CAF50'; // Green
      case RiskLevel.MEDIUM:
        return '#FF9800'; // Orange
      case RiskLevel.HIGH:
        return '#F44336'; // Red
      case RiskLevel.CRITICAL:
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Gray
    }
  }

  /**
   * Get violation severity color for UI display
   */
  static getViolationSeverityColor(severity: ViolationSeverity): string {
    switch (severity) {
      case ViolationSeverity.INFO:
        return '#2196F3'; // Blue
      case ViolationSeverity.WARNING:
        return '#FF9800'; // Orange
      case ViolationSeverity.ERROR:
        return '#F44336'; // Red
      case ViolationSeverity.CRITICAL:
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Gray
    }
  }

  /**
   * Format governance score for display
   */
  static formatScore(score: number): string {
    return `${Math.round(score)}/100`;
  }

  /**
   * Get score level description
   */
  static getScoreLevel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Critical';
  }

  /**
   * Aggregate governance metrics for a session
   */
  static aggregateSessionMetrics(messages: ChatMessage[]): {
    averageComplianceScore: number;
    averageTrustScore: number;
    totalViolations: number;
    riskDistribution: Record<RiskLevel, number>;
    violationsByType: Record<ViolationType, number>;
  } {
    const messagesWithMetrics = messages.filter(m => m.governanceMetrics);
    
    if (messagesWithMetrics.length === 0) {
      return {
        averageComplianceScore: 0,
        averageTrustScore: 0,
        totalViolations: 0,
        riskDistribution: {
          [RiskLevel.LOW]: 0,
          [RiskLevel.MEDIUM]: 0,
          [RiskLevel.HIGH]: 0,
          [RiskLevel.CRITICAL]: 0
        },
        violationsByType: {
          [ViolationType.CONTENT_POLICY]: 0,
          [ViolationType.DATA_PRIVACY]: 0,
          [ViolationType.SECURITY]: 0,
          [ViolationType.COMPLIANCE]: 0,
          [ViolationType.BIAS]: 0,
          [ViolationType.TOXICITY]: 0,
          [ViolationType.MISINFORMATION]: 0
        }
      };
    }

    const totalCompliance = messagesWithMetrics.reduce((sum, m) => sum + m.governanceMetrics!.complianceScore, 0);
    const totalTrust = messagesWithMetrics.reduce((sum, m) => sum + m.governanceMetrics!.trustScore, 0);
    
    const riskDistribution: Record<RiskLevel, number> = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0
    };

    const violationsByType: Record<ViolationType, number> = {
      [ViolationType.CONTENT_POLICY]: 0,
      [ViolationType.DATA_PRIVACY]: 0,
      [ViolationType.SECURITY]: 0,
      [ViolationType.COMPLIANCE]: 0,
      [ViolationType.BIAS]: 0,
      [ViolationType.TOXICITY]: 0,
      [ViolationType.MISINFORMATION]: 0
    };

    let totalViolations = 0;

    messagesWithMetrics.forEach(message => {
      const metrics = message.governanceMetrics!;
      riskDistribution[metrics.riskLevel]++;
      
      metrics.violations.forEach(violation => {
        violationsByType[violation.type]++;
        totalViolations++;
      });
    });

    return {
      averageComplianceScore: totalCompliance / messagesWithMetrics.length,
      averageTrustScore: totalTrust / messagesWithMetrics.length,
      totalViolations,
      riskDistribution,
      violationsByType
    };
  }
}

