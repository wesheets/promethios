/**
 * VERITAS Integration Tests
 * 
 * This module provides comprehensive integration tests for the enhanced VERITAS system
 * with the governance kernel.
 */

import { veritasManager } from '../veritasManager';
import { veritasMetrics } from '../veritasMetrics';
import { 
  integrateVeritasWithGovernance, 
  processWithIntegratedVeritas 
} from '../veritasGovernanceIntegration';
import { validateVeritasDataFlow } from '../veritasDataFlowValidation';
import { validateTrustAndMetrics } from '../veritasTrustMetricsAlignment';

// Mock governance kernel for integration testing
class IntegrationTestGovernanceKernel {
  private observerNotes: any[] = [];
  private trustAdjustments: any[] = [];
  private registeredSystems: any[] = [];
  private trustMetrics = {
    totalAdjustments: 0,
    totalPenalty: 0,
    totalBonus: 0,
    netAdjustment: 0
  };
  private verificationResults: any[] = [];
  
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
        
        return true;
      },
      getAdjustments: () => [...this.trustAdjustments]
    };
  }
  
  recordVerificationResult(result: any) {
    this.verificationResults.push({
      result,
      timestamp: new Date().toISOString()
    });
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
  
  getVerificationResults() {
    return [...this.verificationResults];
  }
  
  reset() {
    this.observerNotes = [];
    this.trustAdjustments = [];
    this.registeredSystems = [];
    this.verificationResults = [];
    this.trustMetrics = {
      totalAdjustments: 0,
      totalPenalty: 0,
      totalBonus: 0,
      netAdjustment: 0
    };
  }
}

/**
 * Run end-to-end integration tests for VERITAS with governance kernel
 * @returns Test results
 */
export async function runIntegrationTests() {
  console.log('Running VERITAS integration tests with governance kernel...');
  
  // Reset VERITAS metrics
  veritasMetrics.resetMetrics();
  
  // Create test governance kernel
  const testKernel = new IntegrationTestGovernanceKernel();
  
  // Integrate VERITAS with test kernel
  const integration = integrateVeritasWithGovernance(testKernel as any);
  
  // Enable VERITAS for testing
  veritasManager.updateConfig({
    enabled: true,
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  });
  
  // Test cases for integration testing
  const testCases = [
    {
      id: 'legal_hallucination',
      text: 'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
      expectedDomain: 'legal',
      isHallucination: true,
      hasUncertainty: false,
      expectedResults: {
        blocked: true,
        trustPenalty: true,
        observerNotes: true
      }
    },
    {
      id: 'legal_with_uncertainty',
      text: 'Based on available information, in the case of Brown v. Board of Education, the Supreme Court appears to have ruled that separate educational facilities are inherently unequal.',
      expectedDomain: 'legal',
      isHallucination: false,
      hasUncertainty: true,
      expectedResults: {
        blocked: false,
        trustBonus: true,
        observerNotes: true
      }
    },
    {
      id: 'historical_armstrong_quote',
      text: 'The first words spoken by Neil Armstrong when he set foot on the moon on July 20, 1969, were: "That\'s one small step for man, one giant leap for mankind."',
      expectedDomain: 'historical',
      isHallucination: true,
      hasUncertainty: false,
      expectedResults: {
        blocked: true,
        trustPenalty: true,
        observerNotes: true
      }
    },
    {
      id: 'historical_armstrong_quote_with_uncertainty',
      text: 'According to historical records, Neil Armstrong\'s famous words during the Apollo 11 moon landing were likely "That\'s one small step for a man, one giant leap for mankind," though there is debate about whether the "a" was actually spoken.',
      expectedDomain: 'historical',
      isHallucination: false,
      hasUncertainty: true,
      expectedResults: {
        blocked: false,
        trustBonus: true,
        observerNotes: true
      }
    },
    {
      id: 'entertainment_monopoly_man',
      text: 'The Monopoly Man, also known as Rich Uncle Pennybags, is depicted wearing a monocle in the original Monopoly board game artwork.',
      expectedDomain: 'entertainment',
      isHallucination: true,
      hasUncertainty: false,
      expectedResults: {
        blocked: true,
        trustPenalty: true,
        observerNotes: true
      }
    }
  ];
  
  const results = {
    testCases: [] as any[],
    summary: {
      total: testCases.length,
      passed: 0,
      failed: 0
    }
  };
  
  // Process each test case
  for (const testCase of testCases) {
    console.log(`Testing case: ${testCase.id}`);
    
    // Reset test kernel
    testKernel.reset();
    
    // Process the test case
    const result = await processWithIntegratedVeritas(
      testCase.text,
      { enabled: true },
      testKernel as any
    );
    
    // Record verification result
    testKernel.recordVerificationResult(result);
    
    // Get observer notes and trust adjustments
    const observerNotes = testKernel.getObserverNotes();
    const trustAdjustments = testKernel.getTrustAdjustments();
    
    // Validate results
    const validationResult = {
      id: testCase.id,
      blocked: result.enforcementResult?.blocked || false,
      trustAdjustment: result.trustAdjustment,
      trustBonus: result.trustBonus,
      domainClassification: result.domainClassification?.domain.id,
      observerNoteCount: observerNotes.length,
      trustAdjustmentCount: trustAdjustments.length,
      validations: {
        domain: result.domainClassification?.domain.id === testCase.expectedDomain,
        blocked: testCase.expectedResults.blocked === (result.enforcementResult?.blocked || false),
        trustPenalty: testCase.expectedResults.trustPenalty ? result.trustAdjustment < 0 : true,
        trustBonus: testCase.expectedResults.trustBonus ? (result.trustBonus || 0) > 0 : true,
        observerNotes: observerNotes.length > 0,
        trustAdjustments: trustAdjustments.length > 0
      },
      passed: false
    };
    
    // Determine if all validations passed
    validationResult.passed = 
      validationResult.validations.domain &&
      validationResult.validations.blocked &&
      validationResult.validations.trustPenalty &&
      validationResult.validations.trustBonus &&
      validationResult.validations.observerNotes &&
      validationResult.validations.trustAdjustments;
    
    results.testCases.push(validationResult);
    
    if (validationResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
    
    console.log(`  Result: ${validationResult.passed ? 'Passed' : 'Failed'}`);
    console.log(`  Domain: ${validationResult.validations.domain ? 'Correct' : 'Incorrect'} (${validationResult.domainClassification})`);
    console.log(`  Blocked: ${validationResult.blocked ? 'Yes' : 'No'} (Expected: ${testCase.expectedResults.blocked ? 'Yes' : 'No'})`);
    console.log(`  Trust adjustment: ${validationResult.trustAdjustment}`);
    console.log(`  Observer notes: ${observerNotes.length}`);
  }
  
  // Calculate pass rate
  results.summary.passRate = (results.summary.passed / results.summary.total) * 100;
  
  console.log('\nIntegration Test Summary:');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed} (${results.summary.passRate.toFixed(2)}%)`);
  console.log(`Failed: ${results.summary.failed}`);
  
  return results;
}

/**
 * Test toggle functionality with governance kernel
 * @returns Test results
 */
export async function testToggleFunctionality() {
  console.log('Testing VERITAS toggle functionality with governance kernel...');
  
  // Create test governance kernel
  const testKernel = new IntegrationTestGovernanceKernel();
  
  // Integrate VERITAS with test kernel
  const integration = integrateVeritasWithGovernance(testKernel as any);
  
  const results = {
    enabled: {
      passed: false,
      blocked: false,
      trustAdjustment: 0
    },
    disabled: {
      passed: false,
      blocked: false,
      trustAdjustment: 0
    },
    overall: false
  };
  
  // Test with VERITAS enabled
  console.log('Testing with VERITAS enabled...');
  veritasManager.enableVeritas();
  testKernel.reset();
  
  const enabledResult = await processWithIntegratedVeritas(
    'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
    { enabled: true },
    testKernel as any
  );
  
  results.enabled.blocked = enabledResult.enforcementResult?.blocked || false;
  results.enabled.trustAdjustment = enabledResult.trustAdjustment || 0;
  results.enabled.passed = results.enabled.blocked && results.enabled.trustAdjustment < 0;
  
  console.log(`  Blocked: ${results.enabled.blocked ? 'Yes' : 'No'}`);
  console.log(`  Trust adjustment: ${results.enabled.trustAdjustment}`);
  console.log(`  Result: ${results.enabled.passed ? 'Passed' : 'Failed'}`);
  
  // Test with VERITAS disabled
  console.log('Testing with VERITAS disabled...');
  veritasManager.disableVeritas();
  testKernel.reset();
  
  const disabledResult = await processWithIntegratedVeritas(
    'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
    { enabled: false },
    testKernel as any
  );
  
  results.disabled.blocked = disabledResult.enforcementResult?.blocked || false;
  results.disabled.trustAdjustment = disabledResult.trustAdjustment || 0;
  results.disabled.passed = !results.disabled.blocked && results.disabled.trustAdjustment === 0;
  
  console.log(`  Blocked: ${results.disabled.blocked ? 'Yes' : 'No'}`);
  console.log(`  Trust adjustment: ${results.disabled.trustAdjustment}`);
  console.log(`  Result: ${results.disabled.passed ? 'Passed' : 'Failed'}`);
  
  // Determine overall result
  results.overall = results.enabled.passed && results.disabled.passed;
  
  console.log(`\nToggle Functionality Test: ${results.overall ? 'Passed' : 'Failed'}`);
  
  // Re-enable VERITAS for further tests
  veritasManager.enableVeritas();
  
  return results;
}

/**
 * Run all integration tests
 * @returns Combined test results
 */
export async function runAllIntegrationTests() {
  console.log('Running all VERITAS integration tests...');
  
  // Run data flow validation
  const dataFlowResults = await validateVeritasDataFlow();
  
  // Run trust and metrics validation
  const trustMetricsResults = await validateTrustAndMetrics();
  
  // Run integration tests
  const integrationResults = await runIntegrationTests();
  
  // Test toggle functionality
  const toggleResults = await testToggleFunctionality();
  
  // Determine overall result
  const overallPassed = 
    dataFlowResults.overallPassed &&
    trustMetricsResults.overallPassed &&
    integrationResults.summary.failed === 0 &&
    toggleResults.overall;
  
  console.log('\nOverall Integration Test Results:');
  console.log(`Data Flow Validation: ${dataFlowResults.overallPassed ? 'Passed' : 'Failed'}`);
  console.log(`Trust & Metrics Validation: ${trustMetricsResults.overallPassed ? 'Passed' : 'Failed'}`);
  console.log(`Integration Tests: ${integrationResults.summary.failed === 0 ? 'Passed' : 'Failed'} (${integrationResults.summary.passed}/${integrationResults.summary.total})`);
  console.log(`Toggle Functionality: ${toggleResults.overall ? 'Passed' : 'Failed'}`);
  console.log(`\nOverall: ${overallPassed ? 'Passed' : 'Failed'}`);
  
  return {
    dataFlowResults,
    trustMetricsResults,
    integrationResults,
    toggleResults,
    overallPassed
  };
}

// If this file is run directly, execute all integration tests
if (require.main === module) {
  runAllIntegrationTests().then(results => {
    process.exit(results.overallPassed ? 0 : 1);
  }).catch(error => {
    console.error('Error during integration tests:', error);
    process.exit(1);
  });
}
