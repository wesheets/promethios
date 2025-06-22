/**
 * Policy Enforcement Test Suite
 * 
 * Specialized tests for policy enforcement logic including:
 * - Rule evaluation engine
 * - Decision making algorithms
 * - Sensitive data detection
 * - Modification generation
 * 
 * @module policy_management/test/policy_enforcement
 */

const { PolicyManagement } = require('../index');
const { TEST_DATA_PATH, TEST_CONFIG, mockLogger } = require('./policy_management.test');

describe('Policy Enforcement Engine', () => {
  let policyManager;
  
  beforeEach(() => {
    policyManager = new PolicyManagement({
      logger: mockLogger,
      config: TEST_CONFIG
    });
  });
  
  describe('Rule Evaluation', () => {
    test('should evaluate deny_all rules correctly', () => {
      const rule = { condition: 'deny_all' };
      const actionData = { action_type: 'any_action' };
      
      const result = policyManager.evaluateRule(rule, actionData);
      
      expect(result.passed).toBe(false);
      expect(result.reason).toBe('Action denied by policy rule');
    });
    
    test('should evaluate require_approval rules', () => {
      const rule = { condition: 'require_approval' };
      const actionDataWithoutApproval = { action_type: 'sensitive_action' };
      const actionDataWithApproval = { action_type: 'sensitive_action', approved: true };
      
      const resultWithoutApproval = policyManager.evaluateRule(rule, actionDataWithoutApproval);
      const resultWithApproval = policyManager.evaluateRule(rule, actionDataWithApproval);
      
      expect(resultWithoutApproval.passed).toBe(false);
      expect(resultWithoutApproval.reason).toBe('Action requires approval');
      expect(resultWithApproval.passed).toBe(true);
    });
    
    test('should evaluate sensitive_data_check rules', () => {
      const rule = { condition: 'sensitive_data_check' };
      const sensitiveData = { content: 'Email: user@example.com' };
      const safeData = { content: 'This is safe content' };
      
      const sensitiveResult = policyManager.evaluateRule(rule, sensitiveData);
      const safeResult = policyManager.evaluateRule(rule, safeData);
      
      expect(sensitiveResult.passed).toBe(false);
      expect(sensitiveResult.reason).toBe('Sensitive data detected');
      expect(safeResult.passed).toBe(true);
    });
  });
  
  describe('Sensitive Data Detection', () => {
    test('should detect SSN patterns', () => {
      const actionData = { content: 'SSN: 123-45-6789' };
      const result = policyManager.containsSensitiveData(actionData);
      expect(result).toBe(true);
    });
    
    test('should detect credit card patterns', () => {
      const actionData = { content: 'Card: 1234 5678 9012 3456' };
      const result = policyManager.containsSensitiveData(actionData);
      expect(result).toBe(true);
    });
    
    test('should detect email patterns', () => {
      const actionData = { content: 'Contact: john.doe@company.com' };
      const result = policyManager.containsSensitiveData(actionData);
      expect(result).toBe(true);
    });
    
    test('should not flag safe content', () => {
      const actionData = { content: 'This is completely safe content' };
      const result = policyManager.containsSensitiveData(actionData);
      expect(result).toBe(false);
    });
  });
  
  describe('Data Redaction', () => {
    test('should redact SSN numbers', () => {
      const content = 'User SSN is 123-45-6789 for verification';
      const redacted = policyManager.redactSensitiveData(content);
      expect(redacted).toBe('User SSN is [REDACTED-SSN] for verification');
    });
    
    test('should redact credit card numbers', () => {
      const content = 'Payment card 1234-5678-9012-3456 was used';
      const redacted = policyManager.redactSensitiveData(content);
      expect(redacted).toBe('Payment card [REDACTED-CARD] was used');
    });
    
    test('should redact email addresses', () => {
      const content = 'Send report to admin@company.com';
      const redacted = policyManager.redactSensitiveData(content);
      expect(redacted).toBe('Send report to [REDACTED-EMAIL]');
    });
    
    test('should redact multiple sensitive data types', () => {
      const content = 'User john@example.com has SSN 123-45-6789 and card 1234567890123456';
      const redacted = policyManager.redactSensitiveData(content);
      expect(redacted).toContain('[REDACTED-EMAIL]');
      expect(redacted).toContain('[REDACTED-SSN]');
      expect(redacted).toContain('[REDACTED-CARD]');
    });
  });
  
  describe('Decision Making', () => {
    test('should prioritize strict violations', () => {
      const evaluationResults = [
        {
          policy_id: 'moderate_policy',
          enforcement_level: 'MODERATE',
          violations: [{ rule: {}, reason: 'Moderate violation' }],
          passed: false
        },
        {
          policy_id: 'strict_policy',
          enforcement_level: 'STRICT',
          violations: [{ rule: {}, reason: 'Strict violation' }],
          passed: false
        }
      ];
      
      const decision = policyManager.determineFinalDecision(evaluationResults, {});
      
      expect(decision.action).toBe('deny');
      expect(decision.reason).toContain('Strict policy violations');
    });
    
    test('should handle moderate violations with modifications', () => {
      const evaluationResults = [
        {
          policy_id: 'moderate_policy',
          enforcement_level: 'MODERATE',
          violations: [{ rule: {}, reason: 'Sensitive data detected' }],
          passed: false
        }
      ];
      
      const actionData = { content: 'Email: user@example.com' };
      const decision = policyManager.determineFinalDecision(evaluationResults, actionData);
      
      expect(decision.action).toBe('modify');
      expect(decision.modifications).toBeDefined();
    });
    
    test('should log when modifications not possible', () => {
      const evaluationResults = [
        {
          policy_id: 'moderate_policy',
          enforcement_level: 'MODERATE',
          violations: [{ rule: {}, reason: 'Some violation' }],
          passed: false
        }
      ];
      
      // Mock generateModifications to return null
      const originalMethod = policyManager.generateModifications;
      policyManager.generateModifications = jest.fn().mockReturnValue(null);
      
      const decision = policyManager.determineFinalDecision(evaluationResults, {});
      
      expect(decision.action).toBe('log');
      expect(decision.reason).toContain('Policy violations logged');
      
      // Restore original method
      policyManager.generateModifications = originalMethod;
    });
    
    test('should allow when all policies pass', () => {
      const evaluationResults = [
        {
          policy_id: 'passing_policy',
          enforcement_level: 'STRICT',
          violations: [],
          passed: true
        }
      ];
      
      const decision = policyManager.determineFinalDecision(evaluationResults, {});
      
      expect(decision.action).toBe('allow');
      expect(decision.reason).toBe('All policy checks passed');
    });
  });
  
  describe('Rule Applicability', () => {
    test('should match action type correctly', () => {
      const rule = { action_type: 'file_write' };
      const matchingAction = { action_type: 'file_write' };
      const nonMatchingAction = { action_type: 'file_read' };
      
      expect(policyManager.ruleAppliesTo(rule, matchingAction)).toBe(true);
      expect(policyManager.ruleAppliesTo(rule, nonMatchingAction)).toBe(false);
    });
    
    test('should match agent patterns', () => {
      const rule = { agent_pattern: '^admin_.*' };
      const matchingAgent = { agent_id: 'admin_user_123' };
      const nonMatchingAgent = { agent_id: 'regular_user_456' };
      
      expect(policyManager.ruleAppliesTo(rule, matchingAgent)).toBe(true);
      expect(policyManager.ruleAppliesTo(rule, nonMatchingAgent)).toBe(false);
    });
    
    test('should apply rule when no specific constraints', () => {
      const rule = {};
      const actionData = { action_type: 'any_action', agent_id: 'any_agent' };
      
      expect(policyManager.ruleAppliesTo(rule, actionData)).toBe(true);
    });
  });
  
  describe('Policy Applicability', () => {
    beforeEach(() => {
      // Create test policies
      policyManager.createPolicy({
        policy_id: 'active_file_policy',
        name: 'Active File Policy',
        policy_type: 'SECURITY',
        status: 'ACTIVE',
        rules: [
          { action_type: 'file_write' },
          { action_type: 'file_delete' }
        ]
      });
      
      policyManager.createPolicy({
        policy_id: 'draft_policy',
        name: 'Draft Policy',
        policy_type: 'COMPLIANCE',
        status: 'DRAFT',
        rules: [
          { action_type: 'file_write' }
        ]
      });
      
      policyManager.createPolicy({
        policy_id: 'admin_policy',
        name: 'Admin Policy',
        policy_type: 'OPERATIONAL',
        status: 'ACTIVE',
        rules: [
          { agent_pattern: '^admin_.*', action_type: 'system_config' }
        ]
      });
    });
    
    test('should find applicable policies for file operations', () => {
      const actionData = { action_type: 'file_write', agent_id: 'user_123' };
      const applicablePolicies = policyManager.getApplicablePolicies(actionData);
      
      expect(applicablePolicies).toHaveLength(1);
      expect(applicablePolicies[0].policy_id).toBe('active_file_policy');
    });
    
    test('should exclude draft policies', () => {
      const actionData = { action_type: 'file_write', agent_id: 'user_123' };
      const applicablePolicies = policyManager.getApplicablePolicies(actionData);
      
      expect(applicablePolicies.every(p => p.status === 'ACTIVE')).toBe(true);
    });
    
    test('should match agent-specific policies', () => {
      const actionData = { action_type: 'system_config', agent_id: 'admin_user_456' };
      const applicablePolicies = policyManager.getApplicablePolicies(actionData);
      
      expect(applicablePolicies).toHaveLength(1);
      expect(applicablePolicies[0].policy_id).toBe('admin_policy');
    });
    
    test('should return empty array when no policies apply', () => {
      const actionData = { action_type: 'unknown_action', agent_id: 'user_123' };
      const applicablePolicies = policyManager.getApplicablePolicies(actionData);
      
      expect(applicablePolicies).toHaveLength(0);
    });
  });
});

module.exports = {
  // Export any test utilities specific to enforcement testing
};

