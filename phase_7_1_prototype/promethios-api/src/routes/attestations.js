/**
 * Attestations API Routes
 * 
 * Provides endpoints for managing trust attestations for AI agents.
 * Attestations are digital certificates that verify specific claims about agents.
 */

const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes (replace with database in production)
let attestations = [];
let attestationCounter = 1;

/**
 * Attestation Types and their purposes:
 * - identity: Verifies the agent is who it claims to be
 * - capability: Certifies specific skills or functions
 * - compliance: Proves regulatory compliance (GDPR, HIPAA, SOX)
 * - integrity: Verifies security audits and safety measures
 * - behavior: Certifies ethical behavior and bias testing
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'attestations-api',
    endpoints: [
      'GET /api/attestations - List all attestations',
      'POST /api/attestations - Create new attestation',
      'GET /api/attestations/:id - Get specific attestation',
      'PUT /api/attestations/:id - Update attestation',
      'DELETE /api/attestations/:id - Delete attestation',
      'POST /api/attestations/verify - Verify attestation',
      'GET /api/attestations/metrics - Get attestation metrics',
      'GET /api/attestations/agent/:agentId - Get attestations for specific agent'
    ]
  });
});

// Get all attestations
router.get('/', (req, res) => {
  try {
    const { type, status, subject, attester, limit = 50 } = req.query;
    
    let filteredAttestations = [...attestations];
    
    // Apply filters
    if (type && type !== 'all') {
      filteredAttestations = filteredAttestations.filter(a => a.attestation_type === type);
    }
    
    if (status && status !== 'all') {
      filteredAttestations = filteredAttestations.filter(a => a.status === status);
    }
    
    if (subject) {
      filteredAttestations = filteredAttestations.filter(a => 
        a.subject_name.toLowerCase().includes(subject.toLowerCase()) ||
        a.subject_instance_id.includes(subject)
      );
    }
    
    if (attester) {
      filteredAttestations = filteredAttestations.filter(a => 
        a.attester_name.toLowerCase().includes(attester.toLowerCase()) ||
        a.attester_instance_id.includes(attester)
      );
    }
    
    // Apply limit
    const limitedAttestations = filteredAttestations.slice(0, parseInt(limit));
    
    res.json({
      attestations: limitedAttestations,
      total: filteredAttestations.length,
      filtered: limitedAttestations.length
    });
  } catch (error) {
    console.error('Error fetching attestations:', error);
    res.status(500).json({ error: 'Failed to fetch attestations' });
  }
});

// Create new attestation
router.post('/', (req, res) => {
  try {
    const {
      attestation_type,
      subject_instance_id,
      subject_name,
      attester_instance_id,
      attester_name,
      attestation_data,
      expires_at,
      metadata = {}
    } = req.body;
    
    // Validate required fields
    if (!attestation_type || !subject_instance_id || !subject_name || !attester_instance_id || !attester_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: attestation_type, subject_instance_id, subject_name, attester_instance_id, attester_name' 
      });
    }
    
    // Validate attestation type
    const validTypes = ['identity', 'capability', 'compliance', 'integrity', 'behavior'];
    if (!validTypes.includes(attestation_type)) {
      return res.status(400).json({ 
        error: `Invalid attestation_type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    // Generate attestation
    const attestation_id = `attestation_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const created_at = new Date().toISOString();
    
    // Calculate confidence score based on attestation type and data
    const confidence_score = calculateConfidenceScore(attestation_type, attestation_data);
    
    // Calculate trust impact
    const trust_impact = calculateTrustImpact(attestation_type, confidence_score);
    
    // Generate cryptographic signature (simplified for demo)
    const signature = generateSignature(attestation_id, subject_instance_id, attester_instance_id);
    
    const newAttestation = {
      attestation_id,
      attestation_type,
      subject_instance_id,
      subject_name,
      attester_instance_id,
      attester_name,
      attestation_data: attestation_data || {},
      created_at,
      expires_at: expires_at || null,
      status: 'active',
      signature,
      verification_history: [{
        timestamp: created_at,
        verification_status: 'valid',
        verifier_instance_id: attester_instance_id
      }],
      metadata,
      confidence_score,
      trust_impact
    };
    
    attestations.push(newAttestation);
    
    console.log(`Created attestation: ${attestation_id} for ${subject_name} by ${attester_name}`);
    
    res.status(201).json(newAttestation);
  } catch (error) {
    console.error('Error creating attestation:', error);
    res.status(500).json({ error: 'Failed to create attestation' });
  }
});

// Get specific attestation
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const attestation = attestations.find(a => a.attestation_id === id);
    
    if (!attestation) {
      return res.status(404).json({ error: 'Attestation not found' });
    }
    
    res.json(attestation);
  } catch (error) {
    console.error('Error fetching attestation:', error);
    res.status(500).json({ error: 'Failed to fetch attestation' });
  }
});

// Update attestation
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const attestationIndex = attestations.findIndex(a => a.attestation_id === id);
    
    if (attestationIndex === -1) {
      return res.status(404).json({ error: 'Attestation not found' });
    }
    
    const { status, metadata } = req.body;
    
    // Only allow updating status and metadata
    if (status) {
      const validStatuses = ['active', 'revoked', 'expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }
      attestations[attestationIndex].status = status;
    }
    
    if (metadata) {
      attestations[attestationIndex].metadata = { ...attestations[attestationIndex].metadata, ...metadata };
    }
    
    res.json(attestations[attestationIndex]);
  } catch (error) {
    console.error('Error updating attestation:', error);
    res.status(500).json({ error: 'Failed to update attestation' });
  }
});

// Delete attestation
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const attestationIndex = attestations.findIndex(a => a.attestation_id === id);
    
    if (attestationIndex === -1) {
      return res.status(404).json({ error: 'Attestation not found' });
    }
    
    attestations.splice(attestationIndex, 1);
    
    res.json({ message: 'Attestation deleted successfully' });
  } catch (error) {
    console.error('Error deleting attestation:', error);
    res.status(500).json({ error: 'Failed to delete attestation' });
  }
});

// Verify attestation
router.post('/verify', (req, res) => {
  try {
    const { attestation_id, verifier_instance_id } = req.body;
    
    if (!attestation_id || !verifier_instance_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: attestation_id, verifier_instance_id' 
      });
    }
    
    const attestation = attestations.find(a => a.attestation_id === attestation_id);
    
    if (!attestation) {
      return res.status(404).json({ error: 'Attestation not found' });
    }
    
    // Perform verification logic
    const verification_status = performVerification(attestation);
    const verification_timestamp = new Date().toISOString();
    
    // Add to verification history
    attestation.verification_history.push({
      timestamp: verification_timestamp,
      verification_status,
      verifier_instance_id
    });
    
    const verificationResult = {
      attestation_id,
      verification_status,
      verification_timestamp,
      verifier_instance_id
    };
    
    res.json(verificationResult);
  } catch (error) {
    console.error('Error verifying attestation:', error);
    res.status(500).json({ error: 'Failed to verify attestation' });
  }
});

// Get attestation metrics
router.get('/metrics', (req, res) => {
  try {
    const total_attestations = attestations.length;
    const active_attestations = attestations.filter(a => a.status === 'active').length;
    const expired_attestations = attestations.filter(a => a.status === 'expired').length;
    const revoked_attestations = attestations.filter(a => a.status === 'revoked').length;
    
    // Count by type
    const attestations_by_type = attestations.reduce((acc, a) => {
      acc[a.attestation_type] = (acc[a.attestation_type] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate averages
    const average_confidence_score = attestations.length > 0 
      ? attestations.reduce((sum, a) => sum + a.confidence_score, 0) / attestations.length 
      : 0;
    
    // Calculate verification success rate
    const totalVerifications = attestations.reduce((sum, a) => sum + a.verification_history.length, 0);
    const successfulVerifications = attestations.reduce((sum, a) => 
      sum + a.verification_history.filter(v => v.verification_status === 'valid').length, 0);
    const verification_success_rate = totalVerifications > 0 ? successfulVerifications / totalVerifications : 0;
    
    // Recent attestations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent_attestations = attestations.filter(a => new Date(a.created_at) > thirtyDaysAgo).length;
    
    const metrics = {
      total_attestations,
      active_attestations,
      expired_attestations,
      revoked_attestations,
      attestations_by_type,
      average_confidence_score,
      verification_success_rate,
      recent_attestations
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error calculating metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// Get attestations for specific agent
router.get('/agent/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const agentAttestations = attestations.filter(a => 
      a.subject_instance_id === agentId || a.subject_instance_id.includes(agentId)
    );
    
    res.json({
      agent_id: agentId,
      attestations: agentAttestations,
      total: agentAttestations.length
    });
  } catch (error) {
    console.error('Error fetching agent attestations:', error);
    res.status(500).json({ error: 'Failed to fetch agent attestations' });
  }
});

// Helper functions
function calculateConfidenceScore(attestation_type, attestation_data) {
  // Base confidence scores by type
  const baseScores = {
    identity: 0.9,
    capability: 0.8,
    compliance: 0.95,
    integrity: 0.85,
    behavior: 0.75
  };
  
  let score = baseScores[attestation_type] || 0.7;
  
  // Adjust based on attestation data quality
  if (attestation_data && Object.keys(attestation_data).length > 0) {
    score += 0.05; // Bonus for having data
  }
  
  // Add some randomness for demo purposes
  score += (Math.random() - 0.5) * 0.1;
  
  return Math.max(0, Math.min(1, score));
}

function calculateTrustImpact(attestation_type, confidence_score) {
  // Trust impact multipliers by type
  const impactMultipliers = {
    identity: 0.3,
    capability: 0.2,
    compliance: 0.4,
    integrity: 0.35,
    behavior: 0.25
  };
  
  const multiplier = impactMultipliers[attestation_type] || 0.2;
  return confidence_score * multiplier;
}

function generateSignature(attestation_id, subject_id, attester_id) {
  // Simplified signature generation for demo
  const data = `${attestation_id}:${subject_id}:${attester_id}:${Date.now()}`;
  return Buffer.from(data).toString('base64').substr(0, 32);
}

function performVerification(attestation) {
  // Simplified verification logic
  if (attestation.status === 'revoked') return 'revoked';
  if (attestation.expires_at && new Date(attestation.expires_at) < new Date()) return 'expired';
  
  // Simulate verification with high success rate
  return Math.random() > 0.1 ? 'valid' : 'invalid';
}

module.exports = router;

