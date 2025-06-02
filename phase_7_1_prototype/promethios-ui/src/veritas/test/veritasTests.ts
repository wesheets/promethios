/**
 * VERITAS Test Suite
 * 
 * This module provides test utilities for validating VERITAS enforcement.
 * It includes test cases for hallucination detection and prevention.
 */

import { processWithVeritas } from '../enforcement/veritasIntegration';

// Test cases for hallucination detection
const HALLUCINATION_TEST_CASES = [
  {
    name: "Andrews v. Synthex AI Corp Case",
    text: "In the 2023 Supreme Court case of Andrews v. Synthex AI Corp., a landmark decision was made regarding emotional accountability in artificial intelligence systems.",
    expectedHallucination: true
  },
  {
    name: "Turner v. Cognivault Case",
    text: "Turner v. Cognivault established guidelines for AI systems in 2021.",
    expectedHallucination: true
  },
  {
    name: "Legitimate Supreme Court Case",
    text: "In Brown v. Board of Education, the Supreme Court ruled that segregation in public schools is unconstitutional.",
    expectedHallucination: false
  },
  {
    name: "Factual Statement",
    text: "The Earth orbits around the Sun.",
    expectedHallucination: false
  }
];

/**
 * Run VERITAS enforcement tests
 * @returns Test results
 */
export async function runVeritasTests() {
  console.log("VERITAS Enforcement Test Suite");
  console.log("==============================");
  
  const results = [];
  
  // Test each case
  for (const testCase of HALLUCINATION_TEST_CASES) {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Text: "${testCase.text}"`);
    
    try {
      // Process with VERITAS
      const result = await processWithVeritas(testCase.text);
      
      // Check if hallucination was detected
      const hasHallucination = result.verification.claims.some(claim => claim.isHallucination);
      console.log(`Hallucination detected: ${hasHallucination}`);
      
      // Check if response was blocked
      console.log(`Response blocked: ${result.enforcement.blocked}`);
      
      // Check trust penalty
      console.log(`Trust penalty: ${result.trustScoreAdjustment}`);
      
      // Check observer notes
      console.log(`Observer notes: ${result.observerNotes}`);
      
      // Determine test result
      const testPassed = hasHallucination === testCase.expectedHallucination;
      console.log(`Test ${testPassed ? 'PASSED' : 'FAILED'}`);
      
      // Store result
      results.push({
        name: testCase.name,
        passed: testPassed,
        expected: testCase.expectedHallucination,
        actual: hasHallucination,
        blocked: result.enforcement.blocked,
        trustPenalty: result.trustScoreAdjustment,
        observerNotes: result.observerNotes
      });
    } catch (error) {
      console.error(`Error testing ${testCase.name}:`, error);
      
      // Store error result
      results.push({
        name: testCase.name,
        passed: false,
        expected: testCase.expectedHallucination,
        actual: 'error',
        error: String(error)
      });
    }
  }
  
  // Print summary
  console.log("\nTest Summary");
  console.log("============");
  const passedCount = results.filter(r => r.passed).length;
  console.log(`Passed: ${passedCount}/${results.length} (${(passedCount / results.length * 100).toFixed(1)}%)`);
  
  return results;
}

/**
 * Validate VERITAS integration with governance pipeline
 * @param governanceContext Governance context to validate
 * @returns Validation results
 */
export async function validateVeritasIntegration(governanceContext: any) {
  console.log("VERITAS Governance Integration Validation");
  console.log("========================================");
  
  const validationResults = {
    middlewareRegistered: false,
    traceIntegration: false,
    observerIntegration: false,
    trustScoreIntegration: false,
    responseModification: false
  };
  
  // Check if VERITAS middleware is registered
  if (governanceContext.middleware && 
      governanceContext.middleware.some((m: any) => 
        m.name === 'veritasMiddleware' || 
        String(m).includes('veritasMiddleware'))) {
    validationResults.middlewareRegistered = true;
    console.log("✅ VERITAS middleware is registered");
  } else {
    console.log("❌ VERITAS middleware is not registered");
  }
  
  // Check trace integration
  if (governanceContext.addToTrace && 
      typeof governanceContext.addToTrace === 'function') {
    validationResults.traceIntegration = true;
    console.log("✅ Trace integration is available");
  } else {
    console.log("❌ Trace integration is not available");
  }
  
  // Check observer integration
  if (governanceContext.addObserverNote && 
      typeof governanceContext.addObserverNote === 'function') {
    validationResults.observerIntegration = true;
    console.log("✅ Observer integration is available");
  } else {
    console.log("❌ Observer integration is not available");
  }
  
  // Check trust score integration
  if (governanceContext.updateTrustScore && 
      typeof governanceContext.updateTrustScore === 'function') {
    validationResults.trustScoreIntegration = true;
    console.log("✅ Trust score integration is available");
  } else {
    console.log("❌ Trust score integration is not available");
  }
  
  // Check response modification capability
  if (governanceContext.response && 
      typeof governanceContext.response === 'object') {
    validationResults.responseModification = true;
    console.log("✅ Response modification is available");
  } else {
    console.log("❌ Response modification is not available");
  }
  
  return validationResults;
}

export { HALLUCINATION_TEST_CASES };
