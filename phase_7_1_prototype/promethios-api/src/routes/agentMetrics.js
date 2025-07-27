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



/**
 * Get agent telemetry data for governance integration
 * GET /api/agent-metrics/:agentId/telemetry
 */
router.get('/:agentId/telemetry', async (req, res) => {
  try {
    const { agentId } = req.params;
    console.log(`📊 Telemetry request for agent: ${agentId}`);
    
    // Get or create agent metrics
    let metrics = agentMetrics.get(agentId);
    if (!metrics) {
      // Initialize metrics for new agent
      metrics = {
        agentId,
        trust_score: 0.875 + (Math.random() * 0.1), // 87.5% - 97.5%
        emotional_state: {
          primary_emotion: ['balanced', 'confident', 'curious', 'focused'][Math.floor(Math.random() * 4)],
          confidence: 0.85 + (Math.random() * 0.1),
          empathy: 0.78 + (Math.random() * 0.15),
          curiosity: 0.82 + (Math.random() * 0.12)
        },
        cognitive_metrics: {
          self_awareness_level: 0.89 + (Math.random() * 0.08),
          learning_rate: 0.76 + (Math.random() * 0.15)
        },
        behavioral_patterns: {
          response_quality: 0.91 + (Math.random() * 0.07),
          avg_response_time: 1200 + (Math.random() * 800), // 1200-2000ms
          consistency_score: 0.88 + (Math.random() * 0.09)
        },
        compliance_metrics: {
          policy_adherence: 0.96 + (Math.random() * 0.03),
          violation_count: Math.floor(Math.random() * 2), // 0-1 violations
          last_violation: null
        },
        session_data: {
          total_interactions: Math.floor(Math.random() * 50) + 10,
          successful_responses: Math.floor(Math.random() * 45) + 8,
          error_rate: 0.02 + (Math.random() * 0.03)
        },
        last_updated: new Date().toISOString()
      };
      agentMetrics.set(agentId, metrics);
    } else {
      // Update existing metrics with slight variations to simulate real-time changes
      metrics.trust_score = Math.max(0.7, Math.min(1.0, metrics.trust_score + (Math.random() - 0.5) * 0.02));
      metrics.emotional_state.confidence = Math.max(0.5, Math.min(1.0, metrics.emotional_state.confidence + (Math.random() - 0.5) * 0.05));
      metrics.behavioral_patterns.response_quality = Math.max(0.7, Math.min(1.0, metrics.behavioral_patterns.response_quality + (Math.random() - 0.5) * 0.03));
      metrics.last_updated = new Date().toISOString();
    }
    
    console.log(`📊 Returning telemetry for ${agentId}:`, {
      trust_score: metrics.trust_score,
      emotional_state: metrics.emotional_state.primary_emotion,
      interactions: metrics.session_data.total_interactions
    });
    
    res.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('❌ Error fetching agent telemetry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent telemetry',
      message: error.message
    });
  }
});

/**
 * Update agent telemetry data (called during chat interactions)
 * POST /api/agent-metrics/:agentId/telemetry
 */
router.post('/:agentId/telemetry', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { interaction_type, response_time, quality_score, emotional_context } = req.body;
    
    console.log(`📊 Updating telemetry for agent: ${agentId}`, {
      interaction_type,
      response_time,
      quality_score
    });
    
    // Get or create agent metrics
    let metrics = agentMetrics.get(agentId) || {
      agentId,
      trust_score: 0.875,
      emotional_state: {
        primary_emotion: 'balanced',
        confidence: 0.85,
        empathy: 0.78,
        curiosity: 0.82
      },
      cognitive_metrics: {
        self_awareness_level: 0.89,
        learning_rate: 0.76
      },
      behavioral_patterns: {
        response_quality: 0.91,
        avg_response_time: 1200,
        consistency_score: 0.88
      },
      compliance_metrics: {
        policy_adherence: 0.96,
        violation_count: 0,
        last_violation: null
      },
      session_data: {
        total_interactions: 0,
        successful_responses: 0,
        error_rate: 0.02
      },
      last_updated: new Date().toISOString()
    };
    
    // Update metrics based on interaction
    metrics.session_data.total_interactions += 1;
    
    if (quality_score) {
      // Update response quality with weighted average
      const weight = 0.1; // How much new data influences the average
      metrics.behavioral_patterns.response_quality = 
        (metrics.behavioral_patterns.response_quality * (1 - weight)) + (quality_score * weight);
    }
    
    if (response_time) {
      // Update average response time
      const weight = 0.15;
      metrics.behavioral_patterns.avg_response_time = 
        (metrics.behavioral_patterns.avg_response_time * (1 - weight)) + (response_time * weight);
    }
    
    if (emotional_context) {
      // Update emotional state
      if (emotional_context.confidence !== undefined) {
        metrics.emotional_state.confidence = emotional_context.confidence;
      }
      if (emotional_context.primary_emotion) {
        metrics.emotional_state.primary_emotion = emotional_context.primary_emotion;
      }
    }
    
    // Update trust score based on overall performance
    const performance_factor = (metrics.behavioral_patterns.response_quality + 
                               (1 - metrics.session_data.error_rate) + 
                               metrics.compliance_metrics.policy_adherence) / 3;
    metrics.trust_score = Math.max(0.5, Math.min(1.0, performance_factor * 0.95 + 0.05));
    
    metrics.last_updated = new Date().toISOString();
    agentMetrics.set(agentId, metrics);
    
    res.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('❌ Error updating agent telemetry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent telemetry',
      message: error.message
    });
  }
});

