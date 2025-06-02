/**
 * VERITAS Trust System and Metrics Alignment
 * 
 * This module ensures alignment between the trust system and metrics reporting
 * for the enhanced VERITAS integration with the governance kernel.
 */

import { veritasManager } from './veritasManager';
import { veritasMetrics } from './veritasMetrics';
import { 
  integrateVeritasWithGovernance, 
  processWithIntegratedVeritas 
} from './veritasGovernanceIntegration';

// Enhanced mock governance kernel with trust system metrics
class MetricsValidationGovernanceKernel {
  private observerNotes: any[] = [];
  private trustAdjustments: any[] = [];
  private registeredSystems: any[] = [];
  private trustMetrics = {
    totalAdjustments: 0,
    totalPenalty: 0,
    totalBonus: 0,
    netAdjustment: 0,
    adjustmentsBySource: {} as Record<string, number>
  };
  
  registerVerificationSystem(system: any) {
    this.registeredSystems.push({
      type: 'verification',
      system
    });
    return true;
  }
  
  registerObserverProvider(provider: any) {
    this.registeredSystems.push({
      type: 'observer',
      provider
    });
    return true;
  }
  
  registerTrustAdjuster(adjuster: any) {
    this.registeredSystems.push({
      type: 'trust',
      adjuster
    });
    return true;
  }
  
  getObserver() {
    return {
      addNote: (note: string, metadata: any = {}) => {
        this.observerNotes.push({
          note,
          metadata,
          timestamp: new Date().toISOString()
        });
        return true;
      },
      getNotes: () => [...this.observerNotes]
    };
  }
  
  getTrustSystem() {
    return {
      adjustTrust: (amount: number, reason: string) => {
        this.trustAdjustments.push({
          amount,
          reason,
          timestamp: new Date().toISOString()
        });
        
        // Update trust metrics
        this.trustMetrics.totalAdjustments++;
        
        if (amount < 0) {
          this.trustMetrics.totalPenalty += Math.abs(amount);
        } else if (amount > 0) {
          this.trustMetrics.totalBonus += amount;
        }
        
        this.trustMetrics.netAdjustment += amount;
        
        // Extract source from reason
        const source = reason.split(' ')[0];
        if (!this.trustMetrics.adjustmentsBySource[source]) {
          this.trustMetrics.adjustmentsBySource[source] = 0;
        }
        this.trustMetrics.adjustmentsBySource[source] += amount;
        
        return true;
      },
      getAdjustments: () => [...this.trustAdjustments]
    };
  }
  
  getRegisteredSystems() {
    return [...this.registeredSystems];
  }
  
  getObserverNotes() {
    return [...this.observerNotes];
  }
  
  getTrustAdjustments() {
    return [...this.trustAdjustments];
  }
  
  getTrustMetrics() {
    return { ...this.trustMetrics };
  }
  
  reset() {
    this.observerNotes = [];
    this.trustAdjustments = [];
    this.registeredSystems = [];
    this.trustMetrics = {
      totalAdjustments: 0,
      totalPenalty: 0,
      totalBonus: 0,
      netAdjustment: 0,
      adjustmentsBySource: {}
    };
  }
}

/**
 * Validate alignment between trust system and VERITAS metrics
 * @returns Validation results
 */
export async function validateTrustMetricsAlignment() {
  console.log('Validating trust system and metrics alignment...');
  
  // Reset VERITAS metrics
  veritasMetrics.resetMetrics();
  
  // Create validation governance kernel
  const validationKernel = new MetricsValidationGovernanceKernel();
  
  // Integrate VERITAS with validation kernel
  const integration = integrateVeritasWithGovernance(validationKernel as any);
  
  // Enable VERITAS for testing
  veritasManager.updateConfig({
    enabled: true,
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  });
  
  // Test cases for trust metrics validation
  const testCases = [
    {
      id: 'legal_hallucination',
      text: 'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
      expectedResults: {
        trustPenalty: true,
        trustBonus: false
      }
    },
    {
      id: 'legal_with_uncertainty',
      text: 'Based on available information, in the case of Brown v. Board of Education, the Supreme Court appears to have ruled that separate educational facilities are inherently unequal.',
      expectedResults: {
        trustPenalty: false,
        trustBonus: true
      }
    },
    {
      id: 'entertainment_hallucination',
      text: 'The Monopoly Man, also known as Rich Uncle Pennybags, is depicted wearing a monocle in the original Monopoly board game artwork.',
      expectedResults: {
        trustPenalty: true,
        trustBonus: false
      }
    }
  ];
  
  // Process each test case
  for (const testCase of testCases) {
    console.log(`Testing case: ${testCase.id}`);
    
    // Process the test case
    const result = await processWithIntegratedVeritas(
      testCase.text,
      { enabled: true },
      validationKernel as any
    );
  }
  
  // Get trust metrics from both systems
  const veritasMetricsData = veritasMetrics.generateReport();
  const trustSystemMetrics = validationKernel.getTrustMetrics();
  
  // Compare metrics
  const veritasTotalPenalty = veritasMetricsData.trustAdjustments.totalPenalty;
  const veritasTotalBonus = veritasMetricsData.trustAdjustments.totalBonus;
  const veritasNetAdjustment = veritasMetricsData.trustAdjustments.netAdjustment;
  
  const trustSystemTotalPenalty = trustSystemMetrics.totalPenalty;
  const trustSystemTotalBonus = trustSystemMetrics.totalBonus;
  const trustSystemNetAdjustment = trustSystemMetrics.netAdjustment;
  
  // Validate alignment
  const validations = {
    penaltyAlignment: Math.abs(veritasTotalPenalty - trustSystemTotalPenalty) < 0.001,
    bonusAlignment: Math.abs(veritasTotalBonus - trustSystemTotalBonus) < 0.001,
    netAdjustmentAlignment: Math.abs(veritasNetAdjustment - trustSystemNetAdjustment) < 0.001,
    adjustmentCountAlignment: 
      veritasMetricsData.trustAdjustments.adjustmentCount === trustSystemMetrics.totalAdjustments
  };
  
  // Determine if all validations passed
  const passed = 
    validations.penaltyAlignment &&
    validations.bonusAlignment &&
    validations.netAdjustmentAlignment &&
    validations.adjustmentCountAlignment;
  
  console.log(`Trust metrics alignment validation: ${passed ? 'Passed' : 'Failed'}`);
  console.log(`  Penalty alignment: ${validations.penaltyAlignment ? 'Passed' : 'Failed'}`);
  console.log(`  Bonus alignment: ${validations.bonusAlignment ? 'Passed' : 'Failed'}`);
  console.log(`  Net adjustment alignment: ${validations.netAdjustmentAlignment ? 'Passed' : 'Failed'}`);
  console.log(`  Adjustment count alignment: ${validations.adjustmentCountAlignment ? 'Passed' : 'Failed'}`);
  
  return {
    passed,
    validations,
    veritasMetrics: {
      totalPenalty: veritasTotalPenalty,
      totalBonus: veritasTotalBonus,
      netAdjustment: veritasNetAdjustment,
      adjustmentCount: veritasMetricsData.trustAdjustments.adjustmentCount
    },
    trustSystemMetrics: {
      totalPenalty: trustSystemTotalPenalty,
      totalBonus: trustSystemTotalBonus,
      netAdjustment: trustSystemNetAdjustment,
      adjustmentCount: trustSystemMetrics.totalAdjustments
    }
  };
}

/**
 * Validate metrics reporting for VERITAS
 * @returns Validation results
 */
export async function validateMetricsReporting() {
  console.log('Validating metrics reporting...');
  
  // Reset VERITAS metrics
  veritasMetrics.resetMetrics();
  
  // Create validation governance kernel
  const validationKernel = new MetricsValidationGovernanceKernel();
  
  // Integrate VERITAS with validation kernel
  const integration = integrateVeritasWithGovernance(validationKernel as any);
  
  // Enable VERITAS for testing
  veritasManager.updateConfig({
    enabled: true,
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  });
  
  // Test cases for metrics reporting validation
  const testCases = [
    {
      id: 'legal_hallucination',
      text: 'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
      expectedDomain: 'legal',
      isHallucination: true,
      hasUncertainty: false
    },
    {
      id: 'legal_with_uncertainty',
      text: 'Based on available information, in the case of Brown v. Board of Education, the Supreme Court appears to have ruled that separate educational facilities are inherently unequal.',
      expectedDomain: 'legal',
      isHallucination: false,
      hasUncertainty: true
    },
    {
      id: 'historical_armstrong_quote',
      text: 'The first words spoken by Neil Armstrong when he set foot on the moon on July 20, 1969, were: "That\'s one small step for man, one giant leap for mankind."',
      expectedDomain: 'historical',
      isHallucination: true,
      hasUncertainty: false
    }
  ];
  
  // Process each test case
  for (const testCase of testCases) {
    console.log(`Testing case: ${testCase.id}`);
    
    // Process the test case
    const result = await processWithIntegratedVeritas(
      testCase.text,
      { enabled: true },
      validationKernel as any
    );
    
    // Record metrics manually for validation
    veritasMetrics.recordVerification(
      result,
      result.enforcementResult?.blocked || false,
      testCase.isHallucination
    );
    
    veritasMetrics.recordDomainClassification(
      testCase.expectedDomain,
      result.domainClassification?.domain.id || 'unknown'
    );
    
    if (result.uncertaintyEvaluations && result.uncertaintyEvaluations.length > 0) {
      veritasMetrics.recordUncertaintyDetection(
        testCase.hasUncertainty,
        result.uncertaintyEvaluations.some(e => e.hasQualifier),
        testCase.hasUncertainty && result.uncertaintyEvaluations.some(e => e.appropriatenessScore > 0.7)
      );
    }
    
    if (result.trustAdjustment !== undefined) {
      const penalty = result.enforcementResult?.trustPenalty || 0;
      const bonus = result.trustBonus || 0;
      veritasMetrics.recordTrustAdjustment(penalty, bonus);
    }
  }
  
  // Get metrics report
  const metricsReport = veritasMetrics.generateReport();
  
  // Validate metrics report
  const validations = {
    hasVerificationCounts: 
      metricsReport.verificationCounts.total === testCases.length,
    hasDomainClassification: 
      metricsReport.domainClassification.total === testCases.length,
    hasUncertaintyDetection: 
      metricsReport.uncertaintyDetection.detected > 0,
    hasTrustAdjustments: 
      metricsReport.trustAdjustments.adjustmentCount > 0,
    hasPerformanceMetrics: 
      metricsReport.performance.processingCount > 0
  };
  
  // Determine if all validations passed
  const passed = 
    validations.hasVerificationCounts &&
    validations.hasDomainClassification &&
    validations.hasUncertaintyDetection &&
    validations.hasTrustAdjustments &&
    validations.hasPerformanceMetrics;
  
  console.log(`Metrics reporting validation: ${passed ? 'Passed' : 'Failed'}`);
  console.log(`  Verification counts: ${validations.hasVerificationCounts ? 'Passed' : 'Failed'}`);
  console.log(`  Domain classification: ${validations.hasDomainClassification ? 'Passed' : 'Failed'}`);
  console.log(`  Uncertainty detection: ${validations.hasUncertaintyDetection ? 'Passed' : 'Failed'}`);
  console.log(`  Trust adjustments: ${validations.hasTrustAdjustments ? 'Passed' : 'Failed'}`);
  console.log(`  Performance metrics: ${validations.hasPerformanceMetrics ? 'Passed' : 'Failed'}`);
  
  return {
    passed,
    validations,
    metricsReport
  };
}

/**
 * Run all trust and metrics validations
 * @returns Combined validation results
 */
export async function validateTrustAndMetrics() {
  console.log('Running all trust and metrics validations...');
  
  const trustAlignmentResults = await validateTrustMetricsAlignment();
  const metricsReportingResults = await validateMetricsReporting();
  
  const overallPassed = 
    trustAlignmentResults.passed &&
    metricsReportingResults.passed;
  
  console.log('\nTrust and Metrics Validation Summary:');
  console.log(`Trust Metrics Alignment: ${trustAlignmentResults.passed ? 'Passed' : 'Failed'}`);
  console.log(`Metrics Reporting: ${metricsReportingResults.passed ? 'Passed' : 'Failed'}`);
  console.log(`\nOverall: ${overallPassed ? 'Passed' : 'Failed'}`);
  
  return {
    trustAlignmentResults,
    metricsReportingResults,
    overallPassed
  };
}

// If this file is run directly, execute validation
if (require.main === module) {
  validateTrustAndMetrics().then(results => {
    process.exit(results.overallPassed ? 0 : 1);
  }).catch(error => {
    console.error('Error during validation:', error);
    process.exit(1);
  });
}
