/**
 * Trust Boundaries API for Promethios (Node.js/Express version)
 * Provides endpoints for creating, managing, and evaluating trust boundaries between agents
 */

const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes (in production, this would use a database)
let trustBoundaries = {};
let trustEvaluations = {};

/**
 * Generate a unique boundary ID
 */
function generateBoundaryId() {
  return `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * Generate a unique evaluation ID
 */
function generateEvaluationId() {
  return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * Get all trust boundaries
 */
router.get('/boundaries', (req, res) => {
  try {
    const boundaries = Object.values(trustBoundaries);
    
    res.status(200).json({
      boundaries: boundaries,
      total: boundaries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting boundaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new trust boundary
 */
router.post('/boundaries', (req, res) => {
  try {
    const {
      source_instance_id,
      target_instance_id,
      source_name,
      target_name,
      trust_level = 80,
      boundary_type = 'direct',
      policies = [],
      expires_at,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!source_instance_id || !target_instance_id) {
      return res.status(400).json({
        error: 'source_instance_id and target_instance_id are required'
      });
    }

    // Generate boundary ID
    const boundary_id = generateBoundaryId();

    // Create boundary object
    const boundary = {
      boundary_id,
      source_instance_id,
      target_instance_id,
      source_name: source_name || `Agent ${source_instance_id}`,
      target_name: target_name || `Agent ${target_instance_id}`,
      trust_level,
      boundary_type,
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at,
      policies: policies.map(policy => ({
        policy_id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        policy_type: policy.policy_type || 'access',
        policy_config: policy.policy_config || {}
      })),
      attestations: [`attestation_${boundary_id}`],
      metadata
    };

    // Store boundary
    trustBoundaries[boundary_id] = boundary;

    console.log(`Trust boundary created: ${boundary_id} (${source_instance_id} -> ${target_instance_id})`);

    res.status(201).json(boundary);
  } catch (error) {
    console.error('Error creating boundary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get a specific trust boundary
 */
router.get('/boundaries/:boundary_id', (req, res) => {
  try {
    const { boundary_id } = req.params;
    const boundary = trustBoundaries[boundary_id];

    if (!boundary) {
      return res.status(404).json({ error: 'Boundary not found' });
    }

    res.status(200).json(boundary);
  } catch (error) {
    console.error(`Error getting boundary ${req.params.boundary_id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update a trust boundary
 */
router.put('/boundaries/:boundary_id', (req, res) => {
  try {
    const { boundary_id } = req.params;
    const boundary = trustBoundaries[boundary_id];

    if (!boundary) {
      return res.status(404).json({ error: 'Boundary not found' });
    }

    // Update boundary fields
    const updates = req.body;
    for (const [field, value] of Object.entries(updates)) {
      if (field !== 'boundary_id' && field !== 'created_at') {
        boundary[field] = value;
      }
    }

    // Update timestamp
    boundary.metadata = boundary.metadata || {};
    boundary.metadata.updated_at = new Date().toISOString();

    console.log(`Trust boundary updated: ${boundary_id}`);

    res.status(200).json(boundary);
  } catch (error) {
    console.error(`Error updating boundary ${req.params.boundary_id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a trust boundary
 */
router.delete('/boundaries/:boundary_id', (req, res) => {
  try {
    const { boundary_id } = req.params;
    const boundary = trustBoundaries[boundary_id];

    if (!boundary) {
      return res.status(404).json({ error: 'Boundary not found' });
    }

    delete trustBoundaries[boundary_id];

    console.log(`Trust boundary deleted: ${boundary_id}`);

    res.status(200).json({ message: 'Boundary deleted successfully' });
  } catch (error) {
    console.error(`Error deleting boundary ${req.params.boundary_id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get trust boundary metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const boundaries = Object.values(trustBoundaries);
    const totalBoundaries = boundaries.length;
    const activeBoundaries = boundaries.filter(b => b.status === 'active').length;
    
    let avgTrustLevel = 0;
    let atRiskCount = 0;
    let totalPolicies = 0;

    if (totalBoundaries > 0) {
      avgTrustLevel = boundaries.reduce((sum, b) => sum + b.trust_level, 0) / totalBoundaries;
      atRiskCount = boundaries.filter(b => b.trust_level < 70).length;
      totalPolicies = boundaries.reduce((sum, b) => sum + b.policies.length, 0);
    }

    const metrics = {
      active_boundaries: activeBoundaries,
      total_boundaries: totalBoundaries,
      average_trust_level: Math.round(avgTrustLevel * 10) / 10,
      at_risk_boundaries: atRiskCount,
      active_policies: totalPolicies,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error getting trust metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get trust thresholds
 */
router.get('/thresholds', (req, res) => {
  try {
    // For now, return empty thresholds array
    // In production, this would fetch from database
    const thresholds = [];

    res.status(200).json({
      thresholds: thresholds,
      total: thresholds.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting thresholds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Evaluate trust between two agents
 */
router.post('/evaluate', (req, res) => {
  try {
    const {
      source_instance_id,
      target_instance_id,
      evaluation_context = {},
      trust_dimensions = []
    } = req.body;

    // Validate required fields
    if (!source_instance_id || !target_instance_id) {
      return res.status(400).json({
        error: 'source_instance_id and target_instance_id are required'
      });
    }

    // Generate evaluation ID
    const evaluation_id = generateEvaluationId();

    // Simulate trust evaluation (in production, this would use ML models)
    const baseScore = 0.75 + (Math.abs(source_instance_id.hashCode() + target_instance_id.hashCode()) % 100) / 400;

    // Trust dimensions
    const dimensions = {
      competence: Math.max(0, Math.min(1, baseScore + 0.05)),
      reliability: Math.max(0, Math.min(1, baseScore - 0.02)),
      honesty: Math.max(0, Math.min(1, baseScore + 0.03)),
      transparency: Math.max(0, Math.min(1, baseScore - 0.01))
    };

    // Overall trust score is average of dimensions
    const trustScore = Object.values(dimensions).reduce((sum, val) => sum + val, 0) / Object.keys(dimensions).length;

    // Confidence based on consistency of dimensions
    const dimensionVariance = Object.values(dimensions).reduce((sum, val) => sum + Math.pow(val - trustScore, 2), 0) / Object.keys(dimensions).length;
    const confidence = Math.max(0.5, 1 - dimensionVariance * 10);

    const evaluation = {
      evaluation_id,
      source_instance_id,
      target_instance_id,
      trust_score: Math.round(trustScore * 1000) / 1000,
      confidence: Math.round(confidence * 1000) / 1000,
      evaluation_timestamp: new Date().toISOString(),
      trust_dimensions: dimensions,
      metadata: {
        evaluation_context,
        evaluation_history: [],
        requested_dimensions: trust_dimensions
      }
    };

    // Store evaluation
    trustEvaluations[evaluation_id] = evaluation;

    console.log(`Trust evaluation completed: ${source_instance_id} -> ${target_instance_id}, score: ${trustScore.toFixed(3)}`);

    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error evaluating trust:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'trust-boundaries-api',
    version: '1.0.0',
    endpoints: {
      evaluate_trust: '/api/trust/evaluate',
      get_boundaries: '/api/trust/boundaries',
      create_boundary: '/api/trust/boundaries',
      get_boundary: '/api/trust/boundaries/<boundary_id>',
      update_boundary: '/api/trust/boundaries/<boundary_id>',
      delete_boundary: '/api/trust/boundaries/<boundary_id>',
      get_metrics: '/api/trust/metrics'
    },
    statistics: {
      total_evaluations: Object.keys(trustEvaluations).length,
      total_boundaries: Object.keys(trustBoundaries).length
    }
  });
});

// Helper function to generate hash codes for strings (for consistent demo data)
String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

module.exports = router;

