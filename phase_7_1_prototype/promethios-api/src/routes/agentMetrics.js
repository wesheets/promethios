/**
 * Agent Metrics API Routes
 * Provides analytics and metrics data for Trust Metrics Overview page
 */

const express = require('express');
const router = express.Router();

// Mock data store for agent metrics (in production, this would be a database)
const agentMetrics = new Map();
const violations = new Map();

/**
 * Get user analytics data
 * GET /api/agent-metrics/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    console.log('📊 Agent analytics request received');
    const { agent_id, period, include_trends, include_predictions } = req.query;
    
    // Mock analytics data based on governance overview data
    const analytics = {
      agent_metrics: {
        total_agents: 18,
        active_agents: 15,
        deployed_agents: 12,
        inactive_agents: 3
      },
      trust_metrics: {
        average_trust_score: 0.85,
        total_evaluations: 156,
        trust_distribution: {
          high: 12,  // agents with trust score > 0.8
          medium: 5, // agents with trust score 0.6-0.8
          low: 1     // agents with trust score < 0.6
        },
        trust_trend: include_trends ? generateTrustTrend() : null
      },
      violation_metrics: {
        total_violations: 3,
        agents_with_violations: 2,
        resolved_violations: 1,
        pending_violations: 2,
        violation_types: {
          policy: 2,
          compliance: 1,
          security: 0
        }
      },
      compliance_metrics: {
        compliance_rate: 0.94,
        policy_adherence: 0.96,
        audit_score: 0.92,
        governance_score: 0.88
      },
      performance_metrics: {
        average_response_time: 245,
        success_rate: 0.98,
        availability: 0.99,
        error_rate: 0.02
      }
    };

    // Filter by agent_id if specified
    if (agent_id) {
      analytics.filtered_agent_id = agent_id;
      analytics.agent_metrics.total_agents = 1;
      analytics.agent_metrics.active_agents = 1;
    }

    res.json(analytics);
  } catch (error) {
    console.error('❌ Error fetching agent analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent analytics'
    });
  }
});

/**
 * Get user's agents list
 * GET /api/agent-metrics/agents
 */
router.get('/agents', async (req, res) => {
  try {
    console.log('🤖 Agent list request received');
    
    // Mock agent data matching governance overview
    const agents = [
      { agent_id: 'api-key-test-agent', agent_name: 'API Key Test Agent', status: 'active' },
      { agent_id: 'auth-fix-test-agent', agent_name: 'Auth Fix Test Agent', status: 'active' },
      { agent_id: 'backend-test-agent', agent_name: 'Backend Test Agent', status: 'active' },
      { agent_id: 'claude-assistant', agent_name: 'Claude Assistant', status: 'active' },
      { agent_id: 'claude-assistant-test', agent_name: 'Claude Assistant Test', status: 'active' },
      { agent_id: 'claude-assistant-test-2', agent_name: 'Claude Assistant Test 2', status: 'active' },
      { agent_id: 'credentials-test-agent', agent_name: 'Credentials Test Agent', status: 'inactive' },
      { agent_id: 'final-test-agent', agent_name: 'Final Test Agent', status: 'active' },
      { agent_id: 'frontend-test-agent', agent_name: 'Frontend Test Agent', status: 'active' },
      { agent_id: 'multi-agent-system', agent_name: 'Multi-Agent System', status: 'active' },
      { agent_id: 'production-agent', agent_name: 'Production Agent', status: 'active' },
      { agent_id: 'test-agent', agent_name: 'Test Agent', status: 'inactive' }
    ];

    res.json(agents);
  } catch (error) {
    console.error('❌ Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents'
    });
  }
});

/**
 * Get violations with filtering
 * GET /api/agent-metrics/violations
 */
router.get('/violations', async (req, res) => {
  try {
    console.log('⚠️ Violations request received');
    const { status, agent_id, limit = 50 } = req.query;
    
    // Mock violations data
    const violationsData = [
      {
        id: 'violation_001',
        agent_id: 'claude-assistant',
        type: 'policy',
        severity: 'medium',
        status: 'pending',
        description: 'Agent exceeded response time threshold',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        resolved_at: null
      },
      {
        id: 'violation_002',
        agent_id: 'backend-test-agent',
        type: 'compliance',
        severity: 'low',
        status: 'resolved',
        description: 'Minor compliance deviation detected',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        resolved_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'violation_003',
        agent_id: 'claude-assistant',
        type: 'policy',
        severity: 'high',
        status: 'pending',
        description: 'Unauthorized data access attempt',
        created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        resolved_at: null
      }
    ];

    // Apply filters
    let filteredViolations = violationsData;
    if (status) {
      filteredViolations = filteredViolations.filter(v => v.status === status);
    }
    if (agent_id) {
      filteredViolations = filteredViolations.filter(v => v.agent_id === agent_id);
    }

    // Apply limit
    filteredViolations = filteredViolations.slice(0, parseInt(limit));

    res.json({
      violations: filteredViolations,
      total: filteredViolations.length,
      filters: { status, agent_id, limit }
    });
  } catch (error) {
    console.error('❌ Error fetching violations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch violations'
    });
  }
});

/**
 * Resolve a violation
 * PUT /api/agent-metrics/violations/:id/resolve
 */
router.put('/violations/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes, resolved_by } = req.body;
    
    console.log(`✅ Resolving violation ${id}`);
    
    // Mock resolution
    const resolvedViolation = {
      id,
      status: status || 'resolved',
      resolution_notes: resolution_notes || 'Violation resolved',
      resolved_by: resolved_by || 'system',
      resolved_at: new Date().toISOString()
    };

    res.json({
      success: true,
      violation: resolvedViolation
    });
  } catch (error) {
    console.error('❌ Error resolving violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve violation'
    });
  }
});

/**
 * Helper function to generate trust trend data
 */
function generateTrustTrend() {
  const trends = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      trust_score: 0.8 + (Math.random() * 0.2 - 0.1), // 0.7 to 0.9
      evaluations: Math.floor(Math.random() * 10) + 5,
      violations: Math.floor(Math.random() * 3)
    });
  }
  
  return trends;
}

module.exports = router;

