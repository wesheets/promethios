/**
 * Code coverage validation script for Confidence Scoring module
 * 
 * This script runs all tests for the Confidence Scoring module and generates
 * a coverage report to ensure 100% code coverage.
 */

const jest = require('jest');
const fs = require('fs');
const path = require('path');

// Configure Jest for coverage
const jestConfig = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/modules/confidence_scoring/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageDirectory: 'tests/coverage/confidence_scoring',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  testMatch: [
    '**/tests/unit/modules/confidence_scoring/**/*.js',
    '**/tests/integration/modules/confidence_scoring/**/*.js',
    '**/tests/e2e/modules/confidence_scoring/**/*.js'
  ],
  verbose: true
};

// Write config to file
fs.writeFileSync(
  path.join(__dirname, 'jest.confidence_scoring.config.js'),
  `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
);

console.log('Running tests with coverage for Confidence Scoring module...');

// Run Jest with coverage
jest.run([
  '--config',
  path.join(__dirname, 'jest.confidence_scoring.config.js')
]).then(success => {
  if (success) {
    console.log('All tests passed with 100% coverage!');
    
    // Read coverage summary
    const coverageSummaryPath = path.join(
      __dirname,
      'tests/coverage/confidence_scoring/coverage-summary.json'
    );
    
    if (fs.existsSync(coverageSummaryPath)) {
      const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      console.log('Coverage Summary:');
      console.log(JSON.stringify(summary.total, null, 2));
    }
  } else {
    console.error('Tests failed or coverage thresholds not met.');
    process.exit(1);
  }
}).catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
