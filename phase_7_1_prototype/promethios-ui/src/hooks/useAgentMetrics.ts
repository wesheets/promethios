/**
 * React Hook for Agent Metrics Integration
 * 
 * Provides real-time agent metrics collection and management for chat interfaces
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { metricsCollectionExtension, AgentMetricsProfile, AgentInteractionEvent } from '../extensions/MetricsCollectionExtension';
import { useAuth } from '../context/AuthContext';
import { realGovernanceIntegration } from '../services/RealGovernanceIntegration';

export interface UseAgentMetricsOptions {
  agentId: string;
  agentName?: string;
  agentType?: 'single' | 'multi-agent-system';
  version?: 'test' | 'production';
  deploymentId?: string;
  autoInitialize?: boolean;
}

export interface AgentMetricsHook {
  // State
  profile: AgentMetricsProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeAgent: () => Promise<void>;
  recordInteraction: (event: Partial<AgentInteractionEvent>) => Promise<void>;
  refreshMetrics: () => Promise<void>;
  
  // Metrics shortcuts
  trustScore: number;
  complianceRate: number;
  responseTime: number;
  sessionIntegrity: number;
  totalInteractions: number;
  
  // Status
  isInitialized: boolean;
  lastUpdated: Date | null;
}

export const useAgentMetrics = (options: UseAgentMetricsOptions): AgentMetricsHook => {
  const { currentUser } = useAuth();
  const {
    agentId,
    agentName = 'Unknown Agent',
    agentType = 'single',
    version = 'test',
    deploymentId,
    autoInitialize = true
  } = options;

  // State
  const [profile, setProfile] = useState<AgentMetricsProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for tracking
  const interactionCountRef = useRef(0);
  const lastInteractionRef = useRef<Date | null>(null);

  // Initialize agent metrics profile
  const initializeAgent = useCallback(async () => {
    if (!currentUser?.uid || !agentId) {
      setError('User not authenticated or agent ID missing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🚀 Initializing agent metrics: ${agentId} (${version})`);
      
      // Check if profile already exists
      let existingProfile = await metricsCollectionExtension.getAgentMetricsProfile(agentId, version);
      
      if (!existingProfile) {
        // Create new profile based on version
        if (version === 'test') {
          existingProfile = await metricsCollectionExtension.createTestAgentProfile(
            agentId,
            agentName,
            currentUser.uid,
            agentType
          );
        } else {
          // For production agents, they should be created through promotion
          // But we can create a basic profile if needed
          console.warn(`⚠️ Production agent ${agentId} not found, creating basic profile`);
          existingProfile = await metricsCollectionExtension.createTestAgentProfile(
            agentId,
            agentName,
            currentUser.uid,
            agentType
          );
        }
      }

      setProfile(existingProfile);
      setIsInitialized(true);
      console.log(`✅ Agent metrics initialized: ${agentId}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize agent metrics';
      console.error(`❌ Agent metrics initialization failed: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, agentName, agentType, version, currentUser?.uid]);

  // Record agent interaction
  const recordInteraction = useCallback(async (eventData: Partial<AgentInteractionEvent>) => {
    if (!profile || !currentUser?.uid) {
      console.warn('⚠️ Cannot record interaction: profile not initialized or user not authenticated');
      return;
    }

    try {
      const event: AgentInteractionEvent = {
        eventId: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        deploymentId,
        interactionType: eventData.interactionType || 'chat',
        timestamp: new Date(),
        responseTime: eventData.responseTime || 0,
        success: eventData.success !== false, // Default to true unless explicitly false
        errorMessage: eventData.errorMessage,
        governanceChecks: eventData.governanceChecks || {
          trustImpact: 0,
          complianceScore: 1.0,
          violations: []
        },
        userId: currentUser.uid,
        sessionId: eventData.sessionId,
        requestSize: eventData.requestSize,
        responseSize: eventData.responseSize,
        source: eventData.source || 'chat-interface',
        metadata: eventData.metadata,
        ...eventData
      };

      console.log(`📊 Recording interaction for ${agentId}:`, event.interactionType);
      
      await metricsCollectionExtension.recordAgentInteraction(event);
      
      // Update real governance backend with interaction data
      try {
        await realGovernanceIntegration.updateAgentTelemetry(agentId, {
          responseQuality: eventData.governanceChecks?.complianceScore || 0.8,
          userSatisfaction: eventData.success ? 0.9 : 0.3,
          taskComplexity: eventData.responseSize ? Math.min(eventData.responseSize / 1000, 1) : 0.5,
          responseTime: eventData.responseTime || 0
        });
        console.log(`🧠 Updated governance telemetry for ${agentId}`);
      } catch (governanceError) {
        console.warn('Could not update governance telemetry:', governanceError);
      }
      
      // Update local counters
      interactionCountRef.current += 1;
      lastInteractionRef.current = new Date();
      
      // Refresh profile to get updated metrics
      await refreshMetrics();
      
    } catch (err) {
      console.error('❌ Failed to record agent interaction:', err);
    }
  }, [profile, agentId, deploymentId, currentUser?.uid]);

  // Refresh metrics from storage
  const refreshMetrics = useCallback(async () => {
    if (!agentId) return;

    try {
      // Get updated profile from existing metrics system
      const updatedProfile = await metricsCollectionExtension.getAgentMetricsProfile(agentId, version);
      
      // Enhance with real governance telemetry data
      try {
        const telemetryData = await realGovernanceIntegration.getAgentTelemetry(agentId);
        if (telemetryData && updatedProfile) {
          // Merge telemetry data with existing metrics
          updatedProfile.metrics.governanceMetrics = {
            ...updatedProfile.metrics.governanceMetrics,
            trustScore: telemetryData.trustScore,
            emotionalState: telemetryData.emotionalState,
            cognitiveMetrics: telemetryData.cognitiveMetrics,
            behavioralPatterns: telemetryData.behavioralPatterns,
            selfAwarenessLevel: telemetryData.selfAwarenessLevel,
            lastTelemetryUpdate: telemetryData.lastUpdated
          };
        }
      } catch (telemetryError) {
        console.warn('Could not fetch telemetry data, using existing metrics:', telemetryError);
      }
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        console.log(`🔄 Metrics refreshed for ${agentId} with governance data`);
      }
    } catch (err) {
      console.error('❌ Failed to refresh metrics:', err);
    }
  }, [agentId, version]);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && agentId && currentUser?.uid && !isInitialized) {
      initializeAgent();
    }
  }, [autoInitialize, agentId, currentUser?.uid, isInitialized, initializeAgent]);

  // Reinitialize when agent ID changes (for agent switching)
  useEffect(() => {
    if (agentId && currentUser?.uid && isInitialized) {
      console.log('🔄 Agent ID changed, reinitializing metrics:', agentId);
      setIsInitialized(false);
      setProfile(null);
      setError(null);
      initializeAgent();
    }
  }, [agentId, currentUser?.uid, initializeAgent]);

  // Periodic metrics refresh
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      refreshMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isInitialized, refreshMetrics]);

  // Computed metrics values
  const trustScore = profile?.metrics.governanceMetrics.trustScore || 0;
  const complianceRate = profile?.metrics.governanceMetrics.complianceRate || 0;
  const responseTime = profile?.metrics.performanceMetrics.averageResponseTime || 0;
  const sessionIntegrity = profile?.metrics.performanceMetrics.successRate || 0;
  const totalInteractions = profile?.metrics.governanceMetrics.totalInteractions || 0;
  const lastUpdated = profile?.lastUpdated || null;

  return {
    // State
    profile,
    isLoading,
    error,
    
    // Actions
    initializeAgent,
    recordInteraction,
    refreshMetrics,
    
    // Metrics shortcuts
    trustScore,
    complianceRate,
    responseTime,
    sessionIntegrity,
    totalInteractions,
    
    // Status
    isInitialized,
    lastUpdated
  };
};

export default useAgentMetrics;

