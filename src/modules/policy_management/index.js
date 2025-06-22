/**
 * Policy Management Module
 * 
 * This module implements policy creation, management, and enforcement for the Promethios framework,
 * enabling governance policy management and compliance checking for agent actions.
 * 
 * @module policy_management
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Load schemas - using path.resolve to handle relative paths correctly
const schemaBasePath = path.resolve(__dirname, '../../../schemas/policy');
let policySchema;
let exemptionSchema;

try {
  policySchema = require(path.join(schemaBasePath, 'policy.schema.v1.json'));
  exemptionSchema = require(path.join(schemaBasePath, 'exemption.schema.v1.json'));
} catch (error) {
  // Fallback to mock schemas for testing and backwards compatibility
  policySchema = {
    type: 'object',
    properties: {
      policy_id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      policy_type: { type: 'string', enum: ['SECURITY', 'COMPLIANCE', 'OPERATIONAL', 'ETHICAL', 'LEGAL'] },
      status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'] },
      rules: { type: 'array' },
      enforcement_level: { type: 'string', enum: ['STRICT', 'MODERATE', 'ADVISORY'] },
      created_at: { type: 'string' },
      updated_at: { type: 'string' },
      created_by: { type: 'string' },
      version: { type: 'string' }
    },
    required: ['policy_id', 'name', 'policy_type', 'status', 'rules']
  };
  
  exemptionSchema = {
    type: 'object',
    properties: {
      exemption_id: { type: 'string' },
      policy_id: { type: 'string' },
      agent_id: { type: 'string' },
      reason: { type: 'string' },
      status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] },
      created_at: { type: 'string' },
      expires_at: { type: 'string' },
      approved_by: { type: 'string' }
    },
    required: ['exemption_id', 'policy_id', 'agent_id', 'reason', 'status']
  };
  
  console.warn('Failed to load policy schemas, using fallback mock schemas:', error.message);
}

/**
 * PolicyManagement class for managing governance policies and enforcement
 */
class PolicyManagement {
  /**
   * Create a new PolicyManagement instance
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration object
   * @param {Object} options.hooks - Constitutional hooks manager
   */
  constructor({ logger, config = {}, hooks = null }) {
    this.logger = logger || console;
    this.config = {
      dataPath: config.dataPath || './data/policy_management',
      defaultEnforcementLevel: config.defaultEnforcementLevel || 'MODERATE',
      enablePolicyEnforcement: config.enablePolicyEnforcement !== false,
      exemptionExpiryDays: config.exemptionExpiryDays || 30,
      backupRetentionDays: config.backupRetentionDays || 90,
      ...config
    };
    
    this.hooks = hooks;
    this.policies = new Map();
    this.exemptions = new Map();
    this.policyDecisions = new Map();
    this.enforcementHistory = new Map();
    
    // Valid policy types and statuses for backwards compatibility
    this.VALID_POLICY_TYPES = ['SECURITY', 'COMPLIANCE', 'OPERATIONAL', 'ETHICAL', 'LEGAL'];
    this.VALID_STATUSES = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'];
    this.VALID_EXEMPTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'];
    this.VALID_ENFORCEMENT_LEVELS = ['STRICT', 'MODERATE', 'ADVISORY'];
    
    // Initialize data directory
    try {
      if (!fs.existsSync(this.config.dataPath)) {
        fs.mkdirSync(this.config.dataPath, { recursive: true });
        this.logger.info(`Created policy management data directory: ${this.config.dataPath}`);
      }
      
      // Create subdirectories for organization
      ['policies', 'exemptions', 'decisions', 'backups'].forEach(subdir => {
        const dirPath = path.join(this.config.dataPath, subdir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      });
    } catch (error) {
      this.logger.error(`Failed to create policy management data directory: ${error.message}`);
    }
    
    // Load existing data
    this.loadData();
    
    // Register hooks if available
    if (this.hooks) {
      this.registerHooks();
    }
    
    this.logger.info('Policy Management module initialized');
  }
  
  /**
   * Register constitutional hooks for policy enforcement
   */
  registerHooks() {
    this.hooks.register('beforeAgentAction', this.enforcePolicy.bind(this));
    this.hooks.register('afterAgentAction', this.logPolicyDecision.bind(this));
    this.hooks.register('beforeAgentInteraction', this.checkInteractionPolicies.bind(this));
    this.hooks.register('beforeAgentDelegation', this.validateDelegationPolicies.bind(this));
    this.logger.info('Policy Management hooks registered');
  }
  
  /**
   * Create a new policy
   * @param {Object} policyData - Policy data
   * @returns {Object} - Result with success status and policy ID
   */
  createPolicy(policyData) {
    try {
      // Validate input
      if (!policyData || typeof policyData !== 'object') {
        return { success: false, error: 'Invalid policy data provided' };
      }
      
      // Generate policy ID if not provided
      const policyId = policyData.policy_id || this.generatePolicyId();
      
      // Check if policy already exists
      if (this.policies.has(policyId)) {
        return { success: false, error: `Policy with ID ${policyId} already exists` };
      }
      
      // Validate policy type
      if (policyData.policy_type && !this.VALID_POLICY_TYPES.includes(policyData.policy_type)) {
        return { success: false, error: `Invalid policy type. Must be one of: ${this.VALID_POLICY_TYPES.join(', ')}` };
      }
      
      // Create policy object with defaults
      const policy = {
        policy_id: policyId,
        name: policyData.name || 'Unnamed Policy',
        description: policyData.description || '',
        policy_type: policyData.policy_type || 'OPERATIONAL',
        status: policyData.status || 'DRAFT',
        rules: policyData.rules || [],
        enforcement_level: policyData.enforcement_level || this.config.defaultEnforcementLevel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: policyData.created_by || 'system',
        version: policyData.version || '1.0.0',
        metadata: policyData.metadata || {}
      };
      
      // Validate against schema
      const validation = this.validatePolicySchema(policy);
      if (!validation.valid) {
        return { success: false, error: `Schema validation failed: ${validation.error}` };
      }
      
      // Store policy
      this.policies.set(policyId, policy);
      
      // Persist to file
      this.savePolicyToFile(policy);
      
      this.logger.info(`Policy created: ${policyId} (${policy.name})`);
      
      return { 
        success: true, 
        policy_id: policyId,
        policy: policy
      };
      
    } catch (error) {
      this.logger.error(`Error creating policy: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get a policy by ID
   * @param {string} policyId - Policy ID
   * @returns {Object|null} - Policy object or null if not found
   */
  getPolicy(policyId) {
    if (!policyId) {
      this.logger.warn('Policy ID is required');
      return null;
    }
    
    return this.policies.get(policyId) || null;
  }
  
  /**
   * List policies with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Array} - Array of policies
   */
  listPolicies(filters = {}) {
    let policies = Array.from(this.policies.values());
    
    // Apply filters
    if (filters.status) {
      policies = policies.filter(p => p.status === filters.status);
    }
    
    if (filters.policy_type) {
      policies = policies.filter(p => p.policy_type === filters.policy_type);
    }
    
    if (filters.enforcement_level) {
      policies = policies.filter(p => p.enforcement_level === filters.enforcement_level);
    }
    
    if (filters.created_by) {
      policies = policies.filter(p => p.created_by === filters.created_by);
    }
    
    // Sort by creation date (newest first)
    policies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return policies;
  }
  
  /**
   * Update an existing policy
   * @param {string} policyId - Policy ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} - Result with success status
   */
  updatePolicy(policyId, updates) {
    try {
      if (!policyId) {
        return { success: false, error: 'Policy ID is required' };
      }
      
      const existingPolicy = this.policies.get(policyId);
      if (!existingPolicy) {
        return { success: false, error: `Policy with ID ${policyId} not found` };
      }
      
      // Create updated policy
      const updatedPolicy = {
        ...existingPolicy,
        ...updates,
        policy_id: policyId, // Ensure ID cannot be changed
        updated_at: new Date().toISOString()
      };
      
      // Validate updated policy
      const validation = this.validatePolicySchema(updatedPolicy);
      if (!validation.valid) {
        return { success: false, error: `Schema validation failed: ${validation.error}` };
      }
      
      // Store updated policy
      this.policies.set(policyId, updatedPolicy);
      
      // Persist to file
      this.savePolicyToFile(updatedPolicy);
      
      this.logger.info(`Policy updated: ${policyId}`);
      
      return { 
        success: true, 
        policy: updatedPolicy
      };
      
    } catch (error) {
      this.logger.error(`Error updating policy: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Delete a policy
   * @param {string} policyId - Policy ID
   * @returns {Object} - Result with success status
   */
  deletePolicy(policyId) {
    try {
      if (!policyId) {
        return { success: false, error: 'Policy ID is required' };
      }
      
      const policy = this.policies.get(policyId);
      if (!policy) {
        return { success: false, error: `Policy with ID ${policyId} not found` };
      }
      
      // Archive policy instead of deleting for audit trail
      const archivedPolicy = {
        ...policy,
        status: 'ARCHIVED',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.policies.set(policyId, archivedPolicy);
      this.savePolicyToFile(archivedPolicy);
      
      this.logger.info(`Policy archived: ${policyId}`);
      
      return { success: true };
      
    } catch (error) {
      this.logger.error(`Error deleting policy: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Enforce policy on an agent action
   * @param {Object} actionData - Action data to evaluate
   * @returns {Object} - Policy decision
   */
  enforcePolicy(actionData) {
    try {
      if (!this.config.enablePolicyEnforcement) {
        return { action: 'allow', reason: 'Policy enforcement disabled' };
      }
      
      const decisionId = this.generateDecisionId();
      const timestamp = new Date().toISOString();
      
      // Get applicable policies
      const applicablePolicies = this.getApplicablePolicies(actionData);
      
      if (applicablePolicies.length === 0) {
        const decision = {
          decision_id: decisionId,
          action: 'allow',
          reason: 'No applicable policies found',
          timestamp: timestamp,
          policies_evaluated: []
        };
        
        this.policyDecisions.set(decisionId, decision);
        return decision;
      }
      
      // Evaluate policies
      const evaluationResults = applicablePolicies.map(policy => 
        this.evaluatePolicyRules(policy, actionData)
      );
      
      // Determine final decision based on enforcement levels
      const finalDecision = this.determineFinalDecision(evaluationResults, actionData);
      
      const decision = {
        decision_id: decisionId,
        agent_id: actionData.agent_id,
        action_type: actionData.action_type,
        action: finalDecision.action,
        reason: finalDecision.reason,
        modifications: finalDecision.modifications,
        policies_evaluated: applicablePolicies.map(p => p.policy_id),
        timestamp: timestamp
      };
      
      // Store decision
      this.policyDecisions.set(decisionId, decision);
      this.savePolicyDecisionToFile(decision);
      
      this.logger.info(`Policy decision: ${decision.action} for ${actionData.action_type} by ${actionData.agent_id}`);
      
      return decision;
      
    } catch (error) {
      this.logger.error(`Error enforcing policy: ${error.message}`);
      return { 
        action: 'deny', 
        reason: `Policy enforcement error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Create a policy exemption
   * @param {Object} exemptionData - Exemption data
   * @returns {Object} - Result with success status
   */
  createExemption(exemptionData) {
    try {
      const exemptionId = exemptionData.exemption_id || this.generateExemptionId();
      
      // Check if policy exists
      if (!this.policies.has(exemptionData.policy_id)) {
        return { success: false, error: `Policy ${exemptionData.policy_id} not found` };
      }
      
      const exemption = {
        exemption_id: exemptionId,
        policy_id: exemptionData.policy_id,
        agent_id: exemptionData.agent_id,
        reason: exemptionData.reason,
        status: exemptionData.status || 'PENDING',
        created_at: new Date().toISOString(),
        expires_at: exemptionData.expires_at || this.calculateExpiryDate(),
        approved_by: exemptionData.approved_by || null,
        metadata: exemptionData.metadata || {}
      };
      
      // Validate exemption
      const validation = this.validateExemptionSchema(exemption);
      if (!validation.valid) {
        return { success: false, error: `Schema validation failed: ${validation.error}` };
      }
      
      this.exemptions.set(exemptionId, exemption);
      this.saveExemptionToFile(exemption);
      
      this.logger.info(`Exemption created: ${exemptionId} for policy ${exemptionData.policy_id}`);
      
      return { 
        success: true, 
        exemption_id: exemptionId,
        exemption: exemption
      };
      
    } catch (error) {
      this.logger.error(`Error creating exemption: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  // Helper methods
  
  /**
   * Generate a unique policy ID
   * @returns {string} - Policy ID
   */
  generatePolicyId() {
    return `policy_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
  }
  
  /**
   * Generate a unique exemption ID
   * @returns {string} - Exemption ID
   */
  generateExemptionId() {
    return `exemption_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
  }
  
  /**
   * Generate a unique decision ID
   * @returns {string} - Decision ID
   */
  generateDecisionId() {
    return `decision_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
  }
  
  /**
   * Calculate exemption expiry date
   * @returns {string} - ISO date string
   */
  calculateExpiryDate() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.config.exemptionExpiryDays);
    return expiryDate.toISOString();
  }
  
  /**
   * Validate policy against schema
   * @param {Object} policy - Policy to validate
   * @returns {Object} - Validation result
   */
  validatePolicySchema(policy) {
    try {
      // Basic validation for backwards compatibility
      if (!policy.policy_id || !policy.name || !policy.policy_type) {
        return { valid: false, error: 'Missing required fields: policy_id, name, policy_type' };
      }
      
      if (!this.VALID_POLICY_TYPES.includes(policy.policy_type)) {
        return { valid: false, error: `Invalid policy_type: ${policy.policy_type}` };
      }
      
      if (!this.VALID_STATUSES.includes(policy.status)) {
        return { valid: false, error: `Invalid status: ${policy.status}` };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * Validate exemption against schema
   * @param {Object} exemption - Exemption to validate
   * @returns {Object} - Validation result
   */
  validateExemptionSchema(exemption) {
    try {
      if (!exemption.exemption_id || !exemption.policy_id || !exemption.agent_id) {
        return { valid: false, error: 'Missing required fields: exemption_id, policy_id, agent_id' };
      }
      
      if (!this.VALID_EXEMPTION_STATUSES.includes(exemption.status)) {
        return { valid: false, error: `Invalid status: ${exemption.status}` };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * Get applicable policies for an action
   * @param {Object} actionData - Action data
   * @returns {Array} - Applicable policies
   */
  getApplicablePolicies(actionData) {
    return Array.from(this.policies.values()).filter(policy => {
      // Only consider active policies
      if (policy.status !== 'ACTIVE') return false;
      
      // Check if policy applies to this action type
      if (policy.rules && policy.rules.length > 0) {
        return policy.rules.some(rule => 
          this.ruleAppliesTo(rule, actionData)
        );
      }
      
      return false;
    });
  }
  
  /**
   * Check if a rule applies to an action
   * @param {Object} rule - Policy rule
   * @param {Object} actionData - Action data
   * @returns {boolean} - Whether rule applies
   */
  ruleAppliesTo(rule, actionData) {
    // Simple rule matching - can be extended
    if (rule.action_type && rule.action_type !== actionData.action_type) {
      return false;
    }
    
    if (rule.agent_pattern && !actionData.agent_id.match(rule.agent_pattern)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Evaluate policy rules against action data
   * @param {Object} policy - Policy to evaluate
   * @param {Object} actionData - Action data
   * @returns {Object} - Evaluation result
   */
  evaluatePolicyRules(policy, actionData) {
    // Simple rule evaluation - can be extended with complex logic
    const violations = [];
    
    if (policy.rules) {
      policy.rules.forEach(rule => {
        if (this.ruleAppliesTo(rule, actionData)) {
          const ruleResult = this.evaluateRule(rule, actionData);
          if (!ruleResult.passed) {
            violations.push({
              rule: rule,
              reason: ruleResult.reason
            });
          }
        }
      });
    }
    
    return {
      policy_id: policy.policy_id,
      enforcement_level: policy.enforcement_level,
      violations: violations,
      passed: violations.length === 0
    };
  }
  
  /**
   * Evaluate a single rule
   * @param {Object} rule - Rule to evaluate
   * @param {Object} actionData - Action data
   * @returns {Object} - Rule evaluation result
   */
  evaluateRule(rule, actionData) {
    // Simple rule evaluation logic
    if (rule.condition === 'deny_all') {
      return { passed: false, reason: 'Action denied by policy rule' };
    }
    
    if (rule.condition === 'require_approval' && !actionData.approved) {
      return { passed: false, reason: 'Action requires approval' };
    }
    
    if (rule.condition === 'sensitive_data_check' && this.containsSensitiveData(actionData)) {
      return { passed: false, reason: 'Sensitive data detected' };
    }
    
    return { passed: true };
  }
  
  /**
   * Check if action contains sensitive data
   * @param {Object} actionData - Action data
   * @returns {boolean} - Whether sensitive data is detected
   */
  containsSensitiveData(actionData) {
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email pattern
    ];
    
    const content = JSON.stringify(actionData);
    return sensitivePatterns.some(pattern => pattern.test(content));
  }
  
  /**
   * Determine final policy decision
   * @param {Array} evaluationResults - Results from policy evaluations
   * @param {Object} actionData - Action data
   * @returns {Object} - Final decision
   */
  determineFinalDecision(evaluationResults, actionData) {
    const strictViolations = evaluationResults.filter(r => 
      !r.passed && r.enforcement_level === 'STRICT'
    );
    
    const moderateViolations = evaluationResults.filter(r => 
      !r.passed && r.enforcement_level === 'MODERATE'
    );
    
    // STRICT violations always deny
    if (strictViolations.length > 0) {
      return {
        action: 'deny',
        reason: `Strict policy violations: ${strictViolations.map(v => v.policy_id).join(', ')}`
      };
    }
    
    // MODERATE violations may modify or log
    if (moderateViolations.length > 0) {
      // Check if we can modify the action to make it compliant
      const modifications = this.generateModifications(moderateViolations, actionData);
      
      if (modifications) {
        return {
          action: 'modify',
          reason: `Modified to comply with policies: ${moderateViolations.map(v => v.policy_id).join(', ')}`,
          modifications: modifications
        };
      } else {
        return {
          action: 'log',
          reason: `Policy violations logged: ${moderateViolations.map(v => v.policy_id).join(', ')}`
        };
      }
    }
    
    return {
      action: 'allow',
      reason: 'All policy checks passed'
    };
  }
  
  /**
   * Generate modifications to make action compliant
   * @param {Array} violations - Policy violations
   * @param {Object} actionData - Action data
   * @returns {Object|null} - Modifications or null if not possible
   */
  generateModifications(violations, actionData) {
    const modifications = {};
    
    // Example: redact sensitive data
    if (violations.some(v => v.violations.some(viol => viol.reason.includes('Sensitive data')))) {
      if (actionData.content) {
        modifications.content = this.redactSensitiveData(actionData.content);
      }
    }
    
    return Object.keys(modifications).length > 0 ? modifications : null;
  }
  
  /**
   * Redact sensitive data from content
   * @param {string} content - Content to redact
   * @returns {string} - Redacted content
   */
  redactSensitiveData(content) {
    return content
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED-CARD]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]');
  }
  
  /**
   * Save policy to file
   * @param {Object} policy - Policy to save
   */
  savePolicyToFile(policy) {
    try {
      const filename = `${policy.policy_id}.json`;
      const filepath = path.join(this.config.dataPath, 'policies', filename);
      fs.writeFileSync(filepath, JSON.stringify(policy, null, 2));
    } catch (error) {
      this.logger.error(`Failed to save policy to file: ${error.message}`);
    }
  }
  
  /**
   * Save exemption to file
   * @param {Object} exemption - Exemption to save
   */
  saveExemptionToFile(exemption) {
    try {
      const filename = `${exemption.exemption_id}.json`;
      const filepath = path.join(this.config.dataPath, 'exemptions', filename);
      fs.writeFileSync(filepath, JSON.stringify(exemption, null, 2));
    } catch (error) {
      this.logger.error(`Failed to save exemption to file: ${error.message}`);
    }
  }
  
  /**
   * Save policy decision to file
   * @param {Object} decision - Decision to save
   */
  savePolicyDecisionToFile(decision) {
    try {
      const filename = `${decision.decision_id}.json`;
      const filepath = path.join(this.config.dataPath, 'decisions', filename);
      fs.writeFileSync(filepath, JSON.stringify(decision, null, 2));
    } catch (error) {
      this.logger.error(`Failed to save policy decision to file: ${error.message}`);
    }
  }
  
  /**
   * Load all data from files
   */
  loadData() {
    this.loadPolicies();
    this.loadExemptions();
    this.loadPolicyDecisions();
  }
  
  /**
   * Load policies from files
   */
  loadPolicies() {
    try {
      const policiesDir = path.join(this.config.dataPath, 'policies');
      if (!fs.existsSync(policiesDir)) return;
      
      const files = fs.readdirSync(policiesDir);
      files.forEach(filename => {
        if (filename.endsWith('.json')) {
          try {
            const filepath = path.join(policiesDir, filename);
            const policy = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            this.policies.set(policy.policy_id, policy);
          } catch (error) {
            this.logger.error(`Failed to load policy from ${filename}: ${error.message}`);
          }
        }
      });
      
      this.logger.info(`Loaded ${this.policies.size} policies`);
    } catch (error) {
      this.logger.error(`Failed to load policies: ${error.message}`);
    }
  }
  
  /**
   * Load exemptions from files
   */
  loadExemptions() {
    try {
      const exemptionsDir = path.join(this.config.dataPath, 'exemptions');
      if (!fs.existsSync(exemptionsDir)) return;
      
      const files = fs.readdirSync(exemptionsDir);
      files.forEach(filename => {
        if (filename.endsWith('.json')) {
          try {
            const filepath = path.join(exemptionsDir, filename);
            const exemption = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            this.exemptions.set(exemption.exemption_id, exemption);
          } catch (error) {
            this.logger.error(`Failed to load exemption from ${filename}: ${error.message}`);
          }
        }
      });
      
      this.logger.info(`Loaded ${this.exemptions.size} exemptions`);
    } catch (error) {
      this.logger.error(`Failed to load exemptions: ${error.message}`);
    }
  }
  
  /**
   * Load policy decisions from files
   */
  loadPolicyDecisions() {
    try {
      const decisionsDir = path.join(this.config.dataPath, 'decisions');
      if (!fs.existsSync(decisionsDir)) return;
      
      const files = fs.readdirSync(decisionsDir);
      files.forEach(filename => {
        if (filename.endsWith('.json')) {
          try {
            const filepath = path.join(decisionsDir, filename);
            const decision = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            this.policyDecisions.set(decision.decision_id, decision);
          } catch (error) {
            this.logger.error(`Failed to load policy decision from ${filename}: ${error.message}`);
          }
        }
      });
      
      this.logger.info(`Loaded ${this.policyDecisions.size} policy decisions`);
    } catch (error) {
      this.logger.error(`Failed to load policy decisions: ${error.message}`);
    }
  }
  
  /**
   * Get policy statistics
   * @returns {Object} - Statistics
   */
  getStatistics() {
    const policies = Array.from(this.policies.values());
    const exemptions = Array.from(this.exemptions.values());
    const decisions = Array.from(this.policyDecisions.values());
    
    return {
      total_policies: policies.length,
      active_policies: policies.filter(p => p.status === 'ACTIVE').length,
      draft_policies: policies.filter(p => p.status === 'DRAFT').length,
      total_exemptions: exemptions.length,
      pending_exemptions: exemptions.filter(e => e.status === 'PENDING').length,
      total_decisions: decisions.length,
      recent_decisions: decisions.filter(d => 
        new Date(d.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
    };
  }
  
  /**
   * Backup data
   * @returns {boolean} - Success status
   */
  backupData() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.config.dataPath, 'backups', timestamp);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Backup policies
      const policiesBackup = Array.from(this.policies.entries());
      fs.writeFileSync(
        path.join(backupDir, 'policies.json'),
        JSON.stringify(policiesBackup, null, 2)
      );
      
      // Backup exemptions
      const exemptionsBackup = Array.from(this.exemptions.entries());
      fs.writeFileSync(
        path.join(backupDir, 'exemptions.json'),
        JSON.stringify(exemptionsBackup, null, 2)
      );
      
      // Backup decisions
      const decisionsBackup = Array.from(this.policyDecisions.entries());
      fs.writeFileSync(
        path.join(backupDir, 'decisions.json'),
        JSON.stringify(decisionsBackup, null, 2)
      );
      
      this.logger.info(`Data backed up to: ${backupDir}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to backup data: ${error.message}`);
      return false;
    }
  }
  
  // Hook methods for constitutional integration
  
  /**
   * Log policy decision (hook method)
   * @param {Object} actionData - Action data
   * @param {Object} result - Action result
   */
  logPolicyDecision(actionData, result) {
    // This method is called after agent actions to log policy decisions
    this.logger.info(`Policy decision logged for action: ${actionData.action_type}`);
  }
  
  /**
   * Check interaction policies (hook method)
   * @param {Object} interactionData - Interaction data
   * @returns {Object} - Policy decision
   */
  checkInteractionPolicies(interactionData) {
    // This method is called before agent interactions
    return this.enforcePolicy({
      ...interactionData,
      action_type: 'agent_interaction'
    });
  }
  
  /**
   * Validate delegation policies (hook method)
   * @param {Object} delegationData - Delegation data
   * @returns {Object} - Policy decision
   */
  validateDelegationPolicies(delegationData) {
    // This method is called before agent delegations
    return this.enforcePolicy({
      ...delegationData,
      action_type: 'agent_delegation'
    });
  }
}

module.exports = {
  PolicyManagement
};

