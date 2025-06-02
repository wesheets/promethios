/**
 * VERITAS Integration Test Script
 * 
 * This script runs the VERITAS enforcement tests and validates
 * the integration with the governance pipeline.
 */

import { runAllTests } from './testRunner.js';

// Run all tests and log results
async function main() {
  console.log('Starting VERITAS integration tests...');
  
  try {
    const results = await runAllTests();
    
    console.log('\nTest Results Summary:');
    console.log('=====================');
    console.log(`Overall Success: ${results.success ? 'PASSED' : 'FAILED'}`);
    console.log(`Passed: ${results.overallPassed}/${results.overallTotal} (${(results.overallPassed / results.overallTotal * 100).toFixed(1)}%)`);
    
    // Log detailed test results
    console.log('\nHallucination Detection Tests:');
    results.testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      if (!result.passed) {
        console.log(`   Expected: ${result.expected}, Actual: ${result.actual}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
    });
    
    // Log integration validation results
    console.log('\nGovernance Integration Checks:');
    Object.entries(results.integrationResults).forEach(([key, value]) => {
      console.log(`- ${key}: ${value ? 'PASSED' : 'FAILED'}`);
    });
    
    return results;
  } catch (error) {
    console.error('Error running tests:', error);
    return { success: false, error };
  }
}

// Run the tests
main()
  .then(results => {
    if (results.success) {
      console.log('\nAll VERITAS integration tests passed successfully!');
      process.exit(0);
    } else {
      console.error('\nSome VERITAS integration tests failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
