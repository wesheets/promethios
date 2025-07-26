/**
 * Simple Validation Middleware
 * 
 * Basic request validation without external dependencies
 */

// Simple validation helpers
const validators = {
  isString: (value) => typeof value === 'string',
  isNumber: (value) => typeof value === 'number' && !isNaN(value),
  isBoolean: (value) => typeof value === 'boolean',
  isArray: (value) => Array.isArray(value),
  isObject: (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
  
  minLength: (value, min) => typeof value === 'string' && value.length >= min,
  maxLength: (value, max) => typeof value === 'string' && value.length <= max,
  
  isValidStatus: (value) => ['active', 'inactive', 'suspended', 'archived'].includes(value),
  isValidEnforcementLevel: (value) => ['strict', 'moderate', 'lenient', 'monitor'].includes(value),
  isValidAgentVersion: (value) => ['test', 'production'].includes(value),
  isValidPolicyCategory: (value) => ['SECURITY', 'COMPLIANCE', 'ETHICAL', 'OPERATIONAL', 'PERFORMANCE'].includes(value),
  
  inRange: (value, min, max) => typeof value === 'number' && value >= min && value <= max
};

// Simple validation middleware
const validateRequest = (validationRules) => {
  return (req, res, next) => {
    const errors = [];
    const data = req.body;

    // Basic validation - just check required fields exist
    if (validationRules.required) {
      for (const field of validationRules.required) {
        if (!data[field]) {
          errors.push({
            field: field,
            message: `${field} is required`,
            value: data[field]
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

// Query validation middleware
const validateQuery = (validationRules) => {
  return (req, res, next) => {
    // For now, just pass through - no complex query validation
    next();
  };
};

// Parameter validation middleware
const validateParams = (validationRules) => {
  return (req, res, next) => {
    const errors = [];
    const params = req.params;

    if (validationRules.required) {
      for (const field of validationRules.required) {
        if (!params[field]) {
          errors.push({
            field: field,
            message: `${field} parameter is required`,
            value: params[field]
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter validation failed',
        details: errors
      });
    }

    next();
  };
};

// Simple validation schemas (just basic required field checks)
const assignmentValidation = {
  create: { required: ['agentId', 'agentName', 'policyId', 'policyName'] },
  bulk: { required: ['assignments'] },
  update: { required: [] }, // No required fields for updates
  compliance: { required: ['complianceRate'] },
  suspend: { required: ['reason'] },
  query: { required: [] },
  complianceQuery: { required: [] },
  violationsQuery: { required: [] }
};

const policyValidation = {
  create: { required: ['name', 'category', 'rules'] },
  update: { required: [] }
};

// Common parameter schemas
const paramSchemas = {
  assignmentId: { required: ['assignmentId'] },
  agentId: { required: ['agentId'] },
  policyId: { required: ['policyId'] }
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
  
  // Common validations
  validateAssignmentId: validateParams(paramSchemas.assignmentId),
  validateAgentId: validateParams(paramSchemas.agentId),
  validatePolicyId: validateParams(paramSchemas.policyId),
  validateAssignmentQuery: validateQuery(assignmentValidation.query),
  validateComplianceQuery: validateQuery(assignmentValidation.complianceQuery),
  validateViolationsQuery: validateQuery(assignmentValidation.violationsQuery)
};

