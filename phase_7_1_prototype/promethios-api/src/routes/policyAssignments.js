/**
 * Policy Assignment Routes
 * 
 * RESTful API endpoints for managing agent-policy assignments
 * with comprehensive CRUD operations and compliance tracking.
 */

const express = require('express');
const router = express.Router();
const PolicyAssignment = require('../models/PolicyAssignment');
const { authenticateUser } = require('../middleware/auth');
const { validateRequest, assignmentValidation } = require('../middleware/validation');
const { logActivity } = require('../middleware/logging');

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * GET /api/policy-assignments
 * Get all policy assignments for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const { 
      agentId, 
      policyId, 
      status = 'active', 
      includeInactive = false,
      page = 1,
      limit = 50,
      sortBy = 'assignedAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user.uid;
    
    // Build query
    const query = { 
      userId,
      deletedAt: { $exists: false }
    };
    
    if (agentId) query.agentId = agentId;
    if (policyId) query.policyId = policyId;
    if (!includeInactive) query.status = status;
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const assignments = await PolicyAssignment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await PolicyAssignment.countDocuments(query);
    
    res.json({
      success: true,
      data: assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching policy assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy assignments',
      details: error.message
    });
  }
});

/**
 * GET /api/policy-assignments/summary
 * Get compliance summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.uid;
    const summary = await PolicyAssignment.getComplianceSummary(userId);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Error fetching assignment summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignment summary',
      details: error.message
    });
  }
});

/**
 * GET /api/policy-assignments/agent/:agentId
 * Get all assignments for a specific agent
 */
router.get('/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { includeInactive = false } = req.query;
    const userId = req.user.uid;
    
    const assignments = await PolicyAssignment.findByAgent(agentId, includeInactive)
      .where('userId').equals(userId);
    
    res.json({
      success: true,
      data: assignments
    });
    
  } catch (error) {
    console.error('Error fetching agent assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent assignments',
      details: error.message
    });
  }
});

/**
 * GET /api/policy-assignments/policy/:policyId
 * Get all assignments for a specific policy
 */
router.get('/policy/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const { includeInactive = false } = req.query;
    const userId = req.user.uid;
    
    const assignments = await PolicyAssignment.findByPolicy(policyId, includeInactive)
      .where('userId').equals(userId);
    
    res.json({
      success: true,
      data: assignments
    });
    
  } catch (error) {
    console.error('Error fetching policy assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy assignments',
      details: error.message
    });
  }
});

/**
 * GET /api/policy-assignments/compliance/low
 * Get assignments with low compliance rates
 */
router.get('/compliance/low', async (req, res) => {
  try {
    const { threshold = 0.7 } = req.query;
    const userId = req.user.uid;
    
    const assignments = await PolicyAssignment.findLowCompliance(userId, parseFloat(threshold));
    
    res.json({
      success: true,
      data: assignments
    });
    
  } catch (error) {
    console.error('Error fetching low compliance assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low compliance assignments',
      details: error.message
    });
  }
});

/**
 * GET /api/policy-assignments/violations/recent
 * Get assignments with recent violations
 */
router.get('/violations/recent', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const userId = req.user.uid;
    
    const assignments = await PolicyAssignment.findRecentViolations(userId, parseInt(days));
    
    res.json({
      success: true,
      data: assignments
    });
    
  } catch (error) {
    console.error('Error fetching recent violations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent violations',
      details: error.message
    });
  }
});

/**
 * POST /api/policy-assignments
 * Create a new policy assignment
 */
router.post('/', validateRequest(assignmentValidation.create), async (req, res) => {
  try {
    const userId = req.user.uid;
    const assignmentData = {
      ...req.body,
      userId,
      assignedBy: userId
    };
    
    // Check if assignment already exists
    const existingAssignment = await PolicyAssignment.findOne({
      agentId: assignmentData.agentId,
      policyId: assignmentData.policyId,
      userId,
      deletedAt: { $exists: false }
    });
    
    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        error: 'Assignment already exists',
        data: existingAssignment
      });
    }
    
    const assignment = new PolicyAssignment(assignmentData);
    await assignment.save();
    
    // Log activity
    await logActivity(req, 'policy_assignment_created', {
      assignmentId: assignment.assignmentId,
      agentId: assignment.agentId,
      policyId: assignment.policyId
    });
    
    res.status(201).json({
      success: true,
      data: assignment
    });
    
  } catch (error) {
    console.error('Error creating policy assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create policy assignment',
      details: error.message
    });
  }
});

/**
 * POST /api/policy-assignments/bulk
 * Create multiple policy assignments
 */
router.post('/bulk', validateRequest(assignmentValidation.bulk), async (req, res) => {
  try {
    const userId = req.user.uid;
    const { assignments } = req.body;
    
    const results = {
      created: [],
      skipped: [],
      errors: []
    };
    
    for (const assignmentData of assignments) {
      try {
        // Check if assignment already exists
        const existingAssignment = await PolicyAssignment.findOne({
          agentId: assignmentData.agentId,
          policyId: assignmentData.policyId,
          userId,
          deletedAt: { $exists: false }
        });
        
        if (existingAssignment) {
          results.skipped.push({
            agentId: assignmentData.agentId,
            policyId: assignmentData.policyId,
            reason: 'Assignment already exists'
          });
          continue;
        }
        
        const assignment = new PolicyAssignment({
          ...assignmentData,
          userId,
          assignedBy: userId
        });
        
        await assignment.save();
        results.created.push(assignment);
        
      } catch (error) {
        results.errors.push({
          agentId: assignmentData.agentId,
          policyId: assignmentData.policyId,
          error: error.message
        });
      }
    }
    
    // Log bulk activity
    await logActivity(req, 'policy_assignments_bulk_created', {
      created: results.created.length,
      skipped: results.skipped.length,
      errors: results.errors.length
    });
    
    res.status(201).json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Error creating bulk policy assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk policy assignments',
      details: error.message
    });
  }
});

/**
 * PUT /api/policy-assignments/:assignmentId
 * Update a policy assignment
 */
router.put('/:assignmentId', validateRequest(assignmentValidation.update), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.uid;
    const updates = {
      ...req.body,
      updatedBy: userId
    };
    
    const assignment = await PolicyAssignment.findOne({
      assignmentId,
      userId,
      deletedAt: { $exists: false }
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    Object.assign(assignment, updates);
    await assignment.save();
    
    // Log activity
    await logActivity(req, 'policy_assignment_updated', {
      assignmentId: assignment.assignmentId,
      updates: Object.keys(updates)
    });
    
    res.json({
      success: true,
      data: assignment
    });
    
  } catch (error) {
    console.error('Error updating policy assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update policy assignment',
      details: error.message
    });
  }
});

/**
 * PUT /api/policy-assignments/:assignmentId/compliance
 * Update compliance rate for an assignment
 */
router.put('/:assignmentId/compliance', validateRequest(assignmentValidation.compliance), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { complianceRate, violationCount } = req.body;
    const userId = req.user.uid;
    
    const assignment = await PolicyAssignment.findOne({
      assignmentId,
      userId,
      deletedAt: { $exists: false }
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    await assignment.updateCompliance(complianceRate, violationCount);
    
    // Log activity
    await logActivity(req, 'policy_assignment_compliance_updated', {
      assignmentId: assignment.assignmentId,
      complianceRate,
      violationCount
    });
    
    res.json({
      success: true,
      data: assignment
    });
    
  } catch (error) {
    console.error('Error updating compliance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update compliance',
      details: error.message
    });
  }
});

/**
 * PUT /api/policy-assignments/:assignmentId/suspend
 * Suspend a policy assignment
 */
router.put('/:assignmentId/suspend', validateRequest(assignmentValidation.suspend), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.uid;
    
    const assignment = await PolicyAssignment.findOne({
      assignmentId,
      userId,
      deletedAt: { $exists: false }
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    await assignment.suspend(reason, userId);
    
    // Log activity
    await logActivity(req, 'policy_assignment_suspended', {
      assignmentId: assignment.assignmentId,
      reason
    });
    
    res.json({
      success: true,
      data: assignment
    });
    
  } catch (error) {
    console.error('Error suspending assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend assignment',
      details: error.message
    });
  }
});

/**
 * PUT /api/policy-assignments/:assignmentId/reactivate
 * Reactivate a suspended policy assignment
 */
router.put('/:assignmentId/reactivate', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.uid;
    
    const assignment = await PolicyAssignment.findOne({
      assignmentId,
      userId,
      deletedAt: { $exists: false }
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    await assignment.reactivate(userId);
    
    // Log activity
    await logActivity(req, 'policy_assignment_reactivated', {
      assignmentId: assignment.assignmentId
    });
    
    res.json({
      success: true,
      data: assignment
    });
    
  } catch (error) {
    console.error('Error reactivating assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate assignment',
      details: error.message
    });
  }
});

/**
 * DELETE /api/policy-assignments/:assignmentId
 * Soft delete a policy assignment
 */
router.delete('/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.uid;
    
    const assignment = await PolicyAssignment.findOne({
      assignmentId,
      userId,
      deletedAt: { $exists: false }
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    await assignment.softDelete(userId);
    
    // Log activity
    await logActivity(req, 'policy_assignment_deleted', {
      assignmentId: assignment.assignmentId
    });
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete assignment',
      details: error.message
    });
  }
});

/**
 * DELETE /api/policy-assignments/agent/:agentId
 * Remove all assignments for an agent
 */
router.delete('/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const userId = req.user.uid;
    
    const assignments = await PolicyAssignment.find({
      agentId,
      userId,
      deletedAt: { $exists: false }
    });
    
    let deletedCount = 0;
    for (const assignment of assignments) {
      await assignment.softDelete(userId);
      deletedCount++;
    }
    
    // Log activity
    await logActivity(req, 'agent_assignments_deleted', {
      agentId,
      deletedCount
    });
    
    res.json({
      success: true,
      message: `${deletedCount} assignments deleted for agent ${agentId}`
    });
    
  } catch (error) {
    console.error('Error deleting agent assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent assignments',
      details: error.message
    });
  }
});

/**
 * DELETE /api/policy-assignments/policy/:policyId
 * Remove all assignments for a policy
 */
router.delete('/policy/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const userId = req.user.uid;
    
    const assignments = await PolicyAssignment.find({
      policyId,
      userId,
      deletedAt: { $exists: false }
    });
    
    let deletedCount = 0;
    for (const assignment of assignments) {
      await assignment.softDelete(userId);
      deletedCount++;
    }
    
    // Log activity
    await logActivity(req, 'policy_assignments_deleted', {
      policyId,
      deletedCount
    });
    
    res.json({
      success: true,
      message: `${deletedCount} assignments deleted for policy ${policyId}`
    });
    
  } catch (error) {
    console.error('Error deleting policy assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete policy assignments',
      details: error.message
    });
  }
});

module.exports = router;

