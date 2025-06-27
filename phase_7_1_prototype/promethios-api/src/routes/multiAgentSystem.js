const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for demo (in production, use database)
const contexts = new Map();

/**
 * POST /api/multi_agent_system/context
 * Create a new multi-agent context for coordination
 */
router.post('/context', async (req, res) => {
  try {
    const {
      name,
      agent_ids,
      collaboration_model,
      policies = {},
      governance_enabled = true,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!name || !agent_ids || !collaboration_model) {
      return res.status(400).json({
        error: 'Missing required fields: name, agent_ids, collaboration_model'
      });
    }

    // Create new context
    const context = {
      context_id: `ctx_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      name,
      agent_ids,
      collaboration_model,
      status: 'active',
      created_at: new Date().toISOString(),
      policies,
      governance_enabled,
      metadata
    };

    // Store context (in production, save to database)
    contexts.set(context.context_id, context);

    // Log for debugging
    console.log(`Created multi-agent context: ${context.context_id}`);

    res.status(201).json(context);

  } catch (error) {
    console.error('Error creating multi-agent context:', error);
    res.status(500).json({
      error: 'Failed to create multi-agent context',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/context/:contextId
 * Get a specific multi-agent context
 */
router.get('/context/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    const context = contexts.get(contextId);

    if (!context) {
      return res.status(404).json({
        error: 'Context not found'
      });
    }

    res.json(context);

  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({
      error: 'Failed to fetch context',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/contexts
 * List all multi-agent contexts
 */
router.get('/contexts', async (req, res) => {
  try {
    const allContexts = Array.from(contexts.values());
    res.json({
      contexts: allContexts,
      total: allContexts.length
    });

  } catch (error) {
    console.error('Error listing contexts:', error);
    res.status(500).json({
      error: 'Failed to list contexts',
      details: error.message
    });
  }
});

module.exports = router;

