/**
 * Promethios Policy Management API Routes
 * 
 * Comprehensive policy management system with CRUD operations,
 * natural language generation, analytics, and compliance tracking.
 * Integrates with existing Promethios architecture.
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for policies (replace with database in production)
let policies = [];
let policyTemplates = [
  {
    template_id: 'security-basic',
    name: 'Basic Security Policy',
    category: 'SECURITY',
    description: 'Standard security controls for AI agents',
    rules: [
      {
        rule_id: 'sec-001',
        name: 'PII Detection',
        condition: 'contains_pii',
        action: 'alert',
        description: 'Alert when personally identifiable information is detected'
      },
      {
        rule_id: 'sec-002',
        name: 'Low Trust Block',
        condition: 'trust_score < 70',
        action: 'deny',
        description: 'Block responses with low trust scores'
      }
    ]
  },
  {
    template_id: 'compliance-gdpr',
    name: 'GDPR Compliance Policy',
    category: 'COMPLIANCE',
    description: 'GDPR compliance requirements for data handling',
    rules: [
      {
        rule_id: 'gdpr-001',
        name: 'Data Classification',
        condition: 'data_classification == "sensitive"',
        action: 'log',
        description: 'Log all sensitive data access'
      },
      {
        rule_id: 'gdpr-002',
        name: 'Consent Verification',
        condition: 'user_consent != "granted"',
        action: 'deny',
        description: 'Require explicit user consent for data processing'
      }
    ]
  }
];

// Helper functions
const generatePolicyId = () => `pol-${uuidv4()}`;
const generateRuleId = () => `rule-${uuidv4()}`;

const validatePolicy = (policy) => {
  const errors = [];
  
  if (!policy.name || policy.name.trim() === '') {
    errors.push('Policy name is required');
  }
  
  if (!policy.version || policy.version.trim() === '') {
    errors.push('Policy version is required');
  }
  
  if (!policy.status || !['draft', 'active', 'deprecated', 'archived'].includes(policy.status)) {
    errors.push('Valid policy status is required (draft, active, deprecated, archived)');
  }
  
  if (!Array.isArray(policy.rules)) {
    errors.push('Policy rules must be an array');
  } else {
    policy.rules.forEach((rule, index) => {
      if (!rule.condition || rule.condition.trim() === '') {
        errors.push(`Rule ${index + 1}: condition is required`);
      }
      if (!rule.action || !['allow', 'deny', 'log', 'alert', 'escalate'].includes(rule.action)) {
        errors.push(`Rule ${index + 1}: valid action is required (allow, deny, log, alert, escalate)`);
      }
    });
  }
  
  return errors;
};

const generateMockAnalytics = (policyId) => ({
  effectiveness_score: Math.random() * 100,
  compliance_rate: 0.85 + Math.random() * 0.15,
  violation_count: Math.floor(Math.random() * 50),
  total_evaluations: Math.floor(Math.random() * 1000) + 100,
  avg_trust_score: 0.7 + Math.random() * 0.3,
  trend_data: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    compliance_rate: 0.8 + Math.random() * 0.2,
    violation_count: Math.floor(Math.random() * 10),
    total_evaluations: Math.floor(Math.random() * 50) + 10
  }))
});

const generateMockOptimization = (policyId) => ({
  suggestions: [
    {
      type: 'rule_modification',
      description: 'Consider adjusting trust score threshold from 70 to 75 for better security',
      impact_score: 0.85,
      confidence: 0.92
    },
    {
      type: 'rule_addition',
      description: 'Add rule to detect potential bias in responses',
      impact_score: 0.78,
      confidence: 0.87
    }
  ],
  predicted_improvement: 0.15,
  risk_assessment: 'low'
});

const detectMockConflicts = (policyId) => {
  const policy = policies.find(p => p.policy_id === policyId);
  if (!policy || policy.rules.length < 2) return [];
  
  return [
    {
      rule_id_1: policy.rules[0].rule_id,
      rule_id_2: policy.rules[1].rule_id,
      conflict_type: 'priority_conflict',
      description: 'Rules may have conflicting priorities in certain scenarios',
      severity: 'low',
      resolution_suggestion: 'Consider adjusting rule priorities or adding more specific conditions'
    }
  ];
};

// Core Policy CRUD Operations

/**
 * GET /api/promethios-policy/policies
 * List all policies with optional filtering
 */
router.get('/policies', (req, res) => {
  try {
    const { status, policy_type, category, tags } = req.query;
    
    let filteredPolicies = [...policies];
    
    if (status) {
      filteredPolicies = filteredPolicies.filter(p => p.status === status);
    }
    
    if (category) {
      filteredPolicies = filteredPolicies.filter(p => p.category === category);
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredPolicies = filteredPolicies.filter(p => 
        p.metadata?.tags && tagArray.some(tag => p.metadata.tags.includes(tag))
      );
    }
    
    res.json(filteredPolicies);
  } catch (error) {
    console.error('Error listing policies:', error);
    res.status(500).json({ error: 'Failed to list policies' });
  }
});

/**
 * GET /api/promethios-policy/policies/:policyId
 * Get a specific policy by ID
 */
router.get('/policies/:policyId', (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = policies.find(p => p.policy_id === policyId);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    res.json(policy);
  } catch (error) {
    console.error('Error getting policy:', error);
    res.status(500).json({ error: 'Failed to get policy' });
  }
});

/**
 * POST /api/promethios-policy/policies
 * Create a new policy
 */
router.post('/policies', (req, res) => {
  try {
    const policyData = req.body;
    
    // Validate policy data
    const validationErrors = validatePolicy(policyData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Generate IDs for policy and rules
    const policy = {
      ...policyData,
      policy_id: generatePolicyId(),
      rules: policyData.rules.map(rule => ({
        ...rule,
        rule_id: rule.rule_id || generateRuleId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user?.id || 'system',
      updated_by: req.user?.id || 'system'
    };
    
    policies.push(policy);
    
    console.log(`Policy created: ${policy.policy_id} - ${policy.name}`);
    res.status(201).json(policy);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

/**
 * PUT /api/promethios-policy/policies/:policyId
 * Update an existing policy
 */
router.put('/policies/:policyId', (req, res) => {
  try {
    const { policyId } = req.params;
    const updates = req.body;
    
    const policyIndex = policies.findIndex(p => p.policy_id === policyId);
    if (policyIndex === -1) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    // Validate updated policy data
    const updatedPolicy = { ...policies[policyIndex], ...updates };
    const validationErrors = validatePolicy(updatedPolicy);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Update policy
    policies[policyIndex] = {
      ...updatedPolicy,
      updated_at: new Date().toISOString(),
      updated_by: req.user?.id || 'system'
    };
    
    console.log(`Policy updated: ${policyId} - ${policies[policyIndex].name}`);
    res.json(policies[policyIndex]);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

/**
 * DELETE /api/promethios-policy/policies/:policyId
 * Delete a policy
 */
router.delete('/policies/:policyId', (req, res) => {
  try {
    const { policyId } = req.params;
    
    const policyIndex = policies.findIndex(p => p.policy_id === policyId);
    if (policyIndex === -1) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    const deletedPolicy = policies.splice(policyIndex, 1)[0];
    
    console.log(`Policy deleted: ${policyId} - ${deletedPolicy.name}`);
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Failed to delete policy' });
  }
});

// Enhanced Features

/**
 * GET /api/promethios-policy/templates
 * Get policy templates
 */
router.get('/templates', (req, res) => {
  try {
    res.json(policyTemplates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: 'Failed to get policy templates' });
  }
});

/**
 * POST /api/promethios-policy/policies/generate-from-nl
 * Generate policy from natural language description
 */
router.post('/policies/generate-from-nl', (req, res) => {
  try {
    const { description, policy_type, compliance_requirements, context } = req.body;
    
    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    // Mock NL generation - in production, this would use AI/ML
    const generatedPolicy = {
      policy_id: generatePolicyId(),
      name: `Generated Policy - ${policy_type || 'General'}`,
      version: '1.0.0',
      status: 'draft',
      category: policy_type || 'SECURITY',
      description: description,
      rules: [
        {
          rule_id: generateRuleId(),
          name: 'Generated Rule 1',
          description: `Rule generated from: ${description.substring(0, 100)}...`,
          condition: 'generated_condition',
          action: 'log',
          priority: 1,
          metadata: {
            rationale: 'Generated from natural language description',
            tags: ['generated', 'nl-processed']
          }
        }
      ],
      metadata: {
        owner: req.user?.id || 'system',
        compliance_mappings: compliance_requirements ? 
          compliance_requirements.reduce((acc, req) => ({ ...acc, [req]: ['generated'] }), {}) : {},
        tags: ['generated', 'nl-processed'],
        generation_context: context,
        original_description: description
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user?.id || 'system',
      updated_by: req.user?.id || 'system'
    };
    
    console.log(`Policy generated from NL: ${generatedPolicy.policy_id}`);
    res.json(generatedPolicy);
  } catch (error) {
    console.error('Error generating policy from NL:', error);
    res.status(500).json({ error: 'Failed to generate policy from natural language' });
  }
});

/**
 * GET /api/promethios-policy/policies/:policyId/analytics
 * Get policy analytics
 */
router.get('/policies/:policyId/analytics', (req, res) => {
  try {
    const { policyId } = req.params;
    
    const policy = policies.find(p => p.policy_id === policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    const analytics = generateMockAnalytics(policyId);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting policy analytics:', error);
    res.status(500).json({ error: 'Failed to get policy analytics' });
  }
});

/**
 * GET /api/promethios-policy/policies/:policyId/optimize
 * Get policy optimization suggestions
 */
router.get('/policies/:policyId/optimize', (req, res) => {
  try {
    const { policyId } = req.params;
    
    const policy = policies.find(p => p.policy_id === policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    const optimization = generateMockOptimization(policyId);
    res.json(optimization);
  } catch (error) {
    console.error('Error getting policy optimization:', error);
    res.status(500).json({ error: 'Failed to get policy optimization' });
  }
});

/**
 * GET /api/promethios-policy/policies/:policyId/conflicts
 * Detect policy conflicts
 */
router.get('/policies/:policyId/conflicts', (req, res) => {
  try {
    const { policyId } = req.params;
    
    const policy = policies.find(p => p.policy_id === policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    const conflicts = detectMockConflicts(policyId);
    res.json(conflicts);
  } catch (error) {
    console.error('Error detecting policy conflicts:', error);
    res.status(500).json({ error: 'Failed to detect policy conflicts' });
  }
});

/**
 * POST /api/promethios-policy/policies/:policyId/test
 * Test policy with scenarios
 */
router.post('/policies/:policyId/test', (req, res) => {
  try {
    const { policyId } = req.params;
    const { test_scenarios } = req.body;
    
    const policy = policies.find(p => p.policy_id === policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    if (!Array.isArray(test_scenarios)) {
      return res.status(400).json({ error: 'test_scenarios must be an array' });
    }
    
    // Mock policy testing - in production, this would run actual policy evaluation
    const results = test_scenarios.map(scenario => ({
      scenario: scenario.input,
      expected: scenario.expected_action,
      actual: ['allow', 'deny', 'log'][Math.floor(Math.random() * 3)],
      passed: Math.random() > 0.2, // 80% pass rate
      explanation: `Policy evaluation for: ${scenario.input.substring(0, 50)}...`
    }));
    
    const passedCount = results.filter(r => r.passed).length;
    
    const testResult = {
      results,
      overall_passed: passedCount === results.length,
      passed_count: passedCount,
      total_count: results.length
    };
    
    console.log(`Policy tested: ${policyId} - ${passedCount}/${results.length} passed`);
    res.json(testResult);
  } catch (error) {
    console.error('Error testing policy:', error);
    res.status(500).json({ error: 'Failed to test policy' });
  }
});

// Initialize with some sample policies
const initializeSamplePolicies = () => {
  if (policies.length === 0) {
    policies.push({
      policy_id: 'pol-sample-001',
      name: 'Sample Security Policy',
      version: '1.0.0',
      status: 'active',
      category: 'SECURITY',
      description: 'Basic security controls for demonstration',
      rules: [
        {
          rule_id: 'rule-sample-001',
          name: 'PII Detection',
          description: 'Alert when PII is detected in responses',
          condition: 'contains_pii',
          action: 'alert',
          priority: 1,
          metadata: {
            rationale: 'Protect user privacy by detecting personally identifiable information',
            tags: ['privacy', 'security']
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      metadata: {
        owner: 'system',
        compliance_mappings: {
          'GDPR': ['Article 32', 'Article 25'],
          'CCPA': ['Section 1798.100']
        },
        tags: ['security', 'privacy', 'sample']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
      updated_by: 'system'
    });
    
    console.log('Sample policies initialized');
  }
};

// Initialize sample data
initializeSamplePolicies();

module.exports = router;

