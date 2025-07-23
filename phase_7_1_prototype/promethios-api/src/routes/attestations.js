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



// Observer Integration Endpoints
router.post('/observer/events', (req, res) => {
  try {
    const event = req.body;
    
    // Log the observer event (in production, this would be stored in a database)
    console.log('Observer event received:', {
      event_type: event.event_type,
      agent_id: event.agent_id,
      attestation_id: event.attestation_id,
      timestamp: event.timestamp,
      severity: event.severity
    });
    
    res.json({
      success: true,
      message: 'Observer event recorded',
      event_id: event.event_id
    });
  } catch (error) {
    console.error('Error processing observer event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process observer event'
    });
  }
});

router.get('/observer/metrics', (req, res) => {
  try {
    // In production, this would query actual metrics from the database
    const mockMetrics = {
      total_events: 156,
      events_by_type: {
        'attestation_created': 45,
        'attestation_verified': 38,
        'attestation_expired': 12,
        'attestation_revoked': 3,
        'verification_failed': 8
      },
      events_by_severity: {
        'info': 83,
        'warning': 20,
        'error': 11,
        'critical': 3
      },
      recent_events: [],
      agent_activity: {},
      attestation_health: {
        active_attestations: attestations.filter(a => a.status === 'active').length,
        expiring_soon: 5,
        expired: 8,
        revoked: 2
      }
    };
    
    res.json(mockMetrics);
  } catch (error) {
    console.error('Error fetching observer metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch observer metrics'
    });
  }
});

router.get('/observer/events', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // In production, this would query actual events from the database
    const mockEvents = [];
    
    res.json({
      success: true,
      events: mockEvents,
      total: mockEvents.length
    });
  } catch (error) {
    console.error('Error fetching observer events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch observer events'
    });
  }
});

router.get('/observer/events/agent/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const { limit = 50 } = req.query;
    
    // In production, this would query actual events for the specific agent
    const mockEvents = [];
    
    res.json({
      success: true,
      events: mockEvents,
      agent_id: agentId,
      total: mockEvents.length
    });
  } catch (error) {
    console.error('Error fetching agent events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent events'
    });
  }
});

router.get('/observer/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'observer-integration',
    timestamp: new Date().toISOString()
  });
});

// Notification System Endpoints
router.post('/notifications/send', (req, res) => {
  try {
    const { notification, preferences } = req.body;
    
    // Log the notification (in production, this would be stored and processed)
    console.log('Notification sent:', {
      type: notification.type,
      title: notification.title,
      agent_id: notification.agent_id,
      priority: notification.priority,
      timestamp: notification.timestamp
    });
    
    // In production, this would:
    // 1. Store the notification in the database
    // 2. Send email if preferences.email_enabled is true
    // 3. Send push notification if configured
    // 4. Apply quiet hours and other preference rules
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification_id: notification.id
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

router.get('/notifications', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // In production, this would query actual notifications from the database
    const mockNotifications = [];
    
    res.json({
      success: true,
      notifications: mockNotifications,
      total: mockNotifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

router.get('/notifications/unread-count', (req, res) => {
  try {
    // In production, this would query the actual unread count
    const unreadCount = 0;
    
    res.json({
      success: true,
      count: unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

router.put('/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    
    // In production, this would update the notification in the database
    console.log('Marking notification as read:', id);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

router.put('/notifications/mark-all-read', (req, res) => {
  try {
    // In production, this would update all notifications in the database
    console.log('Marking all notifications as read');
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

router.put('/notifications/preferences', (req, res) => {
  try {
    const preferences = req.body;
    
    // In production, this would store the preferences in the database
    console.log('Updating notification preferences:', preferences);
    
    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

router.get('/notifications/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'notification-system',
    timestamp: new Date().toISOString()
  });
});

