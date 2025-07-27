const masGovernanceService = require('../services/masGovernanceService');
const multiAgentAuditService = require('../services/multiAgentAuditService');
const cryptographicAuditService = require('../services/cryptographicAuditService');

/**
 * Multi-Agent System Integration Test Suite
 * 
 * Comprehensive tests for MAS governance integration with cryptographic audit system
 */
class MASIntegrationTestSuite {
  constructor() {
    this.testResults = [];
    this.testContexts = new Map();
    this.testAgents = new Map();
    this.testDecisions = new Map();
  }

  async runAllTests() {
    console.log('\n🤖 Starting MAS Integration Test Suite...\n');
    
    const startTime = Date.now();
    let passedTests = 0;
    let totalTests = 0;

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Test Categories
      const testCategories = [
        { name: 'MAS Governance Integration', tests: this.runGovernanceIntegrationTests.bind(this) },
        { name: 'Collective Decision Auditing', tests: this.runCollectiveDecisionTests.bind(this) },
        { name: 'Veritas Reflection Auditing', tests: this.runVeritasReflectionTests.bind(this) },
        { name: 'Trust Relationship Auditing', tests: this.runTrustRelationshipTests.bind(this) },
        { name: 'Compliance Reporting', tests: this.runComplianceReportingTests.bind(this) },
        { name: 'Cryptographic Verification', tests: this.runCryptographicVerificationTests.bind(this) },
        { name: 'UI Integration', tests: this.runUIIntegrationTests.bind(this) },
        { name: 'Performance and Scalability', tests: this.runPerformanceTests.bind(this) }
      ];

      // Run test categories
      for (const category of testCategories) {
        console.log(`\n📋 ${category.name} Tests:`);
        console.log('='.repeat(50));
        
        const categoryResults = await category.tests();
        const categoryPassed = categoryResults.filter(r => r.passed).length;
        const categoryTotal = categoryResults.length;
        
        passedTests += categoryPassed;
        totalTests += categoryTotal;
        
        console.log(`\n${category.name}: ${categoryPassed}/${categoryTotal} tests passed\n`);
      }

      // Generate test summary
      const duration = Date.now() - startTime;
      const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
      
      console.log('\n' + '='.repeat(60));
      console.log('🎯 MAS INTEGRATION TEST SUMMARY');
      console.log('='.repeat(60));
      console.log(`Total Tests: ${totalTests}`);
      console.log(`Passed: ${passedTests}`);
      console.log(`Failed: ${totalTests - passedTests}`);
      console.log(`Success Rate: ${successRate}%`);
      console.log(`Duration: ${duration}ms`);
      console.log('='.repeat(60));

      // Generate detailed report
      await this.generateTestReport(passedTests, totalTests, duration);

      return {
        success: passedTests === totalTests,
        passedTests,
        totalTests,
        successRate: parseFloat(successRate),
        duration
      };

    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      throw error;
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Create test MAS contexts
    const testContexts = [
      {
        contextId: 'test_mas_ctx_001',
        name: 'Financial Analysis Team Test',
        agentIds: ['test_agent_finance_1', 'test_agent_finance_2', 'test_agent_risk_1'],
        collaborationModel: 'consensus',
        governanceEnabled: true
      },
      {
        contextId: 'test_mas_ctx_002',
        name: 'Customer Support Swarm Test',
        agentIds: ['test_agent_support_1', 'test_agent_support_2', 'test_agent_support_3'],
        collaborationModel: 'leader-follower',
        governanceEnabled: true
      }
    ];

    for (const context of testContexts) {
      this.testContexts.set(context.contextId, context);
    }

    // Create test agents
    const testAgents = [
      { agentId: 'test_agent_finance_1', role: 'financial_analyst', trustScore: 85 },
      { agentId: 'test_agent_finance_2', role: 'financial_analyst', trustScore: 90 },
      { agentId: 'test_agent_risk_1', role: 'risk_assessor', trustScore: 88 },
      { agentId: 'test_agent_support_1', role: 'support_lead', trustScore: 92 },
      { agentId: 'test_agent_support_2', role: 'support_agent', trustScore: 85 },
      { agentId: 'test_agent_support_3', role: 'support_agent', trustScore: 87 }
    ];

    for (const agent of testAgents) {
      this.testAgents.set(agent.agentId, agent);
    }

    console.log(`✅ Test environment setup complete: ${testContexts.length} contexts, ${testAgents.length} agents`);
  }

  async runGovernanceIntegrationTests() {
    const tests = [];

    // Test 1: MAS Governance Service Integration
    tests.push(await this.runTest('MAS Governance Service Integration', async () => {
      // Verify service is properly initialized
      if (!masGovernanceService) {
        throw new Error('MAS Governance Service not initialized');
      }

      // Test basic service methods
      const testContext = this.testContexts.get('test_mas_ctx_001');
      const auditEvents = masGovernanceService.getAuditEvents(testContext.contextId);
      
      // Should return empty array for new context
      if (!Array.isArray(auditEvents)) {
        throw new Error('getAuditEvents should return an array');
      }

      return { success: true, message: 'MAS Governance Service integration verified' };
    }));

    // Test 2: Multi-Agent Audit Service Integration
    tests.push(await this.runTest('Multi-Agent Audit Service Integration', async () => {
      // Verify multi-agent audit service integration
      if (!multiAgentAuditService) {
        throw new Error('Multi-Agent Audit Service not initialized');
      }

      // Test collective behavior logging
      const testContext = this.testContexts.get('test_mas_ctx_001');
      const behaviorId = await multiAgentAuditService.logCollectiveBehavior(
        testContext.contextId,
        'coordination_pattern',
        {
          participatingAgents: testContext.agentIds,
          emergenceLevel: 'medium',
          coordinationSuccess: true
        }
      );

      if (!behaviorId || typeof behaviorId !== 'string') {
        throw new Error('Collective behavior logging failed');
      }

      return { success: true, message: 'Multi-Agent Audit Service integration verified', behaviorId };
    }));

    // Test 3: Cryptographic Audit Integration
    tests.push(await this.runTest('Cryptographic Audit Integration', async () => {
      // Verify cryptographic audit service integration
      if (!cryptographicAuditService) {
        throw new Error('Cryptographic Audit Service not initialized');
      }

      // Test cryptographic event logging
      const eventId = await cryptographicAuditService.logCryptographicEvent(
        'mas_integration_test',
        {
          contextId: 'test_mas_ctx_001',
          eventType: 'integration_test',
          testData: { integration: 'verified' }
        }
      );

      if (!eventId || typeof eventId !== 'string') {
        throw new Error('Cryptographic event logging failed');
      }

      return { success: true, message: 'Cryptographic Audit integration verified', eventId };
    }));

    return tests;
  }

  async runCollectiveDecisionTests() {
    const tests = [];

    // Test 1: Collective Decision Audit
    tests.push(await this.runTest('Collective Decision Audit', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_001');
      
      // Create mock collaborative decision
      const collaborativeDecision = {
        id: 'test_decision_001',
        contextId: testContext.contextId,
        participatingAgents: testContext.agentIds,
        decisionType: 'policy_change',
        content: 'Increase risk assessment threshold to 85%',
        timestamp: new Date().toISOString()
      };

      // Create mock governance result
      const governanceResult = {
        approved: true,
        trustImpact: 5,
        violations: [],
        recommendations: ['Monitor implementation closely']
      };

      // Audit the collective decision
      const auditId = await masGovernanceService.auditCollectiveDecision(
        collaborativeDecision,
        governanceResult
      );

      if (!auditId || typeof auditId !== 'string') {
        throw new Error('Collective decision audit failed');
      }

      // Verify audit was stored
      const auditData = masGovernanceService.getCollectiveDecisionAudit(collaborativeDecision.id);
      if (!auditData || auditData.auditId !== auditId) {
        throw new Error('Collective decision audit not properly stored');
      }

      // Store for later tests
      this.testDecisions.set(collaborativeDecision.id, { decision: collaborativeDecision, audit: auditData });

      return { success: true, message: 'Collective decision audit completed', auditId };
    }));

    // Test 2: Decision Cryptographic Verification
    tests.push(await this.runTest('Decision Cryptographic Verification', async () => {
      const testDecision = this.testDecisions.get('test_decision_001');
      if (!testDecision) {
        throw new Error('Test decision not found');
      }

      const auditData = testDecision.audit;
      
      // Verify cryptographic proof exists
      if (!auditData.cryptographicProof) {
        throw new Error('Cryptographic proof missing');
      }

      // Verify hash exists
      if (!auditData.hash) {
        throw new Error('Audit hash missing');
      }

      // Verify signature exists
      if (!auditData.signature) {
        throw new Error('Audit signature missing');
      }

      // Verify audit chain position
      if (typeof auditData.verification.auditChainPosition !== 'number') {
        throw new Error('Audit chain position invalid');
      }

      return { success: true, message: 'Decision cryptographic verification passed' };
    }));

    // Test 3: Decision Compliance Scoring
    tests.push(await this.runTest('Decision Compliance Scoring', async () => {
      const testDecision = this.testDecisions.get('test_decision_001');
      if (!testDecision) {
        throw new Error('Test decision not found');
      }

      const auditData = testDecision.audit;
      
      // Verify compliance score calculation
      if (typeof auditData.governanceResult.complianceScore !== 'number') {
        throw new Error('Compliance score not calculated');
      }

      if (auditData.governanceResult.complianceScore < 0 || auditData.governanceResult.complianceScore > 100) {
        throw new Error('Compliance score out of valid range');
      }

      return { success: true, message: 'Decision compliance scoring verified', score: auditData.governanceResult.complianceScore };
    }));

    return tests;
  }

  async runVeritasReflectionTests() {
    const tests = [];

    // Test 1: Veritas Reflection Audit
    tests.push(await this.runTest('Veritas Reflection Audit', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_002');
      
      // Create mock Veritas reflection
      const veritasReflection = {
        contextId: testContext.contextId,
        participatingAgents: testContext.agentIds,
        reflectionQuestions: [
          'How effective was our communication?',
          'Did we include all relevant perspectives?',
          'How can we improve our collaboration?'
        ],
        scores: {
          communicationEffectiveness: 85,
          inclusivity: 90,
          collaborativeDecisionMaking: 88,
          governanceCompliance: 92,
          improvementPotential: 75
        },
        overallCollaborationScore: 86,
        recommendations: [
          'Improve response time coordination',
          'Enhance cross-agent knowledge sharing'
        ],
        timestamp: new Date().toISOString()
      };

      // Audit the Veritas reflection
      const auditId = await masGovernanceService.auditVeritasReflection(veritasReflection);

      if (!auditId || typeof auditId !== 'string') {
        throw new Error('Veritas reflection audit failed');
      }

      return { success: true, message: 'Veritas reflection audit completed', auditId };
    }));

    // Test 2: Veritas Score Verification
    tests.push(await this.runTest('Veritas Score Verification', async () => {
      // Test score calculation integrity
      const testScores = {
        communicationEffectiveness: 85,
        inclusivity: 90,
        collaborativeDecisionMaking: 88,
        governanceCompliance: 92,
        improvementPotential: 75
      };

      const scoreIntegrity = masGovernanceService.verifyScoreCalculations(testScores);
      
      if (!scoreIntegrity) {
        throw new Error('Score verification failed');
      }

      return { success: true, message: 'Veritas score verification passed' };
    }));

    // Test 3: Veritas Compliance Assessment
    tests.push(await this.runTest('Veritas Compliance Assessment', async () => {
      const governanceCompliance = 92;
      const complianceGrade = masGovernanceService.calculateComplianceGrade(governanceCompliance);
      
      if (!complianceGrade || typeof complianceGrade !== 'string') {
        throw new Error('Compliance grade calculation failed');
      }

      if (complianceGrade !== 'A') {
        throw new Error(`Expected grade A for 92% compliance, got ${complianceGrade}`);
      }

      return { success: true, message: 'Veritas compliance assessment verified', grade: complianceGrade };
    }));

    return tests;
  }

  async runTrustRelationshipTests() {
    const tests = [];

    // Test 1: Trust Relationship Change Audit
    tests.push(await this.runTest('Trust Relationship Change Audit', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_001');
      const sourceAgent = 'test_agent_finance_1';
      const targetAgent = 'test_agent_finance_2';
      
      const trustChange = {
        previousValue: 85,
        newValue: 90,
        delta: 5,
        changeType: 'improvement'
      };

      const reason = 'Successful collaboration on risk assessment';

      // Audit trust relationship change
      const auditId = await masGovernanceService.auditTrustRelationshipChange(
        testContext.contextId,
        sourceAgent,
        targetAgent,
        trustChange,
        reason
      );

      if (!auditId || typeof auditId !== 'string') {
        throw new Error('Trust relationship audit failed');
      }

      return { success: true, message: 'Trust relationship change audit completed', auditId };
    }));

    // Test 2: Trust Calculation Verification
    tests.push(await this.runTest('Trust Calculation Verification', async () => {
      const trustChange = {
        previousValue: 85,
        newValue: 90,
        delta: 5,
        changeType: 'improvement'
      };

      const calculationValid = masGovernanceService.verifyTrustCalculation(trustChange);
      
      if (!calculationValid) {
        throw new Error('Trust calculation verification failed');
      }

      return { success: true, message: 'Trust calculation verification passed' };
    }));

    // Test 3: Trust Impact Assessment
    tests.push(await this.runTest('Trust Impact Assessment', async () => {
      const trustChange = {
        previousValue: 85,
        newValue: 90,
        delta: 5,
        changeType: 'improvement'
      };

      const impact = masGovernanceService.assessTrustImpact(trustChange);
      
      if (!impact || typeof impact !== 'string') {
        throw new Error('Trust impact assessment failed');
      }

      if (impact !== 'low') {
        throw new Error(`Expected low impact for delta 5, got ${impact}`);
      }

      return { success: true, message: 'Trust impact assessment verified', impact };
    }));

    return tests;
  }

  async runComplianceReportingTests() {
    const tests = [];

    // Test 1: Governance Compliance Report Generation
    tests.push(await this.runTest('Governance Compliance Report Generation', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_001');
      
      // Generate compliance report
      const report = await masGovernanceService.generateGovernanceComplianceReport(
        testContext.contextId,
        'balanced'
      );

      if (!report || !report.reportId) {
        throw new Error('Compliance report generation failed');
      }

      // Verify report structure
      if (!report.complianceMetrics || !report.violations || !report.trends || !report.verification) {
        throw new Error('Compliance report missing required sections');
      }

      // Verify report integrity
      if (!report.reportHash || !report.reportSignature) {
        throw new Error('Compliance report missing cryptographic integrity');
      }

      return { success: true, message: 'Governance compliance report generated', reportId: report.reportId };
    }));

    // Test 2: Compliance Metrics Calculation
    tests.push(await this.runTest('Compliance Metrics Calculation', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_001');
      const auditEvents = masGovernanceService.getAuditEvents(testContext.contextId);
      
      // Test overall compliance calculation
      const overallCompliance = masGovernanceService.calculateOverallCompliance(auditEvents, 'balanced');
      
      if (typeof overallCompliance !== 'number' || overallCompliance < 0 || overallCompliance > 100) {
        throw new Error('Overall compliance calculation invalid');
      }

      return { success: true, message: 'Compliance metrics calculation verified', compliance: overallCompliance };
    }));

    // Test 3: Audit Chain Integrity Verification
    tests.push(await this.runTest('Audit Chain Integrity Verification', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_001');
      
      // Verify audit chain integrity
      const chainIntegrity = masGovernanceService.verifyAuditChainIntegrity(testContext.contextId);
      
      if (typeof chainIntegrity !== 'boolean') {
        throw new Error('Audit chain integrity verification failed');
      }

      return { success: true, message: 'Audit chain integrity verified', integrity: chainIntegrity };
    }));

    return tests;
  }

  async runCryptographicVerificationTests() {
    const tests = [];

    // Test 1: Mathematical Proof Generation
    tests.push(await this.runTest('Mathematical Proof Generation', async () => {
      const testEvent = {
        auditId: 'test_audit_001',
        eventType: 'test_event',
        verification: { auditChainPosition: 0 }
      };

      const proof = await masGovernanceService.generateMathematicalProof(testEvent);
      
      if (!proof || !proof.proofType || !proof.algorithm || !proof.proofData) {
        throw new Error('Mathematical proof generation failed');
      }

      if (proof.proofData.mathematicalCertainty !== '99.999%') {
        throw new Error('Mathematical certainty not at expected level');
      }

      return { success: true, message: 'Mathematical proof generation verified', algorithm: proof.algorithm };
    }));

    // Test 2: Cryptographic Hash Generation
    tests.push(await this.runTest('Cryptographic Hash Generation', async () => {
      const testContent = { test: 'data', timestamp: new Date().toISOString() };
      const hash = masGovernanceService.generateContentHash(testContent);
      
      if (!hash || typeof hash !== 'string' || hash.length !== 64) {
        throw new Error('Cryptographic hash generation failed');
      }

      // Verify hash consistency
      const hash2 = masGovernanceService.generateContentHash(testContent);
      if (hash !== hash2) {
        throw new Error('Hash generation not consistent');
      }

      return { success: true, message: 'Cryptographic hash generation verified', hashLength: hash.length };
    }));

    // Test 3: Digital Signature Generation
    tests.push(await this.runTest('Digital Signature Generation', async () => {
      const testData = JSON.stringify({ test: 'signature_data' });
      const identifier = 'test_sig_001';
      
      const signature = masGovernanceService.generateSignature(testData, identifier);
      
      if (!signature || typeof signature !== 'string' || !signature.startsWith('sig_')) {
        throw new Error('Digital signature generation failed');
      }

      return { success: true, message: 'Digital signature generation verified', signaturePrefix: signature.substring(0, 4) };
    }));

    return tests;
  }

  async runUIIntegrationTests() {
    const tests = [];

    // Test 1: MAS Context Data Structure
    tests.push(await this.runTest('MAS Context Data Structure', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_001');
      
      // Verify context structure matches UI expectations
      const requiredFields = ['contextId', 'name', 'agentIds', 'collaborationModel', 'governanceEnabled'];
      
      for (const field of requiredFields) {
        if (!(field in testContext)) {
          throw new Error(`Required field ${field} missing from context`);
        }
      }

      return { success: true, message: 'MAS context data structure verified' };
    }));

    // Test 2: Audit Event Data Structure
    tests.push(await this.runTest('Audit Event Data Structure', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_001');
      const auditEvents = masGovernanceService.getAuditEvents(testContext.contextId);
      
      if (auditEvents.length > 0) {
        const event = auditEvents[0];
        const requiredFields = ['auditId', 'eventType', 'contextId', 'timestamp', 'verification'];
        
        for (const field of requiredFields) {
          if (!(field in event)) {
            throw new Error(`Required field ${field} missing from audit event`);
          }
        }
      }

      return { success: true, message: 'Audit event data structure verified' };
    }));

    // Test 3: Compliance Report Data Structure
    tests.push(await this.runTest('Compliance Report Data Structure', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_001');
      const report = await masGovernanceService.generateGovernanceComplianceReport(testContext.contextId);
      
      const requiredSections = ['reportId', 'contextId', 'complianceMetrics', 'violations', 'trends', 'verification'];
      
      for (const section of requiredSections) {
        if (!(section in report)) {
          throw new Error(`Required section ${section} missing from compliance report`);
        }
      }

      return { success: true, message: 'Compliance report data structure verified' };
    }));

    return tests;
  }

  async runPerformanceTests() {
    const tests = [];

    // Test 1: Audit Event Processing Performance
    tests.push(await this.runTest('Audit Event Processing Performance', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_002');
      const startTime = Date.now();
      
      // Process multiple audit events
      const eventPromises = [];
      for (let i = 0; i < 10; i++) {
        const collaborativeDecision = {
          id: `perf_test_decision_${i}`,
          contextId: testContext.contextId,
          participatingAgents: testContext.agentIds,
          decisionType: 'performance_test',
          content: `Performance test decision ${i}`,
          timestamp: new Date().toISOString()
        };

        const governanceResult = {
          approved: true,
          trustImpact: 1,
          violations: [],
          recommendations: []
        };

        eventPromises.push(
          masGovernanceService.auditCollectiveDecision(collaborativeDecision, governanceResult)
        );
      }

      await Promise.all(eventPromises);
      const duration = Date.now() - startTime;
      
      // Performance threshold: should process 10 events in under 5 seconds
      if (duration > 5000) {
        throw new Error(`Performance test failed: ${duration}ms > 5000ms threshold`);
      }

      return { success: true, message: 'Audit event processing performance verified', duration: `${duration}ms` };
    }));

    // Test 2: Compliance Report Generation Performance
    tests.push(await this.runTest('Compliance Report Generation Performance', async () => {
      const testContext = this.testContexts.get('test_mas_ctx_002');
      const startTime = Date.now();
      
      // Generate compliance report
      await masGovernanceService.generateGovernanceComplianceReport(testContext.contextId);
      const duration = Date.now() - startTime;
      
      // Performance threshold: should generate report in under 2 seconds
      if (duration > 2000) {
        throw new Error(`Performance test failed: ${duration}ms > 2000ms threshold`);
      }

      return { success: true, message: 'Compliance report generation performance verified', duration: `${duration}ms` };
    }));

    // Test 3: Cryptographic Operations Performance
    tests.push(await this.runTest('Cryptographic Operations Performance', async () => {
      const startTime = Date.now();
      
      // Perform multiple cryptographic operations
      for (let i = 0; i < 100; i++) {
        const testData = { iteration: i, timestamp: new Date().toISOString() };
        masGovernanceService.generateContentHash(testData);
        masGovernanceService.generateSignature(JSON.stringify(testData), `test_${i}`);
      }
      
      const duration = Date.now() - startTime;
      
      // Performance threshold: should complete 100 operations in under 1 second
      if (duration > 1000) {
        throw new Error(`Performance test failed: ${duration}ms > 1000ms threshold`);
      }

      return { success: true, message: 'Cryptographic operations performance verified', duration: `${duration}ms` };
    }));

    return tests;
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`  🧪 ${testName}...`);
      const result = await testFunction();
      console.log(`  ✅ ${testName} - PASSED`);
      if (result.message) {
        console.log(`     ${result.message}`);
      }
      
      this.testResults.push({
        name: testName,
        passed: true,
        result: result,
        error: null
      });
      
      return { name: testName, passed: true, result };
    } catch (error) {
      console.log(`  ❌ ${testName} - FAILED`);
      console.log(`     Error: ${error.message}`);
      
      this.testResults.push({
        name: testName,
        passed: false,
        result: null,
        error: error.message
      });
      
      return { name: testName, passed: false, error: error.message };
    }
  }

  async generateTestReport(passedTests, totalTests, duration) {
    const report = {
      testSuite: 'MAS Integration Test Suite',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0,
        duration: `${duration}ms`
      },
      testResults: this.testResults,
      environment: {
        testContexts: Array.from(this.testContexts.keys()),
        testAgents: Array.from(this.testAgents.keys()),
        testDecisions: Array.from(this.testDecisions.keys())
      },
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = path.join(__dirname, '../../test-results');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, 'mas-integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Detailed test report saved to: ${reportPath}`);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => !r.passed);
    
    if (failedTests.length === 0) {
      recommendations.push('All tests passed! MAS integration is ready for production.');
    } else {
      recommendations.push(`${failedTests.length} tests failed. Review and fix issues before deployment.`);
      
      // Specific recommendations based on failed test categories
      const failedCategories = new Set();
      failedTests.forEach(test => {
        if (test.name.includes('Cryptographic')) {
          failedCategories.add('cryptographic');
        }
        if (test.name.includes('Performance')) {
          failedCategories.add('performance');
        }
        if (test.name.includes('Compliance')) {
          failedCategories.add('compliance');
        }
      });
      
      if (failedCategories.has('cryptographic')) {
        recommendations.push('Review cryptographic implementation for security and correctness.');
      }
      if (failedCategories.has('performance')) {
        recommendations.push('Optimize performance for production workloads.');
      }
      if (failedCategories.has('compliance')) {
        recommendations.push('Ensure compliance calculations meet regulatory requirements.');
      }
    }
    
    return recommendations;
  }
}

// Export for use in other test files
module.exports = MASIntegrationTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new MASIntegrationTestSuite();
  testSuite.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

