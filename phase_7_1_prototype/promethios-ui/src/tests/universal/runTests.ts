/**
 * Universal Governance Test Runner
 * 
 * Executes the comprehensive test suite and generates a detailed report
 */

import { runUniversalGovernanceTests, UniversalGovernanceTest } from './UniversalGovernanceTest';

async function main() {
  console.log('🚀 Starting Universal Governance Test Suite');
  console.log('=' .repeat(60));
  
  try {
    // Run all tests
    const testRunner = new UniversalGovernanceTest();
    const results = await testRunner.runAllTests();
    
    // Generate and display report
    const report = testRunner.formatResults(results);
    console.log(report);
    
    // Write report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, 'test-report.txt');
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Test report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(results.overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { main as runTests };

