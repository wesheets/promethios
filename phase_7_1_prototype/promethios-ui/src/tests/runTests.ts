/**
 * Test Runner for UnifiedChatManager System
 * 
 * Executes the comprehensive test harness and provides detailed results.
 */

import UnifiedChatManagerTestHarness from './UnifiedChatManagerTestHarness';

async function runTests() {
  console.log('🚀 Starting UnifiedChatManager Test Suite');
  console.log('=' .repeat(80));
  
  const testHarness = new UnifiedChatManagerTestHarness();
  
  try {
    // Run all tests
    await testHarness.runAllTests();
    
    console.log('\n✅ Test suite completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed with critical error:', error);
    process.exit(1);
    
  } finally {
    // Cleanup
    await testHarness.cleanup();
    console.log('\n🧹 Test cleanup completed');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Failed to run tests:', error);
    process.exit(1);
  });
}

export default runTests;

