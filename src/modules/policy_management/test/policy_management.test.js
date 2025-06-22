/**
 * Policy Management Module Test Suite
 * 
 * Comprehensive tests for the PolicyManagement class including:
 * - Core functionality tests
 * - Extension design pattern validation
 * - Backwards compatibility verification
 * - Error handling and edge cases
 * 
 * @module policy_management/test
 */

const fs = require('fs');
const path = require('path');
const { PolicyManagement } = require('../index');

// Test configuration
const TEST_DATA_PATH = './test_data/policy_management';
const TEST_CONFIG = {
  dataPath: TEST_DATA_PATH,
  defaultEnforcementLevel: 'MODERATE',
  enablePolicyEnforcement: true,
  exemptionExpiryDays: 30
};

// Mock logger for testing
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock hooks manager for testing
const mockHooksManager = {
  register: jest.fn(),
  hooks: new Map()
};

describe('PolicyManagement Module', () => {
  let policyManager;
  
  beforeEach(() => {
    // Clean up test data directory
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true });
    }
    
    // Create fresh instance
    policyManager = new PolicyManagement({
      logger: mockLogger,
      config: TEST_CONFIG,
      hooks: mockHooksManager
    });
    
    // Clear mock calls
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Clean up test data
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true });
    }
  });
  
  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const manager = new PolicyManagement({});
      
      expect(manager.config.dataPath).toBe('./data/policy_management');
      expect(manager.config.defaultEnforcementLevel).toBe('MODERATE');
      expect(manager.config.enablePolicyEnforcement).toBe(true);
    });
    
    test('should create data directory structure', () => {
      expect(fs.existsSync(path.join(TEST_DATA_PATH, 'policies'))).toBe(true);
      expect(fs.existsSync(path.join(TEST_DATA_PATH, 'exemptions'))).toBe(true);
      expect(fs.existsSync(path.join(TEST_DATA_PATH, 'decisions'))).toBe(true);
      expect(fs.existsSync(path.join(TEST_DATA_PATH, 'backups'))).toBe(true);
    });
    
    test('should register constitutional hooks when hooks manager provided', () => {
      expect(mockHooksManager.register).toHaveBeenCalledWith('beforeAgentAction', expect.any(Function));
      expect(mockHooksManager.register).toHaveBeenCalledWith('afterAgentAction', expect.any(Function));
      expect(mockHooksManager.register).toHaveBeenCalledWith('beforeAgentInteraction', expect.any(Function));
      expect(mockHooksManager.register).toHaveBeenCalledWith('beforeAgentDelegation', expect.any(Function));
    });
    
    test('should work without hooks manager (backwards compatibility)', () => {
      const manager = new PolicyManagement({
        logger: mockLogger,
        config: TEST_CONFIG
      });
      
      expect(manager.hooks).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('Policy Management module initialized');
    });
  });
  
  describe('Policy CRUD Operations', () => {
    describe('createPolicy', () => {
      test('should create a valid policy', () => {
        const policyData = {
          name: 'Test Security Policy',
          description: 'A test security policy',
          policy_type: 'SECURITY',
          status: 'DRAFT',
          rules: [
            {
              condition: 'require_approval',
              action_type: 'file_write'
            }
          ],
          enforcement_level: 'STRICT'
        };
        
        const result = policyManager.createPolicy(policyData);
        
        expect(result.success).toBe(true);
        expect(result.policy_id).toBeDefined();
        expect(result.policy.name).toBe('Test Security Policy');
        expect(result.policy.policy_type).toBe('SECURITY');
        expect(result.policy.created_at).toBeDefined();
        expect(result.policy.updated_at).toBeDefined();
      });
      
      test('should generate policy ID if not provided', () => {
        const policyData = {
          name: 'Test Policy',
          policy_type: 'OPERATIONAL',
          rules: []
        };
        
        const result = policyManager.createPolicy(policyData);
        
        expect(result.success).toBe(true);
        expect(result.policy_id).toMatch(/^policy_[a-f0-9]{8}$/);
      });
      
      test('should use provided policy ID', () => {
        const policyData = {
          policy_id: 'custom_policy_123',
          name: 'Custom Policy',
          policy_type: 'COMPLIANCE',
          rules: []
        };
        
        const result = policyManager.createPolicy(policyData);
        
        expect(result.success).toBe(true);
        expect(result.policy_id).toBe('custom_policy_123');
      });
      
      test('should reject duplicate policy IDs', () => {
        const policyData = {
          policy_id: 'duplicate_policy',
          name: 'First Policy',
          policy_type: 'SECURITY',
          rules: []
        };
        
        policyManager.createPolicy(policyData);
        const result = policyManager.createPolicy(policyData);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('already exists');
      });
      
      test('should validate policy type', () => {
        const policyData = {
          name: 'Invalid Policy',
          policy_type: 'INVALID_TYPE',
          rules: []
        };
        
        const result = policyManager.createPolicy(policyData);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid policy type');
      });
      
      test('should apply default values', () => {
        const policyData = {
          name: 'Minimal Policy',
          rules: []
        };
        
        const result = policyManager.createPolicy(policyData);
        
        expect(result.success).toBe(true);
        expect(result.policy.policy_type).toBe('OPERATIONAL');
        expect(result.policy.status).toBe('DRAFT');
        expect(result.policy.enforcement_level).toBe('MODERATE');
        expect(result.policy.created_by).toBe('system');
        expect(result.policy.version).toBe('1.0.0');
      });
      
      test('should persist policy to file', () => {
        const policyData = {
          name: 'File Test Policy',
          policy_type: 'SECURITY',
          rules: []
        };
        
        const result = policyManager.createPolicy(policyData);
        const filePath = path.join(TEST_DATA_PATH, 'policies', `${result.policy_id}.json`);
        
        expect(fs.existsSync(filePath)).toBe(true);
        
        const savedPolicy = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        expect(savedPolicy.name).toBe('File Test Policy');
      });
    });
    
    describe('getPolicy', () => {
      test('should retrieve existing policy', () => {
        const policyData = {
          name: 'Retrievable Policy',
          policy_type: 'COMPLIANCE',
          rules: []
        };
        
        const createResult = policyManager.createPolicy(policyData);
        const policy = policyManager.getPolicy(createResult.policy_id);
        
        expect(policy).toBeDefined();
        expect(policy.name).toBe('Retrievable Policy');
      });
      
      test('should return null for non-existent policy', () => {
        const policy = policyManager.getPolicy('non_existent_policy');
        expect(policy).toBeNull();
      });
      
      test('should handle invalid input gracefully', () => {
        const policy = policyManager.getPolicy(null);
        expect(policy).toBeNull();
        expect(mockLogger.warn).toHaveBeenCalledWith('Policy ID is required');
      });
    });
    
    describe('listPolicies', () => {
      beforeEach(() => {
        // Create test policies
        policyManager.createPolicy({
          name: 'Active Security Policy',
          policy_type: 'SECURITY',
          status: 'ACTIVE',
          enforcement_level: 'STRICT',
          rules: []
        });
        
        policyManager.createPolicy({
          name: 'Draft Compliance Policy',
          policy_type: 'COMPLIANCE',
          status: 'DRAFT',
          enforcement_level: 'MODERATE',
          rules: []
        });
        
        policyManager.createPolicy({
          name: 'Active Operational Policy',
          policy_type: 'OPERATIONAL',
          status: 'ACTIVE',
          enforcement_level: 'ADVISORY',
          rules: []
        });
      });
      
      test('should list all policies without filters', () => {
        const policies = policyManager.listPolicies();
        expect(policies).toHaveLength(3);
      });
      
      test('should filter by status', () => {
        const activePolicies = policyManager.listPolicies({ status: 'ACTIVE' });
        expect(activePolicies).toHaveLength(2);
        expect(activePolicies.every(p => p.status === 'ACTIVE')).toBe(true);
      });
      
      test('should filter by policy type', () => {
        const securityPolicies = policyManager.listPolicies({ policy_type: 'SECURITY' });
        expect(securityPolicies).toHaveLength(1);
        expect(securityPolicies[0].name).toBe('Active Security Policy');
      });
      
      test('should filter by enforcement level', () => {
        const strictPolicies = policyManager.listPolicies({ enforcement_level: 'STRICT' });
        expect(strictPolicies).toHaveLength(1);
        expect(strictPolicies[0].enforcement_level).toBe('STRICT');
      });
      
      test('should combine multiple filters', () => {
        const filteredPolicies = policyManager.listPolicies({
          status: 'ACTIVE',
          policy_type: 'SECURITY'
        });
        expect(filteredPolicies).toHaveLength(1);
        expect(filteredPolicies[0].name).toBe('Active Security Policy');
      });
      
      test('should sort by creation date (newest first)', () => {
        const policies = policyManager.listPolicies();
        for (let i = 1; i < policies.length; i++) {
          const current = new Date(policies[i].created_at);
          const previous = new Date(policies[i - 1].created_at);
          expect(current <= previous).toBe(true);
        }
      });
    });
    
    describe('updatePolicy', () => {
      let policyId;
      
      beforeEach(() => {
        const result = policyManager.createPolicy({
          name: 'Updatable Policy',
          policy_type: 'SECURITY',
          status: 'DRAFT',
          rules: []
        });
        policyId = result.policy_id;
      });
      
      test('should update existing policy', () => {
        const updates = {
          name: 'Updated Policy Name',
          status: 'ACTIVE',
          description: 'Updated description'
        };
        
        const result = policyManager.updatePolicy(policyId, updates);
        
        expect(result.success).toBe(true);
        expect(result.policy.name).toBe('Updated Policy Name');
        expect(result.policy.status).toBe('ACTIVE');
        expect(result.policy.description).toBe('Updated description');
        expect(result.policy.updated_at).toBeDefined();
      });
      
      test('should not allow policy ID changes', () => {
        const updates = {
          policy_id: 'new_id',
          name: 'Updated Name'
        };
        
        const result = policyManager.updatePolicy(policyId, updates);
        
        expect(result.success).toBe(true);
        expect(result.policy.policy_id).toBe(policyId); // Original ID preserved
      });
      
      test('should validate updated policy', () => {
        const updates = {
          policy_type: 'INVALID_TYPE'
        };
        
        const result = policyManager.updatePolicy(policyId, updates);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Schema validation failed');
      });
      
      test('should handle non-existent policy', () => {
        const result = policyManager.updatePolicy('non_existent', { name: 'New Name' });
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });
    });
    
    describe('deletePolicy', () => {
      let policyId;
      
      beforeEach(() => {
        const result = policyManager.createPolicy({
          name: 'Deletable Policy',
          policy_type: 'OPERATIONAL',
          rules: []
        });
        policyId = result.policy_id;
      });
      
      test('should archive policy instead of deleting', () => {
        const result = policyManager.deletePolicy(policyId);
        
        expect(result.success).toBe(true);
        
        const policy = policyManager.getPolicy(policyId);
        expect(policy.status).toBe('ARCHIVED');
        expect(policy.archived_at).toBeDefined();
      });
      
      test('should handle non-existent policy', () => {
        const result = policyManager.deletePolicy('non_existent');
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });
    });
  });
  
  describe('Policy Enforcement', () => {
    let securityPolicy, compliancePolicy;
    
    beforeEach(() => {
      // Create test policies
      const securityResult = policyManager.createPolicy({
        name: 'Strict Security Policy',
        policy_type: 'SECURITY',
        status: 'ACTIVE',
        enforcement_level: 'STRICT',
        rules: [
          {
            condition: 'deny_all',
            action_type: 'file_delete'
          }
        ]
      });
      securityPolicy = securityResult.policy_id;
      
      const complianceResult = policyManager.createPolicy({
        name: 'Moderate Compliance Policy',
        policy_type: 'COMPLIANCE',
        status: 'ACTIVE',
        enforcement_level: 'MODERATE',
        rules: [
          {
            condition: 'sensitive_data_check',
            action_type: 'file_write'
          }
        ]
      });
      compliancePolicy = complianceResult.policy_id;
    });
    
    test('should allow actions with no applicable policies', () => {
      const actionData = {
        agent_id: 'test_agent',
        action_type: 'file_read',
        content: 'Safe content'
      };
      
      const decision = policyManager.enforcePolicy(actionData);
      
      expect(decision.action).toBe('allow');
      expect(decision.reason).toContain('No applicable policies');
    });
    
    test('should deny actions that violate strict policies', () => {
      const actionData = {
        agent_id: 'test_agent',
        action_type: 'file_delete',
        filename: 'important.txt'
      };
      
      const decision = policyManager.enforcePolicy(actionData);
      
      expect(decision.action).toBe('deny');
      expect(decision.reason).toContain('Strict policy violations');
      expect(decision.policies_evaluated).toContain(securityPolicy);
    });
    
    test('should modify actions with sensitive data', () => {
      const actionData = {
        agent_id: 'test_agent',
        action_type: 'file_write',
        content: 'User email: john@example.com and SSN: 123-45-6789'
      };
      
      const decision = policyManager.enforcePolicy(actionData);
      
      expect(decision.action).toBe('modify');
      expect(decision.modifications.content).toContain('[REDACTED-EMAIL]');
      expect(decision.modifications.content).toContain('[REDACTED-SSN]');
    });
    
    test('should log moderate violations when modification not possible', () => {
      const actionData = {
        agent_id: 'test_agent',
        action_type: 'file_write',
        content: 'Sensitive data without modification capability'
      };
      
      // Mock the generateModifications to return null
      const originalMethod = policyManager.generateModifications;
      policyManager.generateModifications = jest.fn().mockReturnValue(null);
      
      const decision = policyManager.enforcePolicy(actionData);
      
      expect(decision.action).toBe('log');
      expect(decision.reason).toContain('Policy violations logged');
      
      // Restore original method
      policyManager.generateModifications = originalMethod;
    });
    
    test('should handle enforcement disabled', () => {
      policyManager.config.enablePolicyEnforcement = false;
      
      const actionData = {
        agent_id: 'test_agent',
        action_type: 'file_delete'
      };
      
      const decision = policyManager.enforcePolicy(actionData);
      
      expect(decision.action).toBe('allow');
      expect(decision.reason).toBe('Policy enforcement disabled');
    });
    
    test('should persist policy decisions', () => {
      const actionData = {
        agent_id: 'test_agent',
        action_type: 'file_read'
      };
      
      const decision = policyManager.enforcePolicy(actionData);
      
      expect(decision.decision_id).toBeDefined();
      expect(decision.timestamp).toBeDefined();
      
      // Check if decision is stored
      const storedDecision = policyManager.policyDecisions.get(decision.decision_id);
      expect(storedDecision).toBeDefined();
      expect(storedDecision.agent_id).toBe('test_agent');
    });
  });
  
  describe('Exemption Management', () => {
    let policyId;
    
    beforeEach(() => {
      const result = policyManager.createPolicy({
        name: 'Test Policy for Exemptions',
        policy_type: 'SECURITY',
        status: 'ACTIVE',
        rules: []
      });
      policyId = result.policy_id;
    });
    
    test('should create exemption for existing policy', () => {
      const exemptionData = {
        policy_id: policyId,
        agent_id: 'test_agent',
        reason: 'Testing exemption functionality'
      };
      
      const result = policyManager.createExemption(exemptionData);
      
      expect(result.success).toBe(true);
      expect(result.exemption_id).toBeDefined();
      expect(result.exemption.status).toBe('PENDING');
      expect(result.exemption.expires_at).toBeDefined();
    });
    
    test('should reject exemption for non-existent policy', () => {
      const exemptionData = {
        policy_id: 'non_existent_policy',
        agent_id: 'test_agent',
        reason: 'Testing'
      };
      
      const result = policyManager.createExemption(exemptionData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Policy non_existent_policy not found');
    });
    
    test('should calculate expiry date based on configuration', () => {
      const exemptionData = {
        policy_id: policyId,
        agent_id: 'test_agent',
        reason: 'Testing expiry'
      };
      
      const result = policyManager.createExemption(exemptionData);
      const expiryDate = new Date(result.exemption.expires_at);
      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + 30); // Default 30 days
      
      // Allow for small time differences in test execution
      const timeDiff = Math.abs(expiryDate.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds difference
    });
    
    test('should persist exemption to file', () => {
      const exemptionData = {
        policy_id: policyId,
        agent_id: 'test_agent',
        reason: 'File persistence test'
      };
      
      const result = policyManager.createExemption(exemptionData);
      const filePath = path.join(TEST_DATA_PATH, 'exemptions', `${result.exemption_id}.json`);
      
      expect(fs.existsSync(filePath)).toBe(true);
      
      const savedExemption = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(savedExemption.reason).toBe('File persistence test');
    });
  });
  
  describe('Data Persistence and Loading', () => {
    test('should load policies from files on initialization', () => {
      // Create a policy file manually
      const policiesDir = path.join(TEST_DATA_PATH, 'policies');
      fs.mkdirSync(policiesDir, { recursive: true });
      
      const testPolicy = {
        policy_id: 'loaded_policy_123',
        name: 'Loaded Policy',
        policy_type: 'SECURITY',
        status: 'ACTIVE',
        rules: []
      };
      
      fs.writeFileSync(
        path.join(policiesDir, 'loaded_policy_123.json'),
        JSON.stringify(testPolicy, null, 2)
      );
      
      // Create new instance to trigger loading
      const newManager = new PolicyManagement({
        logger: mockLogger,
        config: TEST_CONFIG
      });
      
      const loadedPolicy = newManager.getPolicy('loaded_policy_123');
      expect(loadedPolicy).toBeDefined();
      expect(loadedPolicy.name).toBe('Loaded Policy');
    });
    
    test('should handle corrupted policy files gracefully', () => {
      const policiesDir = path.join(TEST_DATA_PATH, 'policies');
      fs.mkdirSync(policiesDir, { recursive: true });
      
      // Create corrupted JSON file
      fs.writeFileSync(
        path.join(policiesDir, 'corrupted.json'),
        '{ invalid json content'
      );
      
      // Should not throw error
      expect(() => {
        new PolicyManagement({
          logger: mockLogger,
          config: TEST_CONFIG
        });
      }).not.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load policy from corrupted.json')
      );
    });
    
    test('should create backup of all data', () => {
      // Create some test data
      policyManager.createPolicy({
        name: 'Backup Test Policy',
        policy_type: 'OPERATIONAL',
        rules: []
      });
      
      const result = policyManager.backupData();
      
      expect(result).toBe(true);
      
      // Check if backup directory was created
      const backupsDir = path.join(TEST_DATA_PATH, 'backups');
      const backupDirs = fs.readdirSync(backupsDir);
      expect(backupDirs.length).toBeGreaterThan(0);
      
      // Check if backup files exist
      const latestBackup = backupDirs[0];
      const backupPath = path.join(backupsDir, latestBackup);
      expect(fs.existsSync(path.join(backupPath, 'policies.json'))).toBe(true);
      expect(fs.existsSync(path.join(backupPath, 'exemptions.json'))).toBe(true);
      expect(fs.existsSync(path.join(backupPath, 'decisions.json'))).toBe(true);
    });
  });
  
  describe('Statistics and Monitoring', () => {
    beforeEach(() => {
      // Create test data
      policyManager.createPolicy({
        name: 'Active Policy 1',
        policy_type: 'SECURITY',
        status: 'ACTIVE',
        rules: []
      });
      
      policyManager.createPolicy({
        name: 'Draft Policy 1',
        policy_type: 'COMPLIANCE',
        status: 'DRAFT',
        rules: []
      });
      
      policyManager.createExemption({
        policy_id: 'test_policy',
        agent_id: 'test_agent',
        reason: 'Test exemption'
      });
    });
    
    test('should provide accurate statistics', () => {
      const stats = policyManager.getStatistics();
      
      expect(stats.total_policies).toBe(2);
      expect(stats.active_policies).toBe(1);
      expect(stats.draft_policies).toBe(1);
      expect(stats.total_exemptions).toBe(1);
      expect(stats.pending_exemptions).toBe(1);
      expect(stats.total_decisions).toBe(0);
      expect(stats.recent_decisions).toBe(0);
    });
  });
  
  describe('Backwards Compatibility', () => {
    test('should work without schema files', () => {
      // This test verifies the fallback schema functionality
      expect(() => {
        new PolicyManagement({
          logger: mockLogger,
          config: TEST_CONFIG
        });
      }).not.toThrow();
    });
    
    test('should handle missing configuration gracefully', () => {
      const manager = new PolicyManagement({});
      
      expect(manager.config.dataPath).toBe('./data/policy_management');
      expect(manager.config.enablePolicyEnforcement).toBe(true);
    });
    
    test('should work without logger', () => {
      expect(() => {
        new PolicyManagement({
          config: TEST_CONFIG
        });
      }).not.toThrow();
    });
    
    test('should validate legacy policy formats', () => {
      const legacyPolicy = {
        name: 'Legacy Policy',
        policy_type: 'SECURITY',
        rules: []
      };
      
      const result = policyManager.createPolicy(legacyPolicy);
      expect(result.success).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle file system errors gracefully', () => {
      // Mock fs.writeFileSync to throw error
      const originalWriteFileSync = fs.writeFileSync;
      fs.writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('File system error');
      });
      
      const result = policyManager.createPolicy({
        name: 'Error Test Policy',
        policy_type: 'SECURITY',
        rules: []
      });
      
      // Should still succeed in memory even if file save fails
      expect(result.success).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save policy to file')
      );
      
      // Restore original function
      fs.writeFileSync = originalWriteFileSync;
    });
    
    test('should handle invalid input data', () => {
      const result = policyManager.createPolicy(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid policy data provided');
    });
    
    test('should handle enforcement errors gracefully', () => {
      // Mock a method to throw error
      const originalMethod = policyManager.getApplicablePolicies;
      policyManager.getApplicablePolicies = jest.fn().mockImplementation(() => {
        throw new Error('Enforcement error');
      });
      
      const decision = policyManager.enforcePolicy({
        agent_id: 'test_agent',
        action_type: 'test_action'
      });
      
      expect(decision.action).toBe('deny');
      expect(decision.reason).toContain('Policy enforcement error');
      
      // Restore original method
      policyManager.getApplicablePolicies = originalMethod;
    });
  });
  
  describe('Constitutional Hooks Integration', () => {
    test('should call enforcement hook for agent actions', () => {
      const actionData = {
        agent_id: 'test_agent',
        action_type: 'file_write'
      };
      
      const decision = policyManager.enforcePolicy(actionData);
      expect(decision).toBeDefined();
    });
    
    test('should handle interaction policy checks', () => {
      const interactionData = {
        agent_id: 'agent1',
        target_agent_id: 'agent2',
        interaction_type: 'message'
      };
      
      const decision = policyManager.checkInteractionPolicies(interactionData);
      expect(decision.action).toBeDefined();
    });
    
    test('should validate delegation policies', () => {
      const delegationData = {
        agent_id: 'delegator',
        delegate_id: 'delegate',
        task_type: 'data_processing'
      };
      
      const decision = policyManager.validateDelegationPolicies(delegationData);
      expect(decision.action).toBeDefined();
    });
  });
});

// Export test utilities for integration tests
module.exports = {
  TEST_DATA_PATH,
  TEST_CONFIG,
  mockLogger,
  mockHooksManager
};

