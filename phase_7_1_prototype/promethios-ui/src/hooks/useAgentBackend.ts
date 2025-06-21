/**
 * useAgentBackend Hook
 * 
 * React hook for managing agent data with the real backend API.
 * Provides CRUD operations and real-time data management.
 */

import { useState, useEffect, useCallback } from 'react';
import { agentBackendService, BackendAgentProfile, BackendAgentScorecard, AgentRegistrationRequest } from '../services/agentBackendService';

export interface AgentData {
  id: string;
  name: string;
  description: string;
  version: string;
  status: string;
  healthStatus: string;
  trustScore: number;
  governanceIdentity: {
    type: string;
    constitutionHash: string;
    complianceLevel: string;
    verificationEndpoint: string;
  };
  createdAt: string;
  lastUpdated: string;
  ownerId: string;
}

export interface AgentScorecardData {
  agentId: string;
  scorecardId: string;
  timestamp: string;
  trustScore: number;
  healthStatus: string;
  deploymentStatus: string;
  governanceIdentity: {
    type: string;
    constitutionHash: string;
    complianceLevel: string;
    verificationEndpoint: string;
  };
  performanceMetrics: {
    taskCompletionRate: number;
    averageResponseTime: number;
    resourceEfficiency: number;
    uptime: number;
  };
  complianceMetrics: {
    reflectionCompliance: number;
    beliefTraceIntegrity: number;
    violationCount: number;
  };
  warningState: {
    has_warning: boolean;
    warning_level: string;
    warning_message: string;
  };
}

export interface UseAgentBackendReturn {
  // Data
  agents: AgentData[];
  scorecards: Map<string, AgentScorecardData>;
  
  // Loading states
  loading: boolean;
  loadingScorecard: boolean;
  
  // Error states
  error: string | null;
  
  // Operations
  registerAgent: (request: AgentRegistrationRequest) => Promise<string>;
  getAgentProfile: (agentId: string) => Promise<AgentData | null>;
  getAgentScorecard: (agentId: string) => Promise<AgentScorecardData | null>;
  generateScorecard: (agentId: string, forceRecalculate?: boolean) => Promise<void>;
  refreshAgents: () => Promise<void>;
  checkBackendHealth: () => Promise<boolean>;
}

export const useAgentBackend = (ownerId?: string): UseAgentBackendReturn => {
  // State
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [scorecards, setScorecards] = useState<Map<string, AgentScorecardData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingScorecard, setLoadingScorecard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load agents from backend
  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const backendAgents = await agentBackendService.listAgents(ownerId);
      const transformedAgents = backendAgents.map(agent => 
        agentBackendService.transformAgentProfile(agent)
      );
      
      setAgents(transformedAgents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agents';
      setError(errorMessage);
      console.error('Error loading agents:', err);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  // Register a new agent
  const registerAgent = useCallback(async (request: AgentRegistrationRequest): Promise<string> => {
    try {
      setError(null);
      const response = await agentBackendService.registerAgent(request);
      
      // Refresh agents list after registration
      await loadAgents();
      
      return response.agent_id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register agent';
      setError(errorMessage);
      throw err;
    }
  }, [loadAgents]);

  // Get agent profile
  const getAgentProfile = useCallback(async (agentId: string): Promise<AgentData | null> => {
    try {
      setError(null);
      const backendProfile = await agentBackendService.getAgentProfile(agentId);
      return agentBackendService.transformAgentProfile(backendProfile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get agent profile';
      setError(errorMessage);
      console.error('Error getting agent profile:', err);
      return null;
    }
  }, []);

  // Get agent scorecard
  const getAgentScorecard = useCallback(async (agentId: string): Promise<AgentScorecardData | null> => {
    try {
      setLoadingScorecard(true);
      setError(null);
      
      const backendScorecard = await agentBackendService.getAgentScorecard(agentId);
      const transformedScorecard = agentBackendService.transformAgentScorecard(backendScorecard);
      
      // Cache the scorecard
      setScorecards(prev => new Map(prev).set(agentId, transformedScorecard));
      
      return transformedScorecard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get agent scorecard';
      setError(errorMessage);
      console.error('Error getting agent scorecard:', err);
      return null;
    } finally {
      setLoadingScorecard(false);
    }
  }, []);

  // Generate new scorecard
  const generateScorecard = useCallback(async (agentId: string, forceRecalculate: boolean = false): Promise<void> => {
    try {
      setLoadingScorecard(true);
      setError(null);
      
      await agentBackendService.generateAgentScorecard(agentId, forceRecalculate);
      
      // Refresh the scorecard after generation
      await getAgentScorecard(agentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate scorecard';
      setError(errorMessage);
      throw err;
    } finally {
      setLoadingScorecard(false);
    }
  }, [getAgentScorecard]);

  // Refresh agents list
  const refreshAgents = useCallback(async (): Promise<void> => {
    await loadAgents();
  }, [loadAgents]);

  // Check backend health
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      await agentBackendService.checkHealth();
      return true;
    } catch (err) {
      console.error('Backend health check failed:', err);
      return false;
    }
  }, []);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  return {
    // Data
    agents,
    scorecards,
    
    // Loading states
    loading,
    loadingScorecard,
    
    // Error states
    error,
    
    // Operations
    registerAgent,
    getAgentProfile,
    getAgentScorecard,
    generateScorecard,
    refreshAgents,
    checkBackendHealth,
  };
};

