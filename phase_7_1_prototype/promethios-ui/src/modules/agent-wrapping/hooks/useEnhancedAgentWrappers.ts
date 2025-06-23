/**
 * Enhanced Agent Wrapping Hook with Unified Storage and Auto-Discovery
 * Replaces the old useAgentWrappers hook with enhanced services
 */

import { useState, useEffect, useCallback } from 'react';
import { agentWrapperRegistry } from '../services/AgentWrapperRegistry';
import { agentDiscoveryService } from '../services/AgentDiscoveryService';
import { enhancedAgentIdentityRegistry } from '../../agent-identity/services/EnhancedAgentIdentityRegistry';
import { enhancedScorecardService } from '../../agent-identity/services/EnhancedScorecardService';
import { 
  ExtendedAgentWrapper, 
  ExtendedWizardFormData,
  AgentIntrospectionData 
} from '../types/introspection';
import { AgentWrapper } from '../types';
import { useAuth } from '../../../context/AuthContext';

/**
 * Enhanced hook for managing agent wrappers with governance integration
 */
export const useEnhancedAgentWrappers = () => {
  const [wrappers, setWrappers] = useState<ExtendedAgentWrapper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [discovering, setDiscovering] = useState<boolean>(false);
  const { user } = useAuth();

  // Initialize services with user
  useEffect(() => {
    if (user?.uid) {
      agentWrapperRegistry.setCurrentUser(user.uid);
      enhancedAgentIdentityRegistry.setCurrentUser(user.uid);
      enhancedScorecardService.setCurrentUser(user.uid);
    }
  }, [user]);

  // Load wrappers on mount
  useEffect(() => {
    const loadWrappers = async () => {
      try {
        setLoading(true);
        const allWrappers = await agentWrapperRegistry.loadUserWrappers();
        // Ensure we always have an array, even if the service returns null/undefined
        setWrappers(Array.isArray(allWrappers) ? allWrappers : []);
        setError(null);
      } catch (err) {
        console.error('Error loading enhanced wrappers:', err);
        setError(err instanceof Error ? err : new Error('Failed to load wrappers'));
        // Set empty array on error to prevent undefined access
        setWrappers([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      loadWrappers();
    } else {
      // If no user, set empty array and stop loading
      setWrappers([]);
      setLoading(false);
    }
  }, [user]);

  /**
   * Discover agent capabilities from API
   */
  const discoverAgentCapabilities = useCallback(async (
    apiKey: string,
    baseUrl: string,
    provider: string
  ): Promise<AgentIntrospectionData | null> => {
    try {
      setDiscovering(true);
      const introspectionData = await agentDiscoveryService.discoverAgent(apiKey, baseUrl, provider);
      return introspectionData;
    } catch (err) {
      console.error('Error discovering agent capabilities:', err);
      throw err;
    } finally {
      setDiscovering(false);
    }
  }, []);

  /**
   * Register a new enhanced wrapper with governance integration
   */
  const registerEnhancedWrapper = useCallback(async (
    formData: ExtendedWizardFormData
  ): Promise<{ success: boolean; governanceId?: string; wrapperId?: string }> => {
    try {
      if (!user?.uid) {
        throw new Error('User must be authenticated');
      }

      // Create extended agent wrapper
      const extendedWrapper: ExtendedAgentWrapper = {
        // Basic wrapper fields
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.agentName,
        description: formData.description,
        version: formData.version,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // API configuration
        apiConfiguration: {
          baseUrl: formData.baseUrl,
          apiKey: formData.apiKey,
          provider: formData.provider,
          model: formData.model,
          headers: formData.headers || {},
          timeout: formData.timeout || 30000
        },
        
        // Schema configuration
        inputSchema: formData.inputSchema,
        outputSchema: formData.outputSchema,
        
        // Governance configuration
        governanceConfig: formData.governanceConfig,
        
        // Enhanced fields
        introspectionData: formData.discoveredCapabilities,
        lastUsed: undefined,
        totalCalls: 0,
        averageResponseTime: 0,
        successRate: 100,
        tags: formData.tags || []
      };

      // Register the wrapper
      const wrapperId = await agentWrapperRegistry.registerWrapper(extendedWrapper);
      
      // Create governance identity
      const governanceId = await enhancedAgentIdentityRegistry.createIdentityForWrappedAgent(
        extendedWrapper,
        {
          tags: formData.tags,
          status: 'active'
        }
      );

      // Generate initial scorecard
      await enhancedScorecardService.generateScorecard(governanceId, extendedWrapper);

      // Reload wrappers
      const updatedWrappers = await agentWrapperRegistry.loadUserWrappers();
      setWrappers(updatedWrappers);

      console.log(`Successfully registered agent ${wrapperId} with governance ID ${governanceId}`);
      return { success: true, governanceId, wrapperId };
    } catch (err) {
      console.error('Error registering enhanced wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to register wrapper'));
      return { success: false };
    }
  }, [user]);

  /**
   * Update an existing wrapper
   */
  const updateWrapper = useCallback(async (
    wrapperId: string,
    updates: Partial<ExtendedAgentWrapper>
  ): Promise<boolean> => {
    try {
      const success = await agentWrapperRegistry.updateWrapper(wrapperId, updates);
      if (success) {
        // Reload wrappers
        const updatedWrappers = await agentWrapperRegistry.loadUserWrappers();
        setWrappers(updatedWrappers);

        // Update governance identity if needed
        const wrapper = updatedWrappers.find(w => w.id === wrapperId);
        if (wrapper) {
          const governanceId = await enhancedAgentIdentityRegistry.getIdentityForWrappedAgent(wrapperId);
          if (governanceId) {
            await enhancedAgentIdentityRegistry.updateAgentIdentity(governanceId.id, {
              name: wrapper.name,
              description: wrapper.description,
              version: wrapper.version,
              status: wrapper.enabled ? 'active' : 'inactive',
              lastModifiedDate: new Date()
            });
          }
        }
      }
      return success;
    } catch (err) {
      console.error('Error updating wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to update wrapper'));
      return false;
    }
  }, []);

  /**
   * Delete a wrapper and its governance identity
   */
  const deleteWrapper = useCallback(async (wrapperId: string): Promise<boolean> => {
    try {
      // Get governance identity before deletion
      const governanceIdentity = await enhancedAgentIdentityRegistry.getIdentityForWrappedAgent(wrapperId);
      
      // Delete the wrapper
      const success = await agentWrapperRegistry.deleteWrapper(wrapperId);
      
      if (success && governanceIdentity) {
        // Delete governance identity
        await enhancedAgentIdentityRegistry.deleteAgentIdentity(governanceIdentity.id);
        
        // Reload wrappers
        const updatedWrappers = await agentWrapperRegistry.loadUserWrappers();
        setWrappers(updatedWrappers);
      }
      
      return success;
    } catch (err) {
      console.error('Error deleting wrapper:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete wrapper'));
      return false;
    }
  }, []);

  /**
   * Get wrapper by ID
   */
  const getWrapper = useCallback((wrapperId: string): ExtendedAgentWrapper | undefined => {
    return wrappers.find(w => w.id === wrapperId);
  }, [wrappers]);

  /**
   * Get governance identity for a wrapper
   */
  const getGovernanceIdentity = useCallback(async (wrapperId: string) => {
    return await enhancedAgentIdentityRegistry.getIdentityForWrappedAgent(wrapperId);
  }, []);

  /**
   * Get governance identity number for display
   */
  const getGovernanceIdentityNumber = useCallback(async (wrapperId: string): Promise<string | null> => {
    try {
      const identity = await enhancedAgentIdentityRegistry.getIdentityForWrappedAgent(wrapperId);
      if (identity) {
        return await enhancedAgentIdentityRegistry.getGovernanceIdentityNumber(identity.id);
      }
      return null;
    } catch (err) {
      console.error('Error getting governance identity number:', err);
      return null;
    }
  }, []);

  /**
   * Regenerate scorecard for a wrapper
   */
  const regenerateScorecard = useCallback(async (wrapperId: string): Promise<boolean> => {
    try {
      const wrapper = getWrapper(wrapperId);
      const identity = await getGovernanceIdentity(wrapperId);
      
      if (wrapper && identity) {
        await enhancedScorecardService.generateScorecard(identity.id, wrapper);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error regenerating scorecard:', err);
      return false;
    }
  }, [getWrapper, getGovernanceIdentity]);

  /**
   * Refresh agent discovery data
   */
  const refreshDiscoveryData = useCallback(async (wrapperId: string): Promise<boolean> => {
    try {
      const wrapper = getWrapper(wrapperId);
      if (!wrapper) return false;

      const introspectionData = await agentDiscoveryService.discoverAgent(
        wrapper.apiConfiguration.apiKey,
        wrapper.apiConfiguration.baseUrl,
        wrapper.apiConfiguration.provider
      );

      if (introspectionData) {
        return await updateWrapper(wrapperId, { introspectionData });
      }
      return false;
    } catch (err) {
      console.error('Error refreshing discovery data:', err);
      return false;
    }
  }, [getWrapper, updateWrapper]);

  return {
    // Data
    wrappers,
    loading,
    error,
    discovering,
    
    // Actions
    discoverAgentCapabilities,
    registerEnhancedWrapper,
    updateWrapper,
    deleteWrapper,
    getWrapper,
    getGovernanceIdentity,
    getGovernanceIdentityNumber,
    regenerateScorecard,
    refreshDiscoveryData,
    
    // Utilities
    isReady: !loading && !error,
    hasWrappers: wrappers.length > 0
  };
};

