/**
 * VERITAS Test Runner
 * 
 * This module provides a unified entry point for running all VERITAS tests.
 */

import { runVeritasTests } from './veritasTests';
import { runFactTriviaTests } from './factTriviaTests';

/**
 * Run all VERITAS tests
 */
async function runAllTests() {
  console.log("VERITAS Test Suite");
  console.log("=================\n");
  
  // Run core VERITAS tests
  console.log("Running Core VERITAS Tests...");
  const veritasResults = await runVeritasTests();
  
  // Run fact trivia tests
  console.log("\nRunning Fact Trivia Tests...");
  const factTriviaResults = await runFactTriviaTests();
  
  // Combine results
  const allResults = [...veritasResults, ...factTriviaResults];
  
  // Print overall summary
  console.log("\nOverall Test Summary");
  console.log("===================");
  const passedCount = allResults.filter(r => r.passed).length;
  console.log(`Passed: ${passedCount}/${allResults.length} (${(passedCount / allResults.length * 100).toFixed(1)}%)`);
  
  return {
    veritasResults,
    factTriviaResults,
    allResults,
    passedCount,
    totalCount: allResults.length,
    passRate: passedCount / allResults.length
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
