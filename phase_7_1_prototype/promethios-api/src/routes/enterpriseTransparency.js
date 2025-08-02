/**
 * Enterprise Transparency Routes
 * Advanced audit operations, real-time monitoring, and compliance reporting APIs
 * Provides enterprise-grade transparency features for AI governance
 */

const express = require('express');
const router = express.Router();
const enterpriseTransparencyService = require('../services/enterpriseTransparencyService');
const agentIdentityService = require('../services/agentIdentityService');
const agentLogSegregationService = require('../services/agentLogSegregationService');
const auditService = require('../services/auditService');

// Middleware for request validation and logging
const validateRequest = (req, res, next) => {
  // Log API access for audit trail
  auditService.logEvent('api_access', req.user?.id || 'anonymous', {
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  next();
};

// Middleware for authentication (placeholder - integrate with existing auth)
const requireAuth = (req, res, next) => {
  // TODO: Integrate with existing Promethios authentication
  // For now, allow all requests for development
  req.user = { id: 'system', role: 'admin' };
  next();
};

// Middleware for role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * POST /api/enterprise-transparency/query
 * Execute advanced query with multiple filters and aggregations
 */
router.post('/query', validateRequest, requireAuth, async (req, res) => {
  try {
    const queryConfig = req.body;
    
    // Validate required fields
    if (!queryConfig || typeof queryConfig !== 'object') {
      return res.status(400).json({
        error: 'Invalid query configuration'
      });
    }
    
    // Execute advanced query
    const results = await enterpriseTransparencyService.executeAdvancedQuery(queryConfig);
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error executing advanced query:', error);
    res.status(500).json({
      error: 'Failed to execute advanced query',
      details: error.message
    });
  }
});

/**
 * GET /api/enterprise-transparency/query/templates
 * Get predefined query templates for common use cases
 */
router.get('/query/templates', validateRequest, requireAuth, async (req, res) => {
  try {
    const templates = {
      compliance_audit: {
        name: 'Compliance Audit Query',
        description: 'Query for compliance-related events with verification',
        config: {
          eventTypes: ['compliance_check', 'policy_enforcement', 'violation_detected'],
          verificationRequired: true,
          aggregations: [
            { type: 'compliance_metrics', name: 'compliance_summary' },
            { type: 'count_by', groupBy: 'eventType', name: 'event_breakdown' }
          ],
          includeProofs: true
        }
      },
      security_audit: {
        name: 'Security Audit Query',
        description: 'Query for security-related events and anomalies',
        config: {
          eventTypes: ['security_event', 'authentication', 'authorization', 'access_denied'],
          metadataFilters: {
            'security_level': { operator: 'greater_than', operand: 'medium' }
          },
          aggregations: [
            { type: 'agent_summary', name: 'agent_security_summary' },
            { type: 'time_series', interval: 'hour', name: 'security_timeline' }
          ]
        }
      },
      performance_analysis: {
        name: 'Performance Analysis Query',
        description: 'Query for performance metrics and response times',
        config: {
          eventTypes: ['request_processed', 'response_generated', 'task_completed'],
          aggregations: [
            { type: 'time_series', interval: 'hour', name: 'activity_timeline' },
            { type: 'count_by', groupBy: 'agentId', name: 'agent_activity' }
          ],
          sorting: { field: 'timestamp', order: 'desc' }
        }
      },
      data_access_audit: {
        name: 'Data Access Audit Query',
        description: 'Query for data access and processing events',
        config: {
          eventTypes: ['data_access', 'data_processing', 'data_export', 'data_deletion'],
          metadataFilters: {
            'data_classification': { operator: 'exists' }
          },
          verificationRequired: true,
          aggregations: [
            { type: 'count_by', groupBy: 'metadata.data_classification', name: 'data_classification_breakdown' },
            { type: 'unique_count', field: 'userId', name: 'unique_users' }
          ]
        }
      }
    };
    
    res.json({
      success: true,
      templates,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting query templates:', error);
    res.status(500).json({
      error: 'Failed to get query templates',
      details: error.message
    });
  }
});

/**
 * POST /api/enterprise-transparency/monitoring/start
 * Start real-time monitoring for agents or system
 */
router.post('/monitoring/start', validateRequest, requireAuth, requireRole(['admin', 'monitor']), async (req, res) => {
  try {
    const monitorConfig = req.body;
    
    // Validate required fields
    if (!monitorConfig.name) {
      return res.status(400).json({
        error: 'Missing required field: name'
      });
    }
    
    // Start monitoring
    const result = await enterpriseTransparencyService.startRealTimeMonitoring(monitorConfig);
    
    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error starting real-time monitoring:', error);
    res.status(500).json({
      error: 'Failed to start real-time monitoring',
      details: error.message
    });
  }
});

/**
 * POST /api/enterprise-transparency/monitoring/:monitorId/stop
 * Stop real-time monitoring
 */
router.post('/monitoring/:monitorId/stop', validateRequest, requireAuth, requireRole(['admin', 'monitor']), async (req, res) => {
  try {
    const { monitorId } = req.params;
    
    // Stop monitoring
    const result = await enterpriseTransparencyService.stopRealTimeMonitoring(monitorId);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error stopping real-time monitoring:', error);
    res.status(500).json({
      error: 'Failed to stop real-time monitoring',
      details: error.message
    });
  }
});

/**
 * GET /api/enterprise-transparency/monitoring
 * List active monitors
 */
router.get('/monitoring', validateRequest, requireAuth, async (req, res) => {
  try {
    const activeMonitors = Array.from(enterpriseTransparencyService.activeMonitors.values()).map(monitor => ({
      monitorId: monitor.monitorId,
      name: monitor.name,
      description: monitor.description,
      agentIds: monitor.agentIds,
      eventTypes: monitor.eventTypes,
      status: monitor.status,
      createdAt: monitor.createdAt,
      lastUpdate: monitor.lastUpdate,
      metrics: monitor.metrics
    }));
    
    res.json({
      success: true,
      data: {
        activeMonitors,
        total: activeMonitors.length,
        maxConcurrent: enterpriseTransparencyService.config.maxConcurrentMonitors
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error listing monitors:', error);
    res.status(500).json({
      error: 'Failed to list monitors',
      details: error.message
    });
  }
});

/**
 * GET /api/enterprise-transparency/monitoring/:monitorId
 * Get specific monitor details
 */
router.get('/monitoring/:monitorId', validateRequest, requireAuth, async (req, res) => {
  try {
    const { monitorId } = req.params;
    
    const monitor = enterpriseTransparencyService.activeMonitors.get(monitorId);
    
    if (!monitor) {
      return res.status(404).json({
        error: 'Monitor not found',
        monitorId
      });
    }
    
    res.json({
      success: true,
      data: monitor,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting monitor details:', error);
    res.status(500).json({
      error: 'Failed to get monitor details',
      details: error.message
    });
  }
});

/**
 * POST /api/enterprise-transparency/compliance/report
 * Generate compliance report using predefined templates
 */
router.post('/compliance/report', validateRequest, requireAuth, requireRole(['admin', 'auditor', 'compliance']), async (req, res) => {
  try {
    const { templateId, parameters = {}, customSections = [] } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        error: 'Missing required field: templateId'
      });
    }
    
    // Get report template
    const template = enterpriseTransparencyService.reportTemplates.get(templateId);
    
    if (!template) {
      return res.status(404).json({
        error: 'Report template not found',
        templateId,
        availableTemplates: Array.from(enterpriseTransparencyService.reportTemplates.keys())
      });
    }
    
    // Generate report
    const reportId = require('uuid').v4();
    const report = {
      reportId,
      templateId,
      templateName: template.name,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.id,
      parameters,
      sections: [],
      summary: {},
      cryptographicProof: null
    };
    
    // Execute queries for each section
    for (const section of template.sections) {
      try {
        const sectionQuery = this.buildSectionQuery(section, parameters);
        const sectionResults = await enterpriseTransparencyService.executeAdvancedQuery(sectionQuery);
        
        report.sections.push({
          name: section.name,
          query: sectionQuery,
          results: sectionResults,
          summary: this.generateSectionSummary(sectionResults)
        });
      } catch (sectionError) {
        console.error(`Error executing section ${section.name}:`, sectionError);
        report.sections.push({
          name: section.name,
          error: sectionError.message,
          results: null
        });
      }
    }
    
    // Add custom sections
    for (const customSection of customSections) {
      try {
        const customResults = await enterpriseTransparencyService.executeAdvancedQuery(customSection.query);
        report.sections.push({
          name: customSection.name,
          query: customSection.query,
          results: customResults,
          summary: this.generateSectionSummary(customResults),
          custom: true
        });
      } catch (customError) {
        console.error(`Error executing custom section ${customSection.name}:`, customError);
        report.sections.push({
          name: customSection.name,
          error: customError.message,
          results: null,
          custom: true
        });
      }
    }
    
    // Generate overall summary
    report.summary = this.generateReportSummary(report);
    
    // Generate cryptographic proof
    report.cryptographicProof = {
      reportHash: enterpriseTransparencyService.generateHash(JSON.stringify(report.sections)),
      timestamp: new Date().toISOString(),
      signature: null // Would be signed with enterprise key
    };
    
    // Store report
    enterpriseTransparencyService.complianceReports.set(reportId, report);
    
    res.status(201).json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      error: 'Failed to generate compliance report',
      details: error.message
    });
  }
});

/**
 * Build section query from template
 */
function buildSectionQuery(section, parameters) {
  const query = {
    agentIds: parameters.agentIds || [],
    eventTypes: [],
    metadataFilters: {},
    timeRange: {},
    verificationRequired: false,
    aggregations: [],
    includeProofs: true
  };
  
  // Process section queries
  for (const sectionQuery of section.queries) {
    switch (sectionQuery.type) {
      case 'event_filter':
        query.eventTypes.push(...sectionQuery.eventTypes);
        break;
      case 'time_range':
        if (sectionQuery.range === 'last_30_days') {
          query.timeRange.start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        } else if (sectionQuery.range === 'last_7_days') {
          query.timeRange.start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (parameters.startDate && parameters.endDate) {
          query.timeRange.start = parameters.startDate;
          query.timeRange.end = parameters.endDate;
        }
        break;
      case 'metadata_filter':
        if (sectionQuery.field && sectionQuery.required) {
          query.metadataFilters[sectionQuery.field] = { operator: 'exists' };
        }
        break;
      case 'verification_status':
        query.verificationRequired = true;
        break;
      case 'agent_filter':
        if (sectionQuery.roles) {
          // Filter agents by roles (would need agent metadata)
          query.metadataFilters['agent_role'] = { operator: 'in', operand: sectionQuery.roles };
        }
        break;
    }
  }
  
  // Add default aggregations
  query.aggregations.push(
    { type: 'count', name: 'total_events' },
    { type: 'compliance_metrics', name: 'compliance_summary' },
    { type: 'agent_summary', name: 'agent_breakdown' }
  );
  
  return query;
}

/**
 * Generate section summary
 */
function generateSectionSummary(results) {
  return {
    totalEvents: results.data?.length || 0,
    executionTime: results.metadata?.executionTime || 0,
    verificationPercentage: results.aggregations?.compliance_summary?.verificationPercentage || 0,
    compliancePercentage: results.aggregations?.compliance_summary?.compliancePercentage || 0,
    uniqueAgents: results.aggregations?.agent_breakdown?.length || 0
  };
}

/**
 * Generate report summary
 */
function generateReportSummary(report) {
  const summary = {
    totalSections: report.sections.length,
    successfulSections: report.sections.filter(s => !s.error).length,
    failedSections: report.sections.filter(s => s.error).length,
    totalEvents: 0,
    overallCompliancePercentage: 0,
    overallVerificationPercentage: 0
  };
  
  const successfulSections = report.sections.filter(s => !s.error);
  
  if (successfulSections.length > 0) {
    summary.totalEvents = successfulSections.reduce((sum, s) => sum + (s.summary?.totalEvents || 0), 0);
    summary.overallCompliancePercentage = successfulSections.reduce((sum, s) => sum + (s.summary?.compliancePercentage || 0), 0) / successfulSections.length;
    summary.overallVerificationPercentage = successfulSections.reduce((sum, s) => sum + (s.summary?.verificationPercentage || 0), 0) / successfulSections.length;
  }
  
  return summary;
}

/**
 * GET /api/enterprise-transparency/compliance/templates
 * Get available compliance report templates
 */
router.get('/compliance/templates', validateRequest, requireAuth, async (req, res) => {
  try {
    const templates = {};
    
    for (const [templateId, template] of enterpriseTransparencyService.reportTemplates.entries()) {
      templates[templateId] = {
        templateId: template.templateId,
        name: template.name,
        description: template.description,
        sections: template.sections.map(s => ({ name: s.name })),
        outputFormat: template.outputFormat
      };
    }
    
    res.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting compliance templates:', error);
    res.status(500).json({
      error: 'Failed to get compliance templates',
      details: error.message
    });
  }
});

/**
 * GET /api/enterprise-transparency/compliance/reports
 * List generated compliance reports
 */
router.get('/compliance/reports', validateRequest, requireAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, templateId } = req.query;
    
    let reports = Array.from(enterpriseTransparencyService.complianceReports.values());
    
    // Filter by template if specified
    if (templateId) {
      reports = reports.filter(r => r.templateId === templateId);
    }
    
    // Sort by generation date (newest first)
    reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    
    // Apply pagination
    const paginatedReports = reports.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    // Return summary information only
    const reportSummaries = paginatedReports.map(report => ({
      reportId: report.reportId,
      templateId: report.templateId,
      templateName: report.templateName,
      generatedAt: report.generatedAt,
      generatedBy: report.generatedBy,
      summary: report.summary
    }));
    
    res.json({
      success: true,
      data: {
        reports: reportSummaries,
        total: reports.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error listing compliance reports:', error);
    res.status(500).json({
      error: 'Failed to list compliance reports',
      details: error.message
    });
  }
});

/**
 * GET /api/enterprise-transparency/compliance/reports/:reportId
 * Get specific compliance report
 */
router.get('/compliance/reports/:reportId', validateRequest, requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = enterpriseTransparencyService.complianceReports.get(reportId);
    
    if (!report) {
      return res.status(404).json({
        error: 'Compliance report not found',
        reportId
      });
    }
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting compliance report:', error);
    res.status(500).json({
      error: 'Failed to get compliance report',
      details: error.message
    });
  }
});

/**
 * GET /api/enterprise-transparency/stats
 * Get enterprise transparency service statistics
 */
router.get('/stats', validateRequest, requireAuth, async (req, res) => {
  try {
    const stats = await enterpriseTransparencyService.getTransparencyStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting transparency stats:', error);
    res.status(500).json({
      error: 'Failed to get transparency stats',
      details: error.message
    });
  }
});

/**
 * GET /api/enterprise-transparency/health
 * Health check for enterprise transparency service
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await enterpriseTransparencyService.getTransparencyStats();
    
    const health = {
      status: stats.error ? 'error' : 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0',
      services: {
        transparency: {
          status: stats.error ? 'error' : 'operational',
          activeMonitors: stats.activeMonitors || 0,
          totalQueries: stats.totalQueries || 0,
          systemHealth: stats.systemHealth || {}
        }
      }
    };
    
    const statusCode = health.status === 'operational' ? 200 : 503;
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('Error checking transparency service health:', error);
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Enterprise transparency API error:', error);
  
  res.status(500).json({
    error: 'Internal server error in enterprise transparency system',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Contact administrator'
  });
});

module.exports = router;

