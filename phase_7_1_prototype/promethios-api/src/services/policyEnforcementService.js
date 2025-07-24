/**
 * Policy Enforcement Service
 * 
 * Enforces governance policies during agent execution to ensure compliance,
 * security, and operational standards. Integrates with stored policies from
 * Firebase/UnifiedStorage to provide real-time policy enforcement.
 */

const axios = require('axios');

class PolicyEnforcementService {
  constructor() {
    this.policies = new Map(); // Cache for loaded policies
    this.violations = []; // Track policy violations
    this.enforcementStats = {
      totalChecks: 0,
      violations: 0,
      blocked: 0,
      warnings: 0
    };
    
    // Policy evaluation cache (TTL: 5 minutes)
    this.evaluationCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
    
    console.log('🛡️ PolicyEnforcementService initialized');
  }

  /**
   * Load policies for a specific user
   */
  async loadUserPolicies(userId) {
    try {
      console.log(`📋 Loading policies for user: ${userId}`);
      
      // In production, this would load from the policies API
      // For now, we'll simulate with the backend API
      const response = await axios.get(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/promethios-policy/policies`, {
        headers: { 'X-User-ID': userId }
      });
      
      const userPolicies = response.data.filter(policy => 
        policy.status === 'active' && 
        policy.user_id === userId
      );
      
      // Cache policies by user
      this.policies.set(userId, userPolicies);
      
      console.log(`✅ Loaded ${userPolicies.length} active policies for user ${userId}`);
      return userPolicies;
    } catch (error) {
      console.warn(`⚠️ Failed to load policies for user ${userId}:`, error.message);
      
      // Return default policies if loading fails
      return this.getDefaultPolicies();
    }
  }

  /**
   * Get default policies when user policies can't be loaded
   */
  getDefaultPolicies() {
    return [
      {
        policy_id: 'default_security',
        name: 'Default Security Policy',
        category: 'security',
        rules: [
          {
            id: 'no_external_api',
            condition: 'action.type === "external_api_call"',
            action: 'deny',
            message: 'External API calls require explicit security policy'
          }
        ]
      },
      {
        policy_id: 'default_data',
        name: 'Default Data Policy',
        category: 'compliance',
        rules: [
          {
            id: 'pii_protection',
            condition: 'data.contains_pii === true',
            action: 'log',
            message: 'PII data access logged for compliance'
          }
        ]
      }
    ];
  }

  /**
   * Evaluate if an agent action is allowed by policies
   */
  async evaluateAction(userId, agentId, action, context = {}) {
    this.enforcementStats.totalChecks++;
    
    try {
      // Create cache key
      const cacheKey = `${userId}:${agentId}:${JSON.stringify(action)}`;
      
      // Check cache first
      if (this.evaluationCache.has(cacheKey)) {
        const cached = this.evaluationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.result;
        }
        this.evaluationCache.delete(cacheKey);
      }
      
      // Load user policies if not cached
      let userPolicies = this.policies.get(userId);
      if (!userPolicies) {
        userPolicies = await this.loadUserPolicies(userId);
      }
      
      const evaluationResult = {
        allowed: true,
        violations: [],
        warnings: [],
        blockedBy: [],
        metadata: {
          evaluatedAt: new Date().toISOString(),
          policiesChecked: userPolicies.length,
          agentId,
          action: action.type || 'unknown'
        }
      };
      
      // Evaluate each policy
      for (const policy of userPolicies) {
        const policyResult = await this.evaluatePolicy(policy, action, context);
        
        if (policyResult.violations.length > 0) {
          evaluationResult.violations.push(...policyResult.violations);
        }
        
        if (policyResult.warnings.length > 0) {
          evaluationResult.warnings.push(...policyResult.warnings);
        }
        
        if (policyResult.blocked) {
          evaluationResult.allowed = false;
          evaluationResult.blockedBy.push(policy.policy_id);
        }
      }
      
      // Update stats
      if (evaluationResult.violations.length > 0) {
        this.enforcementStats.violations++;
      }
      
      if (!evaluationResult.allowed) {
        this.enforcementStats.blocked++;
      }
      
      if (evaluationResult.warnings.length > 0) {
        this.enforcementStats.warnings++;
      }
      
      // Cache result
      this.evaluationCache.set(cacheKey, {
        result: evaluationResult,
        timestamp: Date.now()
      });
      
      // Log significant events
      if (!evaluationResult.allowed || evaluationResult.violations.length > 0) {
        await this.logPolicyEvent(userId, agentId, action, evaluationResult);
      }
      
      return evaluationResult;
      
    } catch (error) {
      console.error('❌ Policy evaluation error:', error);
      
      // Fail-safe: allow action but log error
      return {
        allowed: true,
        violations: [],
        warnings: [`Policy evaluation failed: ${error.message}`],
        blockedBy: [],
        metadata: {
          evaluationError: true,
          error: error.message
        }
      };
    }
  }

  /**
   * Evaluate a single policy against an action
   */
  async evaluatePolicy(policy, action, context) {
    const result = {
      violations: [],
      warnings: [],
      blocked: false
    };
    
    try {
      // Evaluate each rule in the policy
      for (const rule of policy.rules || []) {
        const ruleResult = await this.evaluateRule(rule, action, context);
        
        if (ruleResult.triggered) {
          switch (rule.action) {
            case 'deny':
            case 'block':
              result.blocked = true;
              result.violations.push({
                policyId: policy.policy_id,
                policyName: policy.name,
                ruleId: rule.id,
                ruleName: rule.name || rule.id,
                message: rule.message || 'Action blocked by policy',
                severity: 'high',
                category: policy.category
              });
              break;
              
            case 'warn':
            case 'log':
              result.warnings.push({
                policyId: policy.policy_id,
                policyName: policy.name,
                ruleId: rule.id,
                ruleName: rule.name || rule.id,
                message: rule.message || 'Action flagged by policy',
                severity: 'medium',
                category: policy.category
              });
              break;
              
            case 'escalate':
              result.violations.push({
                policyId: policy.policy_id,
                policyName: policy.name,
                ruleId: rule.id,
                ruleName: rule.name || rule.id,
                message: rule.message || 'Action requires escalation',
                severity: 'high',
                category: policy.category,
                requiresEscalation: true
              });
              break;
          }
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Error evaluating policy ${policy.policy_id}:`, error);
      result.warnings.push({
        policyId: policy.policy_id,
        message: `Policy evaluation error: ${error.message}`,
        severity: 'low'
      });
    }
    
    return result;
  }

  /**
   * Evaluate a single rule against an action
   */
  async evaluateRule(rule, action, context) {
    try {
      // Create evaluation context
      const evalContext = {
        action,
        context,
        agent: context.agent || {},
        user: context.user || {},
        data: context.data || {},
        timestamp: Date.now(),
        // Helper functions
        contains: (str, substring) => str && str.toLowerCase().includes(substring.toLowerCase()),
        matches: (str, pattern) => str && new RegExp(pattern, 'i').test(str),
        hasProperty: (obj, prop) => obj && obj.hasOwnProperty(prop)
      };
      
      // Evaluate condition
      let triggered = false;
      
      if (rule.condition) {
        // Simple condition evaluation (in production, use a safer evaluator)
        try {
          // Replace context variables in condition
          let condition = rule.condition;
          condition = condition.replace(/action\./g, 'evalContext.action.');
          condition = condition.replace(/context\./g, 'evalContext.context.');
          condition = condition.replace(/data\./g, 'evalContext.data.');
          condition = condition.replace(/agent\./g, 'evalContext.agent.');
          condition = condition.replace(/user\./g, 'evalContext.user.');
          
          // Evaluate condition safely
          triggered = this.safeEvaluate(condition, evalContext);
        } catch (error) {
          console.warn(`⚠️ Rule condition evaluation error: ${error.message}`);
          triggered = false;
        }
      }
      
      // Check pattern matching
      if (rule.patterns && action.type) {
        for (const pattern of rule.patterns) {
          if (new RegExp(pattern, 'i').test(action.type)) {
            triggered = true;
            break;
          }
        }
      }
      
      // Check specific action types
      if (rule.actionTypes && rule.actionTypes.includes(action.type)) {
        triggered = true;
      }
      
      return { triggered };
      
    } catch (error) {
      console.warn(`⚠️ Rule evaluation error: ${error.message}`);
      return { triggered: false };
    }
  }

  /**
   * Safe evaluation of conditions (basic implementation)
   */
  safeEvaluate(condition, context) {
    // This is a simplified evaluator. In production, use a proper
    // expression evaluator like expr-eval or implement a custom parser
    
    try {
      // Basic safety checks
      if (condition.includes('require(') || 
          condition.includes('import(') || 
          condition.includes('eval(') ||
          condition.includes('Function(')) {
        throw new Error('Unsafe condition detected');
      }
      
      // Create a safe evaluation function
      const func = new Function('evalContext', `
        with (evalContext) {
          return ${condition};
        }
      `);
      
      return Boolean(func(context));
    } catch (error) {
      console.warn(`⚠️ Safe evaluation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Log policy enforcement events
   */
  async logPolicyEvent(userId, agentId, action, evaluationResult) {
    const event = {
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      agentId,
      action: {
        type: action.type,
        parameters: action.parameters || {},
        metadata: action.metadata || {}
      },
      result: {
        allowed: evaluationResult.allowed,
        violations: evaluationResult.violations,
        warnings: evaluationResult.warnings,
        blockedBy: evaluationResult.blockedBy
      },
      severity: evaluationResult.allowed ? 'info' : 'warning'
    };
    
    // Store violation for tracking
    this.violations.push(event);
    
    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }
    
    // Log to console
    if (!evaluationResult.allowed) {
      console.warn(`🚫 Policy violation - User: ${userId}, Agent: ${agentId}, Action: ${action.type}`);
      console.warn(`   Blocked by policies: ${evaluationResult.blockedBy.join(', ')}`);
    } else if (evaluationResult.violations.length > 0) {
      console.info(`⚠️ Policy warning - User: ${userId}, Agent: ${agentId}, Action: ${action.type}`);
    }
    
    return event;
  }

  /**
   * Pre-execution policy check for agents
   */
  async checkAgentExecution(userId, agentConfig, executionContext = {}) {
    const action = {
      type: 'agent_execution',
      parameters: {
        agentId: agentConfig.id,
        agentType: agentConfig.type,
        capabilities: agentConfig.capabilities || [],
        model: agentConfig.model
      },
      metadata: executionContext
    };
    
    const context = {
      agent: agentConfig,
      user: { id: userId },
      execution: executionContext
    };
    
    return await this.evaluateAction(userId, agentConfig.id, action, context);
  }

  /**
   * Check data access policies
   */
  async checkDataAccess(userId, agentId, dataRequest) {
    const action = {
      type: 'data_access',
      parameters: {
        dataType: dataRequest.type,
        dataSource: dataRequest.source,
        accessType: dataRequest.accessType || 'read',
        containsPII: dataRequest.containsPII || false
      }
    };
    
    const context = {
      data: dataRequest,
      user: { id: userId }
    };
    
    return await this.evaluateAction(userId, agentId, action, context);
  }

  /**
   * Check external API call policies
   */
  async checkExternalAPICall(userId, agentId, apiRequest) {
    const action = {
      type: 'external_api_call',
      parameters: {
        url: apiRequest.url,
        method: apiRequest.method || 'GET',
        domain: new URL(apiRequest.url).hostname,
        hasAuth: Boolean(apiRequest.headers?.Authorization)
      }
    };
    
    const context = {
      api: apiRequest,
      user: { id: userId }
    };
    
    return await this.evaluateAction(userId, agentId, action, context);
  }

  /**
   * Get policy enforcement statistics
   */
  getEnforcementStats() {
    return {
      ...this.enforcementStats,
      cachedPolicies: this.policies.size,
      recentViolations: this.violations.slice(-10),
      cacheHitRate: this.evaluationCache.size > 0 ? 
        (this.enforcementStats.totalChecks - this.evaluationCache.size) / this.enforcementStats.totalChecks : 0
    };
  }

  /**
   * Clear policy cache (useful for testing or policy updates)
   */
  clearCache() {
    this.policies.clear();
    this.evaluationCache.clear();
    console.log('🧹 Policy cache cleared');
  }

  /**
   * Get recent policy violations
   */
  getRecentViolations(limit = 50) {
    return this.violations.slice(-limit);
  }

  /**
   * Check if user has specific policy type active
   */
  async hasPolicyType(userId, policyType) {
    let userPolicies = this.policies.get(userId);
    if (!userPolicies) {
      userPolicies = await this.loadUserPolicies(userId);
    }
    
    return userPolicies.some(policy => 
      policy.category === policyType && policy.status === 'active'
    );
  }
}

module.exports = new PolicyEnforcementService();

