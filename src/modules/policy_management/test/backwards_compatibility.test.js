/**
 * Backwards Compatibility Test Suite
 * 
 * Tests to ensure the PolicyManagement module maintains backwards compatibility
 * with existing systems and gracefully handles various edge cases.
 * 
 * @module policy_management/test/backwards_compatibility
 */

const fs = require('fs');
const path = require('path');
const { PolicyManagement } = require('../index');

describe('Backwards Compatibility', () => {
  const TEST_DATA_PATH = './test_data/backwards_compatibility';
  
  beforeEach(() => {
    // Clean up test data directory
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true });
    }
  });
  
  afterEach(() => {
    // Clean up test data
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true });
    }
  });
  
  describe('Initialization Compatibility', () => {
    test('should work with minimal configuration', () => {
      expect(() => {
        new PolicyManagement({});
      }).not.toThrow();
    });
    
    test('should work without logger', () => {
      const manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      expect(manager.logger).toBe(console);
    });
    
    test('should work without hooks manager', () => {
      const manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      expect(manager.hooks).toBeNull();
    });
    
    test('should use default configuration values', () => {
      const manager = new PolicyManagement({});
      
      expect(manager.config.dataPath).toBe('./data/policy_management');
      expect(manager.config.defaultEnforcementLevel).toBe('MODERATE');
      expect(manager.config.enablePolicyEnforcement).toBe(true);
      expect(manager.config.exemptionExpiryDays).toBe(30);
    });
    
    test('should handle missing data directory gracefully', () => {
      const nonExistentPath = './non_existent_directory';
      
      expect(() => {
        new PolicyManagement({
          config: { dataPath: nonExistentPath }
        });
      }).not.toThrow();
      
      expect(fs.existsSync(nonExistentPath)).toBe(true);
    });
  });
  
  describe('Schema Compatibility', () => {
    test('should work without schema files', () => {
      // This test verifies that the module works with fallback schemas
      // when the actual schema files are not available
      
      const manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      const result = manager.createPolicy({
        name: 'Test Policy',
        policy_type: 'SECURITY',
        rules: []
      });
      
      expect(result.success).toBe(true);
    });
    
    test('should validate using fallback schemas', () => {
      const manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      // Test valid policy
      const validPolicy = {
        policy_id: 'test_policy',
        name: 'Valid Policy',
        policy_type: 'SECURITY',
        status: 'ACTIVE',
        rules: []
      };
      
      const validResult = manager.validatePolicySchema(validPolicy);
      expect(validResult.valid).toBe(true);
      
      // Test invalid policy
      const invalidPolicy = {
        // Missing required fields
        description: 'Invalid policy'
      };
      
      const invalidResult = manager.validatePolicySchema(invalidPolicy);
      expect(invalidResult.valid).toBe(false);
    });
    
    test('should handle legacy policy formats', () => {
      const manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      // Legacy format without some newer fields
      const legacyPolicy = {
        name: 'Legacy Policy',
        policy_type: 'COMPLIANCE',
        rules: [
          {
            condition: 'require_approval'
          }
        ]
      };
      
      const result = manager.createPolicy(legacyPolicy);
      
      expect(result.success).toBe(true);
      expect(result.policy.status).toBe('DRAFT'); // Default value applied
      expect(result.policy.enforcement_level).toBe('MODERATE'); // Default value applied
      expect(result.policy.version).toBe('1.0.0'); // Default value applied
    });
  });
  
  describe('Data Format Compatibility', () => {
    test('should load policies with missing optional fields', () => {
      const policiesDir = path.join(TEST_DATA_PATH, 'policies');
      fs.mkdirSync(policiesDir, { recursive: true });
      
      // Create policy file with minimal fields
      const minimalPolicy = {
        policy_id: 'minimal_policy',
        name: 'Minimal Policy',
        policy_type: 'OPERATIONAL',
        status: 'ACTIVE',
        rules: []
      };
      
      fs.writeFileSync(
        path.join(policiesDir, 'minimal_policy.json'),
        JSON.stringify(minimalPolicy, null, 2)
      );
      
      const manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      const loadedPolicy = manager.getPolicy('minimal_policy');
      expect(loadedPolicy).toBeDefined();
      expect(loadedPolicy.name).toBe('Minimal Policy');
    });
    
    test('should handle corrupted data files gracefully', () => {
      const policiesDir = path.join(TEST_DATA_PATH, 'policies');
      fs.mkdirSync(policiesDir, { recursive: true });
      
      // Create corrupted JSON file
      fs.writeFileSync(
        path.join(policiesDir, 'corrupted.json'),
        '{ "policy_id": "corrupted", invalid json }'
      );
      
      // Create valid file
      const validPolicy = {
        policy_id: 'valid_policy',
        name: 'Valid Policy',
        policy_type: 'SECURITY',
        status: 'ACTIVE',
        rules: []
      };
      
      fs.writeFileSync(
        path.join(policiesDir, 'valid.json'),
        JSON.stringify(validPolicy, null, 2)
      );
      
      const manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      // Should load valid policy despite corrupted file
      const loadedPolicy = manager.getPolicy('valid_policy');
      expect(loadedPolicy).toBeDefined();
      
      // Corrupted policy should not be loaded
      const corruptedPolicy = manager.getPolicy('corrupted');
      expect(corruptedPolicy).toBeNull();
    });
    
    test('should handle empty data directories', () => {
      fs.mkdirSync(TEST_DATA_PATH, { recursive: true });
      
      expect(() => {
        new PolicyManagement({
          config: { dataPath: TEST_DATA_PATH }
        });
      }).not.toThrow();
    });
  });
  
  describe('API Compatibility', () => {
    let manager;
    
    beforeEach(() => {
      manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
    });
    
    test('should handle null and undefined inputs gracefully', () => {
      // Test createPolicy with null
      const nullResult = manager.createPolicy(null);
      expect(nullResult.success).toBe(false);
      expect(nullResult.error).toBe('Invalid policy data provided');
      
      // Test getPolicy with null
      const nullPolicy = manager.getPolicy(null);
      expect(nullPolicy).toBeNull();
      
      // Test updatePolicy with null
      const updateResult = manager.updatePolicy(null, {});
      expect(updateResult.success).toBe(false);
      
      // Test deletePolicy with null
      const deleteResult = manager.deletePolicy(null);
      expect(deleteResult.success).toBe(false);
    });
    
    test('should handle empty objects and arrays', () => {
      // Test with empty policy data
      const emptyResult = manager.createPolicy({});
      expect(emptyResult.success).toBe(true); // Should apply defaults
      
      // Test with empty filters
      const policies = manager.listPolicies({});
      expect(Array.isArray(policies)).toBe(true);
      
      // Test with empty rules
      const policyWithEmptyRules = manager.createPolicy({
        name: 'Empty Rules Policy',
        policy_type: 'OPERATIONAL',
        rules: []
      });
      expect(policyWithEmptyRules.success).toBe(true);
    });
    
    test('should maintain consistent return formats', () => {
      // All create/update/delete operations should return { success, ... }
      const createResult = manager.createPolicy({
        name: 'Test Policy',
        policy_type: 'SECURITY',
        rules: []
      });
      
      expect(createResult).toHaveProperty('success');
      expect(typeof createResult.success).toBe('boolean');
      
      if (createResult.success) {
        expect(createResult).toHaveProperty('policy_id');
        expect(createResult).toHaveProperty('policy');
      } else {
        expect(createResult).toHaveProperty('error');
      }
    });
    
    test('should handle legacy method signatures', () => {
      // Test that methods work with minimal required parameters
      const policy = manager.createPolicy({
        name: 'Legacy Policy',
        rules: [] // Minimal required data
      });
      
      expect(policy.success).toBe(true);
      
      // Test that optional parameters are truly optional
      const exemption = manager.createExemption({
        policy_id: policy.policy_id,
        agent_id: 'test_agent',
        reason: 'Testing'
        // No optional fields provided
      });
      
      expect(exemption.success).toBe(true);
    });
  });
  
  describe('Configuration Compatibility', () => {
    test('should handle boolean configuration values correctly', () => {
      // Test explicit false values
      const manager1 = new PolicyManagement({
        config: {
          dataPath: TEST_DATA_PATH,
          enablePolicyEnforcement: false
        }
      });
      
      expect(manager1.config.enablePolicyEnforcement).toBe(false);
      
      // Test explicit true values
      const manager2 = new PolicyManagement({
        config: {
          dataPath: TEST_DATA_PATH,
          enablePolicyEnforcement: true
        }
      });
      
      expect(manager2.config.enablePolicyEnforcement).toBe(true);
      
      // Test default values
      const manager3 = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      expect(manager3.config.enablePolicyEnforcement).toBe(true);
    });
    
    test('should handle numeric configuration values', () => {
      const manager = new PolicyManagement({
        config: {
          dataPath: TEST_DATA_PATH,
          exemptionExpiryDays: 60,
          backupRetentionDays: 180
        }
      });
      
      expect(manager.config.exemptionExpiryDays).toBe(60);
      expect(manager.config.backupRetentionDays).toBe(180);
    });
    
    test('should handle string configuration values', () => {
      const manager = new PolicyManagement({
        config: {
          dataPath: TEST_DATA_PATH,
          defaultEnforcementLevel: 'STRICT'
        }
      });
      
      expect(manager.config.defaultEnforcementLevel).toBe('STRICT');
    });
  });
  
  describe('Error Handling Compatibility', () => {
    let manager;
    
    beforeEach(() => {
      manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
    });
    
    test('should not throw exceptions for invalid operations', () => {
      // All operations should return error objects instead of throwing
      expect(() => {
        manager.createPolicy({ invalid: 'data' });
      }).not.toThrow();
      
      expect(() => {
        manager.updatePolicy('non_existent', { name: 'New Name' });
      }).not.toThrow();
      
      expect(() => {
        manager.deletePolicy('non_existent');
      }).not.toThrow();
      
      expect(() => {
        manager.createExemption({ invalid: 'exemption' });
      }).not.toThrow();
    });
    
    test('should handle file system permission errors', () => {
      // Mock fs operations to simulate permission errors
      const originalWriteFileSync = fs.writeFileSync;
      fs.writeFileSync = jest.fn().mockImplementation(() => {
        const error = new Error('Permission denied');
        error.code = 'EACCES';
        throw error;
      });
      
      // Should not throw, should handle gracefully
      expect(() => {
        manager.createPolicy({
          name: 'Permission Test',
          policy_type: 'SECURITY',
          rules: []
        });
      }).not.toThrow();
      
      // Restore original function
      fs.writeFileSync = originalWriteFileSync;
    });
    
    test('should handle disk space errors', () => {
      // Mock fs operations to simulate disk space errors
      const originalWriteFileSync = fs.writeFileSync;
      fs.writeFileSync = jest.fn().mockImplementation(() => {
        const error = new Error('No space left on device');
        error.code = 'ENOSPC';
        throw error;
      });
      
      // Should not throw, should handle gracefully
      expect(() => {
        manager.backupData();
      }).not.toThrow();
      
      // Restore original function
      fs.writeFileSync = originalWriteFileSync;
    });
  });
  
  describe('Performance Compatibility', () => {
    let manager;
    
    beforeEach(() => {
      manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
    });
    
    test('should handle large numbers of policies efficiently', () => {
      const startTime = Date.now();
      
      // Create 100 policies
      for (let i = 0; i < 100; i++) {
        manager.createPolicy({
          name: `Policy ${i}`,
          policy_type: 'OPERATIONAL',
          rules: []
        });
      }
      
      const creationTime = Date.now() - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(creationTime).toBeLessThan(5000); // 5 seconds
      
      // Test listing performance
      const listStartTime = Date.now();
      const policies = manager.listPolicies();
      const listTime = Date.now() - listStartTime;
      
      expect(policies).toHaveLength(100);
      expect(listTime).toBeLessThan(1000); // 1 second
    });
    
    test('should handle complex policy rules efficiently', () => {
      const complexRules = [];
      for (let i = 0; i < 50; i++) {
        complexRules.push({
          condition: 'sensitive_data_check',
          action_type: `action_${i}`,
          agent_pattern: `^agent_${i}_.*`
        });
      }
      
      const startTime = Date.now();
      
      const result = manager.createPolicy({
        name: 'Complex Policy',
        policy_type: 'SECURITY',
        status: 'ACTIVE',
        rules: complexRules
      });
      
      const creationTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(creationTime).toBeLessThan(1000); // 1 second
      
      // Test enforcement performance with complex rules
      const enforcementStartTime = Date.now();
      
      const decision = manager.enforcePolicy({
        agent_id: 'agent_25_test',
        action_type: 'action_25',
        content: 'Test content'
      });
      
      const enforcementTime = Date.now() - enforcementStartTime;
      
      expect(decision).toBeDefined();
      expect(enforcementTime).toBeLessThan(500); // 0.5 seconds
    });
  });
  
  describe('Integration Compatibility', () => {
    test('should work with different logger implementations', () => {
      const customLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn() // Additional method
      };
      
      expect(() => {
        new PolicyManagement({
          logger: customLogger,
          config: { dataPath: TEST_DATA_PATH }
        });
      }).not.toThrow();
      
      expect(customLogger.info).toHaveBeenCalled();
    });
    
    test('should work with different hooks implementations', () => {
      const customHooks = {
        register: jest.fn(),
        unregister: jest.fn(), // Additional method
        emit: jest.fn() // Additional method
      };
      
      expect(() => {
        new PolicyManagement({
          config: { dataPath: TEST_DATA_PATH },
          hooks: customHooks
        });
      }).not.toThrow();
      
      expect(customHooks.register).toHaveBeenCalled();
    });
    
    test('should maintain state consistency across operations', () => {
      const manager = new PolicyManagement({
        config: { dataPath: TEST_DATA_PATH }
      });
      
      // Create policy
      const createResult = manager.createPolicy({
        name: 'Consistency Test',
        policy_type: 'SECURITY',
        rules: []
      });
      
      // Verify it exists in memory
      const memoryPolicy = manager.getPolicy(createResult.policy_id);
      expect(memoryPolicy).toBeDefined();
      
      // Verify it's in the list
      const policies = manager.listPolicies();
      const foundPolicy = policies.find(p => p.policy_id === createResult.policy_id);
      expect(foundPolicy).toBeDefined();
      
      // Update policy
      const updateResult = manager.updatePolicy(createResult.policy_id, {
        name: 'Updated Name'
      });
      
      // Verify update is reflected everywhere
      const updatedMemoryPolicy = manager.getPolicy(createResult.policy_id);
      expect(updatedMemoryPolicy.name).toBe('Updated Name');
      
      const updatedPolicies = manager.listPolicies();
      const updatedFoundPolicy = updatedPolicies.find(p => p.policy_id === createResult.policy_id);
      expect(updatedFoundPolicy.name).toBe('Updated Name');
    });
  });
});

module.exports = {
  // Export any utilities for backwards compatibility testing
};

