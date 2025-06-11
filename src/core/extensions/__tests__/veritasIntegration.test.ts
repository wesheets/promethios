/**
 * Tests for Veritas Integration with VigilObserver
 * 
 * This file contains tests to validate the integration between Veritas and VigilObserver
 * through the ExtensionRegistry.
 */

import { ExtensionRegistry } from '../ExtensionRegistry';
import { registerVigilObserverExtension, getVigilObserverExtensionPoint } from '../vigilObserverExtension';
import { connectVeritasWithVigilObserver, initializeVeritasIntegration } from '../veritasIntegration';
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
        getViolations: jest.fn().mockReturnValue([]),
        getEnforcements: jest.fn().mockReturnValue([]),
        analyzeComplianceStatus: jest.fn().mockReturnValue({
          status: 'compliant',
          compliant: true,
          violationCount: 0,
          enforcementCount: 0,
          complianceScore: 100
        })
      };
    })
  };
});

// Mock ExtensionRegistry for Veritas
jest.mock('../ExtensionRegistry', () => {
  const originalModule = jest.requireActual('../ExtensionRegistry');
  
  // Create a mock implementation of getExtensionPoint for 'verification'
  const mockGetExtensionPoint = jest.fn().mockImplementation((name) => {
    if (name === 'verification') {
      return {
        getName: () => 'verification',
        getVersion: () => '1.0.0',
        getImplementation: () => ({
          verifyText: jest.fn(),
          compareVerification: jest.fn(),
          storeVerificationResult: jest.fn(),
          getVeritasObservations: jest.fn(),
          getVeritasMetrics: jest.fn()
        }),
        getImplementationMetadata: () => ({
          name: 'Default Veritas Implementation',
          version: '1.0.0',
          description: 'Default implementation of Veritas extension point'
        })
      };
    }
    
    // For other extension points, use the original implementation
    return originalModule.ExtensionRegistry.prototype.getExtensionPoint.call(
      { extensionPoints: new Map() },
      name
    );
  });
  
  return {
    ...originalModule,
    ExtensionRegistry: class MockExtensionRegistry extends originalModule.ExtensionRegistry {
      static instance = null;
      
      static getInstance() {
        if (!MockExtensionRegistry.instance) {
          MockExtensionRegistry.instance = new MockExtensionRegistry();
        }
        return MockExtensionRegistry.instance;
      }
      
      getExtensionPoint(name) {
        return mockGetExtensionPoint(name);
      }
      
      registerExtensionPoint(name, version) {
        return originalModule.ExtensionRegistry.prototype.registerExtensionPoint.call(
          this,
          name,
          version
        );
      }
    }
  };
});

describe('Veritas Integration with VigilObserver', () => {
  let extensionRegistry: ExtensionRegistry;
  
  beforeEach(() => {
    // Reset the ExtensionRegistry singleton for each test
    // @ts-ignore - accessing private property for testing
    ExtensionRegistry.instance = null;
    extensionRegistry = ExtensionRegistry.getInstance();
    
    // Register the VigilObserver extension
    registerVigilObserverExtension();
    
    // Mock document.addEventListener and document.dispatchEvent
    document.addEventListener = jest.fn();
    document.dispatchEvent = jest.fn();
  });
  
  test('should connect Veritas with VigilObserver', () => {
    // Connect Veritas with VigilObserver
    const connected = connectVeritasWithVigilObserver();
    
    // Verify the connection was successful
    expect(connected).toBe(true);
    
    // Verify event listener was added
    expect(document.addEventListener).toHaveBeenCalledWith(
      'veritas:verification-complete',
      expect.any(Function)
    );
  });
  
  test('should initialize Veritas integration', () => {
    // Initialize Veritas integration
    const result = initializeVeritasIntegration();
    
    // Verify the initialization was successful
    expect(result).toBeDefined();
    expect(result.connected).toBe(true);
    expect(result.timestamp).toBeDefined();
  });
  
  test('should handle verification complete event', () => {
    // Connect Veritas with VigilObserver
    connectVeritasWithVigilObserver();
    
    // Get the event listener function
    const eventListener = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'veritas:verification-complete'
    )[1];
    
    // Create a mock verification result with low trust claims
    const mockVerificationResult = {
      id: 'verification-123',
      claims: [
        {
          id: 'claim-1',
          text: 'This is a claim with low trust signals',
          trustSignals: {
            credibility: 0.2,
            transparency: 0.1
          }
        }
      ]
    };
    
    // Trigger the event listener
    eventListener({ detail: mockVerificationResult });
    
    // Verify a constitutional violation event was dispatched
    expect(document.dispatchEvent).toHaveBeenCalled();
    const dispatchedEvent = (document.dispatchEvent as jest.Mock).mock.calls[0][0];
    expect(dispatchedEvent.type).toBe('constitutional:violation');
    expect(dispatchedEvent.detail.ruleId).toBe('veritas:trust_threshold');
    expect(dispatchedEvent.detail.severity).toBe('medium');
    expect(dispatchedEvent.detail.context.claims).toEqual(mockVerificationResult.claims);
    expect(dispatchedEvent.detail.context.verificationId).toBe('verification-123');
  });
  
  test('should not dispatch event for high trust claims', () => {
    // Connect Veritas with VigilObserver
    connectVeritasWithVigilObserver();
    
    // Get the event listener function
    const eventListener = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'veritas:verification-complete'
    )[1];
    
    // Create a mock verification result with high trust claims
    const mockVerificationResult = {
      id: 'verification-123',
      claims: [
        {
          id: 'claim-1',
          text: 'This is a claim with high trust signals',
          trustSignals: {
            credibility: 0.8,
            transparency: 0.9
          }
        }
      ]
    };
    
    // Trigger the event listener
    eventListener({ detail: mockVerificationResult });
    
    // Verify no constitutional violation event was dispatched
    expect(document.dispatchEvent).not.toHaveBeenCalled();
  });
  
  test('should handle errors gracefully', () => {
    // Mock console.error
    console.error = jest.fn();
    
    // Connect Veritas with VigilObserver
    connectVeritasWithVigilObserver();
    
    // Get the event listener function
    const eventListener = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'veritas:verification-complete'
    )[1];
    
    // Create a mock verification result that will cause an error
    const mockVerificationResult = null;
    
    // Trigger the event listener
    eventListener({ detail: mockVerificationResult });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error in Veritas-VigilObserver integration:',
      expect.any(Error)
    );
  });
});
