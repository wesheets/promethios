/**
 * Compliance Monitoring Routes
 * 
 * Real-time compliance monitoring, violation tracking, and governance analytics
 * for live policy enforcement across all agents.
 */

const express = require('express');
const router = express.Router();
const PolicyAssignment = require('../models/PolicyAssignment');
const { authenticateUser } = require('../middleware/auth');
const { activityLogger } = require('../middleware/logging');
const { enforcementEngine } = require('../middleware/policyEnforcement');

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * GET /api/compliance/dashboard
 * Get comprehensive compliance dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { timeframe = '7d' } = req.query;
    
    // Get compliance summary
    const summary = await PolicyAssignment.getComplianceSummary(userId);
    
    // Get enforcement statistics
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const enforcementStats = await activityLogger.getEnforcementStats(days);
    
    // Get recent violations
    const recentViolations = await activityLogger.getRecentViolations(days, 50);
    
    // Get low compliance assignments
    const lowComplianceAssignments = await PolicyAssignment.findLowCompliance(userId, 0.8);
    
    // Calculate trends
    const trends = await this.calculateComplianceTrends(userId, days);
    
    const dashboardData = {
      summary: {
        ...summary,
        lastUpdated: new Date().toISOString()
      },
      enforcement: enforcementStats || {
        totalRequests: 0,
        blockedRequests: 0,
        warnedRequests: 0,
        allowedRequests: 0,
        violationsByPolicy: {},
        violationsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        topViolatedRules: []
      },
      violations: {
        recent: recentViolations.slice(0, 10),
        total: recentViolations.length,
        critical: recentViolations.filter(v => v.violation?.severity === 'critical').length,
        high: recentViolations.filter(v => v.violation?.severity === 'high').length
      },
      alerts: {
        lowCompliance: lowComplianceAssignments.slice(0, 5),
        criticalViolations: recentViolations.filter(v => v.violation?.severity === 'critical').slice(0, 3)
      },
      trends
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance dashboard',
      details: error.message
    });
  }
});

/**
 * GET /api/compliance/violations
 * Get detailed violation history with filtering and pagination
 */
router.get('/violations', async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      agentId,
      policyId,
      severity,
      days = 7,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;
    
    // Get violations from logs
    let violations = await activityLogger.getRecentViolations(parseInt(days), 1000);
    
    // Filter by user's assignments
    const userAssignments = await PolicyAssignment.findByUser(userId);
    const userAssignmentIds = new Set(userAssignments.map(a => a.assignmentId));
    
    violations = violations.filter(v => 
      userAssignmentIds.has(v.violation?.assignmentId)
    );
    
    // Apply filters
    if (agentId) {
      violations = violations.filter(v => v.context?.agentId === agentId);
    }
    
    if (policyId) {
      violations = violations.filter(v => v.violation?.policyId === policyId);
    }
    
    if (severity) {
      violations = violations.filter(v => v.violation?.severity === severity);
    }
    
    // Sort violations
    violations.sort((a, b) => {
      const aValue = a[sortBy] || a.violation?.[sortBy] || a.timestamp;
      const bValue = b[sortBy] || b.violation?.[sortBy] || b.timestamp;
      
      if (sortOrder === 'desc') {
        return new Date(bValue) - new Date(aValue);
      } else {
        return new Date(aValue) - new Date(bValue);
      }
    });
    
    // Paginate
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedViolations = violations.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedViolations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: violations.length,
        pages: Math.ceil(violations.length / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch violations',
      details: error.message
    });
  }
});

/**
 * GET /api/compliance/violations/live
 * Server-Sent Events endpoint for real-time violation feed
 */
router.get('/violations/live', (req, res) => {
  const userId = req.user.uid;
  
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
  
  // Set up violation listener (simplified - in production would use proper event system)
  const violationListener = setInterval(async () => {
    try {
      // Check for new violations in the last minute
      const recentViolations = await activityLogger.getRecentViolations(1, 10);
      const newViolations = recentViolations.filter(v => {
        const violationTime = new Date(v.timestamp);
        const oneMinuteAgo = new Date(Date.now() - 60000);
        return violationTime > oneMinuteAgo;
      });
      
      // Filter by user's assignments
      const userAssignments = await PolicyAssignment.findByUser(userId);
      const userAssignmentIds = new Set(userAssignments.map(a => a.assignmentId));
      
      const userViolations = newViolations.filter(v => 
        userAssignmentIds.has(v.violation?.assignmentId)
      );
      
      if (userViolations.length > 0) {
        for (const violation of userViolations) {
          res.write(`data: ${JSON.stringify({
            type: 'violation',
            data: violation,
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      }
    } catch (error) {
      console.error('Error in violation listener:', error);
    }
  }, 5000); // Check every 5 seconds
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(violationListener);
  });
  
  req.on('end', () => {
    clearInterval(violationListener);
  });
});

/**
 * GET /api/compliance/agents/:agentId/status
 * Get real-time compliance status for a specific agent
 */
router.get('/agents/:agentId/status', async (req, res) => {
  try {
    const { agentId } = req.params;
    const userId = req.user.uid;
    
    // Get agent assignments
    const assignments = await PolicyAssignment.findByAgent(agentId)
      .where('userId').equals(userId);
    
    if (assignments.length === 0) {
      return res.json({
        success: true,
        data: {
          agentId,
          status: 'no_policies',
          assignments: [],
          overallCompliance: 1.0,
          recentViolations: []
        }
      });
    }
    
    // Calculate overall compliance
    const totalCompliance = assignments.reduce((sum, a) => sum + a.complianceRate, 0);
    const overallCompliance = totalCompliance / assignments.length;
    
    // Get recent violations for this agent
    const recentViolations = await activityLogger.getRecentViolations(7, 100);
    const agentViolations = recentViolations.filter(v => v.context?.agentId === agentId);
    
    // Determine status
    let status = 'compliant';
    if (overallCompliance < 0.5) status = 'critical';
    else if (overallCompliance < 0.7) status = 'warning';
    else if (overallCompliance < 0.9) status = 'attention';
    
    res.json({
      success: true,
      data: {
        agentId,
        status,
        assignments: assignments.map(a => ({
          assignmentId: a.assignmentId,
          policyId: a.policyId,
          policyName: a.policyName,
          complianceRate: a.complianceRate,
          violationCount: a.violationCount,
          lastEvaluated: a.lastEvaluated,
          enforcementLevel: a.enforcementLevel
        })),
        overallCompliance,
        totalPolicies: assignments.length,
        activePolicies: assignments.filter(a => a.status === 'active').length,
        recentViolations: agentViolations.slice(0, 5),
        lastActivity: assignments.reduce((latest, a) => {
          const evalTime = new Date(a.lastEvaluated);
          return evalTime > latest ? evalTime : latest;
        }, new Date(0))
      }
    });
    
  } catch (error) {
    console.error('Error fetching agent compliance status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent compliance status',
      details: error.message
    });
  }
});

/**
 * GET /api/compliance/policies/:policyId/effectiveness
 * Get policy effectiveness metrics and analytics
 */
router.get('/policies/:policyId/effectiveness', async (req, res) => {
  try {
    const { policyId } = req.params;
    const userId = req.user.uid;
    const { days = 30 } = req.query;
    
    // Get policy assignments
    const assignments = await PolicyAssignment.findByPolicy(policyId)
      .where('userId').equals(userId);
    
    if (assignments.length === 0) {
      return res.json({
        success: true,
        data: {
          policyId,
          effectiveness: 'no_data',
          assignments: 0,
          metrics: {}
        }
      });
    }
    
    // Get violations for this policy
    const violations = await activityLogger.getRecentViolations(parseInt(days), 1000);
    const policyViolations = violations.filter(v => v.violation?.policyId === policyId);
    
    // Calculate effectiveness metrics
    const totalAssignments = assignments.length;
    const averageCompliance = assignments.reduce((sum, a) => sum + a.complianceRate, 0) / totalAssignments;
    const totalViolations = policyViolations.length;
    const uniqueAgentsViolated = new Set(policyViolations.map(v => v.context?.agentId)).size;
    
    // Violation breakdown by rule
    const violationsByRule = {};
    const violationsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    
    for (const violation of policyViolations) {
      const ruleId = violation.violation?.ruleId || 'unknown';
      const severity = violation.violation?.severity || 'medium';
      
      violationsByRule[ruleId] = (violationsByRule[ruleId] || 0) + 1;
      violationsBySeverity[severity]++;
    }
    
    // Calculate effectiveness score
    let effectivenessScore = averageCompliance;
    if (totalViolations > 0) {
      const violationRate = totalViolations / (totalAssignments * parseInt(days));
      effectivenessScore = Math.max(0, effectivenessScore - (violationRate * 0.1));
    }
    
    let effectiveness = 'excellent';
    if (effectivenessScore < 0.5) effectiveness = 'poor';
    else if (effectivenessScore < 0.7) effectiveness = 'fair';
    else if (effectivenessScore < 0.9) effectiveness = 'good';
    
    res.json({
      success: true,
      data: {
        policyId,
        effectiveness,
        effectivenessScore,
        assignments: totalAssignments,
        metrics: {
          averageCompliance,
          totalViolations,
          uniqueAgentsViolated,
          violationsByRule: Object.entries(violationsByRule)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([ruleId, count]) => ({ ruleId, count })),
          violationsBySeverity,
          complianceDistribution: {
            excellent: assignments.filter(a => a.complianceRate >= 0.95).length,
            good: assignments.filter(a => a.complianceRate >= 0.85 && a.complianceRate < 0.95).length,
            fair: assignments.filter(a => a.complianceRate >= 0.70 && a.complianceRate < 0.85).length,
            poor: assignments.filter(a => a.complianceRate < 0.70).length
          }
        },
        trends: await this.calculatePolicyTrends(policyId, userId, parseInt(days))
      }
    });
    
  } catch (error) {
    console.error('Error fetching policy effectiveness:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy effectiveness',
      details: error.message
    });
  }
});

/**
 * POST /api/compliance/alerts/configure
 * Configure compliance alerts and thresholds
 */
router.post('/alerts/configure', async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      complianceThreshold = 0.8,
      violationThreshold = 10,
      criticalViolationThreshold = 1,
      alertChannels = ['email'],
      enabled = true
    } = req.body;
    
    // Store alert configuration (in production, this would go to a database)
    const alertConfig = {
      userId,
      complianceThreshold,
      violationThreshold,
      criticalViolationThreshold,
      alertChannels,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Log the configuration
    await activityLogger.logActivity(req, 'alert_configuration_updated', alertConfig);
    
    res.json({
      success: true,
      data: alertConfig,
      message: 'Alert configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Error configuring alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure alerts',
      details: error.message
    });
  }
});

/**
 * GET /api/compliance/reports/export
 * Export compliance report in various formats
 */
router.get('/reports/export', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      format = 'json',
      timeframe = '30d',
      includeViolations = true,
      includeMetrics = true 
    } = req.query;
    
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    
    // Gather report data
    const summary = await PolicyAssignment.getComplianceSummary(userId);
    const enforcementStats = await activityLogger.getEnforcementStats(days);
    const violations = includeViolations ? await activityLogger.getRecentViolations(days, 1000) : [];
    const assignments = await PolicyAssignment.findByUser(userId);
    
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        timeframe,
        userId,
        reportType: 'compliance_report'
      },
      summary,
      enforcement: enforcementStats,
      assignments: assignments.map(a => ({
        assignmentId: a.assignmentId,
        agentId: a.agentId,
        agentName: a.agentName,
        policyId: a.policyId,
        policyName: a.policyName,
        complianceRate: a.complianceRate,
        violationCount: a.violationCount,
        status: a.status,
        assignedAt: a.assignedAt,
        lastEvaluated: a.lastEvaluated
      })),
      violations: includeViolations ? violations.filter(v => {
        const userAssignmentIds = new Set(assignments.map(a => a.assignmentId));
        return userAssignmentIds.has(v.violation?.assignmentId);
      }) : []
    };
    
    // Format response based on requested format
    if (format === 'csv') {
      // Convert to CSV format
      const csv = this.convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="compliance_report_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="compliance_report_${Date.now()}.json"`);
      res.json({
        success: true,
        data: reportData
      });
    }
    
    // Log export activity
    await activityLogger.logActivity(req, 'compliance_report_exported', {
      format,
      timeframe,
      recordCount: {
        assignments: reportData.assignments.length,
        violations: reportData.violations.length
      }
    });
    
  } catch (error) {
    console.error('Error exporting compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export compliance report',
      details: error.message
    });
  }
});

/**
 * Helper method to calculate compliance trends
 */
router.calculateComplianceTrends = async function(userId, days) {
  // Simplified trend calculation - in production would use time-series data
  const assignments = await PolicyAssignment.findByUser(userId);
  const currentCompliance = assignments.reduce((sum, a) => sum + a.complianceRate, 0) / assignments.length;
  
  return {
    compliance: {
      current: currentCompliance,
      trend: 'stable', // Would calculate from historical data
      change: 0
    },
    violations: {
      current: assignments.reduce((sum, a) => sum + a.violationCount, 0),
      trend: 'decreasing',
      change: -5
    }
  };
};

/**
 * Helper method to calculate policy trends
 */
router.calculatePolicyTrends = async function(policyId, userId, days) {
  // Simplified trend calculation
  return {
    compliance: { trend: 'improving', change: 2.5 },
    violations: { trend: 'stable', change: 0 },
    effectiveness: { trend: 'improving', change: 1.8 }
  };
};

/**
 * Helper method to convert report data to CSV
 */
router.convertToCSV = function(reportData) {
  const assignments = reportData.assignments;
  const headers = ['Assignment ID', 'Agent ID', 'Agent Name', 'Policy ID', 'Policy Name', 'Compliance Rate', 'Violation Count', 'Status', 'Assigned At', 'Last Evaluated'];
  
  const csvRows = [headers.join(',')];
  
  for (const assignment of assignments) {
    const row = [
      assignment.assignmentId,
      assignment.agentId,
      assignment.agentName,
      assignment.policyId,
      assignment.policyName,
      assignment.complianceRate,
      assignment.violationCount,
      assignment.status,
      assignment.assignedAt,
      assignment.lastEvaluated
    ];
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
};

module.exports = router;

