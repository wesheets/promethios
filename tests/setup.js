/**
 * Test Setup for Promethios
 * 
 * This file configures the test environment for Mocha tests.
 */

// Configure test environment
process.env.NODE_ENV = 'test';

// Create test directories if needed
const fs = require('fs');
const path = require('path');

const testDataDir = path.join(process.cwd(), 'test_data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Note: Mocha hooks (before/after) should only be used within describe blocks in test files,
// not at the top level of the setup file.
