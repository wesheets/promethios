/**
 * Agent API Routes
 * Handles agent registration, profiles, scorecards, and management
 */

const express = require('express');
const router = express.Router();

// Mock agent data store (in production, this would be a database)
const agents = new Map();
const scorecards = new Map();

/**
 * Register a new agent
 * POST /api/agents/register
 */
router.post('/register', async (req, res) => {
  try {
    console.log('🤖 Agent registration request received');
    const { name, description, version, governance_identity, owner_id } = req.body;
    
    if (!name || !version || !owner_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, version, owner_id'
      });
    }
    
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const agent = {
      agent_id: agentId,
      name,
      description: description || '',
      version,
      governance_identity: governance_identity || {
        type: 'promethios_governed',
        constitution_hash: 'sha256_' + Math.random().toString(36),
        compliance_level: 'standard',
        verification_endpoint: `/api/agents/${agentId}/verify`
      },
      deployment_status: 'registered',
      health_status: 'healthy',
      trust_score: {
        score: 85 + Math.random() * 10, // Random score between 85-95
        last_calculated: new Date().toISOString(),
        calculation_method: 'promethios_v1'
      },
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      owner_id
    };
    
    agents.set(agentId, agent);
    console.log(`✅ Agent registered successfully: ${agentId}`);
    
    res.status(201).json({
      success: true,
      agent_id: agentId,
      message: 'Agent registered successfully'
    });
    
  } catch (error) {
    console.error('❌ Error registering agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register agent',
      message: error.message
    });
  }
});

/**
 * Get agent profile by ID
 * GET /api/agents/:agentId/profile
 */
router.get('/:agentId/profile', async (req, res) => {
  try {
    const { agentId } = req.params;
    console.log(`📋 Getting profile for agent: ${agentId}`);
    
    const agent = agents.get(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.status(200).json(agent);
    
  } catch (error) {
    console.error('❌ Error getting agent profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent profile',
      message: error.message
    });
  }
});

/**
 * Get agent scorecard by ID
 * GET /api/agents/:agentId/scorecard
 */
router.get('/:agentId/scorecard', async (req, res) => {
  try {
    const { agentId } = req.params;
    console.log(`📊 Getting scorecard for agent: ${agentId}`);
    
    let scorecard = scorecards.get(agentId);
    if (!scorecard) {
      // Generate a new scorecard if none exists
      scorecard = {
        agent_id: agentId,
        scorecard_id: `scorecard_${Date.now()}`,
        timestamp: new Date().toISOString(),
        governance_identity: {
          type: 'promethios_governed',
          constitution_hash: 'sha256_' + Math.random().toString(36),
          compliance_level: 'standard',
          verification_endpoint: `/api/agents/${agentId}/verify`
        },
        trust_score: {
          score: 85 + Math.random() * 10,
          last_calculated: new Date().toISOString(),
          calculation_method: 'promethios_v1'
        },
        metrics: {
          reliability: 0.92 + Math.random() * 0.08,
          security: 0.88 + Math.random() * 0.12,
          performance: 0.90 + Math.random() * 0.10,
          compliance: 0.95 + Math.random() * 0.05
        },
        governance_checks: {
          constitution_verified: true,
          policy_compliance: true,
          audit_trail_complete: true,
          security_scan_passed: true
        }
      };
      scorecards.set(agentId, scorecard);
    }
    
    res.status(200).json(scorecard);
    
  } catch (error) {
    console.error('❌ Error getting agent scorecard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent scorecard',
      message: error.message
    });
  }
});

/**
 * List agents with optional filtering
 * GET /api/agents
 */
router.get('/', async (req, res) => {
  try {
    const { owner_id, limit = 50 } = req.query;
    console.log(`📋 Listing agents - owner_id: ${owner_id}, limit: ${limit}`);
    
    let agentList = Array.from(agents.values());
    
    // Filter by owner if specified
    if (owner_id) {
      agentList = agentList.filter(agent => agent.owner_id === owner_id);
    }
    
    // Apply limit
    agentList = agentList.slice(0, parseInt(limit));
    
    res.status(200).json({
      agents: agentList,
      total: agentList.length,
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('❌ Error listing agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list agents',
      message: error.message
    });
  }
});

/**
 * Generate agent scorecard
 * POST /api/agents/:agentId/scorecard/generate
 */
router.post('/:agentId/scorecard/generate', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { force_recalculate } = req.query;
    console.log(`🔄 Generating scorecard for agent: ${agentId}, force: ${force_recalculate}`);
    
    const agent = agents.get(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Generate new scorecard
    const scorecard = {
      agent_id: agentId,
      scorecard_id: `scorecard_${Date.now()}`,
      timestamp: new Date().toISOString(),
      governance_identity: agent.governance_identity,
      trust_score: {
        score: 85 + Math.random() * 10,
        last_calculated: new Date().toISOString(),
        calculation_method: 'promethios_v1'
      },
      metrics: {
        reliability: 0.92 + Math.random() * 0.08,
        security: 0.88 + Math.random() * 0.12,
        performance: 0.90 + Math.random() * 0.10,
        compliance: 0.95 + Math.random() * 0.05
      },
      governance_checks: {
        constitution_verified: true,
        policy_compliance: true,
        audit_trail_complete: true,
        security_scan_passed: true
      }
    };
    
    scorecards.set(agentId, scorecard);
    
    // Update agent's trust score
    agent.trust_score = scorecard.trust_score;
    agent.last_updated = new Date().toISOString();
    agents.set(agentId, agent);
    
    console.log(`✅ Scorecard generated successfully for agent: ${agentId}`);
    
    res.status(200).json({
      message: 'Scorecard generated successfully',
      scorecard_id: scorecard.scorecard_id
    });
    
  } catch (error) {
    console.error('❌ Error generating agent scorecard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate agent scorecard',
      message: error.message
    });
  }
});

/**
 * Get agent metrics
 * GET /api/agents/:agentId/metrics
 */
router.get('/:agentId/metrics', async (req, res) => {
  try {
    const { agentId } = req.params;
    console.log(`📊 Getting metrics for agent: ${agentId}`);
    
    const agent = agents.get(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    const metrics = {
      agent_id: agentId,
      status: agent.deployment_status,
      health_status: agent.health_status,
      response_time: Math.floor(Math.random() * 500) + 200, // 200-700ms
      success_rate: 0.95 + Math.random() * 0.05, // 95-100%
      last_activity: new Date().toISOString(),
      trust_score: agent.trust_score,
      uptime: '99.9%',
      requests_handled: Math.floor(Math.random() * 10000) + 1000,
      errors: Math.floor(Math.random() * 10)
    };
    
    res.status(200).json(metrics);
    
  } catch (error) {
    console.error('❌ Error getting agent metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent metrics',
      message: error.message
    });
  }
});

/**
 * Verify agent governance
 * GET /api/agents/:agentId/verify
 */
router.get('/:agentId/verify', async (req, res) => {
  try {
    const { agentId } = req.params;
    console.log(`🔍 Verifying agent governance: ${agentId}`);
    
    const agent = agents.get(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    const verification = {
      agent_id: agentId,
      verified: true,
      verification_timestamp: new Date().toISOString(),
      governance_identity: agent.governance_identity,
      compliance_status: 'compliant',
      trust_score: agent.trust_score,
      verification_details: {
        constitution_hash_valid: true,
        policy_compliance_verified: true,
        security_scan_passed: true,
        audit_trail_complete: true
      }
    };
    
    res.status(200).json(verification);
    
  } catch (error) {
    console.error('❌ Error verifying agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify agent',
      message: error.message
    });
  }
});

module.exports = router;

