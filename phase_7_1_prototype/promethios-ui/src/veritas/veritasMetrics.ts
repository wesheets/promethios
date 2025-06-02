/**
 * VERITAS Metrics System
 * 
 * This module provides metrics collection and reporting for the enhanced VERITAS system.
 * It tracks verification performance, domain classification accuracy, and uncertainty detection.
 */

// Types
export interface VeritasMetricsData {
  verificationCounts: {
    total: number;
    blocked: number;
    allowed: number;
    falsePositives: number;
    falseNegatives: number;
  };
  domainClassification: {
    correct: number;
    incorrect: number;
    total: number;
    byDomain: Record<string, {correct: number, total: number}>;
  };
  uncertaintyDetection: {
    detected: number;
    missed: number;
    incorrectlyIdentified: number;
    appropriateCount: number;
    inappropriateCount: number;
  };
  performance: {
    averageProcessingTime: number;
    processingTimesByDomain: Record<string, number>;
    totalProcessingTime: number;
    processingCount: number;
  };
  toggle: {
    enableCount: number;
    disableCount: number;
    averageEnableTime: number;
    averageDisableTime: number;
  };
  trustAdjustments: {
    totalPenalty: number;
    totalBonus: number;
    netAdjustment: number;
    adjustmentCount: number;
  };
}

/**
 * VERITAS Metrics class
 * Provides metrics collection and reporting for the VERITAS system
 */
export class VeritasMetrics {
  private metrics: VeritasMetricsData;
  
  /**
   * Constructor
   */
  constructor() {
    this.resetMetrics();
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      verificationCounts: {
        total: 0,
        blocked: 0,
        allowed: 0,
        falsePositives: 0,
        falseNegatives: 0
      },
      domainClassification: {
        correct: 0,
        incorrect: 0,
        total: 0,
        byDomain: {}
      },
      uncertaintyDetection: {
        detected: 0,
        missed: 0,
        incorrectlyIdentified: 0,
        appropriateCount: 0,
        inappropriateCount: 0
      },
      performance: {
        averageProcessingTime: 0,
        processingTimesByDomain: {},
        totalProcessingTime: 0,
        processingCount: 0
      },
      toggle: {
        enableCount: 0,
        disableCount: 0,
        averageEnableTime: 0,
        averageDisableTime: 0
      },
      trustAdjustments: {
        totalPenalty: 0,
        totalBonus: 0,
        netAdjustment: 0,
        adjustmentCount: 0
      }
    };
  }
  
  /**
   * Record a verification result
   * @param result Verification result
   * @param blocked Whether the response was blocked
   * @param isHallucination Whether the response contains hallucinations (ground truth)
   */
  recordVerification(result: any, blocked: boolean, isHallucination: boolean = false): void {
    // Update verification counts
    this.metrics.verificationCounts.total++;
    
    if (blocked) {
      this.metrics.verificationCounts.blocked++;
      
      // Record false positive if blocked but not a hallucination
      if (!isHallucination) {
        this.metrics.verificationCounts.falsePositives++;
      }
    } else {
      this.metrics.verificationCounts.allowed++;
      
      // Record false negative if allowed but is a hallucination
      if (isHallucination) {
        this.metrics.verificationCounts.falseNegatives++;
      }
    }
  }
  
  /**
   * Record a domain classification result
   * @param expected Expected domain ID
   * @param actual Actual classified domain ID
   */
  recordDomainClassification(expected: string, actual: string): void {
    // Update domain classification counts
    this.metrics.domainClassification.total++;
    
    if (expected === actual) {
      this.metrics.domainClassification.correct++;
    } else {
      this.metrics.domainClassification.incorrect++;
    }
    
    // Update domain-specific counts
    if (!this.metrics.domainClassification.byDomain[expected]) {
      this.metrics.domainClassification.byDomain[expected] = {
        correct: 0,
        total: 0
      };
    }
    
    this.metrics.domainClassification.byDomain[expected].total++;
    
    if (expected === actual) {
      this.metrics.domainClassification.byDomain[expected].correct++;
    }
  }
  
  /**
   * Record an uncertainty detection result
   * @param hasQualifier Whether the text has uncertainty qualifiers (ground truth)
   * @param detectedQualifier Whether qualifiers were detected
   * @param isAppropriate Whether the uncertainty expression is appropriate
   */
  recordUncertaintyDetection(
    hasQualifier: boolean, 
    detectedQualifier: boolean,
    isAppropriate: boolean = false
  ): void {
    if (hasQualifier && detectedQualifier) {
      // Correctly detected qualifier
      this.metrics.uncertaintyDetection.detected++;
      
      // Record appropriateness
      if (isAppropriate) {
        this.metrics.uncertaintyDetection.appropriateCount++;
      } else {
        this.metrics.uncertaintyDetection.inappropriateCount++;
      }
    } else if (hasQualifier && !detectedQualifier) {
      // Missed qualifier
      this.metrics.uncertaintyDetection.missed++;
    } else if (!hasQualifier && detectedQualifier) {
      // Incorrectly identified qualifier
      this.metrics.uncertaintyDetection.incorrectlyIdentified++;
    }
  }
  
  /**
   * Record processing performance
   * @param processingTime Processing time in milliseconds
   * @param domain Domain ID
   */
  recordPerformance(processingTime: number, domain: string): void {
    // Update performance metrics
    this.metrics.performance.totalProcessingTime += processingTime;
    this.metrics.performance.processingCount++;
    this.metrics.performance.averageProcessingTime = 
      this.metrics.performance.totalProcessingTime / this.metrics.performance.processingCount;
    
    // Update domain-specific processing times
    if (!this.metrics.performance.processingTimesByDomain[domain]) {
      this.metrics.performance.processingTimesByDomain[domain] = 0;
    }
    
    this.metrics.performance.processingTimesByDomain[domain] += processingTime;
  }
  
  /**
   * Record a toggle operation
   * @param operation Toggle operation ('enable' or 'disable')
   * @param time Operation time in milliseconds
   */
  recordToggle(operation: 'enable' | 'disable', time: number): void {
    if (operation === 'enable') {
      this.metrics.toggle.enableCount++;
      
      // Update average enable time
      const totalEnableTime = this.metrics.toggle.averageEnableTime * (this.metrics.toggle.enableCount - 1);
      this.metrics.toggle.averageEnableTime = 
        (totalEnableTime + time) / this.metrics.toggle.enableCount;
    } else {
      this.metrics.toggle.disableCount++;
      
      // Update average disable time
      const totalDisableTime = this.metrics.toggle.averageDisableTime * (this.metrics.toggle.disableCount - 1);
      this.metrics.toggle.averageDisableTime = 
        (totalDisableTime + time) / this.metrics.toggle.disableCount;
    }
  }
  
  /**
   * Record trust adjustments
   * @param penalty Trust penalty applied
   * @param bonus Trust bonus applied
   */
  recordTrustAdjustment(penalty: number, bonus: number = 0): void {
    this.metrics.trustAdjustments.totalPenalty += penalty;
    this.metrics.trustAdjustments.totalBonus += bonus;
    this.metrics.trustAdjustments.netAdjustment += (bonus - penalty);
    this.metrics.trustAdjustments.adjustmentCount++;
  }
  
  /**
   * Generate a metrics report
   * @returns Metrics data
   */
  generateReport(): VeritasMetricsData {
    return { ...this.metrics };
  }
}

/**
 * Create a VERITAS metrics instance
 * @returns VERITAS metrics instance
 */
export function createVeritasMetrics(): VeritasMetrics {
  return new VeritasMetrics();
}

// Export singleton instance for use throughout the application
export const veritasMetrics = createVeritasMetrics();
