/**
 * Enhanced Multi-Agent Wrapping Hook with Unified Storage and Governance Integration
 * Replaces the old useMultiAgentSystemsUnified hook with enhanced services
 */

import { useState, useEffect, useCallback } from 'react';
import { enhancedMultiAgentSystemIdentityRegistry } from '../../agent-identity/services/EnhancedMultiAgentSystemIdentityRegistry';
import { enhancedMultiAgentSystemScorecardService } from '../../agent-identity/services/EnhancedMultiAgentSystemScorecardService';
import { enhancedAgentIdentityRegistry } from '../../agent-identity/services/EnhancedAgentIdentityRegistry';
import { 
  ExtendedMultiAgentSystemIdentity,
  ExtendedMultiAgentWizardFormData,
  SystemDiscoveryData 
} from '../../agent-identity/types/extendedMultiAgent';
import { 
  MultiAgentSystemIdentity,
  SystemWorkflow,
  WorkflowStep,
  DataFlowMapping,
  ErrorHandlingStrategy 
} from '../../agent-identity/types/multiAgent';
import { useAuth } from '../../../context/AuthContext';

/**
 * Enhanced hook for managing multi-agent systems with governance integration
 */
export const useEnhancedMultiAgentSystems = () => {
  const [systems, setSystems] = useState<ExtendedMultiAgentSystemIdentity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [discovering, setDiscovering] = useState<boolean>(false);
  const { user } = useAuth();

  // Initialize services with user
  useEffect(() => {
    if (user?.uid) {
      enhancedMultiAgentSystemIdentityRegistry.setCurrentUser(user.uid);
      enhancedMultiAgentSystemScorecardService.setCurrentUser(user.uid);
      enhancedAgentIdentityRegistry.setCurrentUser(user.uid);
    }
  }, [user]);

  // Load systems on mount
  useEffect(() => {
    const loadSystems = async () => {
      try {
        setLoading(true);
        const allSystems = await enhancedMultiAgentSystemIdentityRegistry.getAllSystemIdentities();
        
        // Convert to extended format
        const extendedSystems: ExtendedMultiAgentSystemIdentity[] = allSystems.map(system => ({
          ...system,
          enabled: system.status === 'active',
          componentAgentGovernanceIds: system.agentIds, // These should already be governance IDs
          autoDiscoveryEnabled: false, // Default value
          totalExecutions: 0,
          systemPerformanceMetrics: {
            averageExecutionTime: 0,
            successRate: 100,
            errorRate: 0,
            totalExecutions: 0
          }
        }));
        
        setSystems(extendedSystems);
        setError(null);
      } catch (err) {
        console.error('Error loading enhanced multi-agent systems:', err);
        setError(err instanceof Error ? err : new Error('Failed to load systems'));
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      loadSystems();
    }
  }, [user]);

  /**
   * Discover system capabilities from component agents
   */
  const discoverSystemCapabilities = useCallback(async (
    componentAgentIds: string[]
  ): Promise<SystemDiscoveryData | null> => {
    try {
      setDiscovering(true);
      
      // Get component agent identities
      const componentAgents = [];
      for (const agentId of componentAgentIds) {
        const identity = await enhancedAgentIdentityRegistry.getAgentIdentity(agentId);
        if (identity) {
          componentAgents.push(identity);
        }
      }

      if (componentAgents.length === 0) {
        throw new Error('No valid component agents found');
      }

      // Analyze system capabilities based on component agents
      const systemCapabilities = {
        canProcessParallelWorkflows: componentAgents.length > 1,
        canHandleConditionalLogic: true, // Assume true for multi-agent systems
        canMaintainState: true,
        canRecoverFromFailures: componentAgents.length > 1, // Redundancy helps
        canScaleDynamically: componentAgents.length >= 3,
        canLearnFromExperience: false, // Would need specific analysis
        canOptimizePerformance: componentAgents.length > 1,
        canSelfMonitor: true
      };

      // Analyze component summary
      const agentTypes: Record<string, number> = {};
      const sharedCapabilities: string[] = [];
      const uniqueCapabilities: Record<string, string[]> = {};

      componentAgents.forEach(agent => {
        // Count agent types (simplified)
        const agentType = agent.assignedRoles?.[0] || 'general';
        agentTypes[agentType] = (agentTypes[agentType] || 0) + 1;
        
        // For now, use placeholder capabilities
        uniqueCapabilities[agent.id] = agent.assignedRoles || [];
      });

      // Architecture insights
      const architectureInsights = {
        communicationPatterns: ['direct', 'broadcast'],
        dataFlowComplexity: componentAgents.length <= 2 ? 'simple' as const : 
                           componentAgents.length <= 4 ? 'moderate' as const : 'complex' as const,
        coordinationOverhead: componentAgents.length <= 2 ? 'low' as const :
                             componentAgents.length <= 4 ? 'medium' as const : 'high' as const,
        scalabilityBottlenecks: componentAgents.length > 5 ? ['coordination', 'communication'] : [],
        performanceOptimizations: ['parallel-processing', 'load-balancing']
      };

      // Governance readiness
      const governanceReadiness = {
        auditability: 85,
        transparency: 80,
        controllability: 90,
        accountability: 85,
        explainability: 75
      };

      const discoveryData: SystemDiscoveryData = {
        discoveredAt: new Date(),
        discoveryMethod: 'component-aggregation',
        lastUpdated: new Date(),
        discoveryVersion: '1.0.0',
        systemCapabilities,
        componentSummary: {
          totalAgents: componentAgents.length,
          agentTypes,
          totalCapabilities: Object.values(uniqueCapabilities).flat().length,
          sharedCapabilities,
          uniqueCapabilities
        },
        architectureInsights,
        governanceReadiness,
        isValidated: true,
        validationErrors: []
      };

      return discoveryData;
    } catch (err) {
      console.error('Error discovering system capabilities:', err);
      throw err;
    } finally {
      setDiscovering(false);
    }
  }, []);

  /**
   * Create a new enhanced multi-agent system
   */
  const createEnhancedSystem = useCallback(async (
    formData: ExtendedMultiAgentWizardFormData
  ): Promise<{ success: boolean; systemGovernanceId?: string; systemId?: string }> => {
    try {
      setCreating(true);
      
      if (!user?.uid) {
        throw new Error('User must be authenticated');
      }

      // Create system identity
      const systemGovernanceId = await enhancedMultiAgentSystemIdentityRegistry.createMultiAgentSystemIdentity({
        name: formData.systemName,
        description: formData.description,
        version: formData.version,
        systemType: formData.systemType,
        componentAgentIds: formData.selectedAgents.map(a => a.governanceId),
        agentRoles: formData.selectedAgents.reduce((acc, agent) => {
          acc[agent.governanceId] = agent.role;
          return acc;
        }, {} as Record<string, string>),
        workflowDefinition: formData.workflowDefinition,
        tags: []
      });

      // Get the created system identity
      const systemIdentity = await enhancedMultiAgentSystemIdentityRegistry.getSystemIdentity(systemGovernanceId);
      
      if (systemIdentity) {
        // Generate initial system scorecard
        await enhancedMultiAgentSystemScorecardService.generateSystemScorecard(
          systemGovernanceId,
          systemIdentity
        );
      }

      // Reload systems
      const updatedSystems = await enhancedMultiAgentSystemIdentityRegistry.getAllSystemIdentities();
      const extendedSystems: ExtendedMultiAgentSystemIdentity[] = updatedSystems.map(system => ({
        ...system,
        enabled: system.status === 'active',
        componentAgentGovernanceIds: system.agentIds,
        autoDiscoveryEnabled: formData.enableAutoDiscovery,
        totalExecutions: 0,
        systemPerformanceMetrics: {
          averageExecutionTime: 0,
          successRate: 100,
          errorRate: 0,
          totalExecutions: 0
        }
      }));
      setSystems(extendedSystems);

      console.log(`Successfully created multi-agent system ${systemGovernanceId}`);
      return { success: true, systemGovernanceId, systemId: systemGovernanceId };
    } catch (err) {
      console.error('Error creating enhanced multi-agent system:', err);
      setError(err instanceof Error ? err : new Error('Failed to create system'));
      return { success: false };
    } finally {
      setCreating(false);
    }
  }, [user]);

  /**
   * Update an existing system
   */
  const updateSystem = useCallback(async (
    systemGovernanceId: string,
    updates: Partial<ExtendedMultiAgentSystemIdentity>
  ): Promise<boolean> => {
    try {
      const success = await enhancedMultiAgentSystemIdentityRegistry.updateSystemIdentity(
        systemGovernanceId,
        updates
      );
      
      if (success) {
        // Reload systems
        const updatedSystems = await enhancedMultiAgentSystemIdentityRegistry.getAllSystemIdentities();
        const extendedSystems: ExtendedMultiAgentSystemIdentity[] = updatedSystems.map(system => ({
          ...system,
          enabled: system.status === 'active',
          componentAgentGovernanceIds: system.agentIds,
          autoDiscoveryEnabled: false,
          totalExecutions: 0,
          systemPerformanceMetrics: {
            averageExecutionTime: 0,
            successRate: 100,
            errorRate: 0,
            totalExecutions: 0
          }
        }));
        setSystems(extendedSystems);
      }
      
      return success;
    } catch (err) {
      console.error('Error updating system:', err);
      setError(err instanceof Error ? err : new Error('Failed to update system'));
      return false;
    }
  }, []);

  /**
   * Delete a system and its governance identity
   */
  const deleteSystem = useCallback(async (systemGovernanceId: string): Promise<boolean> => {
    try {
      const success = await enhancedMultiAgentSystemIdentityRegistry.deleteSystemIdentity(systemGovernanceId);
      
      if (success) {
        // Reload systems
        const updatedSystems = await enhancedMultiAgentSystemIdentityRegistry.getAllSystemIdentities();
        const extendedSystems: ExtendedMultiAgentSystemIdentity[] = updatedSystems.map(system => ({
          ...system,
          enabled: system.status === 'active',
          componentAgentGovernanceIds: system.agentIds,
          autoDiscoveryEnabled: false,
          totalExecutions: 0,
          systemPerformanceMetrics: {
            averageExecutionTime: 0,
            successRate: 100,
            errorRate: 0,
            totalExecutions: 0
          }
        }));
        setSystems(extendedSystems);
      }
      
      return success;
    } catch (err) {
      console.error('Error deleting system:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete system'));
      return false;
    }
  }, []);

  /**
   * Get system by ID
   */
  const getSystem = useCallback((systemGovernanceId: string): ExtendedMultiAgentSystemIdentity | undefined => {
    return systems.find(s => s.id === systemGovernanceId);
  }, [systems]);

  /**
   * Get system governance identity number for display
   */
  const getSystemGovernanceIdentityNumber = useCallback(async (systemGovernanceId: string): Promise<string | null> => {
    try {
      return await enhancedMultiAgentSystemIdentityRegistry.getSystemGovernanceIdentityNumber(systemGovernanceId);
    } catch (err) {
      console.error('Error getting system governance identity number:', err);
      return null;
    }
  }, []);

  /**
   * Get systems that contain a specific agent
   */
  const getSystemsContainingAgent = useCallback(async (agentGovernanceId: string): Promise<ExtendedMultiAgentSystemIdentity[]> => {
    try {
      const containingSystems = await enhancedMultiAgentSystemIdentityRegistry.getSystemsContainingAgent(agentGovernanceId);
      return containingSystems.map(system => ({
        ...system,
        enabled: system.status === 'active',
        componentAgentGovernanceIds: system.agentIds,
        autoDiscoveryEnabled: false,
        totalExecutions: 0,
        systemPerformanceMetrics: {
          averageExecutionTime: 0,
          successRate: 100,
          errorRate: 0,
          totalExecutions: 0
        }
      }));
    } catch (err) {
      console.error('Error getting systems containing agent:', err);
      return [];
    }
  }, []);

  /**
   * Regenerate system scorecard
   */
  const regenerateSystemScorecard = useCallback(async (systemGovernanceId: string): Promise<boolean> => {
    try {
      const system = getSystem(systemGovernanceId);
      if (system) {
        await enhancedMultiAgentSystemScorecardService.generateSystemScorecard(
          systemGovernanceId,
          system
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error regenerating system scorecard:', err);
      return false;
    }
  }, [getSystem]);

  return {
    // Data
    systems,
    loading,
    error,
    creating,
    discovering,
    
    // Actions
    discoverSystemCapabilities,
    createEnhancedSystem,
    updateSystem,
    deleteSystem,
    getSystem,
    getSystemGovernanceIdentityNumber,
    getSystemsContainingAgent,
    regenerateSystemScorecard,
    
    // Utilities
    isReady: !loading && !error,
    hasSystems: systems.length > 0
  };
};

