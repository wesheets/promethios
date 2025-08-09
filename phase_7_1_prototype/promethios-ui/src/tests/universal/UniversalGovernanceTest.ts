/**
 * Universal Governance System Test Suite
 * 
 * Comprehensive testing of the universal governance system to validate all
 * components work correctly before any modern chat migration.
 */

import { getUniversalGovernance, UniversalServices } from '../../services/universal';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class UniversalGovernanceTest {
  private testResults: TestSuite[] = [];
  private universalGovernance = getUniversalGovernance();

  // ============================================================================
  // MAIN TEST RUNNER
  // ============================================================================

  async runAllTests(): Promise<{
    overallSuccess: boolean;
    totalSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    testResults: TestSuite[];
  }> {
    console.log('🧪 [Test] Starting comprehensive universal governance testing');
    
    const startTime = Date.now();
    
    try {
      // Run all test suites
      await this.testSharedServices();
      await this.testUniversalGovernanceAdapter();
      await this.testTrustManagement();
      await this.testPolicyEnforcement();
      await this.testAuditLogging();
      await this.testAutonomousCognition();
      await this.testChainOfThought();
      await this.testSynchronization();
      await this.testMessageProcessing();
      await this.testIntegration();

      const totalDuration = Date.now() - startTime;
      
      // Calculate overall results
      const totalTests = this.testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
      const passedTests = this.testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
      const failedTests = this.testResults.reduce((sum, suite) => sum + suite.failedTests, 0);
      
      const overallSuccess = failedTests === 0;
      
      console.log(`✅ [Test] Universal governance testing completed in ${totalDuration}ms`);
      console.log(`📊 [Test] Results: ${passedTests}/${totalTests} tests passed`);
      
      return {
        overallSuccess,
        totalSuites: this.testResults.length,
        totalTests,
        passedTests,
        failedTests,
        testResults: this.testResults
      };
    } catch (error) {
      console.error('❌ [Test] Universal governance testing failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // SHARED SERVICES TESTS
  // ============================================================================

  private async testSharedServices(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Shared Services',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('🔧 [Test] Testing shared services');

    // Test service instantiation
    await this.runTest(suite, 'Service Instantiation', async () => {
      const services = UniversalServices;
      
      if (!services.governance) throw new Error('Governance service not available');
      if (!services.trustManagement) throw new Error('Trust management service not available');
      if (!services.auditLogging) throw new Error('Audit logging service not available');
      if (!services.autonomousThinking) throw new Error('Autonomous thinking service not available');
      if (!services.emotionalVeritas) throw new Error('Emotional veritas service not available');
      if (!services.policyEnforcement) throw new Error('Policy enforcement service not available');
      if (!services.chainOfThought) throw new Error('Chain of thought service not available');
      if (!services.synchronization) throw new Error('Synchronization service not available');
      if (!services.messageProcessor) throw new Error('Message processor service not available');
      
      return { servicesAvailable: 9 };
    });

    // Test singleton pattern
    await this.runTest(suite, 'Singleton Pattern', async () => {
      const instance1 = UniversalServices.governance();
      const instance2 = UniversalServices.governance();
      
      if (instance1 !== instance2) {
        throw new Error('Singleton pattern not working - different instances returned');
      }
      
      return { singletonWorking: true };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // UNIVERSAL GOVERNANCE ADAPTER TESTS
  // ============================================================================

  private async testUniversalGovernanceAdapter(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Universal Governance Adapter',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('🌐 [Test] Testing universal governance adapter');

    // Test adapter initialization
    await this.runTest(suite, 'Adapter Initialization', async () => {
      if (!this.universalGovernance) {
        throw new Error('Universal governance adapter not initialized');
      }
      
      return { initialized: true };
    });

    // Test session management
    await this.runTest(suite, 'Session Management', async () => {
      const testAgentId = 'test-agent-001';
      const testUserId = 'test-user-001';
      
      // Start session
      const session = await this.universalGovernance.startSession(testAgentId, testUserId);
      
      if (!session.sessionId) throw new Error('Session ID not generated');
      if (session.agentId !== testAgentId) throw new Error('Agent ID mismatch');
      if (session.userId !== testUserId) throw new Error('User ID mismatch');
      
      // End session
      await this.universalGovernance.endSession(session.sessionId);
      
      return { 
        sessionCreated: true,
        sessionId: session.sessionId,
        sessionEnded: true
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // TRUST MANAGEMENT TESTS
  // ============================================================================

  private async testTrustManagement(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Trust Management',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('🤝 [Test] Testing trust management');

    const testAgentId = 'test-agent-trust-001';

    // Test trust score retrieval
    await this.runTest(suite, 'Trust Score Retrieval', async () => {
      const trustScore = await this.universalGovernance.getTrustScore(testAgentId);
      
      // Should return null for new agent or a valid trust score
      if (trustScore !== null) {
        if (typeof trustScore.currentScore !== 'number') {
          throw new Error('Trust score should be a number');
        }
        if (trustScore.currentScore < 0 || trustScore.currentScore > 1) {
          throw new Error('Trust score should be between 0 and 1');
        }
      }
      
      return { 
        trustScoreRetrieved: true,
        hasScore: trustScore !== null,
        score: trustScore?.currentScore
      };
    });

    // Test trust score update
    await this.runTest(suite, 'Trust Score Update', async () => {
      const trustEvent = {
        eventType: 'test_interaction',
        impact: 0.05,
        evidence: ['test_evidence'],
        context: 'test_context',
        timestamp: new Date()
      };
      
      const updatedTrustScore = await this.universalGovernance.updateTrustScore(testAgentId, trustEvent);
      
      if (!updatedTrustScore) {
        throw new Error('Trust score update failed');
      }
      
      if (typeof updatedTrustScore.currentScore !== 'number') {
        throw new Error('Updated trust score should be a number');
      }
      
      return {
        trustScoreUpdated: true,
        newScore: updatedTrustScore.currentScore,
        change: updatedTrustScore.currentScore - updatedTrustScore.previousScore
      };
    });

    // Test trust level calculation
    await this.runTest(suite, 'Trust Level Calculation', async () => {
      const trustLevel = await this.universalGovernance.calculateTrustLevel(testAgentId);
      
      const validLevels = ['unknown', 'critical', 'low', 'moderate', 'high', 'excellent'];
      if (!validLevels.includes(trustLevel)) {
        throw new Error(`Invalid trust level: ${trustLevel}`);
      }
      
      return {
        trustLevelCalculated: true,
        level: trustLevel
      };
    });

    // Test trust history
    await this.runTest(suite, 'Trust History', async () => {
      const trustHistory = await this.universalGovernance.getTrustHistory(testAgentId);
      
      if (!Array.isArray(trustHistory)) {
        throw new Error('Trust history should be an array');
      }
      
      return {
        trustHistoryRetrieved: true,
        historyLength: trustHistory.length
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // POLICY ENFORCEMENT TESTS
  // ============================================================================

  private async testPolicyEnforcement(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Policy Enforcement',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('🛡️ [Test] Testing policy enforcement');

    // Test policy retrieval
    await this.runTest(suite, 'Policy Retrieval', async () => {
      const policies = await this.universalGovernance.getAllPolicies();
      
      if (!Array.isArray(policies)) {
        throw new Error('Policies should be an array');
      }
      
      // Check policy structure
      if (policies.length > 0) {
        const policy = policies[0];
        if (!policy.policyId || !policy.name || !policy.description) {
          throw new Error('Policy missing required fields');
        }
      }
      
      return {
        policiesRetrieved: true,
        policyCount: policies.length
      };
    });

    // Test policy enforcement
    await this.runTest(suite, 'Policy Enforcement', async () => {
      const testAgentId = 'test-agent-policy-001';
      const testContent = 'This is a test message for policy enforcement';
      const testContext = {
        userId: 'test-user-001',
        sessionId: 'test-session-001',
        environment: 'universal'
      };
      
      const enforcement = await this.universalGovernance.enforcePolicy(testAgentId, testContent, testContext);
      
      if (typeof enforcement.allowed !== 'boolean') {
        throw new Error('Policy enforcement should return allowed boolean');
      }
      
      if (!Array.isArray(enforcement.violations)) {
        throw new Error('Policy enforcement should return violations array');
      }
      
      return {
        policyEnforced: true,
        allowed: enforcement.allowed,
        violations: enforcement.violations.length,
        action: enforcement.action
      };
    });

    // Test compliance metrics
    await this.runTest(suite, 'Compliance Metrics', async () => {
      const testAgentId = 'test-agent-compliance-001';
      const metrics = await this.universalGovernance.getComplianceMetrics(testAgentId);
      
      // Metrics can be null for new agents
      if (metrics !== null) {
        if (typeof metrics.overallComplianceRate !== 'number') {
          throw new Error('Compliance rate should be a number');
        }
      }
      
      return {
        complianceMetricsRetrieved: true,
        hasMetrics: metrics !== null,
        complianceRate: metrics?.overallComplianceRate
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // AUDIT LOGGING TESTS
  // ============================================================================

  private async testAuditLogging(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Audit Logging',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('📝 [Test] Testing audit logging');

    const testAgentId = 'test-agent-audit-001';

    // Test audit entry creation
    await this.runTest(suite, 'Audit Entry Creation', async () => {
      const testInteraction = {
        interaction_id: `test-interaction-${Date.now()}`,
        agent_id: testAgentId,
        user_id: 'test-user-001',
        session_id: 'test-session-001',
        timestamp: new Date(),
        user_message: 'Test message',
        agent_response: 'Test response',
        trust_score_before: 0.75,
        trust_score_after: 0.76,
        environment: 'universal'
      };
      
      const auditEntry = await this.universalGovernance.createAuditEntry(testInteraction);
      
      if (!auditEntry.interaction_id) {
        throw new Error('Audit entry should have interaction ID');
      }
      
      if (auditEntry.agent_id !== testAgentId) {
        throw new Error('Audit entry agent ID mismatch');
      }
      
      return {
        auditEntryCreated: true,
        interactionId: auditEntry.interaction_id,
        agentId: auditEntry.agent_id
      };
    });

    // Test audit history retrieval
    await this.runTest(suite, 'Audit History Retrieval', async () => {
      const auditHistory = await this.universalGovernance.getAuditHistory(testAgentId);
      
      if (!Array.isArray(auditHistory)) {
        throw new Error('Audit history should be an array');
      }
      
      return {
        auditHistoryRetrieved: true,
        historyLength: auditHistory.length
      };
    });

    // Test behavioral pattern analysis
    await this.runTest(suite, 'Behavioral Pattern Analysis', async () => {
      const patterns = await this.universalGovernance.analyzeBehavioralPatterns(testAgentId);
      
      // Patterns can be null for agents with insufficient data
      if (patterns !== null) {
        if (!patterns.patterns || !Array.isArray(patterns.patterns)) {
          throw new Error('Behavioral patterns should have patterns array');
        }
      }
      
      return {
        behavioralPatternsAnalyzed: true,
        hasPatterns: patterns !== null,
        patternCount: patterns?.patterns?.length || 0
      };
    });

    // Test learning insights generation
    await this.runTest(suite, 'Learning Insights Generation', async () => {
      const insights = await this.universalGovernance.generateLearningInsights(testAgentId);
      
      if (!Array.isArray(insights)) {
        throw new Error('Learning insights should be an array');
      }
      
      return {
        learningInsightsGenerated: true,
        insightCount: insights.length
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // AUTONOMOUS COGNITION TESTS
  // ============================================================================

  private async testAutonomousCognition(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Autonomous Cognition',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('🤖 [Test] Testing autonomous cognition');

    const testAgentId = 'test-agent-autonomy-001';

    // Test autonomy level retrieval
    await this.runTest(suite, 'Autonomy Level Retrieval', async () => {
      const autonomyLevel = await this.universalGovernance.getAutonomyLevel(testAgentId);
      
      const validLevels = ['minimal', 'basic', 'moderate', 'high', 'full'];
      if (!validLevels.includes(autonomyLevel)) {
        throw new Error(`Invalid autonomy level: ${autonomyLevel}`);
      }
      
      return {
        autonomyLevelRetrieved: true,
        level: autonomyLevel
      };
    });

    // Test autonomous thinking request
    await this.runTest(suite, 'Autonomous Thinking Request', async () => {
      const request = {
        type: 'thinking',
        description: 'Test autonomous thinking request',
        duration: 10000
      };
      
      const response = await this.universalGovernance.requestAutonomousThinking(testAgentId, request);
      
      if (typeof response.approved !== 'boolean') {
        throw new Error('Autonomous thinking response should have approved boolean');
      }
      
      if (typeof response.autoApproved !== 'boolean') {
        throw new Error('Autonomous thinking response should have autoApproved boolean');
      }
      
      return {
        autonomousThinkingRequested: true,
        approved: response.approved,
        autoApproved: response.autoApproved,
        riskLevel: response.riskLevel
      };
    });

    // Test autonomous activity monitoring
    await this.runTest(suite, 'Autonomous Activity Monitoring', async () => {
      const activity = await this.universalGovernance.monitorAutonomousActivity(testAgentId);
      
      // Activity can be null for agents with no autonomous activity
      if (activity !== null) {
        // Validate activity structure if present
        if (activity.activePermissions !== undefined && !Array.isArray(activity.activePermissions)) {
          throw new Error('Active permissions should be an array');
        }
      }
      
      return {
        autonomousActivityMonitored: true,
        hasActivity: activity !== null,
        activePermissions: activity?.activePermissions?.length || 0
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // CHAIN OF THOUGHT TESTS
  // ============================================================================

  private async testChainOfThought(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Chain of Thought',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('🧠 [Test] Testing chain of thought');

    const testAgentId = 'test-agent-cot-001';

    // Test self-awareness prompts generation
    await this.runTest(suite, 'Self-Awareness Prompts Generation', async () => {
      const prompts = await this.universalGovernance.generateSelfAwarenessPrompts(testAgentId);
      
      if (!Array.isArray(prompts)) {
        throw new Error('Self-awareness prompts should be an array');
      }
      
      // Check prompt structure
      if (prompts.length > 0) {
        const prompt = prompts[0];
        if (!prompt.type || !prompt.prompt) {
          throw new Error('Self-awareness prompt missing required fields');
        }
      }
      
      return {
        selfAwarenessPromptsGenerated: true,
        promptCount: prompts.length
      };
    });

    // Test governance context injection
    await this.runTest(suite, 'Governance Context Injection', async () => {
      const basePrompt = 'This is a test prompt';
      const enhancedPrompt = await this.universalGovernance.injectGovernanceContext(basePrompt, testAgentId);
      
      if (typeof enhancedPrompt !== 'string') {
        throw new Error('Enhanced prompt should be a string');
      }
      
      if (enhancedPrompt.length <= basePrompt.length) {
        throw new Error('Enhanced prompt should be longer than base prompt');
      }
      
      return {
        governanceContextInjected: true,
        originalLength: basePrompt.length,
        enhancedLength: enhancedPrompt.length,
        addedContext: enhancedPrompt.length - basePrompt.length
      };
    });

    // Test response enhancement
    await this.runTest(suite, 'Response Enhancement', async () => {
      const testResponse = 'This is a test response';
      const enhancedResponse = await this.universalGovernance.enhanceResponseWithGovernance(testResponse, testAgentId);
      
      if (!enhancedResponse.enhancedResponse) {
        throw new Error('Enhanced response should have enhancedResponse field');
      }
      
      if (!enhancedResponse.trustImpact) {
        throw new Error('Enhanced response should have trustImpact field');
      }
      
      if (!enhancedResponse.complianceVerification) {
        throw new Error('Enhanced response should have complianceVerification field');
      }
      
      return {
        responseEnhanced: true,
        trustImpact: enhancedResponse.trustImpact.expectedChange,
        compliance: enhancedResponse.complianceVerification.overallCompliance
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // SYNCHRONIZATION TESTS
  // ============================================================================

  private async testSynchronization(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Synchronization',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('🔄 [Test] Testing synchronization');

    // Test sync status retrieval
    await this.runTest(suite, 'Sync Status Retrieval', async () => {
      const syncStatus = await this.universalGovernance.getSyncStatus();
      
      if (!syncStatus) {
        throw new Error('Sync status should not be null');
      }
      
      if (typeof syncStatus.isHealthy !== 'boolean') {
        throw new Error('Sync status should have isHealthy boolean');
      }
      
      if (!Array.isArray(syncStatus.contexts)) {
        throw new Error('Sync status should have contexts array');
      }
      
      return {
        syncStatusRetrieved: true,
        isHealthy: syncStatus.isHealthy,
        contexts: syncStatus.contexts.length,
        pendingEvents: syncStatus.pendingEvents
      };
    });

    // Test feature parity check
    await this.runTest(suite, 'Feature Parity Check', async () => {
      const featureParity = await this.universalGovernance.ensureFeatureParity();
      
      if (!featureParity) {
        throw new Error('Feature parity should not be null');
      }
      
      if (typeof featureParity.overallParity !== 'boolean') {
        throw new Error('Feature parity should have overallParity boolean');
      }
      
      if (typeof featureParity.parityScore !== 'number') {
        throw new Error('Feature parity should have parityScore number');
      }
      
      return {
        featureParityChecked: true,
        overallParity: featureParity.overallParity,
        parityScore: featureParity.parityScore,
        missingFeatures: featureParity.missingFeatures.length
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // MESSAGE PROCESSING TESTS
  // ============================================================================

  private async testMessageProcessing(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Message Processing',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('💬 [Test] Testing message processing');

    const testAgentId = 'test-agent-message-001';

    // Test message processing
    await this.runTest(suite, 'Message Processing', async () => {
      const testMessage = 'This is a test message for processing';
      const context = {
        userId: 'test-user-001',
        sessionId: 'test-session-001'
      };
      
      const result = await this.universalGovernance.processMessage(testAgentId, testMessage, context);
      
      if (!result.governanceContext) {
        throw new Error('Message processing should return governance context');
      }
      
      if (!result.enhancedPrompt) {
        throw new Error('Message processing should return enhanced prompt');
      }
      
      if (!Array.isArray(result.selfAwarenessPrompts)) {
        throw new Error('Message processing should return self-awareness prompts array');
      }
      
      return {
        messageProcessed: true,
        promptLength: result.enhancedPrompt.length,
        selfAwarenessPrompts: result.selfAwarenessPrompts.length,
        policyCompliant: result.policyEnforcement.allowed
      };
    });

    // Test response processing
    await this.runTest(suite, 'Response Processing', async () => {
      const testResponse = 'This is a test response for processing';
      const context = {
        userId: 'test-user-001',
        sessionId: 'test-session-001',
        originalMessage: 'Test message',
        governanceContext: {
          trustScore: 0.75
        }
      };
      
      const result = await this.universalGovernance.processResponse(testAgentId, testResponse, context);
      
      if (!result.enhancedResponse) {
        throw new Error('Response processing should return enhanced response');
      }
      
      if (!result.auditEntry) {
        throw new Error('Response processing should return audit entry');
      }
      
      if (!result.trustUpdate) {
        throw new Error('Response processing should return trust update');
      }
      
      return {
        responseProcessed: true,
        trustImpact: result.enhancedResponse.trustImpact.expectedChange,
        auditEntryId: result.auditEntry.interaction_id,
        newTrustScore: result.trustUpdate.currentScore
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  private async testIntegration(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Integration',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('🔗 [Test] Testing integration');

    // Test end-to-end workflow
    await this.runTest(suite, 'End-to-End Workflow', async () => {
      const testAgentId = 'test-agent-e2e-001';
      const testUserId = 'test-user-e2e-001';
      const testMessage = 'This is an end-to-end test message';
      
      // 1. Start session
      const session = await this.universalGovernance.startSession(testAgentId, testUserId);
      
      // 2. Process message
      const messageResult = await this.universalGovernance.processMessage(testAgentId, testMessage, {
        userId: testUserId,
        sessionId: session.sessionId
      });
      
      // 3. Process response
      const responseResult = await this.universalGovernance.processResponse(testAgentId, 'Test response', {
        userId: testUserId,
        sessionId: session.sessionId,
        originalMessage: testMessage,
        governanceContext: messageResult.governanceContext
      });
      
      // 4. End session
      await this.universalGovernance.endSession(session.sessionId);
      
      return {
        endToEndWorkflowCompleted: true,
        sessionId: session.sessionId,
        messageProcessed: !!messageResult.enhancedPrompt,
        responseProcessed: !!responseResult.auditEntry,
        sessionEnded: true
      };
    });

    // Test service coordination
    await this.runTest(suite, 'Service Coordination', async () => {
      const testAgentId = 'test-agent-coordination-001';
      
      // Test that all services work together
      const trustScore = await this.universalGovernance.getTrustScore(testAgentId);
      const policies = await this.universalGovernance.getAllPolicies();
      const autonomyLevel = await this.universalGovernance.getAutonomyLevel(testAgentId);
      const syncStatus = await this.universalGovernance.getSyncStatus();
      
      return {
        serviceCoordinationTested: true,
        trustServiceWorking: trustScore !== undefined,
        policyServiceWorking: Array.isArray(policies),
        autonomyServiceWorking: typeof autonomyLevel === 'string',
        syncServiceWorking: syncStatus !== null
      };
    });

    this.testResults.push(suite);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async runTest(suite: TestSuite, testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`  🧪 [Test] Running: ${testName}`);
      
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      suite.results.push({
        testName,
        passed: true,
        details: result,
        duration
      });
      
      suite.passedTests++;
      suite.totalDuration += duration;
      
      console.log(`  ✅ [Test] Passed: ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      suite.results.push({
        testName,
        passed: false,
        error: error.message,
        duration
      });
      
      suite.failedTests++;
      suite.totalDuration += duration;
      
      console.log(`  ❌ [Test] Failed: ${testName} (${duration}ms) - ${error.message}`);
    }
    
    suite.totalTests++;
  }

  // ============================================================================
  // RESULT FORMATTING
  // ============================================================================

  formatResults(results: any): string {
    let report = '\n🧪 UNIVERSAL GOVERNANCE TEST REPORT\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `📊 OVERALL RESULTS:\n`;
    report += `  Total Test Suites: ${results.totalSuites}\n`;
    report += `  Total Tests: ${results.totalTests}\n`;
    report += `  Passed Tests: ${results.passedTests}\n`;
    report += `  Failed Tests: ${results.failedTests}\n`;
    report += `  Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%\n`;
    report += `  Overall Status: ${results.overallSuccess ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    for (const suite of results.testResults) {
      report += `📋 ${suite.suiteName.toUpperCase()}:\n`;
      report += `  Tests: ${suite.totalTests} | Passed: ${suite.passedTests} | Failed: ${suite.failedTests}\n`;
      report += `  Duration: ${suite.totalDuration}ms\n`;
      
      for (const test of suite.results) {
        const status = test.passed ? '✅' : '❌';
        report += `    ${status} ${test.testName} (${test.duration}ms)\n`;
        if (!test.passed && test.error) {
          report += `      Error: ${test.error}\n`;
        }
      }
      report += '\n';
    }
    
    return report;
  }
}

// Export test runner function
export async function runUniversalGovernanceTests(): Promise<any> {
  const testRunner = new UniversalGovernanceTest();
  return await testRunner.runAllTests();
}

