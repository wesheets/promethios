/**
 * Code coverage validation script for Tool Selection History module
 * 
 * Runs tests and generates code coverage report for the Tool Selection History module.
 * 
 * @module scripts/validate_tool_selection_history_coverage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MODULE_PATH = 'src/modules/tool_selection_history';
const TEST_PATH = 'tests/unit/modules/tool_selection_history';
const INTEGRATION_TEST_PATH = 'tests/integration/modules/tool_selection_history';
const COVERAGE_THRESHOLD = 90; // 90% coverage threshold
const COVERAGE_OUTPUT_DIR = 'tests/coverage/tool_selection_history';

// Ensure coverage directory exists
if (!fs.existsSync(COVERAGE_OUTPUT_DIR)) {
  fs.mkdirSync(COVERAGE_OUTPUT_DIR, { recursive: true });
}

console.log('Starting Tool Selection History module code coverage validation...');

try {
  // Run unit tests with coverage
  console.log('\nRunning unit tests with coverage...');
  execSync(`npx nyc --reporter=html --reporter=text --report-dir=${COVERAGE_OUTPUT_DIR}/unit mocha ${TEST_PATH}/**/*.js --timeout 10000`, { 
    stdio: 'inherit' 
  });
  
  // Run integration tests with coverage
  console.log('\nRunning integration tests with coverage...');
  execSync(`npx nyc --reporter=html --reporter=text --report-dir=${COVERAGE_OUTPUT_DIR}/integration mocha ${INTEGRATION_TEST_PATH}/**/*.js --timeout 10000`, { 
    stdio: 'inherit' 
  });
  
  // Merge coverage reports
  console.log('\nMerging coverage reports...');
  execSync(`npx nyc merge ${COVERAGE_OUTPUT_DIR}/unit ${COVERAGE_OUTPUT_DIR}/integration ${COVERAGE_OUTPUT_DIR}/merged`, { 
    stdio: 'inherit' 
  });
  
  // Generate final report
  console.log('\nGenerating final coverage report...');
  execSync(`npx nyc report --reporter=html --reporter=text --report-dir=${COVERAGE_OUTPUT_DIR}/final`, { 
    stdio: 'inherit' 
  });
  
  // Read coverage summary
  const coverageSummary = JSON.parse(fs.readFileSync(`${COVERAGE_OUTPUT_DIR}/final/coverage-summary.json`, 'utf8'));
  
  // Calculate overall coverage
  const moduleFiles = Object.keys(coverageSummary).filter(key => key.includes(MODULE_PATH));
  let totalStatements = 0;
  let coveredStatements = 0;
  
  moduleFiles.forEach(file => {
    const fileSummary = coverageSummary[file];
    totalStatements += fileSummary.statements.total;
    coveredStatements += fileSummary.statements.covered;
  });
  
  const overallCoverage = (coveredStatements / totalStatements) * 100;
  
  console.log(`\nOverall code coverage: ${overallCoverage.toFixed(2)}%`);
  
  // Check if coverage meets threshold
  if (overallCoverage >= COVERAGE_THRESHOLD) {
    console.log(`✅ Code coverage meets threshold (${COVERAGE_THRESHOLD}%)`);
    
    // Generate coverage badge
    const badgeColor = overallCoverage >= 90 ? 'brightgreen' : 
                       overallCoverage >= 80 ? 'green' : 
                       overallCoverage >= 70 ? 'yellowgreen' : 
                       overallCoverage >= 60 ? 'yellow' : 'red';
    
    const badgeUrl = `https://img.shields.io/badge/coverage-${Math.round(overallCoverage)}%25-${badgeColor}`;
    
    // Save badge URL to file
    fs.writeFileSync(`${COVERAGE_OUTPUT_DIR}/badge-url.txt`, badgeUrl);
    
    // Generate coverage summary
    const summary = {
      timestamp: new Date().toISOString(),
      overallCoverage: overallCoverage,
      moduleFiles: moduleFiles.length,
      totalStatements: totalStatements,
      coveredStatements: coveredStatements,
      threshold: COVERAGE_THRESHOLD,
      passed: true
    };
    
    fs.writeFileSync(`${COVERAGE_OUTPUT_DIR}/summary.json`, JSON.stringify(summary, null, 2));
    
    console.log(`\nCoverage report saved to ${COVERAGE_OUTPUT_DIR}/final`);
    console.log(`Coverage badge URL: ${badgeUrl}`);
    
    process.exit(0);
  } else {
    console.error(`❌ Code coverage (${overallCoverage.toFixed(2)}%) does not meet threshold (${COVERAGE_THRESHOLD}%)`);
    
    // Generate coverage summary
    const summary = {
      timestamp: new Date().toISOString(),
      overallCoverage: overallCoverage,
      moduleFiles: moduleFiles.length,
      totalStatements: totalStatements,
      coveredStatements: coveredStatements,
      threshold: COVERAGE_THRESHOLD,
      passed: false
    };
    
    fs.writeFileSync(`${COVERAGE_OUTPUT_DIR}/summary.json`, JSON.stringify(summary, null, 2));
    
    // Find uncovered lines
    console.log('\nUncovered areas:');
    moduleFiles.forEach(file => {
      const fileSummary = coverageSummary[file];
      const fileCoverage = (fileSummary.statements.covered / fileSummary.statements.total) * 100;
      
      if (fileCoverage < COVERAGE_THRESHOLD) {
        console.log(`  - ${file}: ${fileCoverage.toFixed(2)}%`);
      }
    });
    
    process.exit(1);
  }
} catch (error) {
  console.error('Error running coverage validation:', error);
  process.exit(1);
}
