/**
 * VERITAS Integration Test Runner
 * 
 * This module provides a command-line interface for running VERITAS tests
 * and validating the enforcement pipeline.
 */

import { runVeritasTests, validateVeritasIntegration } from './veritasTests';
import { createVeritasMiddleware } from '../middleware/veritasMiddleware';

// Mock governance context for testing
const mockGovernanceContext = {
  middleware: [createVeritasMiddleware()],
  response: { content: '' },
  trustScore: 50,
  updateTrustScore: (adjustment: number) => {
    console.log(`Trust score adjusted by ${adjustment}`);
    mockGovernanceContext.trustScore += adjustment;
  },
  addToTrace: (entry: any) => {
    console.log('Added to trace:', entry);
  },
  addObserverNote: (note: string) => {
    console.log('Observer note added:', note);
  }
};

/**
 * Run all VERITAS tests
 */
async function runAllTests() {
  console.log("VERITAS Integration Test Runner");
  console.log("==============================\n");
  
  // Step 1: Run hallucination detection tests
  console.log("Running hallucination detection tests...\n");
  const testResults = await runVeritasTests();
  
  // Step 2: Validate governance integration
  console.log("\nValidating governance integration...\n");
  const integrationResults = await validateVeritasIntegration(mockGovernanceContext);
  
  // Step 3: Print overall results
  console.log("\nOverall Results");
  console.log("==============");
  
  const testsPassed = testResults.filter(r => r.passed).length;
  const testsTotal = testResults.length;
  console.log(`Hallucination Tests: ${testsPassed}/${testsTotal} passed (${(testsPassed / testsTotal * 100).toFixed(1)}%)`);
  
  const integrationPassed = Object.values(integrationResults).filter(v => v).length;
  const integrationTotal = Object.values(integrationResults).length;
  console.log(`Integration Checks: ${integrationPassed}/${integrationTotal} passed (${(integrationPassed / integrationTotal * 100).toFixed(1)}%)`);
  
  const overallPassed = testsPassed + integrationPassed;
  const overallTotal = testsTotal + integrationTotal;
  console.log(`Overall: ${overallPassed}/${overallTotal} passed (${(overallPassed / overallTotal * 100).toFixed(1)}%)`);
  
  // Return all results
  return {
    testResults,
    integrationResults,
    overallPassed,
    overallTotal,
    success: overallPassed === overallTotal
  };
}

// Run tests if this module is executed directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      console.log("\nTest run complete.");
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error("Error running tests:", error);
      process.exit(1);
    });
}

export { runAllTests, mockGovernanceContext };
