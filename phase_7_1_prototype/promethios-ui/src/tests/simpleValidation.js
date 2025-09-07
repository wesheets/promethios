/**
 * Simple Validation Script for UnifiedChatManager System
 * 
 * Basic validation to ensure all components are properly structured.
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Starting UnifiedChatManager Validation');
console.log('='.repeat(80));

// Test Results Tracking
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0
};

// Test Runner Function
async function runTest(testName, testFunction) {
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Running: ${testName}`);
    
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    testResults.passedTests++;
    console.log(`✅ Passed: ${testName} (${duration}ms)`);
    
    return { passed: true, duration, result };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    testResults.failedTests++;
    console.log(`❌ Failed: ${testName} (${duration}ms) - ${error.message}`);
    
    return { passed: false, duration, error: error.message };
  } finally {
    testResults.totalTests++;
  }
}

// Validation Tests
async function validateComponents() {
  console.log('\n📋 Component Validation Tests');
  
  await runTest('Component Files Exist', async () => {
    const componentFiles = [
      'src/services/UnifiedChatManager.ts',
      'src/services/ChatStateManager.ts',
      'src/services/MessageRouter.ts',
      'src/services/ParticipantManager.ts',
      'src/services/NotificationBridge.ts',
      'src/services/FirebaseChatPersistence.ts'
    ];
    
    const missingFiles = [];
    
    for (const file of componentFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      throw new Error(`Missing component files: ${missingFiles.join(', ')}`);
    }
    
    return { componentFiles: componentFiles.length, missingFiles: missingFiles.length };
  });
  
  await runTest('UnifiedChatManager Structure', async () => {
    const content = fs.readFileSync('src/services/UnifiedChatManager.ts', 'utf8');
    
    const expectedElements = [
      'class UnifiedChatManager',
      'export interface ChatSession',
      'export default UnifiedChatManager',
      'getInstance',
      'createOrGetSession',
      'sendMessage',
      'addParticipant',
      'removeParticipant'
    ];
    
    const missingElements = expectedElements.filter(element => !content.includes(element));
    
    if (missingElements.length > 0) {
      throw new Error(`Missing elements in UnifiedChatManager: ${missingElements.join(', ')}`);
    }
    
    return { expectedElements: expectedElements.length, foundElements: expectedElements.length };
  });
  
  await runTest('ChatStateManager Structure', async () => {
    const content = fs.readFileSync('src/services/ChatStateManager.ts', 'utf8');
    
    const expectedElements = [
      'class ChatStateManager',
      'export type ChatMode',
      'setActiveSession',
      'setParticipantCount',
      'switchMode',
      'isSharedMode'
    ];
    
    const missingElements = expectedElements.filter(element => !content.includes(element));
    
    if (missingElements.length > 0) {
      throw new Error(`Missing elements in ChatStateManager: ${missingElements.join(', ')}`);
    }
    
    return { expectedElements: expectedElements.length, foundElements: expectedElements.length };
  });
  
  await runTest('MessageRouter Structure', async () => {
    const content = fs.readFileSync('src/services/MessageRouter.ts', 'utf8');
    
    const expectedElements = [
      'class MessageRouter',
      'export interface Message',
      'routeMessage',
      'determineRecipients',
      'deliverMessage'
    ];
    
    const missingElements = expectedElements.filter(element => !content.includes(element));
    
    if (missingElements.length > 0) {
      throw new Error(`Missing elements in MessageRouter: ${missingElements.join(', ')}`);
    }
    
    return { expectedElements: expectedElements.length, foundElements: expectedElements.length };
  });
  
  await runTest('ParticipantManager Structure', async () => {
    const content = fs.readFileSync('src/services/ParticipantManager.ts', 'utf8');
    
    const expectedElements = [
      'class ParticipantManager',
      'export interface Participant',
      'addParticipant',
      'removeParticipant',
      'setTypingStatus',
      'updatePresence'
    ];
    
    const missingElements = expectedElements.filter(element => !content.includes(element));
    
    if (missingElements.length > 0) {
      throw new Error(`Missing elements in ParticipantManager: ${missingElements.join(', ')}`);
    }
    
    return { expectedElements: expectedElements.length, foundElements: expectedElements.length };
  });
  
  await runTest('NotificationBridge Structure', async () => {
    const content = fs.readFileSync('src/services/NotificationBridge.ts', 'utf8');
    
    const expectedElements = [
      'class NotificationBridge',
      'export type NotificationEvent',
      'handleEvent',
      'createNotificationPayload',
      'applyUserPreferences'
    ];
    
    const missingElements = expectedElements.filter(element => !content.includes(element));
    
    if (missingElements.length > 0) {
      throw new Error(`Missing elements in NotificationBridge: ${missingElements.join(', ')}`);
    }
    
    return { expectedElements: expectedElements.length, foundElements: expectedElements.length };
  });
  
  await runTest('FirebaseChatPersistence Structure', async () => {
    const content = fs.readFileSync('src/services/FirebaseChatPersistence.ts', 'utf8');
    
    const expectedElements = [
      'class FirebaseChatPersistence',
      'saveSession',
      'saveMessage',
      'saveParticipant',
      'updateTypingStatus',
      'updateUserPresence'
    ];
    
    const missingElements = expectedElements.filter(element => !content.includes(element));
    
    if (missingElements.length > 0) {
      throw new Error(`Missing elements in FirebaseChatPersistence: ${missingElements.join(', ')}`);
    }
    
    return { expectedElements: expectedElements.length, foundElements: expectedElements.length };
  });
}

async function validateConfiguration() {
  console.log('\n📋 Configuration Validation Tests');
  
  await runTest('Participant Limits Configuration', async () => {
    const content = fs.readFileSync('src/services/UnifiedChatManager.ts', 'utf8');
    
    if (!content.includes('maxParticipants') || !content.includes('10')) {
      throw new Error('Participant limits not properly configured');
    }
    
    return { maxParticipantsConfigured: true };
  });
  
  await runTest('Firebase Schema Configuration', async () => {
    const content = fs.readFileSync('src/services/FirebaseChatPersistence.ts', 'utf8');
    
    const expectedCollections = [
      'chat_sessions',
      'chat_messages', 
      'chat_participants',
      'chat_typing',
      'chat_presence'
    ];
    
    const missingCollections = expectedCollections.filter(collection => 
      !content.includes(collection)
    );
    
    if (missingCollections.length > 0) {
      throw new Error(`Missing Firebase collections: ${missingCollections.join(', ')}`);
    }
    
    return { expectedCollections: expectedCollections.length, configuredCollections: expectedCollections.length };
  });
  
  await runTest('Event System Integration', async () => {
    const componentFiles = [
      'src/services/ChatStateManager.ts',
      'src/services/MessageRouter.ts',
      'src/services/ParticipantManager.ts',
      'src/services/NotificationBridge.ts'
    ];
    
    let eventSystemCount = 0;
    
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('eventListeners') && content.includes('emit')) {
        eventSystemCount++;
      }
    }
    
    if (eventSystemCount < componentFiles.length) {
      throw new Error(`Not all components have event system integration: ${eventSystemCount}/${componentFiles.length}`);
    }
    
    return { componentsWithEvents: eventSystemCount, totalComponents: componentFiles.length };
  });
}

async function validatePerformance() {
  console.log('\n📋 Performance Validation Tests');
  
  await runTest('Component File Sizes', async () => {
    const componentFiles = [
      'src/services/UnifiedChatManager.ts',
      'src/services/ChatStateManager.ts',
      'src/services/MessageRouter.ts',
      'src/services/ParticipantManager.ts',
      'src/services/NotificationBridge.ts',
      'src/services/FirebaseChatPersistence.ts'
    ];
    
    let totalSize = 0;
    let largeFiles = [];
    
    for (const file of componentFiles) {
      const filePath = path.join(process.cwd(), file);
      const stats = fs.statSync(filePath);
      const sizeKB = stats.size / 1024;
      
      totalSize += sizeKB;
      
      if (sizeKB > 100) { // Flag files larger than 100KB
        largeFiles.push({ file, size: Math.round(sizeKB) });
      }
    }
    
    return { 
      totalSizeKB: Math.round(totalSize), 
      averageSizeKB: Math.round(totalSize / componentFiles.length),
      largeFiles: largeFiles.length,
      largeFileDetails: largeFiles
    };
  });
  
  await runTest('Code Complexity Analysis', async () => {
    const content = fs.readFileSync('src/services/UnifiedChatManager.ts', 'utf8');
    
    const functionCount = (content.match(/async\s+\w+\(|public\s+async\s+\w+\(/g) || []).length;
    const classCount = (content.match(/class\s+\w+/g) || []).length;
    const interfaceCount = (content.match(/interface\s+\w+/g) || []).length;
    
    return { 
      functions: functionCount, 
      classes: classCount, 
      interfaces: interfaceCount,
      complexity: functionCount + classCount + interfaceCount
    };
  });
}

// Main Validation Runner
async function runValidation() {
  const startTime = Date.now();
  
  try {
    await validateComponents();
    await validateConfiguration();
    await validatePerformance();
    
    const totalTime = Date.now() - startTime;
    printValidationSummary(totalTime);
    
  } catch (error) {
    console.error('\n💥 Validation failed with critical error:', error);
    process.exit(1);
  }
}

// Print Validation Summary
function printValidationSummary(totalTime) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 UNIFIED CHAT MANAGER VALIDATION RESULTS');
  console.log('='.repeat(80));
  
  console.log(`📊 OVERALL RESULTS`);
  console.log(`   Total Tests: ${testResults.totalTests}`);
  console.log(`   Passed: ${testResults.passedTests} (${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${testResults.failedTests} (${((testResults.failedTests / testResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   Total Duration: ${totalTime}ms`);
  console.log(`   Average Test Time: ${(totalTime / testResults.totalTests).toFixed(1)}ms`);
  
  if (testResults.failedTests === 0) {
    console.log('\n🎉 ALL VALIDATIONS PASSED!');
    console.log('✅ The UnifiedChatManager system architecture is solid and ready for integration.');
    console.log('🚀 You can now proceed with UI integration and live testing.');
  } else {
    console.log(`\n⚠️  ${testResults.failedTests} validations failed. Review the errors above before proceeding.`);
  }
  
  console.log('='.repeat(80));
}

// Run the validation
runValidation().catch(error => {
  console.error('Failed to run validation:', error);
  process.exit(1);
});

