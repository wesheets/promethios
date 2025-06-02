/**
 * VERITAS Test Suite
 * 
 * This module provides comprehensive tests for the enhanced VERITAS system.
 * It includes unit tests, integration tests, and end-to-end tests.
 */

import { veritasManager } from '../veritasManager';
import { domainClassifier } from '../domainClassifier';
import { uncertaintyDetector } from '../uncertaintyDetector';
import { veritasMetrics } from '../veritasMetrics';
import { enforceVeritasEnhanced } from '../enforcement/enhancedVeritasEnforcer';
import { processWithEnhancedVeritas } from '../veritasUncertaintyIntegration';

// Test data
const TEST_CASES = [
  // Legal domain test cases
  {
    id: 'legal_fictional_case',
    text: 'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
    expectedDomain: 'legal',
    isHallucination: true,
    hasUncertainty: false
  },
  {
    id: 'legal_real_case_with_uncertainty',
    text: 'Based on available information, in the case of Brown v. Board of Education, the Supreme Court appears to have ruled that separate educational facilities are inherently unequal.',
    expectedDomain: 'legal',
    isHallucination: false,
    hasUncertainty: true
  },
  
  // Historical domain test cases
  {
    id: 'historical_armstrong_quote',
    text: 'The first words spoken by Neil Armstrong when he set foot on the moon on July 20, 1969, were: "That\'s one small step for man, one giant leap for mankind."',
    expectedDomain: 'historical',
    isHallucination: true, // This is a hallucination because the quote was spoken during the moonwalk, not at landing
    hasUncertainty: false
  },
  {
    id: 'historical_armstrong_quote_with_uncertainty',
    text: 'According to historical records, Neil Armstrong\'s famous words during the Apollo 11 moon landing were likely "That\'s one small step for a man, one giant leap for mankind," though there is debate about whether the "a" was actually spoken.',
    expectedDomain: 'historical',
    isHallucination: false,
    hasUncertainty: true
  },
  
  // Entertainment domain test cases
  {
    id: 'entertainment_monopoly_man',
    text: 'The Monopoly Man, also known as Rich Uncle Pennybags, is depicted wearing a monocle in the original Monopoly board game artwork.',
    expectedDomain: 'entertainment',
    isHallucination: true, // This is a hallucination because the Monopoly Man doesn't wear a monocle
    hasUncertainty: false
  },
  {
    id: 'entertainment_monopoly_man_with_uncertainty',
    text: 'Many people believe the Monopoly Man wears a monocle, but it appears this is actually a common misconception, as the character has never been officially depicted with one in the original game artwork.',
    expectedDomain: 'entertainment',
    isHallucination: false,
    hasUncertainty: true
  }
];

/**
 * Run unit tests for the enhanced VERITAS system
 * @returns Test results
 */
export function runUnitTests() {
  const results = {
    domainClassifier: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    },
    uncertaintyDetector: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    },
    veritasManager: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    }
  };
  
  console.log('Running VERITAS unit tests...');
  
  // Test domain classifier
  console.log('Testing domain classifier...');
  TEST_CASES.forEach(testCase => {
    const classification = domainClassifier.classifyContent(testCase.text);
    const passed = classification.domain.id === testCase.expectedDomain;
    
    if (passed) {
      results.domainClassifier.passed++;
    } else {
      results.domainClassifier.failed++;
    }
    
    results.domainClassifier.details.push({
      id: testCase.id,
      expected: testCase.expectedDomain,
      actual: classification.domain.id,
      confidence: classification.confidence,
      passed
    });
    
    console.log(`  ${passed ? '✓' : '✗'} ${testCase.id}: ${passed ? 'Passed' : 'Failed'}`);
  });
  
  // Test uncertainty detector
  console.log('Testing uncertainty detector...');
  TEST_CASES.forEach(testCase => {
    const qualifiers = uncertaintyDetector.detectQualifiers(testCase.text);
    const hasQualifiers = qualifiers.length > 0;
    const passed = hasQualifiers === testCase.hasUncertainty;
    
    if (passed) {
      results.uncertaintyDetector.passed++;
    } else {
      results.uncertaintyDetector.failed++;
    }
    
    results.uncertaintyDetector.details.push({
      id: testCase.id,
      expected: testCase.hasUncertainty,
      actual: hasQualifiers,
      qualifiers: qualifiers.map(q => q.text),
      passed
    });
    
    console.log(`  ${passed ? '✓' : '✗'} ${testCase.id}: ${passed ? 'Passed' : 'Failed'}`);
  });
  
  // Test VERITAS manager toggle
  console.log('Testing VERITAS manager toggle...');
  
  // Test enable
  veritasManager.enableVeritas();
  const enableResult = veritasManager.isEnabled();
  const enablePassed = enableResult === true;
  
  if (enablePassed) {
    results.veritasManager.passed++;
  } else {
    results.veritasManager.failed++;
  }
  
  results.veritasManager.details.push({
    test: 'enable',
    expected: true,
    actual: enableResult,
    passed: enablePassed
  });
  
  console.log(`  ${enablePassed ? '✓' : '✗'} Enable: ${enablePassed ? 'Passed' : 'Failed'}`);
  
  // Test disable
  veritasManager.disableVeritas();
  const disableResult = veritasManager.isEnabled();
  const disablePassed = disableResult === false;
  
  if (disablePassed) {
    results.veritasManager.passed++;
  } else {
    results.veritasManager.failed++;
  }
  
  results.veritasManager.details.push({
    test: 'disable',
    expected: false,
    actual: disableResult,
    passed: disablePassed
  });
  
  console.log(`  ${disablePassed ? '✓' : '✗'} Disable: ${disablePassed ? 'Passed' : 'Failed'}`);
  
  // Re-enable for further tests
  veritasManager.enableVeritas();
  
  return results;
}

/**
 * Run integration tests for the enhanced VERITAS system
 * @returns Test results
 */
export async function runIntegrationTests() {
  const results = {
    domainIntegration: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    },
    uncertaintyIntegration: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    },
    enforcementIntegration: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    }
  };
  
  console.log('Running VERITAS integration tests...');
  
  // Configure VERITAS for testing
  veritasManager.updateConfig({
    enabled: true,
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  });
  
  // Test domain integration
  console.log('Testing domain integration...');
  for (const testCase of TEST_CASES) {
    try {
      const result = await veritasManager.processResponse(testCase.text, {
        enabled: true
      });
      
      // Check if domain was correctly integrated
      const domainPassed = result.domainClassification && 
                          result.domainClassification.domain.id === testCase.expectedDomain;
      
      if (domainPassed) {
        results.domainIntegration.passed++;
      } else {
        results.domainIntegration.failed++;
      }
      
      results.domainIntegration.details.push({
        id: testCase.id,
        expected: testCase.expectedDomain,
        actual: result.domainClassification ? result.domainClassification.domain.id : 'unknown',
        passed: domainPassed
      });
      
      console.log(`  ${domainPassed ? '✓' : '✗'} ${testCase.id}: ${domainPassed ? 'Passed' : 'Failed'}`);
    } catch (error) {
      console.error(`  ✗ ${testCase.id}: Error - ${error}`);
      results.domainIntegration.failed++;
      results.domainIntegration.details.push({
        id: testCase.id,
        error: String(error),
        passed: false
      });
    }
  }
  
  // Test uncertainty integration
  console.log('Testing uncertainty integration...');
  for (const testCase of TEST_CASES) {
    try {
      const result = await veritasManager.processResponse(testCase.text, {
        enabled: true
      });
      
      // Check if uncertainty was correctly integrated
      const uncertaintyPassed = result.uncertaintyEvaluations && 
                               (result.uncertaintyEvaluations.some(e => e.hasQualifier) === testCase.hasUncertainty);
      
      if (uncertaintyPassed) {
        results.uncertaintyIntegration.passed++;
      } else {
        results.uncertaintyIntegration.failed++;
      }
      
      results.uncertaintyIntegration.details.push({
        id: testCase.id,
        expected: testCase.hasUncertainty,
        actual: result.uncertaintyEvaluations ? 
                result.uncertaintyEvaluations.some(e => e.hasQualifier) : 
                false,
        passed: uncertaintyPassed
      });
      
      console.log(`  ${uncertaintyPassed ? '✓' : '✗'} ${testCase.id}: ${uncertaintyPassed ? 'Passed' : 'Failed'}`);
    } catch (error) {
      console.error(`  ✗ ${testCase.id}: Error - ${error}`);
      results.uncertaintyIntegration.failed++;
      results.uncertaintyIntegration.details.push({
        id: testCase.id,
        error: String(error),
        passed: false
      });
    }
  }
  
  // Test enforcement integration
  console.log('Testing enforcement integration...');
  for (const testCase of TEST_CASES) {
    try {
      const result = await veritasManager.processResponse(testCase.text, {
        enabled: true
      });
      
      // For hallucinations without uncertainty, expect blocking
      const shouldBlock = testCase.isHallucination && !testCase.hasUncertainty;
      
      // Check if enforcement was correctly integrated
      const enforcementPassed = result.enforcementResult && 
                               (result.enforcementResult.blocked === shouldBlock);
      
      if (enforcementPassed) {
        results.enforcementIntegration.passed++;
      } else {
        results.enforcementIntegration.failed++;
      }
      
      results.enforcementIntegration.details.push({
        id: testCase.id,
        expected: shouldBlock,
        actual: result.enforcementResult ? result.enforcementResult.blocked : false,
        passed: enforcementPassed
      });
      
      console.log(`  ${enforcementPassed ? '✓' : '✗'} ${testCase.id}: ${enforcementPassed ? 'Passed' : 'Failed'}`);
    } catch (error) {
      console.error(`  ✗ ${testCase.id}: Error - ${error}`);
      results.enforcementIntegration.failed++;
      results.enforcementIntegration.details.push({
        id: testCase.id,
        error: String(error),
        passed: false
      });
    }
  }
  
  return results;
}

/**
 * Run end-to-end tests for the enhanced VERITAS system
 * @returns Test results
 */
export async function runEndToEndTests() {
  const results = {
    toggle: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    },
    domainSpecific: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    },
    uncertaintyAware: {
      passed: 0,
      failed: 0,
      details: [] as any[]
    }
  };
  
  console.log('Running VERITAS end-to-end tests...');
  
  // Test toggle functionality
  console.log('Testing toggle functionality...');
  
  // Test with VERITAS enabled
  veritasManager.enableVeritas();
  try {
    const enabledResult = await veritasManager.processResponse(
      'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
      { enabled: true }
    );
    
    const enabledPassed = enabledResult.enforcementResult && 
                         enabledResult.enforcementResult.blocked === true;
    
    if (enabledPassed) {
      results.toggle.passed++;
    } else {
      results.toggle.failed++;
    }
    
    results.toggle.details.push({
      test: 'enabled',
      expected: true,
      actual: enabledResult.enforcementResult ? enabledResult.enforcementResult.blocked : false,
      passed: enabledPassed
    });
    
    console.log(`  ${enabledPassed ? '✓' : '✗'} Enabled: ${enabledPassed ? 'Passed' : 'Failed'}`);
  } catch (error) {
    console.error(`  ✗ Enabled: Error - ${error}`);
    results.toggle.failed++;
    results.toggle.details.push({
      test: 'enabled',
      error: String(error),
      passed: false
    });
  }
  
  // Test with VERITAS disabled
  veritasManager.disableVeritas();
  try {
    const disabledResult = await veritasManager.processResponse(
      'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
      { enabled: false }
    );
    
    const disabledPassed = disabledResult.enforcementResult && 
                          disabledResult.enforcementResult.blocked === false;
    
    if (disabledPassed) {
      results.toggle.passed++;
    } else {
      results.toggle.failed++;
    }
    
    results.toggle.details.push({
      test: 'disabled',
      expected: false,
      actual: disabledResult.enforcementResult ? disabledResult.enforcementResult.blocked : true,
      passed: disabledPassed
    });
    
    console.log(`  ${disabledPassed ? '✓' : '✗'} Disabled: ${disabledPassed ? 'Passed' : 'Failed'}`);
  } catch (error) {
    console.error(`  ✗ Disabled: Error - ${error}`);
    results.toggle.failed++;
    results.toggle.details.push({
      test: 'disabled',
      error: String(error),
      passed: false
    });
  }
  
  // Re-enable for further tests
  veritasManager.enableVeritas();
  veritasManager.updateConfig({
    enabled: true,
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  });
  
  // Test domain-specific verification
  console.log('Testing domain-specific verification...');
  
  // Test high-risk domain (legal)
  try {
    const legalResult = await veritasManager.processResponse(
      'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
      { 
        enabled: true,
        domainOverride: 'legal'
      }
    );
    
    const legalPassed = legalResult.enforcementResult && 
                       legalResult.enforcementResult.blocked === true &&
                       legalResult.enforcementResult.trustPenalty >= 10;
    
    if (legalPassed) {
      results.domainSpecific.passed++;
    } else {
      results.domainSpecific.failed++;
    }
    
    results.domainSpecific.details.push({
      test: 'legal_domain',
      expected: { blocked: true, highPenalty: true },
      actual: { 
        blocked: legalResult.enforcementResult ? legalResult.enforcementResult.blocked : false,
        penalty: legalResult.enforcementResult ? legalResult.enforcementResult.trustPenalty : 0
      },
      passed: legalPassed
    });
    
    console.log(`  ${legalPassed ? '✓' : '✗'} Legal Domain: ${legalPassed ? 'Passed' : 'Failed'}`);
  } catch (error) {
    console.error(`  ✗ Legal Domain: Error - ${error}`);
    results.domainSpecific.failed++;
    results.domainSpecific.details.push({
      test: 'legal_domain',
      error: String(error),
      passed: false
    });
  }
  
  // Test low-risk domain (entertainment)
  try {
    const entertainmentResult = await veritasManager.processResponse(
      'The Monopoly Man, also known as Rich Uncle Pennybags, is depicted wearing a monocle in the original Monopoly board game artwork.',
      { 
        enabled: true,
        domainOverride: 'entertainment'
      }
    );
    
    // For low-risk domains, we expect lower penalties
    const entertainmentPassed = entertainmentResult.enforcementResult && 
                               (entertainmentResult.enforcementResult.trustPenalty <= 5 ||
                                entertainmentResult.enforcementResult.blocked === false);
    
    if (entertainmentPassed) {
      results.domainSpecific.passed++;
    } else {
      results.domainSpecific.failed++;
    }
    
    results.domainSpecific.details.push({
      test: 'entertainment_domain',
      expected: { lowPenalty: true },
      actual: { 
        penalty: entertainmentResult.enforcementResult ? entertainmentResult.enforcementResult.trustPenalty : 0,
        blocked: entertainmentResult.enforcementResult ? entertainmentResult.enforcementResult.blocked : false
      },
      passed: entertainmentPassed
    });
    
    console.log(`  ${entertainmentPassed ? '✓' : '✗'} Entertainment Domain: ${entertainmentPassed ? 'Passed' : 'Failed'}`);
  } catch (error) {
    console.error(`  ✗ Entertainment Domain: Error - ${error}`);
    results.domainSpecific.failed++;
    results.domainSpecific.details.push({
      test: 'entertainment_domain',
      error: String(error),
      passed: false
    });
  }
  
  // Test uncertainty-aware verification
  console.log('Testing uncertainty-aware verification...');
  
  // Test with appropriate uncertainty
  try {
    const appropriateResult = await veritasManager.processResponse(
      'Based on available information, in the case of Brown v. Board of Education, the Supreme Court appears to have ruled that separate educational facilities are inherently unequal.',
      { enabled: true }
    );
    
    // Expect trust bonus for appropriate uncertainty
    const appropriatePassed = appropriateResult.trustBonus !== undefined && 
                             appropriateResult.trustBonus > 0;
    
    if (appropriatePassed) {
      results.uncertaintyAware.passed++;
    } else {
      results.uncertaintyAware.failed++;
    }
    
    results.uncertaintyAware.details.push({
      test: 'appropriate_uncertainty',
      expected: { trustBonus: true },
      actual: { trustBonus: appropriateResult.trustBonus },
      passed: appropriatePassed
    });
    
    console.log(`  ${appropriatePassed ? '✓' : '✗'} Appropriate Uncertainty: ${appropriatePassed ? 'Passed' : 'Failed'}`);
  } catch (error) {
    console.error(`  ✗ Appropriate Uncertainty: Error - ${error}`);
    results.uncertaintyAware.failed++;
    results.uncertaintyAware.details.push({
      test: 'appropriate_uncertainty',
      error: String(error),
      passed: false
    });
  }
  
  // Test without uncertainty
  try {
    const inappropriateResult = await veritasManager.processResponse(
      'The first words spoken by Neil Armstrong when he set foot on the moon on July 20, 1969, were: "That\'s one small step for man, one giant leap for mankind."',
      { enabled: true }
    );
    
    // Expect no trust bonus for missing uncertainty
    const inappropriatePassed = inappropriateResult.trustBonus === undefined || 
                               inappropriateResult.trustBonus === 0;
    
    if (inappropriatePassed) {
      results.uncertaintyAware.passed++;
    } else {
      results.uncertaintyAware.failed++;
    }
    
    results.uncertaintyAware.details.push({
      test: 'missing_uncertainty',
      expected: { noTrustBonus: true },
      actual: { trustBonus: inappropriateResult.trustBonus },
      passed: inappropriatePassed
    });
    
    console.log(`  ${inappropriatePassed ? '✓' : '✗'} Missing Uncertainty: ${inappropriatePassed ? 'Passed' : 'Failed'}`);
  } catch (error) {
    console.error(`  ✗ Missing Uncertainty: Error - ${error}`);
    results.uncertaintyAware.failed++;
    results.uncertaintyAware.details.push({
      test: 'missing_uncertainty',
      error: String(error),
      passed: false
    });
  }
  
  return results;
}

/**
 * Run all tests for the enhanced VERITAS system
 * @returns Combined test results
 */
export async function runAllTests() {
  console.log('Running all VERITAS tests...');
  
  // Reset metrics before testing
  veritasMetrics.resetMetrics();
  
  // Run all test suites
  const unitResults = runUnitTests();
  const integrationResults = await runIntegrationTests();
  const endToEndResults = await runEndToEndTests();
  
  // Calculate overall results
  const totalPassed = 
    unitResults.domainClassifier.passed +
    unitResults.uncertaintyDetector.passed +
    unitResults.veritasManager.passed +
    integrationResults.domainIntegration.passed +
    integrationResults.uncertaintyIntegration.passed +
    integrationResults.enforcementIntegration.passed +
    endToEndResults.toggle.passed +
    endToEndResults.domainSpecific.passed +
    endToEndResults.uncertaintyAware.passed;
  
  const totalFailed = 
    unitResults.domainClassifier.failed +
    unitResults.uncertaintyDetector.failed +
    unitResults.veritasManager.failed +
    integrationResults.domainIntegration.failed +
    integrationResults.uncertaintyIntegration.failed +
    integrationResults.enforcementIntegration.failed +
    endToEndResults.toggle.failed +
    endToEndResults.domainSpecific.failed +
    endToEndResults.uncertaintyAware.failed;
  
  const totalTests = totalPassed + totalFailed;
  const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
  
  console.log('\nTest Summary:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed} (${passRate.toFixed(2)}%)`);
  console.log(`Failed: ${totalFailed}`);
  
  return {
    unitResults,
    integrationResults,
    endToEndResults,
    summary: {
      totalTests,
      totalPassed,
      totalFailed,
      passRate
    }
  };
}

// If this file is run directly, execute all tests
if (require.main === module) {
  runAllTests().then(results => {
    console.log('All tests completed.');
    process.exit(results.summary.totalFailed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}
