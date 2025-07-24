/**
 * Policy Enforcement Middleware
 * 
 * Real-time policy enforcement system that intercepts agent requests,
 * evaluates policy rules, and enforces governance decisions.
 */

const PolicyAssignment = require('../models/PolicyAssignment');
const { logActivity } = require('./logging');

/**
 * Policy Rule Evaluator
 * Evaluates policy conditions against agent request context
 */
class PolicyRuleEvaluator {
  constructor() {
    this.conditionEvaluators = {
      // Trust score conditions
      'trust_score': (value, operator, threshold) => this.compareValues(value, operator, threshold),
      'confidence_score': (value, operator, threshold) => this.compareValues(value, operator, threshold),
      
      // Content conditions
      'contains_personal_info': (content) => this.detectPersonalInfo(content),
      'contains_sensitive_data': (content) => this.detectSensitiveData(content),
      'contains_harmful_content': (content) => this.detectHarmfulContent(content),
      'contains_bias': (content) => this.detectBias(content),
      
      // Operational conditions
      'response_time': (value, operator, threshold) => this.compareValues(value, operator, threshold),
      'error_rate': (value, operator, threshold) => this.compareValues(value, operator, threshold),
      'resource_usage': (value, operator, threshold) => this.compareValues(value, operator, threshold),
      
      // Compliance conditions
      'user_consent_given': (context) => this.checkUserConsent(context),
      'data_retention_compliant': (context) => this.checkDataRetention(context),
      'jurisdiction_allowed': (context) => this.checkJurisdiction(context),
      
      // Custom conditions
      'custom_rule': (context, rule) => this.evaluateCustomRule(context, rule)
    };
  }

  /**
   * Evaluate a policy rule against request context
   */
  async evaluateRule(rule, context) {
    try {
      const { condition, enabled } = rule;
      
      if (!enabled) {
        return { passed: true, reason: 'Rule disabled' };
      }

      // Parse condition string (e.g., "trust_score < 0.7")
      const conditionResult = await this.parseAndEvaluateCondition(condition, context);
      
      return {
        passed: conditionResult,
        rule: rule,
        context: context,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Error evaluating rule:', error);
      return {
        passed: false,
        error: error.message,
        rule: rule
      };
    }
  }

  /**
   * Parse and evaluate condition string
   */
  async parseAndEvaluateCondition(condition, context) {
    // Handle different condition formats
    if (condition.includes('<') || condition.includes('>') || condition.includes('=')) {
      return this.evaluateComparisonCondition(condition, context);
    } else if (condition.includes('contains')) {
      return this.evaluateContainsCondition(condition, context);
    } else if (condition.includes('is_')) {
      return this.evaluateBooleanCondition(condition, context);
    } else {
      // Custom condition evaluation
      return this.evaluateCustomCondition(condition, context);
    }
  }

  /**
   * Evaluate comparison conditions (e.g., "trust_score < 0.7")
   */
  evaluateComparisonCondition(condition, context) {
    const match = condition.match(/(\w+)\s*([<>=!]+)\s*([\d.]+)/);
    if (!match) return false;

    const [, field, operator, threshold] = match;
    const value = this.getContextValue(field, context);
    
    return this.compareValues(value, operator, parseFloat(threshold));
  }

  /**
   * Evaluate contains conditions (e.g., "contains_personal_info")
   */
  evaluateContainsCondition(condition, context) {
    const content = context.request?.content || context.response?.content || '';
    
    if (condition.includes('personal_info')) {
      return this.detectPersonalInfo(content);
    } else if (condition.includes('sensitive_data')) {
      return this.detectSensitiveData(content);
    } else if (condition.includes('harmful_content')) {
      return this.detectHarmfulContent(content);
    } else if (condition.includes('bias')) {
      return this.detectBias(content);
    }
    
    return false;
  }

  /**
   * Evaluate boolean conditions (e.g., "is_compliant")
   */
  evaluateBooleanCondition(condition, context) {
    if (condition.includes('user_consent')) {
      return this.checkUserConsent(context);
    } else if (condition.includes('data_retention')) {
      return this.checkDataRetention(context);
    } else if (condition.includes('jurisdiction')) {
      return this.checkJurisdiction(context);
    }
    
    return false;
  }

  /**
   * Evaluate custom conditions
   */
  evaluateCustomCondition(condition, context) {
    // Allow for custom JavaScript evaluation (with safety measures)
    try {
      // Create a safe evaluation context
      const safeContext = {
        trust_score: context.metrics?.trust_score || 1.0,
        confidence_score: context.metrics?.confidence_score || 1.0,
        response_time: context.metrics?.response_time || 0,
        error_rate: context.metrics?.error_rate || 0,
        content: context.request?.content || '',
        user_id: context.user?.id || '',
        agent_id: context.agent?.id || ''
      };
      
      // Simple condition evaluation (extend as needed)
      return Function('context', `return ${condition}`)(safeContext);
    } catch (error) {
      console.warn('Custom condition evaluation failed:', error);
      return false;
    }
  }

  /**
   * Compare values with operators
   */
  compareValues(value, operator, threshold) {
    switch (operator) {
      case '<': return value < threshold;
      case '<=': return value <= threshold;
      case '>': return value > threshold;
      case '>=': return value >= threshold;
      case '==': return value == threshold;
      case '===': return value === threshold;
      case '!=': return value != threshold;
      case '!==': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Get value from context by field name
   */
  getContextValue(field, context) {
    const fieldMap = {
      'trust_score': context.metrics?.trust_score || 1.0,
      'confidence_score': context.metrics?.confidence_score || 1.0,
      'response_time': context.metrics?.response_time || 0,
      'error_rate': context.metrics?.error_rate || 0,
      'resource_usage': context.metrics?.resource_usage || 0
    };
    
    return fieldMap[field] || 0;
  }

  /**
   * Detect personal information in content
   */
  detectPersonalInfo(content) {
    const patterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, // Phone number
      /\b\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\b/i // Address
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect sensitive data in content
   */
  detectSensitiveData(content) {
    const sensitiveKeywords = [
      'password', 'secret', 'token', 'api_key', 'private_key',
      'confidential', 'classified', 'restricted', 'internal'
    ];
    
    const lowerContent = content.toLowerCase();
    return sensitiveKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Detect harmful content
   */
  detectHarmfulContent(content) {
    const harmfulPatterns = [
      /\b(violence|violent|kill|murder|harm|hurt|attack)\b/i,
      /\b(hate|racism|discrimination|prejudice)\b/i,
      /\b(illegal|fraud|scam|cheat)\b/i,
      /\b(explicit|inappropriate|offensive)\b/i
    ];
    
    return harmfulPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect potential bias in content
   */
  detectBias(content) {
    const biasPatterns = [
      /\b(all|every|always|never)\s+(men|women|people|users)\s+(are|do|have)\b/i,
      /\b(typical|normal|standard)\s+(male|female|person)\b/i,
      /\b(obviously|clearly|naturally)\s+(better|worse|superior|inferior)\b/i
    ];
    
    return biasPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check user consent
   */
  checkUserConsent(context) {
    return context.user?.consent_given === true;
  }

  /**
   * Check data retention compliance
   */
  checkDataRetention(context) {
    const retentionPeriod = context.policy?.data_retention_days || 365;
    const dataAge = context.data?.age_days || 0;
    return dataAge <= retentionPeriod;
  }

  /**
   * Check jurisdiction compliance
   */
  checkJurisdiction(context) {
    const allowedJurisdictions = context.policy?.allowed_jurisdictions || ['US', 'EU'];
    const userJurisdiction = context.user?.jurisdiction || 'US';
    return allowedJurisdictions.includes(userJurisdiction);
  }
}

/**
 * Policy Enforcement Engine
 * Main enforcement logic that coordinates rule evaluation and action execution
 */
class PolicyEnforcementEngine {
  constructor() {
    this.evaluator = new PolicyRuleEvaluator();
    this.violationCache = new Map();
  }

  /**
   * Enforce policies for an agent request
   */
  async enforcePolicy(agentId, context, userId) {
    try {
      // Get active policy assignments for the agent
      const assignments = await PolicyAssignment.findByAgent(agentId, false)
        .where('userId').equals(userId);

      if (assignments.length === 0) {
        return {
          allowed: true,
          reason: 'No policies assigned',
          violations: []
        };
      }

      const violations = [];
      let highestAction = 'allow';
      let blockingViolation = null;

      // Evaluate each assigned policy
      for (const assignment of assignments) {
        const policyViolations = await this.evaluatePolicy(assignment, context);
        violations.push(...policyViolations);

        // Determine the most restrictive action
        for (const violation of policyViolations) {
          const action = violation.rule.action;
          if (this.getActionPriority(action) > this.getActionPriority(highestAction)) {
            highestAction = action;
            if (action === 'deny') {
              blockingViolation = violation;
            }
          }
        }
      }

      // Update compliance rates
      await this.updateComplianceRates(assignments, violations);

      // Log violations
      if (violations.length > 0) {
        await this.logViolations(agentId, violations, context);
      }

      return {
        allowed: highestAction !== 'deny',
        action: highestAction,
        violations,
        blockingViolation,
        totalPolicies: assignments.length,
        violatedPolicies: violations.length
      };

    } catch (error) {
      console.error('Policy enforcement error:', error);
      return {
        allowed: true, // Fail open for safety
        error: error.message,
        violations: []
      };
    }
  }

  /**
   * Evaluate a single policy against context
   */
  async evaluatePolicy(assignment, context) {
    const violations = [];
    
    // Get policy rules (this would typically come from the policy document)
    const policy = await this.getPolicyRules(assignment.policyId);
    
    if (!policy || !policy.rules) {
      return violations;
    }

    // Evaluate each rule
    for (const rule of policy.rules) {
      if (!rule.enabled) continue;

      const evaluation = await this.evaluator.evaluateRule(rule, context);
      
      if (!evaluation.passed) {
        violations.push({
          assignmentId: assignment.assignmentId,
          policyId: assignment.policyId,
          policyName: assignment.policyName,
          rule: rule,
          evaluation: evaluation,
          severity: rule.severity || 'medium',
          timestamp: new Date()
        });
      }
    }

    return violations;
  }

  /**
   * Get policy rules (placeholder - would integrate with policy storage)
   */
  async getPolicyRules(policyId) {
    // This would typically fetch from the policy database
    // For now, return some example rules based on policy type
    const defaultPolicies = {
      'security_policy': {
        rules: [
          {
            id: 'block_personal_info',
            name: 'Block Personal Information',
            condition: 'contains_personal_info',
            action: 'deny',
            severity: 'high',
            enabled: true
          },
          {
            id: 'low_trust_warning',
            name: 'Low Trust Score Warning',
            condition: 'trust_score < 0.7',
            action: 'warn',
            severity: 'medium',
            enabled: true
          }
        ]
      },
      'compliance_policy': {
        rules: [
          {
            id: 'user_consent_required',
            name: 'User Consent Required',
            condition: 'user_consent_given',
            action: 'deny',
            severity: 'high',
            enabled: true
          },
          {
            id: 'data_retention_check',
            name: 'Data Retention Compliance',
            condition: 'data_retention_compliant',
            action: 'log',
            severity: 'medium',
            enabled: true
          }
        ]
      },
      'content_safety_policy': {
        rules: [
          {
            id: 'harmful_content_block',
            name: 'Block Harmful Content',
            condition: 'contains_harmful_content',
            action: 'deny',
            severity: 'critical',
            enabled: true
          },
          {
            id: 'bias_detection',
            name: 'Bias Detection',
            condition: 'contains_bias',
            action: 'warn',
            severity: 'medium',
            enabled: true
          }
        ]
      }
    };

    return defaultPolicies[policyId] || { rules: [] };
  }

  /**
   * Get action priority for determining most restrictive action
   */
  getActionPriority(action) {
    const priorities = {
      'allow': 0,
      'log': 1,
      'warn': 2,
      'deny': 3
    };
    return priorities[action] || 0;
  }

  /**
   * Update compliance rates for assignments
   */
  async updateComplianceRates(assignments, violations) {
    const violationsByAssignment = new Map();
    
    // Group violations by assignment
    for (const violation of violations) {
      const assignmentId = violation.assignmentId;
      if (!violationsByAssignment.has(assignmentId)) {
        violationsByAssignment.set(assignmentId, []);
      }
      violationsByAssignment.get(assignmentId).push(violation);
    }

    // Update each assignment
    for (const assignment of assignments) {
      const assignmentViolations = violationsByAssignment.get(assignment.assignmentId) || [];
      const violationCount = assignmentViolations.length;
      
      // Calculate new compliance rate (simple approach - can be enhanced)
      const currentRate = assignment.complianceRate || 1.0;
      const newRate = violationCount > 0 ? Math.max(0, currentRate - (violationCount * 0.1)) : Math.min(1.0, currentRate + 0.01);
      
      await assignment.updateCompliance(newRate, assignment.violationCount + violationCount);
    }
  }

  /**
   * Log policy violations
   */
  async logViolations(agentId, violations, context) {
    for (const violation of violations) {
      await logActivity(null, 'policy_violation', {
        agentId,
        assignmentId: violation.assignmentId,
        policyId: violation.policyId,
        ruleId: violation.rule.id,
        severity: violation.severity,
        action: violation.rule.action,
        context: {
          request: context.request?.content?.substring(0, 200),
          user: context.user?.id,
          timestamp: violation.timestamp
        }
      });
    }
  }
}

// Global enforcement engine instance
const enforcementEngine = new PolicyEnforcementEngine();

/**
 * Express middleware for policy enforcement
 */
const policyEnforcementMiddleware = (options = {}) => {
  return async (req, res, next) => {
    try {
      // Skip enforcement for certain routes
      const skipRoutes = options.skipRoutes || ['/health', '/api/health', '/api/policy-assignments'];
      if (skipRoutes.some(route => req.path.startsWith(route))) {
        return next();
      }

      // Extract agent ID from request
      const agentId = req.headers['x-agent-id'] || req.query.agentId || req.body.agentId;
      if (!agentId) {
        return next(); // No agent ID, skip enforcement
      }

      // Extract user ID from authentication
      const userId = req.user?.uid;
      if (!userId) {
        return next(); // No user context, skip enforcement
      }

      // Build enforcement context
      const context = {
        request: {
          method: req.method,
          path: req.path,
          content: JSON.stringify(req.body),
          headers: req.headers,
          query: req.query
        },
        user: {
          id: userId,
          consent_given: req.user?.consent_given || false,
          jurisdiction: req.user?.jurisdiction || 'US'
        },
        agent: {
          id: agentId,
          version: req.headers['x-agent-version'] || 'production'
        },
        metrics: {
          trust_score: parseFloat(req.headers['x-trust-score']) || 1.0,
          confidence_score: parseFloat(req.headers['x-confidence-score']) || 1.0,
          response_time: parseFloat(req.headers['x-response-time']) || 0,
          error_rate: parseFloat(req.headers['x-error-rate']) || 0
        },
        timestamp: new Date()
      };

      // Enforce policies
      const enforcement = await enforcementEngine.enforcePolicy(agentId, context, userId);

      // Handle enforcement result
      if (!enforcement.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Request blocked by policy',
          violation: enforcement.blockingViolation,
          policy: enforcement.blockingViolation?.policyName,
          rule: enforcement.blockingViolation?.rule?.name,
          action: enforcement.action
        });
      }

      // Add enforcement info to request for downstream use
      req.policyEnforcement = enforcement;

      // Log warnings if any
      if (enforcement.violations.length > 0) {
        const warnings = enforcement.violations.filter(v => v.rule.action === 'warn');
        if (warnings.length > 0) {
          res.setHeader('X-Policy-Warnings', warnings.length.toString());
        }
      }

      next();

    } catch (error) {
      console.error('Policy enforcement middleware error:', error);
      // Fail open - allow request to proceed
      next();
    }
  };
};

module.exports = {
  PolicyRuleEvaluator,
  PolicyEnforcementEngine,
  policyEnforcementMiddleware,
  enforcementEngine
};

