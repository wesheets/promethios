#!/usr/bin/env node

/**
 * Test script for the Attribution module
 * 
 * This script tests the functionality of the attribution module
 * by running it against sample repository data.
 */

const attribution = require('./index');
const { execSync } = require('child_process');

// Import chalk with ESM compatibility fix
let chalk;
try {
  chalk = require('chalk');
  // Handle both ESM and CommonJS versions of chalk
  if (chalk.default && typeof chalk.default === 'function') {
    // ESM style import
    chalk = chalk.default;
  }
} catch (error) {
  // Fallback if chalk isn't available
  chalk = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    magenta: (text) => `\x1b[35m${text}\x1b[0m`
  };
}

// Test configuration
const TEST_CONFIG = {
  prevRef: 'HEAD~5',  // 5 commits back
  currRef: 'HEAD',    // Current commit
  testFile: 'phase-change-tracker.js',
  testDir: 'tools'
};

/**
 * Main test function
 */
async function runTests() {
  console.log(chalk.blue('\n🧪 Running Attribution Module Tests\n'));
  
  // Test getFileAuthor
  testGetFileAuthor();
  
  // Test getDetailedAttribution
  testGetDetailedAttribution();
  
  // Test getDirectoryAttribution
  testGetDirectoryAttribution();
  
  // Test getFileAttribution
  testGetFileAttribution();
  
  // Test getApiAttribution
  testGetApiAttribution();
  
  // Test generateAttributionSummary
  testGenerateAttributionSummary();
  
  console.log(chalk.green('\n✅ All tests completed\n'));
}

/**
 * Test getFileAuthor function
 */
function testGetFileAuthor() {
  console.log(chalk.yellow('\nTesting getFileAuthor...'));
  
  try {
    // Test with existing file
    const author = attribution.getFileAuthor(TEST_CONFIG.testFile, TEST_CONFIG.currRef);
    console.log(`Author of ${TEST_CONFIG.testFile}: ${author.name} <${author.email}>`);
    
    if (!author.name || author.name === 'Unknown') {
      console.error(chalk.red('❌ Failed to get author for existing file'));
    } else {
      console.log(chalk.green('✅ Successfully retrieved author for existing file'));
    }
    
    // Test with non-existent file
    const nonExistentAuthor = attribution.getFileAuthor('non-existent-file.js', TEST_CONFIG.currRef);
    
    if (nonExistentAuthor.name === 'Unknown') {
      console.log(chalk.green('✅ Correctly handled non-existent file'));
    } else {
      console.error(chalk.red('❌ Failed to handle non-existent file correctly'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error in getFileAuthor test: ${error.message}`));
  }
}

/**
 * Test getDetailedAttribution function
 */
function testGetDetailedAttribution() {
  console.log(chalk.yellow('\nTesting getDetailedAttribution...'));
  
  try {
    // Test with existing file
    const details = attribution.getDetailedAttribution(TEST_CONFIG.testFile, TEST_CONFIG.prevRef, TEST_CONFIG.currRef);
    
    console.log(`Detailed attribution for ${TEST_CONFIG.testFile}:`);
    console.log(`- Total commits: ${details.commitCount}`);
    console.log(`- Contributors: ${details.contributors.length}`);
    
    if (details.mainContributor) {
      console.log(`- Main contributor: ${details.mainContributor.name} (${details.mainContributor.commitCount} commits)`);
    }
    
    if (details.commitCount > 0 && details.contributors.length > 0) {
      console.log(chalk.green('✅ Successfully retrieved detailed attribution'));
    } else {
      console.log(chalk.yellow('⚠️ No changes detected between refs, or file not modified'));
    }
    
    // Test with non-existent file
    const nonExistentDetails = attribution.getDetailedAttribution('non-existent-file.js', TEST_CONFIG.prevRef, TEST_CONFIG.currRef);
    
    if (nonExistentDetails.commitCount === 0 && nonExistentDetails.contributors.length === 0) {
      console.log(chalk.green('✅ Correctly handled non-existent file'));
    } else {
      console.error(chalk.red('❌ Failed to handle non-existent file correctly'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error in getDetailedAttribution test: ${error.message}`));
  }
}

/**
 * Test getDirectoryAttribution function
 */
function testGetDirectoryAttribution() {
  console.log(chalk.yellow('\nTesting getDirectoryAttribution...'));
  
  try {
    // Create mock directory changes
    const dirChanges = {
      added: [TEST_CONFIG.testDir],
      removed: [],
      modified: []
    };
    
    // Test with mock changes
    const dirAttribution = attribution.getDirectoryAttribution(dirChanges, TEST_CONFIG.prevRef, TEST_CONFIG.currRef);
    
    console.log('Directory attribution results:');
    
    if (Object.keys(dirAttribution.added).length > 0) {
      const firstDir = Object.keys(dirAttribution.added)[0];
      const author = dirAttribution.added[firstDir];
      console.log(`- Added directory ${firstDir} attributed to: ${author.name}`);
      console.log(chalk.green('✅ Successfully retrieved directory attribution'));
    } else {
      console.log(chalk.yellow('⚠️ No directory attribution data generated'));
    }
    
    // Test with non-existent directory
    const nonExistentDirChanges = {
      added: ['non-existent-directory'],
      removed: [],
      modified: []
    };
    
    const nonExistentDirAttribution = attribution.getDirectoryAttribution(nonExistentDirChanges, TEST_CONFIG.prevRef, TEST_CONFIG.currRef);
    
    if (nonExistentDirAttribution.added['non-existent-directory'].name === 'Unknown') {
      console.log(chalk.green('✅ Correctly handled non-existent directory'));
    } else {
      console.error(chalk.red('❌ Failed to handle non-existent directory correctly'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error in getDirectoryAttribution test: ${error.message}`));
  }
}

/**
 * Test getFileAttribution function
 */
function testGetFileAttribution() {
  console.log(chalk.yellow('\nTesting getFileAttribution...'));
  
  try {
    // Create mock file changes
    const fileChanges = {
      added: [TEST_CONFIG.testFile],
      removed: [],
      modified: [],
      renamed: [],
      moved: []
    };
    
    // Test with mock changes
    const fileAttribution = attribution.getFileAttribution(fileChanges, TEST_CONFIG.prevRef, TEST_CONFIG.currRef);
    
    console.log('File attribution results:');
    
    if (Object.keys(fileAttribution.added).length > 0) {
      const firstFile = Object.keys(fileAttribution.added)[0];
      const author = fileAttribution.added[firstFile];
      console.log(`- Added file ${firstFile} attributed to: ${author.name}`);
      console.log(chalk.green('✅ Successfully retrieved file attribution'));
    } else {
      console.log(chalk.yellow('⚠️ No file attribution data generated'));
    }
    
    // Test with non-existent file
    const nonExistentFileChanges = {
      added: ['non-existent-file.js'],
      removed: [],
      modified: [],
      renamed: [],
      moved: []
    };
    
    const nonExistentFileAttribution = attribution.getFileAttribution(nonExistentFileChanges, TEST_CONFIG.prevRef, TEST_CONFIG.currRef);
    
    if (nonExistentFileAttribution.added['non-existent-file.js'].name === 'Unknown') {
      console.log(chalk.green('✅ Correctly handled non-existent file'));
    } else {
      console.error(chalk.red('❌ Failed to handle non-existent file correctly'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error in getFileAttribution test: ${error.message}`));
  }
}

/**
 * Test getApiAttribution function
 */
function testGetApiAttribution() {
  console.log(chalk.yellow('\nTesting getApiAttribution...'));
  
  try {
    // Create mock API changes
    const apiChanges = {
      interfaces: {
        added: [{ name: 'TestInterface', file: TEST_CONFIG.testFile }],
        removed: [],
        modified: []
      },
      functions: {
        added: [{ name: 'testFunction', file: TEST_CONFIG.testFile }],
        removed: [],
        modified: []
      },
      components: {
        added: [],
        removed: [],
        modified: []
      }
    };
    
    // Test with mock changes
    const apiAttribution = attribution.getApiAttribution(apiChanges, TEST_CONFIG.prevRef, TEST_CONFIG.currRef);
    
    console.log('API attribution results:');
    
    if (Object.keys(apiAttribution.interfaces.added).length > 0) {
      const firstInterface = Object.keys(apiAttribution.interfaces.added)[0];
      const author = apiAttribution.interfaces.added[firstInterface];
      console.log(`- Added interface attributed to: ${author.name}`);
      console.log(chalk.green('✅ Successfully retrieved API attribution'));
    } else {
      console.log(chalk.yellow('⚠️ No API attribution data generated for interfaces'));
    }
    
    if (Object.keys(apiAttribution.functions.added).length > 0) {
      const firstFunction = Object.keys(apiAttribution.functions.added)[0];
      const author = apiAttribution.functions.added[firstFunction];
      console.log(`- Added function attributed to: ${author.name}`);
      console.log(chalk.green('✅ Successfully retrieved API attribution'));
    } else {
      console.log(chalk.yellow('⚠️ No API attribution data generated for functions'));
    }
    
    // Test with non-existent file
    const nonExistentApiChanges = {
      interfaces: {
        added: [{ name: 'TestInterface', file: 'non-existent-file.js' }],
        removed: [],
        modified: []
      },
      functions: {
        added: [],
        removed: [],
        modified: []
      },
      components: {
        added: [],
        removed: [],
        modified: []
      }
    };
    
    const nonExistentApiAttribution = attribution.getApiAttribution(nonExistentApiChanges, TEST_CONFIG.prevRef, TEST_CONFIG.currRef);
    
    if (nonExistentApiAttribution.interfaces.added['TestInterface|non-existent-file.js'].name === 'Unknown') {
      console.log(chalk.green('✅ Correctly handled non-existent file in API attribution'));
    } else {
      console.error(chalk.red('❌ Failed to handle non-existent file correctly in API attribution'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error in getApiAttribution test: ${error.message}`));
  }
}

/**
 * Test generateAttributionSummary function
 */
function testGenerateAttributionSummary() {
  console.log(chalk.yellow('\nTesting generateAttributionSummary...'));
  
  try {
    // Create mock attribution data
    const mockDirAttribution = {
      added: {
        'test-dir': { name: 'Test User', email: 'test@example.com', date: 'Mon May 26 2025' }
      },
      removed: {},
      modified: {}
    };
    
    const mockFileAttribution = {
      added: {
        'test-file.js': { name: 'Test User', email: 'test@example.com', date: 'Mon May 26 2025' }
      },
      removed: {},
      modified: {},
      renamed: {},
      moved: {}
    };
    
    const mockApiAttribution = {
      interfaces: {
        added: {
          'TestInterface|test-file.js': { name: 'Test User', email: 'test@example.com', date: 'Mon May 26 2025' }
        },
        removed: {},
        modified: {}
      },
      functions: {
        added: {},
        removed: {},
        modified: {}
      },
      components: {
        added: {},
        removed: {},
        modified: {}
      }
    };
    
    // Test with mock data
    const summary = attribution.generateAttributionSummary(mockDirAttribution, mockFileAttribution, mockApiAttribution);
    
    console.log('Attribution summary results:');
    console.log(`- Total contributors: ${summary.totalContributors}`);
    
    if (summary.contributors.length > 0) {
      const firstContributor = summary.contributors[0];
      console.log(`- Top contributor: ${firstContributor.name} (${firstContributor.totalContributions} contributions)`);
      console.log(chalk.green('✅ Successfully generated attribution summary'));
    } else {
      console.log(chalk.yellow('⚠️ No contributors found in summary'));
    }
    
    // Test with empty data
    const emptySummary = attribution.generateAttributionSummary({}, {}, {});
    
    if (emptySummary.totalContributors === 0) {
      console.log(chalk.green('✅ Correctly handled empty attribution data'));
    } else {
      console.error(chalk.red('❌ Failed to handle empty attribution data correctly'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error in generateAttributionSummary test: ${error.message}`));
  }
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red(`\n❌ Fatal error in tests: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});
