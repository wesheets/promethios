/**
 * React Hook for Multi-Agent Orchestration
 * 
 * Provides React integration for the Enhanced Veritas 2 multi-agent orchestration system,
 * managing collaboration sessions, real-time monitoring, and intelligent suggestions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UncertaintyAnalysis,
  VerificationContext,
  MultiAgentOrchestrationConfig,
  CollaborationSession,
  HITLSession
} from '../types';
import {
  EnhancedWrapperAgent,
  AgentConfigurationSuggestion,
  TeamSuggestion,
  CollaborationPatternSuggestion,
  AgentPerformanceAnalysis
} from '../multiAgent/enhancedAgentWrapper';
import { intelligentMultiAgentOrchestrator } from '../multiAgent/intelligentOrchestration';
import { enhancedAgentWrapperService } from '../multiAgent/enhancedAgentWrapper';

export interface UseMultiAgentOrchestrationOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTimeMonitoring?: boolean;
  enableIntelligentSuggestions?: boolean;
}

export interface MultiAgentOrchestrationState {
  // Agents
  agents: EnhancedWrapperAgent[];
  selectedAgents: string[];
  
  // Suggestions
  suggestions: AgentConfigurationSuggestion[];
  teamSuggestions: TeamSuggestion[];
  patternSuggestions: CollaborationPatternSuggestion[];
  
  // Active Sessions
  activeCollaboration: CollaborationSession | null;
  activeHITL: HITLSession | null;
  
  // Performance
  performanceAnalytics: Map<string, AgentPerformanceAnalysis>;
  
  // State
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface MultiAgentOrchestrationActions {
  // Agent Management
  addAgent: (agent: any) => Promise<EnhancedWrapperAgent>;
  removeAgent: (agentId: string) => void;
  selectAgent: (agentId: string, selected: boolean) => void;
  selectAllAgents: () => void;
  clearSelection: () => void;
  
  // Suggestions
  generateSuggestions: (context?: VerificationContext, uncertainty?: UncertaintyAnalysis) => Promise<void>;
  applySuggestion: (suggestion: AgentConfigurationSuggestion) => Promise<void>;
  dismissSuggestion: (suggestionId: string) => void;
  
  // Collaboration
  startCollaboration: (teamSuggestion: TeamSuggestion, prompt?: string) => Promise<string>;
  pauseCollaboration: (sessionId: string) => Promise<void>;
  resumeCollaboration: (sessionId: string) => Promise<void>;
  stopCollaboration: (sessionId: string) => Promise<void>;
  
  // HITL Integration
  integrateWithHITL: (hitlSession: HITLSession, uncertainty: UncertaintyAnalysis) => Promise<void>;
  
  // Performance
  analyzeAgentPerformance: (agentId: string, timeRange?: { start: Date; end: Date }) => Promise<AgentPerformanceAnalysis>;
  getCollaborationMetrics: (sessionId: string) => any;
  
  // Utility
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useMultiAgentOrchestration = (
  options: UseMultiAgentOrchestrationOptions = {}
): [MultiAgentOrchestrationState, MultiAgentOrchestrationActions] => {
  const {
    autoRefresh = false,
    refreshInterval = 5000,
    enableRealTimeMonitoring = true,
    enableIntelligentSuggestions = true
  } = options;

  // State
  const [state, setState] = useState<MultiAgentOrchestrationState>({
    agents: [],
    selectedAgents: [],
    suggestions: [],
    teamSuggestions: [],
    patternSuggestions: [],
    activeCollaboration: null,
    activeHITL: null,
    performanceAnalytics: new Map(),
    loading: false,
    error: null,
    lastUpdated: null
  });

  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval]);

  // Real-time monitoring effect
  useEffect(() => {
    if (enableRealTimeMonitoring && state.activeCollaboration) {
      monitoringIntervalRef.current = setInterval(() => {
        monitorActiveCollaboration();
      }, 2000); // Monitor every 2 seconds

      return () => {
        if (monitoringIntervalRef.current) {
          clearInterval(monitoringIntervalRef.current);
        }
      };
    }
  }, [enableRealTimeMonitoring, state.activeCollaboration]);

  // Agent Management Actions
  const addAgent = useCallback(async (agent: any): Promise<EnhancedWrapperAgent> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const enhancedAgent = await enhancedAgentWrapperService.enhanceAgent(agent);
      
      setState(prev => ({
        ...prev,
        agents: [...prev.agents, enhancedAgent],
        loading: false,
        lastUpdated: new Date()
      }));

      // Auto-generate suggestions if enabled
      if (enableIntelligentSuggestions) {
        setTimeout(() => generateSuggestions(), 500);
      }

      return enhancedAgent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to add agent'
      }));
      throw error;
    }
  }, [enableIntelligentSuggestions]);

  const removeAgent = useCallback((agentId: string) => {
    setState(prev => ({
      ...prev,
      agents: prev.agents.filter(agent => agent.id !== agentId),
      selectedAgents: prev.selectedAgents.filter(id => id !== agentId),
      lastUpdated: new Date()
    }));
  }, []);

  const selectAgent = useCallback((agentId: string, selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedAgents: selected
        ? [...prev.selectedAgents, agentId]
        : prev.selectedAgents.filter(id => id !== agentId)
    }));
  }, []);

  const selectAllAgents = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedAgents: prev.agents.map(agent => agent.id)
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedAgents: []
    }));
  }, []);

  // Suggestions Actions
  const generateSuggestions = useCallback(async (
    context?: VerificationContext,
    uncertainty?: UncertaintyAnalysis
  ) => {
    if (!enableIntelligentSuggestions || state.agents.length === 0) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Generate configuration suggestions
      const suggestions = await enhancedAgentWrapperService.generateConfigurationSuggestions(
        state.agents,
        context,
        uncertainty
      );

      let teamSuggestions: TeamSuggestion[] = [];
      let patternSuggestions: CollaborationPatternSuggestion[] = [];

      // Generate team and pattern suggestions if uncertainty is available
      if (uncertainty && context) {
        teamSuggestions = await enhancedAgentWrapperService.generateTeamSuggestions(
          state.agents,
          uncertainty,
          context
        );

        patternSuggestions = await enhancedAgentWrapperService.suggestCollaborationPatterns(
          state.agents,
          uncertainty,
          context
        );
      }

      setState(prev => ({
        ...prev,
        suggestions,
        teamSuggestions,
        patternSuggestions,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestions'
      }));
    }
  }, [enableIntelligentSuggestions, state.agents]);

  const applySuggestion = useCallback(async (suggestion: AgentConfigurationSuggestion) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Apply suggestion logic would go here
      // For now, we'll simulate the application
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove applied suggestion
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s !== suggestion),
        loading: false,
        lastUpdated: new Date()
      }));

      // Regenerate suggestions after application
      setTimeout(() => generateSuggestions(), 500);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to apply suggestion'
      }));
    }
  }, [generateSuggestions]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.title !== suggestionId)
    }));
  }, []);

  // Collaboration Actions
  const startCollaboration = useCallback(async (
    teamSuggestion: TeamSuggestion,
    prompt: string = 'Enhanced Veritas collaboration session'
  ): Promise<string> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Create mock uncertainty analysis if not provided
      const mockUncertainty: UncertaintyAnalysis = {
        overallUncertainty: 0.7,
        epistemicUncertainty: 0.6,
        aleatoricUncertainty: 0.5,
        confidenceUncertainty: 0.8,
        contextualUncertainty: 0.7,
        temporalUncertainty: 0.4,
        socialUncertainty: 0.6,
        uncertaintySources: [
          {
            id: 'source1',
            description: 'Complex technical requirements',
            category: 'technical',
            severity: 0.8,
            resolutionApproach: 'expert_consultation'
          }
        ],
        clarificationNeeds: [],
        recommendedActions: [],
        confidenceLevel: 0.3,
        qualityMetrics: {
          completeness: 0.7,
          consistency: 0.8,
          reliability: 0.75
        }
      };

      const mockContext: VerificationContext = {
        domain: 'technical',
        complexity: 'high',
        stakeholders: ['user'],
        constraints: [],
        requirements: []
      };

      // Create orchestration configuration
      const orchestrationConfig = await intelligentMultiAgentOrchestrator.analyzeAndOrchestrate(
        mockUncertainty,
        mockContext,
        teamSuggestion.agents
      );

      // Start collaboration session
      const session = await intelligentMultiAgentOrchestrator.startCollaborationSession(
        orchestrationConfig,
        prompt
      );

      setState(prev => ({
        ...prev,
        activeCollaboration: session,
        loading: false,
        lastUpdated: new Date()
      }));

      return session.id;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to start collaboration'
      }));
      throw error;
    }
  }, []);

  const pauseCollaboration = useCallback(async (sessionId: string) => {
    // Implementation for pausing collaboration
    console.log('Pausing collaboration:', sessionId);
  }, []);

  const resumeCollaboration = useCallback(async (sessionId: string) => {
    // Implementation for resuming collaboration
    console.log('Resuming collaboration:', sessionId);
  }, []);

  const stopCollaboration = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await intelligentMultiAgentOrchestrator.completeCollaborationSession(sessionId);
      
      setState(prev => ({
        ...prev,
        activeCollaboration: null,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to stop collaboration'
      }));
    }
  }, []);

  // HITL Integration
  const integrateWithHITL = useCallback(async (
    hitlSession: HITLSession,
    uncertainty: UncertaintyAnalysis
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const integration = await enhancedAgentWrapperService.integrateWithHITL(
        state.agents,
        hitlSession,
        uncertainty
      );

      setState(prev => ({
        ...prev,
        activeHITL: hitlSession,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to integrate with HITL'
      }));
    }
  }, [state.agents]);

  // Performance Analysis
  const analyzeAgentPerformance = useCallback(async (
    agentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<AgentPerformanceAnalysis> => {
    const analysis = await enhancedAgentWrapperService.analyzeAgentPerformance(agentId, timeRange);
    
    setState(prev => ({
      ...prev,
      performanceAnalytics: new Map(prev.performanceAnalytics.set(agentId, analysis)),
      lastUpdated: new Date()
    }));

    return analysis;
  }, []);

  const getCollaborationMetrics = useCallback((sessionId: string) => {
    return intelligentMultiAgentOrchestrator.getCollaborationMetrics(sessionId);
  }, []);

  // Utility Actions
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Refresh suggestions if enabled
      if (enableIntelligentSuggestions && state.agents.length > 0) {
        await generateSuggestions();
      }

      setState(prev => ({
        ...prev,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh'
      }));
    }
  }, [enableIntelligentSuggestions, state.agents, generateSuggestions]);

  const reset = useCallback(() => {
    setState({
      agents: [],
      selectedAgents: [],
      suggestions: [],
      teamSuggestions: [],
      patternSuggestions: [],
      activeCollaboration: null,
      activeHITL: null,
      performanceAnalytics: new Map(),
      loading: false,
      error: null,
      lastUpdated: null
    });
  }, []);

  // Real-time monitoring helper
  const monitorActiveCollaboration = useCallback(async () => {
    if (!state.activeCollaboration) return;

    try {
      const monitoring = await enhancedAgentWrapperService.monitorCollaboration(
        state.activeCollaboration.id,
        state.agents
      );

      // Update state with monitoring results
      setState(prev => ({
        ...prev,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }, [state.activeCollaboration, state.agents]);

  // Actions object
  const actions: MultiAgentOrchestrationActions = {
    addAgent,
    removeAgent,
    selectAgent,
    selectAllAgents,
    clearSelection,
    generateSuggestions,
    applySuggestion,
    dismissSuggestion,
    startCollaboration,
    pauseCollaboration,
    resumeCollaboration,
    stopCollaboration,
    integrateWithHITL,
    analyzeAgentPerformance,
    getCollaborationMetrics,
    refresh,
    reset
  };

  return [state, actions];
};

export default useMultiAgentOrchestration;

