/**
 * VERITAS Integration Test Script
 * 
 * This script executes the VERITAS integration tests and reports results.
 * It validates the full system integration across all components.
 */

import runVeritasIntegrationTests from './veritas/integrationTestRunner';

async function main() {
  console.log('Starting VERITAS integration test suite...');
  console.log('=======================================');
  
  try {
    // Run integration tests
    const testResults = await runVeritasIntegrationTests();
    
    // Print results summary
    console.log('\nVERITAS Integration Test Summary:');
    console.log('=======================================');
    console.log(`Tests Passed: ${testResults.passedTests}/${testResults.totalTests}`);
    console.log(`Success Rate: ${testResults.successRate.toFixed(2)}%`);
    console.log('=======================================');
    
    // Print detailed results
    console.log('\nDetailed Test Results:');
    for (const [test, result] of Object.entries(testResults.results)) {
      console.log(`- ${test}: ${result ? 'PASS' : 'FAIL'}`);
    }
    
    // Exit with appropriate code
    if (testResults.passedTests === testResults.totalTests) {
      console.log('\nAll tests passed! VERITAS is fully integrated.');
      process.exit(0);
    } else {
      console.log('\nSome tests failed. Please review the results above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running integration tests:', error);
    process.exit(1);
  }
}

// Run the tests
main();
