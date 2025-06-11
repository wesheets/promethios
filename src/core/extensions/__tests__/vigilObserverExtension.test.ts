/**
 * Tests for VigilObserver Extension Integration
 * 
 * This file contains tests to validate the VigilObserver extension registration
 * and functionality through the ExtensionRegistry.
 */

import { ExtensionRegistry } from '../ExtensionRegistry';
import { registerVigilObserverExtension, getVigilObserverExtensionPoint, EXTENSION_VERSION } from '../vigilObserverExtension';
import { VigilObserver } from '../../../observers/vigil';

// Mock VigilObserver
jest.mock('../../../observers/vigil', () => {
  return {
    VigilObserver: jest.fn().mockImplementation(() => {
      return {
        getMetrics: jest.fn().mockReturnValue({
          violations: {
            total: 5,
            byRule: { 'rule1': 5 },
            byTool: { 'shell_exec': 5 },
            bySeverity: { 'critical': 5 }
          },
          enforcements: {
            total: 5,
            byRule: { 'rule1': 5 },
            byAction: { 'blocked': 5 }
          }
        }),
        getViolations: jest.fn().mockReturnValue([
          {
            ruleId: 'rule1',
            timestamp: '2025-06-10T12:00:00Z',
            agentId: 'agent1',
            userId: 'user1',
            systemId: 'system1',
            severity: 'critical'
          }
        ]),
        getEnforcements: jest.fn().mockReturnValue([
          {
            ruleId: 'rule1',
            timestamp: '2025-06-10T12:00:00Z',
            agentId: 'agent1',
            userId: 'user1',
            systemId: 'system1',
            action: 'blocked'
          }
        ]),
        analyzeComplianceStatus: jest.fn().mockReturnValue({
          status: 'violations_detected',
          compliant: false,
          violationCount: 5,
          enforcementCount: 5,
          complianceScore: 85
        })
      };
    })
  };
});

describe('VigilObserver Extension Integration', () => {
  let extensionRegistry: ExtensionRegistry;
  
  beforeEach(() => {
    // Reset the ExtensionRegistry singleton for each test
    // @ts-ignore - accessing private property for testing
    ExtensionRegistry.instance = null;
    extensionRegistry = ExtensionRegistry.getInstance();
    
    // Register the VigilObserver extension
    registerVigilObserverExtension();
  });
  
  test('should register VigilObserver extension point', () => {
    // Get the extension point
    const vigilObserverExtensionPoint = extensionRegistry.getExtensionPoint('vigilObserver', EXTENSION_VERSION);
    
    // Verify the extension point exists
    expect(vigilObserverExtensionPoint).toBeDefined();
    expect(vigilObserverExtensionPoint?.id).toBe('vigilObserver');
    expect(vigilObserverExtensionPoint?.version).toBe(EXTENSION_VERSION);
  });
  
  test('should register default implementation', () => {
    // Get the extension point
    const vigilObserverExtensionPoint = extensionRegistry.getExtensionPoint('vigilObserver', EXTENSION_VERSION);
    
    // Verify the default implementation exists
    const implementation = vigilObserverExtensionPoint?.getDefault();
    expect(implementation).toBeDefined();
    
    // Verify the implementation metadata
    const metadata = vigilObserverExtensionPoint?.getMetadata('default');
    expect(metadata).toBeDefined();
    expect(metadata?.name).toBe('Default VigilObserver Implementation');
    expect(metadata?.version).toBe(EXTENSION_VERSION);
  });
  
  test('should get metrics through extension point', () => {
    // Get the extension point
    const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
    
    // Get the implementation
    const implementation = vigilObserverExtensionPoint?.getDefault();
    
    // Call getMetrics
    const metrics = implementation?.getMetrics();
    
    // Verify the metrics
    expect(metrics).toBeDefined();
    expect(metrics?.violations.total).toBe(5);
    expect(metrics?.violations.byRule.rule1).toBe(5);
    expect(metrics?.violations.byTool.shell_exec).toBe(5);
    expect(metrics?.violations.bySeverity.critical).toBe(5);
    expect(metrics?.enforcements.total).toBe(5);
    expect(metrics?.enforcements.byRule.rule1).toBe(5);
    expect(metrics?.enforcements.byAction.blocked).toBe(5);
    
    // Verify VigilObserver was instantiated
    expect(VigilObserver).toHaveBeenCalled();
  });
  
  test('should get violations through extension point', () => {
    // Get the extension point
    const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
    
    // Get the implementation
    const implementation = vigilObserverExtensionPoint?.getDefault();
    
    // Call getViolations
    const violations = implementation?.getViolations();
    
    // Verify the violations
    expect(violations).toBeDefined();
    expect(violations?.length).toBe(1);
    expect(violations?.[0].ruleId).toBe('rule1');
    expect(violations?.[0].severity).toBe('critical');
    
    // Verify VigilObserver was instantiated
    expect(VigilObserver).toHaveBeenCalled();
  });
  
  test('should get enforcements through extension point', () => {
    // Get the extension point
    const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
    
    // Get the implementation
    const implementation = vigilObserverExtensionPoint?.getDefault();
    
    // Call getEnforcements
    const enforcements = implementation?.getEnforcements();
    
    // Verify the enforcements
    expect(enforcements).toBeDefined();
    expect(enforcements?.length).toBe(1);
    expect(enforcements?.[0].ruleId).toBe('rule1');
    expect(enforcements?.[0].action).toBe('blocked');
    
    // Verify VigilObserver was instantiated
    expect(VigilObserver).toHaveBeenCalled();
  });
  
  test('should analyze compliance status through extension point', () => {
    // Get the extension point
    const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
    
    // Get the implementation
    const implementation = vigilObserverExtensionPoint?.getDefault();
    
    // Call analyzeComplianceStatus
    const status = implementation?.analyzeComplianceStatus();
    
    // Verify the status
    expect(status).toBeDefined();
    expect(status?.status).toBe('violations_detected');
    expect(status?.compliant).toBe(false);
    expect(status?.violationCount).toBe(5);
    expect(status?.enforcementCount).toBe(5);
    expect(status?.complianceScore).toBe(85);
    
    // Verify VigilObserver was instantiated
    expect(VigilObserver).toHaveBeenCalled();
  });
  
  test('should get observations through extension point', async () => {
    // Get the extension point
    const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
    
    // Get the implementation
    const implementation = vigilObserverExtensionPoint?.getDefault();
    
    // Call getObservations
    const observations = await implementation?.getObservations({});
    
    // Verify the observations
    expect(observations).toBeDefined();
    expect(observations?.length).toBe(2); // 1 violation + 1 enforcement
    
    // Check the first observation (violation)
    const violation = observations?.find((o: any) => o.type === 'violation');
    expect(violation).toBeDefined();
    expect(violation?.category).toBe('critical');
    expect(violation?.severity).toBe(9);
    expect(violation?.message).toContain('Rule violation');
    
    // Check the second observation (enforcement)
    const enforcement = observations?.find((o: any) => o.type === 'warning');
    expect(enforcement).toBeDefined();
    expect(enforcement?.category).toBe('enforcement');
    expect(enforcement?.severity).toBe(8);
    expect(enforcement?.message).toContain('Rule enforcement');
    
    // Verify VigilObserver was instantiated
    expect(VigilObserver).toHaveBeenCalled();
  });
});
