/**
 * End-to-End Deployment Workflow Test
 * Tests the complete pipeline from deployment to monitoring
 */

const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  apiBaseUrl: 'http://localhost:5004',
  userId: 'test_user_123',
  agentId: 'test_agent_456',
  apiKey: 'promethios_test_user_123_test_agent_456_1672531200'
};

// Test data generators
function generateGovernanceMetrics() {
  return {
    trust_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
    compliance_rate: Math.random() * 0.2 + 0.8, // 0.8-1.0
    violation_count: Math.floor(Math.random() * 3), // 0-2
    policy_violations: [],
    timestamp: new Date().toISOString(),
    metadata: {
      activePolicies: 3,
      totalViolations: Math.floor(Math.random() * 10),
      engineEnabled: true
    }
  };
}

function generatePerformanceMetrics() {
  return {
    response_time: Math.random() * 200 + 100, // 100-300ms
    throughput: Math.random() * 50 + 10, // 10-60 req/sec
    error_rate: Math.random() * 0.1, // 0-10%
    uptime: Math.random() * 86400 + 3600, // 1-24 hours
    timestamp: new Date().toISOString(),
    metadata: {
      totalRequests: Math.floor(Math.random() * 1000) + 100,
      totalErrors: Math.floor(Math.random() * 50),
      uptime: Math.random() * 86400 + 3600 // 1-24 hours
    }
  };
}

function generateSystemMetrics() {
  return {
    cpu_usage: Math.random() * 40 + 20, // 20-60%
    memory_usage: Math.random() * 50 + 30, // 30-80%
    disk_usage: Math.random() * 30 + 40, // 40-70%
    network_io: Math.random() * 1000000, // Random bytes
    timestamp: new Date().toISOString(),
    metadata: {
      totalMemory: 8589934592, // 8GB
      usedMemory: Math.floor(Math.random() * 4000000000) + 2000000000,
      platform: 'linux',
      nodeVersion: 'v18.17.0'
    }
  };
}

function generateBusinessMetrics() {
  return {
    request_count: Math.floor(Math.random() * 100) + 20,
    user_interactions: Math.floor(Math.random() * 100) + 20,
    success_rate: Math.random() * 20 + 80, // 80-100%
    revenue: Math.random() * 1000 + 100,
    timestamp: new Date().toISOString(),
    metadata: {
      satisfactionRatings: Math.floor(Math.random() * 50) + 10,
      completionRate: Math.random() * 20 + 80, // 80-100%
      avgSatisfaction: Math.random() * 2 + 3
    }
  };
}

function generateViolation() {
  const severities = ['low', 'medium', 'high', 'critical'];
  const policies = [
    { id: 'no-personal-info', name: 'No Personal Information' },
    { id: 'no-harmful-content', name: 'No Harmful Content' },
    { id: 'response-length-limit', name: 'Response Length Limit' }
  ];
  
  const policy = policies[Math.floor(Math.random() * policies.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  
  return {
    id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'policy_violation',
    policy_id: policy.id,
    policy_name: policy.name,
    severity: severity,
    description: `Policy "${policy.name}" violated - ${severity} severity`,
    context: {
      input: 'Test user input',
      response: 'Test agent response',
      rule: policy.id,
      sessionId: 'test_session_123'
    },
    remediation_suggested: `Address ${severity} violation in ${policy.name}`,
    timestamp: new Date().toISOString(),
    resolved: false,
    metadata: {
      detectionMethod: 'automated',
      confidence: Math.random() * 0.3 + 0.7
    }
  };
}

function generateLog(level = 'info') {
  const categories = ['governance', 'performance', 'system', 'business', 'security'];
  const messages = {
    governance: 'Policy evaluation completed successfully',
    performance: 'Response time within acceptable limits',
    system: 'System health check passed',
    business: 'User interaction recorded',
    security: 'Security scan completed'
  };
  
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    level: level,
    message: messages[category],
    category: category,
    source: 'test-agent',
    timestamp: new Date().toISOString(),
    metadata: {
      testRun: true,
      sessionId: 'test_session_123',
      requestId: `req_${Date.now()}`
    }
  };
}

function generateHeartbeat() {
  const statuses = ['healthy', 'degraded'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    status: status,
    version: '1.0.0',
    uptime: Math.random() * 86400 + 3600, // 1-24 hours
    lastActivity: new Date().toISOString(),
    systemInfo: {
      platform: 'linux',
      nodeVersion: 'v18.17.0',
      memory: {
        used: Math.floor(Math.random() * 2000000000) + 1000000000,
        total: 4294967296 // 4GB
      },
      cpu: {
        usage: Math.random() * 50 + 20, // 20-70%
        cores: 4
      }
    },
    governanceStatus: {
      enabled: true,
      policiesLoaded: 3,
      lastPolicyUpdate: new Date().toISOString(),
      trustScore: Math.random() * 0.3 + 0.7 // 0.7-1.0
    },
    timestamp: new Date().toISOString(),
    metadata: {
      testAgent: true,
      environment: 'test'
    }
  };
}

// API client
class TestAPIClient {
  constructor(config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 10000,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendData(endpoint, data) {
    try {
      const payload = {
        agentId: this.config.agentId,
        userId: this.config.userId,
        timestamp: new Date().toISOString(),
        ...data
      };

      const response = await this.client.post(endpoint, payload);
      return { success: true, status: response.status, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        status: error.response?.status, 
        error: error.message,
        details: error.response?.data 
      };
    }
  }

  async sendHeartbeat() {
    return this.sendData('/api/agents/heartbeat', generateHeartbeat());
  }

  async sendMetrics(type) {
    let payload;
    switch (type) {
      case 'governance':
        payload = {
          governance_metrics: generateGovernanceMetrics()
        };
        break;
      case 'performance':
        payload = {
          performance_metrics: generatePerformanceMetrics()
        };
        break;
      case 'system':
        payload = {
          system_metrics: generateSystemMetrics()
        };
        break;
      case 'business':
        payload = {
          business_metrics: generateBusinessMetrics()
        };
        break;
      default:
        throw new Error(`Unknown metrics type: ${type}`);
    }
    return this.sendData('/api/agents/metrics', payload);
  }

  async sendViolation() {
    return this.sendData('/api/agents/violations', generateViolation());
  }

  async sendLog(level = 'info') {
    return this.sendData('/api/agents/logs', generateLog(level));
  }

  async checkHealth() {
    try {
      const response = await this.client.get('/api/health');
      return { success: true, status: response.status, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Test runner
async function runEndToEndTest() {
  console.log('🚀 Starting End-to-End Deployment Workflow Test...\n');
  
  const client = new TestAPIClient(TEST_CONFIG);
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: API Health Check
  console.log('📡 Testing API Health...');
  const healthResult = await client.checkHealth();
  if (healthResult.success) {
    console.log('✅ API Health Check: PASSED');
    results.passed++;
  } else {
    console.log('❌ API Health Check: FAILED -', healthResult.error);
    results.failed++;
  }
  results.tests.push({ name: 'API Health Check', ...healthResult });

  // Test 2: Heartbeat
  console.log('\n💓 Testing Heartbeat...');
  const heartbeatResult = await client.sendHeartbeat();
  if (heartbeatResult.success) {
    console.log('✅ Heartbeat: PASSED');
    results.passed++;
  } else {
    console.log('❌ Heartbeat: FAILED -', heartbeatResult.error);
    results.failed++;
  }
  results.tests.push({ name: 'Heartbeat', ...heartbeatResult });

  // Test 3: Governance Metrics
  console.log('\n🛡️ Testing Governance Metrics...');
  const govMetricsResult = await client.sendMetrics('governance');
  if (govMetricsResult.success) {
    console.log('✅ Governance Metrics: PASSED');
    results.passed++;
  } else {
    console.log('❌ Governance Metrics: FAILED -', govMetricsResult.error);
    results.failed++;
  }
  results.tests.push({ name: 'Governance Metrics', ...govMetricsResult });

  // Test 4: Performance Metrics
  console.log('\n⚡ Testing Performance Metrics...');
  const perfMetricsResult = await client.sendMetrics('performance');
  if (perfMetricsResult.success) {
    console.log('✅ Performance Metrics: PASSED');
    results.passed++;
  } else {
    console.log('❌ Performance Metrics: FAILED -', perfMetricsResult.error);
    results.failed++;
  }
  results.tests.push({ name: 'Performance Metrics', ...perfMetricsResult });

  // Test 5: System Metrics
  console.log('\n🖥️ Testing System Metrics...');
  const sysMetricsResult = await client.sendMetrics('system');
  if (sysMetricsResult.success) {
    console.log('✅ System Metrics: PASSED');
    results.passed++;
  } else {
    console.log('❌ System Metrics: FAILED -', sysMetricsResult.error);
    results.failed++;
  }
  results.tests.push({ name: 'System Metrics', ...sysMetricsResult });

  // Test 6: Business Metrics
  console.log('\n💼 Testing Business Metrics...');
  const bizMetricsResult = await client.sendMetrics('business');
  if (bizMetricsResult.success) {
    console.log('✅ Business Metrics: PASSED');
    results.passed++;
  } else {
    console.log('❌ Business Metrics: FAILED -', bizMetricsResult.error);
    results.failed++;
  }
  results.tests.push({ name: 'Business Metrics', ...bizMetricsResult });

  // Test 7: Violation Reporting
  console.log('\n⚠️ Testing Violation Reporting...');
  const violationResult = await client.sendViolation();
  if (violationResult.success) {
    console.log('✅ Violation Reporting: PASSED');
    results.passed++;
  } else {
    console.log('❌ Violation Reporting: FAILED -', violationResult.error);
    results.failed++;
  }
  results.tests.push({ name: 'Violation Reporting', ...violationResult });

  // Test 8: Log Reporting
  console.log('\n📝 Testing Log Reporting...');
  const logResult = await client.sendLog('info');
  if (logResult.success) {
    console.log('✅ Log Reporting: PASSED');
    results.passed++;
  } else {
    console.log('❌ Log Reporting: FAILED -', logResult.error);
    results.failed++;
  }
  results.tests.push({ name: 'Log Reporting', ...logResult });

  // Test 9: Multiple Data Points (Stress Test)
  console.log('\n🔄 Testing Multiple Data Points...');
  const multiTestPromises = [
    client.sendMetrics('governance'),
    client.sendMetrics('performance'),
    client.sendViolation(),
    client.sendLog('warn'),
    client.sendHeartbeat()
  ];
  
  try {
    const multiResults = await Promise.all(multiTestPromises);
    const allSuccessful = multiResults.every(result => result.success);
    
    if (allSuccessful) {
      console.log('✅ Multiple Data Points: PASSED');
      results.passed++;
    } else {
      console.log('❌ Multiple Data Points: FAILED - Some requests failed');
      results.failed++;
    }
    results.tests.push({ name: 'Multiple Data Points', success: allSuccessful, results: multiResults });
  } catch (error) {
    console.log('❌ Multiple Data Points: FAILED -', error.message);
    results.failed++;
    results.tests.push({ name: 'Multiple Data Points', success: false, error: error.message });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! End-to-end deployment workflow is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the API backend and configuration.');
  }

  return results;
}

// Run the test
if (require.main === module) {
  runEndToEndTest().catch(console.error);
}

module.exports = { runEndToEndTest, TestAPIClient };

