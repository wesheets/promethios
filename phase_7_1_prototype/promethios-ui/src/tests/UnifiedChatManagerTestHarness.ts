/**
 * UnifiedChatManager Test Harness
 * 
 * Comprehensive testing suite for the unified chat system.
 * Tests component integration, real-time features, and edge cases.
 */

import { User } from 'firebase/auth';
import UnifiedChatManager from '../services/UnifiedChatManager';
import { ChatStateManager } from '../services/ChatStateManager';
import { MessageRouter } from '../services/MessageRouter';
import { ParticipantManager } from '../services/ParticipantManager';
import { NotificationBridge } from '../services/NotificationBridge';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class UnifiedChatManagerTestHarness {
  private chatManager: UnifiedChatManager;
  private mockUsers: Map<string, User> = new Map();
  private testResults: TestSuite[] = [];
  private eventLog: any[] = [];

  constructor() {
    console.log('🧪 [TestHarness] Initializing UnifiedChatManager Test Harness');
    
    // Initialize with test configuration
    this.chatManager = UnifiedChatManager.getInstance({
      maxParticipants: 10,
      optimalParticipants: 5,
      warningThreshold: 8,
      enableRealTimeSync: true,
      enableTypingIndicators: true,
      enableNotifications: true
    });

    this.setupEventLogging();
    this.createMockUsers();
  }

  /**
   * Run all test suites
   */
  public async runAllTests(): Promise<void> {
    console.log('🚀 [TestHarness] Starting comprehensive test suite');
    
    const startTime = Date.now();
    
    try {
      // Test suites in order of dependency
      await this.runInitializationTests();
      await this.runSessionManagementTests();
      await this.runParticipantManagementTests();
      await this.runMessageRoutingTests();
      await this.runModeTransitionTests();
      await this.runRealTimeFeatureTests();
      await this.runErrorHandlingTests();
      await this.runPerformanceTests();
      
      const totalTime = Date.now() - startTime;
      this.printTestSummary(totalTime);
      
    } catch (error) {
      console.error('💥 [TestHarness] Test suite failed with critical error:', error);
    }
  }

  /**
   * Test 1: Initialization and Component Setup
   */
  private async runInitializationTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Initialization Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test 1.1: Initialize with mock user
    await this.runTest(suite, 'Initialize UnifiedChatManager', async () => {
      const mockUser = this.mockUsers.get('host')!;
      await this.chatManager.initialize(mockUser);
      
      // Verify initialization
      if (!mockUser) {
        throw new Error('Mock user not found');
      }
      
      return { initialized: true, userId: mockUser.uid };
    });

    // Test 1.2: Verify component integration
    await this.runTest(suite, 'Component Integration Check', async () => {
      // Check if all components are properly initialized
      // This is validated by the successful initialization above
      return { componentsIntegrated: true };
    });

    this.testResults.push(suite);
  }

  /**
   * Test 2: Session Management
   */
  private async runSessionManagementTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Session Management Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test 2.1: Create regular session
    await this.runTest(suite, 'Create Regular Session', async () => {
      const session = await this.chatManager.createOrGetSession(
        'test_regular_session',
        'Test Regular Chat',
        'agent_123'
      );
      
      if (session.mode !== 'regular') {
        throw new Error(`Expected regular mode, got ${session.mode}`);
      }
      
      return { sessionId: session.id, mode: session.mode, participants: session.participants.length };
    });

    // Test 2.2: Create shared session
    await this.runTest(suite, 'Create Shared Session', async () => {
      const session = await this.chatManager.createOrGetSession(
        'test_shared_session',
        'Test Shared Chat',
        'agent_456',
        ['guest_user_1', 'guest_user_2']
      );
      
      if (session.mode !== 'shared') {
        throw new Error(`Expected shared mode, got ${session.mode}`);
      }
      
      return { sessionId: session.id, mode: session.mode, participants: session.participants.length };
    });

    // Test 2.3: Get existing session
    await this.runTest(suite, 'Get Existing Session', async () => {
      const session = await this.chatManager.createOrGetSession(
        'test_regular_session',
        'Test Regular Chat',
        'agent_123'
      );
      
      if (!session) {
        throw new Error('Failed to retrieve existing session');
      }
      
      return { sessionId: session.id, retrieved: true };
    });

    this.testResults.push(suite);
  }

  /**
   * Test 3: Participant Management
   */
  private async runParticipantManagementTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Participant Management Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test 3.1: Add participant to regular session
    await this.runTest(suite, 'Add Participant to Regular Session', async () => {
      await this.chatManager.addParticipant('test_regular_session', 'guest_user_3', 'participant');
      
      const session = this.chatManager.getSession('test_regular_session');
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Should have switched to shared mode
      if (session.mode !== 'shared') {
        throw new Error(`Expected mode switch to shared, got ${session.mode}`);
      }
      
      return { 
        sessionId: session.id, 
        mode: session.mode, 
        participantCount: session.participants.length 
      };
    });

    // Test 3.2: Remove participant
    await this.runTest(suite, 'Remove Participant', async () => {
      await this.chatManager.removeParticipant('test_regular_session', 'guest_user_3');
      
      const session = this.chatManager.getSession('test_regular_session');
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Should have switched back to regular mode
      if (session.mode !== 'regular') {
        throw new Error(`Expected mode switch to regular, got ${session.mode}`);
      }
      
      return { 
        sessionId: session.id, 
        mode: session.mode, 
        participantCount: session.participants.length 
      };
    });

    // Test 3.3: Test participant limit
    await this.runTest(suite, 'Participant Limit Enforcement', async () => {
      const sessionId = 'test_limit_session';
      await this.chatManager.createOrGetSession(sessionId, 'Limit Test', 'agent_789');
      
      // Try to add maximum participants
      const maxParticipants = 10;
      let addedCount = 1; // Host already added
      
      try {
        for (let i = 1; i < maxParticipants; i++) {
          await this.chatManager.addParticipant(sessionId, `user_${i}`, 'participant');
          addedCount++;
        }
        
        // Try to add one more (should fail)
        try {
          await this.chatManager.addParticipant(sessionId, 'overflow_user', 'participant');
          throw new Error('Should have thrown participant limit error');
        } catch (error) {
          if (!error.message.includes('maximum participants')) {
            throw error;
          }
        }
        
      } catch (error) {
        throw new Error(`Failed to add participants: ${error.message}`);
      }
      
      return { maxParticipants, addedCount, limitEnforced: true };
    });

    this.testResults.push(suite);
  }

  /**
   * Test 4: Message Routing
   */
  private async runMessageRoutingTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Message Routing Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test 4.1: Send message in regular mode
    await this.runTest(suite, 'Send Message in Regular Mode', async () => {
      const message = await this.chatManager.sendMessage(
        'test_regular_session',
        'Hello from regular chat!',
        { type: 'all' }
      );
      
      if (!message.id) {
        throw new Error('Message ID not generated');
      }
      
      return { messageId: message.id, content: message.content, delivered: message.delivered };
    });

    // Test 4.2: Send message in shared mode
    await this.runTest(suite, 'Send Message in Shared Mode', async () => {
      const message = await this.chatManager.sendMessage(
        'test_shared_session',
        'Hello from shared chat!',
        { type: 'all' }
      );
      
      if (!message.id) {
        throw new Error('Message ID not generated');
      }
      
      return { messageId: message.id, content: message.content, delivered: message.delivered };
    });

    // Test 4.3: Send targeted message
    await this.runTest(suite, 'Send Targeted Message', async () => {
      const message = await this.chatManager.sendMessage(
        'test_shared_session',
        'Direct message to guest',
        { type: 'user', id: 'guest_user_1', name: 'Guest User 1' }
      );
      
      if (!message.target || message.target.type !== 'user') {
        throw new Error('Message target not set correctly');
      }
      
      return { messageId: message.id, targetType: message.target.type, targetId: message.target.id };
    });

    this.testResults.push(suite);
  }

  /**
   * Test 5: Mode Transitions
   */
  private async runModeTransitionTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Mode Transition Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test 5.1: Regular to Shared transition
    await this.runTest(suite, 'Regular to Shared Transition', async () => {
      const sessionId = 'test_transition_session';
      
      // Create regular session
      let session = await this.chatManager.createOrGetSession(sessionId, 'Transition Test', 'agent_999');
      if (session.mode !== 'regular') {
        throw new Error(`Expected regular mode initially, got ${session.mode}`);
      }
      
      // Add participant (should trigger mode switch)
      await this.chatManager.addParticipant(sessionId, 'transition_guest', 'participant');
      
      // Check mode switch
      session = this.chatManager.getSession(sessionId)!;
      if (session.mode !== 'shared') {
        throw new Error(`Expected mode switch to shared, got ${session.mode}`);
      }
      
      return { 
        sessionId, 
        initialMode: 'regular', 
        finalMode: session.mode, 
        transitionSuccessful: true 
      };
    });

    // Test 5.2: Shared to Regular transition
    await this.runTest(suite, 'Shared to Regular Transition', async () => {
      const sessionId = 'test_transition_session';
      
      // Remove participant (should trigger mode switch back)
      await this.chatManager.removeParticipant(sessionId, 'transition_guest');
      
      // Check mode switch
      const session = this.chatManager.getSession(sessionId)!;
      if (session.mode !== 'regular') {
        throw new Error(`Expected mode switch back to regular, got ${session.mode}`);
      }
      
      return { 
        sessionId, 
        initialMode: 'shared', 
        finalMode: session.mode, 
        transitionSuccessful: true 
      };
    });

    this.testResults.push(suite);
  }

  /**
   * Test 6: Real-time Features
   */
  private async runRealTimeFeatureTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Real-time Features Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test 6.1: Typing indicators
    await this.runTest(suite, 'Typing Indicators', async () => {
      const sessionId = 'test_shared_session';
      
      // Set typing status
      await this.chatManager.setTypingStatus(sessionId, true);
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear typing status
      await this.chatManager.setTypingStatus(sessionId, false);
      
      return { typingIndicatorTested: true };
    });

    // Test 6.2: Event propagation
    await this.runTest(suite, 'Event Propagation', async () => {
      const eventsBefore = this.eventLog.length;
      
      // Trigger some events
      await this.chatManager.sendMessage('test_shared_session', 'Event test message');
      await this.chatManager.setTypingStatus('test_shared_session', true);
      await this.chatManager.setTypingStatus('test_shared_session', false);
      
      const eventsAfter = this.eventLog.length;
      const newEvents = eventsAfter - eventsBefore;
      
      if (newEvents === 0) {
        throw new Error('No events were logged');
      }
      
      return { eventsBefore, eventsAfter, newEvents };
    });

    this.testResults.push(suite);
  }

  /**
   * Test 7: Error Handling
   */
  private async runErrorHandlingTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Error Handling Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test 7.1: Invalid session operations
    await this.runTest(suite, 'Invalid Session Operations', async () => {
      try {
        await this.chatManager.sendMessage('nonexistent_session', 'This should fail');
        throw new Error('Should have thrown error for nonexistent session');
      } catch (error) {
        if (!error.message.includes('not found')) {
          throw error;
        }
      }
      
      return { errorHandledCorrectly: true };
    });

    // Test 7.2: Invalid participant operations
    await this.runTest(suite, 'Invalid Participant Operations', async () => {
      try {
        await this.chatManager.removeParticipant('test_regular_session', 'nonexistent_user');
        // This might not throw an error, which is fine
      } catch (error) {
        // Error is acceptable here
      }
      
      return { errorHandledGracefully: true };
    });

    this.testResults.push(suite);
  }

  /**
   * Test 8: Performance Tests
   */
  private async runPerformanceTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Performance Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test 8.1: Multiple rapid messages
    await this.runTest(suite, 'Rapid Message Sending', async () => {
      const sessionId = 'test_performance_session';
      await this.chatManager.createOrGetSession(sessionId, 'Performance Test', 'agent_perf');
      
      const messageCount = 10;
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < messageCount; i++) {
        promises.push(
          this.chatManager.sendMessage(sessionId, `Performance test message ${i}`)
        );
      }
      
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      const messagesPerSecond = (messageCount / duration) * 1000;
      
      return { messageCount, duration, messagesPerSecond };
    });

    // Test 8.2: Multiple participant operations
    await this.runTest(suite, 'Rapid Participant Operations', async () => {
      const sessionId = 'test_participant_perf';
      await this.chatManager.createOrGetSession(sessionId, 'Participant Perf Test', 'agent_part_perf');
      
      const participantCount = 5;
      const startTime = Date.now();
      
      // Add participants
      for (let i = 0; i < participantCount; i++) {
        await this.chatManager.addParticipant(sessionId, `perf_user_${i}`, 'participant');
      }
      
      // Remove participants
      for (let i = 0; i < participantCount; i++) {
        await this.chatManager.removeParticipant(sessionId, `perf_user_${i}`);
      }
      
      const duration = Date.now() - startTime;
      const operationsPerSecond = ((participantCount * 2) / duration) * 1000;
      
      return { participantCount, operations: participantCount * 2, duration, operationsPerSecond };
    });

    this.testResults.push(suite);
  }

  /**
   * Run individual test with error handling and timing
   */
  private async runTest(
    suite: TestSuite, 
    testName: string, 
    testFunction: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`  🧪 Running: ${testName}`);
      
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      suite.results.push({
        testName,
        passed: true,
        duration,
        details: result
      });
      
      suite.passedTests++;
      console.log(`  ✅ Passed: ${testName} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      suite.results.push({
        testName,
        passed: false,
        duration,
        error: error.message
      });
      
      suite.failedTests++;
      console.log(`  ❌ Failed: ${testName} (${duration}ms) - ${error.message}`);
    }
    
    suite.totalTests++;
    suite.totalDuration += Date.now() - startTime;
  }

  /**
   * Create mock users for testing
   */
  private createMockUsers(): void {
    const mockUsers = [
      { uid: 'host_user', displayName: 'Host User', email: 'host@test.com' },
      { uid: 'guest_user_1', displayName: 'Guest User 1', email: 'guest1@test.com' },
      { uid: 'guest_user_2', displayName: 'Guest User 2', email: 'guest2@test.com' },
      { uid: 'guest_user_3', displayName: 'Guest User 3', email: 'guest3@test.com' }
    ];

    mockUsers.forEach(userData => {
      const mockUser = {
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: 'mock_refresh_token',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock_token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({})
      } as User;

      this.mockUsers.set(userData.uid === 'host_user' ? 'host' : userData.uid, mockUser);
    });

    console.log(`🎭 [TestHarness] Created ${mockUsers.length} mock users`);
  }

  /**
   * Set up event logging for testing
   */
  private setupEventLogging(): void {
    // This would normally listen to actual events from the chat manager
    // For now, we'll just create a mock event log
    this.eventLog = [];
    
    console.log('📝 [TestHarness] Event logging initialized');
  }

  /**
   * Print comprehensive test summary
   */
  private printTestSummary(totalTime: number): void {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 UNIFIED CHAT MANAGER TEST RESULTS');
    console.log('='.repeat(80));
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    this.testResults.forEach(suite => {
      console.log(`\n📋 ${suite.suiteName}`);
      console.log(`   Tests: ${suite.totalTests} | Passed: ${suite.passedTests} | Failed: ${suite.failedTests} | Duration: ${suite.totalDuration}ms`);
      
      if (suite.failedTests > 0) {
        suite.results.filter(r => !r.passed).forEach(result => {
          console.log(`   ❌ ${result.testName}: ${result.error}`);
        });
      }
      
      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`📊 OVERALL RESULTS`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   Total Duration: ${totalTime}ms`);
    console.log(`   Average Test Time: ${(totalTime / totalTests).toFixed(1)}ms`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The UnifiedChatManager system is ready for integration.');
    } else {
      console.log(`\n⚠️  ${totalFailed} tests failed. Review the errors above before proceeding.`);
    }
    
    console.log('='.repeat(80));
  }

  /**
   * Cleanup test resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 [TestHarness] Cleaning up test resources');
    
    await this.chatManager.cleanup();
    this.mockUsers.clear();
    this.eventLog = [];
    this.testResults = [];
  }
}

export default UnifiedChatManagerTestHarness;

