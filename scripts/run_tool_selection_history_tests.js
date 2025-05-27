/**
 * Modified test runner for Tool Selection History module
 * 
 * This script runs the tests for the Tool Selection History module
 * with proper error handling and timeout management.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_TIMEOUT = 30000; // 30 seconds timeout
const TEST_FILES = [
  'tests/unit/modules/tool_selection_history/test_index.js',
  'tests/unit/modules/tool_selection_history/test_tool_usage_tracker.js',
  'tests/unit/modules/tool_selection_history/test_outcome_evaluator.js',
  'tests/unit/modules/tool_selection_history/test_pattern_analyzer.js',
  'tests/unit/modules/tool_selection_history/test_recommendation_engine.js'
];

console.log('Starting Tool Selection History module tests with enhanced error handling...');

// Create results directory
const RESULTS_DIR = 'test_results/tool_selection_history';
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Run tests one by one with proper error handling
let allTestsPassed = true;
let testResults = [];

for (const testFile of TEST_FILES) {
  console.log(`\nRunning test: ${testFile}`);
  
  try {
    // Run test with timeout
    const command = `npx mocha ${testFile} --timeout ${TEST_TIMEOUT}`;
    const output = execSync(command, { 
      timeout: TEST_TIMEOUT + 5000, // Add 5 seconds buffer
      encoding: 'utf8'
    });
    
    console.log('Test completed successfully');
    console.log(output);
    
    testResults.push({
      file: testFile,
      success: true,
      output: output
    });
    
    // Save test output
    fs.writeFileSync(
      path.join(RESULTS_DIR, `${path.basename(testFile, '.js')}_result.txt`),
      output
    );
  } catch (error) {
    console.error(`Error running test ${testFile}:`);
    console.error(error.message);
    
    if (error.stdout) {
      console.log('Standard output:');
      console.log(error.stdout);
    }
    
    if (error.stderr) {
      console.log('Standard error:');
      console.log(error.stderr);
    }
    
    testResults.push({
      file: testFile,
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
    
    // Save error output
    fs.writeFileSync(
      path.join(RESULTS_DIR, `${path.basename(testFile, '.js')}_error.txt`),
      `Error: ${error.message}\n\nStdout: ${error.stdout || ''}\n\nStderr: ${error.stderr || ''}`
    );
    
    allTestsPassed = false;
  }
}

// Generate summary report
const summary = {
  timestamp: new Date().toISOString(),
  totalTests: TEST_FILES.length,
  passedTests: testResults.filter(r => r.success).length,
  failedTests: testResults.filter(r => !r.success).length,
  allPassed: allTestsPassed,
  results: testResults.map(r => ({
    file: r.file,
    success: r.success,
    error: r.success ? null : r.error
  }))
};

fs.writeFileSync(
  path.join(RESULTS_DIR, 'summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('\n--- Test Summary ---');
console.log(`Total tests: ${summary.totalTests}`);
console.log(`Passed tests: ${summary.passedTests}`);
console.log(`Failed tests: ${summary.failedTests}`);
console.log(`Overall status: ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
console.log(`Results saved to: ${RESULTS_DIR}`);

// Exit with appropriate code
process.exit(allTestsPassed ? 0 : 1);
