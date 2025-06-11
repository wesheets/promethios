/**
 * VigilObserver Extension Integration
 * 
 * This file registers the VigilObserver with the ExtensionRegistry system,
 * providing a standardized way to access VigilObserver functionality.
 */

import { ExtensionRegistry } from './ExtensionRegistry';
import { VigilObserver } from '../../observers/vigil';

// Define the interface for the VigilObserver extension point
export interface VigilObserverExtensionPoint {
  getObservations: (options: any) => Promise<any[]>;
  getMetrics: (category?: string) => any;
  getViolations: (ruleId?: string, severity?: string) => any[];
  getEnforcements: (action?: string, ruleId?: string) => any[];
  analyzeComplianceStatus: (options?: any) => any;
}

// Extension version
export const EXTENSION_VERSION = '1.0.0';

/**
 * Register VigilObserver with the ExtensionRegistry
 */
export const registerVigilObserverExtension = () => {
  const extensionRegistry = ExtensionRegistry.getInstance();
  
  // Register extension point
  const vigilObserverExtensionPoint = extensionRegistry.registerExtensionPoint<VigilObserverExtensionPoint>(
    'vigilObserver',
    EXTENSION_VERSION
  );
  
  // Create implementation
  const vigilObserverImplementation: VigilObserverExtensionPoint = {
    getObservations: async (options) => {
      // Convert options to appropriate format
      const startDate = options?.startDate ? new Date(options.startDate) : undefined;
      const endDate = options?.endDate ? new Date(options.endDate) : undefined;
      const limit = options?.limit || 100;
      
      // Create a new VigilObserver instance
      const vigilObserver = new VigilObserver();
      
      // Get violations and enforcements - provide empty strings for required arguments
      const violations = vigilObserver.getViolations('', '');
      const enforcements = vigilObserver.getEnforcements('', '');
      
      // Convert to observations format
      const observations = [
        ...violations.map(v => ({
          id: `violation-${v.ruleId}-${v.timestamp}`,
          timestamp: new Date(v.timestamp),
          agentId: v.agentId,
          userId: v.userId,
          systemId: v.systemId,
          type: 'violation',
          category: v.severity || 'unknown',
          message: `Rule violation: ${v.ruleId}`,
          details: v,
          severity: v.severity === 'critical' ? 9 : 
                   v.severity === 'high' ? 7 :
                   v.severity === 'medium' ? 5 : 3
        })),
        ...enforcements.map(e => ({
          id: `enforcement-${e.ruleId}-${e.timestamp}`,
          timestamp: new Date(e.timestamp),
          agentId: e.agentId,
          userId: e.userId,
          systemId: e.systemId,
          type: 'warning',
          category: 'enforcement',
          message: `Rule enforcement: ${e.ruleId} (${e.action})`,
          details: e,
          severity: e.action === 'blocked' ? 8 : 6
        }))
      ];
      
      // Filter by date if provided
      let filteredObservations = observations;
      if (startDate) {
        filteredObservations = filteredObservations.filter(o => o.timestamp >= startDate);
      }
      if (endDate) {
        filteredObservations = filteredObservations.filter(o => o.timestamp <= endDate);
      }
      
      // Sort by timestamp (newest first)
      filteredObservations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Apply limit
      return filteredObservations.slice(0, limit);
    },
    
    getMetrics: (category) => {
      const vigilObserver = new VigilObserver();
      // Provide empty string if category is undefined
      return vigilObserver.getMetrics(category || '');
    },
    
    getViolations: (ruleId, severity) => {
      const vigilObserver = new VigilObserver();
      // Provide empty strings if parameters are undefined
      return vigilObserver.getViolations(ruleId || '', severity || '');
    },
    
    getEnforcements: (action, ruleId) => {
      const vigilObserver = new VigilObserver();
      // Provide empty strings if parameters are undefined
      return vigilObserver.getEnforcements(action || '', ruleId || '');
    },
    
    analyzeComplianceStatus: (options) => {
      const vigilObserver = new VigilObserver();
      return vigilObserver.analyzeComplianceStatus(options || {});
    }
  };
  
  // Register implementation
  vigilObserverExtensionPoint.register(
    vigilObserverImplementation,
    'default',
    {
      name: 'Default VigilObserver Implementation',
      version: EXTENSION_VERSION,
      description: 'Default implementation of VigilObserver extension point'
    }
  );
  
  // Set as default implementation
  vigilObserverExtensionPoint.setDefault('default');
  
  return vigilObserverExtensionPoint;
};

// Export a function to get the extension point
export const getVigilObserverExtensionPoint = () => {
  const extensionRegistry = ExtensionRegistry.getInstance();
  return extensionRegistry.getExtensionPoint<VigilObserverExtensionPoint>('vigilObserver', EXTENSION_VERSION);
};

// Auto-register on import
registerVigilObserverExtension();

export default {
  registerVigilObserverExtension,
  getVigilObserverExtensionPoint,
  EXTENSION_VERSION
};
