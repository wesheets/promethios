/**
 * Validation Middleware
 * 
 * Request validation schemas and middleware for policy assignment endpoints
 */

const Joi = require('joi');

// Base validation schemas
const baseSchemas = {
  objectId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).message('Invalid ObjectId format'),
  agentId: Joi.string().min(1).max(100).required(),
  policyId: Joi.string().min(1).max(100).required(),
  assignmentId: Joi.string().min(1).max(200),
  status: Joi.string().valid('active', 'inactive', 'suspended', 'archived'),
  enforcementLevel: Joi.string().valid('strict', 'moderate', 'lenient', 'monitor'),
  complianceRate: Joi.number().min(0).max(1),
  priority: Joi.number().integer().min(1).max(10),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  notes: Joi.string().max(1000).allow(''),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    sortBy: Joi.string().valid('assignedAt', 'complianceRate', 'agentId', 'policyId', 'status').default('assignedAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }
};

// Policy assignment validation schemas
const assignmentValidation = {
  // Create assignment validation
  create: Joi.object({
    agentId: baseSchemas.agentId,
    agentName: Joi.string().min(1).max(200).required(),
    agentVersion: Joi.string().valid('test', 'production').default('production'),
    policyId: baseSchemas.policyId,
    policyName: Joi.string().min(1).max(200).required(),
    policyVersion: Joi.string().max(20).default('1.0.0'),
    status: baseSchemas.status.default('active'),
    priority: baseSchemas.priority.default(5),
    enforcementLevel: baseSchemas.enforcementLevel.default('moderate'),
    metadata: baseSchemas.metadata.default({}),
    tags: baseSchemas.tags.default([]),
    notes: baseSchemas.notes.default('')
  }),

  // Bulk create validation
  bulk: Joi.object({
    assignments: Joi.array().items(
      Joi.object({
        agentId: baseSchemas.agentId,
        agentName: Joi.string().min(1).max(200).required(),
        agentVersion: Joi.string().valid('test', 'production').default('production'),
        policyId: baseSchemas.policyId,
        policyName: Joi.string().min(1).max(200).required(),
        policyVersion: Joi.string().max(20).default('1.0.0'),
        status: baseSchemas.status.default('active'),
        priority: baseSchemas.priority.default(5),
        enforcementLevel: baseSchemas.enforcementLevel.default('moderate'),
        metadata: baseSchemas.metadata.default({}),
        tags: baseSchemas.tags.default([]),
        notes: baseSchemas.notes.default('')
      })
    ).min(1).max(50).required()
  }),

  // Update assignment validation
  update: Joi.object({
    agentName: Joi.string().min(1).max(200),
    agentVersion: Joi.string().valid('test', 'production'),
    policyName: Joi.string().min(1).max(200),
    policyVersion: Joi.string().max(20),
    status: baseSchemas.status,
    priority: baseSchemas.priority,
    enforcementLevel: baseSchemas.enforcementLevel,
    metadata: baseSchemas.metadata,
    tags: baseSchemas.tags,
    notes: baseSchemas.notes
  }).min(1), // At least one field must be provided

  // Compliance update validation
  compliance: Joi.object({
    complianceRate: baseSchemas.complianceRate.required(),
    violationCount: Joi.number().integer().min(0)
  }),

  // Suspend assignment validation
  suspend: Joi.object({
    reason: Joi.string().min(1).max(500).required()
  }),

  // Query parameters validation
  query: Joi.object({
    agentId: Joi.string().min(1).max(100),
    policyId: Joi.string().min(1).max(100),
    status: baseSchemas.status,
    includeInactive: Joi.boolean().default(false),
    ...baseSchemas.pagination
  }),

  // Compliance query validation
  complianceQuery: Joi.object({
    threshold: Joi.number().min(0).max(1).default(0.7)
  }),

  // Violations query validation
  violationsQuery: Joi.object({
    days: Joi.number().integer().min(1).max(365).default(7)
  })
};

// Policy validation schemas (for policy endpoints)
const policyValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).allow(''),
    category: Joi.string().valid('SECURITY', 'COMPLIANCE', 'ETHICAL', 'OPERATIONAL', 'PERFORMANCE').required(),
    version: Joi.string().max(20).default('1.0.0'),
    status: Joi.string().valid('draft', 'active', 'deprecated', 'archived').default('draft'),
    rules: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().min(1).max(200).required(),
        description: Joi.string().max(500).allow(''),
        condition: Joi.string().min(1).required(),
        action: Joi.string().valid('allow', 'deny', 'warn', 'log').required(),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
        enabled: Joi.boolean().default(true)
      })
    ).min(1).required(),
    metadata: baseSchemas.metadata.default({}),
    tags: baseSchemas.tags.default([])
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(200),
    description: Joi.string().max(1000).allow(''),
    category: Joi.string().valid('SECURITY', 'COMPLIANCE', 'ETHICAL', 'OPERATIONAL', 'PERFORMANCE'),
    version: Joi.string().max(20),
    status: Joi.string().valid('draft', 'active', 'deprecated', 'archived'),
    rules: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().min(1).max(200).required(),
        description: Joi.string().max(500).allow(''),
        condition: Joi.string().min(1).required(),
        action: Joi.string().valid('allow', 'deny', 'warn', 'log').required(),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
        enabled: Joi.boolean().default(true)
      })
    ).min(1),
    metadata: baseSchemas.metadata,
    tags: baseSchemas.tags
  }).min(1)
};

// Validation middleware function
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errorDetails
      });
    }

    // Replace req.query with validated and sanitized data
    req.query = value;
    next();
  };
};

// Parameter validation middleware
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Parameter validation failed',
        details: errorDetails
      });
    }

    // Replace req.params with validated and sanitized data
    req.params = value;
    next();
  };
};

// Common parameter schemas
const paramSchemas = {
  assignmentId: Joi.object({
    assignmentId: Joi.string().min(1).max(200).required()
  }),
  agentId: Joi.object({
    agentId: baseSchemas.agentId
  }),
  policyId: Joi.object({
    policyId: baseSchemas.policyId
  })
};

// Export validation schemas and middleware
module.exports = {
  // Validation functions
  validateRequest,
  validateQuery,
  validateParams,
  
  // Schemas
  assignmentValidation,
  policyValidation,
  paramSchemas,
  baseSchemas,
  
  // Common validations
  validateAssignmentId: validateParams(paramSchemas.assignmentId),
  validateAgentId: validateParams(paramSchemas.agentId),
  validatePolicyId: validateParams(paramSchemas.policyId),
  validateAssignmentQuery: validateQuery(assignmentValidation.query),
  validateComplianceQuery: validateQuery(assignmentValidation.complianceQuery),
  validateViolationsQuery: validateQuery(assignmentValidation.violationsQuery)
};

